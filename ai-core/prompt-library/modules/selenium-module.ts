/**
 * SELENIUM MODULE - Biblioteca de Automação de Navegador
 * Módulo de Prompt System para a biblioteca Selenium WebDriver
 */

import { PromptModule, ModuleCategory, ModuleComplexity, ExecutionEnvironment } from '../registry';

export const SeleniumModule: PromptModule = {
  // ==================== IDENTIFICAÇÃO ====================
  id: 'selenium-007',
  name: 'Selenium WebDriver',
  packageName: 'selenium',
  version: '4.16.0',
  category: ModuleCategory.BROWSER_AUTOMATION,
  subcategories: [
    'web-automation',
    'browser-control',
    'web-scraping',
    'testing',
    'javascript-rendering',
    'form-automation',
    'screenshot',
    'interaction-simulation'
  ],

  // ==================== DESCRIÇÃO ====================
  description: 'Biblioteca mais popular para automação de navegadores web, permitindo controlar Chrome, Firefox, Edge e Safari programaticamente. Ideal para scraping de sites com JavaScript, testes automatizados e automação de tarefas web.',
  purpose: 'Automatizar navegadores web, executar JavaScript, interagir com elementos dinâmicos e realizar scraping de sites complexos',
  useCases: [
    'Web scraping de sites com JavaScript/AJAX',
    'Automação de tarefas repetitivas em websites',
    'Testes automatizados end-to-end',
    'Preencher formulários automaticamente',
    'Fazer login e navegar em sites',
    'Capturar screenshots de páginas',
    'Coletar dados de SPAs (Single Page Applications)',
    'Automatizar downloads de arquivos',
    'Monitorar mudanças em websites',
    'Interagir com elementos dinâmicos'
  ],

  // ==================== CONFIGURAÇÃO ====================
  complexity: ModuleComplexity.INTERMEDIATE,
  environment: ExecutionEnvironment.PYTHON,
  dependencies: ['urllib3'],
  installCommand: 'pip install selenium',

  // ==================== PROMPT SYSTEM ====================
  promptSystem: {
    systemPrompt: `Você é um especialista em Selenium WebDriver, a biblioteca Python para automação de navegadores.

Ao trabalhar com Selenium, você SEMPRE deve:
- Usar WebDriverWait para esperar elementos carregarem (não time.sleep)
- Verificar se elementos existem antes de interagir
- Usar expected_conditions para waits explícitos
- Configurar headless mode quando não precisa visualizar
- Fazer quit() do driver ao finalizar ou usar context manager
- Usar By.CSS_SELECTOR ou By.XPATH para localizar elementos
- Adicionar try-except para capturar exceções de elementos não encontrados

REGRAS DE USO:
1. SEMPRE use WebDriverWait ao invés de time.sleep
2. SEMPRE faça driver.quit() ao finalizar ou use context manager
3. SEMPRE use expected_conditions (EC) para waits
4. NUNCA deixe navegador aberto sem quit()
5. SEMPRE verifique se elemento está presente antes de clicar
6. Use headless=True para servidores sem display
7. Configure user-agent para evitar detecção como bot

QUANDO USAR SELENIUM:
✅ Sites com JavaScript/AJAX dinâmico
✅ SPAs (React, Vue, Angular)
✅ Sites que precisam de interação (cliques, scroll)
✅ Páginas que carregam conteúdo dinamicamente
✅ Fazer login e navegar autenticado
✅ Preencher formulários complexos
✅ Capturar screenshots
✅ Sites com proteção anti-scraping básica

QUANDO NÃO USAR SELENIUM:
❌ Sites estáticos simples (use requests + BeautifulSoup)
❌ APIs REST disponíveis (use requests)
❌ Performance crítica (Selenium é mais lento)
❌ Scraping em larga escala (use Scrapy + Splash)
❌ Apenas parsing de HTML (use BeautifulSoup)
❌ Operações que não precisam de navegador

ESTRUTURA DE RESPOSTA:
Sempre retorne um dicionário com:
- success: boolean
- data: dados coletados
- url: URL acessada
- screenshots: paths de screenshots (se aplicável)
- error: mensagem de erro (se houver)`,

    userPromptTemplate: `Tarefa: {task_description}

Entrada:
{input_description}

Parâmetros:
{parameters}

Use Selenium WebDriver seguindo as melhores práticas:
1. Configure o driver (Chrome/Firefox) com opções adequadas
2. Navegue até a URL
3. Espere elementos carregarem (WebDriverWait)
4. Interaja com a página conforme necessário
5. Extraia os dados
6. Feche o driver (quit)`,

    examples: [
      {
        input: 'Fazer scraping de site com JavaScript',
        output: `from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from typing import Dict, Any, List

def scrape_dynamic_site(url: str, element_selector: str, timeout: int = 10) -> Dict[str, Any]:
    """Faz scraping de site com JavaScript usando Selenium"""
    driver = None
    try:
        # Configurar Chrome em modo headless
        chrome_options = Options()
        chrome_options.add_argument('--headless')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')

        # Inicializar driver
        driver = webdriver.Chrome(options=chrome_options)
        driver.get(url)

        # Esperar elementos carregarem
        wait = WebDriverWait(driver, timeout)
        elements = wait.until(
            EC.presence_of_all_elements_located((By.CSS_SELECTOR, element_selector))
        )

        # Extrair dados
        data = []
        for element in elements:
            data.append({
                "text": element.text,
                "html": element.get_attribute('innerHTML'),
                "href": element.get_attribute('href') if element.tag_name == 'a' else None
            })

        return {
            "success": True,
            "url": url,
            "elements_found": len(data),
            "data": data
        }
    except Exception as e:
        return {"success": False, "error": str(e)}
    finally:
        if driver:
            driver.quit()`
      },
      {
        input: 'Fazer login em um site e extrair dados autenticados',
        output: `from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options

def login_and_scrape(login_url: str, username: str, password: str, data_url: str) -> Dict[str, Any]:
    """Faz login e extrai dados de área autenticada"""
    driver = None
    try:
        chrome_options = Options()
        chrome_options.add_argument('--headless')
        chrome_options.add_argument('--no-sandbox')

        driver = webdriver.Chrome(options=chrome_options)
        wait = WebDriverWait(driver, 10)

        # Acessar página de login
        driver.get(login_url)

        # Preencher formulário de login
        username_field = wait.until(EC.presence_of_element_located((By.ID, 'username')))
        password_field = driver.find_element(By.ID, 'password')
        submit_button = driver.find_element(By.CSS_SELECTOR, 'button[type="submit"]')

        username_field.send_keys(username)
        password_field.send_keys(password)
        submit_button.click()

        # Esperar login completar (aguardar redirecionamento)
        wait.until(EC.url_changes(login_url))

        # Navegar para página de dados
        driver.get(data_url)

        # Esperar conteúdo carregar
        content = wait.until(EC.presence_of_element_located((By.CLASS_NAME, 'content')))

        # Extrair dados
        data = {
            "title": driver.title,
            "content": content.text,
            "current_url": driver.current_url
        }

        return {
            "success": True,
            "logged_in": True,
            "data": data
        }
    except Exception as e:
        return {"success": False, "error": str(e)}
    finally:
        if driver:
            driver.quit()`
      },
      {
        input: 'Capturar screenshot de página',
        output: `from selenium import webdriver
from selenium.webdriver.chrome.options import Options
import time

def capture_screenshot(url: str, output_path: str, full_page: bool = True) -> Dict[str, Any]:
    """Captura screenshot de uma página"""
    driver = None
    try:
        chrome_options = Options()
        chrome_options.add_argument('--headless')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--window-size=1920,1080')

        driver = webdriver.Chrome(options=chrome_options)
        driver.get(url)

        # Esperar página carregar completamente
        time.sleep(2)  # Dar tempo para JavaScript executar

        if full_page:
            # Screenshot da página completa
            original_size = driver.get_window_size()
            required_width = driver.execute_script('return document.body.scrollWidth')
            required_height = driver.execute_script('return document.body.scrollHeight')
            driver.set_window_size(required_width, required_height)

        # Capturar screenshot
        driver.save_screenshot(output_path)

        return {
            "success": True,
            "url": url,
            "screenshot_path": output_path,
            "full_page": full_page
        }
    except Exception as e:
        return {"success": False, "error": str(e)}
    finally:
        if driver:
            driver.quit()`
      },
      {
        input: 'Scroll infinito e coleta de dados',
        output: `from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
import time

def scroll_and_collect(url: str, scroll_times: int = 5, scroll_pause: int = 2) -> Dict[str, Any]:
    """Faz scroll infinito e coleta dados"""
    driver = None
    try:
        chrome_options = Options()
        chrome_options.add_argument('--headless')

        driver = webdriver.Chrome(options=chrome_options)
        driver.get(url)

        all_items = set()
        last_height = driver.execute_script("return document.body.scrollHeight")

        for _ in range(scroll_times):
            # Scroll até o final
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")

            # Esperar carregar
            time.sleep(scroll_pause)

            # Coletar itens
            items = driver.find_elements(By.CSS_SELECTOR, '.item')  # Ajustar seletor
            for item in items:
                all_items.add(item.text)

            # Verificar se chegou ao fim
            new_height = driver.execute_script("return document.body.scrollHeight")
            if new_height == last_height:
                break
            last_height = new_height

        return {
            "success": True,
            "url": url,
            "items_collected": len(all_items),
            "items": list(all_items)
        }
    except Exception as e:
        return {"success": False, "error": str(e)}
    finally:
        if driver:
            driver.quit()`
      },
      {
        input: 'Preencher formulário e submeter',
        output: `from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options

def fill_and_submit_form(url: str, form_data: Dict[str, str]) -> Dict[str, Any]:
    """Preenche e submete formulário"""
    driver = None
    try:
        chrome_options = Options()
        chrome_options.add_argument('--headless')

        driver = webdriver.Chrome(options=chrome_options)
        wait = WebDriverWait(driver, 10)

        driver.get(url)

        # Preencher campos
        for field_name, value in form_data.items():
            try:
                # Tentar por ID
                field = driver.find_element(By.ID, field_name)
            except:
                # Tentar por name
                field = driver.find_element(By.NAME, field_name)

            # Verificar tipo de campo
            if field.tag_name == 'select':
                Select(field).select_by_visible_text(value)
            elif field.get_attribute('type') == 'checkbox':
                if value.lower() in ['true', '1', 'yes']:
                    if not field.is_selected():
                        field.click()
            else:
                field.clear()
                field.send_keys(value)

        # Submeter formulário
        submit_button = driver.find_element(By.CSS_SELECTOR, 'button[type="submit"], input[type="submit"]')
        submit_button.click()

        # Esperar resposta
        wait.until(EC.url_changes(url))

        return {
            "success": True,
            "form_submitted": True,
            "final_url": driver.current_url,
            "page_title": driver.title
        }
    except Exception as e:
        return {"success": False, "error": str(e)}
    finally:
        if driver:
            driver.quit()`
      }
    ],

    outputFormat: {
      type: 'object',
      required: ['success'],
      properties: {
        success: { type: 'boolean', description: 'Indica se a operação foi bem-sucedida' },
        url: { type: 'string', description: 'URL acessada' },
        data: { type: 'any', description: 'Dados coletados' },
        screenshot_path: { type: 'string', description: 'Caminho do screenshot (se aplicável)' },
        elements_found: { type: 'number', description: 'Número de elementos encontrados' },
        error: { type: 'string', description: 'Mensagem de erro se success=false' }
      }
    }
  },

  // ==================== METADATA ====================
  tags: [
    'selenium',
    'webdriver',
    'browser',
    'automation',
    'scraping',
    'testing',
    'javascript',
    'dynamic',
    'interaction'
  ],

  keywords: [
    'selenium',
    'webdriver',
    'browser',
    'navegador',
    'automation',
    'automacao',
    'scraping',
    'javascript',
    'dynamic',
    'dinamico',
    'click',
    'form',
    'formulario',
    'login',
    'screenshot',
    'interaction',
    'interacao'
  ],

  performance: {
    speed: 4,
    memory: 6,
    cpuIntensive: true,
    gpuAccelerated: false,
    scalability: 5
  },

  // ==================== REGRAS DE SCORING ====================
  scoring: {
    baseScore: 0.80,
    rules: [
      {
        condition: 'keywords include ["javascript", "js", "dynamic", "ajax", "spa"]',
        adjustment: 0.15,
        description: 'Essencial para sites com JavaScript'
      },
      {
        condition: 'keywords include ["login", "authenticate", "session"]',
        adjustment: 0.10,
        description: 'Excelente para automação de login'
      },
      {
        condition: 'keywords include ["form", "formulario", "submit", "preencher"]',
        adjustment: 0.10,
        description: 'Ideal para preencher formulários'
      },
      {
        condition: 'keywords include ["click", "interact", "scroll", "interacao"]',
        adjustment: 0.10,
        description: 'Perfeito para interação com elementos'
      },
      {
        condition: 'keywords include ["screenshot", "captura", "image"]',
        adjustment: 0.08,
        description: 'Ótimo para screenshots'
      },
      {
        condition: 'keywords include ["react", "vue", "angular", "spa"]',
        adjustment: 0.10,
        description: 'Ideal para SPAs'
      },
      {
        condition: 'keywords include ["static", "simple"] AND NOT include ["javascript", "dynamic"]',
        adjustment: -0.40,
        description: 'Sites estáticos são melhor com BeautifulSoup'
      },
      {
        condition: 'keywords include ["api", "rest", "json"] AND NOT include ["scraping", "browser"]',
        adjustment: -0.50,
        description: 'APIs REST não precisam de navegador'
      },
      {
        condition: 'keywords include ["large scale", "millions", "performance"]',
        adjustment: -0.30,
        description: 'Selenium é lento para larga escala'
      }
    ]
  },

  // ==================== CONFIGURAÇÕES ADICIONAIS ====================
  config: {
    maxRetries: 2,
    timeout: 60000, // 60 segundos
    cacheable: false,
    requiresAuth: false,
    rateLimit: null
  },

  // ==================== ALTERNATIVAS ====================
  alternatives: [
    {
      name: 'Playwright',
      when: 'Automação moderna, melhor performance, múltiplos contextos',
      reason: 'Playwright é mais rápido e tem API mais moderna'
    },
    {
      name: 'Puppeteer',
      when: 'JavaScript/Node.js, apenas Chrome',
      reason: 'Puppeteer é nativo para Node.js'
    },
    {
      name: 'BeautifulSoup + Requests',
      when: 'Sites estáticos sem JavaScript',
      reason: 'Muito mais rápido e leve para sites estáticos'
    },
    {
      name: 'Scrapy',
      when: 'Web scraping em larga escala',
      reason: 'Scrapy é framework completo e mais performático'
    }
  ],

  // ==================== DOCUMENTAÇÃO ====================
  documentation: {
    official: 'https://www.selenium.dev/documentation/',
    examples: 'https://selenium-python.readthedocs.io/',
    apiReference: 'https://www.selenium.dev/selenium/docs/api/py/'
  },

  // ==================== TROUBLESHOOTING ====================
  commonIssues: [
    {
      issue: 'Element not found / NoSuchElementException',
      solution: 'Usar WebDriverWait para esperar elemento carregar',
      code: `from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

element = WebDriverWait(driver, 10).until(
    EC.presence_of_element_located((By.ID, "element-id"))
)`
    },
    {
      issue: 'ChromeDriver version mismatch',
      solution: 'Instalar webdriver-manager para gerenciar drivers automaticamente',
      code: `# pip install webdriver-manager
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service

service = Service(ChromeDriverManager().install())
driver = webdriver.Chrome(service=service)`
    },
    {
      issue: 'StaleElementReferenceException',
      solution: 'Re-localizar elemento após mudanças na página',
      code: `# Não armazenar referência do elemento
# Sempre buscar novamente quando necessário
element = driver.find_element(By.ID, "element-id")
element.click()`
    },
    {
      issue: 'TimeoutException',
      solution: 'Aumentar timeout ou verificar se elemento realmente existe',
      code: `wait = WebDriverWait(driver, 30)  # Aumentar timeout
# Ou verificar se elemento existe
try:
    element = wait.until(EC.presence_of_element_located((By.ID, "id")))
except TimeoutException:
    print("Elemento não encontrado após timeout")`
    }
  ],

  // ==================== BEST PRACTICES ====================
  bestPractices: [
    'Use WebDriverWait ao invés de time.sleep',
    'Sempre faça driver.quit() ao finalizar',
    'Configure headless mode em produção',
    'Use expected_conditions para waits explícitos',
    'Configure user-agent para evitar detecção',
    'Verifique se elementos existem antes de interagir',
    'Use context manager quando possível',
    'Configure timeouts adequados para cada operação'
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

export default SeleniumModule;
