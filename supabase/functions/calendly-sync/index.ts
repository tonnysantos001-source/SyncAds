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
      .from("CalendlyIntegration")
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
      .from("CalendlySyncLog")
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
      // Sync event types
      if (action === "sync-all" || action === "sync-event-types") {
        const eventTypesResult = await syncEventTypes(
          supabase,
          integration,
          limit,
        );
        results.eventTypes = eventTypesResult;
        if (!eventTypesResult.success) {
          hasError = true;
          errorMessage = eventTypesResult.error || "Failed to sync event types";
        }
      }

      // Sync scheduled events
      if (action === "sync-all" || action === "sync-events") {
        const eventsResult = await syncScheduledEvents(
          supabase,
          integration,
          limit,
        );
        results.events = eventsResult;
        if (!eventsResult.success) {
          hasError = true;
          errorMessage = eventsResult.error || "Failed to sync events";
        }
      }

      await supabase
        .from("CalendlySyncLog")
        .update({
          status: hasError ? "completed_with_errors" : "completed",
          completedAt: new Date().toISOString(),
          errorMessage: hasError ? errorMessage : null,
          details: results,
        })
        .eq("id", syncLog.id);

      await supabase
        .from("CalendlyIntegration")
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
        .from("CalendlySyncLog")
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
    console.error("Calendly sync error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

async function syncEventTypes(
  supabase: any,
  integration: any,
  limit: number,
) {
  try {
    const eventTypes: any[] = [];
    let nextPageToken = null;
    let hasMore = true;

    const organizationUri = `https://api.calendly.com/users/${integration.calendlyUserId}`;

    while (hasMore && eventTypes.length < limit) {
      let url = `https://api.calendly.com/event_types?user=${organizationUri}&count=100`;
      if (nextPageToken) {
        url += `&page_token=${nextPageToken}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${integration.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
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
      const pageEventTypes = data.collection || [];

      if (pageEventTypes.length === 0) {
        hasMore = false;
      } else {
        eventTypes.push(...pageEventTypes);

        if (data.pagination?.next_page_token) {
          nextPageToken = data.pagination.next_page_token;
        } else {
          hasMore = false;
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    if (eventTypes.length > 0) {
      const eventTypesToInsert = eventTypes.map((et: any) => ({
        id: `calendly-${integration.id}-${et.uri.split("/").pop()}`,
        userId: integration.userId,
        integrationId: integration.id,
        eventTypeId: et.uri.split("/").pop(),
        name: et.name || "",
        slug: et.slug || "",
        description: et.description_plain || "",
        duration: parseInt(et.duration || 0),
        color: et.color || "",
        kind: et.kind || "",
        schedulingUrl: et.scheduling_url || "",
        active: et.active || false,
        bookingMethod: et.booking_method || "",
        type: et.type || "",
        secretToken: et.secret || false,
        calendlyData: et,
        createdAt: et.created_at || new Date().toISOString(),
        updatedAt: et.updated_at || new Date().toISOString(),
        lastSyncAt: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("CalendlyEventType")
        .upsert(eventTypesToInsert, { onConflict: "id" });

      if (error) {
        return { success: false, error: error.message, count: 0 };
      }
    }

    return {
      success: true,
      count: eventTypes.length,
      synced: eventTypes.length,
    };
  } catch (error: any) {
    return { success: false, error: error.message, count: 0 };
  }
}

async function syncScheduledEvents(
  supabase: any,
  integration: any,
  limit: number,
) {
  try {
    const events: any[] = [];
    let nextPageToken = null;
    let hasMore = true;

    // Buscar eventos dos últimos 30 dias
    const minStartTime = new Date();
    minStartTime.setDate(minStartTime.getDate() - 30);
    const minStartTimeStr = minStartTime.toISOString();

    const organizationUri = `https://api.calendly.com/users/${integration.calendlyUserId}`;

    while (hasMore && events.length < limit) {
      let url = `https://api.calendly.com/scheduled_events?user=${organizationUri}&min_start_time=${minStartTimeStr}&count=100&sort=start_time:desc`;
      if (nextPageToken) {
        url += `&page_token=${nextPageToken}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${integration.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
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
      const pageEvents = data.collection || [];

      if (pageEvents.length === 0) {
        hasMore = false;
      } else {
        events.push(...pageEvents);

        if (data.pagination?.next_page_token) {
          nextPageToken = data.pagination.next_page_token;
        } else {
          hasMore = false;
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    if (events.length > 0) {
      const eventsToInsert = events.map((e: any) => ({
        id: `calendly-event-${integration.id}-${e.uri.split("/").pop()}`,
        userId: integration.userId,
        integrationId: integration.id,
        eventId: e.uri.split("/").pop(),
        eventTypeId: e.event_type ? e.event_type.split("/").pop() : "",
        name: e.name || "",
        status: e.status || "",
        startTime: e.start_time || null,
        endTime: e.end_time || null,
        location: e.location?.type || "",
        locationJoinUrl: e.location?.join_url || "",
        inviteesCounter: parseInt(e.invitees_counter?.total || 0),
        inviteesCounterActive: parseInt(e.invitees_counter?.active || 0),
        inviteesCounterLimit: parseInt(e.invitees_counter?.limit || 0),
        cancellationReason: e.cancellation?.canceler_type || null,
        cancelledAt: e.cancellation?.canceled_at || null,
        calendlyData: e,
        createdAt: e.created_at || new Date().toISOString(),
        updatedAt: e.updated_at || new Date().toISOString(),
        lastSyncAt: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("CalendlyScheduledEvent")
        .upsert(eventsToInsert, { onConflict: "id" });

      if (error) {
        return { success: false, error: error.message, count: 0 };
      }

      // Sync invitees for each event
      for (const event of events) {
        await syncEventInvitees(supabase, integration, event);
      }
    }

    return { success: true, count: events.length, synced: events.length };
  } catch (error: any) {
    return { success: false, error: error.message, count: 0 };
  }
}

async function syncEventInvitees(
  supabase: any,
  integration: any,
  event: any,
) {
  try {
    const eventUri = event.uri;
    const url = `https://api.calendly.com/scheduled_events/${eventUri.split("/").pop()}/invitees`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${integration.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return;
    }

    const data = await response.json();
    const invitees = data.collection || [];

    if (invitees.length > 0) {
      const inviteesToInsert = invitees.map((inv: any) => ({
        id: `calendly-invitee-${integration.id}-${inv.uri.split("/").pop()}`,
        userId: integration.userId,
        integrationId: integration.id,
        inviteeId: inv.uri.split("/").pop(),
        eventId: event.uri.split("/").pop(),
        name: inv.name || "",
        email: inv.email || "",
        timezone: inv.timezone || "",
        status: inv.status || "",
        questionsAndAnswers: inv.questions_and_answers || [],
        trackingUtmCampaign: inv.tracking?.utm_campaign || "",
        trackingUtmSource: inv.tracking?.utm_source || "",
        trackingUtmMedium: inv.tracking?.utm_medium || "",
        trackingUtmContent: inv.tracking?.utm_content || "",
        trackingUtmTerm: inv.tracking?.utm_term || "",
        cancelledAt: inv.canceled ? inv.cancellation?.canceled_at : null,
        cancellationReason: inv.canceled
          ? inv.cancellation?.canceler_type
          : null,
        rescheduled: inv.rescheduled || false,
        noShow: inv.no_show || false,
        calendlyData: inv,
        createdAt: inv.created_at || new Date().toISOString(),
        updatedAt: inv.updated_at || new Date().toISOString(),
        lastSyncAt: new Date().toISOString(),
      }));

      await supabase
        .from("CalendlyInvitee")
        .upsert(inviteesToInsert, { onConflict: "id" });
    }

    await new Promise((resolve) => setTimeout(resolve, 200));
  } catch (error: any) {
    console.error("Error syncing invitees:", error);
  }
}
