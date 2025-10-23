# Teste DIRETO da API do OpenRouter
$apiKey = "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"
$url = "https://openrouter.ai/api/v1/chat/completions"

$headers = @{
    "Authorization" = "Bearer $apiKey"
    "Content-Type" = "application/json"
    "HTTP-Referer" = "https://syncads.com"
}

$body = @{
    model = "openai/gpt-3.5-turbo"
    messages = @(
        @{
            role = "user"
            content = "Diga apenas 'Funcionando!' se você está online."
        }
    )
} | ConvertTo-Json

Write-Host "🧪 Testando API Key do OpenRouter..." -ForegroundColor Cyan
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $body -ErrorAction Stop
    Write-Host "✅ SUCESSO! API Key válida!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Resposta da IA:" -ForegroundColor Yellow
    Write-Host $response.choices[0].message.content
    Write-Host ""
} catch {
    Write-Host "❌ ERRO na API Key!" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host ""
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Host "Detalhes:" -ForegroundColor Yellow
        Write-Host $errorBody
    }
}
