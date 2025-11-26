// ============================================================================
// TEST COMMAND DETECTOR - Testa detecção de comandos DOM e pesquisas
// ============================================================================

import { detectDomCommands } from "../supabase/functions/_utils/dom-command-detector.ts";

// ============================================================================
// CASOS DE TESTE
// ============================================================================

const testCases = [
  // PESQUISAS - YOUTUBE
  {
    input: "pesquise por videos de pudin no youtube",
    expected: { type: "SEARCH", platform: "youtube", query: "videos de pudin" },
  },
  {
    input: "abra o youtube e pesquise por videos de pudin",
    expected: { type: "SEARCH", platform: "youtube", query: "videos de pudin" },
  },
  {
    input: "procure receitas de bolo no yt",
    expected: { type: "SEARCH", platform: "youtube", query: "receitas de bolo" },
  },
  {
    input: "videos de como fazer pão",
    expected: { type: "SEARCH", platform: "youtube", query: "como fazer pão" },
  },
  {
    input: "busque tutoriais de javascript no youtube",
    expected: { type: "SEARCH", platform: "youtube", query: "tutoriais de javascript" },
  },

  // PESQUISAS - GOOGLE
  {
    input: "pesquise por restaurantes italianos",
    expected: { type: "SEARCH", platform: "google", query: "restaurantes italianos" },
  },
  {
    input: "procure hotéis em paris",
    expected: { type: "SEARCH", platform: "google", query: "hotéis em paris" },
  },
  {
    input: "busque laptops baratos no google",
    expected: { type: "SEARCH", platform: "google", query: "laptops baratos" },
  },
  {
    input: "faça uma pesquisa sobre inteligência artificial",
    expected: { type: "SEARCH", platform: "google", query: "inteligência artificial" },
  },

  // NAVEGAÇÃO SIMPLES (sem pesquisa)
  {
    input: "abra o facebook",
    expected: { type: "NAVIGATE", url: "https://www.facebook.com" },
  },
  {
    input: "vá para o instagram",
    expected: { type: "NAVIGATE", url: "https://www.instagram.com" },
  },
  {
    input: "acesse o gmail",
    expected: { type: "NAVIGATE", url: "https://mail.google.com" },
  },

  // COMANDOS SIMPLES
  {
    input: "tire uma screenshot",
    expected: { type: "SCREENSHOT" },
  },
  {
    input: "liste as abas",
    expected: { type: null }, // Esse não é detectado pelo detector básico
  },
  {
    input: "clique no botão enviar",
    expected: { type: "CLICK", selector: "botão enviar" },
  },
];

// ============================================================================
// FUNÇÃO DE TESTE
// ============================================================================

function runTests() {
  console.log("🧪 INICIANDO TESTES DO COMMAND DETECTOR\n");
  console.log("=" .repeat(80));

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    console.log(`\n📝 Teste: "${testCase.input}"`);

    const result = detectDomCommands(testCase.input);

    if (result.hasCommand && result.commands.length > 0) {
      const command = result.commands[0];

      console.log(`   Detectado: ${command.type}`);
      console.log(`   Confiança: ${(command.confidence * 100).toFixed(0)}%`);

      if (command.type === "SEARCH") {
        console.log(`   Plataforma: ${command.params.platform}`);
        console.log(`   Query: ${command.params.query}`);
        console.log(`   URL: ${command.params.url}`);

        // Validar
        const isValid =
          command.type === testCase.expected.type &&
          command.params.platform === testCase.expected.platform &&
          command.params.query.toLowerCase().includes(testCase.expected.query.toLowerCase().split(" ")[0]);

        if (isValid) {
          console.log("   ✅ PASSOU");
          passed++;
        } else {
          console.log("   ❌ FALHOU");
          console.log(`   Esperado: ${JSON.stringify(testCase.expected)}`);
          failed++;
        }
      } else if (command.type === "NAVIGATE") {
        console.log(`   URL: ${command.params.url}`);

        const isValid = command.type === testCase.expected.type;

        if (isValid) {
          console.log("   ✅ PASSOU");
          passed++;
        } else {
          console.log("   ❌ FALHOU");
          failed++;
        }
      } else if (command.type === "SCREENSHOT" || command.type === "CLICK") {
        const isValid = command.type === testCase.expected.type;

        if (isValid) {
          console.log("   ✅ PASSOU");
          passed++;
        } else {
          console.log("   ❌ FALHOU");
          failed++;
        }
      } else {
        console.log("   ⚠️ TIPO NÃO VERIFICADO");
        failed++;
      }
    } else {
      console.log("   ❌ Nenhum comando detectado");

      if (testCase.expected.type === null) {
        console.log("   ✅ PASSOU (esperado sem comando)");
        passed++;
      } else {
        console.log("   ❌ FALHOU");
        failed++;
      }
    }
  }

  // RESUMO
  console.log("\n" + "=".repeat(80));
  console.log("\n📊 RESUMO DOS TESTES:");
  console.log(`   ✅ Passou: ${passed}`);
  console.log(`   ❌ Falhou: ${failed}`);
  console.log(`   📈 Taxa de sucesso: ${((passed / testCases.length) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log("\n🎉 TODOS OS TESTES PASSARAM!");
  } else {
    console.log(`\n⚠️ ${failed} teste(s) falharam. Revise o detector.`);
  }

  console.log("\n" + "=".repeat(80));
}

// ============================================================================
// CASOS DE TESTE INTERATIVOS
// ============================================================================

function testInteractive(message: string) {
  console.log("\n" + "=".repeat(80));
  console.log(`\n🔍 Testando: "${message}"\n`);

  const result = detectDomCommands(message);

  if (result.hasCommand) {
    console.log(`✅ ${result.commands.length} comando(s) detectado(s):\n`);

    result.commands.forEach((cmd, index) => {
      console.log(`   [${index + 1}] Tipo: ${cmd.type}`);
      console.log(`       Confiança: ${(cmd.confidence * 100).toFixed(0)}%`);
      console.log(`       Params:`, JSON.stringify(cmd.params, null, 2).split('\n').map((line, i) => i === 0 ? line : '       ' + line).join('\n'));
      console.log();
    });
  } else {
    console.log("❌ Nenhum comando detectado");
  }

  console.log("=".repeat(80));
}

// ============================================================================
// EXECUTAR TESTES
// ============================================================================

// Testes automatizados
runTests();

// Testes interativos (exemplos do usuário)
console.log("\n\n🎯 TESTANDO CASOS DO USUÁRIO:\n");

testInteractive("abra o youtube e pesquise por videos de pudin");
testInteractive("pesquise por receitas de bolo");
testInteractive("procure hotéis em paris no google");
testInteractive("videos de como fazer pão");
testInteractive("abra o facebook");

console.log("\n✨ Testes concluídos!\n");
