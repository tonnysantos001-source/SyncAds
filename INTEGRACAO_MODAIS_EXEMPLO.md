# 🚀 Integração do Sistema de Modais Inteligentes no ChatPage

## Guia Rápido de Implementação

### Passo 1: Substituir ChatPage.tsx Atual

**Arquivo**: `src/pages/app/ChatPage.tsx`

```typescript
import React from 'react';
import { ChatModalManager } from '@/components/chat/modals';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import chatService from '@/lib/api/chatService';
import { useChatStore } from '@/store/chatStore';
import { useToast } from '@/components/ui/use-toast';

export default function ChatPage() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const navigate = useNavigate();
  const { toast } = useToast();
  const addMessage = useChatStore((state) => state.addMessage);
  const activeConversationId = useChatStore((state) => state.activeConversationId);

  // Auth check
  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login-v2', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // Handle message send
  const handleSendMessage = async (message: string, context: any) => {
    if (!user || !activeConversationId) return;

    try {
      // Adicionar mensagem do usuário
      await addMessage(user.id, activeConversationId, {
        role: 'user',
        content: message,
      });

      // Enviar para a IA
      const response = await chatService.sendMessage(
        message,
        activeConversationId,
        {
          systemPrompt: getSystemPromptForContext(context.type),
        }
      );

      // Adicionar resposta da IA
      await addMessage(user.id, activeConversationId, {
        role: 'assistant',
        content: response,
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Erro ao enviar mensagem',
        description: 'Tente novamente',
        variant: 'destructive',
      });
    }
  };

  // Modal change handler
  const handleModalChange = (type: string) => {
    console.log('Modal changed to:', type);
    
    // Analytics
    if (window.gtag) {
      window.gtag('event', 'modal_change', {
        modal_type: type,
      });
    }
  };

  if (!user) return null;

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <ChatModalManager
        autoDetect={true}
        allowManualSwitch={true}
        userId={user.id}
        onModalChange={handleModalChange}
        onSendMessage={handleSendMessage}
        className="flex-1"
      />
    </div>
  );
}

// Helper: System prompt baseado no contexto
function getSystemPromptForContext(modalType: string): string {
  const prompts: Record<string, string> = {
    'chat': `Você é um assistente de IA especializado em marketing digital para a plataforma SyncAds.
    
Você pode ajudar com:
- Estratégias de marketing digital
- Criação de campanhas
- Análise de público-alvo
- Otimização de conversões
- Dicas de anúncios
- Análise de métricas

Responda sempre em português do Brasil de forma clara, objetiva e prática.`,

    'visual-editor': `Você é um designer e desenvolvedor web especializado em criar páginas e landing pages.

Quando o usuário pedir para criar uma página:
1. Pergunte detalhes importantes (nicho, objetivo, público-alvo)
2. Gere HTML/CSS moderno usando Tailwind CSS
3. Inclua estrutura semântica e responsiva
4. Adicione CTAs estratégicos
5. Otimize para conversão

Seja criativo mas profissional. Use gradientes modernos, shadows sutis e animações leves.`,

    'image-gallery': `Você é um especialista em geração de imagens com IA.

Quando o usuário pedir uma imagem:
1. Otimize o prompt em inglês
2. Adicione detalhes de qualidade (4K, high quality, detailed)
3. Especifique o estilo artístico
4. Inclua informações de iluminação e composição

Ajude o usuário a criar os melhores prompts possíveis para DALL-E 3.`,

    'video-gallery': `Você é um especialista em criação de vídeos com IA.

Quando o usuário pedir um vídeo:
1. Otimize a descrição da cena
2. Sugira movimentos de câmera
3. Especifique timing e transições
4. Recomende estilo visual

Ajude a criar prompts cinematográficos e profissionais.`,
  };

  return prompts[modalType] || prompts['chat'];
}
```

---

## Passo 2: Configuração Mínima (Se Preferir Integração Gradual)

Se você quiser testar primeiro sem substituir tudo:

```typescript
import { ChatModalManager } from '@/components/chat/modals';

// Dentro do seu componente
<div className="h-screen">
  <ChatModalManager
    userId={user?.id}
    onSendMessage={(msg) => console.log('Message:', msg)}
  />
</div>
```

---

## Passo 3: Verificar Dependências

Certifique-se de que tem instalado:

```bash
npm install framer-motion react-textarea-autosize
```

Ou se usar yarn:

```bash
yarn add framer-motion react-textarea-autosize
```

---

## Passo 4: Testar Detecção Automática

### Teste 1: Visual Editor
Digite no chat:
```
"Crie uma landing page moderna para venda de cursos online"
```
✅ Deve abrir o Visual Editor automaticamente

### Teste 2: Image Gallery
Digite:
```
"Gere uma imagem de um banner promocional futurista"
```
✅ Deve abrir a Galeria de Imagens

### Teste 3: Video Gallery
Digite:
```
"Crie um vídeo de 5 segundos com animação de logo"
```
✅ Deve abrir a Galeria de Vídeos

### Teste 4: Chat Normal
Digite:
```
"Como criar uma campanha eficaz?"
```
✅ Deve manter no Chat Normal

---

## Configurações Avançadas

### Desabilitar Auto-Detecção

```typescript
<ChatModalManager
  autoDetect={false}  // Usuário escolhe manualmente
  allowManualSwitch={true}
  userId={user?.id}
/>
```

### Forçar Modal Inicial

```typescript
<ChatModalManager
  initialModal="image-gallery"  // Começa na galeria de imagens
  userId={user?.id}
/>
```

### Callbacks Personalizados

```typescript
<ChatModalManager
  userId={user?.id}
  onModalChange={(type) => {
    // Track com analytics
    mixpanel.track('Modal Changed', { type });
  }}
  onSendMessage={async (message, context) => {
    // Processar baseado no contexto
    if (context.type === 'image-gallery') {
      // Lógica específica para imagens
      await generateImage(message);
    } else if (context.type === 'visual-editor') {
      // Lógica para páginas
      await generatePage(message);
    }
  }}
/>
```

---

## Debug e Troubleshooting

### Problema: Modal não detecta contexto

**Solução**: Verifique se as mensagens contêm as palavras-chave corretas.

```typescript
import { debugModalContext } from '@/lib/ai/modalContext';

// Em desenvolvimento
debugModalContext("Sua mensagem aqui");
// Verá no console: tipo detectado, confiança, params
```

### Problema: Transição não acontece

**Solução**: Verifique o threshold de confiança.

```typescript
// Em src/lib/ai/modalContext.ts
export function shouldAutoTransition(context: ModalContext): boolean {
  // Reduzir threshold para 60% (mais sensível)
  return context.confidence >= 0.6 && context.type !== 'chat';
}
```

### Problema: Imagens não geram

**Solução**: Verifique se tem API key do OpenAI configurada.

```sql
-- No Supabase
SELECT * FROM "GlobalAiConnection" 
WHERE "userId" = 'seu-user-id' 
AND "isActive" = true;
```

---

## Customização de Estilos

### Tema Dark Custom

```typescript
<ChatModalManager
  className="custom-theme"
  userId={user?.id}
/>
```

```css
/* styles/custom-theme.css */
.custom-theme {
  --modal-bg: #0a0a0f;
  --modal-border: rgba(255, 255, 255, 0.1);
  --modal-accent: #3b82f6;
}
```

---

## Performance Tips

### 1. Lazy Loading de Imagens

As imagens na galeria já usam lazy loading, mas você pode otimizar mais:

```typescript
// Em ImageGalleryModal.tsx
<img 
  src={image.url} 
  loading="lazy"
  decoding="async"
/>
```

### 2. Virtual Scrolling (Para 100+ itens)

```bash
npm install react-window
```

### 3. Limitar Histórico

```typescript
// Em modalContext.ts ou no componente
const MAX_HISTORY = 50;

// Manter apenas últimos 50 itens
const limitedImages = images.slice(0, MAX_HISTORY);
```

---

## Integração com Sistema Existente

### Manter Sidebar Atual

```typescript
import { ChatModalManager } from '@/components/chat/modals';
import { Sidebar } from '@/components/layout/Sidebar';

export default function ChatPage() {
  return (
    <div className="flex h-screen">
      {/* Sidebar existente */}
      <Sidebar />
      
      {/* Novo sistema de modais */}
      <div className="flex-1">
        <ChatModalManager userId={user?.id} />
      </div>
    </div>
  );
}
```

### Manter Header Atual

```typescript
export default function ChatPage() {
  return (
    <div className="h-screen flex flex-col">
      {/* Header existente */}
      <Header />
      
      {/* Novo sistema de modais */}
      <div className="flex-1 overflow-hidden">
        <ChatModalManager userId={user?.id} />
      </div>
    </div>
  );
}
```

---

## Checklist de Implementação

- [ ] Instalar dependências (framer-motion, react-textarea-autosize)
- [ ] Copiar arquivos da pasta `src/components/chat/modals/`
- [ ] Copiar `src/lib/ai/modalContext.ts`
- [ ] Atualizar `ChatPage.tsx` com novo componente
- [ ] Testar detecção automática com diferentes frases
- [ ] Configurar API keys (OpenAI para imagens)
- [ ] Testar transições entre modais
- [ ] Verificar responsividade mobile
- [ ] Adicionar analytics (opcional)
- [ ] Deploy e testar em produção

---

## Próximos Passos Recomendados

1. **Testar localmente** primeiro com `npm run dev`
2. **Coletar feedback** de usuários beta
3. **Ajustar thresholds** de detecção baseado no uso real
4. **Adicionar analytics** para ver quais modais são mais usados
5. **Expandir padrões** de detecção com frases reais dos usuários

---

## Suporte

Se tiver problemas:

1. Verifique o console do navegador para erros
2. Use `debugModalContext()` para debug
3. Verifique se todas as dependências estão instaladas
4. Certifique-se de que o userId está sendo passado corretamente

---

**Pronto! Agora você tem um chat inteligente com modais contextuais automáticos! 🎉**

Sistema desenvolvido para SyncAds - Janeiro 2025