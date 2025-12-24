import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx for conditional classes with tailwind-merge for conflict resolution
 * 
 * @example
 * cn("px-2 py-1", isActive && "bg-blue-500", className)
 * cn({ "text-red-500": hasError }, "font-bold")
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
