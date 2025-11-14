# Pandas

## Informações Básicas

- **Nome:** pandas
- **Categoria:** Data Analysis, Data Manipulation, Data Science
- **Versão Mínima:** 1.3.0
- **Versão Recomendada:** 2.2.0+
- **Licença:** BSD 3-Clause
- **Documentação:** https://pandas.pydata.org/docs/

## Descrição

Pandas é a biblioteca Python mais poderosa e popular para análise e manipulação de dados. Oferece estruturas de dados de alto desempenho (DataFrame, Series) e ferramentas para leitura, limpeza, transformação e análise de dados estruturados. Essencial para data science, análise de negócios e preparação de dados para machine learning.

## Casos de Uso Prioritários

1. **Ler/Escrever CSV/Excel** (confidence: 0.98)
2. **Análise Exploratória de Dados** (confidence: 0.95)
3. **Limpeza de Dados** (confidence: 0.95)
4. **Agregação e GroupBy** (confidence: 0.95)
5. **Manipulação de Colunas** (confidence: 0.95)
6. **Filtragem de Dados** (confidence: 0.95)
7. **Merge/Join de DataFrames** (confidence: 0.90)
8. **Séries Temporais** (confidence: 0.90)
9. **Pivot Tables** (confidence: 0.85)
10. **Estatísticas Descritivas** (confidence: 0.95)

## Prós

- ✅ API intuitiva e expressiva
- ✅ Performance excelente (C/Cython backend)
- ✅ Integração perfeita com NumPy
- ✅ Suporte a múltiplos formatos (CSV, Excel, JSON, SQL, Parquet)
- ✅ Manipulação de dados missing (NaN)
- ✅ Time series nativo
- ✅ GroupBy poderoso
- ✅ Documentação extensa
- ✅ Comunidade gigante
- ✅ Padrão da indústria

## Contras

- ⚠️ Curva de aprendizado moderada
- ⚠️ Uso de memória alto para datasets grandes (>1GB)
- ⚠️ Não é distribuído (usar Dask para big data)
- ⚠️ API com muitas formas de fazer a mesma coisa
- ⚠️ Instalação relativamente pesada (~100MB)

## Performance

- **Velocidade:** ⭐⭐⭐⭐⭐ (9/10)
- **Uso de Memória:** ⭐⭐⭐ (6/10)
- **Qualidade de Output:** ⭐⭐⭐⭐⭐ (10/10)
- **Facilidade de Uso:** ⭐⭐⭐⭐ (8/10)

## Instalação

```bash
pip install pandas
# Com otimizações
pip install pandas[performance]
# Com tudo
pip install pandas[all]
```

## Keywords/Triggers

- pandas
- dataframe
- data analysis
- análise de dados
- csv
- excel
- data manipulation
- groupby
- aggregate
- agregação
- pivot
- merge
- join
- filter
- filtrar
- clean data
- limpar dados

## Exemplos de Código

### Básico: Ler e Explorar CSV

```python
import pandas as pd

def read_and_explore(csv_path: str):
    # Ler CSV
    df = pd.read_csv(csv_path)
    
    # Explorar dados
    info = {
        "shape": df.shape,
        "columns": df.columns.tolist(),
        "dtypes": df.dtypes.to_dict(),
        "head": df.head().to_dict(),
        "describe": df.describe().to_dict(),
        "missing_values": df.isnull().sum().to_dict()
    }
    
    return info
```

### Intermediário: Limpeza e Transformação

```python
import pandas as pd

def clean_data(df: pd.DataFrame):
    # Remover duplicatas
    df = df.drop_duplicates()
    
    # Tratar valores missing
    numeric_cols = df.select_dtypes(include=['number']).columns
    df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].mean())
    
    # Preencher categóricas com moda
    categorical_cols = df.select_dtypes(include=['object']).columns
    for col in categorical_cols:
        df[col] = df[col].fillna(df[col].mode()[0] if not df[col].mode().empty else 'Unknown')
    
    # Remover outliers (IQR method)
    for col in numeric_cols:
        Q1 = df[col].quantile(0.25)
        Q3 = df[col].quantile(0.75)
        IQR = Q3 - Q1
        lower = Q1 - 1.5 * IQR
        upper = Q3 + 1.5 * IQR
        df = df[(df[col] >= lower) & (df[col] <= upper)]
    
    return df
```

### Avançado: GroupBy e Agregação

```python
import pandas as pd

def analyze_sales(df: pd.DataFrame):
    # GroupBy com múltiplas agregações
    sales_summary = df.groupby('category').agg({
        'sales': ['sum', 'mean', 'count'],
        'profit': ['sum', 'mean'],
        'quantity': 'sum'
    }).round(2)
    
    # Flatten multi-index columns
    sales_summary.columns = ['_'.join(col).strip() for col in sales_summary.columns.values]
    sales_summary = sales_summary.reset_index()
    
    # Calcular percentuais
    total_sales = sales_summary['sales_sum'].sum()
    sales_summary['percentage'] = (sales_summary['sales_sum'] / total_sales * 100).round(2)
    
    # Top 5 categorias
    top_5 = sales_summary.nlargest(5, 'sales_sum')
    
    return {
        "summary": sales_summary.to_dict('records'),
        "top_5": top_5.to_dict('records'),
        "total_sales": total_sales
    }
```

### Expert: Séries Temporais

```python
import pandas as pd

def time_series_analysis(df: pd.DataFrame, date_col: str, value_col: str):
    # Converter para datetime
    df[date_col] = pd.to_datetime(df[date_col])
    
    # Set index
    df = df.set_index(date_col)
    
    # Resample para diferentes períodos
    daily = df[value_col].resample('D').sum()
    weekly = df[value_col].resample('W').sum()
    monthly = df[value_col].resample('M').sum()
    
    # Rolling statistics
    rolling_7 = df[value_col].rolling(window=7).mean()
    rolling_30 = df[value_col].rolling(window=30).mean()
    
    # Growth rate
    growth = df[value_col].pct_change() * 100
    
    # Tendência (linear)
    from scipy import stats
    x = range(len(df))
    slope, intercept, r_value, p_value, std_err = stats.linregress(x, df[value_col])
    
    return {
        "daily_total": daily.sum(),
        "weekly_avg": weekly.mean(),
        "monthly_total": monthly.to_dict(),
        "trend_slope": slope,
        "trend_r_squared": r_value**2,
        "avg_growth_rate": growth.mean()
    }
```

### Expert: Merge e Join Complexo

```python
import pandas as pd

def merge_datasets(orders_df, customers_df, products_df):
    # Left join orders com customers
    df = orders_df.merge(
        customers_df,
        on='customer_id',
        how='left',
        suffixes=('_order', '_customer')
    )
    
    # Join com produtos
    df = df.merge(
        products_df,
        left_on='product_id',
        right_on='id',
        how='inner'
    )
    
    # Calcular métricas
    df['total_value'] = df['quantity'] * df['price']
    df['profit'] = df['total_value'] - (df['quantity'] * df['cost'])
    
    # Agrupar por cliente
    customer_summary = df.groupby('customer_id').agg({
        'order_id': 'count',
        'total_value': 'sum',
        'profit': 'sum'
    }).rename(columns={
        'order_id': 'total_orders',
        'total_value': 'total_spent',
        'profit': 'total_profit'
    })
    
    # CLV (Customer Lifetime Value)
    customer_summary['avg_order_value'] = (
        customer_summary['total_spent'] / customer_summary['total_orders']
    )
    
    return customer_summary.to_dict('index')
```

## Templates por Caso de Uso

### Template: Read CSV

```python
import pandas as pd
df = pd.read_csv("{csv_path}")
```

### Template: Filter Data

```python
import pandas as pd
df = pd.read_csv("{csv_path}")
filtered = df[df["{column}"] > {value}]
```

### Template: GroupBy Sum

```python
import pandas as pd
df = pd.read_csv("{csv_path}")
grouped = df.groupby("{group_column}")["{value_column}"].sum()
```

### Template: Save to Excel

```python
import pandas as pd
df = pd.read_csv("{csv_path}")
df.to_excel("{output_path}", index=False)
```

### Template: Basic Statistics

```python
import pandas as pd
df = pd.read_csv("{csv_path}")
stats = df.describe()
```

## Alternativas e Quando Usar

| Biblioteca | Quando Usar em Vez de Pandas |
|------------|------------------------------|
| Polars | Performance crítica, syntax moderna |
| Dask | Datasets maiores que memória RAM |
| Vaex | Datasets muito grandes (>100GB) |
| PySpark | Processamento distribuído |
| NumPy | Apenas arrays numéricos, velocidade máxima |
| DuckDB | Queries SQL em DataFrames |

## Requisitos do Sistema

- Python 3.8+
- ~100MB de espaço em disco
- Mínimo 2GB RAM (8GB+ recomendado para datasets grandes)

## Dependências

```
numpy>=1.20.0
python-dateutil>=2.8.1
pytz>=2020.1
```

Opcionais:
```
openpyxl  # Para Excel
xlrd  # Para Excel antigo (.xls)
sqlalchemy  # Para SQL
pyarrow  # Para Parquet
tables  # Para HDF5
```

## Notas de Compatibilidade

- ✅ Windows, Linux, macOS
- ✅ Python 3.8-3.12
- ✅ x86_64, ARM64
- ✅ Suporta CSV, Excel, JSON, SQL, Parquet, HDF5, Feather
- ⚠️ Performance degradada com datasets >RAM

## Troubleshooting Comum

### Problema: MemoryError com dataset grande

**Solução:** Ler em chunks ou otimizar dtypes
```python
# Chunks
chunks = []
for chunk in pd.read_csv('large.csv', chunksize=10000):
    processed = process_chunk(chunk)
    chunks.append(processed)
df = pd.concat(chunks, ignore_index=True)

# Otimizar dtypes
df = pd.read_csv('file.csv', dtype={
    'id': 'int32',
    'category': 'category'
})
```

### Problema: SettingWithCopyWarning

**Solução:** Usar .loc ou .copy()
```python
# ✅ Correto
df.loc[df['age'] > 18, 'category'] = 'adult'

# ✅ Ou fazer cópia explícita
new_df = df[df['age'] > 18].copy()
```

### Problema: KeyError ao acessar coluna

**Solução:** Verificar nome exato e espaços
```python
# Ver nomes exatos
print(df.columns.tolist())

# Acessar com .get() para segurança
value = df.get('column_name', pd.Series())
```

### Problema: ValueError ao merge

**Solução:** Verificar tipos e valores únicos
```python
# Verificar tipos
print(df1['key'].dtype, df2['key'].dtype)

# Converter se necessário
df1['key'] = df1['key'].astype(str)
df2['key'] = df2['key'].astype(str)
```

## Score de Seleção

```python
def calculate_pandas_score(task_keywords: list, data_size_mb: float = 0) -> float:
    base_score = 0.95
    
    # Boost para data analysis
    if any(kw in task_keywords for kw in ['analysis', 'analyze', 'csv', 'excel', 'data']):
        base_score += 0.03
    
    # Penalty para dados muito grandes
    if data_size_mb > 5000:  # >5GB
        base_score -= 0.40  # Usar Dask
    elif data_size_mb > 1000:  # >1GB
        base_score -= 0.15
    
    # Boost para operações de tabela
    if any(kw in task_keywords for kw in ['groupby', 'aggregate', 'merge', 'join']):
        base_score += 0.02
    
    return min(max(base_score, 0.0), 0.98)
```

## Best Practices

1. **Use vectorização, evite loops:**
   ```python
   # ❌ Lento
   for i, row in df.iterrows():
       df.at[i, 'new'] = row['a'] + row['b']
   
   # ✅ Rápido
   df['new'] = df['a'] + df['b']
   ```

2. **Especifique dtypes ao ler:**
   ```python
   df = pd.read_csv('file.csv', dtype={'id': 'int32'})
   ```

3. **Use category para strings repetidas:**
   ```python
   df['status'] = df['status'].astype('category')
   ```

4. **Chain operations:**
   ```python
   result = (df
       .query('age > 18')
       .groupby('city')['salary']
       .mean()
       .sort_values(ascending=False)
   )
   ```

5. **Use inplace=False (padrão):**
   ```python
   # ✅ Melhor
   df_new = df.drop_duplicates()
   ```

## Última Atualização

2025-01-15