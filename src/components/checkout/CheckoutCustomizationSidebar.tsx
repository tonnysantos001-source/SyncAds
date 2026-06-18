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
  { id: "BARRA_PIX",       label: "Barra do PIX",      icon: Clock        },
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

  const handleSelectTemplate = (slug: string, version: number) => {
    update({ templateSlug: slug });
    onSelectTemplate?.(slug, version);
  };

  const renderSectionContent = (sectionId: string) => {
    switch (sectionId) {
      // ── MODELOS ────────────────────────────────────────────────────────
      case "MODELOS":
        return (
          <div className="space-y-2.5">
            <p className="text-[10px] text-gray-400 leading-normal">
              Escolha um modelo para o seu checkout. Cada modelo tem layout,
              cores e funcionalidades únicas para maximizar suas conversões.
            </p>

            <div className="grid grid-cols-1 gap-1.5">
              {AVAILABLE_TEMPLATES.map((tpl) => {
                const isActive = config.templateSlug === tpl.slug;
                const isLive = (activeTemplateSlug || config.templateSlug) === tpl.slug;
                return (
                  <button
                    key={tpl.slug}
                    type="button"
                    onClick={() => handleSelectTemplate(tpl.slug, tpl.version)}
                    className={cn(
                      "w-full text-left p-2 rounded-lg border transition-all duration-200 group relative overflow-hidden",
                      isActive
                        ? "border-pink-500/80 bg-pink-500/5 shadow-[0_0_10px_rgba(236,72,153,0.1)]"
                        : "border-white/5 hover:border-pink-500/20 bg-[#111827] hover:bg-[#111827]/85"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {/* Color swatch compact */}
                      <div
                        className="w-7 h-7 rounded flex items-center justify-center text-sm flex-shrink-0 shadow-inner"
                        style={{ backgroundColor: `${tpl.color}15`, border: `1px solid ${tpl.color}25` }}
                      >
                        {tpl.emoji}
                      </div>

                      {/* Info compact */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-gray-250 group-hover:text-white transition-colors">
                            {tpl.name}
                          </span>
                          {isActive && (
                            <CheckCircle2 className="w-3 h-3 text-pink-500 flex-shrink-0 animate-scale-in" />
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400 group-hover:text-gray-350 truncate transition-colors">
                          {tpl.description}
                        </p>
                      </div>

                      {/* Direita: bolinha verde compacta */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {isLive && (
                          <div className="relative flex-shrink-0" title="Ativo em produção">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <div className="absolute inset-0 rounded-full bg-green-400 opacity-50 scale-150 animate-ping" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Preview strip compact */}
                    {isActive && (
                      <div
                        className="mt-1.5 h-0.5 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-pink-500 animate-fade-in"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );

      // ── CABECALHO ──────────────────────────────────────────────────────
      case "CABECALHO":
        return (
          <div className="space-y-3">
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
              <Label className="text-[11px] font-semibold text-gray-300">
                Alinhamento do logo
              </Label>
              <Select
                value={config.header.logoAlign}
                onValueChange={(v) => update({ header: { logoAlign: v as 'left'|'center'|'right' } })}
              >
                <SelectTrigger className="mt-1.5 h-8 text-xs bg-[#111827] border-white/5 hover:border-white/10 text-gray-200 focus:ring-pink-500/50 focus:ring-offset-0"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#0b0f19] border-white/10 text-gray-200 text-xs">
                  <SelectItem value="left">Esquerda</SelectItem>
                  <SelectItem value="center">Centro</SelectItem>
                  <SelectItem value="right">Direita</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11px] font-semibold text-gray-300">Nome da loja</Label>
              <Input
                className="mt-1.5 h-8 text-xs py-1 px-2.5 bg-[#111827] border-white/5 hover:border-white/10 text-gray-200 focus-visible:ring-pink-500/50 focus-visible:ring-offset-0 placeholder:text-gray-600"
                value={config.header.storeName}
                onChange={(e) => update({ header: { storeName: e.target.value } })}
                placeholder="Minha Loja"
              />
              <p className="text-[9px] text-gray-500 mt-0.5">Exibido quando não há logo cadastrada</p>
            </div>
            <div className="flex items-center justify-between p-2 bg-[#111827]/40 border border-white/5 rounded-lg">
              <Label className="text-[11px] font-semibold text-gray-300">
                Exibir badge Pagamento Seguro
              </Label>
              <Switch
                className="scale-90"
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

      // ── BARRA DE AVISOS ────────────────────────────────────────────────
      case "BARRA_DE_AVISOS":
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2 bg-[#111827]/40 border border-white/5 rounded-lg">
              <Label className="text-[11px] font-semibold text-gray-300">
                Ativar barra de avisos
              </Label>
              <Switch
                className="scale-90"
                checked={config.noticeBar.enabled}
                onCheckedChange={(v) => update({ noticeBar: { enabled: v } })}
              />
            </div>
            <div>
              <Label className="text-[11px] font-semibold text-gray-300">Mensagem</Label>
              <Textarea
                value={config.noticeBar.message}
                onChange={(e) => update({ noticeBar: { message: e.target.value } })}
                placeholder="🎉 FRETE GRÁTIS!"
                className="mt-1.5 bg-[#111827] border-white/5 hover:border-white/10 text-gray-200 focus-visible:ring-pink-500/50 focus-visible:ring-offset-0 placeholder:text-gray-600 resize-none text-xs p-2"
                rows={2}
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
              <Label className="text-[11px] font-semibold text-gray-300">Estilo</Label>
              <Select
                value={config.noticeBar.style}
                onValueChange={(v) => update({ noticeBar: { style: v as 'normal'|'highlight'|'urgent' } })}
              >
                <SelectTrigger className="mt-1.5 h-8 text-xs bg-[#111827] border-white/5 hover:border-white/10 text-gray-200 focus:ring-pink-500/50 focus:ring-offset-0"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#0b0f19] border-white/10 text-gray-200 text-xs">
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="highlight">Destaque</SelectItem>
                  <SelectItem value="urgent">Urgência</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11px] font-semibold text-gray-300">Posição</Label>
              <Select
                value={config.noticeBar.position}
                onValueChange={(v) => update({ noticeBar: { position: v as 'top'|'bottom' } })}
              >
                <SelectTrigger className="mt-1.5 h-8 text-xs bg-[#111827] border-white/5 hover:border-white/10 text-gray-200 focus:ring-pink-500/50 focus:ring-offset-0"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#0b0f19] border-white/10 text-gray-200 text-xs">
                  <SelectItem value="top">Topo</SelectItem>
                  <SelectItem value="bottom">Rodapé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11px] font-semibold text-gray-300">Animação</Label>
              <Select
                value={config.noticeBar.animation}
                onValueChange={(v) => update({ noticeBar: { animation: v as 'slide'|'fade'|'scale'|'none' } })}
              >
                <SelectTrigger className="mt-1.5 h-8 text-xs bg-[#111827] border-white/5 hover:border-white/10 text-gray-200 focus:ring-pink-500/50 focus:ring-offset-0"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#0b0f19] border-white/10 text-gray-200 text-xs">
                  <SelectItem value="slide">Deslizar</SelectItem>
                  <SelectItem value="fade">Fade In/Out</SelectItem>
                  <SelectItem value="scale">Escala</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between p-2 bg-[#111827]/40 border border-white/5 rounded-lg">
              <Label className="text-[11px] font-semibold text-gray-300">Permitir fechar a barra</Label>
              <Switch
                className="scale-90"
                checked={config.noticeBar.closeable}
                onCheckedChange={(v) => update({ noticeBar: { closeable: v } })}
              />
            </div>
          </div>
        );

      // ── BANNER ─────────────────────────────────────────────────────────
      case "BANNER":
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2 bg-[#111827]/40 border border-white/5 rounded-lg">
              <Label className="text-[11px] font-semibold text-gray-300">
                Ativar banner no checkout
              </Label>
              <Switch
                className="scale-90"
                checked={config.banner.enabled}
                onCheckedChange={(v) => update({ banner: { enabled: v } })}
              />
            </div>
            <ImageUploadField
              label="Banner desktop"
              description="Recomendado: 1200px x 150px"
              value={config.banner.desktopUrl || ""}
              onChange={(url) => update({ banner: { desktopUrl: url } })}
              bucket="checkout-images"
              path="banners"
              maxSizeMB={3}
            />
            <ImageUploadField
              label="Banner mobile"
              description="Recomendado: 600px x 150px"
              value={config.banner.mobileUrl || ""}
              onChange={(url) => update({ banner: { mobileUrl: url } })}
              bucket="checkout-images"
              path="banners"
              maxSizeMB={3}
            />
          </div>
        );

      // ── CARRINHO ───────────────────────────────────────────────────────
      case "CARRINHO":
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-[11px] font-semibold text-gray-300">Exibir carrinho</Label>
              <Select
                value={config.cart.display}
                onValueChange={(v) => update({ cart: { display: v as 'open'|'closed'|'drawer' } })}
              >
                <SelectTrigger className="mt-1.5 h-8 text-xs bg-[#111827] border-white/5 hover:border-white/10 text-gray-200 focus:ring-pink-500/50 focus:ring-offset-0"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#0b0f19] border-white/10 text-gray-200 text-xs">
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
            <div className="flex items-center justify-between p-2 bg-[#111827]/40 border border-white/5 rounded-lg">
              <Label className="text-[11px] font-semibold text-gray-300">Mostrar ícone do carrinho</Label>
              <Switch className="scale-90" checked={config.cart.showIcon} onCheckedChange={(v) => update({ cart: { showIcon: v } })} />
            </div>
            <div className="flex items-center justify-between p-2 bg-[#111827]/40 border border-white/5 rounded-lg">
              <Label className="text-[11px] font-semibold text-gray-300">Permitir cupom de desconto</Label>
              <Switch className="scale-90" checked={config.cart.couponEnabled} onCheckedChange={(v) => update({ cart: { couponEnabled: v } })} />
            </div>
            <div className="flex items-center justify-between p-2 bg-[#111827]/40 border border-white/5 rounded-lg">
              <Label className="text-[11px] font-semibold text-gray-300">Lembrete do carrinho</Label>
              <Switch className="scale-90" checked={config.cart.showCartReminder} onCheckedChange={(v) => update({ cart: { showCartReminder: v } })} />
            </div>
          </div>
        );

      // ── CONTEUDO ───────────────────────────────────────────────────────
      case "CONTEUDO":
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-[11px] font-semibold text-gray-300">Visual do botão</Label>
              <Select
                value={config.buttons.nextStepStyle}
                onValueChange={(v) => update({ buttons: { nextStepStyle: v as 'rounded'|'rectangular'|'oval' } })}
              >
                <SelectTrigger className="mt-1.5 h-8 text-xs bg-[#111827] border-white/5 hover:border-white/10 text-gray-200 focus:ring-pink-500/50 focus:ring-offset-0"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#0b0f19] border-white/10 text-gray-200 text-xs">
                  <SelectItem value="rectangular">Retangular</SelectItem>
                  <SelectItem value="rounded">Arredondado</SelectItem>
                  <SelectItem value="oval">Oval</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="p-2.5 bg-[#111827]/30 border border-white/5 rounded-lg space-y-2 shadow-inner">
              <p className="text-[10px] font-bold text-pink-400/90 tracking-wide uppercase">Botão Primário (Próximo)</p>
              <ModernColorPicker label="Cor do texto" value={config.buttons.primaryText} onChange={(c) => update({ buttons: { primaryText: c } })} />
              <ModernColorPicker label="Cor de fundo" value={config.buttons.primaryBg} onChange={(c) => update({ buttons: { primaryBg: c } })} />
              <div className="flex items-center justify-between pt-0.5">
                <Label className="text-[11px] font-semibold text-gray-305">Efeito hover</Label>
                <Switch className="scale-90" checked={config.buttons.primaryHover} onCheckedChange={(v) => update({ buttons: { primaryHover: v } })} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-[11px] font-semibold text-gray-305">Efeito fluir</Label>
                <Switch className="scale-90" checked={config.buttons.primaryFlow} onCheckedChange={(v) => update({ buttons: { primaryFlow: v } })} />
              </div>
            </div>
            <div className="p-2.5 bg-[#111827]/30 border border-white/5 rounded-lg space-y-2 shadow-inner">
              <p className="text-[10px] font-bold text-pink-400/90 tracking-wide uppercase">Botão Finalizar</p>
              <ModernColorPicker label="Cor do texto" value={config.buttons.checkoutText} onChange={(c) => update({ buttons: { checkoutText: c } })} />
              <ModernColorPicker label="Cor de fundo" value={config.buttons.checkoutBg} onChange={(c) => update({ buttons: { checkoutBg: c } })} />
              <div className="flex items-center justify-between pt-0.5">
                <Label className="text-[11px] font-semibold text-gray-305">Efeito hover</Label>
                <Switch className="scale-90" checked={config.buttons.checkoutHover} onCheckedChange={(v) => update({ buttons: { checkoutHover: v } })} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-[11px] font-semibold text-gray-305">Efeito pulsante</Label>
                <Switch className="scale-90" checked={config.buttons.pulse} onCheckedChange={(v) => update({ buttons: { pulse: v } })} />
              </div>
            </div>
          </div>
        );

      // ── RODAPE ─────────────────────────────────────────────────────────
      case "RODAPE":
        return (
          <div className="space-y-3">
            <ModernColorPicker label="Cor de fundo" value={config.footer.bgColor} onChange={(c) => update({ footer: { bgColor: c } })} />
            <ModernColorPicker label="Cor do texto" value={config.footer.textColor} onChange={(c) => update({ footer: { textColor: c } })} />
            <div className="space-y-2.5 pt-1">
              <p className="text-[10px] font-bold text-pink-400/90 tracking-wide uppercase">Informações a exibir</p>

              {/* Nome da loja */}
              <div className="flex items-center justify-between p-2 bg-[#111827]/30 border border-white/5 rounded-lg">
                <Label className="text-[11px] font-semibold text-gray-300">Nome da loja</Label>
                <Switch className="scale-90" checked={config.footer.showStoreName} onCheckedChange={(v) => update({ footer: { showStoreName: v } })} />
              </div>

              {/* Formas de pagamento */}
              <div className="flex items-center justify-between p-2 bg-[#111827]/30 border border-white/5 rounded-lg">
                <Label className="text-[11px] font-semibold text-gray-300">Formas de pagamento</Label>
                <Switch className="scale-90" checked={config.footer.showPaymentMethods} onCheckedChange={(v) => update({ footer: { showPaymentMethods: v } })} />
              </div>

              {/* CNPJ/CPF */}
              <div className="flex flex-col gap-1.5 p-2 bg-[#111827]/30 border border-white/5 rounded-lg">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-semibold text-gray-300">CNPJ/CPF</Label>
                  <Switch className="scale-90" checked={config.footer.showCnpj} onCheckedChange={(v) => update({ footer: { showCnpj: v } })} />
                </div>
                {config.footer.showCnpj && (
                  <Input
                    className="mt-1 h-7 text-xs bg-[#111827] border-white/5 hover:border-white/10 text-gray-200 focus-visible:ring-pink-500/50 focus-visible:ring-offset-0 placeholder:text-gray-655"
                    value={config.footer.cnpjValue || ''}
                    onChange={(e) => update({ footer: { cnpjValue: e.target.value } })}
                    placeholder="00.000.000/0001-00"
                  />
                )}
              </div>

              {/* E-mail de contato */}
              <div className="flex flex-col gap-1.5 p-2 bg-[#111827]/30 border border-white/5 rounded-lg">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-semibold text-gray-300">E-mail de contato</Label>
                  <Switch className="scale-90" checked={config.footer.showContactEmail} onCheckedChange={(v) => update({ footer: { showContactEmail: v } })} />
                </div>
                {config.footer.showContactEmail && (
                  <Input
                    className="mt-1 h-7 text-xs bg-[#111827] border-white/5 hover:border-white/10 text-gray-200 focus-visible:ring-pink-500/50 focus-visible:ring-offset-0 placeholder:text-gray-655"
                    type="email"
                    value={config.footer.contactEmail || ''}
                    onChange={(e) => update({ footer: { contactEmail: e.target.value } })}
                    placeholder="contato@sualooja.com.br"
                  />
                )}
              </div>

              {/* Endereço */}
              <div className="flex flex-col gap-1.5 p-2 bg-[#111827]/30 border border-white/5 rounded-lg">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-semibold text-gray-300">Endereço</Label>
                  <Switch className="scale-90" checked={config.footer.showAddress} onCheckedChange={(v) => update({ footer: { showAddress: v } })} />
                </div>
                {config.footer.showAddress && (
                  <Input
                    className="mt-1 h-7 text-xs bg-[#111827] border-white/5 hover:border-white/10 text-gray-200 focus-visible:ring-pink-500/50 focus-visible:ring-offset-0 placeholder:text-gray-655"
                    value={config.footer.address || ''}
                    onChange={(e) => update({ footer: { address: e.target.value } })}
                    placeholder="Rua Exemplo, 123"
                  />
                )}
              </div>

              {/* Telefone */}
              <div className="flex flex-col gap-1.5 p-2 bg-[#111827]/30 border border-white/5 rounded-lg">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-semibold text-gray-300">Telefone</Label>
                  <Switch className="scale-90" checked={config.footer.showPhone} onCheckedChange={(v) => update({ footer: { showPhone: v } })} />
                </div>
                {config.footer.showPhone && (
                  <Input
                    className="mt-1 h-7 text-xs bg-[#111827] border-white/5 hover:border-white/10 text-gray-200 focus-visible:ring-pink-500/50 focus-visible:ring-offset-0 placeholder:text-gray-655"
                    type="tel"
                    value={config.footer.phone || ''}
                    onChange={(e) => update({ footer: { phone: e.target.value } })}
                    placeholder="(11) 99999-9999"
                  />
                )}
              </div>

              {/* Política de privacidade */}
              <div className="flex flex-col gap-1.5 p-2 bg-[#111827]/30 border border-white/5 rounded-lg">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-semibold text-gray-300">Privacidade</Label>
                  <Switch className="scale-90" checked={config.footer.showPrivacyPolicy} onCheckedChange={(v) => update({ footer: { showPrivacyPolicy: v } })} />
                </div>
                {config.footer.showPrivacyPolicy && (
                  <Input
                    className="mt-1 h-7 text-xs bg-[#111827] border-white/5 hover:border-white/10 text-gray-200 focus-visible:ring-pink-500/50 focus-visible:ring-offset-0 placeholder:text-gray-655"
                    type="url"
                    value={config.footer.privacyPolicyUrl || ''}
                    onChange={(e) => update({ footer: { privacyPolicyUrl: e.target.value } })}
                    placeholder="https://sualooja.com/privacidade"
                  />
                )}
              </div>

              {/* Termos e condições */}
              <div className="flex flex-col gap-1.5 p-2 bg-[#111827]/30 border border-white/5 rounded-lg">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-semibold text-gray-300">Termos</Label>
                  <Switch className="scale-90" checked={config.footer.showTermsConditions} onCheckedChange={(v) => update({ footer: { showTermsConditions: v } })} />
                </div>
                {config.footer.showTermsConditions && (
                  <Input
                    className="mt-1 h-7 text-xs bg-[#111827] border-white/5 hover:border-white/10 text-gray-200 focus-visible:ring-pink-500/50 focus-visible:ring-offset-0 placeholder:text-gray-655"
                    type="url"
                    value={config.footer.termsConditionsUrl || ''}
                    onChange={(e) => update({ footer: { termsConditionsUrl: e.target.value } })}
                    placeholder="https://sualooja.com/termos"
                  />
                )}
              </div>
            </div>
          </div>
        );

      // ── ESCASSEZ ───────────────────────────────────────────────────────
      case "ESCASSEZ":
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2.5 bg-red-500/5 border border-red-500/20 rounded-lg">
              <div>
                <Label className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-red-400" />
                  Gatilho de Escassez
                </Label>
                <p className="text-[10px] text-gray-400 mt-0.5">Countdown timer ativo</p>
              </div>
              <Switch
                className="scale-90"
                checked={config.scarcity.enabled}
                onCheckedChange={(v) => update({ scarcity: { enabled: v } })}
              />
            </div>
            {config.scarcity.enabled && (
              <div className="p-2 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                <p className="text-[10px] text-amber-300 flex items-start gap-1.5">
                  <Zap className="h-3 w-3 mt-0.5 flex-shrink-0 text-amber-400 animate-pulse" />
                  <span>Use de 10 a 15 minutos para melhor resultado.</span>
                </p>
              </div>
            )}
            <ModernColorPicker label="Cor da barra" value={config.scarcity.bgColor} onChange={(c) => update({ scarcity: { bgColor: c } })} />
            <ModernColorPicker label="Cor do texto" value={config.scarcity.textColor} onChange={(c) => update({ scarcity: { textColor: c } })} />
            <div>
              <Label className="text-[11px] font-semibold text-gray-300 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Duração (minutos)
              </Label>
              <Input
                type="number"
                value={config.scarcity.durationMinutes}
                onChange={(e) => update({ scarcity: { durationMinutes: parseInt(e.target.value) || 15 } })}
                placeholder="15"
                min="1"
                max="120"
                className="mt-1.5 h-8 text-xs bg-[#111827] border-white/5 hover:border-white/10 text-gray-200 focus-visible:ring-pink-500/50 focus-visible:ring-offset-0 placeholder:text-gray-655"
              />
            </div>
            <div>
              <Label className="text-[11px] font-semibold text-gray-300">Mensagem customizada</Label>
              <Textarea
                value={config.scarcity.customMessage || ''}
                onChange={(e) => update({ scarcity: { customMessage: e.target.value || null } })}
                placeholder="Oferta termina em: (automático se vazio)"
                className="mt-1.5 bg-[#111827] border-white/5 hover:border-white/10 text-gray-200 focus-visible:ring-pink-500/50 focus-visible:ring-offset-0 placeholder:text-gray-655 resize-none text-xs p-2"
                rows={2}
              />
            </div>
          </div>
        );

      // ── ORDER BUMP ─────────────────────────────────────────────────────
      case "ORDER_BUMP":
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2.5 bg-indigo-500/5 border border-indigo-500/20 rounded-lg">
              <div>
                <Label className="text-xs font-bold text-indigo-400">Ativar Order Bump</Label>
                <p className="text-[10px] text-gray-400 mt-0.5">Exibir ofertas adicionais</p>
              </div>
              <Switch className="scale-90" checked={config.orderBump.enabled} onCheckedChange={(v) => update({ orderBump: { enabled: v } })} />
            </div>
            <ModernColorPicker label="Cor do texto" value={config.orderBump.textColor} onChange={(c) => update({ orderBump: { textColor: c } })} />
            <ModernColorPicker label="Cor de fundo" value={config.orderBump.bgColor} onChange={(c) => update({ orderBump: { bgColor: c } })} />
            <ModernColorPicker label="Cor do preço" value={config.orderBump.priceColor} onChange={(c) => update({ orderBump: { priceColor: c } })} />
            <ModernColorPicker label="Cor da borda" value={config.orderBump.borderColor} onChange={(c) => update({ orderBump: { borderColor: c } })} />
            <ModernColorPicker label="Cor do botão" value={config.orderBump.buttonTextColor} onChange={(c) => update({ orderBump: { buttonTextColor: c } })} />
            <ModernColorPicker label="Cor de fundo do botão" value={config.orderBump.buttonBgColor} onChange={(c) => update({ orderBump: { buttonBgColor: c } })} />
          </div>
        );

      // ── BARRA PIX ──────────────────────────────────────────────────────
      case "BARRA_PIX":
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2 bg-[#111827]/40 border border-white/5 rounded-lg">
              <Label className="text-[11px] font-semibold text-gray-300">
                Ativar barra do PIX
              </Label>
              <Switch
                className="scale-90"
                checked={config.pixBar?.enabled ?? true}
                onCheckedChange={(v) => update({ pixBar: { enabled: v } })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[11px] font-semibold text-gray-300">Minutos</Label>
                <Input
                  type="number"
                  min="0"
                  max="59"
                  value={config.pixBar?.durationMinutes ?? 20}
                  onChange={(e) => update({ pixBar: { durationMinutes: parseInt(e.target.value) || 0 } })}
                  className="mt-1.5 h-8 text-xs bg-[#111827] border-white/5 hover:border-white/10 text-gray-200 focus-visible:ring-pink-500/50 focus-visible:ring-offset-0 placeholder:text-gray-655"
                />
              </div>
              <div>
                <Label className="text-[11px] font-semibold text-gray-300">Segundos</Label>
                <Input
                  type="number"
                  min="0"
                  max="59"
                  value={config.pixBar?.durationSeconds ?? 0}
                  onChange={(e) => update({ pixBar: { durationSeconds: parseInt(e.target.value) || 0 } })}
                  className="mt-1.5 h-8 text-xs bg-[#111827] border-white/5 hover:border-white/10 text-gray-200 focus-visible:ring-pink-500/50 focus-visible:ring-offset-0 placeholder:text-gray-655"
                />
              </div>
            </div>
            <ModernColorPicker
              label="Cor de fundo"
              value={config.pixBar?.bgColor ?? "#f8fafc"}
              onChange={(c) => update({ pixBar: { bgColor: c } })}
            />
            <ModernColorPicker
              label="Cor da borda"
              value={config.pixBar?.borderColor ?? "#e2e8f0"}
              onChange={(c) => update({ pixBar: { borderColor: c } })}
            />
            <ModernColorPicker
              label="Cor do texto"
              value={config.pixBar?.textColor ?? "#475569"}
              onChange={(c) => update({ pixBar: { textColor: c } })}
            />
            <ModernColorPicker
              label="Cor do ícone"
              value={config.pixBar?.iconColor ?? "#10b981"}
              onChange={(c) => update({ pixBar: { iconColor: c } })}
            />
            <div>
              <Label className="text-[11px] font-semibold text-gray-300">Estilo da letra</Label>
              <Select
                value={config.pixBar?.fontStyle ?? "normal"}
                onValueChange={(v) => update({ pixBar: { fontStyle: v as 'normal'|'italic' } })}
              >
                <SelectTrigger className="mt-1.5 h-8 text-xs bg-[#111827] border-white/5 hover:border-white/10 text-gray-200 focus:ring-pink-500/50 focus:ring-offset-0"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#0b0f19] border-white/10 text-gray-200 text-xs">
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="italic">Itálico</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11px] font-semibold text-gray-300">Tamanho da letra</Label>
              <Select
                value={config.pixBar?.fontSize ?? "text-xs"}
                onValueChange={(v) => update({ pixBar: { fontSize: v } })}
              >
                <SelectTrigger className="mt-1.5 h-8 text-xs bg-[#111827] border-white/5 hover:border-white/10 text-gray-200 focus:ring-pink-500/50 focus:ring-offset-0"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#0b0f19] border-white/10 text-gray-200 text-xs">
                  <SelectItem value="text-[10px]">Muito Pequeno (10px)</SelectItem>
                  <SelectItem value="text-xs">Pequeno (12px)</SelectItem>
                  <SelectItem value="text-sm">Médio (14px)</SelectItem>
                  <SelectItem value="text-base">Grande (16px)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      // ── CONFIGURACOES ──────────────────────────────────────────────────
      case "CONFIGURACOES":
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-[11px] font-semibold text-gray-300">Etapas de navegação</Label>
              <Select
                value={String(config.form.navigationSteps)}
                onValueChange={(v) => update({ form: { navigationSteps: parseInt(v) as 1|2|3 } })}
              >
                <SelectTrigger className="mt-1.5 h-8 text-xs bg-[#111827] border-white/5 hover:border-white/10 text-gray-200 focus:ring-pink-500/50 focus:ring-offset-0"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#0b0f19] border-white/10 text-gray-200 text-xs">
                  <SelectItem value="1">1 etapa</SelectItem>
                  <SelectItem value="2">2 etapas</SelectItem>
                  <SelectItem value="3">3 etapas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11px] font-semibold text-gray-300">Fonte do checkout</Label>
              <Select
                value={config.typography.fontFamily}
                onValueChange={(v) => update({ typography: { fontFamily: v } })}
              >
                <SelectTrigger className="mt-1.5 h-8 text-xs bg-[#111827] border-white/5 hover:border-white/10 text-gray-200 focus:ring-pink-500/50 focus:ring-offset-0"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#0b0f19] border-white/10 text-gray-200 text-xs">
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
              <Label className="text-[11px] font-semibold text-gray-300">Idioma</Label>
              <Select
                value={config.form.language}
                onValueChange={(v) => update({ form: { language: v as 'pt'|'en'|'es' } })}
              >
                <SelectTrigger className="mt-1.5 h-8 text-xs bg-[#111827] border-white/5 hover:border-white/10 text-gray-200 focus:ring-pink-500/50 focus:ring-offset-0"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#0b0f19] border-white/10 text-gray-200 text-xs">
                  <SelectItem value="pt">Português (BR)</SelectItem>
                  <SelectItem value="en">English (US)</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11px] font-semibold text-gray-300">Moeda</Label>
              <Select
                value={config.form.currency}
                onValueChange={(v) => update({ form: { currency: v as 'BRL'|'USD'|'EUR' } })}
              >
                <SelectTrigger className="mt-1.5 h-8 text-xs bg-[#111827] border-white/5 hover:border-white/10 text-gray-200 focus:ring-pink-500/50 focus:ring-offset-0"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#0b0f19] border-white/10 text-gray-200 text-xs">
                  <SelectItem value="BRL">Real (R$)</SelectItem>
                  <SelectItem value="USD">Dólar ($)</SelectItem>
                  <SelectItem value="EUR">Euro (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 pt-1">
              <p className="text-[10px] font-bold text-pink-400/90 tracking-wide uppercase">Opções extras</p>
              <div className="flex items-center justify-between p-2 bg-[#111827]/30 border border-white/5 rounded-lg">
                <Label className="text-[11px] text-gray-300 font-semibold">CPF apenas no pagamento</Label>
                <Switch className="scale-90" checked={config.form.requestCpfOnlyAtPayment} onCheckedChange={(v) => update({ form: { requestCpfOnlyAtPayment: v } })} />
              </div>
              <div className="flex items-center justify-between p-2 bg-[#111827]/30 border border-white/5 rounded-lg">
                <Label className="text-[11px] text-gray-300 font-semibold">Solicitar data de nascimento</Label>
                <Switch className="scale-90" checked={config.form.requestBirthDate} onCheckedChange={(v) => update({ form: { requestBirthDate: v } })} />
              </div>
              <div className="flex items-center justify-between p-2 bg-[#111827]/30 border border-white/5 rounded-lg">
                <Label className="text-[11px] text-gray-300 font-semibold">Solicitar gênero</Label>
                <Switch className="scale-90" checked={config.form.requestGender} onCheckedChange={(v) => update({ form: { requestGender: v } })} />
              </div>
            </div>
            <div className="space-y-2 pt-1">
              <p className="text-[10px] font-bold text-pink-400/90 tracking-wide uppercase">Métodos aceitos</p>
              {(['PIX', 'CREDIT_CARD', 'BOLETO'] as const).map((method) => {
                const labels: Record<string, string> = {
                  PIX: 'PIX',
                  CREDIT_CARD: 'Cartão de Crédito',
                  BOLETO: 'Boleto Bancário',
                };
                const isEnabled = config.form.paymentMethods.includes(method);
                return (
                  <div key={method} className="flex items-center justify-between p-2 bg-[#111827]/30 border border-white/5 rounded-lg">
                    <Label className="text-[11px] text-gray-305 font-semibold">{labels[method]}</Label>
                    <Switch
                      className="scale-90"
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
          <div className="py-4 text-center">
            <p className="text-xs text-gray-500">
              Configurações em breve
            </p>
          </div>
        );
    }
  };

  return (
    <div className="w-80 bg-[#070b13] border-r border-white/5 flex flex-col overflow-hidden shadow-2xl">
      {/* Header da Sidebar - Logo e Branding */}
      <div className="px-5 pt-6 pb-12 border-b border-white/5 bg-[#0b0f19]/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <img
              src="/syncads-logo.svg"
              alt="SyncAds Logo"
              className="h-12 w-12 object-contain"
            />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-black leading-tight text-white tracking-tight">
              SyncAds
            </h1>
            <p className="text-[11px] font-bold tracking-wider text-blue-400 -mt-0.5">
              MARKETING AI
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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: index * 0.03 }}
              className="border-b border-white/5"
            >
              <button
                onClick={() => onToggleSection(section.id)}
                className={cn(
                  "w-full px-4 py-3.5 flex items-center justify-between text-sm font-medium transition-all duration-200 group",
                  isExpanded
                    ? "bg-gradient-to-r from-blue-500/5 to-pink-500/5 border-l-[3px] border-pink-500 text-white"
                    : "text-gray-400 hover:text-white hover:bg-white/5",
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "p-1.5 rounded-lg transition-all duration-200",
                      isExpanded
                        ? "bg-pink-500/20"
                        : "bg-white/5 group-hover:bg-white/10",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 transition-colors",
                        isExpanded
                          ? "text-pink-400"
                          : "text-gray-400 group-hover:text-gray-200",
                      )}
                    />
                  </div>
                  <span>{section.label}</span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-pink-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500 group-hover:text-gray-350" />
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
                    <div className="p-4 bg-[#070b13]/40 border-t border-white/5">
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
      <div className="p-4 border-t border-white/5 bg-[#0b0f19]/20">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] animate-pulse" />
          <span>Alterações automáticas no preview</span>
        </div>
      </div>
    </div>
  );
};

