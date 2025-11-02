import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  User,
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
  // VALIDAÇÕES
  // ========================================
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

  // ========================================
  // NAVEGAÇÃO
  // ========================================
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

  // ========================================
  // PROCESSAR PAGAMENTO
  // ========================================
  const handleCheckout = async () => {
    if (!validateStep(currentStep)) return;

    try {
      setProcessing(true);

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
        },
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
          <Loader2
            className="h-12 w-12 animate-spin mx-auto mb-4"
            style={{ color: theme.primaryButtonBackgroundColor }}
          />
          <p style={{ color: theme.textColor }}>Carregando checkout...</p>
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
  const totalSteps = 3;
  const steps = [
    { number: 1, label: "Dados", icon: User },
    { number: 2, label: "Endereço", icon: Truck },
    { number: 3, label: "Pagamento", icon: CreditCard },
  ];

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
        className="border-b"
        style={{
          backgroundColor: theme.useGradient
            ? `linear-gradient(135deg, ${theme.backgroundColor}, ${theme.backgroundGradient})`
            : theme.backgroundColor,
          borderColor: theme.cardBorderColor,
        }}
      >
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          <div
            className={cn(
              "flex items-center",
              theme.logoAlignment === "center" && "justify-center",
              theme.logoAlignment === "right" && "justify-end",
              theme.logoAlignment === "left" && "justify-start",
            )}
          >
            {theme.logoUrl ? (
              <img
                src={theme.logoUrl}
                alt="Logo"
                className="h-10 object-contain"
                style={{
                  width: theme.logoWidth || "auto",
                  height: theme.logoHeight || 40,
                }}
              />
            ) : (
              <h1
                className="text-2xl font-bold"
                style={{ color: theme.headingColor }}
              >
                Checkout
              </h1>
            )}
          </div>
        </div>
      </header>

      {/* BANNER */}
      {theme.bannerEnabled && theme.bannerUrl && (
        <div className="w-full">
          <img
            src={theme.bannerUrl}
            alt="Banner"
            className="w-full object-cover"
            style={{ height: theme.bannerHeight || 90 }}
          />
        </div>
      )}

      {/* CONTEÚDO PRINCIPAL */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* BARRA DE PROGRESSO */}
        {theme.showProgressBar && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {steps.map((step, index) => (
                <React.Fragment key={step.number}>
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all",
                        currentStep > step.number && "scale-110",
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
                      }}
                    >
                      {currentStep > step.number ? (
                        <Check className="h-6 w-6" />
                      ) : (
                        <step.icon className="h-6 w-6" />
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
                      }}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* LAYOUT 2 COLUNAS */}
        <div className="grid lg:grid-cols-[1fr_400px] gap-8">
          {/* COLUNA ESQUERDA - FORMULÁRIO */}
          <div className="space-y-6">
            {/* STEP 1 - DADOS PESSOAIS */}
            {currentStep === 1 && (
              <Card
                style={{
                  backgroundColor: theme.cardBackgroundColor,
                  borderColor: theme.cardBorderColor,
                  borderRadius: theme.cardBorderRadius,
                  boxShadow: theme.cardShadow,
                }}
              >
                <CardContent className="p-6 space-y-5">
                  <div>
                    <h2
                      className="text-2xl font-bold mb-1"
                      style={{ color: theme.headingColor }}
                    >
                      Dados Pessoais
                    </h2>
                    <p className="text-sm opacity-75">
                      Preencha suas informações
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label
                        htmlFor="name"
                        style={{
                          color: theme.labelColor,
                          fontWeight: theme.labelFontWeight,
                        }}
                      >
                        Nome Completo *
                      </Label>
                      <Input
                        id="name"
                        placeholder="Seu nome completo"
                        value={customerData.name}
                        onChange={(e) =>
                          setCustomerData({
                            ...customerData,
                            name: e.target.value,
                          })
                        }
                        className="mt-1.5"
                        style={{
                          backgroundColor: theme.inputBackgroundColor,
                          borderColor: theme.inputBorderColor,
                          height: theme.inputHeight,
                          borderRadius: theme.inputBorderRadius,
                          color: theme.textColor,
                        }}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label
                          htmlFor="email"
                          style={{
                            color: theme.labelColor,
                            fontWeight: theme.labelFontWeight,
                          }}
                        >
                          E-mail *
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="seu@email.com"
                          value={customerData.email}
                          onChange={(e) =>
                            setCustomerData({
                              ...customerData,
                              email: e.target.value,
                            })
                          }
                          className="mt-1.5"
                          style={{
                            backgroundColor: theme.inputBackgroundColor,
                            borderColor: theme.inputBorderColor,
                            height: theme.inputHeight,
                            borderRadius: theme.inputBorderRadius,
                            color: theme.textColor,
                          }}
                        />
                      </div>

                      <div>
                        <Label
                          htmlFor="phone"
                          style={{
                            color: theme.labelColor,
                            fontWeight: theme.labelFontWeight,
                          }}
                        >
                          Telefone *
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="(11) 99999-9999"
                          value={customerData.phone}
                          onChange={(e) =>
                            setCustomerData({
                              ...customerData,
                              phone: e.target.value,
                            })
                          }
                          className="mt-1.5"
                          style={{
                            backgroundColor: theme.inputBackgroundColor,
                            borderColor: theme.inputBorderColor,
                            height: theme.inputHeight,
                            borderRadius: theme.inputBorderRadius,
                            color: theme.textColor,
                          }}
                        />
                      </div>
                    </div>

                    {theme.requestCpfOnlyAtPayment === false && (
                      <div>
                        <Label
                          htmlFor="document"
                          style={{
                            color: theme.labelColor,
                            fontWeight: theme.labelFontWeight,
                          }}
                        >
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
                            color: theme.textColor,
                          }}
                        />
                      </div>
                    )}

                    {theme.requestBirthDate && (
                      <div>
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
                          className="mt-1.5"
                          style={{
                            backgroundColor: theme.inputBackgroundColor,
                            borderColor: theme.inputBorderColor,
                            height: theme.inputHeight,
                            borderRadius: theme.inputBorderRadius,
                            color: theme.textColor,
                          }}
                        />
                      </div>
                    )}

                    {theme.requestGender && (
                      <div>
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
                            setCustomerData({
                              ...customerData,
                              gender: e.target.value,
                            })
                          }
                          className="w-full mt-1.5 px-3 rounded-lg"
                          style={{
                            backgroundColor: theme.inputBackgroundColor,
                            borderColor: theme.inputBorderColor,
                            height: theme.inputHeight,
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
                          <option value="prefiro_nao_dizer">
                            Prefiro não dizer
                          </option>
                        </select>
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
                  boxShadow: theme.cardShadow,
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
                      Informe onde deseja receber
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label
                        htmlFor="zipCode"
                        style={{
                          color: theme.labelColor,
                          fontWeight: theme.labelFontWeight,
                        }}
                      >
                        CEP *
                      </Label>
                      <div className="relative">
                        <Input
                          id="zipCode"
                          placeholder="00000-000"
                          value={addressData.zipCode}
                          onChange={(e) => {
                            const formatted = formatCep(e.target.value);
                            setAddressData({
                              ...addressData,
                              zipCode: formatted,
                            });
                            if (formatted.replace(/\D/g, "").length === 8) {
                              handleCepSearch(formatted);
                            }
                          }}
                          className="mt-1.5"
                          style={{
                            backgroundColor: theme.inputBackgroundColor,
                            borderColor: theme.inputBorderColor,
                            height: theme.inputHeight,
                            borderRadius: theme.inputBorderRadius,
                            color: theme.textColor,
                          }}
                        />
                        {loadingCep && (
                          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-[1fr_120px] gap-4">
                      <div>
                        <Label
                          htmlFor="street"
                          style={{
                            color: theme.labelColor,
                            fontWeight: theme.labelFontWeight,
                          }}
                        >
                          Rua *
                        </Label>
                        <Input
                          id="street"
                          placeholder="Nome da rua"
                          value={addressData.street}
                          onChange={(e) =>
                            setAddressData({
                              ...addressData,
                              street: e.target.value,
                            })
                          }
                          className="mt-1.5"
                          style={{
                            backgroundColor: theme.inputBackgroundColor,
                            borderColor: theme.inputBorderColor,
                            height: theme.inputHeight,
                            borderRadius: theme.inputBorderRadius,
                            color: theme.textColor,
                          }}
                        />
                      </div>

                      <div>
                        <Label
                          htmlFor="number"
                          style={{
                            color: theme.labelColor,
                            fontWeight: theme.labelFontWeight,
                          }}
                        >
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
                            color: theme.textColor,
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label
                          htmlFor="complement"
                          style={{
                            color: theme.labelColor,
                            fontWeight: theme.labelFontWeight,
                          }}
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
                            color: theme.textColor,
                          }}
                        />
                      </div>

                      <div>
                        <Label
                          htmlFor="neighborhood"
                          style={{
                            color: theme.labelColor,
                            fontWeight: theme.labelFontWeight,
                          }}
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
                            color: theme.textColor,
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-[1fr_100px] gap-4">
                      <div>
                        <Label
                          htmlFor="city"
                          style={{
                            color: theme.labelColor,
                            fontWeight: theme.labelFontWeight,
                          }}
                        >
                          Cidade *
                        </Label>
                        <Input
                          id="city"
                          placeholder="Cidade"
                          value={addressData.city}
                          onChange={(e) =>
                            setAddressData({
                              ...addressData,
                              city: e.target.value,
                            })
                          }
                          className="mt-1.5"
                          style={{
                            backgroundColor: theme.inputBackgroundColor,
                            borderColor: theme.inputBorderColor,
                            height: theme.inputHeight,
                            borderRadius: theme.inputBorderRadius,
                            color: theme.textColor,
                          }}
                        />
                      </div>

                      <div>
                        <Label
                          htmlFor="state"
                          style={{
                            color: theme.labelColor,
                            fontWeight: theme.labelFontWeight,
                          }}
                        >
                          UF *
                        </Label>
                        <Input
                          id="state"
                          placeholder="SP"
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
                            color: theme.textColor,
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
                  boxShadow: theme.cardShadow,
                }}
              >
                <CardContent className="p-6 space-y-5">
                  <div>
                    <h2
                      className="text-2xl font-bold mb-1"
                      style={{ color: theme.headingColor }}
                    >
                      Forma de Pagamento
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
                          "p-4 rounded-lg border-2 transition-all text-left flex items-center gap-4",
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
                        <div className="flex-1">
                          <div
                            className="font-semibold text-base mb-1"
                            style={{
                              color:
                                paymentMethod === method
                                  ? theme.primaryButtonBackgroundColor
                                  : theme.headingColor,
                            }}
                          >
                            {method === "PIX" && "PIX"}
                            {method === "CREDIT_CARD" && "Cartão de Crédito"}
                            {method === "BOLETO" && "Boleto Bancário"}
                          </div>
                          <div className="text-sm opacity-75">
                            {method === "PIX" && "Aprovação instantânea"}
                            {method === "CREDIT_CARD" && "Parcele em até 12x"}
                            {method === "BOLETO" && "Vencimento em 3 dias"}
                          </div>
                        </div>
                        {paymentMethod === method && (
                          <CheckCircle
                            className="h-6 w-6"
                            style={{ color: theme.stepCompletedColor }}
                          />
                        )}
                      </button>
                    ))}
                  </div>

                  {paymentMethod === "CREDIT_CARD" && checkoutData && (
                    <div>
                      <Label
                        htmlFor="installments"
                        style={{
                          color: theme.labelColor,
                          fontWeight: theme.labelFontWeight,
                        }}
                      >
                        Número de Parcelas
                      </Label>
                      <select
                        id="installments"
                        value={installments}
                        onChange={(e) =>
                          setInstallments(Number(e.target.value))
                        }
                        className="w-full mt-1.5 px-4 rounded-lg"
                        style={{
                          backgroundColor: theme.inputBackgroundColor,
                          borderColor: theme.inputBorderColor,
                          height: theme.inputHeight,
                          borderRadius: theme.inputBorderRadius,
                          borderWidth: 1,
                          borderStyle: "solid",
                          color: theme.textColor,
                        }}
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => {
                          const installmentValue = checkoutData.total / num;
                          return (
                            <option key={num} value={num}>
                              {num}x de R$ {installmentValue.toFixed(2)}
                              {num === 1 ? " à vista" : ""}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* BOTÕES DE NAVEGAÇÃO */}
            <div className="flex items-center justify-between gap-4 pt-2">
              {currentStep > 1 && (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex items-center gap-2 px-6"
                  style={{
                    borderColor: theme.inputBorderColor,
                    color: theme.textColor,
                    height: theme.inputHeight,
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Voltar
                </Button>
              )}

              <div className={cn("flex-1", currentStep === 1 && "ml-auto")}>
                {currentStep < totalSteps ? (
                  <Button
                    onClick={handleNext}
                    className="w-full flex items-center justify-center gap-2 font-semibold"
                    style={{
                      backgroundColor: theme.primaryButtonBackgroundColor,
                      color: theme.primaryButtonTextColor,
                      height: theme.inputHeight,
                      borderRadius: theme.primaryButtonBorderRadius,
                    }}
                  >
                    Continuar
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleCheckout}
                    disabled={processing || previewMode}
                    className="w-full font-bold text-lg"
                    style={{
                      backgroundColor: theme.checkoutButtonBackgroundColor,
                      color: theme.checkoutButtonTextColor,
                      height: theme.inputHeight + 12,
                      borderRadius: theme.checkoutButtonBorderRadius,
                      opacity: processing || previewMode ? 0.6 : 1,
                    }}
                  >
                    {processing ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Processando...
                      </>
                    ) : previewMode ? (
                      "Modo Pré-visualização"
                    ) : (
                      <>
                        <Lock className="h-5 w-5 mr-2" />
                        Finalizar Compra - R$ {checkoutData?.total.toFixed(2)}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA - RESUMO (DESKTOP) */}
          <div className="hidden lg:block">
            <div
              className="sticky top-8 rounded-xl border p-6 space-y-5"
              style={{
                backgroundColor: theme.cardBackgroundColor,
                borderColor: theme.cardBorderColor,
                borderRadius: theme.cardBorderRadius,
                boxShadow: theme.cardShadow,
              }}
            >
              <div>
                <h3
                  className="text-xl font-bold mb-4"
                  style={{ color: theme.headingColor }}
                >
                  Resumo do Pedido
                </h3>
              </div>

              {/* PRODUTOS */}
              <div className="space-y-4">
                {checkoutData.products.map((product, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div
                      className="relative flex-shrink-0 rounded-lg overflow-hidden"
                      style={{
                        width: 70,
                        height: 70,
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
                          <Package
                            className="h-8 w-8"
                            style={{ opacity: 0.3 }}
                          />
                        </div>
                      )}
                      {theme.showCartIcon && (
                        <div
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-md"
                          style={{
                            backgroundColor: theme.quantityCircleColor,
                            color: theme.quantityTextColor,
                          }}
                        >
                          {product.quantity}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4
                        className="font-semibold text-sm mb-1"
                        style={{ color: theme.headingColor }}
                      >
                        {product.name}
                      </h4>
                      {product.sku && (
                        <p className="text-xs opacity-60">SKU: {product.sku}</p>
                      )}
                      <p className="text-xs opacity-75 mt-1">
                        Quantidade: {product.quantity}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p
                        className="font-bold"
                        style={{ color: theme.headingColor }}
                      >
                        R$ {(product.price * product.quantity).toFixed(2)}
                      </p>
                      {product.quantity > 1 && (
                        <p className="text-xs opacity-60">
                          R$ {product.price.toFixed(2)} un.
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              {/* TOTAIS */}
              <div className="space-y-3">
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

                <Separator />

                <div className="flex justify-between text-xl font-bold pt-2">
                  <span style={{ color: theme.headingColor }}>Total</span>
                  <span style={{ color: theme.headingColor }}>
                    R$ {checkoutData.total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* SELOS DE SEGURANÇA */}
              {theme.showTrustBadges && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <ShieldCheck
                        className="h-5 w-5"
                        style={{ color: theme.trustBadgeColor }}
                      />
                      <span className="opacity-75">Compra 100% Segura</span>
                    </div>
                    {theme.sslBadgeEnabled && (
                      <div className="flex items-center gap-2 text-sm">
                        <Lock
                          className="h-5 w-5"
                          style={{ color: theme.trustBadgeColor }}
                        />
                        <span className="opacity-75">Certificado SSL</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* BOTÃO RESUMO MOBILE */}
        <div
          className="lg:hidden fixed bottom-0 left-0 right-0 p-4 border-t backdrop-blur-lg z-40"
          style={{
            backgroundColor: `${theme.cardBackgroundColor}F0`,
            borderColor: theme.cardBorderColor,
          }}
        >
          <Button
            onClick={() => setShowSummary(!showSummary)}
            className="w-full flex items-center justify-between"
            style={{
              backgroundColor: theme.primaryButtonBackgroundColor,
              color: theme.primaryButtonTextColor,
              height: theme.inputHeight,
            }}
          >
            <span className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {showSummary ? "Ocultar Resumo" : "Ver Resumo"}
            </span>
            <span className="font-bold">
              R$ {checkoutData.total.toFixed(2)}
            </span>
          </Button>
        </div>

        {/* MODAL RESUMO MOBILE */}
        {showSummary && (
          <div
            className="lg:hidden fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
            onClick={() => setShowSummary(false)}
          >
            <div
              className="absolute bottom-0 left-0 right-0 rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto"
              style={{
                backgroundColor: theme.cardBackgroundColor,
                color: theme.textColor,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3
                  className="text-2xl font-bold"
                  style={{ color: theme.headingColor }}
                >
                  Resumo do Pedido
                </h3>
                <button
                  onClick={() => setShowSummary(false)}
                  className="p-2 rounded-full hover:bg-gray-100/10 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* PRODUTOS */}
              <div className="space-y-4 mb-6">
                {checkoutData.products.map((product, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div
                      className="relative flex-shrink-0 rounded-lg overflow-hidden"
                      style={{
                        width: 70,
                        height: 70,
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
                          <Package className="h-8 w-8 opacity-30" />
                        </div>
                      )}
                      <div
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
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
                      <p className="text-xs opacity-75">
                        Qtd: {product.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">
                        R$ {(product.price * product.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="mb-4" />

              {/* TOTAIS */}
              <div className="space-y-3 mb-6">
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
                <Separator />
                <div className="flex justify-between text-xl font-bold pt-2">
                  <span style={{ color: theme.headingColor }}>Total</span>
                  <span style={{ color: theme.headingColor }}>
                    R$ {checkoutData.total.toFixed(2)}
                  </span>
                </div>
              </div>

              <Button
                onClick={() => setShowSummary(false)}
                className="w-full"
                style={{
                  backgroundColor: theme.primaryButtonBackgroundColor,
                  color: theme.primaryButtonTextColor,
                  height: theme.inputHeight,
                }}
              >
                Fechar
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* RODAPÉ */}
      <footer
        className="border-t py-10 mt-16"
        style={{
          backgroundColor: theme.footerBackgroundColor,
          borderColor: theme.cardBorderColor,
          color: theme.footerTextColor,
        }}
      >
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center space-y-6">
            {/* CHECKOUT SEGURO */}
            <div className="flex items-center justify-center gap-3">
              <Lock className="h-6 w-6 text-green-600" />
              <span className="font-bold text-xl">Checkout Seguro</span>
            </div>

            {/* SELOS */}
            {theme.showTrustBadges && (
              <div className="flex items-center justify-center gap-8 flex-wrap text-sm">
                {theme.sslBadgeEnabled && (
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-green-600" />
                    <span>Certificado SSL</span>
                  </div>
                )}
                {theme.showPaymentMethods && (
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    <span>Pagamento Seguro</span>
                  </div>
                )}
                {theme.securityIconsEnabled && (
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5" />
                    <span>Dados Protegidos</span>
                  </div>
                )}
              </div>
            )}

            {/* INFORMAÇÕES DA LOJA */}
            {(theme.showCnpjCpf ||
              theme.showContactEmail ||
              theme.showPhone ||
              theme.showAddress) && (
              <div className="text-sm space-y-1 opacity-80">
                {theme.showStoreName && (
                  <p className="font-semibold">Minha Loja</p>
                )}
                {theme.showCnpjCpf && <p>CNPJ: 00.000.000/0001-00</p>}
                {theme.showAddress && (
                  <p>Endereço: Rua Exemplo, 123 - São Paulo/SP</p>
                )}
                {theme.showContactEmail && <p>E-mail: contato@loja.com.br</p>}
                {theme.showPhone && <p>Telefone: (11) 99999-9999</p>}
              </div>
            )}

            {/* LINKS LEGAIS */}
            {(theme.showPrivacyPolicy ||
              theme.showTermsConditions ||
              theme.showReturns) && (
              <>
                <Separator className="my-4" />
                <div className="flex items-center justify-center gap-6 text-sm flex-wrap">
                  {theme.showPrivacyPolicy && (
                    <a
                      href="#"
                      style={{ color: theme.footerLinkColor }}
                      className="hover:underline transition-all"
                    >
                      Política de Privacidade
                    </a>
                  )}
                  {theme.showTermsConditions && (
                    <a
                      href="#"
                      style={{ color: theme.footerLinkColor }}
                      className="hover:underline transition-all"
                    >
                      Termos e Condições
                    </a>
                  )}
                  {theme.showReturns && (
                    <a
                      href="#"
                      style={{ color: theme.footerLinkColor }}
                      className="hover:underline transition-all"
                    >
                      Trocas e Devoluções
                    </a>
                  )}
                </div>
              </>
            )}

            <Separator className="my-4" />

            <p className="text-xs opacity-60">
              © {new Date().getFullYear()} - Todos os direitos reservados
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicCheckoutPage;
