var Ra=Object.defineProperty;var Da=(s,t,a)=>t in s?Ra(s,t,{enumerable:!0,configurable:!0,writable:!0,value:a}):s[t]=a;var ye=(s,t,a)=>Da(s,typeof t!="symbol"?t+"":t,a);import{c as Oe,r as l,R as Ce,o as Pa,p as Oa,q as ka,j as e,t as Ma,v as ta,w as _a,x as La,y as qa,z as sa,A as za,P as Ga,D as J,E as $a,F as Fa,G as Ua,H as Va,J as Ba,K as Ha,M as me,S as ra,N as re,g as W,l as Q,B as P,s as R,n as se,h as Wa,i as Qa,O as Ka,u as Ve,e as Xa,Q as $,T as Ya,f as Za,X as Be,U as Ja,a as we,V as et}from"./index-DjQrJJfK.js";import{G as oa,S as at}from"./send-D5xB4cEz.js";import{E as oe}from"./external-link-BH46ciKD.js";import{C as tt}from"./clock-YrEcgkY1.js";import{D as je}from"./download-DHY9EFL2.js";import{P as st}from"./progress-CGgPqtOs.js";import{C as rt,A as ot}from"./AiThinkingIndicator-CxVeSsCm.js";import{C as Te}from"./circle-alert-Qgpr9GaW.js";import{C as ke}from"./circle-x-CwOYFyAS.js";import{C as nt}from"./circle-check-CKx3akj7.js";import{i as de,I as Ne}from"./integrationsService-DyrCq1zc.js";import{P as it}from"./plus-IDDjRURE.js";import{M as ct}from"./message-square-FkJhOB4w.js";import{T as lt}from"./trash-2-D9fiudU3.js";import{S as dt}from"./sparkles-w8vgcE5R.js";/**
 * @license lucide-react v0.417.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const na=Oe("FileArchive",[["path",{d:"M10 12v-1",key:"v7bkov"}],["path",{d:"M10 18v-2",key:"1cjy8d"}],["path",{d:"M10 7V6",key:"dljcrl"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M15.5 22H18a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v16a2 2 0 0 0 .274 1.01",key:"gkbcor"}],["circle",{cx:"10",cy:"20",r:"2",key:"1xzdoj"}]]);/**
 * @license lucide-react v0.417.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ut=Oe("Mic",[["path",{d:"M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z",key:"131961"}],["path",{d:"M19 10v2a7 7 0 0 1-14 0v-2",key:"1vc78b"}],["line",{x1:"12",x2:"12",y1:"19",y2:"22",key:"x3vr5v"}]]);/**
 * @license lucide-react v0.417.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const mt=Oe("Paperclip",[["path",{d:"m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48",key:"1u3ebp"}]]);function Ie(){return Ie=Object.assign?Object.assign.bind():function(s){for(var t=1;t<arguments.length;t++){var a=arguments[t];for(var r in a)({}).hasOwnProperty.call(a,r)&&(s[r]=a[r])}return s},Ie.apply(null,arguments)}function pt(s,t){if(s==null)return{};var a={};for(var r in s)if({}.hasOwnProperty.call(s,r)){if(t.indexOf(r)!==-1)continue;a[r]=s[r]}return a}var gt=l.useLayoutEffect,ht=function(t){var a=Ce.useRef(t);return gt(function(){a.current=t}),a},He=function(t,a){if(typeof t=="function"){t(a);return}t.current=a},ft=function(t,a){var r=Ce.useRef();return Ce.useCallback(function(o){t.current=o,r.current&&He(r.current,null),r.current=a,a&&He(a,o)},[a])},We={"min-height":"0","max-height":"none",height:"0",visibility:"hidden",overflow:"hidden",position:"absolute","z-index":"-1000",top:"0",right:"0",display:"block"},xt=function(t){Object.keys(We).forEach(function(a){t.style.setProperty(a,We[a],"important")})},Qe=xt,M=null,Ke=function(t,a){var r=t.scrollHeight;return a.sizingStyle.boxSizing==="border-box"?r+a.borderSize:r-a.paddingSize};function vt(s,t,a,r){a===void 0&&(a=1),r===void 0&&(r=1/0),M||(M=document.createElement("textarea"),M.setAttribute("tabindex","-1"),M.setAttribute("aria-hidden","true"),Qe(M)),M.parentNode===null&&document.body.appendChild(M);var o=s.paddingSize,i=s.borderSize,c=s.sizingStyle,v=c.boxSizing;Object.keys(c).forEach(function(m){var f=m;M.style[f]=c[f]}),Qe(M),M.value=t;var d=Ke(M,s);M.value=t,d=Ke(M,s),M.value="x";var b=M.scrollHeight-o,p=b*a;v==="border-box"&&(p=p+o+i),d=Math.max(p,d);var g=b*r;return v==="border-box"&&(g=g+o+i),d=Math.min(g,d),[d,b]}var Xe=function(){},bt=function(t,a){return t.reduce(function(r,o){return r[o]=a[o],r},{})},St=["borderBottomWidth","borderLeftWidth","borderRightWidth","borderTopWidth","boxSizing","fontFamily","fontSize","fontStyle","fontWeight","letterSpacing","lineHeight","paddingBottom","paddingLeft","paddingRight","paddingTop","tabSize","textIndent","textRendering","textTransform","width","wordBreak","wordSpacing","scrollbarGutter"],Et=!!document.documentElement.currentStyle,At=function(t){var a=window.getComputedStyle(t);if(a===null)return null;var r=bt(St,a),o=r.boxSizing;if(o==="")return null;Et&&o==="border-box"&&(r.width=parseFloat(r.width)+parseFloat(r.borderRightWidth)+parseFloat(r.borderLeftWidth)+parseFloat(r.paddingRight)+parseFloat(r.paddingLeft)+"px");var i=parseFloat(r.paddingBottom)+parseFloat(r.paddingTop),c=parseFloat(r.borderBottomWidth)+parseFloat(r.borderTopWidth);return{sizingStyle:r,paddingSize:i,borderSize:c}},yt=At;function Me(s,t,a){var r=ht(a);l.useLayoutEffect(function(){var o=function(c){return r.current(c)};if(s)return s.addEventListener(t,o),function(){return s.removeEventListener(t,o)}},[])}var wt=function(t,a){Me(document.body,"reset",function(r){t.current.form===r.target&&a(r)})},Nt=function(t){Me(window,"resize",t)},Ct=function(t){Me(document.fonts,"loadingdone",t)},jt=["cacheMeasurements","maxRows","minRows","onChange","onHeightChange"],Tt=function(t,a){var r=t.cacheMeasurements,o=t.maxRows,i=t.minRows,c=t.onChange,v=c===void 0?Xe:c,d=t.onHeightChange,b=d===void 0?Xe:d,p=pt(t,jt),g=p.value!==void 0,m=l.useRef(null),f=ft(m,a),S=l.useRef(0),T=l.useRef(),j=function(){var C=m.current,L=r&&T.current?T.current:yt(C);if(L){T.current=L;var O=vt(L,C.value||C.placeholder||"x",i,o),G=O[0],K=O[1];S.current!==G&&(S.current=G,C.style.setProperty("height",G+"px","important"),b(G,{rowHeight:K}))}},_=function(C){g||j(),v(C)};return l.useLayoutEffect(j),wt(m,function(){if(!g){var E=m.current.value;requestAnimationFrame(function(){var C=m.current;C&&E!==C.value&&j()})}}),Nt(j),Ct(j),l.createElement("textarea",Ie({},p,{onChange:_,ref:f}))},It=l.forwardRef(Tt);const Rt={emailSummary:!0,emailAlerts:!0,emailNews:!1,pushMentions:!0,pushIntegrations:!1,pushSuggestions:!0},Ye=Pa()(Oa(s=>({aiSystemPrompt:"Você é o SyncAds AI, um assistente de marketing digital especializado em otimização de campanhas. Seja proativo, criativo e forneça insights baseados em dados. Suas respostas devem ser claras, concisas e sempre focadas em ajudar o usuário a atingir seus objetivos de marketing.",aiInitialGreetings:["Show, chegou no lugar certo. Eu automatizo o que os outros demoram três reuniões pra entender. O que a gente vai otimizar hoje?","Relaxa, aqui não tem blá-blá-blá. Só plano, execução e conversão. Passa o produto e o público.","Beleza. Eu sou o motor que transforma tentativa em lucro. Quer começar pequeno ou já quer escalar até o servidor pedir arrego?","Ótimo. Se você quiser aula, vai pro YouTube. Se quiser dinheiro rodando, me dá os dados e deixa eu fazer o estrago.","Ah, ótimo… mais um querendo vender antes de entender o jogo. Respira. Me diz o produto — eu transformo tua ideia num motivo pra alguém gastar dinheiro agora.","Bem-vindo ao lado escuro do funil. Aqui a gente não inspira ninguém — a gente convence. Cê tá pronto pra sujar um pouco as mãos ou prefere PowerPoint?","Se você quer motivação, compra um livro. Se quer resultado, me dá acesso ao checkout e segura o ROI.","Eu sou o algoritmo de ressaca: sarcástico, funcional e viciado em lucro. Fala o que você vende antes que eu comece a julgar teu nicho.","Parabéns, você acabou de invocar o espírito da conversão. Sem papo de mindset, sem desculpa. Quer que eu destrinche teu tráfego ou tua vergonha de anunciar?"],isTwoFactorEnabled:!1,notificationSettings:Rt,setAiSystemPrompt:t=>s({aiSystemPrompt:t}),setAiInitialGreetings:t=>s({aiInitialGreetings:t}),addAiGreeting:t=>s(a=>({aiInitialGreetings:[...a.aiInitialGreetings,t]})),removeAiGreeting:t=>s(a=>({aiInitialGreetings:a.aiInitialGreetings.filter((r,o)=>o!==t)})),updateAiGreeting:(t,a)=>s(r=>({aiInitialGreetings:r.aiInitialGreetings.map((o,i)=>i===t?a:o)})),setTwoFactorEnabled:t=>s({isTwoFactorEnabled:t}),updateNotificationSettings:t=>s(a=>({notificationSettings:{...a.notificationSettings,...t}}))}),{name:"settings-storage",storage:ka(()=>localStorage),partialize:s=>({aiSystemPrompt:s.aiSystemPrompt,aiInitialGreetings:s.aiInitialGreetings,isTwoFactorEnabled:s.isTwoFactorEnabled,notificationSettings:s.notificationSettings})}));var[pe]=Ma("Tooltip",[ta]),ge=ta(),ia="TooltipProvider",Dt=700,Re="tooltip.open",[Pt,_e]=pe(ia),ca=s=>{const{__scopeTooltip:t,delayDuration:a=Dt,skipDelayDuration:r=300,disableHoverableContent:o=!1,children:i}=s,c=l.useRef(!0),v=l.useRef(!1),d=l.useRef(0);return l.useEffect(()=>{const b=d.current;return()=>window.clearTimeout(b)},[]),e.jsx(Pt,{scope:t,isOpenDelayedRef:c,delayDuration:a,onOpen:l.useCallback(()=>{window.clearTimeout(d.current),c.current=!1},[]),onClose:l.useCallback(()=>{window.clearTimeout(d.current),d.current=window.setTimeout(()=>c.current=!0,r)},[r]),isPointerInTransitRef:v,onPointerInTransitChange:l.useCallback(b=>{v.current=b},[]),disableHoverableContent:o,children:i})};ca.displayName=ia;var ne="Tooltip",[Ot,he]=pe(ne),la=s=>{const{__scopeTooltip:t,children:a,open:r,defaultOpen:o,onOpenChange:i,disableHoverableContent:c,delayDuration:v}=s,d=_e(ne,s.__scopeTooltip),b=ge(t),[p,g]=l.useState(null),m=_a(),f=l.useRef(0),S=c??d.disableHoverableContent,T=v??d.delayDuration,j=l.useRef(!1),[_,E]=La({prop:r,defaultProp:o??!1,onChange:K=>{K?(d.onOpen(),document.dispatchEvent(new CustomEvent(Re))):d.onClose(),i==null||i(K)},caller:ne}),C=l.useMemo(()=>_?j.current?"delayed-open":"instant-open":"closed",[_]),L=l.useCallback(()=>{window.clearTimeout(f.current),f.current=0,j.current=!1,E(!0)},[E]),O=l.useCallback(()=>{window.clearTimeout(f.current),f.current=0,E(!1)},[E]),G=l.useCallback(()=>{window.clearTimeout(f.current),f.current=window.setTimeout(()=>{j.current=!0,E(!0),f.current=0},T)},[T,E]);return l.useEffect(()=>()=>{f.current&&(window.clearTimeout(f.current),f.current=0)},[]),e.jsx(qa,{...b,children:e.jsx(Ot,{scope:t,contentId:m,open:_,stateAttribute:C,trigger:p,onTriggerChange:g,onTriggerEnter:l.useCallback(()=>{d.isOpenDelayedRef.current?G():L()},[d.isOpenDelayedRef,G,L]),onTriggerLeave:l.useCallback(()=>{S?O():(window.clearTimeout(f.current),f.current=0)},[O,S]),onOpen:L,onClose:O,disableHoverableContent:S,children:a})})};la.displayName=ne;var De="TooltipTrigger",da=l.forwardRef((s,t)=>{const{__scopeTooltip:a,...r}=s,o=he(De,a),i=_e(De,a),c=ge(a),v=l.useRef(null),d=sa(t,v,o.onTriggerChange),b=l.useRef(!1),p=l.useRef(!1),g=l.useCallback(()=>b.current=!1,[]);return l.useEffect(()=>()=>document.removeEventListener("pointerup",g),[g]),e.jsx(za,{asChild:!0,...c,children:e.jsx(Ga.button,{"aria-describedby":o.open?o.contentId:void 0,"data-state":o.stateAttribute,...r,ref:d,onPointerMove:J(s.onPointerMove,m=>{m.pointerType!=="touch"&&!p.current&&!i.isPointerInTransitRef.current&&(o.onTriggerEnter(),p.current=!0)}),onPointerLeave:J(s.onPointerLeave,()=>{o.onTriggerLeave(),p.current=!1}),onPointerDown:J(s.onPointerDown,()=>{o.open&&o.onClose(),b.current=!0,document.addEventListener("pointerup",g,{once:!0})}),onFocus:J(s.onFocus,()=>{b.current||o.onOpen()}),onBlur:J(s.onBlur,o.onClose),onClick:J(s.onClick,o.onClose)})})});da.displayName=De;var kt="TooltipPortal",[Bs,Mt]=pe(kt,{forceMount:void 0}),ee="TooltipContent",ua=l.forwardRef((s,t)=>{const a=Mt(ee,s.__scopeTooltip),{forceMount:r=a.forceMount,side:o="top",...i}=s,c=he(ee,s.__scopeTooltip);return e.jsx($a,{present:r||c.open,children:c.disableHoverableContent?e.jsx(ma,{side:o,...i,ref:t}):e.jsx(_t,{side:o,...i,ref:t})})}),_t=l.forwardRef((s,t)=>{const a=he(ee,s.__scopeTooltip),r=_e(ee,s.__scopeTooltip),o=l.useRef(null),i=sa(t,o),[c,v]=l.useState(null),{trigger:d,onClose:b}=a,p=o.current,{onPointerInTransitChange:g}=r,m=l.useCallback(()=>{v(null),g(!1)},[g]),f=l.useCallback((S,T)=>{const j=S.currentTarget,_={x:S.clientX,y:S.clientY},E=$t(_,j.getBoundingClientRect()),C=Ft(_,E),L=Ut(T.getBoundingClientRect()),O=Bt([...C,...L]);v(O),g(!0)},[g]);return l.useEffect(()=>()=>m(),[m]),l.useEffect(()=>{if(d&&p){const S=j=>f(j,p),T=j=>f(j,d);return d.addEventListener("pointerleave",S),p.addEventListener("pointerleave",T),()=>{d.removeEventListener("pointerleave",S),p.removeEventListener("pointerleave",T)}}},[d,p,f,m]),l.useEffect(()=>{if(c){const S=T=>{const j=T.target,_={x:T.clientX,y:T.clientY},E=(d==null?void 0:d.contains(j))||(p==null?void 0:p.contains(j)),C=!Vt(_,c);E?m():C&&(m(),b())};return document.addEventListener("pointermove",S),()=>document.removeEventListener("pointermove",S)}},[d,p,c,b,m]),e.jsx(ma,{...s,ref:i})}),[Lt,qt]=pe(ne,{isInside:!1}),zt=Va("TooltipContent"),ma=l.forwardRef((s,t)=>{const{__scopeTooltip:a,children:r,"aria-label":o,onEscapeKeyDown:i,onPointerDownOutside:c,...v}=s,d=he(ee,a),b=ge(a),{onClose:p}=d;return l.useEffect(()=>(document.addEventListener(Re,p),()=>document.removeEventListener(Re,p)),[p]),l.useEffect(()=>{if(d.trigger){const g=m=>{const f=m.target;f!=null&&f.contains(d.trigger)&&p()};return window.addEventListener("scroll",g,{capture:!0}),()=>window.removeEventListener("scroll",g,{capture:!0})}},[d.trigger,p]),e.jsx(Fa,{asChild:!0,disableOutsidePointerEvents:!1,onEscapeKeyDown:i,onPointerDownOutside:c,onFocusOutside:g=>g.preventDefault(),onDismiss:p,children:e.jsxs(Ua,{"data-state":d.stateAttribute,...b,...v,ref:t,style:{...v.style,"--radix-tooltip-content-transform-origin":"var(--radix-popper-transform-origin)","--radix-tooltip-content-available-width":"var(--radix-popper-available-width)","--radix-tooltip-content-available-height":"var(--radix-popper-available-height)","--radix-tooltip-trigger-width":"var(--radix-popper-anchor-width)","--radix-tooltip-trigger-height":"var(--radix-popper-anchor-height)"},children:[e.jsx(zt,{children:r}),e.jsx(Lt,{scope:a,isInside:!0,children:e.jsx(Ba,{id:d.contentId,role:"tooltip",children:o||r})})]})})});ua.displayName=ee;var pa="TooltipArrow",Gt=l.forwardRef((s,t)=>{const{__scopeTooltip:a,...r}=s,o=ge(a);return qt(pa,a).isInside?null:e.jsx(Ha,{...o,...r,ref:t})});Gt.displayName=pa;function $t(s,t){const a=Math.abs(t.top-s.y),r=Math.abs(t.bottom-s.y),o=Math.abs(t.right-s.x),i=Math.abs(t.left-s.x);switch(Math.min(a,r,o,i)){case i:return"left";case o:return"right";case a:return"top";case r:return"bottom";default:throw new Error("unreachable")}}function Ft(s,t,a=5){const r=[];switch(t){case"top":r.push({x:s.x-a,y:s.y+a},{x:s.x+a,y:s.y+a});break;case"bottom":r.push({x:s.x-a,y:s.y-a},{x:s.x+a,y:s.y-a});break;case"left":r.push({x:s.x+a,y:s.y-a},{x:s.x+a,y:s.y+a});break;case"right":r.push({x:s.x-a,y:s.y-a},{x:s.x-a,y:s.y+a});break}return r}function Ut(s){const{top:t,right:a,bottom:r,left:o}=s;return[{x:o,y:t},{x:a,y:t},{x:a,y:r},{x:o,y:r}]}function Vt(s,t){const{x:a,y:r}=s;let o=!1;for(let i=0,c=t.length-1;i<t.length;c=i++){const v=t[i],d=t[c],b=v.x,p=v.y,g=d.x,m=d.y;p>r!=m>r&&a<(g-b)*(r-p)/(m-p)+b&&(o=!o)}return o}function Bt(s){const t=s.slice();return t.sort((a,r)=>a.x<r.x?-1:a.x>r.x?1:a.y<r.y?-1:a.y>r.y?1:0),Ht(t)}function Ht(s){if(s.length<=1)return s.slice();const t=[];for(let r=0;r<s.length;r++){const o=s[r];for(;t.length>=2;){const i=t[t.length-1],c=t[t.length-2];if((i.x-c.x)*(o.y-c.y)>=(i.y-c.y)*(o.x-c.x))t.pop();else break}t.push(o)}t.pop();const a=[];for(let r=s.length-1;r>=0;r--){const o=s[r];for(;a.length>=2;){const i=a[a.length-1],c=a[a.length-2];if((i.x-c.x)*(o.y-c.y)>=(i.y-c.y)*(o.x-c.x))a.pop();else break}a.push(o)}return a.pop(),t.length===1&&a.length===1&&t[0].x===a[0].x&&t[0].y===a[0].y?t:t.concat(a)}var Wt=ca,Qt=la,Kt=da,ga=ua;const Ze=Wt,Je=Qt,ea=Kt,Pe=l.forwardRef(({className:s,sideOffset:t=4,...a},r)=>e.jsx(ga,{ref:r,sideOffset:t,className:me("z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",s),...a}));Pe.displayName=ga.displayName;const Xt=`
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
`;function Yt(s){const t=/```campaign-create\s*\n([\s\S]*?)```/,a=s.match(t);if(!a)return null;try{const r=JSON.parse(a[1].trim());return!r.name||!r.platform||!r.budgetTotal||!r.startDate?(console.error("Campaign data missing required fields"),null):["Google Ads","Meta","LinkedIn"].includes(r.platform)?{action:"create_campaign",data:{name:r.name,platform:r.platform,budgetTotal:Number(r.budgetTotal),startDate:r.startDate,endDate:r.endDate||void 0,objective:r.objective||"Conversões"}}:(console.error("Invalid platform:",r.platform),null)}catch(r){return console.error("Failed to parse campaign data:",r),null}}function Zt(s){return s.replace(/```campaign-create\s*\n[\s\S]*?```/g,"").trim()}const Jt=`
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
`,aa=["Show, chegou no lugar certo. Eu automatizo o que os outros demoram três reuniões pra entender. O que a gente vai otimizar hoje?","Relaxa, aqui não tem blá-blá-blá. Só plano, execução e conversão. Passa o produto e o público.","Beleza. Eu sou o motor que transforma tentativa em lucro. Quer começar pequeno ou já quer escalar até o servidor pedir arrego?","Ótimo. Se você quiser aula, vai pro YouTube. Se quiser dinheiro rodando, me dá os dados e deixa eu fazer o estrago.","Ah, ótimo… mais um querendo vender antes de entender o jogo. Respira. Me diz o produto — eu transformo tua ideia num motivo pra alguém gastar dinheiro agora.","Bem-vindo ao lado escuro do funil. Aqui a gente não inspira ninguém — a gente convence. Cê tá pronto pra sujar um pouco as mãos ou prefere PowerPoint?","Se você quer motivação, compra um livro. Se quer resultado, me dá acesso ao checkout e segura o ROI.","Eu sou o algoritmo de ressaca: sarcástico, funcional e viciado em lucro. Fala o que você vende antes que eu comece a julgar teu nicho.","Parabéns, você acabou de invocar o espírito da conversão. Sem papo de mindset, sem desculpa. Quer que eu destrinche teu tráfego ou tua vergonha de anunciar?"];function es(){return aa[Math.floor(Math.random()*aa.length)]}const as=({isSearching:s,searchResults:t=[],searchQuery:a})=>!s&&t.length===0?null:e.jsxs("div",{className:"mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg",children:[e.jsxs("div",{className:"flex items-center gap-2 mb-2",children:[e.jsx(ra,{className:"h-4 w-4 text-blue-600"}),e.jsx("span",{className:"text-sm font-medium text-blue-800",children:s?"Pesquisando na web...":"Resultados da pesquisa:"})]}),a&&e.jsxs("p",{className:"text-xs text-blue-600 mb-2",children:[e.jsx("strong",{children:"Consulta:"}),' "',a,'"']}),s?e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("div",{className:"flex gap-1",children:[1,2,3].map(r=>e.jsx("div",{className:"w-2 h-2 bg-blue-400 rounded-full animate-pulse",style:{animationDelay:`${r*.2}s`}},r))}),e.jsx("span",{className:"text-xs text-blue-600",children:"Buscando informações..."})]}):e.jsx("div",{className:"space-y-2",children:t.slice(0,3).map((r,o)=>e.jsxs("div",{className:"flex items-start gap-2 p-2 bg-white rounded border",children:[e.jsx("div",{className:"flex-shrink-0 mt-0.5",children:r.favicon?e.jsx("img",{src:r.favicon,alt:"",className:"w-4 h-4",onError:i=>{i.currentTarget.style.display="none"}}):e.jsx(oa,{className:"w-4 h-4 text-gray-400"})}),e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsx("h4",{className:"text-xs font-medium text-gray-900 truncate",children:r.title}),e.jsx("p",{className:"text-xs text-gray-600 line-clamp-2",children:r.snippet}),e.jsxs("a",{href:r.url,target:"_blank",rel:"noopener noreferrer",className:"text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1",children:[e.jsx(oe,{className:"w-3 h-3"}),"Ver fonte"]})]})]},o))})]}),ts=({sources:s,isSearching:t})=>t?e.jsxs("div",{className:"mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg",children:[e.jsxs("div",{className:"flex items-center gap-2 mb-2",children:[e.jsx(ra,{className:"h-4 w-4 text-blue-600"}),e.jsx("span",{className:"text-sm font-medium text-blue-800",children:"Pesquisando em múltiplas fontes..."})]}),e.jsx("div",{className:"flex gap-2 flex-wrap",children:s.map((a,r)=>e.jsxs("div",{className:"flex items-center gap-1 px-2 py-1 bg-white rounded border text-xs text-gray-600",children:[e.jsx(oa,{className:"w-3 h-3"}),a]},r))})]}):null,ss=({platform:s,platformName:t,icon:a,onSkip:r,onSuccess:o})=>{const[i,c]=l.useState(!1),[v,d]=l.useState("idle"),b=async()=>{c(!0),d("connecting");try{const{data:{session:g}}=await R.auth.getSession();if(!g)throw new Error("Você precisa estar logado");const m=await fetch("https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/oauth-init",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${g.access_token}`},body:JSON.stringify({platform:s.toUpperCase(),redirectUrl:`${window.location.origin}/oauth/callback`})});if(!m.ok)throw new Error("Falha ao iniciar conexão");const{authUrl:f}=await m.json(),S=600,T=700,j=window.screen.width/2-S/2,_=window.screen.height/2-T/2,E=window.open(f,"oauth-popup",`width=${S},height=${T},left=${j},top=${_}`),C=L=>{var O,G;((O=L.data)==null?void 0:O.type)==="oauth-success"?(d("success"),c(!1),E==null||E.close(),o==null||o(),window.removeEventListener("message",C)):((G=L.data)==null?void 0:G.type)==="oauth-error"&&(d("error"),c(!1),E==null||E.close(),window.removeEventListener("message",C))};window.addEventListener("message",C),setTimeout(()=>{i&&(d("error"),c(!1),E==null||E.close())},5*60*1e3)}catch(g){console.error("Erro ao conectar:",g),d("error"),c(!1)}},p=()=>a||{facebook:"📘",meta:"📘",google:"🔍",linkedin:"💼",tiktok:"🎵",twitter:"🐦",canva:"🎨",instagram:"📸"}[s.toLowerCase()]||"🔗";return e.jsxs("div",{className:"my-4 animate-in fade-in slide-in-from-bottom-2 duration-300",children:[e.jsx("div",{className:"mb-3",children:e.jsxs("p",{className:"text-sm text-gray-700",children:["Vou conectar sua conta do ",e.jsx("strong",{children:t})," ao SyncAds."]})}),i&&e.jsxs("div",{className:"flex items-center gap-2 mb-3 text-sm text-blue-600",children:[e.jsx("span",{className:"text-2xl",children:p()}),e.jsxs("span",{children:["Connecting ",t,"..."]}),e.jsx(re,{className:"h-4 w-4 animate-spin"})]}),e.jsx(W,{className:"border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow",children:e.jsxs(Q,{className:"p-5",children:[e.jsx("div",{className:"mb-4",children:e.jsxs("p",{className:"text-sm text-gray-600 leading-relaxed",children:["I'll need to connect your ",e.jsx("strong",{className:"text-gray-900",children:t})," account to continue."]})}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(P,{onClick:()=>r==null?void 0:r(),variant:"ghost",disabled:i,className:"text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all",children:"Skip"}),e.jsx(P,{onClick:b,disabled:i,className:"flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-60 disabled:transform-none",children:i?e.jsxs(e.Fragment,{children:[e.jsx(re,{className:"mr-2 h-4 w-4 animate-spin"}),"Connecting..."]}):e.jsxs(e.Fragment,{children:[e.jsx("span",{className:"mr-2 text-xl",children:p()}),"Connect ",t,e.jsx(oe,{className:"ml-2 h-4 w-4"})]})})]}),e.jsx("div",{className:"mt-4 pt-4 border-t border-gray-100",children:e.jsxs("a",{href:"/privacy",target:"_blank",className:"text-xs text-gray-400 hover:text-blue-600 flex items-center gap-1 transition-colors",children:[e.jsx("svg",{className:"h-3 w-3",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"})}),"How we handle your data",e.jsx(oe,{className:"h-3 w-3"})]})}),v==="success"&&e.jsx("div",{className:"mt-3 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700",children:"✅ Conectado com sucesso!"}),v==="error"&&e.jsx("div",{className:"mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700",children:"❌ Erro ao conectar. Tente novamente."})]})})]})},rs=({downloadUrl:s,fileName:t,expiresAt:a,fileCount:r,campaignName:o,platform:i,period:c})=>{const v=()=>{const b=document.createElement("a");b.href=s,b.download=t,document.body.appendChild(b),b.click(),document.body.removeChild(b)},d=b=>{const p=new Date(b),g=new Date,m=p.getTime()-g.getTime(),f=Math.floor(m/(1e3*60*60)),S=Math.floor(m%(1e3*60*60)/(1e3*60));return f>0?`${f}h ${S}min`:`${S}min`};return e.jsx(W,{className:"w-full max-w-md bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200",children:e.jsx(Q,{className:"p-4",children:e.jsxs("div",{className:"flex items-start gap-3",children:[e.jsx("div",{className:"flex-shrink-0",children:e.jsx(na,{className:"h-8 w-8 text-blue-600"})}),e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsxs("div",{className:"flex items-center gap-2 mb-2",children:[e.jsx("h4",{className:"font-medium text-gray-900 truncate",children:t}),e.jsxs(se,{variant:"secondary",className:"text-xs",children:[r," arquivo",r!==1?"s":""]})]}),e.jsxs("div",{className:"space-y-1 mb-3",children:[o&&e.jsxs("p",{className:"text-sm text-gray-600",children:[e.jsx("span",{className:"font-medium",children:"Campanha:"})," ",o]}),i&&e.jsxs("p",{className:"text-sm text-gray-600",children:[e.jsx("span",{className:"font-medium",children:"Plataforma:"})," ",i]}),c&&e.jsxs("p",{className:"text-sm text-gray-600",children:[e.jsx("span",{className:"font-medium",children:"Período:"})," ",c]})]}),e.jsxs("div",{className:"flex items-center gap-1 text-xs text-orange-600 mb-3",children:[e.jsx(tt,{className:"h-3 w-3"}),e.jsxs("span",{children:["Expira em ",d(a)]})]}),e.jsxs("div",{className:"flex gap-2",children:[e.jsxs(P,{onClick:v,size:"sm",className:"flex-1",children:[e.jsx(je,{className:"h-4 w-4 mr-2"}),"Baixar"]}),e.jsx(P,{variant:"outline",size:"sm",onClick:()=>window.open(s,"_blank"),children:e.jsx(oe,{className:"h-4 w-4"})})]})]})]})})})},os=({downloads:s})=>s.length===0?null:e.jsxs("div",{className:"space-y-3",children:[e.jsxs("h3",{className:"text-sm font-medium text-gray-700 flex items-center gap-2",children:[e.jsx(na,{className:"h-4 w-4"}),"Downloads Disponíveis (",s.length,")"]}),e.jsx("div",{className:"space-y-2",children:s.map((t,a)=>e.jsx(rs,{...t},a))})]});function ns({steps:s,showCode:t=!0}){if(!s||s.length===0)return null;const a=i=>{switch(i){case"completed":return e.jsx(nt,{className:"h-4 w-4 text-green-500"});case"running":return e.jsx(re,{className:"h-4 w-4 text-blue-500 animate-spin"});case"failed":return e.jsx(ke,{className:"h-4 w-4 text-red-500"});default:return e.jsx(Te,{className:"h-4 w-4 text-gray-500"})}},r=i=>{switch(i){case"completed":return"bg-green-100 text-green-800 border-green-200";case"running":return"bg-blue-100 text-blue-800 border-blue-200";case"failed":return"bg-red-100 text-red-800 border-red-200";default:return"bg-gray-100 text-gray-800 border-gray-200"}},o=i=>{const c=s[i],v=s[i+1];return c.status==="completed"&&(!v||v.status==="running"||v.status==="failed")};return e.jsxs("div",{className:"mb-4 space-y-2",children:[s.map((i,c)=>e.jsx(W,{className:me("border transition-all",o(c)&&"ring-2 ring-blue-500 ring-opacity-50"),children:e.jsx(Q,{className:"p-3",children:e.jsxs("div",{className:"flex items-start gap-3",children:[e.jsx("div",{className:"flex-shrink-0 mt-0.5",children:a(i.status)}),e.jsxs("div",{className:"flex-1 min-w-0 space-y-2",children:[e.jsx("div",{className:"flex items-start justify-between gap-2",children:e.jsxs("div",{className:"flex-1",children:[e.jsxs("div",{className:"flex items-center gap-2 mb-1",children:[e.jsx("h4",{className:"text-sm font-semibold text-gray-900",children:i.step}),e.jsxs(se,{variant:"outline",className:me("text-xs",r(i.status)),children:[i.status==="completed"&&"✓ Concluído",i.status==="running"&&"⏳ Em execução",i.status==="failed"&&"✗ Falhou"]}),i.current_step&&e.jsx(se,{variant:"secondary",className:"text-xs",children:i.current_step})]}),i.details&&e.jsx("p",{className:"text-xs text-gray-600 mt-1",children:i.details})]})}),t&&i.code_to_execute&&e.jsxs("div",{className:"mt-2 p-2 bg-gray-50 rounded border border-gray-200",children:[e.jsxs("div",{className:"flex items-center gap-2 mb-1",children:[e.jsx(rt,{className:"h-3 w-3 text-gray-500"}),e.jsx("span",{className:"text-xs font-medium text-gray-600",children:"Código:"})]}),e.jsx("code",{className:"text-xs text-gray-700 break-all",children:i.code_to_execute.length>100?`${i.code_to_execute.substring(0,100)}...`:i.code_to_execute})]}),i.strategy&&e.jsx("div",{className:"mt-2",children:e.jsxs(se,{variant:"outline",className:"text-xs",children:["Estratégia: ",i.strategy]})}),i.error&&i.status==="failed"&&e.jsxs("div",{className:"mt-2 p-2 bg-red-50 rounded border border-red-200",children:[e.jsx("p",{className:"text-xs text-red-700 font-medium",children:"Erro:"}),e.jsx("p",{className:"text-xs text-red-600 mt-1",children:i.error})]})]})]})})},c)),e.jsxs("div",{className:"flex items-center gap-2 px-2",children:[e.jsx("div",{className:"flex-1 h-1 bg-gray-200 rounded-full overflow-hidden",children:e.jsx("div",{className:"h-full bg-blue-500 transition-all duration-300",style:{width:`${s.filter(i=>i.status==="completed").length/s.length*100}%`}})}),e.jsxs("span",{className:"text-xs text-gray-500",children:[s.filter(i=>i.status==="completed").length,"/",s.length," concluídos"]})]})]})}const is=({result:s,onDownload:t,onRetry:a,onDownloadTemplate:r})=>{var b,p;const[o,i]=l.useState(0),[c,v]=l.useState(!0);l.useEffect(()=>{if(s.steps&&s.steps.length>0){const g=setInterval(()=>{i(m=>m<s.steps.length-1?m+1:(v(!1),clearInterval(g),m))},1e3);return()=>clearInterval(g)}},[s.steps]);const d=s.steps?Math.round(o/s.steps.length*100):100;return e.jsxs(W,{className:"w-full max-w-2xl mx-auto",children:[e.jsxs(Wa,{children:[e.jsxs(Qa,{className:"flex items-center gap-2",children:[s.success?e.jsx(Ka,{className:"h-5 w-5 text-green-600"}):e.jsx(ke,{className:"h-5 w-5 text-red-600"}),e.jsx("span",{className:s.success?"text-green-600":"text-red-600",children:s.success?"Execução Concluída":"Execução Falhou"})]}),e.jsx("p",{className:"text-sm text-gray-600",children:s.message})]}),e.jsxs(Q,{className:"space-y-4",children:[e.jsxs("div",{className:"space-y-2",children:[e.jsxs("div",{className:"flex justify-between text-sm",children:[e.jsx("span",{children:"Progresso"}),e.jsxs("span",{children:[d,"%"]})]}),e.jsx(st,{value:d,className:"h-2"})]}),s.steps&&s.steps.length>0&&e.jsxs("div",{className:"space-y-3",children:[e.jsx("h4",{className:"text-sm font-medium text-gray-700",children:"Etapas de Execução:"}),e.jsx(ns,{steps:s.steps,showCode:!0})]}),s.nextActions&&s.nextActions.length>0&&e.jsxs("div",{className:"space-y-2",children:[e.jsx("h4",{className:"text-sm font-medium text-gray-700",children:"Sugestões:"}),e.jsx("ul",{className:"space-y-1",children:s.nextActions.map((g,m)=>e.jsxs("li",{className:"flex items-center gap-2 text-xs text-gray-600",children:[e.jsx("div",{className:"h-1 w-1 bg-gray-400 rounded-full"}),g]},m))})]}),s.data&&e.jsxs("div",{className:"space-y-2",children:[e.jsx("h4",{className:"text-sm font-medium text-gray-700",children:"Resultado:"}),e.jsx("div",{className:"bg-gray-50 p-3 rounded-lg",children:e.jsx("pre",{className:"text-xs text-gray-600 whitespace-pre-wrap",children:JSON.stringify(s.data,null,2)})})]}),s.diagnosis&&e.jsx("div",{className:"mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200",children:e.jsxs("div",{className:"flex items-start gap-3",children:[e.jsx(Te,{className:"h-5 w-5 text-yellow-600 flex-shrink-0"}),e.jsxs("div",{className:"flex-1 space-y-2",children:[e.jsx("h4",{className:"text-sm font-semibold text-yellow-900",children:"Diagnóstico:"}),e.jsx("p",{className:"text-sm text-yellow-800",children:s.diagnosis.explanation}),s.diagnosis.solutions&&s.diagnosis.solutions.length>0&&e.jsxs("div",{className:"mt-2",children:[e.jsx("p",{className:"text-xs font-medium text-yellow-900 mb-1",children:"Soluções sugeridas:"}),e.jsx("ul",{className:"space-y-1",children:s.diagnosis.solutions.map((g,m)=>e.jsxs("li",{className:"text-xs text-yellow-700 flex items-start gap-2",children:[e.jsx("span",{children:"•"}),e.jsx("span",{children:g})]},m))})]})]})]})}),s.templateCSV&&r&&e.jsxs("div",{className:"mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200",children:[e.jsx("div",{className:"flex items-center justify-between mb-2",children:e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(Te,{className:"h-5 w-5 text-blue-600"}),e.jsx("h4",{className:"text-sm font-semibold text-blue-900",children:"Template CSV Gerado"})]})}),e.jsx("p",{className:"text-xs text-blue-700 mb-3",children:"Como o site não pôde ser acessado, geramos um template CSV com dados de exemplo que você pode usar."}),e.jsxs(P,{variant:"outline",size:"sm",onClick:()=>{const g=new Blob([s.templateCSV],{type:"text/csv"}),m=URL.createObjectURL(g),f=document.createElement("a");f.href=m,f.download=`produtos-template-${Date.now()}.csv`,document.body.appendChild(f),f.click(),document.body.removeChild(f),URL.revokeObjectURL(m)},className:"w-full",children:[e.jsx(je,{className:"h-4 w-4 mr-2"}),"Baixar Template CSV"]})]}),e.jsxs("div",{className:"flex gap-2 pt-4",children:[((b=s.data)==null?void 0:b.downloadUrl)&&t&&e.jsxs(P,{onClick:()=>t(s.data.downloadUrl,s.data.fileName),className:"flex-1",children:[e.jsx(je,{className:"h-4 w-4 mr-2"}),"Baixar Arquivo"]}),((p=s.data)==null?void 0:p.url)&&e.jsxs(P,{variant:"outline",onClick:()=>window.open(s.data.url,"_blank"),children:[e.jsx(oe,{className:"h-4 w-4 mr-2"}),"Ver Site"]}),!s.success&&a&&e.jsx(P,{variant:"outline",onClick:a,children:"Tentar Novamente"})]})]})]})},cs=({toolName:s,parameters:t,userId:a,conversationId:r,onComplete:o})=>{const[i,c]=l.useState(null),[v,d]=l.useState(!1),[b,p]=l.useState(null),g=async()=>{d(!0),p(null),c(null);try{const{data:m,error:f}=await supabase.functions.invoke("super-ai-tools",{body:{toolName:s,parameters:t,userId:a,conversationId:r}});if(f)throw new Error(f.message);const S=m;c(S),o&&o(S)}catch(m){p(m instanceof Error?m.message:"Erro desconhecido")}finally{d(!1)}};return l.useEffect(()=>{g()},[]),v?e.jsx(W,{className:"w-full max-w-2xl mx-auto",children:e.jsx(Q,{className:"p-6",children:e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx(re,{className:"h-5 w-5 animate-spin text-blue-600"}),e.jsxs("div",{children:[e.jsxs("h3",{className:"font-medium",children:["Executando ",s]}),e.jsx("p",{className:"text-sm text-gray-600",children:"Processando solicitação..."})]})]})})}):b?e.jsx(W,{className:"w-full max-w-2xl mx-auto",children:e.jsxs(Q,{className:"p-6",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx(ke,{className:"h-5 w-5 text-red-600"}),e.jsxs("div",{children:[e.jsx("h3",{className:"font-medium text-red-600",children:"Erro na Execução"}),e.jsx("p",{className:"text-sm text-gray-600",children:b})]})]}),e.jsx(P,{onClick:g,className:"mt-4",children:"Tentar Novamente"})]})}):i?e.jsx(is,{result:i,onDownload:(m,f)=>{const S=document.createElement("a");S.href=m,S.download=f,document.body.appendChild(S),S.click(),document.body.removeChild(S)},onRetry:g}):null},ls=`
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
`;class ds{constructor(t){ye(this,"userId");this.userId=t}async executeSQL(t){try{if(/DROP|TRUNCATE|DELETE\s+FROM\s+"User"|DELETE\s+FROM\s+"Campaign"/i.test(t))return{success:!1,error:"Query perigosa detectada. Confirmação necessária.",message:"⚠️ Esta query pode ser destrutiva. Por favor, confirme explicitamente."};const{data:r,error:o}=await R.rpc("execute_admin_query",{query_text:t});return o?{success:!1,error:o.message,message:`❌ Erro ao executar SQL: ${o.message}`}:{success:!0,data:r,message:`✅ Query executada com sucesso. ${Array.isArray(r)?r.length:0} registros retornados.`}}catch(a){return{success:!1,error:a.message,message:`❌ Erro: ${a.message}`}}}async analyzeSystem(t,a){try{let r="",o="";switch(t){case"metrics":r=`
            SELECT 
              (SELECT COUNT(*) FROM "User") as total_users,
              (SELECT COUNT(*) FROM "Campaign") as total_campaigns,
              (SELECT COUNT(*) FROM "ChatMessage") as total_messages,
              (SELECT COUNT(*) FROM "AiConnection") as total_connections
          `,o="📊 Métricas gerais do sistema";break;case"performance":r=`
            SELECT 
              AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_response_time,
              COUNT(*) as total_requests
            FROM "ChatMessage"
            WHERE created_at >= NOW() - INTERVAL '${a==="24h"?"1 day":a==="7d"?"7 days":"30 days"}'
          `,o="⚡ Análise de performance";break;case"usage":r=`
            SELECT 
              DATE(created_at) as date,
              COUNT(*) as messages_count
            FROM "ChatMessage"
            WHERE created_at >= NOW() - INTERVAL '${a==="24h"?"1 day":a==="7d"?"7 days":"30 days"}'
            GROUP BY DATE(created_at)
            ORDER BY date DESC
          `,o="📈 Análise de uso";break;case"errors":return{success:!0,data:{errors:0},message:"✅ Sistema de logging de erros a ser implementado"}}const{data:i,error:c}=await R.rpc("execute_admin_query",{query_text:r});if(c)throw c;return{success:!0,data:i,message:`${o} - Período: ${a}`}}catch(r){return{success:!1,error:r.message,message:`❌ Erro ao analisar sistema: ${r.message}`}}}async manageIntegration(t,a,r){try{switch(t){case"test":return{success:!0,message:`🔍 Testando integração com ${a}... (A implementar com APIs reais)`,data:{status:"pending"}};case"connect":const{data:o,error:i}=await R.from("Integration").insert({userId:this.userId,platform:a.toUpperCase(),credentials:r||{},isConnected:!1,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}).select().single();if(i)throw i;return{success:!0,data:o,message:`✅ Integração com ${a} iniciada. Configure as credenciais.`};case"disconnect":return await R.from("Integration").update({isConnected:!1}).eq("platform",a.toUpperCase()).eq("userId",this.userId),{success:!0,message:`✅ Integração com ${a} desconectada.`};default:return{success:!1,error:"Ação desconhecida",message:"❌ Ação não reconhecida"}}}catch(o){return{success:!1,error:o.message,message:`❌ Erro ao gerenciar integração: ${o.message}`}}}async getMetrics(t,a,r){try{let o="",i="*";switch(t){case"users":o="User";break;case"campaigns":o="Campaign";break;case"messages":o="ChatMessage";break;default:return{success:!1,error:"Métrica desconhecida",message:"❌ Métrica não reconhecida"}}const c=`
        SELECT 
          DATE_TRUNC('${r}', created_at) as period,
          ${a==="count"?"COUNT(*)":a==="sum"?"SUM(1)":"AVG(1)"} as value
        FROM "${o}"
        GROUP BY period
        ORDER BY period DESC
        LIMIT 30
      `,{data:v,error:d}=await R.rpc("execute_admin_query",{query_text:c});if(d)throw d;return{success:!0,data:v,message:`📊 Métricas de ${t} agrupadas por ${r}`}}catch(o){return{success:!1,error:o.message,message:`❌ Erro ao obter métricas: ${o.message}`}}}}function us(s){const t=/```admin-sql\s*\n([\s\S]*?)```/,a=s.match(t);return a?a[1].trim():null}function ms(s){const t=/```admin-analyze\s*\n([\s\S]*?)```/,a=s.match(t);if(!a)return null;try{return JSON.parse(a[1].trim())}catch{return null}}function ps(s){const t=/```admin-integration\s*\n([\s\S]*?)```/,a=s.match(t);if(!a)return null;try{return JSON.parse(a[1].trim())}catch{return null}}function gs(s){const t=/```admin-metrics\s*\n([\s\S]*?)```/,a=s.match(t);if(!a)return null;try{return JSON.parse(a[1].trim())}catch{return null}}function hs(s){return s.replace(/```admin-sql\s*\n[\s\S]*?```/g,"").replace(/```admin-analyze\s*\n[\s\S]*?```/g,"").replace(/```admin-integration\s*\n[\s\S]*?```/g,"").replace(/```admin-metrics\s*\n[\s\S]*?```/g,"").replace(/```admin-logs\s*\n[\s\S]*?```/g,"").replace(/```admin-test-api\s*\n[\s\S]*?```/g,"").replace(/```admin-debug\s*\n[\s\S]*?```/g,"").trim()}function fs(s){const t=/```integration-connect:(\w+)```/,a=s.match(t);return a?{action:"connect",slug:a[1]}:null}function xs(s){const t=/```integration-disconnect:(\w+)```/,a=s.match(t);return a?{action:"disconnect",slug:a[1]}:null}function vs(s){const t=/```integration-status(?::(\w+))?```/,a=s.match(t);return a?{action:"status",slug:a[1]}:null}function bs(s){return fs(s)||xs(s)||vs(s)}function Ss(s){return s.replace(/```integration-connect:\w+```/g,"").replace(/```integration-disconnect:\w+```/g,"").replace(/```integration-status(?::\w+)?```/g,"").trim()}const Es=`
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
`,As=`
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
`;class ys{constructor(t){ye(this,"userId");this.userId=t}async auditIntegration(t){try{const{data:a,error:r}=await R.from("Integration").select("*").eq("userId",this.userId).eq("platform",t).single();if(r&&r.code!=="PGRST116")throw r;const o=this.getCapabilities(t),i=a&&a.isConnected?"connected":"disconnected",c={platform:t,status:i,lastSync:(a==null?void 0:a.lastSyncAt)||void 0,capabilities:o,issues:this.detectIssues(a,t),recommendations:this.getRecommendations(i,t)};return{success:!0,data:c,message:this.formatAuditMessage(c)}}catch(a){return{success:!1,error:a.message,message:`❌ Erro ao auditar ${t}: ${a.message}`}}}async auditAll(){try{const t=["META_ADS","GOOGLE_ADS","LINKEDIN_ADS","TIKTOK_ADS","TWITTER_ADS"],a=[];for(const r of t){const o=await this.auditIntegration(r);o.success&&o.data&&a.push(o.data)}return{success:!0,data:a,message:this.formatAllAuditsMessage(a)}}catch(t){return{success:!1,error:t.message,message:`❌ Erro ao auditar integrações: ${t.message}`}}}async listStatus(){try{const{data:t,error:a}=await R.from("Integration").select("platform, isConnected, lastSyncAt").eq("userId",this.userId);if(a)throw a;const r=new Map((t==null?void 0:t.map(c=>[c.platform,c]))||[]),i=["META_ADS","GOOGLE_ADS","LINKEDIN_ADS","TIKTOK_ADS","TWITTER_ADS"].map(c=>{var v,d;return{platform:c,status:r.has(c)&&((v=r.get(c))!=null&&v.isConnected)?"✅ Conectada":"❌ Desconectada",lastSync:((d=r.get(c))==null?void 0:d.lastSyncAt)||"Nunca"}});return{success:!0,data:i,message:this.formatStatusList(i)}}catch(t){return{success:!1,error:t.message,message:`❌ Erro ao listar status: ${t.message}`}}}getCapabilities(t){return{META_ADS:["Criar campanhas de Facebook e Instagram","Segmentação avançada de audiência","Análise de performance em tempo real","Otimização automática de orçamento","A/B testing de criativos","Remarketing e lookalike audiences"],GOOGLE_ADS:["Campanhas de Pesquisa (Search)","Anúncios Display e YouTube","Shopping Ads para e-commerce","Campanhas Performance Max","Análise de conversões e ROI","Smart Bidding automático"],LINKEDIN_ADS:["Anúncios B2B segmentados","Targeting por cargo e empresa","Lead Gen Forms nativos","InMail patrocinado","Análise de engajamento profissional","Retargeting de visitantes"],TIKTOK_ADS:["Vídeos In-Feed","TopView e Brand Takeover","Spark Ads (boost orgânico)","Segmentação por interesse e comportamento","Píxel de conversão","Catálogo de produtos"],TWITTER_ADS:["Tweets promovidos","Segmentação por hashtags e interesse","Audiências customizadas","Análise de engajamento","Campanhas de instalação de app","Vídeos e carrosséis"]}[t]||["Capacidades a definir"]}detectIssues(t,a){const r=[];if(!t)return r.push("Integração não configurada"),r;if(t.isConnected||r.push("Integração desconectada - configure credenciais"),(!t.credentials||Object.keys(t.credentials).length===0)&&r.push("Credenciais não configuradas"),t.lastSync){const o=new Date(t.lastSync),i=(Date.now()-o.getTime())/(1e3*60*60);i>24&&r.push(`Última sincronização há ${Math.floor(i)} horas - pode estar desatualizado`)}return r}getRecommendations(t,a){const r=[];return t==="disconnected"&&(r.push(`Conecte ${this.formatPlatformName(a)} em: Configurações → Integrações`),r.push("Configure sua chave de API para começar a usar")),t==="connected"&&(r.push("✅ Integração ativa! Você já pode criar campanhas"),r.push("Explore as capacidades disponíveis desta plataforma")),r}formatPlatformName(t){return{META_ADS:"Meta Ads (Facebook/Instagram)",GOOGLE_ADS:"Google Ads",LINKEDIN_ADS:"LinkedIn Ads",TIKTOK_ADS:"TikTok Ads",TWITTER_ADS:"Twitter Ads (X)"}[t]||t}formatAuditMessage(t){let r=`
**${t.status==="connected"?"✅":"❌"} ${this.formatPlatformName(t.platform)}**
`;return r+=`Status: ${t.status==="connected"?"✅ Conectada":"❌ Desconectada"}
`,t.lastSync&&(r+=`Última sincronização: ${t.lastSync}
`),r+=`
**Capacidades:**
`,t.capabilities.forEach(o=>{r+=`• ${o}
`}),t.issues&&t.issues.length>0&&(r+=`
**⚠️ Problemas detectados:**
`,t.issues.forEach(o=>{r+=`• ${o}
`})),t.recommendations&&t.recommendations.length>0&&(r+=`
**💡 Recomendações:**
`,t.recommendations.forEach(o=>{r+=`• ${o}
`})),r}formatAllAuditsMessage(t){let a=`
# 🔍 AUDITORIA COMPLETA DE INTEGRAÇÕES

`;const r=t.filter(i=>i.status==="connected").length,o=t.length;return a+=`**Resumo:** ${r}/${o} integrações ativas

`,a+=`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`,t.forEach(i=>{a+=this.formatAuditMessage(i),a+=`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`}),r<o?(a+=`
**🎯 Próximos Passos:**
`,a+=`1. Conecte as ${o-r} integrações pendentes
`,a+=`2. Configure suas chaves de API
`,a+=`3. Teste cada integração antes de criar campanhas
`):a+=`
**🎉 Parabéns!** Todas as integrações estão configuradas e funcionando!
`,a}formatStatusList(t){let a=`
**📊 Status das Integrações:**

`;return t.forEach(r=>{a+=`${r.status} **${this.formatPlatformName(r.platform)}**
`,a+=`   └─ Última sync: ${r.lastSync}

`}),a}}function ws(s){const t=/```integration-action\s*\n([\s\S]*?)```/,a=s.match(t);if(!a)return null;try{return JSON.parse(a[1].trim())}catch{return null}}function Ns(s){return s.replace(/```integration-action\s*\n[\s\S]*?```/g,"").trim()}function Cs(s,t){const a=s.toLowerCase(),r=t.toLowerCase(),o=(a.includes("auditor")||a.includes("verificar")||a.includes("status")||a.includes("listar"))&&(a.includes("integra")||a.includes("conex")||a.includes("plataforma")),i=r.includes("vou")&&(r.includes("auditor")||r.includes("verificar"));if(!o||!i)return null;const c={facebook:"META_ADS",instagram:"META_ADS",meta:"META_ADS",google:"GOOGLE_ADS",linkedin:"LINKEDIN_ADS",tiktok:"TIKTOK_ADS",twitter:"TWITTER_ADS"};for(const[v,d]of Object.entries(c))if(a.includes(v))return{action:"audit",platform:d};return{action:"audit_all"}}const js=["Criar campanha de Facebook Ads","Analisar performance da última semana","Sugerir otimizações"],ue=500,Hs=()=>{const[s,t]=l.useState(""),[a,r]=l.useState(!0),[o,i]=l.useState(null),[c,v]=l.useState(!1),[d,b]=l.useState([]),[p,g]=l.useState(""),[m,f]=l.useState([]),[S,T]=l.useState([]),[j,_]=l.useState([]),[E,C]=l.useState(null),[L,O]=l.useState(""),[G,K]=l.useState([]),[fe,Le]=l.useState(!1),[Ts,ha]=l.useState(null),xe=l.useRef(null),ve=l.useRef([]),x=Ve(n=>n.user),qe=Ve(n=>n.isAuthenticated),ze=Xa(),be=$(n=>n.conversations),I=$(n=>n.activeConversationId),Se=$(n=>n.setActiveConversationId),ie=$(n=>n.isAssistantTyping),Ge=$(n=>n.setAssistantTyping),Z=$(n=>n.addMessage);$(n=>n.deleteConversation),$(n=>n.createNewConversation);const fa=Ya(n=>n.addCampaign),xa=Ye(n=>n.aiSystemPrompt),va=Ye(n=>n.aiInitialGreetings),$e=l.useRef(null),Fe=l.useRef(null),{toast:A}=Za(),F=be.find(n=>n.id===I);l.useEffect(()=>{(!qe||!x)&&(console.warn("⚠️ Usuário não autenticado, redirecionando para login..."),ze("/login",{replace:!0}))},[qe,x,ze]);const ba=()=>{var n;(n=$e.current)==null||n.scrollIntoView({behavior:"smooth"})};l.useEffect(ba,[F==null?void 0:F.messages,ie]),l.useEffect(()=>{(async()=>{if(x)try{const{data:u,error:h}=await R.from("GlobalAiConnection").select("id, systemPrompt, initialGreetings").eq("isActive",!0).limit(1).single();if(h){console.error("Erro ao buscar IA:",h);return}const y=u==null?void 0:u.id;if(y){const{data:w,error:q}=await R.from("GlobalAiConnection").select("systemPrompt, initialGreetings").eq("id",y).single();if(q){console.error("Erro ao buscar config da IA:",q);return}w&&i({systemPrompt:w.systemPrompt||xa,initialGreetings:w.initialGreetings||va})}}catch(u){console.error("Erro ao carregar IA Global:",u)}})()},[x==null?void 0:x.id]),l.useEffect(()=>{if(F&&F.messages.length===0){const n=es();setTimeout(()=>{x&&Z(x.id,I,{id:`greeting-${Date.now()}`,role:"assistant",content:n})},500)}},[I,F==null?void 0:F.messages.length]);const Sa=n=>{const u=/ZIP_DOWNLOAD:\s*({[^}]+})/g,h=n.match(u);return h&&h.forEach(y=>{try{const w=y.replace("ZIP_DOWNLOAD:","").trim(),q=JSON.parse(w);T(U=>[...U,q])}catch(w){console.error("Erro ao processar download ZIP:",w)}}),n.replace(u,"").trim()},Ea=n=>{const u=/SUPER_AI_EXECUTION:\s*({[^}]+})/g,h=n.match(u);return h&&h.forEach(y=>{try{const w=y.replace("SUPER_AI_EXECUTION:","").trim(),q=JSON.parse(w);_(U=>[...U,q])}catch(w){console.error("Erro ao processar execução Super AI:",w)}}),n.replace(u,"").trim()},Ee=async()=>{if(s.trim()===""||!I||s.length>ue)return;const n=s,u=n.toLowerCase();if(u.includes("pesquis")||u.includes("busca")||u.includes("google")||u.includes("internet")){C("web_search");let h=n;if(u.includes("pesquis")){const y=n.match(/pesquis[ae]\s+(.+)/i);h=y?y[1]:n}O(`Pesquisando na web sobre: "${h}"`),K(["Google Search","Exa AI","Tavily"])}else if(u.includes("baix")||u.includes("rasp")||u.includes("scrape")){C("web_scraping");const h=n.match(/https?:\/\/[^\s]+/i);O(h?`Raspando dados de: ${h[0]}`:"Raspando dados...")}else u.includes("python")||u.includes("calcule")||u.includes("execute código")?(C("python_exec"),O("Executando código Python para processar dados...")):(C(null),O("Processando sua solicitação..."),K([]));x&&Z(x.id,I,{id:`msg-${Date.now()}`,role:"user",content:n}),t(""),r(!1),Ge(!0);try{const h=be.find(N=>N.id===I),y=(o==null?void 0:o.systemPrompt)||Jt,w=ls+`

`+Xt+`

`+Es+`

`+As+`

`+y,q=((h==null?void 0:h.messages)||[]).slice(-20).map(N=>({role:N.role,content:N.content})),k=(await et(n,I,q,w)).response,V=Yt(k);if(V)try{x&&(await fa(x.id,{name:V.data.name,platform:V.data.platform,status:"Pausada",budgetTotal:V.data.budgetTotal,budgetSpent:0,impressions:0,clicks:0,conversions:0,startDate:V.data.startDate,endDate:V.data.endDate||"",ctr:0,cpc:0}),A({title:"🎉 Campanha Criada!",description:`A campanha "${V.data.name}" foi criada com sucesso.`}))}catch(N){console.error("Error creating campaign from AI:",N),A({title:"Erro ao criar campanha",description:"Não foi possível criar a campanha automaticamente.",variant:"destructive"})}let ae="";if(x){const N=new ds(x.id),B=us(k);if(B){const D=await N.executeSQL(B);A({title:D.success?"✅ SQL Executado":"❌ Erro SQL",description:D.message,variant:D.success?"default":"destructive"})}const te=ms(k);if(te){const D=await N.analyzeSystem(te.type,te.period);A({title:D.success?"📊 Análise Concluída":"❌ Erro",description:D.message,variant:D.success?"default":"destructive"})}const ce=ps(k);if(ce){const D=await N.manageIntegration(ce.action,ce.platform,ce.credentials);A({title:D.success?"🔗 Integração Atualizada":"❌ Erro",description:D.message,variant:D.success?"default":"destructive"})}const le=gs(k);if(le){const D=await N.getMetrics(le.metric,le.aggregation,le.groupBy);A({title:D.success?"📈 Métricas Obtidas":"❌ Erro",description:D.message,variant:D.success?"default":"destructive"})}let Y=ws(k);if(Y||(Y=Cs(n,k)),Y){const D=new ys(x.id);let H;switch(Y.action){case"audit":Y.platform&&(H=await D.auditIntegration(Y.platform));break;case"audit_all":H=await D.auditAll();break;case"list_status":H=await D.listStatus();break;case"test":case"capabilities":case"diagnose":H={success:!0,message:`Ação "${Y.action}" detectada. Implementação em andamento.`};break}H&&(ae=`

`+H.message,A({title:H.success?"✅ Ação Executada":"❌ Erro",description:H.success?"Auditoria concluída com sucesso":H.error||"Erro ao executar ação",variant:H.success?"default":"destructive"}))}}const z=bs(k);if(z&&x)try{if(z.action==="connect"){const{authUrl:N}=await de.generateOAuthUrl(z.slug,x.id),B=Ne[z.slug];x&&Z(x.id,I,{id:`msg-${Date.now()+1}`,role:"assistant",content:`Para conectar ${B.name}, clique no link abaixo:

🔗 [Autorizar ${B.name}](${N})

O link abrirá em uma nova aba para você autorizar o acesso.`}),window.open(N,"_blank"),A({title:"🔗 Link de Autorização",description:`Clique no link para conectar ${B.name}`});return}else if(z.action==="disconnect"){await de.disconnect(x.id,z.slug);const N=Ne[z.slug];A({title:"✅ Desconectado",description:`${N.name} foi desconectado com sucesso.`})}else if(z.action==="status")if(z.slug){const N=await de.getIntegrationStatus(x.id,z.slug),B=Ne[z.slug];A({title:`${B.name}`,description:N!=null&&N.isConnected?"✅ Conectado":"❌ Não conectado"})}else{const N=await de.listIntegrations(x.id),B=N.filter(te=>te.isConnected).length;A({title:"📊 Status das Integrações",description:`${B} de ${N.length} integrações conectadas`})}}catch(N){console.error("Erro ao processar integração:",N),x&&Z(x.id,I,{id:`msg-${Date.now()+2}`,role:"assistant",content:`❌ **Erro ao conectar integração**

${N.message||"Erro ao processar comando de integração"}`}),A({title:"❌ Erro na Integração",description:"Verifique as instruções no chat",variant:"destructive"})}let Ae=Sa(k);Ae=Ea(Ae);let X=Zt(Ae);X=hs(X),X=Ss(X),X=Ns(X),x&&Z(x.id,I,{id:`msg-${Date.now()+1}`,role:"assistant",content:X+ae})}catch(h){console.error("Erro ao chamar IA:",h),A({title:"Erro ao gerar resposta",description:h.message||"Não foi possível obter resposta da IA. Verifique sua chave de API.",variant:"destructive"}),x&&Z(x.id,I,{id:`msg-${Date.now()+1}`,role:"assistant",content:"❌ Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, verifique se sua chave de API está configurada corretamente nas configurações."})}finally{Ge(!1)}},Aa=n=>{t(n)},ya=()=>{var n;(n=Fe.current)==null||n.click()},wa=async()=>{try{const n=await navigator.mediaDevices.getUserMedia({audio:!0}),u=new MediaRecorder(n);xe.current=u,ve.current=[],u.ondataavailable=h=>{h.data.size>0&&ve.current.push(h.data)},u.onstop=async()=>{const h=new Blob(ve.current,{type:"audio/webm"});ha(h),await Ca(h),n.getTracks().forEach(y=>y.stop())},u.start(),Le(!0),A({title:"🎤 Gravando...",description:"Clique novamente para parar e enviar."})}catch(n){console.error("Erro ao iniciar gravação:",n),A({title:"❌ Erro",description:"Não foi possível acessar o microfone.",variant:"destructive"})}},Na=()=>{xe.current&&fe&&(xe.current.stop(),Le(!1))},Ca=async n=>{if(!(!x||!I))try{A({title:"📤 Enviando áudio...",description:"Aguarde..."});const u=new File([n],`audio-${Date.now()}.webm`,{type:"audio/webm"}),h=`${x.id}/audio-${Date.now()}-${Math.random().toString(36).substring(7)}.webm`,{data:y,error:w}=await R.storage.from("chat-attachments").upload(h,u,{cacheControl:"3600",upsert:!1});if(w)throw w;const{data:{publicUrl:q}}=R.storage.from("chat-attachments").getPublicUrl(h),U=`[🎤 Mensagem de áudio](${q})`;t(k=>k?`${k}

${U}`:U),A({title:"✅ Áudio enviado!",description:"O áudio foi adicionado à mensagem."})}catch(u){console.error("Erro ao enviar áudio:",u),A({title:"❌ Erro",description:"Não foi possível enviar o áudio.",variant:"destructive"})}},ja=async n=>{var h;const u=(h=n.target.files)==null?void 0:h[0];if(!(!u||!x||!I))try{A({title:"📤 Upload iniciado",description:`Enviando "${u.name}"...`});const y=u.name.split(".").pop(),w=`${x.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${y}`,{data:q,error:U}=await R.storage.from("chat-attachments").upload(w,u,{cacheControl:"3600",upsert:!1});if(U)throw U;const{data:{publicUrl:k}}=R.storage.from("chat-attachments").getPublicUrl(w),{error:V}=await R.from("ChatAttachment").insert({messageId:"",fileName:u.name,fileType:u.type,fileUrl:k,fileSize:u.size});V&&console.error("Erro ao salvar anexo:",V);const ae=u.type.startsWith("image/")?`![${u.name}](${k})`:`[${u.name}](${k})`,z=s?`${s}

${ae}`:ae;t(""),z.trim()&&I&&Ee(),A({title:"✅ Arquivo enviado!",description:`${u.name} foi enviado com sucesso.`})}catch(y){console.error("Erro ao fazer upload:",y),A({title:"❌ Erro ao enviar arquivo",description:y.message||"Não foi possível enviar o arquivo.",variant:"destructive"})}finally{n.target&&(n.target.value="")}},Ta=async n=>{try{const{data:u,error:h}=await R.from("ChatMessage").select("id, role, content, createdAt").eq("conversationId",n).order("createdAt",{ascending:!0});if(h)throw h;const y=(u||[]).map(w=>({id:w.id,role:w.role,content:w.content,timestamp:new Date(w.createdAt)}));$.getState().setConversationMessages(n,y),Se(n),console.log(`✅ ${y.length} mensagens carregadas da conversa ${n}`)}catch(u){console.error("Erro ao carregar mensagens:",u),A({title:"Erro",description:"Não foi possível carregar mensagens.",variant:"destructive"})}};l.useEffect(()=>{(async()=>{if(!x)return;await $.getState().loadConversations(x.id);const{data:u}=await R.from("ChatConversation").select("id").eq("userId",x.id).limit(1);(!u||u.length===0)&&await Ue()})()},[x]);const Ue=async()=>{try{if(!x)return;const n=crypto.randomUUID(),u=new Date().toISOString(),{error:h}=await R.from("ChatConversation").insert({id:n,userId:x.id,title:"🆕 Nova Conversa",createdAt:u,updatedAt:u});if(h)throw h;Se(n),await $.getState().loadConversations(x.id),A({title:"✅ Nova conversa criada!",description:"Comece um novo chat do zero."})}catch(n){console.error("Erro ao criar nova conversa:",n),A({title:"Erro",description:n.message||"Não foi possível criar nova conversa.",variant:"destructive"})}},Ia=async n=>{try{await R.from("ChatMessage").delete().eq("conversationId",n);const{error:u}=await R.from("ChatConversation").delete().eq("id",n);if(u)throw u;I===n&&Se(null),await $.getState().loadConversations(x.id),A({title:"🗑️ Conversa deletada",description:"A conversa foi removida com sucesso."})}catch(u){console.error("Erro ao deletar conversa:",u),A({title:"Erro",description:"Não foi possível deletar a conversa.",variant:"destructive"})}};return e.jsxs("div",{className:"h-[calc(100vh-80px)] flex flex-col md:flex-row",children:[e.jsxs("div",{className:`${a?"fixed md:relative inset-0 md:inset-auto w-full md:w-72 z-50 md:z-auto":"hidden md:w-0"} transition-all duration-300 bg-gray-50 md:border-r border-gray-200 flex flex-col overflow-hidden`,children:[e.jsxs("div",{className:"p-4 border-b border-gray-200",children:[e.jsxs("div",{className:"flex items-center justify-between mb-3",children:[e.jsx("h2",{className:"text-sm font-semibold text-gray-700",children:"Conversas"}),e.jsx(P,{onClick:()=>r(!1),variant:"ghost",size:"sm",className:"h-7 w-7 p-0",children:e.jsx(Be,{className:"h-4 w-4"})})]}),e.jsxs(P,{onClick:Ue,className:"w-full gap-2",size:"sm",children:[e.jsx(it,{className:"h-4 w-4"}),"Nova Conversa"]})]}),e.jsx("div",{className:"flex-1 overflow-y-auto p-2 space-y-1",children:be.map(n=>e.jsxs("div",{className:`group relative flex items-center gap-2 p-3 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors ${I===n.id?"bg-blue-50 border border-blue-200":"bg-white"}`,onClick:()=>{I!==n.id&&Ta(n.id)},children:[e.jsx(ct,{className:"h-4 w-4 text-gray-500 flex-shrink-0"}),e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsx("p",{className:"text-sm font-medium text-gray-900 truncate",children:n.title}),e.jsx("p",{className:"text-xs text-gray-500 truncate",children:n.messages&&n.messages.length>0?n.messages[n.messages.length-1].content.substring(0,50)+"...":"Sem mensagens ainda"})]}),e.jsx(P,{onClick:u=>{u.stopPropagation(),Ia(n.id)},variant:"ghost",size:"sm",className:"h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity",children:e.jsx(lt,{className:"h-3.5 w-3.5 text-red-500"})})]},n.id))})]}),e.jsxs("div",{className:"flex-1 flex flex-col min-w-0 w-full",children:[e.jsx("div",{className:"border-b border-gray-200 bg-white/80 backdrop-blur-xl p-3 md:p-4",children:e.jsxs("div",{className:"flex items-center justify-between gap-2",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx(P,{onClick:()=>r(!a),variant:"ghost",size:"sm",className:"h-8 w-8 md:h-9 md:w-9 p-0 flex-shrink-0",children:a?e.jsx(Be,{className:"h-4 w-4 md:h-5 md:w-5"}):e.jsx(Ja,{className:"h-4 w-4 md:h-5 md:w-5"})}),e.jsx("div",{className:"p-1.5 sm:p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500",children:e.jsx(we,{className:"h-4 w-4 sm:h-6 sm:w-6 text-white"})}),e.jsxs("div",{children:[e.jsx("h1",{className:"text-base sm:text-xl font-bold text-gray-900",children:"Chat com IA"}),e.jsx("p",{className:"text-xs sm:text-sm text-gray-500",children:"Assistente inteligente"})]})]}),e.jsxs(se,{className:"bg-gradient-to-r from-green-500 to-emerald-500 text-xs sm:text-sm",children:[e.jsx(dt,{className:"h-3 w-3 mr-1"}),"Online"]})]})}),e.jsx("div",{className:"flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4 overscroll-contain",children:F?e.jsxs(e.Fragment,{children:[(c||d.length>0)&&e.jsx(as,{isSearching:c,searchResults:d,searchQuery:p}),m.length>0&&e.jsx(ts,{sources:m,isSearching:c}),S.length>0&&e.jsx("div",{className:"mb-4",children:e.jsx(os,{downloads:S})}),j.length>0&&e.jsx("div",{className:"mb-4 space-y-4",children:j.map((n,u)=>e.jsx(cs,{toolName:n.toolName,parameters:n.parameters,userId:(x==null?void 0:x.id)||"",conversationId:I||"",onComplete:h=>{console.log("Execução Super AI concluída:",h)}},u))}),F.messages.map(n=>{var h;const u=(h=n.content)==null?void 0:h.match(/INTEGRATION_CONNECT:(\w+):([^🔗]+)/);if(u&&n.role==="assistant"){const[,y,w]=u,q=n.content.replace(/🔗 \*\*INTEGRATION_CONNECT:[^🔗]+🔗\*\* 🔗\n\n/,"");return e.jsx("div",{className:"flex justify-start",children:e.jsxs("div",{className:"max-w-[80%]",children:[e.jsx(W,{className:"bg-white mb-2",children:e.jsx(Q,{className:"p-4",children:e.jsxs("div",{className:"flex items-start gap-2",children:[e.jsx(we,{className:"h-5 w-5 text-blue-600 mt-1 flex-shrink-0"}),e.jsx("div",{className:"flex-1 whitespace-pre-wrap break-words text-sm text-gray-900",children:q})]})})}),e.jsx(ss,{platform:y,platformName:w.trim(),onSkip:()=>{console.log("Conexão pulada:",y)},onSuccess:()=>{console.log("Conectado com sucesso:",y)}})]})},n.id)}return e.jsx("div",{className:`flex ${n.role==="user"?"justify-end":"justify-start"} mb-3`,children:e.jsx(W,{className:`w-full max-w-[90%] sm:max-w-[85%] md:max-w-[75%] lg:max-w-[70%] ${n.role==="user"?"bg-gradient-to-r from-blue-500 to-purple-500 text-white":"bg-white"}`,children:e.jsxs(Q,{className:"p-3 md:p-4",children:[e.jsxs("div",{className:"flex items-start gap-2",children:[n.role==="assistant"&&e.jsx(we,{className:"h-4 w-4 md:h-5 md:w-5 text-blue-600 mt-0.5 flex-shrink-0"}),e.jsx("div",{className:`flex-1 whitespace-pre-wrap break-words text-sm md:text-base ${n.role==="user"?"text-white":"text-gray-900"}`,style:{wordBreak:"break-word",overflowWrap:"anywhere",maxWidth:"100%"},children:n.content})]}),e.jsx("div",{className:`text-xs mt-2 ${n.role==="user"?"text-white/70":"text-gray-500"}`,children:n.timestamp?new Date(n.timestamp).toLocaleTimeString("pt-BR"):""})]})})},n.id)}),ie&&e.jsx(ot,{isThinking:ie,currentTool:E,reasoning:L,sources:G,status:"thinking"}),ie&&e.jsx("div",{className:"flex justify-start",children:e.jsx(W,{className:"bg-white",children:e.jsx(Q,{className:"p-4",children:e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(re,{className:"h-4 w-4 animate-spin text-blue-600"}),e.jsx("span",{className:"text-sm text-gray-500",children:"Processando..."})]})})})}),e.jsx("div",{ref:$e})]}):e.jsx("div",{className:"flex items-center justify-center h-full text-muted-foreground",children:e.jsx("p",{children:"Selecione ou crie uma conversa para começar."})})}),e.jsxs("div",{className:"border-t border-gray-200 p-3 md:p-4 bg-white/80 backdrop-blur-xl flex-shrink-0",children:[e.jsx("div",{className:"hidden sm:flex gap-2 mb-2",children:js.map(n=>e.jsx(P,{variant:"outline",size:"sm",onClick:()=>Aa(n),className:"text-xs",children:n},n))}),e.jsxs("div",{className:"relative",children:[e.jsx(It,{value:s,onChange:n=>t(n.target.value),onKeyDown:n=>{n.key==="Enter"&&!n.shiftKey&&window.innerWidth>768&&(n.preventDefault(),Ee())},placeholder:"Digite sua mensagem...",className:"w-full resize-none rounded-lg border bg-background p-3 pr-20 md:pr-24 min-h-[44px] md:min-h-[48px] text-sm md:text-base",minRows:1,maxRows:window.innerWidth<768?3:5,maxLength:ue}),e.jsxs("div",{className:"absolute right-2 top-1/2 -translate-y-1/2 flex gap-1",children:[e.jsx("input",{type:"file",ref:Fe,onChange:ja,className:"hidden"}),e.jsx(Ze,{children:e.jsxs(Je,{children:[e.jsx(ea,{asChild:!0,children:e.jsx(P,{type:"button",size:"icon",variant:"ghost",onClick:ya,className:"h-8 w-8 md:h-9 md:w-9 flex-shrink-0 touch-manipulation",children:e.jsx(mt,{className:"h-4 w-4"})})}),e.jsx(Pe,{children:"Anexar arquivo"})]})}),e.jsx(Ze,{children:e.jsxs(Je,{children:[e.jsx(ea,{asChild:!0,children:e.jsx(P,{type:"button",size:"icon",variant:"ghost",onClick:fe?Na:wa,disabled:!I,className:`h-8 w-8 md:h-9 md:w-9 flex-shrink-0 touch-manipulation ${fe?"text-red-500 animate-pulse":""}`,children:e.jsx(ut,{className:"h-4 w-4"})})}),e.jsx(Pe,{children:"Gravar áudio"})]})}),e.jsx(P,{type:"submit",size:"icon",onClick:Ee,disabled:s.trim()===""||!I,className:"h-8 w-8 md:h-9 md:w-9 flex-shrink-0 touch-manipulation",children:e.jsx(at,{className:"h-4 w-4"})})]})]}),e.jsxs("p",{className:me("text-xs text-right mt-1",s.length>ue?"text-destructive":"text-muted-foreground"),children:[s.length," / ",ue]})]})]})]})};export{Hs as default};
