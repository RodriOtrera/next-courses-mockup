import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import TrackProductView from "@/components/analytics/TrackProductView";
import { ProgramOutput } from "@/lib/db/actions/products_actions";
import Image from "next/image";
import React from "react";
import BuyProductButton from "../_components/BuyProductButton";
import PriceTag from "../_components/PriceTag";
import PaypalInterface from "../_components/PaypalInterface";
import {
  programPaypalAction,
  obtainProgramAction,
} from "@/lib/db/actions/programs/paypal_checkout";

const Program: React.FC<
  PartialBy<ProgramOutput, "img_url" | "price_usd"> & {
    pdf_url?: string | undefined;
    action: () => void;
  }
> = ({
  description,
  id,
  img_url,
  price,
  title,
  pdf_url,
  price_usd = 0,
  action,
}) => {
  return (
    <Dialog>
      <div className="group overflow-hidden rounded-xl border border-neutral-800 bg-[#141414] shadow-sm transition-all hover:shadow-md">
        <div className="relative aspect-video overflow-hidden">
          {img_url && (
            <Image
              src={img_url}
              alt={title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
          )}
          <PriceTag
            priceArs={price}
            priceUsd={price_usd}
            className="absolute right-2 top-2 rounded-lg bg-black/80 px-2 py-1 text-sm font-bold text-white"
          />
        </div>
        <div className="p-4">
          <h3 className="mb-2 line-clamp-2 font-semibold text-white transition-colors group-hover:text-red-500">
            {title}
          </h3>
          <p className="mb-3 line-clamp-2 text-sm text-gray-400">
            {description}
          </p>

          {pdf_url != undefined ? (
            <form action={action}>
              <Button variant="outline" size="sm">
                Descarga
              </Button>
            </form>
          ) : (
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="hover:bg-zinc-800">
                Ver mas
              </Button>
            </DialogTrigger>
          )}
        </div>
      </div>

      <DialogContent className="max-h-[90vh] max-w-[90vw] overflow-y-auto md:max-w-[1000px]">
        {/* Radix unmounts this while closed, so mounting here reports the
            product view on open rather than on every card in the grid. */}
        <TrackProductView
          productId={id}
          productType="program"
          productName={title}
          price={price ?? undefined}
          currency="ARS"
        />
        <div className="flex flex-col gap-6 p-2">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg">
            {img_url && (
              <Image src={img_url} alt={title} fill className="object-cover" />
            )}
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold tracking-wide text-white">
              {title}
            </h1>
            <p className="mt-4 text-sm text-gray-400">{description}</p>
          </div>

          <div className="flex w-full flex-col items-center">
            <BuyProductButton
              price={price}
              productId={id}
              productType="program"
            />

            {price_usd > 0 && (
              <>
                <div className="my-2 flex w-full items-center gap-2">
                  <div className="h-px flex-1 bg-white/20" />
                  <span className="text-xs text-white/50">o</span>
                  <div className="h-px flex-1 bg-white/20" />
                </div>
                <PaypalInterface
                  productId={id}
                  productType="program"
                  action={programPaypalAction.bind(null, id)}
                  onApproveAction={obtainProgramAction}
                />
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Program;
