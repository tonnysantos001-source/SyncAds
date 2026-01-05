import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Self-Heal Edge Function
 * 
 * Aplica correções automáticas para erros conhecidos.
 * Registra correções aplicadas para aprendizado contínuo.
 */

interface HealResult {
    healed: boolean;
    action: string;
    success: boolean;
    message: string;
    retry_recommended?: boolean;
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
        });
    }

    try {
        const { error_type, command_id, device_id, context } = await req.json();

        console.log(`🩹 [HEAL] Attempting to heal error: ${error_type}`);

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Healing actions for known error types
        const healingActions: Record<string, () => Promise<HealResult>> = {
            'could not establish connection': async () => {
                // Trigger content script re-injection by updating command metadata
                if (command_id) {
                    await supabase
                        .from('extension_commands')
                        .update({
                            metadata: {
                                auto_heal_action: 'reinject_content_script',
                                auto_heal_at: new Date().toISOString()
                            }
                        })
                        .eq('id', command_id);
                }

                return {
                    healed: true,
                    action: 'reinject_content_script',
                    success: true,
                    message: 'Content script re-injection requested. Retry command.',
                    retry_recommended: true
                };
            },

            'receiving end does not exist': async () => {
                return {
                    healed: true,
                    action: 'reinject_content_script',
                    success: true,
                    message: 'Content script will be re-injected on retry',
                    retry_recommended: true
                };
            },

            'token expired': async () => {
                // Update device to trigger token refresh
                if (device_id) {
                    await supabase
                        .from('extension_devices')
                        .update({
                            last_ping: new Date().toISOString(),
                            metadata: {
                                token_refresh_requested: true,
                                token_refresh_requested_at: new Date().toISOString()
                            }
                        })
                        .eq('id', device_id);
                }

                return {
                    healed: true,
                    action: 'refresh_token',
                    success: true,
                    message: 'Token refresh triggered. Command will retry after refresh.',
                    retry_recommended: true
                };
            },

            'missing document_created signal': async () => {
                // Switch to URL verification fallback
                if (command_id) {
                    await supabase
                        .from('extension_commands')
                        .update({
                            metadata: {
                                auto_heal_action: 'use_url_verification_fallback',
                                auto_heal_at: new Date().toISOString()
                            }
                        })
                        .eq('id', command_id);
                }

                return {
                    healed: true,
                    action: 'use_url_fallback',
                    success: true,
                    message: 'Switched to URL verification fallback method',
                    retry_recommended: false
                };
            },

            'document not confirmed': async () => {
                return {
                    healed: true,
                    action: 'use_url_fallback',
                    success: true,
                    message: 'Using URL verification instead of signal',
                    retry_recommended: false
                };
            }
        };

        const heal = healingActions[error_type];

        if (heal) {
            const result = await heal();

            // Log healing action
            await supabase.from('healing_actions').insert({
                error_type,
                command_id,
                device_id,
                action: result.action,
                success: result.success,
                healed_at: new Date().toISOString(),
                context: context || {}
            });

            console.log(`✅ [HEAL] Healed successfully:`, result);

            return new Response(JSON.stringify(result), {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        // No auto-heal available
        console.warn(`⚠️ [HEAL] No auto-heal available for: ${error_type}`);

        return new Response(JSON.stringify({
            healed: false,
            action: 'none',
            success: false,
            message: 'No auto-heal available for this error type'
        }), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });

    } catch (error) {
        console.error('❌ [HEAL] Error:', error);

        return new Response(JSON.stringify({
            healed: false,
            error: error.message
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
});
