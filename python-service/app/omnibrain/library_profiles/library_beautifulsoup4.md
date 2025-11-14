# BeautifulSoup4

## Informações Básicas

- **Nome:** beautifulsoup4
- **Categoria:** Web Scraping, HTML Parsing, Data Extraction
- **Versão Mínima:** 4.9.0
- **Versão Recomendada:** 4.12.0+
- **Licença:** MIT
- **Documentação:** https://www.crummy.com/software/BeautifulSoup/bs4/doc/

## Descrição

BeautifulSoup4 é a biblioteca Python mais popular e amigável para parsing de HTML e XML. Transforma documentos mal-formatados em uma árvore navegável de objetos Python, permitindo extração fácil de dados de páginas web. Ideal para web scraping de sites estáticos e análise de markup.

## Casos de Uso Prioritários

1. **Parse HTML/XML** (confidence: 0.98)
2. **Extração de Texto** (confidence: 0.95)
3. **Buscar Elementos por Tag** (confidence: 0.95)
4. **Buscar por CSS Selector** (confidence: 0.95)
5. **Extração de Links** (confidence: 0.95)
6. **Extração de Tabelas** (confidence: 0.90)
7. **Limpeza de HTML** (confidence: 0.85)
8. **Modificação de HTML** (confidence: 0.80)

## Prós

- ✅ API extremamente intuitiva e pythônica
- ✅ Lida bem com HTML mal-formatado
- ✅ Múltiplos parsers (lxml, html.parser, html5lib)
- ✅ Navegação fácil pela árvore DOM
- ✅ CSS selectors suportados
- ✅ Busca poderosa (find, find_all)
- ✅ Documentação excelente com exemplos
- ✅ Zero curva de aprendizado
- ✅ Funciona com encoding automático
- ✅ Comunidade gigante

## Contras

- ⚠️ Não renderiza JavaScript (usar Playwright/Selenium)
- ⚠️ Não faz requisições HTTP (combinar com requests)
- ⚠️ Performance inferior a lxml puro
- ⚠️ Não é assíncrono nativo
- ⚠️ Memória crescente com documentos grandes

## Performance

- **Velocidade:** ⭐⭐⭐⭐ (8/10)
- **Uso de Memória:** ⭐⭐⭐ (7/10)
- **Qualidade de Output:** ⭐⭐⭐⭐⭐ (9.5/10)
- **Facilidade de Uso:** ⭐⭐⭐⭐⭐ (10/10)

## Instalação

```bash
pip install beautifulsoup4
# Parsers recomendados
pip install lxml  # Mais rápido
pip install html5lib  # Mais tolerante
```

## Keywords/Triggers

- beautifulsoup
- bs4
- html parser
- parse html
- web scraping
- scraping
- extract
- extrair
- html
- xml
- soup
- parse
- find
- buscar elementos

## Exemplos de Código

### Básico: Parse e Extrair Texto

```python
from bs4 import BeautifulSoup
import requests

def scrape_basic(url: str):
    # Fazer requisição
    response = requests.get(url)
    html = response.text
    
    # Parse HTML
    soup = BeautifulSoup(html, 'html.parser')
    
    # Extrair título
    title = soup.title.string if soup.title else "No title"
    
    # Extrair todo texto
    text = soup.get_text(strip=True)
    
    # Extrair primeiro parágrafo
    first_p = soup.find('p')
    first_p_text = first_p.get_text() if first_p else ""
    
    return {
        "title": title,
        "text": text[:500],  # Primeiros 500 chars
        "first_paragraph": first_p_text
    }
```

### Intermediário: Buscar Elementos Específicos

```python
from bs4 import BeautifulSoup
import requests

def extract_links(url: str):
    response = requests.get(url)
    soup = BeautifulSoup(response.text, 'html.parser')
    
    links = []
    
    # Buscar todos os links
    for a_tag in soup.find_all('a', href=True):
        links.append({
            "text": a_tag.get_text(strip=True),
            "href": a_tag['href'],
            "title": a_tag.get('title', '')
        })
    
    return links

def extract_images(url: str):
    response = requests.get(url)
    soup = BeautifulSoup(response.text, 'html.parser')
    
    images = []
    
    # Buscar todas as imagens
    for img in soup.find_all('img'):
        images.append({
            "src": img.get('src', ''),
            "alt": img.get('alt', ''),
            "title": img.get('title', '')
        })
    
    return images
```

### Avançado: CSS Selectors e Navegação

```python
from bs4 import BeautifulSoup
import requests

def scrape_with_selectors(url: str):
    response = requests.get(url)
    soup = BeautifulSoup(response.text, 'lxml')  # lxml mais rápido
    
    results = {}
    
    # CSS Selectors
    results['main_heading'] = soup.select_one('h1.main-title')
    if results['main_heading']:
        results['main_heading'] = results['main_heading'].get_text(strip=True)
    
    # Buscar elementos por classe
    articles = soup.select('article.post')
    results['articles'] = []
    
    for article in articles:
        # Navegação relativa
        title = article.find('h2')
        author = article.find('span', class_='author')
        date = article.find('time')
        
        results['articles'].append({
            "title": title.get_text(strip=True) if title else "",
            "author": author.get_text(strip=True) if author else "",
            "date": date.get('datetime') if date else ""
        })
    
    # Buscar por atributo específico
    results['meta_description'] = soup.find('meta', attrs={'name': 'description'})
    if results['meta_description']:
        results['meta_description'] = results['meta_description'].get('content', '')
    
    return results
```

### Expert: Extrair Tabelas

```python
from bs4 import BeautifulSoup
import requests
import pandas as pd

def extract_tables(url: str):
    response = requests.get(url)
    soup = BeautifulSoup(response.text, 'html.parser')
    
    tables_data = []
    
    # Buscar todas as tabelas
    tables = soup.find_all('table')
    
    for idx, table in enumerate(tables):
        # Extrair headers
        headers = []
        header_row = table.find('thead')
        if header_row:
            headers = [th.get_text(strip=True) for th in header_row.find_all(['th', 'td'])]
        
        # Extrair linhas
        rows = []
        tbody = table.find('tbody') or table
        
        for tr in tbody.find_all('tr'):
            cells = tr.find_all(['td', 'th'])
            if cells:
                row = [cell.get_text(strip=True) for cell in cells]
                rows.append(row)
        
        # Criar DataFrame se possível
        if headers and rows:
            df = pd.DataFrame(rows, columns=headers)
            tables_data.append({
                "table_index": idx,
                "headers": headers,
                "rows": rows,
                "dataframe": df
            })
        elif rows:
            tables_data.append({
                "table_index": idx,
                "rows": rows
            })
    
    return tables_data
```

### Expert: Navegação Avançada

```python
from bs4 import BeautifulSoup
import requests

def advanced_navigation(url: str):
    response = requests.get(url)
    soup = BeautifulSoup(response.text, 'lxml')
    
    results = {}
    
    # Encontrar elemento e navegar para cima
    target = soup.find('span', class_='price')
    if target:
        # Encontrar elemento pai
        product_div = target.find_parent('div', class_='product')
        if product_div:
            results['product_name'] = product_div.find('h3').get_text(strip=True)
            results['price'] = target.get_text(strip=True)
    
    # Navegar entre irmãos
    first_article = soup.find('article')
    if first_article:
        # Próximo irmão
        next_article = first_article.find_next_sibling('article')
        # Anterior
        prev_article = first_article.find_previous_sibling('article')
    
    # Buscar elementos seguintes
    h2 = soup.find('h2', string='Products')
    if h2:
        # Todos os elementos após este h2 até o próximo h2
        content = []
        for sibling in h2.find_next_siblings():
            if sibling.name == 'h2':
                break
            content.append(sibling.get_text(strip=True))
        results['products_section'] = content
    
    # Buscar com regex
    import re
    email_pattern = re.compile(r'[\w\.-]+@[\w\.-]+\.\w+')
    emails = soup.find_all(string=email_pattern)
    results['emails'] = list(set(emails))
    
    # Buscar com função customizada
    def has_data_id(tag):
        return tag.has_attr('data-id')
    
    elements_with_data_id = soup.find_all(has_data_id)
    results['data_ids'] = [el.get('data-id') for el in elements_with_data_id]
    
    return results
```

## Templates por Caso de Uso

### Template: Basic Scraping

```python
from bs4 import BeautifulSoup
import requests
response = requests.get("{url}")
soup = BeautifulSoup(response.text, 'html.parser')
data = soup.find_all("{tag}")
```

### Template: Extract Links

```python
from bs4 import BeautifulSoup
import requests
response = requests.get("{url}")
soup = BeautifulSoup(response.text, 'html.parser')
links = [a['href'] for a in soup.find_all('a', href=True)]
```

### Template: CSS Selector

```python
from bs4 import BeautifulSoup
import requests
response = requests.get("{url}")
soup = BeautifulSoup(response.text, 'lxml')
elements = soup.select("{css_selector}")
data = [el.get_text(strip=True) for el in elements]
```

### Template: Extract Table

```python
from bs4 import BeautifulSoup
import requests
response = requests.get("{url}")
soup = BeautifulSoup(response.text, 'html.parser')
table = soup.find('table')
rows = [[td.get_text(strip=True) for td in tr.find_all('td')] for tr in table.find_all('tr')]
```

### Template: Find by Class

```python
from bs4 import BeautifulSoup
import requests
response = requests.get("{url}")
soup = BeautifulSoup(response.text, 'html.parser')
elements = soup.find_all(class_="{class_name}")
data = [el.get_text(strip=True) for el in elements]
```

## Alternativas e Quando Usar

| Biblioteca | Quando Usar em Vez de BeautifulSoup |
|------------|--------------------------------------|
| lxml | Performance crítica, HTML bem-formatado |
| Playwright | Sites com JavaScript, SPAs |
| Scrapy | Projetos grandes, crawling em escala |
| Parsel | Scrapy-like sem framework completo |
| selectolax | Performance máxima, API similar |
| html.parser | Stdlib apenas, sem dependências |

## Requisitos do Sistema

- Python 3.6+
- ~2MB de espaço em disco
- Parser: lxml (recomendado) ou html.parser (stdlib)

## Dependências

```
soupsieve>=1.2  # CSS selector support
```

Opcionais (parsers):
```
lxml>=4.9.0  # Mais rápido
html5lib>=1.1  # Mais tolerante
```

## Notas de Compatibilidade

- ✅ Windows, Linux, macOS
- ✅ Python 3.6-3.12
- ✅ Parsers: lxml, html.parser, html5lib, xml
- ✅ Suporta Unicode completo
- ⚠️ Parser html5lib é mais lento mas mais preciso

## Troubleshooting Comum

### Problema: "No module named 'lxml'"

**Solução:** Instalar parser
```bash
pip install lxml
# Ou usar parser padrão
soup = BeautifulSoup(html, 'html.parser')
```

### Problema: Elemento não encontrado retorna None

**Solução:** Sempre verificar antes de acessar
```python
element = soup.find('div', class_='content')
if element:
    text = element.get_text()
else:
    text = "Not found"
```

### Problema: Encoding errado (caracteres estranhos)

**Solução:** Especificar encoding
```python
response = requests.get(url)
response.encoding = 'utf-8'
soup = BeautifulSoup(response.text, 'html.parser')
# Ou
soup = BeautifulSoup(html, 'html.parser', from_encoding='utf-8')
```

### Problema: AttributeError ao acessar atributo

**Solução:** Usar .get() em vez de []
```python
# ❌ Pode dar erro
href = a_tag['href']

# ✅ Seguro
href = a_tag.get('href', '')
```

## Score de Seleção

```python
def calculate_beautifulsoup_score(task_keywords: list, has_javascript: bool = False) -> float:
    base_score = 0.90
    
    # Boost para parsing HTML/XML
    if any(kw in task_keywords for kw in ['parse', 'extract', 'scrape', 'html']):
        base_score += 0.08
    
    # Penalty para JavaScript
    if has_javascript:
        base_score -= 0.60  # Usar Playwright
    
    # Boost para sites estáticos
    if 'static' in task_keywords:
        base_score += 0.05
    
    # Penalty para performance crítica
    if 'fast' in task_keywords or 'performance' in task_keywords:
        base_score -= 0.15  # Usar lxml direto
    
    return min(max(base_score, 0.0), 0.98)
```

## Best Practices

1. **Use parser rápido quando possível:**
   ```python
   soup = BeautifulSoup(html, 'lxml')  # Mais rápido
   ```

2. **Sempre strip whitespace:**
   ```python
   text = element.get_text(strip=True)
   ```

3. **Use CSS selectors para busca complexa:**
   ```python
   elements = soup.select('div.product > h2.title')
   ```

4. **Verifique existência antes de acessar:**
   ```python
   element = soup.find('div')
   if element:
       text = element.get_text()
   ```

5. **Use .get() para atributos opcionais:**
   ```python
   href = a_tag.get('href', '')
   title = a_tag.get('title', 'No title')
   ```

6. **Decomponha elementos não desejados:**
   ```python
   for script in soup(['script', 'style']):
       script.decompose()
   text = soup.get_text()
   ```

7. **Limite profundidade em documentos grandes:**
   ```python
   # Buscar apenas em uma seção
   main = soup.find('main')
   if main:
       articles = main.find_all('article')
   ```

## Combinação com Requests

```python
import requests
from bs4 import BeautifulSoup

def scrape_with_session():
    # Usar session para cookies e headers persistentes
    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    })
    
    response = session.get('https://example.com')
    soup = BeautifulSoup(response.text, 'lxml')
    
    # Processar
    return soup.find_all('article')
```

## Última Atualização

2025-01-15