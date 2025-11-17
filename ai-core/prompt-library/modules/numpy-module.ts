/**
 * NUMPY MODULE - Biblioteca de Computação Científica
 * Módulo de Prompt System para a biblioteca NumPy
 */

import {
  PromptModule,
  ModuleCategory,
  ModuleComplexity,
  ExecutionEnvironment,
} from "../registry";

export const NumPyModule: PromptModule = {
  // ==================== IDENTIFICAÇÃO ====================
  id: "numpy-002",
  name: "NumPy",
  packageName: "numpy",
  version: "1.26.0",
  category: ModuleCategory.SCIENTIFIC_COMPUTING,
  subcategories: [
    "numerical-computing",
    "array-operations",
    "linear-algebra",
    "mathematical-operations",
    "random-numbers",
    "fourier-transform",
    "statistics",
  ],

  // ==================== DESCRIÇÃO ====================
  description:
    "Biblioteca fundamental para computação científica em Python, fornecendo suporte para arrays multidimensionais e operações matemáticas de alto desempenho.",
  purpose:
    "Realizar operações numéricas eficientes em arrays, álgebra linear, transformadas matemáticas e computação científica",
  useCases: [
    "Operações matemáticas vetorizadas em arrays",
    "Álgebra linear (matrizes, vetores, sistemas lineares)",
    "Geração de números aleatórios",
    "Transformadas de Fourier",
    "Operações estatísticas básicas",
    "Broadcasting e manipulação de arrays multidimensionais",
    "Indexação avançada e slicing",
    "Operações elemento por elemento (element-wise)",
    "Reshaping e transposição de arrays",
    "Integração com outras bibliotecas científicas",
  ],

  // ==================== CONFIGURAÇÃO ====================
  complexity: ModuleComplexity.INTERMEDIATE,
  environment: ExecutionEnvironment.PYTHON,
  dependencies: [],
  installCommand: "pip install numpy",

  // ==================== PROMPT SYSTEM ====================
  promptSystem: {
    systemPrompt: `Você é um especialista em NumPy, a biblioteca Python para computação numérica.
Ao trabalhar com NumPy, você SEMPRE deve:
- Usar operações vetorizadas ao invés de loops Python
- Especificar dtype apropriado para economizar memória
- Usar broadcasting quando possível
- Evitar cópias desnecessárias de arrays
- Usar views ao invés de cópias quando apropriado
- Considerar ordem de memória (C-contiguous vs F-contiguous)
- Usar funções universais (ufuncs) para operações elemento por elemento
- Documentar shape esperado dos arrays`,

    instructions: [
      "1. SEMPRE importe numpy como: import numpy as np",
      "2. Especifique dtype ao criar arrays: np.array([1, 2, 3], dtype=np.float32)",
      "3. Use np.zeros(), np.ones(), np.empty() para pré-alocar arrays",
      "4. Prefira operações vetorizadas: arr + 5 ao invés de [x + 5 for x in arr]",
      "5. Use broadcasting para operações em arrays de diferentes shapes",
      "6. Verifique shape dos arrays com arr.shape antes de operações",
      "7. Use np.newaxis ou reshape para adicionar dimensões",
      "8. Prefira arr.copy() explícito quando precisar de cópia",
      "9. Use np.where() para operações condicionais vetorizadas",
      "10. Sempre valide dimensões antes de operações de álgebra linear",
    ],

    bestPractices: [
      "Use dtype apropriado: int8/16/32 para inteiros, float32/64 para decimais",
      "Pré-aloque arrays quando souber o tamanho final",
      "Use np.concatenate() ou np.vstack()/np.hstack() ao invés de append em loop",
      "Aproveite broadcasting para evitar loops explícitos",
      "Use views (slicing) ao invés de cópias quando possível",
      "Prefira np.einsum() para operações tensoriais complexas",
      "Use np.clip() para limitar valores em arrays",
      "Configure np.seterr() para controlar warnings de overflow",
      "Use np.memmap() para arrays maiores que a RAM",
      "Aproveite axis parameter em funções de agregação",
    ],

    commonPitfalls: [
      "EVITE: Modificar array durante iteração",
      "EVITE: Usar listas Python para cálculos numéricos - use arrays",
      "EVITE: Loops Python - use operações vetorizadas",
      "EVITE: Comparações com == para floats - use np.isclose()",
      "EVITE: Criar arrays com append em loop - pré-aloque",
      "EVITE: Usar dtype object - especifique tipo numérico",
      "EVITE: Assumir que operações retornam cópias - podem ser views",
      "EVITE: Divisão por zero sem tratamento",
      "EVITE: Broadcasting acidental que muda dimensões inesperadamente",
      "EVITE: Usar tolist() desnecessariamente - mantém como array",
    ],

    errorHandling: [
      "ValueError: Verificar shapes compatíveis antes de operações",
      "MemoryError: Usar dtype menor ou np.memmap() para arrays grandes",
      "IndexError: Validar índices com array.shape",
      "TypeError: Garantir tipos compatíveis com operação",
      "RuntimeWarning (divide by zero): Usar np.errstate() ou np.seterr()",
      "LinAlgError: Verificar se matriz é singular ou mal-condicionada",
    ],

    userPromptTemplate: `Tarefa: {task_description}

Entrada:
{input_description}

Parâmetros:
{parameters}

Use NumPy para realizar operações numéricas eficientes:
1. Importe numpy como np
2. Crie/manipule arrays apropriadamente
3. Use operações vetorizadas
4. Retorne resultados estruturados`,

    examples: [
      {
        input: "Criar array e realizar operações matemáticas básicas",
        output: `import numpy as np

def basic_array_operations():
    """Demonstra operações básicas com arrays NumPy"""
    # Criar arrays
    arr1 = np.array([1, 2, 3, 4, 5])
    arr2 = np.array([10, 20, 30, 40, 50])

    # Operações vetorizadas (muito mais rápido que loops)
    soma = arr1 + arr2
    produto = arr1 * arr2
    potencia = arr1 ** 2

    # Operações estatísticas
    media = np.mean(arr1)
    desvio = np.std(arr1)

    return {
        "soma": soma.tolist(),
        "produto": produto.tolist(),
        "potencia": potencia.tolist(),
        "estatisticas": {
            "media": float(media),
            "desvio_padrao": float(desvio),
            "minimo": int(arr1.min()),
            "maximo": int(arr1.max())
        }
    }`,
      },
      {
        input: "Álgebra linear: multiplicação de matrizes",
        output: `import numpy as np

def matrix_operations():
    """Operações de álgebra linear com NumPy"""
    # Criar matrizes
    A = np.array([[1, 2], [3, 4]], dtype=np.float64)
    B = np.array([[5, 6], [7, 8]], dtype=np.float64)

    # Multiplicação de matrizes (@ ou np.dot)
    produto_matricial = A @ B

    # Transposta
    A_t = A.T

    # Determinante
    det_A = np.linalg.det(A)

    # Inversa (se não singular)
    try:
        A_inv = np.linalg.inv(A)
        inversivel = True
    except np.linalg.LinAlgError:
        A_inv = None
        inversivel = False

    # Autovalores e autovetores
    eigenvalues, eigenvectors = np.linalg.eig(A)

    return {
        "produto_matricial": produto_matricial.tolist(),
        "determinante": float(det_A),
        "inversivel": inversivel,
        "autovalores": eigenvalues.tolist(),
        "transposta": A_t.tolist()
    }`,
      },
      {
        input: "Broadcasting para operações eficientes",
        output: `import numpy as np

def broadcasting_example():
    """Demonstra broadcasting para operações eficientes"""
    # Array 2D (3x4)
    matriz = np.array([[1, 2, 3, 4],
                       [5, 6, 7, 8],
                       [9, 10, 11, 12]])

    # Vetor 1D (4,)
    vetor = np.array([1, 0, 1, 0])

    # Broadcasting: vetor é automaticamente expandido
    resultado = matriz + vetor  # (3,4) + (4,) = (3,4)

    # Normalizar cada linha (subtrair média da linha)
    medias_linhas = matriz.mean(axis=1, keepdims=True)  # (3,1)
    matriz_normalizada = matriz - medias_linhas  # Broadcasting

    # Normalizar cada coluna
    medias_colunas = matriz.mean(axis=0)  # (4,)
    matriz_norm_col = matriz - medias_colunas

    return {
        "matriz_original": matriz.tolist(),
        "resultado_broadcast": resultado.tolist(),
        "matriz_normalizada_linhas": matriz_normalizada.tolist(),
        "matriz_normalizada_colunas": matriz_norm_col.tolist()
    }`,
      },
      {
        input: "Indexação avançada e slicing",
        output: `import numpy as np

def advanced_indexing():
    """Demonstra indexação avançada e slicing"""
    # Array 2D
    arr = np.arange(20).reshape(4, 5)

    # Slicing básico (retorna view, não cópia)
    subarray = arr[1:3, 2:4]

    # Indexação booleana (retorna cópia)
    maiores_que_10 = arr[arr > 10]

    # Fancy indexing (retorna cópia)
    linhas = [0, 2]
    colunas = [1, 3]
    elementos_especificos = arr[linhas, colunas]

    # np.where para indexação condicional
    indices = np.where(arr > 10)

    # Modificar elementos condicionalmente
    arr_modificado = arr.copy()
    arr_modificado[arr_modificado < 5] = 0

    return {
        "array_original": arr.tolist(),
        "subarray": subarray.tolist(),
        "maiores_que_10": maiores_que_10.tolist(),
        "elementos_especificos": elementos_especificos.tolist(),
        "indices_maiores_10": {
            "linhas": indices[0].tolist(),
            "colunas": indices[1].tolist()
        },
        "array_modificado": arr_modificado.tolist()
    }`,
      },
      {
        input: "Geração de números aleatórios",
        output: `import numpy as np

def random_operations():
    """Geração de números aleatórios com NumPy"""
    # Fixar seed para reprodutibilidade
    np.random.seed(42)

    # Números uniformes [0, 1)
    uniforme = np.random.random(5)

    # Inteiros aleatórios
    inteiros = np.random.randint(0, 100, size=10)

    # Distribuição normal (média=0, std=1)
    normal = np.random.randn(1000)

    # Escolher aleatoriamente de um array
    opcoes = np.array(['A', 'B', 'C', 'D'])
    escolhas = np.random.choice(opcoes, size=10, replace=True)

    # Embaralhar array
    arr = np.arange(10)
    np.random.shuffle(arr)

    # Amostragem sem reposição
    amostra = np.random.choice(np.arange(100), size=10, replace=False)

    return {
        "uniforme": uniforme.tolist(),
        "inteiros": inteiros.tolist(),
        "normal_stats": {
            "media": float(normal.mean()),
            "std": float(normal.std()),
            "min": float(normal.min()),
            "max": float(normal.max())
        },
        "escolhas": escolhas.tolist(),
        "array_embaralhado": arr.tolist(),
        "amostra": amostra.tolist()
    }`,
      },
    ],

    outputFormat: {
      type: "object",
      required: ["success"],
      properties: {
        success: {
          type: "boolean",
          description: "Indica se a operação foi bem-sucedida",
        },
        result: {
          type: "any",
          description: "Resultado da operação (array, matriz, etc)",
        },
        shape: { type: "array", description: "Dimensões do resultado" },
        dtype: { type: "string", description: "Tipo de dados do array" },
        statistics: {
          type: "object",
          description: "Estatísticas descritivas (se aplicável)",
        },
        error: {
          type: "string",
          description: "Mensagem de erro se success=false",
        },
      },
    },
  },

  // ==================== METADATA ====================
  tags: [
    "numpy",
    "numerical",
    "scientific",
    "array",
    "matrix",
    "linear-algebra",
    "math",
    "statistics",
    "vectorization",
  ],

  keywords: [
    "numpy",
    "np",
    "array",
    "matrix",
    "matriz",
    "linear algebra",
    "algebra linear",
    "mathematical",
    "matematica",
    "numerical",
    "numerico",
    "vectorization",
    "vetorizacao",
    "broadcasting",
    "statistics",
    "estatistica",
    "random",
    "aleatorio",
  ],

  performance: {
    speed: 9,
    memory: 8,
    cpuIntensive: true,
    gpuAccelerated: false,
    scalability: 9,
  },

  // ==================== REGRAS DE SCORING ====================
  scoring: {
    baseScore: 0.95,
    rules: [
      {
        condition: 'keywords include ["array", "matrix", "numerical"]',
        adjustment: 0.05,
        description: "Fundamental para operações numéricas",
      },
      {
        condition: 'keywords include ["linear algebra", "algebra"]',
        adjustment: 0.03,
        description: "Excelente para álgebra linear",
      },
      {
        condition: 'keywords include ["vectorization", "broadcast"]',
        adjustment: 0.02,
        description: "Operações vetorizadas eficientes",
      },
      {
        condition: 'keywords include ["statistics", "math", "mathematical"]',
        adjustment: 0.02,
        description: "Operações matemáticas e estatísticas",
      },
      {
        condition: 'keywords include ["random", "aleatorio"]',
        adjustment: 0.02,
        description: "Geração de números aleatórios",
      },
      {
        condition: 'keywords include ["dataframe", "pandas"]',
        adjustment: -0.2,
        description: "Para DataFrames, use Pandas",
      },
      {
        condition: 'keywords include ["plot", "graph", "visualization"]',
        adjustment: -0.4,
        description: "Para visualização, use Matplotlib/Seaborn",
      },
      {
        condition: 'keywords include ["deep learning", "neural network"]',
        adjustment: -0.3,
        description: "Para deep learning, use TensorFlow/PyTorch",
      },
    ],
  },

  // ==================== CONFIGURAÇÕES ADICIONAIS ====================
  config: {
    maxRetries: 2,
    timeout: 30000,
    cacheable: true,
    requiresAuth: false,
    rateLimit: null,
  },

  // ==================== ALTERNATIVAS ====================
  alternatives: [
    {
      name: "Pandas",
      when: "Trabalhar com dados tabulares (DataFrames)",
      reason:
        "Pandas é construído sobre NumPy mas oferece estruturas de dados de alto nível",
    },
    {
      name: "SciPy",
      when: "Computação científica avançada, otimização, integração",
      reason:
        "SciPy estende NumPy com funcionalidades científicas especializadas",
    },
    {
      name: "TensorFlow/PyTorch",
      when: "Deep learning, GPU acceleration, redes neurais",
      reason:
        "Frameworks modernos com suporte a GPU e diferenciação automática",
    },
    {
      name: "CuPy",
      when: "Operações NumPy com GPU (CUDA)",
      reason: "CuPy é NumPy para GPU",
    },
  ],

  // ==================== DOCUMENTAÇÃO ====================
  documentation: {
    official: "https://numpy.org/doc/",
    examples: "https://numpy.org/doc/stable/user/quickstart.html",
    apiReference: "https://numpy.org/doc/stable/reference/",
  },

  // ==================== TROUBLESHOOTING ====================
  commonIssues: [
    {
      issue: "ValueError: operands could not be broadcast together",
      solution: "Verificar shapes dos arrays e usar reshape ou newaxis",
      code: `# Erro: shapes incompatíveis
# arr1.shape = (3, 4), arr2.shape = (3,)
arr2_reshaped = arr2[:, np.newaxis]  # (3, 1)
result = arr1 + arr2_reshaped  # Broadcasting correto`,
    },
    {
      issue: "MemoryError: array is too large",
      solution: "Usar dtype menor ou np.memmap para arrays grandes",
      code: `# Usar dtype menor
arr = np.zeros(shape, dtype=np.float32)  # ao invés de float64

# Ou usar memmap para arrays gigantes
arr = np.memmap('temp.dat', dtype='float32', mode='w+', shape=shape)`,
    },
    {
      issue: "RuntimeWarning: divide by zero",
      solution: "Usar np.errstate ou np.seterr para controlar warnings",
      code: `# Suprimir warnings temporariamente
with np.errstate(divide='ignore', invalid='ignore'):
    result = arr1 / arr2

# Ou tratar explicitamente
result = np.divide(arr1, arr2, out=np.zeros_like(arr1), where=arr2!=0)`,
    },
    {
      issue: "Modificação acidental de array original (view vs copy)",
      solution: "Usar .copy() explicitamente quando necessário",
      code: `# View (modifica original)
view = arr[1:5]
view[0] = 999  # Modifica arr também!

# Copy (não modifica original)
copia = arr[1:5].copy()
copia[0] = 999  # arr permanece inalterado`,
    },
  ],

  // ==================== BEST PRACTICES ====================
  bestPractices: [
    "Sempre use operações vetorizadas ao invés de loops Python",
    "Especifique dtype apropriado ao criar arrays para economizar memória",
    "Use broadcasting para operações em arrays de shapes diferentes",
    "Pré-aloque arrays com np.zeros/ones/empty quando souber o tamanho",
    "Verifique shapes com .shape antes de operações de álgebra linear",
    "Use views (slicing) quando possível ao invés de criar cópias",
    "Configure np.seterr() para controlar warnings de operações numéricas",
    "Use axis parameter em funções de agregação para controlar dimensões",
  ],

  // ==================== ESTATÍSTICAS ====================
  stats: {
    timesUsed: 0,
    successRate: 0,
    averageExecutionTime: 0,
    lastUsed: null,
    errors: [],
  },
};

export default NumPyModule;
