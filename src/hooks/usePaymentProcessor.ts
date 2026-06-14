/**
 * usePaymentProcessor.ts — Hook de Processamento de Pagamento Real
 *
 * Fase 2: Conecta todos os templates ao fluxo real de pagamento:
 * 1. UPDATE Order com dados do cliente
 * 2. RPC determine_split_gateway → decide gateway admin ou cliente
 * 3. Busca GatewayConfig configurado para o método escolhido
 * 4. INSERT Transaction { status: 'PENDING' }
 * 5. INVOKE Edge Function 'process-payment'
 * 6. INSERT PaymentSplitLog
 * 7. Redireciona: PIX → /pix/:orderId/:txId | Cartão → /checkout/success/:txId
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

// ─── TIPOS ───────────────────────────────────────────────────────────────────

export type CheckoutPaymentMethod = 'PIX' | 'CREDIT_CARD' | 'BOLETO';

export interface ProcessorCustomerData {
  name: string;
  email: string;
  phone: string;
  /** CPF ou CNPJ (somente dígitos) */
  document: string;
}

export interface ProcessorAddressData {
  zipCode: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface ProcessorCardData {
  number: string;
  holderName: string;
  /** Mês de expiração: "01" – "12" */
  expirationMonth: string;
  /** Ano de expiração: "25", "26"... */
  expirationYear: string;
  cvv: string;
  installments: number;
  /** CPF/CNPJ do titular do cartão (somente dígitos) */
  cpf: string;
}

export interface ProcessPaymentOptions {
  paymentMethod: CheckoutPaymentMethod;
  customerData: ProcessorCustomerData;
  addressData: ProcessorAddressData;
  cardData?: ProcessorCardData; // obrigatório quando method === 'CREDIT_CARD'
}

export interface UsePaymentProcessorOptions {
  orderId: string;
  /** userId do dono da loja (extraído do checkoutData ou Order) */
  userId?: string;
  /** Valor total do pedido em reais */
  total: number;
  templateSlug?: string;
}

export interface UsePaymentProcessorReturn {
  processPayment: (opts: ProcessPaymentOptions) => Promise<void>;
  processing: boolean;
  error: string | null;
}

// ─── HOOK ────────────────────────────────────────────────────────────────────

export function usePaymentProcessor({
  orderId,
  userId,
  total,
  templateSlug = 'unknown',
}: UsePaymentProcessorOptions): UsePaymentProcessorReturn {
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processPayment = useCallback(
    async ({
      paymentMethod,
      customerData,
      addressData,
      cardData,
    }: ProcessPaymentOptions) => {
      if (!orderId) {
        setError('ID do pedido não encontrado');
        return;
      }

      setProcessing(true);
      setError(null);

      try {
        // ──────────────────────────────────────────────────────────────────
        // 1. Buscar dados do pedido (para obter userId do lojista)
        // ──────────────────────────────────────────────────────────────────
        const { data: orderData, error: orderError } = await supabase
          .from('Order')
          .select('id, userId, total')
          .eq('id', orderId)
          .single();

        if (orderError || !orderData) {
          throw new Error('Pedido não encontrado');
        }

        const storeUserId = userId || orderData.userId;
        const orderTotal = total || orderData.total;

        // ──────────────────────────────────────────────────────────────────
        // 2. Atualizar Order com dados do cliente
        // ──────────────────────────────────────────────────────────────────
        const { error: updateError } = await supabase
          .from('Order')
          .update({
            customerName: customerData.name,
            customerEmail: customerData.email,
            customerPhone: customerData.phone,
            customerCpf: customerData.document.replace(/\D/g, ''),
            shippingAddress: {
              zipCode: addressData.zipCode.replace(/\D/g, ''),
              street: addressData.street,
              number: addressData.number,
              complement: addressData.complement || '',
              neighborhood: addressData.neighborhood,
              city: addressData.city,
              state: addressData.state,
            },
            paymentMethod,
            updatedAt: new Date().toISOString(),
          })
          .eq('id', orderId);

        if (updateError) {
          throw new Error('Erro ao atualizar pedido: ' + updateError.message);
        }

        // ──────────────────────────────────────────────────────────────────
        // 3. Determinar gateway via sistema de split
        // ──────────────────────────────────────────────────────────────────
        const { data: splitDecision, error: splitError } = await supabase.rpc(
          'determine_split_gateway',
          {
            p_user_id: storeUserId,
            p_order_value: orderTotal,
          }
        );

        if (splitError) {
          console.warn('[Split] Erro ao determinar split (continuando):', splitError);
        }

        console.log('[Split] Decisão:', splitDecision);

        let selectedConfig: any = null;
        let isAdminGateway = false;

        // ──────────────────────────────────────────────────────────────────
        // 4. Buscar GatewayConfig (admin ou cliente) via RPC seguro (bypassa RLS)
        // ──────────────────────────────────────────────────────────────────

        // 4a. Tentar gateway do admin se a decisão foi 'admin'
        if (splitDecision?.decision === 'admin' && splitDecision?.gatewayId) {
          console.log('[Split] Usando gateway do ADMIN via RPC');
          const { data: adminConfigs, error: adminRpcError } = await supabase.rpc(
            'get_active_gateways_for_checkout',
            { p_user_id: 'admin' }
          );

          if (adminRpcError) {
            console.error('[RPC get_active_gateways_for_checkout admin] Erro:', adminRpcError);
          } else if (adminConfigs) {
            const adminConfig = (adminConfigs as any[]).find(
              (c) => c.gatewayId === splitDecision.gatewayId
            );
            if (adminConfig) {
              selectedConfig = adminConfig;
              isAdminGateway = true;
            }
          }
        }

        // 4b. Fallback: gateway do cliente via RPC
        if (!selectedConfig) {
          console.log('[Split] Usando gateway do CLIENTE via RPC');
          const { data: gatewayConfigs, error: clientRpcError } = await supabase.rpc(
            'get_active_gateways_for_checkout',
            { p_user_id: storeUserId }
          );

          if (clientRpcError) {
            console.error('[RPC get_active_gateways_for_checkout cliente] Erro:', clientRpcError);
            throw new Error('Erro ao carregar os gateways de pagamento da loja.');
          }

          if (!gatewayConfigs || (gatewayConfigs as any[]).length === 0) {
            throw new Error(
              'Nenhum gateway de pagamento configurado para esta loja. Configure um gateway nas configurações.'
            );
          }

          for (const config of (gatewayConfigs as any[])) {
            const gw = config.gateway;
            if (!gw) continue;
            const isDefault = config.isDefault || false;

            if (paymentMethod === 'PIX' && gw.supportsPix) {
              selectedConfig = config;
              if (isDefault) break;
            } else if (paymentMethod === 'CREDIT_CARD' && gw.supportsCreditCard) {
              selectedConfig = config;
              if (isDefault) break;
            } else if (paymentMethod === 'BOLETO' && gw.supportsBoleto) {
              selectedConfig = config;
              if (isDefault) break;
            }
          }
        }

        if (!selectedConfig) {
          throw new Error(
            `Nenhum gateway configurado suporta ${paymentMethod === 'PIX' ? 'PIX' : paymentMethod === 'CREDIT_CARD' ? 'Cartão de Crédito' : 'Boleto'}. Verifique as configurações.`
          );
        }

        console.log(
          '[Split] Gateway selecionado:',
          selectedConfig.gateway?.name,
          isAdminGateway ? '(ADMIN)' : '(CLIENTE)'
        );

        // ──────────────────────────────────────────────────────────────────
        // 5. Chamar Edge Function process-payment
        // A edge function cria a Transaction internamente com service_role
        // (bypassa RLS), processa o pagamento e retorna o transactionId.
        // ──────────────────────────────────────────────────────────────────
        const paymentMethodMap: Record<string, string> = {
          PIX: 'pix',
          CREDIT_CARD: 'credit_card',
          BOLETO: 'boleto',
        };

        const { data: paymentResponse, error: paymentError } =
          await supabase.functions.invoke('process-payment', {
            body: {
              userId: storeUserId,
              orderId,
              amount: orderTotal,
              paymentMethod: paymentMethodMap[paymentMethod] || paymentMethod.toLowerCase(),
              customer: {
                name: customerData.name,
                email: customerData.email,
                phone: customerData.phone.replace(/\D/g, ''),
                document: customerData.document.replace(/\D/g, ''),
              },
              billingAddress: {
                zipCode: addressData.zipCode.replace(/\D/g, ''),
                street: addressData.street,
                number: addressData.number,
                complement: addressData.complement || '',
                neighborhood: addressData.neighborhood,
                city: addressData.city,
                state: addressData.state,
              },
              card:
                paymentMethod === 'CREDIT_CARD' && cardData
                  ? {
                      number: cardData.number.replace(/\D/g, ''),
                      holderName: cardData.holderName,
                      expiryMonth: cardData.expirationMonth,
                      expiryYear: cardData.expirationYear,
                      cvv: cardData.cvv,
                    }
                  : undefined,
              installments: paymentMethod === 'CREDIT_CARD' && cardData ? cardData.installments : undefined,
              metadata: {
                templateSlug,
                gatewayConfigId: selectedConfig.id,
                isAdminGateway,
              },
            },
          });

        if (paymentError || !paymentResponse?.success) {
          throw new Error(
            paymentResponse?.error ||
            paymentResponse?.message ||
            'Erro ao processar pagamento. Verifique os dados e tente novamente.'
          );
        }

        console.log('[usePaymentProcessor] Pagamento processado com sucesso:', paymentResponse);

        // transactionId retornado pela edge function (Transaction criada com service_role)
        const transactionId = paymentResponse.transactionId || '';

        // ──────────────────────────────────────────────────────────────────
        // 6. Registrar PaymentSplitLog (opcional, não bloqueia o fluxo)
        // ──────────────────────────────────────────────────────────────────
        if (splitDecision && transactionId) {
          try {
            await supabase.from('PaymentSplitLog').insert({
              transactionId,
              orderId,
              userId: storeUserId,
              ruleId: splitDecision.ruleId || null,
              decision: splitDecision.decision || 'client',
              gatewayId: selectedConfig.gatewayId,
              gatewayName: selectedConfig.gateway?.name,
              amount: orderTotal,
              adminRevenue: isAdminGateway ? orderTotal : 0,
              clientRevenue: isAdminGateway ? 0 : orderTotal,
              ruleType: splitDecision.ruleType || null,
              ruleName: splitDecision.ruleName || null,
              reason: splitDecision.reason || 'No split rule active',
              counterValue: splitDecision.counterValue || null,
              metadata: {
                templateSlug,
                paymentMethod,
                isAdminGateway,
              },
            });
            console.log('[Split] Log registrado com sucesso');
          } catch (splitLogError) {
            console.warn('[Split] Falha ao registrar log (não crítico):', splitLogError);
          }
        }

        // ──────────────────────────────────────────────────────────────────
        // 7. Redirecionar
        // ──────────────────────────────────────────────────────────────────
        if (paymentMethod === 'PIX') {
          navigate(`/pix/${orderId}/${transactionId}`);
        } else {
          navigate(`/checkout/success/${transactionId}`);
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Erro desconhecido ao processar pagamento';
        console.error('[usePaymentProcessor] Erro:', err);
        setError(message);
      } finally {
        setProcessing(false);
      }
    },
    [orderId, userId, total, templateSlug, navigate]
  );

  return { processPayment, processing, error };
}
