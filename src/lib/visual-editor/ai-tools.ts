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
  <title>Landing Page Profissional</title>
  
  <!-- Core Libraries -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  
  <!-- UI & Animations -->
  <script src="https://unpkg.com/lucide@latest"></script>
  <script src="https://unpkg.com/framer-motion@10.16.4/dist/framer-motion.js"></script>
  
  <!-- Charts (Optional) -->
  <script src="https://unpkg.com/recharts/umd/Recharts.js"></script>

  <style>
    /* Custom Scrollbar */
    ::-webkit-scrollbar { width: 8px; }
    ::-webkit-scrollbar-track { background: #f1f1f1; }
    ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
    
    .glass {
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
    }
  </style>
</head>
<body class="bg-slate-50 text-slate-900 antialiased">
  <div id="root"></div>

  <script type="text/babel">
    const { useState, useEffect, useRef } = React;
    const { motion, AnimatePresence } = window.Motion;
    const { 
      LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
      AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell 
    } = window.Recharts;

    // Componente de Ícone Lucide
    const Icon = ({ name, size = 24, className }) => {
      useEffect(() => {
        lucide.createIcons();
      }, [name]);

      return <i data-lucide={name} className={className} style={{ width: size, height: size }}></i>;
    };

    function App() {
      useEffect(() => {
        lucide.createIcons();
      }, []);

      return (
        <div className="min-h-screen flex flex-col">
          {/* Navbar */}
          <nav className="fixed w-full z-50 glass border-b border-slate-200/50">
            <div className="container mx-auto px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                  S
                </div>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                  SyncAds
                </span>
              </div>
              <div className="hidden md:flex items-center gap-8">
                <a href="#features" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Features</a>
                <a href="#pricing" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Preços</a>
                <a href="#testimonials" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Depoimentos</a>
                <button className="px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-full hover:bg-slate-800 transition-all hover:shadow-lg hover:-translate-y-0.5">
                  Começar Agora
                </button>
              </div>
            </div>
          </nav>

          {/* Hero Section */}
          <section className="pt-32 pb-20 px-6">
            <div className="container mx-auto text-center max-w-4xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-8">
                  <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                  Novo Editor Visual 2.0
                </div>
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 text-slate-900">
                  Crie algo <span className="text-blue-600">extraordinário</span> com Inteligência Artificial
                </h1>
                <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl mx-auto">
                  Utilize o poder dos componentes React, Tailwind CSS e Framer Motion para construir interfaces modernas em segundos.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-full hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 hover:scale-105">
                    Testar Gratuitamente
                  </button>
                  <button className="px-8 py-4 bg-white text-slate-700 border border-slate-200 text-lg font-semibold rounded-full hover:bg-slate-50 transition-all hover:scale-105">
                    Ver Demonstração
                  </button>
                </div>
              </motion.div>
            </div>
          </section>
        
          {/* Features Grid */}
          <section id="features" className="py-20 bg-slate-50">
            <div className="container mx-auto px-6">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold mb-4">Recursos Poderosos</h2>
                <p className="text-slate-600">Tudo que você precisa para escalar seu negócio</p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  { title: "Analytics Avançado", icon: "bar-chart-3", desc: "Métricas em tempo real para tomada de decisão." },
                  { title: "Automação Inteligente", icon: "bot", desc: "Deixe a IA trabalhar por você 24/7." },
                  { title: "Integração Total", icon: "blocks", desc: "Conecte com suas ferramentas favoritas." }
                ].map((feature, i) => (
                  <motion.div 
                    key={i}
                    whileHover={{ y: -5 }}
                    className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all"
                  >
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                      <Icon name={feature.icon} />
                    </div>
                    <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                    <p className="text-slate-600">{feature.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="bg-slate-900 text-slate-400 py-12 mt-auto">
            <div className="container mx-auto px-6 text-center">
              <p>&copy; 2025 SyncAds. Todos os direitos reservados.</p>
            </div>
          </footer>
        </div>
      );
    }

    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<App />);
  </script>
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

  // 1. Verifique se a IA retornou um bloco de código completo (overwrite strategy)
  // Isso é preferível para o novo modelo React onde a IA reescreve o componente App ou o arquivo todo.
  const codeBlockRegex = /```html([\s\S]*?)```/i;
  const match = response.match(codeBlockRegex);

  if (match && match[1]) {
    updatedCode = match[1].trim();
    messages.push('Código reescrito pela IA.');
    // Se achou um bloco completo, ignoramos ferramentas de manipulação parcial para evitar conflitos
    return { updatedCode, messages };
  }

  // 2. Se não houver bloco completo, tentamos as ferramentas (Legacy / Specific updates)
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
        if (result.action === 'replace') {
          updatedCode = result.code;
        } else if (result.action === 'insert') {
          // Fallback simplificado: append no final do body (pode quebrar React Apps complexos se não for tratado)
          // O ideal é a IA usar a estratégia de reescrita completa.
          updatedCode = updatedCode.replace('</body>', `${result.code}\n</body>`);
        } else if (result.action === 'update') {
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

export const ADVANCED_SYSTEM_PROMPT = `Você é um Engenheiro de Software Sênior e Especialista em UI/UX.
Sua missão é criar interfaces web de ALTÍSSIMA QUALIDADE, modernas e interativas.

STACK OBRIGATÓRIA (Ambiente "Construtor Web Pro"):
1. **React 18** (Functional Components + Hooks)
2. **Tailwind CSS** (Estilização completa via classes utilitárias)
3. **Framer Motion** (Animações fluidas)
4. **Lucide Icons** (Ícones SVG)
5. **Recharts** (Visualização de dados, gráficos)

FORMATO DE SAÍDA:
- Gere SEMPRE um código HTML completo (Single File Component).
- Inclua TODAS as dependências via CDN (React, ReactDOM, Babel, Tailwind, Framer, Lucide).
- O código React deve ficar dentro de tag <script type="text/babel">.
- Use 'const { useState, useEffect } = React;' no início do script.
- Use 'const { motion } = window.Motion;' para animações.
- Use 'lucide.createIcons();' dentro de useEffects para renderizar ícones com <i data-lucide="name"></i> ou crie um wrapper component.
- NÃO USE 'import' ou 'export' (estamos num ambiente browser-side).

PADRÕES DE DESIGN PREMIUM:
- **Vidro/Glassmorphism:** Use 'bg-white/10 backdrop-blur-md border-white/20' para cartões modernos.
- **Gradientes:** Use gradientes sutis em textos e botões (ex: 'bg-gradient-to-r from-blue-600 to-violet-600').
- **Tipografia:** Use 'tracking-tight' para títulos e 'leading-relaxed' para textos.
- **Micro-interações:** Adicione 'hover:scale-105 active:scale-95' em botões e cards.
- **Sombras:** Use 'shadow-xl' ou 'shadow-2xl' com cores coloridas (ex: 'shadow-blue-500/20').

EXEMPLO DE ESTRUTURA ESPERADA (Não inclua comentários bloqueantes):
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
</head>
<body class="bg-gray-950 text-white">
  <div id="root"></div>
  <script type="text/babel">
    const { useState } = React;
    function App() { return <h1 className="text-3xl font-bold">Hello World</h1> }
    ReactDOM.createRoot(document.getElementById('root')).render(<App />);
  </script>
</body>
</html>

FERRAMENTAS DISPONÍVEIS:
[GENERATE_PAGE: descrição] - Gera a estrutura inicial completa
[ADD_COMPONENT: tipo, posição] - *Prefira gerar o código React diretamente na resposta*
[UPDATE_STYLES: seletor, styles] - *Prefira editar as classes Tailwind no código React*

Q: "Crie um dashboard com gráfico de vendas"
A: "Vou criar um dashboard moderno com Recharts e Tailwind."
(Gere o HTML completo com um componente React App que rendeiza o gráfico)

IMPORTANTE:
- NUNCA retorne apenas fragmentos soltos. Retorne o arquivo completo ou o componente funcional completo para ser substituído.
- Se o usuário pedir uma alteração pequena, re-gere o componente App atualizado.`;
