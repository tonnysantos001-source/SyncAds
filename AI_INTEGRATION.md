# 🤖 Integração de IA no SyncAds

## ✅ Status da Integração

A integração de IA está **totalmente funcional**! As respostas simuladas foram removidas e agora o chat usa sua chave de API real.

## 🔑 Como Funciona

### 1. Configuração da Chave de API

1. Acesse **Configurações** → **Chaves de API**
2. Clique em **"+ Nova Conexão de IA"**
3. Preencha:
   - **Nome**: Nome descritivo (ex: "OpenAI GPT-4")
   - **Chave de API**: Sua API key da OpenAI ou provedor compatível
   - **Base URL** (opcional): Deixe em branco para usar OpenAI padrão
4. Clique em **"Testar Conexão"** para validar
5. Se válida, a chave será marcada como ativa

### 2. Usando o Chat

Após configurar uma chave válida:

1. Acesse a página **Chat**
2. Digite sua mensagem
3. A IA responderá usando sua chave configurada
4. O sistema mantém contexto das últimas 10 mensagens

## 🔧 Provedores Compatíveis

O sistema é compatível com qualquer API que siga o padrão OpenAI:

### OpenAI (Padrão)
- **Base URL**: `https://api.openai.com/v1` (padrão)
- **Modelos**: gpt-3.5-turbo, gpt-4, gpt-4-turbo
- **Obter chave**: https://platform.openai.com/api-keys

### Outras Opções Compatíveis

#### Azure OpenAI
- **Base URL**: `https://YOUR-RESOURCE.openai.azure.com/openai/deployments/YOUR-DEPLOYMENT`
- Requer configuração adicional

#### LocalAI (Auto-hospedado)
- **Base URL**: `http://localhost:8080/v1`
- Roda modelos localmente

#### Groq (Rápido e Gratuito)
- **Base URL**: `https://api.groq.com/openai/v1`
- **Modelos**: llama3, mixtral, gemma
- **Obter chave**: https://console.groq.com

#### Together AI
- **Base URL**: `https://api.together.xyz/v1`
- Suporta vários modelos open-source

## 🎯 Funcionalidades Implementadas

### ✅ Chat com IA Real
- Respostas geradas pela API configurada
- Contexto de conversa (últimas 10 mensagens)
- Sistema de prompt personalizável
- Tratamento de erros robusto

### ✅ Validação de Chave
- Teste de conexão antes de ativar
- Status visual (ativa/inválida)
- Mensagens de erro claras

### ✅ Configurações Avançadas
- System prompt customizável
- Múltiplas chaves de API
- Base URL configurável (para provedores alternativos)

## 📝 Sistema de Prompt

O prompt do sistema pode ser personalizado em **Configurações** → **IA**:

**Prompt Padrão:**
```
Você é o SyncAds AI, um assistente de marketing digital especializado em otimização de campanhas. Seja proativo, criativo e forneça insights baseados em dados. Suas respostas devem ser claras, concisas e sempre focadas em ajudar o usuário a atingir seus objetivos de marketing.
```

### Sugestões de Personalização

**Para Marketing de E-commerce:**
```
Você é um especialista em marketing para e-commerce. Ajude com campanhas de produtos, anúncios de remarketing, otimização de conversão e estratégias de vendas online.
```

**Para B2B:**
```
Você é um consultor de marketing B2B. Foque em geração de leads qualificados, LinkedIn Ads, ABM (Account-Based Marketing) e nutrição de leads.
```

**Para Agências:**
```
Você é um consultor para agências de marketing. Ajude com estratégias para múltiplos clientes, relatórios profissionais e otimização de ROI.
```

## 🚀 Capacidades da IA

Com a chave configurada, a IA pode:

### ✅ Análise de Campanhas
- Analisar performance de campanhas
- Sugerir otimizações
- Identificar problemas
- Recomendar ajustes de budget

### ✅ Criação de Conteúdo
- Gerar copy para anúncios
- Criar headlines chamativas
- Sugerir CTAs efetivos
- Desenvolver estratégias de mensagem

### ✅ Estratégia de Marketing
- Planejar campanhas
- Definir públicos-alvo
- Sugerir plataformas ideais
- Otimizar mix de canais

### ✅ Insights de Dados
- Interpretar métricas
- Identificar tendências
- Comparar performance
- Prever resultados

## 🔒 Segurança

### Armazenamento de Chaves
- Chaves são armazenadas localmente no navegador
- Nunca são enviadas para servidores externos (exceto API da IA)
- Podem ser removidas a qualquer momento

### Boas Práticas
1. **Não compartilhe** suas chaves de API
2. **Revogue** chaves antigas não utilizadas
3. **Use limites** de gastos na plataforma da IA
4. **Monitore** o uso regularmente

## 🐛 Solução de Problemas

### Erro: "Chave de API não configurada"
- Configure uma chave válida em Configurações → Chaves de API
- Teste a conexão antes de usar

### Erro: "Erro ao gerar resposta"
Possíveis causas:
1. **Chave inválida**: Verifique se a chave está correta
2. **Sem créditos**: Adicione créditos na conta da OpenAI
3. **Rate limit**: Aguarde alguns segundos e tente novamente
4. **Base URL incorreta**: Verifique a URL do provedor

### IA responde lentamente
- Normal para modelos grandes (GPT-4)
- Use GPT-3.5-turbo para respostas mais rápidas
- Considere usar Groq para velocidade máxima

### Respostas genéricas
- Personalize o system prompt
- Forneça mais contexto nas mensagens
- Use sugestões rápidas específicas

## 📊 Monitoramento de Uso

Para monitorar o uso da sua API:

### OpenAI
- Acesse: https://platform.openai.com/usage
- Veja gastos em tempo real
- Configure alertas de limite

### Groq
- Dashboard: https://console.groq.com
- Monitore tokens usados
- Gratuito até certo limite

## 🔮 Futuras Melhorias

### Em Desenvolvimento
- [ ] Streaming de respostas (typing em tempo real)
- [ ] Histórico de conversas no Supabase
- [ ] Sugestões contextuais automáticas
- [ ] Análise de imagens (GPT-4 Vision)
- [ ] Voz para texto (Whisper)

### Planejado
- [ ] Agentes autônomos para gerenciar campanhas
- [ ] Integração com plataformas de anúncios
- [ ] Análise automática de performance
- [ ] Alertas inteligentes
- [ ] Relatórios gerados por IA

## 💡 Dicas de Uso

### Comandos Úteis
- "Analise minha campanha X"
- "Crie 5 headlines para produto Y"
- "Sugira otimizações para melhorar CTR"
- "Qual o melhor público para produto Z?"
- "Compare performance de Google Ads vs Facebook"

### Contexto é Importante
Forneça detalhes como:
- Objetivo da campanha
- Público-alvo
- Orçamento disponível
- Resultados atuais
- Desafios específicos

### Iteração
- Refine as respostas com follow-ups
- Peça alternativas se não gostar da primeira sugestão
- Use as sugestões rápidas como ponto de partida

## 📞 Suporte

Problemas com a integração?
1. Verifique os logs do console (F12)
2. Teste a chave API diretamente no site do provedor
3. Revise este documento
4. Consulte a documentação do provedor de IA

---

**Sistema 100% funcional! 🎉**

Agora você pode conversar com uma IA real que te ajudará a gerenciar e otimizar suas campanhas de marketing.
