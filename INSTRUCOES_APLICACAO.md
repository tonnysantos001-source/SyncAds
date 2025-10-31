# Instruções para Correção do Chat no Celular

## Problema
O chat da aplicação não está funcionando corretamente em dispositivos móveis devido a problemas nas políticas de Row Level Security (RLS) no Supabase.

## Solução
1. Execute o script SQL `CORRECAO_URGENTE_CHAT_MOBILE.sql` no console SQL do Supabase.
2. Este script:
   - Remove todas as políticas RLS existentes para as tabelas `ChatConversation` e `ChatMessage`
   - Cria novas políticas que garantem a comparação correta de tipos entre `userId` e `auth.uid()`
   - Usa explicitamente conversões para texto (`::text`) para evitar problemas de comparação de tipos

## Como Aplicar
1. Acesse o painel do Supabase
2. Vá para a seção SQL
3. Copie e cole o conteúdo do arquivo `CORRECAO_URGENTE_CHAT_MOBILE.sql`
4. Execute o script
5. Verifique se a mensagem de confirmação aparece

## Verificação
Após aplicar a correção:
1. Teste o chat em um dispositivo móvel
2. Verifique se as conversas são carregadas corretamente
3. Teste o envio e recebimento de mensagens

Esta correção resolve o problema garantindo que as comparações de ID do usuário sejam feitas corretamente, independentemente do dispositivo utilizado.