import { PromptModule, ModuleCategory, ModuleComplexity, ExecutionEnvironment } from '../registry';
export const CeleryModule: PromptModule = {
  id: 'celery-024', name: 'Celery', packageName: 'celery', version: '5.3.0',
  category: ModuleCategory.AUTOMATION,
  subcategories: ['task-queue', 'async', 'scheduling'],
  description: 'Task queue distribuída para Python. Background tasks, scheduling, workers.',
  purpose: 'Executar tarefas assíncronas e agendadas',
  useCases: ['Background tasks', 'Scheduled jobs', 'Distributed processing', 'Email sending', 'Report generation'],
  complexity: ModuleComplexity.ADVANCED, environment: ExecutionEnvironment.PYTHON,
  dependencies: ['redis', 'kombu'], installCommand: 'pip install celery redis',
  promptSystem: {systemPrompt: 'Especialista em Celery. Use @app.task decorator, delay() para async', userPromptTemplate: 'Use Celery para: {task_description}', examples: [{input: 'Task async', output: 'from celery import Celery\napp = Celery("tasks", broker="redis://localhost")\n@app.task\ndef add(x, y):\n    return x + y\nresult = add.delay(4, 4)'}], outputFormat: {type: 'object', properties: {task_id: {type: 'string'}}}},
  tags: ['celery', 'queue', 'async'], keywords: ['celery', 'task', 'queue', 'async', 'worker'],
  performance: {speed: 8, memory: 7, cpuIntensive: false, gpuAccelerated: false, scalability: 10},
  scoring: {baseScore: 0.90, rules: [{condition: 'keywords include ["async", "task", "queue", "background"]', adjustment: 0.10, description: 'Perfeito para tasks assíncronas'}]},
  config: {maxRetries: 3, timeout: 300000, cacheable: false, requiresAuth: false, rateLimit: null},
  alternatives: [{name: 'RQ', when: 'Queue simples', reason: 'RQ mais leve'}],
  documentation: {official: 'https://docs.celeryq.dev/', examples: 'https://docs.celeryq.dev/en/stable/getting-started/first-steps-with-celery.html', apiReference: 'https://docs.celeryq.dev/en/stable/reference/'},
  commonIssues: [{issue: 'Broker connection refused', solution: 'Start Redis', code: 'redis-server'}],
  bestPractices: ['Use broker (Redis/RabbitMQ)', 'Configure retries', 'Monitor workers', 'Use result backend'],
  stats: {timesUsed: 0, successRate: 0, averageExecutionTime: 0, lastUsed: null, errors: []}
};
export default CeleryModule;
