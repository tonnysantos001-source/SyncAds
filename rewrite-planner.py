#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Reescreve a seção de documentação de IMAGES no planner.ts
de forma TypeScript-safe
"""

# Lê o arquivo
with open('supabase/functions/chat-stream/planner.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Nova seção de documentação segura
new_image_docs = """
**📚 EBOOKS - INSTRUÇÕES ESPECIAIS:**

Para ebooks, receitas, guias e conteúdo longo:

1. **Imagens ilustrativas**: A IA pode adicionar imagens usando a sintaxe especial de duplas chaves com a palavra IMAGE seguida de dois pontos e uma descrição da imagem desejada.

2. **Estrutura de ebook completo**: Use HTML com estilos inline para criar layouts profissionais:
   - Capas com gradientes coloridos
   - Sumários com listas
   - Capítulos com quebras de página
   - Receitas/seções com títulos h1, h2, h3
   - Listas ordenadas e não ordenadas
   - Tabelas para informações nutricionais
   - Boxes de dicas com backgrounds coloridos

3. **Tabelas profissionais**: Use tags table, thead, tbody, tr, th, td com estilos inline para bordas, padding, cores de fundo.

4. **Boxes de dicas**: Divs com background colorido, border-left destacado, e padding adequado.

"""

# Encontra índices de início e fim da seção problemática
# Procura por "**📚 EBOOKS" até "❌ NÃO USE:"
start_idx = None
end_idx = None

for i, line in enumerate(lines):
    if '**📚 EBOOKS' in line and start_idx is None:
        start_idx = i
    if '**❌ NÃO USE:**' in line and start_idx is not None:
        end_idx = i
        break

print(f"Found section from line {start_idx + 1} to {end_idx}")

# Substitui a seção
if start_idx is not None and end_idx is not None:
    # Remove linhas antigas
    new_lines = lines[:start_idx] + [new_image_docs] + lines[end_idx:]
    
    # Escreve de volta
    with open('supabase/functions/chat-stream/planner.ts', 'w', encoding='utf-8', newline='\r\n') as f:
        f.writelines(new_lines)
    
    print(f"✅ Replaced {end_idx - start_idx} lines with simplified IMAGE docs")
    print("✅ File saved successfully")
else:
    print("❌ Could not find section markers")
