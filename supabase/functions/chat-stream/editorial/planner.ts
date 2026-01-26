/**
 * Editorial Planner
 * 
 * Detecta automaticamente quando o output é conteúdo editorial
 * e gera um plano de estruturação apropriado.
 */

import { ReasonerOutput } from "../types.ts";
import {
    DocumentType,
    EditorialPlan,
    EditorialSection,
    StyleDefinitions,
} from "./types.ts";
import { DEFAULT_STYLES, RECIPE_STYLES, EBOOK_STYLES } from "./templates.ts";

/**
 * Detecta tipo de documento baseado no intent do Reasoner
 */
function detectDocumentType(
    userMessage: string,
    reasonerOutput: ReasonerOutput
): DocumentType | null {
    const intent = reasonerOutput.intent.toLowerCase();
    const message = userMessage.toLowerCase();

    // Palavras-chave para cada tipo
    const keywords = {
        recipe: ['receita', 'culinária', 'cozinhar', 'ingredientes', 'modo de preparo', 'prato'],
        ebook: ['ebook', 'e-book', 'livro', 'guia completo', 'manual'],
        guide: ['guia', 'tutorial', 'passo a passo', 'como fazer'],
        article: ['artigo', 'texto', 'redação', 'conteúdo']
    };

    // Verificar receitas (prioridade máxima)
    if (keywords.recipe.some(k => intent.includes(k) || message.includes(k))) {
        return 'recipe';
    }

    // Verificar ebooks
    if (keywords.ebook.some(k => intent.includes(k) || message.includes(k))) {
        return 'ebook';
    }

    // Verificar guias
    if (keywords.guide.some(k => intent.includes(k) || message.includes(k))) {
        return 'guide';
    }

    // Verificar artigos
    if (keywords.article.some(k => intent.includes(k) || message.includes(k))) {
        return 'article';
    }

    return null;
}

/**
 * Extrai título do conteúdo ou da mensagem do usuário
 */
function extractTitle(userMessage: string, content: string): string {
    // Tentar extrair de primeira linha do conteúdo
    const firstLine = content.split('\n')[0];
    const h1Match = firstLine.match(/<h1[^>]*>(.*?)<\/h1>/i);

    if (h1Match) {
        return h1Match[1].replace(/<[^>]*>/g, '');
    }

    // Tentar extrair da mensagem do usuário
    const patterns = [
        /(?:criar|escrever|gerar|fazer)\s+(?:um|uma)?\s*(?:ebook|receita|guia|artigo)?\s+(?:de|sobre|para)\s+(.+?)(?:\.|$)/i,
        /(?:ebook|receita|guia|artigo)\s+(?:de|sobre|para)\s+(.+?)(?:\.|$)/i
    ];

    for (const pattern of patterns) {
        const match = userMessage.match(pattern);
        if (match) {
            return match[1].trim();
        }
    }

    return 'Documento sem título';
}

/**
 * Define seções padrão para cada tipo de documento
 */
function getDefaultSections(documentType: DocumentType): EditorialSection[] {
    switch (documentType) {
        case 'recipe':
            return [
                { type: 'cover', title: 'Capa', order: 1, required: true },
                { type: 'chapter', title: 'Ingredientes', order: 2, required: true },
                { type: 'chapter', title: 'Modo de Preparo', order: 3, required: true },
                { type: 'chapter', title: 'Informação Nutricional', order: 4, required: false },
                { type: 'chapter', title: 'Dicas e Variações', order: 5, required: false }
            ];

        case 'ebook':
        case 'guide':
            return [
                { type: 'cover', title: 'Capa', order: 1, required: true },
                { type: 'toc', title: 'Sumário', order: 2, required: false },
                { type: 'chapter', title: 'Introdução', order: 3, required: true },
                { type: 'chapter', title: 'Desenvolvimento', order: 4, required: true },
                { type: 'conclusion', title: 'Conclusão', order: 5, required: false }
            ];

        case 'article':
            return [
                { type: 'chapter', title: 'Título', order: 1, required: true },
                { type: 'chapter', title: 'Introdução', order: 2, required: true },
                { type: 'chapter', title: 'Desenvolvimento', order: 3, required: true },
                { type: 'conclusion', title: 'Conclusão', order: 4, required: false }
            ];

        default:
            return [
                { type: 'chapter', title: 'Seção 1', order: 1, required: true }
            ];
    }
}

/**
 * Seleciona guia de estilos apropriado
 */
function getStyleGuide(documentType: DocumentType): StyleDefinitions {
    switch (documentType) {
        case 'recipe':
            return RECIPE_STYLES;
        case 'ebook':
        case 'guide':
            return EBOOK_STYLES;
        default:
            return DEFAULT_STYLES;
    }
}

/**
 * Gera plano editorial completo
 * 
 * @param userMessage - Mensagem original do usuário
 * @param reasonerOutput - Output do agente Reasoner
 * @returns EditorialPlan ou null se não for conteúdo editorial
 */
export function generateEditorialPlan(
    userMessage: string,
    reasonerOutput: ReasonerOutput
): EditorialPlan | null {
    console.log("📚 [EDITORIAL] Analisando se é conteúdo editorial...");

    // Verificar se requer texto longo (critério essencial)
    if (!reasonerOutput.requires_long_text) {
        console.log("ℹ️ [EDITORIAL] Não requer texto longo - ignorando");
        return null;
    }

    // Detectar tipo de documento
    const documentType = detectDocumentType(userMessage, reasonerOutput);

    if (!documentType) {
        console.log("ℹ️ [EDITORIAL] Tipo de documento não identificado - ignorando");
        return null;
    }

    console.log(`✅ [EDITORIAL] Detectado: ${documentType}`);

    // Extrair título
    const title = extractTitle(userMessage, reasonerOutput.strategy_analysis);

    // Gerar plano
    const plan: EditorialPlan = {
        documentType,
        title,
        author: "SyncAds AI",
        sections: getDefaultSections(documentType),
        styleGuide: getStyleGuide(documentType),
        metadata: {
            estimatedPages: documentType === 'recipe' ? 4 : 8,
            hasImages: userMessage.toLowerCase().includes('imagem') || userMessage.toLowerCase().includes('foto'),
            hasTables: documentType === 'recipe', // Receitas geralmente têm tabela nutricional
            generatedAt: new Date().toISOString()
        }
    };

    console.log(`📋 [EDITORIAL] Plano gerado:`, {
        type: plan.documentType,
        title: plan.title,
        sections: plan.sections.length
    });

    return plan;
}
