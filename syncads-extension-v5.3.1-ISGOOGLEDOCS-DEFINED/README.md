# 🤖 SyncAds AI Automation - Extensão Chrome

**Versão:** 1.0.0  
**Status:** Beta  
**Compatibilidade:** Chrome, Edge, Brave (Manifest V3)

---

## 📋 Sobre

Extensão oficial do **SyncAds** que permite automação inteligente de marketing digital através de IA. Execute ações automatizadas em qualquer site diretamente do seu navegador.

### ✨ Principais Recursos

- 🎯 **Automação DOM** - Preenche formulários, clica em botões, extrai dados
- 🤖 **IA Integrada** - Comandos inteligentes via chat do SyncAds
- 🔄 **Tempo Real** - Comunicação instantânea via long polling
- 🔐 **Seguro** - Sem armazenamento de senhas ou tokens sensíveis
- 📊 **Logs Detalhados** - Acompanhe todas as ações executadas
- 🎨 **Interface Moderna** - Design intuitivo e responsivo

---

## 🚀 Instalação

### Método 1: Via Chrome Web Store (Em breve)
```
Aguardando aprovação na Chrome Web Store
```

### Método 2: Instalação Manual (Desenvolvimento)

1. **Baixe a extensão**
   - Acesse o painel SyncAds: https://syncads.com.br
   - Vá em **Configurações** > **Extensão para Navegador**
   - Clique em **"Baixar Extensão"**
   - Extraia o arquivo ZIP

2. **Instale no Chrome**
   - Abra o Chrome
   - Digite na barra de endereços: `chrome://extensions/`
   - Ative o **"Modo do desenvolvedor"** (canto superior direito)
   - Clique em **"Carregar sem compactação"**
   - Selecione a pasta `chrome-extension` extraída

3. **Pronto!**
   - A extensão aparecerá na barra de ferramentas
   - Clique no ícone 🤖 para abrir

---

## 🔧 Configuração

### Primeira Vez

1. **Abra a extensão** clicando no ícone 🤖
2. **Faça login** no SyncAds
3. **Aguarde conexão** (indicador ficará verde ✓)
4. **Pronto para usar!**

### Verificar Status

- **🟢 Verde (Conectado)** - Tudo funcionando
- **🟡 Amarelo (Desconectado)** - Clique em "Reconectar"
- **🔴 Vermelho (Sem Login)** - Faça login no painel

---

## 💡 Como Usar

### 1. Via Chat IA (Recomendado)

Abra o chat no painel SyncAds e envie comandos naturais:

```
"Preencha o formulário de contato com meus dados"
"Extraia todos os preços desta página"
"Clique no botão de cadastro"
"Navegue para facebook.com/ads"
```

A IA entenderá o comando e executará automaticamente no seu navegador.

### 2. Comandos Diretos (Avançado)

Para desenvolvedores, é possível enviar comandos diretos via API.

**Exemplo: Ler elemento do DOM**
```javascript
chrome.runtime.sendMessage({
  type: 'DOM_READ',
  selector: '#product-price',
  attribute: 'textContent'
}, (response) => {
  console.log('Preço:', response.data.text);
});
```

---

## 📚 Tipos de Comandos

### DOM_READ
Lê informações de elementos da página.

```javascript
{
  type: 'DOM_READ',
  selector: '.product-title',
  attribute: 'textContent', // opcional
  multiple: false // false = primeiro elemento, true = todos
}
```

### DOM_CLICK
Clica em um elemento.

```javascript
{
  type: 'DOM_CLICK',
  selector: 'button.submit',
  waitAfter: 500, // ms para aguardar após clicar
  smooth: true // scroll suave
}
```

### DOM_FILL
Preenche inputs com texto (simula digitação humana).

```javascript
{
  type: 'DOM_FILL',
  selector: 'input[name="email"]',
  value: 'usuario@email.com',
  clear: true, // limpar antes de preencher
  typeSpeed: 'normal' // fast, normal, slow
}
```

### DOM_WAIT
Aguarda elemento aparecer na página.

```javascript
{
  type: 'DOM_WAIT',
  selector: '.loading-complete',
  timeout: 10000 // ms
}
```

### DOM_SCROLL
Rola a página.

```javascript
{
  type: 'DOM_SCROLL',
  direction: 'down', // down, up, top, bottom
  amount: 500, // pixels (para down/up)
  smooth: true
}
```

### NAVIGATE
Navega para uma URL.

```javascript
{
  type: 'NAVIGATE',
  url: 'https://example.com',
  newTab: false // true = nova aba
}
```

### SCREENSHOT
Captura screenshot da aba ativa.

```javascript
{
  type: 'SCREENSHOT'
}
```

---

## 🔐 Segurança e Privacidade

### O que a extensão PODE fazer:
✅ Ler conteúdo de páginas web (quando autorizado)  
✅ Preencher formulários  
✅ Clicar em botões  
✅ Navegar entre páginas  
✅ Capturar screenshots  

### O que a extensão NÃO pode fazer:
❌ Acessar senhas salvas  
❌ Ler dados de outros sites sem permissão  
❌ Executar código malicioso  
❌ Acessar arquivos locais  
❌ Modificar configurações do navegador  

### Permissões Solicitadas:
- `activeTab` - Interagir com a aba ativa
- `storage` - Salvar configurações localmente
- `tabs` - Abrir e gerenciar abas
- `scripting` - Executar scripts de automação
- `webRequest` - Monitorar requisições (opcional)

### Dados Coletados:
- ✅ Device ID (identificação única do dispositivo)
- ✅ Logs de comandos executados
- ✅ URLs visitadas (somente para logs)
- ❌ **NÃO coletamos**: senhas, dados pessoais, histórico completo

**Todos os dados são criptografados e armazenados com segurança no Supabase.**

---

## 🐛 Solução de Problemas

### Extensão não conecta

**Solução:**
1. Verifique se está logado no painel SyncAds
2. Clique em "Reconectar" no popup
3. Recarregue a página atual (F5)
4. Reinicie o navegador

### Comandos não são executados

**Solução:**
1. Verifique se a extensão está ativa (ícone na barra)
2. Verifique se o site permite extensões
3. Abra o console do navegador (F12) e procure por erros
4. Recarregue a extensão em `chrome://extensions/`

### Popup não abre

**Solução:**
1. Desinstale e reinstale a extensão
2. Limpe cache do navegador
3. Verifique se não há conflito com outras extensões

### Performance lenta

**Solução:**
1. Desative comandos de digitação lenta (`typeSpeed: 'fast'`)
2. Reduza o `waitAfter` dos cliques
3. Feche abas desnecessárias

---

## 🚀 Atualizações

### v1.0.0 (16/01/2025)
- 🎉 Lançamento inicial
- ✅ Automação DOM completa
- ✅ Long polling para comandos
- ✅ Interface popup moderna
- ✅ Logs em tempo real
- ✅ Suporte a múltiplos tipos de comando

### Próximas Versões (Roadmap)
- [ ] v1.1.0 - WebSocket em tempo real
- [ ] v1.2.0 - Gravador de macros
- [ ] v1.3.0 - Marketplace de automações
- [ ] v2.0.0 - Suporte Firefox

---

## 🤝 Suporte

### Precisa de Ajuda?

- 📧 **Email:** suporte@syncads.com.br
- 💬 **Chat:** Painel SyncAds > Chat de Suporte
- 📚 **Documentação:** https://docs.syncads.com.br
- 🐛 **Reportar Bug:** GitHub Issues

### Recursos Úteis

- [Documentação Completa](https://docs.syncads.com.br/extension)
- [Vídeos Tutoriais](https://youtube.com/@syncads)
- [API Reference](https://docs.syncads.com.br/api)
- [Community Forum](https://community.syncads.com.br)

---

## 👨‍💻 Para Desenvolvedores

### Estrutura de Arquivos

```
chrome-extension/
├── manifest.json           # Configuração da extensão
├── background.js          # Service Worker (lógica principal)
├── content-script.js      # Manipulação DOM
├── popup.html            # Interface do popup
├── popup.js              # Lógica do popup
├── icons/                # Ícones da extensão
└── README.md             # Este arquivo
```

### Build para Produção

```bash
# 1. Remover console.logs
# 2. Minificar código
# 3. Comprimir assets
# 4. Gerar ZIP
zip -r syncads-extension.zip chrome-extension/ -x "*.git*" -x "*node_modules*"
```

### Testar Localmente

```bash
# 1. Abrir Chrome
chrome://extensions/

# 2. Ativar modo desenvolvedor

# 3. Carregar extensão sem compactação
# Selecionar pasta chrome-extension/

# 4. Testar funcionalidades
```

### Depuração

```javascript
// No popup:
chrome.devtools.open();

// No background:
console.log('Debug:', data);

// No content script:
console.log('Content:', data);
```

---

## 📄 Licença

Copyright © 2025 SyncAds. Todos os direitos reservados.

Esta extensão é proprietária e seu uso está sujeito aos [Termos de Serviço](https://syncads.com.br/terms) do SyncAds.

---

## 🎉 Agradecimentos

Desenvolvido com ❤️ pela equipe SyncAds para revolucionar o marketing digital no Brasil.

**Primeira IA do Brasil com controle via extensão de navegador! 🇧🇷**

---

**Versão:** 1.0.0  
**Última atualização:** 16/01/2025  
**Contato:** suporte@syncads.com.br