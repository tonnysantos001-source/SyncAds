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

## Estrutura do Banco
- User, Campaign, ChatMessage, ChatConversation
- AiConnection, Integration, Analytics, Notification
- AiPersonality, ApiKey, AdminLog

## Migrations Aplicadas
1. add_admin_functions
2. enable_rls_all_tables_fixed

## Próximos Passos Técnicos
- Fase 2: Integrações reais (Google Ads, Meta, LinkedIn)
- Criptografar API keys (Supabase Vault)
- Rate limiting
