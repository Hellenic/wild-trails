import React, { useEffect } from "react";
import { playGoalFound, triggerHaptic } from "@/lib/audio/sounds";

type GoalFoundProps = {
  onClose: () => void;
  content: string;
};

export function GoalFoundPopup({ onClose, content }: GoalFoundProps) {
  useEffect(() => {
    // Play sound and haptic feedback when popup appears
    playGoalFound().catch(console.error);
    triggerHaptic([200, 100, 200, 100, 400]); // Celebratory pattern
  }, []);

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-blue-500 to-blue-600 z-50 flex flex-col text-white animate-fade-in">
      <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
        {/* Animated celebration icon */}
        <div className="mb-8 text-6xl animate-bounce">🎉</div>
        
        {/* Title with animation */}
        <h2 className="text-4xl font-bold mb-4 animate-scale-in">
          Congratulations!
        </h2>
        <h3 className="text-2xl mb-8 animate-slide-up">
          You&apos;ve found the goal!
        </h3>
        
        {/* Content box with backdrop blur */}
        <div className="bg-white/20 rounded-xl p-6 mb-8 backdrop-blur-md shadow-xl max-w-md w-full animate-slide-up animation-delay-200">
          <div className="text-lg leading-relaxed">{content}</div>
        </div>
        
        {/* Success indicators */}
        <div className="flex gap-4 text-3xl mb-6 animate-slide-up animation-delay-400">
          <span>✨</span>
          <span>🏆</span>
          <span>✨</span>
        </div>
        
        <div className="text-xl opacity-90 font-medium animate-fade-in animation-delay-600">
          Game Complete!
        </div>
      </div>
      
      <button
        onClick={onClose}
        className="w-full p-5 bg-white/25 hover:bg-white/35 text-white font-bold text-lg transition-all active:scale-95 border-t border-white/30"
      >
        View Results →
      </button>
    </div>
  );
}
