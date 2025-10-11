/*
# [Segurança] Correção e Expansão das Políticas de Acesso
Este script corrige e expande as políticas de segurança (RLS) para garantir que todas as funcionalidades atuais da aplicação funcionem corretamente antes da implementação da autenticação de usuários.

## Descrição da Query:
- **Impacto:** Remove as políticas anteriores que estavam incompletas e cria novas políticas mais abrangentes. Permite que qualquer visitante (anônimo) crie e leia conversas/mensagens, e gerencie completamente os modelos de IA.
- **Risco:** Baixo no ambiente de desenvolvimento. As regras são permissivas e devem ser restringidas após a implementação do login.
- **Precauções:** Este script remove políticas existentes com os mesmos nomes antes de criá-las para evitar erros.

## Metadata:
- Schema-Category: "Security"
- Impact-Level: "Medium"
- Requires-Backup: false
- Reversible: true

## Detalhes da Estrutura:
- Tabelas Afetadas: `conversations`, `messages`, `ai_models`
- Operações Permitidas: SELECT, INSERT, UPDATE, DELETE

## Implicações de Segurança:
- RLS Status: Altera políticas existentes em tabelas com RLS ativado.
- Mudanças de Política: Sim, substitui as políticas atuais por novas mais completas.
- Requisitos de Autenticação: Nenhuma, aplica-se a usuários anônimos.
*/

-- Remove políticas antigas para evitar conflitos (ignora erros se não existirem)
DROP POLICY IF EXISTS "Allow public insert for anyone" ON public.conversations;
DROP POLICY IF EXISTS "Allow public read for anyone" ON public.conversations;
DROP POLICY IF EXISTS "Allow public insert for anyone" ON public.messages;
DROP POLICY IF EXISTS "Allow public read for anyone" ON public.messages;
DROP POLICY IF EXISTS "Allow public read for anyone" ON public.ai_models;
DROP POLICY IF EXISTS "Allow public management for anyone" ON public.ai_models;

-- Políticas para a tabela `conversations`
CREATE POLICY "Allow public read and write access"
ON public.conversations
FOR ALL
TO public
USING (true)
WITH CHECK (true);


-- Políticas para a tabela `messages`
CREATE POLICY "Allow public read and write access"
ON public.messages
FOR ALL
TO public
USING (true)
WITH CHECK (true);


-- Políticas para a tabela `ai_models`
CREATE POLICY "Allow public full management access"
ON public.ai_models
FOR ALL
TO public
USING (true)
WITH CHECK (true);
