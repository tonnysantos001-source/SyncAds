# HTTPX

## Informações Básicas
- **Nome:** httpx
- **Categoria:** HTTP Client, Async HTTP, API Integration
- **Versão Mínima:** 0.24.0
- **Versão Recomendada:** 0.26.0+
- **Licença:** BSD
- **Documentação:** https://www.python-httpx.org/

## Descrição
HTTPX é um cliente HTTP moderno para Python com suporte async/await nativo. API compatível com requests mas com recursos modernos: HTTP/2, async, connection pooling avançado, e timeouts configuráveis.

## Casos de Uso Prioritários
1. **Async HTTP Requests** (confidence: 0.98)
2. **HTTP/2 Support** (confidence: 0.95)
3. **API Calls (Async)** (confidence: 0.95)
4. **Concurrent Requests** (confidence: 0.90)
5. **Modern HTTP Client** (confidence: 0.90)

## Performance
- **Velocidade:** ⭐⭐⭐⭐⭐ (9.5/10)
- **Uso de Memória:** ⭐⭐⭐⭐ (8/10)
- **Facilidade de Uso:** ⭐⭐⭐⭐⭐ (9/10)

## Keywords/Triggers
- httpx
- async http
- http2
- async requests
- concurrent
- api async

## Templates por Caso de Uso

### Template: Async GET
```python
import httpx
async with httpx.AsyncClient() as client:
    response = await client.get("{url}")
    data = response.json()
```

### Template: Multiple Requests
```python
import httpx
import asyncio
async def fetch_all(urls):
    async with httpx.AsyncClient() as client:
        tasks = [client.get(url) for url in urls]
        responses = await asyncio.gather(*tasks)
    return [r.json() for r in responses]
```

## Score de Seleção
```python
def calculate_httpx_score(task_keywords: list) -> float:
    base_score = 0.80
    if 'async' in task_keywords:
        base_score += 0.15
    if 'concurrent' in task_keywords or 'multiple' in task_keywords:
        base_score += 0.10
    return min(base_score, 0.95)
```
