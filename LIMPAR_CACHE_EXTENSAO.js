/**
 * SCRIPT DE LIMPEZA COMPLETA - Extensão Chrome SyncAds
 * Use para resolver: "AuthSessionMissingError: Auth session missing!"
 * 
 * COMO USAR:
 * 1. Abrir a extensão Chrome
 * 2. Clicar com botão direito → Inspecionar
 * 3. Ir na aba Console
 * 4. Copiar e colar TODO este código
 * 5. Pressionar Enter
 * 6. Recarregar a extensão
 * 7. Fazer login novamente
 */

console.log("🧹 INICIANDO LIMPEZA COMPLETA DA EXTENSÃO...\n");

// PASSO 1: Limpar Storage Local
console.log("📦 [1/4] Limpando chrome.storage.local...");
chrome.storage.local.clear(() => {
    console.log("✅ Storage local limpo!");

    // PASSO 2: Limpar Storage Sync
    console.log("\n📦 [2/4] Limpando chrome.storage.sync...");
    chrome.storage.sync.clear(() => {
        console.log("✅ Storage sync limpo!");

        // PASSO 3: Limpar Cookies do Supabase
        console.log("\n🍪 [3/4] Limpando cookies do Supabase...");
        chrome.cookies.getAll({ domain: "supabase.co" }, (cookies) => {
            cookies.forEach(cookie => {
                chrome.cookies.remove({
                    url: `https://${cookie.domain}${cookie.path}`,
                    name: cookie.name
                });
            });
            console.log(`✅ ${cookies.length} cookies removidos!`);

            // PASSO 4: Limpar Cache
            console.log("\n💾 [4/4] Limpando cache...");
            if (chrome.browsingData) {
                chrome.browsingData.remove({
                    origins: ["https://ovskepqggmxlfckxqgbr.supabase.co"]
                }, {
                    cache: true,
                    localStorage: true,
                    sessionStorage: true
                }, () => {
                    console.log("✅ Cache limpo!");

                    // RESUMO FINAL
                    console.log("\n" + "=".repeat(60));
                    console.log("✅ LIMPEZA COMPLETA FINALIZADA!");
                    console.log("=".repeat(60));
                    console.log("\n📋 PRÓXIMOS PASSOS:");
                    console.log("1. Feche o DevTools");
                    console.log("2. Clique no ícone da extensão");
                    console.log("3. Faça LOGIN novamente");
                    console.log("4. Teste o chat enviando uma mensagem");
                    console.log("\n💡 Se ainda der erro, recarregue a extensão:");
                    console.log("   chrome://extensions → SyncAds → ⟳ Recarregar");
                    console.log("\n");
                });
            } else {
                console.log("⚠️ API browsingData não disponível, mas storage foi limpo!");
                finalizarLimpeza();
            }
        });
    });
});

function finalizarLimpeza() {
    console.log("\n" + "=".repeat(60));
    console.log("✅ LIMPEZA BÁSICA FINALIZADA!");
    console.log("=".repeat(60));
    console.log("\n📋 PRÓXIMOS PASSOS:");
    console.log("1. Feche o DevTools");
    console.log("2. Clique no ícone da extensão");
    console.log("3. Faça LOGIN novamente");
    console.log("4. Teste o chat enviando uma mensagem");
}
