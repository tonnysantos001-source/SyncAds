/**
 * PageManager Component - Sidebar for Managing Pages
 * Gerenciador visual de páginas múltiplas
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
    IconPlus,
    IconHome,
    IconTrash,
    IconCopy,
    IconEdit,
    IconCheck,
    IconX,
    IconDotsVertical,
} from '@tabler/icons-react';
import type { Page } from '@/hooks/usePages';

interface PageManagerProps {
    pages: Page[];
    currentPageId: string;
    onPageSelect: (id: string) => void;
    onPageAdd: (name: string, path: string) => void;
    onPageDelete: (id: string) => void;
    onPageDuplicate: (id: string) => void;
    onPageRename: (id: string, newName: string) => void;
    onSetHome: (id: string) => void;
}

export function PageManager({
    pages,
    currentPageId,
    onPageSelect,
    onPageAdd,
    onPageDelete,
    onPageDuplicate,
    onPageRename,
    onSetHome,
}: PageManagerProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [newPageName, setNewPageName] = useState('');
    const [newPagePath, setNewPagePath] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [menuOpen, setMenuOpen] = useState<string | null>(null);

    const handleAddPage = () => {
        if (!newPageName.trim() || !newPagePath.trim()) return;

        onPageAdd(newPageName, newPagePath);
        setNewPageName('');
        setNewPagePath('');
        setIsAdding(false);
    };

    const handleRename = (id: string) => {
        if (!editName.trim()) return;
        onPageRename(id, editName);
        setEditingId(null);
    };

    const startEdit = (page: Page) => {
        setEditingId(page.id);
        setEditName(page.name);
        setMenuOpen(null);
    };

    return (
        <div className="flex flex-col h-full bg-gray-900">
            {/* Header */}
            <div className="p-4 border-b border-white/10">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-white">Páginas</h3>
                    <button
                        onClick={() => setIsAdding(true)}
                        className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                    >
                        <IconPlus className="w-5 h-5 text-white" />
                    </button>
                </div>

                <p className="text-xs text-gray-400">
                    {pages.length} página{pages.length !== 1 ? 's' : ''}
                </p>
            </div>

            {/* Pages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <AnimatePresence>
                    {pages.map((page) => (
                        <motion.div
                            key={page.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className={cn(
                                'relative group rounded-lg transition-colors',
                                currentPageId === page.id
                                    ? 'bg-blue-600'
                                    : 'bg-white/5 hover:bg-white/10'
                            )}
                        >
                            {editingId === page.id ? (
                                // Edit Mode
                                <div className="p-3">
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleRename(page.id);
                                            if (e.key === 'Escape') setEditingId(null);
                                        }}
                                        className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        autoFocus
                                    />
                                    <div className="flex gap-2 mt-2">
                                        <button
                                            onClick={() => handleRename(page.id)}
                                            className="flex-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                                        >
                                            <IconCheck className="w-4 h-4 mx-auto" />
                                        </button>
                                        <button
                                            onClick={() => setEditingId(null)}
                                            className="flex-1 px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
                                        >
                                            <IconX className="w-4 h-4 mx-auto" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                // Normal Mode
                                <button
                                    onClick={() => onPageSelect(page.id)}
                                    className="w-full p-3 text-left"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            {page.isHome && (
                                                <IconHome className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                                            )}
                                            <span className="text-sm font-medium text-white truncate">
                                                {page.name}
                                            </span>
                                        </div>

                                        {/* Menu Button */}
                                        <div className="relative">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setMenuOpen(menuOpen === page.id ? null : page.id);
                                                }}
                                                className="p-1 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded transition"
                                            >
                                                <IconDotsVertical className="w-4 h-4 text-white" />
                                            </button>

                                            {/* Dropdown Menu */}
                                            <AnimatePresence>
                                                {menuOpen === page.id && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.95 }}
                                                        className="absolute right-0 mt-2 w-48 bg-gray-800 border border-white/10 rounded-lg shadow-xl z-50"
                                                    >
                                                        {!page.isHome && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onSetHome(page.id);
                                                                    setMenuOpen(null);
                                                                }}
                                                                className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 flex items-center gap-2"
                                                            >
                                                                <IconHome className="w-4 h-4" />
                                                                Definir como Home
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                startEdit(page);
                                                            }}
                                                            className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 flex items-center gap-2"
                                                        >
                                                            <IconEdit className="w-4 h-4" />
                                                            Renomear
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onPageDuplicate(page.id);
                                                                setMenuOpen(null);
                                                            }}
                                                            className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 flex items-center gap-2"
                                                        >
                                                            <IconCopy className="w-4 h-4" />
                                                            Duplicar
                                                        </button>
                                                        {pages.length > 1 && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onPageDelete(page.id);
                                                                    setMenuOpen(null);
                                                                }}
                                                                className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 border-t border-white/10"
                                                            >
                                                                <IconTrash className="w-4 h-4" />
                                                                Deletar
                                                            </button>
                                                        )}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1 truncate">
                                        {page.path}
                                    </div>
                                </button>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Add Page Form */}
            <AnimatePresence>
                {isAdding && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="p-4 border-t border-white/10 bg-black/20"
                    >
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">
                                    Nome da Página
                                </label>
                                <input
                                    type="text"
                                    value={newPageName}
                                    onChange={(e) => setNewPageName(e.target.value)}
                                    placeholder="Sobre Nós"
                                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">
                                    Caminho (Path)
                                </label>
                                <input
                                    type="text"
                                    value={newPagePath}
                                    onChange={(e) => setNewPagePath(e.target.value)}
                                    placeholder="/about"
                                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleAddPage}
                                    disabled={!newPageName.trim() || !newPagePath.trim()}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition"
                                >
                                    Adicionar
                                </button>
                                <button
                                    onClick={() => {
                                        setIsAdding(false);
                                        setNewPageName('');
                                        setNewPagePath('');
                                    }}
                                    className="flex-1 px-4 py-2 bg-white/5 text-white rounded-lg font-semibold hover:bg-white/10 transition"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Tip */}
            {!isAdding && (
                <div className="p-4 border-t border-white/10">
                    <p className="text-xs text-gray-400 text-center">
                        💡 Crie páginas adicionais para sites multi-página
                    </p>
                </div>
            )}
        </div>
    );
}
