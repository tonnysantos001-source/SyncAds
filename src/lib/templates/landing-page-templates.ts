/**
 * Landing Page Templates
 * Templates prontos para uso no Visual Editor
 */

export interface LandingPageTemplate {
    id: string;
    name: string;
    description: string;
    category: 'saas' | 'ecommerce' | 'portfolio' | 'service' | 'course';
    thumbnail: string;
    tags: string[];
    generateHTML: (data: Record<string, any>) => string;
}

export const LANDING_PAGE_TEMPLATES: LandingPageTemplate[] = [
    {
        id: 'saas-hero-cta',
        name: 'SaaS Hero + CTA',
        description: 'Landing page moderna para SaaS com hero section e call-to-action',
        category: 'saas',
        thumbnail: '🚀',
        tags: ['saas', 'modern', 'hero', 'cta'],
        generateHTML: (data) => {
            const {
                title = 'Transform Your Business with AI',
                subtitle = 'The most powerful platform for modern companies',
                ctaPrimary = 'Start Free Trial',
                ctaSecondary = 'Watch Demo',
                features = [
                    { icon: '⚡', title: 'Lightning Fast', description: 'Optimized performance' },
                    { icon: '🔒', title: 'Secure', description: 'Enterprise-grade security' },
                    { icon: '🎯', title: 'Focused', description: 'Built for results' },
                ],
            } = data;

            return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 min-h-screen">
  <!-- Hero Section -->
  <div class="container mx-auto px-4 py-16">
    <div class="max-w-5xl mx-auto text-center">
      <h1 class="text-6xl font-bold text-white mb-6 leading-tight">
        ${title}
      </h1>
      <p class="text-2xl text-gray-300 mb-10 max-w-3xl mx-auto">
        ${subtitle}
      </p>
      <div class="flex gap-4 justify-center">
        <button class="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-lg transition-all transform hover:scale-105 shadow-lg shadow-blue-600/50">
          ${ctaPrimary}
        </button>
        <button class="px-10 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold text-lg transition-all backdrop-blur-sm border border-white/20">
          ${ctaSecondary}
        </button>
      </div>
    </div>
  </div>

  <!-- Features -->
  <div class="container mx-auto px-4 py-16">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
      ${features.map(f => `
        <div class="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 hover:border-white/30 transition-all">
          <div class="text-5xl mb-4">${f.icon}</div>
          <h3 class="text-2xl font-bold text-white mb-3">${f.title}</h3>
          <p class="text-gray-400">${f.description}</p>
        </div>
      `).join('')}
    </div>
  </div>
</body>
</html>`;
        },
    },

    {
        id: 'course-landing',
        name: 'Curso Online',
        description: 'Landing page para venda de cursos e infoprodutos',
        category: 'course',
        thumbnail: '📚',
        tags: ['course', 'education', 'pricing', 'testimonials'],
        generateHTML: (data) => {
            const {
                title = 'Domine IA em 30 Dias',
                subtitle = 'Do zero ao profissional com método comprovado',
                price = 'R$ 497',
                priceOld = 'R$ 997',
                modules = '6 módulos completos',
                videoHours = '20 horas de vídeo',
                support = 'Suporte vitalício',
            } = data;

            return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gradient-to-b from-purple-900 via-gray-900 to-black min-h-screen">
  <!-- Hero -->
  <div class="container mx-auto px-4 py-20">
    <div class="max-w-4xl mx-auto text-center">
      <div class="inline-block px-4 py-2 bg-yellow-500 text-black rounded-full font-bold text-sm mb-6">
        🔥 TURMA FECHANDO EM BREVE
      </div>
      <h1 class="text-5xl md:text-7xl font-black text-white mb-6">
        ${title}
      </h1>
      <p class="text-2xl text-purple-200 mb-10">
        ${subtitle}
      </p>
    </div>
  </div>

  <!-- Pricing Card -->
  <div class="container mx-auto px-4 pb-20">
    <div class="max-w-md mx-auto bg-gradient-to-br from-purple-600 to-blue-600 rounded-3xl p-8 shadow-2xl border-4 border-yellow-400">
      <div class="text-center mb-6">
        <div class="text-gray-200 line-through text-2xl mb-2">${priceOld}</div>
        <div class="text-6xl font-black text-white mb-2">${price}</div>
        <div class="text-yellow-300 font-semibold">ou 12x de ${(parseInt(price.replace(/\D/g, '')) / 12).toFixed(0)}</div>
      </div>

      <div class="space-y-4 mb-8">
        <div class="flex items-center gap-3 text-white">
          <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
          </svg>
          <span>${modules}</span>
        </div>
        <div class="flex items-center gap-3 text-white">
          <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
          </svg>
          <span>${videoHours}</span>
        </div>
        <div class="flex items-center gap-3 text-white">
          <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
          </svg>
          <span>${support}</span>
        </div>
      </div>

      <button class="w-full py-5 bg-yellow-400 hover:bg-yellow-500 text-black rounded-xl font-black text-xl transition-all transform hover:scale-105 shadow-lg">
        QUERO COMEÇAR AGORA
      </button>

      <p class="text-center text-white/80 text-sm mt-4">
        🔒 Pagamento 100% seguro
      </p>
    </div>
  </div>
</body>
</html>`;
        },
    },

    {
        id: 'product-showcase',
        name: 'Showcase de Produto',
        description: 'Landing page para destacar produto/app com screenshots',
        category: 'ecommerce',
        thumbnail: '📱',
        tags: ['product', 'app', 'showcase', 'screenshots'],
        generateHTML: (data) => {
            const {
                title = 'O App que Você Estava Esperando',
                subtitle = 'Simplifique sua vida com tecnologia inteligente',
                appStoreUrl = '#',
                playStoreUrl = '#',
            } = data;

            return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-700 min-h-screen">
  <div class="container mx-auto px-4 py-16">
    <div class="max-w-6xl mx-auto">
      <div class="grid md:grid-cols-2 gap-12 items-center">
        <!-- Left: Content -->
        <div>
          <h1 class="text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
            ${title}
          </h1>
          <p class="text-xl text-blue-100 mb-10">
            ${subtitle}
          </p>

          <!-- Download Buttons -->
          <div class="flex flex-col sm:flex-row gap-4">
            <a href="${appStoreUrl}" class="flex items-center gap-3 px-6 py-4 bg-black hover:bg-gray-900 rounded-xl transition-all group">
              <svg class="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              <div class="text-left">
                <div class="text-xs text-gray-400">Download na</div>
                <div class="text-white font-semibold">App Store</div>
              </div>
            </a>

            <a href="${playStoreUrl}" class="flex items-center gap-3 px-6 py-4 bg-black hover:bg-gray-900 rounded-xl transition-all group">
              <svg class="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
              </svg>
              <div class="text-left">
                <div class="text-xs text-gray-400">Baixe no</div>
                <div class="text-white font-semibold">Google Play</div>
              </div>
            </a>
          </div>
        </div>

        <!-- Right: Phone Mockup -->
        <div class="relative">
          <div class="relative mx-auto w-64 h-[500px] bg-gray-900 rounded-[3rem] border-8 border-gray-800 shadow-2xl overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
              App Preview
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
        },
    },

    {
        id: 'service-professional',
        name: 'Serviço Profissional',
        description: 'Landing page para serviços profissionais (advogados, consultores, etc)',
        category: 'service',
        thumbnail: '💼',
        tags: ['service', 'professional', 'contact', 'trust'],
        generateHTML: (data) => {
            const {
                title = 'Consultoria Empresarial de Excelência',
                subtitle = 'Transformamos desafios em oportunidades de crescimento',
                phone = '(11) 9999-9999',
                email = 'contato@empresa.com',
            } = data;

            return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50">
  <!-- Header -->
  <header class="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-20">
    <div class="container mx-auto px-4">
      <div class="max-w-4xl">
        <h1 class="text-5xl font-bold mb-6">${title}</h1>
        <p class="text-2xl text-gray-300 mb-8">${subtitle}</p>
        <button class="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-lg transition-all">
          Agende uma Consulta Gratuita
        </button>
      </div>
    </div>
  </header>

  <!-- Services -->
  <section class="py-20">
    <div class="container mx-auto px-4">
      <h2 class="text-4xl font-bold text-center mb-12 text-gray-900">Nossos Serviços</h2>
      <div class="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        <div class="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all">
          <div class="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
            <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <h3 class="text-2xl font-bold mb-3 text-gray-900">Consultoria</h3>
          <p class="text-gray-600">Análise completa e estratégias personalizadas para seu negócio</p>
        </div>

        <div class="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all">
          <div class="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
            <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
          <h3 class="text-2xl font-bold mb-3 text-gray-900">Implementação</h3>
          <p class="text-gray-600">Execução ágil de soluções com foco em resultados mensuráveis</p>
        </div>

        <div class="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all">
          <div class="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mb-6">
            <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <h3 class="text-2xl font-bold mb-3 text-gray-900">Suporte</h3>
          <p class="text-gray-600">Acompanhamento contínuo para garantir seu sucesso</p>
        </div>
      </div>
    </div>
  </section>

  <!-- CTA -->
  <section class="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
    <div class="container mx-auto px-4 text-center text-white">
      <h2 class="text-4xl font-bold mb-6">Pronto para Transformar Seu Negócio?</h2>
      <p class="text-xl mb-8 max-w-2xl mx-auto">
        Entre em contato e descubra como podemos ajudar você a alcançar seus objetivos
      </p>
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <a href="tel:${phone}" class="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-all">
          📞 ${phone}
        </a>
        <a href="mailto:${email}" class="px-8 py-4 bg-white/20 hover:bg-white/30 rounded-lg font-semibold backdrop-blur-sm border border-white/30 transition-all">
          ✉️ ${email}
        </a>
      </div>
    </div>
  </section>
</body>
</html>`;
        },
    },

    {
        id: 'portfolio-minimal',
        name: 'Portfolio Minimalista',
        description: 'Portfolio clean e elegante para criativos',
        category: 'portfolio',
        thumbnail: '🎨',
        tags: ['portfolio', 'minimal', 'creative', 'personal'],
        generateHTML: (data) => {
            const {
                name = 'João Silva',
                role = 'Designer & Developer',
                bio = 'Criando experiências digitais incríveis há mais de 5 anos',
                projects = [
                    { name: 'Projeto Alpha', description: 'Design de interface' },
                    { name: 'Projeto Beta', description: 'Desenvolvimento web' },
                    { name: 'Projeto Gamma', description: 'Branding completo' },
                ],
            } = data;

            return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name} - ${role}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-white">
  <!-- Hero -->
  <div class="min-h-screen flex items-center justify-center px-4">
    <div class="max-w-4xl text-center">
      <div class="w-32 h-32 bg-gradient-to-br from-gray-800 to-gray-600 rounded-full mx-auto mb-8"></div>
      <h1 class="text-6xl md:text-8xl font-black text-gray-900 mb-4">${name}</h1>
      <p class="text-2xl md:text-3xl text-gray-600 mb-6">${role}</p>
      <p class="text-lg text-gray-500 max-w-2xl mx-auto">${bio}</p>
    </div>
  </div>

  <!-- Projects -->
  <div class="min-h-screen bg-gray-50 py-20 px-4">
    <div class="max-w-6xl mx-auto">
      <h2 class="text-5xl font-bold text-gray-900 mb-16 text-center">Projetos</h2>
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        ${projects.map((p, i) => `
          <div class="group cursor-pointer">
            <div class="aspect-video bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg mb-4 group-hover:scale-105 transition-transform"></div>
            <h3 class="text-2xl font-bold text-gray-900 mb-2">${p.name}</h3>
            <p class="text-gray-600">${p.description}</p>
          </div>
        `).join('')}
      </div>
    </div>
  </div>

  <!-- Contact -->
  <div class="py-20 px-4">
    <div class="max-w-2xl mx-auto text-center">
      <h2 class="text-5xl font-bold text-gray-900 mb-8">Vamos Trabalhar Juntos?</h2>
      <button class="px-10 py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-semibold text-lg transition-all">
        Entrar em Contato
      </button>
    </div>
  </div>
</body>
</html>`;
        },
    },
];

/**
 * Get template by ID
 */
export function getTemplateById(id: string): LandingPageTemplate | undefined {
    return LANDING_PAGE_TEMPLATES.find((t) => t.id === id);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: string): LandingPageTemplate[] {
    return LANDING_PAGE_TEMPLATES.filter((t) => t.category === category);
}

/**
 * Get all templates
 */
export function getAllTemplates(): LandingPageTemplate[] {
    return LANDING_PAGE_TEMPLATES;
}
