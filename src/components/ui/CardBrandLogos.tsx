import React from 'react';

interface CardBrandLogosProps {
  className?: string;
}

const CardBrandLogos: React.FC<CardBrandLogosProps> = ({ className = "" }) => {
  const cardBrands = [
    {
      name: 'visa',
      label: 'VISA',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      logo: (
        <div className="flex items-center">
          <div className="w-6 h-6 bg-blue-600 rounded-sm flex items-center justify-center mr-1">
            <span className="text-white text-xs font-bold">V</span>
          </div>
          <span className="font-bold text-blue-600 text-sm">VISA</span>
        </div>
      )
    },
    {
      name: 'mastercard',
      label: 'Mastercard',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      logo: (
        <div className="flex items-center">
          <div className="w-6 h-6 bg-gradient-to-r from-red-500 to-yellow-500 rounded-full flex items-center justify-center mr-1">
            <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            </div>
          </div>
          <span className="font-bold text-red-600 text-sm">Mastercard</span>
        </div>
      )
    },
    {
      name: 'discover',
      label: 'DISCOVER',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      logo: (
        <div className="flex items-center">
          <div className="w-6 h-6 bg-orange-600 rounded-sm flex items-center justify-center mr-1">
            <span className="text-white text-xs font-bold">D</span>
          </div>
          <span className="font-bold text-orange-600 text-sm">DISCOVER</span>
        </div>
      )
    },
    {
      name: 'jcb',
      label: 'JCB',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      logo: (
        <div className="flex items-center">
          <div className="w-6 h-6 bg-green-600 rounded-sm flex items-center justify-center mr-1">
            <span className="text-white text-xs font-bold">J</span>
          </div>
          <span className="font-bold text-green-600 text-sm">JCB</span>
        </div>
      )
    },
    {
      name: 'unionpay',
      label: 'UnionPay',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      logo: (
        <div className="flex items-center">
          <div className="w-6 h-6 bg-blue-600 rounded-sm flex items-center justify-center mr-1">
            <span className="text-white text-xs font-bold">银</span>
          </div>
          <span className="font-bold text-blue-600 text-sm">UnionPay</span>
        </div>
      )
    },
    {
      name: 'amex',
      label: 'AMERICAN EXPRESS',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      logo: (
        <div className="flex items-center">
          <div className="w-6 h-6 bg-blue-600 rounded-sm flex items-center justify-center mr-1">
            <span className="text-white text-xs font-bold">AE</span>
          </div>
          <span className="font-bold text-blue-600 text-sm">AMEX</span>
        </div>
      )
    }
  ];

  return (
    <div className={`flex items-center justify-center space-x-6 ${className}`}>
      {cardBrands.map((brand) => (
        <div 
          key={brand.name} 
          className={`flex items-center px-3 py-2 rounded-lg border-2 ${brand.bgColor} ${brand.borderColor} transition-all hover:shadow-md`}
        >
          {brand.logo}
        </div>
      ))}
    </div>
  );
};

export default CardBrandLogos;
