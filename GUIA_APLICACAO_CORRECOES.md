# 🔧 GUIA DE APLICAÇÃO DAS CORREÇÕES DE SEGURANÇA

**Data:** 8 de Dezembro de 2025  
**Prioridade:** 🔴 CRÍTICA  
**Tempo Estimado:** 2-3 horas  

---

## ⚠️ IMPORTANT

O arquivo `python-service/app/main.py` é muito complexo (1096 linhas) para edição automática segura.  
**As correções devem ser aplicadas MANUALMENTE para evitar corromper o código.**

---

## 🎯 CORREÇÕES A APLICAR

### 1. CORS Security Fix (30 min) 🔴 CRÍTICA

**Arquivo:** `python-service/app/main.py`  
**Linhas:** 30-39

**❌ CÓDIGO ATUAL (INSEGURO):**
```python
# ==========================================
# CORS
# ==========================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],           # ← VULNERABILIDADE!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**✅ CÓDIGO CORRETO (SEGURO):**
```python
# ==========================================
# CORS - SECURITY: Lista específica de origens permitidas
# ==========================================
import os  # Adicionar se ainda não existir no topo

# Origens permitidas (configurável via env)
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "https://syncads.com,https://app.syncads.com,http://localhost:5173,http://localhost:3000"
).split(",")

# Em produção, remover localhosts
if os.getenv("ENVIRONMENT") == "production":
    ALLOWED_ORIGINS = [origin for origin in ALLOWED_ORIGINS if "localhost" not in origin]
    logger.info(f"🔒 Production mode: CORS origins = {ALLOWED_ORIGINS}")
else:
    logger.info(f"🔓 Development mode: CORS origins = {ALLOWED_ORIGINS}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,  # ✅ Lista específica
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],  # ✅ Específico
    allow_headers=["Content-Type", "Authorization", "Accept"],  # ✅ Específico
)
```

**Variável de Ambiente (.env):**
```bash
# Desenvolvimento
ALLOWED_ORIGINS=https://syncads.com,https://app.syncads.com,http://localhost:5173,http://localhost:3000

# Produção (.env.production)
ENVIRONMENT=production
ALLOWED_ORIGINS=https://syncads.com,https://app.syncads.com
```

---

### 2. JWT Validation Bypass Fix (15 min) 🔴 CRÍTICA

**Arquivo:** `python-service/app/main.py`  
**Função:** `validate_jwt`  
**Linhas:** ~295-297

**❌ CÓDIGO ATUAL (INSEGURO):**
```python
if not SUPABASE_JWT_SECRET:
    logger.warning("JWT validation skipped - no secret configured")
    return {"sub": "anonymous"}  # ← BYPASS DE SEGURANÇA!
```

**✅ CÓDIGO CORRETO (SEGURO):**
```python
# ✅ SECURITY FIX: Não permitir bypass de validação
if not SUPABASE_JWT_SECRET:
    logger.error("🔴 CRITICAL: JWT secret not configured - cannot validate tokens")
    raise HTTPException(
        status_code=500,
        detail="Server configuration error: JWT validation unavailable"
    )
```

---

### 3. Remover API Key de Response (1h) 🔴 ALTA

**Problema:** Buscar TODAS as ocorrências onde API keys são incluídas em responses HTTP

**Comando de busca:**
```bash
cd python-service
grep -n "apiKey.*getenv" app/*.py app/**/*.py
```

**Locais conhecidos:**

#### 3.1 Chat Endpoint (main.py ~linha 637)

**❌ REMOVER:**
```python
response_config = {
    "model": model,
    "provider": provider,
    "apiKey": os.getenv("ANTHROPIC_API_KEY"),  # ← REMOVER!
    "maxTokens": ai_config.get("maxTokens", 4096),
    "temperature": ai_config.get("temperature", 1.0),
}
```

**✅ SUBSTITUIR POR:**
```python
response_config = {
    "model": model,
    "provider": provider,
    # ❌ REMOVIDO: "apiKey" - NÃO expor secrets!
    "maxTokens": ai_config.get("maxTokens", 4096),
    "temperature": ai_config.get("temperature", 1.0),
    "hasApiKey": bool(ai_config.get("apiKey")),  # Apenas boolean
}
```

#### 3.2 Outros locais

Procurar em TODO o projeto e remover QUALQUER ocorrência de:
```python
"apiKey": os.getenv(...)
"api_key": os.getenv(...)
"secret": os.getenv(...)
"token": os.getenv(...)  # Se for secret token
```

**Regra:** API Keys NUNCA devem sair do backend!

---

### 4. Criptografia de Secrets no Database (1-2h) 🔴 CRÍTICA

**Problema:** API keys armazenadas em plain text no Supabase!

#### 4.1 Criar Migration SQL

**Arquivo:** `supabase/migrations/YYYYMMDDHHMMSS_encrypt_secrets.sql`

```sql
-- ============================================
-- MIGRATION: Criptografar Secrets do Database
-- Data: 2025-12-08
-- Prioridade: CRÍTICA
-- ============================================

-- 1. Habilitar pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Configurar chave de encriptação (via config)
-- IMPORTANTE: Fazer isso ANTES via Supabase Dashboard ou SQL
-- ALTER DATABASE postgres SET app.encryption_key = 'sua-chave-forte-min-32-chars';

-- ============================================
-- 3. GlobalAiConnection - Criptografar apiKey
-- ============================================

-- Criar nova coluna encriptada
ALTER TABLE "GlobalAiConnection"
ADD COLUMN IF NOT EXISTS encrypted_api_key BYTEA;

-- Migrar dados existentes
UPDATE "GlobalAiConnection"
SET encrypted_api_key = pgp_sym_encrypt(
  "apiKey", 
  current_setting('app.encryption_key')
)
WHERE "apiKey" IS NOT NULL
  AND encrypted_api_key IS NULL;

-- Remover coluna plain text (CUIDADO! Backup antes!)
-- ALTER TABLE "GlobalAiConnection" DROP COLUMN "apiKey";

-- ============================================
-- 4. GatewayConfig - Criptografar credentials
-- ============================================

-- JSONB já está parcialmente protegido, mas vamos reforçar
ALTER TABLE "GatewayConfig"
ADD COLUMN IF NOT EXISTS encrypted_credentials BYTEA;

UPDATE "GatewayConfig"
SET encrypted_credentials = pgp_sym_encrypt(
  credentials::TEXT,
  current_setting('app.encryption_key')
)
WHERE credentials IS NOT NULL
  AND encrypted_credentials IS NULL;

-- ============================================
-- 5. OAuthConfig - Criptografar clientSecret
-- ============================================

ALTER TABLE "OAuthConfig"
ADD COLUMN IF NOT EXISTS encrypted_client_secret BYTEA;

UPDATE "OAuthConfig"
SET encrypted_client_secret = pgp_sym_encrypt(
  "clientSecret",
  current_setting('app.encryption_key')
)
WHERE "clientSecret" IS NOT NULL
  AND encrypted_client_secret IS NULL;

-- ============================================
-- 6. ShopifyIntegration - Criptografar accessToken
-- ============================================

ALTER TABLE "ShopifyIntegration"
ADD COLUMN IF NOT EXISTS encrypted_access_token BYTEA;

UPDATE "ShopifyIntegration"
SET encrypted_access_token = pgp_sym_encrypt(
  "accessToken",
  current_setting('app.encryption_key')
)
WHERE "accessToken" IS NOT NULL
  AND encrypted_access_token IS NULL;

-- ============================================
-- 7. Functions Helper para Decrypt
-- ============================================

CREATE OR REPLACE FUNCTION decrypt_api_key(encrypted bytea)
RETURNS TEXT AS $$
BEGIN
  RETURN pgp_sym_decrypt(encrypted, current_setting('app.encryption_key'))::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrypt_credentials(encrypted bytea)
RETURNS JSONB AS $$
BEGIN
  RETURN pgp_sym_decrypt(encrypted, current_setting('app.encryption_key'))::JSONB;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. COMENTÁRIOS
-- ============================================
COMMENT ON FUNCTION decrypt_api_key(bytea) IS 'Decripta API Key armazenada com pgcrypto';
COMMENT ON FUNCTION decrypt_credentials(bytea) IS 'Decripta credentials JSONB';

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================
DO $$
DECLARE
  encrypted_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO encrypted_count
  FROM "GlobalAiConnection"
  WHERE encrypted_api_key IS NOT NULL;
  
  RAISE NOTICE '✅ GlobalAiConnection: % registros criptografados', encrypted_count;
END $$;
```

#### 4.2 Configurar Chave de Encriptação

**Supabase Dashboard:**
1. Ir em Settings → Database
2. Connection Pooling → Custom Postgres Config
3. Adicionar: `app.encryption_key` = `sua-chave-forte-min-32-chars`

**OU via SQL:**
```sql
ALTER DATABASE postgres 
SET app.encryption_key = 'sua-chave-forte-aleatoria-min-32-caracteres-aqui';
```

**⚠️ IMPORTANTE:** 
- Usar chave forte (>= 32 caracteres)
- Armazenar chave em local seguro (password manager)
- NÃO commitar chave no git!

---

#### 4.3 Atualizar Código Backend

**Arquivo:** `python-service/app/main.py`

Onde buscar `apiKey`, mudar para:

```python
# ❌ ANTES:
api_key = ai_config.get("apiKey")

# ✅ DEPOIS:
# Buscar do campo criptografado
api_key_encrypted = ai_config.get("encrypted_api_key")
if api_key_encrypted:
    # Decriptar usando function do Supabase
    api_key = await decrypt_secret(api_key_encrypted)
else:
    # Fallback para env var
    api_key = os.getenv("ANTHROPIC_API_KEY")
```

**Nova função helper:**
```python
async def decrypt_secret(encrypted_data: bytes) -> str:
    """Decripta secret usando Supabase function"""
    try:
        result = await supabase.rpc('decrypt_api_key', {'encrypted': encrypted_data}).execute()
        return result.data
    except Exception as e:
        logger.error(f"❌ Erro ao decriptar secret: {e}")
        return None
```

---

## 📋 CHECKLIST DE APLICAÇÃO

### Antes de Começar
- [ ] Fazer backup do database
- [ ] Fazer backup dos arquivos que serão editados
- [ ] Testar em ambiente de desenvolvimento primeiro

### Ordem de Aplicação
1. [ ] **CORS Fix** (mais fácil e mais crítico)
2. [ ] **JWT Validation Fix** (rápido)
3. [ ] **Remover API Keys de Responses** (buscar tudo)
4. [ ] **Encriptação no DB** (mais complexo)

### Aplicação - CORS (30 min)
- [ ] Abrir `python-service/app/main.py`
- [ ] Localizar linhas 30-39 (bloco CORS)
- [ ] Copiar código correto acima
- [ ] Colar substituindo o  bloco antigo
- [ ] Verificar indentação
- [ ] Adicionar `import os` se necessário (topo do arquivo)
- [ ] Adicionar variável `ALLOWED_ORIGINS` no `.env`
- [ ] Salvar arquivo

### Aplicação - JWT (15 min)
- [ ] No mesmo arquivo `python-service/app/main.py`
- [ ] Buscar função `validate_jwt` (~linha 288)
- [ ] Localizar `if not SUPABASE_JWT_SECRET:`
- [ ] Substituir o `logger.warning` e `return` pelo código correto
- [ ] Salvar arquivo

### Aplicação - API Keys (1h)
- [ ] Buscar: `grep -r "apiKey.*getenv" python-service/`
- [ ] Para CADA ocorrência:
  - [ ] Verificar se está em response HTTP
  - [ ] Se sim, remover campo `apiKey`
  - [ ] Se necessário validação, usar `hasApiKey: bool`
- [ ] Verificar também `api_key`, `secret`, etc
- [ ] Salvar todos os arquivos modificados

### Aplicação - Encriptação DB (1-2h)
- [ ] **BACKUP DO DATABASE PRIMEIRO!**
- [ ] Configurar `app.encryption_key` no Supabase
- [ ] Criar arquivo de migration
- [ ] Testar em ambiente de dev
- [ ] Verificar se dados foram criptografados
- [ ] Atualizar código backend para usar campos criptografados
- [ ] Testar end-to-end
- [ ] Aplicar em produção

### Testes Pós-Aplicação
- [ ] Testar login/auth
- [ ] Testar chat
- [ ] Testar geração de imagens
- [ ] Verificar logs (sem erros CORS)
- [ ] Verificar que API keys NÃO aparecem em network inspector

### Verificação Final
- [ ] `npm run dev` - frontend funciona
- [ ] Backend responde (health check)
- [ ] Sem erros no console
- [ ] Sem erros de CORS
- [ ] JWT validation funciona
- [ ] Secrets criptografados no DB

---

## 🚨 TROUBLESHOOTING

### Erro: CORS ainda bloqueando

**Sintoma:** Frontend não consegue acessar backend

**Solução:**
1. Verificar variável `ALLOWED_ORIGINS` no `.env`
2. Verificar se backend recarregou (restartar)
3. Verificar logs: `logger.info(f"CORS origins = {ALLOWED_ORIGINS}")`
4. Se localhost não funciona, adicionar explicitamente

### Erro: JWT validation failed

**Sintoma:** 500 error ao fazer requests

**Solução:**
1. Verificar se `SUPABASE_JWT_SECRET` está configurado
2. Se não estiver, adicionar no `.env`:
   ```
   SUPABASE_JWT_SECRET=seu-jwt-secret-do-supabase
   ```
3. Encontrar secret em: Supabase Dashboard → Settings → API → JWT Secret

### Erro: Decriptação falhou

**Sintoma:** Erro ao buscar API keys

**Solução:**
1. Verificar se `app.encryption_key` está configurada
2. Verificar se migration rodou corretamente
3. Verificar se função `decrypt_api_key` existe:
   ```sql
   SELECT proname FROM pg_proc WHERE proname = 'decrypt_api_key';
   ```

---

## 📊 IMPACTO ESPERADO

**Antes:**
- 🔴 2 vulnerabilidades CRÍTICAS ativas
- 🔴 API keys podem ser roubadas
- 🔴 CSRF possível
- 🔴 Secrets em plain text no DB

**Depois:**
- ✅ CORS seguro com whitelist
- ✅ JWT obrigatório (sem bypass)
- ✅ API keys NUNCA expostas
- ✅ Secrets criptografados no DB
- ✅ Sistema pronto para lançamento

---

## 🎯 PRÓXIMOS PASSOS (Depois destas correções)

1. ✅ Implementar Rate Limiting
2. ✅ Adicionar XSS Protection
3. ✅ Composite Indexes no DB
4. ✅ Testes E2E
5. ✅ Deploy Staging
6. ✅ UAT (User Acceptance Testing)
7. ✅ Deploy Produção

---

**IMPORTANTE:** Fazer estas correções ANTES de lançar em produção!

**Tempo Total Estimado:** 2-3 horas  
**Prioridade:** 🔴 CRÍTICA  
**Bloqueador de Lançamento:** SIM
