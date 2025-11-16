# Selenium

## Informações Básicas

- **Nome:** selenium
- **Categoria:** Web Automation, Browser Testing, Web Scraping
- **Versão Mínima:** 4.0.0
- **Versão Recomendada:** 4.15.0+
- **Licença:** Apache 2.0
- **Documentação:** https://www.selenium.dev/documentation/

## Descrição

Selenium é a ferramenta mais estabelecida e amplamente adotada para automação de navegadores web. Com mais de 15 anos de maturidade, oferece suporte robusto para todos os principais browsers através do WebDriver protocol. Ideal para testes automatizados, web scraping de páginas dinâmicas, e automação de tarefas repetitivas na web.

## Casos de Uso Prioritários

1. **Testes Automatizados E2E** (confidence: 0.95)
2. **Web Scraping com JavaScript** (confidence: 0.90)
3. **Automação de Formulários** (confidence: 0.95)
4. **Captura de Screenshots** (confidence: 0.85)
5. **Navegação Complexa** (confidence: 0.90)
6. **Interação com SPAs** (confidence: 0.88)
7. **Integração com CI/CD** (confidence: 0.92)

## Prós

- ✅ Extremamente maduro e estável (15+ anos)
- ✅ Suporte para todos os browsers principais
- ✅ Comunidade gigantesca e ativa
- ✅ Integração com frameworks de teste (pytest, unittest)
- ✅ Documentação extensa e muitos tutoriais
- ✅ Grid support para testes distribuídos
- ✅ Funciona em qualquer plataforma
- ✅ APIs consistentes entre linguagens
- ✅ Suporte comercial disponível

## Contras

- ⚠️ Mais lento que Playwright/Puppeteer
- ⚠️ Setup mais complexo (precisa drivers)
- ⚠️ Waits explícitos requerem mais código
- ⚠️ API um pouco verbosa
- ⚠️ Detecção por anti-bot em alguns sites
- ⚠️ Menos features modernas que Playwright

## Performance

- **Velocidade:** ⭐⭐⭐ (7/10)
- **Uso de Memória:** ⭐⭐⭐ (7/10)
- **Qualidade de Output:** ⭐⭐⭐⭐ (9/10)
- **Facilidade de Uso:** ⭐⭐⭐ (7/10)

## Instalação

```bash
pip install selenium
# Instalar driver do navegador
# Chrome:
pip install webdriver-manager
# Ou baixar chromedriver manualmente
```

## Keywords/Triggers

- selenium
- webdriver
- browser automation
- web testing
- e2e testing
- automated testing
- web scraping
- form filling
- click automation
- browser control
- legacy automation

## Exemplos de Código

### Básico: Abrir Página e Extrair Título

```python
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

def scrape_title(url: str) -> dict:
    # Setup driver
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service)
    
    try:
        # Navegar
        driver.get(url)
        
        # Extrair título
        title = driver.title
        
        return {
            'success': True,
            'output': {
                'title': title,
                'url': driver.current_url
            }
        }
    
    finally:
        driver.quit()
```

### Intermediário: Preencher Formulário

```python
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def fill_form(url: str, form_data: dict) -> dict:
    driver = webdriver.Chrome()
    
    try:
        driver.get(url)
        
        # Esperar página carregar
        wait = WebDriverWait(driver, 10)
        
        # Preencher campos
        if 'name' in form_data:
            name_field = wait.until(
                EC.presence_of_element_located((By.NAME, "name"))
            )
            name_field.send_keys(form_data['name'])
        
        if 'email' in form_data:
            email_field = driver.find_element(By.NAME, "email")
            email_field.send_keys(form_data['email'])
        
        # Submeter
        submit_btn = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
        submit_btn.click()
        
        # Esperar resposta
        wait.until(EC.url_changes(url))
        
        return {
            'success': True,
            'output': {
                'submitted': True,
                'final_url': driver.current_url
            }
        }
    
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }
    
    finally:
        driver.quit()
```

### Avançado: Scraping com Scroll e Wait

```python
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

def scrape_with_scroll(url: str, selector: str) -> dict:
    options = webdriver.ChromeOptions()
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    
    driver = webdriver.Chrome(options=options)
    
    try:
        driver.get(url)
        wait = WebDriverWait(driver, 10)
        
        # Esperar elementos carregarem
        wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, selector)))
        
        # Scroll para carregar mais conteúdo
        last_height = driver.execute_script("return document.body.scrollHeight")
        
        while True:
            # Scroll down
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(2)
            
            # Check se carregou mais
            new_height = driver.execute_script("return document.body.scrollHeight")
            if new_height == last_height:
                break
            last_height = new_height
        
        # Extrair todos os elementos
        elements = driver.find_elements(By.CSS_SELECTOR, selector)
        
        data = []
        for elem in elements:
            data.append({
                'text': elem.text,
                'html': elem.get_attribute('innerHTML')
            })
        
        return {
            'success': True,
            'output': data,
            'metadata': {
                'library_used': 'selenium',
                'items_found': len(data)
            }
        }
    
    finally:
        driver.quit()
```

### Expert: Capturar Screenshot com Waits

```python
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def capture_screenshot(url: str, output_path: str, wait_for_selector: str = None) -> dict:
    options = webdriver.ChromeOptions()
    options.add_argument('--headless')
    options.add_argument('--window-size=1920,1080')
    
    driver = webdriver.Chrome(options=options)
    
    try:
        driver.get(url)
        
        # Esperar elemento específico se fornecido
        if wait_for_selector:
            wait = WebDriverWait(driver, 15)
            wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, wait_for_selector)))
        else:
            # Esperar página carregar
            WebDriverWait(driver, 10).until(
                lambda d: d.execute_script('return document.readyState') == 'complete'
            )
        
        # Capturar screenshot
        driver.save_screenshot(output_path)
        
        # Pegar dimensões
        size = driver.get_window_size()
        
        return {
            'success': True,
            'output': output_path,
            'metadata': {
                'library_used': 'selenium',
                'url': url,
                'dimensions': f"{size['width']}x{size['height']}"
            }
        }
    
    finally:
        driver.quit()
```

## Templates por Caso de Uso

### Template: Basic Scraping

```python
driver = webdriver.Chrome()
driver.get("{url}")
element = driver.find_element(By.CSS_SELECTOR, "{selector}")
data = element.text
driver.quit()
```

### Template: Wait for Element

```python
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

driver = webdriver.Chrome()
driver.get("{url}")
wait = WebDriverWait(driver, 10)
element = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "{selector}")))
driver.quit()
```

### Template: Headless Mode

```python
options = webdriver.ChromeOptions()
options.add_argument('--headless')
options.add_argument('--no-sandbox')
driver = webdriver.Chrome(options=options)
driver.get("{url}")
# ... your code
driver.quit()
```

## Alternativas e Quando Usar

| Biblioteca | Quando Usar em Vez de Selenium |
|------------|--------------------------------|
| Playwright | Precisa velocidade, API moderna, melhor async |
| Puppeteer | Já usa Node.js, precisa apenas Chrome |
| Requests + BeautifulSoup | Site é estático, não precisa JavaScript |
| Scrapy | Projeto grande de scraping estruturado |
| Selenium Grid | Já usa Selenium mas precisa paralelização |

## Requisitos do Sistema

- Python 3.7+
- Browser instalado (Chrome, Firefox, Edge, Safari)
- WebDriver correspondente ao browser
- ~200MB de espaço em disco
- 2GB+ RAM recomendado

## Dependências

```
urllib3>=1.26
trio>=0.17
trio-websocket>=0.9
certifi>=2021.10.8
```

## Notas de Compatibilidade

- ✅ Windows, Linux, macOS
- ✅ Chrome, Firefox, Edge, Safari, Opera
- ✅ Python 3.7-3.12
- ✅ Selenium Grid para execução distribuída
- ⚠️ Requer driver correspondente à versão do browser
- ⚠️ Headless mode pode ter limitações em alguns sites

## Troubleshooting Comum

### Problema: "WebDriver executable not found"

**Solução:**
```python
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service

service = Service(ChromeDriverManager().install())
driver = webdriver.Chrome(service=service)
```

### Problema: ElementNotInteractableException

**Solução:**
```python
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

wait = WebDriverWait(driver, 10)
element = wait.until(EC.element_to_be_clickable((By.ID, "element_id")))
element.click()
```

### Problema: StaleElementReferenceException

**Solução:**
```python
# Re-localizar elemento após mudança no DOM
def safe_click(driver, by, value):
    for attempt in range(3):
        try:
            element = driver.find_element(by, value)
            element.click()
            break
        except StaleElementReferenceException:
            if attempt == 2:
                raise
            time.sleep(1)
```

### Problema: Site detecta Selenium

**Solução:**
```python
options = webdriver.ChromeOptions()
options.add_argument('--disable-blink-features=AutomationControlled')
options.add_experimental_option("excludeSwitches", ["enable-automation"])
options.add_experimental_option('useAutomationExtension', False)
driver = webdriver.Chrome(options=options)
driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
```

## Score de Seleção

```python
def calculate_selenium_score(task_keywords: list, context: dict) -> float:
    base_score = 0.70
    
    # Boost para testes
    if any(k in task_keywords for k in ['test', 'testing', 'e2e', 'automation']):
        base_score += 0.15
    
    # Boost se já usa Selenium no projeto
    if context.get('existing_selenium_usage'):
        base_score += 0.10
    
    # Boost para compatibilidade cross-browser
    if context.get('multiple_browsers_required'):
        base_score += 0.10
    
    # Penalty se precisa velocidade
    if 'fast' in task_keywords or context.get('performance_critical'):
        base_score -= 0.15
    
    # Penalty se tem Playwright disponível e é tarefa nova
    if context.get('playwright_available') and not context.get('legacy_code'):
        base_score -= 0.10
    
    return max(0.5, min(base_score, 0.90))
```

## Integração com Pytest

```python
import pytest
from selenium import webdriver

@pytest.fixture
def browser():
    driver = webdriver.Chrome()
    yield driver
    driver.quit()

def test_homepage(browser):
    browser.get("https://example.com")
    assert "Example" in browser.title
```

## Selenium Grid para Paralelização

```python
from selenium import webdriver
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities

# Conectar ao Grid
driver = webdriver.Remote(
    command_executor='http://selenium-hub:4444/wd/hub',
    desired_capabilities=DesiredCapabilities.CHROME
)

driver.get("https://example.com")
# ... seu código
driver.quit()
```

## Última Atualização

2025-01-15