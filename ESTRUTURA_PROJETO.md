# 🗂️ ESTRUTURA DO PROJETO SYNCADS

**Atualizado:** Janeiro 2025  
**Versão:** 2.0.0

---

## 📁 VISÃO GERAL

```
SyncAds/
├── 📁 src/                          # Código fonte frontend
├── 📁 supabase/                     # Backend Supabase
├── 📁 public/                       # Assets estáticos
├── 📁 tests/                        # Testes automatizados
├── 📁 docs/                         # Documentação
├── 📁 scripts/                      # Scripts utilitários
├── 📄 package.json                  # Dependências do projeto
├── 📄 tsconfig.json                 # Configuração TypeScript
├── 📄 vite.config.ts                # Configuração Vite
├── 📄 tailwind.config.js            # Configuração Tailwind
└── 📄 .env.example                  # Exemplo de variáveis de ambiente
```

---

## 🎨 FRONTEND (src/)

```
src/
│
├── 📁 components/                   # Componentes React
│   ├── 📁 ui/                      # Componentes UI (shadcn/ui)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── toast.tsx
│   │   └── ... (30+ componentes)
│   │
│   ├── ErrorBoundary.tsx           # Captura erros React
│   ├── LoadingSpinner.tsx          # Loading state
│   ├── ProtectedRoute.tsx          # Guard de autenticação
│   ├── PublicRoute.tsx             # Redirect se autenticado
│   └── LazyLoad.tsx                # Lazy loading wrapper
│
├── 📁 pages/                        # Páginas da aplicação
│   │
│   ├── 📁 auth/                    # Páginas de autenticação
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   └── ForgotPasswordPage.tsx
│   │
│   ├── 📁 public/                  # Páginas públicas
│   │   ├── LandingPage.tsx
│   │   ├── PublicCheckoutPage.tsx
│   │   └── CheckoutSuccessPage.tsx
│   │
│   ├── 📁 app/                     # Páginas autenticadas
│   │   ├── UnifiedDashboardPage.tsx
│   │   ├── ChatPage.tsx
│   │   ├── IntegrationsPage.tsx
│   │   ├── SettingsPage.tsx
│   │   ├── BillingPage.tsx
│   │   ├── CheckoutOnboardingPage.tsx
│   │   ├── DomainValidationPage.tsx
│   │   ├── ShippingPage.tsx
│   │   │
│   │   ├── 📁 campaigns/          # Campanhas
│   │   │   └── CampaignDetailsPage.tsx
│   │   │
│   │   ├── 📁 reports/            # Relatórios
│   │   │   ├── ReportsOverviewPage.tsx
│   │   │   ├── AudiencePage.tsx
│   │   │   ├── UtmsPage.tsx
│   │   │   └── AdsPage.tsx
│   │   │
│   │   ├── 📁 orders/             # Pedidos
│   │   │   ├── AllOrdersPage.tsx
│   │   │   ├── AbandonedCartsPage.tsx
│   │   │   └── PixRecoveredPage.tsx
│   │   │
│   │   ├── 📁 products/           # Produtos
│   │   │   ├── AllProductsPage.tsx
│   │   │   ├── CollectionsPage.tsx
│   │   │   └── KitsPage.tsx
│   │   │
│   │   ├── 📁 customers/          # Clientes
│   │   │   ├── AllCustomersPage.tsx
│   │   │   └── LeadsPage.tsx
│   │   │
│   │   ├── 📁 marketing/          # Marketing
│   │   │   ├── CouponsPage.tsx
│   │   │   ├── OrderBumpPage.tsx
│   │   │   ├── UpsellPage.tsx
│   │   │   ├── CrossSellPage.tsx
│   │   │   ├── DiscountBannerPage.tsx
│   │   │   ├── CashbackPage.tsx
│   │   │   └── PixelsPage.tsx
│   │   │
│   │   └── 📁 checkout/           # Checkout Config
│   │       ├── DiscountsPage.tsx
│   │       ├── CheckoutCustomizePage.tsx
│   │       ├── SocialProofPage.tsx
│   │       ├── GatewaysListPage.tsx
│   │       ├── GatewayConfigPage.tsx
│   │       └── RedirectPage.tsx
│   │
│   ├── 📁 super-admin/            # Super Admin
│   │   ├── SuperAdminDashboard.tsx
│   │   ├── AdminChatPage.tsx
│   │   ├── ClientsPage.tsx
│   │   ├── BillingPage.tsx
│   │   ├── UsagePage.tsx
│   │   ├── GatewaysPage.tsx
│   │   ├── GlobalAiPage.tsx
│   │   └── OAuthConfigPage.tsx
│   │
│   ├── IntegrationCallbackPage.tsx
│   └── NotFoundPage.tsx
│
├── 📁 lib/                          # Bibliotecas e utilitários
│   │
│   ├── 📁 ai/                      # Lógica de IA
│   │   ├── chat.ts
│   │   ├── providers.ts
│   │   └── tools.ts
│   │
│   ├── 📁 api/                     # Clientes API
│   │   ├── supabase.ts
│   │   └── external.ts
│   │
│   ├── 📁 gateways/                # Integrações de pagamento
│   │   ├── stripe.ts
│   │   ├── mercadopago.ts
│   │   ├── asaas.ts
│   │   └── pagseguro.ts
│   │
│   ├── 📁 integrations/            # Integrações externas
│   │   ├── meta-ads.ts
│   │   ├── google-ads.ts
│   │   └── shopify.ts
│   │
│   ├── config.ts                   # ✅ Configuração centralizada
│   ├── constants.ts                # Constantes
│   ├── database.types.ts           # Tipos TypeScript do DB
│   ├── errors.ts                   # ✅ Sistema de erros
│   ├── sentry.ts                   # ✅ Monitoramento
│   ├── supabase.ts                 # ✅ Cliente Supabase
│   ├── utils.ts                    # Utilitários gerais
│   └── performance.ts              # Performance helpers
│
├── 📁 hooks/                        # Custom React Hooks
│   ├── useErrorHandler.ts
│   ├── useAuth.ts
│   ├── useChat.ts
│   └── useDebounce.ts
│
├── 📁 store/                        # Estado global (Zustand)
│   ├── authStore.ts                # ✅ Autenticação
│   ├── campaignsStore.ts           # ✅ Campanhas
│   ├── chatStore.ts                # ✅ Chat/IA
│   ├── integrationsStore.ts       # ✅ Integrações
│   └── useStore.ts                 # Store global (legacy)
│
├── 📁 routes/                       # Configuração de rotas
│   ├── index.tsx
│   └── optimizedRoutes.ts
│
├── 📁 schemas/                      # Schemas Zod
│   ├── auth.ts
│   ├── campaign.ts
│   ├── product.ts
│   └── order.ts
│
├── 📁 types/                        # TypeScript types
│   ├── api.ts
│   ├── database.ts
│   └── global.d.ts
│
├── 📁 config/                       # Configurações
│   └── features.ts
│
├── 📁 data/                         # Dados estáticos
│   └── mock.ts
│
├── App.tsx                          # ✅ Componente principal
├── main.tsx                         # ✅ Entry point
├── index.css                        # Estilos globais
└── vite-env.d.ts                   # Tipos Vite
```

---

## 🗄️ BACKEND (supabase/)

```
supabase/
│
├── 📁 migrations/                   # Migrations SQL (40 arquivos)
│   ├── 20251020_fix_user_registration_rls.sql
│   ├── 20251021000000_ecommerce_complete.sql
│   ├── 20251021000001_products.sql
│   ├── 20251021000002_customers.sql
│   ├── 20251021000003_cart.sql
│   ├── 20251021000004_orders.sql
│   ├── 20251021000005_gateways.sql
│   ├── 20251021000006_marketing.sql
│   ├── 20251021000007_checkout_tracking.sql
│   ├── 20251021000008_enable_rls.sql
│   ├── 20251023153000_create_global_organization.sql
│   ├── 20251023_add_ai_quotas.sql
│   ├── 20251023_create_media_generation.sql
│   ├── 20251025000000_fix_critical_issues_complete.sql
│   ├── 20251025100000_payment_discounts.sql
│   ├── 20251025100001_checkout_redirects.sql
│   ├── 20251025160000_add_oauth_config_table.sql
│   ├── 20251026160715_fix_critical_issues_complete.sql
│   ├── 20251026170000_fix_chat_simplified.sql
│   ├── 20251026200000_verify_and_fix_rls_policies.sql
│   ├── 20251027_add_checkout_onboarding.sql
│   ├── 20251027_add_file_attachments.sql
│   ├── 20251029000000_correcoes_criticas_banco.sql
│   ├── 20251030000000_checkout_onboarding_setup.sql
│   ├── 20251030100000_remove_organization_complete.sql
│   ├── 20251030100000_subscription_system.sql
│   ├── 20251030100001_remove_organization_safe.sql
│   ├── 20251030100002_remove_organization_final.sql
│   ├── 20251030100003_remove_organization_ultra_safe.sql
│   ├── 20251030100004_cleanup_remaining_organizationid.sql
│   ├── 20251030100005_final_cleanup_organizationid.sql
│   └── 20251030100006_cleanup_pendinginvite.sql    # ✅ ÚLTIMA
│
├── 📁 functions/                    # Edge Functions (30+)
│   │
│   ├── 📁 _utils/                  # ✅ Utilitários compartilhados
│   │   ├── circuit-breaker.ts     # Circuit breaker pattern
│   │   ├── cors.ts                # CORS headers
│   │   ├── fetch-with-timeout.ts  # Fetch com timeout
│   │   ├── metrics.ts             # Métricas
│   │   ├── model-fallback.ts      # Fallback de modelos IA
│   │   ├── rate-limiter.ts        # ✅ Rate limiting
│   │   ├── retry.ts               # Retry logic
│   │   ├── search-tools.ts        # Ferramentas de busca
│   │   ├── token-counter.ts       # Contador de tokens
│   │   └── web-search.ts          # Web search
│   │
│   ├── 📁 chat-enhanced/           # ✅ Chat IA (versão atual)
│   │   └── index.ts
│   │
│   ├── 📁 process-payment/         # ✅ Processamento de pagamento
│   │   └── index.ts
│   │
│   ├── 📁 payment-webhook/         # ✅ Webhooks de pagamento
│   │   └── index.ts
│   │
│   ├── 📁 super-ai-tools/          # Ferramentas avançadas IA
│   │   └── index.ts
│   │
│   ├── 📁 advanced-scraper/        # Web scraping avançado
│   │   └── index.ts
│   │
│   ├── 📁 generate-image/          # Geração de imagens
│   │   └── index.ts
│   │
│   ├── 📁 generate-video/          # Geração de vídeos
│   │   └── index.ts
│   │
│   ├── 📁 web-scraper/             # Web scraper básico
│   │   └── index.ts
│   │
│   ├── 📁 ai-advisor/              # Consultor IA
│   │   └── index.ts
│   │
│   ├── 📁 content-assistant/       # Assistente de conteúdo
│   │   └── index.ts
│   │
│   ├── 📁 automation-engine/       # Engine de automação
│   │   └── index.ts
│   │
│   ├── 📁 advanced-analytics/      # Analytics avançados
│   │   └── index.ts
│   │
│   ├── 📁 meta-ads-tools/          # Ferramentas Meta Ads
│   │   └── index.ts
│   │
│   ├── 📁 auth-meta/               # Auth Meta Ads
│   │   └── index.ts
│   │
│   ├── 📁 oauth-init/              # OAuth initialization
│   │   └── index.ts
│   │
│   ├── 📁 shopify-webhook/         # Webhooks Shopify
│   │   └── index.ts
│   │
│   ├── 📁 verify-domain/           # Verificação de domínio
│   │   └── index.ts
│   │
│   ├── 📁 file-generator/          # Gerador de arquivos
│   │   └── index.ts
│   │
│   ├── 📁 file-generator-v2/       # Gerador v2
│   │   └── index.ts
│   │
│   ├── 📁 generate-zip/            # Geração de ZIP
│   │   └── index.ts
│   │
│   ├── 📁 initialize-free-plan/    # Plano grátis
│   │   └── index.ts
│   │
│   ├── 📁 python-executor/         # Executor Python
│   │   └── index.ts
│   │
│   ├── 📁 test-gateway/            # Teste de gateway
│   │   └── index.ts
│   │
│   ├── 📁 ai-tools/                # Ferramentas IA básicas
│   │   └── index.ts
│   │
│   ├── 📁 chat/                    # ⚠️ Chat v1 (deprecated)
│   │   └── index.ts
│   │
│   ├── 📁 chat-stream/             # ⚠️ Chat stream v1 (deprecated)
│   │   └── index.ts
│   │
│   ├── 📁 chat-stream-groq/        # ⚠️ Chat Groq (deprecated)
│   │   └── index.ts
│   │
│   ├── 📁 chat-stream-simple/      # ⚠️ Chat simple (deprecated)
│   │   └── index.ts
│   │
│   └── 📁 chat-stream-working/     # ⚠️ Chat backup (deprecated)
│       └── index.ts
│
└── 📁 .temp/                        # Arquivos temporários
```

---

## 🧪 TESTES (tests/)

```
tests/
├── setup.ts                         # Setup dos testes
├── security.test.ts                 # Testes de segurança
├── performance.test.ts              # Testes de performance
└── README.md                        # Documentação de testes
```

---

## 📚 DOCUMENTAÇÃO (docs/ e raiz)

```
📄 Documentação Principal:
├── AUDITORIA_COMPLETA_JANEIRO_2025.md       # ✅ Auditoria técnica completa
├── ACOES_IMEDIATAS_POS_AUDITORIA.md         # ✅ Guia passo a passo
├── RESUMO_AUDITORIA_2025.md                 # ✅ Resumo executivo
├── COMANDOS_UTEIS.md                        # ✅ Cheat sheet
├── ESTRUTURA_PROJETO.md                     # ✅ Este arquivo
│
📄 Documentação Histórica:
├── AUDITORIA_COMPLETA_OUTUBRO_2025.md
├── RELATORIO_FINAL_AUDITORIA.md
├── CONFIGURACAO_AMBIENTE.md
├── CONFIGURAR_WEBHOOKS_GATEWAYS.md
├── AUDITORIA_IA_E_GATEWAYS_DETALHADA.md
│
📄 Guias Específicos:
├── CHECKOUT_ONBOARDING_RECONSTRUIDO.md
├── COMO_USAR_GROQ_TOOL_CALLING.md
├── GUIA_PASSO_A_PASSO_DATABASE.md
├── IMPLEMENTACAO_CHATGPT_COMPLETA.md
│
📄 SQL Scripts:
├── APLICAR_RLS_FINAL_SEGURO.sql
├── EXECUTAR_NO_SUPABASE_SQL_EDITOR.sql
├── CONSOLIDAR_RLS_DUPLICADAS.sql
└── ... (30+ arquivos SQL)
```

---

## 🛠️ ARQUIVOS DE CONFIGURAÇÃO

```
📄 Build Tools:
├── package.json                     # Dependências e scripts
├── package-lock.json                # Lock de dependências
├── vite.config.ts                   # Configuração Vite
├── tsconfig.json                    # TypeScript principal
├── tsconfig.app.json                # TypeScript app
├── tsconfig.node.json               # TypeScript Node
├── tsconfig.dualite.json            # TypeScript Dualite
├── vitest.config.ts                 # Configuração Vitest
│
📄 Linting:
├── eslint.config.js                 # ESLint principal
├── eslint.dualite.config.js         # ESLint Dualite
│
📄 Styling:
├── tailwind.config.js               # Tailwind CSS
├── postcss.config.js                # PostCSS
│
📄 Deploy:
├── netlify.toml                     # Config Netlify
├── vercel.json                      # Config Vercel
│
📄 Outros:
├── .gitignore                       # Git ignore
├── index.html                       # HTML principal
└── .env.example                     # ✅ Variáveis de ambiente
```

---

## 📊 SCHEMA DO BANCO DE DADOS

```
📊 CORE TABLES:
├── User                             # Usuários
├── GlobalAiConnection               # Configuração IA global
├── Conversation                     # Conversas de chat
├── Message                          # Mensagens
│
📊 E-COMMERCE:
├── Product                          # Produtos
├── Customer                         # Clientes
├── Order                            # Pedidos
├── Cart                             # Carrinho
├── CartItem                         # Itens do carrinho
│
📊 CHECKOUT:
├── CheckoutCustomization            # Personalização checkout
├── CheckoutOnboarding               # Onboarding checkout
├── PaymentTransaction               # Transações
│
📊 PAYMENT:
├── Gateway                          # Gateways disponíveis
├── GatewayConfig                    # Config de gateway por user
│
📊 MARKETING:
├── Campaign                         # Campanhas
├── Ad                               # Anúncios
├── Audience                         # Audiências
├── UTM                              # Parâmetros UTM
├── Coupon                           # Cupons
├── OrderBump                        # Order bump
├── Upsell                           # Upsell
├── CrossSell                        # Cross-sell
│
📊 INTEGRATIONS:
├── Integration                      # Integrações
├── OAuthConfig                      # Configuração OAuth
├── MetaAdsAccount                   # Conta Meta Ads
├── GoogleAdsAccount                 # Conta Google Ads
```

---

## 🔑 VARIÁVEIS DE AMBIENTE

```env
✅ OBRIGATÓRIAS:
├── VITE_SUPABASE_URL
└── VITE_SUPABASE_ANON_KEY

🟡 RECOMENDADAS:
├── VITE_SENTRY_DSN
└── VITE_APP_VERSION

🟢 OPCIONAIS (OAuth):
├── VITE_META_CLIENT_ID
├── VITE_META_CLIENT_SECRET
├── VITE_GOOGLE_CLIENT_ID
├── VITE_LINKEDIN_CLIENT_ID
├── VITE_TIKTOK_CLIENT_ID
└── VITE_TWITTER_CLIENT_ID
```

---

## 📈 ESTATÍSTICAS DO PROJETO

```
📊 Código:
├── Linhas de código (src/): ~15.000+
├── Componentes React: 50+
├── Páginas: 40+
├── Hooks customizados: 10+
├── Stores (Zustand): 4
├── TypeScript coverage: 100%
│
📊 Backend:
├── Migrations SQL: 40
├── Edge Functions: 30+
├── Tabelas no banco: 25+
├── RLS Policies: 100+
│
📊 Testes:
├── Test files: 3
├── Test coverage: ~50+ tests
│
📊 Documentação:
├── Arquivos MD: 50+
├── SQL scripts: 30+
├── Linhas de documentação: 10.000+
```

---

## 🎯 FUNCIONALIDADES PRINCIPAIS

```
✅ Autenticação e Usuários:
├── Login/Registro
├── Reset de senha
├── Sessão persistente
└── Super Admin role

✅ Chat IA:
├── Conversas persistentes
├── Múltiplos provedores IA
├── Web scraping
├── Ferramentas avançadas
└── Streaming de respostas

✅ E-commerce:
├── Produtos e coleções
├── Carrinho de compras
├── Checkout customizável
├── Múltiplos gateways
└── Recuperação de carrinho

✅ Marketing:
├── Campanhas publicitárias
├── Cupons e descontos
├── Order bump / Upsell
├── Pixels de tracking
└── Relatórios analíticos

✅ Integrações:
├── Meta Ads
├── Google Ads
├── Shopify
├── LinkedIn, TikTok, Twitter
└── Payment Gateways (Stripe, MP, etc)

✅ Super Admin:
├── Gerenciar clientes
├── Configurar IA global
├── Configurar gateways
├── Monitorar uso
└── OAuth config
```

---

## 🚀 FLUXO DE DESENVOLVIMENTO

```
1. Setup:
   npm install → Configure .env → npx supabase login

2. Desenvolvimento:
   npm run dev → Code → Test → Commit

3. Database:
   Create migration → Test locally → Push to remote

4. Edge Functions:
   Create function → Test locally → Deploy

5. Deploy:
   Build → Test → Deploy (Vercel/Netlify)

6. Monitoring:
   Sentry → Logs → Analytics
```

---

## 📞 LINKS IMPORTANTES

```
🌐 Dashboards:
├── Supabase: https://supabase.com/dashboard
├── Vercel: https://vercel.com/dashboard
├── Netlify: https://app.netlify.com
└── Sentry: https://sentry.io

📖 Documentação:
├── Supabase: https://supabase.com/docs
├── Vite: https://vitejs.dev
├── React: https://react.dev
├── shadcn/ui: https://ui.shadcn.com
└── Zustand: https://zustand-demo.pmnd.rs
```

---

**Última Atualização:** Janeiro 2025  
**Versão:** 2.0.0  
**Mantenha este arquivo atualizado conforme o projeto evolui!** 🚀