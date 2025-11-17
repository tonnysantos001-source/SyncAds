/**
 * HTTPX MODULE - HTTP Client Assíncrono
 */
import { PromptModule, ModuleCategory, ModuleComplexity, ExecutionEnvironment } from '../registry';

export const HTTPXModule: PromptModule = {
  id: 'httpx-014',
  name: 'HTTPX',
  packageName: 'httpx',
  version: '0.25.0',
  category: ModuleCategory.WEB_SCRAPING,
  subcategories: ['http-client', 'async', 'api', 'rest'],
  description: 'Cliente HTTP moderno com suporte a HTTP/2, async/await e API similar ao requests. Ideal para APIs REST assíncronas.',
  purpose: 'Fazer requisições HTTP assíncronas com performance superior',
  useCases: ['APIs REST async', 'HTTP/2', 'Requisições simultâneas', 'Streaming de dados'],
  complexity: ModuleComplexity.INTERMEDIATE,
  environment: ExecutionEnvironment.PYTHON,
  dependencies: ['httpcore', 'certifi'],
  installCommand: 'pip install httpx',
  promptSystem: {
    systemPrompt: 'Especialista em HTTPX. Use async/await, timeout adequado, e close() em clients.',
    userPromptTemplate: 'Use HTTPX para requisições HTTP assíncronas: {task_description}',
    examples: [{input: 'GET async', output: 'import httpx\nasync def fetch():\n    async with httpx.AsyncClient() as client:\n        response = await client.get("https://api.example.com")\n        return response.json()'}],
    outputFormat: {type: 'object', properties: {success: {type: 'boolean'}, data: {type: 'any'}, status_code: {type: 'number'}}}
  },
  tags: ['httpx', 'http', 'async', 'api'],
  keywords: ['httpx', 'http', 'async', 'http2', 'rest', 'api'],
  performance: {speed: 9, memory: 8, cpuIntensive: false, gpuAccelerated: false, scalability: 9},
  scoring: {
    baseScore: 0.85,
    rules: [
      {condition: 'keywords include ["async", "concurrent", "multiple"]', adjustment: 0.10, description: 'Ideal para async'},
      {condition: 'keywords include ["http2"]', adjustment: 0.05, description: 'Suporte nativo HTTP/2'},
      {condition: 'keywords include ["simple", "single request"]', adjustment: -0.10, description: 'requests é mais simples'}
    ]
  },
  config: {maxRetries: 3, timeout: 30000, cacheable: false, requiresAuth: false, rateLimit: null},
  alternatives: [{name: 'requests', when: 'Síncrono, simplicidade', reason: 'requests mais simples para casos síncronos'}],
  documentation: {official: 'https://www.python-httpx.org/', examples: 'https://www.python-httpx.org/quickstart/', apiReference: 'https://www.python-httpx.org/api/'},
  commonIssues: [{issue: 'Connection pool limit', solution: 'Configurar limits em AsyncClient', code: 'limits = httpx.Limits(max_keepalive_connections=5)'}],
  bestPractices: ['Use AsyncClient context manager', 'Configure timeout', 'Reutilize client para múltiplas requests', 'Use limits para pool'],
  stats: {timesUsed: 0, successRate: 0, averageExecutionTime: 0, lastUsed: null, errors: []}
};
export default HTTPXModule;
