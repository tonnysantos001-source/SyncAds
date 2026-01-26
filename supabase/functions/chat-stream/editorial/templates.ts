/**
 * Editorial Templates
 * 
 * Templates HTML profissionais para diferentes tipos de documentos
 */

import { StyleDefinitions } from "./types.ts";

export const DEFAULT_STYLES: StyleDefinitions = {
    coverGradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    primaryColor: "#2196F3",
    secondaryColor: "#FF9800",
    accentColor: "#4CAF50",
    headingFont: "'Georgia', serif",
    bodyFont: "'Arial', sans-serif",
    lineHeight: "1.8"
};

export const RECIPE_STYLES: StyleDefinitions = {
    ...DEFAULT_STYLES,
    coverGradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    primaryColor: "#FF6B6B",
    secondaryColor: "#4ECDC4",
    accentColor: "#95E1D3"
};

export const EBOOK_STYLES: StyleDefinitions = {
    ...DEFAULT_STYLES,
    coverGradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    primaryColor: "#5E72E4",
    secondaryColor: "#825EE4",
    accentColor: "#11CDEF"
};

/**
 * Template de Capa Profissional
 */
export function generateCoverPage(
    title: string,
    author: string = "SyncAds AI",
    styles: StyleDefinitions = DEFAULT_STYLES
): string {
    return `
<div style="text-align: center; padding: 80px 20px; background: ${styles.coverGradient}; color: white; page-break-after: always; border-radius: 12px; margin-bottom: 40px;">
  <h1 style="font-size: 56px; font-family: ${styles.headingFont}; margin: 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">
    ${escapeHtml(title)}
  </h1>
  <p style="font-size: 20px; margin-top: 30px; opacity: 0.9; font-family: ${styles.bodyFont};">
    por ${escapeHtml(author)}
  </p>
  <div style="margin-top: 60px; font-size: 14px; opacity: 0.7;">
    ${new Date().toLocaleDateString('pt-BR')}
  </div>
</div>
`.trim();
}

/**
 * Template de Seção com Estilo
 */
export function generateSectionTemplate(
    title: string,
    content: string,
    sectionNumber: number,
    styles: StyleDefinitions = DEFAULT_STYLES,
    withPageBreak: boolean = true
): string {
    const colorMap = [
        styles.primaryColor,
        styles.secondaryColor,
        styles.accentColor,
        "#9C27B0",
        "#FF5722"
    ];

    const sectionColor = colorMap[(sectionNumber - 1) % colorMap.length];

    return `
<h1 style="color: ${sectionColor}; border-left: 5px solid ${sectionColor}; padding-left: 15px; font-family: ${styles.headingFont}; font-size: 32px; margin-top: 20px;">
  ${escapeHtml(title)}
</h1>
${content}
${withPageBreak ? '<div style="page-break-after: always;"></div>' : ''}
`.trim();
}

/**
 * Template de Box de Dicas
 */
export function generateTipBox(content: string): string {
    return `
<div style="background: #FFF9C4; border-left: 4px solid #FFC107; padding: 15px; margin: 20px 0; border-radius: 4px;">
  💡 <strong>Dica:</strong> ${content}
</div>
`.trim();
}

/**
 * Template de Tabela Nutricional
 */
export function generateNutritionTable(nutrients: Array<{ name: string, value: string }>): string {
    const rows = nutrients.map(n => `
    <tr>
      <td style="border: 1px solid #ddd; padding: 8px;">${escapeHtml(n.name)}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${escapeHtml(n.value)}</td>
    </tr>
  `).join('');

    return `
<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
  <thead>
    <tr style="background: #F3E5F5;">
      <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Nutriente</th>
      <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Quantidade</th>
    </tr>
  </thead>
  <tbody>
    ${rows}
  </tbody>
</table>
`.trim();
}

/**
 * Quebra de Página
 */
export function generatePageBreak(): string {
    return '<div style="page-break-after: always;"></div>';
}

/**
 * Helper: Escape HTML
 */
function escapeHtml(text: string): string {
    const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}
