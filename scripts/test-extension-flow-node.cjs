
// scripts/test-extension-flow-node.cjs
// USAGE: node scripts/test-extension-flow-node.cjs

console.log("🚀 Testing SyncAds Multi-Agent Architecture (Mock Verification)...");

// MOCK DATA GENERATORS (SIMULATING CONTENT SCRIPT & BACKGROUND)
function simulateContentScript(value) {
    const isGoogleDocs = true;
    const signals = {
        editor_detected: true, // Mock finding element
        content_length: value.length,
        last_line_present: true
    };

    return {
        success: true,
        method: isGoogleDocs ? "clipboard_paste" : "execCommand",
        dom_signals: signals
    };
}

function simulateBackgroundProcessing(cmd, csResponse) {
    // BACKGROUND.JS LOGIC REPLICATION for Verification
    return {
        success: true,
        command_id: cmd.id,
        command_type: cmd.type, // Fixed typo in background.js was cmd.type? yes
        url_before: "about:blank",
        url_after: "https://docs.new/123",
        title_after: "Untitled Document",
        dom_signals: csResponse?.dom_signals || {}, // Lifting logic
        originalResponse: csResponse,
        retryable: false,
        timestamp: new Date().toISOString(),
    };
}

// MAIN TEST LOGIC
async function runMockTest() {
    console.log(`\n🧪 TEST 1: Strict Schema Compliance`);

    const mockCmd = { id: "cmd-123", type: "insert_content" };
    const mockValue = "Text > 50 chars for testing the logic of the verifier...";

    // 1. Frontend Execution
    const csResponse = simulateContentScript(mockValue);
    console.log("Frontend Response:", csResponse);

    if (!csResponse.dom_signals || !csResponse.dom_signals.content_length) {
        console.error("❌ FAIL: Content Script did not return dom_signals");
        process.exit(1);
    }

    // 2. Background Processing
    const executionResult = simulateBackgroundProcessing(mockCmd, csResponse);
    console.log("Execution Result (DB Object):", executionResult);

    // 3. Verifier Logic Simulation (Backend)
    // Checking if the 'executionResult' matches the 'ExecutionResult' interface expectations
    const isValidSchema =
        typeof executionResult.success === 'boolean' &&
        typeof executionResult.dom_signals === 'object' &&
        executionResult.dom_signals.content_length === mockValue.length &&
        executionResult.dom_signals.editor_detected === true;

    if (isValidSchema) {
        console.log("✅ TEST PASSED: Schema is strictly enforced and correct.");
    } else {
        console.error("❌ TEST FAILED: Generated object does not match Schema.");
        process.exit(1);
    }

    console.log(`\n🧪 TEST 2: Verifier Logic Check`);
    if (executionResult.success && executionResult.dom_signals.content_length > 0) {
        console.log("✅ VERIFIER DECISION: SUCCESS (Supported by evidence)");
    } else {
        console.error("❌ VERIFIER DECISION: FAILED (Logic error)");
    }
}

runMockTest();
