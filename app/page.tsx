"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";

export default function Home() {
  const { user, loading } = useUser();
  const supabase = createClient();

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center text-foreground">Loading...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-8">
        <h1 className="text-5xl font-serif font-bold text-forest-deep">
          Wild Trails
        </h1>

        <div className="space-y-4">
          <Link
            href="/game/create"
            className="inline-block w-48 px-6 py-3 bg-forest-pine text-forest-mist rounded-lg hover:bg-forest-moss transition-colors"
          >
            Create Game
          </Link>

          <div>
            <button
              className="w-48 px-6 py-3 bg-forest-moss/50 text-forest-deep rounded-lg cursor-not-allowed"
              disabled
            >
              Join Game
              <span className="block text-sm">Coming soon</span>
            </button>
          </div>

          {user && (
            <button
              onClick={() => supabase.auth.signOut()}
              className="w-48 px-6 py-3 bg-forest-bark text-forest-mist rounded-lg hover:bg-forest-bark/80 transition-colors"
            >
              Sign Out
            </button>
          )}
        </div>

        <div className="mt-16 flex justify-center">
          <Image
            src="/wolf_footprint.svg"
            alt="Wolf footprint"
            width={100}
            height={100}
            className="opacity-30"
          />
        </div>
      </div>
    </main>
  );
}
