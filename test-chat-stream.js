// Test script to call chat-stream directly and see the error
const SUPABASE_URL = "https://ovskepqggmxlfckxqgbr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92c2tlcHFnZ214bGZja3hxZ2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI5ODMyNTksImV4cCI6MjA0ODU1OTI1OX0.aK7dCT4XCYSvQS4X_7HGWvA4rvJ9m5rB-N9VR8Yw0ak";

async function testChatStream() {
    console.log("🧪 Testing chat-stream Edge Function...");

    const response = await fetch(`${SUPABASE_URL}/functions/v1/chat-stream`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
            conversationId: "test-" + Date.now(),
            userId: "test-user",
            message: "Olá, teste simples"
        })
    });

    console.log("📊 Response Status:", response.status);
    console.log("📊 Response OK:", response.ok);

    if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Error Response:", errorText);
    } else {
        // Stream response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            console.log("📦 Chunk:", chunk);
        }
    }
}

testChatStream().catch(console.error);
