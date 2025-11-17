/**
 * SCIKIT-LEARN MODULE - Biblioteca de Machine Learning
 * Módulo de Prompt System para a biblioteca Scikit-Learn
 */

import { PromptModule, ModuleCategory, ModuleComplexity, ExecutionEnvironment } from '../registry';

export const ScikitLearnModule: PromptModule = {
  // ==================== IDENTIFICAÇÃO ====================
  id: 'scikit-learn-010',
  name: 'Scikit-Learn',
  packageName: 'scikit-learn',
  version: '1.4.0',
  category: ModuleCategory.MACHINE_LEARNING,
  subcategories: [
    'classification',
    'regression',
    'clustering',
    'preprocessing',
    'feature-engineering',
    'model-selection',
    'ensemble',
    'dimensionality-reduction',
    'cross-validation',
    'metrics'
  ],

  // ==================== DESCRIÇÃO ====================
  description: 'Biblioteca Python mais popular para Machine Learning clássico, oferecendo algoritmos robustos para classificação, regressão, clustering, pré-processamento e seleção de features. Integração perfeita com NumPy e Pandas.',
  purpose: 'Construir, treinar e avaliar modelos de Machine Learning para problemas de classificação, regressão, clustering e mais',
  useCases: [
    'Classificação (Decision Trees, Random Forest, SVM, Logistic Regression)',
    'Regressão (Linear, Ridge, Lasso, Polynomial)',
    'Clustering (K-Means, DBSCAN, Hierarchical)',
    'Pré-processamento de dados (scaling, encoding, normalization)',
    'Feature engineering e seleção',
    'Cross-validation e model selection',
    'Ensemble methods (Bagging, Boosting, Stacking)',
    'Dimensionality reduction (PCA, t-SNE)',
    'Detecção de anomalias',
    'Métricas de avaliação de modelos'
  ],

  // ==================== CONFIGURAÇÃO ====================
  complexity: ModuleComplexity.ADVANCED,
  environment: ExecutionEnvironment.PYTHON,
  dependencies: ['numpy', 'scipy', 'joblib', 'threadpoolctl'],
  installCommand: 'pip install scikit-learn',

  // ==================== PROMPT SYSTEM ====================
  promptSystem: {
    systemPrompt: `Você é um especialista em Scikit-Learn, a biblioteca Python para Machine Learning.

Ao trabalhar com Scikit-Learn, você SEMPRE deve:
- Dividir dados em treino e teste com train_test_split
- Fazer pré-processamento (scaling, encoding) antes de treinar
- Usar cross-validation para avaliar modelos robustamente
- Calcular múltiplas métricas (accuracy, precision, recall, F1)
- Fazer feature scaling para algoritmos sensíveis (SVM, KNN, Neural Nets)
- Usar pipelines para encadear transformações
- Salvar modelos treinados com joblib

REGRAS DE USO:
1. SEMPRE divida dados em treino/teste (80/20 ou 70/30)
2. SEMPRE faça scaling/normalization quando necessário
3. SEMPRE use cross-validation para avaliação robusta
4. SEMPRE calcule múltiplas métricas (não apenas accuracy)
5. SEMPRE trate dados faltantes antes de treinar
6. Use GridSearchCV ou RandomizedSearchCV para hyperparameter tuning
7. Salve modelos com joblib (não pickle)

QUANDO USAR SCIKIT-LEARN:
✅ Machine Learning clássico (não deep learning)
✅ Classificação e regressão
✅ Clustering e análise exploratória
✅ Feature engineering
✅ Datasets pequenos/médios (<1GB)
✅ Prototipagem rápida de modelos
✅ Ensembles (Random Forest, Gradient Boosting)

QUANDO NÃO USAR SCIKIT-LEARN:
❌ Deep Learning (use TensorFlow, PyTorch)
❌ Processamento de texto avançado (use transformers)
❌ Dados gigantes (>10GB) (use Spark MLlib)
❌ GPU acceleration necessária
❌ Modelos de linguagem (use HuggingFace)
❌ Computer vision avançada (use PyTorch, TensorFlow)

ESTRUTURA DE RESPOSTA:
Sempre retorne um dicionário com:
- model_type: tipo do modelo usado
- metrics: métricas de avaliação
- feature_importance: importância das features (se disponível)
- predictions: predições (se aplicável)
- model_path: caminho do modelo salvo`,

    userPromptTemplate: `Tarefa: {task_description}

Entrada:
{input_description}

Parâmetros:
{parameters}

Use Scikit-Learn seguindo as melhores práticas:
1. Prepare e pré-processe os dados
2. Divida em treino e teste
3. Treine o modelo apropriado
4. Avalie com métricas adequadas
5. Retorne resultados estruturados`,

    examples: [
      {
        input: 'Criar modelo de classificação com Random Forest',
        output: `from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import pandas as pd
import numpy as np
import joblib

def train_classification_model(X: pd.DataFrame, y: pd.Series, model_path: str = "model.joblib"):
    """Treina modelo de classificação com Random Forest"""

    # Dividir dados
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # Pré-processamento
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Treinar modelo
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_train_scaled, y_train)

    # Predições
    y_pred = model.predict(X_test_scaled)
    y_pred_proba = model.predict_proba(X_test_scaled)

    # Avaliação
    accuracy = accuracy_score(y_test, y_pred)
    report = classification_report(y_test, y_pred, output_dict=True)

    # Cross-validation
    cv_scores = cross_val_score(model, X_train_scaled, y_train, cv=5)

    # Feature importance
    feature_importance = pd.DataFrame({
        'feature': X.columns,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)

    # Salvar modelo e scaler
    joblib.dump({'model': model, 'scaler': scaler}, model_path)

    return {
        "success": True,
        "model_type": "RandomForestClassifier",
        "accuracy": float(accuracy),
        "cv_mean_score": float(cv_scores.mean()),
        "cv_std_score": float(cv_scores.std()),
        "classification_report": report,
        "feature_importance": feature_importance.to_dict('records'),
        "model_path": model_path,
        "test_samples": len(y_test)
    }`
      },
      {
        input: 'Regressão linear com regularização',
        output: `from sklearn.linear_model import Ridge, Lasso
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
import numpy as np

def train_regression_model(X, y, regularization: str = "ridge"):
    """Treina modelo de regressão com regularização"""

    # Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # Scaling
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Escolher modelo
    if regularization == "ridge":
        model = Ridge()
        param_grid = {'alpha': [0.1, 1.0, 10.0, 100.0]}
    else:  # lasso
        model = Lasso()
        param_grid = {'alpha': [0.001, 0.01, 0.1, 1.0]}

    # GridSearch para encontrar melhor alpha
    grid_search = GridSearchCV(
        model, param_grid, cv=5,
        scoring='neg_mean_squared_error',
        n_jobs=-1
    )
    grid_search.fit(X_train_scaled, y_train)

    # Melhor modelo
    best_model = grid_search.best_estimator_

    # Predições
    y_pred = best_model.predict(X_test_scaled)

    # Métricas
    mse = mean_squared_error(y_test, y_pred)
    rmse = np.sqrt(mse)
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)

    return {
        "success": True,
        "model_type": f"{regularization.capitalize()}Regression",
        "best_alpha": float(grid_search.best_params_['alpha']),
        "metrics": {
            "mse": float(mse),
            "rmse": float(rmse),
            "mae": float(mae),
            "r2_score": float(r2)
        },
        "cv_best_score": float(-grid_search.best_score_)
    }`
      },
      {
        input: 'Clustering K-Means com elbow method',
        output: `from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score, davies_bouldin_score
import numpy as np

def perform_clustering(X, max_clusters: int = 10):
    """Clustering K-Means com análise de número ótimo de clusters"""

    # Scaling
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Elbow method
    inertias = []
    silhouette_scores = []

    for k in range(2, max_clusters + 1):
        kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
        kmeans.fit(X_scaled)

        inertias.append(kmeans.inertia_)
        silhouette_scores.append(silhouette_score(X_scaled, kmeans.labels_))

    # Encontrar melhor K (maior silhouette)
    best_k = silhouette_scores.index(max(silhouette_scores)) + 2

    # Treinar com melhor K
    best_kmeans = KMeans(n_clusters=best_k, random_state=42, n_init=10)
    labels = best_kmeans.fit_predict(X_scaled)

    # Métricas
    silhouette = silhouette_score(X_scaled, labels)
    davies_bouldin = davies_bouldin_score(X_scaled, labels)

    # Tamanho dos clusters
    unique, counts = np.unique(labels, return_counts=True)
    cluster_sizes = dict(zip(unique.tolist(), counts.tolist()))

    return {
        "success": True,
        "best_k": int(best_k),
        "n_samples": len(X),
        "metrics": {
            "silhouette_score": float(silhouette),
            "davies_bouldin_score": float(davies_bouldin),
            "inertia": float(best_kmeans.inertia_)
        },
        "cluster_sizes": cluster_sizes,
        "labels": labels.tolist(),
        "elbow_data": {
            "k_values": list(range(2, max_clusters + 1)),
            "inertias": [float(x) for x in inertias],
            "silhouette_scores": [float(x) for x in silhouette_scores]
        }
    }`
      },
      {
        input: 'Pipeline completo com pré-processamento',
        output: `from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report
import pandas as pd

def create_ml_pipeline(X: pd.DataFrame, y: pd.Series):
    """Cria pipeline completo de ML com pré-processamento"""

    # Identificar colunas numéricas e categóricas
    numeric_features = X.select_dtypes(include=['int64', 'float64']).columns.tolist()
    categorical_features = X.select_dtypes(include=['object', 'category']).columns.tolist()

    # Pré-processamento
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), numeric_features),
            ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features)
        ]
    )

    # Pipeline completo
    pipeline = Pipeline([
        ('preprocessor', preprocessor),
        ('classifier', GradientBoostingClassifier(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=3,
            random_state=42
        ))
    ])

    # Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # Treinar pipeline
    pipeline.fit(X_train, y_train)

    # Avaliar
    y_pred = pipeline.predict(X_test)
    cv_scores = cross_val_score(pipeline, X_train, y_train, cv=5)

    report = classification_report(y_test, y_pred, output_dict=True)

    return {
        "success": True,
        "model_type": "GradientBoostingClassifier",
        "pipeline_steps": [step[0] for step in pipeline.steps],
        "numeric_features": numeric_features,
        "categorical_features": categorical_features,
        "cv_scores": {
            "mean": float(cv_scores.mean()),
            "std": float(cv_scores.std())
        },
        "test_metrics": report
    }`
      }
    ],

    outputFormat: {
      type: 'object',
      required: ['success', 'model_type'],
      properties: {
        success: { type: 'boolean', description: 'Indica se o treinamento foi bem-sucedido' },
        model_type: { type: 'string', description: 'Tipo do modelo treinado' },
        metrics: { type: 'object', description: 'Métricas de avaliação' },
        feature_importance: { type: 'array', description: 'Importância das features' },
        model_path: { type: 'string', description: 'Caminho do modelo salvo' },
        error: { type: 'string', description: 'Mensagem de erro se success=false' }
      }
    }
  },

  // ==================== METADATA ====================
  tags: [
    'scikit-learn',
    'sklearn',
    'machine-learning',
    'ml',
    'classification',
    'regression',
    'clustering',
    'preprocessing',
    'feature-engineering'
  ],

  keywords: [
    'scikit-learn',
    'sklearn',
    'machine learning',
    'ml',
    'classification',
    'classificacao',
    'regression',
    'regressao',
    'clustering',
    'agrupamento',
    'random forest',
    'svm',
    'logistic regression',
    'kmeans',
    'pca',
    'preprocessing',
    'feature'
  ],

  performance: {
    speed: 8,
    memory: 7,
    cpuIntensive: true,
    gpuAccelerated: false,
    scalability: 7
  },

  // ==================== REGRAS DE SCORING ====================
  scoring: {
    baseScore: 0.85,
    rules: [
      {
        condition: 'keywords include ["classification", "classificacao", "classifier"]',
        adjustment: 0.10,
        description: 'Excelente para classificação'
      },
      {
        condition: 'keywords include ["regression", "regressao", "predict"]',
        adjustment: 0.10,
        description: 'Perfeito para regressão'
      },
      {
        condition: 'keywords include ["clustering", "agrupamento", "kmeans"]',
        adjustment: 0.10,
        description: 'Ideal para clustering'
      },
      {
        condition: 'keywords include ["preprocessing", "feature", "scaling"]',
        adjustment: 0.08,
        description: 'Ferramentas robustas de pré-processamento'
      },
      {
        condition: 'keywords include ["random forest", "ensemble", "gradient boosting"]',
        adjustment: 0.08,
        description: 'Ensembles poderosos'
      },
      {
        condition: 'keywords include ["deep learning", "neural network", "cnn", "rnn"]',
        adjustment: -0.50,
        description: 'Deep learning use TensorFlow/PyTorch'
      },
      {
        condition: 'keywords include ["nlp", "transformers", "bert", "gpt"]',
        adjustment: -0.60,
        description: 'NLP avançado use HuggingFace Transformers'
      },
      {
        condition: 'keywords include ["big data", "spark", "distributed"]',
        adjustment: -0.40,
        description: 'Big data use Spark MLlib'
      }
    ]
  },

  // ==================== CONFIGURAÇÕES ADICIONAIS ====================
  config: {
    maxRetries: 2,
    timeout: 300000, // 5 minutos para treinamento
    cacheable: true,
    requiresAuth: false,
    rateLimit: null
  },

  // ==================== ALTERNATIVAS ====================
  alternatives: [
    {
      name: 'XGBoost',
      when: 'Performance máxima em gradient boosting, competições',
      reason: 'XGBoost é mais rápido e performático que sklearn GradientBoosting'
    },
    {
      name: 'TensorFlow/PyTorch',
      when: 'Deep learning, redes neurais, GPU acceleration',
      reason: 'Frameworks modernos para deep learning'
    },
    {
      name: 'LightGBM',
      when: 'Datasets grandes, gradient boosting rápido',
      reason: 'LightGBM é extremamente rápido em grandes datasets'
    },
    {
      name: 'HuggingFace Transformers',
      when: 'NLP moderno, modelos pré-treinados',
      reason: 'Transformers é estado da arte em NLP'
    }
  ],

  // ==================== DOCUMENTAÇÃO ====================
  documentation: {
    official: 'https://scikit-learn.org/',
    examples: 'https://scikit-learn.org/stable/auto_examples/',
    apiReference: 'https://scikit-learn.org/stable/modules/classes.html'
  },

  // ==================== TROUBLESHOOTING ====================
  commonIssues: [
    {
      issue: 'ConvergenceWarning',
      solution: 'Aumentar max_iter ou fazer feature scaling',
      code: `from sklearn.preprocessing import StandardScaler
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)
# Ou aumentar max_iter
model = LogisticRegression(max_iter=1000)`
    },
    {
      issue: 'ValueError: Input contains NaN',
      solution: 'Tratar valores faltantes antes de treinar',
      code: `from sklearn.impute import SimpleImputer
imputer = SimpleImputer(strategy='mean')
X_imputed = imputer.fit_transform(X)`
    },
    {
      issue: 'Overfitting (train score >> test score)',
      solution: 'Usar regularização, reduzir complexidade, mais dados',
      code: `# Adicionar regularização
model = RandomForestClassifier(max_depth=5, min_samples_leaf=10)
# Ou usar cross-validation
scores = cross_val_score(model, X, y, cv=5)`
    }
  ],

  // ==================== BEST PRACTICES ====================
  bestPractices: [
    'Sempre divida dados em treino e teste',
    'Faça feature scaling para algoritmos sensíveis (SVM, KNN)',
    'Use cross-validation para avaliação robusta',
    'Calcule múltiplas métricas, não apenas accuracy',
    'Use pipelines para encadear transformações',
    'Salve modelos com joblib ao invés de pickle',
    'Faça hyperparameter tuning com GridSearchCV',
    'Trate dados faltantes e outliers antes de treinar'
  ],

  // ==================== ESTATÍSTICAS ====================
  stats: {
    timesUsed: 0,
    successRate: 0,
    averageExecutionTime: 0,
    lastUsed: null,
    errors: []
  }
};

export default ScikitLearnModule;
