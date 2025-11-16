@echo off
chcp 65001 >nul
cls

echo ============================================
echo 🔑 CONFIGURAR API KEYS - RAILWAY
echo ============================================
echo.
echo Este script irá configurar as API keys necessárias
echo para o Omnibrain Engine no Railway.
echo.
echo ============================================
echo.

cd "%~dp0"

echo 📋 API Keys Necessárias:
echo.
echo 1. OpenAI API Key (OBRIGATÓRIA)
echo    - Obter em: https://platform.openai.com/api-keys
echo    - Formato: sk-proj-...
echo.
echo 2. Anthropic API Key (RECOMENDADA - fallback)
echo    - Obter em: https://console.anthropic.com/
echo    - Formato: sk-ant-...
echo.
echo 3. Groq API Key (OPCIONAL - rápida)
echo    - Obter em: https://console.groq.com/
echo    - Formato: gsk_...
echo.
echo ============================================
echo.

:MENU
echo.
echo O que deseja fazer?
echo.
echo 1) Adicionar OpenAI API Key
echo 2) Adicionar Anthropic API Key
echo 3) Adicionar Groq API Key
echo 4) Adicionar TODAS as API Keys
echo 5) Ver API Keys configuradas
echo 6) Adicionar Redis URL
echo 7) Sair
echo.
set /p choice="Escolha (1-7): "

if "%choice%"=="1" goto OPENAI
if "%choice%"=="2" goto ANTHROPIC
if "%choice%"=="3" goto GROQ
if "%choice%"=="4" goto ALL
if "%choice%"=="5" goto VIEW
if "%choice%"=="6" goto REDIS
if "%choice%"=="7" goto END
goto MENU

:OPENAI
echo.
echo 🔑 Configurando OpenAI API Key...
echo.
set /p openai_key="Cole sua OpenAI API Key: "
if "%openai_key%"=="" (
    echo ❌ API Key vazia!
    goto MENU
)
echo.
echo Adicionando ao Railway...
railway variables --set OPENAI_API_KEY="%openai_key%"
if %errorlevel% equ 0 (
    echo ✅ OpenAI API Key configurada com sucesso!
) else (
    echo ❌ Erro ao configurar OpenAI API Key
)
goto MENU

:ANTHROPIC
echo.
echo 🔑 Configurando Anthropic API Key...
echo.
set /p anthropic_key="Cole sua Anthropic API Key: "
if "%anthropic_key%"=="" (
    echo ❌ API Key vazia!
    goto MENU
)
echo.
echo Adicionando ao Railway...
railway variables --set ANTHROPIC_API_KEY="%anthropic_key%"
if %errorlevel% equ 0 (
    echo ✅ Anthropic API Key configurada com sucesso!
) else (
    echo ❌ Erro ao configurar Anthropic API Key
)
goto MENU

:GROQ
echo.
echo 🔑 Configurando Groq API Key...
echo.
set /p groq_key="Cole sua Groq API Key: "
if "%groq_key%"=="" (
    echo ❌ API Key vazia!
    goto MENU
)
echo.
echo Adicionando ao Railway...
railway variables --set GROQ_API_KEY="%groq_key%"
if %errorlevel% equ 0 (
    echo ✅ Groq API Key configurada com sucesso!
) else (
    echo ❌ Erro ao configurar Groq API Key
)
goto MENU

:ALL
echo.
echo 🔑 Configurando TODAS as API Keys...
echo.
set /p openai_key="1/3 - Cole sua OpenAI API Key: "
set /p anthropic_key="2/3 - Cole sua Anthropic API Key: "
set /p groq_key="3/3 - Cole sua Groq API Key (ou deixe vazio): "
echo.
echo Adicionando ao Railway...
if not "%openai_key%"=="" (
    railway variables --set OPENAI_API_KEY="%openai_key%"
    echo ✅ OpenAI configurada
)
if not "%anthropic_key%"=="" (
    railway variables --set ANTHROPIC_API_KEY="%anthropic_key%"
    echo ✅ Anthropic configurada
)
if not "%groq_key%"=="" (
    railway variables --set GROQ_API_KEY="%groq_key%"
    echo ✅ Groq configurada
)
echo.
echo ✅ Todas as API Keys configuradas!
goto MENU

:VIEW
echo.
echo 📋 API Keys Configuradas:
echo.
railway variables | findstr /I "API_KEY REDIS"
echo.
pause
goto MENU

:REDIS
echo.
echo 🗄️ Configurando Redis URL...
echo.
echo Opções:
echo 1) Railway Redis (recomendado)
echo 2) Upstash Redis (serverless)
echo 3) Redis personalizado
echo.
set /p redis_choice="Escolha (1-3): "

if "%redis_choice%"=="1" (
    echo.
    echo Adicionando Railway Redis...
    echo Execute manualmente: railway add
    echo Selecione: Redis
    pause
    goto MENU
)

if "%redis_choice%"=="2" (
    echo.
    echo Configure em: https://console.upstash.com/
    set /p redis_url="Cole sua Redis URL: "
    if not "%redis_url%"=="" (
        railway variables --set REDIS_URL="%redis_url%"
        echo ✅ Redis URL configurada!
    )
    goto MENU
)

if "%redis_choice%"=="3" (
    set /p redis_url="Cole sua Redis URL: "
    if not "%redis_url%"=="" (
        railway variables --set REDIS_URL="%redis_url%"
        echo ✅ Redis URL configurada!
    )
    goto MENU
)

goto MENU

:END
echo.
echo ============================================
echo.
echo ✅ Configuração concluída!
echo.
echo 📊 Próximos passos:
echo.
echo 1. Aguardar redeploy automático do Railway (2-3 min)
echo 2. Testar health check:
echo    curl https://syncads-python-microservice-production.up.railway.app/health
echo.
echo 3. Testar Omnibrain:
echo    curl https://syncads-python-microservice-production.up.railway.app/api/omnibrain/health
echo.
echo 4. Abrir o sistema:
echo    https://syncads.com.br
echo.
echo ============================================
echo.
pause
exit
