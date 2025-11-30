# 🚨 RUNBOOK - CORREÇÕES EMERGENCIAIS SYNCADS

**Versão:** 1.0  
**Data:** 2025-11-26  
**Tipo:** Hotfix Procedures  
**Modo:** PRODUÇÃO - CUIDADO EXTREMO

---

## ⚠️ REGRAS DE OURO - LEIA ANTES DE EXECUTAR

1. ✅ **SEMPRE** fazer backup antes de qualquer mudança
2. ✅ **SEMPRE** testar em staging primeiro (se disponível)
3. ✅ **SEMPRE** ter plano de rollback pronto
4. ✅ **NUNCA** fazer múltiplas mudanças simultaneamente
5. ✅ **NUNCA** deployar sexta-feira tarde ou véspera de feriado
6. ✅ **DOCUMENTAR** cada comando executado
7. ✅ **COMUNICAR** equipe antes de executar

---

## 🔴 HOTFIX #1: Corrigir Erro Supabase Async/Await

**Severidade:** CRÍTICA  
**Tempo Estimado:** 2h  
**Risco:** MÉDIO (pode quebrar mais se feito errado)  
**Rollback Time:** 5 minutos

### Sintomas
```json
{
  "supabase": {
    "status": "error",
    "error": "object APIResponse can't be used in 'await' expression"
  }
}
```

### Pré-requisitos
```bash
# 1. Verificar status atual
curl https://syncads-python-microservice-production.up.railway.app/health | jq .services.supabase

# 2. Backup do código
git checkout main
git pull origin main
git checkout -b hotfix/supabase-async-fix
git log --oneline -5  # Anotar último commit estável

# 3. Criar snapshot (se suportado)
railway snapshot create
```

### Passos de Correção

#### Opção A: Remover await (RECOMENDADO)

```bash
# 1. Editar arquivo
cd python-service/app
code main.py  # ou vim/nano

# 2. Localizar todas as ocorrências de await com supabase
grep -n "await supabase" main.py
grep -n "await.*\.execute()" main.py

# 3. SUBSTITUIR (aproximadamente linhas 250-400):
# ANTES:
# result = await supabase.table("users").select("*").execute()

# DEPOIS:
# result = supabase.table("users").select("*").execute()

# 4. Validar sintaxe
python -m py_compile main.py

# 5. Commit
git add main.py
git commit -m "hotfix: Remove incorrect await from Supabase sync calls

- Supabase Python SDK uses sync client by default
- Remove await from .execute() calls
- Keep async context but don't await sync operations

Fixes: CRITICAL-001
Ref: AUDIT/CRITICAL_FINDINGS.md"

git push origin hotfix/supabase-async-fix
```

#### Opção B: Usar httpx fallback (já implementado)

```bash
# Se opção A não funcionar, forçar uso do httpx fallback

# 1. Editar main.py
# Localizar: supabase = create_client(...)

# 2. Adicionar flag de fallback
USE_SUPABASE_HTTP_FALLBACK = True

# 3. Modificar health check para usar fallback
# Ver implementação existente da classe SupabaseHTTP

# 4. Deploy
```

### Deploy

```bash
# 1. Build local (teste rápido)
cd python-service
docker build -t syncads-test .
docker run -p 8000:8000 syncads-test

# Em outro terminal:
curl http://localhost:8000/health | jq .services.supabase
# Deve retornar: "status": "healthy" OU sem erro

# 2. Se teste passou, deploy Railway
railway up --detach

# 3. Monitorar deploy
railway logs --follow

# 4. Esperar 30 segundos, testar produção
curl https://syncads-python-microservice-production.up.railway.app/health | jq .services.supabase
```

### Validação

```bash
# 1. Health check
curl https://syncads-python-microservice-production.up.railway.app/health | jq

# Deve retornar:
# {
#   "status": "healthy" ou "operational",
#   "services": {
#     "supabase": {
#       "status": "healthy"  # SEM ERRO!
#     }
#   }
# }

# 2. Testar endpoint de chat (se necessário)
curl -X POST https://syncads-python-microservice-production.up.railway.app/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_VALIDO" \
  -d '{"messages": [{"role": "user", "content": "teste"}]}'

# Deve retornar resposta da IA, não erro de DB
```

### Rollback

```bash
# Se algo der errado:
railway rollback  # Volta para deploy anterior

# OU via git:
git checkout main
git push origin main --force
railway up
```

### Comunicação

```
[HOTFIX] Supabase Client - APLICADO
Status: ✅ RESOLVIDO
Downtime: ~2 minutos
Impacto: Restauração de funcionalidade do banco de dados
Próximos passos: Monitorar por 1 hora
```

---

## 🔴 HOTFIX #2: Deploy AI Expansion no Railway

**Severidade:** ALTA  
**Tempo Estimado:** 3h  
**Risco:** BAIXO (código novo isolado)  
**Rollback Time:** 5 minutos

### Sintomas
```json
{
  "ai_modules": {
    "openai": false,
    "anthropic": false,
    "groq": false
  },
  "automation": {
    "playwright": false,
    "selenium": false
  }
}
```

### Passos de Correção

```bash
# 1. Criar branch
git checkout main
git pull origin main
git checkout -b hotfix/ai-expansion-deploy

# 2. Atualizar Dockerfile
cd python-service
nano Dockerfile

# ADICIONAR ANTES DO "COPY ./app ./app":
```

```dockerfile
# Copiar módulo AI Expansion
COPY ./ai_expansion ./ai_expansion

# Instalar dependências mínimas da AI Expansion
RUN pip install --no-cache-dir \
    playwright>=1.48.0 \
    selenium>=4.27.0 \
    webdriver-manager>=4.0.0 \
    selectolax>=0.3.21 \
    langchain>=0.1.0 \
    langchain-openai>=0.0.5 \
    langchain-anthropic>=0.1.0 \
    opencv-python-headless>=4.10.0 \
    pytesseract>=0.3.10 \
    orjson>=3.9.0 \
    tenacity>=8.2.0 \
    backoff>=2.2.0

# Instalar navegadores Playwright (apenas chromium)
RUN playwright install chromium --with-deps
```

```bash
# 3. OU Alternativa mais rápida: adicionar ao requirements.txt
cat >> requirements.txt << 'EOF'

# ==========================================
# AI EXPANSION - MINIMAL REQUIREMENTS
# ==========================================
playwright>=1.48.0
selenium>=4.27.0
webdriver-manager>=4.0.0
selectolax>=0.3.21
langchain>=0.1.0
langchain-openai>=0.0.5
langchain-anthropic>=0.1.0
opencv-python-headless>=4.10.0
pytesseract>=0.3.10
orjson>=3.9.0
tenacity>=8.2.0
backoff>=2.2.0
EOF

# 4. Commit
git add Dockerfile requirements.txt
git commit -m "hotfix: Add AI Expansion dependencies to Railway build

- Add ai_expansion module copy to Dockerfile
- Install minimal dependencies for core features
- Install Playwright chromium browser
- Enable multi-engine automation
- Enable DOM intelligence (selectolax)
- Enable AI agents (langchain)
- Enable computer vision (opencv-headless)

Fixes: CRITICAL-003
Expected: /api/expansion/* endpoints become available"

git push origin hotfix/ai-expansion-deploy

# 5. Deploy
railway up --detach

# 6. Monitorar (build demora ~5-10min devido Playwright)
railway logs --follow
```

### Validação

```bash
# 1. Aguardar build completar (5-10 minutos)
# Procurar nos logs: "AI EXPANSION READY!"

# 2. Testar health
curl https://syncads-python-microservice-production.up.railway.app/api/expansion/health | jq

# Deve retornar:
# {
#   "success": true,
#   "status": "healthy",
#   "modules": {
#     "automation": {"available": true},
#     "dom_intelligence": {"available": true},
#     ...
#   }
# }

# 3. Testar info
curl https://syncads-python-microservice-production.up.railway.app/api/expansion/info | jq .name
# Deve retornar: "SyncAds AI Expansion Module"

# 4. Testar DOM analysis (básico)
curl -X POST https://syncads-python-microservice-production.up.railway.app/api/expansion/dom/analyze \
  -H "Content-Type: application/json" \
  -d '{"html":"<html><body><button>Test</button></body></html>","engine":"selectolax"}' | jq .success
# Deve retornar: true
```

### Rollback

```bash
railway rollback
# OU
git revert HEAD
git push origin hotfix/ai-expansion-deploy
railway up
```

---

## 🟠 HOTFIX #3: Health Checks para Edge Functions Críticas

**Severidade:** ALTA  
**Tempo Estimado:** 2h  
**Risco:** BAIXO (apenas adiciona endpoints)  
**Rollback Time:** 2 minutos

### Funções Prioritárias
1. `chat-enhanced` (v57)
2. `process-payment` (v25)
3. `payment-webhook`
4. `public-process-payment`
5. `shopify-create-order`

### Template de Health Check

```typescript
// supabase/functions/_shared/healthcheck.ts
export interface HealthCheck {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  version: string;
  latency_ms: number;
  last_error?: string;
  timestamp: string;
}

export function createHealthHandler(
  functionName: string,
  version: string,
  checkFn?: () => Promise<boolean>
) {
  return async (req: Request): Promise<Response> => {
    const url = new URL(req.url);
    
    if (url.pathname === '/health' || url.pathname.endsWith('/health')) {
      const start = Date.now();
      let status: 'healthy' | 'degraded' | 'down' = 'healthy';
      let last_error: string | undefined;

      if (checkFn) {
        try {
          const isHealthy = await checkFn();
          status = isHealthy ? 'healthy' : 'degraded';
        } catch (e) {
          status = 'down';
          last_error = e.message;
        }
      }

      const response: HealthCheck = {
        name: functionName,
        status,
        version,
        latency_ms: Date.now() - start,
        last_error,
        timestamp: new Date().toISOString()
      };

      return new Response(JSON.stringify(response), {
        status: status === 'healthy' ? 200 : status === 'degraded' ? 503 : 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return null; // Continua para handler normal
  };
}
```

### Implementar em chat-enhanced

```bash
cd supabase/functions/chat-enhanced

# Backup
cp index.ts index.ts.backup

# Editar
nano index.ts
```

```typescript
// No início do arquivo
import { createHealthHandler } from '../_shared/healthcheck.ts';

// Antes do Deno.serve
const healthHandler = createHealthHandler('chat-enhanced', '57', async () => {
  // Opcional: testar conexão com Supabase ou AI
  return true;
});

Deno.serve(async (req) => {
  // ADICIONAR ESTA LINHA PRIMEIRO
  const healthResponse = await healthHandler(req);
  if (healthResponse) return healthResponse;

  // Resto do código continua igual
  // ...
});
```

```bash
# Deploy
supabase functions deploy chat-enhanced

# Testar
curl https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/chat-enhanced/health | jq
```

### Repetir para outras 4 funções críticas

```bash
# process-payment
cd ../process-payment
# (mesmo processo)
supabase functions deploy process-payment

# payment-webhook
cd ../payment-webhook
supabase functions deploy payment-webhook

# public-process-payment
cd ../public-process-payment
supabase functions deploy public-process-payment

# shopify-create-order
cd ../shopify-create-order
supabase functions deploy shopify-create-order
```

### Criar Agregador

```bash
cd supabase/functions
supabase functions new system-health
cd system-health
nano index.ts
```

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CRITICAL_FUNCTIONS = [
  'chat-enhanced',
  'process-payment',
  'payment-webhook',
  'public-process-payment',
  'shopify-create-order'
];

const PROJECT_REF = Deno.env.get('SUPABASE_PROJECT_REF') || 'ovskepqggmxlfckxqgbr';

serve(async (req) => {
  const results = await Promise.all(
    CRITICAL_FUNCTIONS.map(async (fn) => {
      try {
        const res = await fetch(
          `https://${PROJECT_REF}.supabase.co/functions/v1/${fn}/health`,
          { signal: AbortSignal.timeout(5000) }
        );
        return await res.json();
      } catch (e) {
        return { name: fn, status: 'down', error: e.message };
      }
    })
  );

  const healthy = results.filter(r => r.status === 'healthy').length;
  const degraded = results.filter(r => r.status === 'degraded').length;
  const down = results.filter(r => r.status === 'down').length;

  return new Response(JSON.stringify({
    overall_status: down > 0 ? 'critical' : degraded > 0 ? 'degraded' : 'healthy',
    total_functions: CRITICAL_FUNCTIONS.length,
    healthy,
    degraded,
    down,
    functions: results,
    timestamp: new Date().toISOString()
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

```bash
supabase functions deploy system-health

# Testar
curl https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/system-health | jq
```

---

## 🟡 HOTFIX #4: Criar Backup Manual Imediato

**Severidade:** ALTA  
**Tempo Estimado:** 1h  
**Risco:** ZERO (operação read-only)

```bash
# 1. Backup completo via pg_dump
supabase db dump \
  --project-ref ovskepqggmxlfckxqgbr \
  --data-only \
  > "backup_production_$(date +%Y%m%d_%H%M%S).sql"

# 2. Verificar tamanho
ls -lh backup_*.sql

# 3. Comprimir
gzip backup_production_*.sql

# 4. Upload para storage seguro
# Opção A: Google Drive / Dropbox
# Opção B: S3 / R2
# Opção C: Git LFS (se < 100MB)

# 5. Testar restore em branch
supabase branches create test-restore
supabase db restore backup_production_*.sql.gz --branch test-restore

# 6. Validar
supabase db query "SELECT COUNT(*) FROM users;" --branch test-restore

# 7. Deletar branch de teste
supabase branches delete test-restore

# 8. Agendar backups automáticos
# Via Supabase Dashboard: Settings > Database > Backups
# - Point-in-Time Recovery (PITR): ENABLE
# - Daily backups: ENABLE
# - Retention: 7 days (mínimo)
```

---

## 🟡 HOTFIX #5: Ajustar CORS para Whitelist

**Severidade:** ALTA  
**Tempo Estimado:** 30min  
**Risco:** MÉDIO (pode quebrar frontend se domínios errados)

```bash
cd python-service/app
nano main.py
```

```python
# SUBSTITUIR:
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],  # ❌ INSEGURO
#     ...
# )

# POR:
import os

ALLOWED_ORIGINS = [
    "https://syncads.vercel.app",
    "https://www.syncads.com",
    "https://syncads.com",
]

# Adicionar localhost para dev
if os.getenv("ENVIRONMENT") == "development":
    ALLOWED_ORIGINS.extend([
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
    ])

# Permitir extensão Chrome
ALLOWED_ORIGINS.append("chrome-extension://")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)
```

```bash
# Deploy
git add main.py
git commit -m "security: Restrict CORS to known origins"
railway up --detach

# Testar do frontend
# Abrir syncads.vercel.app e verificar que requisições funcionam
# Tentar de outro domínio e verificar que é bloqueado
```

---

## 📞 CONTATOS DE EMERGÊNCIA

**Para Rollback Urgente:**
```bash
# Railway
railway rollback
railway logs --follow

# Supabase
supabase functions deploy [function] --version [previous]

# Vercel
vercel rollback
```

**Monitoramento:**
```bash
# Logs em tempo real
railway logs --follow

# Health check contínuo
watch -n 5 'curl -s https://syncads-python-microservice-production.up.railway.app/health | jq .status'

# Edge functions health
watch -n 10 'curl -s https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/system-health | jq .overall_status'
```

**Alertas:**
- Railway: Notifications > Configure alerts
- Supabase: Integrations > Webhooks
- UptimeRobot: Configure 5min checks

---

## ✅ CHECKLIST PÓS-HOTFIX

Após cada hotfix, verificar:

- [ ] Health endpoint retorna 200 OK
- [ ] Supabase status = "healthy"
- [ ] Logs sem erros críticos (5 minutos)
- [ ] Frontend funciona normalmente
- [ ] Extensão conecta com backend
- [ ] Pagamentos funcionam (se afetado)
- [ ] Backup criado e verificado
- [ ] Equipe notificada
- [ ] Documentação atualizada
- [ ] Incident report criado

---

## 📊 MÉTRICAS DE SUCESSO

**Antes:**
- Health Score: 45/100
- Supabase: Error
- AI Expansion: Offline
- Edge Functions Monitored: 0/86

**Depois (Target):**
- Health Score: 85+/100
- Supabase: Healthy
- AI Expansion: Online
- Edge Functions Monitored: 5/86 (críticas)

---

**IMPORTANTE:** Este runbook é vivo. Atualizar após cada execução com learnings.

*Última atualização: 2025-11-26*