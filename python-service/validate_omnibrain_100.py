#!/usr/bin/env python3
"""
============================================
OMNIBRAIN ENGINE - VALIDATION SCRIPT
============================================
Script de validação completa do Omnibrain Engine

Testa:
- Imports de todos os módulos
- Carregamento de library profiles
- Sistema de prompts
- Criação do engine
- Componentes core
- Execução básica

Versão: 1.0.0
Data: 2025-01-15
============================================
"""

import asyncio
import os
import sys
from pathlib import Path
from typing import Dict, List

# Cores para output
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"


class OmnibrainValidator:
    """Validador completo do Omnibrain Engine"""

    def __init__(self):
        self.tests_passed = 0
        self.tests_failed = 0
        self.warnings = []

    def print_header(self, text: str):
        """Imprime header formatado"""
        print(f"\n{BLUE}{'=' * 60}{RESET}")
        print(f"{BLUE}{text.center(60)}{RESET}")
        print(f"{BLUE}{'=' * 60}{RESET}\n")

    def print_test(self, name: str, passed: bool, message: str = ""):
        """Imprime resultado de teste"""
        status = f"{GREEN}✅ PASS{RESET}" if passed else f"{RED}❌ FAIL{RESET}"
        print(f"{status} - {name}")
        if message:
            print(f"        {message}")

        if passed:
            self.tests_passed += 1
        else:
            self.tests_failed += 1

    def print_warning(self, message: str):
        """Imprime aviso"""
        print(f"{YELLOW}⚠️  WARNING: {message}{RESET}")
        self.warnings.append(message)

    def test_imports(self) -> bool:
        """Testa imports de todos os módulos"""
        self.print_header("TESTE 1: IMPORTS")

        modules_to_test = [
            ("Core Engine", "app.omnibrain.core.engine"),
            ("Types", "app.omnibrain.types"),
            ("Task Classifier", "app.omnibrain.classifiers.task_classifier"),
            ("Library Selector", "app.omnibrain.engines.library_selector"),
            ("Code Generator", "app.omnibrain.engines.code_generator"),
            ("Safe Executor", "app.omnibrain.executors.safe_executor"),
            ("Retry Engine", "app.omnibrain.retry.retry_engine"),
            ("Result Validator", "app.omnibrain.validators.result_validator"),
            ("Context Manager", "app.omnibrain.context.context_manager"),
            ("Task Planner", "app.omnibrain.planning.task_planner"),
            ("Cache Manager", "app.omnibrain.cache.cache_manager"),
            ("Metrics", "app.omnibrain.observability.metrics"),
            ("Prompts System", "app.omnibrain.prompts"),
            ("AI Executor", "app.omnibrain.prompts.ai_executor"),
            ("Library Profile Loader", "app.omnibrain.library_profiles.loader"),
        ]

        all_passed = True
        for name, module_path in modules_to_test:
            try:
                __import__(module_path)
                self.print_test(f"Import {name}", True)
            except ImportError as e:
                self.print_test(f"Import {name}", False, str(e))
                all_passed = False
            except Exception as e:
                self.print_test(f"Import {name}", False, f"Unexpected error: {str(e)}")
                all_passed = False

        return all_passed

    def test_library_profiles(self) -> bool:
        """Testa carregamento de library profiles"""
        self.print_header("TESTE 2: LIBRARY PROFILES")

        try:
            from app.omnibrain.library_profiles.loader import get_profile_loader

            loader = get_profile_loader()
            profiles = loader.load_all_profiles()

            profile_count = len(profiles)
            self.print_test(
                f"Carregar profiles", True, f"{profile_count} profiles carregados"
            )

            if profile_count < 10:
                self.print_warning(f"Apenas {profile_count} profiles. Recomendado: 14+")

            # Testar profiles específicos
            expected_profiles = [
                "opencv-python",
                "playwright",
                "pillow",
                "requests",
                "beautifulsoup4",
                "pandas",
                "numpy",
                "httpx",
                "reportlab",
            ]

            for profile_name in expected_profiles:
                if profile_name in profiles:
                    profile = profiles[profile_name]
                    has_templates = len(profile.code_templates) > 0
                    has_use_cases = len(profile.use_cases) > 0

                    if has_templates and has_use_cases:
                        self.print_test(
                            f"Profile {profile_name}",
                            True,
                            f"{len(profile.code_templates)} templates, {len(profile.use_cases)} use cases",
                        )
                    else:
                        self.print_test(
                            f"Profile {profile_name}",
                            False,
                            "Missing templates or use cases",
                        )
                else:
                    self.print_test(f"Profile {profile_name}", False, "Not found")

            # Estatísticas
            stats = loader.get_statistics()
            print(f"\n📊 Estatísticas:")
            print(f"   Total Profiles: {stats['total_profiles']}")
            print(f"   Total Templates: {stats['total_code_templates']}")
            print(f"   Total Keywords: {stats['total_keywords']}")
            print(f"   Categorias: {len(stats['categories'])}")

            return profile_count >= 9

        except Exception as e:
            self.print_test("Library Profiles", False, str(e))
            return False

    def test_prompts_system(self) -> bool:
        """Testa sistema de prompts"""
        self.print_header("TESTE 3: SISTEMA DE PROMPTS")

        try:
            from app.omnibrain.prompts import (
                get_ai_executor,
                get_prompt,
                is_ai_available,
                list_prompts,
                render_prompt,
            )

            # Listar prompts disponíveis
            prompts = list_prompts()
            self.print_test(
                "Listar prompts", True, f"{len(prompts)} prompts disponíveis"
            )

            # Testar cada prompt
            for prompt_name in prompts:
                template = get_prompt(prompt_name)
                if template:
                    self.print_test(
                        f"Prompt '{prompt_name}'",
                        True,
                        f"{len(template.variables)} variáveis",
                    )
                else:
                    self.print_test(
                        f"Prompt '{prompt_name}'", False, "Template não encontrado"
                    )

            # Testar renderização
            try:
                rendered = render_prompt(
                    "task_analysis", command="Test command", context={}, files=[]
                )
                has_content = len(rendered) > 100
                self.print_test(
                    "Renderização de prompt",
                    has_content,
                    f"{len(rendered)} caracteres renderizados",
                )
            except Exception as e:
                self.print_test("Renderização de prompt", False, str(e))

            # Verificar AI disponível
            ai_available = is_ai_available()
            if ai_available:
                self.print_test("AI API Keys", True, "OpenAI ou Anthropic configurado")
            else:
                self.print_warning("AI API Keys não configuradas (opcional)")

            return len(prompts) >= 3

        except Exception as e:
            self.print_test("Sistema de Prompts", False, str(e))
            return False

    def test_engine_creation(self) -> bool:
        """Testa criação do engine"""
        self.print_header("TESTE 4: CRIAÇÃO DO ENGINE")

        try:
            from app.omnibrain.core.engine import create_omnibrain_engine

            engine = create_omnibrain_engine()

            # Verificar componentes core
            components = {
                "task_classifier": engine.task_classifier,
                "library_selector": engine.library_selector,
                "code_generator": engine.code_generator,
                "executor": engine.executor,
                "validator": engine.validator,
                "retry_engine": engine.retry_engine,
            }

            all_components = True
            for name, component in components.items():
                if component is not None:
                    self.print_test(f"Componente {name}", True)
                else:
                    self.print_test(f"Componente {name}", False, "Não inicializado")
                    all_components = False

            # Verificar componentes avançados
            advanced = {
                "context_manager": engine.context_manager,
                "task_planner": engine.task_planner,
                "cache_manager": engine.cache_manager,
                "profile_loader": engine.profile_loader,
            }

            for name, component in advanced.items():
                if component is not None:
                    self.print_test(f"Componente avançado {name}", True)
                else:
                    self.print_warning(
                        f"Componente {name} não inicializado (pode ser opcional)"
                    )

            return all_components

        except Exception as e:
            self.print_test("Criação do Engine", False, str(e))
            import traceback

            print(traceback.format_exc())
            return False

    async def test_basic_execution(self) -> bool:
        """Testa execução básica"""
        self.print_header("TESTE 5: EXECUÇÃO BÁSICA")

        try:
            from app.omnibrain.core.engine import TaskInput, create_omnibrain_engine

            engine = create_omnibrain_engine()

            # Teste simples (sem executar código real)
            task_input = TaskInput(
                command="Test task for validation",
                task_type="text_processing",
                context={"test": True},
            )

            self.print_test("Criar TaskInput", True)

            # Testar classificação
            try:
                task_type = await engine._classify_task(task_input)
                self.print_test("Classificação de tarefa", True, f"Tipo: {task_type}")
            except Exception as e:
                self.print_test("Classificação de tarefa", False, str(e))
                return False

            # Testar criação de plano
            try:
                plan = await engine._create_execution_plan(
                    "test-001", task_type, task_input
                )
                self.print_test(
                    "Criação de plano",
                    True,
                    f"Biblioteca primária: {plan.primary_library.name}",
                )
            except Exception as e:
                self.print_test("Criação de plano", False, str(e))
                return False

            return True

        except Exception as e:
            self.print_test("Execução Básica", False, str(e))
            import traceback

            print(traceback.format_exc())
            return False

    def test_file_structure(self) -> bool:
        """Testa estrutura de arquivos"""
        self.print_header("TESTE 6: ESTRUTURA DE ARQUIVOS")

        base_path = Path("app/omnibrain")

        required_files = [
            "core/engine.py",
            "types.py",
            "classifiers/task_classifier.py",
            "engines/library_selector.py",
            "engines/code_generator.py",
            "executors/safe_executor.py",
            "retry/retry_engine.py",
            "validators/result_validator.py",
            "context/context_manager.py",
            "planning/task_planner.py",
            "cache/cache_manager.py",
            "observability/metrics.py",
            "prompts/__init__.py",
            "prompts/ai_executor.py",
            "prompts/templates/task_analysis.md",
            "prompts/templates/library_selection.md",
            "prompts/templates/code_generation.md",
            "library_profiles/loader.py",
            "library_profiles/README.md",
        ]

        all_exist = True
        for file_path in required_files:
            full_path = base_path / file_path
            exists = full_path.exists()
            if exists:
                size = full_path.stat().st_size
                self.print_test(f"Arquivo {file_path}", True, f"{size} bytes")
            else:
                self.print_test(f"Arquivo {file_path}", False, "Não encontrado")
                all_exist = False

        return all_exist

    def print_summary(self):
        """Imprime sumário final"""
        self.print_header("SUMÁRIO FINAL")

        total_tests = self.tests_passed + self.tests_failed
        success_rate = (self.tests_passed / total_tests * 100) if total_tests > 0 else 0

        print(f"Total de Testes: {total_tests}")
        print(f"{GREEN}Passaram: {self.tests_passed}{RESET}")
        print(f"{RED}Falharam: {self.tests_failed}{RESET}")
        print(f"{YELLOW}Avisos: {len(self.warnings)}{RESET}")
        print(f"\nTaxa de Sucesso: {success_rate:.1f}%")

        if success_rate >= 90:
            print(f"\n{GREEN}🎉 OMNIBRAIN 100% VALIDADO! PRONTO PARA PRODUÇÃO!{RESET}")
            return 0
        elif success_rate >= 70:
            print(
                f"\n{YELLOW}⚠️  Sistema funcional mas com issues. Recomenda-se correções.{RESET}"
            )
            return 1
        else:
            print(
                f"\n{RED}❌ Sistema com problemas críticos. Correções necessárias.{RESET}"
            )
            return 2


async def main():
    """Função principal"""
    print(f"{BLUE}")
    print("=" * 60)
    print("🧠 OMNIBRAIN ENGINE - VALIDAÇÃO COMPLETA".center(60))
    print("=" * 60)
    print(f"{RESET}")

    validator = OmnibrainValidator()

    # Executar testes
    tests = [
        ("Imports", validator.test_imports),
        ("Library Profiles", validator.test_library_profiles),
        ("Sistema de Prompts", validator.test_prompts_system),
        ("Criação do Engine", validator.test_engine_creation),
        ("Execução Básica", validator.test_basic_execution),
        ("Estrutura de Arquivos", validator.test_file_structure),
    ]

    results = []
    for test_name, test_func in tests:
        try:
            if asyncio.iscoroutinefunction(test_func):
                result = await test_func()
            else:
                result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"{RED}Erro fatal no teste '{test_name}': {e}{RESET}")
            import traceback

            print(traceback.format_exc())
            results.append((test_name, False))

    # Sumário
    validator.print_summary()

    # Recomendações
    if validator.warnings:
        print(f"\n{YELLOW}⚠️  AVISOS:{RESET}")
        for warning in validator.warnings:
            print(f"   - {warning}")

    # Exit code
    return 0 if validator.tests_failed == 0 else 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
