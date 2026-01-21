/**
 * Image Fetcher - Busca imagens do Unsplash para ilustrar documentos
 */

const UNSPLASH_ACCESS_KEY = Deno.env.get("UNSPLASH_ACCESS_KEY") || "";

interface UnsplashImage {
    urls: {
        regular: string;
        small: string;
        thumb: string;
    };
    alt_description: string;
    user: {
        name: string;
    };
}

/**
 * Busca uma imagem relevante no Unsplash
 */
export async function fetchRelevantImage(
    keyword: string,
    orientation: "landscape" | "portrait" | "squarish" = "landscape"
): Promise<string> {
    if (!UNSPLASH_ACCESS_KEY) {
        console.warn("⚠️ UNSPLASH_ACCESS_KEY not configured, using placeholder");
        return `https://via.placeholder.com/800x400/3498DB/ffffff?text=${encodeURIComponent(keyword)}`;
    }

    try {
        console.log(`🔍 Fetching Unsplash image for: ${keyword}`);

        const response = await fetch(
            `https://api.unsplash.com/search/photos?query=${encodeURIComponent(keyword)}&per_page=1&orientation=${orientation}`,
            {
                headers: {
                    Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
                },
            }
        );

        if (!response.ok) {
            throw new Error(`Unsplash API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.results && data.results.length > 0) {
            const image: UnsplashImage = data.results[0];
            console.log(`✅ Found image by ${image.user.name}`);
            return image.urls.regular;
        }

        console.warn(`⚠️ No image found for "${keyword}", using placeholder`);
        return `https://via.placeholder.com/800x400/3498DB/ffffff?text=${encodeURIComponent(keyword)}`;
    } catch (error) {
        console.error(`❌ Error fetching Unsplash image:`, error);
        return `https://via.placeholder.com/800x400/E74C3C/ffffff?text=Error`;
    }
}

/**
 * Processa HTML substituindo placeholders {{IMAGE:keyword}} por URLs reais
 */
export async function processImagePlaceholders(html: string): Promise<string> {
    console.log("🎨 Processing image placeholders...");

    const imageRegex = /\{\{IMAGE:([^}]+)\}\}/g;
    const matches = [...html.matchAll(imageRegex)];

    if (matches.length === 0) {
        console.log("ℹ️ No image placeholders found");
        return html;
    }

    console.log(`📸 Found ${matches.length} image placeholder(s)`);

    let processedHtml = html;

    for (const match of matches) {
        const keyword = match[1].trim();
        const imageUrl = await fetchRelevantImage(keyword);

        // Substituir placeholder pela tag <img> completa
        const imgTag = `<img src="${imageUrl}" alt="${keyword}" style="width: 100%; max-width: 700px; border-radius: 8px; margin: 20px 0; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">`;

        processedHtml = processedHtml.replace(match[0], imgTag);
        console.log(`✅ Replaced {{IMAGE:${keyword}}} with image URL`);
    }

    console.log("✅ Image processing complete");
    return processedHtml;
}

/**
 * Template de ebook profissional
 */
export function generateEbookTemplate(title: string, author: string = "SyncAds AI"): string {
    return `
<!-- CAPA -->
<div style="text-align: center; padding: 80px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; page-break-after: always; border-radius: 12px; margin-bottom: 40px;">
  <h1 style="font-size: 56px; font-family: 'Georgia', serif; margin: 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">
    ${title}
  </h1>
  <p style="font-size: 20px; margin-top: 30px; opacity: 0.9;">
    ${author}
  </p>
  <div style="margin-top: 60px;">
    {{IMAGE:${title} book cover}}
  </div>
</div>

<!-- ESTRUTURA SERÁ ADICIONADA PELA AI -->
`;
}

// Export para uso em outras Edge Functions
export { fetchRelevantImage as default };
