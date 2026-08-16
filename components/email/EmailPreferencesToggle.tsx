"use client";

import { useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";
import { ThemedCheckbox } from "@/components/ui/ThemedCheckbox";
import {
  grantEmailConsent,
  revokeEmailConsent,
} from "@/lib/db/actions/email/consent_actions";
import type { EmailConsentStatus } from "@/lib/db/schema/email_consent";

/**
 * Marketing opt-in toggle for the account page.
 *
 * Both actions act on the session's own address — neither takes an email
 * parameter — so this component cannot be used to change anyone else's
 * subscription regardless of what a caller sends.
 *
 * No confirmation email on this path: the user is signed in, and BetterAuth's
 * OTP flow already proved they can read mail at that address. Checking the box
 * is the consent, and the OTP was the verification.
 */
export default function EmailPreferencesToggle({
  initialStatus,
}: {
  initialStatus: EmailConsentStatus | null;
}) {
  const [subscribed, setSubscribed] = useState(initialStatus === "confirmed");

  const grant = useAction(grantEmailConsent, {
    onSuccess: () => toast.success("Listo, vas a recibir nuestras novedades"),
    onError: ({ error }) => {
      setSubscribed(false);
      toast.error(error.serverError ?? "No se pudo guardar la preferencia");
    },
  });

  const revoke = useAction(revokeEmailConsent, {
    onSuccess: () => toast.success("No vas a recibir mas correos de novedades"),
    onError: ({ error }) => {
      setSubscribed(true);
      toast.error(error.serverError ?? "No se pudo guardar la preferencia");
    },
  });

  const busy = grant.status === "executing" || revoke.status === "executing";

  // Optimistic: the checkbox moves immediately and the error handlers above put
  // it back if the write fails. A toggle that lags a round trip feels broken.
  const onChange = (next: boolean) => {
    setSubscribed(next);
    if (next) grant.execute({ source: "account" });
    else revoke.execute();
  };

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
      <div className="mb-3 flex items-center gap-2">
        <Mail className="h-4 w-4 text-red-400" />
        <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-400">
          Novedades por correo
        </h2>
        {busy && <Loader2 className="h-3.5 w-3.5 animate-spin text-neutral-600" />}
      </div>

      <ThemedCheckbox
        id="email-marketing-consent"
        checked={subscribed}
        disabled={busy}
        onCheckedChange={onChange}
        label="Quiero recibir novedades, lanzamientos y promociones"
      />

      <p className="mt-3 text-xs leading-relaxed text-neutral-600">
        Podes cambiarlo cuando quieras. Los correos sobre cursos que ya compraste
        —progreso, certificados, comprobantes— se envian igual, porque son parte
        del servicio.
      </p>
    </div>
  );
}
