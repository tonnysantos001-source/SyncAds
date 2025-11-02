# 📋 Documentação - APIs de CEP e CPF

## ✅ O que foi implementado

### 1️⃣ **Validação e Formatação de CPF**

#### **Funcionalidades:**
- ✅ Formatação automática (000.000.000-00)
- ✅ Validação com algoritmo oficial
- ✅ Validação online (Receita Federal) - opcional
- ✅ Feedback visual (ícone ✓ ou ✗)
- ✅ Mensagens de erro claras
- ✅ Integrado nos checkouts (mobile e desktop)

#### **Arquivos criados:**
- `src/lib/utils/cpfUtils.ts` - Funções de CPF
- `src/components/checkout/CpfInput.tsx` - Componente reutilizável

---

### 2️⃣ **Busca Automática de CEP**

#### **Funcionalidades:**
- ✅ Busca automática (ViaCEP API)
- ✅ Preenchimento automático de endereço
- ✅ Formatação automática (00000-000)
- ✅ Feedback visual durante busca
- ✅ Mensagens de sucesso/erro
- ✅ Integrado nos checkouts (mobile e desktop)

#### **Arquivos atualizados:**
- `src/lib/utils/cepUtils.ts` - Já existia, mantido
- `src/components/checkout/CepInput.tsx` - Componente reutilizável
- `src/pages/public/MobileCheckoutPage.tsx` - Corrigido
- `src/pages/public/PublicCheckoutPage.tsx` - Corrigido

---

## 🔧 Como Usar

### **CPF Input (Básico)**

```tsx
import { CpfInput } from '@/components/checkout/CpfInput';

function MyComponent() {
  const [cpf, setCpf] = useState('');

  return (
    <CpfInput
      value={cpf}
      onChange={setCpf}
      label="CPF"
      required
      showValidationIcon
    />
  );
}
```

### **CPF Input (Com validação online)**

```tsx
<CpfInput
  value={cpf}
  onChange={setCpf}
  label="CPF"
  required
  useOnlineValidation={true}  // ← Valida na Receita Federal
  onValidationChange={(isValid) => {
    console.log('CPF válido?', isValid);
  }}
/>
```

### **CEP Input (Básico)**

```tsx
import { CepInput } from '@/components/checkout/CepInput';

function MyComponent() {
  const [cep, setCep] = useState('');

  return (
    <CepInput
      value={cep}
      onChange={setCep}
      label="CEP"
      required
      autoSearch  // ← Busca automática
      onAddressFound={(address) => {
        if (address) {
          setStreet(address.street);
          setCity(address.city);
          setState(address.state);
          // ...
        }
      }}
    />
  );
}
```

---

## 📚 Funções Disponíveis (cpfUtils.ts)

### **formatCpf(value: string): string**
Formata CPF com pontos e hífen.

```typescript
formatCpf('12345678909');
// Retorna: '123.456.789-09'
```

### **validateCpf(cpf: string): CpfValidationResult**
Valida CPF localmente (algoritmo oficial).

```typescript
const result = validateCpf('123.456.789-09');
// {
//   valid: true,
//   formatted: '123.456.789-09',
//   message: 'CPF válido'
// }
```

### **validateCpfOnline(cpf: string): Promise<...>**
Valida CPF na Receita Federal (API ReceitaWS).

**⚠️ ATENÇÃO:** Limite de 3 consultas/minuto.

```typescript
const result = await validateCpfOnline('123.456.789-09');
// {
//   valid: true,
//   name: 'NOME DA PESSOA',
//   birthDate: '01/01/1990',
//   situation: 'REGULAR',
//   message: 'CPF válido'
// }
```

### **isValidCpf(cpf: string): boolean**
Retorna apenas true/false.

```typescript
isValidCpf('123.456.789-09'); // true ou false
```

### **getCpfRegion(cpf: string): string**
Retorna a região de emissão do CPF.

```typescript
getCpfRegion('123.456.789-09');
// 'São Paulo'
```

---

## 📚 Funções Disponíveis (cepUtils.ts)

### **formatCep(value: string): string**
Formata CEP com hífen.

```typescript
formatCep('01310100');
// Retorna: '01310-100'
```

### **searchCep(cep: string): Promise<AddressData | null>**
Busca endereço na API ViaCEP.

```typescript
const address = await searchCep('01310100');
// {
//   street: 'Avenida Paulista',
//   neighborhood: 'Bela Vista',
//   city: 'São Paulo',
//   state: 'SP',
//   zipCode: '01310-100'
// }
```

### **isValidCep(cep: string): boolean**
Valida formato do CEP (8 dígitos).

```typescript
isValidCep('01310-100'); // true
isValidCep('123'); // false
```

---

## 🎨 Props dos Componentes

### **CpfInput**

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `value` | string | - | Valor do CPF (obrigatório) |
| `onChange` | function | - | Callback de mudança (obrigatório) |
| `onValidationChange` | function | - | Callback quando validação muda |
| `label` | string | - | Label do input |
| `required` | boolean | false | Se é obrigatório |
| `disabled` | boolean | false | Se está desabilitado |
| `placeholder` | string | '000.000.000-00' | Placeholder |
| `useOnlineValidation` | boolean | false | Se usa API Receita Federal |
| `showValidationIcon` | boolean | true | Se mostra ícone de validação |
| `autoFormat` | boolean | true | Se formata automaticamente |

### **CepInput**

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `value` | string | - | Valor do CEP (obrigatório) |
| `onChange` | function | - | Callback de mudança (obrigatório) |
| `onAddressFound` | function | - | Callback quando encontra endereço |
| `label` | string | - | Label do input |
| `required` | boolean | false | Se é obrigatório |
| `disabled` | boolean | false | Se está desabilitado |
| `placeholder` | string | '00000-000' | Placeholder |
| `autoSearch` | boolean | true | Se busca automaticamente |
| `showSearchIcon` | boolean | true | Se mostra ícone de busca |
| `debounceMs` | number | 500 | Delay para busca (ms) |

---

## 🚀 Testando

### **Teste de CPF (válidos):**
```
123.456.789-09  ← CPF de teste (válido)
111.444.777-35  ← Outro CPF válido
```

### **Teste de CPF (inválidos):**
```
111.111.111-11  ← Todos dígitos iguais
123.456.789-00  ← Dígito verificador errado
```

### **Teste de CEP:**
```
01310-100  ← Av. Paulista, SP
20040-020  ← Rio de Janeiro
```

---

## 🐛 Troubleshooting

### **CEP não está buscando?**
1. Verificar conexão com internet
2. Verificar console: pode ter erro de CORS
3. API ViaCEP pode estar fora (raro)
4. Tentar CEP diferente

### **CPF online não funciona?**
1. ReceitaWS tem limite de 3 consultas/minuto
2. Se exceder, fallback usa validação local
3. Para produção, considere API paga

### **Formatação não acontece?**
1. Verificar se `autoFormat={true}`
2. Verificar se `maxLength` está correto
3. Verificar imports

---

## 📊 APIs Usadas

### **ViaCEP (Gratuita)**
- URL: `https://viacep.com.br/ws/{cep}/json/`
- Limite: Ilimitado
- Docs: https://viacep.com.br/

### **ReceitaWS (Gratuita)**
- URL: `https://www.receitaws.com.br/v1/cpf/{cpf}`
- Limite: 3 consultas/minuto
- Docs: https://receitaws.com.br/

---

## ✅ Checklist de Implementação

- [x] Criar cpfUtils.ts
- [x] Criar CpfInput.tsx
- [x] Criar CepInput.tsx
- [x] Atualizar MobileCheckoutPage.tsx
- [x] Atualizar PublicCheckoutPage.tsx
- [x] Testar formatação de CPF
- [x] Testar validação de CPF
- [x] Testar busca de CEP
- [x] Testar preenchimento automático
- [x] Documentação completa

---

## 🎉 Próximos Passos (Opcional)

- [ ] Adicionar testes unitários
- [ ] Adicionar validação de CNPJ
- [ ] Cachear resultados de CEP
- [ ] Integrar com Google Places API
- [ ] Adicionar validação de telefone

