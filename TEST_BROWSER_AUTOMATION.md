# Browser Automation - Test Suite

## ✅ Quick Test Commands

### Test 1: Health Check
```bash
curl https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/browser-automation \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"command": "health"}'
```

### Test 2: Create Session
```bash
curl https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/browser-automation \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "command": "CREATE_SESSION",
    "session_id": "test-session-123"
  }'
```

### Test 3: Navigate to URL
```bash
curl https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/browser-automation \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "command": "NAVIGATE",
    "session_id": "test-session-123",
    "params": {
      "url": "https://example.com"
    }
  }'
```

### Test 4: Screenshot
```bash
curl https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/browser-automation \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "command": "SCREENSHOT",
    "session_id": "test-session-123",
    "params": {
      "full_page": true
    }
  }'
```

---

## 🤖 AI Chat Tests

### Test 1: Simple Navigation
**Message**: "navegue para https://example.com"

**Expected**: AI detects intent, calls browser-automation, returns navigation confirmation

### Test 2: Screenshot
**Message**: "tire um screenshot completo desta página"

**Expected**: Screenshot captured and displayed inline

### Test 3: Product Scraping
**Message**: "raspe os produtos desta loja"

**Expected**: List of products with names and prices

### Test 4: Form Fill (Extension Required)
**Message**: "preencha o formulário de contato"

**Expected**: Form filled with sample data

---

## 📊 Monitoring Commands

### Edge Function Logs
```bash
# Browser automation logs
supabase functions logs browser-automation --tail

# Chat enhanced logs
supabase functions logs chat-enhanced --tail
```

### Python Service Logs (Railway)
```bash
railway logs --tail
```

---

## 🔧 Configuration Check

### Required Secrets
```bash
# Check if PYTHON_SERVICE_URL is set
supabase secrets list
```

Should show:
- `PYTHON_SERVICE_URL` = `https://your-app.up.railway.app`

---

## ❌ Common Errors & Fixes

### Error: "PYTHON_SERVICE_URL not configured"
```bash
supabase secrets set PYTHON_SERVICE_URL=https://your-railway-app.up.railway.app
supabase functions deploy browser-automation
```

### Error: "Playwright not installed" (Python Service)
Add to Railway deployment:
```bash
pip install playwright
playwright install chromium
```

### Error: "Extension not connected"
- User needs to click extension icon and connect
- Check `extensionConnected` flag in request

---

## ✅ Success Indicators

### Browser Automation Edge Function
- Returns 200 status
- Has `success: true` in response
- Contains expected data (url, screenshot, products, etc)

### Chat Enhanced
- Detects browser automation keywords
- Calls browser-automation Edge Function
- Formats response nicely for user

### Python Service
- Playwright session created
- Navigation successful
- Forms filled
- Screenshots captured

---

**Ready to test!** 🚀
