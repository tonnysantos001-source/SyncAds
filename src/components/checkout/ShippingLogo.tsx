import React from 'react';
import { Truck } from 'lucide-react';

interface ShippingLogoProps {
  name: string;
  className?: string;
  size?: number;
}

export const ShippingLogo: React.FC<ShippingLogoProps> = ({ name, className = "", size = 24 }) => {
  const nameLower = name.toLowerCase();

  // Detecta se é Correios (PAC, SEDEX, etc.)
  const isCorreios = nameLower.includes('correios') || nameLower.includes('pac') || nameLower.includes('sedex');
  const isSedex = nameLower.includes('sedex');
  const isPac = nameLower.includes('pac');

  if (isCorreios) {
    return (
      <div className={`flex items-center gap-1.5 ${className}`} style={{ height: `${size}px` }}>
        {/* Correios Logo Symbol */}
        <svg
          viewBox="0 0 120 92"
          className="h-full w-auto flex-shrink-0"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="correiosYellowArrow" x1="68.8418" y1="28.8938" x2="10.0538" y2="74.824" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#FFDD00"/>
              <stop offset="0.9" stopColor="#D49F00"/>
              <stop offset="1" stopColor="#FFDD00"/>
            </linearGradient>
            <linearGradient id="correiosYellowArrowDark" x1="70.0161" y1="75.8603" x2="27.2177" y2="75.8603" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#D49F00"/>
              <stop offset="1" stopColor="#AB5808"/>
            </linearGradient>
            <linearGradient id="correiosBlueArrow" x1="55.9278" y1="62.2183" x2="114.8193" y2="16.3725" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#00537E"/>
              <stop offset="0.9" stopColor="#18AAE2"/>
              <stop offset="1" stopColor="#107BC0"/>
            </linearGradient>
            <linearGradient id="correiosBlueArrowDark" x1="91.8037" y1="-4.211" x2="66.7936" y2="15.329" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#002542"/>
              <stop offset="1" stopColor="#004169"/>
            </linearGradient>
          </defs>
          {/* Yellow Arrow */}
          <path fill="url(#correiosYellowArrow)" d="M31.7,91.2h-4c-3.2,0-6.1-1.5-8-3.9L0.7,62.9C0.3,62.3,0,61.6,0,60.8c0-0.8,0.3-1.5,0.7-2.1l19.1-24.4c1.9-2.4,4.7-3.9,8-3.9H70l-24,30.1L28.5,82.6L31.7,91.2z"/>
          <path fill="url(#correiosYellowArrowDark)" d="M46.3,60.8l-0.2-0.3L28.5,82.6c-0.7,0.9-1.3,2.1-1.3,4.1c0,2,1.9,4.5,5.7,4.5H70L46.3,60.8z"/>
          <path fill="#FFD500" d="M27.6,83c-0.7,0.9-1.1,1.9-1.1,3.1c0,2.8,2.3,5.1,5.1,5.1h1.3c-2.8,0-5.1-2.3-5.1-5.1c0-1.2,0.4-2.3,1.1-3.1l17.4-22.2L70,30.5L27.6,83z"/>
          
          {/* Blue Arrow */}
          <path fill="url(#correiosBlueArrow)" d="M96.3,8.6L93.1,0h4c3.2,0,6.1,1.5,8,3.9l19.1,24.4c0.4,0.6,0.7,1.3,0.7,2.1c0,0.8-0.3,1.5-0.7,2.1L105,56.9c-1.9,2.4-4.7,3.9-8,3.9H54.8l24-30.1L96.3,8.6z"/>
          <path fill="url(#correiosBlueArrowDark)" d="M78.6,30.4l0.2,0.3L96.3,8.6c0.7-0.9,1.3-2.1,1.3-4.1c0-2-1.9-4.5-5.7-4.5H54.8L78.6,30.4z"/>
          <path fill="#0BBBEF" d="M97.3,8.2c0.7-0.9,1.1-1.9,1.1-3.1c0-2.8-2.3-5.1-5.1-5.1H92C94.8,0,97,2.3,97,5.1c0,1.2-0.4,2.3-1.1,3.1L78.6,30.4L54.9,60.7L97.3,8.2z"/>
        </svg>

        {/* Text Badge for PAC / SEDEX to look highly premium */}
        {isSedex && (
          <span className="text-[10px] font-black italic tracking-tighter bg-[#ffc107] text-[#002542] px-1 py-0.5 rounded border border-[#002542]/20">
            SEDEX
          </span>
        )}
        {isPac && (
          <span className="text-[10px] font-black italic tracking-tighter bg-[#28a745] text-white px-1 py-0.5 rounded border border-[#28a745]/20">
            PAC
          </span>
        )}
        {!isSedex && !isPac && (
          <span className="text-[10px] font-bold text-[#005CA9]">
            Correios
          </span>
        )}
      </div>
    );
  }

  // Se for Frete Grátis genérico
  if (nameLower.includes('grátis') || nameLower.includes('gratis') || nameLower.includes('free')) {
    return (
      <div className={`flex items-center gap-1 text-[#28a745] ${className}`} style={{ height: `${size}px` }}>
        <Truck className="h-full w-auto flex-shrink-0" style={{ height: `${size}px` }} />
        <span className="text-[9px] font-extrabold uppercase tracking-wide bg-[#28a745]/10 px-1 py-0.5 rounded border border-[#28a745]/20">
          Grátis
        </span>
      </div>
    );
  }

  // Fallback padrão (caminhão de entrega cinza)
  return (
    <div className={`flex items-center ${className}`} style={{ height: `${size}px` }}>
      <Truck className="text-gray-400 h-full w-auto flex-shrink-0" style={{ height: `${size}px` }} />
    </div>
  );
};
