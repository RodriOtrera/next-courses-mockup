"use client";

import { useEffect, useRef } from "react";
import { authClient } from "@/lib/auth/client";
import { identify, resetIdentity } from "@/lib/analytics/client";

/**
 * Links the anonymous browser identity to the signed-in user.
 *
 * Mounted in the root layout rather than `(home)/layout.tsx`, because that
 * group covers neither the dashboard nor the `/login` → `/signup` →
 * `/verify-otp` funnel — which is the part we most want to measure.
 *
 * The distinct ID is the BetterAuth `user.id`, the same value `captureServer`
 * uses, so a visitor's pre-signup browsing stitches to their later purchase.
 */
export default function AnalyticsIdentity() {
  const { data: session } = authClient.useSession();
  const identifiedRef = useRef<string | null>(null);

  useEffect(() => {
    const user = session?.user;

    if (user?.id) {
      // `identify` is idempotent server-side, but calling it on every render
      // would still mean a network request per navigation.
      if (identifiedRef.current !== user.id) {
        identify(user.id, user.email ?? undefined);
        identifiedRef.current = user.id;
      }
      return;
    }

    // Session went away — sign-out, or expiry. Detach so the next user on this
    // browser doesn't inherit the previous one's identity.
    if (identifiedRef.current !== null) {
      resetIdentity();
      identifiedRef.current = null;
    }
  }, [session?.user]);

  return null;
}
