import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const UpsellPage: React.FC = () => {
  const handleCadastrar = () => {
    console.log('Cadastrar upsell');
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
                  Você ainda não tem nenhum upsell cadastrado.
                </h1>
                <p className="text-gray-600 text-lg">
                  Que tal cadastrar seu primeiro upsell para aumentar seu ticket médio?
                </p>
              </div>

              <Button
                onClick={handleCadastrar}
                className="bg-pink-600 hover:bg-pink-700 text-white text-base px-8 py-6 h-auto"
              >
                CADASTRAR UPSELL
              </Button>
            </div>

            {/* Ilustração */}
            <div className="flex justify-center">
              <div className="relative">
                {/* Smartphone mockup */}
                <div className="relative">
                  <div className="w-56 h-96 bg-gray-900 rounded-3xl p-2 shadow-2xl">
                    <div className="w-full h-full bg-white rounded-2xl overflow-hidden flex flex-col items-center justify-center p-4">
                      {/* Cabeça de produto */}
                      <div className="w-20 h-20 bg-gray-800 rounded-full mb-4"></div>
                      
                      {/* Setas indicando upgrade */}
                      <div className="flex items-center gap-2 mb-4">
                        <svg className="w-6 h-6 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <div className="w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <svg className="w-6 h-6 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </div>

                      {/* Linhas de texto */}
                      <div className="space-y-2 w-full">
                        <div className="h-2 bg-gray-200 rounded w-full"></div>
                        <div className="h-2 bg-gray-200 rounded w-3/4 mx-auto"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pessoa ao lado do celular */}
                <div className="absolute -right-16 bottom-0">
                  <svg width="100" height="180" viewBox="0 0 100 180" fill="none">
                    {/* Cabeça */}
                    <circle cx="50" cy="30" r="15" fill="#000000" />
                    
                    {/* Corpo */}
                    <rect x="40" y="45" width="20" height="35" rx="2" fill="#EC4899" />
                    
                    {/* Braços */}
                    <path d="M40 55 L25 65 L28 70 L43 60 Z" fill="#EC4899" />
                    <path d="M60 55 L75 65 L72 70 L57 60 Z" fill="#000000" />
                    
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

export default UpsellPage;
