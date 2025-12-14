/**
 * ProgressBar - Barra de Progresso Totalmente Customizável
 *
 * Exibe progresso visual do checkout através de:
 * - Barra de progresso animada
 * - Steps com ícones e labels
 * - Estados: ativo, completo, inativo
 * - Estilos customizáveis (rounded, square, pill)
 * - Cores personalizadas
 * - Animações suaves
 *
 * Melhora UX mostrando claramente onde o usuário está no processo.
 *
 * Suporta todas as personalizações do tema:
 * - showProgressBar (ativar/desativar)
 * - progressBarColor (cor da barra)
 * - stepActiveColor (cor do step atual)
 * - stepInactiveColor (cor dos steps não iniciados)
 * - stepCompletedColor (cor dos steps completos)
 * - nextStepStyle (rounded | square | pill)
 * - navigationSteps (1 ou 3 steps)
 *
 * @version 1.0
 * @date 08/01/2025
 */

import React from "react";
import { motion } from "framer-motion";
import { Check, User, MapPin, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  number: number;
  label: string;
  icon: React.ComponentType<any>;
  completed: boolean;
  active: boolean;
}

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  theme: any;
  className?: string;
  labels?: string[];
  showLabels?: boolean;
  vertical?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentStep,
  totalSteps = 3,
  theme,
  className = "",
  labels,
  showLabels = true,
  vertical = false,
}) => {
  // ============================================
  // VERIFICAR SE ESTÁ HABILITADO
  // ============================================

  if (!theme.showProgressBar) return null;

  // ============================================
  // CONFIGURAÇÕES DO TEMA
  // ============================================

  const progressBarColor = theme.progressBarColor || "#8b5cf6";
  const stepActiveColor = theme.stepActiveColor || "#8b5cf6";
  const stepInactiveColor = theme.stepInactiveColor || "#d1d5db";
  const stepCompletedColor = theme.stepCompletedColor || "#10b981";
  const stepStyle = theme.nextStepStyle || "rounded";
  const navigationSteps = theme.navigationSteps || 3;

  // ============================================
  // DEFINIR STEPS
  // ============================================

  const defaultLabels = ["Dados", "Entrega", "Pagamento"];
  const stepLabels = labels || defaultLabels;

  const steps: Step[] = [];

  // Para 1 step (checkout simples)
  if (navigationSteps === 1) {
    steps.push({
      number: 1,
      label: "Checkout",
      icon: CreditCard,
      completed: currentStep > 1,
      active: currentStep === 1,
    });
  } else {
    // Para 3 steps (checkout completo)
    const icons = [User, MapPin, CreditCard];
    for (let i = 1; i <= totalSteps; i++) {
      steps.push({
        number: i,
        label: stepLabels[i - 1] || `Step ${i}`,
        icon: icons[i - 1] || User,
        completed: currentStep > i,
        active: currentStep === i,
      });
    }
  }

  // ============================================
  // CALCULAR PROGRESSO
  // ============================================

  const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;

  // ============================================
  // ESTILOS DO STEP BASEADO EM nextStepStyle
  // ============================================

  const getStepShapeClass = () => {
    switch (stepStyle) {
      case "square":
        return "rounded-none";
      case "pill":
        return "rounded-full";
      case "rounded":
      default:
        return "rounded-lg";
    }
  };

  // ============================================
  // COR DO STEP
  // ============================================

  const getStepColor = (step: Step) => {
    if (step.completed) return stepCompletedColor;
    if (step.active) return stepActiveColor;
    return stepInactiveColor;
  };

  // ============================================
  // RENDERIZAR VERTICAL
  // ============================================

  if (vertical) {
    return (
      <div className={cn("flex flex-col gap-4", className)}>
        {steps.map((step, index) => {
          const Icon = step.icon;
          const stepColor = getStepColor(step);
          const isLast = index === steps.length - 1;

          return (
            <div key={step.number} className="flex items-start gap-3">
              {/* Step Circle */}
              <motion.div
                className={cn(
                  "flex-shrink-0 w-10 h-10 flex items-center justify-center",
                  getStepShapeClass(),
                  "font-semibold transition-all duration-300"
                )}
                style={{
                  backgroundColor: stepColor,
                  color: "#ffffff",
                }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                {step.completed ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </motion.div>

              {/* Label e Linha */}
              <div className="flex-1">
                {showLabels && (
                  <motion.p
                    className="font-medium text-sm mb-1"
                    style={{
                      color: step.active || step.completed ? stepColor : "#6b7280",
                    }}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 + 0.05 }}
                  >
                    {step.label}
                  </motion.p>
                )}

                {/* Linha conectora */}
                {!isLast && (
                  <div className="relative h-12 ml-5">
                    <div
                      className="absolute w-0.5 h-full"
                      style={{ backgroundColor: stepInactiveColor }}
                    />
                    {(step.completed || step.active) && (
                      <motion.div
                        className="absolute w-0.5 h-full"
                        style={{ backgroundColor: progressBarColor }}
                        initial={{ height: 0 }}
                        animate={{ height: "100%" }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ============================================
  // RENDERIZAR HORIZONTAL (PADRÃO)
  // ============================================

  return (
    <div className={cn("w-full", className)}>
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Steps com Labels */}
        <div className="relative">
          {/* Linha de fundo */}
          <div
            className="absolute top-5 left-0 w-full h-1 rounded-full"
            style={{ backgroundColor: stepInactiveColor }}
          />

          {/* Linha de progresso */}
          <motion.div
            className="absolute top-5 left-0 h-1 rounded-full"
            style={{ backgroundColor: progressBarColor }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />

          {/* Steps */}
          <div className="relative flex justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const stepColor = getStepColor(step);

              return (
                <motion.div
                  key={step.number}
                  className="flex flex-col items-center"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {/* Step Circle */}
                  <motion.div
                    className={cn(
                      "w-10 h-10 flex items-center justify-center",
                      getStepShapeClass(),
                      "font-semibold shadow-md transition-all duration-300"
                    )}
                    style={{
                      backgroundColor: stepColor,
                      color: "#ffffff",
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {step.completed ? (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 200 }}
                      >
                        <Check className="w-5 h-5" />
                      </motion.div>
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </motion.div>

                  {/* Label */}
                  {showLabels && (
                    <motion.p
                      className="mt-2 text-xs md:text-sm font-medium text-center"
                      style={{
                        color: step.active || step.completed ? stepColor : "#6b7280",
                      }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.1 + 0.2 }}
                    >
                      {step.label}
                    </motion.p>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Barra de progresso simplificada (mobile) */}
        {totalSteps > 3 && (
          <div className="mt-6 md:hidden">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium" style={{ color: stepActiveColor }}>
                Passo {currentStep} de {totalSteps}
              </span>
              <span className="text-sm font-semibold" style={{ color: stepActiveColor }}>
                {Math.round(progress)}%
              </span>
            </div>
            <div
              className="w-full h-2 rounded-full overflow-hidden"
              style={{ backgroundColor: stepInactiveColor }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: progressBarColor }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// EXPORT DEFAULT
// ============================================

export default ProgressBar;

