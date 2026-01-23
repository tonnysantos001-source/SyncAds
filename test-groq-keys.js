// Test Groq API with keys from database
const SUPABASE_URL = "https://ovskepqggmxlfckxqgbr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92c2tlcHFnZ214bGZja3hxZ2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MjQ4NTUsImV4cCI6MjA3NjQwMDg1NX0.UdNgqpTN38An6FuoJPZlj_zLkmAqfJQXb6i1DdTQO_E";

async function testGroqKeys() {
    console.log("🔍 [1] Fetching Groq API keys from database...");

    // Fetch keys from database
    const response = await fetch(`${SUPABASE_URL}/rest/v1/GlobalAiConnection?provider=eq.GROQ&isActive=eq.true&select=name,apiKey,model`, {
        headers: {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
        }
    });

    if (!response.ok) {
        console.error("❌ Failed to fetch keys:", response.status, await response.text());
        process.exit(1);
    }

    const keys = await response.json();
    console.log(`✅ Found ${keys.length} API keys:\n`);

    keys.forEach((k, i) => {
        console.log(`   ${i + 1}. ${k.name} (${k.model})`);
        console.log(`      Key: ${k.apiKey.substring(0, 20)}...`);
    });

    // Test each key
    console.log("\n🧪 [2] Testing each key with Groq API...\n");

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        console.log(`\n--- Testing Key ${i + 1}: ${key.name} ---`);

        try {
            const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${key.apiKey}`
                },
                body: JSON.stringify({
                    model: key.model || "llama-3.3-70b-versatile",
                    messages: [
                        { role: "system", content: "You are a helpful assistant." },
                        { role: "user", content: "Say 'test successful' in Portuguese." }
                    ],
                    max_tokens: 50,
                    temperature: 0.7
                })
            });

            console.log(`   Status: ${groqResponse.status} ${groqResponse.statusText}`);

            if (!groqResponse.ok) {
                const errorText = await groqResponse.text();
                console.error(`   ❌ ERROR Response:`, errorText.substring(0, 500));
            } else {
                const result = await groqResponse.json();
                console.log(`   ✅ SUCCESS! Response:`, result.choices[0].message.content);
                console.log(`   Usage:`, result.usage);
            }
        } catch (error) {
            console.error(`   💥 EXCEPTION:`, error.message);
        }
    }
}

testGroqKeys().catch(err => {
    console.error("\n💥 FATAL ERROR:", err);
    process.exit(1);
});
