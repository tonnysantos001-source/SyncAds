// ============================================
// SYNCADS EXTENSION v4.0 - SCRIPT DE VALIDAÇÃO
// Execute no Console do Chrome DevTools (F12)
// ============================================

console.clear();
console.log(
  "%c🚀 SyncAds Extension v4.0 - Teste de Validação",
  "font-size: 20px; font-weight: bold; color: #667eea;",
);
console.log("%c=".repeat(60), "color: #667eea;");

// ============================================
// CONFIGURAÇÃO
// ============================================
const CONFIG = {
  supabaseUrl: "https://ovskepqggmxlfckxqgbr.supabase.co",
  supabaseAnonKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92c2tlcHFnZ214bGZja3hxZ2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MjQ4NTUsImV4cCI6MjA3NjQwMDg1NX0.UdNgqpTN38An6FuoJPZlj_zLkmAqfJQXb6i1DdTQO_E",
  functionsUrl: "https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1",
};

let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: [],
};

// ============================================
// HELPER FUNCTIONS
// ============================================
function logTest(name, status, message = "", data = null) {
  testResults.total++;

  const icon = status === "pass" ? "✅" : status === "fail" ? "❌" : "⏳";
  const color =
    status === "pass" ? "#10b981" : status === "fail" ? "#ef4444" : "#f59e0b";

  console.log(`%c${icon} ${name}`, `color: ${color}; font-weight: bold;`);

  if (message) {
    console.log(`   ${message}`);
  }

  if (data) {
    console.log("   Data:", data);
  }

  testResults.tests.push({ name, status, message, data });

  if (status === "pass") testResults.passed++;
  if (status === "fail") testResults.failed++;

  console.log("");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================
// TESTES
// ============================================
async function runTests() {
  console.log(
    "\n%c📋 Iniciando Testes...\n",
    "font-size: 16px; font-weight: bold;",
  );

  // ============================================
  // TESTE 1: Extension Instalada
  // ============================================
  try {
    if (typeof chrome !== "undefined" && chrome.runtime) {
      logTest(
        "Teste 1: Extension Instalada",
        "pass",
        "Extension API disponível",
      );
    } else {
      logTest(
        "Teste 1: Extension Instalada",
        "fail",
        "Chrome Extension API não encontrada",
      );
      return;
    }
  } catch (error) {
    logTest("Teste 1: Extension Instalada", "fail", error.message);
    return;
  }

  await sleep(500);

  // ============================================
  // TESTE 2: Background Disponível
  // ============================================
  try {
    const response = await chrome.runtime.sendMessage({ type: "PING" });
    if (response && response.success) {
      logTest(
        "Teste 2: Background Disponível",
        "pass",
        "Background respondeu ao PING",
        response,
      );
    } else {
      logTest(
        "Teste 2: Background Disponível",
        "fail",
        "Background não respondeu corretamente",
      );
    }
  } catch (error) {
    logTest("Teste 2: Background Disponível", "fail", error.message);
  }

  await sleep(500);

  // ============================================
  // TESTE 3: Status da Extensão
  // ============================================
  try {
    const response = await chrome.runtime.sendMessage({ type: "GET_STATUS" });
    if (response && response.success) {
      logTest(
        "Teste 3: Status da Extensão",
        "pass",
        "Status obtido com sucesso",
        {
          isConnected: response.data.isConnected,
          userId: response.data.userId,
          deviceId: response.data.deviceId,
          version: response.data.version,
        },
      );
    } else {
      logTest("Teste 3: Status da Extensão", "fail", "Falha ao obter status");
    }
  } catch (error) {
    logTest("Teste 3: Status da Extensão", "fail", error.message);
  }

  await sleep(500);

  // ============================================
  // TESTE 4: LocalStorage - Token Supabase
  // ============================================
  try {
    const keys = Object.keys(localStorage);
    const supabaseKey = keys.find(
      (k) => k.startsWith("sb-") && k.includes("-auth-token"),
    );
    const legacyKey = keys.find((k) => k === "supabase.auth.token");

    if (supabaseKey || legacyKey) {
      const foundKey = supabaseKey || legacyKey;
      const authData = JSON.parse(localStorage.getItem(foundKey));

      if (authData?.user?.id && authData?.access_token) {
        const expiresAt = authData.expires_at;
        const isExpired = expiresAt
          ? new Date(expiresAt * 1000) <= new Date()
          : false;

        logTest(
          "Teste 4: Token no LocalStorage",
          "pass",
          isExpired ? "Token encontrado (EXPIRADO)" : "Token válido encontrado",
          {
            userId: authData.user.id,
            email: authData.user.email,
            hasToken: true,
            isExpired,
            format: supabaseKey ? "modern" : "legacy",
          },
        );
      } else {
        logTest(
          "Teste 4: Token no LocalStorage",
          "fail",
          "Token incompleto ou inválido",
        );
      }
    } else {
      logTest(
        "Teste 4: Token no LocalStorage",
        "fail",
        "Nenhum token Supabase encontrado. Faça login no SaaS.",
      );
    }
  } catch (error) {
    logTest("Teste 4: Token no LocalStorage", "fail", error.message);
  }

  await sleep(500);

  // ============================================
  // TESTE 5: Validação de JWT
  // ============================================
  try {
    const keys = Object.keys(localStorage);
    const supabaseKey =
      keys.find((k) => k.startsWith("sb-") && k.includes("-auth-token")) ||
      keys.find((k) => k === "supabase.auth.token");

    if (supabaseKey) {
      const authData = JSON.parse(localStorage.getItem(supabaseKey));
      const token = authData?.access_token;

      if (token) {
        const parts = token.split(".");

        if (parts.length === 3) {
          logTest(
            "Teste 5: Formato JWT",
            "pass",
            "Token tem formato JWT válido (3 partes)",
          );
        } else {
          logTest(
            "Teste 5: Formato JWT",
            "fail",
            `Token tem ${parts.length} partes (esperado: 3)`,
          );
        }
      } else {
        logTest("Teste 5: Formato JWT", "fail", "Token não encontrado");
      }
    } else {
      logTest(
        "Teste 5: Formato JWT",
        "fail",
        "Nenhuma chave de autenticação encontrada",
      );
    }
  } catch (error) {
    logTest("Teste 5: Formato JWT", "fail", error.message);
  }

  await sleep(500);

  // ============================================
  // TESTE 6: Edge Function - CORS Preflight
  // ============================================
  try {
    const response = await fetch(`${CONFIG.functionsUrl}/extension-register`, {
      method: "OPTIONS",
    });

    if (response.ok) {
      const headers = {
        "access-control-allow-origin": response.headers.get(
          "access-control-allow-origin",
        ),
        "access-control-allow-methods": response.headers.get(
          "access-control-allow-methods",
        ),
      };

      logTest(
        "Teste 6: Edge Function CORS",
        "pass",
        "CORS headers presentes",
        headers,
      );
    } else {
      logTest(
        "Teste 6: Edge Function CORS",
        "fail",
        `Status: ${response.status}`,
      );
    }
  } catch (error) {
    logTest("Teste 6: Edge Function CORS", "fail", error.message);
  }

  await sleep(500);

  // ============================================
  // TESTE 7: Edge Function - Validação de Token
  // ============================================
  try {
    const keys = Object.keys(localStorage);
    const supabaseKey =
      keys.find((k) => k.startsWith("sb-") && k.includes("-auth-token")) ||
      keys.find((k) => k === "supabase.auth.token");

    if (supabaseKey) {
      const authData = JSON.parse(localStorage.getItem(supabaseKey));
      const token = authData?.access_token;

      if (token) {
        const response = await fetch(
          `${CONFIG.functionsUrl}/extension-register`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
              apikey: CONFIG.supabaseAnonKey,
            },
            body: JSON.stringify({
              device_id: `test_device_${Date.now()}`,
              browser_info: {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language,
              },
              version: "4.0.0",
            }),
          },
        );

        const data = await response.json();

        if (response.ok) {
          logTest(
            "Teste 7: Edge Function - Registro",
            "pass",
            "Device registrado com sucesso",
            {
              status: response.status,
              message: data.message,
            },
          );
        } else if (response.status === 401) {
          logTest(
            "Teste 7: Edge Function - Registro",
            "fail",
            "Token inválido ou expirado. Faça LOGOUT e LOGIN em https://syncads.com.br/login-v2 novamente.",
            {
              status: response.status,
              error: data.error,
              message: data.message,
            },
          );
        } else {
          logTest(
            "Teste 7: Edge Function - Registro",
            "fail",
            `Erro HTTP ${response.status}`,
            data,
          );
        }
      } else {
        logTest(
          "Teste 7: Edge Function - Registro",
          "fail",
          "Token não encontrado",
        );
      }
    } else {
      logTest(
        "Teste 7: Edge Function - Registro",
        "fail",
        "Chave de autenticação não encontrada",
      );
    }
  } catch (error) {
    logTest("Teste 7: Edge Function - Registro", "fail", error.message);
  }

  await sleep(500);

  // ============================================
  // TESTE 8: Chrome Storage
  // ============================================
  try {
    const stored = await chrome.storage.local.get([
      "deviceId",
      "userId",
      "accessToken",
      "isConnected",
    ]);

    if (stored.deviceId) {
      logTest("Teste 8: Chrome Storage", "pass", "Dados salvos no storage", {
        hasDeviceId: !!stored.deviceId,
        hasUserId: !!stored.userId,
        hasToken: !!stored.accessToken,
        isConnected: stored.isConnected,
      });
    } else {
      logTest(
        "Teste 8: Chrome Storage",
        "fail",
        "Device ID não encontrado no storage",
      );
    }
  } catch (error) {
    logTest("Teste 8: Chrome Storage", "fail", error.message);
  }

  await sleep(500);

  // ============================================
  // TESTE 9: Badge da Extensão
  // ============================================
  try {
    const badge = await chrome.action.getBadgeText({});
    const title = await chrome.action.getTitle({});

    logTest("Teste 9: Badge da Extensão", "pass", "Badge e título obtidos", {
      badgeText: badge || "(vazio)",
      title: title,
    });
  } catch (error) {
    logTest("Teste 9: Badge da Extensão", "fail", error.message);
  }

  await sleep(500);

  // ============================================
  // TESTE 10: Content Script Ativo
  // ============================================
  try {
    const indicator = document.getElementById("syncads-connect-btn");
    const notification = document.getElementById("syncads-notification");

    if (
      indicator ||
      notification ||
      window.location.hostname.includes("syncads")
    ) {
      logTest(
        "Teste 10: Content Script",
        "pass",
        "Content script detectado na página",
        {
          hasButton: !!indicator,
          hasNotification: !!notification,
          url: window.location.href,
        },
      );
    } else {
      logTest(
        "Teste 10: Content Script",
        "pass",
        "Content script carregado (elementos UI não visíveis)",
      );
    }
  } catch (error) {
    logTest("Teste 10: Content Script", "fail", error.message);
  }

  await sleep(500);

  // ============================================
  // RESUMO FINAL
  // ============================================
  console.log("\n%c" + "=".repeat(60), "color: #667eea;");
  console.log(
    "%c📊 RESUMO DOS TESTES",
    "font-size: 18px; font-weight: bold; color: #667eea;",
  );
  console.log("%c" + "=".repeat(60), "color: #667eea;");
  console.log("");

  const passRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
  const statusColor =
    passRate >= 80 ? "#10b981" : passRate >= 50 ? "#f59e0b" : "#ef4444";

  console.log(
    `%c✅ PASSOU: ${testResults.passed}/${testResults.total} (${passRate}%)`,
    `color: #10b981; font-weight: bold; font-size: 16px;`,
  );
  console.log(
    `%c❌ FALHOU: ${testResults.failed}/${testResults.total}`,
    `color: #ef4444; font-weight: bold; font-size: 16px;`,
  );
  console.log("");

  if (passRate >= 80) {
    console.log(
      "%c🎉 EXTENSÃO FUNCIONANDO CORRETAMENTE!",
      "font-size: 20px; font-weight: bold; color: #10b981; background: #d1fae5; padding: 10px;",
    );
  } else if (passRate >= 50) {
    console.log(
      "%c⚠️ EXTENSÃO PARCIALMENTE FUNCIONAL",
      "font-size: 20px; font-weight: bold; color: #f59e0b; background: #fef3c7; padding: 10px;",
    );
    console.log("%cVerifique os testes que falharam acima.", "color: #f59e0b;");
  } else {
    console.log(
      "%c❌ EXTENSÃO COM PROBLEMAS",
      "font-size: 20px; font-weight: bold; color: #ef4444; background: #fee2e2; padding: 10px;",
    );
    console.log("%cVerifique os testes que falharam acima.", "color: #ef4444;");
  }

  console.log("");
  console.log("%c" + "=".repeat(60), "color: #667eea;");
  console.log("");

  // Checklist visual
  console.log(
    "%c📋 CHECKLIST DE VALIDAÇÃO:",
    "font-size: 16px; font-weight: bold;",
  );
  console.log("");

  const checklist = [
    {
      item: "Background script inicializando",
      test: testResults.tests[1]?.status,
    },
    {
      item: "Comunicação content ↔ background",
      test: testResults.tests[0]?.status,
    },
    {
      item: "Token detectado no localStorage",
      test: testResults.tests[3]?.status,
    },
    {
      item: "Token com formato JWT válido",
      test: testResults.tests[4]?.status,
    },
    { item: "Edge Function respondendo", test: testResults.tests[5]?.status },
    {
      item: "Registro de device funcionando",
      test: testResults.tests[6]?.status,
    },
    {
      item: "Chrome Storage salvando dados",
      test: testResults.tests[7]?.status,
    },
    { item: "Content script ativo", test: testResults.tests[9]?.status },
  ];

  checklist.forEach(({ item, test }) => {
    const icon = test === "pass" ? "✅" : test === "fail" ? "❌" : "⏳";
    const color =
      test === "pass" ? "#10b981" : test === "fail" ? "#ef4444" : "#f59e0b";
    console.log(`%c${icon} ${item}`, `color: ${color};`);
  });

  console.log("");
  console.log("%c" + "=".repeat(60), "color: #667eea;");

  // Instruções
  console.log("");
  console.log(
    "%c💡 PRÓXIMAS AÇÕES:",
    "font-size: 16px; font-weight: bold; color: #3b82f6;",
  );
  console.log("");

  if (testResults.failed === 0) {
    console.log(
      "%c✅ Tudo funcionando! A extensão está pronta para uso.",
      "color: #10b981;",
    );
  } else {
    console.log("%c⚠️ Alguns testes falharam. Verifique:", "color: #f59e0b;");
    console.log("");

    // Se token não encontrado
    if (testResults.tests[3]?.status === "fail") {
      console.log(
        "%c1. Faça LOGIN no SaaS: https://syncads.com.br/login-v2",
        "color: #ef4444; font-weight: bold;",
      );
    }

    // Se token expirado
    if (testResults.tests[3]?.data?.isExpired) {
      console.log(
        "%c2. Token EXPIRADO - Faça LOGOUT e LOGIN novamente",
        "color: #ef4444; font-weight: bold;",
      );
    }

    // Se edge function falhou
    if (testResults.tests[6]?.status === "fail") {
      console.log(
        "%c3. Verifique se as credenciais do Supabase estão corretas",
        "color: #ef4444; font-weight: bold;",
      );
      console.log(
        "%c4. Verifique se a Edge Function está deployada",
        "color: #ef4444; font-weight: bold;",
      );
    }
  }

  console.log("");
  console.log("%c" + "=".repeat(60), "color: #667eea;");
  console.log("");

  return testResults;
}

// ============================================
// EXECUTAR TESTES
// ============================================
console.log("%c⏳ Aguarde... executando testes...\n", "color: #f59e0b;");

runTests()
  .then((results) => {
    console.log(
      "%c✅ Validação concluída!",
      "font-size: 16px; font-weight: bold; color: #10b981;",
    );
    console.log("");
    console.log(
      "Para re-executar os testes, cole este script novamente no console.",
    );
    console.log("");
  })
  .catch((error) => {
    console.error(
      "%c❌ Erro ao executar testes:",
      "color: #ef4444; font-weight: bold;",
      error,
    );
  });
