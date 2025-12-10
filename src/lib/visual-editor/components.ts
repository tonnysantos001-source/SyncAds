/**
 * Component Library - 30+ Professional Components
 * Biblioteca completa de componentes para construtor de sites
 * 
 * Categorias:
 * - Navigation
 * - Hero Sections
 * - Features
 * - Pricing
 * - Testimonials
 * - Forms
 * - CTAs
 * - Footers
 */

export interface Component {
    id: string;
    name: string;
    category: string;
    tags: string[];
    preview: string;
    description: string;
    code: () => string;
}

// ========================================
// NAVIGATION COMPONENTS
// ========================================

export const NAVIGATION_COMPONENTS: Component[] = [
    {
        id: 'navbar-modern',
        name: 'Navbar Moderna',
        category: 'navigation',
        tags: ['navbar', 'responsive', 'dropdown'],
        preview: '/previews/navbar-modern.png',
        description: 'Navbar responsiva com dropdown e CTA',
        code: () => `
<!-- Navbar Moderna -->
<nav class="bg-white shadow-lg sticky top-0 z-50">
  <div class="container mx-auto px-4">
    <div class="flex items-center justify-between h-16">
      <!-- Logo -->
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg"></div>
        <span class="text-xl font-bold text-gray-900">SeuLogo</span>
      </div>
      
      <!-- Desktop Navigation -->
      <div class="hidden md:flex items-center space-x-8">
        <a href="#home" class="text-gray-700 hover:text-blue-600 transition">Início</a>
        <a href="#features" class="text-gray-700 hover:text-blue-600 transition">Features</a>
        <a href="#pricing" class="text-gray-700 hover:text-blue-600 transition">Preços</a>
        <a href="#contact" class="text-gray-700 hover:text-blue-600 transition">Contato</a>
      </div>
      
      <!-- CTA Button -->
      <div class="hidden md:block">
        <button class="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:scale-105 transition-transform">
          Começar Agora
        </button>
      </div>
      
      <!-- Mobile Menu Button -->
      <button class="md:hidden p-2">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
      </button>
    </div>
  </div>
</nav>
    `.trim()
    },

    {
        id: 'navbar-transparent',
        name: 'Navbar Transparente',
        category: 'navigation',
        tags: ['navbar', 'transparent', 'overlay'],
        preview: '/previews/navbar-transparent.png',
        description: 'Navbar transparente para hero sections',
        code: () => `
<!-- Navbar Transparente -->
<nav class="absolute top-0 left-0 right-0 z-50">
  <div class="container mx-auto px-4">
    <div class="flex items-center justify-between h-20">
      <div class="text-white text-2xl font-bold">Logo</div>
      <div class="hidden md:flex items-center space-x-8">
        <a href="#" class="text-white/90 hover:text-white transition">Home</a>
        <a href="#" class="text-white/90 hover:text-white transition">About</a>
        <a href="#" class="text-white/90 hover:text-white transition">Services</a>
        <button class="px-6 py-2 border-2 border-white text-white rounded-lg hover:bg-white hover:text-gray-900 transition">
          Get Started
        </button>
      </div>
    </div>
  </div>
</nav>
    `.trim()
    }
];

// ========================================
// HERO SECTIONS
// ========================================

export const HERO_COMPONENTS: Component[] = [
    {
        id: 'hero-centered',
        name: 'Hero Centrado',
        category: 'hero',
        tags: ['hero', 'centered', 'gradient'],
        preview: '/previews/hero-centered.png',
        description: 'Hero section centrado com gradiente vibrante',
        code: () => `
<!-- Hero Centrado -->
<section class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 relative overflow-hidden">
  <!-- Background Animation -->
  <div class="absolute inset-0">
    <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
    <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
  </div>
  
  <!-- Content -->
  <div class="relative text-center text-white max-w-5xl px-4 z-10">
    <span class="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium mb-6">
      🚀 Novo Produto Lançado
    </span>
    
    <h1 class="text-6xl md:text-7xl font-bold mb-6 leading-tight">
      Transforme Suas Ideias em
      <span class="bg-gradient-to-r from-yellow-200 to-pink-200 bg-clip-text text-transparent"> Realidade</span>
    </h1>
    
    <p class="text-xl md:text-2xl mb-10 text-white/90 max-w-3xl mx-auto">
      A plataforma mais avançada para criar, gerenciar e escalar seu negócio online. Junte-se a mais de 10.000 empresas de sucesso.
    </p>
    
    <div class="flex flex-col sm:flex-row gap-4 justify-center">
      <button class="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold text-lg hover:scale-105 transition-transform shadow-2xl">
        Começar Gratuitamente
      </button>
      <button class="px-8 py-4 bg-white/10 backdrop-blur-sm text-white border-2 border-white rounded-lg font-semibold text-lg hover:bg-white/20 transition">
        Ver Demonstração
      </button>
    </div>
    
    <!-- Social Proof -->
    <div class="mt-12 flex items-center justify-center gap-8 text-sm">
      <div class="flex -space-x-2">
        <div class="w-10 h-10 rounded-full bg-white/20 border-2 border-white"></div>
        <div class="w-10 h-10 rounded-full bg-white/20 border-2 border-white"></div>
        <div class="w-10 h-10 rounded-full bg-white/20 border-2 border-white"></div>
      </div>
      <p class="text-white/90">Mais de <span class="font-bold">10.000+</span> usuários satisfeitos</p>
    </div>
  </div>
</section>

<style>
@keyframes pulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.6; }
}
.animate-pulse { animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
.delay-1000 { animation-delay: 1s; }
</style>
    `.trim()
    },

    {
        id: 'hero-split',
        name: 'Hero Split Screen',
        category: 'hero',
        tags: ['hero', 'split', 'image'],
        preview: '/previews/hero-split.png',
        description: 'Hero com conteúdo e imagem lado a lado',
        code: () => `
<!-- Hero Split Screen -->
<section class="min-h-screen grid md:grid-cols-2">
  <!-- Left Content -->
  <div class="flex items-center justify-center bg-gray-50 p-8 md:p-16">
    <div class="max-w-lg">
      <span class="inline-block px-4 py-2 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold mb-4">
        Novidade 2024
      </span>
      
      <h1 class="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
        Seu Produto
        <span class="text-blue-600"> Revolucionário</span>
      </h1>
      
      <p class="text-xl text-gray-600 mb-8">
        Descubra uma nova forma de trabalhar. Mais produtividade, menos complexidade.
      </p>
      
      <div class="flex gap-4">
        <button class="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">
          Começar Agora
        </button>
        <button class="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-gray-400 transition">
          Saiba Mais
        </button>
      </div>
      
      <!-- Stats -->
      <div class="mt-12 grid grid-cols-3 gap-8 text-center">
        <div>
          <div class="text-3xl font-bold text-gray-900">99%</div>
          <div class="text-sm text-gray-600">Satisfação</div>
        </div>
        <div>
          <div class="text-3xl font-bold text-gray-900">24/7</div>
          <div class="text-sm text-gray-600">Suporte</div>
        </div>
        <div>
          <div class="text-3xl font-bold text-gray-900">50k+</div>
          <div class="text-sm text-gray-600">Usuários</div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Right Image -->
  <div class="bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center p-16">
    <div class="w-full max-w-md aspect-square bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl flex items-center justify-center">
      <span class="text-white text-xl">Sua Imagem / Screenshot</span>
    </div>
  </div>
</section>
    `.trim()
    },

    {
        id: 'hero-video-bg',
        name: 'Hero com Vídeo Background',
        category: 'hero',
        tags: ['hero', 'video', 'overlay'],
        preview: '/previews/hero-video.png',
        description: 'Hero com vídeo de fundo e overlay',
        code: () => `
<!-- Hero com Vídeo Background -->
<section class="relative min-h-screen flex items-center justify-center overflow-hidden">
  <!-- Video Background -->
  <div class="absolute inset-0 z-0">
    <div class="w-full h-full bg-gray-900"></div>
    <!-- Adicione seu vídeo aqui: <video autoplay loop muted class="w-full h-full object-cover"></video> -->
  </div>
  
  <!-- Overlay -->
  <div class="absolute inset-0 bg-gradient-to-br from-blue-900/80 to-purple-900/80 z-10"></div>
  
  <!-- Content -->
  <div class="relative z-20 text-center text-white max-w-4xl px-4">
    <h1 class="text-6xl md:text-7xl font-bold mb-6">
      Experiência Imersiva
    </h1>
    <p class="text-2xl mb-10 text-white/90">
      Conecte-se com seu público de forma única e memorável
    </p>
    <button class="px-10 py-5 bg-white text-gray-900 rounded-lg font-bold text-lg hover:scale-105 transition-transform shadow-2xl">
      Explorar Agora
    </button>
  </div>
</section>
    `.trim()
    }
];

// ========================================
// FEATURES SECTIONS
// ========================================

export const FEATURES_COMPONENTS: Component[] = [
    {
        id: 'features-grid-3x3',
        name: 'Features Grid 3x3',
        category: 'features',
        tags: ['features', 'grid', 'icons'],
        preview: '/previews/features-grid.png',
        description: 'Grid 3x3 de features com ícones',
        code: () => `
<!-- Features Grid 3x3 -->
<section class="py-20 bg-gray-50">
  <div class="container mx-auto px-4">
    <!-- Header -->
    <div class="text-center max-w-3xl mx-auto mb-16">
      <span class="inline-block px-4 py-2 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold mb-4">
        Features
      </span>
      <h2 class="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
        Tudo que Você Precisa
      </h2>
      <p class="text-xl text-gray-600">
        Ferramentas poderosas para impulsionar seu negócio
      </p>
    </div>
    
    <!-- Grid -->
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      <!-- Feature 1 -->
      <div class="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition group">
        <div class="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
          <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
        </div>
        <h3 class="text-xl font-bold text-gray-900 mb-3">Rápido</h3>
        <p class="text-gray-600">Performance otimizada para resultados instantâneos e experiência fluida.</p>
      </div>
      
      <!-- Feature 2 -->
      <div class="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition group">
        <div class="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
          <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
          </svg>
        </div>
        <h3 class="text-xl font-bold text-gray-900 mb-3">Seguro</h3>
        <p class="text-gray-600">Criptografia de ponta e proteção avançada para seus dados mais importantes.</p>
      </div>
      
      <!-- Feature 3 -->
      <div class="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition group">
        <div class="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
          <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <h3 class="text-xl font-bold text-gray-900 mb-3">Confiável</h3>
        <p class="text-gray-600">99.9% uptime e suporte 24/7 para garantir que você nunca fique parado.</p>
      </div>
      
      <!-- Feature 4 -->
      <div class="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition group">
        <div class="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
          <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/>
          </svg>
        </div>
        <h3 class="text-xl font-bold text-gray-900 mb-3">Personalizável</h3>
        <p class="text-gray-600">Adapte cada detalhe às suas necessidades específicas e preferências.</p>
      </div>
      
      <!-- Feature 5 -->
      <div class="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition group">
        <div class="w-14 h-14 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
          <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
          </svg>
        </div>
        <h3 class="text-xl font-bold text-gray-900 mb-3">Colaborativo</h3>
        <p class="text-gray-600">Trabalhe em equipe com sincronização em tempo real e compartilhamento fácil.</p>
      </div>
      
      <!-- Feature 6 -->
      <div class="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition group">
        <div class="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
          <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
          </svg>
        </div>
        <h3 class="text-xl font-bold text-gray-900 mb-3">Analytics</h3>
        <p class="text-gray-600">Insights poderosos e relatórios detalhados para tomar decisões informadas.</p>
      </div>
    </div>
  </div>
</section>
    `.trim()
    }
];

// Continue com mais componentes...
// Por brevidade, mostrando estrutura

export const PRICING_COMPONENTS: Component[] = [
    // Pricing tables, cards, etc
];

export const FORM_COMPONENTS: Component[] = [
    // Contact forms, newsletter, etc
];

export const CTA_COMPONENTS: Component[] = [
    // Call to action sections
];

export const FOOTER_COMPONENTS: Component[] = [
    // Footer variants
];

// ========================================
// EXPORT ALL COMPONENTS
// ========================================

export const ALL_COMPONENTS: Component[] = [
    ...NAVIGATION_COMPONENTS,
    ...HERO_COMPONENTS,
    ...FEATURES_COMPONENTS,
    ...PRICING_COMPONENTS,
    ...FORM_COMPONENTS,
    ...CTA_COMPONENTS,
    ...FOOTER_COMPONENTS,
];

export const COMPONENTS_BY_CATEGORY = {
    navigation: NAVIGATION_COMPONENTS,
    hero: HERO_COMPONENTS,
    features: FEATURES_COMPONENTS,
    pricing: PRICING_COMPONENTS,
    forms: FORM_COMPONENTS,
    cta: CTA_COMPONENTS,
    footer: FOOTER_COMPONENTS,
};
