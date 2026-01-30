/**
 * Script de Teste Automatizado - SyncAds Backend
 * 
 * Versão 2: Usa SERVICE_ROLE key para bypass de autenticação
 */

const SUPABASE_URL = "https://ovskepqggmxlfckxqgbr.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
    console.error("❌ SUPABASE_SERVICE_ROLE_KEY não definida!");
    console.error("   Execute: export SUPABASE_SERVICE_ROLE_KEY=sua_key");
    process.exit(1);
}

async function testBackend() {
    console.log("🧪 [TEST] Iniciando teste automatizado...\n");

    const testMessage = "criar receita de pão de queijo";
    const conversationId = `test-${Date.now()}`;
    const deviceId = `test-device-${Date.now()}`;

    console.log(`📤 [TEST] Enviando mensagem: "${testMessage}"`);
    console.log(`📋 [TEST] Conversation ID: ${conversationId}`);
    console.log(`🔧 [TEST] Device ID: ${deviceId}\n`);

    try {
        // Primeiro, criar um usuário teste ou pegar existing user
        console.log("🔑 [TEST] Autenticando...");

        const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "apikey": SERVICE_ROLE_KEY,
            },
            body: JSON.stringify({
                email: `test-${Date.now()}@test.com`,
                password: "test123456"
            })
        });

        const authData = await authResponse.json();
        const userToken = authData.access_token;

        if (!userToken) {
            console.error("❌ Falha ao obter token de autenticação");
            console.error(authData);
            return;
        }

        console.log("✅ [TEST] Autenticado com sucesso\n");

        // Agora chamar a API com token válido
        const response = await fetch(`${SUPABASE_URL}/functions/v1/chat-stream`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${userToken}`,
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
            console.error(`📄 [TEST] Error body:`, errorText.substring(0, 500));
            return;
        }

        // A resposta é um stream - ler até o fim
        const text = await response.text();

        console.log("\n📄 [TEST] Tamanho da resposta:", text.length, "bytes\n");

        // Analisar resposta
        console.log("🔍 [TEST] Análise da resposta:\n");

        // Verificar se tem conteúdo HTML
        const hasHtml = text.includes("<h1>") || text.includes("<html>");
        console.log(`  HTML detectado: ${hasHtml ? "✅ SIM" : "❌ NÃO"}`);

        // Verificar placeholders
        const placeholderMatches = text.match(/\{\{[A-Z_]+\}\}/g);
        const placeholderCount = placeholderMatches ? placeholderMatches.length : 0;
        console.log(`  Placeholders encontrados: ${placeholderCount > 0 ? `⚠️ ${placeholderCount}` : "✅ 0 (bom)"}`);
        if (placeholderCount > 0) {
            console.log(`    Tipos: ${[...new Set(placeholderMatches)].join(", ")}`);
        }

        // Verificar se tem ingredientes reais
        const hasRealIngredients = text.match(/\d+g|\d+ml|ovos|leite|polvilho|queijo/gi);
        console.log(`  Ingredientes reais: ${hasRealIngredients ? `✅ SIM (${hasRealIngredients.length} menções)` : "❌ NÃO"}`);

        // Verificar comandos gerados
        const commandMatches = text.match(/"type":"(navigate|insert_via_api)"/g);
        console.log(`  Comandos gerados: ${commandMatches ? commandMatches.length : 0}`);
        if (commandMatches) {
            commandMatches.forEach(cmd => console.log(`    - ${cmd}`));
        }

        // Verificar tamanho do HTML gerado
        const htmlMatch = text.match(/"value":"([^"]{100,})"/);
        if (htmlMatch) {
            const htmlLength = htmlMatch[1].length;
            console.log(`  Tamanho do HTML insert: ${htmlLength} bytes`);
        }

        // Estados percorridos
        const states = [];
        const stateMatches = text.matchAll(/event: state\s+data: "([^"]+)"/g);
        for (const match of stateMatches) {
            states.push(match[1]);
        }
        console.log(`  Estados: ${states.join(" → ")}`);

        // Extrair e mostrar preview do HTML gerado
        if (htmlMatch) {
            const htmlPreview = htmlMatch[1].substring(0, 500);
            console.log("\n📄 [TEST] Preview do HTML gerado:");
            console.log("─".repeat(80));
            console.log(htmlPreview.replace(/\\n/g, '\n').replace(/\\"/g, '"'));
            console.log("...");
            console.log("─".repeat(80));
        }

        // Resultado final
        console.log("\n📊 [TEST] RESULTADO FINAL:\n");

        if (hasHtml && placeholderCount === 0 && hasRealIngredients) {
            console.log("✅ ✅ ✅ SUCESSO COMPLETO!");
            console.log("   - HTML gerado corretamente");
            console.log("   - SEM placeholders");
            console.log("   - Ingredientes reais detectados");
        } else if (hasHtml && placeholderCount > 0) {
            console.log("⚠️ SUCESSO PARCIAL");
            console.log("   - HTML gerado corretamente");
            console.log(`   - ❌ ${placeholderCount} placeholders encontrados`);
            console.log("   - Documento será criado mas sem conteúdo real");
        } else {
            console.log("❌ FALHA");
            console.log("   - Estrutura incorreta ou sem HTML");
        }

        // Salvar resposta completa para análise
        const fs = require('fs');
        const outputFile = `test-output-${Date.now()}.txt`;
        fs.writeFileSync(outputFile, text);
        console.log(`\n💾 [TEST] Resposta completa salva em: ${outputFile}`);

    } catch (error) {
        console.error("\n❌ [TEST] Erro ao executar teste:", error.message);
        console.error(error.stack);
    }
}

// Executar teste
console.log("🚀 SyncAds Backend - Teste Automatizado v2\n");
testBackend().catch(console.error);
