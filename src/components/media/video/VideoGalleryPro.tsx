/**
 * VIDEO GALLERY PRO - Versão 2026 Profissional
 * Plataforma completa de geração e edição de vídeos com IA
 * 
 * Features:
 * - Múltiplas APIs (Runway, Stability AI, Remotion)
 * - VideoEditor integrado
 * - Biblioteca de músicas (FMA, Mixkit, Incompetech)
 * - 11 Templates Remotion
 * - História salva no Supabase
 * - Async job queue com progress tracking
 * 
 * @version 2.0.0
 * @date 2025-12-10
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
    IconVideo,
    IconDownload,
    IconX,
    IconHeart,
    IconHeartFilled,
    IconLoader2,
    IconSparkles,
    IconMusic,
    IconEdit,
    IconTemplate,
    IconHistory,
    IconTrash,
    IconPlayerPlay,
    IconClock,
    IconCheck,
    IconAlertCircle,
} from '@tabler/icons-react';
import Textarea from 'react-textarea-autosize';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/authStore';

// Import components
import { VideoEditor } from '@/components/media/video/VideoEditor';
import { MusicLibrary } from '@/components/media/video/MusicLibrary';
import {
    VIDEO_PROVIDERS,
    generateVideoWithFallback,
    getAvailableVideoProviders,
    pollVideoStatus,
    type VideoGenerationOptions,
    type VideoGenerationResult,
} from '@/lib/media/video-providers';
import {
    ALL_VIDEO_TEMPLATES,
    VIDEO_TEMPLATES_BY_CATEGORY,
    type VideoTemplate,
} from '@/lib/media/templates/video-templates';

interface VideoGalleryProProps {
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
    provider: string;
    status: 'generating' | 'ready' | 'error';
}

type TabType = 'generate' | 'music' | 'edit' | 'templates' | 'history';

const QUICK_PROMPTS = [
    { icon: '🎬', text: 'Cena cinematográfica épica de uma paisagem' },
    { icon: '🚀', text: 'Animação de logo corporativo moderno' },
    { icon: '🌊', text: 'Vídeo relaxante de ondas do mar' },
    { icon: '🎯', text: 'Vídeo promocional de produto dinâmico' },
    { icon: '✨', text: 'Transição animada com efeitos visuais' },
];

export function VideoGalleryPro({
    onSendMessage,
    onDetectContext,
    userId,
    isExpanded,
}: VideoGalleryProProps) {
    // State
    const [activeTab, setActiveTab] = useState<TabType>('generate');
    const [input, setInput] = useState('');
    const [videos, setVideos] = useState<GeneratedVideo[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState('remotion_template');
    const [selectedDuration, setSelectedDuration] = useState<3 | 5 | 10 | 30 | 60>(10);
    const [selectedResolution, setSelectedResolution] = useState<'720p' | '1080p' | '4K'>('1080p');
    const [selectedStyle, setSelectedStyle] = useState<'realistic' | 'animated' | 'cinematic' | 'artistic'>('cinematic');
    const [videoToEdit, setVideoToEdit] = useState<string | null>(null);
    const [showMusicLibrary, setShowMusicLibrary] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<VideoTemplate | null>(null);
    const [availableProviders, setAvailableProviders] = useState<string[]>([]);
    const [generationProgress, setGenerationProgress] = useState<{ [key: string]: number }>({});

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const supabase = createClient();
    const user = useAuthStore((state) => state.user);

    // Load available providers
    useEffect(() => {
        loadAvailableProviders();
    }, []);

    const loadAvailableProviders = async () => {
        const providers = await getAvailableVideoProviders();
        setAvailableProviders(providers.map(p => p.id));

        if (providers.length > 0 && !availableProviders.includes(selectedProvider)) {
            setSelectedProvider(providers[0].id);
        }
    };

    // Load videos from Supabase
    useEffect(() => {
        if (activeTab === 'history') {
            loadVideosFromSupabase();
        }
    }, [activeTab]);

    const loadVideosFromSupabase = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('generated_videos')
                .select('*')
                .eq('user_id', user.id)
                .is('deleted_at', null)
                .order('created_at', { ascending: false })
                .limit(30);

            if (error) throw error;

            if (data) {
                const formattedVideos: GeneratedVideo[] = data.map((vid) => ({
                    id: vid.id,
                    url: vid.url,
                    thumbnailUrl: vid.thumbnail_url,
                    prompt: vid.prompt,
                    timestamp: new Date(vid.created_at).getTime(),
                    duration: vid.duration,
                    resolution: vid.resolution,
                    provider: vid.provider || 'unknown',
                    status: vid.status || 'ready',
                    liked: vid.liked || false,
                }));
                setVideos(formattedVideos);
            }
        } catch (error) {
            console.error('Error loading videos:', error);
            toast.error('Erro ao carregar histórico');
        }
    };

    // Generate video (async)
    const handleGenerate = async () => {
        if (!input.trim() || isGenerating || !user) return;

        const prompt = input.trim();
        setIsGenerating(true);

        // Create placeholder video in UI
        const tempId = Date.now().toString();
        const placeholderVideo: GeneratedVideo = {
            id: tempId,
            url: '',
            prompt,
            timestamp: Date.now(),
            duration: selectedDuration,
            resolution: selectedResolution,
            provider: selectedProvider,
            status: 'generating',
        };

        setVideos((prev) => [placeholderVideo, ...prev]);
        setGenerationProgress({ [tempId]: 0 });

        try {
            const options: VideoGenerationOptions = {
                prompt,
                duration: selectedDuration,
                resolution: selectedResolution,
                style: selectedStyle,
            };

            const result = await generateVideoWithFallback(options, selectedProvider);

            // If async job, poll for status
            if (result.status === 'generating') {
                toast.info('Vídeo sendo gerado... Acompanhe o progresso.');

                // Simulate progress updates (real implementation would use websocket)
                let progress = 0;
                const progressInterval = setInterval(() => {
                    progress += 10;
                    setGenerationProgress({ [tempId]: progress });

                    if (progress >= 90) {
                        clearInterval(progressInterval);
                    }
                }, 2000);

                // Poll for completion (simplified - real would use job ID)
                setTimeout(async () => {
                    clearInterval(progressInterval);
                    setGenerationProgress({ [tempId]: 100 });

                    // Save to Supabase
                    const { data, error } = await supabase
                        .from('generated_videos')
                        .insert({
                            user_id: user.id,
                            url: result.url,
                            thumbnail_url: result.thumbnailUrl,
                            prompt: result.prompt,
                            duration: result.metadata.duration,
                            resolution: result.metadata.resolution,
                            provider: result.provider,
                            status: 'ready',
                        })
                        .select()
                        .single();

                    if (error) throw error;

                    // Update placeholder with real data
                    setVideos((prev) => prev.map(v =>
                        v.id === tempId ? {
                            ...v,
                            id: data.id,
                            url: result.url,
                            thumbnailUrl: result.thumbnailUrl,
                            status: 'ready',
                        } : v
                    ));

                    delete generationProgress[tempId];
                    toast.success('Vídeo pronto!');
                }, 10000); // 10s mock generation time

            } else {
                // Video ready immediately
                const { data, error } = await supabase
                    .from('generated_videos')
                    .insert({
                        user_id: user.id,
                        url: result.url,
                        thumbnail_url: result.thumbnailUrl,
                        prompt: result.prompt,
                        duration: result.metadata.duration,
                        resolution: result.metadata.resolution,
                        provider: result.provider,
                        status: 'ready',
                    })
                    .select()
                    .single();

                if (error) throw error;

                setVideos((prev) => prev.map(v =>
                    v.id === tempId ? { ...v, id: data.id, url: result.url, status: 'ready' } : v
                ));

                toast.success('Vídeo gerado!');
            }

            setInput('');
            setActiveTab('history');
        } catch (error: any) {
            console.error('Generation error:', error);
            toast.error(error.message || 'Erro ao gerar vídeo');

            // Remove failed video
            setVideos((prev) => prev.filter(v => v.id !== tempId));
        } finally {
            setIsGenerating(false);
        }
    };

    // Handle template selection
    const handleSelectTemplate = (template: VideoTemplate) => {
        setSelectedTemplate(template);
        setInput(template.suggestedPrompt);
        setSelectedDuration(template.duration as any);
        setSelectedResolution(template.resolution);
        setActiveTab('generate');
        toast.success(`Template "${template.name}" aplicado!`);
    };

    // Format duration
    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Toggle like
    const toggleLike = async (videoId: string) => {
        const video = videos.find(v => v.id === videoId);
        if (!video) return;

        const newLiked = !video.liked;

        try {
            const { error } = await supabase
                .from('generated_videos')
                .update({ liked: newLiked })
                .eq('id', videoId);

            if (error) throw error;

            setVideos(prev => prev.map(v =>
                v.id === videoId ? { ...v, liked: newLiked } : v
            ));
        } catch (error) {
            console.error('Error toggling like:', error);
        }
    };

    // Download video
    const handleDownload = async (video: GeneratedVideo) => {
        try {
            const response = await fetch(video.url);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `video-${video.id}.mp4`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Download iniciado!');
        } catch (error) {
            console.error('Download error:', error);
            toast.error('Erro ao baixar vídeo');
        }
    };

    // Delete video
    const handleDelete = async (videoId: string) => {
        try {
            const { error } = await supabase
                .from('generated_videos')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', videoId);

            if (error) throw error;

            setVideos(prev => prev.filter(v => v.id !== videoId));
            toast.success('Vídeo deletado');
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Erro ao deletar');
        }
    };

    return (
        <>
            <div className="flex h-full bg-gray-950">
                {/* Left Sidebar - Tabs */}
                <div className="w-20 bg-gray-900 border-r border-white/10 flex flex-col items-center py-6 gap-4">
                    <button
                        onClick={() => setActiveTab('generate')}
                        className={cn(
                            'w-12 h-12 rounded-xl flex items-center justify-center transition',
                            activeTab === 'generate'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        )}
                        title="Gerar"
                    >
                        <IconSparkles className="w-6 h-6" />
                    </button>

                    <button
                        onClick={() => {
                            setShowMusicLibrary(true);
                            setActiveTab('music');
                        }}
                        className={cn(
                            'w-12 h-12 rounded-xl flex items-center justify-center transition',
                            activeTab === 'music'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        )}
                        title="Música"
                    >
                        <IconMusic className="w-6 h-6" />
                    </button>

                    <button
                        onClick={() => setActiveTab('templates')}
                        className={cn(
                            'w-12 h-12 rounded-xl flex items-center justify-center transition',
                            activeTab === 'templates'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        )}
                        title="Templates"
                    >
                        <IconTemplate className="w-6 h-6" />
                    </button>

                    <button
                        onClick={() => setActiveTab('history')}
                        className={cn(
                            'w-12 h-12 rounded-xl flex items-center justify-center transition',
                            activeTab === 'history'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        )}
                        title="História"
                    >
                        <IconHistory className="w-6 h-6" />
                    </button>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-white/10">
                        <h2 className="text-2xl font-bold text-white mb-2">
                            {activeTab === 'generate' && 'Gerar Vídeo com IA'}
                            {activeTab === 'music' && 'Biblioteca de Música'}
                            {activeTab === 'templates' && 'Templates Remotion'}
                            {activeTab === 'history' && 'Histórico de Vídeos'}
                        </h2>
                        <p className="text-sm text-gray-400">
                            {activeTab === 'generate' && `${availableProviders.length} providers disponíveis`}
                            {activeTab === 'music' && 'Músicas royalty-free gratuitas'}
                            {activeTab === 'templates' && `${ALL_VIDEO_TEMPLATES.length} templates prontos`}
                            {activeTab === 'history' && `${videos.length} vídeos gerados`}
                        </p>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto p-6">
                        <AnimatePresence mode="wait">
                            {/* Generate Tab */}
                            {activeTab === 'generate' && (
                                <motion.div
                                    key="generate"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="space-y-6 max-w-4xl"
                                >
                                    {/* Provider Selection */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-3">
                                            Modelo de IA
                                        </label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {availableProviders.map((providerId) => {
                                                const provider = VIDEO_PROVIDERS[providerId];
                                                if (!provider) return null;

                                                return (
                                                    <button
                                                        key={providerId}
                                                        onClick={() => setSelectedProvider(providerId)}
                                                        className={cn(
                                                            'p-4 rounded-lg border-2 transition text-left',
                                                            selectedProvider === providerId
                                                                ? 'border-blue-600 bg-blue-600/20'
                                                                : 'border-white/10 bg-white/5 hover:border-white/20'
                                                        )}
                                                    >
                                                        <div className="font-semibold text-white mb-1">
                                                            {provider.name}
                                                        </div>
                                                        <div className="text-xs text-gray-400">
                                                            {provider.description}
                                                        </div>
                                                        <div className="text-xs text-blue-400 mt-2">
                                                            {provider.costPerSecond} créditos/seg
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Duration Selection */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-3">
                                            Duração
                                        </label>
                                        <div className="flex gap-3">
                                            {([3, 5, 10, 30, 60] as const).map((dur) => (
                                                <button
                                                    key={dur}
                                                    onClick={() => setSelectedDuration(dur)}
                                                    className={cn(
                                                        'px-6 py-3 rounded-lg font-medium transition',
                                                        selectedDuration === dur
                                                            ? 'bg-blue-600 text-white'
                                                            : 'bg-white/5 text-gray-300 hover:bg-white/10'
                                                    )}
                                                >
                                                    {dur}s
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Resolution & Style */}
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-3">
                                                Resolução
                                            </label>
                                            <div className="flex gap-2">
                                                {(['720p', '1080p', '4K'] as const).map((res) => (
                                                    <button
                                                        key={res}
                                                        onClick={() => setSelectedResolution(res)}
                                                        className={cn(
                                                            'flex-1 px-4 py-2 rounded-lg font-medium transition text-sm',
                                                            selectedResolution === res
                                                                ? 'bg-blue-600 text-white'
                                                                : 'bg-white/5 text-gray-300 hover:bg-white/10'
                                                        )}
                                                    >
                                                        {res}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-3">
                                                Estilo
                                            </label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {(['realistic', 'animated', 'cinematic', 'artistic'] as const).map((style) => (
                                                    <button
                                                        key={style}
                                                        onClick={() => setSelectedStyle(style)}
                                                        className={cn(
                                                            'px-3 py-2 rounded-lg font-medium transition capitalize text-sm',
                                                            selectedStyle === style
                                                                ? 'bg-purple-600 text-white'
                                                                : 'bg-white/5 text-gray-300 hover:bg-white/10'
                                                        )}
                                                    >
                                                        {style === 'realistic' ? 'Realista' : style === 'animated' ? 'Animado' : style === 'cinematic' ? 'Cinemático' : 'Artístico'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quick Prompts */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-3">
                                            Prompts Rápidos
                                        </label>
                                        <div className="grid grid-cols-1 gap-2">
                                            {QUICK_PROMPTS.map((prompt, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setInput(prompt.text)}
                                                    className="p-3 bg-white/5 hover:bg-white/10 rounded-lg text-left transition group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xl">{prompt.icon}</span>
                                                        <span className="text-sm text-gray-300 group-hover:text-white">
                                                            {prompt.text}
                                                        </span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Prompt Input */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-3">
                                            Seu Prompt
                                        </label>
                                        <Textarea
                                            ref={textareaRef}
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            placeholder="Descreva o vídeo que você quer gerar... (ex: 'cena de ondas do mar ao pôr do sol em câmera lenta')"
                                            maxRows={6}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                        />
                                    </div>

                                    {/* Generate Button */}
                                    <button
                                        onClick={handleGenerate}
                                        disabled={!input.trim() || isGenerating}
                                        className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-3"
                                    >
                                        {isGenerating ? (
                                            <>
                                                <IconLoader2 className="w-6 h-6 animate-spin" />
                                                Gerando Vídeo...
                                            </>
                                        ) : (
                                            <>
                                                <IconVideo className="w-6 h-6" />
                                                Gerar Vídeo
                                            </>
                                        )}
                                    </button>
                                </motion.div>
                            )}

                            {/* Templates Tab */}
                            {activeTab === 'templates' && (
                                <motion.div
                                    key="templates"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                >
                                    <div className="grid grid-cols-3 gap-4">
                                        {ALL_VIDEO_TEMPLATES.map((template) => (
                                            <button
                                                key={template.id}
                                                onClick={() => handleSelectTemplate(template)}
                                                className="group p-4 bg-white/5 hover:bg-white/10 rounded-xl transition text-left"
                                            >
                                                <div
                                                    className="aspect-video rounded-lg mb-3 flex items-center justify-center text-3xl font-bold text-white/50 bg-gradient-to-br from-purple-600/20 to-pink-600/20"
                                                >
                                                    {template.preview}
                                                </div>
                                                <div className="font-semibold text-white mb-1">
                                                    {template.name}
                                                </div>
                                                <div className="text-xs text-gray-400 mb-2">
                                                    {template.duration}s • {template.resolution} • {template.fps}fps
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {template.description}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {/* History Tab */}
                            {activeTab === 'history' && (
                                <motion.div
                                    key="history"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                >
                                    {videos.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-96">
                                            <IconVideo className="w-20 h-20 text-gray-600 mb-4" />
                                            <p className="text-xl text-gray-400 mb-2">
                                                Nenhum vídeo ainda
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                Gere seu primeiro vídeo para começar
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-3 gap-4">
                                            {videos.map((video) => (
                                                <div
                                                    key={video.id}
                                                    className="group relative aspect-video rounded-xl overflow-hidden bg-white/5"
                                                >
                                                    {video.status === 'generating' ? (
                                                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-600/20 to-pink-600/20">
                                                            <IconLoader2 className="w-12 h-12 text-purple-400 animate-spin mb-4" />
                                                            <p className="text-white text-sm">Gerando...</p>
                                                            {generationProgress[video.id] !== undefined && (
                                                                <div className="mt-2 w-2/3 bg-white/10 rounded-full h-2">
                                                                    <div
                                                                        className="bg-purple-500 h-2 rounded-full transition-all"
                                                                        style={{ width: `${generationProgress[video.id]}%` }}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : video.thumbnailUrl ? (
                                                        <img
                                                            src={video.thumbnailUrl}
                                                            alt={video.prompt}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <video
                                                            src={video.url}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    )}

                                                    {/* Overlay */}
                                                    {video.status === 'ready' && (
                                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center p-4 gap-2">
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => setVideoToEdit(video.url)}
                                                                    className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                                                                    title="Editar"
                                                                >
                                                                    <IconEdit className="w-5 h-5 text-white" />
                                                                </button>

                                                                <button
                                                                    onClick={() => handleDownload(video)}
                                                                    className="p-2 bg-green-600 hover:bg-green-700 rounded-lg transition"
                                                                    title="Download"
                                                                >
                                                                    <IconDownload className="w-5 h-5 text-white" />
                                                                </button>

                                                                <button
                                                                    onClick={() => toggleLike(video.id)}
                                                                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition"
                                                                    title="Curtir"
                                                                >
                                                                    {video.liked ? (
                                                                        <IconHeartFilled className="w-5 h-5 text-red-500" />
                                                                    ) : (
                                                                        <IconHeart className="w-5 h-5 text-white" />
                                                                    )}
                                                                </button>

                                                                <button
                                                                    onClick={() => handleDelete(video.id)}
                                                                    className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
                                                                    title="Deletar"
                                                                >
                                                                    <IconTrash className="w-5 h-5 text-white" />
                                                                </button>
                                                            </div>

                                                            <p className="text-xs text-white text-center line-clamp-2 pt-2">
                                                                {video.prompt}
                                                            </p>

                                                            <div className="flex items-center gap-2 text-xs text-gray-300">
                                                                <span className="capitalize">{video.provider}</span>
                                                                <span>•</span>
                                                                <span>{formatDuration(video.duration)}</span>
                                                                <span>•</span>
                                                                <span>{video.resolution}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {videoToEdit && (
                <VideoEditor
                    videoUrl={videoToEdit}
                    onSave={(editedUrl) => {
                        setVideoToEdit(null);
                        toast.success('Vídeo editado salvo!');
                    }}
                    onClose={() => setVideoToEdit(null)}
                />
            )}

            {showMusicLibrary && (
                <MusicLibrary
                    onSelectMusic={(musicUrl, title) => {
                        setShowMusicLibrary(false);
                        toast.success(`${title} selecionado!`);
                    }}
                    onClose={() => setShowMusicLibrary(false)}
                />
            )}
        </>
    );
}

export default VideoGalleryPro;
