# PARTE 1 - Melhorias no Painel de Clientes

## Mudanças a serem feitas manualmente:

### 1. Adicionar aos imports (linha ~20):
```typescript
import { HiCurrencyDollar, HiChatBubbleBottomCenterText } from "react-icons/hi2";
```

### 2. Atualizar interface UserData (linha ~33):
```typescript
interface UserData {
  id: string;
  name: string;
  email: string;
  plan: string;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  trialEndsAt: string | null;
  _count?: {
    campaigns: number;
    messages: number;
    orders: number;  // ← ADICIONAR
  };
  _stats?: {         // ← ADICIONAR TUDO
    totalSales: number;
    averageOrderValue: number;
  };
}
```

### 3. Adicionar função formatCurrency (antes do componente ClientsPage, linha ~90):
```typescript
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};
```

### 4. Atualizar função loadUsers (substituir a existente):
Ver arquivo: src/pages/super-admin/ClientsPageNEW_PART1.tsx

### 5. Atualizar calculateStats (linha ~182):
```typescript
const calculateStats = () => {
  const totalSales = users.reduce(
    (acc, u) => acc + (u._stats?.totalSales || 0),
    0,
  );

  return {
    total: users.length,
    active: users.filter((u) => u.isActive).length,
    verified: users.filter((u) => u.emailVerified).length,
    totalSales,  // ← SUBSTITUIR totalCampaigns por totalSales
  };
};
```

### 6. Atualizar StatCard de "Total Campanhas" (linha ~273):
```typescript
<StatCard
  title="Total em Vendas"
  value={formatCurrency(stats.totalSales)}
  description="Vendas de todos"
  icon={HiCurrencyDollar}
  gradient="from-orange-500 to-red-500"
  delay={0.4}
/>
```

### 7. Atualizar headers da tabela (linha ~331):
Mudar:
- "Campanhas" → "Total Vendas"
- "Conversas" → "Mensagens"

### 8. Atualizar células da tabela (linha ~376):
```typescript
{/* Coluna Total Vendas */}
<TableCell>
  <div className="flex flex-col">
    <span className="text-white font-bold">
      {formatCurrency(user._stats?.totalSales || 0)}
    </span>
    <span className="text-xs text-gray-500">
      {user._count?.orders || 0} pedidos
    </span>
  </div>
</TableCell>

{/* Coluna Mensagens */}
<TableCell>
  <div className="flex items-center gap-2">
    <HiChatBubbleBottomCenterText className="w-4 h-4 text-blue-400" />
    <span className="text-white font-medium">
      {user._count?.messages || 0}
    </span>
  </div>
</TableCell>
```

## Teste após aplicar:
1. npm run build
2. Verificar se compila
3. Testar página /super-admin/clients

Após confirmar que funciona, vamos para PARTE 2!
