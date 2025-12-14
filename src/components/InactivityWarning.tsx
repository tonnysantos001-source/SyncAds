/**
 * COMPONENTE DE AVISO DE INATIVIDADE
 *
 * Exibe um modal de aviso quando o usuário está prestes a ser
 * desconectado por inatividade.
 *
 * Features:
 * - Countdown visual
 * - Animação de entrada
 * - Botões de ação
 * - Som de notificação (opcional)
 * - Bloqueio de interação com o resto da página
 */

import { useEffect, useState } from 'react';
import { AlertTriangle, Clock, RefreshCw, LogOut } from 'lucide-react';
import { formatRemainingTime } from '@/hooks/useInactivityLogout';

interface InactivityWarningProps {
  /** Tempo restante em segundos */
  remainingTime: number;
  /** Callback ao clicar em continuar */
  onContinue: () => void;
  /** Callback ao clicar em sair (opcional) */
  onLogout?: () => void;
  /** Exibir botão de logout */
  showLogoutButton?: boolean;
  /** Tocar som de notificação */
  playSound?: boolean;
}

export function InactivityWarning({
  remainingTime,
  onContinue,
  onLogout,
  showLogoutButton = true,
  playSound = true,
}: InactivityWarningProps) {
  const [mounted, setMounted] = useState(false);
  const [soundPlayed, setSoundPlayed] = useState(false);

  // Animar entrada
  useEffect(() => {
    setMounted(true);
  }, []);

  // Tocar som de notificação
  useEffect(() => {
    if (playSound && !soundPlayed && remainingTime > 0) {
      // Criar som de beep usando Web Audio API
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);

        setSoundPlayed(true);
      } catch (error) {
        console.warn('Não foi possível tocar som de notificação:', error);
      }
    }
  }, [playSound, soundPlayed, remainingTime]);

  // Detectar ESC para continuar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onContinue();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onContinue]);

  const percentage = Math.max(0, (remainingTime / 120) * 100); // 120s = 2min
  const isUrgent = remainingTime <= 30;
  const isCritical = remainingTime <= 10;

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          mounted ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onContinue}
      />

      {/* Modal */}
      <div
        className={`fixed left-1/2 top-1/2 z-[10000] w-full max-w-md -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
          mounted ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="inactivity-title"
      >
        <div
          className={`rounded-2xl bg-white shadow-2xl border-2 transition-colors ${
            isCritical
              ? 'border-red-500 animate-pulse'
              : isUrgent
                ? 'border-orange-500'
                : 'border-yellow-500'
          }`}
        >
          {/* Header */}
          <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-yellow-50 to-orange-50 p-6">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
                backgroundSize: '24px 24px',
              }} />
            </div>

            <div className="relative flex items-start gap-4">
              {/* Icon */}
              <div
                className={`rounded-full p-3 ${
                  isCritical
                    ? 'bg-red-100 text-red-600'
                    : isUrgent
                      ? 'bg-orange-100 text-orange-600'
                      : 'bg-yellow-100 text-yellow-600'
                }`}
              >
                <AlertTriangle className={`h-6 w-6 ${isCritical ? 'animate-bounce' : ''}`} />
              </div>

              {/* Title */}
              <div className="flex-1">
                <h2
                  id="inactivity-title"
                  className="text-xl font-bold text-gray-900"
                >
                  {isCritical ? '⚠️ Desconectando!' : 'Você ainda está aí?'}
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  {isCritical
                    ? 'Você será desconectado em alguns segundos'
                    : 'Detectamos inatividade prolongada'}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Countdown Circle */}
            <div className="mb-6 flex justify-center">
              <div className="relative h-32 w-32">
                {/* Background circle */}
                <svg className="h-32 w-32 -rotate-90 transform">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-gray-200"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - percentage / 100)}`}
                    className={`transition-all duration-1000 ${
                      isCritical
                        ? 'text-red-500'
                        : isUrgent
                          ? 'text-orange-500'
                          : 'text-yellow-500'
                    }`}
                    strokeLinecap="round"
                  />
                </svg>

                {/* Time display */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Clock
                    className={`mb-1 h-6 w-6 ${
                      isCritical
                        ? 'text-red-500'
                        : isUrgent
                          ? 'text-orange-500'
                          : 'text-yellow-500'
                    }`}
                  />
                  <span
                    className={`text-2xl font-bold ${
                      isCritical
                        ? 'text-red-600'
                        : isUrgent
                          ? 'text-orange-600'
                          : 'text-gray-900'
                    }`}
                  >
                    {formatRemainingTime(remainingTime)}
                  </span>
                  <span className="text-xs text-gray-500">restante</span>
                </div>
              </div>
            </div>

            {/* Message */}
            <div className="mb-6 rounded-lg bg-gray-50 p-4 text-center">
              <p className="text-sm text-gray-700">
                Por segurança, você será desconectado automaticamente após{' '}
                <span className="font-semibold">30 minutos de inatividade</span>.
              </p>
              <p className="mt-2 text-xs text-gray-500">
                Clique em "Continuar" para permanecer conectado.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              {/* Continue button */}
              <button
                onClick={onContinue}
                className={`flex-1 rounded-xl px-6 py-3 font-semibold text-white shadow-lg transition-all hover:scale-105 active:scale-95 ${
                  isCritical
                    ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                    : isUrgent
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
                      : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                } focus:outline-none focus:ring-4 ${
                  isCritical
                    ? 'focus:ring-red-500/50'
                    : isUrgent
                      ? 'focus:ring-orange-500/50'
                      : 'focus:ring-blue-500/50'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  <span>Continuar Conectado</span>
                </span>
              </button>

              {/* Logout button (optional) */}
              {showLogoutButton && (
                <button
                  onClick={onLogout}
                  className="rounded-xl border-2 border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition-all hover:border-gray-400 hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-500/20"
                >
                  <span className="flex items-center justify-center gap-2">
                    <LogOut className="h-5 w-5" />
                    <span className="hidden sm:inline">Sair</span>
                  </span>
                </button>
              )}
            </div>

            {/* Keyboard hint */}
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-400">
                Pressione <kbd className="rounded bg-gray-200 px-2 py-1 font-mono text-gray-600">ESC</kbd> para continuar
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * VARIANTE COMPACTA (Toast)
 */
export function InactivityToast({
  remainingTime,
  onContinue,
}: {
  remainingTime: number;
  onContinue: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      className={`fixed bottom-6 right-6 z-[9999] max-w-sm rounded-xl bg-white shadow-2xl border-2 border-yellow-500 transition-all duration-300 ${
        mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      <div className="flex items-center gap-4 p-4">
        <div className="rounded-full bg-yellow-100 p-2 text-yellow-600">
          <Clock className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900">Sessão expirando</p>
          <p className="text-sm text-gray-600">
            {formatRemainingTime(remainingTime)} restante
          </p>
        </div>
        <button
          onClick={onContinue}
          className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}

