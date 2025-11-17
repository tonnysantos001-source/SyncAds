import { PromptModule, ModuleCategory, ModuleComplexity, ExecutionEnvironment } from '../registry';
export const SpacyModule: PromptModule = {
  id: 'spacy-022', name: 'spaCy', packageName: 'spacy', version: '3.7.0',
  category: ModuleCategory.NLP,
  subcategories: ['ner', 'pos-tagging', 'dependency-parsing', 'tokenization'],
  description: 'Biblioteca industrial de NLP. NER, POS tagging, dependency parsing, vectores de palavras.',
  purpose: 'Processar texto com NLP avançado e eficiente',
  useCases: ['Named Entity Recognition', 'POS tagging', 'Dependency parsing', 'Similarity', 'Tokenization'],
  complexity: ModuleComplexity.ADVANCED, environment: ExecutionEnvironment.PYTHON,
  dependencies: [], installCommand: 'pip install spacy && python -m spacy download en_core_web_sm',
  promptSystem: {systemPrompt: 'Especialista em spaCy. Use nlp = spacy.load(), sempre processe com nlp(text)', userPromptTemplate: 'Use spaCy para: {task_description}', examples: [{input: 'NER', output: 'import spacy\nnlp = spacy.load("en_core_web_sm")\ndoc = nlp("Apple is in California")\nfor ent in doc.ents:\n    print(ent.text, ent.label_)'}], outputFormat: {type: 'object', properties: {entities: {type: 'array'}}}},
  tags: ['spacy', 'nlp', 'ner'], keywords: ['spacy', 'nlp', 'ner', 'pos', 'parsing'],
  performance: {speed: 8, memory: 7, cpuIntensive: true, gpuAccelerated: false, scalability: 8},
  scoring: {baseScore: 0.88, rules: [{condition: 'keywords include ["ner", "entity", "pos"]', adjustment: 0.10, description: 'Ideal para NLP industrial'}]},
  config: {maxRetries: 2, timeout: 30000, cacheable: true, requiresAuth: false, rateLimit: null},
  alternatives: [{name: 'NLTK', when: 'NLP básico', reason: 'NLTK mais simples'}],
  documentation: {official: 'https://spacy.io/', examples: 'https://spacy.io/usage/examples', apiReference: 'https://spacy.io/api'},
  commonIssues: [{issue: 'Model not found', solution: 'python -m spacy download en_core_web_sm', code: 'spacy.load("en_core_web_sm")'}],
  bestPractices: ['Cache nlp object', 'Use pipeline components', 'Disable unused pipes'],
  stats: {timesUsed: 0, successRate: 0, averageExecutionTime: 0, lastUsed: null, errors: []}
};
export default SpacyModule;
