// Teste de conexão com Supabase
const SUPABASE_URL = 'https://ovskepqggmxlfckxqgbr.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92c2tlcHFnZ214bGZja3hxZ2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MjQ4NTUsImV4cCI6MjA3NjQwMDg1NX0.UdNgqpTN38An6FuoJPZlj_zLkmAqfJQXb6i1DdTQO_E';

async function testConnection() {
  try {
    console.log('🔌 Conectando ao Supabase...');
    console.log('📍 URL:', SUPABASE_URL);
    
    // Teste simples de conexão
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`
      }
    });
    
    if (response.ok) {
      console.log('✅ Conexão estabelecida com sucesso!');
      console.log('📊 Status:', response.status);
      
      // Testa listar tabelas (Organization)
      const orgResponse = await fetch(`${SUPABASE_URL}/rest/v1/Organization?select=id,name,plan,status&limit=5`, {
        headers: {
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${ANON_KEY}`
        }
      });
      
      const orgs = await orgResponse.json();
      console.log('\n📋 Organizações no banco:', orgs.length);
      console.log(orgs);
      
    } else {
      console.error('❌ Erro na conexão:', response.status, response.statusText);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testConnection();
