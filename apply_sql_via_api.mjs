import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

// Ler variáveis de ambiente do .env
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  console.log('Precisa configurar no .env:');
  console.log('  - VITE_SUPABASE_URL');
  console.log('  - VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

console.log('🔗 Conectando ao Supabase:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);

async function executarSQL() {
  console.log('\n🔄 Executando configuração do Gateway Pague-X...\n');

  try {
    // 1. Verificar se Gateway Pague-X já existe
    const { data: existingGateway } = await supabase
      .from('Gateway')
      .select('id, name, slug')
      .eq('slug', 'paguex')
      .maybeSingle();

    if (existingGateway) {
      console.log('✅ Gateway Pague-X já existe:', existingGateway.id);
      console.log('🔄 Atualizando dados...');
      
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

      if (updateError) {
        console.error('❌ Erro ao atualizar:', updateError.message);
        throw updateError;
      }
      console.log('✅ Gateway atualizado com sucesso!');
    } else {
      // Verificar se existe fusionpay para renomear
      const { data: fusionpayGateway } = await supabase
        .from('Gateway')
        .select('id')
        .eq('slug', 'fusionpay')
        .maybeSingle();

      if (fusionpayGateway) {
        console.log('🔄 Encontrado fusionpay, renomeando para paguex...');
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

        if (renameError) {
          console.error('❌ Erro ao renomear:', renameError.message);
          throw renameError;
        }
        console.log('✅ Gateway fusionpay renomeado para paguex!');
      } else {
        console.log('📦 Criando novo gateway Pague-X...');
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

        if (insertError) {
          console.error('❌ Erro ao criar:', insertError.message);
          throw insertError;
        }
        console.log('✅ Gateway criado com sucesso!');
      }
    }

    // 2. Verificar resultado final
    const { data: gateway, error: verifyError } = await supabase
      .from('Gateway')
      .select('*')
      .eq('slug', 'paguex')
      .single();

    if (verifyError) {
      console.error('❌ Erro ao verificar:', verifyError.message);
      throw verifyError;
    }

    console.log('\n════════════════════════════════════════════════════════');
    console.log('✅ PAGUE-X CONFIGURADO COM SUCESSO!');
    console.log('════════════════════════════════════════════════════════');
    console.log('📋 Detalhes:');
    console.log('  ID:', gateway.id);
    console.log('  Nome:', gateway.name);
    console.log('  Slug:', gateway.slug);
    console.log('  API:', gateway.apiUrl);
    console.log('  Website:', gateway.websiteUrl);
    console.log('  Docs:', gateway.documentationUrl);
    console.log('\n🎯 Suporte:');
    console.log('  PIX:', gateway.supportsPix ? '✅' : '❌');
    console.log('  Cartão Crédito:', gateway.supportsCreditCard ? '✅' : '❌');
    console.log('  Cartão Débito:', gateway.supportsDebitCard ? '✅' : '❌');
    console.log('  Boleto:', gateway.supportsBoleto ? '✅' : '❌');
    console.log('  Wallet:', gateway.supportsWallet ? '✅' : '❌');
    console.log('\n⚙️  Status:');
    console.log('  Ativo:', gateway.isActive ? '✅' : '❌');
    console.log('  Escopo:', gateway.scope);
    console.log('  Credenciais:', gateway.requiredCredentials.join(', '));
    console.log('════════════════════════════════════════════════════════\n');
    
    console.log('🎉 Próximos passos:');
    console.log('1. Configure as credenciais no dashboard');
    console.log('2. Acesse: Dashboard > Checkout > Gateways > Pague-X');
    console.log('3. Adicione sua publicKey e secretKey');
    console.log('4. Marque como gateway padrão');
    console.log('5. Teste um pagamento!\n');

  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    console.error('Detalhes:', error);
    process.exit(1);
  }
}

executarSQL();
