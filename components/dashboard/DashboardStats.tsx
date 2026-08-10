import { db } from "@/lib/db";
import { courses } from "@/lib/db/schema/course";
import { count } from "drizzle-orm";
import AnimatedCounter from "../ui/AnimatedCounter";
import { BookOpen, DollarSign, TrendingUp } from "lucide-react";
import { getPaymentLogs } from "@/lib/db/actions/payment_logs_action";
import { parseAmount } from "@/lib/utils/parse_amount";

export default async function DashboardStats() {
  const [coursesCount, paymentLogs] = await Promise.all([
    db.select({ count: count() }).from(courses),
    getPaymentLogs(),
  ]);

  // Revenue must be grouped by currency. Summing ARS and USD into one figure
  // produces a number that means nothing — it was previously reported as a
  // single "Ingresos" total. Anything without an explicit currency predates
  // the column's default and is MercadoPago, i.e. ARS.
  const revenueByCurrency = paymentLogs.reduce<Record<string, number>>(
    (totals, log) => {
      const currency = log.currency ?? "ARS";
      totals[currency] = (totals[currency] ?? 0) + parseAmount(log.paid_amount);
      return totals;
    },
    {}
  );

  return (
    <>
      <AnimatedCounter
        value={coursesCount[0].count}
        label="Cursos"
        icon={<BookOpen className="w-4 h-4 text-neutral-400" />}
      />
      <AnimatedCounter
        value={Math.round(revenueByCurrency.ARS ?? 0)}
        label="Ingresos ARS"
        prefix="$"
        icon={<DollarSign className="w-4 h-4 text-neutral-400" />}
      />
      <AnimatedCounter
        value={Math.round(revenueByCurrency.USD ?? 0)}
        label="Ingresos USD"
        prefix="US$"
        icon={<DollarSign className="w-4 h-4 text-neutral-400" />}
      />
      <AnimatedCounter
        value={paymentLogs.length}
        label="Ventas"
        icon={<TrendingUp className="w-4 h-4 text-neutral-400" />}
      />
    </>
  );
}
