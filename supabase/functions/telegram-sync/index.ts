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
      .from("TelegramIntegration")
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
      .from("TelegramSyncLog")
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

      if (action === "sync-all" || action === "sync-chats") {
        const chatsResult = await syncChats(supabase, integration, limit);
        results.chats = chatsResult;
        if (!chatsResult.success) {
          hasError = true;
          errorMessage = chatsResult.error || "Failed to sync chats";
        }
      }

      await supabase
        .from("TelegramSyncLog")
        .update({
          status: hasError ? "completed_with_errors" : "completed",
          completedAt: new Date().toISOString(),
          errorMessage: hasError ? errorMessage : null,
          details: results,
        })
        .eq("id", syncLog.id);

      await supabase
        .from("TelegramIntegration")
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
        .from("TelegramSyncLog")
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
    console.error("Telegram sync error:", error);
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
    const offset = integration.lastUpdateId || 0;

    const url = `https://api.telegram.org/bot${integration.botToken}/getUpdates?offset=${offset}&limit=${limit > 100 ? 100 : limit}`;

    const response = await fetch(url);

    if (!response.ok) {
      return {
        success: false,
        error: `API error: ${response.status}`,
        count: 0,
      };
    }

    const data = await response.json();

    if (!data.ok) {
      return {
        success: false,
        error: data.description || "Telegram API error",
        count: 0,
      };
    }

    const updates = data.result || [];

    if (updates.length > 0) {
      let maxUpdateId = offset;

      for (const update of updates) {
        if (update.update_id > maxUpdateId) {
          maxUpdateId = update.update_id;
        }

        const message =
          update.message || update.edited_message || update.channel_post;
        if (message) {
          messages.push({
            updateId: update.update_id,
            message: message,
          });
        }
      }

      if (messages.length > 0) {
        const messagesToInsert = messages.map((m: any) => ({
          id: `tg-${integration.id}-${m.message.message_id}`,
          userId: integration.userId,
          integrationId: integration.id,
          messageId: String(m.message.message_id),
          updateId: m.updateId,
          chatId: String(m.message.chat.id),
          chatType: m.message.chat.type || "",
          chatTitle: m.message.chat.title || "",
          fromUserId: m.message.from?.id ? String(m.message.from.id) : "",
          fromUsername: m.message.from?.username || "",
          fromFirstName: m.message.from?.first_name || "",
          fromLastName: m.message.from?.last_name || "",
          text: m.message.text || m.message.caption || "",
          date: m.message.date
            ? new Date(m.message.date * 1000).toISOString()
            : new Date().toISOString(),
          messageType: m.message.photo
            ? "photo"
            : m.message.video
              ? "video"
              : m.message.document
                ? "document"
                : m.message.audio
                  ? "audio"
                  : m.message.voice
                    ? "voice"
                    : m.message.sticker
                      ? "sticker"
                      : m.message.location
                        ? "location"
                        : "text",
          mediaFileId:
            m.message.photo?.[0]?.file_id ||
            m.message.video?.file_id ||
            m.message.document?.file_id ||
            m.message.audio?.file_id ||
            m.message.voice?.file_id ||
            m.message.sticker?.file_id ||
            "",
          replyToMessageId: m.message.reply_to_message?.message_id
            ? String(m.message.reply_to_message.message_id)
            : null,
          forwardFromChatId: m.message.forward_from_chat?.id
            ? String(m.message.forward_from_chat.id)
            : null,
          telegramData: m.message,
          lastSyncAt: new Date().toISOString(),
        }));

        const { error } = await supabase
          .from("TelegramMessage")
          .upsert(messagesToInsert, { onConflict: "id" });

        if (error) {
          return { success: false, error: error.message, count: 0 };
        }
      }

      // Update lastUpdateId for next sync
      await supabase
        .from("TelegramIntegration")
        .update({ lastUpdateId: maxUpdateId + 1 })
        .eq("id", integration.id);
    }

    return { success: true, count: messages.length, synced: messages.length };
  } catch (error: any) {
    return { success: false, error: error.message, count: 0 };
  }
}

async function syncChats(supabase: any, integration: any, limit: number) {
  try {
    // Get unique chat IDs from recent messages
    const { data: recentMessages } = await supabase
      .from("TelegramMessage")
      .select("chatId")
      .eq("integrationId", integration.id)
      .order("date", { ascending: false })
      .limit(limit);

    if (!recentMessages || recentMessages.length === 0) {
      return { success: true, count: 0, synced: 0 };
    }

    const uniqueChatIds = [
      ...new Set(recentMessages.map((m: any) => m.chatId)),
    ];

    const chats: any[] = [];

    for (const chatId of uniqueChatIds) {
      const url = `https://api.telegram.org/bot${integration.botToken}/getChat?chat_id=${chatId}`;

      const response = await fetch(url);

      if (!response.ok) {
        continue;
      }

      const data = await response.json();

      if (data.ok && data.result) {
        chats.push(data.result);
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    if (chats.length > 0) {
      const chatsToInsert = chats.map((c: any) => ({
        id: `tg-chat-${integration.id}-${c.id}`,
        userId: integration.userId,
        integrationId: integration.id,
        chatId: String(c.id),
        type: c.type || "",
        title: c.title || "",
        username: c.username || "",
        firstName: c.first_name || "",
        lastName: c.last_name || "",
        bio: c.bio || "",
        description: c.description || "",
        inviteLink: c.invite_link || "",
        pinnedMessageId: c.pinned_message?.message_id
          ? String(c.pinned_message.message_id)
          : null,
        membersCount: c.members_count || 0,
        photoSmallFileId: c.photo?.small_file_id || "",
        photoBigFileId: c.photo?.big_file_id || "",
        telegramData: c,
        lastSyncAt: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("TelegramChat")
        .upsert(chatsToInsert, { onConflict: "id" });

      if (error) {
        return { success: false, error: error.message, count: 0 };
      }
    }

    return { success: true, count: chats.length, synced: chats.length };
  } catch (error: any) {
    return { success: false, error: error.message, count: 0 };
  }
}
