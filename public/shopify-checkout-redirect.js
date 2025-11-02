// ============================================
// SYNCADS - SHOPIFY CHECKOUT REDIRECT
// Versão: 3.0
// ============================================

(function () {
  "use strict";

  // ============================================
  // CONFIGURAÇÃO
  // ============================================
  const CONFIG = {
    // URL do seu backend SyncAds
    API_URL: "https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1",

    // URL do seu checkout customizado
    CHECKOUT_URL: "https://syncads-dun.vercel.app/checkout",

    // Chave pública do Supabase (anon key)
    SUPABASE_ANON_KEY:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92c2tlcHFnZ214bGZja3hxZ2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA0ODAzNTEsImV4cCI6MjA0NjA1NjM1MX0.wjhZEkX0yQxLEJJhXqDXzN9vEZ-hEQYB5qE7X0HqE_I",

    // Seletores para interceptar
    SELECTORS: {
      // Botões de checkout
      checkoutButtons: [
        'button[name="checkout"]',
        'input[name="checkout"]',
        'a[href*="/checkout"]',
        "[data-shopify-checkout]",
        ".checkout-button",
        ".cart__checkout",
        "#checkout",
      ],

      // Botões de adicionar ao carrinho
      addToCartButtons: [
        'button[name="add"]',
        'input[name="add"]',
        'button[type="submit"][name="add"]',
        "[data-add-to-cart]",
        ".product-form__submit",
        ".add-to-cart",
        ".btn-add-to-cart",
      ],

      // Ícone/botão do carrinho
      cartButtons: [
        'a[href*="/cart"]',
        "[data-cart-drawer]",
        ".cart-link",
        ".header__cart",
        ".cart-icon",
        "#cart-icon",
        "[data-cart]",
      ],
    },

    // Debug mode
    DEBUG: true,
  };

  // ============================================
  // UTILIDADES
  // ============================================
  function log(...args) {
    if (CONFIG.DEBUG) {
      console.log("[SyncAds]", ...args);
    }
  }

  function error(...args) {
    console.error("[SyncAds ERROR]", ...args);
  }

  // ============================================
  // OBTER DADOS DO CARRINHO
  // ============================================
  async function getCartData() {
    try {
      const response = await fetch("/cart.js");
      const cart = await response.json();

      log("📦 Carrinho obtido:", cart);

      return {
        items: cart.items.map((item) => ({
          productId: item.product_id.toString(),
          variantId: item.variant_id.toString(),
          quantity: item.quantity,
          price: (item.price / 100).toFixed(2),
          name: item.title,
          image: item.image,
          sku: item.sku,
        })),
        total: (cart.total_price / 100).toFixed(2),
        subtotal: (cart.items_subtotal_price / 100).toFixed(2),
        currency: cart.currency,
      };
    } catch (err) {
      error("Erro ao obter carrinho:", err);
      throw err;
    }
  }

  // ============================================
  // CRIAR PEDIDO NO SYNCADS
  // ============================================
  async function createOrder(cartData) {
    try {
      log("🔄 Criando pedido no SyncAds...");

      const shopifyDomain = window.Shopify?.shop || window.location.hostname;

      const response = await fetch(`${CONFIG.API_URL}/shopify-create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: CONFIG.SUPABASE_ANON_KEY,
          Authorization: `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          shopifyDomain,
          items: cartData.items,
          total: parseFloat(cartData.total),
          subtotal: parseFloat(cartData.subtotal),
          currency: cartData.currency || "BRL",
          metadata: {
            source: "shopify",
            originalCart: cartData,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      if (!data.orderId) {
        throw new Error("Order ID não retornado");
      }

      log("✅ Pedido criado:", data.orderId);
      return data.orderId;
    } catch (err) {
      error("Erro ao criar pedido:", err);
      throw err;
    }
  }

  // ============================================
  // REDIRECIONAR PARA CHECKOUT CUSTOMIZADO
  // ============================================
  function redirectToCheckout(orderId) {
    const checkoutUrl = `${CONFIG.CHECKOUT_URL}/${orderId}`;
    log("🚀 Redirecionando para:", checkoutUrl);
    window.location.href = checkoutUrl;
  }

  // ============================================
  // PROCESSAR CHECKOUT
  // ============================================
  async function processCheckout(event) {
    try {
      // Prevenir comportamento padrão
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }

      log("🛒 Iniciando checkout...");

      // Obter dados do carrinho
      const cartData = await getCartData();

      if (!cartData.items || cartData.items.length === 0) {
        alert("Seu carrinho está vazio!");
        return;
      }

      // Criar pedido
      const orderId = await createOrder(cartData);

      // Redirecionar
      redirectToCheckout(orderId);
    } catch (err) {
      error("Erro ao processar checkout:", err);
      alert("Erro ao processar checkout. Por favor, tente novamente.");
    }
  }

  // ============================================
  // INTERCEPTAR BOTÕES DE CHECKOUT
  // ============================================
  function interceptCheckoutButtons() {
    const selectors = CONFIG.SELECTORS.checkoutButtons.join(", ");
    const buttons = document.querySelectorAll(selectors);

    log(`🎯 Interceptando ${buttons.length} botões de checkout`);

    buttons.forEach((button) => {
      // Prevenir múltiplos listeners
      if (button.dataset.syncadsIntercepted) return;
      button.dataset.syncadsIntercepted = "true";

      button.addEventListener("click", processCheckout, true);

      // Para forms
      const form = button.closest("form");
      if (form) {
        form.addEventListener("submit", processCheckout, true);
      }
    });
  }

  // ============================================
  // INTERCEPTAR ÍCONE DO CARRINHO
  // ============================================
  function interceptCartButtons() {
    const selectors = CONFIG.SELECTORS.cartButtons.join(", ");
    const buttons = document.querySelectorAll(selectors);

    log(`🛒 Interceptando ${buttons.length} botões de carrinho`);

    buttons.forEach((button) => {
      // Prevenir múltiplos listeners
      if (button.dataset.syncadsCartIntercepted) return;
      button.dataset.syncadsCartIntercepted = "true";

      button.addEventListener(
        "click",
        async (event) => {
          // Verificar se deve ir direto ao checkout
          const goToCheckout =
            button.dataset.cartCheckout === "true" ||
            button.classList.contains("cart-checkout");

          if (goToCheckout) {
            event.preventDefault();
            event.stopPropagation();
            await processCheckout(event);
          } else {
            // Permitir abrir o drawer/página do carrinho normalmente
            log("🛒 Abrindo carrinho (não interceptado)");
          }
        },
        true,
      );
    });
  }

  // ============================================
  // INTERCEPTAR ADICIONAR AO CARRINHO
  // ============================================
  function interceptAddToCart() {
    const selectors = CONFIG.SELECTORS.addToCartButtons.join(", ");
    const buttons = document.querySelectorAll(selectors);

    log(`➕ Interceptando ${buttons.length} botões de adicionar ao carrinho`);

    buttons.forEach((button) => {
      // Prevenir múltiplos listeners
      if (button.dataset.syncadsAddIntercepted) return;
      button.dataset.syncadsAddIntercepted = "true";

      const originalClick = button.onclick;
      button.onclick = null;

      button.addEventListener(
        "click",
        async (event) => {
          log("➕ Produto adicionado ao carrinho");

          // Executar ação original se existir
          if (originalClick) {
            originalClick.call(button, event);
          }

          // Reinterceptar botões de checkout após adicionar
          setTimeout(() => {
            interceptCheckoutButtons();
            interceptCartButtons();
          }, 500);
        },
        false,
      );
    });
  }

  // ============================================
  // OBSERVAR MUDANÇAS NO DOM
  // ============================================
  function observeDOMChanges() {
    const observer = new MutationObserver((mutations) => {
      let shouldReintercept = false;

      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
          shouldReintercept = true;
        }
      });

      if (shouldReintercept) {
        log("🔄 DOM alterado, reinterceptando...");
        setTimeout(() => {
          interceptCheckoutButtons();
          interceptCartButtons();
          interceptAddToCart();
        }, 100);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    log("👀 Observador de DOM iniciado");
  }

  // ============================================
  // INTERCEPTAR AJAX CART (drawer, etc)
  // ============================================
  function interceptAjaxCart() {
    // Interceptar fetch
    const originalFetch = window.fetch;
    window.fetch = function (...args) {
      const url = args[0];

      // Interceptar chamadas de checkout via AJAX
      if (typeof url === "string" && url.includes("/checkout")) {
        log("🚫 Checkout AJAX interceptado");
        return processCheckout().then(() => Promise.reject("Redirected"));
      }

      return originalFetch.apply(this, args);
    };

    // Interceptar XHR
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, url) {
      if (url.includes("/checkout")) {
        log("🚫 Checkout XHR interceptado");
        processCheckout();
        return;
      }
      return originalOpen.apply(this, arguments);
    };
  }

  // ============================================
  // INICIALIZAÇÃO
  // ============================================
  function init() {
    log("🚀 Inicializando SyncAds Checkout Redirect v3.0");
    log("🏪 Loja:", window.Shopify?.shop || window.location.hostname);

    // Interceptar tudo
    interceptCheckoutButtons();
    interceptCartButtons();
    interceptAddToCart();
    interceptAjaxCart();

    // Observar mudanças no DOM
    observeDOMChanges();

    // Reinterceptar periodicamente (fallback)
    setInterval(() => {
      interceptCheckoutButtons();
      interceptCartButtons();
    }, 5000);

    log("✅ SyncAds pronto!");
  }

  // ============================================
  // EXECUTAR
  // ============================================
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Executar também no load (para garantir)
  window.addEventListener("load", () => {
    setTimeout(init, 500);
  });

  // Expor função global para uso manual
  window.SyncAds = {
    processCheckout,
    getCartData,
    config: CONFIG,
    version: "3.0",
  };

  log("📦 SyncAds carregado! Use window.SyncAds para debug.");
})();
