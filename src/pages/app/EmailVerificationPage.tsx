import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Mail,
  CheckCircle2,
  AlertCircle,
  Send,
  Loader2,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabase";

export default function EmailVerificationPage() {
  const [isVerified, setIsVerified] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [lastSentAt, setLastSentAt] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(0);

  const { user } = useAuthStore();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkEmailVerificationStatus();
  }, [user?.id]);

  // Countdown para reenvio
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const checkEmailVerificationStatus = async () => {
    if (!user?.id) return;

    setIsChecking(true);
    try {
      const { data: userData } = await supabase
        .from("User")
        .select("emailVerified")
        .eq("id", user.id)
        .single();

      setIsVerified(userData?.emailVerified === true);
    } catch (error) {
      console.error("Erro ao verificar status de email:", error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSendVerificationEmail = async () => {
    if (!user?.email) {
      toast({
        title: "Erro",
        description: "Email não encontrado",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      // Enviar email de verificação via Supabase Auth
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: user.email,
      });

      if (error) throw error;

      setLastSentAt(new Date());
      setCountdown(60); // 60 segundos de cooldown

      toast({
        title: "Email enviado!",
        description: `Enviamos um link de verificação para ${user.email}`,
      });
    } catch (error: any) {
      console.error("Erro ao enviar email:", error);
      toast({
        title: "Erro ao enviar email",
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950 p-4 sm:p-8">
      {/* Background Pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
          className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-pink-500/30 to-purple-500/30 rounded-full blur-3xl"
        />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header com botão voltar */}
        <Button
          variant="ghost"
          onClick={() => navigate("/onboarding")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Verificação de Email
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Confirme seu endereço de email para ativar todos os recursos
          </p>
        </motion.div>

        {isVerified ? (
          // Email já verificado
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-2 border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
              <CardHeader className="text-center pb-6">
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-green-500 rounded-full blur-xl opacity-50" />
                    <div className="relative h-20 w-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="h-10 w-10 text-white" />
                    </div>
                  </div>
                </div>
                <CardTitle className="text-2xl text-green-700 dark:text-green-400">
                  Email Verificado!
                </CardTitle>
                <CardDescription className="text-base">
                  Seu email <strong>{user?.email}</strong> foi verificado com
                  sucesso
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-6 mb-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                    ✨ Recursos Ativados:
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    <li className="flex items-center justify-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Acesso completo ao assistente de IA
                    </li>
                    <li className="flex items-center justify-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Notificações por email habilitadas
                    </li>
                    <li className="flex items-center justify-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Recuperação de senha disponível
                    </li>
                    <li className="flex items-center justify-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Relatórios e exportações ativados
                    </li>
                  </ul>
                </div>
                <Button
                  onClick={() => navigate("/onboarding")}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                >
                  Continuar Configuração
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          // Email pendente de verificação
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-2 border-orange-200 dark:border-orange-800">
              <CardHeader className="text-center pb-6">
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-orange-500 rounded-full blur-xl opacity-50" />
                    <div className="relative h-20 w-20 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center">
                      <AlertCircle className="h-10 w-10 text-white" />
                    </div>
                  </div>
                </div>
                <CardTitle className="text-2xl text-gray-900 dark:text-white">
                  Verifique seu Email
                </CardTitle>
                <CardDescription className="text-base">
                  Enviamos um link de verificação para{" "}
                  <strong className="text-gray-900 dark:text-white">
                    {user?.email}
                  </strong>
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Instruções */}
                <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Mail className="h-5 w-5 text-blue-600" />
                    Como verificar:
                  </h3>
                  <ol className="space-y-2 text-sm text-gray-700 dark:text-gray-300 list-decimal list-inside">
                    <li>Abra sua caixa de entrada de email</li>
                    <li>
                      Procure por um email de <strong>SyncAds</strong>
                    </li>
                    <li>Clique no link de verificação</li>
                    <li>Volte aqui e clique em "Verificar Status"</li>
                  </ol>
                </div>

                {/* Avisos */}
                <div className="bg-yellow-50 dark:bg-yellow-950/30 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <strong>Não recebeu o email?</strong>
                    <br />
                    Verifique sua pasta de spam ou lixo eletrônico. Você também
                    pode reenviar o email clicando no botão abaixo.
                  </p>
                </div>

                {/* Último envio */}
                {lastSentAt && (
                  <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                    Último email enviado às{" "}
                    {lastSentAt.toLocaleTimeString("pt-BR")}
                  </p>
                )}

                {/* Botões */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={checkEmailVerificationStatus}
                    variant="outline"
                    className="flex-1 border-2"
                    disabled={isChecking}
                  >
                    {isChecking ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verificando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Verificar Status
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleSendVerificationEmail}
                    disabled={isSending || countdown > 0}
                    className="flex-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : countdown > 0 ? (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Aguarde {countdown}s
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Reenviar Email
                      </>
                    )}
                  </Button>
                </div>

                {/* Link para continuar sem verificar */}
                <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-800">
                  <button
                    onClick={() => navigate("/onboarding")}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white underline"
                  >
                    Continuar sem verificar (não recomendado)
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Card informativo */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={{ delay: 0.4 }}
          className="mt-6"
        >
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200 dark:border-purple-800">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-purple-600" />
                Por que verificar meu email?
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
              <p>
                🔒{" "}
                <strong>Segurança:</strong> Garante que apenas você tem acesso
                à sua conta
              </p>
              <p>
                🔔{" "}
                <strong>Notificações:</strong> Receba alertas importantes sobre
                sua conta
              </p>
              <p>
                🔄{" "}
                <strong>Recuperação:</strong> Possibilita a recuperação de
                senha quando necessário
              </p>
              <p>
                ✨{" "}
                <strong>Recursos:</strong> Libera funcionalidades avançadas da
                plataforma
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
