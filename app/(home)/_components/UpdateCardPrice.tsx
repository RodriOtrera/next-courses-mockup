"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateCard } from "@/lib/db/actions/update_card_price";
import { CardPrice } from "@/lib/db/schema/card_price";
import { Check, DollarSign, Loader2Icon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";

const UpdateCardPrice = ({ card_price }: { card_price: CardPrice }) => {
  const { execute, status } = useAction(updateCard, {
    onError: (err) => {
      console.log(err);
    },
    onSuccess: (data) => {
      setUpdated(true);
    },
    onExecute: () => {
      if (!updated) {
        setUpdated(false);
      }
    },
  });
  const [priceDollars, setpriceDollars] = useState(card_price.price_dollars);
  const [pricePesos, setpricePesos] = useState(card_price.price_pesos);
  const [updated, setUpdated] = useState(false);
  return (
    <div className="flex flex-col">
      <h1 className="font-bold text-2xl mb-4">Subscripcion Precios</h1>
      <label className=" font-semibold"> Precio en Dolares</label>
      <Input
        value={priceDollars}
        onChange={(e) => {
          setpriceDollars(+e.target.value);
        }}
        className="my-2"
        type="number"
        placeholder="Precio en dolares"
      />
      <label className="font-semibold"> Precio en Pesos</label>

      <Input
        value={pricePesos}
        onChange={(e) => {
          setpricePesos(+e.target.value);
        }}
        className="my-2"
        type="number"
        placeholder="Precio en pesos"
      />
      {updated && (
        <h1 className="text-sm flex text-green-400 items-center">
          <Check className="mr-1 w-4" />
          Precio actualizado!
        </h1>
      )}

      <div className="ml-auto">
        {status == "executing" ? (
          <Loader2Icon className=" animate-spin" />
        ) : (
          <Button
            onClick={() => {
              execute({ price_dollars: priceDollars, price_pesos: pricePesos });
            }}
            variant="secondary"
            className=""
          >
            <DollarSign className="mr-2  w-6 h-6" />
            Actualizar precio
          </Button>
        )}
      </div>
    </div>
  );
};

export default UpdateCardPrice;
