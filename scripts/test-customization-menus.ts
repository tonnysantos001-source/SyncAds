/**
 * Script de Teste - Menus de Personalização do Checkout
 *
 * Valida a integridade de todos os menus de personalização,
 * suas propriedades e integração com o frontend.
 *
 * Uso: ts-node scripts/test-customization-menus.ts
 */

interface TestResult {
  section: string;
  feature: string;
  status: 'PASS' | 'FAIL' | 'WARNING' | 'NOT_IMPLEMENTED';
  message?: string;
}

interface ThemeConfig {
  // Cabeçalho
  logoUrl?: string;
  logoAlignment?: 'left' | 'center' | 'right';
  showLogoAtTop?: boolean;
  faviconUrl?: string;
  backgroundColor?: string;
  useGradient?: boolean;

  // Barra de Avisos
  noticeBarEnabled?: boolean;
  noticeBarText?: string;
  noticeBarTextColor?: string;
  noticeBarBackgroundColor?: string;
  noticeBarPosition?: 'top' | 'bottom';
  noticeBarStyle?: 'normal' | 'highlight' | 'urgent';

  // Banner
  bannerEnabled?: boolean;
  bannerImageUrl?: string;

  // Carrinho
  cartDisplay?: 'open' | 'closed' | 'collapsed';
  cartBackgroundColor?: string;
  cartTextColor?: string;
  cartBorderColor?: string;
  showProductImage?: boolean;
  showQuantity?: boolean;
  showSubtotal?: boolean;
  showShipping?: boolean;
  showDiscount?: boolean;

  // Conteúdo
  nextStepStyle?: 'rounded' | 'square' | 'pill';
  payButtonText?: string;
  nextStepText?: string;
  buttonTextColor?: string;
  buttonBackgroundColor?: string;
  inputTextColor?: string;
  inputBackgroundColor?: string;
  inputBorderColor?: string;
  showSecuritySeal?: boolean;
  showPaymentBadges?: boolean;
  showGuarantee?: boolean;
  guaranteeText?: string;

  // Rodapé
  footerBackgroundColor?: string;
  footerTextColor?: string;
  copyrightText?: string;
  showSocialMedia?: boolean;
  facebookUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
  youtubeUrl?: string;
  showEmail?: boolean;
  showAddress?: boolean;
  showPhone?: boolean;
  showPrivacyPolicy?: boolean;
  showTermsConditions?: boolean;
  showReturns?: boolean;

  // Escassez
  useVisible?: boolean;
  discountTagTextColor?: string;
  discountTagBackgroundColor?: string;
  expirationTime?: number;

  // Order Bump
  orderBumpTextColor?: string;
  orderBumpBackgroundColor?: string;
  orderBumpPriceColor?: string;
  orderBumpBorderColor?: string;
  orderBumpButtonTextColor?: string;
  orderBumpButtonBackgroundColor?: string;

  // Configurações
  navigationSteps?: 1 | 3 | 5;
  fontFamily?: string;
  language?: 'pt' | 'en' | 'es';
  currency?: 'BRL' | 'USD' | 'EUR';
  requestCpfOnlyAtPayment?: boolean;
  requestBirthDate?: boolean;
  requestGender?: boolean;
}

class CustomizationMenuTester {
  private results: TestResult[] = [];
  private theme: ThemeConfig;

  constructor(theme?: ThemeConfig) {
    this.theme = theme || {};
  }

  // Helpers
  private addResult(
    section: string,
    feature: string,
    status: TestResult['status'],
    message?: string
  ) {
    this.results.push({ section, feature, status, message });
  }

  private isValidColor(color: string | undefined): boolean {
    if (!color) return false;
    // Valida hex color
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  }

  private isValidUrl(url: string | undefined): boolean {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Testes por seção
  testHeader() {
    const section = '🎨 CABEÇALHO';

    // Logo URL
    if (this.theme.logoUrl) {
      const isValid = this.isValidUrl(this.theme.logoUrl);
      this.addResult(
        section,
        'Logo URL',
        isValid ? 'PASS' : 'FAIL',
        isValid ? 'URL válida' : 'URL inválida'
      );
    } else {
      this.addResult(section, 'Logo URL', 'WARNING', 'Logo não configurada');
    }

    // Logo Alignment
    const validAlignments = ['left', 'center', 'right'];
    if (
      this.theme.logoAlignment &&
      validAlignments.includes(this.theme.logoAlignment)
    ) {
      this.addResult(section, 'Alinhamento do Logo', 'PASS');
    } else {
      this.addResult(
        section,
        'Alinhamento do Logo',
        'WARNING',
        'Usando valor padrão: left'
      );
    }

    // Favicon
    if (this.theme.faviconUrl) {
      const isValid = this.isValidUrl(this.theme.faviconUrl);
      this.addResult(
        section,
        'Favicon',
        isValid ? 'PASS' : 'FAIL',
        isValid ? 'Favicon configurado' : 'URL de favicon inválida'
      );
    } else {
      this.addResult(section, 'Favicon', 'WARNING', 'Favicon não configurado');
    }

    // Background Color
    if (this.isValidColor(this.theme.backgroundColor)) {
      this.addResult(section, 'Cor de Fundo', 'PASS');
    } else {
      this.addResult(
        section,
        'Cor de Fundo',
        'WARNING',
        'Cor inválida ou não configurada'
      );
    }

    // Gradient
    this.addResult(
      section,
      'Usar Gradiente',
      'PASS',
      `Gradiente: ${this.theme.useGradient ? 'Ativado' : 'Desativado'}`
    );
  }

  testNoticeBar() {
    const section = '🔔 BARRA DE AVISOS';

    if (this.theme.noticeBarEnabled) {
      // Text
      if (this.theme.noticeBarText && this.theme.noticeBarText.length > 0) {
        this.addResult(section, 'Texto do Aviso', 'PASS');
      } else {
        this.addResult(
          section,
          'Texto do Aviso',
          'FAIL',
          'Barra ativada mas sem texto'
        );
      }

      // Colors
      if (this.isValidColor(this.theme.noticeBarTextColor)) {
        this.addResult(section, 'Cor do Texto', 'PASS');
      } else {
        this.addResult(section, 'Cor do Texto', 'WARNING', 'Cor não configurada');
      }

      if (this.isValidColor(this.theme.noticeBarBackgroundColor)) {
        this.addResult(section, 'Cor de Fundo', 'PASS');
      } else {
        this.addResult(section, 'Cor de Fundo', 'WARNING', 'Cor não configurada');
      }

      // Position
      const validPositions = ['top', 'bottom'];
      if (
        this.theme.noticeBarPosition &&
        validPositions.includes(this.theme.noticeBarPosition)
      ) {
        this.addResult(section, 'Posição', 'PASS');
      } else {
        this.addResult(section, 'Posição', 'WARNING', 'Posição padrão: top');
      }

      // Style
      const validStyles = ['normal', 'highlight', 'urgent'];
      if (
        this.theme.noticeBarStyle &&
        validStyles.includes(this.theme.noticeBarStyle)
      ) {
        this.addResult(section, 'Estilo', 'PASS');
      } else {
        this.addResult(section, 'Estilo', 'WARNING', 'Estilo padrão: normal');
      }
    } else {
      this.addResult(
        section,
        'Status',
        'WARNING',
        'Barra de avisos desativada'
      );
    }
  }

  testBanner() {
    const section = '🚩 BANNER';

    if (this.theme.bannerEnabled) {
      if (this.theme.bannerImageUrl && this.isValidUrl(this.theme.bannerImageUrl)) {
        this.addResult(section, 'Imagem do Banner', 'PASS');
      } else {
        this.addResult(
          section,
          'Imagem do Banner',
          'FAIL',
          'Banner ativado mas sem imagem válida'
        );
      }
    } else {
      this.addResult(section, 'Status', 'WARNING', 'Banner desativado');
    }
  }

  testCart() {
    const section = '🛒 CARRINHO';

    // Display Mode
    const validDisplays = ['open', 'closed', 'collapsed'];
    if (
      this.theme.cartDisplay &&
      validDisplays.includes(this.theme.cartDisplay)
    ) {
      this.addResult(section, 'Modo de Exibição', 'PASS');
    } else {
      this.addResult(section, 'Modo de Exibição', 'WARNING', 'Usando padrão: open');
    }

    // Colors
    const colorTests = [
      { key: 'cartBackgroundColor', name: 'Cor de Fundo' },
      { key: 'cartTextColor', name: 'Cor do Texto' },
      { key: 'cartBorderColor', name: 'Cor da Borda' },
    ];

    colorTests.forEach(({ key, name }) => {
      if (this.isValidColor(this.theme[key as keyof ThemeConfig] as string)) {
        this.addResult(section, name, 'PASS');
      } else {
        this.addResult(section, name, 'WARNING', 'Cor não configurada');
      }
    });

    // Toggles
    const toggles = [
      'showProductImage',
      'showQuantity',
      'showSubtotal',
      'showShipping',
      'showDiscount',
    ];

    toggles.forEach((toggle) => {
      const value = this.theme[toggle as keyof ThemeConfig];
      this.addResult(
        section,
        toggle.replace(/([A-Z])/g, ' $1').trim(),
        'PASS',
        `${value ? 'Ativado' : 'Desativado'}`
      );
    });
  }

  testContent() {
    const section = '📄 CONTEÚDO';

    // Button Style
    const validStyles = ['rounded', 'square', 'pill'];
    if (
      this.theme.nextStepStyle &&
      validStyles.includes(this.theme.nextStepStyle)
    ) {
      this.addResult(section, 'Visual do Botão', 'PASS');
    } else {
      this.addResult(
        section,
        'Visual do Botão',
        'WARNING',
        'Estilo padrão: rounded'
      );
    }

    // Button Texts
    if (this.theme.payButtonText) {
      this.addResult(section, 'Texto Botão Pagar', 'PASS');
    } else {
      this.addResult(
        section,
        'Texto Botão Pagar',
        'WARNING',
        'Usando texto padrão'
      );
    }

    if (this.theme.nextStepText) {
      this.addResult(section, 'Texto Botão Continuar', 'PASS');
    } else {
      this.addResult(
        section,
        'Texto Botão Continuar',
        'WARNING',
        'Usando texto padrão'
      );
    }

    // Colors
    const colors = [
      { key: 'buttonTextColor', name: 'Cor Texto Botão' },
      { key: 'buttonBackgroundColor', name: 'Cor Fundo Botão' },
      { key: 'inputTextColor', name: 'Cor Texto Campos' },
      { key: 'inputBackgroundColor', name: 'Cor Fundo Campos' },
      { key: 'inputBorderColor', name: 'Cor Borda Campos' },
    ];

    colors.forEach(({ key, name }) => {
      if (this.isValidColor(this.theme[key as keyof ThemeConfig] as string)) {
        this.addResult(section, name, 'PASS');
      } else {
        this.addResult(section, name, 'WARNING', 'Cor não configurada');
      }
    });

    // Toggles
    const toggles = [
      { key: 'showSecuritySeal', name: 'Selo de Segurança' },
      { key: 'showPaymentBadges', name: 'Selos de Pagamento' },
      { key: 'showGuarantee', name: 'Garantia' },
    ];

    toggles.forEach(({ key, name }) => {
      const value = this.theme[key as keyof ThemeConfig];
      this.addResult(
        section,
        name,
        'PASS',
        `${value ? 'Ativado' : 'Desativado'}`
      );
    });

    // Guarantee Text
    if (this.theme.showGuarantee && !this.theme.guaranteeText) {
      this.addResult(
        section,
        'Texto da Garantia',
        'WARNING',
        'Garantia ativada mas sem texto'
      );
    }
  }

  testFooter() {
    const section = '🔻 RODAPÉ';

    // Colors
    if (this.isValidColor(this.theme.footerBackgroundColor)) {
      this.addResult(section, 'Cor de Fundo', 'PASS');
    } else {
      this.addResult(section, 'Cor de Fundo', 'WARNING', 'Cor não configurada');
    }

    if (this.isValidColor(this.theme.footerTextColor)) {
      this.addResult(section, 'Cor do Texto', 'PASS');
    } else {
      this.addResult(section, 'Cor do Texto', 'WARNING', 'Cor não configurada');
    }

    // Copyright
    if (this.theme.copyrightText) {
      this.addResult(section, 'Texto Copyright', 'PASS');
    } else {
      this.addResult(
        section,
        'Texto Copyright',
        'WARNING',
        'Copyright não configurado'
      );
    }

    // Social Media
    if (this.theme.showSocialMedia) {
      const socialUrls = [
        { key: 'facebookUrl', name: 'Facebook' },
        { key: 'instagramUrl', name: 'Instagram' },
        { key: 'twitterUrl', name: 'Twitter' },
        { key: 'linkedinUrl', name: 'LinkedIn' },
        { key: 'youtubeUrl', name: 'YouTube' },
      ];

      let hasAtLeastOne = false;
      socialUrls.forEach(({ key, name }) => {
        const url = this.theme[key as keyof ThemeConfig] as string;
        if (url && this.isValidUrl(url)) {
          this.addResult(section, `${name} URL`, 'PASS');
          hasAtLeastOne = true;
        }
      });

      if (!hasAtLeastOne) {
        this.addResult(
          section,
          'Redes Sociais',
          'WARNING',
          'Ativado mas nenhuma URL configurada'
        );
      }
    }

    // Toggles
    const toggles = [
      'showEmail',
      'showAddress',
      'showPhone',
      'showPrivacyPolicy',
      'showTermsConditions',
      'showReturns',
    ];

    toggles.forEach((toggle) => {
      const value = this.theme[toggle as keyof ThemeConfig];
      this.addResult(
        section,
        toggle.replace(/([A-Z])/g, ' $1').trim(),
        'PASS',
        `${value ? 'Ativado' : 'Desativado'}`
      );
    });
  }

  testScarcity() {
    const section = '⏰ ESCASSEZ';

    if (this.theme.useVisible) {
      // Colors
      if (this.isValidColor(this.theme.discountTagTextColor)) {
        this.addResult(section, 'Cor Texto Tag', 'PASS');
      } else {
        this.addResult(section, 'Cor Texto Tag', 'WARNING', 'Cor não configurada');
      }

      if (this.isValidColor(this.theme.discountTagBackgroundColor)) {
        this.addResult(section, 'Cor Fundo Tag', 'PASS');
      } else {
        this.addResult(section, 'Cor Fundo Tag', 'WARNING', 'Cor não configurada');
      }

      // Expiration Time
      if (
        this.theme.expirationTime &&
        this.theme.expirationTime > 0 &&
        this.theme.expirationTime <= 1440
      ) {
        this.addResult(
          section,
          'Tempo de Expiração',
          'PASS',
          `${this.theme.expirationTime} minutos`
        );
      } else {
        this.addResult(
          section,
          'Tempo de Expiração',
          'WARNING',
          'Tempo inválido ou não configurado (deve ser 1-1440 min)'
        );
      }

      // Frontend Integration Check
      this.addResult(
        section,
        'Integração Frontend',
        'WARNING',
        '⚠️ REQUER VALIDAÇÃO MANUAL - Timer funcionando?'
      );
    } else {
      this.addResult(section, 'Status', 'WARNING', 'Escassez desativada');
    }
  }

  testOrderBump() {
    const section = '⚡ ORDER BUMP';

    // Colors
    const colors = [
      { key: 'orderBumpTextColor', name: 'Cor do Texto' },
      { key: 'orderBumpBackgroundColor', name: 'Cor de Fundo' },
      { key: 'orderBumpPriceColor', name: 'Cor do Preço' },
      { key: 'orderBumpBorderColor', name: 'Cor da Borda' },
      { key: 'orderBumpButtonTextColor', name: 'Cor Texto Botão' },
      { key: 'orderBumpButtonBackgroundColor', name: 'Cor Fundo Botão' },
    ];

    let allColorsConfigured = true;
    colors.forEach(({ key, name }) => {
      if (this.isValidColor(this.theme[key as keyof ThemeConfig] as string)) {
        this.addResult(section, name, 'PASS');
      } else {
        this.addResult(section, name, 'WARNING', 'Cor não configurada');
        allColorsConfigured = false;
      }
    });

    // Critical Warning
    this.addResult(
      section,
      'Implementação Frontend',
      'NOT_IMPLEMENTED',
      '❌ CRÍTICO: Order Bump não implementado no frontend público'
    );

    this.addResult(
      section,
      'Seleção de Produto',
      'NOT_IMPLEMENTED',
      '❌ Falta lógica para selecionar produto bump'
    );

    this.addResult(
      section,
      'Cálculo de Preço',
      'NOT_IMPLEMENTED',
      '❌ Falta cálculo automático no carrinho'
    );
  }

  testSettings() {
    const section = '⚙️ CONFIGURAÇÕES';

    // Navigation Steps
    const validSteps = [1, 3, 5];
    if (
      this.theme.navigationSteps &&
      validSteps.includes(this.theme.navigationSteps)
    ) {
      this.addResult(
        section,
        'Etapas de Navegação',
        'PASS',
        `${this.theme.navigationSteps} etapa(s)`
      );
    } else {
      this.addResult(
        section,
        'Etapas de Navegação',
        'WARNING',
        'Usando padrão: 5 etapas'
      );
    }

    // Font Family
    const validFonts = [
      'Inter, sans-serif',
      'Roboto, sans-serif',
      'Open Sans, sans-serif',
      'Poppins, sans-serif',
      'Montserrat, sans-serif',
      'Lato, sans-serif',
    ];

    if (this.theme.fontFamily && validFonts.includes(this.theme.fontFamily)) {
      this.addResult(section, 'Fonte', 'PASS', this.theme.fontFamily);
    } else {
      this.addResult(section, 'Fonte', 'WARNING', 'Fonte padrão: Inter');
    }

    // Language
    const validLanguages = ['pt', 'en', 'es'];
    if (this.theme.language && validLanguages.includes(this.theme.language)) {
      this.addResult(section, 'Idioma', 'PASS', this.theme.language.toUpperCase());
    } else {
      this.addResult(section, 'Idioma', 'WARNING', 'Idioma padrão: PT');
    }

    // Currency
    const validCurrencies = ['BRL', 'USD', 'EUR'];
    if (this.theme.currency && validCurrencies.includes(this.theme.currency)) {
      this.addResult(section, 'Moeda', 'PASS', this.theme.currency);
    } else {
      this.addResult(section, 'Moeda', 'WARNING', 'Moeda padrão: BRL');
    }

    // Optional Fields
    const optionalFields = [
      { key: 'requestCpfOnlyAtPayment', name: 'CPF apenas no pagamento' },
      { key: 'requestBirthDate', name: 'Data de nascimento' },
      { key: 'requestGender', name: 'Gênero' },
    ];

    optionalFields.forEach(({ key, name }) => {
      const value = this.theme[key as keyof ThemeConfig];
      this.addResult(
        section,
        name,
        'PASS',
        `${value ? 'Solicitado' : 'Não solicitado'}`
      );
    });
  }

  // Run all tests
  runAllTests() {
    console.log('🚀 Iniciando testes de personalização...\n');

    this.testHeader();
    this.testNoticeBar();
    this.testBanner();
    this.testCart();
    this.testContent();
    this.testFooter();
    this.testScarcity();
    this.testOrderBump();
    this.testSettings();

    this.generateReport();
  }

  // Generate report
  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 RELATÓRIO DE TESTES DE PERSONALIZAÇÃO');
    console.log('='.repeat(80) + '\n');

    const sections = [
      ...new Set(this.results.map((r) => r.section)),
    ];

    sections.forEach((section) => {
      const sectionResults = this.results.filter((r) => r.section === section);

      console.log(`\n${section}`);
      console.log('-'.repeat(80));

      sectionResults.forEach((result) => {
        const icon =
          result.status === 'PASS'
            ? '✅'
            : result.status === 'FAIL'
            ? '❌'
            : result.status === 'NOT_IMPLEMENTED'
            ? '🚧'
            : '⚠️';

        const message = result.message ? ` - ${result.message}` : '';
        console.log(`  ${icon} ${result.feature}${message}`);
      });
    });

    // Summary
    const summary = {
      pass: this.results.filter((r) => r.status === 'PASS').length,
      fail: this.results.filter((r) => r.status === 'FAIL').length,
      warning: this.results.filter((r) => r.status === 'WARNING').length,
      notImplemented: this.results.filter((r) => r.status === 'NOT_IMPLEMENTED')
        .length,
      total: this.results.length,
    };

    console.log('\n' + '='.repeat(80));
    console.log('📈 RESUMO');
    console.log('='.repeat(80));
    console.log(`  ✅ Passou: ${summary.pass}/${summary.total}`);
    console.log(`  ❌ Falhou: ${summary.fail}/${summary.total}`);
    console.log(`  ⚠️  Avisos: ${summary.warning}/${summary.total}`);
    console.log(`  🚧 Não Implementado: ${summary.notImplemented}/${summary.total}`);

    const successRate = ((summary.pass / summary.total) * 100).toFixed(2);
    console.log(`\n  📊 Taxa de Sucesso: ${successRate}%`);

    // Critical Issues
    const criticalIssues = this.results.filter(
      (r) => r.status === 'FAIL' || r.status === 'NOT_IMPLEMENTED'
    );

    if (criticalIssues.length > 0) {
      console.log('\n' + '='.repeat(80));
      console.log('🚨 PROBLEMAS CRÍTICOS');
      console.log('='.repeat(80));
      criticalIssues.forEach((issue) => {
        console.log(`  ⚠️  [${issue.section}] ${issue.feature}`);
        if (issue.message) {
          console.log(`     ${issue.message}`);
        }
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log(`✨ Teste concluído em ${new Date().toLocaleString('pt-BR')}`);
    console.log('='.repeat(80) + '\n');
  }
}

// Example usage
const exampleTheme: ThemeConfig = {
  // Header
  logoUrl: 'https://example.com/logo.png',
  logoAlignment: 'left',
  showLogoAtTop: true,
  faviconUrl: 'https://example.com/favicon.ico',
  backgroundColor: '#ffffff',
  useGradient: false,

  // Notice Bar
  noticeBarEnabled: true,
  noticeBarText: 'Frete grátis acima de R$100!',
  noticeBarTextColor: '#ffffff',
  noticeBarBackgroundColor: '#8b5cf6',
  noticeBarPosition: 'top',
  noticeBarStyle: 'highlight',

  // Banner
  bannerEnabled: false,

  // Cart
  cartDisplay: 'open',
  cartBackgroundColor: '#f9fafb',
  cartTextColor: '#1f2937',
  showProductImage: true,
  showQuantity: true,

  // Content
  nextStepStyle: 'rounded',
  payButtonText: 'Finalizar Compra',
  buttonBackgroundColor: '#8b5cf6',
  buttonTextColor: '#ffffff',

  // Footer
  footerBackgroundColor: '#1f2937',
  footerTextColor: '#ffffff',
  showSocialMedia: true,
  instagramUrl: 'https://instagram.com/example',

  // Settings
  navigationSteps: 5,
  fontFamily: 'Inter, sans-serif',
  language: 'pt',
  currency: 'BRL',
};

// Run tests
console.log('🔍 SyncAds AI - Teste de Menus de Personalização\n');
const tester = new CustomizationMenuTester(exampleTheme);
tester.runAllTests();
