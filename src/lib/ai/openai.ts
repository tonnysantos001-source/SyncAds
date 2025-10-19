// Serviço de integração com IA (OpenAI-compatible APIs)

export interface AiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AiCompletionRequest {
  messages: AiMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface AiCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class AiService {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(apiKey: string, baseUrl?: string, model?: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl || 'https://api.openai.com/v1';
    this.model = model || 'gpt-3.5-turbo';
  }

  async chat(messages: AiMessage[], options?: {
    temperature?: number;
    max_tokens?: number;
  }): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: options?.temperature || 0.7,
          max_tokens: options?.max_tokens || 1000,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          error.error?.message || 
          `Erro na API: ${response.status} ${response.statusText}`
        );
      }

      const data: AiCompletionResponse = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('Nenhuma resposta foi gerada pela IA');
      }

      return data.choices[0].message.content;
    } catch (error: any) {
      console.error('Erro ao chamar IA:', error);
      throw new Error(error.message || 'Erro ao se comunicar com a IA');
    }
  }

  async streamChat(
    messages: AiMessage[],
    onChunk: (chunk: string) => void,
    options?: {
      temperature?: number;
      max_tokens?: number;
    }
  ): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: options?.temperature || 0.7,
          max_tokens: options?.max_tokens || 1000,
          stream: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          error.error?.message || 
          `Erro na API: ${response.status} ${response.statusText}`
        );
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Não foi possível ler a resposta');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                onChunk(content);
              }
            } catch (e) {
              // Ignorar linhas que não são JSON válido
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Erro ao fazer stream da IA:', error);
      throw new Error(error.message || 'Erro ao se comunicar com a IA');
    }
  }

  async testConnection(): Promise<{ success: boolean; error?: string; isCorsError?: boolean }> {
    try {
      await this.chat([
        { role: 'user', content: 'Teste de conexão. Responda apenas "OK".' }
      ], { max_tokens: 10 });
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || 'Erro desconhecido';
      const isCorsError = 
        errorMessage.includes('CORS') ||
        errorMessage.includes('Failed to fetch') ||
        errorMessage.includes('NetworkError') ||
        error.name === 'TypeError';
      
      return { 
        success: false, 
        error: errorMessage,
        isCorsError 
      };
    }
  }
}

// Helper para criar instância do serviço
export function createAiService(apiKey: string, baseUrl?: string): AiService {
  return new AiService(apiKey, baseUrl);
}
