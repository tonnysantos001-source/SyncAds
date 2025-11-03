-- Verificar configuração do gateway FusionPay
SELECT 
  gc.id,
  gc."userId",
  gc."isActive",
  gc."isDefault", 
  gc."isVerified",
  gc.environment,
  g.name as gateway_name,
  g.slug as gateway_slug,
  gc."createdAt"
FROM "GatewayConfig" gc
JOIN "Gateway" g ON g.id = gc."gatewayId"
WHERE g.slug = 'fusionpay'
ORDER BY gc."createdAt" DESC
LIMIT 5;
