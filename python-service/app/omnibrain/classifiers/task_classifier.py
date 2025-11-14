"""
============================================
SYNCADS OMNIBRAIN - TASK CLASSIFIER
============================================
Classificador Inteligente de Tarefas com ML

Responsável por:
- Analisar comando do usuário
- Detectar tipo de tarefa automaticamente
- Analisar arquivos anexados
- Extrair contexto e intenção
- Aprender com histórico
- Classificação multimodal

Autor: SyncAds AI Team
Versão: 1.0.0
============================================
"""

import logging
import re
from dataclasses import dataclass
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger("omnibrain.classifier")


# ============================================
# PATTERNS & KEYWORDS
# ============================================


class TaskPatterns:
    """Padrões e palavras-chave para cada tipo de tarefa"""

    IMAGE_PROCESSING = {
        "keywords": [
            "image",
            "imagem",
            "foto",
            "picture",
            "photo",
            "png",
            "jpg",
            "jpeg",
            "resize",
            "redimensionar",
            "crop",
            "cortar",
            "filter",
            "filtro",
            "optimize",
            "otimizar",
            "compress",
            "comprimir",
            "thumbnail",
            "miniatura",
            "banner",
            "logo",
            "watermark",
            "marca d'água",
            "remove background",
            "remover fundo",
            "blur",
            "sharpen",
            "brightness",
            "contrast",
            "grayscale",
            "sepia",
            "rotate",
            "flip",
            "mirror",
        ],
        "patterns": [
            r"otimiz.*imag",
            r"redimension.*foto",
            r"criar.*banner",
            r"gerar.*logo",
            r"remove.*fundo",
            r"aplicar.*filtro",
        ],
        "file_extensions": [
            ".jpg",
            ".jpeg",
            ".png",
            ".gif",
            ".bmp",
            ".webp",
            ".svg",
            ".heic",
        ],
        "weight": 1.0,
    }

    VIDEO_PROCESSING = {
        "keywords": [
            "video",
            "vídeo",
            "movie",
            "filme",
            "clip",
            "mp4",
            "avi",
            "mov",
            "edit",
            "editar",
            "cut",
            "cortar",
            "trim",
            "render",
            "renderizar",
            "convert",
            "converter",
            "transcode",
            "subtitle",
            "legenda",
            "merge",
            "mesclar",
            "split",
            "dividir",
            "scene",
            "cena",
            "fps",
            "resolution",
            "resolução",
            "codec",
            "compress video",
        ],
        "patterns": [
            r"editar.*v[íi]deo",
            r"cortar.*cena",
            r"adicionar.*legenda",
            r"converter.*mp4",
            r"renderizar.*v[íi]deo",
        ],
        "file_extensions": [".mp4", ".avi", ".mov", ".mkv", ".flv", ".wmv", ".webm"],
        "weight": 1.0,
    }

    AUDIO_PROCESSING = {
        "keywords": [
            "audio",
            "áudio",
            "sound",
            "som",
            "music",
            "música",
            "voice",
            "voz",
            "mp3",
            "wav",
            "transcribe",
            "transcrever",
            "speech to text",
            "text to speech",
            "tts",
            "stt",
            "noise reduction",
            "redução de ruído",
            "equalize",
            "equalizar",
            "normalize",
            "normalizar",
            "pitch",
            "tempo",
            "reverb",
            "echo",
            "fade",
            "mix",
            "mixar",
        ],
        "patterns": [
            r"transcrever.*[áa]udio",
            r"converter.*texto",
            r"reduz.*ru[íi]do",
            r"extrair.*voz",
            r"separar.*instrumento",
        ],
        "file_extensions": [".mp3", ".wav", ".flac", ".ogg", ".m4a", ".aac"],
        "weight": 1.0,
    }

    WEB_SCRAPING = {
        "keywords": [
            "scrape",
            "scraping",
            "extract",
            "extrair",
            "crawl",
            "rastrear",
            "website",
            "site",
            "url",
            "http",
            "https",
            "www",
            "web page",
            "página web",
            "html",
            "download",
            "baixar",
            "fetch",
            "buscar",
            "dados do site",
            "informações do site",
            "copiar site",
            "clonar site",
            "mirror",
            "espelho",
        ],
        "patterns": [
            r"extrair.*dados.*site",
            r"fazer.*scraping",
            r"copiar.*p[áa]gina",
            r"baixar.*conte[úu]do.*url",
            r"raspar.*informa[çc][õo]es",
            r"https?://\S+",
        ],
        "file_extensions": [".html", ".htm"],
        "weight": 1.2,
    }

    ECOMMERCE_OPERATION = {
        "keywords": [
            "shopify",
            "woocommerce",
            "vtex",
            "magento",
            "prestashop",
            "store",
            "loja",
            "product",
            "produto",
            "theme",
            "tema",
            "cart",
            "carrinho",
            "checkout",
            "payment",
            "pagamento",
            "order",
            "pedido",
            "inventory",
            "estoque",
            "price",
            "preço",
            "discount",
            "desconto",
            "coupon",
            "cupom",
            "shipping",
            "frete",
            "collection",
            "coleção",
            "category",
            "categoria",
        ],
        "patterns": [
            r"criar.*loja",
            r"gerar.*tema.*shopify",
            r"adicionar.*produto",
            r"configurar.*pagamento",
            r"integrar.*shopify",
            r"clonar.*loja",
        ],
        "file_extensions": [".liquid"],
        "weight": 1.3,
    }

    THEME_GENERATION = {
        "keywords": [
            "theme",
            "tema",
            "template",
            "design",
            "layout",
            "css",
            "stylesheet",
            "frontend",
            "ui",
            "interface",
            "sections",
            "seções",
            "blocks",
            "blocos",
            "liquid",
            "html",
            "javascript",
            "responsive",
            "responsivo",
            "mobile",
            "desktop",
            "colors",
            "cores",
            "palette",
            "paleta",
            "typography",
            "tipografia",
            "fonts",
            "fontes",
        ],
        "patterns": [
            r"criar.*tema",
            r"gerar.*design",
            r"desenvolver.*layout",
            r"construir.*frontend",
            r"design.*responsivo",
        ],
        "file_extensions": [".css", ".scss", ".sass", ".less", ".liquid"],
        "weight": 1.2,
    }

    PDF_GENERATION = {
        "keywords": [
            "pdf",
            "document",
            "documento",
            "report",
            "relatório",
            "relatorio",
            "invoice",
            "fatura",
            "receipt",
            "recibo",
            "contract",
            "contrato",
            "generate pdf",
            "gerar pdf",
            "create document",
            "criar documento",
            "export pdf",
            "exportar pdf",
            "print",
            "imprimir",
        ],
        "patterns": [
            r"gerar.*pdf",
            r"criar.*relat[óo]rio",
            r"exportar.*documento",
            r"pdf.*com.*dados",
        ],
        "file_extensions": [".pdf"],
        "weight": 1.0,
    }

    DATA_ANALYSIS = {
        "keywords": [
            "analyze",
            "analisar",
            "analysis",
            "análise",
            "data",
            "dados",
            "statistics",
            "estatística",
            "metrics",
            "métricas",
            "kpi",
            "chart",
            "gráfico",
            "graph",
            "plot",
            "visualize",
            "visualizar",
            "dashboard",
            "report",
            "relatório",
            "insight",
            "trend",
            "tendência",
            "correlation",
            "correlação",
            "regression",
            "regressão",
            "csv",
            "excel",
            "spreadsheet",
            "planilha",
        ],
        "patterns": [
            r"analis.*dados",
            r"criar.*gr[áa]fico",
            r"visualiz.*dados",
            r"calcul.*estat[íi]stica",
        ],
        "file_extensions": [".csv", ".xlsx", ".xls", ".json", ".parquet"],
        "weight": 1.0,
    }

    ML_INFERENCE = {
        "keywords": [
            "predict",
            "prever",
            "prediction",
            "previsão",
            "model",
            "modelo",
            "train",
            "treinar",
            "classify",
            "classificar",
            "detect",
            "detectar",
            "recognize",
            "reconhecer",
            "ai",
            "ia",
            "machine learning",
            "ml",
            "deep learning",
            "neural network",
            "rede neural",
            "tensorflow",
            "pytorch",
            "transformer",
            "bert",
            "gpt",
            "stable diffusion",
        ],
        "patterns": [
            r"prever.*com.*modelo",
            r"classificar.*usando.*ia",
            r"detectar.*com.*ml",
            r"treinar.*modelo",
        ],
        "file_extensions": [".pt", ".pth", ".h5", ".onnx", ".pkl"],
        "weight": 1.1,
    }

    DESIGN_GENERATION = {
        "keywords": [
            "design",
            "criar arte",
            "gerar imagem",
            "generate image",
            "draw",
            "desenhar",
            "illustration",
            "ilustração",
            "graphic",
            "gráfico",
            "vector",
            "vetor",
            "svg",
            "mockup",
            "prototype",
            "protótipo",
            "wireframe",
            "sketch",
            "concept art",
            "arte conceitual",
        ],
        "patterns": [
            r"criar.*design",
            r"gerar.*arte",
            r"desenhar.*ilustra[çc][ãa]o",
            r"design.*gr[áa]fico",
        ],
        "file_extensions": [".ai", ".psd", ".sketch", ".fig"],
        "weight": 1.0,
    }

    MARKETING_CONTENT = {
        "keywords": [
            "ad",
            "anúncio",
            "advertisement",
            "campaign",
            "campanha",
            "copy",
            "copywriting",
            "marketing",
            "landing page",
            "funnel",
            "funil",
            "email marketing",
            "newsletter",
            "social media",
            "redes sociais",
            "post",
            "content",
            "conteúdo",
            "seo",
            "meta description",
            "meta tags",
            "headline",
            "título",
            "cta",
            "call to action",
            "engagement",
            "conversion",
        ],
        "patterns": [
            r"criar.*an[úu]ncio",
            r"gerar.*copy",
            r"campanha.*marketing",
            r"landing.*page",
            r"funil.*vendas",
        ],
        "file_extensions": [],
        "weight": 1.0,
    }

    CODE_EXECUTION = {
        "keywords": [
            "execute",
            "executar",
            "run",
            "rodar",
            "code",
            "código",
            "script",
            "program",
            "programa",
            "function",
            "função",
            "python",
            "javascript",
            "nodejs",
            "compile",
            "compilar",
            "debug",
            "depurar",
            "test",
            "testar",
        ],
        "patterns": [
            r"executar.*c[óo]digo",
            r"rodar.*script",
            r"run.*python",
            r"executar.*fun[çc][ãa]o",
        ],
        "file_extensions": [".py", ".js", ".ts", ".java", ".cpp", ".c"],
        "weight": 1.0,
    }

    AUTOMATION = {
        "keywords": [
            "automate",
            "automatizar",
            "automation",
            "automação",
            "workflow",
            "fluxo",
            "task",
            "tarefa",
            "schedule",
            "agendar",
            "cron",
            "batch",
            "lote",
            "bulk",
            "em massa",
            "macro",
            "repeat",
            "repetir",
            "loop",
            "iterate",
            "iterar",
        ],
        "patterns": [
            r"automatizar.*processo",
            r"agendar.*tarefa",
            r"executar.*em.*massa",
            r"criar.*workflow",
        ],
        "file_extensions": [],
        "weight": 1.0,
    }


@dataclass
class ClassificationResult:
    """Resultado da classificação"""

    task_type: str
    confidence: float
    reasoning: str
    alternative_types: List[Tuple[str, float]]
    signals_detected: Dict[str, Any]
    multimodal_analysis: Optional[Dict[str, Any]] = None


class TaskClassifier:
    """
    Classificador Inteligente de Tarefas

    Utiliza múltiplos sinais para classificar:
    1. Análise de texto (keywords, patterns)
    2. Análise de arquivos (extensões, tipos MIME)
    3. Análise de contexto
    4. Histórico de execuções
    5. Machine Learning (quando disponível)
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.patterns = TaskPatterns()
        self.min_confidence = self.config.get("min_confidence", 0.6)
        self.enable_ml = self.config.get("enable_ml", False)

        # Histórico para aprendizado
        self.classification_history: List[Dict[str, Any]] = []

        logger.info("TaskClassifier initialized")

    async def classify(self, task_input) -> ClassificationResult:
        """
        Classifica a tarefa

        Args:
            task_input: TaskInput object

        Returns:
            ClassificationResult com tipo e confiança
        """
        from ..core.engine import TaskType

        logger.debug(f"Classifying task: {task_input.command[:50]}...")

        # Coletar sinais
        signals = self._collect_signals(task_input)

        # Calcular scores para cada tipo
        scores = self._calculate_scores(signals)

        # Ordenar por score
        sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)

        # Pegar top 1
        best_type, best_score = sorted_scores[0]

        # Alternativas (top 3)
        alternatives = [(t, s) for t, s in sorted_scores[1:4]]

        # Gerar reasoning
        reasoning = self._generate_reasoning(best_type, signals, best_score)

        # Análise multimodal (se houver arquivos)
        multimodal = None
        if task_input.files:
            multimodal = await self._analyze_multimodal(task_input.files)

        result = ClassificationResult(
            task_type=best_type,
            confidence=best_score,
            reasoning=reasoning,
            alternative_types=alternatives,
            signals_detected=signals,
            multimodal_analysis=multimodal,
        )

        # Salvar no histórico
        self._save_to_history(task_input, result)

        logger.info(f"Task classified as {best_type} (confidence: {best_score:.2%})")

        # Converter string para TaskType enum
        try:
            return getattr(TaskType, best_type.upper())
        except AttributeError:
            return TaskType.UNKNOWN

    def _collect_signals(self, task_input) -> Dict[str, Any]:
        """Coleta todos os sinais disponíveis"""
        command_lower = task_input.command.lower()

        signals = {
            "text_keywords": [],
            "text_patterns": [],
            "file_extensions": [],
            "context_hints": [],
            "metadata_hints": [],
            "url_detected": False,
            "code_detected": False,
        }

        # Detectar keywords
        for task_type, data in vars(TaskPatterns).items():
            if task_type.startswith("_"):
                continue
            keywords = data.get("keywords", [])
            for kw in keywords:
                if kw in command_lower:
                    signals["text_keywords"].append((task_type, kw))

        # Detectar patterns
        for task_type, data in vars(TaskPatterns).items():
            if task_type.startswith("_"):
                continue
            patterns = data.get("patterns", [])
            for pattern in patterns:
                if re.search(pattern, command_lower):
                    signals["text_patterns"].append((task_type, pattern))

        # Detectar extensões de arquivos
        if task_input.files:
            for file_info in task_input.files:
                filename = file_info.get("filename", "")
                ext = "." + filename.split(".")[-1] if "." in filename else ""
                signals["file_extensions"].append(ext)

        # Detectar URLs
        if re.search(r"https?://\S+", task_input.command):
            signals["url_detected"] = True

        # Detectar código
        if any(
            x in command_lower for x in ["def ", "import ", "function ", "class ", "{"]
        ):
            signals["code_detected"] = True

        # Context hints
        if task_input.context:
            for key, value in task_input.context.items():
                signals["context_hints"].append((key, value))

        # Metadata hints
        if task_input.metadata:
            for key, value in task_input.metadata.items():
                signals["metadata_hints"].append((key, value))

        return signals

    def _calculate_scores(self, signals: Dict[str, Any]) -> Dict[str, float]:
        """Calcula score para cada tipo de tarefa"""
        scores = {
            "IMAGE_PROCESSING": 0.0,
            "VIDEO_PROCESSING": 0.0,
            "AUDIO_PROCESSING": 0.0,
            "WEB_SCRAPING": 0.0,
            "ECOMMERCE_OPERATION": 0.0,
            "THEME_GENERATION": 0.0,
            "PDF_GENERATION": 0.0,
            "DATA_ANALYSIS": 0.0,
            "ML_INFERENCE": 0.0,
            "DESIGN_GENERATION": 0.0,
            "MARKETING_CONTENT": 0.0,
            "CODE_EXECUTION": 0.0,
            "AUTOMATION": 0.0,
        }

        # Keywords (peso 1.0)
        for task_type, keyword in signals["text_keywords"]:
            scores[task_type] = scores.get(task_type, 0) + 0.1

        # Patterns (peso 2.0)
        for task_type, pattern in signals["text_patterns"]:
            scores[task_type] = scores.get(task_type, 0) + 0.2

        # File extensions (peso 3.0)
        for ext in signals["file_extensions"]:
            for task_type, data in vars(TaskPatterns).items():
                if task_type.startswith("_"):
                    continue
                if ext in data.get("file_extensions", []):
                    scores[task_type] = scores.get(task_type, 0) + 0.3

        # URL detected
        if signals["url_detected"]:
            scores["WEB_SCRAPING"] += 0.4

        # Code detected
        if signals["code_detected"]:
            scores["CODE_EXECUTION"] += 0.3

        # Aplicar pesos das tarefas
        for task_type, data in vars(TaskPatterns).items():
            if task_type.startswith("_") or task_type not in scores:
                continue
            weight = data.get("weight", 1.0)
            scores[task_type] *= weight

        # Normalizar scores (0-1)
        max_score = max(scores.values()) if scores else 1.0
        if max_score > 0:
            scores = {k: v / max_score for k, v in scores.items()}

        return scores

    def _generate_reasoning(
        self, task_type: str, signals: Dict[str, Any], score: float
    ) -> str:
        """Gera explicação da decisão"""
        reasons = []

        # Keywords
        keywords = [kw for tt, kw in signals["text_keywords"] if tt == task_type]
        if keywords:
            reasons.append(f"Keywords detected: {', '.join(keywords[:3])}")

        # Patterns
        patterns = [p for tt, p in signals["text_patterns"] if tt == task_type]
        if patterns:
            reasons.append(f"Patterns matched: {len(patterns)}")

        # Files
        if signals["file_extensions"]:
            reasons.append(f"Files: {', '.join(signals['file_extensions'][:3])}")

        # URL
        if signals["url_detected"] and task_type == "WEB_SCRAPING":
            reasons.append("URL detected in command")

        # Score
        reasons.append(f"Confidence: {score:.1%}")

        return " | ".join(reasons)

    async def _analyze_multimodal(self, files: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analisa arquivos para classificação multimodal"""
        analysis = {
            "total_files": len(files),
            "file_types": {},
            "total_size": 0,
        }

        for file_info in files:
            filename = file_info.get("filename", "")
            size = file_info.get("size", 0)
            mime_type = file_info.get("mime_type", "")

            # Contabilizar tipo
            ext = "." + filename.split(".")[-1] if "." in filename else "unknown"
            analysis["file_types"][ext] = analysis["file_types"].get(ext, 0) + 1
            analysis["total_size"] += size

        return analysis

    def _save_to_history(self, task_input, result: ClassificationResult):
        """Salva classificação no histórico para ML futuro"""
        self.classification_history.append(
            {
                "command": task_input.command,
                "classified_as": result.task_type,
                "confidence": result.confidence,
                "timestamp": None,  # datetime.now() se quiser
            }
        )

        # Manter apenas últimas 1000
        if len(self.classification_history) > 1000:
            self.classification_history = self.classification_history[-1000:]

    def get_statistics(self) -> Dict[str, Any]:
        """Retorna estatísticas de classificações"""
        if not self.classification_history:
            return {"total": 0}

        from collections import Counter

        types = [h["classified_as"] for h in self.classification_history]
        counter = Counter(types)

        return {
            "total": len(self.classification_history),
            "by_type": dict(counter),
            "avg_confidence": sum(h["confidence"] for h in self.classification_history)
            / len(self.classification_history),
        }
