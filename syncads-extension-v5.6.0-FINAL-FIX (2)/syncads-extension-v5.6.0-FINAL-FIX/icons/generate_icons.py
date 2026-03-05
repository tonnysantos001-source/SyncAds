#!/usr/bin/env python3
"""
Gerador de Ícones para Extensão Chrome SyncAds
Cria ícones 16x16, 48x48 e 128x128 pixels
"""

import os

from PIL import Image, ImageDraw, ImageFont


def create_gradient(width, height, color1, color2):
    """Cria um gradiente entre duas cores"""
    base = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(base)

    for y in range(height):
        # Interpolar entre as duas cores
        ratio = y / height
        r = int(color1[0] * (1 - ratio) + color2[0] * ratio)
        g = int(color1[1] * (1 - ratio) + color2[1] * ratio)
        b = int(color1[2] * (1 - ratio) + color2[2] * ratio)

        draw.line([(0, y), (width, y)], fill=(r, g, b, 255))

    return base


def create_icon(size):
    """Cria um ícone do SyncAds no tamanho especificado"""
    # Cores do gradiente (roxo/azul)
    color1 = (102, 126, 234)  # #667eea
    color2 = (118, 75, 162)  # #764ba2

    # Criar base com gradiente circular
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Desenhar círculo de fundo com gradiente
    padding = size // 8
    circle_bbox = [padding, padding, size - padding, size - padding]

    # Fundo do círculo
    draw.ellipse(circle_bbox, fill=color1)

    # Desenhar símbolo de IA/Robô
    center_x = size // 2
    center_y = size // 2

    # Tamanho dos elementos baseado no tamanho do ícone
    element_size = size // 4

    # Desenhar "cérebro/circuito" estilizado
    # Círculo central (núcleo da IA)
    core_size = element_size // 2
    core_bbox = [
        center_x - core_size,
        center_y - core_size,
        center_x + core_size,
        center_y + core_size,
    ]
    draw.ellipse(core_bbox, fill=(255, 255, 255, 255))

    # Linhas de conexão (estilo circuito)
    line_width = max(1, size // 32)

    # Linhas horizontais
    draw.line(
        [(center_x - element_size, center_y), (center_x - core_size, center_y)],
        fill=(255, 255, 255, 255),
        width=line_width,
    )

    draw.line(
        [(center_x + core_size, center_y), (center_x + element_size, center_y)],
        fill=(255, 255, 255, 255),
        width=line_width,
    )

    # Linhas verticais
    draw.line(
        [(center_x, center_y - element_size), (center_x, center_y - core_size)],
        fill=(255, 255, 255, 255),
        width=line_width,
    )

    draw.line(
        [(center_x, center_y + core_size), (center_x, center_y + element_size)],
        fill=(255, 255, 255, 255),
        width=line_width,
    )

    # Nós nas extremidades
    node_size = max(2, size // 16)

    # Nós horizontais
    draw.ellipse(
        [
            center_x - element_size - node_size,
            center_y - node_size,
            center_x - element_size + node_size,
            center_y + node_size,
        ],
        fill=(255, 255, 255, 255),
    )

    draw.ellipse(
        [
            center_x + element_size - node_size,
            center_y - node_size,
            center_x + element_size + node_size,
            center_y + node_size,
        ],
        fill=(255, 255, 255, 255),
    )

    # Nós verticais
    draw.ellipse(
        [
            center_x - node_size,
            center_y - element_size - node_size,
            center_x + node_size,
            center_y - element_size + node_size,
        ],
        fill=(255, 255, 255, 255),
    )

    draw.ellipse(
        [
            center_x - node_size,
            center_y + element_size - node_size,
            center_x + node_size,
            center_y + element_size + node_size,
        ],
        fill=(255, 255, 255, 255),
    )

    return img


def main():
    """Gera todos os ícones necessários"""
    script_dir = os.path.dirname(os.path.abspath(__file__))

    sizes = [16, 48, 128]

    print("🎨 Gerando ícones da extensão SyncAds...")
    print()

    for size in sizes:
        filename = f"icon{size}.png"
        filepath = os.path.join(script_dir, filename)

        print(f"  Criando {filename}... ", end="")

        icon = create_icon(size)
        icon.save(filepath, "PNG")

        # Verificar tamanho do arquivo
        file_size = os.path.getsize(filepath)
        print(f"✅ ({file_size} bytes)")

    print()
    print("🎉 Todos os ícones foram criados com sucesso!")
    print()
    print("Arquivos gerados:")
    for size in sizes:
        print(f"  ✓ icon{size}.png ({size}x{size} pixels)")


if __name__ == "__main__":
    try:
        main()
    except ImportError:
        print("❌ Erro: PIL/Pillow não está instalado")
        print("Execute: pip install Pillow")
    except Exception as e:
        print(f"❌ Erro ao gerar ícones: {e}")
