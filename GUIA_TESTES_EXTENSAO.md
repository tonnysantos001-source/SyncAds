# Guia de Testes — Comandos da Extensão

## Pré-requisitos
- [ ] Deploy do chat-stream concluído
- [ ] Extensão Chrome instalada e ativa
- [ ] User logado no SaaS

---

## TESTE 1: Diagnóstico Manual via SQL

### Objetivo
Verificar se deviceId existe e criar comando de teste.

### Passos

1. **Abrir Supabase SQL Editor**
   - Ir em: https://supabase.com/dashboard/project/SEU_PROJECT/sql

2. **Executar Query 1: Ver deviceId**
   ```sql
   SELECT user_id, device_id, status, last_seen
   FROM extension_devices
   WHERE user_id = 'SEU_USER_ID'
   ORDER BY last_seen DESC;
   ```
   
   **✅ Critério de sucesso**: Retorna 1 linha com `status = 'online'`
   
   **❌ Se falhar**: Extensão não está conectada
   - Abrir extensão e verificar status
   - Verificar logs: `chrome.storage.local.get(['deviceId', 'userId'], console.log)`

3. **Copiar deviceId** do resultado acima

4. **Executar Query 2: Criar comando de teste**
   ```sql
   INSERT INTO "ExtensionCommand" (
     "deviceId",
     "userId",
     command,
     params,
     status
   )
   VALUES (
     'DEVICE_ID_AQUI',  -- ⚠️ Cole o deviceId copiado
     'SEU_USER_ID',
     'NAVIGATE',
     '{"url": "https://google.com"}'::jsonb,
     'pending'
   )
   RETURNING id, "deviceId", command, status;
   ```

5. **Aguardar 5 segundos**

6. **Verificar logs da extensão** (DevTools → Background Service Worker)
   
   **✅ Critério de sucesso**:
   ```
   🔍 [AUDIT] Checking commands for deviceId: xxx
   🔍 [AUDIT] Commands returned: [{...}]
   📦 Found 1 pending commands
   🌐 Executing NAVIGATE natively...
   ✅ Navigation completed
   ```

7. **Verificar se aba abriu**
   - Chrome deve ter nova aba com Google

8. **Executar Query 3: Ver status**
   ```sql
   SELECT id, status, result
   FROM "ExtensionCommand"
   WHERE "deviceId" = 'DEVICE_ID_AQUI'
   ORDER BY "createdAt" DESC
   LIMIT 1;
   ```
   
   **✅ Critério de sucesso**: `status = 'completed'`

---

## TESTE 2: Via Chat ("Abra o Google")

### Objetivo
Teste end-to-end via interface do usuário.

### Passos

1. **Abrir SaaS** (frontend)

2. **Abrir DevTools da Extensão**
   - Chrome → Extensions → SyncAds → Service Worker (inspect)

3. **Enviar mensagem**: "Abra o Google"

4. **Verificar logs do BACKEND** (Supabase Functions → chat-stream → Logs)
   
   **✅ Critério de sucesso**:
   ```
   🔍 [AUDIT] User: user_xxx
   🔍 [AUDIT] DeviceId found: device_yyy
   🌐 Creating NAVIGATE command for device: device_yyy
   🔍 [AUDIT] Command INSERT successful
   🔍 [AUDIT] Command ID: cmd_zzz
   ✅ Command created: cmd_zzz
   ```

5. **Verificar logs da EXTENSÃO** (DevTools)
   
   **✅ Critério de sucesso**:
   ```
   🔍 [AUDIT] Checking commands for deviceId: device_yyy
   🔍 [AUDIT] Response status: 200
   🔍 [AUDIT] Commands returned: [{id: "cmd_zzz", ...}]
   📦 Found 1 pending commands
   ✅ Navigation completed
   ```

6. **Verificar Chrome**
   - Nova aba com Google deve abrir

7. **Verificar resposta do chat**
   - User deve receber: "✅ Google aberto com sucesso!"

---

## TESTE 3: Verificação de Logs

### Objetivo
Correlacionar logs backend ↔ extensão.

### Passos

1. **Coletar deviceId da extensão**
   ```javascript
   // No console do DevTools da extensão:
   chrome.storage.local.get(['deviceId'], console.log)
   ```

2. **Copiar deviceId**

3. **Verificar comando no banco**
   ```sql
   SELECT id, "deviceId", status, "createdAt"
   FROM "ExtensionCommand"
   WHERE "deviceId" = 'DEVICE_ID_AQUI'
   ORDER BY "createdAt" DESC
   LIMIT 5;
   ```

4. **Comparar timestamps**
   - Timestamp do INSERT no banco
   - Timestamp do log na extensão
   - Diferença deve ser < 10s

---

## Troubleshooting

### ❌ "No active device found"

**Causa**: Extensão não está online

**Debug**:
```sql
SELECT * FROM extension_devices WHERE user_id = 'USER_ID';
```

**Solução**: 
- Verificar se extensão está instalada
- Recarregar extensão
- Verificar heartbeat

---

### ❌ "⚠️ No pending commands found"

**Causas possíveis**:
1. deviceId diferente
2. Comando não foi criado
3. VIEW não está mapeando

**Debug**:
```sql
-- 1. Ver se comando existe
SELECT * FROM "ExtensionCommand" 
WHERE "userId" = 'USER_ID' 
ORDER BY "createdAt" DESC LIMIT 5;

-- 2. Ver deviceId do comando
SELECT "deviceId" FROM "ExtensionCommand" 
WHERE id = 'COMMAND_ID';

-- 3. Comparar com deviceId da extensão
-- (copiar do chrome.storage.local.get)
```

---

### ❌ Aba não abre

**Causa**: processCommand() falhou

**Debug**:
Verificar logs da extensão para erro em:
```
Processing command {...}
```

---

## Evidências Obrigatórias

Após teste bem-sucedido, coletar:

1. **Screenshot**: Chrome com aba do Google aberta
2. **Backend Logs**: 
   ```
   🔍 [AUDIT] Command created: cmd_xxx
   ```
3. **Extension Logs**:
   ```
   📦 Found 1 pending commands
   ✅ Navigation completed
   ```
4. **SQL**:
   ```sql
   SELECT * FROM "ExtensionCommand" 
   WHERE status = 'completed' 
   ORDER BY "createdAt" DESC LIMIT 1;
   ```

---

## Critério de Sucesso Final

✅ Todos os testes passam:
- [x] TESTE 1: INSERT manual → extensão detecta
- [x] TESTE 2: Chat "Abra o Google" → aba abre
- [x] TESTE 3: Logs correlacionam backend ↔ extensão
- [x] Evidências coletadas
