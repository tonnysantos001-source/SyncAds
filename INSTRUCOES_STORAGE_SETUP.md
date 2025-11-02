# 📦 CONFIGURAÇÃO DE STORAGE BUCKETS - SUPABASE

Este guia explica como configurar os buckets de storage para upload de imagens no sistema SyncAds.

## 🎯 O QUE SERÁ CRIADO

- **`checkout-images`**: Bucket para logos, favicons e banners do checkout (5MB por arquivo)
- **`product-images`**: Bucket para imagens de produtos (10MB por arquivo)

Ambos os buckets serão **públicos** para leitura e permitirão upload apenas por usuários autenticados.

## 📋 PRÉ-REQUISITOS

- Acesso ao Dashboard do Supabase
- Projeto criado no Supabase
- Permissões de administrador

## 🚀 PASSO A PASSO

### **Opção 1: Via SQL Editor (Recomendado)**

1. **Acesse o Supabase Dashboard**
   - Vá para https://supabase.com/dashboard
   - Selecione seu projeto

2. **Abra o SQL Editor**
   - No menu lateral, clique em **SQL Editor**
   - Clique em **+ New Query**

3. **Execute o Script**
   - Copie TODO o conteúdo do arquivo: `scripts/setup-storage-buckets.sql`
   - Cole no editor SQL
   - Clique em **Run** (ou pressione Ctrl + Enter)

4. **Verifique a Execução**
   - Se tudo correr bem, você verá mensagens de sucesso
   - A última seção do script mostra os buckets e políticas criados

### **Opção 2: Via Storage UI**

1. **Acesse Storage**
   - No menu lateral, clique em **Storage**

2. **Criar Bucket: checkout-images**
   - Clique em **New bucket**
   - Nome: `checkout-images`
   - Marque: **Public bucket** ✓
   - Em **File size limit**: `5242880` (5MB)
   - Em **Allowed MIME types**: 
     ```
     image/jpeg, image/jpg, image/png, image/webp, image/gif
     ```
   - Clique em **Create bucket**

3. **Configurar Políticas (checkout-images)**
   - Clique no bucket criado
   - Vá em **Policies**
   - Clique em **New Policy** 4 vezes para criar:
     - **Select (Read)**: `bucket_id = 'checkout-images'` → Permitir para todos
     - **Insert (Upload)**: `bucket_id = 'checkout-images' AND auth.role() = 'authenticated'`
     - **Update**: `bucket_id = 'checkout-images' AND auth.uid()::text = (storage.foldername(name))[1]`
     - **Delete**: `bucket_id = 'checkout-images' AND auth.uid()::text = (storage.foldername(name))[1]`

4. **Repetir para: product-images**
   - Seguir os mesmos passos
   - Limite de tamanho: `10485760` (10MB)

## ✅ VERIFICAÇÃO

Após a configuração, verifique se está tudo correto:

### 1. Verificar Buckets

```sql
SELECT
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets
WHERE id IN ('checkout-images', 'product-images');
```

**Resultado esperado:**
| id | name | public | file_size_limit | allowed_mime_types |
|---|---|---|---|---|
| checkout-images | checkout-images | true | 5242880 | {image/jpeg, image/jpg, ...} |
| product-images | product-images | true | 10485760 | {image/jpeg, image/jpg, ...} |

### 2. Verificar Políticas

```sql
SELECT
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'objects'
  AND (policyname LIKE '%checkout%' OR policyname LIKE '%product%');
```

**Resultado esperado:** 8 políticas no total (4 para cada bucket)

### 3. Testar Upload (Via Frontend)

1. Acesse a página de personalização do checkout
2. Na seção **CABEÇALHO**, clique em **Logo da loja**
3. Tente fazer upload de uma imagem (arrastar, colar ou selecionar)
4. Se funcionar, você verá o preview da imagem e a URL será salva

## 🔧 SOLUÇÃO DE PROBLEMAS

### ❌ Erro: "new row violates row-level security policy"

**Causa:** As políticas não foram criadas corretamente

**Solução:**
1. Vá em **Storage** → Selecione o bucket → **Policies**
2. Crie manualmente as políticas de INSERT, UPDATE e DELETE
3. Certifique-se de que a condição `auth.role() = 'authenticated'` está ativa

### ❌ Erro: "Permission denied for bucket"

**Causa:** O bucket não está configurado como público

**Solução:**
1. Vá em **Storage** → Selecione o bucket
2. Em **Settings**, marque **Public bucket**
3. Salve as alterações

### ❌ Erro: "File size exceeds limit"

**Causa:** Arquivo maior que o limite configurado

**Solução:**
1. Vá em **Storage** → Selecione o bucket → **Settings**
2. Aumente o **File size limit**
3. Para checkout-images: `5242880` (5MB)
4. Para product-images: `10485760` (10MB)

### ❌ Erro: "MIME type not allowed"

**Causa:** Formato de arquivo não permitido

**Solução:**
1. Vá em **Storage** → Selecione o bucket → **Settings**
2. Adicione o MIME type em **Allowed MIME types**
3. Formatos suportados: `image/jpeg, image/jpg, image/png, image/webp, image/gif`

## 📁 ESTRUTURA DE PASTAS

Os arquivos são organizados automaticamente:

```
checkout-images/
├── logos/
│   └── 1234567890-abc123.png
├── favicons/
│   └── 1234567890-def456.ico
├── banners/
│   └── 1234567890-ghi789.jpg
└── uploads/
    └── 1234567890-jkl012.webp

product-images/
└── uploads/
    ├── 1234567890-mno345.png
    └── 1234567890-pqr678.jpg
```

## 🔐 SEGURANÇA

✅ **Leitura pública:** Qualquer pessoa pode ver as imagens (necessário para o checkout funcionar)
✅ **Upload restrito:** Apenas usuários autenticados podem fazer upload
✅ **Edição/Exclusão:** Apenas o dono do arquivo pode editar/deletar
✅ **Limite de tamanho:** Previne uploads excessivos
✅ **MIME types restritos:** Apenas imagens são permitidas

## 🎨 USO NO FRONTEND

### Componente ImageUpload

O componente já está integrado e pronto para uso:

```tsx
<ImageUpload
  label="Logo da loja"
  description="Tamanho recomendado: 300px x 80px"
  value={logoUrl}
  onChange={(url) => setLogoUrl(url)}
  bucket="checkout-images"
  path="logos"
  aspectRatio="auto"
  maxSizeMB={2}
/>
```

### Funcionalidades disponíveis:

✅ **Drag & Drop:** Arraste imagens direto para a área
✅ **Paste (Ctrl+V):** Cole imagens da área de transferência
✅ **File Select:** Clique para selecionar do computador/galeria
✅ **URL Manual:** Opção de inserir URL de imagem externa
✅ **Preview:** Visualização antes e após o upload
✅ **Progress:** Barra de progresso durante upload
✅ **Remove:** Remover imagem facilmente

## 📞 SUPORTE

Se encontrar problemas:

1. Verifique se o projeto Supabase está ativo
2. Confirme que você tem permissões de administrador
3. Execute novamente o script SQL completo
4. Verifique os logs no Supabase Dashboard → Logs

## ✨ PRONTO!

Após seguir este guia, seu sistema estará pronto para:

✅ Upload de logos
✅ Upload de favicons
✅ Upload de banners
✅ Upload de imagens de produtos
✅ Drag & Drop de imagens
✅ Paste de imagens (Ctrl+V)
✅ Seleção de arquivos do dispositivo

**Teste agora na página de personalização do checkout! 🎉**