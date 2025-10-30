var ta=Object.defineProperty;var ra=(t,a,s)=>a in t?ta(t,a,{enumerable:!0,configurable:!0,writable:!0,value:s}):t[a]=s;var fe=(t,a,s)=>ra(t,typeof a!="symbol"?a+"":a,s);import{c as we,r as u,R as Se,o as oa,p as na,q as ia,j as e,S as ze,t as ae,g as V,l as B,B as T,s as y,n as ee,v as be,h as ca,i as da,w as la,u as ma,x as M,y as ua,f as ga,X as pa,M as ha,a as xe,z as fa}from"./index-BnKEaS9w.js";import{G as $e,S as xa}from"./send-B2ev5-5Q.js";import{E as se}from"./external-link-wrS04hv1.js";import{C as va}from"./clock-B6PjXcdV.js";import{D as Ae}from"./download-Bu2v-A7m.js";import{P as Sa}from"./progress-D3KJ6MvL.js";import{C as ba,A as Aa}from"./AiThinkingIndicator-BHgC9giM.js";import{C as Ee}from"./circle-alert-Do8fCvxE.js";import{C as ye}from"./circle-x-BDuIgMm7.js";import{C as Ea}from"./circle-check-9751CGHZ.js";import{i as ie,I as ve}from"./integrationsService-BpF4gtE-.js";import{P as Na}from"./plus-CmOIaXTZ.js";import{M as wa}from"./message-square-Pb_8haeA.js";import{T as ya}from"./trash-2-Bjr0wOO-.js";import{S as ja}from"./sparkles-BL2MwZub.js";/**
 * @license lucide-react v0.417.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ge=we("FileArchive",[["path",{d:"M10 12v-1",key:"v7bkov"}],["path",{d:"M10 18v-2",key:"1cjy8d"}],["path",{d:"M10 7V6",key:"dljcrl"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M15.5 22H18a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v16a2 2 0 0 0 .274 1.01",key:"gkbcor"}],["circle",{cx:"10",cy:"20",r:"2",key:"1xzdoj"}]]);/**
 * @license lucide-react v0.417.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ca=we("Mic",[["path",{d:"M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z",key:"131961"}],["path",{d:"M19 10v2a7 7 0 0 1-14 0v-2",key:"1vc78b"}],["line",{x1:"12",x2:"12",y1:"19",y2:"22",key:"x3vr5v"}]]);/**
 * @license lucide-react v0.417.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ia=we("Paperclip",[["path",{d:"m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48",key:"1u3ebp"}]]);function Ne(){return Ne=Object.assign?Object.assign.bind():function(t){for(var a=1;a<arguments.length;a++){var s=arguments[a];for(var r in s)({}).hasOwnProperty.call(s,r)&&(t[r]=s[r])}return t},Ne.apply(null,arguments)}function Ta(t,a){if(t==null)return{};var s={};for(var r in t)if({}.hasOwnProperty.call(t,r)){if(a.indexOf(r)!==-1)continue;s[r]=t[r]}return s}var Ra=u.useLayoutEffect,Da=function(a){var s=Se.useRef(a);return Ra(function(){s.current=a}),s},Oe=function(a,s){if(typeof a=="function"){a(s);return}a.current=s},Oa=function(a,s){var r=Se.useRef();return Se.useCallback(function(n){a.current=n,r.current&&Oe(r.current,null),r.current=s,s&&Oe(s,n)},[s])},ke={"min-height":"0","max-height":"none",height:"0",visibility:"hidden",overflow:"hidden",position:"absolute","z-index":"-1000",top:"0",right:"0",display:"block"},ka=function(a){Object.keys(ke).forEach(function(s){a.style.setProperty(s,ke[s],"important")})},Pe=ka,O=null,Me=function(a,s){var r=a.scrollHeight;return s.sizingStyle.boxSizing==="border-box"?r+s.borderSize:r-s.paddingSize};function Pa(t,a,s,r){s===void 0&&(s=1),r===void 0&&(r=1/0),O||(O=document.createElement("textarea"),O.setAttribute("tabindex","-1"),O.setAttribute("aria-hidden","true"),Pe(O)),O.parentNode===null&&document.body.appendChild(O);var n=t.paddingSize,i=t.borderSize,d=t.sizingStyle,b=d.boxSizing;Object.keys(d).forEach(function(p){var E=p;O.style[E]=d[E]}),Pe(O),O.value=a;var g=Me(O,t);O.value=a,g=Me(O,t),O.value="x";var A=O.scrollHeight-n,j=A*s;b==="border-box"&&(j=j+n+i),g=Math.max(j,g);var h=A*r;return b==="border-box"&&(h=h+n+i),g=Math.min(h,g),[g,A]}var _e=function(){},Ma=function(a,s){return a.reduce(function(r,n){return r[n]=s[n],r},{})},_a=["borderBottomWidth","borderLeftWidth","borderRightWidth","borderTopWidth","boxSizing","fontFamily","fontSize","fontStyle","fontWeight","letterSpacing","lineHeight","paddingBottom","paddingLeft","paddingRight","paddingTop","tabSize","textIndent","textRendering","textTransform","width","wordBreak","wordSpacing","scrollbarGutter"],qa=!!document.documentElement.currentStyle,La=function(a){var s=window.getComputedStyle(a);if(s===null)return null;var r=Ma(_a,s),n=r.boxSizing;if(n==="")return null;qa&&n==="border-box"&&(r.width=parseFloat(r.width)+parseFloat(r.borderRightWidth)+parseFloat(r.borderLeftWidth)+parseFloat(r.paddingRight)+parseFloat(r.paddingLeft)+"px");var i=parseFloat(r.paddingBottom)+parseFloat(r.paddingTop),d=parseFloat(r.borderBottomWidth)+parseFloat(r.borderTopWidth);return{sizingStyle:r,paddingSize:i,borderSize:d}},za=La;function je(t,a,s){var r=Da(s);u.useLayoutEffect(function(){var n=function(d){return r.current(d)};if(t)return t.addEventListener(a,n),function(){return t.removeEventListener(a,n)}},[])}var $a=function(a,s){je(document.body,"reset",function(r){a.current.form===r.target&&s(r)})},Ga=function(a){je(window,"resize",a)},Fa=function(a){je(document.fonts,"loadingdone",a)},Ua=["cacheMeasurements","maxRows","minRows","onChange","onHeightChange"],Va=function(a,s){var r=a.cacheMeasurements,n=a.maxRows,i=a.minRows,d=a.onChange,b=d===void 0?_e:d,g=a.onHeightChange,A=g===void 0?_e:g,j=Ta(a,Ua),h=j.value!==void 0,p=u.useRef(null),E=Oa(p,s),N=u.useRef(0),H=u.useRef(),_=function(){var I=p.current,W=r&&H.current?H.current:za(I);if(W){H.current=W;var q=Pa(W,I.value||I.placeholder||"x",i,n),U=q[0],te=q[1];N.current!==U&&(N.current=U,I.style.setProperty("height",U+"px","important"),A(U,{rowHeight:te}))}},Z=function(I){h||_(),b(I)};return u.useLayoutEffect(_),$a(p,function(){if(!h){var D=p.current.value;requestAnimationFrame(function(){var I=p.current;I&&D!==I.value&&_()})}}),Ga(_),Fa(_),u.createElement("textarea",Ne({},j,{onChange:Z,ref:E}))},Ba=u.forwardRef(Va);const Ha={emailSummary:!0,emailAlerts:!0,emailNews:!1,pushMentions:!0,pushIntegrations:!1,pushSuggestions:!0},qe=oa()(na(t=>({aiSystemPrompt:"Você é o SyncAds AI, um assistente de marketing digital especializado em otimização de campanhas. Seja proativo, criativo e forneça insights baseados em dados. Suas respostas devem ser claras, concisas e sempre focadas em ajudar o usuário a atingir seus objetivos de marketing.",aiInitialGreetings:["Show, chegou no lugar certo. Eu automatizo o que os outros demoram três reuniões pra entender. O que a gente vai otimizar hoje?","Relaxa, aqui não tem blá-blá-blá. Só plano, execução e conversão. Passa o produto e o público.","Beleza. Eu sou o motor que transforma tentativa em lucro. Quer começar pequeno ou já quer escalar até o servidor pedir arrego?","Ótimo. Se você quiser aula, vai pro YouTube. Se quiser dinheiro rodando, me dá os dados e deixa eu fazer o estrago.","Ah, ótimo… mais um querendo vender antes de entender o jogo. Respira. Me diz o produto — eu transformo tua ideia num motivo pra alguém gastar dinheiro agora.","Bem-vindo ao lado escuro do funil. Aqui a gente não inspira ninguém — a gente convence. Cê tá pronto pra sujar um pouco as mãos ou prefere PowerPoint?","Se você quer motivação, compra um livro. Se quer resultado, me dá acesso ao checkout e segura o ROI.","Eu sou o algoritmo de ressaca: sarcástico, funcional e viciado em lucro. Fala o que você vende antes que eu comece a julgar teu nicho.","Parabéns, você acabou de invocar o espírito da conversão. Sem papo de mindset, sem desculpa. Quer que eu destrinche teu tráfego ou tua vergonha de anunciar?"],isTwoFactorEnabled:!1,notificationSettings:Ha,setAiSystemPrompt:a=>t({aiSystemPrompt:a}),setAiInitialGreetings:a=>t({aiInitialGreetings:a}),addAiGreeting:a=>t(s=>({aiInitialGreetings:[...s.aiInitialGreetings,a]})),removeAiGreeting:a=>t(s=>({aiInitialGreetings:s.aiInitialGreetings.filter((r,n)=>n!==a)})),updateAiGreeting:(a,s)=>t(r=>({aiInitialGreetings:r.aiInitialGreetings.map((n,i)=>i===a?s:n)})),setTwoFactorEnabled:a=>t({isTwoFactorEnabled:a}),updateNotificationSettings:a=>t(s=>({notificationSettings:{...s.notificationSettings,...a}}))}),{name:"settings-storage",storage:ia(()=>localStorage),partialize:t=>({aiSystemPrompt:t.aiSystemPrompt,aiInitialGreetings:t.aiInitialGreetings,isTwoFactorEnabled:t.isTwoFactorEnabled,notificationSettings:t.notificationSettings})})),Wa=`
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
`;function Qa(t){const a=/```campaign-create\s*\n([\s\S]*?)```/,s=t.match(a);if(!s)return null;try{const r=JSON.parse(s[1].trim());return!r.name||!r.platform||!r.budgetTotal||!r.startDate?(console.error("Campaign data missing required fields"),null):["Google Ads","Meta","LinkedIn"].includes(r.platform)?{action:"create_campaign",data:{name:r.name,platform:r.platform,budgetTotal:Number(r.budgetTotal),startDate:r.startDate,endDate:r.endDate||void 0,objective:r.objective||"Conversões"}}:(console.error("Invalid platform:",r.platform),null)}catch(r){return console.error("Failed to parse campaign data:",r),null}}function Ka(t){return t.replace(/```campaign-create\s*\n[\s\S]*?```/g,"").trim()}const Xa=`
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
`,Le=["Show, chegou no lugar certo. Eu automatizo o que os outros demoram três reuniões pra entender. O que a gente vai otimizar hoje?","Relaxa, aqui não tem blá-blá-blá. Só plano, execução e conversão. Passa o produto e o público.","Beleza. Eu sou o motor que transforma tentativa em lucro. Quer começar pequeno ou já quer escalar até o servidor pedir arrego?","Ótimo. Se você quiser aula, vai pro YouTube. Se quiser dinheiro rodando, me dá os dados e deixa eu fazer o estrago.","Ah, ótimo… mais um querendo vender antes de entender o jogo. Respira. Me diz o produto — eu transformo tua ideia num motivo pra alguém gastar dinheiro agora.","Bem-vindo ao lado escuro do funil. Aqui a gente não inspira ninguém — a gente convence. Cê tá pronto pra sujar um pouco as mãos ou prefere PowerPoint?","Se você quer motivação, compra um livro. Se quer resultado, me dá acesso ao checkout e segura o ROI.","Eu sou o algoritmo de ressaca: sarcástico, funcional e viciado em lucro. Fala o que você vende antes que eu comece a julgar teu nicho.","Parabéns, você acabou de invocar o espírito da conversão. Sem papo de mindset, sem desculpa. Quer que eu destrinche teu tráfego ou tua vergonha de anunciar?"];function Za(){return Le[Math.floor(Math.random()*Le.length)]}const Ya=({isSearching:t,searchResults:a=[],searchQuery:s})=>!t&&a.length===0?null:e.jsxs("div",{className:"mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg",children:[e.jsxs("div",{className:"flex items-center gap-2 mb-2",children:[e.jsx(ze,{className:"h-4 w-4 text-blue-600"}),e.jsx("span",{className:"text-sm font-medium text-blue-800",children:t?"Pesquisando na web...":"Resultados da pesquisa:"})]}),s&&e.jsxs("p",{className:"text-xs text-blue-600 mb-2",children:[e.jsx("strong",{children:"Consulta:"}),' "',s,'"']}),t?e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("div",{className:"flex gap-1",children:[1,2,3].map(r=>e.jsx("div",{className:"w-2 h-2 bg-blue-400 rounded-full animate-pulse",style:{animationDelay:`${r*.2}s`}},r))}),e.jsx("span",{className:"text-xs text-blue-600",children:"Buscando informações..."})]}):e.jsx("div",{className:"space-y-2",children:a.slice(0,3).map((r,n)=>e.jsxs("div",{className:"flex items-start gap-2 p-2 bg-white rounded border",children:[e.jsx("div",{className:"flex-shrink-0 mt-0.5",children:r.favicon?e.jsx("img",{src:r.favicon,alt:"",className:"w-4 h-4",onError:i=>{i.currentTarget.style.display="none"}}):e.jsx($e,{className:"w-4 h-4 text-gray-400"})}),e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsx("h4",{className:"text-xs font-medium text-gray-900 truncate",children:r.title}),e.jsx("p",{className:"text-xs text-gray-600 line-clamp-2",children:r.snippet}),e.jsxs("a",{href:r.url,target:"_blank",rel:"noopener noreferrer",className:"text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1",children:[e.jsx(se,{className:"w-3 h-3"}),"Ver fonte"]})]})]},n))})]}),Ja=({sources:t,isSearching:a})=>a?e.jsxs("div",{className:"mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg",children:[e.jsxs("div",{className:"flex items-center gap-2 mb-2",children:[e.jsx(ze,{className:"h-4 w-4 text-blue-600"}),e.jsx("span",{className:"text-sm font-medium text-blue-800",children:"Pesquisando em múltiplas fontes..."})]}),e.jsx("div",{className:"flex gap-2 flex-wrap",children:t.map((s,r)=>e.jsxs("div",{className:"flex items-center gap-1 px-2 py-1 bg-white rounded border text-xs text-gray-600",children:[e.jsx($e,{className:"w-3 h-3"}),s]},r))})]}):null,es=({platform:t,platformName:a,icon:s,onSkip:r,onSuccess:n})=>{const[i,d]=u.useState(!1),[b,g]=u.useState("idle"),A=async()=>{d(!0),g("connecting");try{const{data:{session:h}}=await y.auth.getSession();if(!h)throw new Error("Você precisa estar logado");const p=await fetch("https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/oauth-init",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${h.access_token}`},body:JSON.stringify({platform:t.toUpperCase(),redirectUrl:`${window.location.origin}/oauth/callback`})});if(!p.ok)throw new Error("Falha ao iniciar conexão");const{authUrl:E}=await p.json(),N=600,H=700,_=window.screen.width/2-N/2,Z=window.screen.height/2-H/2,D=window.open(E,"oauth-popup",`width=${N},height=${H},left=${_},top=${Z}`),I=W=>{var q,U;((q=W.data)==null?void 0:q.type)==="oauth-success"?(g("success"),d(!1),D==null||D.close(),n==null||n(),window.removeEventListener("message",I)):((U=W.data)==null?void 0:U.type)==="oauth-error"&&(g("error"),d(!1),D==null||D.close(),window.removeEventListener("message",I))};window.addEventListener("message",I),setTimeout(()=>{i&&(g("error"),d(!1),D==null||D.close())},5*60*1e3)}catch(h){console.error("Erro ao conectar:",h),g("error"),d(!1)}},j=()=>s||{facebook:"📘",meta:"📘",google:"🔍",linkedin:"💼",tiktok:"🎵",twitter:"🐦",canva:"🎨",instagram:"📸"}[t.toLowerCase()]||"🔗";return e.jsxs("div",{className:"my-4 animate-in fade-in slide-in-from-bottom-2 duration-300",children:[e.jsx("div",{className:"mb-3",children:e.jsxs("p",{className:"text-sm text-gray-700",children:["Vou conectar sua conta do ",e.jsx("strong",{children:a})," ao SyncAds."]})}),i&&e.jsxs("div",{className:"flex items-center gap-2 mb-3 text-sm text-blue-600",children:[e.jsx("span",{className:"text-2xl",children:j()}),e.jsxs("span",{children:["Connecting ",a,"..."]}),e.jsx(ae,{className:"h-4 w-4 animate-spin"})]}),e.jsx(V,{className:"border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow",children:e.jsxs(B,{className:"p-5",children:[e.jsx("div",{className:"mb-4",children:e.jsxs("p",{className:"text-sm text-gray-600 leading-relaxed",children:["I'll need to connect your ",e.jsx("strong",{className:"text-gray-900",children:a})," account to continue."]})}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(T,{onClick:()=>r==null?void 0:r(),variant:"ghost",disabled:i,className:"text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all",children:"Skip"}),e.jsx(T,{onClick:A,disabled:i,className:"flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-60 disabled:transform-none",children:i?e.jsxs(e.Fragment,{children:[e.jsx(ae,{className:"mr-2 h-4 w-4 animate-spin"}),"Connecting..."]}):e.jsxs(e.Fragment,{children:[e.jsx("span",{className:"mr-2 text-xl",children:j()}),"Connect ",a,e.jsx(se,{className:"ml-2 h-4 w-4"})]})})]}),e.jsx("div",{className:"mt-4 pt-4 border-t border-gray-100",children:e.jsxs("a",{href:"/privacy",target:"_blank",className:"text-xs text-gray-400 hover:text-blue-600 flex items-center gap-1 transition-colors",children:[e.jsx("svg",{className:"h-3 w-3",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"})}),"How we handle your data",e.jsx(se,{className:"h-3 w-3"})]})}),b==="success"&&e.jsx("div",{className:"mt-3 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700",children:"✅ Conectado com sucesso!"}),b==="error"&&e.jsx("div",{className:"mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700",children:"❌ Erro ao conectar. Tente novamente."})]})})]})},as=({downloadUrl:t,fileName:a,expiresAt:s,fileCount:r,campaignName:n,platform:i,period:d})=>{const b=()=>{const A=document.createElement("a");A.href=t,A.download=a,document.body.appendChild(A),A.click(),document.body.removeChild(A)},g=A=>{const j=new Date(A),h=new Date,p=j.getTime()-h.getTime(),E=Math.floor(p/(1e3*60*60)),N=Math.floor(p%(1e3*60*60)/(1e3*60));return E>0?`${E}h ${N}min`:`${N}min`};return e.jsx(V,{className:"w-full max-w-md bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200",children:e.jsx(B,{className:"p-4",children:e.jsxs("div",{className:"flex items-start gap-3",children:[e.jsx("div",{className:"flex-shrink-0",children:e.jsx(Ge,{className:"h-8 w-8 text-blue-600"})}),e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsxs("div",{className:"flex items-center gap-2 mb-2",children:[e.jsx("h4",{className:"font-medium text-gray-900 truncate",children:a}),e.jsxs(ee,{variant:"secondary",className:"text-xs",children:[r," arquivo",r!==1?"s":""]})]}),e.jsxs("div",{className:"space-y-1 mb-3",children:[n&&e.jsxs("p",{className:"text-sm text-gray-600",children:[e.jsx("span",{className:"font-medium",children:"Campanha:"})," ",n]}),i&&e.jsxs("p",{className:"text-sm text-gray-600",children:[e.jsx("span",{className:"font-medium",children:"Plataforma:"})," ",i]}),d&&e.jsxs("p",{className:"text-sm text-gray-600",children:[e.jsx("span",{className:"font-medium",children:"Período:"})," ",d]})]}),e.jsxs("div",{className:"flex items-center gap-1 text-xs text-orange-600 mb-3",children:[e.jsx(va,{className:"h-3 w-3"}),e.jsxs("span",{children:["Expira em ",g(s)]})]}),e.jsxs("div",{className:"flex gap-2",children:[e.jsxs(T,{onClick:b,size:"sm",className:"flex-1",children:[e.jsx(Ae,{className:"h-4 w-4 mr-2"}),"Baixar"]}),e.jsx(T,{variant:"outline",size:"sm",onClick:()=>window.open(t,"_blank"),children:e.jsx(se,{className:"h-4 w-4"})})]})]})]})})})},ss=({downloads:t})=>t.length===0?null:e.jsxs("div",{className:"space-y-3",children:[e.jsxs("h3",{className:"text-sm font-medium text-gray-700 flex items-center gap-2",children:[e.jsx(Ge,{className:"h-4 w-4"}),"Downloads Disponíveis (",t.length,")"]}),e.jsx("div",{className:"space-y-2",children:t.map((a,s)=>e.jsx(as,{...a},s))})]});function ts({steps:t,showCode:a=!0}){if(!t||t.length===0)return null;const s=i=>{switch(i){case"completed":return e.jsx(Ea,{className:"h-4 w-4 text-green-500"});case"running":return e.jsx(ae,{className:"h-4 w-4 text-blue-500 animate-spin"});case"failed":return e.jsx(ye,{className:"h-4 w-4 text-red-500"});default:return e.jsx(Ee,{className:"h-4 w-4 text-gray-500"})}},r=i=>{switch(i){case"completed":return"bg-green-100 text-green-800 border-green-200";case"running":return"bg-blue-100 text-blue-800 border-blue-200";case"failed":return"bg-red-100 text-red-800 border-red-200";default:return"bg-gray-100 text-gray-800 border-gray-200"}},n=i=>{const d=t[i],b=t[i+1];return d.status==="completed"&&(!b||b.status==="running"||b.status==="failed")};return e.jsxs("div",{className:"mb-4 space-y-2",children:[t.map((i,d)=>e.jsx(V,{className:be("border transition-all",n(d)&&"ring-2 ring-blue-500 ring-opacity-50"),children:e.jsx(B,{className:"p-3",children:e.jsxs("div",{className:"flex items-start gap-3",children:[e.jsx("div",{className:"flex-shrink-0 mt-0.5",children:s(i.status)}),e.jsxs("div",{className:"flex-1 min-w-0 space-y-2",children:[e.jsx("div",{className:"flex items-start justify-between gap-2",children:e.jsxs("div",{className:"flex-1",children:[e.jsxs("div",{className:"flex items-center gap-2 mb-1",children:[e.jsx("h4",{className:"text-sm font-semibold text-gray-900",children:i.step}),e.jsxs(ee,{variant:"outline",className:be("text-xs",r(i.status)),children:[i.status==="completed"&&"✓ Concluído",i.status==="running"&&"⏳ Em execução",i.status==="failed"&&"✗ Falhou"]}),i.current_step&&e.jsx(ee,{variant:"secondary",className:"text-xs",children:i.current_step})]}),i.details&&e.jsx("p",{className:"text-xs text-gray-600 mt-1",children:i.details})]})}),a&&i.code_to_execute&&e.jsxs("div",{className:"mt-2 p-2 bg-gray-50 rounded border border-gray-200",children:[e.jsxs("div",{className:"flex items-center gap-2 mb-1",children:[e.jsx(ba,{className:"h-3 w-3 text-gray-500"}),e.jsx("span",{className:"text-xs font-medium text-gray-600",children:"Código:"})]}),e.jsx("code",{className:"text-xs text-gray-700 break-all",children:i.code_to_execute.length>100?`${i.code_to_execute.substring(0,100)}...`:i.code_to_execute})]}),i.strategy&&e.jsx("div",{className:"mt-2",children:e.jsxs(ee,{variant:"outline",className:"text-xs",children:["Estratégia: ",i.strategy]})}),i.error&&i.status==="failed"&&e.jsxs("div",{className:"mt-2 p-2 bg-red-50 rounded border border-red-200",children:[e.jsx("p",{className:"text-xs text-red-700 font-medium",children:"Erro:"}),e.jsx("p",{className:"text-xs text-red-600 mt-1",children:i.error})]})]})]})})},d)),e.jsxs("div",{className:"flex items-center gap-2 px-2",children:[e.jsx("div",{className:"flex-1 h-1 bg-gray-200 rounded-full overflow-hidden",children:e.jsx("div",{className:"h-full bg-blue-500 transition-all duration-300",style:{width:`${t.filter(i=>i.status==="completed").length/t.length*100}%`}})}),e.jsxs("span",{className:"text-xs text-gray-500",children:[t.filter(i=>i.status==="completed").length,"/",t.length," concluídos"]})]})]})}const rs=({result:t,onDownload:a,onRetry:s,onDownloadTemplate:r})=>{var A,j;const[n,i]=u.useState(0),[d,b]=u.useState(!0);u.useEffect(()=>{if(t.steps&&t.steps.length>0){const h=setInterval(()=>{i(p=>p<t.steps.length-1?p+1:(b(!1),clearInterval(h),p))},1e3);return()=>clearInterval(h)}},[t.steps]);const g=t.steps?Math.round(n/t.steps.length*100):100;return e.jsxs(V,{className:"w-full max-w-2xl mx-auto",children:[e.jsxs(ca,{children:[e.jsxs(da,{className:"flex items-center gap-2",children:[t.success?e.jsx(la,{className:"h-5 w-5 text-green-600"}):e.jsx(ye,{className:"h-5 w-5 text-red-600"}),e.jsx("span",{className:t.success?"text-green-600":"text-red-600",children:t.success?"Execução Concluída":"Execução Falhou"})]}),e.jsx("p",{className:"text-sm text-gray-600",children:t.message})]}),e.jsxs(B,{className:"space-y-4",children:[e.jsxs("div",{className:"space-y-2",children:[e.jsxs("div",{className:"flex justify-between text-sm",children:[e.jsx("span",{children:"Progresso"}),e.jsxs("span",{children:[g,"%"]})]}),e.jsx(Sa,{value:g,className:"h-2"})]}),t.steps&&t.steps.length>0&&e.jsxs("div",{className:"space-y-3",children:[e.jsx("h4",{className:"text-sm font-medium text-gray-700",children:"Etapas de Execução:"}),e.jsx(ts,{steps:t.steps,showCode:!0})]}),t.nextActions&&t.nextActions.length>0&&e.jsxs("div",{className:"space-y-2",children:[e.jsx("h4",{className:"text-sm font-medium text-gray-700",children:"Sugestões:"}),e.jsx("ul",{className:"space-y-1",children:t.nextActions.map((h,p)=>e.jsxs("li",{className:"flex items-center gap-2 text-xs text-gray-600",children:[e.jsx("div",{className:"h-1 w-1 bg-gray-400 rounded-full"}),h]},p))})]}),t.data&&e.jsxs("div",{className:"space-y-2",children:[e.jsx("h4",{className:"text-sm font-medium text-gray-700",children:"Resultado:"}),e.jsx("div",{className:"bg-gray-50 p-3 rounded-lg",children:e.jsx("pre",{className:"text-xs text-gray-600 whitespace-pre-wrap",children:JSON.stringify(t.data,null,2)})})]}),t.diagnosis&&e.jsx("div",{className:"mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200",children:e.jsxs("div",{className:"flex items-start gap-3",children:[e.jsx(Ee,{className:"h-5 w-5 text-yellow-600 flex-shrink-0"}),e.jsxs("div",{className:"flex-1 space-y-2",children:[e.jsx("h4",{className:"text-sm font-semibold text-yellow-900",children:"Diagnóstico:"}),e.jsx("p",{className:"text-sm text-yellow-800",children:t.diagnosis.explanation}),t.diagnosis.solutions&&t.diagnosis.solutions.length>0&&e.jsxs("div",{className:"mt-2",children:[e.jsx("p",{className:"text-xs font-medium text-yellow-900 mb-1",children:"Soluções sugeridas:"}),e.jsx("ul",{className:"space-y-1",children:t.diagnosis.solutions.map((h,p)=>e.jsxs("li",{className:"text-xs text-yellow-700 flex items-start gap-2",children:[e.jsx("span",{children:"•"}),e.jsx("span",{children:h})]},p))})]})]})]})}),t.templateCSV&&r&&e.jsxs("div",{className:"mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200",children:[e.jsx("div",{className:"flex items-center justify-between mb-2",children:e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(Ee,{className:"h-5 w-5 text-blue-600"}),e.jsx("h4",{className:"text-sm font-semibold text-blue-900",children:"Template CSV Gerado"})]})}),e.jsx("p",{className:"text-xs text-blue-700 mb-3",children:"Como o site não pôde ser acessado, geramos um template CSV com dados de exemplo que você pode usar."}),e.jsxs(T,{variant:"outline",size:"sm",onClick:()=>{const h=new Blob([t.templateCSV],{type:"text/csv"}),p=URL.createObjectURL(h),E=document.createElement("a");E.href=p,E.download=`produtos-template-${Date.now()}.csv`,document.body.appendChild(E),E.click(),document.body.removeChild(E),URL.revokeObjectURL(p)},className:"w-full",children:[e.jsx(Ae,{className:"h-4 w-4 mr-2"}),"Baixar Template CSV"]})]}),e.jsxs("div",{className:"flex gap-2 pt-4",children:[((A=t.data)==null?void 0:A.downloadUrl)&&a&&e.jsxs(T,{onClick:()=>a(t.data.downloadUrl,t.data.fileName),className:"flex-1",children:[e.jsx(Ae,{className:"h-4 w-4 mr-2"}),"Baixar Arquivo"]}),((j=t.data)==null?void 0:j.url)&&e.jsxs(T,{variant:"outline",onClick:()=>window.open(t.data.url,"_blank"),children:[e.jsx(se,{className:"h-4 w-4 mr-2"}),"Ver Site"]}),!t.success&&s&&e.jsx(T,{variant:"outline",onClick:s,children:"Tentar Novamente"})]})]})]})},os=({toolName:t,parameters:a,userId:s,conversationId:r,onComplete:n})=>{const[i,d]=u.useState(null),[b,g]=u.useState(!1),[A,j]=u.useState(null),h=async()=>{g(!0),j(null),d(null);try{const{data:p,error:E}=await supabase.functions.invoke("super-ai-tools",{body:{toolName:t,parameters:a,userId:s,conversationId:r}});if(E)throw new Error(E.message);const N=p;d(N),n&&n(N)}catch(p){j(p instanceof Error?p.message:"Erro desconhecido")}finally{g(!1)}};return u.useEffect(()=>{h()},[]),b?e.jsx(V,{className:"w-full max-w-2xl mx-auto",children:e.jsx(B,{className:"p-6",children:e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx(ae,{className:"h-5 w-5 animate-spin text-blue-600"}),e.jsxs("div",{children:[e.jsxs("h3",{className:"font-medium",children:["Executando ",t]}),e.jsx("p",{className:"text-sm text-gray-600",children:"Processando solicitação..."})]})]})})}):A?e.jsx(V,{className:"w-full max-w-2xl mx-auto",children:e.jsxs(B,{className:"p-6",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx(ye,{className:"h-5 w-5 text-red-600"}),e.jsxs("div",{children:[e.jsx("h3",{className:"font-medium text-red-600",children:"Erro na Execução"}),e.jsx("p",{className:"text-sm text-gray-600",children:A})]})]}),e.jsx(T,{onClick:h,className:"mt-4",children:"Tentar Novamente"})]})}):i?e.jsx(rs,{result:i,onDownload:(p,E)=>{const N=document.createElement("a");N.href=p,N.download=E,document.body.appendChild(N),N.click(),document.body.removeChild(N)},onRetry:h}):null},ns=`
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
`;class is{constructor(a){fe(this,"userId");this.userId=a}async executeSQL(a){try{if(/DROP|TRUNCATE|DELETE\s+FROM\s+"User"|DELETE\s+FROM\s+"Campaign"/i.test(a))return{success:!1,error:"Query perigosa detectada. Confirmação necessária.",message:"⚠️ Esta query pode ser destrutiva. Por favor, confirme explicitamente."};const{data:r,error:n}=await y.rpc("execute_admin_query",{query_text:a});return n?{success:!1,error:n.message,message:`❌ Erro ao executar SQL: ${n.message}`}:{success:!0,data:r,message:`✅ Query executada com sucesso. ${Array.isArray(r)?r.length:0} registros retornados.`}}catch(s){return{success:!1,error:s.message,message:`❌ Erro: ${s.message}`}}}async analyzeSystem(a,s){try{let r="",n="";switch(a){case"metrics":r=`
            SELECT 
              (SELECT COUNT(*) FROM "User") as total_users,
              (SELECT COUNT(*) FROM "Campaign") as total_campaigns,
              (SELECT COUNT(*) FROM "ChatMessage") as total_messages,
              (SELECT COUNT(*) FROM "AiConnection") as total_connections
          `,n="📊 Métricas gerais do sistema";break;case"performance":r=`
            SELECT 
              AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_response_time,
              COUNT(*) as total_requests
            FROM "ChatMessage"
            WHERE created_at >= NOW() - INTERVAL '${s==="24h"?"1 day":s==="7d"?"7 days":"30 days"}'
          `,n="⚡ Análise de performance";break;case"usage":r=`
            SELECT 
              DATE(created_at) as date,
              COUNT(*) as messages_count
            FROM "ChatMessage"
            WHERE created_at >= NOW() - INTERVAL '${s==="24h"?"1 day":s==="7d"?"7 days":"30 days"}'
            GROUP BY DATE(created_at)
            ORDER BY date DESC
          `,n="📈 Análise de uso";break;case"errors":return{success:!0,data:{errors:0},message:"✅ Sistema de logging de erros a ser implementado"}}const{data:i,error:d}=await y.rpc("execute_admin_query",{query_text:r});if(d)throw d;return{success:!0,data:i,message:`${n} - Período: ${s}`}}catch(r){return{success:!1,error:r.message,message:`❌ Erro ao analisar sistema: ${r.message}`}}}async manageIntegration(a,s,r){try{switch(a){case"test":return{success:!0,message:`🔍 Testando integração com ${s}... (A implementar com APIs reais)`,data:{status:"pending"}};case"connect":const{data:n,error:i}=await y.from("Integration").insert({userId:this.userId,platform:s.toUpperCase(),credentials:r||{},isConnected:!1,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}).select().single();if(i)throw i;return{success:!0,data:n,message:`✅ Integração com ${s} iniciada. Configure as credenciais.`};case"disconnect":return await y.from("Integration").update({isConnected:!1}).eq("platform",s.toUpperCase()).eq("userId",this.userId),{success:!0,message:`✅ Integração com ${s} desconectada.`};default:return{success:!1,error:"Ação desconhecida",message:"❌ Ação não reconhecida"}}}catch(n){return{success:!1,error:n.message,message:`❌ Erro ao gerenciar integração: ${n.message}`}}}async getMetrics(a,s,r){try{let n="",i="*";switch(a){case"users":n="User";break;case"campaigns":n="Campaign";break;case"messages":n="ChatMessage";break;default:return{success:!1,error:"Métrica desconhecida",message:"❌ Métrica não reconhecida"}}const d=`
        SELECT 
          DATE_TRUNC('${r}', created_at) as period,
          ${s==="count"?"COUNT(*)":s==="sum"?"SUM(1)":"AVG(1)"} as value
        FROM "${n}"
        GROUP BY period
        ORDER BY period DESC
        LIMIT 30
      `,{data:b,error:g}=await y.rpc("execute_admin_query",{query_text:d});if(g)throw g;return{success:!0,data:b,message:`📊 Métricas de ${a} agrupadas por ${r}`}}catch(n){return{success:!1,error:n.message,message:`❌ Erro ao obter métricas: ${n.message}`}}}}function cs(t){const a=/```admin-sql\s*\n([\s\S]*?)```/,s=t.match(a);return s?s[1].trim():null}function ds(t){const a=/```admin-analyze\s*\n([\s\S]*?)```/,s=t.match(a);if(!s)return null;try{return JSON.parse(s[1].trim())}catch{return null}}function ls(t){const a=/```admin-integration\s*\n([\s\S]*?)```/,s=t.match(a);if(!s)return null;try{return JSON.parse(s[1].trim())}catch{return null}}function ms(t){const a=/```admin-metrics\s*\n([\s\S]*?)```/,s=t.match(a);if(!s)return null;try{return JSON.parse(s[1].trim())}catch{return null}}function us(t){return t.replace(/```admin-sql\s*\n[\s\S]*?```/g,"").replace(/```admin-analyze\s*\n[\s\S]*?```/g,"").replace(/```admin-integration\s*\n[\s\S]*?```/g,"").replace(/```admin-metrics\s*\n[\s\S]*?```/g,"").replace(/```admin-logs\s*\n[\s\S]*?```/g,"").replace(/```admin-test-api\s*\n[\s\S]*?```/g,"").replace(/```admin-debug\s*\n[\s\S]*?```/g,"").trim()}function gs(t){const a=/```integration-connect:(\w+)```/,s=t.match(a);return s?{action:"connect",slug:s[1]}:null}function ps(t){const a=/```integration-disconnect:(\w+)```/,s=t.match(a);return s?{action:"disconnect",slug:s[1]}:null}function hs(t){const a=/```integration-status(?::(\w+))?```/,s=t.match(a);return s?{action:"status",slug:s[1]}:null}function fs(t){return gs(t)||ps(t)||hs(t)}function xs(t){return t.replace(/```integration-connect:\w+```/g,"").replace(/```integration-disconnect:\w+```/g,"").replace(/```integration-status(?::\w+)?```/g,"").trim()}const vs=`
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
`,Ss=`
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
`;class bs{constructor(a){fe(this,"userId");this.userId=a}async auditIntegration(a){try{const{data:s,error:r}=await y.from("Integration").select("*").eq("userId",this.userId).eq("platform",a).single();if(r&&r.code!=="PGRST116")throw r;const n=this.getCapabilities(a),i=s&&s.isConnected?"connected":"disconnected",d={platform:a,status:i,lastSync:(s==null?void 0:s.lastSyncAt)||void 0,capabilities:n,issues:this.detectIssues(s,a),recommendations:this.getRecommendations(i,a)};return{success:!0,data:d,message:this.formatAuditMessage(d)}}catch(s){return{success:!1,error:s.message,message:`❌ Erro ao auditar ${a}: ${s.message}`}}}async auditAll(){try{const a=["META_ADS","GOOGLE_ADS","LINKEDIN_ADS","TIKTOK_ADS","TWITTER_ADS"],s=[];for(const r of a){const n=await this.auditIntegration(r);n.success&&n.data&&s.push(n.data)}return{success:!0,data:s,message:this.formatAllAuditsMessage(s)}}catch(a){return{success:!1,error:a.message,message:`❌ Erro ao auditar integrações: ${a.message}`}}}async listStatus(){try{const{data:a,error:s}=await y.from("Integration").select("platform, isConnected, lastSyncAt").eq("userId",this.userId);if(s)throw s;const r=new Map((a==null?void 0:a.map(d=>[d.platform,d]))||[]),i=["META_ADS","GOOGLE_ADS","LINKEDIN_ADS","TIKTOK_ADS","TWITTER_ADS"].map(d=>{var b,g;return{platform:d,status:r.has(d)&&((b=r.get(d))!=null&&b.isConnected)?"✅ Conectada":"❌ Desconectada",lastSync:((g=r.get(d))==null?void 0:g.lastSyncAt)||"Nunca"}});return{success:!0,data:i,message:this.formatStatusList(i)}}catch(a){return{success:!1,error:a.message,message:`❌ Erro ao listar status: ${a.message}`}}}getCapabilities(a){return{META_ADS:["Criar campanhas de Facebook e Instagram","Segmentação avançada de audiência","Análise de performance em tempo real","Otimização automática de orçamento","A/B testing de criativos","Remarketing e lookalike audiences"],GOOGLE_ADS:["Campanhas de Pesquisa (Search)","Anúncios Display e YouTube","Shopping Ads para e-commerce","Campanhas Performance Max","Análise de conversões e ROI","Smart Bidding automático"],LINKEDIN_ADS:["Anúncios B2B segmentados","Targeting por cargo e empresa","Lead Gen Forms nativos","InMail patrocinado","Análise de engajamento profissional","Retargeting de visitantes"],TIKTOK_ADS:["Vídeos In-Feed","TopView e Brand Takeover","Spark Ads (boost orgânico)","Segmentação por interesse e comportamento","Píxel de conversão","Catálogo de produtos"],TWITTER_ADS:["Tweets promovidos","Segmentação por hashtags e interesse","Audiências customizadas","Análise de engajamento","Campanhas de instalação de app","Vídeos e carrosséis"]}[a]||["Capacidades a definir"]}detectIssues(a,s){const r=[];if(!a)return r.push("Integração não configurada"),r;if(a.isConnected||r.push("Integração desconectada - configure credenciais"),(!a.credentials||Object.keys(a.credentials).length===0)&&r.push("Credenciais não configuradas"),a.lastSync){const n=new Date(a.lastSync),i=(Date.now()-n.getTime())/(1e3*60*60);i>24&&r.push(`Última sincronização há ${Math.floor(i)} horas - pode estar desatualizado`)}return r}getRecommendations(a,s){const r=[];return a==="disconnected"&&(r.push(`Conecte ${this.formatPlatformName(s)} em: Configurações → Integrações`),r.push("Configure sua chave de API para começar a usar")),a==="connected"&&(r.push("✅ Integração ativa! Você já pode criar campanhas"),r.push("Explore as capacidades disponíveis desta plataforma")),r}formatPlatformName(a){return{META_ADS:"Meta Ads (Facebook/Instagram)",GOOGLE_ADS:"Google Ads",LINKEDIN_ADS:"LinkedIn Ads",TIKTOK_ADS:"TikTok Ads",TWITTER_ADS:"Twitter Ads (X)"}[a]||a}formatAuditMessage(a){let r=`
**${a.status==="connected"?"✅":"❌"} ${this.formatPlatformName(a.platform)}**
`;return r+=`Status: ${a.status==="connected"?"✅ Conectada":"❌ Desconectada"}
`,a.lastSync&&(r+=`Última sincronização: ${a.lastSync}
`),r+=`
**Capacidades:**
`,a.capabilities.forEach(n=>{r+=`• ${n}
`}),a.issues&&a.issues.length>0&&(r+=`
**⚠️ Problemas detectados:**
`,a.issues.forEach(n=>{r+=`• ${n}
`})),a.recommendations&&a.recommendations.length>0&&(r+=`
**💡 Recomendações:**
`,a.recommendations.forEach(n=>{r+=`• ${n}
`})),r}formatAllAuditsMessage(a){let s=`
# 🔍 AUDITORIA COMPLETA DE INTEGRAÇÕES

`;const r=a.filter(i=>i.status==="connected").length,n=a.length;return s+=`**Resumo:** ${r}/${n} integrações ativas

`,s+=`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`,a.forEach(i=>{s+=this.formatAuditMessage(i),s+=`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`}),r<n?(s+=`
**🎯 Próximos Passos:**
`,s+=`1. Conecte as ${n-r} integrações pendentes
`,s+=`2. Configure suas chaves de API
`,s+=`3. Teste cada integração antes de criar campanhas
`):s+=`
**🎉 Parabéns!** Todas as integrações estão configuradas e funcionando!
`,s}formatStatusList(a){let s=`
**📊 Status das Integrações:**

`;return a.forEach(r=>{s+=`${r.status} **${this.formatPlatformName(r.platform)}**
`,s+=`   └─ Última sync: ${r.lastSync}

`}),s}}function As(t){const a=/```integration-action\s*\n([\s\S]*?)```/,s=t.match(a);if(!s)return null;try{return JSON.parse(s[1].trim())}catch{return null}}function Es(t){return t.replace(/```integration-action\s*\n[\s\S]*?```/g,"").trim()}function Ns(t,a){const s=t.toLowerCase(),r=a.toLowerCase(),n=(s.includes("auditor")||s.includes("verificar")||s.includes("status")||s.includes("listar"))&&(s.includes("integra")||s.includes("conex")||s.includes("plataforma")),i=r.includes("vou")&&(r.includes("auditor")||r.includes("verificar"));if(!n||!i)return null;const d={facebook:"META_ADS",instagram:"META_ADS",meta:"META_ADS",google:"GOOGLE_ADS",linkedin:"LINKEDIN_ADS",tiktok:"TIKTOK_ADS",twitter:"TWITTER_ADS"};for(const[b,g]of Object.entries(d))if(s.includes(b))return{action:"audit",platform:g};return{action:"audit_all"}}const ws=["Criar campanha de Facebook Ads","Analisar performance da última semana","Sugerir otimizações"],ce=500,Fs=()=>{const[t,a]=u.useState(""),[s,r]=u.useState(!0),[n,i]=u.useState(null),[d,b]=u.useState(!1),[g,A]=u.useState([]),[j,h]=u.useState(""),[p,E]=u.useState([]),[N,H]=u.useState([]),[_,Z]=u.useState([]),[D,I]=u.useState(null),[W,q]=u.useState(""),[U,te]=u.useState([]),[de,Ce]=u.useState(!1),[ys,Fe]=u.useState(null),le=u.useRef(null),me=u.useRef([]),m=ma(o=>o.user),ue=M(o=>o.conversations),w=M(o=>o.activeConversationId),ge=M(o=>o.setActiveConversationId),re=M(o=>o.isAssistantTyping),Ie=M(o=>o.setAssistantTyping),X=M(o=>o.addMessage);M(o=>o.deleteConversation),M(o=>o.createNewConversation);const Ue=ua(o=>o.addCampaign),Ve=qe(o=>o.aiSystemPrompt),Be=qe(o=>o.aiInitialGreetings),Te=u.useRef(null),Re=u.useRef(null),{toast:f}=ga(),L=ue.find(o=>o.id===w),He=()=>{var o;(o=Te.current)==null||o.scrollIntoView({behavior:"smooth"})};u.useEffect(He,[L==null?void 0:L.messages,re]),u.useEffect(()=>{(async()=>{if(m)try{const{data:c,error:l}=await y.from("GlobalAiConnection").select("id, systemPrompt, initialGreetings").eq("isActive",!0).limit(1).single();if(l){console.error("Erro ao buscar IA:",l);return}const x=c==null?void 0:c.id;if(x){const{data:v,error:k}=await y.from("GlobalAiConnection").select("systemPrompt, initialGreetings").eq("id",x).single();if(k){console.error("Erro ao buscar config da IA:",k);return}v&&i({systemPrompt:v.systemPrompt||Ve,initialGreetings:v.initialGreetings||Be})}}catch(c){console.error("Erro ao carregar IA Global:",c)}})()},[m==null?void 0:m.id]),u.useEffect(()=>{if(L&&L.messages.length===0){const o=Za();setTimeout(()=>{m&&X(m.id,w,{id:`greeting-${Date.now()}`,role:"assistant",content:o})},500)}},[w,L==null?void 0:L.messages.length]);const We=o=>{const c=/ZIP_DOWNLOAD:\s*({[^}]+})/g,l=o.match(c);return l&&l.forEach(x=>{try{const v=x.replace("ZIP_DOWNLOAD:","").trim(),k=JSON.parse(v);H(z=>[...z,k])}catch(v){console.error("Erro ao processar download ZIP:",v)}}),o.replace(c,"").trim()},Qe=o=>{const c=/SUPER_AI_EXECUTION:\s*({[^}]+})/g,l=o.match(c);return l&&l.forEach(x=>{try{const v=x.replace("SUPER_AI_EXECUTION:","").trim(),k=JSON.parse(v);Z(z=>[...z,k])}catch(v){console.error("Erro ao processar execução Super AI:",v)}}),o.replace(c,"").trim()},pe=async()=>{if(t.trim()===""||!w||t.length>ce)return;const o=t,c=o.toLowerCase();if(c.includes("pesquis")||c.includes("busca")||c.includes("google")||c.includes("internet")){I("web_search");let l=o;if(c.includes("pesquis")){const x=o.match(/pesquis[ae]\s+(.+)/i);l=x?x[1]:o}q(`Pesquisando na web sobre: "${l}"`),te(["Google Search","Exa AI","Tavily"])}else if(c.includes("baix")||c.includes("rasp")||c.includes("scrape")){I("web_scraping");const l=o.match(/https?:\/\/[^\s]+/i);q(l?`Raspando dados de: ${l[0]}`:"Raspando dados...")}else c.includes("python")||c.includes("calcule")||c.includes("execute código")?(I("python_exec"),q("Executando código Python para processar dados...")):(I(null),q("Processando sua solicitação..."),te([]));m&&X(m.id,w,{id:`msg-${Date.now()}`,role:"user",content:o}),a(""),r(!1),Ie(!0);try{const l=ue.find(S=>S.id===w),x=(n==null?void 0:n.systemPrompt)||Xa,v=ns+`

`+Wa+`

`+vs+`

`+Ss+`

`+x,k=((l==null?void 0:l.messages)||[]).slice(-20).map(S=>({role:S.role,content:S.content})),R=(await fa(o,w,k,v)).response,$=Qa(R);if($)try{m&&(await Ue(m.id,{name:$.data.name,platform:$.data.platform,status:"Pausada",budgetTotal:$.data.budgetTotal,budgetSpent:0,impressions:0,clicks:0,conversions:0,startDate:$.data.startDate,endDate:$.data.endDate||"",ctr:0,cpc:0}),f({title:"🎉 Campanha Criada!",description:`A campanha "${$.data.name}" foi criada com sucesso.`}))}catch(S){console.error("Error creating campaign from AI:",S),f({title:"Erro ao criar campanha",description:"Não foi possível criar a campanha automaticamente.",variant:"destructive"})}let Y="";if(m){const S=new is(m.id),G=cs(R);if(G){const C=await S.executeSQL(G);f({title:C.success?"✅ SQL Executado":"❌ Erro SQL",description:C.message,variant:C.success?"default":"destructive"})}const J=ds(R);if(J){const C=await S.analyzeSystem(J.type,J.period);f({title:C.success?"📊 Análise Concluída":"❌ Erro",description:C.message,variant:C.success?"default":"destructive"})}const oe=ls(R);if(oe){const C=await S.manageIntegration(oe.action,oe.platform,oe.credentials);f({title:C.success?"🔗 Integração Atualizada":"❌ Erro",description:C.message,variant:C.success?"default":"destructive"})}const ne=ms(R);if(ne){const C=await S.getMetrics(ne.metric,ne.aggregation,ne.groupBy);f({title:C.success?"📈 Métricas Obtidas":"❌ Erro",description:C.message,variant:C.success?"default":"destructive"})}let K=As(R);if(K||(K=Ns(o,R)),K){const C=new bs(m.id);let F;switch(K.action){case"audit":K.platform&&(F=await C.auditIntegration(K.platform));break;case"audit_all":F=await C.auditAll();break;case"list_status":F=await C.listStatus();break;case"test":case"capabilities":case"diagnose":F={success:!0,message:`Ação "${K.action}" detectada. Implementação em andamento.`};break}F&&(Y=`

`+F.message,f({title:F.success?"✅ Ação Executada":"❌ Erro",description:F.success?"Auditoria concluída com sucesso":F.error||"Erro ao executar ação",variant:F.success?"default":"destructive"}))}}const P=fs(R);if(P&&m)try{if(P.action==="connect"){const{authUrl:S}=await ie.generateOAuthUrl(P.slug,m.id),G=ve[P.slug];m&&X(m.id,w,{id:`msg-${Date.now()+1}`,role:"assistant",content:`Para conectar ${G.name}, clique no link abaixo:

🔗 [Autorizar ${G.name}](${S})

O link abrirá em uma nova aba para você autorizar o acesso.`}),window.open(S,"_blank"),f({title:"🔗 Link de Autorização",description:`Clique no link para conectar ${G.name}`});return}else if(P.action==="disconnect"){await ie.disconnect(m.id,P.slug);const S=ve[P.slug];f({title:"✅ Desconectado",description:`${S.name} foi desconectado com sucesso.`})}else if(P.action==="status")if(P.slug){const S=await ie.getIntegrationStatus(m.id,P.slug),G=ve[P.slug];f({title:`${G.name}`,description:S!=null&&S.isConnected?"✅ Conectado":"❌ Não conectado"})}else{const S=await ie.listIntegrations(m.id),G=S.filter(J=>J.isConnected).length;f({title:"📊 Status das Integrações",description:`${G} de ${S.length} integrações conectadas`})}}catch(S){console.error("Erro ao processar integração:",S),m&&X(m.id,w,{id:`msg-${Date.now()+2}`,role:"assistant",content:`❌ **Erro ao conectar integração**

${S.message||"Erro ao processar comando de integração"}`}),f({title:"❌ Erro na Integração",description:"Verifique as instruções no chat",variant:"destructive"})}let he=We(R);he=Qe(he);let Q=Ka(he);Q=us(Q),Q=xs(Q),Q=Es(Q),m&&X(m.id,w,{id:`msg-${Date.now()+1}`,role:"assistant",content:Q+Y})}catch(l){console.error("Erro ao chamar IA:",l),f({title:"Erro ao gerar resposta",description:l.message||"Não foi possível obter resposta da IA. Verifique sua chave de API.",variant:"destructive"}),m&&X(m.id,w,{id:`msg-${Date.now()+1}`,role:"assistant",content:"❌ Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, verifique se sua chave de API está configurada corretamente nas configurações."})}finally{Ie(!1)}},Ke=o=>{a(o)},Xe=()=>{var o;(o=Re.current)==null||o.click()},Ze=async()=>{try{const o=await navigator.mediaDevices.getUserMedia({audio:!0}),c=new MediaRecorder(o);le.current=c,me.current=[],c.ondataavailable=l=>{l.data.size>0&&me.current.push(l.data)},c.onstop=async()=>{const l=new Blob(me.current,{type:"audio/webm"});Fe(l),await Je(l),o.getTracks().forEach(x=>x.stop())},c.start(),Ce(!0),f({title:"🎤 Gravando...",description:"Clique novamente para parar e enviar."})}catch(o){console.error("Erro ao iniciar gravação:",o),f({title:"❌ Erro",description:"Não foi possível acessar o microfone.",variant:"destructive"})}},Ye=()=>{le.current&&de&&(le.current.stop(),Ce(!1))},Je=async o=>{if(!(!m||!w))try{f({title:"📤 Enviando áudio...",description:"Aguarde..."});const c=new File([o],`audio-${Date.now()}.webm`,{type:"audio/webm"}),l=`${m.id}/audio-${Date.now()}-${Math.random().toString(36).substring(7)}.webm`,{data:x,error:v}=await y.storage.from("chat-attachments").upload(l,c,{cacheControl:"3600",upsert:!1});if(v)throw v;const{data:{publicUrl:k}}=y.storage.from("chat-attachments").getPublicUrl(l),z=`[🎤 Mensagem de áudio](${k})`;a(R=>R?`${R}

${z}`:z),f({title:"✅ Áudio enviado!",description:"O áudio foi adicionado à mensagem."})}catch(c){console.error("Erro ao enviar áudio:",c),f({title:"❌ Erro",description:"Não foi possível enviar o áudio.",variant:"destructive"})}},ea=async o=>{var l;const c=(l=o.target.files)==null?void 0:l[0];if(!(!c||!m||!w))try{f({title:"📤 Upload iniciado",description:`Enviando "${c.name}"...`});const x=c.name.split(".").pop(),v=`${m.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${x}`,{data:k,error:z}=await y.storage.from("chat-attachments").upload(v,c,{cacheControl:"3600",upsert:!1});if(z)throw z;const{data:{publicUrl:R}}=y.storage.from("chat-attachments").getPublicUrl(v),{error:$}=await y.from("ChatAttachment").insert({messageId:"",fileName:c.name,fileType:c.type,fileUrl:R,fileSize:c.size});$&&console.error("Erro ao salvar anexo:",$);const Y=c.type.startsWith("image/")?`![${c.name}](${R})`:`[${c.name}](${R})`,P=t?`${t}

${Y}`:Y;a(""),P.trim()&&w&&pe(),f({title:"✅ Arquivo enviado!",description:`${c.name} foi enviado com sucesso.`})}catch(x){console.error("Erro ao fazer upload:",x),f({title:"❌ Erro ao enviar arquivo",description:x.message||"Não foi possível enviar o arquivo.",variant:"destructive"})}finally{o.target&&(o.target.value="")}},aa=async o=>{try{const{data:c,error:l}=await y.from("ChatMessage").select("id, role, content, createdAt").eq("conversationId",o).order("createdAt",{ascending:!0});if(l)throw l;const x=(c||[]).map(v=>({id:v.id,role:v.role,content:v.content,timestamp:new Date(v.createdAt)}));M.getState().setConversationMessages(o,x),ge(o),console.log(`✅ ${x.length} mensagens carregadas da conversa ${o}`)}catch(c){console.error("Erro ao carregar mensagens:",c),f({title:"Erro",description:"Não foi possível carregar mensagens.",variant:"destructive"})}};u.useEffect(()=>{(async()=>{if(!m)return;await M.getState().loadConversations(m.id);const{data:c}=await y.from("ChatConversation").select("id").eq("userId",m.id).limit(1);(!c||c.length===0)&&await De()})()},[m]);const De=async()=>{try{if(!m)return;const o=crypto.randomUUID(),c=new Date().toISOString(),{error:l}=await y.from("ChatConversation").insert({id:o,userId:m.id,title:"🆕 Nova Conversa",createdAt:c,updatedAt:c});if(l)throw l;ge(o),await M.getState().loadConversations(m.id),f({title:"✅ Nova conversa criada!",description:"Comece um novo chat do zero."})}catch(o){console.error("Erro ao criar nova conversa:",o),f({title:"Erro",description:o.message||"Não foi possível criar nova conversa.",variant:"destructive"})}},sa=async o=>{try{await y.from("ChatMessage").delete().eq("conversationId",o);const{error:c}=await y.from("ChatConversation").delete().eq("id",o);if(c)throw c;w===o&&ge(null),await M.getState().loadConversations(m.id),f({title:"🗑️ Conversa deletada",description:"A conversa foi removida com sucesso."})}catch(c){console.error("Erro ao deletar conversa:",c),f({title:"Erro",description:"Não foi possível deletar a conversa.",variant:"destructive"})}};return e.jsxs("div",{className:"h-[calc(100vh-80px)] flex",children:[e.jsxs("div",{className:`${s?"w-72":"w-0"} transition-all duration-300 bg-gray-50 border-r border-gray-200 flex flex-col overflow-hidden`,children:[e.jsxs("div",{className:"p-4 border-b border-gray-200",children:[e.jsxs("div",{className:"flex items-center justify-between mb-3",children:[e.jsx("h2",{className:"text-sm font-semibold text-gray-700",children:"Conversas"}),e.jsx(T,{onClick:()=>r(!1),variant:"ghost",size:"sm",className:"h-7 w-7 p-0",children:e.jsx(pa,{className:"h-4 w-4"})})]}),e.jsxs(T,{onClick:De,className:"w-full gap-2",size:"sm",children:[e.jsx(Na,{className:"h-4 w-4"}),"Nova Conversa"]})]}),e.jsx("div",{className:"flex-1 overflow-y-auto p-2 space-y-1",children:ue.map(o=>e.jsxs("div",{className:`group relative flex items-center gap-2 p-3 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors ${w===o.id?"bg-blue-50 border border-blue-200":"bg-white"}`,onClick:()=>{w!==o.id&&aa(o.id)},children:[e.jsx(wa,{className:"h-4 w-4 text-gray-500 flex-shrink-0"}),e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsx("p",{className:"text-sm font-medium text-gray-900 truncate",children:o.title}),e.jsx("p",{className:"text-xs text-gray-500 truncate",children:o.messages&&o.messages.length>0?o.messages[o.messages.length-1].content.substring(0,50)+"...":"Sem mensagens ainda"})]}),e.jsx(T,{onClick:c=>{c.stopPropagation(),sa(o.id)},variant:"ghost",size:"sm",className:"h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity",children:e.jsx(ya,{className:"h-3.5 w-3.5 text-red-500"})})]},o.id))})]}),e.jsxs("div",{className:"flex-1 flex flex-col",children:[e.jsx("div",{className:"border-b border-gray-200 bg-white/80 backdrop-blur-xl p-4",children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[!s&&e.jsx(T,{onClick:()=>r(!0),variant:"ghost",size:"sm",className:"h-9 w-9 p-0",children:e.jsx(ha,{className:"h-5 w-5"})}),e.jsx("div",{className:"p-1.5 sm:p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500",children:e.jsx(xe,{className:"h-4 w-4 sm:h-6 sm:w-6 text-white"})}),e.jsxs("div",{children:[e.jsx("h1",{className:"text-base sm:text-xl font-bold text-gray-900",children:"Chat com IA"}),e.jsx("p",{className:"text-xs sm:text-sm text-gray-500",children:"Assistente inteligente"})]})]}),e.jsxs(ee,{className:"bg-gradient-to-r from-green-500 to-emerald-500 text-xs sm:text-sm",children:[e.jsx(ja,{className:"h-3 w-3 mr-1"}),"Online"]})]})}),e.jsx("div",{className:"flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-4",children:L?e.jsxs(e.Fragment,{children:[(d||g.length>0)&&e.jsx(Ya,{isSearching:d,searchResults:g,searchQuery:j}),p.length>0&&e.jsx(Ja,{sources:p,isSearching:d}),N.length>0&&e.jsx("div",{className:"mb-4",children:e.jsx(ss,{downloads:N})}),_.length>0&&e.jsx("div",{className:"mb-4 space-y-4",children:_.map((o,c)=>e.jsx(os,{toolName:o.toolName,parameters:o.parameters,userId:(m==null?void 0:m.id)||"",conversationId:w||"",onComplete:l=>{console.log("Execução Super AI concluída:",l)}},c))}),L.messages.map(o=>{var l;const c=(l=o.content)==null?void 0:l.match(/INTEGRATION_CONNECT:(\w+):([^🔗]+)/);if(c&&o.role==="assistant"){const[,x,v]=c,k=o.content.replace(/🔗 \*\*INTEGRATION_CONNECT:[^🔗]+🔗\*\* 🔗\n\n/,"");return e.jsx("div",{className:"flex justify-start",children:e.jsxs("div",{className:"max-w-[80%]",children:[e.jsx(V,{className:"bg-white mb-2",children:e.jsx(B,{className:"p-4",children:e.jsxs("div",{className:"flex items-start gap-2",children:[e.jsx(xe,{className:"h-5 w-5 text-blue-600 mt-1 flex-shrink-0"}),e.jsx("div",{className:"flex-1 whitespace-pre-wrap break-words text-sm text-gray-900",children:k})]})})}),e.jsx(es,{platform:x,platformName:v.trim(),onSkip:()=>{console.log("Conexão pulada:",x)},onSuccess:()=>{console.log("Conectado com sucesso:",x)}})]})},o.id)}return e.jsx("div",{className:`flex ${o.role==="user"?"justify-end":"justify-start"} mb-4`,children:e.jsx(V,{className:`max-w-[85%] sm:max-w-[80%] md:max-w-[75%] lg:max-w-[70%] ${o.role==="user"?"bg-gradient-to-r from-blue-500 to-purple-500 text-white":"bg-white"}`,children:e.jsxs(B,{className:"p-3 sm:p-4",children:[e.jsxs("div",{className:"flex items-start gap-2",children:[o.role==="assistant"&&e.jsx(xe,{className:"h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mt-1 flex-shrink-0"}),e.jsx("div",{className:`flex-1 whitespace-pre-wrap break-words text-xs sm:text-sm ${o.role==="user"?"text-white":"text-gray-900"}`,style:{wordBreak:"break-word",overflowWrap:"break-word"},children:o.content})]}),e.jsx("div",{className:`text-xs mt-2 ${o.role==="user"?"text-white/70":"text-gray-500"}`,children:o.timestamp?new Date(o.timestamp).toLocaleTimeString("pt-BR"):""})]})})},o.id)}),re&&e.jsx(Aa,{isThinking:re,currentTool:D,reasoning:W,sources:U,status:"thinking"}),re&&e.jsx("div",{className:"flex justify-start",children:e.jsx(V,{className:"bg-white",children:e.jsx(B,{className:"p-4",children:e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(ae,{className:"h-4 w-4 animate-spin text-blue-600"}),e.jsx("span",{className:"text-sm text-gray-500",children:"Processando..."})]})})})}),e.jsx("div",{ref:Te})]}):e.jsx("div",{className:"flex items-center justify-center h-full text-muted-foreground",children:e.jsx("p",{children:"Selecione ou crie uma conversa para começar."})})}),e.jsxs("div",{className:"border-t border-gray-200 p-2 sm:p-4 bg-white/80 backdrop-blur-xl",children:[e.jsx("div",{className:"hidden sm:flex gap-2 mb-2",children:ws.map(o=>e.jsx(T,{variant:"outline",size:"sm",onClick:()=>Ke(o),className:"text-xs",children:o},o))}),e.jsxs("div",{className:"relative",children:[e.jsx(Ba,{value:t,onChange:o=>a(o.target.value),onKeyDown:o=>{o.key==="Enter"&&!o.shiftKey&&(o.preventDefault(),pe())},placeholder:"Digite sua mensagem...",className:"w-full resize-none rounded-lg border bg-background p-2 sm:p-3 pr-16 sm:pr-24 min-h-[40px] sm:min-h-[48px] text-sm",minRows:1,maxRows:5,maxLength:ce}),e.jsxs("div",{className:"absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 flex gap-1",children:[e.jsx("input",{type:"file",ref:Re,onChange:ea,className:"hidden"}),e.jsx(T,{type:"button",size:"icon",variant:"ghost",onClick:Xe,className:"h-7 w-7 sm:h-8 sm:w-8",children:e.jsx(Ia,{className:"h-3 w-3 sm:h-4 sm:w-4"})}),e.jsx(T,{type:"button",size:"icon",variant:"ghost",onClick:de?Ye:Ze,disabled:!w,className:`h-7 w-7 sm:h-8 sm:w-8 ${de?"text-red-500 animate-pulse":""}`,children:e.jsx(Ca,{className:"h-3 w-3 sm:h-4 sm:w-4"})}),e.jsx(T,{type:"submit",size:"icon",onClick:pe,disabled:t.trim()===""||!w,className:"h-7 w-7 sm:h-8 sm:w-8",children:e.jsx(xa,{className:"h-3 w-3 sm:h-4 sm:w-4"})})]})]}),e.jsxs("p",{className:be("text-xs text-right mt-1",t.length>ce?"text-destructive":"text-muted-foreground"),children:[t.length," / ",ce]})]})]})]})};export{Fs as default};
