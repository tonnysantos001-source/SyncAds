/**
 * ADMIN PROGRESS INDICATOR
 * Componente visual para mostrar progresso de auditorias em tempo real
 * 
 * Exemplo: Testando 327 bibliotecas Railway, mostrando uma por uma
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconCheck, IconX, IconAlertTriangle, IconLoader2, IconCode, IconDatabase, IconCloud } from '@tabler/icons-react';

interface ProgressItem {
    name: string;
    status: 'pending' | 'testing' | 'ok' | 'error' | 'warning';
    message?: string;
    suggestion?: string;
}

interface AdminProgressIndicatorProps {
    title: string;
    subtitle?: string;
    items: ProgressItem[];
    currentIndex: number;
    totalProgress: number; // 0-100
    isComplete: boolean;
    category?: 'railway' | 'database' | 'github' | 'general';
}

export function AdminProgressIndicator({
    title,
    subtitle,
    items,
    currentIndex,
    totalProgress,
    isComplete,
    category = 'general'
}: AdminProgressIndicatorProps) {

    const categoryIcons = {
        railway: IconCloud,
        database: IconDatabase,
        github: IconCode,
        general: IconLoader2
    };

    const CategoryIcon = categoryIcons[category];

    const statusConfig = {
        pending: { icon: null, color: 'text-gray-400', bg: 'bg-gray-100' },
        testing: { icon: IconLoader2, color: 'text-blue-500', bg: 'bg-blue-50', animate: true },
        ok: { icon: IconCheck, color: 'text-green-500', bg: 'bg-green-50' },
        error: { icon: IconX, color: 'text-red-500', bg: 'bg-red-50' },
        warning: { icon: IconAlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-50' }
    };

    const stats = {
        ok: items.filter(i => i.status === 'ok').length,
        error: items.filter(i => i.status === 'error').length,
        warning: items.filter(i => i.status === 'warning').length
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-20 right-6 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50"
        >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white">
                <div className="flex items-center gap-3">
                    <CategoryIcon className="w-6 h-6" />
                    <div className="flex-1">
                        <h3 className="font-semibold text-lg">{title}</h3>
                        {subtitle && <p className="text-sm text-blue-100">{subtitle}</p>}
                    </div>
                    {!isComplete && (
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        >
                            <IconLoader2 className="w-5 h-5" />
                        </motion.div>
                    )}
                </div>

                {/* Progress Bar */}
                <div className="mt-3 bg-white/20 rounded-full h-2 overflow-hidden">
                    <motion.div
                        className="bg-white h-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${totalProgress}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>

                {/* Stats */}
                <div className="mt-2 flex gap-4 text-sm">
                    <span className="text-green-200">✓ {stats.ok}</span>
                    <span className="text-red-200">✗ {stats.error}</span>
                    <span className="text-yellow-200">⚠ {stats.warning}</span>
                    <span className="ml-auto text-white/80">{Math.round(totalProgress)}%</span>
                </div>
            </div>

            {/* Items List */}
            <div className="max-h-80 overflow-y-auto p-4 space-y-2">
                <AnimatePresence mode="popLayout">
                    {items.slice(Math.max(0, currentIndex - 5), currentIndex + 10).map((item, idx) => {
                        const config = statusConfig[item.status];
                        const StatusIcon = config.icon;
                        const isCurrent = items.indexOf(item) === currentIndex;

                        return (
                            <motion.div
                                key={item.name}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className={`
                  p-3 rounded-lg border transition-all
                  ${config.bg} ${config.color}
                  ${isCurrent ? 'border-blue-500 border-2 shadow-lg scale-105' : 'border-gray-200'}
                `}
                            >
                                <div className="flex items-start gap-3">
                                    {/* Icon */}
                                    <div className="flex-shrink-0 mt-0.5">
                                        {StatusIcon ? (
                                            <motion.div
                                                animate={config.animate ? { rotate: 360 } : {}}
                                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                            >
                                                <StatusIcon className="w-5 h-5" />
                                            </motion.div>
                                        ) : (
                                            <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-sm truncate">{item.name}</span>
                                            {isCurrent && (
                                                <motion.span
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                                    transition={{ duration: 1.5, repeat: Infinity }}
                                                    className="text-xs px-2 py-0.5 bg-blue-500 text-white rounded-full"
                                                >
                                                    Testando...
                                                </motion.span>
                                            )}
                                        </div>

                                        {item.message && (
                                            <p className="text-xs mt-1 text-gray-600">{item.message}</p>
                                        )}

                                        {item.suggestion && item.status !== 'ok' && (
                                            <p className="text-xs mt-1 text-gray-500 italic">
                                                💡 {item.suggestion}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Footer */}
            {isComplete && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-gray-50 p-4 border-t border-gray-200"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                            Auditoria Completa
                        </span>
                        <button
                            onClick={() => {/* Close indicator */ }}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                            Ver Relatório →
                        </button>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
}
