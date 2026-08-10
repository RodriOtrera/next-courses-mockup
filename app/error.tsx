"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-6">
      <div className="max-w-md text-center space-y-5">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Algo salió mal
        </h1>
        <p className="text-sm text-neutral-400">
          Ocurrió un error inesperado. Podés intentar de nuevo.
        </p>
        {error.digest && (
          <p className="text-xs text-neutral-600">Referencia: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90"
        >
          Reintentar
        </button>
      </div>
    </main>
  );
}
