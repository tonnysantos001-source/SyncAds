/**
 * Editorial Renderer
 * 
 * Converte conteúdo estruturado em comandos compatíveis com o Planner
 */

import { PlannerCommand } from "../types.ts";
import { EditorialPlan, StructuredContent } from "./types.ts";

/**
 * Renderiza conteúdo estruturado como comandos do Planner
 * 
 * REGRA CRÍTICA: Retorna exatamente 2 comandos:
 * 1. navigate para criar documento
 * 2. insert_via_api com conteúdo estruturado
 * 
 * @param structuredContent - Conteúdo HTML estruturado
 * @param deviceId - ID do dispositivo alvo
 * @param plan - Plano editorial (para metadata)
 * @returns Array de comandos compatíveis com Planner
 */
export async function renderToGoogleDocs(
    structuredContent: StructuredContent,
    deviceId: string,
    plan: EditorialPlan
): Promise<PlannerCommand[]> {
    console.log("🎨 [RENDERER] Gerando comandos para Google Docs...");

    // VALIDAÇÃO: Garantir que só há 1 comando insert_via_api
    const commands: PlannerCommand[] = [
        {
            type: "navigate",
            payload: {
                url: "https://docs.google.com/document/create"
            }
        },
        {
            type: "insert_via_api",
            payload: {
                value: structuredContent.html,
                // Metadata adicional (opcional, para logging)
                metadata: {
                    documentType: plan.documentType,
                    title: plan.title,
                    sectionsCount: structuredContent.sectionsCount,
                    pageBreaks: structuredContent.pageBreaks,
                    generatedBy: "editorial-system"
                }
            }
        }
    ];

    console.log(`✅ [RENDERER] Gerados ${commands.length} comandos`);
    console.log(`📊 [RENDERER] Conteúdo: ${structuredContent.html.length} bytes, ${structuredContent.sectionsCount} seções`);

    // 🔥 DEBUG: Ver exatamente o que está sendo enviado
    console.log(`📄 [RENDERER-DEBUG] HTML completo (primeiros 1000 chars):`);
    console.log(structuredContent.html.substring(0, 1000));
    console.log(`📄 [RENDERER-DEBUG] HTML completo (últimos 500 chars):`);
    console.log(structuredContent.html.substring(structuredContent.html.length - 500));

    return commands;
}
