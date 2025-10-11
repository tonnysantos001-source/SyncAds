/*
# [Operação] Criação do Esquema Principal de IA
Cria as tabelas essenciais para gerenciar modelos de IA e armazenar o histórico de conversas dos usuários.

## Descrição da Query:
Esta migração estabelece a fundação para as funcionalidades de IA do sistema.
1.  `ai_models`: Armazena as configurações e chaves de API para os diferentes modelos de IA (Linguagem, Imagem, etc.).
2.  `conversations`: Agrupa mensagens em conversas distintas para cada usuário.
3.  `messages`: Armazena cada mensagem enviada pelo usuário ou pela IA.

**ALERTA DE SEGURANÇA:** A tabela `ai_models` irá armazenar chaves de API. Armazenar segredos em texto plano no banco de dados é uma prática de **ALTO RISCO**. Recomenda-se fortemente o uso do Supabase Vault para gerenciar segredos de forma segura no futuro. Esta implementação inicial é um ponto de partida, mas a segurança deve ser reforçada antes da produção.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "High"
- Requires-Backup: false
- Reversible: true (com a remoção das tabelas)

## Detalhes da Estrutura:
- **Tabelas Criadas:**
  - `public.ai_models`
  - `public.conversations`
  - `public.messages`
- **Colunas Adicionadas:**
  - `ai_models`: id, user_id, name, api_key, model_type, is_active, created_at
  - `conversations`: id, user_id, title, created_at
  - `messages`: id, conversation_id, user_id, role, content, created_at
- **Relacionamentos:**
  - `messages.conversation_id` -> `conversations.id`
  - `ai_models.user_id`, `conversations.user_id`, `messages.user_id` -> `auth.users.id` (preparado para multi-tenancy)

## Implicações de Segurança:
- RLS Status: Habilitado para todas as tabelas.
- Mudanças de Política: Políticas iniciais são criadas. Elas permitem acesso ao próprio usuário (baseado em `auth.uid()`), preparando o sistema para autenticação. Sem autenticação, o acesso será negado por padrão.
- Requisitos de Auth: As políticas dependem da função `auth.uid()` para funcionar corretamente.

## Impacto no Desempenho:
- Índices: Índices são adicionados nas chaves estrangeiras (`user_id`, `conversation_id`) para otimizar as consultas.
- Triggers: Nenhum trigger adicionado.
- Impacto Estimado: Baixo. A criação de tabelas e índices é uma operação padrão.
*/

-- Tipos ENUM para melhor organização
CREATE TYPE public.model_type AS ENUM ('language', 'image', 'audio');
CREATE TYPE public.message_role AS ENUM ('user', 'assistant');

-- Tabela para armazenar as configurações dos modelos de IA
CREATE TABLE public.ai_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    api_key TEXT NOT NULL, -- ALERTA: Armazenar chaves em texto plano é inseguro. Use Supabase Vault.
    model_type public.model_type NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
-- Comentários sobre a tabela de modelos
COMMENT ON TABLE public.ai_models IS 'Armazena as configurações e chaves de API para os modelos de IA.';
COMMENT ON COLUMN public.ai_models.api_key IS 'ALERTA DE SEGURANÇA: A chave de API do modelo. Deve ser migrada para o Supabase Vault para segurança em produção.';

-- Habilitar RLS para ai_models
ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para ai_models (Apenas o próprio usuário pode ver e gerenciar suas chaves)
CREATE POLICY "Allow user to manage their own AI models"
ON public.ai_models
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


-- Tabela para armazenar conversas
CREATE TABLE public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    created_at TIMESTAMz DEFAULT NOW() NOT NULL
);
COMMENT ON TABLE public.conversations IS 'Agrupa mensagens em conversas distintas para cada usuário.';

-- Habilitar RLS para conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para conversations
CREATE POLICY "Allow user to manage their own conversations"
ON public.conversations
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


-- Tabela para armazenar mensagens dentro de uma conversa
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role public.message_role NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
COMMENT ON TABLE public.messages IS 'Armazena cada mensagem enviada pelo usuário ou pela IA em uma conversa.';

-- Habilitar RLS para messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para messages
CREATE POLICY "Allow user to manage messages in their own conversations"
ON public.messages
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Índices para otimização de performance
CREATE INDEX idx_ai_models_user_id ON public.ai_models(user_id);
CREATE INDEX idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_user_id ON public.messages(user_id);
