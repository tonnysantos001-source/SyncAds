const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Ler variáveis de ambiente
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  console.log('Precisa configurar:');
  console.log('  - VITE_SUPABASE_URL');
  console.log('  - VITE_SUPABASE_SERVICE_ROLE_KEY ou VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executarSQL() {
  console.log('🔄 Executando SQL no Supabase...\n');

  try {
    // 1. Atualizar/Criar Gateway Pague-X
    const { data: existingGateway, error: checkError } = await supabase
      .from('Gateway')
      .select('id')
      .eq('slug', 'paguex')
      .single();

    if (existingGateway) {
      console.log('✅ Gateway Pague-X já existe, atualizando...');
      const { error: updateError } = await supabase
        .from('Gateway')
        .update({
          name: 'Pague-X',
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
          scope: 'NACIONAL_GLOBAL',
          updatedAt: new Date().toISOString()
        })
        .eq('slug', 'paguex');

      if (updateError) throw updateError;
      console.log('✅ Gateway atualizado com sucesso!');
    } else {
      console.log('📦 Gateway Pague-X não existe, criando...');
      
      // Verificar se existe fusionpay para atualizar
      const { data: fusionpayGateway } = await supabase
        .from('Gateway')
        .select('id')
        .eq('slug', 'fusionpay')
        .single();

      if (fusionpayGateway) {
        console.log('🔄 Renomeando fusionpay para paguex...');
        const { error: renameError } = await supabase
          .from('Gateway')
          .update({
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
            scope: 'NACIONAL_GLOBAL',
            updatedAt: new Date().toISOString()
          })
          .eq('slug', 'fusionpay');

        if (renameError) throw renameError;
        console.log('✅ Gateway renomeado com sucesso!');
      } else {
        const { error: insertError } = await supabase
          .from('Gateway')
          .insert({
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
          });

        if (insertError) throw insertError;
        console.log('✅ Gateway criado com sucesso!');
      }
    }

    // 2. Verificar resultado
    const { data: gateway, error: verifyError } = await supabase
      .from('Gateway')
      .select('*')
      .eq('slug', 'paguex')
      .single();

    if (verifyError) throw verifyError;

    console.log('\n════════════════════════════════════════');
    console.log('✅ PAGUE-X CONFIGURADO COM SUCESSO!');
    console.log('════════════════════════════════════════');
    console.log('ID:', gateway.id);
    console.log('Nome:', gateway.name);
    console.log('Slug:', gateway.slug);
    console.log('API:', gateway.apiUrl);
    console.log('Suporta PIX:', gateway.supportsPix ? '✅' : '❌');
    console.log('Suporta Cartão:', gateway.supportsCreditCard ? '✅' : '❌');
    console.log('Suporta Boleto:', gateway.supportsBoleto ? '✅' : '❌');
    console.log('Ativo:', gateway.isActive ? '✅' : '❌');
    console.log('════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Erro ao executar SQL:', error.message);
    process.exit(1);
  }
}

executarSQL();
