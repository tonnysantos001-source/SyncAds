/**
 * LogoHeader - Cabeçalho com Logo Totalmente Customizável
 *
 * Gerencia a exibição da logo no checkout com:
 * - Alinhamento customizável (left, center, right)
 * - Dimensões configuráveis (width, height)
 * - Link opcional
 * - Fallback para nome da loja
 * - Animações suaves
 * - Responsivo
 *
 * Melhora branding e profissionalismo do checkout.
 *
 * Suporta todas as personalizações do tema:
 * - logoUrl (URL da imagem)
 * - logoAlignment (left | center | right)
 * - logoWidth (largura em pixels)
 * - logoHeight (altura em pixels)
 * - showLogoAtTop (exibir no topo)
 *
 * @version 1.0
 * @date 08/01/2025
 */

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Store, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoHeaderProps {
  theme: any;
  storeName?: string;
  storeUrl?: string;
  className?: string;
  showBackground?: boolean;
  compact?: boolean;
}

export const LogoHeader: React.FC<LogoHeaderProps> = ({
  theme,
  storeName = "Minha Loja",
  storeUrl,
  className = "",
  showBackground = false,
  compact = false,
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // ============================================
  // VERIFICAR SE DEVE MOSTRAR LOGO
  // ============================================

  if (!theme.showLogoAtTop) return null;

  // ============================================
  // CONFIGURAÇÕES DO TEMA
  // ============================================

  const logoUrl = theme.logoUrl;
  const logoAlignment = theme.logoAlignment || "center";
  const logoWidth = theme.logoWidth || 180;
  const logoHeight = theme.logoHeight || 60;
  const backgroundColor = theme.backgroundColor || "#ffffff";
  const textColor = theme.textColor || "#1f2937";

  // ============================================
  // ALINHAMENTO
  // ============================================

  const getAlignmentClass = () => {
    switch (logoAlignment) {
      case "left":
        return "justify-start";
      case "right":
        return "justify-end";
      case "center":
      default:
        return "justify-center";
    }
  };

  // ============================================
  // LIDAR COM ERRO DE IMAGEM
  // ============================================

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  // ============================================
  // RENDERIZAR FALLBACK (TEXTO)
  // ============================================

  const renderFallback = () => (
    <motion.div
      className="flex items-center gap-3"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div
        className="p-2 rounded-lg"
        style={{
          backgroundColor: theme.primaryButtonBackgroundColor || "#8b5cf6",
        }}
      >
        <Store className="w-6 h-6 text-white" />
      </div>
      <h1
        className="text-xl md:text-2xl font-bold"
        style={{ color: textColor }}
      >
        {storeName}
      </h1>
    </motion.div>
  );

  // ============================================
  // RENDERIZAR SKELETON (CARREGANDO)
  // ============================================

  const renderSkeleton = () => (
    <div
      className="animate-pulse rounded-lg flex items-center justify-center"
      style={{
        width: logoWidth,
        height: logoHeight,
        backgroundColor: theme.cardBackgroundColor || "#f3f4f6",
      }}
    >
      <ImageIcon className="w-8 h-8 text-gray-400" />
    </div>
  );

  // ============================================
  // RENDERIZAR LOGO
  // ============================================

  const renderLogo = () => {
    // Se não tem URL ou deu erro, mostrar fallback
    if (!logoUrl || imageError) {
      return renderFallback();
    }

    return (
      <motion.div
        className="relative"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          maxWidth: logoWidth,
        }}
      >
        {/* Skeleton enquanto carrega */}
        {imageLoading && renderSkeleton()}

        {/* Imagem da Logo */}
        <img
          src={logoUrl}
          alt={`${storeName} Logo`}
          className={cn(
            "object-contain transition-opacity duration-300",
            imageLoading ? "opacity-0 absolute inset-0" : "opacity-100"
          )}
          style={{
            width: compact ? logoWidth * 0.7 : logoWidth,
            height: compact ? logoHeight * 0.7 : logoHeight,
            maxWidth: "100%",
          }}
          onError={handleImageError}
          onLoad={handleImageLoad}
          loading="eager"
        />
      </motion.div>
    );
  };

  // ============================================
  // RENDERIZAR COM OU SEM LINK
  // ============================================

  const logoElement = renderLogo();

  const logoWithLink = storeUrl ? (
    <a
      href={storeUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-block transition-transform hover:scale-105 active:scale-95"
      aria-label={`Visitar ${storeName}`}
    >
      {logoElement}
    </a>
  ) : (
    logoElement
  );

  // ============================================
  // RENDERIZAR COMPONENTE
  // ============================================

  return (
    <motion.header
      className={cn(
        "w-full transition-all duration-300",
        showBackground ? "shadow-sm" : "",
        compact ? "py-3" : "py-4 md:py-6",
        className
      )}
      style={{
        backgroundColor: showBackground ? backgroundColor : "transparent",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="container mx-auto px-4">
        <div className={cn("flex items-center", getAlignmentClass())}>
          {logoWithLink}
        </div>
      </div>
    </motion.header>
  );
};

// ============================================
// EXPORT DEFAULT
// ============================================

export default LogoHeader;

