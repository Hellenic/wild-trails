import Link from "next/link";
import { Button } from "@/app/components/ui";

export default function ErrorPage() {
  return (
    <main className="min-h-screen flex items-center justify-center dark:bg-background-dark bg-background-light">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-display font-black text-white">
          Something went wrong!
        </h1>
        <p className="text-gray-300">
          An unexpected error occurred. Please try again.
        </p>
        <Link href="/">
          <Button variant="primary" size="lg">
            Go Home
          </Button>
        </Link>
      </div>
    </main>
  );
}