/**
 * Editorial Expander
 * 
 * Expande placeholders de seções chamando Groq SEPARADAMENTE para cada uma
 * 
 * PROBLEMA RESOLVIDO:
 * - Groq truncava JSON quando HTML ficava muito grande
 * - Agora cada seção tem 8000 tokens SÓ para ela
 * 
 * FUNCIONAMENTO:
 * 1. Detecta placeholders: {{INGREDIENTES}}, {{MODO_PREPARO}}, etc
 * 2. Para cada placeholder, chama Groq com prompt específico
 * 3. Substitui placeholder pelo conteúdo gerado
 * 4. Retorna HTML completo
 */

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.1-70b-versatile";

interface SectionPromptConfig {
    sectionName: string;
    placeholder: string;
    promptTemplate: (context: string) => string;
}

/**
 * Configuração de prompts por tipo de seção
 */
const SECTION_CONFIGS: SectionPromptConfig[] = [
    {
        sectionName: "Ingredientes",
        placeholder: "{{INGREDIENTES}}",
        promptTemplate: (recipeTitle: string) => `
Gere uma lista COMPLETA e DETALHADA de ingredientes para: "${recipeTitle}".

INSTRUÇÕES:
- Liste TODOS os ingredientes necessários
- Inclua quantidades precisas (gramas, ml, unidades)
- Use formato HTML com <ul> e <li>
- Use <strong> para destacar quantidades
- Mínimo 8 ingredientes, máximo 15
- Seja específico (ex: "200g de queijo minas ralado", não só "queijo")

FORMATO ESPERADO:
<ul style="line-height: 2;">
  <li><strong>500g</strong> de feijão preto</li>
  <li><strong>1 kg</strong> de carne de porco em cubos</li>
  ...
</ul>

RETORNE APENAS O HTML, SEM EXPLICAÇÕES.
`
    },
    {
        sectionName: "Modo de Preparo",
        placeholder: "{{MODO_PREPARO}}",
        promptTemplate: (recipeTitle: string) => `
Gere PASSO A PASSO COMPLETO e DETALHADO do modo de preparo para: "${recipeTitle}".

INSTRUÇÕES:
- Liste TODOS os passos necessários na ordem correta
- Seja MUITO detalhado (tempos, temperaturas, técnicas)
- Use formato HTML com <ol> e <li>
- MÍNIMO 8 passos, ideal 10-15
- Inclua dicas práticas em cada passo
- Use <strong> para destacar informações importantes

FORMATO ESPERADO:
<ol style="line-height: 2.5;">
  <li>Deixe o feijão de molho em água por <strong>12 horas</strong>, trocando a água 2 vezes</li>
  <li>Em uma panela grande, refogue as carnes em <strong>2 colheres de óleo</strong> até dourar</li>
  <li>Adicione o feijão escorrido e <strong>2 litros de água</strong>, deixe ferver</li>
  ...
</ol>

NÃO ABREVIE! SEJA EXTREMAMENTE DETALHADO!
RETORNE APENAS O HTML, SEM EXPLICAÇÕES.
`
    },
    {
        sectionName: "Informação Nutricional",
        placeholder: "{{INFO_NUTRICIONAL}}",
        promptTemplate: (recipeTitle: string) => `
Gere uma TABELA NUTRICIONAL COMPLETA para: "${recipeTitle}".

INSTRUÇÕES:
- Crie tabela HTML profissional
- Inclua: Calorias, Proteínas, Carboidratos, Gorduras, Fibras, Sódio
- Use valores realistas para 1 porção
- Estilize com cores alternadas nas linhas

FORMATO ESPERADO:
<table style="width: 100%; border-collapse: collapse;">
  <thead>
    <tr style="background: #F3E5F5;">
      <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Nutriente</th>
      <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Quantidade por Porção</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid #ddd; padding: 8px;">Calorias</td>
      <td style="border: 1px solid #ddd; padding: 8px;">450 kcal</td>
    </tr>
    <tr style="background: #FAFAFA;">
      <td style="border: 1px solid #ddd; padding: 8px;">Proteínas</td>
      <td style="border: 1px solid #ddd; padding: 8px;">35g</td>
    </tr>
    ...
  </tbody>
</table>

RETORNE APENAS O HTML DA TABELA, SEM EXPLICAÇÕES.
`
    },
    {
        sectionName: "Dicas e Variações",
        placeholder: "{{DICAS}}",
        promptTemplate: (recipeTitle: string) => `
Gere DICAS PRÁTICAS e VARIAÇÕES para: "${recipeTitle}".

INSTRUÇÕES:
- Mínimo 3 dicas práticas
- Mínimo 2 variações da receita
- Use <div> coloridos para destacar
- Seja criativo mas prático

FORMATO ESPERADO:
<div style="background: #FFF9C4; border-left: 4px solid #FFC107; padding: 15px; margin: 20px 0;">
  <h3 style="margin-top: 0;">💡 Dicas Importantes</h3>
  <ul>
    <li>Para um sabor mais intenso, deixe marinar por 24 horas</li>
    <li>Congele em porções individuais para praticidade</li>
    ...
  </ul>
</div>

<div style="background: #E8F5E9; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0;">
  <h3 style="margin-top: 0;">🔄 Variações</h3>
  <ul>
    <li><strong>Versão Vegetariana:</strong> Substitua as carnes por proteína de soja texturizada</li>
    ...
  </ul>
</div>

RETORNE APENAS O HTML, SEM EXPLICAÇÕES.
`
    }
];

/**
 * Chama Groq para gerar conteúdo de uma seção específica
 */
async function callGroqForSection(
    apiKey: string,
    sectionConfig: SectionPromptConfig,
    context: string
): Promise<string> {
    console.log(`🔄 [EXPANDER] Gerando conteúdo: ${sectionConfig.sectionName}...`);

    const prompt = sectionConfig.promptTemplate(context);

    const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: GROQ_MODEL,
            messages: [
                {
                    role: "system",
                    content: "Você é um chef profissional especializado em criar receitas completas e detalhadas. Retorne APENAS HTML, sem markdown ou explicações."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.7, // Mais criativo para conteúdo
            max_tokens: 8000, // MUITO espaço para esta seção
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        console.error(`❌ [EXPANDER] Erro ao gerar ${sectionConfig.sectionName}:`, error);
        throw new Error(`Groq API Error: ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();

    console.log(`✅ [EXPANDER] ${sectionConfig.sectionName} gerado: ${content.length} bytes`);

    return content;
}

/**
 * FUNÇÃO PRINCIPAL: Expande todos os placeholders no HTML
 * 
 * @param html - HTML com placeholders
 * @param groqApiKey - Chave da API Groq
 * @param context - Contexto (ex: "Receita de Feijoada")
 * @returns HTML com placeholders substituídos por conteúdo real
 */
export async function expandPlaceholders(
    html: string,
    groqApiKey: string,
    context: string
): Promise<string> {
    console.log("🔍 [EXPANDER] Iniciando expansão de placeholders...");

    let expandedHtml = html;
    let sectionsExpanded = 0;

    // Para cada configuração de seção
    for (const config of SECTION_CONFIGS) {
        // Verificar se placeholder existe no HTML
        if (expandedHtml.includes(config.placeholder)) {
            console.log(`📝 [EXPANDER] Placeholder encontrado: ${config.placeholder}`);

            try {
                // Gerar conteúdo para esta seção
                const sectionContent = await callGroqForSection(groqApiKey, config, context);

                // Substituir placeholder
                expandedHtml = expandedHtml.replace(config.placeholder, sectionContent);
                sectionsExpanded++;

                console.log(`✅ [EXPANDER] Placeholder ${config.placeholder} expandido`);
            } catch (error) {
                console.error(`❌ [EXPANDER] Falha ao expandir ${config.placeholder}:`, error);
                // Substituir por mensagem de erro visível
                expandedHtml = expandedHtml.replace(
                    config.placeholder,
                    `<p style="color: red;">⚠️ Erro ao gerar ${config.sectionName}. Tente novamente.</p>`
                );
            }
        }
    }

    console.log(`✅ [EXPANDER] Expansão concluída: ${sectionsExpanded} seções expandidas`);
    console.log(`📄 [EXPANDER] HTML final: ${expandedHtml.length} bytes`);

    return expandedHtml;
}

/**
 * Detecta se HTML contém placeholders que precisam ser expandidos
 */
export function hasPlaceholders(html: string): boolean {
    return SECTION_CONFIGS.some(config => html.includes(config.placeholder));
}
