"use client";

import { Button } from "@/components/ui/button";
import React from "react";
import { authClient } from "@/lib/auth/client";
import { useRouter } from "next/navigation";
import { resetIdentity } from "@/lib/analytics/client";

const SignOutButton = () => {
  const router = useRouter();
  return (
    <Button
      onClick={async () => {
        await authClient.signOut();
        // Detach the analytics identity explicitly here as well as in
        // AnalyticsIdentity — on a shared device the next visitor must not
        // inherit this person's distinct ID.
        resetIdentity();
        router.push("/");
        router.refresh();
      }}
      variant="outline"
      className="hidden rounded-full border-white/10 bg-transparent px-5 text-sm font-semibold tracking-wide text-neutral-500 hover:bg-white/[0.06] hover:text-white xl:inline-flex"
    >
      SALIR
    </Button>
  );
};

export default SignOutButton;
