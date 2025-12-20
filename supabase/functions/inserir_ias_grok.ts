// Script para inserir as 3 IAs do Grok no banco de dados
// Execute: deno run --allow-net --allow-env inserir_ias_grok.ts

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = "https://ovskepqggmxlfckxqgbr.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92c2tlcHFnZ214bGZja3hxZ2JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDgyNDg1NSwiZXhwIjoyMDc2NDAwODU1fQ.ORCz0Wm7OMfmWWGjHw2LcOz_vZ6AJRAzrqjNgqCKMNc"; // Service role key

const supabase = createClient(supabaseUrl, supabaseKey);

async function inserirIAs() {
    console.log("🚀 Iniciando inserção das 3 IAs Grok...\n");

    // Deletar IAs antigas do Grok (opcional)
    const { error: deleteError } = await supabase
        .from("GlobalAiConnection")
        .delete()
        .eq("provider", "GROQ");

    if (deleteError && deleteError.code !== "PGRST116") {
        console.error("❌ Erro ao limpar IAs antigas:", deleteError);
    } else {
        console.log("✅ IAs antigas do Grok removidas\n");
    }

    // Inserir as 3 IAs
    const ias = [
        {
            name: "Grok Thinker - Llama 3.3 70B",
            provider: "GROQ",
            apiKey: "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",
            baseUrl: "https://api.groq.com/openai/v1",
            model: "llama-3.3-70b-versatile",
            maxTokens: 4096,
            temperature: 0.5,
            aiRole: "REASONING",
            isActive: true,
        },
        {
            name: "Grok Critic - Llama 3.1 8B",
            provider: "GROQ",
            apiKey: "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",
            baseUrl: "https://api.groq.com/openai/v1",
            model: "llama-3.1-8b-instant",
            maxTokens: 2048,
            temperature: 0.3,
            aiRole: "GENERAL",
            isActive: true,
        },
        {
            name: "Grok Executor - Llama 3.3 70B",
            provider: "GROQ",
            apiKey: "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",
            baseUrl: "https://api.groq.com/openai/v1",
            model: "llama-3.3-70b-versatile",
            maxTokens: 4096,
            temperature: 0.7,
            aiRole: "EXECUTOR",
            isActive: true,
        },
    ];

    for (const ia of ias) {
        const { data, error } = await supabase
            .from("GlobalAiConnection")
            .insert(ia)
            .select();

        if (error) {
            console.error(`❌ Erro ao inserir ${ia.name}:`, error);
        } else {
            console.log(`✅ Inserido: ${ia.name}`);
            console.log(`   - Modelo: ${ia.model}`);
            console.log(`   - Role: ${ia.aiRole}`);
            console.log(`   - Temp: ${ia.temperature}\n`);
        }
    }

    // Verificar
    const { data: inserted, error: fetchError } = await supabase
        .from("GlobalAiConnection")
        .select("name, model, aiRole, isActive")
        .eq("provider", "GROQ");

    if (fetchError) {
        console.error("❌ Erro ao verificar:", fetchError);
    } else {
        console.log("\n🎉 Verificação - IAs inseridas:");
        console.table(inserted);
    }
}

inserirIAs();
