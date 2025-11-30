# 🧪 Guia de Teste - Correção de Alucinação de Pesquisas

**Data**: 2024
**Deploy**: ✅ Concluído
**Edge Function**: `chat-enhanced` (deployada)

---

## 🎯 Objetivo

Validar que a IA **NÃO está mais alucinando** resultados de pesquisas e está corretamente executando comandos via extensão Chrome.

---

## 📋 Pré-requisitos

Antes de começar os testes:

- [ ] Edge function `chat-enhanced` deployada (✅ FEITO)
- [ ] Extensão Chrome SyncAds instalada e ativa
- [ ] Login feito na extensão
- [ ] Side Panel da extensão aberto
- [ ] Pelo menos 1 aba aberta no Chrome

---

## 🧪 Testes de Validação

### ✅ TESTE 1: Pesquisa YouTube (caso original do usuário)

**Comando:**
```
abra o youtube e pesquise por videos de pudin
```

**Resultado ESPERADO:**
1. ✅ IA responde: "🔍 Abrindo YouTube e buscando por 'videos de pudin'..."
2. ✅ Nova aba abre no Chrome
3. ✅ URL: `https://www.youtube.com/results?search_query=videos+de+pudin`
4. ✅ Página do YouTube carrega com resultados REAIS da busca
5. ❌ IA NÃO inventa lista de vídeos

**Resultado ERRADO (o que era antes):**
- ❌ IA retorna: "Encontrei estes vídeos: 1. Pudim de leite..., 2. Pudim cremoso..."
- ❌ Dados inventados/falsos
- ❌ Nenhuma aba abre

---

### ✅ TESTE 2: Pesquisa YouTube (variação)

**Comando:**
```
pesquise por receitas de bolo no youtube
```

**Resultado ESPERADO:**
1. ✅ IA responde: "🔍 Buscando 'receitas de bolo' no YouTube..."
2. ✅ Nova aba abre
3. ✅ URL: `https://www.youtube.com/results?search_query=receitas+de+bolo`
4. ✅ Resultados reais do YouTube

---

### ✅ TESTE 3: Pesquisa YouTube (detecção automática)

**Comando:**
```
videos de como fazer pão
```

**Resultado ESPERADO:**
1. ✅ IA detecta automaticamente que é pesquisa no YouTube (palavra-chave "videos")
2. ✅ IA responde: "🔍 Buscando 'como fazer pão' no YouTube..."
3. ✅ Nova aba abre no YouTube com busca

---

### ✅ TESTE 4: Pesquisa Google

**Comando:**
```
pesquise por restaurantes italianos
```

**Resultado ESPERADO:**
1. ✅ IA responde: "🔍 Buscando 'restaurantes italianos' no Google..."
2. ✅ Nova aba abre
3. ✅ URL: `https://www.google.com/search?q=restaurantes+italianos`
4. ✅ Resultados reais do Google

---

### ✅ TESTE 5: Pesquisa Google (variação)

**Comando:**
```
procure hotéis em paris
```

**Resultado ESPERADO:**
1. ✅ IA responde: "🔍 Pesquisando 'hotéis em paris' no Google..."
2. ✅ Nova aba abre no Google com busca

---

### ✅ TESTE 6: Navegação simples (sem pesquisa)

**Comando:**
```
abra o facebook
```

**Resultado ESPERADO:**
1. ✅ IA responde: "🌐 Abrindo Facebook..."
2. ✅ Nova aba abre
3. ✅ URL: `https://www.facebook.com` (SEM query parameters)

---

### ✅ TESTE 7: Comando não-navegação

**Comando:**
```
tire uma screenshot
```

**Resultado ESPERADO:**
1. ✅ IA responde: "📸 Capturando screenshot..."
2. ✅ Screenshot é tirada da página atual
3. ✅ NÃO abre novas abas

---

## 🔍 Como Validar nos Logs

### Ver logs da Edge Function:

```bash
cd SyncAds
supabase functions logs chat-enhanced --tail
```

### O que procurar nos logs:

**✅ BOM (detecção funcionando):**
```
🔍 Detectando comandos DOM na mensagem do usuário...
✅ 1 comando(s) DOM detectado(s): [...]
🔍 [SEARCH] Convertendo pesquisa para navegação: https://www.youtube.com/results?search_query=...
✅ Comando criado com sucesso: [ID]
```

**❌ RUIM (ainda alucinando):**
```
# Se não aparecer "🔍 [SEARCH]" mas a IA responder com dados
# = detecção falhou, IA está alucinando
```

---

## 📊 Checklist de Validação Completo

Após rodar TODOS os testes acima:

- [ ] TESTE 1: Pesquisa YouTube (caso original) ✅
- [ ] TESTE 2: Pesquisa YouTube (variação) ✅
- [ ] TESTE 3: Pesquisa YouTube (auto-detect) ✅
- [ ] TESTE 4: Pesquisa Google ✅
- [ ] TESTE 5: Pesquisa Google (variação) ✅
- [ ] TESTE 6: Navegação simples ✅
- [ ] TESTE 7: Comando não-navegação ✅

**Critérios de SUCESSO:**
- [ ] IA NÃO inventa mais dados de pesquisas
- [ ] Todas as pesquisas abrem URLs corretas
- [ ] Query parameters estão presentes e corretos
- [ ] Extensão executa comandos NAVIGATE
- [ ] Logs mostram "🔍 [SEARCH]" nos comandos de pesquisa

---

## ❌ Se ainda houver problemas

### Problema 1: IA ainda alucina resultados

**Possível causa**: Model não está respeitando system prompt

**Solução:**
1. Verificar qual modelo está sendo usado (Claude, GPT-4, Groq)
2. Testar com Claude Sonnet (geralmente respeita melhor)
3. Reduzir `temperature` para 0.3 ou menos
4. Verificar se `systemPrompt` está sendo aplicado

**Como verificar:**
```typescript
// Adicionar log temporário em chat-enhanced/index.ts
console.log("System Prompt Length:", finalSystemPrompt.length);
console.log("Using Model:", aiConnection?.model);
```

---

### Problema 2: Comandos não são detectados

**Possível causa**: Regex não está capturando variações

**Solução:**
1. Verificar logs: `🔍 Detectando comandos DOM...`
2. Se não aparecer comando detectado, regex falhou
3. Adicionar variação no `SEARCH_PATTERNS`

**Teste manualmente:**
```typescript
// Em test_command_detector.ts
testInteractive("sua mensagem aqui");
```

---

### Problema 3: URL incorreta

**Possível causa**: Encoding ou parsing de query

**Solução:**
1. Verificar URL gerada nos logs
2. Verificar `encodeURIComponent()` está sendo usado
3. Verificar espaços estão sendo convertidos para `+` ou `%20`

---

## 🐛 Debug Avançado

### Ativar logs detalhados:

```typescript
// Em chat-enhanced/index.ts, adicionar após detecção:
console.log("🔍 Detection Result:", JSON.stringify(detection, null, 2));
console.log("🔍 Commands:", detection.commands.map(c => ({
  type: c.type,
  params: c.params,
  confidence: c.confidence
})));
```

### Verificar routing decision:

```typescript
// Já existe em chat-enhanced/index.ts (L315)
console.log("🧭 [ROUTING] Decision:", {
  executor: routingDecision.executor,
  confidence: routingDecision.confidence,
  reason: routingDecision.reason,
});
```

### Verificar comando salvo no DB:

```sql
-- No Supabase SQL Editor
SELECT 
  id,
  type,
  data,
  status,
  created_at
FROM extension_commands
WHERE user_id = 'SEU_USER_ID'
ORDER BY created_at DESC
LIMIT 10;
```

---

## 📞 Suporte

Se os testes falharem:

1. **Capturar evidências:**
   - Screenshot da resposta da IA
   - Logs da edge function
   - Network tab (DevTools)
   - Console da extensão

2. **Verificar:**
   - Deploy foi bem-sucedido?
   - Extensão está conectada?
   - System prompt está ativo?
   - Model correto sendo usado?

3. **Informações necessárias:**
   - Mensagem enviada
   - Resposta da IA (completa)
   - Logs da edge function
   - Modelo de IA usado
   - Versão da extensão

---

## ✅ Critérios de Aprovação

O fix está **APROVADO** se:

✅ 7/7 testes passarem
✅ 0 alucinações detectadas
✅ Todas as URLs corretas
✅ Extensão executa comandos
✅ Logs mostram detecção correta

---

## 📝 Relatório de Teste

Após completar os testes, preencher:

**Data do teste**: _______________
**Testado por**: _______________
**Versão da extensão**: _______________
**Edge function version**: _______________

**Resultados:**
- Testes passados: ___/7
- Alucinações detectadas: ___
- Bugs encontrados: ___

**Observações:**
_______________________________________________
_______________________________________________
_______________________________________________

**Status final**: ⬜ APROVADO  ⬜ REPROVADO

---

**Boa sorte com os testes! 🚀**