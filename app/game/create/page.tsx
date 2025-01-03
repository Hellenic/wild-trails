"use client";

import React, { useState, useTransition } from "react";
import { GameBasicInfo } from "./components/GameBasicInfo";
import { GameMapSelection } from "./components/GameMapSelection";
import { GameSettings } from "./components/GameSettings";
import { LatLng } from "@/utils/map";
import { createGame } from "@/app/actions/games";
import type { GameDetails } from "@/types/game";

type FormData = {
  name: string;
  password: string;
  mapArea?: GameDetails["bounding_box"];
  startingPoint?: LatLng;
  duration: number;
  maxDistance: number;
  playerCount: number;
  gameMasterType: "player" | "ai";
  playerRole: "playerA" | "playerB" | "gameMaster";
};

export default function CreateGame() {
  const [isPending, startTransition] = useTransition();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    password: "",
    duration: 2,
    playerCount: 1,
    gameMasterType: "ai",
    playerRole: "playerA",
    maxDistance: 10,
  });

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

  const handleSubmit = () => {
    if (!formData.startingPoint || !formData.mapArea) {
      console.warn("TODO Handle this");
      return;
    }

    const gameSettings: Partial<GameDetails> = {
      name: formData.name,
      password: formData.password,
      duration: formData.duration * 60, // Duration, from hours to minutes
      max_radius: formData.maxDistance,
      player_count: formData.playerCount,
      game_mode: "single_player",
      selected_role: "player_a",
      // selected_role: formData.playerRole,
      game_master: formData.gameMasterType,
      starting_point: {
        lat: formData.startingPoint.lat,
        lng: formData.startingPoint.lng,
      },
      bounding_box: formData.mapArea,
    };

    startTransition(() => {
      createGame(gameSettings);
    });
  };

  return (
    <main className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-serif font-bold text-forest-deep text-center mb-8">
          Create Game
        </h1>

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
      </div>
    </main>
  );
}
