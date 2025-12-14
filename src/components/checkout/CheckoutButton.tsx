/**
 * CheckoutButton - Botão Totalmente Customizável
 *
 * Suporta todas as personalizações do tema:
 * - Cores customizadas
 * - Hover effects
 * - Animações (flow, pulse)
 * - Sombras
 * - Border radius
 * - Loading state
 * - Disabled state
 *
 * @version 1.0
 * @date 08/01/2025
 */

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckoutButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "checkout" | "secondary";
  theme: any;
  className?: string;
  fullWidth?: boolean;
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

export const CheckoutButton: React.FC<CheckoutButtonProps> = ({
  children,
  onClick,
  disabled = false,
  loading = false,
  type = "button",
  variant = "primary",
  theme,
  className = "",
  fullWidth = false,
  size = "md",
  icon,
  iconPosition = "left",
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // ============================================
  // CONFIGURAÇÕES POR VARIANTE
  // ============================================

  const getButtonConfig = () => {
    switch (variant) {
      case "checkout":
        return {
          backgroundColor: theme.checkoutButtonBackgroundColor || "#10b981",
          textColor: theme.checkoutButtonTextColor || "#ffffff",
          borderRadius: theme.checkoutButtonBorderRadius || 8,
          hover: theme.checkoutButtonHover !== false,
          hoverColor: theme.checkoutButtonHoverColor || "#059669",
          flow: theme.checkoutButtonFlow || false,
          shadow: theme.checkoutButtonShadow !== false,
          pulse: theme.checkoutButtonPulse || false,
        };
      case "secondary":
        return {
          backgroundColor: theme.secondaryButtonBackgroundColor || "#6b7280",
          textColor: theme.secondaryButtonTextColor || "#ffffff",
          borderRadius: theme.primaryButtonBorderRadius || 8,
          hover: true,
          hoverColor: "#4b5563",
          flow: false,
          shadow: false,
          pulse: false,
        };
      case "primary":
      default:
        return {
          backgroundColor: theme.primaryButtonBackgroundColor || "#8b5cf6",
          textColor: theme.primaryButtonTextColor || "#ffffff",
          borderRadius: theme.primaryButtonBorderRadius || 8,
          hover: theme.primaryButtonHover !== false,
          hoverColor: theme.primaryButtonHoverColor || "#7c3aed",
          flow: theme.primaryButtonFlow || false,
          shadow: theme.primaryButtonShadow !== false,
          pulse: false,
        };
    }
  };

  const config = getButtonConfig();

  // ============================================
  // TAMANHOS
  // ============================================

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "px-4 py-2 text-sm";
      case "lg":
        return "px-8 py-4 text-lg";
      case "md":
      default:
        return "px-6 py-3 text-base";
    }
  };

  // ============================================
  // ESTILOS DINÂMICOS
  // ============================================

  const baseStyles: React.CSSProperties = {
    backgroundColor:
      disabled || loading
        ? "#d1d5db"
        : isHovered && config.hover && config.hoverColor
        ? config.hoverColor
        : config.backgroundColor,
    color: disabled || loading ? "#9ca3af" : config.textColor,
    borderRadius: `${config.borderRadius}px`,
    transition: "all 0.3s ease",
    boxShadow: config.shadow
      ? isHovered
        ? "0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.15)"
        : "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)"
      : "none",
    transform: isHovered && !disabled && !loading ? "translateY(-2px)" : "translateY(0)",
  };

  // ============================================
  // ANIMAÇÕES
  // ============================================

  const getAnimationClasses = () => {
    const classes = [];

    if (config.pulse && !disabled && !loading) {
      classes.push("animate-pulse");
    }

    if (config.flow && !disabled && !loading) {
      classes.push("animate-gradient-x bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-[length:200%_auto]");
    }

    return classes.join(" ");
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <motion.button
      type={type}
      onClick={disabled || loading ? undefined : onClick}
      disabled={disabled || loading}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "relative font-semibold inline-flex items-center justify-center gap-2",
        "focus:outline-none focus:ring-2 focus:ring-offset-2",
        "transition-all duration-300 ease-in-out",
        "disabled:cursor-not-allowed disabled:opacity-50",
        getSizeClasses(),
        getAnimationClasses(),
        fullWidth && "w-full",
        className,
      )}
      style={baseStyles}
      whileHover={
        !disabled && !loading
          ? {
              scale: 1.02,
            }
          : {}
      }
      whileTap={
        !disabled && !loading
          ? {
              scale: 0.98,
            }
          : {}
      }
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Loading Spinner */}
      {loading && (
        <Loader2
          className={cn(
            "animate-spin",
            size === "sm" ? "w-4 h-4" : size === "lg" ? "w-6 h-6" : "w-5 h-5",
          )}
        />
      )}

      {/* Icon Left */}
      {icon && iconPosition === "left" && !loading && (
        <span className="flex-shrink-0">{icon}</span>
      )}

      {/* Text Content */}
      <span className="flex-1 text-center">{children}</span>

      {/* Icon Right */}
      {icon && iconPosition === "right" && !loading && (
        <span className="flex-shrink-0">{icon}</span>
      )}

      {/* Ripple Effect on Click */}
      {!disabled && !loading && (
        <span className="absolute inset-0 overflow-hidden rounded-[inherit]">
          <span className="absolute inset-0 rounded-[inherit] bg-white opacity-0 group-active:opacity-20 transition-opacity duration-200" />
        </span>
      )}
    </motion.button>
  );
};

// ============================================
// VARIAÇÕES PRÉ-CONFIGURADAS
// ============================================

export const PrimaryButton: React.FC<Omit<CheckoutButtonProps, "variant">> = (
  props,
) => <CheckoutButton {...props} variant="primary" />;

export const CheckoutFinalButton: React.FC<
  Omit<CheckoutButtonProps, "variant">
> = (props) => <CheckoutButton {...props} variant="checkout" />;

export const SecondaryButton: React.FC<
  Omit<CheckoutButtonProps, "variant">
> = (props) => <CheckoutButton {...props} variant="secondary" />;

export default CheckoutButton;

