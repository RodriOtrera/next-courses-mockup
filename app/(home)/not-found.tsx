import Link from "next/link";

/**
 * Marketing-side 404. Same content as the root boundary but rendered inside the
 * (home) layout, so it keeps the Navbar and the user has somewhere to go.
 */
export default function HomeNotFound() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-6 pt-16">
      <div className="max-w-md text-center space-y-5">
        <p className="text-sm font-medium tracking-widest text-neutral-500">404</p>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
          No encontramos esta página
        </h1>
        <p className="text-sm text-neutral-400">
          Puede que el curso ya no esté disponible o que el enlace haya cambiado.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/courses"
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90"
          >
            Ver todos los cursos
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-neutral-800 px-4 py-2 text-sm font-medium text-neutral-300 transition-colors hover:border-neutral-700"
          >
            Inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
