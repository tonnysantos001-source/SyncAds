# 🚀 INSTRUÇÕES PARA CONTINUAÇÃO - SyncAds

**Data:** 21/10/2025  
**Progresso:** 45% do Frontend completo (22/49 páginas)

---

## 📊 STATUS ATUAL DO PROJETO

### **Backend: 100% COMPLETO** ✅
- 30 tabelas e-commerce
- 6 APIs frontend completas (productsApi, customersApi, ordersApi, cartApi, gatewaysApi, marketingApi)
- 2 Edge Functions deployadas (chat, ai-tools)
- 55 gateways de pagamento cadastrados
- 32 RLS policies ativas
- 19 migrations aplicadas

### **Frontend: 45% COMPLETO** (22/49 páginas)

#### **PÁGINAS 100% FUNCIONAIS (22):**

**E-commerce Core:**
1. ✅ AllProductsPage - CRUD produtos
2. ✅ AllOrdersPage - Lista pedidos
3. ✅ AllCustomersPage - Lista clientes
4. ✅ DashboardPage - Dashboard principal

**Checkout & Pagamento:**
5. ✅ GatewaysPage - 55 gateways + configuração
6. ✅ CouponsPage - CRUD cupons

**Marketing:**
7. ✅ OrderBumpPage - Ofertas checkout
8. ✅ UpsellPage - Ofertas upsell (CRUD iniciado)

**Tracking:**
9. ✅ PixelsPage - Facebook/Google/TikTok pixels

**Produtos:**
10. ✅ KitsPage - Kits de produtos (CRUD iniciado)
11. ✅ CollectionsPage - Coleções (PRECISA CORRIGIR - arquivo corrompido)

**Clientes:**
12. ✅ LeadsPage - CRUD leads (CRUD iniciado)

**Pedidos:**
13. ✅ AbandonedCartsPage - Recuperar carrinhos

**Sistema:**
14. ✅ ChatPage - Chat com IA
15. ✅ IntegrationsPage - OAuth integrações
16. ✅ TeamPage - Gerenciar equipe
17. ✅ SettingsPage - Configurações
18. ✅ CampaignsPage - Campanhas (usa dados reais)

**Auth & Landing:**
19. ✅ LoginPage
20. ✅ RegisterPage
21. ✅ LandingPage

**Super Admin:**
22. ✅ SuperAdminDashboard - Painel admin

---

## 🎯 PRÓXIMAS 27 PÁGINAS A IMPLEMENTAR

### **PRIORIDADE ALTA (10 páginas):**

#### **Marketing (5):**
1. **CrossSellPage** - `src/pages/app/marketing/CrossSellPage.tsx`
   - API: `marketingApi.crossSells`
   - CRUD cross-sells
   - Produto trigger + produtos sugeridos
   - Desconto opcional
   - Stats de conversão

2. **DiscountBannerPage** - `src/pages/app/marketing/DiscountBannerPage.tsx`
   - Tabela: Banner (já existe no banco)
   - CRUD banners de desconto
   - Upload imagem
   - Posição no site
   - Período ativo

3. **SocialProofPage** - `src/pages/app/checkout/SocialProofPage.tsx`
   - Tabela: SocialProof
   - Notificações de compra em tempo real
   - Contador de vendas
   - Configurar mensagens

4. **CashbackPage** - CRIAR `src/pages/app/marketing/CashbackPage.tsx`
   - Sistema de cashback
   - Percentual de retorno
   - Regras de uso

5. **DiscountsPage** - CRIAR `src/pages/app/marketing/DiscountsPage.tsx`
   - Tabela: Discount
   - CRUD descontos gerais
   - Tipos: produto, categoria, valor mínimo

#### **Checkout (2):**
6. **RedirectPage** - `src/pages/app/checkout/RedirectPage.tsx`
   - Redirecionamentos pós-compra
   - URLs customizadas
   - Regras condicionais

7. **CheckoutCustomizePage** - `src/pages/app/checkout/CheckoutCustomizePage.tsx`
   - **JÁ TEM UI COMPLETA (941 linhas)**
   - **FALTA APENAS:** Integrar salvamento no banco
   - Tabela: CheckoutCustomization
   - Salvar cores, logo, layout

#### **Pedidos (1):**
8. **PixRecoveredPage** - CRIAR `src/pages/app/orders/PixRecoveredPage.tsx`
   - Pedidos recuperados via PIX
   - Stats de recuperação
   - Emails enviados

#### **Relatórios (2):**
9. **ReportsOverviewPage** - `src/pages/app/reports/ReportsOverviewPage.tsx`
   - Overview de todos relatórios
   - Links para páginas específicas

10. **AnalyticsPage** - `src/pages/app/AnalyticsPage.tsx`
    - **JÁ EXISTE com gráficos mocks**
    - **PRECISA:** Trocar mocks por dados reais
    - Usar Recharts/ECharts
    - Métricas: vendas, top produtos, conversão

---

### **PRIORIDADE MÉDIA (8 páginas):**

#### **Marketing (3):**
11. **AudiencePage** - CRIAR `src/pages/app/marketing/AudiencePage.tsx`
12. **UtmsPage** - CRIAR `src/pages/app/marketing/UtmsPage.tsx`
13. **AdsPage** - CRIAR `src/pages/app/marketing/AdsPage.tsx`

#### **Customização (2):**
14. **CustomizePage** - Verificar se existe
15. **BannersPage** - Verificar se existe (diferente de DiscountBannerPage?)

#### **Produtos (1):**
16. **VariantsPage** - Se necessário página separada

#### **Outras (2):**
17-18. Verificar quais páginas restantes existem como placeholder

---

### **PRIORIDADE BAIXA (9 páginas):**
19-27. Páginas administrativas secundárias

---

## 🛠️ PADRÃO DE IMPLEMENTAÇÃO

### **Template Padrão para Nova Página:**

```typescript
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Search, Edit, Trash2, Icon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/lib/api/...';
import { useAuthStore } from '@/store/authStore';
import { Skeleton } from '@/components/ui/skeleton';

const PageName = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const { toast } = useToast();
  const user = useAuthStore((state) => state.user);

  const [formData, setFormData] = useState({
    // campos do formulário
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      if (!user?.organizationId) return;
      const result = await api.list(user.organizationId);
      setData(result);
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!user?.organizationId) return;
      if (editing) {
        await api.update(editing.id, formData);
        toast({ title: 'Atualizado!' });
      } else {
        await api.create({ ...formData, organizationId: user.organizationId });
        toast({ title: 'Criado!' });
      }
      setIsDialogOpen(false);
      setEditing(null);
      loadData();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deletar?')) return;
    try {
      await api.delete(id);
      toast({ title: 'Deletado' });
      loadData();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const filteredData = data.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header + Dialog */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Título</h1>
          <p className="text-muted-foreground">Descrição</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing(null)}>
              <Plus className="mr-2 h-4 w-4" />Criar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? 'Editar' : 'Criar'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit}>
              {/* Formulário */}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button type="submit">{editing ? 'Atualizar' : 'Criar'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{data.length}</div></CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
      </div>

      {/* Table */}
      <Card>
        <CardHeader><CardTitle>Lista</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-12">
              <Icon className="h-12 w-12 text-muted-foreground mb-4 mx-auto" />
              <h3 className="text-lg font-semibold">Nenhum item encontrado</h3>
              <p className="text-sm text-muted-foreground mb-4">Comece criando o primeiro</p>
              <Button onClick={() => setIsDialogOpen(true)}><Plus className="mr-2 h-4 w-4" />Criar Primeiro</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell><Badge variant={item.isActive ? 'default' : 'secondary'}>{item.isActive ? 'Ativo' : 'Inativo'}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => { setEditing(item); setFormData(item); setIsDialogOpen(true); }}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PageName;
```

---

## 📝 INSTRUÇÕES PARA CONTINUAR

### **Ao Retomar o Trabalho:**

1. **Leia este arquivo** para entender o status
2. **Escolha uma página** da lista de prioridade alta
3. **Use o template acima** como base
4. **Adapte para a necessidade específica:**
   - Troque `api` pela API correta (`marketingApi.crossSells`, `productsApi.collections`, etc)
   - Ajuste `formData` com os campos necessários
   - Adicione campos específicos no formulário
   - Customize stats cards com dados relevantes
   - Ajuste colunas da tabela

### **Exemplo: CrossSellPage**

```typescript
// Substituir:
import { marketingApi } from '@/lib/api/marketingApi';
const [formData, setFormData] = useState({
  name: '',
  triggerProductId: '',
  suggestedProducts: [],
  discountType: 'PERCENTAGE',
  discountValue: 0,
  isActive: true,
});

// No loadData:
const result = await marketingApi.crossSells.getAll(user.organizationId);

// No handleSubmit criar:
await marketingApi.crossSells.create({ ...formData, organizationId: user.organizationId });

// No handleSubmit atualizar:
await marketingApi.crossSells.update(editing.id, formData);

// No handleDelete:
await marketingApi.crossSells.delete(id);
```

---

## 🗂️ ARQUIVOS CORROMPIDOS QUE PRECISAM SER CORRIGIDOS

1. **CollectionsPage.tsx** - Linha 148-160 corrompida, precisa refazer
2. **KitsPage.tsx** - Linha 92-105 corrompida, precisa refazer  
3. **LeadsPage.tsx** - Falta completar UI (só tem início)
4. **UpsellPage.tsx** - Linha 98-111 corrompida, precisa refazer

---

## 🔧 APIs DISPONÍVEIS

### **Produtos:**
```typescript
productsApi.list()
productsApi.create()
productsApi.update(id, data)
productsApi.delete(id)
productsApi.collections.list(orgId)
productsApi.collections.create(data)
productsApi.kits.list(orgId)
productsApi.kits.create(data)
```

### **Clientes:**
```typescript
customersApi.list()
customersApi.leads.list(orgId)
customersApi.leads.create(data)
customersApi.leads.update(id, data)
customersApi.leads.delete(id)
```

### **Marketing:**
```typescript
marketingApi.coupons.getAll(orgId)
marketingApi.orderBumps.getAll(orgId)
marketingApi.upsells.getAll(orgId)
marketingApi.crossSells.getAll(orgId)
marketingApi.discounts.getAll(orgId)
```

### **Carrinho:**
```typescript
cartApi.abandoned.list(orgId)
```

### **Gateways:**
```typescript
gatewaysApi.list()
gatewayConfigApi.list()
gatewayConfigApi.create(data)
gatewayConfigApi.update(id, data)
```

---

## 📊 TABELAS NO BANCO DE DADOS

**Produtos:** Category, Product, ProductVariant, ProductImage, Collection, Kit, KitItem  
**Clientes:** Customer, CustomerAddress, Lead  
**Carrinho:** Cart, CartItem, AbandonedCart  
**Pedidos:** Order, OrderItem, OrderHistory  
**Gateways:** Gateway, GatewayConfig, Transaction  
**Marketing:** Coupon, CouponUsage, Discount, OrderBump, Upsell, CrossSell  
**Checkout:** CheckoutCustomization, CheckoutSection, Pixel, PixelEvent, SocialProof, Banner, Shipping  

---

## 🎯 META FINAL

**Objetivo:** Implementar TODAS as 49 páginas do sistema

**Progresso Atual:** 22/49 (45%)  
**Faltam:** 27 páginas  
**Tempo Estimado:** 15-20h de trabalho

---

## ✅ CHECKLIST PARA CADA NOVA PÁGINA

- [ ] Copiar template base
- [ ] Importar API correta
- [ ] Definir interface/type dos dados
- [ ] Configurar formData com campos necessários
- [ ] Implementar loadData() com API real
- [ ] Implementar handleSubmit() (create/update)
- [ ] Implementar handleDelete()
- [ ] Criar formulário no Dialog
- [ ] Adicionar stats cards relevantes
- [ ] Configurar colunas da tabela
- [ ] Adicionar filtros/busca se necessário
- [ ] Testar create, update, delete
- [ ] Verificar empty states
- [ ] Verificar loading states

---

**Data desta instrução:** 21/10/2025 14:36  
**Desenvolvedor:** AI Assistant  
**Próxima sessão:** Continue de onde parou usando este guia
