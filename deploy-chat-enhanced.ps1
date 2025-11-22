# ============================================
# DEPLOY MANUAL DA EDGE FUNCTION chat-enhanced
# ============================================

Write-Host "🚀 Preparando deploy manual da Edge Function..." -ForegroundColor Cyan
Write-Host ""

# 1. Copiar código para área de transferência
$functionPath = "supabase\functions\chat-enhanced\index.ts"
$fullPath = Join-Path (Get-Location) $functionPath

if (Test-Path $fullPath) {
    $content = Get-Content $fullPath -Raw
    Set-Clipboard -Value $content
    
    Write-Host "✅ Código copiado para área de transferência!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 PRÓXIMOS PASSOS:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Acesse: https://supabase.com/dashboard/project/ovskepqggmxlfckxqgbr/functions" -ForegroundColor White
    Write-Host "2. Clique em 'chat-enhanced'" -ForegroundColor White
    Write-Host "3. Clique em 'Edit Function'" -ForegroundColor White
    Write-Host "4. Cole o código (Ctrl+V) - JÁ ESTÁ NA ÁREA DE TRANSFERÊNCIA" -ForegroundColor White
    Write-Host "5. Clique em 'Deploy'" -ForegroundColor White
    Write-Host ""
    Write-Host "Ou altere use este método alternativo:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "ALTERNATIVA - Deploy via CLI sem Docker:" -ForegroundColor Cyan
    Write-Host "1. Instale Deno: https://deno.land/#installation" -ForegroundColor White
    Write-Host "2. Execute: supabase functions deploy chat-enhanced --legacy-bundle" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Tamanho do código: $($content.Length) caracteres" -ForegroundColor Gray
    Write-Host "Linhas: $((Get-Content $fullPath).Count)" -ForegroundColor Gray
    
}
else {
    Write-Host "❌ Arquivo não encontrado: $fullPath" -ForegroundColor Red
}

Write-Host ""
Write-Host "Pressione qualquer tecla para sair..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
