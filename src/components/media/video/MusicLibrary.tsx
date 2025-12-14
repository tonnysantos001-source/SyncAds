/**
 * Music Library - Free Royalty-Free Music & SFX
 * Integra bibliotecas gratuitas de música e efeitos sonoros
 */

import React, { useState, useEffect } from 'react';
import {
    IconSearch,
    IconPlayerPlay,
    IconPlayerPause,
    IconDownload,
    IconX,
    IconLoader2,
    IconMusic,
    IconWaveSine,
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface MusicLibraryProps {
    onSelectMusic: (musicUrl: string, title: string) => void;
    onClose: () => void;
}

interface MusicTrack {
    id: string;
    title: string;
    artist: string;
    duration: number; // seconds
    url: string;
    genre?: string;
    mood?: string;
    source: 'fma' | 'mixkit' | 'incompetech';
    license: string;
}

export function MusicLibrary({ onSelectMusic, onClose }: MusicLibraryProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSource, setActiveSource] = useState<'fma' | 'mixkit' | 'incompetech'>('mixkit');
    const [tracks, setTracks] = useState<MusicTrack[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [playingTrack, setPlayingTrack] = useState<string | null>(null);
    const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
    const [selectedGenre, setSelectedGenre] = useState<string>('all');

    const genres = ['all', 'cinematic', 'electronic', 'ambient', 'corporate', 'upbeat', 'calm'];
    const moods = ['energetic', 'relaxing', 'inspiring', 'dramatic', 'happy', 'sad'];

    // Mock data for demonstration
    const mockTracks: MusicTrack[] = [
        {
            id: '1',
            title: 'Epic Cinematic Trailer',
            artist: 'Free Music Archive',
            duration: 120,
            url: 'https://example.com/track1.mp3',
            genre: 'cinematic',
            mood: 'dramatic',
            source: 'fma',
            license: 'CC BY',
        },
        {
            id: '2',
            title: 'Upbeat Corporate',
            artist: 'Mixkit',
            duration: 90,
            url: 'https://example.com/track2.mp3',
            genre: 'corporate',
            mood: 'energetic',
            source: 'mixkit',
            license: 'Free for commercial use',
        },
        {
            id: '3',
            title: 'Ambient Background',
            artist: 'Kevin MacLeod',
            duration: 180,
            url: 'https://example.com/track3.mp3',
            genre: 'ambient',
            mood: 'relaxing',
            source: 'incompetech',
            license: 'CC BY 3.0',
        },
        {
            id: '4',
            title: 'Electronic Dance',
            artist: 'Free Music Archive',
            duration: 150,
            url: 'https://example.com/track4.mp3',
            genre: 'electronic',
            mood: 'energetic',
            source: 'fma',
            license: 'CC BY',
        },
        {
            id: '5',
            title: 'Calm Piano',
            artist: 'Mixkit',
            duration: 200,
            url: 'https://example.com/track5.mp3',
            genre: 'calm',
            mood: 'relaxing',
            source: 'mixkit',
            license: 'Free for commercial use',
        },
    ];

    // Load tracks on mount
    useEffect(() => {
        setTracks(mockTracks);
    }, []);

    // Play/Pause track
    const togglePlay = (track: MusicTrack) => {
        if (playingTrack === track.id) {
            audioElement?.pause();
            setPlayingTrack(null);
        } else {
            if (audioElement) {
                audioElement.pause();
            }

            const audio = new Audio(track.url);
            audio.play();
            audio.addEventListener('ended', () => {
                setPlayingTrack(null);
            });

            setAudioElement(audio);
            setPlayingTrack(track.id);
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

    // Filter tracks
    const filteredTracks = tracks.filter(track => {
        const matchesSearch = track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            track.artist.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesGenre = selectedGenre === 'all' || track.genre === selectedGenre;
        const matchesSource = track.source === activeSource;

        return matchesSearch && matchesGenre && matchesSource;
    });

    // Format duration
    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <div className="flex-1 max-w-2xl">
                    <h2 className="text-xl font-bold text-white mb-3">Biblioteca de Música Gratuita</h2>

                    {/* Search Bar */}
                    <div className="flex gap-2 mb-3">
                        <div className="flex-1 relative">
                            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar música... (ex: 'cinematic', 'upbeat', 'background')"
                                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Source Tabs */}
                    <div className="flex gap-2 mb-3">
                        <button
                            onClick={() => setActiveSource('mixkit')}
                            className={cn(
                                'px-4 py-2 rounded-lg text-sm font-medium transition',
                                activeSource === 'mixkit'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                            )}
                        >
                            Mixkit (Grátis)
                        </button>
                        <button
                            onClick={() => setActiveSource('fma')}
                            className={cn(
                                'px-4 py-2 rounded-lg text-sm font-medium transition',
                                activeSource === 'fma'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                            )}
                        >
                            Free Music Archive
                        </button>
                        <button
                            onClick={() => setActiveSource('incompetech')}
                            className={cn(
                                'px-4 py-2 rounded-lg text-sm font-medium transition',
                                activeSource === 'incompetech'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                            )}
                        >
                            Incompetech (Kevin MacLeod)
                        </button>
                    </div>

                    {/* Genre Filter */}
                    <div className="flex gap-2">
                        {genres.map((genre) => (
                            <button
                                key={genre}
                                onClick={() => setSelectedGenre(genre)}
                                className={cn(
                                    'px-3 py-1.5 rounded-lg text-xs font-medium transition capitalize',
                                    selectedGenre === genre
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                )}
                            >
                                {genre}
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

            {/* Track List */}
            <div className="flex-1 overflow-y-auto p-6">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <IconLoader2 className="w-12 h-12 text-blue-500 animate-spin" />
                    </div>
                ) : filteredTracks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full">
                        <IconMusic className="w-20 h-20 text-gray-600 mb-4" />
                        <p className="text-xl text-gray-400">Nenhuma música encontrada</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredTracks.map((track) => (
                            <div
                                key={track.id}
                                className="group flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-lg transition"
                            >
                                {/* Play Button */}
                                <button
                                    onClick={() => togglePlay(track)}
                                    className="w-12 h-12 flex items-center justify-center bg-blue-600 hover:bg-blue-700 rounded-full transition"
                                >
                                    {playingTrack === track.id ? (
                                        <IconPlayerPause className="w-6 h-6 text-white" />
                                    ) : (
                                        <IconPlayerPlay className="w-6 h-6 text-white" />
                                    )}
                                </button>

                                {/* Track Info */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-semibold text-white">{track.title}</h3>
                                        {track.genre && (
                                            <span className="px-2 py-0.5 bg-purple-600/30 text-purple-300 text-xs rounded capitalize">
                                                {track.genre}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-400">
                                        {track.artist} • {formatDuration(track.duration)} • {track.license}
                                    </p>
                                </div>

                                {/* Waveform Placeholder */}
                                <div className="w-32 h-12 flex items-center justify-center opacity-50">
                                    <IconWaveSine className="w-full h-full text-blue-500" />
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                                    <button
                                        onClick={() => {
                                            onSelectMusic(track.url, track.title);
                                            toast.success(`${track.title} adicionado ao vídeo!`);
                                        }}
                                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition"
                                    >
                                        Usar
                                    </button>
                                    <button
                                        onClick={() => {
                                            // Download track
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
                💡 Todas as músicas são livres de royalties para uso comercial
            </div>
        </div>
    );
}

