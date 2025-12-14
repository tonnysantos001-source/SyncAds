/**
 * CheckoutInput - Input Totalmente Customizável
 *
 * Suporta todas as personalizações do tema:
 * - Cores customizadas (border, background, placeholder)
 * - Altura e border radius
 * - Label customizável
 * - Estados (focus, error, disabled)
 * - Ícones opcionais
 * - Máscaras (CPF, telefone, CEP)
 *
 * @version 1.0
 * @date 08/01/2025
 */

import React, { useState, forwardRef, InputHTMLAttributes } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { AlertCircle, Check } from "lucide-react";

interface CheckoutInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: boolean;
  theme: any;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  mask?: "cpf" | "phone" | "cep" | "card" | "date" | "none";
  showValidation?: boolean;
  helperText?: string;
  required?: boolean;
  fullWidth?: boolean;
}

export const CheckoutInput = forwardRef<HTMLInputElement, CheckoutInputProps>(
  (
    {
      label,
      error,
      success = false,
      theme,
      icon,
      iconPosition = "left",
      mask = "none",
      showValidation = true,
      helperText,
      required = false,
      fullWidth = true,
      className = "",
      value,
      onChange,
      onFocus,
      onBlur,
      ...rest
    },
    ref,
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(!!value);

    // ============================================
    // MÁSCARAS
    // ============================================

    const applyMask = (inputValue: string): string => {
      if (!inputValue) return "";

      switch (mask) {
        case "cpf":
          return inputValue
            .replace(/\D/g, "")
            .replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d{1,2})/, "$1-$2")
            .replace(/(-\d{2})\d+?$/, "$1");

        case "phone":
          return inputValue
            .replace(/\D/g, "")
            .replace(/(\d{2})(\d)/, "($1) $2")
            .replace(/(\d{5})(\d)/, "$1-$2")
            .replace(/(-\d{4})\d+?$/, "$1");

        case "cep":
          return inputValue
            .replace(/\D/g, "")
            .replace(/(\d{5})(\d)/, "$1-$2")
            .replace(/(-\d{3})\d+?$/, "$1");

        case "card":
          return inputValue
            .replace(/\D/g, "")
            .replace(/(\d{4})(\d)/, "$1 $2")
            .replace(/(\d{4})(\d)/, "$1 $2")
            .replace(/(\d{4})(\d)/, "$1 $2")
            .replace(/(\d{4})\d+?$/, "$1");

        case "date":
          return inputValue
            .replace(/\D/g, "")
            .replace(/(\d{2})(\d)/, "$1/$2")
            .replace(/(\d{2})(\d)/, "$1/$2")
            .replace(/(\/\d{4})\d+?$/, "$1");

        default:
          return inputValue;
      }
    };

    // ============================================
    // HANDLERS
    // ============================================

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const maskedValue = applyMask(e.target.value);
      setHasValue(!!maskedValue);

      // Criar novo evento com valor mascarado
      const newEvent = {
        ...e,
        target: {
          ...e.target,
          value: maskedValue,
        },
      } as React.ChangeEvent<HTMLInputElement>;

      onChange?.(newEvent);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    // ============================================
    // ESTILOS DINÂMICOS
    // ============================================

    const getBorderColor = () => {
      if (error) return "#ef4444"; // red-500
      if (success && showValidation) return "#10b981"; // green-500
      if (isFocused) return theme.inputFocusBorderColor || "#8b5cf6"; // purple-600
      return theme.inputBorderColor || "#d1d5db"; // gray-300
    };

    const inputStyles: React.CSSProperties = {
      backgroundColor: theme.inputBackgroundColor || "#ffffff",
      borderColor: getBorderColor(),
      borderRadius: `${theme.inputBorderRadius || 8}px`,
      height: `${theme.inputHeight || 48}px`,
      color: theme.textColor || "#111827",
      borderWidth: "1px",
      borderStyle: "solid",
      transition: "all 0.3s ease",
    };

    const labelStyles: React.CSSProperties = {
      color: error
        ? "#ef4444"
        : isFocused || hasValue
        ? theme.labelColor || "#111827"
        : theme.labelColor || "#6b7280",
      fontWeight: theme.labelFontWeight || "500",
      fontSize: "14px",
      transition: "all 0.3s ease",
    };

    // ============================================
    // RENDER
    // ============================================

    return (
      <div className={cn("relative", fullWidth && "w-full")}>
        {/* Label */}
        {label && (
          <motion.label
            className="block mb-2"
            style={labelStyles}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </motion.label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Icon Left */}
          {icon && iconPosition === "left" && (
            <div
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              style={{ color: isFocused ? getBorderColor() : undefined }}
            >
              {icon}
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            value={value}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={cn(
              "w-full px-4 outline-none transition-all duration-300",
              "focus:ring-2 focus:ring-opacity-20",
              icon && iconPosition === "left" && "pl-11",
              icon && iconPosition === "right" && "pr-11",
              (error || (success && showValidation)) && "pr-11",
              className,
            )}
            style={{
              ...inputStyles,
              ...(isFocused && {
                boxShadow: `0 0 0 3px ${theme.inputFocusBorderColor || "#8b5cf6"}20`,
              }),
            }}
            aria-invalid={!!error}
            aria-describedby={
              error ? `${rest.id}-error` : helperText ? `${rest.id}-helper` : undefined
            }
            {...rest}
          />

          {/* Icon Right ou Validation Icon */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {/* Validation Icons */}
            {showValidation && !icon && (
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    key="error"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                    transition={{ duration: 0.3 }}
                  >
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  </motion.div>
                )}
                {success && !error && hasValue && (
                  <motion.div
                    key="success"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Check className="w-5 h-5 text-green-500" />
                  </motion.div>
                )}
              </AnimatePresence>
            )}

            {/* Custom Icon Right */}
            {icon && iconPosition === "right" && (
              <div
                className="text-gray-400"
                style={{ color: isFocused ? getBorderColor() : undefined }}
              >
                {icon}
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.p
              id={`${rest.id}-error`}
              className="mt-2 text-sm text-red-500 flex items-center gap-1"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <AlertCircle className="w-4 h-4" />
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Helper Text */}
        {helperText && !error && (
          <p
            id={`${rest.id}-helper`}
            className="mt-2 text-sm"
            style={{ color: theme.textColor || "#6b7280", opacity: 0.7 }}
          >
            {helperText}
          </p>
        )}

        {/* Focus Ring Animation */}
        {isFocused && (
          <motion.div
            className="absolute inset-0 rounded-[inherit] pointer-events-none"
            style={{
              border: `2px solid ${theme.inputFocusBorderColor || "#8b5cf6"}`,
              opacity: 0.2,
            }}
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </div>
    );
  },
);

CheckoutInput.displayName = "CheckoutInput";

export default CheckoutInput;

