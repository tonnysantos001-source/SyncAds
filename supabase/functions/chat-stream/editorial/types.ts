/**
 * Editorial System Types
 * 
 * Tipos para estruturação editorial de documentos (ebooks, receitas, guias)
 */

export type DocumentType = 'ebook' | 'recipe' | 'article' | 'guide' | 'generic';

export type SectionType = 'cover' | 'toc' | 'chapter' | 'conclusion' | 'custom';

export interface EditorialSection {
    type: SectionType;
    title: string;
    order: number;
    required: boolean;
    content?: string;
}

export interface StyleDefinitions {
    coverGradient: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    headingFont: string;
    bodyFont: string;
    lineHeight: string;
}

export interface EditorialPlan {
    documentType: DocumentType;
    title: string;
    author: string;
    sections: EditorialSection[];
    styleGuide: StyleDefinitions;
    metadata: {
        estimatedPages: number;
        hasImages: boolean;
        hasTables: boolean;
        generatedAt: string;
    };
}

export interface StructuredContent {
    html: string;
    sectionsCount: number;
    pageBreaks: number;
    headingsCount: number;
}
