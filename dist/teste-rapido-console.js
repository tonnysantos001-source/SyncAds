/**
 * ============================================
 * TESTE RÁPIDO - CAPTURA DE DADOS DO PRODUTO
 * ============================================
 *
 * COMO USAR:
 * 1. Abra uma página de produto na sua loja Shopify
 * 2. Abra DevTools (F12) → Console
 * 3. Copie e cole TODO este código
 * 4. Pressione Enter
 * 5. Veja os resultados
 *
 * ============================================
 */

(function testProductData() {
  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║  SYNCADS - TESTE DE CAPTURA DE DADOS DO PRODUTO              ║");
  console.log("╚════════════════════════════════════════════════════════════════╝");
  console.log("");

  const results = {
    methods: [],
    bestMethod: null,
    recommendation: "",
  };

  // ============================================
  // MÉTODO 1: data-product-json
  // ============================================
  console.log("🔍 MÉTODO 1: Procurando [data-product-json]...");
  try {
    const productJson = document.querySelector("[data-product-json]");
    if (productJson) {
      const product = JSON.parse(productJson.textContent);
      console.log("✅ ENCONTRADO!", {
        id: product.id,
        title: product.title,
        price: product.price,
        featured_image: product.featured_image,
        variants: product.variants?.length || 0,
      });
      results.methods.push({
        name: "data-product-json",
        success: true,
        data: product,
      });
      results.bestMethod = results.bestMethod || "data-product-json";
    } else {
      console.log("❌ Não encontrado");
      results.methods.push({ name: "data-product-json", success: false });
    }
  } catch (error) {
    console.log("❌ Erro:", error.message);
    results.methods.push({ name: "data-product-json", success: false, error: error.message });
  }
  console.log("");

  // ============================================
  // MÉTODO 2: ShopifyAnalytics
  // ============================================
  console.log("🔍 MÉTODO 2: Procurando window.ShopifyAnalytics...");
  try {
    if (window.ShopifyAnalytics?.meta?.product) {
      const product = window.ShopifyAnalytics.meta.product;
      console.log("✅ ENCONTRADO!", product);
      results.methods.push({
        name: "ShopifyAnalytics",
        success: true,
        data: product,
      });
      results.bestMethod = results.bestMethod || "ShopifyAnalytics";
    } else {
      console.log("❌ Não disponível");
      console.log("   window.ShopifyAnalytics existe?", !!window.ShopifyAnalytics);
      console.log("   window.ShopifyAnalytics.meta existe?", !!window.ShopifyAnalytics?.meta);
      results.methods.push({ name: "ShopifyAnalytics", success: false });
    }
  } catch (error) {
    console.log("❌ Erro:", error.message);
    results.methods.push({ name: "ShopifyAnalytics", success: false, error: error.message });
  }
  console.log("");

  // ============================================
  // MÉTODO 3: Meta Tags
  // ============================================
  console.log("🔍 MÉTODO 3: Procurando meta tags...");
  try {
    const productId = document.querySelector('meta[property="product:id"]')?.content;
    const productTitle = document.querySelector('meta[property="og:title"]')?.content;
    const productPrice = document.querySelector('meta[property="product:price:amount"]')?.content;
    const productImage = document.querySelector('meta[property="og:image"]')?.content;

    if (productId && productTitle) {
      console.log("✅ ENCONTRADO!", {
        id: productId,
        title: productTitle,
        price: productPrice,
        image: productImage,
      });
      results.methods.push({
        name: "Meta Tags",
        success: true,
        data: { id: productId, title: productTitle, price: productPrice, featured_image: productImage },
      });
      results.bestMethod = results.bestMethod || "Meta Tags";
    } else {
      console.log("❌ Dados incompletos");
      console.log("   product:id:", productId || "não encontrado");
      console.log("   og:title:", productTitle || "não encontrado");
      results.methods.push({ name: "Meta Tags", success: false });
    }
  } catch (error) {
    console.log("❌ Erro:", error.message);
    results.methods.push({ name: "Meta Tags", success: false, error: error.message });
  }
  console.log("");

  // ============================================
  // MÉTODO 4: .product-json (seletor de tema)
  // ============================================
  console.log("🔍 MÉTODO 4: Procurando .product-json (tema específico)...");
  try {
    const selectors = [
      '.product-json',
      '[data-product]',
      '#ProductJson',
      '.product__info-container [type="application/json"]',
      'script[type="application/json"][data-product]',
      'script[type="application/ld+json"]',
    ];

    let found = false;
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        try {
          const data = JSON.parse(element.textContent);
          if (data.id || data.product_id) {
            console.log(`✅ ENCONTRADO via ${selector}!`, {
              id: data.id || data.product_id,
              title: data.title || data.name,
            });
            results.methods.push({
              name: `Tema específico (${selector})`,
              success: true,
              data: data,
            });
            results.bestMethod = results.bestMethod || `Tema específico (${selector})`;
            found = true;
            break;
          }
        } catch (e) {
          // Continuar tentando
        }
      }
    }

    if (!found) {
      console.log("❌ Nenhum seletor de tema encontrado");
      results.methods.push({ name: "Tema específico", success: false });
    }
  } catch (error) {
    console.log("❌ Erro:", error.message);
    results.methods.push({ name: "Tema específico", success: false, error: error.message });
  }
  console.log("");

  // ============================================
  // MÉTODO 5: Product Handle + API
  // ============================================
  console.log("🔍 MÉTODO 5: Tentando buscar via /products/{handle}.js...");
  try {
    const productHandle = window.location.pathname.split('/products/')[1]?.split('?')[0]?.split('/')[0];

    if (productHandle) {
      console.log(`   Product Handle: ${productHandle}`);
      console.log("   Fazendo requisição síncrona...");

      const xhr = new XMLHttpRequest();
      xhr.open('GET', `/products/${productHandle}.js`, false);
      xhr.send();

      if (xhr.status === 200) {
        const product = JSON.parse(xhr.responseText);
        console.log("✅ ENCONTRADO via API!", {
          id: product.id,
          title: product.title,
          price: product.price,
          featured_image: product.featured_image,
          variants: product.variants?.length || 0,
        });
        results.methods.push({
          name: "Product JS API",
          success: true,
          data: product,
        });
        results.bestMethod = results.bestMethod || "Product JS API";
      } else {
        console.log(`❌ Erro HTTP ${xhr.status}`);
        results.methods.push({ name: "Product JS API", success: false });
      }
    } else {
      console.log("❌ Não está em uma página de produto");
      results.methods.push({ name: "Product JS API", success: false });
    }
  } catch (error) {
    console.log("❌ Erro:", error.message);
    results.methods.push({ name: "Product JS API", success: false, error: error.message });
  }
  console.log("");

  // ============================================
  // MÉTODO 6: Verificar Shopify global
  // ============================================
  console.log("🔍 MÉTODO 6: Verificando objetos globais Shopify...");
  console.log("   window.Shopify:", !!window.Shopify);
  console.log("   window.Shopify.shop:", window.Shopify?.shop || "não disponível");
  console.log("   window.ShopifyAnalytics:", !!window.ShopifyAnalytics);
  console.log("   window.meta:", !!window.meta);
  if (window.meta?.product) {
    console.log("✅ window.meta.product encontrado!", window.meta.product);
    results.methods.push({
      name: "window.meta.product",
      success: true,
      data: window.meta.product,
    });
    results.bestMethod = results.bestMethod || "window.meta.product";
  }
  console.log("");

  // ============================================
  // MÉTODO 7: Scraping de imagens
  // ============================================
  console.log("🔍 MÉTODO 7: Buscando imagens no DOM...");
  const imageSelectors = [
    '.product__main-photos img',
    '.product-single__photo img',
    '[data-product-featured-image]',
    '.product-image-main img',
    '.product__media img',
    '.product-gallery img',
  ];

  let foundImage = null;
  for (const selector of imageSelectors) {
    const img = document.querySelector(selector);
    if (img?.src && !img.src.includes('placeholder')) {
      foundImage = img.src;
      console.log(`✅ Imagem encontrada via ${selector}:`, foundImage);
      break;
    }
  }

  if (!foundImage) {
    console.log("⚠️ Nenhuma imagem de produto encontrada nos seletores comuns");
  }
  console.log("");

  // ============================================
  // RESUMO E RECOMENDAÇÃO
  // ============================================
  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║  RESUMO DOS RESULTADOS                                        ║");
  console.log("╚════════════════════════════════════════════════════════════════╝");
  console.log("");

  const successfulMethods = results.methods.filter(m => m.success);
  const failedMethods = results.methods.filter(m => !m.success);

  console.log(`✅ Métodos que funcionaram: ${successfulMethods.length}/${results.methods.length}`);
  successfulMethods.forEach(m => {
    console.log(`   - ${m.name}`);
  });
  console.log("");

  if (failedMethods.length > 0) {
    console.log(`❌ Métodos que falharam: ${failedMethods.length}/${results.methods.length}`);
    failedMethods.forEach(m => {
      console.log(`   - ${m.name}`);
    });
    console.log("");
  }

  if (results.bestMethod) {
    console.log("🎯 MELHOR MÉTODO ENCONTRADO:", results.bestMethod);
    const bestData = successfulMethods.find(m => m.name === results.bestMethod);

    if (bestData?.data) {
      console.log("");
      console.log("📦 DADOS DO PRODUTO:");
      console.table({
        "ID": bestData.data.id || bestData.data.product_id || "N/A",
        "Nome": bestData.data.title || bestData.data.name || "N/A",
        "Preço": bestData.data.price || "N/A",
        "Imagem": bestData.data.featured_image || bestData.data.image || foundImage || "N/A",
        "Variantes": bestData.data.variants?.length || "N/A",
      });
      console.log("");
      console.log("📋 Objeto completo:");
      console.log(bestData.data);
    }

    console.log("");
    console.log("💡 RECOMENDAÇÃO:");
    console.log(`   Use o método "${results.bestMethod}" no seu script.`);
    console.log("");
    console.log("📝 Código sugerido:");
    console.log(`
    function getProductData() {
      // Priorizar: ${results.bestMethod}
      ${successfulMethods.slice(0, 3).map(m => `// Fallback: ${m.name}`).join('\n      ')}
    }
    `);
  } else {
    console.log("⚠️ NENHUM MÉTODO FUNCIONOU!");
    console.log("");
    console.log("🔍 Informações de Debug:");
    console.log("   URL atual:", window.location.href);
    console.log("   Tema Shopify:", document.querySelector('link[href*="theme"]')?.href || "não identificado");
    console.log("");
    console.log("📋 Todos os scripts na página:");
    const scripts = Array.from(document.querySelectorAll('script[type="application/json"], script[type="application/ld+json"]'));
    scripts.forEach((script, i) => {
      console.log(`   Script ${i + 1}:`, {
        type: script.type,
        id: script.id,
        class: script.className,
        dataAttributes: Object.keys(script.dataset),
        length: script.textContent.length,
      });
    });
    console.log("");
    console.log("💡 SOLUÇÃO ALTERNATIVA:");
    console.log("   Use a Cart API da Shopify: fetch('/cart.js')");
  }

  console.log("");
  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║  TESTE CONCLUÍDO                                              ║");
  console.log("╚════════════════════════════════════════════════════════════════╝");
  console.log("");
  console.log("💾 Para salvar os resultados, execute:");
  console.log("   copy(JSON.stringify(window.testResults, null, 2))");
  console.log("");

  // Salvar resultados globalmente
  window.testResults = {
    url: window.location.href,
    timestamp: new Date().toISOString(),
    results: results,
    successfulMethods: successfulMethods.map(m => m.name),
    bestMethod: results.bestMethod,
    productData: successfulMethods[0]?.data || null,
  };

  return window.testResults;
})();
