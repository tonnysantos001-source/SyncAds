# 🧪 COMO TESTAR O CHAT - PASSO A PASSO DEFINITIVO

## ✅ SERVIDOR JÁ ESTÁ RODANDO!

O dev server está ativo em: **http://localhost:5173**

---

## 📝 INSTRUÇÕES DE TESTE

### 1️⃣ **Abrir o Navegador**
- Abra: **http://localhost:5173**
- Ou clique no link acima

### 2️⃣ **Fazer Login**
Use uma destas contas:

**Opção 1: Super Admin**
- Email: `fatimadrivia@gmail.com`
- Senha: (sua senha cadastrada)

**Opção 2: Member**
- Email: `thailanchaves786@gmail.com`
- Senha: (sua senha cadastrada)

### 3️⃣ **Acessar o Chat Admin**
Após login:
1. Clique no menu **"Super Admin"** (lateral)
2. Clique em **"Chat"**
3. OU acesse direto: **http://localhost:5173/super-admin/chat**

### 4️⃣ **Enviar Mensagem de Teste**
Digite qualquer uma destas:

```
Olá! Você está funcionando?
```

```
Liste campanhas ativas
```

```
Me dê estatísticas do sistema
```

---

## ✅ RESULTADO ESPERADO

Você deve ver:
- ✅ Bolinha de loading girando
- ✅ Resposta da IA aparecendo
- ✅ Mensagem salva no histórico

---

## ❌ SE DER ERRO

### Erro: "Usuário não autenticado"
**Solução:** Faça logout e login novamente
- Clique no botão de **Logout**
- Faça **Login** novamente com seu email/senha

### Erro: "No AI configured"
**Solução:** A IA está configurada no banco, recarregue a página
- Pressione **F5** (recarregar)
- Tente enviar mensagem novamente

### Erro: "Missing authorization header"
**Solução:** Seu token expirou
- Faça **Logout**
- Faça **Login** novamente

---

## 🔍 CONSOLE DE DEBUG

Se quiser ver os logs detalhados:

1. Pressione **F12** no navegador
2. Vá na aba **Console**
3. Envie uma mensagem
4. Veja os logs em tempo real:
   - ✅ "User data: ..."
   - ✅ "OrgAiConnection: true"
   - ✅ "GlobalAI found: true"
   - ✅ "AI Config - Provider: OPENROUTER"

---

## 🎯 CORREÇÕES APLICADAS

### ✅ Backend
1. **Migration de limpeza**: Deletou organizações órfãs
2. **Edge Function simplificada**: 2 queries separadas ao invés de JOIN complexo
3. **Deploy concluído**: Versão 10 da chat-stream

### ✅ Frontend
1. **OrganizationId obrigatório**: Agora busca do usuário antes de criar conversa
2. **Tratamento de auth**: Redireciona para login se não autenticado
3. **Validações**: Checks de usuário e organização

### ✅ Banco de Dados
1. **1 Organização**: SyncAds (ENTERPRISE)
2. **1 IA Ativa**: openai/gpt-oss-20b:free (OPENROUTER)
3. **1 Conexão Default**: Marcada corretamente
4. **2 Usuários**: Ambos na org SyncAds

---

## 💡 DICA FINAL

Se **TUDO der certo**, você verá algo assim:

```
[Você] Olá! Você está funcionando?
[IA] 🤖 Sim! Estou funcionando perfeitamente! 
     Como posso ajudá-lo com o SyncAds hoje?
```

---

**🚀 TESTE AGORA E ME CONFIRME O RESULTADO!**

Se der erro, **tire print** do Console (F12) e me envie.
