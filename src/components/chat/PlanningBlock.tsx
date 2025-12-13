import React, { useState } from "react";
import { ChevronDown, ChevronRight, BrainCircuit, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface PlanningBlockProps {
    content: string;
}

export const PlanningBlock: React.FC<PlanningBlockProps> = ({ content }) => {
    const [isOpen, setIsOpen] = useState(true);

    if (!content) return null;

    return (
        <div className="mb-4 border border-indigo-100 dark:border-indigo-900 rounded-lg overflow-hidden bg-indigo-50/50 dark:bg-indigo-950/30">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-900/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/70 transition-colors text-left"
            >
                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                    <BrainCircuit className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">
                        Planejamento & Raciocínio
                    </span>
                </div>
                {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-indigo-400" />
                ) : (
                    <ChevronRight className="h-4 w-4 text-indigo-400" />
                )}
            </button>

            {isOpen && (
                <div className="p-3 text-sm text-indigo-900 dark:text-indigo-100 border-t border-indigo-100 dark:border-indigo-900/50 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="prose prose-sm prose-indigo dark:prose-invert max-w-none">
                        <ReactMarkdown>{content}</ReactMarkdown>
                    </div>
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-indigo-500/70 dark:text-indigo-400/50 font-medium">
                        <Sparkles className="h-3 w-3" />
                        <span>Análise completada pela IA</span>
                    </div>
                </div>
            )}
        </div>
    );
};
