#!/usr/bin/env node

// ============================================
// GERADOR DE URLs DE WEBHOOK
// ============================================
//
// Gera URLs de webhook para todos os 53 gateways
// implementados no SyncAds.
//
// Uso:
//   node generate-webhook-urls.js
//   node generate-webhook-urls.js --project=seu-projeto
//   node generate-webhook-urls.js --format=json
//   node generate-webhook-urls.js --export=webhooks.csv
//
// ============================================

const fs = require('fs');
const path = require('path');

// ============================================
// CONFIGURAÇÃO
// ============================================

const GATEWAYS = [
  // Alta Prioridade
  { slug: 'stripe', name: 'Stripe', priority: 'high' },
  { slug: 'asaas', name: 'Asaas', priority: 'high' },

  // Principais
  { slug: 'mercado-pago', name: 'Mercado Pago', priority: 'main', alias: 'mercadopago' },
  { slug: 'pagseguro', name: 'PagSeguro', priority: 'main' },
  { slug: 'pagarme', name: 'Pagar.me', priority: 'main' },
  { slug: 'cielo', name: 'Cielo', priority: 'main' },
  { slug: 'paypal', name: 'PayPal', priority: 'main' },
  { slug: 'picpay', name: 'PicPay', priority: 'main' },
  { slug: 'rede', name: 'Rede', priority: 'main' },
  { slug: 'getnet', name: 'GetNet', priority: 'main' },
  { slug: 'stone', name: 'Stone', priority: 'main' },
  { slug: 'iugu', name: 'Iugu', priority: 'main' },
  { slug: 'vindi', name: 'Vindi', priority: 'main' },

  // Adicionais
  { slug: 'wirecard-moip', name: 'Wirecard (Moip)', priority: 'additional', alias: 'wirecard' },
  { slug: 'safetypay', name: 'SafetyPay', priority: 'additional' },
  { slug: 'allus', name: 'Allus', priority: 'additional' },
  { slug: 'alpa', name: 'Alpa', priority: 'additional' },
  { slug: 'alphacash', name: 'Alphacash', priority: 'additional' },
  { slug: 'anubispay', name: 'AnubisPay', priority: 'additional' },
  { slug: 'appmax', name: 'Appmax', priority: 'additional' },
  { slug: 'asset', name: 'Asset', priority: 'additional' },
  { slug: 'aston-pay', name: 'Aston Pay', priority: 'additional' },
  { slug: 'atlas-pay', name: 'Atlas Pay', priority: 'additional' },
  { slug: 'axelpay', name: 'Axelpay', priority: 'additional' },
  { slug: 'axion-pay', name: 'Axion Pay', priority: 'additional' },
  { slug: 'azcend', name: 'Azcend', priority: 'additional' },
  { slug: 'bestfy', name: 'Bestfy', priority: 'additional' },
  { slug: 'blackcat', name: 'Blackcat', priority: 'additional' },
  { slug: 'bravos-pay', name: 'Bravos Pay', priority: 'additional' },
  { slug: 'braza-pay', name: 'Braza Pay', priority: 'additional' },
  { slug: 'bynet', name: 'Bynet', priority: 'additional' },
  { slug: 'carthero', name: 'Carthero', priority: 'additional' },
  { slug: 'centurion-pay', name: 'Centurion Pay', priority: 'additional' },
  { slug: 'credpago', name: 'Credpago', priority: 'additional' },
  { slug: 'credwave', name: 'Credwave', priority: 'additional' },
  { slug: 'cupula-hub', name: 'Cúpula Hub', priority: 'additional' },
  { slug: 'cyberhub', name: 'Cyberhub', priority: 'additional' },
  { slug: 'codiguz-hub', name: 'Codiguz Hub', priority: 'additional' },
  { slug: 'diasmarketplace', name: 'Diasmarketplace', priority: 'additional' },
  { slug: 'dom-pagamentos', name: 'Dom Pagamentos', priority: 'additional' },
  { slug: 'dorapag', name: 'Dorapag', priority: 'additional' },
  { slug: 'dubai-pay', name: 'Dubai Pay', priority: 'additional' },
  { slug: 'efi', name: 'Efí', priority: 'additional' },
  { slug: 'ever-pay', name: 'Ever Pay', priority: 'additional' },
  { slug: 'fast-pay', name: 'Fast Pay', priority: 'additional' },
  { slug: 'fire-pag', name: 'Fire Pag', priority: 'additional' },
  { slug: 'fivepay', name: 'Fivepay', priority: 'additional' },
  { slug: 'flashpay', name: 'FlashPay', priority: 'additional' },
  { slug: 'flowspay', name: 'Flowspay', priority: 'additional' },
  { slug: 'fly-payments', name: 'Fly Payments', priority: 'additional' },
  { slug: 'fortrex', name: 'Fortrex', priority: 'additional' },
  { slug: 'freepay', name: 'FreePay', priority: 'additional' },
  { slug: 'fusionpay', name: 'FusionPay', priority: 'additional' },
];

// ============================================
// PARSE ARGUMENTOS
// ============================================

const args = process.argv.slice(2);
let projectId = 'ovskepqggmxlfckxqgbr'; // Default
let format = 'table'; // table, json, csv, markdown
let exportFile = null;
let filterPriority = null;

for (const arg of args) {
  if (arg.startsWith('--project=')) {
    projectId = arg.split('=')[1];
  } else if (arg.startsWith('--format=')) {
    format = arg.split('=')[1];
  } else if (arg.startsWith('--export=')) {
    exportFile = arg.split('=')[1];
  } else if (arg.startsWith('--priority=')) {
    filterPriority = arg.split('=')[1];
  } else if (arg === '--help' || arg === '-h') {
    showHelp();
    process.exit(0);
  }
}

// ============================================
// FUNÇÕES
// ============================================

function showHelp() {
  console.log(`
🔔 GERADOR DE URLs DE WEBHOOK

Uso:
  node generate-webhook-urls.js [opções]

Opções:
  --project=ID         ID do projeto Supabase (default: ovskepqggmxlfckxqgbr)
  --format=FORMATO     Formato de saída: table, json, csv, markdown (default: table)
  --export=ARQUIVO     Exportar para arquivo
  --priority=NIVEL     Filtrar por prioridade: high, main, additional
  --help, -h           Mostrar esta ajuda

Exemplos:
  node generate-webhook-urls.js
  node generate-webhook-urls.js --project=meu-projeto
  node generate-webhook-urls.js --format=json
  node generate-webhook-urls.js --format=csv --export=webhooks.csv
  node generate-webhook-urls.js --priority=high
  `);
}

function generateWebhookUrl(projectId, gatewaySlug) {
  return `https://${projectId}.supabase.co/functions/v1/payment-webhook/${gatewaySlug}`;
}

function generateWebhookData() {
  let gateways = GATEWAYS;

  // Filtrar por prioridade se especificado
  if (filterPriority) {
    gateways = gateways.filter(g => g.priority === filterPriority);
  }

  return gateways.map(gateway => ({
    name: gateway.name,
    slug: gateway.slug,
    alias: gateway.alias || null,
    priority: gateway.priority,
    url: generateWebhookUrl(projectId, gateway.slug),
    testUrl: generateWebhookUrl(projectId, gateway.slug) + '?test=1',
  }));
}

function formatAsTable(data) {
  console.log('\n🔔 URLs DE WEBHOOK - SYNCADS\n');
  console.log(`📦 Projeto: ${projectId}`);
  console.log(`📊 Total: ${data.length} gateways\n`);

  const highPriority = data.filter(g => g.priority === 'high');
  const mainPriority = data.filter(g => g.priority === 'main');
  const additional = data.filter(g => g.priority === 'additional');

  if (highPriority.length > 0) {
    console.log('🔴 ALTA PRIORIDADE\n');
    highPriority.forEach(g => {
      console.log(`  ${g.name} (${g.slug})`);
      console.log(`  ${g.url}\n`);
    });
  }

  if (mainPriority.length > 0) {
    console.log('🟡 PRINCIPAIS\n');
    mainPriority.forEach(g => {
      console.log(`  ${g.name} (${g.slug})`);
      console.log(`  ${g.url}\n`);
    });
  }

  if (additional.length > 0) {
    console.log('🟢 ADICIONAIS\n');
    additional.forEach(g => {
      console.log(`  ${g.name} (${g.slug})`);
      console.log(`  ${g.url}\n`);
    });
  }

  console.log('\n📝 Para configurar um webhook, copie a URL acima e cole no painel do gateway.\n');
}

function formatAsJson(data) {
  const output = {
    project: projectId,
    total: data.length,
    baseUrl: `https://${projectId}.supabase.co/functions/v1/payment-webhook`,
    gateways: data,
    generatedAt: new Date().toISOString(),
  };

  return JSON.stringify(output, null, 2);
}

function formatAsCsv(data) {
  const header = 'Name,Slug,Priority,Webhook URL,Test URL\n';
  const rows = data.map(g =>
    `"${g.name}","${g.slug}","${g.priority}","${g.url}","${g.testUrl}"`
  ).join('\n');

  return header + rows;
}

function formatAsMarkdown(data) {
  let md = `# Webhooks - SyncAds\n\n`;
  md += `**Projeto:** ${projectId}\n`;
  md += `**Total:** ${data.length} gateways\n`;
  md += `**Gerado em:** ${new Date().toLocaleString('pt-BR')}\n\n`;

  md += `## URLs de Webhook\n\n`;

  const grouped = {
    high: data.filter(g => g.priority === 'high'),
    main: data.filter(g => g.priority === 'main'),
    additional: data.filter(g => g.priority === 'additional'),
  };

  if (grouped.high.length > 0) {
    md += `### 🔴 Alta Prioridade\n\n`;
    grouped.high.forEach(g => {
      md += `#### ${g.name}\n`;
      md += `- **Slug:** \`${g.slug}\`\n`;
      md += `- **URL:** \`${g.url}\`\n`;
      if (g.alias) md += `- **Alias:** \`${g.alias}\`\n`;
      md += `\n`;
    });
  }

  if (grouped.main.length > 0) {
    md += `### 🟡 Principais\n\n`;
    grouped.main.forEach(g => {
      md += `#### ${g.name}\n`;
      md += `- **Slug:** \`${g.slug}\`\n`;
      md += `- **URL:** \`${g.url}\`\n`;
      if (g.alias) md += `- **Alias:** \`${g.alias}\`\n`;
      md += `\n`;
    });
  }

  if (grouped.additional.length > 0) {
    md += `### 🟢 Adicionais\n\n`;
    grouped.additional.forEach(g => {
      md += `#### ${g.name}\n`;
      md += `- **Slug:** \`${g.slug}\`\n`;
      md += `- **URL:** \`${g.url}\`\n`;
      if (g.alias) md += `- **Alias:** \`${g.alias}\`\n`;
      md += `\n`;
    });
  }

  md += `## Como Usar\n\n`;
  md += `1. Copie a URL do gateway que você quer configurar\n`;
  md += `2. Acesse o painel do gateway (Stripe, Mercado Pago, etc)\n`;
  md += `3. Encontre a seção de Webhooks/Notificações\n`;
  md += `4. Cole a URL e selecione os eventos desejados\n`;
  md += `5. Salve e teste!\n\n`;

  return md;
}

function exportToFile(content, filename) {
  try {
    fs.writeFileSync(filename, content, 'utf8');
    console.log(`\n✅ Exportado para: ${filename}`);
  } catch (error) {
    console.error(`\n❌ Erro ao exportar: ${error.message}`);
  }
}

// ============================================
// MAIN
// ============================================

function main() {
  const data = generateWebhookData();

  let output;

  switch (format) {
    case 'json':
      output = formatAsJson(data);
      if (exportFile) {
        exportToFile(output, exportFile);
      } else {
        console.log(output);
      }
      break;

    case 'csv':
      output = formatAsCsv(data);
      if (exportFile) {
        exportToFile(output, exportFile);
      } else {
        console.log(output);
      }
      break;

    case 'markdown':
    case 'md':
      output = formatAsMarkdown(data);
      if (exportFile) {
        exportToFile(output, exportFile);
      } else {
        console.log(output);
      }
      break;

    case 'table':
    default:
      formatAsTable(data);
      break;
  }

  // Estatísticas
  if (format === 'table') {
    console.log('📊 ESTATÍSTICAS\n');
    console.log(`  Alta Prioridade: ${data.filter(g => g.priority === 'high').length}`);
    console.log(`  Principais: ${data.filter(g => g.priority === 'main').length}`);
    console.log(`  Adicionais: ${data.filter(g => g.priority === 'additional').length}`);
    console.log(`  TOTAL: ${data.length}\n`);

    console.log('💡 DICAS\n');
    console.log('  • Configure primeiro os gateways de alta prioridade (Stripe, Asaas)');
    console.log('  • Teste em sandbox antes de usar em produção');
    console.log('  • Monitore os logs: supabase functions logs payment-webhook --tail');
    console.log('  • Use --format=json para integração com scripts');
    console.log('  • Use --export=file.csv para importar em planilhas\n');
  }
}

// Executar
main();
