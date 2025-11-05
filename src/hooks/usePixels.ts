import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useOptimizedSelectors";
import { useToast } from "@/components/ui/use-toast";
import type {
  Pixel,
  PixelConfig,
  CreatePixelConfigInput,
  UpdatePixelConfigInput,
  PixelPlatform,
} from "@/types/pixel";

export const usePixels = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pixels, setPixels] = useState<Pixel[]>([]);
  const [pixelConfigs, setPixelConfigs] = useState<PixelConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Buscar pixels disponíveis (globais)
  const fetchPixels = async () => {
    try {
      const { data, error } = await supabase
        .from("Pixel")
        .select("*")
        .eq("isActive", true)
        .order("platform");

      if (error) throw error;
      setPixels(data || []);
    } catch (error: any) {
      console.error("Error fetching pixels:", error);
      toast({
        title: "Erro ao carregar pixels",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Buscar configurações de pixels do usuário
  const fetchPixelConfigs = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("PixelConfig")
        .select("*")
        .eq("userId", user.id)
        .order("createdAt", { ascending: false });

      if (error) throw error;
      setPixelConfigs(data || []);
    } catch (error: any) {
      console.error("Error fetching pixel configs:", error);
      toast({
        title: "Erro ao carregar configurações",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Criar nova configuração de pixel
  const createPixelConfig = async (input: CreatePixelConfigInput) => {
    if (!user?.id) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return null;
    }

    try {
      setCreating(true);
      const { data, error } = await supabase
        .from("PixelConfig")
        .insert({
          userId: user.id,
          platform: input.platform,
          pixelId: input.pixelId,
          name: input.name,
          accessToken: input.accessToken,
          isActive: input.isActive ?? true,
          events: input.events || [
            "page_view",
            "add_to_cart",
            "purchase",
            "initiate_checkout",
          ],
          config: input.config || {},
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Pixel cadastrado!",
        description: `O pixel ${input.name || input.platform} foi cadastrado com sucesso.`,
      });

      await fetchPixelConfigs();
      return data;
    } catch (error: any) {
      console.error("Error creating pixel config:", error);
      toast({
        title: "Erro ao cadastrar pixel",
        description: error.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setCreating(false);
    }
  };

  // Atualizar configuração de pixel
  const updatePixelConfig = async (
    id: string,
    input: UpdatePixelConfigInput,
  ) => {
    try {
      setUpdating(true);
      const { data, error } = await supabase
        .from("PixelConfig")
        .update({
          ...input,
          updatedAt: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Pixel atualizado!",
        description: "As configurações do pixel foram atualizadas com sucesso.",
      });

      await fetchPixelConfigs();
      return data;
    } catch (error: any) {
      console.error("Error updating pixel config:", error);
      toast({
        title: "Erro ao atualizar pixel",
        description: error.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setUpdating(false);
    }
  };

  // Deletar configuração de pixel
  const deletePixelConfig = async (id: string) => {
    try {
      setDeleting(true);
      const { error } = await supabase
        .from("PixelConfig")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Pixel removido!",
        description: "A configuração do pixel foi removida com sucesso.",
      });

      await fetchPixelConfigs();
      return true;
    } catch (error: any) {
      console.error("Error deleting pixel config:", error);
      toast({
        title: "Erro ao remover pixel",
        description: error.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setDeleting(false);
    }
  };

  // Ativar/desativar pixel
  const togglePixelConfig = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("PixelConfig")
        .update({ isActive, updatedAt: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: isActive ? "Pixel ativado!" : "Pixel desativado!",
        description: isActive
          ? "O pixel está agora rastreando eventos."
          : "O pixel foi pausado temporariamente.",
      });

      await fetchPixelConfigs();
      return true;
    } catch (error: any) {
      console.error("Error toggling pixel config:", error);
      toast({
        title: "Erro ao alterar status",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  // Verificar se usuário já tem pixel cadastrado para uma plataforma
  const hasPixelForPlatform = (platform: PixelPlatform): boolean => {
    return pixelConfigs.some((config) => config.platform === platform);
  };

  // Obter configuração de pixel por plataforma
  const getPixelConfigByPlatform = (
    platform: PixelPlatform,
  ): PixelConfig | undefined => {
    return pixelConfigs.find((config) => config.platform === platform);
  };

  // Obter pixels ativos
  const getActivePixelConfigs = (): PixelConfig[] => {
    return pixelConfigs.filter((config) => config.isActive);
  };

  // Estatísticas
  const stats = {
    total: pixelConfigs.length,
    active: pixelConfigs.filter((c) => c.isActive).length,
    inactive: pixelConfigs.filter((c) => !c.isActive).length,
    byPlatform: {
      facebook: pixelConfigs.filter((c) => c.platform === "FACEBOOK").length,
      tiktok: pixelConfigs.filter((c) => c.platform === "TIKTOK").length,
      google: pixelConfigs.filter((c) => c.platform === "GOOGLE_ADS").length,
    },
  };

  // Carregar dados iniciais
  useEffect(() => {
    fetchPixels();
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchPixelConfigs();
    }
  }, [user?.id]);

  return {
    // Estados
    pixels,
    pixelConfigs,
    loading,
    creating,
    updating,
    deleting,
    stats,

    // Métodos
    createPixelConfig,
    updatePixelConfig,
    deletePixelConfig,
    togglePixelConfig,
    fetchPixelConfigs,
    fetchPixels,
    hasPixelForPlatform,
    getPixelConfigByPlatform,
    getActivePixelConfigs,
  };
};
