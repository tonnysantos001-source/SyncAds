# 🎯 PLANO DE AÇÃO IMEDIATO - SISTEMA 100% OPERACIONAL

**Data:** 21/10/2025 18:45  
**Objetivo:** Sistema totalmente funcional em 2 horas

---

## 🔴 FASE 1: DADOS CRÍTICOS (30 min)

### **Passo 1: Criar IA Global (5 min)**

Execute via MCP ou SQL Editor do Supabase:

```sql
-- 1. Criar IA OpenAI
INSERT INTO "GlobalAiConnection" (
  id,
  provider,
  model,
  "apiKey",
  "isActive",
  "maxTokens",
  temperature,
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  'OPENAI',
  'gpt-4o-mini',
  'SUA_API_KEY_AQUI', -- ⚠️ SUBSTITUIR
  true,
  4000,
  0.7,
  NOW(),
  NOW()
) RETURNING id;

-- 2. Associar à Organização Principal
-- ⚠️ SUBSTITUIR os IDs com os valores reais da query acima
INSERT INTO "OrganizationAiConnection" (
  id,
  "organizationId",
  "globalAiConnectionId",
  "isDefault",
  "customSystemPrompt",
  "createdAt"
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM "Organization" LIMIT 1), -- Primeira org
  '(ID_DA_IA_CRIADA_ACIMA)', -- ⚠️ SUBSTITUIR
  true,
  'Você é um assistente de marketing especializado em e-commerce e campanhas digitais.',
  NOW()
);
```

**Como obter API Key OpenAI:**
1. Acesse: https://platform.openai.com/api-keys
2. Create new secret key
3. Copie e guarde (mostra só 1 vez)

---

### **Passo 2: Seed Produtos (10 min)**

```sql
-- 1. Criar Categorias
INSERT INTO "Category" (id, "organizationId", name, slug, description, "isActive", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  (SELECT id FROM "Organization" LIMIT 1),
  name,
  slug,
  description,
  true,
  NOW(),
  NOW()
FROM (VALUES
  ('Eletrônicos', 'eletronicos', 'Produtos eletrônicos e gadgets'),
  ('Moda', 'moda', 'Roupas e acessórios'),
  ('Casa & Decoração', 'casa-decoracao', 'Itens para casa'),
  ('Esportes', 'esportes', 'Artigos esportivos'),
  ('Livros', 'livros', 'Livros e e-books')
) AS categories(name, slug, description);

-- 2. Criar Produtos
INSERT INTO "Product" (
  id, "organizationId", "categoryId", name, slug, description, 
  price, "comparePrice", stock, sku, status, "isFeatured", "createdAt", "updatedAt"
)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM "Organization" LIMIT 1),
  (SELECT id FROM "Category" WHERE slug = cat_slug LIMIT 1),
  name,
  slug,
  description,
  price,
  compare_price,
  stock,
  sku,
  'ACTIVE',
  is_featured,
  NOW(),
  NOW()
FROM (VALUES
  ('eletronicos', 'Fone Bluetooth Premium', 'fone-bluetooth-premium', 'Fone de ouvido Bluetooth com cancelamento de ruído', 299.90, 399.90, 50, 'FONE-001', true),
  ('eletronicos', 'Mouse Gamer RGB', 'mouse-gamer-rgb', 'Mouse gamer com RGB customizável e 12000 DPI', 149.90, 199.90, 80, 'MOUSE-001', true),
  ('moda', 'Camiseta Premium', 'camiseta-premium', 'Camiseta 100% algodão premium', 89.90, 129.90, 200, 'CAM-001', false),
  ('moda', 'Tênis Esportivo', 'tenis-esportivo', 'Tênis para corrida e treino', 349.90, 499.90, 30, 'TEN-001', true),
  ('casa-decoracao', 'Luminária LED', 'luminaria-led', 'Luminária LED com controle remoto', 179.90, 249.90, 45, 'LUM-001', false),
  ('casa-decoracao', 'Quadro Decorativo', 'quadro-decorativo', 'Quadro decorativo moderno', 129.90, 179.90, 60, 'QUA-001', false),
  ('esportes', 'Squeeze 1L', 'squeeze-1l', 'Squeeze esportivo 1 litro', 39.90, 59.90, 150, 'SQU-001', false),
  ('livros', 'Livro Marketing Digital', 'livro-marketing-digital', 'Guia completo de marketing digital', 79.90, 99.90, 100, 'LIV-001', true),
  ('eletronicos', 'Carregador Rápido', 'carregador-rapido', 'Carregador USB-C 65W', 99.90, 149.90, 70, 'CAR-001', false),
  ('moda', 'Mochila Executiva', 'mochila-executiva', 'Mochila para notebook até 15.6"', 199.90, 299.90, 40, 'MOC-001', true)
) AS products(cat_slug, name, slug, description, price, compare_price, stock, sku, is_featured);
```

---

### **Passo 3: Seed Clientes (5 min)**

```sql
-- Criar Clientes de Exemplo
INSERT INTO "Customer" (
  id, "organizationId", name, email, phone, cpf, 
  "totalOrders", "totalSpent", "averageOrderValue", 
  "lastOrderAt", "createdAt", "updatedAt"
)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM "Organization" LIMIT 1),
  name,
  email,
  phone,
  cpf,
  total_orders,
  total_spent,
  avg_order,
  last_order,
  NOW(),
  NOW()
FROM (VALUES
  ('João Silva', 'joao.silva@email.com', '11987654321', '12345678901', 5, 1249.50, 249.90, NOW() - INTERVAL '5 days'),
  ('Maria Santos', 'maria.santos@email.com', '11976543210', '98765432109', 3, 899.70, 299.90, NOW() - INTERVAL '10 days'),
  ('Pedro Oliveira', 'pedro.oliveira@email.com', '11965432109', '45678912301', 8, 2199.20, 274.90, NOW() - INTERVAL '2 days'),
  ('Ana Costa', 'ana.costa@email.com', '11954321098', '78912345602', 2, 449.80, 224.90, NOW() - INTERVAL '15 days'),
  ('Carlos Ferreira', 'carlos.ferreira@email.com', '11943210987', '32165498703', 12, 3598.80, 299.90, NOW() - INTERVAL '1 day')
) AS customers(name, email, phone, cpf, total_orders, total_spent, avg_order, last_order);

-- Criar Leads de Exemplo
INSERT INTO "Lead" (
  id, "organizationId", name, email, phone, 
  source, status, notes, "createdAt", "updatedAt"
)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM "Organization" LIMIT 1),
  name,
  email,
  phone,
  source,
  status,
  notes,
  NOW(),
  NOW()
FROM (VALUES
  ('Roberto Alves', 'roberto.alves@email.com', '11932109876', 'Facebook Ads', 'NEW', 'Interessado em produtos eletrônicos'),
  ('Juliana Lima', 'juliana.lima@email.com', '11921098765', 'Google Ads', 'CONTACTED', 'Enviado catálogo por email'),
  ('Fernando Souza', 'fernando.souza@email.com', '11910987654', 'Instagram', 'QUALIFIED', 'Demonstrou interesse em compra'),
  ('Patricia Rocha', 'patricia.rocha@email.com', '11909876543', 'Indicação', 'NEW', 'Lead vindo de cliente satisfeito')
) AS leads(name, email, phone, source, status, notes);
```

---

### **Passo 4: Seed Cupons e Marketing (5 min)**

```sql
-- Criar Cupons de Exemplo
INSERT INTO "Coupon" (
  id, "organizationId", code, name, description, type, value,
  "minPurchaseAmount", "maxDiscountAmount", "usageLimit", "usageCount",
  "startsAt", "expiresAt", "isActive", "createdAt", "updatedAt"
)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM "Organization" LIMIT 1),
  code,
  name,
  description,
  type,
  value,
  min_purchase,
  max_discount,
  usage_limit,
  0,
  NOW(),
  NOW() + INTERVAL '30 days',
  true,
  NOW(),
  NOW()
FROM (VALUES
  ('BEMVINDO10', 'Bem-vindo 10%', 'Desconto de 10% para novos clientes', 'PERCENTAGE', 10, 0, NULL, 100),
  ('FRETEGRATIS', 'Frete Grátis', 'Frete grátis acima de R$200', 'FREE_SHIPPING', 0, 200, NULL, NULL),
  ('50OFF', 'R$50 de desconto', 'R$50 de desconto em compras acima de R$300', 'FIXED_AMOUNT', 50, 300, 50, 50),
  ('BLACKFRIDAY', 'Black Friday 25%', 'Desconto especial Black Friday', 'PERCENTAGE', 25, 150, 200, 200)
) AS coupons(code, name, description, type, value, min_purchase, max_discount, usage_limit);

-- Criar Order Bumps de Exemplo
INSERT INTO "OrderBump" (
  id, "organizationId", "productId", name, description,
  "discountType", "discountValue", position, "isActive", "createdAt", "updatedAt"
)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM "Organization" LIMIT 1),
  (SELECT id FROM "Product" WHERE slug = 'carregador-rapido' LIMIT 1),
  'Adicione Carregador Rápido',
  'Carregador USB-C 65W com 20% de desconto',
  'PERCENTAGE',
  20,
  'CHECKOUT',
  true,
  NOW(),
  NOW();

-- Criar Pixels de Tracking
INSERT INTO "Pixel" (
  id, "organizationId", type, "pixelId", name, "isActive", "createdAt", "updatedAt"
)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM "Organization" LIMIT 1),
  type,
  pixel_id,
  name,
  true,
  NOW(),
  NOW()
FROM (VALUES
  ('FACEBOOK', '1234567890', 'Facebook Pixel'),
  ('GOOGLE_ANALYTICS', 'G-XXXXXXXXXX', 'Google Analytics 4'),
  ('GOOGLE_ADS', 'AW-123456789', 'Google Ads')
) AS pixels(type, pixel_id, name);
```

---

### **Passo 5: Criar Pedidos de Exemplo (5 min)**

```sql
-- Criar Pedidos
INSERT INTO "Order" (
  id, "organizationId", "orderNumber", "customerId", "customerEmail", "customerName",
  "shippingAddress", items, subtotal, shipping, total, status,
  "paymentMethod", "paymentStatus", "createdAt", "updatedAt"
)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM "Organization" LIMIT 1),
  order_num,
  (SELECT id FROM "Customer" WHERE email = cust_email LIMIT 1),
  cust_email,
  cust_name,
  shipping_addr::jsonb,
  items::jsonb,
  subtotal,
  shipping,
  total,
  status,
  payment_method,
  payment_status,
  created,
  created
FROM (VALUES
  ('ORD-2025-0001', 'joao.silva@email.com', 'João Silva', 
   '{"street":"Rua A, 123","city":"São Paulo","state":"SP","zipCode":"01234-567"}',
   '[{"productId":"x","name":"Fone Bluetooth Premium","quantity":1,"price":299.90}]',
   299.90, 15.00, 314.90, 'DELIVERED', 'CREDIT_CARD', 'PAID', NOW() - INTERVAL '5 days'),
  
  ('ORD-2025-0002', 'maria.santos@email.com', 'Maria Santos',
   '{"street":"Av B, 456","city":"Rio de Janeiro","state":"RJ","zipCode":"20000-000"}',
   '[{"productId":"y","name":"Mouse Gamer RGB","quantity":2,"price":149.90}]',
   299.80, 20.00, 319.80, 'SHIPPED', 'PIX', 'PAID', NOW() - INTERVAL '2 days'),
  
  ('ORD-2025-0003', 'pedro.oliveira@email.com', 'Pedro Oliveira',
   '{"street":"Rua C, 789","city":"Belo Horizonte","state":"MG","zipCode":"30000-000"}',
   '[{"productId":"z","name":"Tênis Esportivo","quantity":1,"price":349.90}]',
   349.90, 25.00, 374.90, 'PROCESSING', 'BOLETO', 'PENDING', NOW() - INTERVAL '1 day')
) AS orders(order_num, cust_email, cust_name, shipping_addr, items, subtotal, shipping, total, status, payment_method, payment_status, created);
```

---

## 🟡 FASE 2: SEGURANÇA (5 min)

### **Ativar Leaked Password Protection**

1. Acesse: https://supabase.com/dashboard/project/ovskepqggmxlfckxqgbr/auth/policies
2. Clique em "Security" (menu lateral)
3. Procure por "Password strength and leaked password protection"
4. Ative "Check for leaked passwords"
5. Salvar

---

## 🟢 FASE 3: TESTES RÁPIDOS (1h)

### **Checklist de Testes:**

#### **1. Autenticação (10 min)**
```bash
# Terminal 1 - Iniciar dev server
npm run dev

# Abrir no navegador: http://localhost:5173
```

- [ ] Fazer login com usuário existente
- [ ] Verificar redirect (super admin → /super-admin, user → /dashboard)
- [ ] Logout funciona
- [ ] Testar "Esqueci minha senha"

#### **2. Dashboard & Navegação (5 min)**
- [ ] Dashboard carrega com dados reais
- [ ] Sidebar navega entre páginas
- [ ] Stats cards mostram números corretos
- [ ] Sem erros no console

#### **3. CRUD Produtos (15 min)**
- [ ] Listar produtos (deve mostrar 10)
- [ ] Criar novo produto
- [ ] Editar produto existente
- [ ] Deletar produto
- [ ] Busca funciona

#### **4. CRUD Clientes (10 min)**
- [ ] Listar clientes (deve mostrar 5)
- [ ] Ver detalhes de cliente
- [ ] Criar novo lead
- [ ] Converter lead em cliente

#### **5. Pedidos (10 min)**
- [ ] Listar pedidos (deve mostrar 3)
- [ ] Ver detalhes do pedido
- [ ] Atualizar status do pedido
- [ ] Filtrar por status

#### **6. Marketing (10 min)**
- [ ] Listar cupons (deve mostrar 4)
- [ ] Criar novo cupom
- [ ] Testar validação de código
- [ ] Desativar cupom

#### **7. Chat com IA (15 min)**
- [ ] Abrir página de chat
- [ ] Enviar mensagem
- [ ] IA responde (via Edge Function)
- [ ] Criar nova conversa
- [ ] Histórico salva corretamente

**⚠️ SE IA NÃO RESPONDER:**
- Verificar se GlobalAiConnection foi criado
- Verificar se OrganizationAiConnection está associado
- Verificar API Key da OpenAI válida
- Ver logs da Edge Function no Supabase

#### **8. Integrações OAuth (5 min)**
- [ ] Ver página de integrações
- [ ] Testar "Conectar Meta Ads" (se tiver Client ID real)
- [ ] Ver lista de integrações conectadas

---

## ✅ FASE 4: VERIFICAÇÃO FINAL (10 min)

### **Checklist Pré-Deploy:**

#### **Dados:**
- [ ] GlobalAiConnection: 1+ IA criada
- [ ] Product: 10 produtos
- [ ] Customer: 5 clientes
- [ ] Lead: 4 leads
- [ ] Order: 3 pedidos
- [ ] Coupon: 4 cupons
- [ ] Gateway: 55 gateways

#### **Funcionalidades:**
- [ ] Login funciona
- [ ] Chat com IA responde
- [ ] CRUD produtos completo
- [ ] CRUD clientes completo
- [ ] Pedidos listam corretamente
- [ ] Marketing funcional

#### **Segurança:**
- [ ] Leaked password protection ativado
- [ ] RLS ativo em todas tabelas
- [ ] Edge Functions deployadas
- [ ] API keys protegidas

#### **Build:**
```bash
# Testar build de produção
npm run build

# Verificar erros de TypeScript
npm run tsc:dualite

# Preview do build
npm run preview
```

---

## 🚀 DEPLOY FINAL

### **Opção 1: Netlify**
```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

### **Opção 2: Vercel**
```bash
# Instalar Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### **Variáveis de Ambiente (ambos):**
```
VITE_SUPABASE_URL=https://ovskepqggmxlfckxqgbr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_META_CLIENT_ID=1907637243430460
VITE_FACEBOOK_CLIENT_ID=1907637243430460
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

---

## 📊 RESULTADO ESPERADO

Após executar este plano:

```
✅ Sistema 100% funcional
✅ Dados de exemplo carregados
✅ Testes básicos passando
✅ Segurança configurada
✅ Pronto para demo/MVP
```

---

## 🆘 TROUBLESHOOTING

### **Problema: IA não responde**
```sql
-- Verificar se IA existe
SELECT * FROM "GlobalAiConnection";

-- Verificar associação
SELECT * FROM "OrganizationAiConnection";

-- Se não existir, voltar ao Passo 1
```

### **Problema: Produtos não aparecem**
```sql
-- Verificar produtos
SELECT COUNT(*) FROM "Product";

-- Se zero, voltar ao Passo 2
```

### **Problema: Erro de permissão (RLS)**
```sql
-- Verificar RLS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Todos devem ter rowsecurity = true
```

### **Problema: Build falha**
```bash
# Limpar cache
rm -rf node_modules dist .vite
npm install
npm run build
```

---

**Tempo Total Estimado:** 2 horas  
**Prioridade:** 🔴 EXECUTAR IMEDIATAMENTE  
**Resultado:** Sistema 100% operacional e pronto para produção

---

**Última Atualização:** 21/10/2025 18:45
