import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, XCircle, ChevronDown, ChevronUp } from 'lucide-react';

export type ToolExecutionStatus = 'idle' | 'executing' | 'success' | 'error';

interface ToolExecutionIndicatorProps {
    status: ToolExecutionStatus;
    action?: string;
    errorMessage?: string;
    logs?: string[];
    onDismiss?: () => void;
}

export function ToolExecutionIndicator({
    status,
    action = 'Processando',
    errorMessage,
    logs = [],
    onDismiss,
}: ToolExecutionIndicatorProps) {
    const [showLogs, setShowLogs] = useState(false);
    const [autoHideTimer, setAutoHideTimer] = useState<NodeJS.Timeout | null>(null);

    // Auto-hide após sucesso
    useEffect(() => {
        if (status === 'success' && onDismiss) {
            const timer = setTimeout(() => {
                onDismiss();
            }, 3000);
            setAutoHideTimer(timer);
            return () => clearTimeout(timer);
        }
    }, [status, onDismiss]);

    if (status === 'idle') return null;

    const getStatusConfig = () => {
        switch (status) {
            case 'executing':
                return {
                    icon: <Loader2 className="w-5 h-5 animate-spin" />,
                    text: action,
                    bgGradient: 'from-purple-500/10 to-blue-500/10',
                    borderColor: 'border-purple-500/30',
                    textColor: 'text-purple-300',
                    shadowColor: 'shadow-purple-500/20',
                };
            case 'success':
                return {
                    icon: <CheckCircle2 className="w-5 h-5" />,
                    text: `✅ ${action} concluído!`,
                    bgGradient: 'from-green-500/10 to-emerald-500/10',
                    borderColor: 'border-green-500/30',
                    textColor: 'text-green-300',
                    shadowColor: 'shadow-green-500/20',
                };
            case 'error':
                return {
                    icon: <XCircle className="w-5 h-5" />,
                    text: errorMessage || 'Falha na execução',
                    bgGradient: 'from-red-500/10 to-orange-500/10',
                    borderColor: 'border-red-500/30',
                    textColor: 'text-red-300',
                    shadowColor: 'shadow-red-500/20',
                };
            default:
                return {
                    icon: null,
                    text: '',
                    bgGradient: '',
                    borderColor: '',
                    textColor: '',
                    shadowColor: '',
                };
        }
    };

    const config = getStatusConfig();

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className={`
          fixed bottom-6 right-6 z-50 
          max-w-md
          bg-gradient-to-r ${config.bgGradient}
          backdrop-blur-md
          border ${config.borderColor}
          rounded-2xl
          shadow-lg ${config.shadowColor}
          overflow-hidden
        `}
            >
                {/* Main Content */}
                <div className="p-4 flex items-start gap-3">
                    {/* Icon */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                        className={config.textColor}
                    >
                        {config.icon}
                    </motion.div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${config.textColor}`}>
                            {config.text}
                        </p>
                    </div>

                    {/* Logs Toggle (only for error or if logs exist) */}
                    {(status === 'error' || logs.length > 0) && (
                        <button
                            onClick={() => setShowLogs(!showLogs)}
                            className={`
                p-1 rounded-lg
                hover:bg-white/5
                transition-colors
                ${config.textColor}
              `}
                        >
                            {showLogs ? (
                                <ChevronUp className="w-4 h-4" />
                            ) : (
                                <ChevronDown className="w-4 h-4" />
                            )}
                        </button>
                    )}
                </div>

                {/* Logs Expandable */}
                <AnimatePresence>
                    {showLogs && logs.length > 0 && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="border-t border-white/10"
                        >
                            <div className="p-4 pt-3 max-h-64 overflow-y-auto">
                                <p className="text-xs text-gray-400 mb-2 font-semibold">
                                    📋 Logs de Execução
                                </p>
                                <div className="space-y-1">
                                    {logs.map((log, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="text-xs text-gray-300 font-mono bg-black/20 px-2 py-1 rounded"
                                        >
                                            {log}
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Progress Bar (only for executing) */}
                {status === 'executing' && (
                    <div className="h-1 w-full bg-white/5 overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                            initial={{ x: '-100%' }}
                            animate={{ x: '100%' }}
                            transition={{
                                repeat: Infinity,
                                duration: 1.5,
                                ease: 'easeInOut',
                            }}
                        />
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
}
