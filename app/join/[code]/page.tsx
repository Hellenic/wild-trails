"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Icon, GlassPanel } from "@/app/components/ui";
import { JoinGameModal } from "@/app/components/JoinGameModal";
import Link from "next/link";

type Params = {
  code: string;
};

export default function JoinGamePage() {
  const { code } = useParams<Params>();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Only check authentication - game verification is handled by JoinGameModal via API
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      setLoading(false);
    };
    checkAuth();
  }, [supabase.auth]);

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

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen dark:bg-background-dark bg-background-light relative flex items-center justify-center">
        {/* Background Pattern */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-background-dark via-surface-dark to-background-dark opacity-95" />
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2313ec13' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="relative z-10 w-full max-w-md p-4">
          <GlassPanel className="p-8 text-center">
            <Icon name="terrain" size="xl" className="text-primary mb-6" />
            <h2 className="text-2xl font-black text-white mb-4 tracking-tight">
              Join Game
            </h2>
            <p className="text-gray-400 mb-8 leading-relaxed">
              You need to sign in to join this game.
            </p>
            <Link href={`/login?redirect=/join/${code}`}>
              <Button variant="primary" fullWidth size="lg">
                <Icon name="login" size="sm" className="mr-2" />
                Sign In to Join
              </Button>
            </Link>
          </GlassPanel>
        </div>
      </main>
    );
  }

  // Authenticated - show modal immediately with prefilled code
  // The modal handles all game verification via /api/game/verify-code
  return (
    <main className="min-h-screen dark:bg-background-dark bg-background-light relative flex items-center justify-center">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-background-dark via-surface-dark to-background-dark opacity-95" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2313ec13' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <JoinGameModal
        isOpen={true}
        onClose={() => window.history.back()}
        prefillCode={code}
      />
    </main>
  );
}

