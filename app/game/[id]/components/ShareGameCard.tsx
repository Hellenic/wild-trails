"use client";

import React, { useState, useCallback } from "react";
import { Button, CopyButton, Icon, GlassPanel } from "@/app/components/ui";
import { cn } from "@/lib/utils";

interface ShareGameCardProps {
  gameCode: string | null;
  gameId: string;
  gameName: string;
  compact?: boolean;
}

export function ShareGameCard({ 
  gameCode, 
  gameId, 
  gameName, 
  compact = false 
}: ShareGameCardProps) {
  const [codeCopied, setCodeCopied] = useState(false);

  const displayCode = gameCode || gameId.slice(0, 8).toUpperCase();
  const joinUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/join/${gameCode || gameId}`
    : "";

  const handleCopyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(displayCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      console.error("Failed to copy");
    }
  }, [displayCode]);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${gameName} on Wild Trails`,
          text: `Join my Wild Trails game! Use code: ${displayCode}`,
          url: joinUrl,
        });
      } catch (err) {
        // User cancelled - do nothing
        if ((err as Error).name !== "AbortError") {
          // Fallback: copy link on error
          try {
            await navigator.clipboard.writeText(joinUrl);
          } catch {
            console.error("Failed to copy link");
          }
        }
      }
    } else {
      // Fallback: copy link
      try {
        await navigator.clipboard.writeText(joinUrl);
      } catch {
        console.error("Failed to copy link");
      }
    }
  }, [gameName, displayCode, joinUrl]);

  if (compact) {
    return (
      <div className="relative flex items-center gap-3 p-3 bg-surface-dark-elevated rounded-lg border border-white/10">
        <div className="flex-1">
          <div className="text-xs text-gray-400 mb-0.5">Game Code</div>
          <div 
            className="font-mono text-lg font-bold text-primary tracking-widest cursor-pointer hover:text-primary-dark transition-colors"
            onClick={handleCopyCode}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && handleCopyCode()}
            aria-label={`Game code: ${displayCode}. Click to copy.`}
          >
            {displayCode}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleShare}
          className="shrink-0"
          aria-label="Share game"
        >
          <Icon name="share" size="sm" />
        </Button>
        {codeCopied && (
          <span className="absolute -top-2 right-2 bg-primary text-background-dark text-xs font-bold px-2 py-0.5 rounded-full animate-fade-in">
            Copied!
          </span>
        )}
      </div>
    );
  }

  return (
    <GlassPanel className="p-6 border border-white/10">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Icon name="vpn_key" className="text-primary" />
          <span className="text-sm font-medium text-gray-400 uppercase tracking-wide">
            Share Game
          </span>
        </div>

        {/* Game Code Display - Clickable to copy */}
        <div className="relative mb-6">
          <div 
            className={cn(
              "font-mono text-3xl md:text-4xl font-black text-primary tracking-[0.25em] py-3 px-4",
              "bg-surface-dark-elevated rounded-lg border border-primary/20",
              "cursor-pointer hover:border-primary/40 transition-all"
            )}
            onClick={handleCopyCode}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && handleCopyCode()}
            aria-label={`Game code: ${displayCode}. Click to copy.`}
          >
            {displayCode}
          </div>
          {codeCopied && (
            <div className="absolute -top-2 right-2 bg-primary text-background-dark text-xs font-bold px-2 py-1 rounded-full animate-fade-in">
              Copied!
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <CopyButton
            textToCopy={displayCode}
            variant="outline"
            size="md"
            className="flex-1 sm:flex-none"
          >
            Copy Code
          </CopyButton>

          <CopyButton
            textToCopy={joinUrl}
            variant="outline"
            size="md"
            className="flex-1 sm:flex-none"
          >
            Copy Link
          </CopyButton>

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

        <p className="text-xs text-gray-500 mt-4">
          Share this code with friends to let them join your game
        </p>
      </div>
    </GlassPanel>
  );
}
