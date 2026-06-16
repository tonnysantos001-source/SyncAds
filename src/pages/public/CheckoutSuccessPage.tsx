import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { CheckCircle, Download, Share2, Home, Package, Zap, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatCardNumber, formatExpiry } from '@/utils/checkoutValidators';

const CheckoutSuccessPage: React.FC = () => {
  const { transactionId } = useParams<{ transactionId: string }>();
  const navigate = useNavigate();
  
  const [transaction, setTransaction] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Estados para o Upsell
  const [activeUpsell, setActiveUpsell] = useState<any>(null);
  const [upsellProduct, setUpsellProduct] = useState<any>(null);
  const [timerSeconds, setTimerSeconds] = useState(300); // 5 minutos
  const [showUpsell, setShowUpsell] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  
  // Estados para Pagamento do Upsell
  const [payMethod, setPayMethod] = useState<'PIX' | 'CREDIT_CARD' | 'BOLETO'>('PIX');
  const [cardData, setCardData] = useState({
    number: '',
    holderName: '',
    expiry: '',
    cvv: '',
    installments: 1
  });
  const [processingUpsell, setProcessingUpsell] = useState(false);
  const [upsellPayError, setUpsellPayError] = useState<string | null>(null);
  const [upsellSuccessMessage, setUpsellSuccessMessage] = useState<string | null>(null);

  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (transactionId) {
      loadTransactionAndUpsells();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [transactionId]);

  const loadTransactionAndUpsells = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('Transaction')
        .select('*, Order(*)')
        .eq('id', transactionId)
        .single();

      if (error) throw error;
      setTransaction(data);

      const order = data?.Order;
      if (order && order.items && Array.isArray(order.items)) {
        // Obter os IDs de produtos comprados
        const purchasedProductIds = order.items.map((item: any) => item.id || item.productId).filter(Boolean);

        if (purchasedProductIds.length > 0) {
          // Buscar upsells ativos criados por este lojista
          const { data: upsells } = await supabase
            .from('Upsell')
            .select('*')
            .eq('userId', order.userId)
            .eq('isActive', true);

          if (upsells && upsells.length > 0) {
            // Achar o primeiro upsell onde fromProductId (trigger) está nos produtos comprados
            const matchedUpsell = upsells.find((u) => purchasedProductIds.includes(u.fromProductId));

            if (matchedUpsell) {
              // Buscar os dados do produto que será oferecido (toProductId)
              // Tenta primeiro local
              const { data: localProduct } = await supabase
                .from('Product')
                .select('*, ProductImage(url)')
                .eq('id', matchedUpsell.toProductId)
                .maybeSingle();

              let productDetails: any = null;

              if (localProduct) {
                const originalPrice = Number(localProduct.price || 0);
                let price = originalPrice;
                if (matchedUpsell.discountType === 'PERCENTAGE' && matchedUpsell.discountValue) {
                  price = originalPrice * (1 - matchedUpsell.discountValue / 100);
                } else if (matchedUpsell.discountType === 'FIXED_AMOUNT' && matchedUpsell.discountValue) {
                  price = Math.max(0, originalPrice - matchedUpsell.discountValue);
                }

                const images = (localProduct as any).ProductImage || [];
                const image = images.length > 0 ? images[0].url : '';

                productDetails = {
                  id: localProduct.id,
                  name: localProduct.name,
                  description: matchedUpsell.description || localProduct.description || '',
                  originalPrice,
                  price,
                  image,
                };
              } else {
                // Tenta Shopify
                const { data: shopifyProduct } = await supabase
                  .from('ShopifyProduct')
                  .select('*')
                  .eq('id', matchedUpsell.toProductId)
                  .maybeSingle();

                if (shopifyProduct) {
                  const shopifyData = shopifyProduct.shopifyData || {};
                  const originalPrice = Number(shopifyData.variants?.[0]?.price || 0);
                  let price = originalPrice;
                  if (matchedUpsell.discountType === 'PERCENTAGE' && matchedUpsell.discountValue) {
                    price = originalPrice * (1 - matchedUpsell.discountValue / 100);
                  } else if (matchedUpsell.discountType === 'FIXED_AMOUNT' && matchedUpsell.discountValue) {
                    price = Math.max(0, originalPrice - matchedUpsell.discountValue);
                  }

                  let image = '';
                  if (shopifyProduct.images && Array.isArray(shopifyProduct.images) && shopifyProduct.images.length > 0) {
                    image = typeof shopifyProduct.images[0] === 'string' ? shopifyProduct.images[0] : shopifyProduct.images[0]?.src || '';
                  } else if (shopifyData.images && Array.isArray(shopifyData.images) && shopifyData.images.length > 0) {
                    image = shopifyData.images[0]?.src || '';
                  }

                  productDetails = {
                    id: shopifyProduct.id,
                    name: shopifyProduct.title,
                    description: matchedUpsell.description || shopifyProduct.description || '',
                    originalPrice,
                    price,
                    image,
                  };
                }
              }

              if (productDetails) {
                setActiveUpsell(matchedUpsell);
                setUpsellProduct(productDetails);
                setShowUpsell(true);
                
                // Iniciar contador
                if (timerRef.current) clearInterval(timerRef.current);
                timerRef.current = setInterval(() => {
                  setTimerSeconds((prev) => {
                    if (prev <= 1) {
                      clearInterval(timerRef.current);
                      setShowUpsell(false);
                      return 0;
                    }
                    return prev - 1;
                  });
                }, 1000);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar transação e upsells:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessUpsellPayment = async () => {
    if (!transaction || !upsellProduct || !activeUpsell) return;
    const order = transaction.Order;
    if (!order) return;

    setProcessingUpsell(true);
    setUpsellPayError(null);

    try {
      // 1. Chamar a Edge Function process-payment para cobrar o upsell
      const [expiryMonth, expiryYear] = cardData.expiry.split('/');
      
      const { data: paymentResponse, error: paymentError } = await supabase.functions.invoke('process-payment', {
        body: {
          userId: order.userId,
          orderId: order.id,
          amount: upsellProduct.price,
          paymentMethod: payMethod.toLowerCase(),
          isUpsell: true,
          customer: {
            name: order.customerName,
            email: order.customerEmail,
            phone: order.customerPhone || '',
            document: order.customerCpf || '',
          },
          billingAddress: {
            zipCode: order.shippingAddress?.zipCode || '',
            street: order.shippingAddress?.street || '',
            number: order.shippingAddress?.number || '',
            complement: order.shippingAddress?.complement || '',
            neighborhood: order.shippingAddress?.neighborhood || '',
            city: order.shippingAddress?.city || '',
            state: order.shippingAddress?.state || '',
          },
          card: payMethod === 'CREDIT_CARD' ? {
            number: cardData.number.replace(/\D/g, ''),
            holderName: cardData.holderName,
            expiryMonth: expiryMonth || '',
            expiryYear: expiryYear ? `20${expiryYear}` : '',
            cvv: cardData.cvv,
          } : undefined,
          installments: payMethod === 'CREDIT_CARD' ? cardData.installments : undefined,
          metadata: {
            isUpsell: true,
            upsellId: activeUpsell.id,
          }
        }
      });

      if (paymentError || !paymentResponse?.success) {
        throw new Error(paymentResponse?.error || paymentResponse?.message || 'Falha ao processar pagamento do Upsell');
      }

      // 2. Pagamento do Upsell aprovado/processado!
      // Anexar o item de upsell no pedido do banco de dados
      const newItems = [
        ...(order.items || []),
        {
          id: upsellProduct.id,
          name: upsellProduct.name,
          price: upsellProduct.price,
          quantity: 1,
          image: upsellProduct.image,
          variant: 'Upgrade (Upsell)'
        }
      ];

      const newTotal = Number(order.total || 0) + Number(upsellProduct.price);

      const { error: dbError } = await supabase
        .from('Order')
        .update({
          items: newItems,
          total: newTotal,
          updatedAt: new Date().toISOString()
        })
        .eq('id', order.id);

      if (dbError) {
        console.error('Erro ao atualizar itens da Order no banco:', dbError);
      }

      // 3. Sucesso completo
      setUpsellSuccessMessage('Oferta adicionada com sucesso ao seu pedido original!');
      setShowPayModal(false);
      setShowUpsell(false);

      // Recarregar os dados para atualizar a lista de itens
      loadTransactionAndUpsells();
    } catch (e: any) {
      console.error(e);
      setUpsellPayError(e.message || 'Erro ao processar pagamento.');
    } finally {
      setProcessingUpsell(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 space-y-6">
        
        {/* Confetes / Sucesso de Upsell */}
        {upsellSuccessMessage && (
          <div className="bg-green-100 border border-green-300 text-green-800 rounded-xl p-4 flex items-start gap-3 shadow-sm animate-bounce">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Parabéns!</p>
              <p className="text-sm">{upsellSuccessMessage}</p>
            </div>
          </div>
        )}

        {/* ── CARD DE UPSELL POST-PURCHASE ─────────────────────────────────── */}
        {showUpsell && upsellProduct && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white rounded-2xl p-6 shadow-2xl relative overflow-hidden border border-purple-500"
          >
            {/* Urgência / Timer */}
            <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-md">
              <Zap className="w-3.5 h-3.5 fill-current animate-pulse" />
              <span>Oferta expira em: {formatTimer(timerSeconds)}</span>
            </div>

            <span className="text-[10px] font-black uppercase bg-purple-500/30 text-purple-300 px-3 py-1 rounded-full border border-purple-500/20">
              OFERTA EXCLUSIVA PÓS-COMPRA
            </span>

            <div className="mt-4 flex flex-col md:flex-row gap-5 items-center">
              {/* Imagem do Produto */}
              <div className="w-32 h-32 rounded-xl overflow-hidden bg-white/10 flex items-center justify-center flex-shrink-0 border border-white/10">
                {upsellProduct.image ? (
                  <img src={upsellProduct.image} alt={upsellProduct.name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-10 h-10 text-white/40" />
                )}
              </div>

              {/* Informações da Oferta */}
              <div className="flex-1 text-center md:text-left space-y-2">
                <h3 className="text-xl font-extrabold text-white leading-tight">
                  {activeUpsell.title || `Adicione o ${upsellProduct.name} com Desconto Especial!`}
                </h3>
                <p className="text-sm text-purple-200 line-clamp-3 leading-relaxed">
                  {upsellProduct.description}
                </p>
                <div className="flex items-center justify-center md:justify-start gap-3 pt-1">
                  <span className="text-xs text-purple-300 line-through">
                    De R$ {upsellProduct.originalPrice.toFixed(2).replace('.', ',')}
                  </span>
                  <span className="text-lg font-black text-green-400">
                    Por apenas R$ {upsellProduct.price.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => {
                  setUpsellPayError(null);
                  setShowPayModal(true);
                }}
                className="flex-1 py-6 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-extrabold rounded-xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 border-0"
              >
                <Zap className="w-4 h-4 fill-current" />
                Sim! Adicionar ao meu pedido
              </Button>
              <button
                onClick={() => setShowUpsell(false)}
                className="px-6 py-3 text-xs font-semibold text-purple-300 hover:text-white transition-colors text-center"
              >
                Não, obrigado. Quero finalizar.
              </button>
            </div>
          </motion.div>
        )}

        {/* ── CARD PRINCIPAL DE COMPRA APROVADA ───────────────────────────── */}
        <Card className="text-center overflow-hidden border-0 shadow-lg bg-white/80 backdrop-blur-xl">
          <CardHeader className="pb-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600 animate-bounce" />
            </div>
            <CardTitle className="text-2xl font-extrabold text-green-600">Pagamento Aprovado!</CardTitle>
            <p className="text-gray-500 text-sm font-medium">
              Seu pedido foi recebido e está em processamento
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {transaction && (
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm text-left">
                  <div>
                    <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider block">ID da Transação</span>
                    <p className="font-bold text-gray-800 break-all">{transaction.transactionId || transaction.id}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider block">Valor Total</span>
                    <p className="font-extrabold text-gray-800 text-base">
                      R$ {transaction.Order?.total ? Number(transaction.Order.total).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.') : (transaction.amount ? transaction.amount.toFixed(2).replace('.', ',') : "0,00")}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider block">Status</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-bold px-2.5 py-0.5 rounded-full mt-1">
                      {transaction.status === 'PAID' ? 'PAGO' : transaction.status}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider block">Método de Pagamento</span>
                    <p className="font-bold text-gray-800 mt-1">{transaction.paymentMethod === 'PIX' ? 'PIX' : transaction.paymentMethod === 'CREDIT_CARD' ? 'Cartão de Crédito' : 'Boleto'}</p>
                  </div>
                </div>

                {/* Itens do Pedido */}
                {transaction.Order?.items && (
                  <div className="text-left border-t border-gray-200/60 pt-4 mt-5">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-gray-400 mb-3">Itens Inclusos no Pedido:</h4>
                    <div className="space-y-2.5">
                      {(transaction.Order.items as any[]).map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-white p-2.5 border border-gray-100 rounded-xl">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center flex-shrink-0 border border-gray-100">
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-5 h-5 text-gray-300" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-800 truncate">{item.name}</p>
                            <p className="text-[10px] text-gray-400 font-medium">{item.variant || 'Produto Principal'}</p>
                          </div>
                          <p className="text-xs font-extrabold text-gray-700">R$ {Number(item.price || 0).toFixed(2).replace('.', ',')}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CTAs Finais */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button 
                onClick={() => window.print()} 
                variant="outline" 
                className="w-full h-11 border-gray-200 rounded-xl text-gray-700 font-semibold"
              >
                <Download className="h-4 w-4 mr-2" />
                Comprovante
              </Button>
              
              <Button 
                onClick={() => navigator.share?.({ 
                  title: 'Comprovante de Pagamento',
                  text: `Pagamento aprovado - ID: ${transactionId}`
                })} 
                variant="outline" 
                className="w-full h-11 border-gray-200 rounded-xl text-gray-700 font-semibold"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Compartilhar
              </Button>
              
              <Button 
                onClick={() => navigate('/')} 
                className="w-full h-11 bg-gray-800 hover:bg-gray-900 rounded-xl font-semibold"
              >
                <Home className="h-4 w-4 mr-2" />
                Início
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── MODAL DE PAGAMENTO RÁPIDO DO UPSELL ────────────────────────────── */}
      {showPayModal && upsellProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-800 to-indigo-800 text-white p-5">
              <h3 className="font-extrabold text-lg flex items-center gap-1.5">
                <Zap className="w-5 h-5 fill-current text-green-400" />
                Finalizar Pagamento do Upsell
              </h3>
              <p className="text-purple-200 text-xs mt-1">
                Valor adicional a pagar: <strong className="text-white text-sm">R$ {upsellProduct.price.toFixed(2).replace('.', ',')}</strong>
              </p>
            </div>

            <div className="p-5 space-y-4">
              
              {/* Forma de Pagamento */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Forma de Pagamento</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(['PIX', 'CREDIT_CARD', 'BOLETO'] as const).map((method) => (
                    <button
                      key={method}
                      onClick={() => setPayMethod(method)}
                      className={`h-11 rounded-xl font-bold text-xs border transition-all ${
                        payMethod === method
                          ? 'border-purple-600 bg-purple-50 text-purple-700'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {method === 'PIX' ? 'PIX' : method === 'CREDIT_CARD' ? 'Cartão' : 'Boleto'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cartão de Crédito Fields */}
              {payMethod === 'CREDIT_CARD' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-3 pt-2"
                >
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Número do Cartão</Label>
                    <Input
                      value={cardData.number}
                      onChange={(e) => setCardData({ ...cardData, number: formatCardNumber(e.target.value) })}
                      placeholder="0000 0000 0000 0000"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Nome no Cartão</Label>
                    <Input
                      value={cardData.holderName}
                      onChange={(e) => setCardData({ ...cardData, holderName: e.target.value })}
                      placeholder="Nome completo do titular"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Validade</Label>
                      <Input
                        value={cardData.expiry}
                        onChange={(e) => setCardData({ ...cardData, expiry: formatExpiry(e.target.value) })}
                        placeholder="MM/AA"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">CVV</Label>
                      <Input
                        value={cardData.cvv}
                        onChange={(e) => setCardData({ ...cardData, cvv: e.target.value.replace(/\D/g, '').substring(0, 4) })}
                        placeholder="123"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Parcelas</Label>
                    <Select
                      value={String(cardData.installments)}
                      onValueChange={(v) => setCardData({ ...cardData, installments: Number(v) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n}x de R$ {(upsellProduct.price / n).toFixed(2).replace('.', ',')} sem juros
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </motion.div>
              )}

              {/* PIX / Boleto Info */}
              {payMethod === 'PIX' && (
                <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-3 text-xs text-purple-800 leading-relaxed">
                  ⚡ O código PIX Copia e Cola será gerado para que você possa pagar via aplicativo de seu banco e o item será adicionado instantaneamente.
                </div>
              )}

              {/* PIX / Boleto Info */}
              {payMethod === 'BOLETO' && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-800 leading-relaxed">
                  ℹ️ O boleto será gerado com prazo de 3 dias úteis para pagamento.
                </div>
              )}

              {/* Erros */}
              {upsellPayError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-red-700 text-xs">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p>{upsellPayError}</p>
                </div>
              )}

              {/* CTAs */}
              <div className="flex gap-3 pt-3">
                <Button
                  onClick={() => setShowPayModal(false)}
                  variant="outline"
                  disabled={processingUpsell}
                  className="flex-1 rounded-xl border-gray-200 text-gray-700"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleProcessUpsellPayment}
                  disabled={processingUpsell}
                  className="flex-1 bg-gradient-to-r from-purple-800 to-indigo-800 hover:from-purple-900 hover:to-indigo-900 text-white rounded-xl font-bold flex items-center justify-center gap-1.5"
                >
                  {processingUpsell ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Processando</>
                  ) : (
                    <><Lock className="w-4 h-4" /> Pagar R$ {upsellProduct.price.toFixed(2).replace('.', ',')}</>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default CheckoutSuccessPage;
