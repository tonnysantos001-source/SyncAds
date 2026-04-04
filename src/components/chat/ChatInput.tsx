/**
 * ChatInput — Isolated input component to avoid re-rendering the message list.
 * By being a separate memo'd component, typing doesn't re-render parent.
 */
import React, { useRef, useCallback, memo } from 'react';
import Textarea from 'react-textarea-autosize';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  IconPhoto,
  IconFileZip,
  IconPaperclip,
  IconLoader2,
  IconSend,
} from '@tabler/icons-react';
import { useState } from 'react';
import { storageService } from '@/lib/storage';
import { useToast } from '@/components/ui/use-toast';

interface ChatInputProps {
  isAssistantTyping: boolean;
  onSend: (message: string) => void;
  onDetectContext?: (message: string) => void;
}

export const ChatInput = memo(function ChatInput({
  isAssistantTyping,
  onSend,
  onDetectContext,
}: ChatInputProps) {
  // Local state — completely isolated from message list
  const [input, setInput] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const detectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(isAssistantTyping);
  isTypingRef.current = isAssistantTyping;

  const handleSend = useCallback(() => {
    const text = textareaRef.current?.value || input;
    const trimmed = text.trim();
    if (!trimmed || isTypingRef.current) return;
    setInput('');
    onSend(trimmed);
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, [onSend, input]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);

    // Debounce context detection
    if (detectTimerRef.current) clearTimeout(detectTimerRef.current);
    if (val.trim() && onDetectContext) {
      detectTimerRef.current = setTimeout(() => onDetectContext(val), 800);
    }
  }, [onDetectContext]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleUpload = useCallback(async (file: File, type: 'image' | 'file') => {
    if (!file) return;

    const isImage = type === 'image';
    if (isImage) setIsUploadingImage(true);
    else setIsUploadingFile(true);

    try {
      const fileName = `${Date.now()}-${file.name}`;
      const path = `chat/${fileName}`;
      
      const result = await storageService.upload({
        file,
        path,
        bucket: 'chat-attachments',
      });

      if (result.success && result.data) {
        const url = result.data.publicUrl;
        let msgText = '';
        
        if (isImage) {
          msgText = `🖼️ **Imagem importada:** ${file.name}\n![Imagem do usuário](${url})`;
        } else {
          msgText = `📁 **Arquivo enviado para revisão:** ${file.name}\n[📎 Baixar arquivo](${url})`;
        }
        
        onSend(msgText);
        toast({
          title: "✅ Upload concluído",
          description: `O arquivo ${file.name} foi enviado com sucesso.`,
        });
      } else {
        throw new Error(result.error || 'Erro no upload');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "❌ Erro no upload",
        description: "Não foi possível enviar o arquivo. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      if (isImage) setIsUploadingImage(false);
      else setIsUploadingFile(false);
    }
  }, [onSend, toast]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file, 'image');
    if (e.target) e.target.value = ''; // Reset input
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file, 'file');
    if (e.target) e.target.value = ''; // Reset input
  };

  const hasInput = input.trim().length > 0;

  return (
    <div className="border-t border-white/10 bg-black/20 backdrop-blur-sm">
      <div className="px-4 py-4">
        <div className="relative">
          {/* File inputs discretos */}
          <input
            type="file"
            ref={imageInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleImageChange}
            disabled={isUploadingImage || isAssistantTyping}
          />
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".zip,.pdf,.doc,.docx,.txt,.js,.ts,.tsx,.html,.css"
            onChange={handleFileChange}
            disabled={isUploadingFile || isAssistantTyping}
          />

          <div className="relative flex items-end gap-3 p-3 bg-white/5 border border-white/10 rounded-xl transition-all duration-200 focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500/50">
            <div className="flex items-center gap-2 mb-0.5">
              {/* Import Image Button */}
              <motion.button
                onClick={() => imageInputRef.current?.click()}
                disabled={isUploadingImage || isAssistantTyping}
                className={cn(
                  "p-2 rounded-lg transition-all duration-200 flex-shrink-0 flex items-center justify-center min-w-[40px]",
                  isUploadingImage
                    ? "bg-blue-600/50 cursor-wait"
                    : "bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white"
                )}
                whileHover={!isUploadingImage && !isAssistantTyping ? { scale: 1.05 } : {}}
                whileTap={!isUploadingImage && !isAssistantTyping ? { scale: 0.95 } : {}}
                title="Importar Imagem"
              >
                {isUploadingImage ? (
                  <IconLoader2 className="w-5 h-5 animate-spin text-white" />
                ) : (
                  <IconPhoto className="w-5 h-5" />
                )}
              </motion.button>

              {/* Upload File Button */}
              <motion.button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingFile || isAssistantTyping}
                className={cn(
                  "p-2 rounded-lg transition-all duration-200 flex-shrink-0 flex items-center justify-center min-w-[40px]",
                  isUploadingFile
                    ? "bg-purple-600/50 cursor-wait"
                    : "bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white"
                )}
                whileHover={!isUploadingFile && !isAssistantTyping ? { scale: 1.05 } : {}}
                whileTap={!isUploadingFile && !isAssistantTyping ? { scale: 0.95 } : {}}
                title="Enviar Arquivos (ZIP/Docs)"
              >
                {isUploadingFile ? (
                  <IconLoader2 className="w-5 h-5 animate-spin text-white" />
                ) : (
                  <IconFileZip className="w-5 h-5" />
                )}
              </motion.button>
            </div>

            {/* Textarea — uncontrolled-style for max performance */}
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onPaste={(e) => {
                e.preventDefault();
                const pastedText = e.clipboardData.getData('text');
                if (!pastedText) return;
                const el = e.currentTarget;
                const start = el.selectionStart ?? input.length;
                const end = el.selectionEnd ?? input.length;
                const newVal = input.slice(0, start) + pastedText + input.slice(end);
                setInput(newVal);
                // Restore cursor after React re-renders
                requestAnimationFrame(() => {
                  if (textareaRef.current) {
                    const pos = start + pastedText.length;
                    textareaRef.current.selectionStart = pos;
                    textareaRef.current.selectionEnd = pos;
                  }
                });
              }}
              placeholder="Digite sua mensagem... (Enter para enviar)"
              minRows={1}
              maxRows={6}
              disabled={isAssistantTyping}
              className="flex-1 bg-transparent border-none text-white placeholder:text-gray-500 focus:outline-none resize-none py-2 max-h-40"
            />

            {/* Send Button */}
            <motion.button
              onClick={handleSend}
              disabled={!hasInput || isAssistantTyping}
              className={cn(
                'p-2 rounded-lg transition-all duration-200 flex-shrink-0',
                hasInput && !isAssistantTyping
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700'
                  : 'bg-white/5 text-gray-500 cursor-not-allowed'
              )}
              whileHover={hasInput && !isAssistantTyping ? { scale: 1.05 } : {}}
              whileTap={hasInput && !isAssistantTyping ? { scale: 0.95 } : {}}
            >
              {isAssistantTyping ? (
                <IconLoader2 className="w-5 h-5 animate-spin" />
              ) : (
                <IconSend className="w-5 h-5" />
              )}
            </motion.button>
          </div>
        </div>

        {/* Footer hints */}
        <div className="flex items-center justify-between mt-2 px-1">
          <div className="flex items-center gap-3">
            <p className="text-xs text-gray-500">
              <kbd className="px-1.5 py-0.5 text-xs bg-white/10 rounded">Enter</kbd> para enviar &nbsp;
              <kbd className="px-1.5 py-0.5 text-xs bg-white/10 rounded">Shift+Enter</kbd> nova linha
            </p>
            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-600">
              <IconPhoto className="w-3 h-3" />
              <IconFileZip className="w-3 h-3" />
              <span>Importe mídia ou arquivos para revisão</span>
            </div>
          </div>
          <p className="text-xs text-gray-500">{input.length} / 2000</p>
        </div>
      </div>
    </div>
  );
});
