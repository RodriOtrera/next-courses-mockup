import Link from "next/link";

/**
 * Root 404. Rendered outside the (home) layout, so it has no Navbar — the
 * marketing-side equivalent lives at app/(home)/not-found.tsx and keeps the
 * chrome. Next injects `noindex` on notFound() automatically.
 */
export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-6">
      <div className="max-w-md text-center space-y-5">
        <p className="text-sm font-medium tracking-widest text-neutral-500">404</p>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Esta página no existe
        </h1>
        <p className="text-sm text-neutral-400">
          Puede que el enlace esté roto o que el contenido se haya movido.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90"
          >
            Volver al inicio
          </Link>
          <Link
            href="/courses"
            className="rounded-lg border border-neutral-800 px-4 py-2 text-sm font-medium text-neutral-300 transition-colors hover:border-neutral-700"
          >
            Ver cursos
          </Link>
        </div>
      </div>
    </main>
  );
}
