import { BarChart3 } from "lucide-react";
import { getDashboardInsights, WINDOW_DAYS } from "@/lib/analytics/insights";
import PostHogInsights from "./PostHogInsights";

/**
 * Shell for the states where there is nothing to plot. The panel is one section
 * of a page that must keep working — an unconfigured or unreachable PostHog
 * shows a message here and leaves the revenue panels above untouched.
 */
function PanelNotice({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-xs font-medium text-neutral-400 mb-4">
        Comportamiento <span className="text-red-400">.</span>
      </h2>
      <div className="border border-neutral-800/50 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <BarChart3 className="w-4 h-4 text-neutral-600 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-neutral-300">{title}</p>
            <div className="text-[11px] text-neutral-600 mt-1.5 space-y-1">
              {children}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default async function PostHogInsightsLoader() {
  const result = await getDashboardInsights();

  if (!result.ok) {
    if (result.reason === "not_configured") {
      return (
        <PanelNotice title="PostHog no está conectado para lectura">
          <p>
            Los eventos se siguen registrando; para mostrarlos acá hace falta una
            personal API key con permiso <code>query:read</code>.
          </p>
          <p className="font-mono text-neutral-500">
            POSTHOG_PERSONAL_API_KEY · POSTHOG_PROJECT_ID
          </p>
          <p>Ver docs/analytics.md.</p>
        </PanelNotice>
      );
    }

    return (
      <PanelNotice title="No se pudieron leer las métricas de PostHog">
        <p className="font-mono text-neutral-500 break-words">
          {result.message}
        </p>
      </PanelNotice>
    );
  }

  if (result.data.empty) {
    return (
      <PanelNotice title="Todavía no hay eventos en PostHog">
        <p>
          No se registró actividad en los últimos {WINDOW_DAYS} días. El tráfico
          de <code>/dashboard</code> y demás rutas de administración se descarta
          a propósito.
        </p>
      </PanelNotice>
    );
  }

  return <PostHogInsights data={result.data} />;
}
