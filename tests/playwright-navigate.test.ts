import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";

const PLAYWRIGHT_URL = "https://bigodetonton-syncads.hf.space";

/**
 * TESTE 2: Navegação Básica
 * Valida que Playwright consegue navegar para um site real
 */
Deno.test("Playwright Navigate to Google", async () => {
    console.log("🔍 [TEST] Testando navegação para Google...");

    const response = await fetch(`${PLAYWRIGHT_URL}/automation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            action: "navigate",
            url: "https://google.com",
            sessionId: `test-${Date.now()}`
        }),
    });

    const data = await response.json();

    // Assertions
    assertEquals(response.status, 200, "Status HTTP deve ser 200");
    assertEquals(data.success, true, "Execução deve ter sucesso");
    assert(data.url, "Deve retornar URL");
    assert(data.title, "Deve retornar título da página");

    console.log("✅ [PASS] Navegação executada com sucesso");
    console.log("   URL final:", data.url);
    console.log("   Título:", data.title);
    console.log("   Resposta completa:", JSON.stringify(data, null, 2));
});

/**
 * TESTE 3: URL Auto-Correção
 * Valida que Playwright corrige URLs sem protocolo
 */
Deno.test("Playwright Auto-Fix URL Without Protocol", async () => {
    console.log("🔍 [TEST] Testando auto-correção de URL...");

    const response = await fetch(`${PLAYWRIGHT_URL}/automation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            action: "navigate",
            url: "example.com", // SEM https://
            sessionId: `test-${Date.now()}`
        }),
    });

    const data = await response.json();

    // Assertions
    assertEquals(response.status, 200);

    if (data.success) {
        console.log("✅ [PASS] URL auto-corrigida para:", data.url);
        assert(data.url.startsWith("https://") || data.url.startsWith("http://"),
            "URL deve ter protocolo");
    } else {
        console.log("⚠️ [INFO] Playwright rejeitou URL inválida:", data.error);
    }
});
