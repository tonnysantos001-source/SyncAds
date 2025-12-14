/**
 * VOICE INPUT COMPONENT
 * Sistema de entrada por voz para os modais
 *
 * Features:
 * - Speech-to-text usando Web Speech API
 * - Feedback visual de gravação
 * - Suporte a múltiplos idiomas
 * - Detecção automática de pausas
 * - Integração com sistema de modais
 * - Fallback para navegadores sem suporte
 *
 * @version 1.0.0
 * @date 2025-01-08
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  IconMicrophone,
  IconMicrophoneOff,
  IconPlayerStop,
  IconVolume,
  IconAlertCircle,
  IconCheck,
  IconLoader2,
} from '@tabler/icons-react';
import { useToast } from '@/components/ui/use-toast';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  onStart?: () => void;
  onStop?: () => void;
  onError?: (error: string) => void;
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  className?: string;
  disabled?: boolean;
}

type RecognitionStatus = 'idle' | 'listening' | 'processing' | 'error';

// Check browser support
const isSpeechRecognitionSupported = () => {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
};

export function VoiceInput({
  onTranscript,
  onStart,
  onStop,
  onError,
  language = 'pt-BR',
  continuous = false,
  interimResults = true,
  className,
  disabled = false,
}: VoiceInputProps) {
  const [status, setStatus] = useState<RecognitionStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [volume, setVolume] = useState(0);
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const { toast } = useToast();

  // Check support on mount
  useEffect(() => {
    setIsSupported(isSpeechRecognitionSupported());
    if (!isSpeechRecognitionSupported()) {
      toast({
        title: 'Recurso não disponível',
        description: 'Seu navegador não suporta reconhecimento de voz',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Initialize speech recognition
  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setStatus('listening');
      setTranscript('');
      setInterimTranscript('');
      onStart?.();
    };

    recognition.onresult = (event: any) => {
      let interimText = '';
      let finalText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interimText += result[0].transcript;
        }
      }

      if (finalText) {
        setTranscript((prev) => prev + ' ' + finalText);
        const fullText = (transcript + ' ' + finalText).trim();
        onTranscript(fullText);
      }

      setInterimTranscript(interimText);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setStatus('error');

      let errorMessage = 'Erro ao reconhecer voz';
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'Nenhuma fala detectada';
          break;
        case 'audio-capture':
          errorMessage = 'Microfone não disponível';
          break;
        case 'not-allowed':
          errorMessage = 'Permissão de microfone negada';
          break;
        case 'network':
          errorMessage = 'Erro de conexão';
          break;
      }

      onError?.(errorMessage);
      toast({
        title: 'Erro no reconhecimento de voz',
        description: errorMessage,
        variant: 'destructive',
      });

      // Reset after error
      setTimeout(() => {
        if (status !== 'listening') {
          setStatus('idle');
        }
      }, 2000);
    };

    recognition.onend = () => {
      setStatus('idle');
      stopVolumeMonitoring();
      onStop?.();
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      stopVolumeMonitoring();
    };
  }, [isSupported, continuous, interimResults, language, onTranscript, onStart, onStop, onError, toast]);

  // Start volume monitoring
  const startVolumeMonitoring = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);

      microphoneRef.current.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;

      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateVolume = () => {
        if (!analyserRef.current) return;

        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        setVolume(average / 255);

        animationFrameRef.current = requestAnimationFrame(updateVolume);
      };

      updateVolume();
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  }, []);

  // Stop volume monitoring
  const stopVolumeMonitoring = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (microphoneRef.current) {
      microphoneRef.current.disconnect();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setVolume(0);
  }, []);

  // Start listening
  const startListening = useCallback(() => {
    if (!isSupported || disabled || status === 'listening') return;

    try {
      recognitionRef.current?.start();
      startVolumeMonitoring();
      setStatus('listening');
    } catch (error) {
      console.error('Error starting recognition:', error);
      toast({
        title: 'Erro ao iniciar',
        description: 'Não foi possível iniciar o reconhecimento de voz',
        variant: 'destructive',
      });
    }
  }, [isSupported, disabled, status, startVolumeMonitoring, toast]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (status !== 'listening') return;

    try {
      recognitionRef.current?.stop();
      stopVolumeMonitoring();
      setStatus('idle');
    } catch (error) {
      console.error('Error stopping recognition:', error);
    }
  }, [status, stopVolumeMonitoring]);

  // Toggle listening
  const toggleListening = useCallback(() => {
    if (status === 'listening') {
      stopListening();
    } else {
      startListening();
    }
  }, [status, startListening, stopListening]);

  if (!isSupported) {
    return (
      <div className={cn('flex items-center gap-2 text-gray-500', className)}>
        <IconMicrophoneOff className="w-5 h-5" />
        <span className="text-sm">Voz não disponível</span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Main button */}
      <motion.button
        onClick={toggleListening}
        disabled={disabled || status === 'error'}
        whileHover={{ scale: disabled ? 1 : 1.05 }}
        whileTap={{ scale: disabled ? 1 : 0.95 }}
        className={cn(
          'relative flex items-center justify-center w-12 h-12 rounded-full',
          'transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          status === 'listening' && 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
          status === 'idle' && 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
          status === 'error' && 'bg-gray-600 cursor-not-allowed',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {/* Pulse animation when listening */}
        {status === 'listening' && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full bg-red-600"
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.div
              className="absolute inset-0 rounded-full bg-red-600"
              animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            />
          </>
        )}

        {/* Icon */}
        <div className="relative z-10">
          {status === 'listening' ? (
            <IconPlayerStop className="w-6 h-6 text-white" />
          ) : status === 'error' ? (
            <IconAlertCircle className="w-6 h-6 text-white" />
          ) : (
            <IconMicrophone className="w-6 h-6 text-white" />
          )}
        </div>
      </motion.button>

      {/* Status indicator */}
      <AnimatePresence mode="wait">
        {status === 'listening' && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex items-center gap-2"
          >
            {/* Volume bars */}
            <div className="flex items-center gap-0.5 h-6">
              {[...Array(5)].map((_, i) => {
                const barHeight = Math.max(0.2, Math.min(1, volume * (i + 1) * 0.3));
                return (
                  <motion.div
                    key={i}
                    className="w-1 bg-red-500 rounded-full"
                    animate={{ height: `${barHeight * 100}%` }}
                    transition={{ duration: 0.1 }}
                  />
                );
              })}
            </div>

            {/* Listening text */}
            <span className="text-sm text-gray-400">
              {interimTranscript ? (
                <span className="text-gray-300">{interimTranscript}...</span>
              ) : (
                'Ouvindo...'
              )}
            </span>
          </motion.div>
        )}

        {status === 'processing' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2"
          >
            <IconLoader2 className="w-4 h-4 text-blue-500 animate-spin" />
            <span className="text-sm text-gray-400">Processando...</span>
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2"
          >
            <IconAlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-400">Erro</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transcript preview */}
      {transcript && status === 'idle' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-3 py-1.5 bg-green-600/20 border border-green-600/30 rounded-lg"
        >
          <IconCheck className="w-4 h-4 text-green-500" />
          <span className="text-sm text-gray-300 max-w-[200px] truncate">
            {transcript}
          </span>
        </motion.div>
      )}
    </div>
  );
}

export default VoiceInput;

// Hook helper para usar em componentes
export function useVoiceInput(onTranscript: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported] = useState(isSpeechRecognitionSupported());

  const handleTranscript = useCallback((text: string) => {
    setTranscript(text);
    onTranscript(text);
  }, [onTranscript]);

  const handleStart = useCallback(() => {
    setIsListening(true);
  }, []);

  const handleStop = useCallback(() => {
    setIsListening(false);
  }, []);

  return {
    isListening,
    transcript,
    isSupported,
    handleTranscript,
    handleStart,
    handleStop,
  };
}

