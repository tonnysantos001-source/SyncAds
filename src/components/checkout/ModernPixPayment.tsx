import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy,
  Check,
  QrCode as QrCodeIcon,
  Clock,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import QRCode from "react-qr-code";
import { useToast } from "@/components/ui/use-toast";

interface ModernPixPaymentProps {
  pixCode: string;
  amount: number;
  expiresAt?: Date | string;
  onPaymentConfirmed?: () => void;
  transactionId?: string;
  orderData?: {
    orderId: string;
    customerName?: string;
  };
}

export const ModernPixPayment: React.FC<ModernPixPaymentProps> = ({
  pixCode,
  amount,
  expiresAt,
  onPaymentConfirmed,
  transactionId,
  orderData,
}) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isPaid, setIsPaid] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  // Calcular tempo restante
  useEffect(() => {
    if (!expiresAt) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry =
        typeof expiresAt === "string" ? new Date(expiresAt).getTime() : expiresAt.getTime();
      const diff = expiry - now;
      return Math.max(0, Math.floor(diff / 1000));
    };

    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
      if (newTimeLeft <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  // Formatar tempo
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Copiar código PIX
  const handleCopyPixCode = async () => {
    try {
      await navigator.clipboard.writeText(pixCode);
      setCopied(true);
      toast({
        title: "Código PIX copiado!",
        description: "Cole no seu aplicativo de pagamento",
      });
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Tente selecionar e copiar manualmente",
        variant: "destructive",
      });
    }
  };

  // Verificar pagamento (simulado - você deve integrar com sua API)
  const checkPaymentStatus = async () => {
    setIsChecking(true);
    try {
      // TODO: Integrar com sua API de verificação de pagamento
      // const response = await fetch(`/api/payment/check/${transactionId}`);
      // const { paid } = await response.json();
      // if (paid) {
      //   setIsPaid(true);
      //   onPaymentConfirmed?.();
      // }

      // Simulação temporária
      setTimeout(() => {
        setIsChecking(false);
      }, 2000);
    } catch (error) {
      console.error("Erro ao verificar pagamento:", error);
      setIsChecking(false);
    }
  };

  // Animação de sucesso
  if (isPaid) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl"
        >
          <CheckCircle2 className="h-12 w-12 text-white" strokeWidth={3} />
        </motion.div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Pagamento Confirmado!
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Seu pedido está sendo processado
        </p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            size="lg"
            className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
            onClick={onPaymentConfirmed}
          >
            Continuar
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com valor */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="inline-flex items-center gap-2 mb-4">
          <div className="p-2 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg">
            <QrCodeIcon className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Pagamento via PIX
          </h2>
        </div>
        <div className="flex items-center justify-center gap-2">
          <span className="text-5xl font-bold text-transparent bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text">
            R$ {amount.toFixed(2).replace(".", ",")}
          </span>
        </div>
      </motion.div>

      {/* Timer de expiração */}
      {expiresAt && timeLeft > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card
            className={cn(
              "p-4 border-2 transition-all",
              timeLeft < 300
                ? "border-red-500 bg-red-50 dark:bg-red-950/20"
                : "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20"
            )}
          >
            <div className="flex items-center justify-center gap-3">
              <Clock
                className={cn(
                  "h-5 w-5",
                  timeLeft < 300 ? "text-red-600" : "text-yellow-600"
                )}
              />
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tempo restante para pagamento
                </p>
                <p
                  className={cn(
                    "text-2xl font-bold font-mono",
                    timeLeft < 300 ? "text-red-600" : "text-yellow-600"
                  )}
                >
                  {formatTime(timeLeft)}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* QR Code */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="p-8 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border-2 border-gray-200 dark:border-gray-700">
          <div className="space-y-4">
            <div className="flex items-center justify-center p-6 bg-white rounded-2xl shadow-lg">
              <QRCode
                value={pixCode}
                size={280}
                level="H"
                fgColor="#000000"
                bgColor="#FFFFFF"
              />
            </div>
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              Escaneie o QR Code com o app do seu banco
            </p>
          </div>
        </Card>
      </motion.div>

      {/* Código PIX */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Código PIX Copia e Cola
            </h3>
            <Sparkles className="h-4 w-4 text-violet-500" />
          </div>
          <div className="relative">
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 overflow-x-auto">
              <code className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all">
                {pixCode}
              </code>
            </div>
          </div>
          <Button
            onClick={handleCopyPixCode}
            className="w-full h-12 text-base font-semibold"
            variant={copied ? "default" : "outline"}
          >
            {copied ? (
              <>
                <Check className="h-5 w-5 mr-2" />
                Código Copiado!
              </>
            ) : (
              <>
                <Copy className="h-5 w-5 mr-2" />
                Copiar Código PIX
              </>
            )}
          </Button>
        </Card>
      </motion.div>

      {/* Instruções */}
      <AnimatePresence>
        {showInstructions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    Como pagar com PIX
                  </h4>
                </div>
                <button
                  onClick={() => setShowInstructions(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ×
                </button>
              </div>
              <ol className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    1
                  </span>
                  <span>
                    Abra o app do seu banco e escolha a opção <strong>Pagar com PIX</strong>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    2
                  </span>
                  <span>
                    Escaneie o <strong>QR Code</strong> acima ou copie o código PIX
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    3
                  </span>
                  <span>
                    Confirme as informações e <strong>finalize o pagamento</strong>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    ✓
                  </span>
                  <span>
                    A confirmação é <strong>automática e instantânea!</strong>
                  </span>
                </li>
              </ol>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botão de verificação */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <Button
          onClick={checkPaymentStatus}
          disabled={isChecking}
          variant="outline"
          className="w-full h-12"
        >
          {isChecking ? (
            <>
              <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
              Verificando pagamento...
            </>
          ) : (
            <>
              <RefreshCw className="h-5 w-5 mr-2" />
              Já paguei - Verificar pagamento
            </>
          )}
        </Button>
      </motion.div>

      {/* Aviso de segurança */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 justify-center"
      >
        <CheckCircle2 className="h-4 w-4 text-green-500" />
        <span>Pagamento 100% seguro e criptografado</span>
      </motion.div>
    </div>
  );
};

