import Link from "next/link";
import { Button } from "@/app/components/ui";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center dark:bg-background-dark bg-background-light">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-display font-black text-white">
          404
        </h1>
        <p className="text-gray-300">Page not found</p>
        <Link href="/">
          <Button variant="primary" size="lg">
            Go Home
          </Button>
        </Link>
      </div>
    </main>
  );
}

