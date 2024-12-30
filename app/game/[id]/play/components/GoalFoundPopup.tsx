import React from "react";

type GoalFoundProps = {
  onClose: () => void;
  content: string;
};

export function GoalFoundPopup({ onClose, content }: GoalFoundProps) {
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-blue-500 to-blue-600 z-50 flex flex-col text-white">
      <div className="flex-1 p-6 flex flex-col items-center text-center">
        <div className="mb-8 text-4xl">🎉</div>
        <h2 className="text-3xl font-bold mb-4">Congratulations!</h2>
        <h3 className="text-xl mb-6">You&apos;ve found the goal!</h3>
        <div className="bg-white/10 rounded-lg p-6 mb-6 backdrop-blur-sm">
          <div className="text-lg">{content}</div>
        </div>
        <div className="text-lg opacity-80">Game Over</div>
      </div>
      <button
        onClick={onClose}
        className="w-full p-4 bg-white/20 hover:bg-white/30 text-white font-semibold transition-colors"
      >
        Finish Game
      </button>
    </div>
  );
}
