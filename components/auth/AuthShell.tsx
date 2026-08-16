import Link from "next/link";
import { ArrowLeft, GraduationCap, KeyRound, Trophy } from "lucide-react";

import { SITE } from "@/lib/seo/site";
import { cn } from "@/lib/utils";

/**
 * Chrome shared by every step of the passwordless flow (/login, /signup,
 * /verify-otp).
 *
 * These routes sit outside the `(home)` group, so they get no Navbar and no
 * Footer — previously that left a bare form floating on a black page with no
 * brand, no way back to the site, and no explanation of what a "6-digit code"
 * was about to do. The aside carries that context on desktop; on mobile it
 * collapses to the logo and the card's own subtitle.
 */

const HIGHLIGHTS = [
  {
    icon: KeyRound,
    title: "Entrá sin contraseña",
    body: "Un código de un solo uso que llega a tu correo. Nada que recordar, nada que se filtre.",
  },
  {
    icon: GraduationCap,
    title: "Retomá donde lo dejaste",
    body: "Tu progreso queda guardado lección por lección, en cualquier dispositivo.",
  },
  {
    icon: Trophy,
    title: "Sumá XP y certificados",
    body: "Ganás experiencia a medida que avanzás y descargás tu certificado al terminar.",
  },
];

function BrandMark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex shrink-0 items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[var(--ep-volt)]/40",
        className
      )}
    >
      <span className="text-lg font-bold tracking-wide text-white">
        {SITE.shortName.slice(0, 2).toUpperCase()}
      </span>
      <span className="h-6 w-px bg-white/10" />
      <span className="ff-mono text-[0.58rem] uppercase tracking-[0.18em] text-[var(--ep-muted)]">
        Cursos online
      </span>
    </Link>
  );
}

interface AuthShellProps {
  /** Small label above the heading — names the step, not the product. */
  eyebrow: string;
  title: string;
  subtitle: React.ReactNode;
  /** Which half of the two-step flow this page is; drives the progress pips. */
  step: 1 | 2;
  children: React.ReactNode;
  /** Sits below the card, outside the form — cross-links and legal notes. */
  footer?: React.ReactNode;
}

export default function AuthShell({
  eyebrow,
  title,
  subtitle,
  step,
  children,
  footer,
}: AuthShellProps) {
  return (
    <main className="relative flex min-h-[100dvh] w-full flex-col bg-[var(--ep-ink)] lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* Ambient wash so the page reads as a room, not an empty black canvas. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -left-40 top-[-10%] h-[36rem] w-[36rem] rounded-full bg-[var(--ep-volt)] opacity-[0.05] blur-[130px]" />
        <div className="absolute bottom-[-20%] right-[-10%] h-[30rem] w-[30rem] rounded-full bg-[var(--ep-volt)] opacity-[0.03] blur-[130px]" />
      </div>

      <aside className="relative z-10 hidden flex-col justify-between border-r border-[var(--ep-line)] p-12 lg:flex xl:p-16">
        <BrandMark />

        <div className="max-w-md">
          <h2 className="ff-display text-[2.6rem] text-[var(--ep-fg)] xl:text-[3.1rem]">
            Tu próxima
            <br />
            <span className="text-[var(--ep-volt)]">habilidad</span> empieza acá.
          </h2>
          <p className="mt-5 text-[15px] leading-7 text-[var(--ep-muted)]">
            {SITE.description}
          </p>

          <ul className="mt-11 space-y-7">
            {HIGHLIGHTS.map(({ icon: Icon, title: heading, body }) => (
              <li key={heading} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--ep-volt-line)] bg-[var(--ep-volt)]/[0.07]">
                  <Icon
                    size={18}
                    className="text-[var(--ep-volt)]"
                    aria-hidden
                  />
                </span>
                <div>
                  <p className="text-sm font-semibold text-[var(--ep-fg)]">
                    {heading}
                  </p>
                  <p className="mt-1 text-[13px] leading-6 text-[var(--ep-muted)]">
                    {body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="ff-mono text-[0.58rem] uppercase tracking-[0.18em] text-white/25">
          © {new Date().getFullYear()} {SITE.name}
        </p>
      </aside>

      <section className="relative z-10 flex flex-1 flex-col">
        <header className="flex items-center justify-between p-5 sm:p-6 lg:hidden">
          <BrandMark />
        </header>

        <div className="flex flex-1 items-center justify-center px-5 pb-10 sm:px-6 lg:p-10">
          <div className="fade-in-up w-full max-w-[26rem]">
            <div className="rounded-2xl border border-[var(--ep-line)] bg-[var(--ep-surface)] p-6 shadow-[0_24px_70px_-30px_rgba(0,0,0,0.9)] sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <span className="ff-mono text-[0.6rem] uppercase tracking-[0.2em] text-[var(--ep-muted)]">
                  {eyebrow}
                </span>
                <div
                  className="flex items-center gap-1.5 pt-1"
                  role="img"
                  aria-label={`Paso ${step} de 2`}
                >
                  {[1, 2].map((pip) => (
                    <span
                      key={pip}
                      className={cn(
                        "h-1 rounded-full transition-all duration-300",
                        step >= pip
                          ? "w-6 bg-[var(--ep-volt)]"
                          : "w-3 bg-white/12"
                      )}
                    />
                  ))}
                </div>
              </div>

              <h1 className="ff-display mt-3.5 text-[1.7rem] text-[var(--ep-fg)] sm:text-[1.85rem]">
                {title}
              </h1>
              <p className="mt-2.5 text-sm leading-6 text-[var(--ep-muted)]">
                {subtitle}
              </p>

              <div className="mt-7">{children}</div>
            </div>

            {footer && (
              <div className="mt-6 space-y-4 text-center">{footer}</div>
            )}

            <div className="mt-7 text-center">
              <Link
                href="/"
                className="ff-mono inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[0.6rem] uppercase tracking-[0.16em] text-white/30 outline-none transition-colors hover:text-[var(--ep-muted)] focus-visible:ring-2 focus-visible:ring-[var(--ep-volt)]/40"
              >
                <ArrowLeft size={12} aria-hidden />
                Volver al inicio
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
