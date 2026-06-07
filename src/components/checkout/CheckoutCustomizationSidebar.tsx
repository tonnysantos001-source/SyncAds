import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useCheckoutConfigStore,
  selectCheckoutConfig,
} from "@/store/checkoutConfigStore";
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
  Sparkles,
  LayoutGrid,
  CheckCircle2,
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
import { ModernColorPicker } from "./ModernColorPicker";
import { ImageUploadField } from "./ImageUploadField";

interface Section {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface CheckoutCustomizationSidebarProps {
  expandedSections: string[];
  onToggleSection: (sectionId: string) => void;
  /** Callback quando o usuário seleciona um template */
  onSelectTemplate?: (slug: string, version: number) => void;
  /** Slug do template atualmente ativo em produção */
  activeTemplateSlug?: string;
  /** Chamado a cada mudança para marcar hasChanges na página pai */
  onAnyChange?: () => void;
}

const sections: Section[] = [
  { id: "MODELOS",         label: "Modelos",         icon: LayoutGrid  },
  { id: "CABECALHO",       label: "Cabeçalho",       icon: Layout       },
  { id: "BARRA_DE_AVISOS", label: "Barra de Avisos",  icon: Bell         },
  { id: "BANNER",          label: "Banner",           icon: Flag         },
  { id: "CARRINHO",        label: "Carrinho",          icon: ShoppingCart },
  { id: "CONTEUDO",        label: "Conteúdo",         icon: FileText     },
  { id: "RODAPE",          label: "Rodapé",           icon: AlignJustify },
  { id: "ESCASSEZ",        label: "Escassez",          icon: Clock        },
  { id: "ORDER_BUMP",      label: "Order Bump",        icon: Zap          },
  { id: "CONFIGURACOES",   label: "Configurações",     icon: Settings     },
];

export const CheckoutCustomizationSidebar: React.FC<
  CheckoutCustomizationSidebarProps
> = ({ expandedSections, onToggleSection, onSelectTemplate, activeTemplateSlug, onAnyChange }) => {
  // ── Store Zustand (source of truth) ──────────────────────────────────────
  const config     = useCheckoutConfigStore(selectCheckoutConfig);
  const updateConfig = useCheckoutConfigStore((s) => s.updateConfig);

  /** Helper: aplica patch + notifica página pai */
  const update = (patch: Parameters<typeof updateConfig>[0]) => {
    updateConfig(patch);
    onAnyChange?.();
  };

  // Templates disponíveis para seleção
  const AVAILABLE_TEMPLATES = [
    {
      slug: 'minimal',
      version: 1,
      name: 'Minimalista',
      description: '3 etapas progressivas',
      color: '#111827',
      emoji: '⚫',
      badge: 'Preto',
    },
    {
      slug: 'tiktok',
      version: 1,
      name: 'Estilo TikTok',
      description: 'Pagamento à direita',
      color: '#E91E8C',
      emoji: '💗',
      badge: 'Pink',
    },
    {
      slug: 'premium',
      version: 1,
      name: 'Estilo Shopify Pay',
      description: 'Design luxuoso e sutil',
      color: '#10B981',
      emoji: '🟢',
      badge: 'Verde',
    },
  ];

  const currentTemplateSlug = config.templateSlug || 'minimal';

  const handleSelectTemplate = (slug: string, version: number) => {
    onSelectTemplate?.(slug, version);
    onAnyChange?.();
  };

  const renderSectionContent = (sectionId: string) => {
    switch (sectionId) {
      // ── MODELOS ────────────────────────────────────────────────────────
      case "MODELOS":
        return (
          <div className="space-y-3">
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Escolha um modelo para o seu checkout. Cada modelo tem layout,
              cores e funcionalidades únicas para maximizar suas conversões.
            </p>

            <div className="grid grid-cols-1 gap-2">
              {AVAILABLE_TEMPLATES.map((tpl) => {
                const isActive = currentTemplateSlug === tpl.slug;
                const isLive = (activeTemplateSlug || currentTemplateSlug) === tpl.slug;
                return (
                  <button
                    key={tpl.slug}
                    type="button"
                    onClick={() => handleSelectTemplate(tpl.slug, tpl.version)}
                    className={cn(
                      "w-full text-left p-3 rounded-xl border-2 transition-all duration-200 group",
                      isActive
                        ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30"
                        : "border-gray-200 dark:border-gray-700 hover:border-violet-300 bg-white dark:bg-gray-800"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {/* Color swatch */}
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: `${tpl.color}15`, border: `2px solid ${tpl.color}40` }}
                      >
                        {tpl.emoji}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                            {tpl.name}
                          </span>
                          {isActive && (
                            <CheckCircle2 className="w-4 h-4 text-violet-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {tpl.description}
                        </p>
                      </div>

                      {/* Direita: bolinha verde se ativo em produção */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isLive && (
                          <div className="relative flex-shrink-0" title="Ativo em produção">
                            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                            <div className="absolute inset-0 rounded-full bg-green-400 opacity-50 scale-150" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Preview strip — barra de cor */}
                    {isActive && (
                      <div
                        className="mt-2 h-1 rounded-full"
                        style={{ backgroundColor: tpl.color }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );

      // ── SEÇÕES ──────────────────────────────────────────────────
      case "CABECALHO":
        return (
          <div className="space-y-4">
            <ImageUploadField
              label="Logo"
              description="Tamanho recomendado: 300px x 80px"
              value={config.header.logoUrl || ""}
              onChange={(url: string) => update({ header: { logoUrl: url } })}
              bucket="checkout-images"
              path="logos"
              maxSizeMB={2}
            />
            <div>
              <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Alinhamento do logo
              </Label>
              <Select
                value={config.header.logoAlign}
                onValueChange={(v) => update({ header: { logoAlign: v as 'left'|'center'|'right' } })}
              >
                <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Esquerda</SelectItem>
                  <SelectItem value="center">Centro</SelectItem>
                  <SelectItem value="right">Direita</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Nome da loja</Label>
              <Input
                className="mt-2"
                value={config.header.storeName}
                onChange={(e) => update({ header: { storeName: e.target.value } })}
                placeholder="Minha Loja"
              />
              <p className="text-[10px] text-gray-500 mt-1">Exibido quando não há logo cadastrada</p>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Exibir badge Pagamento Seguro
              </Label>
              <Switch
                checked={config.header.showSecurityBadge}
                onCheckedChange={(v) => update({ header: { showSecurityBadge: v } })}
              />
            </div>
            <ImageUploadField
              label="Favicon"
              description="Tamanho recomendado: 32px x 32px"
              value={config.header.faviconUrl || ""}
              onChange={(url: string) => update({ header: { faviconUrl: url } })}
              bucket="checkout-images"
              path="favicons"
              acceptedFormats={["image/png","image/x-icon","image/vnd.microsoft.icon"]}
              maxSizeMB={1}
            />
            <ModernColorPicker
              label="Cor de fundo do cabeçalho"
              value={config.header.bgColor}
              onChange={(c) => update({ header: { bgColor: c } })}
            />
            <ModernColorPicker
              label="Cor do texto do cabeçalho"
              value={config.header.textColor}
              onChange={(c) => update({ header: { textColor: c } })}
            />
          </div>
        );

      case "BARRA_DE_AVISOS":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Ativar barra de avisos
              </Label>
              <Switch
                checked={config.noticeBar.enabled}
                onCheckedChange={(v) => update({ noticeBar: { enabled: v } })}
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Mensagem</Label>
              <Textarea
                value={config.noticeBar.message}
                onChange={(e) => update({ noticeBar: { message: e.target.value } })}
                placeholder="🎉 FRETE GRÁTIS para todo o Brasil em compras acima de R$ 199!"
                className="mt-2 resize-none"
                rows={3}
              />
            </div>
            <ModernColorPicker
              label="Cor de fundo"
              value={config.noticeBar.bgColor}
              onChange={(c) => update({ noticeBar: { bgColor: c } })}
            />
            <ModernColorPicker
              label="Cor do texto"
              value={config.noticeBar.textColor}
              onChange={(c) => update({ noticeBar: { textColor: c } })}
            />
            <div>
              <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Estilo</Label>
              <Select
                value={config.noticeBar.style}
                onValueChange={(v) => update({ noticeBar: { style: v as 'normal'|'highlight'|'urgent' } })}
              >
                <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="highlight">Destaque</SelectItem>
                  <SelectItem value="urgent">Urgência</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Posição</Label>
              <Select
                value={config.noticeBar.position}
                onValueChange={(v) => update({ noticeBar: { position: v as 'top'|'bottom' } })}
              >
                <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="top">Topo</SelectItem>
                  <SelectItem value="bottom">Rodapé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Animação</Label>
              <Select
                value={config.noticeBar.animation}
                onValueChange={(v) => update({ noticeBar: { animation: v as 'slide'|'fade'|'scale'|'none' } })}
              >
                <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="slide">Deslizar</SelectItem>
                  <SelectItem value="fade">Fade In/Out</SelectItem>
                  <SelectItem value="scale">Escala</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Permitir fechar a barra</Label>
              <Switch
                checked={config.noticeBar.closeable}
                onCheckedChange={(v) => update({ noticeBar: { closeable: v } })}
              />
            </div>
          </div>
        );

      case "BANNER":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Ativar banner no checkout
              </Label>
              <Switch
                checked={config.banner.enabled}
                onCheckedChange={(v) => update({ banner: { enabled: v } })}
              />
            </div>
            <ImageUploadField
              label="Banner desktop"
              description="Tamanho recomendado: 1200px x 150px"
              value={config.banner.desktopUrl || ""}
              onChange={(url) => update({ banner: { desktopUrl: url } })}
              bucket="checkout-images"
              path="banners"
              maxSizeMB={3}
            />
            <ImageUploadField
              label="Banner mobile"
              description="Tamanho recomendado: 600px x 150px"
              value={config.banner.mobileUrl || ""}
              onChange={(url) => update({ banner: { mobileUrl: url } })}
              bucket="checkout-images"
              path="banners"
              maxSizeMB={3}
            />
          </div>
        );

      case "CARRINHO":
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Exibir carrinho</Label>
              <Select
                value={config.cart.display}
                onValueChange={(v) => update({ cart: { display: v as 'open'|'closed'|'drawer' } })}
              >
                <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Aberto</SelectItem>
                  <SelectItem value="closed">Pré-fechado</SelectItem>
                  <SelectItem value="drawer">Drawer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <ModernColorPicker
              label="Cor da borda do carrinho"
              value={config.cart.borderColor}
              onChange={(c) => update({ cart: { borderColor: c } })}
            />
            <ModernColorPicker
              label="Cor do círculo de quantidade"
              value={config.cart.quantityCircleColor}
              onChange={(c) => update({ cart: { quantityCircleColor: c } })}
            />
            <ModernColorPicker
              label="Cor do texto da quantidade"
              value={config.cart.quantityTextColor}
              onChange={(c) => update({ cart: { quantityTextColor: c } })}
            />
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Mostrar ícone do carrinho sempre</Label>
              <Switch checked={config.cart.showIcon} onCheckedChange={(v) => update({ cart: { showIcon: v } })} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Permitir editar cupom de desconto</Label>
              <Switch checked={config.cart.couponEnabled} onCheckedChange={(v) => update({ cart: { couponEnabled: v } })} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Mostrar lembrete do carrinho</Label>
              <Switch checked={config.cart.showCartReminder} onCheckedChange={(v) => update({ cart: { showCartReminder: v } })} />
            </div>
          </div>
        );

      case "CONTEUDO":
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Visual do botão</Label>
              <Select
                value={config.buttons.nextStepStyle}
                onValueChange={(v) => update({ buttons: { nextStepStyle: v as 'rounded'|'rectangular'|'oval' } })}
              >
                <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="rectangular">Retangular</SelectItem>
                  <SelectItem value="rounded">Arredondado</SelectItem>
                  <SelectItem value="oval">Oval</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-3">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Botão Primário (Próximo)</p>
              <ModernColorPicker label="Cor do texto" value={config.buttons.primaryText} onChange={(c) => update({ buttons: { primaryText: c } })} />
              <ModernColorPicker label="Cor de fundo" value={config.buttons.primaryBg} onChange={(c) => update({ buttons: { primaryBg: c } })} />
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Efeito hover</Label>
                <Switch checked={config.buttons.primaryHover} onCheckedChange={(v) => update({ buttons: { primaryHover: v } })} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Efeito fluir</Label>
                <Switch checked={config.buttons.primaryFlow} onCheckedChange={(v) => update({ buttons: { primaryFlow: v } })} />
              </div>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-3">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Botão Checkout (Finalizar)</p>
              <ModernColorPicker label="Cor do texto" value={config.buttons.checkoutText} onChange={(c) => update({ buttons: { checkoutText: c } })} />
              <ModernColorPicker label="Cor de fundo" value={config.buttons.checkoutBg} onChange={(c) => update({ buttons: { checkoutBg: c } })} />
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Efeito hover</Label>
                <Switch checked={config.buttons.checkoutHover} onCheckedChange={(v) => update({ buttons: { checkoutHover: v } })} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Efeito pulsante</Label>
                <Switch checked={config.buttons.pulse} onCheckedChange={(v) => update({ buttons: { pulse: v } })} />
              </div>
            </div>
          </div>
        );

      case "RODAPE":
        return (
          <div className="space-y-4">
            <ModernColorPicker label="Cor de fundo" value={config.footer.bgColor} onChange={(c) => update({ footer: { bgColor: c } })} />
            <ModernColorPicker label="Cor do texto" value={config.footer.textColor} onChange={(c) => update({ footer: { textColor: c } })} />
            <div className="space-y-3 pt-2">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Informações a exibir</p>

              {/* Nome da loja */}
              <div className="flex items-center justify-between">
                <Label className="text-xs text-gray-700 dark:text-gray-300">Nome da loja</Label>
                <Switch checked={config.footer.showStoreName} onCheckedChange={(v) => update({ footer: { showStoreName: v } })} />
              </div>

              {/* Formas de pagamento */}
              <div className="flex items-center justify-between">
                <Label className="text-xs text-gray-700 dark:text-gray-300">Formas de pagamento</Label>
                <Switch checked={config.footer.showPaymentMethods} onCheckedChange={(v) => update({ footer: { showPaymentMethods: v } })} />
              </div>

              {/* CNPJ/CPF */}
              <div className="flex items-center justify-between">
                <Label className="text-xs text-gray-700 dark:text-gray-300">CNPJ/CPF</Label>
                <Switch checked={config.footer.showCnpj} onCheckedChange={(v) => update({ footer: { showCnpj: v } })} />
              </div>
              {config.footer.showCnpj && (
                <Input
                  className="mt-1 text-xs"
                  value={config.footer.cnpjValue || ''}
                  onChange={(e) => update({ footer: { cnpjValue: e.target.value } })}
                  placeholder="00.000.000/0001-00"
                />
              )}

              {/* E-mail de contato */}
              <div className="flex items-center justify-between">
                <Label className="text-xs text-gray-700 dark:text-gray-300">E-mail de contato</Label>
                <Switch checked={config.footer.showContactEmail} onCheckedChange={(v) => update({ footer: { showContactEmail: v } })} />
              </div>
              {config.footer.showContactEmail && (
                <Input
                  className="mt-1 text-xs"
                  type="email"
                  value={config.footer.contactEmail || ''}
                  onChange={(e) => update({ footer: { contactEmail: e.target.value } })}
                  placeholder="contato@sualooja.com.br"
                />
              )}

              {/* Endereço */}
              <div className="flex items-center justify-between">
                <Label className="text-xs text-gray-700 dark:text-gray-300">Endereço</Label>
                <Switch checked={config.footer.showAddress} onCheckedChange={(v) => update({ footer: { showAddress: v } })} />
              </div>
              {config.footer.showAddress && (
                <Input
                  className="mt-1 text-xs"
                  value={config.footer.address || ''}
                  onChange={(e) => update({ footer: { address: e.target.value } })}
                  placeholder="Rua Exemplo, 123 — São Paulo, SP"
                />
              )}

              {/* Telefone */}
              <div className="flex items-center justify-between">
                <Label className="text-xs text-gray-700 dark:text-gray-300">Telefone</Label>
                <Switch checked={config.footer.showPhone} onCheckedChange={(v) => update({ footer: { showPhone: v } })} />
              </div>
              {config.footer.showPhone && (
                <Input
                  className="mt-1 text-xs"
                  type="tel"
                  value={config.footer.phone || ''}
                  onChange={(e) => update({ footer: { phone: e.target.value } })}
                  placeholder="(11) 99999-9999"
                />
              )}

              {/* Política de privacidade */}
              <div className="flex items-center justify-between">
                <Label className="text-xs text-gray-700 dark:text-gray-300">Política de privacidade</Label>
                <Switch checked={config.footer.showPrivacyPolicy} onCheckedChange={(v) => update({ footer: { showPrivacyPolicy: v } })} />
              </div>
              {config.footer.showPrivacyPolicy && (
                <Input
                  className="mt-1 text-xs"
                  type="url"
                  value={config.footer.privacyPolicyUrl || ''}
                  onChange={(e) => update({ footer: { privacyPolicyUrl: e.target.value } })}
                  placeholder="https://sualooja.com/privacidade"
                />
              )}

              {/* Termos e condições */}
              <div className="flex items-center justify-between">
                <Label className="text-xs text-gray-700 dark:text-gray-300">Termos e condições</Label>
                <Switch checked={config.footer.showTermsConditions} onCheckedChange={(v) => update({ footer: { showTermsConditions: v } })} />
              </div>
              {config.footer.showTermsConditions && (
                <Input
                  className="mt-1 text-xs"
                  type="url"
                  value={config.footer.termsConditionsUrl || ''}
                  onChange={(e) => update({ footer: { termsConditionsUrl: e.target.value } })}
                  placeholder="https://sualooja.com/termos"
                />
              )}

              {/* Trocas e devoluções */}
              <div className="flex items-center justify-between">
                <Label className="text-xs text-gray-700 dark:text-gray-300">Trocas e devoluções</Label>
                <Switch checked={config.footer.showReturns} onCheckedChange={(v) => update({ footer: { showReturns: v } })} />
              </div>
              {config.footer.showReturns && (
                <Input
                  className="mt-1 text-xs"
                  type="url"
                  value={config.footer.returnsUrl || ''}
                  onChange={(e) => update({ footer: { returnsUrl: e.target.value } })}
                  placeholder="https://sualooja.com/trocas"
                />
              )}
            </div>
          </div>
        );


      case "ESCASSEZ":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
              <div>
                <Label className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Clock className="h-4 w-4 text-red-500" />
                  Ativar Gatilho de Escassez
                </Label>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Countdown timer para criar urgência</p>
              </div>
              <Switch
                checked={config.scarcity.enabled}
                onCheckedChange={(v) => update({ scarcity: { enabled: v } })}
              />
            </div>
            {config.scarcity.enabled && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
                  <Zap className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span><strong>Dica:</strong> Timers de 10-15 minutos têm maior taxa de conversão.</span>
                </p>
              </div>
            )}
            <ModernColorPicker label="Cor da barra" value={config.scarcity.bgColor} onChange={(c) => update({ scarcity: { bgColor: c } })} />
            <ModernColorPicker label="Cor do texto" value={config.scarcity.textColor} onChange={(c) => update({ scarcity: { textColor: c } })} />
            <div>
              <Label className="text-xs font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Duração (minutos)
              </Label>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-2">Quanto tempo o usuário tem para finalizar a compra</p>
              <Input
                type="number"
                value={config.scarcity.durationMinutes}
                onChange={(e) => update({ scarcity: { durationMinutes: parseInt(e.target.value) || 15 } })}
                placeholder="15"
                min="1"
                max="120"
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Mensagem customizada</Label>
              <Textarea
                value={config.scarcity.customMessage || ''}
                onChange={(e) => update({ scarcity: { customMessage: e.target.value || null } })}
                placeholder="Oferta termina em: (automático se vazio)"
                className="mt-2 resize-none"
                rows={2}
              />
            </div>
          </div>
        );

      case "ORDER_BUMP":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-violet-50 dark:bg-violet-950/20 rounded-lg border border-violet-200 dark:border-violet-800">
              <div>
                <Label className="text-sm font-semibold text-gray-900 dark:text-white">Ativar Order Bump</Label>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Exibir ofertas adicionais no checkout</p>
              </div>
              <Switch checked={config.orderBump.enabled} onCheckedChange={(v) => update({ orderBump: { enabled: v } })} />
            </div>
            <ModernColorPicker label="Cor do texto" value={config.orderBump.textColor} onChange={(c) => update({ orderBump: { textColor: c } })} />
            <ModernColorPicker label="Cor de fundo" value={config.orderBump.bgColor} onChange={(c) => update({ orderBump: { bgColor: c } })} />
            <ModernColorPicker label="Cor do preço" value={config.orderBump.priceColor} onChange={(c) => update({ orderBump: { priceColor: c } })} />
            <ModernColorPicker label="Cor da borda" value={config.orderBump.borderColor} onChange={(c) => update({ orderBump: { borderColor: c } })} />
            <ModernColorPicker label="Cor do texto do botão" value={config.orderBump.buttonTextColor} onChange={(c) => update({ orderBump: { buttonTextColor: c } })} />
            <ModernColorPicker label="Cor de fundo do botão" value={config.orderBump.buttonBgColor} onChange={(c) => update({ orderBump: { buttonBgColor: c } })} />
          </div>
        );

      case "CONFIGURACOES":
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Etapas de navegação</Label>
              <Select
                value={String(config.form.navigationSteps)}
                onValueChange={(v) => update({ form: { navigationSteps: parseInt(v) as 1|2|3 } })}
              >
                <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 etapa</SelectItem>
                  <SelectItem value="2">2 etapas</SelectItem>
                  <SelectItem value="3">3 etapas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Fonte do checkout</Label>
              <Select
                value={config.typography.fontFamily}
                onValueChange={(v) => update({ typography: { fontFamily: v } })}
              >
                <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="'Inter', system-ui, sans-serif">Inter</SelectItem>
                  <SelectItem value="'Roboto', sans-serif">Roboto</SelectItem>
                  <SelectItem value="'Open Sans', sans-serif">Open Sans</SelectItem>
                  <SelectItem value="'Poppins', sans-serif">Poppins</SelectItem>
                  <SelectItem value="'Montserrat', sans-serif">Montserrat</SelectItem>
                  <SelectItem value="'Lato', sans-serif">Lato</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Idioma</Label>
              <Select
                value={config.form.language}
                onValueChange={(v) => update({ form: { language: v as 'pt'|'en'|'es' } })}
              >
                <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt">Português (BR)</SelectItem>
                  <SelectItem value="en">English (US)</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Moeda</Label>
              <Select
                value={config.form.currency}
                onValueChange={(v) => update({ form: { currency: v as 'BRL'|'USD'|'EUR' } })}
              >
                <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRL">Real (R$)</SelectItem>
                  <SelectItem value="USD">Dólar ($)</SelectItem>
                  <SelectItem value="EUR">Euro (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3 pt-2">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Opções extras</p>
              <div className="flex items-center justify-between">
                <Label className="text-xs text-gray-700 dark:text-gray-300">Solicitar CPF apenas no pagamento</Label>
                <Switch checked={config.form.requestCpfOnlyAtPayment} onCheckedChange={(v) => update({ form: { requestCpfOnlyAtPayment: v } })} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs text-gray-700 dark:text-gray-300">Solicitar data de nascimento</Label>
                <Switch checked={config.form.requestBirthDate} onCheckedChange={(v) => update({ form: { requestBirthDate: v } })} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs text-gray-700 dark:text-gray-300">Solicitar gênero</Label>
                <Switch checked={config.form.requestGender} onCheckedChange={(v) => update({ form: { requestGender: v } })} />
              </div>
            </div>
            <div className="space-y-3 pt-2">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Métodos de pagamento aceitos</p>
              {(['PIX', 'CREDIT_CARD', 'BOLETO'] as const).map((method) => {
                const labels: Record<string, string> = {
                  PIX: 'PIX',
                  CREDIT_CARD: 'Cartão de Crédito',
                  BOLETO: 'Boleto Bancário',
                };
                const isEnabled = config.form.paymentMethods.includes(method);
                return (
                  <div key={method} className="flex items-center justify-between">
                    <Label className="text-xs text-gray-700 dark:text-gray-300">{labels[method]}</Label>
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={(v) => {
                        const current = config.form.paymentMethods;
                        const next = v
                          ? [...current, method]
                          : current.filter(m => m !== method);
                        if (next.length > 0) update({ form: { paymentMethods: next } });
                      }}
                    />
                  </div>
                );
              })}
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
      {/* Header da Sidebar - Logo e Branding */}
      <div className="px-4 py-4 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 shadow-md">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-base font-black bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              SyncAds AI
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2 pl-1">
          <div className="p-1 rounded bg-violet-500/20">
            <Palette className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-900 dark:text-white">
              Personalização
            </p>
            <p className="text-[10px] text-gray-600 dark:text-gray-400">
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

