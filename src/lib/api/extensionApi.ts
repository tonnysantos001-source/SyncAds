import { supabase } from "../supabase";

export interface BrowserTab {
    id: number;
    title: string;
    url: string;
    active: boolean;
    windowId: number;
    favIconUrl?: string;
}

export interface ExtensionCommand {
    id?: string;
    device_id: string;
    command: string;
    params?: any;
    status: "pending" | "processing" | "completed" | "failed";
    result?: any;
    error?: string;
    created_at?: string;
    updated_at?: string;
}

/**
 * Obtém lista de abas abertas via extensão
 */
export async function getOpenTabs(userId: string): Promise<BrowserTab[]> {
    try {
        // 1. Verificar se há extensão conectada
        const { data: devices } = await supabase
            .from("extension_devices")
            .select("device_id")
            .eq("user_id", userId)
            .eq("status", "online")
            .limit(1)
            .maybeSingle();

        if (!devices) {
            throw new Error("Nenhuma extensão conectada");
        }

        // 2. Criar comando LIST_TABS
        const commandId = crypto.randomUUID();
        const { error: cmdError } = await supabase
            .from("extension_commands")
            .insert({
                id: commandId,
                device_id: devices.device_id,
                command: "LIST_TABS",
                params: {},
                status: "pending",
                created_at: new Date().toISOString(),
            });

        if (cmdError) throw cmdError;

        // 3. Aguardar resultado (polling por 10 segundos)
        const maxAttempts = 20; // 20 x 500ms = 10s
        for (let i = 0; i < maxAttempts; i++) {
            const { data: cmd } = await supabase
                .from("extension_commands")
                .select("*")
                .eq("id", commandId)
                .single();

            if (cmd?.status === "completed" && cmd.result) {
                return cmd.result.tabs || [];
            }

            if (cmd?.status === "failed") {
                throw new Error(cmd.error || "Comando falhou");
            }

            // Aguardar 500ms antes de próxima tentativa
            await new Promise((resolve) => setTimeout(resolve, 500));
        }

        throw new Error("Timeout ao aguardar resposta da extensão");
    } catch (error) {
        console.error("Erro ao obter abas:", error);
        throw error;
    }
}

/**
 * Envia comando genérico para extensão
 */
export async function sendExtensionCommand(
    userId: string,
    command: string,
    params: any = {}
): Promise<any> {
    try {
        // 1. Verificar extensão conectada
        const { data: devices } = await supabase
            .from("extension_devices")
            .select("device_id")
            .eq("user_id", userId)
            .eq("status", "online")
            .limit(1)
            .maybeSingle();

        if (!devices) {
            throw new Error("Extensão não conectada");
        }

        // 2. Criar comando
        const commandId = crypto.randomUUID();
        const { error: cmdError } = await supabase
            .from("extension_commands")
            .insert({
                id: commandId,
                device_id: devices.device_id,
                command,
                params,
                status: "pending",
                created_at: new Date().toISOString(),
            });

        if (cmdError) throw cmdError;

        // 3. Aguardar resultado
        const maxAttempts = 30; // 30 x 500ms = 15s
        for (let i = 0; i < maxAttempts; i++) {
            const { data: cmd } = await supabase
                .from("extension_commands")
                .select("*")
                .eq("id", commandId)
                .single();

            if (cmd?.status === "completed") {
                return cmd.result;
            }

            if (cmd?.status === "failed") {
                throw new Error(cmd.error || "Comando falhou");
            }

            await new Promise((resolve) => setTimeout(resolve, 500));
        }

        throw new Error("Timeout ao aguardar resposta");
    } catch (error) {
        console.error("Erro ao enviar comando:", error);
        throw error;
    }
}
