/**
 * AUDIO GALLERY PRO - Versão 3.0 Profissional (Unified Workspace)
 * Plataforma completa de geração e edição de áudio com IA
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
    IconMicrophone,
    IconMusic,
    IconVolume,
    IconDownload,
    IconHeart,
    IconHeartFilled,
    IconLoader2,
    IconSparkles,
    IconEdit,
    IconTrash,
    IconWaveSine,
    IconUpload,
    IconUser,
    IconPlayerPlay,
    IconLayoutGrid,
} from '@tabler/icons-react';
import Textarea from 'react-textarea-autosize';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
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

type TabType = 'tts' | 'clone' | 'music' | 'sfx';

const TTS_QUICK_TEXTS = [
    'Olá, seja muito bem-vindo! Como posso ajudar você hoje?',
    'Apresentamos a nova solução inteligente para o seu negócio.',
    'Este tutorial vai te guiar pelo passo a passo de forma simples.',
    'Prepare-se para uma experiência auditiva inovadora.',
];

const MUSIC_PROMPTS = [
    { icon: '🎵', text: 'Lo-fi relaxante para estudo', mood: 'calm' },
    { icon: '⚡', text: 'Eletrônica upbeat para treino', mood: 'energetic' },
    { icon: '🎻', text: 'Clássica épica orquestral', mood: 'dramatic' },
    { icon: '🎸', text: 'Rock instrumental vibrante', mood: 'energetic' },
];

export function AudioGalleryPro({
    // Props removidas/não usadas mantidas por compatibilidade
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
    
    // Voice Cloning state
    const [cloneFile, setCloneFile] = useState<File | null>(null);
    const [cloneName, setCloneName] = useState('');
    const [cloneDescription, setCloneDescription] = useState('');
    const [isCloning, setIsCloning] = useState(false);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const user = useAuthStore((state) => state.user);

    // Initial Load
    useEffect(() => {
        loadAudiosFromSupabase();
    }, []);

    // Load available providers based on tab
    useEffect(() => {
        loadAvailableProviders();
    }, [activeTab]);

    const loadAvailableProviders = async () => {
        let providers: any[] = [];
        if (activeTab === 'tts' || activeTab === 'clone') {
            providers = await getTTSProviders();
        } else if (activeTab === 'music') {
            providers = await getMusicProviders();
        } else if (activeTab === 'sfx') {
            providers = await getSFXProviders();
        }

        setAvailableProviders(providers.map(p => p.id));

        if (providers.length > 0 && !availableProviders.includes(selectedProvider)) {
            setSelectedProvider(providers[0].id);
            if (providers[0].supportedVoices) {
                setSelectedVoice(providers[0].supportedVoices[0]);
            }
        }
    };

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
                // We show immediate history right away
                setAudios(formattedAudios);
            }
        } catch (error) {
            console.error('Error loading audios:', error);
        }
    };

    // Generate TTS/Music audio
    const handleGenerate = async () => {
        if (!input.trim() || isGenerating || !user) return;

        const text = input.trim();
        setIsGenerating(true);

        try {
            const options: AudioGenerationOptions = {
                type: activeTab === 'tts' || activeTab === 'clone' ? 'tts' : activeTab as 'tts' | 'music' | 'sfx',
                text: activeTab === 'tts' ? text : undefined,
                prompt: (activeTab === 'music' || activeTab === 'sfx') ? text : undefined,
                voice: activeTab === 'tts' ? selectedVoice : undefined,
                duration: (activeTab === 'music' || activeTab === 'sfx') ? selectedDuration : undefined,
                style: selectedStyle,
            };

            const result = await generateAudioWithFallback(options, selectedProvider);

            // Save to DB
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
                ...result,
                id: data.id,
                duration: result.metadata.duration,
                voice: result.metadata.voice,
                liked: false,
            };

            setAudios((prev) => [newAudio, ...prev]);
            toast.success('Áudio gerado com sucesso!');
        } catch (error: any) {
            console.error('Generation err:', error);
            toast.error(error.message || 'Erro ao gerar detalhado no console');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCloneVoice = async () => {
        if (!cloneFile || !cloneName.trim() || !user || isCloning) return;

        setIsCloning(true);
        try {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Not authenticated');

            const formData = new FormData();
            formData.append('file', cloneFile);
            formData.append('name', cloneName.trim());
            formData.append('description', cloneDescription.trim());

            const response = await fetch(`${supabaseUrl}/functions/v1/clone-voice`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erro ao clonar voz');
            }

            toast.success('Aúdio processado! Nova voz clonada.');
            setCloneFile(null);
            setCloneName('');
            setCloneDescription('');
            // Move back to TTS to use it (optional, needs the voice to be listed)
            setActiveTab('tts');
        } catch (error: any) {
            toast.error(error.message || 'Erro ao processar clonagem');
        } finally {
            setIsCloning(false);
        }
    };

    const formatDuration = (seconds: number) => {
        if (!seconds) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.round(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Rendering Providers
    const renderProviderSelector = () => (
        <div className="mb-6">
            <h3 className="text-sm font-semibold text-white/70 mb-3 uppercase tracking-wider">Mecanismo de Inteligência</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availableProviders.map((providerId) => {
                    const provider = AUDIO_PROVIDERS[providerId];
                    if (!provider) return null;

                    return (
                        <button
                            key={providerId}
                            onClick={() => setSelectedProvider(providerId)}
                            className={cn(
                                'p-4 rounded-xl border transition-all text-left relative overflow-hidden group',
                                selectedProvider === providerId
                                    ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/50'
                                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                            )}
                        >
                            {selectedProvider === providerId && (
                                <div className="absolute top-0 right-0 p-2">
                                    <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                                </div>
                            )}
                            <div className="font-bold text-white mb-1.5">{provider.name}</div>
                            <div className="text-xs text-indigo-200/60 mb-3 leading-relaxed min-h-[32px]">{provider.description}</div>
                            <div className="text-[10px] font-bold px-2.5 py-1 rounded inline-flex bg-indigo-500/20 text-indigo-300 uppercase tracking-widest">
                                {provider.costPer1000Chars > 0 ? `${provider.costPer1000Chars} créditos/1k` : 'Modelo Gratuito'}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );

    return (
        <>
            <div className="flex w-full h-full bg-[#0a0f1c] text-white overflow-hidden font-sans relative">
                
                {/* 1. Left Vertical Navigation */}
                <div className="w-20 bg-black/40 backdrop-blur-xl border-r border-white/5 flex flex-col items-center py-6 gap-3 z-10 shrink-0">
                    <div className="mb-6">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <IconWaveSine className="text-white w-6 h-6" />
                        </div>
                    </div>
                    
                    <button
                        onClick={() => setActiveTab('tts')}
                        className={cn(
                            'w-12 h-12 rounded-xl flex items-center justify-center transition-all',
                            activeTab === 'tts' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'text-gray-400 hover:bg-white/10 hover:text-white'
                        )}
                        title="Text-to-Speech"
                    >
                        <IconMicrophone className="w-6 h-6" />
                    </button>
                    
                    <button
                        onClick={() => setActiveTab('clone')}
                        className={cn(
                            'w-12 h-12 rounded-xl flex items-center justify-center transition-all',
                            activeTab === 'clone' ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30' : 'text-gray-400 hover:bg-white/10 hover:text-white'
                        )}
                        title="Clonagem de Voz"
                    >
                        <IconUser className="w-6 h-6" />
                    </button>

                    <button
                        onClick={() => setActiveTab('music')}
                        className={cn(
                            'w-12 h-12 rounded-xl flex items-center justify-center transition-all',
                            activeTab === 'music' ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/30' : 'text-gray-400 hover:bg-white/10 hover:text-white'
                        )}
                        title="Menu de Músicas"
                    >
                        <IconMusic className="w-6 h-6" />
                    </button>
                    
                    <button
                        onClick={() => {
                            setActiveTab('sfx');
                            setShowSoundLibrary(true);
                        }}
                        className={cn(
                            'w-12 h-12 rounded-xl flex items-center justify-center transition-all',
                            activeTab === 'sfx' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30' : 'text-gray-400 hover:bg-white/10 hover:text-white'
                        )}
                        title="Efeitos Sonoros"
                    >
                        <IconVolume className="w-6 h-6" />
                    </button>
                </div>

                {/* 2. Main Content Area */}
                <div className="flex-1 flex flex-col bg-gradient-to-br from-[#0c1222] to-[#050812] relative overflow-y-auto z-0 custom-scrollbar">
                    {/* Background glow */}
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

                    <div className="px-10 py-8 relative z-10 max-w-4xl">
                        
                        {/* Headers */}
                        <div className="mb-8">
                            <AnimatePresence mode="popLayout">
                                <motion.div
                                    key={activeTab}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -15 }}
                                    className="flex items-center gap-4"
                                >
                                    <div className={cn(
                                        "p-3 rounded-2xl flex items-center justify-center text-white",
                                        activeTab === 'tts' && "bg-indigo-500 shadow-indigo-500/30 shadow-lg",
                                        activeTab === 'clone' && "bg-purple-500 shadow-purple-500/30 shadow-lg",
                                        activeTab === 'music' && "bg-pink-500 shadow-pink-500/30 shadow-lg",
                                        activeTab === 'sfx' && "bg-cyan-500 shadow-cyan-500/30 shadow-lg",
                                    )}>
                                        {activeTab === 'tts' && <IconMicrophone className="w-8 h-8" />}
                                        {activeTab === 'clone' && <IconUser className="w-8 h-8" />}
                                        {activeTab === 'music' && <IconMusic className="w-8 h-8" />}
                                        {activeTab === 'sfx' && <IconVolume className="w-8 h-8" />}
                                    </div>
                                    <div>
                                        <h1 className="text-3xl font-extrabold text-white tracking-tight">
                                            {activeTab === 'tts' && 'Text-to-Speech Studio'}
                                            {activeTab === 'clone' && 'Clonagem Neural de Voz'}
                                            {activeTab === 'music' && 'Música IA'}
                                            {activeTab === 'sfx' && 'Efeitos Sonoros'}
                                        </h1>
                                        <p className="text-gray-400 mt-1">
                                            {activeTab === 'tts' && 'Sintetize vozes incrivelmente realistas a partir de textos'}
                                            {activeTab === 'clone' && 'Recrie a sua própria voz para narrações e locuções'}
                                            {activeTab === 'music' && 'A trilha sonora perfeita sob demanda'}
                                            {activeTab === 'sfx' && 'Catálogo com milhares de sons para os seus vídeos'}
                                        </p>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Module Content */}
                        <div className="space-y-8">
                            {/* TTS TAB */}
                            {activeTab === 'tts' && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                    {renderProviderSelector()}
                                    
                                    <div>
                                        <h3 className="text-sm font-semibold text-white/70 mb-3 uppercase tracking-wider">Selecione a Voz</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                            {AUDIO_PROVIDERS[selectedProvider]?.supportedVoices?.map((voice) => (
                                                <button
                                                    key={voice}
                                                    onClick={() => setSelectedVoice(voice)}
                                                    className={cn(
                                                        'px-4 py-3 rounded-xl font-bold transition-all text-sm truncate',
                                                        selectedVoice === voice
                                                            ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]'
                                                            : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20'
                                                    )}
                                                >
                                                    {voice.replace('facebook/', '')}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-semibold text-white/70 mb-3 uppercase tracking-wider">O que deseja que o narrador diga?</h3>
                                        <div className="bg-black/40 border border-white/10 focus-within:border-indigo-500/50 rounded-2xl p-4 transition-all shadow-inner">
                                            <Textarea
                                                ref={textareaRef}
                                                value={input}
                                                onChange={(e) => setInput(e.target.value)}
                                                placeholder="Digite aqui o roteiro da sua locução ou narração..."
                                                minRows={5}
                                                className="w-full bg-transparent text-lg text-white placeholder:text-gray-600 focus:outline-none resize-none leading-relaxed"
                                            />
                                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-indigo-400 font-medium px-2 py-1 bg-indigo-500/10 rounded-md">
                                                        {input.length} caracteres digitados
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => setInput(TTS_QUICK_TEXTS[Math.floor(Math.random() * TTS_QUICK_TEXTS.length)])}
                                                    className="px-3 py-1.5 text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-md transition-colors flex items-center gap-2"
                                                >
                                                    <IconSparkles className="w-3.5 h-3.5" /> Texto Aleatório
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleGenerate}
                                        disabled={!input.trim() || isGenerating}
                                        className="w-full px-6 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 overflow-hidden shadow-lg shadow-indigo-600/30 group"
                                    >
                                        {isGenerating ? (
                                            <><IconLoader2 className="w-6 h-6 animate-spin" /> Sintetizando Áudio Magistral...</>
                                        ) : (
                                            <><IconPlayerPlay className="w-6 h-6" /> Produzir Áudio Agora</>
                                        )}
                                    </button>
                                </motion.div>
                            )}

                            {/* CLONE TAB */}
                            {activeTab === 'clone' && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                    <div className="bg-purple-900/10 border border-purple-500/20 rounded-3xl p-8 backdrop-blur-md">
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            {/* Formulário */}
                                            <div className="space-y-5">
                                                <div>
                                                    <label className="block text-sm font-semibold text-white/80 mb-2">Nome do Clone</label>
                                                    <input
                                                        type="text"
                                                        value={cloneName}
                                                        onChange={(e) => setCloneName(e.target.value)}
                                                        placeholder="Ex: Minha Voz Principal"
                                                        className="w-full px-5 py-3.5 bg-black/40 border border-white/10 rounded-2xl text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold text-white/80 mb-2">Descrição / Sotaque</label>
                                                    <input
                                                        type="text"
                                                        value={cloneDescription}
                                                        onChange={(e) => setCloneDescription(e.target.value)}
                                                        placeholder="Ex: Voz jovem, entusiástica, tom natural..."
                                                        className="w-full px-5 py-3.5 bg-black/40 border border-white/10 rounded-2xl text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50"
                                                    />
                                                </div>
                                            </div>

                                            {/* Upload de Arquivo */}
                                            <div>
                                                <label className="block text-sm font-semibold text-white/80 mb-2">Áudio Modelo (.mp3, .wav)</label>
                                                <div className="relative border-2 border-dashed border-purple-500/30 hover:border-purple-500 bg-purple-500/5 transition-all rounded-3xl h-full min-h-[160px] group flex flex-col items-center justify-center text-center p-6">
                                                    <input
                                                        type="file"
                                                        accept=".mp3,.wav,.m4a"
                                                        onChange={(e) => setCloneFile(e.target.files?.[0] || null)}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                    />
                                                    <div className="w-16 h-16 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center group-hover:scale-110 group-hover:bg-purple-500 group-hover:text-white transition-all mb-4">
                                                        <IconUpload className="w-8 h-8" />
                                                    </div>
                                                    {cloneFile ? (
                                                        <div>
                                                            <div className="text-white font-bold">{cloneFile.name}</div>
                                                            <div className="text-purple-300/60 text-sm mt-1">{(cloneFile.size / 1024 / 1024).toFixed(2)} MB preparo para clonagem</div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <span className="text-purple-100 font-bold mb-1">Arraste seu arquivo para cá</span>
                                                            <span className="text-sm text-purple-300/50 px-4">Para melhor resultado: 1 a 3 minutos gravados em estúdio sem ruído de fundo.</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleCloneVoice}
                                            disabled={!cloneFile || !cloneName.trim() || isCloning}
                                            className="w-full mt-8 px-6 py-5 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 shadow-lg shadow-purple-600/30"
                                        >
                                            {isCloning ? (
                                                <><IconLoader2 className="w-6 h-6 animate-spin" /> Injetando Algoritmos de IA DeepLearning...</>
                                            ) : (
                                                <><IconSparkles className="w-6 h-6" /> Analisar Áudio & Criar Clone</>
                                            )}
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Music Placeholder */}
                            {activeTab === 'music' && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 opacity-50">
                                    <IconMusic className="w-24 h-24 mb-6 text-pink-500/50" />
                                    <h3 className="text-2xl font-bold text-white mb-2">Trilha Sonora Automática</h3>
                                    <p className="text-center text-gray-400 max-w-md">O gerador de música avançado está em atualização para a v3.0.</p>
                                </motion.div>
                            )}

                        </div>
                    </div>
                </div>

                {/* 3. Right Sidebar - History & Playback (ALWAYS VISIBLE) */}
                <div className="w-[380px] bg-black/50 backdrop-blur-xl border-l border-white/5 flex flex-col z-10 shrink-0">
                    <div className="p-6 border-b border-white/5 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <IconHistory className="w-6 h-6 text-indigo-400" />
                            Sua Biblioteca
                        </h2>
                        <span className="bg-white/10 text-xs px-2.5 py-1 rounded-md text-white/50">{audios.length} itens</span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                        <AnimatePresence>
                            {audios.length === 0 ? (
                                <div className="text-center py-20 px-4 opacity-50">
                                    <IconLayoutGrid className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                                    <p className="text-gray-300 font-medium">Sua biblioteca está vazia</p>
                                    <p className="text-sm text-gray-500 mt-2">Crie seu primeiro projeto para visualizar aqui.</p>
                                </div>
                            ) : (
                                audios.map((audio) => (
                                    <motion.div
                                        key={audio.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="bg-white/[0.03] border border-white/5 hover:border-white/10 hover:bg-white/[0.05] rounded-2xl p-4 transition-all group"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center shrink-0">
                                                    {audio.type === 'tts' && <IconMicrophone className="w-5 h-5" />}
                                                    {audio.type === 'music' && <IconMusic className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                                                        {audio.type} <span className="text-white/40 font-normal">|</span> <span className="text-indigo-300 capitalize">{audio.voice || audio.provider}</span>
                                                    </h4>
                                                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1" title={audio.text || audio.prompt || ''}>
                                                        {audio.text || audio.prompt || 'Sem descrição'}
                                                    </p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={async () => {
                                                    const { error } = await supabase.from('generated_audios').update({ deleted_at: new Date().toISOString() }).eq('id', audio.id);
                                                    if(!error) setAudios(prev => prev.filter(a => a.id !== audio.id));
                                                }}
                                                className="text-red-500/50 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <IconTrash className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* NATIVE VISIBLE PLAYER */}
                                        <div className="mt-3 bg-black/40 rounded-xl overflow-hidden shadow-inner">
                                            <audio
                                                controls
                                                src={audio.url}
                                                className="w-full h-11 sepia-[0.3] hue-rotate-180 saturate-200 outline-none"
                                                controlsList="nodownload"
                                            />
                                        </div>

                                        <div className="flex items-center justify-between mt-3 px-1">
                                            <span className="text-[10px] text-gray-500 font-medium bg-black/40 px-2 py-1 rounded">Hoje</span>
                                            <div className="flex gap-2">
                                                <a href={audio.url} download target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/20 p-1.5 rounded-lg">
                                                    <IconDownload className="w-4 h-4" />
                                                </a>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Modals outside workspace */}
            {audioToEdit && (
                <AudioEditor audioUrl={audioToEdit} onSave={() => setAudioToEdit(null)} onClose={() => setAudioToEdit(null)} />
            )}
            {showSoundLibrary && (
                <SoundLibrary onSelectSound={() => setShowSoundLibrary(false)} onClose={() => setShowSoundLibrary(false)} />
            )}
        </>
    );
}

export default AudioGalleryPro;
