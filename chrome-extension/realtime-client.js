// ============================================
// REALTIME CLIENT (WebSockets)
// ============================================
// Integrates with background.js state and CONFIG

let realtimeClient = null;
let realtimeChannel = null;

async function initRealtimeConnection() {
    // Verificar se temos credenciais
    if (!state.accessToken || !state.deviceId) {
        console.log("⚠️ [REALTIME] Missing credentials. Waiting for auth...");
        return;
    }

    // Se já estiver conectado, desconectar para recriar (token refresh etc)
    if (realtimeClient) {
        console.log("♻️ [REALTIME] Reconnecting...");
        await cleanupRealtime();
    }

    try {
        console.log("🔌 [REALTIME] Initializing connection...");

        // Access supabase from global scope (imported via importScripts)
        const supabaseDef = self.supabase || window.supabase;

        if (!supabaseDef || !supabaseDef.createClient) {
            console.error("❌ [REALTIME] Supabase JS library not loaded!");
            return;
        }

        const { createClient } = supabaseDef;

        realtimeClient = createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false
            },
            realtime: {
                params: {
                    eventsPerSecond: 10
                }
            },
            global: {
                headers: {
                    Authorization: `Bearer ${state.accessToken}`
                }
            }
        });

        console.log("📡 [REALTIME] Subscribing to channel for device:", state.deviceId);

        realtimeChannel = realtimeClient
            .channel(`device_${state.deviceId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'extension_commands',
                    filter: `device_id=eq.${state.deviceId}`
                },
                async (payload) => {
                    console.log("⚡ [REALTIME] New command received!", payload.new.id);
                    console.log("📦 Payload:", payload.new);

                    // Verificar se é 'pending'
                    if (payload.new.status === 'pending') {
                        await processCommand(payload.new);
                    }
                }
            )
            .subscribe((status, err) => {
                console.log(`📶 [REALTIME] Status: ${status}`);
                if (status === 'SUBSCRIBED') {
                    console.log("✅ [REALTIME] Connected and listening!");
                    // Notificar que estamos realtime
                    sendMessageToSidePanel({ type: "REALTIME_STATUS", status: "connected" });
                }
                if (status === 'CHANNEL_ERROR') {
                    console.error("❌ [REALTIME] Channel Error:", err);
                    // Fallback para polling se der erro (já existe o polling de 5s)
                }
            });

    } catch (e) {
        console.error("❌ [REALTIME] Exception initializing:", e);
    }
}

async function cleanupRealtime() {
    if (realtimeChannel) {
        await realtimeClient.removeChannel(realtimeChannel);
        realtimeChannel = null;
    }
    realtimeClient = null;
}

// Hook into token refresh to reconnect realtime with new token
// This function should be called by background.js when token refreshes
async function restartRealtime() {
    await initRealtimeConnection();
}
