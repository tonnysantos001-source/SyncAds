import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Copy,
  Check,
  QrCode as QrCodeIcon,
  Clock,
  Smartphone,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Shield,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { QRCodeSVG } from "react-qr-code";

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
    checkoutButtonBackgroundColor?: string;
  };
}

export const PixPayment: React.FC<PixPaymentProps> = ({
  pixData,
  onPaymentConfirmed,
  theme = {},
}) => {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isChecking, setIsChecking] = useState(false);
  const [showQRCode, setShowQRCode] = useState(true);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

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
    if (!pixData || paymentSuccess) return;

    const checkPayment = async () => {
      setIsChecking(true);
      // Simulação - substituir por chamada real à API
      setTimeout(() => {
        setIsChecking(false);
      }, 1000);
    };

    const interval = setInterval(checkPayment, 5000);
    return () => clearInterval(interval);
  }, [pixData, paymentSuccess]);

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
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12 px-4"
      >
        <motion.div
          animate={{
            rotate: [0, 360],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 mb-4 shadow-2xl"
        >
          <QrCodeIcon className="h-10 w-10 text-white" />
        </motion.div>
        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl md:text-2xl font-bold mb-2 bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent"
        >
          Gerando código PIX...
        </motion.h3>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-sm md:text-base opacity-70"
          style={{ color: theme.textColor }}
        >
          Aguarde enquanto preparamos seu pagamento seguro
        </motion.p>
      </motion.div>
    );
  }

  const isExpired = timeLeft <= 0 && pixData.expiresAt;
  const isUrgent = timeLeft > 0 && timeLeft < 60;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4 md:space-y-6 max-w-2xl mx-auto px-2 md:px-4"
    >
      {/* Header com valor e status */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-center space-y-3"
      >
        <motion.div
          whileHover={{ scale: 1.05, rotate: 5 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 shadow-2xl mb-3 relative"
        >
          <QrCodeIcon className="h-8 w-8 md:h-10 md:w-10 text-white relative z-10" />
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-0 bg-green-400 rounded-2xl blur-xl"
          />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent"
        >
          Pague com PIX
        </motion.h2>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-2 border-green-200 dark:border-green-800"
        >
          <Sparkles className="h-5 w-5 text-green-600" />
          <span className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            R$ {pixData.amount.toFixed(2)}
          </span>
          <Sparkles className="h-5 w-5 text-green-600" />
        </motion.div>
      </motion.div>

      {/* Timer */}
      <AnimatePresence mode="wait">
        {pixData.expiresAt && (
          <motion.div
            key={isExpired ? "expired" : "active"}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ delay: 0.4 }}
            className={cn(
              "relative overflow-hidden flex items-center justify-center gap-3 p-5 md:p-6 rounded-2xl border-2 transition-all shadow-lg",
              isExpired
                ? "bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border-red-300 dark:border-red-800"
                : isUrgent
                  ? "bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 border-yellow-300 dark:border-yellow-800"
                  : "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-300 dark:border-blue-800",
            )}
          >
            {/* Animação de fundo */}
            <motion.div
              animate={{
                x: ["-100%", "100%"],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
              }}
              className={cn(
                "absolute inset-0 w-full h-full opacity-20",
                isExpired
                  ? "bg-gradient-to-r from-transparent via-red-400 to-transparent"
                  : isUrgent
                    ? "bg-gradient-to-r from-transparent via-yellow-400 to-transparent"
                    : "bg-gradient-to-r from-transparent via-blue-400 to-transparent",
              )}
            />

            <motion.div
              animate={isUrgent ? { rotate: [0, -5, 5, -5, 0] } : {}}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
            >
              <Clock
                className={cn(
                  "h-7 w-7 md:h-8 md:w-8 relative z-10",
                  isExpired
                    ? "text-red-600 dark:text-red-400"
                    : isUrgent
                      ? "text-yellow-600 dark:text-yellow-400"
                      : "text-blue-600 dark:text-blue-400",
                )}
              />
            </motion.div>

            <div className="flex flex-col md:flex-row md:items-center md:gap-2 relative z-10">
              <motion.span
                key={timeLeft}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className={cn(
                  "font-mono text-2xl md:text-3xl font-bold tracking-wider",
                  isExpired
                    ? "text-red-700 dark:text-red-300"
                    : isUrgent
                      ? "text-yellow-700 dark:text-yellow-300"
                      : "text-blue-700 dark:text-blue-300",
                )}
              >
                {isExpired ? "EXPIRADO" : formatTime(timeLeft)}
              </motion.span>
              {!isExpired && (
                <span
                  className={cn(
                    "text-sm md:text-base font-semibold",
                    isUrgent
                      ? "text-yellow-600 dark:text-yellow-400"
                      : "text-blue-600 dark:text-blue-400",
                  )}
                >
                  {isUrgent ? "⚠️ Últimos segundos!" : "para pagar"}
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle QR Code / Código */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="relative flex gap-2 p-1.5 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-inner"
      >
        <motion.div
          animate={{
            x: showQRCode ? 0 : "calc(100% + 8px)",
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="absolute inset-y-1.5 left-1.5 right-1.5 w-[calc(50%-4px)] bg-white dark:bg-gray-950 rounded-xl shadow-lg"
        />

        <button
          onClick={() => setShowQRCode(true)}
          className={cn(
            "relative z-10 flex-1 py-4 px-4 rounded-xl font-bold text-sm md:text-base transition-all flex items-center justify-center gap-2",
            showQRCode
              ? "text-green-600 dark:text-green-400"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100",
          )}
        >
          <QrCodeIcon className="h-5 w-5" />
          QR Code
        </button>

        <button
          onClick={() => setShowQRCode(false)}
          className={cn(
            "relative z-10 flex-1 py-4 px-4 rounded-xl font-bold text-sm md:text-base transition-all flex items-center justify-center gap-2",
            !showQRCode
              ? "text-green-600 dark:text-green-400"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100",
          )}
        >
          <Copy className="h-5 w-5" />
          Código
        </button>
      </motion.div>

      {/* Conteúdo Animado */}
      <AnimatePresence mode="wait">
        {showQRCode ? (
          <motion.div
            key="qrcode"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="overflow-hidden border-2 shadow-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
              <CardContent className="p-6 md:p-10">
                <div className="text-center space-y-6">
                  {/* QR Code com animação */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="inline-block relative"
                  >
                    {/* Círculos decorativos animados */}
                    <motion.div
                      animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.3, 0.6, 0.3],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="absolute -inset-4 bg-gradient-to-r from-green-400 to-emerald-400 rounded-3xl blur-2xl"
                    />

                    <div className="relative p-6 md:p-8 bg-white rounded-3xl shadow-2xl">
                      <QRCodeSVG
                        value={pixData.qrCode}
                        size={256}
                        level="H"
                        includeMargin={true}
                        className="w-full h-auto max-w-[280px] md:max-w-[320px]"
                        fgColor="#000000"
                        bgColor="#FFFFFF"
                      />
                    </div>

                    {/* Badge de sucesso animado */}
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.5, type: "spring" }}
                      className="absolute -bottom-3 -right-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full p-3 shadow-xl"
                    >
                      <Zap className="h-6 w-6 text-white" />
                    </motion.div>
                  </motion.div>

                  {/* Status de verificação */}
                  <AnimatePresence>
                    {isChecking && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center justify-center gap-2 text-sm font-semibold"
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"
                        />
                        <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                          Verificando pagamento...
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Instrução */}
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-base md:text-lg font-semibold text-gray-700 dark:text-gray-300"
                  >
                    📱 Abra o app do seu banco e escaneie o código
                  </motion.p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="code"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="overflow-hidden border-2 shadow-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
              <CardContent className="p-6 md:p-8 space-y-5">
                <div>
                  <label className="text-sm md:text-base font-bold block mb-3 text-gray-700 dark:text-gray-300">
                    💳 Código PIX Copia e Cola:
                  </label>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="relative group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity" />
                    <div className="relative p-5 md:p-6 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 overflow-hidden">
                      <code className="text-xs md:text-sm font-mono break-all block text-gray-700 dark:text-gray-300">
                        {pixData.qrCode}
                      </code>
                    </div>
                  </motion.div>
                </div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={handleCopyCode}
                    className="relative overflow-hidden w-full gap-3 h-14 md:h-16 text-base md:text-lg font-bold shadow-xl hover:shadow-2xl transition-all group"
                    style={{
                      backgroundColor: copied
                        ? "#10b981"
                        : theme.checkoutButtonBackgroundColor || "#22c55e",
                      color: theme.primaryButtonTextColor || "#ffffff",
                    }}
                  >
                    {/* Efeito de brilho */}
                    <motion.div
                      animate={{
                        x: [-200, 400],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 1,
                      }}
                      className="absolute inset-0 w-20 h-full bg-white/30 skew-x-12"
                    />

                    <AnimatePresence mode="wait">
                      {copied ? (
                        <motion.div
                          key="copied"
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0, rotate: 180 }}
                          className="flex items-center gap-3"
                        >
                          <Check className="h-6 w-6" />
                          <span>Código Copiado!</span>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="copy"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="flex items-center gap-3"
                        >
                          <Copy className="h-6 w-6" />
                          <span>Copiar Código PIX</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instruções */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20 border-2 border-blue-200 dark:border-blue-800 shadow-xl">
          <CardContent className="p-6 md:p-7">
            <div className="flex items-start gap-4">
              <motion.div
                whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
                transition={{ duration: 0.5 }}
                className="shrink-0 mt-1"
              >
                <Smartphone className="h-8 w-8 md:h-10 md:w-10 text-blue-600 dark:text-blue-400" />
              </motion.div>
              <div className="space-y-4">
                <h4 className="font-bold text-lg md:text-xl text-blue-900 dark:text-blue-100">
                  📲 Como pagar com PIX:
                </h4>
                <ol className="space-y-3 text-sm md:text-base text-gray-700 dark:text-gray-300">
                  {[
                    "Abra o app do seu banco ou carteira digital",
                    'Escolha "Pix Copia e Cola" ou "Ler QR Code"',
                    "Cole o código ou escaneie o QR Code acima",
                    "Confirme o pagamento e pronto! ✅ Aprovação instantânea",
                  ].map((text, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + index * 0.1 }}
                      className="flex gap-3"
                    >
                      <motion.span
                        whileHover={{ scale: 1.2, rotate: 360 }}
                        transition={{ type: "spring" }}
                        className="flex-shrink-0 flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm md:text-base font-bold shadow-lg"
                      >
                        {index + 1}
                      </motion.span>
                      <span className="pt-1">{text}</span>
                    </motion.li>
                  ))}
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Aviso de segurança */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.9 }}
        className="relative overflow-hidden flex items-center gap-3 p-5 md:p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-2xl border-2 border-green-200 dark:border-green-800 shadow-lg"
      >
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Shield className="h-6 w-6 md:h-7 md:w-7 text-green-600 dark:text-green-400 flex-shrink-0" />
        </motion.div>
        <p className="text-sm md:text-base text-green-700 dark:text-green-300 font-bold">
          🔒 Pagamento 100% seguro • Aprovação instantânea • Sem taxas extras
        </p>
      </motion.div>

      {/* Aviso de expiração */}
      <AnimatePresence>
        {isExpired && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 border-2 border-red-300 dark:border-red-800 shadow-xl">
              <CardContent className="p-6 md:p-7">
                <div className="flex gap-4">
                  <motion.div
                    animate={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{
                      duration: 0.5,
                      repeat: Infinity,
                      repeatDelay: 2,
                    }}
                  >
                    <AlertCircle className="h-7 w-7 text-red-600 dark:text-red-400 flex-shrink-0" />
                  </motion.div>
                  <div className="space-y-2">
                    <p className="text-red-700 dark:text-red-300 font-bold text-base md:text-lg">
                      ⚠️ Código PIX Expirado
                    </p>
                    <p className="text-sm md:text-base text-red-600 dark:text-red-400">
                      Este código expirou. Por favor, volte e gere um novo
                      código PIX para completar seu pagamento.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
