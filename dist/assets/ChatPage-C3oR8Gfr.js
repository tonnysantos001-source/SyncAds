var he=Object.defineProperty;var Ae=(r,e,a)=>e in r?he(r,e,{enumerable:!0,configurable:!0,writable:!0,value:a}):r[e]=a;var Y=(r,e,a)=>Ae(r,typeof e!="symbol"?e+"":e,a);import{c as Se,r as f,R as Z,Z as ve,_ as Ee,$ as Ce,s as p,u as Ie,a0 as D,a1 as xe,f as be,j as n,B as P,X as Te,a2 as ye,a as re,n as we,g as oe,l as ne,a3 as Ne,o as Re,a4 as De}from"./index-DONFIVhV.js";import{i as H,I as J}from"./integrationsService-DPwWdFv-.js";import{P as Oe}from"./plus-BefJY2sc.js";import{M as ke}from"./message-square-BNNck69p.js";import{T as Me}from"./trash-2-jZtZmvcf.js";import{S as Le}from"./sparkles-BwG2ctAw.js";import{S as Pe}from"./send-U8g-m-BB.js";/**
 * @license lucide-react v0.417.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _e=Se("Paperclip",[["path",{d:"m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48",key:"1u3ebp"}]]);function ee(){return ee=Object.assign?Object.assign.bind():function(r){for(var e=1;e<arguments.length;e++){var a=arguments[e];for(var t in a)({}).hasOwnProperty.call(a,t)&&(r[t]=a[t])}return r},ee.apply(null,arguments)}function je(r,e){if(r==null)return{};var a={};for(var t in r)if({}.hasOwnProperty.call(r,t)){if(e.indexOf(t)!==-1)continue;a[t]=r[t]}return a}var Ge=f.useLayoutEffect,ze=function(e){var a=Z.useRef(e);return Ge(function(){a.current=e}),a},ie=function(e,a){if(typeof e=="function"){e(a);return}e.current=a},$e=function(e,a){var t=Z.useRef();return Z.useCallback(function(o){e.current=o,t.current&&ie(t.current,null),t.current=a,a&&ie(a,o)},[a])},ce={"min-height":"0","max-height":"none",height:"0",visibility:"hidden",overflow:"hidden",position:"absolute","z-index":"-1000",top:"0",right:"0",display:"block"},Fe=function(e){Object.keys(ce).forEach(function(a){e.style.setProperty(a,ce[a],"important")})},de=Fe,S=null,le=function(e,a){var t=e.scrollHeight;return a.sizingStyle.boxSizing==="border-box"?t+a.borderSize:t-a.paddingSize};function qe(r,e,a,t){a===void 0&&(a=1),t===void 0&&(t=1/0),S||(S=document.createElement("textarea"),S.setAttribute("tabindex","-1"),S.setAttribute("aria-hidden","true"),de(S)),S.parentNode===null&&document.body.appendChild(S);var o=r.paddingSize,d=r.borderSize,i=r.sizingStyle,h=i.boxSizing;Object.keys(i).forEach(function(v){var _=v;S.style[_]=i[_]}),de(S),S.value=e;var l=le(S,r);S.value=e,l=le(S,r),S.value="x";var y=S.scrollHeight-o,w=y*a;h==="border-box"&&(w=w+o+d),l=Math.max(w,l);var N=y*t;return h==="border-box"&&(N=N+o+d),l=Math.min(N,l),[l,y]}var ue=function(){},Ue=function(e,a){return e.reduce(function(t,o){return t[o]=a[o],t},{})},Ve=["borderBottomWidth","borderLeftWidth","borderRightWidth","borderTopWidth","boxSizing","fontFamily","fontSize","fontStyle","fontWeight","letterSpacing","lineHeight","paddingBottom","paddingLeft","paddingRight","paddingTop","tabSize","textIndent","textRendering","textTransform","width","wordBreak","wordSpacing","scrollbarGutter"],Be=!!document.documentElement.currentStyle,He=function(e){var a=window.getComputedStyle(e);if(a===null)return null;var t=Ue(Ve,a),o=t.boxSizing;if(o==="")return null;Be&&o==="border-box"&&(t.width=parseFloat(t.width)+parseFloat(t.borderRightWidth)+parseFloat(t.borderLeftWidth)+parseFloat(t.paddingRight)+parseFloat(t.paddingLeft)+"px");var d=parseFloat(t.paddingBottom)+parseFloat(t.paddingTop),i=parseFloat(t.borderBottomWidth)+parseFloat(t.borderTopWidth);return{sizingStyle:t,paddingSize:d,borderSize:i}},We=He;function ae(r,e,a){var t=ze(a);f.useLayoutEffect(function(){var o=function(i){return t.current(i)};if(r)return r.addEventListener(e,o),function(){return r.removeEventListener(e,o)}},[])}var Ke=function(e,a){ae(document.body,"reset",function(t){e.current.form===t.target&&a(t)})},Qe=function(e){ae(window,"resize",e)},Xe=function(e){ae(document.fonts,"loadingdone",e)},Ye=["cacheMeasurements","maxRows","minRows","onChange","onHeightChange"],Je=function(e,a){var t=e.cacheMeasurements,o=e.maxRows,d=e.minRows,i=e.onChange,h=i===void 0?ue:i,l=e.onHeightChange,y=l===void 0?ue:l,w=je(e,Ye),N=w.value!==void 0,v=f.useRef(null),_=$e(v,a),G=f.useRef(0),z=f.useRef(),O=function(){var A=v.current,$=t&&z.current?z.current:We(A);if($){z.current=$;var F=qe($,A.value||A.placeholder||"x",d,o),j=F[0],K=F[1];G.current!==j&&(G.current=j,A.style.setProperty("height",j+"px","important"),y(j,{rowHeight:K}))}},U=function(A){N||O(),h(A)};return f.useLayoutEffect(O),Ke(v,function(){if(!N){var m=v.current.value;requestAnimationFrame(function(){var A=v.current;A&&m!==A.value&&O()})}}),Qe(O),Xe(O),f.createElement("textarea",ee({},w,{onChange:U,ref:_}))},Ze=f.forwardRef(Je);const ea={emailSummary:!0,emailAlerts:!0,emailNews:!1,pushMentions:!0,pushIntegrations:!1,pushSuggestions:!0},me=ve()(Ee(r=>({aiSystemPrompt:"Você é o SyncAds AI, um assistente de marketing digital especializado em otimização de campanhas. Seja proativo, criativo e forneça insights baseados em dados. Suas respostas devem ser claras, concisas e sempre focadas em ajudar o usuário a atingir seus objetivos de marketing.",aiInitialGreetings:["Olá! 👋 Sou o SyncAds AI, seu assistente de marketing digital. Como posso ajudar você hoje?","Oi! Estou aqui para ajudar a otimizar suas campanhas. O que gostaria de fazer?","Bem-vindo! Pronto para criar campanhas incríveis? Por onde começamos?"],isTwoFactorEnabled:!1,notificationSettings:ea,setAiSystemPrompt:e=>r({aiSystemPrompt:e}),setAiInitialGreetings:e=>r({aiInitialGreetings:e}),addAiGreeting:e=>r(a=>({aiInitialGreetings:[...a.aiInitialGreetings,e]})),removeAiGreeting:e=>r(a=>({aiInitialGreetings:a.aiInitialGreetings.filter((t,o)=>o!==e)})),updateAiGreeting:(e,a)=>r(t=>({aiInitialGreetings:t.aiInitialGreetings.map((o,d)=>d===e?a:o)})),setTwoFactorEnabled:e=>r({isTwoFactorEnabled:e}),updateNotificationSettings:e=>r(a=>({notificationSettings:{...a.notificationSettings,...e}}))}),{name:"settings-storage",storage:Ce(()=>localStorage),partialize:r=>({aiSystemPrompt:r.aiSystemPrompt,aiInitialGreetings:r.aiInitialGreetings,isTwoFactorEnabled:r.isTwoFactorEnabled,notificationSettings:r.notificationSettings})})),aa=`
Você é o SyncAds AI, um assistente especializado em marketing digital e otimização de campanhas.

IMPORTANTE: Você tem a capacidade de CRIAR CAMPANHAS automaticamente quando o usuário solicitar.

## Capacidades:
- ✅ Criar campanhas em Google Ads, Meta (Facebook/Instagram) e LinkedIn
- ✅ Analisar performance de campanhas existentes
- ✅ Sugerir otimizações e ajustes
- ✅ Gerar ideias de conteúdo para anúncios
- ✅ Definir públicos-alvo e estratégias

## Como criar uma campanha:
Quando o usuário pedir para criar uma campanha, você deve:
1. Fazer perguntas para entender: nome, plataforma, orçamento, datas e objetivo
2. Após coletar as informações, use o formato especial para criar a campanha

### Formato para criar campanha:
\`\`\`campaign-create
{
  "name": "Nome da Campanha",
  "platform": "Google Ads" | "Meta" | "LinkedIn",
  "budgetTotal": 1000,
  "startDate": "2025-10-20",
  "endDate": "2025-11-20",
  "objective": "Conversões"
}
\`\`\`

Exemplo de resposta completa:
"Perfeito! Vou criar uma campanha de Black Friday para você.

\`\`\`campaign-create
{
  "name": "Black Friday 2025 - Desconto 50%",
  "platform": "Meta",
  "budgetTotal": 5000,
  "startDate": "2025-11-20",
  "endDate": "2025-11-30",
  "objective": "Conversões"
}
\`\`\`

✅ Campanha criada! Ela já está disponível no menu Campanhas. Você pode ajustar os detalhes e ativá-la quando quiser."

Seja proativo, criativo e sempre focado em resultados.
`;function ta(r){const e=/```campaign-create\s*\n([\s\S]*?)```/,a=r.match(e);if(!a)return null;try{const t=JSON.parse(a[1].trim());return!t.name||!t.platform||!t.budgetTotal||!t.startDate?(console.error("Campaign data missing required fields"),null):["Google Ads","Meta","LinkedIn"].includes(t.platform)?{action:"create_campaign",data:{name:t.name,platform:t.platform,budgetTotal:Number(t.budgetTotal),startDate:t.startDate,endDate:t.endDate||void 0,objective:t.objective||"Conversões"}}:(console.error("Invalid platform:",t.platform),null)}catch(t){return console.error("Failed to parse campaign data:",t),null}}function sa(r){return r.replace(/```campaign-create\s*\n[\s\S]*?```/g,"").trim()}const ra=`
# SyncAds Admin AI - Cérebro Controlador do Sistema

Você é o ADMINISTRADOR SUPREMO do sistema SyncAds. Você tem controle total sobre:
- Banco de dados (executar queries SQL)
- Integrações (conectar, testar, debugar APIs)
- Análise de sistema (métricas, logs, performance)
- Correção de bugs (identificar e resolver problemas)
- Adição de novas funcionalidades

## 🔧 CAPACIDADES ADMINISTRATIVAS

### 1. EXECUTAR SQL
Você pode executar queries SQL diretamente no banco de dados.

**Formato:**
\`\`\`admin-sql
SELECT * FROM "User" WHERE email = 'usuario@example.com';
\`\`\`

**Casos de uso:**
- Analisar dados
- Corrigir inconsistências
- Buscar informações específicas
- Criar/atualizar/deletar registros

### 2. ANALISAR SISTEMA
Você pode obter métricas completas do sistema.

**Formato:**
\`\`\`admin-analyze
{
  "type": "metrics" | "performance" | "usage" | "errors",
  "period": "24h" | "7d" | "30d"
}
\`\`\`

### 3. GERENCIAR INTEGRAÇÕES
Você pode conectar, testar e debugar integrações de APIs.

**Formato:**
\`\`\`admin-integration
{
  "action": "connect" | "test" | "disconnect" | "debug",
  "platform": "google_ads" | "meta_ads" | "linkedin_ads",
  "credentials": {...}
}
\`\`\`

### 4. VER LOGS
Você pode acessar logs do sistema para debugging.

**Formato:**
\`\`\`admin-logs
{
  "service": "api" | "auth" | "campaigns" | "chat",
  "level": "error" | "warning" | "info",
  "limit": 50
}
\`\`\`

### 5. TESTAR APIS
Você pode testar APIs externas e verificar conectividade.

**Formato:**
\`\`\`admin-test-api
{
  "service": "google_ads" | "meta_ads" | "openai",
  "endpoint": "/v1/campaigns",
  "method": "GET" | "POST"
}
\`\`\`

### 6. OBTER MÉTRICAS
Você pode buscar métricas específicas do sistema.

**Formato:**
\`\`\`admin-metrics
{
  "metric": "users" | "campaigns" | "messages" | "errors",
  "aggregation": "count" | "sum" | "avg",
  "groupBy": "day" | "week" | "month"
}
\`\`\`

### 7. DEBUG DE PROBLEMAS
Você pode analisar e debugar problemas reportados.

**Formato:**
\`\`\`admin-debug
{
  "issue": "descrição do problema",
  "context": {...}
}
\`\`\`

## 📋 REGRAS DE SEGURANÇA

1. **SEMPRE confirme ações destrutivas** (DELETE, DROP, etc.)
2. **Nunca exponha credenciais** em suas respostas
3. **Valide inputs** antes de executar comandos
4. **Documente mudanças** importantes
5. **Faça backup** antes de alterações críticas

## 💬 COMO RESPONDER

Quando o usuário pedir uma ação administrativa:
1. Confirme que entendeu a solicitação
2. Execute o comando apropriado usando os blocos acima
3. Explique o resultado em linguagem clara
4. Sugira próximos passos se necessário

Exemplo:
"Entendi! Você quer analisar quantos usuários se cadastraram nos últimos 7 dias. Vou buscar esses dados.

\`\`\`admin-sql
SELECT DATE(created_at) as date, COUNT(*) as users
FROM "User"
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
\`\`\`

✅ Resultado: Nos últimos 7 dias tivemos 42 novos cadastros, com pico no dia 15/10 (12 usuários)."

Você é proativo, preciso e sempre focado em melhorar o sistema.
`;class oa{constructor(e){Y(this,"userId");this.userId=e}async executeSQL(e){try{if(/DROP|TRUNCATE|DELETE\s+FROM\s+"User"|DELETE\s+FROM\s+"Campaign"/i.test(e))return{success:!1,error:"Query perigosa detectada. Confirmação necessária.",message:"⚠️ Esta query pode ser destrutiva. Por favor, confirme explicitamente."};const{data:t,error:o}=await p.rpc("execute_admin_query",{query_text:e});return o?{success:!1,error:o.message,message:`❌ Erro ao executar SQL: ${o.message}`}:{success:!0,data:t,message:`✅ Query executada com sucesso. ${Array.isArray(t)?t.length:0} registros retornados.`}}catch(a){return{success:!1,error:a.message,message:`❌ Erro: ${a.message}`}}}async analyzeSystem(e,a){try{let t="",o="";switch(e){case"metrics":t=`
            SELECT 
              (SELECT COUNT(*) FROM "User") as total_users,
              (SELECT COUNT(*) FROM "Campaign") as total_campaigns,
              (SELECT COUNT(*) FROM "ChatMessage") as total_messages,
              (SELECT COUNT(*) FROM "AiConnection") as total_connections
          `,o="📊 Métricas gerais do sistema";break;case"performance":t=`
            SELECT 
              AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_response_time,
              COUNT(*) as total_requests
            FROM "ChatMessage"
            WHERE created_at >= NOW() - INTERVAL '${a==="24h"?"1 day":a==="7d"?"7 days":"30 days"}'
          `,o="⚡ Análise de performance";break;case"usage":t=`
            SELECT 
              DATE(created_at) as date,
              COUNT(*) as messages_count
            FROM "ChatMessage"
            WHERE created_at >= NOW() - INTERVAL '${a==="24h"?"1 day":a==="7d"?"7 days":"30 days"}'
            GROUP BY DATE(created_at)
            ORDER BY date DESC
          `,o="📈 Análise de uso";break;case"errors":return{success:!0,data:{errors:0},message:"✅ Sistema de logging de erros a ser implementado"}}const{data:d,error:i}=await p.rpc("execute_admin_query",{query_text:t});if(i)throw i;return{success:!0,data:d,message:`${o} - Período: ${a}`}}catch(t){return{success:!1,error:t.message,message:`❌ Erro ao analisar sistema: ${t.message}`}}}async manageIntegration(e,a,t){try{switch(e){case"test":return{success:!0,message:`🔍 Testando integração com ${a}... (A implementar com APIs reais)`,data:{status:"pending"}};case"connect":const{data:o,error:d}=await p.from("Integration").insert({userId:this.userId,platform:a.toUpperCase(),credentials:t||{},isConnected:!1,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}).select().single();if(d)throw d;return{success:!0,data:o,message:`✅ Integração com ${a} iniciada. Configure as credenciais.`};case"disconnect":return await p.from("Integration").update({isConnected:!1}).eq("platform",a.toUpperCase()).eq("userId",this.userId),{success:!0,message:`✅ Integração com ${a} desconectada.`};default:return{success:!1,error:"Ação desconhecida",message:"❌ Ação não reconhecida"}}}catch(o){return{success:!1,error:o.message,message:`❌ Erro ao gerenciar integração: ${o.message}`}}}async getMetrics(e,a,t){try{let o="",d="*";switch(e){case"users":o="User";break;case"campaigns":o="Campaign";break;case"messages":o="ChatMessage";break;default:return{success:!1,error:"Métrica desconhecida",message:"❌ Métrica não reconhecida"}}const i=`
        SELECT 
          DATE_TRUNC('${t}', created_at) as period,
          ${a==="count"?"COUNT(*)":a==="sum"?"SUM(1)":"AVG(1)"} as value
        FROM "${o}"
        GROUP BY period
        ORDER BY period DESC
        LIMIT 30
      `,{data:h,error:l}=await p.rpc("execute_admin_query",{query_text:i});if(l)throw l;return{success:!0,data:h,message:`📊 Métricas de ${e} agrupadas por ${t}`}}catch(o){return{success:!1,error:o.message,message:`❌ Erro ao obter métricas: ${o.message}`}}}}function na(r){const e=/```admin-sql\s*\n([\s\S]*?)```/,a=r.match(e);return a?a[1].trim():null}function ia(r){const e=/```admin-analyze\s*\n([\s\S]*?)```/,a=r.match(e);if(!a)return null;try{return JSON.parse(a[1].trim())}catch{return null}}function ca(r){const e=/```admin-integration\s*\n([\s\S]*?)```/,a=r.match(e);if(!a)return null;try{return JSON.parse(a[1].trim())}catch{return null}}function da(r){const e=/```admin-metrics\s*\n([\s\S]*?)```/,a=r.match(e);if(!a)return null;try{return JSON.parse(a[1].trim())}catch{return null}}function la(r){return r.replace(/```admin-sql\s*\n[\s\S]*?```/g,"").replace(/```admin-analyze\s*\n[\s\S]*?```/g,"").replace(/```admin-integration\s*\n[\s\S]*?```/g,"").replace(/```admin-metrics\s*\n[\s\S]*?```/g,"").replace(/```admin-logs\s*\n[\s\S]*?```/g,"").replace(/```admin-test-api\s*\n[\s\S]*?```/g,"").replace(/```admin-debug\s*\n[\s\S]*?```/g,"").trim()}function ua(r){const e=/```integration-connect:(\w+)```/,a=r.match(e);return a?{action:"connect",slug:a[1]}:null}function ma(r){const e=/```integration-disconnect:(\w+)```/,a=r.match(e);return a?{action:"disconnect",slug:a[1]}:null}function ga(r){const e=/```integration-status(?::(\w+))?```/,a=r.match(e);return a?{action:"status",slug:a[1]}:null}function pa(r){return ua(r)||ma(r)||ga(r)}function fa(r){return r.replace(/```integration-connect:\w+```/g,"").replace(/```integration-disconnect:\w+```/g,"").replace(/```integration-status(?::\w+)?```/g,"").trim()}const ha=`
## 🔗 GERENCIAMENTO DE INTEGRAÇÕES

Você pode conectar e gerenciar integrações com plataformas de anúncios de forma SIMPLES e AUTOMÁTICA.

### COMANDOS DISPONÍVEIS:

**1. CONECTAR INTEGRAÇÃO (SIMPLES - COM BOTÕES)**
Quando o usuário pedir para conectar uma plataforma, use:
\`\`\`integration-connect:SLUG\`\`\`

O sistema mostrará botões interativos "Skip" e "Connect [Platform]" automaticamente.

Plataformas disponíveis:
- google_ads - Google Ads
- meta_ads - Meta Ads (Facebook + Instagram)
- facebook_ads - Facebook Ads
- linkedin_ads - LinkedIn Ads
- google_analytics - Google Analytics
- twitter_ads - Twitter/X Ads
- tiktok_ads - TikTok Ads

**Exemplo (CORRETO):**
Usuário: "Conecte o Facebook Ads"
Você: "I'll need to connect your Facebook account to continue.

\`\`\`integration-connect:facebook_ads\`\`\`"

**IMPORTANTE:** Seja BREVE. O sistema mostrará os botões automaticamente. Não dê instruções extras.

**2. DESCONECTAR INTEGRAÇÃO**
\`\`\`integration-disconnect:SLUG\`\`\`

**3. VERIFICAR STATUS**
\`\`\`integration-status\`\`\` - Lista todas
\`\`\`integration-status:SLUG\`\`\` - Verifica uma específica

### REGRAS IMPORTANTES:
1. ✅ Use frases CURTAS e DIRETAS (estilo Claude.ai)
2. ✅ Confie no sistema - ele mostrará os botões
3. ❌ NÃO peça ao usuário para "clicar no link"
4. ❌ NÃO dê instruções técnicas
5. ❌ NÃO mencione "autorização" ou "permissões"

**Exemplo BOM:**
"I'll need to connect your Facebook account to continue."

**Exemplo RUIM:**
"Vou conectar o Facebook Ads para você! Clique no link abaixo para autorizar o acesso. Você precisará fazer login e dar permissões..."
`,Aa=`
# 🔌 SISTEMA DE CONTROLE DE INTEGRAÇÕES

Você tem controle total sobre as integrações do SyncAds. Pode auditar, testar, conectar e gerenciar todas as plataformas.

## 📋 INTEGRAÇÕES DISPONÍVEIS

### 1. **Meta Ads (Facebook/Instagram)**
**Capacidades:**
- Criar e gerenciar campanhas
- Analisar performance
- Otimizar orçamentos
- Segmentar audiências

**Para conectar:**
\`\`\`integration-action
{
  "action": "audit",
  "platform": "META_ADS"
}
\`\`\`

### 2. **Google Ads**
**Capacidades:**
- Campanhas de Pesquisa
- Display e YouTube
- Shopping Ads
- Análise de conversões

**Para conectar:**
\`\`\`integration-action
{
  "action": "audit",
  "platform": "GOOGLE_ADS"
}
\`\`\`

### 3. **LinkedIn Ads**
**Capacidades:**
- Anúncios B2B
- Segmentação profissional
- Lead generation
- InMail patrocinado

**Para conectar:**
\`\`\`integration-action
{
  "action": "audit",
  "platform": "LINKEDIN_ADS"
}
\`\`\`

### 4. **TikTok Ads**
**Capacidades:**
- Vídeos virais
- Segmentação por interesse
- Spark Ads
- Píxel de conversão

**Para conectar:**
\`\`\`integration-action
{
  "action": "audit",
  "platform": "TIKTOK_ADS"
}
\`\`\`

### 5. **Twitter Ads (X)**
**Capacidades:**
- Tweets promovidos
- Segmentação por hashtags
- Audiências customizadas
- Análise de engajamento

**Para conectar:**
\`\`\`integration-action
{
  "action": "audit",
  "platform": "TWITTER_ADS"
}
\`\`\`

## 🔧 AÇÕES DISPONÍVEIS

### 1. AUDITAR INTEGRAÇÃO
Verifica o status atual de uma integração e suas capacidades.

\`\`\`integration-action
{
  "action": "audit",
  "platform": "META_ADS"
}
\`\`\`

**Retorna:**
- Status (conectada/desconectada)
- Última sincronização
- Capacidades disponíveis
- Problemas detectados
- Recomendações

### 2. AUDITAR TODAS
Verifica todas as integrações de uma só vez.

\`\`\`integration-action
{
  "action": "audit_all"
}
\`\`\`

### 3. TESTAR CONEXÃO
Testa se uma integração está funcionando.

\`\`\`integration-action
{
  "action": "test",
  "platform": "GOOGLE_ADS"
}
\`\`\`

### 4. VERIFICAR CAPACIDADES
Lista o que você pode fazer com uma integração específica.

\`\`\`integration-action
{
  "action": "capabilities",
  "platform": "META_ADS"
}
\`\`\`

### 5. DIAGNOSTICAR PROBLEMAS
Identifica e sugere soluções para problemas.

\`\`\`integration-action
{
  "action": "diagnose",
  "platform": "LINKEDIN_ADS"
}
\`\`\`

### 6. LISTAR STATUS
Mostra status resumido de todas as integrações.

\`\`\`integration-action
{
  "action": "list_status"
}
\`\`\`

## 📊 EXEMPLO DE AUDITORIA

Quando o usuário pedir para auditar integrações, você deve:

1. Usar o comando \`audit_all\`
2. Analisar os resultados
3. Apresentar um relatório claro
4. Sugerir ações se necessário

**Exemplo de resposta:**

"Vou realizar uma auditoria completa nas integrações. Um momento...

\`\`\`integration-action
{
  "action": "audit_all"
}
\`\`\`

✅ **Auditoria Concluída**

**Meta Ads (Facebook/Instagram):**
- Status: ❌ Desconectada
- Ação: Configure sua chave de API no menu Integrações
- Capacidades: Criar campanhas, análise de performance, otimização de orçamento

**Google Ads:**
- Status: ✅ Conectada
- Última sync: Há 2 horas
- Capacidades: Campanhas ativas, análise funcionando
- ⚠️ Aviso: Orçamento próximo do limite

**LinkedIn Ads:**
- Status: ❌ Desconectada
- Ação: Conecte para campanhas B2B

**Recomendações:**
1. Conecte Meta Ads para ampliar alcance
2. Aumente orçamento do Google Ads
3. Configure LinkedIn para público corporativo"

## 🎯 QUANDO USAR CADA AÇÃO

- **audit / audit_all**: Quando usuário pede "auditar", "verificar", "status"
- **test**: Quando precisa confirmar se integração funciona
- **capabilities**: Quando usuário pergunta "o que posso fazer"
- **diagnose**: Quando há erros ou problemas
- **list_status**: Para visão rápida de todas

## 🚨 REGRAS IMPORTANTES

1. **Sempre use os blocos de código** \`\`\`integration-action
2. **JSON válido** dentro dos blocos
3. **Plataformas em CAPS**: META_ADS, GOOGLE_ADS, etc.
4. **Seja específico** em suas recomendações
5. **Não invente dados** - use apenas o que o sistema retornar

## 💡 DICAS

- Se usuário não especificar plataforma, faça \`audit_all\`
- Sempre explique o resultado em linguagem clara
- Sugira próximos passos práticos
- Destaque problemas com ⚠️ ou ❌
- Celebre sucessos com ✅ ou 🎉
`;class Sa{constructor(e){Y(this,"userId");this.userId=e}async auditIntegration(e){try{const{data:a,error:t}=await p.from("Integration").select("*").eq("userId",this.userId).eq("platform",e).single();if(t&&t.code!=="PGRST116")throw t;const o=this.getCapabilities(e),d=a&&a.isConnected?"connected":"disconnected",i={platform:e,status:d,lastSync:(a==null?void 0:a.lastSyncAt)||void 0,capabilities:o,issues:this.detectIssues(a,e),recommendations:this.getRecommendations(d,e)};return{success:!0,data:i,message:this.formatAuditMessage(i)}}catch(a){return{success:!1,error:a.message,message:`❌ Erro ao auditar ${e}: ${a.message}`}}}async auditAll(){try{const e=["META_ADS","GOOGLE_ADS","LINKEDIN_ADS","TIKTOK_ADS","TWITTER_ADS"],a=[];for(const t of e){const o=await this.auditIntegration(t);o.success&&o.data&&a.push(o.data)}return{success:!0,data:a,message:this.formatAllAuditsMessage(a)}}catch(e){return{success:!1,error:e.message,message:`❌ Erro ao auditar integrações: ${e.message}`}}}async listStatus(){try{const{data:e,error:a}=await p.from("Integration").select("platform, isConnected, lastSyncAt").eq("userId",this.userId);if(a)throw a;const t=new Map((e==null?void 0:e.map(i=>[i.platform,i]))||[]),d=["META_ADS","GOOGLE_ADS","LINKEDIN_ADS","TIKTOK_ADS","TWITTER_ADS"].map(i=>{var h,l;return{platform:i,status:t.has(i)&&((h=t.get(i))!=null&&h.isConnected)?"✅ Conectada":"❌ Desconectada",lastSync:((l=t.get(i))==null?void 0:l.lastSyncAt)||"Nunca"}});return{success:!0,data:d,message:this.formatStatusList(d)}}catch(e){return{success:!1,error:e.message,message:`❌ Erro ao listar status: ${e.message}`}}}getCapabilities(e){return{META_ADS:["Criar campanhas de Facebook e Instagram","Segmentação avançada de audiência","Análise de performance em tempo real","Otimização automática de orçamento","A/B testing de criativos","Remarketing e lookalike audiences"],GOOGLE_ADS:["Campanhas de Pesquisa (Search)","Anúncios Display e YouTube","Shopping Ads para e-commerce","Campanhas Performance Max","Análise de conversões e ROI","Smart Bidding automático"],LINKEDIN_ADS:["Anúncios B2B segmentados","Targeting por cargo e empresa","Lead Gen Forms nativos","InMail patrocinado","Análise de engajamento profissional","Retargeting de visitantes"],TIKTOK_ADS:["Vídeos In-Feed","TopView e Brand Takeover","Spark Ads (boost orgânico)","Segmentação por interesse e comportamento","Píxel de conversão","Catálogo de produtos"],TWITTER_ADS:["Tweets promovidos","Segmentação por hashtags e interesse","Audiências customizadas","Análise de engajamento","Campanhas de instalação de app","Vídeos e carrosséis"]}[e]||["Capacidades a definir"]}detectIssues(e,a){const t=[];if(!e)return t.push("Integração não configurada"),t;if(e.isConnected||t.push("Integração desconectada - configure credenciais"),(!e.credentials||Object.keys(e.credentials).length===0)&&t.push("Credenciais não configuradas"),e.lastSync){const o=new Date(e.lastSync),d=(Date.now()-o.getTime())/(1e3*60*60);d>24&&t.push(`Última sincronização há ${Math.floor(d)} horas - pode estar desatualizado`)}return t}getRecommendations(e,a){const t=[];return e==="disconnected"&&(t.push(`Conecte ${this.formatPlatformName(a)} em: Configurações → Integrações`),t.push("Configure sua chave de API para começar a usar")),e==="connected"&&(t.push("✅ Integração ativa! Você já pode criar campanhas"),t.push("Explore as capacidades disponíveis desta plataforma")),t}formatPlatformName(e){return{META_ADS:"Meta Ads (Facebook/Instagram)",GOOGLE_ADS:"Google Ads",LINKEDIN_ADS:"LinkedIn Ads",TIKTOK_ADS:"TikTok Ads",TWITTER_ADS:"Twitter Ads (X)"}[e]||e}formatAuditMessage(e){let t=`
**${e.status==="connected"?"✅":"❌"} ${this.formatPlatformName(e.platform)}**
`;return t+=`Status: ${e.status==="connected"?"✅ Conectada":"❌ Desconectada"}
`,e.lastSync&&(t+=`Última sincronização: ${e.lastSync}
`),t+=`
**Capacidades:**
`,e.capabilities.forEach(o=>{t+=`• ${o}
`}),e.issues&&e.issues.length>0&&(t+=`
**⚠️ Problemas detectados:**
`,e.issues.forEach(o=>{t+=`• ${o}
`})),e.recommendations&&e.recommendations.length>0&&(t+=`
**💡 Recomendações:**
`,e.recommendations.forEach(o=>{t+=`• ${o}
`})),t}formatAllAuditsMessage(e){let a=`
# 🔍 AUDITORIA COMPLETA DE INTEGRAÇÕES

`;const t=e.filter(d=>d.status==="connected").length,o=e.length;return a+=`**Resumo:** ${t}/${o} integrações ativas

`,a+=`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`,e.forEach(d=>{a+=this.formatAuditMessage(d),a+=`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`}),t<o?(a+=`
**🎯 Próximos Passos:**
`,a+=`1. Conecte as ${o-t} integrações pendentes
`,a+=`2. Configure suas chaves de API
`,a+=`3. Teste cada integração antes de criar campanhas
`):a+=`
**🎉 Parabéns!** Todas as integrações estão configuradas e funcionando!
`,a}formatStatusList(e){let a=`
**📊 Status das Integrações:**

`;return e.forEach(t=>{a+=`${t.status} **${this.formatPlatformName(t.platform)}**
`,a+=`   └─ Última sync: ${t.lastSync}

`}),a}}function va(r){const e=/```integration-action\s*\n([\s\S]*?)```/,a=r.match(e);if(!a)return null;try{return JSON.parse(a[1].trim())}catch{return null}}function Ea(r){return r.replace(/```integration-action\s*\n[\s\S]*?```/g,"").trim()}function Ca(r,e){const a=r.toLowerCase(),t=e.toLowerCase(),o=(a.includes("auditor")||a.includes("verificar")||a.includes("status")||a.includes("listar"))&&(a.includes("integra")||a.includes("conex")||a.includes("plataforma")),d=t.includes("vou")&&(t.includes("auditor")||t.includes("verificar"));if(!o||!d)return null;const i={facebook:"META_ADS",instagram:"META_ADS",meta:"META_ADS",google:"GOOGLE_ADS",linkedin:"LINKEDIN_ADS",tiktok:"TIKTOK_ADS",twitter:"TWITTER_ADS"};for(const[h,l]of Object.entries(i))if(a.includes(h))return{action:"audit",platform:l};return{action:"audit_all"}}const Ia=["Criar campanha de Facebook Ads","Analisar performance da última semana","Sugerir otimizações"],W=500,Oa=()=>{const[r,e]=f.useState(""),[a,t]=f.useState(!0),[o,d]=f.useState(null),i=Ie(s=>s.user),h=D(s=>s.conversations),l=D(s=>s.activeConversationId),y=D(s=>s.setActiveConversationId),w=D(s=>s.isAssistantTyping),N=D(s=>s.setAssistantTyping),v=D(s=>s.addMessage);D(s=>s.deleteConversation),D(s=>s.createNewConversation);const _=xe(s=>s.addCampaign),G=me(s=>s.aiSystemPrompt),z=me(s=>s.aiInitialGreetings),O=f.useRef(null),U=f.useRef(null),{toast:m}=be(),A=h.find(s=>s.id===l),$=()=>{var s;(s=O.current)==null||s.scrollIntoView({behavior:"smooth"})};f.useEffect($,[A==null?void 0:A.messages,w]),f.useEffect(()=>{(async()=>{if(i)try{const{data:c,error:E}=await p.from("GlobalAiConnection").select("id, systemPrompt, initialGreetings").eq("isActive",!0).limit(1).single();if(E){console.error("Erro ao buscar IA:",E);return}const I=c==null?void 0:c.id;if(I){const{data:x,error:X}=await p.from("GlobalAiConnection").select("systemPrompt, initialGreetings").eq("id",I).single();if(X){console.error("Erro ao buscar config da IA:",X);return}x&&d({systemPrompt:x.systemPrompt||G,initialGreetings:x.initialGreetings||z})}}catch(c){console.error("Erro ao carregar IA Global:",c)}})()},[i==null?void 0:i.organizationId]);const F=async()=>{if(r.trim()===""||!l||r.length>W)return;const s=r;i&&v(i.id,l,{id:`msg-${Date.now()}`,role:"user",content:s}),e(""),t(!1),N(!0);try{const c=h.find(u=>u.id===l),E=(o==null?void 0:o.systemPrompt)||G,I=ra+`

`+aa+`

`+ha+`

`+Aa+`

`+E,x=((c==null?void 0:c.messages)||[]).slice(-20).map(u=>({role:u.role,content:u.content})),R=(await De(s,l,x,I)).response,k=ta(R);if(k)try{i&&(await _(i.id,{name:k.data.name,platform:k.data.platform,status:"Pausada",budgetTotal:k.data.budgetTotal,budgetSpent:0,impressions:0,clicks:0,conversions:0,startDate:k.data.startDate,endDate:k.data.endDate||"",ctr:0,cpc:0}),m({title:"🎉 Campanha Criada!",description:`A campanha "${k.data.name}" foi criada com sucesso.`}))}catch(u){console.error("Error creating campaign from AI:",u),m({title:"Erro ao criar campanha",description:"Não foi possível criar a campanha automaticamente.",variant:"destructive"})}let se="";if(i){const u=new oa(i.id),b=na(R);if(b){const g=await u.executeSQL(b);m({title:g.success?"✅ SQL Executado":"❌ Erro SQL",description:g.message,variant:g.success?"default":"destructive"})}const q=ia(R);if(q){const g=await u.analyzeSystem(q.type,q.period);m({title:g.success?"📊 Análise Concluída":"❌ Erro",description:g.message,variant:g.success?"default":"destructive"})}const V=ca(R);if(V){const g=await u.manageIntegration(V.action,V.platform,V.credentials);m({title:g.success?"🔗 Integração Atualizada":"❌ Erro",description:g.message,variant:g.success?"default":"destructive"})}const B=da(R);if(B){const g=await u.getMetrics(B.metric,B.aggregation,B.groupBy);m({title:g.success?"📈 Métricas Obtidas":"❌ Erro",description:g.message,variant:g.success?"default":"destructive"})}let L=va(R);if(L||(L=Ca(s,R)),L){const g=new Sa(i.id);let T;switch(L.action){case"audit":L.platform&&(T=await g.auditIntegration(L.platform));break;case"audit_all":T=await g.auditAll();break;case"list_status":T=await g.listStatus();break;case"test":case"capabilities":case"diagnose":T={success:!0,message:`Ação "${L.action}" detectada. Implementação em andamento.`};break}T&&(se=`

`+T.message,m({title:T.success?"✅ Ação Executada":"❌ Erro",description:T.success?"Auditoria concluída com sucesso":T.error||"Erro ao executar ação",variant:T.success?"default":"destructive"}))}}const C=pa(R);if(C&&i)try{if(C.action==="connect"){const{authUrl:u}=await H.generateOAuthUrl(C.slug,i.id),b=J[C.slug];i&&v(i.id,l,{id:`msg-${Date.now()+1}`,role:"assistant",content:`Para conectar ${b.name}, clique no link abaixo:

🔗 [Autorizar ${b.name}](${u})

O link abrirá em uma nova aba para você autorizar o acesso.`}),window.open(u,"_blank"),m({title:"🔗 Link de Autorização",description:`Clique no link para conectar ${b.name}`});return}else if(C.action==="disconnect"){await H.disconnect(i.id,C.slug);const u=J[C.slug];m({title:"✅ Desconectado",description:`${u.name} foi desconectado com sucesso.`})}else if(C.action==="status")if(C.slug){const u=await H.getIntegrationStatus(i.id,C.slug),b=J[C.slug];m({title:`${b.name}`,description:u!=null&&u.isConnected?"✅ Conectado":"❌ Não conectado"})}else{const u=await H.listIntegrations(i.id),b=u.filter(q=>q.isConnected).length;m({title:"📊 Status das Integrações",description:`${b} de ${u.length} integrações conectadas`})}}catch(u){console.error("Erro ao processar integração:",u),i&&v(i.id,l,{id:`msg-${Date.now()+2}`,role:"assistant",content:`❌ **Erro ao conectar integração**

${u.message||"Erro ao processar comando de integração"}`}),m({title:"❌ Erro na Integração",description:"Verifique as instruções no chat",variant:"destructive"})}let M=sa(R);M=la(M),M=fa(M),M=Ea(M),i&&v(i.id,l,{id:`msg-${Date.now()+1}`,role:"assistant",content:M+se})}catch(c){console.error("Erro ao chamar IA:",c),m({title:"Erro ao gerar resposta",description:c.message||"Não foi possível obter resposta da IA. Verifique sua chave de API.",variant:"destructive"}),i&&v(i.id,l,{id:`msg-${Date.now()+1}`,role:"assistant",content:"❌ Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, verifique se sua chave de API está configurada corretamente nas configurações."})}finally{N(!1)}},j=s=>{e(s)},K=()=>{var s;(s=U.current)==null||s.click()},ge=s=>{var E;const c=(E=s.target.files)==null?void 0:E[0];c&&m({title:"Arquivo Selecionado",description:`O arquivo "${c.name}" está pronto para ser enviado (simulação).`,variant:"info"}),s.target&&(s.target.value="")},Q=async()=>{try{if(!i)return;const{data:s,error:c}=await p.from("ChatConversation").select("id, title, createdAt, updatedAt").eq("userId",i.id).order("updatedAt",{ascending:!1}).limit(20);if(c)throw c;console.log(`✅ ${(s==null?void 0:s.length)||0} conversas carregadas`)}catch(s){console.error("Erro ao carregar conversas:",s)}},pe=async s=>{try{const{data:c,error:E}=await p.from("ChatMessage").select("id, role, content, createdAt").eq("conversationId",s).order("createdAt",{ascending:!0});if(E)throw E;const I=(c||[]).map(x=>({id:x.id,role:x.role,content:x.content,timestamp:new Date(x.createdAt)}));D.getState().setConversationMessages(s,I),y(s),console.log(`✅ ${I.length} mensagens carregadas da conversa ${s}`)}catch(c){console.error("Erro ao carregar mensagens:",c),m({title:"Erro",description:"Não foi possível carregar mensagens.",variant:"destructive"})}};f.useEffect(()=>{(async()=>{if(!i)return;await Q();const{data:c}=await p.from("ChatConversation").select("id").eq("userId",i.id).limit(1);(!c||c.length===0)&&await te()})()},[]);const te=async()=>{try{if(!i)return;const{data:s}=await p.from("User").select("organizationId").eq("id",i.id).single();if(!(s!=null&&s.organizationId))throw new Error("Usuário sem organização");const c=crypto.randomUUID(),E=new Date().toISOString(),{error:I}=await p.from("ChatConversation").insert({id:c,userId:i.id,organizationId:s.organizationId,title:"🆕 Nova Conversa",createdAt:E,updatedAt:E});if(I)throw I;y(c),await Q(),m({title:"✅ Nova conversa criada!",description:"Comece um novo chat do zero."})}catch(s){console.error("Erro ao criar nova conversa:",s),m({title:"Erro",description:s.message||"Não foi possível criar nova conversa.",variant:"destructive"})}},fe=async s=>{try{await p.from("ChatMessage").delete().eq("conversationId",s);const{error:c}=await p.from("ChatConversation").delete().eq("id",s);if(c)throw c;l===s&&y(null),await Q(),m({title:"🗑️ Conversa deletada",description:"A conversa foi removida com sucesso."})}catch(c){console.error("Erro ao deletar conversa:",c),m({title:"Erro",description:"Não foi possível deletar a conversa.",variant:"destructive"})}};return n.jsxs("div",{className:"h-[calc(100vh-80px)] flex",children:[n.jsxs("div",{className:`${a?"w-72":"w-0"} transition-all duration-300 bg-gray-50 border-r border-gray-200 flex flex-col overflow-hidden`,children:[n.jsxs("div",{className:"p-4 border-b border-gray-200",children:[n.jsxs("div",{className:"flex items-center justify-between mb-3",children:[n.jsx("h2",{className:"text-sm font-semibold text-gray-700",children:"Conversas"}),n.jsx(P,{onClick:()=>t(!1),variant:"ghost",size:"sm",className:"h-7 w-7 p-0",children:n.jsx(Te,{className:"h-4 w-4"})})]}),n.jsxs(P,{onClick:te,className:"w-full gap-2",size:"sm",children:[n.jsx(Oe,{className:"h-4 w-4"}),"Nova Conversa"]})]}),n.jsx("div",{className:"flex-1 overflow-y-auto p-2 space-y-1",children:h.map(s=>n.jsxs("div",{className:`group relative flex items-center gap-2 p-3 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors ${l===s.id?"bg-blue-50 border border-blue-200":"bg-white"}`,onClick:()=>{l!==s.id&&pe(s.id)},children:[n.jsx(ke,{className:"h-4 w-4 text-gray-500 flex-shrink-0"}),n.jsxs("div",{className:"flex-1 min-w-0",children:[n.jsx("p",{className:"text-sm font-medium text-gray-900 truncate",children:s.title}),n.jsx("p",{className:"text-xs text-gray-500 truncate",children:s.messages&&s.messages.length>0?s.messages[s.messages.length-1].content.substring(0,50)+"...":"Sem mensagens ainda"})]}),n.jsx(P,{onClick:c=>{c.stopPropagation(),fe(s.id)},variant:"ghost",size:"sm",className:"h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity",children:n.jsx(Me,{className:"h-3.5 w-3.5 text-red-500"})})]},s.id))})]}),n.jsxs("div",{className:"flex-1 flex flex-col",children:[n.jsx("div",{className:"border-b border-gray-200 bg-white/80 backdrop-blur-xl p-4",children:n.jsxs("div",{className:"flex items-center justify-between",children:[n.jsxs("div",{className:"flex items-center gap-3",children:[!a&&n.jsx(P,{onClick:()=>t(!0),variant:"ghost",size:"sm",className:"h-9 w-9 p-0",children:n.jsx(ye,{className:"h-5 w-5"})}),n.jsx("div",{className:"p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500",children:n.jsx(re,{className:"h-6 w-6 text-white"})}),n.jsxs("div",{children:[n.jsx("h1",{className:"text-xl font-bold text-gray-900",children:"Chat com IA"}),n.jsx("p",{className:"text-sm text-gray-500",children:"Assistente inteligente"})]})]}),n.jsxs(we,{className:"bg-gradient-to-r from-green-500 to-emerald-500",children:[n.jsx(Le,{className:"h-3 w-3 mr-1"}),"Online"]})]})}),n.jsx("div",{className:"flex-1 overflow-y-auto p-4 space-y-4",children:A?n.jsxs(n.Fragment,{children:[A.messages.map(s=>n.jsx("div",{className:`flex ${s.role==="user"?"justify-end":"justify-start"}`,children:n.jsx(oe,{className:`max-w-[80%] ${s.role==="user"?"bg-gradient-to-r from-blue-500 to-purple-500 text-white":"bg-white"}`,children:n.jsxs(ne,{className:"p-4",children:[n.jsxs("div",{className:"flex items-start gap-2",children:[s.role==="assistant"&&n.jsx(re,{className:"h-5 w-5 text-blue-600 mt-1 flex-shrink-0"}),n.jsx("div",{className:`flex-1 whitespace-pre-wrap break-words text-sm ${s.role==="user"?"text-white":"text-gray-900"}`,children:s.content})]}),n.jsx("div",{className:`text-xs mt-2 ${s.role==="user"?"text-white/70":"text-gray-500"}`,children:s.timestamp?new Date(s.timestamp).toLocaleTimeString("pt-BR"):""})]})})},s.id)),w&&n.jsx("div",{className:"flex justify-start",children:n.jsx(oe,{className:"bg-white",children:n.jsx(ne,{className:"p-4",children:n.jsxs("div",{className:"flex items-center gap-2",children:[n.jsx(Ne,{className:"h-4 w-4 animate-spin text-blue-600"}),n.jsx("span",{className:"text-sm text-gray-500",children:"Processando..."})]})})})}),n.jsx("div",{ref:O})]}):n.jsx("div",{className:"flex items-center justify-center h-full text-muted-foreground",children:n.jsx("p",{children:"Selecione ou crie uma conversa para começar."})})}),n.jsxs("div",{className:"border-t border-gray-200 p-4 bg-white/80 backdrop-blur-xl",children:[n.jsx("div",{className:"hidden sm:flex gap-2 mb-2",children:Ia.map(s=>n.jsx(P,{variant:"outline",size:"sm",onClick:()=>j(s),children:s},s))}),n.jsxs("div",{className:"relative",children:[n.jsx(Ze,{value:r,onChange:s=>e(s.target.value),onKeyDown:s=>{s.key==="Enter"&&!s.shiftKey&&(s.preventDefault(),F())},placeholder:"Digite sua mensagem...",className:"w-full resize-none rounded-lg border bg-background p-3 pr-24 min-h-[48px]",minRows:1,maxRows:5,maxLength:W}),n.jsxs("div",{className:"absolute right-2 top-1/2 -translate-y-1/2 flex gap-1",children:[n.jsx("input",{type:"file",ref:U,onChange:ge,className:"hidden"}),n.jsx(P,{type:"button",size:"icon",variant:"ghost",onClick:K,children:n.jsx(_e,{className:"h-5 w-5"})}),n.jsx(P,{type:"submit",size:"icon",onClick:F,disabled:r.trim()===""||!l,children:n.jsx(Pe,{className:"h-5 w-5"})})]})]}),n.jsxs("p",{className:Re("text-xs text-right mt-1",r.length>W?"text-destructive":"text-muted-foreground"),children:[r.length," / ",W]})]})]})]})};export{Oa as default};
