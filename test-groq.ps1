# Teste DIRETO da API do GROQ
$apiKey = "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"
$url = "https://api.groq.com/openai/v1/chat/completions"

$headers = @{
    "Authorization" = "Bearer $apiKey"
    "Content-Type" = "application/json"
}

$body = @{
    model = "llama-3.3-70b-versatile"
    messages = @(
        @{
            role = "user"
            content = "Responda apenas: 'GROQ funcionando perfeitamente!'"
        }
    )
    temperature = 0.7
    max_tokens = 100
} | ConvertTo-Json

Write-Host "🧪 Testando API Key do GROQ..." -ForegroundColor Cyan
Write-Host "Modelo: llama-3.3-70b-versatile" -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $body -ErrorAction Stop
    Write-Host "✅ SUCESSO! GROQ está funcionando!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Resposta da IA:" -ForegroundColor Yellow
    Write-Host $response.choices[0].message.content
    Write-Host ""
    Write-Host "Tokens usados: $($response.usage.total_tokens)" -ForegroundColor Gray
    Write-Host "Velocidade: $($response.usage.total_tokens / ($response.usage.prompt_tokens + $response.usage.completion_tokens)) tok/s" -ForegroundColor Gray
} catch {
    Write-Host "❌ ERRO na API GROQ!" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host ""
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Host "Detalhes:" -ForegroundColor Yellow
        Write-Host $errorBody
    }
}
