import { PaymentLog } from "@/lib/db/actions/payment_logs_action";
import { parseAmount } from "@/lib/utils/parse_amount";

const sourceLabels: Record<string, { label: string; color: string }> = {
  mercadopago: { label: "MP", color: "bg-sky-500/15 text-sky-400" },
  paypal: { label: "PP", color: "bg-yellow-500/15 text-yellow-400" },
};

export default function PaymentLogContainer({
  paymentLog,
}: {
  paymentLog: PaymentLog;
}) {
  // created_at is a nullable timestamp column, so it arrives as Date | null.
  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-AR", {
      month: "short",
      day: "numeric",
    });
  };

  const source = sourceLabels[paymentLog.payment_source || ""] || {
    label: "—",
    color: "bg-neutral-700/30 text-neutral-500",
  };

  const currency = paymentLog.currency || "ARS";
  const amount = parseAmount(paymentLog.paid_amount);
  const formattedAmount =
    currency === "ARS"
      ? `$${Math.round(amount).toLocaleString("es-AR")}`
      : `US$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="flex items-center justify-between py-3 border-b border-neutral-800/30 last:border-0">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span
          className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${source.color} flex-shrink-0`}
        >
          {source.label}
        </span>
        <div className="min-w-0">
          <p className="text-[13px] text-neutral-200 truncate">
            {paymentLog.product_name || "—"}
          </p>
          <p className="text-[11px] text-neutral-600 truncate mt-0.5">
            {paymentLog.user?.email || "—"}
          </p>
        </div>
      </div>
      <div className="text-right ml-4 flex-shrink-0">
        <p className="text-[13px] font-medium text-white tabular-nums">
          {formattedAmount}
        </p>
        <p className="text-[10px] text-neutral-600 tabular-nums mt-0.5">
          {formatDate(paymentLog.created_at)}
        </p>
      </div>
    </div>
  );
}
