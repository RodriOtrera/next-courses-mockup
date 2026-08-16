"use client";

import { useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemedCheckbox } from "@/components/ui/ThemedCheckbox";
import {
  requestEmailPreferencesLink,
  updateEmailPreferencesByToken,
} from "@/lib/db/actions/email/consent_actions";

/**
 * Token-authenticated preference toggle.
 *
 * The token is the authorization: it was mailed to the address it controls, so
 * possession proves the same thing a login would. Requiring a session here
 * instead would push people who just want out into "forgot password" and then
 * into the spam button, which costs far more than it protects.
 */
export function PreferencesToggle({
  token,
  email,
  initiallySubscribed,
}: {
  token: string;
  email: string;
  initiallySubscribed: boolean;
}) {
  const [subscribed, setSubscribed] = useState(initiallySubscribed);

  const { execute, status } = useAction(updateEmailPreferencesByToken, {
    onSuccess: ({ data }) =>
      toast.success(
        data?.status === "confirmed"
          ? "Volviste a suscribirte"
          : "Listo, no vas a recibir mas novedades",
      ),
    onError: ({ error }) => {
      setSubscribed((prev) => !prev);
      toast.error(error.serverError ?? "No se pudo guardar el cambio");
    },
  });

  const busy = status === "executing";

  return (
    <>
      <p className="mb-5 text-sm text-neutral-400">
        Preferencias para <span className="text-white">{email}</span>
      </p>

      <ThemedCheckbox
        id="preferences-subscribed"
        checked={subscribed}
        disabled={busy}
        onCheckedChange={(next) => {
          setSubscribed(next);
          execute({ token, subscribed: next });
        }}
        label="Quiero recibir novedades, lanzamientos y promociones"
      />

      <p className="mt-4 text-xs leading-relaxed text-neutral-600">
        Los correos sobre cursos que ya compraste se envian igual: son parte del
        servicio, no publicidad.
      </p>
    </>
  );
}

/**
 * Fallback for someone who lands here with no token — typically by typing the
 * URL. Rather than accept an address and act on it, which would let anyone
 * unsubscribe anyone, it mails a link to whoever owns that mailbox.
 */
export function RequestPreferencesLink() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const { execute, status } = useAction(requestEmailPreferencesLink, {
    onSuccess: () => setSent(true),
  });

  const busy = status === "executing";

  if (sent) {
    return (
      <div className="flex items-start gap-2 text-sm text-neutral-400">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
        <p>
          Si esa direccion esta en nuestra lista, te acabamos de enviar un enlace
          para gestionar tus preferencias.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (email.trim()) execute({ email: email.trim() });
      }}
    >
      <p className="mb-4 text-sm leading-relaxed text-neutral-400">
        Escribi tu correo y te enviamos un enlace para cambiar tus preferencias.
      </p>
      <div className="flex gap-2">
        <Input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.com"
          disabled={busy}
        />
        <Button type="submit" variant="secondary" disabled={busy || !email.trim()}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar"}
        </Button>
      </div>
    </form>
  );
}
