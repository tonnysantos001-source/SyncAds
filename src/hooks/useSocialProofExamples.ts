import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

interface SocialProofExample {
  type: 'RECENT_PURCHASE' | 'VISITOR_COUNT' | 'REVIEW';
  message: string;
  displayDuration: number;
  isActive: boolean;
}

const EXAMPLE_SOCIAL_PROOFS: SocialProofExample[] = [
  {
    type: 'RECENT_PURCHASE',
    message: '🎉 Maria de São Paulo acabou de comprar há 3 minutos!',
    displayDuration: 5,
    isActive: true,
  },
  {
    type: 'RECENT_PURCHASE',
    message: '✨ João do Rio de Janeiro finalizou uma compra agora!',
    displayDuration: 5,
    isActive: true,
  },
  {
    type: 'RECENT_PURCHASE',
    message: '🔥 Ana de Belo Horizonte acabou de comprar este produto!',
    displayDuration: 6,
    isActive: true,
  },
  {
    type: 'VISITOR_COUNT',
    message: '👀 38 pessoas estão visualizando este produto agora',
    displayDuration: 7,
    isActive: true,
  },
  {
    type: 'VISITOR_COUNT',
    message: '🔥 +120 pessoas compraram nas últimas 24 horas',
    displayDuration: 6,
    isActive: true,
  },
  {
    type: 'VISITOR_COUNT',
    message: '⚡ Mais de 50 pessoas adicionaram ao carrinho hoje',
    displayDuration: 6,
    isActive: true,
  },
  {
    type: 'REVIEW',
    message: '⭐⭐⭐⭐⭐ "Produto excelente! Recomendo muito" - Carlos',
    displayDuration: 8,
    isActive: true,
  },
  {
    type: 'REVIEW',
    message: '⭐⭐⭐⭐⭐ "Superou minhas expectativas!" - Juliana',
    displayDuration: 7,
    isActive: true,
  },
  {
    type: 'REVIEW',
    message: '⭐⭐⭐⭐⭐ "Melhor compra que já fiz!" - Pedro',
    displayDuration: 7,
    isActive: true,
  },
  {
    type: 'RECENT_PURCHASE',
    message: '💚 Alguém de Curitiba acabou de fazer um pedido',
    displayDuration: 5,
    isActive: true,
  },
  {
    type: 'VISITOR_COUNT',
    message: '🚨 Apenas 3 unidades restantes em estoque!',
    displayDuration: 8,
    isActive: true,
  },
  {
    type: 'RECENT_PURCHASE',
    message: '🎊 Patricia de Porto Alegre comprou há 7 minutos',
    displayDuration: 5,
    isActive: true,
  },
];

export function useSocialProofExamples() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  /**
   * Retorna exemplos de provas sociais sem salvar no banco
   */
  const getExamples = (): SocialProofExample[] => {
    return EXAMPLE_SOCIAL_PROOFS;
  };

  /**
   * Retorna exemplos filtrados por tipo
   */
  const getExamplesByType = (type: 'RECENT_PURCHASE' | 'VISITOR_COUNT' | 'REVIEW'): SocialProofExample[] => {
    return EXAMPLE_SOCIAL_PROOFS.filter(proof => proof.type === type);
  };

  /**
   * Retorna um exemplo aleatório
   */
  const getRandomExample = (): SocialProofExample => {
    const randomIndex = Math.floor(Math.random() * EXAMPLE_SOCIAL_PROOFS.length);
    return EXAMPLE_SOCIAL_PROOFS[randomIndex];
  };

  /**
   * Retorna N exemplos aleatórios únicos
   */
  const getRandomExamples = (count: number): SocialProofExample[] => {
    const shuffled = [...EXAMPLE_SOCIAL_PROOFS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, EXAMPLE_SOCIAL_PROOFS.length));
  };

  /**
   * Cria exemplos de provas sociais no banco de dados para o usuário
   * Útil para novos usuários terem algo para começar
   */
  const createExamplesForUser = async (userId: string, count: number = 5): Promise<boolean> => {
    if (!userId) {
      toast({
        title: 'Erro',
        description: 'ID do usuário não fornecido',
        variant: 'destructive',
      });
      return false;
    }

    setLoading(true);

    try {
      // Verificar se o usuário já tem provas sociais
      const { data: existing, error: checkError } = await supabase
        .from('SocialProof')
        .select('id')
        .eq('userId', userId)
        .limit(1);

      if (checkError) throw checkError;

      // Se já tem provas sociais, não criar exemplos
      if (existing && existing.length > 0) {
        toast({
          title: 'Já existem provas sociais',
          description: 'Você já possui provas sociais configuradas.',
        });
        return false;
      }

      // Selecionar exemplos aleatórios
      const examplesToCreate = getRandomExamples(count);

      // Preparar dados para inserção
      const proofsToInsert = examplesToCreate.map(example => ({
        userId,
        type: example.type,
        message: example.message,
        displayDuration: example.displayDuration,
        isActive: example.isActive,
      }));

      // Inserir no banco
      const { error: insertError } = await supabase
        .from('SocialProof')
        .insert(proofsToInsert);

      if (insertError) throw insertError;

      toast({
        title: 'Exemplos criados!',
        description: `${count} provas sociais de exemplo foram adicionadas. Você pode editá-las ou criar novas.`,
      });

      return true;
    } catch (error: any) {
      console.error('Erro ao criar exemplos:', error);
      toast({
        title: 'Erro ao criar exemplos',
        description: error.message || 'Tente novamente mais tarde',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cria um exemplo específico no banco de dados
   */
  const createSingleExample = async (
    userId: string,
    type: 'RECENT_PURCHASE' | 'VISITOR_COUNT' | 'REVIEW'
  ): Promise<boolean> => {
    if (!userId) return false;

    setLoading(true);

    try {
      // Pegar exemplos deste tipo
      const examples = getExamplesByType(type);
      if (examples.length === 0) return false;

      // Selecionar aleatório
      const example = examples[Math.floor(Math.random() * examples.length)];

      // Inserir no banco
      const { error } = await supabase
        .from('SocialProof')
        .insert({
          userId,
          type: example.type,
          message: example.message,
          displayDuration: example.displayDuration,
          isActive: example.isActive,
        });

      if (error) throw error;

      toast({
        title: 'Exemplo criado!',
        description: 'Prova social adicionada com sucesso.',
      });

      return true;
    } catch (error: any) {
      console.error('Erro ao criar exemplo:', error);
      toast({
        title: 'Erro ao criar exemplo',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Retorna sugestões de mensagens baseadas no tipo
   */
  const getMessageSuggestions = (type: 'RECENT_PURCHASE' | 'VISITOR_COUNT' | 'REVIEW'): string[] => {
    const suggestions: Record<string, string[]> = {
      RECENT_PURCHASE: [
        '🎉 [Nome] de [Cidade] acabou de comprar há [tempo] minutos!',
        '✨ [Nome] finalizou uma compra agora!',
        '🔥 Alguém de [Cidade] acabou de comprar este produto!',
        '💚 [Nome] acabou de fazer um pedido',
        '🎊 [Nome] de [Cidade] comprou há [tempo] minutos',
      ],
      VISITOR_COUNT: [
        '👀 [número] pessoas estão visualizando este produto agora',
        '🔥 +[número] pessoas compraram nas últimas 24 horas',
        '⚡ Mais de [número] pessoas adicionaram ao carrinho hoje',
        '🚨 Apenas [número] unidades restantes em estoque!',
        '📈 Este produto está sendo muito procurado!',
      ],
      REVIEW: [
        '⭐⭐⭐⭐⭐ "Produto excelente! Recomendo muito" - [Nome]',
        '⭐⭐⭐⭐⭐ "Superou minhas expectativas!" - [Nome]',
        '⭐⭐⭐⭐⭐ "Melhor compra que já fiz!" - [Nome]',
        '⭐⭐⭐⭐⭐ "Qualidade excepcional!" - [Nome]',
        '⭐⭐⭐⭐⭐ "Vale cada centavo!" - [Nome]',
      ],
    };

    return suggestions[type] || [];
  };

  return {
    loading,
    getExamples,
    getExamplesByType,
    getRandomExample,
    getRandomExamples,
    createExamplesForUser,
    createSingleExample,
    getMessageSuggestions,
  };
}
