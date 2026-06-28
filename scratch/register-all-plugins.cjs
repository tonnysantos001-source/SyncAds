const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load .env
const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && values.length) {
    env[key.trim()] = values.join('=').trim().replace(/^["']|["']$/g, '');
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const providersDir = './supabase/functions/integrations/domain/payment/providers';

async function main() {
  console.log('🚀 Starting registration of all payment providers from plugin.json files...');

  let registeredCount = 0;
  
  const entries = fs.readdirSync(providersDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const pluginJsonPath = path.join(providersDir, entry.name, 'v1', 'plugin.json');
    if (!fs.existsSync(pluginJsonPath)) continue;

    try {
      const content = fs.readFileSync(pluginJsonPath, 'utf8');
      const metadata = JSON.parse(content);

      // Create capabilities based on metadata fields
      const capabilities = {
        supportsPix: metadata.paymentMethods?.includes('pix') ?? false,
        supportsCreditCard: metadata.paymentMethods?.includes('credit_card') ?? false,
        supportsBoleto: metadata.paymentMethods?.includes('boleto') ?? false,
        supportsDebit: metadata.paymentMethods?.includes('debit_card') ?? false,
        supportsSubscription: metadata.paymentMethods?.includes('subscription') ?? false,
        supportsRefund: true,
        supportsWebhook: metadata.webhookSupport ?? false,
      };

      console.log(`Processing: ${metadata.name} (${metadata.slug})`);

      // 1. Upsert into IntegrationPlugin
      const { data: pluginRecord, error: pluginErr } = await supabase
        .from('IntegrationPlugin')
        .upsert(
          {
            name: metadata.name,
            slug: metadata.slug,
            version: metadata.version || 'v1',
            category: metadata.category || 'payment',
            logo_url: metadata.logoUrl || null,
            description: metadata.description || null,
            status: 'active', // Force active
            config_fields: metadata.configFields || [],
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'slug,version' }
        )
        .select('id')
        .single();

      if (pluginErr) {
        console.error(`❌ Failed to upsert IntegrationPlugin for ${metadata.slug}: ${pluginErr.message}`);
        continue;
      }

      // 2. Upsert into IntegrationCapability
      const { error: capErr } = await supabase
        .from('IntegrationCapability')
        .upsert(
          {
            integration_plugin_id: pluginRecord.id,
            capabilities,
          },
          { onConflict: 'integration_plugin_id' }
        );

      if (capErr) {
        console.error(`❌ Failed to upsert IntegrationCapability for ${metadata.slug}: ${capErr.message}`);
        continue;
      }

      registeredCount++;
      console.log(`✅ Successfully registered/updated: ${metadata.name}`);
    } catch (err) {
      console.warn(`⚠️ Skipped ${entry.name}: ${err.message}`);
    }
  }

  console.log(`\n✨ Finished! Successfully registered ${registeredCount} providers in the database.`);
}

main().catch(err => console.error(err));
