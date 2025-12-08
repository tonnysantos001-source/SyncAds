# ============================================
# SYNCADS PYTHON MICROSERVICE - DOCKERFILE
# OMNIBRAIN ULTIMATE - Simplified Build
# Python 3.11+
# ============================================

FROM python:3.11-slim

# Metadados
LABEL maintainer="SyncAds Team"
LABEL description="SyncAds Python AI Microservice with Extension Support"
LABEL version="2.1.0"

# Variáveis de ambiente
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DEBIAN_FRONTEND=noninteractive \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PORT=8000

# Instalar dependências do sistema (SIMPLIFICADO)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    libpq-dev \
    curl \
    ca-certificates && \
    rm -rf /var/lib/apt/lists/* && \
    apt-get clean

# Criar virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Upgrade pip
RUN pip install --upgrade pip==24.0

# Criar diretório de trabalho
WORKDIR /app

# Copiar requirements
COPY python-service/requirements.txt .

# Instalar dependências Python
RUN echo "=== INSTALANDO DEPENDENCIAS ===" && \
    pip install --no-cache-dir -r requirements.txt && \
    echo "=== INSTALACAO CONCLUIDA ==="

# Copiar código da aplicação
COPY python-service/app ./app

# Criar diretórios necessários
RUN mkdir -p /app/temp /app/logs

# Verificação simplificada - apenas principais
RUN python -c "import fastapi; print('FastAPI OK')" && \
    python -c "import anthropic; print('Anthropic OK')" && \
    python -c "import openai; print('OpenAI OK')" && \
    python -c "import supabase; print('Supabase OK')" && \
    echo "=== BUILD CONCLUIDO ==="

# Expor porta
EXPOSE 8000

# Copiar e dar permissão ao script de start
COPY python-service/start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Health check  
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# ✅ Usar script de start que GARANTE expansão de PORT
CMD ["/app/start.sh"]
