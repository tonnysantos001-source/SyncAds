/**
 * GLASS BACKGROUND
 *
 * Background com efeito glassmorphism (vidro fosco).
 * Perfeito para painéis, cards e overlays modernos.
 *
 * Features:
 * - Efeito de vidro com blur
 * - Bordas brilhantes
 * - Variantes de cor
 * - Animações suaves
 * - Totalmente responsivo
 *
 * USO:
 * <GlassBackground variant="purple" intensity="medium" />
 */

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassBackgroundProps {
  /** Variante de cor do vidro */
  variant?: "purple" | "blue" | "pink" | "dark" | "light" | "gradient";
  /** Intensidade do blur (low, medium, high) */
  intensity?: "low" | "medium" | "high";
  /** Mostrar borda brilhante */
  showBorder?: boolean;
  /** Mostrar grid pattern */
  showGrid?: boolean;
  /** Opacidade do fundo (0-1) */
  opacity?: number;
  /** Conteúdo interno (opcional) */
  children?: ReactNode;
  /** Classe CSS adicional */
  className?: string;
  /** Animar entrada */
  animated?: boolean;
}

// Configurações de blur por intensidade
const blurIntensity = {
  low: "backdrop-blur-sm",
  medium: "backdrop-blur-md",
  high: "backdrop-blur-xl",
};

// Configurações de cor por variante
const colorVariants = {
  purple: "bg-purple-500/10 border-purple-500/20",
  blue: "bg-blue-500/10 border-blue-500/20",
  pink: "bg-pink-500/10 border-pink-500/20",
  dark: "bg-gray-900/30 border-white/10",
  light: "bg-white/20 border-white/30",
  gradient: "bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10 border-purple-500/20",
};

export function GlassBackground({
  variant = "purple",
  intensity = "medium",
  showBorder = true,
  showGrid = false,
  opacity = 1,
  children,
  className,
  animated = true,
}: GlassBackgroundProps) {
  const Component = animated ? motion.div : "div";

  return (
    <Component
      {...(animated && {
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1 },
        transition: { duration: 0.5, ease: "easeOut" },
      })}
      className={cn(
        "relative overflow-hidden",
        blurIntensity[intensity],
        colorVariants[variant],
        showBorder && "border",
        className
      )}
      style={{ opacity }}
    >
      {/* Grid Pattern (opcional) */}
      {showGrid && (
        <div className="absolute inset-0 opacity-20">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />
        </div>
      )}

      {/* Shine Effect */}
      {showBorder && (
        <div className="absolute inset-0 rounded-[inherit]">
          <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-br from-white/20 via-transparent to-transparent" />
        </div>
      )}

      {/* Content */}
      {children && <div className="relative z-10">{children}</div>}
    </Component>
  );
}

/**
 * VARIANTE: Glass Card
 * Card com efeito de vidro completo
 */
export function GlassCard({
  variant = "purple",
  children,
  className,
  animated = true,
}: Pick<
  GlassBackgroundProps,
  "variant" | "children" | "className" | "animated"
>) {
  return (
    <GlassBackground
      variant={variant}
      intensity="medium"
      showBorder={true}
      showGrid={false}
      animated={animated}
      className={cn("rounded-2xl p-6 shadow-2xl", className)}
    >
      {children}
    </GlassBackground>
  );
}

/**
 * VARIANTE: Glass Panel
 * Painel lateral com vidro
 */
export function GlassPanel({
  children,
  className,
  position = "right",
}: {
  children: ReactNode;
  className?: string;
  position?: "left" | "right";
}) {
  return (
    <motion.div
      initial={{ x: position === "right" ? 100 : -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: position === "right" ? 100 : -100, opacity: 0 }}
      transition={{ type: "spring", damping: 25 }}
      className={cn(
        "fixed top-0 h-screen w-80 z-50",
        position === "right" ? "right-0" : "left-0",
        className
      )}
    >
      <GlassBackground
        variant="dark"
        intensity="high"
        showBorder={true}
        showGrid={false}
        className="h-full"
      >
        {children}
      </GlassBackground>
    </motion.div>
  );
}

/**
 * VARIANTE: Glass Modal Overlay
 * Overlay de modal com efeito de vidro
 */
export function GlassModalOverlay({
  children,
  onClose,
  className,
}: {
  children: ReactNode;
  onClose?: () => void;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop blur */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal content */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="relative z-10"
      >
        <GlassBackground
          variant="dark"
          intensity="high"
          showBorder={true}
          className={cn("rounded-3xl p-8 max-w-2xl w-full shadow-2xl", className)}
        >
          {children}
        </GlassBackground>
      </motion.div>
    </motion.div>
  );
}

/**
 * VARIANTE: Glass Button
 * Botão com efeito de vidro
 */
export function GlassButton({
  children,
  onClick,
  variant = "purple",
  className,
  disabled = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: GlassBackgroundProps["variant"];
  className?: string;
  disabled?: boolean;
}) {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative overflow-hidden rounded-xl px-6 py-3 font-semibold text-white transition-all",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <GlassBackground
        variant={variant}
        intensity="low"
        showBorder={true}
        animated={false}
        className="absolute inset-0"
      />
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}

/**
 * VARIANTE: Glass Navigation
 * Barra de navegação com vidro
 */
export function GlassNavbar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={cn("fixed top-0 left-0 right-0 z-40", className)}
    >
      <GlassBackground
        variant="dark"
        intensity="high"
        showBorder={false}
        animated={false}
        className="border-b border-white/10"
      >
        <div className="container mx-auto px-4 py-4">{children}</div>
      </GlassBackground>
    </motion.nav>
  );
}

/**
 * VARIANTE: Glass Container
 * Container com vidro para seções
 */
export function GlassContainer({
  children,
  variant = "light",
  className,
}: {
  children: ReactNode;
  variant?: GlassBackgroundProps["variant"];
  className?: string;
}) {
  return (
    <GlassBackground
      variant={variant}
      intensity="medium"
      showBorder={true}
      showGrid={true}
      className={cn("rounded-3xl p-8 md:p-12", className)}
    >
      {children}
    </GlassBackground>
  );
}

/**
 * VARIANTE: Frosted Glass
 * Vidro mais opaco e fosco
 */
export function FrostedGlass({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative rounded-2xl bg-white/5 backdrop-blur-2xl border border-white/10",
        "before:absolute before:inset-0 before:rounded-2xl",
        "before:bg-gradient-to-br before:from-white/10 before:to-transparent",
        "before:opacity-50",
        className
      )}
    >
      <div className="relative z-10 p-6">{children}</div>
    </div>
  );
}

