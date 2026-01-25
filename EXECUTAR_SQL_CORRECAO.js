// EXECUTAR SQL VIA SUPABASE REST API
// node EXECUTAR_SQL_CORRECAO.js

const SUPABASE_URL = "https://ovskepqggmxlfckxqgbr.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Você precisa passar a SERVICE_ROLE_KEY como variável de ambiente
// Encontre em: Supabase Dashboard → Settings → API → service_role key

async function executarSQL() {
    console.log("🔧 Executando SQL de correção RLS...\n");

    if (!SUPABASE_SERVICE_KEY) {
        console.log("⚠️ SUPABASE_SERVICE_ROLE_KEY não definida!");
        console.log("");
        console.log("Execute assim:");
        console.log("  $env:SUPABASE_SERVICE_ROLE_KEY='SUA_KEY_AQUI'");
        console.log("  node EXECUTAR_SQL_CORRECAO.js");
        console.log("");
        console.log("Ou copie e cole o SQL diretamente no dashboard:");
        console.log("  https://ovskepqggmxlfckxqgbr.supabase.co → SQL Editor");
        return;
    }

    const sqls = [
        // Remover policies antigas
        `DROP POLICY IF EXISTS "GlobalAiConnection_select" ON "GlobalAiConnection"`,
        `DROP POLICY IF EXISTS "GlobalAiConnection_read" ON "GlobalAiConnection"`,
        `DROP POLICY IF EXISTS "allow_read_global_ai" ON "GlobalAiConnection"`,
        `DROP POLICY IF EXISTS "enable_read_for_authenticated" ON "GlobalAiConnection"`,
        `DROP POLICY IF EXISTS "allow_read_global_ai_connections" ON "GlobalAiConnection"`,

        // Criar nova policy
        `CREATE POLICY "allow_read_global_ai_connections" ON "GlobalAiConnection" FOR SELECT TO authenticated, anon, service_role USING (true)`,

        // Garantir RLS ativo
        `ALTER TABLE "GlobalAiConnection" ENABLE ROW LEVEL SECURITY`,

        // Permissões
        `GRANT SELECT ON "GlobalAiConnection" TO authenticated`,
        `GRANT SELECT ON "GlobalAiConnection" TO anon`,
        `GRANT ALL ON "GlobalAiConnection" TO service_role`
    ];

    for (const sql of sqls) {
        try {
            console.log(`Executando: ${sql.substring(0, 60)}...`);

            const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/execute_sql`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": SUPABASE_SERVICE_KEY,
                    "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`
                },
                body: JSON.stringify({ query: sql })
            });

            if (response.ok) {
                console.log("  ✅ OK");
            } else {
                const text = await response.text();
                console.log(`  ⚠️ Status ${response.status}: ${text.substring(0, 100)}`);
            }
        } catch (e) {
            console.log(`  ❌ Erro: ${e.message}`);
        }
    }

    // Verificar resultado
    console.log("\n🔍 Verificando IAs no banco...");
    const checkResponse = await fetch(`${SUPABASE_URL}/rest/v1/GlobalAiConnection?provider=eq.GROQ&select=name,provider,isActive`, {
        headers: {
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`
        }
    });

    const ias = await checkResponse.json();
    console.log(`\n✅ Total de IAs encontradas: ${ias.length}`);
    if (Array.isArray(ias)) {
        ias.forEach((ia, i) => {
            console.log(`  ${i + 1}. ${ia.name} - ${ia.isActive ? "ATIVO" : "INATIVO"}`);
        });
    }
}

executarSQL();
