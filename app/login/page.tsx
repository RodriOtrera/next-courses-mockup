"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";

import AuthShell from "@/components/auth/AuthShell";
import {
  AuthAlert,
  AuthField,
  AuthSubmit,
  isValidEmail,
} from "@/components/auth/AuthFields";
import { authClient } from "@/lib/auth/client";
import { capture } from "@/lib/analytics/client";

export default function LoginPage() {
  const router = useRouter();
  const emailRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    // Caught here rather than after a round-trip: a typo'd address otherwise
    // costs a request and a code delivered somewhere the user cannot read.
    if (!isValidEmail(email)) {
      setFieldError("Ingresá un correo válido, por ejemplo nombre@correo.com");
      emailRef.current?.focus();
      return;
    }

    setFieldError(null);
    setPending(true);

    const { error } = await authClient.emailOtp.sendVerificationOtp({
      email: email.trim(),
      type: "sign-in",
    });

    setPending(false);

    if (error) {
      capture("otp_failed", { flow: "login", reason: error.message ?? "send_failed" });
      setError("No pudimos enviar el código. Revisá el correo e intentá de nuevo.");
      return;
    }

    // Paired with `otp_verified` on the next page, this is the drop-off that
    // matters most: people who ask for a code and never come back with it.
    capture("otp_requested", { flow: "login" });
    router.push(`/verify-otp?email=${encodeURIComponent(email.trim())}`);
  }

  return (
    <AuthShell
      eyebrow="Ingresar"
      title="Bienvenido de vuelta"
      subtitle="Escribí tu correo y te enviamos un código de 6 dígitos. No necesitás contraseña."
      step={1}
      footer={
        <p className="text-sm text-[var(--ep-muted)]">
          ¿Todavía no tenés cuenta?{" "}
          <Link
            href="/signup"
            className="font-semibold text-[var(--ep-volt)] underline-offset-4 outline-none hover:underline focus-visible:underline"
          >
            Creá una gratis
          </Link>
        </p>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <AuthField
          ref={emailRef}
          label="Correo electrónico"
          icon={Mail}
          type="email"
          name="email"
          // The only field on the page — focusing it saves everyone a click and
          // lets a password manager offer the address immediately.
          autoFocus
          autoComplete="email"
          inputMode="email"
          enterKeyHint="send"
          placeholder="nombre@correo.com"
          value={email}
          error={fieldError}
          disabled={pending}
          onChange={(e) => {
            setEmail(e.target.value);
            if (fieldError) setFieldError(null);
          }}
          onBlur={() => {
            if (email && !isValidEmail(email)) {
              setFieldError("Ingresá un correo válido, por ejemplo nombre@correo.com");
            }
          }}
        />

        {error && <AuthAlert>{error}</AuthAlert>}

        <AuthSubmit pending={pending} pendingLabel="Enviando código…">
          Enviar código
        </AuthSubmit>

        <p className="text-center text-[13px] leading-5 text-white/35">
          Te llega al instante. Si no lo ves, revisá spam o promociones.
        </p>
      </form>
    </AuthShell>
  );
}
