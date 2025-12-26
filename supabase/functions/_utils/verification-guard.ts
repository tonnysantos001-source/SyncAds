/**
 * ═══════════════════════════════════════════════════════════
 * TRAVA DE SEGURANÇA ANTI-MENTIRA
 * ═══════════════════════════════════════════════════════════
 * 
 * Esta flag GLOBAL proíbe qualquer declaração de sucesso
 * sem evidência anexada (screenshot, DOM state, ou URL).
 * 
 * REGRA CRÍTICA:
 * Se VERIFICATION_REQUIRED = true:
 *   - success: true EXIGE evidence object
 *   - Caso contrário → ERRO FATAL
 */

export const VERIFICATION_REQUIRED = true;

export interface Evidence {
    type: "screenshot" | "dom_state" | "url" | "ocr" | "visual_confirmation";
    data: {
        screenshotUrl?: string;
        screenshotBase64?: string;
        domSnapshot?: string;
        urlBefore?: string;
        urlAfter?: string;
        ocrText?: string;
        visionConfirmation?: {
            model: string;
            prompt: string;
            response: string;
            criteriaMatched: string[];
            criteriaFailed: string[];
        };
    };
    timestamp: number;
    verificationMethod: string;
}

export interface VerifiedResult {
    success: boolean;
    message: string;
    evidence: Evidence[];
    executionLog?: string[];
    rawResult?: any;
}

/**
 * Valida se um resultado tem evidência suficiente
 * @throws Error se VERIFICATION_REQUIRED = true e sem evidência
 */
export function validateResult(result: any): VerifiedResult {
    if (!VERIFICATION_REQUIRED) {
        // Modo legado - permitir sem evidência (NÃO RECOMENDADO)
        return result;
    }

    // MODO OBRIGATÓRIO: Verificar evidência
    if (result.success === true) {
        if (!result.evidence || !Array.isArray(result.evidence) || result.evidence.length === 0) {
            throw new Error(
                `VERIFICATION GUARD VIOLATION: 
        
Cannot declare success without evidence!

VERIFICATION_REQUIRED is set to TRUE.
All successful operations MUST include:
  - result.evidence (array)
  - At least one Evidence object with type and data

Current result:
${JSON.stringify(result, null, 2)}

FIX: Add evidence array with screenshot, DOM state, or URL confirmation.
`
            );
        }

        // Validar estrutura da evidência
        for (const ev of result.evidence) {
            if (!ev.type || !ev.data || !ev.timestamp) {
                throw new Error(
                    `EVIDENCE STRUCTURE INVALID:
          
Evidence must have: type, data, timestamp

Invalid evidence:
${JSON.stringify(ev, null, 2)}`
                );
            }
        }
    }

    return result as VerifiedResult;
}

/**
 * Helper para criar evidência a partir de screenshot
 */
export function createScreenshotEvidence(
    screenshotUrl: string,
    verificationMethod: string = "visual_screenshot"
): Evidence {
    return {
        type: "screenshot",
        data: {
            screenshotUrl,
        },
        timestamp: Date.now(),
        verificationMethod,
    };
}

/**
 * Helper para criar evidência a partir de DOM
 */
export function createDomEvidence(
    urlBefore: string,
    urlAfter: string,
    domSnapshot?: string
): Evidence {
    return {
        type: "dom_state",
        data: {
            urlBefore,
            urlAfter,
            domSnapshot,
        },
        timestamp: Date.now(),
        verificationMethod: "dom_comparison",
    };
}

/**
 * Helper para criar evidência de URL
 */
export function createUrlEvidence(urlBefore: string, urlAfter: string): Evidence {
    return {
        type: "url",
        data: {
            urlBefore,
            urlAfter,
        },
        timestamp: Date.now(),
        verificationMethod: "url_validation",
    };
}

console.log(`
╔═══════════════════════════════════════════════════════╗
║  🛡️  VERIFICATION GUARD ACTIVE                        ║
║                                                        ║
║  VERIFICATION_REQUIRED = ${VERIFICATION_REQUIRED ? 'TRUE ✅' : 'FALSE ⚠️ '}                      ║
║                                                        ║
║  All success declarations MUST include evidence.      ║
║  Violations will throw FATAL ERRORS.                  ║
╚═══════════════════════════════════════════════════════╝
`);
