/**
 * Script de Diagnóstico - Fluxo do Chat
 *
 * Este script testa o fluxo completo de uma mensagem no chat:
 * 1. Envio da mensagem do usuário
 * 2. Chamada à Edge Function
 * 3. Recebimento da resposta
 * 4. Atualização do estado local
 * 5. Salvamento no banco
 *
 * Para executar: npm run dev e abra o console do navegador
 */

import { supabase } from './src/lib/supabase';
import { sendSecureMessage } from './src/lib/api/chat';

// Configurações de teste
const TEST_CONFIG = {
  message: "Olá, teste de diagnóstico!",
  userId: "REPLACE_WITH_REAL_USER_ID",
  conversationId: "REPLACE_WITH_REAL_CONVERSATION_ID",
};

// Cores para logs
const colors = {
  success: '\x1b[32m✅',
  error: '\x1b[31m❌',
  info: '\x1b[36mℹ️',
  warning: '\x1b[33m⚠️',
  reset: '\x1b[0m',
};

function log(type: keyof typeof colors, message: string, data?: any) {
  console.log(`${colors[type]} ${message}${colors.reset}`, data || '');
}

export async function diagnosticChatFlow() {
  console.log('\n🔍 ========== DIAGNÓSTICO DO CHAT ========== 🔍\n');

  try {
    // ========== PASSO 1: Verificar Sessão ==========
    log('info', 'PASSO 1: Verificando sessão do usuário...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      log('error', 'Sessão inválida ou expirada', sessionError);
      return;
    }

    log('success', `Sessão válida para: ${session.user.email}`);
    console.log('   User ID:', session.user.id);

    // ========== PASSO 2: Verificar Conversas ==========
    log('info', 'PASSO 2: Buscando conversas do usuário...');
    const { data: conversations, error: convError } = await supabase
      .from('ChatConversation')
      .select('*')
      .eq('userId', session.user.id)
      .order('updatedAt', { ascending: false });

    if (convError) {
      log('error', 'Erro ao buscar conversas', convError);
      return;
    }

    if (!conversations || conversations.length === 0) {
      log('warning', 'Nenhuma conversa encontrada. Criando nova conversa...');
      const { data: newConv, error: createError } = await supabase
        .from('ChatConversation')
        .insert({
          userId: session.user.id,
          title: 'Conversa de Teste',
        })
        .select()
        .single();

      if (createError) {
        log('error', 'Erro ao criar conversa', createError);
        return;
      }

      log('success', 'Nova conversa criada', newConv);
      TEST_CONFIG.conversationId = newConv.id;
    } else {
      log('success', `${conversations.length} conversas encontradas`);
      TEST_CONFIG.conversationId = conversations[0].id;
      console.log('   Usando conversa:', conversations[0].title);
    }

    TEST_CONFIG.userId = session.user.id;

    // ========== PASSO 3: Verificar Mensagens Existentes ==========
    log('info', 'PASSO 3: Verificando mensagens existentes...');
    const { data: existingMessages, error: msgError } = await supabase
      .from('ChatMessage')
      .select('*')
      .eq('conversationId', TEST_CONFIG.conversationId)
      .order('createdAt', { ascending: true });

    if (msgError) {
      log('error', 'Erro ao buscar mensagens', msgError);
    } else {
      log('success', `${existingMessages?.length || 0} mensagens existentes`);
      existingMessages?.slice(-3).forEach((msg, i) => {
        console.log(`   ${i + 1}. [${msg.role}] ${msg.content.substring(0, 50)}...`);
      });
    }

    // ========== PASSO 4: Testar Envio de Mensagem ==========
    log('info', 'PASSO 4: Enviando mensagem de teste...');
    console.log('   Mensagem:', TEST_CONFIG.message);

    const startTime = Date.now();

    try {
      const response = await sendSecureMessage(
        TEST_CONFIG.message,
        TEST_CONFIG.conversationId,
        [],
        'Você é um assistente de testes. Responda brevemente.'
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      log('success', `Resposta recebida em ${duration}ms`);
      console.log('   Provider:', response.provider);
      console.log('   Model:', response.model);
      console.log('   Tokens:', response.tokensUsed);
      console.log('   Resposta:', response.response.substring(0, 100) + '...');

      // ========== PASSO 5: Verificar Salvamento no Banco ==========
      log('info', 'PASSO 5: Verificando se mensagens foram salvas...');

      await new Promise(resolve => setTimeout(resolve, 1000)); // Aguardar 1s

      const { data: newMessages, error: newMsgError } = await supabase
        .from('ChatMessage')
        .select('*')
        .eq('conversationId', TEST_CONFIG.conversationId)
        .order('createdAt', { ascending: false })
        .limit(2);

      if (newMsgError) {
        log('error', 'Erro ao verificar novas mensagens', newMsgError);
      } else if (!newMessages || newMessages.length < 2) {
        log('error', `Esperava 2 mensagens, encontrou ${newMessages?.length || 0}`);
        console.log('   ⚠️ PROBLEMA: Mensagens não foram salvas no banco!');
      } else {
        log('success', 'Mensagens salvas corretamente no banco');
        newMessages.forEach((msg, i) => {
          console.log(`   ${i + 1}. [${msg.role}] ${msg.content.substring(0, 50)}...`);
        });
      }

      // ========== PASSO 6: Diagnóstico Final ==========
      console.log('\n📊 ========== DIAGNÓSTICO FINAL ========== 📊\n');

      const issues = [];

      if (!response.response) {
        issues.push('❌ Resposta da IA está vazia');
      }

      if (response.response.includes('error') || response.response.includes('Error')) {
        issues.push('⚠️ Resposta contém mensagem de erro');
      }

      if (!newMessages || newMessages.length < 2) {
        issues.push('❌ Mensagens não foram salvas no banco');
      }

      if (duration > 10000) {
        issues.push('⚠️ Resposta muito lenta (>10s)');
      }

      if (issues.length === 0) {
        log('success', 'TODOS OS TESTES PASSARAM! ✨');
        console.log('\n💡 Se as mensagens ainda não aparecem no frontend:');
        console.log('   1. Verifique se o chatStore está sincronizando');
        console.log('   2. Verifique se há erros no console do navegador');
        console.log('   3. Verifique se o componente ChatMessage está renderizando');
        console.log('   4. Force um refresh do estado: loadConversations(userId)');
      } else {
        log('error', 'PROBLEMAS ENCONTRADOS:');
        issues.forEach(issue => console.log('   ' + issue));
      }

    } catch (apiError: any) {
      log('error', 'Erro na chamada da API', {
        message: apiError.message,
        stack: apiError.stack?.substring(0, 200),
      });
    }

  } catch (error: any) {
    log('error', 'Erro fatal no diagnóstico', {
      message: error.message,
      stack: error.stack,
    });
  }

  console.log('\n🔍 ========== FIM DO DIAGNÓSTICO ========== 🔍\n');
}

// Expor função globalmente para teste no console
if (typeof window !== 'undefined') {
  (window as any).diagnosticChatFlow = diagnosticChatFlow;
  console.log('💡 Diagnóstico disponível! Execute: diagnosticChatFlow()');
}

// Se executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  diagnosticChatFlow();
}
