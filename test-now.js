// Test chat-stream immediately and capture detailed error
const SUPABASE_URL = "https://ovskepqggmxlfckxqgbr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92c2tlcHFnZ214bGZja3hxZ2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MjQ4NTUsImV4cCI6MjA3NjQwMDg1NX0.UdNgqpTN38An6FuoJPZlj_zLkmAqfJQXb6i1DdTQO_E";

// Get auth token from user's localStorage
const AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsImtpZCI6ImZxN05qN3dadWxjdksrd0oiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL292c2tlcHFnZ214bGZja3hxZ2JyLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiIzNTc5MDYxZC1lMDUwLTQyZGUtYTExYy1jODVkMTAzOTUyMzMiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzY5MjE1MzcyLCJpYXQiOjE3NjkyMTE3NzIsImVtYWlsIjoiZGluaG9hbW9yaW1AZ21haWwuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbCI6ImRpbmhvYW1vcmltQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJzdWIiOiIzNTc5MDYxZC1lMDUwLTQyZGUtYTExYy1jODVkMTAzOTUyMzMifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc2OTIxMTc3Mn1dLCJzZXNzaW9uX2lkIjoiNWZjZjdiZWUtZjhhNS00NmE1LWFlOWMtNjdlY2FkZGJlYjU3IiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.DXy3Lw6RVsPkFCg5jVGVf-Pq3kbCNuNRxvYOWlX4uE0"; // From browser localStorage

async function testChatStreamNow() {
    console.log("🧪 TESTING CHAT-STREAM WITH ENHANCED LOGGING\n");

    const testPayload = {
        conversationId: "test-" + Date.now(),
        deviceId: "test-device-" + Date.now(),
        message: "Olá, teste rápido"
    };

    console.log("📤 Sending request...");
    console.log("   Payload:", JSON.stringify(testPayload, null, 2));

    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/chat-stream`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${AUTH_TOKEN}`
            },
            body: JSON.stringify(testPayload)
        });

        console.log("\n📊 Response Status:", response.status, response.statusText);
        console.log("📊 Headers:");
        for (const [key, value] of response.headers.entries()) {
            console.log(`   ${key}: ${value}`);
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error("\n❌ ERROR Response Body:");
            console.error(errorText);

            try {
                const errorJson = JSON.parse(errorText);
                console.error("\n❌ Parsed Error:");
                console.error(JSON.stringify(errorJson, null, 2));
            } catch (e) {
                // Not JSON
            }

            console.log("\n🔍 CHECK SUPABASE LOGS NOW:");
            console.log("   https://supabase.com/dashboard/project/ovskepqggmxlfckxqgbr/logs/edge-functions");
            console.log("   Look for ❌ [FATAL ERROR] with stack trace");
        } else {
            console.log("\n✅ SUCCESS! Streaming response:");
            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            let chunks = [];
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                chunks.push(chunk);
                console.log("📦", chunk.trim());
            }
        }
    } catch (error) {
        console.error("\n💥 EXCEPTION:", error.message);
        console.error(error.stack);
    }
}

testChatStreamNow();
