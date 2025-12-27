"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/Button";
import { Icon } from "@/app/components/ui/Icon";
import { GlassPanel } from "@/app/components/ui/GlassPanel";

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
          <p className="text-gray-300 leading-relaxed">
            Wild Trails transforms traditional orienteering into an engaging treasure hunt
            where you start from point A and must discover the location of your destination
            (point B) by visiting optional waypoints that provide hints and puzzles along the way.
          </p>
          <p className="text-gray-300 leading-relaxed">
            Combine elements of orienteering, geocaching, and puzzle-solving while testing
            your outdoor navigation and survival skills!
          </p>
          <div className="flex justify-center pt-4">
            <Image
              src="/wolf_footprint.svg"
              alt="Wild Trails"
              width={80}
              height={80}
              className="wolf-footprint-glow opacity-40"
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
          <ul className="space-y-3 text-gray-300">
            <li className="flex gap-3 items-start">
              <Icon name="location_on" size="md" className="text-primary flex-shrink-0 mt-1" />
              <span>Start at point A and discover the location of point B</span>
            </li>
            <li className="flex gap-3 items-start">
              <Icon name="schedule" size="md" className="text-primary flex-shrink-0 mt-1" />
              <span>Direct distance between points correlates to time needed</span>
            </li>
            <li className="flex gap-3 items-start">
              <Icon name="map" size="md" className="text-primary flex-shrink-0 mt-1" />
              <span>Multiple waypoints (2-10) between start and goal provide hints</span>
            </li>
            <li className="flex gap-3 items-start">
              <Icon name="explore" size="md" className="text-primary flex-shrink-0 mt-1" />
              <span>Points fan out from start, guiding you toward the goal without giving away exact location</span>
            </li>
          </ul>
          <div className="pt-4">
            <Image
              src="/docs/concept-map.png"
              alt="Game concept map"
              width={400}
              height={300}
              className="mx-auto rounded-lg border border-white/10"
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
          <ol className="space-y-4 text-gray-300">
            <li className="flex gap-3">
              <span className="font-bold text-primary">1.</span>
              <div>
                <strong className="text-white">View the map area</strong> including your starting point (A)
              </div>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-primary">2.</span>
              <div>
                <strong className="text-white">Once game starts</strong>, see all waypoints between A and B
              </div>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-primary">3.</span>
              <div>
                <strong className="text-white">Travel to any waypoint</strong> - when close enough, receive hint or puzzle
              </div>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-primary">4.</span>
              <div>
                <strong className="text-white">Hints reveal information</strong> about goal location (rough area, distance from landmarks, etc.)
              </div>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-primary">5.</span>
              <div>
                <strong className="text-white">Use hints to deduce</strong> goal location and reach point B
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
          <div className="bg-primary/10 rounded-lg p-4 border border-primary/30">
            <h4 className="font-bold text-white mb-2 flex items-center gap-2">
              <Icon name="sports_esports" size="sm" className="text-primary" />
              Single Player Mode (Current Focus)
            </h4>
            <ul className="space-y-2 text-gray-300 ml-6">
              <li>• You play as <strong className="text-white">Player A</strong> (the seeker)</li>
              <li>• AI acts as <strong className="text-white">Game Master</strong> (generates points and hints)</li>
            </ul>
          </div>
          <div className="bg-surface-dark-elevated rounded-lg p-4 border border-white/10">
            <h4 className="font-bold text-gray-300 mb-2 flex items-center gap-2">
              <Icon name="group" size="sm" className="text-gray-400" />
              Future Multiplayer (Coming in Phase 2)
            </h4>
            <ul className="space-y-2 text-gray-400 ml-6">
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
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
            <p className="text-yellow-400 font-medium flex items-center gap-2">
              <Icon name="warning" size="sm" className="flex-shrink-0" />
              <span>Safety first! Wild Trails involves outdoor navigation in potentially remote areas.</span>
            </p>
          </div>
          <ul className="space-y-3 text-gray-300">
            <li className="flex gap-3 items-start">
              <Icon name="explore" size="md" className="text-primary flex-shrink-0 mt-1" />
              <span><strong className="text-white">Basic map and compass knowledge</strong> - Know how to navigate in wilderness/outdoors</span>
            </li>
            <li className="flex gap-3 items-start">
              <Icon name="smartphone" size="md" className="text-primary flex-shrink-0 mt-1" />
              <span><strong className="text-white">Fully charged phone</strong> - Your primary tool for the game</span>
            </li>
            <li className="flex gap-3 items-start">
              <Icon name="checkroom" size="md" className="text-primary flex-shrink-0 mt-1" />
              <span><strong className="text-white">Proper clothing</strong> - Appropriate for terrain and weather</span>
            </li>
            <li className="flex gap-3 items-start">
              <Icon name="medical_services" size="md" className="text-primary flex-shrink-0 mt-1" />
              <span><strong className="text-white">First aid knowledge recommended</strong> - Be prepared for outdoor emergencies</span>
            </li>
            <li className="flex gap-3 items-start">
              <Icon name="water_drop" size="md" className="text-primary flex-shrink-0 mt-1" />
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
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <p className="text-blue-400 mb-2">
              <strong>Why we need location access:</strong>
            </p>
            <ul className="space-y-2 text-blue-300 ml-4">
              <li>• Track your position on the map</li>
              <li>• Detect when you&apos;re near waypoints</li>
              <li>• Calculate distances to points of interest</li>
              <li>• Show your path during the game</li>
            </ul>
          </div>

          <div className="pt-4">
            <Button
              onClick={testLocationPermission}
              disabled={locationPermission === "testing"}
              variant={
                locationPermission === "granted"
                  ? "primary"
                  : locationPermission === "denied"
                  ? "outline"
                  : "primary"
              }
              fullWidth
              size="lg"
              className={
                locationPermission === "denied"
                  ? "bg-red-500/20 border-red-500 text-red-400 hover:bg-red-500/30"
                  : ""
              }
            >
              {locationPermission === "testing" ? (
                <>
                  <Icon name="progress_activity" size="sm" className="mr-2 animate-spin" />
                  Testing location access...
                </>
              ) : locationPermission === "granted" ? (
                <>
                  <Icon name="check_circle" size="sm" className="mr-2" />
                  Location access granted
                </>
              ) : locationPermission === "denied" ? (
                <>
                  <Icon name="cancel" size="sm" className="mr-2" />
                  Location access denied
                </>
              ) : (
                <>
                  <Icon name="my_location" size="sm" className="mr-2" />
                  Test Location Access
                </>
              )}
            </Button>
          </div>

          {locationPermission === "denied" && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-sm">
              <p className="text-red-400 font-medium mb-2">
                Location access is required to play Wild Trails.
              </p>
              <p className="text-red-300">
                <strong>To enable:</strong>
              </p>
              <ul className="text-red-300 ml-4 mt-2 space-y-1">
                <li>• <strong>iOS:</strong> Settings → Privacy → Location Services → [Your Browser]</li>
                <li>• <strong>Android:</strong> Settings → Apps → [Your Browser] → Permissions → Location</li>
              </ul>
            </div>
          )}

          {locationPermission === "granted" && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-sm">
              <p className="text-green-400 flex items-center gap-2">
                <Icon name="check_circle" size="sm" />
                Great! You&apos;re all set to start your adventure.
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
          <div className="flex justify-center">
            <Icon name="celebration" size="xl" className="text-primary" />
          </div>
          <p className="text-gray-300 text-lg">
            You&apos;re ready to embark on your first Wild Trails adventure!
          </p>
          <div className="bg-primary/10 rounded-lg p-6 text-left border border-primary/30">
            <h4 className="font-bold text-white mb-3">Quick Tips:</h4>
            <ul className="space-y-2 text-gray-300">
              <li>• Start with a shorter game (1-2 km) to get familiar</li>
              <li>• Choose an area you know for your first game</li>
              <li>• Check the weather before heading out</li>
              <li>• Tell someone where you&apos;re going</li>
              <li>• Have fun and stay safe!</li>
            </ul>
          </div>
          <div className="flex flex-col gap-4 pt-4">
            <Link href="/game/create">
              <Button variant="primary" fullWidth size="lg">
                <Icon name="add" size="sm" className="mr-2" />
                Create Your First Game
              </Button>
            </Link>
            <Button
              variant="ghost"
              fullWidth
              size="lg"
              onClick={handleComplete}
            >
              <Icon name="home" size="sm" className="mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      ),
    },
  ];

  const currentStepData = steps[currentStep];

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

      <div className="relative z-10">
        {/* Header */}
        <div className="bg-surface-dark/50 backdrop-blur-glass border-b border-white/10 p-4 shadow-lg">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Icon name="menu_book" size="md" className="text-primary" />
              <h1 className="text-2xl font-black text-white">Wild Trails Tutorial</h1>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleComplete}
            >
              Skip
              <Icon name="arrow_forward" size="sm" className="ml-2" />
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-surface-dark/30 backdrop-blur-glass border-b border-white/10">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center gap-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 flex-1 rounded-full transition-colors ${
                    index <= currentStep ? "bg-primary" : "bg-white/20"
                  }`}
                />
              ))}
            </div>
            <div className="text-sm text-gray-400 mt-2 text-center">
              Step {currentStep + 1} of {steps.length}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <GlassPanel className="p-8 md:p-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-white mb-2">
                {currentStepData.title}
              </h2>
              <p className="text-gray-400">{currentStepData.subtitle}</p>
            </div>

            <div className="mb-8">{currentStepData.content}</div>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center pt-6 border-t border-white/10">
              <Button
                variant="ghost"
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
              >
                <Icon name="arrow_back" size="sm" className="mr-2" />
                Previous
              </Button>

              {currentStep === steps.length - 1 ? (
                <Link href="/game/create">
                  <Button variant="primary">
                    Create Game
                    <Icon name="arrow_forward" size="sm" className="ml-2" />
                  </Button>
                </Link>
              ) : (
                <Button
                  variant="primary"
                  onClick={() =>
                    setCurrentStep(Math.min(steps.length - 1, currentStep + 1))
                  }
                >
                  Next
                  <Icon name="arrow_forward" size="sm" className="ml-2" />
                </Button>
              )}
            </div>
          </GlassPanel>
        </div>
      </div>
    </main>
  );
}
