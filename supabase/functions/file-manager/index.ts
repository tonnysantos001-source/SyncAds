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

    const { action, ...params } = await req.json();

    switch (action) {
      case "upload": {
        const { content, filename, mimeType } = params;

        // Validar conteúdo
        if (!content || !filename) {
          throw new Error("Content and filename are required");
        }

        // Criar path único
        const timestamp = Date.now();
        const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
        const path = `${user.id}/${timestamp}_${safeName}`;

        // Converter conteúdo para Uint8Array se for string
        let fileContent: Uint8Array;
        if (typeof content === "string") {
          fileContent = new TextEncoder().encode(content);
        } else {
          fileContent = new Uint8Array(content);
        }

        // Upload para Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("temp-files")
          .upload(path, fileContent, {
            contentType: mimeType || "application/octet-stream",
            upsert: false,
          });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          throw new Error(`Upload failed: ${uploadError.message}`);
        }

        // Gerar URL assinada (expira em 24h)
        const { data: signedData, error: signedError } = await supabase.storage
          .from("temp-files")
          .createSignedUrl(path, 86400); // 24 hours

        if (signedError) {
          console.error("Signed URL error:", signedError);
          throw new Error(`Failed to create signed URL: ${signedError.message}`);
        }

        // Calcular tamanho do arquivo
        const fileSize = fileContent.length;

        // Registrar no banco
        const expiresAt = new Date(Date.now() + 86400 * 1000).toISOString();

        const { data: recordData, error: recordError } = await supabase
          .from("temp_files")
          .insert({
            user_id: user.id,
            filename: safeName,
            storage_path: path,
            signed_url: signedData.signedUrl,
            file_size: fileSize,
            mime_type: mimeType || "application/octet-stream",
            expires_at: expiresAt,
          })
          .select()
          .single();

        if (recordError) {
          console.error("Record error:", recordError);
          // Não falhar se não conseguir registrar, o arquivo já foi criado
        }

        return new Response(
          JSON.stringify({
            success: true,
            file: {
              id: recordData?.id,
              url: signedData.signedUrl,
              filename: safeName,
              size: fileSize,
              mimeType: mimeType || "application/octet-stream",
              expiresAt: expiresAt,
              path: path,
            },
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      case "download": {
        const { fileId } = params;

        // Buscar arquivo no banco
        const { data: fileData, error: fileError } = await supabase
          .from("temp_files")
          .select("*")
          .eq("id", fileId)
          .eq("user_id", user.id)
          .single();

        if (fileError || !fileData) {
          throw new Error("File not found");
        }

        // Verificar se não expirou
        if (new Date(fileData.expires_at) < new Date()) {
          throw new Error("File expired");
        }

        // Incrementar contador de downloads
        await supabase
          .from("temp_files")
          .update({ downloaded_count: (fileData.downloaded_count || 0) + 1 })
          .eq("id", fileId);

        return new Response(
          JSON.stringify({
            success: true,
            file: {
              url: fileData.signed_url,
              filename: fileData.filename,
              size: fileData.file_size,
              mimeType: fileData.mime_type,
            },
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      case "list": {
        // Listar arquivos do usuário (não expirados)
        const { data: files, error: listError } = await supabase
          .from("temp_files")
          .select("*")
          .eq("user_id", user.id)
          .gt("expires_at", new Date().toISOString())
          .order("created_at", { ascending: false });

        if (listError) {
          throw new Error(`Failed to list files: ${listError.message}`);
        }

        return new Response(
          JSON.stringify({
            success: true,
            files: files.map((f) => ({
              id: f.id,
              filename: f.filename,
              size: f.file_size,
              mimeType: f.mime_type,
              url: f.signed_url,
              expiresAt: f.expires_at,
              createdAt: f.created_at,
              downloads: f.downloaded_count || 0,
            })),
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      case "delete": {
        const { fileId } = params;

        // Buscar arquivo
        const { data: fileData, error: fileError } = await supabase
          .from("temp_files")
          .select("*")
          .eq("id", fileId)
          .eq("user_id", user.id)
          .single();

        if (fileError || !fileData) {
          throw new Error("File not found");
        }

        // Deletar do storage
        const { error: deleteError } = await supabase.storage
          .from("temp-files")
          .remove([fileData.storage_path]);

        if (deleteError) {
          console.error("Storage delete error:", deleteError);
        }

        // Deletar do banco
        await supabase.from("temp_files").delete().eq("id", fileId);

        return new Response(
          JSON.stringify({
            success: true,
            message: "File deleted successfully",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      case "cleanup": {
        // Cleanup de arquivos expirados (apenas admins ou sistema)
        const now = new Date().toISOString();

        // Buscar arquivos expirados
        const { data: expiredFiles, error: queryError } = await supabase
          .from("temp_files")
          .select("*")
          .lt("expires_at", now);

        if (queryError) {
          throw new Error(`Cleanup query failed: ${queryError.message}`);
        }

        let deleted = 0;
        let errors = 0;

        // Deletar cada arquivo
        for (const file of expiredFiles || []) {
          try {
            // Deletar do storage
            await supabase.storage
              .from("temp-files")
              .remove([file.storage_path]);

            // Deletar do banco
            await supabase.from("temp_files").delete().eq("id", file.id);

            deleted++;
          } catch (error) {
            console.error(`Failed to delete file ${file.id}:`, error);
            errors++;
          }
        }

        return new Response(
          JSON.stringify({
            success: true,
            deleted,
            errors,
            total: (expiredFiles || []).length,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error("File manager error:", error);
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
