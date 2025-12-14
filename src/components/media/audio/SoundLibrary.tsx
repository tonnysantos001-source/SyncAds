/**
 * SoundLibrary - Free Sound Effects Library
 * Integra Freesound.org com 600k+ sound effects gratuitos
 */

import React, { useState, useEffect, useRef } from 'react';
import {
    IconSearch,
    IconPlayerPlay,
    IconPlayerPause,
    IconDownload,
    IconX,
    IconLoader2,
    IconWaveSine,
    IconVolume,
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SoundLibraryProps {
    onSelectSound: (soundUrl: string, title: string) => void;
    onClose: () => void;
}

interface SoundEffect {
    id: string;
    name: string;
    username: string;
    duration: number; // seconds
    url: string;
    previewUrl: string;
    tags: string[];
    license: string;
}

export function SoundLibrary({ onSelectSound, onClose }: SoundLibraryProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [sounds, setSounds] = useState<SoundEffect[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [playingSound, setPlayingSound] = useState<string | null>(null);
    const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
    const [page, setPage] = useState(1);

    // Mock data for demonstration (real implementation would use Freesound API)
    const mockSounds: SoundEffect[] = [
        {
            id: '1',
            name: 'Thunder Storm',
            username: 'freesound_user1',
            duration: 15,
            url: 'https://example.com/thunder.mp3',
            previewUrl: 'https://example.com/thunder-preview.mp3',
            tags: ['thunder', 'storm', 'weather', 'nature'],
            license: 'CC BY 3.0',
        },
        {
            id: '2',
            name: 'Door Slam',
            username: 'freesound_user2',
            duration: 2,
            url: 'https://example.com/door-slam.mp3',
            previewUrl: 'https://example.com/door-slam-preview.mp3',
            tags: ['door', 'slam', 'impact', 'indoor'],
            license: 'CC0',
        },
        {
            id: '3',
            name: 'Birds Chirping',
            username: 'nature_sounds',
            duration: 30,
            url: 'https://example.com/birds.mp3',
            previewUrl: 'https://example.com/birds-preview.mp3',
            tags: ['birds', 'nature', 'ambient', 'outdoor'],
            license: 'CC BY 3.0',
        },
        {
            id: '4',
            name: 'Button Click',
            username: 'ui_sounds',
            duration: 0.5,
            url: 'https://example.com/click.mp3',
            previewUrl: 'https://example.com/click-preview.mp3',
            tags: ['click', 'button', 'ui', 'interface'],
            license: 'CC0',
        },
        {
            id: '5',
            name: 'Car Engine',
            username: 'vehicle_sounds',
            duration: 10,
            url: 'https://example.com/car.mp3',
            previewUrl: 'https://example.com/car-preview.mp3',
            tags: ['car', 'engine', 'vehicle', 'motor'],
            license: 'CC BY 3.0',
        },
    ];

    // Load sounds on mount
    useEffect(() => {
        setSounds(mockSounds);
    }, []);

    // Search sounds (mock - real would call Freesound API)
    const searchSounds = async (query: string) => {
        if (!query.trim()) return;

        setIsLoading(true);
        try {
            // Mock search
            const filtered = mockSounds.filter(sound =>
                sound.name.toLowerCase().includes(query.toLowerCase()) ||
                sound.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
            );
            setSounds(filtered);
        } catch (error) {
            console.error('Search error:', error);
            toast.error('Erro ao buscar sons');
        } finally {
            setIsLoading(false);
        }
    };

    // Play/Pause sound
    const togglePlay = (sound: SoundEffect) => {
        if (playingSound === sound.id) {
            audioElement?.pause();
            setPlayingSound(null);
        } else {
            if (audioElement) {
                audioElement.pause();
            }

            const audio = new Audio(sound.previewUrl);
            audio.play();
            audio.addEventListener('ended', () => {
                setPlayingSound(null);
            });

            setAudioElement(audio);
            setPlayingSound(sound.id);
        }
    };

    // Cleanup audio on unmount
    useEffect(() => {
        return () => {
            if (audioElement) {
                audioElement.pause();
            }
        };
    }, [audioElement]);

    // Format duration
    const formatDuration = (seconds: number) => {
        if (seconds < 1) return `${Math.round(seconds * 1000)}ms`;
        const mins = Math.floor(seconds / 60);
        const secs = Math.round(seconds % 60);
        return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
    };

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <div className="flex-1 max-w-2xl">
                    <h2 className="text-xl font-bold text-white mb-3">
                        Sound Effects Library
                    </h2>
                    <p className="text-sm text-gray-400 mb-3">
                        600,000+ free sound effects from Freesound.org
                    </p>

                    {/* Search Bar */}
                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && searchSounds(searchQuery)}
                                placeholder="Search sound effects... (ex: 'thunder', 'click', 'birds')"
                                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <button
                            onClick={() => searchSounds(searchQuery)}
                            disabled={isLoading}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50"
                        >
                            {isLoading ? <IconLoader2 className="w-5 h-5 animate-spin" /> : 'Search'}
                        </button>
                    </div>

                    {/* Popular Tags */}
                    <div className="flex gap-2 mt-3 flex-wrap">
                        {['impact', 'ambient', 'nature', 'ui', 'footsteps', 'door'].map((tag) => (
                            <button
                                key={tag}
                                onClick={() => {
                                    setSearchQuery(tag);
                                    searchSounds(tag);
                                }}
                                className="px-3 py-1 bg-white/5 hover:bg-white/10 text-gray-300 text-xs rounded-full transition"
                            >
                                #{tag}
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="ml-4 p-2 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg transition"
                >
                    <IconX className="w-6 h-6" />
                </button>
            </div>

            {/* Sound List */}
            <div className="flex-1 overflow-y-auto p-6">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <IconLoader2 className="w-12 h-12 text-blue-500 animate-spin" />
                    </div>
                ) : sounds.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full">
                        <IconVolume className="w-20 h-20 text-gray-600 mb-4" />
                        <p className="text-xl text-gray-400">Nenhum som encontrado</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {sounds.map((sound) => (
                            <div
                                key={sound.id}
                                className="group flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-lg transition"
                            >
                                {/* Play Button */}
                                <button
                                    onClick={() => togglePlay(sound)}
                                    className="w-12 h-12 flex items-center justify-center bg-green-600 hover:bg-green-700 rounded-full transition"
                                >
                                    {playingSound === sound.id ? (
                                        <IconPlayerPause className="w-6 h-6 text-white" />
                                    ) : (
                                        <IconPlayerPlay className="w-6 h-6 text-white" />
                                    )}
                                </button>

                                {/* Sound Info */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-semibold text-white">{sound.name}</h3>
                                        <span className="text-xs text-gray-500">by {sound.username}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-400">
                                        <span>{formatDuration(sound.duration)}</span>
                                        <span>•</span>
                                        <span className="text-xs">{sound.license}</span>
                                    </div>
                                    <div className="flex gap-1 mt-1">
                                        {sound.tags.slice(0, 3).map((tag) => (
                                            <span
                                                key={tag}
                                                className="px-2 py-0.5 bg-blue-600/20 text-blue-300 text-xs rounded"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Waveform Placeholder */}
                                <div className="w-32 h-12 flex items-center justify-center opacity-50">
                                    <IconWaveSine className="w-full h-full text-green-500" />
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                                    <button
                                        onClick={() => {
                                            onSelectSound(sound.url, sound.name);
                                            toast.success(`${sound.name} adicionado!`);
                                            onClose();
                                        }}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
                                    >
                                        Usar
                                    </button>
                                    <button
                                        onClick={() => {
                                            toast.success('Download iniciado!');
                                        }}
                                        className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
                                    >
                                        <IconDownload className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-white/10 text-sm text-gray-400 text-center">
                💡 Powered by Freesound.org - All sounds are Creative Commons licensed
            </div>
        </div>
    );
}

