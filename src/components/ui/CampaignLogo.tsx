import React from 'react';
import { getCampaignLogoUrl, getCampaignInitials } from "../../utils/imageUtils";

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

  const logoUrl = getCampaignLogoUrl(logo);

  if (logoUrl) {
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold overflow-hidden ${className}`}>
        <img
          src={logoUrl}
          alt={`${brandName} logo`}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to initials if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              parent.textContent = getCampaignInitials(brandName);
            }
          }}
        />
      </div>
    );
  }

  // Fallback to brand initials
  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold ${className}`}>
      {getCampaignInitials(brandName)}
    </div>
  );
};

export default CampaignLogo; 