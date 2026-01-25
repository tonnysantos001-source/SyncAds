// TESTE COMPLETO DA API - SyncAds
// Execute com: node TESTE_COMPLETO_API.js

const GROQ_API_KEY = "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";
const SUPABASE_URL = "https://ovskepqggmxlfckxqgbr.supabase.co";

async function testGroqAPI() {
    console.log("\n" + "=".repeat(60));
    console.log("🧪 TESTE 1: API GROQ DIRETA");
    console.log("=".repeat(60));

    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "user", content: "Responda apenas: OK" }],
                max_tokens: 10
            })
        });

        const data = await response.json();

        if (response.ok) {
            console.log("✅ GROQ API: FUNCIONANDO!");
            console.log("   Resposta:", data.choices?.[0]?.message?.content || "OK");
        } else {
            console.log("❌ GROQ API: ERRO!");
            console.log("   Status:", response.status);
            console.log("   Erro:", data.error?.message || JSON.stringify(data));
        }
    } catch (e) {
        console.log("❌ GROQ API: FALHA DE CONEXÃO");
        console.log("   Erro:", e.message);
    }
}

async function testSupabaseEdgeFunction() {
    console.log("\n" + "=".repeat(60));
    console.log("🧪 TESTE 2: SUPABASE EDGE FUNCTION (sem auth)");
    console.log("=".repeat(60));

    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/chat-stream`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
                // Sem Authorization para testar se retorna 401
            },
            body: JSON.stringify({
                message: "ola"
            })
        });

        const text = await response.text();
        console.log("   Status HTTP:", response.status);

        if (response.status === 401) {
            console.log("✅ EDGE FUNCTION: Responde corretamente (401 sem auth)");
        } else if (response.status === 500) {
            console.log("❌ EDGE FUNCTION: Erro 500 (função com bug)");
        } else {
            console.log("   Resposta:", text.substring(0, 200));
        }
    } catch (e) {
        console.log("❌ EDGE FUNCTION: FALHA DE CONEXÃO");
        console.log("   Erro:", e.message);
    }
}

async function testSupabaseAuth() {
    console.log("\n" + "=".repeat(60));
    console.log("🧪 TESTE 3: SUPABASE AUTH API");
    console.log("=".repeat(60));

    try {
        // Testar se o endpoint de auth está funcionando
        const response = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
            headers: {
                "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92c2tlcHFnZ214bGZja3hxZ2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MjQ4NTUsImV4cCI6MjA3NjQwMDg1NX0.UdNgqpTN38An6FuoJPZlj_zLkmAqfJQXb6i1DdTQO_E"
            }
        });

        console.log("   Status HTTP:", response.status);

        if (response.ok) {
            console.log("✅ SUPABASE AUTH: FUNCIONANDO!");
        } else {
            console.log("⚠️ SUPABASE AUTH: Status", response.status);
        }
    } catch (e) {
        console.log("❌ SUPABASE AUTH: FALHA");
        console.log("   Erro:", e.message);
    }
}

async function testDatabaseConnection() {
    console.log("\n" + "=".repeat(60));
    console.log("🧪 TESTE 4: ACESSO AO BANCO (GlobalAiConnection)");
    console.log("=".repeat(60));

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/GlobalAiConnection?provider=eq.GROQ&select=name,provider,isActive&limit=5`, {
            headers: {
                "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92c2tlcHFnZ214bGZja3hxZ2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MjQ4NTUsImV4cCI6MjA3NjQwMDg1NX0.UdNgqpTN38An6FuoJPZlj_zLkmAqfJQXb6i1DdTQO_E"
            }
        });

        const data = await response.json();
        console.log("   Status HTTP:", response.status);

        if (response.ok && Array.isArray(data)) {
            console.log("✅ BANCO: ACESSÍVEL!");
            console.log(`   ${data.length} IAs encontradas:`);
            data.forEach((ia, i) => {
                console.log(`   ${i + 1}. ${ia.name} - ${ia.isActive ? "ATIVO" : "INATIVO"}`);
            });
        } else {
            console.log("❌ BANCO: Erro ao acessar");
            console.log("   Resposta:", JSON.stringify(data).substring(0, 200));
        }
    } catch (e) {
        console.log("❌ BANCO: FALHA");
        console.log("   Erro:", e.message);
    }
}

async function runAllTests() {
    console.log("\n");
    console.log("╔════════════════════════════════════════════════════════════╗");
    console.log("║       AUDITORIA COMPLETA SyncAds - " + new Date().toLocaleString() + "       ║");
    console.log("╚════════════════════════════════════════════════════════════╝");

    await testGroqAPI();
    await testSupabaseAuth();
    await testDatabaseConnection();
    await testSupabaseEdgeFunction();

    console.log("\n" + "=".repeat(60));
    console.log("📋 RESUMO DA AUDITORIA");
    console.log("=".repeat(60));
    console.log("Execute os testes acima e verifique quais passaram (✅) e falharam (❌)");
    console.log("\nSe GROQ API funciona mas Edge Function falha:");
    console.log("  → Problema está no código do chat-stream ou deploy");
    console.log("\nSe Banco falha:");
    console.log("  → Problema pode ser RLS policies ou permissões");
    console.log("\n");
}

runAllTests();
