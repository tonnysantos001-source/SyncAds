import { PromptModule, ModuleCategory, ModuleComplexity, ExecutionEnvironment } from '../registry';
export const SeabornModule: PromptModule = {
  id: 'seaborn-020', name: 'Seaborn', packageName: 'seaborn', version: '0.13.0',
  category: ModuleCategory.DATA_VISUALIZATION,
  subcategories: ['statistical-plots', 'heatmaps', 'distributions'],
  description: 'Biblioteca de visualização estatística built on matplotlib. Gráficos elegantes e informativos com poucas linhas.',
  purpose: 'Criar visualizações estatísticas bonitas', useCases: ['Heatmaps', 'Distributions', 'Regression plots', 'Categorical plots', 'Pair plots'],
  complexity: ModuleComplexity.BASIC, environment: ExecutionEnvironment.PYTHON,
  dependencies: ['matplotlib', 'pandas', 'numpy'], installCommand: 'pip install seaborn',
  promptSystem: {systemPrompt: 'Especialista em Seaborn. Use sns.set_theme(), trabalhe com DataFrames, configure palettes', userPromptTemplate: 'Crie visualização estatística: {task_description}', examples: [{input: 'Heatmap', output: 'import seaborn as sns\nimport matplotlib.pyplot as plt\nimport numpy as np\ndata = np.random.rand(10, 12)\nsns.heatmap(data, annot=True)\nplt.savefig("heatmap.png")\nplt.close()'}], outputFormat: {type: 'object', properties: {success: {type: 'boolean'}, image_path: {type: 'string'}}}},
  tags: ['seaborn', 'visualization', 'statistical'], keywords: ['seaborn', 'sns', 'heatmap', 'distribution', 'statistical', 'plot'],
  performance: {speed: 7, memory: 7, cpuIntensive: false, gpuAccelerated: false, scalability: 7},
  scoring: {baseScore: 0.88, rules: [{condition: 'keywords include ["heatmap", "distribution", "statistical"]', adjustment: 0.10, description: 'Ideal para gráficos estatísticos'}]},
  config: {maxRetries: 2, timeout: 30000, cacheable: true, requiresAuth: false, rateLimit: null},
  alternatives: [{name: 'Matplotlib', when: 'Controle fino', reason: 'Matplotlib mais flexível'}],
  documentation: {official: 'https://seaborn.pydata.org/', examples: 'https://seaborn.pydata.org/examples/', apiReference: 'https://seaborn.pydata.org/api.html'},
  commonIssues: [{issue: 'Style not applied', solution: 'Use sns.set_theme()', code: 'sns.set_theme(style="darkgrid")'}],
  bestPractices: ['Use sns.set_theme() no início', 'Trabalhe com pandas DataFrames', 'Configure palette consistente'],
  stats: {timesUsed: 0, successRate: 0, averageExecutionTime: 0, lastUsed: null, errors: []}
};
export default SeabornModule;
