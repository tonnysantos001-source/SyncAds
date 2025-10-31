// TESTE_SOLUCAO_CHAT_MOBILE.js
// Script para testar a solução do problema de chat no navegador móvel

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não definidas');
  process.exit(1);
}

// Criar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// Função para fazer login
async function fazerLogin(email, senha) {
  console.log(`🔑 Tentando login com ${email}...`);
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: senha
  });
  
  if (error) {
    console.error('❌ Erro no login:', error.message);
    return null;
  }
  
  console.log('✅ Login bem-sucedido!');
  return data.user;
}

// Função para testar acesso às conversas
async function testarAcessoConversas(userId) {
  console.log('\n📝 Testando acesso às conversas...');
  
  const { data, error } = await supabase
    .from('ChatConversation')
    .select('id, title, createdAt, updatedAt')
    .eq('userId', userId)
    .order('updatedAt', { ascending: false })
    .limit(5);
  
  if (error) {
    console.error('❌ Erro ao acessar conversas:', error.message);
    return false;
  }
  
  console.log(`✅ Acesso bem-sucedido! ${data.length} conversas encontradas.`);
  return data;
}

// Função para testar criação de conversa
async function testarCriacaoConversa(userId) {
  console.log('\n📝 Testando criação de conversa...');
  
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('ChatConversation')
    .insert({
      id: crypto.randomUUID(),
      userId: userId,
      title: `Teste Mobile ${now}`,
      createdAt: now,
      updatedAt: now
    })
    .select()
    .single();
  
  if (error) {
    console.error('❌ Erro ao criar conversa:', error.message);
    return null;
  }
  
  console.log('✅ Conversa criada com sucesso!');
  return data;
}

// Função para testar envio de mensagem
async function testarEnvioMensagem(userId, conversationId) {
  console.log('\n📝 Testando envio de mensagem...');
  
  const { data, error } = await supabase
    .from('ChatMessage')
    .insert({
      id: crypto.randomUUID(),
      userId: userId,
      conversationId: conversationId,
      role: 'USER',
      content: 'Mensagem de teste do navegador móvel',
      createdAt: new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) {
    console.error('❌ Erro ao enviar mensagem:', error.message);
    return false;
  }
  
  console.log('✅ Mensagem enviada com sucesso!');
  return true;
}

// Função principal de teste
async function executarTestes() {
  console.log('🧪 INICIANDO TESTES DA SOLUÇÃO DE CHAT MOBILE');
  console.log('============================================');
  
  // Solicitar credenciais
  const email = process.argv[2] || 'teste@exemplo.com';
  const senha = process.argv[3] || 'senha123';
  
  // Fazer login
  const user = await fazerLogin(email, senha);
  if (!user) return;
  
  // Testar acesso às conversas
  const conversas = await testarAcessoConversas(user.id);
  
  // Testar criação de conversa
  const novaConversa = await testarCriacaoConversa(user.id);
  if (!novaConversa) return;
  
  // Testar envio de mensagem
  const mensagemEnviada = await testarEnvioMensagem(user.id, novaConversa.id);
  
  // Resultado final
  console.log('\n📊 RESULTADO DOS TESTES');
  console.log('============================================');
  console.log(`Login: ${user ? '✅ Sucesso' : '❌ Falha'}`);
  console.log(`Acesso às conversas: ${conversas ? '✅ Sucesso' : '❌ Falha'}`);
  console.log(`Criação de conversa: ${novaConversa ? '✅ Sucesso' : '❌ Falha'}`);
  console.log(`Envio de mensagem: ${mensagemEnviada ? '✅ Sucesso' : '❌ Falha'}`);
  
  if (user && conversas && novaConversa && mensagemEnviada) {
    console.log('\n🎉 TODOS OS TESTES PASSARAM! A solução parece estar funcionando corretamente.');
  } else {
    console.log('\n⚠️ ALGUNS TESTES FALHARAM. Verifique os erros acima.');
  }
}

// Executar testes
executarTestes().catch(err => {
  console.error('❌ Erro não tratado:', err);
});