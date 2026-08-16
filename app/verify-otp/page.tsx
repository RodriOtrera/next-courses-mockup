"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MailCheck, RotateCw } from "lucide-react";

import AuthShell from "@/components/auth/AuthShell";
import { AuthAlert, AuthSubmit } from "@/components/auth/AuthFields";
import OtpInput, { isOtpComplete } from "@/components/auth/OtpInput";
import { authClient } from "@/lib/auth/client";
import { capture } from "@/lib/analytics/client";
import { grantEmailConsent } from "@/lib/db/actions/email/consent_actions";

/** A code was just sent by the previous page, so the first window is a wait. */
const RESEND_SECONDS = 30;

function VerifyOtpForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const name = params.get("name") ?? undefined;
  // `name` is only carried through from the signup form, so its presence is
  // what distinguishes the two funnels arriving at this same page.
  const flow = name ? "signup" : "login";
  const marketingOptIn = params.get("marketing") === "1";

  const otpRef = useRef<{ focusFirst: () => void }>(null);
  // Guards the auto-submit: without it, a re-render while the request is in
  // flight could fire a second verification for the same code.
  const inFlight = useRef(false);

  const [otp, setOtp] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (!email) router.replace("/login");
  }, [email, router]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendCooldown]);

  useEffect(() => {
    otpRef.current?.focusFirst();
  }, []);

  async function verify(code: string) {
    if (inFlight.current) return;
    inFlight.current = true;
    setError(null);
    setNotice(null);
    setPending(true);

    const { error } = await authClient.signIn.emailOtp({
      email,
      otp: code,
      ...(name ? { name } : {}),
    });

    setPending(false);
    inFlight.current = false;

    if (error) {
      capture("otp_failed", { flow, reason: error.message ?? "invalid_or_expired" });
      setError("El código no es válido o ya venció. Revisá los dígitos o pedí uno nuevo.");
      // Clearing and refocusing beats leaving six wrong digits on screen for
      // the user to select and delete themselves.
      setOtp("");
      otpRef.current?.focusFirst();
      return;
    }

    capture("otp_verified", { flow });

    // Recorded here, after the code was accepted, because that is the moment
    // mailbox ownership is proven — which is also why this path needs no
    // separate confirmation email. Best-effort: a consent write that fails must
    // not strand someone on the OTP screen after they signed in successfully.
    if (marketingOptIn) {
      try {
        await grantEmailConsent({ source: "signup" });
      } catch (consentError) {
        console.warn("[consent] signup opt-in failed:", consentError);
      }
    }

    router.push("/dashboard");
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isOtpComplete(otp)) return;
    await verify(otp);
  }

  async function resend() {
    if (resendCooldown > 0 || pending) return;
    setError(null);
    setNotice(null);

    const { error } = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: "sign-in",
    });

    if (error) {
      setError("No pudimos reenviar el código. Probá de nuevo en un momento.");
      return;
    }

    // A high resend rate points at email deliverability, not user confusion.
    capture("otp_resent", { flow });
    setOtp("");
    setNotice("Listo, te enviamos un código nuevo.");
    setResendCooldown(RESEND_SECONDS);
    otpRef.current?.focusFirst();
  }

  return (
    <AuthShell
      eyebrow="Verificar correo"
      title="Revisá tu correo"
      subtitle={
        <>
          Enviamos un código de 6 dígitos a{" "}
          <span className="font-semibold text-[var(--ep-fg)]">{email}</span>.
          Vence en unos minutos.
        </>
      }
      step={2}
      footer={
        <p className="text-sm text-[var(--ep-muted)]">
          ¿Escribiste mal el correo?{" "}
          <Link
            href={flow === "signup" ? "/signup" : "/login"}
            className="font-semibold text-[var(--ep-volt)] underline-offset-4 outline-none hover:underline focus-visible:underline"
          >
            Usá otra dirección
          </Link>
        </p>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2.5">
          <span className="ff-mono block text-[0.62rem] uppercase tracking-[0.16em] text-[var(--ep-muted)]">
            Código de verificación
          </span>
          <OtpInput
            ref={otpRef}
            value={otp}
            onChange={(next) => {
              setOtp(next);
              if (error) setError(null);
            }}
            // Auto-submitting on the sixth digit removes the last click of the
            // flow; the button stays for anyone who reaches it by keyboard.
            onComplete={verify}
            disabled={pending}
            hasError={Boolean(error)}
            describedBy={error ? "otp-error" : undefined}
          />
        </div>

        {error && (
          <div id="otp-error">
            <AuthAlert>{error}</AuthAlert>
          </div>
        )}

        {notice && (
          <p
            role="status"
            className="flex items-center gap-2 rounded-xl border border-[var(--ep-volt-line)] bg-[var(--ep-volt)]/[0.07] px-3.5 py-3 text-[13px] text-[var(--ep-volt)]"
          >
            <MailCheck size={15} className="shrink-0" aria-hidden />
            {notice}
          </p>
        )}

        <AuthSubmit
          pending={pending}
          pendingLabel="Verificando…"
          disabled={!isOtpComplete(otp)}
        >
          Verificar y entrar
        </AuthSubmit>

        <div className="text-center">
          <button
            type="button"
            onClick={resend}
            disabled={resendCooldown > 0 || pending}
            className="ff-mono inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[0.62rem] uppercase tracking-[0.14em] text-[var(--ep-muted)] outline-none transition-colors hover:text-[var(--ep-fg)] focus-visible:ring-2 focus-visible:ring-[var(--ep-volt)]/40 disabled:cursor-not-allowed disabled:text-white/25 disabled:hover:text-white/25"
          >
            <RotateCw size={13} aria-hidden />
            {resendCooldown > 0
              ? `Reenviar código en ${resendCooldown}s`
              : "Reenviar código"}
          </button>
        </div>
      </form>
    </AuthShell>
  );
}

/**
 * `useSearchParams` opts the form out of prerendering, so the static HTML for
 * this route is whatever this fallback renders. Without one it was an empty
 * document, which flashed a bare black page between the redirect and
 * hydration — on the one screen where the user is already waiting on an email.
 */
function VerifyOtpSkeleton() {
  return (
    <AuthShell
      eyebrow="Verificar correo"
      title="Revisá tu correo"
      subtitle="Enviamos un código de 6 dígitos a tu casilla. Vence en unos minutos."
      step={2}
    >
      <div className="space-y-5" aria-hidden>
        <div className="h-3 w-40 rounded bg-white/5" />
        <div className="flex justify-between gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-14 w-full rounded-xl border border-[var(--ep-line)] bg-[var(--ep-surface-2)]"
            />
          ))}
        </div>
        <div className="h-12 w-full rounded-xl bg-white/5" />
      </div>
    </AuthShell>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<VerifyOtpSkeleton />}>
      <VerifyOtpForm />
    </Suspense>
  );
}
