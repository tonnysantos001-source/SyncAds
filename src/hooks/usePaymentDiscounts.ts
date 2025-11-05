import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface PaymentMethodDiscount {
  id: string;
  userId: string;
  paymentMethod: 'CREDIT_CARD' | 'PIX' | 'BOLETO' | 'DEBIT_CARD';
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  isActive: boolean;
  minPurchaseAmount: number;
  maxDiscountAmount: number | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DiscountCalculation {
  hasDiscount: boolean;
  discountAmount: number;
  discountPercentage: number;
  originalTotal: number;
  finalTotal: number;
  discountDescription: string;
  meetsMinimum: boolean;
  cappedAtMaximum: boolean;
}

interface UsePaymentDiscountsProps {
  userId: string | null;
  paymentMethod: 'CREDIT_CARD' | 'PIX' | 'BOLETO' | 'DEBIT_CARD';
  purchaseAmount: number;
}

export const usePaymentDiscounts = ({
  userId,
  paymentMethod,
  purchaseAmount,
}: UsePaymentDiscountsProps) => {
  const [loading, setLoading] = useState(true);
  const [discounts, setDiscounts] = useState<PaymentMethodDiscount[]>([]);
  const [activeDiscount, setActiveDiscount] = useState<PaymentMethodDiscount | null>(null);
  const [calculation, setCalculation] = useState<DiscountCalculation>({
    hasDiscount: false,
    discountAmount: 0,
    discountPercentage: 0,
    originalTotal: purchaseAmount,
    finalTotal: purchaseAmount,
    discountDescription: '',
    meetsMinimum: false,
    cappedAtMaximum: false,
  });

  // Buscar descontos do usuário
  useEffect(() => {
    if (userId) {
      loadDiscounts();
    } else {
      setLoading(false);
    }
  }, [userId]);

  // Recalcular quando mudar método de pagamento ou valor
  useEffect(() => {
    calculateDiscount();
  }, [paymentMethod, purchaseAmount, discounts]);

  const loadDiscounts = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('PaymentMethodDiscount')
        .select('*')
        .eq('userId', userId)
        .eq('isActive', true);

      if (error) throw error;
      setDiscounts(data || []);
    } catch (error) {
      console.error('Erro ao carregar descontos:', error);
      setDiscounts([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateDiscount = () => {
    // Buscar desconto para o método de pagamento atual
    const discount = discounts.find(
      (d) => d.paymentMethod === paymentMethod && d.isActive
    );

    if (!discount) {
      setActiveDiscount(null);
      setCalculation({
        hasDiscount: false,
        discountAmount: 0,
        discountPercentage: 0,
        originalTotal: purchaseAmount,
        finalTotal: purchaseAmount,
        discountDescription: '',
        meetsMinimum: false,
        cappedAtMaximum: false,
      });
      return;
    }

    setActiveDiscount(discount);

    // Verificar se atende o valor mínimo
    const meetsMinimum = purchaseAmount >= discount.minPurchaseAmount;

    if (!meetsMinimum) {
      setCalculation({
        hasDiscount: false,
        discountAmount: 0,
        discountPercentage: 0,
        originalTotal: purchaseAmount,
        finalTotal: purchaseAmount,
        discountDescription: discount.description || '',
        meetsMinimum: false,
        cappedAtMaximum: false,
      });
      return;
    }

    // Calcular desconto
    let discountAmount = 0;
    let discountPercentage = 0;

    if (discount.discountType === 'PERCENTAGE') {
      discountPercentage = discount.discountValue;
      discountAmount = (purchaseAmount * discount.discountValue) / 100;
    } else {
      // FIXED_AMOUNT
      discountAmount = discount.discountValue;
      discountPercentage = (discount.discountValue / purchaseAmount) * 100;
    }

    // Aplicar desconto máximo se configurado
    let cappedAtMaximum = false;
    if (discount.maxDiscountAmount && discountAmount > discount.maxDiscountAmount) {
      discountAmount = discount.maxDiscountAmount;
      discountPercentage = (discount.maxDiscountAmount / purchaseAmount) * 100;
      cappedAtMaximum = true;
    }

    // Garantir que desconto não seja maior que o valor total
    if (discountAmount > purchaseAmount) {
      discountAmount = purchaseAmount;
    }

    const finalTotal = Math.max(0, purchaseAmount - discountAmount);

    setCalculation({
      hasDiscount: true,
      discountAmount,
      discountPercentage,
      originalTotal: purchaseAmount,
      finalTotal,
      discountDescription: discount.description || '',
      meetsMinimum: true,
      cappedAtMaximum,
    });
  };

  // Formatar desconto para exibição
  const getDiscountLabel = (): string => {
    if (!activeDiscount) return '';

    if (activeDiscount.discountType === 'PERCENTAGE') {
      return `${activeDiscount.discountValue.toFixed(0)}% de desconto`;
    } else {
      return `R$ ${activeDiscount.discountValue.toFixed(2)} de desconto`;
    }
  };

  // Verificar se tem desconto disponível para um método específico
  const hasDiscountForMethod = (method: 'CREDIT_CARD' | 'PIX' | 'BOLETO' | 'DEBIT_CARD'): boolean => {
    return discounts.some((d) => d.paymentMethod === method && d.isActive);
  };

  // Obter informações de desconto para um método específico
  const getDiscountInfoForMethod = (method: 'CREDIT_CARD' | 'PIX' | 'BOLETO' | 'DEBIT_CARD') => {
    const discount = discounts.find((d) => d.paymentMethod === method && d.isActive);
    if (!discount) return null;

    let label = '';
    if (discount.discountType === 'PERCENTAGE') {
      label = `${discount.discountValue.toFixed(0)}% OFF`;
    } else {
      label = `-R$ ${discount.discountValue.toFixed(2)}`;
    }

    return {
      ...discount,
      label,
      formattedValue: discount.discountType === 'PERCENTAGE'
        ? `${discount.discountValue}%`
        : `R$ ${discount.discountValue.toFixed(2)}`,
    };
  };

  // Obter valor estimado de desconto para um método (sem validar mínimo)
  const getEstimatedDiscountForMethod = (
    method: 'CREDIT_CARD' | 'PIX' | 'BOLETO' | 'DEBIT_CARD',
    amount: number = purchaseAmount
  ): number => {
    const discount = discounts.find((d) => d.paymentMethod === method && d.isActive);
    if (!discount) return 0;

    let discountAmount = 0;

    if (discount.discountType === 'PERCENTAGE') {
      discountAmount = (amount * discount.discountValue) / 100;
    } else {
      discountAmount = discount.discountValue;
    }

    // Aplicar desconto máximo
    if (discount.maxDiscountAmount && discountAmount > discount.maxDiscountAmount) {
      discountAmount = discount.maxDiscountAmount;
    }

    // Garantir que não seja maior que o total
    if (discountAmount > amount) {
      discountAmount = amount;
    }

    return discountAmount;
  };

  return {
    loading,
    discounts,
    activeDiscount,
    calculation,
    getDiscountLabel,
    hasDiscountForMethod,
    getDiscountInfoForMethod,
    getEstimatedDiscountForMethod,
    reload: loadDiscounts,
  };
};
