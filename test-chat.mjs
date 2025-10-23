// Script de teste do chat
// Usa fetch nativo do Node 18+

const SUPABASE_URL = 'https://ovskepqggmxlfckxqgbr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92c2tlcHFnZ214bGZja3hxZ2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg3NDA1NTYsImV4cCI6MjA0NDMxNjU1Nn0.sI2OtW0v9FxWwSJLrCxI7B5RcWnQ1ERbNaHZPZ1i8Rc';

// Token de um usuário autenticado (você precisa fazer login no app primeiro)
// Por enquanto vou usar o anon key
const AUTH_TOKEN = SUPABASE_ANON_KEY;

async function testChat() {
  console.log('🧪 Testando chat...\n');

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/chat-stream`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        message: 'Olá! Você está funcionando?',
        conversationId: 'test-conversation-' + Date.now()
      })
    });

    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Erro:', error);
      return;
    }

    // Ler stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    console.log('\n📝 Resposta da IA:\n');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            console.log('\n\n✅ Stream finalizado!');
            break;
          }
          try {
            const json = JSON.parse(data);
            const content = json.choices?.[0]?.delta?.content || '';
            if (content) {
              process.stdout.write(content);
              fullResponse += content;
            }
          } catch (e) {
            // Ignora erros de parsing
          }
        }
      }
    }

    console.log('\n\n✅ TESTE CONCLUÍDO!');
    console.log('Resposta completa:', fullResponse.substring(0, 100) + '...');

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testChat();
