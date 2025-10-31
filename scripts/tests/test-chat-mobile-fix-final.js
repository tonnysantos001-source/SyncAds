// test-chat-mobile-fix-final.js
// Script para testar a solução do chat no navegador móvel

// Simular um ambiente de navegador móvel
const originalUserAgent = navigator.userAgent;
Object.defineProperty(navigator, 'userAgent', {
  value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
  configurable: true
});

// Importar as dependências necessárias
import { supabase } from './src/lib/supabase';
import { fixMobileChatAuth, withMobileFix } from './src/lib/mobile-fix';
import { conversationsApi, chatApi } from './src/lib/api';

// Função para testar o login
async function testLogin() {
  console.log('Testando login...');
  try {
    // Obter a sessão atual
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.error('Erro: Usuário não está logado. Faça login primeiro.');
      return false;
    }
    
    console.log('Login verificado com sucesso!');
    return true;
  } catch (error) {
    console.error('Erro ao verificar login:', error);
    return false;
  }
}

// Função para testar o acesso às conversas
async function testConversationAccess(userId) {
  console.log('Testando acesso às conversas...');
  try {
    // Testar sem a correção
    try {
      console.log('Tentando acessar conversas SEM a correção...');
      const conversations = await conversationsApi.getConversations(userId);
      console.log(`Sucesso! ${conversations.length} conversas encontradas sem a correção.`);
    } catch (error) {
      console.error('Erro ao acessar conversas sem a correção:', error);
    }
    
    // Testar com a correção
    console.log('Tentando acessar conversas COM a correção...');
    const conversations = await withMobileFix(() => 
      conversationsApi.getConversations(userId)
    );
    
    console.log(`Sucesso! ${conversations.length} conversas encontradas com a correção.`);
    return true;
  } catch (error) {
    console.error('Erro ao acessar conversas com a correção:', error);
    return false;
  }
}

// Função para testar a criação de uma conversa
async function testCreateConversation(userId) {
  console.log('Testando criação de conversa...');
  try {
    const title = `Teste Mobile ${new Date().toISOString()}`;
    
    // Criar conversa com a correção
    const conversation = await withMobileFix(() => 
      conversationsApi.createConversation(userId, title)
    );
    
    console.log('Conversa criada com sucesso:', conversation.id);
    return conversation.id;
  } catch (error) {
    console.error('Erro ao criar conversa:', error);
    return null;
  }
}

// Função para testar o envio de mensagem
async function testSendMessage(userId, conversationId) {
  console.log('Testando envio de mensagem...');
  try {
    if (!conversationId) {
      console.error('ID de conversa inválido');
      return false;
    }
    
    // Enviar mensagem com a correção
    await withMobileFix(() => 
      chatApi.createMessage(
        userId,
        conversationId,
        'USER',
        'Esta é uma mensagem de teste da correção mobile'
      )
    );
    
    console.log('Mensagem enviada com sucesso!');
    return true;
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    return false;
  }
}

// Função principal para executar os testes
async function runTests() {
  console.log('Iniciando testes da correção do chat mobile...');
  
  // Verificar login
  const isLoggedIn = await testLogin();
  if (!isLoggedIn) {
    console.error('Teste falhou: Usuário não está logado');
    return;
  }
  
  // Obter ID do usuário atual
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user.id;
  
  // Testar acesso às conversas
  const canAccessConversations = await testConversationAccess(userId);
  if (!canAccessConversations) {
    console.error('Teste falhou: Não foi possível acessar as conversas');
    return;
  }
  
  // Testar criação de conversa
  const conversationId = await testCreateConversation(userId);
  if (!conversationId) {
    console.error('Teste falhou: Não foi possível criar uma conversa');
    return;
  }
  
  // Testar envio de mensagem
  const canSendMessage = await testSendMessage(userId, conversationId);
  if (!canSendMessage) {
    console.error('Teste falhou: Não foi possível enviar uma mensagem');
    return;
  }
  
  console.log('TODOS OS TESTES PASSARAM! A correção do chat mobile está funcionando corretamente.');
  
  // Restaurar o user agent original
  Object.defineProperty(navigator, 'userAgent', {
    value: originalUserAgent,
    configurable: true
  });
}

// Executar os testes
runTests().catch(error => {
  console.error('Erro ao executar testes:', error);
});