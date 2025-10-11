import React from 'react';
import { Send, Paperclip, Mic, LoaderCircle } from 'lucide-react';

interface ChatInputProps {
    input: string;
    setInput: (value: string) => void;
    handleSendMessage: () => void;
    isLoading: boolean;
    placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({ 
    input, 
    setInput, 
    handleSendMessage, 
    isLoading, 
    placeholder = "Converse com a IA..." 
}) => {
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!isLoading) {
                handleSendMessage();
            }
        }
    };

    return (
        <div className="relative bg-light-card dark:bg-dark-card rounded-xl shadow-lg border border-light-border dark:border-dark-border p-2 flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 bg-transparent p-2 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none resize-none"
            rows={1}
            onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
            }}
            disabled={isLoading}
          />
          <div className="flex items-center gap-1">
            <button className="p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-50" disabled={isLoading}>
              <Paperclip className="h-5 w-5" />
            </button>
            <button className="p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-50" disabled={isLoading}>
              <Mic className="h-5 w-5" />
            </button>
            <button 
                onClick={handleSendMessage}
                className="p-2 w-10 h-10 flex items-center justify-center rounded-full bg-brand-primary text-white hover:bg-brand-primary/80 transition-colors disabled:bg-brand-primary/50 disabled:cursor-not-allowed"
                disabled={isLoading || !input.trim()}
            >
              {isLoading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </button>
          </div>
        </div>
    );
};
