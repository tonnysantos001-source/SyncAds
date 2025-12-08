# 📝 Code Snippets - Sistema de Modais Inteligentes

Snippets prontos para copiar e colar.

---

## 🚀 Quick Start - Substituir ChatPage.tsx Completo

```typescript
// src/pages/app/ChatPage.tsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatModalManager } from '@/components/chat/modals';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { useToast } from '@/components/ui/use-toast';
import chatService from '@/lib/api/chatService';

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

  // Handle message send with context
  const handleSendMessage = async (message: string, context: any) => {
    if (!user || !activeConversationId) return;

    try {
      // Add user message
      await addMessage(user.id, activeConversationId, {
        role: 'user',
        content: message,
      });

      // Get AI response
      const response = await chatService.sendMessage(
        message,
        activeConversationId
      );

      // Add AI response
      await addMessage(user.id, activeConversationId, {
        role: 'assistant',
        content: response,
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Erro ao enviar mensagem',
        description: 'Tente novamente',
        variant: 'destructive',
      });
    }
  };

  if (!user) return null;

  return (
    <div className="h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <ChatModalManager
        autoDetect={true}
        allowManualSwitch={true}
        userId={user.id}
        onSendMessage={handleSendMessage}
        onModalChange={(type) => console.log('Modal:', type)}
      />
    </div>
  );
}
```

---

## 🎨 Integração Mínima (Testar Primeiro)

```typescript
import { ChatModalManager } from '@/components/chat/modals';

function MeuChat() {
  return (
    <div className="h-screen">
      <ChatModalManager userId="user-123" />
    </div>
  );
}
```

---

## 🔧 Com Callbacks Personalizados

```typescript
import { ChatModalManager, type ModalContext } from '@/components/chat/modals';

function ChatAvancado() {
  const handleModalChange = (type: string) => {
    console.log('Mudou para:', type);
    
    // Analytics
    if (window.gtag) {
      window.gtag('event', 'modal_change', { modal_type: type });
    }
  };

  const handleSendMessage = async (message: string, context: ModalContext) => {
    console.log('Mensagem:', message);
    console.log('Contexto:', context);

    // Processar baseado no tipo
    switch (context.type) {
      case 'image-gallery':
        await gerarImagem(message);
        break;
      case 'visual-editor':
        await gerarPagina(message);
        break;
      case 'video-gallery':
        await gerarVideo(message);
        break;
      default:
        await enviarParaIA(message);
    }
  };

  return (
    <ChatModalManager
      userId="user-123"
      onModalChange={handleModalChange}
      onSendMessage={handleSendMessage}
    />
  );
}
```

---

## 🧪 Debug Mode

```typescript
import { ChatModalManager, debugModalContext } from '@/components/chat/modals';

function ChatComDebug() {
  const handleDetectContext = (message: string) => {
    // Debug no console
    debugModalContext(message);
  };

  return (
    <ChatModalManager
      userId="user-123"
      onDetectContext={handleDetectContext}
    />
  );
}
```

---

## 📱 Integrar com Layout Existente

```typescript
import { ChatModalManager } from '@/components/chat/modals';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

function ChatComLayout() {
  return (
    <div className="flex h-screen">
      {/* Sidebar existente */}
      <Sidebar />

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col">
        {/* Header existente */}
        <Header />

        {/* Novo sistema de modais */}
        <div className="flex-1 overflow-hidden">
          <ChatModalManager userId="user-123" />
        </div>
      </div>
    </div>
  );
}
```

---

## 🎯 Forçar Modal Inicial

```typescript
// Iniciar sempre no Visual Editor
<ChatModalManager
  userId="user-123"
  initialModal="visual-editor"
/>

// Iniciar na galeria de imagens
<ChatModalManager
  userId="user-123"
  initialModal="image-gallery"
/>
```

---

## 🔒 Desabilitar Auto-Detecção

```typescript
// Usuário escolhe manualmente
<ChatModalManager
  userId="user-123"
  autoDetect={false}
  allowManualSwitch={true}
/>
```

---

## 📊 Com State Management

```typescript
import { useState } from 'react';
import { ChatModalManager, type ModalType } from '@/components/chat/modals';

function ChatComState() {
  const [currentModal, setCurrentModal] = useState<ModalType>('chat');
  const [messageCount, setMessageCount] = useState(0);

  return (
    <div>
      {/* Info */}
      <div className="p-4 bg-gray-800 text-white">
        <p>Modal atual: {currentModal}</p>
        <p>Mensagens: {messageCount}</p>
      </div>

      {/* Chat */}
      <ChatModalManager
        userId="user-123"
        onModalChange={(type) => setCurrentModal(type)}
        onSendMessage={() => setMessageCount((prev) => prev + 1)}
      />
    </div>
  );
}
```

---

## 🎨 Customização de Estilos

```typescript
<ChatModalManager
  userId="user-123"
  className="custom-chat-theme"
/>
```

```css
/* styles/custom-chat.css */
.custom-chat-theme {
  --modal-bg: #0a0a0f;
  --modal-border: rgba(255, 255, 255, 0.1);
  --modal-accent: #3b82f6;
  --modal-text: #ffffff;
}

.custom-chat-theme .modal-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

---

## 🔍 Testar Detecção Manualmente

```typescript
import { detectModalContext } from '@/components/chat/modals';

// No console ou em um useEffect
const testMessages = [
  "Crie uma landing page",
  "Gere uma imagem de cachorro",
  "Fazer um vídeo de 5 segundos",
  "Como criar campanhas?"
];

testMessages.forEach(msg => {
  const context = detectModalContext(msg);
  console.log(`"${msg}" -> ${context.type} (${context.confidence * 100}%)`);
});
```

---

## ⚙️ Ajustar Threshold de Confiança

```typescript
// Em src/lib/ai/modalContext.ts

// ANTES (padrão):
export function shouldAutoTransition(context: ModalContext): boolean {
  return context.confidence >= 0.7 && context.type !== 'chat';
}

// DEPOIS (mais conservador):
export function shouldAutoTransition(context: ModalContext): boolean {
  return context.confidence >= 0.8 && context.type !== 'chat';
}

// DEPOIS (mais agressivo):
export function shouldAutoTransition(context: ModalContext): boolean {
  return context.confidence >= 0.6 && context.type !== 'chat';
}
```

---

## 📝 Adicionar Novos Padrões de Detecção

```typescript
// Em src/lib/ai/modalContext.ts

const MODAL_PATTERNS: Record<ModalType, RegExp[]> = {
  'visual-editor': [
    // Padrões existentes...
    
    // ADICIONE SEUS PADRÕES AQUI
    /mont(e|ar)\s+uma?\s+p[aá]gina/i,
    /constru(a|ir)\s+landing/i,
    /preciso\s+de\s+um\s+site/i,
  ],
  
  'image-gallery': [
    // Padrões existentes...
    
    // ADICIONE AQUI
    /desenh(e|ar)\s+um/i,
    /quero\s+uma?\s+arte/i,
  ],
};
```

---

## 🎯 Adicionar Keywords Boosters

```typescript
// Em src/lib/ai/modalContext.ts

const CONFIDENCE_BOOSTERS: Record<ModalType, string[]> = {
  'visual-editor': [
    // Existentes...
    
    // ADICIONE AQUI
    'wordpress',
    'wix',
    'webflow',
    'framer',
  ],
  
  'image-gallery': [
    // Existentes...
    
    // ADICIONE AQUI
    'photoshop',
    'figma',
    'illustrator',
  ],
};
```

---

## 🚦 Loading States

```typescript
import { useState } from 'react';
import { ChatModalManager } from '@/components/chat/modals';

function ChatComLoading() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (message: string) => {
    setIsLoading(true);
    try {
      await enviarMensagem(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isLoading && (
        <div className="fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg">
          Processando...
        </div>
      )}
      
      <ChatModalManager
        userId="user-123"
        onSendMessage={handleSendMessage}
      />
    </>
  );
}
```

---

## 💾 Persistir Estado no LocalStorage

```typescript
import { useEffect, useState } from 'react';
import { ChatModalManager, type ModalType } from '@/components/chat/modals';

function ChatComPersistencia() {
  const [lastModal, setLastModal] = useState<ModalType>('chat');

  // Carregar do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('last_modal');
    if (saved) setLastModal(saved as ModalType);
  }, []);

  // Salvar mudanças
  const handleModalChange = (type: ModalType) => {
    localStorage.setItem('last_modal', type);
    setLastModal(type);
  };

  return (
    <ChatModalManager
      userId="user-123"
      initialModal={lastModal}
      onModalChange={handleModalChange}
    />
  );
}
```

---

## 🔔 Notificações de Transição

```typescript
import { ChatModalManager } from '@/components/chat/modals';
import { useToast } from '@/components/ui/use-toast';

function ChatComNotificacoes() {
  const { toast } = useToast();

  const handleModalChange = (type: string) => {
    const names = {
      'chat': 'Chat',
      'visual-editor': 'Editor Visual',
      'image-gallery': 'Galeria de Imagens',
      'video-gallery': 'Galeria de Vídeos',
    };

    toast({
      title: 'Modo alterado',
      description: `Agora você está em: ${names[type]}`,
      duration: 2000,
    });
  };

  return (
    <ChatModalManager
      userId="user-123"
      onModalChange={handleModalChange}
    />
  );
}
```

---

## 🎤 Adicionar Comando de Voz (Futuro)

```typescript
import { useState } from 'react';
import { ChatModalManager } from '@/components/chat/modals';

function ChatComVoz() {
  const [isListening, setIsListening] = useState(false);

  const startVoiceRecognition = () => {
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = 'pt-BR';
    
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      // Processar comando de voz
      console.log('Comando:', transcript);
    };
    
    recognition.start();
  };

  return (
    <div>
      <button
        onClick={startVoiceRecognition}
        className="fixed bottom-4 right-4 w-16 h-16 bg-blue-600 rounded-full"
      >
        {isListening ? '🎤' : '🎙️'}
      </button>
      
      <ChatModalManager userId="user-123" />
    </div>
  );
}
```

---

## 📈 Analytics Integration

```typescript
import { ChatModalManager } from '@/components/chat/modals';

function ChatComAnalytics() {
  const trackModalChange = (type: string) => {
    // Google Analytics
    if (window.gtag) {
      window.gtag('event', 'modal_change', {
        modal_type: type,
        timestamp: Date.now(),
      });
    }

    // Mixpanel
    if (window.mixpanel) {
      window.mixpanel.track('Modal Changed', {
        type,
        timestamp: new Date().toISOString(),
      });
    }

    // Custom Analytics
    fetch('/api/analytics/modal-change', {
      method: 'POST',
      body: JSON.stringify({ type }),
    });
  };

  const trackMessage = (message: string, context: any) => {
    if (window.gtag) {
      window.gtag('event', 'message_sent', {
        modal_type: context.type,
        message_length: message.length,
        confidence: context.confidence,
      });
    }
  };

  return (
    <ChatModalManager
      userId="user-123"
      onModalChange={trackModalChange}
      onSendMessage={trackMessage}
    />
  );
}
```

---

## 🌐 Multi-Idioma (Futuro)

```typescript
import { ChatModalManager } from '@/components/chat/modals';

function ChatMultiIdioma() {
  const [language, setLanguage] = useState('pt-BR');

  // Traduzir prompts e UI baseado no idioma
  const getLocalizedPrompt = (key: string) => {
    const translations = {
      'pt-BR': {
        'create-page': 'Criar página',
        'generate-image': 'Gerar imagem',
      },
      'en-US': {
        'create-page': 'Create page',
        'generate-image': 'Generate image',
      },
    };
    
    return translations[language]?.[key] || key;
  };

  return (
    <div>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className="mb-4"
      >
        <option value="pt-BR">Português</option>
        <option value="en-US">English</option>
        <option value="es-ES">Español</option>
      </select>

      <ChatModalManager userId="user-123" />
    </div>
  );
}
```

---

## 🔐 Verificar Permissões

```typescript
import { ChatModalManager } from '@/components/chat/modals';

function ChatComPermissoes() {
  const user = useAuthStore((state) => state.user);

  // Verificar se usuário tem acesso a features premium
  const canUseVisualEditor = user?.plan === 'premium';
  const canGenerateVideos = user?.plan === 'premium';

  const handleModalChange = (type: string) => {
    if (type === 'visual-editor' && !canUseVisualEditor) {
      alert('Upgrade para Premium para usar o Editor Visual');
      return;
    }
    
    if (type === 'video-gallery' && !canGenerateVideos) {
      alert('Upgrade para Premium para gerar vídeos');
      return;
    }
  };

  return (
    <ChatModalManager
      userId={user?.id}
      onModalChange={handleModalChange}
    />
  );
}
```

---

## 🎁 Exemplo Completo - Production Ready

```typescript
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatModalManager, type ModalType, type ModalContext } from '@/components/chat/modals';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { useToast } from '@/components/ui/use-toast';
import chatService from '@/lib/api/chatService';

export default function ChatPage() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [currentModal, setCurrentModal] = useState<ModalType>('chat');
  const [messageCount, setMessageCount] = useState(0);
  
  const addMessage = useChatStore((state) => state.addMessage);
  const activeConversationId = useChatStore((state) => state.activeConversationId);

  // Auth check
  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login-v2', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // Load last modal from storage
  useEffect(() => {
    const saved = localStorage.getItem('syncads_last_modal');
    if (saved) setCurrentModal(saved as ModalType);
  }, []);

  // Modal change handler
  const handleModalChange = (type: ModalType) => {
    setCurrentModal(type);
    localStorage.setItem('syncads_last_modal', type);

    // Analytics
    if (window.gtag) {
      window.gtag('event', 'modal_change', {
        modal_type: type,
        user_id: user?.id,
      });
    }

    // Toast notification
    const names = {
      'chat': 'Chat',
      'visual-editor': 'Editor Visual',
      'image-gallery': 'Galeria de Imagens',
      'video-gallery': 'Galeria de Vídeos',
      'code-editor': 'Editor de Código',
    };

    toast({
      title: 'Modo alterado',
      description: `Agora você está em: ${names[type]}`,
      duration: 2000,
    });
  };

  // Message send handler
  const handleSendMessage = async (message: string, context: ModalContext) => {
    if (!user || !activeConversationId) return;

    setMessageCount((prev) => prev + 1);

    try {
      // Add user message
      await addMessage(user.id, activeConversationId, {
        role: 'user',
        content: message,
      });

      // Get AI response with context-aware prompt
      const response = await chatService.sendMessage(
        message,
        activeConversationId,
        {
          systemPrompt: getSystemPromptForContext(context.type),
        }
      );

      // Add AI response
      await addMessage(user.id, activeConversationId, {
        role: 'assistant',
        content: response,
      });

      // Analytics
      if (window.gtag) {
        window.gtag('event', 'message_sent', {
          modal_type: context.type,
          confidence: context.confidence,
          user_id: user.id,
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Erro ao enviar mensagem',
        description: 'Tente novamente',
        variant: 'destructive',
      });
    }
  };

  if (!user) return null;

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Debug info (remover em produção) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="px-4 py-2 bg-gray-800 text-white text-xs flex justify-between">
          <span>Modal: {currentModal}</span>
          <span>Mensagens: {messageCount}</span>
          <span>User: {user.email}</span>
        </div>
      )}

      {/* Main chat interface */}
      <div className="flex-1 overflow-hidden">
        <ChatModalManager
          autoDetect={true}
          allowManualSwitch={true}
          userId={user.id}
          initialModal={currentModal}
          onModalChange={handleModalChange}
          onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  );
}

// Helper: Context-aware system prompts
function getSystemPromptForContext(modalType: ModalType): string {
  const prompts: Record<ModalType, string> = {
    'chat': `Você é um assistente de IA especializado em marketing digital para a plataforma SyncAds.
Responda sempre em português do Brasil de forma clara, objetiva e prática.`,

    'visual-editor': `Você é um designer e desenvolvedor web especializado.
Gere HTML/CSS moderno usando Tailwind CSS com estrutura semântica e responsiva.`,

    'image-gallery': `Você é um especialista em geração de imagens com IA.
Otimize prompts em inglês com detalhes de qualidade e estilo artístico.`,

    'video-gallery': `Você é um especialista em criação de vídeos com IA.
Crie descrições cinematográficas com movimentos de câmera e timing.`,

    'code-editor': `Você é um desenvolvedor experiente.
Escreva código limpo, comentado e seguindo melhores práticas.`,
  };

  return prompts[modalType] || prompts['chat'];
}
```

---

**Ready to use! Copy and paste any snippet. 🚀**

*SyncAds - Sistema de Modais Inteligentes v1.0.0*