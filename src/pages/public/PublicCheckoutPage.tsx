/**
 * PublicCheckoutPage - Checkout Moderno SyncAds Brasil
 *
 * Checkout moderno estilo Mercado Pago/PagSeguro com:
 * - Suporte completo a PIX, Cartão e Boleto
 * - Integração Shopify + Paggue-X
 * - Pixel Tracking (Facebook/Google)
 * - Detecção de carrinho abandonado
 * - Animações Framer Motion
 * - 100% Responsivo
 *
 * @version 3.0
 * @date 2025-01-08
 */

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ChevronRight,
  ChevronLeft,
  Lock,
  ShieldCheck,
  Package,
  AlertCircle,
  CreditCard,
  X,
  Check,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { checkoutApi } from "@/lib/api/checkoutApi";
import { usePaymentDiscounts } from "@/hooks/usePaymentDiscounts";
import { usePixelTracking } from "@/hooks/usePixelTracking";
import { useAbandonedCartDetection } from "@/hooks/useAbandonedCartDetection";
import { SocialProofNotifications } from "@/components/checkout/SocialProofNotifications";
import { DEFAULT_CHECKOUT_THEME, applyTheme } from "@/config/defaultCheckoutTheme";
import { getCPFNumbers } from "@/lib/utils/cpfValidation";
import { Stepper } from "@/components/checkout/steps/Stepper";
import { StepDadosPessoais } from "@/components/checkout/steps/StepDadosPessoais";
import { StepEndereco } from "@/components/checkout/steps/StepEndereco";
import { StepPagamento } from "@/components/checkout/steps/StepPagamento";
import { CardData } from "@/components/checkout/CreditCardForm";

// ============================================
// INTERFACES
// ============================================

interface CheckoutData {
  orderId: string;
  products: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
    sku?: string;
  }>;
  total: number;
  subtotal: number;
  tax: number;
  shipping: number;
  discount?: number;
  items?: any[];
}

interface CustomerData {
  name: string;
  email: string;
  phone: string;
  document: string;
  birthDate?: string;
  gender?: string;
}

interface AddressData {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

interface PublicCheckoutProps {
  injectedOrderId?: string;
  injectedTheme?: any;
  previewMode?: boolean;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

const PublicCheckoutPage: React.FC<PublicCheckoutProps> = ({
  injectedOrderId,
  injectedTheme,
  previewMode = false,
}) => {
  const { orderId } = useParams<{ orderId: string }>();
  const effectiveOrderId = injectedOrderId || orderId || null;
  const navigate = useNavigate();
  const { toast } = useToast();

  // Estados principais
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [orderData, setOrderData] = useState<any>(null);
  const [customization, setCustomization] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Dados do formulário
  const [customerData, setCustomerData] = useState<CustomerData>({
    name: "",
    email: "",
    phone: "",
    document: "",
  });

  const [addressData, setAddressData] = useState<AddressData>({
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: "",
  });

  // Dados de pagamento
  const [paymentMethod, setPaymentMethod] = useState<"CREDIT_CARD" | "PIX" | "BOLETO">("PIX");
  const [installments, setInstallments] = useState(1);
  const [cardData, setCardData] = useState<CardData | null>(null);
  const [pixData, setPixData] = useState<any>(null);
  const [boletoData, setBoletoData] = useState<any>(null);
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({});

  // Tema
  const theme = injectedTheme
    ? applyTheme(injectedTheme)
    : customization?.theme
    ? applyTheme(customization.theme)
    : DEFAULT_CHECKOUT_THEME;

  // ============================================
  // HOOKS
  // ============================================

  // Hook de descontos
  const {
    calculation: discountCalculation,
    activeDiscount,
    getDiscountLabel,
    getDiscountInfoForMethod,
  } = usePaymentDiscounts({
    userId: orderData?.userId || null,
    paymentMethod: paymentMethod,
    purchaseAmount: checkoutData?.subtotal || 0,
  });

  const finalTotal = discountCalculation.hasDiscount
    ? discountCalculation.finalTotal + (checkoutData?.shipping || 0) + (checkoutData?.tax || 0)
    : checkoutData?.total || 0;

  // Hook de Pixel Tracking
  const {
    initialized: pixelsInitialized,
    trackPageView,
    trackInitiateCheckout,
    trackAddPaymentInfo,
    trackPurchase,
  } = usePixelTracking(orderData?.userId || null);

  // Hook de carrinho abandonado
  const { markAsRecovered } = useAbandonedCartDetection({
    orderId: effectiveOrderId,
    currentStep,
    customerData,
    addressData,
    checkoutData,
    userId: orderData?.userId || null,
  });

  // ============================================
  // CARREGAR DADOS
  // ============================================

  useEffect(() => {
    if (effectiveOrderId) {
      loadCheckoutData();
    }
  }, [effectiveOrderId]);

  const loadCheckoutData = async () => {
    try {
      setLoading(true);

      const { data: order, error: orderError } = await supabase
        .from("Order")
        .select("*")
        .eq("id", effectiveOrderId)
        .single();

      if (orderError || !order) {
        throw new Error("Pedido não encontrado");
      }

      const items = Array.isArray(order.items) ? order.items : [];
      const originalProducts = Array.isArray(order.metadata?.originalProducts)
        ? order.metadata.originalProducts
        : [];

      const checkoutInfo: CheckoutData = {
        orderId: order.id,
        products: items.map((item: any) => {
          const original = originalProducts.find(
            (op: any) =>
              (op?.variantId && String(op.variantId) === String(item.variantId)) ||
              (op?.productId && String(op.productId) === String(item.productId)) ||
              (op?.id && (String(op.id) === String(item.productId) || String(op.id) === String(item.id)))
          );
          return {
            id: item.productId || item.id,
            name: item.name || original?.name || original?.title || "Produto",
            price: Number(item.price) || 0,
            quantity: Number(item.quantity) || 1,
            image: item.image || original?.image || (Array.isArray(original?.images) ? original.images[0] : "") || "",
            sku: item.sku || original?.sku || "",
          };
        }),
        total: Number(order.total) || 0,
        subtotal: Number(order.subtotal) || 0,
        tax: Number(order.tax) || 0,
        shipping: Number(order.shipping) || 0,
        discount: Number(order.discount) || 0,
        items: items,
      };

      setCheckoutData(checkoutInfo);
      setOrderData(order);

      if (!previewMode && order.userId) {
        try {
          const customData = await checkoutApi.loadCustomization(order.userId);
          if (customData) {
            setCustomization(customData);
          }
        } catch (e) {
          console.log("Usando tema padrão");
        }
      }
    } catch (error: any) {
      console.error("Erro ao carregar checkout:", error);
      toast({
        title: "Erro ao carregar checkout",
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // TRACKING
  // ============================================

  useEffect(() => {
    if (pixelsInitialized && orderData) {
      trackPageView();
    }
  }, [pixelsInitialized, orderData]);

  useEffect(() => {
    if (pixelsInitialized && currentStep === 3 && checkoutData) {
      trackInitiateCheckout(finalTotal, checkoutData.items || []);
    }
  }, [pixelsInitialized, currentStep, finalTotal, checkoutData]);

  useEffect(() => {
    if (pixelsInitialized && paymentMethod && currentStep === 3) {
      trackAddPaymentInfo(finalTotal, paymentMethod);
    }
  }, [pixelsInitialized, paymentMethod, finalTotal, currentStep]);

  // ============================================
  // PERSISTÊNCIA
  // ============================================

  useEffect(() => {
    const savedState = localStorage.getItem(`checkout-${orderId}`);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        if (parsed.currentStep) setCurrentStep(parsed.currentStep);
        if (parsed.customerData) setCustomerData(parsed.customerData);
        if (parsed.addressData) setAddressData(parsed.addressData);
        if (parsed.paymentMethod) setPaymentMethod(parsed.paymentMethod);
        if (parsed.pixData) setPixData(parsed.pixData);
        if (parsed.boletoData) setBoletoData(parsed.boletoData);
      } catch (error) {
        console.error("Erro ao recuperar estado:", error);
      }
    }
  }, [orderId]);

  useEffect(() => {
    if (orderId) {
      const state = {
        currentStep,
        customerData,
        addressData,
        paymentMethod,
        pixData,
        boletoData,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(`checkout-${orderId}`, JSON.stringify(state));
    }
  }, [currentStep, customerData, addressData, paymentMethod, pixData, boletoData, orderId]);

  // ============================================
  // VALIDAÇÕES
  // ============================================

  const validateStep = (step: number): boolean => {
    if (step === 1) {
      if (!customerData.name || !customerData.email || !customerData.phone) {
        toast({
          title: "Dados incompletos",
          description: "Preencha todos os campos obrigatórios",
          variant: "destructive",
        });
        return false;
      }
      if (theme.requestCpfOnlyAtPayment === false && !customerData.document) {
        toast({
          title: "CPF obrigatório",
          description: "Por favor, informe seu CPF",
          variant: "destructive",
        });
        return false;
      }
    }

    if (step === 2) {
      if (!addressData.zipCode || !addressData.street || !addressData.number || !addressData.neighborhood || !addressData.city || !addressData.state) {
        toast({
          title: "Endereço incompleto",
          description: "Preencha todos os campos obrigatórios",
          variant: "destructive",
        });
        return false;
      }
    }

    return true;
  };

  // ============================================
  // NAVEGAÇÃO
  // ============================================

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ============================================
  // PROCESSAR PAGAMENTO
  // ============================================

  const handleCheckout = async () => {
    if (!validateStep(currentStep)) return;

    try {
      setProcessing(true);

      const normalizedPaymentMethod = paymentMethod.toLowerCase() as "credit_card" | "pix" | "boleto";

      if (paymentMethod === "CREDIT_CARD") {
        if (!cardData || !cardData.number || !cardData.holderName || !cardData.cvv) {
          toast({
            title: "Dados do cartão incompletos",
            description: "Por favor, preencha todos os dados do cartão.",
            variant: "destructive",
          });
          setProcessing(false);
          return;
        }
      }

      const cardPayload = paymentMethod === "CREDIT_CARD" && cardData
        ? {
            number: cardData.number.replace(/\s/g, ""),
            holderName: cardData.holderName,
            expiryMonth: cardData.expiryMonth,
            expiryYear: cardData.expiryYear,
            cvv: cardData.cvv,
          }
        : undefined;

      // Atualizar pedido
      const { error: updateError } = await supabase
        .from("Order")
        .update({
          customerName: customerData.name,
          customerEmail: customerData.email,
          customerPhone: customerData.phone,
          customerCpf: getCPFNumbers(customerData.document),
          shippingAddress: {
            street: addressData.street,
            number: addressData.number,
            complement: addressData.complement || "",
            neighborhood: addressData.neighborhood,
            city: addressData.city,
            state: addressData.state,
            zipCode: addressData.zipCode,
            country: "BR",
          },
          billingAddress: {
            street: addressData.street,
            number: addressData.number,
            complement: addressData.complement || "",
            neighborhood: addressData.neighborhood,
            city: addressData.city,
            state: addressData.state,
            zipCode: addressData.zipCode,
            country: "BR",
          },
          paymentMethod: paymentMethod,
          updatedAt: new Date().toISOString(),
        })
        .eq("id", effectiveOrderId);

      if (updateError) {
        console.error("Erro ao atualizar pedido:", updateError);
        toast({
          title: "Erro ao salvar dados",
          description: "Não foi possível salvar os dados do pedido",
          variant: "destructive",
        });
        setProcessing(false);
        return;
      }

      // Processar pagamento
      const { data, error } = await supabase.functions.invoke("process-payment", {
        body: {
          userId: orderData?.userId,
          orderId: effectiveOrderId,
          amount: checkoutData?.total || 0,
          currency: "BRL",
          paymentMethod: normalizedPaymentMethod,
          customer: {
            name: customerData.name,
            email: customerData.email,
            document: getCPFNumbers(customerData.document),
            phone: customerData.phone,
          },
          billingAddress: {
            street: addressData.street,
            number: addressData.number,
            complement: addressData.complement,
            neighborhood: addressData.neighborhood,
            city: addressData.city,
            state: addressData.state,
            zipCode: addressData.zipCode,
          },
          card: cardPayload,
          installments: paymentMethod === "CREDIT_CARD" ? installments : 1,
        },
      });

      if (!data?.success) {
        if (data?.requiresSetup || data?.error === "NO_GATEWAY_CONFIGURED") {
          toast({
            title: "Gateway não configurado",
            description: data?.hint || "Configure um gateway de pagamento primeiro",
            variant: "destructive",
            duration: 10000,
          });
          setProcessing(false);
          return;
        }
        throw new Error(data?.message || data?.error || "Erro ao processar pagamento");
      }

      if (error) throw error;

      // Sincronizar com Shopify
      try {
        await supabase.functions.invoke("sync-order-to-shopify", {
          body: {
            orderId: effectiveOrderId,
            userId: orderData?.userId,
          },
        });
      } catch (shopifyErr) {
        console.warn("Erro ao sincronizar Shopify (não-crítico):", shopifyErr);
      }

      if (data.success) {
        // Track conversão
        if (pixelsInitialized) {
          trackPurchase(effectiveOrderId, finalTotal, checkoutData?.items || [], {
            email: customerData.email,
            phone: customerData.phone,
            firstName: customerData.name?.split(" ")[0],
            lastName: customerData.name?.split(" ").slice(1).join(" "),
            city: addressData.city,
            state: addressData.state,
            zipCode: addressData.zipCode,
            country: "BR",
          });
        }

        // Marcar como recuperado
        if (markAsRecovered) {
          await markAsRecovered();
        }

        // Redirecionar
        if (paymentMethod === "CREDIT_CARD") {
          toast({ title: "Pagamento processado!", description: "Redirecionando..." });
          setTimeout(() => {
            navigate(`/checkout/success/${data.transactionId || effectiveOrderId}`);
          }, 1500);
        } else if (paymentMethod === "PIX" && data.pixData) {
          const pixInfo = {
            qrCode: data.pixData.qrCode || "",
            qrCodeBase64: data.pixData.qrCodeBase64 || "",
            expiresAt: data.pixData.expiresAt || "",
            amount: checkoutData?.total || 0,
            transactionId: data.transactionId || "",
          };
          localStorage.setItem(`pix-${effectiveOrderId}`, JSON.stringify(pixInfo));
          toast({ title: "PIX gerado!", description: "Redirecionando..." });
          setTimeout(() => {
            navigate(`/pix/${effectiveOrderId}/${data.transactionId}`);
          }, 1000);
        } else if (paymentMethod === "BOLETO" && data.boletoData) {
          setBoletoData(data.boletoData);
          localStorage.setItem(`boleto-${effectiveOrderId}`, JSON.stringify(data.boletoData));
          toast({ title: "Boleto gerado!", description: "Baixe o boleto." });
        }
      }
    } catch (error: any) {
      console.error("Erro ao processar checkout:", error);
      toast({
        title: "Erro ao processar pagamento",
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  // ============================================
  // LOADING
  // ============================================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg font-medium text-slate-700">Carregando checkout...</p>
        </div>
      </div>
    );
  }

  if (!checkoutData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Pedido não encontrado. Verifique o link e tente novamente.</AlertDescription>
        </Alert>
      </div>
    );
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header Moderno */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 max-w-6xl">
          <div className="flex items-center justify-between">
            {theme.logoUrl ? (
              <img src={theme.logoUrl} alt="Logo" className="h-10 object-contain" />
            ) : (
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Checkout Seguro
              </h1>
            )}
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <ShieldCheck className="w-4 h-4 text-green-600" />
              <span className="hidden sm:inline">Compra 100% Segura</span>
            </div>
          </div>
        </div>
      </header>

      {/* Barra de Avisos */}
      {theme.noticeBarEnabled && theme.noticeBarMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-2 px-4 text-center text-sm font-medium"
          style={{
            backgroundColor: theme.noticeBarBackgroundColor,
            color: theme.noticeBarTextColor,
          }}
        >
          {theme.noticeBarMessage}
        </motion.div>
      )}

      {/* Stepper */}
      <Stepper currentStep={currentStep} theme={theme} />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid lg:grid-cols-[1fr_420px] gap-8">
          {/* Coluna Esquerda - Formulário */}
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <StepDadosPessoais customerData={customerData} setCustomerData={setCustomerData} theme={theme} />
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <StepEndereco addressData={addressData} setAddressData={setAddressData} theme={theme} />
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
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
                    cardErrors={cardErrors}
                    getDiscountInfoForMethod={getDiscountInfoForMethod}
                    theme={theme}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Botões de Navegação */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex gap-4"
            >
              {currentStep > 1 && (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1 h-14 text-base font-semibold border-2"
                  style={{ borderColor: theme.inputBorderColor }}
                >
                  <ChevronLeft className="w-5 h-5 mr-2" />
                  Voltar
                </Button>
              )}
              {currentStep < 3 ? (
                <Button
                  onClick={handleNext}
                  className={cn("flex-1 h-14 text-base font-bold shadow-lg hover:shadow-xl transition-all", currentStep === 1 && "w-full")}
                  style={{
                    backgroundColor: theme.primaryButtonBackgroundColor,
                    color: theme.primaryButtonTextColor,
                  }}
                >
                  Continuar
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleCheckout}
                  disabled={processing || previewMode}
                  className="flex-1 h-14 text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-xl hover:shadow-2xl transition-all"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Processando...
                    </>
                  ) : previewMode ? (
                    <>
                      <Lock className="w-5 h-5 mr-2" />
                      Preview Mode
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5 mr-2" />
                      Finalizar Compra
                    </>
                  )}
                </Button>
              )}
            </motion.div>
          </div>

          {/* Coluna Direita - Resumo */}
          <div className="hidden lg:block">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="sticky top-24">
              <Card className="shadow-2xl border-2" style={{ borderColor: theme.highlightedBorderColor }}>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2" style={{ color: theme.headingColor }}>
                    <Package className="w-5 h-5" />
                    Resumo do Pedido
                  </h3>

                  {/* Produtos */}
                  <div className="space-y-4 mb-6">
                    {checkoutData.products.map((product, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {product.image ? (
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-8 h-8 text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm truncate" style={{ color: theme.headingColor }}>
                            {product.name}
                          </h4>
                          <p className="text-xs text-slate-600">Qtd: {product.quantity}</p>
                        </div>
                        <p className="font-bold text-sm" style={{ color: theme.headingColor }}>
                          R$ {(product.price * product.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <Separator className="my-4" />

                  {/* Totais */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>R$ {checkoutData.subtotal.toFixed(2)}</span>
                    </div>
                    {checkoutData.shipping > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Frete</span>
                        <span>R$ {checkoutData.shipping.toFixed(2)}</span>
                      </div>
                    )}
                    
                    <Separator className="my-2" />
                    
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-lg font-bold" style={{ color: theme.headingColor }}>Total</span>
                      <span className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        R$ {finalTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Trust Badges */}
                  {theme.showTrustBadges && (
                    <div className="mt-6 pt-6 border-t space-y-2">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <ShieldCheck className="w-4 h-4 text-green-600" />
                        <span>Compra 100% Segura</span>
                      </div>
                      {theme.sslBadgeEnabled && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Lock className="w-4 h-4 text-green-600" />
                          <span>Certificado SSL</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Social Proof */}
      <SocialProofNotifications userId={orderData?.userId || null} position="bottom-left" />

      {/* Footer */}
      {theme.showFooter && (
        <footer className="border-t bg-white/50 backdrop-blur-sm mt-16 py-8">
          <div className="container mx-auto px-4 max-w-6xl text-center text-sm text-slate-600">
            <p>© {new Date().getFullYear()} - Todos os direitos reservados</p>
          </div>
        </footer>
      )}
    </div>
  );
};

export default PublicCheckoutPage;
