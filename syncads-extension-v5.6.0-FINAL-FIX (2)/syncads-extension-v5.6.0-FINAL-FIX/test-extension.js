// ==========================================
// SYNCADS EXTENSION - SCRIPT DE TESTE
// Execute este arquivo no Console do navegador
// ==========================================

const TEST_CONFIG = {
  apiUrl: "https://syncads-python-microservice-production.up.railway.app",
  testUserId: "267cec04-2d3b-451f-9971-d3b6b5a43ab5", // Substitua pelo seu UUID real
  testDeviceId: "test-device-" + Date.now(),
};

console.log("🧪 INICIANDO TESTES DA EXTENSÃO SYNCADS");
console.log("==========================================\n");

// ==========================================
// TESTE 1: Health Check do Backend
// ==========================================
async function test1_healthCheck() {
  console.log("📋 TESTE 1: Health Check do Backend");
  console.log("   URL:", TEST_CONFIG.apiUrl + "/api/extension/health");

  try {
    const response = await fetch(TEST_CONFIG.apiUrl + "/api/extension/health");
    const data = await response.json();

    if (response.ok) {
      console.log("   ✅ Backend está ONLINE");
      console.log("   📦 Resposta:", data);
      return { success: true, data };
    } else {
      console.error("   ❌ Backend retornou erro:", response.status);
      return { success: false, error: `Status ${response.status}` };
    }
  } catch (error) {
    console.error("   ❌ Erro ao conectar ao backend:", error.message);
    return { success: false, error: error.message };
  }
}

// ==========================================
// TESTE 2: Registro de Dispositivo
// ==========================================
async function test2_registerDevice() {
  console.log("\n📋 TESTE 2: Registro de Dispositivo");

  const payload = {
    deviceId: TEST_CONFIG.testDeviceId,
    userId: TEST_CONFIG.testUserId,
    browser: {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
    },
    version: "1.0.0",
    timestamp: Date.now(),
  };

  console.log("   📤 Enviando:", JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(TEST_CONFIG.apiUrl + "/api/extension/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    console.log("   📥 Status:", response.status);

    if (response.ok) {
      const data = await response.json();
      console.log("   ✅ Dispositivo registrado com sucesso");
      console.log("   📦 Resposta:", data);
      return { success: true, data };
    } else {
      const errorText = await response.text();
      console.error("   ❌ Erro ao registrar:", errorText);
      return { success: false, error: errorText };
    }
  } catch (error) {
    console.error("   ❌ Erro na requisição:", error.message);
    return { success: false, error: error.message };
  }
}

// ==========================================
// TESTE 3: Buscar Comandos
// ==========================================
async function test3_getCommands() {
  console.log("\n📋 TESTE 3: Buscar Comandos");

  try {
    const response = await fetch(
      TEST_CONFIG.apiUrl + "/api/extension/commands/" + TEST_CONFIG.testDeviceId
    );

    console.log("   📥 Status:", response.status);

    if (response.ok) {
      const data = await response.json();
      console.log("   ✅ Comandos obtidos com sucesso");
      console.log("   📦 Total de comandos:", data.count);
      console.log("   📦 Comandos:", data.commands);
      return { success: true, data };
    } else {
      const errorText = await response.text();
      console.error("   ❌ Erro ao buscar comandos:", errorText);
      return { success: false, error: errorText };
    }
  } catch (error) {
    console.error("   ❌ Erro na requisição:", error.message);
    return { success: false, error: error.message };
  }
}

// ==========================================
// TESTE 4: Enviar Log
// ==========================================
async function test4_sendLog() {
  console.log("\n📋 TESTE 4: Enviar Log");

  const payload = {
    deviceId: TEST_CONFIG.testDeviceId,
    userId: TEST_CONFIG.testUserId,
    level: "info",
    message: "Teste de log da extensão",
    data: {
      test: true,
      timestamp: Date.now(),
    },
  };

  try {
    const response = await fetch(TEST_CONFIG.apiUrl + "/api/extension/log", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    console.log("   📥 Status:", response.status);

    if (response.ok) {
      const data = await response.json();
      console.log("   ✅ Log enviado com sucesso");
      console.log("   📦 Resposta:", data);
      return { success: true, data };
    } else {
      const errorText = await response.text();
      console.error("   ❌ Erro ao enviar log:", errorText);
      return { success: false, error: errorText };
    }
  } catch (error) {
    console.error("   ❌ Erro na requisição:", error.message);
    return { success: false, error: error.message };
  }
}

// ==========================================
// TESTE 5: Verificar Estado da Extensão
// ==========================================
async function test5_checkExtensionState() {
  console.log("\n📋 TESTE 5: Verificar Estado da Extensão");

  try {
    const result = await chrome.storage.local.get([
      "deviceId",
      "userId",
      "isConnected",
      "lastConnected",
    ]);

    console.log("   📦 Estado atual:", result);

    if (result.deviceId && result.userId) {
      console.log("   ✅ Extensão está configurada");
      console.log("   🆔 Device ID:", result.deviceId);
      console.log("   👤 User ID:", result.userId);
      console.log("   🔌 Conectado:", result.isConnected ? "SIM" : "NÃO");
      if (result.lastConnected) {
        const lastConnectedDate = new Date(result.lastConnected);
        console.log("   ⏰ Última conexão:", lastConnectedDate.toLocaleString());
      }
      return { success: true, data: result };
    } else {
      console.log("   ⚠️ Extensão NÃO está configurada");
      return { success: false, error: "Extensão não configurada" };
    }
  } catch (error) {
    console.error("   ❌ Erro ao verificar estado:", error.message);
    return { success: false, error: error.message };
  }
}

// ==========================================
// TESTE 6: Verificar localStorage (Auth)
// ==========================================
async function test6_checkLocalStorage() {
  console.log("\n📋 TESTE 6: Verificar localStorage (Detecção de Auth)");

  const keys = Object.keys(localStorage);
  console.log("   🔢 Total de chaves:", keys.length);

  // Buscar chaves relacionadas ao Supabase
  const supabaseKeys = keys.filter(
    (key) =>
      key.includes("sb-") ||
      key.includes("supabase") ||
      key.includes("__supabase")
  );

  console.log("   🔑 Chaves Supabase encontradas:", supabaseKeys.length);

  if (supabaseKeys.length > 0) {
    console.log("   📋 Lista de chaves Supabase:");
    supabaseKeys.forEach((key) => {
      const value = localStorage.getItem(key);
      console.log(`      - ${key}: [${value ? value.length : 0} chars]`);

      // Tentar extrair user
      try {
        const parsed = JSON.parse(value);
        const user =
          parsed?.user ||
          parsed?.currentUser ||
          parsed?.data?.user ||
          parsed?.session?.user;

        if (user && user.id) {
          console.log(`         ✅ User encontrado: ${user.id}`);
          console.log(`         📧 Email: ${user.email || "N/A"}`);
        }
      } catch (e) {
        // Não é JSON válido
      }
    });

    return { success: true, keys: supabaseKeys };
  } else {
    console.log("   ⚠️ Nenhuma chave Supabase encontrada");
    console.log("   💡 Dica: Faça login no app primeiro");
    return { success: false, error: "Sem chaves Supabase" };
  }
}

// ==========================================
// TESTE 7: Enviar Mensagem ao Background
// ==========================================
async function test7_sendMessageToBackground() {
  console.log("\n📋 TESTE 7: Comunicação com Background Script");

  try {
    const response = await chrome.runtime.sendMessage({ type: "GET_STATE" });
    console.log("   ✅ Mensagem enviada com sucesso");
    console.log("   📦 Estado do background:", response);
    console.log("   🆔 Device ID:", response.deviceId);
    console.log("   👤 User ID:", response.userId);
    console.log("   🔌 Conectado:", response.isConnected ? "SIM" : "NÃO");
    console.log("   📊 Estatísticas:", response.stats);
    return { success: true, data: response };
  } catch (error) {
    console.error("   ❌ Erro ao comunicar com background:", error.message);
    return { success: false, error: error.message };
  }
}

// ==========================================
// EXECUTAR TODOS OS TESTES
// ==========================================
async function runAllTests() {
  console.log("🚀 EXECUTANDO TODOS OS TESTES...\n");

  const results = {
    test1: await test1_healthCheck(),
    test2: await test2_registerDevice(),
    test3: await test3_getCommands(),
    test4: await test4_sendLog(),
    test5: await test5_checkExtensionState(),
    test6: await test6_checkLocalStorage(),
    test7: await test7_sendMessageToBackground(),
  };

  // Relatório final
  console.log("\n==========================================");
  console.log("📊 RELATÓRIO FINAL");
  console.log("==========================================\n");

  const tests = [
    { name: "Health Check Backend", key: "test1" },
    { name: "Registro de Dispositivo", key: "test2" },
    { name: "Buscar Comandos", key: "test3" },
    { name: "Enviar Log", key: "test4" },
    { name: "Estado da Extensão", key: "test5" },
    { name: "Detecção de Auth", key: "test6" },
    { name: "Comunicação Background", key: "test7" },
  ];

  let successCount = 0;
  let failCount = 0;

  tests.forEach((test) => {
    const result = results[test.key];
    const icon = result.success ? "✅" : "❌";
    console.log(`${icon} ${test.name}`);

    if (result.success) {
      successCount++;
    } else {
      failCount++;
      if (result.error) {
        console.log(`   Erro: ${result.error}`);
      }
    }
  });

  console.log("\n==========================================");
  console.log(`✅ Testes bem-sucedidos: ${successCount}/${tests.length}`);
  console.log(`❌ Testes falharam: ${failCount}/${tests.length}`);
  console.log("==========================================\n");

  // Diagnóstico
  if (failCount > 0) {
    console.log("🔍 DIAGNÓSTICO:");
    console.log("");

    if (!results.test1.success) {
      console.log("❌ Backend não está acessível:");
      console.log("   1. Verifique se o Railway está online");
      console.log("   2. Acesse: https://railway.app");
      console.log("   3. Verifique os logs do serviço");
      console.log("");
    }

    if (!results.test2.success) {
      console.log("❌ Erro ao registrar dispositivo:");
      console.log("   1. Verifique as variáveis de ambiente no Railway:");
      console.log("      - SUPABASE_URL");
      console.log("      - SUPABASE_SERVICE_ROLE_KEY");
      console.log("   2. Verifique se as tabelas foram criadas no Supabase");
      console.log("   3. Execute o script: criar-tabelas-supabase.sql");
      console.log("");
    }

    if (!results.test5.success) {
      console.log("❌ Extensão não configurada:");
      console.log("   1. Recarregue a extensão em chrome://extensions/");
      console.log("   2. Verifique se o background script está rodando");
      console.log("   3. Clique no ícone da extensão e tente conectar");
      console.log("");
    }

    if (!results.test6.success) {
      console.log("❌ Auth não detectado:");
      console.log("   1. Faça login em https://syncads.com.br");
      console.log("   2. Aguarde alguns segundos");
      console.log("   3. Execute este teste novamente");
      console.log("");
    }

    if (!results.test7.success) {
      console.log("❌ Não consegue comunicar com background:");
      console.log("   1. Verifique se a extensão está carregada");
      console.log("   2. Recarregue a extensão");
      console.log("   3. Verifique o console do service worker");
      console.log("");
    }
  } else {
    console.log("🎉 TODOS OS TESTES PASSARAM!");
    console.log("✅ A extensão está funcionando corretamente!");
    console.log("");
    console.log("Próximos passos:");
    console.log("1. Teste criar comandos via IA");
    console.log("2. Verifique a execução dos comandos");
    console.log("3. Monitore os logs no Supabase");
  }

  return results;
}

// ==========================================
// FUNÇÃO DE LIMPEZA (opcional)
// ==========================================
async function cleanup() {
  console.log("\n🧹 Limpando dados de teste...");

  try {
    await chrome.storage.local.remove([
      "deviceId",
      "userId",
      "isConnected",
      "lastConnected",
    ]);
    console.log("✅ Dados limpos com sucesso");
  } catch (error) {
    console.error("❌ Erro ao limpar dados:", error);
  }
}

// ==========================================
// EXPORTAR FUNÇÕES
// ==========================================
window.SyncAdsTest = {
  runAllTests,
  test1_healthCheck,
  test2_registerDevice,
  test3_getCommands,
  test4_sendLog,
  test5_checkExtensionState,
  test6_checkLocalStorage,
  test7_sendMessageToBackground,
  cleanup,
};

// ==========================================
// AUTO-EXECUÇÃO
// ==========================================
console.log("\n💡 COMO USAR:");
console.log("   SyncAdsTest.runAllTests()     - Executar todos os testes");
console.log("   SyncAdsTest.test1_healthCheck() - Testar apenas health check");
console.log("   SyncAdsTest.cleanup()          - Limpar dados de teste");
console.log("\n");

// Executar automaticamente se solicitado
if (window.location.search.includes("autotest=true")) {
  console.log("🤖 Executando testes automaticamente...\n");
  runAllTests();
}
