# Pillow (PIL)

## Informações Básicas

- **Nome:** Pillow
- **Categoria:** Image Processing
- **Versão Mínima:** 8.0.0
- **Versão Recomendada:** 10.2.0+
- **Licença:** HPND (Historical Permission Notice and Disclaimer)
- **Documentação:** https://pillow.readthedocs.io/

## Descrição

Pillow é a biblioteca Python mais popular e amigável para processamento de imagens. É um fork do PIL (Python Imaging Library) e oferece uma API simples e intuitiva para operações comuns de imagem como resize, crop, rotate, filter, format conversion e muito mais.

## Casos de Uso Prioritários

1. **Resize/Scale de Imagens** (confidence: 0.98)
2. **Crop de Imagens** (confidence: 0.95)
3. **Conversão de Formato** (confidence: 0.95)
4. **Rotação de Imagens** (confidence: 0.95)
5. **Aplicar Filtros Básicos** (confidence: 0.90)
6. **Criar Thumbnails** (confidence: 0.95)
7. **Adicionar Texto/Watermark** (confidence: 0.90)
8. **Manipulação de Cores** (confidence: 0.90)

## Prós

- ✅ API extremamente simples e intuitiva
- ✅ Documentação excelente
- ✅ Amplamente usado e testado
- ✅ Suporte a todos os formatos comuns (JPEG, PNG, GIF, BMP, TIFF, WebP)
- ✅ Instalação leve (~5MB)
- ✅ Compatível com NumPy
- ✅ Pure Python (fácil debug)
- ✅ Comunidade gigante
- ✅ Mantido ativamente
- ✅ Zero curva de aprendizado

## Contras

- ⚠️ Não é o mais rápido (C++ é mais lento que OpenCV)
- ⚠️ Limitado para computer vision avançada
- ⚠️ Não otimizado para imagens gigantes (>100MB)
- ⚠️ Sem GPU acceleration nativo
- ⚠️ Sem suporte a vídeo
- ⚠️ Performance inferior em batch processing

## Performance

- **Velocidade:** ⭐⭐⭐⭐ (7/10)
- **Uso de Memória:** ⭐⭐⭐⭐ (8/10)
- **Qualidade de Output:** ⭐⭐⭐⭐ (8.5/10)
- **Facilidade de Uso:** ⭐⭐⭐⭐⭐ (10/10)

## Instalação

```bash
pip install Pillow
```

## Keywords/Triggers

- pillow
- pil
- image
- imagem
- resize
- redimensionar
- crop
- cortar
- rotate
- girar
- thumbnail
- convert
- converter
- filter
- filtro
- watermark
- marca d'agua

## Exemplos de Código

### Básico: Resize Simples

```python
from PIL import Image

def resize_image(input_path: str, output_path: str, width: int, height: int):
    # Abrir imagem
    img = Image.open(input_path)
    
    # Redimensionar
    img_resized = img.resize((width, height), Image.Resampling.LANCZOS)
    
    # Salvar
    img_resized.save(output_path, quality=95, optimize=True)
    
    return {
        "original_size": img.size,
        "new_size": img_resized.size,
        "output_path": output_path
    }
```

### Intermediário: Crop e Thumbnail

```python
from PIL import Image

def create_thumbnail(input_path: str, output_path: str, max_size: tuple = (200, 200)):
    img = Image.open(input_path)
    
    # Criar thumbnail mantendo aspect ratio
    img.thumbnail(max_size, Image.Resampling.LANCZOS)
    
    # Salvar
    img.save(output_path, quality=85, optimize=True)
    
    return {
        "thumbnail_size": img.size,
        "output_path": output_path
    }

def crop_image(input_path: str, output_path: str, box: tuple):
    """
    box: (left, top, right, bottom)
    Exemplo: (100, 100, 400, 400) - corta região 300x300 começando em 100,100
    """
    img = Image.open(input_path)
    
    # Crop
    img_cropped = img.crop(box)
    
    # Salvar
    img_cropped.save(output_path, quality=95)
    
    return {
        "cropped_size": img_cropped.size,
        "output_path": output_path
    }
```

### Avançado: Conversão de Formato e Otimização

```python
from PIL import Image
import io

def convert_and_optimize(input_path: str, output_format: str = "WEBP", quality: int = 85):
    img = Image.open(input_path)
    
    # Converter para RGB se necessário (para JPEG/WEBP)
    if img.mode in ("RGBA", "P"):
        if output_format.upper() in ["JPEG", "JPG"]:
            # JPEG não suporta transparência
            background = Image.new("RGB", img.size, (255, 255, 255))
            background.paste(img, mask=img.split()[3] if img.mode == "RGBA" else None)
            img = background
        elif output_format.upper() == "WEBP":
            # WebP suporta transparência
            img = img.convert("RGBA")
    
    # Salvar em bytes
    output_buffer = io.BytesIO()
    img.save(output_buffer, format=output_format.upper(), quality=quality, optimize=True)
    
    output_size = output_buffer.tell()
    
    return {
        "format": output_format.upper(),
        "size_bytes": output_size,
        "size_kb": round(output_size / 1024, 2),
        "dimensions": img.size,
        "mode": img.mode
    }
```

### Expert: Adicionar Watermark

```python
from PIL import Image, ImageDraw, ImageFont

def add_watermark(
    input_path: str, 
    output_path: str, 
    watermark_text: str,
    position: str = "bottom-right",
    opacity: int = 128
):
    # Abrir imagem
    img = Image.open(input_path).convert("RGBA")
    
    # Criar layer transparente para watermark
    watermark_layer = Image.new("RGBA", img.size, (255, 255, 255, 0))
    draw = ImageDraw.Draw(watermark_layer)
    
    # Fonte (usar padrão ou especificar path)
    try:
        font = ImageFont.truetype("arial.ttf", 36)
    except:
        font = ImageFont.load_default()
    
    # Calcular posição do texto
    bbox = draw.textbbox((0, 0), watermark_text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    if position == "bottom-right":
        x = img.width - text_width - 20
        y = img.height - text_height - 20
    elif position == "bottom-left":
        x = 20
        y = img.height - text_height - 20
    elif position == "center":
        x = (img.width - text_width) // 2
        y = (img.height - text_height) // 2
    else:
        x, y = 20, 20
    
    # Desenhar texto com opacidade
    draw.text((x, y), watermark_text, fill=(255, 255, 255, opacity), font=font)
    
    # Combinar layers
    watermarked = Image.alpha_composite(img, watermark_layer)
    
    # Converter de volta para RGB se necessário
    if output_path.lower().endswith('.jpg') or output_path.lower().endswith('.jpeg'):
        watermarked = watermarked.convert("RGB")
    
    # Salvar
    watermarked.save(output_path, quality=95)
    
    return {
        "output_path": output_path,
        "watermark_position": position,
        "size": watermarked.size
    }
```

### Expert: Aplicar Filtros

```python
from PIL import Image, ImageFilter, ImageEnhance

def apply_filters(input_path: str, output_path: str, filters: list):
    """
    filters: lista de filtros a aplicar
    Exemplos: ["blur", "sharpen", "enhance_contrast", "grayscale"]
    """
    img = Image.open(input_path)
    
    for filter_name in filters:
        if filter_name == "blur":
            img = img.filter(ImageFilter.BLUR)
        
        elif filter_name == "sharpen":
            img = img.filter(ImageFilter.SHARPEN)
        
        elif filter_name == "edge_enhance":
            img = img.filter(ImageFilter.EDGE_ENHANCE)
        
        elif filter_name == "grayscale":
            img = img.convert("L")
        
        elif filter_name == "enhance_contrast":
            enhancer = ImageEnhance.Contrast(img)
            img = enhancer.enhance(1.5)  # 1.5x contrast
        
        elif filter_name == "enhance_brightness":
            enhancer = ImageEnhance.Brightness(img)
            img = enhancer.enhance(1.2)  # 1.2x brightness
        
        elif filter_name == "enhance_color":
            enhancer = ImageEnhance.Color(img)
            img = enhancer.enhance(1.3)  # 1.3x saturation
    
    # Salvar
    img.save(output_path, quality=95)
    
    return {
        "filters_applied": filters,
        "output_path": output_path,
        "final_size": img.size,
        "final_mode": img.mode
    }
```

## Templates por Caso de Uso

### Template: Resize

```python
from PIL import Image
img = Image.open("{input_path}")
img_resized = img.resize(({width}, {height}), Image.Resampling.LANCZOS)
img_resized.save("{output_path}", quality=95, optimize=True)
```

### Template: Crop

```python
from PIL import Image
img = Image.open("{input_path}")
img_cropped = img.crop(({left}, {top}, {right}, {bottom}))
img_cropped.save("{output_path}", quality=95)
```

### Template: Thumbnail

```python
from PIL import Image
img = Image.open("{input_path}")
img.thumbnail(({max_width}, {max_height}), Image.Resampling.LANCZOS)
img.save("{output_path}", quality=85, optimize=True)
```

### Template: Convert Format

```python
from PIL import Image
img = Image.open("{input_path}")
if img.mode == "RGBA":
    img = img.convert("RGB")
img.save("{output_path}", format="{format}", quality={quality})
```

### Template: Rotate

```python
from PIL import Image
img = Image.open("{input_path}")
img_rotated = img.rotate({angle}, expand=True, fillcolor=(255, 255, 255))
img_rotated.save("{output_path}", quality=95)
```

## Alternativas e Quando Usar

| Biblioteca | Quando Usar em Vez de Pillow |
|------------|------------------------------|
| OpenCV | Computer vision, face detection, video processing |
| pyvips | Imagens muito grandes (>100MB), performance crítica |
| scikit-image | Análise científica de imagens, algoritmos avançados |
| imageio | I/O simplificado, GIFs animados |
| wand | Integração com ImageMagick, efeitos complexos |

## Requisitos do Sistema

- Python 3.7+
- ~5MB de espaço em disco
- Opcional: libjpeg, libpng, libtiff (já inclusos na instalação)

## Dependências

Nenhuma dependência obrigatória (standalone).

Opcionais:
- numpy (para conversão array)
- matplotlib (para display)

## Notas de Compatibilidade

- ✅ Windows, Linux, macOS
- ✅ Python 3.7-3.12
- ✅ x86, x64, ARM, ARM64
- ✅ Suporta JPEG, PNG, GIF, BMP, TIFF, WebP, ICO
- ⚠️ HEIF/HEIC requer pillow-heif

## Troubleshooting Comum

### Problema: "cannot identify image file"

**Solução:** Arquivo corrompido ou formato não suportado
```python
try:
    img = Image.open(path)
    img.verify()  # Verifica integridade
    img = Image.open(path)  # Reabrir após verify
except Exception as e:
    print(f"Arquivo inválido: {e}")
```

### Problema: Imagem salva com qualidade ruim

**Solução:** Ajustar quality e usar optimize
```python
img.save(path, quality=95, optimize=True)
```

### Problema: JPEG não aceita transparência

**Solução:** Converter RGBA para RGB com fundo
```python
if img.mode == "RGBA":
    background = Image.new("RGB", img.size, (255, 255, 255))
    background.paste(img, mask=img.split()[3])
    img = background
img.save(path, "JPEG")
```

### Problema: Imagem gigante causa MemoryError

**Solução:** Usar pyvips ou processar em chunks
```python
# Ou reduzir resolução primeiro
img.thumbnail((max_width, max_height))
```

## Score de Seleção

```python
def calculate_pillow_score(task_keywords: list, input_size: int = 0) -> float:
    base_score = 0.90
    
    # Boost para operações básicas
    basic_ops = ['resize', 'crop', 'rotate', 'thumbnail', 'convert']
    if any(op in task_keywords for op in basic_ops):
        base_score += 0.08
    
    # Penalty para computer vision
    if any(kw in task_keywords for kw in ['detect', 'recognition', 'tracking']):
        base_score -= 0.40
    
    # Penalty para imagens muito grandes
    if input_size > 100_000_000:  # >100MB
        base_score -= 0.25
    
    # Penalty para vídeo
    if 'video' in task_keywords:
        base_score -= 0.60
    
    return min(max(base_score, 0.0), 0.98)
```

## Best Practices

1. **Sempre especifique resampling method:**
   ```python
   img.resize(size, Image.Resampling.LANCZOS)  # Melhor qualidade
   ```

2. **Use optimize=True ao salvar:**
   ```python
   img.save(path, optimize=True)
   ```

3. **Feche imagens explicitamente:**
   ```python
   img = Image.open(path)
   # ... processar
   img.close()
   # Ou use context manager
   with Image.open(path) as img:
       # processar
   ```

4. **Verifique modo antes de salvar JPEG:**
   ```python
   if img.mode in ("RGBA", "P"):
       img = img.convert("RGB")
   ```

5. **Use thumbnail() para preservar aspect ratio:**
   ```python
   img.thumbnail((max_w, max_h))  # Mantém proporção
   ```

## Última Atualização

2025-01-15