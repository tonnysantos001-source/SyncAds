/**
 * useImageGeneration Hook
 * Hook para gerenciar geração de imagens com IA
 * 
 * Features:
 * - Integração com Edge Function /generate-image
 * - Suporte a múltiplos provedores (DALL-E, Stability AI, etc)
 * - Upload e armazenamento automático
 * - Histórico de imagens geradas
 * - Error handling e retry
 * 
 * @version 1.0.0
 */

import { useState, useCallback } from 'react';
import { useModalError } from './useModalError';
import { useAuthStore } from '@/store/authStore';

export interface ImageGenerationOptions {
    /** Prompt de geração */
    prompt: string;
    /** Estilo da imagem */
    style?: 'vivid' | 'natural' | 'realistic' | 'artistic';
    /** Tamanho da imagem */
    size?: '1024x1024' | '1792x1024' | '1024x1792';
    /** Modelo de IA */
    model?: 'dall-e-3' | 'dall-e-2' | 'stability';
    /** Número de variações */
    n?: number;
}

export interface GeneratedImage {
    id: string;
    url: string;
    prompt: string;
    timestamp: number;
    liked?: boolean;
    size: string;
    model: string;
    style: string;
}

export function useImageGeneration() {
    const [isGenerating, setIsGenerating] = useState(false);
    const [currentImage, setCurrentImage] = useState<GeneratedImage | null>(null);
    const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);

    const { handleError, withRetry } = useModalError();
    const user = useAuthStore((state) => state.user);

    /**
     * Gera uma nova imagem com IA
     */
    const generateImage = useCallback(
        async (options: ImageGenerationOptions): Promise<GeneratedImage> => {
            if (!user) {
                throw new Error('Usuário não autenticado');
            }

            const {
                prompt,
                style = 'vivid',
                size = '1024x1024',
                model = 'dall-e-3',
                n = 1,
            } = options;

            setIsGenerating(true);
            setCurrentImage(null);

            try {
                // Chamar Edge Function com retry
                const image = await withRetry(async () => {
                    const response = await fetch('/api/generate-image', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${user.id}`,
                        },
                        body: JSON.stringify({
                            prompt,
                            style,
                            size,
                            model,
                            n,
                            userId: user.id,
                        }),
                    });

                    if (!response.ok) {
                        const error = await response.json();
                        throw new Error(error.message || 'Erro ao gerar imagem');
                    }

                    const data = await response.json();
                    return data;
                }, 2); // 2 tentativas

                // Criar objeto de imagem
                const generatedImage: GeneratedImage = {
                    id: image.id || crypto.randomUUID(),
                    url: image.url,
                    prompt,
                    timestamp: Date.now(),
                    size,
                    model,
                    style,
                    liked: false,
                };

                // Atualizar estado
                setCurrentImage(generatedImage);
                setGeneratedImages((prev) => [generatedImage, ...prev]);

                return generatedImage;
            } catch (error) {
                handleError(error, {
                    context: 'Image Generation',
                    userMessage: 'Não foi possível gerar a imagem. Tente novamente.',
                });
                throw error;
            } finally {
                setIsGenerating(false);
            }
        },
        [user, handleError, withRetry]
    );

    /**
     * Gera variações de uma imagem existente
     */
    const generateVariations = useCallback(
        async (imageUrl: string, n = 4): Promise<GeneratedImage[]> => {
            if (!user) {
                throw new Error('Usuário não autenticado');
            }

            setIsGenerating(true);

            try {
                const response = await fetch('/api/generate-image-variations', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${user.id}`,
                    },
                    body: JSON.stringify({
                        imageUrl,
                        n,
                        userId: user.id,
                    }),
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || 'Erro ao gerar variações');
                }

                const data = await response.json();

                // Mapear variações
                const variations: GeneratedImage[] = data.variations.map((v: any) => ({
                    id: v.id || crypto.randomUUID(),
                    url: v.url,
                    prompt: 'Variação',
                    timestamp: Date.now(),
                    size: '1024x1024',
                    model: 'dall-e-2',
                    style: 'natural',
                }));

                setGeneratedImages((prev) => [...variations, ...prev]);
                return variations;
            } catch (error) {
                handleError(error, {
                    context: 'Image Variations',
                    userMessage: 'Não foi possível gerar variações.',
                });
                throw error;
            } finally {
                setIsGenerating(false);
            }
        },
        [user, handleError]
    );

    /**
     * Carrega histórico de imagens do usuário
     */
    const loadHistory = useCallback(async () => {
        if (!user) return;

        try {
            const response = await fetch(`/api/images/history?userId=${user.id}`, {
                headers: {
                    Authorization: `Bearer ${user.id}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setGeneratedImages(data.images || []);
            }
        } catch (error) {
            console.error('Error loading image history:', error);
        }
    }, [user]);

    /**
     * Deleta uma imagem
     */
    const deleteImage = useCallback(
        async (imageId: string) => {
            setGeneratedImages((prev) => prev.filter((img) => img.id !== imageId));

            try {
                await fetch(`/api/images/${imageId}`, {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${user?.id}`,
                    },
                });
            } catch (error) {
                console.error('Error deleting image:', error);
            }
        },
        [user]
    );

    /**
     * Toggle like em uma imagem
     */
    const toggleLike = useCallback((imageId: string) => {
        setGeneratedImages((prev) =>
            prev.map((img) =>
                img.id === imageId ? { ...img, liked: !img.liked } : img
            )
        );
    }, []);

    return {
        generateImage,
        generateVariations,
        loadHistory,
        deleteImage,
        toggleLike,
        isGenerating,
        currentImage,
        generatedImages,
    };
}
