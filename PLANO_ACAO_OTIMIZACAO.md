# 🎯 PLANO DE AÇÃO - OTIMIZAÇÃO SYNCADS

**Data:** 05/02/2025  
**Objetivo:** Escalar de 4 para 10.000 usuários  
**Prazo:** 90 dias  

---

## 📊 SITUAÇÃO ATUAL

### Capacidade
- ✅ **Atual:** 4 usuários, funcionando bem
- ⚠️ **Limite:** 50-100 usuários simultâneos (antes de lentidão)
- ❌ **Gargalos:** Queries N+1, sem cache, sem paginação

### Score: 7.5/10
```
✅ Funcionalidades: 95% completas
⚠️ Performance: Precisa otimização
⚠️ Escalabilidade: Limitada
✅ Segurança: Boa
```

---

## 🚀 FASE 1: QUICK WINS (ESTA SEMANA - 3 dias)

### Prioridade CRÍTICA

#### 1. Adicionar Paginação (2h)
```typescript
// EM: src/lib/api/ordersApi.ts, productsApi.ts, customersApi.ts

const fetchOrders = async (page = 0, limit = 50) => {
  return await supabase
    .from("Order")
    .select("*", { count: 'exact' })
    .range(page * limit, (page + 1) * limit - 1)
    .order("createdAt", { ascending: false });
};
```

**Impacto:** ⬆️ 10x mais rápido  
**Aplicar em:** AllOrdersPage, AllProductsPage, AllCustomersPage, ChatHistory

---

#### 2. Instalar React Query (3h)
```bash
npm install @tanstack/react-query
```

```typescript
// src/main.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    },
  },
});

<QueryClientProvider client={queryClient}>
  <App />
</QueryClientProvider>
```

**Impacto:** ⬆️ Cache automático, menos requisições  
**Aplicar em:** Todas as APIs

---

#### 3. Otimizar Dashboard (4h)

**Criar RPC consolidado:**
```sql
-- Execute no SQL Editor do Supabase

CREATE OR REPLACE FUNCTION get_dashboard_metrics(user_id TEXT)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'revenue', (
      SELECT COALESCE(SUM(amount), 0) 
      FROM "Transaction" 
      WHERE "userId" = user_id AND status = 'approved'
    ),
    'orders', (
      SELECT COUNT(*) 
      FROM "Order" 
      WHERE "userId" = user_id
    ),
    'ordersToday', (
      SELECT COUNT(*) 
      FROM "Order" 
      WHERE "userId" = user_id 
        AND "createdAt" >= CURRENT_DATE
    ),
    'conversionRate', (
      SELECT ROUND(
        100.0 * COUNT(*) FILTER (WHERE status = 'completed') / 
        NULLIF(COUNT(*), 0), 2
      )
      FROM "Order" 
      WHERE "userId" = user_id
    ),
    'topProducts', (
      SELECT json_agg(row_to_json(p)) FROM (
        SELECT 
          "Product".name,
          COUNT(oi.id) as sales,
          SUM(oi.quantity * oi.price) as revenue
        FROM "Product"
        LEFT JOIN "OrderItem" oi ON oi."productId" = "Product".id
        WHERE "Product"."userId" = user_id
        GROUP BY "Product".id, "Product".name
        ORDER BY sales DESC
        LIMIT 5
      ) p
    ),
    'recentTransactions', (
      SELECT json_agg(row_to_json(t)) FROM (
        SELECT 
          id,
          amount,
          status,
          "paymentMethod",
          "createdAt"
        FROM "Transaction"
        WHERE "userId" = user_id
        ORDER BY "createdAt" DESC
        LIMIT 10
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Usar no frontend:**
```typescript
// src/pages/app/UnifiedDashboardPage.tsx
const loadDashboardData = async () => {
  const { data } = await supabase.rpc('get_dashboard_metrics', {
    user_id: user.id
  });
  
  setMetrics(data);
};
```

**Impacto:** ⬇️ De 10+ queries para 1 query = 10x mais rápido

---

#### 4. Debounce em Buscas (1h)
```bash
npm install use-debounce
```

```typescript
// Em todos os campos de busca
import { useDebouncedCallback } from 'use-debounce';

const handleSearch = useDebouncedCallback(async (query) => {
  const { data } = await supabase
    .from("Product")
    .select("*")
    .ilike("name", `%${query}%`)
    .limit(50);
  setResults(data);
}, 500);
```

**Impacto:** ⬇️ 90% menos queries desnecessárias

---

#### 5. Comprimir Build (30min)
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'ui': ['@/components/ui'],
          'charts': ['recharts'],
        }
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
      }
    }
  }
});
```

**Impacto:** ⬇️ Build size de 778KB para ~400KB

---

### ✅ Checklist Fase 1
- [ ] Paginação em listas
- [ ] React Query instalado
- [ ] Dashboard com RPC
- [ ] Debounce em buscas
- [ ] Build comprimido
- [ ] Testar performance

**Resultado Esperado:** Suportar 100-200 usuários simultâneos

---

## 🔥 FASE 2: CACHE E OTIMIZAÇÃO (SEMANA 2 - 5 dias)

### 1. Redis Cache (1 dia)

**Setup Upstash Redis (Free tier):**
```bash
# 1. Criar conta em upstash.com
# 2. Criar database Redis
# 3. Copiar REDIS_URL
```

**Adicionar ao Supabase:**
```typescript
// supabase/functions/_utils/cache.ts
import { connect } from 'https://deno.land/x/redis@v0.31.0/mod.ts';

const redis = await connect({
  hostname: Deno.env.get('REDIS_HOST')!,
  port: 6379,
  password: Deno.env.get('REDIS_PASSWORD'),
});

export const getCache = async <T>(key: string): Promise<T | null> => {
  const cached = await redis.get(key);
  return cached ? JSON.parse(cached) : null;
};

export const setCache = async (key: string, value: any, ttl = 300) => {
  await redis.setex(key, ttl, JSON.stringify(value));
};

export const delCache = async (key: string) => {
  await redis.del(key);
};
```

**Usar em process-payment:**
```typescript
// Cache de configs de gateway (1 hora)
const cacheKey = `gateway:${gatewayId}`;
let config = await getCache(cacheKey);

if (!config) {
  const { data } = await supabase
    .from('GatewayConfig')
    .select('*')
    .eq('id', gatewayId)
    .single();
  
  config = data;
  await setCache(cacheKey, config, 3600);
}
```

**Impacto:** ⬆️ 50x mais rápido nas configs de gateway

---

### 2. Fila de Pagamentos (2 dias)

**Criar tabela:**
```sql
CREATE TABLE "PaymentQueue" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "transactionId" UUID NOT NULL,
  "userId" TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  attempts INTEGER DEFAULT 0,
  "maxAttempts" INTEGER DEFAULT 3,
  "nextAttemptAt" TIMESTAMP DEFAULT NOW(),
  "lastError" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payment_queue_status ON "PaymentQueue"(status, "nextAttemptAt");
CREATE INDEX idx_payment_queue_transaction ON "PaymentQueue"("transactionId");
```

**Modificar process-payment:**
```typescript
// Adiciona à fila em vez de processar direto
serve(async (req) => {
  const body = await req.json();
  
  // Insere na fila
  const { data: job } = await supabase
    .from('PaymentQueue')
    .insert({
      transactionId: generateId(),
      userId: body.userId,
      payload: body,
      nextAttemptAt: new Date().toISOString()
    })
    .select()
    .single();
  
  return new Response(JSON.stringify({
    success: true,
    jobId: job.id,
    status: 'queued'
  }), {
    status: 202,
    headers: { 'Content-Type': 'application/json' }
  });
});
```

**Criar payment-processor (cron 1 min):**
```typescript
// supabase/functions/payment-processor/index.ts
serve(async () => {
  const { data: jobs } = await supabase
    .from('PaymentQueue')
    .select('*')
    .eq('status', 'pending')
    .lte('nextAttemptAt', new Date().toISOString())
    .limit(10);
  
  const results = [];
  
  for (const job of jobs || []) {
    try {
      // Marcar como processando
      await supabase
        .from('PaymentQueue')
        .update({ status: 'processing' })
        .eq('id', job.id);
      
      // Processar pagamento
      const result = await processPaymentInternal(job.payload);
      
      // Marcar como completo
      await supabase
        .from('PaymentQueue')
        .update({ 
          status: 'completed',
          updatedAt: new Date().toISOString()
        })
        .eq('id', job.id);
      
      results.push({ jobId: job.id, status: 'completed' });
    } catch (error) {
      // Retry logic
      const newAttempts = job.attempts + 1;
      
      if (newAttempts >= job.maxAttempts) {
        // Falhou definitivamente
        await supabase
          .from('PaymentQueue')
          .update({ 
            status: 'failed',
            lastError: error.message,
            updatedAt: new Date().toISOString()
          })
          .eq('id', job.id);
      } else {
        // Agendar retry (exponential backoff)
        const delay = Math.pow(2, newAttempts) * 60; // 2, 4, 8 minutos
        const nextAttempt = new Date(Date.now() + delay * 1000);
        
        await supabase
          .from('PaymentQueue')
          .update({ 
            status: 'pending',
            attempts: newAttempts,
            lastError: error.message,
            nextAttemptAt: nextAttempt.toISOString(),
            updatedAt: new Date().toISOString()
          })
          .eq('id', job.id);
      }
      
      results.push({ jobId: job.id, status: 'retry', attempts: newAttempts });
    }
  }
  
  return new Response(JSON.stringify({
    processed: results.length,
    results
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
});
```

**Impacto:** ⬆️ Pagamentos não bloqueiam mais a API

---

### 3. Índices do Banco (1h)

```sql
-- Criar índices críticos que faltam

-- Transaction
CREATE INDEX IF NOT EXISTS idx_transaction_user_status 
  ON "Transaction"("userId", status) WHERE status IN ('approved', 'pending');

CREATE INDEX IF NOT EXISTS idx_transaction_created_desc 
  ON "Transaction"("createdAt" DESC);

-- Order
CREATE INDEX IF NOT EXISTS idx_order_user_created 
  ON "Order"("userId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS idx_order_status 
  ON "Order"(status) WHERE status != 'completed';

-- Product
CREATE INDEX IF NOT EXISTS idx_product_user_active 
  ON "Product"("userId", "isActive") WHERE "isActive" = true;

-- ChatMessage (crescendo rápido)
CREATE INDEX IF NOT EXISTS idx_chat_conversation_created 
  ON "ChatMessage"("conversationId", "createdAt" DESC);

-- AuditLog (crescendo)
CREATE INDEX IF NOT EXISTS idx_audit_created 
  ON "AuditLog"("createdAt" DESC);

-- PaymentMethod
CREATE INDEX IF NOT EXISTS idx_payment_method_user_verified 
  ON "PaymentMethod"("userId", "isVerified") WHERE "isVerified" = true;

-- Analyze tabelas
ANALYZE "Transaction";
ANALYZE "Order";
ANALYZE "Product";
ANALYZE "User";
```

**Impacto:** ⬆️ Queries 5-10x mais rápidas

---

### 4. Virtualização de Listas (1 dia)

```bash
npm install @tanstack/react-virtual
```

```typescript
// src/components/VirtualProductList.tsx
import { useVirtualizer } from '@tanstack/react-virtual';

export const VirtualProductList = ({ products }) => {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: products.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120,
    overscan: 5,
  });
  
  return (
    <div ref={parentRef} className="h-[600px] overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <ProductCard product={products[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
};
```

**Aplicar em:** Listas de produtos, pedidos, clientes

**Impacto:** ⬆️ Renderizar 10.000 itens sem travar

---

### ✅ Checklist Fase 2
- [ ] Redis configurado
- [ ] Fila de pagamentos
- [ ] Índices criados
- [ ] Virtualização em listas
- [ ] Testar com 500+ registros

**Resultado Esperado:** Suportar 500-1000 usuários simultâneos

---

## 💪 FASE 3: MONITORAMENTO (SEMANA 3-4 - 7 dias)

### 1. Logging Centralizado (2 dias)

```typescript
// src/lib/logger.ts
export const logger = {
  info: (message: string, meta?: any) => {
    console.log(`[INFO] ${message}`, meta);
    
    supabase.from('AppLogs').insert({
      level: 'info',
      message,
      meta,
      timestamp: new Date().toISOString()
    });
  },
  
  error: (message: string, error: Error, meta?: any) => {
    console.error(`[ERROR] ${message}`, error, meta);
    
    supabase.from('AppLogs').insert({
      level: 'error',
      message,
      error: error.message,
      stack: error.stack,
      meta,
      timestamp: new Date().toISOString()
    });
  },
  
  performance: (operation: string, duration: number) => {
    supabase.from('PerformanceMetrics').insert({
      operation,
      duration,
      timestamp: new Date().toISOString()
    });
  }
};

// Wrapper para medir performance
export const withPerformance = async <T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> => {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    logger.performance(operation, duration);
    return result;
  } catch (error) {
    logger.error(`Performance tracking failed for ${operation}`, error as Error);
    throw error;
  }
};
```

**Criar tabelas:**
```sql
CREATE TABLE "AppLogs" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  error TEXT,
  stack TEXT,
  meta JSONB,
  "userId" TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_app_logs_level ON "AppLogs"(level, timestamp DESC);
CREATE INDEX idx_app_logs_user ON "AppLogs"("userId", timestamp DESC);

CREATE TABLE "PerformanceMetrics" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  operation TEXT NOT NULL,
  duration DECIMAL(10,2) NOT NULL,
  "userId" TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_perf_operation ON "PerformanceMetrics"(operation, timestamp DESC);
```

---

### 2. Health Check Endpoint (1 dia)

```typescript
// supabase/functions/health-check/index.ts
serve(async () => {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    checks: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      gateways: await checkCriticalGateways(),
    }
  };
  
  const allHealthy = Object.values(checks.checks).every(c => c.status === 'ok');
  
  return new Response(JSON.stringify(checks), {
    status: allHealthy ? 200 : 503,
    headers: { 'Content-Type': 'application/json' }
  });
});

async function checkDatabase() {
  try {
    const { data, error } = await supabase
      .from('User')
      .select('id')
      .limit(1);
    
    return { status: 'ok', responseTime: '< 100ms' };
  } catch (error) {
    return { status: 'error', error: error.message };
  }
}

async function checkRedis() {
  try {
    await redis.ping();
    return { status: 'ok' };
  } catch (error) {
    return { status: 'error', error: error.message };
  }
}

async function checkCriticalGateways() {
  const { data: gateways } = await supabase
    .from('GatewayConfig')
    .select('id, name')
    .eq('isActive', true)
    .limit(5);
  
  return {
    status: 'ok',
    activeGateways: gateways?.length || 0
  };
}
```

**Monitorar com UptimeRobot (grátis):**
- https://uptimerobot.com
- Adicionar check de `/health-check` a cada 5 minutos
- Alertas por email se cair

---

### 3. Dashboard de Métricas (2 dias)

```typescript
// src/pages/super-admin/MetricsDashboard.tsx
export const MetricsDashboard = () => {
  const [metrics, setMetrics] = useState({
    activeUsers: 0,
    avgResponseTime: 0,
    errorRate: 0,
    queueLength: 0,
  });
  
  useEffect(() => {
    const interval = setInterval(async () => {
      const { data } = await supabase.rpc('get_system_metrics');
      setMetrics(data);
    }, 30000); // 30s
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="grid grid-cols-4 gap-4">
      <MetricCard
        title="Usuários Ativos"
        value={metrics.activeUsers}
        icon={Users}
      />
      <MetricCard
        title="Tempo Resposta Médio"
        value={`${metrics.avgResponseTime}ms`}
        icon={Zap}
      />
      <MetricCard
        title="Taxa de Erro"
        value={`${metrics.errorRate}%`}
        icon={AlertCircle}
      />
      <MetricCard
        title="Fila de Pagamentos"
        value={metrics.queueLength}
        icon={Clock}
      />
    </div>
  );
};
```

```sql
-- RPC para métricas
CREATE OR REPLACE FUNCTION get_system_metrics()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'activeUsers', (
      SELECT COUNT(DISTINCT "userId") 
      FROM "Transaction" 
      WHERE "createdAt" >= NOW() - INTERVAL '5 minutes'
    ),
    'avgResponseTime', (
      SELECT AVG(duration) 
      FROM "PerformanceMetrics" 
      WHERE timestamp >= NOW() - INTERVAL '1 hour'
    ),
    'errorRate', (
      SELECT ROUND(
        100.0 * COUNT(*) FILTER (WHERE level = 'error') / NULLIF(COUNT(*), 0), 2
      )
      FROM "AppLogs" 
      WHERE timestamp >= NOW() - INTERVAL '1 hour'
    ),
    'queueLength', (
      SELECT COUNT(*) 
      FROM "PaymentQueue" 
      WHERE status = 'pending'
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### ✅ Checklist Fase 3
- [ ] Logger implementado
- [ ] Health check ativo
- [ ] UptimeRobot configurado
- [ ] Dashboard de métricas
- [ ] Alertas por email

**Resultado Esperado:** Visibilidade completa do sistema

---

## 🎯 RESUMO DE IMPACTO

### Antes das Otimizações
```
Usuários simultâneos: 50-100
Transações/dia: 500-1000
Dashboard: 10 queries, ~3s
Listas: Carrega tudo, ~2s
Cache: Nenhum
Monitoramento: Console.log
Score: 7.5/10
```

### Depois das Otimizações (Fase 1+2+3)
```
Usuários simultâneos: 1.000-5.000
Transações/dia: 10.000-50.000
Dashboard: 1 query, ~200ms
Listas: Paginadas + virtualizadas, ~100ms
Cache: Redis + React Query
Monitoramento: Completo + alertas
Score: 9.5/10
```

### Ganhos
- ⬆️ **10x** mais usuários simultâneos
- ⬆️ **15x** mais rápido (dashboard)
- ⬆️ **20x** menos queries
- ⬆️ **100%** de visibilidade

---

## 💰 CUSTOS ESTIMADOS

### Hoje (4 usuários)
```
Supabase: Free tier ($0)
Vercel: Free tier ($0)
Total: $0/mês
```

### Com 1.000 usuários
```
Supabase Pro: $25/mês
Upstash Redis: Free tier → $10/mês
Vercel Pro: $20/mês
Total: $55/mês
```

### Com 10.000 usuários
```
Supabase Pro + Add-ons: $100/mês
Upstash Redis Pro: $50/mês
Vercel Pro: $20/mês
CloudFlare CDN: $20/mês
UptimeRobot Pro: $8/mês
Total: $198/mês
```

**ROI:** Com 10k usuários pagando R$ 49/mês = R$ 490k/mês  
Custo de infra: R$ 1.000/mês (~0.2% da receita)

---

## 📅 CRONOGRAMA

```
Semana 1 (05-09 Fev): Fase 1 - Quick Wins
├─ Seg: Paginação + React Query
├─ Ter: Dashboard otimizado
├─ Qua: Debounce + Build
├─ Qui: Testes
└─ Sex: Deploy

Semana 2 (12-16 Fev): Fase 2 - Cache e Fila
├─ Seg-Ter: Redis + Cache
├─ Qua-Qui: Fila de pagamentos
└─ Sex: Virtualização + Índices

Semana 3-4 (19 Fev - 01 Mar): Fase 3 - Monitoramento
├─ Sem 3: Logging + Health Check
└─ Sem 4: Dashboard métricas + Testes de carga
```

---

## ✅ PRÓXIMOS PASSOS IMEDIATOS

### HOJE (30 min)
1. [ ] Commit da auditoria
2. [ ] Push do repositório
3. [ ] Revisar plano com equipe

### AMANHÃ (Dia 1 - Segunda)
1. [ ] Implementar paginação (2h)
2. [ ] Instalar React Query (1h)
3. [ ] Criar RPC dashboard (2h)
4. [ ] Testar mudanças (1h)

### Esta Semana
1. [ ] Completar Fase 1 (Quick Wins)
2. [ ] Deploy em produção
3. [ ] Monitorar performance
4. [ ] Coletar métricas

---

## 🎓 RECURSOS E REFERÊNCIAS

### Documentação
- React Query: https://tanstack.com/query/latest
- Supabase Performance: https://supabase.com/docs/guides/database/performance
- Upstash Redis: https://upstash.com/docs/redis
- React Virtual: https://tanstack.com/virtual/latest

### Ferramentas
- UptimeRobot: https://uptimerobot.com (free)
- k6 Load Testing: https://k6.io
- Lighthouse: Chrome DevTools
- React DevTools Profiler

---

**Última atualização:** 05/02/2025  
**Próxima revisão:** Após Fase 1 (09/02/2025)