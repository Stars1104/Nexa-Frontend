/**
 * Utility functions for handling image URLs, especially campaign logos
 * Prevents broken images by validating URLs before rendering
 */

/**
 * Validates if a logo path is valid (not null, undefined, or empty)
 * 
 * @param logo - Logo path from backend
 * @returns true if logo is valid, false otherwise
 */
export const isValidLogo = (logo: string | null | undefined): boolean => {
  return !!(logo && typeof logo === 'string' && logo.trim() !== '' && logo !== 'null');
};

/**
 * Builds a complete URL for a campaign logo
 * Returns null if logo is invalid to prevent broken images
 * 
 * @param logo - Logo path from backend (e.g., "/storage/campaigns/logos/file.jpg")
 * @param backendUrl - Optional backend URL (defaults to env variable or production URL)
 * @returns Complete URL or null if logo is invalid
 */
export const getCampaignLogoUrl = (
  logo: string | null | undefined,
  backendUrl?: string
): string | null => {
  // Validate logo first
  if (!isValidLogo(logo)) {
    return null;
  }

  const baseUrl = backendUrl || import.meta.env.VITE_BACKEND_URL || 'https://nexacreators.com.br';
  
  // If logo is already a full URL, return as is
  if (logo.startsWith('http://') || logo.startsWith('https://')) {
    return logo;
  }

  // If logo starts with /, it's a relative path from the backend
  if (logo.startsWith('/')) {
    return `${baseUrl}${logo}`;
  }

  // Otherwise, assume it's a relative path and prepend the backend URL
  return `${baseUrl}/${logo}`;
};

/**
 * Gets campaign initials for fallback display
 * 
 * @param title - Campaign title
 * @returns First letter(s) of the title in uppercase
 */
export const getCampaignInitials = (title: string | null | undefined): string => {
  if (!title || typeof title !== 'string') {
    return '📷';
  }
  
  const words = title.trim().split(/\s+/);
  if (words.length === 0) {
    return '📷';
  }
  
  // Get first letter of first word, or first two letters if single word
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase() || '📷';
  }
  
  // Get first letter of first two words
  return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
};

