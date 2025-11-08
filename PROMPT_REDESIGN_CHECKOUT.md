# PROMPT REDESIGN CHECKOUT SYNCADS

## CONTEXTO
SyncAds - Plataforma SaaS de marketing com IA + checkout e-commerce
Stack: React + TypeScript + Vite + Supabase + Tailwind + Shadcn/UI

## SITUAÇÃO ATUAL
✅ PixPayment.tsx - REDESENHADO (QR Code SVG, Framer Motion, timer urgência)
✅ CreditCardForm.tsx - REDESENHADO (Card 3D, validação Luhn, 5 bandeiras)
✅ validationUtils.ts - CRIADO (APIs validação nome/email/telefone com debounce)
⚠️ PublicCheckoutPage.tsx - ANTIGO (2501 linhas) - PRECISA REDESIGN COMPLETO

## OBJETIVO
Redesenhar PublicCheckoutPage.tsx do ZERO:
- Layout moderno + Framer Motion
- 3 Steps animados: Dados → Endereço → Pagamento
- Validações real-time com validationUtils.ts
- Integrar 100+ personalizações (CheckoutTheme)
- Stepper visual
- Resumo pedido flutuante
- Mobile-first
- Gradientes vibrantes

## BIBLIOTECAS JÁ INSTALADAS
framer-motion, react-qr-code, react-credit-cards-2, react-input-mask, lucide-react, @radix-ui/*, recharts, date-fns, zustand

## COMPONENTES PRONTOS

### src/components/checkout/PixPayment.tsx
```typescript
interface PixPaymentProps {
  pixData?: { qrCode: string; expiresAt?: string; amount: number };
  onPaymentConfirmed?: () => void;
  theme?: { primaryButtonBackgroundColor, textColor, headingColor, ... };
}
```

### src/components/checkout/CreditCardForm.tsx
```typescript
interface CreditCardFormProps {
  onCardDataChange: (cardData: CardData) => void;
  theme?: any;
  errors?: Record<string, string>;
}
export interface CardData {
  number, holderName, expiryMonth, expiryYear, cvv, brand?
}
```

### src/lib/utils/validationUtils.ts
```typescript
validateName(name: string): Promise<NameValidationResult>
validateNameDebounced(name, callback)
validateEmail(email: string): Promise<EmailValidationResult>
validateEmailDebounced(email, callback)
validatePhone(phone: string): Promise<ValidationResult>
validatePhoneDebounced(phone, callback)
formatPhone(phone: string): string
capitalizeWords(text: string): string
```

### src/config/defaultCheckoutTheme.ts
```typescript
interface CheckoutTheme {
  backgroundColor, primaryButtonBackgroundColor, checkoutButtonBackgroundColor,
  textColor, headingColor, fontFamily, fontSize, fontWeight, spacing,
  borderRadius, noticeBarEnabled, noticeBarMessage, cartDisplay,
  showCountdownTimer, orderBumpEnabled, ... // 100+ opções
}
DEFAULT_CHECKOUT_THEME, applyTheme(customTheme)
```

## ESTRUTURA NOVO PUBLICCHECKOUTPAGE.TSX

```typescript
import { motion, AnimatePresence } from "framer-motion";
import { PixPayment } from "@/components/checkout/PixPayment";
import { CreditCardForm } from "@/components/checkout/CreditCardForm";
import { validateNameDebounced, validateEmailDebounced, validatePhoneDebounced } from "@/lib/utils/validationUtils";
import { applyTheme, DEFAULT_CHECKOUT_THEME } from "@/config/defaultCheckoutTheme";

interface PublicCheckoutProps {
  injectedOrderId?: string;
  injectedTheme?: any;
  previewMode?: boolean;
}

const PublicCheckoutPage: React.FC<PublicCheckoutProps> = ({ injectedOrderId, injectedTheme, previewMode }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [customerData, setCustomerData] = useState({ name, email, phone, document });
  const [addressData, setAddressData] = useState({...});
  const [paymentMethod, setPaymentMethod] = useState<"PIX"|"CREDIT_CARD"|"BOLETO">("PIX");
  const [orderData, setOrderData] = useState(null);
  const [customization, setCustomization] = useState(null);
  const [nameValidation, setNameValidation] = useState(null);
  const [emailValidation, setEmailValidation] = useState(null);
  
  const theme = injectedTheme ? applyTheme(injectedTheme) : 
                customization?.theme ? applyTheme(customization.theme) : 
                DEFAULT_CHECKOUT_THEME;

  return (
    <div style={{ backgroundColor: theme.backgroundColor }}>
      {theme.showLogoAtTop && <Header theme={theme} />}
      {theme.noticeBarEnabled && <NoticeBar theme={theme} />}
      {theme.bannerEnabled && <Banner theme={theme} />}
      
      <Stepper currentStep={currentStep} theme={theme} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <StepDadosPessoais 
                  customerData={customerData}
                  setCustomerData={setCustomerData}
                  validations={{ nameValidation, emailValidation }}
                  onNext={() => setCurrentStep(2)}
                  theme={theme}
                />
              )}
              {currentStep === 2 && (
                <StepEndereco onBack={() => setCurrentStep(1)} onNext={() => setCurrentStep(3)} theme={theme} />
              )}
              {currentStep === 3 && (
                <StepPagamento paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} onBack={() => setCurrentStep(2)} theme={theme} />
              )}
            </AnimatePresence>
          </div>
          
          <div className="lg:col-span-1">
            <OrderSummary orderData={orderData} theme={theme} />
          </div>
        </div>
      </div>
      
      {theme.showFooter && <Footer theme={theme} />}
    </div>
  );
};
```

## COMPONENTES CRIAR

### Stepper
```typescript
const Stepper = ({ currentStep, theme }) => (
  <motion.div className="flex justify-center gap-4 py-8">
    <Step number={1} active={currentStep===1} completed={currentStep>1} label="Dados" theme={theme} />
    <Connector completed={currentStep>1} />
    <Step number={2} active={currentStep===2} completed={currentStep>2} label="Endereço" theme={theme} />
    <Connector completed={currentStep>2} />
    <Step number={3} active={currentStep===3} label="Pagamento" theme={theme} />
  </motion.div>
);
```

### StepDadosPessoais
```typescript
const StepDadosPessoais = ({ customerData, setCustomerData, validations, onNext, theme }) => {
  const handleNameChange = (value) => {
    setCustomerData({ ...customerData, name: value });
    validateNameDebounced(value, setNameValidation);
  };
  
  return (
    <motion.div initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:20}}>
      <Card theme={theme}>
        <Input label="Nome Completo" value={customerData.name} onChange={handleNameChange} 
               validation={validations.nameValidation} icon={<User />} theme={theme} />
        
        <Input label="E-mail" value={customerData.email} onChange={handleEmailChange}
               validation={validations.emailValidation} icon={<Mail />} theme={theme} />
        
        {emailValidation?.suggestion && (
          <motion.div className="text-blue-600">Você quis dizer: {emailValidation.suggestion}?</motion.div>
        )}
        
        <Button onClick={onNext} theme={theme}>Continuar <ChevronRight /></Button>
      </Card>
    </motion.div>
  );
};
```

### StepPagamento
```typescript
const StepPagamento = ({ paymentMethod, setPaymentMethod, orderData, theme }) => {
  const methods = [
    { id:"PIX", icon:<Smartphone/>, label:"PIX", discount:"5% OFF" },
    { id:"CREDIT_CARD", icon:<CreditCard/>, label:"Cartão", installments:"12x" },
    { id:"BOLETO", icon:<FileText/>, label:"Boleto" }
  ];
  
  return (
    <motion.div>
      <div className="grid grid-cols-3 gap-4">
        {methods.map(m => (
          <MethodButton key={m.id} method={m} selected={paymentMethod===m.id} 
                        onClick={() => setPaymentMethod(m.id)} theme={theme} />
        ))}
      </div>
      
      <AnimatePresence mode="wait">
        {paymentMethod==="PIX" && <PixPayment pixData={orderData.pixData} theme={theme} />}
        {paymentMethod==="CREDIT_CARD" && <CreditCardForm onCardDataChange={handleCard} theme={theme} />}
      </AnimatePresence>
    </motion.div>
  );
};
```

### OrderSummary
```typescript
const OrderSummary = ({ orderData, theme }) => (
  <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="sticky top-8">
    <Card theme={theme}>
      <h3 style={{color:theme.headingColor}}>Resumo do Pedido</h3>
      {orderData?.products?.map(p => <ProductItem key={p.id} product={p} theme={theme} />)}
      <div className="space-y-2">
        <Line label="Subtotal" value={formatCurrency(orderData.subtotal)} />
        <Line label="Frete" value={formatCurrency(orderData.shipping)} />
        {orderData.discount>0 && <Line label="Desconto" value={`-${formatCurrency(orderData.discount)}`} color="green" />}
        <Separator />
        <Line label="Total" value={formatCurrency(orderData.total)} bold />
      </div>
      {theme.showTrustBadges && <TrustBadges theme={theme} />}
    </Card>
  </motion.div>
);
```

## DESIGN SYSTEM

Cores:
- PIX: `from-green-400 via-emerald-500 to-teal-600`
- Cartão: `from-purple-500 via-indigo-500 to-blue-500`
- Sucesso: `from-green-500 to-emerald-600`
- Erro: `from-red-500 to-rose-600`

Animações:
- Steps: `initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} transition={{duration:0.3}}`
- Botões: `whileHover={{scale:1.02}} whileTap={{scale:0.98}}`
- Validação: `border-green-500 bg-green-50` (válido) / `border-red-500 bg-red-50` (inválido)

Responsivo:
- `className="px-4 md:px-6 lg:px-8"`
- `className="text-xl md:text-2xl lg:text-3xl"`
- `className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"`

## APLICAR TEMA

```typescript
style={{
  backgroundColor: theme.backgroundColor,
  color: theme.textColor,
  fontFamily: theme.fontFamily,
  fontSize: theme.fontSize.base
}}

// Botão primário
style={{
  backgroundColor: theme.primaryButtonBackgroundColor,
  color: theme.primaryButtonTextColor,
  borderRadius: theme.primaryButtonBorderRadius
}}
```

## REGRAS
1. NÃO criar .md
2. NÃO fazer deploy
3. Usar dados reais Supabase (tabela Order)
4. Aplicar TODAS personalizações tema
5. Validar real-time com debounce
6. Mobile-first
7. Framer Motion tudo
8. Manter funcionalidades existentes
9. Testar: `npm run build`

## CHECKLIST
- [ ] Imports Framer Motion
- [ ] Stepper visual
- [ ] StepDadosPessoais + validações
- [ ] StepEndereco + CEP auto
- [ ] StepPagamento PIX/Cartão/Boleto
- [ ] OrderSummary flutuante
- [ ] Tema completo (100+ opções)
- [ ] Animações todos elementos
- [ ] 100% responsivo
- [ ] Build (npm run build)
- [ ] Aplica personalizações painel

## ARQUIVO
Caminho: `src/pages/public/PublicCheckoutPage.tsx`
Fazer backup antes: `cp PublicCheckoutPage.tsx PublicCheckoutPage.OLD.tsx`

## COMEÇAR AGORA
Redesenhar PublicCheckoutPage.tsx completo do zero. Ir direto ao código. Build ao final.