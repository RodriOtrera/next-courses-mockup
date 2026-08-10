"use client";

import { useState } from "react";
import { SettingsIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Floating action menu for the course edit page. Collects all the page-level
 * admin controls (update data, create module, exam, preview, video, FAQ) into a
 * single speed-dial anchored to the bottom-right corner. The controls themselves
 * are passed as `children` so their inline server actions keep working untouched.
 */
const EditFloatingMenu = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Click-away backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* Actions panel */}
        <div
          className={cn(
            "origin-bottom-right rounded-2xl border border-white/10 bg-neutral-900/90 p-3 shadow-2xl shadow-black/50 backdrop-blur-md transition-all duration-200",
            "flex w-64 flex-col gap-2",
            "[&_button]:w-full [&_button]:justify-start [&_a]:w-full [&_a]:justify-start [&>div]:w-full",
            open
              ? "translate-y-0 scale-100 opacity-100"
              : "pointer-events-none translate-y-2 scale-95 opacity-0"
          )}
        >
          <p className="px-1 pb-1 text-xs font-semibold uppercase tracking-wider text-white/40">
            Configuración del curso
          </p>
          {children}
        </div>

        {/* Toggle button */}
        <button
          type="button"
          aria-label="Opciones de edición"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-lg shadow-red-600/30 transition-all hover:scale-105 hover:bg-red-500",
            open && "rotate-90"
          )}
        >
          {open ? (
            <XIcon className="h-6 w-6" />
          ) : (
            <SettingsIcon className="h-6 w-6" />
          )}
        </button>
      </div>
    </>
  );
};

export default EditFloatingMenu;
