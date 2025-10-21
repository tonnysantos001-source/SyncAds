# ✅ CHECKLIST PRÉ-BUILD - SYNCADS

## 📋 ANTES DE FAZER BUILD

### **1. Verificar Variáveis de Ambiente**
- [ ] `.env` existe e está configurado
- [ ] `VITE_SUPABASE_URL` correto
- [ ] `VITE_SUPABASE_ANON_KEY` correto
- [ ] OAuth configurados (ou dummy)

### **2. Verificar package.json**
- [ ] Scripts de build definidos
- [ ] Dependências instaladas
- [ ] Sem vulnerabilidades críticas

### **3. Limpar Cache**
```bash
# Limpar node_modules e reinstalar
rm -rf node_modules
npm install

# Limpar cache do Vite
rm -rf dist
rm -rf .vite
```

### **4. Teste Local**
```bash
# Servidor deve estar rodando sem erros
npm run dev
```

---

## 🏗️ FAZER BUILD

### **Opção 1: Build Simples**
```bash
npm run build
```

### **Opção 2: Build com Verificação**
```bash
# Build
npm run build

# Preview local do build
npm run preview
```

### **O que esperar:**
- ✅ Build bem-sucedido em 30-60 segundos
- ✅ Pasta `dist/` criada com arquivos otimizados
- ✅ Assets com hash (cache busting)
- ✅ Tamanho final: ~2-5MB (comprimido)

---

## 📦 PÓS-BUILD

### **Verificar pasta dist/**
```bash
# Ver estrutura
ls -la dist/

# Deve conter:
# - index.html
# - assets/ (JS, CSS, imagens)
# - favicon, logos, etc
```

### **Testar Build Localmente**
```bash
npm run preview
# Acesse: http://localhost:4173/
```

---

## 🚀 DEPLOY

### **Opção 1: Netlify (Recomendado)**
```bash
# Instalar CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod --dir=dist
```

### **Opção 2: Vercel**
```bash
# Instalar CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### **Opção 3: Manual**
1. Faça build: `npm run build`
2. Compacte pasta `dist/`: `dist.zip`
3. Upload no painel do hosting
4. Configure domínio

---

## ⚙️ CONFIGURAÇÕES DE DEPLOY

### **Variáveis de Ambiente (Produção)**
No painel do Netlify/Vercel, configure:

```
VITE_SUPABASE_URL=https://ovskepqggmxlfckxqgbr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_META_CLIENT_ID=1907637243430460
VITE_FACEBOOK_CLIENT_ID=1907637243430460
VITE_META_CLIENT_SECRET=8b80da29081d73fd7d1037f3cae72d55
# ... outras OAuth
```

### **Build Settings (Netlify)**
- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Node version:** 18 ou superior

### **Build Settings (Vercel)**
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

---

## 🔧 TROUBLESHOOTING

### **Erro: "Module not found"**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### **Erro: "Out of memory"**
```bash
# Aumentar memória do Node
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

### **Erro: "VITE_* is not defined"**
- Verifique que `.env` existe
- Variáveis devem começar com `VITE_`
- Reinicie o build

### **Build muito grande (>10MB)**
- Verifique imports não usados
- Use code splitting
- Otimize imagens

---

## 📊 MÉTRICAS DE BUILD ESPERADAS

| Métrica | Valor | Status |
|---------|-------|--------|
| **Tempo** | 30-60s | ✅ |
| **Tamanho (gzip)** | 2-5MB | ✅ |
| **Chunks JS** | 10-20 | ✅ |
| **Warnings** | 0-5 | ✅ |
| **Errors** | 0 | ✅ |

---

## ✅ CHECKLIST FINAL

Antes de deploy em produção:

### **Funcionalidades**
- [ ] Login/Logout funciona
- [ ] Dashboard carrega dados
- [ ] Produtos listam corretamente
- [ ] Chat com IA responde
- [ ] Integrações conectam (se OAuth configurado)

### **Performance**
- [ ] Páginas carregam em <3s
- [ ] Imagens otimizadas
- [ ] Bundle size <5MB
- [ ] Lighthouse score >80

### **Segurança**
- [ ] HTTPS habilitado
- [ ] CORS configurado
- [ ] API Keys não expostas no código
- [ ] RLS ativo no Supabase

### **SEO**
- [ ] Title e meta tags configurados
- [ ] Favicon presente
- [ ] Sitemap gerado (opcional)
- [ ] robots.txt configurado (opcional)

---

## 🎯 COMANDOS RÁPIDOS

```bash
# 1. Build
npm run build

# 2. Preview local
npm run preview

# 3. Deploy Netlify
netlify deploy --prod --dir=dist

# 4. Deploy Vercel
vercel --prod

# 5. Verificar tamanho
du -sh dist/
```

---

## 📞 SUPORTE

**Erro no build?**
1. Verifique console para erros específicos
2. Teste `npm run dev` primeiro
3. Limpe cache e reinstale dependências
4. Verifique que todas variáveis `.env` estão corretas

**Deploy falhou?**
1. Verifique logs do Netlify/Vercel
2. Confirme variáveis de ambiente no painel
3. Teste build localmente antes
4. Verifique Node version (>=18)

---

## ✅ RESULTADO ESPERADO

Após build bem-sucedido:
- ✅ Pasta `dist/` com arquivos otimizados
- ✅ Build sem erros
- ✅ Preview local funcionando
- ✅ Pronto para deploy!

**Tempo total:** 5-10 minutos do build ao deploy 🚀
