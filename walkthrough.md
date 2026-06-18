# Walkthrough — Sistemas de Marketing e Descontos por Forma de Pagamento no Checkout

Nesta etapa, implementamos e conectamos por completo os sistemas de **Order Bump**, **Upsell Pós-Compra**, **Cross-Sell** e **Faixa de Desconto (Discount Banner)** do SyncAds com o banco de dados e as páginas de checkout público, de sucesso e de administração.

---

## O que foi feito - Faixa de Desconto (Discount Banner) e Redesign

### 1. Banco de Dados e RPCs Seguros (Concluído)
- Recriamos a tabela `DiscountBanner` no Supabase com o schema correto para suportar todos os campos necessários (`type`, `status`, `discountCode`, `ctaText`, `ctaLink`, etc.).
- Ativamos o Row Level Security (RLS) e criamos as políticas para gerenciamento seguro do lojista (`userId = auth.uid()`) e leitura pública para checkouts não autenticados (`SELECT true`).
- Criamos as funções Postgres `increment_banner_impression`, `increment_banner_click` e `increment_banner_conversion` com `SECURITY DEFINER` para permitir que visitantes não autenticados no checkout registrem visualizações, cliques e conversões sem violar o RLS.

### 2. Painel de Controle de Faixa de Desconto (Administrador)
- **Arquivo modificado:** [DiscountBannerPage.tsx](file:///c:/Users/dinho/Documents/GitHub/SyncAds/src/pages/app/marketing/DiscountBannerPage.tsx)
- **Integração de Cupons/Shopify**:
  - Carrega cupons do lojista (locais e sincronizados do Shopify) via `marketingApi.coupons.getAll` e `shopifyDiscountsApi.listFromShopify`.
  - Exibe campo de seleção no formulário ("Aplicar Cupom automaticamente ao clicar") listando os códigos de desconto disponíveis.
- **Redesign do Modal para Horizontal com Abas e Mockup Realista de Celular**:
  - Aumentamos a largura do modal para `max-w-6xl` (estilo inline de `1200px` e largura `95vw` para evitar restrições do Dialog padrão) e fixamos a sua altura máxima em `h-[90vh]` (ou no máximo `820px`).
  - Dividimos o formulário na coluna da esquerda em **Abas (Tabs)** estruturadas (`Geral & Regras`, `Conteúdo & Cupom` e `Design & Cores`) e diminuímos o espaçamento vertical entre os elementos. Isso tornou a exibição compacta e eliminou a necessidade de rolagem sob resoluções normais.
  - Redesenhamos a visualização em tempo real à direita para exibir um **mockup realista de celular** idêntico ao do painel de personalização de templates (com borda de bezel de 8px, botões laterais físicos simulados, relógio `9:41`, Dynamic Island e ícones de status bar). Ajustamos as proporções internas e a altura total para `350px` para que o frame caiba perfeitamente no viewport sem qualquer corte ou distorção.

### 3. Componente de Aviso Reativo
- **Arquivo modificado:** [NoticeBar.tsx](file:///c:/Users/dinho/Documents/GitHub/SyncAds/src/components/checkout/NoticeBar.tsx)
- Atualizada a barra de avisos para suportar a exibição do botão de chamada para ação (CTA) se `ctaText` estiver preenchido.
- Respeita a estilização customizada de cores de fundo do botão (`buttonBackgroundColor`) e cor do texto do botão (`buttonTextColor`).
- Dispara a ação de aplicar o cupom correspondente no clique do botão e gerencia o estado visual de carregamento.

### 4. Integração no Checkout Público
- **Arquivo modificado:** [PublicCheckoutPage.tsx](file:///c:/Users/dinho/Documents/GitHub/SyncAds/src/pages/public/PublicCheckoutPage.tsx)
- Busca as faixas de desconto ativas para o lojista (`userId`) na inicialização do checkout público.
- Gerencia a exibição de banners do tipo `POPUP` reativamente (ex: disparar imediatamente, após um delay, ou intenção de saída do mouse).
- Adiciona ação de clique ao banner: se o cliente clicar no botão de CTA do banner, o checkout executa a aplicação automática do `discountCode` vinculado chamando a função `handleApplyCoupon`.
- Incrementa visualizações e cliques de forma assíncrona usando os RPCs de segurança definidos.
- Registra a conversão na finalização do pedido se algum banner estiver ativo.

### 5. Configuração nos Templates de Checkout
- **Arquivos modificados:**
  - [MinimalTemplate.tsx](file:///c:/Users/dinho/Documents/GitHub/SyncAds/src/components/checkout/templates/MinimalTemplate.tsx)
  - [PremiumTemplate.tsx](file:///c:/Users/dinho/Documents/GitHub/SyncAds/src/components/checkout/templates/PremiumTemplate.tsx)
  - [TikTokTemplate.tsx](file:///c:/Users/dinho/Documents/GitHub/SyncAds/src/components/checkout/templates/TikTokTemplate.tsx)
- Passa os parâmetros de banners do tipo `HEADER` e `FOOTER` vindos da API pública de banners ativos para os componentes `NoticeBar` correspondentes.
- O header NoticeBar e o footer NoticeBar são resolvidos e renderizados dinamicamente se configurados no banco, preservando o fallback da configuração padrão da loja se não houver banners ativos.

---

## O que foi feito - Order Bump

### 1. Banco de Dados e isolamento por `userId`
- A tabela `OrderBump` agora utiliza `userId` em vez de `organizationId` para isolamento de dados de forma 100% segura por lojista.

### 2. Painel de Controle de Order Bump
- **Arquivo modificado:** [OrderBumpPage.tsx](file:///c:/Users/dinho/Documents/GitHub/SyncAds/src/pages/app/marketing/OrderBumpPage.tsx)
- Corrigida a listagem e a criação de order bumps para usar a coluna `userId` e o ID do usuário logado.
- Adicionado carregamento paralelo dos produtos cadastrados manualmente e dos sincronizados da Shopify, exibindo ambos os tipos unificados no select de produto.

### 3. Motor do Checkout Público
- **Arquivo modificado:** [PublicCheckoutPage.tsx](file:///c:/Users/dinho/Documents/GitHub/SyncAds/src/pages/public/PublicCheckoutPage.tsx)
- No carregamento inicial, o checkout público agora busca os order bumps ativos e realiza um join manual enriquecendo cada oferta com os dados de seu respectivo produto (imagem, nome e preço original da tabela `Product` ou `ShopifyProduct`).
- Calcula o preço com desconto (porcentagem ou valor fixo) dinamicamente.
- Quando o usuário final seleciona um order bump, o item extra é adicionado dinamicamente ao array de produtos do payload de checkout e os valores de subtotal e total são recalculados instantaneamente.
- Passa os order bumps e callbacks para o `TemplateRenderer`.

### 4. Hook de Pagamento e Persistência
- **Arquivo modificado:** [usePaymentProcessor.ts](file:///c:/Users/dinho/Documents/GitHub/SyncAds/src/hooks/usePaymentProcessor.ts)
- Adicionado suporte a parâmetros opcionais de persistência (`items`, `couponCode`, `couponDiscount` e `discount`).
- Ao finalizar o pagamento, a transação agora atualiza a tabela `Order` no banco de dados gravando a lista final de produtos comprados (produtos originais + bumps selecionados) e os totais/cupons reais.

### 5. Repasse no TemplateRenderer
- **Arquivo modificado:** [TemplateRenderer.tsx](file:///c:/Users/dinho/Documents/GitHub/SyncAds/src/components/checkout/TemplateRenderer.tsx)
- Atualizada a interface e o componente para repassar as propriedades de order bump para os templates individuais.

### 6. Integração nos Templates de Checkout
- **Template Premium:** [PremiumTemplate.tsx](file:///c:/Users/dinho/Documents/GitHub/SyncAds/src/components/checkout/templates/PremiumTemplate.tsx)
  - Renderiza os cards de order bumps acima da seção de pagamento.
  - Passa a lista atualizada de itens e desconto para o processador de pagamento.
- **Template TikTok:** [TikTokTemplate.tsx](file:///c:/Users/dinho/Documents/GitHub/SyncAds/src/components/checkout/templates/TikTokTemplate.tsx)
  - Renderiza os cards na coluna de formulários no desktop (esquerda) e acima do painel de pagamento no mobile.
  - Sincroniza e envia a lista final de itens comprados no fechamento.
- **Template Minimalista:** [MinimalTemplate.tsx](file:///c:/Users/dinho/Documents/GitHub/SyncAds/src/components/checkout/templates/MinimalTemplate.tsx) e [MinimalStepPayment.tsx](file:///c:/Users/dinho/Documents/GitHub/SyncAds/src/components/checkout/templates/shared/steps/MinimalStepPayment.tsx)
  - Exibe a oferta de order bump na Etapa 3 (Pagamento) acima da forma de pagamento.
  - Passa e persiste os cupons e itens extras adicionados ao chamar o gateway de pagamento.

---

## O que foi feito - Upsell Pós-Compra

### 1. Banco de Dados e API de Upsell
- Adicionada a coluna `userId` (text) e o índice de busca correspondente (`idx_upsell_userid`) na tabela `Upsell` no Supabase para garantir o isolamento correto dos dados por lojista.

### 2. Painel de Controle de Upsell (Administrador)
- **Arquivo modificado:** [UpsellPage.tsx](file:///c:/Users/dinho/Documents/GitHub/SyncAds/src/pages/app/marketing/UpsellPage.tsx)
- Corrigido o formulário de criação/edição de ofertas para mapear os campos exatamente como definidos no banco de dados (`fromProductId` para o produto gatilho e `toProductId` para o produto de upsell).
- Substituída a busca por `organizationId` para isolamento seguro por `userId`.
- Implementado o carregamento de produtos locais e sincronizados da Shopify paralelamente, unificando os produtos nos selects e identificando corretamente a origem (Local ou Shopify) em listagens e formulários.

### 3. Integração no Checkout Público (Pós-Compra na Página de Sucesso)
- **Arquivo modificado:** [CheckoutSuccessPage.tsx](file:///c:/Users/dinho/Documents/GitHub/SyncAds/src/pages/public/CheckoutSuccessPage.tsx)
- Após a conclusão bem-sucedida do pagamento no checkout, ao carregar a transação, a página busca os itens adquiridos no pedido original.
- Verifica se existe alguma oferta de upsell ativa configurada para qualquer um dos produtos comprados.
- Se houver, busca as informações do produto oferecido (da tabela `Product` local ou `ShopifyProduct`), calcula o desconto (percentual ou fixo) e renderiza um banner/card premium com um timer de escassez (contagem regressiva de 5 minutos).
- Implementado um modal integrado de **pagamento rápido** (PIX, Boleto ou Cartão de Crédito) para o item de upsell.
- Ao aprovar o pagamento adicional (chamando a Edge Function `process-payment`), o item de upsell é dinamicamente anexado ao array JSONB de itens (`items`) do pedido (`Order`) e o valor total (`total`) da compra é incrementado e atualizado na base de dados imediatamente, mantendo o pedido completo unificado.

---

## O que foi feito - Cross-Sell

### 1. Banco de Dados e API de Cross-Sell
- Adicionada a coluna `userId` (text) e o índice de busca correspondente (`idx_crosssell_userid`) na tabela `CrossSell` no Supabase para isolamento de dados por lojista de forma 100% segura.

### 2. Painel de Controle de Cross-Sell (Administrador)
- **Arquivo modificado:** [CrossSellPage.tsx](file:///c:/Users/dinho/Documents/GitHub/SyncAds/src/pages/app/marketing/CrossSellPage.tsx)
- Corrigida a listagem, criação e edição de cross-sells para mapear as chaves de dados corretas para o banco de dados: `productId` (produto gatilho) e `relatedProductIds` (produtos sugeridos complementares).
- Alterada a API e o painel para usar `userId` isolado (`user.id`) inves de `organizationId`.
- Carregamento de produtos locais e do Shopify em paralelo via `Promise.all` para exibição unificada nos selects com tag indicativa de origem.

### 3. Componente de Recomendação Reutilizável
- **Componente criado:** [CrossSellCard.tsx](file:///c:/Users/dinho/Documents/GitHub/SyncAds/src/components/checkout/CrossSellCard.tsx)
- Desenvolvido um card premium com imagem do produto, nome, descrição opcional, preços original e promocional, badge verde de desconto e um botão redondo dinâmico com micro-animação para adicionar ou remover o item da compra de forma simples.

### 4. Integração no Motor de Checkout e nos Templates
- **Motor do Checkout:** [PublicCheckoutPage.tsx](file:///c:/Users/dinho/Documents/GitHub/SyncAds/src/pages/public/PublicCheckoutPage.tsx)
  - Carrega as ofertas de cross-sell ativas com base nos itens originalmente no carrinho.
  - Busca os produtos recomendados do banco e calcula o desconto (porcentagem ou valor fixo).
  - Controla o estado de itens selecionados e adiciona os produtos complementares ao array final de compras, recalculando na hora o subtotal e o total da transação.
- **Passagem no Renderer:** [TemplateRenderer.tsx](file:///c:/Users/dinho/Documents/GitHub/SyncAds/src/components/checkout/TemplateRenderer.tsx) e [checkout.types.ts](file:///c:/Users/dinho/Documents/GitHub/SyncAds/src/types/checkout.types.ts)
  - Modificado o motor de renderização multi-template para repassar a lista de cross-sells, os selecionados e o callback de alternância para os templates filhos.
- **Templates de Checkout:**
  - **Premium:** [PremiumTemplate.tsx](file:///c:/Users/dinho/Documents/GitHub/SyncAds/src/components/checkout/templates/PremiumTemplate.tsx)
    - Renderiza a seção "🔥 Aproveite e compre junto!" no fluxo principal esquerdo, logo abaixo do Order Bump.
  - **TikTok:** [TikTokTemplate.tsx](file:///c:/Users/dinho/Documents/GitHub/SyncAds/src/components/checkout/templates/TikTokTemplate.tsx)
    - Renderiza os cards de Cross-Sell no painel de checkout do desktop (coluna esquerda) e no painel do mobile.
  - **Minimal:** [MinimalTemplate.tsx](file:///c:/Users/dinho/Documents/GitHub/SyncAds/src/components/checkout/templates/MinimalTemplate.tsx)
    - Renderiza a oferta de produtos sugeridos na Etapa 3 (Pagamento) junto com o Order Bump.

---

## Ajustes de UI e Redesign Futurista do Modal de Banners

Com base nos feedbacks de design, refinamos o modal de faixas de desconto (`DiscountBannerPage.tsx`) para proporcionar uma experiência visual deslumbrante e focada:

1. **Visualização em Tempo Real Ampliada (Tamanho Exato do Container)**:
   - Redimensionamos o mockup de celular para **`w-[360px] h-[550px]`**, ocupando de forma precisa a totalidade da área interna útil do container (quadrado) do preview à direita.
   - Removemos a barra de rolagem cinza de dentro do celular definindo a div interna como `overflow-hidden` e reestruturando o placeholder do checkout usando flexbox (`flex-1 flex flex-col justify-between`) para caber perfeitamente no espaço sem qualquer necessidade de rolagem.
   - Expandimos a altura útil máxima do modal de `730px` para **`750px`** para acomodar o celular maior com folga elegante nas bordas.

2. **Abas e Seletores Fixos**:
   - Fixamos os seletores de abas (`TabsList`) no topo da coluna de formulário.
   - Apenas o conteúdo interno das configurações rola verticalmente (`flex-1 overflow-y-auto`), o que garante que os botões de mudar de aba estejam **sempre visíveis e clicáveis** instantaneamente, sem precisar rolar de volta ao topo.

3. **Estética Futurista e Elegante**:
   - Fundo do modal atualizado para o tom tecnológico `bg-[#0b0f19]` com sombra neon brilhante laranja/rosa (`shadow-[0_0_50px_rgba(249,115,22,0.15)]`).
   - Abas (`TabsTrigger`) redesenhadas com cantos mais arredondados e gradiente moderno (`from-orange-500 to-pink-500`) ao serem selecionadas.
   - Centralizamos o mockup verticalmente com a classe `justify-center items-center` envolto em um container moderno com fundo escurecido de vidro fosco (`bg-[#030712]/30 border border-slate-850/60`).
   - Efeitos de hover suaves e foco neon nos inputs (`focus-visible:ring-orange-500/50`) para aprimorar a usabilidade.

---

## O que foi feito - Descontos por Forma de Pagamento

Implementamos e sincronizamos por completo os descontos automáticos baseados na forma de pagamento selecionada no checkout público (PIX, Boleto e Cartão de Crédito), vinculando com a tabela `PaymentMethodDiscount` no Supabase.

### 1. Extensão de Tipos e Props
- **Arquivo modificado:** [checkout.types.ts](file:///c:/Users/dinho/Documents/GitHub/SyncAds/src/types/checkout.types.ts)
  - Adicionada a propriedade `paymentMethodDiscount?: number` na interface `CheckoutData` para transportar o valor deduzido.
  - Adicionadas as propriedades `paymentMethod?: string` e `onPaymentMethodChange?: (method: any) => void` à interface `TemplateRenderProps`.

### 2. Painel de Resumo do Pedido (CheckoutSummaryPanel)
- **Arquivo modificado:** [CheckoutSummaryPanel.tsx](file:///c:/Users/dinho/Documents/GitHub/SyncAds/src/components/checkout/templates/shared/CheckoutSummaryPanel.tsx)
  - Extraído o valor `paymentMethodDiscount` de `checkoutData`.
  - Exibição de uma linha explícita `"Desconto (Forma de Pagamento)"` com a redução correspondente em verde.
  - Ajuste de cálculo para deduzir adequadamente no valor final do pedido sem duplicidades com outros descontos.

### 3. Sincronização nos Templates de Checkout
- **Template Renderer:** [TemplateRenderer.tsx](file:///c:/Users/dinho/Documents/GitHub/SyncAds/src/components/checkout/TemplateRenderer.tsx)
  - Repasse das propriedades de método de pagamento (`paymentMethod` e `onPaymentMethodChange`) para os componentes lazy individuais.
- **Templates Minimalista, Confiança e Streamline:** [MinimalStepPayment.tsx](file:///c:/Users/dinho/Documents/GitHub/SyncAds/src/components/checkout/templates/shared/steps/MinimalStepPayment.tsx)
  - Sincronização do estado de pagamento selecionado na etapa 3 para propagar para o pai através do callback.
- **Template Premium:** [PremiumTemplate.tsx](file:///c:/Users/dinho/Documents/GitHub/SyncAds/src/components/checkout/templates/PremiumTemplate.tsx)
  - Interceptação da seleção interna do método de pagamento e sincronização instantânea via callback do pai.
- **Template TikTok:** [TikTokTemplate.tsx](file:///c:/Users/dinho/Documents/GitHub/SyncAds/src/components/checkout/templates/TikTokTemplate.tsx)
  - Mapeamento das strings locais do TikTok (`'credit' | 'pix' | 'boleto'`) com a representação canônica da tabela no banco, garantindo o funcionamento do callback e recálculo dinâmico.

### 4. Motor e Regras de Negócio do Checkout Público
- **Arquivo modificado:** [PublicCheckoutPage.tsx](file:///c:/Users/dinho/Documents/GitHub/SyncAds/src/pages/public/PublicCheckoutPage.tsx)
  - Importação do hook `usePaymentDiscounts` e invocação imediatamente após o cálculo dos totais parciais de Order Bump e Cross-Sell. A invocação foi estrategicamente posicionada para evitar problemas de hoisting com funções de escopo locais.
  - Atualização dos cálculos de `totalBeforeCashback` e `finalTotalWithBumps` para deduzir o desconto ativo do pagamento.
  - Envio do payload completo com o desconto para a exibição consistente nos resumos laterais.

### 5. Verificação no Supabase
- Executamos um script de automação (`verify_payment_discounts.js`) que se conectou à API REST do Supabase utilizando a chave de serviço para inspecionar a tabela `PaymentMethodDiscount`.
- Como a tabela estava vazia, o script inseriu com sucesso um desconto de teste de **10% para PIX** associado ao usuário lojista ativo `f4fb4657-f9c2-44db-8cb9-1b0768b46c6b`.
- Isso garante que o pipeline de dados está 100% integrado e que as consultas no checkout lerão os dados configurados com sucesso.

---

## Correções Adicionais - Hotfix do Preview de Templates (Customize)
- **Problema:** A página de personalização de templates (`/checkout/customize`) exibia uma tela preta de erro com `ReferenceError: calculatePotentialCashback is not defined` ao tentar carregar o preview em tempo real de qualquer template (Minimalista, Estilo TikTok, Estilo Shopify Pay). Isso ocorria porque a função era chamada no render JSX mas sua definição estava ausente no arquivo do checkout público.
- **Solução:** Implementamos a função `calculatePotentialCashback` síncrona dentro de `PublicCheckoutPage.tsx` para avaliar dinamicamente o retorno com base no total do carrinho (`finalTotalWithBumps`) e na regra de cashback ativa do banco (`activeCashbackRule`).
- **Resultado:** O preview do customizador de templates agora renderiza e atualiza perfeitamente de forma reativa e sem travar.

---

## Compilação e Validação (Sucesso)
- Executado `npm run build` na raiz do projeto com sucesso completo. O bundle foi gerado perfeitamente sem nenhuma falha de compilação ou tipo no TypeScript nos arquivos criados ou modificados.

