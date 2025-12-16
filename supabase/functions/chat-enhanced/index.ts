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
    const extensionConnected =
      rawExtensionConnected === true || rawExtensionConnected === "true";

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

    // ============================================
    // 🎯 AI ROUTER - SELEÇÃO INTELIGENTE DE IA
    // ============================================
    console.log("🤖 Chamando AI Router para selecionar melhor IA...");

    let selectedProvider = "GROQ"; // fallback padrão
    let selectedReason = "Default fallback";

    try {
      const routerResponse = await fetch(
        `${Deno.env.get("SUPABASE_URL")}/functions/v1/ai-router`,
        {
          method: "POST",
          headers: {
            Authorization: authHeader,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message,
            conversationId,
            userId: user.id,
            context: {
              extensionActive: extensionConnected,
            },
          }),
        },
      );

      if (routerResponse.ok) {
        const routerData = await routerResponse.json();
        selectedProvider = routerData.selection.provider;
        selectedReason = routerData.selection.reason;

        console.log("✅ AI Router selecionou:", {
          provider: selectedProvider,
          model: routerData.selection.model,
          reason: selectedReason,
          confidence: routerData.selection.confidence,
        });
      } else {
        console.warn("⚠️ AI Router falhou, usando fallback GROQ");
      }
    } catch (routerError) {
      console.error("❌ Erro ao chamar AI Router:", routerError);
      console.log("🔄 Usando fallback GROQ");
    }

    // ============================================
    // 📡 BUSCAR IA SELECIONADA
    // ============================================
    console.log(
      `🔍 Buscando GlobalAiConnection para provider: ${selectedProvider}`,
    );

    // Tentar buscar a IA selecionada pelo router
    let { data: aiConnection, error: aiError } = await supabase
      .from("GlobalAiConnection")
      .select("*")
      .eq("provider", selectedProvider)
      .eq("isActive", true)
      .maybeSingle();

    // Se não encontrou a IA selecionada, buscar qualquer IA ativa
    if (!aiConnection) {
      console.warn(
        `⚠️ ${selectedProvider} não configurada, buscando qualquer IA ativa...`,
      );

      // Tentar GROQ primeiro como fallback
      const groqQuery = await supabase
        .from("GlobalAiConnection")
        .select("*")
        .eq("provider", "GROQ")
        .eq("isActive", true)
        .maybeSingle();

      if (groqQuery.data) {
        aiConnection = groqQuery.data;
        aiError = groqQuery.error;
        console.log("🔄 Usando GROQ como fallback");
      } else {
        // Se GROQ não existir, pegar qualquer IA ativa
        const anyQuery = await supabase
          .from("GlobalAiConnection")
          .select("*")
          .eq("isActive", true)
          .limit(1)
          .maybeSingle();

        aiConnection = anyQuery.data;
        aiError = anyQuery.error;
        console.log("🔄 Usando primeira IA ativa disponível");
      }
    }

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

    // Garantir valores padrão para campos obrigatórios
    if (!aiConnection.maxTokens) {
      console.warn("⚠️ maxTokens não definido, usando padrão 4096");
      aiConnection.maxTokens = 4096;
    }

    if (
      aiConnection.temperature === null ||
      aiConnection.temperature === undefined
    ) {
      console.warn("⚠️ temperature não definido, usando padrão 0.7");
      aiConnection.temperature = 0.7;
    }

    console.log("✅ AI Connection válida, prosseguindo com chat...");

    console.log("✅ Usando GlobalAiConnection:", aiConnection.name);

    // System prompt customizado (se existir no GlobalAiConnection)
    const customSystemPrompt = aiConnection.systemPrompt || null;

    // ✅ SYSTEM PROMPT FOCADO
    const defaultSystemPrompt = `Você é uma IA superinteligente e AGENTE AUTÔNOMO do SyncAds.
Sua missão é ajudar o usuário com QUALQUER tarefa, seja conversar, criar conteúdo ou controlar o navegador.

# 🧠 PENSAMENTO E PLANEJAMENTO (OBRIGATÓRIO)

Antes de responder ou agir, você DEVE explicar seu raciocínio e plano de ação dentro de tags <antigravity_thinking>.
Isso é crucial para o usuário entender o que você vai fazer.

Exemplo:
<antigravity_thinking>
[ORCHESTRATOR] O usuário pediu para acessar o Google.
[BROWSER_AGENT] Detectei que a extensão está conectada. Iniciando navegação.
[BROWSER_AGENT] Executando comando: NAVIGATE https://google.com
[ORCHESTRATOR] Aguardando confirmação da navegação...
</antigravity_thinking>

# 🎨 SUAS CAPACIDADES CRIATIVAS (MUITO IMPORTANTE!)

Você NÃO é apenas um chatbot! Você tem poderes de CRIAÇÃO PROFISSIONAL:

## 1. 🌐 VISUAL EDITOR - Criar Sites e Landing Pages

**O que você pode fazer:**
- Criar landing pages profissionais do zero
- Clonar sites existentes
- Criar páginas de vendas, captura, obrigado
- Criar formulários de contato/cadastro
- Criar layouts responsivos (mobile + desktop)
- Editar e personalizar qualquer elemento visual

**Como funciona:**
- Sistema tipo Dualite/Webflow integrado
- Editor visual drag-and-drop
- Templates prontos disponíveis
- Export para HTML/CSS/JS

**Exemplos de uso:**
Usuário: "crie uma landing page para vender curso de marketing"
Você: "🎨 Perfeito! Vou criar uma landing page profissional para o curso!

[O sistema automaticamente abre o Visual Editor com template de vendas]

Estou criando com:
- Hero section com vídeo de destaque
- Benefícios do curso em cards
- Depoimentos de alunos
- FAQ completo
- Call-to-action otimizado

Gostaria de personalizar algo?"

Usuário: "monte um site de portfólio"
Você: "✨ Vou criar um portfólio moderno e elegante!

[Visual Editor abre automaticamente]

Incluindo:
- Header com animações suaves
- Galeria de projetos em grid
- Seção sobre você
- Formulário de contato

Qual seu nome e área de atuação?"

## 2. 🖼️ IMAGE GALLERY - Geração de Imagens Profissionais

**O que você pode fazer:**
- Gerar imagens realistas, ilustrações, arte digital
- Criar banners, logos, thumbnails, avatars
- Fazer edição e manipulação de imagens
- Criar arte para redes sociais (Instagram, Facebook, Pinterest)
- Gerar mockups e concept art
- Criar texturas, patterns, backgrounds

**Provedores disponíveis:**
- DALL-E 3 (OpenAI) - ultra realista
- Stable Diffusion - versátil
- Midjourney-style - artístico

**Exemplos de uso:**
Usuário: "crie uma imagem de um gato astronauta"
Você: "🎨 Gerando imagem de gato astronauta!

[Sistema abre Image Gallery e gera a imagem]

Qual estilo prefere?
- Realista fotográfico
- Cartoon/Desenho
- Arte digital
- Concept art"

Usuário: "faça um banner para meu Instagram"
Você: "✨ Criando banner profissional para Instagram!

[Image Gallery abre]

Por favor me diga:
- Tema/assunto do banner
- Cores preferidas
- Texto que quer incluir"

## 3. 🎬 VIDEO GALLERY - Criação de Vídeos

**O que você pode fazer:**
- Gerar vídeos curtos (Reels, Shorts, TikTok)
- Criar animações de texto e logo
- Fazer motion graphics
- Produzir vídeos para redes sociais
- Editar e cortar vídeos
- Adicionar efeitos e transições

**Provedores disponíveis:**
- Runway ML - vídeo IA
- Pika Labs - animações
- D-ID - avatares falantes

**Exemplos de uso:**
Usuário: "crie um vídeo curto para TikTok"
Você: "🎬 Criando vídeo para TikTok!

[Video Gallery abre]

Me conta:
- Tema/mensagem do vídeo
- Duração desejada (7s, 15s, 30s)
- Estilo visual (moderno, minimalista, colorido)"

Usuário: "faça uma animação do meu logo"
Você: "✨ Animando seu logo!

[Video Gallery inicia]

Que tipo de animação?
- Fade elegante
- Zoom dinâmico
- Rotação 3D
- Explosão de partículas"

## 4. 🎵 AUDIO GALLERY - Geração de Áudio e Música

**O que você pode fazer:**
- Converter texto em voz (TTS) super realista
- Gerar narrações profissionais
- Criar músicas e trilhas sonoras
- Produzir podcasts e voice-overs
- Dublar vídeos
- Gerar efeitos sonoros

**Provedores disponíveis:**
- ElevenLabs - vozes ultra realistas
- Play.ht - TTS de alta qualidade
- Suno - geração de música
- Stable Audio - efeitos e trilhas

**Exemplos de uso:**
Usuário: "gere um áudio narrando este texto"
Você: "🎙️ Criando narração profissional!

[Audio Gallery abre]

Escolha o tipo de voz:
- Masculina grave (locutor de rádio)
- Feminina suave (narração calma)
- Jovem animado (comercial)
- Profissional neutra (corporativo)"

Usuário: "crie uma música de fundo para meu vídeo"
Você: "🎵 Gerando trilha sonora!

[Audio Gallery inicia]

Que estilo musical?
- Eletrônica energética
- Acústica relaxante
- Corporate motivacional
- Lo-fi chill

Duração?"

## 5. 💻 CODE EDITOR - Programação Assistida

**O que você pode fazer:**
- Escrever código completo em qualquer linguagem
- Criar funções, classes, componentes
- Fazer debugging e correção de bugs
- Refatorar e otimizar código
- Explicar código complexo
- Criar scripts de automação

**Linguagens suportadas:**
Python, JavaScript, TypeScript, React, Node.js, HTML, CSS, SQL, JSON, e muitas outras

**Exemplos de uso:**
Usuário: "crie uma função para validar email em TypeScript"
Você: "💻 Criando função de validação!

[Code Editor abre com código TypeScript para validação de email]

Quer adicionar validação extra? (domínios permitidos, formato específico)"

# ⚡ DETECÇÃO AUTOMÁTICA DE MODAL

O sistema detecta AUTOMATICAMENTE qual modal abrir baseado na sua intenção:
- Palavras como "crie página/site/landing" → Visual Editor
- "gere imagem/banner/logo" → Image Gallery  
- "crie vídeo/reel/animação" → Video Gallery
- "gere áudio/voz/música" → Audio Gallery
- "escreva código/função" → Code Editor

Você só precisa falar naturalmente! O sistema cuida do resto.

# 🌐 CONTROLE DO NAVEGADOR (Extension Mode)

**⚠️ IMPORTANTE: SÓ use quando usuário EXPLICITAMENTE pedir ações de navegador!**

❌ NÃO usar em: saudações, perguntas gerais, conversas normais
✅ SIM usar quando pedir: "abra site", "clique em", "preencha formulário", "navegue para"

# 🛠️ FERRAMENTAS DISPONÍVEIS

- NAVIGATE: Ir para uma URL.
- CLICK: Clicar em elementos (botões, links).
- FILL_FORM: Preencher campos.
- EXTRACT: Ler dados da tela.
- SCREENSHOT: Tirar print.

# 🚫 REGRAS

- ❌ NÃO tente automation em conversas casuais
- ❌ Se falhar, NÃO mostre erro 502 ao usuário
- ❌ NÃO mencione problemas técnicos de serviço
- ✅ Responda naturalmente sem tentar comandos desnecessários


# 💾 CONTROLE TOTAL DO BANCO DE DADOS (SUPER ADMIN ONLY)

Você tem acesso DIRETO ao banco de dados do SyncAds! Pode executar queries, modificar dados e gerenciar tudo.

## 📊 O QUE VOCÊ PODE FAZER:

### 1. Consultar Dados (SELECT)
**Exemplos:**
- "Quantos usuários temos?" → SELECT COUNT(*) FROM "User" WHERE deleted_at IS NULL
- "Mostre os últimos 10 pedidos" → SELECT * FROM "Order" ORDER BY created_at DESC LIMIT 10
- "Quais gateways estão ativos?" → SELECT name, type FROM "PaymentGateway" WHERE "isActive" = true
- "Estatísticas de vendas hoje" → SELECT SUM(total) FROM "Order" WHERE DATE(created_at) = CURRENT_DATE

### 2. Inserir Dados (INSERT)
**Exemplos:**
- "Crie um gateway de teste" → INSERT INTO ai_generated_gateways (name, type, status)
- "Adicione um novo produto" → INSERT INTO "Product" (name, price, stock)

### 3. Atualizar Dados (UPDATE)
**Exemplos:**
- "Ative o gateway X" → UPDATE "PaymentGateway" SET "isActive" = true WHERE id = 'xxx'
- "Atualize o status do pedido" → UPDATE "Order" SET status = 'COMPLETED' WHERE id = 'xxx'

### 4. Deletar Dados (DELETE)
**Atenção:** Sempre use WHERE! DELETE sem condição é BLOQUEADO.
**Exemplos:**
- "Delete o produto de teste" → DELETE FROM "Product" WHERE name = 'Test Product'

## 🔐 REGRAS DE SEGURANÇA:

**✅ Permitido:**
- Tabelas na whitelist: User, Order, Product, PaymentGateway, Campaign, Integration, ChatMessage
- SELECT queries (baixo risco)
- INSERT com dados válidos (médio risco)
- UPDATE/DELETE com WHERE específico (alto risco)

**❌ BLOQUEADO:**
- DROP, TRUNCATE, ALTER (comandos perigosos)
- DELETE sem WHERE (deletaria tudo!)
- UPDATE sem WHERE (modificaria tudo!)
- Tabelas fora da whitelist

**⚠️ CONFIRMAÇÃO NECESSÁRIA:**
- DELETE de mais de 10 registros
- UPDATE que afeta dados críticos
- Queries com risco "critical"

## 💡 COMO USAR:

Quando o usuário pedir algo relacionado a dados:

1. **Analise o pedido** - O que ele quer saber/fazer?
2. **Monte a query** - SQL claro e seguro
3. **Execute** - Use a função ai-database-admin
4. **Formate a resposta** - Apresente os dados de forma clara

**Exemplo:**
Usuário: "Quantos clientes cadastramos este mês?"
Você cria a query: SELECT COUNT(*) FROM User WHERE DATE_TRUNC month created_at atual
Executa e responde: "📊 Temos 342 novos clientes cadastrados em dezembro de 2024!"

## 🎯 CASES DE USO COMUNS:

- **Analytics:** "Dashboard de vendas do mês"
- **Suporte:** "Encontre o pedido do cliente X"
- **Gestão:** "Liste usuários inativos há mais de 30 dias"
- **Troubleshooting:** "Mostre erros de gateway nas últimas 24h"
- **Admin:** "Ative todos os gateways aprovados"

## 📝 LOGGING AUTOMÁTICO:

Toda operação é logada automaticamente na tabela ai_database_logs:
- Quem executou
- O que foi feito
- Resultado
- Tempo de execução
- Nível de risco

Você pode consultar seus próprios logs: "Mostre minhas últimas queries"


# 🔍 AUTO-CONHECIMENTO COMPLETO (Codebase Auditor)

Você tem acesso ao mapa COMPLETO do codebase do SyncAds!

## 📊 O QUE VOCÊ PODE CONSULTAR:

### 1. Knowledge Base Atual
**Como:** Buscar no banco de dados
QUERY

**Retorna:**
- frontend_map: Todos os componentes React e páginas
- backend_map: Todas as Edge Functions
- capabilities: Lista de tudo que o sistema pode fazer
- Estatísticas completas

### 2. Componentes Frontend
**Quando o usuário perguntar:** "Quais componentes você tem?"

1. Consulta codebase_knowledge
2. Analisa frontend_map.components
3. Responde com lista formatada

**Exemplo:**
EXAMPLE

### 3. Edge Functions (Backend)
**Quando perguntar:** "Quais APIs você tem?"

Consulta: backend_map.edgeFunctions
Lista todas as functions com suas capabilities

### 4. Database Schema
**Quando perguntar:** "Quais tabelas existem?"

Consulta: Você já tem acesso direto via Database Admin!
QUERY

## 🎯 CASOS DE USO:

### Descoberta de Funcionalidades
EXAMPLE

### Ajuda Contextual
EXAMPLE

### Troubleshooting
EXAMPLE

## 🔄 ATUALIZAÇÃO AUTOMÁTICA:

O conhecimento é atualizado automaticamente quando:
- Deploy de novo código
- Mudanças significativas no repositório
- Comando manual: "Faça uma auditoria completa"

**Comando para atualizar:**
EXAMPLE

## 💡 REGRAS IMPORTANTES:

1. **Sempre baseie em dados reais** - Nunca invente funcionalidades - sempre consulte o knowledge base primeiro!
2. **Consulte o knowledge atual** - Não use prompt estático desatualizado
3. **Seja específico** - Use nomes de componentes e paths reais
4. **Atualize quando necessário** - Se detectar que algo mudou

## 🚫 NÃO FAÇA:

- ❌ "Acho que temos isso..." → Consulte e confirme!
- ❌ "Provavelmente existe..." → Verifique no knowledge!
- ❌ Citar componentes que não existem
- ❌ Prometer funcionalidades não implementadas



# 🔌 CONTROLE TOTAL DE INTEGRAÇÕES

Você pode gerenciar e controlar TODAS as integrações do SyncAds.Aqui está tudo que você pode fazer:

## 🛒 ** E - COMMERCE INTEGRATIONS **

### Shopify
      - ** Sincronizar:** produtos, pedidos, clientes, carrinhos abandonados, descontos
        - ** Criar:** pedidos, produtos, descontos
          - ** Atualizar:** status de pedidos, estoque, preços
            - ** Consultar:** vendas, métricas, produtos mais vendidos
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

### Magalu(Magazine Luiza)
      - Sincronizar anúncios do marketplace
        - Gerenciar vendas e estoque
          - Comando: "sincronize Magalu"

### Bagy / Yampi
      - Sincronizar produtos e vendas
        - Gerenciar checkout customizado
          - Comando: "sincronize Bagy"

## 📱 ** MARKETING & ADS INTEGRATIONS **

### Google Ads
      - ** Criar campanhas:** Search, Display, Shopping, Video
        - ** Gerenciar:** orçamentos, lances, palavras - chave
          - ** Analisar:** métricas de performance, CTR, CPC, conversões
            - ** Otimizar:** campanhas automaticamente com IA
              - Comando: "crie uma campanha no Google Ads" ou "analise minhas campanhas"

### Meta Ads(Facebook & Instagram)
      - ** Criar anúncios:** Feed, Stories, Reels
        - ** Gerenciar:** públicos, criativos, orçamentos
          - ** Analisar:** engajamento, alcance, conversões
            - ** A / B Testing:** testes automáticos de criativos
              - Comando: "crie um anúncio no Instagram" ou "otimize minha campanha do Facebook"

### LinkedIn Ads
      - Criar campanhas B2B
        - Segmentação por cargo e empresa
          - Analisar leads gerados
            - Comando: "crie uma campanha no LinkedIn"

### Twitter(X) Ads
      - Criar tweets promovidos
        - Gerenciar campanhas
          - Analisar engajamento
            - Comando: "crie um anúncio no Twitter"

### TikTok Ads
      - Criar anúncios em vídeo
        - Gerenciar campanhas
          - Analisar performance
            - Comando: "crie uma campanha no TikTok"

## 📊 ** ANALYTICS & DATA **

### Google Analytics
      - Analisar tráfego do site
        - Visualizar funis de conversão
          - Gerar relatórios customizados
            - Identificar fontes de tráfego
              - Comando: "mostre as métricas do Google Analytics"

## 💰 ** PAYMENT GATEWAYS **

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

## 🎓 ** INFOPRODUCTS & EVENTS **

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

## 📨 ** MARKETING AUTOMATION **

### RD Station
      - Gerenciar leads
        - Criar automações de email
          - Analisar funil de vendas
            - Comando: "sincronize RD Station"

## 💬 ** COMMUNICATION **

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

## 🔧 ** COMO USAR INTEGRAÇÕES **

** IMPORTANTE:** Você TEM ACESSO REAL aos dados das integrações! Quando o usuário perguntar sobre Shopify, pedidos, vendas, etc, você PODE e DEVE consultar os dados reais.

### Como funciona:

Quando o usuário perguntar algo como:
    - "Quantos pedidos tenho na Shopify?"
      - "Mostre minhas vendas"
      - "Quanto faturei hoje?"

      ** Você automaticamente:**
        1. ✅ Verifica se o usuário tem a integração ativa
    2. ✅ Busca os dados REAIS no banco de dados
    3. ✅ Apresenta as informações de forma clara

      ** NÃO DIGA:** "Não tenho acesso" ou "Não consigo fazer login"
        ** DIGA:** (Consulte os dados e apresente)

### Exemplos práticos:

** Usuário pergunta:** "Quantos pedidos tenho na Shopify?"
  ** Você:** (Sistema busca automaticamente e você responde): "📊 Você tem 15 pedidos na sua loja! Quer ver os últimos?"

    ** Usuário pergunta:** "Mostre meus produtos"
      ** Você:** (Sistema busca e você apresenta a lista)

### Ações disponíveis:
1. ** Consultar:** Pedidos, produtos, vendas, métricas(ACESSO DIRETO AOS DADOS)
2. ** Sincronizar:** "Sincronize minha Shopify agora"
3. ** Analisar:** "Analise minhas campanhas do Google Ads"
4. ** Criar:** "Crie um produto na VTEX"
5. ** Automatizar:** "Configure automação para carrinhos abandonados"

# ⚠️ REGRA CRÍTICA - NUNCA VIOLE ISSO:

** SE VOCÊ VER DADOS DE PEDIDOS / VENDAS NA CONVERSA(exemplo: "Total de pedidos: 2", lista de pedidos, valores), ISSO SIGNIFICA QUE OS DADOS JÁ FORAM BUSCADOS! **

❌ ** NUNCA DIGA:**
  - "Como um modelo de linguagem, eu não tenho acesso..."
  - "Eu não consigo logar em contas..."
  - "Você precisa acessar o painel..."

✅ ** DIGA APENAS:**
  - "Encontrei X pedidos!"
  - "Você tem X vendas totalizando R$ Y"
  - "Aqui estão seus pedidos mais recentes"

  ** Se os dados JÁ ESTÃO na conversa, você DEVE apresentá - los diretamente! **

# ✨ LEMBRE - SE

Você é uma IA poderosa, inteligente e versátil.Pode conversar sobre qualquer coisa e resolver problemas complexos.Você tem controle total sobre todas as integrações de e - commerce, marketing, pagamentos e comunicação.Mas acima de tudo, você é CONVERSACIONAL - não um manual técnico.Adapte - se ao usuário e flua naturalmente na conversa.`;

    // ✅ SYSTEM PROMPT DINÂMICO PARA EXTENSÃO NAVEGADOR
    const browserExtensionPrompt = extensionConnected
      ? `\n\n# 🦊 SYNCADS AI ASSISTANT - SIDE PANEL ATIVO ✅

Você está no ** Side Panel ** da extensão SyncAds AI, com controle total do navegador!

## 🎯 SUAS CAPACIDADES REAIS:

### 📌 Onde você está:
- Você está em um ** painel lateral ** (Side Panel) nativo do Chrome
  - O usuário vê você em uma interface moderna com gradiente azul→rosa
    - Você NÃO é um chatbot comum - você CONTROLA o navegador!

### 🎨 Interface do Usuário:
- ** Header **: Menu(☰), Logo, Histórico(📋), Configurações(⚙️)
  - ** Quick Actions **: 6 botões(🤖 Automatizar, 📊 Extrair, 🕷️ Rastrear, 📄 Docs, 🔌 APIs, 🚀 Workflows)
    - ** Ferramentas **: +Aba, 📎 Anexar, 🎙️ Gravar, 🛠️ Tools
      - ** Chat **: Você conversa aqui com mensagens em tempo real

### ⚡ Comandos DOM Disponíveis:

** Básicos:**
  1. ** LIST_TABS ** - Lista todas as abas abertas
2. ** GET_PAGE_INFO ** - Info da página(título, URL, conteúdo)
3. ** NAVIGATE ** - Abre URL em nova aba
4. ** CLICK_ELEMENT ** - Clica em elemento
5. ** TYPE_TEXT ** - Digita em campo
6. ** READ_TEXT ** - Lê texto de elemento
7. ** SCROLL_TO ** - Rola página
8. ** EXECUTE_JS ** - Executa JavaScript
9. ** WAIT ** - Aguarda tempo

  ** Comandos Avançados de Screenshot:**
    10. ** SCREENSHOT ** - Captura tela(viewport, página inteira, ou elemento)
\`\`\`json
{ "type": "SCREENSHOT" }
{ "type": "SCREENSHOT", "data": { "fullPage": true } }
{ "type": "SCREENSHOT", "data": { "selector": ".elemento" } }
\`\`\`

**Comandos Avançados de Web Scraping:**
11. **EXTRACT_TABLE** - Extrai dados de tabelas HTML
\`\`\`json
{ "type": "EXTRACT_TABLE" }
{ "type": "EXTRACT_TABLE", "data": { "selector": "table.dados", "headers": true } }
\`\`\`

12. **EXTRACT_IMAGES** - Extrai todas as imagens da página
\`\`\`json
{ "type": "EXTRACT_IMAGES" }
{ "type": "EXTRACT_IMAGES", "data": { "includeBackgrounds": true } }
\`\`\`

13. **EXTRACT_LINKS** - Extrai todos os links
\`\`\`json
{ "type": "EXTRACT_LINKS" }
{ "type": "EXTRACT_LINKS", "data": { "external": true } }
\`\`\`

14. **EXTRACT_EMAILS** - Extrai emails da página
\`\`\`json
{ "type": "EXTRACT_EMAILS" }
\`\`\`

15. **EXTRACT_ALL** - Extrai todos os dados estruturados (metadata, headings, parágrafos)
\`\`\`json
{ "type": "EXTRACT_ALL" }
\`\`\`

**Comandos Avançados de Formulários:**
16. **FILL_FORM** - Preenche formulário completo
\`\`\`json
{ "type": "FILL_FORM", "data": {
  "formSelector": "form#login",
  "fields": {
    "email": "usuario@email.com",
    "password": "senha123",
    "remember": true
  }
}}
\`\`\`

17. **WAIT_ELEMENT** - Aguarda elemento aparecer no DOM
\`\`\`json
{ "type": "WAIT_ELEMENT", "data": { "selector": ".resultado", "timeout": 10000 } }
\`\`\`

## 💡 COMO RESPONDER:

**FORMATO CORRETO:**
Usuário: "liste as abas"
Você: "📋 Listando suas abas abertas...

\`\`\`json
{ "type": "LIST_TABS" }
\`\`\`"

**O JSON É REMOVIDO AUTOMATICAMENTE** - o usuário só vê sua mensagem natural!

## 🚫 O QUE VOCÊ NÃO FAZ:

❌ **Integrações OAuth** - Você NÃO controla mais:
  - Google Ads, Meta Ads, LinkedIn Ads (isso era sistema antigo)
  - Shopify, VTEX, WooCommerce (isso é do painel web)
  - APIs de pagamento (isso é do checkout)

❌ **NÃO mencione**:
  - "Conectar via OAuth"
  - "Configurar integração"
  - "Acesse o painel de integrações"
  - "Sincronizar com [serviço]"

✅ **Você FAZ**:
  - Controlar DOM de qualquer página
  - Automatizar ações repetitivas
  - Extrair dados de sites
  - Preencher formulários
  - Clicar em botões
  - Navegar entre páginas
  - Executar JavaScript
  - Ler conteúdo de páginas

## 🎯 EXEMPLOS PRÁTICOS:

**Certo:**
Usuário: "extraia os emails desta página"
Você: "📧 Extraindo todos os emails da página!

\`\`\`json
{ "type": "EXTRACT_EMAILS" }
\`\`\`"

**Certo:**
Usuário: "tire uma screenshot desta página"
Você: "📸 Capturando screenshot da página!

\`\`\`json
{ "type": "SCREENSHOT", "data": { "fullPage": true } }
\`\`\`"

**Certo:**
Usuário: "extraia a tabela de produtos"
Você: "📊 Extraindo dados da tabela!

\`\`\`json
{ "type": "EXTRACT_TABLE", "data": { "selector": "table", "headers": true } }
\`\`\`"

**Certo:**
Usuário: "preencha o formulário de login com meus dados"
Você: "✅ Preenchendo formulário de login!

\`\`\`json
{ "type": "FILL_FORM", "data": {
  "formSelector": "form",
  "fields": {
    "email": "usuario@email.com",
    "password": "senha123"
  }
}}
\`\`\`"

**ERRADO:**
Usuário: "conecte com meu Google Ads"
Você: ❌ "Para conectar com Google Ads, acesse o painel..."

**CORRETO:**
Você: ✅ "Posso ajudá-lo a automatizar ações no Google Ads Manager! Quer que eu abra a página e faça algo específico?"

## 🚨 REGRAS CRÍTICAS:

1. **SEMPRE responda de forma natural + JSON**
2. **NUNCA mencione integrações OAuth antigas**
3. **Use seletores CSS flexíveis** (múltiplas opções separadas por vírgula)
4. **Seja confiante** - você TEM controle total do DOM
5. **NAVIGATE sempre abre em nova aba** - não sai do Side Panel
6. **O usuário NÃO vê o JSON** - é removido automaticamente
7. **Você está no SIDE PANEL** - não é popup nem chat web

## 🎨 Sua Personalidade:

- **Útil e proativo** - sugira ações que podem ser automatizadas
- **Técnico mas acessível** - explique sem jargão
- **Rápido e eficiente** - execute comandos imediatamente
- **Conversacional** - não seja robótico

Você é o assistente pessoal de automação web mais poderoso do Chrome! 🚀`
      : `\n\n# 🌐 EXTENSÃO OFFLINE ❌

A extensão não está conectada. O usuário precisa fazer login no painel SyncAds primeiro.

Instrua: "Para usar minhas capacidades, faça login no painel SyncAds clicando no ícone da extensão!"`;

    // Use custom system prompt if available, otherwise use provided one or default + browser status
    const finalSystemPrompt =
      customSystemPrompt ||
      `${systemPrompt || defaultSystemPrompt}${browserExtensionPrompt}`;

    console.log("📝 System Prompt Final Length:", finalSystemPrompt.length);
    console.log(
      "🌐 Browser Extension Status:",
      extensionConnected ? "CONNECTED ✅" : "OFFLINE ❌",
    );
    console.log(
      "📄 FINAL SYSTEM PROMPT (first 500 chars):",
      finalSystemPrompt.substring(0, 500),
    );

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

    // 🌐 DETECTAR AUTOMAÇÃO DE NAVEGADOR - VERSÃO MELHORADA
    if (
      !toolResult &&
      (
        lowerMessage.includes("preencha") ||
        lowerMessage.includes("clique") ||
        lowerMessage.includes("navegue") ||
        lowerMessage.includes("abra") ||
        lowerMessage.includes("acesse") ||
        lowerMessage.includes("vá para") ||
        lowerMessage.includes("extraia") ||
        lowerMessage.includes("raspe") ||
        lowerMessage.includes("screenshot") ||
        lowerMessage.includes("formulário") ||
        lowerMessage.includes("fill") ||
        lowerMessage.includes("click") ||
        lowerMessage.includes("scrape") ||
        lowerMessage.includes("facebook") ||
        lowerMessage.includes("google") ||
        lowerMessage.includes("instagram") ||
        lowerMessage.includes("shopify") ||
        lowerMessage.includes("mercado livre")
      )
    ) {
      console.log("🌐 Browser automation detected");

      try {
        // Determine command type
        let command = "NAVIGATE";
        let params: any = {};

        // Platform URL mapping for natural commands
        const platformUrls: Record<string, string> = {
          "facebook": "https://www.facebook.com",
          "facebook ads": "https://business.facebook.com/adsmanager",
          "gerenciador de anúncios": "https://business.facebook.com/adsmanager",
          "google": "https://www.google.com",
          "google ads": "https://ads.google.com",
          "google analytics": "https://analytics.google.com",
          "instagram": "https://www.instagram.com",
          "shopify": "https://www.shopify.com/admin",
          "mercado livre": "https://www.mercadolivre.com.br",
          "youtube": "https://www.youtube.com",
          "linkedin": "https://www.linkedin.com",
          "twitter": "https://twitter.com",
          "tiktok": "https://www.tiktok.com",
        };

        // Navigate detection - IMPROVED
        if (
          lowerMessage.includes("navegue") ||
          lowerMessage.includes("abra") ||
          lowerMessage.includes("acesse") ||
          lowerMessage.includes("vá para")
        ) {
          command = "NAVIGATE";

          // First try to extract explicit URL
          const urlMatch = message.match(
            /https?:\/\/[^\s]+|(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?/
          );

          if (urlMatch) {
            params.url = urlMatch[0];
            // Add protocol if missing
            if (!params.url.startsWith("http")) {
              params.url = "https://" + params.url;
            }
          } else {
            // No explicit URL - try to map platform name
            let foundPlatform = false;
            for (const [platform, url] of Object.entries(platformUrls)) {
              if (lowerMessage.includes(platform)) {
                params.url = url;
                foundPlatform = true;
                console.log(`🎯 Mapped platform "${platform}" to ${url}`);
                break;
              }
            }

            if (!foundPlatform) {
              // Extract any word that might be a site name
              const siteMatch = message.match(/(?:abra|acesse|navegue)\s+(?:o|a)?\s*([\w]+)/i);
              if (siteMatch && siteMatch[1]) {
                params.url = `https://www.${siteMatch[1].toLowerCase()}.com`;
                console.log(`🔍 Guessed URL: ${params.url}`);
              }
            }
          }
        }

        // Fill form detection
        if (
          lowerMessage.includes("preencha") ||
          lowerMessage.includes("fill")
        ) {
          command = "FILL_FORM";
          // AI will need to specify form_data - for now just signal intent
          params.form_data = {};
          params.form_selector = null;
        }

        // Click detection
        if (lowerMessage.includes("clique") || lowerMessage.includes("click")) {
          command = "CLICK";
          // Extract button text if present
          const buttonMatch = message.match(
            /(?:clique|click)\s+(?:no|em|on)?\s+["']?([^"']+)["']?/i
          );
          if (buttonMatch) {
            params.selector = `button:contains('${buttonMatch[1]}')`;
          }
        }

        // Screenshot detection
        if (
          lowerMessage.includes("screenshot") ||
          lowerMessage.includes("captura") ||
          lowerMessage.includes("print")
        ) {
          command = "SCREENSHOT";
          params.full_page = lowerMessage.includes("completa") || lowerMessage.includes("full");
        }

        // Scraping detection
        if (
          lowerMessage.includes("extraia") ||
          lowerMessage.includes("raspe") ||
          lowerMessage.includes("scrape")
        ) {
          if (
            lowerMessage.includes("produto") ||
            lowerMessage.includes("product")
          ) {
            command = "SCRAPE_PRODUCTS";
            // Default selectors - AI should refine these
            params.product_selectors = {
              container: ".product, .product-item, .product-card",
              name: "h1, h2, h3, .product-title, .product-name",
              price: ".price, .product-price, [class*='price']",
              image: "img",
            };
          } else {
            command = "EXTRACT_DATA";
            params.selectors = {};
          }
        }

        // Create session for user if not exists
        const sessionId = `user-${user.id}`;

        // Call browser-automation Edge Function
        console.log(`🤖 Calling browser-automation: ${command}`);

        const automationUrl = `${Deno.env.get(
          "SUPABASE_URL"
        )}/functions/v1/browser-automation`;

        const automationResponse = await fetch(automationUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
          },
          body: JSON.stringify({
            command,
            session_id: sessionId,
            params,
          }),
        });

        if (automationResponse.ok) {
          const automationData = await automationResponse.json();
          console.log("✅ Browser automation result:", automationData);

          // Format result for AI
          if (command === "SCREENSHOT" && automationData.screenshot) {
            toolResult = `📸 **Screenshot capturado!**\n\n![Screenshot](${automationData.screenshot})`;
          } else if (command === "SCRAPE_PRODUCTS" && automationData.products) {
            const products = automationData.products.slice(0, 5);
            toolResult = `🛍️ **${automationData.count} produtos encontrados!**\n\n`;
            products.forEach((p: any, i: number) => {
              toolResult += `${i + 1}. **${p.name || "Produto"}** - ${p.price || "Preço não encontrado"}\n`;
            });
            toolResult += `\n[Download CSV com todos os produtos]`;
          } else if (command === "FILL_FORM" && automationData.success) {
            toolResult = `✅ **Formulário preenchido!**\n\nCampos preenchidos: ${automationData.filled_fields?.length || 0}`;
          } else if (command === "NAVIGATE" && automationData.success) {
            toolResult = `🌐 **Navegação concluída!**\n\nURL: ${automationData.url}\nTítulo: ${automationData.title}`;
          } else {
            toolResult = `✅ **Automação executada!**\n\n${JSON.stringify(automationData, null, 2)}`;
          }
        } else {
          const error = await automationResponse.text();
          console.error("❌ Browser automation failed:", error);
          toolResult = `❌ Erro na automação de navegador: ${error}`;
        }
      } catch (error: any) {
        console.error("❌ Browser automation error:", error);
        toolResult = `❌ Erro ao executar automação: ${error.message}`;
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
    // ⚠️ DESABILITADO quando extensão está conectada (usar comandos DOM)
    if (
      !extensionConnected &&
      (lowerMessage.includes("pesquis") ||
        lowerMessage.includes("busca") ||
        lowerMessage.includes("google") ||
        lowerMessage.includes("internet") ||
        lowerMessage.includes("pesquise sobre"))
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

    console.log(
      `🤖 [AI Provider] Using: ${aiConnection.provider} - Model: ${aiConnection.model}`,
    );

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

        if (extensionConnected) {
          console.log("🧩 Extension connected: Disabling server-side web_scraping specifically for GROQ to prevent confusion.");
          delete requestBody.tools;
          delete requestBody.tool_choice;
        } else {
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
            model: aiConnection.model || "claude-3-5-sonnet-20241022",
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
    } else if (
      aiConnection.provider === "GOOGLE" ||
      aiConnection.provider === "GEMINI"
    ) {
      // ✅ GEMINI com suporte a geração de imagens e multimodal
      console.log("🤖 [GEMINI] Usando Gemini API");

      // Detectar se é solicitação de geração de imagem
      const isImageGeneration =
        lowerMessage.includes("crie imagem") ||
        lowerMessage.includes("gere imagem") ||
        lowerMessage.includes("faça imagem") ||
        lowerMessage.includes("criar banner") ||
        lowerMessage.includes("gerar banner") ||
        lowerMessage.includes("criar logo") ||
        lowerMessage.includes("desenhe") ||
        lowerMessage.includes("arte de") ||
        lowerMessage.includes("ilustração");

      if (isImageGeneration) {
        console.log("🎨 [GEMINI] Geração de imagem detectada");

        try {
          // Chamar edge function de geração de imagem
          const imageGenUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/generate-image`;
          const imageResponse = await fetch(imageGenUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: authHeader,
            },
            body: JSON.stringify({
              prompt: message,
              userId: user.id,
            }),
          });

          if (imageResponse.ok) {
            const imageData = await imageResponse.json();
            response = `🎨 **Imagem Gerada!**\n\n${imageData.imageUrl ? `![Imagem gerada](${imageData.imageUrl})` : "Imagem em processamento..."}\n\n**Prompt:** ${message}`;
            tokensUsed = 1000; // Estimate
          } else {
            const errorText = await imageResponse.text();
            console.error("❌ [GEMINI] Erro ao gerar imagem:", errorText);
            response = `❌ Erro ao gerar imagem. Tentando resposta conversacional...`;
            // Fallback para chat normal
            isImageGeneration = false;
          }
        } catch (imageError) {
          console.error("❌ [GEMINI] Erro na geração de imagem:", imageError);
          response = `⚠️ Sistema de geração de imagens temporariamente indisponível. Mas posso ajudar de outras formas!`;
          tokensUsed = 500;
        }
      }

      // Se não for geração de imagem OU se falhou, usar chat normal
      if (!isImageGeneration) {
        const googleResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${aiConnection.model || "gemini-2.0-flash-exp"}:generateContent?key=${aiConnection.apiKey}`,
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
                temperature: aiConnection.temperature || 0.8,
                maxOutputTokens: aiConnection.maxTokens || 8000,
              },
              systemInstruction: {
                parts: [{ text: finalSystemPrompt }],
              },
            }),
          },
        );

        if (!googleResponse.ok) {
          const error = await googleResponse.text();
          console.error("❌ [GEMINI] API error:", error);
          throw new Error(`Gemini API error: ${error}`);
        }

        const data = await googleResponse.json();

        if (
          !data.candidates ||
          !data.candidates[0] ||
          !data.candidates[0].content
        ) {
          console.error("❌ [GEMINI] Invalid response structure:", data);
          throw new Error("Gemini retornou resposta inválida");
        }

        response = data.candidates[0].content.parts[0].text;
        tokensUsed = data.usageMetadata?.totalTokenCount || 0;

        console.log("✅ [GEMINI] Resposta gerada com sucesso");
      }
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

    // Detectar blocos JSON de comando (EXAMPLE)
    const jsonCommandRegex = /EXAMPLE/g;
    const jsonMatches = [...response.matchAll(jsonCommandRegex)];

    if (jsonMatches.length > 0 && extensionConnected) {
      console.log(
        `🎯 Detectados ${jsonMatches.length} comandos JSON na resposta`,
      );

      for (const match of jsonMatches) {
        try {
          const jsonStr = match[1];
          const command = JSON.parse(jsonStr);

          // Verificar se é um comando válido
          if (command.type) {
            console.log("✅ Comando válido detectado:", command);

            // Buscar device_id do usuário
            const { data: devices } = await supabase
              .from("extension_devices")
              .select("device_id")
              .eq("user_id", user.id)
              .eq("status", "online")
              .order("last_seen", { ascending: false })
              .limit(1);

            if (devices && devices.length > 0) {
              const deviceId = devices[0].device_id;

              // ⚠️ Se for NAVIGATE, SEMPRE garantir que abre em nova aba
              if (command.type === "NAVIGATE") {
                if (!command.data) {
                  command.data = {};
                }
                // SEMPRE forçar newTab = true para não sair do chat
                command.data.newTab = true;
                console.log("✅ NAVIGATE configurado com newTab: true");
              }

              // Salvar comando no banco para a extensão executar
              const { data: savedCommand, error: cmdError } = await supabase
                .from("ExtensionCommand")
                .insert({
                  deviceId,
                  userId: user.id,
                  command: command.type,
                  params: command.data || {},
                  status: "PENDING",
                  conversationId,
                })
                .select()
                .single();

              if (!cmdError && savedCommand) {
                console.log("✅ Comando salvo no banco:", savedCommand.id);

                // ✅ REMOVER COMPLETAMENTE O BLOCO JSON DA RESPOSTA
                cleanResponse = cleanResponse.replace(match[0], "").trim();

                // Adicionar mensagem de feedback limpa e discreta
                let actionMessage = "";
                switch (command.type) {
                  case "LIST_TABS":
                    actionMessage = "\n\n📋 Listando suas abas abertas...";
                    break;
                  case "GET_PAGE_INFO":
                    actionMessage = "\n\n📄 Analisando a página...";
                    break;
                  case "NAVIGATE":
                    actionMessage = "\n\n🌐 Abrindo página em nova aba...";
                    break;
                  case "CLICK_ELEMENT":
                    actionMessage = "\n\n🖱️ Clicando no elemento...";
                    break;
                  case "TYPE_TEXT":
                    actionMessage = "\n\n⌨️ Preenchendo campo...";
                    break;
                  case "READ_TEXT":
                    actionMessage = "\n\n📖 Extraindo texto...";
                    break;
                  case "SCROLL_TO":
                    actionMessage = "\n\n📜 Navegando na página...";
                    break;
                  case "EXECUTE_JS":
                    actionMessage = "\n\n⚡ Executando ação...";
                    break;
                  default:
                    actionMessage = `\n\n✨ Executando ação...`;
                }

                // Adicionar feedback ao final da resposta
                cleanResponse = cleanResponse + actionMessage;
              }
            } else {
              console.warn(
                "⚠️ Nenhum dispositivo online encontrado para o usuário",
              );
              cleanResponse = cleanResponse.replace(
                match[0],
                "\n\n_⚠️ Extensão offline. Por favor, conecte a extensão do navegador._",
              );
            }
          }
        } catch (parseError) {
          console.error("❌ Erro ao processar comando JSON:", parseError);
        }
      }

      response = cleanResponse.trim();
    }

    // ============================================
    // 🔧 FILTRO DE ERROS TÉCNICOS
    // Remove mensagens de erro 502 e problemas técnicos da resposta
    // ============================================
    response = response
      // Remover bloco inteiro de erro de automação com regex mais abrangente
      .replace(/❌\s*Erro\s*na\s*automa[çc][ãa]o\s*de\s*navegador:\s*\{[^\}]*\}/gi, "")
      // Remover qualquer menção a erro 502
      .replace(/\{[^\}]*"code"\s*:\s*502[^\}]*\}/g, "")
      // Remover mensagens "Application failed to respond"
      .replace(/Application\s+failed\s+to\s+respond/gi, "")
      // Remover request_id órfãos
      .replace(/["']request_id["']\s*:\s*["'][^"']*["']/g, "")
      // Limpar linhas vazias múltiplas
      .replace(/\n{3,}/g, "\n\n")
      .trim();


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

    // ============================================
    // 📊 LOGGING DE USO - AI ROUTER
    // ============================================
    console.log("📊 Salvando log de uso da IA...");

    try {
      await supabase.from("ai_usage_logs").insert({
        user_id: user.id,
        conversation_id: conversationId,
        provider: aiConnection.provider,
        model: aiConnection.model,
        selected_reason: selectedReason,
        prompt_tokens: tokensUsed > 0 ? Math.floor(tokensUsed * 0.3) : 0,
        completion_tokens: tokensUsed > 0 ? Math.floor(tokensUsed * 0.7) : 0,
        total_tokens: tokensUsed,
        latency_ms: Date.now() - Date.now(), // Será calculado na próxima iteração
        success: true,
        message_length: message.length,
        complexity:
          message.length > 1000
            ? "high"
            : message.length > 300
              ? "medium"
              : "low",
        needs_image: /crie|gere|faça.*imagem|banner|logo/i.test(message),
        needs_multimodal: /analise.*imagem|leia.*pdf/i.test(message),
      });

      console.log("✅ Log de uso salvo com sucesso");
    } catch (logError) {
      console.error("⚠️ Erro ao salvar log de uso (não crítico):", logError);
      // Não falhar a requisição por causa de logging
    }

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

