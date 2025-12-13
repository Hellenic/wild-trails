"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { JoinGameModal } from "@/app/components/JoinGameModal";

export default function Home() {
  const { user, loading } = useUser();
  const supabase = createClient();
  const [showJoinModal, setShowJoinModal] = useState(false);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center text-foreground">Loading...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col bg-background">
      {/* Header Navigation */}
      {user && (
        <nav className="w-full bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div className="flex gap-4">
              <Link
                href="/games"
                className="px-4 py-2 text-forest-deep hover:bg-forest-pine/10 rounded-lg transition-colors font-medium"
              >
                📋 My Games
              </Link>
              <Link
                href="/profile"
                className="px-4 py-2 text-forest-deep hover:bg-forest-pine/10 rounded-lg transition-colors font-medium"
              >
                👤 Profile
              </Link>
              <Link
                href="/onboarding"
                className="px-4 py-2 text-forest-deep hover:bg-forest-pine/10 rounded-lg transition-colors font-medium"
              >
                📖 Tutorial
              </Link>
            </div>
            <button
              onClick={() => supabase.auth.signOut()}
              data-testid="signout-button"
              className="px-4 py-2 text-forest-deep hover:bg-forest-pine/10 rounded-lg transition-colors font-medium"
            >
              🚪 Sign Out
            </button>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center space-y-8 px-8 py-12 bg-white rounded-2xl shadow-lg max-w-2xl w-full">
          <h1 className="text-5xl font-serif font-bold text-forest-deep">
            Wild Trails
          </h1>
          <p className="text-lg text-gray-600 max-w-md mx-auto">
            An outdoor adventure treasure hunt combining orienteering, geocaching, and puzzle-solving
          </p>

          <div className="space-y-4">
            <Link
              href="/game/create"
              className="inline-block w-56 px-6 py-3 bg-forest-pine text-forest-mist rounded-lg hover:bg-forest-moss transition-colors font-medium"
            >
              🎮 Create Game
            </Link>

            <div>
              <button
                onClick={() => setShowJoinModal(true)}
                className="w-56 px-6 py-3 bg-forest-pine text-forest-mist rounded-lg hover:bg-forest-moss transition-colors font-medium"
              >
                🤝 Join Game
              </button>
            </div>

            {user && (
              <div className="pt-4">
                <Link
                  href="/games"
                  className="inline-block w-56 px-6 py-3 bg-forest-bark/30 text-forest-deep border-2 border-forest-bark rounded-lg hover:bg-forest-bark/40 transition-colors font-medium"
                >
                  📋 View My Games
                </Link>
              </div>
            )}

            {!user && (
              <div className="pt-4">
                <Link
                  href="/login"
                  className="inline-block w-56 px-6 py-3 bg-forest-bark text-forest-mist rounded-lg hover:bg-forest-bark/80 transition-colors font-medium"
                >
                  🔐 Sign In
                </Link>
              </div>
            )}
          </div>

          {/* Quick Links for new users */}
          {user && (
            <div className="pt-8">
              <Link
                href="/onboarding"
                className="text-forest-deep hover:underline text-sm"
              >
                📖 New here? Read the tutorial
              </Link>
            </div>
          )}

          <div className="mt-16 flex justify-center">
            <Image
              src="/wolf_footprint.svg"
              alt="Wolf footprint"
              width={120}
              height={120}
              className="wolf-footprint-glow"
            />
          </div>
        </div>
      </div>

      {/* Join Game Modal */}
      <JoinGameModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
      />
    </main>
  );
}
