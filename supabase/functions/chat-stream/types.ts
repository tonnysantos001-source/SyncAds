
import { DomSignalsReport } from "./dom_signals.ts";

export interface ExecutionResult {
    success: boolean;       // Computed from status === 'SUCCESS'
    status: "SUCCESS" | "FAILED" | "RETRY" | "BLOCKED";
    verified: boolean;
    command_id: string;
    command_type: string;
    url_before: string;
    url_after: string;
    title_after: string;
    dom_signals: DomSignalsReport;
    reason?: string;
    originalResponse?: any;
    retryable?: boolean;
    timestamp?: string;
}

export interface PlannerCommand {
    type: "navigate" | "wait" | "click" | "type" | "fill_input" | "scroll" | "insert_content" | "insert_via_api" | "scan_page";
    payload: any;
}

export interface PlannerOutput {
    device_id?: string;
    message: string;
    commands: PlannerCommand[];
}

export interface ReasonerOutput {
    intent: string;
    strategy_analysis: string;
    requires_long_text: boolean;
    suggested_action: string;
    target_url?: string;
    success_criteria?: string[]; // What Verifier should look for
    action_required: boolean;   // Gate: true if needs browser, false if chat only
    direct_response?: string;   // Chat response if action_required is false
}

export interface VerifierOutput {
    status: "SUCCESS" | "RETRY" | "PARTIAL_SUCCESS" | "FAILURE" | "BLOCKED";
    reason: string;
    final_message_to_user: string;
    new_strategy_hint?: string;
    verification_score?: number; // 0-100 confidence
}
