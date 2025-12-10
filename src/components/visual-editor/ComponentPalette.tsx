/**
 * ComponentPalette - Paleta de Componentes com Drag & Drop
 * Permite ao usuário visualizar e inserir componentes facilmente
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
    IconLayoutNavbar,
    IconRocket,
    IconGridDots,
    IconCurrencyDollar,
    IconMail,
    IconBolt,
    IconSocial,
    IconSearch,
} from '@tabler/icons-react';
import { COMPONENTS_BY_CATEGORY, Component } from '@/lib/visual-editor/components';

interface ComponentPaletteProps {
    onComponentSelect: (component: Component) => void;
}

const CATEGORY_ICONS = {
    navigation: IconLayoutNavbar,
    hero: IconRocket,
    features: IconGridDots,
    pricing: IconCurrencyDollar,
    forms: IconMail,
    cta: IconBolt,
    footer: IconSocial,
};

const CATEGORY_NAMES = {
    navigation: 'Navegação',
    hero: 'Hero',
    features: 'Features',
    pricing: 'Preços',
    forms: 'Formulários',
    cta: 'Call to Action',
    footer: 'Rodapé',
};

export function ComponentPalette({ onComponentSelect }: ComponentPaletteProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    // Filter components
    const filteredComponents = Object.entries(COMPONENTS_BY_CATEGORY).reduce((acc, [category, components]) => {
        if (selectedCategory && category !== selectedCategory) return acc;

        const filtered = components.filter(c =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        );

        if (filtered.length > 0) {
            acc[category] = filtered;
        }

        return acc;
    }, {} as Record<string, Component[]>);

    return (
        <div className="flex flex-col h-full bg-gray-900">
            {/* Header */}
            <div className="p-4 border-b border-white/10">
                <h3 className="text-lg font-bold text-white mb-3">Componentes</h3>

                {/* Search */}
                <div className="relative">
                    <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar componentes..."
                        className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                </div>
            </div>

            {/* Categories */}
            <div className="px-4 py-3 border-b border-white/10 overflow-x-auto">
                <div className="flex gap-2">
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className={cn(
                            'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
                            !selectedCategory
                                ? 'bg-blue-600 text-white'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        )}
                    >
                        Todos
                    </button>
                    {Object.keys(CATEGORY_ICONS).map((category) => {
                        const Icon = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS];
                        return (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={cn(
                                    'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
                                    selectedCategory === category
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                )}
                            >
                                <Icon className="w-4 h-4" />
                                {CATEGORY_NAMES[category as keyof typeof CATEGORY_NAMES]}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Components List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <AnimatePresence mode="wait">
                    {Object.entries(filteredComponents).map(([category, components]) => {
                        const Icon = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS];

                        return (
                            <motion.div
                                key={category}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                            >
                                {/* Category Header */}
                                {!selectedCategory && (
                                    <div className="flex items-center gap-2 mb-3">
                                        <Icon className="w-5 h-5 text-blue-400" />
                                        <h4 className="text-sm font-semibold text-white uppercase tracking-wide">
                                            {CATEGORY_NAMES[category as keyof typeof CATEGORY_NAMES]}
                                        </h4>
                                    </div>
                                )}

                                {/* Components Grid */}
                                <div className="grid gap-3">
                                    {components.map((component) => (
                                        <motion.button
                                            key={component.id}
                                            onClick={() => onComponentSelect(component)}
                                            className="group relative bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-4 text-left transition-all hover:border-blue-500/50"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            {/* Preview placeholder */}
                                            <div className="w-full h-24 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                                                <Icon className="w-8 h-8 text-gray-600" />
                                                <span className="absolute top-2 right-2 px-2 py-1 bg-blue-600 text-white text-xs rounded">Novo</span>
                                            </div>

                                            {/* Info */}
                                            <h5 className="text-sm font-semibold text-white mb-1 group-hover:text-blue-400 transition-colors">
                                                {component.name}
                                            </h5>
                                            <p className="text-xs text-gray-400 line-clamp-2">
                                                {component.description}
                                            </p>

                                            {/* Tags */}
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {component.tags.slice(0, 3).map((tag) => (
                                                    <span
                                                        key={tag}
                                                        className="px-2 py-0.5 bg-white/5 text-gray-400 text-xs rounded"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </motion.button>
                                    ))}
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {/* Empty State */}
                {Object.keys(filteredComponents).length === 0 && (
                    <div className="text-center py-12">
                        <IconSearch className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400">Nenhum componente encontrado</p>
                        <p className="text-sm text-gray-500 mt-1">Tente buscar por outro termo</p>
                    </div>
                )}
            </div>

            {/* Footer Tip */}
            <div className="p-4 border-t border-white/10 bg-black/20">
                <p className="text-xs text-gray-400 text-center">
                    💡 Clique em um componente para adicioná-lo à página
                </p>
            </div>
        </div>
    );
}
