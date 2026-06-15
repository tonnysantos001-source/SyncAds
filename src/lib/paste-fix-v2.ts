// Garantir que paste funcione em todos os inputs e textareas
// Este arquivo previne qualquer bloqueio global de paste que possa existir

(function () {
    console.log('🔧 [PASTE FIX V2] Habilitando suporte global para paste...');

    const handleForcePaste = (e: ClipboardEvent) => {
        const target = e.target as HTMLInputElement | HTMLTextAreaElement;

        // Verificar se o alvo é um input ou textarea e se não exige colagem nativa
        if (
            target && 
            (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') && 
            !target.readOnly && 
            !target.disabled &&
            target.getAttribute('data-native-paste') !== 'true'
        ) {
            // Se for um campo de input normal, vamos forçar a colagem de texto
            try {
                const text = (e.clipboardData || (window as any).clipboardData).getData('text');
                if (text) {
                    e.preventDefault();
                    e.stopPropagation();

                    const start = target.selectionStart ?? target.value.length;
                    const end = target.selectionEnd ?? target.value.length;
                    const val = target.value;
                    
                    const newValue = val.slice(0, start) + text + val.slice(end);
                    target.value = newValue;
                    
                    // Ajustar posição do cursor
                    target.selectionStart = target.selectionEnd = start + text.length;

                    // Disparar eventos para o React detectar a mudança
                    const tracker = (target as any)._valueTracker;
                    if (tracker) {
                        tracker.setValue(val);
                    }
                    target.dispatchEvent(new Event('input', { bubbles: true }));
                    target.dispatchEvent(new Event('change', { bubbles: true }));

                    console.log('✅ [PASTE FIX V2] Colagem forçada com sucesso em:', target.tagName, target.id || target.className);
                }
            } catch (err) {
                console.error('❌ [PASTE FIX V2] Erro ao forçar colagem:', err);
            }
        }
    };

    const ensurePasteWorks = () => {
        // Usar capture: true para interceptar o evento no início do fluxo
        document.addEventListener('paste', handleForcePaste, { capture: true });

        // Permitir menu de contexto (botão direito)
        document.addEventListener('contextmenu', (e) => {
            const target = e.target as HTMLElement;
            if (
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable
            ) {
                // Não previne o menu de contexto
                return true;
            }
        }, { capture: true });

        console.log('✅ [PASTE FIX V2] Listener de paste configurado com sucesso');
    };

    // Executar quando DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ensurePasteWorks);
    } else {
        ensurePasteWorks();
    }
})();
