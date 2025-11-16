"""
============================================
SYNCADS OMNIBRAIN - LIBRARY PROFILE LOADER
============================================
Sistema de carregamento de Library Profiles

Responsável por:
- Carregar profiles de bibliotecas de arquivos .md
- Parse de markdown estruturado
- Validação de profiles
- Cache de profiles carregados
- Atualização dinâmica de profiles

Autor: SyncAds AI Team
Versão: 1.0.0
Data: 2025-01-15
============================================
"""

import json
import logging
import os
import re
from pathlib import Path
from typing import Dict, List, Optional

from ..types import LibraryProfile

logger = logging.getLogger("omnibrain.library_profiles.loader")


# ============================================
# MARKDOWN PARSER
# ============================================


class MarkdownParser:
    """Parser para extrair dados estruturados de markdown"""

    @staticmethod
    def parse_profile_md(content: str) -> Dict:
        """
        Parse arquivo markdown de profile

        Extrai:
        - Metadados básicos (nome, categoria, versão, licença)
        - Casos de uso com confidence
        - Prós e contras
        - Performance scores
        - Keywords
        - Templates de código
        - Alternativas
        - Exemplos
        """
        data = {
            "name": "",
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

        lines = content.split("\n")
        current_section = None
        current_subsection = None
        code_block = []
        in_code_block = False
        code_language = None
        code_title = None

        for i, line in enumerate(lines):
            stripped = line.strip()

            # Detectar início de seção principal
            if stripped.startswith("# "):
                # Nome da biblioteca (primeira linha)
                if not data["name"]:
                    # Extrair nome do título (pode ter markdown)
                    title = stripped[2:].strip()
                    # Remover parênteses se existir (ex: "OpenCV (opencv-python)")
                    if "(" in title:
                        data["name"] = title.split("(")[1].split(")")[0].strip()
                    else:
                        data["name"] = title.lower().replace(" ", "-")
                continue

            # Detectar seções de nível 2
            if stripped.startswith("## "):
                current_section = stripped[3:].strip().lower()
                current_subsection = None
                continue

            # Detectar seções de nível 3
            if stripped.startswith("### "):
                current_subsection = stripped[4:].strip().lower()
                continue

            # Processar blocos de código
            if stripped.startswith("```"):
                if not in_code_block:
                    in_code_block = True
                    code_language = stripped[3:].strip() or "python"
                    code_block = []
                    # Tentar pegar título do código da linha anterior
                    if i > 0:
                        prev_line = lines[i - 1].strip()
                        if prev_line.startswith("###") or prev_line.startswith("**"):
                            code_title = (
                                prev_line.replace("###", "")
                                .replace("**", "")
                                .replace(":", "")
                                .strip()
                            )
                else:
                    in_code_block = False
                    if code_block and code_title:
                        # Salvar template de código
                        template_key = (
                            code_title.lower().replace(" ", "_").replace("-", "_")
                        )
                        data["code_templates"][template_key] = "\n".join(code_block)
                    code_block = []
                    code_title = None
                continue

            if in_code_block:
                code_block.append(line)
                continue

            # Processar conteúdo baseado na seção atual
            if current_section == "informações básicas":
                MarkdownParser._parse_basic_info(stripped, data)

            elif current_section == "descrição":
                if stripped and not stripped.startswith("#"):
                    data["description"] += stripped + " "

            elif current_section == "casos de uso prioritários":
                use_case = MarkdownParser._parse_use_case(stripped)
                if use_case:
                    data["use_cases"].append(use_case)

            elif current_section == "prós":
                if stripped.startswith("- ✅"):
                    data["use_when"].append(stripped.replace("- ✅", "").strip())

            elif current_section == "contras":
                if stripped.startswith("- ⚠️"):
                    data["dont_use_when"].append(stripped.replace("- ⚠️", "").strip())

            elif current_section == "performance":
                MarkdownParser._parse_performance(stripped, data)

            elif current_section == "keywords/triggers":
                if stripped.startswith("- "):
                    keywords = stripped[2:].split(",")
                    data["keywords"].extend(
                        [kw.strip() for kw in keywords if kw.strip()]
                    )

            elif current_section == "alternativas e quando usar":
                if "|" in stripped and "Biblioteca" not in stripped:
                    parts = [p.strip() for p in stripped.split("|")]
                    if len(parts) >= 2 and parts[1]:
                        data["alternatives"].append(parts[1])

            elif current_section == "dependências":
                if stripped and not stripped.startswith("#"):
                    # Pode ser um bloco de código ou lista
                    if not stripped.startswith("```"):
                        data["dependencies"].append(stripped)

            elif current_section == "notas de compatibilidade":
                MarkdownParser._parse_compatibility(stripped, data)

        # Limpar descrição
        data["description"] = data["description"].strip()

        # Calcular scores médios se não definidos
        if data["performance_score"] == 0.0:
            data["performance_score"] = 0.8  # Default

        return data

    @staticmethod
    def _parse_basic_info(line: str, data: Dict):
        """Parse informações básicas"""
        if line.startswith("- **Nome:**"):
            data["name"] = line.split(":**")[1].strip()
        elif line.startswith("- **Categoria:**"):
            data["category"] = line.split(":**")[1].strip()
        elif line.startswith("- **Versão Mínima:**"):
            data["version_min"] = line.split(":**")[1].strip()
        elif line.startswith("- **Versão Recomendada:**"):
            data["version_recommended"] = line.split(":**")[1].strip()
        elif line.startswith("- **Licença:**"):
            data["license"] = line.split(":**")[1].strip()
        elif line.startswith("- **Documentação:**"):
            data["documentation_url"] = line.split(":**")[1].strip()

    @staticmethod
    def _parse_use_case(line: str) -> Optional[Dict]:
        """Parse caso de uso com confidence"""
        # Formato: "1. **Nome do Caso** (confidence: 0.95)"
        match = re.match(
            r"^\d+\.\s+\*\*(.+?)\*\*\s+\(confidence:\s+([\d.]+)\)",
            line,
        )
        if match:
            return {
                "name": match.group(1).strip(),
                "confidence": float(match.group(2)),
            }
        return None

    @staticmethod
    def _parse_performance(line: str, data: Dict):
        """Parse métricas de performance"""
        if "Velocidade:" in line:
            # Contar estrelas: ⭐⭐⭐⭐⭐ (9.5/10)
            stars = line.count("⭐")
            data["performance_score"] = stars / 5.0

        elif "Uso de Memória:" in line:
            stars = line.count("⭐")
            data["memory_score"] = stars / 5.0

        elif "Qualidade de Output:" in line:
            stars = line.count("⭐")
            data["quality_score"] = stars / 5.0

        elif "Facilidade de Uso:" in line:
            stars = line.count("⭐")
            data["ease_score"] = stars / 5.0

    @staticmethod
    def _parse_compatibility(line: str, data: Dict):
        """Parse notas de compatibilidade"""
        if "Python" in line and "-" in line:
            # Ex: "Python 3.7-3.12"
            match = re.search(r"Python\s+([\d.]+)[-–]([\d.]+)", line)
            if match:
                data["python_versions"] = [
                    f"3.{i}" for i in range(7, 13)
                ]  # Aproximação

        if any(platform in line.lower() for platform in ["windows", "linux", "macos"]):
            if "windows" in line.lower():
                data["platforms"].append("Windows")
            if "linux" in line.lower():
                data["platforms"].append("Linux")
            if "macos" in line.lower():
                data["platforms"].append("macOS")


# ============================================
# LIBRARY PROFILE LOADER
# ============================================


class LibraryProfileLoader:
    """
    Carregador de Library Profiles

    Responsável por:
    - Descobrir arquivos .md na pasta profiles
    - Fazer parse do conteúdo
    - Validar estrutura
    - Criar objetos LibraryProfile
    - Cachear profiles
    """

    def __init__(self, profiles_dir: Optional[str] = None):
        """
        Inicializa loader

        Args:
            profiles_dir: Diretório com arquivos .md (default: pasta atual)
        """
        if profiles_dir is None:
            # Usar diretório do próprio módulo
            profiles_dir = Path(__file__).parent
        else:
            profiles_dir = Path(profiles_dir)

        self.profiles_dir = profiles_dir
        self.profiles: Dict[str, LibraryProfile] = {}
        self.parser = MarkdownParser()

        logger.info(f"LibraryProfileLoader initialized at: {self.profiles_dir}")

    def load_all_profiles(
        self, force_reload: bool = False
    ) -> Dict[str, LibraryProfile]:
        """
        Carrega todos os profiles disponíveis

        Args:
            force_reload: Força recarregar mesmo se já em cache

        Returns:
            Dict de LibraryProfile indexado por nome
        """
        if self.profiles and not force_reload:
            logger.debug("Returning cached profiles")
            return self.profiles

        logger.info("Loading library profiles from disk...")

        profile_files = list(self.profiles_dir.glob("library_*.md"))
        loaded_count = 0

        for file_path in profile_files:
            try:
                profile = self.load_profile(file_path)
                if profile:
                    self.profiles[profile.name] = profile
                    loaded_count += 1
            except Exception as e:
                logger.error(f"Failed to load profile {file_path.name}: {e}")
                continue

        logger.info(f"Loaded {loaded_count}/{len(profile_files)} library profiles")
        return self.profiles

    def load_profile(self, file_path: Path) -> Optional[LibraryProfile]:
        """
        Carrega um profile individual

        Args:
            file_path: Caminho do arquivo .md

        Returns:
            LibraryProfile ou None se falhar
        """
        try:
            # Ler arquivo
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()

            # Parse markdown
            data = self.parser.parse_profile_md(content)

            # Validar dados essenciais
            if not data.get("name"):
                logger.warning(f"Profile {file_path.name} missing name")
                return None

            # Criar LibraryProfile
            profile = LibraryProfile(
                name=data["name"],
                category=data.get("category", "General"),
                version_min=data.get("version_min", "0.0.0"),
                version_recommended=data.get("version_recommended", "latest"),
                description=data.get("description", ""),
                documentation_url=data.get("documentation_url", ""),
                license=data.get("license", "Unknown"),
                use_cases=data.get("use_cases", []),
                performance_score=data.get("performance_score", 0.8),
                memory_score=data.get("memory_score", 0.8),
                quality_score=data.get("quality_score", 0.8),
                ease_score=data.get("ease_score", 0.8),
                keywords=data.get("keywords", []),
                use_when=data.get("use_when", []),
                dont_use_when=data.get("dont_use_when", []),
                alternatives=data.get("alternatives", []),
                code_templates=data.get("code_templates", {}),
                dependencies=data.get("dependencies", []),
                system_requirements=data.get("system_requirements", []),
                python_versions=data.get("python_versions", []),
                platforms=data.get("platforms", []),
                metadata={
                    "source_file": str(file_path),
                    "loaded_at": str(Path(file_path).stat().st_mtime),
                },
            )

            logger.debug(f"Loaded profile: {profile.name}")
            return profile

        except Exception as e:
            logger.error(f"Error loading profile {file_path}: {e}")
            return None

    def get_profile(self, library_name: str) -> Optional[LibraryProfile]:
        """
        Recupera profile por nome

        Args:
            library_name: Nome da biblioteca

        Returns:
            LibraryProfile ou None
        """
        # Carregar profiles se ainda não carregados
        if not self.profiles:
            self.load_all_profiles()

        # Buscar exato
        if library_name in self.profiles:
            return self.profiles[library_name]

        # Buscar variações (opencv-python = opencv = cv2)
        normalized = library_name.lower().replace("_", "-")
        for name, profile in self.profiles.items():
            if normalized in name.lower() or name.lower() in normalized:
                return profile

        return None

    def get_profiles_by_category(self, category: str) -> List[LibraryProfile]:
        """
        Retorna profiles de uma categoria

        Args:
            category: Nome da categoria

        Returns:
            Lista de LibraryProfiles
        """
        if not self.profiles:
            self.load_all_profiles()

        category_lower = category.lower()
        return [
            profile
            for profile in self.profiles.values()
            if category_lower in profile.category.lower()
        ]

    def search_profiles(self, query: str, limit: int = 10) -> List[LibraryProfile]:
        """
        Busca profiles por keywords ou nome

        Args:
            query: Termo de busca
            limit: Máximo de resultados

        Returns:
            Lista de LibraryProfiles ordenados por relevância
        """
        if not self.profiles:
            self.load_all_profiles()

        query_lower = query.lower()
        scored_profiles = []

        for profile in self.profiles.values():
            score = 0.0

            # Nome exato
            if query_lower == profile.name.lower():
                score += 10.0

            # Nome contém query
            if query_lower in profile.name.lower():
                score += 5.0

            # Keywords
            for keyword in profile.keywords:
                if query_lower in keyword.lower():
                    score += 2.0

            # Categoria
            if query_lower in profile.category.lower():
                score += 1.0

            # Descrição
            if query_lower in profile.description.lower():
                score += 0.5

            if score > 0:
                scored_profiles.append((score, profile))

        # Ordenar por score
        scored_profiles.sort(key=lambda x: x[0], reverse=True)

        return [profile for score, profile in scored_profiles[:limit]]

    def get_statistics(self) -> Dict:
        """Retorna estatísticas dos profiles carregados"""
        if not self.profiles:
            self.load_all_profiles()

        categories = {}
        total_templates = 0
        total_keywords = 0

        for profile in self.profiles.values():
            # Contar por categoria
            cat = profile.category
            categories[cat] = categories.get(cat, 0) + 1

            # Contar templates e keywords
            total_templates += len(profile.code_templates)
            total_keywords += len(profile.keywords)

        return {
            "total_profiles": len(self.profiles),
            "categories": categories,
            "total_code_templates": total_templates,
            "total_keywords": total_keywords,
            "profiles_list": list(self.profiles.keys()),
        }

    def reload_profile(self, library_name: str) -> Optional[LibraryProfile]:
        """
        Recarrega um profile específico do disco

        Args:
            library_name: Nome da biblioteca

        Returns:
            LibraryProfile atualizado ou None
        """
        # Encontrar arquivo
        file_path = self.profiles_dir / f"library_{library_name}.md"

        if not file_path.exists():
            logger.error(f"Profile file not found: {file_path}")
            return None

        # Recarregar
        profile = self.load_profile(file_path)

        if profile:
            self.profiles[profile.name] = profile
            logger.info(f"Reloaded profile: {library_name}")

        return profile

    def validate_profile(self, profile: LibraryProfile) -> tuple[bool, List[str]]:
        """
        Valida se profile tem dados necessários

        Args:
            profile: LibraryProfile para validar

        Returns:
            (is_valid, list_of_issues)
        """
        issues = []

        # Campos obrigatórios
        if not profile.name:
            issues.append("Missing name")
        if not profile.category:
            issues.append("Missing category")
        if not profile.version_min:
            issues.append("Missing version_min")
        if not profile.description:
            issues.append("Missing description")

        # Validar scores (0.0 - 1.0)
        if not (0.0 <= profile.performance_score <= 1.0):
            issues.append(f"Invalid performance_score: {profile.performance_score}")

        # Validar use_cases
        if not profile.use_cases:
            issues.append("No use cases defined")

        # Validar keywords
        if not profile.keywords:
            issues.append("No keywords defined")

        is_valid = len(issues) == 0
        return is_valid, issues


# ============================================
# SINGLETON INSTANCE
# ============================================


_loader_instance: Optional[LibraryProfileLoader] = None


def get_profile_loader() -> LibraryProfileLoader:
    """Retorna instância singleton do loader"""
    global _loader_instance
    if _loader_instance is None:
        _loader_instance = LibraryProfileLoader()
    return _loader_instance


# ============================================
# CONVENIENCE FUNCTIONS
# ============================================


def load_all_profiles() -> Dict[str, LibraryProfile]:
    """Atalho para carregar todos os profiles"""
    loader = get_profile_loader()
    return loader.load_all_profiles()


def get_profile(library_name: str) -> Optional[LibraryProfile]:
    """Atalho para buscar profile por nome"""
    loader = get_profile_loader()
    return loader.get_profile(library_name)


def search_profiles(query: str, limit: int = 10) -> List[LibraryProfile]:
    """Atalho para buscar profiles"""
    loader = get_profile_loader()
    return loader.search_profiles(query, limit)


# ============================================
# EXPORTS
# ============================================


__all__ = [
    "LibraryProfileLoader",
    "MarkdownParser",
    "get_profile_loader",
    "load_all_profiles",
    "get_profile",
    "search_profiles",
]
