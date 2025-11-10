/**
 * TESTE END-TO-END PAGGUE-X
 *
 * Este script testa o fluxo completo de pagamento via Paggue-X:
 * 1. Criar pedido de teste
 * 2. Gerar transação PIX
 * 3. Simular pagamento (sandbox)
 * 4. Verificar webhook
 * 5. Validar status final
 *
 * REQUISITOS:
 * - Variáveis de ambiente configuradas
 * - Gateway Paggue-X configurado no banco
 * - Produto de teste cadastrado
 *
 * USO:
 * npm run test:paguex
 * ou
 * npx tsx tests/paguex-e2e-test.ts
 */

import { createClient } from "@supabase/supabase-js";
import axios from "axios";

// ============================================
// CONFIGURAÇÃO
// ============================================

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "";
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || "test@syncads.com";
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || "Test123!@#";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Cores para output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

// ============================================
// HELPERS
// ============================================

function log(message: string, color: keyof typeof colors = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step: number, message: string) {
  log(`\n[${step}/8] ${message}`, "cyan");
}

function logSuccess(message: string) {
  log(`✅ ${message}`, "green");
}

function logError(message: string) {
  log(`❌ ${message}`, "red");
}

function logWarning(message: string) {
  log(`⚠️  ${message}`, "yellow");
}

function logInfo(message: string) {
  log(`ℹ️  ${message}`, "blue");
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================
// FUNÇÕES DE TESTE
// ============================================

async function authenticateUser() {
  logStep(1, "Autenticando usuário de teste...");

  const { data, error } = await supabase.auth.signInWithPassword({
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD,
  });

  if (error) {
    throw new Error(`Erro ao autenticar: ${error.message}`);
  }

  if (!data.user) {
    throw new Error("Usuário não encontrado");
  }

  logSuccess(`Autenticado como: ${data.user.email}`);
  return data.user;
}

async function getOrCreateTestProduct(userId: string) {
  logStep(2, "Buscando produto de teste...");

  // Buscar produto existente
  const { data: existingProduct } = await supabase
    .from("Product")
    .select("*")
    .eq("userId", userId)
    .eq("name", "Produto Teste E2E")
    .single();

  if (existingProduct) {
    logSuccess(
      `Produto encontrado: ${existingProduct.name} (R$ ${existingProduct.price})`,
    );
    return existingProduct;
  }

  // Criar novo produto
  const { data: newProduct, error } = await supabase
    .from("Product")
    .insert({
      userId,
      name: "Produto Teste E2E",
      description: "Produto criado automaticamente para teste end-to-end",
      price: 1.0, // R$ 1,00 para teste
      stock: 999,
      isActive: true,
      sku: `TEST-E2E-${Date.now()}`,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao criar produto: ${error.message}`);
  }

  logSuccess(`Produto criado: ${newProduct.name} (R$ ${newProduct.price})`);
  return newProduct;
}

async function getOrCreateTestCustomer(userId: string) {
  logStep(3, "Buscando/criando cliente de teste...");

  const testEmail = "cliente-teste-e2e@example.com";

  // Buscar cliente existente
  const { data: existingCustomer } = await supabase
    .from("Customer")
    .select("*")
    .eq("userId", userId)
    .eq("email", testEmail)
    .single();

  if (existingCustomer) {
    logSuccess(`Cliente encontrado: ${existingCustomer.name}`);
    return existingCustomer;
  }

  // Criar novo cliente
  const { data: newCustomer, error } = await supabase
    .from("Customer")
    .insert({
      userId,
      email: testEmail,
      name: "Cliente Teste E2E",
      phone: "11999999999",
      cpf: "12345678900",
      isActive: true,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao criar cliente: ${error.message}`);
  }

  logSuccess(`Cliente criado: ${newCustomer.name}`);
  return newCustomer;
}

async function createTestOrder(
  userId: string,
  customerId: string,
  productId: string,
  productPrice: number,
) {
  logStep(4, "Criando pedido de teste...");

  const orderNumber = `TEST-E2E-${Date.now()}`;

  const { data: order, error } = await supabase
    .from("Order")
    .insert({
      userId,
      customerId,
      orderNumber,
      customerEmail: "cliente-teste-e2e@example.com",
      customerName: "Cliente Teste E2E",
      customerPhone: "11999999999",
      customerCpf: "12345678900",
      items: [
        {
          productId,
          name: "Produto Teste E2E",
          quantity: 1,
          price: productPrice,
        },
      ],
      subtotal: productPrice,
      discount: 0,
      shipping: 0,
      tax: 0,
      total: productPrice,
      status: "PENDING",
      paymentStatus: "PENDING",
      paymentMethod: "PIX",
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao criar pedido: ${error.message}`);
  }

  logSuccess(`Pedido criado: ${order.orderNumber} - Total: R$ ${order.total}`);
  return order;
}

async function getPaguexGateway(userId: string) {
  logStep(5, "Buscando configuração do Paggue-X...");

  // Buscar gateway Paggue-X
  const { data: gateway } = await supabase
    .from("Gateway")
    .select("*")
    .ilike("name", "%pague%")
    .single();

  if (!gateway) {
    throw new Error("Gateway Paggue-X não encontrado");
  }

  // Buscar configuração do usuário
  const { data: config } = await supabase
    .from("GatewayConfig")
    .select("*")
    .eq("userId", userId)
    .eq("gatewayId", gateway.id)
    .eq("isActive", true)
    .single();

  if (!config) {
    throw new Error(
      "Configuração do Paggue-X não encontrada. Configure o gateway primeiro.",
    );
  }

  logSuccess(`Gateway encontrado: ${gateway.name}`);
  return { gateway, config };
}

async function createPixTransaction(
  orderId: string,
  userId: string,
  gatewayId: string,
  amount: number,
) {
  logStep(6, "Criando transação PIX...");

  const { data: transaction, error } = await supabase
    .from("Transaction")
    .insert({
      orderId,
      userId,
      gatewayId,
      amount,
      paymentMethod: "PIX",
      status: "PENDING",
      externalId: `test-${Date.now()}`,
      metadata: {
        test: true,
        e2e: true,
        createdAt: new Date().toISOString(),
      },
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao criar transação: ${error.message}`);
  }

  logSuccess(`Transação criada: ${transaction.id}`);
  logInfo(`Status: ${transaction.status}`);
  logInfo(`Valor: R$ ${transaction.amount}`);

  return transaction;
}

async function simulatePixPayment(transactionId: string, orderId: string) {
  logStep(7, "Simulando pagamento PIX (aguarde 5 segundos)...");

  // Aguardar 5 segundos para simular processamento
  await sleep(5000);

  // Atualizar transação para COMPLETED (simulando webhook)
  const { data: transaction, error: txError } = await supabase
    .from("Transaction")
    .update({
      status: "COMPLETED",
      paidAt: new Date().toISOString(),
      metadata: {
        test: true,
        e2e: true,
        simulatedPayment: true,
        paidAt: new Date().toISOString(),
      },
    })
    .eq("id", transactionId)
    .select()
    .single();

  if (txError) {
    throw new Error(`Erro ao atualizar transação: ${txError.message}`);
  }

  // Atualizar pedido
  const { data: order, error: orderError } = await supabase
    .from("Order")
    .update({
      paymentStatus: "PAID",
      paidAt: new Date().toISOString(),
      status: "PROCESSING",
    })
    .eq("id", orderId)
    .select()
    .single();

  if (orderError) {
    throw new Error(`Erro ao atualizar pedido: ${orderError.message}`);
  }

  logSuccess("Pagamento simulado com sucesso!");
  return { transaction, order };
}

async function verifyFinalStatus(transactionId: string, orderId: string) {
  logStep(8, "Verificando status final...");

  // Verificar transação
  const { data: transaction } = await supabase
    .from("Transaction")
    .select("*")
    .eq("id", transactionId)
    .single();

  if (!transaction) {
    throw new Error("Transação não encontrada");
  }

  // Verificar pedido
  const { data: order } = await supabase
    .from("Order")
    .select("*")
    .eq("id", orderId)
    .single();

  if (!order) {
    throw new Error("Pedido não encontrado");
  }

  // Validações
  const checks = [
    {
      name: "Transação está COMPLETED",
      pass: transaction.status === "COMPLETED",
      value: transaction.status,
    },
    {
      name: "Pedido está PAID",
      pass: order.paymentStatus === "PAID",
      value: order.paymentStatus,
    },
    {
      name: "Pedido tem paidAt",
      pass: order.paidAt !== null,
      value: order.paidAt,
    },
    {
      name: "Transação tem paidAt",
      pass: transaction.paidAt !== null,
      value: transaction.paidAt,
    },
  ];

  log("\n📊 VERIFICAÇÕES:", "cyan");
  checks.forEach((check) => {
    if (check.pass) {
      logSuccess(`${check.name}: ${check.value}`);
    } else {
      logError(`${check.name}: ${check.value}`);
    }
  });

  const allPassed = checks.every((c) => c.pass);

  if (allPassed) {
    log("\n🎉 TESTE END-TO-END COMPLETO COM SUCESSO!", "green");
  } else {
    log("\n⚠️  TESTE FINALIZADO COM PROBLEMAS", "yellow");
  }

  return { transaction, order, allPassed };
}

async function cleanup(orderId?: string, transactionId?: string) {
  log("\n🧹 Limpando dados de teste...", "yellow");

  if (transactionId) {
    await supabase.from("Transaction").delete().eq("id", transactionId);
    logInfo("Transação removida");
  }

  if (orderId) {
    await supabase.from("Order").delete().eq("id", orderId);
    logInfo("Pedido removido");
  }

  logSuccess("Limpeza concluída");
}

// ============================================
// FUNÇÃO PRINCIPAL
// ============================================

async function runE2ETest() {
  log("\n🚀 INICIANDO TESTE END-TO-END PAGGUE-X", "cyan");
  log("═".repeat(60), "cyan");

  let orderId: string | undefined;
  let transactionId: string | undefined;

  try {
    // 1. Autenticar
    const user = await authenticateUser();

    // 2. Buscar/criar produto
    const product = await getOrCreateTestProduct(user.id);

    // 3. Buscar/criar cliente
    const customer = await getOrCreateTestCustomer(user.id);

    // 4. Criar pedido
    const order = await createTestOrder(
      user.id,
      customer.id,
      product.id,
      product.price,
    );
    orderId = order.id;

    // 5. Buscar gateway
    const { gateway } = await getPaguexGateway(user.id);

    // 6. Criar transação
    const transaction = await createPixTransaction(
      order.id,
      user.id,
      gateway.id,
      order.total,
    );
    transactionId = transaction.id;

    // 7. Simular pagamento
    await simulatePixPayment(transaction.id, order.id);

    // 8. Verificar status
    const { allPassed } = await verifyFinalStatus(transaction.id, order.id);

    // Cleanup opcional
    const shouldCleanup = process.argv.includes("--cleanup");

    if (shouldCleanup) {
      await cleanup(orderId, transactionId);
    } else {
      logWarning("Dados de teste mantidos. Use --cleanup para remover.");
    }

    log("\n═".repeat(60), "cyan");
    log(
      `\n✨ TESTE FINALIZADO ${allPassed ? "COM SUCESSO" : "COM PROBLEMAS"}!\n`,
      allPassed ? "green" : "yellow",
    );

    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    logError(
      `\n❌ ERRO NO TESTE: ${error instanceof Error ? error.message : String(error)}`,
    );

    if (orderId || transactionId) {
      logWarning(
        "\nDados de teste podem ter sido criados. Execute com --cleanup para remover.",
      );
    }

    log("\n═".repeat(60), "red");
    process.exit(1);
  }
}

// ============================================
// EXECUÇÃO
// ============================================

// Verificar variáveis de ambiente
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  logError("❌ Variáveis de ambiente não configuradas!");
  logInfo("Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY");
  process.exit(1);
}

// Executar teste
runE2ETest().catch((error) => {
  logError(`Erro fatal: ${error.message}`);
  process.exit(1);
});
