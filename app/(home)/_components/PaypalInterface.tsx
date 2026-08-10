"use client";

import { useEffect, useRef, useState } from "react";
import { capture } from "@/lib/analytics/client";

export type ProductType = "ebook" | "program" | "course";

const SDK_SCRIPT_ID = "paypal-js-sdk";

/**
 * Loads the PayPal JS SDK once and resolves when `window.paypal` is ready.
 * Replaces the `@paypal/react-paypal-js` PayPalScriptProvider.
 */
function loadPaypalSdk(clientId: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.paypal) return Promise.resolve();

  const existing = document.getElementById(SDK_SCRIPT_ID) as HTMLScriptElement | null;
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load PayPal SDK"))
      );
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = SDK_SCRIPT_ID;
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(
      clientId
    )}&currency=USD&components=buttons`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load PayPal SDK"));
    document.body.appendChild(script);
  });
}

export default function PaypalInterface({
  action,
  onApproveAction,
  productId,
  productType,
}: {
  action: () => Promise<string>;
  onApproveAction: (productId: string, orderId: string) => void;
  productId: string;
  productType: ProductType;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  // Keep the latest callbacks in refs so the Buttons instance always calls
  // the current closures without needing to re-render the buttons.
  const actionRef = useRef(action);
  const onApproveRef = useRef(onApproveAction);
  actionRef.current = action;
  onApproveRef.current = onApproveAction;

  useEffect(() => {
    let cancelled = false;
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!;

    loadPaypalSdk(clientId)
      .then(() => {
        if (cancelled || !window.paypal || !containerRef.current) return;
        window.paypal
          .Buttons({
            fundingSource: window.paypal.FUNDING.PAYPAL,
            style: {
              tagline: false,
              height: 35,
              layout: "horizontal",
            },
            createOrder: async () => {
              capture("checkout_started", {
                product_type: productType,
                product_id: productId,
                rail: "paypal",
                currency: "USD",
              });
              const orderId = await actionRef.current();
              capture("paypal_order_created", {
                product_type: productType,
                product_id: productId,
                order_id: orderId,
              });
              return orderId;
            },
            onApprove: async (data) => {
              onApproveRef.current(productId, data.orderID);
            },
          })
          .render(containerRef.current);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e.message ?? "PayPal failed to load");
          // A blocked or failed SDK load makes the buy button simply not
          // appear — silent lost revenue unless it's recorded.
          capture("paypal_sdk_load_failed", {
            reason: e?.message ?? "unknown",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [productId, productType]);

  return (
    <div className="w-full max-w-[300px] mx-auto">
      {error ? (
        <p className="text-xs text-red-400 text-center">{error}</p>
      ) : (
        <div ref={containerRef} />
      )}
    </div>
  );
}
