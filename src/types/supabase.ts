export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      AbandonedCart: {
        Row: {
          abandonedAt: string
          cartId: string
          createdAt: string | null
          customerId: string | null
          email: string
          id: string
          lastRecoveryAt: string | null
          orderId: string | null
          recoveredAt: string | null
          recoveryAttempts: number | null
        }
        Insert: {
          abandonedAt: string
          cartId: string
          createdAt?: string | null
          customerId?: string | null
          email: string
          id?: string
          lastRecoveryAt?: string | null
          orderId?: string | null
          recoveredAt?: string | null
          recoveryAttempts?: number | null
        }
        Update: {
          abandonedAt?: string
          cartId?: string
          createdAt?: string | null
          customerId?: string | null
          email?: string
          id?: string
          lastRecoveryAt?: string | null
          orderId?: string | null
          recoveredAt?: string | null
          recoveryAttempts?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "AbandonedCart_cartId_fkey"
            columns: ["cartId"]
            isOneToOne: false
            referencedRelation: "Cart"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "AbandonedCart_customerId_fkey"
            columns: ["customerId"]
            isOneToOne: false
            referencedRelation: "Customer"
            referencedColumns: ["id"]
          },
        ]
      }
      AdminLog: {
        Row: {
          action: string
          createdAt: string
          errorMessage: string | null
          id: string
          query: string | null
          result: Json | null
          success: boolean
          userId: string
        }
        Insert: {
          action: string
          createdAt?: string
          errorMessage?: string | null
          id: string
          query?: string | null
          result?: Json | null
          success: boolean
          userId: string
        }
        Update: {
          action?: string
          createdAt?: string
          errorMessage?: string | null
          id?: string
          query?: string | null
          result?: Json | null
          success?: boolean
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "AdminLog_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      AiConnection: {
        Row: {
          apiKey: string
          baseUrl: string | null
          createdAt: string
          id: string
          model: string | null
          name: string
          status: string
          updatedAt: string
          userId: string
        }
        Insert: {
          apiKey: string
          baseUrl?: string | null
          createdAt?: string
          id: string
          model?: string | null
          name: string
          status?: string
          updatedAt: string
          userId: string
        }
        Update: {
          apiKey?: string
          baseUrl?: string | null
          createdAt?: string
          id?: string
          model?: string | null
          name?: string
          status?: string
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "AiConnection_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      AiPersonality: {
        Row: {
          analyticsPrompt: string | null
          campaignPrompt: string | null
          canAccessAnalytics: boolean
          canAnalyzeData: boolean
          canCreateCampaigns: boolean
          canManageIntegrations: boolean
          canSuggestContent: boolean
          contentPrompt: string | null
          createdAt: string
          creativity: number
          description: string | null
          id: string
          language: string
          name: string
          strategyPrompt: string | null
          systemPrompt: string
          tone: string
          updatedAt: string
          userId: string
          verbosity: string
        }
        Insert: {
          analyticsPrompt?: string | null
          campaignPrompt?: string | null
          canAccessAnalytics?: boolean
          canAnalyzeData?: boolean
          canCreateCampaigns?: boolean
          canManageIntegrations?: boolean
          canSuggestContent?: boolean
          contentPrompt?: string | null
          createdAt?: string
          creativity?: number
          description?: string | null
          id: string
          language?: string
          name?: string
          strategyPrompt?: string | null
          systemPrompt: string
          tone?: string
          updatedAt: string
          userId: string
          verbosity?: string
        }
        Update: {
          analyticsPrompt?: string | null
          campaignPrompt?: string | null
          canAccessAnalytics?: boolean
          canAnalyzeData?: boolean
          canCreateCampaigns?: boolean
          canManageIntegrations?: boolean
          canSuggestContent?: boolean
          contentPrompt?: string | null
          createdAt?: string
          creativity?: number
          description?: string | null
          id?: string
          language?: string
          name?: string
          strategyPrompt?: string | null
          systemPrompt?: string
          tone?: string
          updatedAt?: string
          userId?: string
          verbosity?: string
        }
        Relationships: [
          {
            foreignKeyName: "AiPersonality_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      AiUsage: {
        Row: {
          cost: number | null
          createdAt: string | null
          globalAiConnectionId: string | null
          id: string
          messageCount: number | null
          month: string
          tokensUsed: number | null
          userId: string | null
        }
        Insert: {
          cost?: number | null
          createdAt?: string | null
          globalAiConnectionId?: string | null
          id?: string
          messageCount?: number | null
          month: string
          tokensUsed?: number | null
          userId?: string | null
        }
        Update: {
          cost?: number | null
          createdAt?: string | null
          globalAiConnectionId?: string | null
          id?: string
          messageCount?: number | null
          month?: string
          tokensUsed?: number | null
          userId?: string | null
        }
        Relationships: []
      }
      Analytics: {
        Row: {
          campaignId: string
          clicks: number
          conversions: number
          cpc: number
          createdAt: string
          ctr: number
          date: string
          id: string
          impressions: number
          revenue: number | null
          spend: number
        }
        Insert: {
          campaignId: string
          clicks: number
          conversions: number
          cpc: number
          createdAt?: string
          ctr: number
          date: string
          id: string
          impressions: number
          revenue?: number | null
          spend: number
        }
        Update: {
          campaignId?: string
          clicks?: number
          conversions?: number
          cpc?: number
          createdAt?: string
          ctr?: number
          date?: string
          id?: string
          impressions?: number
          revenue?: number | null
          spend?: number
        }
        Relationships: [
          {
            foreignKeyName: "Analytics_campaignId_fkey"
            columns: ["campaignId"]
            isOneToOne: false
            referencedRelation: "Campaign"
            referencedColumns: ["id"]
          },
        ]
      }
      ApiKey: {
        Row: {
          createdAt: string
          expiresAt: string | null
          id: string
          isActive: boolean
          key: string
          lastUsedAt: string | null
          name: string
          permissions: Json | null
          prefix: string
          rateLimit: number | null
          usageCount: number
          userId: string
        }
        Insert: {
          createdAt?: string
          expiresAt?: string | null
          id: string
          isActive?: boolean
          key: string
          lastUsedAt?: string | null
          name: string
          permissions?: Json | null
          prefix: string
          rateLimit?: number | null
          usageCount?: number
          userId: string
        }
        Update: {
          createdAt?: string
          expiresAt?: string | null
          id?: string
          isActive?: boolean
          key?: string
          lastUsedAt?: string | null
          name?: string
          permissions?: Json | null
          prefix?: string
          rateLimit?: number | null
          usageCount?: number
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "ApiKey_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Banner: {
        Row: {
          createdAt: string | null
          endsAt: string | null
          id: string
          imageUrl: string
          isActive: boolean | null
          link: string | null
          mobileImageUrl: string | null
          name: string
          order: number | null
          position: string
          startsAt: string | null
          updatedAt: string | null
        }
        Insert: {
          createdAt?: string | null
          endsAt?: string | null
          id?: string
          imageUrl: string
          isActive?: boolean | null
          link?: string | null
          mobileImageUrl?: string | null
          name: string
          order?: number | null
          position: string
          startsAt?: string | null
          updatedAt?: string | null
        }
        Update: {
          createdAt?: string | null
          endsAt?: string | null
          id?: string
          imageUrl?: string
          isActive?: boolean | null
          link?: string | null
          mobileImageUrl?: string | null
          name?: string
          order?: number | null
          position?: string
          startsAt?: string | null
          updatedAt?: string | null
        }
        Relationships: []
      }
      Campaign: {
        Row: {
          budgetDaily: number | null
          budgetSpent: number
          budgetTotal: number
          clicks: number
          conversions: number
          cpc: number
          createdAt: string
          ctr: number
          endDate: string | null
          id: string
          impressions: number
          name: string
          objective: string
          platform: Database["public"]["Enums"]["Platform"]
          roi: number
          startDate: string
          status: Database["public"]["Enums"]["CampaignStatus"]
          targeting: Json
          updatedAt: string
          userId: string
        }
        Insert: {
          budgetDaily?: number | null
          budgetSpent?: number
          budgetTotal: number
          clicks?: number
          conversions?: number
          cpc?: number
          createdAt?: string
          ctr?: number
          endDate?: string | null
          id: string
          impressions?: number
          name: string
          objective: string
          platform: Database["public"]["Enums"]["Platform"]
          roi?: number
          startDate: string
          status?: Database["public"]["Enums"]["CampaignStatus"]
          targeting: Json
          updatedAt: string
          userId: string
        }
        Update: {
          budgetDaily?: number | null
          budgetSpent?: number
          budgetTotal?: number
          clicks?: number
          conversions?: number
          cpc?: number
          createdAt?: string
          ctr?: number
          endDate?: string | null
          id?: string
          impressions?: number
          name?: string
          objective?: string
          platform?: Database["public"]["Enums"]["Platform"]
          roi?: number
          startDate?: string
          status?: Database["public"]["Enums"]["CampaignStatus"]
          targeting?: Json
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Campaign_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Cart: {
        Row: {
          couponCode: string | null
          createdAt: string | null
          customerId: string | null
          discount: number | null
          expiresAt: string | null
          id: string
          items: Json
          sessionId: string
          shipping: number | null
          subtotal: number | null
          total: number | null
          updatedAt: string | null
          userId: string | null
        }
        Insert: {
          couponCode?: string | null
          createdAt?: string | null
          customerId?: string | null
          discount?: number | null
          expiresAt?: string | null
          id?: string
          items?: Json
          sessionId: string
          shipping?: number | null
          subtotal?: number | null
          total?: number | null
          updatedAt?: string | null
          userId?: string | null
        }
        Update: {
          couponCode?: string | null
          createdAt?: string | null
          customerId?: string | null
          discount?: number | null
          expiresAt?: string | null
          id?: string
          items?: Json
          sessionId?: string
          shipping?: number | null
          subtotal?: number | null
          total?: number | null
          updatedAt?: string | null
          userId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Cart_customerId_fkey"
            columns: ["customerId"]
            isOneToOne: false
            referencedRelation: "Customer"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Cart_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      CartItem: {
        Row: {
          cartId: string
          createdAt: string | null
          discount: number | null
          id: string
          originalPrice: number | null
          price: number
          productId: string
          quantity: number
          total: number
          updatedAt: string | null
          variantId: string | null
        }
        Insert: {
          cartId: string
          createdAt?: string | null
          discount?: number | null
          id?: string
          originalPrice?: number | null
          price: number
          productId: string
          quantity?: number
          total: number
          updatedAt?: string | null
          variantId?: string | null
        }
        Update: {
          cartId?: string
          createdAt?: string | null
          discount?: number | null
          id?: string
          originalPrice?: number | null
          price?: number
          productId?: string
          quantity?: number
          total?: number
          updatedAt?: string | null
          variantId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "CartItem_cartId_fkey"
            columns: ["cartId"]
            isOneToOne: false
            referencedRelation: "Cart"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "CartItem_productId_fkey"
            columns: ["productId"]
            isOneToOne: false
            referencedRelation: "Product"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "CartItem_variantId_fkey"
            columns: ["variantId"]
            isOneToOne: false
            referencedRelation: "ProductVariant"
            referencedColumns: ["id"]
          },
        ]
      }
      Category: {
        Row: {
          createdAt: string | null
          description: string | null
          id: string
          imageUrl: string | null
          isPublished: boolean | null
          name: string
          parentId: string | null
          position: number | null
          slug: string
          updatedAt: string | null
          userId: string | null
        }
        Insert: {
          createdAt?: string | null
          description?: string | null
          id?: string
          imageUrl?: string | null
          isPublished?: boolean | null
          name: string
          parentId?: string | null
          position?: number | null
          slug: string
          updatedAt?: string | null
          userId?: string | null
        }
        Update: {
          createdAt?: string | null
          description?: string | null
          id?: string
          imageUrl?: string | null
          isPublished?: boolean | null
          name?: string
          parentId?: string | null
          position?: number | null
          slug?: string
          updatedAt?: string | null
          userId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Category_parentId_fkey"
            columns: ["parentId"]
            isOneToOne: false
            referencedRelation: "Category"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Category_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      ChatConversation: {
        Row: {
          createdAt: string
          id: string
          title: string
          updatedAt: string
          userId: string
        }
        Insert: {
          createdAt?: string
          id: string
          title: string
          updatedAt: string
          userId: string
        }
        Update: {
          createdAt?: string
          id?: string
          title?: string
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "ChatConversation_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      ChatMessage: {
        Row: {
          content: string
          conversationId: string
          createdAt: string
          id: string
          model: string | null
          role: Database["public"]["Enums"]["MessageRole"]
          tokens: number | null
          userId: string
        }
        Insert: {
          content: string
          conversationId: string
          createdAt?: string
          id: string
          model?: string | null
          role: Database["public"]["Enums"]["MessageRole"]
          tokens?: number | null
          userId: string
        }
        Update: {
          content?: string
          conversationId?: string
          createdAt?: string
          id?: string
          model?: string | null
          role?: Database["public"]["Enums"]["MessageRole"]
          tokens?: number | null
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "ChatMessage_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      CheckoutCustomization: {
        Row: {
          createdAt: string | null
          id: string
          isActive: boolean | null
          name: string
          theme: Json
          updatedAt: string | null
        }
        Insert: {
          createdAt?: string | null
          id?: string
          isActive?: boolean | null
          name?: string
          theme?: Json
          updatedAt?: string | null
        }
        Update: {
          createdAt?: string | null
          id?: string
          isActive?: boolean | null
          name?: string
          theme?: Json
          updatedAt?: string | null
        }
        Relationships: []
      }
      CheckoutSection: {
        Row: {
          config: Json
          createdAt: string | null
          customizationId: string
          id: string
          isVisible: boolean | null
          order: number | null
          type: string
          updatedAt: string | null
        }
        Insert: {
          config?: Json
          createdAt?: string | null
          customizationId: string
          id?: string
          isVisible?: boolean | null
          order?: number | null
          type: string
          updatedAt?: string | null
        }
        Update: {
          config?: Json
          createdAt?: string | null
          customizationId?: string
          id?: string
          isVisible?: boolean | null
          order?: number | null
          type?: string
          updatedAt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "CheckoutSection_customizationId_fkey"
            columns: ["customizationId"]
            isOneToOne: false
            referencedRelation: "CheckoutCustomization"
            referencedColumns: ["id"]
          },
        ]
      }
      Collection: {
        Row: {
          createdAt: string | null
          description: string | null
          id: string
          imageUrl: string | null
          isPublished: boolean | null
          name: string
          productIds: string[] | null
          rules: Json | null
          slug: string
          sortOrder: string | null
          updatedAt: string | null
          userId: string | null
        }
        Insert: {
          createdAt?: string | null
          description?: string | null
          id?: string
          imageUrl?: string | null
          isPublished?: boolean | null
          name: string
          productIds?: string[] | null
          rules?: Json | null
          slug: string
          sortOrder?: string | null
          updatedAt?: string | null
          userId?: string | null
        }
        Update: {
          createdAt?: string | null
          description?: string | null
          id?: string
          imageUrl?: string | null
          isPublished?: boolean | null
          name?: string
          productIds?: string[] | null
          rules?: Json | null
          slug?: string
          sortOrder?: string | null
          updatedAt?: string | null
          userId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Collection_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Coupon: {
        Row: {
          code: string
          createdAt: string | null
          description: string | null
          expiresAt: string | null
          id: string
          isActive: boolean | null
          maxDiscountAmount: number | null
          minPurchaseAmount: number | null
          name: string
          perCustomerLimit: number | null
          startsAt: string | null
          type: string
          updatedAt: string | null
          usageCount: number | null
          usageLimit: number | null
          value: number
        }
        Insert: {
          code: string
          createdAt?: string | null
          description?: string | null
          expiresAt?: string | null
          id?: string
          isActive?: boolean | null
          maxDiscountAmount?: number | null
          minPurchaseAmount?: number | null
          name: string
          perCustomerLimit?: number | null
          startsAt?: string | null
          type: string
          updatedAt?: string | null
          usageCount?: number | null
          usageLimit?: number | null
          value: number
        }
        Update: {
          code?: string
          createdAt?: string | null
          description?: string | null
          expiresAt?: string | null
          id?: string
          isActive?: boolean | null
          maxDiscountAmount?: number | null
          minPurchaseAmount?: number | null
          name?: string
          perCustomerLimit?: number | null
          startsAt?: string | null
          type?: string
          updatedAt?: string | null
          usageCount?: number | null
          usageLimit?: number | null
          value?: number
        }
        Relationships: []
      }
      CouponUsage: {
        Row: {
          couponId: string
          customerId: string
          discountAmount: number
          id: string
          orderId: string
          usedAt: string | null
        }
        Insert: {
          couponId: string
          customerId: string
          discountAmount: number
          id?: string
          orderId: string
          usedAt?: string | null
        }
        Update: {
          couponId?: string
          customerId?: string
          discountAmount?: number
          id?: string
          orderId?: string
          usedAt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "CouponUsage_couponId_fkey"
            columns: ["couponId"]
            isOneToOne: false
            referencedRelation: "Coupon"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "CouponUsage_customerId_fkey"
            columns: ["customerId"]
            isOneToOne: false
            referencedRelation: "Customer"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "CouponUsage_orderId_fkey"
            columns: ["orderId"]
            isOneToOne: false
            referencedRelation: "Order"
            referencedColumns: ["id"]
          },
        ]
      }
      CrossSell: {
        Row: {
          createdAt: string | null
          description: string | null
          discountType: string | null
          discountValue: number | null
          id: string
          isActive: boolean | null
          name: string
          position: string | null
          productId: string
          relatedProductIds: string[]
          title: string | null
          updatedAt: string | null
        }
        Insert: {
          createdAt?: string | null
          description?: string | null
          discountType?: string | null
          discountValue?: number | null
          id?: string
          isActive?: boolean | null
          name: string
          position?: string | null
          productId: string
          relatedProductIds: string[]
          title?: string | null
          updatedAt?: string | null
        }
        Update: {
          createdAt?: string | null
          description?: string | null
          discountType?: string | null
          discountValue?: number | null
          id?: string
          isActive?: boolean | null
          name?: string
          position?: string | null
          productId?: string
          relatedProductIds?: string[]
          title?: string | null
          updatedAt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "CrossSell_productId_fkey"
            columns: ["productId"]
            isOneToOne: false
            referencedRelation: "Product"
            referencedColumns: ["id"]
          },
        ]
      }
      Customer: {
        Row: {
          acceptsMarketing: boolean | null
          averageOrderValue: number | null
          birthDate: string | null
          cpf: string | null
          createdAt: string | null
          email: string
          gender: string | null
          id: string
          lastOrderAt: string | null
          name: string
          notes: string | null
          phone: string | null
          status: string | null
          tags: string[] | null
          totalOrders: number | null
          totalSpent: number | null
          updatedAt: string | null
          userId: string | null
        }
        Insert: {
          acceptsMarketing?: boolean | null
          averageOrderValue?: number | null
          birthDate?: string | null
          cpf?: string | null
          createdAt?: string | null
          email: string
          gender?: string | null
          id?: string
          lastOrderAt?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          status?: string | null
          tags?: string[] | null
          totalOrders?: number | null
          totalSpent?: number | null
          updatedAt?: string | null
          userId?: string | null
        }
        Update: {
          acceptsMarketing?: boolean | null
          averageOrderValue?: number | null
          birthDate?: string | null
          cpf?: string | null
          createdAt?: string | null
          email?: string
          gender?: string | null
          id?: string
          lastOrderAt?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          status?: string | null
          tags?: string[] | null
          totalOrders?: number | null
          totalSpent?: number | null
          updatedAt?: string | null
          userId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Customer_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      CustomerAddress: {
        Row: {
          city: string
          complement: string | null
          country: string | null
          createdAt: string | null
          customerId: string
          id: string
          isDefault: boolean | null
          label: string | null
          neighborhood: string
          number: string
          state: string
          street: string
          zipCode: string
        }
        Insert: {
          city: string
          complement?: string | null
          country?: string | null
          createdAt?: string | null
          customerId: string
          id?: string
          isDefault?: boolean | null
          label?: string | null
          neighborhood: string
          number: string
          state: string
          street: string
          zipCode: string
        }
        Update: {
          city?: string
          complement?: string | null
          country?: string | null
          createdAt?: string | null
          customerId?: string
          id?: string
          isDefault?: boolean | null
          label?: string | null
          neighborhood?: string
          number?: string
          state?: string
          street?: string
          zipCode?: string
        }
        Relationships: [
          {
            foreignKeyName: "CustomerAddress_customerId_fkey"
            columns: ["customerId"]
            isOneToOne: false
            referencedRelation: "Customer"
            referencedColumns: ["id"]
          },
        ]
      }
      Discount: {
        Row: {
          applyTo: string
          collectionIds: string[] | null
          createdAt: string | null
          description: string | null
          expiresAt: string | null
          id: string
          isActive: boolean | null
          minPurchaseAmount: number | null
          minQuantity: number | null
          name: string
          priority: number | null
          productIds: string[] | null
          startsAt: string | null
          type: string
          updatedAt: string | null
          value: number
        }
        Insert: {
          applyTo: string
          collectionIds?: string[] | null
          createdAt?: string | null
          description?: string | null
          expiresAt?: string | null
          id?: string
          isActive?: boolean | null
          minPurchaseAmount?: number | null
          minQuantity?: number | null
          name: string
          priority?: number | null
          productIds?: string[] | null
          startsAt?: string | null
          type: string
          updatedAt?: string | null
          value: number
        }
        Update: {
          applyTo?: string
          collectionIds?: string[] | null
          createdAt?: string | null
          description?: string | null
          expiresAt?: string | null
          id?: string
          isActive?: boolean | null
          minPurchaseAmount?: number | null
          minQuantity?: number | null
          name?: string
          priority?: number | null
          productIds?: string[] | null
          startsAt?: string | null
          type?: string
          updatedAt?: string | null
          value?: number
        }
        Relationships: []
      }
      Gateway: {
        Row: {
          createdAt: string | null
          description: string | null
          documentation: string | null
          id: string
          isActive: boolean | null
          isPopular: boolean | null
          logoUrl: string | null
          name: string
          requiredFields: Json | null
          slug: string
          supportsBoleto: boolean | null
          supportsCreditCard: boolean | null
          supportsDebit: boolean | null
          supportsPix: boolean | null
          type: string
          updatedAt: string | null
          webhookUrl: string | null
        }
        Insert: {
          createdAt?: string | null
          description?: string | null
          documentation?: string | null
          id?: string
          isActive?: boolean | null
          isPopular?: boolean | null
          logoUrl?: string | null
          name: string
          requiredFields?: Json | null
          slug: string
          supportsBoleto?: boolean | null
          supportsCreditCard?: boolean | null
          supportsDebit?: boolean | null
          supportsPix?: boolean | null
          type: string
          updatedAt?: string | null
          webhookUrl?: string | null
        }
        Update: {
          createdAt?: string | null
          description?: string | null
          documentation?: string | null
          id?: string
          isActive?: boolean | null
          isPopular?: boolean | null
          logoUrl?: string | null
          name?: string
          requiredFields?: Json | null
          slug?: string
          supportsBoleto?: boolean | null
          supportsCreditCard?: boolean | null
          supportsDebit?: boolean | null
          supportsPix?: boolean | null
          type?: string
          updatedAt?: string | null
          webhookUrl?: string | null
        }
        Relationships: []
      }
      GatewayConfig: {
        Row: {
          boletoFee: number | null
          createdAt: string | null
          credentials: Json
          creditCardFee: number | null
          gatewayId: string
          id: string
          isActive: boolean | null
          isDefault: boolean | null
          isTestMode: boolean | null
          maxAmount: number | null
          minAmount: number | null
          pixFee: number | null
          updatedAt: string | null
          userId: string | null
          webhookUrl: string | null
        }
        Insert: {
          boletoFee?: number | null
          createdAt?: string | null
          credentials: Json
          creditCardFee?: number | null
          gatewayId: string
          id?: string
          isActive?: boolean | null
          isDefault?: boolean | null
          isTestMode?: boolean | null
          maxAmount?: number | null
          minAmount?: number | null
          pixFee?: number | null
          updatedAt?: string | null
          userId?: string | null
          webhookUrl?: string | null
        }
        Update: {
          boletoFee?: number | null
          createdAt?: string | null
          credentials?: Json
          creditCardFee?: number | null
          gatewayId?: string
          id?: string
          isActive?: boolean | null
          isDefault?: boolean | null
          isTestMode?: boolean | null
          maxAmount?: number | null
          minAmount?: number | null
          pixFee?: number | null
          updatedAt?: string | null
          userId?: string | null
          webhookUrl?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "GatewayConfig_gatewayId_fkey"
            columns: ["gatewayId"]
            isOneToOne: false
            referencedRelation: "Gateway"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "GatewayConfig_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      GlobalAiConnection: {
        Row: {
          apiKey: string
          apiKeyEncrypted: string | null
          baseUrl: string | null
          createdAt: string | null
          id: string
          initialGreetings: string[] | null
          isActive: boolean | null
          maxTokens: number | null
          model: string | null
          name: string
          provider: string
          systemPrompt: string | null
          temperature: number | null
        }
        Insert: {
          apiKey: string
          apiKeyEncrypted?: string | null
          baseUrl?: string | null
          createdAt?: string | null
          id?: string
          initialGreetings?: string[] | null
          isActive?: boolean | null
          maxTokens?: number | null
          model?: string | null
          name: string
          provider: string
          systemPrompt?: string | null
          temperature?: number | null
        }
        Update: {
          apiKey?: string
          apiKeyEncrypted?: string | null
          baseUrl?: string | null
          createdAt?: string | null
          id?: string
          initialGreetings?: string[] | null
          isActive?: boolean | null
          maxTokens?: number | null
          model?: string | null
          name?: string
          provider?: string
          systemPrompt?: string | null
          temperature?: number | null
        }
        Relationships: []
      }
      Integration: {
        Row: {
          createdAt: string
          credentials: Json | null
          errorMessage: string | null
          id: string
          isConnected: boolean
          lastSyncAt: string | null
          platform: Database["public"]["Enums"]["IntegrationPlatform"]
          syncStatus: string | null
          updatedAt: string
          userId: string
        }
        Insert: {
          createdAt?: string
          credentials?: Json | null
          errorMessage?: string | null
          id: string
          isConnected?: boolean
          lastSyncAt?: string | null
          platform: Database["public"]["Enums"]["IntegrationPlatform"]
          syncStatus?: string | null
          updatedAt: string
          userId: string
        }
        Update: {
          createdAt?: string
          credentials?: Json | null
          errorMessage?: string | null
          id?: string
          isConnected?: boolean
          lastSyncAt?: string | null
          platform?: Database["public"]["Enums"]["IntegrationPlatform"]
          syncStatus?: string | null
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Integration_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Kit: {
        Row: {
          createdAt: string | null
          description: string | null
          discount: number | null
          finalPrice: number
          id: string
          imageUrl: string | null
          name: string
          slug: string
          status: string | null
          totalPrice: number
          updatedAt: string | null
          userId: string | null
        }
        Insert: {
          createdAt?: string | null
          description?: string | null
          discount?: number | null
          finalPrice: number
          id?: string
          imageUrl?: string | null
          name: string
          slug: string
          status?: string | null
          totalPrice: number
          updatedAt?: string | null
          userId?: string | null
        }
        Update: {
          createdAt?: string | null
          description?: string | null
          discount?: number | null
          finalPrice?: number
          id?: string
          imageUrl?: string | null
          name?: string
          slug?: string
          status?: string | null
          totalPrice?: number
          updatedAt?: string | null
          userId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Kit_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      KitItem: {
        Row: {
          createdAt: string | null
          id: string
          kitId: string
          productId: string
          quantity: number | null
        }
        Insert: {
          createdAt?: string | null
          id?: string
          kitId: string
          productId: string
          quantity?: number | null
        }
        Update: {
          createdAt?: string | null
          id?: string
          kitId?: string
          productId?: string
          quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "KitItem_kitId_fkey"
            columns: ["kitId"]
            isOneToOne: false
            referencedRelation: "Kit"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "KitItem_productId_fkey"
            columns: ["productId"]
            isOneToOne: false
            referencedRelation: "Product"
            referencedColumns: ["id"]
          },
        ]
      }
      Lead: {
        Row: {
          convertedAt: string | null
          createdAt: string | null
          customerId: string | null
          email: string
          id: string
          name: string | null
          notes: string | null
          phone: string | null
          source: string | null
          status: string | null
          updatedAt: string | null
          userId: string | null
          utmCampaign: string | null
          utmMedium: string | null
          utmSource: string | null
        }
        Insert: {
          convertedAt?: string | null
          createdAt?: string | null
          customerId?: string | null
          email: string
          id?: string
          name?: string | null
          notes?: string | null
          phone?: string | null
          source?: string | null
          status?: string | null
          updatedAt?: string | null
          userId?: string | null
          utmCampaign?: string | null
          utmMedium?: string | null
          utmSource?: string | null
        }
        Update: {
          convertedAt?: string | null
          createdAt?: string | null
          customerId?: string | null
          email?: string
          id?: string
          name?: string | null
          notes?: string | null
          phone?: string | null
          source?: string | null
          status?: string | null
          updatedAt?: string | null
          userId?: string | null
          utmCampaign?: string | null
          utmMedium?: string | null
          utmSource?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Lead_customerId_fkey"
            columns: ["customerId"]
            isOneToOne: false
            referencedRelation: "Customer"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Lead_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      MediaGeneration: {
        Row: {
          cost: number | null
          createdAt: string | null
          duration: number | null
          id: string
          metadata: Json | null
          prompt: string
          provider: string
          size: string | null
          status: string | null
          type: string
          url: string
          userId: string
        }
        Insert: {
          cost?: number | null
          createdAt?: string | null
          duration?: number | null
          id?: string
          metadata?: Json | null
          prompt: string
          provider: string
          size?: string | null
          status?: string | null
          type: string
          url: string
          userId: string
        }
        Update: {
          cost?: number | null
          createdAt?: string | null
          duration?: number | null
          id?: string
          metadata?: Json | null
          prompt?: string
          provider?: string
          size?: string | null
          status?: string | null
          type?: string
          url?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "MediaGeneration_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Notification: {
        Row: {
          actionUrl: string | null
          createdAt: string
          id: string
          isRead: boolean
          message: string
          metadata: Json | null
          readAt: string | null
          title: string
          type: Database["public"]["Enums"]["NotificationType"]
          userId: string
        }
        Insert: {
          actionUrl?: string | null
          createdAt?: string
          id: string
          isRead?: boolean
          message: string
          metadata?: Json | null
          readAt?: string | null
          title: string
          type: Database["public"]["Enums"]["NotificationType"]
          userId: string
        }
        Update: {
          actionUrl?: string | null
          createdAt?: string
          id?: string
          isRead?: boolean
          message?: string
          metadata?: Json | null
          readAt?: string | null
          title?: string
          type?: Database["public"]["Enums"]["NotificationType"]
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Notification_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      OAuthConfig: {
        Row: {
          clientId: string
          clientSecret: string
          createdAt: string | null
          isActive: boolean
          platform: string
          scopes: string[]
          updatedAt: string | null
        }
        Insert: {
          clientId: string
          clientSecret: string
          createdAt?: string | null
          isActive?: boolean
          platform: string
          scopes?: string[]
          updatedAt?: string | null
        }
        Update: {
          clientId?: string
          clientSecret?: string
          createdAt?: string | null
          isActive?: boolean
          platform?: string
          scopes?: string[]
          updatedAt?: string | null
        }
        Relationships: []
      }
      OAuthState: {
        Row: {
          createdAt: string
          expiresAt: string
          id: string
          integrationSlug: string
          state: string
          userId: string
        }
        Insert: {
          createdAt?: string
          expiresAt: string
          id?: string
          integrationSlug: string
          state: string
          userId: string
        }
        Update: {
          createdAt?: string
          expiresAt?: string
          id?: string
          integrationSlug?: string
          state?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "OAuthState_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Order: {
        Row: {
          billingAddress: Json | null
          cartId: string | null
          couponCode: string | null
          couponDiscount: number | null
          createdAt: string | null
          customerCpf: string | null
          customerEmail: string
          customerId: string
          customerName: string
          customerPhone: string | null
          deliveredAt: string | null
          discount: number | null
          id: string
          items: Json
          metadata: Json | null
          notes: string | null
          orderNumber: string
          paidAt: string | null
          paymentMethod: string
          paymentStatus: string | null
          shippedAt: string | null
          shipping: number | null
          shippingAddress: Json
          shippingCarrier: string | null
          status: string | null
          subtotal: number
          tax: number | null
          total: number
          trackingCode: string | null
          updatedAt: string | null
          userId: string | null
          utmCampaign: string | null
          utmMedium: string | null
          utmSource: string | null
        }
        Insert: {
          billingAddress?: Json | null
          cartId?: string | null
          couponCode?: string | null
          couponDiscount?: number | null
          createdAt?: string | null
          customerCpf?: string | null
          customerEmail: string
          customerId: string
          customerName: string
          customerPhone?: string | null
          deliveredAt?: string | null
          discount?: number | null
          id?: string
          items: Json
          metadata?: Json | null
          notes?: string | null
          orderNumber: string
          paidAt?: string | null
          paymentMethod: string
          paymentStatus?: string | null
          shippedAt?: string | null
          shipping?: number | null
          shippingAddress: Json
          shippingCarrier?: string | null
          status?: string | null
          subtotal: number
          tax?: number | null
          total: number
          trackingCode?: string | null
          updatedAt?: string | null
          userId?: string | null
          utmCampaign?: string | null
          utmMedium?: string | null
          utmSource?: string | null
        }
        Update: {
          billingAddress?: Json | null
          cartId?: string | null
          couponCode?: string | null
          couponDiscount?: number | null
          createdAt?: string | null
          customerCpf?: string | null
          customerEmail?: string
          customerId?: string
          customerName?: string
          customerPhone?: string | null
          deliveredAt?: string | null
          discount?: number | null
          id?: string
          items?: Json
          metadata?: Json | null
          notes?: string | null
          orderNumber?: string
          paidAt?: string | null
          paymentMethod?: string
          paymentStatus?: string | null
          shippedAt?: string | null
          shipping?: number | null
          shippingAddress?: Json
          shippingCarrier?: string | null
          status?: string | null
          subtotal?: number
          tax?: number | null
          total?: number
          trackingCode?: string | null
          updatedAt?: string | null
          userId?: string | null
          utmCampaign?: string | null
          utmMedium?: string | null
          utmSource?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Order_cartId_fkey"
            columns: ["cartId"]
            isOneToOne: false
            referencedRelation: "Cart"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Order_customerId_fkey"
            columns: ["customerId"]
            isOneToOne: false
            referencedRelation: "Customer"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Order_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      OrderBump: {
        Row: {
          createdAt: string | null
          description: string | null
          discountType: string | null
          discountValue: number | null
          id: string
          isActive: boolean | null
          name: string
          position: string | null
          productId: string
          title: string
          triggerProductIds: string[] | null
          updatedAt: string | null
        }
        Insert: {
          createdAt?: string | null
          description?: string | null
          discountType?: string | null
          discountValue?: number | null
          id?: string
          isActive?: boolean | null
          name: string
          position?: string | null
          productId: string
          title: string
          triggerProductIds?: string[] | null
          updatedAt?: string | null
        }
        Update: {
          createdAt?: string | null
          description?: string | null
          discountType?: string | null
          discountValue?: number | null
          id?: string
          isActive?: boolean | null
          name?: string
          position?: string | null
          productId?: string
          title?: string
          triggerProductIds?: string[] | null
          updatedAt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "OrderBump_productId_fkey"
            columns: ["productId"]
            isOneToOne: false
            referencedRelation: "Product"
            referencedColumns: ["id"]
          },
        ]
      }
      OrderHistory: {
        Row: {
          action: string
          createdAt: string | null
          fromStatus: string | null
          id: string
          metadata: Json | null
          notes: string | null
          orderId: string
          toStatus: string | null
          userId: string | null
        }
        Insert: {
          action: string
          createdAt?: string | null
          fromStatus?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          orderId: string
          toStatus?: string | null
          userId?: string | null
        }
        Update: {
          action?: string
          createdAt?: string | null
          fromStatus?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          orderId?: string
          toStatus?: string | null
          userId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "OrderHistory_orderId_fkey"
            columns: ["orderId"]
            isOneToOne: false
            referencedRelation: "Order"
            referencedColumns: ["id"]
          },
        ]
      }
      OrderItem: {
        Row: {
          createdAt: string | null
          discount: number | null
          id: string
          imageUrl: string | null
          name: string
          orderId: string
          price: number
          productId: string | null
          quantity: number
          sku: string | null
          total: number
          variantId: string | null
        }
        Insert: {
          createdAt?: string | null
          discount?: number | null
          id?: string
          imageUrl?: string | null
          name: string
          orderId: string
          price: number
          productId?: string | null
          quantity: number
          sku?: string | null
          total: number
          variantId?: string | null
        }
        Update: {
          createdAt?: string | null
          discount?: number | null
          id?: string
          imageUrl?: string | null
          name?: string
          orderId?: string
          price?: number
          productId?: string | null
          quantity?: number
          sku?: string | null
          total?: number
          variantId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "OrderItem_orderId_fkey"
            columns: ["orderId"]
            isOneToOne: false
            referencedRelation: "Order"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "OrderItem_productId_fkey"
            columns: ["productId"]
            isOneToOne: false
            referencedRelation: "Product"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "OrderItem_variantId_fkey"
            columns: ["variantId"]
            isOneToOne: false
            referencedRelation: "ProductVariant"
            referencedColumns: ["id"]
          },
        ]
      }
      PendingInvite: {
        Row: {
          acceptedAt: string | null
          createdAt: string | null
          email: string
          expiresAt: string
          id: string
          invitedBy: string | null
          organizationId: string | null
          role: string
          status: string
        }
        Insert: {
          acceptedAt?: string | null
          createdAt?: string | null
          email: string
          expiresAt: string
          id: string
          invitedBy?: string | null
          organizationId?: string | null
          role: string
          status?: string
        }
        Update: {
          acceptedAt?: string | null
          createdAt?: string | null
          email?: string
          expiresAt?: string
          id?: string
          invitedBy?: string | null
          organizationId?: string | null
          role?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "PendingInvite_invitedBy_fkey"
            columns: ["invitedBy"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Pixel: {
        Row: {
          createdAt: string | null
          events: string[] | null
          id: string
          isActive: boolean | null
          pixelId: string
          platform: string
          updatedAt: string | null
        }
        Insert: {
          createdAt?: string | null
          events?: string[] | null
          id?: string
          isActive?: boolean | null
          pixelId: string
          platform: string
          updatedAt?: string | null
        }
        Update: {
          createdAt?: string | null
          events?: string[] | null
          id?: string
          isActive?: boolean | null
          pixelId?: string
          platform?: string
          updatedAt?: string | null
        }
        Relationships: []
      }
      PixelEvent: {
        Row: {
          data: Json | null
          event: string
          firedAt: string | null
          id: string
          pixelId: string
        }
        Insert: {
          data?: Json | null
          event: string
          firedAt?: string | null
          id?: string
          pixelId: string
        }
        Update: {
          data?: Json | null
          event?: string
          firedAt?: string | null
          id?: string
          pixelId?: string
        }
        Relationships: [
          {
            foreignKeyName: "PixelEvent_pixelId_fkey"
            columns: ["pixelId"]
            isOneToOne: false
            referencedRelation: "Pixel"
            referencedColumns: ["id"]
          },
        ]
      }
      Product: {
        Row: {
          barcode: string | null
          categoryId: string | null
          comparePrice: number | null
          cost: number | null
          createdAt: string | null
          description: string | null
          height: number | null
          id: string
          isActive: boolean | null
          isFeatured: boolean | null
          length: number | null
          lowStockThreshold: number | null
          metadata: Json | null
          name: string
          price: number
          shortDescription: string | null
          sku: string | null
          slug: string
          status: string | null
          stock: number | null
          tags: string[] | null
          trackStock: boolean | null
          updatedAt: string | null
          userId: string | null
          weight: number | null
          width: number | null
        }
        Insert: {
          barcode?: string | null
          categoryId?: string | null
          comparePrice?: number | null
          cost?: number | null
          createdAt?: string | null
          description?: string | null
          height?: number | null
          id?: string
          isActive?: boolean | null
          isFeatured?: boolean | null
          length?: number | null
          lowStockThreshold?: number | null
          metadata?: Json | null
          name: string
          price: number
          shortDescription?: string | null
          sku?: string | null
          slug: string
          status?: string | null
          stock?: number | null
          tags?: string[] | null
          trackStock?: boolean | null
          updatedAt?: string | null
          userId?: string | null
          weight?: number | null
          width?: number | null
        }
        Update: {
          barcode?: string | null
          categoryId?: string | null
          comparePrice?: number | null
          cost?: number | null
          createdAt?: string | null
          description?: string | null
          height?: number | null
          id?: string
          isActive?: boolean | null
          isFeatured?: boolean | null
          length?: number | null
          lowStockThreshold?: number | null
          metadata?: Json | null
          name?: string
          price?: number
          shortDescription?: string | null
          sku?: string | null
          slug?: string
          status?: string | null
          stock?: number | null
          tags?: string[] | null
          trackStock?: boolean | null
          updatedAt?: string | null
          userId?: string | null
          weight?: number | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "Product_categoryId_fkey"
            columns: ["categoryId"]
            isOneToOne: false
            referencedRelation: "Category"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Product_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      ProductImage: {
        Row: {
          altText: string | null
          createdAt: string | null
          id: string
          position: number | null
          productId: string
          url: string
          variantId: string | null
        }
        Insert: {
          altText?: string | null
          createdAt?: string | null
          id?: string
          position?: number | null
          productId: string
          url: string
          variantId?: string | null
        }
        Update: {
          altText?: string | null
          createdAt?: string | null
          id?: string
          position?: number | null
          productId?: string
          url?: string
          variantId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ProductImage_productId_fkey"
            columns: ["productId"]
            isOneToOne: false
            referencedRelation: "Product"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ProductImage_variantId_fkey"
            columns: ["variantId"]
            isOneToOne: false
            referencedRelation: "ProductVariant"
            referencedColumns: ["id"]
          },
        ]
      }
      ProductVariant: {
        Row: {
          barcode: string | null
          comparePrice: number | null
          cost: number | null
          createdAt: string | null
          id: string
          isDefault: boolean | null
          name: string
          options: Json | null
          price: number | null
          productId: string
          sku: string | null
          stock: number | null
          trackStock: boolean | null
          updatedAt: string | null
        }
        Insert: {
          barcode?: string | null
          comparePrice?: number | null
          cost?: number | null
          createdAt?: string | null
          id?: string
          isDefault?: boolean | null
          name: string
          options?: Json | null
          price?: number | null
          productId: string
          sku?: string | null
          stock?: number | null
          trackStock?: boolean | null
          updatedAt?: string | null
        }
        Update: {
          barcode?: string | null
          comparePrice?: number | null
          cost?: number | null
          createdAt?: string | null
          id?: string
          isDefault?: boolean | null
          name?: string
          options?: Json | null
          price?: number | null
          productId?: string
          sku?: string | null
          stock?: number | null
          trackStock?: boolean | null
          updatedAt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ProductVariant_productId_fkey"
            columns: ["productId"]
            isOneToOne: false
            referencedRelation: "Product"
            referencedColumns: ["id"]
          },
        ]
      }
      RefreshToken: {
        Row: {
          createdAt: string
          expiresAt: string
          id: string
          token: string
          userId: string
        }
        Insert: {
          createdAt?: string
          expiresAt: string
          id: string
          token: string
          userId: string
        }
        Update: {
          createdAt?: string
          expiresAt?: string
          id?: string
          token?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "RefreshToken_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Shipping: {
        Row: {
          carrier: string | null
          createdAt: string | null
          estimatedDays: number | null
          id: string
          isActive: boolean | null
          minOrderValue: number | null
          name: string
          price: number | null
          type: string
          updatedAt: string | null
          zones: string[] | null
        }
        Insert: {
          carrier?: string | null
          createdAt?: string | null
          estimatedDays?: number | null
          id?: string
          isActive?: boolean | null
          minOrderValue?: number | null
          name: string
          price?: number | null
          type: string
          updatedAt?: string | null
          zones?: string[] | null
        }
        Update: {
          carrier?: string | null
          createdAt?: string | null
          estimatedDays?: number | null
          id?: string
          isActive?: boolean | null
          minOrderValue?: number | null
          name?: string
          price?: number | null
          type?: string
          updatedAt?: string | null
          zones?: string[] | null
        }
        Relationships: []
      }
      SocialProof: {
        Row: {
          createdAt: string | null
          display: Json
          id: string
          isActive: boolean | null
          message: string
          triggers: Json | null
          type: string
          updatedAt: string | null
        }
        Insert: {
          createdAt?: string | null
          display?: Json
          id?: string
          isActive?: boolean | null
          message: string
          triggers?: Json | null
          type: string
          updatedAt?: string | null
        }
        Update: {
          createdAt?: string | null
          display?: Json
          id?: string
          isActive?: boolean | null
          message?: string
          triggers?: Json | null
          type?: string
          updatedAt?: string | null
        }
        Relationships: []
      }
      Subscription: {
        Row: {
          createdAt: string | null
          currentPeriodEnd: string | null
          currentPeriodStart: string | null
          id: string
          plan: string
          status: string
          stripeCustomerId: string | null
          stripeSubscriptionId: string | null
        }
        Insert: {
          createdAt?: string | null
          currentPeriodEnd?: string | null
          currentPeriodStart?: string | null
          id?: string
          plan: string
          status: string
          stripeCustomerId?: string | null
          stripeSubscriptionId?: string | null
        }
        Update: {
          createdAt?: string | null
          currentPeriodEnd?: string | null
          currentPeriodStart?: string | null
          id?: string
          plan?: string
          status?: string
          stripeCustomerId?: string | null
          stripeSubscriptionId?: string | null
        }
        Relationships: []
      }
      SuperAdmin: {
        Row: {
          createdAt: string | null
          email: string
          id: string
          name: string
          updatedAt: string | null
        }
        Insert: {
          createdAt?: string | null
          email: string
          id: string
          name: string
          updatedAt?: string | null
        }
        Update: {
          createdAt?: string | null
          email?: string
          id?: string
          name?: string
          updatedAt?: string | null
        }
        Relationships: []
      }
      Transaction: {
        Row: {
          amount: number
          boletoBarcode: string | null
          boletoExpiresAt: string | null
          boletoUrl: string | null
          cancelledAt: string | null
          cardBrand: string | null
          cardLast4: string | null
          createdAt: string | null
          currency: string | null
          failureReason: string | null
          gatewayFee: number | null
          gatewayId: string
          id: string
          installments: number | null
          metadata: Json | null
          netAmount: number | null
          orderId: string
          paidAt: string | null
          paymentMethod: string
          pixCopyPaste: string | null
          pixExpiresAt: string | null
          pixQrCode: string | null
          processedAt: string | null
          refundedAt: string | null
          status: string | null
          transactionId: string | null
          updatedAt: string | null
          userId: string | null
        }
        Insert: {
          amount: number
          boletoBarcode?: string | null
          boletoExpiresAt?: string | null
          boletoUrl?: string | null
          cancelledAt?: string | null
          cardBrand?: string | null
          cardLast4?: string | null
          createdAt?: string | null
          currency?: string | null
          failureReason?: string | null
          gatewayFee?: number | null
          gatewayId: string
          id?: string
          installments?: number | null
          metadata?: Json | null
          netAmount?: number | null
          orderId: string
          paidAt?: string | null
          paymentMethod: string
          pixCopyPaste?: string | null
          pixExpiresAt?: string | null
          pixQrCode?: string | null
          processedAt?: string | null
          refundedAt?: string | null
          status?: string | null
          transactionId?: string | null
          updatedAt?: string | null
          userId?: string | null
        }
        Update: {
          amount?: number
          boletoBarcode?: string | null
          boletoExpiresAt?: string | null
          boletoUrl?: string | null
          cancelledAt?: string | null
          cardBrand?: string | null
          cardLast4?: string | null
          createdAt?: string | null
          currency?: string | null
          failureReason?: string | null
          gatewayFee?: number | null
          gatewayId?: string
          id?: string
          installments?: number | null
          metadata?: Json | null
          netAmount?: number | null
          orderId?: string
          paidAt?: string | null
          paymentMethod?: string
          pixCopyPaste?: string | null
          pixExpiresAt?: string | null
          pixQrCode?: string | null
          processedAt?: string | null
          refundedAt?: string | null
          status?: string | null
          transactionId?: string | null
          updatedAt?: string | null
          userId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Transaction_gatewayId_fkey"
            columns: ["gatewayId"]
            isOneToOne: false
            referencedRelation: "Gateway"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Transaction_orderId_fkey"
            columns: ["orderId"]
            isOneToOne: false
            referencedRelation: "Order"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Transaction_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Upsell: {
        Row: {
          createdAt: string | null
          description: string | null
          discountType: string | null
          discountValue: number | null
          fromProductId: string
          id: string
          isActive: boolean | null
          name: string
          timing: string | null
          title: string
          toProductId: string
          updatedAt: string | null
        }
        Insert: {
          createdAt?: string | null
          description?: string | null
          discountType?: string | null
          discountValue?: number | null
          fromProductId: string
          id?: string
          isActive?: boolean | null
          name: string
          timing?: string | null
          title: string
          toProductId: string
          updatedAt?: string | null
        }
        Update: {
          createdAt?: string | null
          description?: string | null
          discountType?: string | null
          discountValue?: number | null
          fromProductId?: string
          id?: string
          isActive?: boolean | null
          name?: string
          timing?: string | null
          title?: string
          toProductId?: string
          updatedAt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Upsell_fromProductId_fkey"
            columns: ["fromProductId"]
            isOneToOne: false
            referencedRelation: "Product"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Upsell_toProductId_fkey"
            columns: ["toProductId"]
            isOneToOne: false
            referencedRelation: "Product"
            referencedColumns: ["id"]
          },
        ]
      }
      UsageTracking: {
        Row: {
          count: number | null
          id: string
          metric: string
          period: string
          periodStart: string
        }
        Insert: {
          count?: number | null
          id?: string
          metric: string
          period: string
          periodStart: string
        }
        Update: {
          count?: number | null
          id?: string
          metric?: string
          period?: string
          periodStart?: string
        }
        Relationships: []
      }
      User: {
        Row: {
          authProvider: Database["public"]["Enums"]["AuthProvider"]
          avatar: string | null
          birthDate: string | null
          cpf: string | null
          createdAt: string
          email: string
          emailVerified: boolean | null
          emailVerifiedAt: string | null
          id: string
          isActive: boolean | null
          isSuperAdmin: boolean
          name: string
          password: string | null
          plan: Database["public"]["Enums"]["Plan"]
          providerId: string | null
          role: string | null
          trialEndsAt: string | null
          twoFactorEnabled: boolean | null
          updatedAt: string
        }
        Insert: {
          authProvider?: Database["public"]["Enums"]["AuthProvider"]
          avatar?: string | null
          birthDate?: string | null
          cpf?: string | null
          createdAt?: string
          email: string
          emailVerified?: boolean | null
          emailVerifiedAt?: string | null
          id: string
          isActive?: boolean | null
          isSuperAdmin?: boolean
          name: string
          password?: string | null
          plan?: Database["public"]["Enums"]["Plan"]
          providerId?: string | null
          role?: string | null
          trialEndsAt?: string | null
          twoFactorEnabled?: boolean | null
          updatedAt: string
        }
        Update: {
          authProvider?: Database["public"]["Enums"]["AuthProvider"]
          avatar?: string | null
          birthDate?: string | null
          cpf?: string | null
          createdAt?: string
          email?: string
          emailVerified?: boolean | null
          emailVerifiedAt?: string | null
          id?: string
          isActive?: boolean | null
          isSuperAdmin?: boolean
          name?: string
          password?: string | null
          plan?: Database["public"]["Enums"]["Plan"]
          providerId?: string | null
          role?: string | null
          trialEndsAt?: string | null
          twoFactorEnabled?: boolean | null
          updatedAt?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_oauth_states: { Args: never; Returns: undefined }
      decrypt_api_key: { Args: { encrypted_key: string }; Returns: string }
      execute_admin_query: { Args: { query_text: string }; Returns: Json }
      expire_old_invites: { Args: never; Returns: undefined }
      get_global_organization_id: { Args: never; Returns: string }
      is_service_role: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      log_admin_action: {
        Args: {
          p_action: string
          p_error_message: string
          p_query: string
          p_result: Json
          p_success: boolean
          p_user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      AuthProvider: "EMAIL" | "GOOGLE" | "GITHUB"
      CampaignStatus: "ACTIVE" | "PAUSED" | "COMPLETED" | "DRAFT" | "ARCHIVED"
      IntegrationPlatform:
        | "GOOGLE_ADS"
        | "GOOGLE_ANALYTICS"
        | "META_ADS"
        | "FACEBOOK_BUSINESS"
        | "INSTAGRAM_BUSINESS"
        | "LINKEDIN_ADS"
        | "TIKTOK_ADS"
        | "TWITTER_ADS"
        | "MAILCHIMP"
        | "HUBSPOT"
        | "SHOPIFY"
        | "WORDPRESS"
        | "ZAPIER"
        | "SLACK"
        | "DISCORD"
        | "TELEGRAM"
      MessageRole: "USER" | "ASSISTANT" | "SYSTEM"
      NotificationType:
        | "INFO"
        | "SUCCESS"
        | "WARNING"
        | "ERROR"
        | "CAMPAIGN_STARTED"
        | "CAMPAIGN_ENDED"
        | "BUDGET_ALERT"
        | "PERFORMANCE_ALERT"
        | "INTEGRATION_SUCCESS"
        | "INTEGRATION_ERROR"
        | "TRIAL_ENDING"
        | "PLAN_UPGRADED"
      Plan: "FREE" | "PRO" | "ENTERPRISE"
      Platform:
        | "GOOGLE_ADS"
        | "META_ADS"
        | "FACEBOOK_ADS"
        | "INSTAGRAM_ADS"
        | "LINKEDIN_ADS"
        | "TIKTOK_ADS"
        | "TWITTER_ADS"
        | "PINTEREST_ADS"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      AuthProvider: ["EMAIL", "GOOGLE", "GITHUB"],
      CampaignStatus: ["ACTIVE", "PAUSED", "COMPLETED", "DRAFT", "ARCHIVED"],
      IntegrationPlatform: [
        "GOOGLE_ADS",
        "GOOGLE_ANALYTICS",
        "META_ADS",
        "FACEBOOK_BUSINESS",
        "INSTAGRAM_BUSINESS",
        "LINKEDIN_ADS",
        "TIKTOK_ADS",
        "TWITTER_ADS",
        "MAILCHIMP",
        "HUBSPOT",
        "SHOPIFY",
        "WORDPRESS",
        "ZAPIER",
        "SLACK",
        "DISCORD",
        "TELEGRAM",
      ],
      MessageRole: ["USER", "ASSISTANT", "SYSTEM"],
      NotificationType: [
        "INFO",
        "SUCCESS",
        "WARNING",
        "ERROR",
        "CAMPAIGN_STARTED",
        "CAMPAIGN_ENDED",
        "BUDGET_ALERT",
        "PERFORMANCE_ALERT",
        "INTEGRATION_SUCCESS",
        "INTEGRATION_ERROR",
        "TRIAL_ENDING",
        "PLAN_UPGRADED",
      ],
      Plan: ["FREE", "PRO", "ENTERPRISE"],
      Platform: [
        "GOOGLE_ADS",
        "META_ADS",
        "FACEBOOK_ADS",
        "INSTAGRAM_ADS",
        "LINKEDIN_ADS",
        "TIKTOK_ADS",
        "TWITTER_ADS",
        "PINTEREST_ADS",
      ],
    },
  },
} as const
