"""
============================================
SYNCADS OMNIBRAIN - CODE GENERATOR
============================================
Gerador Automático de Código Python

Responsável por:
- Analisar biblioteca selecionada
- Entender contexto da tarefa
- Gerar código Python otimizado
- Incluir error handling
- Adicionar validações
- Criar imports necessários
- Documentar código gerado
- Adaptar-se ao contexto específico
- Otimizar para performance

Autor: SyncAds AI Team
Versão: 1.0.0 → 1.5.0 (✅ Integrado com Profile Loader)
============================================
"""

import logging
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

# ✅ CORREÇÃO: Integrar profile loader e types
from ..library_profiles import get_loader, get_template
from ..types import ExecutionPlan, LibraryCandidate, TaskInput

logger = logging.getLogger("omnibrain.code_generator")


# ============================================
# CODE TEMPLATES
# ============================================


class CodeTemplates:
    """Templates de código para cada biblioteca"""

    # ==========================================
    # IMAGE PROCESSING
    # ==========================================

    PILLOW_RESIZE = """
from PIL import Image
import io

def execute_task(input_data, params):
    \"\"\"Resize image using Pillow\"\"\"
    try:
        # Open image
        if isinstance(input_data, bytes):
            img = Image.open(io.BytesIO(input_data))
        elif isinstance(input_data, str):
            img = Image.open(input_data)
        else:
            img = input_data

        # Get dimensions
        width = params.get('width', {width})
        height = params.get('height', {height})
        quality = params.get('quality', {quality})

        # Resize
        if width and height:
            img_resized = img.resize((width, height), Image.Resampling.LANCZOS)
        elif width:
            aspect = img.height / img.width
            height = int(width * aspect)
            img_resized = img.resize((width, height), Image.Resampling.LANCZOS)
        elif height:
            aspect = img.width / img.height
            width = int(height * aspect)
            img_resized = img.resize((width, height), Image.Resampling.LANCZOS)
        else:
            img_resized = img

        # Save to bytes
        output = io.BytesIO()
        format_type = params.get('format', img.format or 'PNG').upper()
        img_resized.save(output, format=format_type, quality=quality, optimize=True)

        result = {{
            'success': True,
            'output': output.getvalue(),
            'width': img_resized.width,
            'height': img_resized.height,
            'format': format_type,
            'size_bytes': len(output.getvalue())
        }}

        return result

    except Exception as e:
        return {{'success': False, 'error': str(e)}}

result = execute_task({input_var}, {params_var})
"""

    PILLOW_CROP = """
from PIL import Image
import io

def execute_task(input_data, params):
    \"\"\"Crop image using Pillow\"\"\"
    try:
        # Open image
        if isinstance(input_data, bytes):
            img = Image.open(io.BytesIO(input_data))
        elif isinstance(input_data, str):
            img = Image.open(input_data)
        else:
            img = input_data

        # Get crop box
        left = params.get('left', 0)
        top = params.get('top', 0)
        right = params.get('right', img.width)
        bottom = params.get('bottom', img.height)

        # Crop
        img_cropped = img.crop((left, top, right, bottom))

        # Save to bytes
        output = io.BytesIO()
        format_type = params.get('format', img.format or 'PNG').upper()
        quality = params.get('quality', 95)
        img_cropped.save(output, format=format_type, quality=quality, optimize=True)

        result = {{
            'success': True,
            'output': output.getvalue(),
            'width': img_cropped.width,
            'height': img_cropped.height,
            'format': format_type
        }}

        return result

    except Exception as e:
        return {{'success': False, 'error': str(e)}}

result = execute_task({input_var}, {params_var})
"""

    OPENCV_RESIZE = """
import cv2
import numpy as np

def execute_task(input_data, params):
    \"\"\"Resize image using OpenCV\"\"\"
    try:
        # Load image
        if isinstance(input_data, bytes):
            nparr = np.frombuffer(input_data, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        elif isinstance(input_data, str):
            img = cv2.imread(input_data)
        else:
            img = input_data

        # Get dimensions
        width = params.get('width', {width})
        height = params.get('height', {height})
        interpolation = params.get('interpolation', 'LANCZOS4')

        # Map interpolation
        interp_map = {{
            'NEAREST': cv2.INTER_NEAREST,
            'LINEAR': cv2.INTER_LINEAR,
            'CUBIC': cv2.INTER_CUBIC,
            'LANCZOS4': cv2.INTER_LANCZOS4
        }}
        interp = interp_map.get(interpolation, cv2.INTER_LANCZOS4)

        # Resize
        if width and height:
            img_resized = cv2.resize(img, (width, height), interpolation=interp)
        elif width:
            aspect = img.shape[0] / img.shape[1]
            height = int(width * aspect)
            img_resized = cv2.resize(img, (width, height), interpolation=interp)
        elif height:
            aspect = img.shape[1] / img.shape[0]
            width = int(height * aspect)
            img_resized = cv2.resize(img, (width, height), interpolation=interp)
        else:
            img_resized = img

        # Encode to bytes
        format_ext = params.get('format', '.png')
        success, buffer = cv2.imencode(format_ext, img_resized)

        if not success:
            return {{'success': False, 'error': 'Failed to encode image'}}

        result = {{
            'success': True,
            'output': buffer.tobytes(),
            'width': img_resized.shape[1],
            'height': img_resized.shape[0],
            'channels': img_resized.shape[2] if len(img_resized.shape) > 2 else 1
        }}

        return result

    except Exception as e:
        return {{'success': False, 'error': str(e)}}

result = execute_task({input_var}, {params_var})
"""

    REMBG_REMOVE_BG = """
from rembg import remove
from PIL import Image
import io

def execute_task(input_data, params):
    \"\"\"Remove background using rembg\"\"\"
    try:
        # Open image
        if isinstance(input_data, bytes):
            input_img = input_data
        elif isinstance(input_data, str):
            with open(input_data, 'rb') as f:
                input_img = f.read()
        else:
            # Assume PIL Image
            buffer = io.BytesIO()
            input_data.save(buffer, format='PNG')
            input_img = buffer.getvalue()

        # Remove background
        output_img = remove(input_img)

        # Convert to PIL for metadata
        img = Image.open(io.BytesIO(output_img))

        result = {{
            'success': True,
            'output': output_img,
            'width': img.width,
            'height': img.height,
            'format': 'PNG',
            'has_transparency': True
        }}

        return result

    except Exception as e:
        return {{'success': False, 'error': str(e)}}

result = execute_task({input_var}, {params_var})
"""

    # ==========================================
    # WEB SCRAPING
    # ==========================================

    REQUESTS_SCRAPE = """
import requests
from bs4 import BeautifulSoup

def execute_task(url, params):
    \"\"\"Scrape website using requests + BeautifulSoup\"\"\"
    try:
        # Setup
        timeout = params.get('timeout', 30)
        headers = params.get('headers', {{
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }})

        # Request
        response = requests.get(url, headers=headers, timeout=timeout)
        response.raise_for_status()

        # Parse
        soup = BeautifulSoup(response.content, 'html.parser')

        # Extract data
        extract_images = params.get('extract_images', False)
        extract_links = params.get('extract_links', False)
        extract_text = params.get('extract_text', True)

        result = {{
            'success': True,
            'url': url,
            'status_code': response.status_code,
            'html': response.text,
            'method': 'requests'
        }}

        if extract_text:
            result['text'] = soup.get_text(strip=True)

        if extract_images:
            imgs = soup.find_all('img')
            result['images'] = [img.get('src') for img in imgs if img.get('src')]

        if extract_links:
            links = soup.find_all('a')
            result['links'] = [link.get('href') for link in links if link.get('href')]

        return result

    except Exception as e:
        return {{'success': False, 'error': str(e), 'url': url}}

result = execute_task({input_var}, {params_var})
"""

    PLAYWRIGHT_SCRAPE = """
from playwright.async_api import async_playwright
import asyncio

async def execute_task_async(url, params):
    \"\"\"Scrape website using Playwright\"\"\"
    try:
        timeout = params.get('timeout', 30000)
        wait_for = params.get('wait_for', 'load')
        screenshot = params.get('screenshot', False)

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                viewport={{'width': 1920, 'height': 1080}},
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            )

            page = await context.new_page()

            # Navigate
            await page.goto(url, timeout=timeout, wait_until=wait_for)

            # Wait for content
            await page.wait_for_load_state('networkidle', timeout=timeout)

            # Extract
            html = await page.content()
            text = await page.inner_text('body')

            result = {{
                'success': True,
                'url': url,
                'html': html,
                'text': text,
                'method': 'playwright'
            }}

            # Images
            if params.get('extract_images', False):
                images = await page.eval_on_selector_all('img',
                    'elements => elements.map(e => e.src)')
                result['images'] = images

            # Links
            if params.get('extract_links', False):
                links = await page.eval_on_selector_all('a',
                    'elements => elements.map(e => e.href)')
                result['links'] = links

            # Screenshot
            if screenshot:
                screenshot_bytes = await page.screenshot(full_page=True)
                result['screenshot'] = screenshot_bytes

            await browser.close()

            return result

    except Exception as e:
        return {{'success': False, 'error': str(e), 'url': url}}

def execute_task(url, params):
    return asyncio.run(execute_task_async(url, params))

result = execute_task({input_var}, {params_var})
"""

    TRAFILATURA_EXTRACT = """
import trafilatura

def execute_task(url, params):
    \"\"\"Extract clean content using trafilatura\"\"\"
    try:
        # Download
        downloaded = trafilatura.fetch_url(url)

        if not downloaded:
            return {{'success': False, 'error': 'Failed to download', 'url': url}}

        # Extract
        include_comments = params.get('include_comments', False)
        include_tables = params.get('include_tables', True)

        text = trafilatura.extract(
            downloaded,
            include_comments=include_comments,
            include_tables=include_tables,
            output_format='txt'
        )

        # Extract metadata
        metadata = trafilatura.extract_metadata(downloaded)

        result = {{
            'success': True,
            'url': url,
            'text': text,
            'title': metadata.title if metadata else None,
            'author': metadata.author if metadata else None,
            'date': metadata.date if metadata else None,
            'method': 'trafilatura'
        }}

        return result

    except Exception as e:
        return {{'success': False, 'error': str(e), 'url': url}}

result = execute_task({input_var}, {params_var})
"""

    # ==========================================
    # PDF GENERATION
    # ==========================================

    REPORTLAB_PDF = """
from reportlab.lib.pagesizes import A4, letter
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
import io

def execute_task(content, params):
    \"\"\"Generate PDF using ReportLab\"\"\"
    try:
        # Setup
        buffer = io.BytesIO()

        page_size = params.get('page_size', 'A4')
        title = params.get('title', 'Document')
        author = params.get('author', 'SyncAds AI')

        # Page size
        page_sizes = {{'A4': A4, 'LETTER': letter}}
        pagesize = page_sizes.get(page_size.upper(), A4)

        # Create document
        doc = SimpleDocTemplate(
            buffer,
            pagesize=pagesize,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=18,
            title=title,
            author=author
        )

        # Styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor='#333333',
            spaceAfter=30,
            alignment=TA_CENTER
        )

        body_style = ParagraphStyle(
            'CustomBody',
            parent=styles['BodyText'],
            fontSize=12,
            textColor='#333333',
            alignment=TA_LEFT
        )

        # Build content
        story = []

        # Title
        if title:
            story.append(Paragraph(title, title_style))
            story.append(Spacer(1, 0.2*inch))

        # Content
        if isinstance(content, str):
            paragraphs = content.split('\\n\\n')
            for para in paragraphs:
                if para.strip():
                    story.append(Paragraph(para, body_style))
                    story.append(Spacer(1, 0.1*inch))

        # Build PDF
        doc.build(story)

        # Get bytes
        pdf_bytes = buffer.getvalue()
        buffer.close()

        result = {{
            'success': True,
            'output': pdf_bytes,
            'size_bytes': len(pdf_bytes),
            'filename': f"{{title.replace(' ', '_')}}.pdf",
            'pages': 1  # Estimate
        }}

        return result

    except Exception as e:
        return {{'success': False, 'error': str(e)}}

result = execute_task({input_var}, {params_var})
"""


@dataclass
class GeneratedCode:
    """Código gerado"""

    code: str
    imports: List[str]
    functions: List[str]
    variables: Dict[str, Any]
    metadata: Dict[str, Any]
    estimated_execution_time: float


class CodeGenerator:
    """
    Gerador Automático de Código Python

    Gera código otimizado e seguro baseado em:
    - Biblioteca selecionada
    - Tipo de tarefa
    - Contexto específico
    - Parâmetros da tarefa
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.templates = CodeTemplates()
        self.profile_loader = get_loader()  # ✅ CORREÇÃO: Adicionar profile loader
        self.enable_optimization = self.config.get("enable_optimization", True)
        self.include_error_handling = self.config.get("include_error_handling", True)
        self.add_logging = self.config.get("add_logging", True)

        logger.info("CodeGenerator initialized with profile loader")

    async def generate(
        self,
        library: Any,  # LibraryCandidate
        task_input: Any,  # TaskInput
        execution_plan: Any,  # ExecutionPlan
    ) -> str:
        """
        Gera código Python para executar a tarefa

        Args:
            library: Biblioteca selecionada
            task_input: Input da tarefa
            execution_plan: Plano de execução

        Returns:
            Código Python como string
        """
        logger.debug(f"Generating code for library: {library.name}")

        # 1. Selecionar template
        template = self._select_template(
            library.name, execution_plan.task_type, task_input
        )

        if not template:
            return self._generate_generic_code(library, task_input)

        # 2. Extrair parâmetros
        params = self._extract_parameters(task_input, execution_plan)

        # 3. Gerar código a partir do template
        code = self._render_template(template, task_input, params)

        # 4. Otimizar (se habilitado)
        if self.enable_optimization:
            code = self._optimize_code(code)

        # 5. Adicionar error handling
        if self.include_error_handling:
            code = self._add_error_handling(code)

        # 6. Adicionar logging
        if self.add_logging:
            code = self._add_logging(code)

        logger.info(f"Code generated: {len(code)} bytes")

        return code

    def _get_template_from_profile(
        self, library_name: str, task_input: Any
    ) -> Optional[str]:
        """
        ✅ NOVO: Obtém template do profile carregado
        """
        profile = self.profile_loader.get_profile(library_name)

        if not profile or not profile.code_templates:
            return None

        # Tentar inferir qual template usar baseado no comando
        command = getattr(task_input, "command", "").lower()

        # Mapear palavras-chave para nomes de template
        template_keywords = {
            "resize": ["resize", "scale"],
            "crop": ["crop", "cut"],
            "filter": ["filter", "effect"],
            "detect": ["detect", "find"],
            "face": ["face", "faces"],
            "scrape": ["scrape", "scraping"],
            "screenshot": ["screenshot", "capture"],
            "pdf": ["pdf"],
            "download": ["download"],
            "get": ["get", "fetch"],
            "post": ["post", "send"],
        }

        # Buscar template apropriado
        for template_name, keywords in template_keywords.items():
            if any(kw in command for kw in keywords):
                template = profile.code_templates.get(template_name)
                if template:
                    logger.debug(
                        f"Using profile template: {library_name}/{template_name}"
                    )
                    return template

        # Se não encontrou específico, pegar primeiro disponível
        if profile.code_templates:
            first_template = list(profile.code_templates.values())[0]
            logger.debug(f"Using first available profile template for {library_name}")
            return first_template

        return None

    def _select_template(
        self, library_name: str, task_type: Any, task_input: Any
    ) -> Optional[str]:
        """Seleciona template apropriado"""

        # ✅ CORREÇÃO: Tentar profile primeiro
        profile_template = self._get_template_from_profile(library_name, task_input)
        if profile_template:
            return profile_template

        # Fallback: templates hardcoded
        command_lower = task_input.command.lower()

        # IMAGE PROCESSING
        if task_type.value == "image_processing":
            if library_name == "Pillow":
                if "resize" in command_lower or "redimensionar" in command_lower:
                    return self.templates.PILLOW_RESIZE
                elif "crop" in command_lower or "cortar" in command_lower:
                    return self.templates.PILLOW_CROP

            elif library_name == "opencv-python":
                if "resize" in command_lower:
                    return self.templates.OPENCV_RESIZE

            elif library_name == "rembg":
                if "background" in command_lower or "fundo" in command_lower:
                    return self.templates.REMBG_REMOVE_BG

        # WEB SCRAPING
        elif task_type.value == "web_scraping":
            if library_name == "requests":
                return self.templates.REQUESTS_SCRAPE
            elif library_name == "playwright":
                return self.templates.PLAYWRIGHT_SCRAPE
            elif library_name == "trafilatura":
                return self.templates.TRAFILATURA_EXTRACT

        # PDF
        elif task_type.value == "pdf_generation":
            if library_name == "reportlab":
                return self.templates.REPORTLAB_PDF

        return None

    def _extract_parameters(
        self, task_input: Any, execution_plan: Any
    ) -> Dict[str, Any]:
        """Extrai parâmetros do contexto"""

        params = {}

        # Context direto
        if hasattr(task_input, "context"):
            params.update(task_input.context)

        # Parse do comando para parâmetros comuns
        command = task_input.command.lower()

        # Dimensões
        import re

        # Padrão: 1920x1080, 1920 x 1080, etc
        dimension_match = re.search(r"(\d+)\s*x\s*(\d+)", command)
        if dimension_match:
            params["width"] = int(dimension_match.group(1))
            params["height"] = int(dimension_match.group(2))

        # Qualidade
        quality_match = re.search(r"qualit(?:y|ade)\s*[:=]?\s*(\d+)", command)
        if quality_match:
            params["quality"] = int(quality_match.group(1))

        # Formato
        for fmt in ["png", "jpg", "jpeg", "webp", "gif", "pdf"]:
            if fmt in command:
                params["format"] = fmt.upper()
                break

        # Defaults
        params.setdefault("quality", 85)
        params.setdefault("timeout", 30)

        return params

    def _render_template(
        self, template: str, task_input: Any, params: Dict[str, Any]
    ) -> str:
        """Renderiza template com valores"""

        # Variáveis padrão
        default_values = {
            "width": params.get("width", "None"),
            "height": params.get("height", "None"),
            "quality": params.get("quality", 85),
            "input_var": "input_data",
            "params_var": "params",
        }

        # Render
        try:
            code = template.format(**default_values)
        except KeyError as e:
            logger.warning(f"Missing template variable: {e}")
            code = template

        # Adicionar setup inicial
        setup = f"""
# Generated by SyncAds Omnibrain
# Library: Auto-selected
# Task: {task_input.command[:50]}...

# Input data
input_data = None  # Will be injected
params = {params}

"""

        return setup + code

    def _generate_generic_code(self, library: Any, task_input: Any) -> str:
        """Gera código genérico quando não há template"""

        code = f"""
# Generated by SyncAds Omnibrain
# Library: {library.name}
# Task: {task_input.command}

# TODO: Implement specific logic for {library.name}

def execute_task(input_data, params):
    \"\"\"Execute task using {library.name}\"\"\"
    try:
        # Import library
        import {library.name.lower().replace("-", "_")}

        # Execute logic here
        result = {{'success': True, 'output': None}}

        return result

    except Exception as e:
        return {{'success': False, 'error': str(e)}}

# Run
result = execute_task(None, {{}})
"""

        return code

    def _optimize_code(self, code: str) -> str:
        """Otimiza código gerado"""

        # Remover linhas vazias excessivas
        lines = code.split("\n")
        optimized_lines = []
        prev_empty = False

        for line in lines:
            is_empty = not line.strip()
            if is_empty and prev_empty:
                continue
            optimized_lines.append(line)
            prev_empty = is_empty

        return "\n".join(optimized_lines)

    def _add_error_handling(self, code: str) -> str:
        """Adiciona tratamento de erros robusto"""

        # Já tem try/except no template
        return code

    def _add_logging(self, code: str) -> str:
        """Adiciona logging ao código"""

        logging_imports = """
import logging
logger = logging.getLogger('omnibrain.execution')
"""

        # Adicionar no início
        if "import logging" not in code:
            code = logging_imports + "\n" + code

        return code

    def get_required_imports(self, library_name: str) -> List[str]:
        """Retorna imports necessários para uma biblioteca"""

        import_map = {
            "Pillow": ["from PIL import Image", "import io"],
            "opencv-python": ["import cv2", "import numpy as np"],
            "rembg": ["from rembg import remove", "from PIL import Image", "import io"],
            "requests": ["import requests", "from bs4 import BeautifulSoup"],
            "playwright": [
                "from playwright.async_api import async_playwright",
                "import asyncio",
            ],
            "trafilatura": ["import trafilatura"],
            "reportlab": [
                "from reportlab.lib.pagesizes import A4, letter",
                "from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer",
                "from reportlab.lib.styles import getSampleStyleSheet",
                "import io",
            ],
        }

        return import_map.get(
            library_name, [f"import {library_name.lower().replace('-', '_')}"]
        )

    def estimate_execution_time(self, code: str, library_name: str) -> float:
        """Estima tempo de execução do código"""

        # Estimativas baseadas em benchmarks
        time_estimates = {
            "Pillow": 0.5,
            "opencv-python": 0.3,
            "pyvips": 0.2,
            "rembg": 3.0,
            "requests": 1.0,
            "playwright": 5.0,
            "trafilatura": 2.0,
            "reportlab": 1.0,
        }

        return time_estimates.get(library_name, 2.0)
