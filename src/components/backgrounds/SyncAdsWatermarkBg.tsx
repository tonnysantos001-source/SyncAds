/**
 * SYNCADS WATERMARK BACKGROUND
 *
 * Background com gradiente customizado e marca d'água do SyncAds.
 * Perfeito para painéis onde os elementos são flutuantes e transparentes.
 *
 * Features:
 * - Gradiente entre rgb(70, 56, 71) e rgb(201, 205, 214)
 * - Marca d'água "SyncAds AI" + "Marketing Inteligente"
 * - Totalmente responsivo
 * - Opacidade ajustável
 * - Posicionamento inteligente
 *
 * USO:
 * <SyncAdsWatermarkBg />
 */

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SyncAdsWatermarkBgProps {
  /** Opacidade da marca d'água (0-1) */
  watermarkOpacity?: number;
  /** Mostrar marca d'água */
  showWatermark?: boolean;
  /** Variante do gradiente */
  variant?: "default" | "reversed" | "diagonal" | "radial";
  /** Classe CSS adicional */
  className?: string;
  /** Animar gradiente */
  animated?: boolean;
}

export function SyncAdsWatermarkBg({
  watermarkOpacity = 0.08,
  showWatermark = true,
  variant = "default",
  className,
  animated = false,
}: SyncAdsWatermarkBgProps) {
  // Definir gradientes por variante
  const gradients = {
    default:
      "linear-gradient(135deg, rgb(70, 56, 71) 0%, rgb(201, 205, 214) 100%)",
    reversed:
      "linear-gradient(135deg, rgb(201, 205, 214) 0%, rgb(70, 56, 71) 100%)",
    diagonal:
      "linear-gradient(45deg, rgb(70, 56, 71) 0%, rgb(201, 205, 214) 100%)",
    radial:
      "radial-gradient(circle at center, rgb(70, 56, 71) 0%, rgb(201, 205, 214) 100%)",
  };

  return (
    <div className={cn("fixed inset-0 -z-10 overflow-hidden", className)}>
      {/* Background Gradient */}
      {animated ? (
        <motion.div
          className="absolute inset-0"
          style={{ background: gradients[variant] }}
          animate={{
            backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{ background: gradients[variant] }}
        />
      )}

      {/* Subtle Texture Overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")`,
        }}
      />

      {/* Watermark */}
      {showWatermark && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <div
            className="text-center transform -rotate-12"
            style={{ opacity: watermarkOpacity }}
          >
            {/* SyncAds AI - Título principal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="flex flex-col items-center"
            >
              <div className="flex items-baseline gap-1">
                <h1
                  className="font-black tracking-tight leading-none"
                  style={{
                    fontSize: "clamp(2.5rem, 8vw, 6rem)",
                    color: "#3f3f46",
                    textShadow: "2px 2px 4px rgba(0,0,0,0.1)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  SyncAds
                </h1>
                <span
                  className="font-bold"
                  style={{
                    fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
                    color: "#52525b",
                  }}
                >
                  AI
                </span>
              </div>

              {/* Marketing Inteligente - Subtítulo */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
                className="font-semibold tracking-wide mt-2"
                style={{
                  fontSize: "clamp(0.75rem, 2vw, 1.5rem)",
                  color: "#52525b",
                  letterSpacing: "0.1em",
                }}
              >
                MARKETING INTELIGENTE
              </motion.p>
            </motion.div>
          </div>
        </div>
      )}

      {/* Vinheta sutil nas bordas */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/10" />
    </div>
  );
}

/**
 * VARIANTE: Watermark Central
 * Marca d'água mais visível e centralizada
 */
export function CentralWatermark() {
  return (
    <SyncAdsWatermarkBg
      watermarkOpacity={0.12}
      variant="default"
      animated={false}
    />
  );
}

/**
 * VARIANTE: Watermark Sutil
 * Marca d'água muito discreta
 */
export function SubtleWatermark() {
  return (
    <SyncAdsWatermarkBg
      watermarkOpacity={0.05}
      variant="radial"
      animated={false}
    />
  );
}

/**
 * VARIANTE: Watermark Animada
 * Com gradiente animado suave
 */
export function AnimatedWatermark() {
  return (
    <SyncAdsWatermarkBg
      watermarkOpacity={0.08}
      variant="default"
      animated={true}
    />
  );
}

/**
 * VARIANTE: Sem Marca d'água
 * Apenas o gradiente de fundo
 */
export function GradientOnly() {
  return (
    <SyncAdsWatermarkBg
      showWatermark={false}
      variant="default"
      animated={false}
    />
  );
}

/**
 * VARIANTE: Watermark para Mobile
 * Otimizada para telas pequenas
 */
export function MobileWatermark() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, rgb(70, 56, 71) 0%, rgb(201, 205, 214) 100%)",
        }}
      />

      {/* Watermark simplificada para mobile */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <div
          className="text-center transform -rotate-12 px-4"
          style={{ opacity: 0.06 }}
        >
          <div className="flex items-baseline gap-1 justify-center">
            <h1
              className="font-black tracking-tight leading-none"
              style={{
                fontSize: "clamp(2rem, 15vw, 4rem)",
                color: "#3f3f46",
              }}
            >
              SyncAds
            </h1>
            <span
              className="font-bold"
              style={{
                fontSize: "clamp(1rem, 6vw, 1.75rem)",
                color: "#52525b",
              }}
            >
              AI
            </span>
          </div>
          <p
            className="font-semibold tracking-wider mt-2"
            style={{
              fontSize: "clamp(0.625rem, 2.5vw, 1rem)",
              color: "#52525b",
            }}
          >
            MARKETING INTELIGENTE
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * VARIANTE: Watermark Repetida
 * Padrão repetido de marca d'água
 */
export function RepeatedWatermark() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, rgb(70, 56, 71) 0%, rgb(201, 205, 214) 100%)",
        }}
      />

      {/* Pattern de watermarks */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='800' height='600' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='50%25' y='50%25' font-family='Arial, sans-serif' font-size='60' font-weight='900' fill='%233f3f46' text-anchor='middle' dominant-baseline='middle' transform='rotate(-15 400 300)'%3ESyncAds AI%3C/text%3E%3Ctext x='50%25' y='60%25' font-family='Arial, sans-serif' font-size='20' font-weight='600' fill='%2352525b' text-anchor='middle' dominant-baseline='middle' transform='rotate(-15 400 360)'%3EMARKETING INTELIGENTE%3C/text%3E%3C/svg%3E")`,
          backgroundSize: "800px 600px",
          backgroundRepeat: "repeat",
        }}
      />
    </div>
  );
}
