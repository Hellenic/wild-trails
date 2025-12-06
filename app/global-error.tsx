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
    // Log the error to an error reporting service
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <head>
        <style>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            background-color: #e8eee7;
            color: #1a2f25;
          }
        `}</style>
      </head>
      <body>
        <main style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#e8eee7"
        }}>
          <div style={{ textAlign: "center" }}>
            <h1 style={{
              fontSize: "2.5rem",
              fontWeight: "bold",
              marginBottom: "1rem",
              color: "#1a2f25"
            }}>
              Something went wrong!
            </h1>
            <p style={{
              marginBottom: "1.5rem",
              color: "#1a2f25"
            }}>
              {error.message || "An unexpected error occurred"}
            </p>
            <button
              onClick={reset}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "#2d5016",
                color: "#e8eee7",
                border: "none",
                borderRadius: "0.5rem",
                cursor: "pointer",
                fontSize: "1rem"
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "#3d6a1f";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "#2d5016";
              }}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}

