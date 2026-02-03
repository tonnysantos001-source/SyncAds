// ============================================
// HTML TO GOOGLE DOCS PARSER
// ============================================
/**
 * Converte HTML complexo (com estilos inline) em AST estruturado
 * compatível com a Google Docs API
 * 
 * IMPORTANTE: Service Worker não tem DOM, então usa regex puro
 */

/**
 * Parse HTML string to structured AST
 * 
 * @param {string} html - HTML com estilos inline
 * @returns {Object} AST estruturado
 */
export function parseHtmlToAst(html) {
    console.log('🔍 [PARSER] Starting HTML parse...');

    const ast = {
        type: 'document',
        children: []
    };

    // Remover scripts e styles
    let cleanHtml = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

    // Processar elementos em ordem
    const elements = extractElements(cleanHtml);

    for (const elem of elements) {
        const node = parseElement(elem);
        if (node) {
            ast.children.push(node);
        }
    }

    console.log(`✅ [PARSER] Parsed ${ast.children.length} elements`);
    return ast;
}

/**
 * Extrai elementos HTML preservando ordem
 */
function extractElements(html) {
    const elements = [];

    // Regex para capturar tags de interesse
    const tagRegex = /<(h[1-6]|p|div|strong|em|ul|ol|li|table|tr|td|th|br)[^>]*>[\s\S]*?<\/\1>|<br\s*\/?>/gi;

    let match;
    let lastIndex = 0;

    while ((match = tagRegex.exec(html)) !== null) {
        // Capturar texto entre tags
        if (match.index > lastIndex) {
            const textBetween = html.substring(lastIndex, match.index).trim();
            if (textBetween) {
                elements.push({
                    type: 'text',
                    content: textBetween
                });
            }
        }

        elements.push({
            type: 'tag',
            content: match[0],
            tagName: match[1] || 'br'
        });

        lastIndex = match.index + match[0].length;
    }

    // Capturar texto final
    if (lastIndex < html.length) {
        const textAfter = html.substring(lastIndex).trim();
        if (textAfter) {
            elements.push({
                type: 'text',
                content: textAfter
            });
        }
    }

    return elements;
}

/**
 * Parse um elemento HTML individual
 */
function parseElement(elem) {
    if (elem.type === 'text') {
        return parseTextNode(elem.content);
    }

    const { tagName, content } = elem;

    // Headings (h1-h6)
    if (/^h[1-6]$/i.test(tagName)) {
        return parseHeading(content, tagName);
    }

    // Parágrafos
    if (tagName === 'p' || tagName === 'div') {
        return parseParagraph(content);
    }

    // Line break
    if (tagName === 'br') {
        return { type: 'linebreak' };
    }

    // Texto formatado (strong, em)
    if (tagName === 'strong' || tagName === 'em') {
        return parseFormattedText(content, tagName);
    }

    // Listas
    if (tagName === 'ul' || tagName === 'ol') {
        return parseList(content, tagName);
    }

    // Tables (simplificadas)
    if (tagName === 'table') {
        return parseTable(content);
    }

    return null;
}

/**
 * Parse heading (h1-h6)
 */
function parseHeading(html, tagName) {
    const level = parseInt(tagName[1]);
    const style = extractInlineStyles(html);
    const text = stripTags(html);

    return {
        type: 'heading',
        level,
        text: decodeHtmlEntities(text),
        style: {
            fontSize: style.fontSize || (level === 1 ? 24 : level === 2 ? 20 : 16),
            color: style.color || '#000000',
            bold: true // Headings são sempre bold
        }
    };
}

/**
 * Parse parágrafo
 */
function parseParagraph(html) {
    const style = extractInlineStyles(html);
    let text = stripTags(html);

    // Processar formatação inline (strong, em)
    const hasStrong = /<strong>/i.test(html);
    const hasEm = /<em>/i.test(html);

    return {
        type: 'paragraph',
        text: decodeHtmlEntities(text),
        style: {
            fontSize: style.fontSize || 11,
            color: style.color || '#000000',
            bold: hasStrong,
            italic: hasEm
        }
    };
}

/**
 * Parse texto simples
 */
function parseTextNode(text) {
    const cleanText = decodeHtmlEntities(text.trim());

    if (!cleanText) return null;

    return {
        type: 'text',
        text: cleanText,
        style: {
            fontSize: 11,
            color: '#000000'
        }
    };
}

/**
 * Parse texto formatado (strong, em)
 */
function parseFormattedText(html, tagName) {
    const text = stripTags(html);

    return {
        type: 'text',
        text: decodeHtmlEntities(text),
        style: {
            fontSize: 11,
            color: '#000000',
            bold: tagName === 'strong',
            italic: tagName === 'em'
        }
    };
}

/**
 * Parse lista (simplificada)
 */
function parseList(html, tagName) {
    const items = html.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];

    return {
        type: 'list',
        ordered: tagName === 'ol',
        items: items.map(item => {
            const text = stripTags(item);
            return decodeHtmlEntities(text);
        })
    };
}

/**
 * Parse table (convertida para texto formatado)
 */
function parseTable(html) {
    // Simplificação: converter tabela para texto com separadores
    const rows = html.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];

    const tableText = rows.map(row => {
        const cells = row.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi) || [];
        return cells.map(cell => stripTags(cell).trim()).join(' | ');
    }).join('\n');

    return {
        type: 'paragraph',
        text: decodeHtmlEntities(tableText),
        style: {
            fontSize: 10,
            color: '#000000'
        }
    };
}

/**
 * Extrai estilos inline de um elemento HTML
 */
function extractInlineStyles(html) {
    const style = {};

    // Extrair atributo style
    const styleMatch = html.match(/style=["']([^"']+)["']/i);
    if (!styleMatch) return style;

    const styleStr = styleMatch[1];

    // Font-size
    const fontSizeMatch = styleStr.match(/font-size:\s*(\d+)px/i);
    if (fontSizeMatch) {
        style.fontSize = parseInt(fontSizeMatch[1]);
    }

    // Color
    const colorMatch = styleStr.match(/color:\s*(#[0-9a-f]{3,6}|rgb\([^)]+\))/i);
    if (colorMatch) {
        style.color = normalizeColor(colorMatch[1]);
    }

    // Font-family
    const fontMatch = styleStr.match(/font-family:\s*['"]?([^;'"]+)['"]?/i);
    if (fontMatch) {
        style.fontFamily = fontMatch[1].split(',')[0].replace(/['"]/g, '').trim();
    }

    return style;
}

/**
 * Remove todas as tags HTML (incluindo orphãs e mal-formadas)
 */
function stripTags(html) {
    // Remover todas as tags (abertura e fechamento)
    let text = html.replace(/<[^>]+>/g, '');

    // Remover tags mal-formadas ou incompletas
    text = text.replace(/<[^>]*/g, ''); // Tags sem fechamento
    text = text.replace(/[^<]*>/g, ''); // Tags de fechamento sem abertura

    // Limpar espaços extras
    text = text.replace(/\s+/g, ' ').trim();

    return text;
}

/**
 * Normaliza cor para formato #RRGGBB
 */
function normalizeColor(color) {
    // Se já é hex, retornar
    if (color.startsWith('#')) {
        // Expandir #RGB para #RRGGBB
        if (color.length === 4) {
            return '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3];
        }
        return color.toUpperCase();
    }

    // Se é rgb(), converter para hex
    const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
        const r = parseInt(rgbMatch[1]).toString(16).padStart(2, '0');
        const g = parseInt(rgbMatch[2]).toString(16).padStart(2, '0');
        const b = parseInt(rgbMatch[3]).toString(16).padStart(2, '0');
        return `#${r}${g}${b}`.toUpperCase();
    }

    return '#000000'; // Fallback
}

/**
 * Decodifica entidades HTML
 */
function decodeHtmlEntities(text) {
    const entities = {
        '&nbsp;': ' ',
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#39;': "'",
        '&apos;': "'",
        '&cent;': '¢',
        '&pound;': '£',
        '&yen;': '¥',
        '&euro;': '€',
        '&copy;': '©',
        '&reg;': '®',
        '&trade;': '™'
    };

    let decoded = text;

    // Substituir entidades nomeadas
    for (const [entity, char] of Object.entries(entities)) {
        decoded = decoded.replace(new RegExp(entity, 'gi'), char);
    }

    // Decodificar entidades numéricas
    decoded = decoded.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec));
    decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (match, hex) => String.fromCharCode(parseInt(hex, 16)));

    return decoded;
}
