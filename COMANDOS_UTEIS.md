# 🚀 COMANDOS ÚTEIS - SYNCADS
## Cheat Sheet para Desenvolvimento

**Atualizado:** Janeiro 2025  
**Versão:** 1.0

---

## 📋 ÍNDICE RÁPIDO

- [Setup Inicial](#setup-inicial)
- [Desenvolvimento](#desenvolvimento)
- [Supabase CLI](#supabase-cli)
- [Database](#database)
- [Edge Functions](#edge-functions)
- [Build e Deploy](#build-e-deploy)
- [Testes](#testes)
- [Troubleshooting](#troubleshooting)

---

## 🎬 SETUP INICIAL

```bash
# Clonar repositório
git clone <repo-url>
cd SyncAds

# Instalar dependências
npm install

# Copiar variáveis de ambiente
cp .env.example .env
# Editar .env com valores reais

# Autenticar no Supabase
npx supabase login

# Linkar ao projeto
npx supabase link --project-ref <YOUR_PROJECT_REF>

# Iniciar desenvolvimento
npm run dev
```

---

## 💻 DESENVOLVIMENTO

### Rodar Aplicação

```bash
# Modo desenvolvimento (hot reload)
npm run dev

# Build de produção
npm run build

# Preview da build
npm run preview

# Rodar testes
npm run test

# Rodar testes com UI
npm run test:ui

# Cobertura de testes
npm run test:coverage
```

### Linting e Formatação

```bash
# Executar ESLint
npm run lint

# Executar ESLint (config Dualite)
npm run lint:dualite

# Verificar tipos TypeScript
npm run tsc:dualite

# Ou verificar sem emitir arquivos
npx tsc --noEmit
```

### Gerenciar Dependências

```bash
# Instalar nova dependência
npm install <package-name>

# Instalar dependência de dev
npm install -D <package-name>

# Atualizar todas as dependências
npm update

# Verificar pacotes desatualizados
npm outdated

# Verificar vulnerabilidades
npm audit

# Corrigir vulnerabilidades automáticas
npm audit fix

# Limpar e reinstalar
rm -rf node_modules package-lock.json
npm install
```

---

## 🗄️ SUPABASE CLI

### Autenticação

```bash
# Login no Supabase
npx supabase login

# Verificar usuário logado
npx supabase projects list

# Linkar ao projeto
npx supabase link --project-ref <PROJECT_REF>

# Ver projeto atual
npx supabase status

# Deslinkar projeto
npx supabase unlink
```

### Projetos

```bash
# Listar projetos
npx supabase projects list

# Detalhes do projeto
npx supabase projects info

# Criar novo projeto (via dashboard)
```

---

## 🗃️ DATABASE

### Migrations

```bash
# Criar nova migration
npx supabase migration new <nome_da_migration>

# Listar migrations
npx supabase migration list

# Aplicar migrations localmente
npx supabase db reset

# Verificar diferenças com remoto
npx supabase db remote changes

# Aplicar migrations no remoto
npx supabase db push

# Baixar schema do remoto
npx supabase db pull

# Gerar tipos TypeScript
npx supabase gen types typescript --local > src/lib/database.types.ts

# Ou para projeto remoto
npx supabase gen types typescript --project-id <PROJECT_REF> > src/lib/database.types.ts
```

### SQL Direto

```bash
# Executar SQL localmente
npx supabase db execute --file caminho/para/arquivo.sql

# Executar SQL no remoto
npx supabase db execute --remote --file caminho/para/arquivo.sql

# Abrir psql local
npx supabase db psql

# Abrir psql remoto
npx supabase db psql --remote
```

### Supabase Local

```bash
# Iniciar Supabase local (requer Docker)
npx supabase start

# Parar Supabase local
npx supabase stop

# Status do Supabase local
npx supabase status

# Resetar banco local (limpa dados)
npx supabase db reset

# Ver logs
npx supabase logs
```

### Queries Úteis (SQL)

```sql
-- Ver todas as tabelas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Ver colunas de uma tabela
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'User'
ORDER BY ordinal_position;

-- Ver índices de uma tabela
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'Message'
ORDER BY indexname;

-- Ver policies RLS de uma tabela
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'User';

-- Verificar migrations aplicadas
SELECT * FROM _supabase_migrations 
ORDER BY inserted_at DESC 
LIMIT 10;

-- Ver tamanho das tabelas
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Performance: Queries lentas (se pg_stat_statements ativo)
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

---

## ⚡ EDGE FUNCTIONS

### Gerenciar Functions

```bash
# Listar functions
npx supabase functions list

# Criar nova function
npx supabase functions new <function-name>

# Servir function localmente
npx supabase functions serve <function-name>

# Servir todas as functions
npx supabase functions serve

# Deploy de uma function
npx supabase functions deploy <function-name>

# Deploy de todas as functions
npx supabase functions deploy

# Ver logs de uma function
npx supabase functions logs <function-name>

# Deletar function
npx supabase functions delete <function-name>
```

### Testar Edge Function Localmente

```bash
# Servir function
npx supabase functions serve chat-enhanced

# Em outro terminal, testar
curl -i --location 'http://localhost:54321/functions/v1/chat-enhanced' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "message": "Olá!",
    "conversationId": "uuid-here"
  }'
```

### Configurar Secrets (Edge Functions)

```bash
# Listar secrets
npx supabase secrets list

# Definir secret
npx supabase secrets set OPENAI_API_KEY=sk-xxx

# Remover secret
npx supabase secrets unset OPENAI_API_KEY

# Secrets comuns necessários:
npx supabase secrets set OPENAI_API_KEY=sk-xxx
npx supabase secrets set GROQ_API_KEY=gsk-xxx
npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-xxx
npx supabase secrets set TAVILY_API_KEY=tvly-xxx
npx supabase secrets set SERPER_API_KEY=xxx
```

---

## 🚀 BUILD E DEPLOY

### Build Local

```bash
# Build de produção
npm run build

# Analisar bundle size
npm run build -- --mode analyze

# Preview local da build
npm run preview
```

### Deploy Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy preview
vercel

# Deploy produção
vercel --prod

# Ver logs
vercel logs

# Ver variáveis de ambiente
vercel env ls

# Adicionar variável de ambiente
vercel env add VITE_SUPABASE_URL
```

### Deploy Netlify

```bash
# Instalar Netlify CLI
npm i -g netlify-cli

# Login
netlify login

# Inicializar
netlify init

# Deploy preview
netlify deploy

# Deploy produção
netlify deploy --prod

# Ver logs
netlify functions:log

# Variáveis de ambiente (via dashboard)
# https://app.netlify.com/sites/YOUR_SITE/settings/deploys#environment
```

### Deploy Manual (Via Git)

```bash
# Commitar mudanças
git add .
git commit -m "feat: nova funcionalidade"

# Push para main (trigger auto-deploy)
git push origin main

# Push para branch (preview deploy)
git push origin feature/nova-feature
```

---

## 🧪 TESTES

### Vitest

```bash
# Rodar todos os testes
npm test

# Rodar testes em modo watch
npm test -- --watch

# Rodar testes com UI
npm run test:ui

# Rodar cobertura
npm run test:coverage

# Rodar teste específico
npm test -- tests/errors.test.ts

# Rodar testes matching pattern
npm test -- --grep "error handling"
```

### Testes Manuais

```bash
# Testar conexão Supabase
node test-supabase-connection.js

# Testar chat
node test-chat.js

# Testar mobile fix
node test-chat-mobile-fix-final.js
```

---

## 🔧 TROUBLESHOOTING

### Limpar Cache

```bash
# Limpar cache do npm
npm cache clean --force

# Limpar node_modules
rm -rf node_modules package-lock.json
npm install

# Limpar build
rm -rf dist

# Limpar cache Vite
rm -rf .vite

# Limpar tudo
rm -rf node_modules package-lock.json dist .vite
npm install
```

### Problemas com Supabase CLI

```bash
# Limpar cache Supabase
rm -rf ~/.config/supabase

# Re-autenticar
npx supabase login

# Verificar versão
npx supabase --version

# Atualizar CLI
npm install -g supabase@latest
```

### Problemas com Docker

```bash
# Verificar se Docker está rodando
docker ps

# Iniciar Docker (Linux)
sudo systemctl start docker

# Ver logs Docker
docker logs supabase_db_SyncAds

# Parar todos containers Supabase
npx supabase stop
docker stop $(docker ps -a -q --filter ancestor=supabase/*)

# Limpar volumes
docker volume prune
```

### Verificar Erros

```bash
# TypeScript
npx tsc --noEmit

# ESLint
npm run lint

# Build
npm run build 2>&1 | tee build-errors.log

# Verificar imports não utilizados
npx depcheck
```

### Reset Completo (Último Recurso)

```bash
# ⚠️ CUIDADO: Isso apaga tudo!

# 1. Limpar projeto
rm -rf node_modules package-lock.json dist .vite

# 2. Reinstalar
npm install

# 3. Limpar Supabase local
npx supabase stop
npx supabase db reset

# 4. Re-autenticar
rm -rf ~/.config/supabase
npx supabase login
npx supabase link --project-ref <PROJECT_REF>

# 5. Testar
npm run dev
```

---

## 📊 MONITORAMENTO

### Logs

```bash
# Logs Edge Functions
npx supabase functions logs <function-name>

# Logs com filtro
npx supabase functions logs chat-enhanced --filter "error"

# Logs em tempo real
npx supabase functions logs chat-enhanced --follow

# Logs Vercel
vercel logs --follow

# Logs Netlify
netlify logs:function chat-enhanced
```

### Performance

```bash
# Lighthouse (Chrome DevTools)
# Ou instalar CLI:
npm i -g lighthouse
lighthouse https://seu-site.com --view

# Bundle analysis
npm run build -- --mode analyze

# Performance monitoring
# Ver Sentry dashboard: https://sentry.io
```

---

## 🔑 VARIÁVEIS DE AMBIENTE

### Listar Variáveis Necessárias

```bash
# Verificar .env.example
cat .env.example

# Verificar variáveis atuais (sem mostrar valores)
cat .env | grep "^[^#]" | cut -d= -f1
```

### Configurar Variáveis

```bash
# Localmente (.env)
echo "VITE_SUPABASE_URL=https://xxx.supabase.co" >> .env

# Vercel
vercel env add VITE_SUPABASE_URL production

# Netlify (via dashboard)
# https://app.netlify.com/sites/YOUR_SITE/settings/deploys#environment

# Supabase Edge Functions
npx supabase secrets set MY_SECRET=valor
```

---

## 📚 DOCUMENTAÇÃO

### Gerar Tipos TypeScript

```bash
# Gerar tipos do Supabase
npx supabase gen types typescript --local > src/lib/database.types.ts

# Ou do remoto
npx supabase gen types typescript --project-id <PROJECT_REF> > src/lib/database.types.ts
```

### Links Úteis

```bash
# Supabase Dashboard
https://supabase.com/dashboard/project/<PROJECT_REF>

# SQL Editor
https://supabase.com/dashboard/project/<PROJECT_REF>/editor

# Edge Functions
https://supabase.com/dashboard/project/<PROJECT_REF>/functions

# Logs
https://supabase.com/dashboard/project/<PROJECT_REF>/logs

# API Docs (auto-gerada)
https://<PROJECT_REF>.supabase.co/rest/v1/
```

---

## 🎯 COMANDOS MAIS USADOS (TOP 10)

```bash
# 1. Desenvolvimento local
npm run dev

# 2. Build e preview
npm run build && npm run preview

# 3. Aplicar migrations
npx supabase db push

# 4. Deploy Edge Function
npx supabase functions deploy chat-enhanced

# 5. Ver logs
npx supabase functions logs chat-enhanced --follow

# 6. Gerar tipos
npx supabase gen types typescript --project-id <REF> > src/lib/database.types.ts

# 7. Testes
npm test

# 8. Lint
npm run lint

# 9. Deploy (Vercel)
vercel --prod

# 10. Ver status
npx supabase status
```

---

## 🚨 COMANDOS DE EMERGÊNCIA

```bash
# Site está down - verificar rápido
curl -I https://seu-site.com

# Edge Function não responde - redeploy
npx supabase functions deploy <function-name>

# Banco de dados travado - ver queries ativas
# No SQL Editor:
SELECT * FROM pg_stat_activity WHERE state = 'active';

# Rollback última migration (cuidado!)
# Aplicar migration anterior manualmente via SQL Editor

# Limpar tudo e começar do zero (último recurso)
# Ver seção "Reset Completo" acima
```

---

## 💡 DICAS E TRUQUES

### Aliases Úteis (Adicionar ao ~/.bashrc ou ~/.zshrc)

```bash
# Adicionar ao final do arquivo
alias sb="npx supabase"
alias sbs="npx supabase status"
alias sbl="npx supabase functions logs"
alias sbp="npx supabase db push"
alias dev="npm run dev"
alias build="npm run build"
alias test="npm test"

# Reload shell
source ~/.bashrc  # ou ~/.zshrc
```

### Scripts Personalizados (package.json)

```json
{
  "scripts": {
    "db:push": "npx supabase db push",
    "db:pull": "npx supabase db pull",
    "db:reset": "npx supabase db reset",
    "types": "npx supabase gen types typescript --project-id <REF> > src/lib/database.types.ts",
    "deploy:functions": "npx supabase functions deploy",
    "logs": "npx supabase functions logs",
    "clean": "rm -rf node_modules package-lock.json dist .vite && npm install"
  }
}
```

---

## 📞 AJUDA

**Precisa de mais informação?**

- 📖 `AUDITORIA_COMPLETA_JANEIRO_2025.md` - Análise técnica completa
- 🚀 `ACOES_IMEDIATAS_POS_AUDITORIA.md` - Guia passo a passo
- 📊 `RESUMO_AUDITORIA_2025.md` - Visão executiva
- 🔧 `CONFIGURACAO_AMBIENTE.md` - Setup detalhado

**Links Oficiais:**
- Supabase: https://supabase.com/docs
- Vite: https://vitejs.dev
- React: https://react.dev
- shadcn/ui: https://ui.shadcn.com

---

**Última Atualização:** Janeiro 2025  
**Versão:** 1.0  
**Mantenha este arquivo atualizado!** 🚀