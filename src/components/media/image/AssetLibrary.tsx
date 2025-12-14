/**
 * AssetLibrary - Free Stock Photos Integration
 * Integra Unsplash, Pexels e Pixabay para acesso a milhões de imagens gratuitas
 */

import React, { useState, useEffect } from 'react';
import { IconSearch, IconDownload, IconX, IconLoader2 } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AssetLibraryProps {
    onSelectImage: (imageUrl: string) => void;
    onClose: () => void;
}

interface ImageResult {
    id: string;
    url: string;
    thumbnail: string;
    photographer: string;
    source: 'unsplash' | 'pexels' | 'pixabay';
    downloadUrl: string;
}

export function AssetLibrary({ onSelectImage, onClose }: AssetLibraryProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSource, setActiveSource] = useState<'unsplash' | 'pexels' | 'pixabay'>('unsplash');
    const [images, setImages] = useState<ImageResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [page, setPage] = useState(1);

    // Search images
    const searchImages = async (query: string, source: string, pageNum: number = 1) => {
        if (!query.trim()) return;

        setIsLoading(true);
        try {
            let results: ImageResult[] = [];

            switch (source) {
                case 'unsplash':
                    results = await searchUnsplash(query, pageNum);
                    break;
                case 'pexels':
                    results = await searchPexels(query, pageNum);
                    break;
                case 'pixabay':
                    results = await searchPixabay(query, pageNum);
                    break;
            }

            if (pageNum === 1) {
                setImages(results);
            } else {
                setImages((prev) => [...prev, ...results]);
            }
        } catch (error) {
            console.error('Search error:', error);
            toast.error('Erro ao buscar imagens');
        } finally {
            setIsLoading(false);
        }
    };

    // Unsplash API
    const searchUnsplash = async (query: string, page: number): Promise<ImageResult[]> => {
        const UNSPLASH_ACCESS_KEY = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;

        if (!UNSPLASH_ACCESS_KEY) {
            toast.error('Unsplash API key não configurada');
            return [];
        }

        const response = await fetch(
            `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=30`,
            {
                headers: {
                    Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
                },
            }
        );

        const data = await response.json();

        return data.results.map((photo: any) => ({
            id: photo.id,
            url: photo.urls.regular,
            thumbnail: photo.urls.small,
            photographer: photo.user.name,
            source: 'unsplash' as const,
            downloadUrl: photo.links.download,
        }));
    };

    // Pexels API
    const searchPexels = async (query: string, page: number): Promise<ImageResult[]> => {
        const PEXELS_API_KEY = process.env.NEXT_PUBLIC_PEXELS_API_KEY;

        if (!PEXELS_API_KEY) {
            toast.error('Pexels API key não configurada');
            return [];
        }

        const response = await fetch(
            `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&page=${page}&per_page=30`,
            {
                headers: {
                    Authorization: PEXELS_API_KEY,
                },
            }
        );

        const data = await response.json();

        return data.photos.map((photo: any) => ({
            id: String(photo.id),
            url: photo.src.large,
            thumbnail: photo.src.medium,
            photographer: photo.photographer,
            source: 'pexels' as const,
            downloadUrl: photo.src.original,
        }));
    };

    // Pixabay API  
    const searchPixabay = async (query: string, page: number): Promise<ImageResult[]> => {
        const PIXABAY_API_KEY = process.env.NEXT_PUBLIC_PIXABAY_API_KEY;

        if (!PIXABAY_API_KEY) {
            toast.error('Pixabay API key não configurada');
            return [];
        }

        const response = await fetch(
            `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(query)}&image_type=photo&page=${page}&per_page=30`
        );

        const data = await response.json();

        return data.hits.map((hit: any) => ({
            id: String(hit.id),
            url: hit.largeImageURL,
            thumbnail: hit.webformatURL,
            photographer: hit.user,
            source: 'pixabay' as const,
            downloadUrl: hit.largeImageURL,
        }));
    };

    // Handle search submit
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        searchImages(searchQuery, activeSource, 1);
    };

    // Load more
    const loadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        searchImages(searchQuery, activeSource, nextPage);
    };

    // Popular searches on mount
    useEffect(() => {
        searchImages('nature', activeSource, 1);
    }, [activeSource]);

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <div className="flex-1 max-w-2xl">
                    <h2 className="text-xl font-bold text-white mb-3">Biblioteca de Imagens Gratuitas</h2>

                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="flex-1 relative">
                            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar imagens... (ex: 'landscape', 'business', 'technology')"
                                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50"
                        >
                            {isLoading ? <IconLoader2 className="w-5 h-5 animate-spin" /> : 'Buscar'}
                        </button>
                    </form>

                    {/* Source Tabs */}
                    <div className="flex gap-2 mt-3">
                        <button
                            onClick={() => setActiveSource('unsplash')}
                            className={cn(
                                'px-4 py-2 rounded-lg text-sm font-medium transition',
                                activeSource === 'unsplash'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                            )}
                        >
                            Unsplash (5M+ fotos)
                        </button>
                        <button
                            onClick={() => setActiveSource('pexels')}
                            className={cn(
                                'px-4 py-2 rounded-lg text-sm font-medium transition',
                                activeSource === 'pexels'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                            )}
                        >
                            Pexels (10M+ fotos)
                        </button>
                        <button
                            onClick={() => setActiveSource('pixabay')}
                            className={cn(
                                'px-4 py-2 rounded-lg text-sm font-medium transition',
                                activeSource === 'pixabay'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                            )}
                        >
                            Pixabay (4.5M+ imagens)
                        </button>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="ml-4 p-2 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg transition"
                >
                    <IconX className="w-6 h-6" />
                </button>
            </div>

            {/* Image Grid */}
            <div className="flex-1 overflow-y-auto p-6">
                {isLoading && images.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <IconLoader2 className="w-12 h-12 text-blue-500 animate-spin" />
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-4 gap-4">
                            {images.map((image) => (
                                <button
                                    key={image.id}
                                    onClick={() => {
                                        onSelectImage(image.url);
                                        toast.success('Imagem selecionada!');
                                        onClose();
                                    }}
                                    className="group relative aspect-square rounded-lg overflow-hidden bg-white/5 hover:ring-2 hover:ring-blue-500 transition"
                                >
                                    <img
                                        src={image.thumbnail}
                                        alt={`Photo by ${image.photographer}`}
                                        className="w-full h-full object-cover"
                                    />

                                    {/* Overlay */}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center p-4">
                                        <IconDownload className="w-8 h-8 text-white mb-2" />
                                        <p className="text-sm text-white text-center font-medium">
                                            {image.photographer}
                                        </p>
                                        <p className="text-xs text-gray-300 capitalize mt-1">
                                            {image.source}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Load More */}
                        {images.length > 0 && (
                            <div className="flex justify-center mt-8">
                                <button
                                    onClick={loadMore}
                                    disabled={isLoading}
                                    className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition disabled:opacity-50"
                                >
                                    {isLoading ? 'Carregando...' : 'Carregar Mais'}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-white/10 text-sm text-gray-400 text-center">
                💡 Milhões de imagens HD gratuitas. Clique em uma imagem para usar no seu projeto.
            </div>
        </div>
    );
}

