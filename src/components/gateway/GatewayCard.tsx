import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import GatewayLogo from "./GatewayLogo";
import { CheckCircle2, Globe2, MapPin, Zap, TrendingUp } from "lucide-react";

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
  onClick?: () => void;
  delay?: number;
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
  onClick,
  delay = 0,
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card
        className={cn(
          "relative cursor-pointer overflow-hidden group",
          "border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl",
          "shadow-lg hover:shadow-2xl transition-all duration-300",
          isActive && "ring-2 ring-green-500/50 dark:ring-green-500/30",
        )}
        onClick={handleClick}
      >
        {/* Gradient Blob Background */}
        <div
          className={cn(
            "absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500",
            isActive
              ? "bg-gradient-to-br from-green-500 to-emerald-600"
              : "bg-gradient-to-br from-blue-500 to-purple-600",
          )}
        />

        {/* Status Indicator Bar */}
        {isActive && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-green-500 animate-pulse" />
        )}

        <CardContent className="p-6">
          {/* Header: Logo + Badges */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-4">
              {/* Logo */}
              <GatewayLogo
                name={name}
                logo={logo}
                slug={slug}
                size="lg"
                className="group-hover:scale-110 transition-transform duration-300"
              />

              {/* Name and Status */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text transition-all duration-300">
                    {name}
                  </h3>
                </div>

                {/* Type Badges */}
                <div className="flex gap-2 flex-wrap mb-2">
                  {(type === "nacional" || type === "both") && (
                    <Badge
                      variant="secondary"
                      className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 text-green-700 dark:text-green-400 text-xs border-0 backdrop-blur-sm"
                    >
                      <MapPin className="w-3 h-3 mr-1" />
                      Nacional
                    </Badge>
                  )}
                  {(type === "global" || type === "both") && (
                    <Badge
                      variant="secondary"
                      className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 text-blue-700 dark:text-blue-400 text-xs border-0 backdrop-blur-sm"
                    >
                      <Globe2 className="w-3 h-3 mr-1" />
                      Global
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Active Indicator */}
            {isActive && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="flex-shrink-0"
              >
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-medium text-green-700 dark:text-green-400">
                    Ativo
                  </span>
                </div>
              </motion.div>
            )}
          </div>

          {/* Special Badges Row */}
          {(isPopular || isNew || isVerified) && (
            <div className="flex gap-2 mb-3">
              {isPopular && (
                <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 text-xs">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Popular
                </Badge>
              )}
              {isNew && (
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 text-xs">
                  <Zap className="w-3 h-3 mr-1" />
                  Novo
                </Badge>
              )}
              {isVerified && (
                <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 text-xs">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Verificado
                </Badge>
              )}
            </div>
          )}

          {/* Hover Action Indicator */}
          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-medium">
              Configurar
              <motion.div
                animate={{ x: [0, 4, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                →
              </motion.div>
            </div>
          </div>
        </CardContent>

        {/* Bottom Gradient Line */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </Card>
    </motion.div>
  );
};

export default GatewayCard;
