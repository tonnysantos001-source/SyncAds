/**
 * DEVELOPER SETUP MODAL
 *
 * Modal estilo Dualite.dev para configurar credenciais de desenvolvedor
 *
 * Features:
 * - Adicionar token GitHub
 * - Adicionar token Vercel
 * - Validação em tempo real
 * - Status de conexão visual
 * - Design moderno (dark mode)
 * - Instruções claras
 *
 * @version 1.0.0
 * @date 2025-01-08
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  IconBrandGithub,
  IconBrandVercel,
  IconCheck,
  IconX,
  IconAlertCircle,
  IconLoader2,
  IconExternalLink,
  IconKey,
  IconShieldCheck,
  IconCopy,
  IconEye,
  IconEyeOff,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import {
  developerCredentials,
  type CredentialsStatus,
} from '@/lib/developer/DeveloperCredentialsService';

interface DeveloperSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

type Step = 'intro' | 'github' | 'vercel' | 'complete';

export function DeveloperSetupModal({
  isOpen,
  onClose,
  onComplete,
}: DeveloperSetupModalProps) {
  const [step, setStep] = useState<Step>('intro');
  const [githubToken, setGithubToken] = useState('');
  const [vercelToken, setVercelToken] = useState('');
  const [vercelTeamId, setVercelTeamId] = useState('');
  const [isValidatingGithub, setIsValidatingGithub] = useState(false);
  const [isValidatingVercel, setIsValidatingVercel] = useState(false);
  const [status, setStatus] = useState<CredentialsStatus | null>(null);
  const [showGithubToken, setShowGithubToken] = useState(false);
  const [showVercelToken, setShowVercelToken] = useState(false);

  // Load current status
  useEffect(() => {
    if (isOpen) {
      loadStatus();
    }
  }, [isOpen]);

  const loadStatus = async () => {
    await developerCredentials.initialize();
    const result = await developerCredentials.getStatus();
    if (result.success && result.data) {
      setStatus(result.data);
    }
  };

  const handleConnectGithub = async () => {
    if (!githubToken.trim()) {
      toast.error('Por favor, insira o token do GitHub');
      return;
    }

    setIsValidatingGithub(true);

    try {
      const result = await developerCredentials.saveGitHubToken({
        token: githubToken.trim(),
      });

      if (result.success) {
        toast.success('GitHub conectado com sucesso!');
        await loadStatus();
        setStep('vercel');
      } else {
        toast.error(result.error || 'Token inválido');
      }
    } catch (error) {
      toast.error('Erro ao conectar GitHub');
    } finally {
      setIsValidatingGithub(false);
    }
  };

  const handleConnectVercel = async () => {
    if (!vercelToken.trim()) {
      toast.error('Por favor, insira o token do Vercel');
      return;
    }

    setIsValidatingVercel(true);

    try {
      const result = await developerCredentials.saveVercelToken({
        token: vercelToken.trim(),
        teamId: vercelTeamId.trim() || undefined,
      });

      if (result.success) {
        toast.success('Vercel conectado com sucesso!');
        await loadStatus();
        setStep('complete');

        // Enable developer mode
        await developerCredentials.setDeveloperMode(true);

        setTimeout(() => {
          onComplete?.();
          onClose();
        }, 2000);
      } else {
        toast.error(result.error || 'Token inválido');
      }
    } catch (error) {
      toast.error('Erro ao conectar Vercel');
    } finally {
      setIsValidatingVercel(false);
    }
  };

  const handleSkip = () => {
    if (step === 'github') {
      setStep('vercel');
    } else if (step === 'vercel') {
      setStep('complete');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-4xl bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 rounded-2xl shadow-2xl border border-white/10 overflow-hidden"
        >
          {/* Header */}
          <div className="relative border-b border-white/10 bg-black/20 backdrop-blur-xl">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10" />
            <div className="relative px-8 py-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <IconKey className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Modo Desenvolvedor
                  </h2>
                  <p className="text-sm text-gray-400">
                    Configure suas credenciais para deploy automático
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                <IconX className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            <AnimatePresence mode="wait">
              {/* Intro Step */}
              {step === 'intro' && (
                <motion.div
                  key="intro"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center space-y-4 mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-600/20 border border-blue-500/30 mb-4">
                      <IconShieldCheck className="w-10 h-10 text-blue-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">
                      Bem-vindo ao Modo Desenvolvedor
                    </h3>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                      Com suas credenciais, você pode criar sites, fazer deploy automático
                      para GitHub e Vercel, e gerenciar projetos diretamente pelo chat.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {/* GitHub Card */}
                    <div className="p-6 rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-white/10 hover:border-white/20 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg bg-black/50 flex items-center justify-center border border-white/10">
                          <IconBrandGithub className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-white mb-2">
                            GitHub
                          </h4>
                          <p className="text-sm text-gray-400 mb-3">
                            Crie repositórios, faça commits e gerencie código
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <IconCheck className="w-4 h-4 text-green-500" />
                            <span>Criação de repos</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <IconCheck className="w-4 h-4 text-green-500" />
                            <span>Commits automáticos</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <IconCheck className="w-4 h-4 text-green-500" />
                            <span>GitHub Actions</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Vercel Card */}
                    <div className="p-6 rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-white/10 hover:border-white/20 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg bg-black/50 flex items-center justify-center border border-white/10">
                          <IconBrandVercel className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-white mb-2">
                            Vercel
                          </h4>
                          <p className="text-sm text-gray-400 mb-3">
                            Deploy instantâneo e domínios automáticos
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <IconCheck className="w-4 h-4 text-green-500" />
                            <span>Deploy em segundos</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <IconCheck className="w-4 h-4 text-green-500" />
                            <span>SSL automático</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <IconCheck className="w-4 h-4 text-green-500" />
                            <span>Preview deployments</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center gap-4 mt-8">
                    <button
                      onClick={() => setStep('github')}
                      className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold transition-all hover:scale-105 shadow-lg shadow-blue-500/25"
                    >
                      Começar Configuração
                    </button>
                  </div>
                </motion.div>
              )}

              {/* GitHub Step */}
              {step === 'github' && (
                <motion.div
                  key="github"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-black/50 flex items-center justify-center border border-white/10">
                      <IconBrandGithub className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        Conectar GitHub
                      </h3>
                      <p className="text-sm text-gray-400">
                        Token para criar repositórios e fazer commits
                      </p>
                    </div>
                  </div>

                  {status?.github.connected ? (
                    <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                      <div className="flex items-center gap-3">
                        <IconCheck className="w-5 h-5 text-green-400" />
                        <div>
                          <p className="text-sm font-medium text-green-400">
                            GitHub já conectado!
                          </p>
                          <p className="text-xs text-green-400/70">
                            @{status.github.username}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Personal Access Token
                          </label>
                          <div className="relative">
                            <input
                              type={showGithubToken ? 'text' : 'password'}
                              value={githubToken}
                              onChange={(e) => setGithubToken(e.target.value)}
                              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                              className="w-full px-4 py-3 pr-24 bg-black/30 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-mono text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => setShowGithubToken(!showGithubToken)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-white/5 rounded-lg transition-colors"
                            >
                              {showGithubToken ? (
                                <IconEyeOff className="w-4 h-4 text-gray-400" />
                              ) : (
                                <IconEye className="w-4 h-4 text-gray-400" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                          <div className="flex items-start gap-3">
                            <IconAlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-blue-400 space-y-2">
                              <p className="font-medium">Como criar um token:</p>
                              <ol className="list-decimal list-inside space-y-1 text-xs text-blue-400/80">
                                <li>Acesse github.com/settings/tokens</li>
                                <li>Clique em "Generate new token (classic)"</li>
                                <li>Selecione as permissões: <code className="px-1 py-0.5 bg-black/30 rounded">repo</code>, <code className="px-1 py-0.5 bg-black/30 rounded">workflow</code></li>
                                <li>Gere e copie o token</li>
                              </ol>
                              <a
                                href="https://github.com/settings/tokens/new"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 font-medium"
                              >
                                <span>Criar token agora</span>
                                <IconExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between gap-4">
                        <button
                          onClick={handleSkip}
                          className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-medium transition-colors"
                        >
                          Pular por enquanto
                        </button>
                        <button
                          onClick={handleConnectGithub}
                          disabled={isValidatingGithub || !githubToken.trim()}
                          className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {isValidatingGithub ? (
                            <>
                              <IconLoader2 className="w-5 h-5 animate-spin" />
                              Validando...
                            </>
                          ) : (
                            <>
                              <IconCheck className="w-5 h-5" />
                              Conectar GitHub
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              )}

              {/* Vercel Step */}
              {step === 'vercel' && (
                <motion.div
                  key="vercel"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-black/50 flex items-center justify-center border border-white/10">
                      <IconBrandVercel className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        Conectar Vercel
                      </h3>
                      <p className="text-sm text-gray-400">
                        Token para fazer deploys automáticos
                      </p>
                    </div>
                  </div>

                  {status?.vercel.connected ? (
                    <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                      <div className="flex items-center gap-3">
                        <IconCheck className="w-5 h-5 text-green-400" />
                        <div>
                          <p className="text-sm font-medium text-green-400">
                            Vercel já conectado!
                          </p>
                          <p className="text-xs text-green-400/70">
                            @{status.vercel.username}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Access Token
                          </label>
                          <div className="relative">
                            <input
                              type={showVercelToken ? 'text' : 'password'}
                              value={vercelToken}
                              onChange={(e) => setVercelToken(e.target.value)}
                              placeholder="xxxxxxxxxxxxxxxxxxxxxxxx"
                              className="w-full px-4 py-3 pr-24 bg-black/30 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-mono text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => setShowVercelToken(!showVercelToken)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-white/5 rounded-lg transition-colors"
                            >
                              {showVercelToken ? (
                                <IconEyeOff className="w-4 h-4 text-gray-400" />
                              ) : (
                                <IconEye className="w-4 h-4 text-gray-400" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Team ID (opcional)
                          </label>
                          <input
                            type="text"
                            value={vercelTeamId}
                            onChange={(e) => setVercelTeamId(e.target.value)}
                            placeholder="team_xxxxxxxxxxxxxxxx"
                            className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-mono text-sm"
                          />
                        </div>

                        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                          <div className="flex items-start gap-3">
                            <IconAlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-blue-400 space-y-2">
                              <p className="font-medium">Como criar um token:</p>
                              <ol className="list-decimal list-inside space-y-1 text-xs text-blue-400/80">
                                <li>Acesse vercel.com/account/tokens</li>
                                <li>Clique em "Create Token"</li>
                                <li>Dê um nome e defina permissões</li>
                                <li>Copie o token gerado</li>
                              </ol>
                              <a
                                href="https://vercel.com/account/tokens"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 font-medium"
                              >
                                <span>Criar token agora</span>
                                <IconExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between gap-4">
                        <button
                          onClick={() => setStep('github')}
                          className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-medium transition-colors"
                        >
                          Voltar
                        </button>
                        <button
                          onClick={handleConnectVercel}
                          disabled={isValidatingVercel || !vercelToken.trim()}
                          className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {isValidatingVercel ? (
                            <>
                              <IconLoader2 className="w-5 h-5 animate-spin" />
                              Validando...
                            </>
                          ) : (
                            <>
                              <IconCheck className="w-5 h-5" />
                              Conectar Vercel
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              )}

              {/* Complete Step */}
              {step === 'complete' && (
                <motion.div
                  key="complete"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-6 py-8"
                >
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-600/20 border border-green-500/30 mb-4">
                    <IconCheck className="w-10 h-10 text-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">
                    Tudo pronto! 🎉
                  </h3>
                  <p className="text-gray-400 max-w-md mx-auto">
                    Suas credenciais foram configuradas com sucesso. Agora você pode criar
                    e fazer deploy de sites diretamente pelo chat!
                  </p>
                  <div className="flex justify-center gap-4 pt-4">
                    <button
                      onClick={() => {
                        onComplete?.();
                        onClose();
                      }}
                      className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold transition-all hover:scale-105"
                    >
                      Começar a Usar
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Progress Indicator */}
          {step !== 'intro' && step !== 'complete' && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                initial={{ width: '0%' }}
                animate={{
                  width: step === 'github' ? '50%' : '100%',
                }}
                transition={{ duration: 0.3 }}
              />
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default DeveloperSetupModal;
