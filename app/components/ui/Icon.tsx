import React from "react";
import { cn } from "@/lib/utils";

export interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: string;
  fill?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

export const Icon = React.forwardRef<HTMLSpanElement, IconProps>(
  ({ name, fill = false, size = "md", className, ...props }, ref) => {
    const sizeStyles = {
      sm: "text-xl",
      md: "text-2xl",
      lg: "text-4xl",
      xl: "text-5xl",
    };

    return (
      <span
        ref={ref}
        className={cn(
          "material-symbols-outlined inline-flex items-center justify-center",
          fill && "material-symbols-outlined-fill",
          sizeStyles[size],
          className
        )}
        style={{ verticalAlign: 'middle' }}
        {...props}
      >
        {name}
      </span>
    );
  }
);

Icon.displayName = "Icon";
