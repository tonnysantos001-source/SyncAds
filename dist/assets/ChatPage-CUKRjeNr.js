var gt=Object.defineProperty;var ft=(s,t,e)=>t in s?gt(s,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):s[t]=e;var se=(s,t,e)=>ft(s,typeof t!="symbol"?t+"":t,e);import{c as ue,r as l,R as ie,Z as ht,_ as vt,$ as At,j as r,y as Te,v as ye,z as St,w as xt,x as Ct,A as Z,E as Et,P as Tt,D as F,F as yt,O as bt,Q as It,a0 as be,a1 as Dt,S as Rt,o as N,s as q,U as Ie,u as wt,a2 as k,a3 as Nt,f as Ot,g as fe,l as Pt,B as G,a4 as oe,a5 as re,a as he,a6 as _t,a7 as jt}from"./index-DKyyon9m.js";import{i as X,I as ne}from"./integrationsService-Be2MD1H1.js";import{c as De,R as Lt,T as kt,P as Mt,W as $t,C as zt,a as Gt,D as Ft,b as Re,O as qt}from"./index-CbDtDFJK.js";import{P as Vt}from"./plus-C-xQBfxh.js";import{T as Ut}from"./trash-2-MxrUktQg.js";import{S as Ht}from"./send-Dcr5Pxxj.js";/**
 * @license lucide-react v0.417.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Bt=ue("PanelLeftClose",[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",key:"afitv7"}],["path",{d:"M9 3v18",key:"fh3hqa"}],["path",{d:"m16 15-3-3 3-3",key:"14y99z"}]]);/**
 * @license lucide-react v0.417.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Wt=ue("PanelLeftOpen",[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",key:"afitv7"}],["path",{d:"M9 3v18",key:"fh3hqa"}],["path",{d:"m14 9 3 3-3 3",key:"8010ee"}]]);/**
 * @license lucide-react v0.417.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Kt=ue("Paperclip",[["path",{d:"m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48",key:"1u3ebp"}]]);function ce(){return ce=Object.assign?Object.assign.bind():function(s){for(var t=1;t<arguments.length;t++){var e=arguments[t];for(var a in e)({}).hasOwnProperty.call(e,a)&&(s[a]=e[a])}return s},ce.apply(null,arguments)}function Qt(s,t){if(s==null)return{};var e={};for(var a in s)if({}.hasOwnProperty.call(s,a)){if(t.indexOf(a)!==-1)continue;e[a]=s[a]}return e}var Yt=l.useLayoutEffect,Xt=function(t){var e=ie.useRef(t);return Yt(function(){e.current=t}),e},ve=function(t,e){if(typeof t=="function"){t(e);return}t.current=e},Jt=function(t,e){var a=ie.useRef();return ie.useCallback(function(o){t.current=o,a.current&&ve(a.current,null),a.current=e,e&&ve(e,o)},[e])},Ae={"min-height":"0","max-height":"none",height:"0",visibility:"hidden",overflow:"hidden",position:"absolute","z-index":"-1000",top:"0",right:"0",display:"block"},Zt=function(t){Object.keys(Ae).forEach(function(e){t.style.setProperty(e,Ae[e],"important")})},Se=Zt,y=null,xe=function(t,e){var a=t.scrollHeight;return e.sizingStyle.boxSizing==="border-box"?a+e.borderSize:a-e.paddingSize};function ea(s,t,e,a){e===void 0&&(e=1),a===void 0&&(a=1/0),y||(y=document.createElement("textarea"),y.setAttribute("tabindex","-1"),y.setAttribute("aria-hidden","true"),Se(y)),y.parentNode===null&&document.body.appendChild(y);var o=s.paddingSize,c=s.borderSize,n=s.sizingStyle,p=n.boxSizing;Object.keys(n).forEach(function(S){var f=S;y.style[f]=n[f]}),Se(y),y.value=t;var d=xe(y,s);y.value=t,d=xe(y,s),y.value="x";var m=y.scrollHeight-o,u=m*e;p==="border-box"&&(u=u+o+c),d=Math.max(u,d);var h=m*a;return p==="border-box"&&(h=h+o+c),d=Math.min(h,d),[d,m]}var Ce=function(){},ta=function(t,e){return t.reduce(function(a,o){return a[o]=e[o],a},{})},aa=["borderBottomWidth","borderLeftWidth","borderRightWidth","borderTopWidth","boxSizing","fontFamily","fontSize","fontStyle","fontWeight","letterSpacing","lineHeight","paddingBottom","paddingLeft","paddingRight","paddingTop","tabSize","textIndent","textRendering","textTransform","width","wordBreak","wordSpacing","scrollbarGutter"],sa=!!document.documentElement.currentStyle,oa=function(t){var e=window.getComputedStyle(t);if(e===null)return null;var a=ta(aa,e),o=a.boxSizing;if(o==="")return null;sa&&o==="border-box"&&(a.width=parseFloat(a.width)+parseFloat(a.borderRightWidth)+parseFloat(a.borderLeftWidth)+parseFloat(a.paddingRight)+parseFloat(a.paddingLeft)+"px");var c=parseFloat(a.paddingBottom)+parseFloat(a.paddingTop),n=parseFloat(a.borderBottomWidth)+parseFloat(a.borderTopWidth);return{sizingStyle:a,paddingSize:c,borderSize:n}},ra=oa;function me(s,t,e){var a=Xt(e);l.useLayoutEffect(function(){var o=function(n){return a.current(n)};if(s)return s.addEventListener(t,o),function(){return s.removeEventListener(t,o)}},[])}var na=function(t,e){me(document.body,"reset",function(a){t.current.form===a.target&&e(a)})},ia=function(t){me(window,"resize",t)},ca=function(t){me(document.fonts,"loadingdone",t)},la=["cacheMeasurements","maxRows","minRows","onChange","onHeightChange"],da=function(t,e){var a=t.cacheMeasurements,o=t.maxRows,c=t.minRows,n=t.onChange,p=n===void 0?Ce:n,d=t.onHeightChange,m=d===void 0?Ce:d,u=Qt(t,la),h=u.value!==void 0,S=l.useRef(null),f=Jt(S,e),T=l.useRef(0),C=l.useRef(),x=function(){var v=S.current,I=a&&C.current?C.current:ra(v);if(I){C.current=I;var D=ea(I,v.value||v.placeholder||"x",c,o),_=D[0],V=D[1];T.current!==_&&(T.current=_,v.style.setProperty("height",_+"px","important"),m(_,{rowHeight:V}))}},b=function(v){h||x(),p(v)};return l.useLayoutEffect(x),na(S,function(){if(!h){var g=S.current.value;requestAnimationFrame(function(){var v=S.current;v&&g!==v.value&&x()})}}),ia(x),ca(x),l.createElement("textarea",ce({},u,{onChange:b,ref:f}))},ua=l.forwardRef(da);const ma={emailSummary:!0,emailAlerts:!0,emailNews:!1,pushMentions:!0,pushIntegrations:!1,pushSuggestions:!0},Ee=ht()(vt(s=>({aiSystemPrompt:"Você é o SyncAds AI, um assistente de marketing digital especializado em otimização de campanhas. Seja proativo, criativo e forneça insights baseados em dados. Suas respostas devem ser claras, concisas e sempre focadas em ajudar o usuário a atingir seus objetivos de marketing.",aiInitialGreetings:["Olá! 👋 Sou o SyncAds AI, seu assistente de marketing digital. Como posso ajudar você hoje?","Oi! Estou aqui para ajudar a otimizar suas campanhas. O que gostaria de fazer?","Bem-vindo! Pronto para criar campanhas incríveis? Por onde começamos?"],isTwoFactorEnabled:!1,notificationSettings:ma,setAiSystemPrompt:t=>s({aiSystemPrompt:t}),setAiInitialGreetings:t=>s({aiInitialGreetings:t}),addAiGreeting:t=>s(e=>({aiInitialGreetings:[...e.aiInitialGreetings,t]})),removeAiGreeting:t=>s(e=>({aiInitialGreetings:e.aiInitialGreetings.filter((a,o)=>o!==t)})),updateAiGreeting:(t,e)=>s(a=>({aiInitialGreetings:a.aiInitialGreetings.map((o,c)=>c===t?e:o)})),setTwoFactorEnabled:t=>s({isTwoFactorEnabled:t}),updateNotificationSettings:t=>s(e=>({notificationSettings:{...e.notificationSettings,...t}}))}),{name:"settings-storage",storage:At(()=>localStorage),partialize:s=>({aiSystemPrompt:s.aiSystemPrompt,aiInitialGreetings:s.aiInitialGreetings,isTwoFactorEnabled:s.isTwoFactorEnabled,notificationSettings:s.notificationSettings})}));var[ee]=Te("Tooltip",[ye]),te=ye(),we="TooltipProvider",pa=700,le="tooltip.open",[ga,pe]=ee(we),Ne=s=>{const{__scopeTooltip:t,delayDuration:e=pa,skipDelayDuration:a=300,disableHoverableContent:o=!1,children:c}=s,n=l.useRef(!0),p=l.useRef(!1),d=l.useRef(0);return l.useEffect(()=>{const m=d.current;return()=>window.clearTimeout(m)},[]),r.jsx(ga,{scope:t,isOpenDelayedRef:n,delayDuration:e,onOpen:l.useCallback(()=>{window.clearTimeout(d.current),n.current=!1},[]),onClose:l.useCallback(()=>{window.clearTimeout(d.current),d.current=window.setTimeout(()=>n.current=!0,a)},[a]),isPointerInTransitRef:p,onPointerInTransitChange:l.useCallback(m=>{p.current=m},[]),disableHoverableContent:o,children:c})};Ne.displayName=we;var W="Tooltip",[fa,ae]=ee(W),Oe=s=>{const{__scopeTooltip:t,children:e,open:a,defaultOpen:o,onOpenChange:c,disableHoverableContent:n,delayDuration:p}=s,d=pe(W,s.__scopeTooltip),m=te(t),[u,h]=l.useState(null),S=St(),f=l.useRef(0),T=n??d.disableHoverableContent,C=p??d.delayDuration,x=l.useRef(!1),[b,g]=xt({prop:a,defaultProp:o??!1,onChange:V=>{V?(d.onOpen(),document.dispatchEvent(new CustomEvent(le))):d.onClose(),c==null||c(V)},caller:W}),v=l.useMemo(()=>b?x.current?"delayed-open":"instant-open":"closed",[b]),I=l.useCallback(()=>{window.clearTimeout(f.current),f.current=0,x.current=!1,g(!0)},[g]),D=l.useCallback(()=>{window.clearTimeout(f.current),f.current=0,g(!1)},[g]),_=l.useCallback(()=>{window.clearTimeout(f.current),f.current=window.setTimeout(()=>{x.current=!0,g(!0),f.current=0},C)},[C,g]);return l.useEffect(()=>()=>{f.current&&(window.clearTimeout(f.current),f.current=0)},[]),r.jsx(Ct,{...m,children:r.jsx(fa,{scope:t,contentId:S,open:b,stateAttribute:v,trigger:u,onTriggerChange:h,onTriggerEnter:l.useCallback(()=>{d.isOpenDelayedRef.current?_():I()},[d.isOpenDelayedRef,_,I]),onTriggerLeave:l.useCallback(()=>{T?D():(window.clearTimeout(f.current),f.current=0)},[D,T]),onOpen:I,onClose:D,disableHoverableContent:T,children:e})})};Oe.displayName=W;var de="TooltipTrigger",Pe=l.forwardRef((s,t)=>{const{__scopeTooltip:e,...a}=s,o=ae(de,e),c=pe(de,e),n=te(e),p=l.useRef(null),d=Z(t,p,o.onTriggerChange),m=l.useRef(!1),u=l.useRef(!1),h=l.useCallback(()=>m.current=!1,[]);return l.useEffect(()=>()=>document.removeEventListener("pointerup",h),[h]),r.jsx(Et,{asChild:!0,...n,children:r.jsx(Tt.button,{"aria-describedby":o.open?o.contentId:void 0,"data-state":o.stateAttribute,...a,ref:d,onPointerMove:F(s.onPointerMove,S=>{S.pointerType!=="touch"&&!u.current&&!c.isPointerInTransitRef.current&&(o.onTriggerEnter(),u.current=!0)}),onPointerLeave:F(s.onPointerLeave,()=>{o.onTriggerLeave(),u.current=!1}),onPointerDown:F(s.onPointerDown,()=>{o.open&&o.onClose(),m.current=!0,document.addEventListener("pointerup",h,{once:!0})}),onFocus:F(s.onFocus,()=>{m.current||o.onOpen()}),onBlur:F(s.onBlur,o.onClose),onClick:F(s.onClick,o.onClose)})})});Pe.displayName=de;var ha="TooltipPortal",[Is,va]=ee(ha,{forceMount:void 0}),H="TooltipContent",_e=l.forwardRef((s,t)=>{const e=va(H,s.__scopeTooltip),{forceMount:a=e.forceMount,side:o="top",...c}=s,n=ae(H,s.__scopeTooltip);return r.jsx(yt,{present:a||n.open,children:n.disableHoverableContent?r.jsx(je,{side:o,...c,ref:t}):r.jsx(Aa,{side:o,...c,ref:t})})}),Aa=l.forwardRef((s,t)=>{const e=ae(H,s.__scopeTooltip),a=pe(H,s.__scopeTooltip),o=l.useRef(null),c=Z(t,o),[n,p]=l.useState(null),{trigger:d,onClose:m}=e,u=o.current,{onPointerInTransitChange:h}=a,S=l.useCallback(()=>{p(null),h(!1)},[h]),f=l.useCallback((T,C)=>{const x=T.currentTarget,b={x:T.clientX,y:T.clientY},g=Ta(b,x.getBoundingClientRect()),v=ya(b,g),I=ba(C.getBoundingClientRect()),D=Da([...v,...I]);p(D),h(!0)},[h]);return l.useEffect(()=>()=>S(),[S]),l.useEffect(()=>{if(d&&u){const T=x=>f(x,u),C=x=>f(x,d);return d.addEventListener("pointerleave",T),u.addEventListener("pointerleave",C),()=>{d.removeEventListener("pointerleave",T),u.removeEventListener("pointerleave",C)}}},[d,u,f,S]),l.useEffect(()=>{if(n){const T=C=>{const x=C.target,b={x:C.clientX,y:C.clientY},g=(d==null?void 0:d.contains(x))||(u==null?void 0:u.contains(x)),v=!Ia(b,n);g?S():v&&(S(),m())};return document.addEventListener("pointermove",T),()=>document.removeEventListener("pointermove",T)}},[d,u,n,m,S]),r.jsx(je,{...s,ref:c})}),[Sa,xa]=ee(W,{isInside:!1}),Ca=be("TooltipContent"),je=l.forwardRef((s,t)=>{const{__scopeTooltip:e,children:a,"aria-label":o,onEscapeKeyDown:c,onPointerDownOutside:n,...p}=s,d=ae(H,e),m=te(e),{onClose:u}=d;return l.useEffect(()=>(document.addEventListener(le,u),()=>document.removeEventListener(le,u)),[u]),l.useEffect(()=>{if(d.trigger){const h=S=>{const f=S.target;f!=null&&f.contains(d.trigger)&&u()};return window.addEventListener("scroll",h,{capture:!0}),()=>window.removeEventListener("scroll",h,{capture:!0})}},[d.trigger,u]),r.jsx(bt,{asChild:!0,disableOutsidePointerEvents:!1,onEscapeKeyDown:c,onPointerDownOutside:n,onFocusOutside:h=>h.preventDefault(),onDismiss:u,children:r.jsxs(It,{"data-state":d.stateAttribute,...m,...p,ref:t,style:{...p.style,"--radix-tooltip-content-transform-origin":"var(--radix-popper-transform-origin)","--radix-tooltip-content-available-width":"var(--radix-popper-available-width)","--radix-tooltip-content-available-height":"var(--radix-popper-available-height)","--radix-tooltip-trigger-width":"var(--radix-popper-anchor-width)","--radix-tooltip-trigger-height":"var(--radix-popper-anchor-height)"},children:[r.jsx(Ca,{children:a}),r.jsx(Sa,{scope:e,isInside:!0,children:r.jsx(Dt,{id:d.contentId,role:"tooltip",children:o||a})})]})})});_e.displayName=H;var Le="TooltipArrow",Ea=l.forwardRef((s,t)=>{const{__scopeTooltip:e,...a}=s,o=te(e);return xa(Le,e).isInside?null:r.jsx(Rt,{...o,...a,ref:t})});Ea.displayName=Le;function Ta(s,t){const e=Math.abs(t.top-s.y),a=Math.abs(t.bottom-s.y),o=Math.abs(t.right-s.x),c=Math.abs(t.left-s.x);switch(Math.min(e,a,o,c)){case c:return"left";case o:return"right";case e:return"top";case a:return"bottom";default:throw new Error("unreachable")}}function ya(s,t,e=5){const a=[];switch(t){case"top":a.push({x:s.x-e,y:s.y+e},{x:s.x+e,y:s.y+e});break;case"bottom":a.push({x:s.x-e,y:s.y-e},{x:s.x+e,y:s.y-e});break;case"left":a.push({x:s.x+e,y:s.y-e},{x:s.x+e,y:s.y+e});break;case"right":a.push({x:s.x-e,y:s.y-e},{x:s.x-e,y:s.y+e});break}return a}function ba(s){const{top:t,right:e,bottom:a,left:o}=s;return[{x:o,y:t},{x:e,y:t},{x:e,y:a},{x:o,y:a}]}function Ia(s,t){const{x:e,y:a}=s;let o=!1;for(let c=0,n=t.length-1;c<t.length;n=c++){const p=t[c],d=t[n],m=p.x,u=p.y,h=d.x,S=d.y;u>a!=S>a&&e<(h-m)*(a-u)/(S-u)+m&&(o=!o)}return o}function Da(s){const t=s.slice();return t.sort((e,a)=>e.x<a.x?-1:e.x>a.x?1:e.y<a.y?-1:e.y>a.y?1:0),Ra(t)}function Ra(s){if(s.length<=1)return s.slice();const t=[];for(let a=0;a<s.length;a++){const o=s[a];for(;t.length>=2;){const c=t[t.length-1],n=t[t.length-2];if((c.x-n.x)*(o.y-n.y)>=(c.y-n.y)*(o.x-n.x))t.pop();else break}t.push(o)}t.pop();const e=[];for(let a=s.length-1;a>=0;a--){const o=s[a];for(;e.length>=2;){const c=e[e.length-1],n=e[e.length-2];if((c.x-n.x)*(o.y-n.y)>=(c.y-n.y)*(o.x-n.x))e.pop();else break}e.push(o)}return e.pop(),t.length===1&&e.length===1&&t[0].x===e[0].x&&t[0].y===e[0].y?t:t.concat(e)}var wa=Ne,Na=Oe,Oa=Pe,ke=_e;const Pa=wa,_a=Na,ja=Oa,Me=l.forwardRef(({className:s,sideOffset:t=4,...e},a)=>r.jsx(ke,{ref:a,sideOffset:t,className:N("z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",s),...e}));Me.displayName=ke.displayName;const La=`
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
`;function ka(s){const t=/```campaign-create\s*\n([\s\S]*?)```/,e=s.match(t);if(!e)return null;try{const a=JSON.parse(e[1].trim());return!a.name||!a.platform||!a.budgetTotal||!a.startDate?(console.error("Campaign data missing required fields"),null):["Google Ads","Meta","LinkedIn"].includes(a.platform)?{action:"create_campaign",data:{name:a.name,platform:a.platform,budgetTotal:Number(a.budgetTotal),startDate:a.startDate,endDate:a.endDate||void 0,objective:a.objective||"Conversões"}}:(console.error("Invalid platform:",a.platform),null)}catch(a){return console.error("Failed to parse campaign data:",a),null}}function Ma(s){return s.replace(/```campaign-create\s*\n[\s\S]*?```/g,"").trim()}const $a=`
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
`;class za{constructor(t){se(this,"userId");this.userId=t}async executeSQL(t){try{if(/DROP|TRUNCATE|DELETE\s+FROM\s+"User"|DELETE\s+FROM\s+"Campaign"/i.test(t))return{success:!1,error:"Query perigosa detectada. Confirmação necessária.",message:"⚠️ Esta query pode ser destrutiva. Por favor, confirme explicitamente."};const{data:a,error:o}=await q.rpc("execute_admin_query",{query_text:t});return o?{success:!1,error:o.message,message:`❌ Erro ao executar SQL: ${o.message}`}:{success:!0,data:a,message:`✅ Query executada com sucesso. ${Array.isArray(a)?a.length:0} registros retornados.`}}catch(e){return{success:!1,error:e.message,message:`❌ Erro: ${e.message}`}}}async analyzeSystem(t,e){try{let a="",o="";switch(t){case"metrics":a=`
            SELECT 
              (SELECT COUNT(*) FROM "User") as total_users,
              (SELECT COUNT(*) FROM "Campaign") as total_campaigns,
              (SELECT COUNT(*) FROM "ChatMessage") as total_messages,
              (SELECT COUNT(*) FROM "AiConnection") as total_connections
          `,o="📊 Métricas gerais do sistema";break;case"performance":a=`
            SELECT 
              AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_response_time,
              COUNT(*) as total_requests
            FROM "ChatMessage"
            WHERE created_at >= NOW() - INTERVAL '${e==="24h"?"1 day":e==="7d"?"7 days":"30 days"}'
          `,o="⚡ Análise de performance";break;case"usage":a=`
            SELECT 
              DATE(created_at) as date,
              COUNT(*) as messages_count
            FROM "ChatMessage"
            WHERE created_at >= NOW() - INTERVAL '${e==="24h"?"1 day":e==="7d"?"7 days":"30 days"}'
            GROUP BY DATE(created_at)
            ORDER BY date DESC
          `,o="📈 Análise de uso";break;case"errors":return{success:!0,data:{errors:0},message:"✅ Sistema de logging de erros a ser implementado"}}const{data:c,error:n}=await q.rpc("execute_admin_query",{query_text:a});if(n)throw n;return{success:!0,data:c,message:`${o} - Período: ${e}`}}catch(a){return{success:!1,error:a.message,message:`❌ Erro ao analisar sistema: ${a.message}`}}}async manageIntegration(t,e,a){try{switch(t){case"test":return{success:!0,message:`🔍 Testando integração com ${e}... (A implementar com APIs reais)`,data:{status:"pending"}};case"connect":const{data:o,error:c}=await q.from("Integration").insert({userId:this.userId,platform:e.toUpperCase(),credentials:a||{},isConnected:!1,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}).select().single();if(c)throw c;return{success:!0,data:o,message:`✅ Integração com ${e} iniciada. Configure as credenciais.`};case"disconnect":return await q.from("Integration").update({isConnected:!1}).eq("platform",e.toUpperCase()).eq("userId",this.userId),{success:!0,message:`✅ Integração com ${e} desconectada.`};default:return{success:!1,error:"Ação desconhecida",message:"❌ Ação não reconhecida"}}}catch(o){return{success:!1,error:o.message,message:`❌ Erro ao gerenciar integração: ${o.message}`}}}async getMetrics(t,e,a){try{let o="",c="*";switch(t){case"users":o="User";break;case"campaigns":o="Campaign";break;case"messages":o="ChatMessage";break;default:return{success:!1,error:"Métrica desconhecida",message:"❌ Métrica não reconhecida"}}const n=`
        SELECT 
          DATE_TRUNC('${a}', created_at) as period,
          ${e==="count"?"COUNT(*)":e==="sum"?"SUM(1)":"AVG(1)"} as value
        FROM "${o}"
        GROUP BY period
        ORDER BY period DESC
        LIMIT 30
      `,{data:p,error:d}=await q.rpc("execute_admin_query",{query_text:n});if(d)throw d;return{success:!0,data:p,message:`📊 Métricas de ${t} agrupadas por ${a}`}}catch(o){return{success:!1,error:o.message,message:`❌ Erro ao obter métricas: ${o.message}`}}}}function Ga(s){const t=/```admin-sql\s*\n([\s\S]*?)```/,e=s.match(t);return e?e[1].trim():null}function Fa(s){const t=/```admin-analyze\s*\n([\s\S]*?)```/,e=s.match(t);if(!e)return null;try{return JSON.parse(e[1].trim())}catch{return null}}function qa(s){const t=/```admin-integration\s*\n([\s\S]*?)```/,e=s.match(t);if(!e)return null;try{return JSON.parse(e[1].trim())}catch{return null}}function Va(s){const t=/```admin-metrics\s*\n([\s\S]*?)```/,e=s.match(t);if(!e)return null;try{return JSON.parse(e[1].trim())}catch{return null}}function Ua(s){return s.replace(/```admin-sql\s*\n[\s\S]*?```/g,"").replace(/```admin-analyze\s*\n[\s\S]*?```/g,"").replace(/```admin-integration\s*\n[\s\S]*?```/g,"").replace(/```admin-metrics\s*\n[\s\S]*?```/g,"").replace(/```admin-logs\s*\n[\s\S]*?```/g,"").replace(/```admin-test-api\s*\n[\s\S]*?```/g,"").replace(/```admin-debug\s*\n[\s\S]*?```/g,"").trim()}function Ha(s){const t=/```integration-connect:(\w+)```/,e=s.match(t);return e?{action:"connect",slug:e[1]}:null}function Ba(s){const t=/```integration-disconnect:(\w+)```/,e=s.match(t);return e?{action:"disconnect",slug:e[1]}:null}function Wa(s){const t=/```integration-status(?::(\w+))?```/,e=s.match(t);return e?{action:"status",slug:e[1]}:null}function Ka(s){return Ha(s)||Ba(s)||Wa(s)}function Qa(s){return s.replace(/```integration-connect:\w+```/g,"").replace(/```integration-disconnect:\w+```/g,"").replace(/```integration-status(?::\w+)?```/g,"").trim()}const Ya=`
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
`,Xa=`
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
`;class Ja{constructor(t){se(this,"userId");this.userId=t}async auditIntegration(t){try{const{data:e,error:a}=await q.from("Integration").select("*").eq("userId",this.userId).eq("platform",t).single();if(a&&a.code!=="PGRST116")throw a;const o=this.getCapabilities(t),c=e&&e.isConnected?"connected":"disconnected",n={platform:t,status:c,lastSync:(e==null?void 0:e.lastSyncAt)||void 0,capabilities:o,issues:this.detectIssues(e,t),recommendations:this.getRecommendations(c,t)};return{success:!0,data:n,message:this.formatAuditMessage(n)}}catch(e){return{success:!1,error:e.message,message:`❌ Erro ao auditar ${t}: ${e.message}`}}}async auditAll(){try{const t=["META_ADS","GOOGLE_ADS","LINKEDIN_ADS","TIKTOK_ADS","TWITTER_ADS"],e=[];for(const a of t){const o=await this.auditIntegration(a);o.success&&o.data&&e.push(o.data)}return{success:!0,data:e,message:this.formatAllAuditsMessage(e)}}catch(t){return{success:!1,error:t.message,message:`❌ Erro ao auditar integrações: ${t.message}`}}}async listStatus(){try{const{data:t,error:e}=await q.from("Integration").select("platform, isConnected, lastSyncAt").eq("userId",this.userId);if(e)throw e;const a=new Map((t==null?void 0:t.map(n=>[n.platform,n]))||[]),c=["META_ADS","GOOGLE_ADS","LINKEDIN_ADS","TIKTOK_ADS","TWITTER_ADS"].map(n=>{var p,d;return{platform:n,status:a.has(n)&&((p=a.get(n))!=null&&p.isConnected)?"✅ Conectada":"❌ Desconectada",lastSync:((d=a.get(n))==null?void 0:d.lastSyncAt)||"Nunca"}});return{success:!0,data:c,message:this.formatStatusList(c)}}catch(t){return{success:!1,error:t.message,message:`❌ Erro ao listar status: ${t.message}`}}}getCapabilities(t){return{META_ADS:["Criar campanhas de Facebook e Instagram","Segmentação avançada de audiência","Análise de performance em tempo real","Otimização automática de orçamento","A/B testing de criativos","Remarketing e lookalike audiences"],GOOGLE_ADS:["Campanhas de Pesquisa (Search)","Anúncios Display e YouTube","Shopping Ads para e-commerce","Campanhas Performance Max","Análise de conversões e ROI","Smart Bidding automático"],LINKEDIN_ADS:["Anúncios B2B segmentados","Targeting por cargo e empresa","Lead Gen Forms nativos","InMail patrocinado","Análise de engajamento profissional","Retargeting de visitantes"],TIKTOK_ADS:["Vídeos In-Feed","TopView e Brand Takeover","Spark Ads (boost orgânico)","Segmentação por interesse e comportamento","Píxel de conversão","Catálogo de produtos"],TWITTER_ADS:["Tweets promovidos","Segmentação por hashtags e interesse","Audiências customizadas","Análise de engajamento","Campanhas de instalação de app","Vídeos e carrosséis"]}[t]||["Capacidades a definir"]}detectIssues(t,e){const a=[];if(!t)return a.push("Integração não configurada"),a;if(t.isConnected||a.push("Integração desconectada - configure credenciais"),(!t.credentials||Object.keys(t.credentials).length===0)&&a.push("Credenciais não configuradas"),t.lastSync){const o=new Date(t.lastSync),c=(Date.now()-o.getTime())/(1e3*60*60);c>24&&a.push(`Última sincronização há ${Math.floor(c)} horas - pode estar desatualizado`)}return a}getRecommendations(t,e){const a=[];return t==="disconnected"&&(a.push(`Conecte ${this.formatPlatformName(e)} em: Configurações → Integrações`),a.push("Configure sua chave de API para começar a usar")),t==="connected"&&(a.push("✅ Integração ativa! Você já pode criar campanhas"),a.push("Explore as capacidades disponíveis desta plataforma")),a}formatPlatformName(t){return{META_ADS:"Meta Ads (Facebook/Instagram)",GOOGLE_ADS:"Google Ads",LINKEDIN_ADS:"LinkedIn Ads",TIKTOK_ADS:"TikTok Ads",TWITTER_ADS:"Twitter Ads (X)"}[t]||t}formatAuditMessage(t){let a=`
**${t.status==="connected"?"✅":"❌"} ${this.formatPlatformName(t.platform)}**
`;return a+=`Status: ${t.status==="connected"?"✅ Conectada":"❌ Desconectada"}
`,t.lastSync&&(a+=`Última sincronização: ${t.lastSync}
`),a+=`
**Capacidades:**
`,t.capabilities.forEach(o=>{a+=`• ${o}
`}),t.issues&&t.issues.length>0&&(a+=`
**⚠️ Problemas detectados:**
`,t.issues.forEach(o=>{a+=`• ${o}
`})),t.recommendations&&t.recommendations.length>0&&(a+=`
**💡 Recomendações:**
`,t.recommendations.forEach(o=>{a+=`• ${o}
`})),a}formatAllAuditsMessage(t){let e=`
# 🔍 AUDITORIA COMPLETA DE INTEGRAÇÕES

`;const a=t.filter(c=>c.status==="connected").length,o=t.length;return e+=`**Resumo:** ${a}/${o} integrações ativas

`,e+=`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`,t.forEach(c=>{e+=this.formatAuditMessage(c),e+=`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`}),a<o?(e+=`
**🎯 Próximos Passos:**
`,e+=`1. Conecte as ${o-a} integrações pendentes
`,e+=`2. Configure suas chaves de API
`,e+=`3. Teste cada integração antes de criar campanhas
`):e+=`
**🎉 Parabéns!** Todas as integrações estão configuradas e funcionando!
`,e}formatStatusList(t){let e=`
**📊 Status das Integrações:**

`;return t.forEach(a=>{e+=`${a.status} **${this.formatPlatformName(a.platform)}**
`,e+=`   └─ Última sync: ${a.lastSync}

`}),e}}function Za(s){const t=/```integration-action\s*\n([\s\S]*?)```/,e=s.match(t);if(!e)return null;try{return JSON.parse(e[1].trim())}catch{return null}}function es(s){return s.replace(/```integration-action\s*\n[\s\S]*?```/g,"").trim()}function ts(s,t){const e=s.toLowerCase(),a=t.toLowerCase(),o=(e.includes("auditor")||e.includes("verificar")||e.includes("status")||e.includes("listar"))&&(e.includes("integra")||e.includes("conex")||e.includes("plataforma")),c=a.includes("vou")&&(a.includes("auditor")||a.includes("verificar"));if(!o||!c)return null;const n={facebook:"META_ADS",instagram:"META_ADS",meta:"META_ADS",google:"GOOGLE_ADS",linkedin:"LINKEDIN_ADS",tiktok:"TIKTOK_ADS",twitter:"TWITTER_ADS"};for(const[p,d]of Object.entries(n))if(e.includes(p))return{action:"audit",platform:d};return{action:"audit_all"}}var $e="AlertDialog",[as]=Te($e,[De]),L=De(),ze=s=>{const{__scopeAlertDialog:t,...e}=s,a=L(t);return r.jsx(Lt,{...a,...e,modal:!0})};ze.displayName=$e;var ss="AlertDialogTrigger",Ge=l.forwardRef((s,t)=>{const{__scopeAlertDialog:e,...a}=s,o=L(e);return r.jsx(kt,{...o,...a,ref:t})});Ge.displayName=ss;var os="AlertDialogPortal",Fe=s=>{const{__scopeAlertDialog:t,...e}=s,a=L(t);return r.jsx(Mt,{...a,...e})};Fe.displayName=os;var rs="AlertDialogOverlay",qe=l.forwardRef((s,t)=>{const{__scopeAlertDialog:e,...a}=s,o=L(e);return r.jsx(qt,{...o,...a,ref:t})});qe.displayName=rs;var U="AlertDialogContent",[ns,is]=as(U),cs=be("AlertDialogContent"),Ve=l.forwardRef((s,t)=>{const{__scopeAlertDialog:e,children:a,...o}=s,c=L(e),n=l.useRef(null),p=Z(t,n),d=l.useRef(null);return r.jsx($t,{contentName:U,titleName:Ue,docsSlug:"alert-dialog",children:r.jsx(ns,{scope:e,cancelRef:d,children:r.jsxs(zt,{role:"alertdialog",...c,...o,ref:p,onOpenAutoFocus:F(o.onOpenAutoFocus,m=>{var u;m.preventDefault(),(u=d.current)==null||u.focus({preventScroll:!0})}),onPointerDownOutside:m=>m.preventDefault(),onInteractOutside:m=>m.preventDefault(),children:[r.jsx(cs,{children:a}),r.jsx(ds,{contentRef:n})]})})})});Ve.displayName=U;var Ue="AlertDialogTitle",He=l.forwardRef((s,t)=>{const{__scopeAlertDialog:e,...a}=s,o=L(e);return r.jsx(Gt,{...o,...a,ref:t})});He.displayName=Ue;var Be="AlertDialogDescription",We=l.forwardRef((s,t)=>{const{__scopeAlertDialog:e,...a}=s,o=L(e);return r.jsx(Ft,{...o,...a,ref:t})});We.displayName=Be;var ls="AlertDialogAction",Ke=l.forwardRef((s,t)=>{const{__scopeAlertDialog:e,...a}=s,o=L(e);return r.jsx(Re,{...o,...a,ref:t})});Ke.displayName=ls;var Qe="AlertDialogCancel",Ye=l.forwardRef((s,t)=>{const{__scopeAlertDialog:e,...a}=s,{cancelRef:o}=is(Qe,e),c=L(e),n=Z(t,o);return r.jsx(Re,{...c,...a,ref:n})});Ye.displayName=Qe;var ds=({contentRef:s})=>{const t=`\`${U}\` requires a description for the component to be accessible for screen reader users.

You can add a description to the \`${U}\` by passing a \`${Be}\` component as a child, which also benefits sighted users by adding visible context to the dialog.

Alternatively, you can use your own component as a description by assigning it an \`id\` and passing the same value to the \`aria-describedby\` prop in \`${U}\`. If the description is confusing or duplicative for sighted users, you can use the \`@radix-ui/react-visually-hidden\` primitive as a wrapper around your description component.

For more information, see https://radix-ui.com/primitives/docs/components/alert-dialog`;return l.useEffect(()=>{var a;document.getElementById((a=s.current)==null?void 0:a.getAttribute("aria-describedby"))||console.warn(t)},[t,s]),null},us=ze,ms=Ge,ps=Fe,Xe=qe,Je=Ve,Ze=Ke,et=Ye,tt=He,at=We;const gs=us,fs=ms,hs=ps,st=l.forwardRef(({className:s,...t},e)=>r.jsx(Xe,{className:N("fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",s),...t,ref:e}));st.displayName=Xe.displayName;const ot=l.forwardRef(({className:s,...t},e)=>r.jsxs(hs,{children:[r.jsx(st,{}),r.jsx(Je,{ref:e,className:N("fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",s),...t})]}));ot.displayName=Je.displayName;const rt=({className:s,...t})=>r.jsx("div",{className:N("flex flex-col space-y-2 text-center sm:text-left",s),...t});rt.displayName="AlertDialogHeader";const nt=({className:s,...t})=>r.jsx("div",{className:N("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",s),...t});nt.displayName="AlertDialogFooter";const it=l.forwardRef(({className:s,...t},e)=>r.jsx(tt,{ref:e,className:N("text-lg font-semibold",s),...t}));it.displayName=tt.displayName;const ct=l.forwardRef(({className:s,...t},e)=>r.jsx(at,{ref:e,className:N("text-sm text-muted-foreground",s),...t}));ct.displayName=at.displayName;const lt=l.forwardRef(({className:s,...t},e)=>r.jsx(Ze,{ref:e,className:N(Ie(),s),...t}));lt.displayName=Ze.displayName;const dt=l.forwardRef(({className:s,...t},e)=>r.jsx(et,{ref:e,className:N(Ie({variant:"outline"}),"mt-2 sm:mt-0",s),...t}));dt.displayName=et.displayName;const vs=["Criar campanha de Facebook Ads","Analisar performance da última semana","Sugerir otimizações"],J=500,Ds=()=>{const[s,t]=l.useState(""),[e,a]=l.useState(!0),o=wt(i=>i.user),c=k(i=>i.conversations),n=k(i=>i.activeConversationId),p=k(i=>i.setActiveConversationId),d=k(i=>i.isAssistantTyping),m=k(i=>i.setAssistantTyping),u=k(i=>i.addMessage),h=k(i=>i.deleteConversation),S=k(i=>i.createNewConversation),f=Nt(i=>i.addCampaign),T=Ee(i=>i.aiSystemPrompt),C=Ee(i=>i.aiInitialGreetings),x=l.useRef(null),b=l.useRef(null),{toast:g}=Ot(),v=c.find(i=>i.id===n),I=()=>{var i;(i=x.current)==null||i.scrollIntoView({behavior:"smooth"})};l.useEffect(I,[v==null?void 0:v.messages,d]),l.useEffect(()=>{if(v&&v.messages.length===0&&C.length>0){const i=Math.floor(Math.random()*C.length),R=C[i];setTimeout(()=>{o&&u(o.id,n,{id:`greeting-${Date.now()}`,role:"assistant",content:R})},500)}},[n,v==null?void 0:v.messages.length]);const D=async()=>{if(s.trim()===""||!n||s.length>J)return;const i=s;o&&u(o.id,n,{id:`msg-${Date.now()}`,role:"user",content:i}),t(""),m(!0);try{const R=c.find(A=>A.id===n),K=$a+`

`+La+`

`+Ya+`

`+Xa+`

`+T,pt=((R==null?void 0:R.messages)||[]).slice(-20).map(A=>({role:A.role,content:A.content})),j=(await jt(i,pt,K)).response,M=ka(j);if(M)try{o&&(await f(o.id,{name:M.data.name,platform:M.data.platform,status:"Pausada",budgetTotal:M.data.budgetTotal,budgetSpent:0,impressions:0,clicks:0,conversions:0,startDate:M.data.startDate,endDate:M.data.endDate||"",ctr:0,cpc:0}),g({title:"🎉 Campanha Criada!",description:`A campanha "${M.data.name}" foi criada com sucesso.`}))}catch(A){console.error("Error creating campaign from AI:",A),g({title:"Erro ao criar campanha",description:"Não foi possível criar a campanha automaticamente.",variant:"destructive"})}let ge="";if(o){const A=new za(o.id),O=Ga(j);if(O){const E=await A.executeSQL(O);g({title:E.success?"✅ SQL Executado":"❌ Erro SQL",description:E.message,variant:E.success?"default":"destructive"})}const B=Fa(j);if(B){const E=await A.analyzeSystem(B.type,B.period);g({title:E.success?"📊 Análise Concluída":"❌ Erro",description:E.message,variant:E.success?"default":"destructive"})}const Q=qa(j);if(Q){const E=await A.manageIntegration(Q.action,Q.platform,Q.credentials);g({title:E.success?"🔗 Integração Atualizada":"❌ Erro",description:E.message,variant:E.success?"default":"destructive"})}const Y=Va(j);if(Y){const E=await A.getMetrics(Y.metric,Y.aggregation,Y.groupBy);g({title:E.success?"📈 Métricas Obtidas":"❌ Erro",description:E.message,variant:E.success?"default":"destructive"})}let z=Za(j);if(z||(z=ts(i,j)),z){const E=new Ja(o.id);let P;switch(z.action){case"audit":z.platform&&(P=await E.auditIntegration(z.platform));break;case"audit_all":P=await E.auditAll();break;case"list_status":P=await E.listStatus();break;case"test":case"capabilities":case"diagnose":P={success:!0,message:`Ação "${z.action}" detectada. Implementação em andamento.`};break}P&&(ge=`

`+P.message,g({title:P.success?"✅ Ação Executada":"❌ Erro",description:P.success?"Auditoria concluída com sucesso":P.error||"Erro ao executar ação",variant:P.success?"default":"destructive"}))}}const w=Ka(j);if(w&&o)try{if(w.action==="connect"){const{authUrl:A}=await X.generateOAuthUrl(w.slug,o.id),O=ne[w.slug];o&&u(o.id,n,{id:`msg-${Date.now()+1}`,role:"assistant",content:`Para conectar ${O.name}, clique no link abaixo:

🔗 [Autorizar ${O.name}](${A})

O link abrirá em uma nova aba para você autorizar o acesso.`}),window.open(A,"_blank"),g({title:"🔗 Link de Autorização",description:`Clique no link para conectar ${O.name}`});return}else if(w.action==="disconnect"){await X.disconnect(o.id,w.slug);const A=ne[w.slug];g({title:"✅ Desconectado",description:`${A.name} foi desconectado com sucesso.`})}else if(w.action==="status")if(w.slug){const A=await X.getIntegrationStatus(o.id,w.slug),O=ne[w.slug];g({title:`${O.name}`,description:A!=null&&A.isConnected?"✅ Conectado":"❌ Não conectado"})}else{const A=await X.listIntegrations(o.id),O=A.filter(B=>B.isConnected).length;g({title:"📊 Status das Integrações",description:`${O} de ${A.length} integrações conectadas`})}}catch(A){console.error("Erro ao processar integração:",A),o&&u(o.id,n,{id:`msg-${Date.now()+2}`,role:"assistant",content:`❌ **Erro ao conectar integração**

${A.message||"Erro ao processar comando de integração"}`}),g({title:"❌ Erro na Integração",description:"Verifique as instruções no chat",variant:"destructive"})}let $=Ma(j);$=Ua($),$=Qa($),$=es($),o&&u(o.id,n,{id:`msg-${Date.now()+1}`,role:"assistant",content:$+ge})}catch(R){console.error("Erro ao chamar IA:",R),g({title:"Erro ao gerar resposta",description:R.message||"Não foi possível obter resposta da IA. Verifique sua chave de API.",variant:"destructive"}),o&&u(o.id,n,{id:`msg-${Date.now()+1}`,role:"assistant",content:"❌ Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, verifique se sua chave de API está configurada corretamente nas configurações."})}finally{m(!1)}},_=i=>{t(i)},V=()=>{var i;(i=b.current)==null||i.click()},ut=i=>{var K;const R=(K=i.target.files)==null?void 0:K[0];R&&g({title:"Arquivo Selecionado",description:`O arquivo "${R.name}" está pronto para ser enviado (simulação).`,variant:"info"}),i.target&&(i.target.value="")},mt=i=>{h(i),g({title:"Conversa Apagada",description:"A conversa foi removida do seu histórico.",variant:"destructive"})};return r.jsxs("div",{className:"flex h-full",children:[r.jsx(fe,{className:N("transition-all duration-300 ease-in-out hidden sm:block border-0",e?"w-80":"w-0 min-w-0 opacity-0 overflow-hidden"),children:r.jsxs(Pt,{className:"p-2 h-full overflow-y-auto flex flex-col",children:[r.jsxs("div",{className:"flex items-center justify-between p-2 mb-2",children:[r.jsx("h2",{className:"text-lg font-semibold",children:"Conversas"}),r.jsx(G,{variant:"ghost",size:"icon",onClick:()=>{S(),g({title:"Nova conversa criada!",description:"Comece a conversar com a IA."})},title:"Nova Conversa",children:r.jsx(Vt,{className:"h-4 w-4"})})]}),r.jsx("div",{className:"space-y-1 flex-1 overflow-y-auto",children:c.map(i=>r.jsxs("div",{className:"group relative",children:[r.jsx(G,{variant:n===i.id?"secondary":"ghost",className:"w-full justify-start truncate pr-8",onClick:()=>p(i.id),children:i.title}),r.jsxs(gs,{children:[r.jsx(fs,{asChild:!0,children:r.jsx(G,{variant:"ghost",size:"icon",className:"absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity",children:r.jsx(Ut,{className:"h-4 w-4 text-muted-foreground hover:text-destructive"})})}),r.jsxs(ot,{children:[r.jsxs(rt,{children:[r.jsx(it,{children:"Apagar conversa?"}),r.jsxs(ct,{children:['Tem a certeza que quer apagar a conversa "',i.title,'"? Esta ação não pode ser desfeita.']})]}),r.jsxs(nt,{children:[r.jsx(dt,{children:"Cancelar"}),r.jsx(lt,{variant:"destructive",onClick:()=>mt(i.id),children:"Apagar"})]})]})]})]},i.id))})]})}),r.jsx("div",{className:"flex-1 flex flex-col sm:pl-4 h-full",children:r.jsxs(fe,{className:"flex-1 flex flex-col overflow-hidden rounded-none sm:rounded-2xl border-0",children:[r.jsxs("div",{className:"flex-1 p-4 sm:p-6 space-y-4 overflow-y-auto",children:[r.jsx(Pa,{children:r.jsxs(_a,{children:[r.jsx(ja,{asChild:!0,children:r.jsx(G,{variant:"ghost",size:"icon",className:"absolute top-20 left-2 hidden sm:flex",onClick:()=>a(!e),children:e?r.jsx(Bt,{}):r.jsx(Wt,{})})}),r.jsx(Me,{children:r.jsx("p",{children:e?"Fechar painel":"Abrir painel"})})]})}),v?r.jsxs(r.Fragment,{children:[v.messages.map(i=>r.jsxs("div",{className:`flex items-start gap-3 ${i.role==="user"?"justify-end":""}`,children:[i.role==="assistant"&&r.jsx(oe,{className:"h-8 w-8",children:r.jsx(re,{children:r.jsx(he,{size:18})})}),r.jsx("div",{className:`rounded-2xl p-3 max-w-lg ${i.role==="user"?"bg-primary text-primary-foreground":"bg-muted"}`,children:r.jsx("p",{className:"text-sm whitespace-pre-wrap",children:i.content})}),i.role==="user"&&r.jsx(oe,{className:"h-8 w-8",children:r.jsx(re,{children:r.jsx(_t,{size:18})})})]},i.id)),d&&r.jsxs("div",{className:"flex items-start gap-3",children:[r.jsx(oe,{className:"h-8 w-8",children:r.jsx(re,{children:r.jsx(he,{size:18})})}),r.jsxs("div",{className:"rounded-2xl p-3 bg-muted flex items-center space-x-1",children:[r.jsx("span",{className:"h-2 w-2 bg-foreground rounded-full animate-bounce [animation-delay:-0.3s]"}),r.jsx("span",{className:"h-2 w-2 bg-foreground rounded-full animate-bounce [animation-delay:-0.15s]"}),r.jsx("span",{className:"h-2 w-2 bg-foreground rounded-full animate-bounce"})]})]}),r.jsx("div",{ref:x})]}):r.jsx("div",{className:"flex items-center justify-center h-full text-muted-foreground",children:r.jsx("p",{children:"Selecione ou crie uma conversa para começar."})})]}),r.jsxs("div",{className:"p-2 sm:p-4 border-t bg-card/50 backdrop-blur-sm",children:[r.jsx("div",{className:"hidden sm:flex gap-2 mb-2",children:vs.map(i=>r.jsx(G,{variant:"outline",size:"sm",onClick:()=>_(i),children:i},i))}),r.jsxs("div",{className:"relative",children:[r.jsx(ua,{value:s,onChange:i=>t(i.target.value),onKeyDown:i=>{i.key==="Enter"&&!i.shiftKey&&(i.preventDefault(),D())},placeholder:"Digite sua mensagem...",className:"w-full resize-none rounded-lg border bg-background p-3 pr-24 min-h-[48px]",minRows:1,maxRows:5,maxLength:J}),r.jsxs("div",{className:"absolute right-2 top-1/2 -translate-y-1/2 flex gap-1",children:[r.jsx("input",{type:"file",ref:b,onChange:ut,className:"hidden"}),r.jsx(G,{type:"button",size:"icon",variant:"ghost",onClick:V,children:r.jsx(Kt,{className:"h-5 w-5"})}),r.jsx(G,{type:"submit",size:"icon",onClick:D,disabled:s.trim()==="",children:r.jsx(Ht,{className:"h-5 w-5"})})]})]}),r.jsxs("p",{className:N("text-xs text-right mt-1",s.length>J?"text-destructive":"text-muted-foreground"),children:[s.length," / ",J]})]})]})})]})};export{Ds as default};
