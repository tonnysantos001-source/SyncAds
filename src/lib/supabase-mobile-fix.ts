import { supabase } from './supabase';

/**
 * Função que aplica a correção definitiva para o problema do chat no celular
 * Esta função deve ser chamada na inicialização da aplicação
 */
export async function aplicarCorrecaoDefinitivaChatMobile() {
  try {
    // Script SQL para corrigir definitivamente o problema de RLS no chat mobile
    const sql = `
    -- PARTE 1: DESATIVAR RLS TEMPORARIAMENTE
    ALTER TABLE "ChatConversation" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "ChatMessage" DISABLE ROW LEVEL SECURITY;

    -- PARTE 2: REMOVER TODAS AS POLÍTICAS EXISTENTES
    DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON "ChatConversation";
    DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "ChatConversation";
    DROP POLICY IF EXISTS "Enable update for users based on user_id" ON "ChatConversation";
    DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON "ChatConversation";
    DROP POLICY IF EXISTS "mobile_chat_policy" ON "ChatConversation";
    DROP POLICY IF EXISTS "mobile_read_policy" ON "ChatConversation";
    DROP POLICY IF EXISTS "mobile_insert_policy" ON "ChatConversation";
    DROP POLICY IF EXISTS "mobile_update_policy" ON "ChatConversation";
    DROP POLICY IF EXISTS "mobile_delete_policy" ON "ChatConversation";

    DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON "ChatMessage";
    DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "ChatMessage";
    DROP POLICY IF EXISTS "Enable update for users based on user_id" ON "ChatMessage";
    DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON "ChatMessage";
    DROP POLICY IF EXISTS "mobile_chat_message_policy" ON "ChatMessage";

    -- PARTE 3: CRIAR NOVAS POLÍTICAS ROBUSTAS
    CREATE POLICY "chat_conversation_select_policy" 
    ON "ChatConversation"
    FOR SELECT 
    USING (
        "userId"::TEXT = auth.uid()::TEXT
    );

    CREATE POLICY "chat_conversation_insert_policy" 
    ON "ChatConversation"
    FOR INSERT 
    WITH CHECK (
        "userId"::TEXT = auth.uid()::TEXT
    );

    CREATE POLICY "chat_conversation_update_policy" 
    ON "ChatConversation"
    FOR UPDATE 
    USING (
        "userId"::TEXT = auth.uid()::TEXT
    );

    CREATE POLICY "chat_conversation_delete_policy" 
    ON "ChatConversation"
    FOR DELETE 
    USING (
        "userId"::TEXT = auth.uid()::TEXT
    );

    CREATE POLICY "chat_message_select_policy" 
    ON "ChatMessage"
    FOR SELECT 
    USING (
        "userId"::TEXT = auth.uid()::TEXT OR
        EXISTS (
            SELECT 1 FROM "ChatConversation"
            WHERE "ChatConversation"."id" = "ChatMessage"."conversationId"
            AND "ChatConversation"."userId"::TEXT = auth.uid()::TEXT
        )
    );

    CREATE POLICY "chat_message_insert_policy" 
    ON "ChatMessage"
    FOR INSERT 
    WITH CHECK (
        "userId"::TEXT = auth.uid()::TEXT OR
        EXISTS (
            SELECT 1 FROM "ChatConversation"
            WHERE "ChatConversation"."id" = "ChatMessage"."conversationId"
            AND "ChatConversation"."userId"::TEXT = auth.uid()::TEXT
        )
    );

    CREATE POLICY "chat_message_update_policy" 
    ON "ChatMessage"
    FOR UPDATE 
    USING (
        "userId"::TEXT = auth.uid()::TEXT OR
        EXISTS (
            SELECT 1 FROM "ChatConversation"
            WHERE "ChatConversation"."id" = "ChatMessage"."conversationId"
            AND "ChatConversation"."userId"::TEXT = auth.uid()::TEXT
        )
    );

    CREATE POLICY "chat_message_delete_policy" 
    ON "ChatMessage"
    FOR DELETE 
    USING (
        "userId"::TEXT = auth.uid()::TEXT OR
        EXISTS (
            SELECT 1 FROM "ChatConversation"
            WHERE "ChatConversation"."id" = "ChatMessage"."conversationId"
            AND "ChatConversation"."userId"::TEXT = auth.uid()::TEXT
        )
    );

    -- PARTE 4: REATIVAR RLS
    ALTER TABLE "ChatConversation" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "ChatMessage" ENABLE ROW LEVEL SECURITY;
    `;

    // Executar o script SQL como usuário administrador
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('Erro ao aplicar correção definitiva do chat mobile:', error);
      return false;
    }
    
    console.log('Correção definitiva do chat mobile aplicada com sucesso!');
    return true;
  } catch (error) {
    console.error('Erro ao aplicar correção definitiva do chat mobile:', error);
    return false;
  }
}

/**
 * Função para verificar se o dispositivo é mobile
 */
export function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Função para garantir que a sessão do Supabase esteja sempre válida
 */
export async function garantirSessaoValida() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log('Sessão não encontrada, redirecionando para login');
      window.location.href = '/login';
      return false;
    }
    
    // Forçar atualização do token para garantir que esteja válido
    const { error } = await supabase.auth.refreshSession();
    if (error) {
      console.error('Erro ao atualizar sessão:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao verificar sessão:', error);
    return false;
  }
}

/**
 * Inicializa a correção do chat mobile
 * Esta função deve ser chamada na inicialização da aplicação
 */
export async function inicializarCorrecaoChatMobile() {
  // Verificar se é um dispositivo móvel
  if (isMobileDevice()) {
    console.log('Dispositivo móvel detectado, aplicando correções...');
    
    // Garantir que a sessão está válida
    await garantirSessaoValida();
    
    // Configurar intervalo para manter a sessão válida (a cada 3 minutos)
    setInterval(async () => {
      await garantirSessaoValida();
    }, 3 * 60 * 1000);
    
    // Adicionar listeners para eventos de foco e online
    window.addEventListener('focus', async () => {
      await garantirSessaoValida();
    });
    
    window.addEventListener('online', async () => {
      await garantirSessaoValida();
    });
    
    // Tentar aplicar a correção definitiva se o usuário for administrador
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email?.includes('@admin') || user?.email?.includes('@syncads')) {
      await aplicarCorrecaoDefinitivaChatMobile();
    }
  }
}