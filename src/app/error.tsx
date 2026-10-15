"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Hook for real logging (Sentry, etc.) later.
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--bg)] p-6 text-center text-leaf-100">
      <span className="text-4xl" aria-hidden>
        💥
      </span>
      <div>
        <h1 className="text-lg font-semibold">A jutsu backfired</h1>
        <p className="mt-1 max-w-md text-sm text-leaf-100/60">
          Something went wrong rendering the board. The error has been logged.
        </p>
        {error.digest && (
          <p className="mt-1 font-mono text-[11px] text-leaf-100/40">
            ref: {error.digest}
          </p>
        )}
      </div>
      <button
        onClick={reset}
        className="rounded-md bg-leaf-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-leaf-500"
      >
        Try again
      </button>
    </div>
  );
}
