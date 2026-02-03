// ============================================
// GOOGLE DOCS API REQUEST BUILDER
// ============================================
/**
 * Converte AST estruturado em array de requests compatíveis
 * com a Google Docs API batchUpdate
 */

/**
 * Build Google Docs API requests from AST
 * 
 * @param {Object} ast - AST estruturado do parser
 * @returns {Array} Array de requests para batchUpdate
 */
export function buildDocsApiRequests(ast) {
    console.log('🎨 [BUILDER] Building Google Docs API requests...');

    const requests = [];
    let currentIndex = 1; // Google Docs index começa em 1

    for (const node of ast.children) {
        const nodeRequests = buildNodeRequests(node, currentIndex);

        // Atualizar índice baseado no texto inserido
        const textLength = getNodeTextLength(node);
        currentIndex += textLength;

        requests.push(...nodeRequests);
    }

    console.log(`✅ [BUILDER] Generated ${requests.length} requests`);
    return requests;
}

/**
 * Build requests para um node específico
 */
function buildNodeRequests(node, startIndex) {
    const requests = [];

    switch (node.type) {
        case 'heading':
            requests.push(...buildHeadingRequests(node, startIndex));
            break;

        case 'paragraph':
            requests.push(...buildParagraphRequests(node, startIndex));
            break;

        case 'text':
            requests.push(...buildTextRequests(node, startIndex));
            break;

        case 'linebreak':
            requests.push(buildLineBreakRequest(startIndex));
            break;

        case 'list':
            requests.push(...buildListRequests(node, startIndex));
            break;

        default:
            console.warn(`[BUILDER] Unknown node type: ${node.type}`);
    }

    return requests;
}

/**
 * Build requests para heading
 */
function buildHeadingRequests(node, startIndex) {
    const requests = [];
    const text = node.text + '\n'; // Headings terminam com quebra de linha
    const endIndex = startIndex + text.length;

    // 1. Inserir texto
    requests.push({
        insertText: {
            location: { index: startIndex },
            text: text
        }
    });

    // 2. Aplicar estilo de heading
    requests.push({
        updateParagraphStyle: {
            range: {
                startIndex: startIndex,
                endIndex: endIndex
            },
            paragraphStyle: {
                namedStyleType: `HEADING_${node.level}`
            },
            fields: 'namedStyleType'
        }
    });

    // 3. Aplicar formatação de texto (cor, tamanho)
    if (node.style) {
        const textStyle = buildTextStyle(node.style);

        requests.push({
            updateTextStyle: {
                range: {
                    startIndex: startIndex,
                    endIndex: endIndex - 1 // Não incluir o \n na formatação
                },
                textStyle: textStyle,
                fields: Object.keys(textStyle).join(',')
            }
        });
    }

    return requests;
}

/**
 * Build requests para parágrafo
 */
function buildParagraphRequests(node, startIndex) {
    const requests = [];
    const text = node.text + '\n';
    const endIndex = startIndex + text.length;

    // 1. Inserir texto
    requests.push({
        insertText: {
            location: { index: startIndex },
            text: text
        }
    });

    // 2. Aplicar formatação
    if (node.style) {
        const textStyle = buildTextStyle(node.style);

        requests.push({
            updateTextStyle: {
                range: {
                    startIndex: startIndex,
                    endIndex: endIndex - 1
                },
                textStyle: textStyle,
                fields: Object.keys(textStyle).join(',')
            }
        });
    }

    return requests;
}

/**
 * Build requests para texto simples
 */
function buildTextRequests(node, startIndex) {
    const requests = [];
    const text = node.text;
    const endIndex = startIndex + text.length;

    // 1. Inserir texto
    requests.push({
        insertText: {
            location: { index: startIndex },
            text: text
        }
    });

    // 2. Aplicar formatação
    if (node.style) {
        const textStyle = buildTextStyle(node.style);

        requests.push({
            updateTextStyle: {
                range: {
                    startIndex: startIndex,
                    endIndex: endIndex
                },
                textStyle: textStyle,
                fields: Object.keys(textStyle).join(',')
            }
        });
    }

    return requests;
}

/**
 * Build request para quebra de linha
 */
function buildLineBreakRequest(startIndex) {
    return {
        insertText: {
            location: { index: startIndex },
            text: '\n'
        }
    };
}

/**
 * Build requests para lista
 */
function buildListRequests(node, startIndex) {
    const requests = [];
    let currentIndex = startIndex;

    for (let i = 0; i < node.items.length; i++) {
        const item = node.items[i];
        const bullet = node.ordered ? `${i + 1}. ` : '• ';
        const text = bullet + item + '\n';

        requests.push({
            insertText: {
                location: { index: currentIndex },
                text: text
            }
        });

        currentIndex += text.length;
    }

    return requests;
}

/**
 * Build textStyle object para Google Docs API
 */
function buildTextStyle(style) {
    const textStyle = {};

    // Font size
    if (style.fontSize) {
        textStyle.fontSize = {
            magnitude: style.fontSize,
            unit: 'PT'
        };
    }

    // Color
    if (style.color) {
        const rgb = hexToRgb(style.color);
        textStyle.foregroundColor = {
            color: {
                rgbColor: rgb
            }
        };
    }

    // Bold
    if (style.bold) {
        textStyle.bold = true;
    }

    // Italic
    if (style.italic) {
        textStyle.italic = true;
    }

    // Font family
    if (style.fontFamily) {
        textStyle.weightedFontFamily = {
            fontFamily: style.fontFamily,
            weight: 400
        };
    }

    return textStyle;
}

/**
 * Converte cor hex (#RRGGBB) para RGB normalizado (0-1)
 */
function hexToRgb(hex) {
    // Remove # se presente
    hex = hex.replace('#', '');

    // Parse hex
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    return { red: r, green: g, blue: b };
}

/**
 * Calcula comprimento do texto de um node (para tracking de índice)
 */
function getNodeTextLength(node) {
    switch (node.type) {
        case 'heading':
        case 'paragraph':
            return node.text.length + 1; // +1 para \n

        case 'text':
            return node.text.length;

        case 'linebreak':
            return 1;

        case 'list':
            return node.items.reduce((sum, item) => {
                const bullet = node.ordered ? `${item.length > 0 ? '1' : ''}. ` : '• ';
                return sum + bullet.length + item.length + 1;
            }, 0);

        default:
            return 0;
    }
}
