/**
 * HOOK DE INATIVIDADE E AUTO-LOGOUT
 *
 * Detecta inatividade do usuário e faz logout automático
 * após um período configurável sem interação.
 *
 * Eventos monitorados:
 * - Movimento do mouse
 * - Cliques
 * - Teclas pressionadas
 * - Scroll
 * - Touch (mobile)
 *
 * Features:
 * - Warning antes do logout
 * - Countdown visual
 * - Salva última atividade no localStorage
 * - Sincroniza entre abas
 * - Pausa durante interações críticas
 *
 * USO:
 * ```tsx
 * function App() {
 *   const { isWarning, remainingTime, resetTimer } = useInactivityLogout({
 *     timeout: 30 * 60 * 1000, // 30 minutos
 *     warningTime: 2 * 60 * 1000, // 2 minutos de aviso
 *   });
 *
 *   if (isWarning) {
 *     return <InactivityWarning time={remainingTime} onContinue={resetTimer} />;
 *   }
 * }
 * ```
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';

interface UseInactivityLogoutOptions {
  /** Tempo de inatividade antes do logout (ms) */
  timeout?: number;
  /** Tempo de aviso antes do logout (ms) */
  warningTime?: number;
  /** Eventos a monitorar */
  events?: string[];
  /** Habilitar/desabilitar o hook */
  enabled?: boolean;
  /** Callback quando aviso é exibido */
  onWarning?: () => void;
  /** Callback antes do logout */
  onLogout?: () => void;
}

interface UseInactivityLogoutReturn {
  /** Se está no período de aviso */
  isWarning: boolean;
  /** Tempo restante em segundos */
  remainingTime: number;
  /** Reseta o timer de inatividade */
  resetTimer: () => void;
  /** Pausa temporariamente o monitoramento */
  pause: () => void;
  /** Resume o monitoramento */
  resume: () => void;
  /** Última atividade registrada */
  lastActivity: Date | null;
}

const STORAGE_KEY = 'syncads_last_activity';
const DEFAULT_TIMEOUT = 30 * 60 * 1000; // 30 minutos
const DEFAULT_WARNING = 2 * 60 * 1000; // 2 minutos
const DEFAULT_EVENTS = [
  'mousedown',
  'mousemove',
  'keypress',
  'scroll',
  'touchstart',
  'click',
];

export function useInactivityLogout(
  options: UseInactivityLogoutOptions = {}
): UseInactivityLogoutReturn {
  const {
    timeout = DEFAULT_TIMEOUT,
    warningTime = DEFAULT_WARNING,
    events = DEFAULT_EVENTS,
    enabled = true,
    onWarning,
    onLogout,
  } = options;

  const { logout, isAuthenticated } = useAuthStore();
  const [isWarning, setIsWarning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const [lastActivity, setLastActivity] = useState<Date | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Interval | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // ============================================
  // FUNÇÕES AUXILIARES
  // ============================================

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  const saveLastActivity = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;
    setLastActivity(new Date(now));
    localStorage.setItem(STORAGE_KEY, now.toString());
  }, []);

  const getLastActivity = useCallback((): number => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? parseInt(stored, 10) : Date.now();
  }, []);

  // ============================================
  // LOGOUT
  // ============================================

  const performLogout = useCallback(async () => {
    clearTimers();
    setIsWarning(false);

    if (onLogout) {
      onLogout();
    }

    // Aguardar um pouco para o callback
    await new Promise(resolve => setTimeout(resolve, 100));

    // Fazer logout
    await logout();

    // Limpar localStorage
    localStorage.removeItem(STORAGE_KEY);
  }, [clearTimers, logout, onLogout]);

  // ============================================
  // WARNING
  // ============================================

  const startWarning = useCallback(() => {
    setIsWarning(true);

    if (onWarning) {
      onWarning();
    }

    // Iniciar countdown
    const warningEndTime = Date.now() + warningTime;

    countdownIntervalRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((warningEndTime - Date.now()) / 1000));
      setRemainingTime(remaining);

      if (remaining === 0) {
        performLogout();
      }
    }, 1000);

    // Timeout final
    timeoutRef.current = setTimeout(() => {
      performLogout();
    }, warningTime);
  }, [warningTime, onWarning, performLogout]);

  // ============================================
  // RESET TIMER
  // ============================================

  const resetTimer = useCallback(() => {
    if (!enabled || isPaused) return;

    clearTimers();
    setIsWarning(false);
    setRemainingTime(0);
    saveLastActivity();

    // Warning timeout
    warningTimeoutRef.current = setTimeout(() => {
      startWarning();
    }, timeout - warningTime);
  }, [enabled, isPaused, clearTimers, saveLastActivity, startWarning, timeout, warningTime]);

  // ============================================
  // PAUSE/RESUME
  // ============================================

  const pause = useCallback(() => {
    setIsPaused(true);
    clearTimers();
  }, [clearTimers]);

  const resume = useCallback(() => {
    setIsPaused(false);
    resetTimer();
  }, [resetTimer]);

  // ============================================
  // ACTIVITY HANDLER
  // ============================================

  const handleActivity = useCallback(() => {
    if (!enabled || isPaused || !isAuthenticated) return;

    // Throttle: só registra se passou 1 segundo desde última atividade
    const now = Date.now();
    if (now - lastActivityRef.current < 1000) return;

    resetTimer();
  }, [enabled, isPaused, isAuthenticated, resetTimer]);

  // ============================================
  // VERIFICAR INATIVIDADE AO MONTAR
  // ============================================

  useEffect(() => {
    if (!enabled || !isAuthenticated) return;

    const lastActivityTime = getLastActivity();
    const timeSinceLastActivity = Date.now() - lastActivityTime;

    // Se passou mais que o timeout, fazer logout imediatamente
    if (timeSinceLastActivity >= timeout) {
      performLogout();
      return;
    }

    // Se está no período de warning
    if (timeSinceLastActivity >= timeout - warningTime) {
      const remainingWarning = timeout - timeSinceLastActivity;

      if (remainingWarning > 0) {
        setIsWarning(true);

        setTimeout(() => {
          startWarning();
        }, 0);
      } else {
        performLogout();
      }
      return;
    }

    // Iniciar timer normal
    resetTimer();
  }, [enabled, isAuthenticated, timeout, warningTime, getLastActivity, performLogout, startWarning, resetTimer]);

  // ============================================
  // EVENT LISTENERS
  // ============================================

  useEffect(() => {
    if (!enabled || !isAuthenticated) return;

    // Adicionar listeners
    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Listener para mudanças de visibilidade
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        handleActivity();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Listener para storage (sincronizar entre abas)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        const otherTabActivity = parseInt(e.newValue, 10);
        const timeSinceOtherTab = Date.now() - otherTabActivity;

        // Se outra aba teve atividade recente, resetar aqui também
        if (timeSinceOtherTab < 5000) {
          resetTimer();
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Cleanup
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
      clearTimers();
    };
  }, [enabled, isAuthenticated, events, handleActivity, resetTimer, clearTimers]);

  // ============================================
  // CLEANUP AO DESMONTAR
  // ============================================

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  return {
    isWarning,
    remainingTime,
    resetTimer,
    pause,
    resume,
    lastActivity,
  };
}

/**
 * HELPER: Formata tempo restante
 */
export function formatRemainingTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * HELPER: Hook simplificado apenas com warning
 */
export function useInactivityWarning(timeoutMinutes: number = 30) {
  return useInactivityLogout({
    timeout: timeoutMinutes * 60 * 1000,
    warningTime: 2 * 60 * 1000,
  });
}
