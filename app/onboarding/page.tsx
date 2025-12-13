"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [locationPermission, setLocationPermission] = useState<
    "unknown" | "granted" | "denied" | "testing"
  >("unknown");

  useEffect(() => {
    // Check if user has seen onboarding before
    // const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding");
    // We won't auto-redirect since they might want to review
  }, []);

  const handleComplete = () => {
    localStorage.setItem("hasSeenOnboarding", "true");
    router.push("/");
  };

  const testLocationPermission = async () => {
    setLocationPermission("testing");
    try {
      const result = await navigator.permissions.query({ name: "geolocation" });
      if (result.state === "granted") {
        // Try to actually get location
        await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 10000,
          });
        });
        setLocationPermission("granted");
      } else if (result.state === "denied") {
        setLocationPermission("denied");
      } else {
        // Prompt for permission
        await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 10000,
          });
        });
        setLocationPermission("granted");
      }
    } catch (error) {
      console.error("Location permission error:", error);
      setLocationPermission("denied");
    }
  };

  const steps = [
    {
      title: "Welcome to Wild Trails",
      subtitle: "An outdoor adventure treasure hunt",
      content: (
        <div className="space-y-4 text-left">
          <p className="text-gray-700 leading-relaxed">
            Wild Trails transforms traditional orienteering into an engaging treasure hunt
            where you start from point A and must discover the location of your destination
            (point B) by visiting optional waypoints that provide hints and puzzles along the way.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Combine elements of orienteering, geocaching, and puzzle-solving while testing
            your outdoor navigation and survival skills!
          </p>
          <div className="flex justify-center pt-4">
            <Image
              src="/wolf_footprint.svg"
              alt="Wild Trails"
              width={80}
              height={80}
              className="opacity-40"
            />
          </div>
        </div>
      ),
    },
    {
      title: "The Concept",
      subtitle: "How the game works",
      content: (
        <div className="space-y-4 text-left">
          <ul className="space-y-3 text-gray-700">
            <li className="flex gap-3">
              <span className="text-2xl">📍</span>
              <span>Start at point A and discover the location of point B</span>
            </li>
            <li className="flex gap-3">
              <span className="text-2xl">⏱️</span>
              <span>Direct distance between points correlates to time needed</span>
            </li>
            <li className="flex gap-3">
              <span className="text-2xl">🗺️</span>
              <span>Multiple waypoints (2-10) between start and goal provide hints</span>
            </li>
            <li className="flex gap-3">
              <span className="text-2xl">🧭</span>
              <span>Points fan out from start, guiding you toward the goal without giving away exact location</span>
            </li>
          </ul>
          <div className="pt-4">
            <Image
              src="/docs/concept-map.png"
              alt="Game concept map"
              width={400}
              height={300}
              className="mx-auto rounded-lg border border-gray-300"
              onError={(e) => {
                // Hide image if not found
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        </div>
      ),
    },
    {
      title: "How to Play",
      subtitle: "Your adventure step-by-step",
      content: (
        <div className="space-y-4 text-left">
          <ol className="space-y-4 text-gray-700">
            <li className="flex gap-3">
              <span className="font-bold text-forest-pine">1.</span>
              <div>
                <strong>View the map area</strong> including your starting point (A)
              </div>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-forest-pine">2.</span>
              <div>
                <strong>Once game starts</strong>, see all waypoints between A and B
              </div>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-forest-pine">3.</span>
              <div>
                <strong>Travel to any waypoint</strong> - when close enough, receive hint or puzzle
              </div>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-forest-pine">4.</span>
              <div>
                <strong>Hints reveal information</strong> about goal location (rough area, distance from landmarks, etc.)
              </div>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-forest-pine">5.</span>
              <div>
                <strong>Use hints to deduce</strong> goal location and reach point B
              </div>
            </li>
          </ol>
        </div>
      ),
    },
    {
      title: "Game Roles",
      subtitle: "Single player and multiplayer modes",
      content: (
        <div className="space-y-6 text-left">
          <div className="bg-forest-pine/10 rounded-lg p-4 border border-forest-pine/30">
            <h4 className="font-bold text-forest-deep mb-2 flex items-center gap-2">
              <span>🎮</span> Single Player Mode (Current Focus)
            </h4>
            <ul className="space-y-2 text-gray-700 ml-6">
              <li>• You play as <strong>Player A</strong> (the seeker)</li>
              <li>• AI acts as <strong>Game Master</strong> (generates points and hints)</li>
            </ul>
          </div>
          <div className="bg-gray-100 rounded-lg p-4 border border-gray-300">
            <h4 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
              <span>🤝</span> Future Multiplayer (Coming in Phase 2)
            </h4>
            <ul className="space-y-2 text-gray-600 ml-6">
              <li>• Two players can play together as Player A</li>
              <li>• Or one as Player A, one as Player B or Game Master</li>
              <li>• Three+ players for advanced 24-hour wilderness games</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      title: "What You Need",
      subtitle: "Equipment and skills",
      content: (
        <div className="space-y-4 text-left">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-yellow-800 font-medium">
              ⚠️ Safety first! Wild Trails involves outdoor navigation in potentially remote areas.
            </p>
          </div>
          <ul className="space-y-3 text-gray-700">
            <li className="flex gap-3">
              <span className="text-2xl">🧭</span>
              <span><strong>Basic map and compass knowledge</strong> - Know how to navigate in wilderness/outdoors</span>
            </li>
            <li className="flex gap-3">
              <span className="text-2xl">📱</span>
              <span><strong>Fully charged phone</strong> - Your primary tool for the game</span>
            </li>
            <li className="flex gap-3">
              <span className="text-2xl">👕</span>
              <span><strong>Proper clothing</strong> - Appropriate for terrain and weather</span>
            </li>
            <li className="flex gap-3">
              <span className="text-2xl">🏥</span>
              <span><strong>First aid knowledge recommended</strong> - Be prepared for outdoor emergencies</span>
            </li>
            <li className="flex gap-3">
              <span className="text-2xl">💧</span>
              <span>Water, snacks, and other outdoor essentials</span>
            </li>
          </ul>
        </div>
      ),
    },
    {
      title: "Location Permissions",
      subtitle: "Required for gameplay",
      content: (
        <div className="space-y-4 text-left">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 mb-2">
              <strong>Why we need location access:</strong>
            </p>
            <ul className="space-y-2 text-blue-700 ml-4">
              <li>• Track your position on the map</li>
              <li>• Detect when you&apos;re near waypoints</li>
              <li>• Calculate distances to points of interest</li>
              <li>• Show your path during the game</li>
            </ul>
          </div>

          <div className="pt-4">
            <button
              onClick={testLocationPermission}
              disabled={locationPermission === "testing"}
              className={`w-full px-6 py-3 rounded-lg font-medium transition-colors ${
                locationPermission === "granted"
                  ? "bg-green-500 text-white"
                  : locationPermission === "denied"
                  ? "bg-red-500 text-white"
                  : "bg-forest-pine text-forest-mist hover:bg-forest-moss"
              }`}
            >
              {locationPermission === "testing"
                ? "Testing location access..."
                : locationPermission === "granted"
                ? "✓ Location access granted"
                : locationPermission === "denied"
                ? "✗ Location access denied"
                : "🎯 Test Location Access"}
            </button>
          </div>

          {locationPermission === "denied" && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm">
              <p className="text-red-800 font-medium mb-2">
                Location access is required to play Wild Trails.
              </p>
              <p className="text-red-700">
                <strong>To enable:</strong>
              </p>
              <ul className="text-red-700 ml-4 mt-2 space-y-1">
                <li>• <strong>iOS:</strong> Settings → Privacy → Location Services → [Your Browser]</li>
                <li>• <strong>Android:</strong> Settings → Apps → [Your Browser] → Permissions → Location</li>
              </ul>
            </div>
          )}

          {locationPermission === "granted" && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm">
              <p className="text-green-800">
                ✓ Great! You&apos;re all set to start your adventure.
              </p>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Ready to Play!",
      subtitle: "Start your first Wild Trails adventure",
      content: (
        <div className="space-y-6 text-center">
          <div className="text-6xl">🏕️</div>
          <p className="text-gray-700 text-lg">
            You&apos;re ready to embark on your first Wild Trails adventure!
          </p>
          <div className="bg-forest-pine/10 rounded-lg p-6 text-left">
            <h4 className="font-bold text-forest-deep mb-3">Quick Tips:</h4>
            <ul className="space-y-2 text-gray-700">
              <li>• Start with a shorter game (1-2 km) to get familiar</li>
              <li>• Choose an area you know for your first game</li>
              <li>• Check the weather before heading out</li>
              <li>• Tell someone where you&apos;re going</li>
              <li>• Have fun and stay safe!</li>
            </ul>
          </div>
          <div className="flex flex-col gap-4 pt-4">
            <Link
              href="/game/create"
              className="px-8 py-4 bg-forest-pine text-forest-mist rounded-lg hover:bg-forest-moss transition-colors font-bold text-lg"
            >
              🎮 Create Your First Game
            </Link>
            <button
              onClick={handleComplete}
              className="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Back to Home
            </button>
          </div>
        </div>
      ),
    },
  ];

  const currentStepData = steps[currentStep];

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-forest-pine text-forest-mist p-4 shadow-md">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-serif font-bold">Wild Trails Tutorial</h1>
          <button
            onClick={handleComplete}
            className="text-forest-mist hover:text-white transition-colors"
          >
            Skip →
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  index <= currentStep ? "bg-forest-pine" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
          <div className="text-sm text-gray-600 mt-2 text-center">
            Step {currentStep + 1} of {steps.length}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-serif font-bold text-forest-deep mb-2">
              {currentStepData.title}
            </h2>
            <p className="text-gray-600">{currentStepData.subtitle}</p>
          </div>

          <div className="mb-8">{currentStepData.content}</div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-200">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                currentStep === 0
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              ← Previous
            </button>

            {currentStep === steps.length - 1 ? (
              <Link
                href="/game/create"
                className="px-6 py-2 bg-forest-pine text-forest-mist rounded-lg hover:bg-forest-moss transition-colors font-medium"
              >
                Create Game →
              </Link>
            ) : (
              <button
                onClick={() =>
                  setCurrentStep(Math.min(steps.length - 1, currentStep + 1))
                }
                className="px-6 py-2 bg-forest-pine text-forest-mist rounded-lg hover:bg-forest-moss transition-colors font-medium"
              >
                Next →
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
