/**
 * Direct integration with the PayPal Orders v2 REST API.
 * Replaces the deprecated `@paypal/checkout-server-sdk`.
 *
 * Server-only: imported exclusively from `"use server"` action files.
 */

const CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!;
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET!;

export function getPaypalBaseUrl(): string {
  return process.env.NODE_ENV === "development"
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";
}

let cachedToken: { value: string; expiresAt: number } | null = null;

export async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value;
  }

  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
  const res = await fetch(`${getPaypalBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PayPal OAuth failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  // Refresh a minute early to avoid using a token that is about to expire.
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return data.access_token;
}

export async function createPaypalOrder({
  value,
  currency = "USD",
  description,
  customId,
}: {
  value: string;
  currency?: string;
  description?: string;
  /**
   * Opaque metadata echoed back on the capture (and its webhook event) as
   * `custom_id`. Used to map an async webhook back to a product + user.
   */
  customId?: string;
}): Promise<string> {
  const token = await getAccessToken();
  const res = await fetch(`${getPaypalBaseUrl()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value,
          },
          description,
          custom_id: customId,
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PayPal create order failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as { id: string };
  return data.id;
}

export interface PaypalCaptureResult {
  id: string;
  status: string;
  purchase_units?: Array<{
    payments?: {
      captures?: Array<{
        status?: string;
        amount?: { currency_code?: string; value?: string };
      }>;
    };
  }>;
}

export async function capturePaypalOrder(orderId: string): Promise<PaypalCaptureResult> {
  const token = await getAccessToken();
  const res = await fetch(`${getPaypalBaseUrl()}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      // Idempotency key so retries don't double-capture.
      "PayPal-Request-Id": `capture-${orderId}`,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PayPal capture order failed (${res.status}): ${body}`);
  }

  return (await res.json()) as PaypalCaptureResult;
}

/**
 * Validate a capture against the price we expect to be paid, then return the
 * captured amount. Throws if the capture didn't complete, the currency differs,
 * or the amount doesn't match — so callers must run this *before* granting
 * access. Guards against a tampered/replayed `order_id` paying the wrong sum.
 */
export function assertCaptureMatches(
  capture: PaypalCaptureResult,
  expected: { value: string; currency?: string }
): { currency_code: string; value: string } {
  const currency = expected.currency ?? "USD";
  const captured = capture.purchase_units?.[0]?.payments?.captures?.[0];

  if (!captured?.amount?.value) {
    throw new Error("PayPal capture missing amount");
  }
  if (captured.status && captured.status !== "COMPLETED") {
    throw new Error(`PayPal capture not completed (status: ${captured.status})`);
  }
  if (captured.amount.currency_code !== currency) {
    throw new Error(
      `PayPal currency mismatch: expected ${currency}, got ${captured.amount.currency_code}`
    );
  }
  // Compare in integer cents to avoid floating-point drift.
  const expectedCents = Math.round(Number(expected.value) * 100);
  const paidCents = Math.round(Number(captured.amount.value) * 100);
  if (expectedCents !== paidCents) {
    throw new Error(
      `PayPal amount mismatch: expected ${expected.value} ${currency}, got ${captured.amount.value}`
    );
  }

  return { currency_code: currency, value: captured.amount.value };
}

/**
 * Verify a webhook notification really came from PayPal by calling the
 * verify-webhook-signature API with the transmission headers PayPal sent.
 * Requires the `PAYPAL_WEBHOOK_ID` of the webhook configured in the dashboard.
 */
export async function verifyWebhookSignature(
  headers: Headers,
  event: unknown
): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) {
    throw new Error("PAYPAL_WEBHOOK_ID is not set");
  }

  const token = await getAccessToken();
  const res = await fetch(
    `${getPaypalBaseUrl()}/v1/notifications/verify-webhook-signature`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        auth_algo: headers.get("paypal-auth-algo"),
        cert_url: headers.get("paypal-cert-url"),
        transmission_id: headers.get("paypal-transmission-id"),
        transmission_sig: headers.get("paypal-transmission-sig"),
        transmission_time: headers.get("paypal-transmission-time"),
        webhook_id: webhookId,
        webhook_event: event,
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PayPal webhook verify failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as { verification_status: string };
  return data.verification_status === "SUCCESS";
}
