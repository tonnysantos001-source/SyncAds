"""
============================================
SYNCADS PYTHON MICROSERVICE - IMAGES ROUTER
============================================
Router para processamento de imagens
Redimensionar, otimizar, converter, filtros
============================================
"""

import base64
import io
import os
from typing import Any, Dict, List, Optional, Tuple

import cv2
import numpy as np
from fastapi import APIRouter, File, HTTPException, UploadFile
from loguru import logger
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageOps
from pydantic import BaseModel, Field
from rembg import remove

router = APIRouter()


# ==========================================
# MODELS
# ==========================================


class ImageProcessRequest(BaseModel):
    """Request para processar imagem"""

    image_base64: str = Field(..., description="Imagem em base64")
    operation: str = Field(..., description="Operação: resize, optimize, filter, etc")
    params: Optional[Dict[str, Any]] = Field(None, description="Parâmetros da operação")


class ImageResizeRequest(BaseModel):
    """Request para redimensionar imagem"""

    image_base64: str
    width: Optional[int] = None
    height: Optional[int] = None
    maintain_aspect: bool = True
    quality: int = 85


class ImageOptimizeRequest(BaseModel):
    """Request para otimizar imagem"""

    image_base64: str
    max_width: int = 1920
    max_height: int = 1080
    quality: int = 85
    format: str = "JPEG"


class ImageFilterRequest(BaseModel):
    """Request para aplicar filtro"""

    image_base64: str
    filter_type: str = Field(
        ...,
        description="Tipo: blur, sharpen, grayscale, sepia, vintage, contrast, brightness",
    )
    intensity: float = 1.0


class ImageRemoveBgRequest(BaseModel):
    """Request para remover background"""

    image_base64: str


class ImageCropRequest(BaseModel):
    """Request para crop"""

    image_base64: str
    x: int
    y: int
    width: int
    height: int


class ImageResponse(BaseModel):
    """Response de imagem"""

    success: bool
    image_base64: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    format: Optional[str] = None
    size_bytes: Optional[int] = None
    original_size_bytes: Optional[int] = None
    compression_ratio: Optional[float] = None
    error: Optional[str] = None


# ==========================================
# ENDPOINTS
# ==========================================


@router.post("/resize", response_model=ImageResponse)
async def resize_image(request: ImageResizeRequest):
    """
    Redimensiona imagem mantendo ou não proporção
    """
    try:
        logger.info(f"🖼️ Redimensionando imagem para {request.width}x{request.height}")

        # Decodificar imagem
        img = decode_base64_image(request.image_base64)
        original_size = len(base64.b64decode(request.image_base64))

        # Calcular novas dimensões
        if request.maintain_aspect:
            img.thumbnail(
                (request.width or img.width, request.height or img.height),
                Image.Resampling.LANCZOS,
            )
        else:
            img = img.resize(
                (request.width or img.width, request.height or img.height),
                Image.Resampling.LANCZOS,
            )

        # Converter para base64
        img_base64, img_bytes = encode_image_to_base64(img, quality=request.quality)

        return ImageResponse(
            success=True,
            image_base64=img_base64,
            width=img.width,
            height=img.height,
            format=img.format,
            size_bytes=len(img_bytes),
            original_size_bytes=original_size,
            compression_ratio=round(len(img_bytes) / original_size, 2),
        )

    except Exception as e:
        logger.error(f"❌ Erro ao redimensionar: {str(e)}")
        return ImageResponse(success=False, error=str(e))


@router.post("/optimize", response_model=ImageResponse)
async def optimize_image(request: ImageOptimizeRequest):
    """
    Otimiza imagem para web (reduz tamanho mantendo qualidade)
    """
    try:
        logger.info("⚡ Otimizando imagem para web")

        # Decodificar
        img = decode_base64_image(request.image_base64)
        original_size = len(base64.b64decode(request.image_base64))

        # Redimensionar se necessário
        if img.width > request.max_width or img.height > request.max_height:
            img.thumbnail(
                (request.max_width, request.max_height), Image.Resampling.LANCZOS
            )

        # Converter para RGB se necessário
        if img.mode in ("RGBA", "LA", "P"):
            background = Image.new("RGB", img.size, (255, 255, 255))
            if img.mode == "P":
                img = img.convert("RGBA")
            background.paste(img, mask=img.split()[-1] if img.mode == "RGBA" else None)
            img = background

        # Otimizar
        img_base64, img_bytes = encode_image_to_base64(
            img, format=request.format, quality=request.quality, optimize=True
        )

        return ImageResponse(
            success=True,
            image_base64=img_base64,
            width=img.width,
            height=img.height,
            format=request.format,
            size_bytes=len(img_bytes),
            original_size_bytes=original_size,
            compression_ratio=round(len(img_bytes) / original_size, 2),
        )

    except Exception as e:
        logger.error(f"❌ Erro ao otimizar: {str(e)}")
        return ImageResponse(success=False, error=str(e))


@router.post("/filter", response_model=ImageResponse)
async def apply_filter(request: ImageFilterRequest):
    """
    Aplica filtros na imagem
    """
    try:
        logger.info(f"🎨 Aplicando filtro: {request.filter_type}")

        # Decodificar
        img = decode_base64_image(request.image_base64)

        # Aplicar filtro
        if request.filter_type == "blur":
            img = img.filter(ImageFilter.GaussianBlur(radius=request.intensity * 5))

        elif request.filter_type == "sharpen":
            img = img.filter(ImageFilter.SHARPEN)
            if request.intensity > 1:
                for _ in range(int(request.intensity) - 1):
                    img = img.filter(ImageFilter.SHARPEN)

        elif request.filter_type == "grayscale":
            img = ImageOps.grayscale(img)

        elif request.filter_type == "sepia":
            img = apply_sepia(img, request.intensity)

        elif request.filter_type == "vintage":
            img = apply_vintage(img)

        elif request.filter_type == "contrast":
            enhancer = ImageEnhance.Contrast(img)
            img = enhancer.enhance(request.intensity)

        elif request.filter_type == "brightness":
            enhancer = ImageEnhance.Brightness(img)
            img = enhancer.enhance(request.intensity)

        elif request.filter_type == "saturation":
            enhancer = ImageEnhance.Color(img)
            img = enhancer.enhance(request.intensity)

        else:
            raise ValueError(f"Filtro desconhecido: {request.filter_type}")

        # Converter para base64
        img_base64, img_bytes = encode_image_to_base64(img)

        return ImageResponse(
            success=True,
            image_base64=img_base64,
            width=img.width,
            height=img.height,
            format=img.format,
            size_bytes=len(img_bytes),
        )

    except Exception as e:
        logger.error(f"❌ Erro ao aplicar filtro: {str(e)}")
        return ImageResponse(success=False, error=str(e))


@router.post("/remove-background", response_model=ImageResponse)
async def remove_background(request: ImageRemoveBgRequest):
    """
    Remove background da imagem usando rembg
    """
    try:
        logger.info("🎭 Removendo background")

        # Decodificar
        img_bytes = base64.b64decode(request.image_base64)

        # Remover background
        output_bytes = remove(img_bytes)

        # Converter para PIL Image
        img = Image.open(io.BytesIO(output_bytes))

        # Converter para base64
        img_base64 = base64.b64encode(output_bytes).decode()

        return ImageResponse(
            success=True,
            image_base64=img_base64,
            width=img.width,
            height=img.height,
            format="PNG",
            size_bytes=len(output_bytes),
        )

    except Exception as e:
        logger.error(f"❌ Erro ao remover background: {str(e)}")
        return ImageResponse(success=False, error=str(e))


@router.post("/crop", response_model=ImageResponse)
async def crop_image(request: ImageCropRequest):
    """
    Faz crop da imagem
    """
    try:
        logger.info(f"✂️ Crop: {request.x},{request.y} {request.width}x{request.height}")

        # Decodificar
        img = decode_base64_image(request.image_base64)

        # Crop
        box = (
            request.x,
            request.y,
            request.x + request.width,
            request.y + request.height,
        )
        img = img.crop(box)

        # Converter para base64
        img_base64, img_bytes = encode_image_to_base64(img)

        return ImageResponse(
            success=True,
            image_base64=img_base64,
            width=img.width,
            height=img.height,
            format=img.format,
            size_bytes=len(img_bytes),
        )

    except Exception as e:
        logger.error(f"❌ Erro ao fazer crop: {str(e)}")
        return ImageResponse(success=False, error=str(e))


@router.post("/convert")
async def convert_format(image_base64: str, target_format: str = "PNG"):
    """
    Converte formato da imagem
    """
    try:
        logger.info(f"🔄 Convertendo para {target_format}")

        # Decodificar
        img = decode_base64_image(image_base64)

        # Converter
        img_base64, img_bytes = encode_image_to_base64(img, format=target_format)

        return ImageResponse(
            success=True,
            image_base64=img_base64,
            width=img.width,
            height=img.height,
            format=target_format,
            size_bytes=len(img_bytes),
        )

    except Exception as e:
        logger.error(f"❌ Erro ao converter: {str(e)}")
        return ImageResponse(success=False, error=str(e))


@router.post("/watermark")
async def add_watermark(
    image_base64: str,
    text: str,
    position: str = "bottom-right",
    opacity: float = 0.5,
):
    """
    Adiciona marca d'água na imagem
    """
    try:
        logger.info(f"💧 Adicionando watermark: {text}")

        # Decodificar
        img = decode_base64_image(image_base64)

        # Criar camada de watermark
        watermark = Image.new("RGBA", img.size, (255, 255, 255, 0))
        draw = ImageDraw.Draw(watermark)

        # Posição do texto
        text_width = len(text) * 10  # Aproximado
        text_height = 20

        if position == "bottom-right":
            x = img.width - text_width - 20
            y = img.height - text_height - 20
        elif position == "bottom-left":
            x = 20
            y = img.height - text_height - 20
        elif position == "top-right":
            x = img.width - text_width - 20
            y = 20
        elif position == "top-left":
            x = 20
            y = 20
        else:  # center
            x = (img.width - text_width) // 2
            y = (img.height - text_height) // 2

        # Desenhar texto
        alpha = int(255 * opacity)
        draw.text((x, y), text, fill=(255, 255, 255, alpha))

        # Combinar
        if img.mode != "RGBA":
            img = img.convert("RGBA")
        img = Image.alpha_composite(img, watermark)

        # Converter para base64
        img_base64, img_bytes = encode_image_to_base64(img)

        return ImageResponse(
            success=True,
            image_base64=img_base64,
            width=img.width,
            height=img.height,
            size_bytes=len(img_bytes),
        )

    except Exception as e:
        logger.error(f"❌ Erro ao adicionar watermark: {str(e)}")
        return ImageResponse(success=False, error=str(e))


# ==========================================
# HELPER FUNCTIONS
# ==========================================


def decode_base64_image(base64_string: str) -> Image.Image:
    """Decodifica imagem base64 para PIL Image"""
    img_bytes = base64.b64decode(base64_string)
    img = Image.open(io.BytesIO(img_bytes))
    return img


def encode_image_to_base64(
    img: Image.Image, format: str = None, quality: int = 85, optimize: bool = False
) -> Tuple[str, bytes]:
    """Codifica PIL Image para base64"""
    buffer = io.BytesIO()

    # Usar formato original se não especificado
    if format is None:
        format = img.format or "PNG"

    # Salvar
    save_kwargs = {"format": format}
    if format in ("JPEG", "JPG"):
        save_kwargs["quality"] = quality
        save_kwargs["optimize"] = optimize
    elif format == "PNG":
        save_kwargs["optimize"] = optimize

    img.save(buffer, **save_kwargs)
    img_bytes = buffer.getvalue()
    img_base64 = base64.b64encode(img_bytes).decode()

    return img_base64, img_bytes


def apply_sepia(img: Image.Image, intensity: float = 1.0) -> Image.Image:
    """Aplica filtro sepia"""
    img = img.convert("RGB")
    pixels = img.load()

    for i in range(img.width):
        for j in range(img.height):
            r, g, b = pixels[i, j]

            tr = int(0.393 * r + 0.769 * g + 0.189 * b)
            tg = int(0.349 * r + 0.686 * g + 0.168 * b)
            tb = int(0.272 * r + 0.534 * g + 0.131 * b)

            # Aplicar intensidade
            tr = int(r + (tr - r) * intensity)
            tg = int(g + (tg - g) * intensity)
            tb = int(b + (tb - b) * intensity)

            # Clamping
            pixels[i, j] = (min(tr, 255), min(tg, 255), min(tb, 255))

    return img


def apply_vintage(img: Image.Image) -> Image.Image:
    """Aplica filtro vintage"""
    # Sepia
    img = apply_sepia(img, 0.8)

    # Reduzir contraste
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(0.9)

    # Reduzir saturação
    enhancer = ImageEnhance.Color(img)
    img = enhancer.enhance(0.7)

    # Adicionar vinheta
    img = add_vignette(img)

    return img


def add_vignette(img: Image.Image, intensity: float = 0.5) -> Image.Image:
    """Adiciona efeito vinheta"""
    # Criar máscara radial
    width, height = img.size
    mask = Image.new("L", (width, height), 0)
    draw = ImageDraw.Draw(mask)

    # Desenhar gradiente radial
    for i in range(min(width, height) // 2):
        alpha = int(255 * (1 - i / (min(width, height) // 2)) * intensity)
        draw.ellipse(
            [i, i, width - i, height - i],
            fill=alpha,
        )

    # Aplicar máscara
    if img.mode != "RGB":
        img = img.convert("RGB")

    dark = Image.new("RGB", img.size, (0, 0, 0))
    img = Image.composite(img, dark, mask)

    return img


@router.get("/test")
async def test_images():
    """Teste do router de imagens"""
    return {
        "status": "ok",
        "message": "Images router funcionando!",
        "available_filters": [
            "blur",
            "sharpen",
            "grayscale",
            "sepia",
            "vintage",
            "contrast",
            "brightness",
            "saturation",
        ],
        "operations": [
            "resize",
            "optimize",
            "filter",
            "remove-background",
            "crop",
            "convert",
            "watermark",
        ],
    }
