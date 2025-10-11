import React from 'react';
import { Cpu, Settings } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Link } from 'react-router-dom';

interface MissingModelConfigurationProps {
    pageType: 'chat' | 'creation';
}

const MissingModelConfiguration: React.FC<MissingModelConfigurationProps> = ({ pageType }) => {
    const title = pageType === 'chat' 
        ? 'Nenhum Modelo de Conversação Ativo' 
        : 'Nenhum Modelo de Criação Ativo';
    
    const description = pageType === 'chat'
        ? 'Para começar a conversar com a IA, você precisa primeiro configurar e ativar um modelo de "Processamento de Linguagem" na seção IA Mãe.'
        : 'Para começar a gerar imagens, você precisa primeiro configurar e ativar um modelo de "Geração de Imagem" na seção IA Mãe.';

    return (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gray-100 dark:bg-dark-bg">
            <div className="p-4 bg-red-500/10 rounded-full mb-4">
                <Cpu className="h-12 w-12 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-md">
                {description}
            </p>
            <Button asChild className="mt-6">
                <Link to="/mother-ai">
                    <Settings className="mr-2 h-4 w-4" />
                    Ir para IA Mãe
                </Link>
            </Button>
        </div>
    );
};

export default MissingModelConfiguration;
