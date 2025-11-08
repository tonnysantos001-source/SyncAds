/**
 * CheckoutFooter - Rodapé Totalmente Customizável
 *
 * Suporta todas as personalizações do tema:
 * - Informações da loja (nome, CNPJ/CPF)
 * - Contato (email, telefone, endereço)
 * - Links legais (privacidade, termos, trocas)
 * - Métodos de pagamento (ícones)
 * - Cores customizadas
 * - Responsivo
 *
 * @version 1.0
 * @date 08/01/2025
 */

import React from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  Smartphone,
  Barcode,
  Mail,
  Phone,
  MapPin,
  Shield,
  FileText,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckoutFooterProps {
  theme: any;
  storeData?: {
    name?: string;
    cnpj?: string;
    cpf?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  className?: string;
}

export const CheckoutFooter: React.FC<CheckoutFooterProps> = ({
  theme,
  storeData = {},
  className = "",
}) => {
  // ============================================
  // VERIFICAR SE DEVE MOSTRAR O RODAPÉ
  // ============================================

  const shouldShowFooter =
    theme.showStoreName ||
    theme.showCnpjCpf ||
    theme.showContactEmail ||
    theme.showAddress ||
    theme.showPhone ||
    theme.showPaymentMethods ||
    theme.showPrivacyPolicy ||
    theme.showTermsConditions ||
    theme.showReturns;

  if (!shouldShowFooter) return null;

  // ============================================
  // DADOS DA LOJA
  // ============================================

  const {
    name = "Minha Loja",
    cnpj,
    cpf,
    email = "contato@loja.com",
    phone = "(11) 99999-9999",
    address = "Rua Exemplo, 123 - São Paulo, SP",
  } = storeData;

  // ============================================
  // ESTILOS
  // ============================================

  const footerStyles: React.CSSProperties = {
    backgroundColor: theme.footerBackgroundColor || "#ffffff",
    color: theme.footerTextColor || "#6b7280",
    borderTopColor: theme.footerTextColor
      ? `${theme.footerTextColor}20`
      : "#e5e7eb",
  };

  const linkStyles: React.CSSProperties = {
    color: theme.footerLinkColor || theme.footerTextColor || "#8b5cf6",
  };

  // ============================================
  // MÉTODOS DE PAGAMENTO
  // ============================================

  const paymentMethods = [
    { name: "Cartão de Crédito", icon: CreditCard },
    { name: "PIX", icon: Smartphone },
    { name: "Boleto", icon: Barcode },
  ];

  // ============================================
  // RENDER
  // ============================================

  return (
    <motion.footer
      className={cn("border-t mt-12", className)}
      style={footerStyles}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* COLUNA 1 - INFORMAÇÕES DA LOJA */}
          {(theme.showStoreName || theme.showCnpjCpf) && (
            <div className="space-y-3">
              {theme.showStoreName && (
                <h3
                  className="text-lg font-bold mb-4"
                  style={{ color: theme.footerTextColor || "#111827" }}
                >
                  {name}
                </h3>
              )}

              {theme.showCnpjCpf && (cnpj || cpf) && (
                <div className="space-y-2 text-sm">
                  {cnpj && (
                    <p className="flex items-start gap-2">
                      <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>
                        <strong>CNPJ:</strong> {cnpj}
                      </span>
                    </p>
                  )}
                  {cpf && !cnpj && (
                    <p className="flex items-start gap-2">
                      <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>
                        <strong>CPF:</strong> {cpf}
                      </span>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* COLUNA 2 - CONTATO */}
          {(theme.showContactEmail || theme.showPhone) && (
            <div className="space-y-3">
              <h4
                className="text-base font-semibold mb-4"
                style={{ color: theme.footerTextColor || "#111827" }}
              >
                Contato
              </h4>
              <div className="space-y-3 text-sm">
                {theme.showContactEmail && email && (
                  <a
                    href={`mailto:${email}`}
                    className="flex items-center gap-2 hover:underline transition-all"
                    style={linkStyles}
                  >
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span>{email}</span>
                  </a>
                )}
                {theme.showPhone && phone && (
                  <a
                    href={`tel:${phone.replace(/\D/g, "")}`}
                    className="flex items-center gap-2 hover:underline transition-all"
                    style={linkStyles}
                  >
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <span>{phone}</span>
                  </a>
                )}
                {theme.showAddress && address && (
                  <p className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{address}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* COLUNA 3 - LINKS LEGAIS */}
          {(theme.showPrivacyPolicy ||
            theme.showTermsConditions ||
            theme.showReturns) && (
            <div className="space-y-3">
              <h4
                className="text-base font-semibold mb-4"
                style={{ color: theme.footerTextColor || "#111827" }}
              >
                Informações
              </h4>
              <div className="space-y-2 text-sm">
                {theme.showPrivacyPolicy && (
                  <a
                    href="/politica-de-privacidade"
                    className="flex items-center gap-2 hover:underline transition-all"
                    style={linkStyles}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Shield className="w-4 h-4 flex-shrink-0" />
                    <span>Política de Privacidade</span>
                  </a>
                )}
                {theme.showTermsConditions && (
                  <a
                    href="/termos-e-condicoes"
                    className="flex items-center gap-2 hover:underline transition-all"
                    style={linkStyles}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FileText className="w-4 h-4 flex-shrink-0" />
                    <span>Termos e Condições</span>
                  </a>
                )}
                {theme.showReturns && (
                  <a
                    href="/trocas-e-devolucoes"
                    className="flex items-center gap-2 hover:underline transition-all"
                    style={linkStyles}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <RotateCcw className="w-4 h-4 flex-shrink-0" />
                    <span>Trocas e Devoluções</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* COLUNA 4 - MÉTODOS DE PAGAMENTO */}
          {theme.showPaymentMethods && (
            <div className="space-y-3">
              <h4
                className="text-base font-semibold mb-4"
                style={{ color: theme.footerTextColor || "#111827" }}
              >
                Formas de Pagamento
              </h4>
              <div className="flex flex-wrap gap-3">
                {paymentMethods.map((method, index) => (
                  <motion.div
                    key={method.name}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border transition-all hover:shadow-md"
                    style={{
                      borderColor: theme.footerTextColor
                        ? `${theme.footerTextColor}20`
                        : "#e5e7eb",
                      backgroundColor: theme.footerTextColor
                        ? `${theme.footerTextColor}05`
                        : "#f9fafb",
                    }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.1 * index }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <method.icon
                      className="w-5 h-5"
                      style={{ color: theme.footerTextColor || "#6b7280" }}
                    />
                    <span className="text-xs font-medium">{method.name}</span>
                  </motion.div>
                ))}
              </div>

              {/* Selos de Segurança */}
              <div className="mt-6 space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <Shield
                    className="w-4 h-4"
                    style={{ color: "#10b981" }}
                  />
                  <span>Compra 100% Segura</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Shield
                    className="w-4 h-4"
                    style={{ color: "#10b981" }}
                  />
                  <span>Certificado SSL</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* DIVIDER */}
        <div
          className="my-6 h-px"
          style={{
            backgroundColor: theme.footerTextColor
              ? `${theme.footerTextColor}20`
              : "#e5e7eb",
          }}
        />

        {/* COPYRIGHT */}
        <div className="text-center text-sm">
          <p>
            © {new Date().getFullYear()} {theme.showStoreName ? name : "Todos os direitos reservados"}
          </p>
          <p className="mt-1 text-xs opacity-70">
            Powered by{" "}
            <a
              href="https://syncads.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline font-medium"
              style={linkStyles}
            >
              SyncAds
            </a>
          </p>
        </div>
      </div>
    </motion.footer>
  );
};

export default CheckoutFooter;
