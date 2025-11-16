// ============================================
// SYNCADS EXTENSION - CONTENT SCRIPT
// Manipulação do DOM e automação de ações
// ============================================

console.log('🎯 SyncAds Content Script Loaded');

// ============================================
// ESTADO DO CONTENT SCRIPT
// ============================================
let scriptState = {
  isActive: false,
  commandsProcessed: 0,
  lastActivity: null
};

// ============================================
// LISTENER DE MENSAGENS DO BACKGROUND
// ============================================
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 Content script received:', request.type);

  scriptState.isActive = true;
  scriptState.lastActivity = Date.now();

  // Processar comando baseado no tipo
  switch (request.type) {
    case 'DOM_READ':
      handleDOMRead(request, sendResponse);
      break;

    case 'DOM_CLICK':
      handleDOMClick(request, sendResponse);
      break;

    case 'DOM_FILL':
      handleDOMFill(request, sendResponse);
      break;

    case 'DOM_WAIT':
      handleDOMWait(request, sendResponse);
      break;

    case 'DOM_EXTRACT':
      handleDOMExtract(request, sendResponse);
      break;

    case 'DOM_SCROLL':
      handleDOMScroll(request, sendResponse);
      break;

    default:
      sendResponse({
        success: false,
        error: `Unknown command type: ${request.type}`
      });
  }

  scriptState.commandsProcessed++;

  // Manter canal aberto para resposta assíncrona
  return true;
});

// ============================================
// LER ELEMENTO DO DOM
// ============================================
function handleDOMRead(request, sendResponse) {
  try {
    const { selector, attribute, multiple = false } = request;

    if (multiple) {
      // Selecionar múltiplos elementos
      const elements = document.querySelectorAll(selector);

      if (!elements || elements.length === 0) {
        sendResponse({
          success: false,
          error: `No elements found: ${selector}`
        });
        return;
      }

      const data = Array.from(elements).map(el => extractElementData(el, attribute));

      sendResponse({
        success: true,
        data,
        count: elements.length
      });

    } else {
      // Selecionar um elemento
      const element = document.querySelector(selector);

      if (!element) {
        sendResponse({
          success: false,
          error: `Element not found: ${selector}`
        });
        return;
      }

      const data = extractElementData(element, attribute);

      sendResponse({
        success: true,
        data
      });
    }

    sendLog('DOM_READ', `Read element(s): ${selector}`);

  } catch (error) {
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

// ============================================
// EXTRAIR DADOS DO ELEMENTO
// ============================================
function extractElementData(element, requestedAttribute = null) {
  const data = {
    text: element.textContent?.trim() || '',
    innerText: element.innerText?.trim() || '',
    html: element.innerHTML,
    outerHTML: element.outerHTML,
    tagName: element.tagName.toLowerCase(),
    value: element.value || null,
    href: element.href || null,
    src: element.src || null,
    attributes: {},
    classes: Array.from(element.classList),
    bounds: element.getBoundingClientRect(),
    visible: isElementVisible(element),
    enabled: !element.disabled
  };

  // Capturar todos os atributos
  Array.from(element.attributes).forEach(attr => {
    data.attributes[attr.name] = attr.value;
  });

  // Se atributo específico foi solicitado
  if (requestedAttribute) {
    data.requestedAttribute = element.getAttribute(requestedAttribute);
  }

  return data;
}

// ============================================
// CLICAR EM ELEMENTO
// ============================================
function handleDOMClick(request, sendResponse) {
  try {
    const { selector, waitAfter = 500, smooth = true } = request;
    const element = document.querySelector(selector);

    if (!element) {
      sendResponse({
        success: false,
        error: `Element not found: ${selector}`
      });
      return;
    }

    // Scroll suave até elemento
    element.scrollIntoView({
      behavior: smooth ? 'smooth' : 'instant',
      block: 'center',
      inline: 'center'
    });

    // Aguardar scroll completar
    setTimeout(() => {
      // Destacar elemento visualmente
      const originalBorder = element.style.border;
      const originalBackground = element.style.backgroundColor;

      element.style.border = '3px solid #667eea';
      element.style.backgroundColor = 'rgba(102, 126, 234, 0.1)';

      setTimeout(() => {
        // Simular hover
        const hoverEvent = new MouseEvent('mouseover', {
          view: window,
          bubbles: true,
          cancelable: true
        });
        element.dispatchEvent(hoverEvent);

        setTimeout(() => {
          // Simular clique completo
          const mousedownEvent = new MouseEvent('mousedown', {
            view: window,
            bubbles: true,
            cancelable: true
          });
          element.dispatchEvent(mousedownEvent);

          setTimeout(() => {
            const clickEvent = new MouseEvent('click', {
              view: window,
              bubbles: true,
              cancelable: true
            });
            element.dispatchEvent(clickEvent);
            element.click(); // Click nativo também

            const mouseupEvent = new MouseEvent('mouseup', {
              view: window,
              bubbles: true,
              cancelable: true
            });
            element.dispatchEvent(mouseupEvent);

            // Restaurar estilo original
            setTimeout(() => {
              element.style.border = originalBorder;
              element.style.backgroundColor = originalBackground;

              sendResponse({
                success: true,
                message: `Clicked element: ${selector}`,
                elementText: element.textContent?.trim()
              });

              sendLog('DOM_CLICK', `Clicked: ${selector}`);

            }, waitAfter);

          }, 50);
        }, 100);
      }, 200);
    }, 300);

  } catch (error) {
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

// ============================================
// PREENCHER INPUT
// ============================================
function handleDOMFill(request, sendResponse) {
  try {
    const { selector, value, clear = true, typeSpeed = 'normal' } = request;
    const element = document.querySelector(selector);

    if (!element) {
      sendResponse({
        success: false,
        error: `Element not found: ${selector}`
      });
      return;
    }

    // Scroll até elemento
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });

    setTimeout(() => {
      // Focus no elemento
      element.focus();

      // Destacar elemento
      const originalBorder = element.style.border;
      element.style.border = '2px solid #10b981';

      setTimeout(() => {
        // Limpar se necessário
        if (clear) {
          element.value = '';
          element.dispatchEvent(new Event('input', { bubbles: true }));
        }

        // Simular digitação humana
        const currentValue = element.value;
        const chars = value.split('');

        // Velocidades de digitação
        const speeds = {
          fast: { min: 30, max: 60 },
          normal: { min: 50, max: 150 },
          slow: { min: 100, max: 250 }
        };

        const speed = speeds[typeSpeed] || speeds.normal;

        let typedValue = currentValue;

        const typeChar = () => {
          if (chars.length === 0) {
            // Finalizar digitação
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
            element.blur();

            // Restaurar borda
            element.style.border = originalBorder;

            sendResponse({
              success: true,
              message: `Filled element: ${selector}`,
              value: typedValue
            });

            sendLog('DOM_FILL', `Filled: ${selector} with "${value}"`);
            return;
          }

          const char = chars.shift();
          typedValue += char;
          element.value = typedValue;

          // Disparar eventos
          element.dispatchEvent(new InputEvent('input', {
            bubbles: true,
            cancelable: true,
            data: char,
            inputType: 'insertText'
          }));

          // Delay aleatório entre caracteres
          const delay = Math.random() * (speed.max - speed.min) + speed.min;
          setTimeout(typeChar, delay);
        };

        // Iniciar digitação após delay inicial
        setTimeout(typeChar, 200);

      }, 300);
    }, 300);

  } catch (error) {
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

// ============================================
// AGUARDAR ELEMENTO
// ============================================
function handleDOMWait(request, sendResponse) {
  const { selector, timeout = 10000, checkInterval = 100 } = request;
  const startTime = Date.now();

  const checkElement = () => {
    const element = document.querySelector(selector);

    if (element && isElementVisible(element)) {
      sendResponse({
        success: true,
        message: `Element found: ${selector}`,
        waitTime: Date.now() - startTime
      });
      return;
    }

    const elapsed = Date.now() - startTime;

    if (elapsed > timeout) {
      sendResponse({
        success: false,
        error: `Element not found after ${timeout}ms: ${selector}`,
        waitTime: elapsed
      });
      return;
    }

    // Verificar novamente
    setTimeout(checkElement, checkInterval);
  };

  checkElement();
}

// ============================================
// EXTRAIR DADOS ESTRUTURADOS
// ============================================
function handleDOMExtract(request, sendResponse) {
  try {
    const { selectors } = request;
    const data = {};

    for (const [key, selector] of Object.entries(selectors)) {
      const element = document.querySelector(selector);

      if (element) {
        data[key] = {
          text: element.textContent?.trim(),
          value: element.value || null,
          html: element.innerHTML
        };
      } else {
        data[key] = null;
      }
    }

    sendResponse({
      success: true,
      data
    });

    sendLog('DOM_EXTRACT', 'Extracted structured data');

  } catch (error) {
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

// ============================================
// SCROLL NA PÁGINA
// ============================================
function handleDOMScroll(request, sendResponse) {
  try {
    const { direction = 'down', amount = 500, smooth = true } = request;

    let scrollOptions = {
      behavior: smooth ? 'smooth' : 'instant'
    };

    if (direction === 'down') {
      window.scrollBy({ top: amount, ...scrollOptions });
    } else if (direction === 'up') {
      window.scrollBy({ top: -amount, ...scrollOptions });
    } else if (direction === 'top') {
      window.scrollTo({ top: 0, ...scrollOptions });
    } else if (direction === 'bottom') {
      window.scrollTo({ top: document.body.scrollHeight, ...scrollOptions });
    }

    setTimeout(() => {
      sendResponse({
        success: true,
        message: `Scrolled ${direction}`,
        scrollPosition: window.scrollY
      });
    }, smooth ? 500 : 0);

  } catch (error) {
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

// ============================================
// VERIFICAR SE ELEMENTO ESTÁ VISÍVEL
// ============================================
function isElementVisible(element) {
  if (!element) return false;

  const style = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();

  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0' &&
    rect.width > 0 &&
    rect.height > 0 &&
    rect.top < window.innerHeight &&
    rect.bottom > 0
  );
}

// ============================================
// ENVIAR LOG PARA BACKGROUND
// ============================================
function sendLog(action, message, data = null) {
  chrome.runtime.sendMessage({
    type: 'SEND_LOG',
    log: {
      action,
      message,
      data,
      url: window.location.href,
      title: document.title,
      timestamp: Date.now()
    }
  }).catch(() => {
    // Background pode não estar pronto
  });
}

// ============================================
// INDICADOR VISUAL DE EXTENSÃO ATIVA
// ============================================
function createIndicator() {
  // Verificar se já existe
  if (document.getElementById('syncads-extension-indicator')) {
    return;
  }

  const indicator = document.createElement('div');
  indicator.id = 'syncads-extension-indicator';
  indicator.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <div style="width: 8px; height: 8px; background: #10b981; border-radius: 50%; animation: pulse 2s infinite;"></div>
      <span>🤖 SyncAds Active</span>
    </div>
  `;

  indicator.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 12px 20px;
    border-radius: 25px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    font-weight: 600;
    z-index: 999999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    transition: all 0.3s ease;
    opacity: 0;
    transform: translateY(20px);
    pointer-events: none;
  `;

  // Adicionar animação de pulso
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `;
  document.head.appendChild(style);

  document.body.appendChild(indicator);

  return indicator;
}

// ============================================
// MOSTRAR/OCULTAR INDICADOR
// ============================================
function showIndicator(duration = 3000) {
  let indicator = document.getElementById('syncads-extension-indicator');

  if (!indicator) {
    indicator = createIndicator();
  }

  // Mostrar com animação
  setTimeout(() => {
    indicator.style.opacity = '1';
    indicator.style.transform = 'translateY(0)';
  }, 10);

  // Ocultar após duração
  if (duration > 0) {
    setTimeout(() => {
      indicator.style.opacity = '0';
      indicator.style.transform = 'translateY(20px)';
    }, duration);
  }
}

// ============================================
// MOSTRAR INDICADOR QUANDO COMANDO É RECEBIDO
// ============================================
chrome.runtime.onMessage.addListener((request) => {
  if (request.type && request.type.startsWith('DOM_')) {
    showIndicator(2000);
  }
});

// ============================================
// NOTIFICAR BACKGROUND QUE CONTENT SCRIPT ESTÁ PRONTO
// ============================================
setTimeout(() => {
  chrome.runtime.sendMessage({
    type: 'CONTENT_SCRIPT_READY',
    url: window.location.href
  }).catch(() => {});
}, 100);

// ============================================
// LOG DE INICIALIZAÇÃO
// ============================================
console.log('✅ SyncAds Content Script Ready');
sendLog('CONTENT_SCRIPT_LOADED', `Content script loaded on ${window.location.hostname}`);
