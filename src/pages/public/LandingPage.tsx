import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Bot, Target, BarChart3, Zap } from 'lucide-react';

const FeatureCard = ({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) => (
  <div className="flex flex-col items-center p-6 text-center bg-card rounded-lg border shadow-sm">
    <div className="p-3 mb-4 bg-primary/10 rounded-full">
      <Icon className="w-8 h-8 text-primary" />
    </div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </div>
);

const LandingPage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="container mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Bot className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold tracking-tight text-foreground">
            Marketing AI
          </span>
        </div>
        <nav className="space-x-4">
          <Button variant="ghost" asChild>
            <Link to="/login">Login</Link>
          </Button>
          <Button asChild>
            <Link to="/register">Comece Agora</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-4 sm:px-6 py-20 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter mb-4">
            O Futuro do Marketing é <span className="text-primary">Inteligente</span>.
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-muted-foreground mb-8">
            Nossa plataforma de IA centraliza suas campanhas, analisa dados em tempo real e automatiza tarefas para que você possa focar no que realmente importa: crescer seu negócio.
          </p>
          <Button size="lg" asChild>
            <Link to="/register">Comece grátis por 14 dias</Link>
          </Button>
        </section>

        <section className="bg-muted/40 py-20">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold">Tudo que você precisa em um só lugar</h2>
              <p className="text-muted-foreground">Ferramentas poderosas para otimizar seu marketing.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard 
                icon={Target}
                title="Gestão de Campanhas"
                description="Crie, gerencie e otimize campanhas em múltiplas plataformas com a ajuda da nossa IA."
              />
              <FeatureCard 
                icon={BarChart3}
                title="Analytics Avançado"
                description="Obtenha insights profundos sobre seu público e o desempenho das campanhas com dashboards intuitivos."
              />
              <FeatureCard 
                icon={Zap}
                title="Automação Inteligente"
                description="Automatize relatórios, ajustes de orçamento e receba sugestões de otimização da nossa IA."
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="container mx-auto px-4 sm:px-6 py-6 text-center text-muted-foreground">
        <p>&copy; 2025 Marketing AI. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
