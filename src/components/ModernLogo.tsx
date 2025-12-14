import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModernLogoProps {
  variant?: "full" | "icon-only" | "compact";
  size?: "sm" | "md" | "lg" | "xl";
  animated?: boolean;
  linkTo?: string;
  className?: string;
  showTagline?: boolean;
}

const sizeClasses = {
  sm: {
    container: "gap-2",
    icon: "w-8 h-8",
    iconSvg: "w-4 h-4",
    text: "text-lg",
    tagline: "text-[8px]",
    sparkle: "w-2 h-2",
    sparkleSmall: "w-1.5 h-1.5",
  },
  md: {
    container: "gap-3",
    icon: "w-12 h-12",
    iconSvg: "w-7 h-7",
    text: "text-2xl",
    tagline: "text-[10px]",
    sparkle: "w-3 h-3",
    sparkleSmall: "w-2 h-2",
  },
  lg: {
    container: "gap-4",
    icon: "w-16 h-16",
    iconSvg: "w-9 h-9",
    text: "text-3xl",
    tagline: "text-xs",
    sparkle: "w-4 h-4",
    sparkleSmall: "w-2.5 h-2.5",
  },
  xl: {
    container: "gap-5",
    icon: "w-20 h-20",
    iconSvg: "w-11 h-11",
    text: "text-4xl",
    tagline: "text-sm",
    sparkle: "w-5 h-5",
    sparkleSmall: "w-3 h-3",
  },
};

const ModernLogo: React.FC<ModernLogoProps> = ({
  variant = "full",
  size = "md",
  animated = true,
  linkTo,
  className,
  showTagline = true,
}) => {
  const sizes = sizeClasses[size];

  const LogoIcon = () => (
    <motion.div
      className="relative"
      whileHover={animated ? { scale: 1.05, rotate: 5 } : undefined}
      transition={{ type: "spring", stiffness: 400 }}
    >
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-blue-500 rounded-2xl blur-xl opacity-60 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Logo container */}
      <div
        className={cn(
          "relative bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-2xl",
          sizes.icon
        )}
      >
        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent rounded-2xl" />

        {/* Letter S com estilo moderno */}
        <svg viewBox="0 0 24 24" className={sizes.iconSvg}>
          <path
            d="M7 8 Q6 8 6 9 Q6 10 7 10 L17 10 Q18 10 18 11 Q18 12 17 12 L7 16"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
            className="drop-shadow-lg"
          />
        </svg>

        {/* Sparkle decorativo animado */}
        {animated ? (
          <motion.div
            className={cn(
              "absolute -top-1 -right-1 bg-yellow-400 rounded-full shadow-lg",
              sizes.sparkle
            )}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [1, 0.8, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ) : (
          <div
            className={cn(
              "absolute -top-1 -right-1 bg-yellow-400 rounded-full shadow-lg",
              sizes.sparkle
            )}
          />
        )}

        <Sparkles
          className={cn(
            "absolute -bottom-0.5 -left-0.5 text-yellow-300 opacity-80",
            sizes.sparkleSmall
          )}
        />
      </div>
    </motion.div>
  );

  const LogoText = () => (
    <div className="flex flex-col">
      <motion.span
        className={cn(
          "font-black tracking-tight bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent",
          sizes.text
        )}
        whileHover={animated ? { scale: 1.02 } : undefined}
      >
        SyncAds
      </motion.span>
      {showTagline && (
        <span
          className={cn(
            "font-bold text-gray-500 dark:text-gray-400 -mt-1 tracking-wider flex items-center gap-1",
            sizes.tagline
          )}
        >
          <Zap className={cn("text-pink-500", sizes.sparkleSmall)} />
          MARKETING AI
        </span>
      )}
    </div>
  );

  const LogoContent = () => {
    if (variant === "icon-only") {
      return <LogoIcon />;
    }

    if (variant === "compact") {
      return (
        <div className={cn("flex items-center", sizes.container)}>
          <LogoIcon />
          <span
            className={cn(
              "font-black tracking-tight bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent",
              sizes.text
            )}
          >
            SyncAds
          </span>
        </div>
      );
    }

    return (
      <div className={cn("flex items-center", sizes.container)}>
        <LogoIcon />
        <LogoText />
      </div>
    );
  };

  if (linkTo) {
    return (
      <Link to={linkTo} className={cn("group inline-block", className)}>
        <LogoContent />
      </Link>
    );
  }

  return (
    <div className={cn("group inline-block", className)}>
      <LogoContent />
    </div>
  );
};

export default ModernLogo;

