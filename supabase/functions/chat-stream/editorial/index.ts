/**
 * Editorial System - Main Entry Point
 * 
 * Re-exports dos módulos editoriais para fácil importação
 */

export { generateEditorialPlan } from "./planner.ts";
export { buildDocStructure } from "./structurer.ts";
export { renderToGoogleDocs } from "./renderer.ts";
export { finalizeEditorialDocument, safeFinalize } from "./finalizer.ts";

export type {
    DocumentType,
    EditorialPlan,
    EditorialSection,
    StyleDefinitions,
    StructuredContent,
} from "./types.ts";
