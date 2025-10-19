// Parser para detectar e extrair intenções de criar campanhas da resposta da IA

export interface CampaignIntent {
  action: 'create_campaign';
  data: {
    name: string;
    platform: 'Google Ads' | 'Meta' | 'LinkedIn';
    budgetTotal: number;
    startDate: string;
    endDate?: string;
    objective?: string;
  };
}

// System prompt melhorado que instrui a IA a criar campanhas
export const campaignSystemPrompt = `
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
`;

// Detecta se há uma intenção de criar campanha na resposta
export function detectCampaignIntent(aiResponse: string): CampaignIntent | null {
  // Procura pelo bloco campaign-create
  const campaignRegex = /```campaign-create\s*\n([\s\S]*?)```/;
  const match = aiResponse.match(campaignRegex);
  
  if (!match) return null;
  
  try {
    const jsonData = JSON.parse(match[1].trim());
    
    // Validar campos obrigatórios
    if (!jsonData.name || !jsonData.platform || !jsonData.budgetTotal || !jsonData.startDate) {
      console.error('Campaign data missing required fields');
      return null;
    }
    
    // Validar plataforma
    const validPlatforms = ['Google Ads', 'Meta', 'LinkedIn'];
    if (!validPlatforms.includes(jsonData.platform)) {
      console.error('Invalid platform:', jsonData.platform);
      return null;
    }
    
    return {
      action: 'create_campaign',
      data: {
        name: jsonData.name,
        platform: jsonData.platform,
        budgetTotal: Number(jsonData.budgetTotal),
        startDate: jsonData.startDate,
        endDate: jsonData.endDate || undefined,
        objective: jsonData.objective || 'Conversões',
      },
    };
  } catch (error) {
    console.error('Failed to parse campaign data:', error);
    return null;
  }
}

// Remove o bloco de código campaign-create da resposta para exibir limpo ao usuário
export function cleanCampaignBlockFromResponse(response: string): string {
  return response.replace(/```campaign-create\s*\n[\s\S]*?```/g, '').trim();
}
