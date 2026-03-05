/**
 * Editorial Structurer
 * 
 * Converte plano editorial + conteúdo bruto em HTML estruturado
 */

import { EditorialPlan, StructuredContent } from "./types.ts";
import {
    generateCoverPage,
    generateSectionTemplate,
    generatePageBreak,
} from "./templates.ts";
import { expandPlaceholders, hasPlaceholders } from "./expander.ts";

/**
 * Extrai seções do conteúdo HTML bruto
 * Identifica seções pelos headings <h1>, <h2>
 */
function extractSectionsFromContent(content: string): Array<{ title: string; content: string }> {
    const sections: Array<{ title: string; content: string }> = [];

    // Regex para capturar headings e seu conteúdo
    const h1Pattern = /<h1[^>]*>(.*?)<\/h1>([\s\S]*?)(?=<h1|$)/gi;

    let match;
    while ((match = h1Pattern.exec(content)) !== null) {
        const title = match[1].replace(/<[^>]*>/g, '').trim();
        const sectionContent = match[2].trim();

        sections.push({ title, content: sectionContent });
    }

    // Se não encontrou seções, retorna conteúdo inteiro
    if (sections.length === 0) {
        return [{ title: 'Conteúdo', content }];
    }

    return sections;
}

/**
 * Limpa e normaliza HTML
 */
function cleanHtml(html: string): string {
    // Remove estilos inline  duplicados de page-break
    html = html.replace(/<div style="page-break-after:\s*always;?">\s*<\/div>/gi, '');

    // Remove múltiplas quebras de linha
    html = html.replace(/\n{3,}/g, '\n\n');

    return html.trim();
}

/**
 * Constrói documento estruturado a partir do plano editorial
 * 
 * @param plan - Plano editorial gerado pelo planner
 * @param rawContent - Conteúdo HTML bruto do Planner
 * @param callGroq - Callback para chamar Groq (load balancing)
 * @returns HTML estruturado com capa, quebras de página e hierarquia
 */
export async function buildDocStructure(
    plan: EditorialPlan,
    rawContent: string,
    callGroq?: (prompt: string, options: any) => Promise<{ message: string }>
): Promise<StructuredContent> {
    console.log("🏗️ [STRUCTURER] Construindo estrutura do documento...");

    const parts: string[] = [];
    let pageBreaksCount = 0;
    let headingsCount = 0;

    // 1. CAPA (se aplicável)
    if (plan.sections.some(s => s.type === 'cover')) {
        console.log("📄 [STRUCTURER] Adicionando capa profissional");
        parts.push(generateCoverPage(plan.title, plan.author, plan.styleGuide));
        pageBreaksCount++;
    }

    // 2. EXTRAIR SEÇÕES DO CONTEÚDO BRUTO
    const extractedSections = extractSectionsFromContent(rawContent);
    console.log(`📑 [STRUCTURER] Extraídas ${extractedSections.length} seções do conteúdo`);

    // 3. COMBINAR SEÇÕES PLANEJADAS COM CONTEÚDO EXTRAÍDO
    let sectionNumber = 1;

    for (const plannedSection of plan.sections) {
        // Pular capa (já adicionada)
        if (plannedSection.type === 'cover') continue;

        // Pular sumário por enquanto (implementação futura)
        if (plannedSection.type === 'toc') continue;

        // Procurar conteúdo correspondente
        const matchingContent = extractedSections.find(es =>
            es.title.toLowerCase().includes(plannedSection.title.toLowerCase()) ||
            plannedSection.title.toLowerCase().includes(es.title.toLowerCase())
        );

        if (matchingContent) {
            console.log(`✅ [STRUCTURER] Adicionando seção: ${plannedSection.title}`);

            const withPageBreak = sectionNumber < plan.sections.length - 1; // Não quebrar na última seção

            parts.push(
                generateSectionTemplate(
                    matchingContent.title,
                    matchingContent.content,
                    sectionNumber,
                    plan.styleGuide,
                    withPageBreak
                )
            );

            if (withPageBreak) pageBreaksCount++;
            headingsCount++;
            sectionNumber++;
        } else if (plannedSection.required) {
            console.warn(`⚠️ [STRUCTURER] Seção obrigatória não encontrada: ${plannedSection.title}`);
        }
    }

    // 4. ADICIONAR SEÇÕES NÃO MAPEADAS (fallback)
    for (const extracted of extractedSections) {
        // Verificar se já foi adicionada
        const alreadyAdded = plan.sections.some(ps =>
            extracted.title.toLowerCase().includes(ps.title.toLowerCase()) ||
            ps.title.toLowerCase().includes(extracted.title.toLowerCase())
        );

        if (!alreadyAdded) {
            console.log(`➕ [STRUCTURER] Adicionando seção extra: ${extracted.title}`);
            parts.push(
                generateSectionTemplate(
                    extracted.title,
                    extracted.content,
                    sectionNumber,
                    plan.styleGuide,
                    false // Sem page break para extras
                )
            );
            headingsCount++;
            sectionNumber++;
        }
    }

    // 5. MONTAR HTML FINAL
    const preliminaryHtml = cleanHtml(parts.join('\n\n'));

    console.log(`📄 [STRUCTURER] HTML preliminar criado: ${preliminaryHtml.length} bytes`);

    // 🔥 6. FINALIZER - VALIDAÇÃO E NORMALIZAÇÃO
    console.log("🔍 [STRUCTURER] Aplicando finalizer para validação...");

    let finalHtml = preliminaryHtml;
    let finalizerApplied = false;

    try {
        // Importar finalizer dinamicamente
        const { finalizeEditorialDocument } = await import("./finalizer.ts");

        finalHtml = finalizeEditorialDocument(preliminaryHtml, plan.documentType);
        finalizerApplied = true;

        console.log("✅ [STRUCTURER] Finalizer aplicado com sucesso");
    } catch (error) {
        console.error("⚠️ [STRUCTURER] Finalizer falhou, usando HTML preliminar:", error);
        // Continua com HTML preliminar (não quebra o fluxo)
    }

    // 🔥 7. EXPANDER - EXPANDIR PLACEHOLDERS (SE HOUVER)
    let expanderApplied = false;

    if (callGroq && hasPlaceholders(finalHtml)) {
        console.log("🔄 [STRUCTURER] Placeholders detectados, iniciando expansão...");

        try {
            finalHtml = await expandPlaceholders(finalHtml, callGroq, plan.title);
            expanderApplied = true;
            console.log("✅ [STRUCTURER] Expander aplicado com sucesso");
        } catch (error) {
            console.error("⚠️ [STRUCTURER] Expander falhou, placeholders não expandidos:", error);
            // Continua com placeholders (não quebra o fluxo)
        }
    } else if (!callGroq) {
        console.warn("⚠️ [STRUCTURER] callGroq não fornecido, pulando expansão de placeholders");
    }

    console.log(`✅ [STRUCTURER] Documento estruturado criado:`, {
        sectionsCount: sectionNumber - 1,
        pageBreaks: pageBreaksCount,
        headings: headingsCount,
        sizeBytes: finalHtml.length,
        finalizerApplied,
        expanderApplied
    });

    return {
        html: finalHtml,
        sectionsCount: sectionNumber - 1,
        pageBreaks: pageBreaksCount,
        headingsCount: headingsCount,
        finalizerApplied
    };
}
