# Script PowerShell para remover fundo branco da logo

Add-Type -AssemblyName System.Drawing

# Carregar a imagem
$imagePath = "C:\Users\dinho\.gemini\antigravity\brain\6d5b888d-e518-453a-ba5a-87d12228c2d4\uploaded_image_1_1765983413858.png"
$outputPath = "C:\Users\dinho\Documents\GitHub\SyncAds\public\syncads-logo-transparent.png"

$bitmap = New-Object System.Drawing.Bitmap($imagePath)

# Criar um novo bitmap com suporte a transparência
$transparentBitmap = New-Object System.Drawing.Bitmap($bitmap.Width, $bitmap.Height)

# Processar cada pixel
for ($x = 0; $x -lt $bitmap.Width; $x++) {
    for ($y = 0; $y -lt $bitmap.Height; $y++) {
        $pixel = $bitmap.GetPixel($x, $y)
        
        # Se o pixel for muito branco (R, G, B > 240), tornar transparente
        if ($pixel.R -gt 240 -and $pixel.G -gt 240 -and $pixel.B -gt 240) {
            $transparentBitmap.SetPixel($x, $y, [System.Drawing.Color]::Transparent)
        } else {
            $transparentBitmap.SetPixel($x, $y, $pixel)
        }
    }
}

# Salvar a imagem
$transparentBitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)

Write-Host "Logo salva com fundo transparente em: $outputPath"
Write-Host "Tamanho: $($bitmap.Width)x$($bitmap.Height)"

# Limpar recursos
$bitmap.Dispose()
$transparentBitmap.Dispose()
