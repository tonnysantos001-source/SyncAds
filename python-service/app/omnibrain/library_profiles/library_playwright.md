# Playwright

## Informações Básicas

- **Nome:** playwright
- **Categoria:** Web Scraping, Browser Automation, Testing
- **Versão Mínima:** 1.30.0
- **Versão Recomendada:** 1.40.0+
- **Licença:** Apache 2.0
- **Documentação:** https://playwright.dev/python/

## Descrição

Playwright é uma biblioteca moderna e poderosa para automação de browsers desenvolvida pela Microsoft. Suporta Chromium, Firefox e WebKit com uma API única, permitindo scraping avançado, testes end-to-end e automação de tarefas web com execução headless ou com interface gráfica.

## Casos de Uso Prioritários

1. **Web Scraping Avançado** (confidence: 0.95)
2. **Automação de Formulários** (confidence: 0.95)
3. **Captura de Screenshots/PDFs** (confidence: 0.90)
4. **Scraping de SPAs/JavaScript** (confidence: 0.95)
5. **Testes Automatizados** (confidence: 0.90)
6. **Monitoramento de Sites** (confidence: 0.85)
7. **Data Extraction Complexa** (confidence: 0.90)

## Prós

- ✅ Suporta múltiplos browsers (Chromium, Firefox, WebKit)
- ✅ Auto-wait inteligente (sem sleeps manuais)
- ✅ Execução headless super rápida
- ✅ Interceptação de network requests
- ✅ Captura de screenshots e PDFs
- ✅ Geolocation e mobile emulation
- ✅ API async/await nativa
- ✅ Debugging tools excelentes
- ✅ Cross-platform (Windows, Linux, macOS)
- ✅ Manutenção ativa pela Microsoft

## Contras

- ⚠️ Instalação grande (~300MB com browsers)
- ⚠️ Usa mais recursos que requests/BeautifulSoup
- ⚠️ Curva de aprendizado moderada
- ⚠️ Requer async/await (Python 3.7+)
- ⚠️ Pode ser bloqueado por anti-bot sofisticados

## Performance

- **Velocidade:** ⭐⭐⭐⭐ (8.5/10)
- **Uso de Memória:** ⭐⭐⭐ (6/10)
- **Qualidade de Output:** ⭐⭐⭐⭐⭐ (10/10)
- **Facilidade de Uso:** ⭐⭐⭐⭐ (8/10)

## Instalação

```bash
pip install playwright
python -m playwright install  # Baixa browsers
```

## Keywords/Triggers

- playwright
- web scraping
- browser automation
- headless browser
- screenshot
- pdf generation
- form automation
- spa scraping
- javascript rendering
- web testing

## Exemplos de Código

### Básico: Scraping Simples

```python
from playwright.sync_api import sync_playwright

def scrape_page(url: str) -> dict:
    with sync_playwright() as p:
        # Lançar browser
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # Navegar
        page.goto(url)
        
        # Extrair dados
        title = page.title()
        content = page.content()
        
        browser.close()
        
        return {
            "title": title,
            "html": content,
            "url": url
        }
```

### Intermediário: Capturar Screenshot

```python
from playwright.sync_api import sync_playwright

def capture_screenshot(url: str, output_path: str, full_page: bool = True):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1920, 'height': 1080})
        
        # Navegar
        page.goto(url, wait_until='networkidle')
        
        # Capturar screenshot
        page.screenshot(
            path=output_path,
            full_page=full_page,
            type='png'
        )
        
        browser.close()
        
        return {
            "output_path": output_path,
            "url": url,
            "full_page": full_page
        }
```

### Avançado: Scraping com Espera e Seletores

```python
from playwright.sync_api import sync_playwright

def scrape_products(url: str) -> list:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        page.goto(url, wait_until='domcontentloaded')
        
        # Esperar elementos carregarem
        page.wait_for_selector('.product-item', timeout=10000)
        
        # Extrair produtos
        products = []
        items = page.query_selector_all('.product-item')
        
        for item in items:
            title = item.query_selector('.product-title')
            price = item.query_selector('.product-price')
            image = item.query_selector('img')
            
            products.append({
                "title": title.inner_text() if title else "",
                "price": price.inner_text() if price else "",
                "image": image.get_attribute('src') if image else ""
            })
        
        browser.close()
        
        return products
```

### Expert: Automação de Formulário

```python
from playwright.sync_api import sync_playwright

def fill_and_submit_form(url: str, form_data: dict) -> dict:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)  # Com UI para debug
        page = browser.new_page()
        
        page.goto(url)
        
        # Preencher campos
        if 'name' in form_data:
            page.fill('input[name="name"]', form_data['name'])
        
        if 'email' in form_data:
            page.fill('input[name="email"]', form_data['email'])
        
        if 'message' in form_data:
            page.fill('textarea[name="message"]', form_data['message'])
        
        # Capturar antes de submeter
        page.screenshot(path='before_submit.png')
        
        # Submeter formulário
        page.click('button[type="submit"]')
        
        # Esperar resposta
        page.wait_for_load_state('networkidle')
        
        # Verificar sucesso
        success = page.query_selector('.success-message') is not None
        
        # Capturar resultado
        page.screenshot(path='after_submit.png')
        
        browser.close()
        
        return {
            "success": success,
            "url": page.url,
            "screenshots": ['before_submit.png', 'after_submit.png']
        }
```

### Expert: Gerar PDF

```python
from playwright.sync_api import sync_playwright

def generate_pdf(url: str, output_path: str, options: dict = None):
    default_options = {
        'format': 'A4',
        'margin': {'top': '1cm', 'right': '1cm', 'bottom': '1cm', 'left': '1cm'},
        'print_background': True,
        'prefer_css_page_size': False
    }
    
    pdf_options = {**default_options, **(options or {})}
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        page.goto(url, wait_until='networkidle')
        
        # Gerar PDF
        page.pdf(path=output_path, **pdf_options)
        
        browser.close()
        
        return {
            "output_path": output_path,
            "url": url,
            "options": pdf_options
        }
```

## Templates por Caso de Uso

### Template: Basic Scraping

```python
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("{url}")
    content = page.content()
    browser.close()
```

### Template: Screenshot

```python
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.goto("{url}")
    page.screenshot(path="{output_path}", full_page=True)
    browser.close()
```

### Template: Wait and Extract

```python
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("{url}")
    page.wait_for_selector("{selector}")
    elements = page.query_selector_all("{selector}")
    data = [el.inner_text() for el in elements]
    browser.close()
```

## Alternativas e Quando Usar

| Biblioteca | Quando Usar em Vez de Playwright |
|------------|----------------------------------|
| Selenium | Compatibilidade com sistemas legados |
| BeautifulSoup + requests | Sites estáticos simples, velocidade máxima |
| Scrapy | Projetos grandes de scraping estruturado |
| Puppeteer | Já usa Node.js no projeto |
| httpx | APIs REST, sem necessidade de browser |

## Requisitos do Sistema

- Python 3.7+
- ~300MB de espaço (browsers inclusos)
- 2GB+ RAM recomendado
- Conexão de internet (primeira instalação)

## Dependências

```
greenlet>=1.0.0
pyee>=8.1.0
typing-extensions>=4.0.0
```

## Notas de Compatibilidade

- ✅ Windows 10+, Linux, macOS
- ✅ x86_64, ARM64
- ✅ Python 3.7-3.12
- ✅ Chromium, Firefox, WebKit
- ⚠️ Headless mode requer display server no Linux (ou Xvfb)

## Troubleshooting Comum

### Problema: "Executable doesn't exist"

**Solução:** Executar `python -m playwright install`

### Problema: TimeoutError ao esperar seletor

**Solução:** 
```python
# Aumentar timeout
page.wait_for_selector('.element', timeout=30000)
# Ou verificar se elemento existe
if page.query_selector('.element'):
    # elemento existe
```

### Problema: Browser não abre em servidor

**Solução:** Usar headless=True ou instalar Xvfb no Linux

### Problema: Anti-bot detecta Playwright

**Solução:**
```python
# Usar stealth mode
context = browser.new_context(
    user_agent='Mozilla/5.0...',
    viewport={'width': 1920, 'height': 1080},
    locale='pt-BR'
)
page = context.new_page()
```

## Score de Seleção

```python
def calculate_playwright_score(task_keywords: list) -> float:
    base_score = 0.70
    
    # Boost para scraping de SPAs
    if any(k in task_keywords for k in ['spa', 'javascript', 'dynamic', 'react', 'vue']):
        base_score += 0.20
    
    # Boost para automação web
    if any(k in task_keywords for k in ['form', 'click', 'submit', 'automate']):
        base_score += 0.15
    
    # Boost para screenshots/PDFs
    if any(k in task_keywords for k in ['screenshot', 'pdf', 'capture']):
        base_score += 0.15
    
    # Penalty se for site estático simples
    if 'static' in task_keywords:
        base_score -= 0.10
    
    return min(base_score, 0.95)
```

## Async Version

Playwright também suporta API assíncrona:

```python
from playwright.async_api import async_playwright

async def scrape_async(url: str):
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto(url)
        content = await page.content()
        await browser.close()
        return content
```

## Última Atualização

2025-01-15