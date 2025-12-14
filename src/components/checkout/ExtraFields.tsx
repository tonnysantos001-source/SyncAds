/**
 * ExtraFields - Campos Extras Totalmente Customizáveis
 *
 * Campos opcionais para coletar informações adicionais do cliente:
 * - Data de nascimento (com máscara e validação)
 * - Gênero (select customizável)
 *
 * Suporta todas as personalizações do tema:
 * - requestBirthDate (solicitar data de nascimento)
 * - requestGender (solicitar gênero)
 * - inputBorderColor (cor da borda)
 * - inputFocusBorderColor (cor da borda em foco)
 * - inputBackgroundColor (cor de fundo)
 * - inputHeight (altura do campo)
 * - inputBorderRadius (raio da borda)
 * - labelColor (cor do label)
 * - placeholderColor (cor do placeholder)
 *
 * @version 1.0
 * @date 08/01/2025
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, User, AlertCircle, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExtraFieldsProps {
  theme: any;
  birthDate?: string;
  gender?: string;
  onBirthDateChange?: (value: string) => void;
  onGenderChange?: (value: string) => void;
  className?: string;
  errors?: {
    birthDate?: string;
    gender?: string;
  };
}

interface ValidationState {
  birthDate: {
    isValid: boolean;
    message: string;
  };
  gender: {
    isValid: boolean;
    message: string;
  };
}

export const ExtraFields: React.FC<ExtraFieldsProps> = ({
  theme,
  birthDate = "",
  gender = "",
  onBirthDateChange,
  onGenderChange,
  className = "",
  errors = {},
}) => {
  const [focused, setFocused] = useState<string | null>(null);
  const [validation, setValidation] = useState<ValidationState>({
    birthDate: { isValid: true, message: "" },
    gender: { isValid: true, message: "" },
  });

  // ============================================
  // VERIFICAR SE ALGUM CAMPO ESTÁ HABILITADO
  // ============================================

  const showBirthDate = theme.requestBirthDate || false;
  const showGender = theme.requestGender || false;

  if (!showBirthDate && !showGender) return null;

  // ============================================
  // CONFIGURAÇÕES DO TEMA
  // ============================================

  const inputBorderColor = theme.inputBorderColor || "#d1d5db";
  const inputFocusBorderColor = theme.inputFocusBorderColor || "#8b5cf6";
  const inputBackgroundColor = theme.inputBackgroundColor || "#ffffff";
  const inputHeight = theme.inputHeight || 48;
  const inputBorderRadius = theme.inputBorderRadius || 8;
  const labelColor = theme.labelColor || "#374151";
  const labelFontWeight = theme.labelFontWeight || "600";
  const placeholderColor = theme.placeholderColor || "#9ca3af";
  const textColor = theme.textColor || "#1f2937";

  // ============================================
  // OPÇÕES DE GÊNERO
  // ============================================

  const genderOptions = [
    { value: "", label: "Selecione seu gênero" },
    { value: "masculino", label: "Masculino" },
    { value: "feminino", label: "Feminino" },
    { value: "outro", label: "Outro" },
    { value: "prefiro-nao-informar", label: "Prefiro não informar" },
  ];

  // ============================================
  // MÁSCARA DE DATA (DD/MM/AAAA)
  // ============================================

  const applyDateMask = (value: string): string => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, "");

    // Aplica a máscara DD/MM/AAAA
    let masked = numbers;

    if (numbers.length >= 3) {
      masked = `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    }
    if (numbers.length >= 5) {
      masked = `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
    }

    return masked;
  };

  // ============================================
  // VALIDAR DATA DE NASCIMENTO
  // ============================================

  const validateBirthDate = (date: string): { isValid: boolean; message: string } => {
    if (!date || date.length < 10) {
      return { isValid: false, message: "Data de nascimento incompleta" };
    }

    const [day, month, year] = date.split("/").map(Number);

    // Verificar formato básico
    if (!day || !month || !year) {
      return { isValid: false, message: "Data inválida" };
    }

    // Verificar ranges
    if (day < 1 || day > 31) {
      return { isValid: false, message: "Dia inválido" };
    }
    if (month < 1 || month > 12) {
      return { isValid: false, message: "Mês inválido" };
    }

    const currentYear = new Date().getFullYear();
    if (year < 1900 || year > currentYear) {
      return { isValid: false, message: "Ano inválido" };
    }

    // Verificar idade mínima (18 anos)
    const birthDateObj = new Date(year, month - 1, day);
    const today = new Date();
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const monthDiff = today.getMonth() - birthDateObj.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
      age--;
    }

    if (age < 18) {
      return { isValid: false, message: "Você precisa ter pelo menos 18 anos" };
    }

    if (age > 120) {
      return { isValid: false, message: "Data de nascimento inválida" };
    }

    return { isValid: true, message: "Data válida" };
  };

  // ============================================
  // HANDLERS
  // ============================================

  const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = applyDateMask(e.target.value);
    if (onBirthDateChange) {
      onBirthDateChange(masked);
    }

    // Validar se estiver completo
    if (masked.length === 10) {
      const validationResult = validateBirthDate(masked);
      setValidation((prev) => ({
        ...prev,
        birthDate: validationResult,
      }));
    } else {
      setValidation((prev) => ({
        ...prev,
        birthDate: { isValid: true, message: "" },
      }));
    }
  };

  const handleGenderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (onGenderChange) {
      onGenderChange(value);
    }

    // Validar
    setValidation((prev) => ({
      ...prev,
      gender: {
        isValid: value !== "",
        message: value === "" ? "Selecione uma opção" : "",
      },
    }));
  };

  // ============================================
  // ESTILOS DINÂMICOS
  // ============================================

  const getInputStyles = (fieldName: string, hasError: boolean) => {
    const isFocused = focused === fieldName;
    const hasValue = fieldName === "birthDate" ? birthDate : gender;

    return {
      backgroundColor: inputBackgroundColor,
      borderColor: hasError
        ? "#ef4444"
        : isFocused
        ? inputFocusBorderColor
        : inputBorderColor,
      borderRadius: `${inputBorderRadius}px`,
      height: `${inputHeight}px`,
      color: textColor,
      borderWidth: "2px",
      borderStyle: "solid",
    };
  };

  const labelStyles: React.CSSProperties = {
    color: labelColor,
    fontWeight: labelFontWeight,
  };

  // ============================================
  // ANIMAÇÕES
  // ============================================

  const fieldAnimation = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3 },
  };

  // ============================================
  // RENDERIZAR DATA DE NASCIMENTO
  // ============================================

  const renderBirthDateField = () => {
    if (!showBirthDate) return null;

    const hasError = !validation.birthDate.isValid || !!errors.birthDate;
    const errorMessage = errors.birthDate || validation.birthDate.message;
    const isValid = validation.birthDate.isValid && birthDate.length === 10;

    return (
      <motion.div {...fieldAnimation} className="space-y-2">
        <label htmlFor="birthDate" className="block text-sm font-semibold" style={labelStyles}>
          Data de Nascimento
          <span className="text-red-500 ml-1">*</span>
        </label>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Calendar
              className="w-5 h-5"
              style={{ color: focused === "birthDate" ? inputFocusBorderColor : placeholderColor }}
            />
          </div>

          <input
            type="text"
            id="birthDate"
            value={birthDate}
            onChange={handleBirthDateChange}
            onFocus={() => setFocused("birthDate")}
            onBlur={() => setFocused(null)}
            placeholder="DD/MM/AAAA"
            maxLength={10}
            className={cn(
              "w-full pl-10 pr-10 font-medium transition-all duration-200",
              "focus:outline-none focus:ring-0",
              hasError && "border-red-500"
            )}
            style={getInputStyles("birthDate", hasError)}
            autoComplete="bday"
          />

          {/* Ícone de validação */}
          <AnimatePresence>
            {birthDate.length === 10 && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {isValid ? (
                  <Check className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mensagem de erro ou dica */}
        <AnimatePresence>
          {hasError && errorMessage && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="text-sm text-red-600 flex items-center gap-1"
            >
              <AlertCircle className="w-4 h-4" />
              {errorMessage}
            </motion.p>
          )}
          {!hasError && !birthDate && focused === "birthDate" && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs"
              style={{ color: placeholderColor }}
            >
              Digite sua data de nascimento no formato DD/MM/AAAA
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  // ============================================
  // RENDERIZAR GÊNERO
  // ============================================

  const renderGenderField = () => {
    if (!showGender) return null;

    const hasError = !validation.gender.isValid || !!errors.gender;
    const errorMessage = errors.gender || validation.gender.message;

    return (
      <motion.div {...fieldAnimation} transition={{ delay: 0.1 }} className="space-y-2">
        <label htmlFor="gender" className="block text-sm font-semibold" style={labelStyles}>
          Gênero
          <span className="text-red-500 ml-1">*</span>
        </label>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <User
              className="w-5 h-5"
              style={{ color: focused === "gender" ? inputFocusBorderColor : placeholderColor }}
            />
          </div>

          <select
            id="gender"
            value={gender}
            onChange={handleGenderChange}
            onFocus={() => setFocused("gender")}
            onBlur={() => setFocused(null)}
            className={cn(
              "w-full pl-10 pr-4 font-medium transition-all duration-200",
              "focus:outline-none focus:ring-0 appearance-none cursor-pointer",
              hasError && "border-red-500"
            )}
            style={getInputStyles("gender", hasError)}
            autoComplete="sex"
          >
            {genderOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Seta customizada */}
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg
              className="w-5 h-5"
              style={{ color: focused === "gender" ? inputFocusBorderColor : placeholderColor }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Mensagem de erro */}
        <AnimatePresence>
          {hasError && errorMessage && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="text-sm text-red-600 flex items-center gap-1"
            >
              <AlertCircle className="w-4 h-4" />
              {errorMessage}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  // ============================================
  // RENDERIZAR COMPONENTE
  // ============================================

  return (
    <div className={cn("space-y-4", className)}>
      {renderBirthDateField()}
      {renderGenderField()}
    </div>
  );
};

// ============================================
// EXPORT DEFAULT
// ============================================

export default ExtraFields;

