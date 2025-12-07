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

export default function CreateGame() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"chat" | "form">("chat");
  const [formData, setFormData] = useState<FormData>({
    name: "",
    password: "",
    duration: 1,
    playerCount: 1,
    gameMasterType: "ai",
    playerRole: "player_a",
    maxDistance: 3,
  });

  // Load user's preferred mode from localStorage
  useEffect(() => {
    const savedMode = localStorage.getItem("gameCreationMode") as "chat" | "form" | null;
    if (savedMode) {
      // eslint-disable-next-line
      setMode(savedMode);
    }
  }, []);

  // Save mode preference
  const handleModeChange = (newMode: "chat" | "form") => {
    setMode(newMode);
    localStorage.setItem("gameCreationMode", newMode);
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
    <main className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-serif font-bold text-forest-deep text-center mb-8">
          Create Game
        </h1>

        {/* Mode Toggle */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-lg border border-forest-moss/30 bg-white p-1">
            <button
              onClick={() => handleModeChange("chat")}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                mode === "chat"
                  ? "bg-forest-pine text-forest-mist"
                  : "text-forest-deep hover:text-forest-pine"
              }`}
            >
              💬 Chat Mode
            </button>
            <button
              onClick={() => handleModeChange("form")}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                mode === "form"
                  ? "bg-forest-pine text-forest-mist"
                  : "text-forest-deep hover:text-forest-pine"
              }`}
            >
              📋 Form Mode
            </button>
          </div>
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
            <div className="flex justify-between mb-8">
          {steps.map((step) => (
            <div key={step.number} className="flex items-center">
              <div
                className={`
                w-8 h-8 rounded-full flex items-center justify-center
                ${
                  currentStep >= step.number
                    ? "bg-forest-pine text-forest-mist"
                    : "bg-forest-moss/30 text-forest-deep"
                }
              `}
              >
                {step.number}
              </div>
              <span className="ml-2 text-forest-deep">{step.title}</span>
              {step.number < steps.length && (
                <div className="w-24 h-1 mx-4 bg-forest-moss/30" />
              )}
            </div>
          ))}
        </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {/* Form Steps */}
            <div className="bg-white rounded-lg shadow-md p-6">
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
            </div>
          </>
        )}
      </div>
    </main>
  );
}
