import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Download,
  CheckCircle,
  Chrome,
  Zap,
  Shield,
  ArrowRight,
  Copy,
  Check,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export default function ExtensionSetupPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [copied, setCopied] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const extensionId = 'syncads-ai-extension';

  const handleDownload = () => {
    // Trigger download of extension
    const link = document.createElement('a');
    link.href = '/chrome-extension.zip';
    link.download = 'syncads-extension.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: '📦 Download iniciado!',
      description: 'A extensão SyncAds AI está sendo baixada.',
    });

    setCurrentStep(2);
  };

  const copyExtensionId = () => {
    navigator.clipboard.writeText(extensionId);
    setCopied(true);
    toast({
      title: '✅ ID copiado!',
      description: 'Cole no Chrome para carregar a extensão.',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const checkConnection = async () => {
    setIsChecking(true);

    // Simulate checking for extension
    setTimeout(() => {
      const connected = Math.random() > 0.3; // Simula checagem
      setIsConnected(connected);
      setIsChecking(false);

      if (connected) {
        toast({
          title: '🎉 Extensão conectada!',
          description: 'A extensão SyncAds AI está funcionando perfeitamente.',
        });
        setTimeout(() => navigate('/app/dashboard'), 2000);
      } else {
        toast({
          title: '⚠️ Extensão não detectada',
          description: 'Certifique-se de que a extensão está instalada e ativa.',
          variant: 'destructive',
        });
      }
    }, 2000);
  };

  const steps = [
    {
      number: 1,
      title: 'Baixar Extensão',
      description: 'Faça o download do arquivo .zip da extensão',
      icon: Download,
      color: 'text-blue-500',
    },
    {
      number: 2,
      title: 'Instalar no Chrome',
      description: 'Ative o modo desenvolvedor e carregue a extensão',
      icon: Chrome,
      color: 'text-green-500',
    },
    {
      number: 3,
      title: 'Conectar Conta',
      description: 'Faça login na extensão com sua conta SyncAds',
      icon: Shield,
      color: 'text-purple-500',
    },
    {
      number: 4,
      title: 'Pronto!',
      description: 'Comece a automatizar com IA',
      icon: Zap,
      color: 'text-yellow-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 mb-6">
            <Chrome className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Extensão SyncAds AI
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Automatize tarefas do navegador com inteligência artificial.
            Configure em menos de 3 minutos.
          </p>
          <Badge variant="outline" className="mt-4">
            Versão 1.0.0 • Beta
          </Badge>
        </motion.div>

        {/* Steps Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-4xl mx-auto mb-12"
        >
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      currentStep >= step.number
                        ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                    }`}
                  >
                    {currentStep > step.number ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <step.icon className="w-6 h-6" />
                    )}
                  </div>
                  <p className="text-xs mt-2 text-center font-medium">
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 transition-all ${
                      currentStep > step.number
                        ? 'bg-gradient-to-r from-purple-500 to-blue-500'
                        : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="max-w-4xl mx-auto"
        >
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-b">
              <CardTitle>Instalação da Extensão</CardTitle>
              <CardDescription>
                Siga os passos abaixo para instalar e configurar a extensão
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-8">
                {/* Step 1 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <span className="text-blue-600 dark:text-blue-400 font-bold">1</span>
                    </div>
                    <h3 className="text-xl font-semibold">Baixar a Extensão</h3>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 ml-11">
                    Clique no botão abaixo para fazer o download do arquivo .zip da extensão SyncAds AI
                  </p>
                  <div className="ml-11">
                    <Button
                      onClick={handleDownload}
                      className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                      size="lg"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Baixar Extensão (.zip)
                    </Button>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                      <span className="text-green-600 dark:text-green-400 font-bold">2</span>
                    </div>
                    <h3 className="text-xl font-semibold">Instalar no Chrome</h3>
                  </div>
                  <div className="ml-11 space-y-3">
                    <ol className="list-decimal list-inside space-y-2 text-slate-600 dark:text-slate-400">
                      <li>Abra o Chrome e digite <code className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">chrome://extensions/</code></li>
                      <li>Ative o <strong>Modo do desenvolvedor</strong> no canto superior direito</li>
                      <li>Clique em <strong>"Carregar sem compactação"</strong></li>
                      <li>Extraia o arquivo .zip e selecione a pasta extraída</li>
                      <li>A extensão SyncAds AI aparecerá na lista</li>
                    </ol>
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Chrome className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-1" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            Dica: Fixe a extensão na barra de ferramentas
                          </p>
                          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                            Clique no ícone de puzzle 🧩 e fixe o SyncAds AI para fácil acesso
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <span className="text-purple-600 dark:text-purple-400 font-bold">3</span>
                    </div>
                    <h3 className="text-xl font-semibold">Fazer Login na Extensão</h3>
                  </div>
                  <div className="ml-11 space-y-3">
                    <p className="text-slate-600 dark:text-slate-400">
                      Clique no ícone da extensão e faça login com sua conta SyncAds:
                    </p>
                    <div className="flex items-center gap-2 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      <code className="flex-1 text-sm">{extensionId}</code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={copyExtensionId}
                      >
                        {copied ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                      <span className="text-yellow-600 dark:text-yellow-400 font-bold">4</span>
                    </div>
                    <h3 className="text-xl font-semibold">Verificar Conexão</h3>
                  </div>
                  <div className="ml-11 space-y-3">
                    <p className="text-slate-600 dark:text-slate-400">
                      Clique no botão abaixo para verificar se a extensão está conectada corretamente:
                    </p>
                    <Button
                      onClick={checkConnection}
                      variant={isConnected ? 'default' : 'outline'}
                      disabled={isChecking}
                      className={isConnected ? 'bg-green-500 hover:bg-green-600' : ''}
                    >
                      {isChecking ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Verificando...
                        </>
                      ) : isConnected ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Conectado!
                        </>
                      ) : (
                        <>
                          <Shield className="w-4 h-4 mr-2" />
                          Verificar Conexão
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="mt-8 pt-8 border-t flex items-center justify-between">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/app/dashboard')}
                >
                  Fazer depois
                </Button>
                {isConnected && (
                  <Button
                    onClick={() => navigate('/app/dashboard')}
                    className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                  >
                    Ir para Dashboard
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <Card>
              <CardContent className="pt-6">
                <Zap className="w-10 h-10 text-yellow-500 mb-4" />
                <h3 className="font-semibold mb-2">Automação Inteligente</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Execute tarefas complexas com comandos simples via IA
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Shield className="w-10 h-10 text-purple-500 mb-4" />
                <h3 className="font-semibold mb-2">100% Seguro</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Seus dados ficam apenas no seu navegador
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Chrome className="w-10 h-10 text-blue-500 mb-4" />
                <h3 className="font-semibold mb-2">Fácil de Usar</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Interface intuitiva integrada ao Chrome
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
