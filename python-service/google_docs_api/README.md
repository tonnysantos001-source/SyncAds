---
title: SyncAds Google Docs API
emoji: 📝
colorFrom: blue
colorTo: green
sdk: docker
pinned: false
---

# SyncAds Google Docs API

This Hugging Face Space provides a REST API to insert formatted content into Google Docs using the official Google Docs API.

## Features

- ✅ HTML to Google Docs formatting conversion
- ✅ Support for headings (h1-h6)
- ✅ Support for lists (ul/li)
- ✅ Support for images from URLs
- ✅ OAuth2 authentication (token provided by client)

## API Endpoints

### POST /insert-content

Insert formatted HTML content into a Google Docs document.

**Request**:
```json
{
  "doc_id": "1ABC...XYZ",
  "content": "<h1>Title</h1><p>Content</p>",
  "auth_token": "ya29.xxx",
  "position": 1
}
```

**Response**:
```json
{
  "success": true,
  "message": "HTML inserted (5 ops)",
  "doc_url": "https://docs.google.com/document/d/1ABC...XYZ/edit"
}
```

### GET /health

Health check endpoint.

## Usage

This service is designed to be called from the SyncAds Chrome Extension.

## Tech Stack

- FastAPI
- Google Docs API (python-client)
- BeautifulSoup4 (HTML parsing)
- Python 3.11
