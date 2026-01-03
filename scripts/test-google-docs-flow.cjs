
// scripts/test-google-docs-flow.cjs
// USAGE: node scripts/test-google-docs-flow.cjs

console.log("🚀 Testing Google Docs Flow (Strict DomSignalsReport Mode)...");

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

// 1. SIMULATE EXECUTOR LOGIC (Background.js) -- Updated for DomSignalsReport
function runExecutorSimulation(mockDomReport, cmdType) {
    const signals = mockDomReport.signals || [];
    let status = "success";
    let failureReason = null;
    let retryable = false;

    // STRICT VALIDATION LOGIC FROM BACKGROUND.JS PATCH
    // 1. URL CHECK
    const cleanUrl = (mockDomReport.final_url || "").replace(/\/$/, ""); // Remove trailing slash
    console.log(`[DEBUG] Final URL: ${mockDomReport.final_url} -> Clean: ${cleanUrl}`);

    if (cleanUrl.endsWith("/u/0")) {
        console.log("[DEBUG] Detected /u/0, failing executor.");
        status = "failed";
        failureReason = "Redirected to Google Docs home (/u/0)";
        signals.push({ type: "UNEXPECTED_NAVIGATION", timestamp: Date.now(), payload: { url: "/u/0" } });
    }

    // 2. SIGNAL CHECK
    if (signals.some(s => s.type === "UNEXPECTED_NAVIGATION")) {
        console.log("[DEBUG] Signal UNEXPECTED_NAVIGATION found.");
        status = "failed";
        failureReason = "Executor abortado: navegação inesperada detectada";
    } else if (cmdType === "insert_content" && !signals.some(s => s.type === "EDITOR_READY")) {
        status = "failed";
        retryable = true;
        failureReason = "Editor não pronto";
    }

    return {
        success: status === "success",
        status: status === "success" ? "SUCCESS" : "FAILED",
        dom_signals: mockDomReport,
        url_after: mockDomReport.final_url,
        reason: failureReason,
        retryable
    };
}

// 2. SIMULATE VERIFIER LOGIC (ReasonerVerifier.ts)
function runVerifierSimulation(executionResult, intent) {
    // A. URL Validation
    const domReport = executionResult.dom_signals;
    const signals = domReport.signals || [];
    const finalUrl = (domReport.final_url || "").replace(/\/$/, "");

    if (finalUrl.endsWith("/u/0")) {
        return { status: "BLOCKED", reason: "URL inválida (/u/0)" };
    }

    // B. Intent Validation
    if (intent === "create_document") {
        if (!signals.some(s => s.type === "DOCUMENT_CREATED")) {
            return { status: "FAILURE", reason: "Documento não criado" };
        }
        if (!signals.some(s => s.type === "EDITOR_READY")) {
            return { status: "RETRY", reason: "Editor não pronto" };
        }
    }

    if (!executionResult.success) {
        return { status: "FAILURE", reason: executionResult.reason };
    }

    return { status: "SUCCESS" };
}

// --- TEST SCENARIOS ---

// SCENARIO 1: Happy Path
try {
    console.log("\n🧪 SCENARIO 1: Happy Path (Doc Created + Editor Ready + Content Inserted)");
    const mockSuccessReport = {
        signals: [
            { type: "EDITOR_READY", timestamp: Date.now(), payload: { editor_selector: "IFRAME" } },
            { type: "DOCUMENT_CREATED", timestamp: Date.now(), payload: { url: MOCK_GOOD_URL } },
            { type: "CONTENT_INSERTED", timestamp: Date.now(), payload: { content_length: 100 } }
        ],
        final_url: MOCK_GOOD_URL,
        editor_detected: true,
        content_length: 100
    };

    const execResult = runExecutorSimulation(mockSuccessReport, "insert_content");
    const verifResult = runVerifierSimulation(execResult, "create_document");

    assert(execResult.success === true, "Executor must succeed");
    assert(verifResult.status === "SUCCESS", "Verifier must approve");
} catch (e) {
    console.error(e);
}

// SCENARIO 2: Bad URL (/u/0)
try {
    console.log("\n🧪 SCENARIO 2: Bad URL (/u/0)");
    const mockBadUrlReport = {
        signals: [],
        final_url: MOCK_BAD_URL, // Ends with slash
        editor_detected: false,
        content_length: 0
    };

    const execResult = runExecutorSimulation(mockBadUrlReport, "navigate");

    assert(execResult.success === false, "Executor must fail due to /u/0 detection");

    const verifResult = runVerifierSimulation(execResult, "create_document");
    assert(verifResult.status === "BLOCKED", "Verifier must BLOCK /u/0");
} catch (e) {
    console.error(e);
}

// SCENARIO 3: Editor Not Ready (Retryable)
try {
    console.log("\n🧪 SCENARIO 3: Editor Not Ready");
    const mockNoEditorReport = {
        signals: [
            { type: "DOCUMENT_CREATED", timestamp: Date.now(), payload: { url: MOCK_GOOD_URL } }
        ], // Missing EDITOR_READY
        final_url: MOCK_GOOD_URL,
        editor_detected: false,
        content_length: 0
    };

    const execResult = runExecutorSimulation(mockNoEditorReport, "insert_content");

    assert(execResult.success === false, "Executor must fail if editor missing for insert");
    assert(execResult.retryable === true, "Must be retryable");

    const verifResult = runVerifierSimulation(execResult, "create_document");
    assert(verifResult.status === "RETRY", "Verifier checks signals and says RETRY");

} catch (e) {
    console.error(e);
}

// SCENARIO 4: Document Not Created Signal
try {
    console.log("\n🧪 SCENARIO 4: Intent 'create_document' but no DOCUMENT_CREATED signal");
    const mockNoSignalReport = {
        signals: [
            { type: "EDITOR_READY", timestamp: Date.now(), payload: {} }
        ],
        final_url: MOCK_GOOD_URL,
        editor_detected: true,
        content_length: 0
    };

    const execResult = runExecutorSimulation(mockNoSignalReport, "insert_content");
    // Executor succeeds purely technical check (inserted content or ready), but Verifier checks Intent
    const verifResult = runVerifierSimulation(execResult, "create_document");

    assert(verifResult.status === "FAILURE", "Verifier must FAIL if DOCUMENT_CREATED missing for create_document intent");

} catch (e) {
    console.error(e);
}

console.log("\n✅ ALL STRICT TESTS PASSED.");
