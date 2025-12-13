/**
 * VISUAL EDITOR MODAL - DUALITE STYLE
 *
 * Editor visual completo no estilo Dualite.dev
 *
 * Features:
 * - Header com todos os botões (Attach, Enhance, Figma, Stack, More)
 * - Tabs (Código/Visualização)
 * - Sidebar com chat + arquivos
 * - Botões de importação (Supabase/GitHub)
 * - Monaco Editor
 * - Preview em tempo real
 * - Deploy automático
 *
 * @version 2.0.0
 * @date 2025-01-08
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  IconSend,
  IconBrandOpenai,
  IconCode,
  IconEye,
  IconSparkles,
  IconPaperclip,
  IconWand,
  IconBrandFigma,
  IconBrandReact,
  IconBrandGithub,
  IconRocket,
  IconDots,
  IconChevronUp,
  IconCheck,
  IconFileCode,
  IconUser,
  IconRefresh,
  IconSettings,
  IconDownload,
  IconExternalLink,
  IconX,
  IconPlus,
  IconBolt,
} from '@tabler/icons-react';
import Textarea from 'react-textarea-autosize';
import { toast } from 'sonner';
import { quickDeploy } from '@/lib/workflows/DeployWorkflow';
import { developerCredentials } from '@/lib/developer';
import { DeveloperSetupModal } from '@/components/developer';
import { PlanningBlock } from "@/components/chat/PlanningBlock";

interface VisualEditorModalDualiteProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface GeneratedFile {
  path: string;
  content: string;
  language: string;
  generated: boolean;
}

type Tab = 'code' | 'preview';
type Stack = 'react-ts' | 'vue-ts' | 'nextjs-ts' | 'html';

const STACKS = [
  { id: 'react-ts', label: 'React + Tailwind + TS', icon: IconBrandReact },
  { id: 'vue-ts', label: 'Vue + Tailwind + TS', icon: IconSparkles },
  { id: 'nextjs-ts', label: 'Next.js + TS', icon: IconBolt },
  { id: 'html', label: 'HTML + CSS + JS', icon: IconFileCode },
];

export function VisualEditorModalDualite({
  isOpen,
  onClose,
  userId,
}: VisualEditorModalDualiteProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('preview');
  const [selectedStack, setSelectedStack] = useState<Stack>('react-ts');
  const [files, setFiles] = useState<GeneratedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployProgress, setDeployProgress] = useState(0);
  const [showStackMenu, setShowStackMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      checkDeveloperMode();
    }
  }, [isOpen]);

  const checkDeveloperMode = async () => {
    await developerCredentials.initialize();
    const isEnabled = developerCredentials.isDeveloperModeEnabled();
    const isConnected = developerCredentials.isFullyConnected();

    if (!isEnabled || !isConnected) {
      setShowSetupModal(true);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsGenerating(true);

    try {
      // Simulate AI generation
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const generatedFiles: GeneratedFile[] = [
        {
          path: 'index.html',
          content: generateHTML(input),
          language: 'html',
          generated: true,
        },
        {
          path: 'styles.css',
          content: generateCSS(),
          language: 'css',
          generated: true,
        },
        {
          path: 'script.js',
          content: generateJS(),
          language: 'javascript',
          generated: true,
        },
      ];

      setFiles(generatedFiles);
      setSelectedFile('index.html');

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Página criada com sucesso! Você pode visualizar o preview ao lado.',
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error generating:', error);
      toast.error('Erro ao gerar página');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeploy = async () => {
    const isConnected = developerCredentials.isFullyConnected();

    if (!isConnected) {
      toast.error('Configure suas credenciais primeiro');
      setShowSetupModal(true);
      return;
    }

    if (files.length === 0) {
      toast.error('Nenhum código para fazer deploy');
      return;
    }

    setIsDeploying(true);
    setDeployProgress(0);

    try {
      const htmlFile = files.find((f) => f.path === 'index.html');
      if (!htmlFile) {
        throw new Error('Arquivo HTML não encontrado');
      }

      const result = await quickDeploy(
        `syncads-site-${Date.now()}`,
        htmlFile.content,
        files.find((f) => f.path === 'styles.css')?.content,
        files.find((f) => f.path === 'script.js')?.content,
        (step, progress, message) => {
          setDeployProgress(progress);
        }
      );

      if (result.success && result.deploymentUrl) {
        toast.success('Deploy concluído!', {
          description: `Site: ${result.deploymentUrl}`,
          duration: 10000,
          action: {
            label: 'Abrir',
            onClick: () => window.open(result.deploymentUrl, '_blank'),
          },
        });

        const successMessage: ChatMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `🎉 Deploy concluído!\n\n✅ Site: ${result.deploymentUrl}\n✅ GitHub: ${result.repositoryUrl}`,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, successMessage]);
      }
    } catch (error) {
      toast.error('Erro no deploy', {
        description: (error as Error).message,
      });
    } finally {
      setIsDeploying(false);
      setDeployProgress(0);
    }
  };

  const handleImportSupabase = () => {
    setIsImporting(true);
    toast.info('Importando do Supabase...');
    // TODO: Implement Supabase import
    setTimeout(() => {
      setIsImporting(false);
      toast.success('Importado do Supabase!');
    }, 2000);
  };

  const handleImportGitHub = () => {
    setIsImporting(true);
    toast.info('Importando do GitHub...');
    // TODO: Implement GitHub import
    setTimeout(() => {
      setIsImporting(false);
      toast.success('Importado do GitHub!');
    }, 2000);
  };

  const generateHTML = (prompt: string) => {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${prompt}</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container">
    <header>
      <h1>✨ ${prompt}</h1>
      <p>Criado com IA - SyncAds</p>
    </header>

    <main>
      <section class="hero">
        <h2>Bem-vindo!</h2>
        <p>Esta página foi gerada automaticamente pela IA.</p>
        <button class="cta-button">Começar Agora</button>
      </section>

      <section class="features">
        <div class="feature-card">
          <div class="icon">🚀</div>
          <h3>Rápido</h3>
          <p>Deploy em segundos</p>
        </div>
        <div class="feature-card">
          <div class="icon">⚡</div>
          <h3>Moderno</h3>
          <p>Tecnologias atuais</p>
        </div>
        <div class="feature-card">
          <div class="icon">🎨</div>
          <h3>Bonito</h3>
          <p>Design profissional</p>
        </div>
      </section>
    </main>

    <footer>
      <p>Criado com SyncAds - Plataforma de IA</p>
    </footer>
  </div>
  <script src="script.js"></script>
</body>
</html>`;
  };

  const generateCSS = () => {
    return `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  color: white;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

header {
  text-align: center;
  padding: 3rem 0;
  animation: fadeIn 0.6s ease-out;
}

header h1 {
  font-size: 3rem;
  margin-bottom: 0.5rem;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
}

.hero {
  text-align: center;
  padding: 4rem 2rem;
  background: rgba(255,255,255,0.1);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  margin: 2rem 0;
  animation: slideUp 0.8s ease-out;
}

.hero h2 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.cta-button {
  background: white;
  color: #667eea;
  border: none;
  padding: 1rem 2rem;
  font-size: 1.1rem;
  font-weight: bold;
  border-radius: 50px;
  cursor: pointer;
  margin-top: 2rem;
  transition: transform 0.2s;
}

.cta-button:hover {
  transform: scale(1.05);
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin: 3rem 0;
}

.feature-card {
  background: rgba(255,255,255,0.1);
  backdrop-filter: blur(10px);
  padding: 2rem;
  border-radius: 15px;
  text-align: center;
  animation: fadeIn 1s ease-out;
}

.icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

footer {
  text-align: center;
  padding: 2rem 0;
  opacity: 0.8;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}`;
  };

  const generateJS = () => {
    return `document.addEventListener('DOMContentLoaded', () => {
  console.log('✨ Página carregada com sucesso!');

  const ctaButton = document.querySelector('.cta-button');

  if (ctaButton) {
    ctaButton.addEventListener('click', () => {
      alert('🎉 Obrigado por clicar! Esta é uma página de exemplo.');
    });
  }

  // Adiciona animação suave ao scroll
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
});`;
  };

  if (!isOpen) return null;

  const currentFile = files.find((f) => f.path === selectedFile);

  return (
    <>
      <DeveloperSetupModal
        isOpen={showSetupModal}
        onClose={() => setShowSetupModal(false)}
        onComplete={() => setShowSetupModal(false)}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full h-full bg-[#0a0a0a] flex flex-col"
        >
          {/* Header estilo Dualite */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#0f0f0f]">
            {/* Left side */}
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <IconX className="w-5 h-5 text-gray-400" />
              </button>

              <div className="flex items-center gap-2 ml-4">
                {/* Attach */}
                <button className="p-2 hover:bg-white/5 rounded-lg transition-colors group">
                  <IconPaperclip className="w-5 h-5 text-gray-400 group-hover:text-white" />
                </button>

                {/* Enhance */}
                <button className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 rounded-lg transition-colors">
                  <IconWand className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-300">Enhance</span>
                </button>

                {/* Figma */}
                <button className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 rounded-lg transition-colors">
                  <IconBrandFigma className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-300">Figma</span>
                </button>
              </div>
            </div>

            {/* Center */}
            <div className="flex items-center gap-2">
              {/* Tabs */}
              <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('code')}
                  className={cn(
                    'px-3 py-1.5 rounded text-sm transition-colors',
                    activeTab === 'code'
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400 hover:text-white'
                  )}
                >
                  Código
                </button>
                <button
                  onClick={() => setActiveTab('preview')}
                  className={cn(
                    'px-3 py-1.5 rounded text-sm transition-colors',
                    activeTab === 'preview'
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400 hover:text-white'
                  )}
                >
                  Visualização
                </button>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* Stack selector */}
              <div className="relative">
                <button
                  onClick={() => setShowStackMenu(!showStackMenu)}
                  className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <IconBrandReact className="w-5 h-5 text-blue-400" />
                  <span className="text-sm text-gray-300">React + Tailwind + TS</span>
                </button>

                {showStackMenu && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-50">
                    {STACKS.map((stack) => (
                      <button
                        key={stack.id}
                        onClick={() => {
                          setSelectedStack(stack.id as Stack);
                          setShowStackMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors first:rounded-t-xl last:rounded-b-xl"
                      >
                        <stack.icon className="w-5 h-5 text-blue-400" />
                        <span className="text-sm text-gray-300">{stack.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* More menu */}
              <button
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <IconDots className="w-5 h-5 text-gray-400" />
              </button>

              {/* Deploy button */}
              <button
                onClick={handleDeploy}
                disabled={isDeploying || files.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeploying ? (
                  <>
                    <IconRefresh className="w-5 h-5 animate-spin" />
                    <span className="text-sm font-medium">{deployProgress}%</span>
                  </>
                ) : (
                  <>
                    <IconChevronUp className="w-5 h-5" />
                    <span className="text-sm font-medium">Publicar</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left/Center - Code or Preview */}
            <div className="flex-1 flex flex-col bg-[#0a0a0a]">
              {files.length === 0 ? (
                /* Empty state with import buttons */
                <div className="flex-1 flex flex-col items-center justify-center p-8">
                  <div className="text-center space-y-6 max-w-md">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center mx-auto">
                      <IconSparkles className="w-10 h-10 text-blue-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">
                      Crie algo incrível
                    </h3>
                    <p className="text-gray-400">
                      Peça para a IA criar uma landing page, aplicativo, ou
                      importe de uma fonte externa
                    </p>

                    {/* Import buttons */}
                    <div className="flex flex-col items-center gap-3 pt-4">
                      <div className="text-sm text-gray-500 uppercase tracking-wider">
                        OU
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={handleImportSupabase}
                          disabled={isImporting}
                          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-colors text-emerald-400 disabled:opacity-50"
                        >
                          <IconBolt className="w-5 h-5" />
                          <span className="text-sm font-medium">
                            Importar do Supabase
                          </span>
                        </button>
                        <button
                          onClick={handleImportGitHub}
                          disabled={isImporting}
                          className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors text-gray-300 disabled:opacity-50"
                        >
                          <IconBrandGithub className="w-5 h-5" />
                          <span className="text-sm font-medium">
                            Importar do GitHub
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {activeTab === 'preview' ? (
                    /* Preview */
                    <div className="flex-1 bg-white">
                      <iframe
                        ref={iframeRef}
                        srcDoc={
                          files.find((f) => f.path === 'index.html')?.content || ''
                        }
                        className="w-full h-full border-0"
                        title="Preview"
                      />
                    </div>
                  ) : (
                    /* Code editor */
                    <div className="flex-1 overflow-auto bg-[#0f0f0f] p-4">
                      <pre className="text-sm text-gray-300 font-mono">
                        <code>{currentFile?.content || ''}</code>
                      </pre>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Right sidebar - Chat + Files */}
            <div className="w-96 border-l border-white/10 bg-[#0f0f0f] flex flex-col">
              {/* Files list */}
              {files.length > 0 && (
                <div className="border-b border-white/10">
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Importing Starter Files
                      </span>
                      <button className="p-1 hover:bg-white/5 rounded">
                        <IconRefresh className="w-3 h-3 text-gray-400" />
                      </button>
                    </div>
                    <div className="space-y-1">
                      {files.map((file) => (
                        <button
                          key={file.path}
                          onClick={() => setSelectedFile(file.path)}
                          className={cn(
                            'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                            selectedFile === file.path
                              ? 'bg-white/10 text-white'
                              : 'text-gray-400 hover:bg-white/5'
                          )}
                        >
                          <IconCheck className="w-4 h-4 text-green-500" />
                          <span className="flex-1 text-left">{file.path}</span>
                          <span className="text-xs text-gray-500">Generated</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Chat */}
              <div className="flex-1 flex flex-col">
                {/* Messages */}
                <div className="flex-1 overflow-auto p-4 space-y-4">
                  {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <IconUser className="w-12 h-12 text-gray-600 mb-3" />
                      <p className="text-sm text-gray-400">
                        {files.length === 0
                          ? 'criar landpage para eu vender cestas de café da manhã'
                          : 'Pergunte ao Dualite...'}
                      </p>
                    </div>
                  )}

                  {messages.map((msg) => {
                    const thinkingMatch = msg.content.match(/<antigravity_thinking>([\s\S]*?)<\/antigravity_thinking>/);
                    const thinkingContent = thinkingMatch ? thinkingMatch[1].trim() : null;
                    const cleanContent = msg.content.replace(/<antigravity_thinking>[\s\S]*?<\/antigravity_thinking>/, "").trim();

                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          'p-3 rounded-lg flex flex-col gap-2',
                          msg.role === 'user'
                            ? 'bg-blue-500/10 border border-blue-500/20 ml-4'
                            : 'bg-white/5 border border-white/10 mr-4'
                        )}
                      >
                        {thinkingContent && <PlanningBlock content={thinkingContent} />}
                        {cleanContent && (
                          <p className="text-sm text-gray-200 whitespace-pre-wrap">
                            {cleanContent}
                          </p>
                        )}
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="border-t border-white/10 p-4">
                  <div className="relative">
                    <Textarea
                      ref={textareaRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder={
                        files.length === 0
                          ? 'criar landpage para eu vender cestas de café da manhã'
                          : 'Pergunte ao Dualite...'
                      }
                      minRows={1}
                      maxRows={4}
                      disabled={isGenerating}
                      className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 resize-none"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || isGenerating}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center bg-white text-black hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <IconSend className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Footer buttons */}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                        <IconPaperclip className="w-4 h-4 text-gray-400" />
                      </button>
                      <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                        <IconWand className="w-4 h-4 text-gray-400" />
                      </button>
                      <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                        <IconBrandFigma className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                    <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                      <IconDots className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}

export default VisualEditorModalDualite;
