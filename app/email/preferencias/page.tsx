import Link from "next/link";
import { getConsentByValidToken } from "@/lib/email/consent";
import { noindexMetadata } from "@/lib/seo/private-metadata";
import { PreferencesToggle, RequestPreferencesLink } from "./PreferencesClient";

export const metadata = noindexMetadata("Preferencias de correo");
export const dynamic = "force-dynamic";

/**
 * Public email preference centre.
 *
 * Note that Resend's own `{{{RESEND_UNSUBSCRIBE_URL}}}` in every broadcast
 * footer is what satisfies one-click unsubscribe; this page is the granular
 * version for anyone who wants to re-subscribe or check where they stand.
 */
export default async function PreferenciasPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const consent = token ? await getConsentByValidToken(token) : undefined;

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border border-white/[0.06] bg-[#050505] p-8">
        <h1 className="mb-2 text-xl font-bold text-white">Preferencias de correo</h1>

        {consent && token ? (
          <PreferencesToggle
            token={token}
            email={consent.email}
            initiallySubscribed={consent.status === "confirmed"}
          />
        ) : (
          <div className="mt-4">
            {token && (
              <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/[0.06] px-3 py-2 text-xs leading-relaxed text-amber-400">
                Ese enlace no es valido o ya vencio. Pedi uno nuevo abajo.
              </p>
            )}
            <RequestPreferencesLink />
          </div>
        )}

        <Link
          href="/"
          className="mt-6 inline-block text-sm text-neutral-500 underline transition-colors hover:text-neutral-300"
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
