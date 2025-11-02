import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Loader2,
  CreditCard,
  Smartphone,
  FileText,
  Lock,
  ShieldCheck,
  Package,
  Check,
  X,
  ChevronRight,
  ChevronLeft,
  User,
  Truck,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { checkoutApi } from "@/lib/api/checkoutApi";
import { formatCep, searchCep } from "@/lib/utils/cepUtils";
import { formatCpf, validateCpf } from "@/lib/utils/cpfUtils";
import { formatPhone, validatePhone } from "@/lib/utils/phoneUtils";
import {
  DEFAULT_CHECKOUT_THEME,
  applyTheme,
} from "@/config/defaultCheckoutTheme";
import { cn } from "@/lib/utils";

// ============================================
// INTERFACES
// ============================================

interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  sku?: string;
}

interface CheckoutData {
  orderId: string;
  products: Product[];
  total: number;
  subtotal: number;
  tax: number;
  shipping: number;
  discount?: number;
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

interface MobileCheckoutPageProps {
  injectedOrderId?: string;
  injectedTheme?: any;
  previewMode?: boolean;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

const MobileCheckoutPage: React.FC<MobileCheckoutPageProps> = ({
  injectedOrderId,
  injectedTheme,
  previewMode = false,
}) => {
  const { orderId } = useParams<{ orderId: string }>();
  const effectiveOrderId = injectedOrderId || orderId || null;
  const navigate = useNavigate();
  const { toast } = useToast();

  // Estados
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [orderData, setOrderData] = useState<any>(null);
  const [customization, setCustomization] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [loadingCep, setLoadingCep] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

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

  const [paymentMethod, setPaymentMethod] = useState<
    "CREDIT_CARD" | "PIX" | "BOLETO"
  >("PIX");
  const [installments, setInstallments] = useState(1);

  // Tema
  const theme = injectedTheme
    ? applyTheme(injectedTheme)
    : customization?.theme
      ? applyTheme(customization.theme)
      : DEFAULT_CHECKOUT_THEME;

  // Carregar dados
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
              (op?.variantId &&
                String(op.variantId) === String(item.variantId)) ||
              (op?.productId &&
                String(op.productId) === String(item.productId)) ||
              (op?.id &&
                (String(op.id) === String(item.productId) ||
                  String(op.id) === String(item.id))),
          );
          return {
            id: item.productId || item.id,
            name: item.name || original?.name || original?.title || "Produto",
            price: Number(item.price) || 0,
            quantity: Number(item.quantity) || 1,
            image:
              item.image ||
              original?.image ||
              (Array.isArray(original?.images) ? original.images[0] : "") ||
              "",
            sku: item.sku || original?.sku || "",
          };
        }),
        total: Number(order.total) || 0,
        subtotal: Number(order.subtotal) || 0,
        tax: Number(order.tax) || 0,
        shipping: Number(order.shipping) || 0,
        discount: Number(order.discount) || 0,
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

  const handleCepSearch = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;

    setLoadingCep(true);
    try {
      const result = await searchCep(cleanCep);
      if (result) {
        setAddressData((prev) => ({
          ...prev,
          street: result.street || "",
          neighborhood: result.neighborhood || "",
          city: result.city || "",
          state: result.state || "",
        }));
        toast({
          title: "CEP encontrado!",
          description: `${result.city} - ${result.state}`,
        });
      } else {
        toast({
          title: "CEP não encontrado",
          description: "Verifique o CEP digitado e tente novamente",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      toast({
        title: "Erro ao buscar CEP",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      });
    } finally {
      setLoadingCep(false);
    }
  };

  const validateStep = (step: number): boolean => {
    if (step === 1) {
      if (!customerData.name || !customerData.email || !customerData.phone) {
        toast({
          title: "Preencha todos os campos",
          description: "Nome, e-mail e telefone são obrigatórios",
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
      if (
        !addressData.zipCode ||
        !addressData.street ||
        !addressData.number ||
        !addressData.neighborhood ||
        !addressData.city ||
        !addressData.state
      ) {
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

  const handleCheckout = async () => {
    if (!validateStep(currentStep)) return;

    try {
      setProcessing(true);

      const { data, error } = await supabase.functions.invoke(
        "process-payment",
        {
          body: {
            userId: orderData?.userId,
            orderId: effectiveOrderId,
            amount: checkoutData?.total || 0,
            currency: "BRL",
            paymentMethod: paymentMethod.toLowerCase().replace("_", "_") as
              | "credit_card"
              | "debit_card"
              | "pix"
              | "boleto",
            customer: {
              name: customerData.name,
              email: customerData.email,
              document: customerData.document,
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
            installments: paymentMethod === "CREDIT_CARD" ? installments : 1,
          },
        },
      );

      console.log("🔍 [DEBUG] Resposta process-payment:", { data, error });

      // Edge Function sempre retorna status 200, verificar success
      if (!data?.success) {
        // Verificar se é erro de gateway não configurado
        if (data?.requiresSetup || data?.error === "NO_GATEWAY_CONFIGURED") {
          toast({
            title: "Gateway não configurado",
            description:
              data?.hint || "Configure um gateway de pagamento primeiro",
            variant: "destructive",
            duration: 10000,
          });
          setProcessing(false);
          return;
        }

        // Outros erros
        throw new Error(
          data?.message || data?.error || "Erro ao processar pagamento",
        );
      }

      // Tratar erro de rede
      if (error) throw error;

      if (data.success) {
        toast({
          title: "Pedido confirmado!",
          description: "Redirecionando...",
        });
        setTimeout(() => {
          navigate(`/checkout/success/${data.transactionId}`);
        }, 1500);
      }
    } catch (error: any) {
      console.error("Erro ao processar checkout:", error);
      toast({
        title: "Erro ao processar pagamento",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  // Loading
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: theme.backgroundColor }}
      >
        <div className="text-center">
          <Loader2
            className="h-10 w-10 animate-spin mx-auto mb-3"
            style={{ color: theme.primaryButtonBackgroundColor }}
          />
          <p style={{ color: theme.textColor }} className="text-sm">
            Carregando...
          </p>
        </div>
      </div>
    );
  }

  if (!checkoutData) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: theme.backgroundColor }}
      >
        <div className="text-center">
          <p style={{ color: theme.textColor }}>Pedido não encontrado</p>
        </div>
      </div>
    );
  }

  const steps = [
    { number: 1, label: "Dados", icon: User },
    { number: 2, label: "Entrega", icon: Truck },
    { number: 3, label: "Pagamento", icon: CreditCard },
  ];

  return (
    <div
      className="min-h-screen pb-32"
      style={{
        backgroundColor: theme.backgroundColor,
        color: theme.textColor,
        fontFamily: theme.fontFamily,
      }}
    >
      {/* BARRA DE AVISOS */}
      {theme.noticeBarEnabled && theme.noticeBarMessage && (
        <div
          className="py-3 px-4 text-center text-sm font-medium"
          style={{
            backgroundColor: theme.noticeBarBackgroundColor,
            color: theme.noticeBarTextColor,
          }}
        >
          {theme.noticeBarMessage}
        </div>
      )}

      {/* HEADER STICKY */}
      <header
        className="sticky top-0 z-30 backdrop-blur-lg border-b"
        style={{
          backgroundColor: `${theme.backgroundColor}F8`,
          borderColor: theme.cardBorderColor,
        }}
      >
        <div className="px-4 py-4">
          {theme.logoUrl && (
            <div
              className={cn(
                "flex",
                theme.logoAlignment === "center" && "justify-center",
              )}
            >
              <img
                src={theme.logoUrl}
                alt="Logo"
                className="h-8 object-contain"
                style={{ maxWidth: theme.logoWidth || 150 }}
              />
            </div>
          )}
        </div>
      </header>

      {/* BANNER */}
      {theme.bannerEnabled && theme.bannerImage && (
        <img
          src={theme.bannerImage}
          alt="Banner"
          className="w-full object-cover"
          style={{ height: theme.bannerHeight || 80 }}
        />
      )}

      {/* CONTEÚDO */}
      <main className="px-4 py-6">
        {/* BARRA DE PROGRESSO */}
        {theme.showProgressBar && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              {steps.map((step, index) => (
                <React.Fragment key={step.number}>
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all",
                        currentStep === step.number && "ring-2 ring-offset-2",
                      )}
                      style={{
                        backgroundColor:
                          currentStep > step.number
                            ? theme.stepCompletedColor
                            : currentStep === step.number
                              ? theme.stepActiveColor
                              : theme.stepInactiveColor,
                        color:
                          currentStep >= step.number
                            ? theme.primaryButtonTextColor
                            : theme.textColor,
                        ringColor: theme.stepActiveColor,
                        opacity: currentStep >= step.number ? 1 : 0.6,
                      }}
                    >
                      {currentStep > step.number ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <step.icon className="h-5 w-5" />
                      )}
                    </div>
                    <span
                      className="text-xs font-medium"
                      style={{
                        color:
                          currentStep >= step.number
                            ? theme.headingColor
                            : theme.textColor,
                        opacity: currentStep >= step.number ? 1 : 0.5,
                      }}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className="flex-1 h-1 mx-2 rounded-full transition-all"
                      style={{
                        backgroundColor:
                          currentStep > step.number
                            ? theme.stepCompletedColor
                            : theme.stepInactiveColor,
                        maxWidth: "60px",
                      }}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* RESUMO COMPACTO */}
        <div
          className="rounded-xl p-4 mb-6"
          style={{
            backgroundColor: theme.cardBackgroundColor,
            borderColor: theme.cardBorderColor,
            border: "1px solid",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3
              className="font-semibold text-sm"
              style={{ color: theme.headingColor }}
            >
              Seu Pedido
            </h3>
            <button
              onClick={() => setShowSummary(true)}
              className="text-xs underline"
              style={{ color: theme.primaryButtonBackgroundColor }}
            >
              Ver detalhes
            </button>
          </div>

          <div className="space-y-2.5">
            {checkoutData.products.map((product, index) => (
              <div key={index} className="flex items-center gap-2.5">
                <div
                  className="relative flex-shrink-0 rounded-lg overflow-hidden"
                  style={{
                    width: 48,
                    height: 48,
                    backgroundColor: theme.inputBackgroundColor,
                  }}
                >
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-5 w-5 opacity-30" />
                    </div>
                  )}
                  <div
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      backgroundColor: theme.quantityCircleColor,
                      color: theme.quantityTextColor,
                    }}
                  >
                    {product.quantity}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-xs truncate">
                    {product.name}
                  </h4>
                  <p className="text-xs opacity-75">
                    {product.quantity}x R$ {product.price.toFixed(2)}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p
                    className="font-bold text-sm"
                    style={{ color: theme.headingColor }}
                  >
                    R$ {(product.price * product.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div
            className="h-px my-3"
            style={{ backgroundColor: theme.cardBorderColor }}
          />

          <div className="flex items-center justify-between">
            <span
              className="text-sm font-semibold"
              style={{ color: theme.headingColor }}
            >
              Total
            </span>
            <span
              className="text-lg font-bold"
              style={{ color: theme.primaryButtonBackgroundColor }}
            >
              R$ {checkoutData.total.toFixed(2)}
            </span>
          </div>
        </div>

        {/* FORMULÁRIOS */}
        {/* STEP 1 - DADOS */}
        {currentStep === 1 && (
          <div
            className="rounded-xl p-5 space-y-4"
            style={{
              backgroundColor: theme.cardBackgroundColor,
              borderColor: theme.cardBorderColor,
              border: "1px solid",
            }}
          >
            <div>
              <h2
                className="text-lg font-bold mb-1"
                style={{ color: theme.headingColor }}
              >
                Seus Dados
              </h2>
              <p className="text-xs opacity-75">Preencha suas informações</p>
            </div>

            <div className="space-y-3.5">
              <div>
                <label
                  className="text-xs font-medium block mb-1.5"
                  style={{ color: theme.labelColor }}
                >
                  Nome Completo *
                </label>
                <input
                  type="text"
                  placeholder="Seu nome completo"
                  value={customerData.name}
                  onChange={(e) =>
                    setCustomerData({ ...customerData, name: e.target.value })
                  }
                  className="w-full px-4 rounded-lg text-base border"
                  style={{
                    backgroundColor: theme.inputBackgroundColor,
                    borderColor: theme.inputBorderColor,
                    color: theme.textColor,
                    height: 48,
                  }}
                />
              </div>

              <div>
                <label
                  className="text-xs font-medium block mb-1.5"
                  style={{ color: theme.labelColor }}
                >
                  E-mail *
                </label>
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={customerData.email}
                  onChange={(e) =>
                    setCustomerData({ ...customerData, email: e.target.value })
                  }
                  className="w-full px-4 rounded-lg text-base border"
                  style={{
                    backgroundColor: theme.inputBackgroundColor,
                    borderColor: theme.inputBorderColor,
                    color: theme.textColor,
                    height: 48,
                  }}
                />
              </div>

              <div>
                <label
                  className="text-xs font-medium block mb-1.5"
                  style={{ color: theme.labelColor }}
                >
                  Telefone *
                </label>
                <input
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={customerData.phone}
                  onChange={(e) => {
                    const formatted = formatPhone(e.target.value);
                    setCustomerData({ ...customerData, phone: formatted });
                  }}
                  onBlur={(e) => {
                    const validation = validatePhone(e.target.value);
                    if (e.target.value && !validation.valid) {
                      toast({
                        title: "Telefone inválido",
                        description: validation.message,
                        variant: "destructive",
                      });
                    }
                  }}
                  maxLength={15}
                  className="w-full px-4 rounded-lg text-base border"
                  style={{
                    backgroundColor: theme.inputBackgroundColor,
                    borderColor: theme.inputBorderColor,
                    color: theme.textColor,
                    height: 48,
                  }}
                />
              </div>

              {theme.requestCpfOnlyAtPayment === false && (
                <div>
                  <label
                    className="text-xs font-medium block mb-1.5"
                    style={{ color: theme.labelColor }}
                  >
                    CPF *
                  </label>
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    maxLength={14}
                    value={customerData.document}
                    onChange={(e) => {
                      const formatted = formatCpf(e.target.value);
                      setCustomerData({
                        ...customerData,
                        document: formatted,
                      });
                    }}
                    onBlur={(e) => {
                      const validation = validateCpf(e.target.value);
                      if (e.target.value && !validation.valid) {
                        toast({
                          title: "CPF inválido",
                          description: validation.message,
                          variant: "destructive",
                        });
                      }
                    }}
                    className="w-full px-4 rounded-lg text-base border"
                    style={{
                      backgroundColor: theme.inputBackgroundColor,
                      borderColor: theme.inputBorderColor,
                      color: theme.textColor,
                      height: 48,
                    }}
                  />
                </div>
              )}

              {theme.requestBirthDate && (
                <div>
                  <label
                    className="text-xs font-medium block mb-1.5"
                    style={{ color: theme.labelColor }}
                  >
                    Data de Nascimento
                  </label>
                  <input
                    type="date"
                    value={customerData.birthDate}
                    onChange={(e) =>
                      setCustomerData({
                        ...customerData,
                        birthDate: e.target.value,
                      })
                    }
                    className="w-full px-4 rounded-lg text-base border"
                    style={{
                      backgroundColor: theme.inputBackgroundColor,
                      borderColor: theme.inputBorderColor,
                      color: theme.textColor,
                      height: 48,
                    }}
                  />
                </div>
              )}

              {theme.requestGender && (
                <div>
                  <label
                    className="text-xs font-medium block mb-1.5"
                    style={{ color: theme.labelColor }}
                  >
                    Gênero
                  </label>
                  <select
                    value={customerData.gender}
                    onChange={(e) =>
                      setCustomerData({
                        ...customerData,
                        gender: e.target.value,
                      })
                    }
                    className="w-full px-4 rounded-lg text-base border"
                    style={{
                      backgroundColor: theme.inputBackgroundColor,
                      borderColor: theme.inputBorderColor,
                      color: theme.textColor,
                      height: 48,
                    }}
                  >
                    <option value="">Selecione...</option>
                    <option value="masculino">Masculino</option>
                    <option value="feminino">Feminino</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 2 - ENDEREÇO */}
        {currentStep === 2 && (
          <div
            className="rounded-xl p-5 space-y-4"
            style={{
              backgroundColor: theme.cardBackgroundColor,
              borderColor: theme.cardBorderColor,
              border: "1px solid",
            }}
          >
            <div>
              <h2
                className="text-lg font-bold mb-1"
                style={{ color: theme.headingColor }}
              >
                Endereço de Entrega
              </h2>
              <p className="text-xs opacity-75">Onde você quer receber</p>
            </div>

            <div className="space-y-3.5">
              <div>
                <label
                  className="text-xs font-medium block mb-1.5"
                  style={{ color: theme.labelColor }}
                >
                  CEP *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="00000-000"
                    value={addressData.zipCode}
                    onChange={(e) => {
                      const formatted = formatCep(e.target.value);
                      setAddressData({ ...addressData, zipCode: formatted });
                      if (formatted.replace(/\D/g, "").length === 8) {
                        handleCepSearch(formatted);
                      }
                    }}
                    className="w-full px-4 rounded-lg text-base border"
                    style={{
                      backgroundColor: theme.inputBackgroundColor,
                      borderColor: theme.inputBorderColor,
                      color: theme.textColor,
                      height: 48,
                    }}
                  />
                  {loadingCep && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-[1fr_100px] gap-2.5">
                <div>
                  <label
                    className="text-xs font-medium block mb-1.5"
                    style={{ color: theme.labelColor }}
                  >
                    Rua *
                  </label>
                  <input
                    type="text"
                    placeholder="Nome da rua"
                    value={addressData.street}
                    onChange={(e) =>
                      setAddressData({ ...addressData, street: e.target.value })
                    }
                    className="w-full px-4 rounded-lg text-base border"
                    style={{
                      backgroundColor: theme.inputBackgroundColor,
                      borderColor: theme.inputBorderColor,
                      color: theme.textColor,
                      height: 48,
                    }}
                  />
                </div>

                <div>
                  <label
                    className="text-xs font-medium block mb-1.5"
                    style={{ color: theme.labelColor }}
                  >
                    Nº *
                  </label>
                  <input
                    type="text"
                    placeholder="123"
                    value={addressData.number}
                    onChange={(e) =>
                      setAddressData({ ...addressData, number: e.target.value })
                    }
                    className="w-full px-4 rounded-lg text-base border"
                    style={{
                      backgroundColor: theme.inputBackgroundColor,
                      borderColor: theme.inputBorderColor,
                      color: theme.textColor,
                      height: 48,
                    }}
                  />
                </div>
              </div>

              <div>
                <label
                  className="text-xs font-medium block mb-1.5"
                  style={{ color: theme.labelColor }}
                >
                  Complemento
                </label>
                <input
                  type="text"
                  placeholder="Apto, bloco, etc"
                  value={addressData.complement}
                  onChange={(e) =>
                    setAddressData({
                      ...addressData,
                      complement: e.target.value,
                    })
                  }
                  className="w-full px-4 rounded-lg text-base border"
                  style={{
                    backgroundColor: theme.inputBackgroundColor,
                    borderColor: theme.inputBorderColor,
                    color: theme.textColor,
                    height: 48,
                  }}
                />
              </div>

              <div>
                <label
                  className="text-xs font-medium block mb-1.5"
                  style={{ color: theme.labelColor }}
                >
                  Bairro *
                </label>
                <input
                  type="text"
                  placeholder="Nome do bairro"
                  value={addressData.neighborhood}
                  onChange={(e) =>
                    setAddressData({
                      ...addressData,
                      neighborhood: e.target.value,
                    })
                  }
                  className="w-full px-4 rounded-lg text-base border"
                  style={{
                    backgroundColor: theme.inputBackgroundColor,
                    borderColor: theme.inputBorderColor,
                    color: theme.textColor,
                    height: 48,
                  }}
                />
              </div>

              <div className="grid grid-cols-[1fr_80px] gap-2.5">
                <div>
                  <label
                    className="text-xs font-medium block mb-1.5"
                    style={{ color: theme.labelColor }}
                  >
                    Cidade *
                  </label>
                  <input
                    type="text"
                    placeholder="Cidade"
                    value={addressData.city}
                    onChange={(e) =>
                      setAddressData({ ...addressData, city: e.target.value })
                    }
                    className="w-full px-4 rounded-lg text-base border"
                    style={{
                      backgroundColor: theme.inputBackgroundColor,
                      borderColor: theme.inputBorderColor,
                      color: theme.textColor,
                      height: 48,
                    }}
                  />
                </div>

                <div>
                  <label
                    className="text-xs font-medium block mb-1.5"
                    style={{ color: theme.labelColor }}
                  >
                    UF *
                  </label>
                  <input
                    type="text"
                    placeholder="SP"
                    maxLength={2}
                    value={addressData.state}
                    onChange={(e) =>
                      setAddressData({
                        ...addressData,
                        state: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full px-4 rounded-lg text-base border"
                    style={{
                      backgroundColor: theme.inputBackgroundColor,
                      borderColor: theme.inputBorderColor,
                      color: theme.textColor,
                      height: 48,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 - PAGAMENTO */}
        {currentStep === 3 && (
          <div
            className="rounded-xl p-5 space-y-4"
            style={{
              backgroundColor: theme.cardBackgroundColor,
              borderColor: theme.cardBorderColor,
              border: "1px solid",
            }}
          >
            <div>
              <h2
                className="text-lg font-bold mb-1"
                style={{ color: theme.headingColor }}
              >
                Forma de Pagamento
              </h2>
              <p className="text-xs opacity-75">Como deseja pagar</p>
            </div>

            <div className="space-y-3">
              {["PIX", "CREDIT_CARD", "BOLETO"].map((method) => (
                <button
                  key={method}
                  onClick={() =>
                    setPaymentMethod(method as typeof paymentMethod)
                  }
                  className={cn(
                    "w-full p-4 rounded-xl border-2 transition-all flex items-center gap-3",
                    paymentMethod === method && "shadow-lg",
                  )}
                  style={{
                    borderColor:
                      paymentMethod === method
                        ? theme.primaryButtonBackgroundColor
                        : theme.inputBorderColor,
                    backgroundColor:
                      paymentMethod === method
                        ? `${theme.primaryButtonBackgroundColor}15`
                        : theme.inputBackgroundColor,
                  }}
                >
                  {method === "PIX" && (
                    <Smartphone
                      className="h-6 w-6"
                      style={{
                        color:
                          paymentMethod === method
                            ? theme.primaryButtonBackgroundColor
                            : theme.textColor,
                      }}
                    />
                  )}
                  {method === "CREDIT_CARD" && (
                    <CreditCard
                      className="h-6 w-6"
                      style={{
                        color:
                          paymentMethod === method
                            ? theme.primaryButtonBackgroundColor
                            : theme.textColor,
                      }}
                    />
                  )}
                  {method === "BOLETO" && (
                    <FileText
                      className="h-6 w-6"
                      style={{
                        color:
                          paymentMethod === method
                            ? theme.primaryButtonBackgroundColor
                            : theme.textColor,
                      }}
                    />
                  )}
                  <div className="flex-1 text-left">
                    <div
                      className="font-semibold text-sm mb-0.5"
                      style={{
                        color:
                          paymentMethod === method
                            ? theme.primaryButtonBackgroundColor
                            : theme.headingColor,
                      }}
                    >
                      {method === "PIX" && "PIX"}
                      {method === "CREDIT_CARD" && "Cartão de Crédito"}
                      {method === "BOLETO" && "Boleto"}
                    </div>
                    <div className="text-xs opacity-75">
                      {method === "PIX" && "Aprovação instantânea"}
                      {method === "CREDIT_CARD" && "Parcele em até 12x"}
                      {method === "BOLETO" && "Vencimento em 3 dias"}
                    </div>
                  </div>
                  {paymentMethod === method && (
                    <Check
                      className="h-5 w-5"
                      style={{ color: theme.stepCompletedColor }}
                    />
                  )}
                </button>
              ))}
            </div>

            {paymentMethod === "CREDIT_CARD" && (
              <div>
                <label
                  className="text-xs font-medium block mb-1.5"
                  style={{ color: theme.labelColor }}
                >
                  Parcelas
                </label>
                <select
                  value={installments}
                  onChange={(e) => setInstallments(Number(e.target.value))}
                  className="w-full px-4 rounded-lg text-base border"
                  style={{
                    backgroundColor: theme.inputBackgroundColor,
                    borderColor: theme.inputBorderColor,
                    color: theme.textColor,
                    height: 48,
                  }}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => {
                    const value = checkoutData.total / num;
                    return (
                      <option key={num} value={num}>
                        {num}x R$ {value.toFixed(2)}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
          </div>
        )}

        {/* BOTÕES DE NAVEGAÇÃO */}
        <div className="flex items-center gap-3 mt-6">
          {currentStep > 1 && (
            <button
              onClick={handleBack}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 transition-all active:scale-95"
              style={{
                borderColor: theme.inputBorderColor,
                color: theme.textColor,
                backgroundColor: theme.inputBackgroundColor,
              }}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}

          <div className="flex-1">
            {currentStep < 3 ? (
              <button
                onClick={handleNext}
                className="w-full py-3 rounded-xl font-semibold text-base shadow-lg transition-all active:scale-98 flex items-center justify-center gap-2"
                style={{
                  backgroundColor: theme.primaryButtonBackgroundColor,
                  color: theme.primaryButtonTextColor,
                }}
              >
                Continuar
                <ChevronRight className="h-5 w-5" />
              </button>
            ) : (
              <button
                onClick={handleCheckout}
                disabled={processing || previewMode}
                className="w-full py-3.5 rounded-xl font-bold text-base shadow-lg transition-all active:scale-98 flex items-center justify-center gap-2"
                style={{
                  backgroundColor: theme.checkoutButtonBackgroundColor,
                  color: theme.checkoutButtonTextColor,
                  opacity: processing || previewMode ? 0.6 : 1,
                }}
              >
                {processing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Processando...
                  </>
                ) : previewMode ? (
                  "Modo Preview"
                ) : (
                  <>
                    <Lock className="h-5 w-5" />
                    Finalizar - R$ {checkoutData.total.toFixed(2)}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </main>

      {/* MODAL RESUMO DETALHADO */}
      {showSummary && (
        <div
          className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm animate-in fade-in"
          onClick={() => setShowSummary(false)}
        >
          <div
            className="absolute bottom-0 left-0 right-0 rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom"
            style={{
              backgroundColor: theme.cardBackgroundColor,
              color: theme.textColor,
              boxShadow: "0 -8px 32px rgba(0,0,0,0.12)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="flex justify-center mb-4">
              <div
                className="w-12 h-1.5 rounded-full opacity-30"
                style={{ backgroundColor: theme.textColor }}
              />
            </div>

            <div className="flex items-center justify-between mb-6">
              <h3
                className="text-xl font-bold"
                style={{ color: theme.headingColor }}
              >
                Resumo do Pedido
              </h3>
              <button
                onClick={() => setShowSummary(false)}
                className="p-2 rounded-full hover:bg-gray-100/10 transition-colors active:scale-95"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* PRODUTOS */}
            <div className="space-y-3.5 mb-5">
              {checkoutData.products.map((product, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div
                    className="relative flex-shrink-0 rounded-lg overflow-hidden"
                    style={{
                      width: 64,
                      height: 64,
                      backgroundColor: theme.inputBackgroundColor,
                    }}
                  >
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-7 w-7 opacity-30" />
                      </div>
                    )}
                    <div
                      className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-md"
                      style={{
                        backgroundColor: theme.quantityCircleColor,
                        color: theme.quantityTextColor,
                      }}
                    >
                      {product.quantity}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm mb-1">
                      {product.name}
                    </h4>
                    {product.sku && (
                      <p className="text-xs opacity-60 mb-1">
                        SKU: {product.sku}
                      </p>
                    )}
                    <p className="text-xs opacity-75">
                      {product.quantity}x R$ {product.price.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className="font-bold text-sm"
                      style={{ color: theme.headingColor }}
                    >
                      R$ {(product.price * product.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div
              className="h-px mb-4"
              style={{ backgroundColor: theme.cardBorderColor }}
            />

            {/* TOTAIS */}
            <div className="space-y-2.5 mb-6">
              <div className="flex justify-between text-sm">
                <span className="opacity-75">Subtotal</span>
                <span className="font-medium">
                  R$ {checkoutData.subtotal.toFixed(2)}
                </span>
              </div>
              {checkoutData.shipping > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="opacity-75">Frete</span>
                  <span className="font-medium">
                    R$ {checkoutData.shipping.toFixed(2)}
                  </span>
                </div>
              )}
              {checkoutData.tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="opacity-75">Taxa</span>
                  <span className="font-medium">
                    R$ {checkoutData.tax.toFixed(2)}
                  </span>
                </div>
              )}
              {checkoutData.discount && checkoutData.discount > 0 && (
                <div
                  className="flex justify-between text-sm font-medium"
                  style={{ color: theme.stepCompletedColor }}
                >
                  <span>Desconto</span>
                  <span>-R$ {checkoutData.discount.toFixed(2)}</span>
                </div>
              )}
              <div
                className="h-px"
                style={{ backgroundColor: theme.cardBorderColor }}
              />
              <div className="flex justify-between text-lg font-bold pt-2">
                <span style={{ color: theme.headingColor }}>Total</span>
                <span style={{ color: theme.headingColor }}>
                  R$ {checkoutData.total.toFixed(2)}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowSummary(false)}
              className="w-full py-3 rounded-xl font-semibold text-base shadow-lg transition-all active:scale-98"
              style={{
                backgroundColor: theme.primaryButtonBackgroundColor,
                color: theme.primaryButtonTextColor,
              }}
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* RODAPÉ */}
      <footer
        className="border-t py-8 mt-12"
        style={{
          backgroundColor: theme.footerBackgroundColor,
          borderColor: theme.cardBorderColor,
          color: theme.footerTextColor,
        }}
      >
        <div className="px-4">
          <div className="text-center space-y-4">
            {/* CHECKOUT SEGURO */}
            <div className="flex items-center justify-center gap-2">
              <Lock className="h-5 w-5 text-green-600" />
              <span className="font-bold text-base">Checkout Seguro</span>
            </div>

            {/* SELOS */}
            {theme.showTrustBadges && (
              <div className="flex items-center justify-center gap-4 flex-wrap text-xs">
                {theme.sslBadgeEnabled && (
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-green-600" />
                    <span>SSL Seguro</span>
                  </div>
                )}
                {theme.showPaymentMethods && (
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="h-4 w-4" />
                    <span>Pagamento Seguro</span>
                  </div>
                )}
              </div>
            )}

            {/* INFORMAÇÕES */}
            {(theme.showCnpjCpf ||
              theme.showContactEmail ||
              theme.showPhone) && (
              <div className="text-xs space-y-1 opacity-80">
                {theme.showStoreName && (
                  <p className="font-semibold text-sm">Minha Loja</p>
                )}
                {theme.showCnpjCpf && <p>CNPJ: 00.000.000/0001-00</p>}
                {theme.showContactEmail && <p>contato@loja.com.br</p>}
                {theme.showPhone && <p>(11) 99999-9999</p>}
              </div>
            )}

            {/* LINKS */}
            {(theme.showPrivacyPolicy ||
              theme.showTermsConditions ||
              theme.showReturns) && (
              <>
                <div
                  className="h-px mx-auto w-24"
                  style={{ backgroundColor: theme.cardBorderColor }}
                />
                <div className="flex items-center justify-center gap-3 text-xs flex-wrap">
                  {theme.showPrivacyPolicy && (
                    <a
                      href="#"
                      style={{ color: theme.footerLinkColor }}
                      className="underline"
                    >
                      Privacidade
                    </a>
                  )}
                  {theme.showTermsConditions && (
                    <a
                      href="#"
                      style={{ color: theme.footerLinkColor }}
                      className="underline"
                    >
                      Termos
                    </a>
                  )}
                  {theme.showReturns && (
                    <a
                      href="#"
                      style={{ color: theme.footerLinkColor }}
                      className="underline"
                    >
                      Trocas
                    </a>
                  )}
                </div>
              </>
            )}

            <p className="text-xs opacity-60 pt-2">
              © {new Date().getFullYear()} - Todos os direitos reservados
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MobileCheckoutPage;
