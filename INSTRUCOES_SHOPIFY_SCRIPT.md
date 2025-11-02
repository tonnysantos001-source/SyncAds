# 📦 INSTALAÇÃO DO SCRIPT SHOPIFY - SYNCADS

Este guia explica como instalar o script de redirecionamento do checkout no seu tema Shopify.

## 🎯 O QUE O SCRIPT FAZ

O script intercepta **TODOS** os pontos de checkout da sua loja:

✅ **Botões de "Comprar Agora"**
✅ **Botões de "Adicionar ao Carrinho"**
✅ **Botão "Finalizar Compra" no carrinho**
✅ **Ícone do carrinho (quando configurado)**
✅ **Links diretos para /checkout**
✅ **Chamadas AJAX de checkout**

Quando interceptado, o script:
1. Pega os produtos do carrinho
2. Cria um pedido no SyncAds
3. Redireciona para seu checkout customizado

## 📋 PRÉ-REQUISITOS

- ✅ Acesso ao painel admin da Shopify
- ✅ Permissão para editar o tema
- ✅ Integração Shopify configurada no SyncAds
- ✅ Chave Anon Key do Supabase

## 🚀 INSTALAÇÃO PASSO A PASSO

### **1. Acessar o Editor de Tema**

1. Entre no **Admin da Shopify**
2. Vá em **Loja Online** → **Temas**
3. No tema ativo, clique em **Ações** → **Editar código**

### **2. Criar o Arquivo do Script**

1. Na barra lateral esquerda, procure a pasta **Assets**
2. Clique em **Adicionar um novo asset**
3. Selecione **Criar um arquivo em branco**
4. Nome do arquivo: `syncads-checkout-redirect.js`
5. Clique em **Criar asset**

### **3. Copiar o Código do Script**

1. Abra o arquivo que você acabou de criar
2. Copie TODO o conteúdo do arquivo: `public/shopify-checkout-redirect.js`
3. Cole no editor da Shopify
4. **IMPORTANTE:** Substitua a chave `SUPABASE_ANON_KEY` pela sua:

```javascript
// Linha ~21 do script
SUPABASE_ANON_KEY: "SUA_CHAVE_AQUI", // ← Trocar!
```

**Onde encontrar sua chave:**
- Dashboard Supabase → Settings → API → `anon public`

5. Clique em **Salvar**

### **4. Incluir o Script no Tema**

Agora você precisa carregar o script no tema. Existem 2 formas:

#### **OPÇÃO A: Incluir no theme.liquid (RECOMENDADO)**

1. Na pasta **Layout**, abra o arquivo `theme.liquid`
2. Procure pela tag `</body>` (no final do arquivo)
3. **ANTES** da tag `</body>`, adicione:

```liquid
<!-- SyncAds Checkout Redirect -->
<script src="{{ 'syncads-checkout-redirect.js' | asset_url }}" defer></script>
```

4. Deve ficar assim:

```liquid
  <!-- SyncAds Checkout Redirect -->
  <script src="{{ 'syncads-checkout-redirect.js' | asset_url }}" defer></script>
</body>
</html>
```

5. Clique em **Salvar**

#### **OPÇÃO B: Incluir apenas nas páginas de produto/carrinho**

Se quiser carregar apenas em páginas específicas:

**Para páginas de produto:**
1. Abra `templates/product.liquid` (ou `sections/main-product.liquid`)
2. Adicione no final:

```liquid
<script src="{{ 'syncads-checkout-redirect.js' | asset_url }}" defer></script>
```

**Para página do carrinho:**
1. Abra `templates/cart.liquid`
2. Adicione no final:

```liquid
<script src="{{ 'syncads-checkout-redirect.js' | asset_url }}" defer></script>
```

### **5. Configurar URLs no Script**

Volte no arquivo `syncads-checkout-redirect.js` e verifique se as URLs estão corretas:

```javascript
const CONFIG = {
  // URL do backend (Supabase Edge Functions)
  API_URL: "https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1",

  // URL do seu checkout customizado (Vercel)
  CHECKOUT_URL: "https://syncads-dun.vercel.app/checkout",

  // Sua chave pública do Supabase
  SUPABASE_ANON_KEY: "sua_chave_aqui", // ← TROCAR!
};
```

## ✅ TESTAR A INSTALAÇÃO

### **1. Teste Básico**

1. Abra sua loja Shopify no navegador
2. Pressione **F12** para abrir o DevTools
3. Vá na aba **Console**
4. Recarregue a página
5. Você deve ver:

```
[SyncAds] 🚀 Inicializando SyncAds Checkout Redirect v3.0
[SyncAds] 🏪 Loja: sua-loja.myshopify.com
[SyncAds] 🎯 Interceptando X botões de checkout
[SyncAds] 🛒 Interceptando X botões de carrinho
[SyncAds] ➕ Interceptando X botões de adicionar ao carrinho
[SyncAds] 👀 Observador de DOM iniciado
[SyncAds] ✅ SyncAds pronto!
```

### **2. Teste de Interceptação**

#### **Teste 1: Adicionar ao Carrinho**
1. Vá em qualquer página de produto
2. Clique em "Adicionar ao Carrinho"
3. No Console, veja: `[SyncAds] ➕ Produto adicionado ao carrinho`

#### **Teste 2: Ir ao Checkout**
1. Adicione um produto ao carrinho
2. Vá na página do carrinho
3. Clique em "Finalizar Compra"
4. No Console, veja:
   ```
   [SyncAds] 🛒 Iniciando checkout...
   [SyncAds] 📦 Carrinho obtido: {...}
   [SyncAds] 🔄 Criando pedido no SyncAds...
   [SyncAds] ✅ Pedido criado: xxx-xxx-xxx
   [SyncAds] 🚀 Redirecionando para: https://syncads-dun.vercel.app/checkout/xxx
   ```
5. Você deve ser redirecionado para o checkout customizado

#### **Teste 3: Ícone do Carrinho**
1. Clique no ícone do carrinho no header
2. Se configurado para ir direto ao checkout, deve interceptar
3. Caso contrário, abre o drawer/página normalmente

## 🔧 SOLUÇÃO DE PROBLEMAS

### ❌ **Erro: "Missing authorization header"**

**Causa:** Chave `SUPABASE_ANON_KEY` não configurada

**Solução:**
1. Abra o script: `Assets/syncads-checkout-redirect.js`
2. Encontre a linha com `SUPABASE_ANON_KEY`
3. Substitua por sua chave do Supabase
4. Salve o arquivo

### ❌ **Erro: "Pedido não encontrado" ou 404**

**Causa:** Edge Function não está funcionando

**Solução:**
1. Verifique se a Edge Function `shopify-create-order` está implantada
2. Teste diretamente no Supabase Dashboard
3. Verifique os logs da função

### ❌ **Script não carrega / Nada acontece**

**Causa:** Script não incluído corretamente no tema

**Solução:**
1. Verifique se adicionou no `theme.liquid`
2. Certifique-se que está ANTES da tag `</body>`
3. Verifique o nome do arquivo: `syncads-checkout-redirect.js`
4. Limpe o cache do navegador (Ctrl + Shift + R)

### ❌ **Checkout Shopify abre em vez do customizado**

**Causa:** Script não está interceptando

**Solução:**
1. Abra o Console (F12)
2. Procure por erros JavaScript
3. Verifique se aparece as mensagens `[SyncAds]`
4. Se não aparecer, o script não carregou
5. Revise o passo 4 da instalação

### ❌ **Carrinho vazio ao chegar no checkout**

**Causa:** API não está pegando os produtos corretamente

**Solução:**
1. Verifique no Console os dados enviados
2. Teste a rota `/cart.js` diretamente: `sua-loja.myshopify.com/cart.js`
3. Verifique se a Edge Function está recebendo os dados corretos

## 🎨 PERSONALIZAÇÃO

### **Ativar/Desativar Debug**

Para desativar os logs no console:

```javascript
const CONFIG = {
  // ...
  DEBUG: false, // ← Mudar para false
};
```

### **Adicionar Seletores Customizados**

Se sua loja usa classes diferentes para os botões:

```javascript
SELECTORS: {
  checkoutButtons: [
    'button[name="checkout"]',
    ".meu-botao-checkout", // ← Adicionar aqui
  ],
  // ...
}
```

### **Interceptar apenas carrinho (não produto)**

Remova o script das páginas de produto e mantenha apenas no carrinho.

## 📊 MONITORAMENTO

### **Console do Navegador**

Com `DEBUG: true`, você verá todos os eventos:
- 🎯 Botões interceptados
- 🛒 Checkout iniciado
- 📦 Carrinho obtido
- 🔄 Pedido sendo criado
- ✅ Pedido criado
- 🚀 Redirecionamento

### **Logs do Supabase**

1. Dashboard Supabase → Logs → Edge Functions
2. Filtre por `shopify-create-order`
3. Veja todas as requisições e respostas

## 🔐 SEGURANÇA

### **Chave Anon é segura?**

✅ **SIM!** A chave `anon` (pública) é segura porque:
- Só tem permissões de leitura pública
- Row Level Security (RLS) está ativo
- Não expõe dados sensíveis
- É a mesma usada no frontend

### **O que NÃO fazer:**

❌ Nunca use a `service_role` key no script
❌ Nunca exponha credenciais de admin
❌ Nunca desabilite RLS

## 📝 CHECKLIST FINAL

Antes de ir para produção:

- [ ] Script criado em `Assets/syncads-checkout-redirect.js`
- [ ] `SUPABASE_ANON_KEY` configurada corretamente
- [ ] Script incluído no `theme.liquid` antes de `</body>`
- [ ] URLs verificadas (API_URL e CHECKOUT_URL)
- [ ] Teste completo realizado (adicionar → checkout → redirecionar)
- [ ] Console sem erros
- [ ] Redirecionamento funcionando
- [ ] Checkout customizado carregando corretamente
- [ ] `DEBUG: false` para produção (opcional)

## 🆘 SUPORTE

Se encontrar problemas:

1. **Verifique o Console** - Pressione F12 e veja os logs
2. **Verifique os Logs do Supabase** - Veja se a requisição chegou
3. **Teste a Edge Function** - Use o Supabase Dashboard
4. **Verifique a integração Shopify** - Certifique-se que está configurada

## 📚 RECURSOS

- **Script**: `public/shopify-checkout-redirect.js`
- **Edge Function**: `supabase/functions/shopify-create-order/index.ts`
- **Documentação Shopify**: https://shopify.dev/docs/themes
- **Documentação Supabase**: https://supabase.com/docs

---

## ✨ PRONTO!

Agora seu checkout Shopify está redirecionando para o SyncAds! 🎉

Todos os cliques em "Finalizar Compra" serão interceptados e enviados para seu checkout customizado.

**Próximo passo:** Teste com produtos reais e personalize as cores no painel SyncAds!