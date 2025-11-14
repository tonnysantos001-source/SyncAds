# Requests

## Informações Básicas

- **Nome:** requests
- **Categoria:** HTTP Client, API Integration, Web Scraping
- **Versão Mínima:** 2.25.0
- **Versão Recomendada:** 2.31.0+
- **Licença:** Apache 2.0
- **Documentação:** https://requests.readthedocs.io/

## Descrição

Requests é a biblioteca HTTP mais popular e elegante para Python. Com o slogan "HTTP for Humans", oferece uma API simples e intuitiva para fazer requisições HTTP/HTTPS, ideal para consumir APIs REST, scraping de sites estáticos e download de arquivos.

## Casos de Uso Prioritários

1. **Consumir APIs REST** (confidence: 0.98)
2. **Download de Arquivos** (confidence: 0.95)
3. **Scraping de Sites Estáticos** (confidence: 0.90)
4. **Autenticação em APIs** (confidence: 0.95)
5. **Upload de Arquivos** (confidence: 0.90)
6. **Web Hooks/Callbacks** (confidence: 0.90)
7. **Integração com Serviços Externos** (confidence: 0.95)

## Prós

- ✅ API extremamente simples e intuitiva
- ✅ Suporte completo a HTTP/HTTPS
- ✅ Autenticação (Basic, Digest, OAuth)
- ✅ Sessions com cookies persistentes
- ✅ Timeout automático
- ✅ Retry e connection pooling
- ✅ SSL verification
- ✅ Multipart file uploads
- ✅ Streaming de downloads grandes
- ✅ Documentação excelente
- ✅ Comunidade gigante

## Contras

- ⚠️ Não renderiza JavaScript (use Playwright/Selenium)
- ⚠️ Síncrono (não async) - use httpx para async
- ⚠️ Pode ser bloqueado sem user-agent adequado
- ⚠️ Sem rate limiting built-in

## Performance

- **Velocidade:** ⭐⭐⭐⭐⭐ (9/10)
- **Uso de Memória:** ⭐⭐⭐⭐⭐ (9.5/10)
- **Qualidade de Output:** ⭐⭐⭐⭐ (8/10)
- **Facilidade de Uso:** ⭐⭐⭐⭐⭐ (10/10)

## Instalação

```bash
pip install requests
```

## Keywords/Triggers

- requests
- http
- api
- rest api
- get request
- post request
- download
- web request
- http client
- api call
- fetch data

## Exemplos de Código

### Básico: GET Request

```python
import requests

def fetch_data(url: str) -> dict:
    response = requests.get(url)
    response.raise_for_status()  # Lança exceção se erro HTTP
    
    return {
        "status_code": response.status_code,
        "data": response.json(),
        "headers": dict(response.headers)
    }
```

### Intermediário: POST com JSON

```python
import requests

def post_json_data(url: str, data: dict, headers: dict = None) -> dict:
    default_headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'SyncAds-Bot/1.0'
    }
    
    if headers:
        default_headers.update(headers)
    
    response = requests.post(
        url,
        json=data,
        headers=default_headers,
        timeout=30
    )
    
    response.raise_for_status()
    
    return {
        "success": True,
        "status_code": response.status_code,
        "response": response.json()
    }
```

### Avançado: Download de Arquivo

```python
import requests
from pathlib import Path

def download_file(url: str, output_path: str, chunk_size: int = 8192) -> dict:
    response = requests.get(url, stream=True)
    response.raise_for_status()
    
    total_size = int(response.headers.get('content-length', 0))
    downloaded = 0
    
    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)
    
    with output.open('wb') as f:
        for chunk in response.iter_content(chunk_size=chunk_size):
            if chunk:
                f.write(chunk)
                downloaded += len(chunk)
    
    return {
        "output_path": str(output),
        "size_bytes": downloaded,
        "size_mb": round(downloaded / 1024 / 1024, 2),
        "url": url
    }
```

### Expert: Session com Autenticação

```python
import requests
from requests.auth import HTTPBasicAuth

def api_with_session(base_url: str, username: str, password: str) -> dict:
    # Criar session (mantém cookies e conexões)
    session = requests.Session()
    
    # Configurar autenticação
    session.auth = HTTPBasicAuth(username, password)
    
    # Headers padrão
    session.headers.update({
        'User-Agent': 'SyncAds-Bot/1.0',
        'Accept': 'application/json'
    })
    
    # Fazer requisições
    results = []
    
    # GET
    response = session.get(f"{base_url}/api/user")
    results.append({
        "endpoint": "/api/user",
        "status": response.status_code,
        "data": response.json()
    })
    
    # POST
    response = session.post(
        f"{base_url}/api/data",
        json={"key": "value"}
    )
    results.append({
        "endpoint": "/api/data",
        "status": response.status_code,
        "data": response.json()
    })
    
    session.close()
    
    return {
        "success": True,
        "requests_made": len(results),
        "results": results
    }
```

### Expert: Upload de Arquivo

```python
import requests

def upload_file(url: str, file_path: str, additional_data: dict = None) -> dict:
    files = {
        'file': open(file_path, 'rb')
    }
    
    data = additional_data or {}
    
    response = requests.post(
        url,
        files=files,
        data=data,
        timeout=60
    )
    
    response.raise_for_status()
    
    return {
        "success": True,
        "status_code": response.status_code,
        "response": response.json(),
        "file_uploaded": file_path
    }
```

### Expert: Retry com Backoff

```python
import requests
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry

def request_with_retry(url: str, max_retries: int = 3) -> dict:
    # Configurar retry strategy
    retry_strategy = Retry(
        total=max_retries,
        backoff_factor=1,  # 1s, 2s, 4s...
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["HEAD", "GET", "OPTIONS", "POST"]
    )
    
    adapter = HTTPAdapter(max_retries=retry_strategy)
    
    session = requests.Session()
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    
    response = session.get(url, timeout=30)
    response.raise_for_status()
    
    return {
        "status_code": response.status_code,
        "data": response.json(),
        "retries_used": response.raw.retries if hasattr(response.raw, 'retries') else 0
    }
```

## Templates por Caso de Uso

### Template: Simple GET

```python
response = requests.get("{url}")
data = response.json()
```

### Template: POST with JSON

```python
response = requests.post("{url}", json={data})
response.raise_for_status()
result = response.json()
```

### Template: Download File

```python
response = requests.get("{url}", stream=True)
with open("{output_path}", 'wb') as f:
    for chunk in response.iter_content(chunk_size=8192):
        f.write(chunk)
```

### Template: API with Headers

```python
headers = {"Authorization": "Bearer {token}", "Content-Type": "application/json"}
response = requests.get("{url}", headers=headers)
data = response.json()
```

## Alternativas e Quando Usar

| Biblioteca | Quando Usar em Vez de Requests |
|------------|--------------------------------|
| httpx | Precisa de async/await |
| urllib3 | Controle de baixo nível |
| aiohttp | Async + múltiplas requisições simultâneas |
| Playwright/Selenium | Sites com JavaScript |
| curl (subprocess) | Comandos específicos de curl |

## Requisitos do Sistema

- Python 3.7+
- ~500KB de espaço
- Conexão de internet

## Dependências

```
charset-normalizer>=2.0.0
idna>=2.5
urllib3>=1.21.1
certifi>=2017.4.17
```

## Notas de Compatibilidade

- ✅ Windows, Linux, macOS
- ✅ Python 2.7+ e 3.7+
- ✅ IPv4 e IPv6
- ✅ HTTP/1.1 (HTTP/2 via requests-http2)
- ✅ Proxies HTTP/HTTPS/SOCKS

## Troubleshooting Comum

### Problema: ConnectionError

**Solução:** 
```python
try:
    response = requests.get(url, timeout=10)
except requests.exceptions.ConnectionError:
    # Verificar conexão de internet
    # Verificar se URL está correta
```

### Problema: SSLError

**Solução:**
```python
# Desabilitar verificação SSL (não recomendado para produção)
response = requests.get(url, verify=False)
# Ou especificar certificado
response = requests.get(url, verify='/path/to/cert.pem')
```

### Problema: Timeout

**Solução:**
```python
# Aumentar timeout
response = requests.get(url, timeout=60)
# Ou usar tuple (connect timeout, read timeout)
response = requests.get(url, timeout=(5, 30))
```

### Problema: 403 Forbidden

**Solução:**
```python
# Adicionar User-Agent
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
response = requests.get(url, headers=headers)
```

## Score de Seleção

```python
def calculate_requests_score(task_keywords: list) -> float:
    base_score = 0.85
    
    # Boost para APIs REST
    if any(k in task_keywords for k in ['api', 'rest', 'json', 'http']):
        base_score += 0.10
    
    # Boost para download
    if 'download' in task_keywords:
        base_score += 0.05
    
    # Penalty para sites dinâmicos
    if any(k in task_keywords for k in ['javascript', 'spa', 'dynamic']):
        base_score -= 0.40
    
    # Penalty para async
    if 'async' in task_keywords:
        base_score -= 0.30
    
    return min(base_score, 0.98)
```

## Best Practices

1. **Sempre use timeout:**
   ```python
   requests.get(url, timeout=30)
   ```

2. **Use raise_for_status():**
   ```python
   response.raise_for_status()  # Lança exceção em erros HTTP
   ```

3. **Use sessions para múltiplas requisições:**
   ```python
   with requests.Session() as session:
       session.get(url1)
       session.get(url2)
   ```

4. **Streaming para arquivos grandes:**
   ```python
   response = requests.get(url, stream=True)
   ```

5. **Headers adequados:**
   ```python
   headers = {'User-Agent': 'MyBot/1.0', 'Accept': 'application/json'}
   ```

## Última Atualização

2025-01-15