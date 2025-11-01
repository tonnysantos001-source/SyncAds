/**
 * SyncAds - Script de Teste Rápido
 * Cole este script no console do navegador na página de produto do Shopify
 */

(async function testSyncAds() {
  console.log("🧪 Iniciando teste SyncAds...");

  // Configuração
  const API_URL =
    "https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/shopify-create-order";
  const SHOP_DOMAIN = window.Shopify ? window.Shopify.shop : "unknown";

  console.log("🏪 Shop Domain:", SHOP_DOMAIN);

  // Verificar se está no Shopify
  if (!window.Shopify) {
    console.error("❌ Não é uma loja Shopify!");
    return;
  }

  // Verificar se o script SyncAds está carregado
  if (window.SyncAdsCheckout) {
    console.log("✅ Script SyncAds detectado!");
    console.log("📦 Versão:", window.SyncAdsCheckout.version);
    console.log("⚙️ Estado:", window.SyncAdsCheckout.state);
    console.log("🔧 Config:", window.SyncAdsCheckout.config);
  } else {
    console.warn("⚠️ Script SyncAds NÃO detectado!");
  }

  // Tentar obter dados do produto
  console.log("\n📦 Obtendo dados do produto...");

  let product = null;

  // Método 1: JSON no DOM
  const productJson = document.querySelector("[data-product-json]");
  if (productJson) {
    try {
      product = JSON.parse(productJson.textContent);
      console.log("✅ Produto encontrado (DOM JSON):", product);
    } catch (e) {
      console.log("❌ Erro ao parsear JSON:", e);
    }
  }

  // Método 2: ShopifyAnalytics
  if (!product && window.ShopifyAnalytics?.meta?.product) {
    product = window.ShopifyAnalytics.meta.product;
    console.log("✅ Produto encontrado (ShopifyAnalytics):", product);
  }

  // Método 3: Meta tags
  if (!product) {
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
      product = {
        id: productId,
        title: productTitle,
        price: productPrice,
      };
      console.log("✅ Produto encontrado (Meta tags):", product);
    }
  }

  if (!product) {
    console.error("❌ Nenhum produto encontrado na página!");
    return;
  }

  // Preparar dados do produto
  const productData = {
    productId: String(product.id || ""),
    variantId:
      product.variants && product.variants[0]
        ? String(product.variants[0].id)
        : null,
    name: product.title || "Produto teste",
    price: product.price
      ? product.price > 1000
        ? product.price / 100
        : product.price
      : 10,
    quantity: 1,
    image:
      product.featured_image ||
      product.image ||
      (product.images && product.images[0]) ||
      "",
    sku: product.variants && product.variants[0] ? product.variants[0].sku : "",
  };

  console.log("\n📤 Dados preparados para envio:", productData);

  // Testar chamada à API
  console.log("\n🚀 Testando chamada à API...");

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        shopDomain: SHOP_DOMAIN,
        products: [productData],
        customer: {
          email: "teste@syncads.com",
          firstName: "Teste",
          lastName: "SyncAds",
          phone: null,
        },
        metadata: {
          source: "console_test",
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        },
      }),
    });

    console.log("📡 Status da resposta:", response.status);
    console.log("📡 Headers:", [...response.headers.entries()]);

    const result = await response.json();

    if (response.ok && result.success) {
      console.log("✅ SUCESSO! Pedido criado:", result);
      console.log("\n🔗 URL do Checkout:", result.checkoutUrl);
      console.log("\n💡 Para redirecionar, execute:");
      console.log(`window.location.href = "${result.checkoutUrl}"`);
    } else {
      console.error("❌ ERRO na API:", result);
    }
  } catch (error) {
    console.error("❌ Erro ao chamar API:", error);
  }

  console.log("\n✅ Teste concluído!");
})();
