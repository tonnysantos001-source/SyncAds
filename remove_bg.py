from PIL import Image
import numpy as np

# Carregar a imagem original
img = Image.open(r'C:\Users\dinho\.gemini\antigravity\brain\6d5b888d-e518-453a-ba5a-87d12228c2d4\uploaded_image_1_1765983413858.png')

# Converter para RGBA se ainda não estiver
img = img.convert('RGBA')

# Pegar os dados da imagem
data = np.array(img)

# Criar uma máscara para pixels brancos ou quase brancos
# Consideramos branco pixels com R, G, B > 240
white_areas = (data[:, :, 0] > 240) & (data[:, :, 1] > 240) & (data[:, :, 2] > 240)

# Tornar os pixels brancos transparentes
data[white_areas] = [255, 255, 255, 0]

# Criar nova imagem com fundo transparente
img_transparent = Image.fromarray(data)

# Salvar a imagem sem fundo
img_transparent.save(r'C:\Users\dinho\Documents\GitHub\SyncAds\public\syncads-logo.png')
img_transparent.save(r'C:\Users\dinho\Documents\GitHub\SyncAds\public\favicon.png')

print("Logo salva com fundo transparente!")
print(f"Tamanho original: {img.size}")
