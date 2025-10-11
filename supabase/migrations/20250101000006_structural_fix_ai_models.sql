/*
# [Correção Estrutural] Recriar a Tabela ai_models
Este script apaga e recria completamente a tabela `ai_models` para corrigir inconsistências de esquema de migrações anteriores que falharam. Isto irá restaurar a tabela para um estado limpo e correto, resolvendo o erro em cascata.

## Descrição da Query:
- **Impacto:** Todos os dados atualmente na tabela `ai_models` serão permanentemente eliminados.
- **Risco:** Baixo, uma vez que a aplicação está em fase inicial de desenvolvimento.
- **Precaução:** Esta é uma operação destrutiva para esta tabela específica.

## Metadados:
- Categoria do Esquema: "Perigosa"
- Nível de Impacto: "Alto"
- Requer Backup: false
- Reversível: false

## Detalhes da Estrutura:
- Apaga a tabela: `ai_models`
- Cria a tabela: `ai_models` com as colunas corretas (id, name, api_key, type, status, model_identifier, created_at)
- Recria as políticas de RLS para todas as operações.

## Implicações de Segurança:
- Status RLS: Ativado
- Alterações de Política: Sim, as políticas são recriadas para permitir todas as ações por enquanto.

## Impacto no Desempenho:
- Índices: O índice da chave primária é recriado.
- Gatilhos: Nenhum.
- Impacto Estimado: Negligenciável.
*/

-- Apaga a tabela se ela existir para garantir um ponto de partida limpo
DROP TABLE IF EXISTS public.ai_models;

-- Recria a tabela com o esquema final e correto
CREATE TABLE public.ai_models (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    api_key text NOT NULL,
    model_identifier text,
    type text NOT NULL,
    status text DEFAULT 'inactive'::text NOT NULL
);

-- Adiciona a restrição de chave primária
ALTER TABLE ONLY public.ai_models
    ADD CONSTRAINT ai_models_pkey PRIMARY KEY (id);

-- Ativa a Segurança em Nível de Linha (Row Level Security)
ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;

-- Recria as políticas para permitir operações, corrigindo problemas de permissão anteriores.
-- Num aplicativo real com utilizadores, estas seriam mais restritivas.
DROP POLICY IF EXISTS "Allow all access to anon users" ON public.ai_models;
CREATE POLICY "Allow all access to anon users" ON public.ai_models FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.ai_models;
CREATE POLICY "Allow all access to authenticated users" ON public.ai_models FOR ALL TO authenticated USING (true) WITH CHECK (true);
