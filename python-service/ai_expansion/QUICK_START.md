# 🚀 QUICK START - AI Expansion Module

## ⚡ Instalação Rápida (5 minutos)

### 1️⃣ Instalar Dependências

```bash
cd python-service/ai_expansion
pip install -r requirements-expansion.txt
```

**Nota**: Isso instalará ~80 pacotes. Pode levar alguns minutos.

---

### 2️⃣ Configurar Variáveis (Opcional)

Adicione ao seu `.env`:

```env
# Habilitar expansão (opcional - pode ativar via código)
ENABLE_AI_EXPANSION=true

# Captcha Solvers (opcional)
TWOCAPTCHA_API_KEY=your_key_here
ANTICAPTCHA_API_KEY=your_key_here

# Proxy (opcional)
HTTP_PROXY=http://proxy:port
HTTPS_PROXY=https://proxy:port
```

---

### 3️⃣ Integrar no Main.py

Adicione **APENAS 3 LINHAS** no seu `main.py` existente:

```python
# No início do arquivo
from ai_expansion.integration import integrate_expansion

# Depois de criar o app FastAPI
app = FastAPI(...)

# Adicione isso no evento de startup
@app.on_event("startup")
async def startup():
    # Seu código existente aqui...
    
    # Adicione esta linha:
    await integrate_expansion(app, enable_all=True)
```

**Alternativa (ainda mais simples)**:

```python
# No início
from ai_expansion.integration import create_expansion_startup_handler

# Depois de criar app
app = FastAPI(...)

# Uma linha:
app.add_event_handler("startup", create_expansion_startup_handler(app))
```

---

### 4️⃣ Testar

Inicie o servidor:

```bash
cd python-service
python -m uvicorn app.main:app --reload
```

Acesse: `http://localhost:8000/api/expansion/info`

Você verá:

```json
{
  "success": true,
  "name": "SyncAds AI Expansion Module",
  "version": "1.0.0",
  "modules": {
    "automation": {...},
    "dom_intelligence": {...},
    "ai_agents": {...},
    "vision": {...},
    "captcha": {...}
  }
}
```

---

## 🎯 Exemplos Rápidos

### Exemplo 1: Multi-Step Automation

```bash
curl -X POST http://localhost:8000/api/expansion/automation/multi-step \
  -H "Content-Type: application/json" \
  -d '{
    "engine": "playwright",
    "stealth": true,
    "tasks": [
      {
        "action": "navigate",
        "url": "https://example.com"
      },
      {
        "action": "click",
        "selector": "#submit-button"
      },
      {
        "action": "screenshot"
      }
    ]
  }'
```

---

### Exemplo 2: DOM Analysis (Ultra-Fast)

```bash
curl -X POST http://localhost:8000/api/expansion/dom/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "html": "<html><body><button id=\"test\">Click me</button></body></html>",
    "engine": "selectolax",
    "semantic_analysis": true
  }'
```

---

### Exemplo 3: AI Agent Goal

```bash
curl -X POST http://localhost:8000/api/expansion/agent/execute-goal \
  -H "Content-Type: application/json" \
  -d '{
    "goal": "Criar um anúncio no Facebook Ads",
    "context": {
      "current_url": "https://facebook.com/adsmanager"
    },
    "agent_type": "langchain"
  }'
```

---

## 📋 Verificar Saúde dos Módulos

```bash
curl http://localhost:8000/api/expansion/health
```

Resultado:

```json
{
  "success": true,
  "status": "healthy",
  "modules": {
    "automation": {
      "available": true,
      "engines": {
        "playwright": true,
        "selenium": true,
        "pyppeteer": true
      }
    },
    "dom_intelligence": {
      "available": true,
      "parsers": {
        "beautifulsoup": true,
        "lxml": true,
        "selectolax": true
      }
    },
    ...
  }
}
```

---

## 🔧 Troubleshooting

### Playwright não funciona?

```bash
playwright install chromium
```

### Selenium ChromeDriver?

O `webdriver-manager` baixa automaticamente. Se falhar:

```bash
pip install --upgrade webdriver-manager
```

### Tesseract OCR?

**Windows**:
```bash
choco install tesseract
```

**Linux**:
```bash
sudo apt-get install tesseract-ocr
```

**Mac**:
```bash
brew install tesseract
```

---

## 🎨 Uso no Código Python

### Automação:

```python
from ai_expansion.modules.automation import (
    AutomationManager,
    AutomationTask,
    ActionType,
    EngineType
)

manager = AutomationManager()
await manager.initialize()

# Criar sessão
session_id = await manager.create_session(
    engine_type=EngineType.PLAYWRIGHT,
    stealth=True
)

# Executar tarefa
task = AutomationTask(
    action=ActionType.NAVIGATE,
    url="https://example.com"
)

result = await manager.execute_task(task, session_id)
print(f"Success: {result.success}")
```

---

### DOM Intelligence:

```python
from ai_expansion.modules.dom_intelligence import DOMParser

parser = DOMParser(engine="selectolax")  # Mais rápido!
tree = parser.parse(html_content, extract_metadata=True)

print(f"Elementos clicáveis: {tree.clickable_elements}")
print(f"Formulários: {tree.form_elements}")
```

---

### AI Agent:

```python
from ai_expansion.modules.planner import ActionPlanner

planner = ActionPlanner(agent_type="langchain")

plan = await planner.create_plan(
    goal="Criar anúncio no Facebook Ads",
    context={"url": "https://facebook.com/adsmanager"}
)

results = await planner.execute_plan(plan)
print(f"Objetivo alcançado: {results.goal_achieved}")
```

---

## 📚 Documentação Completa

Veja `README.md` para documentação completa com:
- Todos os endpoints
- Exemplos avançados
- Arquitetura detalhada
- Benchmarks
- Best practices

---

## ✅ Checklist de Integração

- [ ] Dependências instaladas (`pip install -r requirements-expansion.txt`)
- [ ] Playwright instalado (`playwright install chromium`)
- [ ] Integração adicionada no `main.py` (3 linhas)
- [ ] Servidor reiniciado
- [ ] Teste de saúde passou (`/api/expansion/health`)
- [ ] Exemplo básico funcionou

---

## 🎉 Pronto!

Agora você tem:

✅ **3 engines de automação** (Playwright, Selenium, Pyppeteer)  
✅ **Parsing 10-100x mais rápido** (Selectolax)  
✅ **AI Agents autônomos** (LangChain, AutoGen)  
✅ **Computer Vision** (OpenCV, OCR)  
✅ **Captcha solving ético**  
✅ **RPA Framework**  

**Tudo sem modificar NADA do sistema original!** 🚀

---

## 💡 Próximos Passos

1. Explore os endpoints em `/api/expansion/info`
2. Teste automação multi-step
3. Use DOM Intelligence para parsing rápido
4. Experimente AI Agents para tarefas complexas
5. Leia `README.md` para casos avançados

---

## 🆘 Suporte

Problemas? Verifique:

1. Logs: `python-service/ai_expansion/logs/`
2. Health check: `/api/expansion/health`
3. Dependências: `check_expansion_dependencies()`
4. README completo: `ai_expansion/README.md`

---

**Versão**: 1.0.0  
**Status**: 🟢 Production Ready  
**Compatibilidade**: 100% backward compatible