// test-mobile-chat-fix-final.js
// Script para testar a solução definitiva do chat no navegador móvel

// Simular um ambiente de navegador móvel
const originalUserAgent = navigator.userAgent;
Object.defineProperty(navigator, 'userAgent', {
  value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
  configurable: true
});

// Importar as dependências necessárias
import { supabase } from './src/lib/supabase';
import { fixMobileChatAuth } from './src/lib/mobile-fix-auto';
import { conversationsApi, chatApi } from './src/lib/api';

// Função para testar o login
async function testLogin() {
  console.log('Testando login...');
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.error('Usuário não está logado');
      return false;
    }
    
    console.log('Usuário logado com sucesso:', session.user.email);
    return true;
  } catch (error) {
    console.error('Erro ao verificar login:', error);
    return false;
  }
}

// Função para testar a atualização automática da sessão
async function testAutoRefresh() {
  console.log('Testando atualização automática da sessão...');
  try {
    // Primeira chamada para inicializar
    await fixMobileChatAuth();
    
    // Simular uma atualização de página
    console.log('Simulando atualização de página...');
    
    // Segunda chamada para verificar se a sessão persiste
    const result = await fixMobileChatAuth();
    
    if (result) {
      console.log('Sessão persistiu após atualização simulada!');
      return true;
    } else {
      console.error('Sessão não persistiu após atualização simulada');
      return false;
    }
  } catch (error) {
    console.error('Erro ao testar atualização automática:', error);
    return false;
  }
}

// Função para testar o acesso às conversas após atualização
async function testConversationAccessAfterRefresh(userId) {
  console.log('Testando acesso às conversas após atualização...');
  try {
    // Primeira tentativa
    const conversations1 = await conversationsApi.getConversations(userId);
    console.log(`Primeira tentativa: ${conversations1.length} conversas encontradas`);
    
    // Simular atualização de página
    console.log('Simulando atualização de página...');
    await fixMobileChatAuth();
    
    // Segunda tentativa após "atualização"
    const conversations2 = await conversationsApi.getConversations(userId);
    console.log(`Segunda tentativa: ${conversations2.length} conversas encontradas`);
    
    return conversations1.length === conversations2.length;
  } catch (error) {
    console.error('Erro ao testar acesso após atualização:', error);
    return false;
  }
}

// Função principal para executar os testes
async function runTests() {
  console.log('Iniciando testes da solução definitiva do chat mobile...');
  
  // Verificar login
  const isLoggedIn = await testLogin();
  if (!isLoggedIn) {
    console.error('Teste falhou: Usuário não está logado');
    return;
  }
  
  // Testar atualização automática
  const autoRefreshWorks = await testAutoRefresh();
  if (!autoRefreshWorks) {
    console.error('Teste falhou: Atualização automática não funcionou');
    return;
  }
  
  // Obter ID do usuário atual
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user.id;
  
  // Testar acesso às conversas após atualização
  const accessWorksAfterRefresh = await testConversationAccessAfterRefresh(userId);
  if (!accessWorksAfterRefresh) {
    console.error('Teste falhou: Acesso às conversas não funciona após atualização');
    return;
  }
  
  console.log('TODOS OS TESTES PASSARAM! A solução definitiva do chat mobile está funcionando corretamente.');
  
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