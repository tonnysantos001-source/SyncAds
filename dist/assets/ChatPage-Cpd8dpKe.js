var Ae=Object.defineProperty;var Se=(o,e,a)=>e in o?Ae(o,e,{enumerable:!0,configurable:!0,writable:!0,value:a}):o[e]=a;var Z=(o,e,a)=>Se(o,typeof e!="symbol"?e+"":e,a);import{c as ve,r as h,R as te,Z as xe,_ as Ee,$ as Ce,j as r,a0 as se,g as Q,l as X,B as k,s as A,u as be,a1 as D,a2 as Ie,f as ye,X as we,a3 as Te,a as ee,n as Ne,o as Re,a4 as Oe}from"./index-BqMo5uum.js";import{E as je}from"./external-link-CIbwxIEF.js";import{i as W,I as ae}from"./integrationsService-D-OY7chJ.js";import{P as De}from"./plus-DYHuhmFs.js";import{M as ke}from"./message-square-hjORrwUR.js";import{T as Le}from"./trash-2-GpJVA0j5.js";import{S as Me}from"./sparkles-CjHefd2f.js";import{S as Pe}from"./send-QwpoEIXl.js";/**
 * @license lucide-react v0.417.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _e=ve("Paperclip",[["path",{d:"m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48",key:"1u3ebp"}]]);function re(){return re=Object.assign?Object.assign.bind():function(o){for(var e=1;e<arguments.length;e++){var a=arguments[e];for(var t in a)({}).hasOwnProperty.call(a,t)&&(o[t]=a[t])}return o},re.apply(null,arguments)}function ze(o,e){if(o==null)return{};var a={};for(var t in o)if({}.hasOwnProperty.call(o,t)){if(e.indexOf(t)!==-1)continue;a[t]=o[t]}return a}var Ge=h.useLayoutEffect,$e=function(e){var a=te.useRef(e);return Ge(function(){a.current=e}),a},ce=function(e,a){if(typeof e=="function"){e(a);return}e.current=a},Fe=function(e,a){var t=te.useRef();return te.useCallback(function(n){e.current=n,t.current&&ce(t.current,null),t.current=a,a&&ce(a,n)},[a])},de={"min-height":"0","max-height":"none",height:"0",visibility:"hidden",overflow:"hidden",position:"absolute","z-index":"-1000",top:"0",right:"0",display:"block"},qe=function(e){Object.keys(de).forEach(function(a){e.style.setProperty(a,de[a],"important")})},le=qe,E=null,ue=function(e,a){var t=e.scrollHeight;return a.sizingStyle.boxSizing==="border-box"?t+a.borderSize:t-a.paddingSize};function Ue(o,e,a,t){a===void 0&&(a=1),t===void 0&&(t=1/0),E||(E=document.createElement("textarea"),E.setAttribute("tabindex","-1"),E.setAttribute("aria-hidden","true"),le(E)),E.parentNode===null&&document.body.appendChild(E);var n=o.paddingSize,c=o.borderSize,i=o.sizingStyle,f=i.boxSizing;Object.keys(i).forEach(function(S){var L=S;E.style[L]=i[L]}),le(E),E.value=e;var l=ue(E,o);E.value=e,l=ue(E,o),E.value="x";var I=E.scrollHeight-n,y=I*a;f==="border-box"&&(y=y+n+c),l=Math.max(y,l);var x=I*t;return f==="border-box"&&(x=x+n+c),l=Math.min(x,l),[l,I]}var me=function(){},Ve=function(e,a){return e.reduce(function(t,n){return t[n]=a[n],t},{})},Be=["borderBottomWidth","borderLeftWidth","borderRightWidth","borderTopWidth","boxSizing","fontFamily","fontSize","fontStyle","fontWeight","letterSpacing","lineHeight","paddingBottom","paddingLeft","paddingRight","paddingTop","tabSize","textIndent","textRendering","textTransform","width","wordBreak","wordSpacing","scrollbarGutter"],He=!!document.documentElement.currentStyle,We=function(e){var a=window.getComputedStyle(e);if(a===null)return null;var t=Ve(Be,a),n=t.boxSizing;if(n==="")return null;He&&n==="border-box"&&(t.width=parseFloat(t.width)+parseFloat(t.borderRightWidth)+parseFloat(t.borderLeftWidth)+parseFloat(t.paddingRight)+parseFloat(t.paddingLeft)+"px");var c=parseFloat(t.paddingBottom)+parseFloat(t.paddingTop),i=parseFloat(t.borderBottomWidth)+parseFloat(t.borderTopWidth);return{sizingStyle:t,paddingSize:c,borderSize:i}},Ke=We;function oe(o,e,a){var t=$e(a);h.useLayoutEffect(function(){var n=function(i){return t.current(i)};if(o)return o.addEventListener(e,n),function(){return o.removeEventListener(e,n)}},[])}var Qe=function(e,a){oe(document.body,"reset",function(t){e.current.form===t.target&&a(t)})},Xe=function(e){oe(window,"resize",e)},Ye=function(e){oe(document.fonts,"loadingdone",e)},Je=["cacheMeasurements","maxRows","minRows","onChange","onHeightChange"],Ze=function(e,a){var t=e.cacheMeasurements,n=e.maxRows,c=e.minRows,i=e.onChange,f=i===void 0?me:i,l=e.onHeightChange,I=l===void 0?me:l,y=ze(e,Je),x=y.value!==void 0,S=h.useRef(null),L=Fe(S,a),M=h.useRef(0),P=h.useRef(),T=function(){var g=S.current,_=t&&P.current?P.current:Ke(g);if(_){P.current=_;var z=Ue(_,g.value||g.placeholder||"x",c,n),O=z[0],Y=z[1];M.current!==O&&(M.current=O,g.style.setProperty("height",O+"px","important"),I(O,{rowHeight:Y}))}},q=function(g){x||T(),f(g)};return h.useLayoutEffect(T),Qe(S,function(){if(!x){var u=S.current.value;requestAnimationFrame(function(){var g=S.current;g&&u!==g.value&&T()})}}),Xe(T),Ye(T),h.createElement("textarea",re({},y,{onChange:q,ref:L}))},ea=h.forwardRef(Ze);const aa={emailSummary:!0,emailAlerts:!0,emailNews:!1,pushMentions:!0,pushIntegrations:!1,pushSuggestions:!0},ge=xe()(Ee(o=>({aiSystemPrompt:"Você é o SyncAds AI, um assistente de marketing digital especializado em otimização de campanhas. Seja proativo, criativo e forneça insights baseados em dados. Suas respostas devem ser claras, concisas e sempre focadas em ajudar o usuário a atingir seus objetivos de marketing.",aiInitialGreetings:["Olá! 👋 Sou o SyncAds AI, seu assistente de marketing digital. Como posso ajudar você hoje?","Oi! Estou aqui para ajudar a otimizar suas campanhas. O que gostaria de fazer?","Bem-vindo! Pronto para criar campanhas incríveis? Por onde começamos?"],isTwoFactorEnabled:!1,notificationSettings:aa,setAiSystemPrompt:e=>o({aiSystemPrompt:e}),setAiInitialGreetings:e=>o({aiInitialGreetings:e}),addAiGreeting:e=>o(a=>({aiInitialGreetings:[...a.aiInitialGreetings,e]})),removeAiGreeting:e=>o(a=>({aiInitialGreetings:a.aiInitialGreetings.filter((t,n)=>n!==e)})),updateAiGreeting:(e,a)=>o(t=>({aiInitialGreetings:t.aiInitialGreetings.map((n,c)=>c===e?a:n)})),setTwoFactorEnabled:e=>o({isTwoFactorEnabled:e}),updateNotificationSettings:e=>o(a=>({notificationSettings:{...a.notificationSettings,...e}}))}),{name:"settings-storage",storage:Ce(()=>localStorage),partialize:o=>({aiSystemPrompt:o.aiSystemPrompt,aiInitialGreetings:o.aiInitialGreetings,isTwoFactorEnabled:o.isTwoFactorEnabled,notificationSettings:o.notificationSettings})})),ta=`
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
`;function sa(o){const e=/```campaign-create\s*\n([\s\S]*?)```/,a=o.match(e);if(!a)return null;try{const t=JSON.parse(a[1].trim());return!t.name||!t.platform||!t.budgetTotal||!t.startDate?(console.error("Campaign data missing required fields"),null):["Google Ads","Meta","LinkedIn"].includes(t.platform)?{action:"create_campaign",data:{name:t.name,platform:t.platform,budgetTotal:Number(t.budgetTotal),startDate:t.startDate,endDate:t.endDate||void 0,objective:t.objective||"Conversões"}}:(console.error("Invalid platform:",t.platform),null)}catch(t){return console.error("Failed to parse campaign data:",t),null}}function ra(o){return o.replace(/```campaign-create\s*\n[\s\S]*?```/g,"").trim()}const oa=({platform:o,platformName:e,icon:a,onSkip:t,onSuccess:n})=>{const[c,i]=h.useState(!1),[f,l]=h.useState("idle"),I=async()=>{i(!0),l("connecting");try{const{data:{session:x}}=await A.auth.getSession();if(!x)throw new Error("Você precisa estar logado");const S=await fetch("https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/oauth-init",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${x.access_token}`},body:JSON.stringify({platform:o.toUpperCase(),redirectUrl:`${window.location.origin}/oauth/callback`})});if(!S.ok)throw new Error("Falha ao iniciar conexão");const{authUrl:L}=await S.json(),M=600,P=700,T=window.screen.width/2-M/2,q=window.screen.height/2-P/2,u=window.open(L,"oauth-popup",`width=${M},height=${P},left=${T},top=${q}`),g=_=>{var z,O;((z=_.data)==null?void 0:z.type)==="oauth-success"?(l("success"),i(!1),u==null||u.close(),n==null||n(),window.removeEventListener("message",g)):((O=_.data)==null?void 0:O.type)==="oauth-error"&&(l("error"),i(!1),u==null||u.close(),window.removeEventListener("message",g))};window.addEventListener("message",g),setTimeout(()=>{c&&(l("error"),i(!1),u==null||u.close())},5*60*1e3)}catch(x){console.error("Erro ao conectar:",x),l("error"),i(!1)}},y=()=>a||{facebook:"📘",meta:"📘",google:"🔍",linkedin:"💼",tiktok:"🎵",twitter:"🐦",canva:"🎨",instagram:"📸"}[o.toLowerCase()]||"🔗";return r.jsxs("div",{className:"my-4 animate-in fade-in slide-in-from-bottom-2 duration-300",children:[r.jsx("div",{className:"mb-3",children:r.jsxs("p",{className:"text-sm text-gray-700",children:["Vou conectar sua conta do ",r.jsx("strong",{children:e})," ao SyncAds."]})}),c&&r.jsxs("div",{className:"flex items-center gap-2 mb-3 text-sm text-blue-600",children:[r.jsx("span",{className:"text-2xl",children:y()}),r.jsxs("span",{children:["Connecting ",e,"..."]}),r.jsx(se,{className:"h-4 w-4 animate-spin"})]}),r.jsx(Q,{className:"border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow",children:r.jsxs(X,{className:"p-5",children:[r.jsx("div",{className:"mb-4",children:r.jsxs("p",{className:"text-sm text-gray-600 leading-relaxed",children:["I'll need to connect your ",r.jsx("strong",{className:"text-gray-900",children:e})," account to continue."]})}),r.jsxs("div",{className:"flex items-center gap-2",children:[r.jsx(k,{onClick:()=>t==null?void 0:t(),variant:"ghost",disabled:c,className:"text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all",children:"Skip"}),r.jsx(k,{onClick:I,disabled:c,className:"flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium shadow-sm hover:shadow transition-all disabled:opacity-60",children:c?r.jsxs(r.Fragment,{children:[r.jsx(se,{className:"mr-2 h-4 w-4 animate-spin"}),"Connecting..."]}):r.jsxs(r.Fragment,{children:[r.jsx("svg",{className:"mr-2 h-4 w-4",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M13 10V3L4 14h7v7l9-11h-7z"})}),"Connect ",e]})})]}),r.jsx("div",{className:"mt-4 pt-4 border-t border-gray-100",children:r.jsxs("a",{href:"/privacy",target:"_blank",className:"text-xs text-gray-400 hover:text-blue-600 flex items-center gap-1 transition-colors",children:[r.jsx("svg",{className:"h-3 w-3",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"})}),"How we handle your data",r.jsx(je,{className:"h-3 w-3"})]})}),f==="success"&&r.jsx("div",{className:"mt-3 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700",children:"✅ Conectado com sucesso!"}),f==="error"&&r.jsx("div",{className:"mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700",children:"❌ Erro ao conectar. Tente novamente."})]})})]})},na=`
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
`;class ia{constructor(e){Z(this,"userId");this.userId=e}async executeSQL(e){try{if(/DROP|TRUNCATE|DELETE\s+FROM\s+"User"|DELETE\s+FROM\s+"Campaign"/i.test(e))return{success:!1,error:"Query perigosa detectada. Confirmação necessária.",message:"⚠️ Esta query pode ser destrutiva. Por favor, confirme explicitamente."};const{data:t,error:n}=await A.rpc("execute_admin_query",{query_text:e});return n?{success:!1,error:n.message,message:`❌ Erro ao executar SQL: ${n.message}`}:{success:!0,data:t,message:`✅ Query executada com sucesso. ${Array.isArray(t)?t.length:0} registros retornados.`}}catch(a){return{success:!1,error:a.message,message:`❌ Erro: ${a.message}`}}}async analyzeSystem(e,a){try{let t="",n="";switch(e){case"metrics":t=`
            SELECT 
              (SELECT COUNT(*) FROM "User") as total_users,
              (SELECT COUNT(*) FROM "Campaign") as total_campaigns,
              (SELECT COUNT(*) FROM "ChatMessage") as total_messages,
              (SELECT COUNT(*) FROM "AiConnection") as total_connections
          `,n="📊 Métricas gerais do sistema";break;case"performance":t=`
            SELECT 
              AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_response_time,
              COUNT(*) as total_requests
            FROM "ChatMessage"
            WHERE created_at >= NOW() - INTERVAL '${a==="24h"?"1 day":a==="7d"?"7 days":"30 days"}'
          `,n="⚡ Análise de performance";break;case"usage":t=`
            SELECT 
              DATE(created_at) as date,
              COUNT(*) as messages_count
            FROM "ChatMessage"
            WHERE created_at >= NOW() - INTERVAL '${a==="24h"?"1 day":a==="7d"?"7 days":"30 days"}'
            GROUP BY DATE(created_at)
            ORDER BY date DESC
          `,n="📈 Análise de uso";break;case"errors":return{success:!0,data:{errors:0},message:"✅ Sistema de logging de erros a ser implementado"}}const{data:c,error:i}=await A.rpc("execute_admin_query",{query_text:t});if(i)throw i;return{success:!0,data:c,message:`${n} - Período: ${a}`}}catch(t){return{success:!1,error:t.message,message:`❌ Erro ao analisar sistema: ${t.message}`}}}async manageIntegration(e,a,t){try{switch(e){case"test":return{success:!0,message:`🔍 Testando integração com ${a}... (A implementar com APIs reais)`,data:{status:"pending"}};case"connect":const{data:n,error:c}=await A.from("Integration").insert({userId:this.userId,platform:a.toUpperCase(),credentials:t||{},isConnected:!1,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}).select().single();if(c)throw c;return{success:!0,data:n,message:`✅ Integração com ${a} iniciada. Configure as credenciais.`};case"disconnect":return await A.from("Integration").update({isConnected:!1}).eq("platform",a.toUpperCase()).eq("userId",this.userId),{success:!0,message:`✅ Integração com ${a} desconectada.`};default:return{success:!1,error:"Ação desconhecida",message:"❌ Ação não reconhecida"}}}catch(n){return{success:!1,error:n.message,message:`❌ Erro ao gerenciar integração: ${n.message}`}}}async getMetrics(e,a,t){try{let n="",c="*";switch(e){case"users":n="User";break;case"campaigns":n="Campaign";break;case"messages":n="ChatMessage";break;default:return{success:!1,error:"Métrica desconhecida",message:"❌ Métrica não reconhecida"}}const i=`
        SELECT 
          DATE_TRUNC('${t}', created_at) as period,
          ${a==="count"?"COUNT(*)":a==="sum"?"SUM(1)":"AVG(1)"} as value
        FROM "${n}"
        GROUP BY period
        ORDER BY period DESC
        LIMIT 30
      `,{data:f,error:l}=await A.rpc("execute_admin_query",{query_text:i});if(l)throw l;return{success:!0,data:f,message:`📊 Métricas de ${e} agrupadas por ${t}`}}catch(n){return{success:!1,error:n.message,message:`❌ Erro ao obter métricas: ${n.message}`}}}}function ca(o){const e=/```admin-sql\s*\n([\s\S]*?)```/,a=o.match(e);return a?a[1].trim():null}function da(o){const e=/```admin-analyze\s*\n([\s\S]*?)```/,a=o.match(e);if(!a)return null;try{return JSON.parse(a[1].trim())}catch{return null}}function la(o){const e=/```admin-integration\s*\n([\s\S]*?)```/,a=o.match(e);if(!a)return null;try{return JSON.parse(a[1].trim())}catch{return null}}function ua(o){const e=/```admin-metrics\s*\n([\s\S]*?)```/,a=o.match(e);if(!a)return null;try{return JSON.parse(a[1].trim())}catch{return null}}function ma(o){return o.replace(/```admin-sql\s*\n[\s\S]*?```/g,"").replace(/```admin-analyze\s*\n[\s\S]*?```/g,"").replace(/```admin-integration\s*\n[\s\S]*?```/g,"").replace(/```admin-metrics\s*\n[\s\S]*?```/g,"").replace(/```admin-logs\s*\n[\s\S]*?```/g,"").replace(/```admin-test-api\s*\n[\s\S]*?```/g,"").replace(/```admin-debug\s*\n[\s\S]*?```/g,"").trim()}function ga(o){const e=/```integration-connect:(\w+)```/,a=o.match(e);return a?{action:"connect",slug:a[1]}:null}function pa(o){const e=/```integration-disconnect:(\w+)```/,a=o.match(e);return a?{action:"disconnect",slug:a[1]}:null}function fa(o){const e=/```integration-status(?::(\w+))?```/,a=o.match(e);return a?{action:"status",slug:a[1]}:null}function ha(o){return ga(o)||pa(o)||fa(o)}function Aa(o){return o.replace(/```integration-connect:\w+```/g,"").replace(/```integration-disconnect:\w+```/g,"").replace(/```integration-status(?::\w+)?```/g,"").trim()}const Sa=`
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
`,va=`
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
`;class xa{constructor(e){Z(this,"userId");this.userId=e}async auditIntegration(e){try{const{data:a,error:t}=await A.from("Integration").select("*").eq("userId",this.userId).eq("platform",e).single();if(t&&t.code!=="PGRST116")throw t;const n=this.getCapabilities(e),c=a&&a.isConnected?"connected":"disconnected",i={platform:e,status:c,lastSync:(a==null?void 0:a.lastSyncAt)||void 0,capabilities:n,issues:this.detectIssues(a,e),recommendations:this.getRecommendations(c,e)};return{success:!0,data:i,message:this.formatAuditMessage(i)}}catch(a){return{success:!1,error:a.message,message:`❌ Erro ao auditar ${e}: ${a.message}`}}}async auditAll(){try{const e=["META_ADS","GOOGLE_ADS","LINKEDIN_ADS","TIKTOK_ADS","TWITTER_ADS"],a=[];for(const t of e){const n=await this.auditIntegration(t);n.success&&n.data&&a.push(n.data)}return{success:!0,data:a,message:this.formatAllAuditsMessage(a)}}catch(e){return{success:!1,error:e.message,message:`❌ Erro ao auditar integrações: ${e.message}`}}}async listStatus(){try{const{data:e,error:a}=await A.from("Integration").select("platform, isConnected, lastSyncAt").eq("userId",this.userId);if(a)throw a;const t=new Map((e==null?void 0:e.map(i=>[i.platform,i]))||[]),c=["META_ADS","GOOGLE_ADS","LINKEDIN_ADS","TIKTOK_ADS","TWITTER_ADS"].map(i=>{var f,l;return{platform:i,status:t.has(i)&&((f=t.get(i))!=null&&f.isConnected)?"✅ Conectada":"❌ Desconectada",lastSync:((l=t.get(i))==null?void 0:l.lastSyncAt)||"Nunca"}});return{success:!0,data:c,message:this.formatStatusList(c)}}catch(e){return{success:!1,error:e.message,message:`❌ Erro ao listar status: ${e.message}`}}}getCapabilities(e){return{META_ADS:["Criar campanhas de Facebook e Instagram","Segmentação avançada de audiência","Análise de performance em tempo real","Otimização automática de orçamento","A/B testing de criativos","Remarketing e lookalike audiences"],GOOGLE_ADS:["Campanhas de Pesquisa (Search)","Anúncios Display e YouTube","Shopping Ads para e-commerce","Campanhas Performance Max","Análise de conversões e ROI","Smart Bidding automático"],LINKEDIN_ADS:["Anúncios B2B segmentados","Targeting por cargo e empresa","Lead Gen Forms nativos","InMail patrocinado","Análise de engajamento profissional","Retargeting de visitantes"],TIKTOK_ADS:["Vídeos In-Feed","TopView e Brand Takeover","Spark Ads (boost orgânico)","Segmentação por interesse e comportamento","Píxel de conversão","Catálogo de produtos"],TWITTER_ADS:["Tweets promovidos","Segmentação por hashtags e interesse","Audiências customizadas","Análise de engajamento","Campanhas de instalação de app","Vídeos e carrosséis"]}[e]||["Capacidades a definir"]}detectIssues(e,a){const t=[];if(!e)return t.push("Integração não configurada"),t;if(e.isConnected||t.push("Integração desconectada - configure credenciais"),(!e.credentials||Object.keys(e.credentials).length===0)&&t.push("Credenciais não configuradas"),e.lastSync){const n=new Date(e.lastSync),c=(Date.now()-n.getTime())/(1e3*60*60);c>24&&t.push(`Última sincronização há ${Math.floor(c)} horas - pode estar desatualizado`)}return t}getRecommendations(e,a){const t=[];return e==="disconnected"&&(t.push(`Conecte ${this.formatPlatformName(a)} em: Configurações → Integrações`),t.push("Configure sua chave de API para começar a usar")),e==="connected"&&(t.push("✅ Integração ativa! Você já pode criar campanhas"),t.push("Explore as capacidades disponíveis desta plataforma")),t}formatPlatformName(e){return{META_ADS:"Meta Ads (Facebook/Instagram)",GOOGLE_ADS:"Google Ads",LINKEDIN_ADS:"LinkedIn Ads",TIKTOK_ADS:"TikTok Ads",TWITTER_ADS:"Twitter Ads (X)"}[e]||e}formatAuditMessage(e){let t=`
**${e.status==="connected"?"✅":"❌"} ${this.formatPlatformName(e.platform)}**
`;return t+=`Status: ${e.status==="connected"?"✅ Conectada":"❌ Desconectada"}
`,e.lastSync&&(t+=`Última sincronização: ${e.lastSync}
`),t+=`
**Capacidades:**
`,e.capabilities.forEach(n=>{t+=`• ${n}
`}),e.issues&&e.issues.length>0&&(t+=`
**⚠️ Problemas detectados:**
`,e.issues.forEach(n=>{t+=`• ${n}
`})),e.recommendations&&e.recommendations.length>0&&(t+=`
**💡 Recomendações:**
`,e.recommendations.forEach(n=>{t+=`• ${n}
`})),t}formatAllAuditsMessage(e){let a=`
# 🔍 AUDITORIA COMPLETA DE INTEGRAÇÕES

`;const t=e.filter(c=>c.status==="connected").length,n=e.length;return a+=`**Resumo:** ${t}/${n} integrações ativas

`,a+=`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`,e.forEach(c=>{a+=this.formatAuditMessage(c),a+=`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`}),t<n?(a+=`
**🎯 Próximos Passos:**
`,a+=`1. Conecte as ${n-t} integrações pendentes
`,a+=`2. Configure suas chaves de API
`,a+=`3. Teste cada integração antes de criar campanhas
`):a+=`
**🎉 Parabéns!** Todas as integrações estão configuradas e funcionando!
`,a}formatStatusList(e){let a=`
**📊 Status das Integrações:**

`;return e.forEach(t=>{a+=`${t.status} **${this.formatPlatformName(t.platform)}**
`,a+=`   └─ Última sync: ${t.lastSync}

`}),a}}function Ea(o){const e=/```integration-action\s*\n([\s\S]*?)```/,a=o.match(e);if(!a)return null;try{return JSON.parse(a[1].trim())}catch{return null}}function Ca(o){return o.replace(/```integration-action\s*\n[\s\S]*?```/g,"").trim()}function ba(o,e){const a=o.toLowerCase(),t=e.toLowerCase(),n=(a.includes("auditor")||a.includes("verificar")||a.includes("status")||a.includes("listar"))&&(a.includes("integra")||a.includes("conex")||a.includes("plataforma")),c=t.includes("vou")&&(t.includes("auditor")||t.includes("verificar"));if(!n||!c)return null;const i={facebook:"META_ADS",instagram:"META_ADS",meta:"META_ADS",google:"GOOGLE_ADS",linkedin:"LINKEDIN_ADS",tiktok:"TIKTOK_ADS",twitter:"TWITTER_ADS"};for(const[f,l]of Object.entries(i))if(a.includes(f))return{action:"audit",platform:l};return{action:"audit_all"}}const Ia=["Criar campanha de Facebook Ads","Analisar performance da última semana","Sugerir otimizações"],K=500,La=()=>{const[o,e]=h.useState(""),[a,t]=h.useState(!0),[n,c]=h.useState(null),i=be(s=>s.user),f=D(s=>s.conversations),l=D(s=>s.activeConversationId),I=D(s=>s.setActiveConversationId),y=D(s=>s.isAssistantTyping),x=D(s=>s.setAssistantTyping),S=D(s=>s.addMessage);D(s=>s.deleteConversation),D(s=>s.createNewConversation);const L=Ie(s=>s.addCampaign),M=ge(s=>s.aiSystemPrompt),P=ge(s=>s.aiInitialGreetings),T=h.useRef(null),q=h.useRef(null),{toast:u}=ye(),g=f.find(s=>s.id===l),_=()=>{var s;(s=T.current)==null||s.scrollIntoView({behavior:"smooth"})};h.useEffect(_,[g==null?void 0:g.messages,y]),h.useEffect(()=>{(async()=>{if(i)try{const{data:d,error:v}=await A.from("GlobalAiConnection").select("id, systemPrompt, initialGreetings").eq("isActive",!0).limit(1).single();if(v){console.error("Erro ao buscar IA:",v);return}const C=d==null?void 0:d.id;if(C){const{data:b,error:U}=await A.from("GlobalAiConnection").select("systemPrompt, initialGreetings").eq("id",C).single();if(U){console.error("Erro ao buscar config da IA:",U);return}b&&c({systemPrompt:b.systemPrompt||M,initialGreetings:b.initialGreetings||P})}}catch(d){console.error("Erro ao carregar IA Global:",d)}})()},[i==null?void 0:i.organizationId]);const z=async()=>{if(o.trim()===""||!l||o.length>K)return;const s=o;i&&S(i.id,l,{id:`msg-${Date.now()}`,role:"user",content:s}),e(""),t(!1),x(!0);try{const d=f.find(m=>m.id===l),v=(n==null?void 0:n.systemPrompt)||M,C=na+`

`+ta+`

`+Sa+`

`+va+`

`+v,b=((d==null?void 0:d.messages)||[]).slice(-20).map(m=>({role:m.role,content:m.content})),j=(await Oe(s,l,b,C)).response,G=sa(j);if(G)try{i&&(await L(i.id,{name:G.data.name,platform:G.data.platform,status:"Pausada",budgetTotal:G.data.budgetTotal,budgetSpent:0,impressions:0,clicks:0,conversions:0,startDate:G.data.startDate,endDate:G.data.endDate||"",ctr:0,cpc:0}),u({title:"🎉 Campanha Criada!",description:`A campanha "${G.data.name}" foi criada com sucesso.`}))}catch(m){console.error("Error creating campaign from AI:",m),u({title:"Erro ao criar campanha",description:"Não foi possível criar a campanha automaticamente.",variant:"destructive"})}let ie="";if(i){const m=new ia(i.id),N=ca(j);if(N){const p=await m.executeSQL(N);u({title:p.success?"✅ SQL Executado":"❌ Erro SQL",description:p.message,variant:p.success?"default":"destructive"})}const V=da(j);if(V){const p=await m.analyzeSystem(V.type,V.period);u({title:p.success?"📊 Análise Concluída":"❌ Erro",description:p.message,variant:p.success?"default":"destructive"})}const B=la(j);if(B){const p=await m.manageIntegration(B.action,B.platform,B.credentials);u({title:p.success?"🔗 Integração Atualizada":"❌ Erro",description:p.message,variant:p.success?"default":"destructive"})}const H=ua(j);if(H){const p=await m.getMetrics(H.metric,H.aggregation,H.groupBy);u({title:p.success?"📈 Métricas Obtidas":"❌ Erro",description:p.message,variant:p.success?"default":"destructive"})}let F=Ea(j);if(F||(F=ba(s,j)),F){const p=new xa(i.id);let R;switch(F.action){case"audit":F.platform&&(R=await p.auditIntegration(F.platform));break;case"audit_all":R=await p.auditAll();break;case"list_status":R=await p.listStatus();break;case"test":case"capabilities":case"diagnose":R={success:!0,message:`Ação "${F.action}" detectada. Implementação em andamento.`};break}R&&(ie=`

`+R.message,u({title:R.success?"✅ Ação Executada":"❌ Erro",description:R.success?"Auditoria concluída com sucesso":R.error||"Erro ao executar ação",variant:R.success?"default":"destructive"}))}}const w=ha(j);if(w&&i)try{if(w.action==="connect"){const{authUrl:m}=await W.generateOAuthUrl(w.slug,i.id),N=ae[w.slug];i&&S(i.id,l,{id:`msg-${Date.now()+1}`,role:"assistant",content:`Para conectar ${N.name}, clique no link abaixo:

🔗 [Autorizar ${N.name}](${m})

O link abrirá em uma nova aba para você autorizar o acesso.`}),window.open(m,"_blank"),u({title:"🔗 Link de Autorização",description:`Clique no link para conectar ${N.name}`});return}else if(w.action==="disconnect"){await W.disconnect(i.id,w.slug);const m=ae[w.slug];u({title:"✅ Desconectado",description:`${m.name} foi desconectado com sucesso.`})}else if(w.action==="status")if(w.slug){const m=await W.getIntegrationStatus(i.id,w.slug),N=ae[w.slug];u({title:`${N.name}`,description:m!=null&&m.isConnected?"✅ Conectado":"❌ Não conectado"})}else{const m=await W.listIntegrations(i.id),N=m.filter(V=>V.isConnected).length;u({title:"📊 Status das Integrações",description:`${N} de ${m.length} integrações conectadas`})}}catch(m){console.error("Erro ao processar integração:",m),i&&S(i.id,l,{id:`msg-${Date.now()+2}`,role:"assistant",content:`❌ **Erro ao conectar integração**

${m.message||"Erro ao processar comando de integração"}`}),u({title:"❌ Erro na Integração",description:"Verifique as instruções no chat",variant:"destructive"})}let $=ra(j);$=ma($),$=Aa($),$=Ca($),i&&S(i.id,l,{id:`msg-${Date.now()+1}`,role:"assistant",content:$+ie})}catch(d){console.error("Erro ao chamar IA:",d),u({title:"Erro ao gerar resposta",description:d.message||"Não foi possível obter resposta da IA. Verifique sua chave de API.",variant:"destructive"}),i&&S(i.id,l,{id:`msg-${Date.now()+1}`,role:"assistant",content:"❌ Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, verifique se sua chave de API está configurada corretamente nas configurações."})}finally{x(!1)}},O=s=>{e(s)},Y=()=>{var s;(s=q.current)==null||s.click()},pe=s=>{var v;const d=(v=s.target.files)==null?void 0:v[0];d&&u({title:"Arquivo Selecionado",description:`O arquivo "${d.name}" está pronto para ser enviado (simulação).`,variant:"info"}),s.target&&(s.target.value="")},J=async()=>{try{if(!i)return;const{data:s,error:d}=await A.from("ChatConversation").select("id, title, createdAt, updatedAt").eq("userId",i.id).order("updatedAt",{ascending:!1}).limit(20);if(d)throw d;console.log(`✅ ${(s==null?void 0:s.length)||0} conversas carregadas`)}catch(s){console.error("Erro ao carregar conversas:",s)}},fe=async s=>{try{const{data:d,error:v}=await A.from("ChatMessage").select("id, role, content, createdAt").eq("conversationId",s).order("createdAt",{ascending:!0});if(v)throw v;const C=(d||[]).map(b=>({id:b.id,role:b.role,content:b.content,timestamp:new Date(b.createdAt)}));D.getState().setConversationMessages(s,C),I(s),console.log(`✅ ${C.length} mensagens carregadas da conversa ${s}`)}catch(d){console.error("Erro ao carregar mensagens:",d),u({title:"Erro",description:"Não foi possível carregar mensagens.",variant:"destructive"})}};h.useEffect(()=>{(async()=>{if(!i)return;await J();const{data:d}=await A.from("ChatConversation").select("id").eq("userId",i.id).limit(1);(!d||d.length===0)&&await ne()})()},[]);const ne=async()=>{try{if(!i)return;const{data:s}=await A.from("User").select("organizationId").eq("id",i.id).single();if(!(s!=null&&s.organizationId))throw new Error("Usuário sem organização");const d=crypto.randomUUID(),v=new Date().toISOString(),{error:C}=await A.from("ChatConversation").insert({id:d,userId:i.id,organizationId:s.organizationId,title:"🆕 Nova Conversa",createdAt:v,updatedAt:v});if(C)throw C;I(d),await J(),u({title:"✅ Nova conversa criada!",description:"Comece um novo chat do zero."})}catch(s){console.error("Erro ao criar nova conversa:",s),u({title:"Erro",description:s.message||"Não foi possível criar nova conversa.",variant:"destructive"})}},he=async s=>{try{await A.from("ChatMessage").delete().eq("conversationId",s);const{error:d}=await A.from("ChatConversation").delete().eq("id",s);if(d)throw d;l===s&&I(null),await J(),u({title:"🗑️ Conversa deletada",description:"A conversa foi removida com sucesso."})}catch(d){console.error("Erro ao deletar conversa:",d),u({title:"Erro",description:"Não foi possível deletar a conversa.",variant:"destructive"})}};return r.jsxs("div",{className:"h-[calc(100vh-80px)] flex",children:[r.jsxs("div",{className:`${a?"w-72":"w-0"} transition-all duration-300 bg-gray-50 border-r border-gray-200 flex flex-col overflow-hidden`,children:[r.jsxs("div",{className:"p-4 border-b border-gray-200",children:[r.jsxs("div",{className:"flex items-center justify-between mb-3",children:[r.jsx("h2",{className:"text-sm font-semibold text-gray-700",children:"Conversas"}),r.jsx(k,{onClick:()=>t(!1),variant:"ghost",size:"sm",className:"h-7 w-7 p-0",children:r.jsx(we,{className:"h-4 w-4"})})]}),r.jsxs(k,{onClick:ne,className:"w-full gap-2",size:"sm",children:[r.jsx(De,{className:"h-4 w-4"}),"Nova Conversa"]})]}),r.jsx("div",{className:"flex-1 overflow-y-auto p-2 space-y-1",children:f.map(s=>r.jsxs("div",{className:`group relative flex items-center gap-2 p-3 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors ${l===s.id?"bg-blue-50 border border-blue-200":"bg-white"}`,onClick:()=>{l!==s.id&&fe(s.id)},children:[r.jsx(ke,{className:"h-4 w-4 text-gray-500 flex-shrink-0"}),r.jsxs("div",{className:"flex-1 min-w-0",children:[r.jsx("p",{className:"text-sm font-medium text-gray-900 truncate",children:s.title}),r.jsx("p",{className:"text-xs text-gray-500 truncate",children:s.messages&&s.messages.length>0?s.messages[s.messages.length-1].content.substring(0,50)+"...":"Sem mensagens ainda"})]}),r.jsx(k,{onClick:d=>{d.stopPropagation(),he(s.id)},variant:"ghost",size:"sm",className:"h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity",children:r.jsx(Le,{className:"h-3.5 w-3.5 text-red-500"})})]},s.id))})]}),r.jsxs("div",{className:"flex-1 flex flex-col",children:[r.jsx("div",{className:"border-b border-gray-200 bg-white/80 backdrop-blur-xl p-4",children:r.jsxs("div",{className:"flex items-center justify-between",children:[r.jsxs("div",{className:"flex items-center gap-3",children:[!a&&r.jsx(k,{onClick:()=>t(!0),variant:"ghost",size:"sm",className:"h-9 w-9 p-0",children:r.jsx(Te,{className:"h-5 w-5"})}),r.jsx("div",{className:"p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500",children:r.jsx(ee,{className:"h-6 w-6 text-white"})}),r.jsxs("div",{children:[r.jsx("h1",{className:"text-xl font-bold text-gray-900",children:"Chat com IA"}),r.jsx("p",{className:"text-sm text-gray-500",children:"Assistente inteligente"})]})]}),r.jsxs(Ne,{className:"bg-gradient-to-r from-green-500 to-emerald-500",children:[r.jsx(Me,{className:"h-3 w-3 mr-1"}),"Online"]})]})}),r.jsx("div",{className:"flex-1 overflow-y-auto p-4 space-y-4",children:g?r.jsxs(r.Fragment,{children:[g.messages.map(s=>{var v;const d=(v=s.content)==null?void 0:v.match(/INTEGRATION_CONNECT:(\w+):([^🔗]+)/);if(d&&s.role==="assistant"){const[,C,b]=d,U=s.content.replace(/🔗 \*\*INTEGRATION_CONNECT:[^🔗]+🔗\*\* 🔗\n\n/,"");return r.jsx("div",{className:"flex justify-start",children:r.jsxs("div",{className:"max-w-[80%]",children:[r.jsx(Q,{className:"bg-white mb-2",children:r.jsx(X,{className:"p-4",children:r.jsxs("div",{className:"flex items-start gap-2",children:[r.jsx(ee,{className:"h-5 w-5 text-blue-600 mt-1 flex-shrink-0"}),r.jsx("div",{className:"flex-1 whitespace-pre-wrap break-words text-sm text-gray-900",children:U})]})})}),r.jsx(oa,{platform:C,platformName:b.trim(),onSkip:()=>{console.log("Conexão pulada:",C)},onSuccess:()=>{console.log("Conectado com sucesso:",C)}})]})},s.id)}return r.jsx("div",{className:`flex ${s.role==="user"?"justify-end":"justify-start"}`,children:r.jsx(Q,{className:`max-w-[80%] ${s.role==="user"?"bg-gradient-to-r from-blue-500 to-purple-500 text-white":"bg-white"}`,children:r.jsxs(X,{className:"p-4",children:[r.jsxs("div",{className:"flex items-start gap-2",children:[s.role==="assistant"&&r.jsx(ee,{className:"h-5 w-5 text-blue-600 mt-1 flex-shrink-0"}),r.jsx("div",{className:`flex-1 whitespace-pre-wrap break-words text-sm ${s.role==="user"?"text-white":"text-gray-900"}`,children:s.content})]}),r.jsx("div",{className:`text-xs mt-2 ${s.role==="user"?"text-white/70":"text-gray-500"}`,children:s.timestamp?new Date(s.timestamp).toLocaleTimeString("pt-BR"):""})]})})},s.id)}),y&&r.jsx("div",{className:"flex justify-start",children:r.jsx(Q,{className:"bg-white",children:r.jsx(X,{className:"p-4",children:r.jsxs("div",{className:"flex items-center gap-2",children:[r.jsx(se,{className:"h-4 w-4 animate-spin text-blue-600"}),r.jsx("span",{className:"text-sm text-gray-500",children:"Processando..."})]})})})}),r.jsx("div",{ref:T})]}):r.jsx("div",{className:"flex items-center justify-center h-full text-muted-foreground",children:r.jsx("p",{children:"Selecione ou crie uma conversa para começar."})})}),r.jsxs("div",{className:"border-t border-gray-200 p-4 bg-white/80 backdrop-blur-xl",children:[r.jsx("div",{className:"hidden sm:flex gap-2 mb-2",children:Ia.map(s=>r.jsx(k,{variant:"outline",size:"sm",onClick:()=>O(s),children:s},s))}),r.jsxs("div",{className:"relative",children:[r.jsx(ea,{value:o,onChange:s=>e(s.target.value),onKeyDown:s=>{s.key==="Enter"&&!s.shiftKey&&(s.preventDefault(),z())},placeholder:"Digite sua mensagem...",className:"w-full resize-none rounded-lg border bg-background p-3 pr-24 min-h-[48px]",minRows:1,maxRows:5,maxLength:K}),r.jsxs("div",{className:"absolute right-2 top-1/2 -translate-y-1/2 flex gap-1",children:[r.jsx("input",{type:"file",ref:q,onChange:pe,className:"hidden"}),r.jsx(k,{type:"button",size:"icon",variant:"ghost",onClick:Y,children:r.jsx(_e,{className:"h-5 w-5"})}),r.jsx(k,{type:"submit",size:"icon",onClick:z,disabled:o.trim()===""||!l,children:r.jsx(Pe,{className:"h-5 w-5"})})]})]}),r.jsxs("p",{className:Re("text-xs text-right mt-1",o.length>K?"text-destructive":"text-muted-foreground"),children:[o.length," / ",K]})]})]})]})};export{La as default};
