# ============================================
# SYNCADS PYTHON MICROSERVICE - DOCKERFILE
# ============================================
# Multi-stage build para otimizar tamanho
# Python 3.11 + FastAPI + Todas as dependências
# ============================================

# ==========================================
# STAGE 1: Builder
# ==========================================
FROM python:3.11-slim as builder

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    make \
    libpq-dev \
    libffi-dev \
    libssl-dev \
    libjpeg-dev \
    libpng-dev \
    libfreetype6-dev \
    libtiff-dev \
    libwebp-dev \
    libopenjp2-7-dev \
    zlib1g-dev \
    curl \
    wget \
    git \
    && rm -rf /var/lib/apt/lists/*

# Criar diretório de trabalho
WORKDIR /build

# Copiar requirements
COPY requirements.txt .

# Instalar dependências Python em um virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Upgrade pip
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# Instalar dependências
RUN pip install --no-cache-dir -r requirements.txt

# Instalar Playwright browsers
RUN playwright install chromium
RUN playwright install-deps chromium

# ==========================================
# STAGE 2: Runtime
# ==========================================
FROM python:3.11-slim

# Metadados
LABEL maintainer="SyncAds Team"
LABEL description="SyncAds Python Microservice - Scraping, IA, ML e mais"
LABEL version="1.0.0"

# Variáveis de ambiente
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DEBIAN_FRONTEND=noninteractive \
    PORT=8000 \
    WORKERS=4

# Instalar dependências do sistema runtime
RUN apt-get update && apt-get install -y \
    libpq5 \
    libjpeg62-turbo \
    libpng16-16 \
    libfreetype6 \
    libtiff5 \
    libwebp6 \
    libopenjp2-7 \
    zlib1g \
    curl \
    wget \
    ca-certificates \
    fonts-liberation \
    libnss3 \
    libxss1 \
    libappindicator3-1 \
    libgbm1 \
    xdg-utils \
    libx11-xcb1 \
    libxcb-dri3-0 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxi6 \
    libxtst6 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgdk-pixbuf2.0-0 \
    libgtk-3-0 \
    libpango-1.0-0 \
    libxrandr2 \
    && rm -rf /var/lib/apt/lists/*

# Criar usuário não-root
RUN useradd -m -u 1000 syncads && \
    mkdir -p /app && \
    chown -R syncads:syncads /app

# Copiar virtual environment do builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copiar Playwright browsers do builder
COPY --from=builder /root/.cache/ms-playwright /home/syncads/.cache/ms-playwright
RUN chown -R syncads:syncads /home/syncads/.cache

# Diretório de trabalho
WORKDIR /app

# Copiar aplicação
COPY --chown=syncads:syncads ./app ./app
COPY --chown=syncads:syncads ./requirements.txt .

# Criar diretórios necessários
RUN mkdir -p /app/temp /app/uploads /app/logs && \
    chown -R syncads:syncads /app/temp /app/uploads /app/logs

# Mudar para usuário não-root
USER syncads

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

# Expor porta
EXPOSE ${PORT}

# Comando de inicialização
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT} --workers ${WORKERS}"]
