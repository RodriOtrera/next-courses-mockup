import React from "react";
import MercadoPagoIcon from "./MercadoPagoIcon";
import {
  Atom,
  CreditCardIcon,
  Edit,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { SubscriptionItem } from "./subscription/SubscriptionCard";
import YouTubeDialog from "./YoutuDialog";
import { CoachingTypeSelect } from "@/lib/db/actions/get_coachings";
import Link from "next/link";

const GENERAL_PLANS = [
  {
    label: "1 MES",
    months: 1,
    mercadopagoUrl:
      "https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=2c93808494256ac70194385cbdaf0b4b",
    dolarappUrl: "https://wa.me/message/VXF6JNGEW5FNP1",
  },
  {
    label: "3 MESES",
    months: 3,
    mercadopagoUrl:
      "https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=2c93808494256ac70194385dab220b4c",
    dolarappUrl: "https://wa.me/message/VXF6JNGEW5FNP1",
  },
  {
    label: "6 MESES",
    months: 6,
    mercadopagoUrl:
      "https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=2c93808494256ac70194385dab220b4c",
    dolarappUrl: "https://wa.me/message/VXF6JNGEW5FNP1",
  },
];

interface CoachingGeneralProps {
  coaching: CoachingTypeSelect;
  admin?: boolean;
}

const CoachingGeneral: React.FC<CoachingGeneralProps> = ({
  coaching,
  admin = false,
}) => {
  return (
    <div className="flex flex-col justify-center items-center text-center gap-6 w-full">
      <div
        className="glow-effect"
        style={
          {
            "--glow-color": "#48cae4",
          } as React.CSSProperties
        }
      >
        <Atom size={50} color="#48cae4" className="icon-shadow" />
      </div>
      <h1 className="text-2xl md:text-3xl font-extrabold">
        {coaching.name.toUpperCase()}
      </h1>
      <p className="text-sm max-w-[450px] text-center text-neutral-200">
        {coaching.description}
      </p>
      <YouTubeDialog
        videoLink={coaching.video_link}
        text="Ver Masterclass Gratuita"
      />

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-[1200px]">
        {GENERAL_PLANS.map((plan, planIndex) => (
          <div
            key={plan.label}
            className="box general"
            style={{ animationDelay: `${0.3 + planIndex * 0.1}s` }}
          >
            <div className="content px-4 py-5 flex flex-col">
              {/* Plan label */}
              <p className="text-xs font-bold tracking-widest text-neutral-400 uppercase text-center mb-3">
                {plan.label}
              </p>

              {/* Price section */}
              <div className="flex items-baseline justify-center mb-1">
                <h1 className="font-extrabold text-5xl md:text-6xl tracking-normal">
                  ${coaching.price * plan.months}
                </h1>
              </div>
              <p className="text-xs text-neutral-500 text-center mb-3">
                ${coaching.price}/mes
              </p>

              {/* Divider */}
              <div className="border-t border-neutral-700/50 my-3" />

              {/* Features */}
              <div className="my-4 flex flex-col items-start text-start gap-1 flex-1">
                {coaching.items.map((e) => (
                  <SubscriptionItem
                    key={e.id}
                    color="bg-[#48cae4]"
                    title={e.text}
                  />
                ))}
              </div>

              {/* Divider */}
              <div className="border-t border-neutral-700/50 my-3" />

              {/* Payment buttons */}
              <div className="flex flex-col gap-2 mt-2">
                <a
                  className="px-4 flex text-center justify-center items-center py-3 text-xs md:text-sm w-full bg-neutral-700 hover:bg-neutral-600 rounded-lg font-semibold border border-neutral-600/50 transition-colors"
                  href={plan.mercadopagoUrl}
                >
                  <MercadoPagoIcon className="w-6 mr-2" /> MERCADOPAGO
                </a>
                <a
                  className="px-4 flex text-center justify-center items-center py-3 text-xs md:text-sm w-full bg-neutral-700 hover:bg-neutral-600 rounded-lg font-semibold border border-neutral-600/50 transition-colors"
                  href={plan.dolarappUrl}
                >
                  <Smartphone className="w-5 mr-2" />
                  DOLARAPP
                </a>
              </div>

              {/* Trust badges */}
              <div className="flex flex-col items-center mt-4 gap-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="text-neutral-400 h-4 w-4" />
                  <p className="text-neutral-400 text-xs">
                    Podes cancelar en cualquier momento
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCardIcon className="text-neutral-400 h-4 w-4" />
                  <p className="text-neutral-400 text-xs">
                    Compra atraves de mercadopago
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {admin && (
        <Link
          className="flex hover:bg-neutral-800 items-center rounded-lg mt-4 bg-neutral-900 py-2 px-4"
          href={`/coachingAdmin/${coaching.id}`}
        >
          <Edit className="mr-2" size={17} />
          <p className="font-semibold text-neutral-200">Editar</p>
        </Link>
      )}
    </div>
  );
};

export default CoachingGeneral;
