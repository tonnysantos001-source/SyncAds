"""
============================================
SYNCADS OMNIBRAIN - TASK PLANNER
============================================
Sistema de Planejamento e Decomposição de Tarefas

Responsável por:
- Identificar tarefas complexas/multi-step
- Decompor em subtarefas executáveis
- Determinar dependências entre subtarefas
- Criar ordem de execução otimizada
- Gerenciar fluxo de dados entre etapas

Autor: SyncAds AI Team
Versão: 1.0.0
Data: 2025-01-15
============================================
"""

import asyncio
import logging
import re
from typing import Any, Dict, List, Optional, Set, Tuple

from ..types import (
    ExecutionStatus,
    Priority,
    Subtask,
    TaskPlan,
    TaskType,
    priority_from_string,
    task_type_from_string,
)

logger = logging.getLogger("omnibrain.planning")


# ============================================
# TASK COMPLEXITY ANALYZER
# ============================================


class ComplexityAnalyzer:
    """Analisa complexidade de tarefas"""

    # Palavras-chave que indicam múltiplos passos
    MULTI_STEP_KEYWORDS = [
        "e depois",
        "e então",
        "em seguida",
        "depois",
        "então",
        "and then",
        "after that",
        "next",
        "finally",
        "primeiro",
        "segundo",
        "terceiro",
        "first",
        "second",
        "third",
    ]

    # Conectores que indicam sequência
    SEQUENCE_CONNECTORS = ["→", "->", ">", "depois", "então", "and", "e"]

    # Palavras que indicam operações múltiplas
    MULTI_OPERATION_KEYWORDS = [
        "todos",
        "cada",
        "all",
        "each",
        "múltiplos",
        "vários",
        "multiple",
        "several",
    ]

    @staticmethod
    def analyze(command: str) -> Dict[str, Any]:
        """
        Analisa complexidade do comando

        Returns:
            {
                'is_complex': bool,
                'complexity_score': float,
                'indicators': List[str],
                'estimated_steps': int
            }
        """
        command_lower = command.lower()
        indicators = []
        score = 0.0

        # 1. Verificar keywords multi-step
        for keyword in ComplexityAnalyzer.MULTI_STEP_KEYWORDS:
            if keyword in command_lower:
                indicators.append(f"multi_step_keyword: {keyword}")
                score += 0.3

        # 2. Contar vírgulas (múltiplas ações)
        comma_count = command.count(",")
        if comma_count >= 2:
            indicators.append(f"multiple_commas: {comma_count}")
            score += 0.2 * comma_count

        # 3. Detectar conectores de sequência
        for connector in ComplexityAnalyzer.SEQUENCE_CONNECTORS:
            if connector in command_lower:
                indicators.append(f"sequence_connector: {connector}")
                score += 0.2

        # 4. Contar verbos de ação (aproximação simples)
        action_verbs = [
            "faça",
            "crie",
            "gere",
            "extraia",
            "salve",
            "envie",
            "analise",
            "processe",
            "converta",
            "baixe",
            "upload",
            "do",
            "create",
            "generate",
            "extract",
            "save",
            "send",
            "analyze",
            "process",
            "convert",
            "download",
        ]

        verb_count = sum(1 for verb in action_verbs if verb in command_lower)
        if verb_count >= 3:
            indicators.append(f"multiple_verbs: {verb_count}")
            score += 0.3

        # 5. Detectar operações em lote
        for keyword in ComplexityAnalyzer.MULTI_OPERATION_KEYWORDS:
            if keyword in command_lower:
                indicators.append(f"multi_operation: {keyword}")
                score += 0.25

        # 6. Comprimento do comando
        word_count = len(command.split())
        if word_count > 20:
            indicators.append(f"long_command: {word_count} words")
            score += 0.15

        # Normalizar score
        score = min(score, 1.0)

        # Estimar número de passos
        estimated_steps = max(1, int(score * 5) + 1)

        return {
            "is_complex": score >= 0.4,
            "complexity_score": score,
            "indicators": indicators,
            "estimated_steps": estimated_steps,
        }


# ============================================
# TASK DECOMPOSER
# ============================================


class TaskDecomposer:
    """Decompõe tarefas complexas em subtarefas"""

    def __init__(self):
        logger.info("TaskDecomposer initialized")

    async def decompose(self, command: str, context: Dict[str, Any]) -> List[Subtask]:
        """
        Decompõe comando em subtarefas

        Estratégias:
        1. Split por conectores explícitos
        2. Identificar operações sequenciais
        3. Detectar padrões conhecidos
        """
        subtasks = []

        # Estratégia 1: Split por conectores óbvios
        parts = self._split_by_connectors(command)

        if len(parts) > 1:
            # Múltiplas partes identificadas
            for i, part in enumerate(parts):
                subtask = await self._create_subtask(
                    subtask_id=f"subtask_{i + 1}",
                    command=part.strip(),
                    index=i,
                    total=len(parts),
                    context=context,
                )
                subtasks.append(subtask)

                # Criar dependência com subtask anterior
                if i > 0:
                    subtasks[i].depends_on.append(subtasks[i - 1].subtask_id)
                    subtasks[i].input_from = subtasks[i - 1].subtask_id

        else:
            # Estratégia 2: Detectar padrões conhecidos
            pattern_subtasks = await self._detect_patterns(command, context)

            if pattern_subtasks:
                subtasks = pattern_subtasks
            else:
                # Fallback: tarefa única
                subtask = await self._create_subtask(
                    subtask_id="subtask_1",
                    command=command,
                    index=0,
                    total=1,
                    context=context,
                )
                subtasks.append(subtask)

        logger.info(f"Decomposed into {len(subtasks)} subtasks")
        return subtasks

    def _split_by_connectors(self, command: str) -> List[str]:
        """Split comando por conectores de sequência"""
        # Regex para split por conectores mantendo estrutura
        pattern = r"(?:,\s*(?:e\s+)?(?:depois|então|em seguida)|(?:e\s+)?(?:depois|então)|,\s*and\s+then)"

        parts = re.split(pattern, command, flags=re.IGNORECASE)

        # Limpar e filtrar partes vazias
        parts = [p.strip() for p in parts if p and p.strip()]

        return parts

    async def _detect_patterns(
        self, command: str, context: Dict[str, Any]
    ) -> Optional[List[Subtask]]:
        """Detecta padrões conhecidos de tarefas complexas"""
        command_lower = command.lower()

        # Padrão 1: "Scrape X e salve em Y"
        if "scrap" in command_lower and (
            "salv" in command_lower or "save" in command_lower
        ):
            return [
                Subtask(
                    subtask_id="subtask_1",
                    name="Web Scraping",
                    task_type=TaskType.WEB_SCRAPING,
                    command=self._extract_scraping_command(command),
                    priority=Priority.HIGH,
                ),
                Subtask(
                    subtask_id="subtask_2",
                    name="Save Data",
                    task_type=TaskType.DATA_ANALYSIS,
                    command=self._extract_save_command(command),
                    depends_on=["subtask_1"],
                    input_from="subtask_1",
                    priority=Priority.NORMAL,
                ),
            ]

        # Padrão 2: "Baixe X, processe Y, gere Z"
        if "baix" in command_lower or "download" in command_lower:
            if "process" in command_lower or "gere" in command_lower:
                return [
                    Subtask(
                        subtask_id="subtask_1",
                        name="Download",
                        task_type=TaskType.WEB_SCRAPING,
                        command=self._extract_download_command(command),
                        priority=Priority.HIGH,
                    ),
                    Subtask(
                        subtask_id="subtask_2",
                        name="Process",
                        task_type=self._infer_processing_type(command),
                        command=self._extract_process_command(command),
                        depends_on=["subtask_1"],
                        input_from="subtask_1",
                        priority=Priority.NORMAL,
                    ),
                ]

        # Padrão 3: "Analise X e gere relatório"
        if ("analis" in command_lower or "analyze" in command_lower) and (
            "relatório" in command_lower or "report" in command_lower
        ):
            return [
                Subtask(
                    subtask_id="subtask_1",
                    name="Data Analysis",
                    task_type=TaskType.DATA_ANALYSIS,
                    command=self._extract_analysis_command(command),
                    priority=Priority.HIGH,
                ),
                Subtask(
                    subtask_id="subtask_2",
                    name="Generate Report",
                    task_type=TaskType.PDF_GENERATION,
                    command="Gere relatório PDF com os resultados da análise",
                    depends_on=["subtask_1"],
                    input_from="subtask_1",
                    priority=Priority.NORMAL,
                ),
            ]

        return None

    async def _create_subtask(
        self,
        subtask_id: str,
        command: str,
        index: int,
        total: int,
        context: Dict[str, Any],
    ) -> Subtask:
        """Cria subtask individual"""
        task_type = self._infer_task_type(command)

        priority = Priority.HIGH if index == 0 else Priority.NORMAL

        return Subtask(
            subtask_id=subtask_id,
            name=f"Step {index + 1} of {total}",
            task_type=task_type,
            command=command,
            priority=priority,
        )

    def _infer_task_type(self, command: str) -> TaskType:
        """Infere tipo de tarefa do comando"""
        command_lower = command.lower()

        # Mapeamento simples
        if any(k in command_lower for k in ["imagem", "image", "foto"]):
            return TaskType.IMAGE_PROCESSING
        elif any(k in command_lower for k in ["vídeo", "video"]):
            return TaskType.VIDEO_PROCESSING
        elif any(k in command_lower for k in ["scrap", "extrair", "crawl"]):
            return TaskType.WEB_SCRAPING
        elif any(k in command_lower for k in ["pdf", "relatório", "report"]):
            return TaskType.PDF_GENERATION
        elif any(k in command_lower for k in ["analise", "analyze", "dados", "data"]):
            return TaskType.DATA_ANALYSIS
        else:
            return TaskType.UNKNOWN

    def _infer_processing_type(self, command: str) -> TaskType:
        """Infere tipo de processamento"""
        command_lower = command.lower()

        if any(k in command_lower for k in ["imagem", "image"]):
            return TaskType.IMAGE_PROCESSING
        elif any(k in command_lower for k in ["vídeo", "video"]):
            return TaskType.VIDEO_PROCESSING
        elif any(k in command_lower for k in ["áudio", "audio"]):
            return TaskType.AUDIO_PROCESSING
        else:
            return TaskType.DATA_ANALYSIS

    # Métodos auxiliares para extração
    def _extract_scraping_command(self, command: str) -> str:
        """Extrai parte de scraping do comando"""
        # Simplificado - pode ser melhorado com NLP
        match = re.search(
            r"(?:scrap|extrair).*?(?:de|from)\s+([^\s,]+)", command, re.IGNORECASE
        )
        if match:
            url = match.group(1)
            return f"Faça scraping de {url}"
        return "Faça scraping conforme solicitado"

    def _extract_save_command(self, command: str) -> str:
        """Extrai parte de salvamento do comando"""
        if "csv" in command.lower():
            return "Salve os dados em formato CSV"
        elif "json" in command.lower():
            return "Salve os dados em formato JSON"
        else:
            return "Salve os dados em arquivo"

    def _extract_download_command(self, command: str) -> str:
        """Extrai comando de download"""
        return re.sub(r"(?:,|e).*", "", command, flags=re.IGNORECASE).strip()

    def _extract_process_command(self, command: str) -> str:
        """Extrai comando de processamento"""
        parts = re.split(r",\s*(?:e\s+)?", command, flags=re.IGNORECASE)
        if len(parts) > 1:
            return parts[1].strip()
        return "Processe os dados"

    def _extract_analysis_command(self, command: str) -> str:
        """Extrai comando de análise"""
        return re.sub(
            r"(?:e\s+)?(?:ger|create|report).*", "", command, flags=re.IGNORECASE
        ).strip()


# ============================================
# DEPENDENCY RESOLVER
# ============================================


class DependencyResolver:
    """Resolve dependências e ordem de execução"""

    @staticmethod
    def resolve_execution_order(subtasks: List[Subtask]) -> List[str]:
        """
        Determina ordem de execução baseado em dependências

        Usa ordenação topológica (Kahn's algorithm)
        """
        # Construir grafo de dependências
        graph: Dict[str, Set[str]] = {}
        in_degree: Dict[str, int] = {}

        # Inicializar
        for subtask in subtasks:
            graph[subtask.subtask_id] = set(subtask.depends_on)
            in_degree[subtask.subtask_id] = len(subtask.depends_on)

        # Ordenação topológica
        queue = [sid for sid, degree in in_degree.items() if degree == 0]
        order = []

        while queue:
            # Pegar próximo nó sem dependências
            current = queue.pop(0)
            order.append(current)

            # Reduzir in-degree dos dependentes
            for subtask in subtasks:
                if current in subtask.depends_on:
                    in_degree[subtask.subtask_id] -= 1
                    if in_degree[subtask.subtask_id] == 0:
                        queue.append(subtask.subtask_id)

        # Verificar ciclos
        if len(order) != len(subtasks):
            logger.error("Circular dependency detected!")
            # Fallback: ordem original
            return [st.subtask_id for st in subtasks]

        return order

    @staticmethod
    def validate_dependencies(subtasks: List[Subtask]) -> Tuple[bool, List[str]]:
        """
        Valida se todas as dependências são resolvíveis

        Returns:
            (is_valid, error_messages)
        """
        errors = []
        subtask_ids = {st.subtask_id for st in subtasks}

        for subtask in subtasks:
            for dep_id in subtask.depends_on:
                if dep_id not in subtask_ids:
                    errors.append(
                        f"Subtask {subtask.subtask_id} depends on non-existent {dep_id}"
                    )

            if subtask.input_from and subtask.input_from not in subtask_ids:
                errors.append(
                    f"Subtask {subtask.subtask_id} expects input from non-existent {subtask.input_from}"
                )

        return len(errors) == 0, errors


# ============================================
# TASK PLANNER
# ============================================


class TaskPlanner:
    """
    Planejador principal de tarefas

    Responsável por:
    - Analisar complexidade
    - Decompor em subtarefas
    - Resolver dependências
    - Criar plano de execução
    """

    def __init__(self):
        self.complexity_analyzer = ComplexityAnalyzer()
        self.decomposer = TaskDecomposer()
        self.dependency_resolver = DependencyResolver()
        logger.info("TaskPlanner initialized")

    async def create_plan(
        self, task_id: str, command: str, context: Optional[Dict[str, Any]] = None
    ) -> TaskPlan:
        """
        Cria plano completo de execução

        Args:
            task_id: ID da tarefa
            command: Comando do usuário
            context: Contexto adicional

        Returns:
            TaskPlan com subtarefas e ordem de execução
        """
        context = context or {}

        logger.info(f"Creating plan for task: {task_id}")

        # 1. Analisar complexidade
        complexity = self.complexity_analyzer.analyze(command)
        logger.debug(f"Complexity analysis: {complexity}")

        # 2. Decompor em subtarefas
        if complexity["is_complex"]:
            subtasks = await self.decomposer.decompose(command, context)
        else:
            # Tarefa simples - criar subtask única
            subtasks = [
                Subtask(
                    subtask_id="subtask_1",
                    name="Main Task",
                    task_type=self.decomposer._infer_task_type(command),
                    command=command,
                    priority=Priority.NORMAL,
                )
            ]

        logger.info(f"Created {len(subtasks)} subtasks")

        # 3. Validar dependências
        is_valid, errors = self.dependency_resolver.validate_dependencies(subtasks)

        if not is_valid:
            logger.error(f"Dependency validation failed: {errors}")
            # Tentar corrigir removendo dependências inválidas
            for subtask in subtasks:
                subtask.depends_on = [
                    dep
                    for dep in subtask.depends_on
                    if dep in [st.subtask_id for st in subtasks]
                ]

        # 4. Resolver ordem de execução
        execution_order = self.dependency_resolver.resolve_execution_order(subtasks)
        logger.debug(f"Execution order: {execution_order}")

        # 5. Criar plano
        plan = TaskPlan(
            task_id=task_id,
            original_command=command,
            subtasks=subtasks,
            execution_order=execution_order,
            metadata={
                "complexity": complexity,
                "is_multi_step": len(subtasks) > 1,
                "total_steps": len(subtasks),
            },
        )

        logger.info(f"Plan created successfully: {len(subtasks)} steps")

        return plan

    async def update_plan_status(
        self, plan: TaskPlan, subtask_id: str, status: ExecutionStatus
    ):
        """Atualiza status de subtask no plano"""
        for subtask in plan.subtasks:
            if subtask.subtask_id == subtask_id:
                subtask.status = status
                logger.debug(f"Updated {subtask_id} status to {status.value}")
                break

        # Atualizar status geral do plano
        all_success = all(st.status == ExecutionStatus.SUCCESS for st in plan.subtasks)
        any_failed = any(st.status == ExecutionStatus.FAILED for st in plan.subtasks)

        if all_success:
            plan.status = ExecutionStatus.SUCCESS
        elif any_failed:
            plan.status = ExecutionStatus.FAILED
        else:
            plan.status = ExecutionStatus.RUNNING

    def get_next_subtask(self, plan: TaskPlan) -> Optional[Subtask]:
        """
        Retorna próxima subtask pronta para execução

        Uma subtask está pronta se:
        - Status = PENDING
        - Todas as dependências foram completadas com sucesso
        """
        for subtask_id in plan.execution_order:
            subtask = next(
                (st for st in plan.subtasks if st.subtask_id == subtask_id), None
            )

            if not subtask or subtask.status != ExecutionStatus.PENDING:
                continue

            # Verificar se dependências estão resolvidas
            dependencies_met = all(
                self._is_dependency_met(plan, dep_id) for dep_id in subtask.depends_on
            )

            if dependencies_met:
                return subtask

        return None

    def _is_dependency_met(self, plan: TaskPlan, dep_id: str) -> bool:
        """Verifica se dependência foi completada com sucesso"""
        dep_subtask = next(
            (st for st in plan.subtasks if st.subtask_id == dep_id), None
        )
        return dep_subtask and dep_subtask.status == ExecutionStatus.SUCCESS


# ============================================
# HELPER FUNCTIONS
# ============================================


def create_task_planner() -> TaskPlanner:
    """Factory para criar TaskPlanner"""
    return TaskPlanner()


# ============================================
# EXPORTS
# ============================================


__all__ = [
    "ComplexityAnalyzer",
    "TaskDecomposer",
    "DependencyResolver",
    "TaskPlanner",
    "create_task_planner",
]
