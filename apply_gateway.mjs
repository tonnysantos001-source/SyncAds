import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Ler .env manualmente
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
  console.error('❌ Erro: Variáveis de ambiente não encontradas no .env');
  process.exit(1);
}

console.log('🔗 Conectando ao Supabase...');
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('\n🔄 Configurando Gateway Pague-X...\n');

  try {
    // Verificar se já existe
    const { data: existing } = await supabase
      .from('Gateway')
      .select('id')
      .eq('slug', 'paguex')
      .maybeSingle();

    const gatewayData = {
      name: 'Pague-X',
      slug: 'paguex',
      apiUrl: 'https://api.inpagamentos.com/v1',
      websiteUrl: 'https://inpagamentos.com',
      documentationUrl: 'https://app.inpagamentos.com/docs/intro/first-steps',
      requiredCredentials: ['publicKey', 'secretKey'],
      supportsPix: true,
      supportsCreditCard: true,
      supportsBoleto: true,
      supportsDebitCard: true,
      supportsWallet: false,
      isActive: true,
      scope: 'NACIONAL_GLOBAL'
    };

    if (existing) {
      console.log('✅ Gateway já existe, atualizando...');
      const { error } = await supabase
        .from('Gateway')
        .update(gatewayData)
        .eq('slug', 'paguex');
      if (error) throw error;
    } else {
      // Verificar fusionpay
      const { data: fusionpay } = await supabase
        .from('Gateway')
        .select('id')
        .eq('slug', 'fusionpay')
        .maybeSingle();

      if (fusionpay) {
        console.log('🔄 Renomeando fusionpay → paguex...');
        const { error } = await supabase
          .from('Gateway')
          .update(gatewayData)
          .eq('slug', 'fusionpay');
        if (error) throw error;
      } else {
        console.log('📦 Criando novo gateway...');
        const { error } = await supabase
          .from('Gateway')
          .insert(gatewayData);
        if (error) throw error;
      }
    }

    // Verificar resultado
    const { data: gateway, error } = await supabase
      .from('Gateway')
      .select('*')
      .eq('slug', 'paguex')
      .single();

    if (error) throw error;

    console.log('\n════════════════════════════════════════════════════════');
    console.log('✅ PAGUE-X CONFIGURADO COM SUCESSO!');
    console.log('════════════════════════════════════════════════════════');
    console.log('ID:', gateway.id);
    console.log('Nome:', gateway.name);
    console.log('API:', gateway.apiUrl);
    console.log('PIX:', gateway.supportsPix ? '✅' : '❌');
    console.log('Cartão:', gateway.supportsCreditCard ? '✅' : '❌');
    console.log('Boleto:', gateway.supportsBoleto ? '✅' : '❌');
    console.log('════════════════════════════════════════════════════════\n');
    console.log('🎉 Próximos passos:');
    console.log('1. Dashboard > Checkout > Gateways > Pague-X');
    console.log('2. Configure: publicKey + secretKey');
    console.log('3. Marque como padrão');
    console.log('4. Teste um pagamento!\n');

  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    process.exit(1);
  }
}

main();
