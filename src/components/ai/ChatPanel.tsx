import React from 'react';
import { Bot, Send, Paperclip, Mic } from 'lucide-react';

const ChatPanel: React.FC = () => {
  return (
    <div className="flex flex-col h-full w-full max-w-md mx-auto bg-dark-card border-l border-dark-border">
      <div className="p-4 border-b border-dark-border flex items-center gap-3">
        <div className="p-2 bg-brand-primary/20 rounded-full">
            <Bot className="h-6 w-6 text-brand-primary" />
        </div>
        <div>
            <h2 className="font-bold text-lg text-white">Assistente IA</h2>
            <p className="text-sm text-green-400 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
                Online
            </p>
        </div>
      </div>
      
      <div className="flex-1 p-4 space-y-6 overflow-y-auto">
        {/* Chat messages */}
        <ChatMessage author="ai" text="Olá! Como posso impulsionar seu marketing hoje? Peça para criar uma campanha, gerar uma imagem ou automatizar uma tarefa." />
        <ChatMessage author="user" text="Crie uma copy para um anúncio no Instagram sobre um novo tênis de corrida." />
        <ChatMessage author="ai" text="Claro! Aqui está uma sugestão: 'Liberte sua velocidade. 🚀 Conheça o novo Velocity X, projetado para quebrar recordes e impulsionar sua corrida. Toque para saber mais! #VelocityX #Corrida #Performance'" />
      </div>

      <div className="p-4 border-t border-dark-border">
        <div className="relative">
          <textarea
            placeholder="Converse com a IA..."
            className="w-full bg-gray-800 border border-dark-border rounded-lg p-3 pr-24 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
            rows={1}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <button className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors">
              <Paperclip className="h-5 w-5" />
            </button>
            <button className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors">
              <Mic className="h-5 w-5" />
            </button>
            <button className="p-2 rounded-full bg-brand-primary text-white hover:bg-brand-primary/80 transition-colors">
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ChatMessage = ({ author, text }: { author: 'ai' | 'user', text: string }) => {
    const isAI = author === 'ai';
    return (
        <div className={`flex items-start gap-3 ${isAI ? '' : 'flex-row-reverse'}`}>
            {isAI && <div className="p-2 bg-brand-primary/20 rounded-full mt-1"><Bot className="h-5 w-5 text-brand-primary" /></div>}
            <div className={`max-w-xs md:max-w-sm rounded-lg p-3 ${isAI ? 'bg-gray-700 text-gray-200 rounded-tl-none' : 'bg-brand-primary text-white rounded-tr-none'}`}>
                <p className="text-sm">{text}</p>
            </div>
        </div>
    )
}

export default ChatPanel;
