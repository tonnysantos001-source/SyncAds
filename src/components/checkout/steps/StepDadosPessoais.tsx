/**
 * StepDadosPessoais - Step 1 do Checkout SyncAds
 * Formulário de dados pessoais com validações em tempo real
 */

import React, { useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Phone, Hash, Check, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { CheckoutTheme } from "@/config/defaultCheckoutTheme";
import { formatPhone, validatePhone } from "@/lib/utils/phoneUtils";
import { formatCpf, validateCpf } from "@/lib/utils/cpfUtils";
import {
  validateNameDebounced,
  validateEmailDebounced,
  validatePhoneDebounced,
  capitalizeWords,
  NameValidationResult,
  EmailValidationResult,
  ValidationResult,
} from "@/lib/utils/validationUtils";

interface CustomerData {
  name: string;
  email: string;
  phone: string;
  document: string;
  birthDate?: string;
  gender?: string;
}

interface StepDadosPessoaisProps {
  customerData: CustomerData;
  setCustomerData: React.Dispatch<React.SetStateAction<CustomerData>>;
  theme: CheckoutTheme;
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

export const StepDadosPessoais: React.FC<StepDadosPessoaisProps> = ({
  customerData,
  setCustomerData,
  theme,
}) => {
  const { toast } = useToast();
  const [nameValidation, setNameValidation] =
    useState<NameValidationResult | null>(null);
  const [emailValidation, setEmailValidation] =
    useState<EmailValidationResult | null>(null);
  const [phoneValidation, setPhoneValidation] =
    useState<ValidationResult | null>(null);

  const handleNameChange = (value: string) => {
    const capitalized = capitalizeWords(value);
    setCustomerData({ ...customerData, name: capitalized });
    validateNameDebounced(value, setNameValidation);
  };

  const handleEmailChange = (value: string) => {
    setCustomerData({ ...customerData, email: value.toLowerCase().trim() });
    validateEmailDebounced(value, setEmailValidation);
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhone(value);
    setCustomerData({ ...customerData, phone: formatted });
    validatePhoneDebounced(formatted, setPhoneValidation);
  };

  const handlePhoneBlur = () => {
    if (customerData.phone) {
      const validation = validatePhone(customerData.phone);
      if (!validation.valid) {
        toast({
          title: "Telefone inválido",
          description: validation.message,
          variant: "destructive",
        });
      }
    }
  };

  const handleDocumentChange = (value: string) => {
    const formatted = formatCpf(value);
    setCustomerData({ ...customerData, document: formatted });
  };

  const handleDocumentBlur = () => {
    if (customerData.document) {
      const validation = validateCpf(customerData.document);
      if (!validation.valid) {
        toast({
          title: "CPF inválido",
          description: validation.message,
          variant: "destructive",
        });
      }
    }
  };

  return (
    <motion.div {...fadeInUp}>
      <Card
        style={{
          backgroundColor: theme.cardBackgroundColor,
          borderColor: theme.cardBorderColor,
          borderRadius: theme.cardBorderRadius,
          boxShadow: theme.cardShadow,
        }}
      >
        <CardContent className="p-5 md:p-6 space-y-5">
          <div>
            <h2
              className="text-xl md:text-2xl font-bold mb-1 flex items-center gap-2"
              style={{ color: theme.headingColor }}
            >
              <User className="w-6 h-6" />
              Dados Pessoais
            </h2>
            <p
              className="text-sm opacity-75"
              style={{ color: theme.textColor }}
            >
              Preencha suas informações
            </p>
          </div>

          <div className="space-y-4 md:space-y-4">
            {/* Nome */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Label
                htmlFor="name"
                className="flex items-center gap-2"
                style={{
                  color: theme.labelColor,
                  fontWeight: theme.labelFontWeight,
                }}
              >
                <User className="w-4 h-4" />
                Nome Completo *
              </Label>
              <div className="relative mt-1.5">
                <Input
                  id="name"
                  placeholder="Seu nome completo"
                  value={customerData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className={cn(
                    "text-base pr-10 transition-all",
                    nameValidation?.isValid === true &&
                      "border-green-500 bg-green-50/50",
                    nameValidation?.isValid === false &&
                      "border-red-500 bg-red-50/50",
                  )}
                  style={{
                    backgroundColor: theme.inputBackgroundColor,
                    borderColor: theme.inputBorderColor,
                    height: 48,
                    borderRadius: theme.inputBorderRadius,
                    color: theme.textColor,
                  }}
                />
                {nameValidation?.isValid === true && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <Check className="w-5 h-5 text-green-600" />
                  </motion.div>
                )}
                {nameValidation?.isValid === false && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </motion.div>
                )}
              </div>
              {nameValidation?.error && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-600 mt-1 flex items-center gap-1"
                >
                  <AlertCircle className="w-3 h-3" />
                  {nameValidation.error}
                </motion.p>
              )}
            </motion.div>

            {/* Email e Telefone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Label
                  htmlFor="email"
                  style={{
                    color: theme.labelColor,
                    fontWeight: theme.labelFontWeight,
                  }}
                >
                  <Mail className="w-4 h-4 inline mr-1" />
                  E-mail *
                </Label>
                <div className="relative mt-1.5">
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={customerData.email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    className={cn(
                      "text-base pr-10 transition-all",
                      emailValidation?.isValid === true &&
                        "border-green-500 bg-green-50/50",
                      emailValidation?.isValid === false &&
                        "border-red-500 bg-red-50/50",
                    )}
                    style={{
                      backgroundColor: theme.inputBackgroundColor,
                      borderColor: theme.inputBorderColor,
                      height: 48,
                      borderRadius: theme.inputBorderRadius,
                      color: theme.textColor,
                    }}
                  />
                  {emailValidation?.isValid === true && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      <Check className="w-5 h-5 text-green-600" />
                    </motion.div>
                  )}
                </div>
                {emailValidation?.suggestion && (
                  <motion.button
                    type="button"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() =>
                      handleEmailChange(emailValidation.suggestion || "")
                    }
                    className="text-sm text-blue-600 hover:text-blue-700 mt-1 flex items-center gap-1 font-medium hover:underline"
                  >
                    Você quis dizer:{" "}
                    <span className="underline">
                      {emailValidation.suggestion}
                    </span>
                    ?
                  </motion.button>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Label
                  htmlFor="phone"
                  style={{
                    color: theme.labelColor,
                    fontWeight: theme.labelFontWeight,
                  }}
                >
                  <Phone className="w-4 h-4 inline mr-1" />
                  Telefone *
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={customerData.phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  onBlur={handlePhoneBlur}
                  maxLength={15}
                  className="mt-1.5 text-base"
                  style={{
                    backgroundColor: theme.inputBackgroundColor,
                    borderColor: theme.inputBorderColor,
                    height: 48,
                    borderRadius: theme.inputBorderRadius,
                    color: theme.textColor,
                  }}
                />
              </motion.div>
            </div>

            {/* CPF */}
            {theme.requestCpfOnlyAtPayment === false && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Label
                  htmlFor="document"
                  style={{
                    color: theme.labelColor,
                    fontWeight: theme.labelFontWeight,
                  }}
                >
                  <Hash className="w-4 h-4 inline mr-1" />
                  CPF *
                </Label>
                <Input
                  id="document"
                  placeholder="000.000.000-00"
                  maxLength={14}
                  value={customerData.document}
                  onChange={(e) => handleDocumentChange(e.target.value)}
                  onBlur={handleDocumentBlur}
                  className="mt-1.5 text-base"
                  style={{
                    backgroundColor: theme.inputBackgroundColor,
                    borderColor: theme.inputBorderColor,
                    height: 48,
                    borderRadius: theme.inputBorderRadius,
                    color: theme.textColor,
                  }}
                />
              </motion.div>
            )}

            {/* Data Nascimento */}
            {theme.requestBirthDate && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Label
                  htmlFor="birthDate"
                  style={{
                    color: theme.labelColor,
                    fontWeight: theme.labelFontWeight,
                  }}
                >
                  Data de Nascimento
                </Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={customerData.birthDate}
                  onChange={(e) =>
                    setCustomerData({
                      ...customerData,
                      birthDate: e.target.value,
                    })
                  }
                  className="mt-1.5 text-base"
                  style={{
                    backgroundColor: theme.inputBackgroundColor,
                    borderColor: theme.inputBorderColor,
                    height: 48,
                    borderRadius: theme.inputBorderRadius,
                    color: theme.textColor,
                  }}
                />
              </motion.div>
            )}

            {/* Gênero */}
            {theme.requestGender && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Label
                  htmlFor="gender"
                  style={{
                    color: theme.labelColor,
                    fontWeight: theme.labelFontWeight,
                  }}
                >
                  Gênero
                </Label>
                <select
                  id="gender"
                  value={customerData.gender}
                  onChange={(e) =>
                    setCustomerData({ ...customerData, gender: e.target.value })
                  }
                  className="w-full mt-1.5 px-4 rounded-lg text-base"
                  style={{
                    backgroundColor: theme.inputBackgroundColor,
                    borderColor: theme.inputBorderColor,
                    height: 48,
                    borderRadius: theme.inputBorderRadius,
                    borderWidth: 1,
                    borderStyle: "solid",
                    color: theme.textColor,
                  }}
                >
                  <option value="">Selecione...</option>
                  <option value="masculino">Masculino</option>
                  <option value="feminino">Feminino</option>
                  <option value="outro">Outro</option>
                  <option value="prefiro_nao_dizer">Prefiro não dizer</option>
                </select>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default StepDadosPessoais;

