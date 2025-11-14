"""
============================================
SYNCADS OMNIBRAIN - LIBRARY PROFILES LOADER
============================================
Sistema de Carregamento de Library Profiles

Responsável por:
- Carregar profiles de bibliotecas dos arquivos .md
- Parsear conteúdo markdown estruturado
- Extrair metadados e templates
- Fornecer API de busca
- Cache de profiles

Autor: SyncAds AI Team
Versão: 1.0.0
Data: 2025-01-15
============================================
"""

import json
import logging
import re
from pathlib import Path
from typing import Any, Dict, List, Optional

from ..types import LibraryProfile

logger = logging.getLogger("omnibrain.library_profiles")


# ============================================
# MARKDOWN PARSER
# ============================================


class LibraryProfileParser:
    """Parser para arquivos .md de library profiles"""

    @staticmethod
    def parse(content: str, filename: str) -> LibraryProfile:
        """
        Parse arquivo markdown para LibraryProfile

        Estrutura esperada do .md:
        # Library Name
        ## Informações Básicas
        - **Nome:** library-name
        - **Categoria:** category
        ## Casos de Uso Prioritários
        1. **Use Case** (confidence: 0.95)
        ## Keywords/Triggers
        - keyword1
        - keyword2
        ## Templates por Caso de Uso
        ### Template: Name
        ```python
        code here
        ```
        """
        profile_data = {
            "name": LibraryProfileParser._extract_library_name(content, filename),
            "category": "",
            "version_min": "",
            "version_recommended": "",
            "description": "",
            "documentation_url": "",
            "license": "",
            "use_cases": [],
            "performance_score": 0.0,
            "memory_score": 0.0,
            "quality_score": 0.0,
            "ease_score": 0.0,
            "keywords": [],
            "use_when": [],
            "dont_use_when": [],
            "alternatives": [],
            "code_templates": {},
            "dependencies": [],
            "system_requirements": [],
            "python_versions": [],
            "platforms": [],
            "metadata": {},
        }

        # Extrair seções
        sections = LibraryProfileParser._split_into_sections(content)

        # Parse cada seção
        for section_title, section_content in sections.items():
            if "informações básicas" in section_title.lower():
                LibraryProfileParser._parse_basic_info(section_content, profile_data)

            elif "casos de uso" in section_title.lower():
                profile_data["use_cases"] = LibraryProfileParser._parse_use_cases(
                    section_content
                )

            elif "prós" in section_title.lower():
                profile_data["metadata"]["pros"] = (
                    LibraryProfileParser._extract_bullet_points(section_content)
                )

            elif "contras" in section_title.lower():
                profile_data["metadata"]["cons"] = (
                    LibraryProfileParser._extract_bullet_points(section_content)
                )

            elif "performance" in section_title.lower():
                LibraryProfileParser._parse_performance(section_content, profile_data)

            elif (
                "keywords" in section_title.lower()
                or "triggers" in section_title.lower()
            ):
                profile_data["keywords"] = LibraryProfileParser._extract_keywords(
                    section_content
                )

            elif "templates" in section_title.lower():
                profile_data["code_templates"] = LibraryProfileParser._parse_templates(
                    section_content
                )

            elif "alternativas" in section_title.lower():
                profile_data["alternatives"] = (
                    LibraryProfileParser._extract_alternatives(section_content)
                )

            elif "dependências" in section_title.lower():
                profile_data["dependencies"] = (
                    LibraryProfileParser._extract_dependencies(section_content)
                )

            elif "compatibilidade" in section_title.lower():
                LibraryProfileParser._parse_compatibility(section_content, profile_data)

        return LibraryProfile(**profile_data)

    @staticmethod
    def _extract_library_name(content: str, filename: str) -> str:
        """Extrai nome da biblioteca"""
        # Tentar do título principal
        match = re.search(r"^#\s+(.+?)(?:\s*\(|$)", content, re.MULTILINE)
        if match:
            return match.group(1).strip()

        # Fallback: extrair do filename
        name = filename.replace("library_", "").replace(".md", "")
        return name

    @staticmethod
    def _split_into_sections(content: str) -> Dict[str, str]:
        """Divide markdown em seções por headers"""
        sections = {}
        current_section = ""
        current_content = []

        lines = content.split("\n")

        for line in lines:
            # Detectar header (## ou ###)
            if line.startswith("##"):
                # Salvar seção anterior
                if current_section:
                    sections[current_section] = "\n".join(current_content)

                # Iniciar nova seção
                current_section = line.lstrip("#").strip()
                current_content = []
            else:
                current_content.append(line)

        # Salvar última seção
        if current_section:
            sections[current_section] = "\n".join(current_content)

        return sections

    @staticmethod
    def _parse_basic_info(content: str, profile_data: Dict[str, Any]):
        """Parse informações básicas"""
        # Nome
        match = re.search(r"\*\*Nome:\*\*\s+(.+)", content)
        if match:
            profile_data["name"] = match.group(1).strip()

        # Categoria
        match = re.search(r"\*\*Categoria:\*\*\s+(.+)", content)
        if match:
            profile_data["category"] = match.group(1).strip()

        # Versão mínima
        match = re.search(r"\*\*Versão Mínima:\*\*\s+(.+)", content)
        if match:
            profile_data["version_min"] = match.group(1).strip()

        # Versão recomendada
        match = re.search(r"\*\*Versão Recomendada:\*\*\s+(.+)", content)
        if match:
            profile_data["version_recommended"] = match.group(1).strip()

        # Licença
        match = re.search(r"\*\*Licença:\*\*\s+(.+)", content)
        if match:
            profile_data["license"] = match.group(1).strip()

        # Documentação
        match = re.search(r"\*\*Documentação:\*\*\s+(.+)", content)
        if match:
            profile_data["documentation_url"] = match.group(1).strip()

    @staticmethod
    def _parse_use_cases(content: str) -> List[Dict[str, float]]:
        """Parse casos de uso com confidence scores"""
        use_cases = []

        # Pattern: 1. **Use Case Name** (confidence: 0.95)
        pattern = r"\d+\.\s+\*\*(.+?)\*\*\s+\(confidence:\s+([\d.]+)\)"

        for match in re.finditer(pattern, content):
            use_case_name = match.group(1).strip()
            confidence = float(match.group(2))

            use_cases.append({"name": use_case_name, "confidence": confidence})

        return use_cases

    @staticmethod
    def _extract_bullet_points(content: str) -> List[str]:
        """Extrai bullet points"""
        points = []

        for line in content.split("\n"):
            line = line.strip()
            # Match - item ou ✅/⚠️ item
            if re.match(r"^[-•✅⚠️❌]\s+", line):
                # Limpar markers
                clean = re.sub(r"^[-•✅⚠️❌]\s+", "", line)
                points.append(clean)

        return points

    @staticmethod
    def _parse_performance(content: str, profile_data: Dict[str, Any]):
        """Parse métricas de performance"""
        # Pattern: - **Métrica:** ⭐⭐⭐⭐⭐ (9.5/10)
        metrics = {
            "velocidade": "performance_score",
            "speed": "performance_score",
            "uso de memória": "memory_score",
            "memory": "memory_score",
            "qualidade": "quality_score",
            "quality": "quality_score",
            "facilidade": "ease_score",
            "ease": "ease_score",
        }

        for metric_name, field_name in metrics.items():
            pattern = rf"\*\*{metric_name}[^:]*:\*\*[^(]*\(?([\d.]+)"
            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                score = float(match.group(1))
                # Normalizar para 0-1
                if score > 1:
                    score = score / 10.0
                profile_data[field_name] = score

    @staticmethod
    def _extract_keywords(content: str) -> List[str]:
        """Extrai keywords"""
        keywords = []

        for line in content.split("\n"):
            line = line.strip()
            if line.startswith("-"):
                keyword = line.lstrip("-").strip()
                if keyword:
                    keywords.append(keyword.lower())

        return keywords

    @staticmethod
    def _parse_templates(content: str) -> Dict[str, str]:
        """Parse code templates"""
        templates = {}

        # Pattern: ### Template: Name\n```python\ncode\n```
        pattern = r"###\s+Template:\s+(.+?)\n```(?:python)?\n(.*?)```"

        for match in re.finditer(pattern, content, re.DOTALL):
            template_name = match.group(1).strip()
            template_code = match.group(2).strip()

            templates[template_name.lower()] = template_code

        return templates

    @staticmethod
    def _extract_alternatives(content: str) -> List[str]:
        """Extrai bibliotecas alternativas"""
        alternatives = []

        # Buscar em tabela ou lista
        for line in content.split("\n"):
            # Tabela: | Library | ...
            if line.startswith("|") and not line.startswith("|-"):
                parts = [p.strip() for p in line.split("|")]
                if len(parts) > 2 and parts[1]:
                    lib = parts[1].strip()
                    if lib and lib.lower() not in ["biblioteca", "library"]:
                        alternatives.append(lib)

        return alternatives

    @staticmethod
    def _extract_dependencies(content: str) -> List[str]:
        """Extrai dependências"""
        dependencies = []

        # Buscar em código ou lista
        in_code_block = False
        for line in content.split("\n"):
            if line.strip().startswith("```"):
                in_code_block = not in_code_block
                continue

            if in_code_block:
                # Pattern: package>=version
                match = re.match(r"^([a-zA-Z0-9_-]+)\s*[><=]", line.strip())
                if match:
                    dependencies.append(match.group(1))

        return dependencies

    @staticmethod
    def _parse_compatibility(content: str, profile_data: Dict[str, Any]):
        """Parse informações de compatibilidade"""
        # Plataformas
        if "windows" in content.lower() and "linux" in content.lower():
            profile_data["platforms"] = ["Windows", "Linux", "macOS"]

        # Python versions
        match = re.search(r"Python\s+([\d.]+)[-+]([\d.]+)?", content)
        if match:
            profile_data["python_versions"] = [match.group(0)]


# ============================================
# PROFILE LOADER
# ============================================


class LibraryProfileLoader:
    """Carregador de library profiles"""

    def __init__(self, profiles_dir: Optional[Path] = None):
        self.profiles_dir = profiles_dir or Path(__file__).parent
        self.profiles_cache: Dict[str, LibraryProfile] = {}
        self.loaded = False
        logger.info(f"LibraryProfileLoader initialized: {self.profiles_dir}")

    def load_all(self) -> Dict[str, LibraryProfile]:
        """Carrega todos os profiles da pasta"""
        if self.loaded and self.profiles_cache:
            return self.profiles_cache

        logger.info(f"Loading profiles from {self.profiles_dir}")

        md_files = list(self.profiles_dir.glob("library_*.md"))
        logger.info(f"Found {len(md_files)} profile files")

        for md_file in md_files:
            try:
                profile = self.load_profile(md_file.stem)
                if profile:
                    self.profiles_cache[profile.name] = profile
                    logger.debug(f"Loaded profile: {profile.name}")
            except Exception as e:
                logger.error(f"Error loading {md_file.name}: {e}")

        self.loaded = True
        logger.info(f"Loaded {len(self.profiles_cache)} profiles")

        return self.profiles_cache

    def load_profile(self, library_name: str) -> Optional[LibraryProfile]:
        """Carrega profile específico"""
        # Normalizar nome
        clean_name = library_name.replace("library_", "")

        # Verificar cache
        if clean_name in self.profiles_cache:
            return self.profiles_cache[clean_name]

        # Buscar arquivo
        md_file = self.profiles_dir / f"library_{clean_name}.md"

        if not md_file.exists():
            # Tentar sem prefixo
            md_file = self.profiles_dir / f"{clean_name}.md"

        if not md_file.exists():
            logger.warning(f"Profile not found: {library_name}")
            return None

        try:
            content = md_file.read_text(encoding="utf-8")
            profile = LibraryProfileParser.parse(content, md_file.name)
            self.profiles_cache[profile.name] = profile
            return profile
        except Exception as e:
            logger.error(f"Error parsing profile {md_file.name}: {e}")
            return None

    def get_profile(self, library_name: str) -> Optional[LibraryProfile]:
        """Recupera profile (carrega se necessário)"""
        if not self.loaded:
            self.load_all()

        return self.profiles_cache.get(library_name)

    def search_by_category(self, category: str) -> List[LibraryProfile]:
        """Busca profiles por categoria"""
        if not self.loaded:
            self.load_all()

        return [
            p
            for p in self.profiles_cache.values()
            if category.lower() in p.category.lower()
        ]

    def search_by_keyword(self, keyword: str) -> List[LibraryProfile]:
        """Busca profiles por keyword"""
        if not self.loaded:
            self.load_all()

        keyword_lower = keyword.lower()
        return [
            p
            for p in self.profiles_cache.values()
            if any(keyword_lower in kw.lower() for kw in p.keywords)
        ]

    def get_all_profiles(self) -> List[LibraryProfile]:
        """Retorna todos os profiles carregados"""
        if not self.loaded:
            self.load_all()

        return list(self.profiles_cache.values())

    def get_template(self, library_name: str, template_name: str) -> Optional[str]:
        """Recupera template de código"""
        profile = self.get_profile(library_name)
        if not profile:
            return None

        return profile.code_templates.get(template_name.lower())

    def clear_cache(self):
        """Limpa cache de profiles"""
        self.profiles_cache.clear()
        self.loaded = False
        logger.info("Profile cache cleared")

    def reload(self):
        """Recarrega todos os profiles"""
        self.clear_cache()
        return self.load_all()

    def get_statistics(self) -> Dict[str, Any]:
        """Retorna estatísticas dos profiles carregados"""
        if not self.loaded:
            self.load_all()

        return {
            "total_profiles": len(self.profiles_cache),
            "categories": len(
                set(p.category for p in self.profiles_cache.values() if p.category)
            ),
            "total_keywords": sum(
                len(p.keywords) for p in self.profiles_cache.values()
            ),
            "total_templates": sum(
                len(p.code_templates) for p in self.profiles_cache.values()
            ),
            "libraries": sorted(self.profiles_cache.keys()),
        }


# ============================================
# SINGLETON INSTANCE
# ============================================


_loader_instance: Optional[LibraryProfileLoader] = None


def get_loader() -> LibraryProfileLoader:
    """Retorna instância singleton do loader"""
    global _loader_instance
    if _loader_instance is None:
        _loader_instance = LibraryProfileLoader()
    return _loader_instance


# ============================================
# CONVENIENCE FUNCTIONS
# ============================================


def load_all_profiles() -> Dict[str, LibraryProfile]:
    """Carrega todos os profiles"""
    return get_loader().load_all()


def get_profile(library_name: str) -> Optional[LibraryProfile]:
    """Recupera profile de biblioteca"""
    return get_loader().get_profile(library_name)


def search_profiles(keyword: str) -> List[LibraryProfile]:
    """Busca profiles por keyword"""
    return get_loader().search_by_keyword(keyword)


def get_template(library_name: str, template_name: str) -> Optional[str]:
    """Recupera template de código"""
    return get_loader().get_template(library_name, template_name)


def reload_profiles():
    """Recarrega profiles"""
    return get_loader().reload()


# ============================================
# EXPORTS
# ============================================


__all__ = [
    "LibraryProfile",
    "LibraryProfileParser",
    "LibraryProfileLoader",
    "get_loader",
    "load_all_profiles",
    "get_profile",
    "search_profiles",
    "get_template",
    "reload_profiles",
]
