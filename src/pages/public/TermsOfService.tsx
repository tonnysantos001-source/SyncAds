import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Logo from '@/components/Logo';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Logo />
            <Button variant="ghost" size="sm" asChild>
              <Link to="/" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-12 max-w-4xl">
        <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-4">
          Termos de Uso
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Última atualização: {new Date().toLocaleDateString('pt-BR')}
        </p>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <h2>1. Aceitação dos Termos</h2>
          <p>
            Ao acessar e usar o SyncAds, você concorda com estes Termos de Uso. Se você não concordar, não use nossos serviços.
          </p>

          <h2>2. Descrição dos Serviços</h2>
          <p>
            O SyncAds oferece uma plataforma SaaS que inclui:
          </p>
          <ul>
            <li>Sistema de checkout customizado para e-commerce</li>
            <li>Integração com múltiplos gateways de pagamento</li>
            <li>Assistente de Inteligência Artificial para gestão de negócios</li>
            <li>Ferramentas de analytics e automação</li>
          </ul>

          <h2>3. Planos e Pagamentos</h2>
          <h3>3.1 Planos de Assinatura</h3>
          <p>
            Oferecemos 4 planos: Gratuito, Starter (R$ 97/mês), Pro (R$ 297/mês) e Enterprise (R$ 997/mês).
          </p>
          <h3>3.2 Checkout de Pagamento</h3>
          <p>
            Nosso serviço de checkout oferece 7 dias grátis para teste. Após o período de teste,
            cobramos 1,5% sobre cada transação aprovada processada através do nosso sistema.
          </p>

          <h2>4. Uso Aceitável</h2>
          <p>Você concorda em NÃO:</p>
          <ul>
            <li>Usar a plataforma para atividades ilegais</li>
            <li>Tentar acessar sistemas ou dados de outros usuários</li>
            <li>Fazer engenharia reversa da plataforma</li>
            <li>Abusar dos limites de uso de IA</li>
          </ul>

          <h2>5. Propriedade Intelectual</h2>
          <p>
            Todo o conteúdo, código e design da plataforma são propriedade do SyncAds.
            Você mantém os direitos sobre os dados que insere na plataforma.
          </p>

          <h2>6. Limitação de Responsabilidade</h2>
          <p>
            O SyncAds não se responsabiliza por perdas indiretas, lucros cessantes ou danos emergentes
            resultantes do uso da plataforma.
          </p>

          <h2>7. Cancelamento</h2>
          <p>
            Você pode cancelar sua assinatura a qualquer momento. O cancelamento terá efeito no final
            do período de cobrança atual.
          </p>

          <h2>8. Modificações</h2>
          <p>
            Reservamos o direito de modificar estes termos a qualquer momento. Notificaremos usuários
            sobre mudanças significativas.
          </p>

          <h2>9. Lei Aplicável</h2>
          <p>
            Estes termos são regidos pelas leis brasileiras. Foro: Comarca de São Paulo, SP.
          </p>

          <h2>10. Contato</h2>
          <p>
            Para dúvidas sobre estes termos:
            <br />
            Email: legal@syncads.com.br
            <br />
            Suporte: suporte@syncads.com.br
          </p>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
          <Button asChild>
            <Link to="/">Voltar para Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;

