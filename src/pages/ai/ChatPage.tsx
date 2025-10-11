import React, { useState, useEffect, useRef } from 'react';
import { Bot, LoaderCircle } from 'lucide-react';
import { ChatMessage } from '../../components/ai/ChatMessage';
import { ChatInput } from '../../components/ai/ChatInput';
import { supabase } from '../../lib/supabaseClient';
import axios from 'axios';
import { toast } from 'sonner';
import ThemeToggle from '@/components/layout/ThemeToggle';
import { cn } from '@/lib/utils';
import MissingModelConfiguration from '@/components/ai/MissingModelConfiguration';

interface Message {
    id?: string;
    role: 'user' | 'assistant';
    content: string;
}

const AITypingIndicator = () => (
    <div className="flex items-start gap-3 w-full justify-start">
        <div className="flex items-start gap-3 max-w-2xl">
            <div className="p-2 bg-gray-200 dark:bg-dark-card rounded-full mt-1 flex-shrink-0"><Bot className="h-5 w-5 text-gray-500" /></div>
            <div className="rounded-lg p-3 bg-gray-200 dark:bg-dark-card text-gray-800 dark:text-gray-200 rounded-bl-none flex items-center gap-2">
                <span className="text-sm">Digitando</span>
                <LoaderCircle className="h-4 w-4 animate-spin" />
            </div>
        </div>
    </div>
);

const ChatPage: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Olá! Sou seu assistente de marketing da SyncAds AI. Como posso ajudar você a crescer hoje?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [modelAvailable, setModelAvailable] = useState<boolean | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const initChat = async () => {
            // Check for active model
            const { data: modelData, error: modelError } = await supabase
                .from('ai_models')
                .select('id')
                .eq('type', 'Language Processing')
                .eq('status', 'active')
                .limit(1)
                .single();
            
            if (modelError || !modelData) {
                setModelAvailable(false);
                return;
            }
            setModelAvailable(true);

            // Create a new conversation
            const { data, error } = await supabase
                .from('conversations')
                .insert([{}])
                .select('id')
                .single();

            if (error) {
                toast.error('Não foi possível iniciar uma nova conversa.');
                console.error('Error creating conversation:', error);
            } else if (data) {
                setConversationId(data.id);
            }
        };
        initChat();
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const saveMessage = async (message: Message, convId: string) => {
        const { error } = await supabase.from('messages').insert({
            conversation_id: convId,
            role: message.role,
            content: message.content,
        });
        if (error) {
            toast.error('Erro ao salvar mensagem no histórico.');
            console.error('Error saving message:', error);
        }
    };

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading || !conversationId) return;

        const userMessage: Message = { role: 'user', content: input };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        await saveMessage(userMessage, conversationId);

        try {
            const { data: modelData, error: modelError } = await supabase
                .from('ai_models')
                .select('api_key, model_identifier, system_prompt')
                .eq('type', 'Language Processing')
                .eq('status', 'active')
                .limit(1)
                .single();

            if (modelError || !modelData) {
                throw new Error('Nenhum modelo de IA ativo foi encontrado. Configure um na página "IA Mãe".');
            }

            const systemMessage = modelData.system_prompt 
                ? [{ role: 'system', content: modelData.system_prompt }]
                : [];
            
            const apiMessages = [
                ...systemMessage,
                ...newMessages.map(({ role, content }) => ({ role, content }))
            ];

            const response = await axios.post(
                'https://openrouter.ai/api/v1/chat/completions',
                {
                    model: modelData.model_identifier || 'mistralai/mistral-7b-instruct:free',
                    messages: apiMessages,
                },
                {
                    headers: {
                        'Authorization': `Bearer ${modelData.api_key}`,
                        'Content-Type': 'application/json'
                    },
                }
            );

            const aiMessageContent = response.data.choices[0].message.content;
            const aiMessage: Message = { role: 'assistant', content: aiMessageContent };
            
            setMessages(prev => [...prev, aiMessage]);
            await saveMessage(aiMessage, conversationId);

        } catch (error: any) {
            let errorMessage = 'Ocorreu um erro ao contatar a IA.';
            if (error.response) {
                errorMessage = `Erro da IA: ${error.response.data?.error?.message || 'Erro desconhecido'}`;
            } else if (error.request) {
                errorMessage = 'Não foi possível se conectar à API da IA. Verifique sua conexão.';
            } else {
                errorMessage = error.message;
            }
            
            toast.error(errorMessage);
            console.error('Error fetching AI response:', error);
            // Remove the user message if the AI fails to respond
            setMessages(prev => prev.slice(0, -1));
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
        return <MissingModelConfiguration pageType="chat" />;
    }

    return (
        <div className="flex flex-col h-full w-full bg-chat-bg-light dark:bg-dark-bg dark:bg-chat-bg-dark bg-cover bg-center">
            <header className="p-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between sticky top-0 bg-light-card/80 dark:bg-dark-bg/80 backdrop-blur-sm z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-primary/20 rounded-full">
                        <Bot className="h-6 w-6 text-brand-primary" />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg text-gray-900 dark:text-white">Assistente IA</h1>
                        <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                            Online
                        </p>
                    </div>
                </div>
                <ThemeToggle />
            </header>
      
            <div className="flex-1 p-4 md:p-6 space-y-4 overflow-y-auto w-full max-w-4xl mx-auto">
                {messages.map((msg, index) => (
                    <ChatMessage key={msg.id || index} author={msg.role} text={msg.content} />
                ))}
                {isLoading && <AITypingIndicator />}
                <div ref={chatEndRef} />
            </div>

            <footer className="p-4 md:p-6 w-full max-w-4xl mx-auto sticky bottom-0 bg-transparent">
                <ChatInput 
                    input={input}
                    setInput={setInput}
                    handleSendMessage={handleSendMessage}
                    isLoading={isLoading}
                    placeholder="Converse com o Assistente IA..." 
                />
                <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
                    A IA pode cometer erros. Considere verificar informações importantes.
                </p>
            </footer>
        </div>
    );
};

export default ChatPage;
