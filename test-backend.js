/**
 * Script de Teste Automatizado - SyncAds Backend
 * 
 * Testa o fluxo completo:
 * 1. Chama API chat-stream
 * 2. Envia "criar receita de pão de queijo"
 * 3. Captura resposta completa
 * 4. Valida HTML gerado
 * 5. Reporta resultados
 */

const SUPABASE_URL = "https://ovskepqggmxlfckxqgbr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92c2tlcHFnZ214bGZja3hxZ2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc5MTY1MjIsImV4cCI6MjA1MzQ5MjUyMn0.xtm5gIfVd71gu3qKlUHqrPTQQlKLFxgSX-9KRMKzJDc";

// Você pode substituir com token real de um usuário autenticado se necessário
// Para teste básico, vamos usar apenas anon key

async function testBackend() {
    console.log("🧪 [TEST] Iniciando teste automatizado...\n");

    const testMessage = "criar receita de pão de queijo";
    const conversationId = `test-${Date.now()}`;
    const deviceId = `test-device-${Date.now()}`;

    console.log(`📤 [TEST] Enviando mensagem: "${testMessage}"`);
    console.log(`📋 [TEST] Conversation ID: ${conversationId}`);
    console.log(`🔧 [TEST] Device ID: ${deviceId}\n`);

    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/chat-stream`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
                message: testMessage,
                conversationId: conversationId,
                deviceId: deviceId
            })
        });

        console.log(`📥 [TEST] Response status: ${response.status}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ [TEST] Erro HTTP: ${response.status}`);
            console.error(`📄 [TEST] Error body: ${errorText}`);
            return;
        }

        // A resposta é um stream de eventos SSE
        const text = await response.text();

        console.log("\n📄 [TEST] Resposta completa:\n");
        console.log("─".repeat(80));
        console.log(text);
        console.log("─".repeat(80));

        // Analisar resposta
        console.log("\n🔍 [TEST] Análise da resposta:\n");

        // Verificar se tem conteúdo HTML
        const hasHtml = text.includes("<h1>") || text.includes("<html>");
        console.log(`  HTML detectado: ${hasHtml ? "✅ SIM" : "❌ NÃO"}`);

        // Verificar placeholders
        const hasPlaceholders = text.includes("{{INGREDIENTES}}") ||
            text.includes("{{MODO_PREPARO}}") ||
            text.includes("{{INFO_NUTRICIONAL}}");
        console.log(`  Placeholders: ${hasPlaceholders ? "⚠️ SIM (problema)" : "✅ NÃO (bom)"}`);

        // Verificar se tem ingredientes reais
        const hasRealIngredients = text.match(/\d+g|ovos|leite|polvilho/i);
        console.log(`  Ingredientes reais: ${hasRealIngredients ? "✅ SIM" : "❌ NÃO"}`);

        // Verificar comandos gerados
        const hasNavigateCommand = text.includes('"type":"navigate"');
        const hasInsertCommand = text.includes('"type":"insert_via_api"');
        console.log(`  Comando navigate: ${hasNavigateCommand ? "✅ SIM" : "❌ NÃO"}`);
        console.log(`  Comando insert_via_api: ${hasInsertCommand ? "✅ SIM" : "❌ NÃO"}`);

        // Verificar estados
        const states = [];
        const stateMatches = text.matchAll(/event: state\s+data: "([^"]+)"/g);
        for (const match of stateMatches) {
            states.push(match[1]);
        }
        console.log(`  Estados percorridos: ${states.join(" → ")}`);

        // Resultado final
        console.log("\n📊 [TEST] RESULTADO FINAL:\n");

        if (hasHtml && !hasPlaceholders && hasRealIngredients) {
            console.log("✅ SUCESSO COMPLETO!");
            console.log("   - HTML gerado corretamente");
            console.log("   - SEM placeholders");
            console.log("   - Ingredientes reais detectados");
        } else if (hasHtml && hasPlaceholders) {
            console.log("⚠️ SUCESSO PARCIAL");
            console.log("   - HTML gerado corretamente");
            console.log("   - ❌ COM placeholders (conteúdo incompleto)");
            console.log("   - Documento será criado mas com {{INGREDIENTES}}, etc");
        } else {
            console.log("❌ FALHA");
            console.log("   - Sem HTML ou estrutura incorreta");
        }

    } catch (error) {
        console.error("❌ [TEST] Erro ao executar teste:", error.message);
        console.error(error.stack);
    }
}

// Executar teste
console.log("🚀 SyncAds Backend - Teste Automatizado\n");
testBackend().catch(console.error);
