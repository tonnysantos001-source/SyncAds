# ⚡ COMANDOS RÁPIDOS DE ATIVAÇÃO - SYNCADS AI

**Objetivo**: Ativar TODOS os módulos em 5 minutos  
**Data**: 26 de Novembro de 2025

---

## 🚀 ATIVAÇÃO ULTRA-RÁPIDA (1 COMANDO)

### Windows PowerShell

```powershell
# 1. Navegar para o projeto
cd C:\Users\dinho\Documents\GitHub\SyncAds

# 2. Commit dos scripts (se ainda não fez)
git add python-service/activate_all_modules.py python-service/railway-activate.sh python-service/AI_SYSTEM_AUDIT.md python-service/RAILWAY_ACTIVATION_GUIDE.md
git commit -m "🚀 Add AI Expansion activation scripts"
git push

# 3. Conectar ao Railway e executar
railway shell

# 4. Dentro do Railway shell:
cd /app/python-service && chmod +x railway-activate.sh && bash railway-activate.sh

# 5. Sair e reiniciar
exit
railway restart

# 6. Ver logs
railway logs --follow
```

---

## 🎯 MÉTODO SIMPLIFICADO (Via Railway Variables)

```bash
# 1. Adicionar variável de ambiente
railway variables set ENABLE_AI_EXPANSION=true

# 2. Fazer deploy
cd C:\Users\dinho\Documents\GitHub\SyncAds
git add .
git commit -m "🚀 Enable AI Expansion"
git push

# 3. Reiniciar
railway restart

# 4. Verificar logs
railway logs | findstr "EXPANSION"
```

---

## 🔧 INSTALAÇÃO MANUAL RÁPIDA

```bash
# Conectar
railway shell

# Executar comandos
cd /app/python-service
python -m pip install --upgrade pip
pip install --no-cache-dir -r ai_expansion/requirements-expansion.txt
python -m playwright install chromium
echo "ENABLE_AI_EXPANSION=true" >> .env
exit

# Reiniciar
railway restart
```

---

## ✅ VERIFICAÇÃO RÁPIDA

```bash
# 1. Health check
curl https://seu-dominio.railway.app/api/expansion/health

# 2. Ver info dos módulos
curl https://seu-dominio.railway.app/api/expansion/info

# 3. Ver logs
railway logs | findstr "ENABLED"

# Deve aparecer:
# 🟢 automation: ENABLED
# 🟢 dom_intelligence: ENABLED
# 🟢 ai_agents: ENABLED
# 🟢 vision: ENABLED
```

---

## 🐛 TROUBLESHOOTING RÁPIDO

### Problema: Módulos não aparecem como ENABLED

```bash
railway shell
cd /app/python-service
python validate_startup.py
exit
```

### Problema: Build falhou

```bash
# Verificar variável
railway variables | findstr "ENABLE_AI_EXPANSION"

# Se não estiver, adicionar:
railway variables set ENABLE_AI_EXPANSION=true
railway restart
```

### Problema: Playwright não funciona

```bash
railway shell
cd /app/python-service
python -m playwright install chromium
exit
railway restart
```

---

## 📊 CHECKLIST FINAL

Após executar os comandos, verificar:

- [ ] `railway logs` mostra "AI EXPANSION READY!"
- [ ] `/api/expansion/health` retorna status healthy
- [ ] Pelo menos 3 módulos mostram status ENABLED
- [ ] Endpoints `/api/expansion/*` aparecem em `/docs`

---

## 🎉 SUCESSO TOTAL

Se todos os checks acima passaram:

✅ **TODOS OS MÓDULOS ATIVADOS!**

Próximo passo: Atualizar o System Prompt em `python-service/app/main.py` com o **ULTRA_SYSTEM_PROMPT** do arquivo `AI_SYSTEM_AUDIT.md`

---

## 📝 COMANDO ÚNICO (COPIAR E COLAR)

**Windows PowerShell** (executar na ordem):

```powershell
# Passo 1: Push dos scripts
cd C:\Users\dinho\Documents\GitHub\SyncAds
git add python-service/*.py python-service/*.sh python-service/*.md
git commit -m "🚀 AI Expansion activation"
git push

# Passo 2: Ativar via Railway
railway shell
# Dentro do shell:
cd /app/python-service && chmod +x railway-activate.sh && bash railway-activate.sh && exit

# Passo 3: Reiniciar e verificar
railway restart && railway logs --follow
```

---

## 🔥 COMANDO ALTERNATIVO (Python Local)

Se preferir testar localmente primeiro:

```bash
cd C:\Users\dinho\Documents\GitHub\SyncAds\python-service
python activate_all_modules.py
```

Isso irá:
1. ✅ Verificar Python version
2. ✅ Instalar todas as dependências
3. ✅ Configurar environment
4. ✅ Testar módulos
5. ✅ Gerar relatório completo

---

## 💡 DICA IMPORTANTE

**Tempo de instalação**: 5-10 minutos  
**Necessário apenas 1 vez**: Depois disso, tudo fica persistente  
**Sem downtime**: Sistema continua funcionando durante instalação

---

**Status após ativação**: 🟢 SISTEMA COMPLETO  
**Capacidades desbloqueadas**: 6/6 módulos (100%)