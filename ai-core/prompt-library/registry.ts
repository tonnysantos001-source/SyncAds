/**
 * PROMPT LIBRARY REGISTRY
 * Sistema de Registro de Módulos de Prompt
 * Gerencia +300 módulos de bibliotecas Python e suas regras de uso
 */

// ==================== TIPOS E INTERFACES ====================

export enum ModuleCategory {
  DATA_PROCESSING = 'DATA_PROCESSING',
  WEB_SCRAPING = 'WEB_SCRAPING',
  IMAGE_PROCESSING = 'IMAGE_PROCESSING',
  VIDEO_PROCESSING = 'VIDEO_PROCESSING',
  AUDIO_PROCESSING = 'AUDIO_PROCESSING',
  MACHINE_LEARNING = 'MACHINE_LEARNING',
  DEEP_LEARNING = 'DEEP_LEARNING',
  NLP = 'NLP',
  COMPUTER_VISION = 'COMPUTER_VISION',
  DATA_VISUALIZATION = 'DATA_VISUALIZATION',
  WEB_FRAMEWORK = 'WEB_FRAMEWORK',
  API_CLIENT = 'API_CLIENT',
  DATABASE = 'DATABASE',
  FILE_PROCESSING = 'FILE_PROCESSING',
  SECURITY = 'SECURITY',
  TESTING = 'TESTING',
  AUTOMATION = 'AUTOMATION',
  NETWORKING = 'NETWORKING',
  CLOUD_SERVICES = 'CLOUD_SERVICES',
  BLOCKCHAIN = 'BLOCKCHAIN',
  IOT = 'IOT',
  GAME_DEVELOPMENT = 'GAME_DEVELOPMENT',
  SCIENTIFIC_COMPUTING = 'SCIENTIFIC_COMPUTING',
  GEOSPATIAL = 'GEOSPATIAL',
  TIME_SERIES = 'TIME_SERIES',
  OPTIMIZATION = 'OPTIMIZATION',
  ROBOTICS = 'ROBOTICS',
  UTILITIES = 'UTILITIES',
  OTHER = 'OTHER'
}

export enum ModuleComplexity {
  BASIC = 'BASIC',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  EXPERT = 'EXPERT'
}

export enum ExecutionEnvironment {
  PYTHON = 'PYTHON',
  BROWSER = 'BROWSER',
  NODE = 'NODE',
  HYBRID = 'HYBRID'
}

export interface PromptModule {
  // Identificação
  id: string;
  name: string;
  packageName: string;
  version: string;
  category: ModuleCategory;
  subcategories: string[];

  // Descrição
  description: string;
  purpose: string;
  useCases: string[];

  // Configuração
  complexity: ModuleComplexity;
  environment: ExecutionEnvironment;
  dependencies: string[];
  installCommand: string;

  // Prompt System
  promptSystem: PromptSystemConfig;

  // Regras de Uso
  whenToUse: UsageRule[];
  whenNotToUse: UsageRule[];

  // Funções Principais
  mainFunctions: ModuleFunction[];

  // Exemplos
  examples: UsageExample[];

  // I/O
  inputFormat: IOFormat;
  outputFormat: IOFormat;

  // Fallback
  fallbackModules: string[];
  alternativeModules: string[];

  // Performance
  avgExecutionTime: number;
  memoryUsage: string;
  cpuIntensive: boolean;
  gpuSupport: boolean;

  // Metadados
  reliability: number; // 0-1
  successRate: number; // 0-1
  popularity: number; // 0-100
  lastUpdated: number;
  status: 'active' | 'deprecated' | 'experimental';

  // Extras
  documentation: string;
  repository: string;
  license: string;
  tags: string[];
}

export interface PromptSystemConfig {
  systemPrompt: string;
  instructions: string[];
  bestPractices: string[];
  commonPitfalls: string[];
  errorHandling: string[];
  optimizationTips: string[];
}

export interface UsageRule {
  condition: string;
  reasoning: string;
  confidence: number;
  priority: number;
}

export interface ModuleFunction {
  name: string;
  description: string;
  signature: string;
  parameters: FunctionParameter[];
  returnType: string;
  example: string;
  promptTemplate: string;
}

export interface FunctionParameter {
  name: string;
  type: string;
  required: boolean;
  default?: any;
  description: string;
  validation?: string;
}

export interface UsageExample {
  title: string;
  description: string;
  input: any;
  code: string;
  output: any;
  explanation: string;
  useCase: string;
}

export interface IOFormat {
  type: string;
  schema?: any;
  description: string;
  examples: any[];
  validation?: string;
}

export interface SearchCriteria {
  query?: string;
  category?: ModuleCategory;
  complexity?: ModuleComplexity;
  environment?: ExecutionEnvironment;
  tags?: string[];
  minReliability?: number;
  maxExecutionTime?: number;
  requiresGPU?: boolean;
}

export interface ModuleStats {
  totalModules: number;
  byCategory: Record<string, number>;
  byComplexity: Record<string, number>;
  byEnvironment: Record<string, number>;
  avgReliability: number;
  avgSuccessRate: number;
  mostPopular: PromptModule[];
  mostReliable: PromptModule[];
  recentlyUpdated: PromptModule[];
}

// ==================== REGISTRY CLASS ====================

export class PromptLibraryRegistry {
  private modules: Map<string, PromptModule> = new Map();
  private categoryIndex: Map<ModuleCategory, Set<string>> = new Map();
  private tagIndex: Map<string, Set<string>> = new Map();
  private packageIndex: Map<string, string> = new Map();

  constructor() {
    this.initializeIndexes();
  }

  // ==================== INICIALIZAÇÃO ====================

  private initializeIndexes(): void {
    // Inicializar índices de categoria
    Object.values(ModuleCategory).forEach(category => {
      this.categoryIndex.set(category, new Set());
    });
  }

  // ==================== REGISTRO DE MÓDULOS ====================

  public register(module: PromptModule): void {
    // Validar módulo
    this.validateModule(module);

    // Registrar módulo
    this.modules.set(module.id, module);

    // Atualizar índices
    this.updateIndexes(module);

    console.log(`✓ Módulo registrado: ${module.name} [${module.packageName}]`);
  }

  public registerBatch(modules: PromptModule[]): void {
    modules.forEach(module => this.register(module));
    console.log(`✓ ${modules.length} módulos registrados em batch`);
  }

  private validateModule(module: PromptModule): void {
    if (!module.id || !module.name || !module.packageName) {
      throw new Error('Módulo inválido: campos obrigatórios faltando');
    }

    if (this.modules.has(module.id)) {
      throw new Error(`Módulo já registrado: ${module.id}`);
    }

    if (this.packageIndex.has(module.packageName)) {
      console.warn(`Aviso: Pacote ${module.packageName} já registrado`);
    }
  }

  private updateIndexes(module: PromptModule): void {
    // Índice de categoria
    this.categoryIndex.get(module.category)?.add(module.id);

    // Índice de tags
    module.tags.forEach(tag => {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)?.add(module.id);
    });

    // Índice de pacotes
    this.packageIndex.set(module.packageName, module.id);
  }

  // ==================== BUSCA DE MÓDULOS ====================

  public get(id: string): PromptModule | undefined {
    return this.modules.get(id);
  }

  public getByPackage(packageName: string): PromptModule | undefined {
    const id = this.packageIndex.get(packageName);
    return id ? this.modules.get(id) : undefined;
  }

  public getByCategory(category: ModuleCategory): PromptModule[] {
    const ids = this.categoryIndex.get(category) || new Set();
    return Array.from(ids).map(id => this.modules.get(id)!).filter(Boolean);
  }

  public getByTag(tag: string): PromptModule[] {
    const ids = this.tagIndex.get(tag) || new Set();
    return Array.from(ids).map(id => this.modules.get(id)!).filter(Boolean);
  }

  public search(criteria: SearchCriteria): PromptModule[] {
    let results = Array.from(this.modules.values());

    // Filtrar por query
    if (criteria.query) {
      const query = criteria.query.toLowerCase();
      results = results.filter(m =>
        m.name.toLowerCase().includes(query) ||
        m.description.toLowerCase().includes(query) ||
        m.packageName.toLowerCase().includes(query) ||
        m.tags.some(t => t.toLowerCase().includes(query))
      );
    }

    // Filtrar por categoria
    if (criteria.category) {
      results = results.filter(m => m.category === criteria.category);
    }

    // Filtrar por complexidade
    if (criteria.complexity) {
      results = results.filter(m => m.complexity === criteria.complexity);
    }

    // Filtrar por ambiente
    if (criteria.environment) {
      results = results.filter(m => m.environment === criteria.environment);
    }

    // Filtrar por tags
    if (criteria.tags && criteria.tags.length > 0) {
      results = results.filter(m =>
        criteria.tags!.some(tag => m.tags.includes(tag))
      );
    }

    // Filtrar por confiabilidade mínima
    if (criteria.minReliability !== undefined) {
      results = results.filter(m => m.reliability >= criteria.minReliability!);
    }

    // Filtrar por tempo máximo de execução
    if (criteria.maxExecutionTime !== undefined) {
      results = results.filter(m => m.avgExecutionTime <= criteria.maxExecutionTime!);
    }

    // Filtrar por GPU
    if (criteria.requiresGPU !== undefined) {
      results = results.filter(m => m.gpuSupport === criteria.requiresGPU);
    }

    return results;
  }

  public findBestMatch(requirements: string): PromptModule | null {
    // Análise inteligente de requisitos
    const keywords = this.extractKeywords(requirements);
    const scoredModules = this.scoreModules(keywords);

    return scoredModules.length > 0 ? scoredModules[0].module : null;
  }

  private extractKeywords(text: string): string[] {
    const keywords: string[] = [];
    const lowerText = text.toLowerCase();

    // Extração básica de palavras-chave
    const words = lowerText.split(/\s+/);

    // Adicionar bi-gramas e tri-gramas também
    for (let i = 0; i < words.length; i++) {
      keywords.push(words[i]);
      if (i < words.length - 1) {
        keywords.push(`${words[i]} ${words[i + 1]}`);
      }
      if (i < words.length - 2) {
        keywords.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
      }
    }

    return keywords;
  }

  private scoreModules(keywords: string[]): Array<{ module: PromptModule; score: number }> {
    const scored: Array<{ module: PromptModule; score: number }> = [];

    for (const module of this.modules.values()) {
      let score = 0;

      // Pontuação por nome
      keywords.forEach(keyword => {
        if (module.name.toLowerCase().includes(keyword)) score += 10;
        if (module.description.toLowerCase().includes(keyword)) score += 5;
        if (module.purpose.toLowerCase().includes(keyword)) score += 3;
        if (module.tags.some(t => t.toLowerCase().includes(keyword))) score += 2;
      });

      // Bonificação por confiabilidade
      score *= module.reliability;

      // Bonificação por taxa de sucesso
      score *= module.successRate;

      // Penalidade por complexidade
      if (module.complexity === ModuleComplexity.EXPERT) score *= 0.8;
      if (module.complexity === ModuleComplexity.ADVANCED) score *= 0.9;

      // Penalidade por deprecated
      if (module.status === 'deprecated') score *= 0.3;
      if (module.status === 'experimental') score *= 0.7;

      scored.push({ module, score });
    }

    return scored.sort((a, b) => b.score - a.score);
  }

  // ==================== RECOMENDAÇÕES ====================

  public recommendAlternatives(moduleId: string, limit: number = 5): PromptModule[] {
    const module = this.modules.get(moduleId);
    if (!module) return [];

    // Buscar módulos da mesma categoria
    const sameCategory = this.getByCategory(module.category);

    // Filtrar e ordenar por similaridade
    return sameCategory
      .filter(m => m.id !== moduleId)
      .map(m => ({
        module: m,
        similarity: this.calculateSimilarity(module, m)
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(item => item.module);
  }

  private calculateSimilarity(m1: PromptModule, m2: PromptModule): number {
    let score = 0;

    // Mesma categoria
    if (m1.category === m2.category) score += 30;

    // Tags em comum
    const commonTags = m1.tags.filter(t => m2.tags.includes(t));
    score += commonTags.length * 5;

    // Subcategorias em comum
    const commonSubcats = m1.subcategories.filter(s => m2.subcategories.includes(s));
    score += commonSubcats.length * 3;

    // Mesma complexidade
    if (m1.complexity === m2.complexity) score += 10;

    // Mesmo ambiente
    if (m1.environment === m2.environment) score += 10;

    return score;
  }

  public getFallbackChain(moduleId: string): PromptModule[] {
    const module = this.modules.get(moduleId);
    if (!module) return [];

    const chain: PromptModule[] = [];

    // Adicionar fallbacks diretos
    module.fallbackModules.forEach(fallbackId => {
      const fallback = this.modules.get(fallbackId);
      if (fallback) chain.push(fallback);
    });

    // Adicionar alternativas
    module.alternativeModules.forEach(altId => {
      const alt = this.modules.get(altId);
      if (alt && !chain.includes(alt)) chain.push(alt);
    });

    return chain;
  }

  // ==================== ESTATÍSTICAS ====================

  public getStats(): ModuleStats {
    const modules = Array.from(this.modules.values());

    const byCategory: Record<string, number> = {};
    const byComplexity: Record<string, number> = {};
    const byEnvironment: Record<string, number> = {};

    modules.forEach(m => {
      byCategory[m.category] = (byCategory[m.category] || 0) + 1;
      byComplexity[m.complexity] = (byComplexity[m.complexity] || 0) + 1;
      byEnvironment[m.environment] = (byEnvironment[m.environment] || 0) + 1;
    });

    const avgReliability = modules.reduce((sum, m) => sum + m.reliability, 0) / modules.length;
    const avgSuccessRate = modules.reduce((sum, m) => sum + m.successRate, 0) / modules.length;

    const mostPopular = [...modules]
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 10);

    const mostReliable = [...modules]
      .sort((a, b) => b.reliability - a.reliability)
      .slice(0, 10);

    const recentlyUpdated = [...modules]
      .sort((a, b) => b.lastUpdated - a.lastUpdated)
      .slice(0, 10);

    return {
      totalModules: modules.length,
      byCategory,
      byComplexity,
      byEnvironment,
      avgReliability,
      avgSuccessRate,
      mostPopular,
      mostReliable,
      recentlyUpdated
    };
  }

  // ==================== EXPORTAÇÃO ====================

  public export(): PromptModule[] {
    return Array.from(this.modules.values());
  }

  public exportByCategory(category: ModuleCategory): PromptModule[] {
    return this.getByCategory(category);
  }

  public exportJSON(): string {
    return JSON.stringify(this.export(), null, 2);
  }

  // ==================== MANUTENÇÃO ====================

  public update(id: string, updates: Partial<PromptModule>): void {
    const module = this.modules.get(id);
    if (!module) {
      throw new Error(`Módulo não encontrado: ${id}`);
    }

    const updated = { ...module, ...updates, lastUpdated: Date.now() };
    this.modules.set(id, updated);

    // Reindexar se necessário
    if (updates.category || updates.tags) {
      this.updateIndexes(updated);
    }

    console.log(`✓ Módulo atualizado: ${id}`);
  }

  public remove(id: string): void {
    const module = this.modules.get(id);
    if (!module) return;

    // Remover dos índices
    this.categoryIndex.get(module.category)?.delete(id);
    module.tags.forEach(tag => {
      this.tagIndex.get(tag)?.delete(id);
    });
    this.packageIndex.delete(module.packageName);

    // Remover módulo
    this.modules.delete(id);

    console.log(`✓ Módulo removido: ${id}`);
  }

  public clear(): void {
    this.modules.clear();
    this.categoryIndex.clear();
    this.tagIndex.clear();
    this.packageIndex.clear();
    this.initializeIndexes();
    console.log('✓ Registry limpo');
  }

  // ==================== UTILITÁRIOS ====================

  public list(filter?: { status?: PromptModule['status']; category?: ModuleCategory }): PromptModule[] {
    let modules = Array.from(this.modules.values());

    if (filter?.status) {
      modules = modules.filter(m => m.status === filter.status);
    }

    if (filter?.category) {
      modules = modules.filter(m => m.category === filter.category);
    }

    return modules.sort((a, b) => a.name.localeCompare(b.name));
  }

  public count(): number {
    return this.modules.size;
  }

  public has(id: string): boolean {
    return this.modules.has(id);
  }
}

// ==================== FACTORY ====================

let globalRegistry: PromptLibraryRegistry | null = null;

export function getRegistry(): PromptLibraryRegistry {
  if (!globalRegistry) {
    globalRegistry = new PromptLibraryRegistry();
  }
  return globalRegistry;
}

export function createRegistry(): PromptLibraryRegistry {
  return new PromptLibraryRegistry();
}

// ==================== EXPORTS ====================

export default PromptLibraryRegistry;
