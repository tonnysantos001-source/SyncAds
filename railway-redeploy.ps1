# ============================================
# RAILWAY AUTO-DEPLOY SCRIPT
# Execute este script para fazer redeploy
# ============================================

Write-Host "🚀 INICIANDO REDEPLOY RAILWAY..." -ForegroundColor Cyan
Write-Host ""

# Navegar para o diretório raiz do projeto
Set-Location "c:\Users\dinho\Documents\GitHub\SyncAds"

Write-Host "📍 Diretório atual: $(Get-Location)" -ForegroundColor Yellow
Write-Host ""

# Verificar se railway CLI está instalada
Write-Host "🔍 Verificando Railway CLI..." -ForegroundColor Cyan
$railwayVersion = railway version 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Railway CLI encontrada: $railwayVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Railway CLI não encontrada ou não funcional" -ForegroundColor Red
    Write-Host ""
    Write-Host "📝 OPÇÃO MANUAL:" -ForegroundColor Yellow
    Write-Host "1. Acesse: https://railway.app/project/5f47519b-0823-45aa-ab00-bc9bcaaa1c94" -ForegroundColor White
    Write-Host "2. Clique no serviço 'SyncAds'" -ForegroundColor White
    Write-Host "3. Vá em 'Deployments'" -ForegroundColor White
    Write-Host "4. Clique em 'Redeploy' no último deployment" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "🔗 Linkando ao projeto..." -ForegroundColor Cyan
railway link 5f47519b-0823-45aa-ab00-bc9bcaaa1c94

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Falha ao linkar. Tentando continuar..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🌍 Configurando ambiente de produção..." -ForegroundColor Cyan
railway environment production

Write-Host ""
Write-Host "📊 Verificando status..." -ForegroundColor Cyan
railway status

Write-Host ""
Write-Host "🚀 Fazendo REDEPLOY..." -ForegroundColor Cyan
Write-Host "   (Isso pode demorar alguns minutos)" -ForegroundColor Gray
railway redeploy --yes

Write-Host ""
Write-Host "📋 Acompanhando logs..." -ForegroundColor Cyan
railway logs --tail 50

Write-Host ""
Write-Host "✅ DEPLOY INICIADO!" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 LINKS IMPORTANTES:" -ForegroundColor Cyan
Write-Host "   Dashboard: https://railway.app/project/5f47519b-0823-45aa-ab00-bc9bcaaa1c94" -ForegroundColor White
Write-Host "   Service URL: https://syncads-python-microservice-production.up.railway.app" -ForegroundColor White
Write-Host "   Health Check: https://syncads-python-microservice-production.up.railway.app/health" -ForegroundColor White
Write-Host ""
Write-Host "⏱️  Aguarde 3-5 minutos para o build completar..." -ForegroundColor Yellow
Write-Host ""
