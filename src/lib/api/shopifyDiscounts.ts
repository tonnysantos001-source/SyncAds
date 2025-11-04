import { supabase } from "../supabase";

// ============================================
// TYPES
// ============================================

export interface ShopifyPriceRule {
  id: string;
  userId: string;
  integrationId: string;
  title: string;
  valueType: "percentage" | "fixed_amount";
  value: number;
  targetType: "line_item" | "shipping_line";
  targetSelection: "all" | "entitled";
  allocationMethod: "each" | "across";
  usageLimit?: number;
  oncePerCustomer: boolean;
  customerSelection: "all" | "prerequisite";
  startsAt?: string;
  endsAt?: string;
  shopifyData: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  lastSyncAt: string;
}

export interface ShopifyDiscountCode {
  id: string;
  userId: string;
  integrationId: string;
  priceRuleId: string;
  code: string;
  usageCount: number;
  shopifyData: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  lastSyncAt: string;
}

export interface DiscountWithRule extends ShopifyDiscountCode {
  priceRule?: ShopifyPriceRule;
  status?: "active" | "scheduled" | "expired" | "exhausted";
  isValid?: boolean;
}

export interface Discount {
  id: string;
  code: string;
  title: string;
  type: "percentage" | "fixed_amount" | "free_shipping";
  value: number;
  usageCount: number;
  usageLimit?: number;
  startsAt?: string;
  endsAt?: string;
  status: "active" | "scheduled" | "expired" | "exhausted";
  isValid: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// SHOPIFY DISCOUNTS API
// ============================================

export const shopifyDiscountsApi = {
  /**
   * Lista códigos de desconto sincronizados da Shopify
   */
  async listFromShopify(
    userId: string,
    filters?: {
      status?: "active" | "scheduled" | "expired" | "exhausted";
      search?: string;
    },
  ): Promise<Discount[]> {
    try {
      let query = supabase
        .from("ShopifyDiscountCode")
        .select(
          `
          *,
          priceRule:ShopifyPriceRule!ShopifyDiscountCode_priceRuleId_fkey(*)
        `,
        )
        .eq("userId", userId)
        .order("updatedAt", { ascending: false });

      if (filters?.search) {
        query = query.ilike("code", `%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transformar para formato compatível
      let discounts = (data || []).map((d: any) => {
        const pr = d.priceRule;
        const now = new Date();
        const startsAt = pr.startsAt ? new Date(pr.startsAt) : null;
        const endsAt = pr.endsAt ? new Date(pr.endsAt) : null;

        let status: "active" | "scheduled" | "expired" | "exhausted" = "active";
        let isValid = true;

        if (startsAt && now < startsAt) {
          status = "scheduled";
          isValid = false;
        } else if (endsAt && now > endsAt) {
          status = "expired";
          isValid = false;
        } else if (pr.usageLimit && d.usageCount >= pr.usageLimit) {
          status = "exhausted";
          isValid = false;
        }

        return {
          id: String(d.id),
          code: d.code,
          title: pr.title,
          type:
            pr.targetType === "shipping_line"
              ? "free_shipping"
              : pr.valueType === "percentage"
                ? "percentage"
                : "fixed_amount",
          value: parseFloat(pr.value),
          usageCount: d.usageCount || 0,
          usageLimit: pr.usageLimit || undefined,
          startsAt: pr.startsAt || undefined,
          endsAt: pr.endsAt || undefined,
          status,
          isValid,
          metadata: {
            shopifyId: d.id,
            priceRuleId: pr.id,
            shopifyData: d.shopifyData,
            priceRuleData: pr.shopifyData,
            targetType: pr.targetType,
            targetSelection: pr.targetSelection,
            allocationMethod: pr.allocationMethod,
            oncePerCustomer: pr.oncePerCustomer,
          },
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
        } as Discount;
      });

      // Aplicar filtro de status se fornecido
      if (filters?.status) {
        discounts = discounts.filter((d) => d.status === filters.status);
      }

      return discounts;
    } catch (error) {
      console.error("Error listing Shopify discounts:", error);
      throw error;
    }
  },

  /**
   * Busca um código de desconto específico
   */
  async getByCode(userId: string, code: string): Promise<Discount | null> {
    try {
      const { data, error } = await supabase
        .from("ShopifyDiscountCode")
        .select(
          `
          *,
          priceRule:ShopifyPriceRule!ShopifyDiscountCode_priceRuleId_fkey(*)
        `,
        )
        .eq("userId", userId)
        .ilike("code", code)
        .single();

      if (error) {
        console.error("Error getting discount by code:", error);
        return null;
      }

      if (!data) return null;

      const pr = data.priceRule;
      const now = new Date();
      const startsAt = pr.startsAt ? new Date(pr.startsAt) : null;
      const endsAt = pr.endsAt ? new Date(pr.endsAt) : null;

      let status: "active" | "scheduled" | "expired" | "exhausted" = "active";
      let isValid = true;

      if (startsAt && now < startsAt) {
        status = "scheduled";
        isValid = false;
      } else if (endsAt && now > endsAt) {
        status = "expired";
        isValid = false;
      } else if (pr.usageLimit && data.usageCount >= pr.usageLimit) {
        status = "exhausted";
        isValid = false;
      }

      return {
        id: String(data.id),
        code: data.code,
        title: pr.title,
        type:
          pr.targetType === "shipping_line"
            ? "free_shipping"
            : pr.valueType === "percentage"
              ? "percentage"
              : "fixed_amount",
        value: parseFloat(pr.value),
        usageCount: data.usageCount || 0,
        usageLimit: pr.usageLimit || undefined,
        startsAt: pr.startsAt || undefined,
        endsAt: pr.endsAt || undefined,
        status,
        isValid,
        metadata: {
          shopifyId: data.id,
          priceRuleId: pr.id,
          shopifyData: data.shopifyData,
          priceRuleData: pr.shopifyData,
          targetType: pr.targetType,
          targetSelection: pr.targetSelection,
          allocationMethod: pr.allocationMethod,
          oncePerCustomer: pr.oncePerCustomer,
        },
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    } catch (error) {
      console.error("Error getting discount by code:", error);
      return null;
    }
  },

  /**
   * Valida se um código de desconto é válido
   */
  async validateCode(
    userId: string,
    code: string,
  ): Promise<{ valid: boolean; discount?: Discount; reason?: string }> {
    try {
      const discount = await this.getByCode(userId, code);

      if (!discount) {
        return { valid: false, reason: "Código não encontrado" };
      }

      if (!discount.isValid) {
        if (discount.status === "scheduled") {
          return { valid: false, reason: "Código ainda não está ativo" };
        } else if (discount.status === "expired") {
          return { valid: false, reason: "Código expirado" };
        } else if (discount.status === "exhausted") {
          return { valid: false, reason: "Código atingiu limite de uso" };
        }
      }

      return { valid: true, discount };
    } catch (error) {
      console.error("Error validating discount code:", error);
      return { valid: false, reason: "Erro ao validar código" };
    }
  },

  /**
   * Calcula o valor do desconto para um pedido
   */
  calculateDiscount(
    discount: Discount,
    orderTotal: number,
    shippingCost: number = 0,
  ): number {
    if (!discount.isValid) return 0;

    const metadata = discount.metadata || {};

    // Frete grátis
    if (discount.type === "free_shipping") {
      return shippingCost;
    }

    // Desconto em itens
    const targetValue =
      metadata.targetType === "shipping_line" ? shippingCost : orderTotal;

    if (discount.type === "percentage") {
      const discountAmount = (targetValue * discount.value) / 100;
      return Math.min(discountAmount, targetValue);
    } else {
      // fixed_amount
      return Math.min(discount.value, targetValue);
    }
  },

  /**
   * Busca estatísticas de descontos
   */
  async getStats(userId: string) {
    try {
      const { data, error } = await supabase
        .from("ShopifyDiscountCode")
        .select(
          `
          usageCount,
          priceRule:ShopifyPriceRule!ShopifyDiscountCode_priceRuleId_fkey(usageLimit, startsAt, endsAt)
        `,
        )
        .eq("userId", userId);

      if (error) throw error;

      const now = new Date();
      let active = 0;
      let scheduled = 0;
      let expired = 0;
      let exhausted = 0;
      let totalUsage = 0;

      (data || []).forEach((d: any) => {
        const pr = d.priceRule;
        const startsAt = pr.startsAt ? new Date(pr.startsAt) : null;
        const endsAt = pr.endsAt ? new Date(pr.endsAt) : null;

        totalUsage += d.usageCount || 0;

        if (startsAt && now < startsAt) {
          scheduled++;
        } else if (endsAt && now > endsAt) {
          expired++;
        } else if (pr.usageLimit && d.usageCount >= pr.usageLimit) {
          exhausted++;
        } else {
          active++;
        }
      });

      return {
        total: data?.length || 0,
        active,
        scheduled,
        expired,
        exhausted,
        totalUsage,
      };
    } catch (error) {
      console.error("Error getting discount stats:", error);
      return {
        total: 0,
        active: 0,
        scheduled: 0,
        expired: 0,
        exhausted: 0,
        totalUsage: 0,
      };
    }
  },

  /**
   * Conta total de códigos de desconto
   */
  async count(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from("ShopifyDiscountCode")
        .select("*", { count: "exact", head: true })
        .eq("userId", userId);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error("Error counting Shopify discounts:", error);
      return 0;
    }
  },

  /**
   * Incrementa contador de uso de um cupom
   */
  async incrementUsage(userId: string, code: string): Promise<boolean> {
    try {
      const discount = await this.getByCode(userId, code);
      if (!discount || !discount.isValid) return false;

      const { error } = await supabase
        .from("ShopifyDiscountCode")
        .update({
          usageCount: (discount.usageCount || 0) + 1,
          updatedAt: new Date().toISOString(),
        })
        .eq("id", discount.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error incrementing discount usage:", error);
      return false;
    }
  },
};

// Export default
export default shopifyDiscountsApi;
