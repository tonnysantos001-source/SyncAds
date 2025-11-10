# 🔧 PROMPT PARA CORREÇÕES PÓS-AUDITORIA - SYNCADS

**⚠️ IMPORTANTE:** Use este prompt em um NOVO CHAT para executar as correções identificadas na auditoria.

---

## 📋 PROMPT PARA COPIAR E ENVIAR

```
Olá! Preciso que você execute APENAS as correções e validações identificadas na auditoria do SyncAds.

**⚠️ REGRAS CRÍTICAS:**
1. NÃO criar páginas novas que já existem
2. NÃO duplicar código existente
3. NÃO modificar código que já está funcionando
4. APENAS corrigir problemas identificados na auditoria
5. Retornar apenas "✅ [ITEM] - OK" quando concluir cada tarefa

**📍 CONTEXTO:**
- Sistema: SyncAds (plataforma SaaS de marketing e checkout)
- Arquivos de auditoria: `AUDITORIA/RELATORIO-COMPLETO.md` e `AUDITORIA/TESTES-CRITICOS.md`
- Status: 90% pronto, faltam validações críticas
- Lançamento: em 2 dias

---

## 🎯 TAREFAS A EXECUTAR

### TAREFA 1: Validar Queries do SuperAdminDashboard
**Arquivo:** `src/pages/super-admin/SuperAdminDashboard.tsx`

**O que fazer:**
1. Ler o arquivo completo
2. Verificar a query de contagem de mensagens (linhas 156-160)
3. Verificar o cálculo de totalMessages (linhas 165-169)
4. Se houver erro na query (ex: contando tabela errada), CORRIGIR
5. Se estiver correto, apenas confirmar

**Retornar:**
```
✅ TAREFA 1 - SuperAdminDashboard
- Query de mensagens: [OK/CORRIGIDO]
- Cálculo de totais: [OK/CORRIGIDO]
```

---

### TAREFA 2: Validar Queries do UsagePage
**Arquivo:** `src/pages/super-admin/UsagePage.tsx`

**O que fazer:**
1. Ler o arquivo completo
2. Verificar o mapeamento de uso por cliente (linhas 115-125)
3. Verificar o cálculo de totais (linhas 148-160)
4. Se houver lógica incorreta ou query errada, CORRIGIR
5. Se estiver correto, apenas confirmar

**Retornar:**
```
✅ TAREFA 2 - UsagePage
- Mapeamento de uso: [OK/CORRIGIDO]
- Cálculo de totais: [OK/CORRIGIDO]
```

---

### TAREFA 3: Validar Conversão de Preços no BillingPage
**Arquivo:** `src/pages/super-admin/BillingPage.tsx`

**O que fazer:**
1. Ler o arquivo completo
2. Verificar se preços estão sendo convertidos corretamente
3. Buscar por: `/100` ou `* 100` em cálculos de preço
4. Confirmar se está usando centavos ou reais corretamente
5. Se houver inconsistência, CORRIGIR

**Retornar:**
```
✅ TAREFA 3 - BillingPage
- Conversão de preços: [OK/CORRIGIDO]
- Formato moeda: [centavos/reais]
```

---

### TAREFA 4: Verificar e Documentar Gateways
**Arquivo:** `scripts/setup-gateways.ts`

**O que fazer:**
1. Ler o arquivo
2. Contar quantos gateways têm "TODO" no código
3. Identificar quais gateways estão 100% implementados (sem TODOs)
4. Criar lista de gateways prontos vs pendentes
5. NÃO implementar nada, apenas documentar

**Retornar:**
```
✅ TAREFA 4 - Gateways
Prontos (0 TODOs): [listar]
Pendentes (com TODOs): [listar]
```

---

### TAREFA 5: Buscar Dados Mockados/Simulados
**Objetivo:** Encontrar e listar (NÃO corrigir ainda)

**O que fazer:**
1. Buscar nos arquivos por:
   - `MOCK_DATA`
   - `fakeData`
   - `dummyData`
   - `Math.random()` usado para gerar dados
   - Comentários com "mock" ou "fake"
2. Listar todos os arquivos encontrados
3. NÃO modificar nada ainda

**Retornar:**
```
✅ TAREFA 5 - Dados Mockados
Arquivos encontrados:
- [arquivo1]: linha X - [tipo de mock]
- [arquivo2]: linha Y - [tipo de mock]
OU
- Nenhum dado mockado encontrado
```

---

### TAREFA 6: Verificar Validação de Webhooks
**Objetivo:** Identificar se webhooks validam assinaturas

**O que fazer:**
1. Buscar arquivos em `src/lib/gateways/` ou similar
2. Procurar por função `validateWebhookSignature`
3. Verificar se está implementada ou apenas comentário TODO
4. NÃO implementar, apenas documentar status

**Retornar:**
```
✅ TAREFA 6 - Webhooks
Gateway [X]: [IMPLEMENTADO/TODO/NÃO ENCONTRADO]
Gateway [Y]: [IMPLEMENTADO/TODO/NÃO ENCONTRADO]
```

---

### TAREFA 7: Verificar RLS Policies
**Objetivo:** Garantir que Row Level Security está ativo

**O que fazer:**
1. Verificar se há referências a políticas RLS no código
2. Buscar por `rls`, `policy`, `security` em arquivos SQL ou migrations
3. Documentar quais tabelas têm RLS mencionado
4. NÃO modificar nada

**Retornar:**
```
✅ TAREFA 7 - RLS Policies
Encontrado em: [listar arquivos]
Tabelas com RLS: [listar ou "não encontrado"]
```

---

### TAREFA 8: Verificar Exposição de API Keys
**Objetivo:** Garantir que chaves sensíveis não estão expostas

**O que fazer:**
1. Buscar no código frontend por:
   - `SERVICE_ROLE_KEY`
   - `SECRET_KEY`
   - Hardcoded API keys (formato `sk-` ou similar)
2. Verificar se estão usando `process.env` ou `import.meta.env`
3. Listar problemas encontrados

**Retornar:**
```
✅ TAREFA 8 - API Keys
- Keys hardcoded: [SIM - listar arquivos / NÃO]
- Uso de variáveis ambiente: [OK/PRECISA CORREÇÃO]
```

---

### TAREFA 9: Validar Inputs do Usuário
**Objetivo:** Verificar sanitização básica

**O que fazer:**
1. Buscar por inputs de usuário (forms, textareas, etc)
2. Verificar se há validação/sanitização antes de enviar ao backend
3. Buscar por bibliotecas como: `zod`, `yup`, `validator`
4. Documentar status

**Retornar:**
```
✅ TAREFA 9 - Validação Inputs
- Biblioteca de validação: [nome ou "nenhuma"]
- Inputs validados: [SIM/PARCIAL/NÃO]
- Sugestões: [se necessário]
```

---

### TAREFA 10: Build Final
**Objetivo:** Garantir que build está limpo

**O que fazer:**
1. Executar: `npm run build`
2. Verificar se há ERROS (não warnings)
3. Se houver ERROS, listar
4. NÃO corrigir ainda, apenas documentar

**Retornar:**
```
✅ TAREFA 10 - Build
- Status: [SUCESSO/FALHOU]
- Erros: [nenhum / listar]
- Warnings: [quantidade]
```

---

## 📊 FORMATO DO RELATÓRIO FINAL

Após executar TODAS as 10 tarefas, me envie um RESUMO CONSOLIDADO:

```
🎯 RESUMO FINAL DA AUDITORIA TÉCNICA

✅ ITENS OK (funcionando corretamente):
- [listar]

⚠️ ITENS COM ATENÇÃO (precisam correção):
- [listar com prioridade]

🔴 ITENS CRÍTICOS (bloqueio de lançamento):
- [listar]

📝 PRÓXIMOS PASSOS RECOMENDADOS:
1. [ação prioritária]
2. [ação importante]
3. [ação opcional]

⏱️ TEMPO ESTIMADO DE CORREÇÕES: [X horas]
```

---

## ⚠️ RESTRIÇÕES IMPORTANTES

**NÃO FAZER:**
- ❌ Criar páginas novas
- ❌ Duplicar código existente
- ❌ Refatorar código funcionando
- ❌ Implementar novos recursos
- ❌ Modificar estrutura de banco de dados
- ❌ Alterar configurações de deploy

**APENAS FAZER:**
- ✅ Validar queries existentes
- ✅ Corrigir bugs identificados
- ✅ Documentar status atual
- ✅ Listar problemas encontrados
- ✅ Sugerir correções (sem implementar automaticamente)

---

## 🤝 CONFIRMAÇÃO

Confirme que entendeu executando:

"✅ Entendi. Vou executar as 10 tarefas de validação sem criar código novo ou duplicar existente. Retornarei apenas confirmações objetivas."

Então prossiga com as tarefas em ordem.
```

---

## 📝 INSTRUÇÕES DE USO

1. **Copie todo o conteúdo** entre as linhas de ``` (o prompt completo acima)
2. **Abra um NOVO CHAT** com o assistente
3. **Cole o prompt** completo
4. **Aguarde** o assistente confirmar o entendimento
5. **Aguarde** ele executar as 10 tarefas
6. **Receba** o relatório final consolidado

---

## ⏱️ TEMPO ESTIMADO

- Execução das tarefas: 20-30 minutos
- Você revisar o relatório: 10 minutos
- Total: ~40 minutos

---

## ✅ APÓS RECEBER O RELATÓRIO

1. Revise os itens marcados como ⚠️ e 🔴
2. Priorize correções críticas (🔴)
3. Aplique correções sugeridas
4. Execute os testes do arquivo `TESTES-CRITICOS.md`
5. Faça build final: `npm run build`
6. Deploy de teste

---

## 🆘 SE ALGO DER ERRADO

Se o assistente começar a criar código novo ou duplicar páginas, INTERROMPA com:

"PARE! Não crie código novo. Apenas valide e documente o que existe. Releia as REGRAS CRÍTICAS."

---

**Criado para:** Auditoria Pré-Lançamento SyncAds
**Válido até:** Data do lançamento
**Versão:** 1.0