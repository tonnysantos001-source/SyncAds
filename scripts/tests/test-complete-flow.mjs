#!/usr/bin/env node

/**
 * ============================================
 * SYNCADS - TESTE DE FLUXO COMPLETO
 * ============================================
 * Testa o fluxo completo: Login → Chat → Campaigns
 *
 * Uso:
 *   node scripts/tests/test-complete-flow.mjs
 *
 * Requisitos:
 *   - .env ou .env.local configurado
 *   - Usuário de teste criado
 */

import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

// ============================================
// CONFIGURAÇÃO
// ============================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..', '..');

// Carregar .env
const envPath = join(rootDir, '.env.local');
let envVars = {};
try {
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0 && !key.startsWith('#')) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  });
} catch (error) {
  console.warn('⚠️  .env.local não encontrado, usando variáveis de ambiente do sistema');
}

const SUPABASE_URL = envVars.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = envVars.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

// Credenciais de teste (ALTERE CONFORME NECESSÁRIO)
const TEST_USER = {
  email: 'teste@syncads.com',
  password: 'Teste@123456',
  name: 'Usuário de Teste'
};

// ============================================
// CORES PARA TERMINAL
// ============================================

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️${colors.reset}  ${msg}`),
  step: (msg) => console.log(`\n${colors.cyan}${colors.bright}▶ ${msg}${colors.reset}`),
  result: (msg) => console.log(`  ${colors.cyan}→${colors.reset} ${msg}`),
};

// ============================================
// VALIDAÇÃO
// ============================================

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  log.error('Variáveis de ambiente não configuradas!');
  log.error('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

// ============================================
// CLIENTE SUPABASE
// ============================================

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// FUNÇÕES DE TESTE
// ============================================

let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: []
};

async function runTest(name, testFn) {
  testResults.total++;
  try {
    await testFn();
    testResults.passed++;
    testResults.tests.push({ name, status: 'PASS' });
    log.success(`${name}`);
    return true;
  } catch (error) {
    testResults.failed++;
    testResults.tests.push({ name, status: 'FAIL', error: error.message });
    log.error(`${name}`);
    log.error(`  Erro: ${error.message}`);
    return false;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

// ============================================
// TESTES
// ============================================

let userId = null;
let conversationId = null;
let campaignId = null;

async function testLogin() {
  log.step('TESTE 1: LOGIN');

  // Tentar fazer login
  await runTest('Login com credenciais', async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: TEST_USER.email,
      password: TEST_USER.password
    });

    assert(!error, `Erro no login: ${error?.message}`);
    assert(data.user, 'Usuário não retornado');
    assert(data.session, 'Sessão não criada');

    userId = data.user.id;
    log.result(`User ID: ${userId.substring(0, 8)}...`);
  });

  // Verificar dados do usuário na tabela User
  await runTest('Verificar dados na tabela User', async () => {
    const { data, error } = await supabase
      .from('User')
      .select('*')
      .eq('id', userId)
      .single();

    assert(!error, `Erro ao buscar usuário: ${error?.message}`);
    assert(data, 'Usuário não encontrado na tabela User');
    assert(data.email === TEST_USER.email, 'Email incorreto');

    log.result(`Nome: ${data.name}`);
    log.result(`Plano: ${data.plan}`);
  });

  // Verificar sessão ativa
  await runTest('Verificar sessão ativa', async () => {
    const { data: { session }, error } = await supabase.auth.getSession();

    assert(!error, `Erro ao obter sessão: ${error?.message}`);
    assert(session, 'Sessão não encontrada');
    assert(session.access_token, 'Access token não encontrado');

    log.result(`Token válido por: ${Math.round((session.expires_at * 1000 - Date.now()) / 1000 / 60)} minutos`);
  });
}

async function testChat() {
  log.step('TESTE 2: CHAT');

  // Criar conversa
  await runTest('Criar nova conversa', async () => {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('ChatConversation')
      .insert({
        userId: userId,
        title: `Teste ${new Date().toLocaleString()}`,
        createdAt: now,
        updatedAt: now
      })
      .select()
      .single();

    assert(!error, `Erro ao criar conversa: ${error?.message}`);
    assert(data, 'Conversa não criada');
    assert(data.id, 'ID da conversa não retornado');

    conversationId = data.id;
    log.result(`Conversation ID: ${conversationId.substring(0, 8)}...`);
  });

  // Listar conversas
  await runTest('Listar conversas do usuário', async () => {
    const { data, error } = await supabase
      .from('ChatConversation')
      .select('*')
      .eq('userId', userId)
      .order('updatedAt', { ascending: false });

    assert(!error, `Erro ao listar conversas: ${error?.message}`);
    assert(data, 'Nenhuma conversa retornada');
    assert(data.length > 0, 'Lista de conversas vazia');

    log.result(`${data.length} conversa(s) encontrada(s)`);
  });

  // Enviar mensagem USER
  await runTest('Enviar mensagem de usuário', async () => {
    const { data, error } = await supabase
      .from('ChatMessage')
      .insert({
        userId: userId,
        conversationId: conversationId,
        role: 'USER',
        content: 'Olá, este é um teste!',
        createdAt: new Date().toISOString()
      })
      .select()
      .single();

    assert(!error, `Erro ao enviar mensagem: ${error?.message}`);
    assert(data, 'Mensagem não criada');

    log.result(`Mensagem enviada: "${data.content}"`);
  });

  // Enviar mensagem ASSISTANT (simulada)
  await runTest('Enviar mensagem de assistente', async () => {
    const { data, error } = await supabase
      .from('ChatMessage')
      .insert({
        userId: userId,
        conversationId: conversationId,
        role: 'ASSISTANT',
        content: 'Olá! Como posso ajudar você hoje?',
        createdAt: new Date().toISOString()
      })
      .select()
      .single();

    assert(!error, `Erro ao enviar resposta: ${error?.message}`);
    assert(data, 'Resposta não criada');

    log.result(`Resposta recebida: "${data.content}"`);
  });

  // Listar mensagens
  await runTest('Listar mensagens da conversa', async () => {
    const { data, error } = await supabase
      .from('ChatMessage')
      .select('*')
      .eq('conversationId', conversationId)
      .order('createdAt', { ascending: true });

    assert(!error, `Erro ao listar mensagens: ${error?.message}`);
    assert(data, 'Nenhuma mensagem retornada');
    assert(data.length === 2, `Esperado 2 mensagens, encontrado ${data.length}`);

    log.result(`${data.length} mensagem(ns) na conversa`);
  });

  // Verificar RLS (Row Level Security)
  await runTest('Verificar RLS: não listar conversas de outros', async () => {
    const { data, error } = await supabase
      .from('ChatConversation')
      .select('*')
      .neq('userId', userId);

    // Deve retornar vazio por causa do RLS
    assert(!error, `Erro RLS: ${error?.message}`);
    assert(data.length === 0, 'RLS falhou: retornou conversas de outros usuários');

    log.result('RLS funcionando corretamente');
  });
}

async function testCampaigns() {
  log.step('TESTE 3: CAMPAIGNS');

  // Criar campanha
  await runTest('Criar nova campanha', async () => {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('Campaign')
      .insert({
        userId: userId,
        name: `Campanha Teste ${new Date().toLocaleString()}`,
        objective: 'CONVERSIONS',
        platform: 'GOOGLE_ADS',
        status: 'ACTIVE',
        budgetTotal: 1000,
        budgetSpent: 0,
        budgetDaily: 50,
        startDate: now,
        targeting: {},
        impressions: 0,
        clicks: 0,
        conversions: 0,
        ctr: 0,
        cpc: 0,
        roi: 0,
        createdAt: now,
        updatedAt: now
      })
      .select()
      .single();

    assert(!error, `Erro ao criar campanha: ${error?.message}`);
    assert(data, 'Campanha não criada');
    assert(data.id, 'ID da campanha não retornado');

    campaignId = data.id;
    log.result(`Campaign ID: ${campaignId.substring(0, 8)}...`);
    log.result(`Nome: ${data.name}`);
  });

  // Listar campanhas
  await runTest('Listar campanhas do usuário', async () => {
    const { data, error } = await supabase
      .from('Campaign')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false });

    assert(!error, `Erro ao listar campanhas: ${error?.message}`);
    assert(data, 'Nenhuma campanha retornada');
    assert(data.length > 0, 'Lista de campanhas vazia');

    log.result(`${data.length} campanha(s) encontrada(s)`);
  });

  // Atualizar campanha
  await runTest('Atualizar status da campanha', async () => {
    const { data, error } = await supabase
      .from('Campaign')
      .update({
        status: 'PAUSED',
        budgetSpent: 150,
        impressions: 5000,
        clicks: 250,
        updatedAt: new Date().toISOString()
      })
      .eq('id', campaignId)
      .select()
      .single();

    assert(!error, `Erro ao atualizar campanha: ${error?.message}`);
    assert(data, 'Campanha não atualizada');
    assert(data.status === 'PAUSED', 'Status não atualizado');
    assert(data.budgetSpent === 150, 'Budget não atualizado');

    log.result(`Status: ${data.status}`);
    log.result(`Budget gasto: R$ ${data.budgetSpent}`);
    log.result(`Impressões: ${data.impressions}`);
  });

  // Verificar índices de performance (indiretamente)
  await runTest('Performance: query com filtros múltiplos', async () => {
    const startTime = Date.now();

    const { data, error } = await supabase
      .from('Campaign')
      .select('*')
      .eq('userId', userId)
      .eq('status', 'PAUSED')
      .gte('budgetSpent', 100)
      .order('createdAt', { ascending: false });

    const queryTime = Date.now() - startTime;

    assert(!error, `Erro na query: ${error?.message}`);
    assert(queryTime < 1000, `Query lenta: ${queryTime}ms (esperado < 1000ms)`);

    log.result(`Query executada em ${queryTime}ms`);
  });
}

async function testIntegrations() {
  log.step('TESTE 4: INTEGRAÇÕES');

  // Criar integração
  await runTest('Criar integração de teste', async () => {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('Integration')
      .insert({
        userId: userId,
        platform: 'GOOGLE_ADS',
        isConnected: false,
        createdAt: now,
        updatedAt: now
      })
      .select()
      .single();

    assert(!error, `Erro ao criar integração: ${error?.message}`);
    assert(data, 'Integração não criada');

    log.result(`Integração criada: ${data.platform}`);
  });

  // Listar integrações
  await runTest('Listar integrações do usuário', async () => {
    const { data, error } = await supabase
      .from('Integration')
      .select('*')
      .eq('userId', userId);

    assert(!error, `Erro ao listar integrações: ${error?.message}`);
    assert(data, 'Nenhuma integração retornada');

    log.result(`${data.length} integração(ões) encontrada(s)`);
  });
}

async function cleanup() {
  log.step('LIMPEZA: Removendo dados de teste');

  // Deletar mensagens
  if (conversationId) {
    await runTest('Deletar mensagens de teste', async () => {
      const { error } = await supabase
        .from('ChatMessage')
        .delete()
        .eq('conversationId', conversationId);

      assert(!error, `Erro ao deletar mensagens: ${error?.message}`);
    });

    // Deletar conversa
    await runTest('Deletar conversa de teste', async () => {
      const { error } = await supabase
        .from('ChatConversation')
        .delete()
        .eq('id', conversationId);

      assert(!error, `Erro ao deletar conversa: ${error?.message}`);
    });
  }

  // Deletar campanha
  if (campaignId) {
    await runTest('Deletar campanha de teste', async () => {
      const { error } = await supabase
        .from('Campaign')
        .delete()
        .eq('id', campaignId);

      assert(!error, `Erro ao deletar campanha: ${error?.message}`);
    });
  }

  // Deletar integrações
  await runTest('Deletar integrações de teste', async () => {
    const { error } = await supabase
      .from('Integration')
      .delete()
      .eq('userId', userId);

    assert(!error, `Erro ao deletar integrações: ${error?.message}`);
  });

  // Logout
  await runTest('Fazer logout', async () => {
    const { error } = await supabase.auth.signOut();
    assert(!error, `Erro ao fazer logout: ${error?.message}`);
  });
}

// ============================================
// EXECUÇÃO PRINCIPAL
// ============================================

async function main() {
  console.log('\n');
  console.log('═══════════════════════════════════════════════════');
  console.log('  🧪 SYNCADS - TESTE DE FLUXO COMPLETO');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  log.info(`Supabase URL: ${SUPABASE_URL}`);
  log.info(`Testando como: ${TEST_USER.email}`);
  console.log('');

  const startTime = Date.now();

  try {
    await testLogin();
    await testChat();
    await testCampaigns();
    await testIntegrations();
    await cleanup();
  } catch (error) {
    log.error(`Erro fatal: ${error.message}`);
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);

  // Relatório final
  console.log('\n');
  console.log('═══════════════════════════════════════════════════');
  console.log('  📊 RELATÓRIO FINAL');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  const passRate = ((testResults.passed / testResults.total) * 100).toFixed(1);

  log.info(`Total de testes: ${testResults.total}`);
  log.success(`Testes passaram: ${testResults.passed}`);
  if (testResults.failed > 0) {
    log.error(`Testes falharam: ${testResults.failed}`);
  }
  log.info(`Taxa de sucesso: ${passRate}%`);
  log.info(`Tempo total: ${totalTime}s`);
  console.log('');

  // Lista de testes falhados
  if (testResults.failed > 0) {
    console.log('Testes que falharam:');
    testResults.tests
      .filter(t => t.status === 'FAIL')
      .forEach(t => {
        log.error(`  - ${t.name}`);
        console.log(`    ${colors.red}${t.error}${colors.reset}`);
      });
    console.log('');
  }

  // Status final
  if (testResults.failed === 0) {
    console.log(`${colors.green}${colors.bright}✅ TODOS OS TESTES PASSARAM!${colors.reset}`);
    console.log('');
    console.log('🚀 Seu SaaS está funcionando perfeitamente!');
    console.log('');
    process.exit(0);
  } else {
    console.log(`${colors.red}${colors.bright}❌ ALGUNS TESTES FALHARAM${colors.reset}`);
    console.log('');
    console.log('Por favor, corrija os problemas acima.');
    console.log('');
    process.exit(1);
  }
}

// Executar
main().catch(error => {
  console.error('\n');
  log.error(`Erro não tratado: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
});
