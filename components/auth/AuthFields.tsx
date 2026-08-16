"use client";

import * as React from "react";
import { AlertCircle, Loader2, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Form primitives for the auth flow.
 *
 * The point of extracting them is the accessibility wiring, which the three
 * hand-rolled forms all skipped: label/input association, `aria-invalid`,
 * `aria-describedby` pointing at the message, and errors in a live region so a
 * screen reader announces a failed code instead of leaving the user on a form
 * that looks unchanged.
 */

/**
 * Deliberately permissive. This exists to catch the typo that would otherwise
 * cost a full round-trip and a code sent into the void ("gmail.con",
 * a missing @) — not to adjudicate RFC 5322. The server is the authority.
 */
export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

interface AuthFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "id"> {
  label: string;
  icon: LucideIcon;
  error?: string | null;
}

export const AuthField = React.forwardRef<HTMLInputElement, AuthFieldProps>(
  function AuthField({ label, icon: Icon, error, className, ...props }, ref) {
    const reactId = React.useId();
    const id = `field-${reactId}`;
    const errorId = `${id}-error`;

    return (
      <div className="space-y-2">
        <label
          htmlFor={id}
          className="ff-mono block text-[0.62rem] uppercase tracking-[0.16em] text-[var(--ep-muted)]"
        >
          {label}
        </label>

        <div className="relative">
          <Icon
            size={16}
            aria-hidden
            className={cn(
              "pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors",
              error ? "text-[var(--ep-danger)]" : "text-[var(--ep-muted)]"
            )}
          />
          <input
            id={id}
            ref={ref}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className={cn(
              "h-12 w-full rounded-xl border bg-[var(--ep-surface-2)] pl-10 pr-3.5 text-[15px] text-[var(--ep-fg)] outline-none transition-all",
              "placeholder:text-white/25",
              "disabled:cursor-not-allowed disabled:opacity-50",
              error
                ? "border-[var(--ep-danger)]/60 focus:border-[var(--ep-danger)] focus:ring-4 focus:ring-[var(--ep-danger)]/15"
                : "border-[var(--ep-line)] hover:border-white/15 focus:border-[var(--ep-volt)] focus:ring-4 focus:ring-[var(--ep-volt)]/15",
              className
            )}
            {...props}
          />
        </div>

        {error && (
          <p
            id={errorId}
            className="flex items-start gap-1.5 text-[13px] leading-5 text-[var(--ep-danger-fg)]"
          >
            <AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden />
            {error}
          </p>
        )}
      </div>
    );
  }
);

interface AuthSubmitProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  pending?: boolean;
  /** Shown beside the spinner while the request is in flight. */
  pendingLabel: string;
}

export function AuthSubmit({
  pending,
  pendingLabel,
  children,
  className,
  disabled,
  ...props
}: AuthSubmitProps) {
  return (
    <button
      type="submit"
      // `aria-busy` rather than a disabled button with a changed label: the
      // label swap alone is silent to assistive tech.
      aria-busy={pending || undefined}
      disabled={pending || disabled}
      className={cn(
        "flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--ep-volt)] text-[13px] font-bold uppercase tracking-[0.1em] text-black outline-none transition-all",
        "hover:bg-[var(--ep-volt-dim)] active:scale-[0.99]",
        "focus-visible:ring-4 focus-visible:ring-[var(--ep-volt)]/25",
        "disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-[var(--ep-volt)] disabled:active:scale-100",
        className
      )}
      {...props}
    >
      {pending ? (
        <>
          <Loader2 size={16} className="animate-spin" aria-hidden />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}

/**
 * Form-level failures (the server said no), as opposed to per-field validation.
 * `role="alert"` so it is announced the moment it mounts.
 */
export function AuthAlert({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-xl border border-[var(--ep-danger)]/30 bg-[var(--ep-danger)]/[0.08] px-3.5 py-3 text-[13px] leading-5 text-[var(--ep-danger-fg)]"
    >
      <AlertCircle size={15} className="mt-0.5 shrink-0" aria-hidden />
      <span>{children}</span>
    </div>
  );
}
