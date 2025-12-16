# ============================================
# SYNCADS PYTHON MICROSERVICE - DOCKERFILE
# Build from repository ROOT
# Python 3.11+
# ============================================

FROM python:3.11-slim

# Metadados
LABEL maintainer="SyncAds Team"
LABEL description="SyncAds Python AI Microservice"
LABEL version="2.1.0"

# Variáveis de ambiente
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DEBIAN_FRONTEND=noninteractive \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PORT=8000

# Instalar dependências do sistema + WeasyPrint libs
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    libpq-dev \
    curl \
    ca-certificates \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf-2.0-0 \
    libffi-dev \
    shared-mime-info && \
    rm -rf /var/lib/apt/lists/* && \
    apt-get clean

# Criar virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Upgrade pip
RUN pip install --upgrade pip==24.0

# Criar diretório de trabalho
WORKDIR /app

# Copiar requirements FROM python-service folder
COPY python-service/requirements.txt .

# Instalar dependências Python
ARG CACHEBUST=1
RUN echo "=== INSTALANDO DEPENDENCIAS (CACHEBUST: ${CACHEBUST}) ===" && \
    pip install --no-cache-dir -r requirements.txt && \
    echo "=== INSTALACAO CONCLUIDA ==="

# Copiar código da aplicação FROM python-service folder
COPY python-service/app ./app

# Criar diretórios necessários
RUN mkdir -p /app/temp /app/logs

# Verificação simplificada
RUN python -c "import fastapi; print('FastAPI OK')" && \
    python -c "import anthropic; print('Anthropic OK')" && \
    python -c "import openai; print('OpenAI OK')" && \
    python -c "import supabase; print('Supabase OK')" && \
    echo "=== BUILD CONCLUIDO ==="

# Expor porta
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start command (shell form para expansão de variável)
CMD sh -c "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1"
