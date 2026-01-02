"use client";

import React, { useState, useCallback } from "react";
import { Button, type ButtonProps } from "./Button";
import { Icon } from "./Icon";
import { cn } from "@/lib/utils";

export interface CopyButtonProps extends Omit<ButtonProps, "onClick"> {
  /** The text to copy to clipboard */
  textToCopy: string;
  /** Duration in ms to show "Copied!" feedback (default: 2000) */
  feedbackDuration?: number;
  /** Custom success message (default: "Copied!") */
  successMessage?: string;
  /** Called after successful copy */
  onCopy?: () => void;
  /** Called on copy error */
  onCopyError?: (error: Error) => void;
  /** Show icon only (no text) */
  iconOnly?: boolean;
}

export const CopyButton = React.forwardRef<HTMLButtonElement, CopyButtonProps>(
  (
    {
      textToCopy,
      feedbackDuration = 2000,
      successMessage = "Copied!",
      onCopy,
      onCopyError,
      iconOnly = false,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(async () => {
      try {
        await navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        onCopy?.();
        setTimeout(() => setCopied(false), feedbackDuration);
      } catch (err) {
        console.error("Failed to copy:", err);
        onCopyError?.(err as Error);
      }
    }, [textToCopy, feedbackDuration, onCopy, onCopyError]);

    return (
      <Button
        ref={ref}
        onClick={handleCopy}
        className={cn("relative", className)}
        aria-label={iconOnly ? "Copy to clipboard" : undefined}
        {...props}
      >
        {iconOnly ? (
          <Icon name={copied ? "check" : "content_copy"} size="sm" />
        ) : (
          <>
            <Icon 
              name={copied ? "check" : "content_copy"} 
              size="sm" 
              className="mr-2" 
            />
            {children}
          </>
        )}
        {copied && (
          <span 
            className={cn(
              "absolute -top-2 -right-2 bg-primary text-background-dark",
              "text-xs font-bold px-2 py-0.5 rounded-full animate-fade-in"
            )}
          >
            {successMessage}
          </span>
        )}
      </Button>
    );
  }
);

CopyButton.displayName = "CopyButton";

