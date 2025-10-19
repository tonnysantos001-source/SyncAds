// Sistema de Ferramentas de Integração para IA
import { supabase } from '../supabase';

export interface IntegrationAuditResult {
  platform: string;
  status: 'connected' | 'disconnected' | 'pending' | 'error';
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
# 🔌 SISTEMA DE CONTROLE DE INTEGRAÇÕES

Você tem controle total sobre as integrações do SyncAds. Pode auditar, testar, conectar e gerenciar todas as plataformas.

## 📋 INTEGRAÇÕES DISPONÍVEIS

### 1. **Meta Ads (Facebook/Instagram)**
**Capacidades:**
- Criar e gerenciar campanhas
- Analisar performance
- Otimizar orçamentos
- Segmentar audiências

**Para conectar:**
\`\`\`integration-action
{
  "action": "audit",
  "platform": "META_ADS"
}
\`\`\`

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
        .from('Integration')
        .select('*')
        .eq('userId', this.userId)
        .eq('platform', platform)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      const capabilities = this.getCapabilities(platform);
      const status = data ? (data.isConnected ? 'connected' : 'disconnected') : 'disconnected';
      
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
      const platforms = ['META_ADS', 'GOOGLE_ADS', 'LINKEDIN_ADS', 'TIKTOK_ADS', 'TWITTER_ADS'];
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
        .from('Integration')
        .select('platform, isConnected, lastSyncAt')
        .eq('userId', this.userId);

      if (error) throw error;

      const statusMap = new Map(data?.map(d => [d.platform, d]) || []);
      const platforms = ['META_ADS', 'GOOGLE_ADS', 'LINKEDIN_ADS', 'TIKTOK_ADS', 'TWITTER_ADS'];
      
      const statusList = platforms.map(platform => ({
        platform,
        status: statusMap.has(platform) && statusMap.get(platform)?.isConnected ? '✅ Conectada' : '❌ Desconectada',
        lastSync: statusMap.get(platform)?.lastSyncAt || 'Nunca',
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
        'Criar campanhas de Facebook e Instagram',
        'Segmentação avançada de audiência',
        'Análise de performance em tempo real',
        'Otimização automática de orçamento',
        'A/B testing de criativos',
        'Remarketing e lookalike audiences',
      ],
      GOOGLE_ADS: [
        'Campanhas de Pesquisa (Search)',
        'Anúncios Display e YouTube',
        'Shopping Ads para e-commerce',
        'Campanhas Performance Max',
        'Análise de conversões e ROI',
        'Smart Bidding automático',
      ],
      LINKEDIN_ADS: [
        'Anúncios B2B segmentados',
        'Targeting por cargo e empresa',
        'Lead Gen Forms nativos',
        'InMail patrocinado',
        'Análise de engajamento profissional',
        'Retargeting de visitantes',
      ],
      TIKTOK_ADS: [
        'Vídeos In-Feed',
        'TopView e Brand Takeover',
        'Spark Ads (boost orgânico)',
        'Segmentação por interesse e comportamento',
        'Píxel de conversão',
        'Catálogo de produtos',
      ],
      TWITTER_ADS: [
        'Tweets promovidos',
        'Segmentação por hashtags e interesse',
        'Audiências customizadas',
        'Análise de engajamento',
        'Campanhas de instalação de app',
        'Vídeos e carrosséis',
      ],
    };

    return capabilities[platform] || ['Capacidades a definir'];
  }

  // Detectar problemas
  private detectIssues(data: any, platform: string): string[] {
    const issues: string[] = [];

    if (!data) {
      issues.push('Integração não configurada');
      return issues;
    }

    if (!data.isConnected) {
      issues.push('Integração desconectada - configure credenciais');
    }

    if (!data.credentials || Object.keys(data.credentials).length === 0) {
      issues.push('Credenciais não configuradas');
    }

    if (data.lastSync) {
      const lastSync = new Date(data.lastSync);
      const hoursSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceSync > 24) {
        issues.push(`Última sincronização há ${Math.floor(hoursSinceSync)} horas - pode estar desatualizado`);
      }
    }

    return issues;
  }

  // Obter recomendações
  private getRecommendations(status: string, platform: string): string[] {
    const recommendations: string[] = [];

    if (status === 'disconnected') {
      recommendations.push(`Conecte ${this.formatPlatformName(platform)} em: Configurações → Integrações`);
      recommendations.push(`Configure sua chave de API para começar a usar`);
    }

    if (status === 'connected') {
      recommendations.push(`✅ Integração ativa! Você já pode criar campanhas`);
      recommendations.push(`Explore as capacidades disponíveis desta plataforma`);
    }

    return recommendations;
  }

  // Formatar nome da plataforma
  private formatPlatformName(platform: string): string {
    const names: Record<string, string> = {
      META_ADS: 'Meta Ads (Facebook/Instagram)',
      GOOGLE_ADS: 'Google Ads',
      LINKEDIN_ADS: 'LinkedIn Ads',
      TIKTOK_ADS: 'TikTok Ads',
      TWITTER_ADS: 'Twitter Ads (X)',
    };
    return names[platform] || platform;
  }

  // Formatar mensagem de auditoria
  private formatAuditMessage(result: IntegrationAuditResult): string {
    const icon = result.status === 'connected' ? '✅' : '❌';
    let message = `\n**${icon} ${this.formatPlatformName(result.platform)}**\n`;
    message += `Status: ${result.status === 'connected' ? '✅ Conectada' : '❌ Desconectada'}\n`;
    
    if (result.lastSync) {
      message += `Última sincronização: ${result.lastSync}\n`;
    }

    message += `\n**Capacidades:**\n`;
    result.capabilities.forEach(cap => {
      message += `• ${cap}\n`;
    });

    if (result.issues && result.issues.length > 0) {
      message += `\n**⚠️ Problemas detectados:**\n`;
      result.issues.forEach(issue => {
        message += `• ${issue}\n`;
      });
    }

    if (result.recommendations && result.recommendations.length > 0) {
      message += `\n**💡 Recomendações:**\n`;
      result.recommendations.forEach(rec => {
        message += `• ${rec}\n`;
      });
    }

    return message;
  }

  // Formatar mensagem de todas as auditorias
  private formatAllAuditsMessage(audits: IntegrationAuditResult[]): string {
    let message = `\n# 🔍 AUDITORIA COMPLETA DE INTEGRAÇÕES\n\n`;
    
    const connected = audits.filter(a => a.status === 'connected').length;
    const total = audits.length;
    
    message += `**Resumo:** ${connected}/${total} integrações ativas\n\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

    audits.forEach(audit => {
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
    
    statusList.forEach(item => {
      message += `${item.status} **${this.formatPlatformName(item.platform)}**\n`;
      message += `   └─ Última sync: ${item.lastSync}\n\n`;
    });

    return message;
  }
}

// Detectar comandos de integração
export function detectIntegrationAction(response: string): { action: string; platform?: string } | null {
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
  return response
    .replace(/```integration-action\s*\n[\s\S]*?```/g, '')
    .trim();
}

// Detectar intenção de auditoria mesmo sem bloco formal (fallback)
export function detectAuditIntentFromText(userMessage: string, aiResponse: string): { action: string; platform?: string } | null {
  const messageLower = userMessage.toLowerCase();
  const responseLower = aiResponse.toLowerCase();
  
  // Se a mensagem do usuário menciona auditoria/status e a IA confirma
  const isAuditRequest = (
    (messageLower.includes('auditor') || 
     messageLower.includes('verificar') || 
     messageLower.includes('status') ||
     messageLower.includes('listar')) &&
    (messageLower.includes('integra') || 
     messageLower.includes('conex') || 
     messageLower.includes('plataforma'))
  );

  const aiConfirmsAudit = (
    responseLower.includes('vou') && 
    (responseLower.includes('auditor') || 
     responseLower.includes('verificar'))
  );

  if (!isAuditRequest || !aiConfirmsAudit) {
    return null;
  }

  // Detectar plataforma específica
  const platforms: Record<string, string> = {
    'facebook': 'META_ADS',
    'instagram': 'META_ADS',
    'meta': 'META_ADS',
    'google': 'GOOGLE_ADS',
    'linkedin': 'LINKEDIN_ADS',
    'tiktok': 'TIKTOK_ADS',
    'twitter': 'TWITTER_ADS',
  };

  for (const [keyword, platform] of Object.entries(platforms)) {
    if (messageLower.includes(keyword)) {
      return { action: 'audit', platform };
    }
  }

  // Se não especificou plataforma, auditar todas
  return { action: 'audit_all' };
}
