import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const DiscountBannerPage: React.FC = () => {
  const handleCadastrar = () => {
    console.log('Cadastrar faixa de desconto');
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
                  Você ainda não tem nenhuma faixa de desconto cadastrada.
                </h1>
                <p className="text-gray-600 text-lg">
                  Use a faixa de desconto para criar ofertas que ajudam a aumentar seu ticket médio.
                </p>
              </div>

              <Button
                onClick={handleCadastrar}
                className="bg-pink-600 hover:bg-pink-700 text-white text-base px-8 py-6 h-auto"
              >
                CADASTRAR FAIXA DE DESCONTO
              </Button>
            </div>

            {/* Ilustração */}
            <div className="flex justify-center">
              <div className="relative">
                {/* Banner/Quadro */}
                <div className="w-80 h-64 border-4 border-gray-900 rounded-lg bg-white relative overflow-hidden">
                  {/* Faixas rosa horizontais */}
                  <div className="absolute top-16 left-0 right-0 h-12 bg-pink-600 flex items-center justify-center">
                    <div className="w-16 h-2 bg-white rounded"></div>
                  </div>
                  
                  <div className="absolute top-36 left-0 right-0 h-12 bg-pink-600 flex items-center justify-center">
                    <div className="w-16 h-2 bg-white rounded"></div>
                  </div>

                  {/* Cabeça no topo */}
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-gray-900 rounded-full"></div>
                </div>

                {/* Pessoa ao lado apontando */}
                <div className="absolute -right-12 top-1/2 transform -translate-y-1/2">
                  <svg width="120" height="200" viewBox="0 0 120 200" fill="none">
                    {/* Cabeça */}
                    <circle cx="60" cy="35" r="18" fill="#000000" />
                    
                    {/* Corpo */}
                    <rect x="48" y="53" width="24" height="40" rx="2" fill="#EC4899" />
                    
                    {/* Braço esquerdo (apontando) */}
                    <path d="M48 63 L25 75 L28 82 L51 70 Z" fill="#EC4899" />
                    
                    {/* Braço direito */}
                    <path d="M72 63 L90 75 L87 82 L69 70 Z" fill="#000000" />
                    
                    {/* Pernas */}
                    <path d="M50 93 L45 150 L40 150 L40 156 L50 156 Z" fill="#000000" />
                    <path d="M70 93 L75 150 L80 150 L80 156 L70 156 Z" fill="#000000" />
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

export default DiscountBannerPage;
