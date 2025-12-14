import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Cards from "react-credit-cards-2";
import "react-credit-cards-2/dist/es/styles-compiled.css";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CreditCard,
  Lock,
  AlertCircle,
  CheckCircle2,
  Info,
  Shield,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import InputMask from "react-input-mask";

interface CreditCardFormProps {
  onCardDataChange: (cardData: CardData) => void;
  theme?: {
    primaryButtonBackgroundColor?: string;
    inputBackgroundColor?: string;
    inputBorderColor?: string;
    inputBorderRadius?: string;
    textColor?: string;
    labelColor?: string;
    checkoutButtonBackgroundColor?: string;
  };
  errors?: Record<string, string>;
}

export interface CardData {
  number: string;
  holderName: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  brand?: string;
}

interface ValidationState {
  number: boolean | null;
  holderName: boolean | null;
  expiry: boolean | null;
  cvv: boolean | null;
}

const cardBrands = [
  {
    name: "Visa",
    pattern: /^4/,
    color: "from-blue-600 to-blue-800",
  },
  {
    name: "Mastercard",
    pattern: /^5[1-5]/,
    color: "from-red-600 to-orange-600",
  },
  {
    name: "Amex",
    pattern: /^3[47]/,
    color: "from-blue-500 to-blue-700",
  },
  {
    name: "Elo",
    pattern:
      /^(4011|4312|4389|4514|4576|5041|5066|5067|6277|6362|6363|6504|6505|6516)/,
    color: "from-yellow-500 to-yellow-700",
  },
  {
    name: "Hipercard",
    pattern: /^(38|60)/,
    color: "from-red-500 to-red-700",
  },
];

export const CreditCardForm: React.FC<CreditCardFormProps> = ({
  onCardDataChange,
  theme = {},
  errors = {},
}) => {
  const [cardData, setCardData] = useState<CardData>({
    number: "",
    holderName: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
  });

  const [focused, setFocused] = useState<string>("");
  const [cardBrand, setCardBrand] = useState<string>("");
  const [validation, setValidation] = useState<ValidationState>({
    number: null,
    holderName: null,
    expiry: null,
    cvv: null,
  });

  // Detectar bandeira do cartão
  useEffect(() => {
    const cleanNumber = cardData.number.replace(/\s/g, "");
    const brand = cardBrands.find((b) => b.pattern.test(cleanNumber));
    setCardBrand(brand?.name || "");

    // Validar número do cartão (Algoritmo de Luhn simplificado)
    if (cleanNumber.length >= 13) {
      const isValid = validateCardNumber(cleanNumber);
      setValidation((prev) => ({ ...prev, number: isValid }));
    } else if (cleanNumber.length > 0) {
      setValidation((prev) => ({ ...prev, number: null }));
    }

    onCardDataChange({
      ...cardData,
      brand: brand?.name,
    });
  }, [cardData]);

  // Validar número do cartão (Luhn Algorithm)
  const validateCardNumber = (number: string): boolean => {
    if (!/^\d+$/.test(number)) return false;
    if (number.length < 13 || number.length > 19) return false;

    let sum = 0;
    let isEven = false;

    for (let i = number.length - 1; i >= 0; i--) {
      let digit = parseInt(number.charAt(i), 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  };

  // Validar nome
  const validateName = (name: string): boolean => {
    return name.trim().length >= 3 && /^[a-zA-ZÀ-ÿ\s]+$/.test(name);
  };

  // Validar data de validade
  const validateExpiry = (month: string, year: string): boolean => {
    if (!month || !year) return false;
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);

    if (monthNum < 1 || monthNum > 12) return false;

    const now = new Date();
    const currentYear = now.getFullYear() % 100;
    const currentMonth = now.getMonth() + 1;

    if (yearNum < currentYear) return false;
    if (yearNum === currentYear && monthNum < currentMonth) return false;

    return true;
  };

  // Validar CVV
  const validateCVV = (cvv: string, brand: string): boolean => {
    const length = brand === "Amex" ? 4 : 3;
    return cvv.length === length && /^\d+$/.test(cvv);
  };

  const handleChange = (field: keyof CardData, value: string) => {
    let processedValue = value;

    // Processamento específico por campo
    if (field === "number") {
      processedValue = value.replace(/\s/g, "").replace(/\D/g, "").slice(0, 16);
    } else if (field === "holderName") {
      processedValue = value.toUpperCase();
      if (processedValue.trim().length >= 3) {
        setValidation((prev) => ({
          ...prev,
          holderName: validateName(processedValue),
        }));
      }
    } else if (field === "cvv") {
      const maxLength = cardBrand === "Amex" ? 4 : 3;
      processedValue = value.replace(/\D/g, "").slice(0, maxLength);
      if (processedValue.length === maxLength) {
        setValidation((prev) => ({
          ...prev,
          cvv: validateCVV(processedValue, cardBrand),
        }));
      }
    }

    const newData = { ...cardData, [field]: processedValue };
    setCardData(newData);
    onCardDataChange(newData);
  };

  const handleExpiryChange = (value: string) => {
    // Remove non-digits
    const cleaned = value.replace(/\D/g, "");

    if (cleaned.length >= 2) {
      const month = cleaned.slice(0, 2);
      const year = cleaned.slice(2, 4);

      setCardData((prev) => ({
        ...prev,
        expiryMonth: month,
        expiryYear: year,
      }));

      if (cleaned.length === 4) {
        setValidation((prev) => ({
          ...prev,
          expiry: validateExpiry(month, year),
        }));
      }
    } else {
      setCardData((prev) => ({
        ...prev,
        expiryMonth: cleaned,
        expiryYear: "",
      }));
    }
  };

  const getValidationIcon = (field: keyof ValidationState) => {
    if (validation[field] === true) {
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    } else if (validation[field] === false) {
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 max-w-2xl mx-auto px-2 md:px-4"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-center space-y-2"
      >
        <motion.div
          whileHover={{ scale: 1.05, rotate: 5 }}
          className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500 shadow-2xl mb-3 relative"
        >
          <CreditCard className="h-8 w-8 md:h-10 md:w-10 text-white relative z-10" />
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-0 bg-purple-400 rounded-2xl blur-xl"
          />
        </motion.div>
        <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent">
          Dados do Cartão
        </h2>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
          Preencha os dados com segurança
        </p>
      </motion.div>

      {/* Card Preview */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="relative"
      >
        <div className="absolute -inset-4 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 rounded-3xl blur-2xl opacity-20 animate-pulse" />
        <div className="relative">
          <Cards
            number={cardData.number}
            name={cardData.holderName}
            expiry={`${cardData.expiryMonth}${cardData.expiryYear}`}
            cvc={cardData.cvv}
            focused={focused as any}
            locale={{ valid: "Validade" }}
            placeholders={{ name: "SEU NOME AQUI" }}
          />
        </div>
      </motion.div>

      {/* Form Fields */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-5"
      >
        {/* Número do Cartão */}
        <div className="space-y-2">
          <Label className="text-sm md:text-base font-semibold flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Número do Cartão
          </Label>
          <div className="relative">
            <InputMask
              mask="9999 9999 9999 9999"
              value={cardData.number.replace(/(\d{4})/g, "$1 ").trim()}
              onChange={(e) => handleChange("number", e.target.value)}
              onFocus={() => setFocused("number")}
              onBlur={() => setFocused("")}
              maskChar=""
            >
              {(inputProps: any) => (
                <Input
                  {...inputProps}
                  type="text"
                  placeholder="0000 0000 0000 0000"
                  className={cn(
                    "h-14 text-lg font-mono pr-12 transition-all duration-300",
                    validation.number === true &&
                      "border-green-500 bg-green-50 dark:bg-green-950/20",
                    validation.number === false &&
                      "border-red-500 bg-red-50 dark:bg-red-950/20",
                    "focus:ring-2 focus:ring-purple-500",
                  )}
                />
              )}
            </InputMask>
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <AnimatePresence mode="wait">
                {validation.number !== null && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                  >
                    {getValidationIcon("number")}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          {cardBrand && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
            >
              <Sparkles className="h-4 w-4 text-purple-500" />
              <span>
                Bandeira detectada: <strong>{cardBrand}</strong>
              </span>
            </motion.div>
          )}
          {errors.number && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1"
            >
              <AlertCircle className="h-4 w-4" />
              {errors.number}
            </motion.p>
          )}
        </div>

        {/* Nome do Titular */}
        <div className="space-y-2">
          <Label className="text-sm md:text-base font-semibold">
            Nome do Titular
          </Label>
          <div className="relative">
            <Input
              type="text"
              placeholder="NOME COMO ESTÁ NO CARTÃO"
              value={cardData.holderName}
              onChange={(e) => handleChange("holderName", e.target.value)}
              onFocus={() => setFocused("name")}
              onBlur={() => setFocused("")}
              className={cn(
                "h-14 text-lg uppercase pr-12 transition-all duration-300",
                validation.holderName === true &&
                  "border-green-500 bg-green-50 dark:bg-green-950/20",
                validation.holderName === false &&
                  "border-red-500 bg-red-50 dark:bg-red-950/20",
                "focus:ring-2 focus:ring-purple-500",
              )}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <AnimatePresence mode="wait">
                {validation.holderName !== null && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                  >
                    {getValidationIcon("holderName")}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          {errors.holderName && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1"
            >
              <AlertCircle className="h-4 w-4" />
              {errors.holderName}
            </motion.p>
          )}
        </div>

        {/* Validade e CVV */}
        <div className="grid grid-cols-2 gap-4">
          {/* Validade */}
          <div className="space-y-2">
            <Label className="text-sm md:text-base font-semibold">
              Validade
            </Label>
            <div className="relative">
              <InputMask
                mask="99/99"
                value={`${cardData.expiryMonth}${cardData.expiryYear ? "/" + cardData.expiryYear : ""}`}
                onChange={(e) => handleExpiryChange(e.target.value)}
                onFocus={() => setFocused("expiry")}
                onBlur={() => setFocused("")}
                maskChar=""
              >
                {(inputProps: any) => (
                  <Input
                    {...inputProps}
                    type="text"
                    placeholder="MM/AA"
                    className={cn(
                      "h-14 text-lg font-mono pr-12 transition-all duration-300",
                      validation.expiry === true &&
                        "border-green-500 bg-green-50 dark:bg-green-950/20",
                      validation.expiry === false &&
                        "border-red-500 bg-red-50 dark:bg-red-950/20",
                      "focus:ring-2 focus:ring-purple-500",
                    )}
                  />
                )}
              </InputMask>
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <AnimatePresence mode="wait">
                  {validation.expiry !== null && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                    >
                      {getValidationIcon("expiry")}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            {errors.expiry && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1"
              >
                <AlertCircle className="h-3 w-3" />
                {errors.expiry}
              </motion.p>
            )}
          </div>

          {/* CVV */}
          <div className="space-y-2">
            <Label className="text-sm md:text-base font-semibold flex items-center gap-2">
              CVV
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="group relative"
              >
                <Info className="h-4 w-4 text-gray-400 cursor-help" />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ opacity: 1, scale: 1 }}
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10"
                >
                  {cardBrand === "Amex"
                    ? "4 dígitos no verso"
                    : "3 dígitos no verso"}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                </motion.div>
              </motion.div>
            </Label>
            <div className="relative">
              <Input
                type="text"
                placeholder={cardBrand === "Amex" ? "0000" : "000"}
                value={cardData.cvv}
                onChange={(e) => handleChange("cvv", e.target.value)}
                onFocus={() => setFocused("cvc")}
                onBlur={() => setFocused("")}
                maxLength={cardBrand === "Amex" ? 4 : 3}
                className={cn(
                  "h-14 text-lg font-mono pr-12 transition-all duration-300",
                  validation.cvv === true &&
                    "border-green-500 bg-green-50 dark:bg-green-950/20",
                  validation.cvv === false &&
                    "border-red-500 bg-red-50 dark:bg-red-950/20",
                  "focus:ring-2 focus:ring-purple-500",
                )}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <AnimatePresence mode="wait">
                  {validation.cvv !== null ? (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                    >
                      {getValidationIcon("cvv")}
                    </motion.div>
                  ) : (
                    <Lock className="h-5 w-5 text-gray-400" />
                  )}
                </AnimatePresence>
              </div>
            </div>
            {errors.cvv && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1"
              >
                <AlertCircle className="h-3 w-3" />
                {errors.cvv}
              </motion.p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Security Notice */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex items-center gap-3 p-4 md:p-5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-2xl border-2 border-green-200 dark:border-green-800"
      >
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Shield className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0" />
        </motion.div>
        <p className="text-xs md:text-sm text-green-700 dark:text-green-300 font-semibold">
          🔒 Seus dados estão protegidos com criptografia SSL de 256 bits
        </p>
      </motion.div>
    </motion.div>
  );
};

