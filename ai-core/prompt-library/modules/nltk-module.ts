import { PromptModule, ModuleCategory, ModuleComplexity, ExecutionEnvironment } from '../registry';
export const NLTKModule: PromptModule = {
  id: 'nltk-023', name: 'NLTK', packageName: 'nltk', version: '3.8.0',
  category: ModuleCategory.NLP,
  subcategories: ['tokenization', 'stemming', 'sentiment'],
  description: 'Natural Language Toolkit. Tokenização, stemming, sentiment, corpora.',
  purpose: 'Processar texto com NLP básico',
  useCases: ['Tokenization', 'Stemming', 'Sentiment analysis', 'Stopwords', 'Frequency distribution'],
  complexity: ModuleComplexity.BASIC, environment: ExecutionEnvironment.PYTHON,
  dependencies: [], installCommand: 'pip install nltk',
  promptSystem: {systemPrompt: 'Especialista em NLTK. Download data com nltk.download(), use word_tokenize', userPromptTemplate: 'Use NLTK para: {task_description}', examples: [{input: 'Tokenize', output: 'import nltk\nnltk.download("punkt")\nfrom nltk.tokenize import word_tokenize\ntokens = word_tokenize("Hello world")'}], outputFormat: {type: 'object', properties: {tokens: {type: 'array'}}}},
  tags: ['nltk', 'nlp', 'tokenize'], keywords: ['nltk', 'tokenize', 'stem', 'sentiment'],
  performance: {speed: 7, memory: 8, cpuIntensive: false, gpuAccelerated: false, scalability: 7},
  scoring: {baseScore: 0.85, rules: [{condition: 'keywords include ["tokenize", "stem", "basic"]', adjustment: 0.08, description: 'Bom para NLP básico'}]},
  config: {maxRetries: 2, timeout: 10000, cacheable: true, requiresAuth: false, rateLimit: null},
  alternatives: [{name: 'spaCy', when: 'NLP industrial', reason: 'spaCy mais rápido'}],
  documentation: {official: 'https://www.nltk.org/', examples: 'https://www.nltk.org/book/', apiReference: 'https://www.nltk.org/api/nltk.html'},
  commonIssues: [{issue: 'Resource not found', solution: 'nltk.download("punkt")', code: 'import nltk; nltk.download("all")'}],
  bestPractices: ['Download data first', 'Use appropriate tokenizer', 'Cache resources'],
  stats: {timesUsed: 0, successRate: 0, averageExecutionTime: 0, lastUsed: null, errors: []}
};
export default NLTKModule;
