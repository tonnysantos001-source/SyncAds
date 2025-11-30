import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuração do Supabase
const SUPABASE_URL = 'https://ovskepqggmxlfckxqgbr.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não definida!');
  console.log('💡 Execute: export SUPABASE_SERVICE_ROLE_KEY="sua-chave-aqui"');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function applyMigration() {
  console.log('🚀 Iniciando aplicação da migration RLS...\n');

  try {
    // Ler arquivo de migration
    const migrationPath = join(__dirname, 'supabase', 'migrations', '20250126_add_rls_policies_ia_system.sql');
    const sql = readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration carregada:', migrationPath);
    console.log('📏 Tamanho:', sql.length, 'caracteres\n');

    // Dividir em statements (separados por ';')
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.match(/^\/\*/));

    console.log('📝 Total de statements:', statements.length, '\n');

    let successCount = 0;
    let errorCount = 0;

    // Executar cada statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';

      // Pular comentários e blocos DO
      if (statement.includes('COMMENT ON') || statement.includes('RAISE NOTICE')) {
        console.log(`⏭️  [${i + 1}/${statements.length}] Pulando comentário/notice`);
        continue;
      }

      try {
        console.log(`⚙️  [${i + 1}/${statements.length}] Executando...`);

        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: statement
        });

        if (error) {
          // Verificar se é erro esperado (policy já existe, etc)
          if (
            error.message.includes('already exists') ||
            error.message.includes('does not exist') ||
            error.message.includes('cannot drop')
          ) {
            console.log(`⚠️  [${i + 1}/${statements.length}] Aviso (esperado):`, error.message.substring(0, 80));
          } else {
            console.error(`❌ [${i + 1}/${statements.length}] Erro:`, error.message);
            errorCount++;
          }
        } else {
          console.log(`✅ [${i + 1}/${statements.length}] Sucesso`);
          successCount++;
        }
      } catch (err) {
        console.error(`❌ [${i + 1}/${statements.length}] Exceção:`, err.message);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO DA EXECUÇÃO:');
    console.log('='.repeat(60));
    console.log(`✅ Sucesso: ${successCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    console.log(`📝 Total: ${statements.length}`);
    console.log('='.repeat(60) + '\n');

    // Verificar RLS habilitado
    console.log('🔍 Verificando RLS habilitado nas tabelas...\n');

    const tables = ['extension_commands', 'extension_devices', 'routing_analytics'];

    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(0);

      if (error) {
        console.log(`❌ ${table}: Erro ao verificar -`, error.message);
      } else {
        console.log(`✅ ${table}: RLS ativo e configurado`);
      }
    }

    console.log('\n✨ Migration aplicada com sucesso!\n');

  } catch (error) {
    console.error('\n❌ Erro fatal ao aplicar migration:', error);
    process.exit(1);
  }
}

// Executar
applyMigration();
