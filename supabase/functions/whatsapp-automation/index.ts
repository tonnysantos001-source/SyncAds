import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handlePreflightRequest } from "../_utils/cors.ts";

/**
 * WhatsApp Automation Enhancement
 * 
 * Features:
 * - Auto-response with AI
 * - Template messages
 * - Bulk messaging
 * - Contact management
 * - Message scheduling
 */

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return handlePreflightRequest();
    }

    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            throw new Error("Missing authorization");
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const token = authHeader.replace("Bearer ", "");
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            throw new Error("Unauthorized");
        }

        const { action, ...params } = await req.json();

        console.log("📱 [WhatsApp] Action:", action);

        // Get WhatsApp configuration
        const { data: whatsappConfig } = await supabase
            .from("WhatsAppIntegration")
            .select("*")
            .eq("userId", user.id)
            .eq("isActive", true)
            .single();

        if (!whatsappConfig) {
            return new Response(
                JSON.stringify({
                    error: "WhatsApp não configurado",
                    hint: "Configure o WhatsApp Business API em Integrações",
                }),
                {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                }
            );
        }

        switch (action) {
            case "SEND_MESSAGE":
                return await sendMessage(supabase, whatsappConfig, params);

            case "SEND_TEMPLATE":
                return await sendTemplate(supabase, whatsappConfig, params);

            case "AUTO_REPLY":
                return await setupAutoReply(supabase, user.id, params);

            case "BULK_MESSAGE":
                return await sendBulkMessages(supabase, whatsappConfig, params);

            case "GET_CONTACTS":
                return await getContacts(supabase, user.id);

            default:
                throw new Error(`Unknown action: ${action}`);
        }
    } catch (error: any) {
        console.error("❌ [WhatsApp] Error:", error);

        return new Response(
            JSON.stringify({
                error: error.message,
                details: error.stack,
            }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
});

// ============================================
// SEND MESSAGE
// ============================================
async function sendMessage(supabase: any, config: any, params: any) {
    const { to, message } = params;

    if (!to || !message) {
        throw new Error("Missing 'to' or 'message'");
    }

    // WhatsApp Business API endpoint
    const whatsappUrl = `https://graph.facebook.com/v18.0/${config.phoneNumberId}/messages`;

    const response = await fetch(whatsappUrl, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${config.accessToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            messaging_product: "whatsapp",
            to: to,
            type: "text",
            text: {
                body: message,
            },
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`WhatsApp API error: ${error}`);
    }

    const data = await response.json();

    // Log message
    await supabase.from("WhatsAppMessage").insert({
        userId: config.userId,
        to: to,
        message: message,
        status: "sent",
        messageId: data.messages[0].id,
    });

    return new Response(
        JSON.stringify({
            success: true,
            messageId: data.messages[0].id,
            to: to,
        }),
        {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
    );
}

// ============================================
// SEND TEMPLATE MESSAGE
// ============================================
async function sendTemplate(supabase: any, config: any, params: any) {
    const { to, templateName, variables = [] } = params;

    const whatsappUrl = `https://graph.facebook.com/v18.0/${config.phoneNumberId}/messages`;

    const response = await fetch(whatsappUrl, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${config.accessToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            messaging_product: "whatsapp",
            to: to,
            type: "template",
            template: {
                name: templateName,
                language: {
                    code: "pt_BR",
                },
                components: variables.length > 0 ? [{
                    type: "body",
                    parameters: variables.map((v: string) => ({
                        type: "text",
                        text: v,
                    })),
                }] : [],
            },
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Template send failed: ${error}`);
    }

    const data = await response.json();

    return new Response(
        JSON.stringify({
            success: true,
            messageId: data.messages[0].id,
        }),
        {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
    );
}

// ============================================
// SETUP AUTO-REPLY
// ============================================
async function setupAutoReply(supabase: any, userId: string, params: any) {
    const { enabled, message, aiEnabled = true } = params;

    const { error } = await supabase
        .from("WhatsAppAutoReply")
        .upsert({
            userId: userId,
            enabled: enabled,
            message: message,
            aiEnabled: aiEnabled,
            updatedAt: new Date().toISOString(),
        }, {
            onConflict: "userId",
        });

    if (error) {
        throw new Error(`Failed to setup auto-reply: ${error.message}`);
    }

    return new Response(
        JSON.stringify({
            success: true,
            autoReply: {
                enabled: enabled,
                message: message,
                aiEnabled: aiEnabled,
            },
        }),
        {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
    );
}

// ============================================
// BULK MESSAGES
// ============================================
async function sendBulkMessages(supabase: any, config: any, params: any) {
    const { contacts, message, delay = 1000 } = params;

    if (!Array.isArray(contacts) || contacts.length === 0) {
        throw new Error("Contacts array is required");
    }

    const results = [];

    for (const contact of contacts) {
        try {
            // Send message
            await sendMessage(supabase, config, { to: contact, message });

            results.push({
                contact: contact,
                success: true,
            });

            // Delay to avoid rate limiting
            if (delay > 0) {
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        } catch (error: any) {
            results.push({
                contact: contact,
                success: false,
                error: error.message,
            });
        }
    }

    const successCount = results.filter((r) => r.success).length;

    return new Response(
        JSON.stringify({
            success: true,
            total: contacts.length,
            sent: successCount,
            failed: contacts.length - successCount,
            results: results,
        }),
        {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
    );
}

// ============================================
// GET CONTACTS
// ============================================
async function getContacts(supabase: any, userId: string) {
    const { data: contacts, error } = await supabase
        .from("WhatsAppContact")
        .select("*")
        .eq("userId", userId)
        .order("lastMessageAt", { ascending: false });

    if (error) {
        throw new Error(`Failed to get contacts: ${error.message}`);
    }

    return new Response(
        JSON.stringify({
            success: true,
            contacts: contacts || [],
            count: contacts?.length || 0,
        }),
        {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
    );
}
