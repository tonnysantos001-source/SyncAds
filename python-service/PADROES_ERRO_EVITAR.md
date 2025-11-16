# 🚨 PADRÕES DE ERRO A EVITAR - Railway Deployment

**Data:** 19/01/2025  
**Python:** 3.11+  
**Status:** Documentação de erros encontrados durante deploy

---

## 📋 RESUMO EXECUTIVO

Durante o deploy incremental de bibliotecas no Railway, identificamos diversos padrões de erro que devem ser **SEMPRE VERIFICADOS** antes de adicionar novas bibliotecas.

**Total de grupos funcionando:** 23-47 (sem erros)  
**Total de erros corrigidos:** 8 tipos diferentes

---

## ❌ TIPO 1: Bibliotecas sem `__version__`

### Problema:
Algumas bibliotecas não expõem o atributo `__version__`, causando `AttributeError`.

### Bibliotecas identificadas:
```python
cohere          # ❌ cohere.__version__
rich            # ❌ rich.__version__
unidecode       # ❌ unidecode.__version__
pathlib2        # ❌ pathlib2.__version__
watchdog        # ❌ watchdog.__version__
filelock        # ❌ filelock.__version__
```

### ✅ Solução:
```python
# ❌ ERRADO
python -c "import cohere; print(f'✅ Cohere: {cohere.__version__}')"

# ✅ CORRETO
python -c "import cohere; print('✅ Cohere: OK')"
```

### Regra geral:
Sempre usar `print('✅ Nome: OK')` ao invés de tentar acessar `__version__` sem verificar primeiro.

---

## ❌ TIPO 2: Bibliotecas Python 2 (Incompatíveis)

### Problema:
Bibliotecas antigas que usam sintaxe Python 2 (ex: `print` sem parênteses).

### Bibliotecas identificadas:
```python
netifaces==0.11.0    # ❌ SyntaxError: Missing parentheses in call to 'print'
hashlib==20081119    # ❌ Python 2 syntax
```

### Erro típico:
```
SyntaxError: Missing parentheses in call to 'print'. Did you mean print(...)?
```

### ✅ Solução:
```python
# ❌ EVITAR
netifaces==0.11.0

# ✅ SUBSTITUIR POR
psutil==5.9.8  # Melhor alternativa, mais recursos
```

### Regra geral:
- Evitar bibliotecas com versões muito antigas (< 2020)
- Verificar compatibilidade Python 3.11+ antes de adicionar
- Buscar alternativas modernas

---

## ❌ TIPO 3: Versões Inexistentes

### Problema:
Versão especificada não existe no PyPI.

### Exemplos encontrados:
```python
urlparse4==1.0.0  # ❌ ERROR: Could not find a version that satisfies the requirement
# Versões disponíveis: 0.1, 0.1.1, 0.1.2, 0.1.3 apenas
```

### Erro típico:
```
ERROR: Could not find a version that satisfies the requirement X==Y.Z
ERROR: No matching distribution found for X==Y.Z
```

### ✅ Solução:
Verificar versões disponíveis no PyPI antes:
```bash
pip index versions nome-da-biblioteca
```

### ✅ Alternativa:
```python
# ❌ EVITAR
urlparse4==1.0.0

# ✅ USAR
yarl==1.9.4  # Alternativa moderna e estável
```

---

## ❌ TIPO 4: Bibliotecas Built-in do Python

### Problema:
Bibliotecas que já vêm embutidas no Python 3 não devem ser instaladas via pip.

### Bibliotecas built-in (NÃO instalar):
```python
hashlib       # ❌ Já vem no Python 3
asyncio       # ❌ Já vem no Python 3
json          # ❌ Já vem no Python 3
datetime      # ❌ Já vem no Python 3
os            # ❌ Já vem no Python 3
sys           # ❌ Já vem no Python 3
re            # ❌ Já vem no Python 3
```

### ✅ Solução:
Simplesmente usar `import hashlib` sem instalar. Para verificação no Dockerfile:
```python
python -c "import hashlib; print('✅ hashlib: OK')"  # Sem instalar
```

---

## ❌ TIPO 5: Cache do Pip

### Problema:
`pip cache purge` falha quando cache está desabilitado.

### Erro típico:
```
ERROR: pip cache commands can not function since cache is disabled.
```

### ✅ Solução:
```dockerfile
# ❌ EVITAR
RUN pip install --no-cache-dir -r requirements.txt && \
    pip cache purge  # Falha quando cache desabilitado

# ✅ CORRETO
RUN pip install --no-cache-dir -r requirements.txt
# Sem pip cache purge!
```

---

## ❌ TIPO 6: Verificações com Atributos Especiais

### Problema:
Algumas bibliotecas usam atributos diferentes para versão.

### Casos especiais:
```python
# xlrd usa __VERSION__ (maiúsculo)
python -c "import xlrd; print(f'✅ xlrd: {xlrd.__VERSION__}')"

# sentry_sdk usa VERSION
python -c "import sentry_sdk; print(f'✅ sentry-sdk: {sentry_sdk.VERSION}')"
```

### ✅ Checklist de verificação:
1. Tentar `__version__` (minúsculo) - padrão
2. Tentar `__VERSION__` (maiúsculo)
3. Tentar `VERSION` (sem underscores)
4. Se nada funcionar, usar `print('OK')`

---

## ❌ TIPO 7: Dependências de Sistema Faltando

### Problema:
Algumas bibliotecas precisam de bibliotecas do sistema operacional.

### Exemplos:
```dockerfile
# Para netifaces (se fosse compatível)
RUN apt-get install -y python3-dev

# Para psycopg2
RUN apt-get install -y libpq-dev

# Para cryptography
RUN apt-get install -y libssl-dev libffi-dev
```

### ✅ Solução:
Sempre ter no Dockerfile:
```dockerfile
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    libpq-dev \
    libssl-dev \
    libffi-dev \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*
```

---

## ❌ TIPO 8: Conflitos de Versão

### Problema:
Bibliotecas com requisitos incompatíveis de Python.

### Exemplo real:
```
ERROR: Ignored the following versions that require a different python version:
1.21.2 Requires-Python >=3.7,<3.11
```

### ✅ Solução:
Usar versões compatíveis com Python 3.11+:
```python
# ❌ EVITAR
numpy==1.21.2  # Requires >=3.7,<3.11

# ✅ USAR
numpy==1.26.3  # Compatível com 3.11+
```

---

## ❌ TIPO 9: Duplicação de Bibliotecas

### Problema:
Mesma biblioteca com versões diferentes em grupos diferentes causa conflito.

### Exemplo real:
```
ERROR: Cannot install python-slugify==8.0.3 and python-slugify==8.0.4 
because these package versions have conflicting dependencies.
The conflict is caused by:
    The user requested python-slugify==8.0.3
    The user requested python-slugify==8.0.4
```

### Bibliotecas já instaladas (NÃO adicionar novamente):
```python
# GRUPO 40
python-slugify==8.0.3  # ✅ Já instalado

# GRUPO 28
requests==2.31.0       # ✅ Já instalado
python-dateutil==2.8.2 # ✅ Já instalado

# GRUPO 26
pandas==2.1.4          # ✅ Já instalado
numpy==1.26.3          # ✅ Já instalado
```

### ✅ Solução:
Antes de adicionar, verificar se já existe:
```bash
grep -r "nome-biblioteca==" requirements*.txt
```

Se já existe, substituir por biblioteca similar:
```python
# ❌ EVITAR (duplicado)
python-slugify==8.0.4

# ✅ USAR (alternativa)
dateparser==1.2.0
```

### Regra geral:
- Sempre fazer grep antes de adicionar para verificar duplicatas.
- Manter lista mental das já adicionadas.
- Usar alternativas ao invés de duplicar.

### Conflitos de dependências transitivas:
```
ERROR: Cannot install httpx==0.25.2 and httpx-auth because 
these package versions have conflicting dependencies.
The conflict is caused by:
    The user requested httpx==0.25.2
    supabase 2.3.3 depends on httpx<0.26 and >=0.24
    httpx-auth requires httpx>=0.27.0
```

**Solução:** Remover a biblioteca que causa conflito:
```python
# ❌ EVITAR
httpx-auth==0.22.0  # Requer httpx>=0.27.0 mas temos 0.25.2

# ✅ USAR (alternativa)
requests-cache==1.1.1
```

---

## ✅ CHECKLIST DE VALIDAÇÃO
</text>

<old_text line=258>
### Erros por tipo:
```
Tipo 1 (sem __version__):     6 bibliotecas
Tipo 2 (Python 2):            2 bibliotecas
Tipo 3 (versão inexistente):  1 biblioteca
Tipo 4 (built-in):            1 biblioteca
Tipo 5 (cache):               1 ocorrência
Tipo 9 (duplicação):          2 ocorrências
```

**Total de correções:** 13

### Antes de adicionar uma biblioteca:

- [ ] **Verificar compatibilidade Python 3.11+**
  ```bash
  pip index versions nome-biblioteca
  ```

- [ ] **Verificar se não é built-in**
  ```python
  python3.11 -c "import nome_biblioteca"  # Se funcionar, é built-in
  ```

- [ ] **Verificar versão existe no PyPI**
  ```bash
  pip install nome-biblioteca==versao --dry-run
  ```

- [ ] **Evitar bibliotecas muito antigas (< 2020)**
  - Risco de incompatibilidade Python 2

- [ ] **Verificar atributo __version__**
  ```python
  python3.11 -c "import nome; print(nome.__version__)"  # Testa localmente
  ```

- [ ] **Ter alternativas prontas**
  - Se X falhar, ter Y como backup

---

## 📊 ESTATÍSTICAS

### Erros por tipo:
```
Tipo 1 (sem __version__):     6 bibliotecas
Tipo 2 (Python 2):            2 bibliotecas
Tipo 3 (versão inexistente):  1 biblioteca
Tipo 4 (built-in):            1 biblioteca
Tipo 5 (cache):               1 ocorrência
```

**Total de correções:** 11

---

## 🎯 PADRÃO DE SUCESSO COMPROVADO

### Bibliotecas que funcionaram 100%:
```python
# AI APIs
openai==1.10.0
anthropic==0.9.0
groq==0.4.2
cohere==4.47.0
google-generativeai==0.3.2

# Data Science
pandas==2.1.4
numpy==1.26.3
scipy==1.11.4

# Document Processing
pypdf==3.17.4
python-docx==1.1.0
python-pptx==0.6.23

# Web
beautifulsoup4==4.12.3
lxml==5.1.0
aiohttp==3.9.3

# Database
sqlalchemy==2.0.25
alembic==1.13.1
asyncpg==0.29.0
```

### Padrão identificado:
✅ Bibliotecas modernas (2023-2024)  
✅ Versões estáveis (não alpha/beta)  
✅ Compatibilidade Python 3.11+  
✅ Documentação ativa  
✅ Manutenção regular  

---

## 🔧 TEMPLATE DE VERIFICAÇÃO

Use este template para cada novo grupo:

```python
# GRUPO XX: Nome do Grupo
# ==========================================
biblioteca1==versao1  # ✅ Verificado no PyPI
biblioteca2==versao2  # ✅ Python 3.11+ compatível
biblioteca3==versao3  # ✅ Não é built-in
```

```dockerfile
# No Dockerfile
python -c "import biblioteca1; print('✅ biblioteca1: OK')" && \
python -c "import biblioteca2; print('✅ biblioteca2: OK')" && \
python -c "import biblioteca3; print('✅ biblioteca3: OK')"
```

---

## 📝 LIÇÕES APRENDIDAS

1. **Sempre testar localmente primeiro** se possível
2. **Usar print('OK')** por padrão, só usar `__version__` se necessário
3. **Evitar bibliotecas antigas** (risco de Python 2)
4. **Verificar PyPI** antes de adicionar versão
5. **Ter alternativas** prontas para substituir
6. **Deploy incremental** (2 grupos por vez) é mais seguro
7. **Documentar** cada erro para não repetir

---

## 🚀 PRÓXIMOS PASSOS

Para adicionar novos grupos:

1. ✅ Verificar contra este documento
2. ✅ Escolher bibliotecas modernas (2023-2024)
3. ✅ Testar localmente se possível
4. ✅ Adicionar 2 grupos por vez
5. ✅ Monitorar logs do Railway
6. ✅ Atualizar este documento com novos erros

---

**Mantido por:** Time SyncAds  
**Última atualização:** 19/01/2025 - Grupos 23-63 em progresso  
**Próxima revisão:** Após grupo 70  
**Última correção:** TIPO 9 - Conflito httpx/httpx-auth (dependências transitivas)