/**
 * SCRIPT DE TESTE COMPLETO DO SISTEMA DE CHAT
 *
 * Testa toda a arquitetura de chat:
 * - Conexão com Supabase
 * - GlobalAIConnection
 * - Edge Function chat-enhanced
 * - Conversações e Mensagens
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@syncads.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'test123456';

console.log('🚀 TESTE COMPLETO DO SISTEMA DE CHAT\n');
console.log('📊 Configuração:');
console.log(`   - Supabase URL: ${SUPABASE_URL}`);
console.log(`   - Test User: ${TEST_USER_EMAIL}\n`);

// Criar cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let testUserId = null;
let testConversationId = null;
let testSession = null;

/**
 * Teste 1: Autenticação
 */
async function test1_Authentication() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📝 TESTE 1: Autenticação');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Tentar fazer login
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
    });

    if (authError) {
      console.log('❌ Erro ao autenticar:', authError.message);
      console.log('ℹ️  Tentando criar usuário de teste...\n');

      // Criar usuário de teste
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
      });

      if (signUpError) {
        throw new Error(`Erro ao criar usuário: ${signUpError.message}`);
      }

      testUserId = signUpData.user?.id;
      testSession = signUpData.session;
      console.log('✅ Usuário de teste criado com sucesso');
    } else {
      testUserId = authData.user?.id;
      testSession = authData.session;
      console.log('✅ Autenticação bem-sucedida');
    }

    console.log(`   - User ID: ${testUserId}`);
    console.log(`   - Session válida: ${!!testSession}\n`);

    return true;
  } catch (error) {
    console.error('❌ FALHOU:', error.message, '\n');
    return false;
  }
}

/**
 * Teste 2: Verificar GlobalAIConnection
 */
async function test2_CheckAIConnection() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🤖 TESTE 2: Verificar GlobalAIConnection');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    const { data, error } = await supabase
      .from('GlobalAiConnection')
      .select('id, name, provider, model, isActive')
      .eq('isActive', true)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('❌ Erro ao buscar IA:', error.message);
      return false;
    }

    if (!data) {
      console.log('⚠️  AVISO: Nenhuma IA ativa configurada!');
      console.log('ℹ️  Configure uma IA em: Configurações > IA Global\n');
      return false;
    }

    console.log('✅ IA ativa encontrada:');
    console.log(`   - Nome: ${data.name}`);
    console.log(`   - Provider: ${data.provider}`);
    console.log(`   - Modelo: ${data.model}`);
    console.log(`   - ID: ${data.id}\n`);

    return true;
  } catch (error) {
    console.error('❌ FALHOU:', error.message, '\n');
    return false;
  }
}

/**
 * Teste 3: Criar Conversação
 */
async function test3_CreateConversation() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💬 TESTE 3: Criar Conversação');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    const conversationData = {
      id: crypto.randomUUID(),
      userId: testUserId,
      title: 'Teste de Chat - ' + new Date().toLocaleString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('ChatConversation')
      .insert(conversationData)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar conversa: ${error.message}`);
    }

    testConversationId = data.id;
    console.log('✅ Conversação criada com sucesso');
    console.log(`   - ID: ${testConversationId}`);
    console.log(`   - Título: ${data.title}\n`);

    return true;
  } catch (error) {
    console.error('❌ FALHOU:', error.message, '\n');
    return false;
  }
}

/**
 * Teste 4: Salvar Mensagem do Usuário
 */
async function test4_SaveUserMessage() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📤 TESTE 4: Salvar Mensagem do Usuário');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    const messageData = {
      id: crypto.randomUUID(),
      conversationId: testConversationId,
      userId: testUserId,
      role: 'USER',
      content: 'Olá! Este é um teste do sistema de chat. Responda com "OK".',
      createdAt: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('ChatMessage')
      .insert(messageData)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao salvar mensagem: ${error.message}`);
    }

    console.log('✅ Mensagem do usuário salva');
    console.log(`   - ID: ${data.id}`);
    console.log(`   - Conteúdo: ${data.content.substring(0, 50)}...\n`);

    return true;
  } catch (error) {
    console.error('❌ FALHOU:', error.message, '\n');
    return false;
  }
}

/**
 * Teste 5: Chamar Edge Function chat-enhanced
 */
async function test5_CallChatFunction() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 TESTE 5: Chamar Edge Function chat-enhanced');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    const CHAT_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/chat-enhanced`;

    console.log('📡 Enviando requisição para:', CHAT_FUNCTION_URL);
    console.log('   - Conversação:', testConversationId);
    console.log('   - Mensagem: "Olá! Responda apenas com OK."\n');

    const response = await fetch(CHAT_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testSession.access_token}`,
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        message: 'Olá! Responda apenas com "OK".',
        conversationId: testConversationId,
        conversationHistory: [],
      }),
    });

    console.log('📥 Status da resposta:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(`Erro da função: ${data.error}`);
    }

    console.log('\n✅ Edge Function executada com sucesso');
    console.log(`   - Resposta: ${data.response.substring(0, 100)}...`);
    console.log(`   - Tamanho: ${data.response.length} caracteres\n`);

    return true;
  } catch (error) {
    console.error('❌ FALHOU:', error.message, '\n');
    return false;
  }
}

/**
 * Teste 6: Verificar Mensagens Salvas
 */
async function test6_CheckMessages() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 TESTE 6: Verificar Mensagens Salvas');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    const { data, error } = await supabase
      .from('ChatMessage')
      .select('*')
      .eq('conversationId', testConversationId)
      .order('createdAt', { ascending: true });

    if (error) {
      throw new Error(`Erro ao buscar mensagens: ${error.message}`);
    }

    console.log(`✅ ${data.length} mensagens encontradas na conversa:\n`);

    data.forEach((msg, index) => {
      const role = msg.role === 'USER' ? '👤 USUÁRIO' : '🤖 ASSISTENTE';
      const preview = msg.content.substring(0, 60) + (msg.content.length > 60 ? '...' : '');
      console.log(`   ${index + 1}. ${role}`);
      console.log(`      ${preview}\n`);
    });

    // Verificar se tem resposta do assistente
    const hasAssistantResponse = data.some(msg => msg.role === 'ASSISTANT');

    if (hasAssistantResponse) {
      console.log('✅ Sistema funcionando corretamente - Resposta da IA recebida!\n');
      return true;
    } else {
      console.log('⚠️  Apenas mensagem do usuário encontrada - IA pode não ter respondido\n');
      return false;
    }
  } catch (error) {
    console.error('❌ FALHOU:', error.message, '\n');
    return false;
  }
}

/**
 * Teste 7: Limpar Dados de Teste
 */
async function test7_Cleanup() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧹 TESTE 7: Limpar Dados de Teste');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Deletar mensagens
    const { error: msgError } = await supabase
      .from('ChatMessage')
      .delete()
      .eq('conversationId', testConversationId);

    if (msgError) {
      console.log('⚠️  Erro ao deletar mensagens:', msgError.message);
    } else {
      console.log('✅ Mensagens deletadas');
    }

    // Deletar conversação
    const { error: convError } = await supabase
      .from('ChatConversation')
      .delete()
      .eq('id', testConversationId);

    if (convError) {
      console.log('⚠️  Erro ao deletar conversação:', convError.message);
    } else {
      console.log('✅ Conversação deletada');
    }

    console.log('\n✅ Limpeza concluída\n');
    return true;
  } catch (error) {
    console.error('❌ FALHOU:', error.message, '\n');
    return false;
  }
}

/**
 * Executar todos os testes
 */
async function runAllTests() {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║   INICIANDO BATERIA DE TESTES DO CHAT    ║');
  console.log('╚════════════════════════════════════════════╝\n');

  const results = {
    total: 7,
    passed: 0,
    failed: 0,
    skipped: 0,
  };

  const tests = [
    { name: 'Autenticação', fn: test1_Authentication },
    { name: 'GlobalAIConnection', fn: test2_CheckAIConnection },
    { name: 'Criar Conversação', fn: test3_CreateConversation },
    { name: 'Salvar Mensagem', fn: test4_SaveUserMessage },
    { name: 'Edge Function', fn: test5_CallChatFunction },
    { name: 'Verificar Mensagens', fn: test6_CheckMessages },
    { name: 'Limpeza', fn: test7_Cleanup },
  ];

  let shouldContinue = true;

  for (const test of tests) {
    if (!shouldContinue) {
      results.skipped++;
      continue;
    }

    const success = await test.fn();

    if (success) {
      results.passed++;
    } else {
      results.failed++;
      // Alguns testes podem falhar mas ainda permitir continuar
      if (test.name === 'GlobalAIConnection' || test.name === 'Verificar Mensagens') {
        console.log('ℹ️  Continuando apesar da falha...\n');
      } else {
        shouldContinue = false;
        console.log('❌ Parando testes devido a falha crítica\n');
      }
    }
  }

  // Relatório final
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║          RELATÓRIO FINAL DOS TESTES       ║');
  console.log('╚════════════════════════════════════════════╝\n');
  console.log(`📊 Total de testes: ${results.total}`);
  console.log(`✅ Passou: ${results.passed}`);
  console.log(`❌ Falhou: ${results.failed}`);
  console.log(`⏭️  Pulados: ${results.skipped}\n`);

  if (results.failed === 0) {
    console.log('🎉 TODOS OS TESTES PASSARAM! Sistema funcionando 100%\n');
  } else if (results.passed > results.failed) {
    console.log('⚠️  Alguns testes falharam, mas o sistema está parcialmente funcional\n');
  } else {
    console.log('❌ SISTEMA COM PROBLEMAS - Requer atenção imediata\n');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  process.exit(results.failed > 0 ? 1 : 0);
}

// Executar testes
runAllTests().catch(error => {
  console.error('\n❌ ERRO FATAL:', error);
  process.exit(1);
});
