# Guia de Correção do Chat Mobile

Este guia explica como corrigir o problema do chat que funciona no desktop mas não no celular, com o erro "new row-level security policy for table chatConversation".

## Diagnóstico do Problema

O problema ocorre porque as políticas RLS (Row Level Security) da tabela `ChatConversation` não estão funcionando corretamente no ambiente mobile. Isso acontece devido a diferenças na forma como o token JWT é processado entre as plataformas.

## Solução

### 1. Aplicar o Script de Correção

Execute o script `CORRIGIR_CHAT_MOBILE.sql` no seu banco de dados Supabase:

```sql
-- Conecte-se ao banco de dados Supabase e execute:
\i CORRIGIR_CHAT_MOBILE.sql
```

Ou copie e cole o conteúdo do arquivo diretamente no SQL Editor do Supabase.

### 2. Verificar a Aplicação da Correção

Após aplicar o script, verifique se as políticas foram criadas corretamente:

1. Acesse o painel do Supabase
2. Vá para a seção "Table Editor"
3. Selecione a tabela "ChatConversation"
4. Clique na aba "Policies"
5. Confirme que as políticas estão listadas e ativas

### 3. Testar no Ambiente Mobile

Para testar se a correção funcionou:

1. Faça login no aplicativo usando um dispositivo móvel
2. Navegue até a seção de chat
3. Verifique se as conversas estão sendo exibidas corretamente
4. Tente criar uma nova conversa e enviar mensagens

## Explicação Técnica

A correção modifica as políticas RLS para usar a sintaxe `"userId" = auth.uid()::text` em vez de `(select auth.uid())::text = "userId"`. Esta mudança garante que a comparação de tipos seja consistente em todas as plataformas.

## Prevenção de Problemas Futuros

Para evitar problemas semelhantes no futuro:

1. Sempre teste as funcionalidades em múltiplas plataformas (desktop e mobile)
2. Mantenha as políticas RLS consistentes em todas as tabelas
3. Use a sintaxe mais direta possível nas políticas RLS
4. Evite conversões de tipo desnecessárias nas políticas

## Suporte

Se encontrar problemas adicionais após aplicar esta correção, execute o script de teste `test-chat-mobile-fix.js` para diagnóstico detalhado.