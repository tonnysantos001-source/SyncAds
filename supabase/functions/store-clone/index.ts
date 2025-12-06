import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handlePreflightRequest } from "../_utils/cors.ts";

/**
 * Store Cloning Workflow
 * 
 * Complete workflow to clone an e-commerce store:
 * 1. Scrape products from source store
 * 2. Download product images
 * 3. Generate CSV/Shopify format
 * 4. Optionally import to Shopify
 */

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return handlePreflightRequest();
    }

    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            throw new Error("Missing authorization");
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const pythonServiceUrl = Deno.env.get("PYTHON_SERVICE_URL")!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const token = authHeader.replace("Bearer ", "");
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            throw new Error("Unauthorized");
        }

        const { action, ...params } = await req.json();

        console.log("🏪 [Store Clone] Action:", action, params);

        switch (action) {
            case "SCRAPE_STORE":
                return await scrapeStore(pythonServiceUrl, user.id, params, authHeader);

            case "GENERATE_CSV":
                return await generateCSV(supabase, user.id, params);

            case "IMPORT_TO_SHOPIFY":
                return await importToShopify(supabase, user.id, params);

            case "CLONE_COMPLETE":
                return await completeClone(supabase, pythonServiceUrl, user.id, params, authHeader);

            default:
                throw new Error(`Unknown action: ${action}`);
        }
    } catch (error: any) {
        console.error("❌ [Store Clone] Error:", error);

        return new Response(
            JSON.stringify({
                error: error.message,
                details: error.stack,
            }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
});

// ============================================
// SCRAPE STORE
// ============================================
async function scrapeStore(pythonUrl: string, userId: string, params: any, authHeader: string) {
    const { storeUrl, productSelectors } = params;

    if (!storeUrl) {
        throw new Error("storeUrl is required");
    }

    console.log("🕷️ Scraping store:", storeUrl);

    // Call browser automation to scrape products
    const automationUrl = `${pythonUrl}/api/browser-automation/session/${userId}/scrape-products`;

    // Default selectors for common e-commerce platforms
    const defaultSelectors = {
        container: ".product, .product-item, .product-card, [data-product]",
        name: "h1, h2, h3, .product-title, .product-name, [class*='title']",
        price: ".price, .product-price, [class*='price'], [itemprop='price']",
        image: "img[src*='product'], img[src*='cdn'], .product-image img",
        description: ".description, .product-description, [class*='description']",
        sku: "[class*='sku'], [data-sku]",
        link: "a.product-link, a[href*='product']",
    };

    const selectors = productSelectors || defaultSelectors;

    const response = await fetch(automationUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": authHeader,
        },
        body: JSON.stringify({
            url: storeUrl,
            product_selectors: selectors,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Scraping failed: ${error}`);
    }

    const data = await response.json();

    return new Response(
        JSON.stringify({
            success: true,
            products: data.products || [],
            count: data.count || 0,
            storeUrl: storeUrl,
            message: `${data.count} produtos encontrados!`,
        }),
        {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
    );
}

// ============================================
// GENERATE CSV
// ============================================
async function generateCSV(supabase: any, userId: string, params: any) {
    const { products, format = "shopify" } = params;

    if (!Array.isArray(products) || products.length === 0) {
        throw new Error("Products array is required");
    }

    console.log("📄 Generating CSV for", products.length, "products");

    let csvContent = "";

    if (format === "shopify") {
        // Shopify CSV format
        csvContent = "Handle,Title,Body (HTML),Vendor,Type,Tags,Published,Option1 Name,Option1 Value,Variant SKU,Variant Price,Variant Compare At Price,Variant Inventory Qty,Variant Image,Image Src,Image Position,Image Alt Text,SEO Title,SEO Description,Google Shopping / Gender,Google Shopping / Age Group,Google Shopping / MPN,Google Shopping / AdWords Grouping,Google Shopping / AdWords Labels,Google Shopping / Condition,Google Shopping / Custom Product,Google Shopping / Custom Label 0,Google Shopping / Custom Label 1,Google Shopping / Custom Label 2,Google Shopping / Custom Label 3,Google Shopping / Custom Label 4,Status\n";

        for (const product of products) {
            const handle = product.name
                ?.toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "") || "product";

            const title = product.name || "Produto sem nome";
            const description = product.description || "";
            const price = product.price?.replace(/[^\d.,]/g, "") || "0";
            const imageUrl = product.image || "";

            csvContent += `${handle},"${title}","${description}","",,"",,,,,"${price}",,,,"${imageUrl}",1,"${title}","${title}","${description}",,,,,,,,,,,,active\n`;
        }
    } else {
        // Generic CSV format
        csvContent = "Name,Price,Description,Image,SKU,Link\n";

        for (const product of products) {
            const name = (product.name || "").replace(/"/g, '""');
            const price = product.price || "";
            const description = (product.description || "").replace(/"/g, '""');
            const image = product.image || "";
            const sku = product.sku || "";
            const link = product.url || product.link || "";

            csvContent += `"${name}","${price}","${description}","${image}","${sku}","${link}"\n`;
        }
    }

    // Upload CSV to storage
    const fileName = `store-clones/${userId}/${Date.now()}-products-${format}.csv`;
    const { data: uploadData, error: uploadError } = await supabase.storage
        .from("exports")
        .upload(fileName, new TextEncoder().encode(csvContent), {
            contentType: "text/csv",
            upsert: false,
        });

    if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
        .from("exports")
        .getPublicUrl(fileName);

    return new Response(
        JSON.stringify({
            success: true,
            csvUrl: publicUrl,
            format: format,
            productCount: products.length,
            message: `CSV gerado com ${products.length} produtos!`,
        }),
        {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
    );
}

// ============================================
// IMPORT TO SHOPIFY
// ============================================
async function importToShopify(supabase: any, userId: string, params: any) {
    const { products, shopDomain } = params;

    // Get Shopify integration
    const { data: shopifyConfig } = await supabase
        .from("ShopifyIntegration")
        .select("*")
        .eq("userId", userId)
        .eq("shopDomain", shopDomain)
        .eq("isActive", true)
        .single();

    if (!shopifyConfig) {
        throw new Error("Shopify integration not found");
    }

    const results = [];

    for (const product of products) {
        try {
            // Create product in Shopify
            const shopifyUrl = `https://${shopDomain}/admin/api/2024-01/products.json`;

            const productData = {
                product: {
                    title: product.name,
                    body_html: product.description || "",
                    vendor: "Imported",
                    product_type: "General",
                    images: product.image ? [{ src: product.image }] : [],
                    variants: [{
                        price: product.price?.replace(/[^\d.,]/g, "") || "0",
                        inventory_management: "shopify",
                        inventory_quantity: 0,
                    }],
                },
            };

            const response = await fetch(shopifyUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Shopify-Access-Token": shopifyConfig.accessToken,
                },
                body: JSON.stringify(productData),
            });

            if (response.ok) {
                const data = await response.json();
                results.push({
                    success: true,
                    productId: data.product.id,
                    name: product.name,
                });
            } else {
                results.push({
                    success: false,
                    name: product.name,
                    error: await response.text(),
                });
            }
        } catch (error: any) {
            results.push({
                success: false,
                name: product.name,
                error: error.message,
            });
        }
    }

    const successCount = results.filter((r) => r.success).length;

    return new Response(
        JSON.stringify({
            success: true,
            imported: successCount,
            failed: products.length - successCount,
            total: products.length,
            results: results,
        }),
        {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
    );
}

// ============================================
// COMPLETE CLONE (ALL STEPS)
// ============================================
async function completeClone(
    supabase: any,
    pythonUrl: string,
    userId: string,
    params: any,
    authHeader: string
) {
    const { storeUrl, targetShopDomain, format = "shopify" } = params;

    console.log("🚀 Starting complete store clone...");

    // Step 1: Scrape store
    const scrapeResult = await scrapeStore(pythonUrl, userId, { storeUrl }, authHeader);
    const scrapeData = await scrapeResult.json();

    if (!scrapeData.success) {
        throw new Error("Scraping failed");
    }

    const products = scrapeData.products;

    // Step 2: Generate CSV
    const csvResult = await generateCSV(supabase, userId, { products, format });
    const csvData = await csvResult.json();

    // Step 3: Import to Shopify (if target specified)
    let importData = null;
    if (targetShopDomain) {
        const importResult = await importToShopify(supabase, userId, {
            products,
            shopDomain: targetShopDomain,
        });
        importData = await importResult.json();
    }

    return new Response(
        JSON.stringify({
            success: true,
            steps: {
                scrape: {
                    productsFound: scrapeData.count,
                    success: true,
                },
                csv: {
                    url: csvData.csvUrl,
                    success: true,
                },
                import: importData || { skipped: true },
            },
            message: `Clonagem completa! ${scrapeData.count} produtos processados.`,
        }),
        {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
    );
}
