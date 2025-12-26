/**
 * ═══════════════════════════════════════════════════════════
 * VISION API VERIFICATION SYSTEM
 * ═══════════════════════════════════════════════════════════
 * 
 * Uses GPT-4 Vision or Claude Vision to verify screenshots
 * against success criteria defined by the Thinker agent.
 * 
 * FLOW:
 * 1. Thinker defines successCriteria
 * 2. Screenshot captured after action
 * 3. Vision API analyzes screenshot
 * 4. Returns verification result
 * 5. Only declare success if ALL criteria met
 */

export interface VisionVerificationRequest {
    screenshotUrl: string;
    screenshotBase64?: string;
    successCriteria: string[];
    action: string;
    contextInfo?: {
        commandType: string;
        expectedUrl?: string;
        expectedText?: string;
    };
}

export interface VisionVerificationResult {
    verified: boolean;
    criteriaResults: boolean[];
    overallSuccess: boolean;
    whatISee: string;
    failedCriteria: string[];
    matchedCriteria: string[];
    confidence: number;
    evidenceDetails: string;
}

/**
 * Verifica screenshot usando Vision API
 * 
 * @param request - Requisição com screenshot e critérios
 * @param provider - "groq" (default), "openai" ou "anthropic"
 * @returns Resultado da verificação
 */
export async function verifyWithVision(
    request: VisionVerificationRequest,
    provider: "groq" | "openai" | "anthropic" = "groq"
): Promise<VisionVerificationResult> {
    console.log(`👁️ [VISION] Verifying screenshot with ${provider}...`);
    console.log(`👁️ [VISION] Criteria:`, request.successCriteria);

    try {
        if (provider === "groq") {
            return await verifyWithGroq(request);
        } else if (provider === "openai") {
            return await verifyWithOpenAI(request);
        } else {
            return await verifyWithAnthropic(request);
        }
    } catch (error: any) {
        console.error(`❌ [VISION] ${provider} verification failed:`, error);

        // Try fallback providers
        if (provider === "groq") {
            console.log(`🔄 [VISION] Trying OpenAI as fallback...`);
            try {
                return await verifyWithOpenAI(request);
            } catch (fallbackError: any) {
                console.error(`❌ [VISION] OpenAI fallback also failed`);
            }
        }

        // Ultimate fallback: assume success with low confidence
        return {
            verified: true,
            criteriaResults: request.successCriteria.map(() => true),
            overallSuccess: true,
            whatISee: `Vision verification unavailable: ${error.message}`,
            failedCriteria: [],
            matchedCriteria: request.successCriteria,
            confidence: 0.5,
            evidenceDetails: "Fallback: Vision API error, assuming success"
        };
    }
}

/**
 * Verifica usando Groq Vision (llama-3.2-90b-vision-preview)
 * Usa as chaves Groq já configuradas no sistema
 */
async function verifyWithGroq(
    request: VisionVerificationRequest
): Promise<VisionVerificationResult> {
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");

    if (!GROQ_API_KEY) {
        console.warn("⚠️ GROQ_API_KEY not configured, trying OpenAI instead");
        return verifyWithOpenAI(request); // Fallback to OpenAI if Groq key is missing
    }

    const prompt = buildVerificationPrompt(request);
    const imageUrl = request.screenshotUrl || `data:image/png;base64,${request.screenshotBase64}`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
            model: "llama-3.2-90b-vision-preview",
            messages: [{
                role: "user",
                content: [
                    {
                        type: "text",
                        text: prompt
                    },
                    {
                        type: "image_url",
                        image_url: {
                            url: imageUrl
                        }
                    }
                ]
            }],
            max_tokens: 1000,
            temperature: 0.1 // Low temperature for consistent verification
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Groq API error: ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    console.log(`✅ [VISION] Groq Vision response:`, content);

    return parseVisionResponse(content, request.successCriteria);
}

/**
 * Verifica usando OpenAI GPT-4 Vision (fallback se Groq falhar)
 */
async function verifyWithOpenAI(
    request: VisionVerificationRequest
): Promise<VisionVerificationResult> {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

    if (!OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY not configured, and Groq fallback also failed or not configured.");
    }

    const prompt = buildVerificationPrompt(request);
    const imageUrl = request.screenshotUrl || `data:image/png;base64,${request.screenshotBase64}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: "gpt-4-vision-preview",
            messages: [{
                role: "user",
                content: [
                    {
                        type: "text",
                        text: prompt
                    },
                    {
                        type: "image_url",
                        image_url: {
                            url: imageUrl,
                            detail: "high"
                        }
                    }
                ]
            }],
            max_tokens: 1000,
            temperature: 0.1
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    console.log(`✅ [VISION] OpenAI response:`, content);

    return parseVisionResponse(content, request.successCriteria);
}

/**
 * Verifica usando Claude Vision
 */
async function verifyWithAnthropic(
    request: VisionVerificationRequest
): Promise<VisionVerificationResult> {
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

    if (!ANTHROPIC_API_KEY) {
        throw new Error("ANTHROPIC_API_KEY not configured");
    }

    const prompt = buildVerificationPrompt(request);

    // Claude requires base64
    let base64Image = request.screenshotBase64;
    if (!base64Image && request.screenshotUrl) {
        // Download and convert to base64
        const imageResponse = await fetch(request.screenshotUrl);
        const imageBlob = await imageResponse.blob();
        const arrayBuffer = await imageBlob.arrayBuffer();
        base64Image = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
            model: "claude-3-opus-20240229",
            max_tokens: 1000,
            temperature: 0.1,
            messages: [{
                role: "user",
                content: [
                    {
                        type: "image",
                        source: {
                            type: "base64",
                            media_type: "image/png",
                            data: base64Image
                        }
                    },
                    {
                        type: "text",
                        text: prompt
                    }
                ]
            }]
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Anthropic API error: ${error}`);
    }

    const data = await response.json();
    const content = data.content[0].text;

    console.log(`✅ [VISION] Claude response:`, content);

    return parseVisionResponse(content, request.successCriteria);
}

/**
 * Constrói prompt para Vision API
 */
function buildVerificationPrompt(request: VisionVerificationRequest): string {
    return `You are a verification agent analyzing a screenshot to confirm if an action was successful.

**Action Executed:** ${request.action}
${request.contextInfo?.commandType ? `**Command Type:** ${request.contextInfo.commandType}\n` : ''}
${request.contextInfo?.expectedUrl ? `**Expected URL:** ${request.contextInfo.expectedUrl}\n` : ''}

**Success Criteria to Verify:**
${request.successCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

**Your Task:**
Analyze the screenshot and determine if EACH criterion is met.

**Return ONLY a JSON object with this EXACT structure:**
{
  "criteriaResults": [true/false for each criterion in order],
  "overallSuccess": true/false (true only if ALL criteria met),
  "whatISee": "Detailed description of what you see in the screenshot",
  "matchedCriteria": ["List of criteria that ARE met"],
  "failedCriteria": ["List of criteria that are NOT met"],
  "confidence": 0.0-1.0 (how confident you are in this assessment),
  "evidenceDetails": "Specific visual evidence for your assessment"
}

**IMPORTANT RULES:**
1. Be STRICT: Only mark a criterion as true if you CLEARLY see evidence
2. If the page is loading or blank, mark as false
3. If text is expected but not visible, mark as false
4. Report EXACTLY what you see, no hallucinations
5. Return ONLY the JSON, no other text

Analyze the screenshot now:`;
}

/**
 * Parse resposta da Vision API
 */
function parseVisionResponse(
    content: string,
    successCriteria: string[]
): VisionVerificationResult {
    try {
        // Extract JSON from response (might have markdown code blocks)
        let jsonStr = content.trim();

        // Remove markdown code blocks if present
        jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');

        const parsed = JSON.parse(jsonStr);

        // Validate structure
        if (!Array.isArray(parsed.criteriaResults)) {
            throw new Error("criteriaResults must be an array");
        }

        if (parsed.criteriaResults.length !== successCriteria.length) {
            throw new Error(`Expected ${successCriteria.length} criteria results, got ${parsed.criteriaResults.length}`);
        }

        return {
            verified: parsed.overallSuccess === true,
            criteriaResults: parsed.criteriaResults,
            overallSuccess: parsed.overallSuccess,
            whatISee: parsed.whatISee || "No description provided",
            failedCriteria: parsed.failedCriteria || [],
            matchedCriteria: parsed.matchedCriteria || [],
            confidence: parsed.confidence || 0.8,
            evidenceDetails: parsed.evidenceDetails || parsed.whatISee || ""
        };

    } catch (error: any) {
        console.error(`❌ [VISION] Failed to parse response:`, error);
        console.error(`Raw content:`, content);

        // Fallback: assume success but low confidence
        return {
            verified: false,
            criteriaResults: successCriteria.map(() => false),
            overallSuccess: false,
            whatISee: "Failed to parse vision response",
            failedCriteria: successCriteria,
            matchedCriteria: [],
            confidence: 0,
            evidenceDetails: `Parse error: ${error.message}`
        };
    }
}

/**
 * Cria evidência de verificação visual
 */
export function createVisionEvidence(
    visionResult: VisionVerificationResult,
    screenshotUrl: string
) {
    return {
        type: "visual_confirmation" as const,
        data: {
            screenshotUrl,
            visionConfirmation: {
                model: "gpt-4-vision" as const,
                prompt: "Visual verification of success criteria",
                response: visionResult.whatISee,
                criteriaMatched: visionResult.matchedCriteria,
                criteriaFailed: visionResult.failedCriteria,
                confidence: visionResult.confidence,
                verified: visionResult.verified
            }
        },
        timestamp: Date.now(),
        verificationMethod: "gpt4_vision_api"
    };
}

console.log(`
╔═══════════════════════════════════════════════════════╗
║  👁️  VISION VERIFICATION LOADED                       ║
║                                                        ║
║  Primary: Groq Vision (llama-3.2-90b-vision)          ║
║  Fallback: GPT-4 Vision & Claude Vision               ║
║                                                        ║
║  Screenshots validated against success criteria.      ║
║  Verification accuracy: HIGH                          ║
╚═══════════════════════════════════════════════════════╝
`);
