// =========================================================================
// MÓDULO DE INTEGRAÇÕES GLOBAL - AGENDADOR DE VERIFICAÇÃO DE SAÚDE (Deno)
// =========================================================================

import { PluginManager } from "./PluginManager.ts";

export class Scheduler {
  /**
   * Executa a validação de saúde para todas as configurações de integrações ativas
   */
  async runAllHealthChecks(
    pluginManager: PluginManager,
    supabaseClient: any
  ): Promise<Record<string, any>> {
    console.log("[SCHEDULER] Starting active integrations health checks...");
    const startTime = Date.now();
    const results: Record<string, any> = {};

    try {
      // 1. Obter todas as configurações ativas com seus respectivos metadados de plugins
      const { data: configs, error: configErr } = await supabaseClient
        .from("IntegrationConfig")
        .select(`
          id,
          user_id,
          credentials,
          is_test_mode,
          IntegrationPlugin (
            id,
            slug,
            version
          )
        `)
        .eq("is_active", true);

      if (configErr) {
        throw new Error(`Failed to load active configs: ${configErr.message}`);
      }

      if (!configs || configs.length === 0) {
        console.log("[SCHEDULER] No active integrations config found.");
        return { message: "No active config to test", durationMs: Date.now() - startTime };
      }

      console.log(`[SCHEDULER] Testing health of ${configs.length} active integrations...`);

      // 2. Iterar e rodar testes de conexão em paralelo
      const promises = configs.map(async (config: any) => {
        const pluginMeta = config.IntegrationPlugin;
        if (!pluginMeta) return;

        const slug = pluginMeta.slug;
        const version = pluginMeta.version;
        const plugin = pluginManager.load(slug, version);

        if (!plugin || !plugin.provider) {
          console.warn(`[SCHEDULER] Provider not loaded for plugin: ${slug}@${version}`);
          return;
        }

        const runStart = Date.now();
        try {
          // Injetar credenciais e testar
          const providerInstance = plugin.provider;
          const configObject = {
            id: config.id,
            userId: config.user_id,
            integrationPluginId: pluginMeta.id,
            credentials: config.credentials,
            isActive: true,
            isTestMode: config.is_test_mode,
            settings: {},
          };

          const testResult = await providerInstance.connect(configObject);
          const duration = Date.now() - runStart;

          // Atualizar o banco de dados de saúde
          await supabaseClient
            .from("IntegrationHealth")
            .upsert(
              {
                integration_plugin_id: pluginMeta.id,
                status: testResult.isValid ? "online" : "degraded",
                latency_avg: duration,
                last_success_at: testResult.isValid ? new Date().toISOString() : undefined,
                last_failure_at: !testResult.isValid ? new Date().toISOString() : undefined,
                last_error_message: testResult.isValid ? null : testResult.message,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "integration_plugin_id" }
            );

          results[config.id] = {
            slug,
            version,
            success: testResult.isValid,
            latencyMs: duration,
            message: testResult.message,
          };
        } catch (err: any) {
          const duration = Date.now() - runStart;
          await supabaseClient
            .from("IntegrationHealth")
            .upsert(
              {
                integration_plugin_id: pluginMeta.id,
                status: "offline",
                latency_avg: duration,
                last_failure_at: new Date().toISOString(),
                last_error_message: err.message || "Unknown execution exception",
                updated_at: new Date().toISOString(),
              },
              { onConflict: "integration_plugin_id" }
            );

          results[config.id] = {
            slug,
            version,
            success: false,
            latencyMs: duration,
            error: err.message,
          };
        }
      });

      await Promise.all(promises);
      console.log(`[SCHEDULER] Completed health checks in ${Date.now() - startTime}ms`);
    } catch (error: any) {
      console.error("[SCHEDULER] Health checking sequence failed critical:", error.message);
      return { error: error.message, durationMs: Date.now() - startTime };
    }

    return {
      results,
      durationMs: Date.now() - startTime,
    };
  }
}
