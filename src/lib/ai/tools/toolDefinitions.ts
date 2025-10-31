/**
 * Definições de ferramentas (tools) para IA com Tool Calling
 * Compatível com OpenAI, Anthropic e Groq
 */

export interface Tool {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, any>;
    required: string[];
  };
}

/**
 * Todas as ferramentas disponíveis para a IA
 */
export const AI_TOOLS: Tool[] = [
  // 1. GERAÇÃO DE ARQUIVOS
  {
    name: "generate_file",
    description:
      "Cria um arquivo (CSV, JSON, TXT) e retorna um link de download. Use quando o usuário pedir para criar, gerar ou exportar dados em arquivo.",
    parameters: {
      type: "object",
      properties: {
        fileName: {
          type: "string",
          description:
            "Nome do arquivo com extensão (ex: dados.csv, relatorio.json)",
        },
        content: {
          type: "string",
          description:
            "Conteúdo do arquivo. Para CSV use formato tabular, para JSON use objeto válido.",
        },
        fileType: {
          type: "string",
          enum: ["csv", "json", "txt", "text"],
          description: "Tipo do arquivo a ser gerado",
        },
      },
      required: ["fileName", "content", "fileType"],
    },
  },

  // 2. GERAÇÃO DE ZIP
  {
    name: "generate_zip",
    description:
      "Cria um arquivo ZIP contendo múltiplos arquivos e retorna link de download. Use quando o usuário pedir múltiplos arquivos ou exportação em lote.",
    parameters: {
      type: "object",
      properties: {
        zipName: {
          type: "string",
          description: "Nome do arquivo ZIP (ex: relatorios.zip)",
        },
        files: {
          type: "array",
          description: "Lista de arquivos a incluir no ZIP",
          items: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description: "Nome do arquivo",
              },
              content: {
                type: "string",
                description: "Conteúdo do arquivo",
              },
              type: {
                type: "string",
                enum: ["text", "json", "csv", "base64"],
                description: "Tipo do conteúdo",
              },
            },
          },
        },
      },
      required: ["zipName", "files"],
    },
  },

  // 3. HTTP REQUEST
  {
    name: "http_request",
    description:
      "Faz requisições HTTP (GET, POST, PUT, DELETE) para qualquer URL/API. Use para buscar dados de APIs externas ou enviar dados.",
    parameters: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description:
            "URL completa da API ou recurso (ex: https://api.exemplo.com/dados)",
        },
        method: {
          type: "string",
          enum: ["GET", "POST", "PUT", "DELETE", "PATCH"],
          description: "Método HTTP",
        },
        headers: {
          type: "object",
          description:
            'Headers HTTP opcionais (ex: {"Authorization": "Bearer token"})',
        },
        body: {
          type: "object",
          description: "Corpo da requisição (para POST/PUT)",
        },
      },
      required: ["url", "method"],
    },
  },

  // 4. DOWNLOAD DE IMAGEM
  {
    name: "download_image",
    description:
      "Baixa uma imagem de uma URL e salva no storage, retornando o link da imagem. Use quando o usuário pedir para baixar, salvar ou processar imagens.",
    parameters: {
      type: "object",
      properties: {
        imageUrl: {
          type: "string",
          description:
            "URL da imagem a ser baixada (ex: https://exemplo.com/foto.jpg)",
        },
        fileName: {
          type: "string",
          description: "Nome para salvar a imagem (ex: produto-01.jpg)",
        },
      },
      required: ["imageUrl", "fileName"],
    },
  },

  // 5. BUSCA NA INTERNET
  {
    name: "web_search",
    description:
      "Pesquisa informações na internet em tempo real usando Brave Search. Use quando o usuário pedir para buscar, pesquisar ou procurar informações atuais, notícias, tendências, ou qualquer informação que você não tenha na sua base de conhecimento.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            'Termo de busca (ex: "tendências marketing 2025", "melhor CRM para e-commerce")',
        },
        maxResults: {
          type: "number",
          description: "Número máximo de resultados (padrão: 10, máximo: 50)",
        },
        freshness: {
          type: "string",
          enum: ["day", "week", "month", "year"],
          description:
            "Filtrar por data: day (últimas 24h), week (última semana), month (último mês), year (último ano)",
        },
      },
      required: ["query"],
    },
  },

  // 6. WEB SCRAPING
  {
    name: "web_scraping",
    description:
      "Faz web scraping REAL usando navegador headless (Playwright). Executa JavaScript, funciona com SPAs (React/Vue/Angular), espera carregamento dinâmico, bypassa anti-bot. Use quando precisar raspar dados de sites modernos, extrair informações de páginas web que usam JavaScript.",
    parameters: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "URL da página a fazer scraping",
        },
        selectors: {
          type: "object",
          description:
            'Seletores CSS para extrair dados específicos (ex: {"title": "h1", "price": ".price"})',
        },
        extractAll: {
          type: "boolean",
          description:
            "Se true, extrai todo o conteúdo da página. Se false, usa apenas os seletores.",
        },
      },
      required: ["url"],
    },
  },

  // 7. GERAÇÃO DE IMAGEM
  {
    name: "generate_image",
    description:
      "Gera uma imagem usando IA a partir de uma descrição. Use quando o usuário pedir para criar, gerar ou desenhar uma imagem.",
    parameters: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description:
            "Descrição detalhada da imagem a ser gerada (em inglês para melhor resultado)",
        },
        size: {
          type: "string",
          enum: ["256x256", "512x512", "1024x1024", "1792x1024", "1024x1792"],
          description: "Tamanho da imagem",
        },
        style: {
          type: "string",
          enum: ["natural", "vivid"],
          description:
            "Estilo da imagem: natural (mais realista) ou vivid (mais vibrante)",
        },
      },
      required: ["prompt"],
    },
  },

  // 8. EXECUTAR PYTHON
  {
    name: "execute_python",
    description:
      "Executa código Python para cálculos complexos, processamento de dados, análises estatísticas. Use quando precisar de cálculos matemáticos avançados.",
    parameters: {
      type: "object",
      properties: {
        code: {
          type: "string",
          description:
            "Código Python a ser executado. Use print() para retornar resultados.",
        },
        description: {
          type: "string",
          description: "Descrição do que o código faz (para logs)",
        },
      },
      required: ["code"],
    },
  },

  // 9. QUERY NO BANCO
  {
    name: "database_query",
    description:
      "Executa query SQL no banco de dados. Use para buscar dados de produtos, pedidos, clientes, campanhas. APENAS SELECT, não use INSERT/UPDATE/DELETE.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            'Query SQL (apenas SELECT). Ex: SELECT * FROM "Product" LIMIT 10',
        },
        description: {
          type: "string",
          description: "Descrição do que a query busca",
        },
      },
      required: ["query"],
    },
  },

  // 10. PROCESSAR DADOS
  {
    name: "process_data",
    description:
      "Processa e transforma dados (filtrar, ordenar, agrupar, calcular). Use para análises e manipulação de datasets.",
    parameters: {
      type: "object",
      properties: {
        data: {
          type: "array",
          description: "Array de dados a processar",
        },
        operation: {
          type: "string",
          enum: ["filter", "sort", "group", "aggregate", "transform"],
          description: "Operação a realizar",
        },
        config: {
          type: "object",
          description:
            'Configuração da operação (ex: {"field": "price", "order": "asc"})',
        },
      },
      required: ["data", "operation"],
    },
  },

  // 11. ENVIAR EMAIL
  {
    name: "send_email",
    description:
      "Envia email para um destinatário. Use quando o usuário pedir para enviar notificação por email.",
    parameters: {
      type: "object",
      properties: {
        to: {
          type: "string",
          description: "Email do destinatário",
        },
        subject: {
          type: "string",
          description: "Assunto do email",
        },
        body: {
          type: "string",
          description: "Corpo do email (pode conter HTML)",
        },
        attachments: {
          type: "array",
          description: "URLs de arquivos para anexar",
          items: {
            type: "string",
          },
        },
      },
      required: ["to", "subject", "body"],
    },
  },

  // 12. RASPAR PRODUTOS
  {
    name: "scrape_products",
    description:
      "Raspa dados de produtos de e-commerce usando navegador REAL (Playwright). Funciona com Shopify, WooCommerce, VTEX, Magento e qualquer loja moderna que usa JavaScript. Extrai nome, preço, imagens, descrição automaticamente e gera CSV para download.",
    parameters: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "URL da página de produtos ou categoria",
        },
        maxProducts: {
          type: "number",
          description: "Número máximo de produtos a extrair (padrão: 10)",
        },
      },
      required: ["url"],
    },
  },

  // 13. GERAR VÍDEO
  {
    name: "generate_video",
    description:
      "Gera um vídeo curto usando IA a partir de uma descrição. Use quando o usuário pedir para criar vídeos.",
    parameters: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description: "Descrição do vídeo a ser gerado",
        },
        duration: {
          type: "number",
          description: "Duração em segundos (padrão: 5)",
        },
      },
      required: ["prompt"],
    },
  },
];

/**
 * Função para converter tools para formato OpenAI
 */
export function getOpenAITools() {
  return AI_TOOLS.map((tool) => ({
    type: "function" as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }));
}

/**
 * Função para converter tools para formato Anthropic (Claude)
 */
export function getAnthropicTools() {
  return AI_TOOLS.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.parameters,
  }));
}

/**
 * Função para converter tools para formato Groq
 */
export function getGroqTools() {
  return getOpenAITools(); // Groq usa mesmo formato do OpenAI
}

/**
 * Mapa de ferramentas por nome para acesso rápido
 */
export const TOOL_MAP = AI_TOOLS.reduce(
  (map, tool) => {
    map[tool.name] = tool;
    return map;
  },
  {} as Record<string, Tool>,
);

/**
 * Exemplos de uso das ferramentas (para instrução da IA)
 */
export const TOOL_USAGE_EXAMPLES = `
EXEMPLOS DE USO DAS FERRAMENTAS:

1. Para buscar na internet:
{
  "name": "web_search",
  "arguments": {
    "query": "melhores práticas SEO 2025",
    "maxResults": 10,
    "freshness": "month"
  }
}

2. Para criar um arquivo CSV:
{
  "name": "generate_file",
  "arguments": {
    "fileName": "clientes.csv",
    "content": "Nome,Email,Telefone\\nJoão,joao@email.com,11999999999",
    "fileType": "csv"
  }
}

3. Para fazer uma requisição HTTP:
{
  "name": "http_request",
  "arguments": {
    "url": "https://api.exemplo.com/dados",
    "method": "GET",
    "headers": {"Authorization": "Bearer token123"}
  }
}

4. Para baixar uma imagem:
{
  "name": "download_image",
  "arguments": {
    "imageUrl": "https://exemplo.com/foto.jpg",
    "fileName": "produto-foto.jpg"
  }
}

5. Para fazer web scraping (com navegador real):
{
  "name": "web_scraping",
  "arguments": {
    "url": "https://exemplo.com/produtos",
    "selectors": {
      "title": "h1.product-title",
      "price": ".product-price"
    }
  }
}

6. Para raspar produtos de e-commerce:
{
  "name": "scrape_products",
  "arguments": {
    "url": "https://loja.com/categoria/eletronicos",
    "maxProducts": 50
  }
}

7. Para gerar um ZIP:
{
  "name": "generate_zip",
  "arguments": {
    "zipName": "relatorios.zip",
    "files": [
      {"name": "vendas.csv", "content": "...", "type": "csv"},
      {"name": "analise.json", "content": "{...}", "type": "json"}
    ]
  }
}

IMPORTANTE:
- SEMPRE use web_search quando precisar de informações atuais, notícias, tendências ou dados que você não tem
- SEMPRE use web_scraping ou scrape_products para extrair dados de sites (funciona com JavaScript!)
- SEMPRE use as ferramentas quando o usuário pedir para criar arquivos, fazer downloads, buscar dados externos
- NÃO tente fazer essas operações manualmente, SEMPRE chame a ferramenta apropriada
- Após chamar a ferramenta, explique ao usuário o que foi feito e forneça o resultado/link
- O scraping agora usa navegador REAL (Playwright), então funciona com sites modernos que usam React, Vue, Angular, etc.
`;
