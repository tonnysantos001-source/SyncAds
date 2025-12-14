/**
 * Modern Checkout Page - SyncAds Brasil
 * Checkout moderno estilo Mercado Pago/PagSeguro
 * Suporta PIX, Cartão e Boleto
 */

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Stepper } from "@/components/checkout/steps/Stepper";
import { StepDadosPessoais } from "@/components/checkout/steps/StepDadosPessoais";
import { StepEndereco } from "@/components/checkout/steps/StepEndereco";
import { StepPagamento } from "@/components/checkout/steps/StepPagamento";
import { supabase } from "@/lib/supabase";
import { checkoutApi } from "@/lib/api/checkoutApi";
import { DEFAULT_CHECKOUT_THEME, applyTheme } from "@/config/defaultCheckoutTheme";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Lock, ShieldCheck, Package } from "lucide-react";
import { cn } from "@/lib/utils";

export const ModernCheckoutPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [customerData, setCustomerData] = useState({ name: "", email: "", phone: "", document: "", birthDate: "", gender: "" });
  const [addressData, setAddressData] = useState({ street: "", number: "", complement: "", neighborhood: "", city: "", state: "", zipCode: "" });
  const [paymentMethod, setPaymentMethod] = useState<"PIX" | "CREDIT_CARD" | "BOLETO">("PIX");
  const [cardData, setCardData] = useState(null);
  const [pixData, setPixData] = useState(null);
  const [boletoData, setBoletoData] = useState(null);
  const [installments, setInstallments] = useState(1);
  const [orderData, setOrderData] = useState<any>(null);
  const [customization, setCustomization] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const theme = customization?.theme ? applyTheme(customization.theme) : DEFAULT_CHECKOUT_THEME;
  const finalTotal = orderData?.total || 0;

  // Placeholder - carregar dados reais
  useEffect(() => {
    const loadData = async () => {
      try {
        const { data } = await supabase.from("Order").select("*").eq("id", orderId).single();
        setOrderData(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    if (orderId) loadData();
  }, [orderId]);

  const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, 3));
  const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">Carregando...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 max-w-6xl">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">SyncAds Checkout</h1>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <ShieldCheck className="w-4 h-4 text-green-600" />
              Compra Segura
            </div>
          </div>
        </div>
      </header>

      {/* Stepper */}
      <Stepper currentStep={currentStep} theme={theme} />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid lg:grid-cols-[1fr_400px] gap-8">
          {/* Form Column */}
          <div>
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                  <StepDadosPessoais customerData={customerData} setCustomerData={setCustomerData} theme={theme} />
                </motion.div>
              )}
              
              {currentStep === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                  <StepEndereco addressData={addressData} setAddressData={setAddressData} theme={theme} />
                </motion.div>
              )}
              
              {currentStep === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                  <StepPagamento 
                    paymentMethod={paymentMethod} 
                    setPaymentMethod={setPaymentMethod}
                    cardData={cardData}
                    setCardData={setCardData}
                    pixData={pixData}
                    boletoData={boletoData}
                    installments={installments}
                    setInstallments={setInstallments}
                    finalTotal={finalTotal}
                    theme={theme}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex gap-4 mt-8">
              {currentStep > 1 && (
                <Button variant="outline" onClick={handleBack} className="flex-1">
                  <ChevronLeft className="w-5 h-5 mr-2" />
                  Voltar
                </Button>
              )}
              {currentStep < 3 ? (
                <Button onClick={handleNext} className={cn("flex-1", currentStep === 1 && "w-full")}>
                  Continuar
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              ) : (
                <Button className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                  <Lock className="w-5 h-5 mr-2" />
                  Finalizar Compra
                </Button>
              )}
            </div>
          </div>

          {/* Summary Column */}
          <div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="sticky top-24">
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Resumo do Pedido
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between text-lg">
                    <span>Total</span>
                    <span className="font-bold text-2xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      R$ {finalTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ModernCheckoutPage;

