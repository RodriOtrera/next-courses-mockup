"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { capture } from "@/lib/analytics/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const { error } = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: "sign-in",
    });

    setPending(false);

    if (error) {
      capture("otp_failed", { flow: "login", reason: error.message ?? "send_failed" });
      setError(error.message ?? "Could not send code. Try again.");
      return;
    }

    // Paired with `otp_verified` on the next page, this is the drop-off that
    // matters most: people who ask for a code and never come back with it.
    capture("otp_requested", { flow: "login" });
    router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
  }

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 rounded-lg border border-black/10 p-6 dark:border-white/10"
      >
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Sign in</h1>
          <p className="text-sm opacity-70">
            We&apos;ll email you a 6-digit code.
          </p>
        </div>

        <label className="block space-y-1 text-sm">
          <span>Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-black/15 bg-transparent px-3 py-2 outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/50"
            placeholder="you@example.com"
          />
        </label>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={pending || !email}
          className="w-full rounded-md bg-foreground px-3 py-2 text-background disabled:opacity-60"
        >
          {pending ? "Sending…" : "Send code"}
        </button>

        <p className="text-center text-sm opacity-70">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium underline">
            Create one
          </Link>
        </p>
      </form>
    </main>
  );
}
