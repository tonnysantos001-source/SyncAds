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
        // Tentar carregar do localStorage primeiro
        const savedData = localStorage.getItem(`pix-${orderId}`);
        if (savedData) {
          const parsed = JSON.parse(savedData);
          setPixData(parsed);
          setLoading(false);
          return;
        }

        // Se não tiver no localStorage, buscar do banco
        if (transactionId) {
          const { data, error } = await supabase
            .from("Transaction")
            .select("*")
            .eq("id", transactionId)
            .single();

          if (!error && data) {
            const pixInfo: PixData = {
              qrCode: data.metadata?.pixData?.qrCode || "",
              amount: data.amount,
              expiresAt: data.metadata?.pixData?.expiresAt,
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
        width: 400,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
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
            // Aguardar 2 segundos e redirecionar
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

    // Verificar imediatamente e depois a cada 5 segundos
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Carregando dados do pagamento...
          </p>
        </div>
      </div>
    );
  }

  if (!pixData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Dados não encontrados</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Não conseguimos encontrar os dados do seu pagamento PIX.
            </p>
            <Button
              onClick={() => navigate(`/checkout/${orderId}`)}
              className="w-full"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Voltar ao Checkout
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Página de pagamento confirmado
  if (isPaid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500 mb-6 animate-bounce">
              <CheckCircle className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-green-600 mb-2">
              Pagamento Confirmado! 🎉
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-2">
              Seu pagamento via PIX foi aprovado com sucesso.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Redirecionando...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(`/checkout/${orderId}`)}
            className="mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Voltar
          </Button>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-lg mb-4">
              <QrCode className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Pagamento via PIX
            </h1>
            <p className="text-xl md:text-2xl font-bold text-green-600">
              R$ {pixData.amount.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Timer */}
        {pixData.expiresAt && (
          <Card
            className={cn(
              "mb-6 border-2",
              isExpired
                ? "bg-red-50 border-red-300 dark:bg-red-950/30 dark:border-red-800"
                : timeLeft < 60
                  ? "bg-yellow-50 border-yellow-300 dark:bg-yellow-950/30 dark:border-yellow-800 animate-pulse"
                  : "bg-blue-50 border-blue-300 dark:bg-blue-950/30 dark:border-blue-800"
            )}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-3">
                <Clock
                  className={cn(
                    "h-7 w-7",
                    isExpired
                      ? "text-red-600"
                      : timeLeft < 60
                        ? "text-yellow-600"
                        : "text-blue-600"
                  )}
                />
                <div className="text-center">
                  <p
                    className={cn(
                      "text-3xl font-bold font-mono",
                      isExpired
                        ? "text-red-700"
                        : timeLeft < 60
                          ? "text-yellow-700"
                          : "text-blue-700"
                    )}
                  >
                    {isExpired ? "Expirado" : formatTime(timeLeft)}
                  </p>
                  {!isExpired && (
                    <p className="text-sm text-gray-600">
                      Tempo restante para pagamento
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status de verificação */}
        {isChecking && (
          <div className="flex items-center justify-center gap-2 mb-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
            <p className="text-blue-700 dark:text-blue-300 font-medium">
              Verificando pagamento...
            </p>
          </div>
        )}

        {/* Toggle QR Code / Código */}
        <div className="flex gap-2 p-1 bg-white dark:bg-gray-800 rounded-xl mb-6 shadow-sm">
          <button
            onClick={() => setShowQRCode(true)}
            className={cn(
              "flex-1 py-4 px-6 rounded-lg font-semibold text-base transition-all",
              showQRCode
                ? "bg-green-500 text-white shadow-md"
                : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
            )}
          >
            <QrCode className="h-5 w-5 inline mr-2" />
            QR Code
          </button>
          <button
            onClick={() => setShowQRCode(false)}
            className={cn(
              "flex-1 py-4 px-6 rounded-lg font-semibold text-base transition-all",
              !showQRCode
                ? "bg-green-500 text-white shadow-md"
                : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
            )}
          >
            <Copy className="h-5 w-5 inline mr-2" />
            Copia e Cola
          </button>
        </div>

        {/* QR Code */}
        {showQRCode && (
          <Card className="mb-6 shadow-xl">
            <CardContent className="p-8 md:p-12">
              <div className="text-center space-y-6">
                {qrCodeImage ? (
                  <div className="inline-block p-6 bg-white rounded-3xl shadow-2xl">
                    <img
                      src={qrCodeImage}
                      alt="QR Code PIX"
                      className="w-72 h-72 md:w-96 md:h-96 mx-auto"
                    />
                  </div>
                ) : (
                  <div className="w-72 h-72 md:w-96 md:h-96 mx-auto bg-gray-100 dark:bg-gray-800 rounded-3xl flex items-center justify-center">
                    <RefreshCw className="h-16 w-16 text-gray-400 animate-spin" />
                  </div>
                )}
                <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                  Abra o app do seu banco e escaneie o QR Code
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Código Copia e Cola */}
        {!showQRCode && (
          <Card className="mb-6 shadow-xl">
            <CardContent className="p-8 md:p-12 space-y-6">
              <div>
                <label className="text-base font-semibold block mb-4 text-gray-700 dark:text-gray-300">
                  Código PIX Copia e Cola:
                </label>
                <div className="p-5 bg-gray-50 dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 overflow-hidden">
                  <code className="text-sm font-mono break-all block text-gray-800 dark:text-gray-200">
                    {pixData.qrCode}
                  </code>
                </div>
              </div>

              <Button
                onClick={handleCopyCode}
                className={cn(
                  "w-full h-14 text-lg font-bold shadow-lg hover:shadow-xl transition-all",
                  copied ? "bg-green-600" : "bg-green-500"
                )}
              >
                {copied ? (
                  <>
                    <Check className="h-6 w-6 mr-2" />
                    Código Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-6 w-6 mr-2" />
                    Copiar Código PIX
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Instruções */}
        <Card className="mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-2 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-start gap-4">
              <Smartphone className="h-8 w-8 text-blue-600 flex-shrink-0 mt-1" />
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Como pagar:
                </h3>
                <ol className="space-y-3 text-base text-gray-700 dark:text-gray-300">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold">
                      1
                    </span>
                    <span className="pt-0.5">
                      Abra o app do seu banco ou carteira digital
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold">
                      2
                    </span>
                    <span className="pt-0.5">
                      Escolha <strong>Pix Copia e Cola</strong> ou{" "}
                      <strong>Ler QR Code</strong>
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold">
                      3
                    </span>
                    <span className="pt-0.5">
                      Cole o código ou escaneie o QR Code acima
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold">
                      4
                    </span>
                    <span className="pt-0.5">
                      Confirme o pagamento e pronto! ✅ Aprovação automática
                    </span>
                  </li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Aviso de segurança */}
        <div className="flex items-center gap-3 p-5 bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-200 dark:border-green-800 mb-6">
          <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
          <p className="text-sm md:text-base text-green-700 dark:text-green-300 font-medium">
            Pagamento 100% seguro e aprovação instantânea
          </p>
        </div>

        {/* Aviso de expiração */}
        {isExpired && (
          <Card className="bg-red-50 dark:bg-red-950/20 border-2 border-red-200 dark:border-red-800">
            <CardContent className="p-6">
              <div className="flex gap-3">
                <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-red-700 dark:text-red-300 font-bold mb-2">
                    Código PIX Expirado
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                    Este código expirou. Clique no botão abaixo para gerar um
                    novo código PIX.
                  </p>
                  <Button
                    onClick={() => navigate(`/checkout/${orderId}`)}
                    variant="outline"
                    className="border-red-600 text-red-600 hover:bg-red-50"
                  >
                    <RefreshCw className="h-5 w-5 mr-2" />
                    Gerar Novo Código
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PixPaymentPage;
