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
      .from("PagSeguroIntegration")
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
      .from("PagSeguroSyncLog")
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
      // Sync transactions
      if (action === "sync-all" || action === "sync-transactions") {
        const transactionsResult = await syncTransactions(
          supabase,
          integration,
          limit,
        );
        results.transactions = transactionsResult;
        if (!transactionsResult.success) {
          hasError = true;
          errorMessage =
            transactionsResult.error || "Failed to sync transactions";
        }
      }

      await supabase
        .from("PagSeguroSyncLog")
        .update({
          status: hasError ? "completed_with_errors" : "completed",
          completedAt: new Date().toISOString(),
          errorMessage: hasError ? errorMessage : null,
          details: results,
        })
        .eq("id", syncLog.id);

      await supabase
        .from("PagSeguroIntegration")
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
        .from("PagSeguroSyncLog")
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
    console.error("PagSeguro sync error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

async function syncTransactions(
  supabase: any,
  integration: any,
  limit: number,
) {
  try {
    const transactions: any[] = [];
    let page = 1;
    let hasMore = true;

    // Buscar transações dos últimos 30 dias
    const initialDate = new Date();
    initialDate.setDate(initialDate.getDate() - 30);
    const initialDateStr = initialDate
      .toISOString()
      .split("T")[0]
      .replace(/-/g, "");

    const finalDate = new Date();
    const finalDateStr = finalDate
      .toISOString()
      .split("T")[0]
      .replace(/-/g, "");

    while (hasMore && transactions.length < limit) {
      const url = `https://ws.pagseguro.uol.com.br/v3/transactions?email=${integration.email}&token=${integration.token}&initialDate=${initialDateStr}T000000&finalDate=${finalDateStr}T235959&page=${page}&maxPageResults=100`;

      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/xml;charset=UTF-8",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          return {
            success: false,
            error: "Invalid credentials. Please reconnect.",
            count: 0,
          };
        }
        return {
          success: false,
          error: `API error: ${response.status}`,
          count: 0,
        };
      }

      const text = await response.text();

      // Parse XML response (simplified - PagSeguro returns XML)
      // Em produção, usar um parser XML adequado
      const transactionMatches =
        text.match(/<transaction>[\s\S]*?<\/transaction>/g) || [];

      if (transactionMatches.length === 0) {
        hasMore = false;
      } else {
        for (const match of transactionMatches) {
          const transaction: any = {};

          // Extract basic fields
          const codeMatch = match.match(/<code>(.*?)<\/code>/);
          const statusMatch = match.match(/<status>(.*?)<\/status>/);
          const typeMatch = match.match(/<type>(.*?)<\/type>/);
          const paymentMethodMatch = match.match(
            /<paymentMethod>[\s\S]*?<type>(.*?)<\/type>[\s\S]*?<\/paymentMethod>/,
          );
          const grossAmountMatch = match.match(
            /<grossAmount>(.*?)<\/grossAmount>/,
          );
          const netAmountMatch = match.match(/<netAmount>(.*?)<\/netAmount>/);
          const feeAmountMatch = match.match(/<feeAmount>(.*?)<\/feeAmount>/);
          const referenceMatch = match.match(/<reference>(.*?)<\/reference>/);
          const dateMatch = match.match(/<date>(.*?)<\/date>/);

          // Extract sender info
          const senderNameMatch = match.match(
            /<sender>[\s\S]*?<name>(.*?)<\/name>/,
          );
          const senderEmailMatch = match.match(
            /<sender>[\s\S]*?<email>(.*?)<\/email>/,
          );
          const senderPhoneMatch = match.match(
            /<sender>[\s\S]*?<areaCode>(.*?)<\/areaCode>[\s\S]*?<number>(.*?)<\/number>/,
          );

          if (codeMatch) {
            transaction.code = codeMatch[1];
            transaction.status = statusMatch ? statusMatch[1] : "";
            transaction.type = typeMatch ? typeMatch[1] : "";
            transaction.paymentMethod = paymentMethodMatch
              ? paymentMethodMatch[1]
              : "";
            transaction.grossAmount = grossAmountMatch
              ? parseFloat(grossAmountMatch[1])
              : 0;
            transaction.netAmount = netAmountMatch
              ? parseFloat(netAmountMatch[1])
              : 0;
            transaction.feeAmount = feeAmountMatch
              ? parseFloat(feeAmountMatch[1])
              : 0;
            transaction.reference = referenceMatch ? referenceMatch[1] : "";
            transaction.date = dateMatch ? dateMatch[1] : "";
            transaction.senderName = senderNameMatch ? senderNameMatch[1] : "";
            transaction.senderEmail = senderEmailMatch
              ? senderEmailMatch[1]
              : "";
            transaction.senderPhone = senderPhoneMatch
              ? `${senderPhoneMatch[1]}${senderPhoneMatch[2]}`
              : "";
            transaction.rawXml = match;

            transactions.push(transaction);
          }
        }

        page++;

        if (transactionMatches.length < 100) {
          hasMore = false;
        }
      }

      // Rate limiting - PagSeguro permite cerca de 50 requisições por minuto
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    if (transactions.length > 0) {
      const transactionsToInsert = transactions.map((t: any) => ({
        id: `pagseguro-${integration.id}-${t.code}`,
        userId: integration.userId,
        integrationId: integration.id,
        transactionCode: t.code,
        status: t.status,
        statusName: getStatusName(t.status),
        type: t.type,
        paymentMethod: t.paymentMethod,
        grossAmount: t.grossAmount,
        netAmount: t.netAmount,
        feeAmount: t.feeAmount,
        reference: t.reference,
        senderName: t.senderName,
        senderEmail: t.senderEmail,
        senderPhone: t.senderPhone,
        pagseguroData: { xml: t.rawXml },
        transactionDate: t.date || new Date().toISOString(),
        lastSyncAt: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("PagSeguroTransaction")
        .upsert(transactionsToInsert, { onConflict: "id" });

      if (error) {
        return { success: false, error: error.message, count: 0 };
      }
    }

    return {
      success: true,
      count: transactions.length,
      synced: transactions.length,
    };
  } catch (error: any) {
    return { success: false, error: error.message, count: 0 };
  }
}

function getStatusName(status: string): string {
  const statusMap: { [key: string]: string } = {
    "1": "Aguardando pagamento",
    "2": "Em análise",
    "3": "Paga",
    "4": "Disponível",
    "5": "Em disputa",
    "6": "Devolvida",
    "7": "Cancelada",
    "8": "Debitado",
    "9": "Retenção temporária",
  };
  return statusMap[status] || "Desconhecido";
}
