// MINIMAL TEST VERSION - index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

console.log("✅ Step 1: serve imported");

import { corsHeaders } from "../_utils/cors.ts";

console.log("✅ Step 2: corsHeaders imported");

serve(async (req) => {
    console.log("✅ Step 3: Handler called");

    if (req.method === "OPTIONS") {
        console.log("✅ Step 4: OPTIONS request");
        return new Response(null, { headers: corsHeaders });
    }

    try {
        console.log("✅ Step 5: Processing POST request");
        const body = await req.json();
        console.log("✅ Step 6: Body parsed:", body);

        return new Response(JSON.stringify({
            status: "ok",
            message: "Minimal test successful!",
            received: body
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error("❌ Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500
        });
    }
});

console.log("✅ Step 7: Server started");
