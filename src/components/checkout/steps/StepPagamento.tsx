/**
 * StepPagamento - Step 3 do Checkout SyncAds
 * Componente de seleção e processamento de pagamento
 */

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, Smartphone, FileText, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckoutTheme } from "@/config/defaultCheckoutTheme";
import { PixPayment } from "@/components/checkout/PixPayment";
import { CreditCardForm, CardData } from "@/components/checkout/CreditCardForm";
import { BoletoPayment } from "@/components/checkout/BoletoPayment";

type PaymentMethodType = "PIX" | "CREDIT_CARD" | "BOLETO";

interface StepPagamentoProps {
  paymentMethod: PaymentMethodType;
  setPaymentMethod: React.Dispatch<React.SetStateAction<PaymentMethodType>>;
  cardData: CardData | null;
  setCardData: React.Dispatch<React.SetStateAction<CardData | null>>;
  pixData: any;
  boletoData: any;
  installments: number;
  setInstallments: React.Dispatch<React.SetStateAction<number>>;
  finalTotal: number;
  cardErrors?: Record<string, string>;
  getDiscountInfoForMethod?: (method: string) => any;
  theme: CheckoutTheme;
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 },
};

export const StepPagamento: React.FC<StepPagamentoProps> = ({
  paymentMethod,
  setPaymentMethod,
  cardData,
  setCardData,
  pixData,
  boletoData,
  installments,
  setInstallments,
  finalTotal,
  cardErrors = {},
  getDiscountInfoForMethod,
  theme,
}) => {
  const paymentMethods = [
    {
      id: "PIX" as PaymentMethodType,
      icon: Smartphone,
      label: "PIX",
      description: "Aprovação instantânea",
      gradient: "from-green-400 via-emerald-500 to-teal-600",
    },
    {
      id: "CREDIT_CARD" as PaymentMethodType,
      icon: CreditCard,
      label: "Cartão de Crédito",
      description: "Parcele em até 12x",
      gradient: "from-purple-500 via-indigo-500 to-blue-500",
    },
    {
      id: "BOLETO" as PaymentMethodType,
      icon: FileText,
      label: "Boleto Bancário",
      description: "Vencimento em 3 dias",
      gradient: "from-orange-400 via-amber-500 to-yellow-600",
    },
  ];

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
              <CreditCard className="w-6 h-6" />
              Forma de Pagamento
            </h2>
            <p
              className="text-sm opacity-75"
              style={{ color: theme.textColor }}
            >
              Escolha como deseja pagar
            </p>
          </div>

          {/* Payment Method Selector */}
          <div className="grid gap-3">
            {paymentMethods.map((method, index) => {
              const methodDiscount = getDiscountInfoForMethod?.(method.id);
              const isSelected = paymentMethod === method.id;
              const Icon = method.icon;

              return (
                <motion.button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "p-4 md:p-4 rounded-xl border-2 transition-all text-left flex items-center gap-3 md:gap-4 relative overflow-hidden group",
                    isSelected && "shadow-xl",
                  )}
                  style={{
                    borderColor: isSelected
                      ? theme.primaryButtonBackgroundColor
                      : theme.inputBorderColor,
                    backgroundColor: isSelected
                      ? `${theme.primaryButtonBackgroundColor}15`
                      : theme.inputBackgroundColor,
                  }}
                >
                  {isSelected && (
                    <motion.div
                      className={cn(
                        "absolute inset-0 bg-gradient-to-r opacity-10",
                        method.gradient,
                      )}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.1 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}

                  {methodDiscount && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Badge className="absolute -top-2 -right-2 bg-green-500 hover:bg-green-600 text-white text-xs px-2 py-0.5 shadow-lg">
                        {methodDiscount.label}
                      </Badge>
                    </motion.div>
                  )}

                  <div
                    className={cn(
                      "flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center transition-all",
                      isSelected && "bg-white/10",
                    )}
                  >
                    <Icon
                      className="h-6 w-6 md:h-6 md:w-6"
                      style={{
                        color: isSelected
                          ? theme.primaryButtonBackgroundColor
                          : theme.textColor,
                      }}
                    />
                  </div>

                  <div className="flex-1 relative z-10">
                    <div
                      className="font-semibold text-base md:text-base mb-0.5"
                      style={{
                        color: isSelected
                          ? theme.primaryButtonBackgroundColor
                          : theme.headingColor,
                      }}
                    >
                      {method.label}
                    </div>
                    <div className="text-xs md:text-sm opacity-75">
                      {methodDiscount
                        ? `${method.description} + ${methodDiscount.label}`
                        : method.description}
                    </div>
                  </div>

                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 200 }}
                    >
                      <CheckCircle
                        className="h-6 w-6 md:h-6 md:w-6 flex-shrink-0"
                        style={{ color: theme.stepCompletedColor }}
                      />
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Payment Forms */}
          <AnimatePresence mode="wait">
            {/* Credit Card Form */}
            {paymentMethod === "CREDIT_CARD" && (
              <motion.div
                key="credit-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <CreditCardForm
                  onCardDataChange={setCardData}
                  theme={theme}
                  errors={cardErrors}
                />

                {finalTotal > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Label
                      htmlFor="installments"
                      className="flex items-center gap-2"
                      style={{
                        color: theme.labelColor,
                        fontWeight: theme.labelFontWeight,
                      }}
                    >
                      <CreditCard className="w-4 h-4" />
                      Número de Parcelas
                    </Label>
                    <select
                      id="installments"
                      value={installments}
                      onChange={(e) => setInstallments(Number(e.target.value))}
                      className="w-full mt-1.5 px-4 rounded-lg text-base transition-all duration-300 hover:border-blue-500"
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
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => {
                        const installmentValue = finalTotal / num;
                        return (
                          <option key={num} value={num}>
                            {num}x de R$ {installmentValue.toFixed(2)}
                            {num === 1 ? " à vista" : ""}
                          </option>
                        );
                      })}
                    </select>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* PIX Payment */}
            {paymentMethod === "PIX" && (
              <motion.div
                key="pix"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {pixData ? (
                  <PixPayment pixData={pixData} theme={theme} />
                ) : (
                  <motion.div
                    className="text-center py-8"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 dark:bg-green-900/20 mb-4">
                      <Smartphone className="h-8 w-8 text-green-600 dark:text-green-400 animate-pulse" />
                    </div>
                    <h3
                      className="text-xl font-semibold mb-2"
                      style={{ color: theme.headingColor }}
                    >
                      Clique em "Finalizar Compra" para gerar o PIX
                    </h3>
                    <p
                      className="text-sm opacity-70"
                      style={{ color: theme.textColor }}
                    >
                      Você receberá o QR Code para pagamento instantâneo
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Boleto Payment */}
            {paymentMethod === "BOLETO" && (
              <motion.div
                key="boleto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {boletoData ? (
                  <BoletoPayment boletoData={boletoData} theme={theme} />
                ) : (
                  <motion.div
                    className="text-center py-8"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 dark:bg-orange-900/20 mb-4">
                      <FileText className="h-8 w-8 text-orange-600 dark:text-orange-400 animate-pulse" />
                    </div>
                    <h3
                      className="text-xl font-semibold mb-2"
                      style={{ color: theme.headingColor }}
                    >
                      Clique em "Finalizar Compra" para gerar o Boleto
                    </h3>
                    <p
                      className="text-sm opacity-70"
                      style={{ color: theme.textColor }}
                    >
                      Você poderá baixar e imprimir o boleto bancário
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default StepPagamento;

