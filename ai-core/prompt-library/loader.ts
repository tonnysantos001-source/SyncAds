/**
 * LIBRARY PROFILES LOADER
 * Carrega e converte library profiles do Python (MD) em PromptModules TypeScript
 */

import { PromptModule, ModuleCategory, ModuleComplexity, ExecutionEnvironment } from './registry';

export interface LibraryProfile {
  name: string;
  package: string;
  version: string;
  category: string;
  description: string;
  useCases: string[];
  installation: string;
  basicUsage: string;
  bestPractices: string[];
  commonPitfalls: string[];
  performanceTips: string[];
  whenToUse: string[];
  whenNotToUse: string[];
  alternatives: string[];
  examples: Array<{
    title: string;
    code: string;
    description: string;
  }>;
}

export class LibraryProfileLoader {
  private cache: Map<string, PromptModule> = new Map();
  private baseUrl: string;
  private profiles: Map<string, LibraryProfile> = new Map();

  constructor(baseUrl: string = '/python-service/app/omnibrain/library_profiles') {
    this.baseUrl = baseUrl;
  }

  /**
   * Carrega todos os profiles disponíveis
   */
  public async loadAll(): Promise<PromptModule[]> {
    const profileNames = this.getAvailableProfiles();
    const modules: PromptModule[] = [];

    for (const profileName of profileNames) {
      try {
        const module = await this.load(profileName);
        if (module) {
          modules.push(module);
        }
      } catch (error) {
        console.error(`Erro ao carregar profile ${profileName}:`, error);
      }
    }

    return modules;
  }

  /**
   * Carrega um profile específico
   */
  public async load(packageName: string): Promise<PromptModule | null> {
    // Verificar cache
    if (this.cache.has(packageName)) {
      return this.cache.get(packageName)!;
    }

    try {
      const profile = await this.fetchProfile(packageName);
      const module = this.convertToModule(profile);
      this.cache.set(packageName, module);
      return module;
    } catch (error) {
      console.error(`Erro ao carregar ${packageName}:`, error);
      return null;
    }
  }

  /**
   * Busca profile do servidor ou sistema de arquivos
   */
  private async fetchProfile(packageName: string): Promise<LibraryProfile> {
    const filename = `library_${packageName}.md`;
    const url = `${this.baseUrl}/${filename}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const markdown = await response.text();
      return this.parseMarkdown(markdown, packageName);
    } catch (error) {
      // Fallback: tentar carregar profile hardcoded
      return this.loadHardcodedProfile(packageName);
    }
  }

  /**
   * Parse markdown estruturado em LibraryProfile
   */
  private parseMarkdown(markdown: string, packageName: string): LibraryProfile {
    const profile: Partial<LibraryProfile> = {
      package: packageName,
      useCases: [],
      bestPractices: [],
      commonPitfalls: [],
      performanceTips: [],
      whenToUse: [],
      whenNotToUse: [],
      alternatives: [],
      examples: []
    };

    const lines = markdown.split('\n');
    let currentSection = '';
    let currentExample: any = null;
    let codeBlock = '';
    let inCodeBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Detectar code blocks
      if (line.startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        if (!inCodeBlock && codeBlock && currentExample) {
          currentExample.code = codeBlock.trim();
          codeBlock = '';
        }
        continue;
      }

      if (inCodeBlock) {
        codeBlock += line + '\n';
        continue;
      }

      // Detectar seções
      if (line.startsWith('# ')) {
        profile.name = line.replace('# ', '').trim();
      } else if (line.startsWith('## ')) {
        currentSection = line.replace('## ', '').toLowerCase().trim();

        // Se estava em um exemplo, salvar
        if (currentExample && currentSection !== 'examples') {
          profile.examples!.push(currentExample);
          currentExample = null;
        }
      } else if (line.startsWith('**Package:**')) {
        profile.package = line.split('**Package:**')[1].trim().replace(/`/g, '');
      } else if (line.startsWith('**Version:**')) {
        profile.version = line.split('**Version:**')[1].trim().replace(/`/g, '');
      } else if (line.startsWith('**Category:**')) {
        profile.category = line.split('**Category:**')[1].trim();
      } else if (line.startsWith('**Installation:**')) {
        profile.installation = line.split('**Installation:**')[1].trim().replace(/`/g, '');
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        const item = line.substring(2).trim();

        if (currentSection.includes('use case') || currentSection.includes('capabilities')) {
          profile.useCases!.push(item);
        } else if (currentSection.includes('best practice')) {
          profile.bestPractices!.push(item);
        } else if (currentSection.includes('pitfall') || currentSection.includes('avoid')) {
          profile.commonPitfalls!.push(item);
        } else if (currentSection.includes('performance') || currentSection.includes('optimization')) {
          profile.performanceTips!.push(item);
        } else if (currentSection.includes('when to use')) {
          profile.whenToUse!.push(item);
        } else if (currentSection.includes('when not to use') || currentSection.includes('limitations')) {
          profile.whenNotToUse!.push(item);
        } else if (currentSection.includes('alternative')) {
          profile.alternatives!.push(item);
        }
      } else if (line.startsWith('### ') && currentSection === 'examples') {
        // Salvar exemplo anterior
        if (currentExample) {
          profile.examples!.push(currentExample);
        }
        // Criar novo exemplo
        currentExample = {
          title: line.replace('### ', '').trim(),
          code: '',
          description: ''
        };
      } else if (currentExample && line && !line.startsWith('#')) {
        // Adicionar descrição ao exemplo
        if (!currentExample.description) {
          currentExample.description = line;
        } else {
          currentExample.description += ' ' + line;
        }
      } else if (!profile.description && line && !line.startsWith('#') && currentSection === '') {
        // Primeira descrição após o título
        profile.description = line;
      }
    }

    // Salvar último exemplo
    if (currentExample) {
      profile.examples!.push(currentExample);
    }

    return profile as LibraryProfile;
  }

  /**
   * Converte LibraryProfile para PromptModule
   */
  private convertToModule(profile: LibraryProfile): PromptModule {
    return {
      id: `lib-${profile.package.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`,
      name: profile.name || profile.package,
      packageName: profile.package,
      version: profile.version || 'latest',
      category: this.mapCategory(profile.category),
      subcategories: this.extractSubcategories(profile),
      description: profile.description || `${profile.name} Python library`,
      purpose: profile.description || '',
      useCases: profile.useCases || [],
      complexity: this.estimateComplexity(profile),
      environment: ExecutionEnvironment.PYTHON,
      dependencies: [],
      installCommand: profile.installation || `pip install ${profile.package}`,
      promptSystem: {
        systemPrompt: this.generateSystemPrompt(profile),
        instructions: this.generateInstructions(profile),
        bestPractices: profile.bestPractices || [],
        commonPitfalls: profile.commonPitfalls || [],
        errorHandling: [],
        optimizationTips: profile.performanceTips || []
      },
      whenToUse: profile.whenToUse.map((condition, index) => ({
        condition,
        reasoning: `${profile.name} é adequado para este caso`,
        confidence: 0.8,
        priority: index + 1
      })),
      whenNotToUse: profile.whenNotToUse.map((condition, index) => ({
        condition,
        reasoning: 'Outras alternativas podem ser mais adequadas',
        confidence: 0.7,
        priority: index + 1
      })),
      mainFunctions: [],
      examples: profile.examples.map((ex, index) => ({
        title: ex.title,
        description: ex.description,
        input: {},
        code: ex.code,
        output: {},
        explanation: ex.description,
        useCase: ex.title
      })),
      inputFormat: {
        type: 'various',
        description: `Input formats for ${profile.name}`,
        examples: [],
      },
      outputFormat: {
        type: 'various',
        description: `Output formats from ${profile.name}`,
        examples: [],
      },
      fallbackModules: [],
      alternativeModules: profile.alternatives.map(alt =>
        `lib-${alt.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`
      ),
      avgExecutionTime: 1000,
      memoryUsage: 'varies',
      cpuIntensive: this.isCPUIntensive(profile),
      gpuSupport: this.hasGPUSupport(profile),
      reliability: 0.9,
      successRate: 0.9,
      popularity: 80,
      lastUpdated: Date.now(),
      status: 'active',
      documentation: this.extractDocUrl(profile),
      repository: `https://github.com/${profile.package}`,
      license: 'MIT',
      tags: this.extractTags(profile)
    };
  }

  /**
   * Mapeia categoria do profile para ModuleCategory
   */
  private mapCategory(category: string): ModuleCategory {
    const categoryMap: Record<string, ModuleCategory> = {
      'data processing': ModuleCategory.DATA_PROCESSING,
      'web scraping': ModuleCategory.WEB_SCRAPING,
      'image processing': ModuleCategory.IMAGE_PROCESSING,
      'video processing': ModuleCategory.VIDEO_PROCESSING,
      'audio processing': ModuleCategory.AUDIO_PROCESSING,
      'machine learning': ModuleCategory.MACHINE_LEARNING,
      'deep learning': ModuleCategory.DEEP_LEARNING,
      'nlp': ModuleCategory.NLP,
      'computer vision': ModuleCategory.COMPUTER_VISION,
      'visualization': ModuleCategory.DATA_VISUALIZATION,
      'web framework': ModuleCategory.WEB_FRAMEWORK,
      'http client': ModuleCategory.API_CLIENT,
      'database': ModuleCategory.DATABASE,
      'scientific': ModuleCategory.SCIENTIFIC_COMPUTING,
    };

    const normalized = category?.toLowerCase() || '';

    for (const [key, value] of Object.entries(categoryMap)) {
      if (normalized.includes(key)) {
        return value;
      }
    }

    return ModuleCategory.OTHER;
  }

  /**
   * Extrai subcategorias do profile
   */
  private extractSubcategories(profile: LibraryProfile): string[] {
    const subcats: string[] = [];
    const text = `${profile.description} ${profile.useCases.join(' ')}`.toLowerCase();

    if (text.includes('dataframe') || text.includes('csv')) subcats.push('data-manipulation');
    if (text.includes('api') || text.includes('http')) subcats.push('api-client');
    if (text.includes('scraping') || text.includes('html')) subcats.push('web-scraping');
    if (text.includes('image') || text.includes('photo')) subcats.push('image-processing');
    if (text.includes('video') || text.includes('movie')) subcats.push('video-processing');
    if (text.includes('audio') || text.includes('sound')) subcats.push('audio-processing');
    if (text.includes('ml') || text.includes('machine learning')) subcats.push('machine-learning');
    if (text.includes('neural') || text.includes('deep learning')) subcats.push('deep-learning');

    return subcats.length > 0 ? subcats : ['general'];
  }

  /**
   * Estima complexidade baseado no profile
   */
  private estimateComplexity(profile: LibraryProfile): ModuleComplexity {
    const text = `${profile.description} ${profile.useCases.join(' ')}`.toLowerCase();

    if (text.includes('advanced') || text.includes('expert') || text.includes('deep learning')) {
      return ModuleComplexity.EXPERT;
    }
    if (text.includes('complex') || text.includes('machine learning')) {
      return ModuleComplexity.ADVANCED;
    }
    if (text.includes('basic') || text.includes('simple')) {
      return ModuleComplexity.BASIC;
    }

    return ModuleComplexity.INTERMEDIATE;
  }

  /**
   * Gera system prompt baseado no profile
   */
  private generateSystemPrompt(profile: LibraryProfile): string {
    return `You are an expert in ${profile.name}, the ${profile.category} library.
${profile.description}

When working with ${profile.name}, you should:
- Follow best practices
- Write efficient and maintainable code
- Handle errors appropriately
- Document your code clearly
- Consider performance implications`;
  }

  /**
   * Gera instruções baseadas no profile
   */
  private generateInstructions(profile: LibraryProfile): string[] {
    const instructions = [
      `Import ${profile.name} correctly: ${profile.installation}`,
      'Always handle exceptions appropriately',
      'Validate inputs before processing',
      'Document complex operations',
      'Use type hints when possible'
    ];

    return instructions;
  }

  /**
   * Verifica se é CPU intensive
   */
  private isCPUIntensive(profile: LibraryProfile): boolean {
    const text = `${profile.description} ${profile.category}`.toLowerCase();
    return text.includes('compute') || text.includes('processing') ||
           text.includes('machine learning') || text.includes('video');
  }

  /**
   * Verifica se tem suporte a GPU
   */
  private hasGPUSupport(profile: LibraryProfile): boolean {
    const text = `${profile.name} ${profile.description}`.toLowerCase();
    return text.includes('gpu') || text.includes('cuda') ||
           text.includes('tensorflow') || text.includes('torch');
  }

  /**
   * Extrai URL de documentação
   */
  private extractDocUrl(profile: LibraryProfile): string {
    return `https://${profile.package}.readthedocs.io/` ||
           `https://pypi.org/project/${profile.package}/`;
  }

  /**
   * Extrai tags do profile
   */
  private extractTags(profile: LibraryProfile): string[] {
    const tags: string[] = [profile.category.toLowerCase()];

    profile.useCases.forEach(useCase => {
      const words = useCase.toLowerCase().split(' ');
      words.forEach(word => {
        if (word.length > 4 && !tags.includes(word)) {
          tags.push(word);
        }
      });
    });

    return tags.slice(0, 10);
  }

  /**
   * Carrega profile hardcoded como fallback
   */
  private loadHardcodedProfile(packageName: string): LibraryProfile {
    const hardcoded: Record<string, Partial<LibraryProfile>> = {
      'pandas': {
        name: 'Pandas',
        package: 'pandas',
        version: '2.2.0',
        category: 'Data Processing',
        description: 'Powerful data analysis and manipulation library',
        useCases: ['CSV processing', 'Data analysis', 'Data cleaning'],
        installation: 'pip install pandas',
        bestPractices: ['Use vectorized operations', 'Avoid loops'],
        commonPitfalls: ['SettingWithCopyWarning'],
        whenToUse: ['Working with tabular data'],
        whenNotToUse: ['Data larger than memory'],
        alternatives: ['polars', 'dask'],
        examples: []
      }
    };

    return hardcoded[packageName] as LibraryProfile || this.getGenericProfile(packageName);
  }

  /**
   * Cria profile genérico
   */
  private getGenericProfile(packageName: string): LibraryProfile {
    return {
      name: packageName,
      package: packageName,
      version: 'latest',
      category: 'General',
      description: `${packageName} Python library`,
      useCases: [`Use ${packageName} for various tasks`],
      installation: `pip install ${packageName}`,
      basicUsage: '',
      bestPractices: [],
      commonPitfalls: [],
      performanceTips: [],
      whenToUse: [],
      whenNotToUse: [],
      alternatives: [],
      examples: []
    };
  }

  /**
   * Lista profiles disponíveis
   */
  private getAvailableProfiles(): string[] {
    return [
      'pandas',
      'numpy',
      'pillow',
      'opencv-python',
      'scikit-learn',
      'tensorflow',
      'torch',
      'transformers',
      'requests',
      'httpx',
      'beautifulsoup4',
      'scrapy',
      'selenium',
      'playwright',
      'sqlalchemy',
      'fastapi',
      'moviepy',
      'pydub',
      'reportlab'
    ];
  }

  /**
   * Limpa cache
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Recarrega um profile
   */
  public async reload(packageName: string): Promise<PromptModule | null> {
    this.cache.delete(packageName);
    return this.load(packageName);
  }
}

// Singleton instance
let loaderInstance: LibraryProfileLoader | null = null;

export function getLoader(): LibraryProfileLoader {
  if (!loaderInstance) {
    loaderInstance = new LibraryProfileLoader();
  }
  return loaderInstance;
}

export default LibraryProfileLoader;
