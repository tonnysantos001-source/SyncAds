/**
 * ANIMATED GRADIENT BACKGROUND
 *
 * Background com gradiente animado e fluido.
 * Cria efeitos de movimento suave entre cores.
 *
 * Features:
 * - Gradientes suaves e animados
 * - Múltiplos temas de cores
 * - Efeito mesh/blob animado
 * - Performance otimizada com CSS
 * - Overlay opcional
 *
 * USO:
 * <AnimatedGradient variant="aurora" />
 */

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedGradientProps {
  /** Variante do gradiente */
  variant?:
    | "aurora"
    | "sunset"
    | "ocean"
    | "forest"
    | "midnight"
    | "synthwave"
    | "candy";
  /** Velocidade da animação (1 = normal, 2 = rápido, 0.5 = lento) */
  speed?: number;
  /** Opacidade do overlay escuro (0-1) */
  overlay?: number;
  /** Blur do efeito (0-20) */
  blur?: number;
  /** Mostrar dots pattern */
  showPattern?: boolean;
  /** Classe CSS adicional */
  className?: string;
}

// Definição de gradientes por tema
const gradientVariants = {
  aurora: {
    colors: ["#8B5CF6", "#EC4899", "#3B82F6", "#A855F7"],
    positions: ["0% 0%", "100% 0%", "100% 100%", "0% 100%"],
  },
  sunset: {
    colors: ["#F59E0B", "#EF4444", "#EC4899", "#8B5CF6"],
    positions: ["0% 0%", "100% 0%", "100% 100%", "0% 100%"],
  },
  ocean: {
    colors: ["#06B6D4", "#3B82F6", "#6366F1", "#8B5CF6"],
    positions: ["0% 0%", "100% 0%", "100% 100%", "0% 100%"],
  },
  forest: {
    colors: ["#10B981", "#059669", "#047857", "#065F46"],
    positions: ["0% 0%", "100% 0%", "100% 100%", "0% 100%"],
  },
  midnight: {
    colors: ["#1E293B", "#334155", "#475569", "#64748B"],
    positions: ["0% 0%", "100% 0%", "100% 100%", "0% 100%"],
  },
  synthwave: {
    colors: ["#EC4899", "#8B5CF6", "#3B82F6", "#06B6D4"],
    positions: ["0% 0%", "100% 0%", "100% 100%", "0% 100%"],
  },
  candy: {
    colors: ["#EC4899", "#F472B6", "#FBCFE8", "#FDF2F8"],
    positions: ["0% 0%", "100% 0%", "100% 100%", "0% 100%"],
  },
};

export function AnimatedGradient({
  variant = "aurora",
  speed = 1,
  overlay = 0,
  blur = 0,
  showPattern = false,
  className,
}: AnimatedGradientProps) {
  const config = gradientVariants[variant];
  const animationDuration = 15 / speed;

  return (
    <div className={cn("absolute inset-0 -z-10 overflow-hidden", className)}>
      {/* Animated Gradient Blobs */}
      <div className="absolute inset-0">
        {config.colors.map((color, index) => (
          <motion.div
            key={index}
            className="absolute rounded-full mix-blend-multiply"
            style={{
              backgroundColor: color,
              width: "40vw",
              height: "40vw",
              filter: `blur(${blur || 80}px)`,
              opacity: 0.7,
            }}
            animate={{
              x: [
                `${Math.sin(index * Math.PI * 0.5) * 30}%`,
                `${Math.sin((index + 1) * Math.PI * 0.5) * 30}%`,
                `${Math.sin(index * Math.PI * 0.5) * 30}%`,
              ],
              y: [
                `${Math.cos(index * Math.PI * 0.5) * 30}%`,
                `${Math.cos((index + 1) * Math.PI * 0.5) * 30}%`,
                `${Math.cos(index * Math.PI * 0.5) * 30}%`,
              ],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: animationDuration + index * 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            initial={{
              left: config.positions[index].split(" ")[0],
              top: config.positions[index].split(" ")[1],
            }}
          />
        ))}
      </div>

      {/* Dots Pattern Overlay (opcional) */}
      {showPattern && (
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
      )}

      {/* Dark Overlay (opcional) */}
      {overlay > 0 && (
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: overlay }}
        />
      )}
    </div>
  );
}

/**
 * VARIANTE: Gradiente estático com animação sutil
 */
export function StaticGradient({
  variant = "aurora",
  className,
}: Pick<AnimatedGradientProps, "variant" | "className">) {
  const config = gradientVariants[variant];

  return (
    <div className={cn("absolute inset-0 -z-10", className)}>
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${config.colors.join(", ")})`,
        }}
      />
    </div>
  );
}

/**
 * VARIANTE: Mesh Gradient (estilo moderno)
 */
export function MeshGradient({
  variant = "aurora",
  className,
}: Pick<AnimatedGradientProps, "variant" | "className">) {
  const config = gradientVariants[variant];

  return (
    <div className={cn("absolute inset-0 -z-10 overflow-hidden", className)}>
      {config.colors.map((color, index) => (
        <motion.div
          key={index}
          className="absolute rounded-full mix-blend-screen"
          style={{
            background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
            width: "50vw",
            height: "50vw",
            left: `${(index % 2) * 50}%`,
            top: `${Math.floor(index / 2) * 50}%`,
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 8 + index,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/**
 * VARIANTE: Wave Gradient (ondas animadas)
 */
export function WaveGradient({
  variant = "ocean",
  className,
}: Pick<AnimatedGradientProps, "variant" | "className">) {
  const config = gradientVariants[variant];

  return (
    <div className={cn("absolute inset-0 -z-10 overflow-hidden", className)}>
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            {config.colors.map((color, index) => (
              <stop
                key={index}
                offset={`${(index / (config.colors.length - 1)) * 100}%`}
                stopColor={color}
              />
            ))}
          </linearGradient>
        </defs>
        <motion.rect
          width="100%"
          height="100%"
          fill="url(#gradient)"
          animate={{
            x: ["-25%", "25%", "-25%"],
            y: ["-25%", "25%", "-25%"],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </svg>
    </div>
  );
}

/**
 * VARIANTE: Glow Gradient (efeito neon)
 */
export function GlowGradient({
  variant = "synthwave",
  className,
}: Pick<AnimatedGradientProps, "variant" | "className">) {
  const config = gradientVariants[variant];

  return (
    <div className={cn("absolute inset-0 -z-10 overflow-hidden", className)}>
      <div className="absolute inset-0 bg-black" />
      {config.colors.map((color, index) => (
        <motion.div
          key={index}
          className="absolute rounded-full"
          style={{
            background: `radial-gradient(circle, ${color} 0%, transparent 60%)`,
            width: "30vw",
            height: "30vw",
            filter: "blur(60px)",
            left: `${25 + (index % 2) * 50}%`,
            top: `${25 + Math.floor(index / 2) * 50}%`,
            transform: "translate(-50%, -50%)",
          }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 6 + index,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

