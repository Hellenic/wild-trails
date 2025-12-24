"use client";

import React, { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GameBasicInfo } from "./components/GameBasicInfo";
import { GameMapSelection } from "./components/GameMapSelection";
import { GameSettings } from "./components/GameSettings";
import { ChatGameCreation } from "@/app/components/ChatGameCreation";
import { LatLng } from "@/utils/map";
import { gameAPI } from "@/lib/api/client";
import type { GameDetails, GameMaster, GameRole } from "@/types/game";
import { Button } from "@/app/components/ui/Button";
import { Icon } from "@/app/components/ui/Icon";
import { GlassPanel } from "@/app/components/ui/GlassPanel";
import Link from "next/link";

type FormData = {
  name: string;
  password: string;
  mapArea?: GameDetails["bounding_box"];
  startingPoint?: LatLng;
  duration: number;
  maxDistance: number;
  playerCount: number;
  gameMasterType: GameMaster;
  playerRole: GameRole;
};

// Initialize mode from localStorage
const getInitialMode = (): "chat" | "form" => {
  if (typeof window === "undefined") return "chat";
  const savedMode = localStorage.getItem("gameCreationMode");
  return (savedMode === "chat" || savedMode === "form") ? savedMode : "chat";
};

export default function CreateGame() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"chat" | "form">(getInitialMode);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    password: "",
    duration: 1,
    playerCount: 1,
    gameMasterType: "ai",
    playerRole: "player_a",
    maxDistance: 3,
  });

  // Save mode preference when it changes
  const handleModeChange = (newMode: "chat" | "form") => {
    setMode(newMode);
    if (typeof window !== "undefined") {
      localStorage.setItem("gameCreationMode", newMode);
    }
  };

  const steps = [
    { number: 1, title: "Basic Info" },
    { number: 2, title: "Map Selection" },
    { number: 3, title: "Game Settings" },
  ];

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!formData.mapArea) {
      setError("Please select a map area");
      return;
    }

    setError(null);

    startTransition(async () => {
      try {
        const game = await gameAPI.create({
          name: formData.name,
          password: formData.password,
          duration: formData.duration * 60, // Duration, from hours to minutes
          max_radius: formData.maxDistance,
          player_count: formData.playerCount,
          game_mode: "single_player",
          selected_role: formData.playerRole || undefined,
          game_master: formData.gameMasterType,
          starting_point: formData.startingPoint
            ? {
                lat: formData.startingPoint.lat,
                lng: formData.startingPoint.lng,
              }
            : undefined,
          bounding_box: formData.mapArea!,  // Already checked above
        });

        // Navigate to game setup page
        router.push(`/game/${game.id}/setup`);
      } catch (err: unknown) {
        console.error("Error creating game:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to create game. Please try again."
        );
      }
    });
  };

  return (
    <main className="min-h-screen dark:bg-background-dark bg-background-light relative">
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

      <div className="relative z-10 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Icon name="add_location" size="lg" className="text-primary" />
              <h1 className="text-3xl lg:text-4xl font-black text-white">
                Create Game
              </h1>
            </div>
            <Link href="/">
              <Button variant="ghost">
                <Icon name="close" className="text-lg" />
              </Button>
            </Link>
          </div>

          {/* Mode Toggle */}
          <div className="flex justify-center mb-8">
            <GlassPanel className="inline-flex p-1">
              <button
                onClick={() => handleModeChange("chat")}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                  mode === "chat"
                    ? "bg-primary text-background-dark"
                    : "text-white hover:text-primary"
                }`}
              >
                <Icon name="chat" className="mr-2 text-lg inline" />
                Chat Mode
              </button>
              <button
                onClick={() => handleModeChange("form")}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                  mode === "form"
                    ? "bg-primary text-background-dark"
                    : "text-white hover:text-primary"
                }`}
              >
                <Icon name="description" className="mr-2 text-lg inline" />
                Form Mode
              </button>
            </GlassPanel>
          </div>

          {/* Chat Mode */}
          {mode === "chat" && (
            <div className="mb-4">
              <ChatGameCreation />
            </div>
          )}

          {/* Form Mode */}
          {mode === "form" && (
            <>
              {/* Stepper */}
              <div className="flex justify-between mb-8 max-w-2xl mx-auto">
                {steps.map((step, index) => (
                  <div key={step.number} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                          currentStep >= step.number
                            ? "bg-primary text-background-dark scale-110"
                            : "bg-surface-dark-elevated text-gray-500 border border-white/10"
                        }`}
                      >
                        {currentStep > step.number ? (
                          <Icon name="check" className="text-xl" />
                        ) : (
                          step.number
                        )}
                      </div>
                      <span
                        className={`mt-2 text-sm font-medium ${
                          currentStep >= step.number
                            ? "text-primary"
                            : "text-gray-500"
                        }`}
                      >
                        {step.title}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`h-0.5 flex-1 mx-4 transition-all duration-300 ${
                          currentStep > step.number
                            ? "bg-primary"
                            : "bg-white/10"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Error Message */}
              {error && (
                <GlassPanel className="mb-6 p-4 border-red-500/50">
                  <div className="flex items-center gap-3 text-red-400">
                    <Icon name="error" />
                    <span>{error}</span>
                  </div>
                </GlassPanel>
              )}

              {/* Form Steps */}
              <GlassPanel className="p-6 lg:p-8">
                {currentStep === 1 && (
                  <GameBasicInfo
                    formData={formData}
                    setFormData={(data) =>
                      setFormData({
                        ...formData,
                        ...data,
                      })
                    }
                    onNext={handleNext}
                  />
                )}
                {currentStep === 2 && (
                  <GameMapSelection
                    formData={formData}
                    setFormData={(data) =>
                      setFormData({
                        ...formData,
                        ...data,
                      })
                    }
                    onNext={handleNext}
                    onBack={handleBack}
                  />
                )}
                {currentStep === 3 && (
                  <GameSettings
                    pending={isPending}
                    formData={formData}
                    setFormData={(data) =>
                      setFormData({
                        ...formData,
                        ...data,
                      })
                    }
                    onBack={handleBack}
                    onSubmit={handleSubmit}
                  />
                )}
              </GlassPanel>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
