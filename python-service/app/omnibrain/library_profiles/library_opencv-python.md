# OpenCV (opencv-python)

## Informações Básicas

- **Nome:** opencv-python
- **Categoria:** Image Processing, Computer Vision
- **Versão Mínima:** 4.5.0
- **Versão Recomendada:** 4.9.0+
- **Licença:** Apache 2.0
- **Documentação:** https://docs.opencv.org/

## Descrição

OpenCV (Open Source Computer Vision Library) é a biblioteca mais poderosa e completa para processamento de imagens e visão computacional. Oferece mais de 2500 algoritmos otimizados para detecção, reconhecimento, rastreamento e análise de imagens e vídeos.

## Casos de Uso Prioritários

1. **Detecção de Objetos** (confidence: 0.95)
2. **Reconhecimento Facial** (confidence: 0.95)
3. **Processamento de Vídeo** (confidence: 0.90)
4. **Análise de Contornos** (confidence: 0.90)
5. **Operações Complexas de Imagem** (confidence: 0.95)
6. **OCR e Detecção de Texto** (confidence: 0.85)
7. **Rastreamento de Movimento** (confidence: 0.90)

## Prós

- ✅ Mais de 2500 algoritmos otimizados
- ✅ Extremamente rápido (C++ backend)
- ✅ Suporte completo a vídeo
- ✅ Machine learning integrado
- ✅ Detecção e reconhecimento facial
- ✅ GPU acceleration (CUDA)
- ✅ Cross-platform
- ✅ Comunidade gigante
- ✅ Documentação extensa

## Contras

- ⚠️ Curva de aprendizado íngreme
- ⚠️ API pode ser verbosa
- ⚠️ Instalação maior (~100MB)
- ⚠️ Requer conhecimento de visão computacional
- ⚠️ Alguns métodos têm nomes não intuitivos

## Performance

- **Velocidade:** ⭐⭐⭐⭐⭐ (9.5/10)
- **Uso de Memória:** ⭐⭐⭐⭐ (8/10)
- **Qualidade de Output:** ⭐⭐⭐⭐⭐ (10/10)
- **Facilidade de Uso:** ⭐⭐⭐ (7/10)

## Instalação

```bash
pip install opencv-python
# ou com módulos extras
pip install opencv-contrib-python
```

## Keywords/Triggers

- opencv
- cv2
- computer vision
- face detection
- object detection
- video processing
- contour detection
- image analysis
- feature detection
- image segmentation

## Exemplos de Código

### Básico: Redimensionar Imagem

```python
import cv2
import numpy as np

def resize_image(image_path: str, width: int, height: int, output_path: str):
    # Ler imagem
    img = cv2.imread(image_path)
    
    # Redimensionar
    resized = cv2.resize(img, (width, height), interpolation=cv2.INTER_LANCZOS4)
    
    # Salvar
    cv2.imwrite(output_path, resized)
    
    return output_path
```

### Intermediário: Detectar Faces

```python
import cv2

def detect_faces(image_path: str, output_path: str):
    # Carregar classificador Haar Cascade
    face_cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    )
    
    # Ler imagem
    img = cv2.imread(image_path)
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
        cv2.rectangle(img, (x, y), (x+w, y+h), (255, 0, 0), 2)
    
    # Salvar
    cv2.imwrite(output_path, img)
    
    return {
        "faces_detected": len(faces),
        "output_path": output_path,
        "faces_coordinates": faces.tolist()
    }
```

### Avançado: Processar Vídeo

```python
import cv2

def process_video(input_path: str, output_path: str, apply_filter: bool = True):
    # Abrir vídeo
    cap = cv2.VideoCapture(input_path)
    
    # Propriedades do vídeo
    fps = int(cap.get(cv2.CAP_PROP_FPS))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    
    # Writer
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
    
    frames_processed = 0
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        
        # Aplicar filtro se solicitado
        if apply_filter:
            frame = cv2.GaussianBlur(frame, (15, 15), 0)
        
        out.write(frame)
        frames_processed += 1
    
    cap.release()
    out.release()
    
    return {
        "frames_processed": frames_processed,
        "output_path": output_path,
        "fps": fps,
        "resolution": f"{width}x{height}"
    }
```

### Expert: Detecção de Contornos

```python
import cv2
import numpy as np

def detect_contours(image_path: str, output_path: str):
    # Ler imagem
    img = cv2.imread(image_path)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Threshold
    _, thresh = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY)
    
    # Encontrar contornos
    contours, hierarchy = cv2.findContours(
        thresh, 
        cv2.RETR_TREE, 
        cv2.CHAIN_APPROX_SIMPLE
    )
    
    # Desenhar contornos
    cv2.drawContours(img, contours, -1, (0, 255, 0), 2)
    
    # Análise de contornos
    contour_data = []
    for contour in contours:
        area = cv2.contourArea(contour)
        perimeter = cv2.arcLength(contour, True)
        
        if area > 100:  # Filtrar contornos pequenos
            x, y, w, h = cv2.boundingRect(contour)
            contour_data.append({
                "area": float(area),
                "perimeter": float(perimeter),
                "bbox": [int(x), int(y), int(w), int(h)]
            })
    
    cv2.imwrite(output_path, img)
    
    return {
        "total_contours": len(contours),
        "significant_contours": len(contour_data),
        "output_path": output_path,
        "contours": contour_data
    }
```

## Templates por Caso de Uso

### Template: Resize/Scale

```python
img = cv2.imread("{input_path}")
resized = cv2.resize(img, ({width}, {height}), interpolation=cv2.INTER_LANCZOS4)
cv2.imwrite("{output_path}", resized)
```

### Template: Face Detection

```python
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
img = cv2.imread("{input_path}")
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
faces = face_cascade.detectMultiScale(gray, 1.1, 5)
for (x, y, w, h) in faces:
    cv2.rectangle(img, (x, y), (x+w, y+h), (255, 0, 0), 2)
cv2.imwrite("{output_path}", img)
```

### Template: Video Processing

```python
cap = cv2.VideoCapture("{input_path}")
fourcc = cv2.VideoWriter_fourcc(*'mp4v')
out = cv2.VideoWriter("{output_path}", fourcc, 30, (640, 480))
while cap.isOpened():
    ret, frame = cap.read()
    if not ret: break
    # Process frame here
    out.write(frame)
cap.release()
out.release()
```

## Alternativas e Quando Usar

| Biblioteca | Quando Usar em Vez de OpenCV |
|------------|------------------------------|
| Pillow | Operações simples de imagem |
| scikit-image | Pipeline científico, análise |
| pyvips | Imagens muito grandes (>100MB) |
| imageio | I/O simples de imagens/vídeos |
| dlib | Face recognition mais preciso |

## Requisitos do Sistema

- Python 3.7+
- NumPy
- ~100MB de espaço em disco
- Opcional: CUDA para GPU acceleration

## Dependências

```
numpy>=1.19.0
```

## Notas de Compatibilidade

- ✅ Windows, Linux, macOS
- ✅ x86, ARM (incluindo Raspberry Pi)
- ✅ Python 3.7-3.12
- ⚠️ Algumas funcionalidades requerem opencv-contrib-python

## Troubleshooting Comum

### Problema: "module 'cv2' has no attribute 'data'"

**Solução:** Atualizar para opencv-python >= 4.5.0

### Problema: Imagem não carrega (None)

**Solução:** Verificar caminho do arquivo e formato suportado

### Problema: Vídeo não salva corretamente

**Solução:** Usar codec correto (XVID, mp4v, H264)

## Score de Seleção

```python
def calculate_opencv_score(task_keywords: list) -> float:
    base_score = 0.75
    
    # Boost para casos prioritários
    if any(k in task_keywords for k in ['face', 'detect', 'video', 'contour']):
        base_score += 0.15
    
    # Boost para operações complexas
    if any(k in task_keywords for k in ['tracking', 'segmentation', 'feature']):
        base_score += 0.10
    
    return min(base_score, 0.95)
```

## Última Atualização

2025-01-15