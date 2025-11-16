// ============================================
// SYNCADS EXTENSION - CONTENT SCRIPT
// Manipulação do DOM e automação de ações
// ============================================

console.log("🎯 SyncAds Content Script Loaded");
console.log("🌐 URL atual:", window.location.href);
console.log("📍 Hostname:", window.location.hostname);

// ============================================
// ESTADO DO CONTENT SCRIPT
// ============================================
let scriptState = {
  isActive: false,
  commandsProcessed: 0,
  lastActivity: null,
};

// ============================================
// LISTENER DE MENSAGENS DO BACKGROUND
// ============================================
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("📨 Content script received:", request.type);

  scriptState.isActive = true;
  scriptState.lastActivity = Date.now();

  // Processar comando baseado no tipo
  switch (request.type) {
    case "CHECK_AUTH":
      // Verificar auth e responder
      checkAuthState();
      sendResponse({ success: true, message: "Verificação iniciada" });
      break;

    case "DOM_READ":
      handleDOMRead(request, sendResponse);
      break;

    case "DOM_CLICK":
      handleDOMClick(request, sendResponse);
      break;

    case "DOM_FILL":
      handleDOMFill(request, sendResponse);
      break;

    case "DOM_WAIT":
      handleDOMWait(request, sendResponse);
      break;

    case "DOM_EXTRACT":
      handleDOMExtract(request, sendResponse);
      break;

    case "DOM_SCROLL":
      handleDOMScroll(request, sendResponse);
      break;

    default:
      sendResponse({
        success: false,
        error: `Unknown command type: ${request.type}`,
      });
  }

  return true;
});

// ============================================
// LER ELEMENTO DO DOM
// ============================================
function handleDOMRead(request, sendResponse) {
  try {
    const { selector, all = false, attribute = null } = request;

    if (all) {
      // Selecionar múltiplos elementos
      const elements = document.querySelectorAll(selector);

      if (!elements || elements.length === 0) {
        sendResponse({
          success: false,
          error: `No elements found: ${selector}`,
        });
        return;
      }

      const data = Array.from(elements).map((el) =>
        extractElementData(el, attribute),
      );

      sendResponse({
        success: true,
        data,
        count: elements.length,
      });
    } else {
      // Selecionar um elemento
      const element = document.querySelector(selector);

      if (!element) {
        sendResponse({
          success: false,
          error: `Element not found: ${selector}`,
        });
        return;
      }

      const data = extractElementData(element, attribute);

      sendResponse({
        success: true,
        data,
      });
    }

    sendLog("DOM_READ", `Read element(s): ${selector}`);
  } catch (error) {
    sendResponse({
      success: false,
      error: error.message,
    });
  }
}

// ============================================
// EXTRAIR DADOS DO ELEMENTO
// ============================================
function extractElementData(element, requestedAttribute = null) {
  const data = {
    text: element.textContent?.trim() || "",
    innerText: element.innerText?.trim() || "",
    html: element.innerHTML,
    outerHTML: element.outerHTML,
    tagName: element.tagName.toLowerCase(),
    id: element.id,
    className: element.className,
    value: element.value || null,
    href: element.href || null,
    src: element.src || null,
    classes: Array.from(element.classList),
    bounds: element.getBoundingClientRect(),
    visible: isElementVisible(element),
    enabled: !element.disabled,
  };

  // Capturar todos os atributos
  Array.from(element.attributes).forEach((attr) => {
    data.attributes[attr.name] = attr.value;
  });

  if (requestedAttribute) {
    return element.getAttribute(requestedAttribute);
  }

  return data;
}

// ============================================
// CLICAR EM ELEMENTO
// ============================================
function handleDOMClick(request, sendResponse) {
  try {
    const { selector, smooth = true, waitAfter = 500 } = request;
    const element = document.querySelector(selector);

    if (!element) {
      sendResponse({
        success: false,
        error: `Element not found: ${selector}`,
      });
      return;
    }

    // Scroll suave até elemento
    element.scrollIntoView({
      behavior: smooth ? "smooth" : "instant",
      block: "center",
      inline: "center",
    });

    // Aguardar scroll completar
    setTimeout(() => {
      // Destacar elemento temporariamente
      const originalBorder = element.style.border;
      const originalBackground = element.style.backgroundColor;

      element.style.border = "3px solid #667eea";
      element.style.backgroundColor = "rgba(102, 126, 234, 0.1)";

      setTimeout(() => {
        // Simular hover
        const hoverEvent = new MouseEvent("mouseover", {
          view: window,
          bubbles: true,
          cancelable: true,
        });
        element.dispatchEvent(hoverEvent);

        setTimeout(() => {
          // Simular clique completo
          const mousedownEvent = new MouseEvent("mousedown", {
            view: window,
            bubbles: true,
            cancelable: true,
          });
          element.dispatchEvent(mousedownEvent);

          setTimeout(() => {
            const clickEvent = new MouseEvent("click", {
              view: window,
              bubbles: true,
              cancelable: true,
            });
            element.dispatchEvent(clickEvent);
            element.click(); // Click nativo também

            const mouseupEvent = new MouseEvent("mouseup", {
              view: window,
              bubbles: true,
              cancelable: true,
            });
            element.dispatchEvent(mouseupEvent);

            // Restaurar estilo
            setTimeout(() => {
              element.style.border = originalBorder;
              element.style.backgroundColor = originalBackground;

              sendResponse({
                success: true,
                message: `Clicked element: ${selector}`,
                elementText: element.textContent?.trim(),
              });

              sendLog("DOM_CLICK", `Clicked: ${selector}`);
            }, waitAfter);
          }, 50);
        }, 100);
      }, 200);
    }, 300);
  } catch (error) {
    sendResponse({
      success: false,
      error: error.message,
    });
  }
}

// ============================================
// PREENCHER CAMPO
// ============================================
function handleDOMFill(request, sendResponse) {
  try {
    const { selector, value, clear = true, typeSpeed = "normal" } = request;
    const element = document.querySelector(selector);

    if (!element) {
      sendResponse({
        success: false,
        error: `Element not found: ${selector}`,
      });
      return;
    }

    // Scroll até elemento
    element.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    setTimeout(() => {
      // Focar elemento
      element.focus();

      // Destacar elemento
      const originalBorder = element.style.border;
      element.style.border = "2px solid #10b981";

      setTimeout(() => {
        // Limpar se necessário
        if (clear) {
          element.value = "";
          element.dispatchEvent(new Event("input", { bubbles: true }));
        }

        // Simular digitação humana
        const currentValue = element.value;
        const chars = value.split("");

        // Velocidades de digitação
        const speeds = {
          fast: { min: 30, max: 60 },
          normal: { min: 50, max: 150 },
          slow: { min: 100, max: 250 },
        };

        const speed = speeds[typeSpeed] || speeds.normal;
        let typedValue = currentValue;

        const typeChar = () => {
          if (chars.length === 0) {
            // Finalizar digitação
            element.dispatchEvent(new Event("input", { bubbles: true }));
            element.dispatchEvent(new Event("change", { bubbles: true }));
            element.blur();

            // Restaurar borda
            element.style.border = originalBorder;

            sendResponse({
              success: true,
              message: `Filled element: ${selector}`,
              value: typedValue,
            });

            sendLog("DOM_FILL", `Filled: ${selector} with "${value}"`);
            return;
          }

          const char = chars.shift();
          typedValue += char;
          element.value = typedValue;

          // Disparar eventos
          element.dispatchEvent(
            new InputEvent("input", {
              bubbles: true,
              cancelable: true,
              data: char,
              inputType: "insertText",
            }),
          );

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
      error: error.message,
    });
  }
}

// ============================================
// AGUARDAR ELEMENTO
// ============================================
function handleDOMWait(request, sendResponse) {
  const { selector, timeout = 10000 } = request;
  const startTime = Date.now();

  const checkElement = setInterval(() => {
    const element = document.querySelector(selector);

    if (element) {
      clearInterval(checkElement);
      sendResponse({
        success: true,
        message: `Element found: ${selector}`,
        waitTime: Date.now() - startTime,
      });
      return;
    }

    const elapsed = Date.now() - startTime;
    if (elapsed >= timeout) {
      clearInterval(checkElement);
      sendResponse({
        success: false,
        error: `Element not found after ${timeout}ms: ${selector}`,
        waitTime: elapsed,
      });
      return;
    }
  }, 100);
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
          html: element.innerHTML,
        };
      } else {
        data[key] = null;
      }
    }

    sendResponse({
      success: true,
      data,
    });

    sendLog("DOM_EXTRACT", "Extracted structured data");
  } catch (error) {
    sendResponse({
      success: false,
      error: error.message,
    });
  }
}

// ============================================
// SCROLL DA PÁGINA
// ============================================
function handleDOMScroll(request, sendResponse) {
  try {
    const { direction = "down", amount = 500, smooth = true } = request;

    let scrollOptions = {
      behavior: smooth ? "smooth" : "instant",
    };

    if (direction === "down") {
      window.scrollBy({ top: amount, ...scrollOptions });
    } else if (direction === "up") {
      window.scrollBy({ top: -amount, ...scrollOptions });
    } else if (direction === "top") {
      window.scrollTo({ top: 0, ...scrollOptions });
    } else if (direction === "bottom") {
      window.scrollTo({ top: document.body.scrollHeight, ...scrollOptions });
    }

    setTimeout(
      () => {
        sendResponse({
          success: true,
          message: `Scrolled ${direction}`,
          scrollPosition: window.scrollY,
        });
      },
      smooth ? 500 : 0,
    );
  } catch (error) {
    sendResponse({
      success: false,
      error: error.message,
    });
  }
}

// ============================================
// VERIFICAR SE ELEMENTO ESTÁ VISÍVEL
// ============================================
function isElementVisible(element) {
  const style = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();

  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    style.opacity !== "0" &&
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
  chrome.runtime
    .sendMessage({
      type: "SEND_LOG",
      log: {
        action,
        message,
        data,
        url: window.location.href,
        title: document.title,
        timestamp: Date.now(),
      },
    })
    .catch(() => {
      // Background pode não estar pronto
    });
}

// ============================================
// CRIAR INDICADOR VISUAL
// ============================================
function createIndicator() {
  // Verificar se já existe
  if (document.getElementById("syncads-extension-indicator")) {
    return;
  }

  const indicator = document.createElement("div");
  indicator.id = "syncads-extension-indicator";
  indicator.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <div style="width: 8px; height: 8px; background: #10b981; border-radius: 50%; animation: pulse 2s infinite;"></div>
      <span style="font-size: 13px; font-weight: 600;">SyncAds AI</span>
    </div>
  `;
  indicator.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: rgba(15, 23, 42, 0.95);
    backdrop-filter: blur(10px);
    color: white;
    padding: 12px 16px;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.3s ease;
    border: 1px solid rgba(102, 126, 234, 0.3);
  `;

  // Adicionar animação de pulso
  const style = document.createElement("style");
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
  let indicator = document.getElementById("syncads-extension-indicator");

  if (!indicator) {
    indicator = createIndicator();
  }

  // Mostrar com animação
  setTimeout(() => {
    indicator.style.opacity = "1";
    indicator.style.transform = "translateY(0)";
  }, 10);

  // Ocultar após duração
  if (duration > 0) {
    setTimeout(() => {
      indicator.style.opacity = "0";
      indicator.style.transform = "translateY(20px)";
    }, duration);
  }
}

// ============================================
// MOSTRAR INDICADOR QUANDO COMANDO É RECEBIDO
// ============================================
chrome.runtime.onMessage.addListener((request) => {
  if (request.type && request.type.startsWith("DOM_")) {
    showIndicator(2000);
  }
});

// ============================================
// MONITORAR LOGIN EM TEMPO REAL
// ============================================
let lastAuthState = null;

// Verificar auth periodicamente
function checkAuthState() {
  try {
    const keys = Object.keys(localStorage);

    // Buscar qualquer chave que possa conter auth
    for (const key of keys) {
      try {
        const value = localStorage.getItem(key);
        if (!value) continue;

        // Tentar parsear como JSON
        const parsed = JSON.parse(value);
        const user = parsed?.user || parsed?.currentUser;

        if (user && user.id) {
          const currentState = JSON.stringify(user.id);

          // Apenas notificar se mudou
          if (currentState !== lastAuthState) {
            console.log("🔐 Login detectado:", user.id);

            chrome.runtime
              .sendMessage({
                type: "AUTO_LOGIN_DETECTED",
                userId: user.id,
                email: user.email || "",
                source: "localStorage-monitor",
              })
              .catch(() => {});

            lastAuthState = currentState;
            break;
          }
        }
      } catch (e) {
        // Não é JSON ou erro ao parsear, continuar
        continue;
      }
    }
  } catch (error) {
    console.error("❌ Erro ao verificar auth:", error);
  }
}

// Verificar a cada 2 segundos
console.log("⏱️ Iniciando monitoramento de auth (intervalo: 2s)");
console.log("📦 localStorage disponível?", typeof localStorage !== "undefined");
console.log(
  "🔢 Total de chaves no localStorage:",
  Object.keys(localStorage).length,
);

// Mostrar todas as chaves IMEDIATAMENTE
try {
  const allKeys = Object.keys(localStorage);
  console.log("🗝️ TODAS AS CHAVES DO LOCALSTORAGE:", allKeys);
  allKeys.forEach((key) => {
    const val = localStorage.getItem(key);
    if (val && val.length < 100) {
      console.log(`  - ${key}: ${val}`);
    } else if (val) {
      console.log(`  - ${key}: [${val.length} chars]`);
    }
  });
} catch (e) {
  console.error("❌ Erro ao ler localStorage:", e);
}

setInterval(checkAuthState, 2000);

// Verificar imediatamente também
console.log("🚀 Verificação inicial de auth...");
checkAuthState();

// ============================================
// NOTIFICAR BACKGROUND QUE CONTENT SCRIPT ESTÁ PRONTO
// ============================================
setTimeout(() => {
  chrome.runtime
    .sendMessage({
      type: "CONTENT_SCRIPT_READY",
      url: window.location.href,
    })
    .catch(() => {});
}, 100);

// ============================================
// LOG DE INICIALIZAÇÃO
// ============================================
console.log("✅ SyncAds Content Script Ready");
sendLog(
  "CONTENT_SCRIPT_LOADED",
  `Content script loaded on ${window.location.hostname}`,
);
