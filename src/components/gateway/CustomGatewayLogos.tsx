import React from "react";

interface GatewayLogoProps {
  className?: string;
}

// PagueX - Logo com "X" estilizado
export const PagueXLogo: React.FC<GatewayLogoProps> = ({
  className = "w-full h-full",
}) => (
  <svg
    viewBox="0 0 100 100"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="100" height="100" rx="20" fill="url(#paguex-gradient)" />
    <path
      d="M30 30L70 70M70 30L30 70"
      stroke="white"
      strokeWidth="8"
      strokeLinecap="round"
    />
    <defs>
      <linearGradient id="paguex-gradient" x1="0" y1="0" x2="100" y2="100">
        <stop offset="0%" stopColor="#667eea" />
        <stop offset="100%" stopColor="#764ba2" />
      </linearGradient>
    </defs>
  </svg>
);

// Allus - Logo com "A" moderno
export const AllusLogo: React.FC<GatewayLogoProps> = ({
  className = "w-full h-full",
}) => (
  <svg
    viewBox="0 0 100 100"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="100" height="100" rx="20" fill="url(#allus-gradient)" />
    <path d="M50 25L70 75H60L55 60H45L40 75H30L50 25Z" fill="white" />
    <rect x="42" y="48" width="16" height="6" fill="white" />
    <defs>
      <linearGradient id="allus-gradient" x1="0" y1="0" x2="100" y2="100">
        <stop offset="0%" stopColor="#11998e" />
        <stop offset="100%" stopColor="#38ef7d" />
      </linearGradient>
    </defs>
  </svg>
);

// FastPay - Logo com raio/lightning
export const FastPayLogo: React.FC<GatewayLogoProps> = ({
  className = "w-full h-full",
}) => (
  <svg
    viewBox="0 0 100 100"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="100" height="100" rx="20" fill="url(#fastpay-gradient)" />
    <path d="M55 20L35 55H50L45 80L65 45H50L55 20Z" fill="white" />
    <defs>
      <linearGradient id="fastpay-gradient" x1="0" y1="0" x2="100" y2="100">
        <stop offset="0%" stopColor="#f093fb" />
        <stop offset="100%" stopColor="#f5576c" />
      </linearGradient>
    </defs>
  </svg>
);

// BlackCat - Logo com silhueta de gato
export const BlackCatLogo: React.FC<GatewayLogoProps> = ({
  className = "w-full h-full",
}) => (
  <svg
    viewBox="0 0 100 100"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="100" height="100" rx="20" fill="#1a1a1a" />
    <circle cx="50" cy="55" r="25" fill="white" />
    <path d="M35 30L25 45L35 40Z" fill="white" />
    <path d="M65 30L75 45L65 40Z" fill="white" />
    <circle cx="42" cy="50" r="3" fill="#1a1a1a" />
    <circle cx="58" cy="50" r="3" fill="#1a1a1a" />
  </svg>
);

// FirePag - Logo com chama
export const FirePagLogo: React.FC<GatewayLogoProps> = ({
  className = "w-full h-full",
}) => (
  <svg
    viewBox="0 0 100 100"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="100" height="100" rx="20" fill="url(#firepag-gradient)" />
    <path
      d="M50 20C40 30 35 40 35 50C35 61 42 70 50 70C58 70 65 61 65 50C65 40 60 30 50 20Z"
      fill="white"
    />
    <path
      d="M50 35C45 42 42 47 42 52C42 58 45 62 50 62C55 62 58 58 58 52C58 47 55 42 50 35Z"
      fill="url(#fire-inner)"
    />
    <defs>
      <linearGradient id="firepag-gradient" x1="0" y1="0" x2="100" y2="100">
        <stop offset="0%" stopColor="#ff6b6b" />
        <stop offset="100%" stopColor="#ee5a24" />
      </linearGradient>
      <linearGradient id="fire-inner" x1="50" y1="35" x2="50" y2="62">
        <stop offset="0%" stopColor="#ffd93d" />
        <stop offset="100%" stopColor="#ff6b6b" />
      </linearGradient>
    </defs>
  </svg>
);

// FlashPay - Logo com raio circular
export const FlashPayLogo: React.FC<GatewayLogoProps> = ({
  className = "w-full h-full",
}) => (
  <svg
    viewBox="0 0 100 100"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="100" height="100" rx="20" fill="url(#flashpay-gradient)" />
    <circle cx="50" cy="50" r="28" stroke="white" strokeWidth="4" />
    <path d="M55 30L40 50H50L45 70L60 50H50L55 30Z" fill="white" />
    <defs>
      <linearGradient id="flashpay-gradient" x1="0" y1="0" x2="100" y2="100">
        <stop offset="0%" stopColor="#4facfe" />
        <stop offset="100%" stopColor="#00f2fe" />
      </linearGradient>
    </defs>
  </svg>
);

// BrazaPay - Logo com bandeira Brasil
export const BrazaPayLogo: React.FC<GatewayLogoProps> = ({
  className = "w-full h-full",
}) => (
  <svg
    viewBox="0 0 100 100"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="100" height="100" rx="20" fill="#009c3b" />
    <path d="M50 25L80 50L50 75L20 50Z" fill="#fedd00" />
    <circle cx="50" cy="50" r="12" fill="#002776" />
  </svg>
);

// CredWave - Logo com ondas
export const CredWaveLogo: React.FC<GatewayLogoProps> = ({
  className = "w-full h-full",
}) => (
  <svg
    viewBox="0 0 100 100"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="100" height="100" rx="20" fill="url(#credwave-gradient)" />
    <path
      d="M20 40Q35 30 50 40T80 40"
      stroke="white"
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M20 50Q35 40 50 50T80 50"
      stroke="white"
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M20 60Q35 50 50 60T80 60"
      stroke="white"
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
    />
    <defs>
      <linearGradient id="credwave-gradient" x1="0" y1="0" x2="100" y2="100">
        <stop offset="0%" stopColor="#2193b0" />
        <stop offset="100%" stopColor="#6dd5ed" />
      </linearGradient>
    </defs>
  </svg>
);

// DubaiPay - Logo estilo árabe/moderno
export const DubaiPayLogo: React.FC<GatewayLogoProps> = ({
  className = "w-full h-full",
}) => (
  <svg
    viewBox="0 0 100 100"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="100" height="100" rx="20" fill="url(#dubaipay-gradient)" />
    <path d="M50 20L35 40L50 35L65 40L50 20Z" fill="white" />
    <rect x="35" y="40" width="30" height="35" rx="2" fill="white" />
    <circle cx="50" cy="57" r="5" fill="url(#dubaipay-gradient)" />
    <defs>
      <linearGradient id="dubaipay-gradient" x1="0" y1="0" x2="100" y2="100">
        <stop offset="0%" stopColor="#c79100" />
        <stop offset="100%" stopColor="#ffd700" />
      </linearGradient>
    </defs>
  </svg>
);

// AtlasPay - Logo com globo/mundo
export const AtlasPayLogo: React.FC<GatewayLogoProps> = ({
  className = "w-full h-full",
}) => (
  <svg
    viewBox="0 0 100 100"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="100" height="100" rx="20" fill="url(#atlaspay-gradient)" />
    <circle cx="50" cy="50" r="25" stroke="white" strokeWidth="3" />
    <ellipse
      cx="50"
      cy="50"
      rx="12"
      ry="25"
      stroke="white"
      strokeWidth="2"
      fill="none"
    />
    <line x1="25" y1="50" x2="75" y2="50" stroke="white" strokeWidth="2" />
    <line x1="50" y1="25" x2="50" y2="75" stroke="white" strokeWidth="2" />
    <defs>
      <linearGradient id="atlaspay-gradient" x1="0" y1="0" x2="100" y2="100">
        <stop offset="0%" stopColor="#134e5e" />
        <stop offset="100%" stopColor="#71b280" />
      </linearGradient>
    </defs>
  </svg>
);

// CyberHub - Logo tech/cyber
export const CyberHubLogo: React.FC<GatewayLogoProps> = ({
  className = "w-full h-full",
}) => (
  <svg
    viewBox="0 0 100 100"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="100" height="100" rx="20" fill="url(#cyberhub-gradient)" />
    <rect x="30" y="30" width="15" height="15" fill="white" />
    <rect x="55" y="30" width="15" height="15" fill="white" />
    <rect x="30" y="55" width="15" height="15" fill="white" />
    <rect x="55" y="55" width="15" height="15" fill="white" />
    <rect x="42.5" y="42.5" width="15" height="15" fill="#00ff00" />
    <defs>
      <linearGradient id="cyberhub-gradient" x1="0" y1="0" x2="100" y2="100">
        <stop offset="0%" stopColor="#0f0c29" />
        <stop offset="50%" stopColor="#302b63" />
        <stop offset="100%" stopColor="#24243e" />
      </linearGradient>
    </defs>
  </svg>
);

// AxelPay - Logo com seta veloz
export const AxelPayLogo: React.FC<GatewayLogoProps> = ({
  className = "w-full h-full",
}) => (
  <svg
    viewBox="0 0 100 100"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="100" height="100" rx="20" fill="url(#axelpay-gradient)" />
    <path d="M20 50L60 30V45H80V55H60V70L20 50Z" fill="white" />
    <defs>
      <linearGradient id="axelpay-gradient" x1="0" y1="0" x2="100" y2="100">
        <stop offset="0%" stopColor="#FC466B" />
        <stop offset="100%" stopColor="#3F5EFB" />
      </linearGradient>
    </defs>
  </svg>
);

// Fortrex - Logo forte/fortificação
export const FortrexLogo: React.FC<GatewayLogoProps> = ({
  className = "w-full h-full",
}) => (
  <svg
    viewBox="0 0 100 100"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="100" height="100" rx="20" fill="url(#fortrex-gradient)" />
    <path
      d="M50 20L70 35V65L50 80L30 65V35L50 20Z"
      stroke="white"
      strokeWidth="4"
      fill="none"
    />
    <path d="M50 30L62 40V60L50 70L38 60V40L50 30Z" fill="white" />
    <defs>
      <linearGradient id="fortrex-gradient" x1="0" y1="0" x2="100" y2="100">
        <stop offset="0%" stopColor="#000046" />
        <stop offset="100%" stopColor="#1CB5E0" />
      </linearGradient>
    </defs>
  </svg>
);

// Appmax - Logo com "APP" moderno
export const AppmaxLogo: React.FC<GatewayLogoProps> = ({
  className = "w-full h-full",
}) => (
  <svg
    viewBox="0 0 100 100"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="100" height="100" rx="20" fill="url(#appmax-gradient)" />
    <rect x="30" y="30" width="12" height="40" rx="2" fill="white" />
    <rect x="44" y="35" width="12" height="35" rx="2" fill="white" />
    <rect x="58" y="40" width="12" height="30" rx="2" fill="white" />
    <defs>
      <linearGradient id="appmax-gradient" x1="0" y1="0" x2="100" y2="100">
        <stop offset="0%" stopColor="#667eea" />
        <stop offset="100%" stopColor="#764ba2" />
      </linearGradient>
    </defs>
  </svg>
);

// Bestfy - Logo com estrela/best
export const BestfyLogo: React.FC<GatewayLogoProps> = ({
  className = "w-full h-full",
}) => (
  <svg
    viewBox="0 0 100 100"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="100" height="100" rx="20" fill="url(#bestfy-gradient)" />
    <path
      d="M50 25L55 45H75L60 55L65 75L50 65L35 75L40 55L25 45H45L50 25Z"
      fill="white"
    />
    <defs>
      <linearGradient id="bestfy-gradient" x1="0" y1="0" x2="100" y2="100">
        <stop offset="0%" stopColor="#f093fb" />
        <stop offset="100%" stopColor="#f5576c" />
      </linearGradient>
    </defs>
  </svg>
);

// BravosPay - Logo com troféu
export const BravosPayLogo: React.FC<GatewayLogoProps> = ({
  className = "w-full h-full",
}) => (
  <svg
    viewBox="0 0 100 100"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="100" height="100" rx="20" fill="url(#bravos-gradient)" />
    <path
      d="M50 30V55M35 30H65M35 30V40C35 45 40 50 50 50C60 50 65 45 65 40V30"
      stroke="white"
      strokeWidth="4"
      strokeLinecap="round"
    />
    <rect x="40" y="55" width="20" height="15" rx="2" fill="white" />
    <defs>
      <linearGradient id="bravos-gradient" x1="0" y1="0" x2="100" y2="100">
        <stop offset="0%" stopColor="#FFD700" />
        <stop offset="100%" stopColor="#FFA500" />
      </linearGradient>
    </defs>
  </svg>
);

// Bynet - Logo com conexões/network
export const BynetLogo: React.FC<GatewayLogoProps> = ({
  className = "w-full h-full",
}) => (
  <svg
    viewBox="0 0 100 100"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="100" height="100" rx="20" fill="url(#bynet-gradient)" />
    <circle cx="35" cy="35" r="8" fill="white" />
    <circle cx="65" cy="35" r="8" fill="white" />
    <circle cx="35" cy="65" r="8" fill="white" />
    <circle cx="65" cy="65" r="8" fill="white" />
    <circle cx="50" cy="50" r="8" fill="white" />
    <line x1="35" y1="35" x2="50" y2="50" stroke="white" strokeWidth="3" />
    <line x1="65" y1="35" x2="50" y2="50" stroke="white" strokeWidth="3" />
    <line x1="35" y1="65" x2="50" y2="50" stroke="white" strokeWidth="3" />
    <line x1="65" y1="65" x2="50" y2="50" stroke="white" strokeWidth="3" />
    <defs>
      <linearGradient id="bynet-gradient" x1="0" y1="0" x2="100" y2="100">
        <stop offset="0%" stopColor="#2193b0" />
        <stop offset="100%" stopColor="#6dd5ed" />
      </linearGradient>
    </defs>
  </svg>
);

// Carthero - Logo com carrinho
export const CartheroLogo: React.FC<GatewayLogoProps> = ({
  className = "w-full h-full",
}) => (
  <svg
    viewBox="0 0 100 100"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="100" height="100" rx="20" fill="url(#carthero-gradient)" />
    <path
      d="M30 35H70L65 55H35L30 35Z"
      stroke="white"
      strokeWidth="4"
      fill="none"
    />
    <circle cx="40" cy="65" r="5" fill="white" />
    <circle cx="60" cy="65" r="5" fill="white" />
    <line
      x1="30"
      y1="35"
      x2="25"
      y2="25"
      stroke="white"
      strokeWidth="4"
      strokeLinecap="round"
    />
    <defs>
      <linearGradient id="carthero-gradient" x1="0" y1="0" x2="100" y2="100">
        <stop offset="0%" stopColor="#11998e" />
        <stop offset="100%" stopColor="#38ef7d" />
      </linearGradient>
    </defs>
  </svg>
);

// CenturionPay - Logo com escudo romano
export const CenturionPayLogo: React.FC<GatewayLogoProps> = ({
  className = "w-full h-full",
}) => (
  <svg
    viewBox="0 0 100 100"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="100" height="100" rx="20" fill="url(#centurion-gradient)" />
    <path
      d="M50 20L70 30V55C70 65 60 72 50 75C40 72 30 65 30 55V30L50 20Z"
      fill="white"
    />
    <path
      d="M45 45L48 50L55 40"
      stroke="url(#centurion-gradient)"
      strokeWidth="3"
      strokeLinecap="round"
    />
    <defs>
      <linearGradient id="centurion-gradient" x1="0" y1="0" x2="100" y2="100">
        <stop offset="0%" stopColor="#8B0000" />
        <stop offset="100%" stopColor="#DC143C" />
      </linearGradient>
    </defs>
  </svg>
);

// CredPago - Logo com cifrão/moeda
export const CredPagoLogo: React.FC<GatewayLogoProps> = ({
  className = "w-full h-full",
}) => (
  <svg
    viewBox="0 0 100 100"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="100" height="100" rx="20" fill="url(#credpago-gradient)" />
    <circle cx="50" cy="50" r="25" stroke="white" strokeWidth="4" />
    <path
      d="M50 30V70M40 40C40 35 45 30 50 30C55 30 60 35 60 40C60 45 55 45 50 45C45 45 40 45 40 50C40 55 45 60 50 60C55 60 60 55 60 50"
      stroke="white"
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
    />
    <defs>
      <linearGradient id="credpago-gradient" x1="0" y1="0" x2="100" y2="100">
        <stop offset="0%" stopColor="#2ecc71" />
        <stop offset="100%" stopColor="#27ae60" />
      </linearGradient>
    </defs>
  </svg>
);

// Alpa - Logo B2B com "A" e "L"
export const AlpaLogo: React.FC<GatewayLogoProps> = ({
  className = "w-full h-full",
}) => (
  <svg
    viewBox="0 0 100 100"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="100" height="100" rx="20" fill="url(#alpa-gradient)" />
    <path d="M35 70L50 30L65 70H55L52 60H48L45 70H35Z" fill="white" />
    <rect x="46" y="48" width="8" height="4" fill="url(#alpa-gradient)" />
    <rect x="68" y="45" width="6" height="25" rx="1" fill="white" />
    <defs>
      <linearGradient id="alpa-gradient" x1="0" y1="0" x2="100" y2="100">
        <stop offset="0%" stopColor="#5433FF" />
        <stop offset="100%" stopColor="#20BDFF" />
      </linearGradient>
    </defs>
  </svg>
);

// AlphaCash - Logo com alfa grego
export const AlphaCashLogo: React.FC<GatewayLogoProps> = ({
  className = "w-full h-full",
}) => (
  <svg
    viewBox="0 0 100 100"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="100" height="100" rx="20" fill="url(#alphacash-gradient)" />
    <path d="M50 25L70 75H60L55 60H45L40 75H30L50 25Z" fill="white" />
    <rect x="42" y="48" width="16" height="6" fill="url(#alphacash-gradient)" />
    <circle cx="75" cy="35" r="8" stroke="white" strokeWidth="3" fill="none" />
    <defs>
      <linearGradient id="alphacash-gradient" x1="0" y1="0" x2="100" y2="100">
        <stop offset="0%" stopColor="#FF6B6B" />
        <stop offset="100%" stopColor="#4ECDC4" />
      </linearGradient>
    </defs>
  </svg>
);

// AnubisPay - Logo egípcio/pirâmide
export const AnubisPayLogo: React.FC<GatewayLogoProps> = ({
  className = "w-full h-full",
}) => (
  <svg
    viewBox="0 0 100 100"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="100" height="100" rx="20" fill="url(#anubis-gradient)" />
    <path d="M50 25L75 70H25L50 25Z" fill="white" />
    <path d="M50 35L65 60H35L50 35Z" fill="url(#anubis-inner)" />
    <circle cx="45" cy="48" r="3" fill="white" />
    <circle cx="55" cy="48" r="3" fill="white" />
    <defs>
      <linearGradient id="anubis-gradient" x1="0" y1="0" x2="100" y2="100">
        <stop offset="0%" stopColor="#C9A227" />
        <stop offset="100%" stopColor="#8B6914" />
      </linearGradient>
      <linearGradient id="anubis-inner" x1="50" y1="35" x2="50" y2="60">
        <stop offset="0%" stopColor="#8B6914" />
        <stop offset="100%" stopColor="#5A4608" />
      </linearGradient>
    </defs>
  </svg>
);

// Asset - Logo com barras/gráfico
export const AssetLogo: React.FC<GatewayLogoProps> = ({
  className = "w-full h-full",
}) => (
  <svg
    viewBox="0 0 100 100"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="100" height="100" rx="20" fill="url(#asset-gradient)" />
    <rect x="30" y="50" width="10" height="25" rx="2" fill="white" />
    <rect x="45" y="40" width="10" height="35" rx="2" fill="white" />
    <rect x="60" y="30" width="10" height="45" rx="2" fill="white" />
    <path
      d="M35 45L50 35L65 25"
      stroke="white"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <defs>
      <linearGradient id="asset-gradient" x1="0" y1="0" x2="100" y2="100">
        <stop offset="0%" stopColor="#1e3c72" />
        <stop offset="100%" stopColor="#2a5298" />
      </linearGradient>
    </defs>
  </svg>
);

// AstonPay - Logo elegante com "A"
export const AstonPayLogo: React.FC<GatewayLogoProps> = ({
  className = "w-full h-full",
}) => (
  <svg
    viewBox="0 0 100 100"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="100" height="100" rx="20" fill="url(#aston-gradient)" />
    <path
      d="M30 70L50 30L70 70"
      stroke="white"
      strokeWidth="6"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <line
      x1="40"
      y1="55"
      x2="60"
      y2="55"
      stroke="white"
      strokeWidth="6"
      strokeLinecap="round"
    />
    <circle cx="50" cy="30" r="5" fill="white" />
    <defs>
      <linearGradient id="aston-gradient" x1="0" y1="0" x2="100" y2="100">
        <stop offset="0%" stopColor="#141E30" />
        <stop offset="100%" stopColor="#243B55" />
      </linearGradient>
    </defs>
  </svg>
);

// Mercado Pago - Logo oficial estilizado
export const MercadoPagoLogo: React.FC<GatewayLogoProps> = ({
  className = "w-full h-full",
}) => (
  <svg
    viewBox="0 0 100 100"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="100" height="100" rx="20" fill="#009EE3" />
    <path
      d="M35 35C35 30 39 26 44 26C49 26 53 30 53 35V50H44C39 50 35 46 35 41V35Z"
      fill="white"
    />
    <path
      d="M47 50V65C47 70 51 74 56 74C61 74 65 70 65 65V50H56H47Z"
      fill="#FFE600"
    />
    <circle cx="56" cy="35" r="9" fill="white" />
  </svg>
);

// PagSeguro - Logo oficial estilizado
export const PagSeguroLogo: React.FC<GatewayLogoProps> = ({
  className = "w-full h-full",
}) => (
  <svg
    viewBox="0 0 100 100"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="100" height="100" rx="20" fill="url(#pagseguro-gradient)" />
    <path
      d="M40 35H55C62 35 67 40 67 47C67 54 62 59 55 59H40V35Z"
      fill="white"
    />
    <path
      d="M40 59H50C55 59 59 63 59 68V68C59 70 57 72 55 72H40V59Z"
      fill="white"
      opacity="0.8"
    />
    <rect x="33" y="35" width="7" height="37" rx="1" fill="white" />
    <defs>
      <linearGradient id="pagseguro-gradient" x1="0" y1="0" x2="100" y2="100">
        <stop offset="0%" stopColor="#62B246" />
        <stop offset="100%" stopColor="#459D3C" />
      </linearGradient>
    </defs>
  </svg>
);

// Stripe - Logo oficial estilizado
export const StripeLogo: React.FC<GatewayLogoProps> = ({
  className = "w-full h-full",
}) => (
  <svg
    viewBox="0 0 100 100"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="100" height="100" rx="20" fill="#635BFF" />
    <path
      d="M50 35C45 35 42 37 42 41C42 48 58 46 58 56C58 62 54 66 47 66C42 66 38 64 35 61L37 56C40 58 43 60 47 60C51 60 53 58 53 55C53 48 37 50 37 40C37 34 41 30 49 30C53 30 56 31 59 33L57 38C55 37 52 35 50 35Z"
      fill="white"
    />
  </svg>
);

// Asaas - Logo oficial estilizado
export const AsaasLogo: React.FC<GatewayLogoProps> = ({
  className = "w-full h-full",
}) => (
  <svg
    viewBox="0 0 100 100"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="100" height="100" rx="20" fill="url(#asaas-gradient)" />
    <circle cx="35" cy="45" r="8" fill="white" />
    <circle cx="50" cy="45" r="8" fill="white" />
    <circle cx="65" cy="45" r="8" fill="white" />
    <path
      d="M30 58Q35 65 50 65T70 58"
      stroke="white"
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
    />
    <defs>
      <linearGradient id="asaas-gradient" x1="0" y1="0" x2="100" y2="100">
        <stop offset="0%" stopColor="#0B4EAD" />
        <stop offset="100%" stopColor="#0A3D8A" />
      </linearGradient>
    </defs>
  </svg>
);

// Cielo - Logo oficial estilizado
export const CieloLogo: React.FC<GatewayLogoProps> = ({
  className = "w-full h-full",
}) => (
  <svg
    viewBox="0 0 100 100"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="100" height="100" rx="20" fill="url(#cielo-gradient)" />
    <circle cx="50" cy="45" r="18" stroke="white" strokeWidth="4" fill="none" />
    <path
      d="M32 45C32 35 40 27 50 27"
      stroke="white"
      strokeWidth="6"
      strokeLinecap="round"
    />
    <rect x="35" y="60" width="30" height="6" rx="3" fill="white" />
    <defs>
      <linearGradient id="cielo-gradient" x1="0" y1="0" x2="100" y2="100">
        <stop offset="0%" stopColor="#00AEEF" />
        <stop offset="100%" stopColor="#0085CA" />
      </linearGradient>
    </defs>
  </svg>
);

// Mapa de logos customizados
export const customGatewayLogos: Record<string, React.FC<GatewayLogoProps>> = {
  paguex: PagueXLogo,
  "pague-x": PagueXLogo,
  allus: AllusLogo,
  fastpay: FastPayLogo,
  "fast-pay": FastPayLogo,
  blackcat: BlackCatLogo,
  firepag: FirePagLogo,
  "fire-pag": FirePagLogo,
  flashpay: FlashPayLogo,
  "flash-pay": FlashPayLogo,
  brazapay: BrazaPayLogo,
  "braza-pay": BrazaPayLogo,
  credwave: CredWaveLogo,
  dubaipay: DubaiPayLogo,
  "dubai-pay": DubaiPayLogo,
  atlaspay: AtlasPayLogo,
  "atlas-pay": AtlasPayLogo,
  cyberhub: CyberHubLogo,
  axelpay: AxelPayLogo,
  fortrex: FortrexLogo,
  appmax: AppmaxLogo,
  bestfy: BestfyLogo,
  bravospay: BravosPayLogo,
  "bravos-pay": BravosPayLogo,
  bynet: BynetLogo,
  carthero: CartheroLogo,
  centurionpay: CenturionPayLogo,
  "centurion-pay": CenturionPayLogo,
  credpago: CredPagoLogo,
  alpa: AlpaLogo,
  alphacash: AlphaCashLogo,
  anubispay: AnubisPayLogo,
  asset: AssetLogo,
  astonpay: AstonPayLogo,
  "aston-pay": AstonPayLogo,
  mercadopago: MercadoPagoLogo,
  pagseguro: PagSeguroLogo,
  stripe: StripeLogo,
  asaas: AsaasLogo,
  cielo: CieloLogo,
};

// Componente helper para renderizar logo customizado
export const CustomGatewayLogo: React.FC<{
  slug: string;
  className?: string;
}> = ({ slug, className }) => {
  const LogoComponent = customGatewayLogos[slug.toLowerCase()];

  if (!LogoComponent) {
    return null;
  }

  return <LogoComponent className={className} />;
};

export default CustomGatewayLogo;
