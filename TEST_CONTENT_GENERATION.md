# Content Generation - Test Guide

## 🎨 Image Generation Tests

### Test 1: Simple Image (Pollinations - FREE)
```bash
curl https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/generate-image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "um gato astronauta no espaço, arte digital"
  }'
```

**Expected**:
```json
{
  "success": true,
  "image": {
    "url": "https://image.pollinations.ai/prompt/...",
    "prompt": "um gato astronauta no espaço, arte digital",
    "provider": "Pollinations.ai",
    "cost": 0,
    "free": true
  }
}
```

### Test 2: High Quality Image (DALL-E if configured)
```bash
curl https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/generate-image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "paisagem futurista cyberpunk com neon",
    "quality": "hd",
    "provider": "dalle"
  }'
```

### Test 3: Via AI Chat
**Message**: "crie uma imagem de um pôr do sol na praia"

**Expected Response**:
```
🎨 Imagem gerada!

[Image displayed inline]

Prompt: um pôr do sol na praia
Provider: Pollinations.ai (FREE)
```

---

## 🎬 Video Generation Tests

### Test 1: Short Video (Pollinations - FREE)
```bash
curl https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/generate-video \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type": "application/json" \
  -d '{
    "prompt": "ondas do mar ao pôr do sol",
    "duration": 5
  }'
```

**Expected**:
```json
{
  "success": true,
  "video": {
    "url": "...",
    "prompt": "ondas do mar ao pôr do sol",
    "duration": 5,
    "provider": "Pollinations.ai",
    "cost": 0,
    "free": true
  }
}
```

### Test 2: Via AI Chat
**Message**: "crie um vídeo de 5 segundos de uma cachoeira"

**Expected Response**:
```
🎬 Vídeo gerado!

[Video player or link]

Duração: 5s
Provider: Pollinations.ai (FREE)
```

---

## 🔧 Provider Configuration

### FREE (No API Key Required)
- ✅ **Pollinations.ai** - Already configured
- Works out of the box
- Good quality for most use cases

### PAID (Optional - Better Quality)

#### DALL-E 3 (Images)
1. Get OpenAI API key from https://platform.openai.com/api-keys
2. Add to Supabase:
   - Go to Super Admin > IA Global
   - Add new AI connection
   - Provider: OPENAI
   - API Key: sk-...
   - Active: true

#### Runway ML (Videos)
1. Get Runway API key from https://runwayml.com/
2. Add to Supabase:
   - Super Admin > IA Global
   - Provider: RUNWAY
   - API Key: ...
   - Base URL: https://api.runwayml.com/v1

---

## 📊 Cost Comparison

| Provider | Type | Cost | Quality | Speed |
|----------|------|------|---------|-------|
| Pollinations.ai | Image | FREE | Good | Fast |
| DALL-E 3 | Image | $0.04 | Excellent | Medium |
| Pollinations.ai | Video | FREE | Basic | Fast |
| Runway ML | Video | $0.20/s | Excellent | Slow |

---

## ✅ Success Indicators

### Image Generation:
- Returns `success: true`
- Has `image.url` with valid image URL
- Image loads when accessed
- Shows in chat if integrated

### Video Generation:
- Returns `success: true`
- Has `video.url` with valid video URL
- Video plays when accessed
- Duration matches request

---

## ❌ Common Errors

### Error: "OPENAI not configured"
- **Cause**: Trying to use DALL-E without API key
- **Solution**: Use Pollinations (auto) or configure OpenAI

### Error: "Failed to generate with all providers"
- **Cause**: Network issue or all providers down
- **Solution**: Retry or check provider status

### Error: "Unauthorized"
- **Cause**: No auth token or invalid token
- **Solution**: Include valid Bearer token

---

## 🚀 Next Steps

Test content generation, then proceed to:
1. **Phase 4**: Store Cloning workflows
2. **Phase 4**: WhatsApp automation enhancement
3. **Phase 4**: Purchase automation (security review)

---

**Status**: ✅ Content Generation DEPLOYED & READY
