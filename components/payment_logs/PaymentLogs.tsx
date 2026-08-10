"use client";

import { useMemo } from "react";
import {
  createTestPaymentLog,
  PaymentLog,
} from "@/lib/db/actions/payment_logs_action";
import { Button } from "@/components/ui/button";
import PaymentLogContainer from "./PaymentLogContainer";
import { Plus } from "lucide-react";
import { parseAmount } from "@/lib/utils/parse_amount";

export default function PaymentLogs({
  paymentLogs,
}: {
  paymentLogs: PaymentLog[];
}) {
  const monthLogs = useMemo(() => {
    const firstOfMonth = new Date();
    firstOfMonth.setDate(1);
    firstOfMonth.setHours(0, 0, 0, 0);

    return paymentLogs.filter((log) => {
      if (!log.created_at) return false;
      return new Date(log.created_at) >= firstOfMonth;
    });
  }, [paymentLogs]);

  const { arsTotal, usdTotal } = useMemo(() => {
    let ars = 0;
    let usd = 0;
    for (const log of monthLogs) {
      const amt = parseAmount(log.paid_amount);
      if (log.currency === "USD") usd += amt;
      else ars += amt;
    }
    return { arsTotal: ars, usdTotal: usd };
  }, [monthLogs]);

  return (
    <div className="border border-neutral-800/50 rounded-xl p-5">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xs font-medium text-neutral-400">
            Pagos del Mes
          </h2>
          <p className="text-[10px] text-neutral-600 mt-0.5">
            {monthLogs.length} transacciones
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            {arsTotal > 0 && (
              <span className="text-sm font-semibold text-white tabular-nums block">
                ${Math.round(arsTotal).toLocaleString("es-AR")}
              </span>
            )}
            {usdTotal > 0 && (
              <span className="text-sm font-semibold text-white tabular-nums block">
                US${usdTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            )}
            {arsTotal === 0 && usdTotal === 0 && (
              <span className="text-sm font-semibold text-white tabular-nums">$0</span>
            )}
          </div>
        <form action={createTestPaymentLog}>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-[11px] text-neutral-500 hover:text-white"
          >
            <Plus className="h-3 w-3 mr-1" />
            Test
          </Button>
        </form>
        </div>
      </div>

      {monthLogs.length === 0 ? (
        <p className="text-xs text-neutral-600 py-8 text-center">
          Sin pagos este mes
        </p>
      ) : (
        <div className="max-h-[400px] overflow-y-auto">
          {monthLogs.map((log) => (
            <PaymentLogContainer key={log.id} paymentLog={log} />
          ))}
        </div>
      )}
    </div>
  );
}
