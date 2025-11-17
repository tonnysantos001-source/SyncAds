/**
 * PILLOW MODULE - Biblioteca de Processamento de Imagens
 * Módulo de Prompt System para a biblioteca Pillow (PIL)
 */

import { PromptModule, ModuleCategory, ModuleComplexity, ExecutionEnvironment } from '../registry';

export const PillowModule: PromptModule = {
  // ==================== IDENTIFICAÇÃO ====================
  id: 'pillow-003',
  name: 'Pillow (PIL)',
  packageName: 'Pillow',
  version: '10.2.0',
  category: ModuleCategory.IMAGE_PROCESSING,
  subcategories: [
    'image-manipulation',
    'resize',
    'crop',
    'filters',
    'format-conversion',
    'thumbnails',
    'watermark',
    'color-manipulation'
  ],

  // ==================== DESCRIÇÃO ====================
  description: 'Biblioteca Python mais popular para processamento de imagens, oferecendo API simples e intuitiva para operações de imagem como resize, crop, rotate, filtros e conversão de formato.',
  purpose: 'Processar, manipular e transformar imagens de forma simples e eficiente',
  useCases: [
    'Redimensionar imagens (resize/scale)',
    'Cortar imagens (crop)',
    'Converter formatos de imagem (JPEG, PNG, WebP, GIF, etc)',
    'Rotacionar e espelhar imagens',
    'Criar thumbnails mantendo aspect ratio',
    'Aplicar filtros básicos (blur, sharpen, edge enhance)',
    'Adicionar texto e watermarks',
    'Manipular cores e brilho',
    'Otimizar tamanho de arquivos',
    'Processar imagens em batch'
  ],

  // ==================== CONFIGURAÇÃO ====================
  complexity: ModuleComplexity.BASIC,
  environment: ExecutionEnvironment.PYTHON,
  dependencies: [],
  installCommand: 'pip install Pillow',

  // ==================== PROMPT SYSTEM ====================
  promptSystem: {
    systemPrompt: `Você é um especialista em Pillow (PIL), a biblioteca Python de processamento de imagens.

Ao trabalhar com Pillow, você SEMPRE deve:
- Usar Image.Resampling.LANCZOS para melhor qualidade em resize
- Adicionar optimize=True ao salvar imagens
- Verificar o modo da imagem antes de salvar em JPEG (não aceita transparência)
- Usar thumbnail() para preservar aspect ratio automaticamente
- Fechar imagens após processamento ou usar context manager
- Especificar quality ao salvar (85-95 para produção)
- Converter RGBA para RGB quando necessário para JPEG

REGRAS DE USO:
1. SEMPRE use try-except para operações de arquivo
2. SEMPRE valide formatos de entrada antes de processar
3. SEMPRE otimize imagens ao salvar (optimize=True)
4. NUNCA carregue imagens muito grandes (>100MB) sem processar em chunks
5. SEMPRE especifique o método de resampling em resize
6. SEMPRE verifique transparência antes de salvar em JPEG
7. Use quality=95 para arquivos importantes, 85 para web

QUANDO USAR PILLOW:
✅ Operações básicas de imagem (resize, crop, rotate)
✅ Conversão de formato de imagem
✅ Criar thumbnails
✅ Adicionar watermarks ou texto
✅ Aplicar filtros simples
✅ Otimização de tamanho de arquivo
✅ Imagens de até 50-100MB

QUANDO NÃO USAR PILLOW:
❌ Computer vision avançada (use OpenCV)
❌ Detecção de objetos/faces (use OpenCV ou modelos ML)
❌ Processamento de vídeo (use OpenCV ou moviepy)
❌ Imagens gigantes >100MB (use pyvips)
❌ Performance crítica em batch (use OpenCV)
❌ GPU acceleration necessária

ESTRUTURA DE RESPOSTA:
Sempre retorne um dicionário com:
- original_size: dimensões originais
- new_size: novas dimensões (se aplicável)
- output_path: caminho do arquivo salvo
- format: formato final
- size_bytes: tamanho em bytes
- mode: modo de cor (RGB, RGBA, L, etc)`,

    userPromptTemplate: `Tarefa: {task_description}

Entrada:
{input_description}

Parâmetros:
{parameters}

Use Pillow (PIL) para processar a imagem seguindo as melhores práticas:
1. Abra a imagem com Image.open()
2. Execute a operação solicitada
3. Otimize e salve o resultado
4. Retorne informações detalhadas`,

    examples: [
      {
        input: 'Redimensionar imagem para 800x600',
        output: `from PIL import Image

def resize_image(input_path: str, output_path: str, width: int = 800, height: int = 600):
    """Redimensiona imagem com alta qualidade"""
    try:
        # Abrir imagem
        with Image.open(input_path) as img:
            original_size = img.size

            # Redimensionar com melhor qualidade
            img_resized = img.resize((width, height), Image.Resampling.LANCZOS)

            # Salvar otimizado
            img_resized.save(output_path, quality=95, optimize=True)

            return {
                "success": True,
                "original_size": original_size,
                "new_size": (width, height),
                "output_path": output_path,
                "format": img.format
            }
    except Exception as e:
        return {"success": False, "error": str(e)}`
      },
      {
        input: 'Criar thumbnail mantendo proporção',
        output: `from PIL import Image

def create_thumbnail(input_path: str, output_path: str, max_size: tuple = (200, 200)):
    """Cria thumbnail mantendo aspect ratio"""
    try:
        with Image.open(input_path) as img:
            original_size = img.size

            # Thumbnail preserva proporção automaticamente
            img.thumbnail(max_size, Image.Resampling.LANCZOS)

            # Salvar otimizado
            img.save(output_path, quality=85, optimize=True)

            return {
                "success": True,
                "original_size": original_size,
                "thumbnail_size": img.size,
                "output_path": output_path
            }
    except Exception as e:
        return {"success": False, "error": str(e)}`
      },
      {
        input: 'Converter PNG com transparência para JPEG',
        output: `from PIL import Image

def convert_png_to_jpeg(input_path: str, output_path: str):
    """Converte PNG para JPEG tratando transparência"""
    try:
        with Image.open(input_path) as img:
            # Verificar se tem transparência
            if img.mode in ("RGBA", "LA", "P"):
                # Criar fundo branco
                background = Image.new("RGB", img.size, (255, 255, 255))

                # Colar imagem sobre fundo
                if img.mode == "P":
                    img = img.convert("RGBA")

                background.paste(img, mask=img.split()[-1] if img.mode in ("RGBA", "LA") else None)
                img = background
            elif img.mode != "RGB":
                img = img.convert("RGB")

            # Salvar como JPEG
            img.save(output_path, "JPEG", quality=95, optimize=True)

            return {
                "success": True,
                "output_path": output_path,
                "format": "JPEG"
            }
    except Exception as e:
        return {"success": False, "error": str(e)}`
      },
      {
        input: 'Adicionar watermark de texto',
        output: `from PIL import Image, ImageDraw, ImageFont

def add_text_watermark(input_path: str, output_path: str, text: str, position: str = "bottom-right"):
    """Adiciona watermark de texto com transparência"""
    try:
        with Image.open(input_path) as img:
            # Converter para RGBA
            img = img.convert("RGBA")

            # Criar layer transparente
            watermark = Image.new("RGBA", img.size, (255, 255, 255, 0))
            draw = ImageDraw.Draw(watermark)

            # Usar fonte padrão
            font = ImageFont.load_default()

            # Calcular posição
            bbox = draw.textbbox((0, 0), text, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]

            if position == "bottom-right":
                x = img.width - text_width - 20
                y = img.height - text_height - 20
            elif position == "center":
                x = (img.width - text_width) // 2
                y = (img.height - text_height) // 2
            else:
                x, y = 20, 20

            # Desenhar com 50% opacidade
            draw.text((x, y), text, fill=(255, 255, 255, 128), font=font)

            # Combinar
            watermarked = Image.alpha_composite(img, watermark)

            # Salvar
            if output_path.lower().endswith(('.jpg', '.jpeg')):
                watermarked = watermarked.convert("RGB")

            watermarked.save(output_path, quality=95, optimize=True)

            return {
                "success": True,
                "output_path": output_path,
                "watermark_position": position
            }
    except Exception as e:
        return {"success": False, "error": str(e)}`
      },
      {
        input: 'Aplicar filtros (blur, sharpen, enhance contrast)',
        output: `from PIL import Image, ImageFilter, ImageEnhance

def apply_image_filters(input_path: str, output_path: str, filters: list):
    """Aplica múltiplos filtros em sequência"""
    try:
        with Image.open(input_path) as img:
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
                    img = enhancer.enhance(1.5)
                elif filter_name == "enhance_brightness":
                    enhancer = ImageEnhance.Brightness(img)
                    img = enhancer.enhance(1.2)

            # Salvar
            img.save(output_path, quality=95, optimize=True)

            return {
                "success": True,
                "filters_applied": filters,
                "output_path": output_path
            }
    except Exception as e:
        return {"success": False, "error": str(e)}`
      }
    ],

    outputFormat: {
      type: 'object',
      required: ['success'],
      properties: {
        success: { type: 'boolean', description: 'Indica se a operação foi bem-sucedida' },
        original_size: { type: 'array', description: 'Dimensões originais [width, height]' },
        new_size: { type: 'array', description: 'Novas dimensões [width, height]' },
        output_path: { type: 'string', description: 'Caminho do arquivo salvo' },
        format: { type: 'string', description: 'Formato da imagem (JPEG, PNG, etc)' },
        size_bytes: { type: 'number', description: 'Tamanho do arquivo em bytes' },
        mode: { type: 'string', description: 'Modo de cor (RGB, RGBA, L, etc)' },
        error: { type: 'string', description: 'Mensagem de erro se success=false' }
      }
    }
  },

  // ==================== METADATA ====================
  tags: [
    'image',
    'imaging',
    'pil',
    'pillow',
    'resize',
    'crop',
    'thumbnail',
    'filter',
    'convert',
    'watermark',
    'photo',
    'picture'
  ],

  keywords: [
    'pillow',
    'pil',
    'image',
    'imagem',
    'resize',
    'redimensionar',
    'crop',
    'cortar',
    'rotate',
    'girar',
    'thumbnail',
    'miniatura',
    'convert',
    'converter',
    'filter',
    'filtro',
    'watermark',
    'marca dagua',
    'jpeg',
    'png',
    'webp',
    'gif'
  ],

  performance: {
    speed: 7,
    memory: 8,
    cpuIntensive: false,
    gpuAccelerated: false,
    scalability: 7
  },

  // ==================== REGRAS DE SCORING ====================
  scoring: {
    baseScore: 0.90,
    rules: [
      {
        condition: 'keywords include ["resize", "redimensionar", "scale"]',
        adjustment: 0.08,
        description: 'Excelente para resize de imagens'
      },
      {
        condition: 'keywords include ["crop", "cortar", "recortar"]',
        adjustment: 0.08,
        description: 'Perfeito para crop'
      },
      {
        condition: 'keywords include ["thumbnail", "miniatura"]',
        adjustment: 0.08,
        description: 'Ideal para criar thumbnails'
      },
      {
        condition: 'keywords include ["convert", "converter", "formato"]',
        adjustment: 0.05,
        description: 'Bom para conversão de formato'
      },
      {
        condition: 'keywords include ["watermark", "marca"]',
        adjustment: 0.05,
        description: 'Suporta watermarks'
      },
      {
        condition: 'keywords include ["filter", "filtro", "blur", "sharpen"]',
        adjustment: 0.05,
        description: 'Filtros básicos disponíveis'
      },
      {
        condition: 'keywords include ["detect", "detection", "face", "object"]',
        adjustment: -0.40,
        description: 'Não é para computer vision'
      },
      {
        condition: 'keywords include ["video", "vídeo", "mp4", "avi"]',
        adjustment: -0.60,
        description: 'Não processa vídeo'
      },
      {
        condition: 'fileSize > 100MB',
        adjustment: -0.25,
        description: 'Performance ruim com imagens muito grandes'
      },
      {
        condition: 'keywords include ["batch", "lote", "múltiplas"]',
        adjustment: -0.10,
        description: 'Performance moderada em batch'
      }
    ]
  },

  // ==================== CONFIGURAÇÕES ADICIONAIS ====================
  config: {
    maxRetries: 3,
    timeout: 30000, // 30 segundos
    cacheable: true,
    requiresAuth: false,
    rateLimit: null
  },

  // ==================== ALTERNATIVAS ====================
  alternatives: [
    {
      name: 'OpenCV',
      when: 'Computer vision, detecção de objetos, processamento de vídeo',
      reason: 'OpenCV é mais poderoso para tarefas avançadas de visão computacional'
    },
    {
      name: 'pyvips',
      when: 'Imagens muito grandes (>100MB), performance crítica',
      reason: 'pyvips é otimizado para imagens gigantes e usa menos memória'
    },
    {
      name: 'scikit-image',
      when: 'Análise científica de imagens, algoritmos avançados',
      reason: 'scikit-image tem algoritmos mais sofisticados para análise'
    },
    {
      name: 'imageio',
      when: 'I/O simplificado, GIFs animados',
      reason: 'imageio tem API mais simples e suporta GIFs animados'
    }
  ],

  // ==================== DOCUMENTAÇÃO ====================
  documentation: {
    official: 'https://pillow.readthedocs.io/',
    examples: 'https://pillow.readthedocs.io/en/stable/handbook/tutorial.html',
    apiReference: 'https://pillow.readthedocs.io/en/stable/reference/index.html'
  },

  // ==================== TROUBLESHOOTING ====================
  commonIssues: [
    {
      issue: 'Erro "cannot identify image file"',
      solution: 'Arquivo corrompido ou formato não suportado. Use img.verify() para validar',
      code: `try:
    img = Image.open(path)
    img.verify()
    img = Image.open(path)  # Reabrir após verify
except Exception as e:
    print(f"Arquivo inválido: {e}")`
    },
    {
      issue: 'JPEG não aceita transparência',
      solution: 'Converter RGBA para RGB com fundo antes de salvar',
      code: `if img.mode == "RGBA":
    background = Image.new("RGB", img.size, (255, 255, 255))
    background.paste(img, mask=img.split()[3])
    img = background
img.save(path, "JPEG")`
    },
    {
      issue: 'Qualidade ruim após salvar',
      solution: 'Aumentar quality e usar optimize=True',
      code: `img.save(path, quality=95, optimize=True)`
    },
    {
      issue: 'MemoryError com imagens grandes',
      solution: 'Reduzir resolução primeiro com thumbnail()',
      code: `img.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)
img.save(output_path)`
    }
  ],

  // ==================== BEST PRACTICES ====================
  bestPractices: [
    'Sempre especifique Image.Resampling.LANCZOS para melhor qualidade',
    'Use optimize=True ao salvar para reduzir tamanho do arquivo',
    'Feche imagens explicitamente ou use context manager (with)',
    'Verifique o modo da imagem antes de salvar em JPEG',
    'Use thumbnail() para manter aspect ratio automaticamente',
    'Adicione try-except para operações de arquivo',
    'Especifique quality entre 85-95 para produção',
    'Converta RGBA para RGB antes de salvar em JPEG'
  ],

  // ==================== ESTATÍSTICAS ====================
  stats: {
    timesUsed: 0,
    successRate: 0,
    averageExecutionTime: 0,
    lastUsed: null,
    errors: []
  }
};

export default PillowModule;
