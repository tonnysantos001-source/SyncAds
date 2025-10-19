// Parsers para detectar comandos de integração na resposta da IA
import { IntegrationSlug } from './types';

export interface IntegrationConnectCommand {
  action: 'connect';
  slug: IntegrationSlug;
}

export interface IntegrationDisconnectCommand {
  action: 'disconnect';
  slug: IntegrationSlug;
}

export interface IntegrationStatusCommand {
  action: 'status';
  slug?: IntegrationSlug; // Se vazio, lista todas
}

export type IntegrationCommand = 
  | IntegrationConnectCommand 
  | IntegrationDisconnectCommand 
  | IntegrationStatusCommand;

/**
 * Detecta comando de conectar integração
 * Formato: ```integration-connect:google_ads```
 */
export function detectIntegrationConnect(text: string): IntegrationConnectCommand | null {
  const regex = /```integration-connect:(\w+)```/;
  const match = text.match(regex);
  
  if (match) {
    return {
      action: 'connect',
      slug: match[1] as IntegrationSlug
    };
  }
  
  return null;
}

/**
 * Detecta comando de desconectar integração
 * Formato: ```integration-disconnect:google_ads```
 */
export function detectIntegrationDisconnect(text: string): IntegrationDisconnectCommand | null {
  const regex = /```integration-disconnect:(\w+)```/;
  const match = text.match(regex);
  
  if (match) {
    return {
      action: 'disconnect',
      slug: match[1] as IntegrationSlug
    };
  }
  
  return null;
}

/**
 * Detecta comando de verificar status
 * Formato: ```integration-status``` ou ```integration-status:google_ads```
 */
export function detectIntegrationStatus(text: string): IntegrationStatusCommand | null {
  const regex = /```integration-status(?::(\w+))?```/;
  const match = text.match(regex);
  
  if (match) {
    return {
      action: 'status',
      slug: match[1] as IntegrationSlug | undefined
    };
  }
  
  return null;
}

/**
 * Detecta qualquer comando de integração
 */
export function detectIntegrationCommand(text: string): IntegrationCommand | null {
  return (
    detectIntegrationConnect(text) ||
    detectIntegrationDisconnect(text) ||
    detectIntegrationStatus(text)
  );
}

/**
 * Remove blocos de comando da resposta
 */
export function cleanIntegrationBlocks(text: string): string {
  return text
    .replace(/```integration-connect:\w+```/g, '')
    .replace(/```integration-disconnect:\w+```/g, '')
    .replace(/```integration-status(?::\w+)?```/g, '')
    .trim();
}

/**
 * System prompt para IA sobre integrações
 */
export const integrationSystemPrompt = `
## 🔗 GERENCIAMENTO DE INTEGRAÇÕES

Você pode conectar e gerenciar integrações com plataformas de anúncios de forma SIMPLES e AUTOMÁTICA.

### COMANDOS DISPONÍVEIS:

**1. CONECTAR INTEGRAÇÃO (SIMPLES - COM BOTÕES)**
Quando o usuário pedir para conectar uma plataforma, use:
\`\`\`integration-connect:SLUG\`\`\`

O sistema mostrará botões interativos "Skip" e "Connect [Platform]" automaticamente.

Plataformas disponíveis:
- google_ads - Google Ads
- meta_ads - Meta Ads (Facebook + Instagram)
- facebook_ads - Facebook Ads
- linkedin_ads - LinkedIn Ads
- google_analytics - Google Analytics
- twitter_ads - Twitter/X Ads
- tiktok_ads - TikTok Ads

**Exemplo (CORRETO):**
Usuário: "Conecte o Facebook Ads"
Você: "I'll need to connect your Facebook account to continue.

\`\`\`integration-connect:facebook_ads\`\`\`"

**IMPORTANTE:** Seja BREVE. O sistema mostrará os botões automaticamente. Não dê instruções extras.

**2. DESCONECTAR INTEGRAÇÃO**
\`\`\`integration-disconnect:SLUG\`\`\`

**3. VERIFICAR STATUS**
\`\`\`integration-status\`\`\` - Lista todas
\`\`\`integration-status:SLUG\`\`\` - Verifica uma específica

### REGRAS IMPORTANTES:
1. ✅ Use frases CURTAS e DIRETAS (estilo Claude.ai)
2. ✅ Confie no sistema - ele mostrará os botões
3. ❌ NÃO peça ao usuário para "clicar no link"
4. ❌ NÃO dê instruções técnicas
5. ❌ NÃO mencione "autorização" ou "permissões"

**Exemplo BOM:**
"I'll need to connect your Facebook account to continue."

**Exemplo RUIM:**
"Vou conectar o Facebook Ads para você! Clique no link abaixo para autorizar o acesso. Você precisará fazer login e dar permissões..."
`;
