/**
 * useKeyboardShortcuts Hook
 * Hook para gerenciar atalhos de teclado globais
 * 
 * Atalhos suportados:
 * - Ctrl+Enter: Enviar mensagem
 * - Esc: Fechar modal/preview
 * - Ctrl+K: Abrir busca
 * - Ctrl+/: Mostrar ajuda
 * 
 * @version 1.0.0
 */

import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    callback: () => void;
    description: string;
}

interface UseKeyboardShortcutsOptions {
    /** Se os atalhos estão habilitados */
    enabled?: boolean;
    /** Elemento onde ouvir eventos (default: document) */
    target?: HTMLElement | Document;
}

export function useKeyboardShortcuts(
    shortcuts: KeyboardShortcut[],
    options: UseKeyboardShortcutsOptions = {}
) {
    const { enabled = true, target = document } = options;

    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            // Ignorar se estiver em input/textarea (exceto Ctrl+Enter)
            const isInputElement =
                event.target instanceof HTMLInputElement ||
                event.target instanceof HTMLTextAreaElement;

            for (const shortcut of shortcuts) {
                const ctrlMatch = shortcut.ctrl === undefined || shortcut.ctrl === (event.ctrlKey || event.metaKey);
                const shiftMatch = shortcut.shift === undefined || shortcut.shift === event.shiftKey;
                const altMatch = shortcut.alt === undefined || shortcut.alt === event.altKey;
                const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

                if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
                    // Permitir Ctrl+Enter em inputs
                    if (isInputElement && !(shortcut.ctrl && shortcut.key === 'Enter')) {
                        continue;
                    }

                    event.preventDefault();
                    shortcut.callback();
                    break;
                }
            }
        },
        [shortcuts]
    );

    useEffect(() => {
        if (!enabled) return;

        const element = target as any;
        element.addEventListener('keydown', handleKeyDown);

        return () => {
            element.removeEventListener('keydown', handleKeyDown);
        };
    }, [enabled, target, handleKeyDown]);

    /**
     * Retorna string formatada do shortcut para exibição
     */
    const formatShortcut = useCallback((shortcut: KeyboardShortcut): string => {
        const parts: string[] = [];

        if (shortcut.ctrl) parts.push('Ctrl');
        if (shortcut.shift) parts.push('Shift');
        if (shortcut.alt) parts.push('Alt');

        // Capitalizar tecla
        const key = shortcut.key === 'Enter' ? '↵' :
            shortcut.key === 'Escape' ? 'Esc' :
                shortcut.key.toUpperCase();
        parts.push(key);

        return parts.join(' + ');
    }, []);

    return {
        formatShortcut,
    };
}

/**
 * Hook para shortcuts de modal específico
 */
export function useModalShortcuts(callbacks: {
    onSend?: () => void;
    onClose?: () => void;
    onClear?: () => void;
}) {
    const shortcuts: KeyboardShortcut[] = [];

    if (callbacks.onSend) {
        shortcuts.push({
            key: 'Enter',
            ctrl: true,
            callback: callbacks.onSend,
            description: 'Enviar mensagem',
        });
    }

    if (callbacks.onClose) {
        shortcuts.push({
            key: 'Escape',
            callback: callbacks.onClose,
            description: 'Fechar',
        });
    }

    if (callbacks.onClear) {
        shortcuts.push({
            key: 'K',
            ctrl: true,
            callback: callbacks.onClear,
            description: 'Limpar',
        });
    }

    useKeyboardShortcuts(shortcuts);

    return shortcuts;
}
