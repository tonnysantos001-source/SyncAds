# 🧪 Guia de Testes - SyncAds

## 📋 Visão Geral

Este diretório contém testes automatizados de segurança e performance para o SyncAds.

## 🚀 Como Executar

### Executar todos os testes
```bash
npm test
```

### Executar testes em modo UI (interface visual)
```bash
npm run test:ui
```

### Executar testes uma vez (CI/CD)
```bash
npm run test:run
```

### Executar com relatório de cobertura
```bash
npm run test:coverage
```

## 📁 Estrutura de Testes

```
tests/
├── setup.ts                 # Configuração inicial
├── security.test.ts         # Testes de segurança
├── performance.test.ts      # Testes de performance
└── README.md               # Este arquivo
```

## 🛡️ Testes de Segurança

### O que é testado:

1. **Variáveis de Ambiente**
   - ✅ URL do Supabase configurada
   - ✅ Anon key configurada
   - ✅ Sem credenciais hardcoded

2. **RLS Policies**
   - ✅ Acesso não autorizado bloqueado
   - ✅ Isolamento de dados por organização
   - ✅ Proteção de tabelas sensíveis

3. **SQL Injection**
   - ✅ Sanitização de inputs
   - ✅ Prevenção de comandos maliciosos

4. **Autenticação**
   - ✅ Endpoints protegidos
   - ✅ Tokens JWT validados

5. **CORS**
   - ✅ Headers configurados
   - ✅ Origens permitidas

6. **Criptografia**
   - ✅ HTTPS obrigatório
   - ✅ Dados sensíveis protegidos

7. **Error Handling**
   - ✅ Sem vazamento de informações

## ⚡ Testes de Performance

### O que é testado:

1. **Queries de Banco**
   - ✅ Queries simples < 500ms
   - ✅ Queries com JOIN < 1000ms
   - ✅ Queries complexas < 1500ms

2. **Índices**
   - ✅ Uso eficiente de índices
   - ✅ Queries filtradas rápidas

3. **RLS Performance**
   - ✅ Políticas otimizadas
   - ✅ Sem impacto significativo

4. **API Response Time**
   - ✅ Health check < 500ms
   - ✅ Requisições concorrentes < 2s

5. **N+1 Prevention**
   - ✅ Joins eficientes
   - ✅ Sem queries redundantes

6. **Memory Usage**
   - ✅ Paginação implementada
   - ✅ Limites de dados

7. **Edge Functions**
   - ✅ Latência baixa
   - ✅ Respostas rápidas

## 🎯 Métricas de Performance

| Operação | Meta | Status |
|----------|------|--------|
| Query simples | < 500ms | ✅ |
| Query com JOIN | < 1000ms | ✅ |
| Query complexa | < 1500ms | ✅ |
| API Health Check | < 500ms | ✅ |
| Concurrent Requests | < 2000ms | ✅ |
| RLS Policy Check | < 400ms | ✅ |

## 🔧 Configuração

### Variáveis de Ambiente

Crie um arquivo `.env.test` com:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Dependências

Todas as dependências já estão instaladas via `package.json`:

- `vitest` - Framework de testes
- `@testing-library/react` - Testes de componentes
- `@testing-library/jest-dom` - Matchers personalizados
- `jsdom` - Environment do DOM
- `@vitest/ui` - Interface visual

## 📊 Relatórios

### Cobertura de Código

Após executar `npm run test:coverage`, você encontrará:

```
coverage/
├── index.html           # Relatório visual
├── coverage-final.json  # Dados brutos
└── lcov.info           # Formato LCOV
```

Abra `coverage/index.html` no navegador para visualizar.

## ✅ Checklist de Testes

Antes de fazer deploy:

- [ ] Todos os testes de segurança passando
- [ ] Todos os testes de performance passando
- [ ] Cobertura de código > 70%
- [ ] Sem vulnerabilidades conhecidas
- [ ] RLS policies otimizadas
- [ ] Índices criados
- [ ] Rate limiting configurado

## 🚨 Troubleshooting

### Erro: "Supabase URL not configured"
```bash
# Crie .env.test com suas credenciais
cp .env .env.test
```

### Erro: "Test timeout"
```bash
# Aumente o timeout em vitest.config.ts
testTimeout: 20000 // 20s
```

### Erro: "Cannot connect to database"
```bash
# Verifique se o Supabase está acessível
curl https://your-project.supabase.co
```

## 📚 Recursos

- [Vitest Docs](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Supabase Testing](https://supabase.com/docs/guides/testing)

## 🔄 Integração Contínua

Adicione ao seu `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: npm ci
      - run: npm run test:run
        env:
          VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
```

## 💡 Dicas

1. **Execute testes frequentemente** - Integre no seu workflow
2. **Monitore performance** - Use os benchmarks como baseline
3. **Atualize testes** - Quando adicionar features
4. **Revise cobertura** - Mantenha acima de 70%
5. **Automatize** - Configure CI/CD

---

**Última atualização:** 29/10/2024
**Versão:** 1.0.0

