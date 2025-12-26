@echo off
echo ===================================================
echo   SYNCADS AUTOMATED DEPLOY - ANTI-LIE SYSTEM
echo ===================================================
echo.
echo [1/3] Login to Supabase...
call supabase login
echo.

echo [2/3] Linking to Project (SyncAds)...
echo *** ATENCAO: Se pedir senha do Banco de Dados, digite-a! ***
call supabase link --project-ref ovskepqggmxlfckxqgbr
echo.

echo [3/3] Deploying Cloud Functions...
call supabase functions deploy chat-stream
echo.

echo ===================================================
echo   DEPLOY CONCLUIDO!
echo ===================================================
echo.
echo Agora teste dizendo: "abra o google"
echo.
pause
