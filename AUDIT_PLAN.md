# Plano de Auditoria: Sistema de Auto-Diagnóstico e Auto-Correção

## Objetivo

Validar que TODO o sistema está funcionando CORRETAMENTE e que a IA pode REALMENTE:
1. ✅ Diagnosticar erros automaticamente
2. ✅ Corrigir erros sem intervenção manual
3. ✅ Auditar o banco de dados REAL (não simulado)
4. ✅ Fazer edições REAIS (não simuladas)
5. ✅ Trabalhar como administrador REAL

---

## Parte 1: Testes de Componentes Individuais

### 1.1 Testar Edge Function: self-diagnose

**Comando:**
```bash
curl -X POST https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/self-diagnose \
  -H "Content-Type: application/json" \
  -d '{"error_message": "Could not establish connection. Receiving end does not exist.", "context": {"test": true}}'
```

**Resultado Esperado:**
```json
{
  "error_type": "receiving end does not exist",
  "root_cause": "Content script not loaded in target tab",
  "suggested_fix": "Inject content script and retry",
  "auto_fixable": true,
  "fix_code": "await ensureContentScriptInjected(tabId)",
  "severity": "high"
}
```

**Validação:**
- [ ] Edge function está online e respondendo
- [ ] Erro é corretamente identificado
- [ ] Diagnóstico correto é retornado
- [ ] Registro é salvo na tabela `error_diagnoses`

---

### 1.2 Testar Edge Function: self-heal

**Comando:**
```bash
curl -X POST https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/self-heal \
  -H "Content-Type: application/json" \
  -d '{"error_type": "receiving end does not exist", "command_id": "test-123", "device_id": "test-device"}'
```

**Resultado Esperado:**
```json
{
  "healed": true,
  "action": "reinject_content_script",
  "success": true,
  "message": "Content script will be re-injected on retry",
  "retry_recommended": true
}
```

**Validação:**
- [ ] Edge function está online e respondendo
- [ ] Ação de healing é retornada corretamente
- [ ] Registro é salvo na tabela `healing_actions`
- [ ] Estatísticas são atualizadas em `auto_heal_stats`

---

### 1.3 Validar Migrations

**Comando:**
```sql
-- Verificar tabelas criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('error_diagnoses', 'healing_actions', 'auto_heal_stats');

-- Verificar estrutura
\d+ error_diagnoses
\d+ healing_actions
\d+ auto_heal_stats
```

**Validação:**
- [ ] Todas as 3 tabelas existem
- [ ] Índices foram criados corretamente
- [ ] RLS policies estão ativas
- [ ] Trigger `update_auto_heal_stats` funciona

---

### 1.4 Testar Correção de Token Expiry

**Teste Manual:**
1. Abrir DevTools da extensão
2. Executar no console:
```javascript
// Simular token expirado (Unix timestamp em segundos)
state.tokenExpiresAt = Math.floor(Date.now() / 1000) - 3600; // 1 hora atrás

// Aguardar próximo check
// Deve aparecer log de refresh
```

**Validação:**
- [ ] Token é detectado como expirado
- [ ] Log mostra `timeUntilExpiry` correto (negativo)
- [ ] Refresh é chamado automaticamente
- [ ] Sem crash ou erro

---

### 1.5 Testar ensureContentScriptInjected

**Teste Manual:**
1. Navegar para qualquer site
2. Recarregar a página (content script é perdido)
3. Tentar executar comando que precisa de content script
4. Verificar logs

**Validação:**
- [ ] Função detecta que content script não está presente
- [ ] Content script é re-injetado automaticamente
- [ ] Retry acontece após injeção
- [ ] Comando é executado com sucesso

---

## Parte 2: Testes de Integração (End-to-End)

### 2.1 Fluxo Completo: Erro → Diagnose → Heal → Retry

**Cenário:** Simular erro "Receiving end does not exist"

**Passos:**
1. Desabilitar content script
2. Executar comando que precisa de DOM
3. Erro deve ocorrer
4. Auto-heal deve detectar
5. Content script deve ser re-injetado
6. Retry deve funcionar

**Validação:**
- [ ] Erro ocorre conforme esperado
- [ ] Edge function `self-diagnose` é chamada
- [  ] Edge function `self-heal` é chamada
- [ ] Re-injeção automática funciona
- [ ] Comando completa com sucesso no retry
- [ ] Registros salvos em ambas as tabelas

---

### 2.2 Fluxo Google Docs: Create → Insert → URL Capture

**Cenário:** Testar criação completa de documento com auto-correção

**Passos:**
1. Solicitar criação de documento via chat
2. Aguardar execução
3. Verificar que qualquer erro é auto-corrigido
4. URL deve ser capturada e exibida no chat

**Validação:**
- [ ] Documento criado com sucesso
- [ ] Conteúdo inserido corretamente
- [ ] URL capturada
- [ ] Link exibido no chat
- [ ] Se houve erro, foi auto-corrigido

---

## Parte 3: Auditoria Real (Não Simulada)

### 3.1 Verificar Acesso Real ao Supabase

**MCP Server Supabase:**
```javascript
// Via MCP
const tables = await mcp_supabase.list_tables({ project_id: "ovskepqggmxlfckxqgbr" });
console.log(tables);
```

**Validação:**
- [ ] MCP server Supabase está conectado
- [ ] Pode listar tabelas REAIS
- [ ] Pode executar queries REAIS
- [ ] NÃO é simulado

---

### 3.2 Verificar Acesso Real ao GitHub

**MCP Server GitHub (se configurado):**
```javascript
// Verificar repositório
const repo = await mcp_github.get_repository({
  owner: "tonnysantos001",
  repo: "SyncAds"
});
console.log(repo);
```

**Validação:**
- [ ] MCP server GitHub está conectado (se configurado)
- [ ] Pode acessar repositório REAL
- [ ] Pode criar issues/PRs REAIS
- [ ] NÃO é simulado

---

### 3.3 Auditar Estatísticas de Auto-Heal

**Query SQL:**
```sql
SELECT 
  error_type,
  total_occurrences,
  total_healed,
  total_failed,
  success_rate,
  last_occurrence,
  last_successful_heal
FROM auto_heal_stats
ORDER BY success_rate DESC;
```

**Validação:**
- [ ] Estatísticas estão sendo atualizadas
- [ ] Success rate está sendo calculado corretamente
- [ ] Dados REAIS (não mock)

---

## Parte 4: Testes de MCPServers para Administração Real

### 4.1 Configurar MCP Servers

**Arquivo: `.mcp/config.json` (se não existir, criar)**
```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["@supabase/mcp-server", "ovskepqggmxlfckxqgbr"],
      "env": {
        "SUPABASE_URL": "https://ovskepqggmxlfckxqgbr.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "${SUPABASE_SERVICE_ROLE_KEY}"
      }
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```

**Validação:**
- [ ] Arquivo criado corretamente
- [ ] Variáveis de ambiente definidas
- [ ] MCP servers iniciam sem erro

---

### 4.2 Testar Execução REAL via MCP

**Test 1: Criar tabela via MCP Supabase**
```javascript
await mcp_supabase.apply_migration({
  project_id: "ovskepqggmxlfckxqgbr",
  name: "test_mcp_real_access",
  query: "CREATE TABLE IF NOT EXISTS test_mcp_table (id UUID PRIMARY KEY, value TEXT);"
});
```

**Test 2: Inserir dados via MCP**
```javascript
await mcp_supabase.execute_sql({
  project_id: "ovskepqggmxlfckxqgbr",
  query: "INSERT INTO test_mcp_table (id, value) VALUES (gen_random_uuid(), 'Test from MCP');"
});
```

**Test 3: Consultar dados**
```javascript
const result = await mcp_supabase.execute_sql({
  project_id: "ovskepqggmxlfckxqgbr",
  query: "SELECT * FROM test_mcp_table;"
});
console.log(result); // Deve mostrar dados REAIS
```

**Validação:**
- [ ] Tabela criada REALMENTE no banco
- [ ] Dados inseridos REALMENTE
- [ ] Query retorna dados REAIS
- [ ] Confirmar via Supabase Dashboard

---

### 4.3 Testar GitHub MCP

**Test 1: Listar Issues**
```javascript
const issues = await mcp_github.list_issues({
  owner: "tonnysantos001",
  repo: "SyncAds",
  state: "open"
});
console.log(issues);
```

**Test 2: Criar Issue (opcional - apenas se aprovado)**
```javascript
const newIssue = await mcp_github.create_issue({
  owner: "tonnysantos001",
  repo: "SyncAds",
  title: "Test from MCP Server",
  body: "This is a test issue created by the AI via MCP server to validate real access."
});
console.log(newIssue);
```

**Validação:**
- [ ] Lista issues REAIS do repositório
- [ ] Pode criar issue REAL (se testado)
- [ ] NÃO é simulação

---

## Parte 5: Validação da IA como Administrador

### 5.1 Criar Script de Auto-Auditoria

**Arquivo: `scripts/ai-self-audit.cjs`**

Este script será executado PELA IA para auditar a si mesma:

```javascript
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function selfAudit() {
  console.log('\n🔍 AI SELF-AUDIT INICIADO...\n');
  
  // 1. Verificar edge functions
  console.log('📡 Testando edge functions...');
  // ... testes
  
  // 2. Verificar banco de dados
  console.log('🗄️ Auditando banco de dados...');
  const { data: tables } = await supabase.rpc('get_tables');
  console.log(tables);
  
  // 3. Verificar estatísticas auto-heal
  console.log('🩹 Verificando Auto-Heal Stats...');
  const { data: stats } = await supabase.from('auto_heal_stats').select('*');
  console.log(stats);
  
  // 4. Gerar relatório
  console.log('\n✅ AUDITORIA COMPLETA\n');
}

selfAudit();
```

**Validação:**
- [ ] IA pode executar script
- [ ] IA pode ler dados REAIS
- [ ] IA pode gerar relatório
- [ ] NÃO é simulação

---

## Parte 6: Checklist Final de Auditoria

### Edge Functions
- [ ] `self-diagnose` deployado e funcional
- [ ] `self-heal` deployado e funcional
- [ ] Ambas retornam respostas corretas
- [ ] Ambas salvam logs no banco

### Database
- [ ] Tabela `error_diagnoses` criada
- [ ] Tabela `healing_actions` criada
- [ ] Tabela `auto_heal_stats` criada
- [ ] RLS policies configuradas
- [ ] Triggers funcionando

### Extensão
- [ ] `auto-heal.js` integrado
- [ ] `ensureContentScriptInjected` funciona
- [ ] Token expiry calculation correto
- [ ] Retry logic funcionando

### Integração End-to-End
- [ ] Erro → Diagnose → Heal → Retry funciona
- [ ] Google Docs flow completo funciona
- [ ] URL capture funciona
- [ ] Chat display funciona

### MCP Servers (Administração Real)
- [ ] Supabase MCP servidor configurado
- [ ] GitHub MCP servidor configurado (opcional)
- [ ] IA pode executar queries REAIS
- [ ] IA pode fazer alterações REAIS
- [ ] NÃO é simulado

### Auto-Correção
- [ ] Taxa de sucesso > 80%
- [ ] Tempo médio de healing < 3s
- [ ] Zero intervenção manual necessária

---

## Comandos de Auditoria (Executar Sequencialmente)

```bash
# 1. Verificar edge functions estão online
curl https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/self-diagnose
curl https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/self-heal

# 2. Verificar migrations aplicadas
npx supabase db pull

# 3. Verificar estatísticas
npx supabase db execute "SELECT * FROM auto_heal_stats;"

# 4. Executar script de auto-auditoria
node scripts/ai-self-audit.cjs

# 5. Build e teste da extensão
cd chrome-extension
# Carregar extensão no Chrome e testar manualmente
```

---

## Resultado Final Esperado

✅ **Sistema 100% Funcional:**
- Edge functions deployadas e testadas
- Database migrations aplicadas
- Auto-heal funcionando end-to-end
- Taxa de sucesso > 80%
- IA pode auditar e editar REALMENTE
- Zero simulação, tudo REAL

🎉 **IA do SyncAds agora é autônoma e se auto-corrige!**
