// Insert Groq API key into GlobalAiConnection
const SUPABASE_URL = "https://ovskepqggmxlfckxqgbr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92c2tlcHFnZ214bGZja3hxZ2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MjQ4NTUsImV4cCI6MjA3NjQwMDg1NX0.UdNgqpTN38An6FuoJPZlj_zLkmAqfJQXb6i1DdTQO_E";

async function insertKey() {
    console.log("📝 Inserting Groq API key into GlobalAiConnection...");

    const keyData = {
        name: "Groq Chat-Stream - Llama 3.3 70B",
        provider: "GROQ",
        model: "llama-3.3-70b-versatile",
        apiKey: "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",
        baseUrl: "https://api.groq.com/openai/v1",
        maxTokens: 4096,
        temperature: "0.70",
        isActive: true,
        aiRole: "EXECUTOR"
    };

    const response = await fetch(`${SUPABASE_URL}/rest/v1/GlobalAiConnection`, {
        method: "POST",
        headers: {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        },
        body: JSON.stringify(keyData)
    });

    if (!response.ok) {
        const error = await response.text();
        console.error("❌ Failed to insert:", response.status, error);
        process.exit(1);
    }

    const result = await response.json();
    console.log("✅ Key inserted successfully!");
    console.log("ID:", result[0]?.id);
    console.log("Name:", result[0]?.name);
    console.log("\n🎉 Now try the extension again!");
}

insertKey().catch(console.error);
