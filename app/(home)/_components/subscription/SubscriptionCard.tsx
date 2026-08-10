import { Check, CreditCardIcon, ShieldCheck, XCircle } from "lucide-react";
import React from "react";
import MercadoPagoIcon from "../MercadoPagoIcon";
import { db } from "@/lib/db";
import { card_schema } from "@/lib/db/schema/card_price";
import { coachingItems } from "@/lib/db/schema/coaching_items";
import { cn } from "@/lib/utils";

const SubscriptionCard = async () => {
  const card = (await db.select().from(card_schema))[0]!;
  const items = await db.select().from(coachingItems);

  return (
    <div className="border-neutral-400 border px-6 pt-8 pb-4 mt-8 rounded-lg  md:ml-12 min-w-[300px] flex-col flex">
      <div className="flex ">
        <h1 className="font-extrabold text-6xl gradientTextAnimation">
          ${card.price_dollars}
        </h1>
        <p className="font-[700] tracking-wide text-sm text-neutral-600 ml-1">
          POR MES
        </p>
      </div>
      <div className="mt-4">
        {items.map((e) => (
          <SubscriptionItem color="bg-red-500" title={e.content} key={e.id} />
        ))}
        {/* <SubscriptionItem title="Mentorías en VIVO y grabadas sobre desarrollo personal " />
        <SubscriptionItem title="Curso de Marketing Digital y Creación de contenido para Marca Personal" />
        <SubscriptionItem title="Planificación Personalizada de Calistenia/Gym + Asesoramiento" />
        <SubscriptionItem title="Aprende a comer correctamente" />
        <SubscriptionItem title="Mentorías 5:30 AM (BURPEES y mentalidad)" /> */}
      </div>
      <p className="text-neutral-700 my-3">
        Precio en pesos: ${card.price_pesos}$
      </p>

      <a
        className="px-4 flex text-center justify-center items-center py-2 text-sm w-full my-2 bg-blue-700 hover:bg-blue-600 rounded-lg font-semibold mt-auto justify-self-end"
        href="https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=2c9380848df1fd37018df77f1e5f0625"
      >
        <MercadoPagoIcon className="w-6 mr-2" /> MERCADOPAGO (un mes)
      </a>
      <a
        className="px-4 flex text-center justify-center items-center py-2 text-sm w-full my-2 bg-blue-700 hover:bg-blue-600 rounded-lg font-semibold mt-auto justify-self-end"
        href="https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=2c93808493147926019322fdde3204be"
      >
        <MercadoPagoIcon className="w-6 mr-2" /> MERCADOPAGO (3 meses)
      </a>
      <a
        className="px-4 text-center py-2 w-full my-2 text-sm bg-green-700 hover:bg-green-600 rounded-lg font-semibold mt-auto justify-self-end"
        href="https://wa.me/message/VXF6JNGEW5FNP1"
      >
        DOLARAPP
      </a>

      <div className="flex flex-col items-center">
        <div className="flex mt-3">
          <ShieldCheck className="text-neutral-400 h-4 w-4" />
          <p className="text-neutral-400 text-xs ml-2">
            {" "}
            Podes cancelar en cualquier momento
          </p>
        </div>
        <div className="flex mt-1">
          <CreditCardIcon className="text-neutral-400 h-4 w-4" />
          <p className="text-neutral-400 text-xs ml-2">
            {" "}
            Compra atraves de mercadopago
          </p>
        </div>
      </div>
    </div>
  );
};

export const SubscriptionItem = ({
  title,
  color,
  icon,
}: {
  title: string;
  color: string;
  icon?: React.ReactNode;
}) => {
  return (
    <div className="flex text-sm items-start my-1 justify-start">
      {icon ? (
        <div className="mr-2 shrink-0">{icon}</div>
      ) : (
        <div className={cn(" p-1   rounded-md mr-2 ", color)}>
          <Check className=" h-3 w-3 text-black" />
        </div>
      )}

      <p className=" font-light flex-1">{title}</p>
    </div>
  );
};

export default SubscriptionCard;
