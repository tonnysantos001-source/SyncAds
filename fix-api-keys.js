// SOLUÇÃO FINAL: Inserir Groq API Keys no GlobalAiConnection
// 
// USO: node fix-api-keys.js <SERVICE_ROLE_KEY>
//
// Service Role Key: Encontre em https://supabase.com/dashboard/project/ovskepqggmxlfckxqgbr/settings/api
// (Procure por "service_role" - é uma key secreta que começa com "eyJ...")

const SUPABASE_URL = "https://ovskepqggmxlfckxqgbr.supabase.co";
const SERVICE_ROLE_KEY = process.argv[2];

if (!SERVICE_ROLE_KEY) {
    console.error("❌ ERRO: Service Role Key é obrigatória!");
    console.error("\n📖 USO:");
    console.error("   node fix-api-keys.js <SERVICE_ROLE_KEY>");
    console.error("\n🔑 Encontre a service_role key em:");
    console.error("   https://supabase.com/dashboard/project/ovskepqggmxlfckxqgbr/settings/api");
    console.error("   (Procure por 'service_role' - é secreta)");
    process.exit(1);
}

const apiKeys = [
    {
        name: "Groq Chat-Stream - Llama 3.3 70B",
        provider: "GROQ",
        model: "llama-3.3-70b-versatile",
        apiKey: "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",
        baseUrl: "https://api.groq.com/openai/v1",
        maxTokens: 4096,
        temperature: "0.70",
        isActive: true,
        aiRole: "EXECUTOR"
    }
];

async function fixKeys() {
    console.log("🔧 Corrigindo API Keys no GlobalAiConnection...\n");

    // 1. Verificar estado atual
    console.log("1️⃣ Verificando tabela atual...");
    const checkResponse = await fetch(`${SUPABASE_URL}/rest/v1/GlobalAiConnection?select=count`, {
        headers: {
            "apikey": SERVICE_ROLE_KEY,
            "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
            "Prefer": "count=exact"
        }
    });

    const currentCount = checkResponse.headers.get("content-range")?.split("/")[1] || "0";
    console.log(`   Registros atuais: ${currentCount}\n`);

    // 2. Inserir chaves
    console.log("2️⃣ Inserindo API keys...");

    for (let i = 0; i < apiKeys.length; i++) {
        const key = apiKeys[i];
        console.log(`\n   [${i + 1}/${apiKeys.length}] ${key.name}`);

        const response = await fetch(`${SUPABASE_URL}/rest/v1/GlobalAiConnection`, {
            method: "POST",
            headers: {
                "apikey": SERVICE_ROLE_KEY,
                "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
                "Content-Type": "application/json",
                "Prefer": "return=representation"
            },
            body: JSON.stringify(key)
        });

        if (!response.ok) {
            const error = await response.text();
            console.error(`   ❌ Falhou: ${response.status} - ${error}`);
        } else {
            const result = await response.json();
            console.log(`   ✅ Inserida! ID: ${result[0]?.id}`);
        }
    }

    // 3. Verificar resultado final
    console.log("\n3️⃣ Verificando resultado final...");
    const finalResponse = await fetch(`${SUPABASE_URL}/rest/v1/GlobalAiConnection?provider=eq.GROQ&isActive=eq.true&select=name,model`, {
        headers: {
            "apikey": SERVICE_ROLE_KEY,
            "Authorization": `Bearer ${SERVICE_ROLE_KEY}`
        }
    });

    const keys = await finalResponse.json();
    console.log(`\n✅ ${keys.length} chave(s) ativa(s) encontrada(s):`);
    keys.forEach((k, i) => {
        console.log(`   ${i + 1}. ${k.name} (${k.model})`);
    });

    console.log("\n🎉 CONCLUÍDO!");
    console.log("\n📝 PRÓXIMOS PASSOS:");
    console.log("   1. Reload a extensão Chrome");
    console.log("   2. Teste: 'crie uma receita de bolo'");
    console.log("   3. Deve funcionar agora! ✅");
}

fixKeys().catch(err => {
    console.error("\n💥 ERRO FATAL:", err.message);
    process.exit(1);
});
