import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = {};
readFileSync('.env', 'utf8').split('\n').forEach(line => {
  const [key, ...v] = line.split('=');
  if (key && v.length) env[key.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

console.log('🔗 Conectando ao Supabase...\n');

// Dados do gateway
const data = {
  name: 'Pague-X',
  slug: 'paguex',
  description: 'Gateway Pague-X (inpagamentos.com) - PIX, Cartão, Boleto',
  type: 'PAYMENT_PROCESSOR',
  supportsPix: true,
  supportsCreditCard: true,
  supportsBoleto: true,
  supportsDebit: true,
  requiredFields: { publicKey: 'Chave Pública', secretKey: 'Chave Secreta' },
  documentation: 'https://app.inpagamentos.com/docs',
  isActive: true
};

// Deletar fusionpay se existir
await supabase.from('Gateway').delete().eq('slug', 'fusionpay');
console.log('✅ Limpeza feita');

// Deletar paguex antigo se existir
await supabase.from('Gateway').delete().eq('slug', 'paguex');
console.log('✅ Removido antigo');

// Criar novo
const { data: created, error } = await supabase.from('Gateway').insert(data).select().single();

if (error) {
  console.error('❌', error.message);
  process.exit(1);
}

console.log('\n══════════════════════════════════════════════');
console.log('✅ PAGUE-X CRIADO COM SUCESSO!');
console.log('══════════════════════════════════════════════');
console.log('ID:', created.id);
console.log('Nome:', created.name);
console.log('Slug:', created.slug);
console.log('Suporte: PIX ✅ | Cartão ✅ | Boleto ✅');
console.log('══════════════════════════════════════════════\n');
console.log('🎉 Configure no dashboard agora!');
