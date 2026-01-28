// Test Mistral API
const MISTRAL_API_KEY = "gM5gwFlJGX2CG62Wu9nNpmHqTwLF5EPj";
const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";

async function testMistral() {
    console.log("🔮 Testing Mistral API...\n");

    try {
        const response = await fetch(MISTRAL_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${MISTRAL_API_KEY}`,
            },
            body: JSON.stringify({
                model: "mistral-medium-latest",
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful assistant. Respond ONLY with valid JSON."
                    },
                    {
                        role: "user",
                        content: "Create a simple JSON object with fields: title (string), commands (array with one command object containing 'action' and 'content' fields)"
                    }
                ],
                response_format: { type: "json_object" },
                temperature: 0.1,
                max_tokens: 500
            }),
        });

        console.log("Status:", response.status, response.statusText);

        if (!response.ok) {
            const error = await response.text();
            console.error("❌ API Error:", error);
            process.exit(1);
        }

        const data = await response.json();
        console.log("\n✅ Response received!");
        console.log("\nRaw response:");
        console.log(JSON.stringify(data, null, 2));

        // Try parsing the message content as JSON
        const messageContent = data.choices[0].message.content;
        console.log("\n📋 Message content:");
        console.log(messageContent);

        try {
            const parsedContent = JSON.parse(messageContent);
            console.log("\n✅ JSON parsing SUCCESS!");
            console.log("Parsed object:", parsedContent);
        } catch (e) {
            console.error("\n❌ JSON parsing FAILED:", e.message);
        }

    } catch (error) {
        console.error("❌ Test failed:", error.message);
        process.exit(1);
    }
}

testMistral();
