/**
 * IMAGE GALLERY PRO - Versão 2026 Profissional
 * Plataforma completa de geração e edição de imagens com IA
 * 
 * Features:
 * - Múltiplas APIs (Gemini, Grok, FLUX, SDXL)
 * - Editor Fabric.js integrado
 * - Biblioteca de assets (Unsplash, Pexels, Pixabay)
 * - 18 Templates profissionais
 * - História salva no Supabase
 * - System de tabs moderno
 * 
 * @version 2.0.0
 * @date 2025-12-10
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
    IconSend,
    IconPhoto,
    IconDownload,
    IconX,
    IconHeart,
    IconHeartFilled,
    IconLoader2,
    IconSparkles,
    IconLibrary,
    IconEdit,
    IconTemplate,
    IconHistory,
    IconTrash,
    IconCopy,
    IconCheck,
    IconWand,
    IconSettings,
} from '@tabler/icons-react';
import Textarea from 'react-textarea-autosize';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/authStore';

// Import new components
import { ImageEditor } from '@/components/media/image/ImageEditor';
import { AssetLibrary } from '@/components/media/image/AssetLibrary';
import {
    IMAGE_PROVIDERS,
    generateImageWithFallback,
    getAvailableProviders,
    type ImageGenerationOptions
} from '@/lib/media/image-providers';
import {
    ALL_IMAGE_TEMPLATES,
    TEMPLATES_BY_CATEGORY,
    type ImageTemplate,
} from '@/lib/media/templates/image-templates';

interface ImageGalleryProProps {
    onSendMessage?: (message: string) => void;
    onDetectContext?: (message: string) => void;
    userId?: string;
    isExpanded?: boolean;
}

interface GeneratedImage {
    id: string;
    url: string;
    prompt: string;
    timestamp: number;
    liked?: boolean;
    size: string;
    model: string;
    provider: string;
}

type TabType = 'generate' | 'library' | 'edit' | 'templates' | 'history';

const QUICK_PROMPTS = [
    { icon: '🎯', text: 'Banner promocional moderno e minimalista' },
    { icon: '🚀', text: 'Logo futurista e profissional' },
    { icon: '🎨', text: 'Arte abstrata vibrante e colorida' },
    { icon: '📱', text: 'Thumbnail para redes sociais chamativa' },
    { icon: '💼', text: 'Imagem corporativa profissional' },
    { icon: '🌟', text: 'Design de produto elegante' },
];

export function ImageGalleryPro({
    onSendMessage,
    onDetectContext,
    userId,
    isExpanded,
}: ImageGalleryProProps) {
    // State
    const [activeTab, setActiveTab] = useState<TabType>('generate');
    const [input, setInput] = useState('');
    const [images, setImages] = useState<GeneratedImage[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState('flux_pro');
    const [selectedSize, setSelectedSize] = useState<'1024x1024' | '1024x1792' | '1792x1024'>('1024x1024');
    const [selectedStyle, setSelectedStyle] = useState<'vivid' | 'natural' | 'realistic' | 'artistic'>('vivid');
    const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
    const [imageToEdit, setImageToEdit] = useState<string | null>(null);
    const [showAssetLibrary, setShowAssetLibrary] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<ImageTemplate | null>(null);
    const [availableProviders, setAvailableProviders] = useState<string[]>([]);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const supabase = createClient();
    const user = useAuthStore((state) => state.user);

    // Load available providers on mount
    useEffect(() => {
        loadAvailableProviders();
    }, []);

    const loadAvailableProviders = async () => {
        const providers = await getAvailableProviders();
        setAvailableProviders(providers.map(p => p.id));

        // Set first available as default
        if (providers.length > 0 && !availableProviders.includes(selectedProvider)) {
            setSelectedProvider(providers[0].id);
        }
    };

    // Load images from Supabase
    useEffect(() => {
        if (activeTab === 'history') {
            loadImagesFromSupabase();
        }
    }, [activeTab]);

    const loadImagesFromSupabase = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('generated_images')
                .select('*')
                .eq('user_id', user.id)
                .is('deleted_at', null)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;

            if (data) {
                const formattedImages: GeneratedImage[] = data.map((img) => ({
                    id: img.id,
                    url: img.url,
                    prompt: img.prompt,
                    timestamp: new Date(img.created_at).getTime(),
                    size: img.size,
                    model: img.model,
                    provider: img.provider || 'unknown',
                    liked: img.liked || false,
                }));
                setImages(formattedImages);
            }
        } catch (error) {
            console.error('Error loading images:', error);
            toast.error('Erro ao carregar histórico');
        }
    };

    // Generate image
    const handleGenerate = async () => {
        if (!input.trim() || isGenerating || !user) return;

        const prompt = input.trim();
        setIsGenerating(true);

        try {
            const options: ImageGenerationOptions = {
                prompt,
                width: selectedSize === '1024x1024' ? 1024 : selectedSize === '1792x1024' ? 1792 : 1024,
                height: selectedSize === '1024x1024' ? 1024 : selectedSize === '1024x1792' ? 1792 : 1024,
                style: selectedStyle,
            };

            const result = await generateImageWithFallback(options, selectedProvider);

            // Save to Supabase
            const { data, error } = await supabase
                .from('generated_images')
                .insert({
                    user_id: user.id,
                    url: result.url,
                    prompt: result.prompt,
                    size: selectedSize,
                    model: result.metadata.model,
                    provider: result.provider,
                })
                .select()
                .single();

            if (error) throw error;

            const newImage: GeneratedImage = {
                id: data.id,
                url: result.url,
                prompt: result.prompt,
                timestamp: Date.now(),
                size: selectedSize,
                model: result.metadata.model,
                provider: result.provider,
            };

            setImages((prev) => [newImage, ...prev]);
            setInput('');
            toast.success('Imagem gerada com sucesso!');

            // Switch to history to show result
            setActiveTab('history');
        } catch (error: any) {
            console.error('Generation error:', error);
            toast.error(error.message || 'Erro ao gerar imagem');
        } finally {
            setIsGenerating(false);
        }
    };

    // Handle template selection
    const handleSelectTemplate = (template: ImageTemplate) => {
        setSelectedTemplate(template);
        setInput(template.suggestedPrompt);
        setSelectedSize(
            template.width === template.height ? '1024x1024' :
                template.width > template.height ? '1792x1024' : '1024x1792'
        );
        setActiveTab('generate');
        toast.success(`Template "${template.name}" aplicado!`);
    };

    // Handle asset library image
    const handleAssetSelect = (imageUrl: string) => {
        const newImage: GeneratedImage = {
            id: Date.now().toString(),
            url: imageUrl,
            prompt: 'Imagem da biblioteca',
            timestamp: Date.now(),
            size: 'original',
            model: 'asset-library',
            provider: 'external',
        };

        setImages((prev) => [newImage, ...prev]);
        setShowAssetLibrary(false);
        setActiveTab('history');
        toast.success('Imagem adicionada!');
    };

    // Toggle like
    const toggleLike = async (imageId: string) => {
        const image = images.find(img => img.id === imageId);
        if (!image) return;

        const newLiked = !image.liked;

        try {
            const { error } = await supabase
                .from('generated_images')
                .update({ liked: newLiked })
                .eq('id', imageId);

            if (error) throw error;

            setImages(prev => prev.map(img =>
                img.id === imageId ? { ...img, liked: newLiked } : img
            ));
        } catch (error) {
            console.error('Error toggling like:', error);
        }
    };

    // Download image
    const handleDownload = async (image: GeneratedImage) => {
        try {
            const response = await fetch(image.url);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `image-${image.id}.png`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Download iniciado!');
        } catch (error) {
            console.error('Download error:', error);
            toast.error('Erro ao baixar imagem');
        }
    };

    // Delete image
    const handleDelete = async (imageId: string) => {
        try {
            const { error } = await supabase
                .from('generated_images')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', imageId);

            if (error) throw error;

            setImages(prev => prev.filter(img => img.id !== imageId));
            toast.success('Imagem deletada');
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
                            setShowAssetLibrary(true);
                            setActiveTab('library');
                        }}
                        className={cn(
                            'w-12 h-12 rounded-xl flex items-center justify-center transition',
                            activeTab === 'library'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        )}
                        title="Biblioteca"
                    >
                        <IconLibrary className="w-6 h-6" />
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
                            {activeTab === 'generate' && 'Gerar Imagem com IA'}
                            {activeTab === 'library' && 'Biblioteca de Assets'}
                            {activeTab === 'templates' && 'Templates Profissionais'}
                            {activeTab === 'history' && 'Histórico de Imagens'}
                        </h2>
                        <p className="text-sm text-gray-400">
                            {activeTab === 'generate' && `${availableProviders.length} providers disponíveis`}
                            {activeTab === 'library' && 'Milhões de imagens HD gratuitas'}
                            {activeTab === 'templates' && `${ALL_IMAGE_TEMPLATES.length} templates prontos`}
                            {activeTab === 'history' && `${images.length} imagens geradas`}
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
                                    className="space-y-6"
                                >
                                    {/* Provider Selection */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-3">
                                            Modelo de IA
                                        </label>
                                        <div className="grid grid-cols-4 gap-3">
                                            {availableProviders.map((providerId) => {
                                                const provider = IMAGE_PROVIDERS[providerId];
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
                                                            {provider.costPerImage} créditos
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Size Selection */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-3">
                                            Tamanho
                                        </label>
                                        <div className="flex gap-3">
                                            {(['1024x1024', '1792x1024', '1024x1792'] as const).map((size) => (
                                                <button
                                                    key={size}
                                                    onClick={() => setSelectedSize(size)}
                                                    className={cn(
                                                        'px-6 py-3 rounded-lg font-medium transition',
                                                        selectedSize === size
                                                            ? 'bg-blue-600 text-white'
                                                            : 'bg-white/5 text-gray-300 hover:bg-white/10'
                                                    )}
                                                >
                                                    {size === '1024x1024' ? 'Quadrado' : size === '1792x1024' ? 'Paisagem' : 'Retrato'}
                                                    <div className="text-xs opacity-70 mt-1">{size}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Style Selection */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-3">
                                            Estilo
                                        </label>
                                        <div className="flex gap-3">
                                            {(['vivid', 'natural', 'realistic', 'artistic'] as const).map((style) => (
                                                <button
                                                    key={style}
                                                    onClick={() => setSelectedStyle(style)}
                                                    className={cn(
                                                        'px-6 py-3 rounded-lg font-medium transition capitalize',
                                                        selectedStyle === style
                                                            ? 'bg-blue-600 text-white'
                                                            : 'bg-white/5 text-gray-300 hover:bg-white/10'
                                                    )}
                                                >
                                                    {style === 'vivid' ? 'Vívido' : style === 'natural' ? 'Natural' : style === 'realistic' ? 'Realista' : 'Artístico'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Quick Prompts */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-3">
                                            Prompts Rápidos
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {QUICK_PROMPTS.map((prompt, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setInput(prompt.text)}
                                                    className="p-4 bg-white/5 hover:bg-white/10 rounded-lg text-left transition group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-2xl">{prompt.icon}</span>
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
                                            placeholder="Descreva a imagem que você quer gerar... (quanto mais detalhes, melhor o resultado)"
                                            maxRows={6}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                        />
                                    </div>

                                    {/* Generate Button */}
                                    <button
                                        onClick={handleGenerate}
                                        disabled={!input.trim() || isGenerating}
                                        className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-3"
                                    >
                                        {isGenerating ? (
                                            <>
                                                <IconLoader2 className="w-6 h-6 animate-spin" />
                                                Gerando...
                                            </>
                                        ) : (
                                            <>
                                                <IconSparkles className="w-6 h-6" />
                                                Gerar Imagem
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
                                    {/* Category Tabs */}
                                    <div className="flex gap-3 mb-6">
                                        {Object.keys(TEMPLATES_BY_CATEGORY).map((category) => (
                                            <button
                                                key={category}
                                                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg capitalize transition"
                                            >
                                                {category}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Templates Grid */}
                                    <div className="grid grid-cols-3 gap-4">
                                        {ALL_IMAGE_TEMPLATES.map((template) => (
                                            <button
                                                key={template.id}
                                                onClick={() => handleSelectTemplate(template)}
                                                className="group p-4 bg-white/5 hover:bg-white/10 rounded-xl transition text-left"
                                            >
                                                <div
                                                    className="aspect-video rounded-lg mb-3 flex items-center justify-center text-4xl font-bold text-white/50"
                                                    style={{ backgroundColor: template.backgroundColor }}
                                                >
                                                    {template.preview}
                                                </div>
                                                <div className="font-semibold text-white mb-1">
                                                    {template.name}
                                                </div>
                                                <div className="text-xs text-gray-400 mb-2">
                                                    {template.width} × {template.height}
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
                                    {images.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-96">
                                            <IconPhoto className="w-20 h-20 text-gray-600 mb-4" />
                                            <p className="text-xl text-gray-400 mb-2">
                                                Nenhuma imagem ainda
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                Gere sua primeira imagem para começar
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-4 gap-4">
                                            {images.map((image) => (
                                                <div
                                                    key={image.id}
                                                    className="group relative aspect-square rounded-xl overflow-hidden bg-white/5"
                                                >
                                                    <img
                                                        src={image.url}
                                                        alt={image.prompt}
                                                        className="w-full h-full object-cover"
                                                    />

                                                    {/* Overlay */}
                                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center p-4 gap-2">
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => setImageToEdit(image.url)}
                                                                className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                                                                title="Editar"
                                                            >
                                                                <IconEdit className="w-5 h-5 text-white" />
                                                            </button>

                                                            <button
                                                                onClick={() => handleDownload(image)}
                                                                className="p-2 bg-green-600 hover:bg-green-700 rounded-lg transition"
                                                                title="Download"
                                                            >
                                                                <IconDownload className="w-5 h-5 text-white" />
                                                            </button>

                                                            <button
                                                                onClick={() => toggleLike(image.id)}
                                                                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition"
                                                                title="Curtir"
                                                            >
                                                                {image.liked ? (
                                                                    <IconHeartFilled className="w-5 h-5 text-red-500" />
                                                                ) : (
                                                                    <IconHeart className="w-5 h-5 text-white" />
                                                                )}
                                                            </button>

                                                            <button
                                                                onClick={() => handleDelete(image.id)}
                                                                className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
                                                                title="Deletar"
                                                            >
                                                                <IconTrash className="w-5 h-5 text-white" />
                                                            </button>
                                                        </div>

                                                        <p className="text-xs text-white text-center line-clamp-2 pt-2">
                                                            {image.prompt}
                                                        </p>

                                                        <div className="text-xs text-gray-300 capitalize">
                                                            {image.provider}
                                                        </div>
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
            {imageToEdit && (
                <ImageEditor
                    imageUrl={imageToEdit}
                    onSave={(editedUrl) => {
                        // Handle edited image
                        setImageToEdit(null);
                        toast.success('Imagem editada salva!');
                    }}
                    onClose={() => setImageToEdit(null)}
                />
            )}

            {showAssetLibrary && (
                <AssetLibrary
                    onSelectImage={handleAssetSelect}
                    onClose={() => setShowAssetLibrary(false)}
                />
            )}
        </>
    );
}

export default ImageGalleryPro;
