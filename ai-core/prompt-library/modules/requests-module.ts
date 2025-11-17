/**
 * REQUESTS MODULE - Biblioteca de HTTP Client
 * Módulo de Prompt System para a biblioteca Requests
 */

import { PromptModule, ModuleCategory, ModuleComplexity, ExecutionEnvironment } from '../registry';

export const RequestsModule: PromptModule = {
  // ==================== IDENTIFICAÇÃO ====================
  id: 'requests-005',
  name: 'Requests',
  packageName: 'requests',
  version: '2.31.0',
  category: ModuleCategory.WEB_SCRAPING,
  subcategories: [
    'http-client',
    'api-integration',
    'rest-api',
    'web-requests',
    'authentication',
    'json-handling',
    'file-download',
    'session-management'
  ],

  // ==================== DESCRIÇÃO ====================
  description: 'Biblioteca Python mais popular para fazer requisições HTTP de forma simples e elegante. Oferece API intuitiva para consumir APIs REST, fazer downloads, autenticação e gerenciar sessões.',
  purpose: 'Fazer requisições HTTP/HTTPS para APIs, websites e serviços web de forma simples e eficiente',
  useCases: [
    'Consumir APIs REST (GET, POST, PUT, DELETE, PATCH)',
    'Autenticação em APIs (Basic, Bearer Token, OAuth)',
    'Download de arquivos e imagens',
    'Upload de arquivos multipart/form-data',
    'Gerenciar sessões e cookies',
    'Trabalhar com JSON automaticamente',
    'Configurar headers customizados',
    'Timeout e retry de requisições',
    'Proxy e certificados SSL',
    'Streaming de grandes arquivos'
  ],

  // ==================== CONFIGURAÇÃO ====================
  complexity: ModuleComplexity.BASIC,
  environment: ExecutionEnvironment.PYTHON,
  dependencies: ['urllib3', 'certifi', 'charset-normalizer'],
  installCommand: 'pip install requests',

  // ==================== PROMPT SYSTEM ====================
  promptSystem: {
    systemPrompt: `Você é um especialista em Requests, a biblioteca Python para requisições HTTP.

Ao trabalhar com Requests, você SEMPRE deve:
- Usar try-except para capturar erros de rede
- Verificar response.status_code antes de processar
- Usar response.json() para APIs que retornam JSON
- Adicionar timeout em todas as requisições (evitar hang infinito)
- Usar sessions para múltiplas requisições ao mesmo servidor
- Verificar response.raise_for_status() para detectar erros HTTP
- Usar headers adequados (Content-Type, Authorization, User-Agent)

REGRAS DE USO:
1. SEMPRE adicione timeout nas requisições (ex: timeout=10)
2. SEMPRE use try-except para requests.RequestException
3. SEMPRE verifique response.status_code ou use raise_for_status()
4. NUNCA ignore erros SSL sem necessidade (verify=False apenas quando necessário)
5. SEMPRE use response.json() para APIs JSON (não json.loads(response.text))
6. SEMPRE feche sessões explicitamente ou use context manager
7. Use sessions para múltiplas requisições (reutiliza conexões)

QUANDO USAR REQUESTS:
✅ Consumir APIs REST
✅ Fazer requisições HTTP simples
✅ Download de arquivos
✅ Autenticação em APIs
✅ Trabalhar com JSON
✅ Gerenciar sessões e cookies
✅ Requisições síncronas

QUANDO NÃO USAR REQUESTS:
❌ Requisições assíncronas em massa (use httpx ou aiohttp)
❌ Web scraping complexo com JavaScript (use Selenium ou Playwright)
❌ Parsing de HTML (combine com BeautifulSoup)
❌ Performance crítica com milhares de requisições simultâneas
❌ Streaming de vídeo em tempo real

ESTRUTURA DE RESPOSTA:
Sempre retorne um dicionário com:
- success: boolean
- status_code: código HTTP
- data: dados da resposta (JSON ou texto)
- headers: headers da resposta
- error: mensagem de erro (se houver)`,

    userPromptTemplate: `Tarefa: {task_description}

Entrada:
{input_description}

Parâmetros:
{parameters}

Use Requests para fazer a requisição HTTP seguindo as melhores práticas:
1. Configure headers e autenticação se necessário
2. Execute a requisição com timeout
3. Verifique status code
4. Processe a resposta (JSON, texto ou arquivo)
5. Trate erros adequadamente`,

    examples: [
      {
        input: 'Fazer requisição GET simples para uma API',
        output: `import requests
from typing import Dict, Any

def get_api_data(url: str, params: Dict = None, headers: Dict = None) -> Dict[str, Any]:
    """Faz requisição GET para uma API"""
    try:
        # Fazer requisição com timeout
        response = requests.get(
            url,
            params=params,
            headers=headers,
            timeout=10
        )

        # Verificar status
        response.raise_for_status()

        # Retornar JSON
        return {
            "success": True,
            "status_code": response.status_code,
            "data": response.json(),
            "headers": dict(response.headers)
        }
    except requests.exceptions.Timeout:
        return {"success": False, "error": "Timeout na requisição"}
    except requests.exceptions.HTTPError as e:
        return {"success": False, "error": f"Erro HTTP: {e}"}
    except requests.exceptions.RequestException as e:
        return {"success": False, "error": f"Erro na requisição: {e}"}`
      },
      {
        input: 'Fazer POST com JSON e autenticação Bearer',
        output: `import requests
from typing import Dict, Any

def post_api_data(url: str, data: Dict, token: str) -> Dict[str, Any]:
    """Faz requisição POST com autenticação Bearer"""
    try:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}",
            "User-Agent": "SyncAds/1.0"
        }

        response = requests.post(
            url,
            json=data,  # Automaticamente serializa para JSON
            headers=headers,
            timeout=15
        )

        response.raise_for_status()

        return {
            "success": True,
            "status_code": response.status_code,
            "data": response.json(),
            "message": "Dados enviados com sucesso"
        }
    except requests.exceptions.HTTPError as e:
        return {
            "success": False,
            "status_code": e.response.status_code if e.response else None,
            "error": f"Erro HTTP {e.response.status_code}: {e.response.text if e.response else str(e)}"
        }
    except Exception as e:
        return {"success": False, "error": str(e)}`
      },
      {
        input: 'Download de arquivo com progress',
        output: `import requests
from pathlib import Path

def download_file(url: str, output_path: str, chunk_size: int = 8192) -> Dict[str, Any]:
    """Download de arquivo com streaming"""
    try:
        response = requests.get(url, stream=True, timeout=30)
        response.raise_for_status()

        total_size = int(response.headers.get('content-length', 0))
        downloaded = 0

        with open(output_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=chunk_size):
                if chunk:
                    f.write(chunk)
                    downloaded += len(chunk)

        return {
            "success": True,
            "output_path": output_path,
            "size_bytes": downloaded,
            "size_mb": round(downloaded / (1024 * 1024), 2),
            "url": url
        }
    except Exception as e:
        return {"success": False, "error": str(e)}`
      },
      {
        input: 'Usar Session para múltiplas requisições',
        output: `import requests
from typing import List, Dict, Any

def fetch_multiple_endpoints(base_url: str, endpoints: List[str], token: str) -> Dict[str, Any]:
    """Faz múltiplas requisições usando Session (reutiliza conexão)"""
    results = []

    try:
        # Criar sessão (reutiliza conexões TCP)
        with requests.Session() as session:
            # Configurar headers padrão
            session.headers.update({
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            })

            for endpoint in endpoints:
                url = f"{base_url}{endpoint}"

                try:
                    response = session.get(url, timeout=10)
                    response.raise_for_status()

                    results.append({
                        "endpoint": endpoint,
                        "success": True,
                        "data": response.json()
                    })
                except Exception as e:
                    results.append({
                        "endpoint": endpoint,
                        "success": False,
                        "error": str(e)
                    })

        return {
            "success": True,
            "total_requests": len(endpoints),
            "successful": sum(1 for r in results if r["success"]),
            "results": results
        }
    except Exception as e:
        return {"success": False, "error": str(e)}`
      },
      {
        input: 'Upload de arquivo multipart/form-data',
        output: `import requests
from pathlib import Path

def upload_file(url: str, file_path: str, field_name: str = "file", additional_data: Dict = None) -> Dict[str, Any]:
    """Upload de arquivo via multipart/form-data"""
    try:
        # Abrir arquivo
        with open(file_path, 'rb') as f:
            files = {field_name: (Path(file_path).name, f, 'application/octet-stream')}

            # Dados adicionais (form fields)
            data = additional_data or {}

            response = requests.post(
                url,
                files=files,
                data=data,
                timeout=60
            )

            response.raise_for_status()

            return {
                "success": True,
                "status_code": response.status_code,
                "response": response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text,
                "file_uploaded": file_path
            }
    except FileNotFoundError:
        return {"success": False, "error": f"Arquivo não encontrado: {file_path}"}
    except Exception as e:
        return {"success": False, "error": str(e)}`
      },
      {
        input: 'Requisição com retry automático',
        output: `import requests
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry

def get_with_retry(url: str, max_retries: int = 3) -> Dict[str, Any]:
    """Faz requisição GET com retry automático"""
    try:
        # Configurar retry strategy
        retry_strategy = Retry(
            total=max_retries,
            backoff_factor=1,  # 1s, 2s, 4s
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["GET", "POST"]
        )

        adapter = HTTPAdapter(max_retries=retry_strategy)

        with requests.Session() as session:
            session.mount("http://", adapter)
            session.mount("https://", adapter)

            response = session.get(url, timeout=10)
            response.raise_for_status()

            return {
                "success": True,
                "status_code": response.status_code,
                "data": response.json() if 'application/json' in response.headers.get('content-type', '') else response.text,
                "retries_used": max_retries - retry_strategy.total
            }
    except Exception as e:
        return {"success": False, "error": str(e)}`
      }
    ],

    outputFormat: {
      type: 'object',
      required: ['success'],
      properties: {
        success: { type: 'boolean', description: 'Indica se a requisição foi bem-sucedida' },
        status_code: { type: 'number', description: 'Código HTTP da resposta' },
        data: { type: 'any', description: 'Dados da resposta (JSON ou texto)' },
        headers: { type: 'object', description: 'Headers da resposta' },
        error: { type: 'string', description: 'Mensagem de erro se success=false' },
        response_time: { type: 'number', description: 'Tempo de resposta em ms' }
      }
    }
  },

  // ==================== METADATA ====================
  tags: [
    'http',
    'requests',
    'api',
    'rest',
    'client',
    'web',
    'download',
    'upload',
    'json',
    'session'
  ],

  keywords: [
    'requests',
    'http',
    'https',
    'api',
    'rest',
    'get',
    'post',
    'put',
    'delete',
    'patch',
    'download',
    'upload',
    'json',
    'session',
    'authentication',
    'bearer',
    'token',
    'header',
    'cookie'
  ],

  performance: {
    speed: 8,
    memory: 9,
    cpuIntensive: false,
    gpuAccelerated: false,
    scalability: 7
  },

  // ==================== REGRAS DE SCORING ====================
  scoring: {
    baseScore: 0.95,
    rules: [
      {
        condition: 'keywords include ["api", "rest", "endpoint"]',
        adjustment: 0.05,
        description: 'Perfeito para consumir APIs REST'
      },
      {
        condition: 'keywords include ["get", "post", "put", "delete"]',
        adjustment: 0.03,
        description: 'Ideal para requisições HTTP'
      },
      {
        condition: 'keywords include ["download", "baixar", "arquivo"]',
        adjustment: 0.03,
        description: 'Ótimo para download de arquivos'
      },
      {
        condition: 'keywords include ["json", "data"]',
        adjustment: 0.02,
        description: 'Excelente suporte a JSON'
      },
      {
        condition: 'keywords include ["auth", "authentication", "token", "bearer"]',
        adjustment: 0.03,
        description: 'Suporta vários tipos de autenticação'
      },
      {
        condition: 'keywords include ["session", "cookie", "cookies"]',
        adjustment: 0.03,
        description: 'Gerenciamento de sessões integrado'
      },
      {
        condition: 'keywords include ["async", "asyncio", "concurrent"]',
        adjustment: -0.40,
        description: 'Não é assíncrono, use httpx ou aiohttp'
      },
      {
        condition: 'keywords include ["javascript", "render", "dynamic"]',
        adjustment: -0.50,
        description: 'Não renderiza JavaScript, use Selenium/Playwright'
      },
      {
        condition: 'keywords include ["websocket", "ws", "streaming"]',
        adjustment: -0.40,
        description: 'Não suporta WebSockets nativamente'
      }
    ]
  },

  // ==================== CONFIGURAÇÕES ADICIONAIS ====================
  config: {
    maxRetries: 3,
    timeout: 10000,
    cacheable: false,
    requiresAuth: false,
    rateLimit: null
  },

  // ==================== ALTERNATIVAS ====================
  alternatives: [
    {
      name: 'httpx',
      when: 'Requisições assíncronas, HTTP/2, suporte moderno',
      reason: 'httpx é assíncrono e suporta HTTP/2'
    },
    {
      name: 'aiohttp',
      when: 'Async/await, milhares de requisições simultâneas',
      reason: 'aiohttp é totalmente assíncrono e mais rápido em massa'
    },
    {
      name: 'urllib',
      when: 'Biblioteca padrão, sem dependências externas',
      reason: 'urllib vem com Python mas é menos conveniente'
    },
    {
      name: 'Selenium/Playwright',
      when: 'Sites com JavaScript, renderização de browser',
      reason: 'Requisições simples não executam JavaScript'
    }
  ],

  // ==================== DOCUMENTAÇÃO ====================
  documentation: {
    official: 'https://requests.readthedocs.io/',
    examples: 'https://requests.readthedocs.io/en/latest/user/quickstart/',
    apiReference: 'https://requests.readthedocs.io/en/latest/api/'
  },

  // ==================== TROUBLESHOOTING ====================
  commonIssues: [
    {
      issue: 'ConnectionError ou timeout',
      solution: 'Aumentar timeout ou verificar conectividade',
      code: `try:
    response = requests.get(url, timeout=30)
except requests.exceptions.Timeout:
    print("Timeout - servidor demorou muito")
except requests.exceptions.ConnectionError:
    print("Erro de conexão - verificar internet")`
    },
    {
      issue: 'SSL Certificate verification failed',
      solution: 'Atualizar certifi ou desabilitar verificação (não recomendado)',
      code: `# Opção 1: Atualizar certificados
# pip install --upgrade certifi

# Opção 2: Desabilitar (APENAS para desenvolvimento)
response = requests.get(url, verify=False)`
    },
    {
      issue: 'JSON decode error',
      solution: 'Verificar se resposta é realmente JSON',
      code: `if 'application/json' in response.headers.get('content-type', ''):
    data = response.json()
else:
    data = response.text`
    },
    {
      issue: 'Erro 401 Unauthorized',
      solution: 'Verificar autenticação e headers',
      code: `headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}
response = requests.get(url, headers=headers)`
    }
  ],

  // ==================== BEST PRACTICES ====================
  bestPractices: [
    'Sempre adicione timeout para evitar hang infinito',
    'Use try-except para capturar erros de rede',
    'Verifique response.status_code ou use raise_for_status()',
    'Use response.json() ao invés de json.loads(response.text)',
    'Use Session para múltiplas requisições ao mesmo servidor',
    'Configure User-Agent adequado',
    'Use stream=True para arquivos grandes',
    'Feche sessões explicitamente ou use context manager'
  ],

  // ==================== ESTATÍSTICAS ====================
  stats: {
    timesUsed: 0,
    successRate: 0,
    averageExecutionTime: 0,
    lastUsed: null,
    errors: []
  }
};

export default RequestsModule;
