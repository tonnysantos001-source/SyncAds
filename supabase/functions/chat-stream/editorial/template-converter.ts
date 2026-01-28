/**
 * Template Converter
 * 
 * Converte HTML (completo ou truncado) em template com placeholders
 * 
 * PROBLEMA RESOLVIDO:
 * - Planner ignora instrução de usar placeholders
 * - Este módulo FORÇA conversão automática
 * - Garante que expander sempre seja acionado
 */

import { DocumentType } from "./types.ts";

/**
 * Extrai primeiro título do HTML
 */
function extractTitle(html: string): string {
    // Procurar primeiro h1
    const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);

    if (h1Match) {
        // Limpar HTML tags do título
        const cleanTitle = h1Match[1].replace(/<[^>]*>/g, '').trim();
        return cleanTitle;
    }

    // Fallback: procurar texto que pareça título
    const lines = html.split('\n');
    for (const line of lines) {
        const text = line.replace(/<[^>]*>/g, '').trim();
        if (text.length > 5 && text.length < 100) {
            return text;
        }
    }

    return "Documento";
}

/**
 * Extrai subtítulo/descrição se existir
 */
function extractSubtitle(html: string): string {
    // Procurar parágrafo logo após h1 ou texto com "Ebook", "Completo", etc
    const subtitleMatch = html.match(/Ebook\s+Completo\s*-?\s*Passo\s+a\s+Passo/i);

    if (subtitleMatch) {
        return subtitleMatch[0];
    }

    // Procurar parágrafo com style center
    const pMatch = html.match(/<p[^>]*style="[^"]*center[^"]*"[^>]*>(.*?)<\/p>/i);
    if (pMatch) {
        return pMatch[1].replace(/<[^>]*>/g, '').trim();
    }

    return "";
}

/**
 * Converte HTML para template de receita com placeholders
 */
function convertRecipeToTemplate(html: string): string {
    const title = extractTitle(html);
    const subtitle = extractSubtitle(html) || "Ebook Completo - Passo a Passo";

    console.log(`🔄 [TEMPLATE-CONVERTER] Convertendo receita: "${title}"`);

    return `
<h1 style="font-size: 32px; text-align: center; color: #2196F3;">${title}</h1>
<p style="text-align: center; color: #888; font-size: 16px;">${subtitle}</p>

<h1>Ingredientes</h1>
{{INGREDIENTES}}

<h1>Modo de Preparo</h1>
{{MODO_PREPARO}}

<h1>Informação Nutricional</h1>
{{INFO_NUTRICIONAL}}

<h1>Dicas e Variações</h1>
{{DICAS}}
    `.trim();
}

/**
 * Converte HTML para template de ebook com placeholders
 */
function convertEbookToTemplate(html: string): string {
    const title = extractTitle(html);
    const subtitle = extractSubtitle(html) || "Ebook Completo";

    console.log(`🔄 [TEMPLATE-CONVERTER] Convertendo ebook: "${title}"`);

    return `
<h1 style="font-size: 32px; text-align: center; color: #2196F3;">${title}</h1>
<p style="text-align: center; color: #888; font-size: 16px;">${subtitle}</p>

<h1>Introdução</h1>
{{INTRODUCAO}}

<h1>Desenvolvimento</h1>
{{DESENVOLVIMENTO}}

<h1>Conclusão</h1>
{{CONCLUSAO}}
    `.trim();
}

/**
 * Converte HTML para template de guia com placeholders
 */
function convertGuideToTemplate(html: string): string {
    const title = extractTitle(html);
    const subtitle = extractSubtitle(html) || "Guia Prático";

    console.log(`🔄 [TEMPLATE-CONVERTER] Convertendo guia: "${title}"`);

    return `
<h1 style="font-size: 32px; text-align: center; color: #2196F3;">${title}</h1>
<p style="text-align: center; color: #888; font-size: 16px;">${subtitle}</p>

<h1>Introdução</h1>
{{INTRODUCAO}}

<h1>Passo a Passo</h1>
{{PASSO_A_PASSO}}

<h1>Dicas Importantes</h1>
{{DICAS}}

<h1>Conclusão</h1>
{{CONCLUSAO}}
    `.trim();
}

/**
 * FUNÇÃO PRINCIPAL: Converte HTML em template com placeholders
 * 
 * @param html - HTML original (completo ou truncado)
 * @param documentType - Tipo do documento
 * @returns Template com placeholders OU HTML original se tipo não suportado
 */
export function convertToTemplate(
    html: string,
    documentType: DocumentType
): string {
    console.log(`🔍 [TEMPLATE-CONVERTER] Tipo: ${documentType}`);

    try {
        switch (documentType) {
            case 'recipe':
                return convertRecipeToTemplate(html);

            case 'ebook':
                return convertEbookToTemplate(html);

            case 'guide':
                return convertGuideToTemplate(html);

            case 'article':
            case 'generic':
            default:
                console.log(`ℹ️ [TEMPLATE-CONVERTER] Tipo "${documentType}" não usa placeholders, retornando HTML original`);
                return html;
        }
    } catch (error) {
        console.error(`❌ [TEMPLATE-CONVERTER] Erro ao converter:`, error);
        console.log(`⚠️ [TEMPLATE-CONVERTER] Fallback: retornando HTML original`);
        return html;
    }
}

/**
 * Detecta se HTML já é um template (tem placeholders)
 */
export function isAlreadyTemplate(html: string): boolean {
    return html.includes('{{') && html.includes('}}');
}

/**
 * Versão safe: converte apenas se necessário
 */
export function safeConvertToTemplate(
    html: string,
    documentType: DocumentType
): { html: string; converted: boolean } {
    // Se já é template, não converter
    if (isAlreadyTemplate(html)) {
        console.log(`✅ [TEMPLATE-CONVERTER] HTML já é template, não convertendo`);
        return { html, converted: false };
    }

    // Converter
    const template = convertToTemplate(html, documentType);
    const converted = template !== html;

    if (converted) {
        console.log(`✅ [TEMPLATE-CONVERTER] HTML convertido para template`);
    }

    return { html: template, converted };
}
