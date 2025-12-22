import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, ShieldCheck, User, Crown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN' | null;

export function AdminBadge() {
    const user = useAuthStore((state) => state.user);
    const [role, setRole] = useState<UserRole>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        async function fetchRole() {
            if (!user) return;

            const { data } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (data?.role) {
                setRole(data.role as UserRole);
                // Mostrar badge por 3s ao fazer login
                setIsVisible(true);
                setTimeout(() => setIsVisible(false), 3000);
            }
        }

        fetchRole();
    }, [user?.id]);

    // Não mostrar para usuários comuns
    if (!role || role === 'USER') return null;

    const getRoleConfig = () => {
        switch (role) {
            case 'SUPER_ADMIN':
                return {
                    icon: <Crown className="w-4 h-4" />,
                    label: 'SUPER ADMIN',
                    gradient: 'from-purple-600 to-pink-600',
                    glow: 'shadow-purple-500/50',
                    border: 'border-purple-500/50',
                };
            case 'ADMIN':
                return {
                    icon: <ShieldCheck className="w-4 h-4" />,
                    label: 'ADMIN',
                    gradient: 'from-blue-600 to-cyan-600',
                    glow: 'shadow-blue-500/50',
                    border: 'border-blue-500/50',
                };
            default:
                return {
                    icon: <User className="w-4 h-4" />,
                    label: 'USER',
                    gradient: 'from-gray-600 to-gray-400',
                    glow: 'shadow-gray-500/50',
                    border: 'border-gray-500/50',
                };
        }
    };

    const config = getRoleConfig();

    return (
        <>
            {/* Badge fixo no canto superior direito */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="fixed top-4 right-4 z-50"
                onMouseEnter={() => setIsVisible(true)}
                onMouseLeave={() => setIsVisible(false)}
            >
                <div
                    className={`
            flex items-center gap-2 px-3 py-2
            bg-gradient-to-r ${config.gradient}
            border ${config.border}
            rounded-full
            shadow-lg ${config.glow}
            backdrop-blur-sm
            cursor-pointer
            transition-all duration-300
            hover:scale-105
          `}
                >
                    <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        {config.icon}
                    </motion.div>

                    {isVisible && (
                        <motion.span
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 'auto', opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            className="text-xs font-bold text-white whitespace-nowrap overflow-hidden"
                        >
                            {config.label}
                        </motion.span>
                    )}
                </div>
            </motion.div>

            {/* Tooltip expandido - mostra info adicional */}
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`
            fixed top-16 right-4 z-50
            px-4 py-3
            bg-gray-900/95 backdrop-blur-md
            border ${config.border}
            rounded-xl
            shadow-lg ${config.glow}
            max-w-xs
          `}
                >
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${config.gradient} animate-pulse`} />
                            <span className="text-sm font-semibold text-white">
                                {config.label}
                            </span>
                        </div>

                        <p className="text-xs text-gray-300">
                            {role === 'SUPER_ADMIN' && '🔥 Acesso total ao sistema. Pode fazer auditorias, correções e deploys.'}
                            {role === 'ADMIN' && '✅ Acesso administrativo. Pode gerenciar usuários e configurações.'}
                        </p>

                        <div className="pt-2 border-t border-gray-700">
                            <p className="text-xs text-gray-400">
                                Comandos disponíveis:
                            </p>
                            <ul className="text-xs text-gray-300 space-y-1 mt-1">
                                <li>• "Faça auditoria"</li>
                                <li>• "Limpe comandos travados"</li>
                                <li>• "Mostre logs"</li>
                            </ul>
                        </div>
                    </div>
                </motion.div>
            )}
        </>
    );
}
