import React, { useState } from "react";
import { ChevronRight, ChevronDown, Brain } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface PlanningBlockProps {
    content: string;
}

export const PlanningBlock: React.FC<PlanningBlockProps> = ({ content }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (!content) return null;

    // Estimate duration based on content length (rough heuristic: 20 chars/sec)
    // This is just for visual flair since we don't have the real duration from backend
    const estimatedSeconds = Math.max(1, Math.round(content.length / 20));

    return (
        <div className="my-2">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors select-none"
            >
                {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <span className="font-medium flex items-center gap-1">
                    <Brain className="h-3 w-3" />
                    Thought
                </span>
                <span className="text-xs opacity-60">for {estimatedSeconds}s</span>
            </button>

            {isOpen && (
                <div className="mt-2 pl-4 border-l-2 border-gray-200 dark:border-gray-700 ml-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-300">
                        <ReactMarkdown>{content}</ReactMarkdown>
                    </div>
                </div>
            )}
        </div>
    );
};
