// ============================================
// SCRIPT DE TESTE DOM - EXTENSÃO CHROME
// Testa todos os comandos DOM
// ============================================

console.log("🧪 Iniciando teste de comandos DOM...");

/**
 * Testa um comando DOM individual
 */
async function testDomCommand(commandName, message) {
    console.log(`\n📝 Testando: ${commandName}`);
    console.log(`   Mensagem: ${JSON.stringify(message)}`);

    return new Promise((resolve) => {
        chrome.runtime.sendMessage(message, (response) => {
            if (chrome.runtime.lastError) {
                console.error(`   ❌ Erro: ${chrome.runtime.lastError.message}`);
                resolve({ success: false, error: chrome.runtime.lastError.message });
            } else {
                console.log(`   ✅ Resposta:`, response);
                resolve({ success: true, data: response });
            }
        });
    });
}

/**
 * Executa todos os testes
 */
async function runAllTests() {
    console.log("=" + "=".repeat(60));
    console.log("🔍 TESTE COMPLETO DE COMANDOS DOM");
    console.log("📅", new Date().toLocaleString());
    console.log("=" + "=".repeat(60));

    const tests = [
        {
            name: "DOM_STATUS - Verificar status",
            message: { type: "DOM_STATUS" }
        },
        {
            name: "DOM_ACTIVATE - Ativar modo DOM",
            message: {
                type: "DOM_ACTIVATE",
                message: "Teste de ativação DOM"
            }
        },
        {
            name: "DOM_UPDATE_MESSAGE - Atualizar mensagem",
            message: {
                type: "DOM_UPDATE_MESSAGE",
                message: "Mensagem atualizada com sucesso"
            }
        },
        {
            name: "EXECUTE_DOM_ACTION - NAVIGATE",
            message: {
                type: "EXECUTE_DOM_ACTION",
                action: "NAVIGATE",
                params: { url: "https://google.com" }
            }
        },
        {
            name: "EXECUTE_DOM_ACTION - SCROLL",
            message: {
                type: "EXECUTE_DOM_ACTION",
                action: "SCROLL",
                params: { y: 100 }
            }
        },
        {
            name: "EXECUTE_DOM_ACTION - GET_TEXT (body)",
            message: {
                type: "EXECUTE_DOM_ACTION",
                action: "GET_TEXT",
                params: { selector: "body" }
            }
        },
        {
            name: "DOM_DEACTIVATE - Desativar modo DOM",
            message: { type: "DOM_DEACTIVATE" }
        }
    ];

    const results = {
        success: [],
        failed: []
    };

    for (const test of tests) {
        const result = await testDomCommand(test.name, test.message);

        if (result.success) {
            results.success.push(test.name);
        } else {
            results.failed.push({ name: test.name, error: result.error });
        }

        // Aguardar 1s entre testes
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Resumo
    console.log("\n" + "=" + "=".repeat(60));
    console.log("📊 RESUMO DOS TESTES:");
    console.log("=" + "=".repeat(60));
    console.log(`✅ Sucesso: ${results.success.length}/${tests.length}`);
    console.log(`❌ Falhas:  ${results.failed.length}/${tests.length}`);
    console.log(`📈 Taxa:    ${(results.success.length / tests.length * 100).toFixed(1)}%`);

    if (results.failed.length > 0) {
        console.log("\n❌ COMANDOS COM FALHA:");
        results.failed.forEach(f => {
            console.log(`   • ${f.name}: ${f.error}`);
        });
    }

    console.log("\n" + "=" + "=".repeat(60));

    return results;
}

// ==========================================
// EXECUTAR TESTES
// ==========================================
console.log("\n🚀 Iniciando bateria de testes em 3 segundos...");
console.log("⚠️  Certifique-se de estar em uma página web válida\n");

setTimeout(() => {
    runAllTests().then(results => {
        console.log("\n✅ Testes concluídos!");
        console.log("📋 Resultados salvos na variável 'testResults'");
        window.testResults = results;
    });
}, 3000);
