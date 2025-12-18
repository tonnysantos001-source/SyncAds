/**
 * DesignTools Component - Sidebar with Design Utilities
 * 
 * Ferramentas de design visuais:
 * - Colors: Color picker e paletas
 * - Typography: Escalas de texto
 * - Spacing: Sistema de espaçamento
 * - Gradients: Gradient builder
 * - Shadows: Shadow generator
 * - Animations: Animation timeline
 */

import { useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { cn } from '@/lib/utils';
import { GradientBuilder } from './GradientBuilder';
import { ShadowGenerator } from './ShadowGenerator';
import { AnimationTimeline } from './AnimationTimeline';
import {
    IconPalette,
    IconTypography,
    IconRuler,
    IconCopy,
    IconCheck,
} from '@tabler/icons-react';

type DesignTab = 'colors' | 'typography' | 'spacing' | 'gradients' | 'shadows' | 'animations';

export function DesignTools() {
    const [activeTab, setActiveTab] = useState<DesignTab>('colors');
    const [selectedColor, setSelectedColor] = useState('#3b82f6');
    const [copiedColor, setCopiedColor] = useState<string | null>(null);

    // Color utilities
    const adjustBrightness = (hex: string, percent: number) => {
        const num = parseInt(hex.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const B = ((num >> 8) & 0x00ff) + amt;
        const G = (num & 0x0000ff) + amt;
        return (
            '#' +
            (
                0x1000000 +
                (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
                (B < 255 ? (B < 1 ? 0 : B) : 255) * 0x100 +
                (G < 255 ? (G < 1 ? 0 : G) : 255)
            )
                .toString(16)
                .slice(1)
        );
    };

    // Color palette from selected color
    const generatePalette = (baseColor: string) => {
        return [
            { shade: '50', color: adjustBrightness(baseColor, 90) },
            { shade: '100', color: adjustBrightness(baseColor, 80) },
            { shade: '200', color: adjustBrightness(baseColor, 60) },
            { shade: '300', color: adjustBrightness(baseColor, 40) },
            { shade: '400', color: adjustBrightness(baseColor, 20) },
            { shade: '500', color: baseColor },
            { shade: '600', color: adjustBrightness(baseColor, -20) },
            { shade: '700', color: adjustBrightness(baseColor, -40) },
            { shade: '800', color: adjustBrightness(baseColor, -60) },
            { shade: '900', color: adjustBrightness(baseColor, -80) },
        ];
    };

    const handleCopyColor = (color: string) => {
        navigator.clipboard.writeText(color);
        setCopiedColor(color);
        setTimeout(() => setCopiedColor(null), 2000);
    };

    return (
        <div className="flex flex-col h-full bg-gray-900">
            {/* Header */}
            <div className="p-4 border-b border-white/10">
                <h3 className="text-lg font-bold text-white mb-3">Design Tools</h3>

                {/* Tabs */}
                <div className="flex gap-1 bg-white/5 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('colors')}
                        className={cn(
                            'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors',
                            activeTab === 'colors'
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-400 hover:text-white'
                        )}
                    >
                        <IconPalette className="w-4 h-4" />
                        Cores
                    </button>
                    <button
                        onClick={() => setActiveTab('typography')}
                        className={cn(
                            'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors',
                            activeTab === 'typography'
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-400 hover:text-white'
                        )}
                    >
                        <IconTypography className="w-4 h-4" />
                        Texto
                    </button>
                    <button
                        onClick={() => setActiveTab('spacing')}
                        className={cn(
                            'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors',
                            activeTab === 'spacing'
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-400 hover:text-white'
                        )}
                    >
                        <IconRuler className="w-4 h-4" />
                        Espaço
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {activeTab === 'colors' && (
                    <div className="space-y-6">
                        {/* Color Picker */}
                        <div>
                            <label className="text-sm font-medium text-white mb-3 block">
                                Seletor de Cor
                            </label>
                            <HexColorPicker
                                color={selectedColor}
                                onChange={setSelectedColor}
                                className="w-full"
                            />

                            {/* Selected Color */}
                            <div className="mt-4 flex items-center gap-3">
                                <div
                                    className="w-12 h-12 rounded-lg border-2 border-white/20"
                                    style={{ backgroundColor: selectedColor }}
                                />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={selectedColor}
                                            onChange={(e) => setSelectedColor(e.target.value)}
                                            className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        />
                                        <button
                                            onClick={() => handleCopyColor(selectedColor)}
                                            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                                        >
                                            {copiedColor === selectedColor ? (
                                                <IconCheck className="w-4 h-4 text-green-500" />
                                            ) : (
                                                <IconCopy className="w-4 h-4 text-gray-400" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Palette */}
                        <div>
                            <label className="text-sm font-medium text-white mb-3 block">
                                Paleta Gerada
                            </label>
                            <div className="grid grid-cols-5 gap-2">
                                {generatePalette(selectedColor).map(({ shade, color }) => (
                                    <button
                                        key={shade}
                                        onClick={() => handleCopyColor(color)}
                                        className="group relative aspect-square rounded-lg hover:scale-110 transition-transform shadow-sm"
                                        style={{ backgroundColor: color }}
                                    >
                                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity text-white bg-black/40 rounded-lg">
                                            {shade}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Preset Colors */}
                        <div>
                            <label className="text-sm font-medium text-white mb-3 block">
                                Cores Populares
                            </label>
                            <div className="grid grid-cols-5 gap-2">
                                {['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#06b6d4'].map((color) => (
                                    <button
                                        key={color}
                                        onClick={() => setSelectedColor(color)}
                                        className="aspect-square rounded-lg hover:scale-110 transition-transform border-2 border-transparent hover:border-white/50"
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'typography' && (
                    <div className="space-y-6">
                        {/* Font Size Scale */}
                        <div>
                            <label className="text-sm font-medium text-white mb-3 block">
                                Escala de Tamanho
                            </label>
                            <div className="space-y-2">
                                {[
                                    { name: 'xs', size: '0.75rem', class: 'text-xs' },
                                    { name: 'sm', size: '0.875rem', class: 'text-sm' },
                                    { name: 'base', size: '1rem', class: 'text-base' },
                                    { name: 'lg', size: '1.125rem', class: 'text-lg' },
                                    { name: 'xl', size: '1.25rem', class: 'text-xl' },
                                    { name: '2xl', size: '1.5rem', class: 'text-2xl' },
                                    { name: '3xl', size: '1.875rem', class: 'text-3xl' },
                                    { name: '4xl', size: '2.25rem', class: 'text-4xl' },
                                ].map(({ name, size, class: className }) => (
                                    <button
                                        key={name}
                                        className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                                    >
                                        <span className={cn('text-white font-medium', className)}>
                                            Aa
                                        </span>
                                        <div className="text-right">
                                            <div className="text-sm font-medium text-white">{name}</div>
                                            <div className="text-xs text-gray-400">{size}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'spacing' && (
                    <div className="space-y-6">
                        {/* Spacing Scale */}
                        <div>
                            <label className="text-sm font-medium text-white mb-3 block">
                                Escala de Espaçamento
                            </label>
                            <div className="space-y-2">
                                {[
                                    { name: '1', size: '0.25rem', px: 1 },
                                    { name: '2', size: '0.5rem', px: 2 },
                                    { name: '4', size: '1rem', px: 4 },
                                    { name: '6', size: '1.5rem', px: 6 },
                                    { name: '8', size: '2rem', px: 8 },
                                    { name: '12', size: '3rem', px: 12 },
                                    { name: '16', size: '4rem', px: 16 },
                                    { name: '24', size: '6rem', px: 24 },
                                ].map(({ name, size, px }) => (
                                    <div
                                        key={name}
                                        className="flex items-center gap-4 p-3 bg-white/5 rounded-lg"
                                    >
                                        <div
                                            className="bg-blue-600 rounded"
                                            style={{ width: size, height: size }}
                                        />
                                        <div className="flex-1">
                                            <div className="text-sm font-medium text-white">p-{name}</div>
                                            <div className="text-xs text-gray-400">{size} • {px}px</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Gradient Builder */}
                {activeTab === 'gradients' && <GradientBuilder />}

                {/* Shadow Generator */}
                {activeTab === 'shadows' && <ShadowGenerator />}

                {/* Animation Timeline */}
                {activeTab === 'animations' && <AnimationTimeline />}
            </div>
        </div>
    );
}

