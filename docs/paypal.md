# PayPal integration

How checkout works with the **PayPal Orders v2 REST API**. There is no PayPal SDK in the
project — the server talks to the REST API over `fetch`, and the client loads PayPal's JS SDK
script directly to render the buttons.

## Pieces

| Layer | File | Responsibility |
| --- | --- | --- |
| REST helper | `lib/paypal/rest.ts` | OAuth token, create/capture order, webhook signature verify |
| Fulfillment | `lib/paypal/fulfillment.ts` | Idempotent grant/revoke of access + `custom_id` codec |
| Server actions | `lib/db/actions/{courses,programs,ebooks}/paypal_checkout.ts` | Look up product, create order, capture + verify, fulfill |
| Webhook | `app/api/webhook/paypal/route.ts` | Async fulfillment + refunds, signature-verified |
| Client buttons | `app/(home)/_components/PaypalInterface.tsx` | Load JS SDK, render `paypal.Buttons`, wire callbacks |
| Callers | `components/course/backgroundCourse.tsx`, `app/(home)/_components/CardUI.tsx` | Mount `<PaypalInterface>` with the right actions |

## Environment

```
NEXT_PUBLIC_PAYPAL_CLIENT_ID=...   # public, used on client and server
PAYPAL_CLIENT_SECRET=...           # server only
PAYPAL_WEBHOOK_ID=...              # id of the webhook configured in the PayPal dashboard
```

Sandbox vs. live is chosen by `NODE_ENV`: `development` → `https://api-m.sandbox.paypal.com`,
otherwise `https://api-m.paypal.com` (`getPaypalBaseUrl()` in `lib/paypal/rest.ts`).

## The flow

```
Buyer clicks PayPal button (client)
        │
        ▼
createOrder ──▶ server action *PaypalAction(id)
                  └─ createPaypalOrder() ──▶ POST /v2/checkout/orders ──▶ returns order id
        │
        ▼  (buyer approves in the PayPal popup)
onApprove({ orderID }) ──▶ server action obtain*Action(id, orderID)
                              ├─ capturePaypalOrder(orderID) ──▶ POST /v2/checkout/orders/{id}/capture
                              └─ write purchase + payment_log rows
```

1. **Create order** — the button's `createOrder` calls the server action, which checks the user
   is logged in, looks up the product price, and calls `createPaypalOrder({ value, description,
   customId })`. The `customId` packs `{ productType, productId, userId }` so an async webhook
   can later map the capture back to a buyer. PayPal returns an order id for the popup.
2. **Approve** — the buyer confirms in PayPal's popup; the SDK fires `onApprove` with the
   `orderID`.
3. **Capture** — `onApprove` calls the `obtain*Action` server action, which calls
   `capturePaypalOrder(orderId)` to move the money, verifies the captured amount with
   `assertCaptureMatches()`, then calls `fulfillPaypalPurchase()` to grant access + log.

This synchronous path depends on the buyer's browser completing the round-trip. The **webhook**
(below) is the authoritative safety net: it fulfills the same purchase even if the browser never
makes it back, and handles refunds. Both paths fulfill through the same idempotent helper keyed
on `paypal_<orderId>`, so they never double-grant.

## REST helper — `lib/paypal/rest.ts`

The only place that knows PayPal's HTTP shape. Server-only (imported exclusively from
`"use server"` files).

- **`getAccessToken()`** — `POST /v1/oauth2/token` with `Authorization: Basic base64(id:secret)`
  and body `grant_type=client_credentials`. The token is cached in a module-level variable and
  reused until 60s before `expires_in`, so back-to-back calls don't re-authenticate.
- **`createPaypalOrder({ value, currency = "USD", description })`** — `POST /v2/checkout/orders`
  with `intent: "CAPTURE"` and a single `purchase_units` entry. Returns the order `id`.
- **`capturePaypalOrder(orderId)`** — `POST /v2/checkout/orders/{id}/capture`. Sends a
  `PayPal-Request-Id` header for idempotency (a retry won't double-capture). Returns the parsed
  capture JSON; the captured amount is at
  `result.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value`.
- **`assertCaptureMatches(capture, { value, currency = "USD" })`** — validates a capture
  *before* access is granted: capture status is `COMPLETED`, currency matches, and the captured
  amount equals the expected price (compared in integer cents). Throws on any mismatch; returns
  the captured `{ currency_code, value }`. This is the guard against a tampered or replayed
  `order_id` paying the wrong amount.
- **`verifyWebhookSignature(headers, event)`** — `POST /v1/notifications/verify-webhook-signature`
  with the `PAYPAL-*` transmission headers + `PAYPAL_WEBHOOK_ID`. Returns `true` only when PayPal
  reports `verification_status: "SUCCESS"`. The webhook calls this before touching the DB.

Every call checks `res.ok` and throws with the PayPal error body on failure.

## Fulfillment — `lib/paypal/fulfillment.ts`

The single place that grants/revokes access, shared by the server actions and the webhook.

- **`encodePaypalCustomId({ productType, productId, userId })` / `decodePaypalCustomId(raw)`** —
  pack/unpack the order's `custom_id` (a small JSON blob). `decode` validates the shape and
  product type, returning `null` on anything unexpected.
- **`fulfillPaypalPurchase({ productType, productId, userId, orderId, paidAmount, currency })`** —
  grants access (per-type ownership row, plus `course_progress` for courses) and writes a
  `payment_log` row. **Idempotent**: it first checks for an existing `payment_log` row keyed
  `paypal_<orderId>` and returns `{ alreadyFulfilled: true }` if found, so the sync flow and the
  webhook can't double-grant. Ownership inserts also use `onConflictDoNothing()`.
- **`revokePaypalPurchase({ productType, productId, userId, refundId, ... })`** — deletes the
  ownership rows (and `course_progress` for courses) and logs a negative `payment_log` entry.
  Used by the refund/reversal webhook events.

## Server actions

Three near-identical files, one per product type. Shape (ebooks shown):

```ts
// lib/db/actions/ebooks/paypal_checkout.ts
"use server";
import { createPaypalOrder, capturePaypalOrder, assertCaptureMatches } from "../../../paypal/rest";
import { encodePaypalCustomId, fulfillPaypalPurchase } from "../../../paypal/fulfillment";

export async function ebookPaypalAction(ebook_id: string) {
  const user = await currentUser();              // better-auth session
  if (user == null) throw Error("User not logged in");
  const ebook = await db.query.ebook_schema.findFirst({ where: eq(ebook_schema.id, ebook_id) });
  if (!ebook) throw Error("Ebook not found");

  return await createPaypalOrder({
    value: ebook.price_usd.toString(),
    description: ebook.title,
    customId: encodePaypalCustomId({ productType: "ebook", productId: ebook_id, userId: user.id }),
  });
}

export async function obtainEbookAction(ebook_id: string, order_id: string) {
  const user = await currentUser();
  if (user == null) throw Error("User not logged in");
  const ebook = await db.query.ebook_schema.findFirst({ where: eq(ebook_schema.id, ebook_id) });
  if (!ebook) throw Error("Ebook not found");

  const captureResponse = await capturePaypalOrder(order_id);
  // Reject unless PayPal captured exactly the ebook price (status, currency, amount).
  const captured = assertCaptureMatches(captureResponse, { value: ebook.price_usd.toString() });

  await fulfillPaypalPurchase({
    productType: "ebook",
    productId: ebook_id,
    userId: user.id,
    orderId: order_id,
    paidAmount: captured.value,
    currency: captured.currency_code,
  });
}
```

All three actions get the current user from the **better-auth** session
(`auth.api.getSession`), not Clerk. The per-type fulfillment differences (course ownership +
`course_progress`, vs. `payments_on_users_*` rows) live inside `fulfillPaypalPurchase`; the
**courses** action additionally `redirect('/pago/completado')` after fulfilling.

## Webhook — `app/api/webhook/paypal/route.ts`

`POST` handler that PayPal calls for payment lifecycle events. It is the authoritative
fulfillment path and survives a buyer closing the tab before the sync capture finishes.

1. Parse the event and `verifyWebhookSignature(req.headers, event)` — a failed/invalid signature
   returns `401`/`500` before any DB access.
2. `decodePaypalCustomId(resource.custom_id)` → `{ productType, productId, userId }`.
3. Dispatch on `event_type`:
   - **`PAYMENT.CAPTURE.COMPLETED`** → `fulfillPaypalPurchase(...)` using the order id from
     `resource.supplementary_data.related_ids.order_id` (same idempotency key as the sync flow).
   - **`PAYMENT.CAPTURE.REFUNDED` / `.REVERSED`** → `revokePaypalPurchase(...)`.
   - anything else → acknowledged with `200` (no-op).
4. Processing errors return `500` so PayPal retries; retries are safe because fulfillment is
   idempotent.

**Setup:** create a webhook in the PayPal dashboard pointing at `/api/webhook/paypal`, subscribe
to the capture events above, and put its id in `PAYPAL_WEBHOOK_ID`. Configure separate
sandbox/live webhooks to match the `NODE_ENV`-selected base URL.

## Client — `app/(home)/_components/PaypalInterface.tsx`

A `"use client"` component that loads the PayPal JS SDK script once and renders the buttons.

```tsx
<PaypalInterface
  productId={id}
  action={ebookPaypalAction.bind(null, id)}   // createOrder → returns order id
  onApproveAction={obtainEbookAction}          // (productId, orderId) → capture + persist
/>
```

- On mount it injects `https://www.paypal.com/sdk/js?client-id=<id>&currency=USD&components=buttons`
  (guarded by a fixed script id so it loads only once), then calls
  `window.paypal.Buttons({ createOrder, onApprove }).render(container)`.
- `createOrder` → `action()`; `onApprove` → `onApproveAction(productId, data.orderID)`. The
  callbacks are held in refs so the rendered buttons always call the latest closures.
- `window.paypal` is typed in the root `paypal.d.ts`.

## Conventions / gotchas

- **The helper is the only PayPal HTTP code.** New product types call `createPaypalOrder` /
  `capturePaypalOrder` — don't hand-roll `fetch` to PayPal elsewhere.
- **Capture happens server-side**, never on the client. The client only hands back the
  `orderID`.
- **`price_usd` is the source of truth** for the charged amount; it is read from the DB inside
  the action, not passed from the client.
- **Amount is verified server-side.** `obtain*Action` calls `assertCaptureMatches()` after
  capture, so a tampered/replayed `order_id` that pays the wrong amount or currency is rejected
  before access is granted. Keep new product types on this same pattern: look up the product,
  capture, assert, *then* fulfill.
- **Fulfillment goes through one helper.** Both the sync action and the webhook call
  `fulfillPaypalPurchase`, idempotent on `paypal_<orderId>`. Don't write ownership/`payment_log`
  rows for PayPal anywhere else.
- **Webhooks are signature-verified.** Never act on a webhook body without
  `verifyWebhookSignature` returning `true`; the event maps to a buyer only via the `custom_id`
  metadata set at order creation.
- **Known gap — idempotency is a read-then-write check, not a DB constraint.** Two events
  racing in the same instant can both pass the `payment_log` existence check. `payment_log` has
  no unique index on `payment_id`, and `payments_on_users_*` use a `Date.now()` integer
  `payment_id`, so a tight race could double-log/double-grant for ebooks/programs. If this
  matters, add a unique index on `payment_log.payment_id` (or a dedicated processed-events
  table) and upsert against it.
```
