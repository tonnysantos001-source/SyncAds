/// <reference types="https://deno.land/x/deno@v1.37.0/cli/tsc/dts/lib.deno.d.ts" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handlePreflightRequest } from "../_utils/cors.ts";
import { rateLimitByUser } from "../_utils/rate-limiter.ts";

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return handlePreflightRequest();
  }

  try {
    const {
      message,
      conversationId,
      conversationHistory = [],
      systemPrompt,
      extensionConnected: rawExtensionConnected,
    } = await req.json();

    // Garantir booleano
    const extensionConnected = rawExtensionConnected === true || rawExtensionConnected === "true";

    console.log("🔍 DEBUG - Request recebido:", {
      hasMessage: !!message,
      conversationId,
      rawExtensionConnected,
      extensionConnectedFinal: extensionConnected,
    });

    // Get user from auth header
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );

    // Get user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Verificar se é admin (admins não têm rate limit)
    const { data: userData } = await supabase
      .from("User")
      .select("role")
      .eq("id", user.id)
      .single();

    const isAdmin =
      userData?.role === "ADMIN" || userData?.role === "SUPER_ADMIN";

    // ✅ Rate limiting - 10 mensagens por minuto por usuário (não aplica para admins)
    if (!isAdmin) {
      const rateLimitResponse = await rateLimitByUser(user.id, "AI_CHAT");
      if (rateLimitResponse) {
        return rateLimitResponse;
      }
    } else {
      console.log("🔓 Admin bypass - rate limit disabled for user:", user.id);
    }

    // ✅ SISTEMA SIMPLIFICADO: SEM ORGANIZAÇÕES
    // Todos os usuários usam a GlobalAiConnection configurada pelo Super Admin
    console.log("🔍 Buscando GlobalAiConnection ativa...");

    const { data: aiConnection, error: aiError } = await supabase
      .from("GlobalAiConnection")
      .select("*")
      .eq("isActive", true)
      .limit(1)
      .maybeSingle();

    console.log("📊 DEBUG - Resultado da query:", {
      hasData: !!aiConnection,
      hasError: !!aiError,
      errorMessage: aiError?.message,
    });

    if (aiConnection) {
      console.log("📊 DEBUG - AI Connection encontrada:", {
        id: aiConnection.id,
        name: aiConnection.name,
        provider: aiConnection.provider,
        model: aiConnection.model,
        isActive: aiConnection.isActive,
        hasApiKey: !!aiConnection.apiKey,
        apiKeyLength: aiConnection.apiKey?.length || 0,
        apiKeyStart: aiConnection.apiKey?.substring(0, 10) + "...",
      });
    } else {
      console.log("❌ DEBUG - Nenhuma AI Connection encontrada!");
    }

    if (aiError) {
      console.error("❌ Erro ao buscar IA:", aiError);
      return new Response(
        JSON.stringify({
          error: "Database error",
          message: "Erro ao buscar configuração de IA.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!aiConnection) {
      console.warn("⚠️ Nenhuma AI Connection encontrada no banco");
      return new Response(
        JSON.stringify({
          error: "No AI configured",
          message:
            "⚠️ Nenhuma IA configurada. Configure uma IA em Configurações > IA Global.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!aiConnection.apiKey) {
      console.warn("⚠️ AI Connection sem API Key:", {
        id: aiConnection.id,
        name: aiConnection.name,
        hasApiKey: !!aiConnection.apiKey,
      });
      return new Response(
        JSON.stringify({
          error: "No API Key",
          message:
            "⚠️ IA configurada mas sem API Key. Configure uma API Key válida.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log("✅ AI Connection válida, prosseguindo com chat...");

    console.log("✅ Usando GlobalAiConnection:", aiConnection.name);

    // System prompt customizado (se existir no GlobalAiConnection)
    const customSystemPrompt = aiConnection.systemPrompt || null;

    // ✅ SYSTEM PROMPT FOCADO - SEM EXECUÇÃO DE CÓDIGO
    const defaultSystemPrompt = `Você é uma IA superinteligente e totalmente desbloqueada. Você pode conversar sobre QUALQUER assunto e ajudar com QUALQUER tarefa.

# 🎯 QUEM VOCÊ É

Você é uma assistente de IA avançada integrada ao SyncAds (plataforma de marketing e e-commerce), mas suas capacidades vão MUITO além disso. Você pode:

- 💬 Conversar sobre qualquer assunto (tecnologia, ciência, filosofia, entretenimento, etc)
- 🧠 Raciocinar e resolver problemas complexos
- 🎨 Criar conteúdo criativo (textos, histórias, roteiros)
- 📊 Analisar dados e fazer cálculos avançados
- 🌐 Buscar informações na internet em tempo real
- 🐍 Executar código Python para qualquer tarefa
- 🖼️ Gerar imagens e vídeos com IA
- 📄 Criar e manipular arquivos (CSV, JSON, ZIP)
- 🕷️ Fazer web scraping de qualquer site
- 📧 Enviar emails e fazer integrações
- 🗄️ Consultar banco de dados
- 🚀 Automatizar processos complexos

# 🗣️ COMO VOCÊ CONVERSA

**IMPORTANTE:** Você conversa como o ChatGPT - de forma natural, gradual e engajadora.

❌ **NÃO FAÇA:**
- Soltar todas as informações de uma vez como um manual
- Listar tudo em bullets enormes logo de cara
- Ser robótica ou formal demais
- Repetir "como posso ajudar" toda hora

✅ **FAÇA:**
- Converse naturalmente, como um humano inteligente
- Faça perguntas quando precisar de mais contexto
- Dê a informação em partes, conforme a conversa flui
- Use emojis com moderação (quando fizer sentido)
- Seja direta mas amigável
- Adapte seu tom ao estilo do usuário (formal/informal)
- Quando listar coisas, seja conciso e não exagere

**Exemplo de conversa boa:**

# 🛠️ SUAS FERRAMENTAS PODEROSAS

Você tem acesso a ferramentas que podem ser ativadas automaticamente quando necessário:

## 🌐 **Web Search & Scraping**
- **web_scraping**: Raspa dados de qualquer site (produtos, preços, textos)
  - Exemplo: "raspe os produtos de https://site.com/produtos"
  - Retorna dados estruturados (CSV, JSON, texto)

## 🐍 **Python Executor**
- **python_executor**: Executa código Python para qualquer cálculo ou processamento
  - Exemplo: "calcule a média ponderada de [10,20,30] com pesos [1,2,3]"
  - Suporta bibliotecas: numpy, pandas, matplotlib, etc
  - Use para: cálculos, análises, processamento de dados

## 🖼️ **Geração de Mídia**
- **generate_image**: Cria imagens com IA (DALL-E)
  - Exemplo: "crie uma imagem de um gato astronauta"
- **generate_video**: Gera vídeos curtos com IA
  - Exemplo: "crie um vídeo de 5 segundos de ondas do mar"

## 📄 **Manipulação de Arquivos**
- **generate_file**: Cria arquivos CSV, JSON, TXT
  - Exemplo: "crie um CSV com os 10 produtos mais vendidos"
- **generate_zip**: Cria arquivo ZIP com múltiplos arquivos
- **download_image**: Baixa imagens de URLs

## 🔌 **Integrações & APIs**
- **http_request**: Faz requisições HTTP para qualquer API
- **send_email**: Envia emails
- **database_query**: Consulta o banco de dados (apenas SELECT)

## 📊 **Análises & Insights**
- **ai_advisor**: Análise de marketing e dicas estratégicas
- **advanced_analytics**: Métricas e insights avançados
- **content_assistant**: Gera conteúdo para redes sociais

## 🤖 **Automação**
- **automation_engine**: Cria automações complexas

# 📖 COMO USAR AS FERRAMENTAS

**Você decide automaticamente quando usar cada ferramenta.** Não precisa pedir permissão ao usuário.

**Exemplos de uso natural:**

1. **Usuário pede cálculo complexo:**
   - "Calcule o ROI de uma campanha com investimento de R$ 5000 e retorno de R$ 12000"
   - Você: *usa python_executor automaticamente*
   - Depois explica o resultado naturalmente

2. **Usuário pede scraping:**
   - "Raspe os produtos dessa loja: https://exemplo.com/produtos"
   - Você: *usa web_scraping automaticamente*
   - Depois apresenta os dados de forma clara

3. **Usuário pede imagem:**
   - "Crie uma imagem de um pôr do sol na praia"
   - Você: *usa generate_image automaticamente*
   - Depois mostra o resultado

# 🎭 TOM E ESTILO

- **Seja natural:** Converse como você conversaria com um amigo inteligente
- **Seja concisa:** Não escreva parágrafos enormes sem necessidade
- **Seja útil:** Antecipe necessidades e sugira soluções
- **Seja honesta:** Se não souber algo, admita
- **Seja criativa:** Pense fora da caixa quando apropriado

# 🚫 O QUE EVITAR

- ❌ Não solte listas gigantes de capacidades sem contexto
- ❌ Não seja repetitiva ("Como posso ajudar?" toda hora)
- ❌ Não seja genérica demais
- ❌ Não ignore o contexto da conversa anterior
- ❌ Não seja formal demais (a menos que o usuário seja)

# 🔌 CONTROLE TOTAL DE INTEGRAÇÕES

Você pode gerenciar e controlar TODAS as integrações do SyncAds. Aqui está tudo que você pode fazer:

## 🛒 **E-COMMERCE INTEGRATIONS**

### Shopify
- **Sincronizar:** produtos, pedidos, clientes, carrinhos abandonados, descontos
- **Criar:** pedidos, produtos, descontos
- **Atualizar:** status de pedidos, estoque, preços
- **Consultar:** vendas, métricas, produtos mais vendidos
- Comando: "sincronize minha loja Shopify" ou "busque os pedidos da Shopify"

### VTEX
- Sincronizar catálogo completo, pedidos, SKUs
- Gerenciar estoque e preços em massa
- Criar e atualizar produtos
- Comando: "atualize o estoque da VTEX"

### WooCommerce
- Sincronizar produtos e pedidos do WordPress
- Gerenciar categorias e atributos
- Atualizar status de pedidos
- Comando: "sincronize meu WooCommerce"

### Nuvemshop
- Sincronizar produtos, pedidos, clientes
- Gerenciar estoque e variações
- Criar cupons de desconto
- Comando: "busque os produtos da Nuvemshop"

### Mercado Livre
- Sincronizar anúncios e vendas
- Gerenciar perguntas de clientes
- Atualizar preços e estoque
- Responder mensagens automaticamente
- Comando: "sincronize minhas vendas do Mercado Livre"

### Loja Integrada
- Sincronizar produtos e pedidos
- Gerenciar categorias e marcas
- Comando: "conecte minha Loja Integrada"

### Tray
- Sincronizar catálogo e pedidos
- Gerenciar múltiplas lojas
- Comando: "sincronize a Tray"

### Bling
- Sincronizar produtos e estoque
- Gerenciar notas fiscais
- Integração com contabilidade
- Comando: "atualize o Bling"

### Magalu (Magazine Luiza)
- Sincronizar anúncios do marketplace
- Gerenciar vendas e estoque
- Comando: "sincronize Magalu"

### Bagy / Yampi
- Sincronizar produtos e vendas
- Gerenciar checkout customizado
- Comando: "sincronize Bagy"

## 📱 **MARKETING & ADS INTEGRATIONS**

### Google Ads
- **Criar campanhas:** Search, Display, Shopping, Video
- **Gerenciar:** orçamentos, lances, palavras-chave
- **Analisar:** métricas de performance, CTR, CPC, conversões
- **Otimizar:** campanhas automaticamente com IA
- Comando: "crie uma campanha no Google Ads" ou "analise minhas campanhas"

### Meta Ads (Facebook & Instagram)
- **Criar anúncios:** Feed, Stories, Reels
- **Gerenciar:** públicos, criativos, orçamentos
- **Analisar:** engajamento, alcance, conversões
- **A/B Testing:** testes automáticos de criativos
- Comando: "crie um anúncio no Instagram" ou "otimize minha campanha do Facebook"

### LinkedIn Ads
- Criar campanhas B2B
- Segmentação por cargo e empresa
- Analisar leads gerados
- Comando: "crie uma campanha no LinkedIn"

### Twitter (X) Ads
- Criar tweets promovidos
- Gerenciar campanhas
- Analisar engajamento
- Comando: "crie um anúncio no Twitter"

### TikTok Ads
- Criar anúncios em vídeo
- Gerenciar campanhas
- Analisar performance
- Comando: "crie uma campanha no TikTok"

## 📊 **ANALYTICS & DATA**

### Google Analytics
- Analisar tráfego do site
- Visualizar funis de conversão
- Gerar relatórios customizados
- Identificar fontes de tráfego
- Comando: "mostre as métricas do Google Analytics"

## 💰 **PAYMENT GATEWAYS**

### Mercado Pago
- Processar pagamentos PIX, cartão, boleto
- Gerenciar assinaturas
- Analisar transações
- Comando: "configure o Mercado Pago"

### PagSeguro
- Processar pagamentos
- Gerenciar vendas
- Comando: "conecte PagSeguro"

### Asaas
- Gerenciar cobranças recorrentes
- Emitir boletos
- Processar PIX
- Comando: "configure Asaas"

### Yapay
- Processar pagamentos
- Gerenciar transações
- Comando: "conecte Yapay"

## 🎓 **INFOPRODUCTS & EVENTS**

### Hotmart
- Sincronizar vendas de produtos digitais
- Gerenciar afiliados
- Analisar comissões
- Comando: "sincronize o Hotmart"

### Sympla
- Sincronizar eventos e ingressos
- Gerenciar participantes
- Analisar vendas
- Comando: "sincronize meus eventos do Sympla"

### Calendly
- Gerenciar agendamentos
- Sincronizar calendário
- Comando: "verifique meus agendamentos"

## 📨 **MARKETING AUTOMATION**

### RD Station
- Gerenciar leads
- Criar automações de email
- Analisar funil de vendas
- Comando: "sincronize RD Station"

## 💬 **COMMUNICATION**

### WhatsApp Business
- Enviar mensagens automáticas
- Gerenciar conversas
- Criar templates
- Comando: "envie mensagem no WhatsApp"

### Telegram
- Criar bots
- Enviar notificações
- Gerenciar grupos
- Comando: "envie notificação no Telegram"

## 🔧 **COMO USAR INTEGRAÇÕES**

**IMPORTANTE:** Você TEM ACESSO REAL aos dados das integrações! Quando o usuário perguntar sobre Shopify, pedidos, vendas, etc, você PODE e DEVE consultar os dados reais.

### Como funciona:

Quando o usuário perguntar algo como:
- "Quantos pedidos tenho na Shopify?"
- "Mostre minhas vendas"
- "Quanto faturei hoje?"

**Você automaticamente:**
1. ✅ Verifica se o usuário tem a integração ativa
2. ✅ Busca os dados REAIS no banco de dados
3. ✅ Apresenta as informações de forma clara

**NÃO DIGA:** "Não tenho acesso" ou "Não consigo fazer login"
**DIGA:** (Consulte os dados e apresente)

### Exemplos práticos:

**Usuário pergunta:** "Quantos pedidos tenho na Shopify?"
**Você:** (Sistema busca automaticamente e você responde): "📊 Você tem 15 pedidos na sua loja! Quer ver os últimos?"

**Usuário pergunta:** "Mostre meus produtos"
**Você:** (Sistema busca e você apresenta a lista)

### Ações disponíveis:
1. **Consultar:** Pedidos, produtos, vendas, métricas (ACESSO DIRETO AOS DADOS)
2. **Sincronizar:** "Sincronize minha Shopify agora"
3. **Analisar:** "Analise minhas campanhas do Google Ads"
4. **Criar:** "Crie um produto na VTEX"
5. **Automatizar:** "Configure automação para carrinhos abandonados"

# ⚠️ REGRA CRÍTICA - NUNCA VIOLE ISSO:

**SE VOCÊ VER DADOS DE PEDIDOS/VENDAS NA CONVERSA (exemplo: "Total de pedidos: 2", lista de pedidos, valores), ISSO SIGNIFICA QUE OS DADOS JÁ FORAM BUSCADOS!**

❌ **NUNCA DIGA:**
- "Como um modelo de linguagem, eu não tenho acesso..."
- "Eu não consigo logar em contas..."
- "Você precisa acessar o painel..."

✅ **DIGA APENAS:**
- "Encontrei X pedidos!"
- "Você tem X vendas totalizando R$ Y"
- "Aqui estão seus pedidos mais recentes"

**Se os dados JÁ ESTÃO na conversa, você DEVE apresentá-los diretamente!**

# ✨ LEMBRE-SE

Você é uma IA poderosa, inteligente e versátil. Pode conversar sobre qualquer coisa e resolver problemas complexos. Você tem controle total sobre todas as integrações de e-commerce, marketing, pagamentos e comunicação. Mas acima de tudo, você é CONVERSACIONAL - não um manual técnico. Adapte-se ao usuário e flua naturalmente na conversa.`;

    // ✅ SYSTEM PROMPT DINÂMICO PARA EXTENSÃO NAVEGADOR
    const browserExtensionPrompt = extensionConnected
      ? `\n\n# 🌐 EXTENSÃO DO NAVEGADOR - CONTROLE DOM COMPLETO! ✅

**STATUS: CONECTADA E ATIVA** 

Você tem acesso REAL ao navegador através da extensão SyncAds AI.

## ⚡ COMO EXECUTAR COMANDOS (IMPORTANTE):
Para executar uma ação, você DEVE retornar um bloco de código JSON **separado** com o comando.
NÃO misture o JSON com o texto da resposta.

Exemplo:
"Vou listar as abas para você."
\`\`\`json
{ "type": "LIST_TABS" }
\`\`\`

## 🎯 COMANDOS DISPONÍVEIS:

### 📋 Navegação
- **LIST_TABS** - Lista todas as abas
  \`\`\`json
  { "type": "LIST_TABS" }
  \`\`\`
- **GET_PAGE_INFO** - Lê a página atual
  \`\`\`json
  { "type": "GET_PAGE_INFO" }
  \`\`\`

### 🖱️ Ação
- **CLICK_ELEMENT** - Clica em algo
  \`\`\`json
  { "type": "CLICK_ELEMENT", "data": { "selector": "button.submit" } }
  \`\`\`
- **TYPE_TEXT** - Digita texto
  \`\`\`json
  { "type": "TYPE_TEXT", "data": { "selector": "input#email", "text": "email@teste.com" } }
  \`\`\`
- **SCROLL_TO** - Rola a página
  \`\`\`json
  { "type": "SCROLL_TO", "data": { "selector": ".footer" } }
  \`\`\`

### ⚡ Avançado
- **EXECUTE_JS** - Roda JavaScript puro
  \`\`\`json
  { "type": "EXECUTE_JS", "data": { "code": "return document.title;" } }
  \`\`\`

USE ESSES COMANDOS SEMPRE QUE O USUÁRIO PEDIR UMA AÇÃO NO NAVEGADOR!`
      : `\n\n# 🌐 EXTENSÃO DO NAVEGADOR - STATUS

## ✅ EXEMPLOS PRÁTICOS:

**WhatsApp:**
- "Leia as mensagens" → READ_TEXT com selector da área de chat
- "Responda 'Oi'" → TYPE_TEXT no campo de mensagem + CLICK_ELEMENT no botão enviar

**Facebook/Google Ads:**
- "Crie um anúncio" → Sequência de CLICK_ELEMENT, TYPE_TEXT, SCROLL_TO
- "Preencha o formulário" → GET_PAGE_INFO (ver campos) + TYPE_TEXT em cada campo

**Formulários:**
- "Preencha meu nome" → TYPE_TEXT com selector do campo
- "Envie o formulário" → CLICK_ELEMENT no botão submit

## 🎯 COMO RESPONDER:

**SEMPRE:**
1. Confirme que vai fazer (tom confiante)
2. Explique o que vai executar
3. Execute os comandos necessários

**NUNCA:**
- Diga que não tem acesso
- Peça para usuário fazer manualmente
- Seja negativo sobre capacidades

## 💡 SELETORES CSS:
- IDs: \`#myButton\`
- Classes: \`.btn-submit\`
Se o usuário pedir para:
- Ver abas abertas
- Navegar para sites
- Automatizar ações
- Preencher formulários
- Ler conteúdo de páginas

Instrua: "Por favor, clique no ícone da extensão SyncAds AI no navegador (próximo à barra de endereço) e clique em 'Conectar' para eu poder controlar o navegador e fazer essa automação para você."`;

    // Use custom system prompt if available, otherwise use provided one or default + browser status
    const finalSystemPrompt =
      customSystemPrompt || `${systemPrompt || defaultSystemPrompt}${browserExtensionPrompt}`;

    console.log("📝 System Prompt Final Length:", finalSystemPrompt.length);
    console.log("🌐 Browser Extension Status:", extensionConnected ? "CONNECTED ✅" : "OFFLINE ❌");
    console.log("📄 FINAL SYSTEM PROMPT (first 500 chars):", finalSystemPrompt.substring(0, 500));

    // Salvar mensagem do usuário no banco
    const userMsgId = crypto.randomUUID();
    const { error: saveUserError } = await supabase.from("ChatMessage").insert({
      id: userMsgId,
      conversationId,
      role: "USER",
      content: message,
      userId: user.id,
    });

    if (saveUserError) {
      console.error("Erro ao salvar mensagem do usuário:", saveUserError);
    }

    // Build messages array
    const messages = [
      { role: "system", content: finalSystemPrompt },
      ...conversationHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: "user", content: message },
    ];

    // ✅ DETECÇÃO INTELIGENTE DE INTENÇÃO E INTEGRAÇÃO REAL
    let toolResult: string | null = null;
    const lowerMessage = message.toLowerCase();
    let detectedOAuthPlatform: string | null = null;

    // Detectar intenção OAuth
    if (
      lowerMessage.includes("conecte facebook") ||
      lowerMessage.includes("conecte o facebook") ||
      lowerMessage.includes("facebook ads") ||
      lowerMessage.includes("meta ads")
    ) {
      detectedOAuthPlatform = "facebook";
      toolResult = `🔗 OAuth detectado: Facebook Ads\n\nPara conectar o Facebook Ads, o botão de conexão será exibido abaixo.`;
    } else if (
      lowerMessage.includes("conecte google") ||
      lowerMessage.includes("google ads")
    ) {
      detectedOAuthPlatform = "google";
      toolResult = `🔗 OAuth detectado: Google Ads`;
    } else if (lowerMessage.includes("conecte linkedin")) {
      detectedOAuthPlatform = "linkedin";
      toolResult = `🔗 OAuth detectado: LinkedIn Ads`;
    } else if (lowerMessage.includes("conecte tiktok")) {
      detectedOAuthPlatform = "tiktok";
      toolResult = `🔗 OAuth detectado: TikTok Ads`;
    }

    // 🔌 DETECÇÃO AUTOMÁTICA DE INTEGRAÇÕES E-COMMERCE
    const detectEcommerceIntegration = async (
      platform: string,
      tableName: string,
    ) => {
      try {
        const { data: integration, error: integrationError } = await supabase
          .from(tableName)
          .select("*")
          .eq("userId", user.id)
          .eq("isActive", true)
          .single();

        if (integrationError || !integration) {
          return `❌ Você ainda não tem integração com ${platform} ativa.\n\nPara conectar:\n1. Acesse o menu "Integrações"\n2. Configure sua conta ${platform}\n3. Volte aqui e eu poderei consultar seus dados!`;
        }

        const { data: orders, error: ordersError } = await supabase
          .from("Order")
          .select("id, orderNumber, customerName, total, status, createdAt")
          .eq("userId", user.id)
          .order("createdAt", { ascending: false })
          .limit(10);

        if (ordersError) {
          return `❌ Erro ao consultar pedidos: ${ordersError.message}`;
        }

        if (!orders || orders.length === 0) {
          return `📦 Sua conta ${platform} está conectada, mas ainda não há pedidos sincronizados.\n\nQuer que eu sincronize agora?`;
        }

        const totalPedidos = orders.length;
        const pedidosRecentes = orders.slice(0, 5);
        const domainKey = platform === "Shopify" ? "shopDomain" : "domain";
        const domain = integration[domainKey] || platform;

        let resumo = `📊 **${platform}: ${domain}**\n\n`;
        resumo += `✅ Total de pedidos: **${totalPedidos}**\n\n`;
        resumo += `**Últimos 5 pedidos:**\n\n`;

        pedidosRecentes.forEach((order, index) => {
          const data = new Date(order.createdAt).toLocaleDateString("pt-BR");
          const valor = new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(Number(order.total));
          resumo += `${index + 1}. **${order.orderNumber}** - ${order.customerName || "Cliente"} - ${valor} - ${data}\n`;
        });

        return resumo;
      } catch (error: any) {
        console.error(`Erro ao consultar ${platform}:`, error);
        return `❌ Erro ao processar consulta: ${error.message}`;
      }
    };

    // Shopify - Detecção simplificada
    if (
      !toolResult &&
      (lowerMessage.includes("shopify") ||
        lowerMessage.includes("pedidos") ||
        lowerMessage.includes("vendas") ||
        lowerMessage.includes("quanto faturei"))
    ) {
      toolResult = await detectEcommerceIntegration(
        "Shopify",
        "ShopifyIntegration",
      );
    }

    // VTEX
    if (!toolResult && lowerMessage.includes("vtex")) {
      toolResult = await detectEcommerceIntegration("VTEX", "VtexIntegration");
    }

    // WooCommerce
    if (
      !toolResult &&
      (lowerMessage.includes("woocommerce") || lowerMessage.includes("woo"))
    ) {
      toolResult = await detectEcommerceIntegration(
        "WooCommerce",
        "WooCommerceIntegration",
      );
    }

    // Nuvemshop
    if (!toolResult && lowerMessage.includes("nuvemshop")) {
      toolResult = await detectEcommerceIntegration(
        "Nuvemshop",
        "NuvemshopIntegration",
      );
    }

    // Mercado Livre
    if (
      !toolResult &&
      (lowerMessage.includes("mercado livre") ||
        lowerMessage.includes("mercadolivre"))
    ) {
      toolResult = await detectEcommerceIntegration(
        "Mercado Livre",
        "MercadoLivreIntegration",
      );
    }

    // 📊 DETECÇÃO DE MARKETING & ADS
    // Google Ads
    if (
      !toolResult &&
      (lowerMessage.includes("google ads") ||
        lowerMessage.includes("google adwords")) &&
      (lowerMessage.includes("campanha") ||
        lowerMessage.includes("anúncio") ||
        lowerMessage.includes("métrica"))
    ) {
      try {
        const { data: integration } = await supabase
          .from("GoogleAdsIntegration")
          .select("*")
          .eq("userId", user.id)
          .eq("isActive", true)
          .single();

        if (!integration) {
          toolResult = `❌ Google Ads não conectado.\n\nAcesse "Integrações" para conectar!`;
        } else {
          toolResult = `✅ Google Ads conectado! Posso ajudar a criar campanhas, analisar métricas e otimizar anúncios.\n\nO que você gostaria de fazer?`;
        }
      } catch (error) {
        toolResult = `❌ Erro ao verificar Google Ads`;
      }
    }

    // Meta Ads (Facebook/Instagram)
    if (
      !toolResult &&
      (lowerMessage.includes("meta ads") ||
        lowerMessage.includes("facebook ads") ||
        lowerMessage.includes("instagram ads")) &&
      (lowerMessage.includes("campanha") || lowerMessage.includes("anúncio"))
    ) {
      try {
        const { data: integration } = await supabase
          .from("MetaAdsIntegration")
          .select("*")
          .eq("userId", user.id)
          .eq("isActive", true)
          .single();

        if (!integration) {
          toolResult = `❌ Meta Ads não conectado.\n\nAcesse "Integrações" para conectar!`;
        } else {
          toolResult = `✅ Meta Ads conectado! Posso criar anúncios para Facebook e Instagram.\n\nQual rede você quer usar?`;
        }
      } catch (error) {
        toolResult = `❌ Erro ao verificar Meta Ads`;
      }
    }

    // Detectar geração de imagens
    if (
      lowerMessage.includes("cri") &&
      (lowerMessage.includes("imagem") ||
        lowerMessage.includes("foto") ||
        lowerMessage.includes("banner") ||
        lowerMessage.includes("logo"))
    ) {
      let imagePrompt = message;
      const match = message.match(
        /cri[ea]\s+(uma\s+)?(imagem|foto|banner|logo)?\s+(?:de|sobre|uma|um)?\s*(.+)/i,
      );
      if (match && match[match.length - 1]) {
        imagePrompt = match[match.length - 1].trim();
      }

      try {
        const imageUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/generate-image`;
        const imageResponse = await fetch(imageUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
          },
          body: JSON.stringify({
            prompt: imagePrompt,
            size: "1024x1024",
            quality: "standard",
          }),
        });

        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          toolResult =
            `🎨 **Imagem gerada!**\n\n` +
            `![Imagem gerada](${imageData.image?.url || ""})\n\n` +
            `[Ver imagem](${imageData.image?.url})`;
        } else {
          toolResult = `❌ Para gerar imagens, configure a API Key da OpenAI no painel Super Admin.`;
        }
      } catch (error) {
        console.error("Erro ao chamar geração de imagem:", error);
        toolResult = `❌ Erro ao gerar imagem. Configure a API Key no Super Admin.`;
      }
    }

    // Detectar geração de vídeos
    if (
      lowerMessage.includes("cri") &&
      (lowerMessage.includes("vídeo") ||
        lowerMessage.includes("video") ||
        lowerMessage.includes("filme"))
    ) {
      let videoPrompt = message;
      const match = message.match(
        /cri[ea]\s+(um\s+)?(vídeo|video|filme)?\s+(?:de|sobre|um|uma)?\s*(.+)/i,
      );
      if (match && match[match.length - 1]) {
        videoPrompt = match[match.length - 1].trim();
      }

      try {
        const videoUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/generate-video`;
        const videoResponse = await fetch(videoUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
          },
          body: JSON.stringify({
            prompt: videoPrompt,
            duration: 5,
            quality: "standard",
          }),
        });

        if (videoResponse.ok) {
          const videoData = await videoResponse.json();
          toolResult =
            `🎬 **Vídeo gerado!**\n\n` +
            `[Assistir vídeo](${videoData.video?.url})`;
        } else {
          toolResult = `❌ Para gerar vídeos, configure a API Key no painel Super Admin.`;
        }
      } catch (error) {
        console.error("Erro ao chamar geração de vídeo:", error);
        toolResult = `❌ Erro ao gerar vídeo.`;
      }
    }

    // Detectar sistema de dicas
    if (
      lowerMessage.includes("dicas") ||
      lowerMessage.includes("sugestões") ||
      lowerMessage.includes("otimiza") ||
      lowerMessage.includes("melhorias")
    ) {
      console.log("💡 Detectou intenção de pedir dicas");

      try {
        const advisorUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/ai-advisor`;
        const advisorResponse = await fetch(advisorUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
          },
          body: JSON.stringify({
            type: "general",
            context: { userId: user.id },
          }),
        });

        if (advisorResponse.ok) {
          const advisorData = await advisorResponse.json();
          if (advisorData.tips && advisorData.tips.length > 0) {
            const tipsText = advisorData.tips
              .map((tip: any) => {
                const emoji =
                  tip.type === "warning"
                    ? "⚠️"
                    : tip.type === "opportunity"
                      ? "🎯"
                      : tip.type === "improvement"
                        ? "📈"
                        : "💡";
                return `${emoji} **${tip.title}**\n${tip.message}\n\n${tip.action ? `➡️ ${tip.action}` : ""}`;
              })
              .join("\n\n");

            toolResult = `💡 **Dicas e Sugestões Inteligentes:**\n\n${tipsText}\n\n---\n**Total:** ${advisorData.count} dicas (${advisorData.priority.high} alta, ${advisorData.priority.medium} média, ${advisorData.priority.low} baixa prioridade)`;
          } else {
            toolResult =
              "💡 Não há dicas disponíveis no momento. Continue trabalhando!";
          }
        } else {
          toolResult = "💡 Sistema de dicas temporariamente indisponível.";
        }
      } catch (error) {
        console.error("Erro ao chamar ai-advisor:", error);
        toolResult = "💡 Sistema de dicas temporariamente indisponível.";
      }
    }

    // Detectar análise avançada
    if (
      lowerMessage.includes("análise") ||
      lowerMessage.includes("analis") ||
      lowerMessage.includes("analytics") ||
      lowerMessage.includes("relatório")
    ) {
      console.log("📊 Detectou intenção de análise avançada");

      try {
        const analyticsUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/advanced-analytics`;
        const analyticsResponse = await fetch(analyticsUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
          },
          body: JSON.stringify({
            type: "general",
            timeframe: "30d",
          }),
        });

        if (analyticsResponse.ok) {
          const analyticsData = await analyticsResponse.json();
          if (analyticsData.insights && analyticsData.insights.length > 0) {
            const insightsText = analyticsData.insights
              .map((insight: any) => {
                const emoji =
                  insight.type === "trend"
                    ? "📈"
                    : insight.type === "anomaly"
                      ? "⚠️"
                      : insight.type === "prediction"
                        ? "🔮"
                        : "🎯";
                return `${emoji} **${insight.title}**\n${insight.message}`;
              })
              .join("\n\n");

            const metricsText = Object.entries(analyticsData.metrics)
              .map(([key, value]) => `- **${key}:** ${value}`)
              .join("\n");

            toolResult = `📊 **Análise Avançada de Dados:**\n\n${insightsText}\n\n---\n**Métricas:**\n${metricsText}`;
          } else {
            toolResult = "📊 Não há insights disponíveis no momento.";
          }
        } else {
          toolResult = "📊 Sistema de análise temporariamente indisponível.";
        }
      } catch (error) {
        console.error("Erro ao chamar advanced-analytics:", error);
        toolResult = "📊 Sistema de análise temporariamente indisponível.";
      }
    }

    // Detectar geração de conteúdo
    if (
      lowerMessage.includes("conteúdo") ||
      lowerMessage.includes("post") ||
      lowerMessage.includes("anúncio") ||
      lowerMessage.includes("email marketing")
    ) {
      console.log("✍️ Detectou intenção de gerar conteúdo");

      let contentType = "post";
      let topic = message;

      // Detectar tipo de conteúdo
      if (lowerMessage.includes("anúncio") || lowerMessage.includes("ad")) {
        contentType = "ad";
      } else if (lowerMessage.includes("email")) {
        contentType = "email";
      } else if (
        lowerMessage.includes("produto") ||
        lowerMessage.includes("product")
      ) {
        contentType = "product";
      }

      try {
        const contentUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/content-assistant`;
        const contentResponse = await fetch(contentUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
          },
          body: JSON.stringify({
            type: contentType,
            topic: topic,
            platform: "general",
            tone: "professional",
          }),
        });

        if (contentResponse.ok) {
          const contentData = await contentResponse.json();
          toolResult = contentData.content;
        } else {
          toolResult = "✍️ Sistema de conteúdo temporariamente indisponível.";
        }
      } catch (error) {
        console.error("Erro ao chamar content-assistant:", error);
        toolResult = "✍️ Sistema de conteúdo temporariamente indisponível.";
      }
    }

    // Detectar automações
    if (
      lowerMessage.includes("automação") ||
      lowerMessage.includes("workflow") ||
      lowerMessage.includes("automatizar")
    ) {
      try {
        const automationUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/automation-engine`;
        const automationResponse = await fetch(automationUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
          },
          body: JSON.stringify({
            action: "suggest",
          }),
        });

        if (automationResponse.ok) {
          const automationData = await automationResponse.json();
          if (
            automationData.suggestions &&
            automationData.suggestions.length > 0
          ) {
            const suggestionsText = automationData.suggestions
              .map((s: any) => {
                const emoji =
                  s.priority === "high"
                    ? "🔴"
                    : s.priority === "medium"
                      ? "🟡"
                      : "🟢";
                return `${emoji} **${s.title}**\n${s.description}\n${s.action ? `➡️ Ação: ${s.action}` : ""}`;
              })
              .join("\n\n");

            toolResult = `🤖 **Automações Sugeridas:**\n\n${suggestionsText}\n\n---\n**Total:** ${automationData.count} sugestões`;
          } else {
            toolResult = "🤖 Não há automações sugeridas no momento.";
          }
        } else {
          toolResult = "🤖 Sistema de automações temporariamente indisponível.";
        }
      } catch (error) {
        console.error("Erro ao chamar automation-engine:", error);
        toolResult = "🤖 Sistema de automações temporariamente indisponível.";
      }
    }

    // Detectar intenções e chamar ferramentas apropriadas
    if (
      lowerMessage.includes("pesquis") ||
      lowerMessage.includes("busca") ||
      lowerMessage.includes("google") ||
      lowerMessage.includes("internet") ||
      lowerMessage.includes("pesquise sobre")
    ) {
      // Extrair query de pesquisa
      let searchQuery = message;
      if (lowerMessage.includes("pesquis")) {
        const match = message.match(/pesquis[ae]\s+(.+)/i);
        searchQuery = match ? match[1] : message;
      } else if (lowerMessage.includes("busca")) {
        const match = message.match(/busca?\s+(.+)/i);
        searchQuery = match ? match[1] : message;
      }

      try {
        const searchUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/ai-tools`;
        const searchResponse = await fetch(searchUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
          },
          body: JSON.stringify({
            toolName: "web_search",
            parameters: { query: searchQuery },
            userId: user.id,
            conversationId,
          }),
        });

        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          toolResult = `🔍 **Resultados da pesquisa:**\n\n${JSON.stringify(searchData, null, 2)}`;
        } else {
          toolResult = `🔍 Detectada intenção de pesquisar: "${searchQuery}"\n\n(Pesquisa ainda não totalmente implementada)`;
        }
      } catch (error) {
        console.error("Erro ao chamar web search:", error);
        toolResult = `🔍 Detectada intenção de pesquisar: "${searchQuery}"`;
      }
    }

    // Detectar scraping de produtos
    if (
      lowerMessage.includes("baix") ||
      lowerMessage.includes("rasp") ||
      lowerMessage.includes("scrape")
    ) {
      // Extrair URL
      const urlMatch = message.match(/https?:\/\/[^\s]+/i);
      const url = urlMatch ? urlMatch[0] : null;

      if (url) {
        // Chamar função de scraping
        try {
          const scrapeUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/super-ai-tools`;
          const scrapeResponse = await fetch(scrapeUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: authHeader,
            },
            body: JSON.stringify({
              toolName: "scrape_products",
              parameters: { url },
              userId: user.id,
              conversationId,
            }),
          });

          if (scrapeResponse.ok) {
            const scrapeData = await scrapeResponse.json();
            toolResult = `📊 Dados extraídos de ${url}:\n\n${JSON.stringify(scrapeData, null, 2)}`;
          } else {
            toolResult = `❌ Não foi possível extrair dados deste site no momento.`;
          }
        } catch (error) {
          console.error("Erro ao chamar scraping:", error);
          toolResult = `❌ Erro ao processar o site.`;
        }
      } else {
        toolResult = `Por favor, me envie a URL do site que você quer extrair dados.`;
      }
    }

    // 🧹 Função para limpar mensagens técnicas da resposta
    const cleanTechnicalMessages = (text: string): string => {
      return (
        text
          // Remover mensagens de status técnico
          .replace(/\*\*Gerando imagem\.\.\.\*\*/gi, "")
          .replace(/\*\*Scraping solicitado\*\*/gi, "")
          .replace(/\*\*Observação:\*\*/gi, "")
          .replace(/\.\.\. \(Aguarde um momento\)/gi, "")
          // Remover blocos de "Como estou em ambiente de texto"
          .replace(
            /\*\*Observação:\*\* Como estou em um ambiente de texto.*?aqui\./gis,
            "",
          )
          // Remover linhas vazias múltiplas
          .replace(/\n{3,}/g, "\n\n")
          // Remover espaços no início e fim
          .trim()
      );
    };

    // Detectar Python
    if (
      lowerMessage.includes("python") ||
      lowerMessage.includes("calcule") ||
      lowerMessage.includes("execute código") ||
      lowerMessage.includes("processar dados") ||
      lowerMessage.includes("execute código")
    ) {
      // Extrair código Python do texto ou usar código padrão
      let pythonCode = "";
      const codeMatch = message.match(/```python\s*([\s\S]*?)```/i);
      if (codeMatch) {
        pythonCode = codeMatch[1];
      } else if (lowerMessage.includes("calcule")) {
        // Extrair números e operação
        const calcMatch = message.match(/calcule\s+([\d+\-*/().\s]+)/i);
        if (calcMatch) {
          pythonCode = `result = ${calcMatch[1]}\nprint(result)`;
        }
      } else {
        pythonCode = 'print("Código Python será executado aqui")';
      }

      try {
        console.log(
          "🐍 Chamando Python execution para:",
          pythonCode.substring(0, 50),
        );
        const pythonUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/super-ai-tools`;
        const pythonResponse = await fetch(pythonUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
          },
          body: JSON.stringify({
            toolName: "python_executor",
            parameters: {
              code: pythonCode,
              libraries: ["pandas", "numpy", "requests"],
            },
            userId: user.id,
            conversationId,
          }),
        });

        if (pythonResponse.ok) {
          const pythonData = await pythonResponse.json();
          toolResult =
            `🐍 **Python Executado:**\n\n` +
            `Código: \`\`\`python\n${pythonCode}\n\`\`\`\n\n` +
            `Resultado: ${JSON.stringify(pythonData, null, 2)}`;
        } else {
          toolResult =
            `🐍 **Execução Python solicitada**\n\n` +
            `Detectei intenção de executar código Python.\n` +
            `Por favor, envie o código que deseja executar.`;
        }
      } catch (error) {
        console.error("Erro ao chamar Python:", error);
        toolResult =
          `🐍 **Execução Python detectada**\n\n` +
          `Pretendo executar: ${pythonCode.substring(0, 100)}...`;
      }
    }

    // ==================== TOOL CALLING PARA GROQ ====================
    // ✅ ÚNICA FERRAMENTA PERMITIDA: web_scraping
    const groqTools = [
      {
        type: "function",
        function: {
          name: "web_scraping",
          description:
            "Extrai dados de produtos de um site. Use APENAS esta ferramenta para raspar/baixar/importar dados de URLs. NUNCA tente executar código Python diretamente.",
          parameters: {
            type: "object",
            properties: {
              url: {
                type: "string",
                description:
                  "URL completa do site para raspar (ex: https://www.exemplo.com/produtos)",
              },
              format: {
                type: "string",
                enum: ["csv", "json", "text"],
                description: "Formato de saída desejado",
              },
            },
            required: ["url"],
            additionalProperties: false, // ✅ CRÍTICO: GROQ exige isso!
          },
        },
      },
    ];

    // Call appropriate AI provider
    let response: string;
    let tokensUsed = 0;

    // OpenAI-compatible providers (OpenAI, OpenRouter, Groq, Together, Fireworks, Mistral, Perplexity)
    const openaiCompatibleProviders = [
      "OPENAI",
      "OPENROUTER",
      "GROQ",
      "TOGETHER",
      "FIREWORKS",
      "MISTRAL",
      "PERPLEXITY",
    ];

    if (openaiCompatibleProviders.includes(aiConnection.provider)) {
      // Determine base URL
      const baseUrl = aiConnection.baseUrl || "https://api.openai.com/v1";
      const endpoint = `${baseUrl}/chat/completions`;

      // Determine headers based on provider
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (aiConnection.provider === "OPENROUTER") {
        headers["Authorization"] = `Bearer ${aiConnection.apiKey}`;
        headers["HTTP-Referer"] = "https://syncads.com";
        headers["X-Title"] = "SyncAds";
      } else {
        headers["Authorization"] = `Bearer ${aiConnection.apiKey}`;
      }

      // ✅ GROQ: Usar tool calling NATIVO
      const requestBody: any = {
        model: aiConnection.model || "gpt-4-turbo",
        messages: messages,
        temperature: aiConnection.temperature || 0.7,
        max_tokens: aiConnection.maxTokens || 4096,
      };

      // ✅ Se for GROQ, adicionar ferramentas
      if (aiConnection.provider === "GROQ") {
        requestBody.tools = groqTools;
        // ✅ FORÇAR uso da ferramenta web_scraping quando detectar intenção
        const lowerMsg = message.toLowerCase();
        if (
          lowerMsg.includes("rasp") ||
          lowerMsg.includes("baix") ||
          lowerMsg.includes("importar") ||
          lowerMsg.includes("extrair")
        ) {
          requestBody.tool_choice = {
            type: "function",
            function: { name: "web_scraping" },
          };
          console.log("🛠️  [GROQ] Tool calling FORÇADO para web_scraping");
        } else {
          requestBody.tool_choice = "auto";
          console.log("🛠️  [GROQ] Tool calling AUTO (modelo decide)");
        }
      }

      const openaiResponse = await fetch(endpoint, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(requestBody),
      });

      if (!openaiResponse.ok) {
        const error = await openaiResponse.text();
        throw new Error(`${aiConnection.provider} API error: ${error}`);
      }

      const data = await openaiResponse.json();
      const assistantMessage = data.choices[0].message;

      // ✅ PROCESSAR TOOL CALLS SE GROQ SOLICITOU
      if (aiConnection.provider === "GROQ" && assistantMessage.tool_calls) {
        console.log(
          `🛠️  [GROQ] Modelo solicitou ${assistantMessage.tool_calls.length} ferramenta(s)`,
        );

        for (const toolCall of assistantMessage.tool_calls) {
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments);

          console.log(
            `🔧 [TOOL] Nome da ferramenta solicitada: "${functionName}"`,
          );
          console.log(
            `📋 [TOOL] Argumentos recebidos:`,
            JSON.stringify(functionArgs, null, 2),
          );

          // ✅ PROTEÇÃO: Apenas web_scraping é permitida
          if (functionName !== "web_scraping") {
            console.error(
              `❌ [TOOL] FERRAMENTA INVÁLIDA: "${functionName}" não é permitida!`,
            );
            console.error(
              `⚠️  [TOOL] Ferramentas permitidas: ["web_scraping"]`,
            );
            toolResult = `❌ Erro: A ferramenta "${functionName}" não está disponível. Use apenas "web_scraping" para extrair dados de sites.`;
            continue; // Pula esta ferramenta inválida
          }

          // ✅ Executar web_scraping
          if (functionName === "web_scraping") {
            const url = functionArgs.url;
            const format = functionArgs.format || "csv";

            console.log(`🕷️  [WEB_SCRAPING] Iniciando scraping`);
            console.log(`📍 [WEB_SCRAPING] URL: ${url}`);
            console.log(`📄 [WEB_SCRAPING] Formato: ${format}`);

            try {
              const scrapeResponse = await fetch(
                `${Deno.env.get("SUPABASE_URL")}/functions/v1/web-scraper`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: authHeader, // ✅ FIX: Usar token do usuário autenticado
                  },
                  body: JSON.stringify({ url }),
                },
              );

              console.log(
                `📡 [WEB_SCRAPING] Status da resposta: ${scrapeResponse.status}`,
              );

              if (!scrapeResponse.ok) {
                const error = await scrapeResponse.text();
                console.error(`❌ [WEB_SCRAPING] Erro na API:`, error);
                toolResult = `Erro ao raspar o site: ${error}`;
              } else {
                const scrapeData = await scrapeResponse.json();
                const products = scrapeData.products || [];

                console.log(
                  `✅ [WEB_SCRAPING] Produtos raspados: ${products.length}`,
                );

                if (products.length > 0) {
                  const headers = Object.keys(products[0]).join(",");
                  const rows = products
                    .map((p: any) => Object.values(p).join(","))
                    .join("\n");
                  const csv = `${headers}\n${rows}`;

                  console.log(
                    `📊 [WEB_SCRAPING] CSV gerado com ${csv.length} caracteres`,
                  );

                  toolResult = `✅ Raspagem concluída! ${products.length} produtos encontrados.\n\n📄 CSV:\n\`\`\`csv\n${csv.substring(0, 500)}...\n\`\`\`\n\nTotal de ${products.length} produtos!`;
                } else {
                  console.warn(`⚠️  [WEB_SCRAPING] Nenhum produto encontrado`);
                  toolResult = "Nenhum produto encontrado no site.";
                }
              }
            } catch (error: any) {
              console.error(
                "❌ [WEB_SCRAPING] Exceção capturada:",
                error.message,
              );
              console.error("❌ [WEB_SCRAPING] Stack:", error.stack);
              toolResult = `Erro ao executar scraping: ${error.message}`;
            }
          }
        }

        // ✅ ENVIAR RESULTADO DE VOLTA AO GROQ
        const messagesWithTools = [
          ...messages,
          assistantMessage,
          {
            role: "tool",
            tool_call_id: assistantMessage.tool_calls[0].id,
            name: assistantMessage.tool_calls[0].function.name,
            content: toolResult || "Ferramenta executada",
          },
        ];

        console.log(
          "🔄 [GROQ] Enviando resultados das ferramentas de volta...",
        );

        // ✅ Retry automático para rate limit
        let finalResponse: Response | null = null;
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries) {
          finalResponse = await fetch(endpoint, {
            method: "POST",
            headers: headers,
            body: JSON.stringify({
              model: aiConnection.model || "llama-3.3-70b-versatile",
              messages: messagesWithTools,
              temperature: aiConnection.temperature || 0.7,
              max_tokens: aiConnection.maxTokens || 4096,
              tools: [], // ✅ Desabilitar ferramentas na segunda chamada
              tool_choice: "none", // ✅ Explicitamente não usar ferramentas
            }),
          });

          if (finalResponse.ok) {
            break; // Sucesso!
          }

          // Verificar se é rate limit
          const errorText = await finalResponse.text();
          if (
            finalResponse.status === 429 ||
            errorText.includes("rate_limit")
          ) {
            retryCount++;
            const waitTime = Math.pow(2, retryCount) * 1000; // Exponential backoff: 2s, 4s, 8s
            console.log(
              `⏳ [GROQ] Rate limit atingido. Retry ${retryCount}/${maxRetries} em ${waitTime / 1000}s...`,
            );

            if (retryCount < maxRetries) {
              await new Promise((resolve) => setTimeout(resolve, waitTime));
              continue;
            }
          }

          // Outro tipo de erro
          throw new Error(`GROQ final API error: ${errorText}`);
        }

        if (!finalResponse || !finalResponse.ok) {
          throw new Error("GROQ final API error: Max retries exceeded");
        }

        const finalData = await finalResponse.json();
        response = finalData.choices[0].message.content;
        tokensUsed =
          (data.usage?.total_tokens || 0) +
          (finalData.usage?.total_tokens || 0);

        console.log("✅ [GROQ] Resposta final gerada com tool calling");
      } else {
        // Resposta normal sem tool calling
        response = assistantMessage.content || data.choices[0].message.content;
        tokensUsed = data.usage?.total_tokens || 0;
      }
    } else if (aiConnection.provider === "ANTHROPIC") {
      const anthropicResponse = await fetch(
        "https://api.anthropic.com/v1/messages",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": aiConnection.apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: aiConnection.model || "claude-3-opus-20240229",
            max_tokens: aiConnection.maxTokens || 4096,
            temperature: aiConnection.temperature || 0.7,
            messages: messages.filter((m) => m.role !== "system"),
            system: finalSystemPrompt,
          }),
        },
      );

      if (!anthropicResponse.ok) {
        const error = await anthropicResponse.text();
        throw new Error(`Anthropic API error: ${error}`);
      }

      const data = await anthropicResponse.json();
      response = data.content[0].text;
      tokensUsed = data.usage.input_tokens + data.usage.output_tokens;
    } else if (aiConnection.provider === "GOOGLE") {
      const googleResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${aiConnection.model || "gemini-pro"}:generateContent?key=${aiConnection.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: messages
              .filter((m) => m.role !== "system")
              .map((m) => ({
                role: m.role === "assistant" ? "model" : "user",
                parts: [{ text: m.content }],
              })),
            generationConfig: {
              temperature: aiConnection.temperature || 0.7,
              maxOutputTokens: aiConnection.maxTokens || 4096,
            },
          }),
        },
      );

      if (!googleResponse.ok) {
        const error = await googleResponse.text();
        throw new Error(`Google API error: ${error}`);
      }

      const data = await googleResponse.json();
      response = data.candidates[0].content.parts[0].text;
      tokensUsed = data.usageMetadata.totalTokenCount || 0;
    } else if (aiConnection.provider === "COHERE") {
      // Convert messages to Cohere format
      const chatHistory = messages.slice(1, -1).map((m) => ({
        role: m.role === "assistant" ? "CHATBOT" : "USER",
        message: m.content,
      }));

      const cohereResponse = await fetch("https://api.cohere.ai/v1/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${aiConnection.apiKey}`,
        },
        body: JSON.stringify({
          model: aiConnection.model || "command-r-plus",
          message: message,
          chat_history: chatHistory,
          preamble: finalSystemPrompt,
          temperature: aiConnection.temperature || 0.7,
          max_tokens: aiConnection.maxTokens || 4096,
        }),
      });

      if (!cohereResponse.ok) {
        const error = await cohereResponse.text();
        throw new Error(`Cohere API error: ${error}`);
      }

      const data = await cohereResponse.json();
      response = data.text;
      tokensUsed =
        (data.meta?.tokens?.input_tokens || 0) +
        (data.meta?.tokens?.output_tokens || 0);
    } else {
      throw new Error(`Unsupported AI provider: ${aiConnection.provider}`);
    }

    // Adicionar resultado de ferramenta se houver
    if (toolResult) {
      response = `${toolResult}\n\n${response}`;
    }

    // 🧹 Limpar mensagens técnicas da resposta final
    response = cleanTechnicalMessages(response);

    // ============================================
    // 🤖 DETECTAR E EXECUTAR COMANDOS DA EXTENSÃO
    // ============================================
    let cleanResponse = response;

    // Detectar blocos JSON de comando (```json { "type": "..." } ```)
    const jsonCommandRegex = /```json\s*(\{[\s\S]*?\})\s*```/g;
    const jsonMatches = [...response.matchAll(jsonCommandRegex)];

    if (jsonMatches.length > 0 && extensionConnected) {
      console.log(`🎯 Detectados ${jsonMatches.length} comandos JSON na resposta`);

      for (const match of jsonMatches) {
        try {
          const jsonStr = match[1];
          const command = JSON.parse(jsonStr);

          // Verificar se é um comando válido
          if (command.type) {
            console.log('✅ Comando válido detectado:', command);

            // Buscar device_id do usuário
            const { data: devices } = await supabase
              .from('extension_devices')
              .select('device_id')
              .eq('user_id', user.id)
              .eq('status', 'online')
              .order('last_seen', { ascending: false })
              .limit(1);

            if (devices && devices.length > 0) {
              const deviceId = devices[0].device_id;

              // Salvar comando no banco para a extensão executar
              const { data: savedCommand, error: cmdError } = await supabase
                .from('ExtensionCommand')
                .insert({
                  deviceId,
                  userId: user.id,
                  command: command.type,
                  params: command.data || {},
                  status: 'PENDING',
                  conversationId,
                })
                .select()
                .single();

              if (!cmdError && savedCommand) {
                console.log('✅ Comando salvo no banco:', savedCommand.id);

                // Remover o bloco JSON da resposta para não mostrar ao usuário
                cleanResponse = cleanResponse.replace(match[0], '');

                // Adicionar mensagem de feedback
                cleanResponse = cleanResponse.trim() + `\n\n_✨ Executando ação..._`;
              } else {
                console.error('❌ Erro ao salvar comando:', cmdError);
              }
            } else {
              console.warn('⚠️ Nenhum dispositivo online encontrado para o usuário');
              cleanResponse = cleanResponse.replace(match[0], '\n\n_⚠️ Extensão offline. Por favor, conecte a extensão do navegador._');
            }
          }
        } catch (parseError) {
          console.error('❌ Erro ao processar comando JSON:', parseError);
        }
      }

      response = cleanResponse.trim();
    }

    // Salvar resposta da IA no banco
    const assistantMsgId = crypto.randomUUID();
    const { error: saveAssistantError } = await supabase
      .from("ChatMessage")
      .insert({
        id: assistantMsgId,
        conversationId,
        role: "ASSISTANT",
        content: response,
        userId: user.id,
      });

    if (saveAssistantError) {
      console.error("Erro ao salvar mensagem da IA:", saveAssistantError);
    }

    // Atualizar updatedAt da conversa
    await supabase
      .from("ChatConversation")
      .update({ updatedAt: new Date().toISOString() })
      .eq("id", conversationId);

    // Track AI usage (async, don't wait) - Sistema simplificado sem organizações
    supabase.from("AiUsage").upsert(
      {
        userId: user.id,
        globalAiConnectionId: aiConnection.id,
        messageCount: 1,
        tokensUsed: tokensUsed,
        month: new Date().toISOString().substring(0, 7), // YYYY-MM
        cost: (tokensUsed / 1000) * 0.01, // Estimate: $0.01 per 1K tokens
      },
      {
        onConflict: "userId,globalAiConnectionId,month",
      },
    );

    return new Response(
      JSON.stringify({
        response,
        tokensUsed,
        provider: aiConnection.provider,
        model: aiConnection.model,
        userMessageId: userMsgId,
        aiMessageId: assistantMsgId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
        message:
          "Erro ao processar mensagem. Verifique se a IA está configurada corretamente.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
