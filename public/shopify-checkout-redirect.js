/**
 * SyncAds Checkout Redirect for Shopify
 *
 * Este script intercepta o processo de checkout da Shopify
 * e redireciona para o checkout customizado do SyncAds
 *
 * Instruções de instalação:
 * 1. No Admin da Shopify, vá em: Online Store > Themes > Actions > Edit code
 * 2. Abra o arquivo theme.liquid
 * 3. Adicione antes do </body>:
 *    <script src="https://seu-dominio.com/shopify-checkout-redirect.js"></script>
 */

(function() {
  'use strict';

  // ===== CONFIGURAÇÃO =====
  const CONFIG = {
    // URL da sua Edge Function (substitua com sua URL real)
    API_URL: 'https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/shopify-create-order',

    // URL do seu frontend (substitua com sua URL real)
    FRONTEND_URL: 'https://syncads-dun.vercel.app',

    // Shop domain (será detectado automaticamente)
    SHOP_DOMAIN: window.Shopify ? window.Shopify.shop : '',

    // Debug mode
    DEBUG: true
  };

  // ===== UTILITÁRIOS =====
  function log(...args) {
    if (CONFIG.DEBUG) {
      console.log('[SyncAds Checkout]', ...args);
    }
  }

  function logError(...args) {
    console.error('[SyncAds Checkout ERROR]', ...args);
  }

  // ===== DETECTAR PRODUTO ATUAL =====
  function getCurrentProduct() {
    try {
      // Tentar obter dados do produto da página
      const productJson = document.querySelector('script[type="application/json"][data-product-json]');
      if (productJson) {
        return JSON.parse(productJson.textContent);
      }

      // Alternativa: usar window.ShopifyAnalytics
      if (window.ShopifyAnalytics && window.ShopifyAnalytics.meta && window.ShopifyAnalytics.meta.product) {
        return window.ShopifyAnalytics.meta.product;
      }

      // Alternativa: buscar no meta tag
      const productMeta = document.querySelector('meta[property="og:product"]');
      if (productMeta) {
        return {
          id: productMeta.getAttribute('content'),
          title: document.querySelector('meta[property="og:title"]')?.getAttribute('content'),
          price: document.querySelector('meta[property="og:price:amount"]')?.getAttribute('content')
        };
      }

      return null;
    } catch (error) {
      logError('Error getting current product:', error);
      return null;
    }
  }

  // ===== OBTER VARIANTE SELECIONADA =====
  function getSelectedVariant() {
    try {
      // Buscar select de variantes
      const variantSelect = document.querySelector('select[name="id"]');
      if (variantSelect) {
        return variantSelect.value;
      }

      // Buscar radio buttons de variantes
      const variantRadio = document.querySelector('input[name="id"]:checked');
      if (variantRadio) {
        return variantRadio.value;
      }

      // Buscar no formulário de produto
      const form = document.querySelector('form[action*="/cart/add"]');
      if (form) {
        const idInput = form.querySelector('input[name="id"]');
        if (idInput) {
          return idInput.value;
        }
      }

      return null;
    } catch (error) {
      logError('Error getting selected variant:', error);
      return null;
    }
  }

  // ===== OBTER QUANTIDADE =====
  function getQuantity() {
    try {
      const qtyInput = document.querySelector('input[name="quantity"]');
      return qtyInput ? parseInt(qtyInput.value) || 1 : 1;
    } catch (error) {
      return 1;
    }
  }

  // ===== CRIAR PEDIDO NO SYNCADS =====
  async function createSyncAdsOrder(productData) {
    try {
      log('Creating order in SyncAds...', productData);

      const response = await fetch(CONFIG.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shopDomain: CONFIG.SHOP_DOMAIN,
          products: [productData],
          customer: {
            email: null, // Será preenchido no checkout
            firstName: null,
            lastName: null,
            phone: null
          },
          metadata: {
            source: 'shopify_product_page',
            userAgent: navigator.userAgent,
            referrer: document.referrer
          }
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to create order');
      }

      log('Order created successfully:', result);
      return result;
    } catch (error) {
      logError('Failed to create order:', error);
      throw error;
    }
  }

  // ===== REDIRECIONAR PARA CHECKOUT =====
  function redirectToCheckout(checkoutUrl) {
    log('Redirecting to checkout:', checkoutUrl);

    // Mostrar loading
    showLoading();

    // Redirecionar
    window.location.href = checkoutUrl;
  }

  // ===== MOSTRAR LOADING =====
  function showLoading() {
    // Criar overlay de loading
    const overlay = document.createElement('div');
    overlay.id = 'syncads-loading-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
    `;

    const spinner = document.createElement('div');
    spinner.style.cssText = `
      border: 4px solid #f3f3f3;
      border-top: 4px solid #3498db;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      animation: spin 1s linear infinite;
    `;

    // Adicionar CSS para animação
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);

    overlay.appendChild(spinner);
    document.body.appendChild(overlay);
  }

  // ===== PROCESSAR COMPRA =====
  async function processPurchase(event) {
    try {
      event.preventDefault();
      event.stopPropagation();

      log('Purchase initiated...');

      // Obter dados do produto
      const product = getCurrentProduct();
      if (!product) {
        logError('Product data not found');
        alert('Não foi possível obter dados do produto. Por favor, recarregue a página.');
        return;
      }

      const variantId = getSelectedVariant();
      const quantity = getQuantity();

      // Encontrar variante
      let variant = null;
      if (product.variants && variantId) {
        variant = product.variants.find(v => v.id == variantId);
      }

      // Se não encontrou variante, usar primeira disponível ou dados do produto
      if (!variant && product.variants && product.variants.length > 0) {
        variant = product.variants[0];
      }

      // Preparar dados do produto
      const productData = {
        productId: product.id ? String(product.id) : '',
        variantId: variant ? String(variant.id) : variantId ? String(variantId) : '',
        name: variant ? `${product.title} - ${variant.title}` : product.title,
        price: variant ? (variant.price / 100) : (product.price / 100),
        quantity: quantity,
        image: product.featured_image || (product.images && product.images[0]) || '',
        sku: variant ? variant.sku : ''
      };

      log('Product data prepared:', productData);

      // Criar pedido no SyncAds
      const result = await createSyncAdsOrder(productData);

      // Redirecionar para checkout
      if (result.checkoutUrl) {
        redirectToCheckout(result.checkoutUrl);
      } else {
        throw new Error('Checkout URL not received');
      }

    } catch (error) {
      logError('Error processing purchase:', error);

      // Remover loading se existir
      const overlay = document.getElementById('syncads-loading-overlay');
      if (overlay) {
        overlay.remove();
      }

      alert('Erro ao processar compra. Por favor, tente novamente.');
    }
  }

  // ===== INTERCEPTAR BOTÕES DE COMPRA =====
  function interceptCheckoutButtons() {
    log('Intercepting checkout buttons...');

    // Seletores comuns de botões de compra na Shopify
    const buttonSelectors = [
      'button[name="add"]',
      'button[type="submit"][name="add"]',
      'input[type="submit"][name="add"]',
      'button.product-form__submit',
      'button[data-action="add-to-cart"]',
      '.btn-add-to-cart',
      '[data-add-to-cart]'
    ];

    buttonSelectors.forEach(selector => {
      const buttons = document.querySelectorAll(selector);
      buttons.forEach(button => {
        // Verificar se já foi interceptado
        if (button.dataset.syncadsIntercepted) {
          return;
        }

        log('Intercepting button:', button);

        // Marcar como interceptado
        button.dataset.syncadsIntercepted = 'true';

        // Remover event listeners antigos (se possível)
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);

        // Adicionar novo event listener
        newButton.addEventListener('click', processPurchase, true);

        // Mudar texto do botão (opcional)
        if (newButton.textContent.toLowerCase().includes('cart')) {
          newButton.textContent = newButton.textContent.replace(/cart/i, 'Comprar');
        }
      });
    });
  }

  // ===== INICIALIZAR =====
  function init() {
    log('Initializing SyncAds Checkout Redirect...');
    log('Shop:', CONFIG.SHOP_DOMAIN);

    // Verificar se estamos em uma página de produto
    if (!window.Shopify || !window.Shopify.shop) {
      log('Not a Shopify store, script disabled');
      return;
    }

    // Aguardar DOM carregar
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', interceptCheckoutButtons);
    } else {
      interceptCheckoutButtons();
    }

    // Re-interceptar após AJAX (temas modernos)
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
          interceptCheckoutButtons();
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    log('SyncAds Checkout Redirect initialized successfully!');
  }

  // Iniciar
  init();
})();
