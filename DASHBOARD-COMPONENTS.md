# 📊 Componentes Avançados da Dashboard - Estilo Binance

Documentação completa dos componentes criados para a dashboard analytics com animações e gráficos em tempo real.

---

## 🎯 Visão Geral

Foram criados **3 componentes avançados** para melhorar a experiência visual e funcional da dashboard:

1. **AnimatedNumber** - Números com animação de contador
2. **AnimatedPieChart** - Gráfico de pizza interativo e animado
3. **LiveSparkline** - Mini gráficos em tempo real com tendências

---

## 1️⃣ AnimatedNumber

### 📍 Localização
```
src/components/dashboard/AnimatedNumber.tsx
```

### 📝 Descrição
Componente que anima números com efeito de contador, ideal para métricas que mudam em tempo real. Utiliza `requestAnimationFrame` para animações suaves e performáticas.

### 🎨 Recursos
- ✅ Animação suave com easing (ease-out)
- ✅ Suporte para prefixos e sufixos (R$, %, etc)
- ✅ Controle de casas decimais
- ✅ Duração customizável
- ✅ Efeito pulse durante animação

### 📋 Props

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `value` | `number` | - | Valor a ser exibido |
| `duration` | `number` | `1000` | Duração da animação em ms |
| `decimals` | `number` | `0` | Número de casas decimais |
| `prefix` | `string` | `""` | Texto antes do número (ex: "R$ ") |
| `suffix` | `string` | `""` | Texto depois do número (ex: "%") |
| `className` | `string` | `""` | Classes CSS adicionais |
| `animate` | `boolean` | `true` | Ativar/desativar animação |

### 💻 Exemplo de Uso

```tsx
import { AnimatedNumber } from "@/components/dashboard/AnimatedNumber";

// Exemplo 1: Receita
<AnimatedNumber 
  value={15420.50} 
  prefix="R$ " 
  decimals={2}
  duration={1500}
/>
// Resultado: R$ 15420.50 (animado)

// Exemplo 2: Percentual
<AnimatedNumber 
  value={3.2} 
  suffix="%" 
  decimals={1}
/>
// Resultado: 3.2% (animado)

// Exemplo 3: Contador simples
<AnimatedNumber 
  value={152} 
  className="text-4xl font-bold"
/>
// Resultado: 152 (animado)
```

### 🎭 Funcionamento
1. Calcula a diferença entre valor atual e anterior
2. Divide em frames (usando requestAnimationFrame)
3. Aplica easing function (ease-out quadrático)
4. Atualiza o display frame por frame
5. Adiciona efeito pulse durante animação

---

## 2️⃣ AnimatedPieChart

### 📍 Localização
```
src/components/dashboard/AnimatedPieChart.tsx
```

### 📝 Descrição
Gráfico de pizza profissional e interativo com animações suaves, tooltips personalizados e legendas interativas. Perfeito para visualizar distribuição de dados (ex: métodos de pagamento, categorias de produtos).

### 🎨 Recursos
- ✅ Animação de entrada suave
- ✅ Hover effects com escala e sombra
- ✅ Tooltip customizado com formatação BR
- ✅ Legendas interativas
- ✅ Labels com percentuais
- ✅ Suporte para gráfico de rosca (donut)
- ✅ Cores customizáveis

### 📋 Props

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `data` | `DataPoint[]` | - | Array de dados para o gráfico |
| `colors` | `string[]` | `DEFAULT_COLORS` | Array de cores hexadecimais |
| `showLegend` | `boolean` | `true` | Exibir legenda |
| `showPercentage` | `boolean` | `true` | Exibir % nas fatias |
| `innerRadius` | `number` | `0` | Raio interno (0 = pizza, >0 = donut) |
| `outerRadius` | `number` | `100` | Raio externo |

### 📊 Interface DataPoint
```typescript
interface DataPoint {
  name: string;    // Nome da categoria
  value: number;   // Valor numérico
  color?: string;  // Cor customizada (opcional)
}
```

### 💻 Exemplo de Uso

```tsx
import { AnimatedPieChart } from "@/components/dashboard/AnimatedPieChart";

// Exemplo: Métodos de Pagamento
const paymentData = [
  { name: "PIX", value: 12500 },
  { name: "Cartão de Crédito", value: 8300 },
  { name: "Boleto", value: 4200 },
  { name: "Débito", value: 2100 },
];

<AnimatedPieChart 
  data={paymentData}
  showLegend={true}
  showPercentage={true}
/>

// Exemplo: Gráfico Donut
<AnimatedPieChart 
  data={paymentData}
  innerRadius={60}
  outerRadius={100}
  colors={["#ec4899", "#a855f7", "#3b82f6", "#10b981"]}
/>
```

### 🎯 Cores Padrão
```typescript
const DEFAULT_COLORS = [
  "#ec4899", // Pink
  "#a855f7", // Purple
  "#3b82f6", // Blue
  "#10b981", // Green
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#8b5cf6", // Violet
  "#06b6d4", // Cyan
];
```

### ✨ Interatividade
- **Hover na fatia**: Escala aumenta, adiciona sombra
- **Hover na legenda**: Destaca a fatia correspondente
- **Tooltip**: Mostra nome, valor em R$ e percentual
- **Animação**: 800ms de duração com ease-out

---

## 3️⃣ LiveSparkline

### 📍 Localização
```
src/components/dashboard/LiveSparkline.tsx
```

### 📝 Descrição
Mini gráfico de linha animado em tempo real, ideal para mostrar tendências rápidas. Estilo Binance/trading com indicador de tendência e efeito shimmer.

### 🎨 Recursos
- ✅ Animação de entrada progressiva
- ✅ Indicador de tendência (↑/↓)
- ✅ Cores baseadas em tendência (verde/vermelho)
- ✅ Efeito shimmer durante carregamento
- ✅ Gradiente no preenchimento
- ✅ Limite de pontos automático

### 📋 Props

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `data` | `number[]` | - | Array de valores numéricos |
| `color` | `string` | auto | Cor da linha (auto = verde/vermelho) |
| `height` | `number` | `60` | Altura em pixels |
| `showTrend` | `boolean` | `true` | Exibir badge de tendência |
| `animate` | `boolean` | `true` | Ativar animação |
| `maxPoints` | `number` | `20` | Máximo de pontos visíveis |

### 💻 Exemplo de Uso

```tsx
import { LiveSparkline } from "@/components/dashboard/LiveSparkline";

// Exemplo 1: Tendência de receita (últimos 10 pedidos)
const revenueData = [120, 145, 132, 167, 189, 201, 195, 210, 225, 240];

<LiveSparkline 
  data={revenueData}
  height={60}
  showTrend={true}
/>

// Exemplo 2: Cor customizada
<LiveSparkline 
  data={revenueData}
  color="#ec4899"
  height={50}
/>

// Exemplo 3: Sem animação (performance)
<LiveSparkline 
  data={revenueData}
  animate={false}
  maxPoints={15}
/>
```

### 🎯 Lógica de Cores
```typescript
// Se não especificar cor:
const trend = data[último] - data[primeiro];
const color = trend >= 0 ? "#10b981" (verde) : "#ef4444" (vermelho);
```

### ✨ Efeitos Especiais
- **Gradiente**: Linha sólida no topo, transparente embaixo
- **Shimmer**: Animação de brilho durante carregamento
- **Badge**: Mostra diferença entre primeiro e último valor
- **Smooth**: Animação de 800ms com ease-in-out

---

## 🚀 Como Integrar na Dashboard

### Passo 1: Importar os Componentes

```tsx
import { AnimatedNumber } from "@/components/dashboard/AnimatedNumber";
import { AnimatedPieChart } from "@/components/dashboard/AnimatedPieChart";
import { LiveSparkline } from "@/components/dashboard/LiveSparkline";
```

### Passo 2: Preparar os Dados

```tsx
// Estado para métricas
const [metrics, setMetrics] = useState({
  totalRevenue: 45230.50,
  revenueChange: 12.5,
  totalOrders: 152,
});

// Estado para gráfico de pizza
const [paymentMethods, setPaymentMethods] = useState([
  { name: "PIX", value: 25000 },
  { name: "Cartão", value: 15000 },
  { name: "Boleto", value: 5230 },
]);

// Estado para sparkline
const [revenueHistory, setRevenueHistory] = useState([
  120, 145, 132, 167, 189, 201, 195, 210, 225, 240
]);
```

### Passo 3: Usar nos Cards

```tsx
{/* Card de Receita com Número Animado e Sparkline */}
<Card>
  <CardContent className="p-6">
    <div className="flex justify-between items-start mb-2">
      <h3 className="text-sm text-gray-600">Receita Total</h3>
      <span className="text-green-600 text-xs font-bold">
        <AnimatedNumber value={metrics.revenueChange} suffix="%" decimals={1} />
      </span>
    </div>
    
    <p className="text-3xl font-bold mb-3">
      <AnimatedNumber 
        value={metrics.totalRevenue} 
        prefix="R$ " 
        decimals={2}
        duration={1500}
      />
    </p>
    
    <LiveSparkline 
      data={revenueHistory} 
      height={50}
      showTrend={false}
    />
  </CardContent>
</Card>

{/* Card com Gráfico de Pizza */}
<Card>
  <CardHeader>
    <CardTitle>Métodos de Pagamento</CardTitle>
  </CardHeader>
  <CardContent>
    <AnimatedPieChart 
      data={paymentMethods}
      innerRadius={60}
      outerRadius={100}
      showLegend={true}
    />
  </CardContent>
</Card>
```

---

## 📊 Exemplo Completo - Card de Métrica Avançado

```tsx
import { Card, CardContent } from "@/components/ui/card";
import { AnimatedNumber } from "@/components/dashboard/AnimatedNumber";
import { LiveSparkline } from "@/components/dashboard/LiveSparkline";
import { TrendingUp, TrendingDown } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: number;
  change: number;
  prefix?: string;
  suffix?: string;
  sparklineData: number[];
  icon: React.ReactNode;
}

const AdvancedMetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  prefix,
  suffix,
  sparklineData,
  icon,
}) => {
  const isPositive = change >= 0;
  
  return (
    <Card className="hover:shadow-2xl transition-all border-2 hover:border-pink-200 overflow-hidden group">
      <CardContent className="p-6">
        {/* Header com ícone e badge de mudança */}
        <div className="flex items-center justify-between mb-4">
          <div className="h-14 w-14 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            {icon}
          </div>
          
          <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${
            isPositive 
              ? "bg-green-100 text-green-700" 
              : "bg-red-100 text-red-700"
          }`}>
            {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            <AnimatedNumber 
              value={Math.abs(change)} 
              suffix="%" 
              decimals={1}
            />
          </div>
        </div>
        
        {/* Título */}
        <p className="text-gray-600 text-sm font-medium mb-2">
          {title}
        </p>
        
        {/* Valor principal animado */}
        <p className="text-3xl font-bold text-gray-900 mb-3">
          <AnimatedNumber 
            value={value}
            prefix={prefix}
            suffix={suffix}
            decimals={prefix === "R$ " ? 2 : 0}
            duration={1500}
          />
        </p>
        
        {/* Sparkline */}
        <LiveSparkline 
          data={sparklineData}
          height={50}
          showTrend={false}
        />
      </CardContent>
    </Card>
  );
};

export default AdvancedMetricCard;
```

---

## 🎨 Paleta de Cores Recomendada

```typescript
// Cores principais (estilo Binance/Trading)
const COLORS = {
  // Principais
  primary: "#ec4899",      // Pink
  secondary: "#a855f7",    // Purple
  
  // Tendências
  success: "#10b981",      // Verde (positivo)
  danger: "#ef4444",       // Vermelho (negativo)
  warning: "#f59e0b",      // Amarelo
  
  // Complementares
  info: "#3b82f6",         // Azul
  purple: "#8b5cf6",       // Roxo
  cyan: "#06b6d4",         // Ciano
  
  // Neutros
  gray50: "#f9fafb",
  gray100: "#f3f4f6",
  gray900: "#111827",
};
```

---

## ⚡ Performance

### Otimizações Implementadas

1. **AnimatedNumber**
   - ✅ Usa `requestAnimationFrame` (60fps)
   - ✅ Cancela animações anteriores
   - ✅ Cleanup em `useEffect`

2. **AnimatedPieChart**
   - ✅ Animação única de 800ms
   - ✅ Memoização de cálculos
   - ✅ Renderização condicional

3. **LiveSparkline**
   - ✅ Limite de pontos (maxPoints)
   - ✅ Animação progressiva
   - ✅ Gradientes via SVG (performático)

### Boas Práticas

```typescript
// ✅ BOM: Limite de dados
<LiveSparkline data={data.slice(-20)} maxPoints={20} />

// ❌ RUIM: Muitos pontos
<LiveSparkline data={dataWith1000Points} />

// ✅ BOM: Desativar animação para muitos cards
{metrics.map((metric) => (
  <AnimatedNumber value={metric.value} animate={metrics.length < 10} />
))}
```

---

## 🔄 Atualização em Tempo Real

### Exemplo de useEffect para Dados Live

```tsx
useEffect(() => {
  // Carregar dados iniciais
  loadMetrics();
  
  // Atualizar a cada 10 segundos
  const interval = setInterval(() => {
    loadMetrics();
  }, 10000);
  
  return () => clearInterval(interval);
}, []);

const loadMetrics = async () => {
  const { data } = await supabase
    .from("Order")
    .select("total, createdAt")
    .eq("userId", user.id)
    .order("createdAt", { ascending: false })
    .limit(20);
    
  if (data) {
    const values = data.map(o => o.total);
    setRevenueHistory(values);
  }
};
```

---

## 📦 Dependências

Todos os componentes requerem:

```json
{
  "recharts": "^2.x",
  "lucide-react": "^0.x",
  "react": "^18.x"
}
```

Já instaladas no projeto! ✅

---

## 🎯 Próximos Passos

### Melhorias Futuras Sugeridas

1. **Real-time com WebSocket**
   ```tsx
   // Conectar ao Supabase Realtime
   supabase
     .channel('orders')
     .on('INSERT', payload => {
       // Atualizar métricas instantaneamente
     })
     .subscribe();
   ```

2. **Mais Gráficos**
   - Bar chart animado
   - Gauge/radial progress
   - Heat map
   - Candle stick (trading)

3. **Exportação**
   - PDF dos gráficos
   - CSV dos dados
   - Imagem PNG

4. **Comparações**
   - Período anterior
   - Meta vs Real
   - Previsões com IA

---

## 📝 Changelog

### v1.0.0 (2024-11-03)
- ✅ Criado `AnimatedNumber`
- ✅ Criado `AnimatedPieChart`
- ✅ Criado `LiveSparkline`
- ✅ Documentação completa
- ✅ Exemplos de integração

---

## 💡 Dicas Pro

1. **Combine componentes** para criar cards mais ricos
2. **Use cores consistentes** com a paleta do sistema
3. **Limite animações** quando houver muitos cards (>10)
4. **Teste em mobile** - ajuste `height` e `outerRadius`
5. **Cache dados** para evitar re-renders desnecessários

---

## 🐛 Troubleshooting

### Animação não funciona
```tsx
// Verifique se o valor está mudando
useEffect(() => {
  console.log('Valor atual:', value);
}, [value]);
```

### Gráfico não aparece
```tsx
// Verifique se data não está vazio
{data.length > 0 ? <AnimatedPieChart data={data} /> : <p>Sem dados</p>}
```

### Performance lenta
```tsx
// Desative animações ou reduza pontos
<LiveSparkline data={data} maxPoints={10} animate={false} />
```

---

## ✅ Checklist de Implementação

- [x] Componentes criados
- [x] Build sem erros
- [x] TypeScript types corretos
- [x] Documentação completa
- [ ] Integrar na dashboard principal
- [ ] Adicionar dados reais do banco
- [ ] Testar performance com muitos dados
- [ ] Ajustar cores/temas
- [ ] Deploy e teste em produção

---

**🎉 Dashboard Analytics com componentes de nível profissional estilo Binance!**

*Desenvolvido com ❤️ por SyncAds Team*