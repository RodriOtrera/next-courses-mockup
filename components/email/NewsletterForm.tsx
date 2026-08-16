"use client";

import { useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { subscribeToNewsletter } from "@/lib/db/actions/email/consent_actions";

/**
 * Public newsletter capture for the footer.
 *
 * This is the one opt-in path with no proof that the person typing owns the
 * address, so it is the one that genuinely needs double opt-in: the row is
 * created `pending` and only becomes `confirmed` when the emailed link is
 * clicked. Nothing is ever sent to an address that has not done that.
 *
 * The success message is the same whether the address was new, already
 * subscribed, or rate-limited — the action deliberately reveals nothing, so the
 * form cannot be used to test who is a customer.
 */
export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  const { execute, status } = useAction(subscribeToNewsletter, {
    onSuccess: () => {
      setDone(true);
      setEmail("");
    },
    // A mail-system failure is ours, not a signal about the address, so saying
    // so leaks nothing — and silently showing success would leave someone
    // waiting for a confirmation that is never coming.
    onError: () => toast.error("No pudimos enviar el correo. Proba de nuevo en un rato."),
  });

  const busy = status === "executing";

  if (done) {
    return (
      <div className="flex items-start gap-2 text-sm text-neutral-400">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
        <p>
          Revisa tu correo y toca el enlace para confirmar. Sin ese paso no te
          enviamos nada.
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
      className="w-full max-w-sm"
    >
      <label htmlFor="newsletter-email" className="text-sm text-neutral-400">
        Novedades por correo
      </label>
      <div className="mt-2 flex gap-2">
        <Input
          id="newsletter-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.com"
          disabled={busy}
        />
        <Button type="submit" variant="secondary" disabled={busy || !email.trim()}>
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          <span className="sr-only">Suscribirme</span>
        </Button>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-neutral-600">
        Te mandamos un correo para confirmar. Podes darte de baja cuando quieras.
      </p>
    </form>
  );
}
