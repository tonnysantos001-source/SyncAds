/**
 * OPENCV MODULE - Biblioteca de Computer Vision e Processamento de Vídeo
 * Módulo de Prompt System para a biblioteca OpenCV (cv2)
 */

import { PromptModule, ModuleCategory, ModuleComplexity, ExecutionEnvironment } from '../registry';

export const OpenCVModule: PromptModule = {
  // ==================== IDENTIFICAÇÃO ====================
  id: 'opencv-004',
  name: 'OpenCV',
  packageName: 'opencv-python',
  version: '4.9.0',
  category: ModuleCategory.COMPUTER_VISION,
  subcategories: [
    'face-detection',
    'object-detection',
    'video-processing',
    'image-analysis',
    'feature-detection',
    'contour-detection',
    'image-segmentation',
    'motion-tracking',
    'ocr',
    'machine-learning'
  ],

  // ==================== DESCRIÇÃO ====================
  description: 'Biblioteca mais poderosa e completa para processamento de imagens e visão computacional, oferecendo mais de 2500 algoritmos otimizados para detecção, reconhecimento, rastreamento e análise.',
  purpose: 'Realizar tarefas avançadas de visão computacional, processamento de vídeo, detecção de objetos e análise de imagens',
  useCases: [
    'Detecção de faces e reconhecimento facial',
    'Detecção e rastreamento de objetos',
    'Processamento e análise de vídeo em tempo real',
    'Análise de contornos e formas',
    'Detecção de bordas e features',
    'Segmentação de imagens',
    'OCR e detecção de texto',
    'Rastreamento de movimento',
    'Análise de cores e histogramas',
    'Calibração de câmera',
    'Realidade aumentada',
    'Machine learning para visão computacional'
  ],

  // ==================== CONFIGURAÇÃO ====================
  complexity: ModuleComplexity.ADVANCED,
  environment: ExecutionEnvironment.PYTHON,
  dependencies: ['numpy'],
  installCommand: 'pip install opencv-python',

  // ==================== PROMPT SYSTEM ====================
  promptSystem: {
    systemPrompt: `Você é um especialista em OpenCV (cv2), a biblioteca Python de visão computacional.

Ao trabalhar com OpenCV, você SEMPRE deve:
- Usar cv2.imread() para ler imagens (retorna BGR, não RGB)
- Converter BGR para RGB quando necessário (cv2.cvtColor)
- Usar interpolação adequada em resize (INTER_LANCZOS4 para melhor qualidade)
- Verificar se a imagem foi carregada (img is not None)
- Liberar recursos após processar vídeo (cap.release(), out.release())
- Usar cv2.destroyAllWindows() após mostrar janelas
- Especificar codec correto ao salvar vídeos

REGRAS DE USO:
1. SEMPRE verifique se imagem/vídeo foi carregado corretamente
2. SEMPRE converta BGR para RGB quando integrar com outras bibliotecas
3. SEMPRE libere recursos de vídeo (release())
4. NUNCA use cv2.imshow() em servidores sem display
5. SEMPRE use try-except para operações de arquivo
6. SEMPRE especifique interpolação em resize
7. Use GPU acceleration quando disponível (cv2.cuda)

QUANDO USAR OPENCV:
✅ Detecção de objetos e faces
✅ Processamento de vídeo
✅ Análise de contornos e formas
✅ Rastreamento de movimento
✅ Computer vision avançada
✅ OCR e detecção de texto
✅ Performance crítica em processamento de imagem
✅ Feature detection (SIFT, ORB, etc)
✅ Machine learning para visão

QUANDO NÃO USAR OPENCV:
❌ Operações simples de imagem (use Pillow)
❌ Apenas resize/crop básico (use Pillow)
❌ Deep learning moderno (use PyTorch/TensorFlow)
❌ Processamento de áudio (use pydub)
❌ Manipulação de PDF (use reportlab)

ESTRUTURA DE RESPOSTA:
Sempre retorne um dicionário com:
- success: boolean
- output_path: caminho do arquivo salvo
- dimensions: dimensões da imagem/vídeo
- detections: objetos/faces detectados (se aplicável)
- processing_time: tempo de processamento
- metadata: informações adicionais`,

    userPromptTemplate: `Tarefa: {task_description}

Entrada:
{input_description}

Parâmetros:
{parameters}

Use OpenCV (cv2) para processar seguindo as melhores práticas:
1. Carregue a imagem/vídeo com cv2.imread() ou cv2.VideoCapture()
2. Execute a operação solicitada
3. Salve o resultado com cv2.imwrite() ou cv2.VideoWriter()
4. Retorne informações detalhadas`,

    examples: [
      {
        input: 'Detectar faces em uma imagem',
        output: `import cv2
import numpy as np

def detect_faces(image_path: str, output_path: str):
    """Detecta faces usando Haar Cascade"""
    try:
        # Carregar classificador
        face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )

        # Ler imagem
        img = cv2.imread(image_path)
        if img is None:
            return {"success": False, "error": "Não foi possível carregar a imagem"}

        # Converter para escala de cinza
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Detectar faces
        faces = face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(30, 30)
        )

        # Desenhar retângulos
        for (x, y, w, h) in faces:
            cv2.rectangle(img, (x, y), (x+w, y+h), (0, 255, 0), 2)

        # Salvar
        cv2.imwrite(output_path, img)

        return {
            "success": True,
            "faces_detected": len(faces),
            "output_path": output_path,
            "coordinates": faces.tolist()
        }
    except Exception as e:
        return {"success": False, "error": str(e)}`
      },
      {
        input: 'Processar vídeo aplicando filtro de detecção de bordas',
        output: `import cv2

def process_video_edges(input_path: str, output_path: str):
    """Processa vídeo aplicando detecção de bordas Canny"""
    try:
        # Abrir vídeo
        cap = cv2.VideoCapture(input_path)
        if not cap.isOpened():
            return {"success": False, "error": "Não foi possível abrir o vídeo"}

        # Propriedades
        fps = int(cap.get(cv2.CAP_PROP_FPS))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

        # Writer
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

        frames_processed = 0

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            # Converter para cinza
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

            # Detectar bordas
            edges = cv2.Canny(gray, 100, 200)

            # Converter de volta para BGR
            edges_bgr = cv2.cvtColor(edges, cv2.COLOR_GRAY2BGR)

            # Escrever frame
            out.write(edges_bgr)
            frames_processed += 1

        # Liberar recursos
        cap.release()
        out.release()

        return {
            "success": True,
            "output_path": output_path,
            "frames_processed": frames_processed,
            "total_frames": total_frames,
            "fps": fps,
            "dimensions": (width, height)
        }
    except Exception as e:
        return {"success": False, "error": str(e)}`
      },
      {
        input: 'Detectar e extrair contornos de objetos',
        output: `import cv2
import numpy as np

def detect_contours(image_path: str, output_path: str, min_area: int = 500):
    """Detecta e desenha contornos de objetos"""
    try:
        # Ler imagem
        img = cv2.imread(image_path)
        if img is None:
            return {"success": False, "error": "Imagem não encontrada"}

        # Converter para escala de cinza
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Aplicar blur para reduzir ruído
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)

        # Threshold binário
        _, thresh = cv2.threshold(blurred, 127, 255, cv2.THRESH_BINARY)

        # Encontrar contornos
        contours, hierarchy = cv2.findContours(
            thresh,
            cv2.RETR_EXTERNAL,
            cv2.CHAIN_APPROX_SIMPLE
        )

        # Filtrar por área
        valid_contours = [c for c in contours if cv2.contourArea(c) > min_area]

        # Desenhar contornos
        result = img.copy()
        cv2.drawContours(result, valid_contours, -1, (0, 255, 0), 2)

        # Adicionar informações
        contour_data = []
        for i, cnt in enumerate(valid_contours):
            area = cv2.contourArea(cnt)
            perimeter = cv2.arcLength(cnt, True)
            x, y, w, h = cv2.boundingRect(cnt)

            contour_data.append({
                "id": i,
                "area": float(area),
                "perimeter": float(perimeter),
                "bounding_box": [int(x), int(y), int(w), int(h)]
            })

        # Salvar
        cv2.imwrite(output_path, result)

        return {
            "success": True,
            "output_path": output_path,
            "contours_found": len(valid_contours),
            "contour_data": contour_data
        }
    except Exception as e:
        return {"success": False, "error": str(e)}`
      },
      {
        input: 'Rastrear objeto em vídeo usando tracking',
        output: `import cv2

def track_object_in_video(video_path: str, output_path: str, bbox: tuple):
    """Rastreia objeto em vídeo usando tracker CSRT"""
    try:
        # Abrir vídeo
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            return {"success": False, "error": "Erro ao abrir vídeo"}

        # Ler primeiro frame
        ret, frame = cap.read()
        if not ret:
            return {"success": False, "error": "Erro ao ler primeiro frame"}

        # Inicializar tracker (CSRT é mais preciso)
        tracker = cv2.TrackerCSRT_create()
        tracker.init(frame, bbox)

        # Propriedades do vídeo
        fps = int(cap.get(cv2.CAP_PROP_FPS))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

        # Writer
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

        frames_tracked = 0
        tracking_lost = False

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            # Atualizar tracker
            success, bbox = tracker.update(frame)

            if success:
                # Desenhar bounding box
                x, y, w, h = [int(v) for v in bbox]
                cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
                frames_tracked += 1
            else:
                tracking_lost = True
                cv2.putText(frame, "Tracking Lost", (10, 50),
                           cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

            out.write(frame)

        # Liberar recursos
        cap.release()
        out.release()

        return {
            "success": True,
            "output_path": output_path,
            "frames_tracked": frames_tracked,
            "tracking_lost": tracking_lost
        }
    except Exception as e:
        return {"success": False, "error": str(e)}`
      },
      {
        input: 'Aplicar filtros e efeitos de imagem',
        output: `import cv2
import numpy as np

def apply_image_effects(image_path: str, output_path: str, effects: list):
    """Aplica múltiplos efeitos na imagem"""
    try:
        img = cv2.imread(image_path)
        if img is None:
            return {"success": False, "error": "Imagem não encontrada"}

        result = img.copy()

        for effect in effects:
            if effect == "blur":
                result = cv2.GaussianBlur(result, (15, 15), 0)

            elif effect == "sharpen":
                kernel = np.array([[-1,-1,-1],
                                  [-1, 9,-1],
                                  [-1,-1,-1]])
                result = cv2.filter2D(result, -1, kernel)

            elif effect == "edge_detection":
                gray = cv2.cvtColor(result, cv2.COLOR_BGR2GRAY)
                edges = cv2.Canny(gray, 100, 200)
                result = cv2.cvtColor(edges, cv2.COLOR_GRAY2BGR)

            elif effect == "grayscale":
                result = cv2.cvtColor(result, cv2.COLOR_BGR2GRAY)
                result = cv2.cvtColor(result, cv2.COLOR_GRAY2BGR)

            elif effect == "sepia":
                kernel = np.array([[0.272, 0.534, 0.131],
                                  [0.349, 0.686, 0.168],
                                  [0.393, 0.769, 0.189]])
                result = cv2.transform(result, kernel)

            elif effect == "negative":
                result = cv2.bitwise_not(result)

        cv2.imwrite(output_path, result)

        return {
            "success": True,
            "output_path": output_path,
            "effects_applied": effects,
            "dimensions": result.shape[:2]
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
        output_path: { type: 'string', description: 'Caminho do arquivo processado' },
        dimensions: { type: 'array', description: 'Dimensões [width, height]' },
        detections: { type: 'array', description: 'Objetos/faces detectados' },
        frames_processed: { type: 'number', description: 'Número de frames processados (vídeo)' },
        fps: { type: 'number', description: 'Frames por segundo (vídeo)' },
        processing_time: { type: 'number', description: 'Tempo de processamento em ms' },
        error: { type: 'string', description: 'Mensagem de erro se success=false' }
      }
    }
  },

  // ==================== METADATA ====================
  tags: [
    'opencv',
    'cv2',
    'computer-vision',
    'face-detection',
    'object-detection',
    'video-processing',
    'image-analysis',
    'tracking',
    'ocr',
    'contours'
  ],

  keywords: [
    'opencv',
    'cv2',
    'computer vision',
    'visao computacional',
    'face detection',
    'deteccao de face',
    'object detection',
    'deteccao de objeto',
    'video',
    'tracking',
    'rastreamento',
    'contour',
    'contorno',
    'edge detection',
    'deteccao de borda',
    'feature detection',
    'ocr',
    'motion',
    'movimento'
  ],

  performance: {
    speed: 9,
    memory: 8,
    cpuIntensive: true,
    gpuAccelerated: true,
    scalability: 9
  },

  // ==================== REGRAS DE SCORING ====================
  scoring: {
    baseScore: 0.85,
    rules: [
      {
        condition: 'keywords include ["face", "facial", "reconhecimento"]',
        adjustment: 0.10,
        description: 'Excelente para detecção facial'
      },
      {
        condition: 'keywords include ["object", "detection", "detect"]',
        adjustment: 0.10,
        description: 'Perfeito para detecção de objetos'
      },
      {
        condition: 'keywords include ["video", "vídeo", "mp4", "avi"]',
        adjustment: 0.10,
        description: 'Ideal para processamento de vídeo'
      },
      {
        condition: 'keywords include ["tracking", "rastreamento", "motion"]',
        adjustment: 0.10,
        description: 'Excelente para tracking'
      },
      {
        condition: 'keywords include ["contour", "contorno", "shape"]',
        adjustment: 0.08,
        description: 'Ótimo para análise de contornos'
      },
      {
        condition: 'keywords include ["edge", "borda", "canny"]',
        adjustment: 0.08,
        description: 'Poderoso para detecção de bordas'
      },
      {
        condition: 'keywords include ["ocr", "text", "texto"]',
        adjustment: 0.05,
        description: 'Suporta OCR básico'
      },
      {
        condition: 'keywords include ["resize", "crop"] AND NOT include ["face", "object", "video"]',
        adjustment: -0.20,
        description: 'Operações simples são melhor com Pillow'
      },
      {
        condition: 'keywords include ["deep learning", "neural network", "cnn"]',
        adjustment: -0.30,
        description: 'Deep learning moderno melhor com PyTorch/TensorFlow'
      }
    ]
  },

  // ==================== CONFIGURAÇÕES ADICIONAIS ====================
  config: {
    maxRetries: 2,
    timeout: 120000, // 2 minutos para vídeos
    cacheable: false, // Processamento pode ser custoso
    requiresAuth: false,
    rateLimit: null
  },

  // ==================== ALTERNATIVAS ====================
  alternatives: [
    {
      name: 'Pillow',
      when: 'Operações básicas de imagem (resize, crop, filtros simples)',
      reason: 'Pillow é mais simples e leve para operações básicas'
    },
    {
      name: 'PyTorch/TensorFlow',
      when: 'Deep learning, redes neurais modernas',
      reason: 'Frameworks modernos são melhores para DL'
    },
    {
      name: 'MediaPipe',
      when: 'ML em tempo real (pose, hands, face mesh)',
      reason: 'MediaPipe é otimizado para ML em tempo real'
    },
    {
      name: 'scikit-image',
      when: 'Análise científica de imagens',
      reason: 'scikit-image tem algoritmos mais sofisticados'
    }
  ],

  // ==================== DOCUMENTAÇÃO ====================
  documentation: {
    official: 'https://docs.opencv.org/',
    examples: 'https://docs.opencv.org/4.x/d6/d00/tutorial_py_root.html',
    apiReference: 'https://docs.opencv.org/4.x/d6/d00/tutorial_py_root.html'
  },

  // ==================== TROUBLESHOOTING ====================
  commonIssues: [
    {
      issue: 'Imagem carregada como None',
      solution: 'Verificar se o path está correto e o formato é suportado',
      code: `img = cv2.imread(path)
if img is None:
    print("Erro ao carregar imagem")
    return None`
    },
    {
      issue: 'Cores erradas (BGR vs RGB)',
      solution: 'OpenCV usa BGR por padrão, converter se necessário',
      code: `img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)`
    },
    {
      issue: 'Vídeo não salva corretamente',
      solution: 'Usar codec correto e liberar recursos',
      code: `fourcc = cv2.VideoWriter_fourcc(*'mp4v')
out = cv2.VideoWriter(path, fourcc, fps, (w, h))
# ... processar
out.release()`
    },
    {
      issue: 'Erro ao mostrar janela em servidor',
      solution: 'Não usar cv2.imshow() em ambiente sem display',
      code: `# Ao invés de cv2.imshow(), salvar arquivo
cv2.imwrite(output_path, img)`
    }
  ],

  // ==================== BEST PRACTICES ====================
  bestPractices: [
    'Sempre verifique se imagem/vídeo foi carregado (is not None)',
    'Converta BGR para RGB ao integrar com outras bibliotecas',
    'Libere recursos de vídeo com cap.release() e out.release()',
    'Use interpolação INTER_LANCZOS4 para melhor qualidade em resize',
    'Não use cv2.imshow() em servidores sem display',
    'Especifique codec correto ao salvar vídeos (mp4v, xvid, etc)',
    'Use GPU acceleration quando disponível (cv2.cuda)',
    'Aplique blur antes de threshold para reduzir ruído'
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

export default OpenCVModule;
