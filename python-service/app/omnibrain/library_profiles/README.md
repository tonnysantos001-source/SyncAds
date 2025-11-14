# 📚 OMNIBRAIN LIBRARY PROFILES

## 🎯 O QUE SÃO LIBRARY PROFILES?

Library Profiles são documentos completos que descrevem cada uma das 318 bibliotecas Python disponíveis no SyncAds Omnibrain. Cada perfil contém:

- ✅ Descrição completa da biblioteca
- ✅ Quando usar e quando NÃO usar
- ✅ Todas as funções principais
- ✅ Exemplos de código
- ✅ Como combinar com outras bibliotecas
- ✅ Templates prontos
- ✅ Como o Omnibrain decide por ela
- ✅ Casos de uso específicos (Shopify, Marketing, Scraping)

---

## 📋 TEMPLATE PADRÃO

Cada Library Profile segue esta estrutura:

```markdown
# LIBRARY_NAME

## 📖 DESCRIÇÃO
Breve descrição da biblioteca e seu propósito principal.

## 🎯 QUANDO USAR
- Cenário 1
- Cenário 2
- Cenário 3

## ⚠️ QUANDO NÃO USAR
- Cenário onde não é adequada 1
- Cenário onde não é adequada 2

## 📊 MÉTRICAS
- **Performance:** X/10
- **Ease of Use:** X/10
- **Reliability:** X/10
- **Speed:** X/10
- **Memory Efficient:** X/10

## ✅ PRÓS
- Vantagem 1
- Vantagem 2
- Vantagem 3

## ❌ CONTRAS
- Desvantagem 1
- Desvantagem 2

## 🔧 FUNÇÕES PRINCIPAIS
### Função 1
Descrição...
```python
código exemplo
```

### Função 2
Descrição...
```python
código exemplo
```

## 🔄 COMBINAR COM OUTRAS BIBLIOTECAS
### Com Library X
```python
exemplo de combinação
```

## 📝 TEMPLATES DE CÓDIGO
### Template 1: Caso de uso comum
```python
template completo
```

## 🤖 COMO O OMNIBRAIN DECIDE
O Omnibrain seleciona esta biblioteca quando:
- Condição 1
- Condição 2
- Score calculation: (explicação)

## 🛍️ CASOS DE USO ESPECÍFICOS
### Shopify / E-commerce
Exemplo...

### Marketing
Exemplo...

### Scraping
Exemplo...

## 🔗 ALTERNATIVAS
- Biblioteca alternativa 1 (quando preferir)
- Biblioteca alternativa 2 (quando preferir)

## 📚 DOCUMENTAÇÃO OFICIAL
Link para docs oficiais
```

---

## 📁 ESTRUTURA DE ARQUIVOS

```
library_profiles/
├── README.md (este arquivo)
├── images/
│   ├── pillow.md
│   ├── opencv.md
│   ├── pyvips.md
│   ├── rembg.md
│   ├── scikit_image.md
│   └── wand.md
├── video/
│   ├── moviepy.md
│   ├── ffmpeg_python.md
│   ├── pyav.md
│   └── scenedetect.md
├── scraping/
│   ├── playwright.md
│   ├── playwright_stealth.md
│   ├── requests.md
│   ├── beautifulsoup4.md
│   ├── scrapy.md
│   ├── cloudscraper.md
│   └── trafilatura.md
├── ecommerce/
│   ├── shopify_python_api.md
│   ├── woocommerce.md
│   ├── vtex_api.md
│   └── magento.md
├── pdf/
│   ├── reportlab.md
│   ├── fpdf.md
│   ├── pypdf2.md
│   └── pdfplumber.md
├── ml_ai/
│   ├── transformers.md
│   ├── torch.md
│   ├── tensorflow.md
│   ├── scikit_learn.md
│   └── ... (60+ arquivos)
└── ... (mais categorias)
```

---

## 📖 EXEMPLO COMPLETO: PILLOW

```markdown
# Pillow (PIL Fork)

## 📖 DESCRIÇÃO
Pillow é a biblioteca de processamento de imagens mais popular do Python. É um fork do PIL (Python Imaging Library) com melhorias modernas e suporte ativo.

Ideal para operações básicas e intermediárias de processamento de imagens como resize, crop, rotação, filtros e conversão de formatos.

## 🎯 QUANDO USAR
- ✅ Resize/crop simples de imagens
- ✅ Conversão entre formatos (PNG, JPEG, WebP, etc)
- ✅ Aplicação de filtros básicos
- ✅ Geração de thumbnails
- ✅ Adição de texto em imagens
- ✅ Manipulação de paletas de cores
- ✅ Operações de desenho (linhas, retângulos, círculos)
- ✅ Prototipagem rápida
- ✅ Projetos onde simplicidade é prioridade

## ⚠️ QUANDO NÃO USAR
- ❌ Computer vision avançada (use OpenCV)
- ❌ Processamento de imagens gigantes (use pyvips)
- ❌ Batch processing de milhares de imagens (use pyvips)
- ❌ Operações em tempo real (use OpenCV)
- ❌ Detecção de objetos/faces (use OpenCV ou ML libs)
- ❌ Processamento de vídeo (use OpenCV ou moviepy)

## 📊 MÉTRICAS
- **Performance:** 7/10
- **Ease of Use:** 9/10
- **Reliability:** 9/10
- **Speed:** 7/10
- **Memory Efficient:** 8/10
- **Weight:** 1.0
- **Priority:** 1 (first choice para imagens simples)

## ✅ PRÓS
- 🚀 Muito fácil de usar
- 📚 Documentação excelente
- 🌍 Amplamente suportado
- 🎨 API pythônica e intuitiva
- 🔧 Suporte a muitos formatos
- 💪 Comunidade grande e ativa
- 🐛 Poucos bugs
- ⚡ Bom desempenho para tarefas simples

## ❌ CONTRAS
- 🐢 Não é o mais rápido
- 🚫 Limitado para operações complexas
- 💾 Pode usar muita memória em imagens grandes
- 🎥 Não suporta vídeo
- 🤖 Sem suporte nativo para ML/AI

## 🔧 FUNÇÕES PRINCIPAIS

### 1. Abrir e Salvar Imagens
```python
from PIL import Image

# Abrir
img = Image.open('input.jpg')

# Salvar
img.save('output.png')

# Salvar com opções
img.save('output.jpg', quality=95, optimize=True)
```

### 2. Resize (Redimensionar)
```python
from PIL import Image

img = Image.open('input.jpg')

# Resize mantendo aspect ratio
img.thumbnail((800, 600), Image.Resampling.LANCZOS)

# Resize sem manter aspect ratio
img_resized = img.resize((800, 600), Image.Resampling.LANCZOS)
```

### 3. Crop (Cortar)
```python
from PIL import Image

img = Image.open('input.jpg')

# Crop: (left, top, right, bottom)
box = (100, 100, 400, 400)
img_cropped = img.crop(box)
```

### 4. Rotacionar
```python
from PIL import Image

img = Image.open('input.jpg')

# Rotacionar 90 graus
img_rotated = img.rotate(90, expand=True)
```

### 5. Aplicar Filtros
```python
from PIL import Image, ImageFilter

img = Image.open('input.jpg')

# Blur
img_blur = img.filter(ImageFilter.BLUR)

# Sharpen
img_sharp = img.filter(ImageFilter.SHARPEN)

# Contour
img_contour = img.filter(ImageFilter.CONTOUR)
```

### 6. Conversão de Formato
```python
from PIL import Image

img = Image.open('input.png')

# Converter para RGB (necessário para JPEG)
img_rgb = img.convert('RGB')
img_rgb.save('output.jpg')

# Converter para Grayscale
img_gray = img.convert('L')
```

### 7. Adicionar Texto
```python
from PIL import Image, ImageDraw, ImageFont

img = Image.open('input.jpg')
draw = ImageDraw.Draw(img)

# Fonte
font = ImageFont.truetype('arial.ttf', 40)

# Texto
draw.text((10, 10), "SyncAds", fill='white', font=font)
```

### 8. Obter Informações
```python
from PIL import Image

img = Image.open('input.jpg')

print(f"Size: {img.size}")  # (width, height)
print(f"Mode: {img.mode}")  # RGB, RGBA, L, etc
print(f"Format: {img.format}")  # JPEG, PNG, etc
```

## 🔄 COMBINAR COM OUTRAS BIBLIOTECAS

### Com NumPy (para processamento numérico)
```python
from PIL import Image
import numpy as np

img = Image.open('input.jpg')

# PIL → NumPy
arr = np.array(img)

# Processar com NumPy
arr = arr * 0.5  # Diminuir brilho

# NumPy → PIL
img_processed = Image.fromarray(arr.astype('uint8'))
```

### Com OpenCV (quando precisar de ambos)
```python
from PIL import Image
import cv2
import numpy as np

# PIL → OpenCV
pil_img = Image.open('input.jpg')
cv_img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)

# Processar com OpenCV
cv_img = cv2.GaussianBlur(cv_img, (5, 5), 0)

# OpenCV → PIL
pil_img = Image.fromarray(cv2.cvtColor(cv_img, cv2.COLOR_BGR2RGB))
```

### Com rembg (remover fundo)
```python
from PIL import Image
from rembg import remove

img = Image.open('input.jpg')

# Remover fundo
img_no_bg = remove(img)

# Salvar
img_no_bg.save('output.png')
```

## 📝 TEMPLATES DE CÓDIGO

### Template 1: Otimizar Imagem para Web
```python
from PIL import Image
import io

def optimize_for_web(input_path, output_path, max_width=1920, quality=85):
    """Otimiza imagem para web"""
    img = Image.open(input_path)
    
    # Convert RGBA to RGB if needed
    if img.mode == 'RGBA':
        background = Image.new('RGB', img.size, (255, 255, 255))
        background.paste(img, mask=img.split()[3])
        img = background
    
    # Resize if too large
    if img.width > max_width:
        aspect = img.height / img.width
        new_height = int(max_width * aspect)
        img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
    
    # Save optimized
    img.save(output_path, 'JPEG', quality=quality, optimize=True)
    
    return output_path

# Uso
optimize_for_web('input.png', 'output.jpg', max_width=1920, quality=85)
```

### Template 2: Criar Thumbnail
```python
from PIL import Image

def create_thumbnail(input_path, output_path, size=(300, 300)):
    """Cria thumbnail mantendo aspect ratio"""
    img = Image.open(input_path)
    img.thumbnail(size, Image.Resampling.LANCZOS)
    img.save(output_path, quality=90, optimize=True)
    return output_path

# Uso
create_thumbnail('product.jpg', 'thumbnail.jpg', size=(300, 300))
```

### Template 3: Batch Processing
```python
from PIL import Image
import os

def batch_resize(input_dir, output_dir, size=(800, 600)):
    """Redimensiona todas as imagens de uma pasta"""
    os.makedirs(output_dir, exist_ok=True)
    
    for filename in os.listdir(input_dir):
        if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
            input_path = os.path.join(input_dir, filename)
            output_path = os.path.join(output_dir, filename)
            
            img = Image.open(input_path)
            img = img.resize(size, Image.Resampling.LANCZOS)
            img.save(output_path, quality=90, optimize=True)
            
    print(f"Processed {len(os.listdir(input_dir))} images")

# Uso
batch_resize('images/', 'images_resized/', size=(800, 600))
```

## 🤖 COMO O OMNIBRAIN DECIDE

O Omnibrain seleciona Pillow quando:

1. **Task Type:** IMAGE_PROCESSING
2. **Operação:** resize, crop, rotate, filter, format_conversion, thumbnail
3. **Scoring:**
   ```python
   score = (
       capability * 0.35 +      # 7/10 = 2.45
       performance * 0.25 +      # 7/10 = 1.75
       ease_of_use * 0.15 +      # 9/10 = 1.35
       reliability * 0.15 +      # 9/10 = 1.35
       context * 0.10            # Varia
   ) * 1.0 (weight)
   # Total base: ~7.9/10
   ```

4. **Keywords detectadas:**
   - "resize", "redimensionar"
   - "crop", "cortar"
   - "optimize", "otimizar"
   - "thumbnail", "miniatura"
   - "convert", "converter"

5. **Preferido quando:**
   - Tarefa simples
   - Prototipagem
   - Não requer performance extrema
   - Facilidade de uso é prioridade

## 🛍️ CASOS DE USO ESPECÍFICOS

### Shopify / E-commerce
```python
from PIL import Image

def prepare_product_image(input_path, output_dir):
    """Prepara imagem de produto para Shopify"""
    img = Image.open(input_path)
    
    # Shopify recomenda: 2048x2048, aspect ratio 1:1
    # Criar versão quadrada
    size = max(img.size)
    square = Image.new('RGB', (size, size), (255, 255, 255))
    square.paste(img, ((size - img.width) // 2, (size - img.height) // 2))
    
    # Resize para 2048x2048
    square = square.resize((2048, 2048), Image.Resampling.LANCZOS)
    
    # Salvar
    square.save(f"{output_dir}/product_full.jpg", quality=90, optimize=True)
    
    # Criar thumbnail 600x600
    thumb = square.copy()
    thumb.thumbnail((600, 600), Image.Resampling.LANCZOS)
    thumb.save(f"{output_dir}/product_thumb.jpg", quality=85, optimize=True)
```

### Marketing - Banner de Anúncio
```python
from PIL import Image, ImageDraw, ImageFont

def create_ad_banner(background_path, text, output_path):
    """Cria banner de anúncio"""
    img = Image.open(background_path)
    img = img.resize((1200, 628), Image.Resampling.LANCZOS)  # Facebook ad size
    
    # Overlay semi-transparente
    overlay = Image.new('RGBA', img.size, (0, 0, 0, 128))
    img = img.convert('RGBA')
    img = Image.alpha_composite(img, overlay)
    
    # Adicionar texto
    draw = ImageDraw.Draw(img)
    font = ImageFont.truetype('arial.ttf', 60)
    
    # Centralizar texto
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    position = ((img.width - text_width) // 2, (img.height - text_height) // 2)
    
    draw.text(position, text, fill='white', font=font)
    
    # Salvar
    img = img.convert('RGB')
    img.save(output_path, quality=95, optimize=True)
```

### Scraping - Processar Imagens Baixadas
```python
from PIL import Image
import requests
from io import BytesIO

def download_and_process_image(url, output_path, size=(800, 600)):
    """Baixa e processa imagem de scraping"""
    response = requests.get(url)
    img = Image.open(BytesIO(response.content))
    
    # Processar
    img = img.convert('RGB')
    img.thumbnail(size, Image.Resampling.LANCZOS)
    
    # Salvar
    img.save(output_path, 'JPEG', quality=85, optimize=True)
    
    return {
        'url': url,
        'path': output_path,
        'size': img.size,
        'format': 'JPEG'
    }
```

## 🔗 ALTERNATIVAS

### Quando preferir OpenCV:
- Precisa de computer vision
- Performance é crítica
- Processamento de vídeo
- Detecção de objetos/faces

### Quando preferir pyvips:
- Imagens muito grandes (>100MB)
- Batch processing de milhares de imagens
- Memória limitada
- Performance extrema necessária

### Quando preferir scikit-image:
- Processamento científico
- Algoritmos avançados de visão
- Análise de imagens médicas
- Pesquisa acadêmica

## 📚 DOCUMENTAÇÃO OFICIAL
- **Docs:** https://pillow.readthedocs.io/
- **PyPI:** https://pypi.org/project/Pillow/
- **GitHub:** https://github.com/python-pillow/Pillow
- **Tutorial:** https://pillow.readthedocs.io/en/stable/handbook/tutorial.html

## 🎓 RECURSOS ADICIONAIS
- [Pillow Handbook](https://pillow.readthedocs.io/en/stable/handbook/index.html)
- [Image Processing Tutorials](https://realpython.com/image-processing-with-the-python-pillow-library/)
- [Stack Overflow - Pillow Questions](https://stackoverflow.com/questions/tagged/python-imaging-library)
```

---

## 🚀 COMO USAR OS LIBRARY PROFILES

### 1. No Omnibrain Engine
```python
from omnibrain.library_profiles import load_profile

# Carregar profile
profile = load_profile('Pillow')

# Usar informações do profile
print(f"Best for: {profile['best_for']}")
print(f"Performance: {profile['metrics']['performance']}")
print(f"Code template: {profile['templates']['resize']}")
```

### 2. No Library Selector
```python
# Library Selector usa profiles para scoring
selector = LibrarySelector()
profile = selector.get_library_profile('Pillow')

# Score baseado no profile
score = calculate_score(task, profile)
```

### 3. No Code Generator
```python
# Code Generator usa templates dos profiles
generator = CodeGenerator()
template = generator.get_template_from_profile('Pillow', 'resize')
code = generator.render_template(template, params)
```

---

## 📝 CRIAR NOVOS PROFILES

Para criar um novo Library Profile:

1. Copie o template acima
2. Preencha todas as seções
3. Adicione pelo menos 3 exemplos de código
4. Inclua casos de uso específicos
5. Salve em: `library_profiles/{category}/{library_name}.md`
6. Execute: `python generate_profile_index.py` para atualizar o índice

---

## 📊 STATUS DOS PROFILES

```
Total de bibliotecas: 318
Profiles criados: 1 (Pillow)
Profiles pendentes: 317

Prioridade:
1. Imagens (6 libs) ⏳
2. Scraping (7 libs) 📋
3. PDF (4 libs) 📋
4. Video (4 libs) 📋
5. E-commerce (4 libs) 📋
6. ML/AI (60+ libs) 📋
```

---

## 🎯 PRÓXIMOS PASSOS

1. ✅ Criar template padrão (feito)
2. ✅ Criar exemplo completo: Pillow (feito)
3. ⏳ Criar profiles para top 20 bibliotecas
4. ⏳ Implementar loader de profiles
5. ⏳ Integrar com Omnibrain Engine
6. ⏳ Gerar profiles automaticamente com IA

---

**Total estimado:** 318 arquivos × 500 linhas = ~159.000 linhas de documentação completa!