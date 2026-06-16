import React from "react";
import { Check, Plus, Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface CrossSellCardProps {
  product: {
    id: string;
    name: string;
    image?: string;
    originalPrice: number;
    price: number;
    discountLabel?: string;
    description?: string;
  };
  selected: boolean;
  onToggle: () => void;
  primaryColor?: string;
}

export const CrossSellCard: React.FC<CrossSellCardProps> = ({
  product,
  selected,
  onToggle,
  primaryColor = "#8b5cf6", // Roxo por padrão
}) => {
  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
  };

  return (
    <div
      onClick={onToggle}
      className={cn(
        "group relative flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer select-none transition-all duration-300 bg-white dark:bg-gray-900",
        selected
          ? "border-purple-600 bg-purple-50/40 dark:bg-purple-950/20 shadow-md scale-[1.01]"
          : "border-gray-200 hover:border-gray-300 dark:border-gray-800 hover:shadow-sm"
      )}
    >
      {/* Badge de Desconto */}
      {product.discountLabel && (
        <span className="absolute -top-2.5 -left-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-extrabold text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-full shadow-sm">
          {product.discountLabel}
        </span>
      )}

      {/* Imagem do Produto */}
      <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 border border-gray-100 dark:border-gray-800">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <Package className="w-6 h-6 text-gray-400" />
        )}
      </div>

      {/* Detalhes do Produto */}
      <div className="flex-1 min-w-0 pr-2">
        <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200 truncate leading-snug">
          {product.name}
        </h4>
        {product.description && (
          <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate mt-0.5 leading-relaxed">
            {product.description}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[11px] text-gray-400 line-through">
            {formatCurrency(product.originalPrice)}
          </span>
          <span className="text-sm font-extrabold text-gray-900 dark:text-white">
            {formatCurrency(product.price)}
          </span>
        </div>
      </div>

      {/* Botão Seletor */}
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border transition-all duration-300",
          selected
            ? "bg-purple-600 border-purple-600 text-white"
            : "border-gray-250 text-gray-400 group-hover:border-gray-300 group-hover:bg-gray-50"
        )}
        style={selected ? { backgroundColor: primaryColor, borderColor: primaryColor } : undefined}
      >
        {selected ? (
          <Check className="w-4 h-4 stroke-[3]" />
        ) : (
          <Plus className="w-4 h-4 stroke-[3]" />
        )}
      </div>
    </div>
  );
};
