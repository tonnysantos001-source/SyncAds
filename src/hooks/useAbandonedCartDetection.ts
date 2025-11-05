import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface AbandonedCartDetectionProps {
  orderId: string | null;
  currentStep: number;
  customerData: {
    name: string;
    email: string;
    phone: string;
    document: string;
  };
  addressData: {
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  checkoutData: {
    total: number;
    subtotal: number;
    items: any[];
  } | null;
  userId: string | null;
}

/**
 * Hook para detectar abandono de carrinho no checkout
 *
 * Detecta quando:
 * - Usuário está no step 3 (pagamento)
 * - Passou mais de 5 minutos sem ação
 * - Usuário fecha/sai da página sem completar
 * - Possui email válido
 *
 * Salva automaticamente na tabela AbandonedCart
 */
export function useAbandonedCartDetection({
  orderId,
  currentStep,
  customerData,
  addressData,
  checkoutData,
  userId,
}: AbandonedCartDetectionProps) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const savedRef = useRef<boolean>(false);
  const startTimeRef = useRef<number>(Date.now());

  /**
   * Verifica se deve detectar abandono
   */
  const shouldDetectAbandonment = useCallback((): boolean => {
    // Precisa estar no step de pagamento (3)
    if (currentStep !== 3) return false;

    // Precisa ter orderId
    if (!orderId) return false;

    // Precisa ter email válido
    if (!customerData?.email || !customerData.email.includes('@')) return false;

    // Precisa ter dados do checkout
    if (!checkoutData || !checkoutData.items || checkoutData.items.length === 0) return false;

    // Não detectar se já salvou
    if (savedRef.current) return false;

    return true;
  }, [currentStep, orderId, customerData, checkoutData]);

  /**
   * Salva carrinho como abandonado
   */
  const saveAbandonedCart = useCallback(async () => {
    if (!shouldDetectAbandonment()) return;
    if (savedRef.current) return; // Evitar duplicatas

    try {
      console.log('🛒 Detectado abandono de carrinho:', orderId);

      savedRef.current = true; // Marcar como salvo imediatamente

      // Verificar se já existe abandoned cart para este pedido
      const { data: existing } = await supabase
        .from('AbandonedCart')
        .select('id')
        .eq('userId', userId || 'anonymous')
        .eq('cartId', orderId!)
        .single();

      if (existing) {
        console.log('⚠️ Carrinho abandonado já registrado');
        return;
      }

      // Calcular tempo no checkout (em segundos)
      const timeOnCheckout = Math.floor((Date.now() - startTimeRef.current) / 1000);

      // Preparar dados do abandono
      const abandonedCartData = {
        userId: userId || 'anonymous',
        cartId: orderId!,
        customerId: null, // TODO: Buscar customerId se existir
        email: customerData.email,
        abandonedAt: new Date().toISOString(),
        recoveryAttempts: 0,
        lastRecoveryAt: null,
        recoveredAt: null,
        orderId: orderId,
        metadata: {
          customerData: {
            name: customerData.name,
            phone: customerData.phone,
            document: customerData.document,
          },
          addressData,
          checkoutData: {
            items: checkoutData!.items,
            subtotal: checkoutData!.subtotal,
            total: checkoutData!.total,
          },
          abandonmentContext: {
            currentStep,
            timeOnCheckout, // Tempo em segundos
            abandonedAt: new Date().toISOString(),
            userAgent: navigator.userAgent,
            screenResolution: `${window.screen.width}x${window.screen.height}`,
          },
        },
      };

      // Salvar no banco
      const { error } = await supabase
        .from('AbandonedCart')
        .insert(abandonedCartData);

      if (error) {
        console.error('❌ Erro ao salvar carrinho abandonado:', error);
        savedRef.current = false; // Resetar em caso de erro
      } else {
        console.log('✅ Carrinho abandonado salvo com sucesso!');

        // Salvar também no localStorage como backup
        try {
          localStorage.setItem(
            `abandoned-cart-${orderId}`,
            JSON.stringify({
              ...abandonedCartData,
              savedAt: new Date().toISOString(),
            })
          );
        } catch (e) {
          console.warn('Não foi possível salvar no localStorage:', e);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao processar abandono:', error);
      savedRef.current = false;
    }
  }, [
    shouldDetectAbandonment,
    orderId,
    userId,
    customerData,
    addressData,
    checkoutData,
    currentStep,
  ]);

  /**
   * Resetar timeout de abandono
   */
  const resetAbandonmentTimer = useCallback(() => {
    // Limpar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Se não deve detectar, não criar novo timeout
    if (!shouldDetectAbandonment()) return;

    // Criar novo timeout (5 minutos de inatividade)
    timeoutRef.current = setTimeout(() => {
      console.log('⏰ Timeout de inatividade atingido');
      saveAbandonedCart();
    }, 5 * 60 * 1000); // 5 minutos
  }, [shouldDetectAbandonment, saveAbandonedCart]);

  /**
   * Handler para beforeunload (usuário fechando/saindo)
   */
  const handleBeforeUnload = useCallback(() => {
    if (shouldDetectAbandonment()) {
      // Salvar de forma síncrona usando sendBeacon se disponível
      const data = JSON.stringify({
        userId: userId || 'anonymous',
        orderId,
        email: customerData.email,
        abandonedAt: new Date().toISOString(),
      });

      // Tentar usar sendBeacon (não bloqueia o navegador)
      if (navigator.sendBeacon) {
        const blob = new Blob([data], { type: 'application/json' });
        // TODO: Criar endpoint específico para receber beacon
        // navigator.sendBeacon('/api/abandoned-cart', blob);
      }

      // Salvar de forma assíncrona também
      saveAbandonedCart();
    }
  }, [shouldDetectAbandonment, userId, orderId, customerData, saveAbandonedCart]);

  /**
   * Handler para visibilitychange (usuário minimizou/trocou aba)
   */
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      // Usuário saiu da aba, salvar após 2 minutos
      setTimeout(() => {
        if (document.hidden && shouldDetectAbandonment()) {
          console.log('👁️ Usuário saiu da aba por tempo prolongado');
          saveAbandonedCart();
        }
      }, 2 * 60 * 1000); // 2 minutos
    }
  }, [shouldDetectAbandonment, saveAbandonedCart]);

  /**
   * Monitorar atividade do usuário
   */
  useEffect(() => {
    if (!shouldDetectAbandonment()) return;

    // Eventos que indicam atividade
    const activityEvents = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    // Handler de atividade
    const handleActivity = () => {
      resetAbandonmentTimer();
    };

    // Adicionar listeners de atividade
    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Adicionar listener de beforeunload
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Adicionar listener de visibilitychange
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Iniciar timer
    resetAbandonmentTimer();

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });

      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [
    shouldDetectAbandonment,
    resetAbandonmentTimer,
    handleBeforeUnload,
    handleVisibilityChange,
  ]);

  /**
   * Resetar quando mudar de step ou completar checkout
   */
  useEffect(() => {
    if (currentStep !== 3) {
      savedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }
  }, [currentStep]);

  /**
   * Função para marcar como recuperado (quando payment for completado)
   */
  const markAsRecovered = useCallback(async () => {
    if (!orderId) return;

    try {
      const { error } = await supabase
        .from('AbandonedCart')
        .update({
          recovered: true,
          recoveredAt: new Date().toISOString(),
          orderId: orderId,
        })
        .eq('cartId', orderId);

      if (error) {
        console.error('Erro ao marcar como recuperado:', error);
      } else {
        console.log('✅ Carrinho marcado como recuperado');
        savedRef.current = false;

        // Limpar localStorage
        try {
          localStorage.removeItem(`abandoned-cart-${orderId}`);
        } catch (e) {
          console.warn('Erro ao limpar localStorage:', e);
        }
      }
    } catch (error) {
      console.error('Erro ao marcar carrinho como recuperado:', error);
    }
  }, [orderId]);

  return {
    markAsRecovered,
    isMonitoring: shouldDetectAbandonment(),
  };
}
