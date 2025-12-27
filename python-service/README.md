---
title: SyncAds Playwright Automation
emoji: 🎭
colorFrom: blue
colorTo: purple
sdk: docker
pinned: false
app_port: 7860
---

# SyncAds Playwright Automation Service

Browser automation service using Playwright for SyncAds.

## Endpoints

- `GET /` - Service info
- `GET /health` - Health check
- `POST /automation` - Execute browser actions

## Usage

```bash
curl -X POST https://bigodetonton-syncads.hf.space/automation \
  -H "Content-Type: application/json" \
  -d '{"action":"navigate","url":"https://google.com"}'
```
