/*
# [Operação de Inicialização]
Este script cria a tabela de perfis de utilizador, estabelece o sistema de funções (admin/user) e implementa políticas de segurança essenciais.

## Descrição da Consulta:
Cria a tabela `profiles` para armazenar dados do utilizador, adiciona uma coluna `role` e configura um gatilho para atribuir 'admin' ao primeiro utilizador e 'user' aos subsequentes. Também ativa e define políticas de Row Level Security (RLS) para proteger os dados do utilizador.

## Metadados:
- Categoria do Esquema: "Estrutural"
- Nível de Impacto: "Alto"
- Requer Backup: false (aplica-se a uma estrutura nova)
- Reversível: false

## Detalhes da Estrutura:
- Tabela afetada: `public.profiles` (criação)
- Colunas adicionadas: `id`, `created_at`, `full_name`, `email`, `role`
- Funções criadas: `public.handle_new_user()`
- Gatilhos criados: `on_auth_user_created` em `auth.users`

## Implicações de Segurança:
- Status RLS: Ativado na tabela `profiles`.
- Alterações de Política: Sim, adiciona políticas para SELECT, UPDATE e INSERT, garantindo que os utilizadores só possam aceder aos seus próprios dados.
- Requisitos de Autenticação: As políticas dependem do `auth.uid()` do utilizador autenticado.

## Impacto no Desempenho:
- Índices: A chave primária em `id` é indexada.
- Gatilhos: Adiciona um gatilho `AFTER INSERT` na tabela `auth.users`, com impacto mínimo no desempenho de registo.
- Impacto Estimado: Baixo.
*/

-- Passo 1: Criar a tabela `profiles` com a coluna `role` e ativar RLS
CREATE TABLE public.profiles (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    full_name text,
    email text,
    role text DEFAULT 'user'::text NOT NULL
);

COMMENT ON TABLE public.profiles IS 'Armazena dados de perfil público para cada utilizador.';
COMMENT ON COLUMN public.profiles.role IS 'Função do utilizador no sistema (ex: admin, user).';

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Passo 2: Criar a função para lidar com novos utilizadores e atribuir funções
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_count integer;
  new_user_role text;
BEGIN
  -- Conta quantos utilizadores existem para determinar se este é o primeiro
  SELECT count(*) INTO user_count FROM auth.users;

  -- Se for o primeiro utilizador, atribui a função 'admin', senão 'user'
  IF user_count = 1 THEN
    new_user_role := 'admin';
  ELSE
    new_user_role := 'user';
  END IF;

  -- Insere o novo registo na tabela de perfis
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    new_user_role
  );
  RETURN new;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS 'Cria um perfil e atribui uma função (admin/user) quando um novo utilizador se regista.';

-- Passo 3: Criar o gatilho que executa a função após um novo registo
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Passo 4: Definir as Políticas de Segurança (RLS)
CREATE POLICY "Permitir leitura do próprio perfil"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Permitir que administradores leiam todos os perfis"
ON public.profiles FOR SELECT
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Permitir atualização do próprio perfil"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- O gatilho lida com a inserção, portanto esta política serve como uma salvaguarda.
CREATE POLICY "Permitir inserção do próprio perfil"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);
