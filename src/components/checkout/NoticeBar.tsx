/**
 * NoticeBar - Barra de Avisos Moderna com Animações
 *
 * Barra de avisos totalmente customizável com animações profissionais
 * - Múltiplos estilos (normal, destaque, urgência)
 * - Animações suaves (slide, fade, pulse, marquee)
 * - Posicionamento (topo ou rodapé)
 * - Ícones dinâmicos
 * - Fechável (opcional)
 * - Responsivo
 *
 * @version 2.0
 * @date 2025
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  AlertCircle,
  Info,
  Zap,
  TrendingUp,
  Gift,
  Sparkles,
  Bell,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NoticeBarProps {
  theme: any;
  className?: string;
  isMobile?: boolean;
  closeable?: boolean;
  autoHide?: boolean;
  autoHideDelay?: number;
}

export const NoticeBar: React.FC<NoticeBarProps> = ({
  theme,
  className = "",
  isMobile = false,
  closeable = false,
  autoHide = false,
  autoHideDelay = 5000,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  // ============================================
  // VERIFICAR SE DEVE MOSTRAR
  // ============================================

  if (!theme.noticeBarEnabled || !theme.noticeBarText) {
    return null;
  }

  // ============================================
  // AUTO HIDE
  // ============================================

  useEffect(() => {
    if (autoHide && !isHovered) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
  }, [autoHide, autoHideDelay, isHovered]);

  // ============================================
  // ESTILOS E CONFIGURAÇÕES
  // ============================================

  const style = theme.noticeBarStyle || "normal";
  const position = theme.noticeBarPosition || "top";
  const animation = theme.noticeBarAnimation || "slide";

  // Cores baseadas no estilo
  const getStyleColors = () => {
    if (theme.noticeBarTextColor && theme.noticeBarBackgroundColor) {
      return {
        bg: theme.noticeBarBackgroundColor,
        text: theme.noticeBarTextColor,
      };
    }

    switch (style) {
      case "urgent":
        return {
          bg: "#ef4444",
          text: "#ffffff",
          accent: "#fca5a5",
        };
      case "highlight":
        return {
          bg: "#8b5cf6",
          text: "#ffffff",
          accent: "#c4b5fd",
        };
      default:
        return {
          bg: "#3b82f6",
          text: "#ffffff",
          accent: "#93c5fd",
        };
    }
  };

  const colors = getStyleColors();

  // Ícone baseado no estilo
  const getIcon = () => {
    switch (style) {
      case "urgent":
        return Zap;
      case "highlight":
        return Sparkles;
      default:
        return Bell;
    }
  };

  const Icon = getIcon();

  // ============================================
  // ANIMAÇÕES
  // ============================================

  const getAnimationVariants = () => {
    const direction = position === "top" ? -100 : 100;

    switch (animation) {
      case "fade":
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
          transition: { duration: 0.5 },
        };

      case "slide":
        return {
          initial: { y: direction, opacity: 0 },
          animate: { y: 0, opacity: 1 },
          exit: { y: direction, opacity: 0 },
          transition: { type: "spring", stiffness: 100, damping: 15 },
        };

      case "scale":
        return {
          initial: { scale: 0.8, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          exit: { scale: 0.8, opacity: 0 },
          transition: { type: "spring", stiffness: 150 },
        };

      default:
        return {
          initial: { y: direction, opacity: 0 },
          animate: { y: 0, opacity: 1 },
          exit: { y: direction, opacity: 0 },
          transition: { duration: 0.4 },
        };
    }
  };

  // Animação de pulse para estilo urgente
  const pulseAnimation =
    style === "urgent"
      ? {
          scale: [1, 1.02, 1],
          transition: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          },
        }
      : {};

  // ============================================
  // RENDER
  // ============================================

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          className={cn(
            "w-full relative overflow-hidden",
            position === "top" ? "top-0" : "bottom-0",
            className
          )}
          style={{
            backgroundColor: colors.bg,
            color: colors.text,
          }}
          {...getAnimationVariants()}
          animate={{
            ...getAnimationVariants().animate,
            ...pulseAnimation,
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Efeito de fundo animado */}
          {style === "highlight" && (
            <motion.div
              className="absolute inset-0 opacity-10"
              animate={{
                backgroundPosition: ["0% 0%", "100% 100%"],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "linear",
              }}
              style={{
                background: `linear-gradient(45deg, ${colors.accent} 25%, transparent 25%, transparent 75%, ${colors.accent} 75%, ${colors.accent})`,
                backgroundSize: "20px 20px",
              }}
            />
          )}

          {/* Conteúdo */}
          <div
            className={cn(
              "relative flex items-center justify-center gap-3 z-10",
              isMobile ? "px-3 py-2.5" : "px-6 py-3"
            )}
          >
            {/* Ícone */}
            <motion.div
              animate={{
                rotate: style === "urgent" ? [0, -10, 10, -10, 0] : 0,
              }}
              transition={{
                duration: 0.5,
                repeat: style === "urgent" ? Infinity : 0,
                repeatDelay: 2,
              }}
            >
              <Icon
                className={cn(
                  "flex-shrink-0",
                  isMobile ? "w-4 h-4" : "w-5 h-5"
                )}
                style={{ color: colors.text }}
              />
            </motion.div>

            {/* Texto */}
            <motion.p
              className={cn(
                "font-semibold text-center flex-1",
                isMobile ? "text-xs" : "text-sm"
              )}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              {theme.noticeBarText}
            </motion.p>

            {/* Botão de fechar */}
            {closeable && (
              <motion.button
                onClick={() => setIsVisible(false)}
                className={cn(
                  "flex-shrink-0 hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-all",
                  isMobile ? "ml-1" : "ml-2"
                )}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Fechar aviso"
              >
                <X
                  className={cn(isMobile ? "w-4 h-4" : "w-5 h-5")}
                  style={{ color: colors.text }}
                />
              </motion.button>
            )}

            {/* Seta decorativa */}
            {!isMobile && style === "highlight" && (
              <motion.div
                animate={{
                  x: [0, 5, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <ChevronRight className="w-5 h-5" style={{ color: colors.text }} />
              </motion.div>
            )}
          </div>

          {/* Barra de progresso (se autoHide) */}
          {autoHide && !isHovered && (
            <motion.div
              className="absolute bottom-0 left-0 h-1 bg-white bg-opacity-30"
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: autoHideDelay / 1000, ease: "linear" }}
            />
          )}

          {/* Efeito de brilho */}
          {style === "highlight" && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              animate={{
                background: [
                  "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0) 40%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 60%, transparent 100%)",
                  "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0) 40%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 60%, transparent 100%)",
                ],
                backgroundPosition: ["-200%", "200%"],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
              }}
              style={{
                backgroundSize: "200% 100%",
              }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NoticeBar;

