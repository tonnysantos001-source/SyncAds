import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  Palette,
  Layout,
  Bell,
  Flag,
  ShoppingCart,
  FileText,
  AlignJustify,
  Clock,
  Zap,
  Settings,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ColorPicker } from "./ColorPicker";
import { ImageUploadField } from "./ImageUploadField";

interface Section {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface CheckoutCustomizationSidebarProps {
  expandedSections: string[];
  onToggleSection: (sectionId: string) => void;
  customization: any;
  onUpdateTheme: (updates: any) => void;
}

const sections: Section[] = [
  { id: "CABEÇALHO", label: "Cabeçalho", icon: Layout },
  { id: "BARRA_DE_AVISOS", label: "Barra de Avisos", icon: Bell },
  { id: "BANNER", label: "Banner", icon: Flag },
  { id: "CARRINHO", label: "Carrinho", icon: ShoppingCart },
  { id: "CONTEÚDO", label: "Conteúdo", icon: FileText },
  { id: "RODAPÉ", label: "Rodapé", icon: AlignJustify },
  { id: "ESCASSEZ", label: "Escassez", icon: Clock },
  { id: "ORDER_BUMP", label: "Order Bump", icon: Zap },
  { id: "CONFIGURAÇÕES", label: "Configurações", icon: Settings },
];

export const CheckoutCustomizationSidebar: React.FC<
  CheckoutCustomizationSidebarProps
> = ({ expandedSections, onToggleSection, customization, onUpdateTheme }) => {
  const renderSectionContent = (sectionId: string) => {
    if (!customization?.theme) return null;

    switch (sectionId) {
      case "CABEÇALHO":
        return (
          <div className="space-y-4">
            {/* Logo */}
            <ImageUploadField
              label="Logo"
              description="Tamanho recomendado: 300px x 80px"
              value={customization.theme.logoUrl || ""}
              onChange={(url: string) => onUpdateTheme({ logoUrl: url })}
              bucket="checkout-images"
              path="logos"
              maxSizeMB={2}
            />

            {/* Alinhamento do Logo */}
            <div>
              <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Alinhamento do logo
              </Label>
              <Select
                value={customization.theme.logoAlignment || "left"}
                onValueChange={(value: string) =>
                  onUpdateTheme({ logoAlignment: value })
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Esquerda</SelectItem>
                  <SelectItem value="center">Centro</SelectItem>
                  <SelectItem value="right">Direita</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Mostrar logo no topo */}
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Mostrar logo no topo
              </Label>
              <Switch
                checked={customization.theme.showLogoAtTop || false}
                onCheckedChange={(checked: boolean) =>
                  onUpdateTheme({ showLogoAtTop: checked })
                }
              />
            </div>

            {/* Favicon */}
            <ImageUploadField
              label="Favicon"
              description="Tamanho recomendado: 32px x 32px"
              value={customization.theme.faviconUrl || ""}
              onChange={(url: string) => onUpdateTheme({ faviconUrl: url })}
              bucket="checkout-images"
              path="favicons"
              acceptedFormats={[
                "image/png",
                "image/x-icon",
                "image/vnd.microsoft.icon",
              ]}
              maxSizeMB={1}
            />

            {/* Cor de fundo */}
            <ColorPicker
              label="Cor de fundo"
              value={customization.theme.backgroundColor || "#ffffff"}
              onChange={(color: string) =>
                onUpdateTheme({ backgroundColor: color })
              }
            />

            {/* Usar gradiente */}
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Aplicar fundo degradê
              </Label>
              <Switch
                checked={customization.theme.useGradient || false}
                onCheckedChange={(checked: boolean) =>
                  onUpdateTheme({ useGradient: checked })
                }
              />
            </div>
          </div>
        );

      case "BARRA_DE_AVISOS":
        return (
          <div className="space-y-4">
            {/* Ativar barra */}
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Ativar barra de avisos
              </Label>
              <Switch
                checked={customization.theme.noticeBarEnabled || false}
                onCheckedChange={(checked: boolean) =>
                  onUpdateTheme({ noticeBarEnabled: checked })
                }
              />
            </div>

            {/* Mensagem */}
            <div>
              <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Mensagem
              </Label>
              <Textarea
                value={customization.theme.noticeBarMessage || ""}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  onUpdateTheme({ noticeBarMessage: e.target.value })
                }
                placeholder="🎉 FRETE GRÁTIS para todo o Brasil em compras acima de R$ 199!"
                className="mt-2 resize-none"
                rows={3}
              />
            </div>

            {/* Cor de fundo */}
            <ColorPicker
              label="Cor de fundo"
              value={customization.theme.noticeBarBackgroundColor || "#1a1a1a"}
              onChange={(color: string) =>
                onUpdateTheme({ noticeBarBackgroundColor: color })
              }
            />

            {/* Cor do texto */}
            <ColorPicker
              label="Cor do texto"
              value={customization.theme.noticeBarTextColor || "#ffffff"}
              onChange={(color: string) =>
                onUpdateTheme({ noticeBarTextColor: color })
              }
            />

            {/* Animação */}
            <div>
              <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Animação
              </Label>
              <Select
                value={customization.theme.noticeBarAnimation || "none"}
                onValueChange={(value: string) =>
                  onUpdateTheme({ noticeBarAnimation: value })
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem animação</SelectItem>
                  <SelectItem value="slide">Deslizar</SelectItem>
                  <SelectItem value="fade">Fade</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case "BANNER":
        return (
          <div className="space-y-4">
            {/* Ativar banner */}
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Ativar banner no checkout
              </Label>
              <Switch
                checked={customization.theme.bannerEnabled || false}
                onCheckedChange={(checked: boolean) =>
                  onUpdateTheme({ bannerEnabled: checked })
                }
              />
            </div>

            {/* Imagem do banner */}
            <ImageUploadField
              label="Imagem do banner"
              description="Tamanho recomendado: 1200px x 150px"
              value={customization.theme.bannerImageUrl || ""}
              onChange={(url: string) => onUpdateTheme({ bannerImageUrl: url })}
              bucket="checkout-images"
              path="banners"
              maxSizeMB={3}
            />
          </div>
        );

      case "CARRINHO":
        return (
          <div className="space-y-4">
            {/* Exibir carrinho */}
            <div>
              <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Exibir carrinho
              </Label>
              <Select
                value={customization.theme.cartDisplay || "open"}
                onValueChange={(value: string) =>
                  onUpdateTheme({ cartDisplay: value })
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Aberto</SelectItem>
                  <SelectItem value="closed">Pré-fechado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Cor da borda do carrinho */}
            <ColorPicker
              label="Cor da borda do carrinho"
              value={customization.theme.cartBorderColor || "#000000"}
              onChange={(color: string) =>
                onUpdateTheme({ cartBorderColor: color })
              }
            />

            {/* Cor do círculo de quantidade */}
            <ColorPicker
              label="Cor do círculo de quantidade"
              value={customization.theme.quantityCircleColor || "#8b5cf6"}
              onChange={(color: string) =>
                onUpdateTheme({ quantityCircleColor: color })
              }
            />

            {/* Cor do texto da quantidade */}
            <ColorPicker
              label="Cor do texto da quantidade"
              value={customization.theme.quantityTextColor || "#ffffff"}
              onChange={(color: string) =>
                onUpdateTheme({ quantityTextColor: color })
              }
            />

            {/* Mostrar ícone do carrinho */}
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Mostrar ícone do carrinho sempre
              </Label>
              <Switch
                checked={customization.theme.showCartIcon || false}
                onCheckedChange={(checked: boolean) =>
                  onUpdateTheme({ showCartIcon: checked })
                }
              />
            </div>

            {/* Permitir editar cupom */}
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Permitir editar cupom de desconto
              </Label>
              <Switch
                checked={customization.theme.allowCouponEdit || false}
                onCheckedChange={(checked: boolean) =>
                  onUpdateTheme({ allowCouponEdit: checked })
                }
              />
            </div>

            {/* Mostrar lembrete do carrinho */}
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Mostrar lembrete do carrinho
              </Label>
              <Switch
                checked={customization.theme.showCartReminder || false}
                onCheckedChange={(checked: boolean) =>
                  onUpdateTheme({ showCartReminder: checked })
                }
              />
            </div>
          </div>
        );

      case "CONTEÚDO":
        return (
          <div className="space-y-4">
            {/* Visual do botão */}
            <div>
              <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Visual do botão
              </Label>
              <Select
                value={customization.theme.nextStepStyle || "rounded"}
                onValueChange={(value: string) =>
                  onUpdateTheme({ nextStepStyle: value })
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rectangular">Retangular</SelectItem>
                  <SelectItem value="rounded">Arredondado</SelectItem>
                  <SelectItem value="oval">Oval</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Botão Primário */}
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-3">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                Botão Primário (Próximo)
              </p>

              <ColorPicker
                label="Cor do texto"
                value={customization.theme.primaryButtonTextColor || "#ffffff"}
                onChange={(color: string) =>
                  onUpdateTheme({ primaryButtonTextColor: color })
                }
              />

              <ColorPicker
                label="Cor de fundo"
                value={
                  customization.theme.primaryButtonBackgroundColor || "#8b5cf6"
                }
                onChange={(color: string) =>
                  onUpdateTheme({ primaryButtonBackgroundColor: color })
                }
              />

              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Efeito hover
                </Label>
                <Switch
                  checked={customization.theme.primaryButtonHover || false}
                  onCheckedChange={(checked: boolean) =>
                    onUpdateTheme({ primaryButtonHover: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Efeito fluir
                </Label>
                <Switch
                  checked={customization.theme.primaryButtonFlow || false}
                  onCheckedChange={(checked: boolean) =>
                    onUpdateTheme({ primaryButtonFlow: checked })
                  }
                />
              </div>
            </div>

            {/* Botão Checkout */}
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-3">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                Botão Checkout (Finalizar)
              </p>

              <ColorPicker
                label="Cor do texto"
                value={
                  customization.theme.highlightedBorderTextColor || "#ffffff"
                }
                onChange={(color: string) =>
                  onUpdateTheme({ highlightedBorderTextColor: color })
                }
              />

              <ColorPicker
                label="Cor de fundo"
                value={
                  customization.theme.checkoutButtonBackgroundColor || "#10b981"
                }
                onChange={(color: string) =>
                  onUpdateTheme({ checkoutButtonBackgroundColor: color })
                }
              />

              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Efeito hover
                </Label>
                <Switch
                  checked={customization.theme.checkoutButtonHover || false}
                  onCheckedChange={(checked: boolean) =>
                    onUpdateTheme({ checkoutButtonHover: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Efeito pulsante
                </Label>
                <Switch
                  checked={customization.theme.checkoutButtonFlow || false}
                  onCheckedChange={(checked: boolean) =>
                    onUpdateTheme({ checkoutButtonFlow: checked })
                  }
                />
              </div>
            </div>
          </div>
        );

      case "RODAPÉ":
        return (
          <div className="space-y-4">
            {/* Cores do rodapé */}
            <ColorPicker
              label="Cor de fundo"
              value={customization.theme.footerBackgroundColor || "#f6f6f6"}
              onChange={(color: string) =>
                onUpdateTheme({ footerBackgroundColor: color })
              }
            />

            <ColorPicker
              label="Cor do texto"
              value={customization.theme.footerTextColor || "#3b3b3b"}
              onChange={(color: string) =>
                onUpdateTheme({ footerTextColor: color })
              }
            />

            {/* Opções de exibição */}
            <div className="space-y-3 pt-2">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                Informações a exibir
              </p>

              <div className="flex items-center justify-between">
                <Label className="text-xs text-gray-700 dark:text-gray-300">
                  Nome da loja
                </Label>
                <Switch
                  checked={customization.theme.showStoreName || false}
                  onCheckedChange={(checked: boolean) =>
                    onUpdateTheme({ showStoreName: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-xs text-gray-700 dark:text-gray-300">
                  Formas de pagamento
                </Label>
                <Switch
                  checked={customization.theme.showPaymentMethods || false}
                  onCheckedChange={(checked: boolean) =>
                    onUpdateTheme({ showPaymentMethods: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-xs text-gray-700 dark:text-gray-300">
                  CNPJ/CPF
                </Label>
                <Switch
                  checked={customization.theme.showCnpjCpf || false}
                  onCheckedChange={(checked: boolean) =>
                    onUpdateTheme({ showCnpjCpf: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-xs text-gray-700 dark:text-gray-300">
                  E-mail de contato
                </Label>
                <Switch
                  checked={customization.theme.showContactEmail || false}
                  onCheckedChange={(checked: boolean) =>
                    onUpdateTheme({ showContactEmail: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-xs text-gray-700 dark:text-gray-300">
                  Endereço
                </Label>
                <Switch
                  checked={customization.theme.showAddress || false}
                  onCheckedChange={(checked: boolean) =>
                    onUpdateTheme({ showAddress: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-xs text-gray-700 dark:text-gray-300">
                  Telefone
                </Label>
                <Switch
                  checked={customization.theme.showPhone || false}
                  onCheckedChange={(checked: boolean) =>
                    onUpdateTheme({ showPhone: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-xs text-gray-700 dark:text-gray-300">
                  Política de privacidade
                </Label>
                <Switch
                  checked={customization.theme.showPrivacyPolicy || false}
                  onCheckedChange={(checked: boolean) =>
                    onUpdateTheme({ showPrivacyPolicy: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-xs text-gray-700 dark:text-gray-300">
                  Termos e condições
                </Label>
                <Switch
                  checked={customization.theme.showTermsConditions || false}
                  onCheckedChange={(checked: boolean) =>
                    onUpdateTheme({ showTermsConditions: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-xs text-gray-700 dark:text-gray-300">
                  Trocas e devoluções
                </Label>
                <Switch
                  checked={customization.theme.showReturns || false}
                  onCheckedChange={(checked: boolean) =>
                    onUpdateTheme({ showReturns: checked })
                  }
                />
              </div>
            </div>
          </div>
        );

      case "ESCASSEZ":
        return (
          <div className="space-y-4">
            {/* Ativar escassez */}
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Ativar gatilho de escassez
              </Label>
              <Switch
                checked={customization.theme.useVisible || false}
                onCheckedChange={(checked: boolean) =>
                  onUpdateTheme({ useVisible: checked })
                }
              />
            </div>

            {/* Tag de desconto */}
            <ColorPicker
              label="Cor do texto da tag"
              value={customization.theme.discountTagTextColor || "#ffffff"}
              onChange={(color: string) =>
                onUpdateTheme({ discountTagTextColor: color })
              }
            />

            <ColorPicker
              label="Cor de fundo da tag"
              value={
                customization.theme.discountTagBackgroundColor || "#000000"
              }
              onChange={(color: string) =>
                onUpdateTheme({ discountTagBackgroundColor: color })
              }
            />

            {/* Tempo de expiração */}
            <div>
              <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Tempo de expiração (minutos)
              </Label>
              <Input
                type="number"
                value={customization.theme.expirationTime || 15}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onUpdateTheme({
                    expirationTime: parseInt(e.target.value) || 15,
                  })
                }
                className="mt-2"
                min="1"
                max="120"
              />
            </div>

            {/* Tempo de remoção forçada */}
            <div>
              <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Tempo de remoção forçada (minutos)
              </Label>
              <Input
                type="number"
                value={customization.theme.forceRemovalTime || 20}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onUpdateTheme({
                    forceRemovalTime: parseInt(e.target.value) || 20,
                  })
                }
                className="mt-2"
                min="1"
                max="120"
              />
            </div>
          </div>
        );

      case "ORDER_BUMP":
        return (
          <div className="space-y-4">
            {/* Cores do Order Bump */}
            <ColorPicker
              label="Cor do texto"
              value={customization.theme.orderBumpTextColor || "#1a1a1a"}
              onChange={(color: string) =>
                onUpdateTheme({ orderBumpTextColor: color })
              }
            />

            <ColorPicker
              label="Cor de fundo"
              value={customization.theme.orderBumpBackgroundColor || "#ffffff"}
              onChange={(color: string) =>
                onUpdateTheme({ orderBumpBackgroundColor: color })
              }
            />

            <ColorPicker
              label="Cor do preço"
              value={customization.theme.orderBumpPriceColor || "#10b981"}
              onChange={(color: string) =>
                onUpdateTheme({ orderBumpPriceColor: color })
              }
            />

            <ColorPicker
              label="Cor da borda"
              value={customization.theme.orderBumpBorderColor || "#e5e7eb"}
              onChange={(color: string) =>
                onUpdateTheme({ orderBumpBorderColor: color })
              }
            />

            <ColorPicker
              label="Cor do texto do botão"
              value={customization.theme.orderBumpButtonTextColor || "#ffffff"}
              onChange={(color: string) =>
                onUpdateTheme({ orderBumpButtonTextColor: color })
              }
            />

            <ColorPicker
              label="Cor de fundo do botão"
              value={
                customization.theme.orderBumpButtonBackgroundColor || "#8b5cf6"
              }
              onChange={(color: string) =>
                onUpdateTheme({ orderBumpButtonBackgroundColor: color })
              }
            />
          </div>
        );

      case "CONFIGURAÇÕES":
        return (
          <div className="space-y-4">
            {/* Navegação */}
            <div>
              <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Etapas de navegação
              </Label>
              <Select
                value={String(customization.theme.navigationSteps || 5)}
                onValueChange={(value: string) =>
                  onUpdateTheme({ navigationSteps: parseInt(value) })
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 etapa</SelectItem>
                  <SelectItem value="3">3 etapas</SelectItem>
                  <SelectItem value="5">5 etapas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Fonte */}
            <div>
              <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Fonte do checkout
              </Label>
              <Select
                value={customization.theme.fontFamily || "Inter, sans-serif"}
                onValueChange={(value: string) =>
                  onUpdateTheme({ fontFamily: value })
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Inter, sans-serif">Inter</SelectItem>
                  <SelectItem value="Roboto, sans-serif">Roboto</SelectItem>
                  <SelectItem value="Open Sans, sans-serif">
                    Open Sans
                  </SelectItem>
                  <SelectItem value="Poppins, sans-serif">Poppins</SelectItem>
                  <SelectItem value="Montserrat, sans-serif">
                    Montserrat
                  </SelectItem>
                  <SelectItem value="Lato, sans-serif">Lato</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Idioma */}
            <div>
              <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Idioma
              </Label>
              <Select
                value={customization.theme.language || "pt"}
                onValueChange={(value: string) =>
                  onUpdateTheme({ language: value })
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt">Português (BR)</SelectItem>
                  <SelectItem value="en">English (US)</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Moeda */}
            <div>
              <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Moeda
              </Label>
              <Select
                value={customization.theme.currency || "BRL"}
                onValueChange={(value: string) =>
                  onUpdateTheme({ currency: value })
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRL">Real (R$)</SelectItem>
                  <SelectItem value="USD">Dólar ($)</SelectItem>
                  <SelectItem value="EUR">Euro (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Opções extras */}
            <div className="space-y-3 pt-2">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                Opções extras
              </p>

              <div className="flex items-center justify-between">
                <Label className="text-xs text-gray-700 dark:text-gray-300">
                  Solicitar CPF apenas no pagamento
                </Label>
                <Switch
                  checked={customization.theme.requestCpfOnlyAtPayment || false}
                  onCheckedChange={(checked: boolean) =>
                    onUpdateTheme({ requestCpfOnlyAtPayment: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-xs text-gray-700 dark:text-gray-300">
                  Solicitar data de nascimento
                </Label>
                <Switch
                  checked={customization.theme.requestBirthDate || false}
                  onCheckedChange={(checked: boolean) =>
                    onUpdateTheme({ requestBirthDate: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-xs text-gray-700 dark:text-gray-300">
                  Solicitar gênero
                </Label>
                <Switch
                  checked={customization.theme.requestGender || false}
                  onCheckedChange={(checked: boolean) =>
                    onUpdateTheme({ requestGender: checked })
                  }
                />
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="py-8 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Configurações em breve
            </p>
          </div>
        );
    }
  };

  return (
    <div className="w-80 bg-gradient-to-b from-white/95 to-gray-50/95 dark:from-gray-900/95 dark:to-gray-800/95 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50 flex flex-col overflow-hidden shadow-2xl">
      {/* Header da Sidebar */}
      <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-violet-500/10 to-purple-500/10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-violet-500/20 backdrop-blur-sm">
            <Palette className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              Personalização
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Configure o visual do checkout
            </p>
          </div>
        </div>
      </div>

      {/* Seções Colapsáveis */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {sections.map((section, index) => {
          const isExpanded = expandedSections.includes(section.id);
          const Icon = section.icon;

          return (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="border-b border-gray-200/50 dark:border-gray-700/50"
            >
              <button
                onClick={() => onToggleSection(section.id)}
                className={cn(
                  "w-full px-4 py-3.5 flex items-center justify-between text-sm font-medium transition-all duration-200 group",
                  isExpanded
                    ? "bg-gradient-to-r from-violet-500/10 to-purple-500/10 text-violet-700 dark:text-violet-300"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-800/50",
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "p-1.5 rounded-lg transition-all duration-200",
                      isExpanded
                        ? "bg-violet-500/20"
                        : "bg-gray-200/50 dark:bg-gray-700/50 group-hover:bg-violet-500/10",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 transition-colors",
                        isExpanded
                          ? "text-violet-600 dark:text-violet-400"
                          : "text-gray-600 dark:text-gray-400",
                      )}
                    />
                  </div>
                  <span>{section.label}</span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 bg-white/50 dark:bg-gray-900/50">
                      {renderSectionContent(section.id)}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-violet-500/5 to-purple-500/5">
        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span>Alterações automáticas no preview</span>
        </div>
      </div>
    </div>
  );
};
