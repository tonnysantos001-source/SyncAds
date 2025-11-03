#!/bin/bash

# Backup
cp supabase/functions/gateway-config-verify/index.ts supabase/functions/gateway-config-verify/index.ts.backup

# Encontrar linha onde começa paguexAdapter e substituir até o fechamento
# Vou fazer manualmente via sed ou edição direta

echo "Adapter melhorado está em paguex_adapter_improved.ts"
echo "Aplicar manualmente no index.ts"
