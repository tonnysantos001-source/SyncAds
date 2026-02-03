// ============================================
// FETCH WITH RETRY UTILITY
// ============================================
/**
 * Fetch com retry automático
 * 
 * @param {string} url - URL para fetch
 * @param {Object} options - Opções do fetch
 * @param {number} maxRetries - Máximo de tentativas (padrão: 3)
 * @returns {Promise<Response>}
 */
export async function fetchWithRetry(url, options = {}, maxRetries = 3) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            console.log(`🔄 [FETCH] Attempt ${attempt + 1}/${maxRetries}: ${url}`);

            const response = await fetch(url, options);

            // Se OK, retornar
            if (response.ok) {
                console.log(`✅ [FETCH] Success on attempt ${attempt + 1}`);
                return response;
            }

            // Log de erro
            console.warn(`⚠️ [FETCH] Attempt ${attempt + 1}/${maxRetries} failed: ${response.status}`);

            // Se é último attempt, retornar mesmo com erro
            if (attempt === maxRetries - 1) {
                return response;
            }

        } catch (error) {
            console.error(`❌ [FETCH] Attempt ${attempt + 1}/${maxRetries} error:`, error.message);

            // Se é o último attempt, throw
            if (attempt === maxRetries - 1) {
                throw error;
            }
        }

        // Aguardar antes de retry (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
        console.log(`⏳ [FETCH] Retrying in ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
    }

    throw new Error(`Failed to fetch after ${maxRetries} attempts`);
}
