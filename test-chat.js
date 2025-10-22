// Script para testar Edge Function chat-stream
const SUPABASE_URL = 'https://ovskepqggmxlfckxqgbr.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92c2tlcHFnZ214bGZja3hxZ2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MjQ4NTUsImV4cCI6MjA3NjQwMDg1NX0.UdNgqpTN38An6FuoJPZlj_zLkmAqfJQXb6i1DdTQO_E';

// Primeiro fazer login para pegar o token real
async function login() {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': ANON_KEY
    },
    body: JSON.stringify({
      email: 'fatimadrivia@gmail.com',
      password: 'senha123' // ALTERAR SE NECESSÁRIO
    })
  });
  
  const data = await response.json();
  console.log('Login response:', data.error ? data.error.message : 'OK');
  return data.access_token;
}

// Testar a Edge Function
async function testChat() {
  try {
    console.log('\n🔐 Fazendo login...');
    const token = await login();
    
    if (!token) {
      console.error('❌ Login falhou! Verifique email/senha');
      return;
    }
    
    console.log('✅ Login OK, token obtido\n');
    
    console.log('📤 Enviando mensagem para Edge Function...');
    const response = await fetch(`${SUPABASE_URL}/functions/v1/chat-stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'apikey': ANON_KEY
      },
      body: JSON.stringify({
        message: 'Olá! Você está funcionando?',
        conversationId: 'test-' + Date.now()
      })
    });
    
    console.log('Status:', response.status, response.statusText);
    
    const text = await response.text();
    console.log('\n📥 Resposta da Edge Function:');
    console.log(text);
    
    if (response.ok) {
      const data = JSON.parse(text);
      console.log('\n✅ SUCESSO! IA respondeu:');
      console.log(data.response);
    } else {
      console.log('\n❌ ERRO! Status:', response.status);
      console.log('Detalhes:', text);
    }
    
  } catch (error) {
    console.error('\n💥 Erro ao testar:', error.message);
  }
}

testChat();
