import React from "react";

export interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: string;
  fill?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

export const Icon = React.forwardRef<HTMLSpanElement, IconProps>(
  ({ name, fill = false, size = "md", className = "", ...props }, ref) => {
    const sizeStyles = {
      sm: "text-xl",
      md: "text-2xl",
      lg: "text-4xl",
      xl: "text-5xl",
    };

    const fillStyle = fill ? "material-symbols-outlined-fill" : "";

    return (
      <span
        ref={ref}
        className={`material-symbols-outlined ${fillStyle} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {name}
      </span>
    );
  }
);

Icon.displayName = "Icon";
