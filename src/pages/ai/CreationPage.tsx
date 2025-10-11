import React, { useState, useEffect } from 'react';
import { Wand2, Image as ImageIcon, Sparkles, LoaderCircle, ServerCrash } from 'lucide-react';
import { ChatInput } from '../../components/ai/ChatInput';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import axios from 'axios';
import { Button } from '@/components/ui/Button';
import MissingModelConfiguration from '@/components/ai/MissingModelConfiguration';

interface GeneratedImage {
    prompt: string;
    url: string;
}

const CreationPage: React.FC = () => {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentImage, setCurrentImage] = useState<GeneratedImage | null>(null);
    const [recentCreations, setRecentCreations] = useState<GeneratedImage[]>([]);
    const [modelAvailable, setModelAvailable] = useState<boolean | null>(null);

    useEffect(() => {
        const checkModel = async () => {
            const { data, error } = await supabase
                .from('ai_models')
                .select('id')
                .eq('type', 'Image Generation')
                .eq('status', 'active')
                .limit(1)
                .single();
            
            if (error || !data) {
                setModelAvailable(false);
            } else {
                setModelAvailable(true);
            }
        };
        checkModel();
    }, []);

    const handleGenerateImage = async () => {
        if (!input.trim()) {
            toast.warning('Por favor, descreva a imagem que você quer criar.');
            return;
        }
        
        setIsLoading(true);
        setError(null);
        setCurrentImage(null);

        try {
            const { data: modelData, error: modelError } = await supabase
                .from('ai_models')
                .select('api_key, model_identifier')
                .eq('type', 'Image Generation')
                .eq('status', 'active')
                .limit(1)
                .single();

            if (modelError || !modelData) {
                throw new Error('Nenhum modelo de geração de imagem ativo encontrado. Adicione uma chave na página "IA Mãe".');
            }

            const response = await axios.post(
                'https://openrouter.ai/api/v1/images/generations',
                {
                    prompt: input,
                    model: modelData.model_identifier || 'stabilityai/sdxl',
                },
                {
                    headers: { 'Authorization': `Bearer ${modelData.api_key}` },
                }
            );

            const imageUrl = response.data.data[0].url;
            if (!imageUrl) {
                throw new Error('A API não retornou uma imagem.');
            }

            const newCreation: GeneratedImage = { prompt: input, url: imageUrl };
            setCurrentImage(newCreation);
            setRecentCreations(prev => [newCreation, ...prev.slice(0, 3)]);
            setInput('');

        } catch (error: any) {
            let errorMessage = 'Ocorreu um erro ao gerar a imagem.';
            if (error.response) {
                errorMessage = `Erro da IA: ${error.response.data?.error?.message || 'Verifique o modelo e a chave API.'}`;
            } else {
                errorMessage = error.message;
            }
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };
    
    if (modelAvailable === null) {
        return (
            <div className="flex-1 flex items-center justify-center bg-light-bg dark:bg-dark-bg">
                <LoaderCircle className="h-8 w-8 animate-spin text-brand-primary" />
            </div>
        );
    }

    if (!modelAvailable) {
        return <MissingModelConfiguration pageType="creation" />;
    }

    return (
        <div className="flex h-full w-full bg-light-bg dark:bg-dark-bg">
            {/* Left Panel */}
            <div className="w-full md:w-[400px] lg:w-[450px] flex-shrink-0 border-r border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card flex flex-col h-full">
                <header className="p-4 border-b border-light-border dark:border-dark-border flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-accent/20 rounded-full">
                            <Wand2 className="h-6 w-6 text-brand-accent" />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg text-gray-900 dark:text-white">Criação com IA</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Gere imagens, textos e mais.</p>
                        </div>
                    </div>
                </header>

                <div className="flex-1 flex flex-col gap-6 p-4 overflow-y-auto">
                    <div className="bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl p-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Tipo de Criação</h3>
                        <div className="flex gap-2">
                            <Button size="sm">
                                <ImageIcon className="h-4 w-4 mr-2" />
                                Imagem
                            </Button>
                            <Button size="sm" variant="secondary" disabled>
                                <Sparkles className="h-4 w-4 mr-2" />
                                Texto (em breve)
                            </Button>
                        </div>
                    </div>

                    {recentCreations.length > 0 && (
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">Criações Recentes</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
                                {recentCreations.map((img, index) => (
                                    <button key={index} onClick={() => setCurrentImage(img)} className="aspect-square rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-brand-primary ring-offset-2 ring-offset-light-card dark:ring-offset-dark-card">
                                        <img src={img.url} alt={img.prompt} className="w-full h-full object-cover transition-transform hover:scale-105" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <footer className="p-4 border-t border-light-border dark:border-dark-border flex-shrink-0">
                    <ChatInput 
                        input={input}
                        setInput={setInput}
                        handleSendMessage={handleGenerateImage}
                        isLoading={isLoading}
                        placeholder="Descreva a imagem que você quer criar..." 
                    />
                </footer>
            </div>

            {/* Right Panel (Main Display) */}
            <div className="flex-1 flex justify-center items-center p-6">
                <div className="w-full h-full bg-light-card dark:bg-dark-card border-2 border-dashed border-light-border dark:border-dark-border rounded-2xl flex flex-col justify-center items-center text-center p-8 overflow-hidden">
                    {isLoading ? (
                        <>
                            <LoaderCircle className="h-12 w-12 text-brand-accent animate-spin" />
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-4">Gerando sua imagem...</h2>
                            <p className="text-gray-500 dark:text-gray-400 mt-2">Isso pode levar alguns instantes.</p>
                        </>
                    ) : error ? (
                        <>
                            <ServerCrash className="h-12 w-12 text-red-500" />
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-4">Ocorreu um Erro</h2>
                            <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-sm">{error}</p>
                        </>
                    ) : currentImage ? (
                         <img src={currentImage.url} alt={currentImage.prompt} className="w-full h-full object-contain rounded-lg" />
                    ) : (
                        <>
                            <div className="p-4 bg-gray-100 dark:bg-gray-700/50 rounded-full mb-4">
                                <ImageIcon className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Seu resultado aparecerá aqui</h2>
                            <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-sm">
                                Descreva o que você quer criar e a IA irá gerar o resultado para você visualizar nesta área.
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CreationPage;
