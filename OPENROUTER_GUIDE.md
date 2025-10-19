# 🔑 Guia de Configuração - OpenRouter

## O que é OpenRouter?

OpenRouter é uma plataforma que oferece acesso unificado a múltiplos modelos de IA (GPT-4, Claude, Llama, etc.) através de uma única API. É uma ótima alternativa à OpenAI pois:

- ✅ **Preços competitivos** - Geralmente mais barato que usar direto
- ✅ **Múltiplos modelos** - Acesso a GPT-4, Claude, Llama e mais
- ✅ **Créditos grátis** - $1 de crédito grátis para novos usuários
- ✅ **Sem vendor lock-in** - Troque de modelo facilmente

## 🚀 Como Configurar no SyncAds

### Passo 1: Obter sua Chave de API

1. Acesse: https://openrouter.ai/
2. Faça login ou crie uma conta
3. Vá em **Keys** no menu lateral
4. Clique em **Create Key**
5. Copie sua chave (começa com `sk-or-v1-...`)

### Passo 2: Configurar no SyncAds

1. Abra o SyncAds
2. Vá em **Configurações** → **Chaves de API**
3. Clique em **"Adicionar Conexão"**
4. Selecione **"OpenRouter"** no provedor
5. Preencha:
   - **Nome**: OpenRouter (ou qualquer nome que preferir)
   - **Chave de API**: Cole sua chave (`sk-or-v1-...`)
   - **URL Base**: `https://openrouter.ai/api/v1` (já preenchido)
   - **Modelo**: Escolha um modelo disponível
6. Clique em **"Salvar"**

### Passo 3: Testar a Conexão

1. Clique no menu **⋮** da sua conexão
2. Selecione **"Testar Conexão"**
3. Aguarde a validação ✅

**Nota**: Se aparecer aviso sobre CORS, não se preocupe! A chave será marcada como válida e funcionará no chat.

## 🤖 Modelos Recomendados

### Para uso geral (balanceado)
- `openai/gpt-3.5-turbo` - Rápido e barato
- `anthropic/claude-3-haiku` - Equilibrado

### Para qualidade máxima
- `openai/gpt-4-turbo` - Melhor da OpenAI
- `anthropic/claude-3-opus` - Melhor da Anthropic
- `anthropic/claude-3.5-sonnet` - Novo e poderoso

### Para economia
- `meta-llama/llama-3-8b` - Gratuito e rápido
- `google/gemma-7b` - Gratuito

### Para código
- `anthropic/claude-3.5-sonnet` - Excelente para programação
- `openai/gpt-4-turbo` - Muito bom também

## 💰 Preços de Referência

| Modelo | Entrada (por 1M tokens) | Saída (por 1M tokens) |
|--------|-------------------------|----------------------|
| GPT-3.5-turbo | $0.50 | $1.50 |
| GPT-4-turbo | $10.00 | $30.00 |
| Claude 3 Haiku | $0.25 | $1.25 |
| Claude 3.5 Sonnet | $3.00 | $15.00 |
| Llama 3 8B | Grátis | Grátis |

**Preços atualizados em**: Outubro 2024
**Ver preços atuais**: https://openrouter.ai/docs#models

## 🔧 Solução de Problemas

### ❌ Erro: "Não foi possível conectar à API"

**Possíveis causas**:
1. Chave de API incorreta ou expirada
2. URL base incorreta
3. Problema de conexão com internet

**Soluções**:
- Verifique se a chave está correta (deve começar com `sk-or-v1-`)
- Certifique-se de que a URL base é: `https://openrouter.ai/api/v1`
- Teste sua conexão com internet
- Regenere uma nova chave no OpenRouter

### ❌ Erro: "Invalid API Key"

**Causa**: Chave inválida ou revogada

**Solução**:
1. Acesse https://openrouter.ai/keys
2. Verifique se a chave ainda está ativa
3. Se necessário, crie uma nova chave
4. Atualize a chave nas configurações do SyncAds

### ❌ Erro: "Insufficient credits"

**Causa**: Você não tem créditos suficientes na sua conta OpenRouter

**Solução**:
1. Acesse https://openrouter.ai/credits
2. Adicione créditos à sua conta
3. Ou use um modelo gratuito (Llama 3, Gemma)

### ❌ Erro: "Model not found"

**Causa**: O modelo especificado não existe ou você não tem acesso

**Solução**:
1. Verifique a lista de modelos disponíveis: https://openrouter.ai/docs#models
2. Use o formato correto: `provedor/modelo`
   - Exemplo: `openai/gpt-4-turbo`
   - Exemplo: `anthropic/claude-3-opus`
3. Alguns modelos exigem configurações extras na conta

### ⚠️ Aviso: "Limitação do Navegador (CORS)"

**O que é**: Aviso técnico sobre testes de conexão no navegador

**É problema?** Não! Isso é normal e esperado.

**O que fazer**: 
- A chave foi marcada como válida automaticamente
- Teste no chat para confirmar que funciona
- Se funcionar no chat, está tudo OK! ✅

## 🎯 Dicas de Uso

### 1. Escolha o Modelo Certo
- Use **GPT-3.5-turbo** para tarefas simples e rápidas
- Use **GPT-4** ou **Claude 3.5** para análises complexas
- Use **Llama 3** se quiser economizar (é grátis!)

### 2. Configure Limites de Gastos
1. Acesse https://openrouter.ai/settings
2. Configure um limite de gastos mensal
3. Receba alertas quando atingir 80% do limite

### 3. Monitore o Uso
- Dashboard: https://openrouter.ai/activity
- Veja quantos tokens usou
- Compare gastos por modelo
- Identifique padrões de uso

### 4. Use System Prompts Eficientes
- Seja específico no prompt do sistema
- Não repita instruções em toda mensagem
- Use o prompt para definir o "papel" da IA
- Exemplo bom: "Você é um assistente de marketing focado em ROI"

## 📱 Testando a Integração

Depois de configurar, teste com estas mensagens no chat:

1. **Teste básico**:
   ```
   Olá! Você está funcionando?
   ```
   ✅ Resposta esperada: Confirmação de que está ativo

2. **Teste de contexto**:
   ```
   Me ajude a criar uma campanha de Facebook Ads para venda de notebooks
   ```
   ✅ Resposta esperada: Sugestões detalhadas

3. **Teste de análise**:
   ```
   Analise: Taxa de conversão de 2%, CTR de 1.5%, CPC de R$ 0.80
   ```
   ✅ Resposta esperada: Análise e sugestões

## 🆘 Ainda com Problemas?

Se você seguiu todos os passos e ainda está com erro:

1. **Verifique o Console (F12)**
   - Abra as ferramentas do desenvolvedor
   - Vá na aba "Console"
   - Copie qualquer erro em vermelho

2. **Teste Direto na API**
   ```bash
   curl https://openrouter.ai/api/v1/chat/completions \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer SUA_CHAVE_AQUI" \
     -d '{
       "model": "openai/gpt-3.5-turbo",
       "messages": [{"role": "user", "content": "teste"}]
     }'
   ```

3. **Informações Úteis para Debug**
   - Mensagem de erro completa
   - Modelo que está usando
   - URL base configurada
   - Screenshot do console (F12)

## 🔗 Links Úteis

- **OpenRouter Dashboard**: https://openrouter.ai/
- **Documentação**: https://openrouter.ai/docs
- **Lista de Modelos**: https://openrouter.ai/docs#models
- **Preços**: https://openrouter.ai/docs#models (veja a coluna de preços)
- **Gerenciar Chaves**: https://openrouter.ai/keys
- **Créditos**: https://openrouter.ai/credits
- **Atividade**: https://openrouter.ai/activity

## ✅ Checklist de Configuração

Use este checklist para garantir que tudo está OK:

- [ ] Criei conta no OpenRouter
- [ ] Gerei uma chave de API
- [ ] Adicionei a chave no SyncAds
- [ ] Configurei a URL base: `https://openrouter.ai/api/v1`
- [ ] Selecionei um modelo
- [ ] Testei a conexão
- [ ] Chave marcada como válida ✅
- [ ] Testei no chat e recebeu resposta
- [ ] Configurei limite de gastos (opcional mas recomendado)

---

**🎉 Tudo pronto!**

Agora você pode usar todos os modelos da OpenRouter no SyncAds para gerenciar suas campanhas com IA de última geração!
