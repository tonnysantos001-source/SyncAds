import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

const SocialProofPage: React.FC = () => {
  const navigate = useNavigate();

  const handleCadastrar = () => {
    console.log('Cadastrar prova social');
    // Aqui você implementaria a navegação para formulário de cadastro
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center p-6">
      <Card className="max-w-4xl w-full">
        <CardContent className="p-12">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Texto e Botão */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                  Você ainda não tem
                  <br />
                  nenhuma prova social cadastrada.
                </h1>
                <p className="text-gray-600 text-lg">
                  Use a 'prova social' para gerar mais confiança nas suas vendas.
                </p>
              </div>

              <Button
                onClick={handleCadastrar}
                className="bg-pink-600 hover:bg-pink-700 text-white text-base px-8 py-6 h-auto"
              >
                CADASTRAR PROVA SOCIAL
              </Button>
            </div>

            {/* Ilustração */}
            <div className="flex justify-center">
              <div className="relative">
                {/* Card de exemplo */}
                <div className="bg-white border-t-4 border-pink-600 rounded-lg shadow-lg p-6 w-80">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="h-2 bg-gray-200 rounded w-full"></div>
                    <div className="h-2 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </div>

                {/* Pessoa escrevendo */}
                <div className="absolute -right-8 bottom-0">
                  <svg width="120" height="180" viewBox="0 0 120 180" fill="none">
                    {/* Caneta */}
                    <path d="M85 70 L92 85 L78 92 L71 77 Z" fill="#EC4899" />
                    <rect x="88" y="60" width="3" height="15" fill="#EC4899" transform="rotate(-40 89.5 67.5)" />
                    
                    {/* Pessoa */}
                    <circle cx="70" cy="50" r="12" fill="#000000" />
                    <path d="M70 62 L70 110" stroke="#000000" strokeWidth="4" strokeLinecap="round" />
                    <path d="M70 75 L85 95" stroke="#000000" strokeWidth="4" strokeLinecap="round" />
                    <path d="M70 75 L55 70" stroke="#000000" strokeWidth="4" strokeLinecap="round" />
                    <path d="M70 110 L55 145" stroke="#000000" strokeWidth="4" strokeLinecap="round" />
                    <path d="M70 110 L85 145" stroke="#000000" strokeWidth="4" strokeLinecap="round" />
                    
                    {/* Cabelo */}
                    <path d="M58 45 Q65 35 72 35 Q80 35 85 42 L82 50 Q75 48 70 48 Q65 48 60 50 Z" fill="#000000" />
                    <circle cx="80" cy="45" r="6" fill="#000000" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SocialProofPage;
