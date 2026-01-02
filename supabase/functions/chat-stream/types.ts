export interface ExecutionResult {
    success: boolean;
    command_id: string;
    command_type: string;
    url_before: string;
    url_after: string;
    title_after: string;
    dom_signals: {
        editor_detected?: boolean;
        content_length?: number;
        last_line_present?: boolean;
        error_message?: string;
    };
    errors?: string[];
    retryable: boolean;
}

export interface PlannerCommand {
    type: "navigate" | "wait" | "click" | "type" | "fill_input" | "scroll" | "insert_content" | "scan_page";
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
}

export interface VerifierOutput {
    status: "SUCCESS" | "RETRY" | "PARTIAL_SUCCESS" | "FAILURE";
    reason: string;
    final_message_to_user?: string; // Only if SUCCESS or FAILURE
    new_strategy_hint?: string;     // If RETRY
}
