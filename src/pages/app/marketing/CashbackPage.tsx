import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const CashbackPage: React.FC = () => {
  const handleCadastrar = () => {
    console.log('Cadastrar cashback');
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
                  Você ainda não tem nenhum cashback cadastrado.
                </h1>
                <p className="text-gray-600 text-lg">
                  Que tal obter seus primeiros cashbacks você poderá vê-los aqui.
                </p>
              </div>

              <Button
                onClick={handleCadastrar}
                className="bg-pink-600 hover:bg-pink-700 text-white text-base px-8 py-6 h-auto"
              >
                CADASTRAR CASHBACK
              </Button>
            </div>

            {/* Ilustração */}
            <div className="flex justify-center">
              <div className="relative">
                {/* Smartphone mockup */}
                <div className="w-64 h-[450px] bg-gray-900 rounded-[3rem] p-3 shadow-2xl">
                  <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden relative">
                    {/* Notch */}
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-2xl"></div>
                    
                    {/* Conteúdo do celular */}
                    <div className="pt-10 px-4 flex flex-col items-center justify-center h-full">
                      {/* Ícone de dinheiro no topo */}
                      <div className="w-16 h-16 bg-pink-600 rounded-full flex items-center justify-center mb-6">
                        <span className="text-white text-2xl font-bold">$</span>
                      </div>
                      
                      {/* Seta */}
                      <svg className="w-8 h-8 text-gray-400 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                      
                      {/* Barra rosa */}
                      <div className="w-48 h-12 bg-pink-600 rounded-lg mb-6"></div>
                      
                      {/* Ícone de dinheiro embaixo */}
                      <div className="w-16 h-16 bg-pink-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-2xl font-bold">$</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pessoa segurando celular */}
                <div className="absolute -right-16 bottom-8">
                  <svg width="120" height="200" viewBox="0 0 120 200" fill="none">
                    {/* Cabeça */}
                    <circle cx="70" cy="30" r="18" fill="#000000" />
                    
                    {/* Corpo */}
                    <rect x="58" y="48" width="24" height="40" rx="2" fill="#EC4899" />
                    
                    {/* Braço esquerdo */}
                    <path d="M58 58 L40 70 L43 77 L61 65 Z" fill="#EC4899" />
                    
                    {/* Braço direito */}
                    <path d="M82 58 L100 70 L97 77 L79 65 Z" fill="#000000" />
                    
                    {/* Pernas */}
                    <path d="M60 88 L55 145 L50 145 L50 151 L60 151 Z" fill="#000000" />
                    <path d="M80 88 L85 145 L90 145 L90 151 L80 151 Z" fill="#000000" />
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

export default CashbackPage;
