"use client";

/**
 * Last-resort boundary for errors thrown in the root layout itself — which is
 * where ClerkProvider and the font setup live, so this replaces the entire
 * document and can't rely on globals.css having loaded. Styles are inline for
 * that reason.
 */
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
          background: "#f8f9fd",
          color: "#1b1b3a",
          fontFamily: "system-ui, sans-serif",
          padding: "1.5rem",
        }}
      >
        <div style={{ maxWidth: "26rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>
            Budgety couldn&apos;t start
          </h1>
          <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "#6b6b8a" }}>
            Something failed while loading the app itself. Reloading usually
            clears it.
          </p>
          {error.digest ? (
            <p style={{ marginTop: "1rem", fontSize: "0.75rem", color: "#6b6b8a" }}>
              Reference: {error.digest}
            </p>
          ) : null}
          <button
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              height: "2.5rem",
              padding: "0 1rem",
              borderRadius: 8,
              border: "none",
              background: "#4d44b5",
              color: "#fff",
              fontSize: "0.875rem",
              fontWeight: 500,
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
