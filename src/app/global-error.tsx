"use client";

// Catches errors in the root layout itself. Must render its own <html>/<body>.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b110e",
          color: "#e8efe9",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: 24,
        }}
      >
        <div>
          <h1 style={{ fontSize: 18, margin: 0 }}>The village fell</h1>
          <p style={{ color: "#8ea396", fontSize: 14 }}>
            A fatal error occurred. Reload to try again.
          </p>
          {error.digest && (
            <p
              style={{
                color: "#5c6f63",
                fontSize: 11,
                fontFamily: "monospace",
              }}
            >
              ref: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              marginTop: 8,
              background: "#227f3d",
              color: "#fff",
              border: 0,
              borderRadius: 6,
              padding: "8px 16px",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
