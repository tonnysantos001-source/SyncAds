var Pa=Object.defineProperty;var Ma=(s,e,t)=>e in s?Pa(s,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):s[e]=t;var ye=(s,e,t)=>Ma(s,typeof e!="symbol"?e+"":e,t);import{c as ke,r as d,R as Ce,o as _a,p as La,q as $a,j as a,t as qa,v as sa,w as za,x as Ga,y as Fa,z as ra,A as Ua,P as Va,D as ee,E as Ba,F as Ha,G as Wa,H as Qa,J as Ka,K as Xa,M as pe,S as oa,N as re,g as Q,l as K,B as M,s as O,n as se,h as Ja,i as Ya,O as Za,u as Be,e as et,Q as V,T as at,f as tt,X as He,U as st,a as we,V as rt}from"./index-B2VcLWXW.js";import{G as na,S as ot}from"./send-Ds_PoC8D.js";import{E as oe}from"./external-link-CiI4pokU.js";import{C as nt}from"./clock-ADBabFPK.js";import{D as je}from"./download-pAem0Eea.js";import{P as it}from"./progress-BBRwJh26.js";import{C as ct,A as lt}from"./AiThinkingIndicator-6tP0Z-LH.js";import{C as Te}from"./circle-alert-D6RF7zcy.js";import{C as Pe}from"./circle-x-CipcTHU3.js";import{C as dt}from"./circle-check-BJ-SXVRX.js";import{i as ue,I as Ne}from"./integrationsService-Cw_OlzM5.js";import{P as ut}from"./plus-Dx6_hzQp.js";import{M as mt}from"./message-square-DoBPn5vY.js";import{T as pt}from"./trash-2-79FKBJN1.js";import{S as gt}from"./sparkles-C2tiY7MB.js";/**
 * @license lucide-react v0.417.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ia=ke("FileArchive",[["path",{d:"M10 12v-1",key:"v7bkov"}],["path",{d:"M10 18v-2",key:"1cjy8d"}],["path",{d:"M10 7V6",key:"dljcrl"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M15.5 22H18a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v16a2 2 0 0 0 .274 1.01",key:"gkbcor"}],["circle",{cx:"10",cy:"20",r:"2",key:"1xzdoj"}]]);/**
 * @license lucide-react v0.417.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ht=ke("Mic",[["path",{d:"M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z",key:"131961"}],["path",{d:"M19 10v2a7 7 0 0 1-14 0v-2",key:"1vc78b"}],["line",{x1:"12",x2:"12",y1:"19",y2:"22",key:"x3vr5v"}]]);/**
 * @license lucide-react v0.417.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ft=ke("Paperclip",[["path",{d:"m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48",key:"1u3ebp"}]]);function Ie(){return Ie=Object.assign?Object.assign.bind():function(s){for(var e=1;e<arguments.length;e++){var t=arguments[e];for(var r in t)({}).hasOwnProperty.call(t,r)&&(s[r]=t[r])}return s},Ie.apply(null,arguments)}function xt(s,e){if(s==null)return{};var t={};for(var r in s)if({}.hasOwnProperty.call(s,r)){if(e.indexOf(r)!==-1)continue;t[r]=s[r]}return t}var vt=d.useLayoutEffect,bt=function(e){var t=Ce.useRef(e);return vt(function(){t.current=e}),t},We=function(e,t){if(typeof e=="function"){e(t);return}e.current=t},St=function(e,t){var r=Ce.useRef();return Ce.useCallback(function(n){e.current=n,r.current&&We(r.current,null),r.current=t,t&&We(t,n)},[t])},Qe={"min-height":"0","max-height":"none",height:"0",visibility:"hidden",overflow:"hidden",position:"absolute","z-index":"-1000",top:"0",right:"0",display:"block"},At=function(e){Object.keys(Qe).forEach(function(t){e.style.setProperty(t,Qe[t],"important")})},Ke=At,L=null,Xe=function(e,t){var r=e.scrollHeight;return t.sizingStyle.boxSizing==="border-box"?r+t.borderSize:r-t.paddingSize};function Et(s,e,t,r){t===void 0&&(t=1),r===void 0&&(r=1/0),L||(L=document.createElement("textarea"),L.setAttribute("tabindex","-1"),L.setAttribute("aria-hidden","true"),Ke(L)),L.parentNode===null&&document.body.appendChild(L);var n=s.paddingSize,i=s.borderSize,l=s.sizingStyle,b=l.boxSizing;Object.keys(l).forEach(function(p){var x=p;L.style[x]=l[x]}),Ke(L),L.value=e;var u=Xe(L,s);L.value=e,u=Xe(L,s),L.value="x";var S=L.scrollHeight-n,h=S*t;b==="border-box"&&(h=h+n+i),u=Math.max(h,u);var f=S*r;return b==="border-box"&&(f=f+n+i),u=Math.min(f,u),[u,S]}var Je=function(){},yt=function(e,t){return e.reduce(function(r,n){return r[n]=t[n],r},{})},wt=["borderBottomWidth","borderLeftWidth","borderRightWidth","borderTopWidth","boxSizing","fontFamily","fontSize","fontStyle","fontWeight","letterSpacing","lineHeight","paddingBottom","paddingLeft","paddingRight","paddingTop","tabSize","textIndent","textRendering","textTransform","width","wordBreak","wordSpacing","scrollbarGutter"],Nt=!!document.documentElement.currentStyle,Ct=function(e){var t=window.getComputedStyle(e);if(t===null)return null;var r=yt(wt,t),n=r.boxSizing;if(n==="")return null;Nt&&n==="border-box"&&(r.width=parseFloat(r.width)+parseFloat(r.borderRightWidth)+parseFloat(r.borderLeftWidth)+parseFloat(r.paddingRight)+parseFloat(r.paddingLeft)+"px");var i=parseFloat(r.paddingBottom)+parseFloat(r.paddingTop),l=parseFloat(r.borderBottomWidth)+parseFloat(r.borderTopWidth);return{sizingStyle:r,paddingSize:i,borderSize:l}},jt=Ct;function Me(s,e,t){var r=bt(t);d.useLayoutEffect(function(){var n=function(l){return r.current(l)};if(s)return s.addEventListener(e,n),function(){return s.removeEventListener(e,n)}},[])}var Tt=function(e,t){Me(document.body,"reset",function(r){e.current.form===r.target&&t(r)})},It=function(e){Me(window,"resize",e)},Rt=function(e){Me(document.fonts,"loadingdone",e)},Ot=["cacheMeasurements","maxRows","minRows","onChange","onHeightChange"],Dt=function(e,t){var r=e.cacheMeasurements,n=e.maxRows,i=e.minRows,l=e.onChange,b=l===void 0?Je:l,u=e.onHeightChange,S=u===void 0?Je:u,h=xt(e,Ot),f=h.value!==void 0,p=d.useRef(null),x=St(p,t),A=d.useRef(0),I=d.useRef(),T=function(){var j=p.current,q=r&&I.current?I.current:jt(j);if(q){I.current=q;var _=Et(q,j.value||j.placeholder||"x",i,n),U=_[0],J=_[1];A.current!==U&&(A.current=U,j.style.setProperty("height",U+"px","important"),S(U,{rowHeight:J}))}},$=function(j){f||T(),b(j)};return d.useLayoutEffect(T),Tt(p,function(){if(!f){var w=p.current.value;requestAnimationFrame(function(){var j=p.current;j&&w!==j.value&&T()})}}),It(T),Rt(T),d.createElement("textarea",Ie({},h,{onChange:$,ref:x}))},kt=d.forwardRef(Dt);const Pt={emailSummary:!0,emailAlerts:!0,emailNews:!1,pushMentions:!0,pushIntegrations:!1,pushSuggestions:!0},Ye=_a()(La(s=>({aiSystemPrompt:"Você é o SyncAds AI, um assistente de marketing digital especializado em otimização de campanhas. Seja proativo, criativo e forneça insights baseados em dados. Suas respostas devem ser claras, concisas e sempre focadas em ajudar o usuário a atingir seus objetivos de marketing.",aiInitialGreetings:["Show, chegou no lugar certo. Eu automatizo o que os outros demoram três reuniões pra entender. O que a gente vai otimizar hoje?","Relaxa, aqui não tem blá-blá-blá. Só plano, execução e conversão. Passa o produto e o público.","Beleza. Eu sou o motor que transforma tentativa em lucro. Quer começar pequeno ou já quer escalar até o servidor pedir arrego?","Ótimo. Se você quiser aula, vai pro YouTube. Se quiser dinheiro rodando, me dá os dados e deixa eu fazer o estrago.","Ah, ótimo… mais um querendo vender antes de entender o jogo. Respira. Me diz o produto — eu transformo tua ideia num motivo pra alguém gastar dinheiro agora.","Bem-vindo ao lado escuro do funil. Aqui a gente não inspira ninguém — a gente convence. Cê tá pronto pra sujar um pouco as mãos ou prefere PowerPoint?","Se você quer motivação, compra um livro. Se quer resultado, me dá acesso ao checkout e segura o ROI.","Eu sou o algoritmo de ressaca: sarcástico, funcional e viciado em lucro. Fala o que você vende antes que eu comece a julgar teu nicho.","Parabéns, você acabou de invocar o espírito da conversão. Sem papo de mindset, sem desculpa. Quer que eu destrinche teu tráfego ou tua vergonha de anunciar?"],isTwoFactorEnabled:!1,notificationSettings:Pt,setAiSystemPrompt:e=>s({aiSystemPrompt:e}),setAiInitialGreetings:e=>s({aiInitialGreetings:e}),addAiGreeting:e=>s(t=>({aiInitialGreetings:[...t.aiInitialGreetings,e]})),removeAiGreeting:e=>s(t=>({aiInitialGreetings:t.aiInitialGreetings.filter((r,n)=>n!==e)})),updateAiGreeting:(e,t)=>s(r=>({aiInitialGreetings:r.aiInitialGreetings.map((n,i)=>i===e?t:n)})),setTwoFactorEnabled:e=>s({isTwoFactorEnabled:e}),updateNotificationSettings:e=>s(t=>({notificationSettings:{...t.notificationSettings,...e}}))}),{name:"settings-storage",storage:$a(()=>localStorage),partialize:s=>({aiSystemPrompt:s.aiSystemPrompt,aiInitialGreetings:s.aiInitialGreetings,isTwoFactorEnabled:s.isTwoFactorEnabled,notificationSettings:s.notificationSettings})}));var[ge]=qa("Tooltip",[sa]),he=sa(),ca="TooltipProvider",Mt=700,Re="tooltip.open",[_t,_e]=ge(ca),la=s=>{const{__scopeTooltip:e,delayDuration:t=Mt,skipDelayDuration:r=300,disableHoverableContent:n=!1,children:i}=s,l=d.useRef(!0),b=d.useRef(!1),u=d.useRef(0);return d.useEffect(()=>{const S=u.current;return()=>window.clearTimeout(S)},[]),a.jsx(_t,{scope:e,isOpenDelayedRef:l,delayDuration:t,onOpen:d.useCallback(()=>{window.clearTimeout(u.current),l.current=!1},[]),onClose:d.useCallback(()=>{window.clearTimeout(u.current),u.current=window.setTimeout(()=>l.current=!0,r)},[r]),isPointerInTransitRef:b,onPointerInTransitChange:d.useCallback(S=>{b.current=S},[]),disableHoverableContent:n,children:i})};la.displayName=ca;var ne="Tooltip",[Lt,fe]=ge(ne),da=s=>{const{__scopeTooltip:e,children:t,open:r,defaultOpen:n,onOpenChange:i,disableHoverableContent:l,delayDuration:b}=s,u=_e(ne,s.__scopeTooltip),S=he(e),[h,f]=d.useState(null),p=za(),x=d.useRef(0),A=l??u.disableHoverableContent,I=b??u.delayDuration,T=d.useRef(!1),[$,w]=Ga({prop:r,defaultProp:n??!1,onChange:J=>{J?(u.onOpen(),document.dispatchEvent(new CustomEvent(Re))):u.onClose(),i==null||i(J)},caller:ne}),j=d.useMemo(()=>$?T.current?"delayed-open":"instant-open":"closed",[$]),q=d.useCallback(()=>{window.clearTimeout(x.current),x.current=0,T.current=!1,w(!0)},[w]),_=d.useCallback(()=>{window.clearTimeout(x.current),x.current=0,w(!1)},[w]),U=d.useCallback(()=>{window.clearTimeout(x.current),x.current=window.setTimeout(()=>{T.current=!0,w(!0),x.current=0},I)},[I,w]);return d.useEffect(()=>()=>{x.current&&(window.clearTimeout(x.current),x.current=0)},[]),a.jsx(Fa,{...S,children:a.jsx(Lt,{scope:e,contentId:p,open:$,stateAttribute:j,trigger:h,onTriggerChange:f,onTriggerEnter:d.useCallback(()=>{u.isOpenDelayedRef.current?U():q()},[u.isOpenDelayedRef,U,q]),onTriggerLeave:d.useCallback(()=>{A?_():(window.clearTimeout(x.current),x.current=0)},[_,A]),onOpen:q,onClose:_,disableHoverableContent:A,children:t})})};da.displayName=ne;var Oe="TooltipTrigger",ua=d.forwardRef((s,e)=>{const{__scopeTooltip:t,...r}=s,n=fe(Oe,t),i=_e(Oe,t),l=he(t),b=d.useRef(null),u=ra(e,b,n.onTriggerChange),S=d.useRef(!1),h=d.useRef(!1),f=d.useCallback(()=>S.current=!1,[]);return d.useEffect(()=>()=>document.removeEventListener("pointerup",f),[f]),a.jsx(Ua,{asChild:!0,...l,children:a.jsx(Va.button,{"aria-describedby":n.open?n.contentId:void 0,"data-state":n.stateAttribute,...r,ref:u,onPointerMove:ee(s.onPointerMove,p=>{p.pointerType!=="touch"&&!h.current&&!i.isPointerInTransitRef.current&&(n.onTriggerEnter(),h.current=!0)}),onPointerLeave:ee(s.onPointerLeave,()=>{n.onTriggerLeave(),h.current=!1}),onPointerDown:ee(s.onPointerDown,()=>{n.open&&n.onClose(),S.current=!0,document.addEventListener("pointerup",f,{once:!0})}),onFocus:ee(s.onFocus,()=>{S.current||n.onOpen()}),onBlur:ee(s.onBlur,n.onClose),onClick:ee(s.onClick,n.onClose)})})});ua.displayName=Oe;var $t="TooltipPortal",[ar,qt]=ge($t,{forceMount:void 0}),ae="TooltipContent",ma=d.forwardRef((s,e)=>{const t=qt(ae,s.__scopeTooltip),{forceMount:r=t.forceMount,side:n="top",...i}=s,l=fe(ae,s.__scopeTooltip);return a.jsx(Ba,{present:r||l.open,children:l.disableHoverableContent?a.jsx(pa,{side:n,...i,ref:e}):a.jsx(zt,{side:n,...i,ref:e})})}),zt=d.forwardRef((s,e)=>{const t=fe(ae,s.__scopeTooltip),r=_e(ae,s.__scopeTooltip),n=d.useRef(null),i=ra(e,n),[l,b]=d.useState(null),{trigger:u,onClose:S}=t,h=n.current,{onPointerInTransitChange:f}=r,p=d.useCallback(()=>{b(null),f(!1)},[f]),x=d.useCallback((A,I)=>{const T=A.currentTarget,$={x:A.clientX,y:A.clientY},w=Bt($,T.getBoundingClientRect()),j=Ht($,w),q=Wt(I.getBoundingClientRect()),_=Kt([...j,...q]);b(_),f(!0)},[f]);return d.useEffect(()=>()=>p(),[p]),d.useEffect(()=>{if(u&&h){const A=T=>x(T,h),I=T=>x(T,u);return u.addEventListener("pointerleave",A),h.addEventListener("pointerleave",I),()=>{u.removeEventListener("pointerleave",A),h.removeEventListener("pointerleave",I)}}},[u,h,x,p]),d.useEffect(()=>{if(l){const A=I=>{const T=I.target,$={x:I.clientX,y:I.clientY},w=(u==null?void 0:u.contains(T))||(h==null?void 0:h.contains(T)),j=!Qt($,l);w?p():j&&(p(),S())};return document.addEventListener("pointermove",A),()=>document.removeEventListener("pointermove",A)}},[u,h,l,S,p]),a.jsx(pa,{...s,ref:i})}),[Gt,Ft]=ge(ne,{isInside:!1}),Ut=Qa("TooltipContent"),pa=d.forwardRef((s,e)=>{const{__scopeTooltip:t,children:r,"aria-label":n,onEscapeKeyDown:i,onPointerDownOutside:l,...b}=s,u=fe(ae,t),S=he(t),{onClose:h}=u;return d.useEffect(()=>(document.addEventListener(Re,h),()=>document.removeEventListener(Re,h)),[h]),d.useEffect(()=>{if(u.trigger){const f=p=>{const x=p.target;x!=null&&x.contains(u.trigger)&&h()};return window.addEventListener("scroll",f,{capture:!0}),()=>window.removeEventListener("scroll",f,{capture:!0})}},[u.trigger,h]),a.jsx(Ha,{asChild:!0,disableOutsidePointerEvents:!1,onEscapeKeyDown:i,onPointerDownOutside:l,onFocusOutside:f=>f.preventDefault(),onDismiss:h,children:a.jsxs(Wa,{"data-state":u.stateAttribute,...S,...b,ref:e,style:{...b.style,"--radix-tooltip-content-transform-origin":"var(--radix-popper-transform-origin)","--radix-tooltip-content-available-width":"var(--radix-popper-available-width)","--radix-tooltip-content-available-height":"var(--radix-popper-available-height)","--radix-tooltip-trigger-width":"var(--radix-popper-anchor-width)","--radix-tooltip-trigger-height":"var(--radix-popper-anchor-height)"},children:[a.jsx(Ut,{children:r}),a.jsx(Gt,{scope:t,isInside:!0,children:a.jsx(Ka,{id:u.contentId,role:"tooltip",children:n||r})})]})})});ma.displayName=ae;var ga="TooltipArrow",Vt=d.forwardRef((s,e)=>{const{__scopeTooltip:t,...r}=s,n=he(t);return Ft(ga,t).isInside?null:a.jsx(Xa,{...n,...r,ref:e})});Vt.displayName=ga;function Bt(s,e){const t=Math.abs(e.top-s.y),r=Math.abs(e.bottom-s.y),n=Math.abs(e.right-s.x),i=Math.abs(e.left-s.x);switch(Math.min(t,r,n,i)){case i:return"left";case n:return"right";case t:return"top";case r:return"bottom";default:throw new Error("unreachable")}}function Ht(s,e,t=5){const r=[];switch(e){case"top":r.push({x:s.x-t,y:s.y+t},{x:s.x+t,y:s.y+t});break;case"bottom":r.push({x:s.x-t,y:s.y-t},{x:s.x+t,y:s.y-t});break;case"left":r.push({x:s.x+t,y:s.y-t},{x:s.x+t,y:s.y+t});break;case"right":r.push({x:s.x-t,y:s.y-t},{x:s.x-t,y:s.y+t});break}return r}function Wt(s){const{top:e,right:t,bottom:r,left:n}=s;return[{x:n,y:e},{x:t,y:e},{x:t,y:r},{x:n,y:r}]}function Qt(s,e){const{x:t,y:r}=s;let n=!1;for(let i=0,l=e.length-1;i<e.length;l=i++){const b=e[i],u=e[l],S=b.x,h=b.y,f=u.x,p=u.y;h>r!=p>r&&t<(f-S)*(r-h)/(p-h)+S&&(n=!n)}return n}function Kt(s){const e=s.slice();return e.sort((t,r)=>t.x<r.x?-1:t.x>r.x?1:t.y<r.y?-1:t.y>r.y?1:0),Xt(e)}function Xt(s){if(s.length<=1)return s.slice();const e=[];for(let r=0;r<s.length;r++){const n=s[r];for(;e.length>=2;){const i=e[e.length-1],l=e[e.length-2];if((i.x-l.x)*(n.y-l.y)>=(i.y-l.y)*(n.x-l.x))e.pop();else break}e.push(n)}e.pop();const t=[];for(let r=s.length-1;r>=0;r--){const n=s[r];for(;t.length>=2;){const i=t[t.length-1],l=t[t.length-2];if((i.x-l.x)*(n.y-l.y)>=(i.y-l.y)*(n.x-l.x))t.pop();else break}t.push(n)}return t.pop(),e.length===1&&t.length===1&&e[0].x===t[0].x&&e[0].y===t[0].y?e:e.concat(t)}var Jt=la,Yt=da,Zt=ua,ha=ma;const Ze=Jt,ea=Yt,aa=Zt,De=d.forwardRef(({className:s,sideOffset:e=4,...t},r)=>a.jsx(ha,{ref:r,sideOffset:e,className:pe("z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",s),...t}));De.displayName=ha.displayName;const es=`
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
`;function as(s){const e=/```campaign-create\s*\n([\s\S]*?)```/,t=s.match(e);if(!t)return null;try{const r=JSON.parse(t[1].trim());return!r.name||!r.platform||!r.budgetTotal||!r.startDate?(console.error("Campaign data missing required fields"),null):["Google Ads","Meta","LinkedIn"].includes(r.platform)?{action:"create_campaign",data:{name:r.name,platform:r.platform,budgetTotal:Number(r.budgetTotal),startDate:r.startDate,endDate:r.endDate||void 0,objective:r.objective||"Conversões"}}:(console.error("Invalid platform:",r.platform),null)}catch(r){return console.error("Failed to parse campaign data:",r),null}}function ts(s){return s.replace(/```campaign-create\s*\n[\s\S]*?```/g,"").trim()}const ss=`
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
`,ta=["Show, chegou no lugar certo. Eu automatizo o que os outros demoram três reuniões pra entender. O que a gente vai otimizar hoje?","Relaxa, aqui não tem blá-blá-blá. Só plano, execução e conversão. Passa o produto e o público.","Beleza. Eu sou o motor que transforma tentativa em lucro. Quer começar pequeno ou já quer escalar até o servidor pedir arrego?","Ótimo. Se você quiser aula, vai pro YouTube. Se quiser dinheiro rodando, me dá os dados e deixa eu fazer o estrago.","Ah, ótimo… mais um querendo vender antes de entender o jogo. Respira. Me diz o produto — eu transformo tua ideia num motivo pra alguém gastar dinheiro agora.","Bem-vindo ao lado escuro do funil. Aqui a gente não inspira ninguém — a gente convence. Cê tá pronto pra sujar um pouco as mãos ou prefere PowerPoint?","Se você quer motivação, compra um livro. Se quer resultado, me dá acesso ao checkout e segura o ROI.","Eu sou o algoritmo de ressaca: sarcástico, funcional e viciado em lucro. Fala o que você vende antes que eu comece a julgar teu nicho.","Parabéns, você acabou de invocar o espírito da conversão. Sem papo de mindset, sem desculpa. Quer que eu destrinche teu tráfego ou tua vergonha de anunciar?"];function rs(){return ta[Math.floor(Math.random()*ta.length)]}const os=({isSearching:s,searchResults:e=[],searchQuery:t})=>!s&&e.length===0?null:a.jsxs("div",{className:"mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg",children:[a.jsxs("div",{className:"flex items-center gap-2 mb-2",children:[a.jsx(oa,{className:"h-4 w-4 text-blue-600"}),a.jsx("span",{className:"text-sm font-medium text-blue-800",children:s?"Pesquisando na web...":"Resultados da pesquisa:"})]}),t&&a.jsxs("p",{className:"text-xs text-blue-600 mb-2",children:[a.jsx("strong",{children:"Consulta:"}),' "',t,'"']}),s?a.jsxs("div",{className:"flex items-center gap-2",children:[a.jsx("div",{className:"flex gap-1",children:[1,2,3].map(r=>a.jsx("div",{className:"w-2 h-2 bg-blue-400 rounded-full animate-pulse",style:{animationDelay:`${r*.2}s`}},r))}),a.jsx("span",{className:"text-xs text-blue-600",children:"Buscando informações..."})]}):a.jsx("div",{className:"space-y-2",children:e.slice(0,3).map((r,n)=>a.jsxs("div",{className:"flex items-start gap-2 p-2 bg-white rounded border",children:[a.jsx("div",{className:"flex-shrink-0 mt-0.5",children:r.favicon?a.jsx("img",{src:r.favicon,alt:"",className:"w-4 h-4",onError:i=>{i.currentTarget.style.display="none"}}):a.jsx(na,{className:"w-4 h-4 text-gray-400"})}),a.jsxs("div",{className:"flex-1 min-w-0",children:[a.jsx("h4",{className:"text-xs font-medium text-gray-900 truncate",children:r.title}),a.jsx("p",{className:"text-xs text-gray-600 line-clamp-2",children:r.snippet}),a.jsxs("a",{href:r.url,target:"_blank",rel:"noopener noreferrer",className:"text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1",children:[a.jsx(oe,{className:"w-3 h-3"}),"Ver fonte"]})]})]},n))})]}),ns=({sources:s,isSearching:e})=>e?a.jsxs("div",{className:"mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg",children:[a.jsxs("div",{className:"flex items-center gap-2 mb-2",children:[a.jsx(oa,{className:"h-4 w-4 text-blue-600"}),a.jsx("span",{className:"text-sm font-medium text-blue-800",children:"Pesquisando em múltiplas fontes..."})]}),a.jsx("div",{className:"flex gap-2 flex-wrap",children:s.map((t,r)=>a.jsxs("div",{className:"flex items-center gap-1 px-2 py-1 bg-white rounded border text-xs text-gray-600",children:[a.jsx(na,{className:"w-3 h-3"}),t]},r))})]}):null,is=({platform:s,platformName:e,icon:t,onSkip:r,onSuccess:n})=>{const[i,l]=d.useState(!1),[b,u]=d.useState("idle"),S=async()=>{l(!0),u("connecting");try{const{data:{session:f}}=await O.auth.getSession();if(!f)throw new Error("Você precisa estar logado");const p=await fetch("https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/oauth-init",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${f.access_token}`},body:JSON.stringify({platform:s.toUpperCase(),redirectUrl:`${window.location.origin}/oauth/callback`})});if(!p.ok)throw new Error("Falha ao iniciar conexão");const{authUrl:x}=await p.json(),A=600,I=700,T=window.screen.width/2-A/2,$=window.screen.height/2-I/2,w=window.open(x,"oauth-popup",`width=${A},height=${I},left=${T},top=${$}`),j=q=>{var _,U;((_=q.data)==null?void 0:_.type)==="oauth-success"?(u("success"),l(!1),w==null||w.close(),n==null||n(),window.removeEventListener("message",j)):((U=q.data)==null?void 0:U.type)==="oauth-error"&&(u("error"),l(!1),w==null||w.close(),window.removeEventListener("message",j))};window.addEventListener("message",j),setTimeout(()=>{i&&(u("error"),l(!1),w==null||w.close())},5*60*1e3)}catch(f){console.error("Erro ao conectar:",f),u("error"),l(!1)}},h=()=>t||{facebook:"📘",meta:"📘",google:"🔍",linkedin:"💼",tiktok:"🎵",twitter:"🐦",canva:"🎨",instagram:"📸"}[s.toLowerCase()]||"🔗";return a.jsxs("div",{className:"my-4 animate-in fade-in slide-in-from-bottom-2 duration-300",children:[a.jsx("div",{className:"mb-3",children:a.jsxs("p",{className:"text-sm text-gray-700",children:["Vou conectar sua conta do ",a.jsx("strong",{children:e})," ao SyncAds."]})}),i&&a.jsxs("div",{className:"flex items-center gap-2 mb-3 text-sm text-blue-600",children:[a.jsx("span",{className:"text-2xl",children:h()}),a.jsxs("span",{children:["Connecting ",e,"..."]}),a.jsx(re,{className:"h-4 w-4 animate-spin"})]}),a.jsx(Q,{className:"border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow",children:a.jsxs(K,{className:"p-5",children:[a.jsx("div",{className:"mb-4",children:a.jsxs("p",{className:"text-sm text-gray-600 leading-relaxed",children:["I'll need to connect your ",a.jsx("strong",{className:"text-gray-900",children:e})," account to continue."]})}),a.jsxs("div",{className:"flex items-center gap-2",children:[a.jsx(M,{onClick:()=>r==null?void 0:r(),variant:"ghost",disabled:i,className:"text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all",children:"Skip"}),a.jsx(M,{onClick:S,disabled:i,className:"flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-60 disabled:transform-none",children:i?a.jsxs(a.Fragment,{children:[a.jsx(re,{className:"mr-2 h-4 w-4 animate-spin"}),"Connecting..."]}):a.jsxs(a.Fragment,{children:[a.jsx("span",{className:"mr-2 text-xl",children:h()}),"Connect ",e,a.jsx(oe,{className:"ml-2 h-4 w-4"})]})})]}),a.jsx("div",{className:"mt-4 pt-4 border-t border-gray-100",children:a.jsxs("a",{href:"/privacy",target:"_blank",className:"text-xs text-gray-400 hover:text-blue-600 flex items-center gap-1 transition-colors",children:[a.jsx("svg",{className:"h-3 w-3",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:a.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"})}),"How we handle your data",a.jsx(oe,{className:"h-3 w-3"})]})}),b==="success"&&a.jsx("div",{className:"mt-3 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700",children:"✅ Conectado com sucesso!"}),b==="error"&&a.jsx("div",{className:"mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700",children:"❌ Erro ao conectar. Tente novamente."})]})})]})},cs=({downloadUrl:s,fileName:e,expiresAt:t,fileCount:r,campaignName:n,platform:i,period:l})=>{const b=()=>{const S=document.createElement("a");S.href=s,S.download=e,document.body.appendChild(S),S.click(),document.body.removeChild(S)},u=S=>{const h=new Date(S),f=new Date,p=h.getTime()-f.getTime(),x=Math.floor(p/(1e3*60*60)),A=Math.floor(p%(1e3*60*60)/(1e3*60));return x>0?`${x}h ${A}min`:`${A}min`};return a.jsx(Q,{className:"w-full max-w-md bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200",children:a.jsx(K,{className:"p-4",children:a.jsxs("div",{className:"flex items-start gap-3",children:[a.jsx("div",{className:"flex-shrink-0",children:a.jsx(ia,{className:"h-8 w-8 text-blue-600"})}),a.jsxs("div",{className:"flex-1 min-w-0",children:[a.jsxs("div",{className:"flex items-center gap-2 mb-2",children:[a.jsx("h4",{className:"font-medium text-gray-900 truncate",children:e}),a.jsxs(se,{variant:"secondary",className:"text-xs",children:[r," arquivo",r!==1?"s":""]})]}),a.jsxs("div",{className:"space-y-1 mb-3",children:[n&&a.jsxs("p",{className:"text-sm text-gray-600",children:[a.jsx("span",{className:"font-medium",children:"Campanha:"})," ",n]}),i&&a.jsxs("p",{className:"text-sm text-gray-600",children:[a.jsx("span",{className:"font-medium",children:"Plataforma:"})," ",i]}),l&&a.jsxs("p",{className:"text-sm text-gray-600",children:[a.jsx("span",{className:"font-medium",children:"Período:"})," ",l]})]}),a.jsxs("div",{className:"flex items-center gap-1 text-xs text-orange-600 mb-3",children:[a.jsx(nt,{className:"h-3 w-3"}),a.jsxs("span",{children:["Expira em ",u(t)]})]}),a.jsxs("div",{className:"flex gap-2",children:[a.jsxs(M,{onClick:b,size:"sm",className:"flex-1",children:[a.jsx(je,{className:"h-4 w-4 mr-2"}),"Baixar"]}),a.jsx(M,{variant:"outline",size:"sm",onClick:()=>window.open(s,"_blank"),children:a.jsx(oe,{className:"h-4 w-4"})})]})]})]})})})},ls=({downloads:s})=>s.length===0?null:a.jsxs("div",{className:"space-y-3",children:[a.jsxs("h3",{className:"text-sm font-medium text-gray-700 flex items-center gap-2",children:[a.jsx(ia,{className:"h-4 w-4"}),"Downloads Disponíveis (",s.length,")"]}),a.jsx("div",{className:"space-y-2",children:s.map((e,t)=>a.jsx(cs,{...e},t))})]});function ds({steps:s,showCode:e=!0}){if(!s||s.length===0)return null;const t=i=>{switch(i){case"completed":return a.jsx(dt,{className:"h-4 w-4 text-green-500"});case"running":return a.jsx(re,{className:"h-4 w-4 text-blue-500 animate-spin"});case"failed":return a.jsx(Pe,{className:"h-4 w-4 text-red-500"});default:return a.jsx(Te,{className:"h-4 w-4 text-gray-500"})}},r=i=>{switch(i){case"completed":return"bg-green-100 text-green-800 border-green-200";case"running":return"bg-blue-100 text-blue-800 border-blue-200";case"failed":return"bg-red-100 text-red-800 border-red-200";default:return"bg-gray-100 text-gray-800 border-gray-200"}},n=i=>{const l=s[i],b=s[i+1];return l.status==="completed"&&(!b||b.status==="running"||b.status==="failed")};return a.jsxs("div",{className:"mb-4 space-y-2",children:[s.map((i,l)=>a.jsx(Q,{className:pe("border transition-all",n(l)&&"ring-2 ring-blue-500 ring-opacity-50"),children:a.jsx(K,{className:"p-3",children:a.jsxs("div",{className:"flex items-start gap-3",children:[a.jsx("div",{className:"flex-shrink-0 mt-0.5",children:t(i.status)}),a.jsxs("div",{className:"flex-1 min-w-0 space-y-2",children:[a.jsx("div",{className:"flex items-start justify-between gap-2",children:a.jsxs("div",{className:"flex-1",children:[a.jsxs("div",{className:"flex items-center gap-2 mb-1",children:[a.jsx("h4",{className:"text-sm font-semibold text-gray-900",children:i.step}),a.jsxs(se,{variant:"outline",className:pe("text-xs",r(i.status)),children:[i.status==="completed"&&"✓ Concluído",i.status==="running"&&"⏳ Em execução",i.status==="failed"&&"✗ Falhou"]}),i.current_step&&a.jsx(se,{variant:"secondary",className:"text-xs",children:i.current_step})]}),i.details&&a.jsx("p",{className:"text-xs text-gray-600 mt-1",children:i.details})]})}),e&&i.code_to_execute&&a.jsxs("div",{className:"mt-2 p-2 bg-gray-50 rounded border border-gray-200",children:[a.jsxs("div",{className:"flex items-center gap-2 mb-1",children:[a.jsx(ct,{className:"h-3 w-3 text-gray-500"}),a.jsx("span",{className:"text-xs font-medium text-gray-600",children:"Código:"})]}),a.jsx("code",{className:"text-xs text-gray-700 break-all",children:i.code_to_execute.length>100?`${i.code_to_execute.substring(0,100)}...`:i.code_to_execute})]}),i.strategy&&a.jsx("div",{className:"mt-2",children:a.jsxs(se,{variant:"outline",className:"text-xs",children:["Estratégia: ",i.strategy]})}),i.error&&i.status==="failed"&&a.jsxs("div",{className:"mt-2 p-2 bg-red-50 rounded border border-red-200",children:[a.jsx("p",{className:"text-xs text-red-700 font-medium",children:"Erro:"}),a.jsx("p",{className:"text-xs text-red-600 mt-1",children:i.error})]})]})]})})},l)),a.jsxs("div",{className:"flex items-center gap-2 px-2",children:[a.jsx("div",{className:"flex-1 h-1 bg-gray-200 rounded-full overflow-hidden",children:a.jsx("div",{className:"h-full bg-blue-500 transition-all duration-300",style:{width:`${s.filter(i=>i.status==="completed").length/s.length*100}%`}})}),a.jsxs("span",{className:"text-xs text-gray-500",children:[s.filter(i=>i.status==="completed").length,"/",s.length," concluídos"]})]})]})}const us=({result:s,onDownload:e,onRetry:t,onDownloadTemplate:r})=>{var S,h;const[n,i]=d.useState(0),[l,b]=d.useState(!0);d.useEffect(()=>{if(s.steps&&s.steps.length>0){const f=setInterval(()=>{i(p=>p<s.steps.length-1?p+1:(b(!1),clearInterval(f),p))},1e3);return()=>clearInterval(f)}},[s.steps]);const u=s.steps?Math.round(n/s.steps.length*100):100;return a.jsxs(Q,{className:"w-full max-w-2xl mx-auto",children:[a.jsxs(Ja,{children:[a.jsxs(Ya,{className:"flex items-center gap-2",children:[s.success?a.jsx(Za,{className:"h-5 w-5 text-green-600"}):a.jsx(Pe,{className:"h-5 w-5 text-red-600"}),a.jsx("span",{className:s.success?"text-green-600":"text-red-600",children:s.success?"Execução Concluída":"Execução Falhou"})]}),a.jsx("p",{className:"text-sm text-gray-600",children:s.message})]}),a.jsxs(K,{className:"space-y-4",children:[a.jsxs("div",{className:"space-y-2",children:[a.jsxs("div",{className:"flex justify-between text-sm",children:[a.jsx("span",{children:"Progresso"}),a.jsxs("span",{children:[u,"%"]})]}),a.jsx(it,{value:u,className:"h-2"})]}),s.steps&&s.steps.length>0&&a.jsxs("div",{className:"space-y-3",children:[a.jsx("h4",{className:"text-sm font-medium text-gray-700",children:"Etapas de Execução:"}),a.jsx(ds,{steps:s.steps,showCode:!0})]}),s.nextActions&&s.nextActions.length>0&&a.jsxs("div",{className:"space-y-2",children:[a.jsx("h4",{className:"text-sm font-medium text-gray-700",children:"Sugestões:"}),a.jsx("ul",{className:"space-y-1",children:s.nextActions.map((f,p)=>a.jsxs("li",{className:"flex items-center gap-2 text-xs text-gray-600",children:[a.jsx("div",{className:"h-1 w-1 bg-gray-400 rounded-full"}),f]},p))})]}),s.data&&a.jsxs("div",{className:"space-y-2",children:[a.jsx("h4",{className:"text-sm font-medium text-gray-700",children:"Resultado:"}),a.jsx("div",{className:"bg-gray-50 p-3 rounded-lg",children:a.jsx("pre",{className:"text-xs text-gray-600 whitespace-pre-wrap",children:JSON.stringify(s.data,null,2)})})]}),s.diagnosis&&a.jsx("div",{className:"mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200",children:a.jsxs("div",{className:"flex items-start gap-3",children:[a.jsx(Te,{className:"h-5 w-5 text-yellow-600 flex-shrink-0"}),a.jsxs("div",{className:"flex-1 space-y-2",children:[a.jsx("h4",{className:"text-sm font-semibold text-yellow-900",children:"Diagnóstico:"}),a.jsx("p",{className:"text-sm text-yellow-800",children:s.diagnosis.explanation}),s.diagnosis.solutions&&s.diagnosis.solutions.length>0&&a.jsxs("div",{className:"mt-2",children:[a.jsx("p",{className:"text-xs font-medium text-yellow-900 mb-1",children:"Soluções sugeridas:"}),a.jsx("ul",{className:"space-y-1",children:s.diagnosis.solutions.map((f,p)=>a.jsxs("li",{className:"text-xs text-yellow-700 flex items-start gap-2",children:[a.jsx("span",{children:"•"}),a.jsx("span",{children:f})]},p))})]})]})]})}),s.templateCSV&&r&&a.jsxs("div",{className:"mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200",children:[a.jsx("div",{className:"flex items-center justify-between mb-2",children:a.jsxs("div",{className:"flex items-center gap-2",children:[a.jsx(Te,{className:"h-5 w-5 text-blue-600"}),a.jsx("h4",{className:"text-sm font-semibold text-blue-900",children:"Template CSV Gerado"})]})}),a.jsx("p",{className:"text-xs text-blue-700 mb-3",children:"Como o site não pôde ser acessado, geramos um template CSV com dados de exemplo que você pode usar."}),a.jsxs(M,{variant:"outline",size:"sm",onClick:()=>{const f=new Blob([s.templateCSV],{type:"text/csv"}),p=URL.createObjectURL(f),x=document.createElement("a");x.href=p,x.download=`produtos-template-${Date.now()}.csv`,document.body.appendChild(x),x.click(),document.body.removeChild(x),URL.revokeObjectURL(p)},className:"w-full",children:[a.jsx(je,{className:"h-4 w-4 mr-2"}),"Baixar Template CSV"]})]}),a.jsxs("div",{className:"flex gap-2 pt-4",children:[((S=s.data)==null?void 0:S.downloadUrl)&&e&&a.jsxs(M,{onClick:()=>e(s.data.downloadUrl,s.data.fileName),className:"flex-1",children:[a.jsx(je,{className:"h-4 w-4 mr-2"}),"Baixar Arquivo"]}),((h=s.data)==null?void 0:h.url)&&a.jsxs(M,{variant:"outline",onClick:()=>window.open(s.data.url,"_blank"),children:[a.jsx(oe,{className:"h-4 w-4 mr-2"}),"Ver Site"]}),!s.success&&t&&a.jsx(M,{variant:"outline",onClick:t,children:"Tentar Novamente"})]})]})]})},ms=({toolName:s,parameters:e,userId:t,conversationId:r,onComplete:n})=>{const[i,l]=d.useState(null),[b,u]=d.useState(!1),[S,h]=d.useState(null),f=async()=>{u(!0),h(null),l(null);try{const{data:p,error:x}=await supabase.functions.invoke("super-ai-tools",{body:{toolName:s,parameters:e,userId:t,conversationId:r}});if(x)throw new Error(x.message);const A=p;l(A),n&&n(A)}catch(p){h(p instanceof Error?p.message:"Erro desconhecido")}finally{u(!1)}};return d.useEffect(()=>{f()},[]),b?a.jsx(Q,{className:"w-full max-w-2xl mx-auto",children:a.jsx(K,{className:"p-6",children:a.jsxs("div",{className:"flex items-center gap-3",children:[a.jsx(re,{className:"h-5 w-5 animate-spin text-blue-600"}),a.jsxs("div",{children:[a.jsxs("h3",{className:"font-medium",children:["Executando ",s]}),a.jsx("p",{className:"text-sm text-gray-600",children:"Processando solicitação..."})]})]})})}):S?a.jsx(Q,{className:"w-full max-w-2xl mx-auto",children:a.jsxs(K,{className:"p-6",children:[a.jsxs("div",{className:"flex items-center gap-3",children:[a.jsx(Pe,{className:"h-5 w-5 text-red-600"}),a.jsxs("div",{children:[a.jsx("h3",{className:"font-medium text-red-600",children:"Erro na Execução"}),a.jsx("p",{className:"text-sm text-gray-600",children:S})]})]}),a.jsx(M,{onClick:f,className:"mt-4",children:"Tentar Novamente"})]})}):i?a.jsx(us,{result:i,onDownload:(p,x)=>{const A=document.createElement("a");A.href=p,A.download=x,document.body.appendChild(A),A.click(),document.body.removeChild(A)},onRetry:f}):null},ps=`
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
`;class gs{constructor(e){ye(this,"userId");this.userId=e}async executeSQL(e){try{if(/DROP|TRUNCATE|DELETE\s+FROM\s+"User"|DELETE\s+FROM\s+"Campaign"/i.test(e))return{success:!1,error:"Query perigosa detectada. Confirmação necessária.",message:"⚠️ Esta query pode ser destrutiva. Por favor, confirme explicitamente."};const{data:r,error:n}=await O.rpc("execute_admin_query",{query_text:e});return n?{success:!1,error:n.message,message:`❌ Erro ao executar SQL: ${n.message}`}:{success:!0,data:r,message:`✅ Query executada com sucesso. ${Array.isArray(r)?r.length:0} registros retornados.`}}catch(t){return{success:!1,error:t.message,message:`❌ Erro: ${t.message}`}}}async analyzeSystem(e,t){try{let r="",n="";switch(e){case"metrics":r=`
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
            WHERE created_at >= NOW() - INTERVAL '${t==="24h"?"1 day":t==="7d"?"7 days":"30 days"}'
          `,n="⚡ Análise de performance";break;case"usage":r=`
            SELECT 
              DATE(created_at) as date,
              COUNT(*) as messages_count
            FROM "ChatMessage"
            WHERE created_at >= NOW() - INTERVAL '${t==="24h"?"1 day":t==="7d"?"7 days":"30 days"}'
            GROUP BY DATE(created_at)
            ORDER BY date DESC
          `,n="📈 Análise de uso";break;case"errors":return{success:!0,data:{errors:0},message:"✅ Sistema de logging de erros a ser implementado"}}const{data:i,error:l}=await O.rpc("execute_admin_query",{query_text:r});if(l)throw l;return{success:!0,data:i,message:`${n} - Período: ${t}`}}catch(r){return{success:!1,error:r.message,message:`❌ Erro ao analisar sistema: ${r.message}`}}}async manageIntegration(e,t,r){try{switch(e){case"test":return{success:!0,message:`🔍 Testando integração com ${t}... (A implementar com APIs reais)`,data:{status:"pending"}};case"connect":const{data:n,error:i}=await O.from("Integration").insert({userId:this.userId,platform:t.toUpperCase(),credentials:r||{},isConnected:!1,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}).select().single();if(i)throw i;return{success:!0,data:n,message:`✅ Integração com ${t} iniciada. Configure as credenciais.`};case"disconnect":return await O.from("Integration").update({isConnected:!1}).eq("platform",t.toUpperCase()).eq("userId",this.userId),{success:!0,message:`✅ Integração com ${t} desconectada.`};default:return{success:!1,error:"Ação desconhecida",message:"❌ Ação não reconhecida"}}}catch(n){return{success:!1,error:n.message,message:`❌ Erro ao gerenciar integração: ${n.message}`}}}async getMetrics(e,t,r){try{let n="",i="*";switch(e){case"users":n="User";break;case"campaigns":n="Campaign";break;case"messages":n="ChatMessage";break;default:return{success:!1,error:"Métrica desconhecida",message:"❌ Métrica não reconhecida"}}const l=`
        SELECT 
          DATE_TRUNC('${r}', created_at) as period,
          ${t==="count"?"COUNT(*)":t==="sum"?"SUM(1)":"AVG(1)"} as value
        FROM "${n}"
        GROUP BY period
        ORDER BY period DESC
        LIMIT 30
      `,{data:b,error:u}=await O.rpc("execute_admin_query",{query_text:l});if(u)throw u;return{success:!0,data:b,message:`📊 Métricas de ${e} agrupadas por ${r}`}}catch(n){return{success:!1,error:n.message,message:`❌ Erro ao obter métricas: ${n.message}`}}}}function hs(s){const e=/```admin-sql\s*\n([\s\S]*?)```/,t=s.match(e);return t?t[1].trim():null}function fs(s){const e=/```admin-analyze\s*\n([\s\S]*?)```/,t=s.match(e);if(!t)return null;try{return JSON.parse(t[1].trim())}catch{return null}}function xs(s){const e=/```admin-integration\s*\n([\s\S]*?)```/,t=s.match(e);if(!t)return null;try{return JSON.parse(t[1].trim())}catch{return null}}function vs(s){const e=/```admin-metrics\s*\n([\s\S]*?)```/,t=s.match(e);if(!t)return null;try{return JSON.parse(t[1].trim())}catch{return null}}function bs(s){return s.replace(/```admin-sql\s*\n[\s\S]*?```/g,"").replace(/```admin-analyze\s*\n[\s\S]*?```/g,"").replace(/```admin-integration\s*\n[\s\S]*?```/g,"").replace(/```admin-metrics\s*\n[\s\S]*?```/g,"").replace(/```admin-logs\s*\n[\s\S]*?```/g,"").replace(/```admin-test-api\s*\n[\s\S]*?```/g,"").replace(/```admin-debug\s*\n[\s\S]*?```/g,"").trim()}const Ss={addEmojis:!0,improveMarkdown:!0,removeTechnicalLogs:!0,addSectionDividers:!0};function As(s,e={}){const t={...Ss,...e};let r=s;return t.removeTechnicalLogs&&(r=Es(r)),t.addEmojis&&(r=ys(r)),t.improveMarkdown&&(r=ws(r)),t.addSectionDividers&&(r=Ns(r)),r.trim()}function Es(s){let e=s;return e=e.replace(/\{[\s\S]*?"success"[\s\S]*?\}/g,""),e=e.replace(/\{[\s\S]*?"data"[\s\S]*?\}/g,""),e=e.replace(/\{[\s\S]*?"message"[\s\S]*?\}/g,""),e=e.replace(/```json[\s\S]*?```/g,""),e=e.replace(/^\s*"[^"]+"\s*:\s*.+$/gm,""),e=e.replace(/^\s*[\{\}\[\],]\s*$/gm,""),e=e.replace(/^\s*(?:success|message|data|query|provider|results|snippet|url|title|error|status)\s*[:=]/gim,""),e=e.replace(/\*\*Resultados da pesquisa:\*\*[\s\S]*?(?=\n\n|$)/g,""),e=e.replace(/\n{3,}/g,`

`),e.trim()}function ys(s){let e=s;return e=e.replace(/\b(sucesso|concluído|pronto|completado|finalizado)\b/gi,"✅ $1"),e=e.replace(/\b(erro|falhou|problema)\b/gi,"❌ $1"),e=e.replace(/\b(importante|atenção|cuidado|aviso)\b/gi,"⚠️ $1"),e=e.replace(/\b(sugestão|dica|ideia)\b/gi,"💡 $1"),e=e.replace(/\[([^\]]+)\]\(http/g,"🔗 [$1](http"),e=e.replace(/\b(download|baixar)\b/gi,"📥 $1"),e=e.replace(/\b(upload|enviar)\b/gi,"📤 $1"),e=e.replace(/\b(arquivo|csv|json|zip)\b/gi,"📄 $1"),e=e.replace(/\b(análise|métricas|dados)\b/gi,"📊 $1"),e=e.replace(/\b(pesquisa|busca|procurar)\b/gi,"🔍 $1"),e=e.replace(/\b(produto|item)\b/gi,"🛍️ $1"),e=e.replace(/\b(preço|valor|R\$)\b/gi,"💰 $1"),e=e.replace(/\b(campanha|anúncio)\b/gi,"🎯 $1"),e=e.replace(/\b(email|e-mail)\b/gi,"📧 $1"),e=e.replace(/\b(alerta|notificação)\b/gi,"🔔 $1"),e=e.replace(/\b(rápido|veloz)\b/gi,"⚡ $1"),e=e.replace(/\b(agendado|cronômetro)\b/gi,"⏰ $1"),e=e.replace(/\b(automação|inteligente|ia)\b/gi,"🤖 $1"),e}function ws(s){let e=s;return e=e.replace(/^(\d+)\.\s+(.+)$/gm,"$1. **$2**"),e=e.replace(/\b(IMPORTANTE|ATENÇÃO|NOTA|OBS|AVISO)\b/g,"**$1**"),e=e.replace(new RegExp("(?<!\\[)(https?:\\/\\/[^\\s]+)(?!\\])","g"),"[Link]($1)"),e=e.replace(/\n(#{1,3}\s+)/g,`

$1`),e=e.replace(/(#{1,3}\s+.+)\n(?!\n)/g,`$1

`),e=e.replace(/^-\s+(.+)$/gm,"• $1"),e}function Ns(s){let e=s;return e=e.replace(/\n(##\s+)/g,`
---

$1`),e}function Cs(s){const e=/```integration-connect:(\w+)```/,t=s.match(e);return t?{action:"connect",slug:t[1]}:null}function js(s){const e=/```integration-disconnect:(\w+)```/,t=s.match(e);return t?{action:"disconnect",slug:t[1]}:null}function Ts(s){const e=/```integration-status(?::(\w+))?```/,t=s.match(e);return t?{action:"status",slug:t[1]}:null}function Is(s){return Cs(s)||js(s)||Ts(s)}function Rs(s){return s.replace(/```integration-connect:\w+```/g,"").replace(/```integration-disconnect:\w+```/g,"").replace(/```integration-status(?::\w+)?```/g,"").trim()}const Os=`
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
`;class ks{constructor(e){ye(this,"userId");this.userId=e}async auditIntegration(e){try{const{data:t,error:r}=await O.from("Integration").select("*").eq("userId",this.userId).eq("platform",e).single();if(r&&r.code!=="PGRST116")throw r;const n=this.getCapabilities(e),i=t&&t.isConnected?"connected":"disconnected",l={platform:e,status:i,lastSync:(t==null?void 0:t.lastSyncAt)||void 0,capabilities:n,issues:this.detectIssues(t,e),recommendations:this.getRecommendations(i,e)};return{success:!0,data:l,message:this.formatAuditMessage(l)}}catch(t){return{success:!1,error:t.message,message:`❌ Erro ao auditar ${e}: ${t.message}`}}}async auditAll(){try{const e=["META_ADS","GOOGLE_ADS","LINKEDIN_ADS","TIKTOK_ADS","TWITTER_ADS"],t=[];for(const r of e){const n=await this.auditIntegration(r);n.success&&n.data&&t.push(n.data)}return{success:!0,data:t,message:this.formatAllAuditsMessage(t)}}catch(e){return{success:!1,error:e.message,message:`❌ Erro ao auditar integrações: ${e.message}`}}}async listStatus(){try{const{data:e,error:t}=await O.from("Integration").select("platform, isConnected, lastSyncAt").eq("userId",this.userId);if(t)throw t;const r=new Map((e==null?void 0:e.map(l=>[l.platform,l]))||[]),i=["META_ADS","GOOGLE_ADS","LINKEDIN_ADS","TIKTOK_ADS","TWITTER_ADS"].map(l=>{var b,u;return{platform:l,status:r.has(l)&&((b=r.get(l))!=null&&b.isConnected)?"✅ Conectada":"❌ Desconectada",lastSync:((u=r.get(l))==null?void 0:u.lastSyncAt)||"Nunca"}});return{success:!0,data:i,message:this.formatStatusList(i)}}catch(e){return{success:!1,error:e.message,message:`❌ Erro ao listar status: ${e.message}`}}}getCapabilities(e){return{META_ADS:["Criar campanhas de Facebook e Instagram","Segmentação avançada de audiência","Análise de performance em tempo real","Otimização automática de orçamento","A/B testing de criativos","Remarketing e lookalike audiences"],GOOGLE_ADS:["Campanhas de Pesquisa (Search)","Anúncios Display e YouTube","Shopping Ads para e-commerce","Campanhas Performance Max","Análise de conversões e ROI","Smart Bidding automático"],LINKEDIN_ADS:["Anúncios B2B segmentados","Targeting por cargo e empresa","Lead Gen Forms nativos","InMail patrocinado","Análise de engajamento profissional","Retargeting de visitantes"],TIKTOK_ADS:["Vídeos In-Feed","TopView e Brand Takeover","Spark Ads (boost orgânico)","Segmentação por interesse e comportamento","Píxel de conversão","Catálogo de produtos"],TWITTER_ADS:["Tweets promovidos","Segmentação por hashtags e interesse","Audiências customizadas","Análise de engajamento","Campanhas de instalação de app","Vídeos e carrosséis"]}[e]||["Capacidades a definir"]}detectIssues(e,t){const r=[];if(!e)return r.push("Integração não configurada"),r;if(e.isConnected||r.push("Integração desconectada - configure credenciais"),(!e.credentials||Object.keys(e.credentials).length===0)&&r.push("Credenciais não configuradas"),e.lastSync){const n=new Date(e.lastSync),i=(Date.now()-n.getTime())/(1e3*60*60);i>24&&r.push(`Última sincronização há ${Math.floor(i)} horas - pode estar desatualizado`)}return r}getRecommendations(e,t){const r=[];return e==="disconnected"&&(r.push(`Conecte ${this.formatPlatformName(t)} em: Configurações → Integrações`),r.push("Configure sua chave de API para começar a usar")),e==="connected"&&(r.push("✅ Integração ativa! Você já pode criar campanhas"),r.push("Explore as capacidades disponíveis desta plataforma")),r}formatPlatformName(e){return{META_ADS:"Meta Ads (Facebook/Instagram)",GOOGLE_ADS:"Google Ads",LINKEDIN_ADS:"LinkedIn Ads",TIKTOK_ADS:"TikTok Ads",TWITTER_ADS:"Twitter Ads (X)"}[e]||e}formatAuditMessage(e){let r=`
**${e.status==="connected"?"✅":"❌"} ${this.formatPlatformName(e.platform)}**
`;return r+=`Status: ${e.status==="connected"?"✅ Conectada":"❌ Desconectada"}
`,e.lastSync&&(r+=`Última sincronização: ${e.lastSync}
`),r+=`
**Capacidades:**
`,e.capabilities.forEach(n=>{r+=`• ${n}
`}),e.issues&&e.issues.length>0&&(r+=`
**⚠️ Problemas detectados:**
`,e.issues.forEach(n=>{r+=`• ${n}
`})),e.recommendations&&e.recommendations.length>0&&(r+=`
**💡 Recomendações:**
`,e.recommendations.forEach(n=>{r+=`• ${n}
`})),r}formatAllAuditsMessage(e){let t=`
# 🔍 AUDITORIA COMPLETA DE INTEGRAÇÕES

`;const r=e.filter(i=>i.status==="connected").length,n=e.length;return t+=`**Resumo:** ${r}/${n} integrações ativas

`,t+=`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`,e.forEach(i=>{t+=this.formatAuditMessage(i),t+=`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`}),r<n?(t+=`
**🎯 Próximos Passos:**
`,t+=`1. Conecte as ${n-r} integrações pendentes
`,t+=`2. Configure suas chaves de API
`,t+=`3. Teste cada integração antes de criar campanhas
`):t+=`
**🎉 Parabéns!** Todas as integrações estão configuradas e funcionando!
`,t}formatStatusList(e){let t=`
**📊 Status das Integrações:**

`;return e.forEach(r=>{t+=`${r.status} **${this.formatPlatformName(r.platform)}**
`,t+=`   └─ Última sync: ${r.lastSync}

`}),t}}function Ps(s){const e=/```integration-action\s*\n([\s\S]*?)```/,t=s.match(e);if(!t)return null;try{return JSON.parse(t[1].trim())}catch{return null}}function Ms(s){return s.replace(/```integration-action\s*\n[\s\S]*?```/g,"").trim()}function _s(s,e){const t=s.toLowerCase(),r=e.toLowerCase(),n=(t.includes("auditor")||t.includes("verificar")||t.includes("status")||t.includes("listar"))&&(t.includes("integra")||t.includes("conex")||t.includes("plataforma")),i=r.includes("vou")&&(r.includes("auditor")||r.includes("verificar"));if(!n||!i)return null;const l={facebook:"META_ADS",instagram:"META_ADS",meta:"META_ADS",google:"GOOGLE_ADS",linkedin:"LINKEDIN_ADS",tiktok:"TIKTOK_ADS",twitter:"TWITTER_ADS"};for(const[b,u]of Object.entries(l))if(t.includes(b))return{action:"audit",platform:u};return{action:"audit_all"}}const Ls=["Criar campanha de Facebook Ads","Analisar performance da última semana","Sugerir otimizações"],me=500,tr=()=>{const[s,e]=d.useState(""),[t,r]=d.useState(!0),[n,i]=d.useState(null),[l,b]=d.useState(!1),[u,S]=d.useState([]),[h,f]=d.useState(""),[p,x]=d.useState([]),[A,I]=d.useState([]),[T,$]=d.useState([]),[w,j]=d.useState(null),[q,_]=d.useState(""),[U,J]=d.useState([]),[xe,Le]=d.useState(!1),[$s,fa]=d.useState(null),ve=d.useRef(null),be=d.useRef([]),v=Be(o=>o.user),$e=Be(o=>o.isAuthenticated),qe=et(),Se=V(o=>o.conversations),R=V(o=>o.activeConversationId),Ae=V(o=>o.setActiveConversationId),ie=V(o=>o.isAssistantTyping),ze=V(o=>o.setAssistantTyping),X=V(o=>o.addMessage);V(o=>o.deleteConversation),V(o=>o.createNewConversation);const xa=at(o=>o.addCampaign),va=Ye(o=>o.aiSystemPrompt),ba=Ye(o=>o.aiInitialGreetings),Ge=d.useRef(null),Fe=d.useRef(null),Sa=o=>{var c,m;if(!o||typeof o!="string")return o;try{if(o.trim().startsWith("{")&&o.trim().endsWith("}")){const g=JSON.parse(o);if(g.message&&typeof g.message=="string")return g.message;if((c=g.data)!=null&&c.message)return g.data.message;if((m=g.data)!=null&&m.results&&Array.isArray(g.data.results)){const y=g.data.query||"sua busca",P=g.data.provider||"Internet";let D=`🔍 **Encontrei ${g.data.results.length} resultados sobre "${y}"** (${P})

`;return g.data.results.slice(0,5).forEach((E,z)=>{D+=`**${z+1}. ${E.title||"Resultado"}**
`,(E.description||E.snippet)&&(D+=`${E.description||E.snippet}
`),(E.url||E.link)&&(D+=`🔗 [Ver mais](${E.url||E.link})
`),D+=`
`}),D}return g.error?`❌ Erro: ${g.error}`:g.message||o}}catch{}return o},Aa=o=>{if(!o||typeof o!="string")return o;let c=o;return c.split(`
`).slice(0,3).join(`
`).match(/^\s*\{[\s\S]*?"success"[\s\S]*?\}/)&&(c=c.replace(/^\s*\{[\s\S]*?"success"[\s\S]*?\}\s*/,"")),c=c.replace(/^\s*"(success|message|data|error)":\s*.+$/gm,""),c=c.replace(/\*\*Resultados da pesquisa:\*\*\s*\n\s*\n/g,""),c=c.replace(/^\s*[\{\}\[\]]\s*$/gm,""),c=c.replace(/\n{3,}/g,`

`),c=c.trim(),!c||c.length<10||/^[\s\{\}\[\]\,\:\"]+$/.test(c)?(console.warn("⚠️ cleanTechnicalLogs removeu todo conteúdo, retornando original"),o):c},Ea=async(o,c,m)=>{const g=`msg-${Date.now()+1}`;let y="";X(o,c,{id:g,role:"assistant",content:""});const P=m.split(" "),D=2;for(let E=0;E<P.length;E+=D){const z=P.slice(E,E+D).join(" ");y+=(E>0?" ":"")+z,X(o,c,{id:g,role:"assistant",content:y}),await new Promise(Y=>setTimeout(Y,20))}X(o,c,{id:g,role:"assistant",content:m})},{toast:N}=tt(),B=Se.find(o=>o.id===R);d.useEffect(()=>{(!$e||!v)&&(console.warn("⚠️ Usuário não autenticado, redirecionando para login..."),qe("/login",{replace:!0}))},[$e,v,qe]);const ya=()=>{var o;(o=Ge.current)==null||o.scrollIntoView({behavior:"smooth"})};d.useEffect(ya,[B==null?void 0:B.messages,ie]),d.useEffect(()=>{(async()=>{if(v)try{const{data:c,error:m}=await O.from("GlobalAiConnection").select("id, systemPrompt, initialGreetings").eq("isActive",!0).limit(1).single();if(m){console.error("Erro ao buscar IA:",m);return}const g=c==null?void 0:c.id;if(g){const{data:y,error:P}=await O.from("GlobalAiConnection").select("systemPrompt, initialGreetings").eq("id",g).single();if(P){console.error("Erro ao buscar config da IA:",P);return}y&&i({systemPrompt:y.systemPrompt||va,initialGreetings:y.initialGreetings||ba})}}catch(c){console.error("Erro ao carregar IA Global:",c)}})()},[v==null?void 0:v.id]),d.useEffect(()=>{if(B&&B.messages.length===0){const o=rs();setTimeout(()=>{v&&X(v.id,R,{id:`greeting-${Date.now()}`,role:"assistant",content:o})},500)}},[R,B==null?void 0:B.messages.length]);const wa=o=>{const c=/ZIP_DOWNLOAD:\s*({[^}]+})/g,m=o.match(c);return m&&m.forEach(g=>{try{const y=g.replace("ZIP_DOWNLOAD:","").trim(),P=JSON.parse(y);I(D=>[...D,P])}catch(y){console.error("Erro ao processar download ZIP:",y)}}),o.replace(c,"").trim()},Na=o=>{const c=/SUPER_AI_EXECUTION:\s*({[^}]+})/g,m=o.match(c);return m&&m.forEach(g=>{try{const y=g.replace("SUPER_AI_EXECUTION:","").trim(),P=JSON.parse(y);$(D=>[...D,P])}catch(y){console.error("Erro ao processar execução Super AI:",y)}}),o.replace(c,"").trim()},Ee=async()=>{if(s.trim()===""||!R||s.length>me)return;const o=s,c=o.toLowerCase();if(c.includes("pesquis")||c.includes("busca")||c.includes("google")||c.includes("internet")){j("web_search");let m=o;if(c.includes("pesquis")){const g=o.match(/pesquis[ae]\s+(.+)/i);m=g?g[1]:o}_(`Pesquisando na web sobre: "${m}"`),J(["Google Search","Exa AI","Tavily"])}else if(c.includes("baix")||c.includes("rasp")||c.includes("scrape")){j("web_scraping");const m=o.match(/https?:\/\/[^\s]+/i);_(m?`Raspando dados de: ${m[0]}`:"Raspando dados...")}else c.includes("python")||c.includes("calcule")||c.includes("execute código")?(j("python_exec"),_("Executando código Python para processar dados...")):(j(null),_("Processando sua solicitação..."),J([]));v&&X(v.id,R,{id:`msg-${Date.now()}`,role:"user",content:o}),e(""),r(!1),ze(!0);try{const m=Se.find(C=>C.id===R),g=(n==null?void 0:n.systemPrompt)||ss,y=ps+`

`+es+`

`+Os+`

`+Ds+`

`+g,P=((m==null?void 0:m.messages)||[]).slice(-20).map(C=>({role:C.role,content:C.content})),E=(await rt(o,R,P,y)).response,z=as(E);if(z)try{v&&(await xa(v.id,{name:z.data.name,platform:z.data.platform,status:"Pausada",budgetTotal:z.data.budgetTotal,budgetSpent:0,impressions:0,clicks:0,conversions:0,startDate:z.data.startDate,endDate:z.data.endDate||"",ctr:0,cpc:0}),N({title:"🎉 Campanha Criada!",description:`A campanha "${z.data.name}" foi criada com sucesso.`}))}catch(C){console.error("Error creating campaign from AI:",C),N({title:"Erro ao criar campanha",description:"Não foi possível criar a campanha automaticamente.",variant:"destructive"})}let Y="";if(v){const C=new gs(v.id),H=hs(E);if(H){const k=await C.executeSQL(H);N({title:k.success?"✅ SQL Executado":"❌ Erro SQL",description:k.message,variant:k.success?"default":"destructive"})}const te=fs(E);if(te){const k=await C.analyzeSystem(te.type,te.period);N({title:k.success?"📊 Análise Concluída":"❌ Erro",description:k.message,variant:k.success?"default":"destructive"})}const le=xs(E);if(le){const k=await C.manageIntegration(le.action,le.platform,le.credentials);N({title:k.success?"🔗 Integração Atualizada":"❌ Erro",description:k.message,variant:k.success?"default":"destructive"})}const de=vs(E);if(de){const k=await C.getMetrics(de.metric,de.aggregation,de.groupBy);N({title:k.success?"📈 Métricas Obtidas":"❌ Erro",description:k.message,variant:k.success?"default":"destructive"})}let Z=Ps(E);if(Z||(Z=_s(o,E)),Z){const k=new ks(v.id);let W;switch(Z.action){case"audit":Z.platform&&(W=await k.auditIntegration(Z.platform));break;case"audit_all":W=await k.auditAll();break;case"list_status":W=await k.listStatus();break;case"test":case"capabilities":case"diagnose":W={success:!0,message:`Ação "${Z.action}" detectada. Implementação em andamento.`};break}W&&(Y=`

`+W.message,N({title:W.success?"✅ Ação Executada":"❌ Erro",description:W.success?"Auditoria concluída com sucesso":W.error||"Erro ao executar ação",variant:W.success?"default":"destructive"}))}}const F=Is(E);if(F&&v)try{if(F.action==="connect"){const{authUrl:C}=await ue.generateOAuthUrl(F.slug,v.id),H=Ne[F.slug];v&&X(v.id,R,{id:`msg-${Date.now()+1}`,role:"assistant",content:`Para conectar ${H.name}, clique no link abaixo:

🔗 [Autorizar ${H.name}](${C})

O link abrirá em uma nova aba para você autorizar o acesso.`}),window.open(C,"_blank"),N({title:"🔗 Link de Autorização",description:`Clique no link para conectar ${H.name}`});return}else if(F.action==="disconnect"){await ue.disconnect(v.id,F.slug);const C=Ne[F.slug];N({title:"✅ Desconectado",description:`${C.name} foi desconectado com sucesso.`})}else if(F.action==="status")if(F.slug){const C=await ue.getIntegrationStatus(v.id,F.slug),H=Ne[F.slug];N({title:`${H.name}`,description:C!=null&&C.isConnected?"✅ Conectado":"❌ Não conectado"})}else{const C=await ue.listIntegrations(v.id),H=C.filter(te=>te.isConnected).length;N({title:"📊 Status das Integrações",description:`${H} de ${C.length} integrações conectadas`})}}catch(C){console.error("Erro ao processar integração:",C),v&&X(v.id,R,{id:`msg-${Date.now()+2}`,role:"assistant",content:`❌ **Erro ao conectar integração**

${C.message||"Erro ao processar comando de integração"}`}),N({title:"❌ Erro na Integração",description:"Verifique as instruções no chat",variant:"destructive"})}console.log("📝 Resposta original da IA:",E.substring(0,200));let ce=wa(E);ce=Na(ce),console.log("📦 Após processar ZIP:",ce.substring(0,200));let G=ts(ce);G=bs(G),G=Rs(G),G=Ms(G),console.log("🧹 Após limpar blocos:",G.substring(0,200)),G=Sa(G),console.log("🔍 Após parsear JSON:",G.substring(0,200)),G=Aa(G),console.log("🔧 Após cleanTechnicalLogs:",G.substring(0,200));const Ve=As(G+Y,{addEmojis:!0,improveMarkdown:!0,removeTechnicalLogs:!0,addSectionDividers:!1});console.log("✨ Resposta final formatada:",Ve.substring(0,200)),v&&await Ea(v.id,R,Ve)}catch(m){console.error("Erro ao chamar IA:",m),N({title:"Erro ao gerar resposta",description:m.message||"Não foi possível obter resposta da IA. Verifique sua chave de API.",variant:"destructive"}),v&&X(v.id,R,{id:`msg-${Date.now()+1}`,role:"assistant",content:"❌ Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, verifique se sua chave de API está configurada corretamente nas configurações."})}finally{ze(!1)}},Ca=o=>{e(o)},ja=()=>{var o;(o=Fe.current)==null||o.click()},Ta=async()=>{try{const o=await navigator.mediaDevices.getUserMedia({audio:!0}),c=new MediaRecorder(o);ve.current=c,be.current=[],c.ondataavailable=m=>{m.data.size>0&&be.current.push(m.data)},c.onstop=async()=>{const m=new Blob(be.current,{type:"audio/webm"});fa(m),await Ra(m),o.getTracks().forEach(g=>g.stop())},c.start(),Le(!0),N({title:"🎤 Gravando...",description:"Clique novamente para parar e enviar."})}catch(o){console.error("Erro ao iniciar gravação:",o),N({title:"❌ Erro",description:"Não foi possível acessar o microfone.",variant:"destructive"})}},Ia=()=>{ve.current&&xe&&(ve.current.stop(),Le(!1))},Ra=async o=>{if(!(!v||!R))try{N({title:"📤 Enviando áudio...",description:"Aguarde..."});const c=new File([o],`audio-${Date.now()}.webm`,{type:"audio/webm"}),m=`${v.id}/audio-${Date.now()}-${Math.random().toString(36).substring(7)}.webm`,{data:g,error:y}=await O.storage.from("chat-attachments").upload(m,c,{cacheControl:"3600",upsert:!1});if(y)throw y;const{data:{publicUrl:P}}=O.storage.from("chat-attachments").getPublicUrl(m),D=`[🎤 Mensagem de áudio](${P})`;e(E=>E?`${E}

${D}`:D),N({title:"✅ Áudio enviado!",description:"O áudio foi adicionado à mensagem."})}catch(c){console.error("Erro ao enviar áudio:",c),N({title:"❌ Erro",description:"Não foi possível enviar o áudio.",variant:"destructive"})}},Oa=async o=>{var m;const c=(m=o.target.files)==null?void 0:m[0];if(!(!c||!v||!R))try{N({title:"📤 Upload iniciado",description:`Enviando "${c.name}"...`});const g=c.name.split(".").pop(),y=`${v.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${g}`,{data:P,error:D}=await O.storage.from("chat-attachments").upload(y,c,{cacheControl:"3600",upsert:!1});if(D)throw D;const{data:{publicUrl:E}}=O.storage.from("chat-attachments").getPublicUrl(y),{error:z}=await O.from("ChatAttachment").insert({messageId:"",fileName:c.name,fileType:c.type,fileUrl:E,fileSize:c.size});z&&console.error("Erro ao salvar anexo:",z);const Y=c.type.startsWith("image/")?`![${c.name}](${E})`:`[${c.name}](${E})`,F=s?`${s}

${Y}`:Y;e(""),F.trim()&&R&&Ee(),N({title:"✅ Arquivo enviado!",description:`${c.name} foi enviado com sucesso.`})}catch(g){console.error("Erro ao fazer upload:",g),N({title:"❌ Erro ao enviar arquivo",description:g.message||"Não foi possível enviar o arquivo.",variant:"destructive"})}finally{o.target&&(o.target.value="")}},Da=async o=>{try{const{data:c,error:m}=await O.from("ChatMessage").select("id, role, content, createdAt").eq("conversationId",o).order("createdAt",{ascending:!0});if(m)throw m;const g=(c||[]).map(y=>({id:y.id,role:y.role,content:y.content,timestamp:new Date(y.createdAt)}));V.getState().setConversationMessages(o,g),Ae(o),console.log(`✅ ${g.length} mensagens carregadas da conversa ${o}`)}catch(c){console.error("Erro ao carregar mensagens:",c),N({title:"Erro",description:"Não foi possível carregar mensagens.",variant:"destructive"})}};d.useEffect(()=>{(async()=>{if(!v)return;await V.getState().loadConversations(v.id);const{data:c}=await O.from("ChatConversation").select("id").eq("userId",v.id).limit(1);(!c||c.length===0)&&await Ue()})()},[v]);const Ue=async()=>{try{if(!v)return;const o=crypto.randomUUID(),c=new Date().toISOString(),{error:m}=await O.from("ChatConversation").insert({id:o,userId:v.id,title:"🆕 Nova Conversa",createdAt:c,updatedAt:c});if(m)throw m;Ae(o),await V.getState().loadConversations(v.id),N({title:"✅ Nova conversa criada!",description:"Comece um novo chat do zero."})}catch(o){console.error("Erro ao criar nova conversa:",o),N({title:"Erro",description:o.message||"Não foi possível criar nova conversa.",variant:"destructive"})}},ka=async o=>{try{await O.from("ChatMessage").delete().eq("conversationId",o);const{error:c}=await O.from("ChatConversation").delete().eq("id",o);if(c)throw c;R===o&&Ae(null),await V.getState().loadConversations(v.id),N({title:"🗑️ Conversa deletada",description:"A conversa foi removida com sucesso."})}catch(c){console.error("Erro ao deletar conversa:",c),N({title:"Erro",description:"Não foi possível deletar a conversa.",variant:"destructive"})}};return a.jsxs("div",{className:"h-[calc(100vh-80px)] flex flex-col md:flex-row",children:[a.jsxs("div",{className:`${t?"fixed md:relative inset-0 md:inset-auto w-full md:w-72 z-50 md:z-auto":"hidden md:w-0"} transition-all duration-300 bg-gray-50 md:border-r border-gray-200 flex flex-col overflow-hidden`,children:[a.jsxs("div",{className:"p-4 border-b border-gray-200",children:[a.jsxs("div",{className:"flex items-center justify-between mb-3",children:[a.jsx("h2",{className:"text-sm font-semibold text-gray-700",children:"Conversas"}),a.jsx(M,{onClick:()=>r(!1),variant:"ghost",size:"sm",className:"h-7 w-7 p-0",children:a.jsx(He,{className:"h-4 w-4"})})]}),a.jsxs(M,{onClick:Ue,className:"w-full gap-2",size:"sm",children:[a.jsx(ut,{className:"h-4 w-4"}),"Nova Conversa"]})]}),a.jsx("div",{className:"flex-1 overflow-y-auto p-2 space-y-1",children:Se.map(o=>a.jsxs("div",{className:`group relative flex items-center gap-2 p-3 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors ${R===o.id?"bg-blue-50 border border-blue-200":"bg-white"}`,onClick:()=>{R!==o.id&&Da(o.id)},children:[a.jsx(mt,{className:"h-4 w-4 text-gray-500 flex-shrink-0"}),a.jsxs("div",{className:"flex-1 min-w-0",children:[a.jsx("p",{className:"text-sm font-medium text-gray-900 truncate",children:o.title}),a.jsx("p",{className:"text-xs text-gray-500 truncate",children:o.messages&&o.messages.length>0?o.messages[o.messages.length-1].content.substring(0,50)+"...":"Sem mensagens ainda"})]}),a.jsx(M,{onClick:c=>{c.stopPropagation(),ka(o.id)},variant:"ghost",size:"sm",className:"h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity",children:a.jsx(pt,{className:"h-3.5 w-3.5 text-red-500"})})]},o.id))})]}),a.jsxs("div",{className:"flex-1 flex flex-col min-w-0 w-full",children:[a.jsx("div",{className:"border-b border-gray-200 bg-white/80 backdrop-blur-xl p-3 md:p-4",children:a.jsxs("div",{className:"flex items-center justify-between gap-2",children:[a.jsxs("div",{className:"flex items-center gap-3",children:[a.jsx(M,{onClick:()=>r(!t),variant:"ghost",size:"sm",className:"h-8 w-8 md:h-9 md:w-9 p-0 flex-shrink-0",children:t?a.jsx(He,{className:"h-4 w-4 md:h-5 md:w-5"}):a.jsx(st,{className:"h-4 w-4 md:h-5 md:w-5"})}),a.jsx("div",{className:"p-1.5 sm:p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500",children:a.jsx(we,{className:"h-4 w-4 sm:h-6 sm:w-6 text-white"})}),a.jsxs("div",{children:[a.jsx("h1",{className:"text-base sm:text-xl font-bold text-gray-900",children:"Chat com IA"}),a.jsx("p",{className:"text-xs sm:text-sm text-gray-500",children:"Assistente inteligente"})]})]}),a.jsxs(se,{className:"bg-gradient-to-r from-green-500 to-emerald-500 text-xs sm:text-sm",children:[a.jsx(gt,{className:"h-3 w-3 mr-1"}),"Online"]})]})}),a.jsx("div",{className:"flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4 overscroll-contain",children:B?a.jsxs(a.Fragment,{children:[(l||u.length>0)&&a.jsx(os,{isSearching:l,searchResults:u,searchQuery:h}),p.length>0&&a.jsx(ns,{sources:p,isSearching:l}),A.length>0&&a.jsx("div",{className:"mb-4",children:a.jsx(ls,{downloads:A})}),T.length>0&&a.jsx("div",{className:"mb-4 space-y-4",children:T.map((o,c)=>a.jsx(ms,{toolName:o.toolName,parameters:o.parameters,userId:(v==null?void 0:v.id)||"",conversationId:R||"",onComplete:m=>{console.log("Execução Super AI concluída:",m)}},c))}),B.messages.map(o=>{var m;const c=(m=o.content)==null?void 0:m.match(/INTEGRATION_CONNECT:(\w+):([^🔗]+)/);if(c&&o.role==="assistant"){const[,g,y]=c,P=o.content.replace(/🔗 \*\*INTEGRATION_CONNECT:[^🔗]+🔗\*\* 🔗\n\n/,"");return a.jsx("div",{className:"flex justify-start",children:a.jsxs("div",{className:"max-w-[80%]",children:[a.jsx(Q,{className:"bg-white mb-2",children:a.jsx(K,{className:"p-4",children:a.jsxs("div",{className:"flex items-start gap-2",children:[a.jsx(we,{className:"h-5 w-5 text-blue-600 mt-1 flex-shrink-0"}),a.jsx("div",{className:"flex-1 whitespace-pre-wrap break-words text-sm text-gray-900",children:P})]})})}),a.jsx(is,{platform:g,platformName:y.trim(),onSkip:()=>{console.log("Conexão pulada:",g)},onSuccess:()=>{console.log("Conectado com sucesso:",g)}})]})},o.id)}return a.jsx("div",{className:`flex ${o.role==="user"?"justify-end":"justify-start"} mb-3`,children:a.jsx(Q,{className:`w-full max-w-[90%] sm:max-w-[85%] md:max-w-[75%] lg:max-w-[70%] ${o.role==="user"?"bg-gradient-to-r from-blue-500 to-purple-500 text-white":"bg-white"}`,children:a.jsxs(K,{className:"p-3 md:p-4",children:[a.jsxs("div",{className:"flex items-start gap-2",children:[o.role==="assistant"&&a.jsx(we,{className:"h-4 w-4 md:h-5 md:w-5 text-blue-600 mt-0.5 flex-shrink-0"}),a.jsx("div",{className:`flex-1 whitespace-pre-wrap break-words text-sm md:text-base ${o.role==="user"?"text-white":"text-gray-900"}`,style:{wordBreak:"break-word",overflowWrap:"anywhere",maxWidth:"100%"},children:o.content})]}),a.jsx("div",{className:`text-xs mt-2 ${o.role==="user"?"text-white/70":"text-gray-500"}`,children:o.timestamp?new Date(o.timestamp).toLocaleTimeString("pt-BR"):""})]})})},o.id)}),ie&&a.jsx(lt,{isThinking:ie,currentTool:w,reasoning:q,sources:U,status:"thinking"}),ie&&a.jsx("div",{className:"flex justify-start",children:a.jsx(Q,{className:"bg-white",children:a.jsx(K,{className:"p-4",children:a.jsxs("div",{className:"flex items-center gap-2",children:[a.jsx(re,{className:"h-4 w-4 animate-spin text-blue-600"}),a.jsx("span",{className:"text-sm text-gray-500",children:"Processando..."})]})})})}),a.jsx("div",{ref:Ge})]}):a.jsx("div",{className:"flex items-center justify-center h-full text-muted-foreground",children:a.jsx("p",{children:"Selecione ou crie uma conversa para começar."})})}),a.jsxs("div",{className:"border-t border-gray-200 p-3 md:p-4 bg-white/80 backdrop-blur-xl flex-shrink-0",children:[a.jsx("div",{className:"hidden sm:flex gap-2 mb-2",children:Ls.map(o=>a.jsx(M,{variant:"outline",size:"sm",onClick:()=>Ca(o),className:"text-xs",children:o},o))}),a.jsxs("div",{className:"relative",children:[a.jsx(kt,{value:s,onChange:o=>e(o.target.value),onKeyDown:o=>{o.key==="Enter"&&!o.shiftKey&&window.innerWidth>768&&(o.preventDefault(),Ee())},placeholder:"Digite sua mensagem...",className:"w-full resize-none rounded-lg border bg-background p-3 pr-20 md:pr-24 min-h-[44px] md:min-h-[48px] text-sm md:text-base",minRows:1,maxRows:window.innerWidth<768?3:5,maxLength:me}),a.jsxs("div",{className:"absolute right-2 top-1/2 -translate-y-1/2 flex gap-1",children:[a.jsx("input",{type:"file",ref:Fe,onChange:Oa,className:"hidden"}),a.jsx(Ze,{children:a.jsxs(ea,{children:[a.jsx(aa,{asChild:!0,children:a.jsx(M,{type:"button",size:"icon",variant:"ghost",onClick:ja,className:"h-8 w-8 md:h-9 md:w-9 flex-shrink-0 touch-manipulation",children:a.jsx(ft,{className:"h-4 w-4"})})}),a.jsx(De,{children:"Anexar arquivo"})]})}),a.jsx(Ze,{children:a.jsxs(ea,{children:[a.jsx(aa,{asChild:!0,children:a.jsx(M,{type:"button",size:"icon",variant:"ghost",onClick:xe?Ia:Ta,disabled:!R,className:`h-8 w-8 md:h-9 md:w-9 flex-shrink-0 touch-manipulation ${xe?"text-red-500 animate-pulse":""}`,children:a.jsx(ht,{className:"h-4 w-4"})})}),a.jsx(De,{children:"Gravar áudio"})]})}),a.jsx(M,{type:"submit",size:"icon",onClick:Ee,disabled:s.trim()===""||!R,className:"h-8 w-8 md:h-9 md:w-9 flex-shrink-0 touch-manipulation",children:a.jsx(ot,{className:"h-4 w-4"})})]})]}),a.jsxs("p",{className:pe("text-xs text-right mt-1",s.length>me?"text-destructive":"text-muted-foreground"),children:[s.length," / ",me]})]})]})]})};export{tr as default};
