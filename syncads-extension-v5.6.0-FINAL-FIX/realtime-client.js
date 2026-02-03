import { createClient } from './supabase.js';

// Module-level variables to hold references
let state = null;
let processCommand = null;
let realtimeClient = null;
let realtimeChannel = null;

export async function initRealtimeConnection(appState, commandProcessor) {
    // Update references if provided
    if (appState) state = appState;
    if (commandProcessor) processCommand = commandProcessor;

    // Verificar se temos credenciais
    if (!state || !state.accessToken || !state.deviceId) {
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

        // Use imported createClient directly
        if (!createClient) {
            console.error("❌ [REALTIME] Supabase JS library not loaded!");
            return;
        }

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
                    // Notificar que estamos realtime (usando runtime.sendMessage seguro)
                    try {
                        chrome.runtime.sendMessage({ type: "REALTIME_STATUS", status: "connected" }).catch(() => { });
                    } catch (e) { /* ignore */ }
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

export async function cleanupRealtime() {
    if (realtimeChannel) {
        await realtimeClient.removeChannel(realtimeChannel);
        realtimeChannel = null;
    }
    realtimeClient = null;
}

// Hook into token refresh to reconnect realtime with new token
// This function should be called by background.js when token refreshes
export async function restartRealtime() {
    await initRealtimeConnection();
}
