var Fe=Object.defineProperty;var $e=(r,a,s)=>a in r?Fe(r,a,{enumerable:!0,configurable:!0,writable:!0,value:s}):r[a]=s;var oe=(r,a,s)=>$e(r,typeof a!="symbol"?a+"":a,s);import{c as Ce,r as p,R as de,o as Ue,p as Ve,q as Be,j as e,t as Ie,v as X,g as $,l as U,B as O,s as T,n as me,h as He,i as We,w as ne,u as Qe,x as k,y as Ke,f as Xe,X as Ye,M as Ze,a as ie,z as Je,A as ea}from"./index-DfRbf7va.js";import{G as je}from"./globe-CXZE_3pI.js";import{E as te}from"./external-link-DyrFtekv.js";import{C as aa}from"./clock-COjH98-H.js";import{D as ye}from"./download-p0viF0cc.js";import{P as sa}from"./progress-Dbvq9wRK.js";import{C as se}from"./circle-x-8CBBRxHx.js";import{C as ta}from"./circle-alert-BOUvpt0o.js";import{i as ee,I as ce}from"./integrationsService-PQPzkn9S.js";import{P as ra}from"./plus-6PJPHc2h.js";import{M as oa}from"./message-square-Z0MI1rM3.js";import{T as na}from"./trash-2-BpnbdMXi.js";import{S as ia}from"./sparkles-CDRktLqS.js";import{S as ca}from"./send-p2X82wDh.js";/**
 * @license lucide-react v0.417.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Te=Ce("FileArchive",[["path",{d:"M10 12v-1",key:"v7bkov"}],["path",{d:"M10 18v-2",key:"1cjy8d"}],["path",{d:"M10 7V6",key:"dljcrl"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M15.5 22H18a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v16a2 2 0 0 0 .274 1.01",key:"gkbcor"}],["circle",{cx:"10",cy:"20",r:"2",key:"1xzdoj"}]]);/**
 * @license lucide-react v0.417.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const da=Ce("Paperclip",[["path",{d:"m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48",key:"1u3ebp"}]]);function le(){return le=Object.assign?Object.assign.bind():function(r){for(var a=1;a<arguments.length;a++){var s=arguments[a];for(var t in s)({}).hasOwnProperty.call(s,t)&&(r[t]=s[t])}return r},le.apply(null,arguments)}function la(r,a){if(r==null)return{};var s={};for(var t in r)if({}.hasOwnProperty.call(r,t)){if(a.indexOf(t)!==-1)continue;s[t]=r[t]}return s}var ma=p.useLayoutEffect,ua=function(a){var s=de.useRef(a);return ma(function(){s.current=a}),s},ve=function(a,s){if(typeof a=="function"){a(s);return}a.current=s},ga=function(a,s){var t=de.useRef();return de.useCallback(function(n){a.current=n,t.current&&ve(t.current,null),t.current=s,s&&ve(s,n)},[s])},Se={"min-height":"0","max-height":"none",height:"0",visibility:"hidden",overflow:"hidden",position:"absolute","z-index":"-1000",top:"0",right:"0",display:"block"},pa=function(a){Object.keys(Se).forEach(function(s){a.style.setProperty(s,Se[s],"important")})},Ae=pa,R=null,Ee=function(a,s){var t=a.scrollHeight;return s.sizingStyle.boxSizing==="border-box"?t+s.borderSize:t-s.paddingSize};function ha(r,a,s,t){s===void 0&&(s=1),t===void 0&&(t=1/0),R||(R=document.createElement("textarea"),R.setAttribute("tabindex","-1"),R.setAttribute("aria-hidden","true"),Ae(R)),R.parentNode===null&&document.body.appendChild(R);var n=r.paddingSize,c=r.borderSize,d=r.sizingStyle,S=d.boxSizing;Object.keys(d).forEach(function(m){var u=m;R.style[u]=d[u]}),Ae(R),R.value=a;var g=Ee(R,r);R.value=a,g=Ee(R,r),R.value="x";var A=R.scrollHeight-n,I=A*s;S==="border-box"&&(I=I+n+c),g=Math.max(I,g);var E=A*t;return S==="border-box"&&(E=E+n+c),g=Math.min(E,g),[g,A]}var be=function(){},fa=function(a,s){return a.reduce(function(t,n){return t[n]=s[n],t},{})},xa=["borderBottomWidth","borderLeftWidth","borderRightWidth","borderTopWidth","boxSizing","fontFamily","fontSize","fontStyle","fontWeight","letterSpacing","lineHeight","paddingBottom","paddingLeft","paddingRight","paddingTop","tabSize","textIndent","textRendering","textTransform","width","wordBreak","wordSpacing","scrollbarGutter"],va=!!document.documentElement.currentStyle,Sa=function(a){var s=window.getComputedStyle(a);if(s===null)return null;var t=fa(xa,s),n=t.boxSizing;if(n==="")return null;va&&n==="border-box"&&(t.width=parseFloat(t.width)+parseFloat(t.borderRightWidth)+parseFloat(t.borderLeftWidth)+parseFloat(t.paddingRight)+parseFloat(t.paddingLeft)+"px");var c=parseFloat(t.paddingBottom)+parseFloat(t.paddingTop),d=parseFloat(t.borderBottomWidth)+parseFloat(t.borderTopWidth);return{sizingStyle:t,paddingSize:c,borderSize:d}},Aa=Sa;function ue(r,a,s){var t=ua(s);p.useLayoutEffect(function(){var n=function(d){return t.current(d)};if(r)return r.addEventListener(a,n),function(){return r.removeEventListener(a,n)}},[])}var Ea=function(a,s){ue(document.body,"reset",function(t){a.current.form===t.target&&s(t)})},ba=function(a){ue(window,"resize",a)},Na=function(a){ue(document.fonts,"loadingdone",a)},wa=["cacheMeasurements","maxRows","minRows","onChange","onHeightChange"],Ca=function(a,s){var t=a.cacheMeasurements,n=a.maxRows,c=a.minRows,d=a.onChange,S=d===void 0?be:d,g=a.onHeightChange,A=g===void 0?be:g,I=la(a,wa),E=I.value!==void 0,m=p.useRef(null),u=ga(m,s),h=p.useRef(0),N=p.useRef(),M=function(){var y=m.current,v=t&&N.current?N.current:Aa(y);if(v){N.current=v;var G=ha(v,y.value||y.placeholder||"x",c,n),q=G[0],Y=G[1];h.current!==q&&(h.current=q,y.style.setProperty("height",q+"px","important"),A(q,{rowHeight:Y}))}},Q=function(y){E||M(),S(y)};return p.useLayoutEffect(M),Ea(m,function(){if(!E){var i=m.current.value;requestAnimationFrame(function(){var y=m.current;y&&i!==y.value&&M()})}}),ba(M),Na(M),p.createElement("textarea",le({},I,{onChange:Q,ref:u}))},Ia=p.forwardRef(Ca);const ja={emailSummary:!0,emailAlerts:!0,emailNews:!1,pushMentions:!0,pushIntegrations:!1,pushSuggestions:!0},Ne=Ue()(Ve(r=>({aiSystemPrompt:"Você é o SyncAds AI, um assistente de marketing digital especializado em otimização de campanhas. Seja proativo, criativo e forneça insights baseados em dados. Suas respostas devem ser claras, concisas e sempre focadas em ajudar o usuário a atingir seus objetivos de marketing.",aiInitialGreetings:["Show, chegou no lugar certo. Eu automatizo o que os outros demoram três reuniões pra entender. O que a gente vai otimizar hoje?","Relaxa, aqui não tem blá-blá-blá. Só plano, execução e conversão. Passa o produto e o público.","Beleza. Eu sou o motor que transforma tentativa em lucro. Quer começar pequeno ou já quer escalar até o servidor pedir arrego?","Ótimo. Se você quiser aula, vai pro YouTube. Se quiser dinheiro rodando, me dá os dados e deixa eu fazer o estrago.","Ah, ótimo… mais um querendo vender antes de entender o jogo. Respira. Me diz o produto — eu transformo tua ideia num motivo pra alguém gastar dinheiro agora.","Bem-vindo ao lado escuro do funil. Aqui a gente não inspira ninguém — a gente convence. Cê tá pronto pra sujar um pouco as mãos ou prefere PowerPoint?","Se você quer motivação, compra um livro. Se quer resultado, me dá acesso ao checkout e segura o ROI.","Eu sou o algoritmo de ressaca: sarcástico, funcional e viciado em lucro. Fala o que você vende antes que eu comece a julgar teu nicho.","Parabéns, você acabou de invocar o espírito da conversão. Sem papo de mindset, sem desculpa. Quer que eu destrinche teu tráfego ou tua vergonha de anunciar?"],isTwoFactorEnabled:!1,notificationSettings:ja,setAiSystemPrompt:a=>r({aiSystemPrompt:a}),setAiInitialGreetings:a=>r({aiInitialGreetings:a}),addAiGreeting:a=>r(s=>({aiInitialGreetings:[...s.aiInitialGreetings,a]})),removeAiGreeting:a=>r(s=>({aiInitialGreetings:s.aiInitialGreetings.filter((t,n)=>n!==a)})),updateAiGreeting:(a,s)=>r(t=>({aiInitialGreetings:t.aiInitialGreetings.map((n,c)=>c===a?s:n)})),setTwoFactorEnabled:a=>r({isTwoFactorEnabled:a}),updateNotificationSettings:a=>r(s=>({notificationSettings:{...s.notificationSettings,...a}}))}),{name:"settings-storage",storage:Be(()=>localStorage),partialize:r=>({aiSystemPrompt:r.aiSystemPrompt,aiInitialGreetings:r.aiInitialGreetings,isTwoFactorEnabled:r.isTwoFactorEnabled,notificationSettings:r.notificationSettings})})),ya=`
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
`;function Ta(r){const a=/```campaign-create\s*\n([\s\S]*?)```/,s=r.match(a);if(!s)return null;try{const t=JSON.parse(s[1].trim());return!t.name||!t.platform||!t.budgetTotal||!t.startDate?(console.error("Campaign data missing required fields"),null):["Google Ads","Meta","LinkedIn"].includes(t.platform)?{action:"create_campaign",data:{name:t.name,platform:t.platform,budgetTotal:Number(t.budgetTotal),startDate:t.startDate,endDate:t.endDate||void 0,objective:t.objective||"Conversões"}}:(console.error("Invalid platform:",t.platform),null)}catch(t){return console.error("Failed to parse campaign data:",t),null}}function Ra(r){return r.replace(/```campaign-create\s*\n[\s\S]*?```/g,"").trim()}const Oa=`
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
`,we=["Show, chegou no lugar certo. Eu automatizo o que os outros demoram três reuniões pra entender. O que a gente vai otimizar hoje?","Relaxa, aqui não tem blá-blá-blá. Só plano, execução e conversão. Passa o produto e o público.","Beleza. Eu sou o motor que transforma tentativa em lucro. Quer começar pequeno ou já quer escalar até o servidor pedir arrego?","Ótimo. Se você quiser aula, vai pro YouTube. Se quiser dinheiro rodando, me dá os dados e deixa eu fazer o estrago.","Ah, ótimo… mais um querendo vender antes de entender o jogo. Respira. Me diz o produto — eu transformo tua ideia num motivo pra alguém gastar dinheiro agora.","Bem-vindo ao lado escuro do funil. Aqui a gente não inspira ninguém — a gente convence. Cê tá pronto pra sujar um pouco as mãos ou prefere PowerPoint?","Se você quer motivação, compra um livro. Se quer resultado, me dá acesso ao checkout e segura o ROI.","Eu sou o algoritmo de ressaca: sarcástico, funcional e viciado em lucro. Fala o que você vende antes que eu comece a julgar teu nicho.","Parabéns, você acabou de invocar o espírito da conversão. Sem papo de mindset, sem desculpa. Quer que eu destrinche teu tráfego ou tua vergonha de anunciar?"];function Da(){return we[Math.floor(Math.random()*we.length)]}const ka=({isSearching:r,searchResults:a=[],searchQuery:s})=>!r&&a.length===0?null:e.jsxs("div",{className:"mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg",children:[e.jsxs("div",{className:"flex items-center gap-2 mb-2",children:[e.jsx(Ie,{className:"h-4 w-4 text-blue-600"}),e.jsx("span",{className:"text-sm font-medium text-blue-800",children:r?"Pesquisando na web...":"Resultados da pesquisa:"})]}),s&&e.jsxs("p",{className:"text-xs text-blue-600 mb-2",children:[e.jsx("strong",{children:"Consulta:"}),' "',s,'"']}),r?e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("div",{className:"flex gap-1",children:[1,2,3].map(t=>e.jsx("div",{className:"w-2 h-2 bg-blue-400 rounded-full animate-pulse",style:{animationDelay:`${t*.2}s`}},t))}),e.jsx("span",{className:"text-xs text-blue-600",children:"Buscando informações..."})]}):e.jsx("div",{className:"space-y-2",children:a.slice(0,3).map((t,n)=>e.jsxs("div",{className:"flex items-start gap-2 p-2 bg-white rounded border",children:[e.jsx("div",{className:"flex-shrink-0 mt-0.5",children:t.favicon?e.jsx("img",{src:t.favicon,alt:"",className:"w-4 h-4",onError:c=>{c.currentTarget.style.display="none"}}):e.jsx(je,{className:"w-4 h-4 text-gray-400"})}),e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsx("h4",{className:"text-xs font-medium text-gray-900 truncate",children:t.title}),e.jsx("p",{className:"text-xs text-gray-600 line-clamp-2",children:t.snippet}),e.jsxs("a",{href:t.url,target:"_blank",rel:"noopener noreferrer",className:"text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1",children:[e.jsx(te,{className:"w-3 h-3"}),"Ver fonte"]})]})]},n))})]}),Pa=({sources:r,isSearching:a})=>a?e.jsxs("div",{className:"mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg",children:[e.jsxs("div",{className:"flex items-center gap-2 mb-2",children:[e.jsx(Ie,{className:"h-4 w-4 text-blue-600"}),e.jsx("span",{className:"text-sm font-medium text-blue-800",children:"Pesquisando em múltiplas fontes..."})]}),e.jsx("div",{className:"flex gap-2 flex-wrap",children:r.map((s,t)=>e.jsxs("div",{className:"flex items-center gap-1 px-2 py-1 bg-white rounded border text-xs text-gray-600",children:[e.jsx(je,{className:"w-3 h-3"}),s]},t))})]}):null,Ma=({platform:r,platformName:a,icon:s,onSkip:t,onSuccess:n})=>{const[c,d]=p.useState(!1),[S,g]=p.useState("idle"),A=async()=>{d(!0),g("connecting");try{const{data:{session:E}}=await T.auth.getSession();if(!E)throw new Error("Você precisa estar logado");const m=await fetch("https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/oauth-init",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${E.access_token}`},body:JSON.stringify({platform:r.toUpperCase(),redirectUrl:`${window.location.origin}/oauth/callback`})});if(!m.ok)throw new Error("Falha ao iniciar conexão");const{authUrl:u}=await m.json(),h=600,N=700,M=window.screen.width/2-h/2,Q=window.screen.height/2-N/2,i=window.open(u,"oauth-popup",`width=${h},height=${N},left=${M},top=${Q}`),y=v=>{var G,q;((G=v.data)==null?void 0:G.type)==="oauth-success"?(g("success"),d(!1),i==null||i.close(),n==null||n(),window.removeEventListener("message",y)):((q=v.data)==null?void 0:q.type)==="oauth-error"&&(g("error"),d(!1),i==null||i.close(),window.removeEventListener("message",y))};window.addEventListener("message",y),setTimeout(()=>{c&&(g("error"),d(!1),i==null||i.close())},5*60*1e3)}catch(E){console.error("Erro ao conectar:",E),g("error"),d(!1)}},I=()=>s||{facebook:"📘",meta:"📘",google:"🔍",linkedin:"💼",tiktok:"🎵",twitter:"🐦",canva:"🎨",instagram:"📸"}[r.toLowerCase()]||"🔗";return e.jsxs("div",{className:"my-4 animate-in fade-in slide-in-from-bottom-2 duration-300",children:[e.jsx("div",{className:"mb-3",children:e.jsxs("p",{className:"text-sm text-gray-700",children:["Vou conectar sua conta do ",e.jsx("strong",{children:a})," ao SyncAds."]})}),c&&e.jsxs("div",{className:"flex items-center gap-2 mb-3 text-sm text-blue-600",children:[e.jsx("span",{className:"text-2xl",children:I()}),e.jsxs("span",{children:["Connecting ",a,"..."]}),e.jsx(X,{className:"h-4 w-4 animate-spin"})]}),e.jsx($,{className:"border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow",children:e.jsxs(U,{className:"p-5",children:[e.jsx("div",{className:"mb-4",children:e.jsxs("p",{className:"text-sm text-gray-600 leading-relaxed",children:["I'll need to connect your ",e.jsx("strong",{className:"text-gray-900",children:a})," account to continue."]})}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(O,{onClick:()=>t==null?void 0:t(),variant:"ghost",disabled:c,className:"text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all",children:"Skip"}),e.jsx(O,{onClick:A,disabled:c,className:"flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium shadow-sm hover:shadow transition-all disabled:opacity-60",children:c?e.jsxs(e.Fragment,{children:[e.jsx(X,{className:"mr-2 h-4 w-4 animate-spin"}),"Connecting..."]}):e.jsxs(e.Fragment,{children:[e.jsx("svg",{className:"mr-2 h-4 w-4",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M13 10V3L4 14h7v7l9-11h-7z"})}),"Connect ",a]})})]}),e.jsx("div",{className:"mt-4 pt-4 border-t border-gray-100",children:e.jsxs("a",{href:"/privacy",target:"_blank",className:"text-xs text-gray-400 hover:text-blue-600 flex items-center gap-1 transition-colors",children:[e.jsx("svg",{className:"h-3 w-3",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"})}),"How we handle your data",e.jsx(te,{className:"h-3 w-3"})]})}),S==="success"&&e.jsx("div",{className:"mt-3 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700",children:"✅ Conectado com sucesso!"}),S==="error"&&e.jsx("div",{className:"mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700",children:"❌ Erro ao conectar. Tente novamente."})]})})]})},qa=({downloadUrl:r,fileName:a,expiresAt:s,fileCount:t,campaignName:n,platform:c,period:d})=>{const S=()=>{const A=document.createElement("a");A.href=r,A.download=a,document.body.appendChild(A),A.click(),document.body.removeChild(A)},g=A=>{const I=new Date(A),E=new Date,m=I.getTime()-E.getTime(),u=Math.floor(m/(1e3*60*60)),h=Math.floor(m%(1e3*60*60)/(1e3*60));return u>0?`${u}h ${h}min`:`${h}min`};return e.jsx($,{className:"w-full max-w-md bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200",children:e.jsx(U,{className:"p-4",children:e.jsxs("div",{className:"flex items-start gap-3",children:[e.jsx("div",{className:"flex-shrink-0",children:e.jsx(Te,{className:"h-8 w-8 text-blue-600"})}),e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsxs("div",{className:"flex items-center gap-2 mb-2",children:[e.jsx("h4",{className:"font-medium text-gray-900 truncate",children:a}),e.jsxs(me,{variant:"secondary",className:"text-xs",children:[t," arquivo",t!==1?"s":""]})]}),e.jsxs("div",{className:"space-y-1 mb-3",children:[n&&e.jsxs("p",{className:"text-sm text-gray-600",children:[e.jsx("span",{className:"font-medium",children:"Campanha:"})," ",n]}),c&&e.jsxs("p",{className:"text-sm text-gray-600",children:[e.jsx("span",{className:"font-medium",children:"Plataforma:"})," ",c]}),d&&e.jsxs("p",{className:"text-sm text-gray-600",children:[e.jsx("span",{className:"font-medium",children:"Período:"})," ",d]})]}),e.jsxs("div",{className:"flex items-center gap-1 text-xs text-orange-600 mb-3",children:[e.jsx(aa,{className:"h-3 w-3"}),e.jsxs("span",{children:["Expira em ",g(s)]})]}),e.jsxs("div",{className:"flex gap-2",children:[e.jsxs(O,{onClick:S,size:"sm",className:"flex-1",children:[e.jsx(ye,{className:"h-4 w-4 mr-2"}),"Baixar"]}),e.jsx(O,{variant:"outline",size:"sm",onClick:()=>window.open(r,"_blank"),children:e.jsx(te,{className:"h-4 w-4"})})]})]})]})})})},La=({downloads:r})=>r.length===0?null:e.jsxs("div",{className:"space-y-3",children:[e.jsxs("h3",{className:"text-sm font-medium text-gray-700 flex items-center gap-2",children:[e.jsx(Te,{className:"h-4 w-4"}),"Downloads Disponíveis (",r.length,")"]}),e.jsx("div",{className:"space-y-2",children:r.map((a,s)=>e.jsx(qa,{...a},s))})]}),_a=({result:r,onDownload:a,onRetry:s})=>{var I,E;const[t,n]=p.useState(0),[c,d]=p.useState(!0);p.useEffect(()=>{if(r.steps&&r.steps.length>0){const m=setInterval(()=>{n(u=>u<r.steps.length-1?u+1:(d(!1),clearInterval(m),u))},1e3);return()=>clearInterval(m)}},[r.steps]);const S=(m,u)=>u<t?m.status==="completed"?e.jsx(ne,{className:"h-4 w-4 text-green-600"}):e.jsx(se,{className:"h-4 w-4 text-red-600"}):u===t?m.status==="running"?e.jsx(X,{className:"h-4 w-4 text-blue-600 animate-spin"}):m.status==="completed"?e.jsx(ne,{className:"h-4 w-4 text-green-600"}):e.jsx(se,{className:"h-4 w-4 text-red-600"}):e.jsx("div",{className:"h-4 w-4 rounded-full border-2 border-gray-300"}),g=(m,u)=>u<t?m.status==="completed"?"completed":"failed":u===t?m.status:"pending",A=r.steps?Math.round(t/r.steps.length*100):100;return e.jsxs($,{className:"w-full max-w-2xl mx-auto",children:[e.jsxs(He,{children:[e.jsxs(We,{className:"flex items-center gap-2",children:[r.success?e.jsx(ne,{className:"h-5 w-5 text-green-600"}):e.jsx(se,{className:"h-5 w-5 text-red-600"}),e.jsx("span",{className:r.success?"text-green-600":"text-red-600",children:r.success?"Execução Concluída":"Execução Falhou"})]}),e.jsx("p",{className:"text-sm text-gray-600",children:r.message})]}),e.jsxs(U,{className:"space-y-4",children:[e.jsxs("div",{className:"space-y-2",children:[e.jsxs("div",{className:"flex justify-between text-sm",children:[e.jsx("span",{children:"Progresso"}),e.jsxs("span",{children:[A,"%"]})]}),e.jsx(sa,{value:A,className:"h-2"})]}),r.steps&&r.steps.length>0&&e.jsxs("div",{className:"space-y-3",children:[e.jsx("h4",{className:"text-sm font-medium text-gray-700",children:"Etapas de Execução:"}),e.jsx("div",{className:"space-y-2",children:r.steps.map((m,u)=>{const h=g(m,u),N=u===t;return e.jsxs("div",{className:`flex items-start gap-3 p-3 rounded-lg transition-all ${N?"bg-blue-50 border border-blue-200":""} ${h==="completed"?"bg-green-50":""} ${h==="failed"?"bg-red-50":""}`,children:[S(m,u),e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{className:`text-sm font-medium ${h==="completed"?"text-green-700":h==="failed"?"text-red-700":h==="running"?"text-blue-700":"text-gray-700"}`,children:m.step}),e.jsx(me,{variant:h==="completed"?"default":h==="failed"?"destructive":h==="running"?"secondary":"outline",className:"text-xs",children:h==="completed"?"Concluído":h==="failed"?"Falhou":h==="running"?"Executando":"Pendente"})]}),m.details&&e.jsx("p",{className:"text-xs text-gray-600 mt-1",children:m.details}),m.error&&e.jsxs("div",{className:"flex items-center gap-1 mt-1",children:[e.jsx(ta,{className:"h-3 w-3 text-red-500"}),e.jsx("p",{className:"text-xs text-red-600",children:m.error})]})]})]},u)})})]}),r.nextActions&&r.nextActions.length>0&&e.jsxs("div",{className:"space-y-2",children:[e.jsx("h4",{className:"text-sm font-medium text-gray-700",children:"Sugestões:"}),e.jsx("ul",{className:"space-y-1",children:r.nextActions.map((m,u)=>e.jsxs("li",{className:"flex items-center gap-2 text-xs text-gray-600",children:[e.jsx("div",{className:"h-1 w-1 bg-gray-400 rounded-full"}),m]},u))})]}),r.data&&e.jsxs("div",{className:"space-y-2",children:[e.jsx("h4",{className:"text-sm font-medium text-gray-700",children:"Resultado:"}),e.jsx("div",{className:"bg-gray-50 p-3 rounded-lg",children:e.jsx("pre",{className:"text-xs text-gray-600 whitespace-pre-wrap",children:JSON.stringify(r.data,null,2)})})]}),e.jsxs("div",{className:"flex gap-2 pt-4",children:[((I=r.data)==null?void 0:I.downloadUrl)&&a&&e.jsxs(O,{onClick:()=>a(r.data.downloadUrl,r.data.fileName),className:"flex-1",children:[e.jsx(ye,{className:"h-4 w-4 mr-2"}),"Baixar Arquivo"]}),((E=r.data)==null?void 0:E.url)&&e.jsxs(O,{variant:"outline",onClick:()=>window.open(r.data.url,"_blank"),children:[e.jsx(te,{className:"h-4 w-4 mr-2"}),"Ver Site"]}),!r.success&&s&&e.jsx(O,{variant:"outline",onClick:s,children:"Tentar Novamente"})]})]})]})},za=({toolName:r,parameters:a,userId:s,organizationId:t,conversationId:n,onComplete:c})=>{const[d,S]=p.useState(null),[g,A]=p.useState(!1),[I,E]=p.useState(null),m=async()=>{A(!0),E(null),S(null);try{const{data:u,error:h}=await supabase.functions.invoke("super-ai-tools",{body:{toolName:r,parameters:a,userId:s,organizationId:t,conversationId:n}});if(h)throw new Error(h.message);const N=u;S(N),c&&c(N)}catch(u){E(u instanceof Error?u.message:"Erro desconhecido")}finally{A(!1)}};return p.useEffect(()=>{m()},[]),g?e.jsx($,{className:"w-full max-w-2xl mx-auto",children:e.jsx(U,{className:"p-6",children:e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx(X,{className:"h-5 w-5 animate-spin text-blue-600"}),e.jsxs("div",{children:[e.jsxs("h3",{className:"font-medium",children:["Executando ",r]}),e.jsx("p",{className:"text-sm text-gray-600",children:"Processando solicitação..."})]})]})})}):I?e.jsx($,{className:"w-full max-w-2xl mx-auto",children:e.jsxs(U,{className:"p-6",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx(se,{className:"h-5 w-5 text-red-600"}),e.jsxs("div",{children:[e.jsx("h3",{className:"font-medium text-red-600",children:"Erro na Execução"}),e.jsx("p",{className:"text-sm text-gray-600",children:I})]})]}),e.jsx(O,{onClick:m,className:"mt-4",children:"Tentar Novamente"})]})}):d?e.jsx(_a,{result:d,onDownload:(u,h)=>{const N=document.createElement("a");N.href=u,N.download=h,document.body.appendChild(N),N.click(),document.body.removeChild(N)},onRetry:m}):null},Ga=`
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
`;class Fa{constructor(a){oe(this,"userId");this.userId=a}async executeSQL(a){try{if(/DROP|TRUNCATE|DELETE\s+FROM\s+"User"|DELETE\s+FROM\s+"Campaign"/i.test(a))return{success:!1,error:"Query perigosa detectada. Confirmação necessária.",message:"⚠️ Esta query pode ser destrutiva. Por favor, confirme explicitamente."};const{data:t,error:n}=await T.rpc("execute_admin_query",{query_text:a});return n?{success:!1,error:n.message,message:`❌ Erro ao executar SQL: ${n.message}`}:{success:!0,data:t,message:`✅ Query executada com sucesso. ${Array.isArray(t)?t.length:0} registros retornados.`}}catch(s){return{success:!1,error:s.message,message:`❌ Erro: ${s.message}`}}}async analyzeSystem(a,s){try{let t="",n="";switch(a){case"metrics":t=`
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
          `,n="📈 Análise de uso";break;case"errors":return{success:!0,data:{errors:0},message:"✅ Sistema de logging de erros a ser implementado"}}const{data:c,error:d}=await T.rpc("execute_admin_query",{query_text:t});if(d)throw d;return{success:!0,data:c,message:`${n} - Período: ${s}`}}catch(t){return{success:!1,error:t.message,message:`❌ Erro ao analisar sistema: ${t.message}`}}}async manageIntegration(a,s,t){try{switch(a){case"test":return{success:!0,message:`🔍 Testando integração com ${s}... (A implementar com APIs reais)`,data:{status:"pending"}};case"connect":const{data:n,error:c}=await T.from("Integration").insert({userId:this.userId,platform:s.toUpperCase(),credentials:t||{},isConnected:!1,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}).select().single();if(c)throw c;return{success:!0,data:n,message:`✅ Integração com ${s} iniciada. Configure as credenciais.`};case"disconnect":return await T.from("Integration").update({isConnected:!1}).eq("platform",s.toUpperCase()).eq("userId",this.userId),{success:!0,message:`✅ Integração com ${s} desconectada.`};default:return{success:!1,error:"Ação desconhecida",message:"❌ Ação não reconhecida"}}}catch(n){return{success:!1,error:n.message,message:`❌ Erro ao gerenciar integração: ${n.message}`}}}async getMetrics(a,s,t){try{let n="",c="*";switch(a){case"users":n="User";break;case"campaigns":n="Campaign";break;case"messages":n="ChatMessage";break;default:return{success:!1,error:"Métrica desconhecida",message:"❌ Métrica não reconhecida"}}const d=`
        SELECT 
          DATE_TRUNC('${t}', created_at) as period,
          ${s==="count"?"COUNT(*)":s==="sum"?"SUM(1)":"AVG(1)"} as value
        FROM "${n}"
        GROUP BY period
        ORDER BY period DESC
        LIMIT 30
      `,{data:S,error:g}=await T.rpc("execute_admin_query",{query_text:d});if(g)throw g;return{success:!0,data:S,message:`📊 Métricas de ${a} agrupadas por ${t}`}}catch(n){return{success:!1,error:n.message,message:`❌ Erro ao obter métricas: ${n.message}`}}}}function $a(r){const a=/```admin-sql\s*\n([\s\S]*?)```/,s=r.match(a);return s?s[1].trim():null}function Ua(r){const a=/```admin-analyze\s*\n([\s\S]*?)```/,s=r.match(a);if(!s)return null;try{return JSON.parse(s[1].trim())}catch{return null}}function Va(r){const a=/```admin-integration\s*\n([\s\S]*?)```/,s=r.match(a);if(!s)return null;try{return JSON.parse(s[1].trim())}catch{return null}}function Ba(r){const a=/```admin-metrics\s*\n([\s\S]*?)```/,s=r.match(a);if(!s)return null;try{return JSON.parse(s[1].trim())}catch{return null}}function Ha(r){return r.replace(/```admin-sql\s*\n[\s\S]*?```/g,"").replace(/```admin-analyze\s*\n[\s\S]*?```/g,"").replace(/```admin-integration\s*\n[\s\S]*?```/g,"").replace(/```admin-metrics\s*\n[\s\S]*?```/g,"").replace(/```admin-logs\s*\n[\s\S]*?```/g,"").replace(/```admin-test-api\s*\n[\s\S]*?```/g,"").replace(/```admin-debug\s*\n[\s\S]*?```/g,"").trim()}function Wa(r){const a=/```integration-connect:(\w+)```/,s=r.match(a);return s?{action:"connect",slug:s[1]}:null}function Qa(r){const a=/```integration-disconnect:(\w+)```/,s=r.match(a);return s?{action:"disconnect",slug:s[1]}:null}function Ka(r){const a=/```integration-status(?::(\w+))?```/,s=r.match(a);return s?{action:"status",slug:s[1]}:null}function Xa(r){return Wa(r)||Qa(r)||Ka(r)}function Ya(r){return r.replace(/```integration-connect:\w+```/g,"").replace(/```integration-disconnect:\w+```/g,"").replace(/```integration-status(?::\w+)?```/g,"").trim()}const Za=`
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
`,Ja=`
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
`;class es{constructor(a){oe(this,"userId");this.userId=a}async auditIntegration(a){try{const{data:s,error:t}=await T.from("Integration").select("*").eq("userId",this.userId).eq("platform",a).single();if(t&&t.code!=="PGRST116")throw t;const n=this.getCapabilities(a),c=s&&s.isConnected?"connected":"disconnected",d={platform:a,status:c,lastSync:(s==null?void 0:s.lastSyncAt)||void 0,capabilities:n,issues:this.detectIssues(s,a),recommendations:this.getRecommendations(c,a)};return{success:!0,data:d,message:this.formatAuditMessage(d)}}catch(s){return{success:!1,error:s.message,message:`❌ Erro ao auditar ${a}: ${s.message}`}}}async auditAll(){try{const a=["META_ADS","GOOGLE_ADS","LINKEDIN_ADS","TIKTOK_ADS","TWITTER_ADS"],s=[];for(const t of a){const n=await this.auditIntegration(t);n.success&&n.data&&s.push(n.data)}return{success:!0,data:s,message:this.formatAllAuditsMessage(s)}}catch(a){return{success:!1,error:a.message,message:`❌ Erro ao auditar integrações: ${a.message}`}}}async listStatus(){try{const{data:a,error:s}=await T.from("Integration").select("platform, isConnected, lastSyncAt").eq("userId",this.userId);if(s)throw s;const t=new Map((a==null?void 0:a.map(d=>[d.platform,d]))||[]),c=["META_ADS","GOOGLE_ADS","LINKEDIN_ADS","TIKTOK_ADS","TWITTER_ADS"].map(d=>{var S,g;return{platform:d,status:t.has(d)&&((S=t.get(d))!=null&&S.isConnected)?"✅ Conectada":"❌ Desconectada",lastSync:((g=t.get(d))==null?void 0:g.lastSyncAt)||"Nunca"}});return{success:!0,data:c,message:this.formatStatusList(c)}}catch(a){return{success:!1,error:a.message,message:`❌ Erro ao listar status: ${a.message}`}}}getCapabilities(a){return{META_ADS:["Criar campanhas de Facebook e Instagram","Segmentação avançada de audiência","Análise de performance em tempo real","Otimização automática de orçamento","A/B testing de criativos","Remarketing e lookalike audiences"],GOOGLE_ADS:["Campanhas de Pesquisa (Search)","Anúncios Display e YouTube","Shopping Ads para e-commerce","Campanhas Performance Max","Análise de conversões e ROI","Smart Bidding automático"],LINKEDIN_ADS:["Anúncios B2B segmentados","Targeting por cargo e empresa","Lead Gen Forms nativos","InMail patrocinado","Análise de engajamento profissional","Retargeting de visitantes"],TIKTOK_ADS:["Vídeos In-Feed","TopView e Brand Takeover","Spark Ads (boost orgânico)","Segmentação por interesse e comportamento","Píxel de conversão","Catálogo de produtos"],TWITTER_ADS:["Tweets promovidos","Segmentação por hashtags e interesse","Audiências customizadas","Análise de engajamento","Campanhas de instalação de app","Vídeos e carrosséis"]}[a]||["Capacidades a definir"]}detectIssues(a,s){const t=[];if(!a)return t.push("Integração não configurada"),t;if(a.isConnected||t.push("Integração desconectada - configure credenciais"),(!a.credentials||Object.keys(a.credentials).length===0)&&t.push("Credenciais não configuradas"),a.lastSync){const n=new Date(a.lastSync),c=(Date.now()-n.getTime())/(1e3*60*60);c>24&&t.push(`Última sincronização há ${Math.floor(c)} horas - pode estar desatualizado`)}return t}getRecommendations(a,s){const t=[];return a==="disconnected"&&(t.push(`Conecte ${this.formatPlatformName(s)} em: Configurações → Integrações`),t.push("Configure sua chave de API para começar a usar")),a==="connected"&&(t.push("✅ Integração ativa! Você já pode criar campanhas"),t.push("Explore as capacidades disponíveis desta plataforma")),t}formatPlatformName(a){return{META_ADS:"Meta Ads (Facebook/Instagram)",GOOGLE_ADS:"Google Ads",LINKEDIN_ADS:"LinkedIn Ads",TIKTOK_ADS:"TikTok Ads",TWITTER_ADS:"Twitter Ads (X)"}[a]||a}formatAuditMessage(a){let t=`
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

`}),s}}function as(r){const a=/```integration-action\s*\n([\s\S]*?)```/,s=r.match(a);if(!s)return null;try{return JSON.parse(s[1].trim())}catch{return null}}function ss(r){return r.replace(/```integration-action\s*\n[\s\S]*?```/g,"").trim()}function ts(r,a){const s=r.toLowerCase(),t=a.toLowerCase(),n=(s.includes("auditor")||s.includes("verificar")||s.includes("status")||s.includes("listar"))&&(s.includes("integra")||s.includes("conex")||s.includes("plataforma")),c=t.includes("vou")&&(t.includes("auditor")||t.includes("verificar"));if(!n||!c)return null;const d={facebook:"META_ADS",instagram:"META_ADS",meta:"META_ADS",google:"GOOGLE_ADS",linkedin:"LINKEDIN_ADS",tiktok:"TIKTOK_ADS",twitter:"TWITTER_ADS"};for(const[S,g]of Object.entries(d))if(s.includes(S))return{action:"audit",platform:g};return{action:"audit_all"}}const rs=["Criar campanha de Facebook Ads","Analisar performance da última semana","Sugerir otimizações"],ae=500,As=()=>{const[r,a]=p.useState(""),[s,t]=p.useState(!0),[n,c]=p.useState(null),[d,S]=p.useState(!1),[g,A]=p.useState([]),[I,E]=p.useState(""),[m,u]=p.useState([]),[h,N]=p.useState([]),[M,Q]=p.useState([]),i=Qe(o=>o.user),y=k(o=>o.conversations),v=k(o=>o.activeConversationId),G=k(o=>o.setActiveConversationId),q=k(o=>o.isAssistantTyping),Y=k(o=>o.setAssistantTyping),W=k(o=>o.addMessage);k(o=>o.deleteConversation),k(o=>o.createNewConversation);const Re=Ke(o=>o.addCampaign),Oe=Ne(o=>o.aiSystemPrompt),De=Ne(o=>o.aiInitialGreetings),ge=p.useRef(null),pe=p.useRef(null),{toast:w}=Xe(),L=y.find(o=>o.id===v),ke=()=>{var o;(o=ge.current)==null||o.scrollIntoView({behavior:"smooth"})};p.useEffect(ke,[L==null?void 0:L.messages,q]),p.useEffect(()=>{(async()=>{if(i)try{const{data:l,error:x}=await T.from("GlobalAiConnection").select("id, systemPrompt, initialGreetings").eq("isActive",!0).limit(1).single();if(x){console.error("Erro ao buscar IA:",x);return}const j=l==null?void 0:l.id;if(j){const{data:b,error:F}=await T.from("GlobalAiConnection").select("systemPrompt, initialGreetings").eq("id",j).single();if(F){console.error("Erro ao buscar config da IA:",F);return}b&&c({systemPrompt:b.systemPrompt||Oe,initialGreetings:b.initialGreetings||De})}}catch(l){console.error("Erro ao carregar IA Global:",l)}})()},[i==null?void 0:i.organizationId]),p.useEffect(()=>{if(L&&L.messages.length===0){const o=Da();setTimeout(()=>{i&&W(i.id,v,{id:`greeting-${Date.now()}`,role:"assistant",content:o})},500)}},[v,L==null?void 0:L.messages.length]);const Pe=o=>{const l=/ZIP_DOWNLOAD:\s*({[^}]+})/g,x=o.match(l);return x&&x.forEach(j=>{try{const b=j.replace("ZIP_DOWNLOAD:","").trim(),F=JSON.parse(b);N(D=>[...D,F])}catch(b){console.error("Erro ao processar download ZIP:",b)}}),o.replace(l,"").trim()},Me=o=>{const l=/SUPER_AI_EXECUTION:\s*({[^}]+})/g,x=o.match(l);return x&&x.forEach(j=>{try{const b=j.replace("SUPER_AI_EXECUTION:","").trim(),F=JSON.parse(b);Q(D=>[...D,F])}catch(b){console.error("Erro ao processar execução Super AI:",b)}}),o.replace(l,"").trim()},he=async()=>{if(r.trim()===""||!v||r.length>ae)return;const o=r;i&&W(i.id,v,{id:`msg-${Date.now()}`,role:"user",content:o}),a(""),t(!1),Y(!0);try{const l=y.find(f=>f.id===v),x=(n==null?void 0:n.systemPrompt)||Oa,j=Ga+`

`+ya+`

`+Za+`

`+Ja+`

`+x,b=((l==null?void 0:l.messages)||[]).slice(-20).map(f=>({role:f.role,content:f.content})),D=(await ea(o,v,b,j)).response,V=Ta(D);if(V)try{i&&(await Re(i.id,{name:V.data.name,platform:V.data.platform,status:"Pausada",budgetTotal:V.data.budgetTotal,budgetSpent:0,impressions:0,clicks:0,conversions:0,startDate:V.data.startDate,endDate:V.data.endDate||"",ctr:0,cpc:0}),w({title:"🎉 Campanha Criada!",description:`A campanha "${V.data.name}" foi criada com sucesso.`}))}catch(f){console.error("Error creating campaign from AI:",f),w({title:"Erro ao criar campanha",description:"Não foi possível criar a campanha automaticamente.",variant:"destructive"})}let xe="";if(i){const f=new Fa(i.id),_=$a(D);if(_){const C=await f.executeSQL(_);w({title:C.success?"✅ SQL Executado":"❌ Erro SQL",description:C.message,variant:C.success?"default":"destructive"})}const K=Ua(D);if(K){const C=await f.analyzeSystem(K.type,K.period);w({title:C.success?"📊 Análise Concluída":"❌ Erro",description:C.message,variant:C.success?"default":"destructive"})}const Z=Va(D);if(Z){const C=await f.manageIntegration(Z.action,Z.platform,Z.credentials);w({title:C.success?"🔗 Integração Atualizada":"❌ Erro",description:C.message,variant:C.success?"default":"destructive"})}const J=Ba(D);if(J){const C=await f.getMetrics(J.metric,J.aggregation,J.groupBy);w({title:C.success?"📈 Métricas Obtidas":"❌ Erro",description:C.message,variant:C.success?"default":"destructive"})}let H=as(D);if(H||(H=ts(o,D)),H){const C=new es(i.id);let z;switch(H.action){case"audit":H.platform&&(z=await C.auditIntegration(H.platform));break;case"audit_all":z=await C.auditAll();break;case"list_status":z=await C.listStatus();break;case"test":case"capabilities":case"diagnose":z={success:!0,message:`Ação "${H.action}" detectada. Implementação em andamento.`};break}z&&(xe=`

`+z.message,w({title:z.success?"✅ Ação Executada":"❌ Erro",description:z.success?"Auditoria concluída com sucesso":z.error||"Erro ao executar ação",variant:z.success?"default":"destructive"}))}}const P=Xa(D);if(P&&i)try{if(P.action==="connect"){const{authUrl:f}=await ee.generateOAuthUrl(P.slug,i.id),_=ce[P.slug];i&&W(i.id,v,{id:`msg-${Date.now()+1}`,role:"assistant",content:`Para conectar ${_.name}, clique no link abaixo:

🔗 [Autorizar ${_.name}](${f})

O link abrirá em uma nova aba para você autorizar o acesso.`}),window.open(f,"_blank"),w({title:"🔗 Link de Autorização",description:`Clique no link para conectar ${_.name}`});return}else if(P.action==="disconnect"){await ee.disconnect(i.id,P.slug);const f=ce[P.slug];w({title:"✅ Desconectado",description:`${f.name} foi desconectado com sucesso.`})}else if(P.action==="status")if(P.slug){const f=await ee.getIntegrationStatus(i.id,P.slug),_=ce[P.slug];w({title:`${_.name}`,description:f!=null&&f.isConnected?"✅ Conectado":"❌ Não conectado"})}else{const f=await ee.listIntegrations(i.id),_=f.filter(K=>K.isConnected).length;w({title:"📊 Status das Integrações",description:`${_} de ${f.length} integrações conectadas`})}}catch(f){console.error("Erro ao processar integração:",f),i&&W(i.id,v,{id:`msg-${Date.now()+2}`,role:"assistant",content:`❌ **Erro ao conectar integração**

${f.message||"Erro ao processar comando de integração"}`}),w({title:"❌ Erro na Integração",description:"Verifique as instruções no chat",variant:"destructive"})}let re=Pe(D);re=Me(re);let B=Ra(re);B=Ha(B),B=Ya(B),B=ss(B),i&&W(i.id,v,{id:`msg-${Date.now()+1}`,role:"assistant",content:B+xe})}catch(l){console.error("Erro ao chamar IA:",l),w({title:"Erro ao gerar resposta",description:l.message||"Não foi possível obter resposta da IA. Verifique sua chave de API.",variant:"destructive"}),i&&W(i.id,v,{id:`msg-${Date.now()+1}`,role:"assistant",content:"❌ Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, verifique se sua chave de API está configurada corretamente nas configurações."})}finally{Y(!1)}},qe=o=>{a(o)},Le=()=>{var o;(o=pe.current)==null||o.click()},_e=o=>{var x;const l=(x=o.target.files)==null?void 0:x[0];l&&w({title:"Arquivo Selecionado",description:`O arquivo "${l.name}" está pronto para ser enviado (simulação).`,variant:"info"}),o.target&&(o.target.value="")},ze=async o=>{try{const{data:l,error:x}=await T.from("ChatMessage").select("id, role, content, createdAt").eq("conversationId",o).order("createdAt",{ascending:!0});if(x)throw x;const j=(l||[]).map(b=>({id:b.id,role:b.role,content:b.content,timestamp:new Date(b.createdAt)}));k.getState().setConversationMessages(o,j),G(o),console.log(`✅ ${j.length} mensagens carregadas da conversa ${o}`)}catch(l){console.error("Erro ao carregar mensagens:",l),w({title:"Erro",description:"Não foi possível carregar mensagens.",variant:"destructive"})}};p.useEffect(()=>{(async()=>{if(!i)return;await k.getState().loadConversations(i.id);const{data:l}=await T.from("ChatConversation").select("id").eq("userId",i.id).limit(1);(!l||l.length===0)&&await fe()})()},[i]);const fe=async()=>{try{if(!i)return;const{data:o}=await T.from("User").select("organizationId").eq("id",i.id).single();if(!(o!=null&&o.organizationId))throw new Error("Usuário sem organização");const l=crypto.randomUUID(),x=new Date().toISOString(),{error:j}=await T.from("ChatConversation").insert({id:l,userId:i.id,organizationId:o.organizationId,title:"🆕 Nova Conversa",createdAt:x,updatedAt:x});if(j)throw j;G(l),await k.getState().loadConversations(i.id),w({title:"✅ Nova conversa criada!",description:"Comece um novo chat do zero."})}catch(o){console.error("Erro ao criar nova conversa:",o),w({title:"Erro",description:o.message||"Não foi possível criar nova conversa.",variant:"destructive"})}},Ge=async o=>{try{await T.from("ChatMessage").delete().eq("conversationId",o);const{error:l}=await T.from("ChatConversation").delete().eq("id",o);if(l)throw l;v===o&&G(null),await k.getState().loadConversations(i.id),w({title:"🗑️ Conversa deletada",description:"A conversa foi removida com sucesso."})}catch(l){console.error("Erro ao deletar conversa:",l),w({title:"Erro",description:"Não foi possível deletar a conversa.",variant:"destructive"})}};return e.jsxs("div",{className:"h-[calc(100vh-80px)] flex",children:[e.jsxs("div",{className:`${s?"w-72":"w-0"} transition-all duration-300 bg-gray-50 border-r border-gray-200 flex flex-col overflow-hidden`,children:[e.jsxs("div",{className:"p-4 border-b border-gray-200",children:[e.jsxs("div",{className:"flex items-center justify-between mb-3",children:[e.jsx("h2",{className:"text-sm font-semibold text-gray-700",children:"Conversas"}),e.jsx(O,{onClick:()=>t(!1),variant:"ghost",size:"sm",className:"h-7 w-7 p-0",children:e.jsx(Ye,{className:"h-4 w-4"})})]}),e.jsxs(O,{onClick:fe,className:"w-full gap-2",size:"sm",children:[e.jsx(ra,{className:"h-4 w-4"}),"Nova Conversa"]})]}),e.jsx("div",{className:"flex-1 overflow-y-auto p-2 space-y-1",children:y.map(o=>e.jsxs("div",{className:`group relative flex items-center gap-2 p-3 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors ${v===o.id?"bg-blue-50 border border-blue-200":"bg-white"}`,onClick:()=>{v!==o.id&&ze(o.id)},children:[e.jsx(oa,{className:"h-4 w-4 text-gray-500 flex-shrink-0"}),e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsx("p",{className:"text-sm font-medium text-gray-900 truncate",children:o.title}),e.jsx("p",{className:"text-xs text-gray-500 truncate",children:o.messages&&o.messages.length>0?o.messages[o.messages.length-1].content.substring(0,50)+"...":"Sem mensagens ainda"})]}),e.jsx(O,{onClick:l=>{l.stopPropagation(),Ge(o.id)},variant:"ghost",size:"sm",className:"h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity",children:e.jsx(na,{className:"h-3.5 w-3.5 text-red-500"})})]},o.id))})]}),e.jsxs("div",{className:"flex-1 flex flex-col",children:[e.jsx("div",{className:"border-b border-gray-200 bg-white/80 backdrop-blur-xl p-4",children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[!s&&e.jsx(O,{onClick:()=>t(!0),variant:"ghost",size:"sm",className:"h-9 w-9 p-0",children:e.jsx(Ze,{className:"h-5 w-5"})}),e.jsx("div",{className:"p-1.5 sm:p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500",children:e.jsx(ie,{className:"h-4 w-4 sm:h-6 sm:w-6 text-white"})}),e.jsxs("div",{children:[e.jsx("h1",{className:"text-base sm:text-xl font-bold text-gray-900",children:"Chat com IA"}),e.jsx("p",{className:"text-xs sm:text-sm text-gray-500",children:"Assistente inteligente"})]})]}),e.jsxs(me,{className:"bg-gradient-to-r from-green-500 to-emerald-500 text-xs sm:text-sm",children:[e.jsx(ia,{className:"h-3 w-3 mr-1"}),"Online"]})]})}),e.jsx("div",{className:"flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-4",children:L?e.jsxs(e.Fragment,{children:[(d||g.length>0)&&e.jsx(ka,{isSearching:d,searchResults:g,searchQuery:I}),m.length>0&&e.jsx(Pa,{sources:m,isSearching:d}),h.length>0&&e.jsx("div",{className:"mb-4",children:e.jsx(La,{downloads:h})}),M.length>0&&e.jsx("div",{className:"mb-4 space-y-4",children:M.map((o,l)=>e.jsx(za,{toolName:o.toolName,parameters:o.parameters,userId:(i==null?void 0:i.id)||"",organizationId:(i==null?void 0:i.organizationId)||"",conversationId:v||"",onComplete:x=>{console.log("Execução Super AI concluída:",x)}},l))}),L.messages.map(o=>{var x;const l=(x=o.content)==null?void 0:x.match(/INTEGRATION_CONNECT:(\w+):([^🔗]+)/);if(l&&o.role==="assistant"){const[,j,b]=l,F=o.content.replace(/🔗 \*\*INTEGRATION_CONNECT:[^🔗]+🔗\*\* 🔗\n\n/,"");return e.jsx("div",{className:"flex justify-start",children:e.jsxs("div",{className:"max-w-[80%]",children:[e.jsx($,{className:"bg-white mb-2",children:e.jsx(U,{className:"p-4",children:e.jsxs("div",{className:"flex items-start gap-2",children:[e.jsx(ie,{className:"h-5 w-5 text-blue-600 mt-1 flex-shrink-0"}),e.jsx("div",{className:"flex-1 whitespace-pre-wrap break-words text-sm text-gray-900",children:F})]})})}),e.jsx(Ma,{platform:j,platformName:b.trim(),onSkip:()=>{console.log("Conexão pulada:",j)},onSuccess:()=>{console.log("Conectado com sucesso:",j)}})]})},o.id)}return e.jsx("div",{className:`flex ${o.role==="user"?"justify-end":"justify-start"} mb-4`,children:e.jsx($,{className:`max-w-[85%] sm:max-w-[80%] md:max-w-[75%] lg:max-w-[70%] ${o.role==="user"?"bg-gradient-to-r from-blue-500 to-purple-500 text-white":"bg-white"}`,children:e.jsxs(U,{className:"p-3 sm:p-4",children:[e.jsxs("div",{className:"flex items-start gap-2",children:[o.role==="assistant"&&e.jsx(ie,{className:"h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mt-1 flex-shrink-0"}),e.jsx("div",{className:`flex-1 whitespace-pre-wrap break-words text-xs sm:text-sm ${o.role==="user"?"text-white":"text-gray-900"}`,style:{wordBreak:"break-word",overflowWrap:"break-word"},children:o.content})]}),e.jsx("div",{className:`text-xs mt-2 ${o.role==="user"?"text-white/70":"text-gray-500"}`,children:o.timestamp?new Date(o.timestamp).toLocaleTimeString("pt-BR"):""})]})})},o.id)}),q&&e.jsx("div",{className:"flex justify-start",children:e.jsx($,{className:"bg-white",children:e.jsx(U,{className:"p-4",children:e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(X,{className:"h-4 w-4 animate-spin text-blue-600"}),e.jsx("span",{className:"text-sm text-gray-500",children:"Processando..."})]})})})}),e.jsx("div",{ref:ge})]}):e.jsx("div",{className:"flex items-center justify-center h-full text-muted-foreground",children:e.jsx("p",{children:"Selecione ou crie uma conversa para começar."})})}),e.jsxs("div",{className:"border-t border-gray-200 p-2 sm:p-4 bg-white/80 backdrop-blur-xl",children:[e.jsx("div",{className:"hidden sm:flex gap-2 mb-2",children:rs.map(o=>e.jsx(O,{variant:"outline",size:"sm",onClick:()=>qe(o),className:"text-xs",children:o},o))}),e.jsxs("div",{className:"relative",children:[e.jsx(Ia,{value:r,onChange:o=>a(o.target.value),onKeyDown:o=>{o.key==="Enter"&&!o.shiftKey&&(o.preventDefault(),he())},placeholder:"Digite sua mensagem...",className:"w-full resize-none rounded-lg border bg-background p-2 sm:p-3 pr-16 sm:pr-24 min-h-[40px] sm:min-h-[48px] text-sm",minRows:1,maxRows:5,maxLength:ae}),e.jsxs("div",{className:"absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 flex gap-1",children:[e.jsx("input",{type:"file",ref:pe,onChange:_e,className:"hidden"}),e.jsx(O,{type:"button",size:"icon",variant:"ghost",onClick:Le,className:"h-7 w-7 sm:h-8 sm:w-8",children:e.jsx(da,{className:"h-3 w-3 sm:h-4 sm:w-4"})}),e.jsx(O,{type:"submit",size:"icon",onClick:he,disabled:r.trim()===""||!v,className:"h-7 w-7 sm:h-8 sm:w-8",children:e.jsx(ca,{className:"h-3 w-3 sm:h-4 sm:w-4"})})]})]}),e.jsxs("p",{className:Je("text-xs text-right mt-1",r.length>ae?"text-destructive":"text-muted-foreground"),children:[r.length," / ",ae]})]})]})]})};export{As as default};
