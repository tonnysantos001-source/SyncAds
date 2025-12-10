/**
 * Templates Library - Complete Professional Templates
 * 10 templates prontos para uso imediato
 */

export interface Template {
  id: string;
  name: string;
  category: string;
  tags: string[];
  preview: string;
  description: string;
  code: () => string;
}

// ========================================
// TEMPLATE: SAAS LANDING PAGE
// ========================================

export const SAAS_LANDING: Template = {
  id: 'saas-landing',
  name: 'SaaS Landing Page',
  category: 'landing',
  tags: ['saas', 'landing', 'modern'],
  preview: '/templates/sa as.png',
  description: 'Landing page completa para produto SaaS',
  code: () => `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SaaS App - Transforme Seu Negócio</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50">
  <!-- Navbar -->
  <nav class="bg-white shadow-lg sticky top-0 z-50">
    <div class="container mx-auto px-4">
      <div class="flex items-center justify-between h-16">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg"></div>
          <span class="text-xl font-bold">SaaS App</span>
        </div>
        <div class="hidden md:flex items-center gap-8">
          <a href="#features" class="text-gray-700 hover:text-blue-600">Features</a>
          <a href="#pricing" class="text-gray-700 hover:text-blue-600">Preços</a>
          <a href="#contact" class="text-gray-700 hover:text-blue-600">Contato</a>
        </div>
        <button class="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:scale-105 transition">
          Começar Grátis
        </button>
      </div>
    </div>
  </nav>

  <!-- Hero -->
  <section class="min-h-screen flex items-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 relative overflow-hidden">
    <div class="container mx-auto px-4 text-center text-white relative z-10">
      <span class="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium mb-6">
        🚀 Novo Produto Lançado
      </span>
      <h1 class="text-6xl md:text-7xl font-bold mb-6">
        Transforme Suas Ideias em
        <span class="bg-gradient-to-r from-yellow-200 to-pink-200 bg-clip-text text-transparent"> Realidade</span>
      </h1>
      <p class="text-xl md:text-2xl mb-10 max-w-3xl mx-auto text-white/90">
        A plataforma mais avançada para criar, gerenciar e escalar seu negócio online
      </p>
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <button class="px-10 py-4 bg-white text-blue-600 rounded-lg font-semibold text-lg hover:scale-105 transition shadow-2xl">
          Começar Gratuitamente
        </button>
        <button class="px-10 py-4 bg-white/10 backdrop-blur-sm border-2 border-white text-white rounded-lg font-semibold text-lg hover:bg-white/20 transition">
          Ver Demonstração
        </button>
      </div>
    </div>
  </section>

  <!-- Features -->
  <section id="features" class="py-20 bg-gray-50">
    <div class="container mx-auto px-4">
      <div class="text-center mb-16">
        <h2 class="text-4xl md:text-5xl font-bold mb-6">Tudo que Você Precisa</h2>
        <p class="text-xl text-gray-600">Ferramentas poderosas para impulsionar seu negócio</p>
      </div>
      <div class="grid md:grid-cols-3 gap-8">
        <div class="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition">
          <div class="w-14 h-14 bg-blue-600 rounded-xl mb-6"></div>
          <h3 class="text-xl font-bold mb-3">Rápido</h3>
          <p class="text-gray-600">Performance otimizada para resultados instantâneos</p>
        </div>
        <div class="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition">
          <div class="w-14 h-14 bg-purple-600 rounded-xl mb-6"></div>
          <h3 class="text-xl font-bold mb-3">Seguro</h3>
          <p class="text-gray-600">Criptografia de ponta para seus dados</p>
        </div>
        <div class="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition">
          <div class="w-14 h-14 bg-green-600 rounded-xl mb-6"></div>
          <h3 class="text-xl font-bold mb-3">Confiável</h3>
          <p class="text-gray-600">99.9% uptime e suporte 24/7</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Pricing -->
  <section id="pricing" class="py-20 bg-white">
    <div class="container mx-auto px-4">
      <div class="text-center mb-16">
        <h2 class="text-4xl font-bold mb-4">Escolha Seu Plano</h2>
        <p class="text-xl text-gray-600">Preços transparentes e flexíveis</p>
      </div>
      <div class="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        <div class="bg-white p-8 rounded-2xl shadow-lg border-2 border-gray-200">
          <h3 class="text-2xl font-bold mb-2">Basic</h3>
          <div class="mb-8"><span class="text-5xl font-bold">R$ 29</span><span class="text-gray-600">/mës</span></div>
          <button class="w-full px-6 py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800">Começar</button>
        </div>
        <div class="bg-gradient-to-br from-blue-600 to-purple-600 p-8 rounded-2xl shadow-2xl transform scale-105">
          <h3 class="text-2xl font-bold text-white mb-2">Pro</h3>
          <div class="mb-8"><span class="text-5xl font-bold text-white">R$ 99</span><span class="text-white/90">/mês</span></div>
          <button class="w-full px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-50">Começar</button>
        </div>
        <div class="bg-white p-8 rounded-2xl shadow-lg border-2 border-gray-200">
          <h3 class="text-2xl font-bold mb-2">Enterprise</h3>
          <div class="mb-8"><span class="text-5xl font-bold">Custom</span></div>
          <button class="w-full px-6 py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800">Falar com Vendas</button>
        </div>
      </div>
    </div>
  </section>

  <!-- CTA -->
  <section class="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
    <div class="container mx-auto px-4 text-center">
      <h2 class="text-4xl font-bold text-white mb-6">Pronto para Começar?</h2>
      <p class="text-xl text-white/90 mb-10">Junte-se a milhares de empresas de sucesso</p>
      <button class="px-10 py-5 bg-white text-blue-600 rounded-lg font-bold text-lg hover:scale-105 transition shadow-2xl">
        Começar Gratuitamente
      </button>
    </div>
  </section>

  <!-- Footer -->
  <footer class="bg-gray-900 text-white pt-16 pb-8">
    <div class="container mx-auto px-4">
      <div class="border-t border-white/10 pt-8 text-center">
        <p class="text-gray-400">© 2024 SaaS App. Todos os direitos reservados.</p>
      </div>
    </div>
  </footer>
</body>
</html>`
};

// ========================================
// TEMPLATE: E-COMMERCE
// ========================================

export const ECOMMERCE_TEMPLATE: Template = {
  id: 'ecommerce-store',
  name: 'E-commerce Store',
  category: 'ecommerce',
  tags: ['ecommerce', 'shop', 'products'],
  preview: '/templates/ecommerce.png',
  description: 'Loja virtual completa com produtos',
  code: () => `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Loja Virtual - Os Melhores Produtos</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50">
  <!-- Navbar -->
  <nav class="bg-white shadow-md sticky top-0 z-50">
    <div class="container mx-auto px-4">
      <div class="flex items-center justify-between h-16">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-gradient-to-br from-green-600 to-blue-600 rounded-lg"></div>
          <span class="text-xl font-bold">MegaStore</span>
        </div>
        <div class="hidden md:flex items-center gap-8">
          <a href="#products" class="text-gray-700 hover:text-green-600">Produtos</a>
          <a href="#categories" class="text-gray-700 hover:text-green-600">Categorias</a>
          <a href="#about" class="text-gray-700 hover:text-green-600">Sobre</a>
        </div>
        <div class="flex items-center gap-4">
          <button class="relative p-2">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
            <span class="absolute -top-1 -right-1 w-5 h-5 bg-green-600 text-white text-xs rounded-full flex items-center justify-center">3</span>
          </button>
        </div>
      </div>
    </div>
  </nav>

  <!-- Hero -->
  <section class="bg-gradient-to-r from-green-600 to-blue-600 text-white py-20">
    <div class="container mx-auto px-4 text-center">
      <h1 class="text-5xl font-bold mb-6">Mega Promoção de Verão</h1>
      <p class="text-xl mb-8">Até 50% OFF em produtos selecionados</p>
      <button class="px-10 py-4 bg-white text-green-600 rounded-lg font-bold text-lg hover:scale-105 transition">Ver Ofertas</button>
    </div>
  </section>

  <!-- Products Grid -->
  <section id="products" class="py-20">
    <div class="container mx-auto px-4">
      <h2 class="text-4xl font-bold mb-12 text-center">Produtos em Destaque</h2>
      <div class="grid md:grid-cols-4 gap-8">
        ${Array.from({ length: 8 }).map((_, i) => `
        <div class="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition group">
          <div class="aspect-square bg-gray-200 relative overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
              <span class="text-gray-500 text-sm">Produto ${i + 1}</span>
            </div>
            <span class="absolute top-4 right-4 px-3 py-1 bg-red-600 text-white text-sm font-bold rounded-full">-30%</span>
          </div>
          <div class="p-4">
            <h3 class="font-bold text-lg mb-2">Produto Incrível ${i + 1}</h3>
            <div class="flex items-center gap-2 mb-3">
              <span class="text-gray-400 line-through">R$ 199</span>
              <span class="text-green-600 font-bold text-xl">R$ 139</span>
            </div>
            <button class="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition">Adicionar ao Carrinho</button>
          </div>
        </div>
        `).join('')}
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="bg-gray-900 text-white pt-16 pb-8">
    <div class="container mx-auto px-4 text-center">
      <p class="text-gray-400">© 2024 MegaStore. Todos os direitos reservados.</p>
    </div>
  </footer>
</body>
</html>`
};

// ========================================
// TEMPLATE: PORTFOLIO
// ========================================

export const PORTFOLIO_TEMPLATE: Template = {
  id: 'portfolio-creative',
  name: 'Creative Portfolio',
  category: 'portfolio',
  tags: ['portfolio', 'creative', 'designer'],
  preview: '/templates/portfolio.png',
  description: 'Portfolio criativo para designers',
  code: () => `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Portfolio - Designer Criativo</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-black text-white">
  <!-- Navbar -->
  <nav class="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md">
    <div class="container mx-auto px-4">
      <div class="flex items-center justify-between h-20">
        <div class="text-2xl font-bold">João Designer</div>
        <div class="hidden md:flex items-center gap-8">
          <a href="#work" class="hover:text-purple-400 transition">Trabalhos</a>
          <a href="#about" class="hover:text-purple-400 transition">Sobre</a>
          <a href="#contact" class="hover:text-purple-400 transition">Contato</a>
        </div>
      </div>
    </div>
  </nav>

  <!-- Hero -->
  <section class="min-h-screen flex items-center justify-center relative overflow-hidden">
    <div class="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-pink-900/20"></div>
    <div class="relative text-center z-10 px-4">
      <h1 class="text-7xl md:text-8xl font-bold mb-6">
        Designer &<br/>
        <span class="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Criativo</span>
      </h1>
      <p class="text-2xl text-gray-400 mb-10">Transformando ideias em experiências visuais</p>
      <button class="px-10 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-bold hover:scale-105 transition">Ver Portfolio</button>
    </div>
  </section>

  <!-- Portfolio Grid -->
  <section id="work" class="py-20">
    <div class="container mx-auto px-4">
      <h2 class="text-5xl font-bold mb-16 text-center">Projetos Selecionados</h2>
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        ${Array.from({ length: 6 }).map((_, i) => `
        <div class="group relative aspect-square bg-gray-900 rounded-2xl overflow-hidden cursor-pointer">
          <div class="absolute inset-0 bg-gradient-to-br from-purple-600/50 to-pink-600/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div class="text-center">
              <h3 class="text-2xl font-bold mb-2">Projeto ${i + 1}</h3>
              <p class="text-gray-200">Design UI/UX</p>
            </div>
          </div>
        </div>
        `).join('')}
      </div>
    </div>
  </section>

  <!-- CTA -->
  <section class="py-20 bg-gradient-to-r from-purple-600 to-pink-600">
    <div class="container mx-auto px-4 text-center">
      <h2 class="text-4xl font-bold mb-6">Vamos Trabalhar Juntos?</h2>
      <button class="px-10 py-4 bg-white text-purple-600 rounded-lg font-bold hover:scale-105 transition">Entre em Contato</button>
    </div>
  </section>

  <!-- Footer -->
  <footer class="bg-black border-t border-white/10 py-8">
    <div class="container mx-auto px-4 text-center text-gray-400">
      <p>© 2024 João Designer. Made with ❤️</p>
    </div>
  </footer>
</body>
</html>`
};

// ========================================
// TEMPLATE: BLOG
// ========================================

export const BLOG_TEMPLATE: Template = {
  id: 'blog-minimal',
  name: 'Minimal Blog',
  category: 'blog',
  tags: ['blog', 'minimal', 'articles'],
  preview: '/templates/blog.png',
  description: 'Blog minimalista moderno',
  code: () => `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Blog - Insights e Histórias</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-white">
  <!-- Navbar -->
  <nav class="border-b border-gray-200">
    <div class="container mx-auto px-4">
      <div class="flex items-center justify-between h-20">
        <div class="text-3xl font-serif font-bold">TheBlog</div>
        <div class="hidden md:flex items-center gap-8">
          <a href="#" class="text-gray-600 hover:text-gray-900">Home</a>
          <a href="#" class="text-gray-600 hover:text-gray-900">Sobre</a>
          <a href="#" class="text-gray-600 hover:text-gray-900">Contato</a>
        </div>
      </div>
    </div>
  </nav>

  <!-- Featured Post -->
  <section class="py-20">
    <div class="container mx-auto px-4 max-w-4xl">
      <div class="mb-12">
        <span class="text-sm font-semibold text-blue-600 uppercase tracking-wide">Destaque</span>
        <h1 class="text-5xl font-serif font-bold my-6">Como a IA está Transformando o Design Moderno</h1>
        <div class="flex items-center gap-6 text-gray-600">
          <span>Por João Silva</span>
          <span>•</span>
          <span>10 min de leitura</span>
          <span>•</span>
          <span>10 Jan 2024</span>
        </div>
      </div>
      <div class="aspect-video bg-gray-200 rounded-xl mb-12"></div>
      <div class="prose prose-lg max-w-none">
        <p class="text-xl text-gray-600 leading-relaxed mb-6">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </p>
      </div>
    </div>
  </section>

  <!-- Recent Posts -->
  <section class="py-20 bg-gray-50">
    <div class="container mx-auto px-4 max-w-6xl">
      <h2 class="text-4xl font-serif font-bold mb-12">Artigos Recentes</h2>
      <div class="grid md:grid-cols-3 gap-8">
        ${Array.from({ length: 6 }).map((_, i) => `
        <article class="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
          <div class="aspect-video bg-gray-200"></div>
          <div class="p-6">
            <span class="text-xs font-semibold text-blue-600 uppercase">Tecnologia</span>
            <h3 class="text-xl font-bold my-3">Título do Artigo ${i + 1}</h3>
            <p class="text-gray-600 mb-4">Breve descrição do artigo aqui...</p>
            <div class="text-sm text-gray-500">5 Jan 2024 • 7 min</div>
          </div>
        </article>
        `).join('')}
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="border-t border-gray-200 py-12">
    <div class="container mx-auto px-4 text-center">
      <div class="text-2xl font-serif font-bold mb-4">TheBlog</div>
      <p class="text-gray-600">Compartilhando conhecimento e inspiração</p>
    </div>
  </footer>
</body>
</html>`
};

// ========================================
// TEMPLATE: CORPORATE
// ========================================

export const CORPORATE_TEMPLATE: Template = {
  id: 'corporate-business',
  name: 'Corporate Business',
  category: 'corporate',
  tags: ['corporate', 'business', 'professional'],
  preview: '/templates/corporate.png',
  description: 'Site corporativo profissional',
  code: () => `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Empresa - Soluções Corporativas</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-white">
  <!-- Navbar -->
  <nav class="bg-white shadow-sm sticky top-0 z-50">
    <div class="container mx-auto px-4">
      <div class="flex items-center justify-between h-20">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 bg-blue-900 rounded"></div>
          <span class="text-2xl font-bold text-blue-900">CorpSolutions</span>
        </div>
        <div class="hidden md:flex items-center gap-8">
          <a href="#services" class="text-gray-700 hover:text-blue-900">Serviços</a>
          <a href="#about" class="text-gray-700 hover:text-blue-900">Sobre</a>
          <a href="#contact" class="text-gray-700 hover:text-blue-900">Contato</a>
          <button class="px-6 py-2 bg-blue-900 text-white rounded font-semibold">Solicitar Orçamento</button>
        </div>
      </div>
    </div>
  </nav>

  <!-- Hero -->
  <section class="py-32 bg-gradient-to-br from-blue-900 to-blue-700 text-white">
    <div class="container mx-auto px-4">
      <div class="max-w-3xl">
        <h1 class="text-6xl font-bold mb-6">Soluções Corporativas de Excelência</h1>
        <p class="text-2xl text-blue-100 mb-10">Transformamos desafios em oportunidades de crescimento</p>
        <div class="flex gap-4">
          <button class="px-8 py-4 bg-white text-blue-900 rounded-lg font-bold hover:bg-gray-50 transition">Nossos Serviços</button>
          <button class="px-8 py-4 border-2 border-white text-white rounded-lg font-bold hover:bg-white/10 transition">Fale Conosco</button>
        </div>
      </div>
    </div>
  </section>

  <!-- Services -->
  <section id="services" class="py-20">
    <div class="container mx-auto px-4">
      <div class="text-center mb-16">
        <h2 class="text-4xl font-bold mb-4">Nossos Serviços</h2>
        <p class="text-xl text-gray-600">Soluções completas para sua empresa</p>
      </div>
      <div class="grid md:grid-cols-3 gap-8">
        <div class="p-8 border border-gray-200 rounded-xl hover:shadow-lg transition">
          <div class="w-16 h-16 bg-blue-900 rounded-lg mb-6"></div>
          <h3 class="text-2xl font-bold mb-4">Consultoria</h3>
          <p class="text-gray-600">Análise estratégica e planejamento personalizado</p>
        </div>
        <div class="p-8 border border-gray-200 rounded-xl hover:shadow-lg transition">
          <div class="w-16 h-16 bg-blue-900 rounded-lg mb-6"></div>
          <h3 class="text-2xl font-bold mb-4">Implementação</h3>
          <p class="text-gray-600">Execução eficiente com resultados mensuráveis</p>
        </div>
        <div class="p-8 border border-gray-200 rounded-xl hover:shadow-lg transition">
          <div class="w-16 h-16 bg-blue-900 rounded-lg mb-6"></div>
          <h3 class="text-2xl font-bold mb-4">Suporte</h3>
          <p class="text-gray-600">Acompanhamento contínuo e otimização</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Stats -->
  <section class="py-20 bg-blue-900 text-white">
    <div class="container mx-auto px-4">
      <div class="grid md:grid-cols-4 gap-8 text-center">
        <div>
          <div class="text-5xl font-bold mb-2">500+</div>
          <div class="text-blue-200">Clientes</div>
        </div>
        <div>
          <div class="text-5xl font-bold mb-2">15</div>
          <div class="text-blue-200">Anos</div>
        </div>
        <div>
          <div class="text-5xl font-bold mb-2">98%</div>
          <div class="text-blue-200">Satisfação</div>
        </div>
        <div>
          <div class="text-5xl font-bold mb-2">24/7</div>
          <div class="text-blue-200">Suporte</div>
        </div>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="bg-gray-900 text-white py-12">
    <div class="container mx-auto px-4 text-center">
      <div class="text-2xl font-bold mb-4">CorpSolutions</div>
      <p class="text-gray-400">© 2024 Todos os direitos reservados</p>
    </div>
  </footer>
</body>
</html>`
};

// ========================================
// ALL TEMPLATES
// ========================================

export const ALL_TEMPLATES: Template[] = [
  SAAS_LANDING,
  ECOMMERCE_TEMPLATE,
  PORTFOLIO_TEMPLATE,
  BLOG_TEMPLATE,
  CORPORATE_TEMPLATE,
];

export const TEMPLATES_BY_CATEGORY = {
  landing: [SAAS_LANDING],
  ecommerce: [ECOMMERCE_TEMPLATE],
  portfolio: [PORTFOLIO_TEMPLATE],
  blog: [BLOG_TEMPLATE],
  corporate: [CORPORATE_TEMPLATE],
};
