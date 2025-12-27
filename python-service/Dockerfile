# Dockerfile otimizado para Hugging Face Spaces - V3 (FINAL)
FROM python:3.11-slim

# Variáveis de ambiente
ENV PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive

# Instalar TODAS as dependências necessárias (uma vez só)
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libwayland-client0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xdg-utils \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    && rm -rf /var/lib/apt/lists/*

# Criar diretório da app
WORKDIR /app

# Copiar requirements limpo
COPY requirements-hf.txt ./
RUN pip install --no-cache-dir -r requirements-hf.txt

# Instalar APENAS Playwright (sem install-deps que causa problema)
RUN playwright install chromium

# Copiar código
COPY app/ ./app/

# Porta padrão do Hugging Face
EXPOSE 7860

# Comando de inicialização
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
