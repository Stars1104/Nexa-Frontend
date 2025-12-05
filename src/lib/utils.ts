import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export const getAvatarUrl = (imagePath: string | null): string | null => {
  if (!imagePath) return null;
  
  
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  
  if (imagePath.startsWith('/storage/')) {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "https://nexacreators.com.br";
    return `${backendUrl}${imagePath}`;
  }
  
  
  if (!imagePath.startsWith('/')) {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "https://nexacreators.com.br";
    return `${backendUrl}/storage/avatars/${imagePath}`;
  }
  
  
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "https://nexacreators.com.br";
  return `${backendUrl}${imagePath}`;
};
