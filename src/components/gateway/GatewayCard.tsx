import React from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import GatewayLogo from "./GatewayLogo";
import { CheckCircle2, Globe2, MapPin, Zap, TrendingUp, ChevronRight } from "lucide-react";

interface GatewayCardProps {
  id: string;
  name: string;
  slug: string;
  logo: string;
  type: "nacional" | "global" | "both";
  status: "active" | "inactive";
  environment?: "production" | "sandbox";
  isVerified?: boolean;
  isActive?: boolean;
  isPopular?: boolean;
  isNew?: boolean;
  description?: string;
  onClick?: () => void;
  delay?: number;
  connectionStatus?: "connected" | "configured_without_test" | "failed" | "not_configured";
}

export const GatewayCard: React.FC<GatewayCardProps> = ({
  id,
  name,
  slug,
  logo,
  type,
  status,
  environment,
  isVerified,
  isActive,
  isPopular = false,
  isNew = false,
  description,
  onClick,
  delay = 0,
  connectionStatus,
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/checkout/gateways/${slug}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -2 }}
    >
      <Card
        className={cn(
          "relative cursor-pointer overflow-hidden p-5 flex items-center justify-between gap-4 border",
          "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800/80",
          "shadow-sm hover:shadow-md transition-all duration-200 group",
          isActive && "border-green-500/30 bg-green-50/10 dark:bg-green-950/5"
        )}
        onClick={handleClick}
      >
        {/* Left Side: Logo + Information */}
        <div className="flex items-center gap-4 min-w-0 flex-1">
          {/* Logo container */}
          <div className="flex-shrink-0 w-14 h-14 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 overflow-hidden transition-all duration-200 group-hover:scale-105">
            <GatewayLogo
              name={name}
              logo={logo}
              slug={slug}
              size="md"
              className="border-0 bg-transparent rounded-none"
            />
          </div>

          {/* Info panel */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 dark:text-white text-base truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                {name}
              </h3>
              
              {/* Type Badge */}
              {type === "nacional" && (
                <Badge
                  variant="outline"
                  className="bg-green-50/50 text-green-700 dark:bg-green-950/20 dark:text-green-400 border-green-200/50 dark:border-green-800/30 text-[10px] px-1.5 py-0 font-medium rounded-md"
                >
                  Nacional
                </Badge>
              )}
              {type === "global" && (
                <Badge
                  variant="outline"
                  className="bg-blue-50/50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border-blue-200/50 dark:border-blue-800/30 text-[10px] px-1.5 py-0 font-medium rounded-md"
                >
                  Global
                </Badge>
              )}
              {type === "both" && (
                <Badge
                  variant="outline"
                  className="bg-purple-50/50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400 border-purple-200/50 dark:border-purple-800/30 text-[10px] px-1.5 py-0 font-medium rounded-md"
                >
                  Híbrido
                </Badge>
              )}

              {/* Status indicator badge (if active) */}
              {isActive ? (
                <span className="flex items-center gap-1 text-[11px] font-medium text-green-700 dark:text-green-400 bg-green-500/10 dark:bg-green-500/5 px-2 py-0.5 rounded-full border border-green-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Ativo
                </span>
              ) : (
                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                  Inativo
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
              {description || "Integração de pagamentos para sua loja"}
            </p>

            {/* Connection status tag */}
            {isActive && (
              <div className="mt-1 flex items-center gap-1.5">
                {connectionStatus === "connected" && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-emerald-500" />
                    Conectado e testado
                  </span>
                )}
                {connectionStatus === "configured_without_test" && (
                  <span className="text-[10px] text-yellow-600 dark:text-yellow-400 font-medium flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-yellow-500" />
                    Configurado sem teste
                  </span>
                )}
                {connectionStatus === "failed" && (
                  <span className="text-[10px] text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-red-500" />
                    Falha na última sincronização
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Chevron Link Arrow */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isPopular && (
            <Badge className="bg-gradient-to-r from-orange-500/10 to-red-500/10 hover:from-orange-500/10 hover:to-red-500/10 text-orange-700 dark:text-orange-400 border border-orange-200/30 text-[10px] px-1.5 py-0 font-medium rounded-md">
              Popular
            </Badge>
          )}
          <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all duration-200" />
        </div>
      </Card>
    </motion.div>
  );
};

export default GatewayCard;
