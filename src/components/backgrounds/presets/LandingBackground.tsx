/**
 * LANDING & ADMIN BACKGROUNDS
 *
 * Backgrounds para Landing Page e Admin Panel.
 * Landing: Visual impactante com animações intensas
 * Admin: Profissional e limpo
 *
 * USO:
 * <LandingBackground />
 * <AdminBackground />
 */

import { AnimatedGradient } from "../AnimatedGradient";
import { IntenseParticles, ParticlesBackground } from "../ParticlesBackground";
import { motion } from "framer-motion";

// ============================================
// LANDING BACKGROUND
// ============================================

interface LandingBackgroundProps {
  /** Estilo visual */
  style?: "hero" | "modern" | "vibrant" | "cosmic" | "minimal";
  /** Mostrar partículas */
  showParticles?: boolean;
  /** Mostrar animações de luz */
  showLights?: boolean;
}

export function LandingBackground({
  style = "hero",
  showParticles = true,
  showLights = true,
}: LandingBackgroundProps) {
  const styleConfig = {
    hero: {
      gradient: "aurora" as const,
      particleTheme: "purple" as const,
      overlay: 0.3,
      particleDensity: 100,
    },
    modern: {
      gradient: "sunset" as const,
      particleTheme: "gradient" as const,
      overlay: 0.2,
      particleDensity: 80,
    },
    vibrant: {
      gradient: "synthwave" as const,
      particleTheme: "gradient" as const,
      overlay: 0.1,
      particleDensity: 120,
    },
    cosmic: {
      gradient: "midnight" as const,
      particleTheme: "blue" as const,
      overlay: 0.5,
      particleDensity: 150,
    },
    minimal: {
      gradient: "ocean" as const,
      particleTheme: "blue" as const,
      overlay: 0.4,
      particleDensity: 40,
    },
  };

  const config = styleConfig[style];

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base gradient animado */}
      <AnimatedGradient
        variant={config.gradient}
        speed={1.2}
        overlay={config.overlay}
        blur={80}
        showPattern={false}
      />

      {/* Partículas intensas */}
      {showParticles && (
        <ParticlesBackground
          theme={config.particleTheme}
          density={config.particleDensity}
          speed={0.8}
          interactive={true}
        />
      )}

      {/* Animated light orbs */}
      {showLights && (
        <>
          {/* Light orb 1 - Top Left */}
          <motion.div
            className="absolute top-0 left-0 w-96 h-96 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)",
              filter: "blur(60px)",
            }}
            animate={{
              x: [-50, 50, -50],
              y: [-50, 100, -50],
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Light orb 2 - Top Right */}
          <motion.div
            className="absolute top-0 right-0 w-96 h-96 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(236, 72, 153, 0.3) 0%, transparent 70%)",
              filter: "blur(60px)",
            }}
            animate={{
              x: [50, -50, 50],
              y: [-50, 80, -50],
              scale: [1.2, 1, 1.2],
              opacity: [0.4, 0.6, 0.4],
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2,
            }}
          />

          {/* Light orb 3 - Bottom */}
          <motion.div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-96 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, transparent 70%)",
              filter: "blur(80px)",
            }}
            animate={{
              y: [50, -50, 50],
              scale: [1, 1.3, 1],
              opacity: [0.25, 0.45, 0.25],
            }}
            transition={{
              duration: 22,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
          />
        </>
      )}

      {/* Scanlines effect (optional) */}
      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)",
        }}
      />

      {/* Vignette */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/40" />
    </div>
  );
}

/**
 * VARIANTE: Hero Landing
 * Para hero sections impactantes
 */
export function HeroLanding() {
  return (
    <LandingBackground
      style="hero"
      showParticles={true}
      showLights={true}
    />
  );
}

/**
 * VARIANTE: Modern Landing
 * Estilo moderno e clean
 */
export function ModernLanding() {
  return (
    <LandingBackground
      style="modern"
      showParticles={true}
      showLights={false}
    />
  );
}

/**
 * VARIANTE: Minimal Landing
 * Versão minimalista
 */
export function MinimalLanding() {
  return (
    <LandingBackground
      style="minimal"
      showParticles={false}
      showLights={false}
    />
  );
}

// ============================================
// ADMIN BACKGROUND
// ============================================

interface AdminBackgroundProps {
  /** Tema do admin */
  theme?: "dark" | "light" | "blue" | "purple";
  /** Mostrar grid */
  showGrid?: boolean;
  /** Mostrar padrão sutil */
  showPattern?: boolean;
}

export function AdminBackground({
  theme = "dark",
  showGrid = true,
  showPattern = true,
}: AdminBackgroundProps) {
  const themeConfig = {
    dark: {
      base: "#0F172A",
      secondary: "#1E293B",
      accent: "#334155",
      gradient: "from-slate-900 via-slate-800 to-slate-900",
    },
    light: {
      base: "#F8FAFC",
      secondary: "#F1F5F9",
      accent: "#E2E8F0",
      gradient: "from-slate-50 via-gray-50 to-slate-50",
    },
    blue: {
      base: "#0C4A6E",
      secondary: "#075985",
      accent: "#0369A1",
      gradient: "from-blue-950 via-blue-900 to-blue-950",
    },
    purple: {
      base: "#4C1D95",
      secondary: "#5B21B6",
      accent: "#6B21A8",
      gradient: "from-purple-950 via-purple-900 to-purple-950",
    },
  };

  const config = themeConfig[theme];

  return (
    <div className="fixed inset-0 -z-10">
      {/* Base gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient}`} />

      {/* Grid pattern */}
      {showGrid && (
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
          }}
        />
      )}

      {/* Subtle pattern */}
      {showPattern && (
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />
      )}

      {/* Subtle top light */}
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-white/5 to-transparent" />

      {/* Corner accents */}
      <div
        className="absolute top-0 left-0 w-96 h-96 rounded-full"
        style={{
          background: `radial-gradient(circle, ${config.accent}40 0%, transparent 70%)`,
          filter: "blur(60px)",
        }}
      />
      <div
        className="absolute bottom-0 right-0 w-96 h-96 rounded-full"
        style={{
          background: `radial-gradient(circle, ${config.accent}40 0%, transparent 70%)`,
          filter: "blur(60px)",
        }}
      />
    </div>
  );
}

/**
 * VARIANTE: Dark Admin
 * Tema escuro profissional
 */
export function DarkAdmin() {
  return <AdminBackground theme="dark" showGrid={true} showPattern={true} />;
}

/**
 * VARIANTE: Light Admin
 * Tema claro e limpo
 */
export function LightAdmin() {
  return <AdminBackground theme="light" showGrid={false} showPattern={true} />;
}

/**
 * VARIANTE: Purple Admin
 * Tema roxo SyncAds
 */
export function PurpleAdmin() {
  return <AdminBackground theme="purple" showGrid={true} showPattern={false} />;
}

/**
 * VARIANTE: Minimal Admin
 * Versão ultra minimalista
 */
export function MinimalAdmin() {
  return <AdminBackground theme="dark" showGrid={false} showPattern={false} />;
}

