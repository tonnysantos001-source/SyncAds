/**
 * LOGIN BACKGROUND
 *
 * Background completo para páginas de Login/Register.
 * Combina gradiente animado com partículas interativas.
 *
 * USO:
 * <LoginBackground />
 */

import { AnimatedGradient } from "../AnimatedGradient";
import { ParticlesBackground } from "../ParticlesBackground";

interface LoginBackgroundProps {
  /** Tema de cores */
  theme?: "aurora" | "sunset" | "ocean" | "midnight" | "synthwave";
  /** Mostrar partículas */
  showParticles?: boolean;
  /** Intensidade das partículas */
  particleIntensity?: "low" | "medium" | "high";
  /** Overlay escuro (0-1) */
  darkOverlay?: number;
}

export function LoginBackground({
  theme = "aurora",
  showParticles = true,
  particleIntensity = "medium",
  darkOverlay = 0.3,
}: LoginBackgroundProps) {
  const particleDensity = {
    low: 30,
    medium: 60,
    high: 100,
  };

  const particleTheme = {
    aurora: "purple" as const,
    sunset: "pink" as const,
    ocean: "blue" as const,
    midnight: "dark" as const,
    synthwave: "gradient" as const,
  };

  return (
    <div className="fixed inset-0 -z-10">
      {/* Gradiente animado de fundo */}
      <AnimatedGradient
        variant={theme}
        speed={0.8}
        overlay={darkOverlay}
        blur={100}
        showPattern={false}
      />

      {/* Partículas interativas (opcional) */}
      {showParticles && (
        <ParticlesBackground
          theme={particleTheme[theme]}
          density={particleDensity[particleIntensity]}
          speed={0.4}
          interactive={true}
        />
      )}

      {/* Vinheta nas bordas */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/30" />
    </div>
  );
}

/**
 * VARIANTE: Login Minimalista
 * Versão mais limpa sem partículas
 */
export function MinimalLoginBackground() {
  return <LoginBackground showParticles={false} darkOverlay={0.2} />;
}

/**
 * VARIANTE: Login Dark
 * Versão escura para modo noturno
 */
export function DarkLoginBackground() {
  return (
    <LoginBackground
      theme="midnight"
      showParticles={true}
      particleIntensity="low"
      darkOverlay={0.5}
    />
  );
}

/**
 * VARIANTE: Login Vibrant
 * Versão vibrante e chamativa
 */
export function VibrantLoginBackground() {
  return (
    <LoginBackground
      theme="synthwave"
      showParticles={true}
      particleIntensity="high"
      darkOverlay={0.2}
    />
  );
}

