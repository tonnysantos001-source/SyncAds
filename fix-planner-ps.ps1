# PowerShell script to fix IMAGE placeholders in planner.ts

$file = "supabase\functions\chat-stream\planner.ts"
$content = Get-Content $file -Raw

# Strategy: Replace the entire problematic section (lines 54-95) with a cleaned version
# This is the IMAGE placeholders documentation section

$oldSection = @'
**📚 EBOOKS - INSTRUÇÕES ESPECIAIS:**

Para ebooks, receitas, guias e conteúdo longo, use:

1. **Imagens ilustrativas** - Use placeholders:
   ```html
{ { IMAGE:palavra chave descritiva } }
```
   
   Exemplos:
   - `{ { IMAGE:pão de queijo dourado } } ` → Imagem de pão de queijo
   - `{ { IMAGE:ebook cooking recipes } } ` → Capa de livro de receitas
   - `{ { IMAGE:lasanha layers close - up } } ` → Foto detalhada

2. **Estrutura de ebook completo**:
   ```html
  < !--CAPA -->
    <div style="text-align: center; padding: 80px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; page-break-after: always;" >
      <h1 style="font-size: 56px; font-family: 'Georgia', serif; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);" >
        50 Receitas Brasileiras
          </h1>
          < p style = "font-size: 24px; margin-top: 30px;" > Um guia completo </p>
{ { IMAGE:brazilian cookbook food photography } }
</div>

  < !--SUMÁRIO -->
    <div style="page-break-after: always;" >
      <h2 style="font-size: 36px; border-bottom: 3px solid #3498DB;" > Sumário </h2>
        < ul style = "font-size: 18px; line-height: 2.5; list-style: none;" >
          <li>Capítulo 1: Receitas Básicas ....................3 </li>
            < li > Capítulo 2: Pratos Regionais .................. 15 </li>
              </ul>
              </div>

              < !--CAPÍTULO -->
                <div style="page-break-before: always;" >
                  <h2 style="font-size: 36px; color: #E74C3C;" > Capítulo 1: Receitas Básicas </h2>

                    < !--RECEITA -->
                      <h3 style="font-size: 28px; margin-top: 40px;" > Pão de Queijo </h3>
{ { IMAGE:brazilian cheese bread golden } }
'@

$newSection = @'
**📚 EBOOKS - INSTRUÇÕES ESPECIAIS:**

Para ebooks, receitas, guias e conteúdo longo:

1. **Imagens ilustrativas**: Adicione marcadores de imagem no formato (exemplo): IMAGEM_ILUSTRATIVA_AQUI

2. **Estrutura de ebook completo**: Use divs com estilos inline, títulos h1/h2/h3, listas, tabelas.
'@

# Replace the section
$content = $content -replace [regex]::Escape($oldSection), $newSection

# Save
Set-Content $file -Value $content -NoNewline

Write-Host "✅ Simplified IMAGE documentation in planner.ts"
