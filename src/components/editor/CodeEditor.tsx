/**
 * CODE EDITOR
 *
 * Editor de código profissional com Monaco Editor (VS Code no browser)
 *
 * Features:
 * - Monaco Editor integrado
 * - Syntax highlighting
 * - IntelliSense / Autocomplete
 * - Error detection
 * - Multi-file support
 * - Tema dark customizado
 * - Line numbers
 * - Minimap
 * - Format document
 *
 * @version 1.0.0
 * @date 2025-01-08
 */

import React, { useRef, useState, useEffect } from 'react';
import Editor, { Monaco, OnMount } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import { cn } from '@/lib/utils';
import {
  IconCode,
  IconFileCode,
  IconDeviceFloppy,
  IconWand,
  IconZoomIn,
  IconZoomOut,
  IconMaximize,
  IconMinimize,
  IconCopy,
  IconCheck,
} from '@tabler/icons-react';

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: string;
  theme?: 'vs-dark' | 'light' | 'syncads-dark';
  height?: string | number;
  readOnly?: boolean;
  minimap?: boolean;
  lineNumbers?: boolean;
  wordWrap?: boolean;
  fontSize?: number;
  tabSize?: number;
  className?: string;
  onSave?: (value: string) => void;
  onFormat?: () => void;
}

export function CodeEditor({
  value,
  onChange,
  language = 'html',
  theme = 'syncads-dark',
  height = '100%',
  readOnly = false,
  minimap = true,
  lineNumbers = true,
  wordWrap = true,
  fontSize = 14,
  tabSize = 2,
  className,
  onSave,
  onFormat,
}: CodeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(100);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (editorRef.current) {
        editorRef.current.dispose();
      }
    };
  }, []);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Define custom theme
    monaco.editor.defineTheme('syncads-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955' },
        { token: 'keyword', foreground: 'C586C0' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'regexp', foreground: 'D16969' },
        { token: 'type', foreground: '4EC9B0' },
        { token: 'class', foreground: '4EC9B0' },
        { token: 'function', foreground: 'DCDCAA' },
        { token: 'variable', foreground: '9CDCFE' },
        { token: 'constant', foreground: '4FC1FF' },
      ],
      colors: {
        'editor.background': '#0a0a0a',
        'editor.foreground': '#D4D4D4',
        'editor.lineHighlightBackground': '#1a1a1a',
        'editor.selectionBackground': '#264F78',
        'editor.inactiveSelectionBackground': '#3A3D41',
        'editorCursor.foreground': '#AEAFAD',
        'editorWhitespace.foreground': '#404040',
        'editorLineNumber.foreground': '#858585',
        'editorLineNumber.activeForeground': '#C6C6C6',
      },
    });

    // Set custom theme
    monaco.editor.setTheme('syncads-dark');

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (onSave) {
        const value = editor.getValue();
        onSave(value);
      }
    });

    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF,
      () => {
        editor.getAction('editor.action.formatDocument')?.run();
        if (onFormat) {
          onFormat();
        }
      }
    );

    // Focus editor
    editor.focus();
  };

  const handleEditorChange = (value: string | undefined) => {
    if (onChange && value !== undefined) {
      onChange(value);
    }
  };

  const handleFormat = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument')?.run();
    }
    if (onFormat) {
      onFormat();
    }
  };

  const handleCopy = async () => {
    if (editorRef.current) {
      const value = editorRef.current.getValue();
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(currentZoom + 10, 200);
    setCurrentZoom(newZoom);
    if (editorRef.current) {
      editorRef.current.updateOptions({
        fontSize: (fontSize * newZoom) / 100,
      });
    }
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(currentZoom - 10, 50);
    setCurrentZoom(newZoom);
    if (editorRef.current) {
      editorRef.current.updateOptions({
        fontSize: (fontSize * newZoom) / 100,
      });
    }
  };

  const handleSaveClick = () => {
    if (onSave && editorRef.current) {
      const value = editorRef.current.getValue();
      onSave(value);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div
      className={cn(
        'relative flex flex-col bg-[#0a0a0a] rounded-lg overflow-hidden border border-white/10',
        isFullscreen && 'fixed inset-0 z-50 rounded-none',
        className
      )}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#0f0f0f] border-b border-white/10">
        <div className="flex items-center gap-2">
          <IconFileCode className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-400 uppercase font-mono">
            {language}
          </span>
          <span className="text-xs text-gray-600 ml-2">
            Zoom: {currentZoom}%
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Zoom controls */}
          <button
            onClick={handleZoomOut}
            className="p-1.5 hover:bg-white/5 rounded transition-colors"
            title="Zoom Out"
          >
            <IconZoomOut className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={handleZoomIn}
            className="p-1.5 hover:bg-white/5 rounded transition-colors"
            title="Zoom In"
          >
            <IconZoomIn className="w-4 h-4 text-gray-400" />
          </button>

          <div className="w-px h-4 bg-white/10 mx-1" />

          {/* Format */}
          <button
            onClick={handleFormat}
            className="p-1.5 hover:bg-white/5 rounded transition-colors"
            title="Format Document (Ctrl+Shift+F)"
          >
            <IconWand className="w-4 h-4 text-gray-400" />
          </button>

          {/* Copy */}
          <button
            onClick={handleCopy}
            className="p-1.5 hover:bg-white/5 rounded transition-colors"
            title="Copy Code"
          >
            {copied ? (
              <IconCheck className="w-4 h-4 text-green-400" />
            ) : (
              <IconCopy className="w-4 h-4 text-gray-400" />
            )}
          </button>

          {/* Save */}
          {onSave && (
            <button
              onClick={handleSaveClick}
              className="p-1.5 hover:bg-white/5 rounded transition-colors"
              title="Save (Ctrl+S)"
            >
              <IconDeviceFloppy className="w-4 h-4 text-gray-400" />
            </button>
          )}

          <div className="w-px h-4 bg-white/10 mx-1" />

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 hover:bg-white/5 rounded transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? (
              <IconMinimize className="w-4 h-4 text-gray-400" />
            ) : (
              <IconMaximize className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <Editor
          height={height}
          defaultLanguage={language}
          language={language}
          value={value}
          theme={theme}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{
            readOnly,
            minimap: {
              enabled: minimap,
            },
            lineNumbers: lineNumbers ? 'on' : 'off',
            wordWrap: wordWrap ? 'on' : 'off',
            fontSize,
            tabSize,
            automaticLayout: true,
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            fontFamily: "'Fira Code', 'Consolas', 'Monaco', monospace",
            fontLigatures: true,
            formatOnPaste: true,
            formatOnType: true,
            autoIndent: 'full',
            quickSuggestions: {
              other: true,
              comments: false,
              strings: false,
            },
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnCommitCharacter: true,
            acceptSuggestionOnEnter: 'on',
            snippetSuggestions: 'top',
            bracketPairColorization: {
              enabled: true,
            },
            guides: {
              bracketPairs: true,
              indentation: true,
            },
            renderWhitespace: 'selection',
            renderLineHighlight: 'all',
            padding: {
              top: 16,
              bottom: 16,
            },
          }}
        />
      </div>
    </div>
  );
}

export default CodeEditor;
