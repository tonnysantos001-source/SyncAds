/**
 * VisualEditorPro - Main Component
 * Construtor de sites profissional completo
 * 
 * Features:
 * - Monaco Editor com tabs HTML/CSS/JS
 * - Component Palette com drag & drop
 * - AI Assistant com ferramentas
 * - Live Preview responsivo
 * - Design Tools
 * - Export options
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
    IconCode,
    IconEye,
    IconDeviceMobile,
    IconDeviceDesktop,
    IconDeviceTablet,
    IconDownload,
    IconRocket,
    IconRotate,
    IconCheck,
    IconX,
    IconPlus,
    IconSend,
    IconLoader2,
} from '@tabler/icons-react';
import Textarea from 'react-textarea-autosize';
import { toast } from 'sonner';

// Components
import { CodeEditor } from './CodeEditor';
import { ComponentPalette } from './ComponentPalette';
import { DesignTools } from './DesignTools';
import { PageManager } from './PageManager';

// Lib
import { Component } from '@/lib/visual-editor/components';
import {
    ADVANCED_SYSTEM_PROMPT,
    parseAITools,
    executeAITools
} from '@/lib/visual-editor/ai-tools';
import { useChatStream } from '@/hooks/useChatStream';
import { useModalError } from '@/hooks/useModalError';
import { usePages } from '@/hooks/usePages';

interface VisualEditorProProps {
    onSendMessage?: (message: string) => void;
    onDetectContext?: (message: string) => void;
    userId?: string;
    isExpanded?: boolean;
}

type ViewMode = 'code' | 'preview' | 'split';
type DeviceMode = 'desktop' | 'tablet' | 'mobile';
type CodeTab = 'html' | 'css' | 'js';

export function VisualEditorPro({
    onSendMessage,
    onDetectContext,
    userId,
    isExpanded,
}: VisualEditorProProps) {
    // Multi-page management
    const {
        pages,
        currentPage,
        addPage,
        deletePage,
        updatePage,
        setCurrentPage,
        setHomePage,
        duplicatePage,
        renamePage,
    } = usePages();

    // State
    const [viewMode, setViewMode] = useState<ViewMode>('split');
    const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
    const [activeTab, setActiveTab] = useState<CodeTab>('html');

    // Code states (synced with current page)
    const [htmlCode, setHtmlCode] = useState(currentPage?.htmlCode || getDefaultHTML());
    const [cssCode, setCssCode] = useState(currentPage?.cssCode || '');
    const [jsCode, setJsCode] = useState(currentPage?.jsCode || '');

    // UI state
    const [showComponentPalette, setShowComponentPalette] = useState(false);
    const [showPageManager, setShowPageManager] = useState(true);
    const [showDesignTools, setShowDesignTools] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);

    // Refs
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Hooks
    const { sendMessage, isStreaming } = useChatStream();
    const { handleError } = useModalError();

    // Sync code with current page
    useEffect(() => {
        if (currentPage) {
            setHtmlCode(currentPage.htmlCode);
            setCssCode(currentPage.cssCode);
            setJsCode(currentPage.jsCode);
        }
    }, [currentPage?.id]);

    // Save code to current page when it changes
    useEffect(() => {
        if (currentPage) {
            const timeoutId = setTimeout(() => {
                updatePage(currentPage.id, {
                    htmlCode,
                    cssCode,
                    jsCode,
                });
            }, 500); // Debounce 500ms

            return () => clearTimeout(timeoutId);
        }
    }, [htmlCode, cssCode, jsCode, currentPage?.id, updatePage]);

    // Combine code for preview
    const fullCode = React.useMemo(() => {
        const trimmedHtml = htmlCode.trim();
        // If it's a full document, inject CSS/JS if they exist, otherwise just return it
        if (trimmedHtml.startsWith('<!DOCTYPE') || trimmedHtml.startsWith('<html')) {
            let code = trimmedHtml;
            if (cssCode.trim()) {
                code = code.replace('</head>', `<style>${cssCode}</style>\n</head>`);
            }
            if (jsCode.trim()) {
                code = code.replace('</body>', `<script>${jsCode}</script>\n</body>`);
            }
            return code;
        }
        // Fallback for partial code
        return `${htmlCode}\n<style>\n${cssCode}\n</style>\n<script>\n${jsCode}\n</script>`;
    }, [htmlCode, cssCode, jsCode]);

    // Update preview
    useEffect(() => {
        if (iframeRef.current) {
            const iframe = iframeRef.current;
            const doc = iframe.contentDocument || iframe.contentWindow?.document;
            if (doc) {
                doc.open();
                doc.write(fullCode);
                doc.close();
            }
        }
    }, [fullCode]);

    // Handle AI message
    const handleAIGenerate = async () => {
        if (!input.trim() || isStreaming) return;

        const prompt = input.trim();
        setInput('');

        // Add user message
        setMessages(prev => [...prev, { role: 'user', content: prompt }]);

        try {
            // Call AI with advanced system prompt
            const response = await sendMessage(prompt, {
                context: 'visual-editor',
                systemPrompt: ADVANCED_SYSTEM_PROMPT,
                model: 'claude',
            });

            // Parse and execute tools
            const { updatedCode, messages: toolMessages } = await executeAITools(response, htmlCode);

            if (updatedCode !== htmlCode) {
                setHtmlCode(updatedCode);
                toast.success('Código atualizado pela IA!');
            }

            // Add assistant message
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: toolMessages.length > 0 ? toolMessages.join('\n') : 'Código gerado com sucesso!'
            }]);

        } catch (error) {
            handleError(error, {
                context: 'Visual Editor AI',
                userMessage: 'Erro ao gerar código'
            });
        }
    };

    // Handle component insert
    // Handle component insert via AI
    const handleComponentSelect = async (component: Component) => {
        const prompt = `Adicione o componente "${component.name}" (${component.description}) à página. 
        Mantenha o estilo visual existente e integre-o ao componente App principal.`;

        // Update UI to show what's happening
        setMessages(prev => [...prev, { role: 'user', content: prompt }]);

        try {
            const response = await sendMessage(prompt, {
                context: 'visual-editor',
                systemPrompt: ADVANCED_SYSTEM_PROMPT,
                model: 'claude',
            });

            const { updatedCode, messages: toolMessages } = await executeAITools(response, htmlCode);

            if (updatedCode !== htmlCode) {
                setHtmlCode(updatedCode);
                toast.success(`${component.name} adicionado via IA!`);
            }

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: toolMessages.length > 0 ? toolMessages.join('\n') : 'Código atualizado!'
            }]);

        } catch (error) {
            handleError(error, {
                context: 'Visual Editor Component Add',
                userMessage: 'Erro ao adicionar componente'
            });
        }
    };

    // Handle download
    const handleDownload = () => {
        const blob = new Blob([fullCode], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'my-website.html';
        a.click();
        URL.revokeObjectURL(url);

        toast.success('Download iniciado!');
    };

    // Device dimensions
    const deviceDimensions = {
        desktop: { width: '100%', height: '100%' },
        tablet: { width: '768px', height: '1024px' },
        mobile: { width: '375px', height: '667px' },
    };

    return (
        <div className="flex h-full bg-gray-950">
            {/* Left Sidebar - Page Manager */}
            {showPageManager && (
                <div className="w-80 border-r border-white/10">
                    <PageManager
                        pages={pages}
                        currentPageId={currentPage?.id || ''}
                        onPageSelect={setCurrentPage}
                        onPageAdd={addPage}
                        onPageDelete={deletePage}
                        onPageDuplicate={duplicatePage}
                        onPageRename={renamePage}
                        onSetHome={setHomePage}
                    />
                </div>
            )}

            {/* Left Sidebar - Component Palette */}
            {showComponentPalette && (
                <div className="w-80 border-r border-white/10">
                    <ComponentPalette onComponentSelect={handleComponentSelect} />
                </div>
            )}

            {/* Main Area */}
            <div className="flex-1 flex flex-col">
                {/* Top Toolbar */}
                <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-white/10 bg-gray-900">
                    {/* Left Controls */}
                    <div className="flex items-center gap-2">
                        {/* View Mode */}
                        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('code')}
                                className={cn(
                                    'px-3 py-1.5 rounded text-sm transition-colors',
                                    viewMode === 'code'
                                        ? 'bg-blue-600 text-white'
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
                                        ? 'bg-blue-600 text-white'
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
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-400 hover:text-white'
                                )}
                            >
                                <IconEye className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Device Mode */}
                        {(viewMode === 'preview' || viewMode === 'split') && (
                            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
                                <button
                                    onClick={() => setDeviceMode('desktop')}
                                    className={cn(
                                        'p-1.5 rounded transition-colors',
                                        deviceMode === 'desktop'
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-400 hover:text-white'
                                    )}
                                >
                                    <IconDeviceDesktop className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setDeviceMode('tablet')}
                                    className={cn(
                                        'p-1.5 rounded transition-colors',
                                        deviceMode === 'tablet'
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-400 hover:text-white'
                                    )}
                                >
                                    <IconDeviceTablet className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setDeviceMode('mobile')}
                                    className={cn(
                                        'p-1.5 rounded transition-colors',
                                        deviceMode === 'mobile'
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-400 hover:text-white'
                                    )}
                                >
                                    <IconDeviceMobile className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowPageManager(!showPageManager)}
                            className={cn(
                                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                                showPageManager
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            )}
                        >
                            Páginas ({pages.length})
                        </button>
                        <button
                            onClick={() => setShowComponentPalette(!showComponentPalette)}
                            className={cn(
                                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                                showComponentPalette
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            )}
                        >
                            Componentes
                        </button>

                        <button
                            onClick={() => setShowDesignTools(!showDesignTools)}
                            className={cn(
                                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                                showDesignTools
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            )}
                        >
                            Design
                        </button>

                        <button
                            onClick={handleDownload}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition-colors flex items-center gap-2"
                        >
                            <IconDownload className="w-4 h-4" />
                            Download
                        </button>

                        <button
                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                        >
                            <IconRocket className="w-4 h-4" />
                            Deploy
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Code Editor */}
                    {(viewMode === 'code' || viewMode === 'split') && (
                        <div className={cn(
                            'flex flex-col border-r border-white/10',
                            viewMode === 'split' ? 'w-1/2' : 'flex-1'
                        )}>
                            {/* Tabs */}
                            <div className="flex items-center gap-1 px-4 py-2 border-b border-white/10 bg-gray-900">
                                {(['html', 'css', 'js'] as const).map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={cn(
                                            'px-4 py-2 rounded text-sm font-medium transition-colors',
                                            activeTab === tab
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                        )}
                                    >
                                        {tab.toUpperCase()}
                                    </button>
                                ))}
                            </div>

                            {/* Editor */}
                            <div className="flex-1">
                                {activeTab === 'html' && (
                                    <CodeEditor
                                        value={htmlCode}
                                        onChange={(value) => setHtmlCode(value || '')}
                                        language="html"
                                    />
                                )}
                                {activeTab === 'css' && (
                                    <CodeEditor
                                        value={cssCode}
                                        onChange={(value) => setCssCode(value || '')}
                                        language="css"
                                    />
                                )}
                                {activeTab === 'js' && (
                                    <CodeEditor
                                        value={jsCode}
                                        onChange={(value) => setJsCode(value || '')}
                                        language="javascript"
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    {/* Preview */}
                    {(viewMode === 'preview' || viewMode === 'split') && (
                        <div className={cn(
                            'flex items-center justify-center p-8 bg-gray-900',
                            viewMode === 'split' ? 'w-1/2' : 'flex-1'
                        )}>
                            <div
                                className="bg-white rounded-lg shadow-2xl overflow-hidden transition-all h-full"
                                style={deviceDimensions[deviceMode]}
                            >
                                <iframe
                                    ref={iframeRef}
                                    className="w-full h-full border-0"
                                    title="Preview"
                                    sandbox="allow-scripts"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* AI Assistant Footer */}
                <div className="p-4 border-t border-white/10 bg-gray-900">
                    <div className="flex gap-3">
                        <Textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.ctrlKey) {
                                    e.preventDefault();
                                    handleAIGenerate();
                                }
                            }}
                            placeholder="Peça para a IA gerar ou modificar código... (Ctrl+Enter)"
                            maxRows={3}
                            disabled={isStreaming}
                            className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                        />
                        <button
                            onClick={handleAIGenerate}
                            disabled={!input.trim() || isStreaming}
                            className={cn(
                                'px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-all',
                                input.trim() && !isStreaming
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-white/5 text-gray-500 cursor-not-allowed'
                            )}
                        >
                            {isStreaming ? (
                                <>
                                    <IconLoader2 className="w-5 h-5 animate-spin" />
                                    Gerando...
                                </>
                            ) : (
                                <>
                                    <IconSend className="w-5 h-5" />
                                    Enviar
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Right Sidebar - Design Tools */}
            {showDesignTools && (
                <div className="w-80 border-l border-white/10">
                    <DesignTools />
                </div>
            )}
        </div>
    );
}

// Default HTML template
// Default HTML template (React + Tailwind + Framer Motion)
function getDefaultHTML() {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Novo Projeto</title>
  
  <!-- Core Libraries -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <script src="https://unpkg.com/framer-motion@10.16.4/dist/framer-motion.js"></script>
</head>
<body class="bg-gray-950 text-white antialiased">
  <div id="root"></div>

  <script type="text/babel">
    const { useState, useEffect } = React;
    const { motion } = window.Motion;

    // Wrapper para Ícones Lucide
    const Icon = ({ name, className }) => {
      useEffect(() => { lucide.createIcons(); }, [name]);
      return <i data-lucide={name} className={className}></i>;
    };

    function App() {
      useEffect(() => { lucide.createIcons(); }, []);

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6 max-w-2xl bg-white/5 backdrop-blur-lg border border-white/10 p-12 rounded-3xl shadow-2xl"
          >
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Icon name="rocket" className="text-white w-8 h-8" />
              </div>
            </div>
            
            <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              Construtor Web Pro
            </h1>
            
            <p className="text-lg text-gray-400 leading-relaxed">
              Seu ambiente de desenvolvimento profissional está pronto.
              Peça para a IA criar landing pages, dashboards ou componentes complexos.
            </p>

            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                <Icon name="layout" className="w-6 h-6 text-blue-400 mb-2 mx-auto" />
                <span className="text-sm font-medium">React + Tailwind</span>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                <Icon name="zap" className="w-6 h-6 text-purple-400 mb-2 mx-auto" />
                <span className="text-sm font-medium">Animações</span>
              </div>
            </div>
          </motion.div>
        </div>
      );
    }

    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<App />);
  </script>
</body>
</html>`;
}

export default VisualEditorPro;

