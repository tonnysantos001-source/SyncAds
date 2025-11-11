import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Logo from '@/components/Logo';

const RefundPolicy = () => {
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
          Política de Reembolso
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Última atualização: {new Date().toLocaleDateString('pt-BR')}
        </p>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <h2>1. Visão Geral</h2>
          <p>
            A SyncAds está comprometida com a satisfação de nossos clientes. Esta Política de Reembolso
            descreve as condições sob as quais você pode solicitar reembolso pelos serviços contratados.
          </p>
          <p>
            Nossa plataforma oferece dois tipos principais de serviços: <strong>(1) Planos de Assinatura</strong> para
            acesso à plataforma e IA, e <strong>(2) Serviço de Checkout</strong> com cobrança por transação.
          </p>

          <h2>2. Período de Teste Gratuito</h2>

          <h3>2.1 Checkout - 7 Dias Grátis</h3>
          <p>
            Oferecemos <strong>7 dias gratuitos</strong> para testar nosso sistema de checkout de pagamento.
            Durante este período:
          </p>
          <ul>
            <li>Você pode processar transações sem nenhum custo</li>
            <li>Não cobramos a taxa de 1,5% por transação</li>
            <li>Você tem acesso completo às funcionalidades do checkout</li>
            <li>Pode cancelar a qualquer momento sem cobrança</li>
          </ul>
          <p>
            <strong>Importante:</strong> Após os 7 dias, a cobrança de 1,5% por transação aprovada será
            ativada automaticamente. Você será notificado 2 dias antes do fim do período de teste.
          </p>

          <h3>2.2 Planos de Assinatura</h3>
          <p>
            Planos pagos (Starter, Pro, Enterprise) não possuem período de teste adicional, mas você
            pode utilizar o <strong>Plano Gratuito</strong> indefinidamente para testar a plataforma
            antes de fazer upgrade.
          </p>

          <h2>3. Reembolso de Assinaturas</h2>

          <h3>3.1 Direito de Arrependimento (7 Dias)</h3>
          <p>
            Conforme o Código de Defesa do Consumidor (CDC - Art. 49), você tem direito a se arrepender
            da contratação em até <strong>7 dias corridos</strong> após a data da assinatura, com
            reembolso integral e imediato.
          </p>
          <p>
            <strong>Condições para reembolso integral (7 dias):</strong>
          </p>
          <ul>
            <li>Solicitação feita em até 7 dias corridos da contratação</li>
            <li>Reembolso de 100% do valor pago</li>
            <li>Processamento em até 5 dias úteis</li>
            <li>Não há penalidades ou taxas</li>
          </ul>

          <h3>3.2 Reembolso Proporcional (Após 7 Dias)</h3>
          <p>
            Após o período de 7 dias, não oferecemos reembolso proporcional, mas você pode:
          </p>
          <ul>
            <li>Cancelar sua assinatura a qualquer momento</li>
            <li>Continuar usando o serviço até o final do período pago</li>
            <li>Fazer downgrade para um plano inferior no próximo ciclo</li>
            <li>Retornar ao plano gratuito após o término do período</li>
          </ul>

          <h3>3.3 Exceções para Reembolso Parcial</h3>
          <p>
            Podemos oferecer reembolso proporcional em casos excepcionais:
          </p>
          <ul>
            <li><strong>Problemas técnicos graves:</strong> Indisponibilidade do serviço por mais de 48 horas consecutivas</li>
            <li><strong>Funcionalidades não entregues:</strong> Recursos prometidos não disponíveis</li>
            <li><strong>Decisão comercial:</strong> A critério da SyncAds em casos específicos</li>
          </ul>
          <p>
            Nesses casos, o reembolso será proporcional aos dias não utilizados do período pago.
          </p>

          <h2>4. Taxas de Checkout (1,5% por Transação)</h2>

          <h3>4.1 Política Geral</h3>
          <p>
            As taxas de 1,5% cobradas sobre transações aprovadas <strong>NÃO são reembolsáveis</strong>,
            pois representam o processamento já realizado e custos operacionais incorridos.
          </p>

          <h3>4.2 Exceções</h3>
          <p>
            Reembolsaremos taxas de transação apenas nas seguintes situações:
          </p>
          <ul>
            <li><strong>Erro técnico da plataforma:</strong> Falha comprovada em nosso sistema que impediu
                a transação de ser completada corretamente</li>
            <li><strong>Cobrança duplicada:</strong> Se a mesma transação foi cobrada duas vezes por erro do sistema</li>
            <li><strong>Cobrança incorreta:</strong> Taxa aplicada em valor diferente do acordado (1,5%)</li>
          </ul>

          <h3>4.3 Transações de Clientes Finais</h3>
          <p>
            Reembolsos solicitados por seus clientes finais (compradores do seu checkout) são de sua
            responsabilidade. A taxa de 1,5% cobrada pela SyncAds não é reembolsável mesmo se você
            reembolsar seu cliente.
          </p>

          <h2>5. Créditos de IA</h2>

          <h3>5.1 Limites Diários</h3>
          <p>
            Os limites de uso de IA (mensagens e imagens por dia) são renovados diariamente e não
            são acumulativos. Limites não utilizados não são transferíveis ou reembolsáveis.
          </p>

          <h3>5.2 Downgrade de Plano</h3>
          <p>
            Se você fizer downgrade para um plano com limites menores de IA:
          </p>
          <ul>
            <li>O novo limite será aplicado no próximo ciclo de cobrança</li>
            <li>Não há reembolso pela diferença de limites entre planos</li>
            <li>Você continua com os limites do plano atual até o fim do período pago</li>
          </ul>

          <h2>6. Casos Sem Reembolso</h2>
          <p>
            <strong>NÃO</strong> oferecemos reembolso nas seguintes situações:
          </p>
          <ul>
            <li><strong>Mudança de ideia:</strong> Após o período de 7 dias de arrependimento</li>
            <li><strong>Falta de uso:</strong> Não utilizar a plataforma não gera direito a reembolso</li>
            <li><strong>Violação de termos:</strong> Conta suspensa por violação dos Termos de Uso</li>
            <li><strong>Limites atingidos:</strong> Atingir limites de uso do seu plano</li>
            <li><strong>Incompatibilidade técnica:</strong> Problemas com seu navegador, internet ou dispositivo</li>
            <li><strong>Expectativas não atendidas:</strong> Resultados de campanhas ou IA abaixo do esperado</li>
            <li><strong>Mudança de preços:</strong> Alteração de preços para novos ciclos de cobrança</li>
            <li><strong>Recursos de terceiros:</strong> Problemas com plataformas integradas (Google, Meta, TikTok, etc.)</li>
          </ul>

          <h2>7. Processo de Solicitação</h2>

          <h3>7.1 Como Solicitar</h3>
          <p>
            Para solicitar um reembolso, siga estes passos:
          </p>
          <ol>
            <li>Acesse sua conta na plataforma SyncAds</li>
            <li>Vá para <strong>Configurações → Cobrança</strong></li>
            <li>Clique em "Solicitar Reembolso" ou entre em contato com o suporte</li>
            <li>Preencha o formulário com:
              <ul>
                <li>Motivo detalhado da solicitação</li>
                <li>Número da transação ou assinatura</li>
                <li>Dados bancários para reembolso (se aplicável)</li>
              </ul>
            </li>
          </ol>
          <p>
            <strong>Contato alternativo:</strong> reembolso@syncads.com.br
          </p>

          <h3>7.2 Prazo de Análise</h3>
          <ul>
            <li><strong>Direito de arrependimento (7 dias):</strong> Aprovação automática, reembolso em até 5 dias úteis</li>
            <li><strong>Outros casos:</strong> Análise em até 7 dias úteis, reembolso em até 10 dias úteis após aprovação</li>
          </ul>

          <h3>7.3 Método de Reembolso</h3>
          <p>
            Reembolsos serão processados através do mesmo método de pagamento utilizado na compra:
          </p>
          <ul>
            <li><strong>Cartão de crédito:</strong> Estorno na fatura (pode levar até 2 faturas)</li>
            <li><strong>PIX:</strong> Transferência para conta bancária informada (1-2 dias úteis)</li>
            <li><strong>Boleto:</strong> Transferência para conta bancária informada (até 5 dias úteis)</li>
          </ul>

          <h2>8. Cancelamento de Assinatura</h2>

          <h3>8.1 Como Cancelar</h3>
          <p>
            Você pode cancelar sua assinatura a qualquer momento:
          </p>
          <ol>
            <li>Acesse <strong>Configurações → Cobrança</strong></li>
            <li>Clique em "Cancelar Assinatura"</li>
            <li>Confirme o cancelamento</li>
          </ol>

          <h3>8.2 Efeitos do Cancelamento</h3>
          <ul>
            <li>Você continua com acesso até o final do período pago</li>
            <li>Não há cobrança no próximo ciclo</li>
            <li>Sua conta retorna ao plano gratuito automaticamente</li>
            <li>Dados são mantidos por 30 dias após o cancelamento</li>
          </ul>

          <h3>8.3 Reativação</h3>
          <p>
            Você pode reativar sua assinatura a qualquer momento. Se reativar dentro de 30 dias,
            todos os seus dados serão restaurados.
          </p>

          <h2>9. Contestação de Cobrança</h2>

          <h3>9.1 Chargebacks</h3>
          <p>
            Se você contestar uma cobrança diretamente com seu banco (chargeback) sem antes entrar
            em contato conosco:
          </p>
          <ul>
            <li>Sua conta será suspensa imediatamente</li>
            <li>Podemos cobrar uma taxa administrativa de R$ 50,00</li>
            <li>Você perderá acesso imediato aos serviços</li>
            <li>Dados podem ser removidos após 7 dias</li>
          </ul>
          <p>
            <strong>Recomendação:</strong> Entre em contato conosco primeiro através de
            reembolso@syncads.com.br. Resolveremos a questão de forma mais rápida e amigável.
          </p>

          <h2>10. Garantia de Satisfação</h2>
          <p>
            Embora não ofereçamos garantia de reembolso após 7 dias, estamos comprometidos com sua
            satisfação. Se você tiver problemas com a plataforma:
          </p>
          <ul>
            <li>Nossa equipe de suporte está disponível para ajudar</li>
            <li>Oferecemos treinamento e tutoriais gratuitos</li>
            <li>Podemos recomendar o plano mais adequado às suas necessidades</li>
            <li>Em casos excepcionais, avaliamos soluções personalizadas</li>
          </ul>

          <h2>11. Alterações nesta Política</h2>
          <p>
            Reservamos o direito de modificar esta Política de Reembolso a qualquer momento.
            Alterações entram em vigor imediatamente após publicação. Você será notificado sobre
            mudanças significativas através de:
          </p>
          <ul>
            <li>E-mail para o endereço cadastrado</li>
            <li>Notificação dentro da plataforma</li>
            <li>Aviso na página de cobrança</li>
          </ul>
          <p>
            A versão mais recente desta política estará sempre disponível em nosso site.
          </p>

          <h2>12. Contato</h2>
          <p>
            Para questões sobre reembolsos ou esta política:
          </p>
          <ul>
            <li><strong>E-mail de Reembolsos:</strong> reembolso@syncads.com.br</li>
            <li><strong>Suporte Geral:</strong> suporte@syncads.com.br</li>
            <li><strong>Cobrança:</strong> cobranca@syncads.com.br</li>
            <li><strong>WhatsApp:</strong> +55 (11) 9XXXX-XXXX (horário comercial)</li>
          </ul>
          <p>
            Tempo de resposta: até 24 horas em dias úteis.
          </p>

          <h2>13. Resolução de Disputas</h2>
          <p>
            Em caso de disputa sobre reembolsos:
          </p>
          <ol>
            <li><strong>Primeiro:</strong> Entre em contato com nosso suporte</li>
            <li><strong>Segundo:</strong> Solicitação formal via e-mail de reembolsos</li>
            <li><strong>Terceiro:</strong> Mediação através de plataformas como Reclame Aqui ou Consumidor.gov.br</li>
            <li><strong>Último recurso:</strong> Ação judicial (foro: Comarca de São Paulo, SP)</li>
          </ol>

          <h2>14. Legislação Aplicável</h2>
          <p>
            Esta Política de Reembolso é regida pelas leis brasileiras, incluindo:
          </p>
          <ul>
            <li>Código de Defesa do Consumidor (Lei 8.078/1990)</li>
            <li>Marco Civil da Internet (Lei 12.965/2014)</li>
            <li>Lei Geral de Proteção de Dados (Lei 13.709/2018)</li>
          </ul>

          <h2>15. Aceitação</h2>
          <p>
            Ao contratar qualquer serviço da SyncAds, você confirma que leu, compreendeu e concordou
            com esta Política de Reembolso.
          </p>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row gap-4">
          <Button asChild>
            <Link to="/">Voltar para Home</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/terms">Ver Termos de Uso</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/privacy">Ver Política de Privacidade</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RefundPolicy;
