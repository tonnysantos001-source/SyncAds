import React, { useState, useEffect } from "react";
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

interface PixData {
  qrCode: string;
  qrCodeBase64?: string;
  expiresAt?: string;
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
  const [loading, setLoading] = useState(true);
  const [showQRCode, setShowQRCode] = useState(true);

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

  // Timer de expiração
  useEffect(() => {
    if (!pixData?.expiresAt) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(pixData.expiresAt!).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft(0);
        return;
      }

      setTimeLeft(Math.floor(diff / 1000));
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [pixData?.expiresAt]);

  // Verificar pagamento periodicamente
  useEffect(() => {
    if (!transactionId || isPaid) return;

    const checkPayment = async () => {
      setIsChecking(true);
      try {
        const { data, error } = await supabase
          .from("Transaction")
          .select("status")
          .eq("id", transactionId)
          .single();

        if (!error && data) {
          if (data.status === "PAID" || data.status === "approved") {
            setIsPaid(true);
            setTimeout(() => {
              navigate(`/checkout/success/${transactionId}`);
            }, 2000);
          }
        }
      } catch (error) {
        console.error("Erro ao verificar pagamento:", error);
      } finally {
        setIsChecking(false);
      }
    };

    checkPayment();
    const interval = setInterval(checkPayment, 5000);

    return () => clearInterval(interval);
  }, [transactionId, isPaid, navigate]);

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

  const isExpired = timeLeft <= 0 && pixData?.expiresAt;

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
        <Card className="max-w-sm w-full border-slate-100 shadow-sm rounded-xl bg-white">
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-sm w-full border-slate-100 shadow-sm rounded-xl bg-white">
          <CardContent className="p-8 text-center space-y-4">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-50 text-emerald-500">
              <CheckCircle className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Pagamento Confirmado!
            </h2>
            <p className="text-sm text-slate-500">
              Seu pagamento via PIX foi recebido e aprovado com sucesso.
            </p>
            <p className="text-xs text-emerald-600 font-medium animate-pulse">
              Redirecionando para a confirmação...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-8 px-4">
      <div className="w-full max-w-[460px] space-y-6">
        
        {/* Header Voltar */}
        <div className="flex justify-between items-center px-1">
          <button
            onClick={() => navigate(`/checkout/${orderId}`)}
            className="text-xs font-medium text-slate-400 hover:text-slate-900 transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="h-3 w-3" />
            Alterar método de pagamento
          </button>
        </div>

        {/* Main Card */}
        <Card className="border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.012)] rounded-2xl overflow-hidden bg-white">
          <CardContent className="p-6 md:p-8 space-y-6">
            
            {/* Brand/PIX header */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Pagamento Instantâneo PIX
              </div>
              <h1 className="text-xl font-bold text-slate-800">
                Escaneie ou copie o código
              </h1>
              <p className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                R$ {pixData.amount.toFixed(2)}
              </p>
            </div>

            {/* Timer status bar */}
            {!isExpired && (
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-center gap-2">
                <Clock className="h-4 w-4 text-emerald-500" />
                <span className="text-xs font-medium text-slate-600">
                  Código expira em:
                </span>
                <span className="text-xs font-bold font-mono text-slate-800">
                  {formatTime(timeLeft)}
                </span>
              </div>
            )}

            {/* Verification status loader */}
            {isChecking && !isExpired && (
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-emerald-600 font-medium">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Aguardando confirmação do banco...
              </div>
            )}

            {/* Toggle QR Code / Copia e Cola */}
            {!isExpired && (
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-50 rounded-lg">
                <button
                  onClick={() => setShowQRCode(true)}
                  className={cn(
                    "py-2 px-3 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5",
                    showQRCode
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-450 hover:text-slate-900"
                  )}
                >
                  <QrCode className="h-3.5 w-3.5" />
                  Visualizar QR Code
                </button>
                <button
                  onClick={() => setShowQRCode(false)}
                  className={cn(
                    "py-2 px-3 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5",
                    !showQRCode
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-450 hover:text-slate-900"
                  )}
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copia e Cola
                </button>
              </div>
            )}

            {/* Expirado UI */}
            {isExpired && (
              <div className="bg-red-50/70 border border-red-100 p-5 rounded-xl text-center space-y-3">
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

            {/* QR Code Container */}
            {!isExpired && showQRCode && (
              <div className="space-y-3 text-center">
                <div className="inline-block p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                  {qrCodeImage ? (
                    <img
                      src={qrCodeImage}
                      alt="QR Code PIX"
                      className="w-48 h-48 mx-auto"
                    />
                  ) : (
                    <div className="w-48 h-48 mx-auto bg-slate-50 rounded-xl flex items-center justify-center">
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
            {!isExpired && !showQRCode && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Linha Digitável / Copia e Cola:
                  </label>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <code className="text-xs font-mono break-all block text-slate-600 max-h-20 overflow-y-auto scrollbar-thin select-all">
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
            {!isExpired && (
              <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100/60 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Smartphone className="h-4 w-4 text-emerald-500" />
                  Instruções de pagamento:
                </h4>
                <ol className="text-xs text-slate-500 space-y-2.5">
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-slate-200/60 text-[10px] font-bold text-slate-600">
                      1
                    </span>
                    <span>Abra o app do seu banco ou carteira digital de preferência.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-slate-200/60 text-[10px] font-bold text-slate-600">
                      2
                    </span>
                    <span>Selecione a opção de pagamento via <strong>PIX</strong>.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-slate-200/60 text-[10px] font-bold text-slate-600">
                      3
                    </span>
                    <span>Escolha a leitura de <strong>QR Code</strong> ou cole o código <strong>Pix Copia e Cola</strong>.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-slate-200/60 text-[10px] font-bold text-slate-600">
                      4
                    </span>
                    <span>Confirme os dados do pagamento e conclua. A aprovação é imediata!</span>
                  </li>
                </ol>
              </div>
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
