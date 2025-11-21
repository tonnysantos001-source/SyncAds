import React from "react";

interface TypingIndicatorProps {
    status?: "thinking" | "searching" | "navigating" | "processing";
}

export function TypingIndicator({ status = "thinking" }: TypingIndicatorProps) {
    const messages = {
        thinking: "Pensando...",
        searching: "Pesquisando...",
        navigating: "Navegando...",
        processing: "Processando...",
    };

    return (
        <div className="flex items-center gap-2 p-4 bg-gray-800 rounded-lg max-w-[70%]">
            <div className="flex gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
            </div>
            <span className="text-sm text-gray-400">{messages[status]}</span>
        </div>
    );
}
