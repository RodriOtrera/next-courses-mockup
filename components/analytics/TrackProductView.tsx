"use client";

import { useEffect, useRef } from "react";
import { capture } from "@/lib/analytics/client";
import type { ProductType } from "@/lib/db/actions/create_preference";

/**
 * Fires `product_viewed` once per product.
 *
 * Product detail pages are server components, and a server-side capture would
 * only see logged-in visitors — anonymous browsing, which is most of the top of
 * the funnel, has no user id to attribute. Firing from the browser instead uses
 * PostHog's anonymous distinct ID, which later stitches to the account when the
 * visitor signs up.
 *
 * Renders nothing, so the client boundary stays confined to this component
 * rather than forcing the whole page to be client-rendered.
 */
export default function TrackProductView({
  productId,
  productType,
  productName,
  price,
  currency,
}: {
  productId: string;
  productType: ProductType;
  productName?: string;
  price?: number;
  currency?: string;
}) {
  // Keyed on the id rather than a bare boolean so a client-side navigation
  // between two products still reports the second one. Also stops React's
  // development StrictMode double-effect from double-counting.
  const reportedFor = useRef<string | null>(null);

  useEffect(() => {
    if (reportedFor.current === productId) return;
    reportedFor.current = productId;

    capture("product_viewed", {
      product_type: productType,
      product_id: productId,
      product_name: productName,
      price,
      currency,
    });
  }, [productId, productType, productName, price, currency]);

  return null;
}
