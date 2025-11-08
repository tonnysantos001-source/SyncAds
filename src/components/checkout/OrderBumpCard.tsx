/**
 * OrderBumpCard - Card de Order Bump Totalmente Customizável
 *
 * Order Bump é uma oferta adicional apresentada no checkout
 * para aumentar o ticket médio da compra.
 *
 * Suporta todas as personalizações do tema:
 * - Cores customizadas (texto, fundo, preço, borda)
 * - Border radius e largura de borda
 * - Sombras
 * - Botão customizado
 * - Checkbox de seleção
 * - Animações
 * - Responsivo
 *
 * @version 1.0
 * @date 08/01/2025
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Plus, Sparkles, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderBump {
  id: string;
  title: string;
  description: string;
  originalPrice?: number;
  price: number;
  image?: string;
  badge?: string;
  bullets?: string[];
}

interface OrderBumpCardProps {
  orderBump: OrderBump;
  theme: any;
  selected?: boolean;
  onToggle: (orderBumpId: string) => void;
  className?: string;
}

export const OrderBumpCard: React.FC<OrderBumpCardProps> = ({
  orderBump,
  theme,
  selected = false,
  onToggle,
  className = "",
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // ============================================
  // VERIFICAR SE ORDER BUMP ESTÁ HABILITADO
  // ============================================

  if (!theme.orderBumpEnabled) return null;

  // ============================================
  // CALCULAR DESCONTO
  // ============================================

  const discount = orderBump.originalPrice
    ? Math.round(
        ((orderBump.originalPrice - orderBump.price) /
          orderBump.originalPrice) *
          100
      )
    : 0;

  // ============================================
  // ESTILOS DINÂMICOS
  // ============================================

  const cardStyles: React.CSSProperties = {
    backgroundColor: theme.orderBumpBackgroundColor || "#ffffff",
    borderColor: selected
      ? theme.primaryButtonBackgroundColor || "#8b5cf6"
      : theme.orderBumpBorderColor || "#e5e7eb",
    borderWidth: `${theme.orderBumpBorderWidth || 2}px`,
    borderRadius: `${theme.orderBumpBorderRadius || 12}px`,
    boxShadow: theme.orderBumpShadow
      ? selected
        ? `0 8px 30px ${theme.primaryButtonBackgroundColor || "#8b5cf6"}30`
        : "0 4px 6px rgba(0, 0, 0, 0.1)"
      : "none",
    transition: "all 0.3s ease",
  };

  const buttonStyles: React.CSSProperties = {
    backgroundColor: theme.orderBumpButtonBackgroundColor || "#8b5cf6",
    color: theme.orderBumpButtonTextColor || "#ffffff",
    borderRadius: `${(theme.orderBumpBorderRadius || 12) - 4}px`,
  };

  // ============================================
  // HANDLERS
  // ============================================

  const handleToggle = () => {
    onToggle(orderBump.id);
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <motion.div
      className={cn(
        "relative border cursor-pointer overflow-hidden",
        className
      )}
      style={cardStyles}
      onClick={handleToggle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.3 }}
    >
      {/* Badge de Destaque */}
      {(discount > 0 || orderBump.badge) && (
        <div className="absolute top-3 right-3 z-10">
          <motion.div
            className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg"
            style={{
              backgroundColor: theme.discountTagBackgroundColor || "#ef4444",
              color: theme.discountTagTextColor || "#ffffff",
            }}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Tag className="w-3 h-3" />
            <span>{orderBump.badge || `-${discount}%`}</span>
          </motion.div>
        </div>
      )}

      {/* Checkmark de Seleção */}
      <div className="absolute top-3 left-3 z-10">
        <motion.div
          className={cn(
            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
            selected ? "bg-green-500 border-green-500" : "bg-white border-gray-300"
          )}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <AnimatePresence>
            {selected && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ duration: 0.3 }}
              >
                <Check className="w-4 h-4 text-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <div className="p-6">
        {/* Header com Imagem */}
        <div className="flex gap-4 mb-4">
          {/* Imagem do Produto */}
          {orderBump.image && (
            <div className="flex-shrink-0">
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={orderBump.image}
                  alt={orderBump.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          {/* Conteúdo */}
          <div className="flex-1">
            {/* Título */}
            <h3
              className="text-lg font-bold mb-2"
              style={{ color: theme.orderBumpTextColor || "#111827" }}
            >
              {orderBump.title}
            </h3>

            {/* Descrição */}
            <p
              className="text-sm mb-3"
              style={{
                color: theme.orderBumpTextColor
                  ? `${theme.orderBumpTextColor}80`
                  : "#6b7280",
              }}
            >
              {orderBump.description}
            </p>
          </div>
        </div>

        {/* Bullets/Features */}
        {orderBump.bullets && orderBump.bullets.length > 0 && (
          <div className="mb-4 space-y-2">
            {orderBump.bullets.slice(0, 3).map((bullet, index) => (
              <motion.div
                key={index}
                className="flex items-start gap-2 text-sm"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 * index }}
              >
                <Sparkles
                  className="w-4 h-4 flex-shrink-0 mt-0.5"
                  style={{
                    color: theme.orderBumpPriceColor || "#8b5cf6",
                  }}
                />
                <span
                  style={{
                    color: theme.orderBumpTextColor || "#374151",
                  }}
                >
                  {bullet}
                </span>
              </motion.div>
            ))}
          </div>
        )}

        {/* Preços */}
        <div className="flex items-baseline gap-2 mb-4">
          {/* Preço Original */}
          {orderBump.originalPrice && (
            <span
              className="text-sm line-through opacity-60"
              style={{
                color: theme.orderBumpTextColor || "#6b7280",
              }}
            >
              R$ {orderBump.originalPrice.toFixed(2)}
            </span>
          )}

          {/* Preço Atual */}
          <span
            className="text-2xl font-bold"
            style={{
              color: theme.orderBumpPriceColor || "#10b981",
            }}
          >
            R$ {orderBump.price.toFixed(2)}
          </span>

          {/* Texto "apenas" */}
          <span
            className="text-sm"
            style={{
              color: theme.orderBumpTextColor
                ? `${theme.orderBumpTextColor}60`
                : "#9ca3af",
            }}
          >
            à vista
          </span>
        </div>

        {/* Botão de Ação */}
        <motion.button
          className="w-full py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all"
          style={buttonStyles}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => {
            e.stopPropagation();
            handleToggle();
          }}
        >
          {selected ? (
            <>
              <Check className="w-5 h-5" />
              <span>Adicionado ao Pedido</span>
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              <span>Adicionar ao Pedido</span>
            </>
          )}
        </motion.button>

        {/* Texto de Urgência */}
        {selected && (
          <motion.p
            className="text-center text-xs mt-3 font-medium"
            style={{
              color: theme.orderBumpPriceColor || "#10b981",
            }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            ✓ Oferta adicionada com sucesso!
          </motion.p>
        )}
      </div>

      {/* Animação de Seleção */}
      {selected && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(135deg, ${theme.primaryButtonBackgroundColor || "#8b5cf6"}10, transparent)`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}

      {/* Efeito de Hover */}
      <AnimatePresence>
        {isHovered && !selected && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(135deg, ${theme.orderBumpBorderColor || "#e5e7eb"}20, transparent)`,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default OrderBumpCard;
