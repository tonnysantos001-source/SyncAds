# 🚀 SyncAds AI - Comandos Avançados & Melhorias de UX

## 📋 Visão Geral

Este documento descreve todos os **comandos avançados** e **melhorias de UX** implementados na versão 5.2.0 da extensão SyncAds AI.

---

## ✨ NOVOS COMANDOS AVANÇADOS

### 📸 **1. Screenshot**

Capture tela de diferentes formas:

#### **Screenshot da Viewport**
```
"Tire uma screenshot"
"Capture a tela atual"
```
**Comando gerado:**
```json
{ "type": "SCREENSHOT" }
```

#### **Screenshot da Página Inteira**
```
"Tire uma screenshot da página completa"
"Capture a página inteira"
```
**Comando gerado:**
```json
{ "type": "SCREENSHOT", "data": { "fullPage": true } }
```

#### **Screenshot de Elemento Específico**
```
"Tire uma screenshot do formulário de login"
"Capture o elemento .produto"
```
**Comando gerado:**
```json
{ "type": "SCREENSHOT", "data": { "selector": "form.login" } }
```

---

### 🕷️ **2. Web Scraping Avançado**

#### **Extrair Tabelas**
```
"Extraia a tabela de produtos"
"Capture os dados da tabela"
```
**Comando gerado:**
```json
{ "type": "EXTRACT_TABLE" }
{ "type": "EXTRACT_TABLE", "data": { "selector": "table.dados", "headers": true } }
```

**Retorna:**
- Array de arrays com dados da tabela
- Headers separados (se `headers: true`)
- Múltiplas tabelas (se houver)

#### **Extrair Imagens**
```
"Liste todas as imagens desta página"
"Extraia os links das imagens"
```
**Comando gerado:**
```json
{ "type": "EXTRACT_IMAGES" }
{ "type": "EXTRACT_IMAGES", "data": { "includeBackgrounds": true } }
```

**Retorna:**
- Array de objetos com:
  - `src`: URL da imagem
  - `alt`: Texto alternativo
  - `width`: Largura
  - `height`: Altura
- Background images (se `includeBackgrounds: true`)

#### **Extrair Links**
```
"Liste todos os links desta página"
"Mostre apenas links externos"
```
**Comando gerado:**
```json
{ "type": "EXTRACT_LINKS" }
{ "type": "EXTRACT_LINKS", "data": { "external": true } }
```

**Retorna:**
- Array de objetos com:
  - `href`: URL do link
  - `text`: Texto do link
  - `isExternal`: Boolean
  - `title`: Atributo title

#### **Extrair Emails**
```
"Extraia todos os emails desta página"
"Liste os endereços de email"
```
**Comando gerado:**
```json
{ "type": "EXTRACT_EMAILS" }
```

**Retorna:**
- Array único de emails encontrados
- Sem duplicatas

#### **Extrair Todos os Dados**
```
"Extraia todos os dados estruturados"
"Faça um scraping completo da página"
```
**Comando gerado:**
```json
{ "type": "EXTRACT_ALL" }
{ "type": "EXTRACT_ALL", "data": { "includeMetadata": true, "includeStructured": true } }
```

**Retorna:**
- URL e título
- Metadata (description, keywords, author, meta tags)
- Estrutura (headings H1-H3, parágrafos)
- Contadores (links, imagens, formulários)

---

### 📝 **3. Formulários Avançados**

#### **Preencher Formulário Completo**
```
"Preencha o formulário de login"
"Complete o formulário com meus dados"
```
**Comando gerado:**
```json
{
  "type": "FILL_FORM",
  "data": {
    "formSelector": "form#login",
    "fields": {
      "email": "usuario@email.com",
      "password": "senha123",
      "remember": true
    }
  }
}
```

**Funcionalidades:**
- Preenche múltiplos campos de uma vez
- Suporta: input, textarea, select, checkbox, radio
- Tenta múltiplos seletores automaticamente
- Dispara eventos (input, change) para validações
- Retorna status de cada campo

#### **Aguardar Elemento Aparecer**
```
"Aguarde o resultado aparecer"
"Espere até carregar o conteúdo"
```
**Comando gerado:**
```json
{
  "type": "WAIT_ELEMENT",
  "data": {
    "selector": ".resultado",
    "timeout": 10000
  }
}
```

**Funcionalidades:**
- Aguarda elemento aparecer no DOM
- Timeout configurável (padrão: 10 segundos)
- Usa MutationObserver para eficiência
- Retorna tempo de espera

---

## ⌨️ MELHORIAS DE UX

### **1. Atalhos de Teclado**

#### **Atalhos Globais**

| Atalho | Ação |
|--------|------|
| `Ctrl/Cmd + K` | Foco no input |
| `Ctrl/Cmd + N` | Nova conversa |
| `Ctrl/Cmd + H` | Toggle histórico |
| `Ctrl/Cmd + /` | Menu de atalhos |

#### **Atalhos no Input**

| Atalho | Ação |
|--------|------|
| `Enter` | Enviar mensagem |
| `Shift + Enter` | Nova linha |
| `Tab` | Aceitar sugestão |
| `Esc` | Limpar input |
| `↑` (seta cima) | Comando anterior |
| `↓` (seta baixo) | Próximo comando |

---

### **2. Histórico de Comandos**

#### **Como Usar:**

1. Digite um comando e envie
2. Pressione `↑` com input vazio
3. Navegue pelos últimos 50 comandos
4. Pressione `↓` para voltar
5. Pressione `Esc` para limpar

#### **Funcionalidades:**

- ✅ Armazena últimos 50 comandos
- ✅ Navegação com setas ↑↓
- ✅ Não interfere com texto no input
- ✅ Preservado durante sessão

---

### **3. Autocomplete & Sugestões**

#### **Como Funciona:**

1. Digite pelo menos 2 caracteres
2. Sugestões aparecem automaticamente
3. Use `Tab` para aceitar primeira sugestão
4. Clique para selecionar qualquer sugestão
5. Continuar digitando atualiza sugestões

#### **Sugestões Disponíveis:**

| Comando | Descrição |
|---------|-----------|
| "Liste minhas abas abertas" | Ver todas as abas |
| "Qual o título desta página?" | Info da página |
| "Feche esta aba" | Fechar aba atual |
| "Abra https://" | Abrir URL em nova aba |
| "Clique no botão de login" | Clicar em elemento |
| "Preencha o formulário" | Preencher campos |
| "Extraia os emails desta página" | Web scraping |
| "Extraia a tabela" | Capturar tabela |
| "Tire uma screenshot" | Capturar tela |
| "Role até o final" | Scroll página |
| "Aguarde 2 segundos" | Pausar execução |
| "Execute: document.title" | Executar JS |

#### **Funcionalidades:**

- ✅ Busca inteligente (texto + descrição)
- ✅ Máximo 5 sugestões por vez
- ✅ Highlight de texto correspondente
- ✅ Design consistente (dark theme)
- ✅ Hover effects
- ✅ Scroll se necessário

---

### **4. Menu de Atalhos**

Pressione `Ctrl/Cmd + /` para ver todos os atalhos disponíveis.

A IA responde com guia completo de:
- Atalhos de navegação
- Atalhos no input
- Dicas de uso
- Como ativar autocomplete

---

## 🎯 EXEMPLOS PRÁTICOS

### **Exemplo 1: Web Scraping Completo**

**Usuário:**
```
Extraia todos os dados desta página de produtos
```

**IA responde:**
```
📊 Extraindo dados estruturados da página...
```

**Comandos executados:**
1. EXTRACT_ALL - Metadata e estrutura
2. EXTRACT_TABLE - Tabela de produtos
3. EXTRACT_IMAGES - Imagens dos produtos
4. EXTRACT_LINKS - Links relacionados

**Resultado:**
- JSON com todos os dados
- Tabelas formatadas
- Lista de imagens
- Links categorizados

---

### **Exemplo 2: Automação de Formulário**

**Usuário:**
```
Preencha o formulário de cadastro com meus dados
```

**IA responde:**
```
✅ Preenchendo formulário...
```

**Comandos executados:**
1. WAIT_ELEMENT - Aguarda formulário carregar
2. FILL_FORM - Preenche todos os campos
3. Screenshot opcional para confirmar

**Resultado:**
- Formulário preenchido
- Status de cada campo
- Pronto para submeter

---

### **Exemplo 3: Screenshot com Contexto**

**Usuário:**
```
Tire uma screenshot do produto principal
```

**IA responde:**
```
📸 Capturando screenshot do produto...
```

**Comandos executados:**
1. Identifica elemento principal (.produto, .main, etc)
2. Scroll para elemento
3. SCREENSHOT com selector específico

**Resultado:**
- Screenshot do elemento
- Data URL da imagem
- Pode ser salva/compartilhada

---

## 🔧 IMPLEMENTAÇÃO TÉCNICA

### **Arquitetura**

```
┌─────────────────────────────────────┐
│         Side Panel (UI)              │
│  • Atalhos de teclado                │
│  • Histórico de comandos             │
│  • Autocomplete                      │
└───────────────┬─────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│      sidepanel.js (Logic)            │
│  • Event listeners                   │
│  • Command history                   │
│  • Suggestions engine                │
└───────────────┬─────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│    content-script.js (Executor)      │
│  • SCREENSHOT                        │
│  • EXTRACT_TABLE/IMAGES/LINKS       │
│  • FILL_FORM                         │
│  • WAIT_ELEMENT                      │
└─────────────────────────────────────┘
```

### **Fluxo de Comando Avançado**

```
1. Usuário digita comando
   ↓
2. Autocomplete sugere (se habilitado)
   ↓
3. Usuário aceita/modifica e envia
   ↓
4. sidepanel.js → API chat-enhanced
   ↓
5. IA identifica comando e gera JSON
   ↓
6. JSON é detectado e removido da resposta
   ↓
7. Comando enviado ao content-script
   ↓
8. content-script executa na página
   ↓
9. Resultado retorna para Side Panel
   ↓
10. IA formata e apresenta resultado
```

---

## 📊 COMPARAÇÃO: ANTES vs DEPOIS

| Funcionalidade | Antes (v5.1) | Depois (v5.2) |
|----------------|--------------|---------------|
| Comandos básicos | 9 | 17 |
| Web scraping | ❌ | ✅ 5 comandos |
| Screenshot | Básico | Avançado (3 modos) |
| Formulários | Campo por campo | Formulário completo |
| Atalhos | ❌ | ✅ 7 atalhos |
| Histórico | ❌ | ✅ 50 últimos |
| Autocomplete | ❌ | ✅ 12 sugestões |
| Aguardar elemento | ❌ | ✅ Com timeout |

---

## 🎓 CASOS DE USO

### **1. E-commerce Research**
```
• "Extraia todos os produtos desta página"
• "Capture a tabela de preços"
• "Liste os links de categorias"
• "Tire screenshot de cada produto"
```

### **2. Lead Generation**
```
• "Extraia todos os emails desta página"
• "Liste os telefones de contato"
• "Capture informações de contato"
• "Preencha formulário de interesse"
```

### **3. Automação de Forms**
```
• "Preencha o formulário de cadastro"
• "Complete os dados de checkout"
• "Envie mensagem pelo form de contato"
```

### **4. Content Analysis**
```
• "Extraia todos os headings"
• "Liste os parágrafos principais"
• "Capture metadata da página"
• "Analise estrutura do conteúdo"
```

### **5. Quality Assurance**
```
• "Tire screenshot antes de clicar"
• "Aguarde resultado aparecer"
• "Verifique se formulário foi preenchido"
• "Capture evidência de bug"
```

---

## 🚨 LIMITAÇÕES & BOAS PRÁTICAS

### **Limitações**

1. **Screenshot:**
   - Limitado ao tamanho da viewport do Chrome
   - Elementos fora da tela podem não aparecer
   - Conteúdo dinâmico pode mudar

2. **Web Scraping:**
   - Só extrai conteúdo visível no DOM
   - JavaScript renderizado pode não ser capturado
   - Sites com proteção anti-scraping podem bloquear

3. **Formulários:**
   - Captchas não podem ser preenchidos
   - Validações JS complexas podem falhar
   - Campos com nome dinâmico são difíceis

4. **Aguardar Elemento:**
   - Timeout máximo recomendado: 30 segundos
   - Não funciona se elemento nunca aparecer
   - MutationObserver tem overhead

### **Boas Práticas**

✅ **DO:**
- Use seletores CSS específicos
- Teste comandos em ambiente de dev primeiro
- Combine comandos para workflows complexos
- Use WAIT_ELEMENT antes de interações
- Valide resultados antes de processar

❌ **DON'T:**
- Não use em sites com dados sensíveis sem permissão
- Não faça scraping em alta frequência
- Não ignore mensagens de erro da IA
- Não execute comandos sem revisar o JSON gerado
- Não espere 100% de precisão em sites complexos

---

## 🔮 ROADMAP FUTURO

### **Fase 3: Comandos Ainda Mais Avançados** (v5.3)

- [ ] **EXTRACT_TO_CSV** - Exportar dados para CSV
- [ ] **EXTRACT_TO_JSON** - Exportar em JSON estruturado
- [ ] **COMPARE_PAGES** - Comparar duas páginas
- [ ] **MONITOR_CHANGES** - Monitorar mudanças em elemento
- [ ] **BATCH_COMMANDS** - Executar múltiplos comandos em sequência
- [ ] **CONDITIONAL_EXECUTE** - Executar baseado em condição

### **Fase 4: IA Ainda Mais Inteligente** (v5.4)

- [ ] **Visual Recognition** - IA identifica elementos por screenshot
- [ ] **Smart Selectors** - IA gera seletores automaticamente
- [ ] **Error Recovery** - IA tenta alternativas se comando falhar
- [ ] **Context Awareness** - IA lembra contexto de comandos anteriores

### **Fase 5: Colaboração & Sharing** (v5.5)

- [ ] **Export Workflows** - Salvar sequência de comandos
- [ ] **Share Commands** - Compartilhar com outros usuários
- [ ] **Templates** - Templates de automação prontos
- [ ] **Marketplace** - Loja de workflows da comunidade

---

## 📞 SUPORTE

### **Problemas Comuns**

**Screenshot não funciona:**
- Verifique se tem permissões de captura
- Tente screenshot de viewport primeiro
- Verifique console para erros

**Scraping não retorna dados:**
- Verifique se página carregou completamente
- Tente seletores CSS mais específicos
- Use WAIT_ELEMENT antes de extrair

**Formulário não preenche:**
- Verifique nomes dos campos (inspect element)
- Aguarde página carregar (WAIT_ELEMENT)
- Tente preencher campos individualmente

**Atalhos não funcionam:**
- Verifique se Side Panel está em foco
- Alguns sites podem interceptar atalhos
- Recarregue a extensão se necessário

### **Debug**

Para debug avançado, abra DevTools no Side Panel (F12) e procure por:

```javascript
// Logs de comandos
[CHAT] Sending message
[COMMAND] Executing
[CONTENT SCRIPT] Result

// Logs de UX
[SHORTCUTS] Global shortcuts registered
[HISTORY] Navigating
[SUGGESTIONS] Showing
```

---

## ✅ CHECKLIST DE TESTE

Use este checklist para validar todas as funcionalidades:

### **Comandos Avançados**
- [ ] Screenshot (viewport)
- [ ] Screenshot (fullPage)
- [ ] Screenshot (elemento)
- [ ] Extrair tabela
- [ ] Extrair imagens
- [ ] Extrair links
- [ ] Extrair emails
- [ ] Extrair todos os dados
- [ ] Preencher formulário
- [ ] Aguardar elemento

### **Atalhos de Teclado**
- [ ] Ctrl/Cmd + K (foco)
- [ ] Ctrl/Cmd + N (nova conversa)
- [ ] Ctrl/Cmd + H (histórico)
- [ ] Ctrl/Cmd + / (menu atalhos)
- [ ] Enter (enviar)
- [ ] Shift + Enter (nova linha)
- [ ] Tab (aceitar sugestão)
- [ ] Esc (limpar)
- [ ] ↑ (comando anterior)
- [ ] ↓ (próximo comando)

### **UX Features**
- [ ] Histórico salva comandos
- [ ] Navegação ↑↓ funciona
- [ ] Autocomplete aparece
- [ ] Sugestões filtram corretamente
- [ ] Click em sugestão funciona
- [ ] Tab aceita primeira sugestão
- [ ] Menu de atalhos mostra info

---

**Versão:** 5.2.0  
**Data:** 24/11/2025  
**Status:** ✅ Implementado e testado

**Desenvolvido com ❤️ pela equipe SyncAds**