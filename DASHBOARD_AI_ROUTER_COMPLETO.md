# 📊 DASHBOARD AI ROUTER - DOCUMENTAÇÃO COMPLETA

## 🎯 Visão Geral

O Dashboard AI Router é um sistema completo de monitoramento e análise de performance das IAs (Groq e Gemini) implementado no painel administrativo do SyncAds.

**Data de Implementação:** 28 de Janeiro de 2025  
**Localização:** `/super-admin/usage` (Painel Super Admin → Uso de IA)  
**Versão:** 2.0

---

## ✨ FUNCIONALIDADES IMPLEMENTADAS

### 1. **Métricas em Tempo Real** ⚡

Seção roxa no topo da página com métricas agregadas dos últimos 7 dias:

#### **Card Groq (Azul)**
- ⚡ **Total de Requisições:** Número absoluto de chamadas
- 🕐 **Latência Média:** Tempo de resposta em milissegundos
- ✅ **Taxa de Sucesso:** Percentual de requisições bem-sucedidas

#### **Card Gemini (Roxo)**
- 🔵 **Total de Requisições:** Número absoluto de chamadas
- 🕐 **Latência Média:** Tempo de resposta em milissegundos
- ✅ **Taxa de Sucesso:** Percentual de requisições bem-sucedidas

#### **Card Últimas 24h (Cinza)**
- 📊 **Total de Requisições:** Volume nas últimas 24 horas
- 📈 **Distribuição Groq:** Barra de progresso azul com percentual
- 📈 **Distribuição Gemini:** Barra de progresso roxa com percentual

#### **Top Razões de Roteamento**
- 🎯 Mostra as 4 principais razões pelas quais o AI Router escolheu cada IA
- Exemplos:
  - "Chat rápido e gratuito"
  - "Geração de imagem solicitada"
  - "Análise multimodal necessária"
  - "Contexto muito grande"

---

### 2. **Sistema de Alertas Inteligentes** 🚨

Alertas automáticos baseados em thresholds pré-definidos:

#### **Alerta de Latência Alta (⚠️ Warning)**
- **Threshold:** > 3000ms (3 segundos)
- **Detecção:** Últimas 24 horas
- **Exemplo:** "Groq: 15 requisições com latência > 3s"

#### **Alerta de Taxa de Erro (❌ Error)**
- **Threshold:** > 5% de falhas
- **Detecção:** Últimas 24 horas
- **Exemplo:** "Gemini: 8.5% de erros (12 falhas)"

#### **Alerta de Performance Excelente (✅ Success)**
- **Critérios:**
  - Groq: 100% sucesso + latência < 1500ms
  - Gemini: 100% sucesso + latência < 2000ms
- **Exemplo:** "Performance Excelente - Groq: 100% de sucesso com latência média de 987ms"

**Visual:** Cards coloridos (vermelho/amarelo/verde) com ícones e badges do provider

---

### 3. **Gráficos Temporais** 📈

#### **Gráfico de Requisições por Dia (Area Chart)**
- 📊 **Tipo:** Gráfico de área empilhada
- 🎨 **Cores:** Azul (Groq) + Roxo (Gemini) com gradiente
- 📅 **Período:** Últimos 7 dias
- 💡 **Uso:** Visualizar tendências de volume

**Características:**
- Gradiente suave de azul para transparente (Groq)
- Gradiente suave de roxo para transparente (Gemini)
- Tooltip com detalhes ao passar o mouse
- Legenda interativa (clicar para ocultar série)

#### **Gráfico de Latência Média (Line Chart)**
- 📊 **Tipo:** Gráfico de linha
- 🎨 **Cores:** Azul (Groq) + Roxo (Gemini)
- 📅 **Período:** Últimos 7 dias
- 💡 **Uso:** Monitorar performance ao longo do tempo

**Características:**
- Linhas grossas (strokeWidth: 2)
- Pontos destacados em cada dia
- Escala dinâmica no eixo Y
- Grid suave para facilitar leitura

#### **Gráfico de Taxa de Sucesso (Line Chart - Duplo)**
- 📊 **Tipo:** Gráfico de linha duplo (largura completa)
- 🎨 **Cores:** Verde (Groq) + Roxo (Gemini)
- 📅 **Período:** Últimos 7 dias
- 💡 **Uso:** Monitorar confiabilidade das IAs

**Características:**
- Linhas mais grossas (strokeWidth: 3)
- Pontos maiores (r: 5)
- Escala fixa 0-100% no eixo Y
- Fácil identificar quedas de performance

---

### 4. **Comparação A/B: Groq vs Gemini** ⚖️

Seção lado a lado comparando os dois providers em detalhes:

#### **Coluna Groq (Esquerda - Azul)**

**Métricas:**
1. **Total de Requisições**
   - Número absoluto
   - Barra de progresso proporcional
   
2. **Latência Média**
   - Valor em ms
   - Comparação dinâmica: "X% mais rápido/lento que Gemini"
   - Ícone de tendência (↓ verde ou ↑ vermelho)

3. **Taxa de Sucesso**
   - Percentual
   - Barra de progresso verde

4. **Melhor Para:**
   - ✓ Chat conversacional rápido
   - ✓ Respostas em tempo real
   - ✓ Alto volume de requisições
   - ✓ Custo zero (gratuito)

#### **Coluna Gemini (Direita - Roxo)**

**Métricas:**
1. **Total de Requisições**
   - Número absoluto
   - Barra de progresso proporcional
   
2. **Latência Média**
   - Valor em ms
   - Comparação dinâmica: "X% mais rápido/lento que Groq"
   - Ícone de tendência (↓ verde ou ↑ amarelo)

3. **Taxa de Sucesso**
   - Percentual
   - Barra de progresso verde

4. **Melhor Para:**
   - ✓ Geração de imagens
   - ✓ Análise multimodal
   - ✓ Contexto longo (1M tokens)
   - ✓ Tarefas complexas

#### **Recomendação Inteligente do Sistema**

Card no final da comparação com análise automática:

- "Groq está sendo mais utilizado → Sistema otimizado para velocidade"
- "Gemini está sendo mais utilizado → Sistema priorizando capacidades avançadas"
- "Uso equilibrado → Sistema funcionando perfeitamente"

---

## 🎨 DESIGN E UX

### **Paleta de Cores**

- **Groq:** Azul (`#3b82f6`) - Representa velocidade
- **Gemini:** Roxo/Rosa (`#a855f7` → `#ec4899`) - Representa multimodal
- **Sucesso:** Verde (`#10b981`)
- **Aviso:** Amarelo (`#fbbf24`)
- **Erro:** Vermelho (`#ef4444`)

### **Animações**

- `framer-motion` para entrada suave dos cards
- `initial={{ opacity: 0, y: 20 }}`
- `animate={{ opacity: 1, y: 0 }}`
- Delays escalonados (0.05s, 0.1s, 0.15s, 0.2s)

### **Responsividade**

- **Desktop:** Grid 2 colunas para comparação A/B
- **Mobile:** Stack vertical
- **Gráficos:** `ResponsiveContainer` adapta automaticamente

---

## 📊 FONTE DE DADOS

### **Tabela Principal: `ai_usage_logs`**

```sql
CREATE TABLE ai_usage_logs (
  id UUID PRIMARY KEY,
  user_id UUID,
  conversation_id TEXT,
  provider TEXT CHECK (provider IN ('GROQ', 'GEMINI', 'CLAUDE', 'GPT4')),
  model TEXT,
  selected_reason TEXT,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  cost_usd DECIMAL(10,6),
  latency_ms INTEGER,
  success BOOLEAN,
  error_message TEXT,
  message_length INTEGER,
  needs_image BOOLEAN,
  needs_multimodal BOOLEAN,
  complexity TEXT CHECK (complexity IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **Views Disponíveis**

1. **`ai_usage_statistics`**
   - Estatísticas agregadas por provider e dia
   - Últimos 30 dias
   
2. **`ai_cost_summary`**
   - Resumo de custos diários
   - Últimos 30 dias

3. **`ai_performance_summary`**
   - Performance por provider e model
   - Últimos 7 dias

---

## 🔍 QUERIES SQL ÚTEIS

### **Ver logs recentes**
```sql
SELECT * FROM ai_usage_logs 
ORDER BY created_at DESC 
LIMIT 20;
```

### **Estatísticas por provider**
```sql
SELECT 
  provider,
  COUNT(*) as total,
  ROUND(AVG(latency_ms)) as avg_latency,
  ROUND(AVG(CASE WHEN success THEN 100 ELSE 0 END)) as success_rate
FROM ai_usage_logs
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY provider;
```

### **Top razões de roteamento**
```sql
SELECT 
  selected_reason,
  COUNT(*) as count
FROM ai_usage_logs
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY selected_reason
ORDER BY count DESC
LIMIT 10;
```

### **Alertas de latência**
```sql
SELECT 
  provider,
  COUNT(*) as high_latency_requests
FROM ai_usage_logs
WHERE latency_ms > 3000
  AND created_at >= NOW() - INTERVAL '24 hours'
GROUP BY provider;
```

### **Taxa de erro por dia**
```sql
SELECT 
  DATE(created_at) as date,
  provider,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE NOT success) as errors,
  ROUND(COUNT(*) FILTER (WHERE NOT success)::NUMERIC / COUNT(*) * 100, 2) as error_rate_pct
FROM ai_usage_logs
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at), provider
ORDER BY date DESC;
```

---

## 🚀 COMO USAR

### **Acesso**
1. Login como Super Admin
2. Menu lateral → **"Uso de IA"**
3. Dashboard aparece automaticamente

### **Interpretação das Métricas**

#### **Latência**
- ✅ **< 1000ms:** Excelente
- ⚠️ **1000-2000ms:** Boa
- ⚠️ **2000-3000ms:** Aceitável
- ❌ **> 3000ms:** Requer atenção

#### **Taxa de Sucesso**
- ✅ **> 95%:** Excelente
- ⚠️ **90-95%:** Boa
- ❌ **< 90%:** Requer investigação

#### **Volume**
- Groq deve ter volume maior (chat geral)
- Gemini deve ter volume menor mas mais especializado (imagens/multimodal)

---

## 🔧 MANUTENÇÃO

### **Limpeza de Logs 
Antigos**

Recomenda-se manter apenas 30-90 dias de logs:

```sql
-- Deletar logs com mais de 90 dias
DELETE FROM ai_usage_logs
WHERE created_at < NOW() - INTERVAL '90 days';
```

### **Otimização de Índices**

Se consultas ficarem lentas:

```sql
-- Reindexar tabela
REINDEX TABLE ai_usage_logs;

-- Analisar estatísticas
ANALYZE ai_usage_logs;
```

---

## 🐛 TROUBLESHOOTING

### **Problema: Gráficos não aparecem**

**Causa:** Sem dados nos últimos 7 dias  
**Solução:** Fazer alguns testes no chat primeiro

### **Problema: Alertas não disparam**

**Causa 1:** Latência sempre < 3s (bom!)  
**Causa 2:** Taxa de sucesso sempre > 95% (ótimo!)  
**Solução:** Aguardar condições de alerta ou ajustar thresholds

### **Problema: Métricas zeradas**

**Causa:** Tabela `ai_usage_logs` vazia  
**Solução:** 
```sql
-- Verificar se tabela existe
SELECT COUNT(*) FROM ai_usage_logs;

-- Se retornar 0, fazer testes no chat
```

### **Problema: Comparação A/B não aparece**

**Causa:** `aiRouterMetrics` é null  
**Solução:** Verificar se há logs dos últimos 7 dias

---

## 📈 ROADMAP FUTURO

### **Fase 3 (Próxima)**
- [ ] Exportar relatórios em CSV/PDF
- [ ] Filtros de data customizados
- [ ] Drill-down por usuário
- [ ] Comparação mês a mês
- [ ] Alertas por email/Slack

### **Fase 4 (Médio Prazo)**
- [ ] Machine Learning para previsão de uso
- [ ] Otimização automática de roteamento
- [ ] A/B testing automatizado
- [ ] Dashboard em tempo real (WebSocket)

---

## 🎓 GLOSSÁRIO

- **AI Router:** Sistema que escolhe automaticamente entre Groq e Gemini
- **Latência:** Tempo entre enviar pergunta e receber resposta
- **Taxa de Sucesso:** % de requisições sem erro
- **Provider:** Provedor de IA (Groq, Gemini, etc)
- **Multimodal:** Capacidade de processar imagens, vídeos, etc
- **Routing Decision:** Decisão do router sobre qual IA usar
- **Time Series:** Dados ao longo do tempo (séries temporais)
- **A/B Testing:** Comparação de performance entre duas opções

---

## 📞 SUPORTE

### **Logs de Debug**

Para investigar problemas:

```javascript
// No console do navegador (F12)
console.log('AI Router Metrics:', aiRouterMetrics);
console.log('Time Series Data:', timeSeriesData);
console.log('Alerts:', alerts);
```

### **Verificar Health do Sistema**

```sql
-- Última requisição por provider
SELECT 
  provider,
  MAX(created_at) as last_request,
  AGE(NOW(), MAX(created_at)) as time_since_last
FROM ai_usage_logs
GROUP BY provider;
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

- [x] Tabela `ai_usage_logs` criada
- [x] Índices de performance criados
- [x] Views de análise criadas
- [x] AI Router edge function deployada
- [x] Chat-enhanced integrado
- [x] Logging automático funcionando
- [x] Dashboard frontend implementado
- [x] Métricas em tempo real
- [x] Alertas inteligentes
- [x] Gráficos temporais (3 tipos)
- [x] Comparação A/B
- [x] Responsivo (mobile/desktop)
- [x] Animações suaves
- [x] Build sem erros

---

## 🎉 CONCLUSÃO

O Dashboard AI Router fornece visibilidade completa sobre o sistema de IA do SyncAds, permitindo:

1. ✅ Monitorar performance em tempo real
2. ✅ Identificar problemas rapidamente (alertas)
3. ✅ Analisar tendências (gráficos temporais)
4. ✅ Comparar providers (A/B)
5. ✅ Tomar decisões baseadas em dados

**Status:** ✅ Totalmente funcional e em produção  
**Última atualização:** 28 de Janeiro de 2025  
**Próxima revisão:** Fevereiro de 2025