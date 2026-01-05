import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Self-Diagnose Edge Function
 * 
 * Analisa erros automaticamente e identifica causa raiz.
 * Retorna diagnóstico com sugestão de correção.
 */

interface DiagnosisResult {
    error_type: string;
    root_cause: string;
    suggested_fix: string;
    auto_fixable: boolean;
    fix_code?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
}

const ERROR_PATTERNS: Record<string, Omit<DiagnosisResult, 'error_type'>> = {
    'could not establish connection': {
        root_cause: 'Content script not injected or page reloaded',
        suggested_fix: 'Re-inject content script automatically before sending message',
        auto_fixable: true,
        fix_code: 'await ensureContentScriptInjected(tabId)',
        severity: 'high'
    },
    'receiving end does not exist': {
        root_cause: 'Content script not loaded in target tab',
        suggested_fix: 'Inject content script and retry',
        auto_fixable: true,
        fix_code: 'await ensureContentScriptInjected(tabId)',
        severity: 'high'
    },
    'token expired': {
        root_cause: 'Access token expired, need refresh',
        suggested_fix: 'Call refreshAccessToken() and retry command',
        auto_fixable: true,
        fix_code: 'await refreshAccessToken(); /* retry command */',
        severity: 'critical'
    },
    'missing document_created signal': {
        root_cause: 'Timeout waiting for Google Docs editor signal or detection failed',
        suggested_fix: 'Use URL verification fallback method',
        auto_fixable: true,
        fix_code: 'await verifyDocumentCreatedByUrl()',
        severity: 'medium'
    },
    'document not confirmed': {
        root_cause: 'DOCUMENT_CREATED signal not emitted within timeout',
        suggested_fix: 'Increase timeout or use URL verification',
        auto_fixable: true,
        fix_code: 'await verifyDocumentCreatedByUrl()',
        severity: 'medium'
    },
    'timeout waiting': {
        root_cause: 'Operation exceeded maximum wait time',
        suggested_fix: 'Increase timeout or check network/server status',
        auto_fixable: false,
        severity: 'medium'
    },
    'element not found': {
        root_cause: 'DOM element matching selector not found',
        suggested_fix: 'Use robust fallback selectors or wait longer for element',
        auto_fixable: true,
        fix_code: 'await waitForElement(selector, { timeout: 15000, fallbacks: [...] })',
        severity: 'low'
    }
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
        });
    }

    try {
        const { error_message, context, stack } = await req.json();

        console.log('🔍 [DIAGNOSE] Analyzing error:', error_message);

        // Normalize error message
        const normalizedError = error_message.toLowerCase();

        // Find matching pattern
        const errorKey = Object.keys(ERROR_PATTERNS).find(key =>
            normalizedError.includes(key)
        );

        if (errorKey) {
            const diagnosis: DiagnosisResult = {
                error_type: errorKey,
                ...ERROR_PATTERNS[errorKey]
            };

            console.log('✅ [DIAGNOSE] Pattern matched:', diagnosis);

            // Log diagnosis to Supabase for learning
            const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
            const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
            const supabase = createClient(supabaseUrl, supabaseKey);

            await supabase.from('error_diagnoses').insert({
                error_message,
                error_type: diagnosis.error_type,
                root_cause: diagnosis.root_cause,
                suggested_fix: diagnosis.suggested_fix,
                auto_fixable: diagnosis.auto_fixable,
                severity: diagnosis.severity,
                context: context || {},
                diagnosed_at: new Date().toISOString()
            });

            return new Response(JSON.stringify(diagnosis), {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        // No pattern matched - unknown error
        const unknownDiagnosis: DiagnosisResult = {
            error_type: 'unknown',
            root_cause: 'Could not match error to known patterns',
            suggested_fix: 'Manual investigation required - check logs and context',
            auto_fixable: false,
            severity: 'medium'
        };

        console.warn('⚠️ [DIAGNOSE] Unknown error pattern');

        return new Response(JSON.stringify(unknownDiagnosis), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });

    } catch (error) {
        console.error('❌ [DIAGNOSE] Error:', error);

        return new Response(JSON.stringify({
            error: error.message,
            error_type: 'diagnosis_failed'
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
});
