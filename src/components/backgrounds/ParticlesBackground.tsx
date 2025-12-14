/**
 * PARTICLES BACKGROUND
 *
 * Background animado com partículas interativas.
 * Usa tsParticles para criar efeitos visuais incríveis.
 *
 * Features:
 * - Partículas conectadas por linhas
 * - Interação com mouse (repelir/atrair)
 * - Responsivo e otimizado
 * - Tema personalizável
 *
 * USO:
 * <ParticlesBackground theme="purple" />
 */

import { useCallback, useMemo } from "react";
import Particles from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { Engine, ISourceOptions } from "@tsparticles/engine";

interface ParticlesBackgroundProps {
  /** Tema de cores */
  theme?: "purple" | "blue" | "pink" | "dark" | "gradient";
  /** Densidade de partículas (0-100) */
  density?: number;
  /** Velocidade das partículas */
  speed?: number;
  /** Interação com mouse */
  interactive?: boolean;
  /** ID único para múltiplas instâncias */
  id?: string;
}

export function ParticlesBackground({
  theme = "purple",
  density = 80,
  speed = 0.5,
  interactive = true,
  id = "tsparticles",
}: ParticlesBackgroundProps) {
  // Inicializar particles engine
  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine);
  }, []);

  // Cores baseadas no tema
  const colors = useMemo(() => {
    switch (theme) {
      case "purple":
        return {
          particles: ["#8B5CF6", "#A855F7", "#C4B5FD"],
          links: "#8B5CF6",
        };
      case "blue":
        return {
          particles: ["#3B82F6", "#60A5FA", "#93C5FD"],
          links: "#3B82F6",
        };
      case "pink":
        return {
          particles: ["#EC4899", "#F472B6", "#FBCFE8"],
          links: "#EC4899",
        };
      case "dark":
        return {
          particles: ["#6B7280", "#9CA3AF", "#D1D5DB"],
          links: "#6B7280",
        };
      case "gradient":
        return {
          particles: ["#8B5CF6", "#EC4899", "#3B82F6"],
          links: "#8B5CF6",
        };
      default:
        return {
          particles: ["#8B5CF6", "#A855F7", "#C4B5FD"],
          links: "#8B5CF6",
        };
    }
  }, [theme]);

  // Configuração das partículas
  const options: ISourceOptions = useMemo(
    () => ({
      background: {
        color: {
          value: "transparent",
        },
      },
      fpsLimit: 120,
      interactivity: {
        events: {
          onClick: {
            enable: interactive,
            mode: "push",
          },
          onHover: {
            enable: interactive,
            mode: "repulse",
          },
          resize: {
            enable: true,
          },
        },
        modes: {
          push: {
            quantity: 4,
          },
          repulse: {
            distance: 100,
            duration: 0.4,
          },
        },
      },
      particles: {
        color: {
          value: colors.particles,
        },
        links: {
          color: colors.links,
          distance: 150,
          enable: true,
          opacity: 0.3,
          width: 1,
        },
        move: {
          direction: "none",
          enable: true,
          outModes: {
            default: "bounce",
          },
          random: false,
          speed: speed,
          straight: false,
        },
        number: {
          density: {
            enable: true,
            width: 1920,
            height: 1080,
          },
          value: density,
        },
        opacity: {
          value: { min: 0.1, max: 0.5 },
          animation: {
            enable: true,
            speed: 1,
            minimumValue: 0.1,
            sync: false,
          },
        },
        shape: {
          type: "circle",
        },
        size: {
          value: { min: 1, max: 3 },
        },
      },
      detectRetina: true,
    }),
    [colors, density, speed, interactive]
  );

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <Particles
        id={id}
        init={particlesInit}
        options={options}
        className="absolute inset-0"
      />
    </div>
  );
}

/**
 * VARIANTE: Partículas Minimalistas
 */
export function MinimalParticles({
  theme = "purple",
}: Pick<ParticlesBackgroundProps, "theme">) {
  return (
    <ParticlesBackground
      theme={theme}
      density={30}
      speed={0.3}
      interactive={false}
    />
  );
}

/**
 * VARIANTE: Partículas Intensas
 */
export function IntenseParticles({
  theme = "gradient",
}: Pick<ParticlesBackgroundProps, "theme">) {
  return (
    <ParticlesBackground
      theme={theme}
      density={120}
      speed={1}
      interactive={true}
    />
  );
}

/**
 * VARIANTE: Partículas Sutis (para fundos de cards)
 */
export function SubtleParticles() {
  return (
    <ParticlesBackground
      theme="dark"
      density={20}
      speed={0.2}
      interactive={false}
    />
  );
}

