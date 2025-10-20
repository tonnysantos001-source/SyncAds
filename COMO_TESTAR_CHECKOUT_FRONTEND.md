# 🧪 COMO TESTAR O CHECKOUT FRONTEND

**Data:** 20 de Outubro de 2025

---

## 🚀 INICIAR O PROJETO

```bash
cd C:\Users\dinho\Documents\GitHub\SyncAds
npm run dev
```

**Acessar:** http://localhost:5173

---

## 1️⃣ TESTAR SIDEBAR COM MENUS COLAPSÁVEIS

### Login
1. Fazer login com suas credenciais
2. Você será redirecionado para `/dashboard`

### Testar Expansão/Colapso
1. **Click em "Relatórios"** (ícone 📈)
   - ✅ Deve expandir mostrando 3 submenus
   - ✅ Ícone muda para ▲
   
2. **Click novamente em "Relatórios"**
   - ✅ Deve colapsar (esconder submenus)
   - ✅ Ícone volta para ▼

3. **Repetir para todos os menus:**
   - 📈 Relatórios (3 submenus)
   - 🛒 Pedidos (3 submenus) - Badge "Novo"
   - 📦 Produtos (3 submenus)
   - 👥 Clientes (2 submenus)
   - 📢 Marketing (7 submenus) - Badge "Novo"
   - 💳 Checkout (5 submenus)

### Testar Badges "Novo"
1. **Pedidos** deve ter badge vermelho "Novo"
2. **Marketing** deve ter badge vermelho "Novo"
3. **Pix Recuperados** (submenu) deve ter badge "Novo"

### Testar Colapsar Sidebar
1. **Rolar até o final da sidebar**
2. **Click no botão [≡]** (PanelLeft)
   - ✅ Sidebar deve encolher (mostrar só ícones)
   - ✅ Textos devem desaparecer
   - ✅ Largura muda de 256px para 80px

3. **Click novamente**
   - ✅ Sidebar volta ao normal
   - ✅ Textos voltam

---

## 2️⃣ TESTAR NAVEGAÇÃO POR RELATÓRIOS

### Visão Geral
```
Click: Relatórios > Visão geral
URL: /reports/overview
```

**Deve mostrar:**
- ✅ Título "Visão Geral - Relatórios"
- ✅ Ícone de gráfico 📊
- ✅ Alert amarelo "Página em Desenvolvimento"
- ✅ 3 cards com skeleton loading (animados)
- ✅ Botão "Voltar"

### Público Alvo
```
Click: Relatórios > Público alvo
URL: /reports/audience
```

**Deve mostrar:**
- ✅ Título "Público Alvo"
- ✅ Ícone de alvo 🎯
- ✅ Mesma estrutura placeholder

### UTMs
```
Click: Relatórios > UTMs
URL: /reports/utms
```

**Deve mostrar:**
- ✅ Título "UTMs"
- ✅ Ícone de link 🔗
- ✅ Mesma estrutura placeholder

---

## 3️⃣ TESTAR NAVEGAÇÃO POR PEDIDOS

### Ver Todos
```
Click: Pedidos > Ver todos
URL: /orders/all
```

**Deve mostrar:**
- ✅ Título "Todos os Pedidos"
- ✅ Ícone de carrinho 🛒

### Carrinhos Abandonados
```
Click: Pedidos > Carrinhos abandonados
URL: /orders/abandoned-carts
```

**Deve mostrar:**
- ✅ Título "Carrinhos Abandonados"
- ✅ Ícone de sacola 🛍️

### Pix Recuperados (NOVO)
```
Click: Pedidos > Pix Recuperados
URL: /orders/pix-recovered
```

**Deve mostrar:**
- ✅ Título "Pix Recuperados"
- ✅ Badge "Novo" no submenu
- ✅ Ícone de dinheiro 💰

---

## 4️⃣ TESTAR NAVEGAÇÃO POR PRODUTOS

### Ver Todos
```
Click: Produtos > Ver todos
URL: /products/all
```

### Coleções
```
Click: Produtos > Coleções
URL: /products/collections
```

### Kit de Produtos
```
Click: Produtos > Kit de Produtos
URL: /products/kits
```

---

## 5️⃣ TESTAR NAVEGAÇÃO POR CLIENTES

### Ver Todos
```
Click: Clientes > Ver todos
URL: /customers/all
```

### Leads
```
Click: Clientes > Leads
URL: /customers/leads
```

---

## 6️⃣ TESTAR NAVEGAÇÃO POR MARKETING

### Cupons
```
Click: Marketing > Cupons
URL: /marketing/coupons
```

### Order Bump
```
Click: Marketing > Order Bump
URL: /marketing/order-bump
```

### Upsell
```
Click: Marketing > Upsell
URL: /marketing/upsell
```

### Cross-Sell
```
Click: Marketing > Cross-Sell
URL: /marketing/cross-sell
```

### Faixa de Desconto
```
Click: Marketing > Faixa de desconto
URL: /marketing/discount-banner
```

### Cashback
```
Click: Marketing > Cashback
URL: /marketing/cashback
```

### Pixels
```
Click: Marketing > Pixels
URL: /marketing/pixels
```

---

## 7️⃣ TESTAR NAVEGAÇÃO POR CHECKOUT

### Descontos
```
Click: Checkout > Descontos
URL: /checkout/discounts
```

### Personalizar
```
Click: Checkout > Personalizar
URL: /checkout/customize
```

### Provas Sociais
```
Click: Checkout > Provas Sociais
URL: /checkout/social-proof
```

### Gateways
```
Click: Checkout > Gateways
URL: /checkout/gateways
```

### Redirecionamento
```
Click: Checkout > Redirecionamento
URL: /checkout/redirect
```

---

## 8️⃣ TESTAR CONFIGURAÇÕES - DOMÍNIOS (NOVO)

```
Click: Configurações (sidebar)
Click: Domínios (aba)
URL: /settings/domains
```

### Adicionar Domínio
1. **Digitar:** `checkout.minhaloja.com.br`
2. **Click em "Adicionar Domínio"**
   - ✅ Deve aparecer na tabela
   - ✅ Status: "Pendente"
   - ✅ Registro DNS: `CNAME: checkout -> syncads.app`

### Copiar DNS
1. **Click no ícone de copiar** ao lado do DNS
   - ✅ Deve copiar para clipboard
   - ✅ Você pode colar (Ctrl+V) para verificar

### Verificar Domínio
1. **Click em "Verificar"** no domínio pendente
   - ✅ Status muda para "Verificado"
   - ✅ Badge fica verde

### Ver Instruções
1. **Rolar até "Como Configurar"**
   - ✅ Deve mostrar 4 passos numerados
   - ✅ Com ícones e descrições

---

## 9️⃣ TESTAR CONFIGURAÇÕES - LOGÍSTICA (NOVO)

```
Click: Configurações (sidebar)
Click: Logística (aba)
URL: /settings/logistics
```

### Adicionar Método de Envio
1. **Preencher:**
   - Nome: `Correios - PAC`
   - Transportadora: `Correios` (select)
   - Prazo: `10-15`
   - Preço: `15.50`
   - Frete Grátis: `100.00`

2. **Click "Adicionar Método"**
   - ✅ Deve aparecer na tabela
   - ✅ Status: Ativado (switch verde)

### Testar Select de Transportadora
1. **Click no select "Transportadora"**
   - ✅ Deve mostrar opções:
     - Correios
     - Jadlog
     - Total Express
     - Loggi
     - Própria
     - Outra

### Ativar/Desativar Método
1. **Click no switch** de um método
   - ✅ Deve alternar entre ativo/inativo

### Editar/Deletar
1. **Hover nos botões** de ação
   - ✅ Ícone de lápis (editar)
   - ✅ Ícone de lixeira (deletar - vermelho)

### Configurações Adicionais
1. **Rolar até "Configurações Adicionais"**
   - ✅ 3 switches:
     - Calcular frete automaticamente
     - Permitir retirada na loja
     - Rastreamento de pedidos ✅ (ativo)
   - ✅ Campo "CEP de Origem"

---

## 🔟 TESTAR MENUS ORIGINAIS (NÃO MEXIDOS)

### Chat IA
```
Click: Chat IA
URL: /chat
```
- ✅ Deve funcionar normalmente
- ✅ Sistema de IA intacto

### Dashboard
```
Click: Dashboard
URL: /dashboard
```
- ✅ Deve mostrar métricas reais (não mockadas)
- ✅ Gráfico funcionando

### Integrações
```
Click: Integrações
URL: /integrations
```
- ✅ OAuth funcionando
- ✅ Conectar Facebook, Google, etc

---

## 🎨 TESTAR RESPONSIVIDADE

### Desktop (>768px)
1. **Sidebar sempre visível**
2. **Width 256px (normal) ou 80px (colapsada)**
3. **Hover effects funcionando**

### Tablet/Mobile (<768px)
1. **Sidebar começa escondida**
2. **Click no botão hambúrguer** (header)
   - ✅ Sidebar abre com overlay
   - ✅ Click fora fecha
   - ✅ Click no X fecha

---

## ✅ CHECKLIST DE TESTE

### Sidebar:
- [ ] Menus expandem ao clicar
- [ ] Menus colapsam ao clicar novamente
- [ ] Badges "Novo" aparecem
- [ ] Botão colapsar sidebar funciona
- [ ] Mobile: overlay aparece
- [ ] Mobile: click fora fecha

### Páginas:
- [ ] Todas as 25 páginas carregam
- [ ] Alert amarelo aparece
- [ ] 3 cards skeleton animados
- [ ] Botão "Voltar" funciona
- [ ] Ícones específicos por página

### Domínios:
- [ ] Adicionar domínio funciona
- [ ] Copiar DNS funciona
- [ ] Verificar status funciona
- [ ] Tabela mostra domínios
- [ ] Instruções aparecem

### Logística:
- [ ] Adicionar método funciona
- [ ] Select transportadora funciona
- [ ] Switch ativar/desativar funciona
- [ ] Tabela mostra métodos
- [ ] Editar/Deletar visível

### Menus Originais:
- [ ] Chat IA funciona
- [ ] Dashboard funciona
- [ ] Integrações funcionam
- [ ] Settings funciona

---

## 🐛 POSSÍVEIS PROBLEMAS

### Problema: Menus não expandem
**Solução:** Verificar console do navegador (F12)

### Problema: Páginas 404
**Solução:** Verificar se `npm run dev` está rodando

### Problema: Sidebar não colapsa
**Solução:** Testar em desktop (>768px)

### Problema: Erros no console
**Solução:** Normal! São avisos de TypeScript do ambiente local

---

## 📸 O QUE FOTOGRAFAR/GRAVAR

### Para enviar feedback:
1. ✅ Sidebar com menus expandidos
2. ✅ Sidebar colapsada (só ícones)
3. ✅ Página placeholder (qualquer uma)
4. ✅ Domínios em Settings
5. ✅ Logística em Settings
6. ✅ Badges "Novo" visíveis

### Gravação de Tela (Opcional):
- Click expandindo todos os menus
- Navegação por diferentes páginas
- Adicionando domínio
- Adicionando método de envio

---

## 🎯 RESULTADO ESPERADO

Após testar tudo:
- ✅ 25 páginas placeholder funcionando
- ✅ Sidebar com menus colapsáveis
- ✅ Domínios configurável
- ✅ Logística configurável
- ✅ Sistema IA/Integrações intacto

---

## 📞 PRÓXIMO PASSO

Após testar, envie:
1. ✅ Confirmação que tudo funciona
2. 🎨 Imagens detalhadas de como quer cada página
3. 📝 Campos específicos de cada tela
4. 💡 Funcionalidades desejadas

---

**Bons testes! 🚀**
