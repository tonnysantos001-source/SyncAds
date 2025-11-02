# 🔍 GUIA DE SOLUÇÕES BASEADO EM LOGS

> **Como usar este guia:**
> 1. Faça o teste na loja Shopify com DevTools aberto
> 2. Observe os logs no console
> 3. Identifique qual cenário está acontecendo
> 4. Aplique a solução correspondente

---

## 📊 CENÁRIO 1: Nome e Imagem aparecem VAZIOS desde o início

### **O que você verá no console:**

```
🔍 [DEBUG] Tentando obter dados do produto...
⚠️ [DEBUG] Nenhum método de captura de produto funcionou
🔍 [DEBUG] Elementos disponíveis no DOM:
  hasProductJson: false
  hasShopifyAnalytics: false
  hasMetaTags: false
```

### **Problema:**
O script não está conseguindo capturar os dados do produto do DOM da Shopify.

### **Solução 1A: Adicionar método via Fetch API**

Editar `getProductData()` no script:

```javascript
function getProductData() {
  try {
    // Métodos existentes...
    
    // NOVO: Método 4 - Fetch direto da API Shopify
    const productHandle = window.location.pathname.split('/products/')[1]?.split('?')[0];
    if (productHandle) {
      console.log("🔍 [DEBUG] Buscando produto via API:", productHandle);
      
      // Fazer fetch síncrono (não ideal, mas funciona)
      const xhr = new XMLHttpRequest();
      xhr.open('GET', `/products/${productHandle}.js`, false);
      xhr.send();
      
      if (xhr.status === 200) {
        const product = JSON.parse(xhr.responseText);
        console.log("✅ [DEBUG] Produto encontrado via .js API:", product);
        return product;
      }
    }
    
    return null;
  } catch (error) {
    console.error("🔴 [DEBUG] Erro:", error);
    return null;
  }
}
```

### **Solução 1B: Usar tema-specific selectors**

Adicione ao início de `getProductData()`:

```javascript
// Método específico para alguns temas populares
const themeSelectors = [
  { selector: '.product-json', parse: true },
  { selector: '[data-product]', parse: true },
  { selector: '#ProductJson', parse: true },
  { selector: '.product__info-container [type="application/json"]', parse: true }
];

for (const { selector, parse } of themeSelectors) {
  const element = document.querySelector(selector);
  if (element) {
    try {
      const data = parse ? JSON.parse(element.textContent) : element.textContent;
      console.log(`✅ [DEBUG] Produto via ${selector}:`, data);
      return data;
    } catch (e) {
      continue;
    }
  }
}
```

---

## 📊 CENÁRIO 2: Nome fica "undefined - undefined"

### **O que você verá no console:**

```
✅ [DEBUG] Product Data montado para carrinho:
  nome: "undefined - undefined"
  imagem: "https://cdn.shopify.com/..."
  preco: 18.00
```

### **Problema:**
O `product.title` ou `variant.title` está undefined.

### **Solução 2: Corrigir lógica do nome**

Substituir a linha que monta o `name` em `handleAddToCart()`:

```javascript
// ANTES:
name: variant ? `${product.title} - ${variant.title}` : product.title,

// DEPOIS:
name: (() => {
  const productTitle = product.title || product.name || "Produto";
  const variantTitle = variant?.title || variant?.name || variant?.option1;
  
  if (variant && variantTitle && variantTitle !== 'Default Title') {
    return `${productTitle} - ${variantTitle}`;
  }
  return productTitle;
})(),
```

---

## 📊 CENÁRIO 3: Imagem não aparece (vazia ou undefined)

### **O que você verá no console:**

```
✅ [DEBUG] Product Data montado para carrinho:
  nome: "Camisa Sonic"
  imagem: "" (vazio)
  preco: 18.00
```

### **Problema:**
O produto não tem `featured_image` ou a propriedade está com nome diferente.

### **Solução 3: Melhorar lógica da imagem**

Substituir a linha que monta o `image` em `handleAddToCart()`:

```javascript
// ANTES:
image: product.featured_image || product.image || (product.images && product.images[0]) || "",

// DEPOIS:
image: (() => {
  // Tentar múltiplas propriedades
  if (product.featured_image) return product.featured_image;
  if (product.image) return product.image;
  if (variant?.featured_image) return variant.featured_image;
  if (variant?.image) return variant.image;
  if (Array.isArray(product.images) && product.images.length > 0) {
    return product.images[0].src || product.images[0];
  }
  if (product.media?.[0]?.src) return product.media[0].src;
  
  // Fallback: tentar pegar do DOM
  const imgElement = document.querySelector('.product__main-photos img, .product-single__photo img, [data-product-featured-image]');
  if (imgElement?.src) return imgElement.src;
  
  return "";
})(),
```

---

## 📊 CENÁRIO 4: Dados CORRETOS no browser, mas VAZIOS na Edge Function

### **O que você verá:**

**Console do Browser:**
```
✅ [DEBUG] Payload enviado para API:
  items[0].name: "Camisa Sonic"
  items[0].image: "https://..."
```

**Logs da Edge Function:**
```
⚠️ [DEBUG] Produto com dados faltando:
  hasName: false
  hasImage: false
```

### **Problema:**
Dados estão sendo perdidos na transmissão (possível problema de CORS ou serialização).

### **Solução 4A: Verificar CORS**

Verificar se a Edge Function está retornando headers CORS corretos. Já está correto no arquivo `_utils/cors.ts`.

### **Solução 4B: Enriquecer na Edge Function**

Adicionar na Edge Function APÓS receber os produtos:

```typescript
// Logo após a validação dos produtos, ANTES de preparar items
console.log("🔍 [DEBUG] Tentando enriquecer produtos sem dados...");

for (const p of products) {
  if (!p.name || !p.image) {
    try {
      // Buscar via Admin API
      const productResponse = await fetch(
        `https://${shopDomain}/admin/api/2024-01/products/${p.productId}.json`,
        {
          headers: {
            'X-Shopify-Access-Token': integration.accessToken,
          },
        }
      );

      if (productResponse.ok) {
        const { product } = await productResponse.json();
        
        if (!p.name) {
          p.name = product.title;
          console.log(`✅ [DEBUG] Nome enriquecido: ${p.name}`);
        }
        
        if (!p.image && product.images?.[0]) {
          p.image = product.images[0].src;
          console.log(`✅ [DEBUG] Imagem enriquecida: ${p.image}`);
        }
      }
    } catch (error) {
      console.error(`❌ [DEBUG] Erro ao enriquecer produto ${p.productId}:`, error);
    }
  }
}
```

---

## 📊 CENÁRIO 5: Dados CORRETOS no banco, mas VAZIOS no checkout

### **O que você verá:**

**Query no banco:**
```sql
SELECT items FROM "Order" WHERE id = '...';
-- Retorna: [{"name": "Camisa Sonic", "image": "https://..."}]
```

**Mas no checkout aparece:** "undefined - undefined"

### **Problema:**
Frontend não está lendo corretamente o campo `items`.

### **Solução 5: Verificar mapeamento no checkout**

Editar `src/pages/public/MobileCheckoutPage.tsx` (linha ~155):

```typescript
// SUBSTITUIR o mapeamento atual por:
products: items.map((item: any) => {
  // Tentar múltiplas fontes de dados
  const original = originalProducts.find(
    (op: any) =>
      String(op?.variantId) === String(item.variantId) ||
      String(op?.productId) === String(item.productId)
  );
  
  // Priorizar dados salvos no item
  const name = item.name || 
               original?.name || 
               original?.title || 
               "Produto sem nome";
  
  const image = item.image || 
                original?.image || 
                original?.featured_image ||
                (Array.isArray(original?.images) && original.images[0]?.src) ||
                "";

  console.log("🔍 [DEBUG] Produto mapeado:", { 
    itemName: item.name,
    originalName: original?.name,
    finalName: name,
    itemImage: item.image,
    finalImage: image
  });

  return {
    id: item.productId || item.id,
    name: name,
    price: Number(item.price) || 0,
    quantity: Number(item.quantity) || 1,
    image: image,
    sku: item.sku || original?.sku || "",
  };
}),
```

---

## 🚀 SOLUÇÃO DEFINITIVA (Se nada funcionar)

### **Usar Cart API da Shopify**

Em vez de capturar do DOM, use a Cart API nativa:

```javascript
async function getCartData() {
  try {
    const response = await fetch('/cart.js');
    const cart = await response.json();
    
    console.log("🔍 [DEBUG] Cart API:", cart);
    
    return cart.items.map(item => ({
      productId: String(item.product_id),
      variantId: String(item.variant_id),
      name: item.product_title + (item.variant_title !== 'Default Title' ? ` - ${item.variant_title}` : ''),
      price: item.price / 100,
      quantity: item.quantity,
      image: item.image || item.featured_image?.url || "",
      sku: item.sku,
    }));
  } catch (error) {
    console.error("Erro ao buscar carrinho:", error);
    return [];
  }
}

// Usar no proceedToCheckout:
async function proceedToCheckout() {
  // ...
  const cartItems = await getCartData();
  
  const response = await fetch(CONFIG.API_URL, {
    // ...
    body: JSON.stringify({
      shopifyDomain: shopDomain,
      items: cartItems, // ← Usar dados da Cart API
      // ...
    }),
  });
}
```

---

## 📋 COMANDOS ÚTEIS

### Ver logs em tempo real da Edge Function:
```bash
supabase functions logs shopify-create-order --project-ref ovskepqggmxlfckxqgbr --tail
```

### Query para ver último pedido:
```sql
SELECT 
  id, 
  "orderNumber",
  items,
  metadata,
  "createdAt"
FROM "Order" 
ORDER BY "createdAt" DESC 
LIMIT 1;
```

### Ver apenas items do último pedido:
```sql
SELECT 
  items->>0 as first_item,
  metadata->'originalProducts'->0 as first_original
FROM "Order" 
ORDER BY "createdAt" DESC 
LIMIT 1;
```

---

## ✅ DEPOIS DE APLICAR A SOLUÇÃO

1. **Limpar cache:** Ctrl+Shift+R
2. **Testar novamente:** Adicionar produto ao carrinho
3. **Verificar logs:** Console deve mostrar dados corretos
4. **Confirmar no checkout:** Nome e imagem devem aparecer
5. **Remover logs de debug** quando tudo funcionar (criar versão 4.2 sem logs)

---

## 🆘 AINDA NÃO FUNCIONOU?

Compartilhe:
1. Print dos logs do console (todos os 🔍 [DEBUG])
2. Logs da Edge Function (comando acima)
3. Query do banco (SELECT items FROM "Order" ...)
4. URL da página do produto onde testou
5. Tema da Shopify que está usando

Com essas informações, posso criar uma solução específica para seu caso!