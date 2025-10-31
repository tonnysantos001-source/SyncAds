import { fixMobileChatAuth } from './mobile-fix-auto';

/**
 * Inicializa a correção para o chat em navegadores móveis
 * Esta função é chamada automaticamente no carregamento da aplicação
 */
export const initMobileChatFix = () => {
  // Verifica se estamos em um navegador
  if (typeof window !== 'undefined') {
    // Verifica se estamos em um dispositivo móvel
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      console.log('Dispositivo móvel detectado, inicializando correção automática para o chat...');
      
      // Aplica a correção imediatamente
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
      
      // Configurar um intervalo para renovar a sessão periodicamente (a cada 3 minutos)
      setInterval(() => {
        console.log('Renovando sessão automaticamente...');
        fixMobileChatAuth().catch(error => {
          console.error('Erro ao renovar sessão:', error);
        });
      }, 3 * 60 * 1000); // 3 minutos
      
      console.log('Inicialização automática da correção mobile configurada');
    }
  }
};

// Executar a inicialização automaticamente
initMobileChatFix();