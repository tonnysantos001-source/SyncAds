/**
 * MEDIA GENERATOR PANEL
 * Painel unificado de geração de mídia estilo ChatGPT
 * 
 * Abas: 🖼️ Imagem | 🎬 Vídeo | 🔊 Áudio
 * Provedores: Hugging Face (FLUX.1-schnell) + Pollinations.ai (fallback)
 * 
 * @version 1.0.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  IconPhoto,
  IconVideo,
  IconMicrophone,
  IconSend,
  IconLoader2,
  IconDownload,
  IconX,
  IconPlayerPlay,
  IconPlayerPause,
  IconWand,
  IconSparkles,
  IconAlertCircle,
  IconCheck,
} from '@tabler/icons-react';
import { supabase } from '@/lib/supabase';

// ============================================================
// TYPES
// ============================================================

type MediaTab = 'image' | 'video' | 'audio';

interface GeneratedImage {
  url: string;
  prompt: string;
  provider: string;
}

interface GeneratedAudio {
  url: string;
  text: string;
  provider: string;
  duration?: number;
}

interface GeneratedVideo {
  url: string;
  prompt: string;
  isFrameAnimation?: boolean;
}

interface MediaGeneratorPanelProps {
  onClose: () => void;
  onInsertMedia?: (type: MediaTab, url: string, description: string) => void;
}

// ============================================================
// IMAGE STYLES
// ============================================================

const IMAGE_STYLES = [
  { id: 'photorealistic', label: '📷 Fotorrealista', suffix: ', photorealistic, high quality, 8k' },
  { id: 'artistic', label: '🎨 Artístico', suffix: ', digital art, concept art, vivid colors' },
  { id: 'cartoon', label: '🖼️ Cartoon', suffix: ', cartoon style, flat design, colorful illustration' },
  { id: 'minimalist', label: '✨ Minimalista', suffix: ', minimalist, clean design, simple shapes' },
  { id: 'cinematic', label: '🎬 Cinemático', suffix: ', cinematic, dramatic lighting, movie scene' },
];

const AUDIO_VOICES = [
  { id: 'facebook/mms-tts-por', label: '🇧🇷 Português BR', lang: 'pt-BR' },
  { id: 'facebook/mms-tts-eng', label: '🇺🇸 Inglês', lang: 'en-US' },
  { id: 'facebook/mms-tts-spa', label: '🇪🇸 Espanhol', lang: 'es' },
];

// ============================================================
// MEDIA GENERATOR PANEL COMPONENT
// ============================================================

export function MediaGeneratorPanel({ onClose, onInsertMedia }: MediaGeneratorPanelProps) {
  const [activeTab, setActiveTab] = useState<MediaTab>('image');

  // Image state
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageStyle, setImageStyle] = useState('photorealistic');
  const [imageSize, setImageSize] = useState<'square' | 'portrait' | 'landscape'>('square');
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState('');

  // Audio state
  const [audioText, setAudioText] = useState('');
  const [audioVoice, setAudioVoice] = useState('facebook/mms-tts-por');
  const [generatedAudio, setGeneratedAudio] = useState<GeneratedAudio | null>(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState('');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Video state
  const [videoPrompt, setVideoPrompt] = useState('');
  const [generatedVideo, setGeneratedVideo] = useState<GeneratedVideo | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState('');

  // ============================================================
  // GENERATE IMAGE
  // ============================================================

  const generateImage = async () => {
    if (!imagePrompt.trim()) return;
    setImageLoading(true);
    setImageError('');
    setGeneratedImage(null);

    try {
      const style = IMAGE_STYLES.find(s => s.id === imageStyle);
      const finalPrompt = imagePrompt + (style?.suffix || '');

      const dimensions = {
        square: { w: 1024, h: 1024 },
        portrait: { w: 768, h: 1344 },
        landscape: { w: 1344, h: 768 },
      }[imageSize];

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      // Try edge function (with HuggingFace FLUX.1 + Pollinations fallback)
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-image`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            prompt: finalPrompt,
            size: `${dimensions.w}x${dimensions.h}`,
            provider: 'auto',
          }),
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Falha ao gerar imagem');
      }

      const data = await response.json();
      if (data.image?.url) {
        setGeneratedImage({
          url: data.image.url,
          prompt: imagePrompt,
          provider: data.image.provider || 'AI',
        });
      } else {
        throw new Error('URL da imagem não retornada');
      }
    } catch (err: any) {
      setImageError(err.message || 'Erro ao gerar imagem. Tente novamente.');
    } finally {
      setImageLoading(false);
    }
  };

  // ============================================================
  // GENERATE AUDIO
  // ============================================================

  const generateAudio = async () => {
    if (!audioText.trim()) return;
    setAudioLoading(true);
    setAudioError('');
    setGeneratedAudio(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-audio`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            text: audioText,
            voice: audioVoice,
            provider: 'huggingface',
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao gerar áudio');
      }

      if (data.audio?.url) {
        setGeneratedAudio({
          url: data.audio.url,
          text: audioText,
          provider: data.audio.provider || 'Hugging Face',
          duration: data.audio.duration,
        });
      } else {
        throw new Error('URL do áudio não retornada');
      }
    } catch (err: any) {
      setAudioError(err.message || 'Erro ao gerar áudio. Tente novamente.');
    } finally {
      setAudioLoading(false);
    }
  };

  const toggleAudio = () => {
    if (!audioRef.current || !generatedAudio) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnd = () => setIsPlayingAudio(false);
    audio.addEventListener('ended', onEnd);
    return () => audio.removeEventListener('ended', onEnd);
  }, [generatedAudio]);

  // ============================================================
  // GENERATE VIDEO (Image + Animation)
  // ============================================================

  const generateVideo = async () => {
    if (!videoPrompt.trim()) return;
    setVideoLoading(true);
    setVideoError('');
    setGeneratedVideo(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      // Generate a "video" as animated image (Ken Burns effect)
      // Uses Pollinations for fast free images
      const encodedPrompt = encodeURIComponent(videoPrompt + ', cinematic scene, dynamic movement, vivid colors');
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1280&height=720&nologo=true&seed=${Date.now()}`;

      // Verify image loads
      await new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Falha ao carregar imagem base'));
        img.src = imageUrl;
      });

      setGeneratedVideo({
        url: imageUrl,
        prompt: videoPrompt,
        isFrameAnimation: true,
      });
    } catch (err: any) {
      setVideoError(err.message || 'Erro ao gerar vídeo. Tente novamente.');
    } finally {
      setVideoLoading(false);
    }
  };

  // ============================================================
  // TABS
  // ============================================================

  const tabs: { id: MediaTab; label: string; icon: React.ComponentType<any>; color: string }[] = [
    { id: 'image', label: 'Imagem', icon: IconPhoto, color: 'text-pink-400' },
    { id: 'video', label: 'Vídeo', icon: IconVideo, color: 'text-orange-400' },
    { id: 'audio', label: 'Áudio', icon: IconMicrophone, color: 'text-green-400' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.96 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="absolute bottom-full left-0 mb-3 w-full max-w-xl bg-gray-900 border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <IconSparkles className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-semibold text-white">Gerar Mídia com IA</span>
          <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">Hugging Face</span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <IconX className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 pb-3 border-b border-white/5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
                active
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              )}
            >
              <Icon className={cn('w-4 h-4', active ? tab.color : '')} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="px-4 py-4 space-y-4">
        <AnimatePresence mode="wait">
          {/* ====== IMAGE TAB ====== */}
          {activeTab === 'image' && (
            <motion.div
              key="image"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-3"
            >
              <textarea
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                placeholder="Descreva a imagem que deseja criar... Ex: Um astronauta surfando em Marte ao pôr do sol"
                rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder:text-gray-500 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-500/50"
              />

              {/* Styles */}
              <div className="flex flex-wrap gap-1.5">
                {IMAGE_STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setImageStyle(style.id)}
                    className={cn(
                      'text-xs px-2.5 py-1 rounded-full transition-all',
                      imageStyle === style.id
                        ? 'bg-pink-500/20 border border-pink-500/40 text-pink-300'
                        : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white'
                    )}
                  >
                    {style.label}
                  </button>
                ))}
              </div>

              {/* Size */}
              <div className="flex gap-2">
                {(['square', 'portrait', 'landscape'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setImageSize(s)}
                    className={cn(
                      'flex-1 py-1.5 text-xs rounded-lg border transition-all',
                      imageSize === s
                        ? 'border-pink-500/40 bg-pink-500/10 text-pink-300'
                        : 'border-white/10 bg-white/5 text-gray-400 hover:text-white'
                    )}
                  >
                    {s === 'square' ? '⬜ Quadrado' : s === 'portrait' ? '📱 Retrato' : '🖥️ Paisagem'}
                  </button>
                ))}
              </div>

              {/* Error */}
              {imageError && (
                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <IconAlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-300">{imageError}</p>
                </div>
              )}

              {/* Generated Image Preview */}
              {generatedImage && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative rounded-xl overflow-hidden border border-white/10 group"
                >
                  <img
                    src={generatedImage.url}
                    alt={generatedImage.prompt}
                    className="w-full h-48 object-cover"
                    onError={() => setImageError('Falha ao carregar imagem gerada')}
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <a
                      href={generatedImage.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="flex items-center gap-1.5 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm text-white backdrop-blur-sm transition-colors"
                    >
                      <IconDownload className="w-4 h-4" />
                      Baixar
                    </a>
                    {onInsertMedia && (
                      <button
                        onClick={() => onInsertMedia('image', generatedImage.url, generatedImage.prompt)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-blue-600/80 hover:bg-blue-600 rounded-lg text-sm text-white backdrop-blur-sm transition-colors"
                      >
                        <IconCheck className="w-4 h-4" />
                        Usar no Chat
                      </button>
                    )}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-xs text-gray-300 truncate">{generatedImage.provider}</p>
                  </div>
                </motion.div>
              )}

              <button
                onClick={generateImage}
                disabled={!imagePrompt.trim() || imageLoading}
                className={cn(
                  'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm transition-all',
                  imagePrompt.trim() && !imageLoading
                    ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:from-pink-700 hover:to-purple-700 shadow-lg'
                    : 'bg-white/5 text-gray-500 cursor-not-allowed'
                )}
              >
                {imageLoading ? (
                  <>
                    <IconLoader2 className="w-4 h-4 animate-spin" />
                    Gerando com FLUX.1...
                  </>
                ) : (
                  <>
                    <IconWand className="w-4 h-4" />
                    Gerar Imagem
                  </>
                )}
              </button>
            </motion.div>
          )}

          {/* ====== VIDEO TAB ====== */}
          {activeTab === 'video' && (
            <motion.div
              key="video"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-3"
            >
              {/* Info Banner */}
              <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <IconAlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-amber-300 font-medium">Vídeo Animado (Gratuito)</p>
                  <p className="text-xs text-amber-400/70 mt-0.5">
                    Gera imagem + efeito Ken Burns. Para vídeo real (mp4), configure D-ID nas integrações.
                  </p>
                </div>
              </div>

              <textarea
                value={videoPrompt}
                onChange={(e) => setVideoPrompt(e.target.value)}
                placeholder="Descreva a cena do vídeo... Ex: Produto sendo usado numa cidade futurista ao entardecer"
                rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder:text-gray-500 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-orange-500/50"
              />

              {/* Error */}
              {videoError && (
                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <IconAlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-300">{videoError}</p>
                </div>
              )}

              {/* Generated Video Preview */}
              {generatedVideo && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative rounded-xl overflow-hidden border border-white/10"
                >
                  {/* Ken Burns CSS animation */}
                  <div className="relative w-full h-48 overflow-hidden">
                    <img
                      src={generatedVideo.url}
                      alt={generatedVideo.prompt}
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{
                        animation: 'kenBurns 8s ease-in-out infinite alternate',
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-full">
                        <p className="text-xs text-orange-300">🎬 Cena Animada</p>
                      </div>
                    </div>
                  </div>
                  {onInsertMedia && (
                    <div className="p-3 flex items-center justify-end gap-2 border-t border-white/10">
                      <button
                        onClick={() => onInsertMedia('video', generatedVideo.url, videoPrompt)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600/80 hover:bg-orange-600 rounded-lg text-xs text-white transition-colors"
                      >
                        <IconCheck className="w-3.5 h-3.5" />
                        Usar no Chat
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

              <button
                onClick={generateVideo}
                disabled={!videoPrompt.trim() || videoLoading}
                className={cn(
                  'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm transition-all',
                  videoPrompt.trim() && !videoLoading
                    ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-700 hover:to-red-700 shadow-lg'
                    : 'bg-white/5 text-gray-500 cursor-not-allowed'
                )}
              >
                {videoLoading ? (
                  <>
                    <IconLoader2 className="w-4 h-4 animate-spin" />
                    Gerando cena...
                  </>
                ) : (
                  <>
                    <IconVideo className="w-4 h-4" />
                    Gerar Cena
                  </>
                )}
              </button>
            </motion.div>
          )}

          {/* ====== AUDIO TAB ====== */}
          {activeTab === 'audio' && (
            <motion.div
              key="audio"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-3"
            >
              <textarea
                value={audioText}
                onChange={(e) => setAudioText(e.target.value)}
                placeholder="Digite o texto para transformar em áudio... Ex: Bem-vindos ao SyncAds, a plataforma de marketing com IA"
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder:text-gray-500 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-green-500/50"
              />

              {/* Voice Selection */}
              <div>
                <p className="text-xs text-gray-500 mb-1.5">Voz / Idioma:</p>
                <div className="flex flex-col gap-1.5">
                  {AUDIO_VOICES.map((voice) => (
                    <button
                      key={voice.id}
                      onClick={() => setAudioVoice(voice.id)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-all border',
                        audioVoice === voice.id
                          ? 'border-green-500/40 bg-green-500/10 text-green-300'
                          : 'border-white/10 bg-white/5 text-gray-400 hover:text-white'
                      )}
                    >
                      <IconMicrophone className="w-3.5 h-3.5" />
                      {voice.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error */}
              {audioError && (
                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <IconAlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-300">{audioError}</p>
                </div>
              )}

              {/* Generated Audio Player */}
              {generatedAudio && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                        <IconMicrophone className="w-4 h-4 text-green-400" />
                      </div>
                      <div>
                        <p className="text-xs text-white font-medium">Áudio Gerado</p>
                        <p className="text-xs text-gray-500">{generatedAudio.provider}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={toggleAudio}
                        className="p-2 rounded-full bg-green-500/20 hover:bg-green-500/30 text-green-400 transition-colors"
                      >
                        {isPlayingAudio ? (
                          <IconPlayerPause className="w-4 h-4" />
                        ) : (
                          <IconPlayerPlay className="w-4 h-4" />
                        )}
                      </button>
                      <a
                        href={generatedAudio.url}
                        download
                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 transition-colors"
                      >
                        <IconDownload className="w-4 h-4" />
                      </a>
                    </div>
                  </div>

                  {/* Waveform visualization (decorative) */}
                  {isPlayingAudio && (
                    <div className="flex items-center gap-0.5 h-6 px-1">
                      {Array.from({ length: 24 }).map((_, i) => (
                        <motion.div
                          key={i}
                          className="flex-1 bg-green-400 rounded-full origin-center"
                          animate={{ scaleY: [0.3, 1, 0.3] }}
                          transition={{
                            duration: 0.8,
                            repeat: Infinity,
                            delay: i * 0.04,
                            ease: 'easeInOut',
                          }}
                          style={{ height: '100%' }}
                        />
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-gray-400 truncate">"{generatedAudio.text.substring(0, 80)}..."</p>

                  {onInsertMedia && (
                    <button
                      onClick={() => onInsertMedia('audio', generatedAudio.url, generatedAudio.text)}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-green-600/80 hover:bg-green-600 rounded-lg text-xs text-white transition-colors"
                    >
                      <IconCheck className="w-3.5 h-3.5" />
                      Usar no Chat
                    </button>
                  )}

                  {/* Hidden audio element */}
                  <audio
                    ref={audioRef}
                    src={generatedAudio.url}
                    onEnded={() => setIsPlayingAudio(false)}
                    className="hidden"
                  />
                </motion.div>
              )}

              <button
                onClick={generateAudio}
                disabled={!audioText.trim() || audioLoading}
                className={cn(
                  'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm transition-all',
                  audioText.trim() && !audioLoading
                    ? 'bg-gradient-to-r from-green-600 to-teal-600 text-white hover:from-green-700 hover:to-teal-700 shadow-lg'
                    : 'bg-white/5 text-gray-500 cursor-not-allowed'
                )}
              >
                {audioLoading ? (
                  <>
                    <IconLoader2 className="w-4 h-4 animate-spin" />
                    Sintetizando voz...
                  </>
                ) : (
                  <>
                    <IconMicrophone className="w-4 h-4" />
                    Gerar Áudio TTS
                  </>
                )}
              </button>

              <p className="text-xs text-center text-gray-600">
                Powered by Hugging Face MMS · Gratuito
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Ken Burns CSS */}
      <style>{`
        @keyframes kenBurns {
          0% { transform: scale(1) translate(0, 0); }
          100% { transform: scale(1.15) translate(-3%, -2%); }
        }
      `}</style>
    </motion.div>
  );
}

export default MediaGeneratorPanel;
