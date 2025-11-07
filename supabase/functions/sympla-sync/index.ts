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
      .from("SymplaIntegration")
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
      .from("Sympla​SyncLog")
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
      // Sync events
      if (action === "sync-all" || action === "sync-events") {
        const eventsResult = await syncEvents(supabase, integration, limit);
        results.events = eventsResult;
        if (!eventsResult.success) {
          hasError = true;
          errorMessage = eventsResult.error || "Failed to sync events";
        }
      }

      // Sync participants
      if (action === "sync-all" || action === "sync-participants") {
        const participantsResult = await syncParticipants(
          supabase,
          integration,
          limit,
        );
        results.participants = participantsResult;
        if (!participantsResult.success) {
          hasError = true;
          errorMessage =
            participantsResult.error || "Failed to sync participants";
        }
      }

      // Sync orders
      if (action === "sync-all" || action === "sync-orders") {
        const ordersResult = await syncOrders(supabase, integration, limit);
        results.orders = ordersResult;
        if (!ordersResult.success) {
          hasError = true;
          errorMessage = ordersResult.error || "Failed to sync orders";
        }
      }

      await supabase
        .from("SymplaSyncLog")
        .update({
          status: hasError ? "completed_with_errors" : "completed",
          completedAt: new Date().toISOString(),
          errorMessage: hasError ? errorMessage : null,
          details: results,
        })
        .eq("id", syncLog.id);

      await supabase
        .from("SymplaIntegration")
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
        .from("SymplaSyncLog")
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
    console.error("Sympla sync error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

async function syncEvents(supabase: any, integration: any, limit: number) {
  try {
    const events: any[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore && events.length < limit) {
      const url = `https://api.sympla.com.br/public/v4/events?page=${page}&per_page=100`;

      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          "s_token": integration.apiToken,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          return {
            success: false,
            error: "Invalid API token. Please reconnect.",
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
      const pageEvents = data.data || [];

      if (pageEvents.length === 0) {
        hasMore = false;
      } else {
        events.push(...pageEvents);
        page++;

        if (pageEvents.length < 100) {
          hasMore = false;
        }
      }

      // Rate limiting - Sympla permite 100 requisições por minuto
      await new Promise((resolve) => setTimeout(resolve, 650));
    }

    if (events.length > 0) {
      const eventsToInsert = events.map((e: any) => ({
        id: `sympla-${integration.id}-${e.id}`,
        userId: integration.userId,
        integrationId: integration.id,
        eventId: String(e.id),
        name: e.name || "",
        description: e.description || "",
        detailUrl: e.url || "",
        startDate: e.start_date || null,
        endDate: e.end_date || null,
        status: e.status || "",
        category: e.category?.name || "",
        address: e.address || "",
        city: e.city || "",
        state: e.state || "",
        country: e.country || "Brasil",
        imageUrl: e.image || "",
        capacity: parseInt(e.capacity || 0),
        ticketsSold: parseInt(e.sold_tickets || 0),
        ticketsAvailable: parseInt(e.available_tickets || 0),
        totalRevenue: parseFloat(e.total_revenue || 0),
        currency: "BRL",
        symplaData: e,
        lastSyncAt: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("SymplaEvent")
        .upsert(eventsToInsert, { onConflict: "id" });

      if (error) {
        return { success: false, error: error.message, count: 0 };
      }
    }

    return { success: true, count: events.length, synced: events.length };
  } catch (error: any) {
    return { success: false, error: error.message, count: 0 };
  }
}

async function syncParticipants(
  supabase: any,
  integration: any,
  limit: number,
) {
  try {
    // Primeiro, buscar os eventos para depois buscar participantes
    const { data: events } = await supabase
      .from("SymplaEvent")
      .select("eventId")
      .eq("integrationId", integration.id)
      .limit(10);

    if (!events || events.length === 0) {
      return { success: true, count: 0, synced: 0 };
    }

    let totalParticipants = 0;

    for (const event of events) {
      const participants: any[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore && participants.length < limit) {
        const url = `https://api.sympla.com.br/public/v4/events/${event.eventId}/participants?page=${page}&per_page=100`;

        const response = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
            "s_token": integration.apiToken,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            return {
              success: false,
              error: "Invalid API token. Please reconnect.",
              count: 0,
            };
          }
          // Event sem participantes ou erro, continuar
          break;
        }

        const data = await response.json();
        const pageParticipants = data.data || [];

        if (pageParticipants.length === 0) {
          hasMore = false;
        } else {
          participants.push(...pageParticipants);
          page++;

          if (pageParticipants.length < 100) {
            hasMore = false;
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 650));
      }

      if (participants.length > 0) {
        const participantsToInsert = participants.map((p: any) => ({
          id: `sympla-part-${integration.id}-${p.id}`,
          userId: integration.userId,
          integrationId: integration.id,
          participantId: String(p.id),
          eventId: String(event.eventId),
          orderId: String(p.order_id || ""),
          ticketNumber: p.ticket_number || "",
          ticketType: p.ticket_name || "",
          name: p.name || "",
          email: p.email || "",
          phone: p.phone || "",
          document: p.document || "",
          checkInDate: p.checkin_date || null,
          checkInStatus: p.checked_in ? "checked_in" : "not_checked_in",
          ticketPrice: parseFloat(p.ticket_price || 0),
          symplaData: p,
          purchaseDate: p.purchase_date || new Date().toISOString(),
          lastSyncAt: new Date().toISOString(),
        }));

        const { error } = await supabase
          .from("SymplaParticipant")
          .upsert(participantsToInsert, { onConflict: "id" });

        if (error) {
          return { success: false, error: error.message, count: 0 };
        }

        totalParticipants += participants.length;
      }
    }

    return {
      success: true,
      count: totalParticipants,
      synced: totalParticipants,
    };
  } catch (error: any) {
    return { success: false, error: error.message, count: 0 };
  }
}

async function syncOrders(supabase: any, integration: any, limit: number) {
  try {
    // Buscar os eventos para depois buscar pedidos
    const { data: events } = await supabase
      .from("SymplaEvent")
      .select("eventId")
      .eq("integrationId", integration.id)
      .limit(10);

    if (!events || events.length === 0) {
      return { success: true, count: 0, synced: 0 };
    }

    let totalOrders = 0;

    for (const event of events) {
      const orders: any[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore && orders.length < limit) {
        const url = `https://api.sympla.com.br/public/v4/events/${event.eventId}/orders?page=${page}&per_page=100`;

        const response = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
            "s_token": integration.apiToken,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            return {
              success: false,
              error: "Invalid API token. Please reconnect.",
              count: 0,
            };
          }
          break;
        }

        const data = await response.json();
        const pageOrders = data.data || [];

        if (pageOrders.length === 0) {
          hasMore = false;
        } else {
          orders.push(...pageOrders);
          page++;

          if (pageOrders.length < 100) {
            hasMore = false;
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 650));
      }

      if (orders.length > 0) {
        const ordersToInsert = orders.map((o: any) => ({
          id: `sympla-order-${integration.id}-${o.id}`,
          userId: integration.userId,
          integrationId: integration.id,
          orderId: String(o.id),
          eventId: String(event.eventId),
          orderNumber: o.order_number || "",
          status: o.status || "",
          buyerName: o.buyer_name || "",
          buyerEmail: o.buyer_email || "",
          buyerPhone: o.buyer_phone || "",
          totalAmount: parseFloat(o.total_amount || 0),
          ticketAmount: parseFloat(o.ticket_amount || 0),
          feeAmount: parseFloat(o.fee_amount || 0),
          ticketsQuantity: parseInt(o.tickets_quantity || 0),
          paymentMethod: o.payment_method || "",
          paymentStatus: o.payment_status || "",
          currency: "BRL",
          symplaData: o,
          orderDate: o.created_at || new Date().toISOString(),
          lastSyncAt: new Date().toISOString(),
        }));

        const { error } = await supabase
          .from("SymplaOrder")
          .upsert(ordersToInsert, { onConflict: "id" });

        if (error) {
          return { success: false, error: error.message, count: 0 };
        }

        totalOrders += orders.length;
      }
    }

    return { success: true, count: totalOrders, synced: totalOrders };
  } catch (error: any) {
    return { success: false, error: error.message, count: 0 };
  }
}
