@echo off
echo ========================================
echo RAILWAY REDEPLOY - SyncAds Python Service
echo ========================================
echo.

cd /d "%~dp0"

echo [1/5] Removendo arquivo problemático...
if exist nul del nul
echo OK

echo.
echo [2/5] Verificando Railway CLI...
railway whoami
if errorlevel 1 (
    echo ERRO: Railway CLI nao encontrado ou nao logado
    echo Execute: railway login
    pause
    exit /b 1
)
echo OK

echo.
echo [3/5] Linkando projeto...
railway link
if errorlevel 1 (
    echo ERRO ao linkar projeto
    pause
    exit /b 1
)
echo OK

echo.
echo [4/5] Fazendo deploy...
git add .
git commit -m "fix: railway redeploy" --allow-empty
railway up --detach
if errorlevel 1 (
    echo ERRO no deploy
    pause
    exit /b 1
)
echo OK

echo.
echo [5/5] Aguardando servico iniciar (60 segundos)...
timeout /t 60 /nobreak

echo.
echo [TESTE] Testando API...
curl -s https://syncads-python-microservice-production.up.railway.app/api/extension/health
echo.

echo.
echo ========================================
echo DEPLOY CONCLUIDO!
echo ========================================
echo.
echo Proximos passos:
echo 1. Verifique se o teste acima retornou {"status":"ok"}
echo 2. Recarregue a extensao em chrome://extensions/
echo 3. Teste a conexao
echo.
pause
