// =========================================================================
// MÓDULO DE INTEGRAÇÕES GLOBAL - GERENCIADOR DE IDEMPOTÊNCIA (Deno)
// =========================================================================

export interface IdempotencyResult {
  isDuplicate: boolean;
  status: "processing" | "completed" | "failed";
  responsePayload?: any;
}

export class Idempotency {
  constructor(private supabaseClient: any) {}

  /**
   * Tenta iniciar um bloco de execução idempotente
   */
  async start(
    userId: string,
    key: string,
    requestPayload: any
  ): Promise<IdempotencyResult> {
    const requestHash = await this.hashPayload(requestPayload);

    try {
      // 1. Tentar inserir um novo registro na tabela
      const { data: newRecord, error: insertError } = await this.supabaseClient
        .from("IntegrationIdempotency")
        .insert({
          key,
          user_id: userId,
          request_hash: requestHash,
          status: "processing",
        })
        .select()
        .maybeSingle();

      if (!insertError && newRecord) {
        return { isDuplicate: false, status: "processing" };
      }

      // 2. Se falhar por chave duplicada, buscar o registro existente
      const { data: existingRecord, error: fetchError } = await this.supabaseClient
        .from("IntegrationIdempotency")
        .select("*")
        .eq("user_id", userId)
        .eq("key", key)
        .single();

      if (fetchError || !existingRecord) {
        throw new Error(
          `Idempotency lock error: ${insertError?.message || fetchError?.message}`
        );
      }

      // 3. Avaliar status da transação em andamento
      if (existingRecord.status === "processing") {
        return { isDuplicate: true, status: "processing" };
      }

      if (existingRecord.status === "completed") {
        return {
          isDuplicate: true,
          status: "completed",
          responsePayload: existingRecord.response_payload,
        };
      }

      // Se falhou anteriormente, permitimos tentar novamente. Reseta status para 'processing'.
      if (existingRecord.status === "failed") {
        const { error: resetErr } = await this.supabaseClient
          .from("IntegrationIdempotency")
          .update({
            status: "processing",
            request_hash: requestHash,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingRecord.id);

        if (resetErr) {
          throw new Error(`Failed to reset failed idempotency key: ${resetErr.message}`);
        }

        return { isDuplicate: false, status: "processing" };
      }

      return { isDuplicate: true, status: "failed" };
    } catch (err: any) {
      console.error("[IDEMPOTENCY] Start execution failed:", err.message);
      throw err;
    }
  }

  /**
   * Finaliza a execução idempotente salvando a resposta de sucesso
   */
  async complete(userId: string, key: string, responsePayload: any): Promise<void> {
    const { error } = await this.supabaseClient
      .from("IntegrationIdempotency")
      .update({
        status: "completed",
        response_payload: responsePayload,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("key", key);

    if (error) {
      console.error(`[IDEMPOTENCY] Failed to complete key ${key}:`, error.message);
      throw error;
    }
  }

  /**
   * Marca a execução como falha para permitir novas retentativas
   */
  async fail(userId: string, key: string): Promise<void> {
    const { error } = await this.supabaseClient
      .from("IntegrationIdempotency")
      .update({
        status: "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("key", key);

    if (error) {
      console.error(`[IDEMPOTENCY] Failed to mark failed key ${key}:`, error.message);
      throw error;
    }
  }

  private async hashPayload(payload: any): Promise<string> {
    if (!payload) return "";
    const str = typeof payload === "string" ? payload : JSON.stringify(payload);
    const data = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
}
