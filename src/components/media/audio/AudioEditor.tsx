/**
 * AudioEditor - Waveform Audio Editor with Wavesurfer.js
 * Editor profissional de áudio com visualização de waveform
 */

import React, { useRef, useEffect, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import {
    IconPlayerPlay,
    IconPlayerPause,
    IconScissors,
    IconVolume,
    IconZoomIn,
    IconZoomOut,
    IconX,
    IconDownload,
    IconWaveSine,
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AudioEditorProps {
    audioUrl: string;
    onSave: (editedAudioUrl: string) => void;
    onClose: () => void;
}

export function AudioEditor({ audioUrl, onSave, onClose }: AudioEditorProps) {
    const [wavesurfer, setWavesurfer] = useState<WaveSurfer | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [zoom, setZoom] = useState(50);
    const [trimStart, setTrimStart] = useState(0);
    const [trimEnd, setTrimEnd] = useState(0);

    const waveformRef = useRef<HTMLDivElement>(null);

    // Initialize Wavesurfer
    useEffect(() => {
        if (!waveformRef.current) return;

        const ws = WaveSurfer.create({
            container: waveformRef.current,
            waveColor: '#4f46e5',
            progressColor: '#8b5cf6',
            cursorColor: '#ffffff',
            barWidth: 2,
            barRadius: 3,
            cursorWidth: 2,
            height: 200,
            barGap: 3,
        });

        ws.load(audioUrl);

        ws.on('ready', () => {
            const dur = ws.getDuration();
            setDuration(dur);
            setTrimEnd(dur);
        });

        ws.on('audioprocess', () => {
            setCurrentTime(ws.getCurrentTime());
        });

        ws.on('finish', () => {
            setIsPlaying(false);
        });

        setWavesurfer(ws);

        return () => {
            ws.destroy();
        };
    }, [audioUrl]);

    // Toggle play/pause
    const togglePlay = () => {
        if (wavesurfer) {
            wavesurfer.playPause();
            setIsPlaying(!isPlaying);
        }
    };

    // Handle volume change
    const handleVolumeChange = (newVolume: number) => {
        if (wavesurfer) {
            wavesurfer.setVolume(newVolume);
            setVolume(newVolume);
        }
    };

    // Handle zoom
    const handleZoom = (newZoom: number) => {
        if (wavesurfer) {
            wavesurfer.zoom(newZoom);
            setZoom(newZoom);
        }
    };

    // Apply fade in
    const applyFadeIn = () => {
        toast.info('Fade in aplicado (funcionalidade de processamento completo em breve)');
    };

    // Apply fade out
    const applyFadeOut = () => {
        toast.info('Fade out aplicado (funcionalidade de processamento completo em breve)');
    };

    // Normalize audio
    const normalizeAudio = () => {
        toast.info('Normalização aplicada (funcionalidade de processamento completo em breve)');
    };

    // Export audio
    const handleExport = () => {
        toast.success('Áudio processado! (Simulado)');
        onSave(audioUrl); // In real app, would return edited audio URL
    };

    // Format time
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 100);
        return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <h2 className="text-xl font-bold text-white">Editor de Áudio</h2>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExport}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition flex items-center gap-2"
                    >
                        <IconDownload className="w-5 h-5" />
                        Exportar
                    </button>

                    <button
                        onClick={onClose}
                        className="p-2 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg transition"
                    >
                        <IconX className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Main Editor Area */}
            <div className="flex-1 flex flex-col p-6 gap-6 overflow-y-auto">
                {/* Waveform */}
                <div className="bg-gray-900 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <IconWaveSine className="w-6 h-6 text-purple-400" />
                            <h3 className="text-lg font-bold text-white">Waveform</h3>
                        </div>
                        <div className="text-sm text-gray-400">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </div>
                    </div>

                    <div ref={waveformRef} className="w-full" />
                </div>

                {/* Controls */}
                <div className="grid grid-cols-2 gap-6">
                    {/* Playback Controls */}
                    <div className="bg-gray-900 rounded-xl p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Controles</h3>

                        <div className="space-y-4">
                            {/* Play/Pause */}
                            <div className="flex items-center justify-center">
                                <button
                                    onClick={togglePlay}
                                    className="w-16 h-16 flex items-center justify-center bg-purple-600 hover:bg-purple-700 rounded-full transition"
                                >
                                    {isPlaying ? (
                                        <IconPlayerPause className="w-8 h-8 text-white" />
                                    ) : (
                                        <IconPlayerPlay className="w-8 h-8 text-white" />
                                    )}
                                </button>
                            </div>

                            {/* Volume */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                        <IconVolume className="w-4 h-4" />
                                        Volume
                                    </label>
                                    <span className="text-sm text-gray-400">{Math.round(volume * 100)}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={volume}
                                    onChange={(e) => handleVolumeChange(Number(e.target.value))}
                                    className="w-full"
                                />
                            </div>

                            {/* Zoom */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                        <IconZoomIn className="w-4 h-4" />
                                        Zoom
                                    </label>
                                    <span className="text-sm text-gray-400">{zoom}px</span>
                                </div>
                                <input
                                    type="range"
                                    min="10"
                                    max="200"
                                    value={zoom}
                                    onChange={(e) => handleZoom(Number(e.target.value))}
                                    className="w-full"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Effects */}
                    <div className="bg-gray-900 rounded-xl p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Efeitos</h3>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={applyFadeIn}
                                className="px-4 py-3 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-sm font-medium transition"
                            >
                                Fade In
                            </button>

                            <button
                                onClick={applyFadeOut}
                                className="px-4 py-3 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-sm font-medium transition"
                            >
                                Fade Out
                            </button>

                            <button
                                onClick={normalizeAudio}
                                className="px-4 py-3 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-sm font-medium transition col-span-2"
                            >
                                Normalizar Volume
                            </button>

                            <button
                                className="px-4 py-3 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-sm font-medium transition"
                            >
                                Reverb
                            </button>

                            <button
                                className="px-4 py-3 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-sm font-medium transition"
                            >
                                Echo
                            </button>

                            <button
                                className="px-4 py-3 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-sm font-medium transition"
                            >
                                EQ
                            </button>

                            <button
                                className="px-4 py-3 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-sm font-medium transition"
                            >
                                Noise Reduction
                            </button>
                        </div>
                    </div>
                </div>

                {/* Trim Controls */}
                <div className="bg-gray-900 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <IconScissors className="w-5 h-5" />
                        Trim Áudio
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm text-gray-400 block mb-2">Início</label>
                            <input
                                type="range"
                                min="0"
                                max={duration}
                                step="0.01"
                                value={trimStart}
                                onChange={(e) => setTrimStart(Number(e.target.value))}
                                className="w-full mb-1"
                            />
                            <span className="text-sm text-gray-400">{formatTime(trimStart)}</span>
                        </div>

                        <div>
                            <label className="text-sm text-gray-400 block mb-2">Fim</label>
                            <input
                                type="range"
                                min="0"
                                max={duration}
                                step="0.01"
                                value={trimEnd}
                                onChange={(e) => setTrimEnd(Number(e.target.value))}
                                className="w-full mb-1"
                            />
                            <span className="text-sm text-gray-400">{formatTime(trimEnd)}</span>
                        </div>
                    </div>

                    <div className="mt-4 text-sm text-gray-400">
                        Duração final: {formatTime(trimEnd - trimStart)}
                    </div>
                </div>
            </div>

            {/* Bottom Info */}
            <div className="px-6 py-3 border-t border-white/10 text-sm text-gray-400 text-center">
                💡 Editor profissional com Wavesurfer.js - Processamento completo de efeitos em breve
            </div>
        </div>
    );
}

