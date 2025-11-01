/**
 * SyncAds Checkout Redirect for Shopify v2.1
 * Intercepta e redireciona para checkout customizado
 */

(function () {
  "use strict";

  const CONFIG = {
    API_URL:
      "https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/shopify-create-order",
    FRONTEND_URL: "https://syncads-dun.vercel.app",
    SHOP_DOMAIN: window.Shopify ? window.Shopify.shop : "",
    DEBUG: true,
    ENABLED: true,
  };

  // Estado global
  const state = {
    processing: false,
    intercepted: new Set(),
  };

  function log(...args) {
    if (CONFIG.DEBUG) console.log("[SyncAds]", ...args);
  }

  function logError(...args) {
    console.error("[SyncAds ERROR]", ...args);
  }

  // Bloquear navegação para checkout Shopify
  function blockShopifyCheckout() {
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (state, title, url) {
      if (url && url.includes("/checkout")) {
        log("🚫 Blocked pushState to checkout");
        return;
      }
      return originalPushState.apply(history, arguments);
    };

    history.replaceState = function (state, title, url) {
      if (url && url.includes("/checkout")) {
        log("🚫 Blocked replaceState to checkout");
        return;
      }
      return originalReplaceState.apply(history, arguments);
    };

    // Bloquear navegação direta
    window.addEventListener("beforeunload", function (e) {
      if (state.processing) {
        e.preventDefault();
        e.returnValue = "";
      }
    });
  }

  // Obter dados do produto
  function getProductData() {
    try {
      // Método 1: JSON no DOM
      const productJson = document.querySelector("[data-product-json]");
      if (productJson) {
        const data = JSON.parse(productJson.textContent);
        log("📦 Product data from DOM JSON:", data);
        return data;
      }

      // Método 2: ShopifyAnalytics
      if (window.ShopifyAnalytics?.meta?.product) {
        const data = window.ShopifyAnalytics.meta.product;
        log("📦 Product data from ShopifyAnalytics:", data);
        return data;
      }

      // Método 3: Meta tags
      const productId = document.querySelector(
        'meta[property="product:id"]',
      )?.content;
      const productTitle = document.querySelector(
        'meta[property="og:title"]',
      )?.content;
      const productPrice = document.querySelector(
        'meta[property="product:price:amount"]',
      )?.content;

      if (productId && productTitle) {
        const data = {
          id: productId,
          title: productTitle,
          price: productPrice,
        };
        log("📦 Product data from meta tags:", data);
        return data;
      }

      // Método 4: window.__PRODUCT__
      if (window.__PRODUCT__) {
        log("📦 Product data from window.__PRODUCT__:", window.__PRODUCT__);
        return window.__PRODUCT__;
      }

      return null;
    } catch (error) {
      logError("Error getting product data:", error);
      return null;
    }
  }

  function getSelectedVariant() {
    try {
      // Método 1: Select
      const select = document.querySelector('select[name="id"]');
      if (select?.value) return select.value;

      // Método 2: Radio
      const radio = document.querySelector('input[name="id"]:checked');
      if (radio?.value) return radio.value;

      // Método 3: Hidden input
      const hidden = document.querySelector('input[name="id"][type="hidden"]');
      if (hidden?.value) return hidden.value;

      // Método 4: Data attribute
      const variantBtn = document.querySelector("[data-variant-id]");
      if (variantBtn) return variantBtn.dataset.variantId;

      return null;
    } catch (error) {
      logError("Error getting variant:", error);
      return null;
    }
  }

  function getQuantity() {
    try {
      const qtyInput = document.querySelector(
        'input[name="quantity"], input[type="number"]',
      );
      return qtyInput ? Math.max(1, parseInt(qtyInput.value) || 1) : 1;
    } catch (error) {
      return 1;
    }
  }

  function showLoading() {
    // Remover loading anterior se existir
    const existing = document.getElementById("syncads-loading");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.id = "syncads-loading";
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    overlay.innerHTML = `
      <div style="text-align: center;">
        <div style="
          border: 5px solid #f3f3f3;
          border-top: 5px solid #667eea;
          border-radius: 50%;
          width: 60px;
          height: 60px;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        "></div>
        <p style="color: white; font-size: 18px; font-weight: 600; margin: 0;">
          Redirecionando para o checkout...
        </p>
        <p style="color: #ccc; font-size: 14px; margin: 10px 0 0;">
          Por favor, aguarde
        </p>
      </div>
    `;

    const style = document.createElement("style");
    style.textContent =
      "@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }";
    document.head.appendChild(style);

    document.body.appendChild(overlay);
  }

  function showError(errorMessage) {
    const overlay = document.getElementById("syncads-loading");
    if (!overlay) return;

    overlay.innerHTML = `
      <div style="text-align: center; max-width: 400px; padding: 20px;">
        <div style="font-size: 48px; margin-bottom: 20px;">❌</div>
        <p style="color: white; font-size: 18px; font-weight: 600; margin: 0 0 10px;">
          Erro ao processar compra
        </p>
        <p style="color: #ccc; font-size: 14px; margin: 0 0 20px; line-height: 1.5;">
          ${errorMessage}
        </p>
        <button id="syncads-retry-btn"
          style="
            background: #667eea;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            margin-right: 10px;
          ">
          Tentar novamente
        </button>
        <button id="syncads-close-btn"
          style="
            background: #e53e3e;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
          ">
          Fechar
        </button>
      </div>
    `;

    // Adicionar event listeners aos botões
    document
      .getElementById("syncads-retry-btn")
      ?.addEventListener("click", () => {
        overlay.remove();
        state.processing = false;
        window.location.reload();
      });

    document
      .getElementById("syncads-close-btn")
      ?.addEventListener("click", () => {
        overlay.remove();
        state.processing = false;
      });
  }

  function hideLoading() {
    const overlay = document.getElementById("syncads-loading");
    if (overlay) overlay.remove();
  }

  async function createOrder(productData) {
    try {
      log("📤 Creating order...", productData);

      const response = await fetch(CONFIG.API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shopDomain: CONFIG.SHOP_DOMAIN,
          products: [productData],
          customer: {
            email: null,
            firstName: null,
            lastName: null,
            phone: null,
          },
          metadata: {
            source: "shopify_product_page",
            userAgent: navigator.userAgent,
            referrer: document.referrer,
            timestamp: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logError("HTTP Error:", response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to create order");
      }

      log("✅ Order created successfully:", result);
      return result;
    } catch (error) {
      logError("❌ Failed to create order:", error);
      throw error;
    }
  }

  async function handlePurchase(event) {
    // SEMPRE prevenir comportamento padrão PRIMEIRO
    if (event) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }

    if (!CONFIG.ENABLED) {
      log("⚠️ SyncAds checkout disabled");
      return false;
    }

    if (state.processing) {
      log("⏳ Already processing, ignoring duplicate click");
      return false;
    }

    state.processing = true;
    log("🚀 Purchase flow started");
    showLoading();

    try {
      log("🔍 Getting product data...");

      const product = getProductData();
      if (!product) {
        throw new Error(
          "Produto não encontrado. Por favor, recarregue a página.",
        );
      }

      const variantId = getSelectedVariant();
      const quantity = getQuantity();

      let variant = null;
      if (product.variants && variantId) {
        variant = product.variants.find(
          (v) => String(v.id) === String(variantId),
        );
      }

      if (!variant && product.variants && product.variants.length > 0) {
        variant = product.variants[0];
      }

      // Calcular preço (converter de centavos se necessário)
      let price = 0;
      if (variant) {
        price = variant.price > 1000 ? variant.price / 100 : variant.price;
      } else if (product.price) {
        price = product.price > 1000 ? product.price / 100 : product.price;
      }

      const productData = {
        productId: String(product.id || ""),
        variantId: variant
          ? String(variant.id)
          : variantId
            ? String(variantId)
            : null,
        name: variant ? `${product.title} - ${variant.title}` : product.title,
        price: price,
        quantity: quantity,
        image:
          product.featured_image ||
          product.image ||
          (product.images && product.images[0]) ||
          "",
        sku: variant?.sku || "",
      };

      log("📦 Product data prepared:", productData);

      const result = await createOrder(productData);

      if (result.checkoutUrl) {
        log("✅ Order created! Redirecting to:", result.checkoutUrl);

        // Redirecionar imediatamente
        window.location.href = result.checkoutUrl;

        // Manter loading até redirecionar
        return false;
      } else {
        throw new Error("URL do checkout não foi recebida");
      }
    } catch (error) {
      logError("❌ Purchase error:", error);

      const errorMsg = error.message || "Erro desconhecido. Tente novamente.";
      showError(errorMsg);

      // NÃO resetar state.processing aqui para prevenir submit duplo
    }

    // SEMPRE retornar false para prevenir submit
    return false;
  }

  function interceptButton(button) {
    if (!button || state.intercepted.has(button)) return;

    log("🎯 Intercepting button:", button.outerHTML.substring(0, 100));
    state.intercepted.add(button);

    // Adicionar múltiplos listeners com capture=true (fase de captura)
    button.addEventListener("click", handlePurchase, true);
    button.addEventListener("mousedown", handlePurchase, true);
    button.addEventListener("touchstart", handlePurchase, true);

    // Se o botão estiver dentro de um form, interceptar o form também
    const form = button.closest("form");
    if (form && !form.dataset.syncadsIntercepted) {
      form.dataset.syncadsIntercepted = "true";
      form.addEventListener("submit", handlePurchase, true);
      log("📝 Also intercepted parent form");
    }

    return button;
  }

  function interceptAllButtons() {
    const selectors = [
      'button[name="add"]',
      'button[type="submit"][name="add"]',
      'input[type="submit"][name="add"]',
      "button.product-form__submit",
      'button[data-action="add-to-cart"]',
      ".btn-add-to-cart",
      "[data-add-to-cart]",
      'form[action*="/cart/add"] button[type="submit"]',
      'form[action*="/cart/add"] input[type="submit"]',
      ".shopify-payment-button button",
      "button.shopify-payment-button__button",
      "[data-shopify-payment-button]",
      '.product-form button[type="submit"]',
      'button:has-text("Add to cart")',
      'button:has-text("Adicionar")',
    ];

    let count = 0;
    selectors.forEach((selector) => {
      try {
        const buttons = document.querySelectorAll(selector);
        buttons.forEach((button) => {
          interceptButton(button);
          count++;
        });
      } catch (e) {
        // Ignorar erros de seletores inválidos
      }
    });

    log(`🎯 Intercepted ${count} buttons`);
    return count;
  }

  function interceptForms() {
    const forms = document.querySelectorAll('form[action*="/cart/add"]');
    forms.forEach((form) => {
      if (form.dataset.syncadsIntercepted) return;
      form.dataset.syncadsIntercepted = "true";

      form.addEventListener("submit", handlePurchase, true);
      log("📝 Intercepted form:", form);
    });
  }

  function init() {
    if (!window.Shopify) {
      log("⚠️ Not a Shopify store");
      return;
    }

    log("=".repeat(60));
    log("🔥 SyncAds Checkout Redirect v2.1 Initialized");
    log("🏪 Shop:", CONFIG.SHOP_DOMAIN);
    log("🌐 Frontend:", CONFIG.FRONTEND_URL);
    log("🔗 API:", CONFIG.API_URL);
    log("=".repeat(60));

    blockShopifyCheckout();

    const buttonCount = interceptAllButtons();
    interceptForms();

    if (buttonCount === 0) {
      log("⚠️ No buttons found on first scan, will retry...");
    }

    // Observar mudanças no DOM
    const observer = new MutationObserver((mutations) => {
      let shouldReintercept = false;

      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) {
              // Element node
              shouldReintercept = true;
            }
          });
        }
      });

      if (shouldReintercept) {
        interceptAllButtons();
        interceptForms();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Re-interceptar periodicamente (fallback)
    setInterval(() => {
      interceptAllButtons();
      interceptForms();
    }, 2000);

    log("✅ Ready to intercept purchases!");
  }

  // Aguardar DOM
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Expor controles globais (debug)
  window.SyncAdsCheckout = {
    version: "2.1",
    config: CONFIG,
    state: state,
    enable: () => {
      CONFIG.ENABLED = true;
      log("✅ Enabled");
    },
    disable: () => {
      CONFIG.ENABLED = false;
      log("❌ Disabled");
    },
    reintercept: () => {
      const count = interceptAllButtons();
      interceptForms();
      log(`🔄 Reintercepted ${count} buttons`);
    },
    getProduct: getProductData,
    test: () => {
      log("🧪 Testing purchase flow...");
      handlePurchase(null);
    },
    reset: () => {
      state.processing = false;
      hideLoading();
      log("🔄 State reset");
    },
  };
})();
