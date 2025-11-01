/**
 * SyncAds Cart Drawer for Shopify v3.0
 * Carrinho lateral customizado antes do checkout
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

  // Estado do carrinho
  const cart = {
    items: [],
    isOpen: false,
    processing: false,
  };

  function log(...args) {
    if (CONFIG.DEBUG) console.log("[SyncAds]", ...args);
  }

  function logError(...args) {
    console.error("[SyncAds ERROR]", ...args);
  }

  // ==========================================
  // FUNÇÕES DE CARRINHO
  // ==========================================

  function addToCart(product) {
    const existingItem = cart.items.find(
      (item) => item.variantId === product.variantId,
    );

    if (existingItem) {
      existingItem.quantity += product.quantity;
    } else {
      cart.items.push({ ...product });
    }

    updateCartUI();
    openCart();
    saveCartToStorage();
    log("✅ Produto adicionado ao carrinho:", product);
  }

  function updateQuantity(variantId, newQuantity) {
    const item = cart.items.find((i) => i.variantId === variantId);
    if (!item) return;

    if (newQuantity <= 0) {
      removeFromCart(variantId);
    } else {
      item.quantity = newQuantity;
      updateCartUI();
      saveCartToStorage();
    }
  }

  function removeFromCart(variantId) {
    cart.items = cart.items.filter((i) => i.variantId !== variantId);
    updateCartUI();
    saveCartToStorage();

    if (cart.items.length === 0) {
      closeCart();
    }
  }

  function clearCart() {
    cart.items = [];
    updateCartUI();
    saveCartToStorage();
    closeCart();
  }

  function getCartTotal() {
    return cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
  }

  function getCartCount() {
    return cart.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  function saveCartToStorage() {
    try {
      localStorage.setItem("syncads_cart", JSON.stringify(cart.items));
    } catch (e) {
      logError("Erro ao salvar carrinho:", e);
    }
  }

  function loadCartFromStorage() {
    try {
      const saved = localStorage.getItem("syncads_cart");
      if (saved) {
        cart.items = JSON.parse(saved);
        updateCartUI();
      }
    } catch (e) {
      logError("Erro ao carregar carrinho:", e);
    }
  }

  // ==========================================
  // CRIAÇÃO DO CARRINHO UI
  // ==========================================

  function createCartDrawer() {
    const drawer = document.createElement("div");
    drawer.id = "syncads-cart-drawer";
    drawer.style.cssText = `
      position: fixed;
      top: 0;
      right: -100%;
      width: 100%;
      max-width: 450px;
      height: 100vh;
      background: white;
      box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
      z-index: 999999;
      transition: right 0.3s ease-in-out;
      display: flex;
      flex-direction: column;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    drawer.innerHTML = `
      <!-- Header -->
      <div style="
        padding: 20px 24px;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: #667eea;
        color: white;
      ">
        <div style="display: flex; align-items: center; gap: 10px;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="9" cy="21" r="1"/>
            <circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          <h2 style="margin: 0; font-size: 20px; font-weight: 700;">
            Seu Carrinho
          </h2>
        </div>
        <button id="syncads-close-cart" style="
          background: transparent;
          border: none;
          color: white;
          cursor: pointer;
          padding: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          transition: background 0.2s;
        " onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='transparent'">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <!-- Items List -->
      <div id="syncads-cart-items" style="
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        background: #f9fafb;
      ">
        <!-- Items serão inseridos aqui -->
      </div>

      <!-- Footer -->
      <div style="
        padding: 20px 24px;
        border-top: 2px solid #e5e7eb;
        background: white;
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <span style="font-size: 16px; font-weight: 600; color: #374151;">Subtotal:</span>
          <span id="syncads-cart-total" style="font-size: 24px; font-weight: 700; color: #667eea;">
            R$ 0,00
          </span>
        </div>
        <button id="syncads-checkout-btn" style="
          width: 100%;
          padding: 16px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(102, 126, 234, 0.5)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(102, 126, 234, 0.4)'">
          Finalizar Compra
        </button>
        <p style="
          margin-top: 12px;
          text-align: center;
          font-size: 12px;
          color: #6b7280;
        ">
          Checkout seguro via SyncAds
        </p>
      </div>
    `;

    document.body.appendChild(drawer);

    // Criar overlay
    const overlay = document.createElement("div");
    overlay.id = "syncads-cart-overlay";
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100vh;
      background: rgba(0, 0, 0, 0.5);
      z-index: 999998;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.3s, visibility 0.3s;
      backdrop-filter: blur(2px);
    `;
    document.body.appendChild(overlay);

    // Event listeners
    document
      .getElementById("syncads-close-cart")
      .addEventListener("click", closeCart);
    overlay.addEventListener("click", closeCart);
    document
      .getElementById("syncads-checkout-btn")
      .addEventListener("click", proceedToCheckout);

    // Estilos globais
    const style = document.createElement("style");
    style.textContent = `
      #syncads-cart-drawer::-webkit-scrollbar {
        width: 8px;
      }
      #syncads-cart-drawer::-webkit-scrollbar-track {
        background: #f1f1f1;
      }
      #syncads-cart-drawer::-webkit-scrollbar-thumb {
        background: #667eea;
        border-radius: 4px;
      }
      #syncads-cart-items::-webkit-scrollbar {
        width: 6px;
      }
      #syncads-cart-items::-webkit-scrollbar-track {
        background: transparent;
      }
      #syncads-cart-items::-webkit-scrollbar-thumb {
        background: #d1d5db;
        border-radius: 3px;
      }
    `;
    document.head.appendChild(style);
  }

  function updateCartUI() {
    const itemsContainer = document.getElementById("syncads-cart-items");
    const totalElement = document.getElementById("syncads-cart-total");
    const checkoutBtn = document.getElementById("syncads-checkout-btn");

    if (!itemsContainer) return;

    if (cart.items.length === 0) {
      itemsContainer.innerHTML = `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          text-align: center;
          padding: 40px 20px;
        ">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5" style="margin-bottom: 16px;">
            <circle cx="9" cy="21" r="1"/>
            <circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          <h3 style="margin: 0 0 8px; font-size: 18px; font-weight: 600; color: #374151;">
            Carrinho Vazio
          </h3>
          <p style="margin: 0; font-size: 14px; color: #6b7280;">
            Adicione produtos para começar
          </p>
        </div>
      `;
      if (checkoutBtn) checkoutBtn.disabled = true;
      if (totalElement) totalElement.textContent = "R$ 0,00";
      return;
    }

    if (checkoutBtn) checkoutBtn.disabled = false;

    itemsContainer.innerHTML = cart.items
      .map(
        (item) => `
      <div style="
        background: white;
        border-radius: 12px;
        padding: 12px;
        margin-bottom: 12px;
        display: flex;
        gap: 12px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        transition: box-shadow 0.2s;
      " onmouseover="this.style.boxShadow='0 4px 8px rgba(0, 0, 0, 0.15)'" onmouseout="this.style.boxShadow='0 1px 3px rgba(0, 0, 0, 0.1)'">
        <!-- Imagem -->
        <div style="
          width: 80px;
          height: 80px;
          border-radius: 8px;
          overflow: hidden;
          flex-shrink: 0;
          background: #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          ${
            item.image
              ? `<img src="${item.image}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover;">`
              : `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2">
                   <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                   <circle cx="8.5" cy="8.5" r="1.5"/>
                   <polyline points="21 15 16 10 5 21"/>
                 </svg>`
          }
        </div>

        <!-- Info -->
        <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <h4 style="margin: 0 0 4px; font-size: 14px; font-weight: 600; color: #1f2937; line-height: 1.3;">
              ${item.name}
            </h4>
            ${
              item.sku
                ? `<p style="margin: 0; font-size: 12px; color: #6b7280;">SKU: ${item.sku}</p>`
                : ""
            }
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 8px;">
            <!-- Quantidade -->
            <div style="display: flex; align-items: center; gap: 8px; background: #f3f4f6; border-radius: 8px; padding: 4px;">
              <button onclick="window.SyncAdsCart.updateQuantity('${item.variantId}', ${item.quantity - 1})" style="
                width: 28px;
                height: 28px;
                border: none;
                background: white;
                color: #667eea;
                border-radius: 6px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
                font-weight: 700;
                transition: background 0.2s;
              " onmouseover="this.style.background='#667eea'; this.style.color='white'" onmouseout="this.style.background='white'; this.style.color='#667eea'">
                −
              </button>
              <span style="
                min-width: 24px;
                text-align: center;
                font-size: 14px;
                font-weight: 600;
                color: #1f2937;
              ">${item.quantity}</span>
              <button onclick="window.SyncAdsCart.updateQuantity('${item.variantId}', ${item.quantity + 1})" style="
                width: 28px;
                height: 28px;
                border: none;
                background: white;
                color: #667eea;
                border-radius: 6px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
                font-weight: 700;
                transition: background 0.2s;
              " onmouseover="this.style.background='#667eea'; this.style.color='white'" onmouseout="this.style.background='white'; this.style.color='#667eea'">
                +
              </button>
            </div>

            <!-- Preço e Remover -->
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="font-size: 16px; font-weight: 700; color: #667eea;">
                R$ ${(item.price * item.quantity).toFixed(2)}
              </span>
              <button onclick="window.SyncAdsCart.removeFromCart('${item.variantId}')" style="
                width: 32px;
                height: 32px;
                border: none;
                background: #fee2e2;
                color: #dc2626;
                border-radius: 6px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.2s;
              " onmouseover="this.style.background='#fecaca'" onmouseout="this.style.background='#fee2e2'">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    `,
      )
      .join("");

    if (totalElement) {
      totalElement.textContent = `R$ ${getCartTotal().toFixed(2)}`;
    }
  }

  function openCart() {
    const drawer = document.getElementById("syncads-cart-drawer");
    const overlay = document.getElementById("syncads-cart-overlay");

    if (drawer && overlay) {
      cart.isOpen = true;
      drawer.style.right = "0";
      overlay.style.opacity = "1";
      overlay.style.visibility = "visible";
      document.body.style.overflow = "hidden";
    }
  }

  function closeCart() {
    const drawer = document.getElementById("syncads-cart-drawer");
    const overlay = document.getElementById("syncads-cart-overlay");

    if (drawer && overlay) {
      cart.isOpen = false;
      drawer.style.right = "-100%";
      overlay.style.opacity = "0";
      overlay.style.visibility = "hidden";
      document.body.style.overflow = "";
    }
  }

  // ==========================================
  // CHECKOUT
  // ==========================================

  function showLoading() {
    const btn = document.getElementById("syncads-checkout-btn");
    if (!btn) return;

    btn.disabled = true;
    btn.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
        <div style="
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top: 3px solid white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          animation: spin 1s linear infinite;
        "></div>
        <span>Processando...</span>
      </div>
    `;

    const style = document.createElement("style");
    style.id = "syncads-spinner-style";
    style.textContent =
      "@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }";
    if (!document.getElementById("syncads-spinner-style")) {
      document.head.appendChild(style);
    }
  }

  function hideLoading() {
    const btn = document.getElementById("syncads-checkout-btn");
    if (!btn) return;

    btn.disabled = false;
    btn.innerHTML = "Finalizar Compra";
  }

  async function proceedToCheckout() {
    if (cart.processing || cart.items.length === 0) return;

    cart.processing = true;
    showLoading();

    try {
      log("🚀 Criando pedido com", cart.items.length, "itens");

      const response = await fetch(CONFIG.API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shopDomain: CONFIG.SHOP_DOMAIN,
          products: cart.items,
          customer: {
            email: null,
            firstName: null,
            lastName: null,
            phone: null,
          },
          metadata: {
            source: "shopify_cart",
            userAgent: navigator.userAgent,
            referrer: document.referrer,
            timestamp: new Date().toISOString(),
            cartTotal: getCartTotal(),
            itemsCount: getCartCount(),
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Falha ao criar pedido");
      }

      log("✅ Pedido criado! Redirecionando:", result.checkoutUrl);

      // Limpar carrinho e redirecionar
      clearCart();
      window.location.href = result.checkoutUrl;
    } catch (error) {
      logError("❌ Erro no checkout:", error);
      hideLoading();
      cart.processing = false;

      alert(
        `Erro ao processar checkout:\n${error.message}\n\nPor favor, tente novamente.`,
      );
    }
  }

  // ==========================================
  // OBTER DADOS DO PRODUTO
  // ==========================================

  function getProductData() {
    try {
      // Método 1: JSON no DOM
      const productJson = document.querySelector("[data-product-json]");
      if (productJson) {
        return JSON.parse(productJson.textContent);
      }

      // Método 2: ShopifyAnalytics
      if (window.ShopifyAnalytics?.meta?.product) {
        return window.ShopifyAnalytics.meta.product;
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
        return {
          id: productId,
          title: productTitle,
          price: productPrice,
        };
      }

      return null;
    } catch (error) {
      logError("Erro ao obter dados do produto:", error);
      return null;
    }
  }

  function getSelectedVariant() {
    try {
      const select = document.querySelector('select[name="id"]');
      if (select?.value) return select.value;

      const radio = document.querySelector('input[name="id"]:checked');
      if (radio?.value) return radio.value;

      const hidden = document.querySelector('input[name="id"][type="hidden"]');
      if (hidden?.value) return hidden.value;

      return null;
    } catch (error) {
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

  // ==========================================
  // INTERCEPTAÇÃO
  // ==========================================

  function handleAddToCart(event) {
    if (!CONFIG.ENABLED) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    log("🛒 Adicionando ao carrinho...");

    const product = getProductData();
    if (!product) {
      alert("Erro: Produto não encontrado. Recarregue a página.");
      return false;
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
          : String(product.id),
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

    addToCart(productData);

    return false;
  }

  function interceptButtons() {
    const selectors = [
      'button[name="add"]',
      'button[type="submit"][name="add"]',
      'input[type="submit"][name="add"]',
      "button.product-form__submit",
      'button[data-action="add-to-cart"]',
      ".btn-add-to-cart",
      "[data-add-to-cart]",
      'form[action*="/cart/add"] button[type="submit"]',
    ];

    let count = 0;
    selectors.forEach((selector) => {
      try {
        const buttons = document.querySelectorAll(selector);
        buttons.forEach((button) => {
          if (button.dataset.syncadsIntercepted) return;
          button.dataset.syncadsIntercepted = "true";

          button.addEventListener("click", handleAddToCart, true);
          button.addEventListener("submit", handleAddToCart, true);

          const form = button.closest("form");
          if (form && !form.dataset.syncadsIntercepted) {
            form.dataset.syncadsIntercepted = "true";
            form.addEventListener("submit", handleAddToCart, true);
          }

          count++;
        });
      } catch (e) {
        // Ignorar
      }
    });

    log(`🎯 Interceptados ${count} botões`);
  }

  // ==========================================
  // INICIALIZAÇÃO
  // ==========================================

  function init() {
    if (!window.Shopify) {
      log("⚠️ Não é uma loja Shopify");
      return;
    }

    log("=".repeat(60));
    log("🔥 SyncAds Cart Drawer v3.0 Inicializado");
    log("🏪 Shop:", CONFIG.SHOP_DOMAIN);
    log("=".repeat(60));

    createCartDrawer();
    loadCartFromStorage();
    interceptButtons();

    // Observar DOM
    const observer = new MutationObserver(() => {
      interceptButtons();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Re-interceptar periodicamente
    setInterval(interceptButtons, 2000);

    log("✅ Pronto!");
  }

  // Iniciar quando DOM carregar
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // API pública
  window.SyncAdsCart = {
    version: "3.0",
    config: CONFIG,
    cart: cart,
    addToCart: addToCart,
    updateQuantity: updateQuantity,
    removeFromCart: removeFromCart,
    clearCart: clearCart,
    openCart: openCart,
    closeCart: closeCart,
    getCartTotal: getCartTotal,
    getCartCount: getCartCount,
  };
})();
