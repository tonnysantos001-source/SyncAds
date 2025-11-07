import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const {
      integrationId,
      action = "sync-all",
      limit = 100,
    } = await req.json();

    if (!integrationId) {
      return new Response(
        JSON.stringify({ success: false, error: "integrationId is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { data: integration, error: integrationError } = await supabase
      .from("WhatsAppIntegration")
      .select("*")
      .eq("id", integrationId)
      .eq("isActive", true)
      .single();

    if (integrationError || !integration) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Integration not found or inactive",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { data: syncLog } = await supabase
      .from("WhatsAppSyncLog")
      .insert({
        id: crypto.randomUUID(),
        userId: integration.userId,
        integrationId: integration.id,
        syncType: action,
        status: "started",
        startedAt: new Date().toISOString(),
      })
      .select()
      .single();

    const results: any = {};
    let hasError = false;
    let errorMessage = "";

    try {
      if (action === "sync-all" || action === "sync-messages") {
        const messagesResult = await syncMessages(supabase, integration, limit);
        results.messages = messagesResult;
        if (!messagesResult.success) {
          hasError = true;
          errorMessage = messagesResult.error || "Failed to sync messages";
        }
      }

      if (action === "sync-all" || action === "sync-contacts") {
        const contactsResult = await syncContacts(supabase, integration, limit);
        results.contacts = contactsResult;
        if (!contactsResult.success) {
          hasError = true;
          errorMessage = contactsResult.error || "Failed to sync contacts";
        }
      }

      await supabase
        .from("WhatsAppSyncLog")
        .update({
          status: hasError ? "completed_with_errors" : "completed",
          completedAt: new Date().toISOString(),
          errorMessage: hasError ? errorMessage : null,
          details: results,
        })
        .eq("id", syncLog.id);

      await supabase
        .from("WhatsAppIntegration")
        .update({
          lastSyncAt: new Date().toISOString(),
          lastSyncStatus: hasError ? "error" : "success",
        })
        .eq("id", integration.id);

      return new Response(
        JSON.stringify({ success: !hasError, results, syncLogId: syncLog.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    } catch (error: any) {
      await supabase
        .from("WhatsAppSyncLog")
        .update({
          status: "failed",
          completedAt: new Date().toISOString(),
          errorMessage: error.message,
          details: results,
        })
        .eq("id", syncLog.id);

      throw error;
    }
  } catch (error: any) {
    console.error("WhatsApp sync error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

async function syncMessages(supabase: any, integration: any, limit: number) {
  try {
    const messages: any[] = [];
    let nextPage = null;
    let hasMore = true;

    while (hasMore && messages.length < limit) {
      const url =
        nextPage ||
        `https://graph.facebook.com/v18.0/${integration.phoneNumberId}/messages?limit=100&access_token=${integration.accessToken}`;

      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 401 || response.status === 190) {
          return {
            success: false,
            error: "Access token expired. Please reconnect.",
            count: 0,
          };
        }
        return {
          success: false,
          error: `API error: ${response.status}`,
          count: 0,
        };
      }

      const data = await response.json();
      const pageMessages = data.data || [];

      if (pageMessages.length === 0) {
        hasMore = false;
      } else {
        messages.push(...pageMessages);

        if (data.paging?.next) {
          nextPage = data.paging.next;
        } else {
          hasMore = false;
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    if (messages.length > 0) {
      const messagesToInsert = messages.map((m: any) => ({
        id: `wa-${integration.id}-${m.id}`,
        userId: integration.userId,
        integrationId: integration.id,
        messageId: m.id,
        from: m.from || "",
        to: m.to || "",
        type: m.type || "",
        timestamp: m.timestamp || new Date().toISOString(),
        text: m.text?.body || "",
        mediaUrl: m.image?.link || m.video?.link || m.document?.link || "",
        mediaType: m.image
          ? "image"
          : m.video
            ? "video"
            : m.document
              ? "document"
              : "",
        caption: m.image?.caption || m.video?.caption || "",
        status: m.status || "",
        whatsappData: m,
        lastSyncAt: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("WhatsAppMessage")
        .upsert(messagesToInsert, { onConflict: "id" });

      if (error) {
        return { success: false, error: error.message, count: 0 };
      }
    }

    return { success: true, count: messages.length, synced: messages.length };
  } catch (error: any) {
    return { success: false, error: error.message, count: 0 };
  }
}

async function syncContacts(supabase: any, integration: any, limit: number) {
  try {
    const contacts: any[] = [];
    let nextPage = null;
    let hasMore = true;

    while (hasMore && contacts.length < limit) {
      const url =
        nextPage ||
        `https://graph.facebook.com/v18.0/${integration.phoneNumberId}/contacts?limit=100&access_token=${integration.accessToken}`;

      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 401 || response.status === 190) {
          return {
            success: false,
            error: "Access token expired. Please reconnect.",
            count: 0,
          };
        }
        // Contacts endpoint pode não estar disponível
        if (response.status === 404 || response.status === 403) {
          return { success: true, count: 0, synced: 0 };
        }
        return {
          success: false,
          error: `API error: ${response.status}`,
          count: 0,
        };
      }

      const data = await response.json();
      const pageContacts = data.data || [];

      if (pageContacts.length === 0) {
        hasMore = false;
      } else {
        contacts.push(...pageContacts);

        if (data.paging?.next) {
          nextPage = data.paging.next;
        } else {
          hasMore = false;
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    if (contacts.length > 0) {
      const contactsToInsert = contacts.map((c: any) => ({
        id: `wa-${integration.id}-${c.wa_id}`,
        userId: integration.userId,
        integrationId: integration.id,
        waId: c.wa_id || "",
        phoneNumber: c.phone_number || "",
        name: c.profile?.name || "",
        status: c.status || "",
        whatsappData: c,
        lastSyncAt: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("WhatsAppContact")
        .upsert(contactsToInsert, { onConflict: "id" });

      if (error) {
        return { success: false, error: error.message, count: 0 };
      }
    }

    return { success: true, count: contacts.length, synced: contacts.length };
  } catch (error: any) {
    return { success: false, error: error.message, count: 0 };
  }
}
