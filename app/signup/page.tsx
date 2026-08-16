"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Mail, User } from "lucide-react";

import AuthShell from "@/components/auth/AuthShell";
import {
  AuthAlert,
  AuthField,
  AuthSubmit,
  isValidEmail,
} from "@/components/auth/AuthFields";
import { authClient } from "@/lib/auth/client";
import { capture } from "@/lib/analytics/client";

export default function SignUpPage() {
  const router = useRouter();
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    // Both fields are validated in one pass so the form reports everything
    // wrong at once, instead of one error per attempt.
    const nextErrors: { name?: string; email?: string } = {};
    if (!name.trim()) nextErrors.name = "Decinos cómo te llamás.";
    if (!isValidEmail(email)) {
      nextErrors.email = "Ingresá un correo válido, por ejemplo nombre@correo.com";
    }

    setErrors(nextErrors);
    if (nextErrors.name) {
      nameRef.current?.focus();
      return;
    }
    if (nextErrors.email) {
      emailRef.current?.focus();
      return;
    }

    setPending(true);

    const { error } = await authClient.emailOtp.sendVerificationOtp({
      email: email.trim(),
      type: "sign-in",
    });

    setPending(false);

    if (error) {
      capture("otp_failed", { flow: "signup", reason: error.message ?? "send_failed" });
      setError("No pudimos enviar el código. Revisá el correo e intentá de nuevo.");
      return;
    }

    capture("otp_requested", { flow: "signup" });
    // The intent rides along to /verify-otp, which records the consent once the
    // code is accepted. Recording it here would credit an address nobody has
    // proven they can read.
    const query = new URLSearchParams({ email: email.trim(), name: name.trim() });
    if (marketingOptIn) query.set("marketing", "1");
    router.push(`/verify-otp?${query.toString()}`);
  }

  return (
    <AuthShell
      eyebrow="Crear cuenta"
      title="Empezá a aprender hoy"
      subtitle="Se crea en menos de un minuto. Te enviamos un código para verificar tu correo — no vas a tener que inventar otra contraseña."
      step={1}
      footer={
        <p className="text-sm text-[var(--ep-muted)]">
          ¿Ya tenés cuenta?{" "}
          <Link
            href="/login"
            className="font-semibold text-[var(--ep-volt)] underline-offset-4 outline-none hover:underline focus-visible:underline"
          >
            Ingresá
          </Link>
        </p>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <AuthField
          ref={nameRef}
          label="Nombre"
          icon={User}
          type="text"
          name="name"
          autoFocus
          autoComplete="name"
          enterKeyHint="next"
          placeholder="Tu nombre"
          value={name}
          error={errors.name}
          disabled={pending}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
          }}
        />

        <AuthField
          ref={emailRef}
          label="Correo electrónico"
          icon={Mail}
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          enterKeyHint="send"
          placeholder="nombre@correo.com"
          value={email}
          error={errors.email}
          disabled={pending}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
          }}
          onBlur={() => {
            if (email && !isValidEmail(email)) {
              setErrors((prev) => ({
                ...prev,
                email: "Ingresá un correo válido, por ejemplo nombre@correo.com",
              }));
            }
          }}
        />

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--ep-line)] bg-white/[0.02] p-3.5 transition-colors hover:border-white/15">
          <span className="relative mt-px flex h-[18px] w-[18px] shrink-0 items-center justify-center">
            <input
              type="checkbox"
              checked={marketingOptIn}
              disabled={pending}
              onChange={(e) => setMarketingOptIn(e.target.checked)}
              className="peer h-[18px] w-[18px] cursor-pointer appearance-none rounded-[6px] border border-white/20 bg-transparent outline-none transition-colors checked:border-[var(--ep-volt)] checked:bg-[var(--ep-volt)] focus-visible:ring-4 focus-visible:ring-[var(--ep-volt)]/25"
            />
            <Check
              size={12}
              strokeWidth={3.5}
              aria-hidden
              className="pointer-events-none absolute text-black opacity-0 transition-opacity peer-checked:opacity-100"
            />
          </span>
          <span className="text-[13px] leading-5 text-[var(--ep-muted)]">
            Quiero recibir novedades y promociones por correo. Podés darte de
            baja cuando quieras.
          </span>
        </label>

        {error && <AuthAlert>{error}</AuthAlert>}

        <AuthSubmit pending={pending} pendingLabel="Creando cuenta…">
          Crear cuenta
        </AuthSubmit>

        <p className="text-center text-[13px] leading-5 text-white/35">
          Al continuar aceptás nuestros términos y la política de privacidad.
        </p>
      </form>
    </AuthShell>
  );
}
