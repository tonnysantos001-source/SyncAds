import React, { useState } from "react";
import { HexColorPicker, HexColorInput } from "react-colorful";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Check, Pipette } from "lucide-react";
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

// Paletas modernas 2025 - Cores vibrantes e profissionais
const MODERN_COLOR_PRESETS = {
  vibrant: {
    name: "Vibrante",
    colors: [
      "#8b5cf6", // Violet
      "#a855f7", // Purple
      "#ec4899", // Pink
      "#f43f5e", // Rose
      "#ef4444", // Red
      "#f97316", // Orange
      "#f59e0b", // Amber
      "#eab308", // Yellow
    ],
  },
  professional: {
    name: "Profissional",
    colors: [
      "#0ea5e9", // Sky
      "#06b6d4", // Cyan
      "#14b8a6", // Teal
      "#10b981", // Emerald
      "#22c55e", // Green
      "#84cc16", // Lime
      "#6366f1", // Indigo
      "#8b5cf6", // Violet
    ],
  },
  warm: {
    name: "Tons Quentes",
    colors: [
      "#fef3c7", // Amber 100
      "#fde68a", // Amber 200
      "#fcd34d", // Amber 300
      "#fbbf24", // Amber 400
      "#f59e0b", // Amber 500
      "#d97706", // Amber 600
      "#b45309", // Amber 700
      "#92400e", // Amber 800
    ],
  },
  cool: {
    name: "Tons Frios",
    colors: [
      "#dbeafe", // Blue 100
      "#bfdbfe", // Blue 200
      "#93c5fd", // Blue 300
      "#60a5fa", // Blue 400
      "#3b82f6", // Blue 500
      "#2563eb", // Blue 600
      "#1d4ed8", // Blue 700
      "#1e40af", // Blue 800
    ],
  },
  grayscale: {
    name: "Escala de Cinza",
    colors: [
      "#ffffff", // White
      "#f9fafb", // Gray 50
      "#f3f4f6", // Gray 100
      "#e5e7eb", // Gray 200
      "#d1d5db", // Gray 300
      "#9ca3af", // Gray 400
      "#6b7280", // Gray 500
      "#4b5563", // Gray 600
      "#374151", // Gray 700
      "#1f2937", // Gray 800
      "#111827", // Gray 900
      "#000000", // Black
    ],
  },
};

interface ColorSwatchProps {
  color: string;
  isSelected: boolean;
  onClick: () => void;
  showTooltip?: boolean;
}

const ColorSwatch: React.FC<ColorSwatchProps> = ({
  color,
  isSelected,
  onClick,
  showTooltip = true,
}) => {
  const [showHex, setShowHex] = useState(false);

  return (
    <div className="relative">
      <motion.button
        type="button"
        whileHover={{ scale: 1.15, zIndex: 10 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        onMouseEnter={() => setShowHex(true)}
        onMouseLeave={() => setShowHex(false)}
        className={cn(
          "relative w-10 h-10 rounded-lg shadow-md transition-all cursor-pointer overflow-hidden",
          isSelected
            ? "ring-2 ring-violet-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-900"
            : "hover:shadow-lg",
        )}
        style={{ backgroundColor: color }}
      >
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-black/20"
          >
            <Check
              className="h-5 w-5 text-white drop-shadow-lg"
              strokeWidth={3}
            />
          </motion.div>
        )}
      </motion.button>

      {/* Tooltip com código HEX */}
      <AnimatePresence>
        {showTooltip && showHex && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute left-1/2 -translate-x-1/2 -top-10 z-50 pointer-events-none"
          >
            <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs font-mono px-2 py-1 rounded shadow-lg whitespace-nowrap">
              {color.toUpperCase()}
              <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const ModernColorPicker: React.FC<ModernColorPickerProps> = ({
  label,
  value,
  onChange,
  showPresets = true,
  className,
}) => {
  const [open, setOpen] = useState(false);
  const [recentColors, setRecentColors] = useState<string[]>([]);

  const handleColorSelect = (color: string) => {
    const upperColor = color.toUpperCase();
    onChange(upperColor);

    // Adicionar às cores recentes
    setRecentColors((prev) => {
      const filtered = prev.filter((c) => c.toUpperCase() !== upperColor);
      return [upperColor, ...filtered].slice(0, 8);
    });
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
          {label}
        </Label>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-11 px-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div
              className="w-8 h-8 rounded-md border-2 border-gray-300 dark:border-gray-600 shadow-sm transition-transform hover:scale-110"
              style={{ backgroundColor: value }}
            />
            <span className="text-sm font-mono font-semibold flex-1 text-left">
              {value.toUpperCase()}
            </span>
            <Pipette className="h-4 w-4 text-gray-400" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-80 p-0 border-0 shadow-2xl"
          align="start"
          sideOffset={8}
        >
          <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-lg overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Pipette className="h-4 w-4 text-violet-500" />
                Seletor de Cores
              </h3>
            </div>

            <div className="p-4 space-y-4">
              {/* Color Picker Principal */}
              <div className="space-y-3">
                <HexColorPicker
                  color={value}
                  onChange={handleColorSelect}
                  style={{
                    width: "100%",
                    height: "180px",
                  }}
                />

                {/* Input HEX */}
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-mono text-gray-500 dark:text-gray-400">
                        #
                      </span>
                      <HexColorInput
                        color={value}
                        onChange={handleColorSelect}
                        prefixed
                        className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-mono font-semibold bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all"
                        placeholder="000000"
                      />
                    </div>
                  </div>
                  <div
                    className="w-12 h-10 rounded-lg border-2 border-gray-300 dark:border-gray-600 shadow-inner"
                    style={{ backgroundColor: value }}
                  />
                </div>
              </div>

              {showPresets && (
                <>
                  {/* Cores Recentes */}
                  {recentColors.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                        Cores Recentes
                      </p>
                      <div className="grid grid-cols-8 gap-2">
                        {recentColors.map((color) => (
                          <ColorSwatch
                            key={color}
                            color={color}
                            isSelected={value.toUpperCase() === color}
                            onClick={() => handleColorSelect(color)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Paletas Modernas */}
                  <div className="max-h-64 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                    {Object.entries(MODERN_COLOR_PRESETS).map(
                      ([key, palette]) => (
                        <div key={key}>
                          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                            {palette.name}
                          </p>
                          <div
                            className={cn(
                              "grid gap-2",
                              palette.colors.length > 8
                                ? "grid-cols-6"
                                : "grid-cols-8",
                            )}
                          >
                            {palette.colors.map((color) => (
                              <ColorSwatch
                                key={color}
                                color={color}
                                isSelected={
                                  value.toUpperCase() === color.toUpperCase()
                                }
                                onClick={() => handleColorSelect(color)}
                              />
                            ))}
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Footer com dica */}
            <div className="px-4 py-3 bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                Passe o mouse sobre as cores para ver o código
              </p>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

