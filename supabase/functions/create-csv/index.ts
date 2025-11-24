import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_utils/cors.ts";

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization")!;
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { data, filename, options = {} } = await req.json();

    // Validar dados
    if (!data || !Array.isArray(data)) {
      throw new Error("Data must be an array");
    }

    if (data.length === 0) {
      throw new Error("Data array is empty");
    }

    if (!filename) {
      throw new Error("Filename is required");
    }

    // Configurações
    const {
      delimiter = ",",
      includeHeaders = true,
      encoding = "utf-8",
      columns = null,
    } = options;

    // Gerar CSV
    const csvContent = generateCSV(data, {
      delimiter,
      includeHeaders,
      columns,
    });

    // Garantir que o filename tem extensão .csv
    const safeFilename = filename.endsWith(".csv") ? filename : `${filename}.csv`;

    // Upload para storage via file-manager
    const fileManagerUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/file-manager`;
    const uploadResponse = await fetch(fileManagerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({
        action: "upload",
        content: csvContent,
        filename: safeFilename,
        mimeType: "text/csv",
      }),
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json();
      throw new Error(`Upload failed: ${errorData.error}`);
    }

    const uploadResult = await uploadResponse.json();

    return new Response(
      JSON.stringify({
        success: true,
        file: uploadResult.file,
        rows: data.length,
        message: `CSV criado com sucesso! ${data.length} linhas exportadas.`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Create CSV error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

/**
 * Gera conteúdo CSV a partir de array de objetos
 */
function generateCSV(
  data: any[],
  options: {
    delimiter: string;
    includeHeaders: boolean;
    columns: string[] | null;
  }
): string {
  const { delimiter, includeHeaders, columns } = options;

  // Determinar colunas
  let headers: string[];
  if (columns) {
    headers = columns;
  } else {
    // Extrair todas as chaves únicas
    const allKeys = new Set<string>();
    data.forEach((row) => {
      Object.keys(row).forEach((key) => allKeys.add(key));
    });
    headers = Array.from(allKeys);
  }

  const lines: string[] = [];

  // Adicionar cabeçalho
  if (includeHeaders) {
    lines.push(headers.map((h) => escapeCSVValue(h, delimiter)).join(delimiter));
  }

  // Adicionar linhas de dados
  data.forEach((row) => {
    const values = headers.map((header) => {
      const value = row[header];
      return escapeCSVValue(value, delimiter);
    });
    lines.push(values.join(delimiter));
  });

  return lines.join("\n");
}

/**
 * Escapa valores para formato CSV
 */
function escapeCSVValue(value: any, delimiter: string): string {
  if (value === null || value === undefined) {
    return "";
  }

  // Converter para string
  let str = String(value);

  // Se contém delimiter, quebra de linha ou aspas, precisa envolver em aspas
  if (
    str.includes(delimiter) ||
    str.includes("\n") ||
    str.includes("\r") ||
    str.includes('"')
  ) {
    // Duplicar aspas internas
    str = str.replace(/"/g, '""');
    // Envolver em aspas
    str = `"${str}"`;
  }

  return str;
}
