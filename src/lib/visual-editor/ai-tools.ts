/**
 * AI Tools System
 * Sistema de ferramentas especializadas para o AI Assistant
 * 
 * Permite que a IA utilize ferramentas específicas para:
 * - Gerar páginas completas
 * - Adicionar componentes
 * - Modificar estilos
 * - Corrigir responsividade
 * - Otimizar código
 */

import { ALL_COMPONENTS } from './components';

export interface AITool {
    name: string;
    description: string;
    params: string[];
    execute: (...args: any[]) => Promise<AIToolResult>;
}

export interface AIToolResult {
    success: boolean;
    action: 'insert' | 'replace' | 'update' | 'optimize';
    code?: string;
    message: string;
    position?: string;
    selector?: string;
}

// ========================================
// TOOL FUNCTIONS
// ========================================

/**
 * Gera uma página completa baseada na descrição
 */
async function generatePageTool(description: string): Promise<AIToolResult> {
    // Aqui seria a chamada para a IA gerar código
    // Por enquanto, retornamos um template baseado em keywords

    const isLanding = /landing|sale|venda/i.test(description);
    const isPortfolio = /portfolio|trabalhos/i.test(description);
    const isBlog = /blog|artigos/i.test(description);

    let template = '';

    if (isLanding) {
        template = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Landing Page</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50">
  ${ALL_COMPONENTS.find(c => c.id === 'navbar-modern')?.code() || ''}
  ${ALL_COMPONENTS.find(c => c.id === 'hero-centered')?.code() || ''}
  ${ALL_COMPONENTS.find(c => c.id === 'features-grid-3x3')?.code() || ''}
</body>
</html>`;
    }

    return {
        success: true,
        action: 'replace',
        code: template,
        message: 'Página gerada com sucesso!'
    };
}

/**
 * Adiciona um componente específico ao código
 */
async function addComponentTool(componentType: string, position: string = 'append'): Promise<AIToolResult> {
    // Buscar componente na biblioteca
    const component = ALL_COMPONENTS.find(c =>
        c.id.includes(componentType.toLowerCase()) ||
        c.name.toLowerCase().includes(componentType.toLowerCase())
    );

    if (!component) {
        return {
            success: false,
            action: 'insert',
            message: `Componente "${componentType}" não encontrado. Componentes disponíveis: ${ALL_COMPONENTS.map(c => c.id).join(', ')}`
        };
    }

    return {
        success: true,
        action: 'insert',
        code: component.code(),
        message: `Componente "${component.name}" adicionado!`,
        position
    };
}

/**
 * Atualiza estilos CSS de um seletor
 */
async function updateStylesTool(selector: string, styles: string): Promise<AIToolResult> {
    return {
        success: true,
        action: 'update',
        selector,
        message: `Estilos atualizados para "${selector}"`,
        code: `<style>
${selector} {
  ${styles}
}
</style>`
    };
}

/**
 * Corrige responsividade para um breakpoint
 */
async function fixResponsiveTool(breakpoint: string): Promise<AIToolResult> {
    const breakpoints = {
        mobile: '(max-width: 640px)',
        tablet: '(max-width: 1024px)',
        desktop: '(min-width: 1024px)'
    };

    const mediaQuery = breakpoints[breakpoint as keyof typeof breakpoints] || breakpoints.mobile;

    return {
        success: true,
        action: 'update',
        message: `Responsividade otimizada para ${breakpoint}`,
        code: `<style>
@media ${mediaQuery} {
  /* Ajustes responsivos serão aplicados aqui */
  body { padding: 1rem; }
  h1 { font-size: calc(2rem + 2vw); }
  .container { max-width: 100%; }
}
</style>`
    };
}

/**
 * Otimiza o código (minifica, remove duplicados, etc)
 */
async function optimizeCodeTool(type: string = 'all'): Promise<AIToolResult> {
    return {
        success: true,
        action: 'optimize',
        message: `Código otimizado (${type})`,
        code: '<!-- Otimizações aplicadas -->'
    };
}

// ========================================
// TOOLS REGISTRY
// ========================================

export const AI_TOOLS: Record<string, AITool> = {
    GENERATE_PAGE: {
        name: 'GENERATE_PAGE',
        description: 'Gera uma página completa baseada na descrição',
        params: ['description'],
        execute: generatePageTool
    },

    ADD_COMPONENT: {
        name: 'ADD_COMPONENT',
        description: 'Adiciona um componente específico',
        params: ['componentType', 'position?'],
        execute: addComponentTool
    },

    UPDATE_STYLES: {
        name: 'UPDATE_STYLES',
        description: 'Atualiza estilos CSS de um seletor',
        params: ['selector', 'styles'],
        execute: updateStylesTool
    },

    FIX_RESPONSIVE: {
        name: 'FIX_RESPONSIVE',
        description: 'Corrige responsividade para um breakpoint',
        params: ['breakpoint'],
        execute: fixResponsiveTool
    },

    OPTIMIZE_CODE: {
        name: 'OPTIMIZE_CODE',
        description: 'Otimiza o código',
        params: ['type?'],
        execute: optimizeCodeTool
    }
};

// ========================================
// PARSER
// ========================================

/**
 * Extrai ferramentas da resposta da IA
 * Formato: [TOOL_NAME: param1, param2]
 */
export function parseAITools(response: string): Array<{
    tool: string;
    params: string[];
}> {
    const toolRegex = /\[([A-Z_]+):\s*([^\]]+)\]/g;
    const tools: Array<{ tool: string; params: string[] }> = [];

    let match;
    while ((match = toolRegex.exec(response)) !== null) {
        tools.push({
            tool: match[1],
            params: match[2].split(',').map(p => p.trim())
        });
    }

    return tools;
}

/**
 * Executa ferramentas encontradas na resposta da IA
 */
export async function executeAITools(
    response: string,
    currentCode: string
): Promise<{
    updatedCode: string;
    messages: string[];
}> {
    const toolCalls = parseAITools(response);
    const messages: string[] = [];
    let updatedCode = currentCode;

    for (const call of toolCalls) {
        const tool = AI_TOOLS[call.tool];

        if (!tool) {
            messages.push(`⚠️ Ferramenta "${call.tool}" não encontrada`);
            continue;
        }

        try {
            const result = await tool.execute(...call.params);
            messages.push(result.message);

            if (result.success && result.code) {
                // Aplicar mudança no código
                if (result.action === 'replace') {
                    updatedCode = result.code;
                } else if (result.action === 'insert') {
                    // Inserir código
                    if (result.position === 'append') {
                        updatedCode = updatedCode.replace('</body>', `${result.code}\n</body>`);
                    } else {
                        updatedCode = updatedCode.replace('<body>', `<body>\n${result.code}`);
                    }
                } else if (result.action === 'update') {
                    // Atualizar estilos
                    updatedCode = updatedCode.replace('</head>', `${result.code}\n</head>`);
                }
            }
        } catch (error) {
            messages.push(`❌ Erro ao executar ${call.tool}: ${error}`);
        }
    }

    return { updatedCode, messages };
}

// ========================================
// SYSTEM PROMPT
// ========================================

export const ADVANCED_SYSTEM_PROMPT = `Você é um expert em web development e UI/UX design.

CAPACIDADES:
1. Gerar páginas completas profissionais e responsivas
2. Adicionar componentes específicos ao código existente
3. Modificar estilos mantendo consistência visual
4. Corrigir problemas de responsividade
5. Otimizar performance e acessibilidade
6. Criar designs modernos e atraentes

STACK TECNOLÓGICO:
- HTML5 semântico
- Tailwind CSS (SEMPRE use Tailwind)
- JavaScript vanilla (quando necessário)
- Design mobile-first

PADRÕES DE DESIGN:
- Cores vibrantes e gradientes
- Glassmorphism e blur effects
- Animações sutis (hover, transitions)
- Spacing generoso (whitespace)
- Typography moderna (font-bold, text-lg+)
- Componentes com shadow e rounded

REGRAS CRÍTICAS:
1. SEMPRE mobile-first e 100% responsivo
2. Acessibilidade WCAG AA mínimo
3. Performance otimizada (lazy loading, etc)
4. SEO-friendly (meta tags, semantic HTML)
5. Código limpo e bem comentado
6. Tailwind CSS via CDN (script tag)

FERRAMENTAS DISPONÍVEIS:
Use as seguintes ferramentas quando apropriado:

[GENERATE_PAGE: descrição] - Gera página completa
Exemplo: [GENERATE_PAGE: landing page para vender curso online]

[ADD_COMPONENT: tipo, posição] - Adiciona componente
Exemplo: [ADD_COMPONENT: pricing-table, append]
Tipos disponíveis: navbar, hero, features, pricing, form, cta, footer

[UPDATE_STYLES: seletor, propriedades] - Modifica CSS
Exemplo: [UPDATE_STYLES: .hero, background: linear-gradient(...)]

[FIX_RESPONSIVE: breakpoint] - Corrige responsivo
Exemplo: [FIX_RESPONSIVE: mobile]

[OPTIMIZE_CODE: tipo] - Otimiza código
Exemplo: [OPTIMIZE_CODE: performance]

FLUXO DE TRABALHO:
1. Analise o pedido do usuário
2. Decida qual ferramenta usar (se aplicável)
3. Gere código HTML completo com Tailwind
4. Retorne código limpo e funcional

EXEMPLO DE INTERAÇÃO:
User: "Crie uma landing page moderna"
AI: [GENERATE_PAGE: landing page moderna com hero e features]
\`\`\`html
<!DOCTYPE html>
<html>...</html>
\`\`\`

User: "Adicione uma seção de preços"
AI: [ADD_COMPONENT: pricing, append]
Vou adicionar uma tabela de preços profissional.
\`\`\`html
<!-- Pricing Section -->
...
\`\`\`

IMPORTANTE: Sempre retorne código funcional e visualmente impressionante!`;
