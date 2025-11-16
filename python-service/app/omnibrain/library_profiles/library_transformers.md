# Transformers (Hugging Face)

## Informações Básicas

- **Nome:** transformers
- **Categoria:** NLP, Machine Learning, Text Processing, AI Models
- **Versão Mínima:** 4.30.0
- **Versão Recomendada:** 4.36.0+
- **Licença:** Apache 2.0
- **Documentação:** https://huggingface.co/docs/transformers/

## Descrição

Transformers é a biblioteca state-of-the-art da Hugging Face para processamento de linguagem natural (NLP). Fornece acesso a milhares de modelos pré-treinados (BERT, GPT, T5, LLaMA, etc.) para tarefas como classificação de texto, análise de sentimento, tradução, geração de texto, question answering, named entity recognition e muito mais. É a escolha #1 para NLP moderno.

## Casos de Uso Prioritários

1. **Classificação de Texto** (confidence: 0.98)
2. **Análise de Sentimento** (confidence: 0.98)
3. **Geração de Texto** (confidence: 0.95)
4. **Tradução Automática** (confidence: 0.95)
5. **Question Answering** (confidence: 0.95)
6. **Named Entity Recognition (NER)** (confidence: 0.95)
7. **Summarization** (confidence: 0.93)
8. **Embeddings/Similarity** (confidence: 0.95)
9. **Zero-shot Classification** (confidence: 0.90)
10. **Text Generation (GPT-style)** (confidence: 0.95)

## Prós

- ✅ Acesso a 100,000+ modelos pré-treinados
- ✅ State-of-the-art para praticamente todas tarefas NLP
- ✅ API consistente para diferentes modelos
- ✅ Hub centralizado de modelos (huggingface.co)
- ✅ Suporte a PyTorch, TensorFlow e JAX
- ✅ Pipeline abstraction extremamente simples
- ✅ Fine-tuning facilitado
- ✅ Suporta GPU/TPU acceleration
- ✅ Community gigantesca
- ✅ Documentação excelente
- ✅ Integração com outras ferramentas ML
- ✅ Modelos multilíngues disponíveis

## Contras

- ⚠️ Modelos grandes consomem muita RAM (1-20GB+)
- ⚠️ Download inicial de modelos pode demorar
- ⚠️ Requer conhecimento de ML para fine-tuning
- ⚠️ Inference pode ser lenta em CPU
- ⚠️ Dependências pesadas (PyTorch/TensorFlow)
- ⚠️ Curva de aprendizado para uso avançado
- ⚠️ Versionamento de modelos pode causar breaking changes

## Performance

- **Velocidade:** ⭐⭐⭐⭐ (8/10 com GPU, 5/10 com CPU)
- **Uso de Memória:** ⭐⭐⭐ (6/10 - modelos grandes)
- **Qualidade de Output:** ⭐⭐⭐⭐⭐ (10/10)
- **Facilidade de Uso:** ⭐⭐⭐⭐⭐ (9/10 com pipelines)

## Instalação

```bash
# Básico
pip install transformers

# Com PyTorch
pip install transformers torch

# Com TensorFlow
pip install transformers tensorflow

# Com todas features
pip install transformers[torch,sentencepiece,tokenizers,tf]
```

## Keywords/Triggers

- transformers
- huggingface
- bert
- gpt
- nlp
- natural language processing
- text classification
- sentiment analysis
- text generation
- language model
- llm
- named entity recognition
- ner
- question answering
- translation
- summarization
- embeddings
- zero-shot

## Exemplos de Código

### Básico: Análise de Sentimento

```python
from transformers import pipeline

def analyze_sentiment(text: str) -> dict:
    """Analisa sentimento de texto"""
    try:
        # Criar pipeline de sentimento
        classifier = pipeline("sentiment-analysis")
        
        # Analisar
        result = classifier(text)[0]
        
        return {
            'success': True,
            'output': {
                'text': text,
                'sentiment': result['label'],
                'confidence': result['score']
            },
            'metadata': {
                'library_used': 'transformers',
                'model': 'distilbert-base-uncased-finetuned-sst-2-english'
            }
        }
    
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }
```

### Intermediário: Classificação de Texto Custom

```python
from transformers import pipeline

def classify_text(text: str, labels: list) -> dict:
    """Classificação zero-shot com labels customizados"""
    try:
        # Pipeline de zero-shot classification
        classifier = pipeline("zero-shot-classification")
        
        # Classificar
        result = classifier(
            text,
            candidate_labels=labels,
            multi_label=False
        )
        
        # Formatar resultados
        classifications = []
        for label, score in zip(result['labels'], result['scores']):
            classifications.append({
                'label': label,
                'confidence': float(score)
            })
        
        return {
            'success': True,
            'output': {
                'text': text,
                'classifications': classifications,
                'top_label': result['labels'][0],
                'top_confidence': float(result['scores'][0])
            }
        }
    
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }
```

### Avançado: Named Entity Recognition (NER)

```python
from transformers import pipeline

def extract_entities(text: str) -> dict:
    """Extrai entidades nomeadas do texto"""
    try:
        # Pipeline NER
        ner = pipeline("ner", aggregation_strategy="simple")
        
        # Extrair entidades
        entities = ner(text)
        
        # Agrupar por tipo
        entities_by_type = {}
        for entity in entities:
            entity_type = entity['entity_group']
            if entity_type not in entities_by_type:
                entities_by_type[entity_type] = []
            
            entities_by_type[entity_type].append({
                'text': entity['word'],
                'confidence': float(entity['score']),
                'start': entity['start'],
                'end': entity['end']
            })
        
        return {
            'success': True,
            'output': {
                'text': text,
                'entities': entities_by_type,
                'total_entities': len(entities)
            },
            'metadata': {
                'library_used': 'transformers',
                'task': 'named_entity_recognition'
            }
        }
    
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }
```

### Expert: Geração de Texto com GPT

```python
from transformers import pipeline, set_seed

def generate_text(prompt: str, max_length: int = 100, 
                  temperature: float = 0.7, num_return: int = 1) -> dict:
    """Gera texto usando modelo GPT"""
    try:
        # Seed para reprodutibilidade
        set_seed(42)
        
        # Pipeline de geração
        generator = pipeline(
            "text-generation",
            model="gpt2",  # Ou "gpt2-medium", "gpt2-large"
            device=0 if torch.cuda.is_available() else -1
        )
        
        # Gerar
        results = generator(
            prompt,
            max_length=max_length,
            num_return_sequences=num_return,
            temperature=temperature,
            do_sample=True,
            top_k=50,
            top_p=0.95
        )
        
        # Extrair textos gerados
        generated_texts = [r['generated_text'] for r in results]
        
        return {
            'success': True,
            'output': {
                'prompt': prompt,
                'generated_texts': generated_texts,
                'count': len(generated_texts)
            },
            'metadata': {
                'library_used': 'transformers',
                'model': 'gpt2',
                'max_length': max_length,
                'temperature': temperature
            }
        }
    
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }
```

### Expert: Question Answering

```python
from transformers import pipeline

def answer_question(question: str, context: str) -> dict:
    """Responde pergunta baseado em contexto"""
    try:
        # Pipeline Q&A
        qa = pipeline("question-answering")
        
        # Fazer pergunta
        result = qa(question=question, context=context)
        
        return {
            'success': True,
            'output': {
                'question': question,
                'answer': result['answer'],
                'confidence': float(result['score']),
                'start': result['start'],
                'end': result['end']
            },
            'metadata': {
                'library_used': 'transformers',
                'context_length': len(context)
            }
        }
    
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }
```

### Expert: Text Summarization

```python
from transformers import pipeline

def summarize_text(text: str, max_length: int = 130, 
                   min_length: int = 30) -> dict:
    """Resume texto longo"""
    try:
        # Pipeline de summarization
        summarizer = pipeline("summarization")
        
        # Resumir
        summary = summarizer(
            text,
            max_length=max_length,
            min_length=min_length,
            do_sample=False
        )[0]
        
        # Calcular taxa de compressão
        compression_ratio = len(summary['summary_text']) / len(text)
        
        return {
            'success': True,
            'output': {
                'original_text': text,
                'summary': summary['summary_text'],
                'original_length': len(text),
                'summary_length': len(summary['summary_text']),
                'compression_ratio': round(compression_ratio, 2)
            },
            'metadata': {
                'library_used': 'transformers',
                'task': 'summarization'
            }
        }
    
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }
```

### Expert: Translation

```python
from transformers import pipeline

def translate_text(text: str, source_lang: str = "en", 
                   target_lang: str = "pt") -> dict:
    """Traduz texto entre idiomas"""
    try:
        # Pipeline de tradução
        translator = pipeline(
            "translation",
            model=f"Helsinki-NLP/opus-mt-{source_lang}-{target_lang}"
        )
        
        # Traduzir
        translation = translator(text)[0]
        
        return {
            'success': True,
            'output': {
                'original': text,
                'translated': translation['translation_text'],
                'source_lang': source_lang,
                'target_lang': target_lang
            }
        }
    
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }
```

## Templates por Caso de Uso

### Template: Sentiment Analysis

```python
from transformers import pipeline
classifier = pipeline("sentiment-analysis")
result = classifier("{text}")[0]
sentiment = result['label']
confidence = result['score']
```

### Template: Text Classification

```python
from transformers import pipeline
classifier = pipeline("zero-shot-classification")
result = classifier("{text}", candidate_labels={labels})
top_label = result['labels'][0]
```

### Template: NER

```python
from transformers import pipeline
ner = pipeline("ner", aggregation_strategy="simple")
entities = ner("{text}")
```

### Template: Text Generation

```python
from transformers import pipeline
generator = pipeline("text-generation", model="gpt2")
result = generator("{prompt}", max_length={max_length})
generated_text = result[0]['generated_text']
```

## Alternativas e Quando Usar

| Biblioteca | Quando Usar em Vez de Transformers |
|------------|-------------------------------------|
| spaCy | NLP tradicional, velocidade crítica, pipelines production |
| NLTK | Tarefas básicas, educação, sem GPU |
| gensim | Topic modeling, word embeddings clássicos |
| TextBlob | NLP super simples, prototipagem rápida |
| OpenAI API | GPT-4, modelos mais avançados, sem infraestrutura ML |
| sentence-transformers | Apenas embeddings, similarity search |

## Requisitos do Sistema

- Python 3.7+
- PyTorch >= 1.10 ou TensorFlow >= 2.3
- 4GB+ RAM (modelos pequenos)
- 16GB+ RAM (modelos médios/grandes)
- GPU recomendada (CUDA) para produção
- 1-20GB disco (dependendo dos modelos)

## Dependências

```
tokenizers>=0.13.0
huggingface-hub>=0.16.0
pyyaml>=5.1
regex!=2019.12.17
requests
packaging>=20.0
filelock
numpy>=1.17
safetensors>=0.3.1
```

## Notas de Compatibilidade

- ✅ Windows, Linux, macOS
- ✅ x86_64, ARM64 (M1/M2 Macs)
- ✅ Python 3.7-3.11
- ✅ CUDA 11.x, 12.x (GPU)
- ✅ Apple Silicon (MPS) support
- ⚠️ Alguns modelos só funcionam com PyTorch OU TensorFlow
- ⚠️ Modelos grandes precisam GPU com 16GB+ VRAM

## Troubleshooting Comum

### Problema: "OutOfMemoryError" ao carregar modelo

**Solução:** Usar modelo menor ou quantização
```python
from transformers import AutoModelForSequenceClassification
model = AutoModelForSequenceClassification.from_pretrained(
    "model-name",
    load_in_8bit=True,  # Quantização 8-bit
    device_map="auto"
)
```

### Problema: Download de modelo muito lento

**Solução:** Usar cache local e mirror
```python
from transformers import pipeline
import os

# Configurar cache
os.environ['TRANSFORMERS_CACHE'] = '/path/to/cache'

# Usar modelo já baixado
classifier = pipeline("sentiment-analysis", model="local/path/to/model")
```

### Problema: Inference muito lenta em CPU

**Solução:** Otimizar ou usar modelo menor
```python
# Usar modelo distillado (menor e mais rápido)
classifier = pipeline("sentiment-analysis", model="distilbert-base-uncased")

# Ou usar batch processing
texts = ["text1", "text2", "text3"]
results = classifier(texts, batch_size=8)
```

### Problema: Model não encontrado

**Solução:** Verificar nome correto no Hub
```python
# Buscar no https://huggingface.co/models
# Nome completo: "organization/model-name"
pipeline("task", model="bert-base-uncased")  # ✅ Correto
pipeline("task", model="bert")  # ❌ Incompleto
```

## Score de Seleção

```python
def calculate_transformers_score(task_keywords: list, context: dict) -> float:
    base_score = 0.70
    
    # Boost massivo para tarefas NLP modernas
    nlp_keywords = ['sentiment', 'classification', 'ner', 'question', 
                    'translation', 'summarization', 'generation', 'embedding']
    if any(k in task_keywords for k in nlp_keywords):
        base_score += 0.25
    
    # Boost se GPU disponível
    if context.get('gpu_available'):
        base_score += 0.10
    
    # Boost para qualidade alta
    if context.get('quality_over_speed'):
        base_score += 0.10
    
    # Penalty se precisa velocidade extrema
    if 'realtime' in task_keywords or context.get('latency_critical'):
        base_score -= 0.20
    
    # Penalty se sem GPU e modelo grande
    if not context.get('gpu_available') and context.get('large_model'):
        base_score -= 0.15
    
    return min(base_score, 0.98)
```

## Modelos Recomendados por Tarefa

### Sentiment Analysis
- `distilbert-base-uncased-finetuned-sst-2-english` (rápido)
- `cardiffnlp/twitter-roberta-base-sentiment` (Twitter)
- `nlptown/bert-base-multilingual-uncased-sentiment` (multilíngue)

### Text Classification
- `facebook/bart-large-mnli` (zero-shot)
- `MoritzLaurer/DeBERTa-v3-base-mnli-fever-anli` (melhor zero-shot)

### NER
- `dslim/bert-base-NER` (inglês)
- `Davlan/bert-base-multilingual-cased-ner-hrl` (multilíngue)

### Question Answering
- `deepset/roberta-base-squad2` (inglês)
- `bert-large-uncased-whole-word-masking-finetuned-squad` (alta qualidade)

### Text Generation
- `gpt2` (básico)
- `gpt2-medium`, `gpt2-large` (melhor qualidade)
- `EleutherAI/gpt-neo-2.7B` (open-source avançado)

### Summarization
- `facebook/bart-large-cnn` (notícias)
- `sshleifer/distilbart-cnn-12-6` (rápido)

### Translation
- `Helsinki-NLP/opus-mt-{source}-{target}` (muitos pares)
- `facebook/mbart-large-50-many-to-many-mmt` (multilíngue)

## Best Practices

### 1. Usar Pipelines para Simplicidade
```python
# ✅ Recomendado para protótipos
from transformers import pipeline
classifier = pipeline("sentiment-analysis")
```

### 2. Carregar Modelo Uma Vez
```python
# ✅ Carregar no início, reusar
model = pipeline("sentiment-analysis")

# Usar múltiplas vezes
for text in texts:
    result = model(text)
```

### 3. Batch Processing
```python
# ✅ Processar em lote é muito mais rápido
texts = ["text1", "text2", "text3", ...]
results = classifier(texts, batch_size=16)
```

### 4. Cache de Modelos
```python
# ✅ Evitar re-download
import os
os.environ['TRANSFORMERS_CACHE'] = './models_cache'
```

### 5. Quantização para Produção
```python
# ✅ Reduzir memória sem perder muita qualidade
model = AutoModel.from_pretrained("model", load_in_8bit=True)
```

## Use Cases Ideais

- ✅ Análise de sentimento em reviews/comentários
- ✅ Classificação automática de tickets/emails
- ✅ Extração de entidades de textos
- ✅ Geração de respostas automáticas
- ✅ Tradução de conteúdo
- ✅ Resumo de documentos longos
- ✅ Q&A sobre documentação
- ✅ Moderação de conteúdo
- ✅ Análise de feedback de clientes
- ✅ Chatbots inteligentes

## Não Use Para

- ❌ NLP básico que spaCy/NLTK fazem bem (tokenização simples, etc)
- ❌ Aplicações com latência <100ms crítica
- ❌ Ambientes com <4GB RAM
- ❌ Quando não tem GPU e precisa processar muito volume
- ❌ Tasks que não são NLP (use bibliotecas específicas)

## Última Atualização

2025-01-15