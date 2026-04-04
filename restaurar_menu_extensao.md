# Como Restaurar o Menu de "Extensão do Navegador"

O menu "Extensão do Navegador" foi temporariamente ocultado do frontend (painel do usuário) até que o aplicativo seja aprovado e lançado no Google Chrome Web Store. 
Quando chegar a hora de lançar, siga os passos abaixo para exibir o menu novamente para seus usuários.

## Passo a Passo para Restaurar:

1. Abra o arquivo `src/components/layout/Sidebar.tsx` no seu editor de código.
2. Procure pela variável `navItems` (aproximadamente na linha 59).
3. Adicione ou descomente a seguinte linha de código, logo abaixo da opção **Chat IA**:

```tsx
  { to: "/app/extension", icon: HiPuzzlePiece, label: "Extensão do Navegador" },
```

### Exemplo de como deve ficar após restaurar:

```tsx
const navItems: NavItem[] = [
  { to: "/chat", icon: HiChatBubbleBottomCenterText, label: "Chat IA" },
  { to: "/app/extension", icon: HiPuzzlePiece, label: "Extensão do Navegador" },
  { to: "/onboarding", icon: HiHome, label: "Página inicial" },
  // ... resto dos menus
];
```

4. Salve o arquivo.
5. Faça o commit e o *Deploy* na Vercel novamente.

Isso fará com que o ícone do quebra-cabeça e a página da extensão fiquem visíveis para todos os usuários novamente, sem afetar o banco de dados que já está pronto.
