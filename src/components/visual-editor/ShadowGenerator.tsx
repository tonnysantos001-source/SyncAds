/**
 * ShadowGenerator - Visual Box Shadow Generator
 * Gerador visual de sombras CSS
 */

import React, { useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { IconCopy } from '@tabler/icons-react';
import { toast } from 'sonner';

export function ShadowGenerator() {
    const [horizontal, setHorizontal] = useState(0);
    const [vertical, setVertical] = useState(10);
    const [blur, setBlur] = useState(20);
    const [spread, setSpread] = useState(0);
    const [color, setColor] = useState('#000000');
    const [opacity, setOpacity] = useState(0.3);
    const [inset, setInset] = useState(false);

    const hexToRgba = (hex: string, alpha: number) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    const shadowCSS = `${inset ? 'inset ' : ''}${horizontal}px ${vertical}px ${blur}px ${spread}px ${hexToRgba(color, opacity)}`;

    const copyCSS = () => {
        navigator.clipboard.writeText(`box-shadow: ${shadowCSS};`);
        toast.success('CSS copiado!');
    };

    // Shadow presets
    const presets = [
        { name: 'Soft', h: 0, v: 4, b: 6, s: -1, o: 0.1 },
        { name: 'Medium', h: 0, v: 10, b: 20, s: 0, o: 0.15 },
        { name: 'Hard', h: 0, v: 20, b: 25, s: 5, o: 0.25 },
        { name: 'Glow', h: 0, v: 0, b: 20, s: 5, o: 0.5 },
    ];

    const applyPreset = (preset: typeof presets[0]) => {
        setHorizontal(preset.h);
        setVertical(preset.v);
        setBlur(preset.b);
        setSpread(preset.s);
        setOpacity(preset.o);
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-bold text-white mb-4">Shadow Generator</h3>

                {/* Preview */}
                <div className="h-48 bg-gray-800 rounded-xl p-8 mb-6 flex items-center justify-center">
                    <div
                        className="w-32 h-32 bg-blue-600 rounded-xl"
                        style={{ boxShadow: shadowCSS }}
                    />
                </div>

                {/* Controls */}
                <div className="space-y-4 mb-6">
                    {/* Horizontal */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Horizontal: {horizontal}px
                        </label>
                        <input
                            type="range"
                            min="-50"
                            max="50"
                            value={horizontal}
                            onChange={(e) => setHorizontal(Number(e.target.value))}
                            className="w-full"
                        />
                    </div>

                    {/* Vertical */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Vertical: {vertical}px
                        </label>
                        <input
                            type="range"
                            min="-50"
                            max="50"
                            value={vertical}
                            onChange={(e) => setVertical(Number(e.target.value))}
                            className="w-full"
                        />
                    </div>

                    {/* Blur */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Blur: {blur}px
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={blur}
                            onChange={(e) => setBlur(Number(e.target.value))}
                            className="w-full"
                        />
                    </div>

                    {/* Spread */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Spread: {spread}px
                        </label>
                        <input
                            type="range"
                            min="-50"
                            max="50"
                            value={spread}
                            onChange={(e) => setSpread(Number(e.target.value))}
                            className="w-full"
                        />
                    </div>

                    {/* Opacity */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Opacity: {(opacity * 100).toFixed(0)}%
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={opacity}
                            onChange={(e) => setOpacity(Number(e.target.value))}
                            className="w-full"
                        />
                    </div>

                    {/* Inset */}
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="inset"
                            checked={inset}
                            onChange={(e) => setInset(e.target.checked)}
                            className="w-4 h-4"
                        />
                        <label htmlFor="inset" className="text-sm font-medium text-gray-400">
                            Inset (sombra interna)
                        </label>
                    </div>
                </div>

                {/* Color Picker */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                        Cor da Sombra
                    </label>
                    <HexColorPicker
                        color={color}
                        onChange={setColor}
                        className="w-full"
                    />
                </div>

                {/* Presets */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                        Presets
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {presets.map((preset) => (
                            <button
                                key={preset.name}
                                onClick={() => applyPreset(preset)}
                                className="px-4 py-3 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium text-gray-300 transition"
                            >
                                {preset.name}
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
                            box-shadow: {shadowCSS};
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
