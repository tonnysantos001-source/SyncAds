---
title: SyncAds Playwright Service
emoji: 🎭
colorFrom: blue
colorTo: purple
sdk: docker
pinned: false
license: mit
---

# 🎭 SyncAds Playwright Automation Service

Serviço de automação web usando Playwright para o SyncAds.

## 🚀 Funcionalidades

- **Navigate**: Navega para URLs
- **Type**: Digita texto em campos
- **Click**: Clica em elementos

## 📡 API Endpoints

### GET /
Status do serviço

### GET /health
Health check do navegador

### POST /automation
Executa ações de automação

**Exemplo:**
```json
{
  "action": "navigate",
  "url": "https://google.com"
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "✅ Página aberta: Google",
  "data": {
    "title": "Google",
    "url": "https://google.com"
  }
}
```

## 🛠️ Stack

- Python 3.11
- FastAPI
- Playwright
- Chromium headless

## 📝 Licença

MIT
