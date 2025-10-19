import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Bot, Key, Link2, Trash2, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

interface GlobalAiConnection {
  id: string;
  name: string;
  provider: string;
  apiKey: string;
  baseUrl?: string;
  model?: string;
  maxTokens: number;
  temperature: number;
  isActive: boolean;
  createdAt: string;
}

interface Organization {
  id: string;
  name: string;
}

export default function GlobalAiPage() {
  const [aiConnections, setAiConnections] = useState<GlobalAiConnection[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedAiId, setSelectedAiId] = useState<string>('');
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    provider: 'OPENAI',
    apiKey: '',
    baseUrl: '',
    model: '',
    maxTokens: 4096,
    temperature: 0.7,
  });

  // Assignment state
  const [selectedOrgIds, setSelectedOrgIds] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load AI connections
      const { data: aiData, error: aiError } = await supabase
        .from('GlobalAiConnection')
        .select('*')
        .order('createdAt', { ascending: false });

      if (aiError) throw aiError;
      setAiConnections(aiData || []);

      // Load organizations
      const { data: orgData, error: orgError } = await supabase
        .from('Organization')
        .select('id, name')
        .order('name');

      if (orgError) throw orgError;
      setOrganizations(orgData || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar dados',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createAiConnection = async () => {
    try {
      const { error } = await supabase.from('GlobalAiConnection').insert({
        name: formData.name,
        provider: formData.provider,
        apiKey: formData.apiKey,
        baseUrl: formData.baseUrl || null,
        model: formData.model || null,
        maxTokens: formData.maxTokens,
        temperature: formData.temperature,
        isActive: true,
      });

      if (error) throw error;

      toast({
        title: '✅ IA adicionada!',
        description: `${formData.name} foi criada com sucesso.`,
      });

      setIsDialogOpen(false);
      loadData();
      
      // Reset form
      setFormData({
        name: '',
        provider: 'OPENAI',
        apiKey: '',
        baseUrl: '',
        model: '',
        maxTokens: 4096,
        temperature: 0.7,
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao criar IA',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const toggleAiStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('GlobalAiConnection')
        .update({ isActive: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Status atualizado',
        description: `IA ${!currentStatus ? 'ativada' : 'desativada'}.`,
      });

      loadData();
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar status',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const openAssignDialog = async (aiId: string) => {
    setSelectedAiId(aiId);
    
    // Load already assigned organizations
    const { data } = await supabase
      .from('OrganizationAiConnection')
      .select('organizationId')
      .eq('globalAiConnectionId', aiId);
    
    setSelectedOrgIds(data?.map(d => d.organizationId) || []);
    setIsAssignDialogOpen(true);
  };

  const assignAiToOrganizations = async () => {
    try {
      // Remove all existing assignments
      await supabase
        .from('OrganizationAiConnection')
        .delete()
        .eq('globalAiConnectionId', selectedAiId);

      // Add new assignments
      const inserts = selectedOrgIds.map(orgId => ({
        organizationId: orgId,
        globalAiConnectionId: selectedAiId,
        isDefault: false,
      }));

      if (inserts.length > 0) {
        const { error } = await supabase
          .from('OrganizationAiConnection')
          .insert(inserts);

        if (error) throw error;
      }

      toast({
        title: '✅ IA atribuída!',
        description: `IA atribuída para ${selectedOrgIds.length} organizações.`,
      });

      setIsAssignDialogOpen(false);
      setSelectedOrgIds([]);
    } catch (error: any) {
      toast({
        title: 'Erro ao atribuir IA',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const toggleOrgSelection = (orgId: string) => {
    setSelectedOrgIds(prev =>
      prev.includes(orgId)
        ? prev.filter(id => id !== orgId)
        : [...prev, orgId]
    );
  };

  const getProviderBadge = (provider: string) => {
    const colors: Record<string, string> = {
      OPENAI: 'bg-green-100 text-green-800',
      ANTHROPIC: 'bg-orange-100 text-orange-800',
      GOOGLE: 'bg-blue-100 text-blue-800',
      COHERE: 'bg-purple-100 text-purple-800',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[provider] || 'bg-gray-100 text-gray-800'}`}>
        {provider}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Conexões de IA Globais
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                Adicionar e gerenciar IAs que serão atribuídas às organizações
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova IA
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Nova Conexão de IA</DialogTitle>
                  <DialogDescription>
                    Adicionar uma nova IA global ao sistema
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      placeholder="OpenAI GPT-4"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="provider">Provider</Label>
                    <Select
                      value={formData.provider}
                      onValueChange={(value) => setFormData({ ...formData, provider: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OPENAI">OpenAI</SelectItem>
                        <SelectItem value="ANTHROPIC">Anthropic</SelectItem>
                        <SelectItem value="GOOGLE">Google</SelectItem>
                        <SelectItem value="COHERE">Cohere</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="apiKey">API Key</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      placeholder="sk-..."
                      value={formData.apiKey}
                      onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="model">Modelo (opcional)</Label>
                    <Input
                      id="model"
                      placeholder="gpt-4-turbo"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="baseUrl">Base URL (opcional)</Label>
                    <Input
                      id="baseUrl"
                      placeholder="https://api.openai.com/v1"
                      value={formData.baseUrl}
                      onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={createAiConnection}>Criar IA</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 gap-6">
          {aiConnections.map((ai) => (
            <Card key={ai.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <Bot className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle>{ai.name}</CardTitle>
                        {ai.isActive ? (
                          <Badge>Ativa</Badge>
                        ) : (
                          <Badge variant="secondary">Inativa</Badge>
                        )}
                      </div>
                      <CardDescription className="mt-1 flex items-center gap-2">
                        {getProviderBadge(ai.provider)}
                        {ai.model && <span className="text-sm">• {ai.model}</span>}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openAssignDialog(ai.id)}
                    >
                      <Link2 className="h-4 w-4 mr-2" />
                      Atribuir
                    </Button>
                    <Button
                      size="sm"
                      variant={ai.isActive ? 'outline' : 'default'}
                      onClick={() => toggleAiStatus(ai.id, ai.isActive)}
                    >
                      {ai.isActive ? 'Desativar' : 'Ativar'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">API Key</span>
                    <div className="font-mono text-xs mt-1">
                      {ai.apiKey.substring(0, 10)}...
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Max Tokens</span>
                    <div className="font-medium mt-1">{ai.maxTokens}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Temperature</span>
                    <div className="font-medium mt-1">{ai.temperature}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Criada em</span>
                    <div className="font-medium mt-1">
                      {new Date(ai.createdAt).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {aiConnections.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Bot className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Nenhuma IA configurada
                </h3>
                <p className="text-gray-500 mb-4">
                  Adicione sua primeira conexão de IA para começar
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar IA
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Assignment Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Atribuir IA para Organizações</DialogTitle>
            <DialogDescription>
              Selecione as organizações que terão acesso a esta IA
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 max-h-[400px] overflow-y-auto">
            {organizations.map((org) => (
              <div
                key={org.id}
                className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer"
                onClick={() => toggleOrgSelection(org.id)}
              >
                <div
                  className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
                    selectedOrgIds.includes(org.id)
                      ? 'bg-blue-600 border-blue-600'
                      : 'border-gray-300'
                  }`}
                >
                  {selectedOrgIds.includes(org.id) && (
                    <Check className="h-3 w-3 text-white" />
                  )}
                </div>
                <span className="font-medium">{org.name}</span>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={assignAiToOrganizations}>
              Atribuir para {selectedOrgIds.length} organizações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
