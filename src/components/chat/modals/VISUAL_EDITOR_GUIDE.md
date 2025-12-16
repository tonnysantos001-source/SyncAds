# 🎨 VISUAL EDITOR MODALS - GUIA DE USO

## 📋 MODALS DISPONÍVEIS

Este projeto possui **dois modals** de Visual Editor:

### 1. VisualEditorModal.tsx (29.7KB)
**Localização:** `src/components/chat/modals/VisualEditorModal.tsx`

#### Características:
- ✅ Editor visual padrão
- ✅ Interface integrada com chat IA
- ✅ Componentes drag-and-drop
- ✅ Preview em tempo real
- ✅ Export de código

#### Quando Usar:
- **Recomendado para:** Uso geral no sistema
- **Contexto:** Integrado com ChatModalManager
- **Ativação:** Automática via detecção de contexto IA

---

### 2. VisualEditorModalDualite.tsx (28.0KB)
**Localização:** `src/components/chat/modals/VisualEditorModalDualite.tsx`

#### Características:
- ✅ Editor visual estilo Dualite
- ✅ Interface otimizada para desenvolvedores
- ✅ Tema dark/light
- ✅ Code editor integrado
- ✅ Templates prontos

#### Quando Usar:
- **Recomendado para:** Desenvolvedores avançados
- **Contexto:** Modo desenvolvedor
- **Ativação:** Manual ou via configuração

---

## 🎯 DIFERENÇAS PRINCIPAIS

| Característica | VisualEditorModal | VisualEditorModalDualite |
|---------------|-------------------|--------------------------|
| **Design** | Chat-focused | Developer-focused |
| **Complexity** | Médio | Avançado |
| **Target** | Usuários gerais | Desenvolvedores |
| **Theme** | Sistema | Dark/Light toggle |
| **Templates** | Básicos | Avançados |
| **Code Export** | Simples | Completo |

---

## 📖 RECOMENDAÇÃO DE USO

### Para Usuários Finais:
```typescript
import { VisualEditorModal } from '@/components/chat/modals';
// Use este para integração com chat IA
```

### Para Desenvolvedores:
```typescript
import { VisualEditorModalDualite } from '@/components/chat/modals';
// Use este para edição avançada de código
```

---

## 🔄 INTEGRAÇÃO COM IA

Ambos os modais estão integrados com o sistema de IA:

- ✅ **ChatModalManager** detecta contexto automaticamente
- ✅ IA pode sugerir componentes e layouts
- ✅ Geração de código via prompts
- ✅ Export automático para projeto

---

## ⚙️ CONFIGURAÇÃO

### Padrão do Sistema:
O modal padrão é **VisualEditorModal** (chat-focused).

### Alterar para Dualite:
No arquivo `ChatModalManager.tsx`, altere o import:

```typescript
// ANTES:
import { VisualEditorModal } from './VisualEditorModal';

// DEPOIS:
import { VisualEditorModal as VisualEditorModalDualite } from './VisualEditorModalDualite';
```

---

## 🚀 ROADMAP

### Futuro (Pós-lançamento):
- Consolidar em um único modal com toggle de modo
- Adicionar mais templates
- Melhorar preview mobile
- Integração com Figma (import designs)

---

## 📝 NOTAS DE DESENVOLVIMENTO

**Mantemos ambos os modals porque:**
1. **VisualEditorModal** - Otimizado para fluxo de chat com IA
2. **VisualEditorModalDualite** - Otimizado para desenvolvedores avançados

**Performance:**
- Apenas um modal é carregado por vez
- Tree-shaking remove código não usado no build

**Manutenção:**
- Mudanças que afetam UX geral → VisualEditorModal
- Mudanças que afetam developers → VisualEditorModalDualite
- Features comuns → Considerar extrair para componente compartilhado

---

**Criado:** 16/12/2025  
**Autor:** SyncAds Team  
**Versão:** 1.0
