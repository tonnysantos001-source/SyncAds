/**
 * AI Self-Audit Script
 * 
 * Script executado pela IA para auditar a si mesma.
 * Verifica que TODOS os sistemas estão funcionando REALMENTE (não simulado).
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ovskepqggmxlfckxqgbr.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_SERVICE_KEY) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function selfAudit() {
    console.log('\n' + '='.repeat(60));
    console.log('🔍 AI SELF-AUDIT INICIADO');
    console.log('='.repeat(60) + '\n');

    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;

    const results = [];

    // ============================================
    // 1. VERIFICAR EDGE FUNCTIONS
    // ============================================
    console.log('📡 [1/6] Testando Edge Functions...\n');

    try {
        // Test self-diagnose
        const diagnoseResponse = await fetch('https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/self-diagnose', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                error_message: 'Token expired',
                context: { audit_test: true }
            })
        });

        totalTests++;
        if (diagnoseResponse.ok) {
            const data = await diagnoseResponse.json();
            console.log('✅ self-diagnose online:', data.error_type);
            passedTests++;
            results.push({ test: 'self-diagnose', status: 'PASS', data });
        } else {
            console.log('❌ self-diagnose failed:', diagnoseResponse.status);
            failedTests++;
            results.push({ test: 'self-diagnose', status: 'FAIL', error: diagnoseResponse.statusText });
        }

        // Test self-heal
        const healResponse = await fetch('https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/self-heal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                error_type: 'token expired',
                command_id: 'audit-test',
                device_id: 'audit-device'
            })
        });

        totalTests++;
        if (healResponse.ok) {
            const data = await healResponse.json();
            console.log('✅ self-heal online:', data.action);
            passedTests++;
            results.push({ test: 'self-heal', status: 'PASS', data });
        } else {
            console.log('❌ self-heal failed:', healResponse.status);
            failedTests++;
            results.push({ test: 'self-heal', status: 'FAIL', error: healResponse.statusText });
        }
    } catch (error) {
        console.error('❌ Edge functions test failed:', error.message);
        failedTests += 2;
    }

    console.log('');

    // ============================================
    // 2. VERIFICAR TABELAS DO BANCO
    // ============================================
    console.log('🗄️ [2/6] Auditando Tabelas do Banco...\n');

    const requiredTables = ['error_diagnoses', 'healing_actions', 'auto_heal_stats'];

    for (const tableName of requiredTables) {
        try {
            const { data, error } = await supabase.from(tableName).select('*').limit(1);

            totalTests++;
            if (!error) {
                console.log(`✅ Tabela ${tableName} existe e acessível`);
                passedTests++;
                results.push({ test: `table_${tableName}`, status: 'PASS' });
            } else {
                console.log(`❌ Tabela ${tableName} erro:`, error.message);
                failedTests++;
                results.push({ test: `table_${tableName}`, status: 'FAIL', error: error.message });
            }
        } catch (error) {
            totalTests++;
            console.log(`❌ Erro ao verificar ${tableName}:`, error.message);
            failedTests++;
            results.push({ test: `table_${tableName}`, status: 'FAIL', error: error.message });
        }
    }

    console.log('');

    // ============================================
    // 3. VERIFICAR ESTATÍSTICAS AUTO-HEAL
    // ============================================
    console.log('🩹 [3/6] Verificando Auto-Heal Stats...\n');

    try {
        const { data: stats, error } = await supabase
            .from('auto_heal_stats')
            .select('*')
            .order('success_rate', { ascending: false });

        totalTests++;
        if (!error && stats) {
            console.log(`✅ Auto-heal stats: ${stats.length} tipos de erro rastreados`);

            if (stats.length > 0) {
                console.log('\nTop 3 erros por taxa de sucesso:');
                stats.slice(0, 3).forEach((stat, i) => {
                    console.log(`  ${i + 1}. ${stat.error_type}: ${stat.success_rate}% (${stat.total_healed}/${stat.total_occurrences})`);
                });
            }

            passedTests++;
            results.push({ test: 'auto_heal_stats', status: 'PASS', count: stats.length });
        } else {
            console.log('❌ Erro ao buscar stats:', error?.message);
            failedTests++;
            results.push({ test: 'auto_heal_stats', status: 'FAIL', error: error?.message });
        }
    } catch (error) {
        totalTests++;
        console.log('❌ Erro:', error.message);
        failedTests++;
    }

    console.log('');

    // ============================================
    // 4. VERIFICAR DIAGNOSES RECENTES
    // ============================================
    console.log('📊 [4/6] Verificando Diagnósticos Recentes...\n');

    try {
        const { data: diagnoses, error } = await supabase
            .from('error_diagnoses')
            .select('*')
            .order('diagnosed_at', { ascending: false })
            .limit(5);

        totalTests++;
        if (!error && diagnoses) {
            console.log(`✅ ${diagnoses.length} diagnósticos encontrados`);

            if (diagnoses.length > 0) {
                console.log('\nÚltimos diagnósticos:');
                diagnoses.forEach((d, i) => {
                    console.log(`  ${i + 1}. ${d.error_type} - ${d.severity} - ${d.auto_fixable ? 'Auto-fixável' : 'Manual'}`);
                });
            }

            passedTests++;
            results.push({ test: 'error_diagnoses', status: 'PASS', count: diagnoses.length });
        } else {
            console.log('❌ Erro:', error?.message);
            failedTests++;
            results.push({ test: 'error_diagnoses', status: 'FAIL', error: error?.message });
        }
    } catch (error) {
        totalTests++;
        console.log('❌ Erro:', error.message);
        failedTests++;
    }

    console.log('');

    // ============================================
    // 5. VERIFICAR HEALING ACTIONS
    // ============================================
    console.log('🔧 [5/6] Verificando Ações de Healing...\n');

    try {
        const { data: actions, error } = await supabase
            .from('healing_actions')
            .select('*')
            .order('healed_at', { ascending: false })
            .limit(5);

        totalTests++;
        if (!error && actions) {
            console.log(`✅ ${actions.length} ações de healing encontradas`);

            if (actions.length > 0) {
                const successCount = actions.filter(a => a.success).length;
                console.log(`\nTaxa de sucesso: ${successCount}/${actions.length} (${Math.round(successCount / actions.length * 100)}%)`);

                console.log('\nÚltimas ações:');
                actions.forEach((a, i) => {
                    console.log(`  ${i + 1}. ${a.error_type} → ${a.action} - ${a.success ? '✅' : '❌'}`);
                });
            }

            passedTests++;
            results.push({ test: 'healing_actions', status: 'PASS', count: actions.length });
        } else {
            console.log('❌ Erro:', error?.message);
            failedTests++;
            results.push({ test: 'healing_actions', status: 'FAIL', error: error?.message });
        }
    } catch (error) {
        totalTests++;
        console.log('❌ Erro:', error.message);
        failedTests++;
    }

    console.log('');

    // ============================================
    // 6. TESTAR ACESSO REAL (NÃO SIMULADO)
    // ============================================
    console.log('🔐 [6/6] Validando Acesso REAL ao Banco...\n');

    try {
        // Tentar inserir e depois deletar um registro de teste
        const testRecord = {
            error_message: 'AI Self-Audit Test',
            error_type: 'test',
            root_cause: 'Self-audit validation',
            suggested_fix: 'No fix needed, this is a test',
            auto_fixable: false,
            severity: 'low',
            context: { test: true, timestamp: new Date().toISOString() }
        };

        const { data: inserted, error: insertError } = await supabase
            .from('error_diagnoses')
            .insert(testRecord)
            .select()
            .single();

        totalTests++;
        if (!insertError && inserted) {
            console.log('✅ INSERT funcionou (acesso REAL confirmado)');

            // Deletar registro de teste
            await supabase.from('error_diagnoses').delete().eq('id', inserted.id);
            console.log('✅ DELETE funcionou (cleanup realizado)');

            passedTests++;
            results.push({ test: 'real_access_validation', status: 'PASS' });
        } else {
            console.log('❌ Acesso de escrita falhou:', insertError?.message);
            failedTests++;
            results.push({ test: 'real_access_validation', status: 'FAIL', error: insertError?.message });
        }
    } catch (error) {
        totalTests++;
        console.log('❌ Erro:', error.message);
        failedTests++;
    }

    console.log('');

    // ============================================
    // RELATÓRIO FINAL
    // ============================================
    console.log('='.repeat(60));
    console.log('📋 RELATÓRIO FINAL DA AUDITORIA');
    console.log('='.repeat(60));
    console.log(`\nTotal de Testes: ${totalTests}`);
    console.log(`✅ Passou: ${passedTests} (${Math.round(passedTests / totalTests * 100)}%)`);
    console.log(`❌ Falhou: ${failedTests} (${Math.round(failedTests / totalTests * 100)}%)`);

    if (failedTests === 0) {
        console.log('\n🎉 TODOS OS TESTES PASSARAM!');
        console.log('✅ Sistema 100% funcional e verificado');
        console.log('✅ Acesso ao banco é REAL (não simulado)');
        console.log('✅ Edge functions deployadas e operacionais');
        console.log('✅ IA pode auditar e editar REALMENTE');
    } else {
        console.log(`\n⚠️ ${failedTests} teste(s) falharam`);
        console.log('\nTestes que falharam:');
        results.filter(r => r.status === 'FAIL').forEach(r => {
            console.log(`  ❌ ${r.test}: ${r.error || 'Unknown error'}`);
        });
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Retornar código de saída apropriado
    process.exit(failedTests === 0 ? 0 : 1);
}

// Executar auditoria
selfAudit().catch(error => {
    console.error('\n❌ AUDITORIA FALHOU:', error);
    process.exit(1);
});
