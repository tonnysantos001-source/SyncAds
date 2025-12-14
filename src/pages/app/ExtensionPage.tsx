import { useState } from 'react';
import { Download, CheckCircle, Chrome, Shield, Zap, Brain, ArrowRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ExtensionPage() {
  const [downloadStarted, setDownloadStarted] = useState(false);

  const handleDownload = () => {
    setDownloadStarted(true);

    // Criar arquivo ZIP da extensão
    // Por enquanto, link direto para GitHub ou servidor
    const extensionUrl = '/chrome-extension.zip';

    // Criar link temporário e clicar
    const link = document.createElement('a');
    link.href = extensionUrl;
    link.download = 'syncads-extension-v1.0.0.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Resetar após 3 segundos
    setTimeout(() => setDownloadStarted(false), 3000);
  };

  const features = [
    {
      icon: <Brain className="w-6 h-6 text-purple-600" />,
      title: 'IA Integrada',
      description: 'Comandos inteligentes executados automaticamente pela IA do SyncAds'
    },
    {
      icon: <Zap className="w-6 h-6 text-yellow-600" />,
      title: 'Automação Total',
      description: 'Preencha formulários, extraia dados e navegue automaticamente'
    },
    {
      icon: <Shield className="w-6 h-6 text-green-600" />,
      title: '100% Seguro',
      description: 'Sem armazenamento de senhas ou tokens sensíveis'
    },
    {
      icon: <Chrome className="w-6 h-6 text-blue-600" />,
      title: 'Compatível',
      description: 'Funciona no Chrome, Edge, Brave e outros navegadores Chromium'
    }
  ];

  const steps = [
    {
      number: 1,
      title: 'Baixe a Extensão',
      description: 'Clique no botão de download acima'
    },
    {
      number: 2,
      title: 'Extraia o ZIP',
      description: 'Descompacte o arquivo baixado em uma pasta'
    },
    {
      number: 3,
      title: 'Abra o Chrome',
      description: 'Digite chrome://extensions/ na barra de endereços'
    },
    {
      number: 4,
      title: 'Ative Modo Desenvolvedor',
      description: 'Ative o switch no canto superior direito'
    },
    {
      number: 5,
      title: 'Carregue a Extensão',
      description: 'Clique em "Carregar sem compactação" e selecione a pasta'
    },
    {
      number: 6,
      title: 'Pronto!',
      description: 'A extensão aparecerá na barra de ferramentas'
    }
  ];

  const capabilities = [
    'Ler conteúdo de qualquer página web',
    'Preencher formulários automaticamente',
    'Clicar em botões e links',
    'Extrair dados estruturados',
    'Capturar screenshots',
    'Navegar entre páginas',
    'Executar scripts personalizados',
    'Logs em tempo real'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 rounded-full text-purple-700 dark:text-purple-300 text-sm font-semibold">
            🚀 Primeira IA do Brasil com Extensão de Navegador
          </div>

          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Extensão SyncAds AI
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Automatize suas tarefas de marketing digital com inteligência artificial.
            Execute ações complexas com comandos simples.
          </p>
        </div>

        {/* Download Card */}
        <Card className="p-8 bg-gradient-to-br from-purple-500 to-blue-600 text-white shadow-2xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-2">Baixar Extensão</h2>
              <p className="text-purple-100 mb-4">
                Versão 1.0.0 Beta - Compatível com Chrome, Edge e Brave
              </p>
              <div className="flex items-center gap-2 text-sm text-purple-100">
                <CheckCircle className="w-4 h-4" />
                <span>Gratuito para usuários SyncAds</span>
              </div>
            </div>

            <Button
              size="lg"
              onClick={handleDownload}
              className="bg-white text-purple-600 hover:bg-gray-100 shadow-xl px-8 py-6 text-lg font-bold"
              disabled={downloadStarted}
            >
              {downloadStarted ? (
                <>
                  <CheckCircle className="w-6 h-6 mr-2 animate-bounce" />
                  Download Iniciado!
                </>
              ) : (
                <>
                  <Download className="w-6 h-6 mr-2" />
                  Baixar Extensão
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Success Alert */}
        {downloadStarted && (
          <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-300">
              Download iniciado! Siga as instruções abaixo para instalar a extensão.
            </AlertDescription>
          </Alert>
        )}

        {/* Features Grid */}
        <div>
          <h2 className="text-2xl font-bold text-center mb-6">Por que usar a Extensão?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg w-fit">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>

        {/* Installation Steps */}
        <Card className="p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Como Instalar</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {steps.map((step) => (
              <div key={step.number} className="relative">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                    {step.number}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold mb-1">{step.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Capabilities */}
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4">✨ Capacidades</h3>
            <ul className="space-y-3">
              {capabilities.map((capability, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">{capability}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
            <h3 className="text-xl font-bold mb-4">🎯 Exemplos de Uso</h3>
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <p className="text-sm font-mono text-purple-600 dark:text-purple-400">
                  "Preencha o formulário com meus dados"
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <p className="text-sm font-mono text-purple-600 dark:text-purple-400">
                  "Extraia todos os preços desta página"
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <p className="text-sm font-mono text-purple-600 dark:text-purple-400">
                  "Navegue para facebook.com/ads"
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              A IA entende comandos naturais e executa automaticamente!
            </p>
          </Card>
        </div>

        {/* Security Notice */}
        <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
          <Shield className="w-4 h-4 text-blue-600" />
          <AlertDescription className="text-blue-800 dark:text-blue-300">
            <strong>Segurança em Primeiro Lugar:</strong> A extensão não armazena senhas,
            não acessa dados sensíveis e todas as ações são registradas e criptografadas.
            Seu navegador permanece 100% seguro.
          </AlertDescription>
        </Alert>

        {/* Help Card */}
        <Card className="p-6 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 border-orange-200 dark:border-orange-800">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-orange-900 dark:text-orange-300 mb-2">
                Precisa de Ajuda?
              </h3>
              <p className="text-orange-800 dark:text-orange-300 text-sm mb-4">
                Se tiver dificuldades na instalação ou uso da extensão, nossa equipe está
                pronta para ajudar!
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" size="sm" className="border-orange-300">
                  📧 Email: suporte@syncads.com.br
                </Button>
                <Button variant="outline" size="sm" className="border-orange-300">
                  💬 Chat de Suporte
                </Button>
                <Button variant="outline" size="sm" className="border-orange-300">
                  📚 Documentação
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Footer CTA */}
        <div className="text-center py-8">
          <Button
            size="lg"
            onClick={handleDownload}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-xl px-12 py-6 text-lg"
          >
            <Download className="w-6 h-6 mr-2" />
            Baixar Agora e Começar a Automatizar
            <ArrowRight className="w-6 h-6 ml-2" />
          </Button>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Gratuito para todos os usuários SyncAds • Atualização automática • Suporte 24/7
          </p>
        </div>

      </div>
    </div>
  );
}

