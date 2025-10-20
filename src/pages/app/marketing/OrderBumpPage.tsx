import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const OrderBumpPage: React.FC = () => {
  const handleCadastrar = () => {
    console.log('Cadastrar order bump');
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
                  Você ainda não tem nenhum order bump cadastrado.
                </h1>
                <p className="text-gray-600 text-lg">
                  Que tal cadastrar seu primeiro order bump para aumentar seu ticket médio?
                </p>
              </div>

              <Button
                onClick={handleCadastrar}
                className="bg-pink-600 hover:bg-pink-700 text-white text-base px-8 py-6 h-auto"
              >
                CADASTRAR ORDER BUMP
              </Button>
            </div>

            {/* Ilustração */}
            <div className="flex justify-center">
              <div className="relative">
                {/* Cards empilhados com checkmarks */}
                <div className="relative w-80 h-64">
                  {/* Card 3 (fundo) */}
                  <div className="absolute top-8 left-4 bg-white rounded-lg shadow-md p-4 w-64 border border-gray-200">
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>

                  {/* Card 2 (meio) */}
                  <div className="absolute top-4 left-8 bg-white rounded-lg shadow-lg p-4 w-64 border border-gray-200">
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    {/* Checkmark rosa */}
                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>

                  {/* Card 1 (frente) */}
                  <div className="absolute top-0 left-12 bg-white rounded-lg shadow-xl p-4 w-64 border border-gray-200">
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    {/* Checkmark rosa */}
                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Pessoa */}
                <div className="absolute -right-8 bottom-4">
                  <svg width="100" height="180" viewBox="0 0 100 180" fill="none">
                    {/* Cabeça */}
                    <circle cx="50" cy="30" r="15" fill="#000000" />
                    
                    {/* Corpo */}
                    <rect x="40" y="45" width="20" height="35" rx="2" fill="#EC4899" />
                    
                    {/* Braços */}
                    <path d="M40 55 L25 70 L28 75 L43 60 Z" fill="#EC4899" />
                    <path d="M60 55 L75 70 L72 75 L57 60 Z" fill="#000000" />
                    
                    {/* Pernas */}
                    <path d="M42 80 L38 130 L33 130 L33 135 L43 135 Z" fill="#000000" />
                    <path d="M58 80 L62 130 L67 130 L67 135 L57 135 Z" fill="#000000" />
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

export default OrderBumpPage;
