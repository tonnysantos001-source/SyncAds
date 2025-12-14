/**
 * Stepper Component - SyncAds Checkout
 * Componente de progresso visual para o checkout com animações Framer Motion
 */

import React from "react";
import { motion } from "framer-motion";
import { User, MapPin, CreditCard, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { CheckoutTheme } from "@/config/defaultCheckoutTheme";

interface StepperProps {
  currentStep: number;
  theme: CheckoutTheme;
}

interface Step {
  number: number;
  label: string;
  icon: React.ElementType;
}

const steps: Step[] = [
  { number: 1, label: "Dados", icon: User },
  { number: 2, label: "Endereço", icon: MapPin },
  { number: 3, label: "Pagamento", icon: CreditCard },
];

export const Stepper: React.FC<StepperProps> = ({ currentStep, theme }) => {
  return (
    <div className="w-full px-4 py-6 md:py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={step.number}>
              <StepItem step={step} currentStep={currentStep} theme={theme} />
              {index < steps.length - 1 && (
                <Connector isCompleted={currentStep > step.number} theme={theme} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

interface StepItemProps {
  step: Step;
  currentStep: number;
  theme: CheckoutTheme;
}

const StepItem: React.FC<StepItemProps> = ({ step, currentStep, theme }) => {
  const isActive = currentStep === step.number;
  const isCompleted = currentStep > step.number;
  const Icon = step.icon;

  return (
    <motion.div
      className="flex flex-col items-center"
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all duration-300 shadow-lg",
          isActive && "ring-4 ring-opacity-30"
        )}
        style={{
          backgroundColor: isCompleted
            ? theme.stepCompletedColor || "#10b981"
            : isActive
            ? theme.stepActiveColor || "#3b82f6"
            : theme.stepInactiveColor || "#d1d5db",
          color: isActive || isCompleted ? "#ffffff" : "#6b7280",
        }}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {isCompleted ? <Check className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
      </motion.div>
      <motion.span
        className={cn("text-sm font-medium mt-2", (isActive || isCompleted) && "font-semibold")}
        style={{
          color: isActive || isCompleted ? theme.headingColor : theme.textColor,
          opacity: currentStep < step.number ? 0.5 : 1,
        }}
      >
        {step.label}
      </motion.span>
    </motion.div>
  );
};

interface ConnectorProps {
  isCompleted: boolean;
  theme: CheckoutTheme;
}

const Connector: React.FC<ConnectorProps> = ({ isCompleted, theme }) => {
  return (
    <div
      className="h-1 flex-1 mx-3 rounded-full"
      style={{
        backgroundColor: isCompleted
          ? theme.stepCompletedColor || "#10b981"
          : theme.stepInactiveColor || "#e5e7eb",
      }}
    />
  );
};

export default Stepper;

