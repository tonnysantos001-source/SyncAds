# 🎯 GUIA VISUAL - Onde Você Está vs Onde Deve Estar

## ❌ VOCÊ ESTÁ AQUI (Errado):
**Watch Paths** - Isso é padrão de arquivos para trigger de deploy
- Mostra: `/python-service/**`
- Tem botão de apagar
- **NÃO MEXA NISSO!**

---

## ✅ VOCÊ PRECISA IR PARA:

### Passo 1: Role a Página para BAIXO
Na mesma aba **Settings**, role para baixo até encontrar uma seção chamada:
- **"Service"** ou
- **"Build"** ou  
- **"Deploy"**

### Passo 2: Procure por "Root Directory" (Seção Principal)
Vai aparecer um campo de texto (não uma lista de padrões) com:
- Label: "Root Directory"
- Valor atual: provavelmente vazio OU `/python-service`
- **Se tiver `/python-service`**: clique e apague, deixe vazio

### Passo 3: Procure "Dockerfile Path"
Logo abaixo ou na mesma seção, procure:
- Label: "Dockerfile Path"
- Digite: `python-service/Dockerfile`

### Passo 4: Procure "Start Command"
- Label: "Start Command" ou "Custom Start Command"
- Deve ter: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Passo 5: Botão "Deploy"
No final da seção ou página, terá um botão **"Deploy"** ou **"Save"**

---

## 🖼️ O Que Procurar Visualmente:

**Watch Paths** (onde você está):
```
┌─────────────────────────────┐
│ Watch Paths                 │
│ /python-service/**          │  ← Lista de padrões
│ [X Apagar]                  │
└─────────────────────────────┘
```

**Root Directory** (onde precisa ir):
```
┌─────────────────────────────┐
│ Root Directory              │
│ [campo texto vazio]         │  ← Campo único, editável
└─────────────────────────────┘
```

**Dockerfile Path**:
```
┌─────────────────────────────┐
│ Dockerfile Path             │
│ [python-service/Dockerfile] │  ← Digite aqui
└─────────────────────────────┘
```

---

## 💡 DICA:
- **Ignore Watch Paths completamente**
- Role a página Settings **para baixo**
- Procure por campos de texto individuais, não listas
- Se não achar, tente clicar em subseções à esquerda como "Build" ou "Deploy"

**Me avise quando encontrar esses campos!**
