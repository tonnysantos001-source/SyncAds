/**
 * ============================================
 * SYNCADS - SHOPIFY CHECKOUT REDIRECT v4.2
 * ============================================
 *
 * Funcionalidades:
 * - Carrinho lateral personalizado
 * - Interceptação de "Adicionar ao Carrinho"
 * - Interceptação de "Finalizar Compra"
 * - Redirect para checkout customizado SyncAds
 * - Usa Cart API nativa da Shopify (mais confiável)
 *
 * ============================================
 */

(function () {
  "use strict";

  // ============================================
  // CONFIGURAÇÃO
  // ============================================
  const CONFIG = {
    // URL da Edge Function
    API_URL:
      "https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/shopify-create-order",

    // URL do checkout customizado
    CHECKOUT_URL: "https://syncads-dun.vercel.app/checkout",

    // Chave pública do Supabase
    SUPABASE_ANON_KEY:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92c2tlcHFnZ214bGZja3hxZ2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA0ODAzNTEsImV4cCI6MjA0NjA1NjM1MX0.wjhZEkX0yQxLEJJhXqDXzN9vEZ-hEQYB5qE7X0HqE_I",

    // Debug
    DEBUG: true,
  };

  // Estado do carrinho
  const cart = {
    items: [],
    isOpen: false,
    processing: false,
  };

  // ============================================
  // UTILIDADES
  // ============================================
  function log(...args) {
    if (CONFIG.DEBUG) {
      console.log("[SyncAds v4.2]", ...args);
    }
  }

  function error(...args) {
    console.error("[SyncAds ERROR]", ...args);
  }

  // ============================================
  // CART API - FONTE DE VERDADE DA SHOPIFY
  // ============================================
  async function syncWithShopifyCart() {
    try {
      const response = await fetch("/cart.js");
      if (!response.ok) throw new Error("Failed to fetch cart");

      const shopifyCart = await response.json();

      // Sincronizar items do carrinho com a Cart API
      cart.items = shopifyCart.items.map((item) => ({
        productId: String(item.product_id),
        variantId: String(item.variant_id),
        name:
          item.product_title +
          (item.variant_title && item.variant_title !== "Default Title"
            ? ` - ${item.variant_title}`
            : ""),
        price: item.price / 100, // Shopify retorna em centavos
        quantity: item.quantity,
        image: item.image || item.featured_image?.url || "",
        sku: item.sku || "",
      }));

      log("✅ Carrinho sincronizado com Shopify Cart API:", cart.items);
      return cart.items;
    } catch (err) {
      error("Erro ao sincronizar com Cart API:", err);
      return cart.items; // Retornar items existentes como fallback
    }
  }

  // ============================================
  // FUNÇÕES DO CARRINHO
  // ============================================
  async function addToCart(product) {
    try {
      // Adicionar ao carrinho nativo da Shopify primeiro
      const formData = {
        items: [
          {
            id: product.variantId,
            quantity: product.quantity,
          },
        ],
      };

      const response = await fetch("/cart/add.js", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to add to cart");
      }

      // Sincronizar com Cart API para obter dados completos
      await syncWithShopifyCart();

      updateCartUI();
      openCart();
      saveCartToStorage();

      log("✅ Produto adicionado ao carrinho");
    } catch (err) {
      error("Erro ao adicionar produto:", err);
      alert("Erro ao adicionar produto ao carrinho. Tente novamente.");
    }
  }

  async function updateQuantity(variantId, newQuantity) {
    try {
      if (newQuantity <= 0) {
        await removeFromCart(variantId);
        return;
      }

      const response = await fetch("/cart/change.js", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: variantId,
          quantity: newQuantity,
        }),
      });

      if (!response.ok) throw new Error("Failed to update quantity");

      await syncWithShopifyCart();
      updateCartUI();
      saveCartToStorage();
    } catch (err) {
      error("Erro ao atualizar quantidade:", err);
    }
  }

  async function removeFromCart(variantId) {
    try {
      const response = await fetch("/cart/change.js", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: variantId,
          quantity: 0,
        }),
      });

      if (!response.ok) throw new Error("Failed to remove item");

      await syncWithShopifyCart();
      updateCartUI();
      saveCartToStorage();

      if (cart.items.length === 0) {
        closeCart();
      }
    } catch (err) {
      error("Erro ao remover produto:", err);
    }
  }

  async function clearCart() {
    try {
      const response = await fetch("/cart/clear.js", {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to clear cart");

      cart.items = [];
      updateCartUI();
      saveCartToStorage();
    } catch (err) {
      error("Erro ao limpar carrinho:", err);
    }
  }

  function getCartTotal() {
    return cart.items.reduce((sum, item) => {
      return sum + item.price * item.quantity;
    }, 0);
  }

  function saveCartToStorage() {
    try {
      localStorage.setItem("syncads_cart_synced", Date.now().toString());
    } catch (e) {
      error("Erro ao salvar timestamp:", e);
    }
  }

  async function loadCartFromStorage() {
    try {
      // Sempre sincronizar com Cart API ao carregar
      await syncWithShopifyCart();
      updateCartUI();
    } catch (e) {
      error("Erro ao carregar carrinho:", e);
    }
  }

  // ============================================
  // UI DO CARRINHO
  // ============================================
  function createCartDrawer() {
    const drawer = document.createElement("div");
    drawer.id = "syncads-cart-drawer";
    drawer.style.cssText = `
      position: fixed;
      top: 0;
      right: -400px;
      width: 400px;
      height: 100%;
      background: white;
      box-shadow: -2px 0 8px rgba(0,0,0,0.1);
      transition: right 0.3s ease;
      z-index: 999999;
      display: flex;
      flex-direction: column;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    drawer.innerHTML = `
      <div style="padding: 20px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
        <h2 style="margin: 0; font-size: 20px; font-weight: 600;">🛒 Seu Carrinho</h2>
        <button id="syncads-close-cart" style="
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: background 0.2s;
        ">✕</button>
      </div>

      <div id="syncads-cart-items" style="
        flex: 1;
        overflow-y: auto;
        padding: 20px;
      "></div>

      <div style="
        padding: 20px;
        border-top: 1px solid #eee;
        background: #f9f9f9;
      ">
        <div style="display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 18px; font-weight: 600;">
          <span>Total:</span>
          <span id="syncads-cart-total">R$ 0,00</span>
        </div>
        <button id="syncads-checkout-btn" style="
          width: 100%;
          padding: 16px;
          background: #000;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        ">Finalizar Compra</button>
      </div>
    `;

    document.body.appendChild(drawer);

    // Overlay
    const overlay = document.createElement("div");
    overlay.id = "syncads-cart-overlay";
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 999998;
      display: none;
    `;
    document.body.appendChild(overlay);

    // Event Listeners
    document
      .getElementById("syncads-close-cart")
      .addEventListener("click", closeCart);
    overlay.addEventListener("click", closeCart);
    document
      .getElementById("syncads-checkout-btn")
      .addEventListener("click", proceedToCheckout);
  }

  function updateCartUI() {
    const itemsContainer = document.getElementById("syncads-cart-items");
    const totalElement = document.getElementById("syncads-cart-total");
    const checkoutBtn = document.getElementById("syncads-checkout-btn");

    if (!itemsContainer) return;

    if (cart.items.length === 0) {
      itemsContainer.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: #666;">
          <div style="font-size: 48px; margin-bottom: 16px;">🛒</div>
          <p style="margin: 0; font-size: 16px;">Seu carrinho está vazio</p>
        </div>
      `;
      if (checkoutBtn) checkoutBtn.disabled = true;
    } else {
      itemsContainer.innerHTML = cart.items
        .map(
          (item) => `
        <div style="
          display: flex;
          gap: 12px;
          padding: 12px;
          border: 1px solid #eee;
          border-radius: 8px;
          margin-bottom: 12px;
        ">
          <img
            src="${item.image || "https://via.placeholder.com/80"}"
            alt="${item.name}"
            style="
              width: 80px;
              height: 80px;
              object-fit: cover;
              border-radius: 4px;
              background: #f5f5f5;
            "
          />
          <div style="flex: 1; display: flex; flex-direction: column;">
            <div style="font-weight: 500; margin-bottom: 4px; font-size: 14px;">
              ${item.name}
            </div>
            <div style="color: #666; font-size: 14px; margin-bottom: 8px;">
              R$ ${item.price.toFixed(2)}
            </div>
            <div style="display: flex; align-items: center; gap: 8px; margin-top: auto;">
              <button
                onclick="window.syncAdsUpdateQty('${item.variantId}', ${item.quantity - 1})"
                style="
                  width: 28px;
                  height: 28px;
                  border: 1px solid #ddd;
                  background: white;
                  border-radius: 4px;
                  cursor: pointer;
                  font-size: 16px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                "
              >−</button>
              <span style="min-width: 30px; text-align: center; font-weight: 500;">
                ${item.quantity}
              </span>
              <button
                onclick="window.syncAdsUpdateQty('${item.variantId}', ${item.quantity + 1})"
                style="
                  width: 28px;
                  height: 28px;
                  border: 1px solid #ddd;
                  background: white;
                  border-radius: 4px;
                  cursor: pointer;
                  font-size: 16px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                "
              >+</button>
              <button
                onclick="window.syncAdsRemoveItem('${item.variantId}')"
                style="
                  margin-left: auto;
                  background: none;
                  border: none;
                  color: #999;
                  cursor: pointer;
                  font-size: 18px;
                  padding: 4px;
                "
              >🗑️</button>
            </div>
          </div>
        </div>
      `,
        )
        .join("");

      if (checkoutBtn) checkoutBtn.disabled = false;
    }

    if (totalElement) {
      totalElement.textContent = `R$ ${getCartTotal().toFixed(2)}`;
    }
  }

  function openCart() {
    const drawer = document.getElementById("syncads-cart-drawer");
    const overlay = document.getElementById("syncads-cart-overlay");

    if (drawer && overlay) {
      // Sincronizar antes de abrir
      syncWithShopifyCart().then(() => {
        drawer.style.right = "0";
        overlay.style.display = "block";
        cart.isOpen = true;
      });
    }
  }

  function closeCart() {
    const drawer = document.getElementById("syncads-cart-drawer");
    const overlay = document.getElementById("syncads-cart-overlay");

    if (drawer && overlay) {
      drawer.style.right = "-400px";
      overlay.style.display = "none";
      cart.isOpen = false;
    }
  }

  // ============================================
  // LOADING STATE
  // ============================================
  function showLoading() {
    const btn = document.getElementById("syncads-checkout-btn");
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
          <div style="
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255,255,255,0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: syncads-spin 0.8s linear infinite;
          "></div>
          <span>Processando...</span>
        </div>
      `;

      // Add animation if not exists
      if (!document.getElementById("syncads-spinner-style")) {
        const style = document.createElement("style");
        style.id = "syncads-spinner-style";
        style.textContent = `
          @keyframes syncads-spin {
            to { transform: rotate(360deg); }
          }
        `;
        document.head.appendChild(style);
      }
    }
  }

  function hideLoading() {
    const btn = document.getElementById("syncads-checkout-btn");
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = "Finalizar Compra";
    }
  }

  // ============================================
  // CHECKOUT - USA CART API NATIVA
  // ============================================
  async function proceedToCheckout() {
    if (cart.processing || cart.items.length === 0) return;

    cart.processing = true;
    showLoading();

    try {
      log("🔄 Criando pedido no SyncAds...");

      const shopDomain = window.Shopify?.shop || window.location.hostname;

      // Sincronizar com Cart API para garantir dados mais recentes
      const cartItems = await syncWithShopifyCart();

      if (!cartItems || cartItems.length === 0) {
        throw new Error("Carrinho vazio");
      }

      log("📦 Enviando", cartItems.length, "produtos para API");

      const response = await fetch(CONFIG.API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: CONFIG.SUPABASE_ANON_KEY,
          Authorization: `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          shopifyDomain: shopDomain,
          items: cartItems,
          total: getCartTotal(),
          subtotal: getCartTotal(),
          currency: "BRL",
          metadata: {
            source: "shopify-checkout-redirect-v4.2-cart-api",
            timestamp: new Date().toISOString(),
            method: "cart-api",
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

      // Limpar carrinho e redirecionar
      await clearCart();

      const checkoutUrl = `${CONFIG.CHECKOUT_URL}/${data.orderId}`;
      log("🚀 Redirecionando para:", checkoutUrl);
      window.location.href = checkoutUrl;
    } catch (err) {
      error("Erro ao processar checkout:", err);
      hideLoading();
      alert(
        "Erro ao processar seu pedido. Por favor, tente novamente.\n\n" +
          err.message,
      );
    } finally {
      cart.processing = false;
    }
  }

  // ============================================
  // OBTER DADOS DO PRODUTO (SIMPLIFICADO)
  // ============================================
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

      if (productId && productTitle) {
        return {
          id: productId,
          title: productTitle,
        };
      }

      return null;
    } catch (error) {
      error("Erro ao obter dados do produto:", error);
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

  // ============================================
  // INTERCEPTAR ADICIONAR AO CARRINHO
  // ============================================
  function handleAddToCart(event) {
    event.preventDefault();
    event.stopPropagation();

    log("➕ Adicionando ao carrinho...");

    const product = getProductData();
    if (!product) {
      error("Produto não encontrado");
      // Permitir que o comportamento padrão da Shopify aconteça
      return true;
    }

    const variantId = getSelectedVariant();
    const quantity = getQuantity();

    if (!variantId) {
      error("Variant não selecionada");
      return true;
    }

    // Adicionar ao carrinho (que usa Cart API internamente)
    const productData = {
      productId: String(product.id || ""),
      variantId: String(variantId),
      quantity: quantity,
    };

    addToCart(productData);
    return false;
  }

  function interceptAddToCartButtons() {
    const selectors = [
      'button[name="add"]',
      'button[type="submit"][name="add"]',
      'input[type="submit"][name="add"]',
      ".product-form__submit",
      "[data-add-to-cart]",
      "button.btn--add-to-cart",
      "button.add-to-cart",
    ];

    let count = 0;

    selectors.forEach((selector) => {
      const buttons = document.querySelectorAll(selector);
      buttons.forEach((btn) => {
        // Remover listeners antigos se existirem
        btn.removeEventListener("click", handleAddToCart);
        btn.addEventListener("click", handleAddToCart);
        count++;
      });
    });

    // Interceptar formulários
    const forms = document.querySelectorAll('form[action*="/cart/add"]');
    forms.forEach((form) => {
      form.removeEventListener("submit", handleAddToCart);
      form.addEventListener("submit", handleAddToCart);
      count++;
    });

    if (count > 0) {
      log(`🎯 ${count} botões interceptados`);
    }
  }

  // ============================================
  // INICIALIZAÇÃO
  // ============================================
  function init() {
    log("🚀 Inicializando SyncAds Checkout Redirect v4.2 (Cart API)");

    // Criar UI
    createCartDrawer();

    // Carregar carrinho da Shopify
    loadCartFromStorage();

    // Interceptar botões
    interceptAddToCartButtons();

    // Observer para botões dinâmicos
    const observer = new MutationObserver(() => {
      interceptAddToCartButtons();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Expor funções globais
    window.syncAdsUpdateQty = updateQuantity;
    window.syncAdsRemoveItem = removeFromCart;
    window.syncAdsOpenCart = openCart;
    window.syncAdsSyncCart = syncWithShopifyCart;

    log("✅ SyncAds pronto! Usando Cart API nativa da Shopify");
  }

  // Executar após DOM carregar
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

console.log("📦 SyncAds Checkout Redirect v4.2 carregado (Cart API Mode)");
