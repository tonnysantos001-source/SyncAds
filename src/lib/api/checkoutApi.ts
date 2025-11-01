import { supabase } from "../supabase";

// ============================================
// TYPES
// ============================================

export interface CheckoutCustomization {
  id: string;
  userId: string; // ✅ MUDOU: organizationId → userId
  name: string;
  theme: {
    // Cabeçalho
    logoUrl?: string;
    logoAlignment?: "left" | "center" | "right";
    showLogoAtTop?: boolean;
    faviconUrl?: string;
    backgroundColor?: string;
    useGradient?: boolean;

    // Cores
    cartBorderColor?: string;
    quantityCircleColor?: string;
    quantityTextColor?: string;
    showCartIcon?: boolean;

    // Banner
    bannerEnabled?: boolean;
    bannerImageUrl?: string;

    // Carrinho
    cartDisplay?: "closed" | "open";
    allowCouponEdit?: boolean;

    // Conteúdo
    nextStepStyle?: "rounded" | "rectangular" | "oval";
    showCartReminder?: boolean;
    primaryButtonTextColor?: string;
    primaryButtonBackgroundColor?: string;
    primaryButtonHover?: boolean;
    primaryButtonFlow?: boolean;
    highlightedBorderTextColor?: string;
    checkoutButtonBackgroundColor?: string;
    checkoutButtonHover?: boolean;
    checkoutButtonFlow?: boolean;

    // Rodapé
    showStoreName?: boolean;
    showPaymentMethods?: boolean;
    showCnpjCpf?: boolean;
    showContactEmail?: boolean;
    showAddress?: boolean;
    showPhone?: boolean;
    showPrivacyPolicy?: boolean;
    showTermsConditions?: boolean;
    showReturns?: boolean;
    footerTextColor?: string;
    footerBackgroundColor?: string;

    // Escassez
    discountTagTextColor?: string;
    discountTagBackgroundColor?: string;
    useVisible?: boolean;
    expirationTime?: number;

    // Order Bump
    orderBumpTextColor?: string;
    orderBumpBackgroundColor?: string;
    orderBumpPriceColor?: string;
    orderBumpBorderColor?: string;
    orderBumpButtonTextColor?: string;
    orderBumpButtonBackgroundColor?: string;

    // Barra de Avisos
    noticeBarTextColor?: string;
    noticeBarBackgroundColor?: string;
    noticeBarMessage?: string;

    // Configurações Gerais
    navigationSteps?: 1 | 3 | 5;
    fontFamily?: "Arial" | "Roboto" | "Open Sans";
    forceRemovalTime?: number;
    presellPage?: "cart-in-cart" | "direct-checkout";
    language?: "pt" | "en" | "es";
    currency?: "BRL" | "USD" | "EUR";
    requestCpfOnlyAtPayment?: boolean;
    requestBirthDate?: boolean;
    requestGender?: boolean;
    disableCarrot?: boolean;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CheckoutSection {
  id: string;
  customizationId: string;
  type:
    | "HEADER"
    | "NOTICE_BAR"
    | "BANNER"
    | "CART"
    | "CONTENT"
    | "FOOTER"
    | "SCARCITY"
    | "ORDER_BUMP";
  config: Record<string, any>;
  order: number;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// CHECKOUT CUSTOMIZATION API
// ============================================

export const checkoutApi = {
  // Salvar personalização
  async saveCustomization(
    customization: Omit<
      CheckoutCustomization,
      "id" | "createdAt" | "updatedAt"
    >,
  ) {
    try {
      const { data, error } = await supabase
        .from("CheckoutCustomization")
        .upsert({
          ...customization,
          updatedAt: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data as CheckoutCustomization;
    } catch (error) {
      console.error("Error saving checkout customization:", error);
      throw error;
    }
  },

  // ✅ Carregar personalização por userId
  async loadCustomization(userId: string) {
    try {
      const { data, error } = await supabase
        .from("CheckoutCustomization")
        .select("*")
        .eq("userId", userId)
        .eq("isActive", true)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data as CheckoutCustomization | null;
    } catch (error) {
      console.error("Error loading checkout customization:", error);
      throw error;
    }
  },

  // ✅ Listar todas as personalizações por userId
  async listCustomizations(userId: string) {
    try {
      const { data, error } = await supabase
        .from("CheckoutCustomization")
        .select("*")
        .eq("userId", userId)
        .order("createdAt", { ascending: false });

      if (error) throw error;
      return data as CheckoutCustomization[];
    } catch (error) {
      console.error("Error listing checkout customizations:", error);
      throw error;
    }
  },

  // Ativar personalização
  async activateCustomization(id: string) {
    try {
      // Primeiro, desativar todas as outras
      const customization = await supabase
        .from("CheckoutCustomization")
        .select("userId")
        .eq("id", id)
        .single();

      if (customization.data) {
        await supabase
          .from("CheckoutCustomization")
          .update({ isActive: false })
          .eq("userId", customization.data.userId);
      }

      // Ativar esta
      const { data, error } = await supabase
        .from("CheckoutCustomization")
        .update({
          isActive: true,
          updatedAt: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as CheckoutCustomization;
    } catch (error) {
      console.error("Error activating checkout customization:", error);
      throw error;
    }
  },

  // Deletar personalização
  async deleteCustomization(id: string) {
    try {
      const { error } = await supabase
        .from("CheckoutCustomization")
        .delete()
        .eq("id", id);

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting checkout customization:", error);
      throw error;
    }
  },

  // Duplicar personalização
  async duplicateCustomization(id: string, newName: string) {
    try {
      const { data: original, error: fetchError } = await supabase
        .from("CheckoutCustomization")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      const { data, error } = await supabase
        .from("CheckoutCustomization")
        .insert({
          userId: original.userId,
          name: newName,
          theme: original.theme,
          isActive: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data as CheckoutCustomization;
    } catch (error) {
      console.error("Error duplicating checkout customization:", error);
      throw error;
    }
  },

  // Gerar preview URL
  async generatePreviewUrl(customization: Partial<CheckoutCustomization>) {
    try {
      // Criar uma personalização temporária para preview
      const { data, error } = await supabase
        .from("CheckoutCustomization")
        .insert({
          userId: customization.userId!,
          name: `Preview-${Date.now()}`,
          theme: customization.theme || {},
          isActive: false,
        })
        .select()
        .single();

      if (error) throw error;

      // Retornar URL de preview
      return `/checkout/preview/${data.id}`;
    } catch (error) {
      console.error("Error generating preview URL:", error);
      throw error;
    }
  },

  // Exportar personalização
  async exportCustomization(id: string) {
    try {
      const { data, error } = await supabase
        .from("CheckoutCustomization")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      // Remover campos internos
      const exportData = {
        name: data.name,
        theme: data.theme,
        exportedAt: new Date().toISOString(),
        version: "1.0",
      };

      return exportData;
    } catch (error) {
      console.error("Error exporting checkout customization:", error);
      throw error;
    }
  },

  // ✅ Importar personalização por userId
  async importCustomization(userId: string, importData: any) {
    try {
      const { data, error } = await supabase
        .from("CheckoutCustomization")
        .insert({
          userId,
          name: `${importData.name} (Importado)`,
          theme: importData.theme,
          isActive: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data as CheckoutCustomization;
    } catch (error) {
      console.error("Error importing checkout customization:", error);
      throw error;
    }
  },
};

// ============================================
// COUPON API
// ============================================

export const couponApi = {
  // Validar e aplicar cupom
  async validateCoupon(code: string, cartTotal: number) {
    try {
      const { data: coupon, error } = await supabase
        .from("Coupon")
        .select("*")
        .eq("code", code.toUpperCase())
        .eq("isActive", true)
        .single();

      if (error || !coupon) {
        return {
          valid: false,
          error: "Cupom não encontrado ou inválido",
        };
      }

      // Verificar se cupom expirou
      if (coupon.expiresAt) {
        const expiryDate = new Date(coupon.expiresAt);
        if (expiryDate < new Date()) {
          return {
            valid: false,
            error: "Cupom expirado",
          };
        }
      }

      // Verificar se cupom ainda não começou
      if (coupon.startsAt) {
        const startDate = new Date(coupon.startsAt);
        if (startDate > new Date()) {
          return {
            valid: false,
            error: "Cupom ainda não está ativo",
          };
        }
      }

      // Verificar limite de uso
      if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
        return {
          valid: false,
          error: "Cupom esgotado",
        };
      }

      // Verificar valor mínimo de compra
      if (coupon.minPurchaseAmount && cartTotal < coupon.minPurchaseAmount) {
        return {
          valid: false,
          error: `Valor mínimo de R$ ${coupon.minPurchaseAmount.toFixed(2)} não atingido`,
        };
      }

      // Calcular desconto
      let discountAmount = 0;

      if (coupon.type === "PERCENTAGE") {
        discountAmount = (cartTotal * coupon.value) / 100;

        // Aplicar desconto máximo se houver
        if (
          coupon.maxDiscountAmount &&
          discountAmount > coupon.maxDiscountAmount
        ) {
          discountAmount = coupon.maxDiscountAmount;
        }
      } else if (coupon.type === "FIXED_AMOUNT") {
        discountAmount = coupon.value;
      }

      return {
        valid: true,
        coupon,
        discountAmount,
        finalTotal: Math.max(0, cartTotal - discountAmount),
      };
    } catch (error) {
      console.error("Error validating coupon:", error);
      return {
        valid: false,
        error: "Erro ao validar cupom",
      };
    }
  },

  // Registrar uso do cupom
  async useCoupon(
    couponId: string,
    customerId: string,
    orderId: string,
    discountAmount: number,
  ) {
    try {
      // Registrar uso
      const { error: usageError } = await supabase.from("CouponUsage").insert({
        couponId,
        customerId,
        orderId,
        discountAmount,
        usedAt: new Date().toISOString(),
      });

      if (usageError) throw usageError;

      // Incrementar contador de uso
      const { error: updateError } = await supabase.rpc(
        "increment_coupon_usage",
        {
          coupon_id: couponId,
        },
      );

      if (updateError) {
        console.error("Error incrementing coupon usage:", updateError);
      }
    } catch (error) {
      console.error("Error using coupon:", error);
      throw error;
    }
  },
};

// ============================================
// ORDER BUMP API
// ============================================

export const orderBumpApi = {
  // Buscar order bumps para produtos específicos
  async getOrderBumps(productIds: string[]) {
    try {
      const { data, error } = await supabase
        .from("OrderBump")
        .select("*, Product(*)")
        .eq("isActive", true)
        .or(productIds.map((id) => `triggerProductIds.cs.{${id}}`).join(","));

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error("Error fetching order bumps:", error);
      return [];
    }
  },

  // Buscar order bumps por posição no checkout
  async getOrderBumpsByPosition(
    position: "BEFORE_PAYMENT" | "AFTER_PAYMENT" | "IN_CART",
  ) {
    try {
      const { data, error } = await supabase
        .from("OrderBump")
        .select("*, Product(*)")
        .eq("isActive", true)
        .eq("position", position);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error("Error fetching order bumps by position:", error);
      return [];
    }
  },
};

// ============================================
// SHIPPING API
// ============================================

export const shippingApi = {
  // Calcular frete (simulação - integrar com Correios/Melhor Envio depois)
  async calculateShipping(zipCode: string, weight: number, cartTotal: number) {
    try {
      // Buscar métodos de frete disponíveis
      const { data: shippingMethods, error } = await supabase
        .from("Shipping")
        .select("*")
        .eq("isActive", true);

      if (error) throw error;

      if (!shippingMethods || shippingMethods.length === 0) {
        return {
          methods: [],
          error: "Nenhum método de frete disponível",
        };
      }

      // Filtrar e calcular frete
      const availableMethods = shippingMethods
        .filter((method) => {
          // Frete grátis se atingir valor mínimo
          if (method.type === "FREE" && method.minOrderValue) {
            return cartTotal >= method.minOrderValue;
          }
          return true;
        })
        .map((method) => {
          let price = 0;

          if (method.type === "FLAT_RATE") {
            price = method.price || 0;
          } else if (method.type === "WEIGHT_BASED") {
            // Calcular baseado no peso (R$ por kg)
            price = (method.price || 0) * weight;
          } else if (method.type === "PRICE_BASED") {
            // Calcular baseado no valor do carrinho
            price = (cartTotal * (method.price || 0)) / 100;
          } else if (method.type === "FREE") {
            price = 0;
          }

          return {
            id: method.id,
            name: method.name,
            carrier: method.carrier,
            price: Math.max(0, price),
            estimatedDays: method.estimatedDays,
            type: method.type,
          };
        });

      return {
        methods: availableMethods,
        error: null,
      };
    } catch (error) {
      console.error("Error calculating shipping:", error);
      return {
        methods: [],
        error: "Erro ao calcular frete",
      };
    }
  },

  // Integração futura com Correios
  async calculateCorreios(
    zipCodeFrom: string,
    zipCodeTo: string,
    weight: number,
    length: number,
    width: number,
    height: number,
  ) {
    // TODO: Implementar integração com API dos Correios
    return {
      methods: [],
      error: "Integração com Correios ainda não implementada",
    };
  },

  // Integração futura com Melhor Envio
  async calculateMelhorEnvio(
    zipCodeFrom: string,
    zipCodeTo: string,
    weight: number,
    packages: any[],
  ) {
    // TODO: Implementar integração com Melhor Envio
    return {
      methods: [],
      error: "Integração com Melhor Envio ainda não implementada",
    };
  },
};

// ============================================
// CHECKOUT SECTIONS API
// ============================================

export const checkoutSectionsApi = {
  // Salvar seção
  async saveSection(
    section: Omit<CheckoutSection, "id" | "createdAt" | "updatedAt">,
  ) {
    try {
      const { data, error } = await supabase
        .from("CheckoutSection")
        .upsert({
          ...section,
          updatedAt: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data as CheckoutSection;
    } catch (error) {
      console.error("Error saving checkout section:", error);
      throw error;
    }
  },

  // Carregar seções
  async loadSections(customizationId: string) {
    try {
      const { data, error } = await supabase
        .from("CheckoutSection")
        .select("*")
        .eq("customizationId", customizationId)
        .order("order", { ascending: true });

      if (error) throw error;
      return data as CheckoutSection[];
    } catch (error) {
      console.error("Error loading checkout sections:", error);
      throw error;
    }
  },

  // Atualizar ordem das seções
  async updateSectionOrder(sections: { id: string; order: number }[]) {
    try {
      const updates = sections.map((section) =>
        supabase
          .from("CheckoutSection")
          .update({
            order: section.order,
            updatedAt: new Date().toISOString(),
          })
          .eq("id", section.id),
      );

      await Promise.all(updates);
    } catch (error) {
      console.error("Error updating section order:", error);
      throw error;
    }
  },

  // Deletar seção
  async deleteSection(id: string) {
    try {
      const { error } = await supabase
        .from("CheckoutSection")
        .delete()
        .eq("id", id);

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting checkout section:", error);
      throw error;
    }
  },
};

// ============================================
// CHECKOUT PREVIEW API
// ============================================

export const checkoutPreviewApi = {
  // Gerar preview HTML
  async generatePreview(customization: CheckoutCustomization) {
    try {
      // Chamar Edge Function para gerar preview
      const { data, error } = await supabase.functions.invoke(
        "checkout-preview",
        {
          body: { customization },
        },
      );

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error generating checkout preview:", error);
      throw error;
    }
  },

  // Salvar preview como template
  async saveAsTemplate(customizationId: string, templateName: string) {
    try {
      const { data, error } = await supabase
        .from("CheckoutCustomization")
        .select("*")
        .eq("id", customizationId)
        .single();

      if (error) throw error;

      const { data: template, error: templateError } = await supabase
        .from("CheckoutCustomization")
        .insert({
          userId: data.userId,
          name: templateName,
          theme: data.theme,
          isActive: false,
        })
        .select()
        .single();

      if (templateError) throw templateError;
      return template as CheckoutCustomization;
    } catch (error) {
      console.error("Error saving checkout template:", error);
      throw error;
    }
  },
};
