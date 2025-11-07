import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Smartphone,
  Monitor,
  Save,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import { useToast } from "@/components/ui/use-toast";

import { useAuthStore } from "@/store/authStore";

import { checkoutApi, CheckoutCustomization } from "@/lib/api/checkoutApi";

import { DEFAULT_CHECKOUT_THEME } from "@/config/defaultCheckoutTheme";
import { supabase } from "@/lib/supabase";
import PublicCheckoutPage from "@/pages/public/PublicCheckoutPage";
import { Upload } from "lucide-react";
import { ImageUpload } from "@/components/checkout/ImageUpload";

const CheckoutCustomizePage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = useAuthStore((state) => state.user);

  const [expandedSections, setExpandedSections] = useState<string[]>([
    "CABEÇALHO",
  ]);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">(
    "desktop",
  );

  const [customization, setCustomization] =
    useState<CheckoutCustomization | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  const [hasChanges, setHasChanges] = useState(false);
  const [previewOrderId, setPreviewOrderId] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!user?.id) return;
      await loadCustomization();

      if (!previewOrderId) {
        try {
          const { data } = await supabase.functions.invoke(
            "create-preview-order",
            { body: {} },
          );

          if (data?.success && data.orderId) {
            setPreviewOrderId(data.orderId);
          }
        } catch (e) {
          // Falha silenciosa no preview
        }
      }
    };
    run();
  }, [user?.id]);

  const loadCustomization = async () => {
    try {
      const data = await checkoutApi.loadCustomization(user!.id);
      if (data) {
        setCustomization(data);
      } else {
        // Usar tema padrão completo criado
        console.log("🎨 Usando DEFAULT_CHECKOUT_THEME");

        const defaultCustomization = {
          userId: user!.id,
          name: "Tema Padrão Profissional",

          theme: DEFAULT_CHECKOUT_THEME,

          isActive: true,
        };

        setCustomization(defaultCustomization as CheckoutCustomization);
      }
    } catch (error) {
      console.error("Erro ao carregar personalização:", error);
      toast({
        title: "Erro ao carregar personalização",
        description: "Não foi possível carregar as configurações do checkout",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    if (!customization || !user?.id) return;

    setIsSaving(true);
    try {
      await checkoutApi.saveCustomization(customization);
      setHasChanges(false);
      toast({
        title: "Personalização salva!",
        description: "Suas configurações foram salvas com sucesso",
      });
    } catch (error) {
      console.error("Erro ao salvar personalização:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateTheme = (updates: Partial<CheckoutCustomization["theme"]>) => {
    if (!customization) return;

    setCustomization({
      ...customization,
      theme: {
        ...customization.theme,
        ...updates,
      },
    });
    setHasChanges(true);
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section],
    );
  };

  const sections = [
    { id: "CABEÇALHO", label: "CABEÇALHO" },
    { id: "BARRA_DE_AVISOS", label: "BARRA DE AVISOS" },
    { id: "BANNER", label: "BANNER" },
    { id: "CARRINHO", label: "CARRINHO" },
    { id: "CONTEÚDO", label: "CONTEÚDO" },
    { id: "RODAPÉ", label: "RODAPÉ" },
    { id: "ESCASSEZ", label: "ESCASSEZ" },
    { id: "ORDER_BUMP", label: "ORDER BUMP" },
    { id: "CONFIGURAÇÕES", label: "CONFIGURAÇÕES" },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-950 dark:via-blue-950/20 dark:to-purple-950/20 -mx-6 -my-6">
      {/* Sidebar de Personalização */}
      <div className="w-72 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-r border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden shadow-lg">
        {/* Header da Sidebar */}

        {/* Seções Colapsáveis */}
        <div className="flex-1 overflow-y-auto">
          {sections.map((section) => (
            <div key={section.id} className="border-b border-gray-200">
              <button
                onClick={() => toggleSection(section.id)}
                className={cn(
                  "w-full px-4 py-3 flex items-center justify-between text-sm font-medium transition-colors",
                  expandedSections.includes(section.id)
                    ? "bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800",
                )}
              >
                <span>{section.label}</span>
                {expandedSections.includes(section.id) ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {expandedSections.includes(section.id) && (
                <div className="p-4 space-y-4 bg-white dark:bg-gray-900">
                  {/* Conteúdo será preenchido quando você enviar as imagens */}
                  {section.id === "CABEÇALHO" && (
                    <>
                      <div>
                        <Label className="text-xs text-gray-600 dark:text-gray-300">
                          Logo
                        </Label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-2">
                          Clique aqui e escolha o logo
                        </p>
                        <ImageUpload
                          label="Logo da loja"
                          description="Tamanho recomendado: 300px x 80px"
                          value={customization?.theme?.logoUrl || ""}
                          onChange={(url) => updateTheme({ logoUrl: url })}
                          bucket="checkout-images"
                          path="logos"
                          aspectRatio="auto"
                          maxSizeMB={2}
                        />
                      </div>

                      <div>
                        <Label className="text-xs text-gray-600">
                          Ace termos na fórmula logo com mesmo de 300px.
                        </Label>
                        <p className="text-xs text-gray-500 mt-1 mb-2">
                          Sugestão de tamanho 300px x 80px
                        </p>
                      </div>

                      <div>
                        <Label className="text-xs text-gray-600 dark:text-gray-300">
                          Alinhamento do logo
                        </Label>
                        <select
                          className="w-full mt-2 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg text-sm"
                          value={customization?.theme?.logoAlignment || "left"}
                          onChange={(e) =>
                            updateTheme({
                              logoAlignment: e.target.value as
                                | "left"
                                | "center"
                                | "right",
                            })
                          }
                        >
                          <option value="left">Esquerda</option>
                          <option value="center">Centro</option>
                          <option value="right">Direita</option>
                        </select>
                      </div>

                      <div>
                        <Label className="text-xs text-gray-600 dark:text-gray-300">
                          Final logo no topo
                        </Label>
                        <div className="flex items-center gap-2 mt-2">
                          <input
                            type="checkbox"
                            className="rounded dark:bg-gray-700 dark:border-gray-600"
                            checked={
                              customization?.theme?.showLogoAtTop || false
                            }
                            onChange={(e) =>
                              updateTheme({ showLogoAtTop: e.target.checked })
                            }
                          />
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            Ativar
                          </span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-gray-600 dark:text-gray-300">
                          Favicon
                        </Label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-2">
                          Clique aqui e escolha o favicon
                        </p>
                        <ImageUpload
                          label="Favicon"
                          description="Tamanho recomendado: 32px x 32px (formato .ico ou .png)"
                          value={customization?.theme?.faviconUrl || ""}
                          onChange={(url) => updateTheme({ faviconUrl: url })}
                          bucket="checkout-images"
                          path="favicons"
                          aspectRatio="1/1"
                          maxSizeMB={1}
                        />
                      </div>

                      <div>
                        <Label className="text-xs text-gray-600">
                          Ace termos na fórmula logo com mesmo de 300px.
                        </Label>
                        <p className="text-xs text-gray-500 mt-1">
                          Sugestão de tamanho 32px x 32px
                        </p>
                      </div>

                      <div>
                        <Label className="text-xs text-gray-600 dark:text-gray-300">
                          Fundo
                        </Label>
                        <div className="flex items-center gap-2 mt-2">
                          <div
                            className="w-10 h-10 rounded border border-gray-300 dark:border-gray-600"
                            style={{
                              backgroundColor:
                                customization?.theme?.backgroundColor ||
                                "#FFFFFF",
                            }}
                          />
                          <Input
                            type="text"
                            placeholder="#FFFFFF"
                            className="flex-1"
                            value={
                              customization?.theme?.backgroundColor || "#FFFFFF"
                            }
                            onChange={(e) =>
                              updateTheme({ backgroundColor: e.target.value })
                            }
                          />
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <input
                            type="checkbox"
                            className="rounded dark:bg-gray-700 dark:border-gray-600"
                            checked={customization?.theme?.useGradient || false}
                            onChange={(e) =>
                              updateTheme({ useGradient: e.target.checked })
                            }
                          />
                          <span className="text-xs text-gray-600 dark:text-gray-300">
                            Aplicar fundo degradê
                          </span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-gray-600 dark:text-gray-300">
                          Borda de carrinho
                        </Label>
                        <div className="flex items-center gap-2 mt-2">
                          <div
                            className="w-10 h-10 rounded border border-gray-300 dark:border-gray-600"
                            style={{
                              backgroundColor:
                                customization?.theme?.cartBorderColor ||
                                "#000000",
                            }}
                          />
                          <Input
                            type="text"
                            placeholder="#000000"
                            className="flex-1"
                            value={
                              customization?.theme?.cartBorderColor || "#000000"
                            }
                            onChange={(e) =>
                              updateTheme({ cartBorderColor: e.target.value })
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-gray-600 dark:text-gray-300">
                          Círculo de quantidade
                        </Label>
                        <div className="flex items-center gap-2 mt-2">
                          <div
                            className="w-10 h-10 rounded border border-gray-300 dark:border-gray-600"
                            style={{
                              backgroundColor:
                                customization?.theme?.quantityCircleColor ||
                                "#FF0080",
                            }}
                          />
                          <Input
                            type="text"
                            placeholder="#FF0080"
                            className="flex-1"
                            value={
                              customization?.theme?.quantityCircleColor ||
                              "#FF0080"
                            }
                            onChange={(e) =>
                              updateTheme({
                                quantityCircleColor: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-gray-600 dark:text-gray-300">
                          Cor do texto da quantidade
                        </Label>
                        <div className="flex items-center gap-2 mt-2">
                          <div
                            className="w-10 h-10 rounded border border-gray-300 dark:border-gray-600"
                            style={{
                              backgroundColor:
                                customization?.theme?.quantityTextColor ||
                                "#FFFFFF",
                            }}
                          />
                          <Input
                            type="text"
                            placeholder="#FFFFFF"
                            className="flex-1"
                            value={
                              customization?.theme?.quantityTextColor ||
                              "#FFFFFF"
                            }
                            onChange={(e) =>
                              updateTheme({ quantityTextColor: e.target.value })
                            }
                          />
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <input
                            type="checkbox"
                            className="rounded dark:bg-gray-700 dark:border-gray-600"
                            checked={
                              customization?.theme?.showCartIcon || false
                            }
                            onChange={(e) =>
                              updateTheme({ showCartIcon: e.target.checked })
                            }
                          />
                          <span className="text-xs text-gray-600 dark:text-gray-300">
                            Mostrar ícone de carrinho sempre
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* BANNER */}
                  {section.id === "BANNER" && (
                    <>
                      <div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="rounded dark:bg-gray-700 dark:border-gray-600"
                            checked={
                              customization?.theme?.bannerEnabled || false
                            }
                            onChange={(e) =>
                              updateTheme({ bannerEnabled: e.target.checked })
                            }
                          />
                          <Label className="text-xs text-gray-600 dark:text-gray-300">
                            Ativar banner em checkout
                          </Label>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-gray-600 dark:text-gray-300">
                          Imagem do banner
                        </Label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-2">
                          Cole a URL da imagem do banner
                        </p>
                        <ImageUpload
                          label="Banner"
                          description="Tamanho recomendado: 720px x 90px"
                          value={customization?.theme?.bannerUrl || ""}
                          onChange={(url) => updateTheme({ bannerUrl: url })}
                          bucket="checkout-images"
                          path="banners"
                          aspectRatio="8/1"
                          maxSizeMB={3}
                        />
                      </div>

                      <div>
                        <Label className="text-xs text-gray-600">
                          Ace termos na fórmula logo png.png com menos de 700px.
                        </Label>
                        <p className="text-xs text-gray-500 mt-1">
                          Sugestão de tamanho 720px x 90px
                        </p>
                      </div>
                    </>
                  )}

                  {/* CARRINHO */}
                  {section.id === "CARRINHO" && (
                    <>
                      <div>
                        <Label className="text-xs text-gray-600">
                          Exibir carrinho
                        </Label>
                        <select
                          className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          value={customization?.theme?.cartDisplay || "open"}
                          onChange={(e) =>
                            updateTheme({
                              cartDisplay: e.target.value as "open" | "closed",
                            })
                          }
                        >
                          <option value="open">Aberto</option>
                          <option value="closed">Pré-fechado</option>
                        </select>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="rounded"
                            checked={
                              customization?.theme?.allowCouponEdit || false
                            }
                            onChange={(e) =>
                              updateTheme({ allowCouponEdit: e.target.checked })
                            }
                          />
                          <Label className="text-xs text-gray-600">
                            Permitir editar cupom de desconto
                          </Label>
                        </div>
                      </div>
                    </>
                  )}

                  {/* CONTEÚDO */}
                  {section.id === "CONTEÚDO" && (
                    <>
                      <div>
                        <Label className="text-xs text-gray-600">
                          Visual do botão
                        </Label>
                        <select
                          className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          value={
                            customization?.theme?.primaryButtonBorderRadius ||
                            "8px"
                          }
                          onChange={(e) =>
                            updateTheme({
                              primaryButtonBorderRadius: e.target.value,
                            })
                          }
                        >
                          <option value="4px">Levemente arredondado</option>
                          <option value="8px">Arredondado</option>
                          <option value="16px">Muito arredondado</option>
                          <option value="9999px">Oval</option>
                        </select>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="rounded"
                            checked={
                              customization?.theme?.showCartReminder || false
                            }
                            onChange={(e) =>
                              updateTheme({
                                showCartReminder: e.target.checked,
                              })
                            }
                          />
                          <Label className="text-xs text-gray-600">
                            Mostrar lembrete do carrinho
                          </Label>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-gray-600">
                          Cor do texto do botão
                        </Label>
                        <div className="flex items-center gap-2 mt-2">
                          <div
                            className="w-10 h-10 rounded border border-gray-300"
                            style={{
                              backgroundColor:
                                customization?.theme?.primaryButtonTextColor ||
                                "#FFFFFF",
                            }}
                          />
                          <Input
                            type="text"
                            placeholder="#FFFFFF"
                            className="flex-1"
                            value={
                              customization?.theme?.primaryButtonTextColor ||
                              "#FFFFFF"
                            }
                            onChange={(e) =>
                              updateTheme({
                                primaryButtonTextColor: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-gray-600">
                          Cor de fundo do botão
                        </Label>
                        <div className="flex items-center gap-2 mt-2">
                          <div
                            className="w-10 h-10 rounded border border-gray-300"
                            style={{
                              backgroundColor:
                                customization?.theme
                                  ?.primaryButtonBackgroundColor || "#FF0080",
                            }}
                          />
                          <Input
                            type="text"
                            placeholder="#FF0080"
                            className="flex-1"
                            value={
                              customization?.theme
                                ?.primaryButtonBackgroundColor || "#FF0080"
                            }
                            onChange={(e) =>
                              updateTheme({
                                primaryButtonBackgroundColor: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="rounded"
                            checked={
                              customization?.theme?.primaryButtonHover || false
                            }
                            onChange={(e) =>
                              updateTheme({
                                primaryButtonHover: e.target.checked,
                              })
                            }
                          />
                          <Label className="text-xs text-gray-600">
                            Efeito hover no botão
                          </Label>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="rounded"
                            checked={
                              customization?.theme?.primaryButtonFlow || false
                            }
                            onChange={(e) =>
                              updateTheme({
                                primaryButtonFlow: e.target.checked,
                              })
                            }
                          />
                          <Label className="text-xs text-gray-600">
                            Efeito fluir
                          </Label>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-gray-600">
                          Cor do texto do botão de checkout
                        </Label>
                        <div className="flex items-center gap-2 mt-2">
                          <div
                            className="w-10 h-10 rounded border border-gray-300"
                            style={{
                              backgroundColor:
                                customization?.theme?.checkoutButtonTextColor ||
                                "#FFFFFF",
                            }}
                          />
                          <Input
                            type="text"
                            placeholder="#FFFFFF"
                            className="flex-1"
                            value={
                              customization?.theme?.checkoutButtonTextColor ||
                              "#FFFFFF"
                            }
                            onChange={(e) =>
                              updateTheme({
                                checkoutButtonTextColor: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-gray-600">
                          Cor de fundo do botão de checkout
                        </Label>
                        <div className="flex items-center gap-2 mt-2">
                          <div
                            className="w-10 h-10 rounded border border-gray-300"
                            style={{
                              backgroundColor:
                                customization?.theme
                                  ?.checkoutButtonBackgroundColor || "#0FBA00",
                            }}
                          />
                          <Input
                            type="text"
                            placeholder="#0FBA00"
                            className="flex-1"
                            value={
                              customization?.theme
                                ?.checkoutButtonBackgroundColor || "#0FBA00"
                            }
                            onChange={(e) =>
                              updateTheme({
                                checkoutButtonBackgroundColor: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="rounded"
                            checked={
                              customization?.theme?.checkoutButtonHover || false
                            }
                            onChange={(e) =>
                              updateTheme({
                                checkoutButtonHover: e.target.checked,
                              })
                            }
                          />
                          <Label className="text-xs text-gray-600">
                            Efeito hover no botão de checkout
                          </Label>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="rounded"
                            checked={
                              customization?.theme?.checkoutButtonPulse || false
                            }
                            onChange={(e) =>
                              updateTheme({
                                checkoutButtonPulse: e.target.checked,
                              })
                            }
                          />
                          <Label className="text-xs text-gray-600">
                            Efeito pulsante
                          </Label>
                        </div>
                      </div>
                    </>
                  )}

                  {/* RODAPÉ */}
                  {section.id === "RODAPÉ" && (
                    <>
                      <div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="rounded"
                            checked={
                              customization?.theme?.showStoreName || false
                            }
                            onChange={(e) =>
                              updateTheme({ showStoreName: e.target.checked })
                            }
                          />
                          <Label className="text-xs text-gray-600">
                            Exibir nome da loja
                          </Label>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="rounded"
                            checked={
                              customization?.theme?.showPaymentMethods || false
                            }
                            onChange={(e) =>
                              updateTheme({
                                showPaymentMethods: e.target.checked,
                              })
                            }
                          />
                          <Label className="text-xs text-gray-600">
                            Exibir formas de pagamento
                          </Label>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="rounded"
                            checked={customization?.theme?.showCnpjCpf || false}
                            onChange={(e) =>
                              updateTheme({ showCnpjCpf: e.target.checked })
                            }
                          />
                          <Label className="text-xs text-gray-600">
                            Exibir CNPJ/CPF
                          </Label>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="rounded"
                            checked={
                              customization?.theme?.showContactEmail || false
                            }
                            onChange={(e) =>
                              updateTheme({
                                showContactEmail: e.target.checked,
                              })
                            }
                          />
                          <Label className="text-xs text-gray-600">
                            Exibir e-mail de contato
                          </Label>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="rounded"
                            checked={customization?.theme?.showAddress || false}
                            onChange={(e) =>
                              updateTheme({ showAddress: e.target.checked })
                            }
                          />
                          <Label className="text-xs text-gray-600">
                            Exibir endereço
                          </Label>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="rounded"
                            checked={customization?.theme?.showPhone || false}
                            onChange={(e) =>
                              updateTheme({ showPhone: e.target.checked })
                            }
                          />
                          <Label className="text-xs text-gray-600">
                            Exibir telefone
                          </Label>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="rounded"
                            checked={
                              customization?.theme?.showPrivacyPolicy || false
                            }
                            onChange={(e) =>
                              updateTheme({
                                showPrivacyPolicy: e.target.checked,
                              })
                            }
                          />
                          <Label className="text-xs text-gray-600">
                            Exibir política de privacidade
                          </Label>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="rounded"
                            checked={
                              customization?.theme?.showTermsConditions || false
                            }
                            onChange={(e) =>
                              updateTheme({
                                showTermsConditions: e.target.checked,
                              })
                            }
                          />
                          <Label className="text-xs text-gray-600">
                            Exibir termos e condições
                          </Label>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="rounded"
                            checked={customization?.theme?.showReturns || false}
                            onChange={(e) =>
                              updateTheme({ showReturns: e.target.checked })
                            }
                          />
                          <Label className="text-xs text-gray-600">
                            Exibir trocas e devoluções
                          </Label>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-gray-600">
                          Cor do texto
                        </Label>
                        <div className="flex items-center gap-2 mt-2">
                          <div
                            className="w-10 h-10 rounded border border-gray-300"
                            style={{
                              backgroundColor:
                                customization?.theme?.footerTextColor ||
                                "#3b3b3b",
                            }}
                          />
                          <Input
                            type="text"
                            placeholder="#3b3b3b"
                            className="flex-1"
                            value={
                              customization?.theme?.footerTextColor || "#3b3b3b"
                            }
                            onChange={(e) =>
                              updateTheme({ footerTextColor: e.target.value })
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-gray-600">
                          Fundo do rodapé
                        </Label>
                        <div className="flex items-center gap-2 mt-2">
                          <div
                            className="w-10 h-10 rounded border border-gray-300"
                            style={{
                              backgroundColor:
                                customization?.theme?.footerBackgroundColor ||
                                "#F6F6F6",
                            }}
                          />
                          <Input
                            type="text"
                            placeholder="#F6F6F6"
                            className="flex-1"
                            value={
                              customization?.theme?.footerBackgroundColor ||
                              "#F6F6F6"
                            }
                            onChange={(e) =>
                              updateTheme({
                                footerBackgroundColor: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* BARRA DE AVISOS */}
                  {section.id === "BARRA_DE_AVISOS" && (
                    <>
                      <div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="rounded"
                            checked={
                              customization?.theme?.noticeBarEnabled || false
                            }
                            onChange={(e) =>
                              updateTheme({
                                noticeBarEnabled: e.target.checked,
                              })
                            }
                          />
                          <Label className="text-xs text-gray-600">
                            Ativar barra de avisos
                          </Label>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-gray-600">
                          Mensagem
                        </Label>
                        <Input
                          type="text"
                          placeholder="🎉 FRETE GRÁTIS para todo o Brasil em compras acima de R$ 199!"
                          className="mt-2"
                          value={
                            customization?.theme?.noticeBarMessage ||
                            "🎉 FRETE GRÁTIS para todo o Brasil em compras acima de R$ 199!"
                          }
                          onChange={(e) =>
                            updateTheme({ noticeBarMessage: e.target.value })
                          }
                        />
                      </div>

                      <div>
                        <Label className="text-xs text-gray-600">
                          Cor de fundo
                        </Label>
                        <div className="flex items-center gap-2 mt-2">
                          <div
                            className="w-10 h-10 rounded border border-gray-300"
                            style={{
                              backgroundColor:
                                customization?.theme
                                  ?.noticeBarBackgroundColor || "#1a1a1a",
                            }}
                          />
                          <Input
                            type="text"
                            placeholder="#1a1a1a"
                            className="flex-1"
                            value={
                              customization?.theme?.noticeBarBackgroundColor ||
                              "#1a1a1a"
                            }
                            onChange={(e) =>
                              updateTheme({
                                noticeBarBackgroundColor: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-gray-600">
                          Cor do texto
                        </Label>
                        <div className="flex items-center gap-2 mt-2">
                          <div
                            className="w-10 h-10 rounded border border-gray-300"
                            style={{
                              backgroundColor:
                                customization?.theme?.noticeBarTextColor ||
                                "#FFFFFF",
                            }}
                          />
                          <Input
                            type="text"
                            placeholder="#FFFFFF"
                            className="flex-1"
                            value={
                              customization?.theme?.noticeBarTextColor ||
                              "#FFFFFF"
                            }
                            onChange={(e) =>
                              updateTheme({
                                noticeBarTextColor: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-gray-600">
                          Animação
                        </Label>
                        <select
                          className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          value={
                            customization?.theme?.noticeBarAnimation || "none"
                          }
                          onChange={(e) =>
                            updateTheme({
                              noticeBarAnimation: e.target.value as
                                | "none"
                                | "slide"
                                | "fade",
                            })
                          }
                        >
                          <option value="none">Sem animação</option>
                          <option value="slide">Deslizar</option>
                          <option value="fade">Fade</option>
                        </select>
                      </div>
                    </>
                  )}

                  {/* ESCASSEZ */}
                  {section.id === "ESCASSEZ" && (
                    <>
                      <div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="rounded"
                            checked={customization?.theme?.useVisible || false}
                            onChange={(e) =>
                              updateTheme({ useVisible: e.target.checked })
                            }
                          />
                          <Label className="text-xs text-gray-600">
                            Ativar gatilho de escassez
                          </Label>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-gray-600">
                          Tempo de expiração (minutos)
                        </Label>
                        <Input
                          type="number"
                          placeholder="15"
                          className="mt-2"
                          value={customization?.theme?.expirationTime || 15}
                          onChange={(e) =>
                            updateTheme({
                              expirationTime: parseInt(e.target.value) || 15,
                            })
                          }
                        />
                      </div>

                      <div>
                        <Label className="text-xs text-gray-600">
                          Tempo de remoção forçada (minutos)
                        </Label>
                        <Input
                          type="number"
                          placeholder="20"
                          className="mt-2"
                          value={customization?.theme?.forceRemovalTime || 20}
                          onChange={(e) =>
                            updateTheme({
                              forceRemovalTime: parseInt(e.target.value) || 20,
                            })
                          }
                        />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="rounded"
                            checked={
                              customization?.theme?.showCountdownTimer || false
                            }
                            onChange={(e) =>
                              updateTheme({
                                showCountdownTimer: e.target.checked,
                              })
                            }
                          />
                          <Label className="text-xs text-gray-600">
                            Mostrar contador regressivo
                          </Label>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-gray-600">
                          Cor da mensagem de urgência
                        </Label>
                        <div className="flex items-center gap-2 mt-2">
                          <div
                            className="w-10 h-10 rounded border border-gray-300"
                            style={{
                              backgroundColor:
                                customization?.theme?.urgencyMessageColor ||
                                "#FF0000",
                            }}
                          />
                          <Input
                            type="text"
                            placeholder="#FF0000"
                            className="flex-1"
                            value={
                              customization?.theme?.urgencyMessageColor ||
                              "#FF0000"
                            }
                            onChange={(e) =>
                              updateTheme({
                                urgencyMessageColor: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-gray-600">
                          Cor de fundo da urgência
                        </Label>
                        <div className="flex items-center gap-2 mt-2">
                          <div
                            className="w-10 h-10 rounded border border-gray-300"
                            style={{
                              backgroundColor:
                                customization?.theme?.urgencyBackgroundColor ||
                                "#FFF3CD",
                            }}
                          />
                          <Input
                            type="text"
                            placeholder="#FFF3CD"
                            className="flex-1"
                            value={
                              customization?.theme?.urgencyBackgroundColor ||
                              "#FFF3CD"
                            }
                            onChange={(e) =>
                              updateTheme({
                                urgencyBackgroundColor: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* ORDER BUMP */}
                  {section.id === "ORDER_BUMP" && (
                    <>
                      <div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="rounded"
                            checked={
                              customization?.theme?.orderBumpEnabled || false
                            }
                            onChange={(e) =>
                              updateTheme({
                                orderBumpEnabled: e.target.checked,
                              })
                            }
                          />
                          <Label className="text-xs text-gray-600">
                            Ativar Order Bump
                          </Label>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-gray-600">
                          Cor do texto
                        </Label>
                        <div className="flex items-center gap-2 mt-2">
                          <div
                            className="w-10 h-10 rounded border border-gray-300"
                            style={{
                              backgroundColor:
                                customization?.theme?.orderBumpTextColor ||
                                "#1a1a1a",
                            }}
                          />
                          <Input
                            type="text"
                            placeholder="#1a1a1a"
                            className="flex-1"
                            value={
                              customization?.theme?.orderBumpTextColor ||
                              "#1a1a1a"
                            }
                            onChange={(e) =>
                              updateTheme({
                                orderBumpTextColor: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-gray-600">
                          Cor de fundo
                        </Label>
                        <div className="flex items-center gap-2 mt-2">
                          <div
                            className="w-10 h-10 rounded border border-gray-300"
                            style={{
                              backgroundColor:
                                customization?.theme
                                  ?.orderBumpBackgroundColor || "#FFFFFF",
                            }}
                          />
                          <Input
                            type="text"
                            placeholder="#FFFFFF"
                            className="flex-1"
                            value={
                              customization?.theme?.orderBumpBackgroundColor ||
                              "#FFFFFF"
                            }
                            onChange={(e) =>
                              updateTheme({
                                orderBumpBackgroundColor: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-gray-600">
                          Cor do preço
                        </Label>
                        <div className="flex items-center gap-2 mt-2">
                          <div
                            className="w-10 h-10 rounded border border-gray-300"
                            style={{
                              backgroundColor:
                                customization?.theme?.orderBumpPriceColor ||
                                "#0FBA00",
                            }}
                          />
                          <Input
                            type="text"
                            placeholder="#0FBA00"
                            className="flex-1"
                            value={
                              customization?.theme?.orderBumpPriceColor ||
                              "#0FBA00"
                            }
                            onChange={(e) =>
                              updateTheme({
                                orderBumpPriceColor: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-gray-600">
                          Cor da borda
                        </Label>
                        <div className="flex items-center gap-2 mt-2">
                          <div
                            className="w-10 h-10 rounded border border-gray-300"
                            style={{
                              backgroundColor:
                                customization?.theme?.orderBumpBorderColor ||
                                "#e5e7eb",
                            }}
                          />
                          <Input
                            type="text"
                            placeholder="#e5e7eb"
                            className="flex-1"
                            value={
                              customization?.theme?.orderBumpBorderColor ||
                              "#e5e7eb"
                            }
                            onChange={(e) =>
                              updateTheme({
                                orderBumpBorderColor: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-gray-600">
                          Arredondamento da borda
                        </Label>
                        <Input
                          type="text"
                          placeholder="8px"
                          className="mt-2"
                          value={
                            customization?.theme?.orderBumpBorderRadius || "8px"
                          }
                          onChange={(e) =>
                            updateTheme({
                              orderBumpBorderRadius: e.target.value,
                            })
                          }
                        />
                      </div>
                    </>
                  )}

                  {/* CONFIGURAÇÕES */}
                  {section.id === "CONFIGURAÇÕES" && (
                    <>
                      <div>
                        <Label className="text-xs text-gray-600">
                          Fonte do checkout
                        </Label>
                        <select
                          className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          value={
                            customization?.theme?.fontFamily ||
                            "Inter, sans-serif"
                          }
                          onChange={(e) =>
                            updateTheme({ fontFamily: e.target.value })
                          }
                        >
                          <option value="Inter, sans-serif">Inter</option>
                          <option value="Roboto, sans-serif">Roboto</option>
                          <option value="Poppins, sans-serif">Poppins</option>
                          <option value="Montserrat, sans-serif">
                            Montserrat
                          </option>
                          <option value="Open Sans, sans-serif">
                            Open Sans
                          </option>
                          <option value="Lato, sans-serif">Lato</option>
                        </select>
                      </div>

                      <div>
                        <Label className="text-xs text-gray-600">Idioma</Label>
                        <select
                          className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          value={customization?.theme?.language || "pt-BR"}
                          onChange={(e) =>
                            updateTheme({ language: e.target.value })
                          }
                        >
                          <option value="pt-BR">Português (BR)</option>
                          <option value="en-US">English (US)</option>
                          <option value="es-ES">Español</option>
                        </select>
                      </div>

                      <div>
                        <Label className="text-xs text-gray-600">Moeda</Label>
                        <select
                          className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          value={customization?.theme?.currency || "BRL"}
                          onChange={(e) =>
                            updateTheme({ currency: e.target.value })
                          }
                        >
                          <option value="BRL">Real (R$)</option>
                          <option value="USD">Dólar ($)</option>
                          <option value="EUR">Euro (€)</option>
                        </select>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="rounded"
                            checked={
                              customization?.theme?.requestCpfOnlyAtPayment ||
                              false
                            }
                            onChange={(e) =>
                              updateTheme({
                                requestCpfOnlyAtPayment: e.target.checked,
                              })
                            }
                          />
                          <Label className="text-xs text-gray-600">
                            Solicitar CPF apenas no pagamento
                          </Label>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="rounded"
                            checked={
                              customization?.theme?.requestBirthDate || false
                            }
                            onChange={(e) =>
                              updateTheme({
                                requestBirthDate: e.target.checked,
                              })
                            }
                          />
                          <Label className="text-xs text-gray-600">
                            Solicitar data de nascimento
                          </Label>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="rounded"
                            checked={
                              customization?.theme?.requestGender || false
                            }
                            onChange={(e) =>
                              updateTheme({ requestGender: e.target.checked })
                            }
                          />
                          <Label className="text-xs text-gray-600">
                            Solicitar gênero
                          </Label>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="rounded"
                            checked={
                              customization?.theme?.showTrustBadges || false
                            }
                            onChange={(e) =>
                              updateTheme({ showTrustBadges: e.target.checked })
                            }
                          />
                          <Label className="text-xs text-gray-600">
                            Mostrar selos de confiança
                          </Label>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="rounded"
                            checked={
                              customization?.theme?.sslBadgeEnabled || false
                            }
                            onChange={(e) =>
                              updateTheme({ sslBadgeEnabled: e.target.checked })
                            }
                          />
                          <Label className="text-xs text-gray-600">
                            Mostrar selo SSL
                          </Label>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="rounded"
                            checked={
                              customization?.theme?.enableAnimations || false
                            }
                            onChange={(e) =>
                              updateTheme({
                                enableAnimations: e.target.checked,
                              })
                            }
                          />
                          <Label className="text-xs text-gray-600">
                            Ativar animações
                          </Label>
                        </div>
                      </div>
                    </>
                  )}

                  {/* ESCASSEZ */}
                  {section.id === "ESCASSEZ" && (
                    <>
                      <div>
                        <Label className="text-xs text-gray-600">
                          Texto tag de desconto
                        </Label>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-10 h-10 rounded border border-gray-300 bg-white" />
                          <Input
                            type="text"
                            placeholder="#ffffff"
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-gray-600">
                          Fundo tag de desconto
                        </Label>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-10 h-10 rounded border border-gray-300 bg-black" />
                          <Input
                            type="text"
                            placeholder="#000000"
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" className="rounded" />
                          <Label className="text-xs text-gray-600">
                            Use visíveis
                          </Label>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-gray-600">
                          Tempo de expiração (se inativado/forma de pagamento)
                        </Label>
                      </div>

                      <div>
                        <Label className="text-xs text-gray-600">
                          Tag counter
                        </Label>
                      </div>
                    </>
                  )}

                  {/* ORDER BUMP */}
                  {section.id === "ORDER_BUMP" && (
                    <>
                      <div>
                        <Label className="text-xs text-gray-600">
                          Texto do order bump
                        </Label>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-10 h-10 rounded border border-gray-300 bg-gray-600" />
                          <Input
                            type="text"
                            placeholder="#666666"
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-gray-600">
                          Fundo do order bump
                        </Label>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-10 h-10 rounded border border-gray-300 bg-yellow-100" />
                          <Input
                            type="text"
                            placeholder="#FFFFDD"
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-gray-600">
                          Preço do order bump
                        </Label>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-10 h-10 rounded border border-gray-300 bg-pink-500" />
                          <Input
                            type="text"
                            placeholder="#EE000C"
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-gray-600">
                          Borda do order bump
                        </Label>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-10 h-10 rounded border border-gray-300 bg-gray-200" />
                          <Input
                            type="text"
                            placeholder="#D0D0D0"
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-gray-600">
                          Texto do botão
                        </Label>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-10 h-10 rounded border border-gray-300 bg-white" />
                          <Input
                            type="text"
                            placeholder="#FFF"
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-gray-600">
                          Fundo do botão
                        </Label>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-10 h-10 rounded border border-gray-300 bg-pink-500" />
                          <Input
                            type="text"
                            placeholder="#EE000C"
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* CONFIGURAÇÕES */}
                  {section.id === "CONFIGURAÇÕES" && (
                    <>
                      <div>
                        <Label className="text-xs text-gray-600">
                          Navegação
                        </Label>
                        <select className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg text-sm">
                          <option>5 etapas</option>
                          <option>3 etapas</option>
                          <option>1 etapa</option>
                        </select>
                      </div>

                      <div>
                        <Label className="text-xs text-gray-600">Fonte</Label>
                        <select className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg text-sm">
                          <option>Arial</option>
                          <option>Roboto</option>
                          <option>Open Sans</option>
                        </select>
                      </div>

                      <div>
                        <Label className="text-xs text-gray-600">
                          Forçamento/remoção/selecionado
                        </Label>
                        <Input type="text" placeholder="60s" className="mt-2" />
                      </div>

                      <div>
                        <Label className="text-xs text-gray-600">
                          Página de pré-venda/conta
                        </Label>
                        <select className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg text-sm">
                          <option>Carrinho em carrinho</option>
                          <option>Checkout direto</option>
                        </select>
                      </div>

                      <div>
                        <Label className="text-xs text-gray-600">Idioma</Label>
                        <select className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg text-sm">
                          <option>Português</option>
                          <option>Inglês</option>
                          <option>Espanhol</option>
                        </select>
                      </div>

                      <div>
                        <Label className="text-xs text-gray-600">Moeda</Label>
                        <select className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg text-sm">
                          <option>R$ - Real Brasileiro</option>
                          <option>$ - Dólar</option>
                          <option>€ - Euro</option>
                        </select>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" className="rounded" />
                          <Label className="text-xs text-gray-600">
                            Solicitar CPF apenas no pagamento
                          </Label>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" className="rounded" />
                          <Label className="text-xs text-gray-600">
                            Solicitar data de nascimento
                          </Label>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" className="rounded" />
                          <Label className="text-xs text-gray-600">
                            Solicitar sexo
                          </Label>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" className="rounded" />
                          <Label className="text-xs text-gray-600">
                            Desabilitar carroteio
                          </Label>
                        </div>
                      </div>
                    </>
                  )}

                  {/* BARRA DE AVISOS */}
                  {section.id === "BARRA_DE_AVISOS" && (
                    <>
                      <div>
                        <Label className="text-xs text-gray-600">
                          Texto da barra de avisos
                        </Label>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-10 h-10 rounded border border-gray-300 bg-white" />
                          <Input
                            type="text"
                            placeholder="#FFFFFF"
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-gray-600">
                          Fundo da barra de avisos
                        </Label>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-10 h-10 rounded border border-gray-300 bg-black" />
                          <Input
                            type="text"
                            placeholder="#000000"
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-gray-600">
                          Mensagem na barra de avisos
                        </Label>

                        {/* Botões de formatação */}
                        <div className="flex items-center gap-1 mt-2 mb-2">
                          <button className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center text-sm font-bold hover:bg-gray-100">
                            B
                          </button>
                          <button className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center text-sm italic hover:bg-gray-100">
                            I
                          </button>
                          <button className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center text-sm underline hover:bg-gray-100">
                            U
                          </button>
                          <button className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center text-sm hover:bg-gray-100">
                            C
                          </button>
                        </div>

                        <textarea
                          placeholder="Digite aqui"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                          rows={3}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Área de Preview */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header do Preview */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 px-6 py-3 flex items-center justify-end shadow-lg">
          <div className="flex items-center gap-3">
            <Button
              variant={previewMode === "mobile" ? "default" : "outline"}
              size="icon"
              onClick={() => setPreviewMode("mobile")}
            >
              <Smartphone className="h-4 w-4" />
            </Button>
            <Button
              variant={previewMode === "desktop" ? "default" : "outline"}
              size="icon"
              onClick={() => setPreviewMode("desktop")}
            >
              <Monitor className="h-4 w-4" />
            </Button>
            <Button
              className="gap-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
            >
              <Save className="h-4 w-4" />
              {isSaving ? "SALVANDO..." : "SALVAR"}
            </Button>
          </div>
        </div>

        {/* Preview Area */}

        <div className="flex-1 overflow-auto bg-gradient-to-br from-gray-100 via-blue-50/20 to-purple-50/20 dark:from-gray-900 dark:via-blue-950/20 dark:to-purple-950/20 p-6">
          <div
            className={cn(
              "mx-auto bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300",

              previewMode === "mobile" ? "max-w-md" : "max-w-4xl",
            )}
          >
            {previewOrderId ? (
              <PublicCheckoutPage
                injectedOrderId={previewOrderId}
                injectedTheme={customization?.theme}
                previewMode={true}
              />
            ) : (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                Gerando pré-visualização...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Botão de ajuda flutuante */}
      <button className="fixed bottom-6 right-6 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 dark:from-pink-500 dark:to-purple-500 dark:hover:from-pink-600 dark:hover:to-purple-600 text-white px-6 py-3 rounded-full shadow-xl hover:shadow-2xl flex items-center gap-2 transition-all duration-300 hover:scale-105">
        <span className="text-sm font-medium">💬 Precisa de ajuda?</span>
      </button>
    </div>
  );
};

export default CheckoutCustomizePage;
