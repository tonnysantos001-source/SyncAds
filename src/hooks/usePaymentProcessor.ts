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
        // 4. Buscar GatewayConfig (admin ou cliente)
        // ──────────────────────────────────────────────────────────────────

        // 4a. Tentar gateway do admin se a decisão foi 'admin'
        if (splitDecision?.decision === 'admin' && splitDecision?.gatewayId) {
          console.log('[Split] Usando gateway do ADMIN');
          const { data: adminConfig } = await supabase
            .from('GatewayConfig')
            .select('*, gateway:Gateway(*)')
            .eq('userId', 'admin')
            .eq('gatewayId', splitDecision.gatewayId)
            .eq('isActive', true)
            .single();

          if (adminConfig) {
            selectedConfig = adminConfig;
            isAdminGateway = true;
          }
        }

        // 4b. Fallback: gateway do cliente
        if (!selectedConfig) {
          console.log('[Split] Usando gateway do CLIENTE');
          const { data: gatewayConfigs } = await supabase
            .from('GatewayConfig')
            .select('*, gateway:Gateway(*)')
            .eq('userId', storeUserId)
            .eq('isActive', true);

          if (!gatewayConfigs || gatewayConfigs.length === 0) {
            throw new Error(
              'Nenhum gateway de pagamento configurado para esta loja. Configure um gateway nas configurações.'
            );
          }

          for (const config of gatewayConfigs) {
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
        // 5. Criar Transaction no banco
        // ──────────────────────────────────────────────────────────────────
        const { data: transaction, error: transactionError } = await supabase
          .from('Transaction')
          .insert({
            orderId,
            gatewayId: selectedConfig.gatewayId,
            userId: storeUserId,
            amount: orderTotal,
            status: 'PENDING',
            paymentMethod,
            metadata: {
              templateSlug,
              customerData,
              addressData,
              cardData: paymentMethod === 'CREDIT_CARD' ? cardData : null,
            },
          })
          .select()
          .single();

        if (transactionError || !transaction) {
          throw new Error('Erro ao registrar transação: ' + (transactionError?.message || 'Erro desconhecido'));
        }

        // ──────────────────────────────────────────────────────────────────
        // 6. Chamar Edge Function process-payment
        // ──────────────────────────────────────────────────────────────────
        const { data: paymentResponse, error: paymentError } =
          await supabase.functions.invoke('process-payment', {
            body: {
              transactionId: transaction.id,
              gatewaySlug: selectedConfig.gateway.slug,
              paymentMethod,
              amount: orderTotal,
              customerData: {
                name: customerData.name,
                email: customerData.email,
                phone: customerData.phone.replace(/\D/g, ''),
                document: customerData.document.replace(/\D/g, ''),
              },
              addressData: {
                zipCode: addressData.zipCode.replace(/\D/g, ''),
                street: addressData.street,
                number: addressData.number,
                complement: addressData.complement || '',
                neighborhood: addressData.neighborhood,
                city: addressData.city,
                state: addressData.state,
              },
              cardData:
                paymentMethod === 'CREDIT_CARD' && cardData
                  ? {
                      number: cardData.number.replace(/\D/g, ''),
                      holderName: cardData.holderName,
                      expirationMonth: cardData.expirationMonth,
                      expirationYear: cardData.expirationYear,
                      cvv: cardData.cvv,
                      installments: cardData.installments,
                      cpf: cardData.cpf.replace(/\D/g, ''),
                    }
                  : null,
            },
          });

        if (paymentError || !paymentResponse?.success) {
          // Atualizar transação para FAILED
          await supabase
            .from('Transaction')
            .update({ status: 'FAILED', updatedAt: new Date().toISOString() })
            .eq('id', transaction.id);

          throw new Error(
            paymentResponse?.error ||
            paymentResponse?.message ||
            'Erro ao processar pagamento. Verifique os dados e tente novamente.'
          );
        }

        // ──────────────────────────────────────────────────────────────────
        // 7. Registrar PaymentSplitLog
        // ──────────────────────────────────────────────────────────────────
        if (splitDecision) {
          await supabase.from('PaymentSplitLog').insert({
            transactionId: transaction.id,
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
        }

        // ──────────────────────────────────────────────────────────────────
        // 8. Redirecionar
        // ──────────────────────────────────────────────────────────────────
        if (paymentMethod === 'PIX') {
          navigate(`/pix/${orderId}/${transaction.id}`);
        } else {
          navigate(`/checkout/success/${transaction.id}`);
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
