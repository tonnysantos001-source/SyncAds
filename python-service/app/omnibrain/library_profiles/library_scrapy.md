# Scrapy

## Informações Básicas

- **Nome:** scrapy
- **Categoria:** Web Scraping, Data Extraction, Crawling
- **Versão Mínima:** 2.5.0
- **Versão Recomendada:** 2.11.0+
- **Licença:** BSD 3-Clause
- **Documentação:** https://docs.scrapy.org/

## Descrição

Scrapy é um framework de web scraping e web crawling de alto nível, rápido e poderoso. Projetado para extrair dados de websites em escala, com arquitetura assíncrona baseada em Twisted. Ideal para projetos grandes de scraping, crawling de múltiplas páginas e extração estruturada de dados.

## Casos de Uso Prioritários

1. **Scraping em Larga Escala** (confidence: 0.98)
2. **Crawling Multi-página** (confidence: 0.95)
3. **Extração de Dados Estruturados** (confidence: 0.95)
4. **Scraping com Paginação** (confidence: 0.95)
5. **Data Mining de Websites** (confidence: 0.93)
6. **Scraping Recursivo** (confidence: 0.95)
7. **Export para JSON/CSV/XML** (confidence: 0.95)

## Prós

- ✅ Extremamente rápido (arquitetura assíncrona)
- ✅ Crawling automático de links
- ✅ Pipeline de processamento de dados
- ✅ Middleware customizável
- ✅ Exportação para múltiplos formatos
- ✅ Gerenciamento automático de requests
- ✅ Suporte a robots.txt
- ✅ Retry automático em falhas
- ✅ Throttling e rate limiting integrados
- ✅ Shell interativo para debugging
- ✅ Extensível com plugins

## Contras

- ⚠️ Curva de aprendizado íngreme
- ⚠️ Overkill para scraping simples
- ⚠️ Requer estrutura de projeto
- ⚠️ Não renderiza JavaScript (precisa Splash/Playwright)
- ⚠️ Configuração inicial complexa
- ⚠️ Assíncrono pode ser confuso para iniciantes

## Performance

- **Velocidade:** ⭐⭐⭐⭐⭐ (10/10)
- **Uso de Memória:** ⭐⭐⭐⭐ (8/10)
- **Qualidade de Output:** ⭐⭐⭐⭐⭐ (10/10)
- **Facilidade de Uso:** ⭐⭐⭐ (6/10)

## Instalação

```bash
pip install scrapy
```

## Keywords/Triggers

- scrapy
- web crawling
- large scale scraping
- spider
- crawler
- multi-page scraping
- data extraction
- structured data
- sitemap crawling
- recursive scraping
- bulk data extraction

## Exemplos de Código

### Básico: Spider Simples

```python
import scrapy

class ProductSpider(scrapy.Spider):
    name = 'products'
    start_urls = ['https://example.com/products']
    
    def parse(self, response):
        for product in response.css('div.product'):
            yield {
                'name': product.css('h2::text').get(),
                'price': product.css('span.price::text').get(),
                'url': product.css('a::attr(href)').get()
            }
        
        # Seguir próxima página
        next_page = response.css('a.next::attr(href)').get()
        if next_page:
            yield response.follow(next_page, self.parse)

# Executar: scrapy runspider spider.py -o output.json
```

### Intermediário: Scraping com Paginação

```python
import scrapy

class EcommerceSpider(scrapy.Spider):
    name = 'ecommerce'
    
    def start_requests(self):
        urls = [
            'https://example.com/category/electronics',
            'https://example.com/category/books',
        ]
        for url in urls:
            yield scrapy.Request(url=url, callback=self.parse_category)
    
    def parse_category(self, response):
        # Extrair produtos
        for product in response.css('article.product'):
            yield {
                'category': response.css('h1::text').get(),
                'title': product.css('h3::text').get(),
                'price': product.css('.price::text').get(),
                'rating': product.css('.rating::text').get(),
                'image': product.css('img::attr(src)').get(),
            }
        
        # Paginação
        for page_num in range(2, 11):  # Páginas 2-10
            next_page = f"{response.url}?page={page_num}"
            yield scrapy.Request(next_page, callback=self.parse_category)
```

### Avançado: Crawling Recursivo com Items

```python
import scrapy
from scrapy.item import Item, Field

class ProductItem(Item):
    name = Field()
    price = Field()
    description = Field()
    images = Field()
    specifications = Field()

class RecursiveSpider(scrapy.Spider):
    name = 'recursive_crawler'
    start_urls = ['https://example.com']
    
    custom_settings = {
        'DEPTH_LIMIT': 3,
        'CONCURRENT_REQUESTS': 16,
        'DOWNLOAD_DELAY': 0.5,
    }
    
    def parse(self, response):
        # Seguir todos os links de produtos
        for product_link in response.css('a.product-link::attr(href)'):
            yield response.follow(product_link, callback=self.parse_product)
        
        # Seguir links de navegação
        for nav_link in response.css('nav a::attr(href)'):
            yield response.follow(nav_link, callback=self.parse)
    
    def parse_product(self, response):
        item = ProductItem()
        item['name'] = response.css('h1.product-name::text').get()
        item['price'] = response.css('span.price::text').get()
        item['description'] = response.css('div.description::text').getall()
        item['images'] = response.css('img.product-image::attr(src)').getall()
        
        # Extrair especificações
        specs = {}
        for spec in response.css('table.specs tr'):
            key = spec.css('th::text').get()
            value = spec.css('td::text').get()
            if key and value:
                specs[key] = value
        item['specifications'] = specs
        
        yield item
```

### Expert: Pipeline com Processamento

```python
import scrapy
from scrapy.pipelines.images import ImagesPipeline
from scrapy.exceptions import DropItem

# Spider
class AdvancedSpider(scrapy.Spider):
    name = 'advanced'
    start_urls = ['https://example.com/products']
    
    def parse(self, response):
        for product in response.css('div.product'):
            yield {
                'name': product.css('h2::text').get(),
                'price': product.css('.price::text').get(),
                'image_urls': product.css('img::attr(src)').getall(),
                'url': response.urljoin(product.css('a::attr(href)').get()),
            }

# Pipeline
class PriceValidationPipeline:
    def process_item(self, item, spider):
        if 'price' in item:
            price_str = item['price'].replace('$', '').replace(',', '')
            try:
                price = float(price_str)
                if price < 0:
                    raise DropItem(f"Invalid price: {price}")
                item['price_numeric'] = price
            except ValueError:
                raise DropItem(f"Invalid price format: {item['price']}")
        return item

class CustomImagesPipeline(ImagesPipeline):
    def get_media_requests(self, item, info):
        for image_url in item.get('image_urls', []):
            yield scrapy.Request(image_url)
    
    def item_completed(self, results, item, info):
        image_paths = [x['path'] for ok, x in results if ok]
        item['images_downloaded'] = image_paths
        return item

# settings.py
ITEM_PIPELINES = {
    'myproject.pipelines.PriceValidationPipeline': 300,
    'myproject.pipelines.CustomImagesPipeline': 400,
}
IMAGES_STORE = './downloaded_images'
```

## Templates por Caso de Uso

### Template: Basic Spider

```python
import scrapy

class MySpider(scrapy.Spider):
    name = '{spider_name}'
    start_urls = ['{url}']
    
    def parse(self, response):
        for item in response.css('{selector}'):
            yield {
                'field': item.css('{field_selector}').get()
            }
```

### Template: Paginated Spider

```python
import scrapy

class PaginatedSpider(scrapy.Spider):
    name = '{spider_name}'
    start_urls = ['{base_url}']
    
    def parse(self, response):
        # Extract items
        for item in response.css('{item_selector}'):
            yield {'data': item.get()}
        
        # Next page
        next_page = response.css('{next_page_selector}::attr(href)').get()
        if next_page:
            yield response.follow(next_page, self.parse)
```

### Template: Recursive Crawler

```python
import scrapy

class RecursiveSpider(scrapy.Spider):
    name = '{spider_name}'
    start_urls = ['{start_url}']
    allowed_domains = ['{domain}']
    
    def parse(self, response):
        # Extract data
        yield {'url': response.url, 'title': response.css('h1::text').get()}
        
        # Follow links
        for link in response.css('a::attr(href)'):
            yield response.follow(link, self.parse)
```

## Alternativas e Quando Usar

| Biblioteca | Quando Usar em Vez de Scrapy |
|------------|------------------------------|
| BeautifulSoup + requests | Scraping simples, poucos requests |
| Playwright | Sites com JavaScript/SPAs |
| Selenium | Interação complexa com browser |
| httpx + selectolax | Scraping rápido sem framework |
| requests-html | Scraping simples com JS rendering |

## Requisitos do Sistema

- Python 3.7+
- lxml
- Twisted
- ~50MB de espaço em disco

## Dependências

```
lxml>=4.6.0
parsel>=1.6.0
w3lib>=1.22.0
twisted>=18.9.0
cryptography>=2.0
pyOpenSSL>=16.2.0
```

## Notas de Compatibilidade

- ✅ Windows, Linux, macOS
- ✅ x86_64, ARM64
- ✅ Python 3.7-3.12
- ⚠️ Requer compilador C para algumas dependências
- ⚠️ Não renderiza JavaScript nativamente

## Troubleshooting Comum

### Problema: "ImportError: No module named 'win32api'"

**Solução:** Instalar pywin32
```bash
pip install pywin32
```

### Problema: Scrapy ignora robots.txt

**Solução:** Configurar settings
```python
ROBOTSTXT_OBEY = False  # Use com cuidado e responsabilidade
```

### Problema: Too many concurrent requests

**Solução:** Ajustar throttling
```python
CONCURRENT_REQUESTS = 8
DOWNLOAD_DELAY = 1
AUTOTHROTTLE_ENABLED = True
```

### Problema: Memory issues com muitas requests

**Solução:** Limitar profundidade e usar streaming
```python
DEPTH_LIMIT = 3
REACTOR_THREADPOOL_MAXSIZE = 20
```

## Configurações Importantes

```python
# settings.py - Produção

# User Agent
USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'

# Respeitar robots.txt
ROBOTSTXT_OBEY = True

# Concurrent requests
CONCURRENT_REQUESTS = 16
CONCURRENT_REQUESTS_PER_DOMAIN = 8

# Download delay (em segundos)
DOWNLOAD_DELAY = 0.5
RANDOMIZE_DOWNLOAD_DELAY = True

# Auto throttle
AUTOTHROTTLE_ENABLED = True
AUTOTHROTTLE_START_DELAY = 1
AUTOTHROTTLE_MAX_DELAY = 10

# Retry
RETRY_ENABLED = True
RETRY_TIMES = 3

# Timeout
DOWNLOAD_TIMEOUT = 30

# Export
FEED_FORMAT = 'json'
FEED_URI = 'output.json'
```

## Score de Seleção

```python
def calculate_scrapy_score(task_keywords: list, data_volume: str) -> float:
    base_score = 0.60
    
    # Boost para scraping em larga escala
    if data_volume in ['large', 'very_large']:
        base_score += 0.25
    
    # Boost para multi-página
    if any(k in task_keywords for k in ['crawl', 'multiple', 'pages', 'recursive', 'sitemap']):
        base_score += 0.15
    
    # Boost para estruturado
    if 'structured' in task_keywords:
        base_score += 0.10
    
    # Penalty se for scraping simples (1-2 páginas)
    if data_volume == 'small' or 'single_page' in task_keywords:
        base_score -= 0.30
    
    # Penalty se precisa JavaScript
    if any(k in task_keywords for k in ['javascript', 'spa', 'react', 'vue']):
        base_score -= 0.20
    
    return min(max(base_score, 0.0), 0.95)
```

## Execução

```bash
# Criar projeto
scrapy startproject myproject

# Gerar spider
scrapy genspider myspider example.com

# Executar spider
scrapy crawl myspider

# Exportar para JSON
scrapy crawl myspider -o output.json

# Exportar para CSV
scrapy crawl myspider -o output.csv

# Shell interativo
scrapy shell "https://example.com"
```

## Última Atualização

2025-01-15