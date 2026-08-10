import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/paypal/rest";
import {
  decodePaypalCustomId,
  fulfillPaypalPurchase,
  revokePaypalPurchase,
} from "@/lib/paypal/fulfillment";
import { captureServer, SYSTEM_DISTINCT_ID } from "@/lib/analytics/server";

interface PaypalWebhookEvent {
  event_type?: string;
  resource?: {
    id?: string;
    custom_id?: string;
    amount?: { value?: string; currency_code?: string };
    supplementary_data?: { related_ids?: { order_id?: string } };
  };
}

async function handler(req: NextRequest) {
  const event = (await req.json()) as PaypalWebhookEvent;

  // Reject anything not genuinely signed by PayPal before touching the DB.
  let verified: boolean;
  try {
    verified = await verifyWebhookSignature(req.headers, event);
  } catch (err) {
    console.error("PayPal webhook verification error", err);
    return NextResponse.json({ message: "Verification error" }, { status: 500 });
  }
  if (!verified) {
    // Attributed to the system, not to the user named in the payload — that
    // claim is exactly what just failed verification.
    await captureServer("webhook_signature_invalid", SYSTEM_DISTINCT_ID, {
      rail: "paypal",
    });
    return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
  }

  const resource = event.resource;
  const meta = decodePaypalCustomId(resource?.custom_id);

  try {
    switch (event.event_type) {
      case "PAYMENT.CAPTURE.COMPLETED": {
        if (!meta) {
          // No metadata to map this capture to a buyer — acknowledge so PayPal
          // stops retrying, but there's nothing to fulfill.
          console.warn("PayPal capture without custom_id; skipping fulfillment");
          break;
        }
        const orderId =
          resource?.supplementary_data?.related_ids?.order_id ?? resource?.id;
        if (!orderId) {
          return NextResponse.json({ message: "Missing order id" }, { status: 400 });
        }
        const result = await fulfillPaypalPurchase({
          productType: meta.productType,
          productId: meta.productId,
          userId: meta.userId,
          orderId,
          paidAmount: resource?.amount?.value ?? "0",
          currency: resource?.amount?.currency_code ?? "USD",
        });
        console.log(
          `PayPal webhook fulfilled order ${orderId} (alreadyFulfilled=${result.alreadyFulfilled})`
        );
        break;
      }

      case "PAYMENT.CAPTURE.REFUNDED":
      case "PAYMENT.CAPTURE.REVERSED": {
        if (!meta) {
          console.warn("PayPal refund without custom_id; cannot revoke access");
          break;
        }
        await revokePaypalPurchase({
          productType: meta.productType,
          productId: meta.productId,
          userId: meta.userId,
          refundId: resource?.id ?? crypto.randomUUID(),
          refundedAmount: resource?.amount?.value,
          currency: resource?.amount?.currency_code ?? "USD",
        });
        console.log(`PayPal webhook revoked access for refund ${resource?.id}`);
        break;
      }

      default:
        // Acknowledge unhandled event types so PayPal doesn't retry them.
        break;
    }
  } catch (err) {
    console.error("PayPal webhook processing error", err);
    // 500 makes PayPal retry, which is safe because fulfillment is idempotent.
    return NextResponse.json({ message: "Processing error" }, { status: 500 });
  }

  return NextResponse.json({ message: "ok" }, { status: 200 });
}

export { handler as POST };
