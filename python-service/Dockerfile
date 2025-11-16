# ============================================
# SYNCADS PYTHON MICROSERVICE - DOCKERFILE
# OMNIBRAIN ULTIMATE - GRUPOS 23-120
# Python 3.11+
# Build time: ~95-120 minutos
# Data: 19/01/2025
# ============================================

FROM python:3.11-slim

# Metadados
LABEL maintainer="SyncAds Team"
LABEL description="SyncAds Python AI Microservice - OMNIBRAIN ULTIMATE (Grupos 23-120)"
LABEL version="2.0.120"

# Variáveis de ambiente
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DEBIAN_FRONTEND=noninteractive \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PORT=8000

# Instalar dependências do sistema (mínimas)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    libpq-dev \
    libssl-dev \
    libffi-dev \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Criar virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Upgrade pip
RUN pip install --upgrade pip==24.0

# Criar diretório de trabalho
WORKDIR /app

# Copiar requirements
COPY requirements.txt .

# Instalar dependências Python
RUN echo "=== INSTALANDO OMNIBRAIN ULTIMATE - GRUPOS 23-120 ===" && \
    pip install --no-cache-dir -r requirements.txt && \
    echo "=== INSTALAÇÃO CONCLUÍDA ==="

# Copiar código da aplicação
COPY ./app ./app

# Criar diretórios necessários
RUN mkdir -p /app/temp /app/logs

# Verificar instalação
RUN echo "=== VERIFICANDO INSTALAÇÃO ===" && \
    python -c "import fastapi; print(f'✅ FastAPI: {fastapi.__version__}')" && \
    python -c "import openai; print(f'✅ OpenAI: {openai.__version__}')" && \
    python -c "import anthropic; print(f'✅ Anthropic: {anthropic.__version__}')" && \
    python -c "import groq; print(f'✅ Groq: {groq.__version__}')" && \
    python -c "import cohere; print('✅ Cohere: OK')" && \
    python -c "import google.generativeai; print('✅ Gemini: OK')" && \
    python -c "import transformers; print(f'✅ Transformers: {transformers.__version__}')" && \
    python -c "import tokenizers; print(f'✅ Tokenizers: {tokenizers.__version__}')" && \
    python -c "import huggingface_hub; print('✅ HuggingFace Hub: OK')" && \
    python -c "import pypdf; print('✅ PyPDF: OK')" && \
    python -c "import docx; print('✅ python-docx: OK')" && \
    python -c "import pptx; print('✅ python-pptx: OK')" && \
    python -c "import pandas; print(f'✅ Pandas: {pandas.__version__}')" && \
    python -c "import numpy; print(f'✅ NumPy: {numpy.__version__}')" && \
    python -c "import scipy; print(f'✅ SciPy: {scipy.__version__}')" && \
    python -c "import matplotlib; print(f'✅ Matplotlib: {matplotlib.__version__}')" && \
    python -c "import plotly; print(f'✅ Plotly: {plotly.__version__}')" && \
    python -c "import seaborn; print(f'✅ Seaborn: {seaborn.__version__}')" && \
    python -c "import requests; print(f'✅ Requests: {requests.__version__}')" && \
    python -c "import validators; print('✅ Validators: OK')" && \
    python -c "import dateutil; print('✅ DateUtil: OK')" && \
    python -c "import openpyxl; print(f'✅ OpenPyXL: {openpyxl.__version__}')" && \
    python -c "import xlsxwriter; print('✅ XlsxWriter: OK')" && \
    python -c "import xlrd; print(f'✅ xlrd: {xlrd.__VERSION__}')" && \
    python -c "from bs4 import BeautifulSoup; print('✅ BeautifulSoup: OK')" && \
    python -c "import lxml; print(f'✅ lxml: {lxml.__version__}')" && \
    python -c "import html5lib; print('✅ html5lib: OK')" && \
    python -c "import langchain; print(f'✅ LangChain: {langchain.__version__}')" && \
    python -c "import tiktoken; print('✅ Tiktoken: OK')" && \
    python -c "from langchain_openai import ChatOpenAI; print('✅ LangChain-OpenAI: OK')" && \
    python -c "from PIL import Image; print('✅ Pillow: OK')" && \
    python -c "import pillow_heif; print('✅ Pillow-HEIF: OK')" && \
    python -c "import imageio; print(f'✅ ImageIO: {imageio.__version__}')" && \
    python -c "import aiohttp; print(f'✅ aiohttp: {aiohttp.__version__}')" && \
    python -c "import websockets; print(f'✅ websockets: {websockets.__version__}')" && \
    python -c "import httpx_sse; print('✅ httpx-sse: OK')" && \
    python -c "import sqlalchemy; print(f'✅ SQLAlchemy: {sqlalchemy.__version__}')" && \
    python -c "import alembic; print(f'✅ Alembic: {alembic.__version__}')" && \
    python -c "import asyncpg; print(f'✅ asyncpg: {asyncpg.__version__}')" && \
    python -c "from jose import jwt; print('✅ python-jose: OK')" && \
    python -c "import passlib; print(f'✅ passlib: {passlib.__version__}')" && \
    python -c "import bcrypt; print(f'✅ bcrypt: {bcrypt.__version__}')" && \
    python -c "import click; print(f'✅ click: {click.__version__}')" && \
    python -c "import typer; print('✅ typer: OK')" && \
    python -c "import tqdm; print(f'✅ tqdm: {tqdm.__version__}')" && \
    python -c "import orjson; print('✅ orjson: OK')" && \
    python -c "import multipart; print('✅ python-multipart: OK')" && \
    python -c "import email_validator; print('✅ email-validator: OK')" && \
    python -c "import markdown; print(f'✅ markdown: {markdown.__version__}')" && \
    python -c "import mistune; print(f'✅ mistune: {mistune.__version__}')" && \
    python -c "import pygments; print(f'✅ pygments: {pygments.__version__}')" && \
    python -c "import redis; print(f'✅ redis: {redis.__version__}')" && \
    python -c "import diskcache; print(f'✅ diskcache: {diskcache.__version__}')" && \
    python -c "import cachetools; print(f'✅ cachetools: {cachetools.__version__}')" && \
    python -c "from slugify import slugify; print('✅ python-slugify: OK')" && \
    python -c "import unidecode; print('✅ unidecode: OK')" && \
    python -c "import chardet; print(f'✅ chardet: {chardet.__version__}')" && \
    python -c "import pathlib2; print('✅ pathlib2: OK')" && \
    python -c "import watchdog; print('✅ watchdog: OK')" && \
    python -c "import filelock; print('✅ filelock: OK')" && \
    python -c "import schedule; print('✅ schedule: OK')" && \
    python -c "import croniter; print('✅ croniter: OK')" && \
    python -c "import arrow; print('✅ arrow: OK')" && \
    python -c "import py7zr; print('✅ py7zr: OK')" && \
    python -c "import msgpack; print('✅ msgpack: OK')" && \
    python -c "import cloudpickle; print('✅ cloudpickle: OK')" && \
    python -c "import urllib3; print(f'✅ urllib3: {urllib3.__version__}')" && \
    python -c "import certifi; print(f'✅ certifi: {certifi.__version__}')" && \
    python -c "import idna; print(f'✅ idna: {idna.__version__}')" && \
    python -c "import sentry_sdk; print(f'✅ sentry-sdk: {sentry_sdk.VERSION}')" && \
    python -c "import pythonjsonlogger; print('✅ python-json-logger: OK')" && \
    python -c "import structlog; print('✅ structlog: OK')" && \
    python -c "import dns; print('✅ dnspython: OK')" && \
    python -c "import psutil; print('✅ psutil: OK')" && \
    python -c "import ipaddress; print('✅ ipaddress: OK')" && \
    python -c "import cryptography; print('✅ cryptography: OK')" && \
    python -c "from Crypto.Cipher import AES; print('✅ pycryptodome: OK')" && \
    python -c "import pyotp; print('✅ pyotp: OK')" && \
    python -c "import furl; print('✅ furl: OK')" && \
    python -c "import yarl; print('✅ yarl: OK')" && \
    python -c "import webargs; print('✅ webargs: OK')" && \
    python -c "from decouple import config; print('✅ python-decouple: OK')" && \
    python -c "import configparser; print('✅ configparser: OK')" && \
    python -c "import environs; print('✅ environs: OK')" && \
    python -c "import jinja2; print(f'✅ jinja2: {jinja2.__version__}')" && \
    python -c "import mako; print(f'✅ mako: {mako.__version__}')" && \
    python -c "import chevron; print('✅ chevron: OK')" && \
    python -c "import marshmallow; print(f'✅ marshmallow: {marshmallow.__version__}')" && \
    python -c "import cerberus; print('✅ cerberus: OK')" && \
    python -c "import voluptuous; print('✅ voluptuous: OK')" && \
    python -c "import regex; print(f'✅ regex: {regex.__version__}')" && \
    python -c "import phonenumbers; print(f'✅ phonenumbers: {phonenumbers.__version__}')" && \
    python -c "import dateparser; print('✅ dateparser: OK')" && \
    python -c "import pytz; print(f'✅ pytz: {pytz.__version__}')" && \
    python -c "import babel; print(f'✅ babel: {babel.__version__}')" && \
    python -c "import i18n; print('✅ python-i18n: OK')" && \
    python -c "import xmltodict; print('✅ xmltodict: OK')" && \
    python -c "import yaml; print('✅ pyyaml: OK')" && \
    python -c "import ruamel.yaml; print('✅ ruamel.yaml: OK')" && \
    python -c "import tenacity; print('✅ tenacity: OK')" && \
    python -c "import backoff; print('✅ backoff: OK')" && \
    python -c "import retrying; print('✅ retrying: OK')" && \
    python -c "from fake_useragent import UserAgent; print('✅ fake-useragent: OK')" && \
    python -c "import user_agents; print('✅ user-agents: OK')" && \
    python -c "import httpagentparser; print('✅ httpagentparser: OK')" && \
    python -c "import colorama; print(f'✅ colorama: {colorama.__version__}')" && \
    python -c "import termcolor; print('✅ termcolor: OK')" && \
    python -c "import colorlog; print('✅ colorlog: OK')" && \
    python -c "import geopy; print('✅ geopy: OK')" && \
    python -c "import geocoder; print('✅ geocoder: OK')" && \
    python -c "import geoip2; print('✅ geoip2: OK')" && \
    python -c "import forex_python; print('✅ forex-python: OK')" && \
    python -c "import money; print('✅ money: OK')" && \
    python -c "import moneyed; print('✅ py-moneyed: OK')" && \
    python -c "import shortuuid; print('✅ shortuuid: OK')" && \
    python -c "import ulid; print('✅ ulid-py: OK')" && \
    python -c "import nanoid; print('✅ nanoid: OK')" && \
    python -c "import xxhash; print('✅ xxhash: OK')" && \
    python -c "import mmh3; print('✅ mmh3: OK')" && \
    python -c "import crc32c; print('✅ crc32c: OK')" && \
    python -c "import requests_toolbelt; print('✅ requests-toolbelt: OK')" && \
    python -c "import requests_cache; print('✅ requests-cache: OK')" && \
    python -c "import respx; print('✅ respx: OK')" && \
    python -c "import more_itertools; print('✅ more-itertools: OK')" && \
    python -c "import toolz; print('✅ toolz: OK')" && \
    python -c "import cytoolz; print('✅ cytoolz: OK')" && \
    python -c "import black; print(f'✅ black: {black.__version__}')" && \
    python -c "import autopep8; print(f'✅ autopep8: {autopep8.__version__}')" && \
    python -c "import isort; print(f'✅ isort: {isort.__version__}')" && \
    python -c "import humanize; print('✅ humanize: OK')" && \
    python -c "import inflect; print('✅ inflect: OK')" && \
    python -c "import num2words; print('✅ num2words: OK')" && \
    python -c "import qrcode; print('✅ qrcode: OK')" && \
    python -c "import barcode; print('✅ python-barcode: OK')" && \
    python -c "import segno; print('✅ segno: OK')" && \
    python -c "import deepdiff; print('✅ deepdiff: OK')" && \
    python -c "import jsondiff; print('✅ jsondiff: OK')" && \
    python -c "import dictdiffer; print('✅ dictdiffer: OK')" && \
    python -c "import bleach; print('✅ bleach: OK')" && \
    python -c "import html_sanitizer; print('✅ html-sanitizer: OK')" && \
    python -c "import ftfy; print('✅ ftfy: OK')" && \
    python -c "import ratelimit; print('✅ ratelimit: OK')" && \
    python -c "import limits; print('✅ limits: OK')" && \
    python -c "import slowapi; print('✅ slowapi: OK')" && \
    python -c "import attr; print('✅ attrs: OK')" && \
    python -c "import cattrs; print('✅ cattrs: OK')" && \
    python -c "import sortedcontainers; print('✅ sortedcontainers: OK')" && \
    python -c "import paramiko; print('✅ paramiko: OK')" && \
    python -c "import fabric; print('✅ fabric: OK')" && \
    python -c "from scp import SCPClient; print('✅ scp: OK')" && \
    echo "=== BUILD CONCLUÍDO COM SUCESSO ==="

# Expor porta
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Comando de inicialização
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]

# ============================================
# NOTAS - OMNIBRAIN ULTIMATE:
# ============================================
# ✅ ~301 bibliotecas totais (grupos 23-120)
# ✅ GRUPOS 23-99: AI, Data Science, Web, Database, etc
# ✅ GRUPOS 100-120: Task Queues, Payments, SMS, ML, Vision, etc
# ✅ Inclui: OpenAI, Claude, Groq, Gemini, Cohere
# ✅ Inclui: XGBoost, LightGBM, CatBoost, Prophet
# ✅ Inclui: Scrapy, Selenium, Playwright
# ✅ Inclui: Stripe, Twilio, Telegram Bot
# ✅ Inclui: Neo4j, Cassandra, Elasticsearch
# ✅ Inclui: Prefect, Dagster (Workflow)
# ✅ Inclui: Sphinx, Rich, Textual (Docs/CLI)
# ✅ Tempo: ~95-120 minutos
# ✅ Build otimizado e completo
# ❌ Removido: TensorFlow, PyTorch, Airflow (muito pesados)
# ✅ Sistema OMNIBRAIN pronto para produção!
# ============================================
