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
      const now = new Date();
      const gameStart = new Date(startedAt);
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
    <div className="bg-forest-mist/80 backdrop-blur-sm p-2 text-center text-xl font-mono">
      {timeRemaining}
    </div>
  );
}
