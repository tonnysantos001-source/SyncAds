import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { categorizedIntegrations, Integration } from '@/data/mocks';
import { useStore } from '@/store/useStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';

const IntegrationCard: React.FC<{ integration: Integration }> = ({ integration }) => {
  const connectedIntegrations = useStore(state => state.connectedIntegrations);
  const toggleIntegration = useStore(state => state.toggleIntegration);
  const { toast } = useToast();
  const isConnected = connectedIntegrations.includes(integration.id);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const { comingSoon } = integration;

  const handleToggle = (checked: boolean) => {
    if (comingSoon) return;

    if (checked) {
      setIsModalOpen(true);
    } else {
      toggleIntegration(integration.id, false);
      toast({
        title: "Integração Desconectada",
        description: `${integration.name} foi desconectado com sucesso.`,
        variant: "warning",
      });
    }
  };

  const handleConnect = () => {
    setIsConnecting(true);
    setTimeout(() => {
      toggleIntegration(integration.id, true);
      setIsConnecting(false);
      setIsModalOpen(false);
      toast({
        title: "Integração Conectada!",
        description: `${integration.name} foi conectado com sucesso.`,
        variant: "success",
      });
    }, 1000);
  };

  const Logo = integration.logo;

  return (
    <>
      <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-4">
              <Logo className="h-8 w-8 text-muted-foreground" />
              <div>
                <CardTitle className="text-lg">{integration.name}</CardTitle>
              </div>
            </div>
            {comingSoon ? (
              <Badge variant="outline">Em breve</Badge>
            ) : (
              <Switch checked={isConnected} onCheckedChange={handleToggle} aria-label={`Conectar ${integration.name}`} />
            )}
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{integration.description}</p>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conectar com {integration.name}</DialogTitle>
            <DialogDescription>
              Insira sua chave de API para conectar sua conta.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="api-key">Chave de API</Label>
              <Input id="api-key" placeholder="sk_live_..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleConnect} loading={isConnecting}>
              Conectar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

const IntegrationsPage: React.FC = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Integrações</h1>
        <p className="text-muted-foreground">Conecte suas ferramentas e automatize seu fluxo de trabalho.</p>
      </div>
      {categorizedIntegrations.map(category => (
        <motion.div layout key={category.title} className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">{category.title}</h2>
          <motion.div layout className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {category.integrations.map(integration => (
              <IntegrationCard key={integration.id} integration={integration} />
            ))}
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
};

export default IntegrationsPage;
