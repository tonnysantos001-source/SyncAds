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

  // Carregar personalização existente
  useEffect(() => {
    if (user?.organizationId) {
      loadCustomization();
    }
  }, [user?.organizationId]);

  const loadCustomization = async () => {
    try {
      const data = await checkoutApi.loadCustomization(user!.organizationId);
      if (data) {
        setCustomization(data);
      } else {
        // Usar tema padrão completo criado
        console.log("🎨 Usando DEFAULT_CHECKOUT_THEME");
        const defaultCustomization = {
          organizationId: user!.organizationId,
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
    if (!customization || !user?.organizationId) return;

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
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar de Personalização */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
        {/* Header da Sidebar */}
        <div className="p-4 border-b border-gray-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/checkout/customize")}
            className="gap-2 -ml-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Sair do construtor
          </Button>
        </div>

        {/* Seções Colapsáveis */}
        <div className="flex-1 overflow-y-auto">
          {sections.map((section) => (
            <div key={section.id} className="border-b border-gray-200">
              <button
                onClick={() => toggleSection(section.id)}
                className={cn(
                  "w-full px-4 py-3 flex items-center justify-between text-sm font-medium transition-colors",
                  expandedSections.includes(section.id)
                    ? "bg-gray-50 text-gray-900"
                    : "text-gray-700 hover:bg-gray-50",
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
                <div className="p-4 space-y-4 bg-white">
                  {/* Conteúdo será preenchido quando você enviar as imagens */}
                  {section.id === "CABEÇALHO" && (
                    <>
                      <div>
                        <Label className="text-xs text-gray-600">Logo</Label>
                        <p className="text-xs text-gray-500 mt-1 mb-2">
                          Clique aqui e escolha o logo
                        </p>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                          <p className="text-xs text-gray-400">
                            Selecionar imagem
                          </p>
                        </div>
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
                        <Label className="text-xs text-gray-600">
                          Alinhamento do logo
                        </Label>
                        <select
                          className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg text-sm"
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
                        <Label className="text-xs text-gray-600">
                          Final logo no topo
                        </Label>
                        <div className="flex items-center gap-2 mt-2">
                          <input
                            type="checkbox"
                            className="rounded"
                            checked={
                              customization?.theme?.showLogoAtTop || false
                            }
                            onChange={(e) =>
                              updateTheme({ showLogoAtTop: e.target.checked })
                            }
                          />
                          <span className="text-sm text-gray-600">Ativar</span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-gray-600">Favicon</Label>
                        <p className="text-xs text-gray-500 mt-1 mb-2">
                          Clique aqui e escolha o favicon
                        </p>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                          <p className="text-xs text-gray-400">
                            Selecionar imagem
                          </p>
                        </div>
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
                        <Label className="text-xs text-gray-600">Fundo</Label>
                        <div className="flex items-center gap-2 mt-2">
                          <div
                            className="w-10 h-10 rounded border border-gray-300"
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
                            className="rounded"
                            checked={customization?.theme?.useGradient || false}
                            onChange={(e) =>
                              updateTheme({ useGradient: e.target.checked })
                            }
                          />
                          <span className="text-xs text-gray-600">
                            Aplicar fundo degradê
                          </span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-gray-600">
                          Borda de carrinho
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
                          Círculo de quantidade
                        </Label>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-10 h-10 rounded border border-gray-300 bg-pink-500" />
                          <Input
                            type="text"
                            placeholder="#FF0080"
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-gray-600">
                          Quantidade
                        </Label>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-10 h-10 rounded border border-gray-300 bg-white" />
                          <Input
                            type="text"
                            placeholder="#FFFFFF"
                            className="flex-1"
                          />
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <input type="checkbox" className="rounded" />
                          <span className="text-xs text-gray-600">
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
                          <input type="checkbox" className="rounded" />
                          <Label className="text-xs text-gray-600">
                            Ativar banner em checkout
                          </Label>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-gray-600">
                          Imagem do banner
                        </Label>
                        <p className="text-xs text-gray-500 mt-1 mb-2">
                          Clique e escolha banner
                        </p>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                          <p className="text-xs text-gray-400">
                            Selecionar imagem
                          </p>
                        </div>
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
                        <select className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg text-sm">
                          <option>Sem pré-fechado</option>
                          <option>Pré-fechado</option>
                        </select>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" className="rounded" />
                          <Label className="text-xs text-gray-600">
                            Editar cupom de desconto
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
                          Visual de próxima Etapa
                        </Label>
                        <select className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg text-sm">
                          <option>Arredondado</option>
                          <option>Retangular</option>
                          <option>Oval</option>
                        </select>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" className="rounded" />
                          <Label className="text-xs text-gray-600">
                            Remeter carrinho
                          </Label>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-gray-600">
                          Texto do botão primário
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
                          Fundo do botão primário
                        </Label>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-10 h-10 rounded border border-gray-300 bg-pink-500" />
                          <Input
                            type="text"
                            placeholder="#FF0080"
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" className="rounded" />
                          <Label className="text-xs text-gray-600">
                            Remeter cursor botão primário
                          </Label>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" className="rounded" />
                          <Label className="text-xs text-gray-600">
                            Efeito fluir
                          </Label>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-gray-600">
                          Texto da borda destacada
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
                          Fundo da borda de finalizar compra
                        </Label>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-10 h-10 rounded border border-gray-300 bg-green-500" />
                          <Input
                            type="text"
                            placeholder="#0FBA00"
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" className="rounded" />
                          <Label className="text-xs text-gray-600">
                            Remeter botão finalizar compra
                          </Label>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" className="rounded" />
                          <Label className="text-xs text-gray-600">
                            Efeito fluir
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
                          <input type="checkbox" className="rounded" />
                          <Label className="text-xs text-gray-600">
                            Exibir nome da loja
                          </Label>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" className="rounded" />
                          <Label className="text-xs text-gray-600">
                            Exibir formas de pagamento
                          </Label>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" className="rounded" />
                          <Label className="text-xs text-gray-600">
                            Exibir CNPJ/CPF
                          </Label>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" className="rounded" />
                          <Label className="text-xs text-gray-600">
                            Exibir e-mail de contato
                          </Label>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" className="rounded" />
                          <Label className="text-xs text-gray-600">
                            Exibir endereço
                          </Label>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" className="rounded" />
                          <Label className="text-xs text-gray-600">
                            Exibir telefone
                          </Label>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" className="rounded" />
                          <Label className="text-xs text-gray-600">
                            Exibir política de privacidade
                          </Label>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" className="rounded" />
                          <Label className="text-xs text-gray-600">
                            Exibir termos e condições
                          </Label>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" className="rounded" />
                          <Label className="text-xs text-gray-600">
                            Exibir trocas e devoluções
                          </Label>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-gray-600">Texto</Label>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-10 h-10 rounded border border-gray-300 bg-gray-800" />
                          <Input
                            type="text"
                            placeholder="#3b3b3b"
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-gray-600">
                          Fundo do rodapé
                        </Label>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-10 h-10 rounded border border-gray-300 bg-white" />
                          <Input
                            type="text"
                            placeholder="#F6F6F6"
                            className="flex-1"
                          />
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
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <Tabs defaultValue="tema" className="w-auto">
            <TabsList>
              <TabsTrigger value="tema">Tema</TabsTrigger>
              <TabsTrigger value="conversao">Conversão</TabsTrigger>
            </TabsList>
          </Tabs>

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
              className="gap-2 bg-pink-600 hover:bg-pink-700"
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
            >
              <Save className="h-4 w-4" />
              {isSaving ? "SALVANDO..." : "SALVAR"}
            </Button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 overflow-auto bg-gray-100 p-6">
          <div
            className={cn(
              "mx-auto bg-white shadow-lg transition-all duration-300",
              previewMode === "mobile" ? "max-w-md" : "max-w-4xl",
            )}
          >
            {/* Preview do Checkout */}
            <div className="p-8">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Seu checkout
                </h1>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <div className="w-6 h-6 rounded-full bg-pink-600 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">1</span>
                  </div>
                  <span>Carrinho</span>
                </div>
              </div>

              {/* Formulário de exemplo */}
              <Card className="p-6 mb-6">
                <div className="flex items-start gap-3 mb-4 p-3 bg-blue-50 rounded-lg">
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs">i</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      INFORMAÇÕES PESSOAIS
                    </p>
                    <p className="text-xs text-gray-600">
                      Você não vai criar uma conta, usaremos os dados para
                      envio, cobrança e validar compras futuras ao e-mail.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>E-mail</Label>
                    <Input placeholder="Ex: você@email.com" />
                  </div>

                  <div>
                    <Label>Nome completo</Label>
                    <Input placeholder="Nome completo" />
                  </div>

                  <div>
                    <Label>CPF</Label>
                    <Input placeholder="000.000.000-00" />
                  </div>

                  <div>
                    <Label>Celular/WhatsApp</Label>
                    <Input placeholder="(00) 00000-0000" />
                  </div>

                  <Button className="w-full bg-pink-600 hover:bg-pink-700 text-white">
                    CONTINUAR
                  </Button>
                </div>
              </Card>

              {/* Info boxes */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-5 h-5 text-gray-400">📦</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      ENDEREÇO DE ENTREGA
                    </p>
                    <p className="text-xs text-gray-500">
                      Continue para informar o endereço de entrega
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-5 h-5 text-gray-400">💳</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      FORMAS DE PAGAMENTO
                    </p>
                    <p className="text-xs text-gray-500">
                      Finalize seu carrinho e escolha a forma de pagamento
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Botão de ajuda flutuante */}
      <button className="fixed bottom-6 right-6 bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 transition-all hover:scale-105">
        <span className="text-sm font-medium">💬 Precisa de ajuda?</span>
      </button>
    </div>
  );
};

export default CheckoutCustomizePage;
