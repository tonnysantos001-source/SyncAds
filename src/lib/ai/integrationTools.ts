// Sistema de Ferramentas de Integração para IA
import { supabase } from "../supabase";

// Interface para ações de integração
export interface IntegrationActionParams {
  action: string;
  platform: string;
  params?: any;
}

export interface IntegrationActionResult {
  success: boolean;
  data?: any;
  error?: string;
  message: string;
}

export interface IntegrationAuditResult {
  platform: string;
  status: "connected" | "disconnected" | "pending" | "error";
  lastSync?: string;
  capabilities: string[];
  issues?: string[];
  recommendations?: string[];
}

export interface IntegrationToolResult {
  success: boolean;
  data?: any;
  error?: string;
  message: string;
}

// Prompt específico para controle de integrações
export const integrationControlPrompt = `
# 🔌 SISTEMA DE CONTROLE DE INTEGRAÇÕES - FUNCIONAL

Você tem controle REAL sobre as integrações do SyncAds. Pode criar, analisar e otimizar campanhas diretamente nas plataformas.

## 📋 META ADS - CONTROLE TOTAL ✅

**Você pode EXECUTAR estas ações:**

### 1. ANALISAR CAMPANHA
\`\`\`integration-control
{
  "platform": "meta_ads",
  "action": "analyze_campaign",
  "params": {
    "campaignId": "123456789",
    "datePreset": "last_7d"
  }
}
\`\`\`
**Retorna:** CPC, CTR, ROAS, conversões, recomendações

### 2. LISTAR CAMPANHAS
\`\`\`integration-control
{
  "platform": "meta_ads",
  "action": "get_campaigns",
  "params": {
    "adAccountId": "act_123456",
    "limit": 25
  }
}
\`\`\`

### 3. CRIAR CAMPANHA
\`\`\`integration-control
{
  "platform": "meta_ads",
  "action": "create_campaign",
  "params": {
    "adAccountId": "act_123456",
    "name": "Nova Campanha",
    "objective": "CONVERSIONS",
    "status": "PAUSED",
    "dailyBudget": 100
  }
}
\`\`\`

### 4. OTIMIZAR CAMPANHA
\`\`\`integration-control
{
  "platform": "meta_ads",
  "action": "optimize_campaign",
  "params": {
    "campaignId": "123456789",
    "adAccountId": "act_123456",
    "strategy": "increase_budget",
    "amount": 30
  }
}
\`\`\`
**Estratégias:** increase_budget, decrease_budget, pause, adjust_bidding

## 📊 QUANDO USAR

**Usuário:** "Analise minha campanha do Facebook"
**Você:** Use \`integration-control\` com action \`analyze_campaign\`

**Usuário:** "Otimize minha campanha de maior ROAS"
**Você:**
1. Liste campanhas
2. Analise métricas
3. Use \`optimize_campaign\` com strategy \`increase_budget\`

## ⚠️ REGRAS

1. SEMPRE use blocos \`\`\`integration-control
2. SEMPRE retorne dados REAIS das APIs
3. NÃO invente métricas
4. Seja específico nas recomendações baseadas em dados reais

### 2. **Google Ads**
**Capacidades:**
- Campanhas de Pesquisa
- Display e YouTube
- Shopping Ads
- Análise de conversões

**Para conectar:**
\`\`\`integration-action
{
  "action": "audit",
  "platform": "GOOGLE_ADS"
}
\`\`\`

### 3. **LinkedIn Ads**
**Capacidades:**
- Anúncios B2B
- Segmentação profissional
- Lead generation
- InMail patrocinado

**Para conectar:**
\`\`\`integration-action
{
  "action": "audit",
  "platform": "LINKEDIN_ADS"
}
\`\`\`

### 4. **TikTok Ads**
**Capacidades:**
- Vídeos virais
- Segmentação por interesse
- Spark Ads
- Píxel de conversão

**Para conectar:**
\`\`\`integration-action
{
  "action": "audit",
  "platform": "TIKTOK_ADS"
}
\`\`\`

### 5. **Twitter Ads (X)**
**Capacidades:**
- Tweets promovidos
- Segmentação por hashtags
- Audiências customizadas
- Análise de engajamento

**Para conectar:**
\`\`\`integration-action
{
  "action": "audit",
  "platform": "TWITTER_ADS"
}
\`\`\`

## 🔧 AÇÕES DISPONÍVEIS

### 1. AUDITAR INTEGRAÇÃO
Verifica o status atual de uma integração e suas capacidades.

\`\`\`integration-action
{
  "action": "audit",
  "platform": "META_ADS"
}
\`\`\`

**Retorna:**
- Status (conectada/desconectada)
- Última sincronização
- Capacidades disponíveis
- Problemas detectados
- Recomendações

### 2. AUDITAR TODAS
Verifica todas as integrações de uma só vez.

\`\`\`integration-action
{
  "action": "audit_all"
}
\`\`\`

### 3. TESTAR CONEXÃO
Testa se uma integração está funcionando.

\`\`\`integration-action
{
  "action": "test",
  "platform": "GOOGLE_ADS"
}
\`\`\`

### 4. VERIFICAR CAPACIDADES
Lista o que você pode fazer com uma integração específica.

\`\`\`integration-action
{
  "action": "capabilities",
  "platform": "META_ADS"
}
\`\`\`

### 5. DIAGNOSTICAR PROBLEMAS
Identifica e sugere soluções para problemas.

\`\`\`integration-action
{
  "action": "diagnose",
  "platform": "LINKEDIN_ADS"
}
\`\`\`

### 6. LISTAR STATUS
Mostra status resumido de todas as integrações.

\`\`\`integration-action
{
  "action": "list_status"
}
\`\`\`

## 📊 EXEMPLO DE AUDITORIA

Quando o usuário pedir para auditar integrações, você deve:

1. Usar o comando \`audit_all\`
2. Analisar os resultados
3. Apresentar um relatório claro
4. Sugerir ações se necessário

**Exemplo de resposta:**

"Vou realizar uma auditoria completa nas integrações. Um momento...

\`\`\`integration-action
{
  "action": "audit_all"
}
\`\`\`

✅ **Auditoria Concluída**

**Meta Ads (Facebook/Instagram):**
- Status: ❌ Desconectada
- Ação: Configure sua chave de API no menu Integrações
- Capacidades: Criar campanhas, análise de performance, otimização de orçamento

**Google Ads:**
- Status: ✅ Conectada
- Última sync: Há 2 horas
- Capacidades: Campanhas ativas, análise funcionando
- ⚠️ Aviso: Orçamento próximo do limite

**LinkedIn Ads:**
- Status: ❌ Desconectada
- Ação: Conecte para campanhas B2B

**Recomendações:**
1. Conecte Meta Ads para ampliar alcance
2. Aumente orçamento do Google Ads
3. Configure LinkedIn para público corporativo"

## 🎯 QUANDO USAR CADA AÇÃO

- **audit / audit_all**: Quando usuário pede "auditar", "verificar", "status"
- **test**: Quando precisa confirmar se integração funciona
- **capabilities**: Quando usuário pergunta "o que posso fazer"
- **diagnose**: Quando há erros ou problemas
- **list_status**: Para visão rápida de todas

## 🚨 REGRAS IMPORTANTES

1. **Sempre use os blocos de código** \`\`\`integration-action
2. **JSON válido** dentro dos blocos
3. **Plataformas em CAPS**: META_ADS, GOOGLE_ADS, etc.
4. **Seja específico** em suas recomendações
5. **Não invente dados** - use apenas o que o sistema retornar

## 💡 DICAS

- Se usuário não especificar plataforma, faça \`audit_all\`
- Sempre explique o resultado em linguagem clara
- Sugira próximos passos práticos
- Destaque problemas com ⚠️ ou ❌
- Celebre sucessos com ✅ ou 🎉
`;

// Classe de ferramentas de integração
export class IntegrationTools {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  // Auditar uma integração específica
  async auditIntegration(platform: string): Promise<IntegrationToolResult> {
    try {
      const { data, error } = await supabase
        .from("Integration")
        .select("*")
        .eq("userId", this.userId)
        .eq("platform", platform)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      const capabilities = this.getCapabilities(platform);
      const status = data
        ? data.isConnected
          ? "connected"
          : "disconnected"
        : "disconnected";

      const result: IntegrationAuditResult = {
        platform,
        status,
        lastSync: data?.lastSyncAt || undefined,
        capabilities,
        issues: this.detectIssues(data, platform),
        recommendations: this.getRecommendations(status, platform),
      };

      return {
        success: true,
        data: result,
        message: this.formatAuditMessage(result),
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: `❌ Erro ao auditar ${platform}: ${error.message}`,
      };
    }
  }

  // Auditar todas as integrações
  async auditAll(): Promise<IntegrationToolResult> {
    try {
      const platforms = [
        "META_ADS",
        "GOOGLE_ADS",
        "LINKEDIN_ADS",
        "TIKTOK_ADS",
        "TWITTER_ADS",
      ];
      const audits: IntegrationAuditResult[] = [];

      for (const platform of platforms) {
        const result = await this.auditIntegration(platform);
        if (result.success && result.data) {
          audits.push(result.data);
        }
      }

      return {
        success: true,
        data: audits,
        message: this.formatAllAuditsMessage(audits),
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: `❌ Erro ao auditar integrações: ${error.message}`,
      };
    }
  }

  // Listar status resumido
  async listStatus(): Promise<IntegrationToolResult> {
    try {
      const { data, error } = await supabase
        .from("Integration")
        .select("platform, isConnected, lastSyncAt")
        .eq("userId", this.userId);

      if (error) throw error;

      const statusMap = new Map(data?.map((d) => [d.platform, d]) || []);
      const platforms = [
        "META_ADS",
        "GOOGLE_ADS",
        "LINKEDIN_ADS",
        "TIKTOK_ADS",
        "TWITTER_ADS",
      ];

      const statusList = platforms.map((platform) => ({
        platform,
        status:
          statusMap.has(platform) && statusMap.get(platform)?.isConnected
            ? "✅ Conectada"
            : "❌ Desconectada",
        lastSync: statusMap.get(platform)?.lastSyncAt || "Nunca",
      }));

      return {
        success: true,
        data: statusList,
        message: this.formatStatusList(statusList),
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: `❌ Erro ao listar status: ${error.message}`,
      };
    }
  }

  // Obter capacidades de uma plataforma
  private getCapabilities(platform: string): string[] {
    const capabilities: Record<string, string[]> = {
      META_ADS: [
        "Criar campanhas de Facebook e Instagram",
        "Segmentação avançada de audiência",
        "Análise de performance em tempo real",
        "Otimização automática de orçamento",
        "A/B testing de criativos",
        "Remarketing e lookalike audiences",
      ],
      GOOGLE_ADS: [
        "Campanhas de Pesquisa (Search)",
        "Anúncios Display e YouTube",
        "Shopping Ads para e-commerce",
        "Campanhas Performance Max",
        "Análise de conversões e ROI",
        "Smart Bidding automático",
      ],
      LINKEDIN_ADS: [
        "Anúncios B2B segmentados",
        "Targeting por cargo e empresa",
        "Lead Gen Forms nativos",
        "InMail patrocinado",
        "Análise de engajamento profissional",
        "Retargeting de visitantes",
      ],
      TIKTOK_ADS: [
        "Vídeos In-Feed",
        "TopView e Brand Takeover",
        "Spark Ads (boost orgânico)",
        "Segmentação por interesse e comportamento",
        "Píxel de conversão",
        "Catálogo de produtos",
      ],
      TWITTER_ADS: [
        "Tweets promovidos",
        "Segmentação por hashtags e interesse",
        "Audiências customizadas",
        "Análise de engajamento",
        "Campanhas de instalação de app",
        "Vídeos e carrosséis",
      ],
    };

    return capabilities[platform] || ["Capacidades a definir"];
  }

  // Detectar problemas
  private detectIssues(data: any, platform: string): string[] {
    const issues: string[] = [];

    if (!data) {
      issues.push("Integração não configurada");
      return issues;
    }

    if (!data.isConnected) {
      issues.push("Integração desconectada - configure credenciais");
    }

    if (!data.credentials || Object.keys(data.credentials).length === 0) {
      issues.push("Credenciais não configuradas");
    }

    if (data.lastSync) {
      const lastSync = new Date(data.lastSync);
      const hoursSinceSync =
        (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);

      if (hoursSinceSync > 24) {
        issues.push(
          `Última sincronização há ${Math.floor(hoursSinceSync)} horas - pode estar desatualizado`,
        );
      }
    }

    return issues;
  }

  // Obter recomendações
  private getRecommendations(status: string, platform: string): string[] {
    const recommendations: string[] = [];

    if (status === "disconnected") {
      recommendations.push(
        `Conecte ${this.formatPlatformName(platform)} em: Configurações → Integrações`,
      );
      recommendations.push(`Configure sua chave de API para começar a usar`);
    }

    if (status === "connected") {
      recommendations.push(`✅ Integração ativa! Você já pode criar campanhas`);
      recommendations.push(
        `Explore as capacidades disponíveis desta plataforma`,
      );
    }

    return recommendations;
  }

  // Formatar nome da plataforma
  private formatPlatformName(platform: string): string {
    const names: Record<string, string> = {
      META_ADS: "Meta Ads (Facebook/Instagram)",
      GOOGLE_ADS: "Google Ads",
      LINKEDIN_ADS: "LinkedIn Ads",
      TIKTOK_ADS: "TikTok Ads",
      TWITTER_ADS: "Twitter Ads (X)",
    };
    return names[platform] || platform;
  }

  // Formatar mensagem de auditoria
  private formatAuditMessage(result: IntegrationAuditResult): string {
    const icon = result.status === "connected" ? "✅" : "❌";
    let message = `\n**${icon} ${this.formatPlatformName(result.platform)}**\n`;
    message += `Status: ${result.status === "connected" ? "✅ Conectada" : "❌ Desconectada"}\n`;

    if (result.lastSync) {
      message += `Última sincronização: ${result.lastSync}\n`;
    }

    message += `\n**Capacidades:**\n`;
    result.capabilities.forEach((cap) => {
      message += `• ${cap}\n`;
    });

    if (result.issues && result.issues.length > 0) {
      message += `\n**⚠️ Problemas detectados:**\n`;
      result.issues.forEach((issue) => {
        message += `• ${issue}\n`;
      });
    }

    if (result.recommendations && result.recommendations.length > 0) {
      message += `\n**💡 Recomendações:**\n`;
      result.recommendations.forEach((rec) => {
        message += `• ${rec}\n`;
      });
    }

    return message;
  }

  // Formatar mensagem de todas as auditorias
  private formatAllAuditsMessage(audits: IntegrationAuditResult[]): string {
    let message = `\n# 🔍 AUDITORIA COMPLETA DE INTEGRAÇÕES\n\n`;

    const connected = audits.filter((a) => a.status === "connected").length;
    const total = audits.length;

    message += `**Resumo:** ${connected}/${total} integrações ativas\n\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

    audits.forEach((audit) => {
      message += this.formatAuditMessage(audit);
      message += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    });

    // Recomendações gerais
    if (connected < total) {
      message += `\n**🎯 Próximos Passos:**\n`;
      message += `1. Conecte as ${total - connected} integrações pendentes\n`;
      message += `2. Configure suas chaves de API\n`;
      message += `3. Teste cada integração antes de criar campanhas\n`;
    } else {
      message += `\n**🎉 Parabéns!** Todas as integrações estão configuradas e funcionando!\n`;
    }

    return message;
  }

  // Formatar lista de status
  private formatStatusList(statusList: any[]): string {
    let message = `\n**📊 Status das Integrações:**\n\n`;

    statusList.forEach((item) => {
      message += `${item.status} **${this.formatPlatformName(item.platform)}**\n`;
      message += `   └─ Última sync: ${item.lastSync}\n\n`;
    });

    return message;
  }
}

// Detectar comandos de integração
export function detectIntegrationAction(
  response: string,
): { action: string; platform?: string } | null {
  const regex = /```integration-action\s*\n([\s\S]*?)```/;
  const match = response.match(regex);

  if (!match) return null;

  try {
    return JSON.parse(match[1].trim());
  } catch {
    return null;
  }
}

// Limpar blocos de integração da resposta
export function cleanIntegrationBlocksFromResponse(response: string): string {
  return response.replace(/```integration-action\s*\n[\s\S]*?```/g, "").trim();
}

// Detectar intenção de auditoria mesmo sem bloco formal (fallback)
export function detectAuditIntentFromText(
  userMessage: string,
  aiResponse: string,
): { action: string; platform?: string } | null {
  const messageLower = userMessage.toLowerCase();
  const responseLower = aiResponse.toLowerCase();

  // Se a mensagem do usuário menciona auditoria/status e a IA confirma
  const isAuditRequest =
    (messageLower.includes("auditor") ||
      messageLower.includes("verificar") ||
      messageLower.includes("status") ||
      messageLower.includes("listar")) &&
    (messageLower.includes("integra") ||
      messageLower.includes("conex") ||
      messageLower.includes("plataforma"));

  const aiConfirmsAudit =
    responseLower.includes("vou") &&
    (responseLower.includes("auditor") || responseLower.includes("verificar"));

  if (!isAuditRequest || !aiConfirmsAudit) {
    return null;
  }

  // Detectar plataforma específica
  const platforms: Record<string, string> = {
    facebook: "META_ADS",
    instagram: "META_ADS",
    meta: "META_ADS",
    google: "GOOGLE_ADS",
    linkedin: "LINKEDIN_ADS",
    tiktok: "TIKTOK_ADS",
    twitter: "TWITTER_ADS",
  };

  for (const [keyword, platform] of Object.entries(platforms)) {
    if (messageLower.includes(keyword)) {
      return { action: "audit", platform };
    }
  }

  // Se não especificou plataforma, auditar todas
  return { action: "audit_all" };
}

// Detectar comandos de controle de integração (META ADS, GOOGLE ADS, etc)
export function detectIntegrationControl(
  response: string,
): IntegrationActionParams | null {
  const regex = /```integration-control\s*\n([\s\S]*?)```/;
  const match = response.match(regex);

  if (!match) return null;

  try {
    const parsed = JSON.parse(match[1].trim());
    return {
      action: parsed.action,
      platform: parsed.platform,
      params: parsed.params || {},
    };
  } catch {
    return null;
  }
}

// Limpar blocos de controle da resposta
export function cleanIntegrationControlFromResponse(response: string): string {
  return response.replace(/```integration-control\s*\n[\s\S]*?```/g, "").trim();
}

// Executar ação de integração via edge function
export async function executeIntegrationControl(
  actionParams: IntegrationActionParams,
): Promise<IntegrationActionResult> {
  const { platform, action, params } = actionParams;

  try {
    // Map platform to edge function
    const functionMap: Record<string, string> = {
      meta_ads: "meta-ads-control",
      google_ads: "google-ads-control",
      linkedin_ads: "linkedin-ads-control",
      tiktok_ads: "tiktok-ads-control",
      twitter_ads: "twitter-ads-control",
    };

    const functionName = functionMap[platform.toLowerCase()];

    if (!functionName) {
      throw new Error(`Platform ${platform} not supported yet`);
    }

    // Get auth token
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw new Error("Not authenticated");
    }

    // Call edge function
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: { action, params },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) {
      throw error;
    }

    if (!data.success) {
      throw new Error(data.error || "Integration control failed");
    }

    return {
      success: true,
      data: data.data,
      message: formatIntegrationResult(platform, action, data.data),
    };
  } catch (error: any) {
    console.error("Integration control error:", error);
    return {
      success: false,
      error: error.message,
      message: `❌ Erro ao executar ${action} em ${platform}: ${error.message}`,
    };
  }
}

// Formatar resultado para exibição
function formatIntegrationResult(
  platform: string,
  action: string,
  data: any,
): string {
  let message = "";

  switch (action) {
    case "get_campaigns":
      message = `\n**📋 Campanhas do ${platform.toUpperCase()}**\n\n`;
      message += `Total: ${data.total} campanhas\n\n`;
      if (data.campaigns && data.campaigns.length > 0) {
        data.campaigns.slice(0, 5).forEach((campaign: any) => {
          message += `• **${campaign.name}**\n`;
          message += `  Status: ${campaign.status}\n`;
          message += `  Objetivo: ${campaign.objective}\n`;
          if (campaign.daily_budget) {
            message += `  Orçamento: R$ ${(parseFloat(campaign.daily_budget) / 100).toFixed(2)}/dia\n`;
          }
          message += "\n";
        });
      }
      break;

    case "analyze_campaign":
      message = `\n**📊 Análise da Campanha**\n\n`;
      message += `**${data.campaign.name}**\n`;
      message += `Status: ${data.campaign.status}\n`;
      message += `Objetivo: ${data.campaign.objective}\n\n`;

      message += `**Métricas (${data.metrics.period || "últimos 7 dias"}):**\n`;
      message += `• Impressões: ${data.metrics.impressions.toLocaleString()}\n`;
      message += `• Cliques: ${data.metrics.clicks.toLocaleString()}\n`;
      message += `• CPC: R$ ${data.metrics.cpc.toFixed(2)}\n`;
      message += `• CTR: ${data.metrics.ctr.toFixed(2)}%\n`;
      message += `• Gasto: R$ ${data.metrics.spend.toFixed(2)}\n`;

      if (data.metrics.conversions > 0) {
        message += `• Conversões: ${data.metrics.conversions}\n`;
        message += `• ROAS: ${data.metrics.roas.toFixed(2)}x\n`;
      }

      if (data.analysis && data.analysis.recommendations) {
        message += `\n**💡 Recomendações:**\n`;
        data.analysis.recommendations.forEach((rec: string) => {
          message += `• ${rec}\n`;
        });
      }
      break;

    case "create_campaign":
      message = `\n**✅ Campanha Criada**\n\n`;
      message += `${data.message}\n`;
      message += `ID: ${data.campaignId}\n`;
      break;

    case "optimize_campaign":
      message = `\n**⚡ Otimização Executada**\n\n`;
      message += `${data.message}\n`;
      message += `Campanha: ${data.campaignId}\n`;
      break;

    default:
      message = JSON.stringify(data, null, 2);
  }

  return message;
}
