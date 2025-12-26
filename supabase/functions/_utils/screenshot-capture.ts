/**
 * ═══════════════════════════════════════════════════════════
 * SCREENSHOT CAPTURE & STORAGE SYSTEM
 * ═══════════════════════════════════════════════════════════
 * 
 * Mandatory screenshot evidence for all visual actions.
 * 
 * FLOW:
 * 1. Before action → capture screenshot
 * 2. Execute action
 * 3. After action → capture screenshot
 * 4. Upload both to Supabase Storage
 * 5. Return URLs as evidence
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface ScreenshotResult {
    success: boolean;
    url?: string;
    base64?: string;
    timestamp: number;
    error?: string;
}

/**
 * Captura screenshot via Chrome Extension e salva no Supabase Storage
 * 
 * @param supabase - Cliente Supabase
 * @param userId - ID do usuário (para organizar arquivos)
 * @param label - Label para identificar (ex: "before", "after", "navigation_google")
 * @returns URLs do screenshot no storage
 */
export async function captureAndStoreScreenshot(
    supabase: any,
    userId: string,
    commandId: string,
    label: string = "screenshot"
): Promise<ScreenshotResult> {
    try {
        console.log(`📸 [SCREENSHOT] Capturing ${label} for command ${commandId}...`);

        // 1. Buscar device online do usuário
        const { data: device } = await supabase
            .from("extension_devices")
            .select("device_id")
            .eq("user_id", userId)
            .eq("status", "online")
            .order("last_seen", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (!device) {
            console.warn(`⚠️ [SCREENSHOT] No online device found for user ${userId}`);
            return {
                success: false,
                timestamp: Date.now(),
                error: "No online extension device found"
            };
        }

        // 2. Criar comando de screenshot
        const { data: screenshotCommand, error: insertError } = await supabase
            .from("extension_commands")
            .insert({
                device_id: device.device_id,
                user_id: userId,
                type: "SCREENSHOT",
                command_type: "SCREENSHOT",
                status: "pending",
                options: { label }
            })
            .select()
            .single();

        if (insertError) {
            console.error(`❌ [SCREENSHOT] Failed to create command:`, insertError);
            return {
                success: false,
                timestamp: Date.now(),
                error: insertError.message
            };
        }

        console.log(`⏳ [SCREENSHOT] Waiting for extension to capture...`);

        // 3. Aguardar captura (timeout 10s)
        const maxWait = 10000;
        const pollInterval = 500;
        const startTime = Date.now();

        while (Date.now() - startTime < maxWait) {
            const { data: cmd } = await supabase
                .from("extension_commands")
                .select("status, result")
                .eq("id", screenshotCommand.id)
                .single();

            if (cmd?.status === "completed" && cmd.result?.base64) {
                console.log(`✅ [SCREENSHOT] Captured successfully`);

                // 4. Upload para Supabase Storage
                const filename = `${userId}/${commandId}/${label}_${Date.now()}.png`;

                // Converter base64 para blob
                const base64Data = cmd.result.base64.replace(/^data:image\/\w+;base64,/, '');
                const blob = base64ToBlob(base64Data, 'image/png');

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('screenshots')
                    .upload(filename, blob, {
                        contentType: 'image/png',
                        upsert: false
                    });

                if (uploadError) {
                    console.error(`❌ [SCREENSHOT] Upload failed:`, uploadError);
                    // Fallback: retornar base64
                    return {
                        success: true,
                        base64: cmd.result.base64,
                        timestamp: Date.now()
                    };
                }

                // 5. Obter URL pública
                const { data: urlData } = supabase.storage
                    .from('screenshots')
                    .getPublicUrl(filename);

                console.log(`✅ [SCREENSHOT] Uploaded to storage: ${urlData.publicUrl}`);

                return {
                    success: true,
                    url: urlData.publicUrl,
                    base64: cmd.result.base64,
                    timestamp: Date.now()
                };
            }

            if (cmd?.status === "failed") {
                console.error(`❌ [SCREENSHOT] Extension failed to capture`);
                return {
                    success: false,
                    timestamp: Date.now(),
                    error: cmd.result?.error || "Screenshot capture failed"
                };
            }

            // Polling
            await new Promise(resolve => setTimeout(resolve, pollInterval));
        }

        // Timeout
        console.warn(`⏱️ [SCREENSHOT] Timeout after ${maxWait}ms`);
        return {
            success: false,
            timestamp: Date.now(),
            error: "Screenshot capture timeout"
        };

    } catch (error: any) {
        console.error(`❌ [SCREENSHOT] Unexpected error:`, error);
        return {
            success: false,
            timestamp: Date.now(),
            error: error.message
        };
    }
}

/**
 * Helper: Converte base64 para Blob
 */
function base64ToBlob(base64: string, contentType: string = ''): Blob {
    const byteCharacters = atob(base64);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);

        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: contentType });
}

/**
 * Cria evidência de screenshot no formato padronizado
 */
export function createScreenshotEvidence(
    screenshot: ScreenshotResult,
    stage: "before" | "after",
    action: string
) {
    return {
        type: "screenshot" as const,
        data: {
            screenshotUrl: screenshot.url,
            screenshotBase64: screenshot.base64,
            stage,
            action,
        },
        timestamp: screenshot.timestamp,
        verificationMethod: "visual_screenshot",
    };
}

console.log(`
╔═══════════════════════════════════════════════════════╗
║  📸 SCREENSHOT SYSTEM LOADED                          ║
║                                                        ║
║  Mandatory visual evidence for all actions.           ║
║  Screenshots stored in Supabase Storage.              ║
╚═══════════════════════════════════════════════════════╝
`);
