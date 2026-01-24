// Comprehensive test: Fetch keys from DB and test each one with Groq API
const SUPABASE_URL = "https://ovskepqggmxlfckxqgbr.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92c2tlcHFnZ214bGZja3hxZ2JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDgyNDg1NSwiZXhwIjoyMDc2NDAwODU1fQ.eZHK4OlfKTChZ9BqocoJ1NS6UsPqaFfHE6_1e73ROok";

async function comprehensiveTest() {
    console.log("🔍 COMPREHENSIVE DIAGNOSTIC TEST\n");
    console.log("=".repeat(60));

    // 1. Fetch all GROQ keys
    console.log("\n1️⃣ FETCHING GROQ KEYS FROM DATABASE...\n");
    const response = await fetch(`${SUPABASE_URL}/rest/v1/GlobalAiConnection?provider=eq.GROQ&isActive=eq.true&select=*`, {
        headers: {
            "apikey": SERVICE_ROLE_KEY,
            "Authorization": `Bearer ${SERVICE_ROLE_KEY}`
        }
    });

    const keys = await response.json();
    console.log(`   ✅ Found ${keys.length} active Groq keys\n`);

    // 2. Test EACH key individually
    console.log("2️⃣ TESTING EACH KEY WITH GROQ API...\n");

    const testResults = [];

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        console.log(`\n--- Test ${i + 1}/${keys.length}: ${key.name} ---`);
        console.log(`   Model: ${key.model}`);
        console.log(`   Key: ${key.apiKey.substring(0, 25)}...`);

        try {
            const startTime = Date.now();
            const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${key.apiKey}`
                },
                body: JSON.stringify({
                    model: key.model,
                    messages: [
                        { role: "system", content: "You are a test assistant." },
                        { role: "user", content: "Respond with just: TEST OK" }
                    ],
                    max_tokens: 10,
                    temperature: 0.1
                })
            });

            const endTime = Date.now();
            const responseTime = endTime - startTime;

            console.log(`   Status: ${groqResponse.status} ${groqResponse.statusText}`);
            console.log(`   Response Time: ${responseTime}ms`);

            if (!groqResponse.ok) {
                const errorText = await groqResponse.text();
                console.error(`   ❌ FAILED!`);
                console.error(`   Error: ${errorText.substring(0, 300)}`);

                testResults.push({
                    name: key.name,
                    status: "FAILED",
                    httpStatus: groqResponse.status,
                    error: errorText.substring(0, 200)
                });
            } else {
                const result = await groqResponse.json();
                const content = result.choices[0].message.content;
                console.log(`   ✅ SUCCESS!`);
                console.log(`   Response: "${content}"`);
                console.log(`   Tokens: ${result.usage.total_tokens}`);

                testResults.push({
                    name: key.name,
                    status: "SUCCESS",
                    httpStatus: 200,
                    responseTime,
                    tokens: result.usage.total_tokens
                });
            }
        } catch (error) {
            console.error(`   💥 EXCEPTION: ${error.message}`);
            testResults.push({
                name: key.name,
                status: "EXCEPTION",
                error: error.message
            });
        }
    }

    // 3. Summary
    console.log("\n" + "=".repeat(60));
    console.log("3️⃣ TEST SUMMARY\n");

    const successCount = testResults.filter(r => r.status === "SUCCESS").length;
    const failCount = testResults.filter(r => r.status !== "SUCCESS").length;

    console.log(`   ✅ Successful: ${successCount}/${keys.length}`);
    console.log(`   ❌ Failed: ${failCount}/${keys.length}\n`);

    if (failCount > 0) {
        console.log("   FAILED KEYS:");
        testResults.filter(r => r.status !== "SUCCESS").forEach(r => {
            console.log(`      - ${r.name}: ${r.error || r.httpStatus}`);
        });
    }

    console.log("\n" + "=".repeat(60));

    if (successCount > 0) {
        console.log("\n✅ AT LEAST ONE KEY WORKS!");
        console.log("   The issue is NOT with Groq API keys.");
        console.log("   Problem must be in Edge Function code or environment.");
    } else {
        console.log("\n❌ ALL KEYS FAILED!");
        console.log("   Keys may be expired, invalid, or rate-limited.");
    }
}

comprehensiveTest().catch(err => {
    console.error("\n💥 FATAL ERROR:", err);
    process.exit(1);
});
