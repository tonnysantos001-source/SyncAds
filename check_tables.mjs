import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://ovskepqggmxlfckxqgbr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92c2tlcHFnZ214bGZja3hxZ2JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDgyNDg1NSwiZXhwIjoyMDc2NDAwODU1fQ.eZHK4OlfKTChZ9BqocoJ1NS6UsPqaFfHE6_1e73ROok'
)

// Verificar tabelas
const { data: devices, error: e1 } = await supabase.from('extension_devices').select('count')
const { data: commands, error: e2 } = await supabase.from('extension_commands').select('count')
const { data: logs, error: e3 } = await supabase.from('extension_logs').select('count')

console.log('📊 Status das Tabelas da Extensão:')
console.log('extension_devices:', e1 ? '❌ NÃO EXISTE' : '✅ EXISTE')
console.log('extension_commands:', e2 ? '❌ NÃO EXISTE' : '✅ EXISTE')
console.log('extension_logs:', e3 ? '❌ NÃO EXISTE' : '✅ EXISTE')
