import React from 'react';

interface CampaignLogoProps {
  logo?: string | null;
  brandName?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const CampaignLogo: React.FC<CampaignLogoProps> = ({
  logo,
  brandName = 'Brand',
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 sm:w-16 sm:h-16 text-lg',
    lg: 'w-20 h-20 sm:w-24 sm:h-24 text-xl'
  };

  const getLogoUrl = (logoPath: string) => {
    // If it's already a full URL, return as is
    if (logoPath.startsWith('http://') || logoPath.startsWith('https://')) {
      return logoPath;
    }

    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://nexacreators.com.br';

    // If it starts with /, it's a relative path from the backend
    if (logoPath.startsWith('/')) {
      return `${backendUrl}${logoPath}`;
    }

    // Otherwise, assume it's a relative path and prepend the backend URL
    return `${backendUrl}/${logoPath}`;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (logo) {
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold overflow-hidden ${className}`}>
        <img
          src={getLogoUrl(logo)}
          alt={`${brandName} logo`}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to initials if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              parent.textContent = getInitials(brandName);
            }
          }}
        />
      </div>
    );
  }

  // Fallback to brand initials
  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold ${className}`}>
      {getInitials(brandName)}
    </div>
  );
};

export default CampaignLogo; 