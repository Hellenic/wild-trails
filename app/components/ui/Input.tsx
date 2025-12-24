import React from "react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, fullWidth = true, className = "", ...props }, ref) => {
    const baseStyles =
      "h-12 rounded-lg border bg-surface-dark-elevated text-white placeholder:text-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed";

    const errorStyles = error
      ? "border-red-500 focus:ring-red-500"
      : "border-white/10 focus:border-primary";

    const widthStyles = fullWidth ? "w-full" : "";

    return (
      <div className={widthStyles}>
        {label && (
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`${baseStyles} ${errorStyles} ${widthStyles} ${className} px-4`}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
