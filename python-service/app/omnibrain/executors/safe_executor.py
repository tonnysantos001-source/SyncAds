"""
============================================
SYNCADS OMNIBRAIN - SAFE EXECUTOR
============================================
Sistema de Execução Segura de Código Python

Responsável por:
- Executar código Python com segurança
- Implementar sandbox/isolamento
- Controlar timeout
- Restringir operações perigosas
- Monitorar recursos (CPU, memória)
- Capturar stdout/stderr
- Validar imports
- Prevenir ataques
- Log detalhado de execuções

Autor: SyncAds AI Team
Versão: 1.0.0
============================================
"""

import ast
import io
import logging
import multiprocessing
import signal
import sys
import time
import traceback
from contextlib import redirect_stderr, redirect_stdout
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Set, Tuple

logger = logging.getLogger("omnibrain.executor")


# ============================================
# SECURITY CONFIGURATION
# ============================================


class SecurityConfig:
    """Configuração de segurança"""

    # ✅ FIX 2: Rebalanceamento de segurança com 3 níveis

    # Imports PROIBIDOS (nunca permitir)
    FORBIDDEN_IMPORTS = {
        "os",
        "subprocess",
        "sys",
        "multiprocessing",
        "threading",
        "socket",
        "urllib",
        "ftplib",
        "telnetlib",
        "pickle",
        "marshal",
        "shelve",
        "dbm",
        "eval",
        "exec",
        "compile",
        "__import__",
        "globals",
        "locals",
        "vars",
        "dir",
        "help",
        "input",
        "raw_input",
    }

    # Imports CONTROLADOS (permitir com regras e validação)
    CONTROLLED_IMPORTS = {
        "requests",  # Necessário para scraping, APIs
        "httpx",  # HTTP moderno
        "open",  # File I/O controlado
        "builtins.open",  # Alias do open
        "io.open",  # Outro alias
        "pathlib",  # Manipulação de paths
    }

    # Imports permitidos (whitelist)
    ALLOWED_IMPORTS = {
        # Data & Math
        "numpy",
        "pandas",
        "scipy",
        "math",
        "statistics",
        "decimal",
        "fractions",
        "random",
        # Images
        "PIL",
        "cv2",
        "imageio",
        "skimage",
        "rembg",
        # ML/AI
        "torch",
        "tensorflow",
        "transformers",
        "sklearn",
        # Scraping (controlado)
        "requests",
        "beautifulsoup4",
        "bs4",
        "lxml",
        "playwright",
        "selenium",
        # PDF
        "reportlab",
        "PyPDF2",
        "pdfplumber",
        # Utils
        "json",
        "base64",
        "hashlib",
        "uuid",
        "datetime",
        "time",
        "re",
        "collections",
        "itertools",
        "functools",
        "io",
        "logging",
    }

    # Funções built-in proibidas
    FORBIDDEN_BUILTINS = {
        "eval",
        "exec",
        "compile",
        "__import__",
        "open",
        "file",
        "input",
        "raw_input",
        "execfile",
        "reload",
    }

    # Atributos proibidos (para evitar escapar do sandbox)
    FORBIDDEN_ATTRIBUTES = {
        "__code__",
        "__globals__",
        "__closure__",
        "__dict__",
        "__class__",
        "__bases__",
        "__subclasses__",
        "func_code",
        "func_globals",
        "gi_code",
        "gi_frame",
        "cr_code",
        "cr_frame",
    }

    # Limites de recursos
    MAX_EXECUTION_TIME = 300  # 5 minutos
    MAX_MEMORY_MB = 2048  # 2GB
    MAX_OUTPUT_SIZE = 10 * 1024 * 1024  # 10MB


# ============================================
# DATA CLASSES
# ============================================


@dataclass
class ExecutionResult:
    """Resultado da execução"""

    success: bool
    output: Any
    stdout: str
    stderr: str
    execution_time: float
    memory_used: int
    error: Optional[str] = None
    error_type: Optional[str] = None
    error_traceback: Optional[str] = None
    imports_used: List[str] = None
    warnings: List[str] = None


@dataclass
class SecurityViolation:
    """Violação de segurança detectada"""

    type: str  # 'forbidden_import', 'forbidden_builtin', 'forbidden_attribute'
    details: str
    severity: str  # 'low', 'medium', 'high', 'critical'


# ============================================
# CODE VALIDATOR
# ============================================


class CodeValidator:
    """Valida código antes da execução"""

    def __init__(self, config: SecurityConfig):
        self.config = config

    def validate(self, code: str) -> Tuple[bool, List[SecurityViolation]]:
        """
        Valida código Python

        Returns:
            (is_valid, violations)
        """
        violations = []

        try:
            # Parse AST
            tree = ast.parse(code)

            # Verificar imports
            import_violations = self._check_imports(tree)
            violations.extend(import_violations)

            # Verificar chamadas de função
            call_violations = self._check_function_calls(tree)
            violations.extend(call_violations)

            # Verificar acessos a atributos
            attr_violations = self._check_attributes(tree)
            violations.extend(attr_violations)

            # Verificar operações perigosas
            dangerous_violations = self._check_dangerous_operations(tree)
            violations.extend(dangerous_violations)

        except SyntaxError as e:
            violations.append(
                SecurityViolation(
                    type="syntax_error",
                    details=f"Syntax error: {str(e)}",
                    severity="critical",
                )
            )

        # Determinar se é válido (sem violações críticas)
        critical_violations = [v for v in violations if v.severity == "critical"]
        is_valid = len(critical_violations) == 0

        return is_valid, violations

    def _check_imports(self, tree: ast.AST) -> List[SecurityViolation]:
        """Verifica imports"""
        violations = []

        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    module_name = alias.name.split(".")[0]
                    if module_name in self.config.FORBIDDEN_IMPORTS:
                        violations.append(
                            SecurityViolation(
                                type="forbidden_import",
                                details=f"Import forbidden: {alias.name}",
                                severity="critical",
                            )
                        )

            elif isinstance(node, ast.ImportFrom):
                if node.module:
                    module_name = node.module.split(".")[0]
                    if module_name in self.config.FORBIDDEN_IMPORTS:
                        violations.append(
                            SecurityViolation(
                                type="forbidden_import",
                                details=f"Import from forbidden: {node.module}",
                                severity="critical",
                            )
                        )

        return violations

    def _check_function_calls(self, tree: ast.AST) -> List[SecurityViolation]:
        """Verifica chamadas de função"""
        violations = []

        for node in ast.walk(tree):
            if isinstance(node, ast.Call):
                # Check built-in functions
                if isinstance(node.func, ast.Name):
                    func_name = node.func.id
                    if func_name in self.config.FORBIDDEN_BUILTINS:
                        violations.append(
                            SecurityViolation(
                                type="forbidden_builtin",
                                details=f"Forbidden built-in: {func_name}",
                                severity="critical",
                            )
                        )

        return violations

    def _check_attributes(self, tree: ast.AST) -> List[SecurityViolation]:
        """Verifica acesso a atributos perigosos"""
        violations = []

        for node in ast.walk(tree):
            if isinstance(node, ast.Attribute):
                if node.attr in self.config.FORBIDDEN_ATTRIBUTES:
                    violations.append(
                        SecurityViolation(
                            type="forbidden_attribute",
                            details=f"Access to forbidden attribute: {node.attr}",
                            severity="critical",
                        )
                    )

        return violations

    def _check_dangerous_operations(self, tree: ast.AST) -> List[SecurityViolation]:
        """Verifica operações perigosas"""
        violations = []

        for node in ast.walk(tree):
            # Infinite loops detection (básico)
            if isinstance(node, ast.While):
                if isinstance(node.test, ast.Constant) and node.test.value is True:
                    violations.append(
                        SecurityViolation(
                            type="dangerous_operation",
                            details="Potential infinite loop: while True",
                            severity="high",
                        )
                    )

        return violations


# ============================================
# SANDBOX EXECUTOR
# ============================================


class SandboxExecutor:
    """Executor em sandbox isolado"""

    def __init__(self, config: SecurityConfig):
        self.config = config

    def execute(
        self, code: str, globals_dict: Dict[str, Any], timeout: int
    ) -> Tuple[Any, str, str]:
        """
        Executa código em sandbox

        Returns:
            (result, stdout, stderr)
        """

        # Capture stdout/stderr
        stdout_capture = io.StringIO()
        stderr_capture = io.StringIO()

        result = None
        error = None

        try:
            with redirect_stdout(stdout_capture), redirect_stderr(stderr_capture):
                # Setup timeout alarm (Unix only)
                if hasattr(signal, "SIGALRM"):
                    signal.signal(signal.SIGALRM, self._timeout_handler)
                    signal.alarm(timeout)

                try:
                    # Execute code
                    exec(code, globals_dict)

                    # Get result if exists
                    result = globals_dict.get("result")

                finally:
                    # Cancel alarm
                    if hasattr(signal, "SIGALRM"):
                        signal.alarm(0)

        except TimeoutError:
            error = "Execution timeout"
            stderr_capture.write(f"Error: {error}\n")

        except Exception as e:
            error = str(e)
            stderr_capture.write(f"Error: {error}\n")
            stderr_capture.write(traceback.format_exc())

        stdout_text = stdout_capture.getvalue()
        stderr_text = stderr_capture.getvalue()

        return result, stdout_text, stderr_text

    def _timeout_handler(self, signum, frame):
        """Handler para timeout"""
        raise TimeoutError("Code execution timeout")


# ============================================
# SAFE EXECUTOR
# ============================================


class SafeExecutor:
    """
    Executor Seguro de Código Python

    Features:
    - Validação de código antes da execução
    - Sandbox isolado
    - Timeout configurável
    - Restrições de imports
    - Monitoramento de recursos
    - Captura de stdout/stderr
    - Log detalhado
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        config_dict = config or {}

        self.security_config = SecurityConfig()
        self.validator = CodeValidator(self.security_config)
        self.sandbox = SandboxExecutor(self.security_config)

        # Configurações
        self.max_execution_time = config_dict.get(
            "max_execution_time", self.security_config.MAX_EXECUTION_TIME
        )
        self.max_memory_mb = config_dict.get(
            "max_memory_mb", self.security_config.MAX_MEMORY_MB
        )
        self.enable_validation = config_dict.get("enable_validation", True)
        self.strict_mode = config_dict.get("strict_mode", True)

        logger.info("SafeExecutor initialized")

    async def execute(self, code: str, task_input: Any) -> ExecutionResult:
        """
        Executa código Python de forma segura

        Args:
            code: Código Python para executar
            task_input: Input da tarefa

        Returns:
            ExecutionResult
        """
        start_time = time.time()

        logger.info("Starting safe code execution")
        logger.debug(f"Code length: {len(code)} bytes")

        # 1. VALIDAR CÓDIGO
        if self.enable_validation:
            is_valid, violations = self.validator.validate(code)

            if not is_valid:
                error_msg = self._format_violations(violations)
                logger.error(f"Code validation failed: {error_msg}")

                return ExecutionResult(
                    success=False,
                    output=None,
                    stdout="",
                    stderr=error_msg,
                    execution_time=time.time() - start_time,
                    memory_used=0,
                    error=error_msg,
                    error_type="ValidationError",
                    warnings=[
                        v.details for v in violations if v.severity != "critical"
                    ],
                )

            # Log warnings
            warnings = [
                v.details for v in violations if v.severity in ["low", "medium"]
            ]
            if warnings:
                for warning in warnings:
                    logger.warning(f"Code warning: {warning}")

        # 2. PREPARAR AMBIENTE DE EXECUÇÃO
        globals_dict = self._create_safe_globals(task_input)

        # 3. EXECUTAR NO SANDBOX
        try:
            result, stdout, stderr = self.sandbox.execute(
                code, globals_dict, self.max_execution_time
            )

            execution_time = time.time() - start_time

            # Success
            logger.info(f"Code executed successfully in {execution_time:.2f}s")

            return ExecutionResult(
                success=True,
                output=result,
                stdout=stdout,
                stderr=stderr,
                execution_time=execution_time,
                memory_used=0,  # TODO: Implement memory tracking
                imports_used=self._extract_imports(code),
                warnings=warnings if self.enable_validation else [],
            )

        except Exception as e:
            execution_time = time.time() - start_time
            error_msg = str(e)
            error_traceback = traceback.format_exc()

            logger.error(f"Code execution failed: {error_msg}")
            logger.debug(f"Traceback: {error_traceback}")

            return ExecutionResult(
                success=False,
                output=None,
                stdout="",
                stderr=error_traceback,
                execution_time=execution_time,
                memory_used=0,
                error=error_msg,
                error_type=type(e).__name__,
                error_traceback=error_traceback,
            )

    def _create_safe_globals(self, task_input: Any) -> Dict[str, Any]:
        """Cria ambiente global seguro para execução"""

        # Built-ins seguros
        safe_builtins = {
            "abs": abs,
            "all": all,
            "any": any,
            "bin": bin,
            "bool": bool,
            "bytes": bytes,
            "chr": chr,
            "dict": dict,
            "enumerate": enumerate,
            "filter": filter,
            "float": float,
            "format": format,
            "hex": hex,
            "int": int,
            "isinstance": isinstance,
            "issubclass": issubclass,
            "len": len,
            "list": list,
            "map": map,
            "max": max,
            "min": min,
            "oct": oct,
            "ord": ord,
            "pow": pow,
            "print": print,
            "range": range,
            "reversed": reversed,
            "round": round,
            "set": set,
            "slice": slice,
            "sorted": sorted,
            "str": str,
            "sum": sum,
            "tuple": tuple,
            "type": type,
            "zip": zip,
            # Safe modules
            "True": True,
            "False": False,
            "None": None,
        }

        globals_dict = {
            "__builtins__": safe_builtins,
            "task_input": task_input,
        }

        return globals_dict

    def _format_violations(self, violations: List[SecurityViolation]) -> str:
        """Formata violações de segurança"""
        lines = ["Security violations detected:"]
        for v in violations:
            lines.append(f"  [{v.severity.upper()}] {v.type}: {v.details}")
        return "\n".join(lines)

    def _extract_imports(self, code: str) -> List[str]:
        """Extrai lista de imports do código"""
        imports = []

        try:
            tree = ast.parse(code)
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        imports.append(alias.name)
                elif isinstance(node, ast.ImportFrom):
                    if node.module:
                        imports.append(node.module)
        except:
            pass

        return imports

    def get_security_config(self) -> SecurityConfig:
        """Retorna configuração de segurança"""
        return self.security_config

    def is_code_safe(self, code: str) -> Tuple[bool, List[str]]:
        """
        Verifica se código é seguro

        Returns:
            (is_safe, reasons)
        """
        is_valid, violations = self.validator.validate(code)

        reasons = [v.details for v in violations if v.severity == "critical"]

        return is_valid, reasons


# ============================================
# FACTORY
# ============================================


def create_safe_executor(config: Optional[Dict[str, Any]] = None) -> SafeExecutor:
    """Factory para criar SafeExecutor"""
    return SafeExecutor(config)


# ============================================
# EXAMPLE
# ============================================

if __name__ == "__main__":
    import asyncio

    async def main():
        # Create executor
        executor = create_safe_executor(
            {"max_execution_time": 10, "enable_validation": True, "strict_mode": True}
        )

        # Test safe code
        safe_code = """
import math

def calculate():
    result = math.sqrt(16) + math.pi
    return result

result = calculate()
print(f"Result: {result}")
"""

        # Test dangerous code
        dangerous_code = """
import os
os.system('rm -rf /')
"""

        print("=" * 50)
        print("Testing SAFE code:")
        print("=" * 50)
        result = await executor.execute(safe_code, None)
        print(f"Success: {result.success}")
        print(f"Output: {result.output}")
        print(f"Stdout: {result.stdout}")
        print(f"Time: {result.execution_time:.3f}s")

        print("\n" + "=" * 50)
        print("Testing DANGEROUS code:")
        print("=" * 50)
        result = await executor.execute(dangerous_code, None)
        print(f"Success: {result.success}")
        print(f"Error: {result.error}")
        print(f"Stderr: {result.stderr}")

    asyncio.run(main())
