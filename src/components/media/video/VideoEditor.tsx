/**
 * VideoEditor - Simplified Video Editor
 * Editor básico de vídeo com timeline, trim, text overlays e music
 * (Versão simplificada - Remotion completo seria implementado depois)
 */

import React, { useState, useRef, useEffect } from 'react';
import {
    IconPlayerPlay,
    IconPlayerPause,
    IconScissors,
    IconText,
    IconMusic,
    IconX,
    IconDownload,
    IconVolume,
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface VideoEditorProps {
    videoUrl: string;
    onSave: (editedVideoUrl: string) => void;
    onClose: () => void;
}

export function VideoEditor({ videoUrl, onSave, onClose }: VideoEditorProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [trimStart, setTrimStart] = useState(0);
    const [trimEnd, setTrimEnd] = useState(0);
    const [textOverlays, setTextOverlays] = useState<Array<{ text: string; time: number }>>([]);
    const [newOverlayText, setNewOverlayText] = useState('');

    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.addEventListener('loadedmetadata', () => {
                const dur = videoRef.current!.duration;
                setDuration(dur);
                setTrimEnd(dur);
            });

            videoRef.current.addEventListener('timeupdate', () => {
                setCurrentTime(videoRef.current!.currentTime);
            });
        }
    }, []);

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleSeek = (time: number) => {
        if (videoRef.current) {
            videoRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const handleVolumeChange = (newVolume: number) => {
        if (videoRef.current) {
            videoRef.current.volume = newVolume;
            setVolume(newVolume);
        }
    };

    const addTextOverlay = () => {
        if (newOverlayText.trim()) {
            setTextOverlays([...textOverlays, { text: newOverlayText, time: currentTime }]);
            setNewOverlayText('');
            toast.success('Text overlay adicionado!');
        }
    };

    const handleExport = () => {
        // Simplified export - in real implementation would use FFmpeg or server-side processing
        toast.success('Vídeo processado! (Simulado)');
        onSave(videoUrl); // In real app, would return edited video URL
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <h2 className="text-xl font-bold text-white">Editor de Vídeo</h2>

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
            <div className="flex-1 flex flex-col p-6 gap-6">
                {/* Video Preview */}
                <div className="flex-1 flex items-center justify-center bg-black rounded-xl overflow-hidden">
                    <video
                        ref={videoRef}
                        src={videoUrl}
                        className="max-w-full max-h-full"
                        onClick={togglePlay}
                    />
                </div>

                {/* Timeline */}
                <div className="bg-gray-900 rounded-xl p-4">
                    {/* Playback Controls */}
                    <div className="flex items-center gap-4 mb-4">
                        <button
                            onClick={togglePlay}
                            className="w-12 h-12 flex items-center justify-center bg-blue-600 hover:bg-blue-700 rounded-full transition"
                        >
                            {isPlaying ? (
                                <IconPlayerPause className="w-6 h-6 text-white" />
                            ) : (
                                <IconPlayerPlay className="w-6 h-6 text-white" />
                            )}
                        </button>

                        <div className="flex-1">
                            <input
                                type="range"
                                min="0"
                                max={duration || 100}
                                value={currentTime}
                                onChange={(e) => handleSeek(Number(e.target.value))}
                                className="w-full"
                            />
                            <div className="flex justify-between text-xs text-gray-400 mt-1">
                                <span>{formatTime(currentTime)}</span>
                                <span>{formatTime(duration)}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <IconVolume className="w-5 h-5 text-gray-400" />
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={volume}
                                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                                className="w-24"
                            />
                        </div>
                    </div>

                    {/* Trim Controls */}
                    <div className="space-y-3 border-t border-white/10 pt-4">
                        <label className="text-sm font-medium text-gray-300">
                            <IconScissors className="w-4 h-4 inline mr-2" />
                            Trim Vídeo
                        </label>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="text-xs text-gray-400 block mb-1">Início</label>
                                <input
                                    type="range"
                                    min="0"
                                    max={duration}
                                    value={trimStart}
                                    onChange={(e) => setTrimStart(Number(e.target.value))}
                                    className="w-full"
                                />
                                <span className="text-xs text-gray-400">{formatTime(trimStart)}</span>
                            </div>
                            <div className="flex-1">
                                <label className="text-xs text-gray-400 block mb-1">Fim</label>
                                <input
                                    type="range"
                                    min="0"
                                    max={duration}
                                    value={trimEnd}
                                    onChange={(e) => setTrimEnd(Number(e.target.value))}
                                    className="w-full"
                                />
                                <span className="text-xs text-gray-400">{formatTime(trimEnd)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Text Overlay */}
                    <div className="space-y-3 border-t border-white/10 pt-4 mt-4">
                        <label className="text-sm font-medium text-gray-300">
                            <IconText className="w-4 h-4 inline mr-2" />
                            Text Overlay ({textOverlays.length})
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newOverlayText}
                                onChange={(e) => setNewOverlayText(e.target.value)}
                                placeholder="Digite o texto..."
                                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                onClick={addTextOverlay}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
                            >
                                Adicionar no {formatTime(currentTime)}
                            </button>
                        </div>

                        {textOverlays.length > 0 && (
                            <div className="space-y-1 mt-2">
                                {textOverlays.map((overlay, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center justify-between p-2 bg-white/5 rounded text-sm"
                                    >
                                        <span className="text-white">{overlay.text}</span>
                                        <span className="text-gray-400">{formatTime(overlay.time)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Info */}
            <div className="px-6 py-3 border-t border-white/10 text-sm text-gray-400 text-center">
                💡 Editor simplificado - Trim, text overlays e volume. Processamento completo em breve.
            </div>
        </div>
    );
}
