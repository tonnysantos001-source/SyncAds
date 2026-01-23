// Detailed test of chat-stream to see exact error
const SUPABASE_URL = "https://ovskepqggmxlfckxqgbr.supabase.co";

// Get from browser: document.cookie (JWT token from authenticated session)
const AUTH_TOKEN = process.argv[2]; // Pass as argument

if (!AUTH_TOKEN) {
    console.error("❌ Usage: node test-chat-detailed.js <AUTH_TOKEN>");
    console.error("   Get token from browser dev console: localStorage.getItem('sb-ovskepqggmxlfckxqgbr-auth-token')");
    process.exit(1);
}

async function testChatStream() {
    console.log("🧪 Testing chat-stream Edge Function...");
    console.log("🔑 Using token:", AUTH_TOKEN.substring(0, 50) + "...");

    const response = await fetch(`${SUPABASE_URL}/functions/v1/chat-stream`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${AUTH_TOKEN}`
        },
        body: JSON.stringify({
            conversationId: "test-" + Date.now(),
            message: "Olá, teste simples",
            deviceId: "test-device-" + Date.now()
        })
    });

    console.log("\n📊 Response Status:", response.status);
    console.log("📊 Response OK:", response.ok);
    console.log("📊 Status Text:", response.statusText);
    console.log("\n📋 Headers:");
    for (const [key, value] of response.headers.entries()) {
        console.log(`   ${key}: ${value}`);
    }

    if (!response.ok) {
        const errorText = await response.text();
        console.error("\n❌ Error Response Body:");
        console.error(errorText);

        try {
            const errorJson = JSON.parse(errorText);
            console.error("\n❌ Parsed Error:", JSON.stringify(errorJson, null, 2));
        } catch (e) {
            // Not JSON
        }
    } else {
        console.log("\n✅ SUCCESS! Streaming response:");
        // Stream response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(l => l.trim());

            for (const line of lines) {
                try {
                    const data = JSON.parse(line);
                    console.log(`📦 [${data.type}]:`, data.content);
                } catch (e) {
                    console.log("📦 RAW:", line);
                }
            }
        }
    }
}

testChatStream().catch(err => {
    console.error("\n💥 FATAL ERROR:", err.message);
    console.error(err.stack);
    process.exit(1);
});
