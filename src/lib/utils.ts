import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper function to get proper avatar URL
export const getAvatarUrl = (imagePath: string | null): string | null => {
  if (!imagePath) return null;
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // If it's a relative path starting with /storage/, construct full URL
  if (imagePath.startsWith('/storage/')) {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "https://nexacreators.com.br";
    return `${backendUrl}${imagePath}`;
  }
  
  // If it's just a filename or path without /storage/, add the storage prefix
  if (!imagePath.startsWith('/')) {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "https://nexacreators.com.br";
    return `${backendUrl}/storage/avatars/${imagePath}`;
  }
  
  // Default fallback
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "https://nexacreators.com.br";
  return `${backendUrl}${imagePath}`;
};
