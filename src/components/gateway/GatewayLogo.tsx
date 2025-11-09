import React from "react";
import { cn } from "@/lib/utils";
import { Visa, Mastercard, Amex, Discover, Jcb, Diners } from "react-pay-icons";

interface GatewayLogoProps {
  name: string;
  logo?: string;
  slug?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

// Mapeamento de slugs para componentes do react-pay-icons
const ICON_COMPONENTS: Record<string, React.ComponentType<any>> = {
  visa: Visa,
  mastercard: Mastercard,
  amex: Amex,
  "american-express": Amex,
  discover: Discover,
  jcb: Jcb,
  diners: Diners,
};

// Tamanhos predefinidos
const SIZES = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
  xl: "w-20 h-20",
};

const GatewayLogo: React.FC<GatewayLogoProps> = ({
  name,
  logo,
  slug,
  size = "md",
  className,
}) => {
  const [imageError, setImageError] = React.useState(false);
  const [imageLoaded, setImageLoaded] = React.useState(false);

  // Tentar usar componente do react-pay-icons
  const IconComponent = slug ? ICON_COMPONENTS[slug.toLowerCase()] : null;

  // Classes base
  const baseClasses = cn(
    SIZES[size],
    "rounded-lg border border-gray-200 dark:border-gray-700",
    "bg-white dark:bg-gray-800",
    "flex items-center justify-center overflow-hidden",
    "transition-all duration-300",
    className,
  );

  // Se tiver ícone do react-pay-icons, usar ele
  if (IconComponent && !imageError) {
    return (
      <div className={baseClasses}>
        <IconComponent
          className="w-full h-full object-contain p-1"
          style={{ maxWidth: "100%", maxHeight: "100%" }}
        />
      </div>
    );
  }

  // Se tiver URL de logo customizada e não houver erro
  if (logo && !imageError) {
    return (
      <div className={baseClasses}>
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          </div>
        )}
        <img
          src={logo}
          alt={`${name} logo`}
          className={cn(
            "max-w-full max-h-full object-contain p-2 transition-opacity duration-300",
            imageLoaded ? "opacity-100" : "opacity-0",
          )}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  // Fallback: Inicial do nome com gradiente
  const initial = name.charAt(0).toUpperCase();
  const gradients = [
    "from-blue-500 to-purple-600",
    "from-purple-500 to-pink-600",
    "from-pink-500 to-rose-600",
    "from-green-500 to-emerald-600",
    "from-orange-500 to-red-600",
    "from-cyan-500 to-blue-600",
    "from-indigo-500 to-purple-600",
    "from-teal-500 to-green-600",
  ];

  // Selecionar gradiente baseado na primeira letra (consistente)
  const gradientIndex = initial.charCodeAt(0) % gradients.length;
  const gradient = gradients[gradientIndex];

  const textSizes = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-2xl",
    xl: "text-3xl",
  };

  return (
    <div
      className={cn(
        baseClasses,
        "relative overflow-hidden group hover:scale-105",
      )}
    >
      {/* Gradiente de fundo animado */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-10 group-hover:opacity-20 transition-opacity duration-300",
          gradient,
        )}
      />

      {/* Blob decorativo */}
      <div
        className={cn(
          "absolute -top-4 -right-4 w-16 h-16 rounded-full blur-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-300",
          "bg-gradient-to-br",
          gradient,
        )}
      />

      {/* Inicial */}
      <span
        className={cn(
          "relative z-10 font-black bg-gradient-to-br bg-clip-text text-transparent",
          gradient,
          textSizes[size],
        )}
      >
        {initial}
      </span>
    </div>
  );
};

export default GatewayLogo;
