# Sistema de Modais Contextuais Inteligentes 🧠✨

Sistema avançado de detecção automática de contexto que adapta a interface do chat baseado na intenção do usuário, similar ao Dualite.dev e Canva.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Características](#características)
- [Tipos de Modais](#tipos-de-modais)
- [Como Funciona](#como-funciona)
- [Instalação](#instalação)
- [Uso Básico](#uso-básico)
- [Exemplos de Detecção](#exemplos-de-detecção)
- [Personalização](#personalização)
- [API](#api)

## 🎯 Visão Geral

O sistema detecta automaticamente a intenção do usuário através de **análise de linguagem natural** e transita suavemente entre diferentes interfaces especializadas, proporcionando uma experiência fluida e intuitiva.

### Problema que Resolve

Em vez de ter apenas um chat genérico, o sistema oferece interfaces otimizadas para cada tipo de tarefa:
- **Criar páginas** → Editor visual com preview em tempo real
- **Gerar imagens** → Galeria estilo Canva com histórico
- **Criar vídeos** → Gallery com player integrado
- **Conversar** → Chat tradicional limpo

## ✨ Características

### 🤖 Detecção Inteligente
- **Análise de padrões**: Reconhece mais de 50 padrões diferentes
- **Confiança adaptativa**: Só transita com 70%+ de certeza
- **Context boosters**: Palavras-chave aumentam precisão
- **Debounce**: Evita detecções falsas durante digitação

### 🎨 Interface Adaptativa
- **Transições suaves**: Animações fluidas entre modos
- **Indicadores visuais**: Mostra qual contexto foi detectado
- **Modo manual**: Usuário pode forçar qualquer modal
- **Estado persistente**: Mantém histórico entre sessões

### ⚡ Performance
- **Lazy loading**: Carrega modais sob demanda
- **Memoização**: Cache de detecções repetidas
- **Virtual scrolling**: Galerias otimizadas para 1000+ itens

## 🎭 Tipos de Modais

### 1. Chat Normal (`chat`)
**Quando ativa**: Conversas gerais, perguntas, comandos simples

**Features**:
- Interface limpa e minimalista
- Sugestões rápidas personalizadas
- Histórico completo de conversas
- Typing indicators

**Exemplo de ativação**:
```
"Como criar uma campanha eficaz?"
"Explique métricas de conversão"
"Preciso de ajuda com análise"
```

---

### 2. Visual Editor (`visual-editor`)
**Quando ativa**: Criar/editar páginas, landing pages, layouts

**Features**:
- IA assistente na lateral esquerda
- Preview em tempo real (desktop/mobile)
- Editor de código integrado
- Export HTML/CSS
- Templates prontos

**Exemplo de ativação**:
```
"Crie uma landing page moderna"
"Fazer uma página de produto"
"Desenvolver um hero section"
"Clone esta página"
```

**Layout**:
```
┌─────────────────────────────────────┐
│  [Chat] [Visual] [Imagem] [Vídeo]  │ ← Seletor de modais
├──────────┬──────────────────────────┤
│          │                          │
│  AI Chat │    Preview Visual        │
│          │                          │
│  [Input] │  [Desktop] [Mobile]      │
│          │                          │
└──────────┴──────────────────────────┘
```

---

### 3. Image Gallery (`image-gallery`)
**Quando ativa**: Gerar/visualizar/editar imagens

**Features**:
- Grid responsivo de imagens
- Geração com DALL-E 3
- Filtros por estilo/tamanho
- Preview ampliado
- Download/compartilhamento
- Histórico salvo localmente

**Exemplo de ativação**:
```
"Gere uma imagem de um banner promocional"
"Criar logo futurista"
"Mostrar minhas imagens"
"Fazer ilustração abstrata"
```

**Opções de estilo**:
- 🎨 Vibrante
- 🌿 Natural
- 📸 Realista
- 🖼️ Artístico

---

### 4. Video Gallery (`video-gallery`)
**Quando ativa**: Criar/visualizar vídeos

**Features**:
- Grid de vídeos com thumbnails
- Geração com IA (Runway, Pika Labs)
- Player integrado
- Progresso de geração em tempo real
- Download em MP4
- Histórico com metadados

**Exemplo de ativação**:
```
"Gere um vídeo de animação"
"Criar vídeo promocional"
"Mostrar meus vídeos"
"Fazer animação de logo"
```

**Opções**:
- Duração: 3s, 5s, 10s
- Estilo: Realista, Animado, Cinemático, Abstrato

## 🔧 Como Funciona

### 1. Detecção de Contexto

```typescript
// O usuário digita
"Crie uma landing page moderna"

// Sistema analisa
detectModalContext(message)
  → matches: ['crie', 'landing page']
  → type: 'visual-editor'
  → confidence: 0.9 (90%)
  → shouldAutoTransition: true ✅

// Transita automaticamente para Visual Editor
```

### 2. Fluxo de Decisão

```mermaid
Usuário digita
    ↓
Detecta padrões (regex)
    ↓
Calcula confiança
    ↓
Confiança >= 70%? 
    ├─ Sim → Auto-transita
    └─ Não → Mantém modal atual
```

### 3. Sistema de Confiança

```typescript
Base: 0%
+ Pattern match: +30%
+ Keyword boost: +10% cada
+ Context relevance: +20%
───────────────────────
= Total confidence
```

## 🚀 Instalação

### 1. Importar no ChatPage

```typescript
import { ChatModalManager } from '@/components/chat/modals';

function ChatPage() {
  return (
    <div className="h-screen">
      <ChatModalManager
        autoDetect={true}
        allowManualSwitch={true}
        userId={user?.id}
        onModalChange={(type) => console.log('Modal:', type)}
        onSendMessage={(msg, context) => {
          // Processar mensagem com contexto
          console.log(msg, context);
        }}
      />
    </div>
  );
}
```

### 2. Configurar Providers (se necessário)

```typescript
// Certifique-se de que tem os stores necessários
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
```

## 📖 Uso Básico

### Modo Automático (Recomendado)

```typescript
<ChatModalManager
  autoDetect={true}        // Detecta automaticamente
  allowManualSwitch={true} // Permite troca manual
  userId={user?.id}
/>
```

O sistema irá:
1. Analisar cada mensagem digitada
2. Detectar a intenção (com debounce de 500ms)
3. Mostrar banner se detectar contexto diferente
4. Auto-transitar se confiança >= 70%

### Modo Manual

```typescript
<ChatModalManager
  autoDetect={false}        // Desabilita auto-detecção
  allowManualSwitch={true}  // Usuário escolhe manualmente
  initialModal="chat"       // Modal inicial
/>
```

### Callbacks Personalizados

```typescript
<ChatModalManager
  onModalChange={(type) => {
    analytics.track('modal_changed', { type });
  }}
  onSendMessage={(message, context) => {
    // Processar baseado no contexto
    if (context.type === 'image-gallery') {
      generateImageWithAI(message);
    }
  }}
/>
```

## 🎨 Exemplos de Detecção

### Visual Editor
```typescript
✅ "Crie uma landing page"
✅ "Fazer uma página de produto"
✅ "Desenvolver um layout responsivo"
✅ "Clone esta página"
❌ "Como criar páginas?" (contexto de pergunta, não ação)
```

### Image Gallery
```typescript
✅ "Gere uma imagem de um cachorro"
✅ "Criar logo futurista"
✅ "Mostrar minhas imagens"
✅ "Fazer ilustração abstrata"
❌ "O que é geração de imagens?" (pergunta)
```

### Video Gallery
```typescript
✅ "Gere um vídeo de 5 segundos"
✅ "Criar animação de logo"
✅ "Ver meus vídeos"
❌ "Como fazer vídeos?" (pergunta)
```

## 🛠️ Personalização

### Adicionar Novos Padrões

```typescript
// Em src/lib/ai/modalContext.ts

const MODAL_PATTERNS: Record<ModalType, RegExp[]> = {
  'visual-editor': [
    /seu novo padrão aqui/i,
    // ... outros padrões
  ],
};
```

### Ajustar Threshold de Confiança

```typescript
// Em src/lib/ai/modalContext.ts

export function shouldAutoTransition(context: ModalContext): boolean {
  // Padrão: >= 0.7 (70%)
  return context.confidence >= 0.8; // Mais conservador
}
```

### Customizar Estilos

```typescript
// No componente ChatModalManager
<ChatModalManager
  className="custom-modal-styles"
/>
```

## 📚 API

### `ChatModalManager`

**Props**:
```typescript
interface ChatModalManagerProps {
  autoDetect?: boolean;          // Detectar automaticamente (default: true)
  allowManualSwitch?: boolean;   // Permitir troca manual (default: true)
  initialModal?: ModalType;      // Modal inicial (default: 'chat')
  userId?: string;               // ID do usuário
  className?: string;            // Classes CSS extras
  onModalChange?: (type: ModalType) => void;
  onSendMessage?: (message: string, context: ModalContext) => void;
}
```

### `detectModalContext()`

```typescript
function detectModalContext(message: string): ModalContext

// Retorna:
{
  type: 'visual-editor',
  confidence: 0.9,
  params: { pageType: 'landing-page' },
  metadata: {
    keywords: ['responsivo', 'moderno'],
    intent: 'create-or-edit-page',
    suggestedAction: 'Abrindo editor visual...'
  }
}
```

### `shouldAutoTransition()`

```typescript
function shouldAutoTransition(context: ModalContext): boolean

// Retorna true se:
// - confidence >= 0.7
// - type !== 'chat'
```

## 🐛 Debug

### Modo de Debug

```typescript
import { debugModalContext } from '@/lib/ai/modalContext';

// Em desenvolvimento, ver detecções no console
debugModalContext("Crie uma landing page");

// Output:
// 🔍 [Modal Context Detection] {
//   message: "Crie uma landing page...",
//   detected: "visual-editor",
//   confidence: "90.0%",
//   params: { pageType: 'landing-page' }
// }
```

### Verificar Estado

```typescript
// No componente
const [currentModal, setCurrentModal] = useState<ModalType>('chat');

// Adicionar listener
useEffect(() => {
  console.log('Current modal:', currentModal);
}, [currentModal]);
```

## 🎯 Melhores Práticas

1. **Sempre passar userId**: Necessário para salvar histórico
2. **Manter autoDetect=true**: Melhor UX
3. **Permitir troca manual**: Usuário tem controle final
4. **Monitorar onModalChange**: Analytics e tracking
5. **Testar frases ambíguas**: "criar" pode ser várias coisas

## 🔮 Próximos Passos

- [ ] Code Editor Modal (para edição de código)
- [ ] Analytics Dashboard (métricas de uso)
- [ ] A/B Testing (testar diferentes thresholds)
- [ ] Machine Learning (melhorar detecção com uso)
- [ ] Voice Input (detecção por voz)
- [ ] Multi-language (suporte a inglês, espanhol)

## 📝 Notas Importantes

### Limitações Atuais

1. **Geração de Vídeos**: Requer API key de serviço externo (Runway, Pika)
2. **Geração de Imagens**: Usa DALL-E 3 (requer OpenAI API key)
3. **Visual Editor**: Preview básico, não suporta React components complexos
4. **Storage**: Histórico salvo no localStorage (limite de ~5-10MB)

### Performance

- Detecção: ~5ms
- Transição: ~400ms
- Render: Otimizado com React.memo e virtualization

## 🤝 Contribuindo

Para adicionar novos tipos de modal:

1. Criar componente em `src/components/chat/modals/`
2. Adicionar padrões em `modalContext.ts`
3. Atualizar `ChatModalManager.tsx`
4. Exportar em `index.ts`
5. Atualizar este README

## 📄 Licença

Este sistema faz parte do SyncAds e segue a mesma licença do projeto.

---

**Desenvolvido com ❤️ para SyncAds**  
*Versão 1.0.0 - Janeiro 2025*