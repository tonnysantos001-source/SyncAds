import { PromptModule, ModuleCategory, ModuleComplexity, ExecutionEnvironment } from '../registry';
export const MatplotlibModule: PromptModule = {
  id: 'matplotlib-019', name: 'Matplotlib', packageName: 'matplotlib', version: '3.8.0',
  category: ModuleCategory.DATA_VISUALIZATION,
  subcategories: ['plotting', 'charts', 'graphs'],
  description: 'Biblioteca fundamental para visualização de dados em Python. Gráficos de linha, barras, scatter, histogramas e mais.',
  purpose: 'Criar visualizações e gráficos de dados', useCases: ['Gráficos de linha', 'Gráficos de barras', 'Histogramas', 'Scatter plots', 'Subplots'],
  complexity: ModuleComplexity.INTERMEDIATE, environment: ExecutionEnvironment.PYTHON,
  dependencies: ['numpy', 'pillow'], installCommand: 'pip install matplotlib',
  promptSystem: {systemPrompt: 'Especialista em Matplotlib. Use plt.subplots(), configure labels/titles, plt.savefig() para salvar, plt.close() para liberar memória', userPromptTemplate: 'Crie gráfico: {task_description}', examples: [{input: 'Gráfico de linha', output: 'import matplotlib.pyplot as plt\nimport numpy as np\nx = np.linspace(0, 10, 100)\ny = np.sin(x)\nplt.plot(x, y)\nplt.xlabel("X")\nplt.ylabel("Y")\nplt.title("Seno")\nplt.savefig("plot.png")\nplt.close()'}], outputFormat: {type: 'object', properties: {success: {type: 'boolean'}, image_path: {type: 'string'}}}},
  tags: ['matplotlib', 'plot', 'visualization', 'chart'], keywords: ['matplotlib', 'plot', 'graph', 'chart', 'visualization', 'dados'],
  performance: {speed: 7, memory: 7, cpuIntensive: false, gpuAccelerated: false, scalability: 7},
  scoring: {baseScore: 0.90, rules: [{condition: 'keywords include ["plot", "graph", "chart", "visualization"]', adjustment: 0.08, description: 'Ideal para visualização'}]},
  config: {maxRetries: 2, timeout: 30000, cacheable: true, requiresAuth: false, rateLimit: null},
  alternatives: [{name: 'Seaborn', when: 'Gráficos estatísticos', reason: 'Seaborn built on matplotlib'}],
  documentation: {official: 'https://matplotlib.org/', examples: 'https://matplotlib.org/stable/gallery/', apiReference: 'https://matplotlib.org/stable/api/'},
  commonIssues: [{issue: 'Figure not showing', solution: 'Use plt.show() ou plt.savefig()', code: 'plt.show()'}],
  bestPractices: ['Use plt.subplots() ao invés de plt.subplot()', 'Configure figsize adequado', 'Sempre plt.close() após salvar', 'Use tight_layout()'],
  stats: {timesUsed: 0, successRate: 0, averageExecutionTime: 0, lastUsed: null, errors: []}
};
export default MatplotlibModule;
