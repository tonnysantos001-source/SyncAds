var ka=Object.defineProperty;var Pa=(s,e,t)=>e in s?ka(s,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):s[e]=t;var we=(s,e,t)=>Pa(s,typeof e!="symbol"?e+"":e,t);import{c as ke,r as d,R as Ce,o as Ma,p as _a,q as La,j as a,t as qa,v as ta,w as $a,x as za,y as Ga,z as sa,A as Fa,P as Ua,D as ee,E as Va,F as Ba,G as Ha,H as Wa,J as Qa,K as Ka,M as me,S as ra,N as re,g as Q,l as K,B as k,s as D,n as se,h as Xa,i as Ya,O as Za,u as Ve,e as Ja,Q as U,T as et,f as at,X as Be,U as tt,a as ye,V as st}from"./index-DOO3k1mv.js";import{G as oa,S as rt}from"./send-B3onUhwA.js";import{E as oe}from"./external-link-BVdn_s1A.js";import{C as ot}from"./clock-DdbuKv2n.js";import{D as je}from"./download-BiOhWfDk.js";import{P as nt}from"./progress-OIkpWEG9.js";import{C as it,A as ct}from"./AiThinkingIndicator-FXoPWdyw.js";import{C as Te}from"./circle-alert-DphoOqCE.js";import{C as Pe}from"./circle-x-CRLrWdFK.js";import{C as lt}from"./circle-check-whAYr3Te.js";import{i as de,I as Ne}from"./integrationsService-DVwh_89Z.js";import{P as dt}from"./plus-C0bwafES.js";import{M as ut}from"./message-square-BLD8EyJa.js";import{T as mt}from"./trash-2-BbOsRB3p.js";import{S as pt}from"./sparkles-DAD_RjZ6.js";/**
 * @license lucide-react v0.417.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const na=ke("FileArchive",[["path",{d:"M10 12v-1",key:"v7bkov"}],["path",{d:"M10 18v-2",key:"1cjy8d"}],["path",{d:"M10 7V6",key:"dljcrl"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M15.5 22H18a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v16a2 2 0 0 0 .274 1.01",key:"gkbcor"}],["circle",{cx:"10",cy:"20",r:"2",key:"1xzdoj"}]]);/**
 * @license lucide-react v0.417.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const gt=ke("Mic",[["path",{d:"M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z",key:"131961"}],["path",{d:"M19 10v2a7 7 0 0 1-14 0v-2",key:"1vc78b"}],["line",{x1:"12",x2:"12",y1:"19",y2:"22",key:"x3vr5v"}]]);/**
 * @license lucide-react v0.417.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ht=ke("Paperclip",[["path",{d:"m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48",key:"1u3ebp"}]]);function Ie(){return Ie=Object.assign?Object.assign.bind():function(s){for(var e=1;e<arguments.length;e++){var t=arguments[e];for(var r in t)({}).hasOwnProperty.call(t,r)&&(s[r]=t[r])}return s},Ie.apply(null,arguments)}function ft(s,e){if(s==null)return{};var t={};for(var r in s)if({}.hasOwnProperty.call(s,r)){if(e.indexOf(r)!==-1)continue;t[r]=s[r]}return t}var xt=d.useLayoutEffect,vt=function(e){var t=Ce.useRef(e);return xt(function(){t.current=e}),t},He=function(e,t){if(typeof e=="function"){e(t);return}e.current=t},bt=function(e,t){var r=Ce.useRef();return Ce.useCallback(function(o){e.current=o,r.current&&He(r.current,null),r.current=t,t&&He(t,o)},[t])},We={"min-height":"0","max-height":"none",height:"0",visibility:"hidden",overflow:"hidden",position:"absolute","z-index":"-1000",top:"0",right:"0",display:"block"},St=function(e){Object.keys(We).forEach(function(t){e.style.setProperty(t,We[t],"important")})},Qe=St,_=null,Ke=function(e,t){var r=e.scrollHeight;return t.sizingStyle.boxSizing==="border-box"?r+t.borderSize:r-t.paddingSize};function Et(s,e,t,r){t===void 0&&(t=1),r===void 0&&(r=1/0),_||(_=document.createElement("textarea"),_.setAttribute("tabindex","-1"),_.setAttribute("aria-hidden","true"),Qe(_)),_.parentNode===null&&document.body.appendChild(_);var o=s.paddingSize,i=s.borderSize,l=s.sizingStyle,v=l.boxSizing;Object.keys(l).forEach(function(m){var f=m;_.style[f]=l[f]}),Qe(_),_.value=e;var u=Ke(_,s);_.value=e,u=Ke(_,s),_.value="x";var b=_.scrollHeight-o,g=b*t;v==="border-box"&&(g=g+o+i),u=Math.max(g,u);var h=b*r;return v==="border-box"&&(h=h+o+i),u=Math.min(h,u),[u,b]}var Xe=function(){},At=function(e,t){return e.reduce(function(r,o){return r[o]=t[o],r},{})},wt=["borderBottomWidth","borderLeftWidth","borderRightWidth","borderTopWidth","boxSizing","fontFamily","fontSize","fontStyle","fontWeight","letterSpacing","lineHeight","paddingBottom","paddingLeft","paddingRight","paddingTop","tabSize","textIndent","textRendering","textTransform","width","wordBreak","wordSpacing","scrollbarGutter"],yt=!!document.documentElement.currentStyle,Nt=function(e){var t=window.getComputedStyle(e);if(t===null)return null;var r=At(wt,t),o=r.boxSizing;if(o==="")return null;yt&&o==="border-box"&&(r.width=parseFloat(r.width)+parseFloat(r.borderRightWidth)+parseFloat(r.borderLeftWidth)+parseFloat(r.paddingRight)+parseFloat(r.paddingLeft)+"px");var i=parseFloat(r.paddingBottom)+parseFloat(r.paddingTop),l=parseFloat(r.borderBottomWidth)+parseFloat(r.borderTopWidth);return{sizingStyle:r,paddingSize:i,borderSize:l}},Ct=Nt;function Me(s,e,t){var r=vt(t);d.useLayoutEffect(function(){var o=function(l){return r.current(l)};if(s)return s.addEventListener(e,o),function(){return s.removeEventListener(e,o)}},[])}var jt=function(e,t){Me(document.body,"reset",function(r){e.current.form===r.target&&t(r)})},Tt=function(e){Me(window,"resize",e)},It=function(e){Me(document.fonts,"loadingdone",e)},Rt=["cacheMeasurements","maxRows","minRows","onChange","onHeightChange"],Dt=function(e,t){var r=e.cacheMeasurements,o=e.maxRows,i=e.minRows,l=e.onChange,v=l===void 0?Xe:l,u=e.onHeightChange,b=u===void 0?Xe:u,g=ft(e,Rt),h=g.value!==void 0,m=d.useRef(null),f=bt(m,t),S=d.useRef(0),I=d.useRef(),j=function(){var C=m.current,q=r&&I.current?I.current:Ct(C);if(q){I.current=q;var P=Et(q,C.value||C.placeholder||"x",i,o),G=P[0],Y=P[1];S.current!==G&&(S.current=G,C.style.setProperty("height",G+"px","important"),b(G,{rowHeight:Y}))}},L=function(C){h||j(),v(C)};return d.useLayoutEffect(j),jt(m,function(){if(!h){var w=m.current.value;requestAnimationFrame(function(){var C=m.current;C&&w!==C.value&&j()})}}),Tt(j),It(j),d.createElement("textarea",Ie({},g,{onChange:L,ref:f}))},Ot=d.forwardRef(Dt);const kt={emailSummary:!0,emailAlerts:!0,emailNews:!1,pushMentions:!0,pushIntegrations:!1,pushSuggestions:!0},Ye=Ma()(_a(s=>({aiSystemPrompt:"Você é o SyncAds AI, um assistente de marketing digital especializado em otimização de campanhas. Seja proativo, criativo e forneça insights baseados em dados. Suas respostas devem ser claras, concisas e sempre focadas em ajudar o usuário a atingir seus objetivos de marketing.",aiInitialGreetings:["Show, chegou no lugar certo. Eu automatizo o que os outros demoram três reuniões pra entender. O que a gente vai otimizar hoje?","Relaxa, aqui não tem blá-blá-blá. Só plano, execução e conversão. Passa o produto e o público.","Beleza. Eu sou o motor que transforma tentativa em lucro. Quer começar pequeno ou já quer escalar até o servidor pedir arrego?","Ótimo. Se você quiser aula, vai pro YouTube. Se quiser dinheiro rodando, me dá os dados e deixa eu fazer o estrago.","Ah, ótimo… mais um querendo vender antes de entender o jogo. Respira. Me diz o produto — eu transformo tua ideia num motivo pra alguém gastar dinheiro agora.","Bem-vindo ao lado escuro do funil. Aqui a gente não inspira ninguém — a gente convence. Cê tá pronto pra sujar um pouco as mãos ou prefere PowerPoint?","Se você quer motivação, compra um livro. Se quer resultado, me dá acesso ao checkout e segura o ROI.","Eu sou o algoritmo de ressaca: sarcástico, funcional e viciado em lucro. Fala o que você vende antes que eu comece a julgar teu nicho.","Parabéns, você acabou de invocar o espírito da conversão. Sem papo de mindset, sem desculpa. Quer que eu destrinche teu tráfego ou tua vergonha de anunciar?"],isTwoFactorEnabled:!1,notificationSettings:kt,setAiSystemPrompt:e=>s({aiSystemPrompt:e}),setAiInitialGreetings:e=>s({aiInitialGreetings:e}),addAiGreeting:e=>s(t=>({aiInitialGreetings:[...t.aiInitialGreetings,e]})),removeAiGreeting:e=>s(t=>({aiInitialGreetings:t.aiInitialGreetings.filter((r,o)=>o!==e)})),updateAiGreeting:(e,t)=>s(r=>({aiInitialGreetings:r.aiInitialGreetings.map((o,i)=>i===e?t:o)})),setTwoFactorEnabled:e=>s({isTwoFactorEnabled:e}),updateNotificationSettings:e=>s(t=>({notificationSettings:{...t.notificationSettings,...e}}))}),{name:"settings-storage",storage:La(()=>localStorage),partialize:s=>({aiSystemPrompt:s.aiSystemPrompt,aiInitialGreetings:s.aiInitialGreetings,isTwoFactorEnabled:s.isTwoFactorEnabled,notificationSettings:s.notificationSettings})}));var[pe]=qa("Tooltip",[ta]),ge=ta(),ia="TooltipProvider",Pt=700,Re="tooltip.open",[Mt,_e]=pe(ia),ca=s=>{const{__scopeTooltip:e,delayDuration:t=Pt,skipDelayDuration:r=300,disableHoverableContent:o=!1,children:i}=s,l=d.useRef(!0),v=d.useRef(!1),u=d.useRef(0);return d.useEffect(()=>{const b=u.current;return()=>window.clearTimeout(b)},[]),a.jsx(Mt,{scope:e,isOpenDelayedRef:l,delayDuration:t,onOpen:d.useCallback(()=>{window.clearTimeout(u.current),l.current=!1},[]),onClose:d.useCallback(()=>{window.clearTimeout(u.current),u.current=window.setTimeout(()=>l.current=!0,r)},[r]),isPointerInTransitRef:v,onPointerInTransitChange:d.useCallback(b=>{v.current=b},[]),disableHoverableContent:o,children:i})};ca.displayName=ia;var ne="Tooltip",[_t,he]=pe(ne),la=s=>{const{__scopeTooltip:e,children:t,open:r,defaultOpen:o,onOpenChange:i,disableHoverableContent:l,delayDuration:v}=s,u=_e(ne,s.__scopeTooltip),b=ge(e),[g,h]=d.useState(null),m=$a(),f=d.useRef(0),S=l??u.disableHoverableContent,I=v??u.delayDuration,j=d.useRef(!1),[L,w]=za({prop:r,defaultProp:o??!1,onChange:Y=>{Y?(u.onOpen(),document.dispatchEvent(new CustomEvent(Re))):u.onClose(),i==null||i(Y)},caller:ne}),C=d.useMemo(()=>L?j.current?"delayed-open":"instant-open":"closed",[L]),q=d.useCallback(()=>{window.clearTimeout(f.current),f.current=0,j.current=!1,w(!0)},[w]),P=d.useCallback(()=>{window.clearTimeout(f.current),f.current=0,w(!1)},[w]),G=d.useCallback(()=>{window.clearTimeout(f.current),f.current=window.setTimeout(()=>{j.current=!0,w(!0),f.current=0},I)},[I,w]);return d.useEffect(()=>()=>{f.current&&(window.clearTimeout(f.current),f.current=0)},[]),a.jsx(Ga,{...b,children:a.jsx(_t,{scope:e,contentId:m,open:L,stateAttribute:C,trigger:g,onTriggerChange:h,onTriggerEnter:d.useCallback(()=>{u.isOpenDelayedRef.current?G():q()},[u.isOpenDelayedRef,G,q]),onTriggerLeave:d.useCallback(()=>{S?P():(window.clearTimeout(f.current),f.current=0)},[P,S]),onOpen:q,onClose:P,disableHoverableContent:S,children:t})})};la.displayName=ne;var De="TooltipTrigger",da=d.forwardRef((s,e)=>{const{__scopeTooltip:t,...r}=s,o=he(De,t),i=_e(De,t),l=ge(t),v=d.useRef(null),u=sa(e,v,o.onTriggerChange),b=d.useRef(!1),g=d.useRef(!1),h=d.useCallback(()=>b.current=!1,[]);return d.useEffect(()=>()=>document.removeEventListener("pointerup",h),[h]),a.jsx(Fa,{asChild:!0,...l,children:a.jsx(Ua.button,{"aria-describedby":o.open?o.contentId:void 0,"data-state":o.stateAttribute,...r,ref:u,onPointerMove:ee(s.onPointerMove,m=>{m.pointerType!=="touch"&&!g.current&&!i.isPointerInTransitRef.current&&(o.onTriggerEnter(),g.current=!0)}),onPointerLeave:ee(s.onPointerLeave,()=>{o.onTriggerLeave(),g.current=!1}),onPointerDown:ee(s.onPointerDown,()=>{o.open&&o.onClose(),b.current=!0,document.addEventListener("pointerup",h,{once:!0})}),onFocus:ee(s.onFocus,()=>{b.current||o.onOpen()}),onBlur:ee(s.onBlur,o.onClose),onClick:ee(s.onClick,o.onClose)})})});da.displayName=De;var Lt="TooltipPortal",[er,qt]=pe(Lt,{forceMount:void 0}),ae="TooltipContent",ua=d.forwardRef((s,e)=>{const t=qt(ae,s.__scopeTooltip),{forceMount:r=t.forceMount,side:o="top",...i}=s,l=he(ae,s.__scopeTooltip);return a.jsx(Va,{present:r||l.open,children:l.disableHoverableContent?a.jsx(ma,{side:o,...i,ref:e}):a.jsx($t,{side:o,...i,ref:e})})}),$t=d.forwardRef((s,e)=>{const t=he(ae,s.__scopeTooltip),r=_e(ae,s.__scopeTooltip),o=d.useRef(null),i=sa(e,o),[l,v]=d.useState(null),{trigger:u,onClose:b}=t,g=o.current,{onPointerInTransitChange:h}=r,m=d.useCallback(()=>{v(null),h(!1)},[h]),f=d.useCallback((S,I)=>{const j=S.currentTarget,L={x:S.clientX,y:S.clientY},w=Vt(L,j.getBoundingClientRect()),C=Bt(L,w),q=Ht(I.getBoundingClientRect()),P=Qt([...C,...q]);v(P),h(!0)},[h]);return d.useEffect(()=>()=>m(),[m]),d.useEffect(()=>{if(u&&g){const S=j=>f(j,g),I=j=>f(j,u);return u.addEventListener("pointerleave",S),g.addEventListener("pointerleave",I),()=>{u.removeEventListener("pointerleave",S),g.removeEventListener("pointerleave",I)}}},[u,g,f,m]),d.useEffect(()=>{if(l){const S=I=>{const j=I.target,L={x:I.clientX,y:I.clientY},w=(u==null?void 0:u.contains(j))||(g==null?void 0:g.contains(j)),C=!Wt(L,l);w?m():C&&(m(),b())};return document.addEventListener("pointermove",S),()=>document.removeEventListener("pointermove",S)}},[u,g,l,b,m]),a.jsx(ma,{...s,ref:i})}),[zt,Gt]=pe(ne,{isInside:!1}),Ft=Wa("TooltipContent"),ma=d.forwardRef((s,e)=>{const{__scopeTooltip:t,children:r,"aria-label":o,onEscapeKeyDown:i,onPointerDownOutside:l,...v}=s,u=he(ae,t),b=ge(t),{onClose:g}=u;return d.useEffect(()=>(document.addEventListener(Re,g),()=>document.removeEventListener(Re,g)),[g]),d.useEffect(()=>{if(u.trigger){const h=m=>{const f=m.target;f!=null&&f.contains(u.trigger)&&g()};return window.addEventListener("scroll",h,{capture:!0}),()=>window.removeEventListener("scroll",h,{capture:!0})}},[u.trigger,g]),a.jsx(Ba,{asChild:!0,disableOutsidePointerEvents:!1,onEscapeKeyDown:i,onPointerDownOutside:l,onFocusOutside:h=>h.preventDefault(),onDismiss:g,children:a.jsxs(Ha,{"data-state":u.stateAttribute,...b,...v,ref:e,style:{...v.style,"--radix-tooltip-content-transform-origin":"var(--radix-popper-transform-origin)","--radix-tooltip-content-available-width":"var(--radix-popper-available-width)","--radix-tooltip-content-available-height":"var(--radix-popper-available-height)","--radix-tooltip-trigger-width":"var(--radix-popper-anchor-width)","--radix-tooltip-trigger-height":"var(--radix-popper-anchor-height)"},children:[a.jsx(Ft,{children:r}),a.jsx(zt,{scope:t,isInside:!0,children:a.jsx(Qa,{id:u.contentId,role:"tooltip",children:o||r})})]})})});ua.displayName=ae;var pa="TooltipArrow",Ut=d.forwardRef((s,e)=>{const{__scopeTooltip:t,...r}=s,o=ge(t);return Gt(pa,t).isInside?null:a.jsx(Ka,{...o,...r,ref:e})});Ut.displayName=pa;function Vt(s,e){const t=Math.abs(e.top-s.y),r=Math.abs(e.bottom-s.y),o=Math.abs(e.right-s.x),i=Math.abs(e.left-s.x);switch(Math.min(t,r,o,i)){case i:return"left";case o:return"right";case t:return"top";case r:return"bottom";default:throw new Error("unreachable")}}function Bt(s,e,t=5){const r=[];switch(e){case"top":r.push({x:s.x-t,y:s.y+t},{x:s.x+t,y:s.y+t});break;case"bottom":r.push({x:s.x-t,y:s.y-t},{x:s.x+t,y:s.y-t});break;case"left":r.push({x:s.x+t,y:s.y-t},{x:s.x+t,y:s.y+t});break;case"right":r.push({x:s.x-t,y:s.y-t},{x:s.x-t,y:s.y+t});break}return r}function Ht(s){const{top:e,right:t,bottom:r,left:o}=s;return[{x:o,y:e},{x:t,y:e},{x:t,y:r},{x:o,y:r}]}function Wt(s,e){const{x:t,y:r}=s;let o=!1;for(let i=0,l=e.length-1;i<e.length;l=i++){const v=e[i],u=e[l],b=v.x,g=v.y,h=u.x,m=u.y;g>r!=m>r&&t<(h-b)*(r-g)/(m-g)+b&&(o=!o)}return o}function Qt(s){const e=s.slice();return e.sort((t,r)=>t.x<r.x?-1:t.x>r.x?1:t.y<r.y?-1:t.y>r.y?1:0),Kt(e)}function Kt(s){if(s.length<=1)return s.slice();const e=[];for(let r=0;r<s.length;r++){const o=s[r];for(;e.length>=2;){const i=e[e.length-1],l=e[e.length-2];if((i.x-l.x)*(o.y-l.y)>=(i.y-l.y)*(o.x-l.x))e.pop();else break}e.push(o)}e.pop();const t=[];for(let r=s.length-1;r>=0;r--){const o=s[r];for(;t.length>=2;){const i=t[t.length-1],l=t[t.length-2];if((i.x-l.x)*(o.y-l.y)>=(i.y-l.y)*(o.x-l.x))t.pop();else break}t.push(o)}return t.pop(),e.length===1&&t.length===1&&e[0].x===t[0].x&&e[0].y===t[0].y?e:e.concat(t)}var Xt=ca,Yt=la,Zt=da,ga=ua;const Ze=Xt,Je=Yt,ea=Zt,Oe=d.forwardRef(({className:s,sideOffset:e=4,...t},r)=>a.jsx(ga,{ref:r,sideOffset:e,className:me("z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",s),...t}));Oe.displayName=ga.displayName;const Jt=`
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
`;function es(s){const e=/```campaign-create\s*\n([\s\S]*?)```/,t=s.match(e);if(!t)return null;try{const r=JSON.parse(t[1].trim());return!r.name||!r.platform||!r.budgetTotal||!r.startDate?(console.error("Campaign data missing required fields"),null):["Google Ads","Meta","LinkedIn"].includes(r.platform)?{action:"create_campaign",data:{name:r.name,platform:r.platform,budgetTotal:Number(r.budgetTotal),startDate:r.startDate,endDate:r.endDate||void 0,objective:r.objective||"Conversões"}}:(console.error("Invalid platform:",r.platform),null)}catch(r){return console.error("Failed to parse campaign data:",r),null}}function as(s){return s.replace(/```campaign-create\s*\n[\s\S]*?```/g,"").trim()}const ts=`
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
`,aa=["Show, chegou no lugar certo. Eu automatizo o que os outros demoram três reuniões pra entender. O que a gente vai otimizar hoje?","Relaxa, aqui não tem blá-blá-blá. Só plano, execução e conversão. Passa o produto e o público.","Beleza. Eu sou o motor que transforma tentativa em lucro. Quer começar pequeno ou já quer escalar até o servidor pedir arrego?","Ótimo. Se você quiser aula, vai pro YouTube. Se quiser dinheiro rodando, me dá os dados e deixa eu fazer o estrago.","Ah, ótimo… mais um querendo vender antes de entender o jogo. Respira. Me diz o produto — eu transformo tua ideia num motivo pra alguém gastar dinheiro agora.","Bem-vindo ao lado escuro do funil. Aqui a gente não inspira ninguém — a gente convence. Cê tá pronto pra sujar um pouco as mãos ou prefere PowerPoint?","Se você quer motivação, compra um livro. Se quer resultado, me dá acesso ao checkout e segura o ROI.","Eu sou o algoritmo de ressaca: sarcástico, funcional e viciado em lucro. Fala o que você vende antes que eu comece a julgar teu nicho.","Parabéns, você acabou de invocar o espírito da conversão. Sem papo de mindset, sem desculpa. Quer que eu destrinche teu tráfego ou tua vergonha de anunciar?"];function ss(){return aa[Math.floor(Math.random()*aa.length)]}const rs=({isSearching:s,searchResults:e=[],searchQuery:t})=>!s&&e.length===0?null:a.jsxs("div",{className:"mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg",children:[a.jsxs("div",{className:"flex items-center gap-2 mb-2",children:[a.jsx(ra,{className:"h-4 w-4 text-blue-600"}),a.jsx("span",{className:"text-sm font-medium text-blue-800",children:s?"Pesquisando na web...":"Resultados da pesquisa:"})]}),t&&a.jsxs("p",{className:"text-xs text-blue-600 mb-2",children:[a.jsx("strong",{children:"Consulta:"}),' "',t,'"']}),s?a.jsxs("div",{className:"flex items-center gap-2",children:[a.jsx("div",{className:"flex gap-1",children:[1,2,3].map(r=>a.jsx("div",{className:"w-2 h-2 bg-blue-400 rounded-full animate-pulse",style:{animationDelay:`${r*.2}s`}},r))}),a.jsx("span",{className:"text-xs text-blue-600",children:"Buscando informações..."})]}):a.jsx("div",{className:"space-y-2",children:e.slice(0,3).map((r,o)=>a.jsxs("div",{className:"flex items-start gap-2 p-2 bg-white rounded border",children:[a.jsx("div",{className:"flex-shrink-0 mt-0.5",children:r.favicon?a.jsx("img",{src:r.favicon,alt:"",className:"w-4 h-4",onError:i=>{i.currentTarget.style.display="none"}}):a.jsx(oa,{className:"w-4 h-4 text-gray-400"})}),a.jsxs("div",{className:"flex-1 min-w-0",children:[a.jsx("h4",{className:"text-xs font-medium text-gray-900 truncate",children:r.title}),a.jsx("p",{className:"text-xs text-gray-600 line-clamp-2",children:r.snippet}),a.jsxs("a",{href:r.url,target:"_blank",rel:"noopener noreferrer",className:"text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1",children:[a.jsx(oe,{className:"w-3 h-3"}),"Ver fonte"]})]})]},o))})]}),os=({sources:s,isSearching:e})=>e?a.jsxs("div",{className:"mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg",children:[a.jsxs("div",{className:"flex items-center gap-2 mb-2",children:[a.jsx(ra,{className:"h-4 w-4 text-blue-600"}),a.jsx("span",{className:"text-sm font-medium text-blue-800",children:"Pesquisando em múltiplas fontes..."})]}),a.jsx("div",{className:"flex gap-2 flex-wrap",children:s.map((t,r)=>a.jsxs("div",{className:"flex items-center gap-1 px-2 py-1 bg-white rounded border text-xs text-gray-600",children:[a.jsx(oa,{className:"w-3 h-3"}),t]},r))})]}):null,ns=({platform:s,platformName:e,icon:t,onSkip:r,onSuccess:o})=>{const[i,l]=d.useState(!1),[v,u]=d.useState("idle"),b=async()=>{l(!0),u("connecting");try{const{data:{session:h}}=await D.auth.getSession();if(!h)throw new Error("Você precisa estar logado");const m=await fetch("https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/oauth-init",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${h.access_token}`},body:JSON.stringify({platform:s.toUpperCase(),redirectUrl:`${window.location.origin}/oauth/callback`})});if(!m.ok)throw new Error("Falha ao iniciar conexão");const{authUrl:f}=await m.json(),S=600,I=700,j=window.screen.width/2-S/2,L=window.screen.height/2-I/2,w=window.open(f,"oauth-popup",`width=${S},height=${I},left=${j},top=${L}`),C=q=>{var P,G;((P=q.data)==null?void 0:P.type)==="oauth-success"?(u("success"),l(!1),w==null||w.close(),o==null||o(),window.removeEventListener("message",C)):((G=q.data)==null?void 0:G.type)==="oauth-error"&&(u("error"),l(!1),w==null||w.close(),window.removeEventListener("message",C))};window.addEventListener("message",C),setTimeout(()=>{i&&(u("error"),l(!1),w==null||w.close())},5*60*1e3)}catch(h){console.error("Erro ao conectar:",h),u("error"),l(!1)}},g=()=>t||{facebook:"📘",meta:"📘",google:"🔍",linkedin:"💼",tiktok:"🎵",twitter:"🐦",canva:"🎨",instagram:"📸"}[s.toLowerCase()]||"🔗";return a.jsxs("div",{className:"my-4 animate-in fade-in slide-in-from-bottom-2 duration-300",children:[a.jsx("div",{className:"mb-3",children:a.jsxs("p",{className:"text-sm text-gray-700",children:["Vou conectar sua conta do ",a.jsx("strong",{children:e})," ao SyncAds."]})}),i&&a.jsxs("div",{className:"flex items-center gap-2 mb-3 text-sm text-blue-600",children:[a.jsx("span",{className:"text-2xl",children:g()}),a.jsxs("span",{children:["Connecting ",e,"..."]}),a.jsx(re,{className:"h-4 w-4 animate-spin"})]}),a.jsx(Q,{className:"border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow",children:a.jsxs(K,{className:"p-5",children:[a.jsx("div",{className:"mb-4",children:a.jsxs("p",{className:"text-sm text-gray-600 leading-relaxed",children:["I'll need to connect your ",a.jsx("strong",{className:"text-gray-900",children:e})," account to continue."]})}),a.jsxs("div",{className:"flex items-center gap-2",children:[a.jsx(k,{onClick:()=>r==null?void 0:r(),variant:"ghost",disabled:i,className:"text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all",children:"Skip"}),a.jsx(k,{onClick:b,disabled:i,className:"flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-60 disabled:transform-none",children:i?a.jsxs(a.Fragment,{children:[a.jsx(re,{className:"mr-2 h-4 w-4 animate-spin"}),"Connecting..."]}):a.jsxs(a.Fragment,{children:[a.jsx("span",{className:"mr-2 text-xl",children:g()}),"Connect ",e,a.jsx(oe,{className:"ml-2 h-4 w-4"})]})})]}),a.jsx("div",{className:"mt-4 pt-4 border-t border-gray-100",children:a.jsxs("a",{href:"/privacy",target:"_blank",className:"text-xs text-gray-400 hover:text-blue-600 flex items-center gap-1 transition-colors",children:[a.jsx("svg",{className:"h-3 w-3",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:a.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"})}),"How we handle your data",a.jsx(oe,{className:"h-3 w-3"})]})}),v==="success"&&a.jsx("div",{className:"mt-3 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700",children:"✅ Conectado com sucesso!"}),v==="error"&&a.jsx("div",{className:"mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700",children:"❌ Erro ao conectar. Tente novamente."})]})})]})},is=({downloadUrl:s,fileName:e,expiresAt:t,fileCount:r,campaignName:o,platform:i,period:l})=>{const v=()=>{const b=document.createElement("a");b.href=s,b.download=e,document.body.appendChild(b),b.click(),document.body.removeChild(b)},u=b=>{const g=new Date(b),h=new Date,m=g.getTime()-h.getTime(),f=Math.floor(m/(1e3*60*60)),S=Math.floor(m%(1e3*60*60)/(1e3*60));return f>0?`${f}h ${S}min`:`${S}min`};return a.jsx(Q,{className:"w-full max-w-md bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200",children:a.jsx(K,{className:"p-4",children:a.jsxs("div",{className:"flex items-start gap-3",children:[a.jsx("div",{className:"flex-shrink-0",children:a.jsx(na,{className:"h-8 w-8 text-blue-600"})}),a.jsxs("div",{className:"flex-1 min-w-0",children:[a.jsxs("div",{className:"flex items-center gap-2 mb-2",children:[a.jsx("h4",{className:"font-medium text-gray-900 truncate",children:e}),a.jsxs(se,{variant:"secondary",className:"text-xs",children:[r," arquivo",r!==1?"s":""]})]}),a.jsxs("div",{className:"space-y-1 mb-3",children:[o&&a.jsxs("p",{className:"text-sm text-gray-600",children:[a.jsx("span",{className:"font-medium",children:"Campanha:"})," ",o]}),i&&a.jsxs("p",{className:"text-sm text-gray-600",children:[a.jsx("span",{className:"font-medium",children:"Plataforma:"})," ",i]}),l&&a.jsxs("p",{className:"text-sm text-gray-600",children:[a.jsx("span",{className:"font-medium",children:"Período:"})," ",l]})]}),a.jsxs("div",{className:"flex items-center gap-1 text-xs text-orange-600 mb-3",children:[a.jsx(ot,{className:"h-3 w-3"}),a.jsxs("span",{children:["Expira em ",u(t)]})]}),a.jsxs("div",{className:"flex gap-2",children:[a.jsxs(k,{onClick:v,size:"sm",className:"flex-1",children:[a.jsx(je,{className:"h-4 w-4 mr-2"}),"Baixar"]}),a.jsx(k,{variant:"outline",size:"sm",onClick:()=>window.open(s,"_blank"),children:a.jsx(oe,{className:"h-4 w-4"})})]})]})]})})})},cs=({downloads:s})=>s.length===0?null:a.jsxs("div",{className:"space-y-3",children:[a.jsxs("h3",{className:"text-sm font-medium text-gray-700 flex items-center gap-2",children:[a.jsx(na,{className:"h-4 w-4"}),"Downloads Disponíveis (",s.length,")"]}),a.jsx("div",{className:"space-y-2",children:s.map((e,t)=>a.jsx(is,{...e},t))})]});function ls({steps:s,showCode:e=!0}){if(!s||s.length===0)return null;const t=i=>{switch(i){case"completed":return a.jsx(lt,{className:"h-4 w-4 text-green-500"});case"running":return a.jsx(re,{className:"h-4 w-4 text-blue-500 animate-spin"});case"failed":return a.jsx(Pe,{className:"h-4 w-4 text-red-500"});default:return a.jsx(Te,{className:"h-4 w-4 text-gray-500"})}},r=i=>{switch(i){case"completed":return"bg-green-100 text-green-800 border-green-200";case"running":return"bg-blue-100 text-blue-800 border-blue-200";case"failed":return"bg-red-100 text-red-800 border-red-200";default:return"bg-gray-100 text-gray-800 border-gray-200"}},o=i=>{const l=s[i],v=s[i+1];return l.status==="completed"&&(!v||v.status==="running"||v.status==="failed")};return a.jsxs("div",{className:"mb-4 space-y-2",children:[s.map((i,l)=>a.jsx(Q,{className:me("border transition-all",o(l)&&"ring-2 ring-blue-500 ring-opacity-50"),children:a.jsx(K,{className:"p-3",children:a.jsxs("div",{className:"flex items-start gap-3",children:[a.jsx("div",{className:"flex-shrink-0 mt-0.5",children:t(i.status)}),a.jsxs("div",{className:"flex-1 min-w-0 space-y-2",children:[a.jsx("div",{className:"flex items-start justify-between gap-2",children:a.jsxs("div",{className:"flex-1",children:[a.jsxs("div",{className:"flex items-center gap-2 mb-1",children:[a.jsx("h4",{className:"text-sm font-semibold text-gray-900",children:i.step}),a.jsxs(se,{variant:"outline",className:me("text-xs",r(i.status)),children:[i.status==="completed"&&"✓ Concluído",i.status==="running"&&"⏳ Em execução",i.status==="failed"&&"✗ Falhou"]}),i.current_step&&a.jsx(se,{variant:"secondary",className:"text-xs",children:i.current_step})]}),i.details&&a.jsx("p",{className:"text-xs text-gray-600 mt-1",children:i.details})]})}),e&&i.code_to_execute&&a.jsxs("div",{className:"mt-2 p-2 bg-gray-50 rounded border border-gray-200",children:[a.jsxs("div",{className:"flex items-center gap-2 mb-1",children:[a.jsx(it,{className:"h-3 w-3 text-gray-500"}),a.jsx("span",{className:"text-xs font-medium text-gray-600",children:"Código:"})]}),a.jsx("code",{className:"text-xs text-gray-700 break-all",children:i.code_to_execute.length>100?`${i.code_to_execute.substring(0,100)}...`:i.code_to_execute})]}),i.strategy&&a.jsx("div",{className:"mt-2",children:a.jsxs(se,{variant:"outline",className:"text-xs",children:["Estratégia: ",i.strategy]})}),i.error&&i.status==="failed"&&a.jsxs("div",{className:"mt-2 p-2 bg-red-50 rounded border border-red-200",children:[a.jsx("p",{className:"text-xs text-red-700 font-medium",children:"Erro:"}),a.jsx("p",{className:"text-xs text-red-600 mt-1",children:i.error})]})]})]})})},l)),a.jsxs("div",{className:"flex items-center gap-2 px-2",children:[a.jsx("div",{className:"flex-1 h-1 bg-gray-200 rounded-full overflow-hidden",children:a.jsx("div",{className:"h-full bg-blue-500 transition-all duration-300",style:{width:`${s.filter(i=>i.status==="completed").length/s.length*100}%`}})}),a.jsxs("span",{className:"text-xs text-gray-500",children:[s.filter(i=>i.status==="completed").length,"/",s.length," concluídos"]})]})]})}const ds=({result:s,onDownload:e,onRetry:t,onDownloadTemplate:r})=>{var b,g;const[o,i]=d.useState(0),[l,v]=d.useState(!0);d.useEffect(()=>{if(s.steps&&s.steps.length>0){const h=setInterval(()=>{i(m=>m<s.steps.length-1?m+1:(v(!1),clearInterval(h),m))},1e3);return()=>clearInterval(h)}},[s.steps]);const u=s.steps?Math.round(o/s.steps.length*100):100;return a.jsxs(Q,{className:"w-full max-w-2xl mx-auto",children:[a.jsxs(Xa,{children:[a.jsxs(Ya,{className:"flex items-center gap-2",children:[s.success?a.jsx(Za,{className:"h-5 w-5 text-green-600"}):a.jsx(Pe,{className:"h-5 w-5 text-red-600"}),a.jsx("span",{className:s.success?"text-green-600":"text-red-600",children:s.success?"Execução Concluída":"Execução Falhou"})]}),a.jsx("p",{className:"text-sm text-gray-600",children:s.message})]}),a.jsxs(K,{className:"space-y-4",children:[a.jsxs("div",{className:"space-y-2",children:[a.jsxs("div",{className:"flex justify-between text-sm",children:[a.jsx("span",{children:"Progresso"}),a.jsxs("span",{children:[u,"%"]})]}),a.jsx(nt,{value:u,className:"h-2"})]}),s.steps&&s.steps.length>0&&a.jsxs("div",{className:"space-y-3",children:[a.jsx("h4",{className:"text-sm font-medium text-gray-700",children:"Etapas de Execução:"}),a.jsx(ls,{steps:s.steps,showCode:!0})]}),s.nextActions&&s.nextActions.length>0&&a.jsxs("div",{className:"space-y-2",children:[a.jsx("h4",{className:"text-sm font-medium text-gray-700",children:"Sugestões:"}),a.jsx("ul",{className:"space-y-1",children:s.nextActions.map((h,m)=>a.jsxs("li",{className:"flex items-center gap-2 text-xs text-gray-600",children:[a.jsx("div",{className:"h-1 w-1 bg-gray-400 rounded-full"}),h]},m))})]}),s.data&&a.jsxs("div",{className:"space-y-2",children:[a.jsx("h4",{className:"text-sm font-medium text-gray-700",children:"Resultado:"}),a.jsx("div",{className:"bg-gray-50 p-3 rounded-lg",children:a.jsx("pre",{className:"text-xs text-gray-600 whitespace-pre-wrap",children:JSON.stringify(s.data,null,2)})})]}),s.diagnosis&&a.jsx("div",{className:"mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200",children:a.jsxs("div",{className:"flex items-start gap-3",children:[a.jsx(Te,{className:"h-5 w-5 text-yellow-600 flex-shrink-0"}),a.jsxs("div",{className:"flex-1 space-y-2",children:[a.jsx("h4",{className:"text-sm font-semibold text-yellow-900",children:"Diagnóstico:"}),a.jsx("p",{className:"text-sm text-yellow-800",children:s.diagnosis.explanation}),s.diagnosis.solutions&&s.diagnosis.solutions.length>0&&a.jsxs("div",{className:"mt-2",children:[a.jsx("p",{className:"text-xs font-medium text-yellow-900 mb-1",children:"Soluções sugeridas:"}),a.jsx("ul",{className:"space-y-1",children:s.diagnosis.solutions.map((h,m)=>a.jsxs("li",{className:"text-xs text-yellow-700 flex items-start gap-2",children:[a.jsx("span",{children:"•"}),a.jsx("span",{children:h})]},m))})]})]})]})}),s.templateCSV&&r&&a.jsxs("div",{className:"mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200",children:[a.jsx("div",{className:"flex items-center justify-between mb-2",children:a.jsxs("div",{className:"flex items-center gap-2",children:[a.jsx(Te,{className:"h-5 w-5 text-blue-600"}),a.jsx("h4",{className:"text-sm font-semibold text-blue-900",children:"Template CSV Gerado"})]})}),a.jsx("p",{className:"text-xs text-blue-700 mb-3",children:"Como o site não pôde ser acessado, geramos um template CSV com dados de exemplo que você pode usar."}),a.jsxs(k,{variant:"outline",size:"sm",onClick:()=>{const h=new Blob([s.templateCSV],{type:"text/csv"}),m=URL.createObjectURL(h),f=document.createElement("a");f.href=m,f.download=`produtos-template-${Date.now()}.csv`,document.body.appendChild(f),f.click(),document.body.removeChild(f),URL.revokeObjectURL(m)},className:"w-full",children:[a.jsx(je,{className:"h-4 w-4 mr-2"}),"Baixar Template CSV"]})]}),a.jsxs("div",{className:"flex gap-2 pt-4",children:[((b=s.data)==null?void 0:b.downloadUrl)&&e&&a.jsxs(k,{onClick:()=>e(s.data.downloadUrl,s.data.fileName),className:"flex-1",children:[a.jsx(je,{className:"h-4 w-4 mr-2"}),"Baixar Arquivo"]}),((g=s.data)==null?void 0:g.url)&&a.jsxs(k,{variant:"outline",onClick:()=>window.open(s.data.url,"_blank"),children:[a.jsx(oe,{className:"h-4 w-4 mr-2"}),"Ver Site"]}),!s.success&&t&&a.jsx(k,{variant:"outline",onClick:t,children:"Tentar Novamente"})]})]})]})},us=({toolName:s,parameters:e,userId:t,conversationId:r,onComplete:o})=>{const[i,l]=d.useState(null),[v,u]=d.useState(!1),[b,g]=d.useState(null),h=async()=>{u(!0),g(null),l(null);try{const{data:m,error:f}=await supabase.functions.invoke("super-ai-tools",{body:{toolName:s,parameters:e,userId:t,conversationId:r}});if(f)throw new Error(f.message);const S=m;l(S),o&&o(S)}catch(m){g(m instanceof Error?m.message:"Erro desconhecido")}finally{u(!1)}};return d.useEffect(()=>{h()},[]),v?a.jsx(Q,{className:"w-full max-w-2xl mx-auto",children:a.jsx(K,{className:"p-6",children:a.jsxs("div",{className:"flex items-center gap-3",children:[a.jsx(re,{className:"h-5 w-5 animate-spin text-blue-600"}),a.jsxs("div",{children:[a.jsxs("h3",{className:"font-medium",children:["Executando ",s]}),a.jsx("p",{className:"text-sm text-gray-600",children:"Processando solicitação..."})]})]})})}):b?a.jsx(Q,{className:"w-full max-w-2xl mx-auto",children:a.jsxs(K,{className:"p-6",children:[a.jsxs("div",{className:"flex items-center gap-3",children:[a.jsx(Pe,{className:"h-5 w-5 text-red-600"}),a.jsxs("div",{children:[a.jsx("h3",{className:"font-medium text-red-600",children:"Erro na Execução"}),a.jsx("p",{className:"text-sm text-gray-600",children:b})]})]}),a.jsx(k,{onClick:h,className:"mt-4",children:"Tentar Novamente"})]})}):i?a.jsx(ds,{result:i,onDownload:(m,f)=>{const S=document.createElement("a");S.href=m,S.download=f,document.body.appendChild(S),S.click(),document.body.removeChild(S)},onRetry:h}):null},ms=`
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
`;class ps{constructor(e){we(this,"userId");this.userId=e}async executeSQL(e){try{if(/DROP|TRUNCATE|DELETE\s+FROM\s+"User"|DELETE\s+FROM\s+"Campaign"/i.test(e))return{success:!1,error:"Query perigosa detectada. Confirmação necessária.",message:"⚠️ Esta query pode ser destrutiva. Por favor, confirme explicitamente."};const{data:r,error:o}=await D.rpc("execute_admin_query",{query_text:e});return o?{success:!1,error:o.message,message:`❌ Erro ao executar SQL: ${o.message}`}:{success:!0,data:r,message:`✅ Query executada com sucesso. ${Array.isArray(r)?r.length:0} registros retornados.`}}catch(t){return{success:!1,error:t.message,message:`❌ Erro: ${t.message}`}}}async analyzeSystem(e,t){try{let r="",o="";switch(e){case"metrics":r=`
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
            WHERE created_at >= NOW() - INTERVAL '${t==="24h"?"1 day":t==="7d"?"7 days":"30 days"}'
          `,o="⚡ Análise de performance";break;case"usage":r=`
            SELECT 
              DATE(created_at) as date,
              COUNT(*) as messages_count
            FROM "ChatMessage"
            WHERE created_at >= NOW() - INTERVAL '${t==="24h"?"1 day":t==="7d"?"7 days":"30 days"}'
            GROUP BY DATE(created_at)
            ORDER BY date DESC
          `,o="📈 Análise de uso";break;case"errors":return{success:!0,data:{errors:0},message:"✅ Sistema de logging de erros a ser implementado"}}const{data:i,error:l}=await D.rpc("execute_admin_query",{query_text:r});if(l)throw l;return{success:!0,data:i,message:`${o} - Período: ${t}`}}catch(r){return{success:!1,error:r.message,message:`❌ Erro ao analisar sistema: ${r.message}`}}}async manageIntegration(e,t,r){try{switch(e){case"test":return{success:!0,message:`🔍 Testando integração com ${t}... (A implementar com APIs reais)`,data:{status:"pending"}};case"connect":const{data:o,error:i}=await D.from("Integration").insert({userId:this.userId,platform:t.toUpperCase(),credentials:r||{},isConnected:!1,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}).select().single();if(i)throw i;return{success:!0,data:o,message:`✅ Integração com ${t} iniciada. Configure as credenciais.`};case"disconnect":return await D.from("Integration").update({isConnected:!1}).eq("platform",t.toUpperCase()).eq("userId",this.userId),{success:!0,message:`✅ Integração com ${t} desconectada.`};default:return{success:!1,error:"Ação desconhecida",message:"❌ Ação não reconhecida"}}}catch(o){return{success:!1,error:o.message,message:`❌ Erro ao gerenciar integração: ${o.message}`}}}async getMetrics(e,t,r){try{let o="",i="*";switch(e){case"users":o="User";break;case"campaigns":o="Campaign";break;case"messages":o="ChatMessage";break;default:return{success:!1,error:"Métrica desconhecida",message:"❌ Métrica não reconhecida"}}const l=`
        SELECT 
          DATE_TRUNC('${r}', created_at) as period,
          ${t==="count"?"COUNT(*)":t==="sum"?"SUM(1)":"AVG(1)"} as value
        FROM "${o}"
        GROUP BY period
        ORDER BY period DESC
        LIMIT 30
      `,{data:v,error:u}=await D.rpc("execute_admin_query",{query_text:l});if(u)throw u;return{success:!0,data:v,message:`📊 Métricas de ${e} agrupadas por ${r}`}}catch(o){return{success:!1,error:o.message,message:`❌ Erro ao obter métricas: ${o.message}`}}}}function gs(s){const e=/```admin-sql\s*\n([\s\S]*?)```/,t=s.match(e);return t?t[1].trim():null}function hs(s){const e=/```admin-analyze\s*\n([\s\S]*?)```/,t=s.match(e);if(!t)return null;try{return JSON.parse(t[1].trim())}catch{return null}}function fs(s){const e=/```admin-integration\s*\n([\s\S]*?)```/,t=s.match(e);if(!t)return null;try{return JSON.parse(t[1].trim())}catch{return null}}function xs(s){const e=/```admin-metrics\s*\n([\s\S]*?)```/,t=s.match(e);if(!t)return null;try{return JSON.parse(t[1].trim())}catch{return null}}function vs(s){return s.replace(/```admin-sql\s*\n[\s\S]*?```/g,"").replace(/```admin-analyze\s*\n[\s\S]*?```/g,"").replace(/```admin-integration\s*\n[\s\S]*?```/g,"").replace(/```admin-metrics\s*\n[\s\S]*?```/g,"").replace(/```admin-logs\s*\n[\s\S]*?```/g,"").replace(/```admin-test-api\s*\n[\s\S]*?```/g,"").replace(/```admin-debug\s*\n[\s\S]*?```/g,"").trim()}const bs={addEmojis:!0,improveMarkdown:!0,removeTechnicalLogs:!0,addSectionDividers:!0};function Ss(s,e={}){const t={...bs,...e};let r=s;return t.removeTechnicalLogs&&(r=Es(r)),t.addEmojis&&(r=As(r)),t.improveMarkdown&&(r=ws(r)),t.addSectionDividers&&(r=ys(r)),r.trim()}function Es(s){let e=s;return e=e.replace(/\{[\s\S]*?"success"[\s\S]*?\}/g,""),e=e.replace(/\{[\s\S]*?"data"[\s\S]*?\}/g,""),e=e.replace(/\{[\s\S]*?"message"[\s\S]*?\}/g,""),e=e.replace(/```json[\s\S]*?```/g,""),e=e.replace(/^\s*"[^"]+"\s*:\s*.+$/gm,""),e=e.replace(/^\s*[\{\}\[\],]\s*$/gm,""),e=e.replace(/^\s*(?:success|message|data|query|provider|results|snippet|url|title|error|status)\s*[:=]/gim,""),e=e.replace(/\*\*Resultados da pesquisa:\*\*[\s\S]*?(?=\n\n|$)/g,""),e=e.replace(/\n{3,}/g,`

`),e.trim()}function As(s){let e=s;return e=e.replace(/\b(sucesso|concluído|pronto|completado|finalizado)\b/gi,"✅ $1"),e=e.replace(/\b(erro|falhou|problema)\b/gi,"❌ $1"),e=e.replace(/\b(importante|atenção|cuidado|aviso)\b/gi,"⚠️ $1"),e=e.replace(/\b(sugestão|dica|ideia)\b/gi,"💡 $1"),e=e.replace(/\[([^\]]+)\]\(http/g,"🔗 [$1](http"),e=e.replace(/\b(download|baixar)\b/gi,"📥 $1"),e=e.replace(/\b(upload|enviar)\b/gi,"📤 $1"),e=e.replace(/\b(arquivo|csv|json|zip)\b/gi,"📄 $1"),e=e.replace(/\b(análise|métricas|dados)\b/gi,"📊 $1"),e=e.replace(/\b(pesquisa|busca|procurar)\b/gi,"🔍 $1"),e=e.replace(/\b(produto|item)\b/gi,"🛍️ $1"),e=e.replace(/\b(preço|valor|R\$)\b/gi,"💰 $1"),e=e.replace(/\b(campanha|anúncio)\b/gi,"🎯 $1"),e=e.replace(/\b(email|e-mail)\b/gi,"📧 $1"),e=e.replace(/\b(alerta|notificação)\b/gi,"🔔 $1"),e=e.replace(/\b(rápido|veloz)\b/gi,"⚡ $1"),e=e.replace(/\b(agendado|cronômetro)\b/gi,"⏰ $1"),e=e.replace(/\b(automação|inteligente|ia)\b/gi,"🤖 $1"),e}function ws(s){let e=s;return e=e.replace(/^(\d+)\.\s+(.+)$/gm,"$1. **$2**"),e=e.replace(/\b(IMPORTANTE|ATENÇÃO|NOTA|OBS|AVISO)\b/g,"**$1**"),e=e.replace(new RegExp("(?<!\\[)(https?:\\/\\/[^\\s]+)(?!\\])","g"),"[Link]($1)"),e=e.replace(/\n(#{1,3}\s+)/g,`

$1`),e=e.replace(/(#{1,3}\s+.+)\n(?!\n)/g,`$1

`),e=e.replace(/^-\s+(.+)$/gm,"• $1"),e}function ys(s){let e=s;return e=e.replace(/\n(##\s+)/g,`
---

$1`),e}function Ns(s){const e=/```integration-connect:(\w+)```/,t=s.match(e);return t?{action:"connect",slug:t[1]}:null}function Cs(s){const e=/```integration-disconnect:(\w+)```/,t=s.match(e);return t?{action:"disconnect",slug:t[1]}:null}function js(s){const e=/```integration-status(?::(\w+))?```/,t=s.match(e);return t?{action:"status",slug:t[1]}:null}function Ts(s){return Ns(s)||Cs(s)||js(s)}function Is(s){return s.replace(/```integration-connect:\w+```/g,"").replace(/```integration-disconnect:\w+```/g,"").replace(/```integration-status(?::\w+)?```/g,"").trim()}const Rs=`
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
`,Ds=`
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
`;class Os{constructor(e){we(this,"userId");this.userId=e}async auditIntegration(e){try{const{data:t,error:r}=await D.from("Integration").select("*").eq("userId",this.userId).eq("platform",e).single();if(r&&r.code!=="PGRST116")throw r;const o=this.getCapabilities(e),i=t&&t.isConnected?"connected":"disconnected",l={platform:e,status:i,lastSync:(t==null?void 0:t.lastSyncAt)||void 0,capabilities:o,issues:this.detectIssues(t,e),recommendations:this.getRecommendations(i,e)};return{success:!0,data:l,message:this.formatAuditMessage(l)}}catch(t){return{success:!1,error:t.message,message:`❌ Erro ao auditar ${e}: ${t.message}`}}}async auditAll(){try{const e=["META_ADS","GOOGLE_ADS","LINKEDIN_ADS","TIKTOK_ADS","TWITTER_ADS"],t=[];for(const r of e){const o=await this.auditIntegration(r);o.success&&o.data&&t.push(o.data)}return{success:!0,data:t,message:this.formatAllAuditsMessage(t)}}catch(e){return{success:!1,error:e.message,message:`❌ Erro ao auditar integrações: ${e.message}`}}}async listStatus(){try{const{data:e,error:t}=await D.from("Integration").select("platform, isConnected, lastSyncAt").eq("userId",this.userId);if(t)throw t;const r=new Map((e==null?void 0:e.map(l=>[l.platform,l]))||[]),i=["META_ADS","GOOGLE_ADS","LINKEDIN_ADS","TIKTOK_ADS","TWITTER_ADS"].map(l=>{var v,u;return{platform:l,status:r.has(l)&&((v=r.get(l))!=null&&v.isConnected)?"✅ Conectada":"❌ Desconectada",lastSync:((u=r.get(l))==null?void 0:u.lastSyncAt)||"Nunca"}});return{success:!0,data:i,message:this.formatStatusList(i)}}catch(e){return{success:!1,error:e.message,message:`❌ Erro ao listar status: ${e.message}`}}}getCapabilities(e){return{META_ADS:["Criar campanhas de Facebook e Instagram","Segmentação avançada de audiência","Análise de performance em tempo real","Otimização automática de orçamento","A/B testing de criativos","Remarketing e lookalike audiences"],GOOGLE_ADS:["Campanhas de Pesquisa (Search)","Anúncios Display e YouTube","Shopping Ads para e-commerce","Campanhas Performance Max","Análise de conversões e ROI","Smart Bidding automático"],LINKEDIN_ADS:["Anúncios B2B segmentados","Targeting por cargo e empresa","Lead Gen Forms nativos","InMail patrocinado","Análise de engajamento profissional","Retargeting de visitantes"],TIKTOK_ADS:["Vídeos In-Feed","TopView e Brand Takeover","Spark Ads (boost orgânico)","Segmentação por interesse e comportamento","Píxel de conversão","Catálogo de produtos"],TWITTER_ADS:["Tweets promovidos","Segmentação por hashtags e interesse","Audiências customizadas","Análise de engajamento","Campanhas de instalação de app","Vídeos e carrosséis"]}[e]||["Capacidades a definir"]}detectIssues(e,t){const r=[];if(!e)return r.push("Integração não configurada"),r;if(e.isConnected||r.push("Integração desconectada - configure credenciais"),(!e.credentials||Object.keys(e.credentials).length===0)&&r.push("Credenciais não configuradas"),e.lastSync){const o=new Date(e.lastSync),i=(Date.now()-o.getTime())/(1e3*60*60);i>24&&r.push(`Última sincronização há ${Math.floor(i)} horas - pode estar desatualizado`)}return r}getRecommendations(e,t){const r=[];return e==="disconnected"&&(r.push(`Conecte ${this.formatPlatformName(t)} em: Configurações → Integrações`),r.push("Configure sua chave de API para começar a usar")),e==="connected"&&(r.push("✅ Integração ativa! Você já pode criar campanhas"),r.push("Explore as capacidades disponíveis desta plataforma")),r}formatPlatformName(e){return{META_ADS:"Meta Ads (Facebook/Instagram)",GOOGLE_ADS:"Google Ads",LINKEDIN_ADS:"LinkedIn Ads",TIKTOK_ADS:"TikTok Ads",TWITTER_ADS:"Twitter Ads (X)"}[e]||e}formatAuditMessage(e){let r=`
**${e.status==="connected"?"✅":"❌"} ${this.formatPlatformName(e.platform)}**
`;return r+=`Status: ${e.status==="connected"?"✅ Conectada":"❌ Desconectada"}
`,e.lastSync&&(r+=`Última sincronização: ${e.lastSync}
`),r+=`
**Capacidades:**
`,e.capabilities.forEach(o=>{r+=`• ${o}
`}),e.issues&&e.issues.length>0&&(r+=`
**⚠️ Problemas detectados:**
`,e.issues.forEach(o=>{r+=`• ${o}
`})),e.recommendations&&e.recommendations.length>0&&(r+=`
**💡 Recomendações:**
`,e.recommendations.forEach(o=>{r+=`• ${o}
`})),r}formatAllAuditsMessage(e){let t=`
# 🔍 AUDITORIA COMPLETA DE INTEGRAÇÕES

`;const r=e.filter(i=>i.status==="connected").length,o=e.length;return t+=`**Resumo:** ${r}/${o} integrações ativas

`,t+=`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`,e.forEach(i=>{t+=this.formatAuditMessage(i),t+=`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`}),r<o?(t+=`
**🎯 Próximos Passos:**
`,t+=`1. Conecte as ${o-r} integrações pendentes
`,t+=`2. Configure suas chaves de API
`,t+=`3. Teste cada integração antes de criar campanhas
`):t+=`
**🎉 Parabéns!** Todas as integrações estão configuradas e funcionando!
`,t}formatStatusList(e){let t=`
**📊 Status das Integrações:**

`;return e.forEach(r=>{t+=`${r.status} **${this.formatPlatformName(r.platform)}**
`,t+=`   └─ Última sync: ${r.lastSync}

`}),t}}function ks(s){const e=/```integration-action\s*\n([\s\S]*?)```/,t=s.match(e);if(!t)return null;try{return JSON.parse(t[1].trim())}catch{return null}}function Ps(s){return s.replace(/```integration-action\s*\n[\s\S]*?```/g,"").trim()}function Ms(s,e){const t=s.toLowerCase(),r=e.toLowerCase(),o=(t.includes("auditor")||t.includes("verificar")||t.includes("status")||t.includes("listar"))&&(t.includes("integra")||t.includes("conex")||t.includes("plataforma")),i=r.includes("vou")&&(r.includes("auditor")||r.includes("verificar"));if(!o||!i)return null;const l={facebook:"META_ADS",instagram:"META_ADS",meta:"META_ADS",google:"GOOGLE_ADS",linkedin:"LINKEDIN_ADS",tiktok:"TIKTOK_ADS",twitter:"TWITTER_ADS"};for(const[v,u]of Object.entries(l))if(t.includes(v))return{action:"audit",platform:u};return{action:"audit_all"}}const _s=["Criar campanha de Facebook Ads","Analisar performance da última semana","Sugerir otimizações"],ue=500,ar=()=>{const[s,e]=d.useState(""),[t,r]=d.useState(!0),[o,i]=d.useState(null),[l,v]=d.useState(!1),[u,b]=d.useState([]),[g,h]=d.useState(""),[m,f]=d.useState([]),[S,I]=d.useState([]),[j,L]=d.useState([]),[w,C]=d.useState(null),[q,P]=d.useState(""),[G,Y]=d.useState([]),[fe,Le]=d.useState(!1),[Ls,ha]=d.useState(null),xe=d.useRef(null),ve=d.useRef([]),x=Ve(n=>n.user),qe=Ve(n=>n.isAuthenticated),$e=Ja(),be=U(n=>n.conversations),R=U(n=>n.activeConversationId),Se=U(n=>n.setActiveConversationId),ie=U(n=>n.isAssistantTyping),ze=U(n=>n.setAssistantTyping),X=U(n=>n.addMessage);U(n=>n.deleteConversation),U(n=>n.createNewConversation);const fa=et(n=>n.addCampaign),xa=Ye(n=>n.aiSystemPrompt),va=Ye(n=>n.aiInitialGreetings),Ge=d.useRef(null),Fe=d.useRef(null),ba=n=>{let c=n.replace(/\{[^{}]*"success"[^{}]*\}/g,"");return c=c.replace(/\*\*Resultados da pesquisa:\*\*[^]*?(?=\n\n|$)/g,""),c=c.replace(/\{\s*\n\s*"[^"]+"\s*:[^}]+\}/g,""),c=c.replace(/^\s*"?(success|message|data|query|provider|results|snippet|url|title)"?\s*:/gm,""),c=c.replace(/^\s*[\{\}\[\],]\s*$/gm,""),c=c.replace(/\n{3,}/g,`

`),c.trim()},Sa=async(n,c,p)=>{const E=`msg-${Date.now()+1}`;let A="";X(n,c,{id:E,role:"assistant",content:""});const M=p.split(" "),$=2;for(let T=0;T<M.length;T+=$){const F=M.slice(T,T+$).join(" ");A+=(T>0?" ":"")+F,X(n,c,{id:E,role:"assistant",content:A}),await new Promise(Z=>setTimeout(Z,20))}X(n,c,{id:E,role:"assistant",content:p})},{toast:y}=at(),V=be.find(n=>n.id===R);d.useEffect(()=>{(!qe||!x)&&(console.warn("⚠️ Usuário não autenticado, redirecionando para login..."),$e("/login",{replace:!0}))},[qe,x,$e]);const Ea=()=>{var n;(n=Ge.current)==null||n.scrollIntoView({behavior:"smooth"})};d.useEffect(Ea,[V==null?void 0:V.messages,ie]),d.useEffect(()=>{(async()=>{if(x)try{const{data:c,error:p}=await D.from("GlobalAiConnection").select("id, systemPrompt, initialGreetings").eq("isActive",!0).limit(1).single();if(p){console.error("Erro ao buscar IA:",p);return}const E=c==null?void 0:c.id;if(E){const{data:A,error:M}=await D.from("GlobalAiConnection").select("systemPrompt, initialGreetings").eq("id",E).single();if(M){console.error("Erro ao buscar config da IA:",M);return}A&&i({systemPrompt:A.systemPrompt||xa,initialGreetings:A.initialGreetings||va})}}catch(c){console.error("Erro ao carregar IA Global:",c)}})()},[x==null?void 0:x.id]),d.useEffect(()=>{if(V&&V.messages.length===0){const n=ss();setTimeout(()=>{x&&X(x.id,R,{id:`greeting-${Date.now()}`,role:"assistant",content:n})},500)}},[R,V==null?void 0:V.messages.length]);const Aa=n=>{const c=/ZIP_DOWNLOAD:\s*({[^}]+})/g,p=n.match(c);return p&&p.forEach(E=>{try{const A=E.replace("ZIP_DOWNLOAD:","").trim(),M=JSON.parse(A);I($=>[...$,M])}catch(A){console.error("Erro ao processar download ZIP:",A)}}),n.replace(c,"").trim()},wa=n=>{const c=/SUPER_AI_EXECUTION:\s*({[^}]+})/g,p=n.match(c);return p&&p.forEach(E=>{try{const A=E.replace("SUPER_AI_EXECUTION:","").trim(),M=JSON.parse(A);L($=>[...$,M])}catch(A){console.error("Erro ao processar execução Super AI:",A)}}),n.replace(c,"").trim()},Ee=async()=>{if(s.trim()===""||!R||s.length>ue)return;const n=s,c=n.toLowerCase();if(c.includes("pesquis")||c.includes("busca")||c.includes("google")||c.includes("internet")){C("web_search");let p=n;if(c.includes("pesquis")){const E=n.match(/pesquis[ae]\s+(.+)/i);p=E?E[1]:n}P(`Pesquisando na web sobre: "${p}"`),Y(["Google Search","Exa AI","Tavily"])}else if(c.includes("baix")||c.includes("rasp")||c.includes("scrape")){C("web_scraping");const p=n.match(/https?:\/\/[^\s]+/i);P(p?`Raspando dados de: ${p[0]}`:"Raspando dados...")}else c.includes("python")||c.includes("calcule")||c.includes("execute código")?(C("python_exec"),P("Executando código Python para processar dados...")):(C(null),P("Processando sua solicitação..."),Y([]));x&&X(x.id,R,{id:`msg-${Date.now()}`,role:"user",content:n}),e(""),r(!1),ze(!0);try{const p=be.find(N=>N.id===R),E=(o==null?void 0:o.systemPrompt)||ts,A=ms+`

`+Jt+`

`+Rs+`

`+Ds+`

`+E,M=((p==null?void 0:p.messages)||[]).slice(-20).map(N=>({role:N.role,content:N.content})),T=(await st(n,R,M,A)).response,F=es(T);if(F)try{x&&(await fa(x.id,{name:F.data.name,platform:F.data.platform,status:"Pausada",budgetTotal:F.data.budgetTotal,budgetSpent:0,impressions:0,clicks:0,conversions:0,startDate:F.data.startDate,endDate:F.data.endDate||"",ctr:0,cpc:0}),y({title:"🎉 Campanha Criada!",description:`A campanha "${F.data.name}" foi criada com sucesso.`}))}catch(N){console.error("Error creating campaign from AI:",N),y({title:"Erro ao criar campanha",description:"Não foi possível criar a campanha automaticamente.",variant:"destructive"})}let Z="";if(x){const N=new ps(x.id),B=gs(T);if(B){const O=await N.executeSQL(B);y({title:O.success?"✅ SQL Executado":"❌ Erro SQL",description:O.message,variant:O.success?"default":"destructive"})}const te=hs(T);if(te){const O=await N.analyzeSystem(te.type,te.period);y({title:O.success?"📊 Análise Concluída":"❌ Erro",description:O.message,variant:O.success?"default":"destructive"})}const ce=fs(T);if(ce){const O=await N.manageIntegration(ce.action,ce.platform,ce.credentials);y({title:O.success?"🔗 Integração Atualizada":"❌ Erro",description:O.message,variant:O.success?"default":"destructive"})}const le=xs(T);if(le){const O=await N.getMetrics(le.metric,le.aggregation,le.groupBy);y({title:O.success?"📈 Métricas Obtidas":"❌ Erro",description:O.message,variant:O.success?"default":"destructive"})}let J=ks(T);if(J||(J=Ms(n,T)),J){const O=new Os(x.id);let H;switch(J.action){case"audit":J.platform&&(H=await O.auditIntegration(J.platform));break;case"audit_all":H=await O.auditAll();break;case"list_status":H=await O.listStatus();break;case"test":case"capabilities":case"diagnose":H={success:!0,message:`Ação "${J.action}" detectada. Implementação em andamento.`};break}H&&(Z=`

`+H.message,y({title:H.success?"✅ Ação Executada":"❌ Erro",description:H.success?"Auditoria concluída com sucesso":H.error||"Erro ao executar ação",variant:H.success?"default":"destructive"}))}}const z=Ts(T);if(z&&x)try{if(z.action==="connect"){const{authUrl:N}=await de.generateOAuthUrl(z.slug,x.id),B=Ne[z.slug];x&&X(x.id,R,{id:`msg-${Date.now()+1}`,role:"assistant",content:`Para conectar ${B.name}, clique no link abaixo:

🔗 [Autorizar ${B.name}](${N})

O link abrirá em uma nova aba para você autorizar o acesso.`}),window.open(N,"_blank"),y({title:"🔗 Link de Autorização",description:`Clique no link para conectar ${B.name}`});return}else if(z.action==="disconnect"){await de.disconnect(x.id,z.slug);const N=Ne[z.slug];y({title:"✅ Desconectado",description:`${N.name} foi desconectado com sucesso.`})}else if(z.action==="status")if(z.slug){const N=await de.getIntegrationStatus(x.id,z.slug),B=Ne[z.slug];y({title:`${B.name}`,description:N!=null&&N.isConnected?"✅ Conectado":"❌ Não conectado"})}else{const N=await de.listIntegrations(x.id),B=N.filter(te=>te.isConnected).length;y({title:"📊 Status das Integrações",description:`${B} de ${N.length} integrações conectadas`})}}catch(N){console.error("Erro ao processar integração:",N),x&&X(x.id,R,{id:`msg-${Date.now()+2}`,role:"assistant",content:`❌ **Erro ao conectar integração**

${N.message||"Erro ao processar comando de integração"}`}),y({title:"❌ Erro na Integração",description:"Verifique as instruções no chat",variant:"destructive"})}let Ae=Aa(T);Ae=wa(Ae);let W=as(Ae);W=vs(W),W=Is(W),W=Ps(W),W=ba(W);const Oa=Ss(W+Z,{addEmojis:!0,improveMarkdown:!0,removeTechnicalLogs:!0,addSectionDividers:!1});x&&await Sa(x.id,R,Oa)}catch(p){console.error("Erro ao chamar IA:",p),y({title:"Erro ao gerar resposta",description:p.message||"Não foi possível obter resposta da IA. Verifique sua chave de API.",variant:"destructive"}),x&&X(x.id,R,{id:`msg-${Date.now()+1}`,role:"assistant",content:"❌ Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, verifique se sua chave de API está configurada corretamente nas configurações."})}finally{ze(!1)}},ya=n=>{e(n)},Na=()=>{var n;(n=Fe.current)==null||n.click()},Ca=async()=>{try{const n=await navigator.mediaDevices.getUserMedia({audio:!0}),c=new MediaRecorder(n);xe.current=c,ve.current=[],c.ondataavailable=p=>{p.data.size>0&&ve.current.push(p.data)},c.onstop=async()=>{const p=new Blob(ve.current,{type:"audio/webm"});ha(p),await Ta(p),n.getTracks().forEach(E=>E.stop())},c.start(),Le(!0),y({title:"🎤 Gravando...",description:"Clique novamente para parar e enviar."})}catch(n){console.error("Erro ao iniciar gravação:",n),y({title:"❌ Erro",description:"Não foi possível acessar o microfone.",variant:"destructive"})}},ja=()=>{xe.current&&fe&&(xe.current.stop(),Le(!1))},Ta=async n=>{if(!(!x||!R))try{y({title:"📤 Enviando áudio...",description:"Aguarde..."});const c=new File([n],`audio-${Date.now()}.webm`,{type:"audio/webm"}),p=`${x.id}/audio-${Date.now()}-${Math.random().toString(36).substring(7)}.webm`,{data:E,error:A}=await D.storage.from("chat-attachments").upload(p,c,{cacheControl:"3600",upsert:!1});if(A)throw A;const{data:{publicUrl:M}}=D.storage.from("chat-attachments").getPublicUrl(p),$=`[🎤 Mensagem de áudio](${M})`;e(T=>T?`${T}

${$}`:$),y({title:"✅ Áudio enviado!",description:"O áudio foi adicionado à mensagem."})}catch(c){console.error("Erro ao enviar áudio:",c),y({title:"❌ Erro",description:"Não foi possível enviar o áudio.",variant:"destructive"})}},Ia=async n=>{var p;const c=(p=n.target.files)==null?void 0:p[0];if(!(!c||!x||!R))try{y({title:"📤 Upload iniciado",description:`Enviando "${c.name}"...`});const E=c.name.split(".").pop(),A=`${x.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${E}`,{data:M,error:$}=await D.storage.from("chat-attachments").upload(A,c,{cacheControl:"3600",upsert:!1});if($)throw $;const{data:{publicUrl:T}}=D.storage.from("chat-attachments").getPublicUrl(A),{error:F}=await D.from("ChatAttachment").insert({messageId:"",fileName:c.name,fileType:c.type,fileUrl:T,fileSize:c.size});F&&console.error("Erro ao salvar anexo:",F);const Z=c.type.startsWith("image/")?`![${c.name}](${T})`:`[${c.name}](${T})`,z=s?`${s}

${Z}`:Z;e(""),z.trim()&&R&&Ee(),y({title:"✅ Arquivo enviado!",description:`${c.name} foi enviado com sucesso.`})}catch(E){console.error("Erro ao fazer upload:",E),y({title:"❌ Erro ao enviar arquivo",description:E.message||"Não foi possível enviar o arquivo.",variant:"destructive"})}finally{n.target&&(n.target.value="")}},Ra=async n=>{try{const{data:c,error:p}=await D.from("ChatMessage").select("id, role, content, createdAt").eq("conversationId",n).order("createdAt",{ascending:!0});if(p)throw p;const E=(c||[]).map(A=>({id:A.id,role:A.role,content:A.content,timestamp:new Date(A.createdAt)}));U.getState().setConversationMessages(n,E),Se(n),console.log(`✅ ${E.length} mensagens carregadas da conversa ${n}`)}catch(c){console.error("Erro ao carregar mensagens:",c),y({title:"Erro",description:"Não foi possível carregar mensagens.",variant:"destructive"})}};d.useEffect(()=>{(async()=>{if(!x)return;await U.getState().loadConversations(x.id);const{data:c}=await D.from("ChatConversation").select("id").eq("userId",x.id).limit(1);(!c||c.length===0)&&await Ue()})()},[x]);const Ue=async()=>{try{if(!x)return;const n=crypto.randomUUID(),c=new Date().toISOString(),{error:p}=await D.from("ChatConversation").insert({id:n,userId:x.id,title:"🆕 Nova Conversa",createdAt:c,updatedAt:c});if(p)throw p;Se(n),await U.getState().loadConversations(x.id),y({title:"✅ Nova conversa criada!",description:"Comece um novo chat do zero."})}catch(n){console.error("Erro ao criar nova conversa:",n),y({title:"Erro",description:n.message||"Não foi possível criar nova conversa.",variant:"destructive"})}},Da=async n=>{try{await D.from("ChatMessage").delete().eq("conversationId",n);const{error:c}=await D.from("ChatConversation").delete().eq("id",n);if(c)throw c;R===n&&Se(null),await U.getState().loadConversations(x.id),y({title:"🗑️ Conversa deletada",description:"A conversa foi removida com sucesso."})}catch(c){console.error("Erro ao deletar conversa:",c),y({title:"Erro",description:"Não foi possível deletar a conversa.",variant:"destructive"})}};return a.jsxs("div",{className:"h-[calc(100vh-80px)] flex flex-col md:flex-row",children:[a.jsxs("div",{className:`${t?"fixed md:relative inset-0 md:inset-auto w-full md:w-72 z-50 md:z-auto":"hidden md:w-0"} transition-all duration-300 bg-gray-50 md:border-r border-gray-200 flex flex-col overflow-hidden`,children:[a.jsxs("div",{className:"p-4 border-b border-gray-200",children:[a.jsxs("div",{className:"flex items-center justify-between mb-3",children:[a.jsx("h2",{className:"text-sm font-semibold text-gray-700",children:"Conversas"}),a.jsx(k,{onClick:()=>r(!1),variant:"ghost",size:"sm",className:"h-7 w-7 p-0",children:a.jsx(Be,{className:"h-4 w-4"})})]}),a.jsxs(k,{onClick:Ue,className:"w-full gap-2",size:"sm",children:[a.jsx(dt,{className:"h-4 w-4"}),"Nova Conversa"]})]}),a.jsx("div",{className:"flex-1 overflow-y-auto p-2 space-y-1",children:be.map(n=>a.jsxs("div",{className:`group relative flex items-center gap-2 p-3 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors ${R===n.id?"bg-blue-50 border border-blue-200":"bg-white"}`,onClick:()=>{R!==n.id&&Ra(n.id)},children:[a.jsx(ut,{className:"h-4 w-4 text-gray-500 flex-shrink-0"}),a.jsxs("div",{className:"flex-1 min-w-0",children:[a.jsx("p",{className:"text-sm font-medium text-gray-900 truncate",children:n.title}),a.jsx("p",{className:"text-xs text-gray-500 truncate",children:n.messages&&n.messages.length>0?n.messages[n.messages.length-1].content.substring(0,50)+"...":"Sem mensagens ainda"})]}),a.jsx(k,{onClick:c=>{c.stopPropagation(),Da(n.id)},variant:"ghost",size:"sm",className:"h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity",children:a.jsx(mt,{className:"h-3.5 w-3.5 text-red-500"})})]},n.id))})]}),a.jsxs("div",{className:"flex-1 flex flex-col min-w-0 w-full",children:[a.jsx("div",{className:"border-b border-gray-200 bg-white/80 backdrop-blur-xl p-3 md:p-4",children:a.jsxs("div",{className:"flex items-center justify-between gap-2",children:[a.jsxs("div",{className:"flex items-center gap-3",children:[a.jsx(k,{onClick:()=>r(!t),variant:"ghost",size:"sm",className:"h-8 w-8 md:h-9 md:w-9 p-0 flex-shrink-0",children:t?a.jsx(Be,{className:"h-4 w-4 md:h-5 md:w-5"}):a.jsx(tt,{className:"h-4 w-4 md:h-5 md:w-5"})}),a.jsx("div",{className:"p-1.5 sm:p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500",children:a.jsx(ye,{className:"h-4 w-4 sm:h-6 sm:w-6 text-white"})}),a.jsxs("div",{children:[a.jsx("h1",{className:"text-base sm:text-xl font-bold text-gray-900",children:"Chat com IA"}),a.jsx("p",{className:"text-xs sm:text-sm text-gray-500",children:"Assistente inteligente"})]})]}),a.jsxs(se,{className:"bg-gradient-to-r from-green-500 to-emerald-500 text-xs sm:text-sm",children:[a.jsx(pt,{className:"h-3 w-3 mr-1"}),"Online"]})]})}),a.jsx("div",{className:"flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4 overscroll-contain",children:V?a.jsxs(a.Fragment,{children:[(l||u.length>0)&&a.jsx(rs,{isSearching:l,searchResults:u,searchQuery:g}),m.length>0&&a.jsx(os,{sources:m,isSearching:l}),S.length>0&&a.jsx("div",{className:"mb-4",children:a.jsx(cs,{downloads:S})}),j.length>0&&a.jsx("div",{className:"mb-4 space-y-4",children:j.map((n,c)=>a.jsx(us,{toolName:n.toolName,parameters:n.parameters,userId:(x==null?void 0:x.id)||"",conversationId:R||"",onComplete:p=>{console.log("Execução Super AI concluída:",p)}},c))}),V.messages.map(n=>{var p;const c=(p=n.content)==null?void 0:p.match(/INTEGRATION_CONNECT:(\w+):([^🔗]+)/);if(c&&n.role==="assistant"){const[,E,A]=c,M=n.content.replace(/🔗 \*\*INTEGRATION_CONNECT:[^🔗]+🔗\*\* 🔗\n\n/,"");return a.jsx("div",{className:"flex justify-start",children:a.jsxs("div",{className:"max-w-[80%]",children:[a.jsx(Q,{className:"bg-white mb-2",children:a.jsx(K,{className:"p-4",children:a.jsxs("div",{className:"flex items-start gap-2",children:[a.jsx(ye,{className:"h-5 w-5 text-blue-600 mt-1 flex-shrink-0"}),a.jsx("div",{className:"flex-1 whitespace-pre-wrap break-words text-sm text-gray-900",children:M})]})})}),a.jsx(ns,{platform:E,platformName:A.trim(),onSkip:()=>{console.log("Conexão pulada:",E)},onSuccess:()=>{console.log("Conectado com sucesso:",E)}})]})},n.id)}return a.jsx("div",{className:`flex ${n.role==="user"?"justify-end":"justify-start"} mb-3`,children:a.jsx(Q,{className:`w-full max-w-[90%] sm:max-w-[85%] md:max-w-[75%] lg:max-w-[70%] ${n.role==="user"?"bg-gradient-to-r from-blue-500 to-purple-500 text-white":"bg-white"}`,children:a.jsxs(K,{className:"p-3 md:p-4",children:[a.jsxs("div",{className:"flex items-start gap-2",children:[n.role==="assistant"&&a.jsx(ye,{className:"h-4 w-4 md:h-5 md:w-5 text-blue-600 mt-0.5 flex-shrink-0"}),a.jsx("div",{className:`flex-1 whitespace-pre-wrap break-words text-sm md:text-base ${n.role==="user"?"text-white":"text-gray-900"}`,style:{wordBreak:"break-word",overflowWrap:"anywhere",maxWidth:"100%"},children:n.content})]}),a.jsx("div",{className:`text-xs mt-2 ${n.role==="user"?"text-white/70":"text-gray-500"}`,children:n.timestamp?new Date(n.timestamp).toLocaleTimeString("pt-BR"):""})]})})},n.id)}),ie&&a.jsx(ct,{isThinking:ie,currentTool:w,reasoning:q,sources:G,status:"thinking"}),ie&&a.jsx("div",{className:"flex justify-start",children:a.jsx(Q,{className:"bg-white",children:a.jsx(K,{className:"p-4",children:a.jsxs("div",{className:"flex items-center gap-2",children:[a.jsx(re,{className:"h-4 w-4 animate-spin text-blue-600"}),a.jsx("span",{className:"text-sm text-gray-500",children:"Processando..."})]})})})}),a.jsx("div",{ref:Ge})]}):a.jsx("div",{className:"flex items-center justify-center h-full text-muted-foreground",children:a.jsx("p",{children:"Selecione ou crie uma conversa para começar."})})}),a.jsxs("div",{className:"border-t border-gray-200 p-3 md:p-4 bg-white/80 backdrop-blur-xl flex-shrink-0",children:[a.jsx("div",{className:"hidden sm:flex gap-2 mb-2",children:_s.map(n=>a.jsx(k,{variant:"outline",size:"sm",onClick:()=>ya(n),className:"text-xs",children:n},n))}),a.jsxs("div",{className:"relative",children:[a.jsx(Ot,{value:s,onChange:n=>e(n.target.value),onKeyDown:n=>{n.key==="Enter"&&!n.shiftKey&&window.innerWidth>768&&(n.preventDefault(),Ee())},placeholder:"Digite sua mensagem...",className:"w-full resize-none rounded-lg border bg-background p-3 pr-20 md:pr-24 min-h-[44px] md:min-h-[48px] text-sm md:text-base",minRows:1,maxRows:window.innerWidth<768?3:5,maxLength:ue}),a.jsxs("div",{className:"absolute right-2 top-1/2 -translate-y-1/2 flex gap-1",children:[a.jsx("input",{type:"file",ref:Fe,onChange:Ia,className:"hidden"}),a.jsx(Ze,{children:a.jsxs(Je,{children:[a.jsx(ea,{asChild:!0,children:a.jsx(k,{type:"button",size:"icon",variant:"ghost",onClick:Na,className:"h-8 w-8 md:h-9 md:w-9 flex-shrink-0 touch-manipulation",children:a.jsx(ht,{className:"h-4 w-4"})})}),a.jsx(Oe,{children:"Anexar arquivo"})]})}),a.jsx(Ze,{children:a.jsxs(Je,{children:[a.jsx(ea,{asChild:!0,children:a.jsx(k,{type:"button",size:"icon",variant:"ghost",onClick:fe?ja:Ca,disabled:!R,className:`h-8 w-8 md:h-9 md:w-9 flex-shrink-0 touch-manipulation ${fe?"text-red-500 animate-pulse":""}`,children:a.jsx(gt,{className:"h-4 w-4"})})}),a.jsx(Oe,{children:"Gravar áudio"})]})}),a.jsx(k,{type:"submit",size:"icon",onClick:Ee,disabled:s.trim()===""||!R,className:"h-8 w-8 md:h-9 md:w-9 flex-shrink-0 touch-manipulation",children:a.jsx(rt,{className:"h-4 w-4"})})]})]}),a.jsxs("p",{className:me("text-xs text-right mt-1",s.length>ue?"text-destructive":"text-muted-foreground"),children:[s.length," / ",ue]})]})]})]})};export{ar as default};
