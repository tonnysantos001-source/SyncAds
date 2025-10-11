import React from 'react';
import { Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ChatMessage = ({ author, text }: { author: 'assistant' | 'user', text: string }) => {
    const isAI = author === 'assistant';
    return (
        <div className={cn('flex items-end gap-3 w-full', isAI ? 'justify-start' : 'justify-end')}>
            <div className={cn('flex items-start gap-3 max-w-2xl', isAI ? '' : 'flex-row-reverse')}>
                {isAI ? (
                    <div className="p-2 bg-light-card dark:bg-dark-card rounded-full flex-shrink-0 shadow">
                        <Bot className="h-5 w-5 text-brand-primary" />
                    </div>
                ) : (
                    <div className="p-2 bg-light-card dark:bg-dark-card rounded-full flex-shrink-0 shadow">
                         <User className="h-5 w-5 text-brand-primary" />
                    </div>
                )}
                <div className={cn(
                    'rounded-lg p-3 text-sm leading-relaxed shadow',
                    isAI 
                        ? 'bg-gray-200 dark:bg-dark-card text-gray-800 dark:text-gray-200 rounded-bl-none' 
                        : 'bg-brand-user-message text-white rounded-br-none'
                )}>
                    <p>{text}</p>
                </div>
            </div>
        </div>
    )
}
