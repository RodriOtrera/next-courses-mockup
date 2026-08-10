"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { capture } from "@/lib/analytics/client";

function VerifyOtpForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const name = params.get("name") ?? undefined;
  // `name` is only carried through from the signup form, so its presence is
  // what distinguishes the two funnels arriving at this same page.
  const flow = name ? "signup" : "login";

  const [otp, setOtp] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (!email) router.replace("/login");
  }, [email, router]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendCooldown]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const { error } = await authClient.signIn.emailOtp({
      email,
      otp,
      ...(name ? { name } : {}),
    });

    setPending(false);

    if (error) {
      capture("otp_failed", { flow, reason: error.message ?? "invalid_or_expired" });
      setError(error.message ?? "Invalid or expired code.");
      return;
    }

    capture("otp_verified", { flow });
    router.push("/dashboard");
  }

  async function resend() {
    if (resendCooldown > 0) return;
    setError(null);
    const { error } = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: "sign-in",
    });
    if (error) {
      setError(error.message ?? "Could not resend code.");
      return;
    }
    // A high resend rate points at email deliverability, not user confusion.
    capture("otp_resent", { flow });
    setResendCooldown(30);
  }

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 rounded-lg border border-black/10 p-6 dark:border-white/10"
      >
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Enter your code</h1>
          <p className="text-sm opacity-70">
            Sent to <span className="font-medium">{email}</span>
          </p>
        </div>

        <label className="block space-y-1 text-sm">
          <span>6-digit code</span>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            required
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            className="w-full rounded-md border border-black/15 bg-transparent px-3 py-2 text-center font-mono text-xl tracking-[0.5em] outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/50"
            placeholder="000000"
          />
        </label>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={pending || otp.length !== 6}
          className="w-full rounded-md bg-foreground px-3 py-2 text-background disabled:opacity-60"
        >
          {pending ? "Verifying…" : "Verify & sign in"}
        </button>

        <button
          type="button"
          onClick={resend}
          disabled={resendCooldown > 0}
          className="w-full text-sm opacity-70 hover:opacity-100 disabled:opacity-40"
        >
          {resendCooldown > 0
            ? `Resend code in ${resendCooldown}s`
            : "Resend code"}
        </button>
      </form>
    </main>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense>
      <VerifyOtpForm />
    </Suspense>
  );
}
