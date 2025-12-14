import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShoppingBag, Users, Star, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SocialProof {
  id: string;
  userId: string;
  type: 'RECENT_PURCHASE' | 'VISITOR_COUNT' | 'REVIEW';
  message: string;
  displayDuration: number;
  isActive: boolean;
}

interface SocialProofNotificationsProps {
  userId: string | null;
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  className?: string;
}

export function SocialProofNotifications({
  userId,
  position = 'bottom-left',
  className,
}: SocialProofNotificationsProps) {
  const [proofs, setProofs] = useState<SocialProof[]>([]);
  const [currentProof, setCurrentProof] = useState<SocialProof | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar provas sociais ativas
  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    loadSocialProofs();
  }, [userId]);

  const loadSocialProofs = async () => {
    try {
      const { data, error } = await supabase
        .from('SocialProof')
        .select('*')
        .eq('userId', userId)
        .eq('isActive', true)
        .order('createdAt', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        setProofs(data);
        console.log('✅ Provas sociais carregadas:', data.length);
      }
    } catch (error) {
      console.error('Erro ao carregar provas sociais:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Sistema de exibição de notificações
  useEffect(() => {
    if (proofs.length === 0 || isLoading) return;

    // Mostrar primeira notificação após 5 segundos
    const initialTimeout = setTimeout(() => {
      showRandomProof();
    }, 5000);

    // Configurar intervalo para mostrar notificações
    const interval = setInterval(() => {
      showRandomProof();
    }, 15000); // A cada 15 segundos

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [proofs, isLoading]);

  const showRandomProof = () => {
    if (proofs.length === 0) return;

    // Selecionar prova aleatória
    const randomIndex = Math.floor(Math.random() * proofs.length);
    const selectedProof = proofs[randomIndex];

    // Mostrar notificação
    setCurrentProof(selectedProof);
    setIsVisible(true);

    // Ocultar após duração configurada
    setTimeout(() => {
      hideProof();
    }, selectedProof.displayDuration * 1000);
  };

  const hideProof = () => {
    setIsVisible(false);
    setTimeout(() => {
      setCurrentProof(null);
    }, 300); // Tempo da animação de saída
  };

  const handleClose = () => {
    hideProof();
  };

  // Se não há provas ou ainda carregando, não renderizar nada
  if (!currentProof || proofs.length === 0) return null;

  // Determinar ícone baseado no tipo
  const getIcon = () => {
    switch (currentProof.type) {
      case 'RECENT_PURCHASE':
        return <ShoppingBag className="h-5 w-5 text-green-600" />;
      case 'VISITOR_COUNT':
        return <Users className="h-5 w-5 text-blue-600" />;
      case 'REVIEW':
        return <Star className="h-5 w-5 text-yellow-600 fill-yellow-600" />;
      default:
        return <ShoppingBag className="h-5 w-5 text-gray-600" />;
    }
  };

  // Determinar cor de fundo baseado no tipo
  const getBackgroundColor = () => {
    switch (currentProof.type) {
      case 'RECENT_PURCHASE':
        return 'bg-green-50 border-green-200';
      case 'VISITOR_COUNT':
        return 'bg-blue-50 border-blue-200';
      case 'REVIEW':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

  // Determinar posição
  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      default:
        return 'bottom-4 left-4';
    }
  };

  return (
    <div
      className={cn(
        'fixed z-50 max-w-sm transition-all duration-300 ease-in-out',
        getPositionClasses(),
        isVisible
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-2 scale-95 pointer-events-none',
        className
      )}
    >
      <Alert
        className={cn(
          'shadow-lg border-2 relative pr-10',
          getBackgroundColor()
        )}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
          <div className="flex-1 min-w-0">
            <AlertDescription className="text-sm text-gray-800 font-medium">
              {currentProof.message}
            </AlertDescription>
          </div>
        </div>

        {/* Botão de fechar */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/5 transition-colors"
          aria-label="Fechar notificação"
        >
          <X className="h-4 w-4 text-gray-500" />
        </button>

        {/* Barra de progresso */}
        <div
          className="absolute bottom-0 left-0 h-1 bg-gray-800/20 rounded-b-lg animate-progress"
          style={{
            animation: `progress ${currentProof.displayDuration}s linear`,
          }}
        />
      </Alert>

      <style jsx>{`
        @keyframes progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}

