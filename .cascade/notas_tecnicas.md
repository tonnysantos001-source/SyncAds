# Notas Técnicas - SyncAds

## Arquitetura Atual

### Admin AI
- Localização: `src/lib/ai/adminTools.ts`
- Função SQL: `execute_admin_query()` no Supabase
- System prompts: `adminSystemPrompt`, `campaignSystemPrompt`, `aiSystemPrompt`
- Parsers: `detectAdminSQL`, `detectAdminAnalyze`, `detectAdminIntegration`, `detectAdminMetrics`

### Segurança
- RLS habilitado em 11 tabelas
- 40+ políticas implementadas
- AdminLog para auditoria

### Chat
- Sidebar colapsável: ✅ implementado (linha 338, ChatPage.tsx)
- Nova conversa: ✅ implementado (linha 278-285, ChatPage.tsx)
- Context window: 20 mensagens

### Campanhas
- Criação manual: ❌ removida
- Criação via IA: ✅ única forma
- Card de instruções adicionado

### Chaves de API
- Detecção automática de provedor pela chave
- Padrões suportados: OpenAI (sk-), OpenRouter (sk-or-v1-), Groq (gsk_), Anthropic (sk-ant-), Together AI (hex 64 chars)
- URL Base e Modelo preenchidos automaticamente
- UI simplificada - apenas cola a chave

## Estrutura do Banco
- User, Campaign, ChatMessage, ChatConversation
- AiConnection, Integration, Analytics, Notification
- AiPersonality, ApiKey, AdminLog

## Migrations Aplicadas
1. add_admin_functions
2. enable_rls_all_tables_fixed

## Deploy
- Netlify configurado com Node.js 20
- Build: `npm install && npm run build`
- Publish: `dist`
- Fix: Componente alert.tsx criado (estava faltando)
- Fix: AiConnectionModal agora faz trim() automático nas chaves (remove espaços)

## Sistema de Integrações OAuth
- Estrutura criada: types.ts, integrationsService.ts, integrationParsers.ts
- Suporta OAuth para: Google Ads, Meta Ads, LinkedIn, Twitter, TikTok, Google Analytics
- Fluxo: IA detecta comando → Gera URL OAuth → Usuário autoriza → Callback processa
- Comandos: ```integration-connect:slug```, ```integration-disconnect:slug```, ```integration-status```
- Página callback: /integrations/callback
- Migration: add_oauth_state_table.sql (precisa aplicar no Supabase)

## Próximos Passos Técnicos
- Aplicar migration OAuthState no Supabase
- Configurar Client IDs das plataformas (env vars)
- Implementar refresh token automático
- Criptografar tokens (Supabase Vault)
- Rate limiting
