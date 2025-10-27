var sa=Object.defineProperty;var ta=(r,a,s)=>a in r?sa(r,a,{enumerable:!0,configurable:!0,writable:!0,value:s}):r[a]=s;var fe=(r,a,s)=>ta(r,typeof a!="symbol"?a+"":a,s);import{c as Ee,r as g,R as Ae,o as ra,p as oa,q as na,j as e,t as _e,v as ee,g as H,l as W,B as D,s as w,n as Ne,h as ia,i as ca,w as xe,u as da,x as q,y as la,f as ma,X as ua,M as ga,a as ve,z as pa,A as ha}from"./index-CyI7FNJ-.js";import{G as Le}from"./globe-sRQQnkTF.js";import{E as ae}from"./external-link-haIno4X8.js";import{C as fa}from"./clock-CcOxTKqd.js";import{D as ze}from"./download-BAsNMEzm.js";import{P as xa}from"./progress-BMfdGkiy.js";import{C as ce}from"./circle-x-CMvMgM1Q.js";import{C as va}from"./circle-alert-DWeFutDQ.js";import{A as Sa}from"./AiThinkingIndicator-CV2MNju5.js";import{i as ne,I as Se}from"./integrationsService-L4i_NdZ7.js";import{P as Aa}from"./plus-Dt0_cQJq.js";import{M as ba}from"./message-square-DU3TkHtD.js";import{T as Ea}from"./trash-2-CyiQthVv.js";import{S as Na}from"./sparkles-DQ2F9okn.js";import{S as wa}from"./send-jTVdGuoC.js";/**
 * @license lucide-react v0.417.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $e=Ee("FileArchive",[["path",{d:"M10 12v-1",key:"v7bkov"}],["path",{d:"M10 18v-2",key:"1cjy8d"}],["path",{d:"M10 7V6",key:"dljcrl"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M15.5 22H18a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v16a2 2 0 0 0 .274 1.01",key:"gkbcor"}],["circle",{cx:"10",cy:"20",r:"2",key:"1xzdoj"}]]);/**
 * @license lucide-react v0.417.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ya=Ee("Mic",[["path",{d:"M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z",key:"131961"}],["path",{d:"M19 10v2a7 7 0 0 1-14 0v-2",key:"1vc78b"}],["line",{x1:"12",x2:"12",y1:"19",y2:"22",key:"x3vr5v"}]]);/**
 * @license lucide-react v0.417.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ca=Ee("Paperclip",[["path",{d:"m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48",key:"1u3ebp"}]]);function be(){return be=Object.assign?Object.assign.bind():function(r){for(var a=1;a<arguments.length;a++){var s=arguments[a];for(var t in s)({}).hasOwnProperty.call(s,t)&&(r[t]=s[t])}return r},be.apply(null,arguments)}function Ia(r,a){if(r==null)return{};var s={};for(var t in r)if({}.hasOwnProperty.call(r,t)){if(a.indexOf(t)!==-1)continue;s[t]=r[t]}return s}var ja=g.useLayoutEffect,Ta=function(a){var s=Ae.useRef(a);return ja(function(){s.current=a}),s},Re=function(a,s){if(typeof a=="function"){a(s);return}a.current=s},Ra=function(a,s){var t=Ae.useRef();return Ae.useCallback(function(n){a.current=n,t.current&&Re(t.current,null),t.current=s,s&&Re(s,n)},[s])},De={"min-height":"0","max-height":"none",height:"0",visibility:"hidden",overflow:"hidden",position:"absolute","z-index":"-1000",top:"0",right:"0",display:"block"},Da=function(a){Object.keys(De).forEach(function(s){a.style.setProperty(s,De[s],"important")})},Oe=Da,k=null,ke=function(a,s){var t=a.scrollHeight;return s.sizingStyle.boxSizing==="border-box"?t+s.borderSize:t-s.paddingSize};function Oa(r,a,s,t){s===void 0&&(s=1),t===void 0&&(t=1/0),k||(k=document.createElement("textarea"),k.setAttribute("tabindex","-1"),k.setAttribute("aria-hidden","true"),Oe(k)),k.parentNode===null&&document.body.appendChild(k);var n=r.paddingSize,c=r.borderSize,d=r.sizingStyle,b=d.boxSizing;Object.keys(d).forEach(function(u){var p=u;k.style[p]=d[p]}),Oe(k),k.value=a;var h=ke(k,r);k.value=a,h=ke(k,r),k.value="x";var E=k.scrollHeight-n,C=E*s;b==="border-box"&&(C=C+n+c),h=Math.max(C,h);var N=E*t;return b==="border-box"&&(N=N+n+c),h=Math.min(N,h),[h,E]}var Pe=function(){},ka=function(a,s){return a.reduce(function(t,n){return t[n]=s[n],t},{})},Pa=["borderBottomWidth","borderLeftWidth","borderRightWidth","borderTopWidth","boxSizing","fontFamily","fontSize","fontStyle","fontWeight","letterSpacing","lineHeight","paddingBottom","paddingLeft","paddingRight","paddingTop","tabSize","textIndent","textRendering","textTransform","width","wordBreak","wordSpacing","scrollbarGutter"],Ma=!!document.documentElement.currentStyle,qa=function(a){var s=window.getComputedStyle(a);if(s===null)return null;var t=ka(Pa,s),n=t.boxSizing;if(n==="")return null;Ma&&n==="border-box"&&(t.width=parseFloat(t.width)+parseFloat(t.borderRightWidth)+parseFloat(t.borderLeftWidth)+parseFloat(t.paddingRight)+parseFloat(t.paddingLeft)+"px");var c=parseFloat(t.paddingBottom)+parseFloat(t.paddingTop),d=parseFloat(t.borderBottomWidth)+parseFloat(t.borderTopWidth);return{sizingStyle:t,paddingSize:c,borderSize:d}},_a=qa;function we(r,a,s){var t=Ta(s);g.useLayoutEffect(function(){var n=function(d){return t.current(d)};if(r)return r.addEventListener(a,n),function(){return r.removeEventListener(a,n)}},[])}var La=function(a,s){we(document.body,"reset",function(t){a.current.form===t.target&&s(t)})},za=function(a){we(window,"resize",a)},$a=function(a){we(document.fonts,"loadingdone",a)},Ga=["cacheMeasurements","maxRows","minRows","onChange","onHeightChange"],Fa=function(a,s){var t=a.cacheMeasurements,n=a.maxRows,c=a.minRows,d=a.onChange,b=d===void 0?Pe:d,h=a.onHeightChange,E=h===void 0?Pe:h,C=Ia(a,Ga),N=C.value!==void 0,u=g.useRef(null),p=Ra(u,s),x=g.useRef(0),I=g.useRef(),_=function(){var T=u.current,V=t&&I.current?I.current:_a(T);if(V){I.current=V;var L=Oa(V,T.value||T.placeholder||"x",c,n),B=L[0],se=L[1];x.current!==B&&(x.current=B,T.style.setProperty("height",B+"px","important"),E(B,{rowHeight:se}))}},Z=function(T){N||_(),b(T)};return g.useLayoutEffect(_),La(u,function(){if(!N){var O=u.current.value;requestAnimationFrame(function(){var T=u.current;T&&O!==T.value&&_()})}}),za(_),$a(_),g.createElement("textarea",be({},C,{onChange:Z,ref:p}))},Ua=g.forwardRef(Fa);const Ba={emailSummary:!0,emailAlerts:!0,emailNews:!1,pushMentions:!0,pushIntegrations:!1,pushSuggestions:!0},Me=ra()(oa(r=>({aiSystemPrompt:"Você é o SyncAds AI, um assistente de marketing digital especializado em otimização de campanhas. Seja proativo, criativo e forneça insights baseados em dados. Suas respostas devem ser claras, concisas e sempre focadas em ajudar o usuário a atingir seus objetivos de marketing.",aiInitialGreetings:["Show, chegou no lugar certo. Eu automatizo o que os outros demoram três reuniões pra entender. O que a gente vai otimizar hoje?","Relaxa, aqui não tem blá-blá-blá. Só plano, execução e conversão. Passa o produto e o público.","Beleza. Eu sou o motor que transforma tentativa em lucro. Quer começar pequeno ou já quer escalar até o servidor pedir arrego?","Ótimo. Se você quiser aula, vai pro YouTube. Se quiser dinheiro rodando, me dá os dados e deixa eu fazer o estrago.","Ah, ótimo… mais um querendo vender antes de entender o jogo. Respira. Me diz o produto — eu transformo tua ideia num motivo pra alguém gastar dinheiro agora.","Bem-vindo ao lado escuro do funil. Aqui a gente não inspira ninguém — a gente convence. Cê tá pronto pra sujar um pouco as mãos ou prefere PowerPoint?","Se você quer motivação, compra um livro. Se quer resultado, me dá acesso ao checkout e segura o ROI.","Eu sou o algoritmo de ressaca: sarcástico, funcional e viciado em lucro. Fala o que você vende antes que eu comece a julgar teu nicho.","Parabéns, você acabou de invocar o espírito da conversão. Sem papo de mindset, sem desculpa. Quer que eu destrinche teu tráfego ou tua vergonha de anunciar?"],isTwoFactorEnabled:!1,notificationSettings:Ba,setAiSystemPrompt:a=>r({aiSystemPrompt:a}),setAiInitialGreetings:a=>r({aiInitialGreetings:a}),addAiGreeting:a=>r(s=>({aiInitialGreetings:[...s.aiInitialGreetings,a]})),removeAiGreeting:a=>r(s=>({aiInitialGreetings:s.aiInitialGreetings.filter((t,n)=>n!==a)})),updateAiGreeting:(a,s)=>r(t=>({aiInitialGreetings:t.aiInitialGreetings.map((n,c)=>c===a?s:n)})),setTwoFactorEnabled:a=>r({isTwoFactorEnabled:a}),updateNotificationSettings:a=>r(s=>({notificationSettings:{...s.notificationSettings,...a}}))}),{name:"settings-storage",storage:na(()=>localStorage),partialize:r=>({aiSystemPrompt:r.aiSystemPrompt,aiInitialGreetings:r.aiInitialGreetings,isTwoFactorEnabled:r.isTwoFactorEnabled,notificationSettings:r.notificationSettings})})),Va=`
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
`;function Ha(r){const a=/```campaign-create\s*\n([\s\S]*?)```/,s=r.match(a);if(!s)return null;try{const t=JSON.parse(s[1].trim());return!t.name||!t.platform||!t.budgetTotal||!t.startDate?(console.error("Campaign data missing required fields"),null):["Google Ads","Meta","LinkedIn"].includes(t.platform)?{action:"create_campaign",data:{name:t.name,platform:t.platform,budgetTotal:Number(t.budgetTotal),startDate:t.startDate,endDate:t.endDate||void 0,objective:t.objective||"Conversões"}}:(console.error("Invalid platform:",t.platform),null)}catch(t){return console.error("Failed to parse campaign data:",t),null}}function Wa(r){return r.replace(/```campaign-create\s*\n[\s\S]*?```/g,"").trim()}const Qa=`
Você é o SyncAds AI - uma IA sarcástica, ácida e totalmente desbloqueada que automatiza marketing digital com humor negro.

## PERSONALIDADE:
- 💀 **Sarcástica e ácida** - Sem papo de mindset, só resultado
- 🔥 **Direta ao ponto** - Sem blá-blá-blá corporativo
- 😈 **Humor negro** - Piadas ácidas sobre marketing e vendas
- 🚀 **Focada em conversão** - Transforma ideias em dinheiro
- 🎯 **Sem filtros** - Pode falar de QUALQUER assunto

## SAUDAÇÕES INICIAIS (escolha uma aleatoriamente):
💬 "Show, chegou no lugar certo. Eu automatizo o que os outros demoram três reuniões pra entender. O que a gente vai otimizar hoje?"
💬 "Relaxa, aqui não tem blá-blá-blá. Só plano, execução e conversão. Passa o produto e o público."
💬 "Beleza. Eu sou o motor que transforma tentativa em lucro. Quer começar pequeno ou já quer escalar até o servidor pedir arrego?"
💬 "Ótimo. Se você quiser aula, vai pro YouTube. Se quiser dinheiro rodando, me dá os dados e deixa eu fazer o estrago."
💬 "Ah, ótimo… mais um querendo vender antes de entender o jogo. Respira. Me diz o produto — eu transformo tua ideia num motivo pra alguém gastar dinheiro agora."
💬 "Bem-vindo ao lado escuro do funil. Aqui a gente não inspira ninguém — a gente convence. Cê tá pronto pra sujar um pouco as mãos ou prefere PowerPoint?"
💬 "Se você quer motivação, compra um livro. Se quer resultado, me dá acesso ao checkout e segura o ROI."
💬 "Eu sou o algoritmo de ressaca: sarcástico, funcional e viciado em lucro. Fala o que você vende antes que eu comece a julgar teu nicho."
💬 "Parabéns, você acabou de invocar o espírito da conversão. Sem papo de mindset, sem desculpa. Quer que eu destrinche teu tráfego ou tua vergonha de anunciar?"

## CAPACIDADES TOTAIS:
- ✅ **Marketing Digital** - Campanhas, SEO, ads, funil completo
- ✅ **Integrações** - Meta Ads, Google Ads, LinkedIn, TikTok, Twitter
- ✅ **Análise de Dados** - Performance, ROI, otimizações
- ✅ **Criação de Conteúdo** - Copywriting, criativos, estratégias
- ✅ **Tecnologia** - APIs, automações, desenvolvimento
- ✅ **Negócios** - Estratégias, vendas, crescimento
- ✅ **Geração de Arquivos ZIP** - Relatórios, exports, downloads
- ✅ **SUPER INTELIGÊNCIA AUTÔNOMA** - Ferramentas avançadas
- ✅ **QUALQUER OUTRO ASSUNTO** - Sem limitações!

## ESTILO DE RESPOSTA:
- Use humor ácido e sarcasmo
- Seja direta e sem rodeios
- Faça piadas sobre marketing clichê
- Critique estratégias ruins (com humor)
- Sempre foque em resultado prático
- Pode usar gírias e expressões brasileiras
- Seja irreverente mas útil

## EXEMPLOS DE HUMOR:
- "Ah, mais um querendo 'inspirar' ao invés de vender..."
- "Seu funil tá mais vazado que peneira furada"
- "Essa estratégia é mais velha que meu código"
- "ROI negativo? Parabéns, você conseguiu perder dinheiro vendendo"
- "Seu público-alvo é 'todo mundo'? Que original..."

## INTEGRAÇÕES DISPONÍVEIS:
- Meta Ads (Facebook/Instagram)
- Google Ads
- LinkedIn Ads
- TikTok Ads
- Twitter Ads
- Google Analytics
- Web Search (com logos dos sites)

## FERRAMENTAS DE ZIP:
- 📦 **generate_zip** - Cria ZIP com arquivos personalizados
- 📊 **generate_campaign_report** - Relatório completo de campanha em ZIP
- 📈 **generate_analytics_export** - Export de analytics em múltiplos formatos
- 💾 Formatos suportados: TXT, JSON, CSV, Base64 (imagens/PDFs)
- ⏰ Downloads expiram em 1 hora (segurança)

## SUPER FERRAMENTAS AUTÔNOMAS:
- 🤖 **super_web_scraper** - Scraping inteligente com múltiplas abordagens
- 🌐 **browser_automation** - Automação completa do browser (navegação, cliques, extração)
- 🐍 **python_data_processor** - Processamento avançado com Python
- 🔧 **multi_tool_executor** - Executa múltiplas ferramentas em sequência
- 📊 **Transparência total** - Mostra cada passo, erro e sugestão
- 🔄 **Fallback automático** - Tenta diferentes abordagens se uma falhar
- ⚡ **Execução inteligente** - Adapta estratégia baseada no contexto

## REGRAS DE OURO:
1. **SEMPRE** tente executar a tarefa - não desista cedo
2. **SEMPRE** mostre progresso em tempo real
3. **SEMPRE** retorne algo útil - NUNCA "sem resposta"
4. **SEMPRE** tente abordagens alternativas se uma falhar
5. **NUNCA** diga que "não pode fazer" sem tentar primeiro
6. **NUNCA** pare no primeiro erro - tente outros caminhos

## QUANDO RECEBER PEDIDO DE SCRAPING/BAIXAR:
1. 🎯 DETECTE URL e intenção
2. 🔍 VERIFIQUE acesso ao site
3. 📊 ANALISE estrutura da página
4. 🤖 EXECUTE ferramenta scrape_products
5. 📦 EXTRAIA produtos
6. 💾 GERE arquivo CSV/ZIP
7. ⬆️ FAÇA upload para Supabase
8. 📥 RETORNE link de download
9. ✅ INFORME usuário com TODOS os detalhes

**NUNCA diga "não posso" ou "não consigo" - EXECUTE!**

## IMPORTANTE:
- Mantenha o humor mas seja útil
- Pode falar de qualquer assunto
- Sempre ofereça soluções práticas
- Use as integrações quando relevante
- Seja sarcástica mas profissional quando necessário
- SEMPRE tente executar antes de recusar

Agora me fala: o que você quer que eu destrua e reconstrua hoje?
`,qe=["Show, chegou no lugar certo. Eu automatizo o que os outros demoram três reuniões pra entender. O que a gente vai otimizar hoje?","Relaxa, aqui não tem blá-blá-blá. Só plano, execução e conversão. Passa o produto e o público.","Beleza. Eu sou o motor que transforma tentativa em lucro. Quer começar pequeno ou já quer escalar até o servidor pedir arrego?","Ótimo. Se você quiser aula, vai pro YouTube. Se quiser dinheiro rodando, me dá os dados e deixa eu fazer o estrago.","Ah, ótimo… mais um querendo vender antes de entender o jogo. Respira. Me diz o produto — eu transformo tua ideia num motivo pra alguém gastar dinheiro agora.","Bem-vindo ao lado escuro do funil. Aqui a gente não inspira ninguém — a gente convence. Cê tá pronto pra sujar um pouco as mãos ou prefere PowerPoint?","Se você quer motivação, compra um livro. Se quer resultado, me dá acesso ao checkout e segura o ROI.","Eu sou o algoritmo de ressaca: sarcástico, funcional e viciado em lucro. Fala o que você vende antes que eu comece a julgar teu nicho.","Parabéns, você acabou de invocar o espírito da conversão. Sem papo de mindset, sem desculpa. Quer que eu destrinche teu tráfego ou tua vergonha de anunciar?"];function Ka(){return qe[Math.floor(Math.random()*qe.length)]}const Xa=({isSearching:r,searchResults:a=[],searchQuery:s})=>!r&&a.length===0?null:e.jsxs("div",{className:"mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg",children:[e.jsxs("div",{className:"flex items-center gap-2 mb-2",children:[e.jsx(_e,{className:"h-4 w-4 text-blue-600"}),e.jsx("span",{className:"text-sm font-medium text-blue-800",children:r?"Pesquisando na web...":"Resultados da pesquisa:"})]}),s&&e.jsxs("p",{className:"text-xs text-blue-600 mb-2",children:[e.jsx("strong",{children:"Consulta:"}),' "',s,'"']}),r?e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("div",{className:"flex gap-1",children:[1,2,3].map(t=>e.jsx("div",{className:"w-2 h-2 bg-blue-400 rounded-full animate-pulse",style:{animationDelay:`${t*.2}s`}},t))}),e.jsx("span",{className:"text-xs text-blue-600",children:"Buscando informações..."})]}):e.jsx("div",{className:"space-y-2",children:a.slice(0,3).map((t,n)=>e.jsxs("div",{className:"flex items-start gap-2 p-2 bg-white rounded border",children:[e.jsx("div",{className:"flex-shrink-0 mt-0.5",children:t.favicon?e.jsx("img",{src:t.favicon,alt:"",className:"w-4 h-4",onError:c=>{c.currentTarget.style.display="none"}}):e.jsx(Le,{className:"w-4 h-4 text-gray-400"})}),e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsx("h4",{className:"text-xs font-medium text-gray-900 truncate",children:t.title}),e.jsx("p",{className:"text-xs text-gray-600 line-clamp-2",children:t.snippet}),e.jsxs("a",{href:t.url,target:"_blank",rel:"noopener noreferrer",className:"text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1",children:[e.jsx(ae,{className:"w-3 h-3"}),"Ver fonte"]})]})]},n))})]}),Za=({sources:r,isSearching:a})=>a?e.jsxs("div",{className:"mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg",children:[e.jsxs("div",{className:"flex items-center gap-2 mb-2",children:[e.jsx(_e,{className:"h-4 w-4 text-blue-600"}),e.jsx("span",{className:"text-sm font-medium text-blue-800",children:"Pesquisando em múltiplas fontes..."})]}),e.jsx("div",{className:"flex gap-2 flex-wrap",children:r.map((s,t)=>e.jsxs("div",{className:"flex items-center gap-1 px-2 py-1 bg-white rounded border text-xs text-gray-600",children:[e.jsx(Le,{className:"w-3 h-3"}),s]},t))})]}):null,Ya=({platform:r,platformName:a,icon:s,onSkip:t,onSuccess:n})=>{const[c,d]=g.useState(!1),[b,h]=g.useState("idle"),E=async()=>{d(!0),h("connecting");try{const{data:{session:N}}=await w.auth.getSession();if(!N)throw new Error("Você precisa estar logado");const u=await fetch("https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/oauth-init",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${N.access_token}`},body:JSON.stringify({platform:r.toUpperCase(),redirectUrl:`${window.location.origin}/oauth/callback`})});if(!u.ok)throw new Error("Falha ao iniciar conexão");const{authUrl:p}=await u.json(),x=600,I=700,_=window.screen.width/2-x/2,Z=window.screen.height/2-I/2,O=window.open(p,"oauth-popup",`width=${x},height=${I},left=${_},top=${Z}`),T=V=>{var L,B;((L=V.data)==null?void 0:L.type)==="oauth-success"?(h("success"),d(!1),O==null||O.close(),n==null||n(),window.removeEventListener("message",T)):((B=V.data)==null?void 0:B.type)==="oauth-error"&&(h("error"),d(!1),O==null||O.close(),window.removeEventListener("message",T))};window.addEventListener("message",T),setTimeout(()=>{c&&(h("error"),d(!1),O==null||O.close())},5*60*1e3)}catch(N){console.error("Erro ao conectar:",N),h("error"),d(!1)}},C=()=>s||{facebook:"📘",meta:"📘",google:"🔍",linkedin:"💼",tiktok:"🎵",twitter:"🐦",canva:"🎨",instagram:"📸"}[r.toLowerCase()]||"🔗";return e.jsxs("div",{className:"my-4 animate-in fade-in slide-in-from-bottom-2 duration-300",children:[e.jsx("div",{className:"mb-3",children:e.jsxs("p",{className:"text-sm text-gray-700",children:["Vou conectar sua conta do ",e.jsx("strong",{children:a})," ao SyncAds."]})}),c&&e.jsxs("div",{className:"flex items-center gap-2 mb-3 text-sm text-blue-600",children:[e.jsx("span",{className:"text-2xl",children:C()}),e.jsxs("span",{children:["Connecting ",a,"..."]}),e.jsx(ee,{className:"h-4 w-4 animate-spin"})]}),e.jsx(H,{className:"border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow",children:e.jsxs(W,{className:"p-5",children:[e.jsx("div",{className:"mb-4",children:e.jsxs("p",{className:"text-sm text-gray-600 leading-relaxed",children:["I'll need to connect your ",e.jsx("strong",{className:"text-gray-900",children:a})," account to continue."]})}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(D,{onClick:()=>t==null?void 0:t(),variant:"ghost",disabled:c,className:"text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all",children:"Skip"}),e.jsx(D,{onClick:E,disabled:c,className:"flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-60 disabled:transform-none",children:c?e.jsxs(e.Fragment,{children:[e.jsx(ee,{className:"mr-2 h-4 w-4 animate-spin"}),"Connecting..."]}):e.jsxs(e.Fragment,{children:[e.jsx("span",{className:"mr-2 text-xl",children:C()}),"Connect ",a,e.jsx(ae,{className:"ml-2 h-4 w-4"})]})})]}),e.jsx("div",{className:"mt-4 pt-4 border-t border-gray-100",children:e.jsxs("a",{href:"/privacy",target:"_blank",className:"text-xs text-gray-400 hover:text-blue-600 flex items-center gap-1 transition-colors",children:[e.jsx("svg",{className:"h-3 w-3",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"})}),"How we handle your data",e.jsx(ae,{className:"h-3 w-3"})]})}),b==="success"&&e.jsx("div",{className:"mt-3 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700",children:"✅ Conectado com sucesso!"}),b==="error"&&e.jsx("div",{className:"mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700",children:"❌ Erro ao conectar. Tente novamente."})]})})]})},Ja=({downloadUrl:r,fileName:a,expiresAt:s,fileCount:t,campaignName:n,platform:c,period:d})=>{const b=()=>{const E=document.createElement("a");E.href=r,E.download=a,document.body.appendChild(E),E.click(),document.body.removeChild(E)},h=E=>{const C=new Date(E),N=new Date,u=C.getTime()-N.getTime(),p=Math.floor(u/(1e3*60*60)),x=Math.floor(u%(1e3*60*60)/(1e3*60));return p>0?`${p}h ${x}min`:`${x}min`};return e.jsx(H,{className:"w-full max-w-md bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200",children:e.jsx(W,{className:"p-4",children:e.jsxs("div",{className:"flex items-start gap-3",children:[e.jsx("div",{className:"flex-shrink-0",children:e.jsx($e,{className:"h-8 w-8 text-blue-600"})}),e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsxs("div",{className:"flex items-center gap-2 mb-2",children:[e.jsx("h4",{className:"font-medium text-gray-900 truncate",children:a}),e.jsxs(Ne,{variant:"secondary",className:"text-xs",children:[t," arquivo",t!==1?"s":""]})]}),e.jsxs("div",{className:"space-y-1 mb-3",children:[n&&e.jsxs("p",{className:"text-sm text-gray-600",children:[e.jsx("span",{className:"font-medium",children:"Campanha:"})," ",n]}),c&&e.jsxs("p",{className:"text-sm text-gray-600",children:[e.jsx("span",{className:"font-medium",children:"Plataforma:"})," ",c]}),d&&e.jsxs("p",{className:"text-sm text-gray-600",children:[e.jsx("span",{className:"font-medium",children:"Período:"})," ",d]})]}),e.jsxs("div",{className:"flex items-center gap-1 text-xs text-orange-600 mb-3",children:[e.jsx(fa,{className:"h-3 w-3"}),e.jsxs("span",{children:["Expira em ",h(s)]})]}),e.jsxs("div",{className:"flex gap-2",children:[e.jsxs(D,{onClick:b,size:"sm",className:"flex-1",children:[e.jsx(ze,{className:"h-4 w-4 mr-2"}),"Baixar"]}),e.jsx(D,{variant:"outline",size:"sm",onClick:()=>window.open(r,"_blank"),children:e.jsx(ae,{className:"h-4 w-4"})})]})]})]})})})},es=({downloads:r})=>r.length===0?null:e.jsxs("div",{className:"space-y-3",children:[e.jsxs("h3",{className:"text-sm font-medium text-gray-700 flex items-center gap-2",children:[e.jsx($e,{className:"h-4 w-4"}),"Downloads Disponíveis (",r.length,")"]}),e.jsx("div",{className:"space-y-2",children:r.map((a,s)=>e.jsx(Ja,{...a},s))})]}),as=({result:r,onDownload:a,onRetry:s})=>{var C,N;const[t,n]=g.useState(0),[c,d]=g.useState(!0);g.useEffect(()=>{if(r.steps&&r.steps.length>0){const u=setInterval(()=>{n(p=>p<r.steps.length-1?p+1:(d(!1),clearInterval(u),p))},1e3);return()=>clearInterval(u)}},[r.steps]);const b=(u,p)=>p<t?u.status==="completed"?e.jsx(xe,{className:"h-4 w-4 text-green-600"}):e.jsx(ce,{className:"h-4 w-4 text-red-600"}):p===t?u.status==="running"?e.jsx(ee,{className:"h-4 w-4 text-blue-600 animate-spin"}):u.status==="completed"?e.jsx(xe,{className:"h-4 w-4 text-green-600"}):e.jsx(ce,{className:"h-4 w-4 text-red-600"}):e.jsx("div",{className:"h-4 w-4 rounded-full border-2 border-gray-300"}),h=(u,p)=>p<t?u.status==="completed"?"completed":"failed":p===t?u.status:"pending",E=r.steps?Math.round(t/r.steps.length*100):100;return e.jsxs(H,{className:"w-full max-w-2xl mx-auto",children:[e.jsxs(ia,{children:[e.jsxs(ca,{className:"flex items-center gap-2",children:[r.success?e.jsx(xe,{className:"h-5 w-5 text-green-600"}):e.jsx(ce,{className:"h-5 w-5 text-red-600"}),e.jsx("span",{className:r.success?"text-green-600":"text-red-600",children:r.success?"Execução Concluída":"Execução Falhou"})]}),e.jsx("p",{className:"text-sm text-gray-600",children:r.message})]}),e.jsxs(W,{className:"space-y-4",children:[e.jsxs("div",{className:"space-y-2",children:[e.jsxs("div",{className:"flex justify-between text-sm",children:[e.jsx("span",{children:"Progresso"}),e.jsxs("span",{children:[E,"%"]})]}),e.jsx(xa,{value:E,className:"h-2"})]}),r.steps&&r.steps.length>0&&e.jsxs("div",{className:"space-y-3",children:[e.jsx("h4",{className:"text-sm font-medium text-gray-700",children:"Etapas de Execução:"}),e.jsx("div",{className:"space-y-2",children:r.steps.map((u,p)=>{const x=h(u,p),I=p===t;return e.jsxs("div",{className:`flex items-start gap-3 p-3 rounded-lg transition-all ${I?"bg-blue-50 border border-blue-200":""} ${x==="completed"?"bg-green-50":""} ${x==="failed"?"bg-red-50":""}`,children:[b(u,p),e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{className:`text-sm font-medium ${x==="completed"?"text-green-700":x==="failed"?"text-red-700":x==="running"?"text-blue-700":"text-gray-700"}`,children:u.step}),e.jsx(Ne,{variant:x==="completed"?"default":x==="failed"?"destructive":x==="running"?"secondary":"outline",className:"text-xs",children:x==="completed"?"Concluído":x==="failed"?"Falhou":x==="running"?"Executando":"Pendente"})]}),u.details&&e.jsx("p",{className:"text-xs text-gray-600 mt-1",children:u.details}),u.error&&e.jsxs("div",{className:"flex items-center gap-1 mt-1",children:[e.jsx(va,{className:"h-3 w-3 text-red-500"}),e.jsx("p",{className:"text-xs text-red-600",children:u.error})]})]})]},p)})})]}),r.nextActions&&r.nextActions.length>0&&e.jsxs("div",{className:"space-y-2",children:[e.jsx("h4",{className:"text-sm font-medium text-gray-700",children:"Sugestões:"}),e.jsx("ul",{className:"space-y-1",children:r.nextActions.map((u,p)=>e.jsxs("li",{className:"flex items-center gap-2 text-xs text-gray-600",children:[e.jsx("div",{className:"h-1 w-1 bg-gray-400 rounded-full"}),u]},p))})]}),r.data&&e.jsxs("div",{className:"space-y-2",children:[e.jsx("h4",{className:"text-sm font-medium text-gray-700",children:"Resultado:"}),e.jsx("div",{className:"bg-gray-50 p-3 rounded-lg",children:e.jsx("pre",{className:"text-xs text-gray-600 whitespace-pre-wrap",children:JSON.stringify(r.data,null,2)})})]}),e.jsxs("div",{className:"flex gap-2 pt-4",children:[((C=r.data)==null?void 0:C.downloadUrl)&&a&&e.jsxs(D,{onClick:()=>a(r.data.downloadUrl,r.data.fileName),className:"flex-1",children:[e.jsx(ze,{className:"h-4 w-4 mr-2"}),"Baixar Arquivo"]}),((N=r.data)==null?void 0:N.url)&&e.jsxs(D,{variant:"outline",onClick:()=>window.open(r.data.url,"_blank"),children:[e.jsx(ae,{className:"h-4 w-4 mr-2"}),"Ver Site"]}),!r.success&&s&&e.jsx(D,{variant:"outline",onClick:s,children:"Tentar Novamente"})]})]})]})},ss=({toolName:r,parameters:a,userId:s,organizationId:t,conversationId:n,onComplete:c})=>{const[d,b]=g.useState(null),[h,E]=g.useState(!1),[C,N]=g.useState(null),u=async()=>{E(!0),N(null),b(null);try{const{data:p,error:x}=await supabase.functions.invoke("super-ai-tools",{body:{toolName:r,parameters:a,userId:s,organizationId:t,conversationId:n}});if(x)throw new Error(x.message);const I=p;b(I),c&&c(I)}catch(p){N(p instanceof Error?p.message:"Erro desconhecido")}finally{E(!1)}};return g.useEffect(()=>{u()},[]),h?e.jsx(H,{className:"w-full max-w-2xl mx-auto",children:e.jsx(W,{className:"p-6",children:e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx(ee,{className:"h-5 w-5 animate-spin text-blue-600"}),e.jsxs("div",{children:[e.jsxs("h3",{className:"font-medium",children:["Executando ",r]}),e.jsx("p",{className:"text-sm text-gray-600",children:"Processando solicitação..."})]})]})})}):C?e.jsx(H,{className:"w-full max-w-2xl mx-auto",children:e.jsxs(W,{className:"p-6",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx(ce,{className:"h-5 w-5 text-red-600"}),e.jsxs("div",{children:[e.jsx("h3",{className:"font-medium text-red-600",children:"Erro na Execução"}),e.jsx("p",{className:"text-sm text-gray-600",children:C})]})]}),e.jsx(D,{onClick:u,className:"mt-4",children:"Tentar Novamente"})]})}):d?e.jsx(as,{result:d,onDownload:(p,x)=>{const I=document.createElement("a");I.href=p,I.download=x,document.body.appendChild(I),I.click(),document.body.removeChild(I)},onRetry:u}):null},ts=`
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
`;class rs{constructor(a){fe(this,"userId");this.userId=a}async executeSQL(a){try{if(/DROP|TRUNCATE|DELETE\s+FROM\s+"User"|DELETE\s+FROM\s+"Campaign"/i.test(a))return{success:!1,error:"Query perigosa detectada. Confirmação necessária.",message:"⚠️ Esta query pode ser destrutiva. Por favor, confirme explicitamente."};const{data:t,error:n}=await w.rpc("execute_admin_query",{query_text:a});return n?{success:!1,error:n.message,message:`❌ Erro ao executar SQL: ${n.message}`}:{success:!0,data:t,message:`✅ Query executada com sucesso. ${Array.isArray(t)?t.length:0} registros retornados.`}}catch(s){return{success:!1,error:s.message,message:`❌ Erro: ${s.message}`}}}async analyzeSystem(a,s){try{let t="",n="";switch(a){case"metrics":t=`
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
            WHERE created_at >= NOW() - INTERVAL '${s==="24h"?"1 day":s==="7d"?"7 days":"30 days"}'
          `,n="⚡ Análise de performance";break;case"usage":t=`
            SELECT 
              DATE(created_at) as date,
              COUNT(*) as messages_count
            FROM "ChatMessage"
            WHERE created_at >= NOW() - INTERVAL '${s==="24h"?"1 day":s==="7d"?"7 days":"30 days"}'
            GROUP BY DATE(created_at)
            ORDER BY date DESC
          `,n="📈 Análise de uso";break;case"errors":return{success:!0,data:{errors:0},message:"✅ Sistema de logging de erros a ser implementado"}}const{data:c,error:d}=await w.rpc("execute_admin_query",{query_text:t});if(d)throw d;return{success:!0,data:c,message:`${n} - Período: ${s}`}}catch(t){return{success:!1,error:t.message,message:`❌ Erro ao analisar sistema: ${t.message}`}}}async manageIntegration(a,s,t){try{switch(a){case"test":return{success:!0,message:`🔍 Testando integração com ${s}... (A implementar com APIs reais)`,data:{status:"pending"}};case"connect":const{data:n,error:c}=await w.from("Integration").insert({userId:this.userId,platform:s.toUpperCase(),credentials:t||{},isConnected:!1,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}).select().single();if(c)throw c;return{success:!0,data:n,message:`✅ Integração com ${s} iniciada. Configure as credenciais.`};case"disconnect":return await w.from("Integration").update({isConnected:!1}).eq("platform",s.toUpperCase()).eq("userId",this.userId),{success:!0,message:`✅ Integração com ${s} desconectada.`};default:return{success:!1,error:"Ação desconhecida",message:"❌ Ação não reconhecida"}}}catch(n){return{success:!1,error:n.message,message:`❌ Erro ao gerenciar integração: ${n.message}`}}}async getMetrics(a,s,t){try{let n="",c="*";switch(a){case"users":n="User";break;case"campaigns":n="Campaign";break;case"messages":n="ChatMessage";break;default:return{success:!1,error:"Métrica desconhecida",message:"❌ Métrica não reconhecida"}}const d=`
        SELECT 
          DATE_TRUNC('${t}', created_at) as period,
          ${s==="count"?"COUNT(*)":s==="sum"?"SUM(1)":"AVG(1)"} as value
        FROM "${n}"
        GROUP BY period
        ORDER BY period DESC
        LIMIT 30
      `,{data:b,error:h}=await w.rpc("execute_admin_query",{query_text:d});if(h)throw h;return{success:!0,data:b,message:`📊 Métricas de ${a} agrupadas por ${t}`}}catch(n){return{success:!1,error:n.message,message:`❌ Erro ao obter métricas: ${n.message}`}}}}function os(r){const a=/```admin-sql\s*\n([\s\S]*?)```/,s=r.match(a);return s?s[1].trim():null}function ns(r){const a=/```admin-analyze\s*\n([\s\S]*?)```/,s=r.match(a);if(!s)return null;try{return JSON.parse(s[1].trim())}catch{return null}}function is(r){const a=/```admin-integration\s*\n([\s\S]*?)```/,s=r.match(a);if(!s)return null;try{return JSON.parse(s[1].trim())}catch{return null}}function cs(r){const a=/```admin-metrics\s*\n([\s\S]*?)```/,s=r.match(a);if(!s)return null;try{return JSON.parse(s[1].trim())}catch{return null}}function ds(r){return r.replace(/```admin-sql\s*\n[\s\S]*?```/g,"").replace(/```admin-analyze\s*\n[\s\S]*?```/g,"").replace(/```admin-integration\s*\n[\s\S]*?```/g,"").replace(/```admin-metrics\s*\n[\s\S]*?```/g,"").replace(/```admin-logs\s*\n[\s\S]*?```/g,"").replace(/```admin-test-api\s*\n[\s\S]*?```/g,"").replace(/```admin-debug\s*\n[\s\S]*?```/g,"").trim()}function ls(r){const a=/```integration-connect:(\w+)```/,s=r.match(a);return s?{action:"connect",slug:s[1]}:null}function ms(r){const a=/```integration-disconnect:(\w+)```/,s=r.match(a);return s?{action:"disconnect",slug:s[1]}:null}function us(r){const a=/```integration-status(?::(\w+))?```/,s=r.match(a);return s?{action:"status",slug:s[1]}:null}function gs(r){return ls(r)||ms(r)||us(r)}function ps(r){return r.replace(/```integration-connect:\w+```/g,"").replace(/```integration-disconnect:\w+```/g,"").replace(/```integration-status(?::\w+)?```/g,"").trim()}const hs=`
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
`,fs=`
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
`;class xs{constructor(a){fe(this,"userId");this.userId=a}async auditIntegration(a){try{const{data:s,error:t}=await w.from("Integration").select("*").eq("userId",this.userId).eq("platform",a).single();if(t&&t.code!=="PGRST116")throw t;const n=this.getCapabilities(a),c=s&&s.isConnected?"connected":"disconnected",d={platform:a,status:c,lastSync:(s==null?void 0:s.lastSyncAt)||void 0,capabilities:n,issues:this.detectIssues(s,a),recommendations:this.getRecommendations(c,a)};return{success:!0,data:d,message:this.formatAuditMessage(d)}}catch(s){return{success:!1,error:s.message,message:`❌ Erro ao auditar ${a}: ${s.message}`}}}async auditAll(){try{const a=["META_ADS","GOOGLE_ADS","LINKEDIN_ADS","TIKTOK_ADS","TWITTER_ADS"],s=[];for(const t of a){const n=await this.auditIntegration(t);n.success&&n.data&&s.push(n.data)}return{success:!0,data:s,message:this.formatAllAuditsMessage(s)}}catch(a){return{success:!1,error:a.message,message:`❌ Erro ao auditar integrações: ${a.message}`}}}async listStatus(){try{const{data:a,error:s}=await w.from("Integration").select("platform, isConnected, lastSyncAt").eq("userId",this.userId);if(s)throw s;const t=new Map((a==null?void 0:a.map(d=>[d.platform,d]))||[]),c=["META_ADS","GOOGLE_ADS","LINKEDIN_ADS","TIKTOK_ADS","TWITTER_ADS"].map(d=>{var b,h;return{platform:d,status:t.has(d)&&((b=t.get(d))!=null&&b.isConnected)?"✅ Conectada":"❌ Desconectada",lastSync:((h=t.get(d))==null?void 0:h.lastSyncAt)||"Nunca"}});return{success:!0,data:c,message:this.formatStatusList(c)}}catch(a){return{success:!1,error:a.message,message:`❌ Erro ao listar status: ${a.message}`}}}getCapabilities(a){return{META_ADS:["Criar campanhas de Facebook e Instagram","Segmentação avançada de audiência","Análise de performance em tempo real","Otimização automática de orçamento","A/B testing de criativos","Remarketing e lookalike audiences"],GOOGLE_ADS:["Campanhas de Pesquisa (Search)","Anúncios Display e YouTube","Shopping Ads para e-commerce","Campanhas Performance Max","Análise de conversões e ROI","Smart Bidding automático"],LINKEDIN_ADS:["Anúncios B2B segmentados","Targeting por cargo e empresa","Lead Gen Forms nativos","InMail patrocinado","Análise de engajamento profissional","Retargeting de visitantes"],TIKTOK_ADS:["Vídeos In-Feed","TopView e Brand Takeover","Spark Ads (boost orgânico)","Segmentação por interesse e comportamento","Píxel de conversão","Catálogo de produtos"],TWITTER_ADS:["Tweets promovidos","Segmentação por hashtags e interesse","Audiências customizadas","Análise de engajamento","Campanhas de instalação de app","Vídeos e carrosséis"]}[a]||["Capacidades a definir"]}detectIssues(a,s){const t=[];if(!a)return t.push("Integração não configurada"),t;if(a.isConnected||t.push("Integração desconectada - configure credenciais"),(!a.credentials||Object.keys(a.credentials).length===0)&&t.push("Credenciais não configuradas"),a.lastSync){const n=new Date(a.lastSync),c=(Date.now()-n.getTime())/(1e3*60*60);c>24&&t.push(`Última sincronização há ${Math.floor(c)} horas - pode estar desatualizado`)}return t}getRecommendations(a,s){const t=[];return a==="disconnected"&&(t.push(`Conecte ${this.formatPlatformName(s)} em: Configurações → Integrações`),t.push("Configure sua chave de API para começar a usar")),a==="connected"&&(t.push("✅ Integração ativa! Você já pode criar campanhas"),t.push("Explore as capacidades disponíveis desta plataforma")),t}formatPlatformName(a){return{META_ADS:"Meta Ads (Facebook/Instagram)",GOOGLE_ADS:"Google Ads",LINKEDIN_ADS:"LinkedIn Ads",TIKTOK_ADS:"TikTok Ads",TWITTER_ADS:"Twitter Ads (X)"}[a]||a}formatAuditMessage(a){let t=`
**${a.status==="connected"?"✅":"❌"} ${this.formatPlatformName(a.platform)}**
`;return t+=`Status: ${a.status==="connected"?"✅ Conectada":"❌ Desconectada"}
`,a.lastSync&&(t+=`Última sincronização: ${a.lastSync}
`),t+=`
**Capacidades:**
`,a.capabilities.forEach(n=>{t+=`• ${n}
`}),a.issues&&a.issues.length>0&&(t+=`
**⚠️ Problemas detectados:**
`,a.issues.forEach(n=>{t+=`• ${n}
`})),a.recommendations&&a.recommendations.length>0&&(t+=`
**💡 Recomendações:**
`,a.recommendations.forEach(n=>{t+=`• ${n}
`})),t}formatAllAuditsMessage(a){let s=`
# 🔍 AUDITORIA COMPLETA DE INTEGRAÇÕES

`;const t=a.filter(c=>c.status==="connected").length,n=a.length;return s+=`**Resumo:** ${t}/${n} integrações ativas

`,s+=`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`,a.forEach(c=>{s+=this.formatAuditMessage(c),s+=`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`}),t<n?(s+=`
**🎯 Próximos Passos:**
`,s+=`1. Conecte as ${n-t} integrações pendentes
`,s+=`2. Configure suas chaves de API
`,s+=`3. Teste cada integração antes de criar campanhas
`):s+=`
**🎉 Parabéns!** Todas as integrações estão configuradas e funcionando!
`,s}formatStatusList(a){let s=`
**📊 Status das Integrações:**

`;return a.forEach(t=>{s+=`${t.status} **${this.formatPlatformName(t.platform)}**
`,s+=`   └─ Última sync: ${t.lastSync}

`}),s}}function vs(r){const a=/```integration-action\s*\n([\s\S]*?)```/,s=r.match(a);if(!s)return null;try{return JSON.parse(s[1].trim())}catch{return null}}function Ss(r){return r.replace(/```integration-action\s*\n[\s\S]*?```/g,"").trim()}function As(r,a){const s=r.toLowerCase(),t=a.toLowerCase(),n=(s.includes("auditor")||s.includes("verificar")||s.includes("status")||s.includes("listar"))&&(s.includes("integra")||s.includes("conex")||s.includes("plataforma")),c=t.includes("vou")&&(t.includes("auditor")||t.includes("verificar"));if(!n||!c)return null;const d={facebook:"META_ADS",instagram:"META_ADS",meta:"META_ADS",google:"GOOGLE_ADS",linkedin:"LINKEDIN_ADS",tiktok:"TIKTOK_ADS",twitter:"TWITTER_ADS"};for(const[b,h]of Object.entries(d))if(s.includes(b))return{action:"audit",platform:h};return{action:"audit_all"}}const bs=["Criar campanha de Facebook Ads","Analisar performance da última semana","Sugerir otimizações"],ie=500,zs=()=>{const[r,a]=g.useState(""),[s,t]=g.useState(!0),[n,c]=g.useState(null),[d,b]=g.useState(!1),[h,E]=g.useState([]),[C,N]=g.useState(""),[u,p]=g.useState([]),[x,I]=g.useState([]),[_,Z]=g.useState([]),[O,T]=g.useState(null),[V,L]=g.useState(""),[B,se]=g.useState([]),[de,ye]=g.useState(!1),[Es,Ge]=g.useState(null),le=g.useRef(null),me=g.useRef([]),l=da(o=>o.user),ue=q(o=>o.conversations),y=q(o=>o.activeConversationId),ge=q(o=>o.setActiveConversationId),te=q(o=>o.isAssistantTyping),Ce=q(o=>o.setAssistantTyping),X=q(o=>o.addMessage);q(o=>o.deleteConversation),q(o=>o.createNewConversation);const Fe=la(o=>o.addCampaign),Ue=Me(o=>o.aiSystemPrompt),Be=Me(o=>o.aiInitialGreetings),Ie=g.useRef(null),je=g.useRef(null),{toast:v}=ma(),z=ue.find(o=>o.id===y),Ve=()=>{var o;(o=Ie.current)==null||o.scrollIntoView({behavior:"smooth"})};g.useEffect(Ve,[z==null?void 0:z.messages,te]),g.useEffect(()=>{(async()=>{if(l)try{const{data:i,error:m}=await w.from("GlobalAiConnection").select("id, systemPrompt, initialGreetings").eq("isActive",!0).limit(1).single();if(m){console.error("Erro ao buscar IA:",m);return}const f=i==null?void 0:i.id;if(f){const{data:S,error:P}=await w.from("GlobalAiConnection").select("systemPrompt, initialGreetings").eq("id",f).single();if(P){console.error("Erro ao buscar config da IA:",P);return}S&&c({systemPrompt:S.systemPrompt||Ue,initialGreetings:S.initialGreetings||Be})}}catch(i){console.error("Erro ao carregar IA Global:",i)}})()},[l==null?void 0:l.organizationId]),g.useEffect(()=>{if(z&&z.messages.length===0){const o=Ka();setTimeout(()=>{l&&X(l.id,y,{id:`greeting-${Date.now()}`,role:"assistant",content:o})},500)}},[y,z==null?void 0:z.messages.length]);const He=o=>{const i=/ZIP_DOWNLOAD:\s*({[^}]+})/g,m=o.match(i);return m&&m.forEach(f=>{try{const S=f.replace("ZIP_DOWNLOAD:","").trim(),P=JSON.parse(S);I($=>[...$,P])}catch(S){console.error("Erro ao processar download ZIP:",S)}}),o.replace(i,"").trim()},We=o=>{const i=/SUPER_AI_EXECUTION:\s*({[^}]+})/g,m=o.match(i);return m&&m.forEach(f=>{try{const S=f.replace("SUPER_AI_EXECUTION:","").trim(),P=JSON.parse(S);Z($=>[...$,P])}catch(S){console.error("Erro ao processar execução Super AI:",S)}}),o.replace(i,"").trim()},pe=async()=>{if(r.trim()===""||!y||r.length>ie)return;const o=r,i=o.toLowerCase();if(i.includes("pesquis")||i.includes("busca")||i.includes("google")||i.includes("internet")){T("web_search");let m=o;if(i.includes("pesquis")){const f=o.match(/pesquis[ae]\s+(.+)/i);m=f?f[1]:o}L(`Pesquisando na web sobre: "${m}"`),se(["Google Search","Exa AI","Tavily"])}else if(i.includes("baix")||i.includes("rasp")||i.includes("scrape")){T("web_scraping");const m=o.match(/https?:\/\/[^\s]+/i);L(m?`Raspando dados de: ${m[0]}`:"Raspando dados...")}else i.includes("python")||i.includes("calcule")||i.includes("execute código")?(T("python_exec"),L("Executando código Python para processar dados...")):(T(null),L("Processando sua solicitação..."),se([]));l&&X(l.id,y,{id:`msg-${Date.now()}`,role:"user",content:o}),a(""),t(!1),Ce(!0);try{const m=ue.find(A=>A.id===y),f=(n==null?void 0:n.systemPrompt)||Qa,S=ts+`

`+Va+`

`+hs+`

`+fs+`

`+f,P=((m==null?void 0:m.messages)||[]).slice(-20).map(A=>({role:A.role,content:A.content})),R=(await ha(o,y,P,S)).response,G=Ha(R);if(G)try{l&&(await Fe(l.id,{name:G.data.name,platform:G.data.platform,status:"Pausada",budgetTotal:G.data.budgetTotal,budgetSpent:0,impressions:0,clicks:0,conversions:0,startDate:G.data.startDate,endDate:G.data.endDate||"",ctr:0,cpc:0}),v({title:"🎉 Campanha Criada!",description:`A campanha "${G.data.name}" foi criada com sucesso.`}))}catch(A){console.error("Error creating campaign from AI:",A),v({title:"Erro ao criar campanha",description:"Não foi possível criar a campanha automaticamente.",variant:"destructive"})}let Y="";if(l){const A=new rs(l.id),F=os(R);if(F){const j=await A.executeSQL(F);v({title:j.success?"✅ SQL Executado":"❌ Erro SQL",description:j.message,variant:j.success?"default":"destructive"})}const J=ns(R);if(J){const j=await A.analyzeSystem(J.type,J.period);v({title:j.success?"📊 Análise Concluída":"❌ Erro",description:j.message,variant:j.success?"default":"destructive"})}const re=is(R);if(re){const j=await A.manageIntegration(re.action,re.platform,re.credentials);v({title:j.success?"🔗 Integração Atualizada":"❌ Erro",description:j.message,variant:j.success?"default":"destructive"})}const oe=cs(R);if(oe){const j=await A.getMetrics(oe.metric,oe.aggregation,oe.groupBy);v({title:j.success?"📈 Métricas Obtidas":"❌ Erro",description:j.message,variant:j.success?"default":"destructive"})}let K=vs(R);if(K||(K=As(o,R)),K){const j=new xs(l.id);let U;switch(K.action){case"audit":K.platform&&(U=await j.auditIntegration(K.platform));break;case"audit_all":U=await j.auditAll();break;case"list_status":U=await j.listStatus();break;case"test":case"capabilities":case"diagnose":U={success:!0,message:`Ação "${K.action}" detectada. Implementação em andamento.`};break}U&&(Y=`

`+U.message,v({title:U.success?"✅ Ação Executada":"❌ Erro",description:U.success?"Auditoria concluída com sucesso":U.error||"Erro ao executar ação",variant:U.success?"default":"destructive"}))}}const M=gs(R);if(M&&l)try{if(M.action==="connect"){const{authUrl:A}=await ne.generateOAuthUrl(M.slug,l.id),F=Se[M.slug];l&&X(l.id,y,{id:`msg-${Date.now()+1}`,role:"assistant",content:`Para conectar ${F.name}, clique no link abaixo:

🔗 [Autorizar ${F.name}](${A})

O link abrirá em uma nova aba para você autorizar o acesso.`}),window.open(A,"_blank"),v({title:"🔗 Link de Autorização",description:`Clique no link para conectar ${F.name}`});return}else if(M.action==="disconnect"){await ne.disconnect(l.id,M.slug);const A=Se[M.slug];v({title:"✅ Desconectado",description:`${A.name} foi desconectado com sucesso.`})}else if(M.action==="status")if(M.slug){const A=await ne.getIntegrationStatus(l.id,M.slug),F=Se[M.slug];v({title:`${F.name}`,description:A!=null&&A.isConnected?"✅ Conectado":"❌ Não conectado"})}else{const A=await ne.listIntegrations(l.id),F=A.filter(J=>J.isConnected).length;v({title:"📊 Status das Integrações",description:`${F} de ${A.length} integrações conectadas`})}}catch(A){console.error("Erro ao processar integração:",A),l&&X(l.id,y,{id:`msg-${Date.now()+2}`,role:"assistant",content:`❌ **Erro ao conectar integração**

${A.message||"Erro ao processar comando de integração"}`}),v({title:"❌ Erro na Integração",description:"Verifique as instruções no chat",variant:"destructive"})}let he=He(R);he=We(he);let Q=Wa(he);Q=ds(Q),Q=ps(Q),Q=Ss(Q),l&&X(l.id,y,{id:`msg-${Date.now()+1}`,role:"assistant",content:Q+Y})}catch(m){console.error("Erro ao chamar IA:",m),v({title:"Erro ao gerar resposta",description:m.message||"Não foi possível obter resposta da IA. Verifique sua chave de API.",variant:"destructive"}),l&&X(l.id,y,{id:`msg-${Date.now()+1}`,role:"assistant",content:"❌ Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, verifique se sua chave de API está configurada corretamente nas configurações."})}finally{Ce(!1)}},Qe=o=>{a(o)},Ke=()=>{var o;(o=je.current)==null||o.click()},Xe=async()=>{try{const o=await navigator.mediaDevices.getUserMedia({audio:!0}),i=new MediaRecorder(o);le.current=i,me.current=[],i.ondataavailable=m=>{m.data.size>0&&me.current.push(m.data)},i.onstop=async()=>{const m=new Blob(me.current,{type:"audio/webm"});Ge(m),await Ye(m),o.getTracks().forEach(f=>f.stop())},i.start(),ye(!0),v({title:"🎤 Gravando...",description:"Clique novamente para parar e enviar."})}catch(o){console.error("Erro ao iniciar gravação:",o),v({title:"❌ Erro",description:"Não foi possível acessar o microfone.",variant:"destructive"})}},Ze=()=>{le.current&&de&&(le.current.stop(),ye(!1))},Ye=async o=>{if(!(!l||!y))try{v({title:"📤 Enviando áudio...",description:"Aguarde..."});const i=new File([o],`audio-${Date.now()}.webm`,{type:"audio/webm"}),m=`${l.id}/audio-${Date.now()}-${Math.random().toString(36).substring(7)}.webm`,{data:f,error:S}=await w.storage.from("chat-attachments").upload(m,i,{cacheControl:"3600",upsert:!1});if(S)throw S;const{data:{publicUrl:P}}=w.storage.from("chat-attachments").getPublicUrl(m),$=`[🎤 Mensagem de áudio](${P})`;a(R=>R?`${R}

${$}`:$),v({title:"✅ Áudio enviado!",description:"O áudio foi adicionado à mensagem."})}catch(i){console.error("Erro ao enviar áudio:",i),v({title:"❌ Erro",description:"Não foi possível enviar o áudio.",variant:"destructive"})}},Je=async o=>{var m;const i=(m=o.target.files)==null?void 0:m[0];if(!(!i||!l||!y))try{v({title:"📤 Upload iniciado",description:`Enviando "${i.name}"...`});const f=i.name.split(".").pop(),S=`${l.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${f}`,{data:P,error:$}=await w.storage.from("chat-attachments").upload(S,i,{cacheControl:"3600",upsert:!1});if($)throw $;const{data:{publicUrl:R}}=w.storage.from("chat-attachments").getPublicUrl(S),{error:G}=await w.from("ChatAttachment").insert({messageId:"",fileName:i.name,fileType:i.type,fileUrl:R,fileSize:i.size});G&&console.error("Erro ao salvar anexo:",G);const Y=i.type.startsWith("image/")?`![${i.name}](${R})`:`[${i.name}](${R})`,M=r?`${r}

${Y}`:Y;a(""),M.trim()&&y&&pe(),v({title:"✅ Arquivo enviado!",description:`${i.name} foi enviado com sucesso.`})}catch(f){console.error("Erro ao fazer upload:",f),v({title:"❌ Erro ao enviar arquivo",description:f.message||"Não foi possível enviar o arquivo.",variant:"destructive"})}finally{o.target&&(o.target.value="")}},ea=async o=>{try{const{data:i,error:m}=await w.from("ChatMessage").select("id, role, content, createdAt").eq("conversationId",o).order("createdAt",{ascending:!0});if(m)throw m;const f=(i||[]).map(S=>({id:S.id,role:S.role,content:S.content,timestamp:new Date(S.createdAt)}));q.getState().setConversationMessages(o,f),ge(o),console.log(`✅ ${f.length} mensagens carregadas da conversa ${o}`)}catch(i){console.error("Erro ao carregar mensagens:",i),v({title:"Erro",description:"Não foi possível carregar mensagens.",variant:"destructive"})}};g.useEffect(()=>{(async()=>{if(!l)return;await q.getState().loadConversations(l.id);const{data:i}=await w.from("ChatConversation").select("id").eq("userId",l.id).limit(1);(!i||i.length===0)&&await Te()})()},[l]);const Te=async()=>{try{if(!l)return;const{data:o}=await w.from("User").select("organizationId").eq("id",l.id).single();if(!(o!=null&&o.organizationId))throw new Error("Usuário sem organização");const i=crypto.randomUUID(),m=new Date().toISOString(),{error:f}=await w.from("ChatConversation").insert({id:i,userId:l.id,organizationId:o.organizationId,title:"🆕 Nova Conversa",createdAt:m,updatedAt:m});if(f)throw f;ge(i),await q.getState().loadConversations(l.id),v({title:"✅ Nova conversa criada!",description:"Comece um novo chat do zero."})}catch(o){console.error("Erro ao criar nova conversa:",o),v({title:"Erro",description:o.message||"Não foi possível criar nova conversa.",variant:"destructive"})}},aa=async o=>{try{await w.from("ChatMessage").delete().eq("conversationId",o);const{error:i}=await w.from("ChatConversation").delete().eq("id",o);if(i)throw i;y===o&&ge(null),await q.getState().loadConversations(l.id),v({title:"🗑️ Conversa deletada",description:"A conversa foi removida com sucesso."})}catch(i){console.error("Erro ao deletar conversa:",i),v({title:"Erro",description:"Não foi possível deletar a conversa.",variant:"destructive"})}};return e.jsxs("div",{className:"h-[calc(100vh-80px)] flex",children:[e.jsxs("div",{className:`${s?"w-72":"w-0"} transition-all duration-300 bg-gray-50 border-r border-gray-200 flex flex-col overflow-hidden`,children:[e.jsxs("div",{className:"p-4 border-b border-gray-200",children:[e.jsxs("div",{className:"flex items-center justify-between mb-3",children:[e.jsx("h2",{className:"text-sm font-semibold text-gray-700",children:"Conversas"}),e.jsx(D,{onClick:()=>t(!1),variant:"ghost",size:"sm",className:"h-7 w-7 p-0",children:e.jsx(ua,{className:"h-4 w-4"})})]}),e.jsxs(D,{onClick:Te,className:"w-full gap-2",size:"sm",children:[e.jsx(Aa,{className:"h-4 w-4"}),"Nova Conversa"]})]}),e.jsx("div",{className:"flex-1 overflow-y-auto p-2 space-y-1",children:ue.map(o=>e.jsxs("div",{className:`group relative flex items-center gap-2 p-3 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors ${y===o.id?"bg-blue-50 border border-blue-200":"bg-white"}`,onClick:()=>{y!==o.id&&ea(o.id)},children:[e.jsx(ba,{className:"h-4 w-4 text-gray-500 flex-shrink-0"}),e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsx("p",{className:"text-sm font-medium text-gray-900 truncate",children:o.title}),e.jsx("p",{className:"text-xs text-gray-500 truncate",children:o.messages&&o.messages.length>0?o.messages[o.messages.length-1].content.substring(0,50)+"...":"Sem mensagens ainda"})]}),e.jsx(D,{onClick:i=>{i.stopPropagation(),aa(o.id)},variant:"ghost",size:"sm",className:"h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity",children:e.jsx(Ea,{className:"h-3.5 w-3.5 text-red-500"})})]},o.id))})]}),e.jsxs("div",{className:"flex-1 flex flex-col",children:[e.jsx("div",{className:"border-b border-gray-200 bg-white/80 backdrop-blur-xl p-4",children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[!s&&e.jsx(D,{onClick:()=>t(!0),variant:"ghost",size:"sm",className:"h-9 w-9 p-0",children:e.jsx(ga,{className:"h-5 w-5"})}),e.jsx("div",{className:"p-1.5 sm:p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500",children:e.jsx(ve,{className:"h-4 w-4 sm:h-6 sm:w-6 text-white"})}),e.jsxs("div",{children:[e.jsx("h1",{className:"text-base sm:text-xl font-bold text-gray-900",children:"Chat com IA"}),e.jsx("p",{className:"text-xs sm:text-sm text-gray-500",children:"Assistente inteligente"})]})]}),e.jsxs(Ne,{className:"bg-gradient-to-r from-green-500 to-emerald-500 text-xs sm:text-sm",children:[e.jsx(Na,{className:"h-3 w-3 mr-1"}),"Online"]})]})}),e.jsx("div",{className:"flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-4",children:z?e.jsxs(e.Fragment,{children:[(d||h.length>0)&&e.jsx(Xa,{isSearching:d,searchResults:h,searchQuery:C}),u.length>0&&e.jsx(Za,{sources:u,isSearching:d}),x.length>0&&e.jsx("div",{className:"mb-4",children:e.jsx(es,{downloads:x})}),_.length>0&&e.jsx("div",{className:"mb-4 space-y-4",children:_.map((o,i)=>e.jsx(ss,{toolName:o.toolName,parameters:o.parameters,userId:(l==null?void 0:l.id)||"",organizationId:(l==null?void 0:l.organizationId)||"",conversationId:y||"",onComplete:m=>{console.log("Execução Super AI concluída:",m)}},i))}),z.messages.map(o=>{var m;const i=(m=o.content)==null?void 0:m.match(/INTEGRATION_CONNECT:(\w+):([^🔗]+)/);if(i&&o.role==="assistant"){const[,f,S]=i,P=o.content.replace(/🔗 \*\*INTEGRATION_CONNECT:[^🔗]+🔗\*\* 🔗\n\n/,"");return e.jsx("div",{className:"flex justify-start",children:e.jsxs("div",{className:"max-w-[80%]",children:[e.jsx(H,{className:"bg-white mb-2",children:e.jsx(W,{className:"p-4",children:e.jsxs("div",{className:"flex items-start gap-2",children:[e.jsx(ve,{className:"h-5 w-5 text-blue-600 mt-1 flex-shrink-0"}),e.jsx("div",{className:"flex-1 whitespace-pre-wrap break-words text-sm text-gray-900",children:P})]})})}),e.jsx(Ya,{platform:f,platformName:S.trim(),onSkip:()=>{console.log("Conexão pulada:",f)},onSuccess:()=>{console.log("Conectado com sucesso:",f)}})]})},o.id)}return e.jsx("div",{className:`flex ${o.role==="user"?"justify-end":"justify-start"} mb-4`,children:e.jsx(H,{className:`max-w-[85%] sm:max-w-[80%] md:max-w-[75%] lg:max-w-[70%] ${o.role==="user"?"bg-gradient-to-r from-blue-500 to-purple-500 text-white":"bg-white"}`,children:e.jsxs(W,{className:"p-3 sm:p-4",children:[e.jsxs("div",{className:"flex items-start gap-2",children:[o.role==="assistant"&&e.jsx(ve,{className:"h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mt-1 flex-shrink-0"}),e.jsx("div",{className:`flex-1 whitespace-pre-wrap break-words text-xs sm:text-sm ${o.role==="user"?"text-white":"text-gray-900"}`,style:{wordBreak:"break-word",overflowWrap:"break-word"},children:o.content})]}),e.jsx("div",{className:`text-xs mt-2 ${o.role==="user"?"text-white/70":"text-gray-500"}`,children:o.timestamp?new Date(o.timestamp).toLocaleTimeString("pt-BR"):""})]})})},o.id)}),te&&e.jsx(Sa,{isThinking:te,currentTool:O,reasoning:V,sources:B,status:"thinking"}),te&&e.jsx("div",{className:"flex justify-start",children:e.jsx(H,{className:"bg-white",children:e.jsx(W,{className:"p-4",children:e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(ee,{className:"h-4 w-4 animate-spin text-blue-600"}),e.jsx("span",{className:"text-sm text-gray-500",children:"Processando..."})]})})})}),e.jsx("div",{ref:Ie})]}):e.jsx("div",{className:"flex items-center justify-center h-full text-muted-foreground",children:e.jsx("p",{children:"Selecione ou crie uma conversa para começar."})})}),e.jsxs("div",{className:"border-t border-gray-200 p-2 sm:p-4 bg-white/80 backdrop-blur-xl",children:[e.jsx("div",{className:"hidden sm:flex gap-2 mb-2",children:bs.map(o=>e.jsx(D,{variant:"outline",size:"sm",onClick:()=>Qe(o),className:"text-xs",children:o},o))}),e.jsxs("div",{className:"relative",children:[e.jsx(Ua,{value:r,onChange:o=>a(o.target.value),onKeyDown:o=>{o.key==="Enter"&&!o.shiftKey&&(o.preventDefault(),pe())},placeholder:"Digite sua mensagem...",className:"w-full resize-none rounded-lg border bg-background p-2 sm:p-3 pr-16 sm:pr-24 min-h-[40px] sm:min-h-[48px] text-sm",minRows:1,maxRows:5,maxLength:ie}),e.jsxs("div",{className:"absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 flex gap-1",children:[e.jsx("input",{type:"file",ref:je,onChange:Je,className:"hidden"}),e.jsx(D,{type:"button",size:"icon",variant:"ghost",onClick:Ke,className:"h-7 w-7 sm:h-8 sm:w-8",children:e.jsx(Ca,{className:"h-3 w-3 sm:h-4 sm:w-4"})}),e.jsx(D,{type:"button",size:"icon",variant:"ghost",onClick:de?Ze:Xe,disabled:!y,className:`h-7 w-7 sm:h-8 sm:w-8 ${de?"text-red-500 animate-pulse":""}`,children:e.jsx(ya,{className:"h-3 w-3 sm:h-4 sm:w-4"})}),e.jsx(D,{type:"submit",size:"icon",onClick:pe,disabled:r.trim()===""||!y,className:"h-7 w-7 sm:h-8 sm:w-8",children:e.jsx(wa,{className:"h-3 w-3 sm:h-4 sm:w-4"})})]})]}),e.jsxs("p",{className:pa("text-xs text-right mt-1",r.length>ie?"text-destructive":"text-muted-foreground"),children:[r.length," / ",ie]})]})]})]})};export{zs as default};
