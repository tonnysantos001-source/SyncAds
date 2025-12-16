# ============================================
# RAILWAY - SETUP E REDEPLOY AUTOMÁTICO
# ============================================

Write-Host "🚂 RAILWAY - SETUP E GERENCIAMENTO" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Gray
Write-Host ""

# ============================================
# VERIFICAR SE TOKEN ESTÁ CONFIGURADO
# ============================================

if (-not $env:RAILWAY_TOKEN) {
    Write-Host "⚠️  RAILWAY_TOKEN não encontrado!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📝 INSTRUÇÕES:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Acesse: https://railway.app/account/tokens" -ForegroundColor White
    Write-Host "2. Clique em 'Create New Token'" -ForegroundColor White
    Write-Host "3. Copie o token" -ForegroundColor White
    Write-Host "4. Execute:" -ForegroundColor White
    Write-Host '   $env:RAILWAY_TOKEN="seu_token_aqui"' -ForegroundColor Green
    Write-Host "5. Execute este script novamente" -ForegroundColor White
    Write-Host ""
    Write-Host "📖 Guia completo: RAILWAY_TOKEN_SETUP.md" -ForegroundColor Gray
    Write-Host ""
    
    # Perguntar se quer definir agora
    $resposta = Read-Host "Você tem o token? (S/N)"
    if ($resposta -eq "S" -or $resposta -eq "s") {
        $token = Read-Host "Cole o token aqui" -AsSecureString
        $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($token)
        $tokenPlainText = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
        $env:RAILWAY_TOKEN = $tokenPlainText
        
        Write-Host ""
        Write-Host "✅ Token configurado!" -ForegroundColor Green
        Write-Host ""
    }
    else {
        Write-Host ""
        Write-Host "❌ Configure o token e execute novamente." -ForegroundColor Red
        exit 1
    }
}

# ============================================
# MENU INTERATIVO
# ============================================

function Show-Menu {
    Write-Host ""
    Write-Host "🚀 RAILWAY - MENU DE OPÇÕES" -ForegroundColor Cyan
    Write-Host "=" * 50 -ForegroundColor Gray
    Write-Host ""
    Write-Host "  1. 📊 Ver Status do Projeto" -ForegroundColor White
    Write-Host "  2. 🚀 Fazer Redeploy" -ForegroundColor White
    Write-Host "  3. 📋 Ver Logs" -ForegroundColor White
    Write-Host "  4. 🔐 Ver Variáveis de Ambiente" -ForegroundColor White
    Write-Host "  5. 🔄 Redeploy + Logs (Automático)" -ForegroundColor Yellow
    Write-Host "  6. ❌ Sair" -ForegroundColor Gray
    Write-Host ""
    Write-Host "=" * 50 -ForegroundColor Gray
    Write-Host ""
}

function Invoke-RailwayCommand {
    param(
        [string]$Command
    )
    
    Write-Host ""
    Write-Host "⚡ Executando: $Command" -ForegroundColor Cyan
    Write-Host ""
    
    $result = node scripts/railway-api-client.mjs $Command 2>&1
    Write-Host $result
    
    Write-Host ""
    Write-Host "✅ Comando concluído!" -ForegroundColor Green
    Write-Host ""
}

# ============================================
# LOOP PRINCIPAL
# ============================================

$continue = $true
while ($continue) {
    Show-Menu
    $opcao = Read-Host "Escolha uma opção (1-6)"
    
    switch ($opcao) {
        "1" {
            Invoke-RailwayCommand "status"
            Read-Host "Pressione ENTER para continuar"
        }
        "2" {
            Write-Host ""
            Write-Host "🚀 Iniciando REDEPLOY..." -ForegroundColor Yellow
            Write-Host "   Isso irá rebuildar e redeployar o serviço" -ForegroundColor Gray
            Write-Host ""
            $confirma = Read-Host "Confirma? (S/N)"
            
            if ($confirma -eq "S" -or $confirma -eq "s") {
                Invoke-RailwayCommand "redeploy"
                Write-Host ""
                Write-Host "⏱️  Aguarde 3-5 minutos para o build completar" -ForegroundColor Yellow
                Write-Host "🔗 Acompanhe em: https://railway.app/project/5f47519b-0823-45aa-ab00-bc9bcaaa1c94" -ForegroundColor Cyan
                Write-Host ""
            }
            else {
                Write-Host "❌ Redeploy cancelado" -ForegroundColor Red
            }
            
            Read-Host "Pressione ENTER para continuar"
        }
        "3" {
            Invoke-RailwayCommand "logs"
            Read-Host "Pressione ENTER para continuar"
        }
        "4" {
            Invoke-RailwayCommand "variables"
            Read-Host "Pressione ENTER para continuar"
        }
        "5" {
            Write-Host ""
            Write-Host "🚀 REDEPLOY AUTOMÁTICO + MONITORAMENTO" -ForegroundColor Yellow
            Write-Host ""
            
            # Fazer redeploy
            Invoke-RailwayCommand "redeploy"
            
            Write-Host ""
            Write-Host "⏱️  Aguardando 2 minutos antes de verificar logs..." -ForegroundColor Gray
            Start-Sleep -Seconds 120
            
            # Ver logs
            Invoke-RailwayCommand "logs"
            
            Write-Host ""
            Write-Host "🔍 Testando endpoint /health..." -ForegroundColor Cyan
            
            try {
                $response = Invoke-WebRequest -Uri "https://syncads-python-microservice-production.up.railway.app/health" -Method GET -TimeoutSec 10
                
                if ($response.StatusCode -eq 200) {
                    Write-Host "✅ SERVIÇO FUNCIONANDO! Health check retornou 200 OK" -ForegroundColor Green
                    Write-Host ""
                    Write-Host "Resposta:" -ForegroundColor White
                    Write-Host $response.Content -ForegroundColor Gray
                }
                else {
                    Write-Host "⚠️  Health check retornou: $($response.StatusCode)" -ForegroundColor Yellow
                }
            }
            catch {
                Write-Host "❌ Serviço ainda não está respondendo" -ForegroundColor Red
                Write-Host "   Aguarde mais alguns minutos e tente novamente" -ForegroundColor Gray
            }
            
            Write-Host ""
            Read-Host "Pressione ENTER para continuar"
        }
        "6" {
            Write-Host ""
            Write-Host "👋 Até logo!" -ForegroundColor Cyan
            Write-Host ""
            $continue = $false
        }
        default {
            Write-Host ""
            Write-Host "❌ Opção inválida! Escolha 1-6" -ForegroundColor Red
            Write-Host ""
            Start-Sleep -Seconds 2
        }
    }
}
