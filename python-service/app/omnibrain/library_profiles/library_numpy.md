# NumPy

## Informações Básicas
- **Nome:** numpy
- **Categoria:** Numerical Computing, Arrays, Mathematics
- **Versão Mínima:** 1.20.0
- **Versão Recomendada:** 1.26.0+
- **Licença:** BSD
- **Documentação:** https://numpy.org/doc/

## Descrição
NumPy é a biblioteca fundamental para computação científica em Python. Fornece arrays N-dimensionais de alto desempenho e ferramentas para trabalhar com eles. Base para praticamente todas as bibliotecas de data science e machine learning.

## Casos de Uso Prioritários
1. **Operações com Arrays** (confidence: 0.98)
2. **Álgebra Linear** (confidence: 0.95)
3. **Operações Matemáticas** (confidence: 0.95)
4. **Estatísticas Básicas** (confidence: 0.90)
5. **Broadcasting** (confidence: 0.90)

## Performance
- **Velocidade:** ⭐⭐⭐⭐⭐ (10/10)
- **Uso de Memória:** ⭐⭐⭐⭐⭐ (9/10)
- **Facilidade de Uso:** ⭐⭐⭐⭐ (8/10)

## Keywords/Triggers
- numpy
- array
- matrix
- linear algebra
- mathematical operations
- vectorization

## Templates por Caso de Uso

### Template: Create Array
```python
import numpy as np
arr = np.array({data})
```

### Template: Math Operations
```python
import numpy as np
arr = np.array({data})
result = np.{operation}(arr)
```

### Template: Matrix Multiplication
```python
import numpy as np
a = np.array({matrix_a})
b = np.array({matrix_b})
result = np.dot(a, b)
```

## Score de Seleção
```python
def calculate_numpy_score(task_keywords: list) -> float:
    base_score = 0.85
    if any(kw in task_keywords for kw in ['array', 'matrix', 'linear', 'math']):
        base_score += 0.10
    return min(base_score, 0.95)
```
