// Teste DIRETO da Edge Function com User ID hardcoded
const SUPABASE_URL = 'https://ovskepqggmxlfckxqgbr.supabase.co';

async function testChatDirect() {
  try {
    console.log('📤 Testando Edge Function chat-stream...\n');
    
    // Criar um token JWT manualmente com o user ID
    const userId = '3579061d-e050-42de-a11c-c85d10395233';
    const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzYxMTU2MjAwLCJzdWIiOiIzNTc5MDYxZC1lMDUwLTQyZGUtYTExYy1jODVkMTAzOTUyMzMiLCJlbWFpbCI6ImZhdGltYWRyaXZpYUBnbWFpbC5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6e30sInVzZXJfbWV0YWRhdGEiOnt9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6InBhc3N3b3JkIiwidGltZXN0YW1wIjoxNzYxMTU1ODAwfV0sInNlc3Npb25faWQiOiIxMjM0NTY3OCIsImlzcyI6Imh0dHBzOi8vb3Zza2VwcWdnbXhsZmNreHFnYnIuc3VwYWJhc2UuY28vYXV0aC92MSJ9.fake';
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/chat-stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testToken}`,
      },
      body: JSON.stringify({
        message: 'Olá! Este é um teste. Responda com uma frase curta.',
        conversationId: 'test-manual-' + Date.now()
      })
    });
    
    console.log('Status HTTP:', response.status, response.statusText);
    
    const text = await response.text();
    
    if (response.ok) {
      console.log('\n✅ SUCESSO!\n');
      const data = JSON.parse(text);
      console.log('📩 Resposta da IA:');
      console.log('---');
      console.log(data.response);
      console.log('---\n');
    } else {
      console.log('\n❌ ERRO!\n');
      console.log('Detalhes:');
      console.log(text);
      console.log('\n');
    }
    
  } catch (error) {
    console.error('\n💥 Erro fatal:', error.message);
  }
}

testChatDirect();
