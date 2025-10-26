import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, Smartphone, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { checkoutApi } from '@/lib/api/checkoutApi';

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
  
  // Form data
  const [customerData, setCustomerData] = useState<CustomerData>({
    name: '',
    email: '',
    phone: '',
    document: ''
  });
  
  const [addressData, setAddressData] = useState<AddressData>({
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: ''
  });
  
  const [paymentMethod, setPaymentMethod] = useState<'CREDIT_CARD' | 'PIX' | 'BOLETO'>('PIX');
  const [installments, setInstallments] = useState(1);

  useEffect(() => {
    if (orderId) {
      loadCheckoutData();
    }
  }, [orderId]);

  const loadCheckoutData = async () => {
    try {
      setLoading(true);
      
      // Buscar dados do pedido (simulado por enquanto)
      const mockData: CheckoutData = {
        orderId: orderId!,
        products: [
          {
            id: '1',
            name: 'Produto Exemplo',
            price: 99.90,
            quantity: 1,
            image: 'https://via.placeholder.com/100x100'
          }
        ],
        total: 99.90,
        subtotal: 89.90,
        tax: 10.00,
        shipping: 0,
        discount: 0
      };
      
      setCheckoutData(mockData);
      
      // Carregar personalização do checkout
      try {
        const customData = await checkoutApi.loadCustomization('default-org-id');
        setCustomization(customData);
      } catch (error) {
        console.log('Usando personalização padrão');
        setCustomization({
          theme: {
            backgroundColor: '#FFFFFF',
            primaryButtonBackgroundColor: '#FF0080',
            primaryButtonTextColor: '#FFFFFF',
            checkoutButtonBackgroundColor: '#0FBA00',
            fontFamily: 'Arial'
          }
        });
      }
      
    } catch (error) {
      console.error('Erro ao carregar dados do checkout:', error);
      toast({
        title: 'Erro ao carregar checkout',
        description: 'Não foi possível carregar os dados do pedido',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      // Validar dados do cliente
      if (!customerData.name || !customerData.email || !customerData.phone) {
        toast({
          title: 'Dados incompletos',
          description: 'Preencha todos os campos obrigatórios',
          variant: 'destructive'
        });
        return;
      }
    }
    
    if (currentStep === 2) {
      // Validar endereço
      if (!addressData.street || !addressData.number || !addressData.neighborhood || 
          !addressData.city || !addressData.state || !addressData.zipCode) {
        toast({
          title: 'Endereço incompleto',
          description: 'Preencha todos os campos do endereço',
          variant: 'destructive'
        });
        return;
      }
    }
    
    setCurrentStep(prev => prev + 1);
  };

  const handlePreviousStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handlePayment = async () => {
    if (!checkoutData) return;
    
    setProcessing(true);
    try {
      // Processar pagamento
      const paymentData = {
        orderId: checkoutData.orderId,
        gatewayId: 'default-gateway', // Usar gateway padrão
        paymentMethod,
        amount: checkoutData.total,
        currency: 'BRL',
        customerData,
        billingAddress: addressData,
        installments,
        metadata: {
          source: 'public-checkout',
          products: checkoutData.products
        }
      };

      const { data, error } = await supabase.functions.invoke('process-payment', {
        body: paymentData
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.success) {
        toast({
          title: 'Pagamento processado!',
          description: 'Seu pagamento foi processado com sucesso',
          variant: 'default'
        });
        
        // Redirecionar para página de sucesso
        navigate(`/checkout/success/${data.data.transactionId}`);
      } else {
        throw new Error(data.message);
      }
      
    } catch (error) {
      console.error('Erro no pagamento:', error);
      toast({
        title: 'Erro no pagamento',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando checkout...</p>
        </div>
      </div>
    );
  }

  if (!checkoutData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Pedido não encontrado</h2>
            <p className="text-gray-600 mb-4">O pedido solicitado não foi encontrado.</p>
            <Button onClick={() => navigate('/')}>
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
      className="min-h-screen"
      style={{ 
        backgroundColor: theme.backgroundColor || '#FFFFFF',
        fontFamily: theme.fontFamily || 'Arial'
      }}
    >
      {/* Header */}
      <div className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Finalizar Compra</h1>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  1
                </div>
                <span className="text-sm">Dados</span>
              </div>
              <div className="w-8 h-px bg-gray-300"></div>
              <div className="flex items-center gap-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  2
                </div>
                <span className="text-sm">Endereço</span>
              </div>
              <div className="w-8 h-px bg-gray-300"></div>
              <div className="flex items-center gap-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
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
                      onChange={(e) => setCustomerData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Seu nome completo"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">E-mail *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={customerData.email}
                      onChange={(e) => setCustomerData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="seu@email.com"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Telefone/WhatsApp *</Label>
                    <Input
                      id="phone"
                      value={customerData.phone}
                      onChange={(e) => setCustomerData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="document">CPF</Label>
                    <Input
                      id="document"
                      value={customerData.document}
                      onChange={(e) => setCustomerData(prev => ({ ...prev, document: e.target.value }))}
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
                        onChange={(e) => setAddressData(prev => ({ ...prev, street: e.target.value }))}
                        placeholder="Nome da rua"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="number">Número *</Label>
                      <Input
                        id="number"
                        value={addressData.number}
                        onChange={(e) => setAddressData(prev => ({ ...prev, number: e.target.value }))}
                        placeholder="123"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="complement">Complemento</Label>
                      <Input
                        id="complement"
                        value={addressData.complement}
                        onChange={(e) => setAddressData(prev => ({ ...prev, complement: e.target.value }))}
                        placeholder="Apto 45"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="neighborhood">Bairro *</Label>
                      <Input
                        id="neighborhood"
                        value={addressData.neighborhood}
                        onChange={(e) => setAddressData(prev => ({ ...prev, neighborhood: e.target.value }))}
                        placeholder="Centro"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="city">Cidade *</Label>
                      <Input
                        id="city"
                        value={addressData.city}
                        onChange={(e) => setAddressData(prev => ({ ...prev, city: e.target.value }))}
                        placeholder="São Paulo"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="state">Estado *</Label>
                      <Input
                        id="state"
                        value={addressData.state}
                        onChange={(e) => setAddressData(prev => ({ ...prev, state: e.target.value }))}
                        placeholder="SP"
                        maxLength={2}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="zipCode">CEP *</Label>
                      <Input
                        id="zipCode"
                        value={addressData.zipCode}
                        onChange={(e) => setAddressData(prev => ({ ...prev, zipCode: e.target.value }))}
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
                        paymentMethod === 'PIX' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                      }`}
                      onClick={() => setPaymentMethod('PIX')}
                    >
                      <div className="flex items-center gap-3">
                        <Smartphone className="h-5 w-5 text-blue-600" />
                        <div>
                          <h3 className="font-medium">PIX</h3>
                          <p className="text-sm text-gray-600">Pagamento instantâneo</p>
                        </div>
                      </div>
                    </div>
                    
                    <div 
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        paymentMethod === 'CREDIT_CARD' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                      }`}
                      onClick={() => setPaymentMethod('CREDIT_CARD')}
                    >
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-blue-600" />
                        <div>
                          <h3 className="font-medium">Cartão de Crédito</h3>
                          <p className="text-sm text-gray-600">Visa, Mastercard, Elo</p>
                        </div>
                      </div>
                    </div>
                    
                    <div 
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        paymentMethod === 'BOLETO' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                      }`}
                      onClick={() => setPaymentMethod('BOLETO')}
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <div>
                          <h3 className="font-medium">Boleto Bancário</h3>
                          <p className="text-sm text-gray-600">Pagamento em até 3 dias úteis</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {paymentMethod === 'CREDIT_CARD' && (
                    <div>
                      <Label htmlFor="installments">Parcelas</Label>
                      <select
                        id="installments"
                        value={installments}
                        onChange={(e) => setInstallments(Number(e.target.value))}
                        className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
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
                      backgroundColor: theme.primaryButtonBackgroundColor || '#FF0080',
                      color: theme.primaryButtonTextColor || '#FFFFFF'
                    }}
                  >
                    Continuar
                  </Button>
                ) : (
                  <Button 
                    onClick={handlePayment}
                    disabled={processing}
                    style={{
                      backgroundColor: theme.checkoutButtonBackgroundColor || '#0FBA00',
                      color: '#FFFFFF'
                    }}
                  >
                    {processing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Processando...
                      </>
                    ) : (
                      'Finalizar Compra'
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
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <div className="w-8 h-8 bg-gray-300 rounded"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{product.name}</h4>
                        <p className="text-sm text-gray-600">Qtd: {product.quantity}</p>
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
