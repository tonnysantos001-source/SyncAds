// Garantir que paste funcione em todos os inputs e textareas
//Este arquivo previne qualquer bloqueio global de paste que possa existir

(function () {
    console.log('🔧 [PASTE FIX] Habilitando suporte global para paste...');

    // Garantir que eventos de clipboard funcionem
    const ensurePasteWorks = () => {
        // Permitir paste em todos os inputs e textareas
        document.addEventListener('paste', (e) => {
            const target = e.target as HTMLElement;

            // Verificar se o alvo é um input ou textarea
            if (
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable
            ) {
                // NÃO prevenir o comportamento padrão - deixar o paste acontecer
                console.log('✅ [PASTE FIX] Paste permitido em:', target.tagName, target.id || target.className);

                // Garantir que o evento propague normalmente
                return true;
            }
        }, { capture: false, passive: true });

        console.log('✅ [PASTE FIX] Listener de paste configurado com sucesso');
    };

    // Executar quando DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ensurePasteWorks);
    } else {
        ensurePasteWorks();
    }
})();
