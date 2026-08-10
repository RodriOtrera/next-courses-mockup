"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  AlertTriangle,
  Eye,
  GraduationCap,
  MousePointerClick,
  PlayCircle,
  Users,
} from "lucide-react";
import AnimatedCounter from "../ui/AnimatedCounter";
import type { DashboardInsights } from "@/lib/analytics/insights";

const RAIL_LABELS: Record<string, string> = {
  mercadopago: "MercadoPago",
  paypal: "PayPal",
};

const PRODUCT_TYPE_LABELS: Record<string, string> = {
  course: "Curso",
  ebook: "Ebook",
  program: "Programa",
};

function percent(part: number, whole: number): string {
  if (whole <= 0) return "—";
  return `${((part / whole) * 100).toFixed(part / whole < 0.1 ? 1 : 0)}%`;
}

/**
 * Recharts hands `content` an element and only type-checks it as `ReactElement`,
 * so the props are declared by hand here — all optional, since recharts calls it
 * with nothing while the tooltip is inactive.
 */
interface TooltipEntry {
  dataKey?: string | number;
  name?: string | number;
  value?: number;
  stroke?: string;
  color?: string;
}

function CardTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-[10px] text-neutral-500 mb-1">{label}</p>
      {payload.map((entry) => (
        <p
          key={String(entry.dataKey)}
          className="text-xs text-white flex items-center gap-2"
        >
          <span
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{ background: entry.stroke ?? entry.color }}
          />
          <span className="text-neutral-400">{entry.name}</span>
          <span className="font-medium tabular-nums ml-auto">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

export default function PostHogInsights({ data }: { data: DashboardInsights }) {
  const { totals, funnel, daily, products, rails, friction, windowDays } = data;

  const stat = (event: string) => totals[event]?.total ?? 0;
  const people = (event: string) => totals[event]?.people ?? 0;

  const topOfFunnel = funnel[0]?.people ?? 0;
  const overallConversion = percent(funnel[2]?.people ?? 0, topOfFunnel);

  return (
    <section>
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <h2 className="text-xs font-medium text-neutral-400">
            Comportamiento <span className="text-red-400">.</span>
          </h2>
          <p className="text-[11px] text-neutral-600 mt-0.5">
            PostHog · últimos {windowDays} días · el tráfico de administración no
            se registra
          </p>
        </div>
        <span className="text-[11px] text-neutral-600 tabular-nums">
          {overallConversion} vista → compra
        </span>
      </div>

      {/* Engagement tiles */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3 mb-4">
        <AnimatedCounter
          value={people("$pageview")}
          label="Visitantes"
          icon={<Users className="w-4 h-4 text-neutral-400" />}
        />
        <AnimatedCounter
          value={stat("$pageview")}
          label="Vistas de página"
          icon={<Eye className="w-4 h-4 text-neutral-400" />}
        />
        <AnimatedCounter
          value={stat("lesson_completed")}
          label="Lecciones vistas"
          icon={<GraduationCap className="w-4 h-4 text-neutral-400" />}
        />
        <AnimatedCounter
          value={stat("video_play")}
          label="Reproducciones"
          icon={<PlayCircle className="w-4 h-4 text-neutral-400" />}
        />
        <AnimatedCounter
          value={stat("course_completed")}
          label="Cursos completados"
          icon={<MousePointerClick className="w-4 h-4 text-neutral-400" />}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
        {/* Daily traffic. Pageviews and product views only — plotting purchases
            on the same axis would flatten them into the baseline. */}
        <div className="xl:col-span-2 border border-neutral-800/50 rounded-xl p-5">
          <div className="flex items-baseline justify-between mb-5">
            <h3 className="text-xs font-medium text-neutral-400">Tráfico diario</h3>
            <div className="flex items-center gap-3 text-[10px] text-neutral-500">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-500" />
                Páginas
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                Productos
              </span>
            </div>
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={daily}>
                <defs>
                  <linearGradient id="phPageviews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a3a3a3" stopOpacity={0.14} />
                    <stop offset="100%" stopColor="#a3a3a3" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="phViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#525252", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                  minTickGap={24}
                />
                <YAxis
                  tick={{ fill: "#404040", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={32}
                  allowDecimals={false}
                />
                <Tooltip content={<CardTooltip />} />
                <Area
                  type="monotone"
                  dataKey="pageviews"
                  name="Páginas"
                  stroke="#a3a3a3"
                  strokeWidth={1.5}
                  fill="url(#phPageviews)"
                  dot={false}
                  activeDot={{ r: 3, fill: "#a3a3a3", strokeWidth: 0 }}
                />
                <Area
                  type="monotone"
                  dataKey="views"
                  name="Productos"
                  stroke="#ef4444"
                  strokeWidth={1.5}
                  fill="url(#phViews)"
                  dot={false}
                  activeDot={{ r: 3, fill: "#ef4444", strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Funnel */}
        <div className="border border-neutral-800/50 rounded-xl p-5">
          <h3 className="text-xs font-medium text-neutral-400 mb-5">
            Embudo de compra
          </h3>
          {topOfFunnel === 0 ? (
            <p className="text-xs text-neutral-600">Sin datos</p>
          ) : (
            <div className="space-y-4">
              {funnel.map((step, i) => {
                const width = topOfFunnel > 0 ? (step.people / topOfFunnel) * 100 : 0;
                const previous = i > 0 ? funnel[i - 1].people : 0;
                return (
                  <div key={step.label}>
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-[11px] text-neutral-300">
                        {step.label}
                      </span>
                      <span className="text-[11px] text-white tabular-nums ml-2">
                        {step.people.toLocaleString("es-AR")}
                      </span>
                    </div>
                    <div className="h-1.5 bg-neutral-800/50 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          i === funnel.length - 1 ? "bg-red-500" : "bg-red-500/50"
                        }`}
                        style={{ width: `${width}%` }}
                      />
                    </div>
                    {i > 0 && (
                      <p className="text-[10px] text-neutral-600 mt-1 tabular-nums">
                        {percent(step.people, previous)} del paso anterior
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {rails.length > 0 && (
            <div className="mt-5 pt-4 border-t border-neutral-800/50 space-y-2">
              <p className="text-[10px] text-neutral-600 mb-2">
                Conversión por pasarela
              </p>
              {rails.map((rail) => (
                <div
                  key={rail.rail}
                  className="flex items-baseline justify-between text-[11px]"
                >
                  <span className="text-neutral-400">
                    {RAIL_LABELS[rail.rail] ?? rail.rail}
                  </span>
                  <span className="text-neutral-500 tabular-nums">
                    {rail.completed}/{rail.started}
                    <span className="text-neutral-300 ml-2">
                      {percent(rail.completed, rail.started)}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Products */}
        <div className="xl:col-span-2 border border-neutral-800/50 rounded-xl p-5">
          <h3 className="text-xs font-medium text-neutral-400 mb-4">
            Productos más vistos
          </h3>
          {products.length === 0 ? (
            <p className="text-xs text-neutral-600">Sin datos</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-neutral-600">
                    <th className="text-left font-normal pb-2">Producto</th>
                    <th className="text-right font-normal pb-2">Vistas</th>
                    <th className="text-right font-normal pb-2">Checkout</th>
                    <th className="text-right font-normal pb-2">Compras</th>
                    <th className="text-right font-normal pb-2">Conv.</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr
                      key={`${product.product}-${product.type}`}
                      className="border-t border-neutral-800/40"
                    >
                      <td className="py-2 pr-3">
                        <span className="text-neutral-300 block truncate max-w-[220px]">
                          {product.product}
                        </span>
                        {product.type && (
                          <span className="text-[10px] text-neutral-600">
                            {PRODUCT_TYPE_LABELS[product.type] ?? product.type}
                          </span>
                        )}
                      </td>
                      <td className="text-right text-neutral-400 tabular-nums">
                        {product.views}
                      </td>
                      <td className="text-right text-neutral-400 tabular-nums">
                        {product.checkouts}
                      </td>
                      <td className="text-right text-neutral-200 tabular-nums">
                        {product.purchases}
                      </td>
                      <td className="text-right text-neutral-500 tabular-nums">
                        {percent(product.purchases, product.views)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Friction */}
        <div className="border border-neutral-800/50 rounded-xl p-5">
          <h3 className="text-xs font-medium text-neutral-400 mb-4">Fricción</h3>
          {friction.length === 0 ? (
            <p className="text-xs text-neutral-600">Sin incidencias registradas</p>
          ) : (
            <div className="space-y-2.5">
              {friction.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="flex items-center gap-2 text-[11px] text-neutral-400 min-w-0">
                    <AlertTriangle
                      className={`w-3 h-3 shrink-0 ${
                        row.severity === "error"
                          ? "text-red-400"
                          : "text-neutral-600"
                      }`}
                    />
                    <span className="truncate">{row.label}</span>
                  </span>
                  <span
                    className={`text-[11px] tabular-nums ${
                      row.severity === "error" ? "text-red-400" : "text-neutral-400"
                    }`}
                  >
                    {row.total}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-5 pt-4 border-t border-neutral-800/50 space-y-2">
            <p className="text-[10px] text-neutral-600 mb-2">Acceso</p>
            <div className="flex items-baseline justify-between text-[11px]">
              <span className="text-neutral-400">Códigos OTP verificados</span>
              <span className="text-neutral-300 tabular-nums">
                {percent(stat("otp_verified"), stat("otp_requested"))}
              </span>
            </div>
            <div className="flex items-baseline justify-between text-[11px]">
              <span className="text-neutral-400">Accesos otorgados</span>
              <span className="text-neutral-300 tabular-nums">
                {stat("enrollment_granted")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
