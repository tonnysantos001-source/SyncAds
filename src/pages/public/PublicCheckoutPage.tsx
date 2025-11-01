import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Truck,
  ShieldCheck,
  Package,
  Award,
  Check,
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

const PublicCheckoutPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [customization, setCustomization] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [loadingCep, setLoadingCep] = useState(false);

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

  useEffect(() => {
    if (orderId) {
      loadCheckoutData();
    }
  }, [orderId]);

  const loadCheckoutData = async () => {
    try {
      setLoading(true);

      // Buscar dados reais do carrinho do localStorage
      const cartData = localStorage.getItem("syncads_cart");

      if (!cartData || cartData === "[]") {
        // Se não houver carrinho, mostrar erro
        console.error("Nenhum produto no carrinho");
        toast({
          title: "Carrinho vazio",
          description: "Adicione produtos ao carrinho antes de finalizar",
          variant: "destructive",
        });
        setCheckoutData(null);
        setLoading(false);
        return;
      }

      const items = JSON.parse(cartData);

      if (items.length === 0) {
        console.error("Carrinho vazio");
        toast({
          title: "Carrinho vazio",
          description: "Adicione produtos ao carrinho antes de finalizar",
          variant: "destructive",
        });
        setCheckoutData(null);
        setLoading(false);
        return;
      }

      // Calcular totais reais
      const subtotal = items.reduce(
        (sum: number, item: any) => sum + item.price * item.quantity,
        0,
      );

      const realData: CheckoutData = {
        orderId: orderId!,
        products: items.map((item: any) => ({
          id: item.productId || item.variantId || item.id,
          name: item.name || item.title,
          price: item.price,
          quantity: item.quantity,
          image: item.image || "",
          sku: item.sku || "",
        })),
        total: subtotal,
        subtotal,
        tax: 0,
        shipping: 0,
        discount: 0,
      };

      console.log("✅ Produtos do carrinho carregados:", realData);
      setCheckoutData(realData);

      // Carregar personalização do checkout
      try {
        const customData =
          await checkoutApi.loadCustomization("default-org-id");
        setCustomization(customData);
      } catch (error) {
        console.log("Usando tema padrão profissional");
        // Aplicar tema padrão completo
        setCustomization({
          theme: DEFAULT_CHECKOUT_THEME,
        });
      }
    } catch (error) {
      console.error("Erro ao carregar dados do checkout:", error);
      toast({
        title: "Erro ao carregar checkout",
        description: "Não foi possível carregar os dados do pedido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = formatCep(value);

    setAddressData((prev) => ({ ...prev, zipCode: formatted }));

    if (formatted.replace(/\D/g, "").length === 8) {
      setLoadingCep(true);
      try {
        const address = await searchCep(formatted);
        if (address) {
          setAddressData((prev) => ({
            ...prev,
            street: address.street,
            neighborhood: address.neighborhood,
            city: address.city,
            state: address.state,
            zipCode: address.zipCode,
          }));

          setTimeout(() => {
            document.getElementById("number")?.focus();
          }, 100);

          toast({
            title: "✅ CEP encontrado!",
            description: "Endereço preenchido automaticamente",
          });
        } else {
          toast({
            title: "CEP não encontrado",
            description: "Verifique o CEP ou preencha manualmente",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
        toast({
          title: "Erro ao buscar CEP",
          description: "Tente novamente",
          variant: "destructive",
        });
      } finally {
        setLoadingCep(false);
      }
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      // Validar dados do cliente
      if (!customerData.name || !customerData.email || !customerData.phone) {
        toast({
          title: "Dados incompletos",
          description: "Preencha todos os campos obrigatórios",
          variant: "destructive",
        });
        return;
      }
    }

    if (currentStep === 2) {
      // Validar endereço
      if (
        !addressData.street ||
        !addressData.number ||
        !addressData.neighborhood ||
        !addressData.city ||
        !addressData.state ||
        !addressData.zipCode
      ) {
        toast({
          title: "Endereço incompleto",
          description: "Preencha todos os campos do endereço",
          variant: "destructive",
        });
        return;
      }
    }

    setCurrentStep((prev) => prev + 1);
  };

  const handlePreviousStep = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handlePayment = async () => {
    if (!checkoutData) return;

    setProcessing(true);
    try {
      // Processar pagamento
      const paymentData = {
        orderId: checkoutData.orderId,
        gatewayId: "default-gateway", // Usar gateway padrão
        paymentMethod,
        amount: checkoutData.total,
        currency: "BRL",
        customerData,
        billingAddress: addressData,
        installments,
        metadata: {
          source: "public-checkout",
          products: checkoutData.products,
        },
      };

      const { data, error } = await supabase.functions.invoke(
        "process-payment",
        {
          body: paymentData,
        },
      );

      if (error) {
        throw new Error(error.message);
      }

      if (data.success) {
        toast({
          title: "Pagamento processado!",
          description: "Seu pagamento foi processado com sucesso",
          variant: "default",
        });

        // Redirecionar para página de sucesso
        navigate(`/checkout/success/${data.data.transactionId}`);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Erro no pagamento:", error);
      toast({
        title: "Erro no pagamento",
        description: (error as any).message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <Loader2 className="h-16 w-16 animate-spin mx-auto mb-4 text-purple-600" />
            <div className="absolute inset-0 blur-xl bg-purple-400 opacity-20 animate-pulse" />
          </div>
          <p className="text-gray-700 font-semibold text-lg">
            Carregando checkout seguro...
          </p>
          <p className="text-gray-500 text-sm mt-2">Aguarde um momento</p>
        </div>
      </div>
    );
  }

  if (!checkoutData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-10 w-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-gray-900">
              Pedido não encontrado
            </h2>
            <p className="text-gray-600 mb-6">
              O pedido solicitado não foi encontrado ou expirou.
            </p>
            <Button
              onClick={() => navigate("/")}
              className="w-full h-12 text-base font-semibold"
            >
              Voltar ao início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const theme = applyTheme(customization?.theme);
  const cssVars = generateCSSVariables(theme);

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{
        backgroundColor: theme.backgroundColor,
        fontFamily: theme.fontFamily,
        ...(cssVars as any),
      }}
    >
      {/* Barra de Avisos */}
      {theme.noticeBarEnabled && theme.noticeBarMessage && (
        <div
          className="w-full py-3 px-4 text-center text-sm font-medium"
          style={{
            backgroundColor: theme.noticeBarBackgroundColor,
            color: theme.noticeBarTextColor,
            animation: theme.noticeBarAnimation ? "pulse 2s infinite" : "none",
          }}
        >
          {theme.noticeBarMessage}
        </div>
      )}

      {/* Header Moderno */}
      <div className="bg-white/95 backdrop-blur-lg border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${theme.primaryButtonBackgroundColor} 0%, ${theme.checkoutButtonBackgroundColor} 100%)`,
                }}
              >
                <Lock className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1
                  className="text-xl md:text-2xl font-bold tracking-tight"
                  style={{ color: theme.headingColor }}
                >
                  Checkout Seguro
                </h1>
                {theme.showTrustBadges && (
                  <p
                    className="text-xs hidden sm:block"
                    style={{ color: theme.footerTextColor }}
                  >
                    Seus dados estão protegidos 🔒
                  </p>
                )}
              </div>
            </div>

            {/* Progress Steps - Desktop */}
            <div className="hidden lg:flex items-center gap-3">
              {[
                { num: 1, label: "Dados", icon: Package },
                { num: 2, label: "Entrega", icon: Truck },
                { num: 3, label: "Pagamento", icon: CreditCard },
              ].map((step, idx) => (
                <React.Fragment key={step.num}>
                  <div className="flex items-center gap-3">
                    <div
                      className={`relative w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                        currentStep > step.num
                          ? "shadow-lg scale-110"
                          : currentStep === step.num
                            ? "shadow-lg scale-110 animate-bounce"
                            : ""
                      }`}
                      style={{
                        backgroundColor:
                          currentStep > step.num
                            ? theme.stepCompletedColor
                            : currentStep === step.num
                              ? theme.stepActiveColor
                              : theme.stepInactiveColor,
                        color: currentStep >= step.num ? "#FFFFFF" : "#9CA3AF",
                      }}
                    >
                      {currentStep > step.num ? (
                        <Check className="h-6 w-6" />
                      ) : (
                        <step.icon className="h-6 w-6" />
                      )}
                      {currentStep === step.num && (
                        <div
                          className="absolute inset-0 rounded-xl opacity-50 animate-ping"
                          style={{ backgroundColor: theme.stepActiveColor }}
                        />
                      )}
                    </div>
                    <div>
                      <p
                        className={`text-xs font-medium`}
                        style={{
                          color:
                            currentStep >= step.num
                              ? theme.stepActiveColor
                              : theme.stepInactiveColor,
                        }}
                      >
                        Etapa {step.num}
                      </p>
                      <p
                        className={`text-sm font-bold`}
                        style={{
                          color:
                            currentStep >= step.num
                              ? theme.headingColor
                              : theme.stepInactiveColor,
                        }}
                      >
                        {step.label}
                      </p>
                    </div>
                  </div>
                  {idx < 2 && theme.showProgressBar && (
                    <div
                      className="relative w-16 h-1 rounded-full overflow-hidden"
                      style={{ backgroundColor: theme.stepInactiveColor }}
                    >
                      <div
                        className="absolute top-0 left-0 h-full transition-all duration-700"
                        style={{
                          width: currentStep > step.num ? "100%" : "0%",
                          backgroundColor: theme.progressBarColor,
                        }}
                      />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Progress - Mobile */}
            <div className="lg:hidden">
              <div className="text-right">
                <p
                  className="text-sm font-bold"
                  style={{ color: theme.primaryButtonBackgroundColor }}
                >
                  Etapa {currentStep} de {theme.navigationSteps}
                </p>
                <p className="text-xs" style={{ color: theme.footerTextColor }}>
                  {currentStep === 1
                    ? "Dados"
                    : currentStep === 2
                      ? "Entrega"
                      : "Pagamento"}
                </p>
              </div>
            </div>
          </div>

          {/* Progress Bar - Mobile */}
          {theme.showProgressBar && (
            <div className="mt-4 lg:hidden">
              <div
                className="w-full h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: theme.stepInactiveColor }}
              >
                <div
                  className="h-2 rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${(currentStep / theme.navigationSteps) * 100}%`,
                    backgroundColor: theme.progressBarColor,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Formulário Principal */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    currentStep >= 1
                      ? "bg-blue-600 text-white"
                      : "bg-gray-300 text-gray-600"
                  }`}
                >
                  1
                </div>
                <span className="text-sm">Dados</span>
              </div>
              <div className="w-8 h-px bg-gray-300"></div>
              <div className="flex items-center gap-1">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    currentStep >= 2
                      ? "bg-blue-600 text-white"
                      : "bg-gray-300 text-gray-600"
                  }`}
                >
                  2
                </div>
                <span className="text-sm">Endereço</span>
              </div>
              <div className="w-8 h-px bg-gray-300"></div>
              <div className="flex items-center gap-1">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    currentStep >= 3
                      ? "bg-blue-600 text-white"
                      : "bg-gray-300 text-gray-600"
                  }`}
                >
                  3
                </div>
                <span className="text-sm">Pagamento</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>Informações Pessoais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome completo *</Label>
                    <Input
                      id="name"
                      value={customerData.name}
                      onChange={(e) =>
                        setCustomerData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Seu nome completo"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">E-mail *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={customerData.email}
                      onChange={(e) =>
                        setCustomerData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      placeholder="seu@email.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Telefone/WhatsApp *</Label>
                    <Input
                      id="phone"
                      value={customerData.phone}
                      onChange={(e) =>
                        setCustomerData((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      placeholder="(11) 99999-9999"
                    />
                  </div>

                  <div>
                    <Label htmlFor="document">CPF</Label>
                    <Input
                      id="document"
                      value={customerData.document}
                      onChange={(e) =>
                        setCustomerData((prev) => ({
                          ...prev,
                          document: e.target.value,
                        }))
                      }
                      placeholder="000.000.000-00"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle>Endereço de Entrega</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="street">Rua/Avenida *</Label>
                      <Input
                        id="street"
                        value={addressData.street}
                        onChange={(e) =>
                          setAddressData((prev) => ({
                            ...prev,
                            street: e.target.value,
                          }))
                        }
                        placeholder="Nome da rua"
                      />
                    </div>

                    <div>
                      <Label htmlFor="number">Número *</Label>
                      <Input
                        id="number"
                        value={addressData.number}
                        onChange={(e) =>
                          setAddressData((prev) => ({
                            ...prev,
                            number: e.target.value,
                          }))
                        }
                        placeholder="123"
                      />
                    </div>

                    <div>
                      <Label htmlFor="complement">Complemento</Label>
                      <Input
                        id="complement"
                        value={addressData.complement}
                        onChange={(e) =>
                          setAddressData((prev) => ({
                            ...prev,
                            complement: e.target.value,
                          }))
                        }
                        placeholder="Apto 45"
                      />
                    </div>

                    <div>
                      <Label htmlFor="neighborhood">Bairro *</Label>
                      <Input
                        id="neighborhood"
                        value={addressData.neighborhood}
                        onChange={(e) =>
                          setAddressData((prev) => ({
                            ...prev,
                            neighborhood: e.target.value,
                          }))
                        }
                        placeholder="Centro"
                      />
                    </div>

                    <div>
                      <Label htmlFor="city">Cidade *</Label>
                      <Input
                        id="city"
                        value={addressData.city}
                        onChange={(e) =>
                          setAddressData((prev) => ({
                            ...prev,
                            city: e.target.value,
                          }))
                        }
                        placeholder="São Paulo"
                      />
                    </div>

                    <div>
                      <Label htmlFor="state">Estado *</Label>
                      <Input
                        id="state"
                        value={addressData.state}
                        onChange={(e) =>
                          setAddressData((prev) => ({
                            ...prev,
                            state: e.target.value,
                          }))
                        }
                        placeholder="SP"
                        maxLength={2}
                      />
                    </div>

                    <div>
                      <Label htmlFor="zipCode">CEP *</Label>
                      <Input
                        id="zipCode"
                        value={addressData.zipCode}
                        onChange={(e) =>
                          setAddressData((prev) => ({
                            ...prev,
                            zipCode: e.target.value,
                          }))
                        }
                        placeholder="00000-000"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle>Forma de Pagamento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        paymentMethod === "PIX"
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-300"
                      }`}
                      onClick={() => setPaymentMethod("PIX")}
                    >
                      <div className="flex items-center gap-3">
                        <Smartphone className="h-5 w-5 text-blue-600" />
                        <div>
                          <h3 className="font-medium">PIX</h3>
                          <p className="text-sm text-gray-600">
                            Pagamento instantâneo
                          </p>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        paymentMethod === "CREDIT_CARD"
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-300"
                      }`}
                      onClick={() => setPaymentMethod("CREDIT_CARD")}
                    >
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-blue-600" />
                        <div>
                          <h3 className="font-medium">Cartão de Crédito</h3>
                          <p className="text-sm text-gray-600">
                            Visa, Mastercard, Elo
                          </p>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        paymentMethod === "BOLETO"
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-300"
                      }`}
                      onClick={() => setPaymentMethod("BOLETO")}
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <div>
                          <h3 className="font-medium">Boleto Bancário</h3>
                          <p className="text-sm text-gray-600">
                            Pagamento em até 3 dias úteis
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {paymentMethod === "CREDIT_CARD" && (
                    <div>
                      <Label htmlFor="installments">Parcelas</Label>
                      <select
                        id="installments"
                        value={installments}
                        onChange={(e) =>
                          setInstallments(Number(e.target.value))
                        }
                        className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                          <option key={num} value={num}>
                            {num}x de R$ {(checkoutData.total / num).toFixed(2)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6">
              {currentStep > 1 && (
                <Button variant="outline" onClick={handlePreviousStep}>
                  Voltar
                </Button>
              )}

              <div className="ml-auto">
                {currentStep < 3 ? (
                  <Button
                    onClick={handleNextStep}
                    style={{
                      backgroundColor:
                        theme.primaryButtonBackgroundColor || "#FF0080",
                      color: theme.primaryButtonTextColor || "#FFFFFF",
                    }}
                  >
                    Continuar
                  </Button>
                ) : (
                  <Button
                    onClick={handlePayment}
                    disabled={processing}
                    style={{
                      backgroundColor:
                        theme.checkoutButtonBackgroundColor || "#0FBA00",
                      color: "#FFFFFF",
                    }}
                  >
                    {processing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Processando...
                      </>
                    ) : (
                      "Finalizar Compra"
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Products */}
                  {checkoutData.products.map((product) => (
                    <div key={product.id} className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gray-300 rounded"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{product.name}</h4>
                        <p className="text-sm text-gray-600">
                          Qtd: {product.quantity}
                        </p>
                      </div>
                      <div className="text-sm font-medium">
                        R$ {(product.price * product.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}

                  <Separator />

                  {/* Totals */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>R$ {checkoutData.subtotal.toFixed(2)}</span>
                    </div>

                    {checkoutData.tax > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Taxa</span>
                        <span>R$ {checkoutData.tax.toFixed(2)}</span>
                      </div>
                    )}

                    {checkoutData.shipping > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Frete</span>
                        <span>R$ {checkoutData.shipping.toFixed(2)}</span>
                      </div>
                    )}

                    {checkoutData.discount && checkoutData.discount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Desconto</span>
                        <span>-R$ {checkoutData.discount.toFixed(2)}</span>
                      </div>
                    )}

                    <Separator />

                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>R$ {checkoutData.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicCheckoutPage;
