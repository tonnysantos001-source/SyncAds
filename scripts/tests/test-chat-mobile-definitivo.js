// Script para testar a solução definitiva do chat mobile
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

// Credenciais de teste
const TEST_EMAIL = 'usuario.teste@example.com';
const TEST_PASSWORD = 'senha_segura_123';

// Simular navegador móvel
const originalUserAgent = navigator.userAgent;
Object.defineProperty(navigator, 'userAgent', {
  value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
  configurable: true
});

// Criar cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Função para testar login
async function testarLogin() {
  console.log('Testando login no dispositivo móvel...');
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD
  });
  
  if (error) {
    console.error('Erro ao fazer login:', error);
    return false;
  }
  
  console.log('Login bem-sucedido:', data.user.email);
  return true;
}

// Função para testar acesso às conversas
async function testarAcessoConversas() {
  console.log('Testando acesso às conversas...');
  
  const { data, error } = await supabase
    .from('ChatConversation')
    .select('*')
    .limit(5);
  
  if (error) {
    console.error('Erro ao acessar conversas:', error);
    return false;
  }
  
  console.log(`Acessou ${data.length} conversas com sucesso`);
  return true;
}

// Função para testar acesso às mensagens
async function testarAcessoMensagens() {
  console.log('Testando acesso às mensagens...');
  
  // Primeiro, obter uma conversa
  const { data: conversas, error: erroConversas } = await supabase
    .from('ChatConversation')
    .select('id')
    .limit(1);
  
  if (erroConversas || !conversas.length) {
    console.error('Erro ao obter conversa:', erroConversas);
    return false;
  }
  
  const conversationId = conversas[0].id;
  
  // Agora, obter mensagens dessa conversa
  const { data: mensagens, error: erroMensagens } = await supabase
    .from('ChatMessage')
    .select('*')
    .eq('conversationId', conversationId)
    .limit(5);
  
  if (erroMensagens) {
    console.error('Erro ao acessar mensagens:', erroMensagens);
    return false;
  }
  
  console.log(`Acessou ${mensagens.length} mensagens com sucesso`);
  return true;
}

// Função para simular atualização da página
async function testarAposAtualizacao() {
  console.log('Simulando atualização da página...');
  
  // Obter a sessão atual
  const { data: { session } } = await supabase.auth.getSession();
  
  // Criar um novo cliente Supabase (simulando uma atualização da página)
  const novoSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
  
  // Definir a sessão manualmente
  if (session) {
    await novoSupabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token
    });
  }
  
  // Testar acesso às conversas com o novo cliente
  console.log('Testando acesso às conversas após atualização...');
  
  const { data, error } = await novoSupabase
    .from('ChatConversation')
    .select('*')
    .limit(5);
  
  if (error) {
    console.error('Erro ao acessar conversas após atualização:', error);
    return false;
  }
  
  console.log(`Acessou ${data.length} conversas com sucesso após atualização`);
  return true;
}

// Função principal para executar todos os testes
async function executarTestes() {
  try {
    console.log('Iniciando testes da solução definitiva do chat mobile...');
    
    // Testar login
    const loginSucesso = await testarLogin();
    if (!loginSucesso) {
      console.error('Teste de login falhou');
      return;
    }
    
    // Testar acesso às conversas
    const conversasSucesso = await testarAcessoConversas();
    if (!conversasSucesso) {
      console.error('Teste de acesso às conversas falhou');
      return;
    }
    
    // Testar acesso às mensagens
    const mensagensSucesso = await testarAcessoMensagens();
    if (!mensagensSucesso) {
      console.error('Teste de acesso às mensagens falhou');
      return;
    }
    
    // Testar após atualização
    const atualizacaoSucesso = await testarAposAtualizacao();
    if (!atualizacaoSucesso) {
      console.error('Teste após atualização falhou');
      return;
    }
    
    console.log('TODOS OS TESTES PASSARAM COM SUCESSO!');
    console.log('A solução definitiva do chat mobile está funcionando corretamente.');
  } catch (error) {
    console.error('Erro durante a execução dos testes:', error);
  } finally {
    // Restaurar o user agent original
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      configurable: true
    });
  }
}

// Executar os testes
executarTestes();