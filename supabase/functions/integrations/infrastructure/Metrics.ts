// =========================================================================
// MÓDULO DE INTEGRAÇÕES GLOBAL - AGREGADOR DE MÉTRICAS E SAÚDE (Deno)
// =========================================================================

import { MetricsInterface } from "../types.ts";

export class Metrics implements MetricsInterface {
  private timings: Map<string, number[]>;

  constructor() {
    this.timings = new Map<string, number[]>();
  }

  /**
   * Incrementa contadores de eventos (uso genérico)
   */
  increment(metricName: string, count: number = 1, tags?: Record<string, string>): void {
    console.log(
      `[METRICS] Increment: ${metricName} count=${count} tags=${JSON.stringify(tags || {})}`
    );
  }

  /**
   * Registra latência de operações individuais (uso genérico)
   */
  timing(metricName: string, durationMs: number, tags?: Record<string, string>): void {
    console.log(
      `[METRICS] Timing: ${metricName} duration=${durationMs}ms tags=${JSON.stringify(tags || {})}`
    );

    const key = metricName;
    const history = this.timings.get(key) ?? [];
    history.push(durationMs);
    
    // Manter apenas as últimas 1000 amostras para evitar vazamento de memória
    if (history.length > 1000) {
      history.shift();
    }
    this.timings.set(key, history);
  }

  /**
   * Grava sucesso de transação de integração no banco
   */
  async recordSuccess(pluginSlug: string, operation: string, durationMs: number): Promise<void> {
    this.timing(`${pluginSlug}.${operation}`, durationMs, { status: "success" });
    await this.updateDbHealth(pluginSlug, "online", durationMs, null);
  }

  /**
   * Grava falha de transação de integração no banco
   */
  async recordFailure(pluginSlug: string, operation: string, durationMs: number, error: string): Promise<void> {
    this.timing(`${pluginSlug}.${operation}`, durationMs, { status: "failure", error });
    await this.updateDbHealth(pluginSlug, "degraded", durationMs, error);
  }

  /**
   * Atualiza a tabela IntegrationHealth no Supabase de forma assíncrona
   */
  private async updateDbHealth(
    pluginSlug: string,
    status: "online" | "offline" | "degraded",
    latencyMs: number,
    errorMessage: string | null
  ): Promise<void> {
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
      const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
      
      if (!supabaseUrl || !supabaseServiceRole) return;

      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
      const client = createClient(supabaseUrl, supabaseServiceRole);

      // 1. Encontrar o plugin correspondente
      const { data: plugin, error: findErr } = await client
        .from("IntegrationPlugin")
        .select("id")
        .eq("slug", pluginSlug)
        .limit(1)
        .maybeSingle();

      if (findErr || !plugin) {
        console.warn(`[METRICS] Plugin metadata not found in DB for: ${pluginSlug}`);
        return;
      }

      // Calcular P95 e P99
      const historyKey = `${pluginSlug}.createPayment`; // operação principal como referência
      const times = this.timings.get(historyKey) ?? [latencyMs];
      const sorted = [...times].sort((a, b) => a - b);
      const avg = Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length);
      const p95 = sorted[Math.floor(sorted.length * 0.95)] || latencyMs;
      const p99 = sorted[Math.floor(sorted.length * 0.99)] || latencyMs;

      // 2. Gravar na tabela IntegrationHealth
      const { error: upsertErr } = await client
        .from("IntegrationHealth")
        .upsert(
          {
            integration_plugin_id: plugin.id,
            status,
            latency_avg: avg,
            latency_p95: p95,
            latency_p99: p99,
            uptime_pct: status === "online" ? 100.0 : 90.0, // estimativa inicial simplificada
            last_success_at: status === "online" ? new Date().toISOString() : undefined,
            last_failure_at: status !== "online" ? new Date().toISOString() : undefined,
            last_error_message: errorMessage,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "integration_plugin_id" }
        );

      if (upsertErr) {
        console.error(`[METRICS] Failed to save IntegrationHealth: ${upsertErr.message}`);
      }
    } catch (err: any) {
      console.error("[METRICS] Error updating health metric in database:", err.message);
    }
  }
}
