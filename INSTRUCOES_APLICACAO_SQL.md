# Instruções para Aplicar a Solução Definitiva do Chat Mobile

Para resolver definitivamente o problema do chat no celular, siga estas instruções para aplicar o script SQL diretamente no painel do Supabase:

## Passo 1: Acessar o Painel do Supabase

1. Acesse o [Dashboard do Supabase](https://app.supabase.com)
2. Selecione o projeto SyncAds
3. Navegue até a seção "SQL Editor" no menu lateral esquerdo

## Passo 2: Executar o Script SQL

1. Clique em "New Query" para criar uma nova consulta
2. Copie e cole todo o conteúdo do arquivo `SOLUCAO_DEFINITIVA_CHAT_MOBILE.sql` no editor
3. Clique no botão "Run" para executar o script

O script realizará as seguintes operações:
- Desativar temporariamente o RLS nas tabelas ChatConversation e ChatMessage
- Remover todas as políticas existentes
- Criar novas políticas robustas com conversão explícita de tipos
- Reativar o RLS nas tabelas
- Verificar se as políticas foram criadas corretamente

## Passo 3: Verificar a Aplicação

Após a execução do script, você verá uma mensagem de confirmação indicando que a solução foi aplicada com sucesso.

## Passo 4: Testar o Chat no Celular

1. Abra o aplicativo no navegador do celular
2. Faça login na sua conta
3. Acesse a seção de chat
4. Verifique se você consegue ver suas conversas e enviar mensagens normalmente

## Observações Importantes

- Esta solução modifica as políticas de RLS para garantir que a comparação de IDs de usuário seja feita corretamente, convertendo explicitamente os tipos para texto.
- A solução é permanente e não requer alterações no código frontend.
- Se você ainda encontrar problemas após aplicar esta solução, entre em contato com o suporte técnico.

## Explicação Técnica

O problema ocorre porque o Supabase às vezes trata os IDs de usuário de forma inconsistente entre dispositivos. A solução força a conversão explícita dos IDs para texto (`::TEXT`) em todas as políticas RLS, garantindo que a comparação seja feita corretamente independentemente do formato do ID retornado pelo sistema de autenticação.