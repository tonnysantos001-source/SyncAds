import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_utils/cors.ts";

// ==========================================
// AI CODEBASE AUDITOR
// Scanneia repositório e cria knowledge base
// ==========================================

interface AuditorRequest {
    action: "scan" | "get" | "capabilities";
    scope?: "full" | "frontend" | "backend" | "database";
}

interface CodebaseKnowledge {
    frontend: {
        components: any[];
        pages: any[];
        totalComponents: number;
    };
    backend: {
        edgeFunctions: any[];
        totalFunctions: number;
    };
    database: {
        tables: any[];
        totalTables: number;
    };
    capabilities: string[];
    stats: {
        totalFiles: number;
        scanDuration: number;
    };
}

const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN") || "";
const REPO_OWNER = "tonnysantos001-source";
const REPO_NAME = "SyncAds";

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    const startTime = Date.now();

    try {
        const authHeader = req.headers.get("Authorization")!;
        const token = authHeader.replace("Bearer ", "");

        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? "",
            { global: { headers: { Authorization: authHeader } } }
        );

        // Verificar autenticação
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser(token);

        if (userError || !user) {
            throw new Error("Unauthorized");
        }

        const request: AuditorRequest = await req.json();
        console.log(`🔍 Codebase Auditor:`, request);

        let response;

        switch (request.action) {
            case "scan":
                response = await handleScan(request.scope || "full", supabase);
                break;

            case "get":
                response = await getKnowledge(supabase);
                break;

            case "capabilities":
                response = await getCapabilities(supabase);
                break;

            default:
                throw new Error(`Unknown action: ${request.action}`);
        }

        const duration = Date.now() - startTime;
        console.log(`✅ Scan completed in ${duration}ms`);

        return new Response(JSON.stringify(response), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (error: any) {
        console.error("❌ Codebase Auditor error:", error);

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
// HANDLERS
// ==========================================

async function handleScan(
    scope: string,
    supabase: any
): Promise<{ success: boolean; knowledge?: CodebaseKnowledge }> {
    console.log(`📊 Starting ${scope} scan...`);

    const knowledge: CodebaseKnowledge = {
        frontend: { components: [], pages: [], totalComponents: 0 },
        backend: { edgeFunctions: [], totalFunctions: 0 },
        database: { tables: [], totalTables: 0 },
        capabilities: [],
        stats: { totalFiles: 0, scanDuration: 0 },
    };

    const scanStart = Date.now();

    try {
        // Get repository tree
        const tree = await getRepoTree();

        if (scope === "full" || scope === "frontend") {
            knowledge.frontend = await scanFrontend(tree);
        }

        if (scope === "full" || scope === "backend") {
            knowledge.backend = await scanBackend(tree);
        }

        if (scope === "full" || scope === "database") {
            knowledge.database = await scanDatabase(supabase);
        }

        // Extract capabilities
        knowledge.capabilities = extractCapabilities(knowledge);

        // Stats
        knowledge.stats = {
            totalFiles: tree.length,
            scanDuration: Date.now() - scanStart,
        };

        // Save to database
        await saveKnowledge(knowledge, supabase);

        return {
            success: true,
            knowledge,
        };
    } catch (error: any) {
        console.error("Scan error:", error);
        return {
            success: false,
        };
    }
}

async function getKnowledge(
    supabase: any
): Promise<{ success: boolean; knowledge?: any }> {
    try {
        const { data, error } = await supabase
            .from("codebase_knowledge")
            .select("*")
            .eq("is_current", true)
            .single();

        if (error) throw error;

        return {
            success: true,
            knowledge: data,
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message,
        };
    }
}

async function getCapabilities(
    supabase: any
): Promise<{ success: boolean; capabilities?: string[] }> {
    try {
        const { data, error } = await supabase
            .from("codebase_knowledge")
            .select("capabilities")
            .eq("is_current", true)
            .single();

        if (error) throw error;

        return {
            success: true,
            capabilities: data.capabilities,
        };
    } catch (error: any) {
        return {
            success: false,
            capabilities: [],
        };
    }
}

// ==========================================
// GITHUB API
// ==========================================

async function getRepoTree(): Promise<any[]> {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/trees/main?recursive=1`;

    const response = await fetch(url, {
        headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            Accept: "application/vnd.github.v3+json",
        },
    });

    if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.tree || [];
}

async function getFileContent(path: string): Promise<string> {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;

    const response = await fetch(url, {
        headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            Accept: "application/vnd.github.v3.raw",
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch ${path}`);
    }

    return await response.text();
}

// ==========================================
// SCANNERS
// ==========================================

async function scanFrontend(tree: any[]): Promise<any> {
    console.log("🎨 Scanning frontend...");

    const componentFiles = tree.filter(
        (f) =>
            f.type === "blob" &&
            f.path.startsWith("src/") &&
            (f.path.endsWith(".tsx") || f.path.endsWith(".jsx"))
    );

    const components = [];
    const pages = [];

    for (const file of componentFiles.slice(0, 50)) {
        // Limit for now
        try {
            const content = await getFileContent(file.path);
            const analysis = analyzeComponent(file.path, content);

            if (file.path.includes("/pages/")) {
                pages.push(analysis);
            } else if (file.path.includes("/components/")) {
                components.push(analysis);
            }
        } catch (error) {
            console.error(`Error analyzing ${file.path}:`, error);
        }
    }

    return {
        components,
        pages,
        totalComponents: componentFiles.length,
    };
}

async function scanBackend(tree: any[]): Promise<any> {
    console.log("⚙️ Scanning backend...");

    const functionDirs = tree
        .filter(
            (f) =>
                f.type === "tree" &&
                f.path.startsWith("supabase/functions/") &&
                !f.path.includes("_utils")
        )
        .map((f) => f.path.split("/")[2])
        .filter((name, index, self) => self.indexOf(name) === index);

    const edgeFunctions = [];

    for (const funcName of functionDirs.slice(0, 20)) {
        // Limit
        try {
            const indexPath = `supabase/functions/${funcName}/index.ts`;
            const content = await getFileContent(indexPath);
            const analysis = analyzeEdgeFunction(funcName, content);
            edgeFunctions.push(analysis);
        } catch (error) {
            console.error(`Error analyzing function ${funcName}:`, error);
        }
    }

    return {
        edgeFunctions,
        totalFunctions: functionDirs.length,
    };
}

async function scanDatabase(supabase: any): Promise<any> {
    console.log("🗄️ Scanning database...");

    const { data: tables, error } = await supabase.rpc("get_tables_info");

    if (error) {
        console.error("Database scan error:", error);
        return { tables: [], totalTables: 0 };
    }

    return {
        tables: tables || [],
        totalTables: tables?.length || 0,
    };
}

// ==========================================
// ANALYZERS
// ==========================================

function analyzeComponent(path: string, content: string): any {
    const name = path.split("/").pop()?.replace(/\.(tsx|jsx)$/, "") || "";

    // Extract imports
    const imports = (content.match(/import.*from.*/g) || []).map((imp) =>
        imp.replace(/.*from ['"](.*)['"].*/, "$1")
    );

    // Detect prop types
    const propsMatch = content.match(/interface\s+\w*Props\s*{([^}]+)}/s);
    const props = propsMatch ? extractProps(propsMatch[1]) : [];

    // Detect capabilities
    const capabilities = detectCapabilities(content);

    return {
        name,
        path,
        type: path.includes("/pages/") ? "page" : "component",
        imports: imports.slice(0, 10), // Top 10
        props,
        capabilities,
    };
}

function analyzeEdgeFunction(name: string, content: string): any {
    // Detect capabilities
    const capabilities = [];

    if (content.includes("openai") || content.includes("anthropic"))
        capabilities.push("AI integration");
    if (content.includes("createClient")) capabilities.push("Database access");
    if (content.includes("stripe")) capabilities.push("Payment processing");
    if (content.includes("sendEmail")) capabilities.push("Email sending");

    return {
        name,
        path: `supabase/functions/${name}`,
        capabilities,
    };
}

function extractProps(propsString: string): string[] {
    return propsString
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("//"))
        .map((line) => line.split(":")[0].trim())
        .filter((prop) => prop);
}

function detectCapabilities(content: string): string[] {
    const capabilities = [];

    // Common patterns
    if (content.includes("supabase")) capabilities.push("Database");
    if (content.includes("openai") || content.includes("anthropic"))
        capabilities.push("AI");
    if (content.includes("PaymentGateway")) capabilities.push("Payments");
    if (content.includes("useForm") || content.includes("FormProvider"))
        capabilities.push("Forms");
    if (content.includes("Chart") || content.includes("Recharts"))
        capabilities.push("Charts");
    if (content.includes("Modal") || content.includes("Dialog"))
        capabilities.push("Modals");

    return capabilities;
}

function extractCapabilities(knowledge: CodebaseKnowledge): string[] {
    const allCapabilities = new Set<string>();

    // From frontend
    knowledge.frontend.components.forEach((c) => {
        c.capabilities?.forEach((cap: string) => allCapabilities.add(cap));
    });

    // From backend
    knowledge.backend.edgeFunctions.forEach((f) => {
        f.capabilities?.forEach((cap: string) => allCapabilities.add(cap));
    });

    return Array.from(allCapabilities);
}

// ==========================================
// SAVE TO DATABASE
// ==========================================

async function saveKnowledge(
    knowledge: CodebaseKnowledge,
    supabase: any
): Promise<void> {
    try {
        // Mark previous as not current
        await supabase
            .from("codebase_knowledge")
            .update({ is_current: false })
            .eq("is_current", true);

        // Get latest commit hash
        const commitHash = await getLatestCommitHash();

        // Insert new
        const { error } = await supabase.from("codebase_knowledge").insert({
            frontend_map: knowledge.frontend,
            backend_map: knowledge.backend,
            capabilities: knowledge.capabilities,
            git_commit_hash: commitHash,
            total_files: knowledge.stats.totalFiles,
            components_count: knowledge.frontend.totalComponents,
            functions_count: knowledge.backend.totalFunctions,
            tables_count: knowledge.database.totalTables,
            scan_duration_ms: knowledge.stats.scanDuration,
            is_current: true,
        });

        if (error) throw error;

        console.log("✅ Knowledge saved to database");
    } catch (error) {
        console.error("Failed to save knowledge:", error);
    }
}

async function getLatestCommitHash(): Promise<string> {
    try {
        const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits/main`;

        const response = await fetch(url, {
            headers: {
                Authorization: `token ${GITHUB_TOKEN}`,
                Accept: "application/vnd.github.v3+json",
            },
        });

        if (!response.ok) return "unknown";

        const data = await response.json();
        return data.sha || "unknown";
    } catch (error) {
        return "unknown";
    }
}
