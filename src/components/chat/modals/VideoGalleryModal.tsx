/**
 * VIDEO GALLERY MODAL - v3.0
 * Chat com IA para discussão + geração de vídeos via Edge Function
 * Layout: chat IA à esquerda | galeria de vídeos à direita
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  IconSend,
  IconVideo,
  IconDownload,
  IconX,
  IconHeart,
  IconHeartFilled,
  IconLoader2,
  IconSparkles,
  IconTrash,
  IconWand,
  IconPlayerPlay,
  IconClock,
  IconCheck,
  IconRefresh,
  IconBrandOpenai,
} from '@tabler/icons-react';
import Textarea from 'react-textarea-autosize';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

interface VideoGalleryModalProps {
  onSendMessage?: (message: string) => void;
  onDetectContext?: (message: string) => void;
  userId?: string;
  isExpanded?: boolean;
}

interface ChatMsg {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface GeneratedVideo {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
  liked?: boolean;
  duration: number;
  status: 'generating' | 'ready' | 'error';
  errorMsg?: string;
}

const WELCOME_MESSAGE: ChatMsg = {
  id: 'welcome',
  role: 'assistant',
  content: `Olá! Sou seu assistente de criação de vídeos IA. 🎬

Vou te ajudar a criar o vídeo perfeito! Me conta:

**Qual tipo de vídeo você quer criar?**
- 🚀 Animação de logo ou marca
- 🎯 Vídeo promocional de produto
- 🌊 Cena de natureza ou ambiente
- ✨ Efeito visual ou transição
- 💼 Vídeo corporativo
- 🎨 Arte abstrata

Me descreva sua ideia e eu vou perguntar os detalhes necessários antes de gerarmos juntos! 😊`,
  timestamp: Date.now(),
};

// Verifica se o texto da IA indica que está pronto para gerar
const extractVideoPrompt = (text: string): string | null => {
  const markers = [
    /✅\s*PRONTO PARA GERAR[:\s]*(.+)/i,
    /PROMPT FINAL[:\s]*(.+)/i,
    /GERAR VÍDEO[:\s]*(.+)/i,
  ];
  for (const m of markers) {
    const match = text.match(m);
    if (match) return match[1].trim();
  }
  return null;
};

export function VideoGalleryModal({
  onDetectContext,
  userId,
}: VideoGalleryModalProps) {
  // Chat state
  const [messages, setMessages] = useState<ChatMsg[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [videoConvId, setVideoConvId] = useState<string | null>(null);
  const [readyPrompt, setReadyPrompt] = useState<string | null>(null);

  // Video state
  const [videos, setVideos] = useState<GeneratedVideo[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<GeneratedVideo | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [selectedDuration, setSelectedDuration] = useState(5);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const user = useAuthStore(s => s.user);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatLoading]);

  // Carregar vídeos salvos
  useEffect(() => {
    try {
      const saved = localStorage.getItem('syncads_videos_v3');
      if (saved) setVideos(JSON.parse(saved));
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (videos.length > 0) {
      localStorage.setItem('syncads_videos_v3', JSON.stringify(videos.filter(v => v.status !== 'generating')));
    }
  }, [videos]);

  useEffect(() => {
    if (input.trim() && onDetectContext) {
      const t = setTimeout(() => onDetectContext(input), 500);
      return () => clearTimeout(t);
    }
  }, [input, onDetectContext]);

  // VIDEO CHAT SYSTEM PROMPT
  const VIDEO_SYSTEM_PROMPT = `Você é um especialista em criação de vídeos com IA chamado VidBot, parte do sistema SyncAds.
Seu objetivo é conversar com o usuário para entender exatamente como ele quer o vídeo.

REGRAS OBRIGATÓRIAS:
1. Faça de 1 a 3 perguntas específicas sobre: estilo visual, cores, objetos principais, movimento, duração, tom/humor
2. Não gere o vídeo até ter informações suficientes
3. Quando tiver informações suficientes (após 2-4 trocas), escreva UMA linha assim:
   ✅ PRONTO PARA GERAR: [prompt cinemasático detalhado em inglês descrevendo a cena]
4. Seja amigável, criativo e breve (máx. 4 linhas por resposta)
5. NÃO mencione APIs, técnica ou HuggingFace para o usuário`;

  // Envia mensagem para chat-enhanced sem criar ChatConversation no banco
  const handleSendChat = async () => {
    if (!input.trim() || isChatLoading || !user) return;

    const userText = input.trim();
    setInput('');
    setIsChatLoading(true);

    const userMsg: ChatMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      // Histórico de mensagens para enviar diretamente (excluindo welcome)
      const conversationHistory = [
        { role: 'system', content: VIDEO_SYSTEM_PROMPT },
        ...messages
          .filter(m => m.id !== 'welcome')
          .map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: userText },
      ];

      // UUID estável para este modal (não precisa existir no banco)
      const pseudoConvId = `video-modal-${user.id}`;

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/chat-enhanced`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          message: userText,
          conversationId: pseudoConvId,
          conversationHistory,
          systemPrompt: VIDEO_SYSTEM_PROMPT,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || errData.error || `Erro ${response.status}`);
      }

      const data = await response.json();
      const aiContent = data.response || data.message || data.content || 'Tente novamente.';

      const aiMsg: ChatMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiContent,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, aiMsg]);

      // Verificar se IA indicou que está pronto para gerar
      const extracted = extractVideoPrompt(aiContent);
      if (extracted) {
        setReadyPrompt(extracted);
      }
    } catch (error: any) {
      const errMsg = error.message?.includes('fetch') ? 'Erro de conexão. Verifique sua internet.' : (error.message || 'Tente novamente.');
      const aiMsg: ChatMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ ${errMsg}`,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } finally {
      setIsChatLoading(false);
      textareaRef.current?.focus();
    }
  };

  // Gerar vídeo via Edge Function
  const handleGenerateVideo = async (prompt?: string) => {
    const finalPrompt = prompt || readyPrompt || messages
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .join(' ');

    if (!finalPrompt.trim() || isGenerating || !user) {
      toast({ title: 'Descreva o vídeo no chat primeiro', variant: 'destructive' });
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setProgressText('Iniciando geração...');
    setReadyPrompt(null);

    const tempId = Date.now().toString();
    const tempVideo: GeneratedVideo = {
      id: tempId,
      url: '',
      prompt: finalPrompt,
      timestamp: Date.now(),
      duration: selectedDuration,
      status: 'generating',
    };
    setVideos(prev => [tempVideo, ...prev]);

    const steps = [
      { pct: 15, text: 'Carregando modelo HuggingFace...' },
      { pct: 35, text: 'Processando prompt...' },
      { pct: 55, text: 'Gerando frames do vídeo...' },
      { pct: 75, text: 'Renderizando...' },
      { pct: 90, text: 'Finalizando...' },
    ];
    let stepIdx = 0;
    const progressInterval = setInterval(() => {
      if (stepIdx < steps.length) {
        const s = steps[stepIdx++];
        setProgress(s.pct);
        setProgressText(s.text);
      }
    }, 4000);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/generate-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          prompt: finalPrompt,
          duration: selectedDuration,
          style: 'cinematic',
        }),
      });

      const result = await response.json();
      clearInterval(progressInterval);
      setProgress(100);
      setProgressText('Pronto!');

      if (result.success && result.videoUrl) {
        setVideos(prev => prev.map(v =>
          v.id === tempId ? { ...v, url: result.videoUrl, status: 'ready' } : v
        ));
        toast({ title: '🎉 Vídeo gerado!', description: 'Seu vídeo está na galeria.' });

        // Adicionar mensagem no chat informando que foi gerado
        const doneMsg: ChatMsg = {
          id: Date.now().toString(),
          role: 'assistant',
          content: '✅ **Vídeo gerado com sucesso!** Veja na galeria ao lado. Quer criar outro? Me conta sua próxima ideia! 🎬',
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, doneMsg]);
      } else {
        throw new Error(result.error || 'Falha na geração');
      }
    } catch (error: any) {
      clearInterval(progressInterval);
      const errMsg = error.message || 'Erro desconhecido';
      setVideos(prev => prev.map(v =>
        v.id === tempId ? { ...v, status: 'error', errorMsg: errMsg } : v
      ));
      toast({ title: 'Erro ao gerar vídeo', description: errMsg, variant: 'destructive' });

      const errChatMsg: ChatMsg = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `❌ Houve um erro ao gerar o vídeo: ${errMsg}\n\nOs modelos gratuitos do HuggingFace têm limitações. Quer tentar novamente ou ajustar o prompt?`,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errChatMsg]);
    } finally {
      setIsGenerating(false);
      setProgress(0);
      setProgressText('');
    }
  };

  const handleDelete = (id: string) => {
    setVideos(prev => prev.filter(v => v.id !== id));
    if (selectedVideo?.id === id) setSelectedVideo(null);
  };

  const toggleLike = (id: string) => {
    setVideos(prev => prev.map(v => v.id === id ? { ...v, liked: !v.liked } : v));
  };

  const handleDownload = (video: GeneratedVideo) => {
    if (!video.url) return;
    const a = document.createElement('a');
    a.href = video.url;
    a.download = `syncads-video-${video.id}.mp4`;
    a.target = '_blank';
    a.click();
  };

  const readyVideos = videos.filter(v => v.status === 'ready');

  return (
    <div className="flex h-full bg-[#0a0a10]">
      {/* ===== LEFT: AI Chat ===== */}
      <div className="w-[380px] flex-shrink-0 flex flex-col border-r border-white/5">
        {/* Chat Header */}
        <div className="px-4 py-3 border-b border-white/5 bg-black/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-600/30">
              <IconSparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">IA de Vídeos</h3>
              <p className="text-xs text-gray-500">Descreva sua ideia, eu crio</p>
            </div>
            <div className="ml-auto flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span className="text-xs text-gray-500">Online</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map(msg => {
            const thinkingMatch = msg.content.match(/<antigravity_thinking>([\s\S]*?)<\/antigravity_thinking>/);
            const thinkingContent = thinkingMatch ? thinkingMatch[1].trim() : null;
            const cleanContent = msg.content.replace(/<antigravity_thinking>[\s\S]*?<\/antigravity_thinking>/, '').trim();

            const isUser = msg.role === 'user';
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'flex gap-2',
                  isUser ? 'flex-row-reverse' : 'flex-row'
                )}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex-shrink-0 flex items-center justify-center mt-1">
                    <IconBrandOpenai className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className={cn(
                  'max-w-[85%] rounded-2xl p-3',
                  isUser
                    ? 'bg-violet-600/80 text-white rounded-tr-sm'
                    : 'bg-white/5 border border-white/8 text-gray-200 rounded-tl-sm'
                )}>
                  {thinkingContent && <PlanningBlock content={thinkingContent} />}
                  {cleanContent && (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {cleanContent}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}

          {/* AI Typing */}
          {isChatLoading && (
            <div className="flex gap-2">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex-shrink-0 flex items-center justify-center">
                <IconLoader2 className="w-3.5 h-3.5 text-white animate-spin" />
              </div>
              <div className="bg-white/5 border border-white/8 rounded-2xl rounded-tl-sm p-3">
                <div className="flex gap-1.5 items-center">
                  {[0, 0.2, 0.4].map((d, i) => (
                    <motion.span
                      key={i}
                      animate={{ scale: [1, 1.4, 1] }}
                      transition={{ repeat: Infinity, duration: 0.9, delay: d }}
                      className="w-1.5 h-1.5 rounded-full bg-violet-500"
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Ready to generate banner */}
        <AnimatePresence>
          {readyPrompt && !isGenerating && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mx-3 mb-2 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 border border-violet-500/40 rounded-xl p-3">
                <p className="text-xs text-violet-300 mb-2 font-medium">✅ Pronto para gerar!</p>
                <p className="text-xs text-gray-400 line-clamp-2 mb-2">{readyPrompt}</p>
                <button
                  onClick={() => handleGenerateVideo()}
                  className="w-full py-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                >
                  <IconWand className="w-4 h-4" /> Gerar Vídeo Agora
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input */}
        <div className="p-3 border-t border-white/5 bg-black/10">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat(); } }}
              placeholder="Descreva sua ideia de vídeo..."
              maxRows={3}
              disabled={isChatLoading || isGenerating}
              className={cn(
                'w-full px-4 py-2.5 pr-12',
                'bg-white/5 border border-white/10 rounded-xl',
                'text-white placeholder:text-gray-600 text-sm',
                'focus:outline-none focus:ring-2 focus:ring-violet-500/50',
                'disabled:opacity-40 resize-none',
              )}
            />
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleSendChat}
              disabled={!input.trim() || isChatLoading || isGenerating}
              className={cn(
                'absolute right-2 bottom-2 w-8 h-8 rounded-xl flex items-center justify-center transition-all',
                input.trim() && !isChatLoading
                  ? 'bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-600/30'
                  : 'bg-white/5 text-gray-600 cursor-not-allowed'
              )}
            >
              {isChatLoading
                ? <IconLoader2 className="w-4 h-4 animate-spin" />
                : <IconSend className="w-4 h-4" />
              }
            </motion.button>
          </div>

          {/* Manual generate button */}
          <button
            onClick={() => handleGenerateVideo()}
            disabled={isGenerating || messages.filter(m => m.role === 'user').length === 0}
            className={cn(
              'mt-2 w-full py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all',
              !isGenerating && messages.filter(m => m.role === 'user').length > 0
                ? 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
                : 'bg-white/3 text-gray-600 cursor-not-allowed'
            )}
          >
            {isGenerating
              ? <><IconLoader2 className="w-4 h-4 animate-spin" /> Gerando... {progress}%</>
              : <><IconWand className="w-4 h-4" /> Gerar com o prompt atual</>
            }
          </button>
        </div>
      </div>

      {/* ===== RIGHT: Video Gallery ===== */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Gallery Header */}
        <div className="px-5 py-3 border-b border-white/5 bg-black/10 flex items-center gap-3">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
            <IconVideo className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Galeria de Vídeos</h3>
            <p className="text-xs text-gray-500">{readyVideos.length} pronto{readyVideos.length !== 1 ? 's' : ''} · HuggingFace</p>
          </div>

          {/* Progress bar during generation */}
          <AnimatePresence>
            {isGenerating && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="ml-auto flex items-center gap-3 flex-1 max-w-xs"
              >
                <div className="flex-1">
                  <p className="text-xs text-violet-400 mb-1">{progressText}</p>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-violet-600 to-fuchsia-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Duration selector */}
          <div className="ml-auto flex items-center gap-1.5">
            <span className="text-xs text-gray-500">Duração:</span>
            {[3, 5, 10].map(d => (
              <button
                key={d}
                onClick={() => setSelectedDuration(d)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-medium transition-all',
                  selectedDuration === d
                    ? 'bg-violet-600 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                )}
              >
                {d}s
              </button>
            ))}
          </div>
        </div>

        {/* Gallery Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {videos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full space-y-5 text-center">
              <motion.div
                animate={{ scale: [1, 1.08, 1], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-2xl shadow-violet-600/30"
              >
                <IconVideo className="w-10 h-10 text-white" />
              </motion.div>
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Seus vídeos aparecerão aqui</h3>
                <p className="text-sm text-gray-500 max-w-xs">
                  Converse com a IA no chat ao lado para criar seu vídeo com HuggingFace (gratuito)
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AnimatePresence>
                {videos.map((video, idx) => (
                  <motion.div
                    key={video.id}
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="group relative aspect-video rounded-2xl overflow-hidden bg-white/5 border border-white/8"
                  >
                    {video.status === 'generating' ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-violet-900/30 to-fuchsia-900/20 p-4">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                          className="w-10 h-10 rounded-full border-2 border-violet-500/30 border-t-violet-500 mb-3"
                        />
                        <p className="text-xs text-violet-300 font-medium text-center mb-1">Gerando vídeo...</p>
                        <p className="text-xs text-gray-500 text-center line-clamp-2">{video.prompt}</p>
                      </div>
                    ) : video.status === 'error' ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/20 p-4">
                        <IconX className="w-8 h-8 text-red-400 mb-2" />
                        <p className="text-xs text-red-300 text-center mb-3 line-clamp-2">{video.errorMsg}</p>
                        <button
                          onClick={() => handleDelete(video.id)}
                          className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 text-xs"
                        >
                          Remover
                        </button>
                      </div>
                    ) : (
                      <>
                        <video
                          src={video.url}
                          className="w-full h-full object-cover"
                          muted
                          loop
                          onMouseEnter={e => (e.target as HTMLVideoElement).play()}
                          onMouseLeave={e => { const v = e.target as HTMLVideoElement; v.pause(); v.currentTime = 0; }}
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col justify-between p-3">
                          <div className="flex justify-end gap-1.5">
                            <button onClick={() => toggleLike(video.id)} className="w-8 h-8 rounded-xl bg-black/50 flex items-center justify-center">
                              {video.liked ? <IconHeartFilled className="w-4 h-4 text-red-500" /> : <IconHeart className="w-4 h-4 text-white" />}
                            </button>
                            <button onClick={() => handleDownload(video)} className="w-8 h-8 rounded-xl bg-black/50 flex items-center justify-center">
                              <IconDownload className="w-4 h-4 text-white" />
                            </button>
                            <button onClick={() => handleDelete(video.id)} className="w-8 h-8 rounded-xl bg-red-500/30 flex items-center justify-center">
                              <IconTrash className="w-4 h-4 text-red-300" />
                            </button>
                          </div>
                          <div>
                            <p className="text-xs text-white/90 line-clamp-1">{video.prompt}</p>
                            <button
                              onClick={() => setSelectedVideo(video)}
                              className="text-xs text-violet-400 flex items-center gap-1 mt-1"
                            >
                              <IconPlayerPlay className="w-3 h-3" /> Reproduzir
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* ===== Full screen player ===== */}
      <AnimatePresence>
        {selectedVideo?.status === 'ready' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedVideo(null)}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.92 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.92 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-3xl bg-[#0a0a10] rounded-3xl overflow-hidden border border-white/10"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                <p className="text-sm font-medium text-white truncate max-w-xs">{selectedVideo.prompt}</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleDownload(selectedVideo)} className="px-3 py-1.5 rounded-xl bg-violet-600 text-white text-xs flex items-center gap-1.5">
                    <IconDownload className="w-3.5 h-3.5" /> Baixar
                  </button>
                  <button onClick={() => setSelectedVideo(null)} className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center">
                    <IconX className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
              <div className="bg-black aspect-video">
                <video src={selectedVideo.url} className="w-full h-full" controls autoPlay loop />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default VideoGalleryModal;
