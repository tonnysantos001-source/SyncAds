"""
============================================
SYNCADS AI TOOLS MODULE
============================================
Ferramentas avançadas para IA:
- Geração de imagens (DALL-E)
- Geração de vídeos (MoviePy)
- Web Search (Google, DuckDuckGo)
- Criação de arquivos (seguro)
- Execução Python (RestrictedPython)

Autor: SyncAds AI Team
Data: 16/01/2025
============================================
"""

import base64
import io
import json
import os
import tempfile
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

import astunparse
from loguru import logger
from RestrictedPython import compile_restricted, safe_globals
from RestrictedPython.Guards import guarded_iter_unpack_sequence, safer_getattr

# ============================================
# CONFIGURAÇÕES
# ============================================

TEMP_DIR = Path(tempfile.gettempdir()) / "syncads_ai"
TEMP_DIR.mkdir(parents=True, exist_ok=True)

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {".txt", ".json", ".csv", ".md", ".html", ".css", ".js", ".py"}

# ============================================
# 1. GERAÇÃO DE IMAGENS (DALL-E)
# ============================================


class ImageGenerator:
    """Gerador de imagens usando DALL-E 3"""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            logger.warning("⚠️ OPENAI_API_KEY não configurada")

    async def generate(
        self,
        prompt: str,
        size: str = "1024x1024",
        quality: str = "standard",
        style: str = "vivid",
    ) -> Dict[str, Any]:
        """
        Gera imagem com DALL-E 3

        Args:
            prompt: Descrição da imagem
            size: Tamanho (1024x1024, 1792x1024, 1024x1792)
            quality: Qualidade (standard, hd)
            style: Estilo (vivid, natural)

        Returns:
            {
                "success": bool,
                "url": str,
                "prompt": str,
                "revised_prompt": str
            }
        """
        try:
            if not self.api_key:
                return {"success": False, "error": "OpenAI API key não configurada"}

            from openai import OpenAI

            client = OpenAI(api_key=self.api_key)

            logger.info(f"🎨 Gerando imagem: {prompt[:50]}...")

            response = client.images.generate(
                model="dall-e-3",
                prompt=prompt,
                size=size,
                quality=quality,
                style=style,
                n=1,
            )

            image_data = response.data[0]

            result = {
                "success": True,
                "url": image_data.url,
                "prompt": prompt,
                "revised_prompt": image_data.revised_prompt,
                "size": size,
                "quality": quality,
                "style": style,
                "created_at": datetime.now().isoformat(),
            }

            logger.info(f"✅ Imagem gerada: {image_data.url}")
            return result

        except Exception as e:
            logger.error(f"❌ Erro ao gerar imagem: {e}")
            return {"success": False, "error": str(e), "prompt": prompt}

    async def edit_image(
        self, image_url: str, prompt: str, mask_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """Edita uma imagem existente"""
        try:
            import httpx
            from openai import OpenAI

            client = OpenAI(api_key=self.api_key)

            # Download da imagem
            async with httpx.AsyncClient() as http_client:
                image_response = await http_client.get(image_url)
                image_bytes = image_response.content

            logger.info(f"✏️ Editando imagem: {prompt[:50]}...")

            response = client.images.edit(
                image=image_bytes, prompt=prompt, n=1, size="1024x1024"
            )

            return {"success": True, "url": response.data[0].url, "prompt": prompt}

        except Exception as e:
            logger.error(f"❌ Erro ao editar imagem: {e}")
            return {"success": False, "error": str(e)}


# ============================================
# 2. GERAÇÃO DE VÍDEOS (MOVIEPY)
# ============================================


class VideoGenerator:
    """Gerador de vídeos simples usando MoviePy"""

    async def create_from_images(
        self,
        image_urls: List[str],
        duration_per_image: float = 3.0,
        fps: int = 24,
        transition: str = "fade",
    ) -> Dict[str, Any]:
        """
        Cria vídeo a partir de imagens

        Args:
            image_urls: Lista de URLs de imagens
            duration_per_image: Duração de cada imagem em segundos
            fps: Frames por segundo
            transition: Tipo de transição (fade, slide)

        Returns:
            {
                "success": bool,
                "video_path": str,
                "duration": float,
                "size": int
            }
        """
        try:
            import httpx
            from moviepy.editor import (
                CompositeVideoClip,
                ImageClip,
                concatenate_videoclips,
            )

            logger.info(f"🎬 Criando vídeo com {len(image_urls)} imagens...")

            clips = []

            # Download e criar clips
            async with httpx.AsyncClient() as client:
                for idx, url in enumerate(image_urls):
                    # Download imagem
                    response = await client.get(url)
                    image_path = TEMP_DIR / f"frame_{idx}.png"
                    image_path.write_bytes(response.content)

                    # Criar clip
                    clip = ImageClip(str(image_path), duration=duration_per_image)

                    # Adicionar transição
                    if transition == "fade" and idx > 0:
                        clip = clip.fadein(0.5).fadeout(0.5)

                    clips.append(clip)

            # Concatenar clips
            final_clip = concatenate_videoclips(clips, method="compose")

            # Salvar vídeo
            output_path = (
                TEMP_DIR / f"video_{datetime.now().strftime('%Y%m%d_%H%M%S')}.mp4"
            )
            final_clip.write_videofile(
                str(output_path), fps=fps, codec="libx264", audio=False
            )

            video_size = output_path.stat().st_size

            logger.info(
                f"✅ Vídeo criado: {output_path} ({video_size / 1024 / 1024:.2f}MB)"
            )

            return {
                "success": True,
                "video_path": str(output_path),
                "duration": final_clip.duration,
                "size": video_size,
                "fps": fps,
                "images_count": len(image_urls),
            }

        except Exception as e:
            logger.error(f"❌ Erro ao criar vídeo: {e}")
            return {"success": False, "error": str(e)}

    async def add_text_overlay(
        self,
        video_path: str,
        text: str,
        position: str = "center",
        duration: Optional[float] = None,
    ) -> Dict[str, Any]:
        """Adiciona texto sobre o vídeo"""
        try:
            from moviepy.editor import CompositeVideoClip, TextClip, VideoFileClip

            logger.info(f"📝 Adicionando texto ao vídeo...")

            video = VideoFileClip(video_path)

            txt_clip = (
                TextClip(
                    text,
                    fontsize=70,
                    color="white",
                    font="Arial-Bold",
                    bg_color="black",
                )
                .set_position(position)
                .set_duration(duration or video.duration)
            )

            final = CompositeVideoClip([video, txt_clip])

            output_path = (
                TEMP_DIR
                / f"video_with_text_{datetime.now().strftime('%Y%m%d_%H%M%S')}.mp4"
            )
            final.write_videofile(str(output_path), codec="libx264")

            return {"success": True, "video_path": str(output_path), "text": text}

        except Exception as e:
            logger.error(f"❌ Erro ao adicionar texto: {e}")
            return {"success": False, "error": str(e)}


# ============================================
# 3. WEB SEARCH (GOOGLE / DUCKDUCKGO)
# ============================================


class WebSearcher:
    """Busca na web usando múltiplos providers"""

    def __init__(self, serpapi_key: Optional[str] = None):
        self.serpapi_key = serpapi_key or os.getenv("SERPAPI_KEY")

    async def search_google(self, query: str, num_results: int = 5) -> Dict[str, Any]:
        """
        Busca no Google usando SerpAPI

        Args:
            query: Termo de busca
            num_results: Número de resultados

        Returns:
            {
                "success": bool,
                "query": str,
                "results": List[Dict],
                "provider": "google"
            }
        """
        try:
            if not self.serpapi_key:
                logger.warning("⚠️ SERPAPI_KEY não configurada, usando fallback")
                return await self.search_duckduckgo(query, num_results)

            from serpapi import GoogleSearch

            logger.info(f"🔍 Buscando no Google: {query}")

            params = {
                "q": query,
                "api_key": self.serpapi_key,
                "num": num_results,
                "hl": "pt",
                "gl": "br",
            }

            search = GoogleSearch(params)
            results_data = search.get_dict()

            organic_results = results_data.get("organic_results", [])

            results = []
            for item in organic_results[:num_results]:
                results.append(
                    {
                        "title": item.get("title"),
                        "link": item.get("link"),
                        "snippet": item.get("snippet"),
                        "source": item.get("source"),
                    }
                )

            logger.info(f"✅ Encontrados {len(results)} resultados")

            return {
                "success": True,
                "query": query,
                "results": results,
                "provider": "google",
                "total": len(results),
            }

        except Exception as e:
            logger.error(f"❌ Erro ao buscar no Google: {e}")
            # Fallback para DuckDuckGo
            return await self.search_duckduckgo(query, num_results)

    async def search_duckduckgo(
        self, query: str, num_results: int = 5
    ) -> Dict[str, Any]:
        """
        Busca no DuckDuckGo (fallback gratuito)

        Args:
            query: Termo de busca
            num_results: Número de resultados

        Returns:
            {
                "success": bool,
                "query": str,
                "results": List[Dict],
                "provider": "duckduckgo"
            }
        """
        try:
            from duckduckgo_search import DDGS

            logger.info(f"🦆 Buscando no DuckDuckGo: {query}")

            with DDGS() as ddgs:
                results_raw = list(ddgs.text(query, max_results=num_results))

            results = []
            for item in results_raw:
                results.append(
                    {
                        "title": item.get("title"),
                        "link": item.get("href"),
                        "snippet": item.get("body"),
                        "source": "DuckDuckGo",
                    }
                )

            logger.info(f"✅ Encontrados {len(results)} resultados")

            return {
                "success": True,
                "query": query,
                "results": results,
                "provider": "duckduckgo",
                "total": len(results),
            }

        except Exception as e:
            logger.error(f"❌ Erro ao buscar no DuckDuckGo: {e}")
            return {
                "success": False,
                "query": query,
                "error": str(e),
                "provider": "duckduckgo",
            }

    async def search(self, query: str, num_results: int = 5) -> Dict[str, Any]:
        """Busca automática (tenta Google, depois DuckDuckGo)"""
        result = await self.search_google(query, num_results)

        if not result.get("success"):
            result = await self.search_duckduckgo(query, num_results)

        return result


# ============================================
# 4. CRIAR ARQUIVOS (SEGURO)
# ============================================


class FileCreator:
    """Criador de arquivos com validação de segurança"""

    def __init__(self, base_dir: Optional[Path] = None):
        self.base_dir = base_dir or TEMP_DIR
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def _validate_filename(self, filename: str) -> bool:
        """Valida nome do arquivo"""
        from pathvalidate import ValidationError, validate_filename

        try:
            validate_filename(filename)

            # Verificar extensão permitida
            ext = Path(filename).suffix.lower()
            if ext not in ALLOWED_EXTENSIONS:
                logger.warning(f"⚠️ Extensão não permitida: {ext}")
                return False

            return True
        except ValidationError:
            return False

    async def create_file(
        self, filename: str, content: str, encoding: str = "utf-8"
    ) -> Dict[str, Any]:
        """
        Cria arquivo de texto

        Args:
            filename: Nome do arquivo
            content: Conteúdo do arquivo
            encoding: Encoding (utf-8, ascii, etc)

        Returns:
            {
                "success": bool,
                "filepath": str,
                "size": int
            }
        """
        try:
            # Validar filename
            if not self._validate_filename(filename):
                return {
                    "success": False,
                    "error": f"Nome de arquivo inválido ou extensão não permitida: {filename}",
                }

            # Verificar tamanho
            content_bytes = content.encode(encoding)
            if len(content_bytes) > MAX_FILE_SIZE:
                return {
                    "success": False,
                    "error": f"Arquivo muito grande (máx {MAX_FILE_SIZE / 1024 / 1024}MB)",
                }

            # Criar arquivo
            filepath = self.base_dir / filename

            # Evitar sobrescrever
            if filepath.exists():
                filepath = (
                    self.base_dir
                    / f"{Path(filename).stem}_{datetime.now().strftime('%Y%m%d_%H%M%S')}{Path(filename).suffix}"
                )

            filepath.write_text(content, encoding=encoding)

            logger.info(f"✅ Arquivo criado: {filepath}")

            return {
                "success": True,
                "filepath": str(filepath),
                "filename": filepath.name,
                "size": filepath.stat().st_size,
                "encoding": encoding,
                "created_at": datetime.now().isoformat(),
            }

        except Exception as e:
            logger.error(f"❌ Erro ao criar arquivo: {e}")
            return {"success": False, "error": str(e)}

    async def create_json(self, filename: str, data: Dict) -> Dict[str, Any]:
        """Cria arquivo JSON"""
        try:
            content = json.dumps(data, indent=2, ensure_ascii=False)
            return await self.create_file(filename, content)
        except Exception as e:
            return {"success": False, "error": f"Erro ao criar JSON: {e}"}

    async def list_files(self) -> Dict[str, Any]:
        """Lista arquivos criados"""
        try:
            files = []
            for file_path in self.base_dir.glob("*"):
                if file_path.is_file():
                    files.append(
                        {
                            "name": file_path.name,
                            "size": file_path.stat().st_size,
                            "modified": datetime.fromtimestamp(
                                file_path.stat().st_mtime
                            ).isoformat(),
                        }
                    )

            return {
                "success": True,
                "files": files,
                "total": len(files),
                "base_dir": str(self.base_dir),
            }
        except Exception as e:
            return {"success": False, "error": str(e)}


# ============================================
# 5. EXECUÇÃO PYTHON SEGURA (RESTRICTEDPYTHON)
# ============================================


class SafePythonExecutor:
    """Executor Python com sandbox RestrictedPython"""

    def __init__(self):
        # Safe builtins permitidos
        self.safe_builtins = {
            "print": print,
            "len": len,
            "range": range,
            "str": str,
            "int": int,
            "float": float,
            "list": list,
            "dict": dict,
            "tuple": tuple,
            "set": set,
            "bool": bool,
            "sum": sum,
            "max": max,
            "min": min,
            "abs": abs,
            "round": round,
            "sorted": sorted,
            "enumerate": enumerate,
            "zip": zip,
            "map": map,
            "filter": filter,
            "any": any,
            "all": all,
            "_getiter_": guarded_iter_unpack_sequence,
            "_getattr_": safer_getattr,
        }

    async def execute(
        self, code: str, timeout: int = 5, max_memory: int = 100
    ) -> Dict[str, Any]:
        """
        Executa código Python de forma segura

        Args:
            code: Código Python para executar
            timeout: Timeout em segundos
            max_memory: Memória máxima em MB (não implementado ainda)

        Returns:
            {
                "success": bool,
                "result": Any,
                "output": str,
                "error": Optional[str]
            }
        """
        try:
            logger.info(f"🐍 Executando Python (sandbox)...")

            # Capturar output
            output_buffer = io.StringIO()

            # Compilar código restrito
            byte_code = compile_restricted(code, filename="<user_code>", mode="exec")

            # Namespace para execução
            namespace = {
                "__builtins__": self.safe_builtins,
                "__name__": "__main__",
                "__print__": lambda *args: output_buffer.write(
                    " ".join(map(str, args)) + "\n"
                ),
            }

            # Executar código
            exec(byte_code, namespace)

            # Pegar resultado (última expressão ou variável 'result')
            result = namespace.get("result", None)
            output = output_buffer.getvalue()

            logger.info(f"✅ Código executado com sucesso")

            return {
                "success": True,
                "result": result,
                "output": output.strip(),
                "code": code,
                "executed_at": datetime.now().isoformat(),
            }

        except SyntaxError as e:
            logger.error(f"❌ Erro de sintaxe: {e}")
            return {
                "success": False,
                "error": f"Erro de sintaxe: {e}",
                "type": "SyntaxError",
                "line": e.lineno,
            }
        except Exception as e:
            logger.error(f"❌ Erro na execução: {e}")
            return {"success": False, "error": str(e), "type": type(e).__name__}

    async def validate_code(self, code: str) -> Dict[str, Any]:
        """Valida código Python sem executar"""
        try:
            compile_restricted(code, filename="<string>", mode="exec")
            return {"success": True, "valid": True, "message": "Código válido"}
        except SyntaxError as e:
            return {"success": False, "valid": False, "error": str(e), "line": e.lineno}


# ============================================
# FACTORY - CRIAR INSTÂNCIAS
# ============================================


def create_image_generator(api_key: Optional[str] = None) -> ImageGenerator:
    """Cria gerador de imagens"""
    return ImageGenerator(api_key)


def create_video_generator() -> VideoGenerator:
    """Cria gerador de vídeos"""
    return VideoGenerator()


def create_web_searcher(serpapi_key: Optional[str] = None) -> WebSearcher:
    """Cria buscador web"""
    return WebSearcher(serpapi_key)


def create_file_creator(base_dir: Optional[Path] = None) -> FileCreator:
    """Cria criador de arquivos"""
    return FileCreator(base_dir)


def create_python_executor() -> SafePythonExecutor:
    """Cria executor Python seguro"""
    return SafePythonExecutor()


# ============================================
# HELPER - DETECTAR INTENT
# ============================================


def detect_tool_intent(message: str) -> Optional[str]:
    """
    Detecta qual ferramenta usar baseado na mensagem

    Returns:
        "image" | "video" | "search" | "file" | "python" | None
    """
    message_lower = message.lower()

    # Imagem
    if any(
        word in message_lower
        for word in ["gere imagem", "crie imagem", "desenhe", "dall-e", "gerar imagem"]
    ):
        return "image"

    # Vídeo
    if any(
        word in message_lower
        for word in ["gere vídeo", "crie vídeo", "video", "gerar video"]
    ):
        return "video"

    # Web Search
    if any(
        word in message_lower
        for word in ["pesquise", "busque", "procure na web", "google", "search"]
    ):
        return "search"

    # Arquivo
    if any(
        word in message_lower
        for word in [
            "crie arquivo",
            "salve em arquivo",
            "gere arquivo",
            "criar arquivo",
        ]
    ):
        return "file"

    # Python
    if any(
        word in message_lower
        for word in ["execute python", "rode python", "python code", "executar código"]
    ):
        return "python"

    return None


# ============================================
# EXPORTS
# ============================================

__all__ = [
    "ImageGenerator",
    "VideoGenerator",
    "WebSearcher",
    "FileCreator",
    "SafePythonExecutor",
    "create_image_generator",
    "create_video_generator",
    "create_web_searcher",
    "create_file_creator",
    "create_python_executor",
    "detect_tool_intent",
]
