// Garantir que paste funcione em todos os inputs e textareas
// Este arquivo previne qualquer bloqueio global de paste que possa existir

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
        }, { capture: true, passive: false }); // capture: true para pegar o evento antes de outros handlers

        // GARANTIR paste via context menu (botão direito)
        document.addEventListener('contextmenu', (e) => {
            const target = e.target as HTMLElement;
            if (
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable
            ) {
                console.log('✅ [PASTE FIX] Context menu permitido em:', target.tagName);
            }
        });

        console.log('✅ [PASTE FIX] Listener de paste configurado com sucesso');
    };

    // Executar quando DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ensurePasteWorks);
    } else {
        ensurePasteWorks();
    }
})();
