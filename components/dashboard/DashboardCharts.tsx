"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { PaymentLog } from "@/lib/db/actions/payment_logs_action";
import { parseAmount } from "@/lib/utils/parse_amount";

const PRODUCT_COLORS = ["#a3a3a3", "#737373", "#525252", "#404040", "#262626"];

interface DashboardChartsProps {
  paymentLogs: PaymentLog[];
}

export default function DashboardCharts({ paymentLogs }: DashboardChartsProps) {
  // ARS and USD cannot share a Y axis — plotting them together makes a $30
  // ebook sale invisible next to a 35.000 peso course and the total meaningless.
  // This chart is ARS only (the platform's primary currency); USD is reported
  // separately below. Rows predating the `currency` column are MercadoPago/ARS.
  const arsLogs = useMemo(
    () => paymentLogs.filter((log) => (log.currency ?? "ARS") === "ARS"),
    [paymentLogs]
  );

  const revenueOverTime = useMemo(() => {
    const grouped = new Map<string, number>();
    arsLogs.forEach((log) => {
      if (!log.created_at) return;
      const date = new Date(log.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      grouped.set(key, (grouped.get(key) || 0) + parseAmount(log.paid_amount));
    });
    return Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([key, total]) => {
        const [year, month] = key.split("-");
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return {
          name: date.toLocaleDateString("es-AR", { month: "short" }),
          revenue: Math.round(total),
        };
      });
  }, [arsLogs]);

  const productBreakdown = useMemo(() => {
    const grouped = new Map<string, number>();
    paymentLogs.forEach((log) => {
      const name = log.product_name || "Otro";
      grouped.set(name, (grouped.get(name) || 0) + 1);
    });
    return Array.from(grouped.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [paymentLogs]);

  const totalRevenueArs = useMemo(
    () => arsLogs.reduce((sum, log) => sum + parseAmount(log.paid_amount), 0),
    [arsLogs]
  );

  const totalRevenueUsd = useMemo(
    () =>
      paymentLogs
        .filter((log) => log.currency === "USD")
        .reduce((sum, log) => sum + parseAmount(log.paid_amount), 0),
    [paymentLogs]
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 shadow-xl">
        <p className="text-[10px] text-neutral-500 mb-0.5">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} className="text-xs font-medium text-white">
            {entry.name === "revenue"
              ? `$${entry.value.toLocaleString("es-AR")}`
              : entry.value}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      {/* Revenue Over Time */}
      <div className="xl:col-span-2 border border-neutral-800/50 rounded-xl p-5">
        <div className="flex items-baseline justify-between mb-5">
          <h3 className="text-xs font-medium text-neutral-400">Ingresos (ARS)</h3>
          <div className="flex items-baseline gap-3">
            <span className="text-lg font-semibold text-white tabular-nums">
              ${Math.round(totalRevenueArs).toLocaleString("es-AR")}
            </span>
            {totalRevenueUsd > 0 && (
              <span className="text-xs text-neutral-500 tabular-nums">
                + US${Math.round(totalRevenueUsd).toLocaleString("en-US")}
              </span>
            )}
          </div>
        </div>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueOverTime}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="name"
                tick={{ fill: "#525252", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#404040", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={40}
                tickFormatter={(v) =>
                  v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`
                }
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#ef4444"
                strokeWidth={1.5}
                fill="url(#revenueGrad)"
                dot={false}
                activeDot={{ r: 3, fill: "#ef4444", strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Product Breakdown */}
      <div className="border border-neutral-800/50 rounded-xl p-5">
        <h3 className="text-xs font-medium text-neutral-400 mb-5">
          Por Producto
        </h3>
        {productBreakdown.length === 0 ? (
          <p className="text-xs text-neutral-600">Sin datos</p>
        ) : (
          <div className="space-y-3">
            {productBreakdown.slice(0, 6).map((product, i) => {
              const max = productBreakdown[0].count;
              const pct = max > 0 ? (product.count / max) * 100 : 0;
              return (
                <div key={product.name}>
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-[11px] text-neutral-300 truncate max-w-[140px]">
                      {product.name}
                    </span>
                    <span className="text-[11px] text-neutral-500 tabular-nums ml-2">
                      {product.count}
                    </span>
                  </div>
                  <div className="h-1 bg-neutral-800/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500/70 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
