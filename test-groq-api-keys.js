/**
 * AUDITORIA - Teste de API Keys do Groq
 * Script para testar todas as 5 chaves API do Groq mostradas nas imagens
 */

const API_KEYS = [
  { name: "ygYwAy", key: "será obtida do Groq dashboard" },
  { name: "key SJ", key: "será obtida do Groq dashboard" },
  { name: "key Ser", key: "será obtida do Groq dashboard" },
  { name: "SyncAds 1", key: "será obtida do Groq dashboard" },
  { name: "SyncAdsGy64", key: "será obtida do Groq dashboard" }
];

const GROQ_MODEL = "llama-3.3-70b-versatile";

async function testGroqKey(keyName, apiKey) {
  console.log(`\n🔑 Testando chave: ${keyName}`);
  console.log(`   Key preview: ${apiKey.substring(0, 10)}...`);

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "user", content: "Responda apenas 'OK' se você estiver funcionando." }
        ],
        max_tokens: 10
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`   ❌ ERRO ${response.status}: ${errorText}`);
      return { name: keyName, status: "FALHOU", error: `${response.status}: ${errorText}`, calls: 0 };
    }

    const data = await response.json();
    console.log(`   ✅ SUCESSO! Resposta:`, data.choices[0].message.content);
    
    return { 
      name: keyName, 
      status: "FUNCIONANDO", 
      response: data.choices[0].message.content,
      model: data.model,
      usage: data.usage
    };

  } catch (error) {
    console.error(`   ❌ ERRO DE REDE:`, error.message);
    return { name: keyName, status: "ERRO", error: error.message };
  }
}

async function main() {
  console.log("🚀 INICIANDO TESTE DE API KEYS DO GROQ\n");
  console.log("=" .repeat(60));
  
  console.log("\n⚠️  ATENÇÃO:");
  console.log("   Para executar este teste você precisa:");
  console.log("   1. Acessar https://groq.com/groqcloud");
  console.log("   2. Copiar cada API key completa");
  console.log("   3. Rodar: node test-groq-api-keys.js KEY_1 KEY_2 KEY_3 KEY_4 KEY_5\n");
  
  const args = process.argv.slice(2);
  
  if (args.length < 5) {
    console.error("❌ ERRO: Você deve fornecer as 5 chaves API como argumentos!");
    console.log("\nUso:");
    console.log('   node test-groq-api-keys.js "gsk_..." "gsk_..." "gsk_..." "gsk_..." "gsk_..."');
    process.exit(1);
  }

  const results = [];

  for (let i = 0; i < API_KEYS.length; i++) {
    const result = await testGroqKey(API_KEYS[i].name, args[i]);
    results.push(result);
    await new Promise(r => setTimeout(r, 500)); // Evitar rate limiting
  }

  console.log("\n" + "=".repeat(60));
  console.log("\n📊 RESUMO DOS TESTES:\n");

  const working = results.filter(r => r.status === "FUNCIONANDO");
  const failed = results.filter(r => r.status === "FALHOU" || r.status === "ERRO");

  console.log(`✅ Funcionando: ${working.length}/${results.length}`);
  console.log(`❌ Com problema: ${failed.length}/${results.length}\n`);

  if (working.length > 0) {
    console.log("✅ CHAVES FUNCIONANDO:");
    working.forEach(r => {
      console.log(`   - ${r.name}: ${r.response} (tokens: ${r.usage?.total_tokens || 'N/A'})`);
    });
  }

  if (failed.length > 0) {
    console.log("\n❌ CHAVES COM PROBLEMA:");
    failed.forEach(r => {
      console.log(`   - ${r.name}: ${r.error}`);
    });
  }

  console.log("\n" + "=".repeat(60));
  console.log("\n💡 PRÓXIMOS PASSOS:");
  
  if (failed.length > 0) {
    console.log("   1. Gere novas chaves para substituir as que falharam");
    console.log("   2. Atualize no Groq Dashboard e no banco de dados GlobalAiConnection");
  }
  
  if (working.length > 0) {
    console.log("   3. Verifique qual chave está configurada em cada IA no painel admin");
    console.log("   4. Confirme se as chaves estão marcadas como 'isActive: true'");
  }
}

main().catch(console.error);
