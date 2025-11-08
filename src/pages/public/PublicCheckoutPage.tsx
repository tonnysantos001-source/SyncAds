/**
 * PublicCheckoutPageNovo - Checkout Moderno Brasileiro v5.0
 *
 * ✅ Isolado do dark mode do painel
 * ✅ Stepper correto (1,2,3)
 * ✅ Suporte a 1 ou 3 etapas
 * ✅ Banner configurável
 * ✅ 100% Responsivo
 * ✅ Integração Shopify + Paggue-X
 */

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  ShieldCheck,
  Lock,
  ChevronLeft,
  Check,
  User,
  MapPin,
  CreditCard,
  Package,
  AlertCircle,
  Mail,
  Phone,
  Hash,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { checkoutApi } from "@/lib/api/checkoutApi";
import { DEFAULT_CHECKOUT_THEME } from "@/config/defaultCheckoutTheme";
import { getCPFNumbers } from "@/lib/utils/cpfValidation";
import { CheckoutButton } from "@/components/checkout/CheckoutButton";
import { CheckoutInput } from "@/components/checkout/CheckoutInput";
import { CheckoutFooter } from "@/components/checkout/CheckoutFooter";
import { OrderBumpCard } from "@/components/checkout/OrderBumpCard";

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
  }>;
  total: number;
  subtotal: number;
  shipping: number;
  discount?: number;
}

interface CustomerData {
  name: string;
  email: string;
  phone: string;
  document: string;
}

interface AddressData {
  zipCode: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
}

interface CardData {
  number: string;
  holderName: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
}

// ============================================
// STEPPER COMPONENT
// ============================================

const ModernStepper: React.FC<{ currentStep: number; theme: any }> = ({
  currentStep,
  theme,
}) => {
  const steps = [
    { number: 1, label: "Dados", icon: User },
    { number: 2, label: "Entrega", icon: MapPin },
    { number: 3, label: "Pagamento", icon: CreditCard },
  ];

  return (
    <div className="w-full py-6 px-4">
      <div className="max-w-3xl mx-auto flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            <div className="flex flex-col items-center">
              <motion.div
                className="w-12 h-12 rounded-full flex items-center justify-center font-bold shadow-lg"
                style={{
                  backgroundColor:
                    currentStep >= step.number
                      ? theme.primaryButtonBackgroundColor || "#8b5cf6"
                      : "#e5e7eb",
                  color: currentStep >= step.number ? "#ffffff" : "#9ca3af",
                }}
                whileHover={{ scale: 1.05 }}
              >
                {currentStep > step.number ? (
                  <Check className="w-6 h-6" />
                ) : (
                  <step.icon className="w-6 h-6" />
                )}
              </motion.div>
              <span
                className="text-xs mt-2 font-medium"
                style={{
                  color: currentStep >= step.number ? "#111827" : "#9ca3af",
                }}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className="flex-1 mx-2">
                <div
                  className="h-1 rounded-full"
                  style={{
                    backgroundColor:
                      currentStep > step.number
                        ? theme.primaryButtonBackgroundColor || "#8b5cf6"
                        : "#e5e7eb",
                  }}
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

interface PublicCheckoutPageProps {
  injectedOrderId?: string;
  injectedTheme?: any;
  previewMode?: boolean;
}

const PublicCheckoutPageNovo: React.FC<PublicCheckoutPageProps> = ({
  injectedOrderId,
  injectedTheme,
  previewMode = false,
}) => {
  const { orderId: paramOrderId } = useParams<{ orderId: string }>();
  const orderId = injectedOrderId || paramOrderId;
  const navigate = useNavigate();
  const { toast } = useToast();

  // Estados
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [orderData, setOrderData] = useState<any>(null);
  const [theme, setTheme] = useState<any>(DEFAULT_CHECKOUT_THEME);
  const [currentStep, setCurrentStep] = useState(1);
  const [storeData, setStoreData] = useState<any>(null);
  const [orderBumps, setOrderBumps] = useState<any[]>([]);
  const [selectedOrderBumps, setSelectedOrderBumps] = useState<string[]>([]);

  // Dados do formulário
  const [customerData, setCustomerData] = useState<CustomerData>({
    name: "",
    email: "",
    phone: "",
    document: "",
  });

  const [addressData, setAddressData] = useState<AddressData>({
    zipCode: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
  });

  const [paymentMethod, setPaymentMethod] = useState<
    "PIX" | "CREDIT_CARD" | "BOLETO"
  >("PIX");
  const [cardData, setCardData] = useState<CardData>({
    number: "",
    holderName: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
  });

  const navigationSteps = theme.navigationSteps || 3;

  // ============================================
  // CARREGAR DADOS
  // ============================================

  useEffect(() => {
    if (orderId) loadCheckoutData();
  }, [orderId]);

  const loadCheckoutData = async () => {
    try {
      setLoading(true);

      console.log("🔍 [DEBUG] loadCheckoutData iniciado");
      console.log("🔍 [DEBUG] orderId:", orderId);
      console.log("🔍 [DEBUG] injectedOrderId:", injectedOrderId);
      console.log("🔍 [DEBUG] previewMode:", previewMode);

      const { data: order, error: orderError } = await supabase
        .from("Order")
        .select("*")
        .eq("id", orderId)
        .single();

      console.log("🔍 [DEBUG] Query result:", { order, error: orderError });

      if (orderError || !order) {
        console.error("❌ [DEBUG] Erro ao buscar pedido:", orderError);
        throw new Error("Pedido não encontrado");
      }

      console.log("✅ [DEBUG] Pedido encontrado:", {
        id: order.id,
        orderNumber: order.orderNumber,
        items: order.items,
        metadata: order.metadata,
      });

      const items = Array.isArray(order.items) ? order.items : [];
      const originalProducts = Array.isArray(order.metadata?.originalProducts)
        ? order.metadata.originalProducts
        : [];

      console.log("🔍 [DEBUG] Items processados:", {
        itemsCount: items.length,
        originalProductsCount: originalProducts.length,
        firstItem: items[0],
        firstOriginal: originalProducts[0],
      });

      const checkoutInfo: CheckoutData = {
        orderId: order.id,
        products: items.map((item: any, index: number) => {
          console.log(`🔍 [DEBUG] Processando item ${index}:`, item);

          const original = originalProducts.find(
            (op: any) => String(op?.id) === String(item?.productId),
          );

          console.log(
            `🔍 [DEBUG] Original encontrado para item ${index}:`,
            original,
          );

          const product = {
            id: item?.productId || item?.id || `temp-${index}`,
            name: item?.name || original?.name || original?.title || "Produto",
            price: Number(item?.price) || Number(item?.total) || 0,
            quantity: Number(item?.quantity) || 1,
            image:
              item?.image ||
              original?.image ||
              (Array.isArray(original?.images) && original.images[0]) ||
              "",
          };

          console.log(`✅ [DEBUG] Produto final ${index}:`, product);
          return product;
        }),
        total: Number(order.total) || 0,
        subtotal: Number(order.subtotal) || 0,
        shipping: Number(order.shipping) || 0,
        discount: Number(order.discount) || 0,
      };

      console.log("✅ [DEBUG] CheckoutInfo criado:", checkoutInfo);

      console.log("📝 [DEBUG] Setando checkoutData e orderData");
      setCheckoutData(checkoutInfo);
      setOrderData(order);

      console.log("🔍 [DEBUG] Verificando paymentMethod:", order.paymentMethod);

      // Definir método de pagamento padrão se estiver vazio ou inválido
      const validPaymentMethod = order.paymentMethod;
      if (
        validPaymentMethod &&
        (validPaymentMethod === "PIX" ||
          validPaymentMethod === "CREDIT_CARD" ||
          validPaymentMethod === "BOLETO")
      ) {
        setPaymentMethod(validPaymentMethod);
      }

      // Carregar tema personalizado e dados da loja
      if (injectedTheme) {
        // Modo preview: usar tema injetado
        setTheme({ ...DEFAULT_CHECKOUT_THEME, ...injectedTheme });
      } else if (order.userId) {
        try {
          const customData = await checkoutApi.loadCustomization(order.userId);
          if (customData?.theme) {
            setTheme({ ...DEFAULT_CHECKOUT_THEME, ...customData.theme });
          }
        } catch (e) {
          console.log("Usando tema padrão");
        }
      }

      // Buscar dados da loja para o rodapé
      if (order.userId) {
        try {
          const { data: userData, error: userError } = await supabase
            .from("User")
            .select("name, email, phone, cnpj, cpf, address")
            .eq("id", order.userId)
            .single();

          if (!userError && userData) {
            setStoreData({
              name: userData.name || "Minha Loja",
              email: userData.email || "contato@loja.com",
              phone: userData.phone || "(11) 99999-9999",
              cnpj: userData.cnpj,
              cpf: userData.cpf,
              address: userData.address || "São Paulo, SP - Brasil",
            });
          }
        } catch (e) {
          console.log("Erro ao carregar dados da loja:", e);
        }

        // Buscar order bumps ativos
        try {
          const { data: bumps, error: bumpsError } = await supabase
            .from("OrderBump")
            .select("*")
            .eq("userId", order.userId)
            .eq("isActive", true)
            .order("order", { ascending: true });

          if (!bumpsError && bumps) {
            setOrderBumps(bumps);
          }
        } catch (e) {
          console.log("Erro ao carregar order bumps:", e);
        }
      }
    } catch (error: any) {
      console.error("❌ [DEBUG] Erro ao carregar checkout:", error);
      console.error("❌ [DEBUG] Stack trace:", error.stack);
      toast({
        title: "Erro ao carregar checkout",
        description:
          error.message || "Não foi possível carregar os dados do pedido",
        variant: "destructive",
      });
    } finally {
      console.log("🏁 [DEBUG] loadCheckoutData finalizado");
      setLoading(false);
    }
  };

  // ============================================
  // NAVEGAÇÃO
  // ============================================

  // ============================================
  // ORDER BUMP
  // ============================================

  const handleToggleOrderBump = (orderBumpId: string) => {
    setSelectedOrderBumps((prev) => {
      if (prev.includes(orderBumpId)) {
        return prev.filter((id) => id !== orderBumpId);
      } else {
        return [...prev, orderBumpId];
      }
    });
  };

  const calculateOrderBumpsTotal = () => {
    return orderBumps
      .filter((bump) => selectedOrderBumps.includes(bump.id))
      .reduce((total, bump) => total + Number(bump.price || 0), 0);
  };

  const finalTotalWithBumps =
    (checkoutData?.total || 0) + calculateOrderBumpsTotal();

  // ============================================
  // NAVEGAÇÃO
  // ============================================

  const handleNext = () => {
    if (navigationSteps === 1) {
      // Se é 1 etapa, vai direto para pagamento
      handleSubmitPayment();
    } else {
      // 3 etapas normais
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        handleSubmitPayment();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const validateStep = (): boolean => {
    if (currentStep === 1) {
      if (
        !customerData.name ||
        !customerData.email ||
        !customerData.phone ||
        !customerData.document
      ) {
        toast({ title: "Preencha todos os campos", variant: "destructive" });
        return false;
      }
    }
    if (currentStep === 2) {
      if (
        !addressData.zipCode ||
        !addressData.street ||
        !addressData.number ||
        !addressData.city ||
        !addressData.state
      ) {
        toast({
          title: "Preencha o endereço completo",
          variant: "destructive",
        });
        return false;
      }
    }
    return true;
  };

  // ============================================
  // PROCESSAR PAGAMENTO
  // ============================================

  const handleSubmitPayment = async () => {
    if (!orderId || !checkoutData) return;

    setProcessing(true);

    try {
      // Atualizar pedido
      const { error: updateError } = await supabase
        .from("Order")
        .update({
          customerName: customerData.name,
          customerEmail: customerData.email,
          customerPhone: customerData.phone,
          customerCpf: getCPFNumbers(customerData.document),
          shippingAddress: addressData,
          paymentMethod: paymentMethod,
          updatedAt: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (updateError) throw updateError;

      // Buscar gateway configurado para o usuário
      const { data: gatewayConfigs } = await supabase
        .from("GatewayConfig")
        .select(
          `
          *,
          gateway:Gateway(*)
        `,
        )
        .eq("userId", orderData.userId)
        .eq("isActive", true);

      if (!gatewayConfigs || gatewayConfigs.length === 0) {
        throw new Error("Nenhum gateway de pagamento configurado");
      }

      // Filtrar gateway que suporta o método de pagamento
      let selectedConfig: any = null;
      for (const config of gatewayConfigs) {
        const gw = config.gateway;
        if (!gw) continue;

        // Priorizar gateway default
        const isDefault = config.isDefault || false;

        if (paymentMethod === "PIX" && gw.supportsPix) {
          selectedConfig = config;
          if (isDefault) break; // Se for default, usa e para
        } else if (paymentMethod === "CREDIT_CARD" && gw.supportsCreditCard) {
          selectedConfig = config;
          if (isDefault) break;
        } else if (paymentMethod === "BOLETO" && gw.supportsBoleto) {
          selectedConfig = config;
          if (isDefault) break;
        }
      }

      if (!selectedConfig) {
        throw new Error(`Gateway de ${paymentMethod} não configurado`);
      }

      // Criar transação
      const { data: transaction, error: transactionError } = await supabase
        .from("Transaction")
        .insert({
          orderId: orderId,
          gatewayId: selectedConfig.gatewayId,
          userId: orderData.userId,
          amount: checkoutData.total,
          status: "PENDING",
          paymentMethod: paymentMethod,
          metadata: {
            customerData,
            addressData,
            cardData: paymentMethod === "CREDIT_CARD" ? cardData : null,
          },
        })
        .select()
        .single();

      if (transactionError || !transaction) {
        throw new Error("Erro ao criar transação");
      }

      // Processar pagamento via Edge Function
      const { data: paymentResponse, error: paymentError } =
        await supabase.functions.invoke("process-payment", {
          body: {
            transactionId: transaction.id,
            gatewaySlug: selectedConfig.gateway.slug,
            paymentMethod: paymentMethod,
            amount: checkoutData.total,
            customerData,
            addressData,
            cardData: paymentMethod === "CREDIT_CARD" ? cardData : null,
          },
        });

      if (paymentError || !paymentResponse?.success) {
        throw new Error(
          paymentResponse?.error || "Erro ao processar pagamento",
        );
      }

      // Redirecionar conforme método
      if (paymentMethod === "PIX") {
        navigate(`/pix/${orderId}/${transaction.id}`);
      } else {
        navigate(`/checkout/success/${transaction.id}`);
      }
    } catch (error: any) {
      console.error("Erro ao processar pagamento:", error);
      toast({
        title: "Erro no pagamento",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  // ============================================
  // RENDER LOADING
  // ============================================

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#f9fafb" }}
      >
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando checkout...</p>
        </div>
      </div>
    );
  }

  // Verificações defensivas
  if (
    !checkoutData ||
    !checkoutData.products ||
    !Array.isArray(checkoutData.products)
  ) {
    console.error("❌ [DEBUG] checkoutData inválido:", checkoutData);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Pedido não encontrado</h2>
          <p className="text-gray-600 mb-6">
            Não foi possível carregar os dados do pedido.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER PRINCIPAL
  // ============================================

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: theme.backgroundColor || "#f9fafb" }}
    >
      {/* Notice Bar */}
      {theme.noticeBarEnabled && theme.noticeBarMessage && (
        <div
          className="py-3 px-4 text-center text-sm font-medium"
          style={{
            backgroundColor: theme.noticeBarBackgroundColor || "#8b5cf6",
            color: theme.noticeBarTextColor || "#ffffff",
          }}
        >
          {theme.noticeBarMessage}
        </div>
      )}

      {/* Logo */}
      {theme.showLogoAtTop && theme.logoUrl && (
        <div className="bg-white shadow-sm py-4">
          <div className="max-w-7xl mx-auto px-4 flex justify-center">
            <img
              src={theme.logoUrl}
              alt="Logo"
              className="h-10 object-contain"
            />
          </div>
        </div>
      )}

      {/* Banner */}
      {theme.bannerEnabled && theme.bannerUrl && (
        <div className="w-full overflow-hidden">
          <img
            src={theme.bannerUrl}
            alt="Banner"
            className="w-full object-cover"
            style={{ maxHeight: theme.bannerHeight || "200px" }}
          />
        </div>
      )}

      {/* Stepper - Apenas para 3 etapas */}
      {navigationSteps === 3 && (
        <ModernStepper currentStep={currentStep} theme={theme} />
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* FORMULÁRIO - 2/3 */}
          <div className="lg:col-span-2">
            <motion.div
              className="bg-white rounded-2xl shadow-lg p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Header */}
              <div className="mb-6">
                <h1
                  className="text-2xl font-bold mb-1"
                  style={{ color: theme.headingColor || "#111827" }}
                >
                  {navigationSteps === 1
                    ? "Finalizar Pedido"
                    : currentStep === 1
                      ? "Seus Dados"
                      : currentStep === 2
                        ? "Endereço"
                        : "Pagamento"}
                </h1>
                <p
                  className="text-sm"
                  style={{ color: theme.textColor || "#6b7280" }}
                >
                  Preencha as informações para continuar
                </p>
              </div>

              <AnimatePresence mode="wait">
                {/* ETAPA 1 - DADOS PESSOAIS */}
                {(navigationSteps === 1 || currentStep === 1) && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <CheckoutInput
                      label="Nome Completo"
                      type="text"
                      value={customerData.name}
                      onChange={(e) =>
                        setCustomerData({
                          ...customerData,
                          name: e.target.value,
                        })
                      }
                      theme={theme}
                      icon={<User className="w-5 h-5" />}
                      placeholder="Seu nome completo"
                      required
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <CheckoutInput
                        label="E-mail"
                        type="email"
                        value={customerData.email}
                        onChange={(e) =>
                          setCustomerData({
                            ...customerData,
                            email: e.target.value,
                          })
                        }
                        theme={theme}
                        icon={<Mail className="w-5 h-5" />}
                        placeholder="seu@email.com"
                        required
                      />
                      <CheckoutInput
                        label="Telefone"
                        type="tel"
                        value={customerData.phone}
                        onChange={(e) =>
                          setCustomerData({
                            ...customerData,
                            phone: e.target.value,
                          })
                        }
                        theme={theme}
                        icon={<Phone className="w-5 h-5" />}
                        placeholder="(11) 99999-9999"
                        mask="phone"
                        required
                      />
                    </div>
                    <CheckoutInput
                      label="CPF"
                      type="text"
                      value={customerData.document}
                      onChange={(e) =>
                        setCustomerData({
                          ...customerData,
                          document: e.target.value,
                        })
                      }
                      theme={theme}
                      icon={<Hash className="w-5 h-5" />}
                      placeholder="000.000.000-00"
                      mask="cpf"
                      required
                    />
                  </motion.div>
                )}

                {/* ETAPA 2 - ENDEREÇO */}
                {(navigationSteps === 1 || currentStep === 2) && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className={
                      navigationSteps === 1 ? "mt-6 space-y-4" : "space-y-4"
                    }
                  >
                    {navigationSteps === 1 && (
                      <h3 className="text-lg font-semibold mb-4">
                        Endereço de Entrega
                      </h3>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <CheckoutInput
                        label="CEP"
                        type="text"
                        value={addressData.zipCode}
                        onChange={(e) =>
                          setAddressData({
                            ...addressData,
                            zipCode: e.target.value,
                          })
                        }
                        theme={theme}
                        placeholder="00000-000"
                        mask="cep"
                        required
                      />
                      <div className="md:col-span-2">
                        <CheckoutInput
                          label="Rua"
                          type="text"
                          value={addressData.street}
                          onChange={(e) =>
                            setAddressData({
                              ...addressData,
                              street: e.target.value,
                            })
                          }
                          theme={theme}
                          placeholder="Nome da rua"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <CheckoutInput
                        label="Número"
                        type="text"
                        value={addressData.number}
                        onChange={(e) =>
                          setAddressData({
                            ...addressData,
                            number: e.target.value,
                          })
                        }
                        theme={theme}
                        placeholder="123"
                        required
                      />
                      <div className="col-span-1 md:col-span-3">
                        <CheckoutInput
                          label="Complemento"
                          type="text"
                          value={addressData.complement}
                          onChange={(e) =>
                            setAddressData({
                              ...addressData,
                              complement: e.target.value,
                            })
                          }
                          theme={theme}
                          placeholder="Apto, bloco..."
                        />
                      </div>
                    </div>
                    <CheckoutInput
                      label="Bairro"
                      type="text"
                      value={addressData.neighborhood}
                      onChange={(e) =>
                        setAddressData({
                          ...addressData,
                          neighborhood: e.target.value,
                        })
                      }
                      theme={theme}
                      placeholder="Seu bairro"
                      required
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <CheckoutInput
                        label="Cidade"
                        type="text"
                        value={addressData.city}
                        onChange={(e) =>
                          setAddressData({
                            ...addressData,
                            city: e.target.value,
                          })
                        }
                        theme={theme}
                        placeholder="Cidade"
                        required
                      />
                      <div>
                        <label
                          className="block text-sm font-medium mb-2"
                          style={{ color: theme.labelColor || "#111827" }}
                        >
                          Estado *
                        </label>
                        <select
                          value={addressData.state}
                          onChange={(e) =>
                            setAddressData({
                              ...addressData,
                              state: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                          style={{
                            backgroundColor:
                              theme.inputBackgroundColor || "#ffffff",
                            borderColor: theme.inputBorderColor || "#d1d5db",
                            borderRadius: `${theme.inputBorderRadius || 8}px`,
                            height: `${theme.inputHeight || 48}px`,
                            color: theme.textColor || "#111827",
                          }}
                        >
                          <option value="">Selecione</option>
                          <option value="SP">SP</option>
                          <option value="RJ">RJ</option>
                          <option value="MG">MG</option>
                          <option value="RS">RS</option>
                          <option value="SC">SC</option>
                          <option value="PR">PR</option>
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ETAPA 3 - PAGAMENTO */}
                {(navigationSteps === 1 || currentStep === 3) && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className={
                      navigationSteps === 1 ? "mt-6 space-y-4" : "space-y-4"
                    }
                  >
                    {navigationSteps === 1 && (
                      <h3 className="text-lg font-semibold mb-4">
                        Forma de Pagamento
                      </h3>
                    )}

                    {/* Seletor de Método */}
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={() => setPaymentMethod("PIX")}
                        className={`p-4 rounded-lg border-2 font-semibold transition ${
                          paymentMethod === "PIX"
                            ? "border-purple-600 bg-purple-50"
                            : "border-gray-200"
                        }`}
                      >
                        PIX
                      </button>
                      <button
                        onClick={() => setPaymentMethod("CREDIT_CARD")}
                        className={`p-4 rounded-lg border-2 font-semibold transition ${
                          paymentMethod === "CREDIT_CARD"
                            ? "border-purple-600 bg-purple-50"
                            : "border-gray-200"
                        }`}
                      >
                        Cartão
                      </button>
                      <button
                        onClick={() => setPaymentMethod("BOLETO")}
                        className={`p-4 rounded-lg border-2 font-semibold transition ${
                          paymentMethod === "BOLETO"
                            ? "border-purple-600 bg-purple-50"
                            : "border-gray-200"
                        }`}
                      >
                        Boleto
                      </button>
                    </div>

                    {/* Formulário de Cartão */}
                    {paymentMethod === "CREDIT_CARD" && (
                      <div className="space-y-4 mt-4">
                        <CheckoutInput
                          label="Número do Cartão"
                          type="text"
                          value={cardData.number}
                          onChange={(e) =>
                            setCardData({
                              ...cardData,
                              number: e.target.value,
                            })
                          }
                          theme={theme}
                          icon={<CreditCard className="w-5 h-5" />}
                          placeholder="0000 0000 0000 0000"
                          mask="card"
                          required
                        />
                        <CheckoutInput
                          label="Nome no Cartão"
                          type="text"
                          value={cardData.holderName}
                          onChange={(e) =>
                            setCardData({
                              ...cardData,
                              holderName: e.target.value,
                            })
                          }
                          theme={theme}
                          placeholder="Nome como está no cartão"
                          required
                        />
                        <div className="grid grid-cols-3 gap-4">
                          <CheckoutInput
                            label="Mês"
                            type="text"
                            value={cardData.expiryMonth}
                            onChange={(e) =>
                              setCardData({
                                ...cardData,
                                expiryMonth: e.target.value,
                              })
                            }
                            theme={theme}
                            placeholder="MM"
                            maxLength={2}
                            required
                          />
                          <CheckoutInput
                            label="Ano"
                            type="text"
                            value={cardData.expiryYear}
                            onChange={(e) =>
                              setCardData({
                                ...cardData,
                                expiryYear: e.target.value,
                              })
                            }
                            theme={theme}
                            placeholder="AA"
                            maxLength={2}
                            required
                          />
                          <CheckoutInput
                            label="CVV"
                            type="text"
                            value={cardData.cvv}
                            onChange={(e) =>
                              setCardData({
                                ...cardData,
                                cvv: e.target.value,
                              })
                            }
                            theme={theme}
                            placeholder="123"
                            maxLength={4}
                            required
                          />
                        </div>
                      </div>
                    )}

                    {paymentMethod === "PIX" && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                        <p className="text-sm text-green-800">
                          ✅ Após clicar em finalizar, você receberá o QR Code
                          do PIX
                        </p>
                      </div>
                    )}

                    {paymentMethod === "BOLETO" && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                        <p className="text-sm text-blue-800">
                          ℹ️ O boleto será gerado após a finalização
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ORDER BUMPS */}
              {theme.orderBumpEnabled && orderBumps.length > 0 && (
                <div className="mt-6 space-y-4">
                  <h3
                    className="text-xl font-bold mb-4"
                    style={{ color: theme.headingColor || "#111827" }}
                  >
                    🎁 Aproveite essa oferta especial!
                  </h3>
                  {orderBumps.map((bump) => (
                    <OrderBumpCard
                      key={bump.id}
                      orderBump={{
                        id: bump.id,
                        title: bump.title,
                        description: bump.description,
                        originalPrice: bump.originalPrice,
                        price: bump.price,
                        image: bump.image,
                        badge: bump.badge,
                        bullets: bump.bullets || [],
                      }}
                      theme={theme}
                      selected={selectedOrderBumps.includes(bump.id)}
                      onToggle={handleToggleOrderBump}
                    />
                  ))}
                </div>
              )}

              {/* BOTÕES DE NAVEGAÇÃO */}
              <div className="flex gap-4 mt-6">
                {navigationSteps === 3 && currentStep > 1 && (
                  <CheckoutButton
                    onClick={handleBack}
                    variant="secondary"
                    theme={theme}
                    icon={<ChevronLeft className="w-5 h-5" />}
                    iconPosition="left"
                    fullWidth
                  >
                    Voltar
                  </CheckoutButton>
                )}
                <CheckoutButton
                  onClick={handleNext}
                  disabled={processing}
                  loading={processing}
                  variant={
                    navigationSteps === 1 || currentStep === 3
                      ? "checkout"
                      : "primary"
                  }
                  theme={theme}
                  icon={
                    navigationSteps === 1 || currentStep === 3 ? (
                      <Lock className="w-5 h-5" />
                    ) : undefined
                  }
                  iconPosition="left"
                  fullWidth
                  size="lg"
                >
                  {navigationSteps === 1 || currentStep === 3
                    ? "Finalizar Compra"
                    : "Continuar"}
                </CheckoutButton>
              </div>

              {/* Trust Badges */}
              <div className="mt-6 pt-6 border-t flex items-center justify-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-green-600" />
                  <span>Compra Segura</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-green-600" />
                  <span>SSL Certificado</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* RESUMO DO PEDIDO - 1/3 */}
          <div className="lg:col-span-1">
            <motion.div
              className="bg-white rounded-2xl shadow-lg p-6 sticky top-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h2
                className="text-xl font-bold mb-4 flex items-center gap-2"
                style={{ color: theme.headingColor || "#111827" }}
              >
                <Package className="w-5 h-5" />
                Resumo do Pedido
              </h2>

              {/* Produtos */}
              <div className="space-y-3 mb-4">
                {checkoutData?.products
                  ?.filter((p) => p && p.name)
                  .map((product, index) => (
                    <div key={product?.id || index} className="flex gap-3">
                      <div className="w-16 h-16 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                        {product?.image ? (
                          <img
                            src={product.image}
                            alt={product?.name || "Produto"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate">
                          {product?.name || "Produto"}
                        </h4>
                        <p className="text-xs text-gray-500">
                          Qtd: {product?.quantity || 1}
                        </p>
                        <p className="text-sm font-bold text-gray-900 mt-1">
                          R${" "}
                          {(
                            (product?.price || 0) * (product?.quantity || 1)
                          ).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Divider */}
              <div className="border-t my-4" />

              {/* Totais */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">
                    R$ {checkoutData.subtotal.toFixed(2)}
                  </span>
                </div>
                {checkoutData.shipping > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Frete</span>
                    <span className="font-medium">
                      R$ {checkoutData.shipping.toFixed(2)}
                    </span>
                  </div>
                )}
                {checkoutData.discount && checkoutData.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Desconto</span>
                    <span className="font-medium">
                      - R$ {checkoutData.discount.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="border-t mt-4 pt-4">
                <div className="flex justify-between items-center">
                  <span
                    className="text-lg font-bold"
                    style={{ color: theme.headingColor || "#111827" }}
                  >
                    Total
                  </span>
                  <span
                    className="text-3xl font-bold"
                    style={{
                      color: theme.primaryButtonBackgroundColor || "#8b5cf6",
                    }}
                  >
                    R$ {finalTotalWithBumps.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Order Bumps no Resumo */}
              {selectedOrderBumps.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <h4
                    className="text-sm font-semibold mb-3"
                    style={{ color: theme.headingColor || "#111827" }}
                  >
                    Itens Adicionais
                  </h4>
                  {orderBumps
                    .filter((bump) => selectedOrderBumps.includes(bump.id))
                    .map((bump) => (
                      <div
                        key={bump.id}
                        className="flex justify-between text-sm mb-2"
                      >
                        <span className="text-gray-600">{bump.title}</span>
                        <span className="font-medium text-gray-900">
                          R$ {Number(bump.price || 0).toFixed(2)}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Footer Customizável */}
      <CheckoutFooter theme={theme} storeData={storeData} />
    </div>
  );
};

export default PublicCheckoutPageNovo;
