"use client";

import React from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";
import { Icon } from "./Icon";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  isLoading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      fullWidth = false,
      isLoading: isLoadingProp,
      loadingText,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const { pending, action } = useFormStatus();
    const isCurrentAction = pending && action === props.formAction;
    const isLoading = isLoadingProp ?? isCurrentAction;

    const baseStyles =
      "relative inline-flex items-center justify-center font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background-dark disabled:opacity-50 disabled:cursor-not-allowed rounded-lg overflow-hidden";

    const variantStyles = {
      primary:
        "bg-primary text-background-dark hover:bg-primary-dark hover:scale-[1.02] active:scale-[0.98]",
      secondary:
        "border-2 border-primary/30 text-white hover:bg-primary/10 hover:border-primary active:scale-[0.98]",
      ghost:
        "text-white hover:bg-white/10 active:bg-white/5 active:scale-[0.98]",
      outline:
        "border-2 border-white/20 text-white hover:bg-white/5 active:scale-[0.98]",
    };

    const sizeStyles = {
      sm: "h-9 px-4 text-sm",
      md: "h-12 px-5 text-base",
      lg: "h-14 px-6 text-lg",
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          isLoading && "cursor-wait",
          className
        )}
        disabled={disabled || isLoading || pending}
        {...props}
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2">
            <Icon
              name="progress_activity"
              size="sm"
              className="animate-spin"
            />
            {loadingText && <span>{loadingText}</span>}
            {!loadingText && children}
          </div>
        ) : (
          <span className="relative z-10 flex items-center justify-center gap-2">
            {children}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
