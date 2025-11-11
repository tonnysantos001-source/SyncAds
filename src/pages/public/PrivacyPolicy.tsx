import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Logo from '@/components/Logo';

const PrivacyPolicy = () => {
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
          Política de Privacidade
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Última atualização: {new Date().toLocaleDateString('pt-BR')}
        </p>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <h2>1. Introdução</h2>
          <p>
            A SyncAds ("nós", "nosso" ou "SyncAds") respeita sua privacidade e está comprometida em proteger
            seus dados pessoais. Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e
            protegemos suas informações quando você utiliza nossa plataforma SaaS.
          </p>
          <p>
            Nossa plataforma oferece serviços de checkout de pagamento e assistente de Inteligência Artificial
            para automação e criação de anúncios em plataformas como Google Ads, Meta (Facebook/Instagram),
            TikTok, YouTube e outras.
          </p>
          <p>
            Esta política está em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
          </p>

          <h2>2. Dados que Coletamos</h2>

          <h3>2.1 Informações de Cadastro</h3>
          <ul>
            <li>Nome completo</li>
            <li>Endereço de e-mail</li>
            <li>Número de telefone</li>
            <li>Informações de empresa (se aplicável)</li>
            <li>CPF/CNPJ para fins de faturamento</li>
            <li>Endereço de cobrança</li>
          </ul>

          <h3>2.2 Dados de Pagamento</h3>
          <ul>
            <li>Informações de cartão de crédito (processadas através de gateways seguros)</li>
            <li>Histórico de transações</li>
            <li>Dados de faturamento e notas fiscais</li>
            <li>Informações sobre assinaturas e planos contratados</li>
          </ul>

          <h3>2.3 Dados de Uso da Plataforma</h3>
          <ul>
            <li>Campanhas publicitárias criadas</li>
            <li>Interações com o assistente de IA</li>
            <li>Produtos cadastrados em seu checkout</li>
            <li>Configurações de checkout personalizadas</li>
            <li>Dados de clientes finais que passam pelo seu checkout</li>
            <li>Métricas de desempenho de campanhas</li>
            <li>Logs de uso do sistema</li>
          </ul>

          <h3>2.4 Dados Técnicos</h3>
          <ul>
            <li>Endereço IP</li>
            <li>Tipo de navegador e dispositivo</li>
            <li>Sistema operacional</li>
            <li>Cookies e tecnologias similares</li>
            <li>Páginas acessadas e tempo de uso</li>
            <li>Informações de localização geográfica (baseado em IP)</li>
          </ul>

          <h3>2.5 Dados Processados pela IA</h3>
          <ul>
            <li>Prompts e comandos enviados ao assistente de IA</li>
            <li>Conteúdo gerado pela IA (textos de anúncios, criativos, etc.)</li>
            <li>Histórico de conversas com o assistente</li>
            <li>Imagens geradas ou processadas pela IA</li>
            <li>Dados de análise e insights fornecidos pela IA</li>
          </ul>

          <h2>3. Como Usamos seus Dados</h2>

          <h3>3.1 Prestação de Serviços</h3>
          <ul>
            <li>Processar pagamentos através do nosso checkout</li>
            <li>Fornecer acesso ao assistente de IA para criação de campanhas</li>
            <li>Gerenciar sua conta e assinatura</li>
            <li>Integrar com plataformas de anúncios (Google, Meta, TikTok, YouTube)</li>
            <li>Gerar relatórios e análises de desempenho</li>
            <li>Enviar notificações sobre transações e atividades importantes</li>
          </ul>

          <h3>3.2 Melhoria dos Serviços</h3>
          <ul>
            <li>Treinar e melhorar nossos algoritmos de IA</li>
            <li>Analisar padrões de uso para otimizar a plataforma</li>
            <li>Desenvolver novos recursos e funcionalidades</li>
            <li>Realizar pesquisas e análises estatísticas</li>
          </ul>

          <h3>3.3 Comunicação</h3>
          <ul>
            <li>Enviar atualizações sobre a plataforma</li>
            <li>Notificar sobre alterações em políticas ou termos</li>
            <li>Fornecer suporte técnico</li>
            <li>Enviar conteúdo educacional e dicas (com seu consentimento)</li>
          </ul>

          <h3>3.4 Segurança e Conformidade</h3>
          <ul>
            <li>Prevenir fraudes e atividades maliciosas</li>
            <li>Cumprir obrigações legais e regulatórias</li>
            <li>Proteger direitos e propriedade da SyncAds</li>
            <li>Resolver disputas</li>
          </ul>

          <h2>4. Compartilhamento de Dados</h2>

          <h3>4.1 Provedores de Serviços</h3>
          <p>
            Compartilhamos dados com prestadores de serviços que nos auxiliam na operação da plataforma:
          </p>
          <ul>
            <li><strong>Supabase:</strong> Hospedagem de banco de dados e autenticação</li>
            <li><strong>Anthropic (Claude):</strong> Processamento de IA para criação de conteúdo</li>
            <li><strong>Gateways de Pagamento:</strong> Processamento de transações financeiras</li>
            <li><strong>Plataformas de Anúncios:</strong> Google Ads, Meta Ads, TikTok Ads, YouTube Ads</li>
            <li><strong>Serviços de E-mail:</strong> Envio de notificações e comunicações</li>
            <li><strong>Provedores de Cloud:</strong> Armazenamento e processamento de dados</li>
          </ul>

          <h3>4.2 Plataformas de Anúncios</h3>
          <p>
            Quando você conecta contas de anúncios (Google, Meta, TikTok, YouTube), compartilhamos
            dados necessários para criar e gerenciar campanhas nessas plataformas, conforme as
            políticas de privacidade de cada plataforma.
          </p>

          <h3>4.3 Obrigações Legais</h3>
          <p>
            Podemos divulgar seus dados quando exigido por lei, ordem judicial, ou para proteger
            nossos direitos legais e de terceiros.
          </p>

          <h3>4.4 Transferência de Negócio</h3>
          <p>
            Em caso de fusão, aquisição ou venda de ativos, seus dados podem ser transferidos
            para a nova entidade proprietária.
          </p>

          <h2>5. Armazenamento e Segurança</h2>

          <h3>5.1 Localização dos Dados</h3>
          <p>
            Seus dados são armazenados em servidores seguros localizados principalmente nos Estados
            Unidos e Europa, operados por nossos provedores de infraestrutura (Supabase/AWS).
          </p>

          <h3>5.2 Medidas de Segurança</h3>
          <ul>
            <li>Criptografia de dados em trânsito (SSL/TLS) e em repouso</li>
            <li>Autenticação de dois fatores (2FA) disponível</li>
            <li>Controles de acesso rigorosos</li>
            <li>Monitoramento contínuo de segurança</li>
            <li>Backups regulares e redundância</li>
            <li>Auditorias de segurança periódicas</li>
          </ul>

          <h3>5.3 Período de Retenção</h3>
          <ul>
            <li><strong>Dados de conta ativa:</strong> Mantidos enquanto sua conta estiver ativa</li>
            <li><strong>Dados de transações:</strong> 5 anos para conformidade fiscal</li>
            <li><strong>Dados de IA:</strong> Histórico de conversas mantido conforme seu plano</li>
            <li><strong>Logs técnicos:</strong> 90 dias</li>
            <li><strong>Conta cancelada:</strong> 30 dias após cancelamento (exceto obrigações legais)</li>
          </ul>

          <h2>6. Seus Direitos (LGPD)</h2>
          <p>
            Conforme a Lei Geral de Proteção de Dados, você tem os seguintes direitos:
          </p>
          <ul>
            <li><strong>Acesso:</strong> Solicitar cópia dos seus dados pessoais</li>
            <li><strong>Correção:</strong> Atualizar dados incompletos ou incorretos</li>
            <li><strong>Exclusão:</strong> Solicitar a remoção de seus dados (sujeito a obrigações legais)</li>
            <li><strong>Portabilidade:</strong> Receber seus dados em formato estruturado</li>
            <li><strong>Revogação:</strong> Retirar consentimento para processamento de dados</li>
            <li><strong>Oposição:</strong> Opor-se ao processamento de seus dados</li>
            <li><strong>Informação:</strong> Saber com quem compartilhamos seus dados</li>
            <li><strong>Anonimização:</strong> Solicitar anonimização de dados não essenciais</li>
          </ul>
          <p>
            Para exercer qualquer destes direitos, entre em contato através de: <strong>privacidade@syncads.com.br</strong>
          </p>

          <h2>7. Uso de Cookies</h2>
          <p>
            Utilizamos cookies e tecnologias similares para:
          </p>
          <ul>
            <li><strong>Essenciais:</strong> Manter sua sessão e autenticação</li>
            <li><strong>Funcionais:</strong> Lembrar preferências e configurações</li>
            <li><strong>Analytics:</strong> Entender como você usa a plataforma</li>
            <li><strong>Marketing:</strong> Personalizar sua experiência (com consentimento)</li>
          </ul>
          <p>
            Você pode gerenciar cookies nas configurações do seu navegador, mas isso pode afetar
            a funcionalidade da plataforma.
          </p>

          <h2>8. Processamento de IA e Dados</h2>

          <h3>8.1 Como Funciona</h3>
          <p>
            Nosso assistente de IA utiliza o modelo Claude (Anthropic) para processar seus comandos
            e gerar conteúdo para campanhas publicitárias. Os dados enviados à IA incluem:
          </p>
          <ul>
            <li>Descrições de produtos e serviços</li>
            <li>Informações sobre seu público-alvo</li>
            <li>Objetivos de marketing</li>
            <li>Histórico de conversas anteriores</li>
          </ul>

          <h3>8.2 Uso pela Anthropic</h3>
          <p>
            A Anthropic processa seus dados conforme sua própria política de privacidade. Eles não
            utilizam dados de clientes empresariais para treinar seus modelos públicos, conforme
            seu compromisso de privacidade empresarial.
          </p>

          <h3>8.3 Limites Diários</h3>
          <p>
            Controlamos o uso de IA através de limites diários baseados em seu plano, para garantir
            qualidade de serviço e conformidade com termos de uso.
          </p>

          <h2>9. Dados de Checkout</h2>

          <h3>9.1 Período de Teste</h3>
          <p>
            Oferecemos 7 dias gratuitos para testar nosso sistema de checkout. Durante este período,
            coletamos dados de uso para avaliar sua experiência.
          </p>

          <h3>9.2 Transações</h3>
          <p>
            Após o período de teste, cobramos 1,5% sobre cada transação aprovada. Todos os dados
            de pagamento são processados por gateways certificados PCI-DSS. Nós não armazenamos
            dados completos de cartão de crédito.
          </p>

          <h3>9.3 Dados de Clientes Finais</h3>
          <p>
            Quando você usa nosso checkout, coletamos dados de seus clientes finais (nome, e-mail,
            endereço, etc.). Você é o controlador desses dados e deve ter sua própria política de
            privacidade informando seus clientes sobre o processamento.
          </p>

          <h2>10. Menores de Idade</h2>
          <p>
            Nossa plataforma não é destinada a menores de 18 anos. Não coletamos intencionalmente
            dados de menores. Se identificarmos dados de menores, iremos removê-los imediatamente.
          </p>

          <h2>11. Links Externos</h2>
          <p>
            Nossa plataforma pode conter links para serviços externos (Google Ads, Meta, TikTok, etc.).
            Não somos responsáveis pelas práticas de privacidade desses sites. Recomendamos ler as
            políticas de privacidade de cada plataforma que você conectar.
          </p>

          <h2>12. Alterações nesta Política</h2>
          <p>
            Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos sobre
            mudanças significativas através de:
          </p>
          <ul>
            <li>E-mail para o endereço cadastrado</li>
            <li>Notificação dentro da plataforma</li>
            <li>Aviso na landing page</li>
          </ul>
          <p>
            O uso continuado da plataforma após alterações constitui aceitação da nova política.
          </p>

          <h2>13. Encarregado de Dados (DPO)</h2>
          <p>
            Para questões sobre privacidade e proteção de dados, nosso Encarregado de Dados pode
            ser contatado através de:
          </p>
          <ul>
            <li><strong>E-mail:</strong> dpo@syncads.com.br</li>
            <li><strong>E-mail alternativo:</strong> privacidade@syncads.com.br</li>
          </ul>

          <h2>14. Reclamações</h2>
          <p>
            Se não estivermos resolvendo suas preocupações adequadamente, você tem o direito de
            apresentar uma reclamação à Autoridade Nacional de Proteção de Dados (ANPD):
          </p>
          <ul>
            <li><strong>Website:</strong> www.gov.br/anpd</li>
            <li><strong>E-mail:</strong> atendimento@anpd.gov.br</li>
          </ul>

          <h2>15. Contato</h2>
          <p>
            Para dúvidas sobre esta Política de Privacidade ou sobre o tratamento de seus dados:
          </p>
          <ul>
            <li><strong>E-mail de Privacidade:</strong> privacidade@syncads.com.br</li>
            <li><strong>E-mail do DPO:</strong> dpo@syncads.com.br</li>
            <li><strong>Suporte Geral:</strong> suporte@syncads.com.br</li>
            <li><strong>E-mail Jurídico:</strong> legal@syncads.com.br</li>
          </ul>

          <h2>16. Consentimento</h2>
          <p>
            Ao usar a plataforma SyncAds, você confirma que leu, compreendeu e concordou com esta
            Política de Privacidade. Para determinados processamentos, podemos solicitar seu
            consentimento explícito adicional.
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

export default PrivacyPolicy;
