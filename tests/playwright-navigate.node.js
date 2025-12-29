// =====================================================
// TESTE AUTOMATIZADO: Playwright Navigate Test
// Node.js compatible
// =====================================================

const PLAYWRIGHT_URL = "https://bigodetonton-syncads.hf.space";

async function testPlaywrightNavigate() {
    console.log("🔍 [TEST] Testando navegação para Google...\n");

    try {
        const sessionId = `test-node-${Date.now()}`;

        const response = await fetch(`${PLAYWRIGHT_URL}/automation`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                action: "navigate",
                url: "https://google.com",
                sessionId: sessionId
            }),
        });

        const data = await response.json();

        // Validação
        if (response.status !== 200) {
            throw new Error(`Expected status 200, got ${response.status}`);
        }

        if (!data.success) {
            throw new Error(`Navigation failed: ${data.error || 'Unknown error'}`);
        }

        if (!data.url) {
            throw new Error("Response missing 'url' field");
        }

        if (!data.title) {
            throw new Error("Response missing 'title' field");
        }

        console.log("✅ [PASS] Navegação executada COM SUCESSO");
        console.log("   SessionId:", sessionId);
        console.log("   URL final:", data.url);
        console.log("   Título:", data.title);
        console.log("\n📊 Resposta completa:", JSON.stringify(data, null, 2));

        return true;
    } catch (error) {
        console.error("❌ [FAIL]", error.message);
        return false;
    }
}

// Execute test
testPlaywrightNavigate().then(success => {
    process.exit(success ? 0 : 1);
});
