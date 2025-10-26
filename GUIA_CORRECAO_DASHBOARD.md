# 🛠️ GUIA DE CORREÇÃO - DASHBOARD SYNCADS

## 🚨 PROBLEMA IDENTIFICADO

**Dashboard mostrando "tarjas brancas" ao invés de dados**

### **Causas Principais:**
1. ❌ **Arquivo `.env.local` não existe**
2. ❌ **Variáveis de ambiente não configuradas**
3. ⚠️ **organizationId não sendo carregado**
4. ⚠️ **Sem tratamento de erros visível**

---

## ✅ CORREÇÕES APLICADAS

### **1. Logs de Debug Adicionados**
- ✅ Logs no console para identificar problemas
- ✅ Logs de erros específicos por tipo de query
- ✅ Logs de dados recebidos

### **2. Error Handling Melhorado**
- ✅ Verificação de organizationId
- ✅ Fallback para buscar organizationId do banco
- ✅ Tratamento de erros em todas as queries

### **3. Ajustes de Display**
- ✅ Texto agora é sempre visível (cor preta, bold)
- ✅ Loading states melhorados
- ✅ Fallback para dados vazios

---

## 📋 PASSO A PASSO PARA CORRIGIR

### **PASSO 1: Criar arquivo .env.local**

**CRÍTICO - SEM ISSO NADA FUNCIONA!**

1. Na raiz do projeto, criar arquivo `.env.local`
2. Copiar o seguinte conteúdo:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://ovskepqggmxlfckxqgbr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92c2tlcHFnZ214bGZja3hxZ2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MjQ4NTUsImV4cCI6MjA3NjQwMDg1NX0.UdNgqpTN38An6FuoJPZlj_zLkmAqfJQXb6i1DdTQO_E
```

3. Salvar o arquivo

### **PASSO 2: Reiniciar servidor**

```bash
# Parar o servidor (Ctrl+C)
# Depois iniciar novamente
npm run dev
```

### **PASSO 3: Verificar Console**

1. Abrir a aplicação no browser
2. Abrir DevTools (F12)
3. Ir para aba "Console"
4. Verificar mensagens de log:

```
🔍 [Dashboard Metrics] Iniciando carregamento...
🔍 [Dashboard Metrics] User ID: xxx
🔍 [Dashboard Metrics] User organizationId: xxx
📊 [Campaigns] Dados: X
📊 [Orders] Dados: X
etc...
```

### **PASSO 4: Verificar Network**

1. No DevTools, ir para aba "Network"
2. Filtrar por "Supabase"
3. Verificar requisições:
   - Status: deve ser 200 (OK)
   - Headers: deve ter Authorization
   - Response: deve ter dados JSON

---

## 🔍 DIAGNÓSTICO

### **Se aparecer estes logs no console:**

#### **✅ BOAS NOTÍCIAS:**
```
🔍 [Dashboard Metrics] Usando organizationId do user: xxx-xxx-xxx
📊 [Campaigns] Dados: 5
📊 [Orders] Dados: 10
```
**Isso significa que está funcionando!**

#### **❌ PROBLEMA:**
```
❌ [Dashboard Metrics] organizationId não encontrado no user
❌ [Dashboard Metrics] organizationId não encontrado no banco também
```
**Isso significa que o usuário não tem organizationId configurado.**

#### **❌ PROBLEMA DE CONEXÃO:**
```
Failed to fetch
Network request failed
CORS error
```
**Isso significa que as variáveis de ambiente não estão configuradas.**

---

## 🛠️ SOLUÇÕES PARA CADA ERRO

### **Erro 1: "Missing Supabase environment variables"**
**Solução:** Criar arquivo `.env.local` (PASSO 1)

### **Erro 2: "Organization not found"**
**Solução:** 
```sql
-- Executar no Supabase SQL Editor
UPDATE "User" 
SET "organizationId" = 'uuid-da-organizacao' 
WHERE id = 'uuid-do-usuario';
```

### **Erro 3: "Network request failed"**
**Soluções:**
1. Verificar se arquivo `.env.local` existe
2. Verificar se servidor foi reiniciado
3. Verificar URL do Supabase

### **Erro 4: Dados retornam `[]` (array vazio)**
**Soluções:**
1. Verificar se tem dados no banco:
```sql
SELECT COUNT(*) FROM "Campaign";
SELECT COUNT(*) FROM "Order";
SELECT COUNT(*) FROM "Transaction";
```
2. Verificar RLS Policies
3. Verificar se organizationId está correto

---

## 🎯 VERIFICAÇÃO FINAL

Após aplicar as correções, verificar:

1. ✅ Arquivo `.env.local` existe
2. ✅ Servidor reiniciado
3. ✅ Console mostra logs sem erros
4. ✅ Network tab mostra requisições com status 200
5. ✅ Dados aparecem nas cards da dashboard

---

## 📊 O QUE ESPERAR

### **Dashboard Funcionando:**
- ✅ Cards mostram números reais
- ✅ Sem "tarjas brancas" infinitas
- ✅ Taxas de mudança mostram valores
- ✅ Ícones coloridos aparecem

### **Console Mostra:**
- ✅ Logs de carregamento
- ✅ Logs de dados recebidos
- ✅ Nenhum erro vermelho

### **Network Tab Mostra:**
- ✅ Requisições para Supabase REST API
- ✅ Status 200 (OK)
- ✅ Respostas com dados JSON

---

## 🚀 PRÓXIMOS PASSOS

Se ainda houver problemas após criar `.env.local`:

1. **Verificar banco de dados:**
   - Abrir Supabase Dashboard
   - Ir para Table Editor
   - Verificar se tabelas têm dados

2. **Verificar autenticação:**
   - Fazer logout e login novamente
   - Verificar se session foi criada

3. **Verificar RLS:**
   - Supabase Dashboard → Authentication → Policies
   - Verificar se usuário tem permissão

4. **Criar dados de teste:**
```sql
-- Criar campanhas de teste
INSERT INTO "Campaign" (name, "organizationId", status, "budgetTotal")
VALUES ('Campanha Teste', 'uuid-org', 'ACTIVE', 1000);
```

---

## 📝 RESUMO

### **O que foi corrigido:**
✅ Logs de debug adicionados
✅ Error handling melhorado
✅ Fallback para organizationId
✅ Text display ajustado para ser sempre visível

### **O que você precisa fazer:**
🔴 **CRÍTICO:** Criar arquivo `.env.local`
🟢 Reiniciar servidor
🟢 Verificar console do browser
🟢 Verificar se dados aparecem

### **Teste final:**
```
1. Criar .env.local
2. npm run dev
3. Abrir /dashboard
4. Verificar cards mostram dados
```

---

**Se tudo funcionar, as "tarjas brancas" vão desaparecer e você verá dados reais!**
