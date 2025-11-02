import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  CreditCard,
  Smartphone,
  FileText,
  CheckCircle,
  AlertCircle,
  Lock,
  ShieldCheck,
  Package,
  Truck,
  Check,
  X,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { checkoutApi } from "@/lib/api/checkoutApi";
import { formatCep, searchCep } from "@/lib/utils/cepUtils";
import {
  DEFAULT_CHECKOUT_THEME,
  applyTheme,
  generateCSSVariables,
} from "@/config/defaultCheckoutTheme";
import { cn } from "@/lib/utils";

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

  // ========================================
  // ESTADOS
  // ========================================
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [customization, setCustomization] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [loadingCep, setLoadingCep] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  // Form data
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

  // ========================================
  // TEMA
  // ========================================
  const theme = injectedTheme
    ? applyTheme(injectedTheme)
    : customization?.theme
    ? applyTheme(customization.theme)
    : DEFAULT_CHECKOUT_THEME;

  const cssVars = generateCSSVariables(theme);

  // ========================================
  // CARREGAR DADOS
  // ========================================
  useEffect(() => {
    if (effectiveOrderId) {
      loadCheckoutData();
    }
  }, [effectiveOrderId]);

  const loadCheckoutData = async () => {
    try {
      setLoading(true);

      // Buscar pedido no Supabase
      const { data: order, error: orderError } = await supabase
        .from("Order")
        .select("*")
        .eq("id", effectiveOrderId)
        .single();

      if (orderError || !order) {
        throw new Error("Pedido não encontrado");
      }

      // Montar dados do checkout
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
                  String(op.id) === String(item.id)))
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

      // Carregar personalização
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

  // ========================================
  // BUSCAR CEP
  // ========================================
  const handleCepSearch = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;

    setLoadingCep(true);
    try {
      const result = await searchCep(cleanCep);
      if (result) {
        setAddressData((prev) => ({
          ...prev,
          street: result.logradouro || "",
          neighborhood: result.bairro || "",
          city: result.localidade || "",
          state: result.uf || "",
        }));
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
    } finally {
      setLoadingCep(false);
    }
  };

  // ========================================
  // PROCESSAR PAGAMENTO
  // ========================================
  const handleCheckout = async () => {
    try {
      setProcessing(true);

      // Validações básicas
      if (currentStep === 1) {
        if (!customerData.name || !customerData.email || !customerData.phone) {
          toast({
            title: "Dados incompletos",
            description: "Preencha todos os campos obrigatórios",
            variant: "destructive",
          });
          return;
        }
        setCurrentStep(2);
        return;
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
            title: "Endereço incompleto",
            description: "Preencha todos os campos obrigatórios",
            variant: "destructive",
          });
          return;
        }
        setCurrentStep(3);
        return;
      }

      // Processar pagamento
      const { data, error } = await supabase.functions.invoke(
        "process-payment",
        {
          body: {
            orderId: effectiveOrderId,
            paymentMethod,
            customerData,
            addressData,
            installments: paymentMethod === "CREDIT_CARD" ? installments : 1,
          },
        }
      );

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Pedido confirmado!",
          description: "Redirecionando para confirmação...",
        });
        setTimeout(() => {
          navigate(`/checkout/success/${data.transactionId}`);
        }, 1500);
      } else {
        throw new Error(data?.error || "Erro ao processar pagamento");
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

  // ========================================
  // LOADING
  // ========================================
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: theme.backgroundColor }}
      >
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">Carregando checkout...</p>
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
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Pedido não encontrado. Verifique o link e tente novamente.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // ========================================
  // CALCULAR TOTAL DE STEPS
  // ========================================
  const totalSteps = theme.navigationSteps || 3;
  const steps = [
    { number: 1, label: "Dados", icon: Package },
    { number: 2, label: "Endereço", icon: Truck },
    { number: 3, label: "Pagamento", icon: CreditCard },
  ].slice(0, totalSteps);

  // ========================================
  // RENDER
  // ========================================
  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: theme.backgroundColor,
        color: theme.textColor,
        fontFamily: theme.fontFamily,
        ...cssVars,
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

      {/* CABEÇALHO */}
      <header
        className="sticky top-0 z-40 backdrop-blur-lg border-b"
        style={{
          backgroundColor: `${theme.backgroundColor}CC`,
          borderColor: theme.cardBorderColor,
        }}
      >
        <div className="container mx-auto px-4 py-4 max-w-6xl">
          <div
            className="flex items-center justify-between"
            style={{
              justifyContent:
                theme.logoAlignment === "center"
                  ? "center"
                  : theme.logoAlignment === "right"
                  ? "flex-end"
                  : "flex-start",
            }}
          >
            {theme.logoUrl ? (
              <img
                src={theme.logoUrl}
                alt="Logo"
                className="h-8 md:h-10 object-contain"
                style={{
                  maxWidth: theme.logoWidth || 180,
                  maxHeight: theme.logoHeight || 50,
                }}
              />
            ) : (
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-lg">Checkout Seguro</span>
              </div>
            )}

            {/* Botão resumo mobile */}
            <button
              onClick={() => setShowSummary(!showSummary)}
              className="lg:hidden flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg hover:bg-gray-100"
            >
              <Package className="h-4 w-4" />
              <span>
                {showSummary ? "Ocultar" : "Ver"} resumo
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* BANNER */}
      {theme.bannerEnabled && theme.bannerUrl && (
        <div className="w-full overflow-hidden">
          <img
            src={theme.bannerUrl}
            alt="Banner"
            className="w-full h-auto object-cover"
            style={{
              maxHeight: theme.bannerHeight || 200,
            }}
          />
        </div>
      )}

      {/* CONTEÚDO PRINCIPAL */}
      <main className="container mx-auto px-4 py-6 md:py-10 max-w-6xl">
        <div className="grid lg:grid-cols-[1fr,400px] gap-6 lg:gap-10">
          {/* COLUNA ESQUERDA - FORMULÁRIO */}
          <div className="space-y-6">
            {/* BARRA DE PROGRESSO */}
            {theme.showProgressBar && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  {steps.map((step, index) => (
                    <React.Fragment key={step.number}>
                      <div className="flex flex-col items-center flex-1">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all",
                            currentStep === step.number &&
                              "ring-4 ring-opacity-20",
                            currentStep > step.number
                              ? "bg-green-500 text-white"
                              : currentStep === step.number
                              ? "text-white"
                              : "bg-gray-200 text-gray-500"
                          )}
                          style={{
                            backgroundColor:
                              currentStep > step.number
                                ? theme.stepCompletedColor
                                : currentStep === step.number
                                ? theme.stepActiveColor
                                : theme.stepInactiveColor,
                            color:
                              currentStep >= step.number ? "#FFFFFF" : undefined,
                          }}
                        >
                          {currentStep > step.number ? (
                            <Check className="h-5 w-5" />
                          ) : (
                            step.number
                          )}
                        </div>
                        <span className="text-xs mt-2 font-medium hidden sm:block">
                          {step.label}
                        </span>
                      </div>
                      {index < steps.length - 1 && (
                        <div
                          className="h-0.5 flex-1 mx-2"
                          style={{
                            backgroundColor:
                              currentStep > step.number
                                ? theme.stepCompletedColor
                                : theme.stepInactiveColor,
                          }}
                        />
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {/* Progress bar */}
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ backgroundColor: theme.stepInactiveColor }}
                >
                  <div
                    className="h-full transition-all duration-500 ease-out"
                    style={{
                      backgroundColor: theme.progressBarColor,
                      width: `${(currentStep / totalSteps) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* STEP 1 - DADOS PESSOAIS */}
            {currentStep === 1 && (
              <Card
                style={{
                  backgroundColor: theme.cardBackgroundColor,
                  borderColor: theme.cardBorderColor,
                  borderRadius: theme.cardBorderRadius,
                }}
              >
                <CardContent className="p-6 space-y-5">
                  <div>
                    <h2
                      className="text-2xl font-bold mb-1"
                      style={{ color: theme.headingColor }}
                    >
                      Informações Pessoais
                    </h2>
                    <p className="text-sm opacity-75">
                      Preencha seus dados para continuar
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name" style={{ color: theme.labelColor }}>
                        Nome completo *
                      </Label>
                      <Input
                        id="name"
                        placeholder="Seu nome completo"
                        value={customerData.name}
                        onChange={(e) =>
                          setCustomerData({ ...customerData, name: e.target.value })
                        }
                        className="mt-1.5"
                        style={{
                          backgroundColor: theme.inputBackgroundColor,
                          borderColor: theme.inputBorderColor,
                          height: theme.inputHeight,
                          borderRadius: theme.inputBorderRadius,
                        }}
                      />
                    </div>

                    <div>
                      <Label htmlFor="email" style={{ color: theme.labelColor }}>
                        E-mail *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={customerData.email}
                        onChange={(e) =>
                          setCustomerData({ ...customerData, email: e.target.value })
                        }
                        className="mt-1.5"
                        style={{
                          backgroundColor: theme.inputBackgroundColor,
                          borderColor: theme.inputBorderColor,
                          height: theme.inputHeight,
                          borderRadius: theme.inputBorderRadius,
                        }}
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone" style={{ color: theme.labelColor }}>
                        Telefone/WhatsApp *
                      </Label>
                      <Input
                        id="phone"
                        placeholder="(11) 99999-9999"
                        value={customerData.phone}
                        onChange={(e) =>
                          setCustomerData({ ...customerData, phone: e.target.value })
                        }
                        className="mt-1.5"
                        style={{
                          backgroundColor: theme.inputBackgroundColor,
                          borderColor: theme.inputBorderColor,
                          height: theme.inputHeight,
                          borderRadius: theme.inputBorderRadius,
                        }}
                      />
                    </div>

                    {!theme.requestCpfOnlyAtPayment && (
                      <div>
                        <Label htmlFor="document" style={{ color: theme.labelColor }}>
                          CPF *
                        </Label>
                        <Input
                          id="document"
                          placeholder="000.000.000-00"
                          value={customerData.document}
                          onChange={(e) =>
                            setCustomerData({
                              ...customerData,
                              document: e.target.value,
                            })
                          }
                          className="mt-1.5"
                          style={{
                            backgroundColor: theme.inputBackgroundColor,
                            borderColor: theme.inputBorderColor,
                            height: theme.inputHeight,
                            borderRadius: theme.inputBorderRadius,
                          }}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* STEP 2 - ENDEREÇO */}
            {currentStep === 2 && (
              <Card
                style={{
                  backgroundColor: theme.cardBackgroundColor,
                  borderColor: theme.cardBorderColor,
                  borderRadius: theme.cardBorderRadius,
                }}
              >
                <CardContent className="p-6 space-y-5">
                  <div>
                    <h2
                      className="text-2xl font-bold mb-1"
                      style={{ color: theme.headingColor }}
                    >
                      Endereço de Entrega
                    </h2>
                    <p className="text-sm opacity-75">
                      Onde você quer receber seu pedido?
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="zipCode" style={{ color: theme.labelColor }}>
                        CEP *
                      </Label>
                      <div className="flex gap-2 mt-1.5">
                        <Input
                          id="zipCode"
                          placeholder="00000-000"
                          value={formatCep(addressData.zipCode)}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "");
                            setAddressData({ ...addressData, zipCode: value });
                            if (value.length === 8) {
                              handleCepSearch(value);
                            }
                          }}
                          className="flex-1"
                          style={{
                            backgroundColor: theme.inputBackgroundColor,
                            borderColor: theme.inputBorderColor,
                            height: theme.inputHeight,
                            borderRadius: theme.inputBorderRadius,
                          }}
                        />
                        {loadingCep && (
                          <div className="flex items-center px-3">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="street" style={{ color: theme.labelColor }}>
                        Rua *
                      </Label>
                      <Input
                        id="street"
                        placeholder="Nome da rua"
                        value={addressData.street}
                        onChange={(e) =>
                          setAddressData({ ...addressData, street: e.target.value })
                        }
                        className="mt-1.5"
                        style={{
                          backgroundColor: theme.inputBackgroundColor,
                          borderColor: theme.inputBorderColor,
                          height: theme.inputHeight,
                          borderRadius: theme.inputBorderRadius,
                        }}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="number" style={{ color: theme.labelColor }}>
                          Número *
                        </Label>
                        <Input
                          id="number"
                          placeholder="123"
                          value={addressData.number}
                          onChange={(e) =>
                            setAddressData({
                              ...addressData,
                              number: e.target.value,
                            })
                          }
                          className="mt-1.5"
                          style={{
                            backgroundColor: theme.inputBackgroundColor,
                            borderColor: theme.inputBorderColor,
                            height: theme.inputHeight,
                            borderRadius: theme.inputBorderRadius,
                          }}
                        />
                      </div>

                      <div>
                        <Label
                          htmlFor="complement"
                          style={{ color: theme.labelColor }}
                        >
                          Complemento
                        </Label>
                        <Input
                          id="complement"
                          placeholder="Apto 101"
                          value={addressData.complement}
                          onChange={(e) =>
                            setAddressData({
                              ...addressData,
                              complement: e.target.value,
                            })
                          }
                          className="mt-1.5"
                          style={{
                            backgroundColor: theme.inputBackgroundColor,
                            borderColor: theme.inputBorderColor,
                            height: theme.inputHeight,
                            borderRadius: theme.inputBorderRadius,
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <Label
                        htmlFor="neighborhood"
                        style={{ color: theme.labelColor }}
                      >
                        Bairro *
                      </Label>
                      <Input
                        id="neighborhood"
                        placeholder="Nome do bairro"
                        value={addressData.neighborhood}
                        onChange={(e) =>
                          setAddressData({
                            ...addressData,
                            neighborhood: e.target.value,
                          })
                        }
                        className="mt-1.5"
                        style={{
                          backgroundColor: theme.inputBackgroundColor,
                          borderColor: theme.inputBorderColor,
                          height: theme.inputHeight,
                          borderRadius: theme.inputBorderRadius,
                        }}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city" style={{ color: theme.labelColor }}>
                          Cidade *
                        </Label>
                        <Input
                          id="city"
                          placeholder="Cidade"
                          value={addressData.city}
                          onChange={(e) =>
                            setAddressData({ ...addressData, city: e.target.value })
                          }
                          className="mt-1.5"
                          style={{
                            backgroundColor: theme.inputBackgroundColor,
                            borderColor: theme.inputBorderColor,
                            height: theme.inputHeight,
                            borderRadius: theme.inputBorderRadius,
                          }}
                        />
                      </div>

                      <div>
                        <Label htmlFor="state" style={{ color: theme.labelColor }}>
                          Estado *
                        </Label>
                        <Input
                          id="state"
                          placeholder="UF"
                          maxLength={2}
                          value={addressData.state}
                          onChange={(e) =>
                            setAddressData({
                              ...addressData,
                              state: e.target.value.toUpperCase(),
                            })
                          }
                          className="mt-1.5"
                          style={{
                            backgroundColor: theme.inputBackgroundColor,
                            borderColor: theme.inputBorderColor,
                            height: theme.inputHeight,
                            borderRadius: theme.inputBorderRadius,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* STEP 3 - PAGAMENTO */}
            {currentStep === 3 && (
              <Card
                style={{
                  backgroundColor: theme.cardBackgroundColor,
                  borderColor: theme.cardBorderColor,
                  borderRadius: theme.cardBorderRadius,
                }}
              >
                <CardContent className="p-6 space-y-5">
                  <div>
                    <h2
                      className="text-2xl font-bold mb-1"
                      style={{ color: theme.headingColor }}
                    >
                      Método de Pagamento
                    </h2>
                    <p className="text-sm opacity-75">
                      Escolha como deseja pagar
                    </p>
                  </div>

                  <div className="grid gap-3">
                    {["PIX", "CREDIT_CARD", "BOLETO"].map((method) => (
                      <button
                        key={method}
                        onClick={() =>
                          setPaymentMethod(method as typeof paymentMethod)
                        }
                        className={cn(
                          "p-4 rounded-lg border-2 transition-all text-left flex items-center gap-3",
                          paymentMethod === method
                            ? "border-current shadow-lg"
                            : "border-gray-200 hover:border-gray-300"
                        )}
                        style={{
                          borderColor:
                            paymentMethod === method
                              ? theme.primaryButtonBackgroundColor
                              : theme.inputBorderColor,
                          backgroundColor:
                            paymentMethod === method
                              ? `${theme.primaryButtonBackgroundColor}10`
                              : theme.inputBackgroundColor,
                        }}
                      >
                        {method === "PIX" && <Smartphone className="h-5 w-5" />}
                        {method === "CREDIT_CARD" && (
                          <CreditCard className="h-5 w-5" />
                        )}
                        {method === "BOLETO" && <FileText className="h-5 w-5" />}
                        <div className="flex-1">
                          <div className="font-semibold">
                            {method === "PIX" && "PIX"}
                            {method === "CREDIT_CARD" && "Cartão de Crédito"}
                            {method === "BOLETO" && "Boleto Bancário"}
                          </div>
                          <div className="text-xs opacity-75">
                            {method === "PIX" && "Aprovação instantânea"}
                            {method === "CREDIT_CARD" && "Em até 12x sem juros"}
                            {method === "BOLETO" && "Vencimento em 3 dias"}
                          </div>
                        </div>
                        <div
