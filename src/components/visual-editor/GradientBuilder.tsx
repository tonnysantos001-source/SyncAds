/**
 * GradientBuilder - Visual Gradient Generator
 * Gerador visual de gradientes CSS
 */

import React, { useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { IconPlus, IconTrash, IconCopy } from '@tabler/icons-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ColorStop {
    color: string;
    position: number; // 0-100
}

export function GradientBuilder() {
    const [type, setType] = useState<'linear' | 'radial'>('linear');
    const [angle, setAngle] = useState(90);
    const [stops, setStops] = useState<ColorStop[]>([
        { color: '#3b82f6', position: 0 },
        { color: '#8b5cf6', position: 100 },
    ]);
    const [selectedStop, setSelectedStop] = useState(0);

    const gradientCSS = type === 'linear'
        ? `linear-gradient(${angle}deg, ${stops.map(s => `${s.color} ${s.position}%`).join(', ')})`
        : `radial-gradient(circle, ${stops.map(s => `${s.color} ${s.position}%`).join(', ')})`;

    const addStop = () => {
        const newStop: ColorStop = {
            color: '#ffffff',
            position: 50,
        };
        setStops([...stops, newStop].sort((a, b) => a.position - b.position));
    };

    const removeStop = (index: number) => {
        if (stops.length <= 2) {
            toast.error('Mínimo 2 cores');
            return;
        }
        setStops(stops.filter((_, i) => i !== index));
    };

    const updateStop = (index: number, updates: Partial<ColorStop>) => {
        const newStops = stops.map((s, i) =>
            i === index ? { ...s, ...updates } : s
        );
        setStops(newStops.sort((a, b) => a.position - b.position));
    };

    const copyCSS = () => {
        navigator.clipboard.writeText(`background: ${gradientCSS};`);
        toast.success('CSS copiado!');
    };

    // Gradient presets
    const presets = {
        sunset: [
            { color: '#ff6b6b', position: 0 },
            { color: '#feca57', position: 50 },
            { color: '#ee5a6f', position: 100 },
        ],
        ocean: [
            { color: '#667eea', position: 0 },
            { color: '#764ba2', position: 100 },
        ],
        fire: [
            { color: '#f12711', position: 0 },
            { color: '#f5af19', position: 100 },
        ],
        purple: [
            { color: '#667eea', position: 0 },
            { color: '#764ba2', position: 100 },
        ],
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-bold text-white mb-4">Gradient Builder</h3>

                {/* Preview */}
                <div
                    className="h-32 rounded-xl mb-4"
                    style={{ background: gradientCSS }}
                />

                {/* Type */}
                <div className="flex gap-2 mb-4">
                    <button
                        onClick={() => setType('linear')}
                        className={cn(
                            'flex-1 px-4 py-2 rounded-lg font-medium transition',
                            type === 'linear'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white/5 text-gray-400'
                        )}
                    >
                        Linear
                    </button>
                    <button
                        onClick={() => setType('radial')}
                        className={cn(
                            'flex-1 px-4 py-2 rounded-lg font-medium transition',
                            type === 'radial'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white/5 text-gray-400'
                        )}
                    >
                        Radial
                    </button>
                </div>

                {/* Angle (linear only) */}
                {type === 'linear' && (
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Ângulo: {angle}°
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="360"
                            value={angle}
                            onChange={(e) => setAngle(Number(e.target.value))}
                            className="w-full"
                        />
                    </div>
                )}

                {/* Color Stops */}
                <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-400">
                            Cores ({stops.length})
                        </label>
                        <button
                            onClick={addStop}
                            className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                        >
                            <IconPlus className="w-4 h-4 text-white" />
                        </button>
                    </div>

                    {stops.map((stop, index) => (
                        <div key={index} className="space-y-2">
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-10 h-10 rounded-lg border-2 border-white/20 cursor-pointer"
                                    style={{ background: stop.color }}
                                    onClick={() => setSelectedStop(index)}
                                />
                                <div className="flex-1">
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={stop.position}
                                        onChange={(e) => updateStop(index, { position: Number(e.target.value) })}
                                        className="w-full"
                                    />
                                    <div className="text-xs text-gray-400 mt-1">
                                        {stop.position}%
                                    </div>
                                </div>
                                {stops.length > 2 && (
                                    <button
                                        onClick={() => removeStop(index)}
                                        className="p-2 bg-red-600/20 hover:bg-red-600/30 rounded-lg transition"
                                    >
                                        <IconTrash className="w-4 h-4 text-red-400" />
                                    </button>
                                )}
                            </div>

                            {selectedStop === index && (
                                <HexColorPicker
                                    color={stop.color}
                                    onChange={(color) => updateStop(index, { color })}
                                    className="w-full"
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* Presets */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                        Presets
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {Object.entries(presets).map(([name, preset]) => (
                            <button
                                key={name}
                                onClick={() => setStops(preset)}
                                className="h-12 rounded-lg capitalize"
                                style={{
                                    background: `linear-gradient(90deg, ${preset.map(s => `${s.color} ${s.position}%`).join(', ')})`
                                }}
                            >
                                <span className="text-white text-xs font-medium drop-shadow-lg">
                                    {name}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* CSS Output */}
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                        CSS
                    </label>
                    <div className="relative">
                        <pre className="p-3 bg-black/50 rounded-lg text-xs text-gray-300 overflow-x-auto">
                            background: {gradientCSS};
                        </pre>
                        <button
                            onClick={copyCSS}
                            className="absolute top-2 right-2 p-2 bg-white/10 hover:bg-white/20 rounded transition"
                        >
                            <IconCopy className="w-4 h-4 text-white" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
