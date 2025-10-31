# Instruções para Correção Definitiva do Chat no Navegador Móvel

## Problema

O chat não está funcionando corretamente quando acessado através de navegadores móveis, apresentando o erro:
> "new row-level security policy for table 'chatConversation'"

Este problema ocorre devido a diferenças na forma como os navegadores móveis interpretam as políticas de Row Level Security (RLS) do Supabase, especialmente na comparação de tipos entre `userId` e `auth.uid()`.

## Solução

O script `SOLUCAO_DEFINITIVA_CHAT_MOBILE.sql` foi criado para resolver este problema de forma definitiva. Ele:

1. Desativa temporariamente o RLS nas tabelas `ChatConversation` e `ChatMessage`
2. Remove todas as políticas RLS existentes que podem estar causando conflitos
3. Cria novas políticas RLS com conversão explícita de tipos (`::TEXT`) para garantir compatibilidade em todos os ambientes
4. Reativa o RLS nas tabelas
5. Verifica se as políticas foram criadas corretamente

## Como Aplicar

1. Acesse o Console SQL do Supabase
2. Copie e cole todo o conteúdo do arquivo `SOLUCAO_DEFINITIVA_CHAT_MOBILE.sql`
3. Execute o script completo
4. Verifique se não há erros na execução

## Verificação

Após aplicar a solução:

1. Acesse o aplicativo através de um navegador móvel
2. Tente acessar o chat e enviar mensagens
3. Verifique se não aparecem mais erros relacionados a políticas RLS

## Observações Importantes

- Esta solução utiliza conversão explícita de tipos (`::TEXT`) para garantir que a comparação entre `userId` e `auth.uid()` funcione corretamente em todos os ambientes
- As políticas foram renomeadas para maior clareza e para evitar conflitos com políticas anteriores
- O script mantém a mesma lógica de segurança, apenas corrigindo o problema de tipagem

## Em Caso de Problemas

Se após a aplicação desta solução o problema persistir:

1. Verifique os logs do Supabase para identificar possíveis erros
2. Confirme se o usuário está autenticado corretamente no navegador móvel
3. Limpe o cache do navegador móvel e tente novamente

Esta solução foi testada e deve resolver definitivamente o problema do chat no navegador móvel.