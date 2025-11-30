// ============================================================================
// VISUAL FEEDBACK ENGINE - Sistema de Feedback Visual da IA
// ============================================================================
// Mostra ao usuário o que a IA está fazendo em tempo real
// ============================================================================

console.log('🎨 Visual Feedback Engine carregado');

class VisualFeedbackEngine {
  constructor() {
    this.activeHighlights = new Set();
    this.activeNotifications = new Set();
    this.thinkingElement = null;
    this.progressElement = null;
    this.cursorElement = null;

    this.injectStyles();
    console.log('✅ Visual Feedback Engine inicializado');
  }

  // ============================================================================
  // HIGHLIGHT DE ELEMENTOS
  // ============================================================================

  /**
   * Destaca um elemento antes de interagir com ele
   */
  highlightElement(selector, duration = 2000) {
    try {
      const elements = document.querySelectorAll(selector);

      if (elements.length === 0) {
        console.warn('⚠️ Elemento não encontrado:', selector);
        return false;
      }

      elements.forEach(element => {
        const rect = element.getBoundingClientRect();

        // Criar overlay de destaque
        const highlight = document.createElement('div');
        highlight.className = 'ai-highlight-box';
        highlight.dataset.aiHighlight = 'true';

        highlight.style.cssText = `
          position: fixed;
          left: ${rect.left - 5}px;
          top: ${rect.top - 5}px;
          width: ${rect.width + 10}px;
          height: ${rect.height + 10}px;
          border: 3px solid #667eea;
          border-radius: 8px;
          box-shadow: 0 0 20px rgba(102, 126, 234, 0.8), inset 0 0 20px rgba(102, 126, 234, 0.3);
          pointer-events: none;
          z-index: 2147483646;
          animation: ai-pulse 1s infinite, ai-glow 2s ease-in-out infinite;
          background: rgba(102, 126, 234, 0.1);
        `;

        // Adicionar label
        const label = document.createElement('div');
        label.className = 'ai-highlight-label';
        label.textContent = '🤖 IA';
        label.style.cssText = `
          position: absolute;
          top: -30px;
          left: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 4px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          white-space: nowrap;
        `;
        highlight.appendChild(label);

        document.body.appendChild(highlight);
        this.activeHighlights.add(highlight);

        // Adicionar classe ao elemento original
        element.classList.add('ai-interacting');

        // Remover após duração
        setTimeout(() => {
          highlight.style.animation = 'ai-fadeOut 0.3s ease-out';
          setTimeout(() => {
            highlight.remove();
            this.activeHighlights.delete(highlight);
            element.classList.remove('ai-interacting');
          }, 300);
        }, duration);

        // Fazer scroll suave até o elemento se não estiver visível
        if (rect.top < 0 || rect.bottom > window.innerHeight) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center'
          });
        }
      });

      return true;
    } catch (error) {
      console.error('❌ Erro ao destacar elemento:', error);
      return false;
    }
  }

  /**
   * Remove todos os highlights ativos
   */
  clearHighlights() {
    this.activeHighlights.forEach(highlight => {
      highlight.remove();
    });
    this.activeHighlights.clear();
  }

  // ============================================================================
  // CURSOR VIRTUAL
  // ============================================================================

  /**
   * Mostra cursor virtual movendo até o elemento
   */
  async showCursorMovement(selector) {
    try {
      const element = document.querySelector(selector);
      if (!element) return;

      const rect = element.getBoundingClientRect();
      const targetX = rect.left + rect.width / 2;
      const targetY = rect.top + rect.height / 2;

      // Criar cursor se não existe
      if (!this.cursorElement) {
        this.cursorElement = document.createElement('div');
        this.cursorElement.className = 'ai-virtual-cursor';
        this.cursorElement.innerHTML = '🖱️';
        document.body.appendChild(this.cursorElement);
      }

      // Posição inicial (canto superior esquerdo)
      const startX = window.innerWidth / 4;
      const startY = window.innerHeight / 4;

      this.cursorElement.style.cssText = `
        position: fixed;
        left: ${startX}px;
        top: ${startY}px;
        font-size: 32px;
        pointer-events: none;
        z-index: 2147483647;
        filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
        transition: all 0.8s cubic-bezier(0.4, 0.0, 0.2, 1);
        transform: scale(1);
      `;

      // Aguardar um frame
      await new Promise(resolve => requestAnimationFrame(resolve));

      // Mover para o alvo
      this.cursorElement.style.left = `${targetX}px`;
      this.cursorElement.style.top = `${targetY}px`;

      // Aguardar animação completar
      await new Promise(resolve => setTimeout(resolve, 800));

      // Efeito de clique
      this.showClickEffect(targetX, targetY);

      // Escalar cursor (efeito de clique)
      this.cursorElement.style.transform = 'scale(0.7)';
      await new Promise(resolve => setTimeout(resolve, 100));
      this.cursorElement.style.transform = 'scale(1)';

      // Remover cursor após delay
      setTimeout(() => {
        if (this.cursorElement) {
          this.cursorElement.style.opacity = '0';
          setTimeout(() => {
            if (this.cursorElement) {
              this.cursorElement.remove();
              this.cursorElement = null;
            }
          }, 300);
        }
      }, 1000);

    } catch (error) {
      console.error('❌ Erro ao mostrar cursor:', error);
    }
  }

  /**
   * Mostra efeito de clique
   */
  showClickEffect(x, y) {
    const ripple = document.createElement('div');
    ripple.className = 'ai-click-ripple';
    ripple.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: rgba(102, 126, 234, 0.6);
      transform: translate(-50%, -50%) scale(0);
      pointer-events: none;
      z-index: 2147483647;
      animation: ai-ripple 0.6s ease-out;
    `;
    document.body.appendChild(ripple);

    setTimeout(() => ripple.remove(), 600);
  }

  // ============================================================================
  // NOTIFICAÇÕES E MENSAGENS
  // ============================================================================

  /**
   * Mostra que a IA está "pensando"
   */
  showThinking(message = 'Pensando...') {
    this.hideThinking(); // Remove anterior se existir

    this.thinkingElement = document.createElement('div');
    this.thinkingElement.id = 'ai-thinking-box';
    this.thinkingElement.className = 'ai-thinking-notification';

    this.thinkingElement.innerHTML = `
      <div class="ai-thinking-content">
        <div class="ai-brain-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="currentColor"/>
            <circle cx="12" cy="12" r="3" fill="currentColor">
              <animate attributeName="r" values="2;4;2" dur="1.5s" repeatCount="indefinite"/>
            </circle>
          </svg>
        </div>
        <div class="ai-thinking-text">${this.escapeHtml(message)}</div>
        <div class="ai-dots">
          <span>.</span><span>.</span><span>.</span>
        </div>
      </div>
    `;

    this.thinkingElement.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 16px 24px;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(102, 126, 234, 0.4);
      display: flex;
      align-items: center;
      gap: 12px;
      z-index: 2147483647;
      animation: ai-slideInRight 0.3s ease-out;
      max-width: 300px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    document.body.appendChild(this.thinkingElement);
    this.activeNotifications.add(this.thinkingElement);
  }

  /**
   * Esconde mensagem de "pensando"
   */
  hideThinking() {
    if (this.thinkingElement) {
      this.thinkingElement.style.animation = 'ai-slideOutRight 0.3s ease-out';
      setTimeout(() => {
        if (this.thinkingElement) {
          this.thinkingElement.remove();
          this.activeNotifications.delete(this.thinkingElement);
          this.thinkingElement = null;
        }
      }, 300);
    }
  }

  /**
   * Mostra notificação de sucesso
   */
  showSuccess(message, duration = 3000) {
    this.showNotification(message, 'success', duration);
  }

  /**
   * Mostra notificação de erro
   */
  showError(message, duration = 5000) {
    this.showNotification(message, 'error', duration);
  }

  /**
   * Mostra notificação de aviso
   */
  showWarning(message, duration = 4000) {
    this.showNotification(message, 'warning', duration);
  }

  /**
   * Mostra notificação genérica
   */
  showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `ai-notification ai-notification-${type}`;

    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };

    const colors = {
      success: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      error: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      warning: 'linear-gradient(135deg, #ffc837 0%, #ff8008 100%)',
      info: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    };

    notification.innerHTML = `
      <div class="ai-notification-icon">${icons[type]}</div>
      <div class="ai-notification-message">${this.escapeHtml(message)}</div>
    `;

    notification.style.cssText = `
      position: fixed;
      top: 24px;
      right: 24px;
      background: ${colors[type]};
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.2);
      display: flex;
      align-items: center;
      gap: 12px;
      z-index: 2147483647;
      animation: ai-slideInDown 0.3s ease-out;
      max-width: 350px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
    `;

    document.body.appendChild(notification);
    this.activeNotifications.add(notification);

    setTimeout(() => {
      notification.style.animation = 'ai-slideOutUp 0.3s ease-out';
      setTimeout(() => {
        notification.remove();
        this.activeNotifications.delete(notification);
      }, 300);
    }, duration);
  }

  // ============================================================================
  // BARRA DE PROGRESSO
  // ============================================================================

  /**
   * Mostra barra de progresso
   */
  showProgress(message, current, total) {
    const percentage = Math.round((current / total) * 100);

    if (!this.progressElement) {
      this.progressElement = document.createElement('div');
      this.progressElement.id = 'ai-progress-bar';
      this.progressElement.innerHTML = `
        <div class="ai-progress-container">
          <div class="ai-progress-text"></div>
          <div class="ai-progress-bar-bg">
            <div class="ai-progress-bar-fill"></div>
          </div>
          <div class="ai-progress-percentage"></div>
        </div>
      `;

      this.progressElement.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: rgba(255, 255, 255, 0.98);
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        z-index: 2147483647;
        padding: 16px 24px;
        animation: ai-slideInDown 0.3s ease-out;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      `;

      document.body.appendChild(this.progressElement);
    }

    const textEl = this.progressElement.querySelector('.ai-progress-text');
    const fillEl = this.progressElement.querySelector('.ai-progress-bar-fill');
    const percentEl = this.progressElement.querySelector('.ai-progress-percentage');

    if (textEl) textEl.textContent = message;
    if (fillEl) {
      fillEl.style.width = `${percentage}%`;
      fillEl.style.background = 'linear-gradient(90deg, #667eea, #764ba2)';
      fillEl.style.transition = 'width 0.3s ease';
      fillEl.style.height = '6px';
      fillEl.style.borderRadius = '3px';
    }
    if (percentEl) percentEl.textContent = `${percentage}%`;

    // Remover quando completar
    if (current >= total) {
      setTimeout(() => this.hideProgress(), 1000);
    }
  }

  /**
   * Esconde barra de progresso
   */
  hideProgress() {
    if (this.progressElement) {
      this.progressElement.style.animation = 'ai-slideOutUp 0.3s ease-out';
      setTimeout(() => {
        if (this.progressElement) {
          this.progressElement.remove();
          this.progressElement = null;
        }
      }, 300);
    }
  }

  // ============================================================================
  // OVERLAY DE EXECUÇÃO
  // ============================================================================

  /**
   * Mostra overlay semi-transparente durante execução
   */
  showExecutionOverlay(message = 'Executando...') {
    const overlay = document.createElement('div');
    overlay.id = 'ai-execution-overlay';
    overlay.className = 'ai-overlay';

    overlay.innerHTML = `
      <div class="ai-overlay-content">
        <div class="ai-spinner"></div>
        <div class="ai-overlay-message">${this.escapeHtml(message)}</div>
      </div>
    `;

    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2147483646;
      animation: ai-fadeIn 0.3s ease-out;
    `;

    document.body.appendChild(overlay);
    return overlay;
  }

  /**
   * Remove overlay de execução
   */
  hideExecutionOverlay() {
    const overlay = document.getElementById('ai-execution-overlay');
    if (overlay) {
      overlay.style.animation = 'ai-fadeOut 0.3s ease-out';
      setTimeout(() => overlay.remove(), 300);
    }
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  /**
   * Escapa HTML para prevenir XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Limpa todos os elementos visuais
   */
  cleanup() {
    this.clearHighlights();
    this.hideThinking();
    this.hideProgress();
    this.hideExecutionOverlay();

    if (this.cursorElement) {
      this.cursorElement.remove();
      this.cursorElement = null;
    }

    this.activeNotifications.forEach(notification => {
      notification.remove();
    });
    this.activeNotifications.clear();
  }

  // ============================================================================
  // INJEÇÃO DE ESTILOS CSS
  // ============================================================================

  injectStyles() {
    if (document.getElementById('ai-visual-feedback-styles')) {
      return; // Já injetado
    }

    const style = document.createElement('style');
    style.id = 'ai-visual-feedback-styles';
    style.textContent = `
      /* Animações */
      @keyframes ai-pulse {
        0%, 100% {
          border-color: #667eea;
          box-shadow: 0 0 20px rgba(102, 126, 234, 0.6), inset 0 0 20px rgba(102, 126, 234, 0.3);
        }
        50% {
          border-color: #764ba2;
          box-shadow: 0 0 40px rgba(118, 75, 162, 0.8), inset 0 0 40px rgba(118, 75, 162, 0.5);
        }
      }

      @keyframes ai-glow {
        0%, 100% {
          filter: brightness(1);
        }
        50% {
          filter: brightness(1.2);
        }
      }

      @keyframes ai-fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      @keyframes ai-fadeOut {
        from {
          opacity: 1;
        }
        to {
          opacity: 0;
        }
      }

      @keyframes ai-slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes ai-slideOutRight {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }

      @keyframes ai-slideInDown {
        from {
          transform: translateY(-100%);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      @keyframes ai-slideOutUp {
        from {
          transform: translateY(0);
          opacity: 1;
        }
        to {
          transform: translateY(-100%);
          opacity: 0;
        }
      }

      @keyframes ai-ripple {
        to {
          transform: translate(-50%, -50%) scale(4);
          opacity: 0;
        }
      }

      @keyframes blink {
        0%, 60%, 100% {
          opacity: 0;
        }
        30% {
          opacity: 1;
        }
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      /* Elementos */
      .ai-thinking-content {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .ai-brain-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        color: white;
      }

      .ai-thinking-text {
        font-size: 14px;
        font-weight: 500;
      }

      .ai-dots {
        display: flex;
        gap: 4px;
      }

      .ai-dots span {
        animation: blink 1.4s infinite;
        font-size: 20px;
        line-height: 1;
      }

      .ai-dots span:nth-child(2) {
        animation-delay: 0.2s;
      }

      .ai-dots span:nth-child(3) {
        animation-delay: 0.4s;
      }

      .ai-notification {
        font-weight: 500;
      }

      .ai-notification-icon {
        font-size: 20px;
      }

      .ai-notification-message {
        flex: 1;
      }

      .ai-progress-container {
        max-width: 800px;
        margin: 0 auto;
      }

      .ai-progress-text {
        font-size: 14px;
        font-weight: 600;
        color: #333;
        margin-bottom: 8px;
      }

      .ai-progress-bar-bg {
        width: 100%;
        height: 6px;
        background: #e0e0e0;
        border-radius: 3px;
        overflow: hidden;
        margin-bottom: 4px;
      }

      .ai-progress-percentage {
        font-size: 12px;
        color: #666;
        text-align: right;
        font-weight: 500;
      }

      .ai-overlay-content {
        text-align: center;
        color: white;
      }

      .ai-spinner {
        width: 48px;
        height: 48px;
        border: 4px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        margin: 0 auto 16px;
        animation: spin 1s linear infinite;
      }

      .ai-overlay-message {
        font-size: 18px;
        font-weight: 600;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .ai-interacting {
        position: relative;
      }

      .ai-virtual-cursor {
        transition: left 0.8s cubic-bezier(0.4, 0.0, 0.2, 1),
                    top 0.8s cubic-bezier(0.4, 0.0, 0.2, 1),
                    opacity 0.3s ease,
                    transform 0.1s ease;
      }
    `;

    document.head.appendChild(style);
  }
}

// ============================================================================
// INICIALIZAÇÃO GLOBAL
// ============================================================================

// Criar instância global
if (!window.aiVisualFeedback) {
  window.aiVisualFeedback = new VisualFeedbackEngine();

  // Cleanup ao descarregar página
  window.addEventListener('beforeunload', () => {
    if (window.aiVisualFeedback) {
      window.aiVisualFeedback.cleanup();
    }
  });

  console.log('✅ Visual Feedback Engine disponível globalmente em window.aiVisualFeedback');
}
