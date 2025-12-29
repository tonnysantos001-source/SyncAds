import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";

const PLAYWRIGHT_URL = "https://bigodetonton-syncads.hf.space";

/**
 * TESTE 1: Health Check
 * Valida que Playwright está online e rodando
 */
Deno.test("Playwright Health Check", async () => {
    console.log("🔍 [TEST] Verificando saúde do Playwright...");

    const response = await fetch(`${PLAYWRIGHT_URL}/health`);
    const data = await response.json();

    // Assertions
    assertEquals(response.status, 200, "Status deve ser 200");
    assertEquals(data.status, "healthy", "Status deve ser 'healthy'");

    console.log("✅ [PASS] Playwright está online e saudável");
    console.log("   Resposta:", JSON.stringify(data, null, 2));
});
