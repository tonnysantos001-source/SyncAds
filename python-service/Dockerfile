FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
# build-essential: for compiling python packages
# libgl1/libglib2.0: for opencv (even headless sometimes needs glib)
# libpango/libcairo/libgdk-pixbuf: for weasyprint
RUN apt-get update && apt-get install -y \
    build-essential \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libcairo2 \
    libgdk-pixbuf2.0-0 \
    libffi-dev \
    shared-mime-info \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Playwright browsers (Chromium only for Railway)
# This is required for browser automation to work
RUN playwright install --with-deps chromium

COPY . .

# Set python path
ENV PYTHONPATH=/app

# Railway provides PORT
ENV PORT=8000

# Start command (shell form para expandir variável corretamente)
CMD sh -c "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1"
