export const isValidLogo = (logo: string | null | undefined): boolean => {
  return !!(logo && typeof logo === 'string' && logo.trim() !== '' && logo !== 'null');
};

export const getCampaignLogoUrl = (
  logo: string | null | undefined,
  backendUrl?: string
): string | null => {
  if (!isValidLogo(logo)) {
    return null;
  }

  const baseUrl = backendUrl || import.meta.env.VITE_BACKEND_URL || 'https://nexacreators.com.br';
  
  if (logo.startsWith('http://') || logo.startsWith('https://')) {
    return logo;
  }

  if (logo.startsWith('/')) {
    return `${baseUrl}${logo}`;
  }

  return `${baseUrl}/${logo}`;
};

export const getCampaignInitials = (title: string | null | undefined): string => {
  if (!title || typeof title !== 'string') {
    return '📷';
  }
  
  const words = title.trim().split(/\s+/);
  if (words.length === 0) {
    return '📷';
  }
  
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase() || '📷';
  }
  
  return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
};
