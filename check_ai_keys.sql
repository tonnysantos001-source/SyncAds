-- Verificar se GlobalAiConnection existe e tem keys
SELECT 
  provider,
  CASE 
    WHEN api_key IS NOT NULL THEN '✅ Configurada'
    ELSE '❌ Ausente'
  END as status,
  is_active,
  created_at
FROM "GlobalAiConnection"
ORDER BY provider;
