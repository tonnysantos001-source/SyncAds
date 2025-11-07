/**
 * ============================================
 * SYNCADS - SHOPIFY CHECKOUT REDIRECT v4.1
 * ============================================
 *
 * Funcionalidades:
 * - Carrinho lateral personalizado
 * - Interceptação de "Adicionar ao Carrinho"
 * - Interceptação de "Finalizar Compra"
 * - Redirect para checkout customizado SyncAds
 * - Debug detalhado para rastrear dados dos produtos
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
  }

  function getCartTotal() {
    return cart.items.reduce((sum, item) => {
      return sum + item.price * item.quantity;
    }, 0);
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
      drawer.style.right = "0";
      overlay.style.display = "block";
      cart.isOpen = true;
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

      // Add animation
      const style = document.createElement("style");
      style.textContent = `
        @keyframes syncads-spin {
          to { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
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
  // CHECKOUT
  // ============================================
  async function proceedToCheckout() {
    if (cart.processing || cart.items.length === 0) return;

    cart.processing = true;
    showLoading();

    try {
      log("🔄 Criando pedido no SyncAds...");

      const shopDomain = window.Shopify?.shop || window.location.hostname;

      // 🔍 DEBUG: Log do payload antes de enviar
      console.log("🔍 [DEBUG] Payload que será enviado para API:", {
        shopifyDomain: shopDomain,
        items: cart.items,
        itemsDetalhados: cart.items.map(item => ({
          name: item.name,
          image: item.image,
          price: item.price,
          productId: item.productId,
          variantId: item.variantId
        })),
        total: getCartTotal(),
        subtotal: getCartTotal(),
      });

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
            source: "shopify-checkout-redirect-v4.1",
            timestamp: new Date().toISOString(),
            cartSnapshot: cart.items, // Backup dos dados
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("🔴 [DEBUG] Erro na resposta da API:", {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText
        });
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      console.log("✅ [DEBUG] Resposta da API:", data);

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
      alert(
        "Erro ao processar seu pedido. Por favor, tente novamente.\n\n" +
          err.message,
      );
    } finally {
      cart.processing = false;
    }
  }

  // ============================================
  // OBTER DADOS DO PRODUTO
  // ============================================
  function getProductData() {
    try {
      console.log("🔍 [DEBUG] Tentando obter dados do produto...");

      // Método 1: JSON no DOM
      const productJson = document.querySelector("[data-product-json]");
      if (productJson) {
        const product = JSON.parse(productJson.textContent);
        console.log("✅ [DEBUG] Produto encontrado via data-product-json:", {
          id: product.id,
          title: product.title,
          price: product.price,
          featured_image: product.featured_image,
          variants: product.variants?.length || 0
        });
        return product;
      }

      // Método 2: ShopifyAnalytics
      if (window.ShopifyAnalytics?.meta?.product) {
        const product = window.ShopifyAnalytics.meta.product;
        console.log("✅ [DEBUG] Produto encontrado via ShopifyAnalytics:", {
          id: product.id,
          name: product.name,
          price: product.price,
          variants: product.variants
        });
        return product;
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
        const product = {
          id: productId,
          title: productTitle,
          price: productPrice,
          featured_image: productImage,
        };
        console.log("✅ [DEBUG] Produto encontrado via meta tags:", product);
        return product;
      }

      console.warn("⚠️ [DEBUG] Nenhum método de captura de produto funcionou");
      console.log("🔍 [DEBUG] Elementos disponíveis no DOM:", {
        hasProductJson: !!productJson,
        hasShopifyAnalytics: !!window.ShopifyAnalytics,
        hasMetaTags: !!productId,
        allMetaTags: Array.from(document.querySelectorAll('meta')).map(m => ({
          property: m.getAttribute('property'),
          name: m.getAttribute('name'),
          content: m.content
        }))
      });

      return null;
    } catch (error) {
      console.error("🔴 [DEBUG] Erro ao obter dados do produto:", error);
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
      console.error("🔴 [DEBUG] Produto não encontrado no DOM");
      alert("Erro: Produto não encontrado. Recarregue a página.");
      return false;
    }

    const variantId = getSelectedVariant();
    const quantity = getQuantity();

    console.log("🔍 [DEBUG] Dados capturados:", {
      product: product,
      variantId: variantId,
      quantity: quantity
    });

    let variant = null;
    if (product.variants && variantId) {
      variant = product.variants.find(
        (v) => String(v.id) === String(variantId),
      );
    }

    if (!variant && product.variants && product.variants.length > 0) {
      variant = product.variants[0];
    }

    console.log("🔍 [DEBUG] Variant selecionada:", variant);

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

    console.log("✅ [DEBUG] Product Data montado para carrinho:", {
      productData: productData,
      nome: productData.name,
      imagem: productData.image,
      preco: productData.price,
      quantidade: productData.quantity
    });

    addToCart(productData);
    return false;
  }

  function interceptAddToCartButtons() {
    const selectors = [
      'button[name="add"]',
      'button[type="submit"][name="add"]',
      'input[type="submit"][name="add"]',
      '.product-form__submit',
      '[data-add-to-cart]',
      'button.btn--add-to-cart',
      'button.add-to-cart',
    ];

    let count = 0;

    selectors.forEach((selector) => {
      const buttons = document.querySelectorAll(selector);
      buttons.forEach((btn) => {
        btn.addEventListener("click", handleAddToCart);
        count++;
      });
    });

    // Interceptar formulários
    const forms = document.querySelectorAll('form[action*="/cart/add"]');
    forms.forEach((form) => {
      form.addEventListener("submit", handleAddToCart);
      count++;
    });

    log(`🎯 ${count} botões interceptados`);
  }

  // ============================================
  // INICIALIZAÇÃO
  // ============================================
  function init() {
    log("🚀 Inicializando SyncAds Checkout Redirect v4.1 (Debug Mode)");

    // Carregar carrinho salvo
    loadCartFromStorage();

    // Criar UI
    createCartDrawer();

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

    log("✅ SyncAds pronto!");
  }

  // Executar após DOM carregar
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

console.log("📦 SyncAds Checkout Redirect v4.1 carregado (Debug Mode)");
