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

    const { sheets, filename, options = {} } = await req.json();

    // Validar dados
    if (!sheets || !Array.isArray(sheets)) {
      throw new Error("Sheets must be an array");
    }

    if (sheets.length === 0) {
      throw new Error("Sheets array is empty");
    }

    if (!filename) {
      throw new Error("Filename is required");
    }

    // Gerar Excel usando biblioteca simples
    const excelContent = generateSimpleExcel(sheets, options);

    // Garantir extensão .xlsx
    const safeFilename = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;

    // Upload via file-manager
    const fileManagerUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/file-manager`;
    const uploadResponse = await fetch(fileManagerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({
        action: "upload",
        content: excelContent,
        filename: safeFilename,
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json();
      throw new Error(`Upload failed: ${errorData.error}`);
    }

    const uploadResult = await uploadResponse.json();

    // Contar total de linhas
    const totalRows = sheets.reduce((sum, sheet) => sum + (sheet.data?.length || 0), 0);

    return new Response(
      JSON.stringify({
        success: true,
        file: uploadResult.file,
        sheets: sheets.length,
        rows: totalRows,
        message: `Excel criado com sucesso! ${sheets.length} planilha(s), ${totalRows} linhas.`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Create Excel error:", error);
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
 * Gera Excel simples em formato XML (SpreadsheetML)
 * Compatível com Excel e LibreOffice
 */
function generateSimpleExcel(sheets: any[], options: any): string {
  const { creator = "SyncAds AI" } = options;

  let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Author>${escapeXml(creator)}</Author>
  <Created>${new Date().toISOString()}</Created>
 </DocumentProperties>
 <ExcelWorkbook xmlns="urn:schemas-microsoft-com:office:excel">
  <WindowHeight>12000</WindowHeight>
  <WindowWidth>15000</WindowWidth>
  <ProtectStructure>False</ProtectStructure>
  <ProtectWindows>False</ProtectWindows>
 </ExcelWorkbook>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Bottom"/>
  </Style>
  <Style ss:ID="Header">
   <Font ss:Bold="1"/>
   <Interior ss:Color="#CCCCCC" ss:Pattern="Solid"/>
  </Style>
 </Styles>
`;

  // Adicionar cada planilha
  sheets.forEach((sheet) => {
    const sheetName = sheet.name || "Sheet1";
    const sheetData = sheet.data || [];

    if (sheetData.length === 0) {
      return;
    }

    // Extrair cabeçalhos
    const headers = Object.keys(sheetData[0]);
    const columnCount = headers.length;

    xml += `
 <Worksheet ss:Name="${escapeXml(sheetName)}">
  <Table ss:ExpandedColumnCount="${columnCount}" ss:ExpandedRowCount="${sheetData.length + 1}">
`;

    // Adicionar cabeçalhos
    xml += `   <Row ss:StyleID="Header">\n`;
    headers.forEach((header) => {
      xml += `    <Cell><Data ss:Type="String">${escapeXml(header)}</Data></Cell>\n`;
    });
    xml += `   </Row>\n`;

    // Adicionar linhas de dados
    sheetData.forEach((row: any) => {
      xml += `   <Row>\n`;
      headers.forEach((header) => {
        const value = row[header];
        const { type, formattedValue } = formatCellValue(value);
        xml += `    <Cell><Data ss:Type="${type}">${escapeXml(formattedValue)}</Data></Cell>\n`;
      });
      xml += `   </Row>\n`;
    });

    xml += `  </Table>
 </Worksheet>
`;
  });

  xml += `</Workbook>`;

  return xml;
}

/**
 * Formata valor da célula com tipo apropriado
 */
function formatCellValue(value: any): { type: string; formattedValue: string } {
  if (value === null || value === undefined) {
    return { type: "String", formattedValue: "" };
  }

  // Número
  if (typeof value === "number") {
    return { type: "Number", formattedValue: String(value) };
  }

  // Booleano
  if (typeof value === "boolean") {
    return { type: "Boolean", formattedValue: value ? "1" : "0" };
  }

  // Data
  if (value instanceof Date) {
    return { type: "DateTime", formattedValue: value.toISOString() };
  }

  // String (default)
  return { type: "String", formattedValue: String(value) };
}

/**
 * Escapa caracteres especiais para XML
 */
function escapeXml(str: string): string {
  if (typeof str !== "string") {
    str = String(str);
  }

  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
