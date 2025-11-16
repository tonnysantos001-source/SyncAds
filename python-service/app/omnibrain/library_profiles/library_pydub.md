# PyDub

## Informações Básicas

- **Nome:** pydub
- **Categoria:** Audio Processing, Sound Manipulation
- **Versão Mínima:** 0.24.0
- **Versão Recomendada:** 0.25.1+
- **Licença:** MIT
- **Documentação:** https://github.com/jiaaro/pydub

## Descrição

PyDub é uma biblioteca Python simples e fácil de usar para manipulação de áudio. Permite cortar, concatenar, ajustar volume, aplicar efeitos e converter entre formatos de áudio com uma API intuitiva. Funciona como wrapper para FFmpeg/Libav, tornando operações de áudio complexas extremamente simples.

## Casos de Uso Prioritários

1. **Conversão de Formatos** (confidence: 0.95)
2. **Corte e Edição de Áudio** (confidence: 0.95)
3. **Ajuste de Volume** (confidence: 0.95)
4. **Concatenação de Áudios** (confidence: 0.90)
5. **Extração de Segmentos** (confidence: 0.90)
6. **Aplicação de Efeitos** (confidence: 0.85)
7. **Análise de Propriedades** (confidence: 0.85)

## Prós

- ✅ API extremamente simples e intuitiva
- ✅ Suporta diversos formatos (MP3, WAV, FLAC, OGG, etc.)
- ✅ Operações podem ser encadeadas
- ✅ Conversão automática entre formatos
- ✅ Manipulação de canais (mono/stereo)
- ✅ Funciona bem com FFmpeg
- ✅ Ótima documentação
- ✅ Leve e rápido para operações básicas
- ✅ Exportação com controle de qualidade

## Contras

- ⚠️ Requer FFmpeg instalado no sistema
- ⚠️ Não é ideal para processamento de sinais avançado
- ⚠️ Carrega áudio inteiro na memória
- ⚠️ Limitado para análise espectral complexa
- ⚠️ Performance inferior a bibliotecas especializadas

## Performance

- **Velocidade:** ⭐⭐⭐⭐ (8/10)
- **Uso de Memória:** ⭐⭐⭐ (7/10)
- **Qualidade de Output:** ⭐⭐⭐⭐⭐ (9.5/10)
- **Facilidade de Uso:** ⭐⭐⭐⭐⭐ (10/10)

## Instalação

```bash
pip install pydub
# Requer FFmpeg instalado no sistema
# Windows: choco install ffmpeg
# Mac: brew install ffmpeg
# Linux: apt-get install ffmpeg
```

## Keywords/Triggers

- pydub
- audio
- sound
- audio processing
- audio conversion
- mp3
- wav
- audio editing
- sound manipulation
- audio effects
- volume control
- audio concatenation

## Exemplos de Código

### Básico: Converter Formato de Áudio

```python
from pydub import AudioSegment

def convert_audio(input_path: str, output_path: str, output_format: str = "mp3"):
    """Converte áudio entre formatos"""
    # Carregar áudio (detecta formato automaticamente)
    audio = AudioSegment.from_file(input_path)
    
    # Exportar no formato desejado
    audio.export(output_path, format=output_format)
    
    return {
        "output_path": output_path,
        "format": output_format,
        "duration_ms": len(audio),
        "channels": audio.channels,
        "sample_rate": audio.frame_rate
    }
```

### Intermediário: Cortar e Ajustar Volume

```python
from pydub import AudioSegment

def edit_audio(input_path: str, output_path: str, 
               start_ms: int = 0, end_ms: int = None,
               volume_change_db: float = 0.0):
    """Corta áudio e ajusta volume"""
    # Carregar áudio
    audio = AudioSegment.from_file(input_path)
    
    # Cortar segmento
    if end_ms is None:
        end_ms = len(audio)
    
    audio_segment = audio[start_ms:end_ms]
    
    # Ajustar volume
    if volume_change_db != 0:
        audio_segment = audio_segment + volume_change_db
    
    # Exportar
    audio_segment.export(output_path, format="mp3")
    
    return {
        "output_path": output_path,
        "original_duration_ms": len(audio),
        "cut_duration_ms": len(audio_segment),
        "volume_change_db": volume_change_db
    }
```

### Avançado: Concatenar e Aplicar Fade

```python
from pydub import AudioSegment

def concatenate_with_fade(audio_files: list, output_path: str,
                          fade_duration_ms: int = 1000):
    """Concatena múltiplos áudios com fade in/out"""
    if not audio_files:
        return {"success": False, "error": "No audio files provided"}
    
    # Carregar primeiro áudio
    combined = AudioSegment.from_file(audio_files[0])
    combined = combined.fade_out(fade_duration_ms)
    
    # Concatenar demais áudios com crossfade
    for audio_file in audio_files[1:]:
        next_audio = AudioSegment.from_file(audio_file)
        next_audio = next_audio.fade_in(fade_duration_ms)
        
        # Crossfade entre os áudios
        combined = combined.append(next_audio, crossfade=fade_duration_ms)
    
    # Exportar resultado
    combined.export(output_path, format="mp3", bitrate="192k")
    
    return {
        "output_path": output_path,
        "total_duration_ms": len(combined),
        "num_files_combined": len(audio_files),
        "fade_duration_ms": fade_duration_ms
    }
```

### Expert: Processamento Avançado Multi-Canal

```python
from pydub import AudioSegment
from pydub.effects import normalize, compress_dynamic_range

def advanced_audio_processing(input_path: str, output_path: str):
    """Processamento avançado de áudio com múltiplos efeitos"""
    # Carregar áudio
    audio = AudioSegment.from_file(input_path)
    
    # Separar canais se stereo
    if audio.channels == 2:
        left, right = audio.split_to_mono()
    else:
        left = right = audio
    
    # Aplicar normalização
    left = normalize(left)
    right = normalize(right)
    
    # Aplicar compressão dinâmica
    left = compress_dynamic_range(left)
    right = compress_dynamic_range(right)
    
    # Recombinar canais
    if audio.channels == 2:
        processed = AudioSegment.from_mono_audiosegments(left, right)
    else:
        processed = left
    
    # Ajustar propriedades
    processed = processed.set_frame_rate(44100)
    processed = processed.set_sample_width(2)  # 16-bit
    
    # Adicionar fade in/out suave
    processed = processed.fade_in(500).fade_out(500)
    
    # Exportar com alta qualidade
    processed.export(
        output_path,
        format="mp3",
        bitrate="320k",
        parameters=["-q:a", "0"]
    )
    
    return {
        "output_path": output_path,
        "original_channels": audio.channels,
        "sample_rate": processed.frame_rate,
        "duration_ms": len(processed),
        "effects_applied": ["normalize", "compress", "fade"]
    }
```

### Expert: Extração e Análise

```python
from pydub import AudioSegment
from pydub.silence import detect_silence

def analyze_audio(input_path: str):
    """Analisa propriedades e detecta silêncios"""
    # Carregar áudio
    audio = AudioSegment.from_file(input_path)
    
    # Propriedades básicas
    properties = {
        "duration_ms": len(audio),
        "duration_seconds": len(audio) / 1000.0,
        "channels": audio.channels,
        "sample_rate": audio.frame_rate,
        "sample_width": audio.sample_width,
        "frame_count": audio.frame_count(),
        "rms": audio.rms,
        "dBFS": audio.dBFS,
        "max_dBFS": audio.max_dBFS,
    }
    
    # Detectar silêncios (segmentos abaixo de -40dB)
    silences = detect_silence(
        audio,
        min_silence_len=1000,  # 1 segundo
        silence_thresh=-40
    )
    
    # Calcular estatísticas de silêncio
    total_silence_ms = sum([end - start for start, end in silences])
    silence_percentage = (total_silence_ms / len(audio)) * 100
    
    properties["silence_segments"] = len(silences)
    properties["total_silence_ms"] = total_silence_ms
    properties["silence_percentage"] = round(silence_percentage, 2)
    
    return properties
```

## Templates por Caso de Uso

### Template: Conversão Simples

```python
from pydub import AudioSegment
audio = AudioSegment.from_file("{input_path}")
audio.export("{output_path}", format="{format}")
```

### Template: Ajuste de Volume

```python
from pydub import AudioSegment
audio = AudioSegment.from_file("{input_path}")
audio = audio + {volume_db}  # Increase or decrease dB
audio.export("{output_path}", format="mp3")
```

### Template: Corte de Segmento

```python
from pydub import AudioSegment
audio = AudioSegment.from_file("{input_path}")
segment = audio[{start_ms}:{end_ms}]
segment.export("{output_path}", format="mp3")
```

### Template: Concatenação

```python
from pydub import AudioSegment
audio1 = AudioSegment.from_file("{file1}")
audio2 = AudioSegment.from_file("{file2}")
combined = audio1 + audio2
combined.export("{output_path}", format="mp3")
```

## Alternativas e Quando Usar

| Biblioteca | Quando Usar em Vez de PyDub |
|------------|------------------------------|
| librosa | Análise espectral, MIR, features |
| soundfile | I/O rápido, streaming |
| scipy.io.wavfile | Apenas WAV, sem dependências |
| audioread | Múltiplos backends, robustez |
| pydub + ffmpeg-python | Controle fino sobre FFmpeg |

## Requisitos do Sistema

- Python 3.7+
- FFmpeg ou Libav instalado no sistema
- 50MB+ RAM por minuto de áudio
- Espaço em disco para arquivos temporários

## Dependências

```
# PyDub em si é leve
# Mas requer FFmpeg instalado no sistema
```

## Notas de Compatibilidade

- ✅ Windows, Linux, macOS
- ✅ Python 3.7-3.12
- ✅ Suporta MP3, WAV, FLAC, OGG, M4A, etc.
- ⚠️ FFmpeg deve estar no PATH
- ⚠️ Formatos dependem de FFmpeg/Libav

## Troubleshooting Comum

### Problema: "ffmpeg/avconv not found"

**Solução:** Instalar FFmpeg
```bash
# Windows (com Chocolatey)
choco install ffmpeg

# macOS
brew install ffmpeg

# Linux
sudo apt-get install ffmpeg
```

### Problema: Arquivo muito grande para memória

**Solução:** Processar em chunks ou usar streaming
```python
# Para arquivos grandes, usar split
audio = AudioSegment.from_file("large.mp3")
chunk_length_ms = 60000  # 1 minuto
chunks = [audio[i:i+chunk_length_ms] for i in range(0, len(audio), chunk_length_ms)]
```

### Problema: Qualidade ruim após conversão

**Solução:** Especificar bitrate e parâmetros
```python
audio.export(
    "output.mp3",
    format="mp3",
    bitrate="320k",
    parameters=["-q:a", "0"]  # Qualidade máxima
)
```

## Score de Seleção

```python
def calculate_pydub_score(task_keywords: list) -> float:
    base_score = 0.70
    
    # Boost para operações simples de áudio
    if any(k in task_keywords for k in ['convert', 'cut', 'trim', 'volume', 'concatenate']):
        base_score += 0.20
    
    # Boost para formatos suportados
    if any(k in task_keywords for k in ['mp3', 'wav', 'audio']):
        base_score += 0.10
    
    # Penalty para análise espectral complexa
    if any(k in task_keywords for k in ['spectral', 'fft', 'features', 'mfcc']):
        base_score -= 0.30
    
    return min(base_score, 0.95)
```

## Use Cases Ideais

- ✅ Conversão entre formatos de áudio
- ✅ Edição simples (cortar, colar, concatenar)
- ✅ Ajuste de volume e normalização
- ✅ Aplicação de fades
- ✅ Geração de ringtones
- ✅ Podcast editing básico
- ✅ Automação de tarefas de áudio

## Não Use Para

- ❌ Análise espectral avançada (use librosa)
- ❌ Processamento em tempo real
- ❌ Streaming de áudio
- ❌ DSP complexo (filtros IIR/FIR personalizados)
- ❌ Arquivos de áudio gigantes (>100MB)

## Última Atualização

2025-01-15