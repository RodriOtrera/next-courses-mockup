"use client";

import { useEffect, useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { Loader2, MailQuestion, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getReconsentStatus,
  sendReconsentBatch,
} from "@/lib/db/actions/email/reconsent_actions";

/**
 * One-time campaign that asks pre-existing accounts for consent.
 *
 * Deliberately shows the numbers before offering the button — this is the only
 * control in the app that mails people who never opted in, and it should not be
 * possible to press it without first seeing how many that is.
 */
export default function ReconsentPanel() {
  const [confirming, setConfirming] = useState(false);

  const status = useAction(getReconsentStatus);
  const refresh = status.execute;

  const send = useAction(sendReconsentBatch, {
    onSuccess: ({ data }) => {
      setConfirming(false);
      toast.success(
        `Enviados ${data?.sent ?? 0} correos de confirmacion. Quedan ${data?.remaining ?? 0}.`,
      );
      refresh();
    },
    onError: ({ error }) => {
      setConfirming(false);
      toast.error(error.serverError ?? "No se pudo enviar la campana");
    },
  });

  useEffect(() => {
    refresh();
  }, [refresh]);

  const data = status.result?.data;
  const loading = status.status === "executing";
  const sending = send.status === "executing";
  const neverAsked = data?.neverAsked ?? 0;

  const stats = [
    { label: "Cuentas", value: data?.totalUsers },
    { label: "Confirmados", value: data?.confirmed, tone: "text-green-500" },
    { label: "Pendientes", value: data?.pending, tone: "text-amber-400" },
    { label: "Dados de baja", value: data?.unsubscribed, tone: "text-neutral-500" },
    { label: "Sin preguntar", value: neverAsked, tone: "text-red-400" },
  ];

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#050505] p-6">
      <div className="mb-1 flex items-center gap-2">
        <MailQuestion className="h-4 w-4 text-red-400" />
        <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-500">
          Campana de reconsentimiento
        </h2>
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-neutral-600" />}
      </div>
      <p className="mb-5 text-xs leading-relaxed text-neutral-600">
        Las cuentas creadas antes del sistema de consentimiento no reciben nada
        hasta que confirmen. Esto les envia, una sola vez, un correo con el enlace
        de confirmacion.
      </p>

      <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2"
          >
            <p className="text-[10px] uppercase tracking-widest text-neutral-600">
              {stat.label}
            </p>
            <p className={`mt-0.5 text-lg font-black ${stat.tone ?? "text-white"}`}>
              {stat.value === undefined ? "—" : stat.value.toLocaleString("es-AR")}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={loading}
          onClick={() => refresh()}
        >
          <RefreshCw className="mr-2 h-3.5 w-3.5" />
          Actualizar
        </Button>

        {neverAsked > 0 &&
          (confirming ? (
            <>
              <Button
                type="button"
                size="sm"
                className="bg-red-500 text-white hover:bg-red-600"
                disabled={sending}
                onClick={() => send.execute({ limit: 200 })}
              >
                {sending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                Confirmar envio
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={sending}
                onClick={() => setConfirming(false)}
              >
                Cancelar
              </Button>
              <span className="text-xs text-amber-400">
                Se enviaran hasta 200 correos en esta tanda.
              </span>
            </>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setConfirming(true)}
            >
              Enviar siguiente tanda ({Math.min(neverAsked, 200)})
            </Button>
          ))}

        {neverAsked === 0 && !loading && (
          <span className="text-xs text-neutral-600">
            Todas las cuentas ya fueron consultadas.
          </span>
        )}
      </div>
    </div>
  );
}
