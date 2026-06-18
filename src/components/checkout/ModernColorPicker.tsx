import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Check, Pipette, RotateCcw } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface ModernColorPickerProps {
  label?: string;
  value: string;
  onChange: (color: string) => void;
  showPresets?: boolean;
  className?: string;
}

// 23 presets de cores de alta conversão + 1 espaço para a pipeta personalizada
const COMPACT_PRESETS = [
  "#FFFFFF", "#E5E7EB", "#9CA3AF", "#4B5563", "#1F2937", "#000000",
  "#EF4444", "#F97316", "#F59E0B", "#EAB308", "#84CC16", "#22C55E",
  "#10B981", "#06B6D4", "#0EA5E9", "#3B82F6", "#6366F1", "#8B5CF6",
  "#7C3AED", "#A855F7", "#EC4899", "#F43F5E", "#E91E8C"
];

export const ModernColorPicker: React.FC<ModernColorPickerProps> = ({
  label,
  value,
  onChange,
  className,
}) => {
  const [open, setOpen] = useState(false);
  const [hexInput, setHexInput] = useState(value);
  const colorInputRef = useRef<HTMLInputElement>(null);
  
  // Controle de estado para preview temporário (hover) e confirmação
  const originalColorRef = useRef(value);
  const hasConfirmedRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const safeValue = (value && typeof value === 'string' && value.startsWith('#')) ? value : '#000000';

  // Sincronizar input de texto com o valor real
  useEffect(() => {
    setHexInput(safeValue);
  }, [safeValue]);

  // Limpar timeout no desmonte
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      originalColorRef.current = safeValue;
      hasConfirmedRef.current = false;
    } else {
      // Se fechar e não tiver confirmado, restaura a cor original
      if (!hasConfirmedRef.current) {
        onChange(originalColorRef.current);
      }
    }
    setOpen(isOpen);
  };

  const handleColorHover = (color: string) => {
    onChange(color.toUpperCase());
  };

  const handleColorSelect = (color: string, confirm = false) => {
    const upperColor = color.toUpperCase();
    onChange(upperColor);
    setHexInput(upperColor);
    
    if (confirm) {
      hasConfirmedRef.current = true;
      setOpen(false);
    }
  };

  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value;
    if (!input.startsWith("#") && input.length > 0) {
      input = "#" + input;
    }
    setHexInput(input);

    // Se for um hex válido (3 ou 6 dígitos + #), atualiza e confirma temporariamente
    const hexRegex = /^#([0-9A-F]{3}){1,2}$/i;
    if (hexRegex.test(input)) {
      onChange(input.toUpperCase());
      hasConfirmedRef.current = true; // Permite confirmar ao digitar hex válido e clicar fora
    }
  };

  // Funções de Hover para abrir/fechar com delay suave
  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!open) {
      originalColorRef.current = safeValue;
      hasConfirmedRef.current = false;
      setOpen(true);
    }
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setOpen(false);
    }, 200); // 200ms de delay para transição suave do mouse
  };

  return (
    <div 
      className={cn("space-y-1.5", className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {label && (
        <Label className="text-[11px] font-semibold text-gray-300">
          {label}
        </Label>
      )}

      <div className="relative">
        {/* Seletor nativo oculto para Pipeta/Custom Color */}
        <input
          ref={colorInputRef}
          type="color"
          value={safeValue}
          onChange={(e) => handleColorSelect(e.target.value, true)}
          className="sr-only"
        />

        <Popover open={open} onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              type="button"
              className="w-full justify-start gap-1.5 h-8 px-2 bg-[#111827] border-white/5 hover:border-pink-500/20 hover:bg-[#111827]/90 text-white transition-all duration-200 group"
              onClick={() => setOpen(!open)}
            >
              <div
                className="w-4 h-4 rounded border border-white/10 shadow-sm transition-transform group-hover:scale-105 flex-shrink-0"
                style={{ backgroundColor: safeValue }}
              />
              <span className="text-[10px] font-mono font-bold flex-1 text-left text-gray-250 group-hover:text-white truncate">
                {safeValue.toUpperCase()}
              </span>
              <Pipette className="h-3 w-3 text-gray-400 group-hover:text-pink-400 transition-colors flex-shrink-0" />
            </Button>
          </PopoverTrigger>

          <PopoverContent
            className="w-[184px] p-2 border border-white/10 shadow-xl rounded-lg bg-[#0b0f19] select-none"
            align="start"
            sideOffset={4}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className="space-y-2">
              {/* Grade de cores compacta (6 colunas) */}
              <div className="grid grid-cols-6 gap-1">
                {COMPACT_PRESETS.map((color) => {
                  const isSelected = safeValue.toUpperCase() === color.toUpperCase();
                  return (
                    <button
                      key={color}
                      type="button"
                      onMouseEnter={() => handleColorHover(color)}
                      onClick={() => handleColorSelect(color, true)}
                      className={cn(
                        "w-6 h-6 rounded-full border border-white/5 transition-transform hover:scale-115 active:scale-95 flex items-center justify-center relative flex-shrink-0 cursor-pointer shadow-sm"
                      )}
                      style={{ backgroundColor: color }}
                      title={color}
                    >
                      {isSelected && (
                        <Check className="h-3 w-3 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" strokeWidth={3} />
                      )}
                    </button>
                  );
                })}

                {/* 24º item: Botão Arco-íris / Pipeta Personalizada */}
                <button
                  type="button"
                  onClick={() => {
                    hasConfirmedRef.current = true;
                    colorInputRef.current?.click();
                  }}
                  className="w-6 h-6 rounded-full border border-white/10 hover:scale-115 active:scale-95 flex items-center justify-center relative flex-shrink-0 cursor-pointer bg-gradient-to-tr from-red-500 via-green-500 via-blue-500 to-yellow-400 shadow-md group/picker"
                  title="Cor personalizada (conta-gotas)"
                >
                  <Pipette className="h-3 w-3 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] group-hover/picker:animate-pulse" strokeWidth={2.5} />
                </button>
              </div>

              {/* Input Hex Manual & Restaurar */}
              <div className="flex items-center gap-1 pt-1 border-t border-white/5">
                <div className="relative flex-1">
                  <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[9px] font-mono text-gray-500">
                    #
                  </span>
                  <input
                    type="text"
                    value={hexInput.replace("#", "")}
                    onChange={handleHexInputChange}
                    className="w-full pl-3.5 pr-1 py-0.5 h-5.5 rounded bg-[#111827] border border-white/5 text-[9px] font-mono font-bold text-white outline-none focus:border-pink-500/50 uppercase placeholder:text-gray-600"
                    placeholder="000000"
                  />
                </div>

                {/* Reset para Cor Inicial */}
                <button
                  type="button"
                  onClick={() => handleColorSelect(originalColorRef.current, false)}
                  className="p-1 h-5.5 rounded border border-white/5 bg-[#111827] text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                  title="Desfazer alterações"
                >
                  <RotateCcw className="h-3 w-3" />
                </button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};
