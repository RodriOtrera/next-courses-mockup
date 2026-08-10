"use client";

import { Button } from "@/components/ui/button";
import { type ProductType } from "@/lib/db/actions/create_preference";
import MercadoPagoIcon from "./MercadoPagoIcon";
import { authClient } from "@/lib/auth/client";
import { useEffect, useRef, useState } from "react";
import { capture, captureBeforeUnload } from "@/lib/analytics/client";

export const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "ARS",
});

interface BuyProductButtonProps {
  productId: string;
  productType: ProductType;
  price: number;
}

export default function BuyProductButton({
  productId,
  productType,
  price,
}: BuyProductButtonProps) {
  const { data: session } = authClient.useSession();
  const isSignedIn = !!session?.user;
  const [isLoading, setIsLoading] = useState(false);
  const blockedReported = useRef(false);

  // Someone reached a product page wanting to buy and hit a wall because they
  // aren't registered. That's a conversion blocker worth sizing, and it's
  // invisible today. Reported once per mount, not per render.
  useEffect(() => {
    if (session === undefined) return; // session still loading
    if (isSignedIn || blockedReported.current) return;
    blockedReported.current = true;
    capture("buy_blocked_not_signed_in", {
      product_type: productType,
      product_id: productId,
    });
  }, [session, isSignedIn, productType, productId]);

  const handleBuy = async () => {
    if (!isSignedIn) {
      // The button is disabled in this state, so this only fires if it's
      // triggered some other way — but the disabled state itself is tracked
      // where it renders, below.
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/mercadopago/create-preference", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          item_id: productId,
          item_type: productType,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create preference");
      }

      const data = await response.json();
      if (data.url) {
        // Last chance to observe this purchase attempt: MercadoPago takes the
        // buyer to its own domain, and if they abandon there we never hear
        // about it again. Sent via sendBeacon so it survives the navigation.
        captureBeforeUnload("checkout_started", {
          product_type: productType,
          product_id: productId,
          rail: "mercadopago",
          currency: "ARS",
          price,
        });
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error creating preference:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <div className="mt-8 flex flex-col items-center">
        <Button
          disabled={!isSignedIn || isLoading}
          className="text-xl md:text-2xl w-full max-w-[300px]"
          variant="outline"
          onClick={handleBuy}
        >
          <MercadoPagoIcon className="mr-2" />
          {isLoading ? "Cargando..." : formatter.format(price)}
        </Button>
        {!isSignedIn && (
          <h1 className="text-gray-500 mt-2 text-xs font-semibold w-44 text-end ">
            DEBES ESTAR REGISTRADO PARA HACER UNA COMPRA
          </h1>
        )}
      </div>
    </div>
  );
}
