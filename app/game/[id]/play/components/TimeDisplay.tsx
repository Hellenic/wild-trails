import React, { useState, useEffect } from "react";

type TimeDisplayProps = {
  startedAt: Date;
  durationMinutes: number;
};

function formatTimeRemaining(remainingSeconds: number): string {
  if (remainingSeconds <= 0) return "00:00:00";

  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = Math.floor(remainingSeconds % 60);

  return [hours, minutes, seconds]
    .map((unit) => unit.toString().padStart(2, "0"))
    .join(":");
}

export function TimeDisplay({ startedAt, durationMinutes }: TimeDisplayProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>("00:00:00");

  useEffect(() => {
    const updateTime = () => {
      const gameStart = new Date(startedAt);
      
      // Handle invalid date
      if (isNaN(gameStart.getTime())) {
        setTimeRemaining("--:--:--");
        return;
      }

      const now = new Date();
      const totalSeconds = durationMinutes * 60;
      const elapsedSeconds = Math.floor(
        (now.getTime() - gameStart.getTime()) / 1000
      );
      const remainingSeconds = totalSeconds - elapsedSeconds;

      setTimeRemaining(formatTimeRemaining(remainingSeconds));
    };

    // Update immediately
    updateTime();

    // Then update every second
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [startedAt, durationMinutes]);

  return (
    <div className="bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full text-center text-lg font-black font-mono text-primary shadow-[0_0_15px_rgba(19,236,19,0.1)]">
      {timeRemaining}
    </div>
  );
}
