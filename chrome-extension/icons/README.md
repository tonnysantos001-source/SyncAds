# 🎨 Ícones da Extensão SyncAds

Ícones oficiais da extensão Chrome SyncAds em 3 tamanhos.

## 📋 Ícones Necessários

- `icon16.png` - 16x16 pixels (ícone na barra de ferramentas)
- `icon48.png` - 48x48 pixels (página de extensões)
- `icon128.png` - 128x128 pixels (Chrome Web Store)

## 🚀 Como Gerar os Ícones

### Método 1: Usar o Gerador HTML (Recomendado)

1. Abra o arquivo `generate_icons.html` no seu navegador
2. Os ícones serão gerados automaticamente
3. Clique em **"Baixar Todos os Ícones"** ou baixe individualmente
4. Salve os arquivos `.png` nesta pasta (`chrome-extension/icons/`)

### Método 2: Usar o Script Python

Se você tiver Python e PIL/Pillow instalados:

```bash
pip install Pillow
python generate_icons.py
```

## 🎨 Design dos Ícones

**Cores:**
- Gradiente roxo/azul: `#667eea` → `#764ba2`

**Símbolo:**
- Circuito neural estilizado
- Núcleo central branco (representa IA)
- Linhas de conexão (representa automação)
- Nós nas extremidades (representa integração)

**Estilo:**
- Moderno e minimalista
- Fundo transparente nas bordas
- Gradiente circular
- Alta legibilidade em todos os tamanhos

## ✅ Verificação

Após gerar os ícones, verifique:

- [ ] Os 3 arquivos PNG foram criados
- [ ] Estão nos tamanhos corretos (16x16, 48x48, 128x128)
- [ ] O `manifest.json` está referenciando os ícones corretamente
- [ ] Os ícones aparecem corretamente ao carregar a extensão

## 📦 Estrutura de Arquivos

```
icons/
├── icon16.png          # Ícone pequeno (barra de ferramentas)
├── icon48.png          # Ícone médio (página de extensões)
├── icon128.png         # Ícone grande (Chrome Web Store)
├── generate_icons.html # Gerador HTML (método fácil)
├── generate_icons.py   # Gerador Python (método alternativo)
└── README.md           # Este arquivo
```

## 🔗 Referências

- [Chrome Extension Icons Guide](https://developer.chrome.com/docs/extensions/mv3/manifest/icons/)
- [Design Guidelines](https://developer.chrome.com/docs/webstore/images/)

---

**Última atualização:** 16/01/2025  
**Versão:** 1.0.0