"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/app/components/ui";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Error:", error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center dark:bg-background-dark bg-background-light">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-display font-black text-white">
          Something went wrong!
        </h1>
        <p className="text-gray-300">
          {error.message || "An unexpected error occurred"}
        </p>
        <div className="flex gap-4 justify-center">
          <Button
            onClick={reset}
            variant="primary"
            size="lg"
          >
            Try again
          </Button>
          <Link href="/">
            <Button
              variant="secondary"
              size="lg"
            >
              Go Home
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}

