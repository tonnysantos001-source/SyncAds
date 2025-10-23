var Aa=Object.defineProperty;var Sa=(o,a,e)=>a in o?Aa(o,a,{enumerable:!0,configurable:!0,writable:!0,value:e}):o[a]=e;var ne=(o,a,e)=>Sa(o,typeof a!="symbol"?a+"":a,e);import{c as ge,r as c,R as de,Z as xa,_ as Ca,$ as Ea,j as r,y as Ie,v as De,z as ya,w as Ta,x as ba,A as ae,E as Ia,P as Da,D as B,F as Ra,O as wa,Q as Na,a0 as Re,a1 as Oa,S as Pa,o as P,s as O,U as we,u as _a,a2 as $,a3 as ja,f as La,g as Ae,l as ka,B as H,a4 as ie,a5 as ce,a as Se,a6 as Ma,a7 as za}from"./index-B-osEcsW.js";import{i as Z,I as le}from"./integrationsService-DUf_FDLx.js";import{c as Ne,R as Ga,T as $a,P as Fa,W as qa,C as Va,a as Ua,D as Ha,b as Oe,O as Ba}from"./index-BPufPZUG.js";import{P as Wa}from"./plus-DFUwOcXH.js";import{T as Ka}from"./trash-2-BtDJBuxQ.js";import{S as Qa}from"./send-DYUjut_o.js";/**
 * @license lucide-react v0.417.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ya=ge("PanelLeftClose",[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",key:"afitv7"}],["path",{d:"M9 3v18",key:"fh3hqa"}],["path",{d:"m16 15-3-3 3-3",key:"14y99z"}]]);/**
 * @license lucide-react v0.417.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Xa=ge("PanelLeftOpen",[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",key:"afitv7"}],["path",{d:"M9 3v18",key:"fh3hqa"}],["path",{d:"m14 9 3 3-3 3",key:"8010ee"}]]);/**
 * @license lucide-react v0.417.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ja=ge("Paperclip",[["path",{d:"m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48",key:"1u3ebp"}]]);function ue(){return ue=Object.assign?Object.assign.bind():function(o){for(var a=1;a<arguments.length;a++){var e=arguments[a];for(var t in e)({}).hasOwnProperty.call(e,t)&&(o[t]=e[t])}return o},ue.apply(null,arguments)}function Za(o,a){if(o==null)return{};var e={};for(var t in o)if({}.hasOwnProperty.call(o,t)){if(a.indexOf(t)!==-1)continue;e[t]=o[t]}return e}var et=c.useLayoutEffect,at=function(a){var e=de.useRef(a);return et(function(){e.current=a}),e},xe=function(a,e){if(typeof a=="function"){a(e);return}a.current=e},tt=function(a,e){var t=de.useRef();return de.useCallback(function(s){a.current=s,t.current&&xe(t.current,null),t.current=e,e&&xe(e,s)},[e])},Ce={"min-height":"0","max-height":"none",height:"0",visibility:"hidden",overflow:"hidden",position:"absolute","z-index":"-1000",top:"0",right:"0",display:"block"},ot=function(a){Object.keys(Ce).forEach(function(e){a.style.setProperty(e,Ce[e],"important")})},Ee=ot,I=null,ye=function(a,e){var t=a.scrollHeight;return e.sizingStyle.boxSizing==="border-box"?t+e.borderSize:t-e.paddingSize};function st(o,a,e,t){e===void 0&&(e=1),t===void 0&&(t=1/0),I||(I=document.createElement("textarea"),I.setAttribute("tabindex","-1"),I.setAttribute("aria-hidden","true"),Ee(I)),I.parentNode===null&&document.body.appendChild(I);var s=o.paddingSize,l=o.borderSize,n=o.sizingStyle,m=n.boxSizing;Object.keys(n).forEach(function(g){var f=g;I.style[f]=n[f]}),Ee(I),I.value=a;var d=ye(I,o);I.value=a,d=ye(I,o),I.value="x";var p=I.scrollHeight-s,u=p*e;m==="border-box"&&(u=u+s+l),d=Math.max(u,d);var h=p*t;return m==="border-box"&&(h=h+s+l),d=Math.min(h,d),[d,p]}var Te=function(){},rt=function(a,e){return a.reduce(function(t,s){return t[s]=e[s],t},{})},nt=["borderBottomWidth","borderLeftWidth","borderRightWidth","borderTopWidth","boxSizing","fontFamily","fontSize","fontStyle","fontWeight","letterSpacing","lineHeight","paddingBottom","paddingLeft","paddingRight","paddingTop","tabSize","textIndent","textRendering","textTransform","width","wordBreak","wordSpacing","scrollbarGutter"],it=!!document.documentElement.currentStyle,ct=function(a){var e=window.getComputedStyle(a);if(e===null)return null;var t=rt(nt,e),s=t.boxSizing;if(s==="")return null;it&&s==="border-box"&&(t.width=parseFloat(t.width)+parseFloat(t.borderRightWidth)+parseFloat(t.borderLeftWidth)+parseFloat(t.paddingRight)+parseFloat(t.paddingLeft)+"px");var l=parseFloat(t.paddingBottom)+parseFloat(t.paddingTop),n=parseFloat(t.borderBottomWidth)+parseFloat(t.borderTopWidth);return{sizingStyle:t,paddingSize:l,borderSize:n}},lt=ct;function fe(o,a,e){var t=at(e);c.useLayoutEffect(function(){var s=function(n){return t.current(n)};if(o)return o.addEventListener(a,s),function(){return o.removeEventListener(a,s)}},[])}var dt=function(a,e){fe(document.body,"reset",function(t){a.current.form===t.target&&e(t)})},ut=function(a){fe(window,"resize",a)},mt=function(a){fe(document.fonts,"loadingdone",a)},pt=["cacheMeasurements","maxRows","minRows","onChange","onHeightChange"],gt=function(a,e){var t=a.cacheMeasurements,s=a.maxRows,l=a.minRows,n=a.onChange,m=n===void 0?Te:n,d=a.onHeightChange,p=d===void 0?Te:d,u=Za(a,pt),h=u.value!==void 0,g=c.useRef(null),f=tt(g,e),C=c.useRef(0),y=c.useRef(),S=function(){var E=g.current,v=t&&y.current?y.current:lt(E);if(v){y.current=v;var D=st(v,E.value||E.placeholder||"x",l,s),L=D[0],F=D[1];C.current!==L&&(C.current=L,E.style.setProperty("height",L+"px","important"),p(L,{rowHeight:F}))}},w=function(E){h||S(),m(E)};return c.useLayoutEffect(S),dt(g,function(){if(!h){var T=g.current.value;requestAnimationFrame(function(){var E=g.current;E&&T!==E.value&&S()})}}),ut(S),mt(S),c.createElement("textarea",ue({},u,{onChange:w,ref:f}))},ft=c.forwardRef(gt);const ht={emailSummary:!0,emailAlerts:!0,emailNews:!1,pushMentions:!0,pushIntegrations:!1,pushSuggestions:!0},be=xa()(Ca(o=>({aiSystemPrompt:"Você é o SyncAds AI, um assistente de marketing digital especializado em otimização de campanhas. Seja proativo, criativo e forneça insights baseados em dados. Suas respostas devem ser claras, concisas e sempre focadas em ajudar o usuário a atingir seus objetivos de marketing.",aiInitialGreetings:["Olá! 👋 Sou o SyncAds AI, seu assistente de marketing digital. Como posso ajudar você hoje?","Oi! Estou aqui para ajudar a otimizar suas campanhas. O que gostaria de fazer?","Bem-vindo! Pronto para criar campanhas incríveis? Por onde começamos?"],isTwoFactorEnabled:!1,notificationSettings:ht,setAiSystemPrompt:a=>o({aiSystemPrompt:a}),setAiInitialGreetings:a=>o({aiInitialGreetings:a}),addAiGreeting:a=>o(e=>({aiInitialGreetings:[...e.aiInitialGreetings,a]})),removeAiGreeting:a=>o(e=>({aiInitialGreetings:e.aiInitialGreetings.filter((t,s)=>s!==a)})),updateAiGreeting:(a,e)=>o(t=>({aiInitialGreetings:t.aiInitialGreetings.map((s,l)=>l===a?e:s)})),setTwoFactorEnabled:a=>o({isTwoFactorEnabled:a}),updateNotificationSettings:a=>o(e=>({notificationSettings:{...e.notificationSettings,...a}}))}),{name:"settings-storage",storage:Ea(()=>localStorage),partialize:o=>({aiSystemPrompt:o.aiSystemPrompt,aiInitialGreetings:o.aiInitialGreetings,isTwoFactorEnabled:o.isTwoFactorEnabled,notificationSettings:o.notificationSettings})}));var[te]=Ie("Tooltip",[De]),oe=De(),Pe="TooltipProvider",vt=700,me="tooltip.open",[At,he]=te(Pe),_e=o=>{const{__scopeTooltip:a,delayDuration:e=vt,skipDelayDuration:t=300,disableHoverableContent:s=!1,children:l}=o,n=c.useRef(!0),m=c.useRef(!1),d=c.useRef(0);return c.useEffect(()=>{const p=d.current;return()=>window.clearTimeout(p)},[]),r.jsx(At,{scope:a,isOpenDelayedRef:n,delayDuration:e,onOpen:c.useCallback(()=>{window.clearTimeout(d.current),n.current=!1},[]),onClose:c.useCallback(()=>{window.clearTimeout(d.current),d.current=window.setTimeout(()=>n.current=!0,t)},[t]),isPointerInTransitRef:m,onPointerInTransitChange:c.useCallback(p=>{m.current=p},[]),disableHoverableContent:s,children:l})};_e.displayName=Pe;var Y="Tooltip",[St,se]=te(Y),je=o=>{const{__scopeTooltip:a,children:e,open:t,defaultOpen:s,onOpenChange:l,disableHoverableContent:n,delayDuration:m}=o,d=he(Y,o.__scopeTooltip),p=oe(a),[u,h]=c.useState(null),g=ya(),f=c.useRef(0),C=n??d.disableHoverableContent,y=m??d.delayDuration,S=c.useRef(!1),[w,T]=Ta({prop:t,defaultProp:s??!1,onChange:F=>{F?(d.onOpen(),document.dispatchEvent(new CustomEvent(me))):d.onClose(),l==null||l(F)},caller:Y}),E=c.useMemo(()=>w?S.current?"delayed-open":"instant-open":"closed",[w]),v=c.useCallback(()=>{window.clearTimeout(f.current),f.current=0,S.current=!1,T(!0)},[T]),D=c.useCallback(()=>{window.clearTimeout(f.current),f.current=0,T(!1)},[T]),L=c.useCallback(()=>{window.clearTimeout(f.current),f.current=window.setTimeout(()=>{S.current=!0,T(!0),f.current=0},y)},[y,T]);return c.useEffect(()=>()=>{f.current&&(window.clearTimeout(f.current),f.current=0)},[]),r.jsx(ba,{...p,children:r.jsx(St,{scope:a,contentId:g,open:w,stateAttribute:E,trigger:u,onTriggerChange:h,onTriggerEnter:c.useCallback(()=>{d.isOpenDelayedRef.current?L():v()},[d.isOpenDelayedRef,L,v]),onTriggerLeave:c.useCallback(()=>{C?D():(window.clearTimeout(f.current),f.current=0)},[D,C]),onOpen:v,onClose:D,disableHoverableContent:C,children:e})})};je.displayName=Y;var pe="TooltipTrigger",Le=c.forwardRef((o,a)=>{const{__scopeTooltip:e,...t}=o,s=se(pe,e),l=he(pe,e),n=oe(e),m=c.useRef(null),d=ae(a,m,s.onTriggerChange),p=c.useRef(!1),u=c.useRef(!1),h=c.useCallback(()=>p.current=!1,[]);return c.useEffect(()=>()=>document.removeEventListener("pointerup",h),[h]),r.jsx(Ia,{asChild:!0,...n,children:r.jsx(Da.button,{"aria-describedby":s.open?s.contentId:void 0,"data-state":s.stateAttribute,...t,ref:d,onPointerMove:B(o.onPointerMove,g=>{g.pointerType!=="touch"&&!u.current&&!l.isPointerInTransitRef.current&&(s.onTriggerEnter(),u.current=!0)}),onPointerLeave:B(o.onPointerLeave,()=>{s.onTriggerLeave(),u.current=!1}),onPointerDown:B(o.onPointerDown,()=>{s.open&&s.onClose(),p.current=!0,document.addEventListener("pointerup",h,{once:!0})}),onFocus:B(o.onFocus,()=>{p.current||s.onOpen()}),onBlur:B(o.onBlur,s.onClose),onClick:B(o.onClick,s.onClose)})})});Le.displayName=pe;var xt="TooltipPortal",[No,Ct]=te(xt,{forceMount:void 0}),K="TooltipContent",ke=c.forwardRef((o,a)=>{const e=Ct(K,o.__scopeTooltip),{forceMount:t=e.forceMount,side:s="top",...l}=o,n=se(K,o.__scopeTooltip);return r.jsx(Ra,{present:t||n.open,children:n.disableHoverableContent?r.jsx(Me,{side:s,...l,ref:a}):r.jsx(Et,{side:s,...l,ref:a})})}),Et=c.forwardRef((o,a)=>{const e=se(K,o.__scopeTooltip),t=he(K,o.__scopeTooltip),s=c.useRef(null),l=ae(a,s),[n,m]=c.useState(null),{trigger:d,onClose:p}=e,u=s.current,{onPointerInTransitChange:h}=t,g=c.useCallback(()=>{m(null),h(!1)},[h]),f=c.useCallback((C,y)=>{const S=C.currentTarget,w={x:C.clientX,y:C.clientY},T=Dt(w,S.getBoundingClientRect()),E=Rt(w,T),v=wt(y.getBoundingClientRect()),D=Ot([...E,...v]);m(D),h(!0)},[h]);return c.useEffect(()=>()=>g(),[g]),c.useEffect(()=>{if(d&&u){const C=S=>f(S,u),y=S=>f(S,d);return d.addEventListener("pointerleave",C),u.addEventListener("pointerleave",y),()=>{d.removeEventListener("pointerleave",C),u.removeEventListener("pointerleave",y)}}},[d,u,f,g]),c.useEffect(()=>{if(n){const C=y=>{const S=y.target,w={x:y.clientX,y:y.clientY},T=(d==null?void 0:d.contains(S))||(u==null?void 0:u.contains(S)),E=!Nt(w,n);T?g():E&&(g(),p())};return document.addEventListener("pointermove",C),()=>document.removeEventListener("pointermove",C)}},[d,u,n,p,g]),r.jsx(Me,{...o,ref:l})}),[yt,Tt]=te(Y,{isInside:!1}),bt=Re("TooltipContent"),Me=c.forwardRef((o,a)=>{const{__scopeTooltip:e,children:t,"aria-label":s,onEscapeKeyDown:l,onPointerDownOutside:n,...m}=o,d=se(K,e),p=oe(e),{onClose:u}=d;return c.useEffect(()=>(document.addEventListener(me,u),()=>document.removeEventListener(me,u)),[u]),c.useEffect(()=>{if(d.trigger){const h=g=>{const f=g.target;f!=null&&f.contains(d.trigger)&&u()};return window.addEventListener("scroll",h,{capture:!0}),()=>window.removeEventListener("scroll",h,{capture:!0})}},[d.trigger,u]),r.jsx(wa,{asChild:!0,disableOutsidePointerEvents:!1,onEscapeKeyDown:l,onPointerDownOutside:n,onFocusOutside:h=>h.preventDefault(),onDismiss:u,children:r.jsxs(Na,{"data-state":d.stateAttribute,...p,...m,ref:a,style:{...m.style,"--radix-tooltip-content-transform-origin":"var(--radix-popper-transform-origin)","--radix-tooltip-content-available-width":"var(--radix-popper-available-width)","--radix-tooltip-content-available-height":"var(--radix-popper-available-height)","--radix-tooltip-trigger-width":"var(--radix-popper-anchor-width)","--radix-tooltip-trigger-height":"var(--radix-popper-anchor-height)"},children:[r.jsx(bt,{children:t}),r.jsx(yt,{scope:e,isInside:!0,children:r.jsx(Oa,{id:d.contentId,role:"tooltip",children:s||t})})]})})});ke.displayName=K;var ze="TooltipArrow",It=c.forwardRef((o,a)=>{const{__scopeTooltip:e,...t}=o,s=oe(e);return Tt(ze,e).isInside?null:r.jsx(Pa,{...s,...t,ref:a})});It.displayName=ze;function Dt(o,a){const e=Math.abs(a.top-o.y),t=Math.abs(a.bottom-o.y),s=Math.abs(a.right-o.x),l=Math.abs(a.left-o.x);switch(Math.min(e,t,s,l)){case l:return"left";case s:return"right";case e:return"top";case t:return"bottom";default:throw new Error("unreachable")}}function Rt(o,a,e=5){const t=[];switch(a){case"top":t.push({x:o.x-e,y:o.y+e},{x:o.x+e,y:o.y+e});break;case"bottom":t.push({x:o.x-e,y:o.y-e},{x:o.x+e,y:o.y-e});break;case"left":t.push({x:o.x+e,y:o.y-e},{x:o.x+e,y:o.y+e});break;case"right":t.push({x:o.x-e,y:o.y-e},{x:o.x-e,y:o.y+e});break}return t}function wt(o){const{top:a,right:e,bottom:t,left:s}=o;return[{x:s,y:a},{x:e,y:a},{x:e,y:t},{x:s,y:t}]}function Nt(o,a){const{x:e,y:t}=o;let s=!1;for(let l=0,n=a.length-1;l<a.length;n=l++){const m=a[l],d=a[n],p=m.x,u=m.y,h=d.x,g=d.y;u>t!=g>t&&e<(h-p)*(t-u)/(g-u)+p&&(s=!s)}return s}function Ot(o){const a=o.slice();return a.sort((e,t)=>e.x<t.x?-1:e.x>t.x?1:e.y<t.y?-1:e.y>t.y?1:0),Pt(a)}function Pt(o){if(o.length<=1)return o.slice();const a=[];for(let t=0;t<o.length;t++){const s=o[t];for(;a.length>=2;){const l=a[a.length-1],n=a[a.length-2];if((l.x-n.x)*(s.y-n.y)>=(l.y-n.y)*(s.x-n.x))a.pop();else break}a.push(s)}a.pop();const e=[];for(let t=o.length-1;t>=0;t--){const s=o[t];for(;e.length>=2;){const l=e[e.length-1],n=e[e.length-2];if((l.x-n.x)*(s.y-n.y)>=(l.y-n.y)*(s.x-n.x))e.pop();else break}e.push(s)}return e.pop(),a.length===1&&e.length===1&&a[0].x===e[0].x&&a[0].y===e[0].y?a:a.concat(e)}var _t=_e,jt=je,Lt=Le,Ge=ke;const kt=_t,Mt=jt,zt=Lt,$e=c.forwardRef(({className:o,sideOffset:a=4,...e},t)=>r.jsx(Ge,{ref:t,sideOffset:a,className:P("z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",o),...e}));$e.displayName=Ge.displayName;const Gt=`
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
`;function $t(o){const a=/```campaign-create\s*\n([\s\S]*?)```/,e=o.match(a);if(!e)return null;try{const t=JSON.parse(e[1].trim());return!t.name||!t.platform||!t.budgetTotal||!t.startDate?(console.error("Campaign data missing required fields"),null):["Google Ads","Meta","LinkedIn"].includes(t.platform)?{action:"create_campaign",data:{name:t.name,platform:t.platform,budgetTotal:Number(t.budgetTotal),startDate:t.startDate,endDate:t.endDate||void 0,objective:t.objective||"Conversões"}}:(console.error("Invalid platform:",t.platform),null)}catch(t){return console.error("Failed to parse campaign data:",t),null}}function Ft(o){return o.replace(/```campaign-create\s*\n[\s\S]*?```/g,"").trim()}const qt=`
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
`;class Vt{constructor(a){ne(this,"userId");this.userId=a}async executeSQL(a){try{if(/DROP|TRUNCATE|DELETE\s+FROM\s+"User"|DELETE\s+FROM\s+"Campaign"/i.test(a))return{success:!1,error:"Query perigosa detectada. Confirmação necessária.",message:"⚠️ Esta query pode ser destrutiva. Por favor, confirme explicitamente."};const{data:t,error:s}=await O.rpc("execute_admin_query",{query_text:a});return s?{success:!1,error:s.message,message:`❌ Erro ao executar SQL: ${s.message}`}:{success:!0,data:t,message:`✅ Query executada com sucesso. ${Array.isArray(t)?t.length:0} registros retornados.`}}catch(e){return{success:!1,error:e.message,message:`❌ Erro: ${e.message}`}}}async analyzeSystem(a,e){try{let t="",s="";switch(a){case"metrics":t=`
            SELECT 
              (SELECT COUNT(*) FROM "User") as total_users,
              (SELECT COUNT(*) FROM "Campaign") as total_campaigns,
              (SELECT COUNT(*) FROM "ChatMessage") as total_messages,
              (SELECT COUNT(*) FROM "AiConnection") as total_connections
          `,s="📊 Métricas gerais do sistema";break;case"performance":t=`
            SELECT 
              AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_response_time,
              COUNT(*) as total_requests
            FROM "ChatMessage"
            WHERE created_at >= NOW() - INTERVAL '${e==="24h"?"1 day":e==="7d"?"7 days":"30 days"}'
          `,s="⚡ Análise de performance";break;case"usage":t=`
            SELECT 
              DATE(created_at) as date,
              COUNT(*) as messages_count
            FROM "ChatMessage"
            WHERE created_at >= NOW() - INTERVAL '${e==="24h"?"1 day":e==="7d"?"7 days":"30 days"}'
            GROUP BY DATE(created_at)
            ORDER BY date DESC
          `,s="📈 Análise de uso";break;case"errors":return{success:!0,data:{errors:0},message:"✅ Sistema de logging de erros a ser implementado"}}const{data:l,error:n}=await O.rpc("execute_admin_query",{query_text:t});if(n)throw n;return{success:!0,data:l,message:`${s} - Período: ${e}`}}catch(t){return{success:!1,error:t.message,message:`❌ Erro ao analisar sistema: ${t.message}`}}}async manageIntegration(a,e,t){try{switch(a){case"test":return{success:!0,message:`🔍 Testando integração com ${e}... (A implementar com APIs reais)`,data:{status:"pending"}};case"connect":const{data:s,error:l}=await O.from("Integration").insert({userId:this.userId,platform:e.toUpperCase(),credentials:t||{},isConnected:!1,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}).select().single();if(l)throw l;return{success:!0,data:s,message:`✅ Integração com ${e} iniciada. Configure as credenciais.`};case"disconnect":return await O.from("Integration").update({isConnected:!1}).eq("platform",e.toUpperCase()).eq("userId",this.userId),{success:!0,message:`✅ Integração com ${e} desconectada.`};default:return{success:!1,error:"Ação desconhecida",message:"❌ Ação não reconhecida"}}}catch(s){return{success:!1,error:s.message,message:`❌ Erro ao gerenciar integração: ${s.message}`}}}async getMetrics(a,e,t){try{let s="",l="*";switch(a){case"users":s="User";break;case"campaigns":s="Campaign";break;case"messages":s="ChatMessage";break;default:return{success:!1,error:"Métrica desconhecida",message:"❌ Métrica não reconhecida"}}const n=`
        SELECT 
          DATE_TRUNC('${t}', created_at) as period,
          ${e==="count"?"COUNT(*)":e==="sum"?"SUM(1)":"AVG(1)"} as value
        FROM "${s}"
        GROUP BY period
        ORDER BY period DESC
        LIMIT 30
      `,{data:m,error:d}=await O.rpc("execute_admin_query",{query_text:n});if(d)throw d;return{success:!0,data:m,message:`📊 Métricas de ${a} agrupadas por ${t}`}}catch(s){return{success:!1,error:s.message,message:`❌ Erro ao obter métricas: ${s.message}`}}}}function Ut(o){const a=/```admin-sql\s*\n([\s\S]*?)```/,e=o.match(a);return e?e[1].trim():null}function Ht(o){const a=/```admin-analyze\s*\n([\s\S]*?)```/,e=o.match(a);if(!e)return null;try{return JSON.parse(e[1].trim())}catch{return null}}function Bt(o){const a=/```admin-integration\s*\n([\s\S]*?)```/,e=o.match(a);if(!e)return null;try{return JSON.parse(e[1].trim())}catch{return null}}function Wt(o){const a=/```admin-metrics\s*\n([\s\S]*?)```/,e=o.match(a);if(!e)return null;try{return JSON.parse(e[1].trim())}catch{return null}}function Kt(o){return o.replace(/```admin-sql\s*\n[\s\S]*?```/g,"").replace(/```admin-analyze\s*\n[\s\S]*?```/g,"").replace(/```admin-integration\s*\n[\s\S]*?```/g,"").replace(/```admin-metrics\s*\n[\s\S]*?```/g,"").replace(/```admin-logs\s*\n[\s\S]*?```/g,"").replace(/```admin-test-api\s*\n[\s\S]*?```/g,"").replace(/```admin-debug\s*\n[\s\S]*?```/g,"").trim()}function Qt(o){const a=/```integration-connect:(\w+)```/,e=o.match(a);return e?{action:"connect",slug:e[1]}:null}function Yt(o){const a=/```integration-disconnect:(\w+)```/,e=o.match(a);return e?{action:"disconnect",slug:e[1]}:null}function Xt(o){const a=/```integration-status(?::(\w+))?```/,e=o.match(a);return e?{action:"status",slug:e[1]}:null}function Jt(o){return Qt(o)||Yt(o)||Xt(o)}function Zt(o){return o.replace(/```integration-connect:\w+```/g,"").replace(/```integration-disconnect:\w+```/g,"").replace(/```integration-status(?::\w+)?```/g,"").trim()}const eo=`
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
`,ao=`
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
`;class to{constructor(a){ne(this,"userId");this.userId=a}async auditIntegration(a){try{const{data:e,error:t}=await O.from("Integration").select("*").eq("userId",this.userId).eq("platform",a).single();if(t&&t.code!=="PGRST116")throw t;const s=this.getCapabilities(a),l=e&&e.isConnected?"connected":"disconnected",n={platform:a,status:l,lastSync:(e==null?void 0:e.lastSyncAt)||void 0,capabilities:s,issues:this.detectIssues(e,a),recommendations:this.getRecommendations(l,a)};return{success:!0,data:n,message:this.formatAuditMessage(n)}}catch(e){return{success:!1,error:e.message,message:`❌ Erro ao auditar ${a}: ${e.message}`}}}async auditAll(){try{const a=["META_ADS","GOOGLE_ADS","LINKEDIN_ADS","TIKTOK_ADS","TWITTER_ADS"],e=[];for(const t of a){const s=await this.auditIntegration(t);s.success&&s.data&&e.push(s.data)}return{success:!0,data:e,message:this.formatAllAuditsMessage(e)}}catch(a){return{success:!1,error:a.message,message:`❌ Erro ao auditar integrações: ${a.message}`}}}async listStatus(){try{const{data:a,error:e}=await O.from("Integration").select("platform, isConnected, lastSyncAt").eq("userId",this.userId);if(e)throw e;const t=new Map((a==null?void 0:a.map(n=>[n.platform,n]))||[]),l=["META_ADS","GOOGLE_ADS","LINKEDIN_ADS","TIKTOK_ADS","TWITTER_ADS"].map(n=>{var m,d;return{platform:n,status:t.has(n)&&((m=t.get(n))!=null&&m.isConnected)?"✅ Conectada":"❌ Desconectada",lastSync:((d=t.get(n))==null?void 0:d.lastSyncAt)||"Nunca"}});return{success:!0,data:l,message:this.formatStatusList(l)}}catch(a){return{success:!1,error:a.message,message:`❌ Erro ao listar status: ${a.message}`}}}getCapabilities(a){return{META_ADS:["Criar campanhas de Facebook e Instagram","Segmentação avançada de audiência","Análise de performance em tempo real","Otimização automática de orçamento","A/B testing de criativos","Remarketing e lookalike audiences"],GOOGLE_ADS:["Campanhas de Pesquisa (Search)","Anúncios Display e YouTube","Shopping Ads para e-commerce","Campanhas Performance Max","Análise de conversões e ROI","Smart Bidding automático"],LINKEDIN_ADS:["Anúncios B2B segmentados","Targeting por cargo e empresa","Lead Gen Forms nativos","InMail patrocinado","Análise de engajamento profissional","Retargeting de visitantes"],TIKTOK_ADS:["Vídeos In-Feed","TopView e Brand Takeover","Spark Ads (boost orgânico)","Segmentação por interesse e comportamento","Píxel de conversão","Catálogo de produtos"],TWITTER_ADS:["Tweets promovidos","Segmentação por hashtags e interesse","Audiências customizadas","Análise de engajamento","Campanhas de instalação de app","Vídeos e carrosséis"]}[a]||["Capacidades a definir"]}detectIssues(a,e){const t=[];if(!a)return t.push("Integração não configurada"),t;if(a.isConnected||t.push("Integração desconectada - configure credenciais"),(!a.credentials||Object.keys(a.credentials).length===0)&&t.push("Credenciais não configuradas"),a.lastSync){const s=new Date(a.lastSync),l=(Date.now()-s.getTime())/(1e3*60*60);l>24&&t.push(`Última sincronização há ${Math.floor(l)} horas - pode estar desatualizado`)}return t}getRecommendations(a,e){const t=[];return a==="disconnected"&&(t.push(`Conecte ${this.formatPlatformName(e)} em: Configurações → Integrações`),t.push("Configure sua chave de API para começar a usar")),a==="connected"&&(t.push("✅ Integração ativa! Você já pode criar campanhas"),t.push("Explore as capacidades disponíveis desta plataforma")),t}formatPlatformName(a){return{META_ADS:"Meta Ads (Facebook/Instagram)",GOOGLE_ADS:"Google Ads",LINKEDIN_ADS:"LinkedIn Ads",TIKTOK_ADS:"TikTok Ads",TWITTER_ADS:"Twitter Ads (X)"}[a]||a}formatAuditMessage(a){let t=`
**${a.status==="connected"?"✅":"❌"} ${this.formatPlatformName(a.platform)}**
`;return t+=`Status: ${a.status==="connected"?"✅ Conectada":"❌ Desconectada"}
`,a.lastSync&&(t+=`Última sincronização: ${a.lastSync}
`),t+=`
**Capacidades:**
`,a.capabilities.forEach(s=>{t+=`• ${s}
`}),a.issues&&a.issues.length>0&&(t+=`
**⚠️ Problemas detectados:**
`,a.issues.forEach(s=>{t+=`• ${s}
`})),a.recommendations&&a.recommendations.length>0&&(t+=`
**💡 Recomendações:**
`,a.recommendations.forEach(s=>{t+=`• ${s}
`})),t}formatAllAuditsMessage(a){let e=`
# 🔍 AUDITORIA COMPLETA DE INTEGRAÇÕES

`;const t=a.filter(l=>l.status==="connected").length,s=a.length;return e+=`**Resumo:** ${t}/${s} integrações ativas

`,e+=`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`,a.forEach(l=>{e+=this.formatAuditMessage(l),e+=`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`}),t<s?(e+=`
**🎯 Próximos Passos:**
`,e+=`1. Conecte as ${s-t} integrações pendentes
`,e+=`2. Configure suas chaves de API
`,e+=`3. Teste cada integração antes de criar campanhas
`):e+=`
**🎉 Parabéns!** Todas as integrações estão configuradas e funcionando!
`,e}formatStatusList(a){let e=`
**📊 Status das Integrações:**

`;return a.forEach(t=>{e+=`${t.status} **${this.formatPlatformName(t.platform)}**
`,e+=`   └─ Última sync: ${t.lastSync}

`}),e}}function oo(o){const a=/```integration-action\s*\n([\s\S]*?)```/,e=o.match(a);if(!e)return null;try{return JSON.parse(e[1].trim())}catch{return null}}function so(o){return o.replace(/```integration-action\s*\n[\s\S]*?```/g,"").trim()}function ro(o,a){const e=o.toLowerCase(),t=a.toLowerCase(),s=(e.includes("auditor")||e.includes("verificar")||e.includes("status")||e.includes("listar"))&&(e.includes("integra")||e.includes("conex")||e.includes("plataforma")),l=t.includes("vou")&&(t.includes("auditor")||t.includes("verificar"));if(!s||!l)return null;const n={facebook:"META_ADS",instagram:"META_ADS",meta:"META_ADS",google:"GOOGLE_ADS",linkedin:"LINKEDIN_ADS",tiktok:"TIKTOK_ADS",twitter:"TWITTER_ADS"};for(const[m,d]of Object.entries(n))if(e.includes(m))return{action:"audit",platform:d};return{action:"audit_all"}}var Fe="AlertDialog",[no]=Ie(Fe,[Ne]),M=Ne(),qe=o=>{const{__scopeAlertDialog:a,...e}=o,t=M(a);return r.jsx(Ga,{...t,...e,modal:!0})};qe.displayName=Fe;var io="AlertDialogTrigger",Ve=c.forwardRef((o,a)=>{const{__scopeAlertDialog:e,...t}=o,s=M(e);return r.jsx($a,{...s,...t,ref:a})});Ve.displayName=io;var co="AlertDialogPortal",Ue=o=>{const{__scopeAlertDialog:a,...e}=o,t=M(a);return r.jsx(Fa,{...t,...e})};Ue.displayName=co;var lo="AlertDialogOverlay",He=c.forwardRef((o,a)=>{const{__scopeAlertDialog:e,...t}=o,s=M(e);return r.jsx(Ba,{...s,...t,ref:a})});He.displayName=lo;var W="AlertDialogContent",[uo,mo]=no(W),po=Re("AlertDialogContent"),Be=c.forwardRef((o,a)=>{const{__scopeAlertDialog:e,children:t,...s}=o,l=M(e),n=c.useRef(null),m=ae(a,n),d=c.useRef(null);return r.jsx(qa,{contentName:W,titleName:We,docsSlug:"alert-dialog",children:r.jsx(uo,{scope:e,cancelRef:d,children:r.jsxs(Va,{role:"alertdialog",...l,...s,ref:m,onOpenAutoFocus:B(s.onOpenAutoFocus,p=>{var u;p.preventDefault(),(u=d.current)==null||u.focus({preventScroll:!0})}),onPointerDownOutside:p=>p.preventDefault(),onInteractOutside:p=>p.preventDefault(),children:[r.jsx(po,{children:t}),r.jsx(fo,{contentRef:n})]})})})});Be.displayName=W;var We="AlertDialogTitle",Ke=c.forwardRef((o,a)=>{const{__scopeAlertDialog:e,...t}=o,s=M(e);return r.jsx(Ua,{...s,...t,ref:a})});Ke.displayName=We;var Qe="AlertDialogDescription",Ye=c.forwardRef((o,a)=>{const{__scopeAlertDialog:e,...t}=o,s=M(e);return r.jsx(Ha,{...s,...t,ref:a})});Ye.displayName=Qe;var go="AlertDialogAction",Xe=c.forwardRef((o,a)=>{const{__scopeAlertDialog:e,...t}=o,s=M(e);return r.jsx(Oe,{...s,...t,ref:a})});Xe.displayName=go;var Je="AlertDialogCancel",Ze=c.forwardRef((o,a)=>{const{__scopeAlertDialog:e,...t}=o,{cancelRef:s}=mo(Je,e),l=M(e),n=ae(a,s);return r.jsx(Oe,{...l,...t,ref:n})});Ze.displayName=Je;var fo=({contentRef:o})=>{const a=`\`${W}\` requires a description for the component to be accessible for screen reader users.

You can add a description to the \`${W}\` by passing a \`${Qe}\` component as a child, which also benefits sighted users by adding visible context to the dialog.

Alternatively, you can use your own component as a description by assigning it an \`id\` and passing the same value to the \`aria-describedby\` prop in \`${W}\`. If the description is confusing or duplicative for sighted users, you can use the \`@radix-ui/react-visually-hidden\` primitive as a wrapper around your description component.

For more information, see https://radix-ui.com/primitives/docs/components/alert-dialog`;return c.useEffect(()=>{var t;document.getElementById((t=o.current)==null?void 0:t.getAttribute("aria-describedby"))||console.warn(a)},[a,o]),null},ho=qe,vo=Ve,Ao=Ue,ea=He,aa=Be,ta=Xe,oa=Ze,sa=Ke,ra=Ye;const So=ho,xo=vo,Co=Ao,na=c.forwardRef(({className:o,...a},e)=>r.jsx(ea,{className:P("fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",o),...a,ref:e}));na.displayName=ea.displayName;const ia=c.forwardRef(({className:o,...a},e)=>r.jsxs(Co,{children:[r.jsx(na,{}),r.jsx(aa,{ref:e,className:P("fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",o),...a})]}));ia.displayName=aa.displayName;const ca=({className:o,...a})=>r.jsx("div",{className:P("flex flex-col space-y-2 text-center sm:text-left",o),...a});ca.displayName="AlertDialogHeader";const la=({className:o,...a})=>r.jsx("div",{className:P("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",o),...a});la.displayName="AlertDialogFooter";const da=c.forwardRef(({className:o,...a},e)=>r.jsx(sa,{ref:e,className:P("text-lg font-semibold",o),...a}));da.displayName=sa.displayName;const ua=c.forwardRef(({className:o,...a},e)=>r.jsx(ra,{ref:e,className:P("text-sm text-muted-foreground",o),...a}));ua.displayName=ra.displayName;const ma=c.forwardRef(({className:o,...a},e)=>r.jsx(ta,{ref:e,className:P(we(),o),...a}));ma.displayName=ta.displayName;const pa=c.forwardRef(({className:o,...a},e)=>r.jsx(oa,{ref:e,className:P(we({variant:"outline"}),"mt-2 sm:mt-0",o),...a}));pa.displayName=oa.displayName;const Eo=["Criar campanha de Facebook Ads","Analisar performance da última semana","Sugerir otimizações"],ee=500,Oo=()=>{const[o,a]=c.useState(""),[e,t]=c.useState(!0),[s,l]=c.useState(null),n=_a(i=>i.user),m=$(i=>i.conversations),d=$(i=>i.activeConversationId),p=$(i=>i.setActiveConversationId),u=$(i=>i.isAssistantTyping),h=$(i=>i.setAssistantTyping),g=$(i=>i.addMessage),f=$(i=>i.deleteConversation),C=$(i=>i.createNewConversation),y=ja(i=>i.addCampaign),S=be(i=>i.aiSystemPrompt),w=be(i=>i.aiInitialGreetings),T=c.useRef(null),E=c.useRef(null),{toast:v}=La(),D=m.find(i=>i.id===d),L=()=>{var i;(i=T.current)==null||i.scrollIntoView({behavior:"smooth"})};c.useEffect(L,[D==null?void 0:D.messages,u]),c.useEffect(()=>{(async()=>{if(n!=null&&n.organizationId)try{const{data:b,error:z}=await O.from("OrganizationAiConnection").select("globalAiConnectionId").eq("organizationId",n.organizationId).eq("isDefault",!0).single();if(z&&z.code!=="PGRST116"){console.error("Erro ao buscar IA da organização:",z);return}let G=b==null?void 0:b.globalAiConnectionId;if(!G){const{data:R}=await O.from("OrganizationAiConnection").select("globalAiConnectionId").eq("organizationId",n.organizationId).limit(1).single();G=R==null?void 0:R.globalAiConnectionId}if(!G){const{data:R}=await O.from("GlobalAiConnection").select("id").eq("isActive",!0).limit(1).single();G=R==null?void 0:R.id}if(G){const{data:R,error:re}=await O.from("GlobalAiConnection").select("systemPrompt, initialGreetings").eq("id",G).single();if(re){console.error("Erro ao buscar config da IA:",re);return}R&&l({systemPrompt:R.systemPrompt||S,initialGreetings:R.initialGreetings||w})}}catch(b){console.error("Erro ao carregar IA Global:",b)}})()},[n==null?void 0:n.organizationId]);const F=async()=>{if(o.trim()===""||!d||o.length>ee)return;const i=o;n&&g(n.id,d,{id:`msg-${Date.now()}`,role:"user",content:i}),a(""),h(!0);try{const b=m.find(A=>A.id===d),z=(s==null?void 0:s.systemPrompt)||S,G=qt+`

`+Gt+`

`+eo+`

`+ao+`

`+z,R=((b==null?void 0:b.messages)||[]).slice(-20).map(A=>({role:A.role,content:A.content})),k=(await za(i,R,G)).response,q=$t(k);if(q)try{n&&(await y(n.id,{name:q.data.name,platform:q.data.platform,status:"Pausada",budgetTotal:q.data.budgetTotal,budgetSpent:0,impressions:0,clicks:0,conversions:0,startDate:q.data.startDate,endDate:q.data.endDate||"",ctr:0,cpc:0}),v({title:"🎉 Campanha Criada!",description:`A campanha "${q.data.name}" foi criada com sucesso.`}))}catch(A){console.error("Error creating campaign from AI:",A),v({title:"Erro ao criar campanha",description:"Não foi possível criar a campanha automaticamente.",variant:"destructive"})}let ve="";if(n){const A=new Vt(n.id),_=Ut(k);if(_){const x=await A.executeSQL(_);v({title:x.success?"✅ SQL Executado":"❌ Erro SQL",description:x.message,variant:x.success?"default":"destructive"})}const Q=Ht(k);if(Q){const x=await A.analyzeSystem(Q.type,Q.period);v({title:x.success?"📊 Análise Concluída":"❌ Erro",description:x.message,variant:x.success?"default":"destructive"})}const X=Bt(k);if(X){const x=await A.manageIntegration(X.action,X.platform,X.credentials);v({title:x.success?"🔗 Integração Atualizada":"❌ Erro",description:x.message,variant:x.success?"default":"destructive"})}const J=Wt(k);if(J){const x=await A.getMetrics(J.metric,J.aggregation,J.groupBy);v({title:x.success?"📈 Métricas Obtidas":"❌ Erro",description:x.message,variant:x.success?"default":"destructive"})}let U=oo(k);if(U||(U=ro(i,k)),U){const x=new to(n.id);let j;switch(U.action){case"audit":U.platform&&(j=await x.auditIntegration(U.platform));break;case"audit_all":j=await x.auditAll();break;case"list_status":j=await x.listStatus();break;case"test":case"capabilities":case"diagnose":j={success:!0,message:`Ação "${U.action}" detectada. Implementação em andamento.`};break}j&&(ve=`

`+j.message,v({title:j.success?"✅ Ação Executada":"❌ Erro",description:j.success?"Auditoria concluída com sucesso":j.error||"Erro ao executar ação",variant:j.success?"default":"destructive"}))}}const N=Jt(k);if(N&&n)try{if(N.action==="connect"){const{authUrl:A}=await Z.generateOAuthUrl(N.slug,n.id),_=le[N.slug];n&&g(n.id,d,{id:`msg-${Date.now()+1}`,role:"assistant",content:`Para conectar ${_.name}, clique no link abaixo:

🔗 [Autorizar ${_.name}](${A})

O link abrirá em uma nova aba para você autorizar o acesso.`}),window.open(A,"_blank"),v({title:"🔗 Link de Autorização",description:`Clique no link para conectar ${_.name}`});return}else if(N.action==="disconnect"){await Z.disconnect(n.id,N.slug);const A=le[N.slug];v({title:"✅ Desconectado",description:`${A.name} foi desconectado com sucesso.`})}else if(N.action==="status")if(N.slug){const A=await Z.getIntegrationStatus(n.id,N.slug),_=le[N.slug];v({title:`${_.name}`,description:A!=null&&A.isConnected?"✅ Conectado":"❌ Não conectado"})}else{const A=await Z.listIntegrations(n.id),_=A.filter(Q=>Q.isConnected).length;v({title:"📊 Status das Integrações",description:`${_} de ${A.length} integrações conectadas`})}}catch(A){console.error("Erro ao processar integração:",A),n&&g(n.id,d,{id:`msg-${Date.now()+2}`,role:"assistant",content:`❌ **Erro ao conectar integração**

${A.message||"Erro ao processar comando de integração"}`}),v({title:"❌ Erro na Integração",description:"Verifique as instruções no chat",variant:"destructive"})}let V=Ft(k);V=Kt(V),V=Zt(V),V=so(V),n&&g(n.id,d,{id:`msg-${Date.now()+1}`,role:"assistant",content:V+ve})}catch(b){console.error("Erro ao chamar IA:",b),v({title:"Erro ao gerar resposta",description:b.message||"Não foi possível obter resposta da IA. Verifique sua chave de API.",variant:"destructive"}),n&&g(n.id,d,{id:`msg-${Date.now()+1}`,role:"assistant",content:"❌ Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, verifique se sua chave de API está configurada corretamente nas configurações."})}finally{h(!1)}},ga=i=>{a(i)},fa=()=>{var i;(i=E.current)==null||i.click()},ha=i=>{var z;const b=(z=i.target.files)==null?void 0:z[0];b&&v({title:"Arquivo Selecionado",description:`O arquivo "${b.name}" está pronto para ser enviado (simulação).`,variant:"info"}),i.target&&(i.target.value="")},va=i=>{f(i),v({title:"Conversa Apagada",description:"A conversa foi removida do seu histórico.",variant:"destructive"})};return r.jsxs("div",{className:"flex h-full",children:[r.jsx(Ae,{className:P("transition-all duration-300 ease-in-out hidden sm:block border-0",e?"w-80":"w-0 min-w-0 opacity-0 overflow-hidden"),children:r.jsxs(ka,{className:"p-2 h-full overflow-y-auto flex flex-col",children:[r.jsxs("div",{className:"flex items-center justify-between p-2 mb-2",children:[r.jsx("h2",{className:"text-lg font-semibold",children:"Conversas"}),r.jsx(H,{variant:"ghost",size:"icon",onClick:()=>{C(),v({title:"Nova conversa criada!",description:"Comece a conversar com a IA."})},title:"Nova Conversa",children:r.jsx(Wa,{className:"h-4 w-4"})})]}),r.jsx("div",{className:"space-y-1 flex-1 overflow-y-auto",children:m.map(i=>r.jsxs("div",{className:"group relative",children:[r.jsx(H,{variant:d===i.id?"secondary":"ghost",className:"w-full justify-start truncate pr-8",onClick:()=>p(i.id),children:i.title}),r.jsxs(So,{children:[r.jsx(xo,{asChild:!0,children:r.jsx(H,{variant:"ghost",size:"icon",className:"absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity",children:r.jsx(Ka,{className:"h-4 w-4 text-muted-foreground hover:text-destructive"})})}),r.jsxs(ia,{children:[r.jsxs(ca,{children:[r.jsx(da,{children:"Apagar conversa?"}),r.jsxs(ua,{children:['Tem a certeza que quer apagar a conversa "',i.title,'"? Esta ação não pode ser desfeita.']})]}),r.jsxs(la,{children:[r.jsx(pa,{children:"Cancelar"}),r.jsx(ma,{variant:"destructive",onClick:()=>va(i.id),children:"Apagar"})]})]})]})]},i.id))})]})}),r.jsx("div",{className:"flex-1 flex flex-col sm:pl-4 h-full",children:r.jsxs(Ae,{className:"flex-1 flex flex-col overflow-hidden rounded-none sm:rounded-2xl border-0",children:[r.jsxs("div",{className:"flex-1 p-4 sm:p-6 space-y-4 overflow-y-auto",children:[r.jsx(kt,{children:r.jsxs(Mt,{children:[r.jsx(zt,{asChild:!0,children:r.jsx(H,{variant:"ghost",size:"icon",className:"absolute top-20 left-2 hidden sm:flex",onClick:()=>t(!e),children:e?r.jsx(Ya,{}):r.jsx(Xa,{})})}),r.jsx($e,{children:r.jsx("p",{children:e?"Fechar painel":"Abrir painel"})})]})}),D?r.jsxs(r.Fragment,{children:[D.messages.map(i=>r.jsxs("div",{className:`flex items-start gap-3 ${i.role==="user"?"justify-end":""}`,children:[i.role==="assistant"&&r.jsx(ie,{className:"h-8 w-8",children:r.jsx(ce,{children:r.jsx(Se,{size:18})})}),r.jsx("div",{className:`rounded-2xl p-3 max-w-lg ${i.role==="user"?"bg-primary text-primary-foreground":"bg-muted"}`,children:r.jsx("p",{className:"text-sm whitespace-pre-wrap",children:i.content})}),i.role==="user"&&r.jsx(ie,{className:"h-8 w-8",children:r.jsx(ce,{children:r.jsx(Ma,{size:18})})})]},i.id)),u&&r.jsxs("div",{className:"flex items-start gap-3",children:[r.jsx(ie,{className:"h-8 w-8",children:r.jsx(ce,{children:r.jsx(Se,{size:18})})}),r.jsxs("div",{className:"rounded-2xl p-3 bg-muted flex items-center space-x-1",children:[r.jsx("span",{className:"h-2 w-2 bg-foreground rounded-full animate-bounce [animation-delay:-0.3s]"}),r.jsx("span",{className:"h-2 w-2 bg-foreground rounded-full animate-bounce [animation-delay:-0.15s]"}),r.jsx("span",{className:"h-2 w-2 bg-foreground rounded-full animate-bounce"})]})]}),r.jsx("div",{ref:T})]}):r.jsx("div",{className:"flex items-center justify-center h-full text-muted-foreground",children:r.jsx("p",{children:"Selecione ou crie uma conversa para começar."})})]}),r.jsxs("div",{className:"p-2 sm:p-4 border-t bg-card/50 backdrop-blur-sm",children:[r.jsx("div",{className:"hidden sm:flex gap-2 mb-2",children:Eo.map(i=>r.jsx(H,{variant:"outline",size:"sm",onClick:()=>ga(i),children:i},i))}),r.jsxs("div",{className:"relative",children:[r.jsx(ft,{value:o,onChange:i=>a(i.target.value),onKeyDown:i=>{i.key==="Enter"&&!i.shiftKey&&(i.preventDefault(),F())},placeholder:"Digite sua mensagem...",className:"w-full resize-none rounded-lg border bg-background p-3 pr-24 min-h-[48px]",minRows:1,maxRows:5,maxLength:ee}),r.jsxs("div",{className:"absolute right-2 top-1/2 -translate-y-1/2 flex gap-1",children:[r.jsx("input",{type:"file",ref:E,onChange:ha,className:"hidden"}),r.jsx(H,{type:"button",size:"icon",variant:"ghost",onClick:fa,children:r.jsx(Ja,{className:"h-5 w-5"})}),r.jsx(H,{type:"submit",size:"icon",onClick:F,disabled:o.trim()==="",children:r.jsx(Qa,{className:"h-5 w-5"})})]})]}),r.jsxs("p",{className:P("text-xs text-right mt-1",o.length>ee?"text-destructive":"text-muted-foreground"),children:[o.length," / ",ee]})]})]})})]})};export{Oo as default};
