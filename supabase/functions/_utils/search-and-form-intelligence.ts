// ============================================================================
// SEARCH & FORM INTELLIGENCE - Sistema Inteligente de Busca e Formulários
// ============================================================================
// Auto-detecção de campos, validação, comparação de produtos e refinamento
// ============================================================================

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ============================================================================
// SEARCH INTELLIGENCE
// ============================================================================

export interface SearchQuery {
  term: string;
  filters?: Record<string, any>;
  sortBy?: string;
  maxResults?: number;
  site?: string;
}

export interface SearchResult {
  title: string;
  url: string;
  price?: number;
  rating?: number;
  reviews?: number;
  description?: string;
  image?: string;
  inStock?: boolean;
  metadata?: Record<string, any>;
}

export interface ProductComparison {
  products: SearchResult[];
  cheapest: SearchResult;
  mostExpensive: SearchResult;
  bestRated: SearchResult;
  averagePrice: number;
  priceRange: { min: number; max: number };
  insights: string[];
}

export class SearchIntelligence {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Executa busca inteligente com refinamento automático
   */
  async smartSearch(query: SearchQuery): Promise<{
    results: SearchResult[];
    refinedQuery: string;
    suggestions: string[];
  }> {
    console.log('🔍 Smart Search:', query);

    // Refinar query automaticamente
    const refinedQuery = this.refineSearchQuery(query.term);

    // Extrair dados da página de resultados
    const results = await this.extractSearchResults(query.site || 'google');

    // Gerar sugestões de refinamento
    const suggestions = this.generateSearchSuggestions(query.term, results);

    return {
      results,
      refinedQuery,
      suggestions,
    };
  }

  /**
   * Compara produtos de múltiplas fontes
   */
  async compareProducts(productName: string, sites: string[]): Promise<ProductComparison> {
    console.log('📊 Comparing products:', productName, 'across', sites.length, 'sites');

    const allProducts: SearchResult[] = [];

    // Buscar em cada site
    for (const site of sites) {
      try {
        const products = await this.searchProductsOnSite(productName, site);
        allProducts.push(...products);
      } catch (error) {
        console.warn(`Failed to search on ${site}:`, error);
      }
    }

    if (allProducts.length === 0) {
      throw new Error('No products found');
    }

    // Análise e comparação
    const productsWithPrice = allProducts.filter(p => p.price !== undefined && p.price > 0);

    const cheapest = productsWithPrice.reduce((min, p) =>
      (p.price! < min.price! ? p : min)
    );

    const mostExpensive = productsWithPrice.reduce((max, p) =>
      (p.price! > max.price! ? p : max)
    );

    const bestRated = allProducts
      .filter(p => p.rating !== undefined)
      .reduce((best, p) =>
        (p.rating! > (best.rating || 0) ? p : best)
      , allProducts[0]);

    const prices = productsWithPrice.map(p => p.price!);
    const averagePrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const priceRange = {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };

    // Gerar insights
    const insights = this.generateComparisonInsights(
      allProducts,
      averagePrice,
      priceRange
    );

    return {
      products: allProducts,
      cheapest,
      mostExpensive,
      bestRated,
      averagePrice,
      priceRange,
      insights,
    };
  }

  /**
   * Busca produtos em um site específico
   */
  private async searchProductsOnSite(
    productName: string,
    site: string
  ): Promise<SearchResult[]> {
    const siteConfigs: Record<string, { searchUrl: string; selectors: any }> = {
      'mercadolivre': {
        searchUrl: `https://lista.mercadolivre.com.br/${encodeURIComponent(productName)}`,
        selectors: {
          items: '.ui-search-result',
          title: '.ui-search-item__title',
          price: '.price-tag-amount',
          link: 'a.ui-search-link',
          image: '.ui-search-result-image__element',
        },
      },
      'amazon': {
        searchUrl: `https://www.amazon.com.br/s?k=${encodeURIComponent(productName)}`,
        selectors: {
          items: '[data-component-type="s-search-result"]',
          title: 'h2 a span',
          price: '.a-price-whole',
          link: 'h2 a',
          rating: '.a-icon-star-small',
        },
      },
      'magazineluiza': {
        searchUrl: `https://www.magazineluiza.com.br/busca/${encodeURIComponent(productName)}`,
        selectors: {
          items: '[data-testid="product-card"]',
          title: '[data-testid="product-title"]',
          price: '[data-testid="price-value"]',
          link: 'a',
        },
      },
    };

    const config = siteConfigs[site.toLowerCase()];
    if (!config) {
      throw new Error(`Site ${site} not supported`);
    }

    // Aqui seria executado via workflow DOM
    // Por ora, retorna estrutura placeholder
    return [];
  }

  /**
   * Refina query de busca automaticamente
   */
  private refineSearchQuery(query: string): string {
    let refined = query.trim().toLowerCase();

    // Remover palavras comuns que não agregam
    const stopWords = ['o', 'a', 'de', 'para', 'com', 'em', 'um', 'uma'];
    const words = refined.split(' ');
    refined = words.filter(w => !stopWords.includes(w)).join(' ');

    // Adicionar aspas para buscas exatas se necessário
    if (words.length > 3) {
      refined = `"${refined}"`;
    }

    // Adicionar site: se for domínio específico
    // Ex: "notebook gamer site:mercadolivre.com.br"

    return refined;
  }

  /**
   * Extrai resultados de busca da página
   */
  private async extractSearchResults(site: string): Promise<SearchResult[]> {
    // Implementação via DOM extraction
    return [];
  }

  /**
   * Gera sugestões de refinamento de busca
   */
  private generateSearchSuggestions(
    originalQuery: string,
    results: SearchResult[]
  ): string[] {
    const suggestions: string[] = [];

    // Sugerir filtros baseado em resultados
    if (results.length > 50) {
      suggestions.push(`Tente adicionar marca: "${originalQuery} + marca"`);
      suggestions.push(`Refine por preço: "${originalQuery} até R$ X"`);
    }

    if (results.length === 0) {
      suggestions.push(`Tente termos mais genéricos`);
      suggestions.push(`Verifique a ortografia`);
      suggestions.push(`Use sinônimos`);
    }

    // Sugerir termos relacionados
    const relatedTerms = this.getRelatedTerms(originalQuery);
    relatedTerms.forEach(term => {
      suggestions.push(`Pesquisar por: "${term}"`);
    });

    return suggestions.slice(0, 5);
  }

  /**
   * Obtém termos relacionados
   */
  private getRelatedTerms(query: string): string[] {
    const related: Record<string, string[]> = {
      'notebook': ['laptop', 'computador portátil', 'ultrabook'],
      'celular': ['smartphone', 'telefone', 'mobile'],
      'tv': ['televisão', 'televisor', 'smart tv'],
      'geladeira': ['refrigerador', 'frigobar'],
      'fogão': ['cooktop', 'fogão de piso'],
    };

    for (const [key, values] of Object.entries(related)) {
      if (query.toLowerCase().includes(key)) {
        return values;
      }
    }

    return [];
  }

  /**
   * Gera insights de comparação
   */
  private generateComparisonInsights(
    products: SearchResult[],
    avgPrice: number,
    priceRange: { min: number; max: number }
  ): string[] {
    const insights: string[] = [];

    // Insight de variação de preço
    const variation = ((priceRange.max - priceRange.min) / priceRange.min) * 100;
    if (variation > 50) {
      insights.push(
        `⚠️ Grande variação de preço: ${variation.toFixed(0)}% de diferença entre menor e maior preço`
      );
    }

    // Insight de preço médio
    insights.push(
      `💰 Preço médio encontrado: R$ ${avgPrice.toFixed(2)}`
    );

    // Insight de economia
    const savings = priceRange.max - priceRange.min;
    insights.push(
      `💸 Você pode economizar até R$ ${savings.toFixed(2)} comprando no melhor preço`
    );

    // Insight de avaliações
    const ratedProducts = products.filter(p => p.rating !== undefined);
    if (ratedProducts.length > 0) {
      const avgRating = ratedProducts.reduce((sum, p) => sum + (p.rating || 0), 0) / ratedProducts.length;
      insights.push(
        `⭐ Avaliação média: ${avgRating.toFixed(1)}/5.0 (${ratedProducts.length} produtos avaliados)`
      );
    }

    // Insight de disponibilidade
    const inStockCount = products.filter(p => p.inStock === true).length;
    const stockPercentage = (inStockCount / products.length) * 100;
    insights.push(
      `📦 ${stockPercentage.toFixed(0)}% dos produtos em estoque (${inStockCount}/${products.length})`
    );

    return insights;
  }
}

// ============================================================================
// FORM INTELLIGENCE
// ============================================================================

export interface FormField {
  name: string;
  type: 'text' | 'email' | 'password' | 'tel' | 'number' | 'date' | 'select' | 'checkbox' | 'radio';
  label?: string;
  placeholder?: string;
  required: boolean;
  selector: string;
  validation?: FieldValidation;
  autoFillable?: boolean;
}

export interface FieldValidation {
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  customRule?: string;
}

export interface FormAnalysis {
  fields: FormField[];
  totalFields: number;
  requiredFields: number;
  autoFillableFields: number;
  estimatedFillTime: number; // em segundos
  complexity: 'simple' | 'medium' | 'complex';
}

export interface UserProfile {
  nome?: string;
  email?: string;
  telefone?: string;
  cpf?: string;
  dataNascimento?: string;
  endereco?: {
    cep?: string;
    rua?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
  };
  empresa?: {
    nome?: string;
    cnpj?: string;
    cargo?: string;
  };
}

export class FormIntelligence {
  private supabase: SupabaseClient;
  private userProfile: UserProfile;

  constructor(supabase: SupabaseClient, userProfile?: UserProfile) {
    this.supabase = supabase;
    this.userProfile = userProfile || {};
  }

  /**
   * Analisa formulário automaticamente
   */
  async analyzeForm(formSelector: string = 'form'): Promise<FormAnalysis> {
    console.log('📋 Analyzing form:', formSelector);

    // Detectar campos automaticamente
    const fields = await this.detectFormFields(formSelector);

    // Calcular métricas
    const totalFields = fields.length;
    const requiredFields = fields.filter(f => f.required).length;
    const autoFillableFields = fields.filter(f => f.autoFillable).length;

    // Estimar tempo de preenchimento
    const estimatedFillTime = this.estimateFillTime(fields);

    // Determinar complexidade
    const complexity = this.determineComplexity(totalFields, requiredFields);

    return {
      fields,
      totalFields,
      requiredFields,
      autoFillableFields,
      estimatedFillTime,
      complexity,
    };
  }

  /**
   * Preenche formulário automaticamente com dados do perfil
   */
  async autoFillForm(formSelector: string = 'form'): Promise<{
    success: boolean;
    filledFields: number;
    errors: string[];
  }> {
    console.log('✍️ Auto-filling form:', formSelector);

    const analysis = await this.analyzeForm(formSelector);
    const errors: string[] = [];
    let filledFields = 0;

    for (const field of analysis.fields) {
      if (!field.autoFillable) continue;

      try {
        const value = this.getValueForField(field);
        if (value) {
          // Validar antes de preencher
          if (field.validation) {
            const isValid = this.validateFieldValue(value, field.validation);
            if (!isValid) {
              errors.push(`Campo ${field.name}: valor inválido`);
              continue;
            }
          }

          // Aqui seria executado via comando DOM
          // await this.fillField(field.selector, value);
          filledFields++;
        }
      } catch (error) {
        errors.push(`Campo ${field.name}: ${error}`);
      }
    }

    return {
      success: errors.length === 0,
      filledFields,
      errors,
    };
  }

  /**
   * Detecta campos do formulário automaticamente
   */
  private async detectFormFields(formSelector: string): Promise<FormField[]> {
    // Implementação real seria via DOM extraction
    // Por ora, retorna detecção baseada em padrões comuns

    const commonFields: FormField[] = [
      {
        name: 'nome',
        type: 'text',
        label: 'Nome completo',
        required: true,
        selector: 'input[name="nome"], input[name="name"], input[id="nome"]',
        autoFillable: true,
      },
      {
        name: 'email',
        type: 'email',
        label: 'E-mail',
        required: true,
        selector: 'input[type="email"], input[name="email"]',
        validation: {
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
        },
        autoFillable: true,
      },
      {
        name: 'telefone',
        type: 'tel',
        label: 'Telefone',
        required: true,
        selector: 'input[type="tel"], input[name*="telefone"], input[name*="phone"]',
        validation: {
          pattern: '^\\(?\\d{2}\\)?\\s?\\d{4,5}-?\\d{4}$',
        },
        autoFillable: true,
      },
      {
        name: 'cpf',
        type: 'text',
        label: 'CPF',
        required: false,
        selector: 'input[name*="cpf"]',
        validation: {
          pattern: '^\\d{3}\\.?\\d{3}\\.?\\d{3}-?\\d{2}$',
        },
        autoFillable: true,
      },
    ];

    return commonFields;
  }

  /**
   * Obtém valor do perfil para um campo
   */
  private getValueForField(field: FormField): string | undefined {
    const fieldNameLower = field.name.toLowerCase();

    // Nome
    if (fieldNameLower.includes('nome') || fieldNameLower.includes('name')) {
      return this.userProfile.nome;
    }

    // Email
    if (fieldNameLower.includes('email') || fieldNameLower.includes('mail')) {
      return this.userProfile.email;
    }

    // Telefone
    if (fieldNameLower.includes('telefone') || fieldNameLower.includes('phone') || fieldNameLower.includes('tel')) {
      return this.userProfile.telefone;
    }

    // CPF
    if (fieldNameLower.includes('cpf')) {
      return this.userProfile.cpf;
    }

    // Data de nascimento
    if (fieldNameLower.includes('nascimento') || fieldNameLower.includes('birthday') || fieldNameLower.includes('birth')) {
      return this.userProfile.dataNascimento;
    }

    // Endereço
    if (fieldNameLower.includes('cep') || fieldNameLower.includes('zip')) {
      return this.userProfile.endereco?.cep;
    }
    if (fieldNameLower.includes('rua') || fieldNameLower.includes('street')) {
      return this.userProfile.endereco?.rua;
    }
    if (fieldNameLower.includes('numero') || fieldNameLower.includes('number')) {
      return this.userProfile.endereco?.numero;
    }
    if (fieldNameLower.includes('cidade') || fieldNameLower.includes('city')) {
      return this.userProfile.endereco?.cidade;
    }
    if (fieldNameLower.includes('estado') || fieldNameLower.includes('state')) {
      return this.userProfile.endereco?.estado;
    }

    return undefined;
  }

  /**
   * Valida valor de campo
   */
  private validateFieldValue(value: string, validation: FieldValidation): boolean {
    // Pattern
    if (validation.pattern) {
      const regex = new RegExp(validation.pattern);
      if (!regex.test(value)) return false;
    }

    // Length
    if (validation.minLength && value.length < validation.minLength) return false;
    if (validation.maxLength && value.length > validation.maxLength) return false;

    // Number range
    const numValue = Number(value);
    if (!isNaN(numValue)) {
      if (validation.min !== undefined && numValue < validation.min) return false;
      if (validation.max !== undefined && numValue > validation.max) return false;
    }

    return true;
  }

  /**
   * Valida formato de CPF
   */
  static validateCPF(cpf: string): boolean {
    cpf = cpf.replace(/[^\d]/g, '');

    if (cpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (parseInt(cpf.charAt(9)) !== digit) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (parseInt(cpf.charAt(10)) !== digit) return false;

    return true;
  }

  /**
   * Valida formato de CNPJ
   */
  static validateCNPJ(cnpj: string): boolean {
    cnpj = cnpj.replace(/[^\d]/g, '');

    if (cnpj.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(cnpj)) return false;

    let size = cnpj.length - 2;
    let numbers = cnpj.substring(0, size);
    const digits = cnpj.substring(size);
    let sum = 0;
    let pos = size - 7;

    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0))) return false;

    size = size + 1;
    numbers = cnpj.substring(0, size);
    sum = 0;
    pos = size - 7;

    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(1))) return false;

    return true;
  }

  /**
   * Valida formato de email
   */
  static validateEmail(email: string): boolean {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
  }

  /**
   * Valida formato de telefone brasileiro
   */
  static validatePhone(phone: string): boolean {
    const cleaned = phone.replace(/[^\d]/g, '');
    return cleaned.length === 10 || cleaned.length === 11;
  }

  /**
   * Formata CPF
   */
  static formatCPF(cpf: string): string {
    const cleaned = cpf.replace(/[^\d]/g, '');
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  /**
   * Formata telefone
   */
  static formatPhone(phone: string): string {
    const cleaned = phone.replace(/[^\d]/g, '');
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }

  /**
   * Estima tempo de preenchimento
   */
  private estimateFillTime(fields: FormField[]): number {
    const timePerField = {
      text: 3,
      email: 4,
      password: 5,
      tel: 4,
      number: 2,
      date: 3,
      select: 2,
      checkbox: 1,
      radio: 1,
    };

    let totalTime = 0;
    for (const field of fields) {
      totalTime += timePerField[field.type] || 3;
    }

    return totalTime;
  }

  /**
   * Determina complexidade do formulário
   */
  private determineComplexity(totalFields: number, requiredFields: number): 'simple' | 'medium' | 'complex' {
    if (totalFields <= 3) return 'simple';
    if (totalFields <= 8) return 'medium';
    return 'complex';
  }
}

// ============================================================================
// EXPORT ALL
// ============================================================================

export default {
  SearchIntelligence,
  FormIntelligence,
};
