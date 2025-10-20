import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const CollectionsPage: React.FC = () => {
  const handleCadastrar = () => {
    console.log('Cadastrar coleção');
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
                  Você ainda não tem nenhuma coleção cadastrada.
                </h1>
                <p className="text-gray-600 text-lg">
                  Vamos cadastrar sua primeira coleção?
                </p>
              </div>

              <Button
                onClick={handleCadastrar}
                className="bg-pink-600 hover:bg-pink-700 text-white text-base px-8 py-6 h-auto"
              >
                CADASTRAR COLEÇÃO
              </Button>
            </div>

            {/* Ilustração */}
            <div className="flex justify-center">
              <div className="relative">
                {/* Quadro com produtos */}
                <div className="w-72 h-56 border-4 border-gray-900 rounded-lg bg-white p-4 relative">
                  <div className="grid grid-cols-3 gap-3 h-full">
                    {/* Item 1 - Vestido */}
                    <div className="bg-gray-100 rounded flex items-center justify-center">
                      <svg className="w-8 h-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2L8 6H6v14h12V6h-2l-4-4z" />
                      </svg>
                    </div>
                    {/* Item 2 - Vestido preto */}
                    <div className="bg-gray-100 rounded flex items-center justify-center">
                      <svg className="w-8 h-12 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2L8 6H6v14h12V6h-2l-4-4z" />
                      </svg>
                    </div>
                    {/* Item 3 - Calça */}
                    <div className="bg-gray-100 rounded flex items-center justify-center">
                      <svg className="w-8 h-10 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M16 2H8l-2 7v11h4V9h4v11h4V9l-2-7z" />
                      </svg>
                    </div>
                    {/* Item 4 - Camisa */}
                    <div className="bg-gray-100 rounded flex items-center justify-center">
                      <svg className="w-10 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M16 3H8l-2 2v3h12V5l-2-2zm0 18H8V9h8v12z" />
                      </svg>
                    </div>
                    {/* Item 5 - Camisa cinza */}
                    <div className="bg-gray-100 rounded flex items-center justify-center">
                      <svg className="w-10 h-8 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M16 3H8l-2 2v3h12V5l-2-2zm0 18H8V9h8v12z" />
                      </svg>
                    </div>
                    {/* Item 6 - Camiseta preta */}
                    <div className="bg-gray-100 rounded flex items-center justify-center">
                      <svg className="w-10 h-8 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M16 3H8l-2 2v3h12V5l-2-2zm0 18H8V9h8v12z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Caixas no chão */}
                <div className="absolute -bottom-8 -left-8 flex gap-2">
                  <div className="w-16 h-12 border-2 border-gray-900 bg-white"></div>
                  <div className="w-16 h-12 border-2 border-gray-900 bg-white"></div>
                </div>

                {/* Pessoa carregando caixa */}
                <div className="absolute -right-12 top-8">
                  <svg width="120" height="180" viewBox="0 0 120 180" fill="none">
                    {/* Cabeça */}
                    <circle cx="60" cy="30" r="18" fill="#000000" />
                    
                    {/* Corpo rosa */}
                    <rect x="48" y="48" width="24" height="35" rx="2" fill="#EC4899" />
                    
                    {/* Braços segurando caixa */}
                    <path d="M48 58 L30 65 L30 75 L48 68 Z" fill="#EC4899" />
                    <path d="M72 58 L90 65 L90 75 L72 68 Z" fill="#000000" />
                    
                    {/* Caixa na frente */}
                    <rect x="35" y="60" width="30" height="25" rx="1" fill="white" stroke="#000000" strokeWidth="2" />
                    
                    {/* Pernas */}
                    <path d="M50 83 L45 140 L40 140 L40 146 L50 146 Z" fill="#000000" />
                    <path d="M70 83 L75 140 L80 140 L80 146 L70 146 Z" fill="#000000" />
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

export default CollectionsPage;
