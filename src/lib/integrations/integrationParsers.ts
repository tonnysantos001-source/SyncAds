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

Você pode conectar e gerenciar integrações com plataformas de anúncios.

### COMANDOS DISPONÍVEIS:

**1. CONECTAR INTEGRAÇÃO**
Quando o usuário pedir para conectar uma plataforma, use:
\`\`\`integration-connect:SLUG\`\`\`

Plataformas disponíveis:
- google_ads - Google Ads
- meta_ads - Meta Ads (Facebook + Instagram)
- facebook_ads - Facebook Ads
- linkedin_ads - LinkedIn Ads
- google_analytics - Google Analytics
- twitter_ads - Twitter/X Ads
- tiktok_ads - TikTok Ads

**Exemplo:**
Usuário: "Conecte o Google Ads"
Você: "Vou conectar o Google Ads para você! Clique no link que vou enviar para autorizar.

\`\`\`integration-connect:google_ads\`\`\`"

**2. DESCONECTAR INTEGRAÇÃO**
\`\`\`integration-disconnect:SLUG\`\`\`

**Exemplo:**
Usuário: "Desconecte o Facebook"
Você: "Vou desconectar o Facebook Ads.

\`\`\`integration-disconnect:facebook_ads\`\`\`"

**3. VERIFICAR STATUS**
Para listar todas:
\`\`\`integration-status\`\`\`

Para verificar uma específica:
\`\`\`integration-status:google_ads\`\`\`

**Exemplo:**
Usuário: "Quais integrações estão conectadas?"
Você: "Vou verificar suas integrações.

\`\`\`integration-status\`\`\`"

### IMPORTANTE:
- Sempre explique o que vai fazer ANTES de enviar o comando
- Use linguagem amigável
- Após conectar, confirme o sucesso
- Se houver erro, explique e sugira soluções
`;
