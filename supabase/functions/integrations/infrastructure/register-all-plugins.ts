import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { join } from "https://deno.land/std@0.168.0/path/mod.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY") || "";

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured in env");
  Deno.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const providersDir = "./supabase/functions/integrations/domain/payment/providers";

async function main() {
  console.log("🚀 Starting registration of all payment providers from plugin.json files...");

  let registeredCount = 0;
  
  for await (const entry of Deno.readDir(providersDir)) {
    if (!entry.isDir) continue;

    const pluginJsonPath = join(providersDir, entry.name, "v1", "plugin.json");
    try {
      const content = await Deno.readTextFile(pluginJsonPath);
      const metadata = JSON.parse(content);

      // Create capabilities based on metadata fields
      const capabilities = {
        supportsPix: metadata.paymentMethods?.includes("pix") ?? false,
        supportsCreditCard: metadata.paymentMethods?.includes("credit_card") ?? false,
        supportsBoleto: metadata.paymentMethods?.includes("boleto") ?? false,
        supportsDebit: metadata.paymentMethods?.includes("debit_card") ?? false,
        supportsSubscription: metadata.paymentMethods?.includes("subscription") ?? false,
        supportsRefund: true,
        supportsWebhook: metadata.webhookSupport ?? false,
      };

      console.log(`Processing: ${metadata.name} (${metadata.slug})`);

      // 1. Upsert into IntegrationPlugin
      const { data: pluginRecord, error: pluginErr } = await supabase
        .from("IntegrationPlugin")
        .upsert(
          {
            name: metadata.name,
            slug: metadata.slug,
            version: metadata.version || "v1",
            category: metadata.category || "payment",
            logo_url: metadata.logoUrl || null,
            description: metadata.description || null,
            status: "active", // Force active so it appears in the dashboard
            config_fields: metadata.configFields || [],
            updated_at: new Date().toISOString(),
          },
          { onConflict: "slug,version" }
        )
        .select("id")
        .single();

      if (pluginErr) {
        console.error(`❌ Failed to upsert IntegrationPlugin for ${metadata.slug}: ${pluginErr.message}`);
        continue;
      }

      // 2. Upsert into IntegrationCapability
      const { error: capErr } = await supabase
        .from("IntegrationCapability")
        .upsert(
          {
            integration_plugin_id: pluginRecord.id,
            capabilities,
          },
          { onConflict: "integration_plugin_id" }
        );

      if (capErr) {
        console.error(`❌ Failed to upsert IntegrationCapability for ${metadata.slug}: ${capErr.message}`);
        continue;
      }

      registeredCount++;
      console.log(`✅ Successfully registered/updated: ${metadata.name}`);
    } catch (err) {
      // Skip if plugin.json doesn't exist or is invalid
      // console.warn(`⚠️ Skipped ${entry.name}: ${err.message}`);
    }
  }

  console.log(`\n✨ Finished! Successfully registered ${registeredCount} providers in the database.`);
}

if (import.meta.main) {
  await main();
}
