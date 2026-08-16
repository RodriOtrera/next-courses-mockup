import Link from "next/link";
import { Clock } from "lucide-react";
import { getConsentByValidToken } from "@/lib/email/consent";
import { noindexMetadata } from "@/lib/seo/private-metadata";
import ConfirmClient from "./ConfirmClient";

export const metadata = noindexMetadata("Confirmar suscripcion");
// The token makes every visit unique; caching would leak one person's outcome
// to the next.
export const dynamic = "force-dynamic";

/**
 * Landing page for a double opt-in link.
 *
 * Public and unauthenticated by design — the person clicking has proven they
 * can read mail at that address, which is the fact being verified. Sits outside
 * the `proxy.ts` matcher, so no session is required.
 *
 * This render is **read-only**. The actual state change happens on a click in
 * `ConfirmClient`, so link scanners cannot consume the token.
 */
export default async function ConfirmarPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const consent = token ? await getConsentByValidToken(token) : undefined;

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border border-white/[0.06] bg-[#050505] p-8 text-center">
        {consent && token ? (
          <ConfirmClient token={token} email={consent.email} />
        ) : (
          <>
            <div className="mb-4 flex justify-center">
              <Clock className="h-10 w-10 text-amber-400" />
            </div>
            <h1 className="text-xl font-bold text-white">Enlace no valido</h1>
            <p className="mt-3 text-sm leading-relaxed text-neutral-400">
              Este enlace no existe, ya fue usado o vencio. Si ya confirmaste
              antes, no tenes que hacer nada; si no, volve a suscribirte desde el
              pie de pagina.
            </p>
            <Link
              href="/"
              className="mt-6 inline-block rounded-md bg-white/[0.06] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/[0.1]"
            >
              Volver al inicio
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
