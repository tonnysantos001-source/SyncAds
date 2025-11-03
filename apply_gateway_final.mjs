import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && values.length) {
    env[key.trim()] = values.join('=').trim().replace(/^["']|["']$/g, '');
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: .env não encontrado');
  process.exit(1);
}

console.log('🔗 Conectando ao Supabase...');
const supabase = createClient(supabaseUrl, supabaseKey);

const gatewayData = {
  name: 'Pague-X',
  slug: 'paguex',
  description: 'Gateway Pague-X (inpagamentos.com) - PIX, Cartão, Boleto',
  type: 'PAYMENT_PROCESSOR',
  supportsPix: true,
  supportsCreditCard: true,
  supportsBoleto: true,
  supportsDebit: true,
  requiredFields: { publicKey: 'Chave Pública', secretKey: 'Chave Secreta', environment: 'Ambiente' },
  documentation: 'https://app.inpagamentos.com/docs/intro/first-steps',
  isActive: true,
  isPopular: false
};

async function main() {
  console.log('\n🔄 Configurando Gateway Pague-X...\n');
  
  try {
    // 1. Tentar renomear fusionpay
    const { data: fusionpay } = await supabase
      .from('Gateway')
      .select('id')
      .eq('slug', 'fusionpay')
      .maybeSingle();

    if (fusionpay) {
      console.log('🔄 Renomeando fusionpay → paguex...');
      await supabase.from('Gateway').update(gatewayData).eq('slug', 'fusionpay');
      console.log('✅ Renomeado!');
    }

    // 2. Verificar se existe paguex
    const { data: existing } = await supabase
      .from('Gateway')
      .select('id')
      .eq('slug', 'paguex')
      .maybeSingle();

    if (existing) {
      console.log('✅ Gateway existe, atualizando...');
      await supabase.from('Gateway').update(gatewayData).eq('slug', 'paguex');
    } else {
      console.log('📦 Criando gateway...');
      await supabase.from('Gateway').insert(gatewayData);
    }

    // 3. Buscar resultado final
    const { data: gateway } = await supabase
      .from('Gateway')
      .select('*')
      .eq('slug', 'paguex')
      .limit(1);

    if (!gateway || gateway.length === 0) {
      throw new Error('Gateway não encontrado após criação!');
    }

    const g = gateway[0];

    console.log('\n════════════════════════════════════════════════════════');
    console.log('✅ PAGUE-X CONFIGURADO COM SUCESSO!');
    console.log('════════════════════════════════════════════════════════');
    console.log('ID:', g.id);
    console.log('Nome:', g.name);
    console.log('Slug:', g.slug);
    console.log('Docs:', g.documentation);
    console.log('\nSuporte: PIX ✅ | Cartão ✅ | Boleto ✅ | Débito ✅');
    console.log('Status: Ativo ✅');
    console.log('════════════════════════════════════════════════════════\n');
    console.log('🎉 Próximo: Configure as credenciais no dashboard!');
    console.log('   Dashboard > Checkout > Gateways > Pague-X\n');

  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    process.exit(1);
  }
}

main();
