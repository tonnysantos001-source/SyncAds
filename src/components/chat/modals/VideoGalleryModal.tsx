/**
 * VIDEO GALLERY MODAL
 * Galeria de vídeos - gerar, visualizar, editar vídeos com IA
 *
 * Features:
 * - Grid de vídeos gerados
 * - Geração de vídeos com IA (Runway, Pika Labs, etc)
 * - Preview em player
 * - Download e compartilhamento
 * - Histórico de gerações
 * - Filtros e busca
 *
 * @version 1.0.0
 * @date 2025-01-08
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
  IconSearch,
  IconFilter,
  IconCopy,
  IconCheck,
  IconPlayerPlay,
  IconPlayerPause,
  IconTrash,
  IconWand,
  IconClock,
  IconMaximize,
} from '@tabler/icons-react';
import Textarea from 'react-textarea-autosize';
import { generateVideo } from '@/lib/ai/advancedFeatures';
import { useToast } from '@/components/ui/use-toast';

interface VideoGalleryModalProps {
  onSendMessage?: (message: string) => void;
  onDetectContext?: (message: string) => void;
  userId?: string;
  isExpanded?: boolean;
}

interface GeneratedVideo {
  id: string;
  url: string;
  thumbnailUrl?: string;
  prompt: string;
  timestamp: number;
  liked?: boolean;
  duration: number;
  resolution: string;
  status: 'generating' | 'ready' | 'error';
}

const VIDEO_DURATIONS = [
  { id: '3', name: '3 segundos', duration: 3 },
  { id: '5', name: '5 segundos', duration: 5 },
  { id: '10', name: '10 segundos', duration: 10 },
];

const VIDEO_STYLES = [
  { id: 'realistic', name: 'Realista', icon: '🎬' },
  { id: 'animated', name: 'Animado', icon: '🎨' },
  { id: 'cinematic', name: 'Cinemático', icon: '🎥' },
  { id: 'abstract', name: 'Abstrato', icon: '🌀' },
];

const QUICK_PROMPTS = [
  { icon: '🚀', text: 'Animação de logo corporativo moderno' },
  { icon: '🌊', text: 'Cena relaxante de natureza' },
  { icon: '🎯', text: 'Vídeo promocional de produto' },
  { icon: '✨', text: 'Transição animada com efeitos' },
];

export function VideoGalleryModal({
  onSendMessage,
  onDetectContext,
  userId,
  isExpanded,
}: VideoGalleryModalProps) {
  const [input, setInput] = useState('');
  const [videos, setVideos] = useState<GeneratedVideo[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState('realistic');
  const [selectedDuration, setSelectedDuration] = useState(5);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<GeneratedVideo | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [generatingProgress, setGeneratingProgress] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  // Load saved videos from localStorage
  useEffect(() => {
    const savedVideos = localStorage.getItem('syncads_generated_videos');
    if (savedVideos) {
      try {
        setVideos(JSON.parse(savedVideos));
      } catch (error) {
        console.error('Error loading saved videos:', error);
      }
    }
  }, []);

  // Save videos to localStorage
  useEffect(() => {
    if (videos.length > 0) {
      localStorage.setItem('syncads_generated_videos', JSON.stringify(videos));
    }
  }, [videos]);

  // Detect context on input change
  useEffect(() => {
    if (input.trim() && onDetectContext) {
      const timeoutId = setTimeout(() => {
        onDetectContext(input);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [input, onDetectContext]);

  // Handle generate video
  const handleGenerate = async () => {
    if (!input.trim() || isGenerating || !userId) return;

    const prompt = input.trim();
    setInput('');
    setIsGenerating(true);
    setGeneratingProgress(0);

    // Criar vídeo placeholder
    const tempVideo: GeneratedVideo = {
      id: Date.now().toString(),
      url: '',
      prompt,
      timestamp: Date.now(),
      duration: selectedDuration,
      resolution: '1920x1080',
      status: 'generating',
    };

    setVideos((prev) => [tempVideo, ...prev]);

    try {
      onSendMessage?.(prompt);

      toast({
        title: 'Gerando vídeo...',
        description: 'Isso pode levar alguns minutos',
      });

      // Simular progresso
      const progressInterval = setInterval(() => {
        setGeneratingProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 3000);

      // Chamar API de geração de vídeo
      const result = await generateVideo({
        prompt,
        duration: selectedDuration,
        style: selectedStyle,
        userId,
      });

      clearInterval(progressInterval);
      setGeneratingProgress(100);

      if (result.success && result.videoUrl) {
        // Atualizar vídeo com URL real
        setVideos((prev) =>
          prev.map((v) =>
            v.id === tempVideo.id
              ? {
                  ...v,
                  url: result.videoUrl!,
                  thumbnailUrl: result.thumbnailUrl,
                  status: 'ready',
                }
              : v
          )
        );

        toast({
          title: 'Vídeo gerado!',
          description: 'Seu vídeo foi criado com sucesso',
        });
      } else {
        throw new Error(result.error || 'Erro ao gerar vídeo');
      }
    } catch (error: any) {
      console.error('Error generating video:', error);

      // Marcar vídeo como erro
      setVideos((prev) =>
        prev.map((v) =>
          v.id === tempVideo.id ? { ...v, status: 'error' } : v
        )
      );

      toast({
        title: 'Erro ao gerar vídeo',
        description: error.message || 'Tente novamente',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
      setGeneratingProgress(0);
      textareaRef.current?.focus();
    }
  };

  // Handle key down
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  // Handle quick prompt
  const handleQuickPrompt = (text: string) => {
    setInput(text);
    textareaRef.current?.focus();
  };

  // Toggle like
  const toggleLike = (videoId: string) => {
    setVideos((prev) =>
      prev.map((vid) =>
        vid.id === videoId ? { ...vid, liked: !vid.liked } : vid
      )
    );
  };

  // Download video
  const handleDownload = async (video: GeneratedVideo) => {
    if (video.status !== 'ready') return;

    try {
      const response = await fetch(video.url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `syncads-video-${video.id}.mp4`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'Download iniciado',
        description: 'O vídeo está sendo baixado',
      });
    } catch (error) {
      toast({
        title: 'Erro ao baixar',
        description: 'Tente novamente',
        variant: 'destructive',
      });
    }
  };

  // Copy video URL
  const handleCopyUrl = (video: GeneratedVideo) => {
    if (video.status !== 'ready') return;

    navigator.clipboard.writeText(video.url);
    setCopiedId(video.id);
    setTimeout(() => setCopiedId(null), 2000);

    toast({
      title: 'Link copiado!',
      description: 'URL do vídeo copiada para área de transferência',
    });
  };

  // Delete video
  const handleDelete = (videoId: string) => {
    setVideos((prev) => prev.filter((vid) => vid.id !== videoId));
    setSelectedVideo(null);

    toast({
      title: 'Vídeo removido',
      description: 'O vídeo foi excluído da galeria',
    });
  };

  // Toggle play/pause
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Filter videos
  const filteredVideos = videos.filter((vid) =>
    searchQuery
      ? vid.prompt.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  // Format duration
  const formatDuration = (seconds: number) => {
    return `${seconds}s`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10 bg-black/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-lg">
              <IconVideo className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Galeria de Vídeos</h2>
              <p className="text-sm text-gray-400">
                {videos.filter((v) => v.status === 'ready').length} vídeos prontos
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar vídeos..."
                className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-64"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'p-2 rounded-lg transition-colors',
                showFilters
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              )}
            >
              <IconFilter className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Generation Controls */}
        <div className="space-y-3">
          {/* Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex gap-4 pb-3">
                  {/* Style selector */}
                  <div className="flex-1">
                    <label className="text-xs text-gray-400 mb-2 block">Estilo</label>
                    <div className="flex gap-2">
                      {VIDEO_STYLES.map((style) => (
                        <button
                          key={style.id}
                          onClick={() => setSelectedStyle(style.id)}
                          className={cn(
                            'flex-1 px-3 py-2 rounded-lg text-sm transition-all',
                            selectedStyle === style.id
                              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                              : 'bg-white/5 text-gray-400 hover:bg-white/10'
                          )}
                        >
                          <span className="mr-1">{style.icon}</span>
                          {style.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Duration selector */}
                  <div className="w-64">
                    <label className="text-xs text-gray-400 mb-2 block">Duração</label>
                    <div className="flex gap-2">
                      {VIDEO_DURATIONS.map((dur) => (
                        <button
                          key={dur.id}
                          onClick={() => setSelectedDuration(dur.duration)}
                          className={cn(
                            'flex-1 px-3 py-2 rounded-lg text-sm transition-all',
                            selectedDuration === dur.duration
                              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                              : 'bg-white/5 text-gray-400 hover:bg-white/10'
                          )}
                        >
                          {dur.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input area */}
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Descreva o vídeo que você quer gerar..."
              maxRows={3}
              disabled={isGenerating}
              className={cn(
                'w-full px-4 py-3 pr-12',
                'bg-white/5 border border-white/10 rounded-xl',
                'text-white placeholder:text-gray-500 text-sm',
                'focus:outline-none focus:ring-2 focus:ring-blue-500/50',
                'disabled:opacity-50 resize-none'
              )}
            />
            <button
              onClick={handleGenerate}
              disabled={!input.trim() || isGenerating}
              className={cn(
                'absolute right-2 bottom-2 w-9 h-9 rounded-lg flex items-center justify-center transition-all',
                input.trim() && !isGenerating
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700'
                  : 'bg-white/5 text-gray-500 cursor-not-allowed'
              )}
            >
              {isGenerating ? (
                <IconLoader2 className="w-5 h-5 animate-spin" />
              ) : (
                <IconWand className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Progress bar */}
          {isGenerating && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Gerando vídeo...</span>
                <span className="text-blue-500 font-medium">{generatingProgress}%</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-600 to-cyan-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${generatingProgress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          )}

          {/* Quick prompts */}
          {!isGenerating && videos.length === 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {QUICK_PROMPTS.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickPrompt(prompt.text)}
                  className="flex-shrink-0 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-gray-300 transition-colors"
                >
                  <span className="mr-1">{prompt.icon}</span>
                  {prompt.text}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Gallery */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredVideos.length === 0 && !isGenerating ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <motion.div
              animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-2xl"
            >
              <IconSparkles className="w-10 h-10 text-white" />
            </motion.div>
            <div className="text-center max-w-md">
              <h3 className="text-xl font-bold text-white mb-2">
                {searchQuery ? 'Nenhum vídeo encontrado' : 'Galeria vazia'}
              </h3>
              <p className="text-gray-400">
                {searchQuery
                  ? 'Tente buscar por outro termo'
                  : 'Comece gerando seu primeiro vídeo com IA'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filteredVideos.map((video, index) => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative aspect-video rounded-xl overflow-hidden bg-white/5 border border-white/10"
                >
                  {video.status === 'generating' ? (
                    // Generating state
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-blue-600/20 to-cyan-600/20 backdrop-blur-sm">
                      <IconLoader2 className="w-12 h-12 text-blue-500 animate-spin mb-3" />
                      <p className="text-white text-sm font-medium">Gerando...</p>
                      <p className="text-gray-400 text-xs mt-1">{formatDuration(video.duration)}</p>
                    </div>
                  ) : video.status === 'error' ? (
                    // Error state
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-600/10">
                      <IconX className="w-12 h-12 text-red-500 mb-3" />
                      <p className="text-red-400 text-sm font-medium">Erro ao gerar</p>
                      <button
                        onClick={() => handleDelete(video.id)}
                        className="mt-3 px-3 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs transition-colors"
                      >
                        Remover
                      </button>
                    </div>
                  ) : (
                    // Ready state
                    <>
                      {video.thumbnailUrl ? (
                        <img
                          src={video.thumbnailUrl}
                          alt={video.prompt}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <video
                          src={video.url}
                          className="w-full h-full object-cover"
                          muted
                        />
                      )}

                      {/* Play overlay */}
                      <div
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                        onClick={() => setSelectedVideo(video)}
                      >
                        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <IconPlayerPlay className="w-8 h-8 text-white ml-1" />
                        </div>
                      </div>

                      {/* Info overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/50 to-transparent">
                        <p className="text-white text-sm font-medium line-clamp-2 mb-2">
                          {video.prompt}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs text-gray-300">
                            <IconClock className="w-3 h-3" />
                            <span>{formatDuration(video.duration)}</span>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleLike(video.id);
                              }}
                              className="p-1.5 rounded-lg bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-colors"
                            >
                              {video.liked ? (
                                <IconHeartFilled className="w-4 h-4 text-red-500" />
                              ) : (
                                <IconHeart className="w-4 h-4 text-white" />
                              )}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(video);
                              }}
                              className="p-1.5 rounded-lg bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-colors"
                            >
                              <IconDownload className="w-4 h-4 text-white" />
                            </button>
                          </div>
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

      {/* Video Preview Modal */}
      <AnimatePresence>
        {selectedVideo && selectedVideo.status === 'ready' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setSelectedVideo(null);
              setIsPlaying(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-6xl w-full bg-gray-900 rounded-2xl overflow-hidden border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/20">
                <div className="flex-1 min-w-0 mr-4">
                  <p className="text-white font-medium truncate">{selectedVideo.prompt}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm text-gray-400">
                      {formatDuration(selectedVideo.duration)}
                    </span>
                    <span className="text-sm text-gray-400">
                      {selectedVideo.resolution}
                    </span>
                    <span className="text-sm text-gray-400">
                      {new Date(selectedVideo.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleLike(selectedVideo.id)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    {selectedVideo.liked ? (
                      <IconHeartFilled className="w-5 h-5 text-red-500" />
                    ) : (
                      <IconHeart className="w-5 h-5 text-white" />
                    )}
                  </button>
                  <button
                    onClick={() => handleCopyUrl(selectedVideo)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    {copiedId === selectedVideo.id ? (
                      <IconCheck className="w-5 h-5 text-green-500" />
                    ) : (
                      <IconCopy className="w-5 h-5 text-white" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDownload(selectedVideo)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <IconDownload className="w-5 h-5 text-white" />
                  </button>
                  <button
                    onClick={() => handleDelete(selectedVideo.id)}
                    className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors"
                  >
                    <IconTrash className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedVideo(null);
                      setIsPlaying(false);
                    }}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <IconX className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Video Player */}
              <div className="relative bg-black aspect-video">
                <video
                  ref={videoRef}
                  src={selectedVideo.url}
                  className="w-full h-full"
                  controls
                  autoPlay
                  loop
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default VideoGalleryModal;

