"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { JoinGameModal } from "@/app/components/JoinGameModal";
import { Button } from "@/app/components/ui/Button";
import { Icon } from "@/app/components/ui/Icon";
import { GlassPanel } from "@/app/components/ui/GlassPanel";

export default function Home() {
  const { user, loading } = useUser();
  const supabase = createClient();
  const [showJoinModal, setShowJoinModal] = useState(false);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center dark:bg-background-dark bg-background-light">
        <div className="text-center">
          <div className="animate-pulse">
            <Icon name="terrain" size="xl" className="text-primary mb-4" />
            <div className="text-white">Loading...</div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col dark:bg-background-dark bg-background-light relative">
      {/* Background Pattern/Gradient */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-background-dark via-surface-dark to-background-dark opacity-95" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2313ec13' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Header Navigation */}
      {user && (
        <nav className="relative z-10 w-full bg-surface-dark/50 backdrop-blur-glass border-b border-white/10 px-4 py-4 shadow-lg">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-2 text-primary">
              <Icon name="terrain" size="md" />
              <span className="font-bold text-lg hidden sm:inline">
                Wild Trails
              </span>
            </div>
            <div className="flex gap-2">
              <Link href="/games">
                <Button variant="ghost" size="sm">
                  <Icon name="list" size="sm" className="mr-2" />
                  <span className="hidden sm:inline">My Games</span>
                </Button>
              </Link>
              <Link href="/profile">
                <Button variant="ghost" size="sm">
                  <Icon name="person" size="sm" className="mr-2" />
                  <span className="hidden sm:inline">Profile</span>
                </Button>
              </Link>
              <Link href="/onboarding">
                <Button variant="ghost" size="sm">
                  <Icon name="menu_book" size="sm" className="mr-2" />
                  <span className="hidden sm:inline">Tutorial</span>
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => supabase.auth.signOut()}
                data-testid="signout-button"
              >
                <Icon name="logout" size="sm" />
              </Button>
            </div>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-5xl">
          <GlassPanel className="p-8 lg:p-12">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="flex justify-center mb-6">
                <Icon name="terrain" size="xl" className="text-primary" />
              </div>
              <h1 className="text-5xl lg:text-6xl font-black text-white mb-4 tracking-tight">
                Wild Trails
              </h1>
              <p className="text-lg lg:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
                An outdoor adventure treasure hunt combining orienteering,
                geocaching, and puzzle-solving
              </p>
            </div>

            {/* Action Cards */}
            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-12">
              {/* Create Game Card */}
              <Link href="/game/create">
                <div className="group relative overflow-hidden rounded-xl bg-surface-dark-elevated border border-white/10 p-6 transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20 hover:scale-[1.02] cursor-pointer">
                  <div className="flex flex-col items-center text-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Icon name="add_location" size="lg" className="text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        Create Game
                      </h3>
                      <p className="text-sm text-gray-400">
                        Design your own adventure with AI-powered hints and
                        waypoints
                      </p>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Join Game Card */}
              <button onClick={() => setShowJoinModal(true)} className="w-full">
                <div className="group relative overflow-hidden rounded-xl bg-surface-dark-elevated border border-white/10 p-6 transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20 hover:scale-[1.02] cursor-pointer">
                  <div className="flex flex-col items-center text-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Icon name="group_add" size="lg" className="text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        Join Game
                      </h3>
                      <p className="text-sm text-gray-400">
                        Enter a game code to join an existing adventure
                      </p>
                    </div>
                  </div>
                </div>
              </button>
            </div>

            {/* Secondary Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
              {user ? (
                <>
                  <Link href="/games" className="w-full sm:w-auto">
                    <Button variant="secondary" fullWidth size="lg">
                      <Icon name="list" size="sm" className="mr-2" />
                      View My Games
                    </Button>
                  </Link>
                  <Link href="/onboarding" className="w-full sm:w-auto">
                    <Button variant="ghost" fullWidth size="lg">
                      <Icon name="menu_book" size="sm" className="mr-2" />
                      Tutorial
                    </Button>
                  </Link>
                </>
              ) : (
                <Link href="/login" className="w-full sm:w-auto">
                  <Button variant="primary" fullWidth size="lg">
                    <Icon name="login" size="sm" className="mr-2" />
                    Sign In to Continue
                  </Button>
                </Link>
              )}
            </div>

            {/* Footer Branding */}
            <div className="mt-16 flex flex-col items-center gap-4 pt-8 border-t border-white/10">
              <Image
                src="/wolf_footprint.svg"
                alt="Wolf footprint"
                width={80}
                height={80}
                className="wolf-footprint-glow opacity-40"
              />
              <p className="text-xs text-gray-500 text-center">
                Master the outdoors. Create your path.
              </p>
              <div className="text-xs text-gray-400 font-mono opacity-60">
                v0.4.1 • Build {new Date().toISOString().split('T')[0]}
              </div>
            </div>
          </GlassPanel>
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
