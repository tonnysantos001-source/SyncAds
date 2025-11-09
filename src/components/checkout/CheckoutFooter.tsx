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
  isMobile?: boolean;
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
  isMobile = false,
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
      className={cn("border-t", isMobile ? "mt-6" : "mt-12", className)}
      style={footerStyles}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div
        className={cn(
          "mx-auto",
          isMobile ? "px-2 py-4" : "px-4 py-8 max-w-7xl",
        )}
      >
        <div
          className={cn(
            "grid gap-6",
            isMobile
              ? "grid-cols-1 gap-4"
              : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8",
          )}
        >
          {/* COLUNA 1 - INFORMAÇÕES DA LOJA */}
          {(theme.showStoreName || theme.showCnpjCpf) && (
            <div className={cn(isMobile ? "space-y-2" : "space-y-3")}>
              {theme.showStoreName && (
                <h3
                  className={cn(
                    "font-bold",
                    isMobile ? "text-sm mb-2" : "text-lg mb-4",
                  )}
                  style={{ color: theme.footerTextColor || "#111827" }}
                >
                  {name}
                </h3>
              )}

              {theme.showCnpjCpf && (cnpj || cpf) && (
                <div
                  className={cn(
                    "space-y-1.5",
                    isMobile ? "text-xs" : "text-sm",
                  )}
                >
                  {cnpj && (
                    <p className="flex items-start gap-2">
                      <FileText
                        className={cn(
                          "mt-0.5 flex-shrink-0",
                          isMobile ? "w-3 h-3" : "w-4 h-4",
                        )}
                      />
                      <span>
                        <strong>CNPJ:</strong> {cnpj}
                      </span>
                    </p>
                  )}
                  {cpf && !cnpj && (
                    <p className="flex items-start gap-2">
                      <FileText
                        className={cn(
                          "mt-0.5 flex-shrink-0",
                          isMobile ? "w-3 h-3" : "w-4 h-4",
                        )}
                      />
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
            <div className={cn(isMobile ? "space-y-2" : "space-y-3")}>
              <h4
                className={cn(
                  "font-semibold",
                  isMobile ? "text-sm mb-2" : "text-base mb-4",
                )}
                style={{ color: theme.footerTextColor || "#111827" }}
              >
                Contato
              </h4>
              <div
                className={cn(
                  isMobile ? "space-y-2 text-xs" : "space-y-3 text-sm",
                )}
              >
                {theme.showContactEmail && email && (
                  <a
                    href={`mailto:${email}`}
                    className="flex items-center gap-2 hover:underline transition-all"
                    style={linkStyles}
                  >
                    <Mail
                      className={cn(
                        "flex-shrink-0",
                        isMobile ? "w-3 h-3" : "w-4 h-4",
                      )}
                    />
                    <span>{email}</span>
                  </a>
                )}
                {theme.showPhone && phone && (
                  <a
                    href={`tel:${phone.replace(/\D/g, "")}`}
                    className="flex items-center gap-2 hover:underline transition-all"
                    style={linkStyles}
                  >
                    <Phone
                      className={cn(
                        "flex-shrink-0",
                        isMobile ? "w-3 h-3" : "w-4 h-4",
                      )}
                    />
                    <span>{phone}</span>
                  </a>
                )}
                {theme.showAddress && address && (
                  <p
                    className={cn(
                      "flex items-start gap-2",
                      isMobile ? "text-xs" : "text-sm",
                    )}
                  >
                    <MapPin
                      className={cn(
                        "mt-0.5 flex-shrink-0",
                        isMobile ? "w-3 h-3" : "w-4 h-4",
                      )}
                    />
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
            <div className={cn(isMobile ? "space-y-2" : "space-y-3")}>
              <h4
                className={cn(
                  "font-semibold",
                  isMobile ? "text-sm mb-2" : "text-base mb-4",
                )}
                style={{ color: theme.footerTextColor || "#111827" }}
              >
                Informações
              </h4>
              <div
                className={cn(
                  isMobile ? "space-y-1.5 text-xs" : "space-y-2 text-sm",
                )}
              >
                {theme.showPrivacyPolicy && (
                  <a
                    href="/politica-de-privacidade"
                    className="flex items-center gap-2 hover:underline transition-all"
                    style={linkStyles}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Shield
                      className={cn(
                        "flex-shrink-0",
                        isMobile ? "w-3 h-3" : "w-4 h-4",
                      )}
                    />
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
                    <FileText
                      className={cn(
                        "flex-shrink-0",
                        isMobile ? "w-3 h-3" : "w-4 h-4",
                      )}
                    />
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
                    <RotateCcw
                      className={cn(
                        "flex-shrink-0",
                        isMobile ? "w-3 h-3" : "w-4 h-4",
                      )}
                    />
                    <span>Trocas e Devoluções</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* COLUNA 4 - MÉTODOS DE PAGAMENTO */}
          {theme.showPaymentMethods && (
            <div className={cn(isMobile ? "space-y-2" : "space-y-3")}>
              <h4
                className={cn(
                  "font-semibold",
                  isMobile ? "text-sm mb-2" : "text-base mb-4",
                )}
                style={{ color: theme.footerTextColor || "#111827" }}
              >
                Formas de Pagamento
              </h4>
              <div
                className={cn("flex flex-wrap", isMobile ? "gap-2" : "gap-3")}
              >
                {paymentMethods.map((method, index) => (
                  <motion.div
                    key={method.name}
                    className={cn(
                      "flex items-center rounded-lg border transition-all hover:shadow-md",
                      isMobile ? "gap-1.5 px-2 py-1.5" : "gap-2 px-3 py-2",
                    )}
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
                      className={cn(isMobile ? "w-4 h-4" : "w-5 h-5")}
                      style={{ color: theme.footerTextColor || "#6b7280" }}
                    />
                    <span
                      className={cn(
                        "font-medium",
                        isMobile ? "text-[10px]" : "text-xs",
                      )}
                    >
                      {method.name}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Selos de Segurança */}
              <div
                className={cn(isMobile ? "mt-3 space-y-1.5" : "mt-6 space-y-2")}
              >
                <div
                  className={cn(
                    "flex items-center gap-2",
                    isMobile ? "text-[10px]" : "text-xs",
                  )}
                >
                  <Shield
                    className={cn(isMobile ? "w-3 h-3" : "w-4 h-4")}
                    style={{ color: "#10b981" }}
                  />
                  <span>Compra 100% Segura</span>
                </div>
                <div
                  className={cn(
                    "flex items-center gap-2",
                    isMobile ? "text-[10px]" : "text-xs",
                  )}
                >
                  <Shield
                    className={cn(isMobile ? "w-3 h-3" : "w-4 h-4")}
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
          className={cn("h-px", isMobile ? "my-4" : "my-6")}
          style={{
            backgroundColor: theme.footerTextColor
              ? `${theme.footerTextColor}20`
              : "#e5e7eb",
          }}
        />

        {/* COPYRIGHT */}
        <div className={cn("text-center", isMobile ? "text-xs" : "text-sm")}>
          <p>
            © {new Date().getFullYear()}{" "}
            {theme.showStoreName ? name : "Todos os direitos reservados"}
          </p>
          <p
            className={cn(
              "mt-1 opacity-70",
              isMobile ? "text-[10px]" : "text-xs",
            )}
          >
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
