import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

interface ShippingMethod {
  id: string;
  name: string;
  type: string;
  basePrice: number;
  estimatedDays: number;
}

interface OrderResult {
  orderId: string;
  total: number;
  subtotal: number;
  shipping: number;
  shippingMethod: string;
}

async function authenticateUser(email: string, password: string) {
  console.log('🔐 Autenticando usuário...');
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('❌ Erro ao autenticar:', error.message);
    throw error;
  }

  console.log('✅ Usuário autenticado:', data.user?.email);
  return data.user;
}

async function getOrCreateShippingMethods(userId: string): Promise<ShippingMethod[]> {
  console.log('\n📦 Verificando métodos de frete...');

  // Buscar métodos existentes
  const { data: existingMethods, error: fetchError } = await supabase
    .from('ShippingMethod')
    .select('*')
    .eq('userId', userId)
    .eq('isActive', true);

  if (fetchError) {
    console.error('❌ Erro ao buscar métodos de frete:', fetchError.message);
    throw fetchError;
  }

  if (existingMethods && existingMethods.length > 0) {
    console.log(`✅ Encontrados ${existingMethods.length} métodos de frete`);
    existingMethods.forEach(method => {
      console.log(`   - ${method.name}: R$ ${method.basePrice} (${method.estimatedDays} dias)`);
    });
    return existingMethods;
  }

  // Criar métodos padrão se não existir
  console.log('📝 Criando métodos de frete padrão...');

  const defaultMethods = [
    {
      userId,
      name: 'Frete Grátis',
      description: 'Entrega gratuita para todo o Brasil',
      type: 'FIXED',
      basePrice: 0.00,
      pricePerUnit: 0,
      estimatedDays: 15,
      isActive: true,
      isDefault: true,
    },
    {
      userId,
      name: 'PAC - Correios',
      description: 'Entrega econômica pelos Correios',
      type: 'FIXED',
      basePrice: 15.50,
      pricePerUnit: 0,
      estimatedDays: 10,
      isActive: true,
      isDefault: false,
    },
    {
      userId,
      name: 'SEDEX - Correios',
      description: 'Entrega rápida pelos Correios',
      type: 'FIXED',
      basePrice: 25.00,
      pricePerUnit: 0,
      estimatedDays: 5,
      isActive: true,
      isDefault: false,
    },
  ];

  const { data: createdMethods, error: createError } = await supabase
    .from('ShippingMethod')
    .insert(defaultMethods)
    .select();

  if (createError) {
    console.error('❌ Erro ao criar métodos de frete:', createError.message);
    throw createError;
  }

  console.log(`✅ ${createdMethods.length} métodos de frete criados`);
  createdMethods.forEach(method => {
    console.log(`   - ${method.name}: R$ ${method.basePrice} (${method.estimatedDays} dias)`);
  });

  return createdMethods;
}

async function createTestProduct(userId: string) {
  console.log('\n🛍️ Criando produto de teste...');

  const productData = {
    userId,
    name: 'Produto Teste - Frete',
    description: 'Produto para testar integração de frete',
    price: 99.90,
    stock: 100,
    isActive: true,
    category: 'Teste',
  };

  const { data: product, error } = await supabase
    .from('Product')
    .insert(productData)
    .select()
    .single();

  if (error) {
    console.error('❌ Erro ao criar produto:', error.message);
    throw error;
  }

  console.log(`✅ Produto criado: ${product.name} - R$ ${product.price}`);
  return product;
}

async function createTestCustomer(userId: string) {
  console.log('\n👤 Criando cliente de teste...');

  const customerData = {
    userId,
    name: 'Cliente Teste Frete',
    email: 'teste.frete@example.com',
    phone: '11999999999',
    cpf: '12345678901',
  };

  const { data: customer, error } = await supabase
    .from('Customer')
    .insert(customerData)
    .select()
    .single();

  if (error) {
    console.error('❌ Erro ao criar cliente:', error.message);
    throw error;
  }

  console.log(`✅ Cliente criado: ${customer.name} (${customer.email})`);
  return customer;
}

async function createOrderWithShipping(
  userId: string,
  customerId: string,
  productId: string,
  shippingMethod: ShippingMethod
): Promise<OrderResult> {
  console.log('\n🛒 Criando pedido com frete...');

  const productPrice = 99.90;
  const quantity = 2;
  const subtotal = productPrice * quantity;
  const shippingCost = shippingMethod.basePrice;
  const total = subtotal + shippingCost;

  const orderData = {
    userId,
    customerId,
    status: 'pending',
    subtotal,
    shipping: shippingCost,
    discount: 0,
    total,
    paymentMethod: 'credit_card',
    shippingCarrier: shippingMethod.name,
    shippingAddress: {
      street: 'Rua Teste',
      number: '123',
      complement: 'Apto 456',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-567',
      country: 'Brasil',
    },
    items: [
      {
        productId,
        quantity,
        price: productPrice,
        total: subtotal,
      },
    ],
  };

  const { data: order, error } = await supabase
    .from('Order')
    .insert(orderData)
    .select()
    .single();

  if (error) {
    console.error('❌ Erro ao criar pedido:', error.message);
    throw error;
  }

  console.log('✅ Pedido criado com sucesso!');
  console.log(`   ID: ${order.id}`);
  console.log(`   Subtotal: R$ ${order.subtotal.toFixed(2)}`);
  console.log(`   Frete (${shippingMethod.name}): R$ ${order.shipping.toFixed(2)}`);
  console.log(`   Total: R$ ${order.total.toFixed(2)}`);
  console.log(`   Status: ${order.status}`);

  return {
    orderId: order.id,
    total: order.total,
    subtotal: order.subtotal,
    shipping: order.shipping,
    shippingMethod: order.shippingCarrier,
  };
}

async function verifyOrder(orderId: string) {
  console.log('\n🔍 Verificando pedido criado...');

  const { data: order, error } = await supabase
    .from('Order')
    .select('*')
    .eq('id', orderId)
    .single();

  if (error) {
    console.error('❌ Erro ao verificar pedido:', error.message);
    throw error;
  }

  console.log('✅ Pedido verificado:');
  console.log(`   ID: ${order.id}`);
  console.log(`   Cliente: ${order.customerId}`);
  console.log(`   Subtotal: R$ ${order.subtotal}`);
  console.log(`   Frete: R$ ${order.shipping}`);
  console.log(`   Total: R$ ${order.total}`);
  console.log(`   Método de envio: ${order.shippingCarrier}`);
  console.log(`   Status: ${order.status}`);
  console.log(`   Endereço:`, JSON.stringify(order.shippingAddress, null, 2));

  return order;
}

async function cleanup(productId: string, customerId: string, orderId: string) {
  console.log('\n🧹 Limpando dados de teste...');

  // Deletar pedido
  await supabase.from('Order').delete().eq('id', orderId);
  console.log('   ✓ Pedido removido');

  // Deletar cliente
  await supabase.from('Customer').delete().eq('id', customerId);
  console.log('   ✓ Cliente removido');

  // Deletar produto
  await supabase.from('Product').delete().eq('id', productId);
  console.log('   ✓ Produto removido');

  console.log('✅ Limpeza concluída');
}

async function runTest() {
  console.log('🚀 Iniciando teste de pedido com frete\n');
  console.log('='.repeat(60));

  try {
    // 1. Autenticar
    const user = await authenticateUser(
      'seu-email@example.com', // ALTERE AQUI
      'sua-senha' // ALTERE AQUI
    );

    // 2. Verificar/criar métodos de frete
    const shippingMethods = await getOrCreateShippingMethods(user.id);

    // 3. Criar produto de teste
    const product = await createTestProduct(user.id);

    // 4. Criar cliente de teste
    const customer = await createTestCustomer(user.id);

    // 5. Criar pedido com o segundo método de frete (PAC)
    const selectedShipping = shippingMethods[1] || shippingMethods[0];
    const orderResult = await createOrderWithShipping(
      user.id,
      customer.id,
      product.id,
      selectedShipping
    );

    // 6. Verificar pedido
    await verifyOrder(orderResult.orderId);

    // 7. Validações
    console.log('\n✨ Validando resultado...');
    const expectedTotal = orderResult.subtotal + orderResult.shipping;
    if (Math.abs(orderResult.total - expectedTotal) < 0.01) {
      console.log('✅ Cálculo de total correto');
    } else {
      console.error('❌ Erro no cálculo do total');
    }

    if (orderResult.shipping === selectedShipping.basePrice) {
      console.log('✅ Valor do frete correto');
    } else {
      console.error('❌ Valor do frete incorreto');
    }

    // 8. Limpeza (opcional - comente se quiser manter os dados)
    // await cleanup(product.id, customer.id, orderResult.orderId);

    console.log('\n' + '='.repeat(60));
    console.log('🎉 TESTE CONCLUÍDO COM SUCESSO!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('💥 ERRO NO TESTE:', error);
    console.error('='.repeat(60));
    process.exit(1);
  }
}

// Executar teste
runTest();
