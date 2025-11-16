# 🚀 PROMPT DE CONTINUAÇÃO - EXTENSÃO CHROME SYNCADS

**Data:** 16/01/2025  
**Versão:** 1.0.0  
**Status:** Fase 1 Concluída - Iniciar Fase 2

---

## 📋 CONTEXTO COMPLETO

Estou desenvolvendo o **SyncAds**, um SaaS de marketing digital com IA. Acabei de criar a **primeira extensão Chrome do Brasil** que permite automação inteligente via IA.

### O QUE JÁ FOI FEITO (100% CONCLUÍDO):

1. ✅ **Extensão Chrome MVP criada** em `chrome-extension/`
   - manifest.json (Manifest V3)
   - background.js (612 linhas - Service Worker com long polling)
   - content-script.js (602 linhas - Manipulação DOM)
   - popup.html e popup.js (Interface moderna)
   - README.md completo

2. ✅ **Página de Download criada** em `src/pages/app/ExtensionPage.tsx`
   - Design moderno com gradientes
   - Instruções passo a passo
   - Botão de download

3. ✅ **Menu adicionado** no dashboard
   - Item "Extensão do Navegador" no Sidebar
   - Rota `/app/extension` configurada

4. ✅ **Deploy realizado**
   - Frontend: https://syncads-njplhgitt-fatima-drivias-projects.vercel.app
   - Backend: https://syncads-python-microservice-production.up.railway.app
   - Branch: `feature/browser-extension`

### STACK TÉCNICA ATUAL:

**Frontend:**
- React + TypeScript + Vite
- Vercel (deploy)
- Supabase (database)

**Backend:**
- Python + FastAPI
- Railway (deploy)
- Claude 4.5 Sonnet (IA principal)

**Extensão:**
- Manifest V3
- Long polling para comunicação
- 8 tipos de comandos (DOM_READ, DOM_CLICK, DOM_FILL, etc)

---

## 🎯 PRÓXIMOS 4 PASSOS A IMPLEMENTAR

### PASSO 1: CRIAR ÍCONES DA EXTENSÃO

**Objetivo:** Criar ícones 16x16, 48x48 e 128x128 para a extensão

**Pasta:** `chrome-extension/icons/`

**O que fazer:**
1. Criar 3 arquivos PNG:
   - `icon16.png` (16x16 pixels)
   - `icon48.png` (48x48 pixels)
   - `icon128.png` (128x128 pixels)

2. Design sugerido:
   - Ícone com símbolo de robô 🤖 ou cérebro 🧠
   - Cores: Gradiente roxo/azul (#667eea → #764ba2)
   - Fundo transparente
   - Estilo moderno e minimalista

3. Alternativa: Usar ferramenta online
   - https://www.favicon-generator.org/
   - Ou criar SVG simples e converter

**Código necessário:** Nenhum (apenas arquivos PNG)

---

### PASSO 2: CRIAR ENDPOINTS DA API NO BACKEND PYTHON

**Objetivo:** Criar 4 endpoints para comunicação com a extensão

**Arquivo:** `python-service/app/main.py`

**Adicionar após linha ~500 (após endpoint /api/chat):**

```python
# ==========================================
# EXTENSION API ENDPOINTS
# ==========================================

@app.post("/api/extension/register")
async def register_extension(request: Request):
    """
    Registra dispositivo da extensão
    Body: { deviceId, userId, browser, version, timestamp }
    """
    try:
        data = await request.json()
        
        # Salvar no Supabase
        result = supabase.table("extension_devices").upsert({
            "device_id": data["deviceId"],
            "user_id": data["userId"],
            "browser_info": data.get("browser"),
            "version": data.get("version"),
            "status": "online",
            "last_seen": datetime.utcnow().isoformat()
        }).execute()
        
        logger.info(f"✅ Extension registered: {data['deviceId']}")
        
        return {
            "success": True,
            "deviceId": data["deviceId"],
            "message": "Extension registered successfully"
        }
        
    except Exception as e:
        logger.error(f"❌ Registration error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/extension/commands")
async def get_extension_commands(deviceId: str):
    """
    Long polling - retorna comandos pendentes para a extensão
    Query: ?deviceId=device_xxx
    """
    try:
        # Buscar comandos pendentes no Supabase
        result = supabase.table("extension_commands").select("*").eq(
            "device_id", deviceId
        ).eq("status", "pending").order("created_at").execute()
        
        commands = result.data if result.data else []
        
        # Marcar como "processing"
        if commands:
            command_ids = [cmd["id"] for cmd in commands]
            supabase.table("extension_commands").update({
                "status": "processing",
                "started_at": datetime.utcnow().isoformat()
            }).in_("id", command_ids).execute()
        
        return {
            "success": True,
            "commands": commands,
            "count": len(commands)
        }
        
    except Exception as e:
        logger.error(f"❌ Commands fetch error: {e}")
        return {"success": False, "commands": [], "error": str(e)}


@app.post("/api/extension/result")
async def receive_extension_result(request: Request):
    """
    Recebe resultado de comando executado pela extensão
    Body: { deviceId, commandId, result, timestamp }
    """
    try:
        data = await request.json()
        
        # Atualizar comando no Supabase
        supabase.table("extension_commands").update({
            "status": "completed" if data["result"]["success"] else "failed",
            "result": data["result"],
            "completed_at": datetime.utcnow().isoformat()
        }).eq("id", data["commandId"]).execute()
        
        logger.info(f"✅ Command result received: {data['commandId']}")
        
        # Broadcast para dashboard via Supabase Realtime
        supabase.table("extension_logs").insert({
            "device_id": data["deviceId"],
            "command_id": data["commandId"],
            "result": data["result"],
            "timestamp": data["timestamp"]
        }).execute()
        
        return {"success": True, "message": "Result received"}
        
    except Exception as e:
        logger.error(f"❌ Result error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/extension/log")
async def receive_extension_log(request: Request):
    """
    Recebe logs da extensão
    Body: { deviceId, userId, action, message, data, timestamp }
    """
    try:
        data = await request.json()
        
        # Salvar log no Supabase
        supabase.table("extension_logs").insert({
            "device_id": data["deviceId"],
            "user_id": data.get("userId"),
            "action": data["action"],
            "message": data["message"],
            "data": data.get("data"),
            "url": data.get("url"),
            "timestamp": data["timestamp"]
        }).execute()
        
        return {"success": True}
        
    except Exception as e:
        logger.error(f"❌ Log error: {e}")
        return {"success": False, "error": str(e)}
```

**Testar:**
```bash
curl -X POST https://syncads-python-microservice-production.up.railway.app/api/extension/register \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"test123","userId":"user1","browser":{"userAgent":"Chrome"}}'
```

---

### PASSO 3: CRIAR TABELAS NO SUPABASE

**Objetivo:** Criar 3 tabelas para armazenar dados da extensão

**Onde executar:** Supabase SQL Editor
**URL:** https://supabase.com/dashboard/project/ovskepqggmxlfckxqgbr/editor

**SQL a executar:**

```sql
-- ==========================================
-- TABELA 1: EXTENSION_DEVICES
-- Armazena dispositivos registrados
-- ==========================================
CREATE TABLE IF NOT EXISTS extension_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  browser_info JSONB,
  version TEXT,
  status TEXT DEFAULT 'offline',
  last_seen TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_extension_devices_user_id ON extension_devices(user_id);
CREATE INDEX idx_extension_devices_device_id ON extension_devices(device_id);
CREATE INDEX idx_extension_devices_status ON extension_devices(status);

-- RLS
ALTER TABLE extension_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own devices"
  ON extension_devices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own devices"
  ON extension_devices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own devices"
  ON extension_devices FOR UPDATE
  USING (auth.uid() = user_id);

-- ==========================================
-- TABELA 2: EXTENSION_COMMANDS
-- Armazena comandos a serem executados
-- ==========================================
CREATE TABLE IF NOT EXISTS extension_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL REFERENCES extension_devices(device_id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- DOM_READ, DOM_CLICK, etc
  selector TEXT,
  value TEXT,
  options JSONB,
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Índices
CREATE INDEX idx_extension_commands_device_id ON extension_commands(device_id);
CREATE INDEX idx_extension_commands_user_id ON extension_commands(user_id);
CREATE INDEX idx_extension_commands_status ON extension_commands(status);
CREATE INDEX idx_extension_commands_created_at ON extension_commands(created_at DESC);

-- RLS
ALTER TABLE extension_commands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own commands"
  ON extension_commands FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own commands"
  ON extension_commands FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- TABELA 3: EXTENSION_LOGS
-- Armazena logs de execução
-- ==========================================
CREATE TABLE IF NOT EXISTS extension_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  command_id UUID REFERENCES extension_commands(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  message TEXT,
  data JSONB,
  url TEXT,
  result JSONB,
  timestamp BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_extension_logs_device_id ON extension_logs(device_id);
CREATE INDEX idx_extension_logs_user_id ON extension_logs(user_id);
CREATE INDEX idx_extension_logs_command_id ON extension_logs(command_id);
CREATE INDEX idx_extension_logs_created_at ON extension_logs(created_at DESC);

-- RLS
ALTER TABLE extension_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own logs"
  ON extension_logs FOR SELECT
  USING (auth.uid() = user_id);

-- ==========================================
-- FUNÇÃO DE CLEANUP (OPCIONAL)
-- Remove logs antigos automaticamente
-- ==========================================
CREATE OR REPLACE FUNCTION cleanup_old_extension_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM extension_logs
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Agendar cleanup (executar manualmente ou via cron)
-- SELECT cleanup_old_extension_logs();
```

**Verificar:**
```sql
-- Ver tabelas criadas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'extension%';

-- Ver estrutura
\d extension_devices
\d extension_commands
\d extension_logs
```

---

### PASSO 4: INTEGRAR CHAT IA COM EXTENSÃO

**Objetivo:** Fazer o chat IA enviar comandos para a extensão

**Arquivo:** `python-service/app/main.py`

**Modificar função do chat (linha ~250):**

```python
# Adicionar após detectar tool_intent

if tool_intent:
    logger.info(f"🛠️ TOOL DETECTED! Executando ferramenta: {tool_intent}")

    try:
        # NOVO: Verificar se precisa usar extensão do navegador
        if tool_intent in ["dom_automation", "browser_action", "web_automation"]:
            # Criar comando para extensão
            command_id = await send_command_to_extension(
                user_id=user_id,
                command_type=request.command_type,  # DOM_CLICK, DOM_FILL, etc
                selector=request.selector,
                value=request.value,
                options=request.options
            )
            
            # Aguardar resultado (com timeout)
            tool_result = await wait_for_command_result(command_id, timeout=30)
        
        elif tool_intent == "image":
            # Gerar imagem com Pollinations.ai
            logger.info(f"🎨 Iniciando geração de imagem")
            image_gen = create_image_generator()
            tool_result = await image_gen.generate(request.message)
        
        # ... resto do código
```

**Adicionar funções auxiliares:**

```python
async def send_command_to_extension(
    user_id: str,
    command_type: str,
    selector: str = None,
    value: str = None,
    options: dict = None
) -> str:
    """
    Envia comando para extensão do navegador
    """
    try:
        # Buscar device ativo do usuário
        result = supabase.table("extension_devices").select("device_id").eq(
            "user_id", user_id
        ).eq("status", "online").limit(1).execute()
        
        if not result.data or len(result.data) == 0:
            raise Exception("Nenhuma extensão conectada. Por favor, instale e ative a extensão.")
        
        device_id = result.data[0]["device_id"]
        
        # Criar comando
        command = supabase.table("extension_commands").insert({
            "device_id": device_id,
            "user_id": user_id,
            "type": command_type,
            "selector": selector,
            "value": value,
            "options": options or {},
            "status": "pending"
        }).execute()
        
        command_id = command.data[0]["id"]
        logger.info(f"✅ Command created: {command_id}")
        
        return command_id
        
    except Exception as e:
        logger.error(f"❌ Error sending command: {e}")
        raise


async def wait_for_command_result(command_id: str, timeout: int = 30) -> dict:
    """
    Aguarda resultado do comando (polling)
    """
    import asyncio
    
    start_time = time.time()
    
    while time.time() - start_time < timeout:
        # Verificar status do comando
        result = supabase.table("extension_commands").select("*").eq(
            "id", command_id
        ).execute()
        
        if result.data and len(result.data) > 0:
            command = result.data[0]
            
            if command["status"] == "completed":
                return command["result"]
            elif command["status"] == "failed":
                return {
                    "success": False,
                    "error": command.get("result", {}).get("error", "Command failed")
                }
        
        # Aguardar 500ms antes de verificar novamente
        await asyncio.sleep(0.5)
    
    # Timeout
    return {
        "success": False,
        "error": f"Command timeout after {timeout}s"
    }
```

---

## 🔧 INFORMAÇÕES TÉCNICAS NECESSÁRIAS

### Credenciais Supabase:
```
URL: https://ovskepqggmxlfckxqgbr.supabase.co
SERVICE_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92c2tlcHFnZ214bGZja3hxZ2JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDgyNDg1NSwiZXhwIjoyMDc2NDAwODU1fQ.eZHK4OlfKTChZ9BqocoJ1NS6UsPqaFfHE6_1e73ROok
```

### URLs de Deploy:
```
Frontend: https://syncads-njplhgitt-fatima-drivias-projects.vercel.app
Backend: https://syncads-python-microservice-production.up.railway.app
```

### Estrutura de Pastas:
```
SyncAds/
├── chrome-extension/          # Extensão Chrome
│   ├── icons/                 # ⏳ PASSO 1 - Criar ícones aqui
│   ├── manifest.json
│   ├── background.js
│   ├── content-script.js
│   ├── popup.html
│   └── popup.js
├── python-service/
│   └── app/
│       └── main.py           # ⏳ PASSO 2 - Adicionar endpoints aqui
├── src/
│   ├── pages/app/
│   │   └── ExtensionPage.tsx # ✅ Já criado
│   └── components/layout/
│       └── Sidebar.tsx        # ✅ Já configurado
```

---

## 📝 CHECKLIST DE IMPLEMENTAÇÃO

```
PASSO 1: ÍCONES
[ ] Criar icon16.png
[ ] Criar icon48.png  
[ ] Criar icon128.png
[ ] Testar extensão com novos ícones

PASSO 2: ENDPOINTS API
[ ] Adicionar /api/extension/register
[ ] Adicionar /api/extension/commands
[ ] Adicionar /api/extension/result
[ ] Adicionar /api/extension/log
[ ] Testar com curl
[ ] Deploy no Railway

PASSO 3: TABELAS SUPABASE
[ ] Criar extension_devices
[ ] Criar extension_commands
[ ] Criar extension_logs
[ ] Testar RLS policies
[ ] Verificar índices

PASSO 4: INTEGRAÇÃO CHAT
[ ] Adicionar send_command_to_extension()
[ ] Adicionar wait_for_command_result()
[ ] Modificar handler do chat
[ ] Testar envio de comando
[ ] Verificar recebimento no browser
```

---

## 🎯 RESULTADO ESPERADO

Após implementar esses 4 passos, o sistema terá:

✅ Extensão com ícones profissionais  
✅ API completa para comunicação  
✅ Banco de dados preparado  
✅ Chat IA enviando comandos para o navegador  
✅ **Sistema COMPLETO e FUNCIONAL!**

---

## ⚠️ IMPORTANTE

1. **Fazer backup** antes de executar SQL
2. **Testar** cada endpoint individualmente
3. **Verificar logs** do Railway após deploy
4. **Validar** RLS policies do Supabase
5. **Commit** a cada passo concluído

---

## 🚀 COMO COMEÇAR

**Execute na ordem:**
1. Criar ícones (15 min)
2. Adicionar endpoints (30 min)
3. Criar tabelas (10 min)
4. Integrar chat (45 min)

**Total estimado:** 1h40min

---

**Última atualização:** 16/01/2025  
**Versão:** 1.0.0  
**Status:** Pronto para implementação