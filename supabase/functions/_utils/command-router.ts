/**
 * Command Router - Roteamento Inteligente entre Extensão e Python AI
 *
 * Decide automaticamente qual executor usar baseado em:
 * - Complexidade do comando
 * - Capacidades necessárias
 * - Performance requirements
 * - Contexto do usuário
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================
// TYPES & INTERFACES
// ============================================

export type ExecutorType = "EXTENSION" | "PYTHON_AI" | "HYBRID" | "EDGE_FUNCTION";

export interface DOMCommand {
  type: string;
  action?: string;
  description?: string;
  data?: any;
  context?: any;
  user_message?: string;
}

export interface RoutingContext {
  hasActiveExtension: boolean;
  extensionCapabilities: string[];
  userLocation: "extension" | "web_panel";
  currentUrl?: string;
  deviceInfo?: any;
}

export interface RoutingDecision {
  executor: ExecutorType;
  confidence: number;
  reason: string;
  explanation_user: string;
  estimated_time_seconds: number;
  fallback_executor?: ExecutorType;
  requires_confirmation?: boolean;
  capabilities_needed: string[];
}

// ============================================
// CAPABILITIES MAPPING
// ============================================

const EXECUTOR_CAPABILITIES = {
  EXTENSION: {
    name: "Extensão Chrome",
    strengths: [
      "Ações DOM diretas na página atual",
      "Feedback visual imediato",
      "Velocidade (< 1 segundo)",
      "Controle preciso do navegador do usuário",
      "Interação em tempo real",
      "Destaque visual de elementos",
    ],
    limitations: [
      "Apenas página atual",
      "Não suporta múltiplas abas simultâneas",
      "Sem execução headless",
      "Limitado a ações simples",
      "Não suporta Vision AI",
      "Não suporta workflows complexos",
    ],
    ideal_for: [
      "Cliques rápidos",
      "Preenchimento de formulários simples",
      "Leitura de elementos específicos",
      "Hover e interações visuais",
      "Screenshots",
      "Scroll",
      "Validação visual",
    ],
    max_complexity: 3,
    avg_response_time: 0.8,
  },
  PYTHON_AI: {
    name: "Python AI (Browser-Use + Vision)",
    strengths: [
      "Automação com linguagem natural",
      "Vision AI para identificar elementos",
      "Seletores semânticos (AgentQL)",
      "Workflows complexos multi-passo",
      "Múltiplas abas e contextos",
      "Execução headless em background",
      "Cross-site automation",
      "Raciocínio contextual",
    ],
    limitations: [
      "Mais lento (3-10 segundos)",
      "Não mostra feedback visual ao usuário",
      "Executa em navegador separado",
      "Custo de API (LLM calls)",
    ],
    ideal_for: [
      "Criar campanhas de anúncios completas",
      "Pesquisas e comparações em múltiplos sites",
      "Workflows de múltiplos passos",
      "Scraping inteligente",
      "Automação que requer raciocínio",
      "Tarefas em background",
      "Elementos difíceis de selecionar",
    ],
    max_complexity: 10,
    avg_response_time: 5.5,
  },
  HYBRID: {
    name: "Híbrido (Extensão + Python)",
    strengths: [
      "Combina velocidade com inteligência",
      "Feedback visual + automação complexa",
      "Melhor dos dois mundos",
    ],
    limitations: ["Mais complexo de orquestrar", "Depende de ambos estarem ativos"],
    ideal_for: [
      "Tarefas que começam simples e ficam complexas",
      "Necessita feedback visual + processamento pesado",
    ],
    max_complexity: 8,
    avg_response_time: 3.0,
  },
  EDGE_FUNCTION: {
    name: "Edge Function (Supabase)",
    strengths: [
      "Processamento no servidor",
      "Não depende de navegador",
      "Muito rápido para APIs",
    ],
    limitations: ["Sem acesso a DOM", "Limitado a APIs e dados"],
    ideal_for: [
      "Chamadas de API",
      "Processamento de dados",
      "Consultas ao banco",
      "Operações sem UI",
    ],
    max_complexity: 5,
    avg_response_time: 0.3,
  },
};

// ============================================
// COMMAND COMPLEXITY SCORING
// ============================================

interface ComplexityScore {
  score: number; // 0-10
  factors: string[];
}

function calculateComplexity(command: DOMCommand): ComplexityScore {
  let score = 1; // Base
  const factors: string[] = [];

  const message = (
    command.user_message ||
    command.description ||
    JSON.stringify(command.data) ||
    ""
  ).toLowerCase();

  // Múltiplos passos (+3)
  if (
    /criar.*(anúncio|campanha)|pesquisa.*compar|múltiplos?(passos|etapas)|workflow/i.test(
      message
    )
  ) {
    score += 3;
    factors.push("Múltiplos passos detectados");
  }

  // Linguagem natural complexa (+2)
  if (message.split(" ").length > 15) {
    score += 2;
    factors.push("Instrução complexa em linguagem natural");
  }

  // Vision necessária (+2)
  if (
    /encontr.*visual|botão.*(azul|vermelho|verde)|imagem|aparência|parece/i.test(
      message
    )
  ) {
    score += 2;
    factors.push("Requer identificação visual");
  }

  // Cross-site (+3)
  if (
    /vários sites|múltiplos sites|comparar sites|pesquisa.*google/i.test(message)
  ) {
    score += 3;
    factors.push("Múltiplos sites envolvidos");
  }

  // Múltiplas abas (+2)
  if (/nova aba|múltiplas abas|abrir.*tab/i.test(message)) {
    score += 2;
    factors.push("Múltiplas abas necessárias");
  }

  // Criação de anúncios (+4)
  if (/criar.*(anúncio|ad|campanha|campaign)|facebook.*ads|google.*ads/i.test(message)) {
    score += 4;
    factors.push("Criação de campanha publicitária");
  }

  // Ação simples (-1)
  if (
    command.type === "DOM_CLICK" ||
    command.type === "DOM_FILL" ||
    command.type === "DOM_READ"
  ) {
    score -= 1;
    factors.push("Ação simples identificada");
  }

  // Screenshot ou scroll (-1)
  if (command.type === "SCREENSHOT" || command.type === "SCROLL") {
    score -= 1;
    factors.push("Operação visual básica");
  }

  // Normalizar score (0-10)
  score = Math.max(0, Math.min(10, score));

  return { score, factors };
}

// ============================================
// ROUTING LOGIC
// ============================================

export class CommandRouter {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Decide qual executor usar para o comando
   */
  async route(
    command: DOMCommand,
    context: RoutingContext
  ): Promise<RoutingDecision> {
    console.log("🧭 [ROUTER] Analyzing command for routing...");

    // 1. Calcular complexidade
    const complexity = calculateComplexity(command);
    console.log(`📊 [ROUTER] Complexity: ${complexity.score}/10`, complexity.factors);

    // 2. Verificar disponibilidade de executores
    const hasExtension = context.hasActiveExtension;
    const hasPythonAI = await this.checkPythonAIAvailability();

    console.log(`🔌 [ROUTER] Executors available:`, {
      extension: hasExtension,
      pythonAI: hasPythonAI,
    });

    // 3. Aplicar regras de decisão
    const decision = this.applyRoutingRules(
      command,
      complexity,
      context,
      hasExtension,
      hasPythonAI
    );

    // 4. Adicionar explicação detalhada
    decision.explanation_user = this.generateUserExplanation(decision, complexity);

    console.log(`✅ [ROUTER] Decision:`, {
      executor: decision.executor,
      confidence: decision.confidence,
      reason: decision.reason,
    });

    // 5. Salvar decisão para analytics
    await this.logRoutingDecision(command, decision, complexity);

    return decision;
  }

  /**
   * Aplica regras de roteamento baseadas em heurísticas
   */
  private applyRoutingRules(
    command: DOMCommand,
    complexity: ComplexityScore,
    context: RoutingContext,
    hasExtension: boolean,
    hasPythonAI: boolean
  ): RoutingDecision {
    const { score } = complexity;

    // REGRA 1: Ações extremamente simples → EXTENSION
    if (
      score <= 2 &&
      hasExtension &&
      [
        "DOM_CLICK",
        "DOM_FILL",
        "DOM_READ",
        "SCREENSHOT",
        "SCROLL",
        "DOM_HOVER",
      ].includes(command.type)
    ) {
      return {
        executor: "EXTENSION",
        confidence: 0.95,
        reason: "Ação simples e direta, ideal para extensão",
        explanation_user: "",
        estimated_time_seconds: 1,
        capabilities_needed: ["dom_access", "visual_feedback"],
      };
    }

    // REGRA 2: Complexidade alta → PYTHON_AI
    if (score >= 7 && hasPythonAI) {
      return {
        executor: "PYTHON_AI",
        confidence: 0.9,
        reason: "Tarefa complexa que requer IA avançada e múltiplos passos",
        explanation_user: "",
        estimated_time_seconds: Math.ceil(score * 0.8),
        fallback_executor: hasExtension ? "EXTENSION" : undefined,
        capabilities_needed: [
          "natural_language",
          "vision_ai",
          "multi_step",
          "agentql",
        ],
      };
    }

    // REGRA 3: Criação de anúncios → PYTHON_AI
    if (
      /criar.*(anúncio|campanha)|facebook.*ads|google.*ads|linkedin.*ads/i.test(
        command.user_message || ""
      ) &&
      hasPythonAI
    ) {
      return {
        executor: "PYTHON_AI",
        confidence: 0.95,
        reason: "Criação de campanha publicitária requer automação completa",
        explanation_user: "",
        estimated_time_seconds: 180, // 3 minutos
        requires_confirmation: true,
        capabilities_needed: [
          "ad_creation",
          "form_filling",
          "multi_step",
          "workflow",
        ],
      };
    }

    // REGRA 4: Vision AI necessária → PYTHON_AI
    if (
      /encontr.*visual|botão.*(azul|vermelho)|parece|aparência/i.test(
        command.user_message || ""
      ) &&
      hasPythonAI
    ) {
      return {
        executor: "PYTHON_AI",
        confidence: 0.85,
        reason: "Requer identificação visual de elementos",
        explanation_user: "",
        estimated_time_seconds: 4,
        capabilities_needed: ["vision_ai", "element_detection"],
      };
    }

    // REGRA 5: Cross-site ou múltiplas abas → PYTHON_AI
    if (
      /vários sites|múltiplos sites|nova aba|pesquisa.*google/i.test(
        command.user_message || ""
      ) &&
      hasPythonAI
    ) {
      return {
        executor: "PYTHON_AI",
        confidence: 0.9,
        reason: "Operação cross-site ou múltiplas abas",
        explanation_user: "",
        estimated_time_seconds: 10,
        capabilities_needed: ["multi_tab", "cross_site", "browser_control"],
      };
    }

    // REGRA 6: Complexidade média + Extensão disponível → HYBRID
    if (score >= 4 && score <= 6 && hasExtension && hasPythonAI) {
      return {
        executor: "HYBRID",
        confidence: 0.75,
        reason:
          "Complexidade média: usar extensão para feedback e Python AI para processamento",
        explanation_user: "",
        estimated_time_seconds: 3,
        capabilities_needed: ["dom_access", "ai_processing", "visual_feedback"],
      };
    }

    // REGRA 7: Apenas API/dados → EDGE_FUNCTION
    if (
      command.type === "API_CALL" ||
      command.type === "DATA_QUERY" ||
      command.type === "DB_OPERATION"
    ) {
      return {
        executor: "EDGE_FUNCTION",
        confidence: 0.95,
        reason: "Operação de API/dados sem necessidade de DOM",
        explanation_user: "",
        estimated_time_seconds: 0.5,
        capabilities_needed: ["api_access", "database"],
      };
    }

    // FALLBACK: Decidir baseado no que está disponível
    if (hasPythonAI) {
      return {
        executor: "PYTHON_AI",
        confidence: 0.6,
        reason: "Python AI disponível, usar como padrão para flexibilidade",
        explanation_user: "",
        estimated_time_seconds: 5,
        capabilities_needed: ["ai_processing"],
      };
    }

    if (hasExtension) {
      return {
        executor: "EXTENSION",
        confidence: 0.5,
        reason: "Apenas extensão disponível, tentar executar localmente",
        explanation_user: "",
        estimated_time_seconds: 2,
        capabilities_needed: ["dom_access"],
      };
    }

    // Sem executores disponíveis
    return {
      executor: "EDGE_FUNCTION",
      confidence: 0.2,
      reason: "Nenhum executor DOM disponível, limitado a operações de servidor",
      explanation_user: "",
      estimated_time_seconds: 1,
      capabilities_needed: [],
    };
  }

  /**
   * Gera explicação amigável para o usuário
   */
  private generateUserExplanation(
    decision: RoutingDecision,
    complexity: ComplexityScore
  ): string {
    const executor = EXECUTOR_CAPABILITIES[decision.executor];
    const timeStr =
      decision.estimated_time_seconds < 60
        ? `${decision.estimated_time_seconds}s`
        : `${Math.ceil(decision.estimated_time_seconds / 60)}min`;

    let explanation = `🤖 **Vou usar: ${executor.name}**\n\n`;

    // Por que essa escolha
    explanation += `✅ **Motivo:**\n`;
    explanation += `${decision.reason}\n\n`;

    // Tempo estimado
    explanation += `⏱️ **Tempo estimado:** ~${timeStr}\n\n`;

    // Capacidades necessárias
    if (decision.capabilities_needed.length > 0) {
      explanation += `🔧 **Capacidades usadas:**\n`;
      decision.capabilities_needed.forEach((cap) => {
        explanation += `• ${cap}\n`;
      });
      explanation += "\n";
    }

    // Explicar por que essa é a melhor escolha
    if (decision.executor === "PYTHON_AI") {
      explanation += `💡 **Por que Python AI?**\n`;
      explanation += `• Tarefa complexa (complexidade: ${complexity.score}/10)\n`;
      explanation += `• Requer raciocínio e automação inteligente\n`;
      explanation += `• Você pode continuar trabalhando enquanto executo\n\n`;

      if (decision.fallback_executor) {
        explanation += `🔄 **Fallback:** Se falhar, tento via ${EXECUTOR_CAPABILITIES[decision.fallback_executor].name}\n\n`;
      }
    } else if (decision.executor === "EXTENSION") {
      explanation += `💡 **Por que Extensão?**\n`;
      explanation += `• Ação simples e rápida\n`;
      explanation += `• Você verá o que estou fazendo em tempo real\n`;
      explanation += `• Feedback visual imediato\n\n`;
    } else if (decision.executor === "HYBRID") {
      explanation += `💡 **Por que Híbrido?**\n`;
      explanation += `• Combina velocidade da extensão com inteligência do Python\n`;
      explanation += `• Você terá feedback visual + automação avançada\n\n`;
    }

    // Alternativa se usuário quiser mudar
    explanation += `💬 **Quer usar outro método?** Só me avisar!\n`;

    return explanation;
  }

  /**
   * Verifica se Python AI está disponível
   */
  private async checkPythonAIAvailability(): Promise<boolean> {
    try {
      // Verificar se serviço Python está rodando
      // TODO: Fazer health check real para o serviço Python
      const pythonServiceUrl = Deno.env.get("PYTHON_SERVICE_URL");

      if (!pythonServiceUrl) {
        console.warn("⚠️ [ROUTER] PYTHON_SERVICE_URL not configured");
        return false;
      }

      // Health check simples (com timeout)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      try {
        const response = await fetch(`${pythonServiceUrl}/health`, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response.ok;
      } catch (error) {
        clearTimeout(timeoutId);
        console.warn("⚠️ [ROUTER] Python AI health check failed:", error);
        return false;
      }
    } catch (error) {
      console.error("❌ [ROUTER] Error checking Python AI availability:", error);
      return false;
    }
  }

  /**
   * Salva decisão de roteamento para analytics
   */
  private async logRoutingDecision(
    command: DOMCommand,
    decision: RoutingDecision,
    complexity: ComplexityScore
  ): Promise<void> {
    try {
      await this.supabase.from("routing_analytics").insert({
        command_type: command.type,
        command_message: command.user_message?.substring(0, 500) || null,
        executor_chosen: decision.executor,
        confidence: decision.confidence,
        complexity_score: complexity.score,
        complexity_factors: complexity.factors,
        estimated_time: decision.estimated_time_seconds,
        capabilities_needed: decision.capabilities_needed,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("⚠️ [ROUTER] Failed to log routing decision:", error);
      // Não falhar o roteamento por causa de log
    }
  }

  /**
   * Fornece recomendação de chat para o usuário
   */
  async recommendChat(
    userMessage: string,
    currentLocation: "extension" | "web_panel"
  ): Promise<{
    recommended: "extension" | "web_panel";
    reason: string;
    confidence: number;
  }> {
    const command: DOMCommand = {
      type: "UNKNOWN",
      user_message: userMessage,
    };

    const complexity = calculateComplexity(command);
    const message = userMessage.toLowerCase();

    // Ações rápidas → Extensão
    if (
      complexity.score <= 2 &&
      /click|preenche|leia|scroll|hover|screenshot/i.test(message)
    ) {
      return {
        recommended: "extension",
        reason:
          "Ação rápida e simples. A extensão te mostrará o que está acontecendo em tempo real.",
        confidence: 0.9,
      };
    }

    // Tarefas complexas → Web Panel (Python AI)
    if (complexity.score >= 6) {
      return {
        recommended: "web_panel",
        reason:
          "Tarefa complexa que requer IA avançada. Melhor usar o painel web onde tenho acesso a automação completa.",
        confidence: 0.85,
      };
    }

    // Já está no lugar certo
    if (complexity.score >= 4 && currentLocation === "web_panel") {
      return {
        recommended: "web_panel",
        reason: "Você já está no lugar ideal para essa tarefa!",
        confidence: 0.8,
      };
    }

    if (complexity.score <= 3 && currentLocation === "extension") {
      return {
        recommended: "extension",
        reason: "Você já está no lugar ideal para essa tarefa!",
        confidence: 0.8,
      };
    }

    // Neutro
    return {
      recommended: currentLocation,
      reason:
        "Posso executar em ambos os lugares. Continue onde está mais confortável.",
      confidence: 0.5,
    };
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Cria instância do router
 */
export function createRouter(supabase: SupabaseClient): CommandRouter {
  return new CommandRouter(supabase);
}

/**
 * Explica capacidades de cada executor para o usuário
 */
export function explainExecutorCapabilities(): Record<
  ExecutorType,
  {
    name: string;
    when_to_use: string;
    strengths: string[];
    limitations: string[];
  }
> {
  return {
    EXTENSION: {
      name: "🔌 Extensão Chrome (no seu navegador)",
      when_to_use: "Para ações rápidas e simples na página atual",
      strengths: EXECUTOR_CAPABILITIES.EXTENSION.strengths,
      limitations: EXECUTOR_CAPABILITIES.EXTENSION.limitations,
    },
    PYTHON_AI: {
      name: "🤖 Python AI (automação inteligente)",
      when_to_use: "Para tarefas complexas, múltiplos passos, ou criação de anúncios",
      strengths: EXECUTOR_CAPABILITIES.PYTHON_AI.strengths,
      limitations: EXECUTOR_CAPABILITIES.PYTHON_AI.limitations,
    },
    HYBRID: {
      name: "⚡ Híbrido (melhor dos dois)",
      when_to_use: "Quando precisa de feedback visual E automação complexa",
      strengths: EXECUTOR_CAPABILITIES.HYBRID.strengths,
      limitations: EXECUTOR_CAPABILITIES.HYBRID.limitations,
    },
    EDGE_FUNCTION: {
      name: "⚙️ Edge Function (servidor)",
      when_to_use: "Para operações de API e dados sem necessidade de navegador",
      strengths: EXECUTOR_CAPABILITIES.EDGE_FUNCTION.strengths,
      limitations: EXECUTOR_CAPABILITIES.EDGE_FUNCTION.limitations,
    },
  };
}

/**
 * Valida se comando pode ser executado pelo executor escolhido
 */
export function validateExecutorCapability(
  executor: ExecutorType,
  command: DOMCommand
): { valid: boolean; reason?: string } {
  const caps = EXECUTOR_CAPABILITIES[executor];

  if (executor === "EDGE_FUNCTION" && command.type.startsWith("DOM_")) {
    return {
      valid: false,
      reason: "Edge Functions não têm acesso ao DOM. Use EXTENSION ou PYTHON_AI.",
    };
  }

  if (executor === "EXTENSION" && /multiple.?tabs|new.?tab/i.test(command.user_message || "")) {
    return {
      valid: false,
      reason: "Extensão não suporta múltiplas abas. Use PYTHON_AI.",
    };
  }

  const complexity = calculateComplexity(command);
  if (complexity.score > caps.max_complexity) {
    return {
      valid: false,
      reason: `Complexidade (${complexity.score}) excede capacidade do executor (${caps.max_complexity}). Considere outro executor.`,
    };
  }

  return { valid: true };
}
