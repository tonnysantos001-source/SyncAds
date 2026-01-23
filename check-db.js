// Check GlobalAiConnection table contents
const SUPABASE_URL = "https://ovskepqggmxlfckxqgbr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92c2tlcHFnZ214bGZja3hxZ2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MjQ4NTUsImV4cCI6MjA3NjQwMDg1NX0.UdNgqpTN38An6FuoJPZlj_zLkmAqfJQXb6i1DdTQO_E";

async function checkDatabase() {
    console.log("🔍 Checking GlobalAiConnection table...\n");

    // Get ALL rows
    const response = await fetch(`${SUPABASE_URL}/rest/v1/GlobalAiConnection?select=*`, {
        headers: {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
        }
    });

    if (!response.ok) {
        console.error("❌ Failed:", response.status, await response.text());
        process.exit(1);
    }

    const rows = await response.json();
    console.log(`Found ${rows.length} total rows:\n`);

    rows.forEach((row, i) => {
        console.log(`\n--- Row ${i + 1} ---`);
        console.log(`ID: ${row.id}`);
        console.log(`Name: ${row.name}`);
        console.log(`Provider: "${row.provider}" (type: ${typeof row.provider})`);
        console.log(`Model: ${row.model}`);
        console.log(`IsActive: ${row.isActive}`);
        console.log(`API Key: ${row.apiKey?.substring(0, 20)}...`);
        console.log(`AI Role: ${row.aiRole}`);
    });

    // Try different queries
    console.log("\n\n🧪 Testing different queries:\n");

    const tests = [
        { desc: "provider=eq.GROQ", query: "?provider=eq.GROQ&select=count" },
        { desc: 'provider=eq."GROQ"', query: '?provider=eq."GROQ"&select=count' },
        { desc: "isActive=eq.true", query: "?isActive=eq.true&select=count" },
        { desc: "provider like GROQ", query: "?provider=like.*GROQ*&select=count" }
    ];

    for (const test of tests) {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/GlobalAiConnection${test.query}`, {
            headers: {
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
                "Prefer": "count=exact"
            }
        });
        const count = r.headers.get("content-range")?.split("/")[1] || "0";
        console.log(`   ${test.desc}: ${count} rows`);
    }
}

checkDatabase().catch(console.error);
