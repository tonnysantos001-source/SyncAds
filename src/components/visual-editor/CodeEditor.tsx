/**
 * CodeEditor Component - Monaco Editor Wrapper
 * Editor de código profissional usando Monaco (VS Code)
 */

import React from 'react';
import Editor, { OnMount } from '@monaco-editor/react';

export interface CodeEditorProps {
    value: string;
    onChange: (value: string | undefined) => void;
    language?: 'html' | 'css' | 'javascript' | 'typescript';
    readOnly?: boolean;
    height?: string;
}

export function CodeEditor({
    value,
    onChange,
    language = 'html',
    readOnly = false,
    height = '100%'
}: CodeEditorProps) {
    const handleEditorDidMount: OnMount = (editor, monaco) => {
        // Configure editor
        editor.updateOptions({
            fontSize: 14,
            minimap: { enabled: true },
            lineNumbers: 'on',
            automaticLayout: true,
            formatOnPaste: true,
            formatOnType: true,
            tabSize: 2,
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
        });

        // Add custom keybindings
        editor.addCommand(
            monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
            () => {
                // Trigger save (handled by parent)
                console.log('Save requested');
            }
        );

        // Register completion provider for Tailwind classes (future)
        // monaco.languages.registerCompletionItemProvider('html', {...});
    };

    return (
        <Editor
            height={height}
            defaultLanguage={language}
            language={language}
            value={value}
            onChange={onChange}
            theme="vs-dark"
            onMount={handleEditorDidMount}
            options={{
                readOnly,
                minimap: { enabled: !readOnly },
                scrollbar: {
                    vertical: 'auto',
                    horizontal: 'auto',
                    useShadows: true,
                    verticalHasArrows: false,
                    horizontalHasArrows: false,
                },
            }}
            loading={
                <div className="flex items-center justify-center h-full bg-gray-900">
                    <div className="text-white">Carregando editor...</div>
                </div>
            }
        />
    );
}
