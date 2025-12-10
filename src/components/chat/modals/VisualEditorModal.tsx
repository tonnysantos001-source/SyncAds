/**
 * VISUAL EDITOR MODAL
 * Editor visual tipo Dualite.dev - IA na lateral, preview visual no centro
 *
 * Features:
 * - IA assistente na lateral esquerda (chat)
 * - Preview visual em tempo real no centro/direita
 * - Criação/edição de páginas, landing pages, layouts
 * - Code highlighting e preview responsivo
 * - Deploy real para GitHub + Vercel
 *
 * @version 2.0.0
 * @date 2025-01-08
 */

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  IconSend,
  IconBrandOpenai,
  IconCode,
  IconEye,
  IconDeviceMobile,
  IconDeviceDesktop,
  IconRefresh,
  IconDownload,
  IconCopy,
  IconCheck,
  IconLoader2,
  IconSparkles,
  IconRocket,
  IconBrandGithub,
} from "@tabler/icons-react";
import Textarea from "react-textarea-autosize";
import { toast } from "sonner";
import { orchestrator } from "@/lib/orchestrator";
import { quickDeploy, type DeployStep } from "@/lib/workflows/DeployWorkflow";
import { useChatStream } from "@/hooks/useChatStream";
import { useModalError } from "@/hooks/useModalError";

interface VisualEditorModalProps {
  onSendMessage?: (message: string) => void;
  onDetectContext?: (message: string) => void;
  userId?: string;
  isExpanded?: boolean;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

type ViewMode = "preview" | "code" | "split";
type DeviceMode = "desktop" | "mobile";

const QUICK_ACTIONS = [
  { icon: "🎨", text: "Criar landing page moderna" },
  { icon: "📱", text: "Página responsiva com formulário" },
  { icon: "🚀", text: "Hero section com CTA" },
  { icon: "💼", text: "Página de produto/serviço" },
];

export function VisualEditorModal({
  onSendMessage,
  onDetectContext,
  userId,
  isExpanded,
}: VisualEditorModalProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("preview");
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("desktop");
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployProgress, setDeployProgress] = useState(0);
  const [deployStep, setDeployStep] = useState<string>("");
  const [deploymentUrl, setDeploymentUrl] = useState<string>("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Hooks customizados
  const { sendMessage, isStreaming, streamedContent } = useChatStream();
  const { handleError } = useModalError();

  // Auto scroll messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Detect context on input change
  useEffect(() => {
    if (input.trim() && onDetectContext) {
      const timeoutId = setTimeout(() => {
        onDetectContext(input);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [input, onDetectContext]);

  // Handle send message com IA real
  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;

    const prompt = input;
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: prompt,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsGenerating(true);

    try {
      // Callback
      onSendMessage?.(prompt);

      // System prompt especializado para geração de código
      const systemPrompt = `Você é um expert em criar landing pages e websites modernos.

REGRAS:
1. Gere HTML/CSS/JS completo e responsivo
2. Use Tailwind CSS via CDN  
3. Design moderno e profissional
4. Mobile-first e acessível
5. RETORNE APENAS O CÓDIGO, sem explicações
6. Código completo com <!DOCTYPE html>

EXEMPLO DE PROMPT:
"landing page para vender curso"

EXEMPLO DE RESPOSTA:
<!DOCTYPE html>
<html>...(código completo)...</html>

AGORA GERE O CÓDIGO PARA:`;

      // Chamar IA com streaming
      const fullResponse = await sendMessage(prompt, {
        context: 'visual-editor',
        systemPrompt,
        model: 'claude', // Claude é melhor para código
      });

      // Extrair código HTML da resposta
      const extractedCode = extractHTMLCode(fullResponse);

      if (extractedCode) {
        setGeneratedCode(extractedCode);

        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "✅ Página criada com sucesso! Veja o preview ao lado.",
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error('Não foi possível extrair o código HTML');
      }
    } catch (error) {
      console.error("Error generating page:", error);
      handleError(error, {
        context: 'Visual Editor',
        userMessage: 'Erro ao gerar página. Tente novamente.',
      });

      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "❌ Erro ao gerar página. Tente novamente ou reformule a descrição.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
      textareaRef.current?.focus();
    }
  };

  /**
   * Extrai código HTML de uma resposta da IA
   * A IA pode retornar código com markdown code blocks ou texto puro
   */
  const extractHTMLCode = (response: string): string => {
    // Remover markdown code blocks se existirem
    const codeBlockRegex = /```(?:html)?\n?(.*?)```/s;
    const match = response.match(codeBlockRegex);

    if (match) {
      return match[1].trim();
    }

    // Se não tem code block, procurar por <!DOCTYPE html>
    const htmlMatch = response.match(/<!DOCTYPE html>[\s\S]*/i);
    if (htmlMatch) {
      return htmlMatch[0].trim();
    }

    // Se não encontrou, tentar procurar <html>
    const htmlTagMatch = response.match(/<html[\s\S]*/i);
    if (htmlTagMatch) {
      return htmlTagMatch[0].trim();
    }

    // Último recurso: retornar resposta completa se parecer HTML
    if (response.includes('<html') || response.includes('<!DOCTYresponse')) {
      return response.trim();
    }

    // Se não conseguiu extrair, retornar template básico com a resposta
    return generateFallbackHTML(response);
  };

  /**
   * Gera HTML fallback caso a IA não retorne código válido
   */
  const generateFallbackHTML = (content: string) => {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Página Gerada - SyncAds</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 min-h-screen">
  <div class="container mx-auto px-4 py-16">
    <div class="max-w-4xl mx-auto">
      <div class="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6 mb-8">
        <h2 class="text-yellow-400 font-semibold mb-2">⚠️ Código não detectado</h2>
        <p class="text-gray-300 text-sm">A IA retornou uma resposta textual. Por favor, reformule sua solicitação pedindo explicitamente para gerar código HTML.</p>
      </div>
      <div class="bg-white/5 backdrop-blur-lg rounded-xl p-8 border border-white/10">
        <h3 class="text-white font-semibold mb-4">Resposta da IA:</h3>
        <pre class="text-gray-300 text-sm whitespace-pre-wrap font-mono">${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
      </div>
    </div>
  </div>
</body>
</html>`;
  };

  /**
   * Gera template HTML básico (backup/exemplo)
   */
  const generateBasicHTML = (prompt: string) => {
    const isLanding = /landing|página inicial/i.test(prompt);
    const hasForm = /formulário|contato/i.test(prompt);

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Página Gerada - SyncAds</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 min-h-screen">
  <!-- Hero Section -->
  <div class="container mx-auto px-4 py-16">
    <div class="max-w-4xl mx-auto text-center">
      <h1 class="text-5xl font-bold text-white mb-6">
        ${isLanding ? "Bem-vindo à Nossa Solução" : "Título da Página"}
      </h1>
      <p class="text-xl text-gray-300 mb-8">
        Transforme seu negócio com nossa plataforma inovadora
      </p>
      <div class="flex gap-4 justify-center">
        <button class="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all transform hover:scale-105">
          Comece Agora
        </button>
        <button class="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-all backdrop-blur-sm">
          Saiba Mais
        </button>
      </div>
    </div>
  </div>

  ${hasForm
        ? `
  <!-- Contact Form -->
  <div class="container mx-auto px-4 py-16">
    <div class="max-w-2xl mx-auto bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
      <h2 class="text-3xl font-bold text-white mb-6">Entre em Contato</h2>
      <form class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Nome</label>
          <input type="text" class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Seu nome completo">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Email</label>
          <input type="email" class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="seu@email.com">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Mensagem</label>
          <textarea rows="4" class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Como podemos ajudar?"></textarea>
        </div>
        <button type="submit" class="w-full px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all">
          Enviar Mensagem
        </button>
      </form>
    </div>
  </div>
  `
        : ""
      }

  <!-- Features Section -->
  <div class="container mx-auto px-4 py-16">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div class="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
        <div class="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-white mb-2">Rápido</h3>
        <p class="text-gray-400">Performance otimizada para resultados instantâneos</p>
      </div>
      <div class="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
        <div class="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-white mb-2">Seguro</h3>
        <p class="text-gray-400">Proteção de dados e privacidade garantida</p>
      </div>
      <div class="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
        <div class="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-white mb-2">Confiável</h3>
        <p class="text-gray-400">Suporte 24/7 e uptime garantido</p>
      </div>
    </div>
  </div>
</body>
</html>`;
  };

  // Handle key down
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle quick action
  const handleQuickAction = (text: string) => {
    setInput(text);
    textareaRef.current?.focus();
  };

  // Copy code
  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Refresh preview
  const handleRefreshPreview = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      if (iframeRef.current) {
        iframeRef.current.src = "about:blank";
        setTimeout(() => {
          if (iframeRef.current) {
            const blob = new Blob([generatedCode], { type: "text/html" });
            iframeRef.current.src = URL.createObjectURL(blob);
          }
        }, 100);
      }
      setIsRefreshing(false);
    }, 500);
  };

  // Download HTML
  const handleDownload = () => {
    const blob = new Blob([generatedCode], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "page-syncads.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Deploy to GitHub + Vercel
  const handleDeploy = async () => {
    if (!generatedCode) {
      toast.error("Nenhum código para fazer deploy");
      return;
    }

    setIsDeploying(true);
    setDeployProgress(0);
    setDeployStep("Iniciando deploy...");

    try {
      const projectName = `syncads-site-${Date.now()}`;

      const result = await quickDeploy(
        projectName,
        generatedCode,
        undefined,
        undefined,
        (step: DeployStep, progress: number, message: string) => {
          setDeployProgress(progress);
          setDeployStep(message);
          console.log(`[Deploy] ${step}: ${progress}% - ${message}`);
        },
      );

      if (result.success && result.deploymentUrl) {
        setDeploymentUrl(result.deploymentUrl);
        toast.success("Deploy concluído com sucesso!", {
          description: `Site disponível em: ${result.deploymentUrl}`,
          duration: 10000,
          action: {
            label: "Abrir",
            onClick: () => window.open(result.deploymentUrl, "_blank"),
          },
        });

        // Add success message to chat
        const successMessage: ChatMessage = {
          id: Date.now().toString(),
          role: "assistant",
          content: `🎉 Deploy concluído!\n\n✅ Site: ${result.deploymentUrl}\n✅ GitHub: ${result.repositoryUrl}\n✅ Vercel: ${result.vercelProjectUrl}`,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, successMessage]);
      } else {
        throw new Error(result.error || "Deploy falhou");
      }
    } catch (error) {
      console.error("Deploy error:", error);
      toast.error("Erro no deploy", {
        description: (error as Error).message,
      });

      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: `❌ Erro no deploy: ${(error as Error).message}`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsDeploying(false);
      setDeployProgress(0);
      setDeployStep("");
    }
  };

  return (
    <div className="flex h-full">
      {/* Left Sidebar - AI Chat */}
      <div className="w-96 border-r border-white/10 flex flex-col bg-black/20">
        {/* Chat Header */}
        <div className="px-4 py-3 border-b border-white/10 bg-black/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              <IconSparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">AI Designer</h3>
              <p className="text-xs text-gray-400">Assistente visual</p>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-400">
                  Descreva a página que você quer criar
                </p>
              </div>

              {/* Quick actions */}
              <div className="space-y-2">
                {QUICK_ACTIONS.map((action, index) => (
                  <motion.button
                    key={index}
                    onClick={() => handleQuickAction(action.text)}
                    className="w-full p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{action.icon}</span>
                      <span className="text-sm text-gray-300">
                        {action.text}
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "p-3 rounded-lg",
                    msg.role === "user"
                      ? "bg-blue-600/20 border border-blue-600/30 ml-4"
                      : "bg-white/5 border border-white/10 mr-4",
                  )}
                >
                  <p className="text-sm text-gray-200">{msg.content}</p>
                </div>
              ))}
            </div>
          )}

          {isGenerating && (
            <div className="flex items-center gap-2 p-3 bg-white/5 rounded-lg border border-white/10">
              <IconLoader2 className="w-4 h-4 text-blue-500 animate-spin" />
              <span className="text-sm text-gray-400">Gerando página...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="p-4 border-t border-white/10 bg-black/30">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Descreva a página..."
              maxRows={4}
              disabled={isGenerating || isStreaming}
              className={cn(
                "w-full px-3 py-2 pr-10",
                "bg-white/5 border border-white/10 rounded-lg",
                "text-white placeholder:text-gray-500 text-sm",
                "focus:outline-none focus:ring-2 focus:ring-blue-500/50",
                "disabled:opacity-50",
              )}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isGenerating || isStreaming}
              className={cn(
                "absolute right-2 bottom-2 w-7 h-7 rounded-md flex items-center justify-center",
                input.trim() && !isGenerating && !isStreaming
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-white/5 text-gray-500",
              )}
            >
              <IconSend className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Right Side - Preview/Code */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/20">
          <div className="flex items-center gap-2">
            {/* View mode */}
            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
              <button
                onClick={() => setViewMode("preview")}
                className={cn(
                  "px-3 py-1.5 rounded text-sm transition-colors",
                  viewMode === "preview"
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-white",
                )}
              >
                <IconEye className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("code")}
                className={cn(
                  "px-3 py-1.5 rounded text-sm transition-colors",
                  viewMode === "code"
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-white",
                )}
              >
                <IconCode className="w-4 h-4" />
              </button>
            </div>

            {/* Device mode */}
            {viewMode === "preview" && (
              <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
                <button
                  onClick={() => setDeviceMode("desktop")}
                  className={cn(
                    "px-3 py-1.5 rounded text-sm transition-colors",
                    deviceMode === "desktop"
                      ? "bg-blue-600 text-white"
                      : "text-gray-400 hover:text-white",
                  )}
                >
                  <IconDeviceDesktop className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeviceMode("mobile")}
                  className={cn(
                    "px-3 py-1.5 rounded text-sm transition-colors",
                    deviceMode === "mobile"
                      ? "bg-blue-600 text-white"
                      : "text-gray-400 hover:text-white",
                  )}
                >
                  <IconDeviceMobile className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefreshPreview}
              disabled={!generatedCode || isRefreshing}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            >
              <IconRefresh
                className={cn("w-4 h-4", isRefreshing && "animate-spin")}
              />
            </button>
            <button
              onClick={handleCopyCode}
              disabled={!generatedCode}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            >
              {copied ? (
                <IconCheck className="w-4 h-4 text-green-500" />
              ) : (
                <IconCopy className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={handleDownload}
              disabled={!generatedCode}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
            >
              <IconDownload className="w-4 h-4" />
              Download
            </button>

            <button
              onClick={handleDeploy}
              disabled={!generatedCode || isDeploying}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
            >
              {isDeploying ? (
                <>
                  <IconLoader2 className="w-4 h-4 animate-spin" />
                  Deploy ({deployProgress}%)
                </>
              ) : (
                <>
                  <IconRocket className="w-4 h-4" />
                  Deploy
                </>
              )}
            </button>
          </div>

          {/* Deploy Progress */}
          {isDeploying && (
            <div className="mt-4 bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-300">{deployStep}</span>
                <span className="text-sm text-gray-400">{deployProgress}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${deployProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}

          {/* Deployment Success */}
          {deploymentUrl && !isDeploying && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 bg-gradient-to-r from-green-600/20 to-blue-600/20 rounded-lg p-4 border border-green-500/30"
            >
              <div className="flex items-start gap-3">
                <IconCheck className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-white mb-1">
                    Deploy Concluído!
                  </h4>
                  <p className="text-sm text-gray-300 mb-2">
                    Seu site está no ar e acessível publicamente
                  </p>
                  <a
                    href={deploymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <IconBrandGithub className="w-4 h-4" />
                    {deploymentUrl}
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden bg-gray-900">
          {!generatedCode ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <IconBrandOpenai className="w-16 h-16 text-gray-600 mx-auto" />
                <p className="text-gray-500">
                  Descreva a página que você quer criar no chat ao lado
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-4">
              {viewMode === "preview" ? (
                <motion.div
                  key={deviceMode}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={cn(
                    "bg-white rounded-lg shadow-2xl overflow-hidden",
                    deviceMode === "mobile"
                      ? "w-[375px] h-[667px]"
                      : "w-full h-full",
                  )}
                >
                  <iframe
                    ref={iframeRef}
                    srcDoc={generatedCode}
                    className="w-full h-full border-0"
                    title="Preview"
                  />
                </motion.div>
              ) : (
                <div className="w-full h-full bg-gray-950 rounded-lg overflow-auto">
                  <pre className="p-4 text-xs text-gray-300 font-mono">
                    <code>{generatedCode}</code>
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VisualEditorModal;
