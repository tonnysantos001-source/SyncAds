import{f as C,r as d,j as e,n as $,b as T,am as k,B as j,g as v,l as A,al as w,s as n}from"./index-DKyyon9m.js";import{T as O}from"./textarea-BLGFRrJT.js";import{S as E}from"./SuperAdminLayout-y9gva4ZH.js";import{S as N}from"./Logo-D6EfprG9.js";import{S as g}from"./sparkles-BJRIrV9R.js";import{D}from"./database-CyrWWO29.js";import{S as M}from"./send-Dcr5Pxxj.js";import"./message-square-Dxun95XH.js";import"./dollar-sign-BuSPoHah.js";const z=[{icon:T,label:"Stats Gerais",prompt:"Me mostre um resumo completo das stats da plataforma"},{icon:k,label:"Clientes Ativos",prompt:"Liste todos os clientes ativos com suas métricas principais"},{icon:D,label:"Auditoria",prompt:"Faça uma auditoria completa do sistema e identifique possíveis problemas"},{icon:g,label:"Uso de IA",prompt:"Analise o uso de IA hoje: mensagens, tokens e custos"}];function H(){const{toast:y}=C(),[p,x]=d.useState([{id:"1",role:"system",content:`👋 Olá! Sou sua IA Administrativa. Posso te ajudar a gerenciar toda a plataforma SyncAds.

**O que posso fazer:**
• Auditar o sistema
• Consultar banco de dados
• Gerar relatórios
• Analisar métricas
• Investigar problemas

O que você gostaria de fazer?`,timestamp:new Date}]),[m,u]=d.useState(""),[c,h]=d.useState(!1),f=d.useRef(null);d.useEffect(()=>{var s;(s=f.current)==null||s.scrollIntoView({behavior:"smooth"})},[p]);const S=async s=>{const t=s.toLowerCase();try{if(t.includes("stats")||t.includes("resumo")||t.includes("geral")){const[a,o,r,i]=await Promise.all([n.from("Organization").select("*",{count:"exact",head:!0}),n.from("User").select("*",{count:"exact",head:!0}),n.from("ChatMessage").select("*",{count:"exact",head:!0}),n.from("GlobalAiConnection").select("*",{count:"exact",head:!0})]),l=await n.from("Organization").select("*",{count:"exact",head:!0}).eq("status","ACTIVE");return`📊 **STATS GERAIS DA PLATAFORMA**

**Organizações:**
• Total: ${a.count||0}
• Ativas: ${l.count||0}
• Taxa de ativação: ${a.count?((l.count||0)/a.count*100).toFixed(1):0}%

**Usuários:**
• Total: ${o.count||0}
• Média por org: ${a.count?((o.count||0)/a.count).toFixed(1):0}

**Uso de IA:**
• Mensagens processadas: ${r.count||0}
• IAs configuradas: ${i.count||0}

✅ Sistema operacional`}if(t.includes("clientes")||t.includes("organizações")){const{data:a,error:o}=await n.from("Organization").select("name, slug, plan, status, createdAt").eq("status","ACTIVE").order("createdAt",{ascending:!1}).limit(10);if(o)throw o;if(!a||a.length===0)return"❌ Nenhum cliente ativo encontrado.";let r=`👥 **CLIENTES ATIVOS** (${a.length})

`;return a.forEach((i,l)=>{r+=`${l+1}. **${i.name}**
`,r+=`   • Slug: ${i.slug}
`,r+=`   • Plano: ${i.plan}
`,r+=`   • Criado: ${new Date(i.createdAt).toLocaleDateString("pt-BR")}

`}),r}if(t.includes("audit")||t.includes("problema")||t.includes("verificar")){const a=[],{data:o}=await n.from("Organization").select("id, name").not("id","in",n.from("User").select("organizationId"));o&&o.length>0&&a.push(`⚠️ ${o.length} organizações sem usuários`);const{data:r}=await n.from("GlobalAiConnection").select("name").eq("status","INACTIVE");r&&r.length>0&&a.push(`⚠️ ${r.length} IAs inativas`);const{data:i}=await n.from("Organization").select("name").eq("status","TRIAL").lt("trialEndsAt",new Date().toISOString());return i&&i.length>0&&a.push(`⚠️ ${i.length} trials expirados`),a.length===0?`✅ **AUDITORIA COMPLETA**

Nenhum problema detectado. Sistema operando normalmente!`:`🔍 **AUDITORIA DO SISTEMA**

**Problemas Encontrados:**
${a.map(l=>`• ${l}`).join(`
`)}

**Recomendação:** Revise esses pontos no painel administrativo.`}if(t.includes("uso")||t.includes("mensagens")||t.includes("token")){const a=new Date;a.setHours(0,0,0,0);const{count:o}=await n.from("ChatMessage").select("*",{count:"exact",head:!0}).gte("createdAt",a.toISOString()),{count:r}=await n.from("ChatMessage").select("*",{count:"exact",head:!0});return`🤖 **USO DE IA**

**Hoje:**
• Mensagens: ${o||0}

**Total Histórico:**
• Mensagens: ${r||0}

📊 Média diária: ~${r?(r/30).toFixed(0):0} mensagens`}return`🤖 Entendi sua solicitação: "${s}"

Posso ajudar com:
• **stats gerais** - Visão geral da plataforma
• **clientes ativos** - Lista de organizações
• **audite o sistema** - Verificação de problemas
• **uso de ia** - Métricas de processamento

O que você gostaria de fazer?`}catch(a){return console.error("Admin query error:",a),`❌ Erro ao executar consulta: ${a.message}

Tente reformular sua pergunta.`}},b=async()=>{if(!m.trim()||c)return;const s={id:Date.now().toString(),role:"user",content:m.trim(),timestamp:new Date};x(t=>[...t,s]),u(""),h(!0);try{const t=await S(s.content),a={id:(Date.now()+1).toString(),role:"assistant",content:t,timestamp:new Date};x(o=>[...o,a])}catch(t){y({title:"Erro ao processar",description:t.message,variant:"destructive"})}finally{h(!1)}},I=s=>{u(s)};return e.jsx(E,{children:e.jsxs("div",{className:"h-[calc(100vh-80px)] flex flex-col",children:[e.jsx("div",{className:"border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-4",children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:"p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500",children:e.jsx(N,{className:"h-6 w-6 text-white"})}),e.jsxs("div",{children:[e.jsx("h1",{className:"text-xl font-bold text-gray-900 dark:text-white",children:"Chat Administrativo"}),e.jsx("p",{className:"text-sm text-gray-500",children:"IA com acesso total ao sistema"})]})]}),e.jsxs($,{className:"bg-gradient-to-r from-green-500 to-emerald-500",children:[e.jsx(g,{className:"h-3 w-3 mr-1"}),"Online"]})]})}),e.jsx("div",{className:"p-4 border-b border-gray-200 dark:border-gray-800",children:e.jsx("div",{className:"grid grid-cols-2 md:grid-cols-4 gap-2",children:z.map(s=>{const t=s.icon;return e.jsxs(j,{variant:"outline",size:"sm",onClick:()=>I(s.prompt),className:"flex items-center gap-2",children:[e.jsx(t,{className:"h-4 w-4"}),s.label]},s.label)})})}),e.jsxs("div",{className:"flex-1 overflow-y-auto p-4 space-y-4",children:[p.map(s=>e.jsx("div",{className:`flex ${s.role==="user"?"justify-end":"justify-start"}`,children:e.jsx(v,{className:`max-w-[80%] ${s.role==="user"?"bg-gradient-to-r from-blue-500 to-purple-500 text-white":s.role==="system"?"bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200":"bg-white dark:bg-gray-800"}`,children:e.jsxs(A,{className:"p-4",children:[e.jsxs("div",{className:"flex items-start gap-2",children:[s.role==="assistant"&&e.jsx(N,{className:"h-5 w-5 text-blue-600 mt-1 flex-shrink-0"}),s.role==="system"&&e.jsx(g,{className:"h-5 w-5 text-amber-600 mt-1 flex-shrink-0"}),e.jsx("div",{className:"flex-1 whitespace-pre-wrap break-words text-sm",children:s.content})]}),e.jsx("div",{className:`text-xs mt-2 ${s.role==="user"?"text-white/70":"text-gray-500"}`,children:s.timestamp.toLocaleTimeString("pt-BR")})]})})},s.id)),c&&e.jsx("div",{className:"flex justify-start",children:e.jsx(v,{className:"bg-white dark:bg-gray-800",children:e.jsx(A,{className:"p-4",children:e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(w,{className:"h-4 w-4 animate-spin text-blue-600"}),e.jsx("span",{className:"text-sm text-gray-500",children:"Processando..."})]})})})}),e.jsx("div",{ref:f})]}),e.jsx("div",{className:"border-t border-gray-200 dark:border-gray-800 p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl",children:e.jsxs("div",{className:"flex gap-2",children:[e.jsx(O,{value:m,onChange:s=>u(s.target.value),onKeyDown:s=>{s.key==="Enter"&&!s.shiftKey&&(s.preventDefault(),b())},placeholder:"Digite seu comando... (Ex: 'stats gerais', 'audite o sistema', 'clientes ativos')",className:"min-h-[60px] resize-none",disabled:c}),e.jsx(j,{onClick:b,disabled:!m.trim()||c,className:"bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600",size:"lg",children:c?e.jsx(w,{className:"h-5 w-5 animate-spin"}):e.jsx(M,{className:"h-5 w-5"})})]})})]})})}export{H as default};
