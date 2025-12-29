// =====================================================
// TESTE AUTOMATIZADO: Playwright Health Check
//  Node.js compatible
// =====================================================

const PLAYWRIGHT_URL = "https://bigodetonton-syncads.hf.space";

async function testPlaywrightHealth() {
    console.log("🔍 [TEST] Verificando saúde do Playwright...\n");

    try {
        const response = await fetch(`${PLAYWRIGHT_URL}/health`);
        const data = await response.json();

        // Validação
        if (response.status !== 200) {
            throw new Error(`Expected status 200, got ${response.status}`);
        }

        if (data.status !== "healthy") {
            throw new Error(`Expected status 'healthy', got '${data.status}'`);
        }

        console.log("✅ [PASS] Playwright está online e saudável");
        console.log("   Status:", data.status);
        console.log("   Resposta completa:", JSON.stringify(data, null, 2));

        return true;
    } catch (error) {
        console.error("❌ [FAIL]", error.message);
        return false;
    }
}

// Execute test
testPlaywrightHealth().then(success => {
    process.exit(success ? 0 : 1);
});
