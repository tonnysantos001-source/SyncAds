import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Copy,
  Check,
  QrCode,
  Clock,
  Smartphone,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import QRCode from "qrcode";

interface PixPaymentProps {
  pixData?: {
    qrCode: string;
    qrCodeBase64?: string;
    expiresAt?: string;
    amount: number;
  };
  onPaymentConfirmed?: () => void;
  theme?: {
    primaryButtonBackgroundColor?: string;
    primaryButtonTextColor?: string;
    textColor?: string;
    headingColor?: string;
    backgroundColor?: string;
  };
}

export const PixPayment: React.FC<PixPaymentProps> = ({
  pixData,
  onPaymentConfirmed,
  theme = {},
}) => {
  const [copied, setCopied] = useState(false);
  const [qrCodeImage, setQrCodeImage] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isChecking, setIsChecking] = useState(false);
  const [showQRCode, setShowQRCode] = useState(true);

  // Gerar QR Code a partir do código PIX
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
    } else if (pixData?.qrCodeBase64) {
      setQrCodeImage(pixData.qrCodeBase64);
    }
  }, [pixData]);

  // Calcular tempo restante
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
    if (!pixData) return;

    const checkPayment = async () => {
      setIsChecking(true);
      // Simulação - substituir por chamada real à API
      setTimeout(() => {
        setIsChecking(false);
      }, 1000);
    };

    const interval = setInterval(checkPayment, 5000);
    return () => clearInterval(interval);
  }, [pixData]);

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
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error("Erro ao copiar código:", err);
    }
  };

  if (!pixData) {
    return (
      <div className="text-center py-12 px-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 mb-4 animate-pulse">
          <QrCode className="h-10 w-10 text-white" />
        </div>
        <h3
          className="text-xl md:text-2xl font-bold mb-2"
          style={{ color: theme.headingColor }}
        >
          Gerando código PIX...
        </h3>
        <p
          className="text-sm md:text-base opacity-70"
          style={{ color: theme.textColor }}
        >
          Aguarde enquanto preparamos seu pagamento
        </p>
      </div>
    );
  }

  const isExpired = timeLeft <= 0 && pixData.expiresAt;

  return (
    <div className="space-y-4 md:space-y-6 max-w-2xl mx-auto px-2 md:px-0">
      {/* Header com valor e status */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-lg mb-3">
          <QrCode className="h-8 w-8 md:h-10 md:w-10 text-white" />
        </div>
        <h2
          className="text-2xl md:text-3xl font-bold"
          style={{ color: theme.headingColor }}
        >
          Pague com PIX
        </h2>
        <div className="flex items-center justify-center gap-2">
          <span className="text-3xl md:text-4xl font-bold text-green-600 dark:text-green-400">
            R$ {pixData.amount.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Timer */}
      {pixData.expiresAt && (
        <div
          className={cn(
            "flex items-center justify-center gap-3 p-4 md:p-5 rounded-2xl border-2 transition-all shadow-sm",
            isExpired
              ? "bg-red-50 border-red-300 dark:bg-red-950/30 dark:border-red-800"
              : timeLeft < 60
                ? "bg-yellow-50 border-yellow-300 dark:bg-yellow-950/30 dark:border-yellow-800 animate-pulse"
                : "bg-blue-50 border-blue-300 dark:bg-blue-950/30 dark:border-blue-800",
          )}
        >
          <Clock
            className={cn(
              "h-6 w-6 md:h-7 md:w-7",
              isExpired
                ? "text-red-600 dark:text-red-400"
                : timeLeft < 60
                  ? "text-yellow-600 dark:text-yellow-400"
                  : "text-blue-600 dark:text-blue-400",
            )}
          />
          <div className="flex flex-col md:flex-row md:items-center md:gap-2">
            <span
              className={cn(
                "font-mono text-xl md:text-2xl font-bold",
                isExpired
                  ? "text-red-700 dark:text-red-300"
                  : timeLeft < 60
                    ? "text-yellow-700 dark:text-yellow-300"
                    : "text-blue-700 dark:text-blue-300",
              )}
            >
              {isExpired ? "Expirado" : formatTime(timeLeft)}
            </span>
            {!isExpired && (
              <span
                className={cn(
                  "text-sm md:text-base",
                  timeLeft < 60
                    ? "text-yellow-600 dark:text-yellow-400"
                    : "text-blue-600 dark:text-blue-400",
                )}
              >
                restantes
              </span>
            )}
          </div>
        </div>
      )}

      {/* Toggle QR Code / Código */}
      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
        <button
          onClick={() => setShowQRCode(true)}
          className={cn(
            "flex-1 py-3 px-4 rounded-lg font-semibold text-sm md:text-base transition-all",
            showQRCode
              ? "bg-white dark:bg-gray-900 shadow-md"
              : "hover:bg-gray-200 dark:hover:bg-gray-700",
          )}
          style={
            showQRCode
              ? { color: theme.primaryButtonBackgroundColor }
              : { color: theme.textColor }
          }
        >
          <QrCode className="h-4 w-4 md:h-5 md:w-5 inline mr-2" />
          QR Code
        </button>
        <button
          onClick={() => setShowQRCode(false)}
          className={cn(
            "flex-1 py-3 px-4 rounded-lg font-semibold text-sm md:text-base transition-all",
            !showQRCode
              ? "bg-white dark:bg-gray-900 shadow-md"
              : "hover:bg-gray-200 dark:hover:bg-gray-700",
          )}
          style={
            !showQRCode
              ? { color: theme.primaryButtonBackgroundColor }
              : { color: theme.textColor }
          }
        >
          <Copy className="h-4 w-4 md:h-5 md:w-5 inline mr-2" />
          Copia e Cola
        </button>
      </div>

      {/* QR Code Card */}
      {showQRCode && (
        <Card className="overflow-hidden border-2 shadow-lg">
          <CardContent className="p-6 md:p-8">
            <div className="text-center space-y-4">
              {/* QR Code Image */}
              {qrCodeImage ? (
                <div className="inline-block p-4 md:p-6 bg-white rounded-2xl shadow-xl">
                  <img
                    src={qrCodeImage}
                    alt="QR Code PIX"
                    className="w-64 h-64 md:w-80 md:h-80 mx-auto"
                  />
                </div>
              ) : (
                <div className="w-64 h-64 md:w-80 md:h-80 mx-auto bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
                  <RefreshCw className="h-12 w-12 text-gray-400 animate-spin" />
                </div>
              )}

              {/* Status de verificação */}
              {isChecking && (
                <div className="flex items-center justify-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                  Verificando pagamento...
                </div>
              )}

              {/* Instrução */}
              <p
                className="text-sm md:text-base font-medium"
                style={{ color: theme.textColor }}
              >
                Abra o app do seu banco e escaneie o QR Code
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Código Copia e Cola */}
      {!showQRCode && (
        <Card className="overflow-hidden border-2 shadow-lg">
          <CardContent className="p-6 md:p-8 space-y-4">
            <div>
              <label
                className="text-sm md:text-base font-semibold block mb-3"
                style={{ color: theme.textColor }}
              >
                Código PIX Copia e Cola:
              </label>

              <div
                className="p-4 md:p-5 bg-gray-50 dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 overflow-hidden"
                style={{ color: theme.textColor }}
              >
                <code className="text-xs md:text-sm font-mono break-all block">
                  {pixData.qrCode}
                </code>
              </div>
            </div>

            <Button
              onClick={handleCopyCode}
              className="w-full gap-2 h-12 md:h-14 text-base md:text-lg font-bold shadow-lg hover:shadow-xl transition-all"
              style={{
                backgroundColor: copied
                  ? "#10b981"
                  : theme.primaryButtonBackgroundColor,
                color: theme.primaryButtonTextColor,
              }}
            >
              {copied ? (
                <>
                  <Check className="h-5 w-5 md:h-6 md:w-6" />
                  Código Copiado!
                </>
              ) : (
                <>
                  <Copy className="h-5 w-5 md:h-6 md:w-6" />
                  Copiar Código PIX
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Instruções */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-2 border-blue-200 dark:border-blue-800 shadow-md">
        <CardContent className="p-5 md:p-6">
          <div className="flex items-start gap-3 md:gap-4">
            <div className="shrink-0 mt-1">
              <Smartphone className="h-7 w-7 md:h-8 md:w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="space-y-3 md:space-y-4">
              <h4
                className="font-bold text-base md:text-lg"
                style={{ color: theme.headingColor }}
              >
                Como pagar:
              </h4>
              <ol
                className="space-y-2 md:space-y-3 text-sm md:text-base"
                style={{ color: theme.textColor }}
              >
                <li className="flex gap-2 md:gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 md:w-7 md:h-7 rounded-full bg-blue-600 text-white text-xs md:text-sm font-bold">
                    1
                  </span>
                  <span className="pt-0.5">
                    Abra o app do seu banco ou carteira digital
                  </span>
                </li>
                <li className="flex gap-2 md:gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 md:w-7 md:h-7 rounded-full bg-blue-600 text-white text-xs md:text-sm font-bold">
                    2
                  </span>
                  <span className="pt-0.5">
                    Escolha <strong>Pix Copia e Cola</strong> ou{" "}
                    <strong>Ler QR Code</strong>
                  </span>
                </li>
                <li className="flex gap-2 md:gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 md:w-7 md:h-7 rounded-full bg-blue-600 text-white text-xs md:text-sm font-bold">
                    3
                  </span>
                  <span className="pt-0.5">
                    Cole o código ou escaneie o QR Code acima
                  </span>
                </li>
                <li className="flex gap-2 md:gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 md:w-7 md:h-7 rounded-full bg-blue-600 text-white text-xs md:text-sm font-bold">
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
      <div className="flex items-center gap-3 p-4 md:p-5 bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-200 dark:border-green-800">
        <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-green-600 dark:text-green-400 flex-shrink-0" />
        <p className="text-xs md:text-sm text-green-700 dark:text-green-300 font-medium">
          Pagamento 100% seguro e aprovação instantânea
        </p>
      </div>

      {/* Aviso de expiração */}
      {isExpired && (
        <Card className="bg-red-50 dark:bg-red-950/20 border-2 border-red-200 dark:border-red-800">
          <CardContent className="p-5 md:p-6">
            <div className="flex gap-3">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0" />
              <div>
                <p className="text-red-700 dark:text-red-300 font-bold mb-2 text-sm md:text-base">
                  Código PIX Expirado
                </p>
                <p className="text-sm text-red-600 dark:text-red-400">
                  Este código expirou. Clique em "Gerar Novo Pagamento" abaixo
                  para criar um novo código PIX.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
