import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ovskepqggmxlfckxqgbr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92c2tlcHFnZ214bGZja3hxZ2JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDgyNDg1NSwiZXhwIjoyMDc2NDAwODU1fQ.eZHK4OlfKTChZ9BqocoJ1NS6UsPqaFfHE6_1e73ROok'

const supabase = createClient(supabaseUrl, supabaseKey)

const sql = `
-- Verificar se tabelas existem
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('extension_devices', 'extension_commands', 'extension_logs');
`

const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })

if (error) {
  console.error('❌ Erro:', error)
} else {
  console.log('✅ Resultado:', data)
}
