"""
============================================
SYNCADS OMNIBRAIN - LIBRARY SELECTOR
============================================
Motor de Decisão Inteligente para Seleção de Bibliotecas

Responsável por:
- Analisar tipo de tarefa
- Avaliar bibliotecas disponíveis
- Calcular scores com pesos
- Selecionar biblioteca primária
- Criar lista de fallbacks
- Definir estratégias híbridas
- Otimizar para performance
- Considerar trade-offs

Autor: SyncAds AI Team
Versão: 1.0.0 → 1.5.0 (✅ Integrado com Profile Loader)
============================================
"""

import logging
from typing import Any, Dict, List, Optional, Tuple

# ✅ CORREÇÃO: Integrar profile loader
from ..library_profiles import LibraryProfile, get_loader, get_profile

# ✅ CORREÇÃO: Usar types compartilhados
from ..types import (
    ExecutionMode,
    ExecutionPlan,
    LibraryCandidate,
    Priority,
    TaskInput,
    TaskType,
)

logger = logging.getLogger("omnibrain.library_selector")


# ============================================
# LIBRARY DATABASE
# ============================================


class LibraryDatabase:
    """
    Base de dados completa de todas as bibliotecas disponíveis

    Para cada biblioteca:
    - Nome
    - Capacidades
    - Performance
    - Facilidade de uso
    - Confiabilidade
    - Trade-offs
    - Casos de uso ideais
    """

    # ==========================================
    # IMAGE PROCESSING
    # ==========================================

    IMAGE_LIBRARIES = {
        "Pillow": {
            "capabilities": ["resize", "crop", "rotate", "filter", "format_conversion"],
            "performance": 7,  # 1-10
            "ease_of_use": 9,
            "reliability": 9,
            "speed": 7,
            "memory_efficient": 8,
            "pros": [
                "Fácil de usar",
                "Bem documentado",
                "Amplamente suportado",
                "Formato universal",
            ],
            "cons": ["Não é o mais rápido", "Limitado para operações complexas"],
            "best_for": ["resize", "crop", "basic_filters", "thumbnails"],
            "avoid_for": ["huge_images", "batch_processing", "advanced_cv"],
            "weight": 1.0,
            "priority": 1,
        },
        "opencv-python": {
            "capabilities": [
                "resize",
                "crop",
                "rotate",
                "filter",
                "edge_detection",
                "face_detection",
                "object_detection",
                "video_processing",
            ],
            "performance": 9,
            "ease_of_use": 6,
            "reliability": 9,
            "speed": 9,
            "memory_efficient": 7,
            "pros": [
                "Muito rápido",
                "Computer vision completo",
                "Muitos algoritmos",
                "GPU support",
            ],
            "cons": ["Curva de aprendizado", "API complexa", "Dependências pesadas"],
            "best_for": [
                "computer_vision",
                "video",
                "real_time",
                "advanced_processing",
            ],
            "avoid_for": ["simple_tasks", "quick_prototypes"],
            "weight": 1.2,
            "priority": 2,
        },
        "pyvips": {
            "capabilities": ["resize", "crop", "format_conversion", "batch_processing"],
            "performance": 10,
            "ease_of_use": 7,
            "reliability": 8,
            "speed": 10,
            "memory_efficient": 10,
            "pros": [
                "Extremamente rápido",
                "Muito eficiente em memória",
                "Ideal para batch",
                "Streaming processing",
            ],
            "cons": [
                "Menos conhecido",
                "Documentação limitada",
                "Menos features que OpenCV",
            ],
            "best_for": ["large_images", "batch_processing", "memory_constrained"],
            "avoid_for": ["computer_vision", "advanced_filters"],
            "weight": 1.1,
            "priority": 3,
        },
        "rembg": {
            "capabilities": ["remove_background"],
            "performance": 7,
            "ease_of_use": 10,
            "reliability": 8,
            "speed": 6,
            "memory_efficient": 6,
            "pros": ["Muito fácil de usar", "Resultados bons", "One-liner"],
            "cons": [
                "Só remove background",
                "Requer modelo ML",
                "Lento para muitas imagens",
            ],
            "best_for": ["remove_background"],
            "avoid_for": ["anything_else"],
            "weight": 1.0,
            "priority": 1,
        },
        "scikit-image": {
            "capabilities": ["filters", "segmentation", "morphology", "restoration"],
            "performance": 8,
            "ease_of_use": 7,
            "reliability": 9,
            "speed": 7,
            "memory_efficient": 7,
            "pros": ["Científico", "Muitos algoritmos", "Bem testado"],
            "cons": ["API científica", "Não tão rápido"],
            "best_for": ["scientific", "research", "advanced_filters"],
            "avoid_for": ["production", "real_time"],
            "weight": 0.9,
            "priority": 4,
        },
        "wand": {
            "capabilities": ["resize", "effects", "distortions", "compositing"],
            "performance": 8,
            "ease_of_use": 8,
            "reliability": 8,
            "speed": 8,
            "memory_efficient": 7,
            "pros": ["ImageMagick binding", "Muitos efeitos", "Pythonic API"],
            "cons": ["Requer ImageMagick instalado"],
            "best_for": ["effects", "artistic", "compositing"],
            "avoid_for": ["computer_vision"],
            "weight": 0.9,
            "priority": 5,
        },
    }

    # ==========================================
    # VIDEO PROCESSING
    # ==========================================

    VIDEO_LIBRARIES = {
        "moviepy": {
            "capabilities": [
                "cut",
                "concatenate",
                "effects",
                "audio_sync",
                "rendering",
            ],
            "performance": 6,
            "ease_of_use": 9,
            "reliability": 8,
            "speed": 5,
            "memory_efficient": 6,
            "pros": ["Muito fácil", "API intuitiva", "Muitos efeitos"],
            "cons": ["Lento", "Alto uso de memória", "Não ideal para produção"],
            "best_for": ["prototyping", "simple_edits", "learning"],
            "avoid_for": ["production", "real_time", "long_videos"],
            "weight": 1.0,
            "priority": 1,
        },
        "ffmpeg-python": {
            "capabilities": ["encoding", "decoding", "streaming", "filters", "muxing"],
            "performance": 10,
            "ease_of_use": 6,
            "reliability": 9,
            "speed": 10,
            "memory_efficient": 9,
            "pros": ["Extremamente rápido", "Produção ready", "Todos os formatos"],
            "cons": ["API complexa", "Requer ffmpeg"],
            "best_for": ["production", "encoding", "streaming", "professional"],
            "avoid_for": ["quick_prototypes"],
            "weight": 1.3,
            "priority": 2,
        },
        "pyav": {
            "capabilities": ["decoding", "encoding", "streaming", "low_level"],
            "performance": 10,
            "ease_of_use": 5,
            "reliability": 9,
            "speed": 10,
            "memory_efficient": 9,
            "pros": ["FFmpeg binding direto", "Muito rápido", "Controle total"],
            "cons": ["API complexa", "Curva de aprendizado alta"],
            "best_for": ["low_level", "performance_critical"],
            "avoid_for": ["beginners", "simple_tasks"],
            "weight": 1.2,
            "priority": 3,
        },
        "scenedetect": {
            "capabilities": ["scene_detection", "shot_boundary"],
            "performance": 8,
            "ease_of_use": 9,
            "reliability": 9,
            "speed": 7,
            "memory_efficient": 8,
            "pros": ["Especializado", "Muito bom no que faz", "Fácil de usar"],
            "cons": ["Só detecção de cenas"],
            "best_for": ["scene_detection"],
            "avoid_for": ["editing", "encoding"],
            "weight": 1.0,
            "priority": 1,
        },
    }

    # ==========================================
    # WEB SCRAPING
    # ==========================================

    SCRAPING_LIBRARIES = {
        "playwright": {
            "capabilities": [
                "javascript_rendering",
                "interaction",
                "screenshots",
                "pdf_generation",
                "network_interception",
            ],
            "performance": 8,
            "ease_of_use": 8,
            "reliability": 9,
            "speed": 7,
            "memory_efficient": 6,
            "pros": ["JavaScript completo", "Multi-browser", "Moderno", "Bem mantido"],
            "cons": ["Mais lento que requests", "Usa mais recursos"],
            "best_for": ["spa", "javascript_heavy", "interactive", "modern_sites"],
            "avoid_for": ["simple_html", "static_pages"],
            "weight": 1.3,
            "priority": 1,
        },
        "playwright-stealth": {
            "capabilities": ["stealth", "anti_detection"],
            "performance": 8,
            "ease_of_use": 8,
            "reliability": 8,
            "speed": 7,
            "memory_efficient": 6,
            "pros": ["Evita detecção", "Bypass cloudflare"],
            "cons": ["Requer playwright"],
            "best_for": ["protected_sites", "anti_bot"],
            "avoid_for": ["simple_scraping"],
            "weight": 1.4,
            "priority": 1,
        },
        "requests": {
            "capabilities": ["http_requests", "simple_scraping"],
            "performance": 10,
            "ease_of_use": 10,
            "reliability": 10,
            "speed": 10,
            "memory_efficient": 10,
            "pros": ["Muito rápido", "Simples", "Confiável", "Leve"],
            "cons": ["Não processa JavaScript", "Só HTML estático"],
            "best_for": ["static_html", "apis", "simple_scraping"],
            "avoid_for": ["javascript_sites", "spa"],
            "weight": 1.0,
            "priority": 1,
        },
        "beautifulsoup4": {
            "capabilities": ["html_parsing", "xml_parsing", "extraction"],
            "performance": 8,
            "ease_of_use": 9,
            "reliability": 10,
            "speed": 8,
            "memory_efficient": 9,
            "pros": ["Fácil de usar", "Pythonic", "Robusto"],
            "cons": ["Só parsing (precisa requests/httpx)"],
            "best_for": ["html_parsing", "extraction"],
            "avoid_for": ["javascript"],
            "weight": 1.0,
            "priority": 1,
        },
        "scrapy": {
            "capabilities": ["crawling", "scraping", "pipelines", "middleware"],
            "performance": 9,
            "ease_of_use": 6,
            "reliability": 9,
            "speed": 9,
            "memory_efficient": 8,
            "pros": ["Framework completo", "Escalável", "Async"],
            "cons": ["Complexo", "Overkill para tarefas simples"],
            "best_for": ["large_crawls", "production", "complex_projects"],
            "avoid_for": ["simple_scraping", "quick_scripts"],
            "weight": 1.1,
            "priority": 3,
        },
        "cloudscraper": {
            "capabilities": ["cloudflare_bypass"],
            "performance": 8,
            "ease_of_use": 9,
            "reliability": 7,
            "speed": 8,
            "memory_efficient": 9,
            "pros": ["Bypass cloudflare", "Drop-in requests replacement"],
            "cons": ["Pode quebrar", "Cloudflare sempre evolui"],
            "best_for": ["cloudflare_protected"],
            "avoid_for": ["no_cloudflare"],
            "weight": 1.2,
            "priority": 2,
        },
        "trafilatura": {
            "capabilities": ["article_extraction", "content_extraction"],
            "performance": 9,
            "ease_of_use": 10,
            "reliability": 9,
            "speed": 9,
            "memory_efficient": 9,
            "pros": ["Extração limpa", "Rápido", "Específico para artigos"],
            "cons": ["Só artigos/conteúdo"],
            "best_for": ["articles", "news", "blogs", "content"],
            "avoid_for": ["structured_data", "tables"],
            "weight": 1.0,
            "priority": 1,
        },
    }

    # ==========================================
    # E-COMMERCE
    # ==========================================

    ECOMMERCE_LIBRARIES = {
        "shopify-python-api": {
            "capabilities": [
                "products",
                "themes",
                "orders",
                "customers",
                "all_resources",
            ],
            "performance": 8,
            "ease_of_use": 8,
            "reliability": 9,
            "speed": 7,
            "memory_efficient": 8,
            "pros": ["API oficial", "Completa", "Bem suportada"],
            "cons": ["Rate limits", "Async limitado"],
            "best_for": ["shopify", "official_api"],
            "avoid_for": ["other_platforms"],
            "weight": 1.3,
            "priority": 1,
        },
        "woocommerce": {
            "capabilities": ["products", "orders", "customers"],
            "performance": 7,
            "ease_of_use": 8,
            "reliability": 8,
            "speed": 7,
            "memory_efficient": 8,
            "pros": ["WooCommerce completo"],
            "cons": ["WordPress dependency"],
            "best_for": ["woocommerce"],
            "avoid_for": ["other_platforms"],
            "weight": 1.0,
            "priority": 1,
        },
    }

    # ==========================================
    # PDF
    # ==========================================

    PDF_LIBRARIES = {
        "reportlab": {
            "capabilities": ["pdf_generation", "layouts", "graphics"],
            "performance": 8,
            "ease_of_use": 7,
            "reliability": 9,
            "speed": 8,
            "memory_efficient": 8,
            "pros": ["Muito poderoso", "Controle total", "Produção ready"],
            "cons": ["API complexa", "Curva de aprendizado"],
            "best_for": ["complex_pdfs", "professional", "layouts"],
            "avoid_for": ["simple_pdfs"],
            "weight": 1.2,
            "priority": 1,
        },
        "fpdf": {
            "capabilities": ["simple_pdf_generation"],
            "performance": 9,
            "ease_of_use": 10,
            "reliability": 8,
            "speed": 9,
            "memory_efficient": 9,
            "pros": ["Muito simples", "Rápido", "Leve"],
            "cons": ["Features limitadas"],
            "best_for": ["simple_pdfs", "quick_reports"],
            "avoid_for": ["complex_layouts"],
            "weight": 1.0,
            "priority": 2,
        },
        "PyPDF2": {
            "capabilities": ["pdf_manipulation", "merge", "split"],
            "performance": 7,
            "ease_of_use": 8,
            "reliability": 7,
            "speed": 7,
            "memory_efficient": 7,
            "pros": ["Manipulação de PDFs existentes"],
            "cons": ["Bugs ocasionais", "Manutenção irregular"],
            "best_for": ["pdf_manipulation"],
            "avoid_for": ["generation_from_scratch"],
            "weight": 0.8,
            "priority": 3,
        },
        "pdfplumber": {
            "capabilities": ["pdf_extraction", "tables", "text"],
            "performance": 8,
            "ease_of_use": 9,
            "reliability": 9,
            "speed": 7,
            "memory_efficient": 8,
            "pros": ["Extração excelente", "Tabelas", "Layout preservation"],
            "cons": ["Só extração"],
            "best_for": ["pdf_extraction", "tables"],
            "avoid_for": ["generation"],
            "weight": 1.1,
            "priority": 1,
        },
    }


@dataclass
class LibraryScore:
    """Score de uma biblioteca para uma tarefa"""

    name: str
    total_score: float
    capability_score: float
    performance_score: float
    ease_score: float
    reliability_score: float
    context_score: float
    reasoning: List[str]


class LibrarySelector:
    """
    Motor de Decisão para Seleção de Bibliotecas

    Algoritmo de seleção:
    1. Identificar bibliotecas candidatas para o tipo de tarefa
    2. Calcular score baseado em múltiplos fatores
    3. Aplicar pesos e contexto
    4. Ordenar por score
    5. Selecionar top N
    6. Criar plano de fallback
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.db = LibraryDatabase()

        # ✅ CORREÇÃO: Integrar profile loader
        self.profile_loader = get_loader()
        self.profiles_loaded = False

        # Weights para o algoritmo de scoring (ajustados)
        self.weights = {
            "capability": self.config.get("weight_capability", 0.30),
            "performance": self.config.get("weight_performance", 0.30),
            "ease_of_use": self.config.get("weight_ease", 0.05),
            "reliability": self.config.get("weight_reliability", 0.20),
            "context": self.config.get("weight_context", 0.15),  # ✅ Aumentado de 0.10
        }

        logger.info("LibrarySelector initialized with profile loader")

    async def select_library(
        self, task_type: str, task_input: Any, context: Optional[Dict[str, Any]] = None
    ) -> List[LibraryScore]:
        """
        Seleciona bibliotecas para uma tarefa

        Returns:
            Lista ordenada de LibraryScore
        """
        # ✅ CORREÇÃO: Carregar profiles se necessário
        if not self.profiles_loaded:
            self.profile_loader.load_all()
            self.profiles_loaded = True
            logger.info(f"Loaded {len(self.profile_loader.profiles_cache)} profiles")

        logger.debug(f"Selecting library for task type: {task_type}")

        # 1. Obter bibliotecas candidatas (usa profiles se disponíveis)
        candidates = self._get_candidates_with_profiles(task_type, task_input)

        if not candidates:
            logger.warning(f"No candidates found for {task_type}")
            return []

        # 2. Calcular scores
        scores = []
        for lib_name, lib_data in candidates.items():
            score = self._calculate_score(
                lib_name, lib_data, task_type, task_input, context
            )
            scores.append(score)

        # 3. Ordenar por score total
        scores.sort(key=lambda x: x.total_score, reverse=True)

        logger.info(
            f"Selected top library: {scores[0].name if scores else 'None'} "
            f"(score: {scores[0].total_score:.2f})"
        )

        return scores

    def _get_candidates_with_profiles(
        self, task_type: str, task_input: Any
    ) -> Dict[str, Dict[str, Any]]:
        """
        ✅ NOVO: Obter candidatos usando profiles carregados
        """
        candidates = {}

        # Primeiro, tentar usar profiles carregados
        for profile in self.profile_loader.get_all_profiles():
            # Verificar se profile é adequado para task_type
            if self._profile_matches_task(profile, task_type, task_input):
                candidates[profile.name] = {
                    "profile": profile,
                    "capabilities": [uc["name"] for uc in profile.use_cases],
                    "performance": profile.performance_score * 10,
                    "ease_of_use": profile.ease_score * 10,
                    "reliability": 8,  # Default
                    "speed": profile.performance_score * 10,
                    "memory_efficient": profile.memory_score * 10,
                    "pros": profile.metadata.get("pros", []),
                    "cons": profile.metadata.get("cons", []),
                    "best_for": [
                        uc["name"]
                        for uc in profile.use_cases
                        if uc.get("confidence", 0) > 0.85
                    ],
                    "weight": 1.0,
                    "priority": 1,
                }

        # Fallback: usar database hardcoded se não houver profiles
        if not candidates:
            candidates = self._get_candidates(task_type)

        return candidates

    def _profile_matches_task(self, profile, task_type: str, task_input: Any) -> bool:
        """
        ✅ NOVO: Verifica se profile é adequado para task_type
        """
        task_type_lower = str(task_type).lower()

        # Check category
        if task_type_lower in profile.category.lower():
            return True

        # Check keywords
        command = getattr(task_input, "command", "").lower()
        if command:
            for keyword in profile.keywords:
                if keyword in command:
                    return True

        return False

    def _get_candidates(self, task_type: str) -> Dict[str, Dict]:
        """Retorna bibliotecas candidatas para o tipo de tarefa"""

        task_type_upper = task_type.upper()

        mapping = {
            "IMAGE_PROCESSING": self.db.IMAGE_LIBRARIES,
            "VIDEO_PROCESSING": self.db.VIDEO_LIBRARIES,
            "WEB_SCRAPING": self.db.SCRAPING_LIBRARIES,
            "ECOMMERCE_OPERATION": self.db.ECOMMERCE_LIBRARIES,
            "PDF_GENERATION": self.db.PDF_LIBRARIES,
        }

        return mapping.get(task_type_upper, {})

    def _calculate_score(
        self,
        lib_name: str,
        lib_data: Dict,
        task_type: str,
        task_input: Any,
        context: Optional[Dict[str, Any]],
    ) -> LibraryScore:
        """Calcula score detalhado para uma biblioteca"""

        reasoning = []

        # 1. Capability Score (0-10)
        capability_score = lib_data.get("performance", 5)
        reasoning.append(f"Capability: {capability_score}/10")

        # 2. Performance Score (0-10)
        performance_score = (
            lib_data.get("speed", 5) * 0.5
            + lib_data.get("memory_efficient", 5) * 0.3
            + lib_data.get("performance", 5) * 0.2
        )
        reasoning.append(f"Performance: {performance_score:.1f}/10")

        # 3. Ease of Use Score (0-10)
        ease_score = lib_data.get("ease_of_use", 5)
        reasoning.append(f"Ease: {ease_score}/10")

        # 4. Reliability Score (0-10)
        reliability_score = lib_data.get("reliability", 5)
        reasoning.append(f"Reliability: {reliability_score}/10")

        # 5. Context Score (0-10)
        context_score = self._calculate_context_score(lib_data, task_input, context)
        reasoning.append(f"Context: {context_score:.1f}/10")

        # 6. Total Score (weighted average)
        total_score = (
            capability_score * self.weights["capability"]
            + performance_score * self.weights["performance"]
            + ease_score * self.weights["ease_of_use"]
            + reliability_score * self.weights["reliability"]
            + context_score * self.weights["context"]
        )

        # Aplicar weight da biblioteca
        lib_weight = lib_data.get("weight", 1.0)
        total_score *= lib_weight

        return LibraryScore(
            name=lib_name,
            total_score=total_score,
            capability_score=capability_score,
            performance_score=performance_score,
            ease_score=ease_score,
            reliability_score=reliability_score,
            context_score=context_score,
            reasoning=reasoning,
        )

    def _calculate_context_score(
        self, lib_data: Dict, task_input: Any, context: Optional[Dict[str, Any]]
    ) -> float:
        """
        Calcula score baseado no contexto específico

        Considera:
        - Palavras-chave no comando
        - Requisitos específicos
        - Trade-offs aceitáveis
        """
        score = 5.0  # Base score

        if not context:
            return score

        # Check best_for
        command_lower = getattr(task_input, "command", "").lower()
        best_for = lib_data.get("best_for", [])

        for use_case in best_for:
            if use_case.replace("_", " ") in command_lower:
                score += 2.0

        # Check avoid_for
        avoid_for = lib_data.get("avoid_for", [])
        for use_case in avoid_for:
            if use_case.replace("_", " ") in command_lower:
                score -= 2.0

        # Context specific hints
        if context.get("priority") == "speed":
            score += lib_data.get("speed", 5) * 0.2

        if context.get("priority") == "quality":
            score += lib_data.get("reliability", 5) * 0.2

        if context.get("priority") == "simplicity":
            score += lib_data.get("ease_of_use", 5) * 0.2

        # Clamp to 0-10
        return max(0, min(10, score))

    def _get_candidates_from_profiles(
        self, task_type: TaskType, task_input: Any
    ) -> List[LibraryCandidate]:
        """
        ✅ CORREÇÃO: Buscar candidatos dos Library Profiles reais

        Usa o profile loader para encontrar bibliotecas baseado em:
        - Task type match
        - Use cases com confidence
        - Keywords no comando
        - Performance scores
        """
        try:
            loader = get_loader()
            all_profiles = loader.load_all_profiles()

            if not all_profiles:
                logger.warning("⚠️ No profiles loaded, using hardcoded database")
                return self._get_candidates_from_database_fallback(task_type, task_input)

            candidates = []
            command_lower = task_input.command.lower() if hasattr(task_input, 'command') else ""

            for lib_name, profile in all_profiles.items():
                # Calcular confidence baseado em use_cases
                confidence = 0.0
                matching_use_cases = []

                for use_case in profile.use_cases:
                    # Match task type
                    if task_type.value in use_case.task_types:
                        confidence += use_case.confidence
                        matching_use_cases.append(use_case)

                    # Match keywords no comando
                    for keyword in profile.keywords:
                        if keyword.lower() in command_lower:
                            confidence += 0.1

                # Normalizar confidence
                if matching_use_cases or confidence > 0:
                    if matching_use_cases:
                        confidence = confidence / len(matching_use_cases)
                    confidence = min(confidence, 1.0)

                    # Criar candidate
                    candidate = LibraryCandidate(
                        name=lib_name,
                        confidence=confidence,
                        reasoning=f"Profile match: {len(matching_use_cases)} use cases, {profile.category}",
                        priority=profile.priority,
                        estimated_time=profile.estimated_execution_time,
                        requirements=profile.dependencies,
                        alternatives=profile.alternatives,
                        pros=profile.pros,
                        cons=profile.cons,
                        performance_score=profile.performance_score,
                        accuracy_score=profile.quality_score,
                        ease_score=profile.ease_score,
                    )

                    candidates.append(candidate)

            # Ordenar por confidence
            candidates.sort(key=lambda c: c.confidence, reverse=True)

            logger.info(f"✅ Found {len(candidates)} candidates from {len(all_profiles)} profiles")

            # Se nenhum profile match, usar fallback
            if not candidates:
                logger.warning("⚠️ No profile matched, using hardcoded database")
                return self._get_candidates_from_database_fallback(task_type, task_input)

            return candidates[:10]  # Top 10

        except Exception as e:
            logger.error(f"❌ Error loading profiles: {e}")
            logger.warning("⚠️ Falling back to hardcoded database")
            return self._get_candidates_from_database_fallback(task_type, task_input)

    def _get_candidates_from_database_fallback(
        self, task_type: TaskType, task_input: Any
    ) -> List[LibraryCandidate]:
        """
        Fallback usando database hardcoded quando profiles não disponíveis
        """
        # Mapear task_type para categoria de biblioteca
        task_to_category = {
            TaskType.IMAGE_PROCESSING: "IMAGE_LIBRARIES",
            TaskType.VIDEO_PROCESSING: "VIDEO_LIBRARIES",
            TaskType.AUDIO_PROCESSING: "AUDIO_LIBRARIES",
            TaskType.WEB_SCRAPING: "SCRAPING_LIBRARIES",
            TaskType.PDF_GENERATION: "PDF_LIBRARIES",
            TaskType.ECOMMERCE_OPERATION: "ECOMMERCE_LIBRARIES",
            TaskType.DATA_ANALYSIS: "DATA_LIBRARIES",
            TaskType.ML_INFERENCE: "ML_LIBRARIES",
        }

        category = task_to_category.get(task_type, "IMAGE_LIBRARIES")
        libraries = getattr(self.database, category, {})

        candidates = []
        for lib_name, lib_data in libraries.items():
            candidate = LibraryCandidate(
                name=lib_name,
                confidence=0.7,  # Default confidence
                reasoning="Hardcoded database match",
                priority=lib_data.get("priority", 5),
                estimated_time=5.0,
                requirements=[],
                alternatives=[],
                pros=lib_data.get("pros", []),
                cons=lib_data.get("cons", []),
                performance_score=lib_data.get("performance", 5),
                accuracy_score=lib_data.get("reliability", 5),
                ease_score=lib_data.get("ease_of_use", 5),
            )
            candidates.append(candidate)

        return candidates[:5]

    async def create_plan(self, task_id: str, task_type: Any, task_input: Any):
</text>

<old_text line=735>
        # Selecionar bibliotecas
        scores = await self.select_library(
            task_type.value, task_input, task_input.context
        )

        if not scores:
</text>
<new_text>
        # ✅ CORREÇÃO: Usar profiles primeiro, fallback para select_library se necessário
        candidates = self._get_candidates_from_profiles(task_type, task_input)

        if not candidates:
            # Fallback para método antigo
            scores = await self.select_library(
                task_type.value, task_input, task_input.context
            )

            # Converter scores para candidates se necessário
            if scores:
                candidates = [
                    LibraryCandidate(
                        name=score.name,
                        confidence=score.total_score / 10.0,
                        reasoning=" | ".join(score.reasoning),
                        priority=1,
                        estimated_time=5.0,
                        requirements=[],
                        alternatives=[],
                        pros=[],
                        cons=[],
                    )
                    for score in scores[:5]
                ]

        if not candidates:
</text>

<old_text line=758>
        # Biblioteca primária
        top_score = scores[0]
        primary = LibraryCandidate(
            name=top_score.name,
            confidence=top_score.total_score / 10.0,
            reasoning=" | ".join(top_score.reasoning),
            priority=1,
            estimated_time=5.0,
            requirements=[],
            alternatives=[s.name for s in scores[1:4]],
            pros=[],
            cons=[],
        )

        # Fallbacks
        fallback_libs = []
        for i, score in enumerate(scores[1:4], 2):
            fallback = LibraryCandidate(
                name=score.name,
                confidence=score.total_score / 10.0,
                reasoning=" | ".join(score.reasoning),
                priority=i,
                estimated_time=5.0,
                requirements=[],
                alternatives=[],
                pros=[],
                cons=[],
            )
            fallback_libs.append(fallback)
</text>
<new_text>
        # Biblioteca primária (já é LibraryCandidate)
        primary = candidates[0]

        # Fallbacks (já são LibraryCandidate)
        fallback_libs = candidates[1:4] if len(candidates) > 1 else []
</text>

        """Cria ExecutionPlan completo"""
        from ..core.engine import ExecutionPlan, LibraryCandidate

        # Selecionar bibliotecas
        scores = await self.select_library(
            task_type.value, task_input, task_input.context
        )

        if not scores:
            # Fallback genérico
            primary = LibraryCandidate(
                name="requests",
                confidence=0.5,
                reasoning="Generic fallback",
                priority=5,
                estimated_time=10.0,
                requirements=[],
                alternatives=[],
                pros=["Available"],
                cons=["Generic"],
            )

            return ExecutionPlan(
                task_id=task_id,
                task_type=task_type,
                subtasks=[],
                primary_library=primary,
                fallback_libraries=[],
                estimated_duration=10.0,
                requires_hybrid=False,
            )

        # Biblioteca primária
        top_score = scores[0]
        primary = LibraryCandidate(
            name=top_score.name,
            confidence=top_score.total_score / 10.0,
            reasoning=" | ".join(top_score.reasoning),
            priority=1,
            estimated_time=5.0,
            requirements=[],
            alternatives=[s.name for s in scores[1:4]],
            pros=[],
            cons=[],
        )

        # Fallbacks
        fallback_libs = []
        for i, score in enumerate(scores[1:4], 2):
            fallback = LibraryCandidate(
                name=score.name,
                confidence=score.total_score / 10.0,
                reasoning=" | ".join(score.reasoning),
                priority=i,
                estimated_time=5.0,
                requirements=[],
                alternatives=[],
                pros=[],
                cons=[],
            )
            fallback_libs.append(fallback)

        return ExecutionPlan(
            task_id=task_id,
            task_type=task_type,
            subtasks=[],
            primary_library=primary,
            fallback_libraries=fallback_libs,
            estimated_duration=10.0,
            requires_hybrid=False,
        )
