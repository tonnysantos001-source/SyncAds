/**
 * PaymentMethodIcons - Ícones de Métodos de Pagamento Profissionais
 *
 * Exibe ícones das principais bandeiras de cartão e métodos de pagamento
 * - Visa, Mastercard, Amex, Elo, Hipercard, Diners
 * - PIX, Boleto
 * - Design profissional e moderno
 *
 * @version 1.0
 * @date 2025
 */

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PaymentMethodIconsProps {
  theme?: any;
  className?: string;
  isMobile?: boolean;
  variant?: "horizontal" | "grid";
  showText?: boolean;
  methods?: string[];
}

export const PaymentMethodIcons: React.FC<PaymentMethodIconsProps> = ({
  theme,
  className = "",
  isMobile = false,
  variant = "horizontal",
  showText = false,
  methods = ["visa", "mastercard", "amex", "elo", "pix", "boleto"],
}) => {
  // SVG dos cartões de crédito
  const paymentIcons: Record<string, { svg: string; name: string; color: string }> = {
    visa: {
      name: "Visa",
      color: "#1434CB",
      svg: `<svg viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="32" rx="4" fill="white"/>
        <rect width="48" height="32" rx="4" stroke="#E5E7EB" stroke-width="1"/>
        <path d="M20.5 11h-3.2L14 21h2.4l.6-1.5h2.8l.4 1.5h2.6L20.5 11zm-2.3 6.5l1-3 .6 3h-1.6z" fill="#1434CB"/>
        <path d="M24 11l-2 10h2.2l2-10H24z" fill="#1434CB"/>
        <path d="M31 11c-.7 0-1.3.2-1.7.6l-.1-.5h-2.1l-1.5 10h2.3l.6-3.5c.2-.8.7-1.3 1.3-1.3.5 0 .7.3.7.8 0 .3 0 .5-.1.8l-.7 4.2h2.3l.7-4.4c.1-.4.1-.8.1-1.1 0-1.4-.9-2.1-2-2.1-.8 0-1.5.3-2 .9l.2-1.4z" fill="#1434CB"/>
        <path d="M36 14.5c0-.9-.7-1.5-2-1.5-1.5 0-2.6.8-2.6 2 0 1 .8 1.3 1.5 1.5.6.2 1 .3 1 .6 0 .4-.5.6-1 .6-.7 0-1.3-.2-1.7-.5l-.3 1.4c.5.2 1.2.4 2 .4 1.7 0 2.8-.8 2.8-2.1 0-1-.8-1.4-1.5-1.6-.5-.2-.9-.3-.9-.6 0-.3.4-.5.8-.5.5 0 1 .1 1.4.3l.3-1.4c-.4-.2-1-.3-1.6-.3.1 0 .1.1.1.1z" fill="#1434CB"/>
      </svg>`,
    },
    mastercard: {
      name: "Mastercard",
      color: "#EB001B",
      svg: `<svg viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="32" rx="4" fill="white"/>
        <rect width="48" height="32" rx="4" stroke="#E5E7EB" stroke-width="1"/>
        <circle cx="18" cy="16" r="7" fill="#EB001B"/>
        <circle cx="30" cy="16" r="7" fill="#F79E1B"/>
        <path d="M24 11.5c-1.3 1.2-2.1 2.9-2.1 4.5s.8 3.3 2.1 4.5c1.3-1.2 2.1-2.9 2.1-4.5s-.8-3.3-2.1-4.5z" fill="#FF5F00"/>
      </svg>`,
    },
    amex: {
      name: "American Express",
      color: "#006FCF",
      svg: `<svg viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="32" rx="4" fill="#006FCF"/>
        <path d="M15 12h-3l-1.5 4L9 12H6l2.5 8h2.2l.8-2.5.8 2.5h2.2L15 12z" fill="white"/>
        <path d="M19 12l-2.5 8h2.2l.4-1h2.8l.4 1h2.5l-2.5-8H19zm-.5 5.5l.8-2.5.8 2.5h-1.6z" fill="white"/>
        <path d="M26 12v8h2v-2.5h2c1.7 0 2.5-.8 2.5-2.8 0-1.9-.8-2.7-2.5-2.7h-4zm2 1.8h1.5c.5 0 .8.3.8.9s-.3.8-.8.8H28v-1.7z" fill="white"/>
        <path d="M35 12l-2 3-2-3h-2.5l3.2 4.2-3.2 3.8h2.5l2-2.5 2 2.5H38l-3.2-3.8L38 12h-3z" fill="white"/>
      </svg>`,
    },
    elo: {
      name: "Elo",
      color: "#FFCB05",
      svg: `<svg viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="32" rx="4" fill="white"/>
        <rect width="48" height="32" rx="4" stroke="#E5E7EB" stroke-width="1"/>
        <circle cx="16" cy="16" r="8" fill="#FFCB05"/>
        <circle cx="32" cy="16" r="8" fill="#000000"/>
        <path d="M24 10c-2.2 0-4.2 1.2-5.3 3 1.1 1.8 3.1 3 5.3 3s4.2-1.2 5.3-3c-1.1-1.8-3.1-3-5.3-3z" fill="#EE4023"/>
      </svg>`,
    },
    hipercard: {
      name: "Hipercard",
      color: "#B41E1E",
      svg: `<svg viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="32" rx="4" fill="white"/>
        <rect width="48" height="32" rx="4" stroke="#E5E7EB" stroke-width="1"/>
        <path d="M12 12h2v8h-2v-8zm3 0h2v8h-2v-8zm3 0v8h2v-3h2v-2h-2v-1h2v-2h-4zm5 0v8h4v-2h-2v-1h2v-2h-2v-1h2v-2h-4zm5 0v8h2v-3h1l1 3h2l-1.5-3.5c.8-.3 1.5-1 1.5-2 0-1.4-1-2.5-2.5-2.5h-3.5zm2 2h1c.5 0 .8.3.8.8s-.3.7-.8.7h-1v-1.5z" fill="#B41E1E"/>
      </svg>`,
    },
    diners: {
      name: "Diners Club",
      color: "#0079BE",
      svg: `<svg viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="32" rx="4" fill="white"/>
        <rect width="48" height="32" rx="4" stroke="#E5E7EB" stroke-width="1"/>
        <circle cx="18" cy="16" r="8" fill="#0079BE"/>
        <circle cx="30" cy="16" r="8" fill="#0079BE"/>
        <path d="M24 10v12" stroke="white" stroke-width="2"/>
      </svg>`,
    },
    pix: {
      name: "PIX",
      color: "#32BCAD",
      svg: `<svg viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="32" rx="4" fill="white"/>
        <rect width="48" height="32" rx="4" stroke="#E5E7EB" stroke-width="1"/>
        <path d="M24 8l-8 8 8 8 8-8-8-8zm0 2.8l5.2 5.2-5.2 5.2-5.2-5.2L24 10.8z" fill="#32BCAD"/>
        <path d="M20 16h8M24 12v8" stroke="#32BCAD" stroke-width="2"/>
      </svg>`,
    },
    boleto: {
      name: "Boleto",
      color: "#FF6B00",
      svg: `<svg viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="32" rx="4" fill="white"/>
        <rect width="48" height="32" rx="4" stroke="#E5E7EB" stroke-width="1"/>
        <rect x="10" y="10" width="1.5" height="12" fill="#FF6B00"/>
        <rect x="13" y="10" width="2" height="12" fill="#FF6B00"/>
        <rect x="17" y="10" width="1" height="12" fill="#FF6B00"/>
        <rect x="20" y="10" width="2.5" height="12" fill="#FF6B00"/>
        <rect x="24" y="10" width="1" height="12" fill="#FF6B00"/>
        <rect x="27" y="10" width="2" height="12" fill="#FF6B00"/>
        <rect x="31" y="10" width="1.5" height="12" fill="#FF6B00"/>
        <rect x="34" y="10" width="2.5" height="12" fill="#FF6B00"/>
      </svg>`,
    },
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.3,
      },
    },
  };

  const getGridClasses = () => {
    if (variant === "grid") {
      return isMobile ? "grid grid-cols-3 gap-2" : "grid grid-cols-4 gap-3";
    }
    return isMobile ? "flex flex-wrap gap-2 justify-center" : "flex flex-wrap gap-3 justify-center";
  };

  return (
    <motion.div
      className={cn("w-full", className)}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className={getGridClasses()}>
        {methods.map((method) => {
          const icon = paymentIcons[method.toLowerCase()];
          if (!icon) return null;

          return (
            <motion.div
              key={method}
              variants={itemVariants}
              whileHover={{ scale: 1.05, y: -2 }}
              className={cn(
                "relative rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 bg-white border border-gray-200",
                isMobile ? "w-14 h-9" : "w-16 h-10"
              )}
              style={{
                borderColor: theme?.borderColor || "#e5e7eb",
              }}
            >
              <div
                className="w-full h-full flex items-center justify-center"
                dangerouslySetInnerHTML={{ __html: icon.svg }}
              />

              {showText && (
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-[8px] text-center py-0.5">
                  {icon.name}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Texto informativo */}
      {!isMobile && (
        <motion.p
          className="text-center text-xs mt-3 opacity-60"
          style={{ color: theme?.textColor || "#6b7280" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 0.5 }}
        >
          Aceitamos as principais bandeiras de cartão
        </motion.p>
      )}
    </motion.div>
  );
};

export default PaymentMethodIcons;
