// ✅ PROFESSIONAL VERSION - Load Groq API keys from GlobalAiConnection
async function getGroqApiKey(supabase: any, role?: string): Promise<string> {
    console.log(`🔍 Loading Groq key for role: ${role || 'any'}`);

    const query = supabase
        .from("GlobalAiConnection")
        .select("apiKey, aiRole, name, model")
        .eq("provider", "GROQ")  // Uppercase
        .eq("isActive", true);

    // Filter by role if specified
    if (role) {
        query.eq("aiRole", role);
    }

    const { data, error } = await query.limit(1).single();

    if (error) {
        console.error("❌ Database error:", error.message);
        throw new Error(`Failed to load Groq key: ${error.message}`);
    }

    if (!data) {
        throw new Error(`No active Groq AI found for role: ${role || 'any'}`);
    }

    console.log(`✅ Using: ${data.name} (${data.aiRole}) - ${data.model}`);
    return data.apiKey;
}

// UPDATE CALLS (lines ~200 and ~260):

// Line ~200 - Thinker:
const groqApiKey = await getGroqApiKey(supabase, 'REASONING');

// Line ~260 - Executor:  
const executorResponse = await callGroq(groqApiKey, GROQ_EXECUTOR_MODEL, executorMessages, 0.7);
// Note: Reuse groqApiKey from Thinker, or get new one with:
// const execKey = await getGroqApiKey(supabase, 'EXECUTOR');
