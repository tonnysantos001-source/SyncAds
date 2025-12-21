# Configuração da Variável de Ambiente - PYTHON_SERVICE_URL

**Data:** 2025-12-21  
**Status:** ✅ CONFIGURADO

## Variável Configurada no Supabase

```env
PYTHON_SERVICE_URL=https://syncads-production.up.railway.app
```

## Como Foi Configurado

Usando Supabase CLI:
```bash
supabase secrets set PYTHON_SERVICE_URL=https://syncads-production.up.railway.app
```

## Para Verificar

```bash
supabase secrets list
```

## Função que Usa Esta Variável

- **Função:** `chat-stream` (Edge Function)
- **Localização:** `supabase/functions/chat-stream/index.ts`
- **Linha:** 119
- **Uso:** Chamar o serviço de automação de navegador Python no Railway

## Serviço Railway

- **URL:** https://syncads-production.up.railway.app
- **Health Check:** https://syncads-production.up.railway.app/health
- **Browser Automation:** https://syncads-production.up.railway.app/api/browser-automation/health

## Como Testar

1. **Health check do Railway:**
   ```bash
   curl https://syncads-production.up.railway.app/health
   ```

2. **Browser automation endpoint:**
   ```bash
   curl https://syncads-production.up.railway.app/api/browser-automation/health
   ```

3. **Teste na extensão:**
   - Abrir extensão Chrome
   - Enviar: "abra o google"
   - Verificar se não aparece mais erro "Navegador em nuvem offline"

## Próximos Passos

Após configurar esta variável, a função `chat-stream` deve fazer deploy automático. Se não acontecer automaticamente:

```bash
supabase functions deploy chat-stream
```

## Observações

⚠️ Esta variável é um **SECRET** e não deve ser commitada no repositório.
✅ Ela está configurada apenas no Supabase Dashboard.
✅ O serviço Railway está online e funcionando.
