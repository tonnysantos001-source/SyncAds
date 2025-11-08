/**
 * ============================================
 * SYNCADS - SHOPIFY CHECKOUT REDIRECT v4.0
 * ============================================
 *
 * Funcionalidades:
 * - Carrinho lateral personalizado
 * - Interceptação de "Adicionar ao Carrinho"
 * - Interceptação de "Finalizar Compra"
 * - Redirect para checkout customizado SyncAds
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
      console.log("[SyncAds]", ...args);
    }
  }

  function error(...args) {
    console.error("[SyncAds ERROR]", ...args);
  }

  // ============================================
  // FUNÇÕES DO CARRINHO
  // ============================================
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
    log("✅ Produto adicionado:", product);
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

  function saveCartToStorage() {
    try {
      localStorage.setItem("syncads_cart", JSON.stringify(cart.items));
    } catch (e) {
      error("Erro ao salvar carrinho:", e);
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
      error("Erro ao carregar carrinho:", e);
    }
  }

  // ============================================
  // CRIAR DRAWER DO CARRINHO
  // ============================================
  function createCartDrawer() {
    const drawer = document.createElement("div");
    drawer.id = "syncads-cart-drawer";
    drawer.style.cssText = `
      position: fixed;
      top: 0;
      right: -100%;
      width: 90%;
      max-width: 420px;
      height: 100vh;
      background: white;
      box-shadow: -4px 0 24px rgba(0, 0, 0, 0.15);
      z-index: 999999;
      transition: right 0.3s ease;
      display: flex;
      flex-direction: column;
    `;

    drawer.innerHTML = `
      <!-- Header -->
      <div style="
        padding: 20px;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: #667eea;
        color: white;
      ">
        <h2 style="margin: 0; font-size: 20px; font-weight: 700;">
          🛒 Seu Carrinho
        </h2>
        <button id="syncads-close-cart" style="
          background: transparent;
          border: none;
          color: white;
          cursor: pointer;
          padding: 8px;
          font-size: 24px;
        ">
          ×
        </button>
      </div>

      <!-- Items Container -->
      <div id="syncads-cart-items" style="
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        background: #f9fafb;
      ">
        <!-- Items aqui -->
      </div>

      <!-- Footer -->
      <div style="
        padding: 20px;
        border-top: 1px solid #e5e7eb;
        background: white;
      ">
        <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
          <span style="font-size: 16px; font-weight: 600;">Total:</span>
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
          transition: transform 0.2s;
        " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
          Finalizar Compra
        </button>
        <p style="
          margin-top: 12px;
          text-align: center;
          font-size: 11px;
          color: #9ca3af;
        ">
          🔒 Checkout 100% seguro via SyncAds
        </p>
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
      height: 100vh;
      background: rgba(0, 0, 0, 0.5);
      z-index: 999998;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.3s, visibility 0.3s;
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
          <div style="font-size: 64px; margin-bottom: 16px; opacity: 0.3;">🛒</div>
          <h3 style="margin: 0 0 8px; font-size: 18px; font-weight: 700;">
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
        ">
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
                : `<span style="font-size: 32px; opacity: 0.3;">📦</span>`
            }
          </div>

          <!-- Info -->
          <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <h4 style="margin: 0 0 4px; font-size: 14px; font-weight: 600; color: #111827;">
                ${item.name}
              </h4>
              ${item.sku ? `<p style="margin: 0 0 4px; font-size: 11px; color: #9ca3af;">SKU: ${item.sku}</p>` : ""}
              <p style="margin: 0; font-size: 16px; font-weight: 700; color: #667eea;">
                R$ ${item.price.toFixed(2)}
              </p>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 8px;">
              <!-- Quantidade -->
              <div style="display: flex; align-items: center; gap: 8px;">
                <button onclick="window.SyncAdsCart.updateQuantity('${item.variantId}', ${item.quantity - 1})" style="
                  width: 28px;
                  height: 28px;
                  border: 1px solid #e5e7eb;
                  background: white;
                  border-radius: 6px;
                  cursor: pointer;
                  font-size: 16px;
                  font-weight: 700;
                  color: #667eea;
                ">−</button>
                <span style="min-width: 24px; text-align: center; font-weight: 600;">${item.quantity}</span>
                <button onclick="window.SyncAdsCart.updateQuantity('${item.variantId}', ${item.quantity + 1})" style="
                  width: 28px;
                  height: 28px;
                  border: 1px solid #e5e7eb;
                  background: white;
                  border-radius: 6px;
                  cursor: pointer;
                  font-size: 16px;
                  font-weight: 700;
                  color: #667eea;
                ">+</button>
              </div>

              <!-- Remover -->
              <button onclick="window.SyncAdsCart.removeFromCart('${item.variantId}')" style="
                background: #fee2e2;
                color: #dc2626;
                border: none;
                border-radius: 6px;
                padding: 6px 10px;
                cursor: pointer;
                font-size: 12px;
                font-weight: 600;
              ">Remover</button>
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

  // ============================================
  // PROCESSAR CHECKOUT
  // ============================================
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
          width: 18px;
          height: 18px;
          animation: spin 1s linear infinite;
        "></div>
        Processando...
      </div>
    `;

    if (!document.getElementById("syncads-spinner-style")) {
      const style = document.createElement("style");
      style.id = "syncads-spinner-style";
      style.textContent =
        "@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }";
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
      log("🔄 Criando pedido no SyncAds...");

      const shopDomain = window.Shopify?.shop || window.location.hostname;

      const response = await fetch(CONFIG.API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: CONFIG.SUPABASE_ANON_KEY,
          Authorization: `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          shopifyDomain: shopDomain,
          items: cart.items,
          total: getCartTotal(),
          subtotal: getCartTotal(),
          currency: "BRL",
          metadata: {
            source: "shopify-checkout-redirect",
            timestamp: new Date().toISOString(),
          },
        }),

        // LOG DEBUG: Ver payload completo
        console.log("🔍 [DEBUG] Payload enviado para API:", {
          shopifyDomain: shopDomain,
          items: cart.items,
          total: getCartTotal()
        });
  </parameter>
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
      clearCart();

      const checkoutUrl = `${CONFIG.CHECKOUT_URL}/${data.orderId}`;
      log("🚀 Redirecionando para:", checkoutUrl);
      window.location.href = checkoutUrl;
    } catch (err) {
      error("Erro ao processar checkout:", err);
      hideLoading();
      cart.processing = false;

      alert(
        `Erro ao processar checkout:\n${err.message}\n\nPor favor, tente novamente.`,
      );
    }
  }

  // ============================================
  // OBTER DADOS DO PRODUTO
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
      const productPrice = document.querySelector(
        'meta[property="product:price:amount"]',
      )?.content;
      const productImage = document.querySelector(
        'meta[property="og:image"]',
      )?.content;

      if (productId && productTitle) {
        return {
          id: productId,
          title: productTitle,
          price: productPrice,
          featured_image: productImage,
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

    // LOG DEBUG: Ver dados do produto capturados
    console.log("🔍 [DEBUG] Product Data capturado:", {
      product: product,
      id: product?.id,
      title: product?.title,
      price: product?.price,
      featured_image: product?.featured_image,
      image: product?.image,
      images: product?.images,
      variants: product?.variants
    });

    if (!product) {
      alert("Erro: Produto não encontrado. Recarregue a página.");
      return false;
    }
</parameter>

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

    // LOG DEBUG: Ver dados finais que serão adicionados ao carrinho
    console.log("🔍 [DEBUG] Product Data montado para carrinho:", {
      productData: productData,
      name: productData.name,
      image: productData.image,
      price: productData.price,
      variant: variant,
      variantTitle: variant?.title
    });

    addToCart(productData);
</parameter>
    return false;
  }

  function interceptAddToCartButtons() {
    const selectors = [
      'button[name="add"]',
      'button[type="submit"][name="add"]',
      'input[type="submit"][name="add"]',
      "button.product-form__submit",
      "[data-add-to-cart]",
      ".add-to-cart",
      ".btn-add-to-cart",
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

    log(`➕ Interceptados ${count} botões de adicionar ao carrinho`);
  }

  // ============================================
  // INICIALIZAÇÃO
  // ============================================
  function init() {
    if (!window.Shopify) {
      log("⚠️ Não é uma loja Shopify");
      return;
    }

    log("🚀 SyncAds Cart v4.0 Inicializado");
    log("🏪 Loja:", window.Shopify.shop);

    createCartDrawer();
    loadCartFromStorage();
    interceptAddToCartButtons();

    // Observar DOM
    const observer = new MutationObserver(() => {
      interceptAddToCartButtons();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Reinterceptar periodicamente
    setInterval(interceptAddToCartButtons, 3000);

    log("✅ Pronto!");
  }

  // Executar ao carregar
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Executar também no load
  window.addEventListener("load", () => {
    setTimeout(init, 500);
  });

  // API pública
  window.SyncAdsCart = {
    version: "4.0",
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    openCart,
    closeCart,
  };

  log("📦 SyncAds carregado! Use window.SyncAdsCart");
})();
