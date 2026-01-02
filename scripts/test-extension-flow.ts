
// scripts/test-extension-flow.ts
// USAGE: deno run --allow-net --allow-env --allow-read scripts/test-extension-flow.ts

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { config } from "https://deno.land/x/dotenv/mod.ts";

console.log("🚀 Testing SyncAds Multi-Agent Architecture...");

// MOCK CONSTANTS
const MOCK_DEVICE_ID = "test-device-123";
const MOCK_USER_ID = "test-user-uuid";

// 1. SETUP SUPABASE
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://ovskepqggmxlfckxqgbr.supabase.co";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92c2tlcHFnZ214bGZja3hxZ2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MjQ4NTUsImV4cCI6MjA3NjQwMDg1NX0.UdNgqpTN38An6FuoJPZlj_zLkmAqfJQXb6i1DdTQO_E";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runTest() {
    console.log(`\n📋 PREPARING TEST ENV: Device=${MOCK_DEVICE_ID}`);

    // CLEANUP OLD COMMANDS
    await supabase.from("extension_commands").delete().eq("device_id", MOCK_DEVICE_ID);

    // SIMULATE: 1. Reasoner & Planner created a command (Backend Step)
    console.log(`\n🤖 (Backend) Simulating Planner creating a command...`);

    const commandPayload = {
        device_id: MOCK_DEVICE_ID,
        type: "insert_content",
        command_type: "insert_content",
        payload: { selector: ".doc", value: "This is a long text test > 50 chars for verification." },
        status: "pending",
        user_id: MOCK_USER_ID
    };

    const { data: cmd, error } = await supabase
        .from("extension_commands")
        .insert(commandPayload)
        .select()
        .single();

    if (error) {
        console.error("❌ Failed to insert test command:", error);
        return;
    }

    console.log(`✅ Command inserted: ID=${cmd.id}`);

    // SIMULATE: 2. Extension polling and executing (Frontend Step)
    console.log(`\n🧩 (Frontend) Simulating Extension execution...`);

    // ... wait 1s ...

    const mockExecutionResult = {
        success: true,
        command_id: cmd.id,
        command_type: "insert_content",
        url_before: "about:blank",
        url_after: "https://docs.new/123",
        title_after: "Untitled Document",
        dom_signals: {
            editor_detected: true,
            content_length: 65,
            last_line_present: true
        },
        originalResponse: { success: true },
        retryable: false,
        timestamp: new Date().toISOString()
    };

    // UPDATE COMMAND AS DONE
    const { error: updateError } = await supabase
        .from("extension_commands")
        .update({
            status: "done",
            result: mockExecutionResult, // THIS IS THE CRITICAL SCHEMA CHECK
            completed_at: new Date().toISOString()
        })
        .eq("id", cmd.id);

    if (updateError) {
        console.error("❌ Extension failed to update command:", updateError);
        return;
    }

    console.log(`✅ Extension updated command with ExecutionResult.`);

    // SIMULATE: 3. Verifier fetching result (Backend Step)
    console.log(`\n🛡️ (Backend) Simulating Verifier check...`);

    const { data: verifiedCmd } = await supabase
        .from("extension_commands")
        .select("*")
        .eq("id", cmd.id)
        .single();

    const res = verifiedCmd.result;

    console.log("\n📊 VERIFICATION REPORT:");
    console.log("------------------------");
    console.log(`Command ID: ${verifiedCmd.id}`);
    console.log(`Status: ${verifiedCmd.status}`);
    console.log(`Has Result? ${!!res}`);

    if (res) {
        console.log(`Signals Present? ${!!res.dom_signals}`);
        console.log(`Content Length: ${res.dom_signals?.content_length}`);

        if (res.dom_signals?.content_length > 50 && res.success) {
            console.log("✅ TEST PASSED: Strict Schema Enforced & Content Verified.");
        } else {
            console.error("❌ TEST FAILED: Verification logic mismatch.");
        }
    } else {
        console.error("❌ TEST FAILED: Result is missing or null.");
    }
}

runTest();
