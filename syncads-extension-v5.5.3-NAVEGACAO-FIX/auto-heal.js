/**
 * Auto-Heal Client for Chrome Extension
 * 
 * Integra com edge functions de diagnóstico e correção automática.
 * Permite que a extensão se auto-corrija sem intervenção manual.
 */

const AUTO_HEAL_CONFIG = {
    diagnosisUrl: 'https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/self-diagnose',
    healUrl: 'https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/self-heal',
    enabled: true,
    maxRetries: 2
};

/**
 * Tenta auto-correção para um erro
 * 
 * @param {Error} error - O erro a ser corrigido
 * @param {Object} context - Contexto do erro (commandId, deviceId, etc)
 * @returns {Promise<boolean>} - true se corrigido com sucesso
 */
async function attemptAutoHeal(error, context) {
    if (!AUTO_HEAL_CONFIG.enabled) {
        console.log('🩹 [AUTO-HEAL] Disabled');
        return false;
    }

    console.log('🩹 [AUTO-HEAL] Attempting auto-heal for error:', error.message);

    try {
        // 1. DIAGNOSE
        console.log('🔍 [AUTO-HEAL] Step 1: Diagnosing...');

        const diagnosisResponse = await fetch(AUTO_HEAL_CONFIG.diagnosisUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                error_message: error.message,
                context: context,
                stack: error.stack
            })
        });

        const diagnosis = await diagnosisResponse.json();
        console.log('🔍 [AUTO-HEAL] Diagnosis:', diagnosis);

        if (!diagnosis.auto_fixable) {
            console.warn('⚠️ [AUTO-HEAL] Error not auto-fixable:', diagnosis.root_cause);
            return false;
        }

        // 2. HEAL
        console.log('🩹 [AUTO-HEAL] Step 2: Applying fix...');

        const healResponse = await fetch(AUTO_HEAL_CONFIG.healUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                error_type: diagnosis.error_type,
                command_id: context.commandId,
                device_id: context.deviceId,
                context: context
            })
        });

        const healResult = await healResponse.json();
        console.log('✅ [AUTO-HEAL] Heal result:', healResult);

        if (healResult.healed) {
            console.log(`🎉 [AUTO-HEAL] Successfully healed! Action: ${healResult.action}`);

            // Se retry é recomendado, aguardar um pouco antes
            if (healResult.retry_recommended) {
                console.log('⏳ [AUTO-HEAL] Waiting 2s before retry...');
                await new Promise(r => setTimeout(r, 2000));
            }

            return true;
        }

        return false;

    } catch (autoHealError) {
        console.error('❌ [AUTO-HEAL] Auto-heal failed:', autoHealError);
        return false;
    }
}

/**
 * Wrapper que executa uma função com auto-heal automático
 * 
 * @param {Function} fn - Função a executar
 * @param {Object} context - Contexto para auto-heal
 * @param {number} maxRetries - Número máximo de retries
 * @returns {Promise<any>} - Resultado da função
 */
async function withAutoHeal(fn, context, maxRetries = AUTO_HEAL_CONFIG.maxRetries) {
    let lastError = null;
    let attempt = 0;

    while (attempt <= maxRetries) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            attempt++;

            console.log(`❌ [AUTO-HEAL] Attempt ${attempt}/${maxRetries + 1} failed:`, error.message);

            if (attempt > maxRetries) {
                console.error(`❌ [AUTO-HEAL] Max retries reached`);
                throw error;
            }

            // Tentar auto-heal
            const healed = await attemptAutoHeal(error, context);

            if (!healed) {
                console.warn('⚠️ [AUTO-HEAL] Could not auto-heal, throwing error');
                throw error;
            }

            console.log(`🔄 [AUTO-HEAL] Retrying (attempt ${attempt + 1})...`);
            // Loop will retry
        }
    }

    throw lastError;
}

// Export para uso no background.js
export { attemptAutoHeal, withAutoHeal, AUTO_HEAL_CONFIG };
