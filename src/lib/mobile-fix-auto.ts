import { supabase } from './supabase';

/**
 * Função para corrigir o problema de autenticação no chat em navegadores móveis
 * Esta função deve ser chamada automaticamente no carregamento da página
 */
export const fixMobileChatAuth = async () => {
  try {
    // Verifica se estamos em um dispositivo móvel
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (!isMobile) return; // Não faz nada se não for mobile
    
    console.log('Dispositivo móvel detectado, aplicando correção automática para o chat...');
    
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
    
    // Configurar um intervalo para renovar a sessão periodicamente (a cada 5 minutos)
    setInterval(async () => {
      console.log('Renovando sessão automaticamente...');
      try {
        await supabase.auth.refreshSession();
        console.log('Sessão renovada com sucesso');
      } catch (refreshError) {
        console.error('Erro ao renovar sessão:', refreshError);
      }
    }, 5 * 60 * 1000); // 5 minutos
    
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

/**
 * Inicializa a correção automaticamente
 * Esta função deve ser importada e executada no arquivo principal da aplicação
 */
export const initMobileFix = () => {
  // Aplicar a correção imediatamente
  fixMobileChatAuth().catch(error => {
    console.error('Erro ao inicializar correção mobile:', error);
  });
  
  // Adicionar listener para quando a página for recarregada ou retornar do background
  window.addEventListener('focus', () => {
    console.log('Página em foco, verificando sessão...');
    fixMobileChatAuth().catch(error => {
      console.error('Erro ao atualizar sessão após foco:', error);
    });
  });
  
  // Adicionar listener para quando a conexão de rede for restaurada
  window.addEventListener('online', () => {
    console.log('Conexão de rede restaurada, verificando sessão...');
    fixMobileChatAuth().catch(error => {
      console.error('Erro ao atualizar sessão após reconexão:', error);
    });
  });
  
  console.log('Inicialização automática da correção mobile configurada');
};