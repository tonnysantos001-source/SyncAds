# 📦 Sistema de Geração de Arquivos ZIP - SyncAds AI

## Visão Geral

O sistema de geração de arquivos ZIP permite que a IA crie arquivos compactados com múltiplos documentos para download pelos usuários. Ideal para relatórios, exports de dados, assets de campanhas e qualquer conjunto de arquivos.

## 🚀 Funcionalidades Implementadas

### 1. Edge Function `generate-zip`
- **Localização**: `supabase/functions/generate-zip/index.ts`
- **Função**: Gera arquivos ZIP no servidor usando JSZip
- **Segurança**: Autenticação obrigatória, arquivos temporários (1 hora)
- **Formatos suportados**: TXT, JSON, CSV, Base64

### 2. API Client `ZipService`
- **Localização**: `src/lib/api/zipService.ts`
- **Função**: Interface TypeScript para comunicação com a Edge Function
- **Métodos**:
  - `generateZip()` - ZIP genérico
  - `generateCampaignReport()` - Relatório de campanha
  - `generateAnalyticsExport()` - Export de analytics
  - Helpers para criar arquivos (TXT, JSON, CSV, Base64)

### 3. Componentes de Interface
- **ZipDownload**: `src/components/ZipDownload.tsx`
- **ZipDownloadCard**: `src/components/chat/ZipDownloadCard.tsx`
- **ZipDownloadList**: Lista de downloads disponíveis

### 4. Integração com IA
- **Ferramentas**: Adicionadas ao `src/lib/ai/tools.ts`
- **Prompts**: Atualizados em `src/lib/ai/sarcasticPersonality.ts`
- **Chat**: Processamento automático de downloads no `ChatPage.tsx`

## 🛠️ Como Usar

### Via Chat da IA

A IA pode criar ZIPs automaticamente quando solicitada:

```
Usuário: "Gera um relatório da campanha Black Friday em ZIP"
IA: "Pronto! Criei um ZIP com relatório completo, dados em CSV e JSON. 
     ZIP_DOWNLOAD: {"downloadUrl": "...", "fileName": "relatorio-black-friday.zip", ...}"
```

### Ferramentas Disponíveis

1. **`generate_zip`** - ZIP genérico
   ```typescript
   {
     files: [
       { name: "relatorio.txt", content: "...", type: "text" },
       { name: "dados.json", content: "...", type: "json" }
     ],
     zipName: "meu-relatorio.zip"
   }
   ```

2. **`generate_campaign_report`** - Relatório de campanha
   ```typescript
   {
     campaignId: "campaign-123",
     includeAnalytics: true,
     includeAssets: false
   }
   ```

3. **`generate_analytics_export`** - Export de analytics
   ```typescript
   {
     platform: "META_ADS",
     startDate: "2025-01-01",
     endDate: "2025-01-31",
     formats: ["csv", "json", "txt"]
   }
   ```

### Via Código Direto

```typescript
import { ZipService } from '@/lib/api/zipService'

// Criar arquivos
const files = [
  ZipService.createTextFile('relatorio.txt', 'Conteúdo do relatório'),
  ZipService.createJsonFile('dados.json', { metricas: 'valores' }),
  ZipService.createCsvFile('analytics.csv', [
    { data: '2025-01-01', metric: 'clicks', valor: 100 }
  ])
]

// Gerar ZIP
const result = await ZipService.generateZip({
  files,
  zipName: 'meu-relatorio.zip'
})

// Download automático
window.open(result.downloadUrl, '_blank')
```

## 🔧 Configuração Necessária

### 1. Bucket de Storage
Execute o script SQL para criar o bucket:
```sql
-- Executar: scripts/create-temp-downloads-bucket.sql
```

### 2. Deploy da Edge Function
```bash
supabase functions deploy generate-zip
```

### 3. Variáveis de Ambiente
- `SUPABASE_URL` - URL do projeto
- `SUPABASE_ANON_KEY` - Chave anônima
- `SUPABASE_SERVICE_ROLE_KEY` - Chave de serviço (para Edge Function)

## 📋 Tipos de Arquivo Suportados

| Tipo | Descrição | Exemplo |
|------|-----------|---------|
| `text` | Arquivo de texto simples | `.txt`, `.md` |
| `json` | Dados estruturados | `.json` |
| `csv` | Dados tabulares | `.csv` |
| `base64` | Arquivos binários | Imagens, PDFs |

## 🔒 Segurança

- **Autenticação**: Obrigatória para todas as operações
- **Expiração**: Arquivos expiram em 1 hora
- **Limite de tamanho**: 100MB por ZIP
- **Limpeza automática**: Arquivos removidos após expiração
- **Políticas RLS**: Apenas usuários autenticados podem criar downloads

## 🎯 Casos de Uso

### 1. Relatórios de Campanha
- Relatório em texto
- Dados em JSON e CSV
- Assets (imagens, vídeos)
- Métricas de performance

### 2. Exports de Analytics
- Dados históricos
- Múltiplos formatos
- Períodos personalizados
- Plataformas específicas

### 3. Assets de Marketing
- Criativos de campanha
- Logos e imagens
- Documentos de estratégia
- Templates

### 4. Backups de Dados
- Configurações
- Histórico de conversas
- Dados de usuário
- Configurações de integração

## 🚨 Limitações

- **Tamanho máximo**: 100MB por ZIP
- **Tempo de vida**: 1 hora
- **Arquivos simultâneos**: Limitado pela memória do servidor
- **Formatos**: Apenas os tipos suportados

## 🔄 Fluxo de Funcionamento

1. **Usuário solicita ZIP** via chat ou código
2. **IA processa** e chama ferramenta apropriada
3. **Edge Function** gera ZIP no servidor
4. **Arquivo salvo** no bucket temporário
5. **URL pública** retornada para download
6. **Interface exibe** card de download
7. **Usuário baixa** arquivo
8. **Limpeza automática** após 1 hora

## 🎉 Exemplos de Uso pela IA

```
Usuário: "Preciso de um relatório completo da campanha de Natal"
IA: "Perfeito! Vou gerar um ZIP com relatório detalhado, dados de performance em CSV, 
     métricas em JSON e todos os assets da campanha. Um momento..."

[IA executa generate_campaign_report]
[ZIP gerado e URL retornada]
[Card de download aparece no chat]

IA: "Pronto! Seu relatório está pronto para download. Tem relatório em texto, 
     dados em CSV e JSON, e todos os criativos da campanha. 
     O arquivo expira em 1 hora, então baixa logo!"
```

## 🛡️ Troubleshooting

### Erro: "Unauthorized"
- Verificar se usuário está autenticado
- Verificar token JWT válido

### Erro: "File too large"
- Reduzir tamanho dos arquivos
- Dividir em múltiplos ZIPs

### Erro: "Storage bucket not found"
- Executar script de criação do bucket
- Verificar políticas RLS

### Download não funciona
- Verificar se arquivo não expirou
- Tentar gerar novo ZIP

---

**Sistema implementado com sucesso!** 🎯

A IA agora pode criar arquivos ZIP sob demanda, oferecendo uma experiência completa de exportação e download para os usuários do SyncAds.
