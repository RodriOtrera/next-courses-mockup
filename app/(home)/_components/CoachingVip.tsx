import React from "react";
import MercadoPagoIcon from "./MercadoPagoIcon";
import {
  CreditCardIcon,
  Edit,
  Smartphone,
} from "lucide-react";
import { SubscriptionItem } from "./subscription/SubscriptionCard";
import YouTubeDialog from "./YoutuDialog";
import Link from "next/link";
import { CoachingTypeSelect } from "@/lib/db/actions/get_coachings";
import {
  SpartanHelmet,
  SpartanShield,
  CrossedSwords,
} from "@/components/spartan";

const VIP_PLANS = [
  {
    label: "1 MES",
    months: 1,
    mercadopagoUrl:
      "https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=2c93808494256ac70194386029930b4d",
    dolarappUrl: "https://wa.me/message/VXF6JNGEW5FNP1",
  },
  {
    label: "3 MESES",
    months: 3,
    mercadopagoUrl:
      "https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=2c93808493dee0d001943860b81e2bb9",
    dolarappUrl: "https://wa.me/message/VXF6JNGEW5FNP1",
  },
  {
    label: "6 MESES",
    months: 6,
    mercadopagoUrl:
      "https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=2c93808493dee0d001943860b81e2bb9",
    dolarappUrl: "https://wa.me/message/VXF6JNGEW5FNP1",
  },
];

interface CoachingVipProps {
  coaching: CoachingTypeSelect;
  admin?: boolean;
}

const CoachingVip: React.FC<CoachingVipProps> = ({
  coaching,
  admin = false,
}) => {
  return (
    <div className="flex flex-col justify-center items-center gap-6 w-full">
      {/* Floating helmet */}
      <div className="float fade-in-up">
        <SpartanHelmet size={110} />
      </div>

      {/* Title with gold shimmer */}
      <h1 className="gold-shimmer text-3xl md:text-4xl font-extrabold tracking-widest fade-in-up delay-100">
        {coaching.name.toUpperCase()}
      </h1>

      {/* Subtitle */}
      <p className="text-sm max-w-[700px] text-center text-neutral-300 leading-relaxed fade-in-up delay-200">
        {coaching.description}
      </p>

      {/* Masterclass button */}
      <div className="fade-in-up delay-300">
        <YouTubeDialog
          videoLink={coaching.video_link}
          text="Ver Masterclass Gratuita"
        />
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-[1200px]">
        {VIP_PLANS.map((plan, planIndex) => (
          <div
            key={plan.label}
            className="box vip fade-in-up"
            style={{ animationDelay: `${0.3 + planIndex * 0.1}s` }}
          >
            <div className="content px-5 py-5 flex flex-col">
              {/* Plan label */}
              <p className="text-xs font-bold tracking-widest text-neutral-400 uppercase text-center mb-3">
                {plan.label}
              </p>

              {/* Price section */}
              <div className="relative flex items-baseline justify-center mb-1">
                <CrossedSwords
                  size={120}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10 pointer-events-none"
                />
                <h1 className="font-extrabold text-5xl md:text-6xl tracking-tight price-glow bg-gradient-to-b from-[#ffe680] via-[#f5c542] to-[#b8780d] bg-clip-text text-transparent z-10">
                  ${coaching.price * plan.months}
                </h1>
              </div>
              <p className="text-xs text-neutral-500 text-center mb-3">
                ${coaching.price}/mes
              </p>

              {/* Divider */}
              <div className="border-t border-neutral-700/50 my-3" />

              {/* Features */}
              <div className="my-4 flex flex-col gap-1.5 items-start text-start flex-1">
                {coaching.items.map((e, i) => (
                  <div
                    key={e.id}
                    className="fade-in-up"
                    style={{ animationDelay: `${0.5 + i * 0.08}s` }}
                  >
                    <SubscriptionItem
                      color="bg-[#FFD700]"
                      title={e.text}
                      icon={<CrossedSwords size={20} />}
                    />
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div className="border-t border-neutral-700/50 my-3" />

              {/* Payment buttons */}
              <div className="flex flex-col gap-2 mt-2">
                <a
                  className="btn-vip px-4 flex text-center justify-center items-center py-3 text-xs md:text-sm w-full bg-neutral-800/90 hover:bg-neutral-700 rounded-lg font-semibold border border-neutral-700/50"
                  href={plan.mercadopagoUrl}
                >
                  <MercadoPagoIcon className="w-6 mr-2" /> MERCADOPAGO
                </a>
                <a
                  className="btn-vip px-4 flex text-center justify-center items-center py-3 text-xs md:text-sm w-full bg-gradient-to-r from-[#b8780d]/20 to-[#d4961e]/20 hover:from-[#b8780d]/30 hover:to-[#d4961e]/30 rounded-lg font-semibold border border-[#b8860b]/30"
                  href={plan.dolarappUrl}
                >
                  <Smartphone className="w-5 mr-2 text-[#e8b830]" />
                  <span className="gold-shimmer">DOLARAPP</span>
                </a>
              </div>

              {/* Trust badges */}
              <div className="flex flex-col items-center text-center mt-4 gap-2">
                <div className="flex items-center gap-2">
                  <SpartanShield size={16} />
                  <p className="text-neutral-500 text-xs">
                    Podes cancelar en cualquier momento
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCardIcon className="text-neutral-500 h-4 w-4 shrink-0" />
                  <p className="text-neutral-500 text-xs">
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
          className="flex hover:bg-neutral-800 items-center mt-4 rounded-lg bg-neutral-900 py-2 px-4 transition-colors"
          href={`/coachingAdmin/${coaching.id}`}
        >
          <Edit className="mr-2" size={17} />
          <p className="font-semibold text-neutral-200">Editar</p>
        </Link>
      )}
    </div>
  );
};

export default CoachingVip;
