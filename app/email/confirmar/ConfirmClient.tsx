"use client";

import { useState } from "react";
import Link from "next/link";
import { useAction } from "next-safe-action/hooks";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { confirmEmailConsent } from "@/lib/db/actions/email/consent_actions";

/**
 * The confirm button.
 *
 * Redeeming the token on a click rather than on page load is what makes the
 * double opt-in mean something: corporate mail scanners and link-preview bots
 * fetch every URL in an inbound message, and a page that confirmed on GET would
 * let one of them opt somebody in — and burn the single-use token doing it, so
 * the actual human then sees "invalid link".
 */
export default function ConfirmClient({ token, email }: { token: string; email: string }) {
  const [confirmed, setConfirmed] = useState(false);

  const { execute, status, result } = useAction(confirmEmailConsent, {
    onSuccess: () => setConfirmed(true),
  });

  if (confirmed) {
    return (
      <>
        <div className="mb-4 flex justify-center">
          <CheckCircle2 className="h-10 w-10 text-green-500" />
        </div>
        <h1 className="text-xl font-bold text-white">Suscripcion confirmada</h1>
        <p className="mt-3 text-sm leading-relaxed text-neutral-400">
          Listo. Vas a recibir nuestras novedades en{" "}
          <span className="text-white">{email}</span>. Podes darte de baja desde el
          pie de cualquier correo.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-md bg-white/[0.06] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/[0.1]"
        >
          Volver al inicio
        </Link>
      </>
    );
  }

  const serverError = result?.serverError;

  return (
    <>
      <h1 className="text-xl font-bold text-white">Confirma tu suscripcion</h1>
      <p className="mt-3 text-sm leading-relaxed text-neutral-400">
        Toca el boton para empezar a recibir novedades en{" "}
        <span className="text-white">{email}</span>.
      </p>

      {serverError && (
        <p className="mt-4 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/[0.06] px-3 py-2 text-left text-xs leading-relaxed text-red-400">
          <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {serverError}
        </p>
      )}

      <Button
        type="button"
        className="mt-6 w-full bg-red-500 text-white hover:bg-red-600"
        disabled={status === "executing"}
        onClick={() => execute({ token })}
      >
        {status === "executing" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Si, confirmar
      </Button>

      <p className="mt-4 text-xs leading-relaxed text-neutral-600">
        Si no pediste esto, cerra esta pagina. Sin confirmar no te enviamos nada.
      </p>
    </>
  );
}
