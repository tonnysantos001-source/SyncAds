# Configurar Chave de Encriptação no Supabase Vault

⚠️ **CRÍTICO:** A chave de encriptação atual é temporária e DEVE ser substituída em produção!

## Por que isso é importante?

As API keys das IAs (OpenAI, Anthropic, Google) são armazenadas encriptadas no banco de dados usando a extensão `pgcrypto`. A chave de encriptação precisa ser segura e armazenada no Supabase Vault.

## Passos para Configurar

### 1. Gerar uma Chave Segura

Execute este comando para gerar uma chave de 32 caracteres:

```bash
openssl rand -base64 32
```

Ou use este Node.js:

```javascript
const crypto = require('crypto');
console.log(crypto.randomBytes(32).toString('base64'));
```

### 2. Criar Secret no Supabase Vault

1. Acesse o Supabase Dashboard: https://supabase.com/dashboard/project/ovskepqggmxlfckxqgbr

2. Vá em **Settings** → **Vault**

3. Clique em **New Secret**

4. Preencha:
   - **Name:** `encryption_key`
   - **Secret:** Cole a chave gerada no passo 1
   - **Description:** "Chave para encriptar API keys no banco"

5. Clique em **Add Secret**

### 3. Atualizar Migration para Usar o Vault

Execute esta migration para atualizar a função de encriptação:

```sql
-- Atualizar função para usar Vault ao invés de config
CREATE OR REPLACE FUNCTION encrypt_api_key(api_key_text TEXT)
RETURNS TEXT AS $$
DECLARE
  encryption_key TEXT;
BEGIN
  -- Buscar chave do Vault
  SELECT decrypted_secret INTO encryption_key
  FROM vault.decrypted_secrets
  WHERE name = 'encryption_key';

  IF encryption_key IS NULL THEN
    RAISE EXCEPTION 'Encryption key not found in Vault';
  END IF;

  RETURN encode(
    encrypt(
      api_key_text::bytea,
      encryption_key::bytea,
      'aes'
    ),
    'base64'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atualizar função de decriptação
CREATE OR REPLACE FUNCTION decrypt_api_key(encrypted_key TEXT)
RETURNS TEXT AS $$
DECLARE
  encryption_key TEXT;
BEGIN
  -- Buscar chave do Vault
  SELECT decrypted_secret INTO encryption_key
  FROM vault.decrypted_secrets
  WHERE name = 'encryption_key';

  IF encryption_key IS NULL THEN
    RAISE EXCEPTION 'Encryption key not found in Vault';
  END IF;

  RETURN convert_from(
    decrypt(
      decode(encrypted_key, 'base64'),
      encryption_key::bytea,
      'aes'
    ),
    'UTF8'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4. Testar a Encriptação

Execute este SQL no Supabase SQL Editor para testar:

```sql
-- Testar encriptação
SELECT encrypt_api_key('test-api-key-123');

-- Testar decriptação (use o resultado do comando acima)
SELECT decrypt_api_key('RESULTADO_ENCRIPTADO_AQUI');
```

### 5. Re-encriptar API Keys Existentes (se houver)

Se você já tem API keys no banco com a chave temporária, execute:

```sql
-- Backup primeiro!
CREATE TABLE GlobalAiConnection_backup AS SELECT * FROM "GlobalAiConnection";

-- Re-encriptar (isso vai usar a nova chave do Vault)
UPDATE "GlobalAiConnection"
SET "apiKey" = apiKey -- Trigger irá re-encriptar
WHERE "apiKeyEncrypted" IS NOT NULL;
```

## Verificação de Segurança

✅ **Checklist:**
- [ ] Chave gerada com 32+ caracteres aleatórios
- [ ] Chave armazenada no Supabase Vault
- [ ] Funções atualizadas para usar o Vault
- [ ] Testado encriptar/decriptar
- [ ] API keys existentes re-encriptadas
- [ ] Chave temporária removida do código

## Alternativa: Variáveis de Ambiente (Edge Functions)

Se preferir usar variáveis de ambiente para as Edge Functions:

1. No Supabase Dashboard, vá em **Edge Functions** → **Settings**
2. Adicione uma variável de ambiente:
   - **Key:** `ENCRYPTION_KEY`
   - **Value:** A chave gerada

3. Use nas Edge Functions:
```typescript
const encryptionKey = Deno.env.get('ENCRYPTION_KEY');
```

## Troubleshooting

**Erro: "Encryption key not found in Vault"**
- Verifique se o secret foi criado com o nome exato: `encryption_key`
- Verifique se a migration foi executada

**Erro: "could not decrypt data"**
- A chave mudou e os dados foram encriptados com chave diferente
- Execute o passo 5 para re-encriptar

**Erro: "function vault.decrypted_secrets does not exist"**
- O Vault não está habilitado. Vá em Settings → Vault e habilite

## Segurança Adicional

1. **Rotação de Chaves:** Implemente rotação periódica (a cada 90 dias)
2. **Auditoria:** Monitore acessos à chave no Vault
3. **Backup:** Mantenha backup seguro da chave (ex: 1Password, AWS Secrets Manager)
4. **Acesso:** Limite quem pode ver/editar secrets no Vault

## Status Atual

🔴 **ATENÇÃO:** Sistema usando chave temporária no código!

Execute os passos acima ANTES de ir para produção.
