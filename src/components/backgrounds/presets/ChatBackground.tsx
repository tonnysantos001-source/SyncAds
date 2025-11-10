/**
 * CHAT BACKGROUND
 *
 * Background para a página de Chat IA.
 * Dark theme com partículas sutis e efeitos minimalistas.
 *
 * USO:
 * <ChatBackground />
 */

import { AnimatedGradient } from "../AnimatedGradient";
import { SubtleParticles } from "../ParticlesBackground";

interface ChatBackgroundProps {
  /** Estilo do background */
  style?: "dark" | "minimal" | "vibrant" | "neon";
  /** Mostrar partículas */
  showParticles?: boolean;
  /** Intensidade do efeito */
  intensity?: "subtle" | "medium" | "intense";
}

export function ChatBackground({
  style = "dark",
  showParticles = true,
  intensity = "subtle",
}: ChatBackgroundProps) {
  const styleConfig = {
    dark: {
      baseColor: "#0A0A0F",
      gradient: "midnight" as const,
      overlay: 0.9,
      particleTheme: "dark" as const,
    },
    minimal: {
      baseColor: "#12121A",
      gradient: "midnight" as const,
      overlay: 0.85,
      particleTheme: "dark" as const,
    },
    vibrant: {
      baseColor: "#0A0A0F",
      gradient: "aurora" as const,
      overlay: 0.7,
      particleTheme: "purple" as const,
    },
    neon: {
      baseColor: "#000000",
      gradient: "synthwave" as const,
      overlay: 0.8,
      particleTheme: "gradient" as const,
    },
  };

  const config = styleConfig[style];

  const intensityMap = {
    subtle: 15,
    medium: 30,
    intense: 50,
  };

  return (
    <div className="fixed inset-0 -z-10">
      {/* Base solid color */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: config.baseColor }}
      />

      {/* Animated gradient overlay */}
      <AnimatedGradient
        variant={config.gradient}
        speed={0.3}
        overlay={config.overlay}
        blur={150}
        showPattern={false}
      />

      {/* Subtle particles */}
      {showParticles && (
        <div className="absolute inset-0">
          <SubtleParticles />
        </div>
      )}

      {/* Ambient light effect (top) */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-purple-500/5 to-transparent" />

      {/* Ambient light effect (bottom) */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-blue-500/5 to-transparent" />

      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.02] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}

/**
 * VARIANTE: Chat Minimal
 * Versão ultra minimalista
 */
export function MinimalChatBackground() {
  return <ChatBackground style="minimal" showParticles={false} />;
}

/**
 * VARIANTE: Chat Vibrant
 * Versão com mais cor
 */
export function VibrantChatBackground() {
  return (
    <ChatBackground
      style="vibrant"
      showParticles={true}
      intensity="medium"
    />
  );
}

/**
 * VARIANTE: Chat Neon
 * Estilo neon/cyberpunk
 */
export function NeonChatBackground() {
  return (
    <ChatBackground
      style="neon"
      showParticles={true}
      intensity="intense"
    />
  );
}

/**
 * VARIANTE: Chat Professional
 * Versão profissional sem distrações
 */
export function ProfessionalChatBackground() {
  return (
    <div className="fixed inset-0 -z-10 bg-[#0A0A0F]">
      {/* Sutil gradient apenas */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-[#0A0A0F] to-gray-900" />

      {/* Grid pattern muito sutil */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(139, 92, 246, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 246, 0.1) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />
    </div>
  );
}
