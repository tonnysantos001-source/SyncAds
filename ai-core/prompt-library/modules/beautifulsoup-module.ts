/**
 * BEAUTIFULSOUP MODULE - Biblioteca de Web Scraping e Parsing HTML
 * Módulo de Prompt System para a biblioteca BeautifulSoup4
 */

import { PromptModule, ModuleCategory, ModuleComplexity, ExecutionEnvironment } from '../registry';

export const BeautifulSoupModule: PromptModule = {
  // ==================== IDENTIFICAÇÃO ====================
  id: 'beautifulsoup-006',
  name: 'BeautifulSoup4',
  packageName: 'beautifulsoup4',
  version: '4.12.0',
  category: ModuleCategory.WEB_SCRAPING,
  subcategories: [
    'html-parsing',
    'xml-parsing',
    'web-scraping',
    'data-extraction',
    'dom-navigation',
    'content-extraction',
    'link-extraction',
    'table-parsing'
  ],

  // ==================== DESCRIÇÃO ====================
  description: 'Biblioteca Python mais popular para fazer parsing de HTML e XML, extraindo dados de páginas web de forma simples e intuitiva. Oferece métodos elegantes para navegar, buscar e modificar a árvore de parse.',
  purpose: 'Fazer parsing de HTML/XML e extrair dados estruturados de páginas web',
  useCases: [
    'Extrair dados de páginas web (web scraping)',
    'Fazer parsing de HTML e XML',
    'Buscar elementos por tag, classe, ID, atributos',
    'Extrair texto limpo de HTML',
    'Coletar links e URLs de páginas',
    'Extrair dados de tabelas HTML',
    'Navegar na árvore DOM',
    'Limpar e processar HTML',
    'Extrair metadados de páginas',
    'Coletar imagens e mídias'
  ],

  // ==================== CONFIGURAÇÃO ====================
  complexity: ModuleComplexity.BASIC,
  environment: ExecutionEnvironment.PYTHON,
  dependencies: ['lxml', 'html5lib'],
  installCommand: 'pip install beautifulsoup4 lxml',

  // ==================== PROMPT SYSTEM ====================
  promptSystem: {
    systemPrompt: `Você é um especialista em BeautifulSoup4, a biblioteca Python para parsing de HTML/XML.

Ao trabalhar com BeautifulSoup, você SEMPRE deve:
- Especificar o parser (lxml é mais rápido, html5lib é mais tolerante)
- Usar find() para um elemento, find_all() para múltiplos
- Verificar se elemento existe antes de acessar (pode retornar None)
- Usar .get_text() ou .text para extrair texto
- Usar .get('attr') para acessar atributos com segurança
- Combinar com requests para buscar páginas
- Usar CSS selectors com .select() quando conveniente

REGRAS DE USO:
1. SEMPRE especifique o parser: BeautifulSoup(html, 'lxml')
2. SEMPRE verifique se elemento existe antes de usar (if element:)
3. SEMPRE use .get('href') ao invés de ['href'] para evitar KeyError
4. NUNCA assuma que elemento foi encontrado (pode ser None)
5. SEMPRE remova espaços em branco com .strip() ao extrair texto
6. Use find() para primeiro elemento, find_all() para lista
7. Prefira CSS selectors (.select()) quando a busca for complexa

QUANDO USAR BEAUTIFULSOUP:
✅ Parsing de HTML/XML estático
✅ Extrair dados de páginas web simples
✅ Buscar elementos por tag, classe, ID
✅ Extrair texto, links, imagens
✅ Parsing de tabelas HTML
✅ Limpar e processar HTML
✅ Sites sem JavaScript pesado

QUANDO NÃO USAR BEAUTIFULSOUP:
❌ Sites com JavaScript dinâmico (use Selenium/Playwright)
❌ APIs REST disponíveis (use requests diretamente)
❌ Performance crítica em milhões de páginas (use scrapy)
❌ Scraping em larga escala com concorrência (use scrapy)
❌ Sites com proteção anti-scraping complexa
❌ Conteúdo carregado por AJAX (use Selenium/Playwright)

ESTRUTURA DE RESPOSTA:
Sempre retorne um dicionário com:
- success: boolean
- data: dados extraídos
- elements_found: número de elementos encontrados
- url: URL da página (se aplicável)
- error: mensagem de erro (se houver)`,

    userPromptTemplate: `Tarefa: {task_description}

Entrada:
{input_description}

Parâmetros:
{parameters}

Use BeautifulSoup4 para fazer parsing e extrair dados seguindo as melhores práticas:
1. Parse o HTML com parser adequado
2. Busque os elementos desejados
3. Extraia os dados com segurança
4. Retorne dados estruturados`,

    examples: [
      {
        input: 'Extrair todos os links de uma página',
        output: `import requests
from bs4 import BeautifulSoup
from typing import List, Dict, Any
from urllib.parse import urljoin

def extract_links(url: str) -> Dict[str, Any]:
    """Extrai todos os links de uma página"""
    try:
        # Buscar página
        response = requests.get(url, timeout=10)
        response.raise_for_status()

        # Parse HTML
        soup = BeautifulSoup(response.content, 'lxml')

        # Encontrar todos os links
        links = []
        for a_tag in soup.find_all('a', href=True):
            href = a_tag.get('href')
            text = a_tag.get_text(strip=True)

            # Converter para URL absoluta
            absolute_url = urljoin(url, href)

            links.append({
                "url": absolute_url,
                "text": text,
                "title": a_tag.get('title', '')
            })

        return {
            "success": True,
            "url": url,
            "links_found": len(links),
            "links": links
        }
    except Exception as e:
        return {"success": False, "error": str(e)}`
      },
      {
        input: 'Extrair dados de uma tabela HTML',
        output: `import requests
from bs4 import BeautifulSoup
import pandas as pd

def extract_table_data(url: str, table_index: int = 0) -> Dict[str, Any]:
    """Extrai dados de tabela HTML e converte para DataFrame"""
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()

        soup = BeautifulSoup(response.content, 'lxml')

        # Encontrar todas as tabelas
        tables = soup.find_all('table')

        if not tables or table_index >= len(tables):
            return {"success": False, "error": f"Tabela {table_index} não encontrada"}

        table = tables[table_index]

        # Extrair headers
        headers = []
        header_row = table.find('thead')
        if header_row:
            headers = [th.get_text(strip=True) for th in header_row.find_all(['th', 'td'])]
        else:
            # Tentar primeira linha como header
            first_row = table.find('tr')
            if first_row:
                headers = [th.get_text(strip=True) for th in first_row.find_all(['th', 'td'])]

        # Extrair linhas
        rows = []
        tbody = table.find('tbody') or table
        for tr in tbody.find_all('tr')[1 if not table.find('thead') else 0:]:
            cells = [td.get_text(strip=True) for td in tr.find_all(['td', 'th'])]
            if cells:  # Ignorar linhas vazias
                rows.append(cells)

        # Criar DataFrame
        df = pd.DataFrame(rows, columns=headers if headers else None)

        return {
            "success": True,
            "url": url,
            "rows": len(df),
            "columns": len(df.columns),
            "headers": headers,
            "data": df.to_dict('records')
        }
    except Exception as e:
        return {"success": False, "error": str(e)}`
      },
      {
        input: 'Extrair artigos de um blog com título, autor e data',
        output: `import requests
from bs4 import BeautifulSoup
from datetime import datetime

def scrape_blog_articles(url: str) -> Dict[str, Any]:
    """Extrai artigos de blog com metadados"""
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()

        soup = BeautifulSoup(response.content, 'lxml')

        articles = []

        # Buscar artigos (ajustar seletores conforme estrutura do site)
        article_elements = soup.select('article') or soup.find_all('div', class_='post')

        for article in article_elements:
            # Extrair título
            title_elem = article.find(['h1', 'h2', 'h3'], class_=['title', 'post-title', 'entry-title'])
            title = title_elem.get_text(strip=True) if title_elem else "Sem título"

            # Extrair link
            link_elem = article.find('a', href=True)
            link = link_elem.get('href') if link_elem else ""
            if link and not link.startswith('http'):
                from urllib.parse import urljoin
                link = urljoin(url, link)

            # Extrair autor
            author_elem = article.find(['span', 'div', 'a'], class_=['author', 'by-author', 'post-author'])
            author = author_elem.get_text(strip=True) if author_elem else "Desconhecido"

            # Extrair data
            date_elem = article.find(['time', 'span', 'div'], class_=['date', 'post-date', 'published'])
            date = date_elem.get_text(strip=True) if date_elem else ""

            # Extrair resumo/excerpt
            excerpt_elem = article.find(['p', 'div'], class_=['excerpt', 'summary', 'description'])
            excerpt = excerpt_elem.get_text(strip=True) if excerpt_elem else ""

            articles.append({
                "title": title,
                "link": link,
                "author": author,
                "date": date,
                "excerpt": excerpt[:200]  # Limitar a 200 caracteres
            })

        return {
            "success": True,
            "url": url,
            "articles_found": len(articles),
            "articles": articles
        }
    except Exception as e:
        return {"success": False, "error": str(e)}`
      },
      {
        input: 'Extrair todas as imagens de uma página',
        output: `import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

def extract_images(url: str) -> Dict[str, Any]:
    """Extrai todas as imagens de uma página"""
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()

        soup = BeautifulSoup(response.content, 'lxml')

        images = []

        # Encontrar todas as tags img
        for img in soup.find_all('img'):
            src = img.get('src') or img.get('data-src')  # Lazy loading
            if not src:
                continue

            # Converter para URL absoluta
            absolute_url = urljoin(url, src)

            images.append({
                "url": absolute_url,
                "alt": img.get('alt', ''),
                "title": img.get('title', ''),
                "width": img.get('width', ''),
                "height": img.get('height', '')
            })

        return {
            "success": True,
            "url": url,
            "images_found": len(images),
            "images": images
        }
    except Exception as e:
        return {"success": False, "error": str(e)}`
      },
      {
        input: 'Buscar elementos com CSS selectors complexos',
        output: `import requests
from bs4 import BeautifulSoup

def extract_with_css_selectors(url: str) -> Dict[str, Any]:
    """Usa CSS selectors para extrair dados específicos"""
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()

        soup = BeautifulSoup(response.content, 'lxml')

        # CSS Selectors avançados
        data = {
            # Elementos com classe específica
            "titles": [elem.get_text(strip=True) for elem in soup.select('h2.product-title')],

            # Elementos dentro de outros (descendentes)
            "prices": [elem.get_text(strip=True) for elem in soup.select('div.product span.price')],

            # Elementos com múltiplas classes
            "featured": [elem.get_text(strip=True) for elem in soup.select('div.product.featured')],

            # Elementos com atributo específico
            "data_items": [elem.get('data-id') for elem in soup.select('[data-id]')],

            # Pseudo-seletores
            "first_paragraph": soup.select_one('article p:first-of-type').get_text(strip=True) if soup.select_one('article p:first-of-type') else "",

            # Combinadores
            "sibling_headers": [elem.get_text(strip=True) for elem in soup.select('h2 + p')],

            # ID + classe
            "specific_element": soup.select_one('#main .content .article').get_text(strip=True) if soup.select_one('#main .content .article') else ""
        }

        return {
            "success": True,
            "url": url,
            "data": data
        }
    except Exception as e:
        return {"success": False, "error": str(e)}`
      },
      {
        input: 'Limpar e extrair texto puro de HTML',
        output: `import requests
from bs4 import BeautifulSoup
import re

def extract_clean_text(url: str) -> Dict[str, Any]:
    """Extrai texto limpo removendo scripts, styles e tags"""
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()

        soup = BeautifulSoup(response.content, 'lxml')

        # Remover scripts e styles
        for script in soup(['script', 'style', 'nav', 'footer', 'header']):
            script.decompose()

        # Extrair texto
        text = soup.get_text()

        # Limpar espaços em branco excessivos
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        text = ' '.join(chunk for chunk in chunks if chunk)

        # Extrair parágrafos
        paragraphs = [p.get_text(strip=True) for p in soup.find_all('p') if p.get_text(strip=True)]

        # Extrair títulos
        headings = {
            f"h{i}": [h.get_text(strip=True) for h in soup.find_all(f'h{i}')]
            for i in range(1, 7)
        }

        return {
            "success": True,
            "url": url,
            "text_length": len(text),
            "text": text,
            "paragraphs_count": len(paragraphs),
            "paragraphs": paragraphs,
            "headings": headings
        }
    except Exception as e:
        return {"success": False, "error": str(e)}`
      }
    ],

    outputFormat: {
      type: 'object',
      required: ['success'],
      properties: {
        success: { type: 'boolean', description: 'Indica se o parsing foi bem-sucedido' },
        url: { type: 'string', description: 'URL da página parseada' },
        data: { type: 'any', description: 'Dados extraídos' },
        elements_found: { type: 'number', description: 'Número de elementos encontrados' },
        error: { type: 'string', description: 'Mensagem de erro se success=false' }
      }
    }
  },

  // ==================== METADATA ====================
  tags: [
    'beautifulsoup',
    'bs4',
    'scraping',
    'parsing',
    'html',
    'xml',
    'web',
    'extraction',
    'dom',
    'selector'
  ],

  keywords: [
    'beautifulsoup',
    'bs4',
    'scraping',
    'scrape',
    'raspagem',
    'parsing',
    'parse',
    'html',
    'xml',
    'extract',
    'extrair',
    'web',
    'page',
    'pagina',
    'selector',
    'css',
    'find',
    'buscar'
  ],

  performance: {
    speed: 7,
    memory: 8,
    cpuIntensive: false,
    gpuAccelerated: false,
    scalability: 6
  },

  // ==================== REGRAS DE SCORING ====================
  scoring: {
    baseScore: 0.90,
    rules: [
      {
        condition: 'keywords include ["scraping", "scrape", "extrair", "extract"]',
        adjustment: 0.08,
        description: 'Perfeito para web scraping'
      },
      {
        condition: 'keywords include ["html", "parse", "parsing"]',
        adjustment: 0.08,
        description: 'Ideal para parsing de HTML'
      },
      {
        condition: 'keywords include ["table", "tabela", "dados"]',
        adjustment: 0.05,
        description: 'Ótimo para extrair tabelas'
      },
      {
        condition: 'keywords include ["link", "links", "url"]',
        adjustment: 0.05,
        description: 'Excelente para coletar links'
      },
      {
        condition: 'keywords include ["text", "texto", "content"]',
        adjustment: 0.05,
        description: 'Bom para extrair texto'
      },
      {
        condition: 'keywords include ["selector", "css", "class", "id"]',
        adjustment: 0.05,
        description: 'Suporte completo a CSS selectors'
      },
      {
        condition: 'keywords include ["javascript", "js", "dynamic", "ajax"]',
        adjustment: -0.60,
        description: 'Não executa JavaScript, use Selenium/Playwright'
      },
      {
        condition: 'keywords include ["api", "rest", "json"] AND NOT include ["html", "scraping"]',
        adjustment: -0.40,
        description: 'Para APIs REST, use requests diretamente'
      },
      {
        condition: 'keywords include ["large scale", "millions", "concurrent"]',
        adjustment: -0.30,
        description: 'Para larga escala, use Scrapy'
      }
    ]
  },

  // ==================== CONFIGURAÇÕES ADICIONAIS ====================
  config: {
    maxRetries: 3,
    timeout: 10000,
    cacheable: true,
    requiresAuth: false,
    rateLimit: null
  },

  // ==================== ALTERNATIVAS ====================
  alternatives: [
    {
      name: 'Scrapy',
      when: 'Web scraping em larga escala, crawling complexo',
      reason: 'Scrapy é framework completo para scraping em produção'
    },
    {
      name: 'Selenium/Playwright',
      when: 'Sites com JavaScript, conteúdo dinâmico',
      reason: 'Renderizam JavaScript e simulam navegador real'
    },
    {
      name: 'lxml',
      when: 'Performance crítica, parsing muito rápido',
      reason: 'lxml é mais rápido mas API menos conveniente'
    },
    {
      name: 'Requests + Regex',
      when: 'Extração muito simples, padrões regulares',
      reason: 'Regex pode ser mais direto para casos triviais'
    }
  ],

  // ==================== DOCUMENTAÇÃO ====================
  documentation: {
    official: 'https://www.crummy.com/software/BeautifulSoup/bs4/doc/',
    examples: 'https://www.crummy.com/software/BeautifulSoup/bs4/doc/#quick-start',
    apiReference: 'https://www.crummy.com/software/BeautifulSoup/bs4/doc/#methods'
  },

  // ==================== TROUBLESHOOTING ====================
  commonIssues: [
    {
      issue: 'Elemento retorna None',
      solution: 'Sempre verificar se elemento existe antes de acessar',
      code: `element = soup.find('div', class_='content')
if element:
    text = element.get_text()
else:
    text = "Elemento não encontrado"`
    },
    {
      issue: 'KeyError ao acessar atributo',
      solution: 'Usar .get() ao invés de []',
      code: `# Errado: href = a_tag['href']  # KeyError se não existir
# Certo:
href = a_tag.get('href', '')  # Retorna '' se não existir`
    },
    {
      issue: 'Parsing lento',
      solution: 'Usar lxml ao invés de html.parser',
      code: `# Mais rápido
soup = BeautifulSoup(html, 'lxml')
# Mais lento
soup = BeautifulSoup(html, 'html.parser')`
    },
    {
      issue: 'Texto com espaços em branco excessivos',
      solution: 'Usar strip=True em get_text()',
      code: `text = element.get_text(strip=True)
# ou
text = element.get_text().strip()`
    },
    {
      issue: 'Encoding errado (caracteres estranhos)',
      solution: 'Especificar encoding correto',
      code: `response = requests.get(url)
response.encoding = 'utf-8'
soup = BeautifulSoup(response.content, 'lxml')`
    }
  ],

  // ==================== BEST PRACTICES ====================
  bestPractices: [
    'Sempre especifique o parser (lxml é mais rápido)',
    'Verifique se elemento existe antes de acessar (if element:)',
    'Use .get() para atributos ao invés de [] para evitar KeyError',
    'Use strip=True em get_text() para remover espaços',
    'Combine com requests para buscar páginas HTML',
    'Use CSS selectors (.select()) para buscas complexas',
    'Remova scripts e styles antes de extrair texto',
    'Use urljoin() para converter URLs relativas em absolutas'
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

export default BeautifulSoupModule;
