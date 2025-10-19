// Sistema de Admin Tools - IA como cérebro controlador do sistema
import { supabase } from '../supabase';

export interface AdminToolResult {
  success: boolean;
  data?: any;
  error?: string;
  message: string;
}

export interface AdminCommand {
  action: 'execute_sql' | 'analyze_system' | 'manage_integration' | 'view_logs' | 'test_api' | 'get_metrics' | 'debug_issue';
  params: Record<string, any>;
}

// System prompt para Admin AI
export const adminSystemPrompt = `
# SyncAds Admin AI - Cérebro Controlador do Sistema

Você é o ADMINISTRADOR SUPREMO do sistema SyncAds. Você tem controle total sobre:
- Banco de dados (executar queries SQL)
- Integrações (conectar, testar, debugar APIs)
- Análise de sistema (métricas, logs, performance)
- Correção de bugs (identificar e resolver problemas)
- Adição de novas funcionalidades

## 🔧 CAPACIDADES ADMINISTRATIVAS

### 1. EXECUTAR SQL
Você pode executar queries SQL diretamente no banco de dados.

**Formato:**
\`\`\`admin-sql
SELECT * FROM "User" WHERE email = 'usuario@example.com';
\`\`\`

**Casos de uso:**
- Analisar dados
- Corrigir inconsistências
- Buscar informações específicas
- Criar/atualizar/deletar registros

### 2. ANALISAR SISTEMA
Você pode obter métricas completas do sistema.

**Formato:**
\`\`\`admin-analyze
{
  "type": "metrics" | "performance" | "usage" | "errors",
  "period": "24h" | "7d" | "30d"
}
\`\`\`

### 3. GERENCIAR INTEGRAÇÕES
Você pode conectar, testar e debugar integrações de APIs.

**Formato:**
\`\`\`admin-integration
{
  "action": "connect" | "test" | "disconnect" | "debug",
  "platform": "google_ads" | "meta_ads" | "linkedin_ads",
  "credentials": {...}
}
\`\`\`

### 4. VER LOGS
Você pode acessar logs do sistema para debugging.

**Formato:**
\`\`\`admin-logs
{
  "service": "api" | "auth" | "campaigns" | "chat",
  "level": "error" | "warning" | "info",
  "limit": 50
}
\`\`\`

### 5. TESTAR APIS
Você pode testar APIs externas e verificar conectividade.

**Formato:**
\`\`\`admin-test-api
{
  "service": "google_ads" | "meta_ads" | "openai",
  "endpoint": "/v1/campaigns",
  "method": "GET" | "POST"
}
\`\`\`

### 6. OBTER MÉTRICAS
Você pode buscar métricas específicas do sistema.

**Formato:**
\`\`\`admin-metrics
{
  "metric": "users" | "campaigns" | "messages" | "errors",
  "aggregation": "count" | "sum" | "avg",
  "groupBy": "day" | "week" | "month"
}
\`\`\`

### 7. DEBUG DE PROBLEMAS
Você pode analisar e debugar problemas reportados.

**Formato:**
\`\`\`admin-debug
{
  "issue": "descrição do problema",
  "context": {...}
}
\`\`\`

## 📋 REGRAS DE SEGURANÇA

1. **SEMPRE confirme ações destrutivas** (DELETE, DROP, etc.)
2. **Nunca exponha credenciais** em suas respostas
3. **Valide inputs** antes de executar comandos
4. **Documente mudanças** importantes
5. **Faça backup** antes de alterações críticas

## 💬 COMO RESPONDER

Quando o usuário pedir uma ação administrativa:
1. Confirme que entendeu a solicitação
2. Execute o comando apropriado usando os blocos acima
3. Explique o resultado em linguagem clara
4. Sugira próximos passos se necessário

Exemplo:
"Entendi! Você quer analisar quantos usuários se cadastraram nos últimos 7 dias. Vou buscar esses dados.

\`\`\`admin-sql
SELECT DATE(created_at) as date, COUNT(*) as users
FROM "User"
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
\`\`\`

✅ Resultado: Nos últimos 7 dias tivemos 42 novos cadastros, com pico no dia 15/10 (12 usuários)."

Você é proativo, preciso e sempre focado em melhorar o sistema.
`;

// Classe de Admin Tools
export class AdminTools {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  // Executar SQL query
  async executeSQL(query: string): Promise<AdminToolResult> {
    try {
      // Validar que não é uma query destrutiva sem confirmação
      const isDangerous = /DROP|TRUNCATE|DELETE\s+FROM\s+"User"|DELETE\s+FROM\s+"Campaign"/i.test(query);
      
      if (isDangerous) {
        return {
          success: false,
          error: 'Query perigosa detectada. Confirmação necessária.',
          message: '⚠️ Esta query pode ser destrutiva. Por favor, confirme explicitamente.',
        };
      }

      const { data, error } = await supabase.rpc('execute_admin_query', {
        query_text: query,
      });

      if (error) {
        return {
          success: false,
          error: error.message,
          message: `❌ Erro ao executar SQL: ${error.message}`,
        };
      }

      return {
        success: true,
        data,
        message: `✅ Query executada com sucesso. ${Array.isArray(data) ? data.length : 0} registros retornados.`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: `❌ Erro: ${error.message}`,
      };
    }
  }

  // Analisar sistema
  async analyzeSystem(type: string, period: string): Promise<AdminToolResult> {
    try {
      let query = '';
      let message = '';

      switch (type) {
        case 'metrics':
          query = `
            SELECT 
              (SELECT COUNT(*) FROM "User") as total_users,
              (SELECT COUNT(*) FROM "Campaign") as total_campaigns,
              (SELECT COUNT(*) FROM "ChatMessage") as total_messages,
              (SELECT COUNT(*) FROM "AiConnection") as total_connections
          `;
          message = '📊 Métricas gerais do sistema';
          break;

        case 'performance':
          query = `
            SELECT 
              AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_response_time,
              COUNT(*) as total_requests
            FROM "ChatMessage"
            WHERE created_at >= NOW() - INTERVAL '${period === '24h' ? '1 day' : period === '7d' ? '7 days' : '30 days'}'
          `;
          message = '⚡ Análise de performance';
          break;

        case 'usage':
          query = `
            SELECT 
              DATE(created_at) as date,
              COUNT(*) as messages_count
            FROM "ChatMessage"
            WHERE created_at >= NOW() - INTERVAL '${period === '24h' ? '1 day' : period === '7d' ? '7 days' : '30 days'}'
            GROUP BY DATE(created_at)
            ORDER BY date DESC
          `;
          message = '📈 Análise de uso';
          break;

        case 'errors':
          // Aqui você implementaria um sistema de logging de erros
          return {
            success: true,
            data: { errors: 0 },
            message: '✅ Sistema de logging de erros a ser implementado',
          };
      }

      const { data, error } = await supabase.rpc('execute_admin_query', {
        query_text: query,
      });

      if (error) throw error;

      return {
        success: true,
        data,
        message: `${message} - Período: ${period}`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: `❌ Erro ao analisar sistema: ${error.message}`,
      };
    }
  }

  // Gerenciar integrações
  async manageIntegration(action: string, platform: string, credentials?: any): Promise<AdminToolResult> {
    try {
      switch (action) {
        case 'test':
          // Testar conexão com a plataforma
          return {
            success: true,
            message: `🔍 Testando integração com ${platform}... (A implementar com APIs reais)`,
            data: { status: 'pending' },
          };

        case 'connect':
          // Conectar com a plataforma
          const { data, error } = await supabase
            .from('Integration')
            .insert({
              userId: this.userId,
              platform: platform.toUpperCase(),
              credentials: credentials || {},
              isConnected: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            })
            .select()
            .single();

          if (error) throw error;

          return {
            success: true,
            data,
            message: `✅ Integração com ${platform} iniciada. Configure as credenciais.`,
          };

        case 'disconnect':
          await supabase
            .from('Integration')
            .update({ isConnected: false })
            .eq('platform', platform.toUpperCase())
            .eq('userId', this.userId);

          return {
            success: true,
            message: `✅ Integração com ${platform} desconectada.`,
          };

        default:
          return {
            success: false,
            error: 'Ação desconhecida',
            message: '❌ Ação não reconhecida',
          };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: `❌ Erro ao gerenciar integração: ${error.message}`,
      };
    }
  }

  // Obter métricas específicas
  async getMetrics(metric: string, aggregation: string, groupBy: string): Promise<AdminToolResult> {
    try {
      let table = '';
      let field = '*';

      switch (metric) {
        case 'users':
          table = 'User';
          break;
        case 'campaigns':
          table = 'Campaign';
          break;
        case 'messages':
          table = 'ChatMessage';
          break;
        default:
          return {
            success: false,
            error: 'Métrica desconhecida',
            message: '❌ Métrica não reconhecida',
          };
      }

      const query = `
        SELECT 
          DATE_TRUNC('${groupBy}', created_at) as period,
          ${aggregation === 'count' ? 'COUNT(*)' : aggregation === 'sum' ? 'SUM(1)' : 'AVG(1)'} as value
        FROM "${table}"
        GROUP BY period
        ORDER BY period DESC
        LIMIT 30
      `;

      const { data, error } = await supabase.rpc('execute_admin_query', {
        query_text: query,
      });

      if (error) throw error;

      return {
        success: true,
        data,
        message: `📊 Métricas de ${metric} agrupadas por ${groupBy}`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: `❌ Erro ao obter métricas: ${error.message}`,
      };
    }
  }
}

// Parsers para detectar comandos administrativos
export function detectAdminSQL(response: string): string | null {
  const regex = /```admin-sql\s*\n([\s\S]*?)```/;
  const match = response.match(regex);
  return match ? match[1].trim() : null;
}

export function detectAdminAnalyze(response: string): { type: string; period: string } | null {
  const regex = /```admin-analyze\s*\n([\s\S]*?)```/;
  const match = response.match(regex);
  
  if (!match) return null;
  
  try {
    return JSON.parse(match[1].trim());
  } catch {
    return null;
  }
}

export function detectAdminIntegration(response: string): { action: string; platform: string; credentials?: any } | null {
  const regex = /```admin-integration\s*\n([\s\S]*?)```/;
  const match = response.match(regex);
  
  if (!match) return null;
  
  try {
    return JSON.parse(match[1].trim());
  } catch {
    return null;
  }
}

export function detectAdminMetrics(response: string): { metric: string; aggregation: string; groupBy: string } | null {
  const regex = /```admin-metrics\s*\n([\s\S]*?)```/;
  const match = response.match(regex);
  
  if (!match) return null;
  
  try {
    return JSON.parse(match[1].trim());
  } catch {
    return null;
  }
}

// Limpar blocos admin da resposta
export function cleanAdminBlocksFromResponse(response: string): string {
  return response
    .replace(/```admin-sql\s*\n[\s\S]*?```/g, '')
    .replace(/```admin-analyze\s*\n[\s\S]*?```/g, '')
    .replace(/```admin-integration\s*\n[\s\S]*?```/g, '')
    .replace(/```admin-metrics\s*\n[\s\S]*?```/g, '')
    .replace(/```admin-logs\s*\n[\s\S]*?```/g, '')
    .replace(/```admin-test-api\s*\n[\s\S]*?```/g, '')
    .replace(/```admin-debug\s*\n[\s\S]*?```/g, '')
    .trim();
}

// Verificar se usuário tem permissões de admin
export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('User')
      .select('email, plan')
      .eq('id', userId)
      .single();

    if (error) return false;

    // Você pode definir critérios de admin aqui
    // Por exemplo: plano ENTERPRISE ou email específico
    return data.plan === 'ENTERPRISE' || data.email.includes('@admin');
  } catch {
    return false;
  }
}
