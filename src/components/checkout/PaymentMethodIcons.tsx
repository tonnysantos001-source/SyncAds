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
import { Visa, Mastercard, Amex, Elo, Discover, DinersClub, Pix, Boleto } from "react-pay-icons";

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
  methods = ["visa", "mastercard", "amex", "elo", "discover", "diners", "pix", "boleto"],
}) => {
  // SVG dos cartões de crédito
  const getIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case "visa":
        return <Visa style={{ width: "100%", height: "100%" }} />;
      case "mastercard":
        return <Mastercard style={{ width: "100%", height: "100%" }} />;
      case "amex":
        return <Amex style={{ width: "100%", height: "100%" }} />;
      case "elo":
        return <Elo style={{ width: "100%", height: "100%" }} />;
      case "discover":
        return <Discover style={{ width: "100%", height: "100%" }} />;
      case "diners":
        return <DinersClub style={{ width: "100%", height: "100%" }} />;
      case "pix":
        return <Pix style={{ width: "100%", height: "100%" }} />;
      case "boleto":
        return <Boleto style={{ width: "100%", height: "100%" }} />;
      default:
        return null;
    }
  };

  const getName = (method: string) => {
    switch (method.toLowerCase()) {
      case "visa": return "Visa";
      case "mastercard": return "Mastercard";
      case "amex": return "Amex";
      case "elo": return "Elo";
      case "discover": return "Discover";
      case "diners": return "Diners";
      case "pix": return "PIX";
      case "boleto": return "Boleto";
      default: return "";
    }
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
          const iconComponent = getIcon(method);
          if (!iconComponent) return null;

          return (
            <motion.div
              key={method}
              variants={itemVariants}
              whileHover={{ scale: 1.05, y: -2 }}
              className={cn(
                "relative rounded-md overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 bg-white border border-gray-200",
                isMobile ? "w-10 h-6" : "w-12 h-8"
              )}
              style={{
                borderColor: theme?.borderColor || "#e5e7eb",
              }}
            >
              <div
                className="w-full h-full flex items-center justify-center p-1"
              >
                 {iconComponent}
              </div>

              {showText && (
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-[8px] text-center py-0.5">
                  {getName(method)}
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

