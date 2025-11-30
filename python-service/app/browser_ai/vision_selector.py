"""
Vision Element Selector - Identificação de elementos usando Vision AI
Usa Claude Vision, GPT-4V ou modelos locais para encontrar elementos na página
"""

import base64
import logging
from typing import Dict, List, Literal, Optional, Tuple

try:
    import cv2
    import easyocr
    import numpy as np
    from anthropic import Anthropic
    from openai import OpenAI
    from PIL import Image
    from skimage import measure
except ImportError as e:
    logging.warning(f"Vision libraries not fully installed: {e}")

logger = logging.getLogger(__name__)


class VisionElementSelector:
    """
    Usa Vision AI para identificar elementos na página

    Suporta:
    - Claude 3.5 Sonnet Vision
    - GPT-4V
    - OCR local (EasyOCR)
    - Computer Vision local (OpenCV)
    """

    def __init__(
        self,
        default_provider: Literal["anthropic", "openai", "local"] = "anthropic",
    ):
        self.default_provider = default_provider
        self.anthropic_client = None
        self.openai_client = None
        self.ocr_reader = None

        logger.info(
            f"VisionElementSelector initialized with provider: {default_provider}"
        )

    async def find_element(
        self,
        screenshot: bytes,
        description: str,
        provider: Optional[str] = None,
        api_key: Optional[str] = None,
        confidence_threshold: float = 0.7,
    ) -> Optional[Dict[str, any]]:
        """
        Encontra elemento na screenshot usando descrição em linguagem natural

        Args:
            screenshot: Imagem da página (bytes)
            description: Descrição do elemento (ex: "botão azul de login no topo")
            provider: Provider de Vision AI (anthropic, openai, local)
            api_key: API key do provider
            confidence_threshold: Confiança mínima (0-1)

        Returns:
            {
                'x': int,          # Coordenada X
                'y': int,          # Coordenada Y
                'width': int,      # Largura do elemento
                'height': int,     # Altura do elemento
                'confidence': float,
                'method': str,     # Método usado
                'description': str # Descrição encontrada
            }
        """
        provider = provider or self.default_provider

        try:
            logger.info(f"Finding element: '{description}' using {provider}")

            if provider == "anthropic":
                return await self._find_with_claude_vision(
                    screenshot, description, api_key, confidence_threshold
                )
            elif provider == "openai":
                return await self._find_with_gpt4v(
                    screenshot, description, api_key, confidence_threshold
                )
            elif provider == "local":
                return await self._find_with_local_cv(
                    screenshot, description, confidence_threshold
                )
            else:
                raise ValueError(f"Unknown provider: {provider}")

        except Exception as e:
            logger.error(f"Failed to find element: {e}")
            return None

    async def _find_with_claude_vision(
        self,
        screenshot: bytes,
        description: str,
        api_key: Optional[str],
        confidence_threshold: float,
    ) -> Optional[Dict]:
        """Usa Claude 3.5 Sonnet Vision para encontrar elemento"""

        if not self.anthropic_client and api_key:
            self.anthropic_client = Anthropic(api_key=api_key)

        if not self.anthropic_client:
            raise ValueError("Anthropic API key required")

        # Encode screenshot para base64
        image_base64 = base64.b64encode(screenshot).decode("utf-8")

        # Criar prompt estruturado
        prompt = f"""
Analise esta screenshot de uma página web e encontre o elemento descrito.

ELEMENTO PROCURADO: {description}

INSTRUÇÕES:
1. Identifique visualmente o elemento na imagem
2. Determine as coordenadas X,Y do centro do elemento
3. Determine largura e altura aproximadas
4. Avalie sua confiança (0-100%)

RETORNE APENAS JSON NO FORMATO:
{{
  "found": true/false,
  "x": 0,
  "y": 0,
  "width": 0,
  "height": 0,
  "confidence": 0.0,
  "description": "descrição do que você viu"
}}

Se não encontrar o elemento, retorne found: false.
"""

        try:
            response = self.anthropic_client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=1024,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image",
                                "source": {
                                    "type": "base64",
                                    "media_type": "image/png",
                                    "data": image_base64,
                                },
                            },
                            {"type": "text", "text": prompt},
                        ],
                    }
                ],
            )

            # Extrair JSON da resposta
            content = response.content[0].text
            import json

            # Tentar extrair JSON
            start = content.find("{")
            end = content.rfind("}") + 1
            if start != -1 and end > start:
                result = json.loads(content[start:end])

                if (
                    result.get("found")
                    and result.get("confidence", 0) >= confidence_threshold
                ):
                    return {
                        "x": result["x"],
                        "y": result["y"],
                        "width": result.get("width", 50),
                        "height": result.get("height", 30),
                        "confidence": result["confidence"],
                        "method": "claude_vision",
                        "description": result.get("description", ""),
                    }

            logger.warning(f"Claude Vision: Element not found or low confidence")
            return None

        except Exception as e:
            logger.error(f"Claude Vision error: {e}")
            raise

    async def _find_with_gpt4v(
        self,
        screenshot: bytes,
        description: str,
        api_key: Optional[str],
        confidence_threshold: float,
    ) -> Optional[Dict]:
        """Usa GPT-4 Vision para encontrar elemento"""

        if not self.openai_client and api_key:
            self.openai_client = OpenAI(api_key=api_key)

        if not self.openai_client:
            raise ValueError("OpenAI API key required")

        # Encode screenshot
        image_base64 = base64.b64encode(screenshot).decode("utf-8")

        prompt = f"""
Analyze this webpage screenshot and locate the element described.

ELEMENT TO FIND: {description}

INSTRUCTIONS:
1. Visually identify the element
2. Determine X,Y coordinates of the element's center
3. Determine approximate width and height
4. Rate your confidence (0-100%)

RETURN ONLY JSON:
{{
  "found": true/false,
  "x": 0,
  "y": 0,
  "width": 0,
  "height": 0,
  "confidence": 0.0,
  "description": "what you see"
}}
"""

        try:
            response = self.openai_client.chat.completions.create(
                model="gpt-4-vision-preview",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/png;base64,{image_base64}"
                                },
                            },
                        ],
                    }
                ],
                max_tokens=500,
            )

            content = response.choices[0].message.content
            import json

            # Extrair JSON
            start = content.find("{")
            end = content.rfind("}") + 1
            if start != -1 and end > start:
                result = json.loads(content[start:end])

                if (
                    result.get("found")
                    and result.get("confidence", 0) >= confidence_threshold
                ):
                    return {
                        "x": result["x"],
                        "y": result["y"],
                        "width": result.get("width", 50),
                        "height": result.get("height", 30),
                        "confidence": result["confidence"],
                        "method": "gpt4v",
                        "description": result.get("description", ""),
                    }

            return None

        except Exception as e:
            logger.error(f"GPT-4V error: {e}")
            raise

    async def _find_with_local_cv(
        self, screenshot: bytes, description: str, confidence_threshold: float
    ) -> Optional[Dict]:
        """
        Usa Computer Vision local (OpenCV + OCR) para encontrar elemento
        Mais rápido mas menos inteligente que modelos de Vision AI
        """

        try:
            # Converter bytes para imagem OpenCV
            nparr = np.frombuffer(screenshot, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            # Se descrição menciona texto, usar OCR
            if any(
                word in description.lower()
                for word in ["texto", "text", "botão", "button", "link"]
            ):
                result = await self._find_with_ocr(img, description)
                if result and result["confidence"] >= confidence_threshold:
                    return result

            # Tentar detecção de componentes visuais
            result = await self._find_with_component_detection(img, description)
            if result and result["confidence"] >= confidence_threshold:
                return result

            return None

        except Exception as e:
            logger.error(f"Local CV error: {e}")
            return None

    async def _find_with_ocr(self, img: np.ndarray, description: str) -> Optional[Dict]:
        """Usa OCR para encontrar texto na imagem"""

        if not self.ocr_reader:
            logger.info("Initializing EasyOCR...")
            self.ocr_reader = easyocr.Reader(["pt", "en"])

        try:
            # Executar OCR
            results = self.ocr_reader.readtext(img)

            # Procurar por texto na descrição
            search_terms = self._extract_search_terms(description)

            for bbox, text, confidence in results:
                text_lower = text.lower()

                # Verificar se algum termo está no texto
                if any(term in text_lower for term in search_terms):
                    # Calcular centro do bbox
                    x_coords = [point[0] for point in bbox]
                    y_coords = [point[1] for point in bbox]

                    x = int(sum(x_coords) / len(x_coords))
                    y = int(sum(y_coords) / len(y_coords))
                    width = int(max(x_coords) - min(x_coords))
                    height = int(max(y_coords) - min(y_coords))

                    return {
                        "x": x,
                        "y": y,
                        "width": width,
                        "height": height,
                        "confidence": confidence,
                        "method": "ocr",
                        "description": f"Found text: {text}",
                    }

            return None

        except Exception as e:
            logger.error(f"OCR error: {e}")
            return None

    async def _find_with_component_detection(
        self, img: np.ndarray, description: str
    ) -> Optional[Dict]:
        """Detecta componentes visuais (botões, inputs, etc)"""

        try:
            # Converter para grayscale
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

            # Detectar bordas
            edges = cv2.Canny(gray, 50, 150)

            # Encontrar contornos
            contours, _ = cv2.findContours(
                edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
            )

            # Filtrar por características da descrição
            color_filter = self._extract_color(description)
            size_filter = self._extract_size(description)

            candidates = []

            for contour in contours:
                # Calcular bounding box
                x, y, w, h = cv2.boundingRect(contour)

                # Filtros básicos
                if w < 20 or h < 10:  # Muito pequeno
                    continue
                if w > img.shape[1] * 0.8:  # Muito largo
                    continue

                # Extrair região
                roi = img[y : y + h, x : x + w]

                # Calcular cor dominante
                dominant_color = self._get_dominant_color(roi)

                # Score baseado em matches
                score = 0.5  # Base

                if color_filter and self._color_matches(dominant_color, color_filter):
                    score += 0.3

                if size_filter and self._size_matches((w, h), size_filter):
                    score += 0.2

                candidates.append(
                    {
                        "x": x + w // 2,
                        "y": y + h // 2,
                        "width": w,
                        "height": h,
                        "confidence": score,
                        "color": dominant_color,
                    }
                )

            # Retornar melhor candidato
            if candidates:
                best = max(candidates, key=lambda c: c["confidence"])
                return {
                    "x": best["x"],
                    "y": best["y"],
                    "width": best["width"],
                    "height": best["height"],
                    "confidence": best["confidence"],
                    "method": "component_detection",
                    "description": f"Detected component at ({best['x']}, {best['y']})",
                }

            return None

        except Exception as e:
            logger.error(f"Component detection error: {e}")
            return None

    def _extract_search_terms(self, description: str) -> List[str]:
        """Extrai termos de busca da descrição"""
        # Remove palavras comuns
        stop_words = {
            "o",
            "a",
            "de",
            "da",
            "do",
            "com",
            "em",
            "no",
            "na",
            "the",
            "a",
            "an",
        }

        words = description.lower().split()
        terms = [w for w in words if w not in stop_words and len(w) > 2]

        return terms

    def _extract_color(self, description: str) -> Optional[str]:
        """Extrai cor da descrição"""
        colors = {
            "azul": "blue",
            "vermelho": "red",
            "verde": "green",
            "amarelo": "yellow",
            "preto": "black",
            "branco": "white",
            "cinza": "gray",
            "blue": "blue",
            "red": "red",
            "green": "green",
        }

        desc_lower = description.lower()
        for pt, en in colors.items():
            if pt in desc_lower:
                return en

        return None

    def _extract_size(self, description: str) -> Optional[str]:
        """Extrai tamanho da descrição"""
        if any(word in description.lower() for word in ["grande", "large", "big"]):
            return "large"
        if any(word in description.lower() for word in ["pequeno", "small", "tiny"]):
            return "small"
        return None

    def _get_dominant_color(self, roi: np.ndarray) -> str:
        """Calcula cor dominante na região"""
        # Converter para HSV
        hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)

        # Calcular média
        h_mean = np.mean(hsv[:, :, 0])

        # Mapear hue para cor
        if h_mean < 15 or h_mean > 165:
            return "red"
        elif h_mean < 45:
            return "yellow"
        elif h_mean < 75:
            return "green"
        elif h_mean < 135:
            return "blue"
        else:
            return "purple"

    def _color_matches(self, detected: str, expected: str) -> bool:
        """Verifica se cores correspondem"""
        return detected == expected

    def _size_matches(self, detected: Tuple[int, int], expected: str) -> bool:
        """Verifica se tamanho corresponde"""
        w, h = detected
        area = w * h

        if expected == "large":
            return area > 10000
        elif expected == "small":
            return area < 2000

        return True


# Funções auxiliares para uso rápido


async def find_element_by_vision(
    screenshot: bytes,
    description: str,
    provider: str = "anthropic",
    api_key: Optional[str] = None,
) -> Optional[Dict]:
    """
    Função helper para encontrar elemento rapidamente

    Exemplo:
    >>> element = await find_element_by_vision(
    ...     screenshot=page_screenshot,
    ...     description="botão azul de login no topo direito",
    ...     provider="anthropic",
    ...     api_key="sk-..."
    ... )
    >>> if element:
    ...     print(f"Found at: ({element['x']}, {element['y']})")
    """
    selector = VisionElementSelector(default_provider=provider)
    return await selector.find_element(screenshot, description, api_key=api_key)


async def find_text_by_ocr(screenshot: bytes, text: str) -> Optional[Dict]:
    """
    Função helper para encontrar texto via OCR

    Exemplo:
    >>> coords = await find_text_by_ocr(screenshot, "Login")
    """
    selector = VisionElementSelector(default_provider="local")
    return await selector._find_with_ocr(
        cv2.imdecode(np.frombuffer(screenshot, np.uint8), cv2.IMREAD_COLOR), text
    )
