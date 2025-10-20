# Configurar Supabase Auth - Desabilitar Confirmação de Email

Para permitir que usuários façam login imediatamente após o cadastro, precisamos desabilitar a confirmação de email obrigatória.

## Passo a Passo

### 1. Acesse o Dashboard do Supabase

https://supabase.com/dashboard/project/ovskepqggmxlfckxqgbr

### 2. Vá em Authentication → Providers → Email

### 3. Configure as seguintes opções:

#### ✅ Desabilitar Confirmação Obrigatória
- **Confirm email:** ❌ DESABILITADO
- Isso permite login imediato após cadastro

#### ✅ Habilitar Email Change
- **Enable email change:** ✅ HABILITADO  
- Permite trocar email pelo painel

#### ✅ Secure Email Change
- **Secure email change:** ✅ HABILITADO
- Requer confirmação antes de mudar email

### 4. Configurações de Email Template (Opcional)

Personalize os templates de email:
- **Confirm signup:** Template de verificação (usado no painel)
- **Magic Link:** Template de login por link
- **Change Email Address:** Template de mudança de email
- **Reset Password:** Template de reset de senha

### 5. Salvar Configurações

Clique em **Save** no final da página.

---

## Fluxo Após Configuração

### Novo Cadastro:
1. Usuário preenche: nome, email, senha, CPF, data nascimento
2. Conta criada instantaneamente
3. Login automático após cadastro
4. `emailVerified = FALSE` no banco
5. Banner no painel: "Verifique seu email para desbloquear todos os recursos"

### Verificação de Email (Opcional):
1. Usuário vai em Settings → Segurança da Conta
2. Clica em "Verificar Email"
3. Recebe email de confirmação
4. Clica no link
5. `emailVerified = TRUE` no banco

### Vantagens:
- ✅ UX melhor (acesso imediato)
- ✅ Menos fricção no cadastro
- ✅ Email verificado como feature opcional
- ✅ Compliance mantido (usuário pode verificar depois)

---

## Alternativa: Via SQL (se preferir)

Se quiser fazer via SQL direto no banco:

```sql
-- Permitir login sem confirmação de email
UPDATE auth.config 
SET value = 'false' 
WHERE key = 'MAILER_AUTOCONFIRM';
```

⚠️ **Nota:** Essa abordagem não é recomendada. Use o Dashboard!

---

## Troubleshooting

**Erro: "Email not confirmed"**
- Verifique se "Confirm email" está desabilitado
- Aguarde 1-2 minutos para cache limpar
- Teste com novo email

**Usuários antigos com email não confirmado:**
```sql
-- Marcar todos como confirmados (cuidado!)
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;
```

---

**Status:** ⚠️ Configuração manual necessária (2 minutos)
