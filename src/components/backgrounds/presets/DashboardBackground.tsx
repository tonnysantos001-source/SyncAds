/**
 * DASHBOARD BACKGROUND
 *
 * Background profissional para o dashboard principal.
 * Gradiente sutil com partículas minimalistas.
 *
 * USO:
 * <DashboardBackground />
 */

import { AnimatedGradient } from "../AnimatedGradient";
import { MinimalParticles } from "../ParticlesBackground";

interface DashboardBackgroundProps {
  /** Tema de cores */
  theme?: "professional" | "vibrant" | "calm" | "dark";
  /** Mostrar partículas */
  showParticles?: boolean;
  /** Mostrar grid pattern */
  showGrid?: boolean;
}

export function DashboardBackground({
  theme = "professional",
  showParticles = true,
  showGrid = false,
}: DashboardBackgroundProps) {
  const themeConfig = {
    professional: {
      gradient: "midnight" as const,
      particleTheme: "dark" as const,
      overlay: 0.6,
    },
    vibrant: {
      gradient: "aurora" as const,
      particleTheme: "purple" as const,
      overlay: 0.4,
    },
    calm: {
      gradient: "ocean" as const,
      particleTheme: "blue" as const,
      overlay: 0.5,
    },
    dark: {
      gradient: "midnight" as const,
      particleTheme: "dark" as const,
      overlay: 0.8,
    },
  };

  const config = themeConfig[theme];

  return (
    <div className="fixed inset-0 -z-10">
      {/* Base gradient */}
      <AnimatedGradient
        variant={config.gradient}
        speed={0.5}
        overlay={config.overlay}
        blur={120}
        showPattern={showGrid}
      />

      {/* Minimal particles */}
      {showParticles && <MinimalParticles theme={config.particleTheme} />}

      {/* Subtle vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20" />
    </div>
  );
}

/**
 * VARIANTE: Dashboard Clean
 * Versão limpa sem partículas
 */
export function CleanDashboard() {
  return <DashboardBackground theme="professional" showParticles={false} />;
}

/**
 * VARIANTE: Dashboard com Grid
 * Versão com padrão de grid
 */
export function GridDashboard() {
  return <DashboardBackground theme="dark" showGrid={true} showParticles={false} />;
}
