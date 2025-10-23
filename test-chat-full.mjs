// Script completo: Login + Teste Chat
const SUPABASE_URL = 'https://ovskepqggmxlfckxqgbr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92c2tlcHFnZ214bGZja3hxZ2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MjQ4NTUsImV4cCI6MjA3NjQwMDg1NX0.UdNgqpTN38An6FuoJPZlj_zLkmAqfJQXb6i1DdTQO_E';

// Credenciais do super admin
const EMAIL = 'admin@syncads.com';
const PASSWORD = 'admin123';

async function login() {
  console.log('🔐 Fazendo login...');
  
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: EMAIL,
      password: PASSWORD
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Login failed: ${error}`);
  }

  const data = await response.json();
  console.log('✅ Login OK! User:', data.user?.email);
  return data.access_token;
}

async function testChat(authToken) {
  console.log('\n🧪 Testando chat...\n');

  const response = await fetch(`${SUPABASE_URL}/functions/v1/chat-stream`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY
    },
    body: JSON.stringify({
      message: 'Olá! Você está funcionando? Por favor, responda brevemente.',
      conversationId: 'test-' + Date.now()
    })
  });

  console.log('Status:', response.status);

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ Erro:', error);
    return false;
  }

  // Ler stream
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullResponse = '';

  console.log('📝 Resposta da IA:\n');

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') break;
          
          try {
            const json = JSON.parse(data);
            const content = json.choices?.[0]?.delta?.content || '';
            if (content) {
              process.stdout.write(content);
              fullResponse += content;
            }
          } catch (e) {
            // Ignora parsing errors
          }
        }
      }
    }
  } catch (e) {
    console.error('\n❌ Erro ao ler stream:', e.message);
    return false;
  }

  console.log('\n\n✅ CHAT FUNCIONANDO!');
  console.log(`\nResposta completa (${fullResponse.length} chars):`, fullResponse.substring(0, 150) + '...');
  return true;
}

async function main() {
  try {
    const token = await login();
    const success = await testChat(token);
    
    if (success) {
      console.log('\n\n🎉 TESTE COMPLETO! Chat está 100% operacional!');
      process.exit(0);
    } else {
      console.log('\n\n❌ TESTE FALHOU! Verificar erros acima.');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Erro fatal:', error.message);
    process.exit(1);
  }
}

main();
