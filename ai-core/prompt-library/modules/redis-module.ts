import { PromptModule, ModuleCategory, ModuleComplexity, ExecutionEnvironment } from '../registry';
export const RedisModule: PromptModule = {
  id: 'redis-021', name: 'Redis-py', packageName: 'redis', version: '5.0.0',
  category: ModuleCategory.DATABASE,
  subcategories: ['cache', 'key-value', 'nosql', 'queue'],
  description: 'Cliente Python para Redis. Cache, sessions, queues, pub/sub, rate limiting com performance extrema.',
  purpose: 'Trabalhar com Redis para cache e dados em memória', useCases: ['Cache de dados', 'Session storage', 'Task queues', 'Rate limiting', 'Pub/Sub'],
  complexity: ModuleComplexity.BASIC, environment: ExecutionEnvironment.PYTHON,
  dependencies: [], installCommand: 'pip install redis',
  promptSystem: {systemPrompt: 'Especialista em Redis. Use connection pools, configure timeout, use pipeline para múltiplas ops, sempre trate ConnectionError', userPromptTemplate: 'Use Redis para: {task_description}', examples: [{input: 'Set/Get cache', output: 'import redis\nr = redis.Redis(host="localhost", port=6379, decode_responses=True)\nr.set("key", "value", ex=3600)\nvalue = r.get("key")'}], outputFormat: {type: 'object', properties: {success: {type: 'boolean'}, value: {type: 'any'}}}},
  tags: ['redis', 'cache', 'nosql'], keywords: ['redis', 'cache', 'key-value', 'memory', 'queue', 'session'],
  performance: {speed: 10, memory: 9, cpuIntensive: false, gpuAccelerated: false, scalability: 10},
  scoring: {baseScore: 0.92, rules: [{condition: 'keywords include ["cache", "session", "queue"]', adjustment: 0.08, description: 'Perfeito para cache'}]},
  config: {maxRetries: 3, timeout: 5000, cacheable: false, requiresAuth: false, rateLimit: null},
  alternatives: [{name: 'Memcached', when: 'Cache simples', reason: 'Memcached mais simples'}],
  documentation: {official: 'https://redis-py.readthedocs.io/', examples: 'https://redis-py.readthedocs.io/en/stable/examples.html', apiReference: 'https://redis-py.readthedocs.io/en/stable/commands.html'},
  commonIssues: [{issue: 'Connection refused', solution: 'Verificar se Redis está rodando', code: 'redis-cli ping'}],
  bestPractices: ['Use connection pools', 'Configure expire em chaves', 'Use pipeline para batch', 'Trate ConnectionError'],
  stats: {timesUsed: 0, successRate: 0, averageExecutionTime: 0, lastUsed: null, errors: []}
};
export default RedisModule;
