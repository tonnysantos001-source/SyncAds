/**
 * AnimationTimeline - Keyframes Animation Editor
 * Editor visual de animações CSS com keyframes
 */

import React, { useState } from 'react';
import { IconPlus, IconTrash, IconCopy, IconPlayerPlay } from '@tabler/icons-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Keyframe {
    percent: number;
    transform: string;
    opacity: number;
}

export function AnimationTimeline() {
    const [name, setName] = useState('myAnimation');
    const [duration, setDuration] = useState(1);
    const [timingFunction, setTimingFunction] = useState<'ease' | 'linear' | 'ease-in' | 'ease-out'>('ease');
    const [iterationCount, setIterationCount] = useState<'1' | 'infinite'>('infinite');
    const [keyframes, setKeyframes] = useState<Keyframe[]>([
        { percent: 0, transform: 'translateX(0)', opacity: 1 },
        { percent: 100, transform: 'translateX(100px)', opacity: 1 },
    ]);
    const [isPlaying, setIsPlaying] = useState(false);

    const generateKeyframesCSS = () => {
        return `@keyframes ${name} {
${keyframes.map(kf => `  ${kf.percent}% {
    transform: ${kf.transform};
    opacity: ${kf.opacity};
  }`).join('\n')}
}`;
    };

    const animationCSS = `animation: ${name} ${duration}s ${timingFunction} ${iterationCount};`;

    const addKeyframe = () => {
        const newKeyframe: Keyframe = {
            percent: 50,
            transform: 'translateX(0)',
            opacity: 1,
        };
        setKeyframes([...keyframes, newKeyframe].sort((a, b) => a.percent - b.percent));
    };

    const removeKeyframe = (index: number) => {
        if (keyframes.length <= 2) {
            toast.error('Mínimo 2 keyframes');
            return;
        }
        setKeyframes(keyframes.filter((_, i) => i !== index));
    };

    const updateKeyframe = (index: number, updates: Partial<Keyframe>) => {
        const newKeyframes = keyframes.map((kf, i) =>
            i === index ? { ...kf, ...updates } : kf
        );
        setKeyframes(newKeyframes.sort((a, b) => a.percent - b.percent));
    };

    const copyCSS = () => {
        const fullCSS = `${generateKeyframesCSS()}\n\n/* Apply to element */\n${animationCSS}`;
        navigator.clipboard.writeText(fullCSS);
        toast.success('CSS copiado!');
    };

    const play = () => {
        setIsPlaying(true);
        setTimeout(() => setIsPlaying(false), duration * 1000);
    };

    // Animation presets
    const presets = {
        fadeIn: [
            { percent: 0, transform: 'translateX(0)', opacity: 0 },
            { percent: 100, transform: 'translateX(0)', opacity: 1 },
        ],
        slideIn: [
            { percent: 0, transform: 'translateX(-100px)', opacity: 0 },
            { percent: 100, transform: 'translateX(0)', opacity: 1 },
        ],
        bounce: [
            { percent: 0, transform: 'translateY(0)', opacity: 1 },
            { percent: 50, transform: 'translateY(-30px)', opacity: 1 },
            { percent: 100, transform: 'translateY(0)', opacity: 1 },
        ],
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-bold text-white mb-4">Animation Timeline</h3>

                {/* Preview */}
                <div className="h-32 bg-gray-800 rounded-xl mb-6 flex items-center justify-center overflow-hidden">
                    <div
                        className={cn(
                            'w-16 h-16 bg-blue-600 rounded-lg',
                            isPlaying && 'animate-playing'
                        )}
                        style={isPlaying ? {
                            animation: `${name} ${duration}s ${timingFunction}`,
                        } : {}}
                    />
                </div>

                <style>
                    {`@keyframes ${name} {
            ${keyframes.map(kf => `
              ${kf.percent}% {
                transform: ${kf.transform};
                opacity: ${kf.opacity};
              }
            `).join('')}
          }`}
                </style>

                {/* Controls */}
                <div className="space-y-4 mb-6">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Animation Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Duration */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Duration: {duration}s
                        </label>
                        <input
                            type="range"
                            min="0.1"
                            max="5"
                            step="0.1"
                            value={duration}
                            onChange={(e) => setDuration(Number(e.target.value))}
                            className="w-full"
                        />
                    </div>

                    {/* Timing Function */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Timing Function
                        </label>
                        <select
                            value={timingFunction}
                            onChange={(e) => setTimingFunction(e.target.value as any)}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="ease">Ease</option>
                            <option value="linear">Linear</option>
                            <option value="ease-in">Ease In</option>
                            <option value="ease-out">Ease Out</option>
                        </select>
                    </div>

                    {/* Iteration */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Iteration Count
                        </label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIterationCount('1')}
                                className={cn(
                                    'flex-1 px-4 py-2 rounded-lg font-medium transition',
                                    iterationCount === '1'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white/5 text-gray-400'
                                )}
                            >
                                Once
                            </button>
                            <button
                                onClick={() => setIterationCount('infinite')}
                                className={cn(
                                    'flex-1 px-4 py-2 rounded-lg font-medium transition',
                                    iterationCount === 'infinite'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white/5 text-gray-400'
                                )}
                            >
                                Infinite
                            </button>
                        </div>
                    </div>
                </div>

                {/* Keyframes */}
                <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-400">
                            Keyframes ({keyframes.length})
                        </label>
                        <button
                            onClick={addKeyframe}
                            className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                        >
                            <IconPlus className="w-4 h-4 text-white" />
                        </button>
                    </div>

                    {keyframes.map((kf, index) => (
                        <div key={index} className="p-4 bg-white/5 rounded-lg space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-white">
                                    {kf.percent}%
                                </span>
                                {keyframes.length > 2 && (
                                    <button
                                        onClick={() => removeKeyframe(index)}
                                        className="p-1 bg-red-600/20 hover:bg-red-600/30 rounded transition"
                                    >
                                        <IconTrash className="w-4 h-4 text-red-400" />
                                    </button>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Position</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={kf.percent}
                                    onChange={(e) => updateKeyframe(index, { percent: Number(e.target.value) })}
                                    className="w-full"
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Transform</label>
                                <input
                                    type="text"
                                    value={kf.transform}
                                    onChange={(e) => updateKeyframe(index, { transform: e.target.value })}
                                    className="w-full px-2 py-1 bg-black/30 border border-white/10 rounded text-white text-xs"
                                    placeholder="translateX(0)"
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 mb-1">
                                    Opacity: {kf.opacity}
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={kf.opacity}
                                    onChange={(e) => updateKeyframe(index, { opacity: Number(e.target.value) })}
                                    className="w-full"
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Presets */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                        Presets
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        {Object.entries(presets).map(([presetName, preset]) => (
                            <button
                                key={presetName}
                                onClick={() => setKeyframes(preset)}
                                className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-medium text-gray-300 transition capitalize"
                            >
                                {presetName}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={play}
                        className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                    >
                        <IconPlayerPlay className="w-5 h-5" />
                        Play
                    </button>
                    <button
                        onClick={copyCSS}
                        className="px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg transition"
                    >
                        <IconCopy className="w-5 h-5" />
                    </button>
                </div>

                {/* CSS Output */}
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                        CSS
                    </label>
                    <pre className="p-3 bg-black/50 rounded-lg text-xs text-gray-300 overflow-x-auto">
                        {generateKeyframesCSS()}
                        <br />
                        <br />
                        {`/* Apply to element */`}
                        <br />
                        {animationCSS}
                    </pre>
                </div>
            </div>
        </div>
    );
}
