import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  CreditCard,
  Smartphone,
  FileText,
  AlertCircle,
  Check,
  Lock,
  Truck,
  ShieldCheck,
  Package,
  Award,
  X,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { checkoutApi } from "@/lib/api/checkoutApi";
import { formatCep, searchCep } from "@/lib/utils/cepUtils";

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

const PublicCheckoutPageNew: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [customization, setCustomization] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [loadingCep, setLoadingCep] = useState(false);

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

  const [paymentMethod, setPaymentMethod] = useState<"CREDIT_CARD" | "PIX" | "BOLETO">("PIX");
  const [installments, setInstallments] = useState(1);

  useEffect(() => {
    if (orderId) {
      loadCheckoutData();
    }
  }, [orderId]);

  const loadCheckoutData = async () => {
    try {
      setLoading(true);

      // Tentar buscar do localStorage primeiro
      const cartData = localStorage.getItem("syncads_cart");
      if (cartData) {
        const items = JSON.parse(cartData);
        const subtotal = items.reduce(
          (sum: number, item: any) => sum + item.price * item.quantity,
          0
        );

        const mockData: CheckoutData = {
          orderId: orderId!,
          products: items.map((item: any) => ({
            id: item.variantId || item.id,
            name: item.name || item.title,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
            sku: item.sku,
          })),
          total: subtotal,
          subtotal,
          tax: 0,
          shipping: 0,
          discount: 0,
        };

        setCheckoutData(mockData);
      } else {
        // Dados mock para demonstração
        const mockData: CheckoutData = {
          orderId: orderId!,
          products: [
            {
              id: "1",
              name: "Tênis Esportivo Premium",
              price: 299.9,
              quantity: 1,
              image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop",
              sku: "TENIS-001",
            },
            {
              id: "2",
              name: "Mochila Moderna",
              price: 189.9,
              quantity: 2,
              image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop",
              sku: "MOCHILA-002",
            },
          ],
          total: 679.7,
          subtotal: 679.7,
          tax: 0,
          shipping: 0,
          discount: 0,
        };

        setCheckoutData(mockData);
      }

      // Carregar personalização
      try {
        const customData = await checkoutApi.loadCustomization("default-org-id");
        setCustomization(customData);
      } catch (error) {
        console.log("Usando tema padrão");
        setCustomization({
          theme: {
            backgroundColor: "#F9FAFB",
            primaryButtonBackgroundColor: "#8B5CF6",
            primaryButtonTextColor: "#FFFFFF",
            checkoutButtonBackgroundColor: "#10B981",
            checkoutButtonTextColor: "#FFFFFF",
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            cartBorderColor: "#E5E7EB",
            quantityCircleColor: "#8B5CF6",
            footerBackgroundColor: "#F3F4F6",
            footerTextColor: "#6B7280",
            noticeBarBackgroundColor: "#1F2937",
            noticeBarTextColor: "#FFFFFF",
            noticeBarMessage: "🎉 FRETE GRÁTIS para todo o Brasil em compras acima de R$ 199!",
            discountTagBackgroundColor: "#EF4444",
            discountTagTextColor: "#FFFFFF",
            primaryButtonHover: true,
            checkoutButtonHover: true,
          },
        });
      }
    } catch (error) {
      console.error("Erro ao carregar checkout:", error);
      toast({
        title: "Erro ao carregar",
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
      const paymentData = {
        orderId: checkoutData.orderId,
        gatewayId: "default-gateway",
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

      const { data, error } = await supabase.functions.invoke("process-payment", {
        body: paymentData,
      });

      if (error) throw new Error(error.message);

      if (data.success) {
        toast({
          title: "🎉 Pagamento aprovado!",
          description: "Seu pedido foi confirmado com sucesso",
        });
        navigate(`/checkout/success/${data.data.transactionId}`);
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      toast({
        title: "Erro no pagamento",
        description: error.message || "Tente novamente",
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
          <p className="text-gray-700 font-semibold text-lg">Carregando checkout seguro...</p>
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
            <h2 className="text-2xl font-bold mb-2 text-gray-900">Pedido não encontrado</h2>
            <p className="text-gray-600 mb-6">
              O pedido solicitado não foi encontrado ou expirou.
            </p>
            <Button onClick={() => navigate("/")} className="w-full h-12 text-base font-semibold">
              Voltar ao início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const theme = customization?.theme || {};

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{
        backgroundColor: theme.backgroundColor || "#F9FAFB",
        fontFamily: theme.fontFamily || "system-ui, sans-serif",
      }}
    >
      {/* Barra de Avisos */}
      {theme.noticeBarMessage && (
        <div
          className="w-full py-3 px-4 text-center text-sm font-medium animate-pulse"
          style={{
            backgroundColor: theme.noticeBarBackgroundColor || "#1F2937",
            color: theme.noticeBarTextColor || "#FFFFFF",
          }}
        >
          {theme.noticeBarMessage}
        </div>
      )}

      {/* Header Moderno */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50 backdrop-blur-lg bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            {/* Logo e título */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Lock className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
                  Checkout Seguro
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">
                  Seus dados estão protegidos 🔒
                </p>
              </div>
            </div>

            {/* Steps - Desktop */}
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
                          ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/50 scale-110"
                          : currentStep === step.num
                          ? "bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/50 scale-110 animate-bounce"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {currentStep > step.num ? (
                        <Check className="h-6 w-6 animate-in zoom-in" />
                      ) : (
                        <step.icon className="h-6 w-6" />
                      )}
                      {currentStep === step.num && (
                        <div className="absolute inset-0 rounded-xl bg-purple-400 opacity-50 animate-ping" />
                      )}
                    </div>
                    <div>
                      <p
                        className={`text-xs font-medium ${
                          currentStep >= step.num ? "text-purple-600" : "text-gray-400"
                        }`}
                      >
                        Etapa {step.num}
                      </p>
                      <p
                        className={`text-sm font-bold ${
                          currentStep >= step.num ? "text-gray-900" : "text-gray-400"
                        }`}
                      >
                        {step.label}
                      </p>
                    </div>
                  </div>
                  {idx < 2 && (
                    <div className="relative w-16 h-1 rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className={`absolute top-0 left-0 h-full transition-all duration-700 ${
                          currentStep > step.num
                            ? "w-full bg-gradient-to-r from-green-500 to-emerald-600"
                            : "w-0"
                        }`}
                      />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Steps - Mobile */}
            <div className="lg:hidden">
              <div className="text-right">
                <p className="text-sm font-bold text-purple-600">Etapa {currentStep} de 3</p>
                <p className="text-xs text-gray-500">
                  {currentStep === 1 ? "Dados" : currentStep === 2 ? "Entrega" : "Pagamento"}
                </p>
              </div>
            </div>
          </div>

          {/* Progress Bar - Mobile */}
          <div className="mt-4 lg:hidden">
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(currentStep / 3) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Formulário Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Dados Pessoais */}
            {currentStep === 1 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Card className="border-0 shadow-xl overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                        <Package className="h-7 w-7" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">Informações Pessoais</h2>
                        <p className="text-purple-100 text-sm">Preencha seus dados para continuar</p>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-6 space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-bold text-gray-700">
                        Nome completo *
                      </Label>
                      <Input
                        id="name"
                        value={customerData.name}
                        onChange={(e) =>
                          setCustomerData((prev) => ({ ...prev, name: e.target.value }))
                        }
                        placeholder="João da Silva"
                        className="h-12 text-base border-2 focus:border-purple-500 transition-colors"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-bold text-gray-700">
                          E-mail *
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={customerData.email}
                          onChange={(e) =>
                            setCustomerData((prev) => ({ ...prev, email: e.target.value }))
                          }
                          placeholder="joao@email.com"
                          className="h-12 text-base border-2 focus:border-purple-500 transition-colors"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-bold text-gray-700">
                          Telefone/WhatsApp *
                        </Label>
                        <Input
                          id="phone"
                          value={customerData.phone}
                          onChange={(e) =>
                            setCustomerData((prev) => ({ ...prev, phone: e.target.value }))
                          }
                          placeholder="(11) 99999-9999"
                          className="h-12 text-base border-2 focus:border-purple-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="document" className="text-sm font-bold text-gray-700">
                        CPF (opcional)
                      </Label>
                      <Input
                        id="document"
                        value={customerData.document}
                        onChange={(e) =>
                          setCustomerData((prev) => ({ ...prev, document: e.target.value }))
                        }
                        placeholder="000.000.000-00"
                        className="h-12 text-base border-2 focus:border-purple-500 transition-colors"
                      />
                    </div>

                    {/* Trust Badges */}
                    <div className="grid grid-cols-3 gap-3 pt-6 border-t">
                      <div className="flex flex-col items-center text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                        <ShieldCheck className="h-8 w-8 text-green-600 mb-2" />
                        <span className="text-xs font-bold text-gray-700">Dados Seguros</span>
                      </div>
                      <div className="flex flex-col items-center text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                        <Lock className="h-8 w-8 text-blue-600 mb-2" />
                        <span className="text-xs font-bold text-gray-700">Criptografado</span>
                      </div>
                      <div className="flex flex-col items-center text-center p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
                        <Award className="h-8 w-8 text-purple-600 mb-2" />
                        <span className="text-xs font-bold text-gray-700">Certificado</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Step 2: Endereço */}
            {currentStep === 2 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Card className="border-0 shadow-xl overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 text-white">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                        <Truck className="h-7 w-7" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">Endereço de Entrega</h2>
                        <p className="text-blue-100 text-sm">Enviaremos seu pedido para este endereço</p>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-6 space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="zipCode" className="text-sm font-bold text-gray-700">
                        CEP *
                      </Label>
                      <div className="relative">
                        <Input
                          id="zipCode"
                          value={addressData.zipCode}
                          onChange={handleCepChange}
                          placeholder="00000-000"
                          maxLength={9}
                          disabled={loadingCep}
                          className="h-12 text-base border-2 focus:border-blue-500 transition-colors pr-12"
                        />
                        {loadingCep && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Check className="h-3 w-3 text-green-600" />
                        Preenche o endereço automaticamente
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="street" className="text-sm font-bold text-gray-700">
                        Rua/Avenida *
                      </Label>
                      <Input
                        id="street"
                        value={addressData.street}
                        onChange={(e) =>
                          setAddressData((prev) => ({ ...prev, street: e.target.value }))
                        }
                        placeholder="Nome da rua"
                        className="h-12 text-base border-2 focus:border-blue-500 transition-colors"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="number" className="text-sm font-bold text-gray-700">
                          Número *
                        </Label>
                        <Input
                          id="number"
                          value={addressData.number}
                          onChange={(e) =>
                            setAddressData((prev) => ({ ...prev, number: e.target.value }))
                          }
                          placeholder="123"
                          className="h-12 text-base border-2 focus:border-blue-500 transition-colors"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="complement" className="text-sm font-bold text-gray-700">
                          Complemento
                        </Label>
                        <Input
                          id="complement"
                          value={addressData.complement}
                          onChange={(e) =>
                            setAddressData((prev) => ({ ...prev, complement: e.target.value }))
                          }
                          placeholder="Apto 45"
                          className="h-12 text-base border-2 focus:border-blue-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="neighborhood" className="text-sm font-bold text-gray-700">
                        Bairro *
                      </Label>
                      <Input
                        id="neighborhood"
                        value={addressData.neighborhood}
                        onChange={(e) =>
                          setAddressData((prev) => ({ ...prev, neighborhood: e.target.value }))
                        }
                        placeholder="Centro"
                        className="h-12 text-base border-2 focus:border-blue-500 transition-colors"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city" className="text-sm font-bold text-gray-700">
                          Cidade *
                        </Label>
                        <Input
                          id="city"
                          value={addressData.city}
                          onChange={(e) =>
                            setAddressData((prev) => ({ ...prev, city: e.target.value }))
                          }
                          placeholder="São Paulo"
                          className="h-12 text-base border-2 focus:border-blue-500 transition-colors"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="state" className="text-sm font-bold text-gray-700">
                          Estado *
                        </Label>
                        <Input
                          id="state"
                          value={addressData.state}
                          onChange={(e) =>
                            setAddressData((prev) => ({
                              ...prev,
                              state: e.target.value.toUpperCase(),
                            }))
                          }
                          placeholder="SP"
                          maxLength={2}
                          className="h-12 text-base border-2 focus:border-blue-500 transition-colors uppercase"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Step 3: Pagamento */}
            {currentStep === 3 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Card className="border-0 shadow-xl overflow-hidden">
                  <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
