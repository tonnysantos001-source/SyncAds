# MoviePy

## Informações Básicas

- **Nome:** moviepy
- **Categoria:** Video Processing, Video Editing
- **Versão Mínima:** 1.0.0
- **Versão Recomendada:** 1.0.3+
- **Licença:** MIT
- **Documentação:** https://zulko.github.io/moviepy/

## Descrição

MoviePy é uma biblioteca Python poderosa e intuitiva para edição de vídeo scriptável. Permite cortar, concatenar, inserir títulos, compor vídeos, aplicar efeitos, extrair áudio, converter formatos e muito mais. Ideal para automação de edição de vídeo e processamento em lote.

## Casos de Uso Prioritários

1. **Cortar e Editar Vídeos** (confidence: 0.95)
2. **Concatenar Múltiplos Vídeos** (confidence: 0.95)
3. **Extrair Áudio de Vídeo** (confidence: 0.90)
4. **Adicionar Legendas/Texto** (confidence: 0.90)
5. **Converter Formatos de Vídeo** (confidence: 0.85)
6. **Aplicar Efeitos e Transições** (confidence: 0.85)
7. **Redimensionar e Rotacionar** (confidence: 0.90)
8. **Extrair Frames** (confidence: 0.88)
9. **Compor Vídeos (Picture-in-Picture)** (confidence: 0.85)
10. **Gerar GIFs de Vídeos** (confidence: 0.90)

## Prós

- ✅ API intuitiva e pythônica
- ✅ Suporta muitos formatos (mp4, avi, mov, etc)
- ✅ Manipulação de áudio integrada
- ✅ Efeitos e transições prontos
- ✅ Composição de múltiplos vídeos
- ✅ Integração com NumPy
- ✅ Geração de GIFs
- ✅ Documentação excelente
- ✅ Fácil de aprender
- ✅ Perfeito para automação

## Contras

- ⚠️ Mais lento que FFmpeg direto
- ⚠️ Uso alto de memória para vídeos longos
- ⚠️ Requer FFmpeg instalado
- ⚠️ Não é ideal para edição em tempo real
- ⚠️ Bugs ocasionais com codecs específicos
- ⚠️ Performance inferior ao OpenCV para processamento frame-a-frame

## Performance

- **Velocidade:** ⭐⭐⭐ (6.5/10)
- **Uso de Memória:** ⭐⭐⭐ (6/10)
- **Qualidade de Output:** ⭐⭐⭐⭐⭐ (9.5/10)
- **Facilidade de Uso:** ⭐⭐⭐⭐⭐ (9.5/10)

## Instalação

```bash
pip install moviepy
# FFmpeg é necessário (instalado automaticamente ou manual)
```

## Keywords/Triggers

- moviepy
- video editing
- video processing
- video cut
- video concatenate
- video merge
- extract audio
- video to gif
- add text to video
- video effects
- video composition
- video format conversion

## Exemplos de Código

### Básico: Cortar Vídeo

```python
from moviepy.editor import VideoFileClip

def cut_video(input_path: str, start: float, end: float, output_path: str):
    """Corta vídeo entre start e end (em segundos)"""
    try:
        # Carregar vídeo
        video = VideoFileClip(input_path)
        
        # Cortar
        cut = video.subclip(start, end)
        
        # Salvar
        cut.write_videofile(output_path, codec='libx264', audio_codec='aac')
        
        # Limpar
        video.close()
        cut.close()
        
        return {
            'success': True,
            'output': output_path,
            'duration': end - start
        }
    
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }
```

### Intermediário: Concatenar Vídeos

```python
from moviepy.editor import VideoFileClip, concatenate_videoclips

def concatenate_videos(video_paths: list, output_path: str):
    """Concatena múltiplos vídeos em sequência"""
    try:
        # Carregar todos os vídeos
        clips = [VideoFileClip(path) for path in video_paths]
        
        # Concatenar
        final_clip = concatenate_videoclips(clips, method="compose")
        
        # Salvar
        final_clip.write_videofile(
            output_path,
            codec='libx264',
            audio_codec='aac',
            fps=24
        )
        
        # Limpar
        for clip in clips:
            clip.close()
        final_clip.close()
        
        return {
            'success': True,
            'output': output_path,
            'total_duration': final_clip.duration,
            'videos_merged': len(video_paths)
        }
    
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }
```

### Avançado: Adicionar Texto ao Vídeo

```python
from moviepy.editor import VideoFileClip, TextClip, CompositeVideoClip

def add_text_to_video(input_path: str, text: str, output_path: str, 
                      position='bottom', duration=None):
    """Adiciona texto ao vídeo"""
    try:
        # Carregar vídeo
        video = VideoFileClip(input_path)
        
        # Criar texto
        txt_clip = TextClip(
            text,
            fontsize=50,
            color='white',
            font='Arial',
            stroke_color='black',
            stroke_width=2
        )
        
        # Definir duração e posição
        txt_clip = txt_clip.set_duration(duration or video.duration)
        
        if position == 'bottom':
            txt_clip = txt_clip.set_position(('center', 'bottom'))
        elif position == 'top':
            txt_clip = txt_clip.set_position(('center', 'top'))
        else:
            txt_clip = txt_clip.set_position('center')
        
        # Compor vídeo com texto
        final = CompositeVideoClip([video, txt_clip])
        
        # Salvar
        final.write_videofile(output_path, codec='libx264', audio_codec='aac')
        
        # Limpar
        video.close()
        txt_clip.close()
        final.close()
        
        return {
            'success': True,
            'output': output_path,
            'text_added': text
        }
    
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }
```

### Expert: Extrair Áudio e Frames

```python
from moviepy.editor import VideoFileClip
import os

def extract_audio_and_frames(input_path: str, output_dir: str, 
                              frame_interval: int = 30):
    """Extrai áudio e frames de um vídeo"""
    try:
        # Criar diretório de saída
        os.makedirs(output_dir, exist_ok=True)
        
        # Carregar vídeo
        video = VideoFileClip(input_path)
        
        # Extrair áudio
        audio_path = os.path.join(output_dir, 'audio.mp3')
        if video.audio:
            video.audio.write_audiofile(audio_path)
        
        # Extrair frames
        frames_dir = os.path.join(output_dir, 'frames')
        os.makedirs(frames_dir, exist_ok=True)
        
        frame_count = 0
        for i, frame in enumerate(video.iter_frames()):
            if i % frame_interval == 0:
                frame_path = os.path.join(frames_dir, f'frame_{frame_count:04d}.jpg')
                from PIL import Image
                Image.fromarray(frame).save(frame_path)
                frame_count += 1
        
        # Limpar
        video.close()
        
        return {
            'success': True,
            'audio_path': audio_path if video.audio else None,
            'frames_extracted': frame_count,
            'frames_dir': frames_dir,
            'video_duration': video.duration,
            'video_fps': video.fps
        }
    
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }
```

### Expert: Criar GIF de Vídeo

```python
from moviepy.editor import VideoFileClip

def video_to_gif(input_path: str, output_path: str, start: float = 0, 
                 duration: float = 5, fps: int = 10, resize: float = 0.5):
    """Converte vídeo para GIF otimizado"""
    try:
        # Carregar vídeo
        video = VideoFileClip(input_path)
        
        # Cortar se necessário
        if start > 0 or duration < video.duration:
            video = video.subclip(start, start + duration)
        
        # Redimensionar para reduzir tamanho
        if resize != 1.0:
            video = video.resize(resize)
        
        # Salvar como GIF
        video.write_gif(
            output_path,
            fps=fps,
            program='ffmpeg'
        )
        
        # Limpar
        video.close()
        
        # Info do arquivo
        import os
        file_size_mb = os.path.getsize(output_path) / (1024 * 1024)
        
        return {
            'success': True,
            'output': output_path,
            'duration': duration,
            'fps': fps,
            'file_size_mb': round(file_size_mb, 2)
        }
    
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }
```

## Templates por Caso de Uso

### Template: Cut Video

```python
from moviepy.editor import VideoFileClip
video = VideoFileClip("{input_path}")
cut = video.subclip({start}, {end})
cut.write_videofile("{output_path}", codec='libx264')
video.close()
cut.close()
```

### Template: Concatenate

```python
from moviepy.editor import VideoFileClip, concatenate_videoclips
clips = [VideoFileClip(path) for path in {video_paths}]
final = concatenate_videoclips(clips)
final.write_videofile("{output_path}")
```

### Template: Extract Audio

```python
from moviepy.editor import VideoFileClip
video = VideoFileClip("{input_path}")
video.audio.write_audiofile("{output_path}")
video.close()
```

### Template: Add Text

```python
from moviepy.editor import VideoFileClip, TextClip, CompositeVideoClip
video = VideoFileClip("{input_path}")
txt = TextClip("{text}", fontsize=50, color='white')
txt = txt.set_duration(video.duration).set_position('center')
final = CompositeVideoClip([video, txt])
final.write_videofile("{output_path}")
```

## Alternativas e Quando Usar

| Biblioteca | Quando Usar em Vez de MoviePy |
|------------|--------------------------------|
| OpenCV | Processamento frame-a-frame, análise de vídeo, performance crítica |
| FFmpeg (subprocess) | Conversões simples, melhor performance, operações básicas |
| PyAV | Controle low-level, streaming, performance crítica |
| imageio | Leitura/escrita simples de vídeos |

## Requisitos do Sistema

- Python 3.7+
- FFmpeg instalado no sistema
- ~100MB de espaço
- 4GB+ RAM recomendado para vídeos longos

## Dependências

```
imageio>=2.5.0
imageio-ffmpeg>=0.4.0
decorator>=4.0.0
proglog
numpy
```

## Notas de Compatibilidade

- ✅ Windows, Linux, macOS
- ✅ Python 3.7-3.11
- ⚠️ Python 3.12: possíveis problemas com dependências
- ✅ Suporta maioria dos formatos (mp4, avi, mov, mkv, etc)
- ⚠️ Requer FFmpeg instalado

## Troubleshooting Comum

### Problema: "FFmpeg binary not found"

**Solução:** 
```bash
# Instalar FFmpeg
# Windows: choco install ffmpeg
# Mac: brew install ffmpeg
# Linux: apt-get install ffmpeg

# Ou instalar via Python
pip install imageio-ffmpeg
```

### Problema: "Memory Error" com vídeos longos

**Solução:**
```python
# Processar em chunks menores
# Ou usar resize para reduzir resolução
video = video.resize(0.5)  # 50% do tamanho
```

### Problema: Áudio dessincronizado

**Solução:**
```python
# Usar fps consistente
final.write_videofile(output_path, fps=30, audio_fps=44100)
```

### Problema: Processamento muito lento

**Solução:**
```python
# Usar preset mais rápido
final.write_videofile(output_path, preset='ultrafast')
# Ou reduzir qualidade
final.write_videofile(output_path, bitrate='2000k')
```

## Score de Seleção

```python
def calculate_moviepy_score(task_keywords: list) -> float:
    base_score = 0.75
    
    # Boost para edição de vídeo
    if any(k in task_keywords for k in ['cut', 'edit', 'trim', 'merge', 'concatenate']):
        base_score += 0.15
    
    # Boost para manipulação de áudio/texto
    if any(k in task_keywords for k in ['audio', 'text', 'subtitle', 'caption']):
        base_score += 0.10
    
    # Penalty se precisa de performance alta
    if 'fast' in task_keywords or 'realtime' in task_keywords:
        base_score -= 0.20
    
    return min(base_score, 0.95)
```

## Use When

- Precisa editar vídeos de forma scriptável
- Quer adicionar texto/legendas
- Precisa concatenar múltiplos vídeos
- Quer extrair áudio
- Precisa de API simples e pythônica
- Automação de edição de vídeo

## Don't Use When

- Performance é crítica (use OpenCV ou FFmpeg direto)
- Processamento em tempo real
- Vídeos muito longos (>1h) sem otimização
- Apenas conversão de formato (use FFmpeg)

## Última Atualização

2025-01-15