import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Lista completa de padrões a serem corrigidos
const fixes = [
  // UnifiedDashboardPage - bg-gray-50 min-h-screen
  {
    pattern: /className="space-y-6 p-6 bg-gray-50 min-h-screen"/g,
    replacement: 'className="space-y-6"',
  },
  // CheckoutCustomizePage - h-screen com fundo
  {
    pattern:
      /className="flex h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-blue-50\/30 to-purple-50\/30 dark:from-gray-950 dark:via-blue-950\/20 dark:to-purple-950\/20 -mx-6 -my-6"/g,
    replacement: 'className="flex h-screen overflow-hidden -mx-6 -my-6"',
  },
  // CheckoutCustomizePage preview area
  {
    pattern:
      /className="flex-1 overflow-auto bg-gradient-to-br from-gray-100 via-blue-50\/20 to-purple-50\/20 dark:from-gray-900 dark:via-blue-950\/20 dark:to-purple-950\/20 p-6"/g,
    replacement: 'className="flex-1 overflow-auto p-6"',
  },
  // Padrão com max-w-4xl
  {
    pattern:
      /className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50\/30 to-purple-50\/30 dark:from-gray-950 dark:via-blue-950\/20 dark:to-purple-950\/20 p-6 space-y-6 max-w-4xl mx-auto pb-8"/g,
    replacement: 'className="space-y-6 max-w-4xl mx-auto pb-8"',
  },
  // Padrão com max-w-5xl
  {
    pattern:
      /className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50\/30 to-purple-50\/30 dark:from-gray-950 dark:via-blue-950\/20 dark:to-purple-950\/20 p-6 sm:p-8 max-w-5xl mx-auto space-y-6"/g,
    replacement: 'className="space-y-6 max-w-5xl mx-auto"',
  },
  // Padrão com max-w-7xl
  {
    pattern:
      /className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50\/30 to-purple-50\/30 dark:from-gray-950 dark:via-blue-950\/20 dark:to-purple-950\/20 p-6 sm:p-8 max-w-7xl mx-auto space-y-6"/g,
    replacement: 'className="space-y-6 max-w-7xl mx-auto"',
  },
  // Padrão com max-w-7xl sem sm:p-8
  {
    pattern:
      /className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50\/30 to-purple-50\/30 dark:from-gray-950 dark:via-blue-950\/20 dark:to-purple-950\/20 p-6 max-w-7xl mx-auto space-y-6"/g,
    replacement: 'className="space-y-6 max-w-7xl mx-auto"',
  },
  // Padrão genérico com dark mode
  {
    pattern:
      /className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50\/30 to-purple-50\/30 dark:from-gray-950 dark:via-blue-950\/20 dark:to-purple-950\/20 p-6 space-y-6"/g,
    replacement: 'className="space-y-6"',
  },
  {
    pattern:
      /className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50\/30 to-purple-50\/30 dark:from-gray-950 dark:via-blue-950\/20 dark:to-purple-950\/20 p-6"/g,
    replacement: 'className="space-y-6"',
  },
  // Padrão sem dark mode com space-y-6
  {
    pattern:
      /className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50\/30 to-purple-50\/30 p-6 space-y-6"/g,
    replacement: 'className="space-y-6"',
  },
  // Padrão sem dark mode sem space-y-6
  {
    pattern:
      /className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50\/30 to-purple-50\/30 p-6"/g,
    replacement: 'className="space-y-6"',
  },
  // Padrão bg-background min-h
  {
    pattern: /className="min-h-screen bg-background p-6"/g,
    replacement: 'className="space-y-6"',
  },
  // Outros padrões genéricos
  {
    pattern: /className="p-6 bg-gray-50 min-h-screen space-y-6"/g,
    replacement: 'className="space-y-6"',
  },
  {
    pattern: /className="bg-gray-50 min-h-screen p-6 space-y-6"/g,
    replacement: 'className="space-y-6"',
  },
];

function getAllTsxFiles(dir, fileList = []) {
  const files = readdirSync(dir);

  files.forEach((file) => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      getAllTsxFiles(filePath, fileList);
    } else if (
      file.endsWith(".tsx") &&
      !file.includes(".BACKUP.") &&
      !file.includes(".backup.")
    ) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function fixBackgrounds() {
  const pagesDir = join(__dirname, "src", "pages", "app");
  const files = getAllTsxFiles(pagesDir);

  let modifiedCount = 0;
  let totalReplacements = 0;
  const modifiedFiles = [];

  console.log(`🔍 Encontrados ${files.length} arquivos .tsx para verificar\n`);

  files.forEach((filePath) => {
    let content = readFileSync(filePath, "utf-8");
    let modified = false;
    let replacements = 0;

    fixes.forEach((fix) => {
      const matches = content.match(fix.pattern);
      if (matches) {
        content = content.replace(fix.pattern, fix.replacement);
        modified = true;
        replacements += matches.length;
      }
    });

    if (modified) {
      writeFileSync(filePath, content, "utf-8");
      modifiedCount++;
      totalReplacements += replacements;
      const relativePath = filePath.replace(__dirname, "").replace(/\\/g, "/");
      modifiedFiles.push(relativePath);
      console.log(`✅ ${relativePath} - ${replacements} substituição(ões)`);
    }
  });

  console.log(`\n📊 Resumo:`);
  console.log(`   Arquivos verificados: ${files.length}`);
  console.log(`   Arquivos modificados: ${modifiedCount}`);
  console.log(`   Total de substituições: ${totalReplacements}`);

  if (modifiedCount > 0) {
    console.log(
      `\n✨ Fundos removidos com sucesso! Os cards agora flutuam sobre o fundo escuro.`,
    );
    console.log(`\n📝 Arquivos modificados:`);
    modifiedFiles.forEach((file) => console.log(`   - ${file}`));
  } else {
    console.log(
      `\n✅ Nenhum arquivo precisou ser modificado. Todos já estão corretos!`,
    );
  }
}

try {
  fixBackgrounds();
} catch (error) {
  console.error("❌ Erro:", error.message);
  console.error(error.stack);
  process.exit(1);
}
