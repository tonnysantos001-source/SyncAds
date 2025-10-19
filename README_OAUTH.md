# 🔗 Como Configurar Integrações OAuth

## ❌ Problema Atual

Quando você pede para a IA conectar uma integração (Facebook Ads, Google Ads, etc.), você recebe este erro:

```
❌ Erro
Client ID não configurado para Facebook Ads
```

## ✅ Solução Rápida

### Opção 1: Configuração Completa (Produção) ⭐

Para usar integrações reais, siga o guia completo:

📖 **Consulte:** `OAUTH_SETUP.md`

**Tempo:** 15-30 minutos por plataforma  
**Resultado:** Integrações funcionando com dados reais

---

### Opção 2: Modo Desenvolvimento (Testar Agora) 🚀

Se você só quer testar a funcionalidade sem configurar OAuth real:

1. **Abra o arquivo `.env` na raiz do projeto**

2. **Substitua as linhas de exemplo por IDs de teste:**
   ```env
   # OAuth - Para teste local
   VITE_META_CLIENT_ID=test_meta_client_id_123
   VITE_GOOGLE_CLIENT_ID=test_google_client_id_456.apps.googleusercontent.com
   VITE_LINKEDIN_CLIENT_ID=test_linkedin_client_id_789
   VITE_TWITTER_CLIENT_ID=test_twitter_client_id_abc
   VITE_TIKTOK_CLIENT_ID=test_tiktok_client_id_def
   VITE_OAUTH_CLIENT_SECRET=test_secret_xyz
   ```

3. **Reinicie o servidor de desenvolvimento:**
   ```bash
   # Pressione Ctrl+C no terminal
   # Execute novamente:
   npm run dev
   ```

4. **Teste no chat:**
   ```
   Você: "Conecte o Facebook Ads"
   IA: [Gera link de teste]
   ```

**⚠️ Nota:** Com IDs de teste, o link será gerado mas não funcionará de verdade. Isso é útil apenas para:
- Testar a interface
- Ver o fluxo de autorização
- Desenvolver outras funcionalidades

---

## 📋 Status das Integrações

| Plataforma | Status | Documentação |
|------------|--------|--------------|
| **Meta Ads** (Facebook + Instagram) | ⚠️ Precisa Config | OAUTH_SETUP.md §1 |
| **Google Ads** | ⚠️ Precisa Config | OAUTH_SETUP.md §2 |
| **LinkedIn Ads** | ⚠️ Precisa Config | OAUTH_SETUP.md §3 |
| **Twitter Ads** | ⚠️ Precisa Config | OAUTH_SETUP.md §4 |
| **TikTok Ads** | ⚠️ Precisa Config | OAUTH_SETUP.md §5 |

---

## 🎯 Próximos Passos

### Para Desenvolvimento
1. ✅ Use IDs de teste (Opção 2 acima)
2. ✅ Desenvolva e teste outras funcionalidades
3. ✅ Configure OAuth real quando necessário

### Para Produção
1. ✅ Siga o guia `OAUTH_SETUP.md`
2. ✅ Configure cada plataforma (15-30 min cada)
3. ✅ Adicione Client IDs reais no `.env`
4. ✅ Teste cada integração
5. ✅ Deploy em produção

---

## 💡 Entendendo OAuth

### Por que preciso de Client IDs?

OAuth é um protocolo de autorização que permite que aplicações acessem dados de outras plataformas de forma segura, sem compartilhar senhas.

**Fluxo:**
```
1. Usuário: "Conecte Facebook Ads"
2. SyncAds: Gera link de autorização (precisa Client ID)
3. Facebook: Usuário autoriza acesso
4. Facebook: Retorna código de autorização
5. SyncAds: Troca código por token de acesso
6. SyncAds: Usa token para acessar campanhas
```

### Por que não vem configurado?

Por segurança! Cada instalação do SyncAds deve ter suas próprias credenciais OAuth:

- ✅ Você controla quais permissões dar
- ✅ Você gerencia os limites de API
- ✅ Você mantém os dados seguros
- ✅ Você pode revogar acesso a qualquer momento

---

## ❓ FAQ

### "Preciso configurar TODAS as plataformas?"

**Não!** Configure apenas as que você vai usar.

Por exemplo, se só usa Facebook Ads:
- Configure apenas `VITE_META_CLIENT_ID`
- Deixe as outras como estão

### "Quanto custa configurar OAuth?"

**É grátis!** Todas as plataformas oferecem APIs gratuitas para desenvolvedores.

Mas atenção:
- Algumas têm limites de requisições
- Algumas precisam de aprovação (pode levar dias)
- Algumas exigem verificação de negócio

### "Posso usar sem OAuth?"

**Sim, mas com limitações.**

Você pode usar o SyncAds sem integrações:
- ✅ Criar campanhas manualmente
- ✅ Chat com IA
- ✅ Dashboard e analytics
- ❌ Não consegue sincronizar dados reais
- ❌ Não consegue gerenciar campanhas de verdade

### "E se eu quiser testar agora?"

Use a **Opção 2** (IDs de teste) acima. Você pode:
- Testar a interface
- Ver o fluxo completo
- Desenvolver funcionalidades
- Configurar OAuth real depois

---

## 🔐 Segurança

### ⚠️ NUNCA FAÇA:
- ❌ Compartilhar Client Secrets publicamente
- ❌ Commitar `.env` no Git
- ❌ Usar mesmas credenciais em dev e prod
- ❌ Logar tokens no console (produção)

### ✅ SEMPRE FAÇA:
- ✅ Mantenha `.env` no `.gitignore`
- ✅ Use variáveis de ambiente
- ✅ Rotacione secrets regularmente
- ✅ Use HTTPS em produção
- ✅ Implemente rate limiting

---

## 📚 Recursos

### Guias
- **OAUTH_SETUP.md** - Configuração passo a passo completa
- **CORRECOES_SEGURANCA.md** - Correções de segurança aplicadas
- **CONFIGURACAO_MANUAL_AUTH.md** - Configuração do Supabase Auth

### Links Úteis
- [Meta for Developers](https://developers.facebook.com)
- [Google Cloud Console](https://console.cloud.google.com)
- [LinkedIn Developers](https://www.linkedin.com/developers)
- [Twitter Developer Portal](https://developer.twitter.com)
- [TikTok for Business](https://ads.tiktok.com/marketing_api)

---

## ✅ Checklist

Antes de considerar pronto:

### Desenvolvimento
- [ ] IDs de teste configurados no `.env`
- [ ] Servidor reiniciado
- [ ] Testado no chat
- [ ] Fluxo funciona

### Produção
- [ ] OAuth configurado em cada plataforma
- [ ] Client IDs reais no `.env`
- [ ] Callbacks URLs configuradas
- [ ] Permissões aprovadas
- [ ] Testado com dados reais
- [ ] Deploy realizado

---

**Dúvidas?** Abra uma issue no GitHub ou consulte a documentação.

**Desenvolvido com 🔗 - SyncAds Integration Team**
