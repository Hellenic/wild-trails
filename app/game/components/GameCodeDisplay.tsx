"use client";

import React, { useState } from "react";
import { Button, Icon, GlassPanel } from "@/app/components/ui";
import { cn } from "@/lib/utils";

interface GameCodeDisplayProps {
  gameCode: string | null;
  gameId: string;
  gameName: string;
}

export function GameCodeDisplay({ gameCode, gameId, gameName }: GameCodeDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [shareError, setShareError] = useState(false);

  const displayCode = gameCode || gameId.slice(0, 8).toUpperCase();
  const joinUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/join/${gameCode || gameId}`
    : "";

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(displayCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${gameName} on Wild Trails`,
          text: `Join my Wild Trails game! Use code: ${displayCode}`,
          url: joinUrl,
        });
      } catch (err) {
        // User cancelled or error
        if ((err as Error).name !== "AbortError") {
          setShareError(true);
          setTimeout(() => setShareError(false), 2000);
        }
      }
    } else {
      // Fallback to copy link
      handleCopyLink();
    }
  };

  return (
    <GlassPanel className="p-6 border border-white/10">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Icon name="vpn_key" className="text-primary" />
          <span className="text-sm font-medium text-gray-400 uppercase tracking-wide">
            Game Code
          </span>
        </div>

        {/* Large code display */}
        <div className="relative mb-4">
          <div 
            className="font-mono text-4xl md:text-5xl font-black text-primary tracking-[0.3em] py-4 px-6 bg-surface-dark-elevated rounded-lg border border-primary/20 cursor-pointer hover:border-primary/40 transition-all"
            onClick={handleCopyCode}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && handleCopyCode()}
            aria-label={`Game code: ${displayCode}. Click to copy.`}
          >
            {displayCode}
          </div>
          <div 
            className={cn(
              "absolute -top-2 -right-2 bg-primary text-background-dark text-xs font-bold px-2 py-1 rounded-full transition-all",
              copied ? "opacity-100 scale-100" : "opacity-0 scale-75"
            )}
          >
            Copied!
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            size="md"
            onClick={handleCopyCode}
            className="flex-1 sm:flex-none"
          >
            <Icon name="content_copy" size="sm" className="mr-2" />
            Copy Code
          </Button>

          <Button
            variant="outline"
            size="md"
            onClick={handleCopyLink}
            className="flex-1 sm:flex-none"
          >
            <Icon name="link" size="sm" className="mr-2" />
            Copy Link
          </Button>

          {typeof navigator !== "undefined" && "share" in navigator && (
            <Button
              variant="primary"
              size="md"
              onClick={handleShare}
              className="flex-1 sm:flex-none"
            >
              <Icon name="share" size="sm" className="mr-2" />
              Share
            </Button>
          )}
        </div>

        {shareError && (
          <p className="text-red-400 text-sm mt-2">Failed to share. Try copying the link instead.</p>
        )}

        <p className="text-xs text-gray-500 mt-4">
          Share this code with your friends so they can join the game
        </p>
      </div>
    </GlassPanel>
  );
}

