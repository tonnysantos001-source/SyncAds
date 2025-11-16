# Scikit-learn

## Informações Básicas

- **Nome:** scikit-learn
- **Categoria:** Machine Learning, Data Science, Classification, Regression
- **Versão Mínima:** 1.0.0
- **Versão Recomendada:** 1.4.0+
- **Licença:** BSD 3-Clause
- **Documentação:** https://scikit-learn.org/

## Descrição

Scikit-learn é a biblioteca padrão de Machine Learning em Python. Fornece ferramentas simples e eficientes para mineração de dados e análise preditiva, incluindo classificação, regressão, clustering, redução de dimensionalidade, seleção de modelos e pré-processamento.

## Casos de Uso Prioritários

1. **Classificação (Binary/Multi-class)** (confidence: 0.95)
2. **Regressão Linear/Não-linear** (confidence: 0.95)
3. **Clustering (K-Means, DBSCAN)** (confidence: 0.92)
4. **Redução de Dimensionalidade (PCA)** (confidence: 0.90)
5. **Feature Engineering** (confidence: 0.93)
6. **Model Selection & Cross-validation** (confidence: 0.95)
7. **Ensemble Methods (Random Forest, Gradient Boosting)** (confidence: 0.94)

## Prós

- ✅ API consistente e bem projetada
- ✅ Documentação excelente com exemplos
- ✅ Integração perfeita com NumPy/Pandas
- ✅ Algoritmos otimizados e testados
- ✅ Pré-processamento completo
- ✅ Validação cruzada built-in
- ✅ Pipeline para workflows complexos
- ✅ Community gigante
- ✅ Estável e mantido ativamente

## Contras

- ⚠️ Não suporta GPU (use XGBoost/LightGBM)
- ⚠️ Não é para Deep Learning (use PyTorch/TensorFlow)
- ⚠️ Não escala bem para datasets gigantes (>1GB RAM)
- ⚠️ Sem suporte nativo a séries temporais
- ⚠️ Requer dados em formato NumPy/Pandas

## Performance

- **Velocidade:** ⭐⭐⭐⭐ (8.5/10)
- **Uso de Memória:** ⭐⭐⭐⭐ (8/10)
- **Qualidade de Output:** ⭐⭐⭐⭐⭐ (10/10)
- **Facilidade de Uso:** ⭐⭐⭐⭐⭐ (9.5/10)

## Instalação

```bash
pip install scikit-learn
# Com dependências científicas
pip install scikit-learn scipy pandas numpy
```

## Keywords/Triggers

- scikit-learn
- sklearn
- machine learning
- classification
- regression
- clustering
- random forest
- svm
- decision tree
- k-means
- pca
- model training
- predict
- fit

## Exemplos de Código

### Básico: Classificação com Random Forest

```python
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import pandas as pd

def train_classifier(data_path: str, target_column: str) -> dict:
    """Treina classificador Random Forest"""
    # Carregar dados
    df = pd.read_csv(data_path)
    
    # Separar features e target
    X = df.drop(columns=[target_column])
    y = df[target_column]
    
    # Split treino/teste
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    # Treinar modelo
    clf = RandomForestClassifier(n_estimators=100, random_state=42)
    clf.fit(X_train, y_train)
    
    # Predições
    y_pred = clf.predict(X_test)
    
    # Métricas
    accuracy = accuracy_score(y_test, y_pred)
    report = classification_report(y_test, y_pred)
    
    return {
        'accuracy': accuracy,
        'report': report,
        'model': clf,
        'feature_importance': dict(zip(X.columns, clf.feature_importances_))
    }
```

### Intermediário: Regressão com Pipeline

```python
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import Ridge
from sklearn.model_selection import cross_val_score
import numpy as np

def create_regression_pipeline(X_train, y_train, X_test):
    """Cria pipeline de regressão com pré-processamento"""
    
    # Criar pipeline
    pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('regressor', Ridge(alpha=1.0))
    ])
    
    # Treinar
    pipeline.fit(X_train, y_train)
    
    # Cross-validation
    cv_scores = cross_val_score(
        pipeline, X_train, y_train, 
        cv=5, 
        scoring='neg_mean_squared_error'
    )
    
    # Predições
    predictions = pipeline.predict(X_test)
    
    return {
        'model': pipeline,
        'predictions': predictions.tolist(),
        'cv_rmse': np.sqrt(-cv_scores.mean()),
        'cv_std': cv_scores.std()
    }
```

### Avançado: Clustering com PCA

```python
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
import numpy as np

def cluster_analysis(data, n_clusters=3, n_components=2):
    """Clustering com redução de dimensionalidade"""
    
    # Normalizar dados
    scaler = StandardScaler()
    data_scaled = scaler.fit_transform(data)
    
    # PCA para redução de dimensionalidade
    pca = PCA(n_components=n_components)
    data_pca = pca.fit_transform(data_scaled)
    
    # K-Means clustering
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    clusters = kmeans.fit_predict(data_pca)
    
    # Análise
    return {
        'clusters': clusters.tolist(),
        'cluster_centers': kmeans.cluster_centers_.tolist(),
        'inertia': float(kmeans.inertia_),
        'pca_components': data_pca.tolist(),
        'explained_variance': pca.explained_variance_ratio_.tolist(),
        'n_clusters': n_clusters
    }
```

### Expert: Grid Search com Cross-Validation

```python
from sklearn.model_selection import GridSearchCV
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import make_scorer, f1_score

def optimize_model(X_train, y_train):
    """Otimização de hiperparâmetros com Grid Search"""
    
    # Definir modelo base
    model = GradientBoostingClassifier(random_state=42)
    
    # Grid de hiperparâmetros
    param_grid = {
        'n_estimators': [50, 100, 200],
        'learning_rate': [0.01, 0.1, 0.2],
        'max_depth': [3, 5, 7],
        'min_samples_split': [2, 5, 10]
    }
    
    # Grid Search com CV
    grid_search = GridSearchCV(
        model,
        param_grid,
        cv=5,
        scoring=make_scorer(f1_score, average='weighted'),
        n_jobs=-1,
        verbose=1
    )
    
    # Fit
    grid_search.fit(X_train, y_train)
    
    return {
        'best_params': grid_search.best_params_,
        'best_score': float(grid_search.best_score_),
        'best_model': grid_search.best_estimator_,
        'cv_results': {
            'mean_test_score': grid_search.cv_results_['mean_test_score'].tolist(),
            'params': grid_search.cv_results_['params']
        }
    }
```

## Templates por Caso de Uso

### Template: Classification

```python
from sklearn.ensemble import RandomForestClassifier
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)
predictions = model.predict(X_test)
accuracy = model.score(X_test, y_test)
```

### Template: Regression

```python
from sklearn.linear_model import LinearRegression
model = LinearRegression()
model.fit(X_train, y_train)
predictions = model.predict(X_test)
r2_score = model.score(X_test, y_test)
```

### Template: Clustering

```python
from sklearn.cluster import KMeans
kmeans = KMeans(n_clusters=3, random_state=42)
clusters = kmeans.fit_predict(X)
centers = kmeans.cluster_centers_
```

## Alternativas e Quando Usar

| Biblioteca | Quando Usar em Vez de Scikit-learn |
|------------|-------------------------------------|
| XGBoost | Competições, datasets grandes, need GPU |
| LightGBM | Datasets muito grandes, velocidade crítica |
| PyTorch/TensorFlow | Deep Learning, Neural Networks |
| statsmodels | Análise estatística, inferência |
| Prophet | Séries temporais específicas |
| H2O | AutoML, deployment em produção |

## Requisitos do Sistema

- Python 3.8+
- NumPy >= 1.17.3
- SciPy >= 1.5.0
- joblib >= 1.1.1
- ~100MB de espaço em disco

## Dependências

```
numpy>=1.17.3
scipy>=1.5.0
joblib>=1.1.1
threadpoolctl>=2.0.0
```

## Notas de Compatibilidade

- ✅ Windows, Linux, macOS
- ✅ x86_64, ARM64
- ✅ Python 3.8-3.12
- ✅ Integração perfeita com pandas, matplotlib, seaborn
- ⚠️ Requer compilador C para instalação do source

## Troubleshooting Comum

### Problema: "ValueError: Input contains NaN"

**Solução:** Pré-processar dados
```python
from sklearn.impute import SimpleImputer
imputer = SimpleImputer(strategy='mean')
X_clean = imputer.fit_transform(X)
```

### Problema: "ValueError: could not convert string to float"

**Solução:** Encoder categóricos
```python
from sklearn.preprocessing import LabelEncoder
le = LabelEncoder()
X['category'] = le.fit_transform(X['category'])
```

### Problema: Overfitting (train score >> test score)

**Solução:** Regularização, cross-validation, mais dados
```python
# Usar regularização
from sklearn.linear_model import Ridge
model = Ridge(alpha=1.0)

# Ou reduzir complexidade
from sklearn.ensemble import RandomForestClassifier
model = RandomForestClassifier(max_depth=5, min_samples_split=20)
```

## Score de Seleção

```python
def calculate_sklearn_score(task_keywords: list) -> float:
    base_score = 0.80
    
    # Boost para ML clássico
    if any(k in task_keywords for k in ['classification', 'regression', 'clustering', 'predict']):
        base_score += 0.15
    
    # Boost para feature engineering
    if any(k in task_keywords for k in ['preprocessing', 'scaling', 'encoding']):
        base_score += 0.10
    
    # Penalty para deep learning
    if any(k in task_keywords for k in ['neural', 'deep', 'cnn', 'rnn', 'lstm']):
        base_score -= 0.50
    
    # Penalty para datasets gigantes
    if any(k in task_keywords for k in ['big data', 'spark', 'distributed']):
        base_score -= 0.30
    
    return min(base_score, 0.95)
```

## Best Practices

### 1. Sempre usar Pipeline
```python
from sklearn.pipeline import Pipeline
pipe = Pipeline([
    ('scaler', StandardScaler()),
    ('model', RandomForestClassifier())
])
```

### 2. Cross-validation obrigatória
```python
from sklearn.model_selection import cross_val_score
scores = cross_val_score(model, X, y, cv=5)
```

### 3. Salvar modelos treinados
```python
import joblib
joblib.dump(model, 'model.pkl')
model = joblib.load('model.pkl')
```

### 4. Feature scaling para algoritmos sensíveis
```python
# SVM, KNN, Logistic Regression precisam de scaling
# Tree-based (Random Forest, XGBoost) não precisam
```

## Última Atualização

2025-01-15