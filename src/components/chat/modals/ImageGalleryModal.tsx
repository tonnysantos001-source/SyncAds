/**
 * IMAGE GALLERY MODAL
 * Galeria de imagens tipo Canva - gerar, visualizar, editar imagens com IA
 *
 * Features:
 * - Grid de imagens geradas
 * - Geração de imagens com DALL-E
 * - Preview ampliado
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
  IconPhoto,
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
  IconZoomIn,
  IconTrash,
  IconWand,
  IconRefresh,
} from '@tabler/icons-react';
import Textarea from 'react-textarea-autosize';
import { useToast } from '@/components/ui/use-toast';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/authStore';

interface ImageGalleryModalProps {
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
}

const IMAGE_STYLES = [
  { id: 'vivid', name: 'Vibrante', icon: '🎨' },
  { id: 'natural', name: 'Natural', icon: '🌿' },
  { id: 'realistic', name: 'Realista', icon: '📸' },
  { id: 'artistic', name: 'Artístico', icon: '🖼️' },
];

const IMAGE_SIZES = [
  { id: '1024x1024', name: 'Quadrado', size: '1024x1024' },
  { id: '1792x1024', name: 'Paisagem', size: '1792x1024' },
  { id: '1024x1792', name: 'Retrato', size: '1024x1792' },
];

const QUICK_PROMPTS = [
  { icon: '🎯', text: 'Banner promocional moderno e minimalista' },
  { icon: '🚀', text: 'Logo futurista e profissional' },
  { icon: '🎨', text: 'Arte abstrata vibrante e colorida' },
  { icon: '📱', text: 'Thumbnail para redes sociais' },
];

export function ImageGalleryModal({
  onSendMessage,
  onDetectContext,
  userId,
  isExpanded,
}: ImageGalleryModalProps) {
  const [input, setInput] = useState('');
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState('vivid');
  const [selectedSize, setSelectedSize] = useState('1024x1024');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const supabase = createClient();
  const user = useAuthStore((state) => state.user);

  // Load images from Supabase on mount
  useEffect(() => {
    loadImagesFromSupabase();
  }, []);

  // Function to load images from Supabase
  const loadImagesFromSupabase = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('generated_images')
        .select('id, url, prompt, timestamp:created_at, size, model, liked')
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
          timestamp: new Date(img.timestamp).getTime(),
          size: img.size,
          model: img.model,
          liked: img.liked || false,
        }));
        setImages(formattedImages);
      }
    } catch (error) {
      console.error('Error loading images from Supabase:', error);
    }
  };

  // Detect context on input change
  useEffect(() => {
    if (input.trim() && onDetectContext) {
      const timeoutId = setTimeout(() => {
        onDetectContext(input);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [input, onDetectContext]);

  // Handle generate image with Edge Function
  const handleGenerate = async () => {
    if (!input.trim() || isGenerating || !user) return;

    const prompt = input.trim();
    setInput('');
    setIsGenerating(true);

    try {
      onSendMessage?.(prompt);

      toast({
        title: 'Gerando imagem...',
        description: 'Isso pode levar alguns segundos',
      });

      // Get auth session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      // Call Edge Function
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          prompt,
          size: selectedSize,
          quality: 'standard',
          provider: 'auto', // Usa Pollinations.ai grátis primeiro
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao gerar imagem');
      }

      const result = await response.json();

      if (result.success && result.image?.url) {
        // Salvar no Supabase
        const { data: savedImage, error: insertError } = await supabase
          .from('generated_images')
          .insert({
            user_id: user.id,
            url: result.image.url,
            prompt,
            model: result.image.provider || 'pollinations',
            style: selectedStyle,
            size: selectedSize,
            quality: 'standard',
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // Adicionar à lista local
        const newImage: GeneratedImage = {
          id: savedImage.id,
          url: result.image.url,
          prompt,
          timestamp: Date.now(),
          size: selectedSize,
          model: result.image.provider || 'pollinations',
        };

        setImages((prev) => [newImage, ...prev]);

        toast({
          title: 'Imagem gerada!',
          description: result.image.free
            ? '🎉 Gerada gratuitamente com Pollinations.ai!'
            : 'Sua imagem foi criada com sucesso',
        });
      } else {
        throw new Error('Resposta inválida do servidor');
      }
    } catch (error: any) {
      console.error('Error generating image:', error);
      toast({
        title: 'Erro ao gerar imagem',
        description: error.message || 'Tente novamente',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
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

  // Toggle like with Supabase sync
  const toggleLike = async (imageId: string) => {
    // Update locally first (optimistic update)
    setImages((prev) =>
      prev.map((img) =>
        img.id === imageId ? { ...img, liked: !img.liked } : img
      )
    );

    // Sync with Supabase
    try {
      const image = images.find(img => img.id === imageId);
      if (!image) return;

      await supabase
        .from('generated_images')
        .update({ liked: !image.liked })
        .eq('id', imageId);
    } catch (error) {
      console.error('Error updating like status:', error);
      // Revert on error
      setImages((prev) =>
        prev.map((img) =>
          img.id === imageId ? { ...img, liked: !img.liked } : img
        )
      );
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
      a.download = `syncads-image-${image.id}.png`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'Download iniciado',
        description: 'A imagem está sendo baixada',
      });
    } catch (error) {
      toast({
        title: 'Erro ao baixar',
        description: 'Tente novamente',
        variant: 'destructive',
      });
    }
  };

  // Copy image URL
  const handleCopyUrl = (image: GeneratedImage) => {
    navigator.clipboard.writeText(image.url);
    setCopiedId(image.id);
    setTimeout(() => setCopiedId(null), 2000);

    toast({
      title: 'Link copiado!',
      description: 'URL da imagem copiada para área de transferência',
    });
  };

  // Delete image (soft delete in Supabase)
  const handleDelete = async (imageId: string) => {
    // Remove locally first
    setImages((prev) => prev.filter((img) => img.id !== imageId));
    setSelectedImage(null);

    toast({
      title: 'Imagem removida',
      description: 'A imagem foi excluída da galeria',
    });

    // Soft delete in Supabase
    try {
      await supabase
        .from('generated_images')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', imageId);
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  // Filter images
  const filteredImages = images.filter((img) =>
    searchQuery
      ? img.prompt.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10 bg-black/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
              <IconPhoto className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Galeria de Imagens</h2>
              <p className="text-sm text-gray-400">{images.length} imagens geradas</p>
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
                placeholder="Buscar imagens..."
                className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 w-64"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'p-2 rounded-lg transition-colors',
                showFilters
                  ? 'bg-purple-600 text-white'
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
                      {IMAGE_STYLES.map((style) => (
                        <button
                          key={style.id}
                          onClick={() => setSelectedStyle(style.id)}
                          className={cn(
                            'flex-1 px-3 py-2 rounded-lg text-sm transition-all',
                            selectedStyle === style.id
                              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                              : 'bg-white/5 text-gray-400 hover:bg-white/10'
                          )}
                        >
                          <span className="mr-1">{style.icon}</span>
                          {style.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Size selector */}
                  <div className="flex-1">
                    <label className="text-xs text-gray-400 mb-2 block">Tamanho</label>
                    <div className="flex gap-2">
                      {IMAGE_SIZES.map((size) => (
                        <button
                          key={size.id}
                          onClick={() => setSelectedSize(size.size)}
                          className={cn(
                            'flex-1 px-3 py-2 rounded-lg text-sm transition-all',
                            selectedSize === size.size
                              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                              : 'bg-white/5 text-gray-400 hover:bg-white/10'
                          )}
                        >
                          {size.name}
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
              placeholder="Descreva a imagem que você quer gerar..."
              maxRows={3}
              disabled={isGenerating}
              className={cn(
                'w-full px-4 py-3 pr-12',
                'bg-white/5 border border-white/10 rounded-xl',
                'text-white placeholder:text-gray-500 text-sm',
                'focus:outline-none focus:ring-2 focus:ring-purple-500/50',
                'disabled:opacity-50 resize-none'
              )}
            />
            <button
              onClick={handleGenerate}
              disabled={!input.trim() || isGenerating}
              className={cn(
                'absolute right-2 bottom-2 w-9 h-9 rounded-lg flex items-center justify-center transition-all',
                input.trim() && !isGenerating
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 hover:bg-purple-700'
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

          {/* Quick prompts */}
          {!isGenerating && images.length === 0 && (
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
        {isGenerating && images.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full"
            />
            <div className="text-center">
              <p className="text-white font-medium">Gerando sua imagem...</p>
              <p className="text-sm text-gray-400">Isso pode levar alguns segundos</p>
            </div>
          </div>
        ) : filteredImages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <motion.div
              animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-2xl"
            >
              <IconSparkles className="w-10 h-10 text-white" />
            </motion.div>
            <div className="text-center max-w-md">
              <h3 className="text-xl font-bold text-white mb-2">
                {searchQuery ? 'Nenhuma imagem encontrada' : 'Galeria vazia'}
              </h3>
              <p className="text-gray-400">
                {searchQuery
                  ? 'Tente buscar por outro termo'
                  : 'Comece gerando sua primeira imagem com IA'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence>
              {filteredImages.map((image, index) => (
                <motion.div
                  key={image.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative aspect-square rounded-xl overflow-hidden bg-white/5 border border-white/10 cursor-pointer"
                  onClick={() => setSelectedImage(image)}
                >
                  <img
                    src={image.url}
                    alt={image.prompt}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
                      <p className="text-white text-sm font-medium line-clamp-2">
                        {image.prompt}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          {new Date(image.timestamp).toLocaleDateString()}
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleLike(image.id);
                            }}
                            className="p-1.5 rounded-lg bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-colors"
                          >
                            {image.liked ? (
                              <IconHeartFilled className="w-4 h-4 text-red-500" />
                            ) : (
                              <IconHeart className="w-4 h-4 text-white" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick actions */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(image);
                      }}
                      className="p-1.5 rounded-lg bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-colors"
                    >
                      <IconDownload className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-6xl w-full max-h-[90vh] bg-gray-900 rounded-2xl overflow-hidden border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/20">
                <div className="flex-1 min-w-0 mr-4">
                  <p className="text-white font-medium truncate">{selectedImage.prompt}</p>
                  <p className="text-sm text-gray-400">
                    {selectedImage.size} • {new Date(selectedImage.timestamp).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleLike(selectedImage.id)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    {selectedImage.liked ? (
                      <IconHeartFilled className="w-5 h-5 text-red-500" />
                    ) : (
                      <IconHeart className="w-5 h-5 text-white" />
                    )}
                  </button>
                  <button
                    onClick={() => handleCopyUrl(selectedImage)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    {copiedId === selectedImage.id ? (
                      <IconCheck className="w-5 h-5 text-green-500" />
                    ) : (
                      <IconCopy className="w-5 h-5 text-white" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDownload(selectedImage)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <IconDownload className="w-5 h-5 text-white" />
                  </button>
                  <button
                    onClick={() => handleDelete(selectedImage.id)}
                    className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors"
                  >
                    <IconTrash className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <IconX className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Image */}
              <div className="flex items-center justify-center p-8 max-h-[calc(90vh-100px)] overflow-auto">
                <img
                  src={selectedImage.url}
                  alt={selectedImage.prompt}
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ImageGalleryModal;
