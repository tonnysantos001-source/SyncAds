# 🦔 Indicador de Pensamento da IA

**Componente:** `AiThinkingIndicator.tsx`

---

## 🎯 FUNCIONALIDADE

Exibe um indicador visual quando a IA está:
- Pensando/processando
- Fazendo web search
- Raspando dados
- Executando Python

---

## 🎨 DESIGN

### **Ícone Sonic 3D Azul:**
- Gradiente azul (from-blue-400 to-blue-600)
- Tamanho: 12x12 (w-12 h-12)
- Animações: pulse + ping
- Símbolo placeholder: 🦔 (substituir por 3D/4D Sonic depois)

### **Badges de Ferramentas:**
- 🔍 `web_search` - Pesquisando na web
- 🕷️ `web_scraping` - Raspando dados
- 🐍 `python_exec` - Executando Python
- ✨ Padrão - Pensando...

### **Raciocínio:**
- Mostra o que a IA está fazendo
- Box destacado com fundo branco semi-transparente
- Borda azul sutil

### **Fontes:**
- Lista de URLs/sites consultados
- Ícone de globo para cada fonte
- Layout compacto

---

## 📝 USO

```tsx
<AiThinkingIndicator 
  isThinking={isLoading}
  currentTool={currentTool}
  reasoning="Buscando informações sobre IA no Google..."
  sources={['https://example.com', 'https://example2.com']}
/>
```

---

## 🔄 ESTADOS

1. **Pensando** (`currentTool: null`)
   - Badge: "Pensando..."
   - Ícone: Sparkles

2. **Web Search** (`currentTool: 'web_search'`)
   - Badge: "Pesquisando na web"
   - Ícone: Globe
   - Mostra sources

3. **Web Scraping** (`currentTool: 'web_scraping'`)
   - Badge: "Raspando dados"
   - Ícone: Scrape
   - Mostra URL sendo raspada

4. **Python** (`currentTool: 'python_exec'`)
   - Badge: "Executando código Python"
   - Ícone: Code2

---

## ✅ PRÓXIMOS PASSOS

1. Substituir emoji 🦔 por ícone Sonic 3D/4D real
2. Adicionar animação de rotação
3. Melhorar transições

---

**ARQUIVO CRIADO!** ✅

