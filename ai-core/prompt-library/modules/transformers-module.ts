/**
 * TRANSFORMERS MODULE - Biblioteca de NLP e Modelos Pré-treinados
 * Módulo de Prompt System para a biblioteca HuggingFace Transformers
 */

import { PromptModule, ModuleCategory, ModuleComplexity, ExecutionEnvironment } from '../registry';

export const TransformersModule: PromptModule = {
  // ==================== IDENTIFICAÇÃO ====================
  id: 'transformers-011',
  name: 'Transformers (HuggingFace)',
  packageName: 'transformers',
  version: '4.36.0',
  category: ModuleCategory.NLP,
  subcategories: [
    'text-classification',
    'sentiment-analysis',
    'ner',
    'question-answering',
    'text-generation',
    'translation',
    'summarization',
    'embeddings',
    'pretrained-models',
    'bert',
    'gpt',
    'llm'
  ],

  // ==================== DESCRIÇÃO ====================
  description: 'Biblioteca estado-da-arte para NLP (Natural Language Processing) com acesso a milhares de modelos pré-treinados (BERT, GPT, T5, etc). Oferece APIs simples para tarefas como classificação de texto, análise de sentimento, geração de texto, tradução e muito mais.',
  purpose: 'Processar linguagem natural usando modelos de deep learning pré-treinados para tarefas de NLP',
  useCases: [
    'Análise de sentimento (positivo, negativo, neutro)',
    'Classificação de texto em categorias',
    'Named Entity Recognition (NER) - extrair nomes, locais, datas',
    'Question Answering - responder perguntas sobre texto',
    'Geração de texto (GPT, GPT-2, GPT-3)',
    'Tradução automática entre idiomas',
    'Sumarização de textos longos',
    'Text embeddings e similarity',
    'Zero-shot classification',
    'Fill-mask (completar texto)',
    'Conversational AI e chatbots',
    'Feature extraction para ML'
  ],

  // ==================== CONFIGURAÇÃO ====================
  complexity: ModuleComplexity.ADVANCED,
  environment: ExecutionEnvironment.PYTHON,
  dependencies: ['torch', 'numpy', 'tokenizers', 'huggingface-hub'],
  installCommand: 'pip install transformers torch',

  // ==================== PROMPT SYSTEM ====================
  promptSystem: {
    systemPrompt: `Você é um especialista em HuggingFace Transformers, a biblioteca Python para NLP com modelos pré-treinados.

Ao trabalhar com Transformers, você SEMPRE deve:
- Usar pipeline() para tarefas comuns (mais simples e eficiente)
- Especificar modelo adequado para a tarefa (bert-base, gpt2, t5, etc)
- Considerar idioma do modelo (multilingual ou específico)
- Fazer truncation=True para textos longos
- Usar device="cuda" quando GPU disponível
- Cache modelos para evitar downloads repetidos
- Limitar max_length para evitar OOM (Out of Memory)

REGRAS DE USO:
1. SEMPRE use pipeline() para tarefas padrão (mais simples)
2. SEMPRE especifique modelo adequado para o idioma
3. SEMPRE adicione truncation=True para textos longos
4. SEMPRE considere max_length para evitar OOM
5. Use batch processing quando possível (mais eficiente)
6. Cache modelos localmente após primeiro download
7. Considere usar modelos menores para prototipagem

QUANDO USAR TRANSFORMERS:
✅ NLP moderno (classificação, NER, sentiment)
✅ Análise de texto em produção
✅ Question answering
✅ Geração de texto
✅ Tradução automática
✅ Embeddings de texto
✅ Zero-shot learning
✅ Fine-tuning de modelos

QUANDO NÃO USAR TRANSFORMERS:
❌ Processamento de texto muito simples (use regex, nltk)
❌ ML clássico sem deep learning (use scikit-learn)
❌ Hardware muito limitado (modelos grandes precisam GPU)
❌ Apenas tokenização simples (use nltk, spacy)
❌ Aplicações sem deep learning
❌ Real-time crítico sem GPU

ESTRUTURA DE RESPOSTA:
Sempre retorne um dicionário com:
- task: tarefa executada
- model: modelo usado
- results: resultados da inferência
- scores: scores de confiança
- processing_time: tempo de processamento`,

    userPromptTemplate: `Tarefa: {task_description}

Entrada:
{input_description}

Parâmetros:
{parameters}

Use HuggingFace Transformers seguindo as melhores práticas:
1. Escolha o modelo adequado para a tarefa e idioma
2. Use pipeline() para simplicidade
3. Configure truncation e max_length
4. Execute a inferência
5. Retorne resultados estruturados`,

    examples: [
      {
        input: 'Análise de sentimento em português',
        output: `from transformers import pipeline
from typing import Dict, Any, List

def analyze_sentiment(texts: List[str]) -> Dict[str, Any]:
    """Análise de sentimento usando modelo pré-treinado"""
    try:
        # Pipeline de sentiment analysis
        # Modelo multilingual ou português específico
        classifier = pipeline(
            "sentiment-analysis",
            model="nlptown/bert-base-multilingual-uncased-sentiment",
            device=-1  # CPU (-1) ou GPU (0)
        )

        # Processar textos
        results = classifier(
            texts,
            truncation=True,
            max_length=512
        )

        # Formatar resultados
        formatted_results = []
        for text, result in zip(texts, results):
            formatted_results.append({
                "text": text[:100] + "..." if len(text) > 100 else text,
                "sentiment": result['label'],
                "score": float(result['score'])
            })

        return {
            "success": True,
            "task": "sentiment-analysis",
            "model": "nlptown/bert-base-multilingual-uncased-sentiment",
            "texts_processed": len(texts),
            "results": formatted_results
        }
    except Exception as e:
        return {"success": False, "error": str(e)}`
      },
      {
        input: 'Named Entity Recognition (NER)',
        output: `from transformers import pipeline
from typing import Dict, Any

def extract_entities(text: str) -> Dict[str, Any]:
    """Extrai entidades nomeadas do texto (pessoas, locais, organizações)"""
    try:
        # Pipeline NER
        ner = pipeline(
            "ner",
            model="dbmdz/bert-large-cased-finetuned-conll03-english",
            aggregation_strategy="simple"  # Agrupa tokens
        )

        # Extrair entidades
        entities = ner(text)

        # Agrupar por tipo
        entities_by_type = {}
        for entity in entities:
            entity_type = entity['entity_group']
            if entity_type not in entities_by_type:
                entities_by_type[entity_type] = []

            entities_by_type[entity_type].append({
                "text": entity['word'],
                "score": float(entity['score']),
                "start": entity['start'],
                "end": entity['end']
            })

        return {
            "success": True,
            "task": "named-entity-recognition",
            "text_length": len(text),
            "entities_found": len(entities),
            "entities_by_type": entities_by_type,
            "all_entities": [
                {
                    "text": e['word'],
                    "type": e['entity_group'],
                    "score": float(e['score'])
                }
                for e in entities
            ]
        }
    except Exception as e:
        return {"success": False, "error": str(e)}`
      },
      {
        input: 'Question Answering sobre contexto',
        output: `from transformers import pipeline
from typing import Dict, Any

def answer_question(context: str, question: str) -> Dict[str, Any]:
    """Responde pergunta baseada em contexto fornecido"""
    try:
        # Pipeline QA
        qa = pipeline(
            "question-answering",
            model="deepset/roberta-base-squad2"
        )

        # Buscar resposta
        result = qa(
            question=question,
            context=context,
            max_length=512,
            truncation=True
        )

        return {
            "success": True,
            "task": "question-answering",
            "question": question,
            "answer": result['answer'],
            "confidence_score": float(result['score']),
            "start_position": result['start'],
            "end_position": result['end']
        }
    except Exception as e:
        return {"success": False, "error": str(e)}`
      },
      {
        input: 'Geração de texto com GPT-2',
        output: `from transformers import pipeline
from typing import Dict, Any, List

def generate_text(
    prompt: str,
    max_length: int = 100,
    num_sequences: int = 1,
    temperature: float = 0.7
) -> Dict[str, Any]:
    """Gera texto usando modelo GPT-2"""
    try:
        # Pipeline de geração
        generator = pipeline(
            "text-generation",
            model="gpt2",
            device=-1
        )

        # Gerar texto
        results = generator(
            prompt,
            max_length=max_length,
            num_return_sequences=num_sequences,
            temperature=temperature,
            do_sample=True,
            top_k=50,
            top_p=0.95
        )

        # Formatar resultados
        generated_texts = [r['generated_text'] for r in results]

        return {
            "success": True,
            "task": "text-generation",
            "model": "gpt2",
            "prompt": prompt,
            "sequences_generated": len(generated_texts),
            "generated_texts": generated_texts,
            "parameters": {
                "max_length": max_length,
                "temperature": temperature,
                "num_sequences": num_sequences
            }
        }
    except Exception as e:
        return {"success": False, "error": str(e)}`
      },
      {
        input: 'Classificação Zero-Shot (sem treinamento)',
        output: `from transformers import pipeline
from typing import Dict, Any, List

def zero_shot_classification(
    text: str,
    candidate_labels: List[str]
) -> Dict[str, Any]:
    """Classifica texto em categorias sem treinamento prévio"""
    try:
        # Pipeline zero-shot
        classifier = pipeline(
            "zero-shot-classification",
            model="facebook/bart-large-mnli"
        )

        # Classificar
        result = classifier(
            text,
            candidate_labels=candidate_labels,
            multi_label=False
        )

        # Formatar resultados
        classifications = [
            {
                "label": label,
                "score": float(score)
            }
            for label, score in zip(result['labels'], result['scores'])
        ]

        return {
            "success": True,
            "task": "zero-shot-classification",
            "text": text[:200],
            "top_prediction": result['labels'][0],
            "top_score": float(result['scores'][0]),
            "all_classifications": classifications
        }
    except Exception as e:
        return {"success": False, "error": str(e)}`
      },
      {
        input: 'Sumarização de texto longo',
        output: `from transformers import pipeline
from typing import Dict, Any

def summarize_text(
    text: str,
    max_length: int = 130,
    min_length: int = 30
) -> Dict[str, Any]:
    """Sumariza texto longo em resumo conciso"""
    try:
        # Pipeline de sumarização
        summarizer = pipeline(
            "summarization",
            model="facebook/bart-large-cnn"
        )

        # Sumarizar
        summary = summarizer(
            text,
            max_length=max_length,
            min_length=min_length,
            do_sample=False,
            truncation=True
        )

        summary_text = summary[0]['summary_text']

        # Calcular redução
        compression_ratio = len(summary_text) / len(text)

        return {
            "success": True,
            "task": "summarization",
            "original_length": len(text),
            "summary_length": len(summary_text),
            "compression_ratio": round(compression_ratio, 2),
            "summary": summary_text
        }
    except Exception as e:
        return {"success": False, "error": str(e)}`
      }
    ],

    outputFormat: {
      type: 'object',
      required: ['success', 'task'],
      properties: {
        success: { type: 'boolean', description: 'Indica se a inferência foi bem-sucedida' },
        task: { type: 'string', description: 'Tarefa executada (sentiment, ner, qa, etc)' },
        model: { type: 'string', description: 'Modelo usado' },
        results: { type: 'any', description: 'Resultados da inferência' },
        scores: { type: 'array', description: 'Scores de confiança' },
        error: { type: 'string', description: 'Mensagem de erro se success=false' }
      }
    }
  },

  // ==================== METADATA ====================
  tags: [
    'transformers',
    'huggingface',
    'nlp',
    'bert',
    'gpt',
    'sentiment',
    'ner',
    'classification',
    'text-generation',
    'question-answering'
  ],

  keywords: [
    'transformers',
    'huggingface',
    'nlp',
    'natural language',
    'linguagem natural',
    'bert',
    'gpt',
    'sentiment',
    'sentimento',
    'classification',
    'classificacao',
    'ner',
    'entities',
    'entidades',
    'question answering',
    'qa',
    'text generation',
    'geracao de texto',
    'translation',
    'traducao',
    'summarization',
    'sumarizacao',
    'embedding'
  ],

  performance: {
    speed: 5,
    memory: 5,
    cpuIntensive: true,
    gpuAccelerated: true,
    scalability: 6
  },

  // ==================== REGRAS DE SCORING ====================
  scoring: {
    baseScore: 0.85,
    rules: [
      {
        condition: 'keywords include ["sentiment", "sentimento", "analise"]',
        adjustment: 0.10,
        description: 'Excelente para análise de sentimento'
      },
      {
        condition: 'keywords include ["classification", "classificacao", "categorize"]',
        adjustment: 0.10,
        description: 'Perfeito para classificação de texto'
      },
      {
        condition: 'keywords include ["ner", "entities", "entidades", "extract"]',
        adjustment: 0.10,
        description: 'Ideal para NER'
      },
      {
        condition: 'keywords include ["question", "qa", "answer", "responder"]',
        adjustment: 0.10,
        description: 'Ótimo para Q&A'
      },
      {
        condition: 'keywords include ["generate", "gerar", "gpt", "completion"]',
        adjustment: 0.10,
        description: 'Poderoso para geração de texto'
      },
      {
        condition: 'keywords include ["translation", "traducao", "translate"]',
        adjustment: 0.08,
        description: 'Bom para tradução'
      },
      {
        condition: 'keywords include ["summarize", "sumarizar", "resumo", "summary"]',
        adjustment: 0.08,
        description: 'Eficiente para sumarização'
      },
      {
        condition: 'keywords include ["regex", "simple text", "basic"]',
        adjustment: -0.40,
        description: 'Texto simples não precisa de transformers'
      },
      {
        condition: 'keywords include ["tabular", "numeric", "numbers only"]',
        adjustment: -0.60,
        description: 'Não é para dados tabulares'
      },
      {
        condition: 'keywords include ["real-time", "milliseconds"] AND NOT include ["gpu"]',
        adjustment: -0.30,
        description: 'Modelos grandes são lentos sem GPU'
      }
    ]
  },

  // ==================== CONFIGURAÇÕES ADICIONAIS ====================
  config: {
    maxRetries: 2,
    timeout: 60000, // 60 segundos
    cacheable: true,
    requiresAuth: false,
    rateLimit: null
  },

  // ==================== ALTERNATIVAS ====================
  alternatives: [
    {
      name: 'spaCy',
      when: 'NLP tradicional, pipeline completo, performance crítica',
      reason: 'spaCy é mais rápido para NLP tradicional'
    },
    {
      name: 'NLTK',
      when: 'Processamento básico, tokenização, stemming',
      reason: 'NLTK é mais leve para tarefas básicas'
    },
    {
      name: 'OpenAI API',
      when: 'GPT-4, GPT-3.5, modelos mais poderosos',
      reason: 'OpenAI tem modelos mais avançados (mas pago)'
    },
    {
      name: 'scikit-learn',
      when: 'ML clássico, TF-IDF, CountVectorizer',
      reason: 'sklearn é suficiente para ML tradicional'
    }
  ],

  // ==================== DOCUMENTAÇÃO ====================
  documentation: {
    official: 'https://huggingface.co/docs/transformers/',
    examples: 'https://huggingface.co/docs/transformers/task_summary',
    apiReference: 'https://huggingface.co/docs/transformers/main_classes/pipelines'
  },

  // ==================== TROUBLESHOOTING ====================
  commonIssues: [
    {
      issue: 'Out of Memory (OOM)',
      solution: 'Reduzir max_length, usar modelo menor, ou processar em batches menores',
      code: `# Reduzir max_length
result = classifier(text, max_length=256, truncation=True)

# Ou usar modelo menor
classifier = pipeline("sentiment-analysis", model="distilbert-base-uncased")`
    },
    {
      issue: 'Modelo lento (CPU)',
      solution: 'Usar GPU com device=0 ou modelo distilled (menor)',
      code: `# Usar GPU
classifier = pipeline("sentiment-analysis", device=0)

# Ou usar modelo distilled (mais rápido)
classifier = pipeline("sentiment-analysis", model="distilbert-base-uncased")`
    },
    {
      issue: 'Token sequence too long',
      solution: 'Adicionar truncation=True e limitar max_length',
      code: `result = model(text, truncation=True, max_length=512)`
    },
    {
      issue: 'Download de modelo demora muito',
      solution: 'Cache modelos ou baixar manualmente',
      code: `# Modelos são cachados automaticamente em ~/.cache/huggingface/
# Para forçar cache:
from transformers import AutoModel
model = AutoModel.from_pretrained("bert-base-uncased", cache_dir="./models")`
    }
  ],

  // ==================== BEST PRACTICES ====================
  bestPractices: [
    'Use pipeline() para tarefas padrão (mais simples)',
    'Especifique modelo adequado para idioma e tarefa',
    'Sempre adicione truncation=True para textos longos',
    'Configure max_length para evitar OOM',
    'Use modelos distilled para prototipagem (mais rápidos)',
    'Cache modelos localmente após primeiro download',
    'Use GPU (device=0) quando disponível',
    'Processe em batch para melhor performance'
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

export default TransformersModule;
