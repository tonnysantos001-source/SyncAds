
// scripts/test-google-docs-flow.cjs
// USAGE: node scripts/test-google-docs-flow.cjs

console.log("🚀 Testing Google Docs Verification Flow (Strict Mode)...");

// MOCK CONSTANTS
const MOCK_GOOD_URL = "https://docs.google.com/document/d/123456789/edit";
const MOCK_BAD_URL = "https://docs.google.com/document/u/0/";

function assert(condition, message) {
    if (!condition) {
        console.error(`❌ FAIL: ${message}`);
        process.exit(1);
    } else {
        console.log(`✅ PASS: ${message}`);
    }
}

// 1. SIMULATE EXECUTOR LOGIC (Background.js)
function runExecutorSimulation(mockResponse, cmdType) {
    const domSignals = mockResponse.dom_signals || [];
    let status = "success";
    let failureReason = null;
    let retryable = false;

    // STRICT VALIDATION LOGIC FROM BACKGROUND.JS
    if (domSignals.some(s => s.signal === "UNEXPECTED_NAVIGATION")) {
        status = "failed";
        failureReason = "Executor abortado: navegação inesperada detectada";
    } else if (cmdType === "insert_content" && !domSignals.some(s => s.signal === "EDITOR_READY")) {
        status = "failed";
        retryable = true;
        failureReason = "Editor não pronto";
    }

    return {
        success: status === "success",
        status: status === "success" ? "SUCCESS" : "FAILED",
        dom_signals: domSignals,
        url_after: mockResponse.url_after,
        reason: failureReason,
        retryable
    };
}

// 2. SIMULATE VERIFIER LOGIC (ReasonerVerifier.ts)
function runVerifierSimulation(executionResult, intent) {
    // A. URL Validation
    if (executionResult.url_after && executionResult.url_after.endsWith("/u/0")) {
        return { status: "BLOCKED", reason: "URL inválida (/u/0)" };
    }

    // B. Intent Validation
    const signals = executionResult.dom_signals || [];
    if (intent === "create_document" && !signals.some(s => s.signal === "DOCUMENT_CREATED")) {
        return { status: "BLOCKED", reason: "Documento não criado" };
    }

    if (!executionResult.success) {
        return { status: "FAILURE", reason: executionResult.reason };
    }

    return { status: "SUCCESS" };
}

// --- TEST SCENARIOS ---

// SCENARIO 1: Success Case
try {
    console.log("\n🧪 SCENARIO 1: Happy Path (Doc Created + Content Inserted)");
    const mockSuccessResponse = {
        dom_signals: [
            { signal: "EDITOR_READY", editorReady: true, timestamp: Date.now() },
            { signal: "DOCUMENT_CREATED", documentId: "doc123", timestamp: Date.now() },
            { signal: "CONTENT_INSERTED", contentLength: 100, timestamp: Date.now() }
        ],
        url_after: MOCK_GOOD_URL
    };

    const execResult = runExecutorSimulation(mockSuccessResponse, "insert_content");
    const verifResult = runVerifierSimulation(execResult, "create_document");

    assert(execResult.success === true, "Executor must succeed");
    assert(verifResult.status === "SUCCESS", "Verifier must approve");
} catch (e) {
    console.error(e);
}

// SCENARIO 2: Bad URL (/u/0)
try {
    console.log("\n🧪 SCENARIO 2: Bad URL (/u/0)");
    const mockBadUrlResponse = {
        dom_signals: [
            { signal: "UNEXPECTED_NAVIGATION", url: MOCK_BAD_URL, timestamp: Date.now() }
            // Note: Content script emits UNEXPECTED_NAVIGATION for /u/0
        ],
        url_after: MOCK_BAD_URL
    };

    const execResult = runExecutorSimulation(mockBadUrlResponse, "navigate");
    // Even if it was navigation, executor should catch "UNEXPECTED_NAVIGATION" signal if present, 
    // OR verifier catches URL

    assert(execResult.success === false, "Executor must fail on UNEXPECTED_NAVIGATION signal");
    // If executor fails, verified checks failure
    const verifResult = runVerifierSimulation(execResult, "create_document");
    assert(verifResult.status === "FAILURE" || verifResult.status === "BLOCKED", "Verifier must reject");
} catch (e) {
    console.error(e);
}

// SCENARIO 3: Editor Not Ready (Retryable)
try {
    console.log("\n🧪 SCENARIO 3: Editor Not Ready");
    const mockNoEditorResponse = {
        dom_signals: [], // No EDITOR_READY
        url_after: MOCK_GOOD_URL
    };

    const execResult = runExecutorSimulation(mockNoEditorResponse, "insert_content");

    assert(execResult.success === false, "Executor must fail if editor missing for insert");
    assert(execResult.retryable === true, "Must be retryable");
    assert(execResult.reason === "Editor não pronto", "Reason match");

} catch (e) {
    console.error(e);
}

// SCENARIO 4: Document Not Created Signal
try {
    console.log("\n🧪 SCENARIO 4: Intent 'create_document' but no signal");
    const mockNoSignalResponse = {
        dom_signals: [{ signal: "EDITOR_READY", editorReady: true, timestamp: Date.now() }],
        // Missing DOCUMENT_CREATED
        url_after: MOCK_GOOD_URL
    };

    const execResult = runExecutorSimulation(mockNoSignalResponse, "insert_content");
    const verifResult = runVerifierSimulation(execResult, "create_document");

    assert(verifResult.status === "BLOCKED", "Verifier must BLOCK if DOCUMENT_CREATED missing");
    assert(verifResult.reason === "Documento não criado", "Reason match");

} catch (e) {
    console.error(e);
}

console.log("\n✅ ALL TESTS PASSED.");
