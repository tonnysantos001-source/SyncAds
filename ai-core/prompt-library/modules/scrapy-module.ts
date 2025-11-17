/**
 * SCRAPY MODULE - Web Scraping Framework
 */
import { PromptModule, ModuleCategory, ModuleComplexity, ExecutionEnvironment } from '../registry';

export const ScrapyModule: PromptModule = {
  id: 'scrapy-015',
  name: 'Scrapy',
  packageName: 'scrapy',
  version: '2.11.0',
  category: ModuleCategory.WEB_SCRAPING,
  subcategories: ['crawling', 'scraping', 'spiders', 'pipelines'],
  description: 'Framework completo para web scraping em larga escala. Sistema de spiders, pipelines, middleware e scheduling integrado.',
  purpose: 'Fazer web scraping em larga escala com crawling automático',
  useCases: ['Crawling de sites', 'Scraping em larga escala', 'Data pipelines', 'Monitoramento de preços'],
  complexity: ModuleComplexity.ADVANCED,
  environment: ExecutionEnvironment.PYTHON,
  dependencies: ['twisted', 'lxml', 'parsel'],
  installCommand: 'pip install scrapy',
  promptSystem: {
    systemPrompt: 'Especialista em Scrapy. Crie spiders, use CSS/XPath selectors, configure pipelines e respeite robots.txt.',
    userPromptTemplate: 'Crie spider Scrapy para: {task_description}',
    examples: [{input: 'Spider básico', output: 'import scrapy\nclass MySpider(scrapy.Spider):\n    name = "example"\n    start_urls = ["https://example.com"]\n    def parse(self, response):\n        for title in response.css("h1::text"):\n            yield {"title": title.get()}'}],
    outputFormat: {type: 'object', properties: {success: {type: 'boolean'}, items_scraped: {type: 'number'}, data: {type: 'array'}}}
  },
  tags: ['scrapy', 'scraping', 'crawling', 'spider'],
  keywords: ['scrapy', 'spider', 'crawl', 'scraping', 'large scale'],
  performance: {speed: 9, memory: 7, cpuIntensive: false, gpuAccelerated: false, scalability: 10},
  scoring: {
    baseScore: 0.80,
    rules: [
      {condition: 'keywords include ["large scale", "crawl", "multiple pages"]', adjustment: 0.15, description: 'Ideal para larga escala'},
      {condition: 'keywords include ["single page", "simple"]', adjustment: -0.40, description: 'Use BeautifulSoup para páginas simples'}
    ]
  },
  config: {maxRetries: 3, timeout: 60000, cacheable: false, requiresAuth: false, rateLimit: {maxRequests: 10, windowMs: 1000}},
  alternatives: [{name: 'BeautifulSoup', when: 'Scraping simples', reason: 'BS4 mais simples para casos pequenos'}],
  documentation: {official: 'https://docs.scrapy.org/', examples: 'https://docs.scrapy.org/en/latest/intro/tutorial.html', apiReference: 'https://docs.scrapy.org/en/latest/topics/api.html'},
  commonIssues: [{issue: 'Robots.txt blocked', solution: 'Configure ROBOTSTXT_OBEY', code: 'ROBOTSTXT_OBEY = False  # settings.py'}],
  bestPractices: ['Respeite robots.txt', 'Configure user-agent', 'Use pipelines para processar dados', 'Implemente rate limiting'],
  stats: {timesUsed: 0, successRate: 0, averageExecutionTime: 0, lastUsed: null, errors: []}
};
export default ScrapyModule;
