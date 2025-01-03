"use client";

import { useFormStatus } from "react-dom";
import { ComponentProps } from "react";

interface LoadingButtonProps extends ComponentProps<"button"> {
  children: React.ReactNode;
  loadingText?: string;
}

export function LoadingButton({
  children,
  loadingText = "Loading...",
  ...props
}: LoadingButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button {...props} disabled={pending}>
      {pending ? loadingText : children}
    </button>
  );
}
