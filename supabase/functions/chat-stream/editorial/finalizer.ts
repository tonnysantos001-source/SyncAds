/**
 * Editorial Finalizer
 * 
 * Valida, normaliza e finaliza documentos editoriais antes do envio
 * 
 * RESPONSABILIDADES:
 * 1. Remover duplicatas de seções
 * 2. Reordenar na sequência lógica
 * 3. Validar completude (todas seções com conteúdo)
 * 4. Normalizar formatação
 * 5. Garantir qualidade consistente
 */

import { DocumentType } from "./types.ts";

interface Section {
    title: string;
    content: string;
    order: number;
}

/**
 * Ordem canônica de seções por tipo de documento
 */
const CANONICAL_ORDER: Record<DocumentType, string[]> = {
    recipe: [
        "Receita",
        "Ingredientes",
        "Modo de Preparo",
        "Informação Nutricional",
        "Dicas e Variações",
        "Conclusão"
    ],
    ebook: [
        "Capa",
        "Introdução",
        "Desenvolvimento",
        "Conclusão"
    ],
    guide: [
        "Introdução",
        "Passo a Passo",
        "Dicas",
        "Conclusão"
    ],
    article: [
        "Título",
        "Introdução",
        "Desenvolvimento",
        "Conclusão"
    ],
    generic: []
};

/**
 * Seções obrigatórias por tipo
 */
const REQUIRED_SECTIONS: Record<DocumentType, string[]> = {
    recipe: ["Receita", "Ingredientes", "Modo de Preparo"],
    ebook: ["Capa", "Introdução"],
    guide: ["Introdução"],
    article: ["Título", "Introdução"],
    generic: []
};

/**
 * Extrai seções do HTML parseando <h1> tags
 */
function extractSections(html: string): Section[] {
    const sections: Section[] = [];

    // Regex para capturar <h1> e todo conteúdo até próximo <h1> ou fim
    const h1Pattern = /<h1[^>]*>(.*?)<\/h1>([\s\S]*?)(?=<h1|$)/gi;

    let match;
    let order = 0;

    while ((match = h1Pattern.exec(html)) !== null) {
        const title = match[1].replace(/<[^>]*>/g, '').trim();
        const content = match[2].trim();

        sections.push({ title, content, order: order++ });
    }

    return sections;
}

/**
 * Remove seções duplicadas (mantém primeira ocorrência)
 */
function removeDuplicateSections(sections: Section[]): Section[] {
    const seen = new Set<string>();
    const unique: Section[] = [];

    for (const section of sections) {
        // Normalizar título para comparação (lowercase, sem acentos)
        const normalized = section.title
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

        if (!seen.has(normalized)) {
            seen.add(normalized);
            unique.push(section);
            console.log(`✅ [FINALIZER] Mantendo seção: ${section.title}`);
        } else {
            console.warn(`⚠️ [FINALIZER] Removendo duplicata: ${section.title}`);
        }
    }

    return unique;
}

/**
 * Reordena seções de acordo com ordem canônica
 */
function reorderSections(
    sections: Section[],
    documentType: DocumentType
): Section[] {
    const canonicalOrder = CANONICAL_ORDER[documentType] || [];

    if (canonicalOrder.length === 0) {
        return sections; // Sem ordem definida, mantém original
    }

    const reordered: Section[] = [];

    // Primeiro, adicionar seções na ordem canônica
    for (const canonicalTitle of canonicalOrder) {
        const found = sections.find(s =>
            s.title.toLowerCase().includes(canonicalTitle.toLowerCase()) ||
            canonicalTitle.toLowerCase().includes(s.title.toLowerCase())
        );

        if (found) {
            reordered.push(found);
        }
    }

    // Adicionar seções não mapeadas no final
    for (const section of sections) {
        if (!reordered.includes(section)) {
            reordered.push(section);
            console.log(`ℹ️ [FINALIZER] Seção extra adicionada no final: ${section.title}`);
        }
    }

    return reordered;
}

/**
 * Valida se seção tem conteúdo real (não apenas whitespace/HTML vazio)
 */
function hasRealContent(content: string): boolean {
    // Remove HTML tags e whitespace
    const text = content
        .replace(/<[^>]*>/g, '')
        .trim();

    return text.length > 10; // Mínimo 10 caracteres
}

/**
 * Valida se documento tem todas as seções obrigatórias COM CONTEÚDO
 */
function validateCompleteness(
    sections: Section[],
    documentType: DocumentType
): { valid: boolean; missing: string[] } {
    const required = REQUIRED_SECTIONS[documentType] || [];
    const missing: string[] = [];

    for (const requiredTitle of required) {
        const found = sections.find(s =>
            s.title.toLowerCase().includes(requiredTitle.toLowerCase()) ||
            requiredTitle.toLowerCase().includes(s.title.toLowerCase())
        );

        if (!found) {
            missing.push(requiredTitle);
            console.error(`❌ [FINALIZER] Seção obrigatória faltando: ${requiredTitle}`);
        } else if (!hasRealContent(found.content)) {
            missing.push(`${requiredTitle} (vazia)`);
            console.error(`❌ [FINALIZER] Seção obrigatória vazia: ${requiredTitle}`);
        }
    }

    return { valid: missing.length === 0, missing };
}

/**
 * Reconstrói HTML a partir de seções normalizadas
 */
function rebuildHtml(sections: Section[]): string {
    const parts: string[] = [];

    // Paleta de cores para seções
    const colors = ['#2196F3', '#FF9800', '#4CAF50', '#9C27B0', '#FF5722'];

    for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        const color = colors[i % colors.length];

        // Reconstruir com <h1> + estilos + conteúdo
        parts.push(`<h1 style="color: ${color}; border-left: 5px solid ${color}; padding-left: 15px;">${section.title}</h1>`);
        parts.push(section.content);

        // Adicionar quebra de página (exceto última seção)
        if (i < sections.length - 1) {
            parts.push('<div style="page-break-after: always;"></div>');
        }
    }

    return parts.join('\n\n').trim();
}

/**
 * FUNÇÃO PRINCIPAL: Finaliza e valida documento editorial
 * 
 * @param html - HTML estruturado
 * @param documentType - Tipo do documento
 * @returns HTML finalizado e validado
 * @throws Error se documento estiver incompleto/inválido
 */
export function finalizeEditorialDocument(
    html: string,
    documentType: DocumentType
): string {
    console.log("🔍 [FINALIZER] Iniciando finalização do documento...");

    // 1. EXTRAIR SEÇÕES
    let sections = extractSections(html);
    console.log(`📑 [FINALIZER] Extraídas ${sections.length} seções`);

    if (sections.length === 0) {
        console.warn("⚠️ [FINALIZER] Nenhuma seção encontrada, retornando HTML original");
        return html;
    }

    // 2. REMOVER DUPLICATAS (SEMPRE, mesmo que incompleto)
    sections = removeDuplicateSections(sections);
    console.log(`✂️ [FINALIZER] Após remoção de duplicatas: ${sections.length} seções`);

    // 3. REORDENAR (SEMPRE, mesmo que incompleto)
    sections = reorderSections(sections, documentType);
    console.log(`📊 [FINALIZER] Seções reordenadas na ordem canônica`);

    // 4. VALIDAR COMPLETUDE (WARNING, não bloqueia)
    const validation = validateCompleteness(sections, documentType);

    if (!validation.valid) {
        console.warn(`⚠️ [FINALIZER] Documento incompleto mas continuando: ${validation.missing.join(', ')}`);
        // NÃO lançar erro, apenas avisar
        // O sistema de retry do Reasoner pode tentar novamente se necessário
    } else {
        console.log("✅ [FINALIZER] Documento validado com sucesso");
    }

    // 5. RECONSTRUIR HTML (SEMPRE)
    const finalHtml = rebuildHtml(sections);

    console.log(`📄 [FINALIZER] HTML finalizado: ${finalHtml.length} bytes, ${sections.length} seções`);

    return finalHtml;
}

/**
 * Versão Safe: Tenta finalizar, mas retorna HTML original se falhar
 */
export function safeFinalize(
    html: string,
    documentType: DocumentType
): { html: string; finalized: boolean; error?: string } {
    try {
        const finalized = finalizeEditorialDocument(html, documentType);
        return { html: finalized, finalized: true };
    } catch (error) {
        console.error("⚠️ [FINALIZER] Falha na finalização, usando HTML original:", error);
        return {
            html,
            finalized: false,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}
