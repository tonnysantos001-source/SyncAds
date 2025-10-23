# 🧪 COMO TESTAR O CHAT ADMINISTRATIVO

## ✅ Correções Aplicadas

### 1. **Edge Function `chat-stream` Corrigida**
- ✅ Instância do Supabase criada corretamente
- ✅ Query de IA modificada para buscar qualquer IA ativa (não só isDefault)
- ✅ Deploy realizado com sucesso (versão 8)

### 2. **IA Configurada no Banco**
- ✅ OrganizationAiConnection marcada como `isDefault = true`
- ✅ IA: `openai/gpt-oss-20b:free` (OPENROUTER, ativa)
- ✅ Organização Global: SyncAds (ID: 62f38421-3ea6-44c4-a5e0-d6437a627ab5)

---

## 📝 Passo a Passo para Testar

### 1. Fazer Login como Super Admin
1. Abra o navegador
2. Acesse: http://localhost:5173 (ou sua URL)
3. Faça login com seu usuário Super Admin

### 2. Abrir o Chat Administrativo
1. Clique no menu **Super Admin**
2. Vá em **Chat** ou acesse diretamente: http://localhost:5173/super-admin/chat
3. Aguarde a página carregar

### 3. Enviar Mensagem de Teste
Digite qualquer uma destas mensagens:

```
Olá! Você está funcionando?
```

```
Liste minhas campanhas
```

```
Me mostre um resumo do sistema
```

### 4. Verificar se Funciona ✅
Se funcionar, você verá:
- ✅ Bolinha de loading girando
- ✅ Resposta da IA aparecendo
- ✅ Mensagem salva no histórico

Se NÃO funcionar ❌, você verá:
- ❌ Erro "No AI configured" ou "500 Internal Server Error"
- ❌ Console do navegador com detalhes do erro

---

## 🔍 Se Ainda Der Erro

### Abra o Console do Navegador (F12)
1. Pressione **F12** no navegador
2. Vá na aba **Console**
3. Envie uma mensagem no chat
4. **Tire um print** do erro que aparecer
5. Me envie o print para análise

### Informações Importantes
- **Edge Function:** `https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/chat-stream`
- **Versão Atual:** 8 (última)
- **Deploy:** 23/10/2025 13:06 UTC-3

---

## 🎯 O Que Esperar

### ✅ SUCESSO:
```json
{
  "response": "Olá! Sim, estou funcionando perfeitamente! Como posso ajudá-lo hoje?"
}
```

### ❌ ERRO (se acontecer):
```json
{
  "error": "No AI configured"
}
```

---

## 💡 Dica Final

Se o erro persistir após testar, vou precisar:
1. Print do erro no Console (F12)
2. Print da aba Network mostrando a requisição
3. Confirmação de que você está logado como Super Admin

Aí posso fazer ajustes mais específicos! 🚀
