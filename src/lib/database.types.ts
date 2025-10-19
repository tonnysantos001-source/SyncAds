export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
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
      User: {
        Row: {
          authProvider: Database["public"]["Enums"]["AuthProvider"]
          avatar: string | null
          createdAt: string
          email: string
          id: string
          name: string
          password: string | null
          plan: Database["public"]["Enums"]["Plan"]
          providerId: string | null
          trialEndsAt: string | null
          updatedAt: string
        }
        Insert: {
          authProvider?: Database["public"]["Enums"]["AuthProvider"]
          avatar?: string | null
          createdAt?: string
          email: string
          id: string
          name: string
          password?: string | null
          plan?: Database["public"]["Enums"]["Plan"]
          providerId?: string | null
          trialEndsAt?: string | null
          updatedAt: string
        }
        Update: {
          authProvider?: Database["public"]["Enums"]["AuthProvider"]
          avatar?: string | null
          createdAt?: string
          email?: string
          id?: string
          name?: string
          password?: string | null
          plan?: Database["public"]["Enums"]["Plan"]
          providerId?: string | null
          trialEndsAt?: string | null
          updatedAt?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
