// test-chat-mobile-fix.js
// Script para testar a conexão com o Supabase e verificar as políticas RLS

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não definidas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Função para simular o login
async function login(email, password) {
  console.log(`🔑 Tentando login com ${email}...`);
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('❌ Erro no login:', error.message);
    return null;
  }

  console.log('✅ Login bem-sucedido!');
  return data;
}

// Função para testar o acesso às conversas
async function testChatAccess(userId) {
  console.log(`\n📱 Testando acesso às conversas para o usuário ${userId}...`);
  
  try {
    // Testar acesso às conversas
    const { data: conversations, error: convError } = await supabase
      .from('ChatConversation')
      .select('*')
      .eq('userId', userId);

    if (convError) {
      console.error('❌ Erro ao acessar conversas:', convError.message);
      return false;
    }

    console.log(`✅ Acesso às conversas bem-sucedido! Encontradas ${conversations.length} conversas.`);
    
    // Se houver conversas, testar acesso às mensagens da primeira conversa
    if (conversations.length > 0) {
      const firstConversation = conversations[0];
      console.log(`\n💬 Testando acesso às mensagens da conversa "${firstConversation.title}"...`);
      
      const { data: messages, error: msgError } = await supabase
        .from('ChatMessage')
        .select('*')
        .eq('conversationId', firstConversation.id);

      if (msgError) {
        console.error('❌ Erro ao acessar mensagens:', msgError.message);
        return false;
      }

      console.log(`✅ Acesso às mensagens bem-sucedido! Encontradas ${messages.length} mensagens.`);
    }

    return true;
  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
    return false;
  }
}

// Função principal
async function main() {
  console.log('🔍 Iniciando teste de acesso ao chat...');
  
  // Solicitar credenciais (em produção, use variáveis de ambiente)
  const email = process.env.TEST_USER_EMAIL || 'usuario@exemplo.com';
  const password = process.env.TEST_USER_PASSWORD || 'senha123';

  // Login
  const authData = await login(email, password);
  if (!authData) {
    console.error('❌ Não foi possível fazer login. Teste abortado.');
    return;
  }

  const userId = authData.user.id;
  
  // Testar acesso ao chat
  const success = await testChatAccess(userId);
  
  if (success) {
    console.log('\n✅✅✅ TESTE CONCLUÍDO COM SUCESSO! O acesso ao chat está funcionando corretamente.');
  } else {
    console.log('\n❌❌❌ TESTE FALHOU! Há problemas no acesso ao chat.');
  }

  // Logout
  await supabase.auth.signOut();
  console.log('\n👋 Sessão encerrada.');
}

// Executar o teste
main().catch(error => {
  console.error('❌ Erro fatal:', error);
});