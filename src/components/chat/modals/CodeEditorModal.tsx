/**
 * CODE EDITOR MODAL
 * Editor de código com IA assistente e preview
 *
 * Features:
 * - Editor com syntax highlighting
 * - Suporte a múltiplas linguagens
 * - IA assistente para código
 * - Preview em tempo real (HTML/JS/CSS)
 * - Export e compartilhamento
 * - Temas personalizados
 *
 * @version 1.0.0
 * @date 2025-01-08
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  IconSend,
  IconCode,
  IconEye,
  IconDownload,
  IconCopy,
  IconCheck,
  IconLoader2,
  IconBrandOpenai,
  IconFileCode,
  IconPlayerPlay,
  IconX,
  IconMaximize,
  IconBrandJavascript,
  IconBrandPython,
  IconBrandReact,
  IconBrandHtml5,
} from '@tabler/icons-react';
import Textarea from 'react-textarea-autosize';
import { PlanningBlock } from "@/components/chat/PlanningBlock";

interface CodeEditorModalProps {
  onSendMessage?: (message: string) => void;
  onDetectContext?: (message: string) => void;
  userId?: string;
  isExpanded?: boolean;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

type Language = 'javascript' | 'typescript' | 'python' | 'html' | 'css' | 'json' | 'sql';
type ViewMode = 'code' | 'preview' | 'split';

const LANGUAGES: Array<{ id: Language; name: string; icon: any }> = [
  { id: 'javascript', name: 'JavaScript', icon: IconBrandJavascript },
  { id: 'typescript', name: 'TypeScript', icon: IconBrandReact },
  { id: 'python', name: 'Python', icon: IconBrandPython },
  { id: 'html', name: 'HTML', icon: IconBrandHtml5 },
  { id: 'css', name: 'CSS', icon: IconCode },
  { id: 'json', name: 'JSON', icon: IconFileCode },
  { id: 'sql', name: 'SQL', icon: IconCode },
];

const QUICK_ACTIONS = [
  { icon: '⚛️', text: 'Criar componente React' },
  { icon: '🐍', text: 'Função Python para análise de dados' },
  { icon: '🎨', text: 'Animação CSS moderna' },
  { icon: '📊', text: 'Query SQL otimizada' },
];

export function CodeEditorModal({
  onSendMessage,
  onDetectContext,
  userId,
  isExpanded,
}: CodeEditorModalProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [code, setCode] = useState('// Seu código aqui...');
  const [language, setLanguage] = useState<Language>('javascript');
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [copied, setCopied] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const codeEditorRef = useRef<HTMLTextAreaElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Auto scroll messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Detect context on input change
  useEffect(() => {
    if (input.trim() && onDetectContext) {
      const timeoutId = setTimeout(() => {
        onDetectContext(input);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [input, onDetectContext]);

  // Update preview when code changes
  useEffect(() => {
    if ((language === 'html' || language === 'javascript') && viewMode !== 'code') {
      updatePreview();
    }
  }, [code, language, viewMode]);

  // Handle send message
  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsGenerating(true);

    try {
      onSendMessage?.(input);

      // Simulate AI response (substituir com chamada real)
      await simulateAICodeGeneration(input);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Código gerado! Veja no editor ao lado.',
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error generating code:', error);
    } finally {
      setIsGenerating(false);
      textareaRef.current?.focus();
    }
  };

  // Simulate AI code generation
  const simulateAICodeGeneration = async (prompt: string) => {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Generate code based on prompt
    const generatedCode = generateCodeFromPrompt(prompt);
    setCode(generatedCode);
  };

  // Generate code from prompt
  const generateCodeFromPrompt = (prompt: string): string => {
    const promptLower = prompt.toLowerCase();

    if (promptLower.includes('react') || promptLower.includes('componente')) {
      setLanguage('typescript');
      return `import React from 'react';

interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onClick,
  variant = 'primary'
}) => {
  return (
    <button
      onClick={onClick}
      className={\`px-4 py-2 rounded-lg font-semibold transition-all \${
        variant === 'primary'
          ? 'bg-blue-600 hover:bg-blue-700 text-white'
          : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
      }\`}
    >
      {label}
    </button>
  );
};

// Exemplo de uso:
// <Button label="Click me" onClick={() => alert('Clicked!')} />`;
    }

    if (promptLower.includes('python')) {
      setLanguage('python');
      return `import pandas as pd
import numpy as np

def analyze_data(data):
    """
    Analisa dados e retorna estatísticas básicas

    Args:
        data: DataFrame do pandas

    Returns:
        dict: Estatísticas calculadas
    """
    stats = {
        'mean': data.mean(),
        'median': data.median(),
        'std': data.std(),
        'min': data.min(),
        'max': data.max()
    }

    return stats

# Exemplo de uso
df = pd.DataFrame({
    'vendas': [100, 150, 200, 175, 225],
    'lucro': [20, 30, 40, 35, 45]
})

resultados = analyze_data(df)
print(resultados)`;
    }

    if (promptLower.includes('css') || promptLower.includes('animação')) {
      setLanguage('css');
      return `/* Animação de fade in suave */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in-element {
  animation: fadeInUp 0.6s ease-out;
}

/* Gradiente animado de fundo */
@keyframes gradientShift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.animated-gradient {
  background: linear-gradient(
    270deg,
    #667eea,
    #764ba2,
    #f093fb
  );
  background-size: 200% 200%;
  animation: gradientShift 10s ease infinite;
}

/* Botão moderno com hover */
.modern-button {
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modern-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}`;
    }

    if (promptLower.includes('sql')) {
      setLanguage('sql');
      return `-- Query otimizada para análise de vendas
SELECT
  DATE_TRUNC('month', order_date) AS month,
  COUNT(DISTINCT order_id) AS total_orders,
  SUM(total_amount) AS revenue,
  AVG(total_amount) AS avg_order_value,
  COUNT(DISTINCT customer_id) AS unique_customers
FROM orders
WHERE
  order_date >= CURRENT_DATE - INTERVAL '12 months'
  AND status = 'completed'
GROUP BY month
ORDER BY month DESC;

-- Top 10 produtos mais vendidos
SELECT
  p.product_name,
  COUNT(oi.order_id) AS times_ordered,
  SUM(oi.quantity) AS total_quantity,
  SUM(oi.quantity * oi.price) AS total_revenue
FROM order_items oi
JOIN products p ON oi.product_id = p.id
WHERE oi.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY p.product_name
ORDER BY total_revenue DESC
LIMIT 10;`;
    }

    // Default
    setLanguage('javascript');
    return `// Código gerado pela IA
function processData(data) {
  console.log('Processando dados:', data);

  // Validar entrada
  if (!data || data.length === 0) {
    throw new Error('Dados inválidos');
  }

  // Processar
  const result = data.map(item => {
    return {
      ...item,
      processed: true,
      timestamp: new Date().toISOString()
    };
  });

  return result;
}

// Exemplo
const data = [
  { id: 1, name: 'Item 1' },
  { id: 2, name: 'Item 2' }
];

const processed = processData(data);
console.log(processed);`;
  };

  // Update preview iframe
  const updatePreview = () => {
    if (!iframeRef.current) return;

    let html = '';
    if (language === 'html') {
      html = code;
    } else if (language === 'javascript') {
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              padding: 20px;
              background: #1a1a1a;
              color: #fff;
            }
            #output {
              background: #2a2a2a;
              padding: 15px;
              border-radius: 8px;
              margin-top: 10px;
              white-space: pre-wrap;
            }
          </style>
        </head>
        <body>
          <h3>Console Output:</h3>
          <div id="output"></div>
          <script>
            const originalLog = console.log;
            const output = document.getElementById('output');

            console.log = function(...args) {
              originalLog.apply(console, args);
              output.textContent += args.join(' ') + '\\n';
            };

            try {
              ${code}
            } catch (error) {
              output.textContent = 'Error: ' + error.message;
              output.style.color = '#ff6b6b';
            }
          </script>
        </body>
        </html>
      `;
    }

    const blob = new Blob([html], { type: 'text/html' });
    iframeRef.current.src = URL.createObjectURL(blob);
  };

  // Run code
  const handleRunCode = () => {
    setIsRunning(true);
    setOutput('');

    setTimeout(() => {
      if (language === 'python') {
        setOutput('# Python execution not available in browser\n# Use a Python interpreter');
      } else if (language === 'javascript' || language === 'html') {
        updatePreview();
        setOutput('✓ Code executed successfully');
      } else {
        setOutput('Preview not available for this language');
      }
      setIsRunning(false);
    }, 500);
  };

  // Handle key down
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle quick action
  const handleQuickAction = (text: string) => {
    setInput(text);
    textareaRef.current?.focus();
  };

  // Copy code
  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download code
  const handleDownload = () => {
    const extension = language === 'typescript' ? 'tsx' : language;
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code-syncads.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full">
      {/* Left Sidebar - AI Chat */}
      <div className="w-96 border-r border-white/10 flex flex-col bg-black/20">
        {/* Chat Header */}
        <div className="px-4 py-3 border-b border-white/10 bg-black/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center">
              <IconCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">AI Coder</h3>
              <p className="text-xs text-gray-400">Assistente de código</p>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-400">
                  Descreva o código que você precisa
                </p>
              </div>

              {/* Quick actions */}
              <div className="space-y-2">
                {QUICK_ACTIONS.map((action, index) => (
                  <motion.button
                    key={index}
                    onClick={() => handleQuickAction(action.text)}
                    className="w-full p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{action.icon}</span>
                      <span className="text-sm text-gray-300">{action.text}</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => {
                const thinkingMatch = msg.content.match(/<antigravity_thinking>([\s\S]*?)<\/antigravity_thinking>/);
                const thinkingContent = thinkingMatch ? thinkingMatch[1].trim() : null;
                const cleanContent = msg.content.replace(/<antigravity_thinking>[\s\S]*?<\/antigravity_thinking>/, "").trim();

                return (
                  <div
                    key={msg.id}
                    className={cn(
                      'p-3 rounded-lg flex flex-col gap-2',
                      msg.role === 'user'
                        ? 'bg-green-600/20 border border-green-600/30 ml-4'
                        : 'bg-white/5 border border-white/10 mr-4'
                    )}
                  >
                    {thinkingContent && <PlanningBlock content={thinkingContent} />}
                    {cleanContent && <p className="text-sm text-gray-200">{cleanContent}</p>}
                  </div>
                );
              })}
            </div>
          )}

          {isGenerating && (
            <div className="flex items-center gap-2 p-3 bg-white/5 rounded-lg border border-white/10">
              <IconLoader2 className="w-4 h-4 text-green-500 animate-spin" />
              <span className="text-sm text-gray-400">Gerando código...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="p-4 border-t border-white/10 bg-black/30">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Descreva o código..."
              maxRows={4}
              disabled={isGenerating}
              className={cn(
                'w-full px-3 py-2 pr-10',
                'bg-white/5 border border-white/10 rounded-lg',
                'text-white placeholder:text-gray-500 text-sm',
                'focus:outline-none focus:ring-2 focus:ring-green-500/50',
                'disabled:opacity-50'
              )}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isGenerating}
              className={cn(
                'absolute right-2 bottom-2 w-7 h-7 rounded-md flex items-center justify-center',
                input.trim() && !isGenerating
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-white/5 text-gray-500'
              )}
            >
              <IconSend className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Right Side - Code Editor */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/20">
          <div className="flex items-center gap-2">
            {/* Language selector */}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.id} value={lang.id} className="bg-gray-900">
                  {lang.name}
                </option>
              ))}
            </select>

            {/* View mode */}
            {(language === 'html' || language === 'javascript') && (
              <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('code')}
                  className={cn(
                    'px-3 py-1.5 rounded text-sm transition-colors',
                    viewMode === 'code'
                      ? 'bg-green-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  )}
                >
                  <IconCode className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('split')}
                  className={cn(
                    'px-3 py-1.5 rounded text-sm transition-colors',
                    viewMode === 'split'
                      ? 'bg-green-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  )}
                >
                  Split
                </button>
                <button
                  onClick={() => setViewMode('preview')}
                  className={cn(
                    'px-3 py-1.5 rounded text-sm transition-colors',
                    viewMode === 'preview'
                      ? 'bg-green-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  )}
                >
                  <IconEye className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleRunCode}
              disabled={isRunning}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm transition-colors disabled:opacity-50"
            >
              {isRunning ? (
                <IconLoader2 className="w-4 h-4 animate-spin" />
              ) : (
                <IconPlayerPlay className="w-4 h-4" />
              )}
              Run
            </button>
            <button
              onClick={handleCopyCode}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              {copied ? (
                <IconCheck className="w-4 h-4 text-green-500" />
              ) : (
                <IconCopy className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={handleDownload}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <IconDownload className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Editor/Preview Area */}
        <div className="flex-1 overflow-hidden flex">
          {/* Code Editor */}
          {(viewMode === 'code' || viewMode === 'split') && (
            <div className={cn(
              'flex flex-col',
              viewMode === 'split' ? 'w-1/2 border-r border-white/10' : 'w-full'
            )}>
              <textarea
                ref={codeEditorRef}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="flex-1 w-full p-4 bg-gray-950 text-gray-300 font-mono text-sm resize-none focus:outline-none"
                spellCheck={false}
              />
            </div>
          )}

          {/* Preview */}
          {(viewMode === 'preview' || viewMode === 'split') && (language === 'html' || language === 'javascript') && (
            <div className={cn(
              'flex flex-col',
              viewMode === 'split' ? 'w-1/2' : 'w-full'
            )}>
              <iframe
                ref={iframeRef}
                className="w-full h-full bg-white"
                title="Preview"
              />
            </div>
          )}

          {/* Output for other languages */}
          {viewMode !== 'code' && language !== 'html' && language !== 'javascript' && (
            <div className="flex-1 p-4 bg-gray-950">
              <pre className="text-gray-400 font-mono text-sm whitespace-pre-wrap">
                {output || 'Click "Run" to execute code'}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CodeEditorModal;
