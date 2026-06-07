/**
 * ScarcityTimer - Componente de Timer de Urgência Totalmente Customizável
 *
 * Cria senso de urgência e escassez no checkout através de:
 * - Countdown timer visual
 * - Mensagens de urgência customizáveis
 * - Animações de pulsação
 * - Cores e estilos personalizados
 *
 * Aumenta conversão através de gatilhos psicológicos de escassez.
 *
 * Suporta todas as personalizações do tema:
 * - expirationTime (tempo em minutos)
 * - showCountdownTimer (exibir contador visual)
 * - urgencyMessageColor (cor da mensagem)
 * - urgencyBackgroundColor (cor de fundo)
 * - useVisible (ativar/desativar)
 * - forceRemovalTime (tempo forçado de remoção)
 *
 * @version 1.0
 * @date 08/01/2025
 */

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, AlertCircle, Zap, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScarcityTimerProps {
  theme: any;
  className?: string;
  onExpire?: () => void;
  customMessage?: string;
  compact?: boolean;
  showIcon?: boolean;
  /** Se true, ignora localStorage e sempre cria timer fresco (modo preview) */
  isPreview?: boolean;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

export const ScarcityTimer: React.FC<ScarcityTimerProps> = ({
  theme,
  className = "",
  onExpire,
  customMessage,
  compact = false,
  showIcon = true,
  isPreview = false,
}) => {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0,
  });

  const [isExpired, setIsExpired] = useState(false);

  // ============================================
  // VERIFICAR SE ESTÁ HABILITADO
  // ============================================

  if (!theme.useVisible) return null;

  // ============================================
  // CONFIGURAÇÕES DO TIMER
  // ============================================

  const expirationMinutes = theme.expirationTime || 15; // Padrão: 15 minutos
  const showCountdown = theme.showCountdownTimer !== false;
  const urgencyColor = theme.urgencyMessageColor || "#ef4444";
  const urgencyBgColor = theme.urgencyBackgroundColor || "#fee2e2";
  const forceRemoval = theme.forceRemovalTime || 0;

  // ============================================
  // CALCULAR TEMPO DE EXPIRAÇÃO
  // ============================================

  const expirationTime = useMemo(() => {
    // Em preview: sempre cria timer fresco (ignora localStorage expirado)
    if (isPreview) {
      const freshExpiration = new Date();
      freshExpiration.setMinutes(freshExpiration.getMinutes() + expirationMinutes);
      return freshExpiration;
    }
    const storageKey = "checkout_expiration_time";
    const stored = localStorage.getItem(storageKey);

    if (stored) {
      const storedDate = new Date(stored);
      // Se já expirou, criar novo timer
      if (storedDate.getTime() <= Date.now()) {
        const newExpiration = new Date();
        newExpiration.setMinutes(newExpiration.getMinutes() + expirationMinutes);
        localStorage.setItem(storageKey, newExpiration.toISOString());
        return newExpiration;
      }
      return storedDate;
    } else {
      const newExpiration = new Date();
      newExpiration.setMinutes(newExpiration.getMinutes() + expirationMinutes);
      localStorage.setItem(storageKey, newExpiration.toISOString());
      return newExpiration;
    }
  }, [expirationMinutes, isPreview]);

  // ============================================
  // CALCULAR TEMPO RESTANTE
  // ============================================

  const calculateTimeRemaining = (): TimeRemaining => {
    const now = new Date().getTime();
    const expiration = expirationTime.getTime();
    const difference = expiration - now;

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds, total: difference };
  };

  // ============================================
  // ATUALIZAR TIMER A CADA SEGUNDO
  // ============================================

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);

      if (remaining.total <= 0 && !isExpired) {
        setIsExpired(true);
        if (onExpire) {
          onExpire();
        }
      }
    }, 1000);

    // Calcular imediatamente
    setTimeRemaining(calculateTimeRemaining());

    return () => clearInterval(timer);
  }, [expirationTime, isExpired, onExpire]);

  // ============================================
  // MENSAGENS DE URGÊNCIA DINÂMICAS
  // ============================================

  const getUrgencyMessage = (): string => {
    if (customMessage) return customMessage;

    const { total, minutes } = timeRemaining;

    if (total <= 0) {
      return "⚠️ Oferta expirada! Recarregue a página para nova tentativa.";
    }

    if (minutes <= 2) {
      return "🔥 ÚLTIMOS MINUTOS! Complete sua compra agora!";
    }

    if (minutes <= 5) {
      return "⏰ Restam poucos minutos! Garanta sua oferta!";
    }

    if (minutes <= 10) {
      return "⚡ Oferta por tempo limitado! Não perca!";
    }

    return "🎯 Oferta especial expira em breve!";
  };

  // ============================================
  // FORMATAR NÚMERO COM ZERO À ESQUERDA
  // ============================================

  const formatNumber = (num: number): string => {
    return num.toString().padStart(2, "0");
  };

  // ============================================
  // DETERMINAR URGÊNCIA VISUAL
  // ============================================

  const getUrgencyLevel = (): "high" | "medium" | "low" => {
    const { minutes, total } = timeRemaining;
    if (total <= 0) return "high";
    if (minutes <= 2) return "high";
    if (minutes <= 5) return "medium";
    return "low";
  };

  const urgencyLevel = getUrgencyLevel();

  // ============================================
  // ESTILOS DINÂMICOS
  // ============================================

  const containerStyles: React.CSSProperties = {
    backgroundColor: urgencyBgColor,
    borderLeft: `4px solid ${urgencyColor}`,
  };

  const textStyles: React.CSSProperties = {
    color: urgencyColor,
  };

  // ============================================
  // ANIMAÇÕES
  // ============================================

  const pulseAnimation = {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  };

  const urgentPulseAnimation = {
    scale: [1, 1.08, 1],
    opacity: [1, 0.9, 1],
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "easeInOut",
    },
  };

  // ============================================
  // RENDERIZAR TIMER COMPACTO
  // ============================================

  if (compact) {
    return (
      <motion.div
        className={cn("inline-flex items-center gap-2 px-3 py-1 rounded-lg", className)}
        style={containerStyles}
        animate={urgencyLevel === "high" ? urgentPulseAnimation : {}}
      >
        {showIcon && (
          <Clock className="w-4 h-4" style={{ color: urgencyColor }} />
        )}
        {showCountdown && (
          <span className="font-mono font-semibold text-sm" style={textStyles}>
            {formatNumber(timeRemaining.minutes)}:{formatNumber(timeRemaining.seconds)}
          </span>
        )}
      </motion.div>
    );
  }

  // ============================================
  // RENDERIZAR TIMER COMPLETO
  // ============================================

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={cn("w-full overflow-hidden", className)}
      >
        <motion.div
          className="p-4 rounded-lg shadow-md"
          style={containerStyles}
          animate={urgencyLevel === "high" ? urgentPulseAnimation : pulseAnimation}
        >
          {/* Mensagem de Urgência */}
          <div className="flex items-center gap-3 mb-3">
            {showIcon && (
              <div className="flex-shrink-0">
                {urgencyLevel === "high" ? (
                  <AlertCircle className="w-6 h-6" style={{ color: urgencyColor }} />
                ) : urgencyLevel === "medium" ? (
                  <Zap className="w-6 h-6" style={{ color: urgencyColor }} />
                ) : (
                  <TrendingUp className="w-6 h-6" style={{ color: urgencyColor }} />
                )}
              </div>
            )}
            <p
              className="font-semibold text-sm md:text-base flex-1"
              style={textStyles}
            >
              {getUrgencyMessage()}
            </p>
          </div>

          {/* Countdown Visual */}
          {showCountdown && !isExpired && (
            <div className="grid grid-cols-4 gap-2 md:gap-4">
              {/* Dias */}
              {timeRemaining.days > 0 && (
                <div className="flex flex-col items-center">
                  <motion.div
                    className="bg-white rounded-lg p-2 md:p-3 shadow-sm min-w-[50px] md:min-w-[60px]"
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <span
                      className="font-mono font-bold text-xl md:text-3xl block text-center"
                      style={{ color: urgencyColor }}
                    >
                      {formatNumber(timeRemaining.days)}
                    </span>
                  </motion.div>
                  <span className="text-xs md:text-sm font-medium mt-1" style={textStyles}>
                    Dias
                  </span>
                </div>
              )}

              {/* Horas */}
              <div className="flex flex-col items-center">
                <motion.div
                  className="bg-white rounded-lg p-2 md:p-3 shadow-sm min-w-[50px] md:min-w-[60px]"
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.1 }}
                >
                  <span
                    className="font-mono font-bold text-xl md:text-3xl block text-center"
                    style={{ color: urgencyColor }}
                  >
                    {formatNumber(timeRemaining.hours)}
                  </span>
                </motion.div>
                <span className="text-xs md:text-sm font-medium mt-1" style={textStyles}>
                  Horas
                </span>
              </div>

              {/* Minutos */}
              <div className="flex flex-col items-center">
                <motion.div
                  className="bg-white rounded-lg p-2 md:p-3 shadow-sm min-w-[50px] md:min-w-[60px]"
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                >
                  <span
                    className="font-mono font-bold text-xl md:text-3xl block text-center"
                    style={{ color: urgencyColor }}
                  >
                    {formatNumber(timeRemaining.minutes)}
                  </span>
                </motion.div>
                <span className="text-xs md:text-sm font-medium mt-1" style={textStyles}>
                  Min
                </span>
              </div>

              {/* Segundos */}
              <div className="flex flex-col items-center">
                <motion.div
                  className="bg-white rounded-lg p-2 md:p-3 shadow-sm min-w-[50px] md:min-w-[60px]"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                >
                  <span
                    className="font-mono font-bold text-xl md:text-3xl block text-center"
                    style={{ color: urgencyColor }}
                  >
                    {formatNumber(timeRemaining.seconds)}
                  </span>
                </motion.div>
                <span className="text-xs md:text-sm font-medium mt-1" style={textStyles}>
                  Seg
                </span>
              </div>
            </div>
          )}

          {/* Estado Expirado */}
          {isExpired && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-4"
            >
              <AlertCircle className="w-12 h-12 mx-auto mb-2" style={{ color: urgencyColor }} />
              <p className="font-bold text-lg" style={textStyles}>
                Oferta Expirada
              </p>
              <p className="text-sm mt-1" style={{ color: urgencyColor, opacity: 0.8 }}>
                Recarregue a página para tentar novamente
              </p>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ============================================
// EXPORT DEFAULT
// ============================================

export default ScarcityTimer;

