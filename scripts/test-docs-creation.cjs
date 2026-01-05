/**
 * Script de Teste: Fluxo de Criação de Documentos do Google Docs
 * 
 * Testa o fluxo completo:
 * 1. Navegação para criar novo documento
 * 2. Inserção de conteúdo no documento
 * 3. Captura e persistência da URL do documento
 * 
 * Uso: node scripts/test-docs-creation.cjs
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ovskepqggmxlfckxqgbr.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

// Simular credenciais (você precisará pegar de um usuário real)
const TEST_USER_ID = process.env.TEST_USER_ID;
const TEST_DEVICE_ID = process.env.TEST_DEVICE_ID;
const TEST_ACCESS_TOKEN = process.env.TEST_ACCESS_TOKEN;

if (!SUPABASE_ANON_KEY || !TEST_USER_ID || !TEST_DEVICE_ID || !TEST_ACCESS_TOKEN) {
    console.error('❌ Variáveis de ambiente faltando. Configure:');
    console.error('   - VITE_SUPABASE_ANON_KEY');
    console.error('   - TEST_USER_ID');
    console.error('   - TEST_DEVICE_ID');
    console.error('  - TEST_ACCESS_TOKEN');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
        headers: {
            Authorization: `Bearer ${TEST_ACCESS_TOKEN}`
        }
    }
});

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function testDocsCreationFlow() {
    console.log('\n🚀 Iniciando teste do fluxo de criação de documentos...\n');

    try {
        // 1. Inserir comando de NAVEGAÇÃO
        console.log('📍 Step 1: Inserindo comando NAVIGATE...');

        const navigateCommand = {
            device_id: TEST_DEVICE_ID,
            type: 'navigate',
            payload: {
                url: 'https://docs.google.com/document/create'
            },
            status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data: navCmd, error: navError } = await supabase
            .from('extension_commands')
            .insert(navigateCommand)
            .select()
            .single();

        if (navError) {
            console.error('❌ Erro ao inserir comando navigate:', navError);
            return;
        }

        console.log(`✅ Comando NAVIGATE inserido (ID: ${navCmd.id})`);
        console.log('⏳ Aguardando 10 segundos para processamento...\n');
        await sleep(10000);

        // Verificar status do comando
        const { data: navStatus } = await supabase
            .from('extension_commands')
            .select('*')
            .eq('id', navCmd.id)
            .single();

        console.log(`📊 Status do comando NAVIGATE: ${navStatus.status}`);
        if (navStatus.status !== 'completed') {
            console.warn(`⚠️ Comando não completado. Status atual: ${navStatus.status}`);
        }

        // 2. Inserir comando de INSERT_CONTENT
        console.log('\n📍 Step 2: Inserindo comando INSERT_CONTENT...');

        const content = `# Receita de Pão de Queijo

## Ingredientes
- 500g de polvilho azedo
- 250ml de leite
- 100ml de óleo
- 2 ovos
- 200g de queijo minas ralado
- Sal a gosto

## Modo de Preparo
1. Ferva o leite e o óleo
2. Despeje sobre o polvilho e misture bem
3. Adicione os ovos e o queijo
4. Faça bolinhas e asse a 180°C por 25 minutos`;

        const insertCommand = {
            device_id: TEST_DEVICE_ID,
            type: 'insert_content',
            payload: {
                value: content,
                format: 'text'
            },
            status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data: insertCmd, error: insertError } = await supabase
            .from('extension_commands')
            .insert(insertCommand)
            .select()
            .single();

        if (insertError) {
            console.error('❌ Erro ao inserir comando insert_content:', insertError);
            return;
        }

        console.log(`✅ Comando INSERT_CONTENT inserido (ID: ${insertCmd.id})`);
        console.log('⏳ Aguardando 15 segundos para processamento...\n');
        await sleep(15000);

        // Verificar status do comando de inserção
        const { data: insertStatus } = await supabase
            .from('extension_commands')
            .select('*')
            .eq('id', insertCmd.id)
            .single();

        console.log(`📊 Status do comando INSERT_CONTENT: ${insertStatus.status}`);

        // 3. Verificar se URL foi capturada
        console.log('\n📍 Step 3: Verificando captura da URL...');

        if (insertStatus.metadata?.document_url) {
            console.log('✅ URL do documento capturada:');
            console.log(`   📄 URL: ${insertStatus.metadata.document_url}`);
            console.log(`   🆔 Document ID: ${insertStatus.metadata.document_id}`);
            console.log(`   🕒 Captured at: ${insertStatus.metadata.url_captured_at}`);
        } else if (navStatus.metadata?.document_url) {
            console.log('✅ URL do documento capturada (no comando navigate):');
            console.log(`   📄 URL: ${navStatus.metadata.document_url}`);
            console.log(`   🆔 Document ID: ${navStatus.metadata.document_id}`);
        } else {
            console.warn('⚠️ URL do documento NÃO foi capturada');
            console.log('   Metadata do comando INSERT:');
            console.log(JSON.stringify(insertStatus.metadata, null, 2));
        }

        // 4. Verificar sinais DOM
        console.log('\n📍 Step 4: Verificando sinais DOM...');

        const hasDocumentSignal = insertStatus.metadata?.document_signal;
        if (hasDocumentSignal) {
            console.log('✅ Sinal DOCUMENT_CREATED encontrado:');
            console.log(JSON.stringify(hasDocumentSignal, null, 2));
        } else {
            console.warn('⚠️ Sinal DOCUMENT_CREATED não encontrado no metadata');
        }

        // Resumo final
        console.log('\n═══════════════════════════════════════════');
        console.log('📋 RESUMO DO TESTE');
        console.log('═══════════════════════════════════════════');
        console.log(`✅ Comando NAVIGATE: ${navStatus.status.toUpperCase()}`);
        console.log(`✅ Comando INSERT_CONTENT: ${insertStatus.status.toUpperCase()}`);
        console.log(`${insertStatus.metadata?.document_url ? '✅' : '❌'} URL Capturada: ${insertStatus.metadata?.document_url ? 'SIM' : 'NÃO'}`);
        console.log(`${hasDocumentSignal ? '✅' : '❌'} Sinal DOM: ${hasDocumentSignal ? 'SIM' : 'NÃO'}`);
        console.log('═══════════════════════════════════════════\n');

    } catch (error) {
        console.error('❌ Erro durante teste:', error);
        process.exit(1);
    }
}

// Executar teste
testDocsCreationFlow()
    .then(() => {
        console.log('✅ Teste concluído\n');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Teste falhou:', error);
        process.exit(1);
    });
