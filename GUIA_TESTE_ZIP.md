# 🧪 Guia de Teste - Sistema de ZIP

## Como Testar a Funcionalidade de ZIP

### 1. Configuração Inicial

#### Executar Scripts SQL
```bash
# No Supabase Dashboard, executar:
scripts/create-temp-downloads-bucket.sql
```

#### Deploy da Edge Function
```bash
supabase functions deploy generate-zip
```

### 2. Testes via Chat da IA

#### Teste 1: ZIP Simples
```
Usuário: "Cria um ZIP com um arquivo de texto contendo 'Hello World'"
IA: Deve gerar ZIP e mostrar card de download
```

#### Teste 2: Relatório de Campanha
```
Usuário: "Gera um relatório completo da campanha 'Black Friday 2025' em ZIP"
IA: Deve criar ZIP com relatório, dados JSON e CSV
```

#### Teste 3: Export de Analytics
```
Usuário: "Exporta os dados de analytics do Meta Ads do último mês em ZIP"
IA: Deve gerar ZIP com dados em múltiplos formatos
```

### 3. Testes via Código

#### Teste Manual no Console
```javascript
// No console do navegador (F12)
import { ZipService } from '/src/lib/api/zipService.ts'

const files = [
  {
    name: 'teste.txt',
    content: 'Este é um arquivo de teste',
    type: 'text'
  },
  {
    name: 'dados.json',
    content: JSON.stringify({ teste: 'dados' }, null, 2),
    type: 'json'
  }
]

ZipService.generateZip({
  files,
  zipName: 'teste-manual.zip'
}).then(result => {
  console.log('ZIP gerado:', result)
  window.open(result.downloadUrl, '_blank')
})
```

### 4. Cenários de Teste

#### ✅ Cenários de Sucesso
- [ ] ZIP com arquivo de texto simples
- [ ] ZIP com múltiplos arquivos
- [ ] ZIP com dados JSON
- [ ] ZIP com dados CSV
- [ ] ZIP com arquivo Base64 (imagem)
- [ ] Relatório de campanha completo
- [ ] Export de analytics
- [ ] Download automático funciona
- [ ] Card de download aparece no chat
- [ ] Tempo de expiração é exibido

#### ❌ Cenários de Erro
- [ ] Usuário não autenticado
- [ ] Arquivo muito grande (>100MB)
- [ ] Formato de arquivo inválido
- [ ] Bucket de storage não existe
- [ ] Edge Function não deployada
- [ ] Token JWT inválido

### 5. Verificações de Segurança

#### Autenticação
```javascript
// Teste sem autenticação (deve falhar)
fetch('/functions/v1/generate-zip', {
  method: 'POST',
  body: JSON.stringify({ files: [] })
})
// Deve retornar 401 Unauthorized
```

#### Expiração
```javascript
// Verificar se arquivo expira em 1 hora
const result = await ZipService.generateZip({...})
const expiry = new Date(result.expiresAt)
const now = new Date()
const diffHours = (expiry - now) / (1000 * 60 * 60)
// Deve ser aproximadamente 1 hora
```

### 6. Testes de Performance

#### Arquivo Grande
```javascript
// Criar arquivo de 10MB
const largeContent = 'A'.repeat(10 * 1024 * 1024)
const files = [{
  name: 'large.txt',
  content: largeContent,
  type: 'text'
}]

const start = Date.now()
const result = await ZipService.generateZip({ files, zipName: 'large.zip' })
const duration = Date.now() - start

console.log(`ZIP gerado em ${duration}ms`)
```

#### Múltiplos Arquivos
```javascript
// Criar ZIP com 50 arquivos
const files = Array.from({ length: 50 }, (_, i) => ({
  name: `arquivo-${i}.txt`,
  content: `Conteúdo do arquivo ${i}`,
  type: 'text'
}))

const result = await ZipService.generateZip({ files, zipName: 'muitos-arquivos.zip' })
```

### 7. Testes de Interface

#### Responsividade
- [ ] Card de download funciona no mobile
- [ ] Botões são clicáveis em telas pequenas
- [ ] Texto não quebra em telas pequenas
- [ ] Lista de downloads é scrollável

#### Acessibilidade
- [ ] Botões têm labels apropriados
- [ ] Cards são navegáveis por teclado
- [ ] Contraste de cores adequado
- [ ] Screen readers conseguem ler o conteúdo

### 8. Testes de Integração

#### Com Chat da IA
```javascript
// Simular resposta da IA com ZIP_DOWNLOAD
const mockResponse = `
Aqui está seu relatório!

ZIP_DOWNLOAD: {"downloadUrl": "https://...", "fileName": "relatorio.zip", "expiresAt": "2025-01-01T12:00:00Z", "fileCount": 3}
`

// Verificar se processZipDownloads detecta o bloco
const processed = processZipDownloads(mockResponse)
// Deve remover o bloco ZIP_DOWNLOAD e adicionar à lista de downloads
```

#### Com Sistema de Autenticação
```javascript
// Verificar se token é passado corretamente
const { data: { session } } = await supabase.auth.getSession()
const token = session?.access_token

// Token deve estar presente nas requisições
```

### 9. Checklist de Deploy

#### Backend
- [ ] Edge Function `generate-zip` deployada
- [ ] Bucket `temp-downloads` criado
- [ ] Políticas RLS configuradas
- [ ] Variáveis de ambiente definidas

#### Frontend
- [ ] Componentes importados corretamente
- [ ] Função `processZipDownloads` adicionada
- [ ] Estado `zipDownloads` implementado
- [ ] Interface de download integrada

#### IA
- [ ] Ferramentas de ZIP adicionadas ao registry
- [ ] Prompts atualizados
- [ ] Sistema de detecção implementado

### 10. Métricas de Sucesso

#### Funcionalidade
- [ ] 100% dos ZIPs são gerados com sucesso
- [ ] Downloads funcionam em todos os navegadores
- [ ] Arquivos expiram corretamente
- [ ] Limpeza automática funciona

#### Performance
- [ ] ZIPs < 1MB gerados em < 2 segundos
- [ ] ZIPs < 10MB gerados em < 10 segundos
- [ ] ZIPs < 100MB gerados em < 60 segundos
- [ ] Interface responsiva em < 100ms

#### Segurança
- [ ] Apenas usuários autenticados podem gerar ZIPs
- [ ] Arquivos são removidos após expiração
- [ ] URLs não são previsíveis
- [ ] Não há vazamento de dados

---

**Sistema pronto para produção!** 🚀

Após todos os testes passarem, a funcionalidade de ZIP estará totalmente operacional e integrada ao SyncAds AI.
