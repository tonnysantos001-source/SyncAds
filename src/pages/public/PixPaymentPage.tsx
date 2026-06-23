import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Copy,
  Check,
  QrCode,
  Clock,
  Smartphone,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import QRCode from "qrcode";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { usePixelTracking } from "@/hooks/usePixelTracking";

interface PixData {
  qrCode: string;
  qrCodeBase64?: string;
  expiresAt?: string;
  createdAt?: string;
  amount: number;
  transactionId?: string;
}

const PixPaymentPage: React.FC = () => {
  const { orderId, transactionId } = useParams<{
    orderId: string;
    transactionId?: string;
  }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [pixData, setPixData] = useState<PixData | null>(null);
  const [qrCodeImage, setQrCodeImage] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isChecking, setIsChecking] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  const [isExpiredDb, setIsExpiredDb] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showQRCode, setShowQRCode] = useState(true);
  const [customization, setCustomization] = useState<any>(null);
  const [shopUrl, setShopUrl] = useState<string>("");
  const [sellerUserId, setSellerUserId] = useState<string | null>(null);
  const [orderAmount, setOrderAmount] = useState<number>(0);
  const pixelPurchaseFired = useRef(false);

  // Pixel tracking do vendedor
  const { trackPurchase, trackPageView, initialized: pixelsInitialized } = usePixelTracking(sellerUserId);

  // Carregar dados do PIX
  useEffect(() => {
    const loadPixData = async () => {
      try {
        if (transactionId) {
          const { data, error } = await supabase
            .from("Transaction")
            .select("*")
            .eq("id", transactionId)
            .single();

          if (!error && data) {
            const qrCodeValue = data.pixQrCode || data.pixCopyPaste || data.metadata?.pixData?.qrCode || data.metadata?.qrCode || "";
            const pixInfo: PixData = {
              qrCode: qrCodeValue,
              qrCodeBase64: data.metadata?.pixData?.qrCodeBase64,
              amount: data.amount,
              expiresAt: data.pixExpiresAt || data.metadata?.pixData?.expiresAt,
              createdAt: data.createdAt,
              transactionId: data.id,
            };
            setPixData(pixInfo);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar dados do PIX:", error);
        toast({
          title: "Erro ao carregar dados",
          description: "Tente gerar o pagamento novamente",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadPixData();
  }, [orderId, transactionId]);

  // Heartbeat para marcar visitante ativo e atualizar tempo de sessão na página de PIX
  useEffect(() => {
    if (!orderId) return;

    const sendHeartbeat = async () => {
      try {
        await supabase
          .from("Order")
          .update({ updatedAt: new Date().toISOString() })
          .eq("id", orderId);
      } catch (err) {
        console.error("Erro ao enviar heartbeat no PIX:", err);
      }
    };

    sendHeartbeat();

    const interval = setInterval(sendHeartbeat, 30 * 1000);

    return () => clearInterval(interval);
  }, [orderId]);

  // Gerar QR Code
  useEffect(() => {
    if (pixData?.qrCode) {
      QRCode.toDataURL(pixData.qrCode, {
        width: 300,
        margin: 1,
        color: {
          dark: "#0f172a", // slate-900 para contraste moderno
          light: "#ffffff",
        },
        errorCorrectionLevel: "H",
      })
        .then((url) => {
          setQrCodeImage(url);
        })
        .catch((err) => {
          console.error("Erro ao gerar QR Code:", err);
        });
    }
  }, [pixData]);

  // Carregar personalização e dados da loja
  useEffect(() => {
    const loadCustomizationAndStore = async () => {
      try {
        if (!orderId) return;
        const { data: orderData, error: orderError } = await supabase
          .from("Order")
          .select("userId, metadata")
          .eq("id", orderId)
          .single();

        if (!orderError && orderData) {
          // Extrair shopDomain do metadata
          const domain = orderData.metadata?.shopDomain;
          if (domain) {
            setShopUrl(`https://${domain}`);
          }

          if (orderData.userId) {
            setSellerUserId(orderData.userId);
            setOrderAmount(orderData.total || 0);
            const { data: customData, error: customError } = await supabase
              .from("CheckoutCustomization")
              .select("theme")
              .eq("userId", orderData.userId)
              .eq("isActive", true)
              .single();

            if (!customError && customData) {
              setCustomization(customData.theme);
            }
          }
        }
      } catch (error) {
        console.error("Erro ao carregar dados adicionais do PIX:", error);
      }
    };

    loadCustomizationAndStore();
  }, [orderId]);

  const pixBarConfig = customization?.pixBar || {
    enabled: true,
    durationMinutes: 20,
    durationSeconds: 0,
    bgColor: "#f8fafc",
    borderColor: "#e2e8f0",
    textColor: "#475569",
    iconColor: "#10b981",
    fontStyle: "normal",
    fontSize: "text-xs",
  };

  // Timer de expiração
  useEffect(() => {
    if (!pixData) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      
      let expiryTime = 0;
      if (pixBarConfig.enabled && pixData.createdAt) {
        const created = new Date(pixData.createdAt).getTime();
        const durationMs = ((pixBarConfig.durationMinutes ?? 20) * 60 + (pixBarConfig.durationSeconds ?? 0)) * 1000;
        expiryTime = created + durationMs;
      } else if (pixData.expiresAt) {
        expiryTime = new Date(pixData.expiresAt).getTime();
      } else {
        expiryTime = now + 20 * 60 * 1000;
      }

      const diff = expiryTime - now;

      if (diff <= 0) {
        setTimeLeft(0);
        return;
      }

      setTimeLeft(Math.floor(diff / 1000));
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [pixData, pixBarConfig.enabled, pixBarConfig.durationMinutes, pixBarConfig.durationSeconds]);

  // Verificar pagamento periodicamente
  useEffect(() => {
    if (!transactionId || isPaid || isFailed || isExpiredDb) return;

    const checkPayment = async () => {
      setIsChecking(true);
      try {
        const { data, error } = await supabase
          .from("Transaction")
          .select("status")
          .eq("id", transactionId)
          .single();

        if (!error && data) {
          const status = (data.status || "").toUpperCase();
          const paidStatuses = ["PAID", "APPROVED", "CONFIRMADO", "SUCCESS", "COMPLETED"];
          const failedStatuses = ["FAILED", "REFUSED", "DECLINED", "CANCELLED", "CANCELADO"];
          const expiredStatuses = ["EXPIRED", "EXPIRADO"];

          if (paidStatuses.includes(status)) {
            setIsPaid(true);
            // Disparar evento Purchase via pixel quando PIX confirmado
            if (!pixelPurchaseFired.current && pixelsInitialized) {
              pixelPurchaseFired.current = true;
              trackPurchase(
                transactionId || "",
                orderAmount || (data as any)?.amount || 0,
                [],
                {}
              );
            }
            setTimeout(async () => {
              try {
                if (sellerUserId) {
                  const { data: redirectRules } = await supabase
                    .from("RedirectRule")
                    .select("destinationUrl")
                    .eq("userId", sellerUserId)
                    .eq("status", "ACTIVE")
                    .eq("trigger", "POST_PURCHASE")
                    .order("priority", { ascending: false });

                  if (redirectRules && redirectRules.length > 0 && redirectRules[0].destinationUrl) {
                    window.location.href = redirectRules[0].destinationUrl;
                    return;
                  }
                }
              } catch (err) {
                console.error("Erro ao buscar regras de redirecionamento pós-compra no PIX:", err);
              }

              if (shopUrl) {
                window.location.href = shopUrl;
              } else {
                navigate(`/checkout/success/${transactionId}`);
              }
            }, 4000); // 4 segundos de tela verde
          } else if (failedStatuses.includes(status)) {
            setIsFailed(true);
          } else if (expiredStatuses.includes(status)) {
            setIsExpiredDb(true);
          }
        }
      } catch (error) {
        console.error("Erro ao verificar pagamento:", error);
      } finally {
        setIsChecking(false);
      }
    };

    checkPayment();
    const interval = setInterval(checkPayment, 3000);

    return () => clearInterval(interval);
  }, [transactionId, isPaid, isFailed, isExpiredDb, navigate, shopUrl, sellerUserId, pixelsInitialized, orderAmount]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleCopyCode = async () => {
    if (!pixData?.qrCode) return;

    try {
      await navigator.clipboard.writeText(pixData.qrCode);
      setCopied(true);
      toast({
        title: "Código copiado!",
        description: "Cole no seu app de pagamento",
      });
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error("Erro ao copiar código:", err);
    }
  };

  const isExpired = pixData ? (timeLeft <= 0 || isExpiredDb) : false;

  const formatCurrency = (v: number) => {
    return v.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <RefreshCw className="h-8 w-8 text-emerald-500 animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-500">
            Carregando dados do pagamento...
          </p>
        </div>
      </div>
    );
  }

  if (!pixData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-sm w-full border border-slate-200 shadow-sm rounded-xl bg-white">
          <CardContent className="p-6 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Dados não encontrados</h2>
            <p className="text-sm text-slate-500">
              Não conseguimos encontrar os dados do seu pagamento PIX.
            </p>
            <Button
              onClick={() => navigate(`/checkout/${orderId}`)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Checkout
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isPaid) {
    return (
      <div className="min-h-screen bg-emerald-50 flex items-center justify-center p-4 transition-colors duration-500">
        <Card className="max-w-sm w-full border border-emerald-100 shadow-lg rounded-2xl bg-white">
          <CardContent className="p-8 text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 animate-bounce">
              <CheckCircle className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-emerald-950">
              Pagamento Confirmado!
            </h2>
            <p className="text-sm text-emerald-800">
              Seu pagamento via PIX foi recebido e aprovado com sucesso.
            </p>
            <p className="text-xs text-emerald-600 font-semibold animate-pulse">
              Redirecionando de volta para a loja...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSimulatePayment = async () => {
    if (!transactionId || !sellerUserId) return;

    try {
      setIsChecking(true);
      // 1. Atualizar transação para PAID
      const { error: updateError } = await supabase
        .from("Transaction")
        .update({ status: "PAID" })
        .eq("id", transactionId);

      if (updateError) throw updateError;

      // 2. Inserir notificação de Pedido Pago
      const generateUUID = () => {
        if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
          return crypto.randomUUID();
        }
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === "x" ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
      };

      // Buscar detalhes no metadata da transação
      const { data: txData } = await supabase
        .from("Transaction")
        .select("amount, metadata, paymentMethod")
        .eq("id", transactionId)
        .single();

      const amount = txData?.amount || orderAmount || 0;
      const gatewayName = "PIX"; 

      // Buscar número do pedido e produtos
      let orderNumberStr = "";
      let productsMeta: any[] = [];
      if (orderId) {
        const { data: orderData } = await supabase
          .from("Order")
          .select("orderNumber, items")
          .eq("id", orderId)
          .single();
        if (orderData) {
          orderNumberStr = orderData.orderNumber ? ` #${orderData.orderNumber}` : "";
          if (Array.isArray(orderData.items)) {
            productsMeta = orderData.items.map((p: any) => ({ name: p.name || p.title || "Produto", price: p.price }));
          }
        }
      }

      await supabase.from("Notification").insert({
        id: generateUUID(),
        userId: sellerUserId,
        type: "SUCCESS",
        title: "Novo Pedido Pago! 🎉",
        message: `Pedido${orderNumberStr} de R$ ${amount.toFixed(2)} via PIX (${gatewayName}).`,
        metadata: {
          orderId,
          amount,
          paymentMethod: "PIX",
          gateway: gatewayName,
          products: productsMeta
        },
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      toast({
        title: "Sucesso!",
        description: "Pagamento confirmado. O painel receberá o alerta em segundos!",
      });

      setIsPaid(true);
    } catch (err: any) {
      console.error("Erro ao simular pagamento:", err);
      toast({
        title: "Erro ao confirmar",
        description: err.message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-start py-6 px-4 w-full overflow-y-auto">
      <div className="w-full max-w-[420px] space-y-4">
        
        {/* Header Voltar */}
        <div className="flex justify-between items-center px-1">
          <button
            onClick={() => {
              if (shopUrl) {
                window.location.href = shopUrl;
              } else {
                window.history.back();
              }
            }}
            className="text-xs font-semibold text-slate-500 hover:text-slate-850 transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="h-3 w-3 text-slate-500" />
            Voltar para a loja
          </button>
        </div>

        {/* Main Card */}
        <Card className="border border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-2xl overflow-hidden bg-white">
          <CardContent className="p-6 space-y-5">
            
            {/* Brand/PIX header */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-100">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Pagamento Instantâneo PIX
              </div>
              <h1 className="text-lg font-bold text-slate-800">
                Escaneie ou copie o código
              </h1>
              <p className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                R$ {formatCurrency(pixData.amount)}
              </p>
            </div>

            {/* Timer status bar */}
            {pixBarConfig.enabled && !isExpired && !isFailed && (
              <div 
                style={{
                  backgroundColor: pixBarConfig.bgColor,
                  borderColor: pixBarConfig.borderColor,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                }}
                className={cn(
                  "rounded-xl p-3 flex items-center justify-center gap-2",
                  pixBarConfig.fontStyle === 'italic' ? 'italic' : ''
                )}
              >
                <Clock style={{ color: pixBarConfig.iconColor }} className="h-4 w-4" />
                <span 
                  style={{ color: pixBarConfig.textColor }} 
                  className={cn("font-semibold", pixBarConfig.fontSize || "text-xs")}
                >
                  Código expira em:
                </span>
                <span 
                  style={{ color: pixBarConfig.textColor }} 
                  className={cn("font-bold font-mono", pixBarConfig.fontSize || "text-xs")}
                >
                  {formatTime(timeLeft)}
                </span>
              </div>
            )}

            {/* Verification status loader */}
            {isChecking && !isExpired && !isFailed && (
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-emerald-600 font-bold">
                <RefreshCw className="h-3 w-3 animate-spin text-emerald-500" />
                Aguardando confirmação do banco...
              </div>
            )}

            {/* Toggle QR Code / Copia e Cola */}
            {!isExpired && !isFailed && (
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100/80 border border-slate-200/60 rounded-xl">
                <button
                  onClick={() => setShowQRCode(true)}
                  className={cn(
                    "py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                    showQRCode
                      ? "bg-white text-slate-900 shadow-sm border border-slate-200/30"
                      : "text-slate-500 hover:text-slate-800"
                  )}
                >
                  <QrCode className="h-3.5 w-3.5" />
                  Visualizar QR Code
                </button>
                <button
                  onClick={() => setShowQRCode(false)}
                  className={cn(
                    "py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                    !showQRCode
                      ? "bg-white text-slate-900 shadow-sm border border-slate-200/30"
                      : "text-slate-500 hover:text-slate-800"
                  )}
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copia e Cola
                </button>
              </div>
            )}

            {/* Expirado UI */}
            {isExpired && (
              <div className="bg-red-50/70 border border-red-200 p-5 rounded-xl text-center space-y-3">
                <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-red-800">Código PIX Expirado</p>
                  <p className="text-xs text-red-600">
                    O tempo limite para pagamento deste código expirou. Gere um novo código.
                  </p>
                </div>
                <Button
                  onClick={() => navigate(`/checkout/${orderId}`)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white text-xs h-10 font-semibold shadow-sm"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Gerar Novo Código PIX
                </Button>
              </div>
            )}

            {/* Cancelado / Recusado UI */}
            {isFailed && (
              <div className="bg-red-50/70 border border-red-200 p-5 rounded-xl text-center space-y-3">
                <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-red-800">Pagamento Recusado ou Cancelado</p>
                  <p className="text-xs text-red-600">
                    A transação foi recusada pelo gateway de pagamento ou cancelada. Por favor, tente efetuar o pagamento novamente.
                  </p>
                </div>
                <Button
                  onClick={() => navigate(`/checkout/${orderId}`)}
                  className="w-full bg-red-600 hover:bg-red-750 text-white text-xs h-10 font-semibold shadow-sm flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Voltar ao Checkout
                </Button>
              </div>
            )}

            {/* QR Code Container */}
            {!isExpired && !isFailed && showQRCode && (
              <div className="space-y-3 text-center">
                <div className="inline-block p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                  {qrCodeImage ? (
                    <img
                      src={qrCodeImage}
                      alt="QR Code PIX"
                      className="w-44 h-44 mx-auto"
                    />
                  ) : (
                    <div className="w-44 h-44 mx-auto bg-slate-50 rounded-xl flex items-center justify-center">
                      <RefreshCw className="h-8 w-8 text-slate-300 animate-spin" />
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 max-w-[280px] mx-auto leading-relaxed">
                  Abra o aplicativo de seu banco, escolha a opção "Pagar com Pix" e aponte a câmera para o QR Code acima.
                </p>
              </div>
            )}

            {/* Copia e Cola Container */}
            {!isExpired && !isFailed && !showQRCode && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Linha Digitável / Copia e Cola:
                  </label>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <code className="text-xs font-mono break-all block text-slate-650 max-h-20 overflow-y-auto scrollbar-thin select-all">
                      {pixData.qrCode}
                    </code>
                  </div>
                </div>

                <Button
                  onClick={handleCopyCode}
                  className={cn(
                    "w-full h-11 text-xs font-bold shadow-sm transition-all rounded-lg text-white",
                    copied ? "bg-emerald-600 hover:bg-emerald-700" : "bg-emerald-500 hover:bg-emerald-600"
                  )}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Código Copiado com Sucesso!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar Código Pix
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Como Pagar Instructions */}
            {!isExpired && !isFailed && (
              <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-200/80 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Smartphone className="h-4 w-4 text-emerald-500" />
                  Instruções de pagamento:
                </h4>
                <ol className="text-xs text-slate-500 space-y-2.5">
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-slate-200 text-[10px] font-bold text-slate-600 border border-slate-300/60">
                      1
                    </span>
                    <span>Abra o app do seu banco ou carteira digital de preferência.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-slate-200 text-[10px] font-bold text-slate-600 border border-slate-300/60">
                      2
                    </span>
                    <span>Selecione a opção de pagamento via <strong>PIX</strong>.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-slate-200 text-[10px] font-bold text-slate-600 border border-slate-300/60">
                      3
                    </span>
                    <span>Escolha a leitura de <strong>QR Code</strong> ou cole o código <strong>Pix Copia e Cola</strong>.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-slate-200 text-[10px] font-bold text-slate-600 border border-slate-300/60">
                      4
                    </span>
                    <span>Confirme os dados do pagamento e conclua. A aprovação é imediata!</span>
                  </li>
                </ol>
              </div>
            )}
            {/* Botão de Simulação de Pagamento para Testes */}
            {!isExpired && !isFailed && !isPaid && (
              <Button
                onClick={handleSimulatePayment}
                disabled={isChecking}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-11 rounded-lg flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 border border-blue-400/30"
              >
                <Check className="h-4 w-4" />
                Simular Confirmação de Pagamento (Teste)
              </Button>
            )}

          </CardContent>
        </Card>

        {/* Security Footer Info */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span>Ambiente de pagamento 100% seguro</span>
        </div>
        
      </div>
    </div>
  );
};

export default PixPaymentPage;
