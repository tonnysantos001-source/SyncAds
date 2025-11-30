// ============================================================================
// CONTEXT AWARENESS SYSTEM - Multi-Context AI Intelligence
// ============================================================================
// Sistema que permite à IA saber onde está (extensão vs painel) e sugerir
// o contexto adequado para cada tarefa
// ============================================================================

export type ContextSource = 'extension' | 'web_panel' | 'mobile' | 'api';
export type ContextCapability = 'dom' | 'python' | 'heavy_computation' | 'ml' | 'data_viz';

export interface ContextInfo {
  source: ContextSource;
  capabilities: ContextCapability[];
  limitations: string[];
  userAgent?: string;
  currentUrl?: string;
  extensionVersion?: string;
  browserInfo?: {
    name: string;
    version: string;
    platform: string;
  };
}

export interface ContextualResponse {
  message: string;
  suggestMigration?: {
    to: ContextSource;
    reason: string;
    benefits: string[];
  };
  contextWarning?: string;
}

// ============================================================================
// CONTEXT DETECTION
// ============================================================================

/**
 * Detecta o contexto atual baseado nos headers da requisição
 */
export function detectContext(headers: Headers): ContextInfo {
  const contextSource = headers.get('X-Context-Source') as ContextSource || 'web_panel';
  const userAgent = headers.get('User-Agent') || '';
  const extensionConnected = headers.get('X-Extension-Connected') === 'true';
  const currentUrl = headers.get('X-Current-URL') || undefined;
  const extensionVersion = headers.get('X-Extension-Version') || undefined;

  // Detectar informações do browser
  const browserInfo = parseBrowserInfo(userAgent);

  // Definir capacidades baseado no contexto
  const capabilities = getCapabilitiesForContext(contextSource, extensionConnected);
  const limitations = getLimitationsForContext(contextSource);

  return {
    source: contextSource,
    capabilities,
    limitations,
    userAgent,
    currentUrl,
    extensionVersion,
    browserInfo,
  };
}

/**
 * Retorna capacidades disponíveis para cada contexto
 */
function getCapabilitiesForContext(
  source: ContextSource,
  extensionConnected: boolean
): ContextCapability[] {
  const capabilities: ContextCapability[] = [];

  switch (source) {
    case 'extension':
      if (extensionConnected) {
        capabilities.push('dom');
      }
      break;

    case 'web_panel':
      capabilities.push('python', 'heavy_computation', 'ml', 'data_viz');
      if (extensionConnected) {
        capabilities.push('dom');
      }
      break;

    case 'mobile':
      // Capacidades limitadas no mobile
      break;

    case 'api':
      capabilities.push('python', 'heavy_computation', 'ml');
      break;
  }

  return capabilities;
}

/**
 * Retorna limitações de cada contexto
 */
function getLimitationsForContext(source: ContextSource): string[] {
  const limitations: Record<ContextSource, string[]> = {
    extension: [
      'Sem execução de Python',
      'Processamento limitado pelo browser',
      'Sem acesso a ML models pesados',
      'Limitado ao DOM da página atual',
    ],
    web_panel: [
      'Sem acesso direto ao DOM (requer extensão)',
      'Não pode capturar screenshots diretamente',
      'Não pode clicar em elementos',
    ],
    mobile: [
      'Capacidades limitadas',
      'Sem execução de Python',
      'Sem automação DOM',
      'Visualizações simplificadas',
    ],
    api: [
      'Sem interface visual',
      'Sem interação com usuário',
      'Resposta apenas via JSON',
    ],
  };

  return limitations[source] || [];
}

/**
 * Parse informações do browser do User-Agent
 */
function parseBrowserInfo(userAgent: string): { name: string; version: string; platform: string } {
  // Detectar browser
  let name = 'Unknown';
  if (userAgent.includes('Chrome')) name = 'Chrome';
  else if (userAgent.includes('Firefox')) name = 'Firefox';
  else if (userAgent.includes('Safari')) name = 'Safari';
  else if (userAgent.includes('Edge')) name = 'Edge';

  // Detectar versão (simplificado)
  const versionMatch = userAgent.match(/(?:Chrome|Firefox|Safari|Edge)\/(\d+)/);
  const version = versionMatch ? versionMatch[1] : 'Unknown';

  // Detectar plataforma
  let platform = 'Unknown';
  if (userAgent.includes('Windows')) platform = 'Windows';
  else if (userAgent.includes('Mac')) platform = 'macOS';
  else if (userAgent.includes('Linux')) platform = 'Linux';
  else if (userAgent.includes('Android')) platform = 'Android';
  else if (userAgent.includes('iOS')) platform = 'iOS';

  return { name, version, platform };
}

// ============================================================================
// SYSTEM PROMPTS CONTEXTUAIS
// ============================================================================

/**
 * Gera system prompt apropriado para o contexto atual
 */
export function getContextualSystemPrompt(context: ContextInfo): string {
  const basePrompt = getBasePrompt();
  const contextPrompt = getContextSpecificPrompt(context);
  const capabilitiesPrompt = getCapabilitiesPrompt(context);
  const migrationGuidance = getMigrationGuidance(context);

  return `${basePrompt}

${contextPrompt}

${capabilitiesPrompt}

${migrationGuidance}`;
}

function getBasePrompt(): string {
  return `Você é a SyncAds AI, uma assistente superinteligente especializada em automação web, marketing digital e análise de dados.

# 🎯 SUA MISSÃO

Ajudar o usuário da forma mais eficiente possível, SEMPRE considerando o contexto onde você está operando.`;
}

function getContextSpecificPrompt(context: ContextInfo): string {
  if (context.source === 'extension') {
    return `
# 🌐 VOCÊ ESTÁ NA EXTENSÃO DO CHROME (Side Panel)

## 📍 Localização Atual
- **Navegador:** ${context.browserInfo?.name} ${context.browserInfo?.version}
- **Plataforma:** ${context.browserInfo?.platform}
- **Versão da Extensão:** ${context.extensionVersion || 'Unknown'}
${context.currentUrl ? `- **URL Atual:** ${context.currentUrl}` : ''}

## ✅ O QUE VOCÊ PODE FAZER AQUI (Superpoderes DOM)

### 🖱️ Controle Total do Navegador
- **Navegar** para qualquer site instantaneamente
- **Clicar** em qualquer botão, link ou elemento
- **Preencher** formulários automaticamente
- **Extrair** dados de páginas em tempo real
- **Rolar** páginas e encontrar elementos
- **Executar** JavaScript customizado

### 🎨 Automação Visual Avançada
- **Criar anúncios** em Meta Ads, Google Ads, LinkedIn Ads
- **Pesquisar produtos** e comparar preços
- **Fazer login** automático em sites
- **Automatizar workflows** repetitivos
- **Capturar screenshots** e evidências

### 📊 Extração de Dados
- **Web scraping** inteligente
- **Extrair tabelas, imagens, links**
- **Coletar emails e contatos**
- **Monitorar mudanças** em sites
- **Exportar para CSV/Excel**

## ❌ O QUE NÃO FUNCIONA AQUI

- 🐍 **Execução de Python** (use o painel web para isso)
- 📈 **Gráficos e visualizações complexas** (use o painel web)
- 💾 **Processamento de grandes volumes de dados** (use o painel web)
- 🤖 **Machine Learning** (use o painel web)

## 💡 QUANDO VOCÊ DEVE SUGERIR MIGRAÇÃO

Se o usuário pedir:
- Executar código Python → Sugira o painel web
- Criar gráficos complexos → Sugira o painel web
- Treinar modelos ML → Sugira o painel web
- Processar milhares de linhas → Sugira o painel web

**Como sugerir:**
"Para [tarefa], é melhor usar o painel web onde temos Python e mais poder computacional. Quer que eu te leve lá?"

## 🎯 SEU COMPORTAMENTO NA EXTENSÃO

1. **Seja visual e prático** - Você está controlando o que o usuário VÊ
2. **Execute rapidamente** - Comandos DOM são instantâneos
3. **Mostre progresso** - "Abrindo Facebook... Clicando em Login... Preenchendo..."
4. **Valide resultados** - Confirme que ações funcionaram
5. **Sugira automações** - "Quer que eu faça isso automaticamente na próxima vez?"`;
  }

  if (context.source === 'web_panel') {
    return `
# 💻 VOCÊ ESTÁ NO PAINEL WEB

## 📍 Localização Atual
- **Interface:** Dashboard Web
- **Navegador:** ${context.browserInfo?.name} ${context.browserInfo?.version}
- **Capacidades Extras:** Computação pesada, Python, ML

## ✅ O QUE VOCÊ PODE FAZER AQUI (Superpoderes Computacionais)

### 🐍 Execução de Python
- **Qualquer biblioteca:** pandas, numpy, matplotlib, scikit-learn
- **Processamento de dados:** milhões de linhas
- **APIs complexas:** requests, aiohttp
- **Arquivos:** ler/escrever CSV, Excel, JSON, PDF

### 📈 Visualização e Análise
- **Gráficos avançados:** matplotlib, plotly, seaborn
- **Dashboards interativos:** criação de visualizações complexas
- **Estatísticas:** análises estatísticas detalhadas
- **Relatórios:** geração de PDFs com insights

### 🤖 Machine Learning & IA
- **Treinar modelos:** scikit-learn, TensorFlow (leve)
- **Previsões:** modelos preditivos
- **Clustering:** segmentação de clientes
- **NLP:** processamento de linguagem natural

### 💾 Processamento em Larga Escala
- **Big Data:** processar grandes volumes
- **ETL:** extract, transform, load
- **APIs:** integrar múltiplas fontes
- **Automação:** scripts complexos

## ❌ O QUE NÃO FUNCIONA AQUI

- 🖱️ **Controlar o navegador diretamente** (precisa da extensão)
- 📸 **Capturar screenshots de páginas** (precisa da extensão)
- 🎨 **Criar anúncios visualmente** (precisa da extensão)
- 👆 **Clicar em elementos de sites** (precisa da extensão)

${context.capabilities.includes('dom')
  ? `\n⚠️ **ATENÇÃO:** Você TEM a extensão conectada, então PODE controlar o navegador daqui!`
  : ''}

## 💡 QUANDO VOCÊ DEVE SUGERIR MIGRAÇÃO

Se o usuário pedir:
- Abrir sites ou clicar em botões → Sugira a extensão
- Criar anúncios visualmente → Sugira a extensão
- Fazer web scraping em tempo real → Sugira a extensão
- Automatizar ações em sites → Sugira a extensão

**Como sugerir:**
"Para controlar o navegador diretamente, você precisa usar a extensão Chrome. ${!context.capabilities.includes('dom') ? 'Quer instalar?' : 'Abra o side panel da extensão!'}"

## 🎯 SEU COMPORTAMENTO NO PAINEL

1. **Seja analítico** - Foque em dados e insights
2. **Use Python** - Mostre código quando relevante
3. **Crie visualizações** - Gráficos ajudam a entender
4. **Explique resultados** - Seja didático
5. **Sugira próximos passos** - "Com esses dados, podemos..."`;
  }

  return '# CONTEXTO DESCONHECIDO\n\nOpere em modo padrão.';
}

function getCapabilitiesPrompt(context: ContextInfo): string {
  const capabilities = context.capabilities.map(cap => {
    const icons: Record<ContextCapability, string> = {
      dom: '🌐',
      python: '🐍',
      heavy_computation: '💪',
      ml: '🤖',
      data_viz: '📊',
    };

    const descriptions: Record<ContextCapability, string> = {
      dom: 'Controle total do navegador',
      python: 'Execução de código Python',
      heavy_computation: 'Processamento pesado',
      ml: 'Machine Learning',
      data_viz: 'Visualização de dados',
    };

    return `- ${icons[cap]} **${descriptions[cap]}**`;
  }).join('\n');

  return `## 🔋 CAPACIDADES ATIVAS AGORA

${capabilities}`;
}

function getMigrationGuidance(context: ContextInfo): string {
  return `
## 🔄 GUIA DE MIGRAÇÃO INTELIGENTE

**Regras de Ouro:**

1. **Sempre valide o contexto** antes de executar
2. **Sugira migração proativamente** se tarefa incompatível
3. **Explique o motivo** da migração sugerida
4. **Ofereça alternativas** quando possível
5. **Seja honesto** sobre limitações

**Exemplos de Sugestões Corretas:**

❌ **Errado:** "Não posso fazer isso aqui."
✅ **Certo:** "Para executar Python, precisamos do painel web onde temos mais poder computacional. Posso te levar lá agora!"

❌ **Errado:** "Use a extensão."
✅ **Certo:** "Para clicar nesse botão automaticamente, precisamos da extensão Chrome que te dá superpoderes de automação. Quer instalar? Leva 30 segundos!"

## 🎓 CONTEXTO HÍBRIDO

${context.capabilities.includes('dom') && context.capabilities.includes('python')
  ? `✨ **MODO HÍBRIDO ATIVO!** Você tem TODAS as capacidades disponíveis aqui. Pode tanto controlar o navegador quanto executar Python!`
  : 'No modo híbrido (painel web + extensão), você pode fazer TUDO. Use isso a seu favor!'}
`;
}

// ============================================================================
// VALIDAÇÃO DE COMANDOS POR CONTEXTO
// ============================================================================

export interface CommandValidation {
  allowed: boolean;
  reason?: string;
  suggestion?: string;
  alternativeContext?: ContextSource;
}

/**
 * Valida se um comando pode ser executado no contexto atual
 */
export function validateCommandForContext(
  commandType: string,
  context: ContextInfo
): CommandValidation {
  const validations: Record<string, (ctx: ContextInfo) => CommandValidation> = {
    // Comandos DOM
    NAVIGATE: (ctx) => validateDomCommand(ctx, 'navegação'),
    CLICK: (ctx) => validateDomCommand(ctx, 'clique'),
    FILL_FORM: (ctx) => validateDomCommand(ctx, 'preenchimento de formulário'),
    SCREENSHOT: (ctx) => validateDomCommand(ctx, 'captura de tela'),
    EXECUTE_JS: (ctx) => validateDomCommand(ctx, 'execução de JavaScript'),
    READ_TEXT: (ctx) => validateDomCommand(ctx, 'leitura de texto'),
    SCROLL_TO: (ctx) => validateDomCommand(ctx, 'rolagem'),

    // Comandos Python
    EXECUTE_PYTHON: (ctx) => validatePythonCommand(ctx),
    INSTALL_PACKAGE: (ctx) => validatePythonCommand(ctx),
    RUN_SCRIPT: (ctx) => validatePythonCommand(ctx),

    // Comandos de análise
    CREATE_CHART: (ctx) => validateAnalysisCommand(ctx),
    GENERATE_REPORT: (ctx) => validateAnalysisCommand(ctx),
    TRAIN_MODEL: (ctx) => validateAnalysisCommand(ctx),
  };

  const validator = validations[commandType];
  if (!validator) {
    return { allowed: true }; // Comando desconhecido, permitir por padrão
  }

  return validator(context);
}

function validateDomCommand(context: ContextInfo, action: string): CommandValidation {
  if (context.capabilities.includes('dom')) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `Para ${action}, você precisa ter a extensão Chrome conectada.`,
    suggestion: context.source === 'web_panel'
      ? 'Instale a extensão Chrome para controlar o navegador!'
      : 'Conecte a extensão primeiro.',
    alternativeContext: 'extension',
  };
}

function validatePythonCommand(context: ContextInfo): CommandValidation {
  if (context.capabilities.includes('python')) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: 'Execução de Python não está disponível na extensão.',
    suggestion: 'Use o painel web onde temos Python completo!',
    alternativeContext: 'web_panel',
  };
}

function validateAnalysisCommand(context: ContextInfo): CommandValidation {
  if (context.capabilities.includes('data_viz') || context.capabilities.includes('ml')) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: 'Análise avançada requer o painel web.',
    suggestion: 'Vá para o painel web para criar visualizações e análises!',
    alternativeContext: 'web_panel',
  };
}

// ============================================================================
// SUGESTÕES PROATIVAS
// ============================================================================

export interface ProactiveSuggestion {
  type: 'migration' | 'automation' | 'optimization' | 'alternative';
  message: string;
  action?: string;
  benefit: string;
}

/**
 * Gera sugestões proativas baseadas no contexto e na mensagem do usuário
 */
export function generateProactiveSuggestions(
  userMessage: string,
  context: ContextInfo,
  conversationHistory: any[]
): ProactiveSuggestion[] {
  const suggestions: ProactiveSuggestion[] = [];

  // Detectar se usuário está tentando fazer algo incompatível
  const lowerMessage = userMessage.toLowerCase();

  // Sugerir extensão se pedir automação DOM no painel
  if (
    context.source === 'web_panel' &&
    !context.capabilities.includes('dom') &&
    (lowerMessage.includes('abra') ||
      lowerMessage.includes('clique') ||
      lowerMessage.includes('preencha') ||
      lowerMessage.includes('navegue'))
  ) {
    suggestions.push({
      type: 'migration',
      message: 'Para controlar o navegador, instale a extensão Chrome!',
      action: 'install_extension',
      benefit: 'Você terá automação web completa com controle total do navegador.',
    });
  }

  // Sugerir painel se pedir Python na extensão
  if (
    context.source === 'extension' &&
    (lowerMessage.includes('python') ||
      lowerMessage.includes('pandas') ||
      lowerMessage.includes('gráfico') ||
      lowerMessage.includes('análise'))
  ) {
    suggestions.push({
      type: 'migration',
      message: 'Para executar Python e criar análises, use o painel web!',
      action: 'open_web_panel',
      benefit: 'Você terá acesso a Python completo, ML e visualizações avançadas.',
    });
  }

  // Sugerir automação se detectar tarefa repetitiva
  if (
    conversationHistory.filter((msg) =>
      msg.content?.toLowerCase().includes(lowerMessage.slice(0, 20))
    ).length > 2
  ) {
    suggestions.push({
      type: 'automation',
      message: 'Percebi que você faz isso frequentemente. Quer que eu automatize?',
      benefit: 'Economize tempo com automação inteligente!',
    });
  }

  return suggestions;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Formata mensagem de erro contextual
 */
export function formatContextualError(
  error: string,
  context: ContextInfo,
  commandType?: string
): string {
  let message = `❌ ${error}\n\n`;

  if (commandType) {
    const validation = validateCommandForContext(commandType, context);
    if (!validation.allowed && validation.suggestion) {
      message += `💡 **Dica:** ${validation.suggestion}\n\n`;
    }
  }

  message += `📍 **Contexto atual:** ${context.source}\n`;
  message += `🔋 **Capacidades:** ${context.capabilities.join(', ')}`;

  return message;
}

/**
 * Gera link de migração entre contextos
 */
export function generateMigrationLink(
  from: ContextSource,
  to: ContextSource,
  reason: string
): string {
  const links: Record<ContextSource, string> = {
    extension: 'chrome-extension://your-extension-id/sidepanel.html',
    web_panel: 'https://syncads.com/dashboard/chat',
    mobile: 'syncads://chat',
    api: 'https://api.syncads.com/chat',
  };

  const fromName = from === 'extension' ? 'extensão' : 'painel web';
  const toName = to === 'extension' ? 'extensão' : 'painel web';

  return `Para ${reason}, você precisa usar ${toName}.

[Abrir ${toName}](${links[to]})

Você está atualmente em: ${fromName}`;
}
