import React, { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface ColorPickerProps {
  label?: string;
  value: string;
  onChange: (color: string) => void;
  showPresets?: boolean;
  className?: string;
}

// Paletas de cores pré-definidas
const COLOR_PRESETS = {
  primary: [
    "#8b5cf6", // violet-500
    "#7c3aed", // violet-600
    "#6366f1", // indigo-500
    "#4f46e5", // indigo-600
    "#3b82f6", // blue-500
    "#2563eb", // blue-600
    "#06b6d4", // cyan-500
    "#0891b2", // cyan-600
  ],
  success: [
    "#10b981", // emerald-500
    "#059669", // emerald-600
    "#22c55e", // green-500
    "#16a34a", // green-600
    "#84cc16", // lime-500
    "#65a30d", // lime-600
  ],
  warning: [
    "#f59e0b", // amber-500
    "#d97706", // amber-600
    "#eab308", // yellow-500
    "#ca8a04", // yellow-600
    "#fb923c", // orange-400
    "#f97316", // orange-500
  ],
  danger: [
    "#ef4444", // red-500
    "#dc2626", // red-600
    "#f43f5e", // rose-500
    "#e11d48", // rose-600
    "#ec4899", // pink-500
    "#db2777", // pink-600
  ],
  neutral: [
    "#ffffff", // white
    "#f9fafb", // gray-50
    "#f3f4f6", // gray-100
    "#e5e7eb", // gray-200
    "#d1d5db", // gray-300
    "#9ca3af", // gray-400
    "#6b7280", // gray-500
    "#4b5563", // gray-600
    "#374151", // gray-700
    "#1f2937", // gray-800
    "#111827", // gray-900
    "#000000", // black
  ],
};

export const ColorPicker: React.FC<ColorPickerProps> = ({
  label,
  value,
  onChange,
  showPresets = true,
  className,
}) => {
  const [open, setOpen] = useState(false);
  const [recentColors, setRecentColors] = useState<string[]>([]);

  const handleColorSelect = (color: string) => {
    onChange(color);

    // Adicionar às cores recentes
    setRecentColors((prev) => {
      const filtered = prev.filter((c) => c !== color);
      return [color, ...filtered].slice(0, 6);
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
            className="w-full justify-start gap-3 h-10 px-3"
          >
            <div
              className="w-6 h-6 rounded border-2 border-gray-300 dark:border-gray-600 shadow-sm"
              style={{ backgroundColor: value }}
            />
            <span className="text-sm font-mono">{value.toUpperCase()}</span>
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-80 p-4" align="start">
          <div className="space-y-4">
            {/* Input de cor nativo */}
            <div className="flex gap-2">
              <Input
                type="color"
                value={value}
                onChange={(e) => handleColorSelect(e.target.value)}
                className="w-16 h-10 cursor-pointer p-1"
              />
              <Input
                type="text"
                value={value}
                onChange={(e) => {
                  const color = e.target.value;
                  if (/^#[0-9A-F]{6}$/i.test(color)) {
                    handleColorSelect(color);
                  }
                }}
                placeholder="#000000"
                className="flex-1 font-mono text-sm"
                maxLength={7}
              />
            </div>

            {showPresets && (
              <>
                {/* Cores recentes */}
                {recentColors.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                      Cores Recentes
                    </p>
                    <div className="grid grid-cols-6 gap-2">
                      {recentColors.map((color) => (
                        <ColorSwatch
                          key={color}
                          color={color}
                          isSelected={value === color}
                          onClick={() => handleColorSelect(color)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Paletas pré-definidas */}
                <div>
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    Cores Primárias
                  </p>
                  <div className="grid grid-cols-8 gap-2">
                    {COLOR_PRESETS.primary.map((color) => (
                      <ColorSwatch
                        key={color}
                        color={color}
                        isSelected={value === color}
                        onClick={() => handleColorSelect(color)}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    Sucesso
                  </p>
                  <div className="grid grid-cols-6 gap-2">
                    {COLOR_PRESETS.success.map((color) => (
                      <ColorSwatch
                        key={color}
                        color={color}
                        isSelected={value === color}
                        onClick={() => handleColorSelect(color)}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    Aviso
                  </p>
                  <div className="grid grid-cols-6 gap-2">
                    {COLOR_PRESETS.warning.map((color) => (
                      <ColorSwatch
                        key={color}
                        color={color}
                        isSelected={value === color}
                        onClick={() => handleColorSelect(color)}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    Perigo
                  </p>
                  <div className="grid grid-cols-6 gap-2">
                    {COLOR_PRESETS.danger.map((color) => (
                      <ColorSwatch
                        key={color}
                        color={color}
                        isSelected={value === color}
                        onClick={() => handleColorSelect(color)}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    Neutras
                  </p>
                  <div className="grid grid-cols-8 gap-2">
                    {COLOR_PRESETS.neutral.map((color) => (
                      <ColorSwatch
                        key={color}
                        color={color}
                        isSelected={value === color}
                        onClick={() => handleColorSelect(color)}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

interface ColorSwatchProps {
  color: string;
  isSelected: boolean;
  onClick: () => void;
}

const ColorSwatch: React.FC<ColorSwatchProps> = ({
  color,
  isSelected,
  onClick,
}) => {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "relative w-8 h-8 rounded-md border-2 transition-all cursor-pointer",
        isSelected
          ? "border-violet-500 ring-2 ring-violet-500 ring-offset-2"
          : "border-gray-300 dark:border-gray-600 hover:border-gray-400",
      )}
      style={{ backgroundColor: color }}
    >
      {isSelected && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Check
            className="h-4 w-4"
            style={{
              color: isLightColor(color) ? "#000000" : "#ffffff",
            }}
          />
        </div>
      )}
    </motion.button>
  );
};

// Função auxiliar para detectar se a cor é clara
function isLightColor(color: string): boolean {
  const hex = color.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155;
}

