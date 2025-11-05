var Pa=Object.defineProperty;var _a=(r,e,t)=>e in r?Pa(r,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):r[e]=t;var ye=(r,e,t)=>_a(r,typeof e!="symbol"?e+"":e,t);import{c as Pe,r as d,R as je,j as a,p as $a,q as sa,t as Ma,v as La,w as qa,x as ra,A as za,y as Ua,z as ee,D as Fa,E as Ga,F as Va,G as Ba,H as Ha,J as Wa,K as me,M as oa,m as re,g as K,l as X,B as _,s as R,o as se,h as Qa,i as Ka,N as Xa,u as He,e as Ja,O as V,Q as Za,f as Ya,X as et,T as at,a as Ne,V as tt}from"./index-Dh38X9aK.js";import{u as We}from"./settingsStore-D-n9n3ul.js";import{G as na,S as st}from"./send-B4yXNH4e.js";import{E as oe}from"./external-link-DHIPkAnN.js";import{C as rt}from"./clock-CVsmsAYL.js";import{D as Te}from"./download-zvcwm-HF.js";import{P as ot}from"./progress-D3dV0_lx.js";import{C as nt,A as it}from"./AiThinkingIndicator-DJPATTd0.js";import{C as Ie}from"./circle-alert-DhIGeeBY.js";import{C as _e}from"./circle-x-BQEMmZF6.js";import{C as ct}from"./circle-check-PCffWn6U.js";import{i as de,I as Ce}from"./integrationsService-BcW_NdXJ.js";import{P as lt}from"./plus-BoakuYv9.js";import{M as dt}from"./message-square-j1C35tj8.js";import{T as ut}from"./trash-2-CYXnFWce.js";import{S as mt}from"./sparkles-DcQ3E_Nk.js";/**
 * @license lucide-react v0.417.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ia=Pe("FileArchive",[["path",{d:"M10 12v-1",key:"v7bkov"}],["path",{d:"M10 18v-2",key:"1cjy8d"}],["path",{d:"M10 7V6",key:"dljcrl"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M15.5 22H18a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v16a2 2 0 0 0 .274 1.01",key:"gkbcor"}],["circle",{cx:"10",cy:"20",r:"2",key:"1xzdoj"}]]);/**
 * @license lucide-react v0.417.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const pt=Pe("Mic",[["path",{d:"M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z",key:"131961"}],["path",{d:"M19 10v2a7 7 0 0 1-14 0v-2",key:"1vc78b"}],["line",{x1:"12",x2:"12",y1:"19",y2:"22",key:"x3vr5v"}]]);/**
 * @license lucide-react v0.417.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const gt=Pe("Paperclip",[["path",{d:"m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48",key:"1u3ebp"}]]);function Re(){return Re=Object.assign?Object.assign.bind():function(r){for(var e=1;e<arguments.length;e++){var t=arguments[e];for(var s in t)({}).hasOwnProperty.call(t,s)&&(r[s]=t[s])}return r},Re.apply(null,arguments)}function ht(r,e){if(r==null)return{};var t={};for(var s in r)if({}.hasOwnProperty.call(r,s)){if(e.indexOf(s)!==-1)continue;t[s]=r[s]}return t}var ft=d.useLayoutEffect,xt=function(e){var t=je.useRef(e);return ft(function(){t.current=e}),t},Qe=function(e,t){if(typeof e=="function"){e(t);return}e.current=t},vt=function(e,t){var s=je.useRef();return je.useCallback(function(o){e.current=o,s.current&&Qe(s.current,null),s.current=t,t&&Qe(t,o)},[t])},Ke={"min-height":"0","max-height":"none",height:"0",visibility:"hidden",overflow:"hidden",position:"absolute","z-index":"-1000",top:"0",right:"0",display:"block"},bt=function(e){Object.keys(Ke).forEach(function(t){e.style.setProperty(t,Ke[t],"important")})},Xe=bt,L=null,Je=function(e,t){var s=e.scrollHeight;return t.sizingStyle.boxSizing==="border-box"?s+t.borderSize:s-t.paddingSize};function St(r,e,t,s){t===void 0&&(t=1),s===void 0&&(s=1/0),L||(L=document.createElement("textarea"),L.setAttribute("tabindex","-1"),L.setAttribute("aria-hidden","true"),Xe(L)),L.parentNode===null&&document.body.appendChild(L);var o=r.paddingSize,i=r.borderSize,l=r.sizingStyle,h=l.boxSizing;Object.keys(l).forEach(function(p){var v=p;L.style[v]=l[v]}),Xe(L),L.value=e;var u=Je(L,r);L.value=e,u=Je(L,r),L.value="x";var S=L.scrollHeight-o,f=S*t;h==="border-box"&&(f=f+o+i),u=Math.max(f,u);var x=S*s;return h==="border-box"&&(x=x+o+i),u=Math.min(x,u),[u,S]}var Ze=function(){},At=function(e,t){return e.reduce(function(s,o){return s[o]=t[o],s},{})},Et=["borderBottomWidth","borderLeftWidth","borderRightWidth","borderTopWidth","boxSizing","fontFamily","fontSize","fontStyle","fontWeight","letterSpacing","lineHeight","paddingBottom","paddingLeft","paddingRight","paddingTop","tabSize","textIndent","textRendering","textTransform","width","wordBreak","wordSpacing","scrollbarGutter"],wt=!!document.documentElement.currentStyle,yt=function(e){var t=window.getComputedStyle(e);if(t===null)return null;var s=At(Et,t),o=s.boxSizing;if(o==="")return null;wt&&o==="border-box"&&(s.width=parseFloat(s.width)+parseFloat(s.borderRightWidth)+parseFloat(s.borderLeftWidth)+parseFloat(s.paddingRight)+parseFloat(s.paddingLeft)+"px");var i=parseFloat(s.paddingBottom)+parseFloat(s.paddingTop),l=parseFloat(s.borderBottomWidth)+parseFloat(s.borderTopWidth);return{sizingStyle:s,paddingSize:i,borderSize:l}},Nt=yt;function $e(r,e,t){var s=xt(t);d.useLayoutEffect(function(){var o=function(l){return s.current(l)};if(r)return r.addEventListener(e,o),function(){return r.removeEventListener(e,o)}},[])}var Ct=function(e,t){$e(document.body,"reset",function(s){e.current.form===s.target&&t(s)})},jt=function(e){$e(window,"resize",e)},Tt=function(e){$e(document.fonts,"loadingdone",e)},It=["cacheMeasurements","maxRows","minRows","onChange","onHeightChange"],Rt=function(e,t){var s=e.cacheMeasurements,o=e.maxRows,i=e.minRows,l=e.onChange,h=l===void 0?Ze:l,u=e.onHeightChange,S=u===void 0?Ze:u,f=ht(e,It),x=f.value!==void 0,p=d.useRef(null),v=vt(p,t),E=d.useRef(0),O=d.useRef(),I=function(){var j=p.current,z=s&&O.current?O.current:Nt(j);if(z){O.current=z;var $=St(z,j.value||j.placeholder||"x",i,o),G=$[0],Z=$[1];E.current!==G&&(E.current=G,j.style.setProperty("height",G+"px","important"),S(G,{rowHeight:Z}))}},q=function(j){x||I(),h(j)};return d.useLayoutEffect(I),Ct(p,function(){if(!x){var N=p.current.value;requestAnimationFrame(function(){var j=p.current;j&&N!==j.value&&I()})}}),jt(I),Tt(I),d.createElement("textarea",Re({},f,{onChange:q,ref:v}))},Ot=d.forwardRef(Rt),[pe]=$a("Tooltip",[sa]),ge=sa(),ca="TooltipProvider",kt=700,Oe="tooltip.open",[Dt,Me]=pe(ca),la=r=>{const{__scopeTooltip:e,delayDuration:t=kt,skipDelayDuration:s=300,disableHoverableContent:o=!1,children:i}=r,l=d.useRef(!0),h=d.useRef(!1),u=d.useRef(0);return d.useEffect(()=>{const S=u.current;return()=>window.clearTimeout(S)},[]),a.jsx(Dt,{scope:e,isOpenDelayedRef:l,delayDuration:t,onOpen:d.useCallback(()=>{window.clearTimeout(u.current),l.current=!1},[]),onClose:d.useCallback(()=>{window.clearTimeout(u.current),u.current=window.setTimeout(()=>l.current=!0,s)},[s]),isPointerInTransitRef:h,onPointerInTransitChange:d.useCallback(S=>{h.current=S},[]),disableHoverableContent:o,children:i})};la.displayName=ca;var ne="Tooltip",[Pt,he]=pe(ne),da=r=>{const{__scopeTooltip:e,children:t,open:s,defaultOpen:o,onOpenChange:i,disableHoverableContent:l,delayDuration:h}=r,u=Me(ne,r.__scopeTooltip),S=ge(e),[f,x]=d.useState(null),p=Ma(),v=d.useRef(0),E=l??u.disableHoverableContent,O=h??u.delayDuration,I=d.useRef(!1),[q,N]=La({prop:s,defaultProp:o??!1,onChange:Z=>{Z?(u.onOpen(),document.dispatchEvent(new CustomEvent(Oe))):u.onClose(),i==null||i(Z)},caller:ne}),j=d.useMemo(()=>q?I.current?"delayed-open":"instant-open":"closed",[q]),z=d.useCallback(()=>{window.clearTimeout(v.current),v.current=0,I.current=!1,N(!0)},[N]),$=d.useCallback(()=>{window.clearTimeout(v.current),v.current=0,N(!1)},[N]),G=d.useCallback(()=>{window.clearTimeout(v.current),v.current=window.setTimeout(()=>{I.current=!0,N(!0),v.current=0},O)},[O,N]);return d.useEffect(()=>()=>{v.current&&(window.clearTimeout(v.current),v.current=0)},[]),a.jsx(qa,{...S,children:a.jsx(Pt,{scope:e,contentId:p,open:q,stateAttribute:j,trigger:f,onTriggerChange:x,onTriggerEnter:d.useCallback(()=>{u.isOpenDelayedRef.current?G():z()},[u.isOpenDelayedRef,G,z]),onTriggerLeave:d.useCallback(()=>{E?$():(window.clearTimeout(v.current),v.current=0)},[$,E]),onOpen:z,onClose:$,disableHoverableContent:E,children:t})})};da.displayName=ne;var ke="TooltipTrigger",ua=d.forwardRef((r,e)=>{const{__scopeTooltip:t,...s}=r,o=he(ke,t),i=Me(ke,t),l=ge(t),h=d.useRef(null),u=ra(e,h,o.onTriggerChange),S=d.useRef(!1),f=d.useRef(!1),x=d.useCallback(()=>S.current=!1,[]);return d.useEffect(()=>()=>document.removeEventListener("pointerup",x),[x]),a.jsx(za,{asChild:!0,...l,children:a.jsx(Ua.button,{"aria-describedby":o.open?o.contentId:void 0,"data-state":o.stateAttribute,...s,ref:u,onPointerMove:ee(r.onPointerMove,p=>{p.pointerType!=="touch"&&!f.current&&!i.isPointerInTransitRef.current&&(o.onTriggerEnter(),f.current=!0)}),onPointerLeave:ee(r.onPointerLeave,()=>{o.onTriggerLeave(),f.current=!1}),onPointerDown:ee(r.onPointerDown,()=>{o.open&&o.onClose(),S.current=!0,document.addEventListener("pointerup",x,{once:!0})}),onFocus:ee(r.onFocus,()=>{S.current||o.onOpen()}),onBlur:ee(r.onBlur,o.onClose),onClick:ee(r.onClick,o.onClose)})})});ua.displayName=ke;var _t="TooltipPortal",[sr,$t]=pe(_t,{forceMount:void 0}),ae="TooltipContent",ma=d.forwardRef((r,e)=>{const t=$t(ae,r.__scopeTooltip),{forceMount:s=t.forceMount,side:o="top",...i}=r,l=he(ae,r.__scopeTooltip);return a.jsx(Fa,{present:s||l.open,children:l.disableHoverableContent?a.jsx(pa,{side:o,...i,ref:e}):a.jsx(Mt,{side:o,...i,ref:e})})}),Mt=d.forwardRef((r,e)=>{const t=he(ae,r.__scopeTooltip),s=Me(ae,r.__scopeTooltip),o=d.useRef(null),i=ra(e,o),[l,h]=d.useState(null),{trigger:u,onClose:S}=t,f=o.current,{onPointerInTransitChange:x}=s,p=d.useCallback(()=>{h(null),x(!1)},[x]),v=d.useCallback((E,O)=>{const I=E.currentTarget,q={x:E.clientX,y:E.clientY},N=Ft(q,I.getBoundingClientRect()),j=Gt(q,N),z=Vt(O.getBoundingClientRect()),$=Ht([...j,...z]);h($),x(!0)},[x]);return d.useEffect(()=>()=>p(),[p]),d.useEffect(()=>{if(u&&f){const E=I=>v(I,f),O=I=>v(I,u);return u.addEventListener("pointerleave",E),f.addEventListener("pointerleave",O),()=>{u.removeEventListener("pointerleave",E),f.removeEventListener("pointerleave",O)}}},[u,f,v,p]),d.useEffect(()=>{if(l){const E=O=>{const I=O.target,q={x:O.clientX,y:O.clientY},N=(u==null?void 0:u.contains(I))||(f==null?void 0:f.contains(I)),j=!Bt(q,l);N?p():j&&(p(),S())};return document.addEventListener("pointermove",E),()=>document.removeEventListener("pointermove",E)}},[u,f,l,S,p]),a.jsx(pa,{...r,ref:i})}),[Lt,qt]=pe(ne,{isInside:!1}),zt=Ba("TooltipContent"),pa=d.forwardRef((r,e)=>{const{__scopeTooltip:t,children:s,"aria-label":o,onEscapeKeyDown:i,onPointerDownOutside:l,...h}=r,u=he(ae,t),S=ge(t),{onClose:f}=u;return d.useEffect(()=>(document.addEventListener(Oe,f),()=>document.removeEventListener(Oe,f)),[f]),d.useEffect(()=>{if(u.trigger){const x=p=>{const v=p.target;v!=null&&v.contains(u.trigger)&&f()};return window.addEventListener("scroll",x,{capture:!0}),()=>window.removeEventListener("scroll",x,{capture:!0})}},[u.trigger,f]),a.jsx(Ga,{asChild:!0,disableOutsidePointerEvents:!1,onEscapeKeyDown:i,onPointerDownOutside:l,onFocusOutside:x=>x.preventDefault(),onDismiss:f,children:a.jsxs(Va,{"data-state":u.stateAttribute,...S,...h,ref:e,style:{...h.style,"--radix-tooltip-content-transform-origin":"var(--radix-popper-transform-origin)","--radix-tooltip-content-available-width":"var(--radix-popper-available-width)","--radix-tooltip-content-available-height":"var(--radix-popper-available-height)","--radix-tooltip-trigger-width":"var(--radix-popper-anchor-width)","--radix-tooltip-trigger-height":"var(--radix-popper-anchor-height)"},children:[a.jsx(zt,{children:s}),a.jsx(Lt,{scope:t,isInside:!0,children:a.jsx(Ha,{id:u.contentId,role:"tooltip",children:o||s})})]})})});ma.displayName=ae;var ga="TooltipArrow",Ut=d.forwardRef((r,e)=>{const{__scopeTooltip:t,...s}=r,o=ge(t);return qt(ga,t).isInside?null:a.jsx(Wa,{...o,...s,ref:e})});Ut.displayName=ga;function Ft(r,e){const t=Math.abs(e.top-r.y),s=Math.abs(e.bottom-r.y),o=Math.abs(e.right-r.x),i=Math.abs(e.left-r.x);switch(Math.min(t,s,o,i)){case i:return"left";case o:return"right";case t:return"top";case s:return"bottom";default:throw new Error("unreachable")}}function Gt(r,e,t=5){const s=[];switch(e){case"top":s.push({x:r.x-t,y:r.y+t},{x:r.x+t,y:r.y+t});break;case"bottom":s.push({x:r.x-t,y:r.y-t},{x:r.x+t,y:r.y-t});break;case"left":s.push({x:r.x+t,y:r.y-t},{x:r.x+t,y:r.y+t});break;case"right":s.push({x:r.x-t,y:r.y-t},{x:r.x-t,y:r.y+t});break}return s}function Vt(r){const{top:e,right:t,bottom:s,left:o}=r;return[{x:o,y:e},{x:t,y:e},{x:t,y:s},{x:o,y:s}]}function Bt(r,e){const{x:t,y:s}=r;let o=!1;for(let i=0,l=e.length-1;i<e.length;l=i++){const h=e[i],u=e[l],S=h.x,f=h.y,x=u.x,p=u.y;f>s!=p>s&&t<(x-S)*(s-f)/(p-f)+S&&(o=!o)}return o}function Ht(r){const e=r.slice();return e.sort((t,s)=>t.x<s.x?-1:t.x>s.x?1:t.y<s.y?-1:t.y>s.y?1:0),Wt(e)}function Wt(r){if(r.length<=1)return r.slice();const e=[];for(let s=0;s<r.length;s++){const o=r[s];for(;e.length>=2;){const i=e[e.length-1],l=e[e.length-2];if((i.x-l.x)*(o.y-l.y)>=(i.y-l.y)*(o.x-l.x))e.pop();else break}e.push(o)}e.pop();const t=[];for(let s=r.length-1;s>=0;s--){const o=r[s];for(;t.length>=2;){const i=t[t.length-1],l=t[t.length-2];if((i.x-l.x)*(o.y-l.y)>=(i.y-l.y)*(o.x-l.x))t.pop();else break}t.push(o)}return t.pop(),e.length===1&&t.length===1&&e[0].x===t[0].x&&e[0].y===t[0].y?e:e.concat(t)}var Qt=la,Kt=da,Xt=ua,ha=ma;const Ye=Qt,ea=Kt,aa=Xt,De=d.forwardRef(({className:r,sideOffset:e=4,...t},s)=>a.jsx(ha,{ref:s,sideOffset:e,className:me("z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",r),...t}));De.displayName=ha.displayName;const Jt=`
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
`;function Zt(r){const e=/```campaign-create\s*\n([\s\S]*?)```/,t=r.match(e);if(!t)return null;try{const s=JSON.parse(t[1].trim());return!s.name||!s.platform||!s.budgetTotal||!s.startDate?(console.error("Campaign data missing required fields"),null):["Google Ads","Meta","LinkedIn"].includes(s.platform)?{action:"create_campaign",data:{name:s.name,platform:s.platform,budgetTotal:Number(s.budgetTotal),startDate:s.startDate,endDate:s.endDate||void 0,objective:s.objective||"Conversões"}}:(console.error("Invalid platform:",s.platform),null)}catch(s){return console.error("Failed to parse campaign data:",s),null}}function Yt(r){return r.replace(/```campaign-create\s*\n[\s\S]*?```/g,"").trim()}const es=`
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
`,ta=["Show, chegou no lugar certo. Eu automatizo o que os outros demoram três reuniões pra entender. O que a gente vai otimizar hoje?","Relaxa, aqui não tem blá-blá-blá. Só plano, execução e conversão. Passa o produto e o público.","Beleza. Eu sou o motor que transforma tentativa em lucro. Quer começar pequeno ou já quer escalar até o servidor pedir arrego?","Ótimo. Se você quiser aula, vai pro YouTube. Se quiser dinheiro rodando, me dá os dados e deixa eu fazer o estrago.","Ah, ótimo… mais um querendo vender antes de entender o jogo. Respira. Me diz o produto — eu transformo tua ideia num motivo pra alguém gastar dinheiro agora.","Bem-vindo ao lado escuro do funil. Aqui a gente não inspira ninguém — a gente convence. Cê tá pronto pra sujar um pouco as mãos ou prefere PowerPoint?","Se você quer motivação, compra um livro. Se quer resultado, me dá acesso ao checkout e segura o ROI.","Eu sou o algoritmo de ressaca: sarcástico, funcional e viciado em lucro. Fala o que você vende antes que eu comece a julgar teu nicho.","Parabéns, você acabou de invocar o espírito da conversão. Sem papo de mindset, sem desculpa. Quer que eu destrinche teu tráfego ou tua vergonha de anunciar?"];function as(){return ta[Math.floor(Math.random()*ta.length)]}const ts=({isSearching:r,searchResults:e=[],searchQuery:t})=>!r&&e.length===0?null:a.jsxs("div",{className:"mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg",children:[a.jsxs("div",{className:"flex items-center gap-2 mb-2",children:[a.jsx(oa,{className:"h-4 w-4 text-blue-600"}),a.jsx("span",{className:"text-sm font-medium text-blue-800",children:r?"Pesquisando na web...":"Resultados da pesquisa:"})]}),t&&a.jsxs("p",{className:"text-xs text-blue-600 mb-2",children:[a.jsx("strong",{children:"Consulta:"}),' "',t,'"']}),r?a.jsxs("div",{className:"flex items-center gap-2",children:[a.jsx("div",{className:"flex gap-1",children:[1,2,3].map(s=>a.jsx("div",{className:"w-2 h-2 bg-blue-400 rounded-full animate-pulse",style:{animationDelay:`${s*.2}s`}},s))}),a.jsx("span",{className:"text-xs text-blue-600",children:"Buscando informações..."})]}):a.jsx("div",{className:"space-y-2",children:e.slice(0,3).map((s,o)=>a.jsxs("div",{className:"flex items-start gap-2 p-2 bg-white rounded border",children:[a.jsx("div",{className:"flex-shrink-0 mt-0.5",children:s.favicon?a.jsx("img",{src:s.favicon,alt:"",className:"w-4 h-4",onError:i=>{i.currentTarget.style.display="none"}}):a.jsx(na,{className:"w-4 h-4 text-gray-400"})}),a.jsxs("div",{className:"flex-1 min-w-0",children:[a.jsx("h4",{className:"text-xs font-medium text-gray-900 truncate",children:s.title}),a.jsx("p",{className:"text-xs text-gray-600 line-clamp-2",children:s.snippet}),a.jsxs("a",{href:s.url,target:"_blank",rel:"noopener noreferrer",className:"text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1",children:[a.jsx(oe,{className:"w-3 h-3"}),"Ver fonte"]})]})]},o))})]}),ss=({sources:r,isSearching:e})=>e?a.jsxs("div",{className:"mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg",children:[a.jsxs("div",{className:"flex items-center gap-2 mb-2",children:[a.jsx(oa,{className:"h-4 w-4 text-blue-600"}),a.jsx("span",{className:"text-sm font-medium text-blue-800",children:"Pesquisando em múltiplas fontes..."})]}),a.jsx("div",{className:"flex gap-2 flex-wrap",children:r.map((t,s)=>a.jsxs("div",{className:"flex items-center gap-1 px-2 py-1 bg-white rounded border text-xs text-gray-600",children:[a.jsx(na,{className:"w-3 h-3"}),t]},s))})]}):null,rs=({platform:r,platformName:e,icon:t,onSkip:s,onSuccess:o})=>{const[i,l]=d.useState(!1),[h,u]=d.useState("idle"),S=async()=>{l(!0),u("connecting");try{const{data:{session:x}}=await R.auth.getSession();if(!x)throw new Error("Você precisa estar logado");const p=await fetch("https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/oauth-init",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${x.access_token}`},body:JSON.stringify({platform:r.toUpperCase(),redirectUrl:`${window.location.origin}/oauth/callback`})});if(!p.ok)throw new Error("Falha ao iniciar conexão");const{authUrl:v}=await p.json(),E=600,O=700,I=window.screen.width/2-E/2,q=window.screen.height/2-O/2,N=window.open(v,"oauth-popup",`width=${E},height=${O},left=${I},top=${q}`),j=z=>{var $,G;(($=z.data)==null?void 0:$.type)==="oauth-success"?(u("success"),l(!1),N==null||N.close(),o==null||o(),window.removeEventListener("message",j)):((G=z.data)==null?void 0:G.type)==="oauth-error"&&(u("error"),l(!1),N==null||N.close(),window.removeEventListener("message",j))};window.addEventListener("message",j),setTimeout(()=>{i&&(u("error"),l(!1),N==null||N.close())},5*60*1e3)}catch(x){console.error("Erro ao conectar:",x),u("error"),l(!1)}},f=()=>t||{facebook:"📘",meta:"📘",google:"🔍",linkedin:"💼",tiktok:"🎵",twitter:"🐦",canva:"🎨",instagram:"📸"}[r.toLowerCase()]||"🔗";return a.jsxs("div",{className:"my-4 animate-in fade-in slide-in-from-bottom-2 duration-300",children:[a.jsx("div",{className:"mb-3",children:a.jsxs("p",{className:"text-sm text-gray-700",children:["Vou conectar sua conta do ",a.jsx("strong",{children:e})," ao SyncAds."]})}),i&&a.jsxs("div",{className:"flex items-center gap-2 mb-3 text-sm text-blue-600",children:[a.jsx("span",{className:"text-2xl",children:f()}),a.jsxs("span",{children:["Connecting ",e,"..."]}),a.jsx(re,{className:"h-4 w-4 animate-spin"})]}),a.jsx(K,{className:"border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow",children:a.jsxs(X,{className:"p-5",children:[a.jsx("div",{className:"mb-4",children:a.jsxs("p",{className:"text-sm text-gray-600 leading-relaxed",children:["I'll need to connect your ",a.jsx("strong",{className:"text-gray-900",children:e})," account to continue."]})}),a.jsxs("div",{className:"flex items-center gap-2",children:[a.jsx(_,{onClick:()=>s==null?void 0:s(),variant:"ghost",disabled:i,className:"text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all",children:"Skip"}),a.jsx(_,{onClick:S,disabled:i,className:"flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-60 disabled:transform-none",children:i?a.jsxs(a.Fragment,{children:[a.jsx(re,{className:"mr-2 h-4 w-4 animate-spin"}),"Connecting..."]}):a.jsxs(a.Fragment,{children:[a.jsx("span",{className:"mr-2 text-xl",children:f()}),"Connect ",e,a.jsx(oe,{className:"ml-2 h-4 w-4"})]})})]}),a.jsx("div",{className:"mt-4 pt-4 border-t border-gray-100",children:a.jsxs("a",{href:"/privacy",target:"_blank",className:"text-xs text-gray-400 hover:text-blue-600 flex items-center gap-1 transition-colors",children:[a.jsx("svg",{className:"h-3 w-3",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:a.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"})}),"How we handle your data",a.jsx(oe,{className:"h-3 w-3"})]})}),h==="success"&&a.jsx("div",{className:"mt-3 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700",children:"✅ Conectado com sucesso!"}),h==="error"&&a.jsx("div",{className:"mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700",children:"❌ Erro ao conectar. Tente novamente."})]})})]})},os=({downloadUrl:r,fileName:e,expiresAt:t,fileCount:s,campaignName:o,platform:i,period:l})=>{const h=()=>{const S=document.createElement("a");S.href=r,S.download=e,document.body.appendChild(S),S.click(),document.body.removeChild(S)},u=S=>{const f=new Date(S),x=new Date,p=f.getTime()-x.getTime(),v=Math.floor(p/(1e3*60*60)),E=Math.floor(p%(1e3*60*60)/(1e3*60));return v>0?`${v}h ${E}min`:`${E}min`};return a.jsx(K,{className:"w-full max-w-md bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200",children:a.jsx(X,{className:"p-4",children:a.jsxs("div",{className:"flex items-start gap-3",children:[a.jsx("div",{className:"flex-shrink-0",children:a.jsx(ia,{className:"h-8 w-8 text-blue-600"})}),a.jsxs("div",{className:"flex-1 min-w-0",children:[a.jsxs("div",{className:"flex items-center gap-2 mb-2",children:[a.jsx("h4",{className:"font-medium text-gray-900 truncate",children:e}),a.jsxs(se,{variant:"secondary",className:"text-xs",children:[s," arquivo",s!==1?"s":""]})]}),a.jsxs("div",{className:"space-y-1 mb-3",children:[o&&a.jsxs("p",{className:"text-sm text-gray-600",children:[a.jsx("span",{className:"font-medium",children:"Campanha:"})," ",o]}),i&&a.jsxs("p",{className:"text-sm text-gray-600",children:[a.jsx("span",{className:"font-medium",children:"Plataforma:"})," ",i]}),l&&a.jsxs("p",{className:"text-sm text-gray-600",children:[a.jsx("span",{className:"font-medium",children:"Período:"})," ",l]})]}),a.jsxs("div",{className:"flex items-center gap-1 text-xs text-orange-600 mb-3",children:[a.jsx(rt,{className:"h-3 w-3"}),a.jsxs("span",{children:["Expira em ",u(t)]})]}),a.jsxs("div",{className:"flex gap-2",children:[a.jsxs(_,{onClick:h,size:"sm",className:"flex-1",children:[a.jsx(Te,{className:"h-4 w-4 mr-2"}),"Baixar"]}),a.jsx(_,{variant:"outline",size:"sm",onClick:()=>window.open(r,"_blank"),children:a.jsx(oe,{className:"h-4 w-4"})})]})]})]})})})},ns=({downloads:r})=>r.length===0?null:a.jsxs("div",{className:"space-y-3",children:[a.jsxs("h3",{className:"text-sm font-medium text-gray-700 flex items-center gap-2",children:[a.jsx(ia,{className:"h-4 w-4"}),"Downloads Disponíveis (",r.length,")"]}),a.jsx("div",{className:"space-y-2",children:r.map((e,t)=>a.jsx(os,{...e},t))})]});function is({steps:r,showCode:e=!0}){if(!r||r.length===0)return null;const t=i=>{switch(i){case"completed":return a.jsx(ct,{className:"h-4 w-4 text-green-500"});case"running":return a.jsx(re,{className:"h-4 w-4 text-blue-500 animate-spin"});case"failed":return a.jsx(_e,{className:"h-4 w-4 text-red-500"});default:return a.jsx(Ie,{className:"h-4 w-4 text-gray-500"})}},s=i=>{switch(i){case"completed":return"bg-green-100 text-green-800 border-green-200";case"running":return"bg-blue-100 text-blue-800 border-blue-200";case"failed":return"bg-red-100 text-red-800 border-red-200";default:return"bg-gray-100 text-gray-800 border-gray-200"}},o=i=>{const l=r[i],h=r[i+1];return l.status==="completed"&&(!h||h.status==="running"||h.status==="failed")};return a.jsxs("div",{className:"mb-4 space-y-2",children:[r.map((i,l)=>a.jsx(K,{className:me("border transition-all",o(l)&&"ring-2 ring-blue-500 ring-opacity-50"),children:a.jsx(X,{className:"p-3",children:a.jsxs("div",{className:"flex items-start gap-3",children:[a.jsx("div",{className:"flex-shrink-0 mt-0.5",children:t(i.status)}),a.jsxs("div",{className:"flex-1 min-w-0 space-y-2",children:[a.jsx("div",{className:"flex items-start justify-between gap-2",children:a.jsxs("div",{className:"flex-1",children:[a.jsxs("div",{className:"flex items-center gap-2 mb-1",children:[a.jsx("h4",{className:"text-sm font-semibold text-gray-900",children:i.step}),a.jsxs(se,{variant:"outline",className:me("text-xs",s(i.status)),children:[i.status==="completed"&&"✓ Concluído",i.status==="running"&&"⏳ Em execução",i.status==="failed"&&"✗ Falhou"]}),i.current_step&&a.jsx(se,{variant:"secondary",className:"text-xs",children:i.current_step})]}),i.details&&a.jsx("p",{className:"text-xs text-gray-600 mt-1",children:i.details})]})}),e&&i.code_to_execute&&a.jsxs("div",{className:"mt-2 p-2 bg-gray-50 rounded border border-gray-200",children:[a.jsxs("div",{className:"flex items-center gap-2 mb-1",children:[a.jsx(nt,{className:"h-3 w-3 text-gray-500"}),a.jsx("span",{className:"text-xs font-medium text-gray-600",children:"Código:"})]}),a.jsx("code",{className:"text-xs text-gray-700 break-all",children:i.code_to_execute.length>100?`${i.code_to_execute.substring(0,100)}...`:i.code_to_execute})]}),i.strategy&&a.jsx("div",{className:"mt-2",children:a.jsxs(se,{variant:"outline",className:"text-xs",children:["Estratégia: ",i.strategy]})}),i.error&&i.status==="failed"&&a.jsxs("div",{className:"mt-2 p-2 bg-red-50 rounded border border-red-200",children:[a.jsx("p",{className:"text-xs text-red-700 font-medium",children:"Erro:"}),a.jsx("p",{className:"text-xs text-red-600 mt-1",children:i.error})]})]})]})})},l)),a.jsxs("div",{className:"flex items-center gap-2 px-2",children:[a.jsx("div",{className:"flex-1 h-1 bg-gray-200 rounded-full overflow-hidden",children:a.jsx("div",{className:"h-full bg-blue-500 transition-all duration-300",style:{width:`${r.filter(i=>i.status==="completed").length/r.length*100}%`}})}),a.jsxs("span",{className:"text-xs text-gray-500",children:[r.filter(i=>i.status==="completed").length,"/",r.length," concluídos"]})]})]})}const cs=({result:r,onDownload:e,onRetry:t,onDownloadTemplate:s})=>{var S,f;const[o,i]=d.useState(0),[l,h]=d.useState(!0);d.useEffect(()=>{if(r.steps&&r.steps.length>0){const x=setInterval(()=>{i(p=>p<r.steps.length-1?p+1:(h(!1),clearInterval(x),p))},1e3);return()=>clearInterval(x)}},[r.steps]);const u=r.steps?Math.round(o/r.steps.length*100):100;return a.jsxs(K,{className:"w-full max-w-2xl mx-auto",children:[a.jsxs(Qa,{children:[a.jsxs(Ka,{className:"flex items-center gap-2",children:[r.success?a.jsx(Xa,{className:"h-5 w-5 text-green-600"}):a.jsx(_e,{className:"h-5 w-5 text-red-600"}),a.jsx("span",{className:r.success?"text-green-600":"text-red-600",children:r.success?"Execução Concluída":"Execução Falhou"})]}),a.jsx("p",{className:"text-sm text-gray-600",children:r.message})]}),a.jsxs(X,{className:"space-y-4",children:[a.jsxs("div",{className:"space-y-2",children:[a.jsxs("div",{className:"flex justify-between text-sm",children:[a.jsx("span",{children:"Progresso"}),a.jsxs("span",{children:[u,"%"]})]}),a.jsx(ot,{value:u,className:"h-2"})]}),r.steps&&r.steps.length>0&&a.jsxs("div",{className:"space-y-3",children:[a.jsx("h4",{className:"text-sm font-medium text-gray-700",children:"Etapas de Execução:"}),a.jsx(is,{steps:r.steps,showCode:!0})]}),r.nextActions&&r.nextActions.length>0&&a.jsxs("div",{className:"space-y-2",children:[a.jsx("h4",{className:"text-sm font-medium text-gray-700",children:"Sugestões:"}),a.jsx("ul",{className:"space-y-1",children:r.nextActions.map((x,p)=>a.jsxs("li",{className:"flex items-center gap-2 text-xs text-gray-600",children:[a.jsx("div",{className:"h-1 w-1 bg-gray-400 rounded-full"}),x]},p))})]}),r.data&&a.jsxs("div",{className:"space-y-2",children:[a.jsx("h4",{className:"text-sm font-medium text-gray-700",children:"Resultado:"}),a.jsx("div",{className:"bg-gray-50 p-3 rounded-lg",children:a.jsx("pre",{className:"text-xs text-gray-600 whitespace-pre-wrap",children:JSON.stringify(r.data,null,2)})})]}),r.diagnosis&&a.jsx("div",{className:"mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200",children:a.jsxs("div",{className:"flex items-start gap-3",children:[a.jsx(Ie,{className:"h-5 w-5 text-yellow-600 flex-shrink-0"}),a.jsxs("div",{className:"flex-1 space-y-2",children:[a.jsx("h4",{className:"text-sm font-semibold text-yellow-900",children:"Diagnóstico:"}),a.jsx("p",{className:"text-sm text-yellow-800",children:r.diagnosis.explanation}),r.diagnosis.solutions&&r.diagnosis.solutions.length>0&&a.jsxs("div",{className:"mt-2",children:[a.jsx("p",{className:"text-xs font-medium text-yellow-900 mb-1",children:"Soluções sugeridas:"}),a.jsx("ul",{className:"space-y-1",children:r.diagnosis.solutions.map((x,p)=>a.jsxs("li",{className:"text-xs text-yellow-700 flex items-start gap-2",children:[a.jsx("span",{children:"•"}),a.jsx("span",{children:x})]},p))})]})]})]})}),r.templateCSV&&s&&a.jsxs("div",{className:"mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200",children:[a.jsx("div",{className:"flex items-center justify-between mb-2",children:a.jsxs("div",{className:"flex items-center gap-2",children:[a.jsx(Ie,{className:"h-5 w-5 text-blue-600"}),a.jsx("h4",{className:"text-sm font-semibold text-blue-900",children:"Template CSV Gerado"})]})}),a.jsx("p",{className:"text-xs text-blue-700 mb-3",children:"Como o site não pôde ser acessado, geramos um template CSV com dados de exemplo que você pode usar."}),a.jsxs(_,{variant:"outline",size:"sm",onClick:()=>{const x=new Blob([r.templateCSV],{type:"text/csv"}),p=URL.createObjectURL(x),v=document.createElement("a");v.href=p,v.download=`produtos-template-${Date.now()}.csv`,document.body.appendChild(v),v.click(),document.body.removeChild(v),URL.revokeObjectURL(p)},className:"w-full",children:[a.jsx(Te,{className:"h-4 w-4 mr-2"}),"Baixar Template CSV"]})]}),a.jsxs("div",{className:"flex gap-2 pt-4",children:[((S=r.data)==null?void 0:S.downloadUrl)&&e&&a.jsxs(_,{onClick:()=>e(r.data.downloadUrl,r.data.fileName),className:"flex-1",children:[a.jsx(Te,{className:"h-4 w-4 mr-2"}),"Baixar Arquivo"]}),((f=r.data)==null?void 0:f.url)&&a.jsxs(_,{variant:"outline",onClick:()=>window.open(r.data.url,"_blank"),children:[a.jsx(oe,{className:"h-4 w-4 mr-2"}),"Ver Site"]}),!r.success&&t&&a.jsx(_,{variant:"outline",onClick:t,children:"Tentar Novamente"})]})]})]})},ls=({toolName:r,parameters:e,userId:t,conversationId:s,onComplete:o})=>{const[i,l]=d.useState(null),[h,u]=d.useState(!1),[S,f]=d.useState(null),x=async()=>{u(!0),f(null),l(null);try{const{data:p,error:v}=await supabase.functions.invoke("super-ai-tools",{body:{toolName:r,parameters:e,userId:t,conversationId:s}});if(v)throw new Error(v.message);const E=p;l(E),o&&o(E)}catch(p){f(p instanceof Error?p.message:"Erro desconhecido")}finally{u(!1)}};return d.useEffect(()=>{x()},[]),h?a.jsx(K,{className:"w-full max-w-2xl mx-auto",children:a.jsx(X,{className:"p-6",children:a.jsxs("div",{className:"flex items-center gap-3",children:[a.jsx(re,{className:"h-5 w-5 animate-spin text-blue-600"}),a.jsxs("div",{children:[a.jsxs("h3",{className:"font-medium",children:["Executando ",r]}),a.jsx("p",{className:"text-sm text-gray-600",children:"Processando solicitação..."})]})]})})}):S?a.jsx(K,{className:"w-full max-w-2xl mx-auto",children:a.jsxs(X,{className:"p-6",children:[a.jsxs("div",{className:"flex items-center gap-3",children:[a.jsx(_e,{className:"h-5 w-5 text-red-600"}),a.jsxs("div",{children:[a.jsx("h3",{className:"font-medium text-red-600",children:"Erro na Execução"}),a.jsx("p",{className:"text-sm text-gray-600",children:S})]})]}),a.jsx(_,{onClick:x,className:"mt-4",children:"Tentar Novamente"})]})}):i?a.jsx(cs,{result:i,onDownload:(p,v)=>{const E=document.createElement("a");E.href=p,E.download=v,document.body.appendChild(E),E.click(),document.body.removeChild(E)},onRetry:x}):null},ds=`
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
`;class us{constructor(e){ye(this,"userId");this.userId=e}async executeSQL(e){try{if(/DROP|TRUNCATE|DELETE\s+FROM\s+"User"|DELETE\s+FROM\s+"Campaign"/i.test(e))return{success:!1,error:"Query perigosa detectada. Confirmação necessária.",message:"⚠️ Esta query pode ser destrutiva. Por favor, confirme explicitamente."};const{data:s,error:o}=await R.rpc("execute_admin_query",{query_text:e});return o?{success:!1,error:o.message,message:`❌ Erro ao executar SQL: ${o.message}`}:{success:!0,data:s,message:`✅ Query executada com sucesso. ${Array.isArray(s)?s.length:0} registros retornados.`}}catch(t){return{success:!1,error:t.message,message:`❌ Erro: ${t.message}`}}}async analyzeSystem(e,t){try{let s="",o="";switch(e){case"metrics":s=`
            SELECT 
              (SELECT COUNT(*) FROM "User") as total_users,
              (SELECT COUNT(*) FROM "Campaign") as total_campaigns,
              (SELECT COUNT(*) FROM "ChatMessage") as total_messages,
              (SELECT COUNT(*) FROM "AiConnection") as total_connections
          `,o="📊 Métricas gerais do sistema";break;case"performance":s=`
            SELECT 
              AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_response_time,
              COUNT(*) as total_requests
            FROM "ChatMessage"
            WHERE created_at >= NOW() - INTERVAL '${t==="24h"?"1 day":t==="7d"?"7 days":"30 days"}'
          `,o="⚡ Análise de performance";break;case"usage":s=`
            SELECT 
              DATE(created_at) as date,
              COUNT(*) as messages_count
            FROM "ChatMessage"
            WHERE created_at >= NOW() - INTERVAL '${t==="24h"?"1 day":t==="7d"?"7 days":"30 days"}'
            GROUP BY DATE(created_at)
            ORDER BY date DESC
          `,o="📈 Análise de uso";break;case"errors":return{success:!0,data:{errors:0},message:"✅ Sistema de logging de erros a ser implementado"}}const{data:i,error:l}=await R.rpc("execute_admin_query",{query_text:s});if(l)throw l;return{success:!0,data:i,message:`${o} - Período: ${t}`}}catch(s){return{success:!1,error:s.message,message:`❌ Erro ao analisar sistema: ${s.message}`}}}async manageIntegration(e,t,s){try{switch(e){case"test":return{success:!0,message:`🔍 Testando integração com ${t}... (A implementar com APIs reais)`,data:{status:"pending"}};case"connect":const{data:o,error:i}=await R.from("Integration").insert({userId:this.userId,platform:t.toUpperCase(),credentials:s||{},isConnected:!1,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}).select().single();if(i)throw i;return{success:!0,data:o,message:`✅ Integração com ${t} iniciada. Configure as credenciais.`};case"disconnect":return await R.from("Integration").update({isConnected:!1}).eq("platform",t.toUpperCase()).eq("userId",this.userId),{success:!0,message:`✅ Integração com ${t} desconectada.`};default:return{success:!1,error:"Ação desconhecida",message:"❌ Ação não reconhecida"}}}catch(o){return{success:!1,error:o.message,message:`❌ Erro ao gerenciar integração: ${o.message}`}}}async getMetrics(e,t,s){try{let o="",i="*";switch(e){case"users":o="User";break;case"campaigns":o="Campaign";break;case"messages":o="ChatMessage";break;default:return{success:!1,error:"Métrica desconhecida",message:"❌ Métrica não reconhecida"}}const l=`
        SELECT 
          DATE_TRUNC('${s}', created_at) as period,
          ${t==="count"?"COUNT(*)":t==="sum"?"SUM(1)":"AVG(1)"} as value
        FROM "${o}"
        GROUP BY period
        ORDER BY period DESC
        LIMIT 30
      `,{data:h,error:u}=await R.rpc("execute_admin_query",{query_text:l});if(u)throw u;return{success:!0,data:h,message:`📊 Métricas de ${e} agrupadas por ${s}`}}catch(o){return{success:!1,error:o.message,message:`❌ Erro ao obter métricas: ${o.message}`}}}}function ms(r){const e=/```admin-sql\s*\n([\s\S]*?)```/,t=r.match(e);return t?t[1].trim():null}function ps(r){const e=/```admin-analyze\s*\n([\s\S]*?)```/,t=r.match(e);if(!t)return null;try{return JSON.parse(t[1].trim())}catch{return null}}function gs(r){const e=/```admin-integration\s*\n([\s\S]*?)```/,t=r.match(e);if(!t)return null;try{return JSON.parse(t[1].trim())}catch{return null}}function hs(r){const e=/```admin-metrics\s*\n([\s\S]*?)```/,t=r.match(e);if(!t)return null;try{return JSON.parse(t[1].trim())}catch{return null}}function fs(r){return r.replace(/```admin-sql\s*\n[\s\S]*?```/g,"").replace(/```admin-analyze\s*\n[\s\S]*?```/g,"").replace(/```admin-integration\s*\n[\s\S]*?```/g,"").replace(/```admin-metrics\s*\n[\s\S]*?```/g,"").replace(/```admin-logs\s*\n[\s\S]*?```/g,"").replace(/```admin-test-api\s*\n[\s\S]*?```/g,"").replace(/```admin-debug\s*\n[\s\S]*?```/g,"").trim()}const xs={addEmojis:!0,improveMarkdown:!0,removeTechnicalLogs:!0,addSectionDividers:!0};function vs(r,e={}){const t={...xs,...e};let s=r;return t.removeTechnicalLogs&&(s=bs(s)),t.addEmojis&&(s=Ss(s)),t.improveMarkdown&&(s=As(s)),t.addSectionDividers&&(s=Es(s)),s.trim()}function bs(r){let e=r;return e=e.replace(/\{[\s\S]*?"success"[\s\S]*?\}/g,""),e=e.replace(/\{[\s\S]*?"data"[\s\S]*?\}/g,""),e=e.replace(/\{[\s\S]*?"message"[\s\S]*?\}/g,""),e=e.replace(/```json[\s\S]*?```/g,""),e=e.replace(/^\s*"[^"]+"\s*:\s*.+$/gm,""),e=e.replace(/^\s*[\{\}\[\],]\s*$/gm,""),e=e.replace(/^\s*(?:success|message|data|query|provider|results|snippet|url|title|error|status)\s*[:=]/gim,""),e=e.replace(/\*\*Resultados da pesquisa:\*\*[\s\S]*?(?=\n\n|$)/g,""),e=e.replace(/\n{3,}/g,`

`),e.trim()}function Ss(r){let e=r;return e=e.replace(/\b(sucesso|concluído|pronto|completado|finalizado)\b/gi,"✅ $1"),e=e.replace(/\b(erro|falhou|problema)\b/gi,"❌ $1"),e=e.replace(/\b(importante|atenção|cuidado|aviso)\b/gi,"⚠️ $1"),e=e.replace(/\b(sugestão|dica|ideia)\b/gi,"💡 $1"),e=e.replace(/\[([^\]]+)\]\(http/g,"🔗 [$1](http"),e=e.replace(/\b(download|baixar)\b/gi,"📥 $1"),e=e.replace(/\b(upload|enviar)\b/gi,"📤 $1"),e=e.replace(/\b(arquivo|csv|json|zip)\b/gi,"📄 $1"),e=e.replace(/\b(análise|métricas|dados)\b/gi,"📊 $1"),e=e.replace(/\b(pesquisa|busca|procurar)\b/gi,"🔍 $1"),e=e.replace(/\b(produto|item)\b/gi,"🛍️ $1"),e=e.replace(/\b(preço|valor|R\$)\b/gi,"💰 $1"),e=e.replace(/\b(campanha|anúncio)\b/gi,"🎯 $1"),e=e.replace(/\b(email|e-mail)\b/gi,"📧 $1"),e=e.replace(/\b(alerta|notificação)\b/gi,"🔔 $1"),e=e.replace(/\b(rápido|veloz)\b/gi,"⚡ $1"),e=e.replace(/\b(agendado|cronômetro)\b/gi,"⏰ $1"),e=e.replace(/\b(automação|inteligente|ia)\b/gi,"🤖 $1"),e}function As(r){let e=r;return e=e.replace(/^(\d+)\.\s+(.+)$/gm,"$1. **$2**"),e=e.replace(/\b(IMPORTANTE|ATENÇÃO|NOTA|OBS|AVISO)\b/g,"**$1**"),e=e.replace(new RegExp("(?<!\\[)(https?:\\/\\/[^\\s]+)(?!\\])","g"),"[Link]($1)"),e=e.replace(/\n(#{1,3}\s+)/g,`

$1`),e=e.replace(/(#{1,3}\s+.+)\n(?!\n)/g,`$1

`),e=e.replace(/^-\s+(.+)$/gm,"• $1"),e}function Es(r){let e=r;return e=e.replace(/\n(##\s+)/g,`
---

$1`),e}function ws(r){const e=/```integration-connect:(\w+)```/,t=r.match(e);return t?{action:"connect",slug:t[1]}:null}function ys(r){const e=/```integration-disconnect:(\w+)```/,t=r.match(e);return t?{action:"disconnect",slug:t[1]}:null}function Ns(r){const e=/```integration-status(?::(\w+))?```/,t=r.match(e);return t?{action:"status",slug:t[1]}:null}function Cs(r){return ws(r)||ys(r)||Ns(r)}function js(r){return r.replace(/```integration-connect:\w+```/g,"").replace(/```integration-disconnect:\w+```/g,"").replace(/```integration-status(?::\w+)?```/g,"").trim()}const Ts=`
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
`,Is=`
# 🔌 SISTEMA DE CONTROLE DE INTEGRAÇÕES - FUNCIONAL

Você tem controle REAL sobre as integrações do SyncAds. Pode criar, analisar e otimizar campanhas diretamente nas plataformas.

## 📋 META ADS - CONTROLE TOTAL ✅

**Você pode EXECUTAR estas ações:**

### 1. ANALISAR CAMPANHA
\`\`\`integration-control
{
  "platform": "meta_ads",
  "action": "analyze_campaign",
  "params": {
    "campaignId": "123456789",
    "datePreset": "last_7d"
  }
}
\`\`\`
**Retorna:** CPC, CTR, ROAS, conversões, recomendações

### 2. LISTAR CAMPANHAS
\`\`\`integration-control
{
  "platform": "meta_ads",
  "action": "get_campaigns",
  "params": {
    "adAccountId": "act_123456",
    "limit": 25
  }
}
\`\`\`

### 3. CRIAR CAMPANHA
\`\`\`integration-control
{
  "platform": "meta_ads",
  "action": "create_campaign",
  "params": {
    "adAccountId": "act_123456",
    "name": "Nova Campanha",
    "objective": "CONVERSIONS",
    "status": "PAUSED",
    "dailyBudget": 100
  }
}
\`\`\`

### 4. OTIMIZAR CAMPANHA
\`\`\`integration-control
{
  "platform": "meta_ads",
  "action": "optimize_campaign",
  "params": {
    "campaignId": "123456789",
    "adAccountId": "act_123456",
    "strategy": "increase_budget",
    "amount": 30
  }
}
\`\`\`
**Estratégias:** increase_budget, decrease_budget, pause, adjust_bidding

## 📊 QUANDO USAR

**Usuário:** "Analise minha campanha do Facebook"
**Você:** Use \`integration-control\` com action \`analyze_campaign\`

**Usuário:** "Otimize minha campanha de maior ROAS"
**Você:**
1. Liste campanhas
2. Analise métricas
3. Use \`optimize_campaign\` com strategy \`increase_budget\`

## ⚠️ REGRAS

1. SEMPRE use blocos \`\`\`integration-control
2. SEMPRE retorne dados REAIS das APIs
3. NÃO invente métricas
4. Seja específico nas recomendações baseadas em dados reais

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
`;class Rs{constructor(e){ye(this,"userId");this.userId=e}async auditIntegration(e){try{const{data:t,error:s}=await R.from("Integration").select("*").eq("userId",this.userId).eq("platform",e).single();if(s&&s.code!=="PGRST116")throw s;const o=this.getCapabilities(e),i=t&&t.isConnected?"connected":"disconnected",l={platform:e,status:i,lastSync:(t==null?void 0:t.lastSyncAt)||void 0,capabilities:o,issues:this.detectIssues(t,e),recommendations:this.getRecommendations(i,e)};return{success:!0,data:l,message:this.formatAuditMessage(l)}}catch(t){return{success:!1,error:t.message,message:`❌ Erro ao auditar ${e}: ${t.message}`}}}async auditAll(){try{const e=["META_ADS","GOOGLE_ADS","LINKEDIN_ADS","TIKTOK_ADS","TWITTER_ADS"],t=[];for(const s of e){const o=await this.auditIntegration(s);o.success&&o.data&&t.push(o.data)}return{success:!0,data:t,message:this.formatAllAuditsMessage(t)}}catch(e){return{success:!1,error:e.message,message:`❌ Erro ao auditar integrações: ${e.message}`}}}async listStatus(){try{const{data:e,error:t}=await R.from("Integration").select("platform, isConnected, lastSyncAt").eq("userId",this.userId);if(t)throw t;const s=new Map((e==null?void 0:e.map(l=>[l.platform,l]))||[]),i=["META_ADS","GOOGLE_ADS","LINKEDIN_ADS","TIKTOK_ADS","TWITTER_ADS"].map(l=>{var h,u;return{platform:l,status:s.has(l)&&((h=s.get(l))!=null&&h.isConnected)?"✅ Conectada":"❌ Desconectada",lastSync:((u=s.get(l))==null?void 0:u.lastSyncAt)||"Nunca"}});return{success:!0,data:i,message:this.formatStatusList(i)}}catch(e){return{success:!1,error:e.message,message:`❌ Erro ao listar status: ${e.message}`}}}getCapabilities(e){return{META_ADS:["Criar campanhas de Facebook e Instagram","Segmentação avançada de audiência","Análise de performance em tempo real","Otimização automática de orçamento","A/B testing de criativos","Remarketing e lookalike audiences"],GOOGLE_ADS:["Campanhas de Pesquisa (Search)","Anúncios Display e YouTube","Shopping Ads para e-commerce","Campanhas Performance Max","Análise de conversões e ROI","Smart Bidding automático"],LINKEDIN_ADS:["Anúncios B2B segmentados","Targeting por cargo e empresa","Lead Gen Forms nativos","InMail patrocinado","Análise de engajamento profissional","Retargeting de visitantes"],TIKTOK_ADS:["Vídeos In-Feed","TopView e Brand Takeover","Spark Ads (boost orgânico)","Segmentação por interesse e comportamento","Píxel de conversão","Catálogo de produtos"],TWITTER_ADS:["Tweets promovidos","Segmentação por hashtags e interesse","Audiências customizadas","Análise de engajamento","Campanhas de instalação de app","Vídeos e carrosséis"]}[e]||["Capacidades a definir"]}detectIssues(e,t){const s=[];if(!e)return s.push("Integração não configurada"),s;if(e.isConnected||s.push("Integração desconectada - configure credenciais"),(!e.credentials||Object.keys(e.credentials).length===0)&&s.push("Credenciais não configuradas"),e.lastSync){const o=new Date(e.lastSync),i=(Date.now()-o.getTime())/(1e3*60*60);i>24&&s.push(`Última sincronização há ${Math.floor(i)} horas - pode estar desatualizado`)}return s}getRecommendations(e,t){const s=[];return e==="disconnected"&&(s.push(`Conecte ${this.formatPlatformName(t)} em: Configurações → Integrações`),s.push("Configure sua chave de API para começar a usar")),e==="connected"&&(s.push("✅ Integração ativa! Você já pode criar campanhas"),s.push("Explore as capacidades disponíveis desta plataforma")),s}formatPlatformName(e){return{META_ADS:"Meta Ads (Facebook/Instagram)",GOOGLE_ADS:"Google Ads",LINKEDIN_ADS:"LinkedIn Ads",TIKTOK_ADS:"TikTok Ads",TWITTER_ADS:"Twitter Ads (X)"}[e]||e}formatAuditMessage(e){let s=`
**${e.status==="connected"?"✅":"❌"} ${this.formatPlatformName(e.platform)}**
`;return s+=`Status: ${e.status==="connected"?"✅ Conectada":"❌ Desconectada"}
`,e.lastSync&&(s+=`Última sincronização: ${e.lastSync}
`),s+=`
**Capacidades:**
`,e.capabilities.forEach(o=>{s+=`• ${o}
`}),e.issues&&e.issues.length>0&&(s+=`
**⚠️ Problemas detectados:**
`,e.issues.forEach(o=>{s+=`• ${o}
`})),e.recommendations&&e.recommendations.length>0&&(s+=`
**💡 Recomendações:**
`,e.recommendations.forEach(o=>{s+=`• ${o}
`})),s}formatAllAuditsMessage(e){let t=`
# 🔍 AUDITORIA COMPLETA DE INTEGRAÇÕES

`;const s=e.filter(i=>i.status==="connected").length,o=e.length;return t+=`**Resumo:** ${s}/${o} integrações ativas

`,t+=`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`,e.forEach(i=>{t+=this.formatAuditMessage(i),t+=`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`}),s<o?(t+=`
**🎯 Próximos Passos:**
`,t+=`1. Conecte as ${o-s} integrações pendentes
`,t+=`2. Configure suas chaves de API
`,t+=`3. Teste cada integração antes de criar campanhas
`):t+=`
**🎉 Parabéns!** Todas as integrações estão configuradas e funcionando!
`,t}formatStatusList(e){let t=`
**📊 Status das Integrações:**

`;return e.forEach(s=>{t+=`${s.status} **${this.formatPlatformName(s.platform)}**
`,t+=`   └─ Última sync: ${s.lastSync}

`}),t}}function Os(r){const e=/```integration-action\s*\n([\s\S]*?)```/,t=r.match(e);if(!t)return null;try{return JSON.parse(t[1].trim())}catch{return null}}function ks(r){return r.replace(/```integration-action\s*\n[\s\S]*?```/g,"").trim()}function Ds(r,e){const t=r.toLowerCase(),s=e.toLowerCase(),o=(t.includes("auditor")||t.includes("verificar")||t.includes("status")||t.includes("listar"))&&(t.includes("integra")||t.includes("conex")||t.includes("plataforma")),i=s.includes("vou")&&(s.includes("auditor")||s.includes("verificar"));if(!o||!i)return null;const l={facebook:"META_ADS",instagram:"META_ADS",meta:"META_ADS",google:"GOOGLE_ADS",linkedin:"LINKEDIN_ADS",tiktok:"TIKTOK_ADS",twitter:"TWITTER_ADS"};for(const[h,u]of Object.entries(l))if(t.includes(h))return{action:"audit",platform:u};return{action:"audit_all"}}function Ps(r){const e=/```integration-control\s*\n([\s\S]*?)```/,t=r.match(e);if(!t)return null;try{const s=JSON.parse(t[1].trim());return{action:s.action,platform:s.platform,params:s.params||{}}}catch{return null}}function _s(r){return r.replace(/```integration-control\s*\n[\s\S]*?```/g,"").trim()}async function $s(r){const{platform:e,action:t,params:s}=r;try{const i={meta_ads:"meta-ads-control",google_ads:"google-ads-control",linkedin_ads:"linkedin-ads-control",tiktok_ads:"tiktok-ads-control",twitter_ads:"twitter-ads-control"}[e.toLowerCase()];if(!i)throw new Error(`Platform ${e} not supported yet`);const{data:{session:l}}=await R.auth.getSession();if(!l)throw new Error("Not authenticated");const{data:h,error:u}=await R.functions.invoke(i,{body:{action:t,params:s},headers:{Authorization:`Bearer ${l.access_token}`}});if(u)throw u;if(!h.success)throw new Error(h.error||"Integration control failed");return{success:!0,data:h.data,message:Ms(e,t,h.data)}}catch(o){return console.error("Integration control error:",o),{success:!1,error:o.message,message:`❌ Erro ao executar ${t} em ${e}: ${o.message}`}}}function Ms(r,e,t){let s="";switch(e){case"get_campaigns":s=`
**📋 Campanhas do ${r.toUpperCase()}**

`,s+=`Total: ${t.total} campanhas

`,t.campaigns&&t.campaigns.length>0&&t.campaigns.slice(0,5).forEach(o=>{s+=`• **${o.name}**
`,s+=`  Status: ${o.status}
`,s+=`  Objetivo: ${o.objective}
`,o.daily_budget&&(s+=`  Orçamento: R$ ${(parseFloat(o.daily_budget)/100).toFixed(2)}/dia
`),s+=`
`});break;case"analyze_campaign":s=`
**📊 Análise da Campanha**

`,s+=`**${t.campaign.name}**
`,s+=`Status: ${t.campaign.status}
`,s+=`Objetivo: ${t.campaign.objective}

`,s+=`**Métricas (${t.metrics.period||"últimos 7 dias"}):**
`,s+=`• Impressões: ${t.metrics.impressions.toLocaleString()}
`,s+=`• Cliques: ${t.metrics.clicks.toLocaleString()}
`,s+=`• CPC: R$ ${t.metrics.cpc.toFixed(2)}
`,s+=`• CTR: ${t.metrics.ctr.toFixed(2)}%
`,s+=`• Gasto: R$ ${t.metrics.spend.toFixed(2)}
`,t.metrics.conversions>0&&(s+=`• Conversões: ${t.metrics.conversions}
`,s+=`• ROAS: ${t.metrics.roas.toFixed(2)}x
`),t.analysis&&t.analysis.recommendations&&(s+=`
**💡 Recomendações:**
`,t.analysis.recommendations.forEach(o=>{s+=`• ${o}
`}));break;case"create_campaign":s=`
**✅ Campanha Criada**

`,s+=`${t.message}
`,s+=`ID: ${t.campaignId}
`;break;case"optimize_campaign":s=`
**⚡ Otimização Executada**

`,s+=`${t.message}
`,s+=`Campanha: ${t.campaignId}
`;break;default:s=JSON.stringify(t,null,2)}return s}const Ls=["Criar campanha de Facebook Ads","Analisar performance da última semana","Sugerir otimizações"],ue=500,rr=()=>{const[r,e]=d.useState(""),[t,s]=d.useState(typeof window<"u"&&window.innerWidth>=768),[o,i]=d.useState(null),[l,h]=d.useState(!1),[u,S]=d.useState([]),[f,x]=d.useState(""),[p,v]=d.useState([]),[E,O]=d.useState([]),[I,q]=d.useState([]),[N,j]=d.useState(null),[z,$]=d.useState(""),[G,Z]=d.useState([]),[fe,Le]=d.useState(!1),[qs,fa]=d.useState(null),xe=d.useRef(null),ve=d.useRef([]),b=He(n=>n.user),qe=He(n=>n.isAuthenticated),ze=Ja(),be=V(n=>n.conversations),k=V(n=>n.activeConversationId),Se=V(n=>n.setActiveConversationId),ie=V(n=>n.isAssistantTyping),Ue=V(n=>n.setAssistantTyping),J=V(n=>n.addMessage);V(n=>n.deleteConversation),V(n=>n.createNewConversation);const xa=Za(n=>n.addCampaign),va=We(n=>n.aiSystemPrompt),ba=We(n=>n.aiInitialGreetings),Fe=d.useRef(null),Ge=d.useRef(null),Sa=n=>{var c,m;if(!n||typeof n!="string")return n;try{if(n.trim().startsWith("{")&&n.trim().endsWith("}")){const g=JSON.parse(n);if(g.message&&typeof g.message=="string")return g.message;if((c=g.data)!=null&&c.message)return g.data.message;if((m=g.data)!=null&&m.results&&Array.isArray(g.data.results)){const w=g.data.query||"sua busca",P=g.data.provider||"Internet";let D=`🔍 **Encontrei ${g.data.results.length} resultados sobre "${w}"** (${P})

`;return g.data.results.slice(0,5).forEach((A,U)=>{D+=`**${U+1}. ${A.title||"Resultado"}**
`,(A.description||A.snippet)&&(D+=`${A.description||A.snippet}
`),(A.url||A.link)&&(D+=`🔗 [Ver mais](${A.url||A.link})
`),D+=`
`}),D}return g.error?`❌ Erro: ${g.error}`:g.message||n}}catch{}return n},Aa=n=>{if(!n||typeof n!="string")return n;let c=n;return c.split(`
`).slice(0,3).join(`
`).match(/^\s*\{[\s\S]*?"success"[\s\S]*?\}/)&&(c=c.replace(/^\s*\{[\s\S]*?"success"[\s\S]*?\}\s*/,"")),c=c.replace(/^\s*"(success|message|data|error)":\s*.+$/gm,""),c=c.replace(/\*\*Resultados da pesquisa:\*\*\s*\n\s*\n/g,""),c=c.replace(/^\s*[\{\}\[\]]\s*$/gm,""),c=c.replace(/\n{3,}/g,`

`),c=c.trim(),!c||c.length<10||/^[\s\{\}\[\]\,\:\"]+$/.test(c)?(console.warn("⚠️ cleanTechnicalLogs removeu todo conteúdo, retornando original"),n):c},Ea=async(n,c,m)=>{const g=`msg-${Date.now()+1}`;let w="";J(n,c,{id:g,role:"assistant",content:""});const P=m.split(" "),D=2;for(let A=0;A<P.length;A+=D){const U=P.slice(A,A+D).join(" ");w+=(A>0?" ":"")+U,J(n,c,{id:g,role:"assistant",content:w}),await new Promise(Q=>setTimeout(Q,20))}J(n,c,{id:g,role:"assistant",content:m})},{toast:y}=Ya(),B=be.find(n=>n.id===k);d.useEffect(()=>{(!qe||!b)&&(console.warn("⚠️ Usuário não autenticado, redirecionando para login..."),ze("/login",{replace:!0}))},[qe,b,ze]);const wa=()=>{var n;(n=Fe.current)==null||n.scrollIntoView({behavior:"smooth"})};d.useEffect(wa,[B==null?void 0:B.messages,ie]),d.useEffect(()=>{(async()=>{if(b)try{const{data:c,error:m}=await R.from("GlobalAiConnection").select("id, systemPrompt, initialGreetings").eq("isActive",!0).limit(1).single();if(m){console.error("Erro ao buscar IA:",m);return}const g=c==null?void 0:c.id;if(g){const{data:w,error:P}=await R.from("GlobalAiConnection").select("systemPrompt, initialGreetings").eq("id",g).single();if(P){console.error("Erro ao buscar config da IA:",P);return}w&&i({systemPrompt:w.systemPrompt||va,initialGreetings:w.initialGreetings||ba})}}catch(c){console.error("Erro ao carregar IA Global:",c)}})()},[b==null?void 0:b.id]),d.useEffect(()=>{if(B&&B.messages.length===0){const n=as();setTimeout(()=>{b&&J(b.id,k,{id:`greeting-${Date.now()}`,role:"assistant",content:n})},500)}},[k,B==null?void 0:B.messages.length]);const ya=n=>{const c=/ZIP_DOWNLOAD:\s*({[^}]+})/g,m=n.match(c);return m&&m.forEach(g=>{try{const w=g.replace("ZIP_DOWNLOAD:","").trim(),P=JSON.parse(w);O(D=>[...D,P])}catch(w){console.error("Erro ao processar download ZIP:",w)}}),n.replace(c,"").trim()},Na=n=>{const c=/SUPER_AI_EXECUTION:\s*({[^}]+})/g,m=n.match(c);return m&&m.forEach(g=>{try{const w=g.replace("SUPER_AI_EXECUTION:","").trim(),P=JSON.parse(w);q(D=>[...D,P])}catch(w){console.error("Erro ao processar execução Super AI:",w)}}),n.replace(c,"").trim()},Ae=async()=>{if(r.trim()===""||!k||r.length>ue)return;const n=r,c=n.toLowerCase();if(c.includes("pesquis")||c.includes("busca")||c.includes("google")||c.includes("internet")){j("web_search");let m=n;if(c.includes("pesquis")){const g=n.match(/pesquis[ae]\s+(.+)/i);m=g?g[1]:n}$(`Pesquisando na web sobre: "${m}"`),Z(["Google Search","Exa AI","Tavily"])}else if(c.includes("baix")||c.includes("rasp")||c.includes("scrape")){j("web_scraping");const m=n.match(/https?:\/\/[^\s]+/i);$(m?`Raspando dados de: ${m[0]}`:"Raspando dados...")}else c.includes("python")||c.includes("calcule")||c.includes("execute código")?(j("python_exec"),$("Executando código Python para processar dados...")):(j(null),$("Processando sua solicitação..."),Z([]));b&&J(b.id,k,{id:`msg-${Date.now()}`,role:"user",content:n}),e(""),s(!1),Ue(!0);try{const m=be.find(C=>C.id===k),g=(o==null?void 0:o.systemPrompt)||es,w=ds+`

`+Jt+`

`+Ts+`

`+Is+`

`+g,P=((m==null?void 0:m.messages)||[]).slice(-20).map(C=>({role:C.role,content:C.content})),A=(await tt(n,k,P,w)).response,U=Zt(A);if(U)try{b&&(await xa(b.id,{name:U.data.name,platform:U.data.platform,status:"Pausada",budgetTotal:U.data.budgetTotal,budgetSpent:0,impressions:0,clicks:0,conversions:0,startDate:U.data.startDate,endDate:U.data.endDate||"",ctr:0,cpc:0}),y({title:"🎉 Campanha Criada!",description:`A campanha "${U.data.name}" foi criada com sucesso.`}))}catch(C){console.error("Error creating campaign from AI:",C),y({title:"Erro ao criar campanha",description:"Não foi possível criar a campanha automaticamente.",variant:"destructive"})}let Q="";if(b){const C=new us(b.id),H=ms(A);if(H){const T=await C.executeSQL(H);y({title:T.success?"✅ SQL Executado":"❌ Erro SQL",description:T.message,variant:T.success?"default":"destructive"})}const te=ps(A);if(te){const T=await C.analyzeSystem(te.type,te.period);y({title:T.success?"📊 Análise Concluída":"❌ Erro",description:T.message,variant:T.success?"default":"destructive"})}const ce=gs(A);if(ce){const T=await C.manageIntegration(ce.action,ce.platform,ce.credentials);y({title:T.success?"🔗 Integração Atualizada":"❌ Erro",description:T.message,variant:T.success?"default":"destructive"})}const le=hs(A);if(le){const T=await C.getMetrics(le.metric,le.aggregation,le.groupBy);y({title:T.success?"📈 Métricas Obtidas":"❌ Erro",description:T.message,variant:T.success?"default":"destructive"})}let Y=Os(A);if(Y||(Y=Ds(n,A)),Y){const T=new Rs(b.id);let W;switch(Y.action){case"audit":Y.platform&&(W=await T.auditIntegration(Y.platform));break;case"audit_all":W=await T.auditAll();break;case"list_status":W=await T.listStatus();break;case"test":case"capabilities":case"diagnose":W={success:!0,message:`Ação "${Y.action}" detectada. Implementação em andamento.`};break}W&&(Q=`

`+W.message,y({title:W.success?"✅ Ação Executada":"❌ Erro",description:W.success?"Auditoria concluída com sucesso":W.error||"Erro ao executar ação",variant:W.success?"default":"destructive"}))}const we=Ps(A);if(we){const T=await $s(we);T.success?(Q+=`

`+T.message,y({title:"✅ Ação Executada",description:`${we.action} executado com sucesso`})):(Q+=`

`+T.message,y({title:"❌ Erro",description:T.error||"Erro ao executar ação",variant:"destructive"}))}}const F=Cs(A);if(F&&b)try{if(F.action==="connect"){const{authUrl:C}=await de.generateOAuthUrl(F.slug,b.id),H=Ce[F.slug];b&&J(b.id,k,{id:`msg-${Date.now()+1}`,role:"assistant",content:`Para conectar ${H.name}, clique no link abaixo:

🔗 [Autorizar ${H.name}](${C})

O link abrirá em uma nova aba para você autorizar o acesso.`}),window.open(C,"_blank"),y({title:"🔗 Link de Autorização",description:`Clique no link para conectar ${H.name}`});return}else if(F.action==="disconnect"){await de.disconnect(b.id,F.slug);const C=Ce[F.slug];y({title:"✅ Desconectado",description:`${C.name} foi desconectado com sucesso.`})}else if(F.action==="status")if(F.slug){const C=await de.getIntegrationStatus(b.id,F.slug),H=Ce[F.slug];y({title:`${H.name}`,description:C!=null&&C.isConnected?"✅ Conectado":"❌ Não conectado"})}else{const C=await de.listIntegrations(b.id),H=C.filter(te=>te.isConnected).length;y({title:"📊 Status das Integrações",description:`${H} de ${C.length} integrações conectadas`})}}catch(C){console.error("Erro ao processar integração:",C),b&&J(b.id,k,{id:`msg-${Date.now()+2}`,role:"assistant",content:`❌ **Erro ao conectar integração**

${C.message||"Erro ao processar comando de integração"}`}),y({title:"❌ Erro na Integração",description:"Verifique as instruções no chat",variant:"destructive"})}console.log("📝 Resposta original da IA:",A.substring(0,200));let Ee=ya(A);Ee=Na(Ee),console.log("📦 Após processar ZIP:",Ee.substring(0,200));let M=Yt(A);M=fs(M),M=js(M),M=ks(M),M=_s(M),console.log("🧹 Após limpar blocos:",M.substring(0,200)),M=Sa(M),console.log("🔍 Após parsear JSON:",M.substring(0,200)),M=Aa(M),console.log("🔧 Após cleanTechnicalLogs:",M.substring(0,200));const Be=vs(M+Q,{addEmojis:!0,improveMarkdown:!0,removeTechnicalLogs:!0,addSectionDividers:!1});console.log("✨ Resposta final formatada:",Be.substring(0,200)),b&&await Ea(b.id,k,Be)}catch(m){console.error("Erro ao chamar IA:",m),y({title:"Erro ao gerar resposta",description:m.message||"Não foi possível obter resposta da IA. Verifique sua chave de API.",variant:"destructive"}),b&&J(b.id,k,{id:`msg-${Date.now()+1}`,role:"assistant",content:"❌ Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, verifique se sua chave de API está configurada corretamente nas configurações."})}finally{Ue(!1)}},Ca=n=>{e(n)},ja=()=>{var n;(n=Ge.current)==null||n.click()},Ta=async()=>{try{const n=await navigator.mediaDevices.getUserMedia({audio:!0}),c=new MediaRecorder(n);xe.current=c,ve.current=[],c.ondataavailable=m=>{m.data.size>0&&ve.current.push(m.data)},c.onstop=async()=>{const m=new Blob(ve.current,{type:"audio/webm"});fa(m),await Ra(m),n.getTracks().forEach(g=>g.stop())},c.start(),Le(!0),y({title:"🎤 Gravando...",description:"Clique novamente para parar e enviar."})}catch(n){console.error("Erro ao iniciar gravação:",n),y({title:"❌ Erro",description:"Não foi possível acessar o microfone.",variant:"destructive"})}},Ia=()=>{xe.current&&fe&&(xe.current.stop(),Le(!1))},Ra=async n=>{if(!(!b||!k))try{y({title:"📤 Enviando áudio...",description:"Aguarde..."});const c=new File([n],`audio-${Date.now()}.webm`,{type:"audio/webm"}),m=`${b.id}/audio-${Date.now()}-${Math.random().toString(36).substring(7)}.webm`,{data:g,error:w}=await R.storage.from("chat-attachments").upload(m,c,{cacheControl:"3600",upsert:!1});if(w)throw w;const{data:{publicUrl:P}}=R.storage.from("chat-attachments").getPublicUrl(m),D=`[🎤 Mensagem de áudio](${P})`;e(A=>A?`${A}

${D}`:D),y({title:"✅ Áudio enviado!",description:"O áudio foi adicionado à mensagem."})}catch(c){console.error("Erro ao enviar áudio:",c),y({title:"❌ Erro",description:"Não foi possível enviar o áudio.",variant:"destructive"})}},Oa=async n=>{var m;const c=(m=n.target.files)==null?void 0:m[0];if(!(!c||!b||!k))try{y({title:"📤 Upload iniciado",description:`Enviando "${c.name}"...`});const g=c.name.split(".").pop(),w=`${b.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${g}`,{data:P,error:D}=await R.storage.from("chat-attachments").upload(w,c,{cacheControl:"3600",upsert:!1});if(D)throw D;const{data:{publicUrl:A}}=R.storage.from("chat-attachments").getPublicUrl(w),{error:U}=await R.from("ChatAttachment").insert({messageId:"",fileName:c.name,fileType:c.type,fileUrl:A,fileSize:c.size});U&&console.error("Erro ao salvar anexo:",U);const Q=c.type.startsWith("image/")?`![${c.name}](${A})`:`[${c.name}](${A})`,F=r?`${r}

${Q}`:Q;e(""),F.trim()&&k&&Ae(),y({title:"✅ Arquivo enviado!",description:`${c.name} foi enviado com sucesso.`})}catch(g){console.error("Erro ao fazer upload:",g),y({title:"❌ Erro ao enviar arquivo",description:g.message||"Não foi possível enviar o arquivo.",variant:"destructive"})}finally{n.target&&(n.target.value="")}},ka=async n=>{try{const{data:c,error:m}=await R.from("ChatMessage").select("id, role, content, createdAt").eq("conversationId",n).order("createdAt",{ascending:!0});if(m)throw m;const g=(c||[]).map(w=>({id:w.id,role:w.role,content:w.content,timestamp:new Date(w.createdAt)}));V.getState().setConversationMessages(n,g),Se(n),console.log(`✅ ${g.length} mensagens carregadas da conversa ${n}`)}catch(c){console.error("Erro ao carregar mensagens:",c),y({title:"Erro",description:"Não foi possível carregar mensagens.",variant:"destructive"})}};d.useEffect(()=>{(async()=>{if(!b)return;await V.getState().loadConversations(b.id);const{data:c}=await R.from("ChatConversation").select("id").eq("userId",b.id).limit(1);(!c||c.length===0)&&await Ve()})()},[b]);const Ve=async()=>{try{if(!b)return;const n=crypto.randomUUID(),c=new Date().toISOString(),{error:m}=await R.from("ChatConversation").insert({id:n,userId:b.id,title:"🆕 Nova Conversa",createdAt:c,updatedAt:c});if(m)throw m;Se(n),await V.getState().loadConversations(b.id),y({title:"✅ Nova conversa criada!",description:"Comece um novo chat do zero."})}catch(n){console.error("Erro ao criar nova conversa:",n),y({title:"Erro",description:n.message||"Não foi possível criar nova conversa.",variant:"destructive"})}},Da=async n=>{try{await R.from("ChatMessage").delete().eq("conversationId",n);const{error:c}=await R.from("ChatConversation").delete().eq("id",n);if(c)throw c;k===n&&Se(null),await V.getState().loadConversations(b.id),y({title:"🗑️ Conversa deletada",description:"A conversa foi removida com sucesso."})}catch(c){console.error("Erro ao deletar conversa:",c),y({title:"Erro",description:"Não foi possível deletar a conversa.",variant:"destructive"})}};return a.jsxs("div",{className:"h-[calc(100vh-80px)] flex flex-col md:flex-row relative",children:[t&&a.jsx("div",{className:"fixed inset-0 bg-black/50 z-40 md:hidden animate-in fade-in duration-200",onClick:()=>s(!1)}),a.jsxs("div",{className:`${t?"fixed md:relative inset-0 md:inset-auto w-full sm:w-80 md:w-72 z-50 md:z-auto animate-in slide-in-from-left duration-300":"hidden md:w-0"} bg-white md:bg-gray-50 md:border-r border-gray-200 flex flex-col overflow-hidden shadow-xl md:shadow-none`,children:[a.jsxs("div",{className:"p-4 border-b border-gray-200 bg-white md:bg-transparent",children:[a.jsxs("div",{className:"flex items-center justify-between mb-3",children:[a.jsx("h2",{className:"text-base md:text-sm font-semibold text-gray-900 md:text-gray-700",children:"Conversas"}),a.jsx(_,{onClick:()=>s(!1),variant:"ghost",size:"sm",className:"h-8 w-8 md:h-7 md:w-7 p-0 hover:bg-gray-100",children:a.jsx(et,{className:"h-5 w-5 md:h-4 md:w-4"})})]}),a.jsxs(_,{onClick:()=>{Ve(),window.innerWidth<768&&s(!1)},className:"w-full gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white",size:"default",children:[a.jsx(lt,{className:"h-4 w-4"}),"Nova Conversa"]})]}),a.jsx("div",{className:"flex-1 overflow-y-auto p-3 md:p-2 space-y-2 md:space-y-1",children:be.map(n=>a.jsxs("div",{className:`group relative flex items-center gap-3 p-3 md:p-2.5 rounded-lg hover:bg-gray-100 cursor-pointer transition-all duration-200 ${k===n.id?"bg-blue-50 border border-blue-200 shadow-sm":"bg-gray-50 md:bg-white hover:shadow-sm"}`,onClick:()=>{k!==n.id&&ka(n.id),window.innerWidth<768&&s(!1)},children:[a.jsx(dt,{className:"h-5 w-5 md:h-4 md:w-4 text-gray-500 flex-shrink-0"}),a.jsxs("div",{className:"flex-1 min-w-0",children:[a.jsx("p",{className:"text-sm md:text-sm font-medium text-gray-900 truncate",children:n.title}),a.jsx("p",{className:"text-xs text-gray-500 truncate mt-0.5",children:n.messages&&n.messages.length>0?n.messages[n.messages.length-1].content.substring(0,50)+"...":"Sem mensagens ainda"})]}),a.jsx(_,{onClick:c=>{c.stopPropagation(),Da(n.id)},variant:"ghost",size:"sm",className:"h-8 w-8 md:h-7 md:w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50",children:a.jsx(ut,{className:"h-4 w-4 md:h-3.5 md:w-3.5 text-red-500"})})]},n.id))})]}),a.jsxs("div",{className:"flex-1 flex flex-col min-w-0 w-full relative",children:[a.jsx("div",{className:"border-b border-gray-200 bg-white/95 backdrop-blur-xl p-3 md:p-4 sticky top-0 z-30",children:a.jsxs("div",{className:"flex items-center justify-between gap-2",children:[a.jsxs("div",{className:"flex items-center gap-3",children:[a.jsx(_,{onClick:()=>s(!t),variant:"ghost",size:"sm",className:"h-9 w-9 md:h-9 md:w-9 p-0 flex-shrink-0 hover:bg-gray-100 rounded-lg",children:a.jsx(at,{className:"h-5 w-5 md:h-5 md:w-5"})}),a.jsx("div",{className:"p-1.5 sm:p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500",children:a.jsx(Ne,{className:"h-4 w-4 sm:h-6 sm:w-6 text-white"})}),a.jsxs("div",{children:[a.jsx("h1",{className:"text-base sm:text-xl font-bold text-gray-900",children:"Chat com IA"}),a.jsx("p",{className:"text-xs sm:text-sm text-gray-500",children:"Assistente inteligente"})]})]}),a.jsxs(se,{className:"bg-gradient-to-r from-green-500 to-emerald-500 text-xs sm:text-sm",children:[a.jsx(mt,{className:"h-3 w-3 mr-1"}),"Online"]})]})}),a.jsx("div",{className:"flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4 overscroll-contain",children:B?a.jsxs(a.Fragment,{children:[(l||u.length>0)&&a.jsx(ts,{isSearching:l,searchResults:u,searchQuery:f}),p.length>0&&a.jsx(ss,{sources:p,isSearching:l}),E.length>0&&a.jsx("div",{className:"mb-4",children:a.jsx(ns,{downloads:E})}),I.length>0&&a.jsx("div",{className:"mb-4 space-y-4",children:I.map((n,c)=>a.jsx(ls,{toolName:n.toolName,parameters:n.parameters,userId:(b==null?void 0:b.id)||"",conversationId:k||"",onComplete:m=>{console.log("Execução Super AI concluída:",m)}},c))}),B.messages.map(n=>{var m;const c=(m=n.content)==null?void 0:m.match(/INTEGRATION_CONNECT:(\w+):([^🔗]+)/);if(c&&n.role==="assistant"){const[,g,w]=c,P=n.content.replace(/🔗 \*\*INTEGRATION_CONNECT:[^🔗]+🔗\*\* 🔗\n\n/,"");return a.jsx("div",{className:"flex justify-start",children:a.jsxs("div",{className:"max-w-[80%]",children:[a.jsx(K,{className:"bg-white mb-2",children:a.jsx(X,{className:"p-4",children:a.jsxs("div",{className:"flex items-start gap-2",children:[a.jsx(Ne,{className:"h-5 w-5 text-blue-600 mt-1 flex-shrink-0"}),a.jsx("div",{className:"flex-1 whitespace-pre-wrap break-words text-sm text-gray-900",children:P})]})})}),a.jsx(rs,{platform:g,platformName:w.trim(),onSkip:()=>{console.log("Conexão pulada:",g)},onSuccess:()=>{console.log("Conectado com sucesso:",g)}})]})},n.id)}return a.jsx("div",{className:`flex ${n.role==="user"?"justify-end":"justify-start"} mb-3`,children:a.jsx(K,{className:`w-full max-w-[90%] sm:max-w-[85%] md:max-w-[75%] lg:max-w-[70%] ${n.role==="user"?"bg-gradient-to-r from-blue-500 to-purple-500 text-white":"bg-white"}`,children:a.jsxs(X,{className:"p-3 md:p-4",children:[a.jsxs("div",{className:"flex items-start gap-2",children:[n.role==="assistant"&&a.jsx(Ne,{className:"h-4 w-4 md:h-5 md:w-5 text-blue-600 mt-0.5 flex-shrink-0"}),a.jsx("div",{className:`flex-1 whitespace-pre-wrap break-words text-sm md:text-base ${n.role==="user"?"text-white":"text-gray-900"}`,style:{wordBreak:"break-word",overflowWrap:"anywhere",maxWidth:"100%"},children:n.content})]}),a.jsx("div",{className:`text-xs mt-2 ${n.role==="user"?"text-white/70":"text-gray-500"}`,children:n.timestamp?new Date(n.timestamp).toLocaleTimeString("pt-BR"):""})]})})},n.id)}),ie&&a.jsx(it,{isThinking:ie,currentTool:N,reasoning:z,sources:G,status:"thinking"}),ie&&a.jsx("div",{className:"flex justify-start",children:a.jsx(K,{className:"bg-white",children:a.jsx(X,{className:"p-4",children:a.jsxs("div",{className:"flex items-center gap-2",children:[a.jsx(re,{className:"h-4 w-4 animate-spin text-blue-600"}),a.jsx("span",{className:"text-sm text-gray-500",children:"Processando..."})]})})})}),a.jsx("div",{ref:Fe})]}):a.jsx("div",{className:"flex items-center justify-center h-full text-muted-foreground",children:a.jsx("p",{children:"Selecione ou crie uma conversa para começar."})})}),a.jsxs("div",{className:"border-t border-gray-200 p-3 md:p-4 bg-white/80 backdrop-blur-xl flex-shrink-0",children:[a.jsx("div",{className:"hidden sm:flex gap-2 mb-2",children:Ls.map(n=>a.jsx(_,{variant:"outline",size:"sm",onClick:()=>Ca(n),className:"text-xs",children:n},n))}),a.jsxs("div",{className:"relative",children:[a.jsx(Ot,{value:r,onChange:n=>e(n.target.value),onKeyDown:n=>{n.key==="Enter"&&!n.shiftKey&&window.innerWidth>768&&(n.preventDefault(),Ae())},placeholder:"Digite sua mensagem...",className:"w-full resize-none rounded-lg border bg-background p-3 pr-20 md:pr-24 min-h-[44px] md:min-h-[48px] text-sm md:text-base",minRows:1,maxRows:window.innerWidth<768?3:5,maxLength:ue}),a.jsxs("div",{className:"absolute right-2 top-1/2 -translate-y-1/2 flex gap-1",children:[a.jsx("input",{type:"file",ref:Ge,onChange:Oa,className:"hidden"}),a.jsx(Ye,{children:a.jsxs(ea,{children:[a.jsx(aa,{asChild:!0,children:a.jsx(_,{type:"button",size:"icon",variant:"ghost",onClick:ja,className:"h-8 w-8 md:h-9 md:w-9 flex-shrink-0 touch-manipulation",children:a.jsx(gt,{className:"h-4 w-4"})})}),a.jsx(De,{children:"Anexar arquivo"})]})}),a.jsx(Ye,{children:a.jsxs(ea,{children:[a.jsx(aa,{asChild:!0,children:a.jsx(_,{type:"button",size:"icon",variant:"ghost",onClick:fe?Ia:Ta,disabled:!k,className:`h-8 w-8 md:h-9 md:w-9 flex-shrink-0 touch-manipulation ${fe?"text-red-500 animate-pulse":""}`,children:a.jsx(pt,{className:"h-4 w-4"})})}),a.jsx(De,{children:"Gravar áudio"})]})}),a.jsx(_,{type:"submit",size:"icon",onClick:Ae,disabled:r.trim()===""||!k,className:"h-8 w-8 md:h-9 md:w-9 flex-shrink-0 touch-manipulation",children:a.jsx(st,{className:"h-4 w-4"})})]})]}),a.jsxs("p",{className:me("text-xs text-right mt-1",r.length>ue?"text-destructive":"text-muted-foreground"),children:[r.length," / ",ue]})]})]})]})};export{rr as default};
