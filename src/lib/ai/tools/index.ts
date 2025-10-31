/**
 * Tool Calling System - Exportações centralizadas
 *
 * Este módulo fornece todas as funcionalidades necessárias para
 * implementar Tool Calling (chamada de ferramentas) pela IA
 */

// ==========================================
// DEFINIÇÕES DE FERRAMENTAS
// ==========================================
export {
  AI_TOOLS,
  TOOL_MAP,
  TOOL_USAGE_EXAMPLES,
  getOpenAITools,
  getAnthropicTools,
  getGroqTools,
  type Tool,
} from './toolDefinitions';

// ==========================================
// EXECUTOR DE FERRAMENTAS
// ==========================================
export {
  executeTool,
  executeMultipleTools,
  type ToolCall,
  type ToolResult,
} from './toolExecutor';

// ==========================================
// PROMPTS DE SISTEMA
// ==========================================
export {
  TOOL_CALLING_SYSTEM_PROMPT,
  TOOL_DEBUG_PROMPT,
  ECOMMERCE_CONTEXT_PROMPT,
  getFullSystemPrompt,
} from './toolCallingPrompt';

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Verifica se uma resposta da IA contém chamadas de ferramentas
 */
export function hasToolCalls(response: any): boolean {
  // OpenAI/Groq format
  if (response.tool_calls && Array.isArray(response.tool_calls)) {
    return response.tool_calls.length > 0;
  }

  // Anthropic format
  if (response.content && Array.isArray(response.content)) {
    return response.content.some((item: any) => item.type === 'tool_use');
  }

  return false;
}

/**
 * Extrai tool calls de uma resposta da IA
 */
export function extractToolCalls(response: any): ToolCall[] {
  const toolCalls: ToolCall[] = [];

  // OpenAI/Groq format
  if (response.tool_calls && Array.isArray(response.tool_calls)) {
    for (const toolCall of response.tool_calls) {
      toolCalls.push({
        name: toolCall.function.name,
        arguments: JSON.parse(toolCall.function.arguments),
      });
    }
  }

  // Anthropic format
  if (response.content && Array.isArray(response.content)) {
    for (const item of response.content) {
      if (item.type === 'tool_use') {
        toolCalls.push({
          name: item.name,
          arguments: item.input,
        });
      }
    }
  }

  return toolCalls;
}

/**
 * Formata resultado de ferramenta para incluir na conversa
 */
export function formatToolResult(
  toolCall: ToolCall,
  result: ToolResult
): string {
  if (result.success) {
    return `✅ **${toolCall.name}** executado com sucesso!\n\n${result.message}`;
  } else {
    return `❌ **${toolCall.name}** falhou!\n\nErro: ${result.error}\n\n${result.message}`;
  }
}

/**
 * Formata múltiplos resultados de ferramentas
 */
export function formatMultipleToolResults(
  toolCalls: ToolCall[],
  results: ToolResult[]
): string {
  const formatted: string[] = [];

  for (let i = 0; i < toolCalls.length; i++) {
    formatted.push(formatToolResult(toolCalls[i], results[i]));
  }

  return formatted.join('\n\n---\n\n');
}

/**
 * Valida argumentos de uma tool call
 */
export function validateToolCall(toolCall: ToolCall): {
  valid: boolean;
  error?: string;
} {
  const tool = TOOL_MAP[toolCall.name];

  if (!tool) {
    return {
      valid: false,
      error: `Ferramenta "${toolCall.name}" não encontrada`,
    };
  }

  // Verificar campos obrigatórios
  const required = tool.parameters.required || [];
  for (const field of required) {
    if (!(field in toolCall.arguments)) {
      return {
        valid: false,
        error: `Campo obrigatório "${field}" não fornecido`,
      };
    }
  }

  return { valid: true };
}

/**
 * Cria um resumo das ferramentas disponíveis para a IA
 */
export function getToolsSummary(): string {
  const summary = AI_TOOLS.map((tool, index) => {
    return `${index + 1}. **${tool.name}**: ${tool.description}`;
  }).join('\n');


/**
 * Verifica se o usuário tem permissão para usar uma ferramenta
 */
export function canUseTool(
  toolName: string,
  userRole: string = 'user'
): boolean {
  // Ferramentas que requerem permissões especiais
  const adminOnlyTools = ['database_query', 'execute_python', 'send_email'];

  if (adminOnlyTools.includes(toolName)) {
    return userRole === 'admin' || userRole === 'super_admin';
  }

  return true;
}
