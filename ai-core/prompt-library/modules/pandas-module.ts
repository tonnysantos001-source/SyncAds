/**
 * PANDAS MODULE - Biblioteca de Processamento de Dados
 * Módulo de Prompt System para a biblioteca Pandas
 */

import { PromptModule, ModuleCategory, ModuleComplexity, ExecutionEnvironment } from '../registry';

export const PandasModule: PromptModule = {
  // ==================== IDENTIFICAÇÃO ====================
  id: 'pandas-001',
  name: 'Pandas',
  packageName: 'pandas',
  version: '2.2.0',
  category: ModuleCategory.DATA_PROCESSING,
  subcategories: [
    'data-analysis',
    'data-manipulation',
    'csv-processing',
    'excel-processing',
    'time-series',
    'statistical-analysis'
  ],

  // ==================== DESCRIÇÃO ====================
  description: 'Biblioteca poderosa de análise e manipulação de dados em Python, fornecendo estruturas de dados flexíveis e eficientes.',
  purpose: 'Processar, analisar, transformar e manipular dados estruturados (tabelas, séries temporais, etc.)',
  useCases: [
    'Leitura e escrita de arquivos CSV, Excel, JSON, SQL',
    'Limpeza e preparação de dados',
    'Análise exploratória de dados',
    'Transformação e agregação de dados',
    'Manipulação de séries temporais',
    'Join e merge de datasets',
    'Pivoteamento e reshaping de dados',
    'Cálculos estatísticos e agregações',
    'Filtragem e seleção de dados',
    'Tratamento de valores missing'
  ],

  // ==================== CONFIGURAÇÃO ====================
  complexity: ModuleComplexity.INTERMEDIATE,
  environment: ExecutionEnvironment.PYTHON,
  dependencies: ['numpy', 'python-dateutil', 'pytz'],
  installCommand: 'pip install pandas numpy',

  // ==================== PROMPT SYSTEM ====================
  promptSystem: {
    systemPrompt: `Você é um especialista em Pandas, a biblioteca Python para análise de dados.
Ao trabalhar com Pandas, você SEMPRE deve:
- Usar métodos eficientes e vetorizados (evitar loops)
- Verificar tipos de dados com df.dtypes
- Tratar valores NaN apropriadamente
- Usar inplace=False por padrão para imutabilidade
- Aplicar copy() quando necessário para evitar SettingWithCopyWarning
- Usar loc/iloc para indexação explícita
- Considerar memory_usage() para datasets grandes
- Documentar transformações importantes`,

    instructions: [
      '1. SEMPRE importe pandas como: import pandas as pd',
      '2. Verifique se o arquivo existe antes de ler',
      '3. Use try-except para operações de I/O',
      '4. Especifique dtypes ao ler dados grandes para economizar memória',
      '5. Use chunksize para arquivos muito grandes',
      '6. Sempre verifique df.head(), df.info() e df.describe() após carregar dados',
      '7. Use pd.to_datetime() para converter strings em datas',
      '8. Prefira query() ou loc[] para filtragens complexas',
      '9. Use groupby().agg() para agregações múltiplas',
      '10. Sempre valide o output com assert ou print de verificação'
    ],

    bestPractices: [
      'Use method chaining para operações sequenciais: df.pipe().pipe().pipe()',
      'Prefira vectorização sobre iteração: use apply(), map(), ou operações nativas',
      'Configure display.max_columns e display.max_rows para debugging',
      'Use categorical dtype para colunas com poucos valores únicos',
      'Aplique astype() para otimizar tipos de dados',
      'Use merge() com indicador=True para debug de joins',
      'Prefira concat() com keys para rastreabilidade',
      'Use pd.options para configurar comportamento global',
      'Aplique reset_index() após operações que modificam índice',
      'Use copy() explicitamente quando criar views modificáveis'
    ],

    commonPitfalls: [
      'EVITE: df[df.col == valor] sem usar copy() - causa SettingWithCopyWarning',
      'EVITE: Loops com iterrows() - extremamente lento',
      'EVITE: Múltiplos append() em loop - use list + pd.concat()',
      'EVITE: inplace=True sem necessidade - dificulta debug',
      'EVITE: Comparações com NaN usando == - use isna() ou notna()',
      'EVITE: Modificar DataFrame durante iteração',
      'EVITE: Assumir ordem de colunas - sempre use nomes explícitos',
      'EVITE: Ignorar warnings de dtype - podem causar bugs silenciosos',
      'EVITE: Usar string indexing sem verificar existência da coluna',
      'EVITE: apply() com funções pesadas - considere numba ou cython'
    ],

    errorHandling: [
      'FileNotFoundError: Verificar se arquivo existe com os.path.exists()',
      'KeyError: Usar .get() ou verificar coluna com "col" in df.columns',
      'ValueError: Validar formato dos dados antes de operações',
      'MemoryError: Usar chunksize ou dask para dados muito grandes',
      'SettingWithCopyWarning: Sempre usar .copy() ou .loc[] apropriadamente',
      'ParserError: Especificar encoding, sep, e error_bad_lines corretamente',
      'DtypeWarning: Especificar dtype explicitamente ao ler arquivos',
      'IndexError: Verificar tamanho do DataFrame antes de acessar índices',
      'TypeError: Verificar tipos com isinstance() antes de operações',
      'PerformanceWarning: Otimizar queries ou usar indices apropriados'
    ],

    optimizationTips: [
      'Use category dtype para colunas com baixa cardinalidade',
      'Especifique usecols ao ler apenas colunas necessárias',
      'Use nrows para testar código com subset dos dados',
      'Configure chunksize para processar dados em lotes',
      'Use query() com engine="numexpr" para queries complexas',
      'Aplique eval() para expressões aritméticas complexas',
      'Use pd.read_csv() com dtype dict para economia de memória',
      'Configure low_memory=False para evitar mixed types',
      'Use sparse arrays para dados esparsos',
      'Considere parquet ou feather para I/O mais rápido que CSV'
    ]
  },

  // ==================== REGRAS DE USO ====================
  whenToUse: [
    {
      condition: 'Processar arquivos CSV, Excel, ou JSON',
      reasoning: 'Pandas tem readers otimizados e robustos para estes formatos',
      confidence: 0.95,
      priority: 1
    },
    {
      condition: 'Análise exploratória de dados estruturados',
      reasoning: 'Métodos integrados como describe(), info(), value_counts() são perfeitos',
      confidence: 0.98,
      priority: 1
    },
    {
      condition: 'Operações de agregação e groupby',
      reasoning: 'GroupBy do Pandas é extremamente poderoso e flexível',
      confidence: 0.97,
      priority: 1
    },
    {
      condition: 'Limpeza e transformação de dados',
      reasoning: 'Ferramentas completas para fillna(), dropna(), replace(), etc',
      confidence: 0.96,
      priority: 1
    },
    {
      condition: 'Trabalhar com séries temporais',
      reasoning: 'Suporte nativo a datetime, resampling, rolling windows',
      confidence: 0.94,
      priority: 2
    },
    {
      condition: 'Merge, join, concatenação de datasets',
      reasoning: 'Operações SQL-like com sintaxe simples',
      confidence: 0.95,
      priority: 2
    },
    {
      condition: 'Pivoteamento e reshaping de dados',
      reasoning: 'pivot_table(), melt(), stack(), unstack() muito poderosos',
      confidence: 0.93,
      priority: 2
    },
    {
      condition: 'Dados tabulares com até ~10M linhas',
      reasoning: 'Performance adequada para a maioria dos casos',
      confidence: 0.90,
      priority: 3
    }
  ],

  whenNotToUse: [
    {
      condition: 'Dados com bilhões de linhas',
      reasoning: 'Pandas carrega tudo em memória - use Dask, PySpark, ou Polars',
      confidence: 0.95,
      priority: 1
    },
    {
      condition: 'Operações que requerem streaming de dados',
      reasoning: 'Pandas não é otimizado para streaming - considere outras soluções',
      confidence: 0.90,
      priority: 2
    },
    {
      condition: 'Processamento distribuído necessário',
      reasoning: 'Pandas é single-threaded - use Dask ou PySpark',
      confidence: 0.93,
      priority: 1
    },
    {
      condition: 'Apenas operações matemáticas em arrays',
      reasoning: 'NumPy puro é mais eficiente',
      confidence: 0.85,
      priority: 3
    },
    {
      condition: 'Necessita de performance máxima',
      reasoning: 'Polars é mais rápido, use quando performance é crítica',
      confidence: 0.88,
      priority: 2
    },
    {
      condition: 'Dados não estruturados ou aninhados',
      reasoning: 'Use outras bibliotecas especializadas',
      confidence: 0.87,
      priority: 3
    }
  ],

  // ==================== FUNÇÕES PRINCIPAIS ====================
  mainFunctions: [
    {
      name: 'pd.read_csv',
      description: 'Lê arquivo CSV e retorna DataFrame',
      signature: 'pd.read_csv(filepath, sep=",", header="infer", dtype=None, parse_dates=False, **kwargs)',
      parameters: [
        { name: 'filepath', type: 'str', required: true, description: 'Caminho do arquivo CSV' },
        { name: 'sep', type: 'str', required: false, default: ',', description: 'Delimitador do CSV' },
        { name: 'header', type: 'int|list', required: false, default: 'infer', description: 'Linha com nomes das colunas' },
        { name: 'dtype', type: 'dict', required: false, description: 'Tipos de dados por coluna' },
        { name: 'parse_dates', type: 'bool|list', required: false, default: false, description: 'Colunas para converter em datetime' },
        { name: 'encoding', type: 'str', required: false, default: 'utf-8', description: 'Encoding do arquivo' }
      ],
      returnType: 'pd.DataFrame',
      example: 'df = pd.read_csv("data.csv", parse_dates=["date"], dtype={"id": int})',
      promptTemplate: 'Para ler o arquivo {filepath}, use pd.read_csv() com os parâmetros apropriados'
    },
    {
      name: 'df.groupby',
      description: 'Agrupa DataFrame por uma ou mais colunas',
      signature: 'df.groupby(by, axis=0, level=None, as_index=True, sort=True)',
      parameters: [
        { name: 'by', type: 'str|list', required: true, description: 'Colunas para agrupar' },
        { name: 'as_index', type: 'bool', required: false, default: true, description: 'Usar chaves de agrupamento como índice' }
      ],
      returnType: 'pd.DataFrameGroupBy',
      example: 'df.groupby("category").agg({"sales": "sum", "quantity": "mean"})',
      promptTemplate: 'Para agrupar por {by} e calcular agregações, use groupby().agg()'
    },
    {
      name: 'df.merge',
      description: 'Combina dois DataFrames usando join SQL-style',
      signature: 'df.merge(right, how="inner", on=None, left_on=None, right_on=None)',
      parameters: [
        { name: 'right', type: 'pd.DataFrame', required: true, description: 'DataFrame da direita' },
        { name: 'how', type: 'str', required: false, default: 'inner', description: 'Tipo de join (inner, left, right, outer)' },
        { name: 'on', type: 'str|list', required: false, description: 'Colunas para join' }
      ],
      returnType: 'pd.DataFrame',
      example: 'merged = df1.merge(df2, on="id", how="left", indicator=True)',
      promptTemplate: 'Para combinar {left} e {right} por {on}, use merge() com how={how}'
    },
    {
      name: 'df.fillna',
      description: 'Preenche valores NaN/missing',
      signature: 'df.fillna(value=None, method=None, axis=None, inplace=False)',
      parameters: [
        { name: 'value', type: 'scalar|dict|Series', required: false, description: 'Valor para preencher NaN' },
        { name: 'method', type: 'str', required: false, description: 'Método: ffill, bfill' },
        { name: 'inplace', type: 'bool', required: false, default: false, description: 'Modificar in-place' }
      ],
      returnType: 'pd.DataFrame',
      example: 'df.fillna({"age": df["age"].mean(), "name": "Unknown"})',
      promptTemplate: 'Para preencher valores missing em {columns}, use fillna() com estratégia apropriada'
    },
    {
      name: 'df.pivot_table',
      description: 'Cria tabela pivoteada',
      signature: 'df.pivot_table(values, index, columns, aggfunc="mean", fill_value=None)',
      parameters: [
        { name: 'values', type: 'str|list', required: true, description: 'Colunas para agregar' },
        { name: 'index', type: 'str|list', required: true, description: 'Colunas para linhas' },
        { name: 'columns', type: 'str|list', required: true, description: 'Colunas para pivotear' },
        { name: 'aggfunc', type: 'function|str', required: false, default: 'mean', description: 'Função de agregação' }
      ],
      returnType: 'pd.DataFrame',
      example: 'pivot = df.pivot_table(values="sales", index="date", columns="product", aggfunc="sum")',
      promptTemplate: 'Para pivotar {values} por {index} e {columns}, use pivot_table()'
    }
  ],

  // ==================== EXEMPLOS ====================
  examples: [
    {
      title: 'Leitura e Análise Básica de CSV',
      description: 'Carregar arquivo CSV e fazer análise exploratória inicial',
      input: { filepath: 'vendas.csv', action: 'analisar dados' },
      code: `import pandas as pd
import os

# Verificar se arquivo existe
if not os.path.exists('vendas.csv'):
    raise FileNotFoundError("Arquivo vendas.csv não encontrado")

# Ler CSV
df = pd.read_csv(
    'vendas.csv',
    parse_dates=['data_venda'],
    dtype={'produto_id': int, 'quantidade': int}
)

# Análise exploratória
print("Informações do DataFrame:")
print(df.info())
print("\\nPrimeiras linhas:")
print(df.head())
print("\\nEstatísticas descritivas:")
print(df.describe())
print("\\nValores únicos por coluna:")
print(df.nunique())
print("\\nValores missing:")
print(df.isna().sum())`,
      output: { rows: 1000, columns: 5, missing_values: 0 },
      explanation: 'Este código demonstra as melhores práticas para ler um CSV e fazer análise inicial completa',
      useCase: 'Análise exploratória de dados de vendas'
    },
    {
      title: 'Agregação e GroupBy Avançado',
      description: 'Agrupar dados e calcular múltiplas agregações',
      input: { data: 'vendas_df', group_by: 'categoria', metrics: ['soma', 'média', 'contagem'] },
      code: `# Múltiplas agregações em uma operação
resultado = df.groupby('categoria').agg({
    'valor_venda': ['sum', 'mean', 'count'],
    'quantidade': ['sum', 'mean'],
    'desconto': 'mean'
}).round(2)

# Renomear colunas
resultado.columns = ['_'.join(col).strip() for col in resultado.columns.values]
resultado = resultado.reset_index()

# Adicionar percentuais
resultado['percentual_vendas'] = (
    resultado['valor_venda_sum'] / resultado['valor_venda_sum'].sum() * 100
).round(2)

print(resultado)`,
      output: { grouped_rows: 10, aggregations: 6 },
      explanation: 'Demonstra como fazer agregações múltiplas e calcular métricas derivadas',
      useCase: 'Relatório de vendas por categoria'
    },
    {
      title: 'Limpeza de Dados',
      description: 'Limpar e preparar dados para análise',
      input: { data: 'raw_data', issues: ['missing', 'duplicates', 'outliers'] },
      code: `# Remover duplicatas
df_clean = df.drop_duplicates(subset=['id'], keep='first')

# Tratar valores missing
df_clean['idade'].fillna(df_clean['idade'].median(), inplace=True)
df_clean['categoria'].fillna('Desconhecido', inplace=True)

# Remover outliers usando IQR
Q1 = df_clean['valor'].quantile(0.25)
Q3 = df_clean['valor'].quantile(0.75)
IQR = Q3 - Q1
df_clean = df_clean[
    (df_clean['valor'] >= Q1 - 1.5 * IQR) &
    (df_clean['valor'] <= Q3 + 1.5 * IQR)
]

# Converter tipos
df_clean['data'] = pd.to_datetime(df_clean['data'], errors='coerce')
df_clean['categoria'] = df_clean['categoria'].astype('category')

# Validação final
assert df_clean.duplicated().sum() == 0, "Ainda existem duplicatas"
print(f"Dados limpos: {len(df_clean)} linhas")`,
      output: { clean_rows: 950, removed_duplicates: 30, removed_outliers: 20 },
      explanation: 'Pipeline completo de limpeza de dados com validações',
      useCase: 'Preparação de dados para machine learning'
    },
    {
      title: 'Join de Múltiplos DataFrames',
      description: 'Combinar dados de diferentes fontes',
      input: { tables: ['clientes', 'pedidos', 'produtos'] },
      code: `# Merge com indicador para debug
df_merged = (
    pedidos
    .merge(clientes, on='cliente_id', how='left', suffixes=('_pedido', '_cliente'))
    .merge(produtos, on='produto_id', how='left')
)

# Verificar resultados do merge
print("Pedidos sem cliente:", df_merged['cliente_id'].isna().sum())
print("Pedidos sem produto:", df_merged['produto_id'].isna().sum())

# Criar features derivadas
df_merged['ticket_medio'] = df_merged['valor_total'] / df_merged['quantidade']
df_merged['dias_desde_cadastro'] = (
    pd.to_datetime('today') - df_merged['data_cadastro']
).dt.days

print(df_merged.head())`,
      output: { merged_rows: 5000, columns: 25 },
      explanation: 'Demonstra joins complexos com validações e feature engineering',
      useCase: 'Análise de comportamento de compra de clientes'
    },
    {
      title: 'Análise de Série Temporal',
      description: 'Processar e analisar dados temporais',
      input: { data: 'vendas_diarias', analysis: 'tendência e sazonalidade' },
      code: `# Configurar índice temporal
df['data'] = pd.to_datetime(df['data'])
df = df.set_index('data').sort_index()

# Resample para diferentes períodos
vendas_mensais = df['valor'].resample('M').sum()
vendas_semanais = df['valor'].resample('W').sum()

# Rolling windows
df['media_movel_7d'] = df['valor'].rolling(window=7).mean()
df['media_movel_30d'] = df['valor'].rolling(window=30).mean()

# Crescimento percentual
df['crescimento_dia'] = df['valor'].pct_change() * 100
df['crescimento_mes'] = df['valor'].pct_change(periods=30) * 100

# Estatísticas por dia da semana
por_dia_semana = df.groupby(df.index.dayofweek)['valor'].agg(['mean', 'sum', 'count'])
por_dia_semana.index = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom']

print(por_dia_semana)`,
      output: { time_series_metrics: 'calculated', seasonality: 'detected' },
      explanation: 'Análise completa de série temporal com resampling e rolling windows',
      useCase: 'Previsão de vendas e análise de tendências'
    }
  ],

  // ==================== I/O FORMAT ====================
  inputFormat: {
    type: 'multiple',
    description: 'Pandas aceita diversos formatos de entrada',
    examples: [
      { format: 'CSV', code: 'pd.read_csv("file.csv")' },
      { format: 'Excel', code: 'pd.read_excel("file.xlsx")' },
      { format: 'JSON', code: 'pd.read_json("file.json")' },
      { format: 'SQL', code: 'pd.read_sql("SELECT * FROM table", conn)' },
      { format: 'Parquet', code: 'pd.read_parquet("file.parquet")' },
      { format: 'Dictionary', code: 'pd.DataFrame({"col": [1, 2, 3]})' }
    ],
    validation: 'Sempre verificar se arquivo existe antes de ler'
  },

  outputFormat: {
    type: 'pd.DataFrame or pd.Series',
    description: 'Retorna DataFrame ou Series dependendo da operação',
    examples: [
      { operation: 'read', output: 'pd.DataFrame' },
      { operation: 'column selection', output: 'pd.Series' },
      { operation: 'aggregation', output: 'pd.DataFrame or scalar' }
    ],
    validation: 'Sempre verificar tipo com type() e shape com .shape'
  },

  // ==================== FALLBACK ====================
  fallbackModules: ['polars-001', 'dask-001', 'numpy-001'],
  alternativeModules: ['modin-001', 'vaex-001'],

  // ==================== PERFORMANCE ====================
  avgExecutionTime: 500, // ms para operações típicas
  memoryUsage: '2-3x do tamanho dos dados em disco',
  cpuIntensive: false,
  gpuSupport: false,

  // ==================== METADADOS ====================
  reliability: 0.98,
  successRate: 0.97,
  popularity: 100,
  lastUpdated: Date.now(),
  status: 'active',

  // ==================== EXTRAS ====================
  documentation: 'https://pandas.pydata.org/docs/',
  repository: 'https://github.com/pandas-dev/pandas',
  license: 'BSD-3-Clause',
  tags: [
    'data-analysis',
    'data-processing',
    'csv',
    'excel',
    'dataframe',
    'time-series',
    'statistics',
    'etl',
    'data-cleaning',
    'data-transformation'
  ]
};

export default PandasModule;
