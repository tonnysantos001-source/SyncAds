/**
 * TEMPLATE SELECTOR
 *
 * UI para escolher templates com preview, filtros e busca
 *
 * Features:
 * - Grid responsivo de templates
 * - Busca em tempo real
 * - Filtros por categoria
 * - Preview ao hover
 * - Tags e difficulty
 * - Featured/Pro badges
 *
 * @version 1.0.0
 * @date 2025-01-08
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  IconSearch,
  IconFilter,
  IconX,
  IconCheck,
  IconStar,
  IconCode,
  IconEye,
  IconSparkles,
  IconBolt,
  IconShoppingCart,
  IconBrandReact,
  IconFileCode,
  IconCrown,
} from '@tabler/icons-react';
import { TemplateLibrary, Template, TemplateCategory } from '@/lib/templates/TemplateLibrary';

interface TemplateSelectorProps {
  onSelectTemplate: (template: Template) => void;
  onClose: () => void;
}

const CATEGORY_ICONS: Record<TemplateCategory, any> = {
  'landing-page': IconBolt,
  'portfolio': IconStar,
  'ecommerce': IconShoppingCart,
  'blog': IconFileCode,
  'saas': IconBrandReact,
  'restaurant': IconSparkles,
  'agency': IconCode,
  'app': IconBolt,
  'admin': IconCode,
  'coming-soon': IconSparkles,
};

const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  'landing-page': 'Landing Pages',
  'portfolio': 'Portfolios',
  'ecommerce': 'E-commerce',
  'blog': 'Blogs',
  'saas': 'SaaS',
  'restaurant': 'Restaurantes',
  'agency': 'Agências',
  'app': 'Apps',
  'admin': 'Admin',
  'coming-soon': 'Em Breve',
};

const DIFFICULTY_COLORS = {
  beginner: 'text-green-400',
  intermediate: 'text-yellow-400',
  advanced: 'text-red-400',
};

export function TemplateSelector({ onSelectTemplate, onClose }: TemplateSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);

  const templateLibrary = useMemo(() => new TemplateLibrary(), []);
  const allTemplates = templateLibrary.getAllTemplates();

  const filteredTemplates = useMemo(() => {
    let filtered = allTemplates;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((t) => t.category === selectedCategory);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [allTemplates, selectedCategory, searchQuery]);

  const categories = useMemo(() => {
    const cats = new Set<TemplateCategory>();
    allTemplates.forEach((t) => cats.add(t.category));
    return Array.from(cats);
  }, [allTemplates]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-7xl h-[90vh] bg-[#0a0a0a] rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="border-b border-white/10 bg-[#0f0f0f] p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
                Escolha um Template
              </h2>
              <p className="text-sm text-gray-400">
                {filteredTemplates.length} templates disponíveis
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <IconX className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar templates..."
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          {/* Category filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory('all')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              )}
            >
              Todos
            </button>
            {categories.map((cat) => {
              const Icon = CATEGORY_ICONS[cat];
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap',
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {CATEGORY_LABELS[cat]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Template Grid */}
        <div className="flex-1 overflow-auto p-6">
          {filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <IconFilter className="w-16 h-16 text-gray-600 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Nenhum template encontrado
              </h3>
              <p className="text-gray-400 max-w-md">
                Tente ajustar seus filtros ou termo de busca
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group relative"
                  onMouseEnter={() => setHoveredTemplate(template.id)}
                  onMouseLeave={() => setHoveredTemplate(null)}
                >
                  <div
                    className={cn(
                      'relative bg-[#0f0f0f] rounded-xl border border-white/10 overflow-hidden transition-all duration-300 cursor-pointer',
                      hoveredTemplate === template.id &&
                        'border-blue-500/50 shadow-lg shadow-blue-500/25 transform -translate-y-1'
                    )}
                    onClick={() => onSelectTemplate(template)}
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video bg-gradient-to-br from-blue-500/20 to-purple-600/20 overflow-hidden">
                      <img
                        src={template.thumbnail}
                        alt={template.name}
                        className="w-full h-full object-cover"
                      />
                      {template.featured && (
                        <div className="absolute top-2 right-2 bg-yellow-500 text-black px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1">
                          <IconStar className="w-3 h-3" />
                          Featured
                        </div>
                      )}
                      {template.isPro && (
                        <div className="absolute top-2 left-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1">
                          <IconCrown className="w-3 h-3" />
                          Pro
                        </div>
                      )}

                      {/* Hover overlay */}
                      <AnimatePresence>
                        {hoveredTemplate === template.id && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center gap-2"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // TODO: Open preview
                              }}
                              className="p-3 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors"
                            >
                              <IconEye className="w-5 h-5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectTemplate(template);
                              }}
                              className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              <IconCheck className="w-5 h-5" />
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                          {template.name}
                        </h3>
                        <span
                          className={cn(
                            'text-xs font-medium px-2 py-1 rounded',
                            DIFFICULTY_COLORS[template.difficulty],
                            'bg-white/5'
                          )}
                        >
                          {template.difficulty}
                        </span>
                      </div>

                      <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                        {template.description}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {template.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-1 bg-white/5 text-gray-400 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                        {template.tags.length > 3 && (
                          <span className="text-xs px-2 py-1 bg-white/5 text-gray-400 rounded">
                            +{template.tags.length - 3}
                          </span>
                        )}
                      </div>

                      {/* Framework badge */}
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <IconCode className="w-4 h-4" />
                        <span className="uppercase">{template.framework}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default TemplateSelector;
