import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const CouponsPage: React.FC = () => {
  const handleCadastrar = () => {
    console.log('Cadastrar cupom');
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
                  Você ainda não tem nenhum cupom cadastrado.
                </h1>
                <p className="text-gray-600 text-lg">
                  Que tal cadastrar seu primeiro cupom de desconto para impulsionar suas vendas?
                </p>
              </div>

              <Button
                onClick={handleCadastrar}
                className="bg-pink-600 hover:bg-pink-700 text-white text-base px-8 py-6 h-auto"
              >
                CADASTRAR CUPOM
              </Button>
            </div>

            {/* Ilustração */}
            <div className="flex justify-center">
              <div className="relative">
                {/* Card de cupom mockup */}
                <div className="bg-white border-t-4 border-pink-600 rounded-lg shadow-lg p-6 w-80">
                  {/* Barra de progresso */}
                  <div className="h-2 bg-gray-200 rounded-full mb-6"></div>
                  
                  {/* Linhas com corações */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-3 bg-gray-200 rounded"></div>
                      <div className="w-6 h-6 bg-pink-500 rounded flex items-center justify-center text-white text-xs">
                        ♥
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-3 bg-gray-200 rounded"></div>
                      <div className="w-6 h-6 bg-pink-500 rounded flex items-center justify-center text-white text-xs">
                        ♥
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pessoa segurando cupom */}
                <div className="absolute -right-12 bottom-0">
                  <svg width="140" height="200" viewBox="0 0 140 200" fill="none">
                    {/* Cabeça */}
                    <ellipse cx="90" cy="50" rx="15" ry="18" fill="#000000" />
                    
                    {/* Corpo */}
                    <path d="M75 70 Q85 90 85 120 L95 120 Q95 90 105 70 Z" fill="#EC4899" />
                    
                    {/* Braço esquerdo segurando cupom */}
                    <path d="M75 80 L55 95 L58 100 L78 85 Z" fill="#EC4899" />
                    
                    {/* Braço direito */}
                    <path d="M105 80 L115 70 L120 75 L110 85 Z" fill="#000000" />
                    
                    {/* Pernas */}
                    <path d="M85 120 L80 165 L75 165 L75 170 L85 170 Z" fill="#000000" />
                    <path d="M95 120 L100 165 L105 165 L105 170 L95 170 Z" fill="#000000" />
                    
                    {/* Cupom na mão */}
                    <rect x="40" y="90" width="20" height="28" rx="2" fill="#EC4899" />
                    <circle cx="50" cy="104" r="3" fill="white" />
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

export default CouponsPage;
