import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_utils/cors.ts";

// ==========================================
// AI SELF-IMPROVER
// IA melhora seu próprio system prompt
// ==========================================

interface ImproverRequest {
    action: "analyze" | "propose" | "apply" | "rollback" | "list";
    conversationId?: string;
    promptVersion?: string;
    improvements?: string[];
}

interface PromptImprovement {
    currentVersion: string;
    proposedVersion: string;
    changes: {
        section: string;
        before: string;
        after: string;
        reason: string;
    }[];
    expectedBenefit: string;
    riskLevel: "low" | "medium" | "high";
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get("Authorization")!;
        const token = authHeader.replace("Bearer ", "");

        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? "",
            { global: { headers: { Authorization: authHeader } } }
        );

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser(token);

        if (userError || !user) {
            throw new Error("Unauthorized");
        }

        const request: ImproverRequest = await req.json();
        console.log(`🧠 Self-Improver:`, request);

        let response;

        switch (request.action) {
            case "analyze":
                response = await analyzeConversations(supabase);
                break;

            case "propose":
                response = await proposeImprovements(request.improvements || [], supabase);
                break;

            case "apply":
                if (!request.promptVersion) {
                    throw new Error("promptVersion is required");
                }
                response = await applyPromptVersion(request.promptVersion, supabase);
                break;

            case "rollback":
                response = await rollbackToVersion(request.promptVersion || "latest", supabase);
                break;

            case "list":
                response = await listPromptVersions(supabase);
                break;

            default:
                throw new Error(`Unknown action: ${request.action}`);
        }

        return new Response(JSON.stringify(response), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (error: any) {
        console.error("❌ Self-Improver error:", error);

        return new Response(
            JSON.stringify({
                success: false,
                error: error.message,
            }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
});

// ==========================================
// ANALYZE CONVERSATIONS
// ==========================================

async function analyzeConversations(supabase: any): Promise<any> {
    console.log("📊 Analyzing recent conversations...");

    // Get recent conversations (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: messages, error } = await supabase
        .from("ChatMessage")
        .select("*")
        .gte("createdAt", sevenDaysAgo.toISOString())
        .order("createdAt", { ascending: false })
        .limit(500);

    if (error) throw error;

    // Analyze patterns
    const analysis = {
        totalMessages: messages.length,
        commonQuestions: extractCommonPatterns(messages, "user"),
        commonIssues: extractIssues(messages),
        misunderstoodRequests: extractMisunderstood(messages),
        suggestedImprovements: [],
    };

    // Generate improvement suggestions
    analysis.suggestedImprovements = generateSuggestions(analysis);

    return {
        success: true,
        analysis,
    };
}

function extractCommonPatterns(messages: any[], role: string): string[] {
    const patterns: Record<string, number> = {};

    messages
        .filter((m) => m.role === role)
        .forEach((m) => {
            const lower = m.content.toLowerCase();

            // Common question patterns
            if (lower.includes("como")) patterns["como_fazer"] = (patterns["como_fazer"] || 0) + 1;
            if (lower.includes("quais")) patterns["listar_items"] = (patterns["listar_items"] || 0) + 1;
            if (lower.includes("pode")) patterns["pode_fazer"] = (patterns["pode_fazer"] || 0) + 1;
            if (lower.includes("erro")) patterns["resolver_erro"] = (patterns["resolver_erro"] || 0) + 1;
        });

    return Object.entries(patterns)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([pattern]) => pattern);
}

function extractIssues(messages: any[]): string[] {
    const issues = [];

    // Look for error indicators
    const errorMessages = messages.filter(
        (m) =>
            m.role === "assistant" &&
            (m.content.includes("desculpe") ||
                m.content.includes("não consigo") ||
                m.content.includes("erro"))
    );

    if (errorMessages.length > 10) {
        issues.push("High error rate in responses");
    }

    return issues;
}

function extractMisunderstood(messages: any[]): string[] {
    const misunderstood = [];

    // Look for clarification requests
    const clarifications = messages.filter(
        (m) =>
            m.role === "assistant" &&
            (m.content.includes("não entendi") ||
                m.content.includes("pode explicar") ||
                m.content.includes("o que você quis dizer"))
    );

    if (clarifications.length > 5) {
        misunderstood.push("Frequent need for clarification");
    }

    return misunderstood;
}

function generateSuggestions(analysis: any): string[] {
    const suggestions = [];

    if (analysis.commonQuestions.includes("como_fazer")) {
        suggestions.push(
            "Add more 'how-to' examples in system prompt"
        );
    }

    if (analysis.commonQuestions.includes("pode_fazer")) {
        suggestions.push(
            "Improve capability discovery section"
        );
    }

    if (analysis.commonIssues.length > 0) {
        suggestions.push(
            "Add error handling guidelines"
        );
    }

    if (analysis.misunderstoodRequests.length > 0) {
        suggestions.push(
            "Improve natural language understanding examples"
        );
    }

    return suggestions;
}

// ==========================================
// PROPOSE IMPROVEMENTS
// ==========================================

async function proposeImprovements(
    improvements: string[],
    supabase: any
): Promise<any> {
    console.log("💡 Proposing prompt improvements...");

    // Get current active prompt
    const { data: currentPrompt, error } = await supabase
        .from("system_prompt_versions")
        .select("*")
        .eq("status", "ACTIVE")
        .single();

    if (error && error.code !== "PGRST116") throw error;

    const currentVersion = currentPrompt?.version || "1.0.0";
    const proposedVersion = incrementVersion(currentVersion);

    // Generate proposed changes
    const changes = improvements.map((improvement) => ({
        section: detectSection(improvement),
        before: "current content",
        after: generateImprovement(improvement),
        reason: improvement,
    }));

    // Calculate risk
    const riskLevel = changes.length > 5 ? "high" : changes.length > 2 ? "medium" : "low";

    const proposal: PromptImprovement = {
        currentVersion,
        proposedVersion,
        changes,
        expectedBenefit:
            "Improved response accuracy and user experience based on conversation analysis",
        riskLevel,
    };

    // Save as DRAFT
    await supabase.from("system_prompt_versions").insert({
        version: proposedVersion,
        content: generateNewPrompt(currentPrompt?.content || "", changes),
        changes: changes,
        status: "DRAFT",
        metadata: {
            improvements,
            generatedAt: new Date().toISOString(),
            basedOnVersion: currentVersion,
        },
    });

    return {
        success: true,
        proposal,
        message: `Proposta de versão ${proposedVersion} criada. Aguardando aprovação.`,
    };
}

function incrementVersion(version: string): string {
    const [major, minor, patch] = version.split(".").map(Number);
    return `${major}.${minor}.${patch + 1}`;
}

function detectSection(improvement: string): string {
    if (improvement.includes("how-to")) return "Examples";
    if (improvement.includes("capability")) return "Capabilities";
    if (improvement.includes("error")) return "Error Handling";
    return "General";
}

function generateImprovement(improvement: string): string {
    // Simplified - in production, use AI to generate actual content
    return `Enhanced section based on: ${improvement}`;
}

function generateNewPrompt(currentContent: string, changes: any[]): string {
    // Simplified - in production, apply actual changes
    let newContent = currentContent;

    changes.forEach((change) => {
        newContent += `\n\n## ${change.section} (Updated)\n${change.after}`;
    });

    return newContent;
}

// ==========================================
// APPLY VERSION
// ==========================================

async function applyPromptVersion(
    version: string,
    supabase: any
): Promise<any> {
    console.log(`✅ Applying prompt version: ${version}`);

    // Deactivate current
    await supabase
        .from("system_prompt_versions")
        .update({ status: "ARCHIVED" })
        .eq("status", "ACTIVE");

    // Activate new version
    const { error } = await supabase
        .from("system_prompt_versions")
        .update({
            status: "ACTIVE",
            approved_at: new Date().toISOString(),
        })
        .eq("version", version);

    if (error) throw error;

    return {
        success: true,
        message: `Versão ${version} ativada com sucesso!`,
    };
}

// ==========================================
// ROLLBACK
// ==========================================

async function rollbackToVersion(
    version: string,
    supabase: any
): Promise<any> {
    console.log(`⏪ Rolling back to version: ${version}`);

    let targetVersion = version;

    if (version === "latest") {
        // Get last archived version
        const { data } = await supabase
            .from("system_prompt_versions")
            .select("version")
            .eq("status", "ARCHIVED")
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

        targetVersion = data?.version;
    }

    if (!targetVersion) {
        throw new Error("No version to rollback to");
    }

    return await applyPromptVersion(targetVersion, supabase);
}

// ==========================================
// LIST VERSIONS
// ==========================================

async function listPromptVersions(supabase: any): Promise<any> {
    const { data, error } = await supabase
        .from("system_prompt_versions")
        .select("version, status, created_at, performance_score, usage_count")
        .order("created_at", { ascending: false });

    if (error) throw error;

    return {
        success: true,
        versions: data,
    };
}
