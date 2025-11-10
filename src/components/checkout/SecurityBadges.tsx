/**
 * SecurityBadges - Selos de Segurança Profissionais
 *
 * Exibe selos de segurança e certificações para aumentar confiança do cliente
 * - SSL/TLS Certificate
 * - Google Safe Browsing
 * - Compra 100% Segura
 * - Proteção de Dados
 * - Certificações PCI DSS
 *
 * @version 1.0
 * @date 2025
 */

import React from "react";
import { motion } from "framer-motion";
import { Shield, Lock, CheckCircle, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface SecurityBadgesProps {
  theme?: any;
  className?: string;
  isMobile?: boolean;
  variant?: "horizontal" | "vertical" | "grid";
  showText?: boolean;
}

export const SecurityBadges: React.FC<SecurityBadgesProps> = ({
  theme,
  className = "",
  isMobile = false,
  variant = "horizontal",
  showText = true,
}) => {
  const badges = [
    {
      icon: Shield,
      text: "Compra Segura",
      description: "Certificado SSL",
      color: "#10b981",
    },
    {
      icon: Lock,
      text: "Dados Protegidos",
      description: "Criptografia 256-bit",
      color: "#3b82f6",
    },
    {
      icon: ShieldCheck,
      text: "Site Verificado",
      description: "Google Safe Browsing",
      color: "#8b5cf6",
    },
    {
      icon: CheckCircle,
      text: "Pagamento Seguro",
      description: "PCI DSS Compliant",
      color: "#f59e0b",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  const getGridClasses = () => {
    if (variant === "grid") {
      return isMobile ? "grid grid-cols-2 gap-3" : "grid grid-cols-4 gap-4";
    }
    if (variant === "vertical") {
      return "flex flex-col gap-3";
    }
    return isMobile ? "flex flex-wrap gap-2 justify-center" : "flex gap-4 justify-center";
  };

  return (
    <motion.div
      className={cn("w-full", className)}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className={getGridClasses()}>
        {badges.map((badge, index) => {
          const Icon = badge.icon;
          return (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              className={cn(
                "flex items-center rounded-lg border-2 transition-all duration-300 hover:shadow-lg",
                isMobile ? "gap-2 p-2" : "gap-3 p-3",
                variant === "grid" && "flex-col text-center"
              )}
              style={{
                borderColor: `${badge.color}20`,
                backgroundColor: theme?.cardBackgroundColor || "#ffffff",
              }}
            >
              {/* Ícone */}
              <div
                className={cn(
                  "rounded-full flex items-center justify-center",
                  isMobile ? "w-8 h-8" : "w-10 h-10"
                )}
                style={{
                  backgroundColor: `${badge.color}15`,
                }}
              >
                <Icon
                  className={cn(isMobile ? "w-4 h-4" : "w-5 h-5")}
                  style={{ color: badge.color }}
                />
              </div>

              {/* Texto */}
              {showText && (
                <div className={cn(variant === "grid" && "mt-2")}>
                  <p
                    className={cn(
                      "font-semibold",
                      isMobile ? "text-[10px]" : "text-xs"
                    )}
                    style={{ color: theme?.textColor || "#111827" }}
                  >
                    {badge.text}
                  </p>
                  {!isMobile && variant !== "horizontal" && (
                    <p
                      className="text-[9px] opacity-70"
                      style={{ color: theme?.textColor || "#6b7280" }}
                    >
                      {badge.description}
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Texto adicional de garantia */}
      {showText && !isMobile && (
        <motion.p
          className="text-center text-xs mt-4 opacity-70"
          style={{ color: theme?.textColor || "#6b7280" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 0.5 }}
        >
          ✓ Seus dados estão seguros e protegidos com criptografia de ponta a ponta
        </motion.p>
      )}
    </motion.div>
  );
};

export default SecurityBadges;
