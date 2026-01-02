import React, { useEffect, useState } from "react";
import { playGoalFound, triggerHaptic } from "@/lib/audio/sounds";
import { Icon } from "@/app/components/ui/Icon";
import { Button } from "@/app/components/ui/Button";
import { GlassPanel } from "@/app/components/ui/GlassPanel";

type GoalFoundProps = {
  onClose: () => void | Promise<void>;
  content: string;
};

export function GoalFoundPopup({ onClose, content }: GoalFoundProps) {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Play sound and haptic feedback when popup appears
    playGoalFound().catch(console.error);
    triggerHaptic([200, 100, 200, 100, 400]); // Celebratory pattern
  }, []);

  const handleViewResults = async () => {
    setIsLoading(true);
    try {
      await onClose();
    } catch (error) {
      console.error("Error completing game:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center animate-fade-in px-4">
      {/* Background with blur */}
      <div className="absolute inset-0 bg-background-dark/80 backdrop-blur-md" />
      
      <div className="relative z-10 w-full max-w-lg">
        <GlassPanel className="p-8 md:p-12 text-center border-primary/30 shadow-[0_0_50px_rgba(19,236,19,0.2)]">
          {/* Animated celebration icon */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse" />
              <Icon name="celebration" size="xl" className="text-primary text-7xl animate-bounce relative z-10" />
            </div>
          </div>
          
          {/* Title with animation */}
          <h2 className="text-4xl font-black text-white mb-2 animate-scale-in tracking-tight">
            Congratulations!
          </h2>
          <h3 className="text-xl font-bold text-primary mb-8 animate-slide-up">
            You&apos;ve reached the goal!
          </h3>
          
          {/* Content box with backdrop blur */}
          <div className="bg-surface-dark-elevated/50 border border-white/10 rounded-2xl p-6 mb-10 shadow-inner animate-slide-up animation-delay-200">
            <div className="text-lg text-gray-200 leading-relaxed italic italic-quote">
              &quot;{content}&quot;
            </div>
          </div>
          
          {/* Success indicators */}
          <div className="flex justify-center gap-6 mb-10 animate-slide-up animation-delay-400">
            <Icon name="stars" size="md" className="text-primary/60" />
            <Icon name="emoji_events" size="lg" className="text-primary shadow-lg shadow-primary/20" />
            <Icon name="stars" size="md" className="text-primary/60" />
          </div>
          
          <div className="mb-10 text-sm font-black uppercase tracking-[0.3em] text-gray-500 animate-fade-in animation-delay-600">
            Adventure Complete
          </div>
          
          <Button
            onClick={handleViewResults}
            variant="primary"
            fullWidth
            size="lg"
            isLoading={isLoading}
            loadingText="Loading..."
            className="shadow-xl shadow-primary/20 animate-slide-up animation-delay-800"
          >
            View Results
            <Icon name="arrow_forward" size="sm" className="ml-2" />
          </Button>
        </GlassPanel>
      </div>
    </div>
  );
}
