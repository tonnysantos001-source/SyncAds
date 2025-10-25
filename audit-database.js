// Auditoria completa do banco de dados
const SUPABASE_URL = 'https://ovskepqggmxlfckxqgbr.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92c2tlcHFnZ214bGZja3hxZ2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MjQ4NTUsImV4cCI6MjA3NjQwMDg1NX0.UdNgqpTN38An6FuoJPZlj_zLkmAqfJQXb6i1DdTQO_E';

async function countRecords(table) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*&limit=0`, {
      method: 'HEAD',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
        'Prefer': 'count=exact'
      }
    });
    
    const count = response.headers.get('content-range');
    return count ? parseInt(count.split('/')[1]) : 0;
  } catch (error) {
    return 'ERROR';
  }
}

async function auditDatabase() {
  console.log('🔍 AUDITORIA DO BANCO DE DADOS\n');
  console.log('='*50);
  
  const tables = [
    // SaaS
    'Organization',
    'User',
    'SuperAdmin',
    'GlobalAiConnection',
    'OrganizationAiConnection',
    'Subscription',
    'UsageTracking',
    'AiUsage',
    
    // Chat & IA
    'ChatConversation',
    'ChatMessage',
    'Campaign',
    'Integration',
    
    // E-commerce
    'Category',
    'Product',
    'ProductVariant',
    'ProductImage',
    'Customer',
    'CustomerAddress',
    'Order',
    'OrderItem',
    'Cart',
    'CartItem',
    'Gateway',
    'GatewayConfig',
    'Transaction',
    'Coupon',
    'CouponUsage',
    'Discount'
  ];
  
  console.log('\n📊 CONTAGEM DE REGISTROS:\n');
  
  let totalRecords = 0;
  const results = [];
  
  for (const table of tables) {
    const count = await countRecords(table);
    results.push({ table, count });
    if (typeof count === 'number') {
      totalRecords += count;
    }
  }
  
  // Ordena por quantidade (maior primeiro)
  results.sort((a, b) => {
    if (typeof a.count === 'number' && typeof b.count === 'number') {
      return b.count - a.count;
    }
    return 0;
  });
  
  results.forEach(({ table, count }) => {
    const emoji = count === 0 ? '⚪' : count === 'ERROR' ? '❌' : count > 10 ? '🟢' : '🟡';
    console.log(`${emoji} ${table.padEnd(30)} ${count}`);
  });
  
  console.log('\n' + '='.repeat(50));
  console.log(`\n📈 TOTAL DE REGISTROS: ${totalRecords}\n`);
  
  // Testa uma query específica em User
  console.log('👤 TESTANDO TABELA USER:\n');
  try {
    const userResponse = await fetch(`${SUPABASE_URL}/rest/v1/User?select=id,email,role,organizationId&limit=5`, {
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`
      }
    });
    const users = await userResponse.json();
    console.log('Usuários encontrados:', users.length);
    if (users.length > 0) {
      console.log('Primeiro usuário:', JSON.stringify(users[0], null, 2));
    }
  } catch (error) {
    console.log('Erro ao buscar usuários:', error.message);
  }
}

auditDatabase();
