import React from 'react';

interface SonicIconProps {
  emotion?: 'thinking' | 'happy' | 'angry' | 'neutral';
  size?: number;
}

export default function SonicIcon({ emotion = 'neutral', size = 48 }: SonicIconProps) {
  const animationClass = {
    thinking: 'animate-bounce',
    happy: 'animate-bounce',
    angry: 'animate-shake',
    neutral: ''
  }[emotion];

  const faceStyles = {
    thinking: {
      // Sobrancelhas levantadas
      eyebrow: <path d="M 10 15 Q 12 10 14 15" stroke="#000" strokeWidth="1.5" fill="none" strokeLinecap="round"/>,
      mouth: <path d="M 12 22 Q 16 24 20 22" stroke="#000" strokeWidth="1.5" fill="none" strokeLinecap="round"/>,
    },
    happy: {
      // Olhos mais fechados, sorriso maior
      eyebrow: <path d="M 10 14 Q 12 12 14 14" stroke="#000" strokeWidth="1.5" fill="none" strokeLinecap="round"/>,
      mouth: <path d="M 11 23 Q 16 26 21 23" stroke="#000" strokeWidth="2" fill="none" strokeLinecap="round"/>,
    },
    angry: {
      // Sobrancelhas franzidas
      eyebrow: <path d="M 10 16 Q 12 20 14 16" stroke="#000" strokeWidth="1.5" fill="none" strokeLinecap="round"/>,
      mouth: <path d="M 12 23 Q 16 20 20 23" stroke="#000" strokeWidth="1.5" fill="none" strokeLinecap="round"/>,
    },
    neutral: {
      // Expressão neutra
      eyebrow: <path d="M 10 15 Q 12 15 14 15" stroke="#000" strokeWidth="1.5" fill="none" strokeLinecap="round"/>,
      mouth: <path d="M 12 22 Q 16 23 20 22" stroke="#000" strokeWidth="1.5" fill="none" strokeLinecap="round"/>,
    }
  };

  const face = faceStyles[emotion];

  return (
    <div className={`relative ${animationClass}`} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        className="drop-shadow-lg"
      >
        {/* Cabeça - azul */}
        <ellipse cx="16" cy="18" rx="14" ry="12" fill="#00A8E8" stroke="#0093C7" strokeWidth="0.5"/>
        
        {/* Focinho - bege */}
        <ellipse cx="16" cy="20" rx="6" ry="5" fill="#F5D5B8" stroke="#E6C5A0" strokeWidth="0.5"/>
        
        {/* Orelha direita */}
        <ellipse cx="22" cy="10" rx="5" ry="8" fill="#00A8E8" stroke="#0093C7" strokeWidth="0.5"/>
        <ellipse cx="22" cy="10" rx="3" ry="5" fill="#F5D5B8"/>
        
        {/* Orelha esquerda */}
        <ellipse cx="10" cy="10" rx="5" ry="8" fill="#00A8E8" stroke="#0093C7" strokeWidth="0.5"/>
        <ellipse cx="10" cy="10" rx="3" ry="5" fill="#F5D5B8"/>
        
        {/* Olho direito */}
        <ellipse cx="12.5" cy="17" rx="2.5" ry="3" fill="#FFFFFF"/>
        <circle cx="13" cy="17.5" r="1.5" fill="#000"/>
        <circle cx="13.5" cy="17" r="0.5" fill="#FFF"/>
        
        {/* Olho esquerdo */}
        <ellipse cx="19.5" cy="17" rx="2.5" ry="3" fill="#FFFFFF"/>
        <circle cx="20" cy="17.5" r="1.5" fill="#000"/>
        <circle cx="20.5" cy="17" r="0.5" fill="#FFF"/>
        
        {/* Sobrancelhas */}
        {face.eyebrow}
        
        {/* Nariz */}
        <ellipse cx="16" cy="20.5" rx="1.5" ry="1" fill="#000"/>
        
        {/* Boca */}
        {face.mouth}
        
        {/* Espinhos */}
        <path d="M 20 6 Q 22 4 24 6 Q 22 8 20 6" fill="#00A8E8" stroke="#0093C7" strokeWidth="0.5"/>
        <path d="M 16 4 Q 18 2 20 4 Q 18 6 16 4" fill="#00A8E8" stroke="#0093C7" strokeWidth="0.5"/>
        <path d="M 12 6 Q 10 4 8 6 Q 10 8 12 6" fill="#00A8E8" stroke="#0093C7" strokeWidth="0.5"/>
      </svg>
      
      {/* Indicador de atividade */}
      {emotion !== 'neutral' && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-ping"></div>
      )}
    </div>
  );
}

// Adicionar animação shake ao CSS (se não existir)
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-2px); }
      75% { transform: translateX(2px); }
    }
    .animate-shake {
      animation: shake 0.5s ease-in-out infinite;
    }
  `;
  document.head.appendChild(style);
}

