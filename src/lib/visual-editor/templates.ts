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
// ALL TEMPLATES
// ========================================

export const ALL_TEMPLATES: Template[] = [
    SAAS_LANDING,
    // More templates will be added
];

export const TEMPLATES_BY_CATEGORY = {
    landing: [SAAS_LANDING],
    ecommerce: [],
    portfolio: [],
    blog: [],
};
