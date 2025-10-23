$url = "https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/chat-stream"
$headers = @{
    "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92c2tlcHFnZ214bGZja3hxZ2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MjQ4NTUsImV4cCI6MjA3NjQwMDg1NX0.UdNgqpTN38An6FuoJPZlj_zLkmAqfJQXb6i1DdTQO_E"
    "Content-Type" = "application/json"
}
$body = @{
    message = "Olá! Você está funcionando?"
    conversationId = "445775ff-520e-4028-b6bd-30c716ff5b86"
} | ConvertTo-Json

Write-Host "Testando Edge Function chat-stream..." -ForegroundColor Cyan
Write-Host "URL: $url" -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $body -ErrorAction Stop
    Write-Host "✅ SUCESSO! Resposta recebida:" -ForegroundColor Green
    Write-Host ""
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ ERRO:" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "Mensagem: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Host ""
        Write-Host "Detalhes:" -ForegroundColor Yellow
        Write-Host $errorBody
    }
}
