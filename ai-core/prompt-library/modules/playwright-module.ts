/**
 * PLAYWRIGHT MODULE - Browser Automation Moderno
 */
import { PromptModule, ModuleCategory, ModuleComplexity, ExecutionEnvironment } from '../registry';

export const PlaywrightModule: PromptModule = {
  id: 'playwright-012',
  name: 'Playwright',
  packageName: 'playwright',
  version: '1.40.0',
  category: ModuleCategory.BROWSER_AUTOMATION,
  subcategories: ['web-scraping', 'automation', 'testing', 'screenshots', 'spa-scraping'],
  description: 'Biblioteca moderna para automação de browsers (Chromium, Firefox, WebKit). Ideal para scraping de SPAs, testes e automação com auto-wait inteligente e API async.',
  purpose: 'Automatizar browsers modernos, fazer scraping de sites dinâmicos e realizar testes end-to-end',
  useCases: ['Web scraping de SPAs', 'Automação de formulários', 'Screenshots e PDFs', 'Testes automatizados', 'Monitoramento de sites'],
  complexity: ModuleComplexity.INTERMEDIATE,
  environment: ExecutionEnvironment.PYTHON,
  dependencies: ['greenlet', 'pyee'],
  installCommand: 'pip install playwright && python -m playwright install',
  promptSystem: {
    systemPrompt: 'Especialista em Playwright. Use async/await, auto-wait inteligente, e evite time.sleep(). Sempre feche contexts e browsers.',
    userPromptTemplate: 'Tarefa: {task_description}\nUse Playwright para automatizar browser.',
    examples: [{input: 'Scraping básico', output: 'from playwright.async_api import async_playwright\nasync def scrape():\n    async with async_playwright() as p:\n        browser = await p.chromium.launch()\n        page = await browser.new_page()\n        await page.goto("https://example.com")\n        title = await page.title()\n        await browser.close()\n        return title'}],
    outputFormat: {type: 'object', properties: {success: {type: 'boolean'}, data: {type: 'any'}}}
  },
  tags: ['playwright', 'browser', 'automation', 'scraping'],
  keywords: ['playwright', 'browser', 'headless', 'spa', 'screenshot'],
  performance: {speed: 8, memory: 6, cpuIntensive: true, gpuAccelerated: false, scalability: 8},
  scoring: {
    baseScore: 0.88,
    rules: [
      {condition: 'keywords include ["spa", "javascript", "dynamic"]', adjustment: 0.10, description: 'Ideal para SPAs'},
      {condition: 'keywords include ["screenshot", "pdf"]', adjustment: 0.08, description: 'Capturas nativas'},
      {condition: 'keywords include ["static", "simple"]', adjustment: -0.40, description: 'Use BeautifulSoup para sites estáticos'}
    ]
  },
  config: {maxRetries: 2, timeout: 60000, cacheable: false, requiresAuth: false, rateLimit: null},
  alternatives: [{name: 'Selenium', when: 'Compatibilidade legacy', reason: 'Selenium mais antigo'}],
  documentation: {official: 'https://playwright.dev/', examples: 'https://playwright.dev/python/docs/intro', apiReference: 'https://playwright.dev/python/docs/api/class-playwright'},
  commonIssues: [{issue: 'Timeout', solution: 'Aumentar timeout ou usar wait_for', code: 'await page.wait_for_selector("h1", timeout=30000)'}],
  bestPractices: ['Use auto-wait', 'Sempre feche browser', 'Use headless=True em produção', 'Configure user-agent'],
  stats: {timesUsed: 0, successRate: 0, averageExecutionTime: 0, lastUsed: null, errors: []}
};
export default PlaywrightModule;
