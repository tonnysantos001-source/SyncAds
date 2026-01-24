// Fetch latest Edge Function logs from Supabase API
const SUPABASE_URL = "https://ovskepqggmxlfckxqgbr.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92c2tlcHFnZ214bGZja3hxZ2JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDgyNDg1NSwiZXhwIjoyMDc2NDAwODU1fQ.eZHK4OlfKTChZ9BqocoJ1NS6UsPqaFfHE6_1e73ROok";

const logTypesToCheck = [
    { name: "Edge Functions", path: "/platform/logs/edge-logs", service: "edge-runtime" },
    { name: "Postgres", path: "/platform/logs/postgres-logs", service: "postgres" }
];

async function fetchEdgeLogs() {
    console.log("🔍 FETCHING SUPABASE EDGE FUNCTION LOGS\n");
    console.log("=".repeat(70));

    // Try to fetch via Supabase Management API
    const projectRef = "ovskepqggmxlfckxqgbr";

    // Edge function logs endpoint
    const logsUrl = `https://api.supabase.com/v1/projects/${projectRef}/analytics/endpoints/logs.all`;

    console.log("\n📡 Attempting to fetch from Supabase API...");
    console.log(`   URL: ${logsUrl}`);

    try {
        // First try to get recent error logs
        const response = await fetch(logsUrl, {
            headers: {
                "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
                "Content-Type": "application/json"
            }
        });

        console.log(`   Status: ${response.status} ${response.statusText}\n`);

        if (!response.ok) {
            console.log("❌ API endpoint not accessible with service_role key");
            console.log("   Response:", await response.text());
        } else {
            const logs = await response.json();
            console.log("✅ Logs retrieved:");
            console.log(JSON.stringify(logs, null, 2));
        }
    } catch (error) {
        console.error("💥 Error fetching logs:", error.message);
    }

    // Alternative: Parse recent logs from error messages
    console.log("\n" + "=".repeat(70));
    console.log("\n📋 MANUAL STEPS TO GET LOGS:\n");
    console.log("1. Go to: https://supabase.com/dashboard/project/ovskepqggmxlfckxqgbr/logs/edge-functions");
    console.log("2. Click on the most recent 500 error");
    console.log("3. Look for these log lines:");
    console.log("   - 📥 [START] Request received");
    console.log("   - 📦 [DATA] Parsed");
    console.log("   - 👤 [AUTH] Getting user");
    console.log("   - 🔑 [KEY] Checking for API key");
    console.log("   - ❌ [FATAL ERROR] Handler error");
    console.log("\n4. Copy the FULL error message + stack trace");
    console.log("5. Paste it here or send screenshot\n");
}

fetchEdgeLogs();
