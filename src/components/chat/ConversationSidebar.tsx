import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare, X, Plus, Trash2, Menu } from 'lucide-react';

interface Conversation {
    id: string;
    title: string;
    messages?: Array<{ content: string }>;
    createdAt?: string | Date;
}

interface ConversationSidebarProps {
    isOpen: boolean;
    conversations: Conversation[];
    activeConversationId: string | null;
    onToggle: () => void;
    onClose: () => void;
    onNewConversation: () => void;
    onSelectConversation: (id: string) => void;
    onDeleteConversation: (id: string) => void;
}

export const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
    isOpen,
    conversations,
    activeConversationId,
    onToggle,
    onClose,
    onNewConversation,
    onSelectConversation,
    onDeleteConversation,
}) => {
    return (
        <>
        {/* Desktop-only sidebar — mobile uses the dropdown selector in the header */}
        <div
            className={`hidden md:flex md:flex-col ${isOpen ? "md:w-72" : "md:w-0"}
            bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800
            overflow-hidden transition-all duration-300 flex-shrink-0`}
        >
                {/* Sidebar Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 md:bg-transparent">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-base md:text-sm font-semibold text-gray-900 dark:text-white md:text-gray-700 dark:md:text-gray-200">
                            Conversas
                        </h2>
                        <Button
                            onClick={onClose}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 md:h-7 md:w-7 p-0 hover:bg-gray-100"
                        >
                            <X className="h-5 w-5 md:h-4 md:w-4 text-gray-500 dark:text-gray-400" />
                        </Button>
                    </div>
                    <Button
                        onClick={() => {
                            onNewConversation();
                            // Fechar sidebar em mobile após criar nova conversa
                            if (window.innerWidth < 768) {
                                onClose();
                            }
                        }}
                        className="w-full gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                        size="default"
                    >
                        <Plus className="h-4 w-4" />
                        Nova Conversa
                    </Button>
                </div>

                {/* Lista de Conversas */}
                <div className="flex-1 overflow-y-auto p-3 md:p-2 space-y-2 md:space-y-1">
                    {conversations.map((conv) => (
                        <div
                            key={conv.id}
                            className={`group relative flex items-center gap-3 p-3 md:p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer transition-all duration-200 ${activeConversationId === conv.id
                                ? "bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 shadow-sm"
                                : "bg-gray-50 dark:bg-white/5 md:bg-white dark:md:bg-transparent hover:shadow-sm"
                                }`}
                            onClick={() => {
                                if (activeConversationId !== conv.id) {
                                    onSelectConversation(conv.id);
                                }
                                // Fechar sidebar em mobile após selecionar conversa
                                if (window.innerWidth < 768) {
                                    onClose();
                                }
                            }}
                        >
                            <MessageSquare className="h-5 w-5 md:h-4 md:w-4 text-gray-500 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm md:text-sm font-medium truncate transition-colors ${activeConversationId === conv.id ? "text-blue-600 dark:text-blue-400" : "text-gray-900 dark:text-gray-200"
                                    }`}>
                                    {conv.title || 'Nova conversa'}
                                </p>
                                {/* Preview da última mensagem (estilo ChatGPT) */}
                                <p className="text-xs text-gray-500 truncate mt-0.5">
                                    {conv.messages && conv.messages.length > 0
                                        ? conv.messages[conv.messages.length - 1].content.substring(
                                            0,
                                            50,
                                        ) + "..."
                                        : "Sem mensagens ainda"}
                                </p>
                            </div>
                            <Button
                                onClick={(e: React.MouseEvent) => {
                                    e.stopPropagation();
                                    onDeleteConversation(conv.id);
                                }}
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 md:h-7 md:w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                            >
                                <Trash2 className="h-4 w-4 md:h-3.5 md:w-3.5 text-red-500" />
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};

// Menu Toggle Button (para usar no header do chat)
interface MenuToggleButtonProps {
    onClick: () => void;
    className?: string;
}

export const MenuToggleButton: React.FC<MenuToggleButtonProps> = ({
    onClick,
    className = '',
}) => {
    return (
        <Button
            onClick={onClick}
            variant="ghost"
            size="sm"
            className={`h-9 w-9 p-0 flex-shrink-0 hover:bg-gray-100 rounded-lg ${className}`}
        >
            <Menu className="h-5 w-5" />
        </Button>
    );
};
