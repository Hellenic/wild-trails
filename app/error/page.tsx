import Link from "next/link";

export default function ErrorPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-serif font-bold text-forest-deep">
          Something went wrong!
        </h1>
        <p className="text-forest-deep">
          An unexpected error occurred. Please try again.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-forest-pine text-forest-mist rounded-lg hover:bg-forest-moss transition-colors"
        >
          Go Home
        </Link>
      </div>
    </main>
  );
}