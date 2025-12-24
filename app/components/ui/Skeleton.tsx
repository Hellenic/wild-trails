import React from "react";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "rectangular" | "circular";
  width?: string;
  height?: string;
}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      variant = "rectangular",
      width,
      height,
      className = "",
      style,
      ...props
    },
    ref
  ) => {
    const variantClasses = {
      text: "h-4 rounded",
      rectangular: "rounded-lg",
      circular: "rounded-full",
    };

    const defaultHeight = {
      text: "1rem",
      rectangular: "4rem",
      circular: "3rem",
    };

    return (
      <div
        ref={ref}
        className={`animate-pulse bg-white/5 ${variantClasses[variant]} ${className}`}
        style={{
          width: width,
          height: height || defaultHeight[variant],
          ...style,
        }}
        {...props}
      />
    );
  }
);

Skeleton.displayName = "Skeleton";

// Pre-made skeleton compositions
export const GameCardSkeleton = () => (
  <div className="glass-panel p-6 space-y-4">
    <div className="flex items-center gap-3">
      <Skeleton variant="text" width="200px" height="24px" />
      <Skeleton variant="rectangular" width="80px" height="24px" />
    </div>
    <div className="flex gap-4">
      <Skeleton variant="text" width="100px" />
      <Skeleton variant="text" width="100px" />
      <Skeleton variant="text" width="120px" />
    </div>
  </div>
);
