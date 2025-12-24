import React from "react";

export interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "dark" | "light";
  children: React.ReactNode;
}

export const GlassPanel = React.forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ variant = "dark", className = "", children, ...props }, ref) => {
    const variantStyles =
      variant === "dark" ? "glass-panel" : "glass-panel-light";

    return (
      <div
        ref={ref}
        className={`${variantStyles} rounded-2xl shadow-2xl ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassPanel.displayName = "GlassPanel";
