/**
 * AUDIO GALLERY PRO - Versão 2026 Profissional
 * Plataforma completa de geração e edição de áudio com IA
 * 
 * Features:
 * - TTS (ElevenLabs, Play.ht)
 * - Music Generation (Stable Audio, Suno)
 * - SFX Library (Freesound.org)
 * - AudioEditor integrado (Wavesurfer.js)
 * - História salva no Supabase
 * 
 * @version 2.0.0
 * @date 2025-12-10
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
    IconMicrophone,
    IconMusic,
    IconVolume,
    IconDownload,
    IconX,
    IconHeart,
    IconHeartFilled,
    IconLoader2,
    IconSparkles,
    IconEdit,
    IconHistory,
    IconTrash,
    IconPlayerPlay,
    IconWaveform,
} from '@tabler/icons-react';
import Textarea from 'react-textarea-autosize';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/authStore';

// Import components
import { AudioEditor } from '@/components/media/audio/AudioEditor';
import { SoundLibrary } from '@/components/media/audio/SoundLibrary';
import {
    AUDIO_PROVIDERS,
    generateAudioWithFallback,
    getTTSProviders,
    getMusicProviders,
    getSFXProviders,
    type AudioGenerationOptions,
} from '@/lib/media/audio-providers';

interface AudioGalleryProProps {
    onSendMessage?: (message: string) => void;
    onDetectContext?: (message: string) => void;
    userId?: string;
    isExpanded?: boolean;
}

interface GeneratedAudio {
    id: string;
    url: string;
    type: 'tts' | 'music' | 'sfx';
    text?: string;
    prompt?: string;
    timestamp: number;
    liked?: boolean;
    duration: number;
    provider: string;
    voice?: string;
}

type TabType = 'tts' | 'music' | 'sfx' | 'edit' | 'history';

const TTS_QUICK_TEXTS = [
    'Olá! Bem-vindo ao nosso serviço.',
    'Este é um teste de qualidade de voz.',
    'Narração profissional para vídeos.',
    'Podcast intro de alta qualidade.',
];

const MUSIC_PROMPTS = [
    { icon: '🎵', text: 'Música lo-fi calma para estudar', mood: 'calm' },
    { icon: '⚡', text: 'Música eletrônica energética upbeat', mood: 'energetic' },
    { icon: '🎻', text: 'Música clássica orquestral épica', mood: 'dramatic' },
    { icon: '🎸', text: 'Rock instrumental intenso', mood: 'energetic' },
];

export function AudioGalleryPro({
    onSendMessage,
    onDetectContext,
    userId,
    isExpanded,
}: AudioGalleryProProps) {
    // State
    const [activeTab, setActiveTab] = useState<TabType>('tts');
    const [input, setInput] = useState('');
    const [audios, setAudios] = useState<GeneratedAudio[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState('elevenlabs_tts');
    const [selectedVoice, setSelectedVoice] = useState('rachel');
    const [selectedStyle, setSelectedStyle] = useState<'natural' | 'expressive' | 'calm' | 'energetic'>('natural');
    const [selectedDuration, setSelectedDuration] = useState(30);
    const [audioToEdit, setAudioToEdit] = useState<string | null>(null);
    const [showSoundLibrary, setShowSoundLibrary] = useState(false);
    const [availableProviders, setAvailableProviders] = useState<string[]>([]);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const supabase = createClient();
    const user = useAuthStore((state) => state.user);

    // Load available providers
    useEffect(() => {
        loadAvailableProviders();
    }, [activeTab]);

    const loadAvailableProviders = async () => {
        let providers;
        if (activeTab === 'tts') {
            providers = await getTTSProviders();
        } else if (activeTab === 'music') {
            providers = await getMusicProviders();
        } else if (activeTab === 'sfx') {
            providers = await getSFXProviders();
        } else {
            providers = [];
        }

        setAvailableProviders(providers.map(p => p.id));

        if (providers.length > 0 && !availableProviders.includes(selectedProvider)) {
            setSelectedProvider(providers[0].id);
            if (providers[0].supportedVoices) {
                setSelectedVoice(providers[0].supportedVoices[0]);
            }
        }
    };

    // Load audios from Supabase
    useEffect(() => {
        if (activeTab === 'history') {
            loadAudiosFromSupabase();
        }
    }, [activeTab]);

    const loadAudiosFromSupabase = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('generated_audios')
                .select('*')
                .eq('user_id', user.id)
                .is('deleted_at', null)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;

            if (data) {
                const formattedAudios: GeneratedAudio[] = data.map((aud) => ({
                    id: aud.id,
                    url: aud.url,
                    type: aud.type,
                    text: aud.text,
                    prompt: aud.prompt,
                    timestamp: new Date(aud.created_at).getTime(),
                    duration: aud.duration,
                    provider: aud.provider || 'unknown',
                    voice: aud.voice,
                    liked: aud.liked || false,
                }));
                setAudios(formattedAudios);
            }
        } catch (error) {
            console.error('Error loading audios:', error);
            toast.error('Erro ao carregar histórico');
        }
    };

    // Generate audio
    const handleGenerate = async () => {
        if (!input.trim() || isGenerating || !user) return;

        const text = input.trim();
        setIsGenerating(true);

        try {
            const options: AudioGenerationOptions = {
                type: activeTab as 'tts' | 'music' | 'sfx',
                text: activeTab === 'tts' ? text : undefined,
                prompt: activeTab !== 'tts' ? text : undefined,
                voice: activeTab === 'tts' ? selectedVoice : undefined,
                duration: activeTab !== 'tts' ? selectedDuration : undefined,
                style: selectedStyle,
            };

            const result = await generateAudioWithFallback(options, selectedProvider);

            // Save to Supabase
            const { data, error } = await supabase
                .from('generated_audios')
                .insert({
                    user_id: user.id,
                    url: result.url,
                    type: result.type,
                    text: result.text,
                    prompt: result.prompt,
                    duration: result.metadata.duration,
                    provider: result.provider,
                    voice: result.metadata.voice,
                })
                .select()
                .single();

            if (error) throw error;

            const newAudio: GeneratedAudio = {
                id: data.id,
                url: result.url,
                type: result.type,
                text: result.text,
                prompt: result.prompt,
                timestamp: Date.now(),
                duration: result.metadata.duration,
                provider: result.provider,
                voice: result.metadata.voice,
            };

            setAudios((prev) => [newAudio, ...prev]);
            setInput('');
            toast.success('Áudio gerado!');
            setActiveTab('history');
        } catch (error: any) {
            console.error('Generation error:', error);
            toast.error(error.message || 'Erro ao gerar áudio');
        } finally {
            setIsGenerating(false);
        }
    };

    // Format duration
    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.round(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Toggle like
    const toggleLike = async (audioId: string) => {
        const audio = audios.find(a => a.id === audioId);
        if (!audio) return;

        const newLiked = !audio.liked;

        try {
            const { error } = await supabase
                .from('generated_audios')
                .update({ liked: newLiked })
                .eq('id', audioId);

            if (error) throw error;

            setAudios(prev => prev.map(a =>
                a.id === audioId ? { ...a, liked: newLiked } : a
            ));
        } catch (error) {
            console.error('Error toggling like:', error);
        }
    };

    // Download audio
    const handleDownload = async (audio: GeneratedAudio) => {
        try {
            const response = await fetch(audio.url);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `audio-${audio.id}.mp3`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Download iniciado!');
        } catch (error) {
            console.error('Download error:', error);
            toast.error('Erro ao baixar áudio');
        }
    };

    // Delete audio
    const handleDelete = async (audioId: string) => {
        try {
            const { error } = await supabase
                .from('generated_audios')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', audioId);

            if (error) throw error;

            setAudios(prev => prev.filter(a => a.id !== audioId));
            toast.success('Áudio deletado');
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
                        onClick={() => setActiveTab('tts')}
                        className={cn(
                            'w-12 h-12 rounded-xl flex items-center justify-center transition',
                            activeTab === 'tts'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        )}
                        title="Text-to-Speech"
                    >
                        <IconMicrophone className="w-6 h-6" />
                    </button>

                    <button
                        onClick={() => setActiveTab('music')}
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
                        onClick={() => {
                            setShowSoundLibrary(true);
                            setActiveTab('sfx');
                        }}
                        className={cn(
                            'w-12 h-12 rounded-xl flex items-center justify-center transition',
                            activeTab === 'sfx'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        )}
                        title="Sound Effects"
                    >
                        <IconVolume className="w-6 h-6" />
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
                            {activeTab === 'tts' && 'Text-to-Speech'}
                            {activeTab === 'music' && 'Geração de Música'}
                            {activeTab === 'sfx' && 'Sound Effects'}
                            {activeTab === 'history' && 'Histórico de Áudios'}
                        </h2>
                        <p className="text-sm text-gray-400">
                            {activeTab === 'tts' && 'Converta texto em fala ultra-realista'}
                            {activeTab === 'music' && 'Gere músicas completas com IA'}
                            {activeTab === 'sfx' && '600k+ efeitos sonoros gratuitos'}
                            {activeTab === 'history' && `${audios.length} áudios gerados`}
                        </p>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto p-6">
                        <AnimatePresence mode="wait">
                            {/* TTS Tab */}
                            {activeTab === 'tts' && (
                                <motion.div
                                    key="tts"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="space-y-6 max-w-4xl"
                                >
                                    {/* Provider Selection */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-3">
                                            Provedor TTS
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {availableProviders.map((providerId) => {
                                                const provider = AUDIO_PROVIDERS[providerId];
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
                                                            {provider.costPer1000Chars} créditos/1k chars
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Voice Selection */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-3">
                                            Voz ({AUDIO_PROVIDERS[selectedProvider]?.supportedVoices?.length || 0} disponíveis)
                                        </label>
                                        <div className="grid grid-cols-5 gap-2">
                                            {AUDIO_PROVIDERS[selectedProvider]?.supportedVoices?.map((voice) => (
                                                <button
                                                    key={voice}
                                                    onClick={() => setSelectedVoice(voice)}
                                                    className={cn(
                                                        'px-4 py-2 rounded-lg font-medium transition capitalize text-sm',
                                                        selectedVoice === voice
                                                            ? 'bg-purple-600 text-white'
                                                            : 'bg-white/5 text-gray-300 hover:bg-white/10'
                                                    )}
                                                >
                                                    {voice}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Quick Texts */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-3">
                                            Textos Rápidos
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {TTS_QUICK_TEXTS.map((text, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setInput(text)}
                                                    className="p-3 bg-white/5 hover:bg-white/10 rounded-lg text-left transition text-sm text-gray-300"
                                                >
                                                    {text}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Text Input */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-3">
                                            Seu Texto
                                        </label>
                                        <Textarea
                                            ref={textareaRef}
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            placeholder="Digite o texto que você quer converter em fala..."
                                            maxRows={8}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                        />
                                        <div className="text-xs text-gray-400 mt-2">
                                            {input.length} caracteres
                                        </div>
                                    </div>

                                    {/* Generate Button */}
                                    <button
                                        onClick={handleGenerate}
                                        disabled={!input.trim() || isGenerating}
                                        className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-3"
                                    >
                                        {isGenerating ? (
                                            <>
                                                <IconLoader2 className="w-6 h-6 animate-spin" />
                                                Gerando Áudio...
                                            </>
                                        ) : (
                                            <>
                                                <IconMicrophone className="w-6 h-6" />
                                                Gerar Áudio
                                            </>
                                        )}
                                    </button>
                                </motion.div>
                            )}

                            {/* Music Tab */}
                            {activeTab === 'music' && (
                                <motion.div
                                    key="music"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="space-y-6 max-w-4xl"
                                >
                                    {/* Duration */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-3">
                                            Duração
                                        </label>
                                        <div className="flex gap-3">
                                            {[15, 30, 60, 120].map((dur) => (
                                                <button
                                                    key={dur}
                                                    onClick={() => setSelectedDuration(dur)}
                                                    className={cn(
                                                        'flex-1 px-4 py-3 rounded-lg font-medium transition',
                                                        selectedDuration === dur
                                                            ? 'bg-blue-600 text-white'
                                                            : 'bg-white/5 text-gray-300 hover:bg-white/10'
                                                    )}
                                                >
                                                    {dur >= 60 ? `${dur / 60}min` : `${dur}s`}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Style */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-3">
                                            Estilo
                                        </label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {(['natural', 'expressive', 'calm', 'energetic'] as const).map((style) => (
                                                <button
                                                    key={style}
                                                    onClick={() => setSelectedStyle(style)}
                                                    className={cn(
                                                        'px-4 py-2 rounded-lg font-medium transition capitalize',
                                                        selectedStyle === style
                                                            ? 'bg-purple-600 text-white'
                                                            : 'bg-white/5 text-gray-300 hover:bg-white/10'
                                                    )}
                                                >
                                                    {style}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Music Prompts */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-3">
                                            Prompts de Música
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {MUSIC_PROMPTS.map((prompt, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setInput(prompt.text)}
                                                    className="p-4 bg-white/5 hover:bg-white/10 rounded-lg text-left transition"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-2xl">{prompt.icon}</span>
                                                        <span className="text-sm text-gray-300">
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
                                            Descreva a Música
                                        </label>
                                        <Textarea
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            placeholder="Descreva o tipo de música que você quer... (ex: 'música relaxante de piano para estudar')"
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
                                                Gerando Música...
                                            </>
                                        ) : (
                                            <>
                                                <IconMusic className="w-6 h-6" />
                                                Gerar Música
                                            </>
                                        )}
                                    </button>
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
                                    {audios.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-96">
                                            <IconWaveform className="w-20 h-20 text-gray-600 mb-4" />
                                            <p className="text-xl text-gray-400 mb-2">
                                                Nenhum áudio ainda
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                Gere seu primeiro áudio para começar
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {audios.map((audio) => (
                                                <div
                                                    key={audio.id}
                                                    className="group flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition"
                                                >
                                                    {/* Icon */}
                                                    <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg">
                                                        {audio.type === 'tts' ? (
                                                            <IconMicrophone className="w-6 h-6 text-white" />
                                                        ) : audio.type === 'music' ? (
                                                            <IconMusic className="w-6 h-6 text-white" />
                                                        ) : (
                                                            <IconVolume className="w-6 h-6 text-white" />
                                                        )}
                                                    </div>

                                                    {/* Info */}
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3 className="font-semibold text-white capitalize">
                                                                {audio.type}
                                                            </h3>
                                                            {audio.voice && (
                                                                <span className="px-2 py-0.5 bg-purple-600/30 text-purple-300 text-xs rounded capitalize">
                                                                    {audio.voice}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-gray-400 line-clamp-1">
                                                            {audio.text || audio.prompt}
                                                        </p>
                                                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                                            <span>{formatDuration(audio.duration)}</span>
                                                            <span>•</span>
                                                            <span className="capitalize">{audio.provider}</span>
                                                        </div>
                                                    </div>

                                                    {/* Waveform Placeholder */}
                                                    <div className="w-32 h-12 opacity-50">
                                                        <IconWaveform className="w-full h-full text-blue-500" />
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                                                        <button
                                                            onClick={() => setAudioToEdit(audio.url)}
                                                            className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                                                            title="Editar"
                                                        >
                                                            <IconEdit className="w-5 h-5 text-white" />
                                                        </button>

                                                        <button
                                                            onClick={() => handleDownload(audio)}
                                                            className="p-2 bg-green-600 hover:bg-green-700 rounded-lg transition"
                                                            title="Download"
                                                        >
                                                            <IconDownload className="w-5 h-5 text-white" />
                                                        </button>

                                                        <button
                                                            onClick={() => toggleLike(audio.id)}
                                                            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition"
                                                            title="Curtir"
                                                        >
                                                            {audio.liked ? (
                                                                <IconHeartFilled className="w-5 h-5 text-red-500" />
                                                            ) : (
                                                                <IconHeart className="w-5 h-5 text-white" />
                                                            )}
                                                        </button>

                                                        <button
                                                            onClick={() => handleDelete(audio.id)}
                                                            className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
                                                            title="Deletar"
                                                        >
                                                            <IconTrash className="w-5 h-5 text-white" />
                                                        </button>
                                                    </div>
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
            {audioToEdit && (
                <AudioEditor
                    audioUrl={audioToEdit}
                    onSave={(editedUrl) => {
                        setAudioToEdit(null);
                        toast.success('Áudio editado salvo!');
                    }}
                    onClose={() => setAudioToEdit(null)}
                />
            )}

            {showSoundLibrary && (
                <SoundLibrary
                    onSelectSound={(soundUrl, title) => {
                        setShowSoundLibrary(false);
                        toast.success(`${title} selecionado!`);
                    }}
                    onClose={() => setShowSoundLibrary(false)}
                />
            )}
        </>
    );
}

export default AudioGalleryPro;
