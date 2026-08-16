import { Toaster } from "@/components/ui/sonner";

/**
 * The public email pages sit outside `(home)` and `(dashboard)`, so they
 * inherit the bare root layout — which mounts no `Toaster`. Without this the
 * preference toggle would save silently and look broken.
 *
 * Deliberately no navbar: someone arriving from an unsubscribe link wants one
 * decision, not the marketing site.
 */
export default function EmailLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster position="top-center" />
    </>
  );
}
