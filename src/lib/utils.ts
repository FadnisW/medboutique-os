import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility function to merge Tailwind CSS classes dynamically.
 * It combines the behavior of `clsx` (for conditional classes) and `twMerge` (to resolve Tailwind class conflicts).
 *
 * @param inputs - An array of class values (strings, objects, arrays, etc.) to be merged.
 * @returns A single string with the merged and resolved Tailwind classes.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
