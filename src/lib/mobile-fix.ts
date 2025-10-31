import { supabase } from './supabase';

/**
 * Função para corrigir o problema de autenticação no chat em navegadores móveis
 * Esta função deve ser chamada antes de qualquer operação com o chat em dispositivos móveis
 */
export const fixMobileChatAuth = async () => {
  try {
    // Verifica se estamos em um dispositivo móvel
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (!isMobile) return; // Não faz nada se não for mobile
    
    // Força a atualização da sessão para garantir que o token está atualizado
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.warn('Sessão não encontrada. O usuário precisa fazer login novamente.');
      return;
    }
    
    // Força a renovação do token de acesso
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('Erro ao atualizar a sessão:', error);
      throw error;
    }
    
    console.log('Sessão do chat mobile atualizada com sucesso');
    return data.session;
  } catch (error) {
    console.error('Erro na correção do chat mobile:', error);
    throw error;
  }
};

/**
 * Wrapper para operações do chat que garante autenticação correta em dispositivos móveis
 * @param operation - Função de operação do chat a ser executada
 */
export const withMobileFix = async (operation: Function) => {
  try {
    // Aplica a correção primeiro
    await fixMobileChatAuth();
    
    // Executa a operação original
    return await operation();
  } catch (error) {
    console.error('Erro na operação do chat com correção mobile:', error);
    throw error;
  }
};