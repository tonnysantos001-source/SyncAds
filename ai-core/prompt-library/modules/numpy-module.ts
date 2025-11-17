/**
 * NUMPY MODULE - Biblioteca de Computação Científica
 * Módulo de Prompt System para a biblioteca NumPy
 */

import { PromptModule, ModuleCategory, ModuleComplexity, ExecutionEnvironment } from '../registry';

export const NumPyModule: PromptModule = {
  // ==================== IDENTIFICAÇÃO ====================
  id: 'numpy-002',
  name: 'NumPy',
  packageName: 'numpy',
  version: '1.26.0',
  category: ModuleCategory.SCIENTIFIC_COMPUTING,
  subcategories: [
    'numerical-computing',
    'array-operations',
    'linear-algebra',
    'mathematical-operations',
    'random-numbers',
    'fourier-transform',
    'statistics'
  ],

  // ==================== DESCRIÇÃO ====================
  description: 'Biblioteca fundamental para computação científica em Python, fornecendo suporte para arrays multidimensionais e operações matemáticas de alto desempenho.',
  purpose: 'Realizar operações numéricas eficientes em arrays, álgebra linear, transformadas matemáticas e computação científica',
  useCases: [
    'Operações matemáticas vetorizadas em arrays',
    'Álgebra linear (matrizes, vetores, sistemas lineares)',
    'Geração de números aleatórios',
    'Transformadas de Fourier',
    'Operações estatísticas básicas',
    'Broadcasting e manipulação de arrays multidimensionais',
    'Indexação avançada e slicing',
    'Operações elemento por elemento (element-wise)',
    'Reshaping e transposição de arrays',
    'Integração com outras bibliotecas científicas'
  ],

  // ==================== CONFIGURAÇÃO ====================
  complexity: ModuleComplexity.INTERMEDIATE,
  environment: ExecutionEnvironment.PYTHON,
  dependencies: [],
  installCommand: 'pip install numpy',

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
      '1. SEMPRE importe numpy como: import numpy as np',
      '2. Especifique dtype ao criar arrays: np.array([1, 2, 3], dtype=np.float32)',
      '3. Use np.zeros(), np.ones(), np.empty() para pré-alocar arrays',
      '4. Prefira operações vetorizadas: arr + 5 ao invés de [x + 5 for x in arr]',
      '5. Use broadcasting para operações em arrays de diferentes shapes',
      '6. Verifique shape dos arrays com arr.shape antes de operações',
      '7. Use np.newaxis ou reshape para adicionar dimensões',
      '8. Prefira arr.copy() explícito quando precisar de cópia',
      '9. Use np.where() para operações condicionais vetorizadas',
      '10. Sempre valide dimensões antes de operações de álgebra linear'
    ],

    bestPractices: [
      'Use dtype apropriado: int8/16/32 para inteiros, float32/64 para decimais',
      'Pré-aloque arrays quando souber o tamanho final',
      'Use np.concatenate() ou np.vstack()/np.hstack() ao invés de append em loop',
      'Aproveite broadcasting para evitar loops explícitos',
      'Use views (slicing) ao invés de cópias quando possível',
      'Prefira np.einsum() para operações tensoriais complexas',
      'Use np.clip() para limitar valores em arrays',
      'Configure np.seterr() para controlar warnings de overflow',
      'Use np.memmap() para arrays maiores que a RAM',
      'Aproveite axis parameter em funções de agregação'
    ],

    commonPitfalls: [
      'EVITE: Modificar array durante iteração',
      'EVITE: Usar listas Python para cálculos numéricos - use arrays',
      'EVITE: Loops Python - use operações vetorizadas',
      'EVITE: Comparações com == para floats - use np.isclose()',
      'EVITE: Criar arrays com append em loop - pré-aloque',
      'EVITE: Usar dtype object - especifique tipo numérico',
      'EVITE: Assumir que operações retornam cópias - podem ser views',
      'EVITE: Divisão por zero sem tratamento',
      'EVITE: Broadcasting acidental que muda dimensões inesperadamente',
      'EVITE: Usar tolist() desnecessariamente - mantém como array'
    ],

    errorHandling: [
      'ValueError: Verificar shapes compatíveis antes de operações',
      'MemoryError: Usar dtype menor ou np.memmap() para arrays grandes',
      'IndexError: Validar índices com array.shape',
      'TypeError: Garantir tipos compatíveis com operação',
      'RuntimeWarning (divide by zero): Usar np.errstate() ou np.seterr()',
      'LinAlgError: Verificar se matriz é singular ou mal-condicionada'
    ]
