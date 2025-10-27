import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Copy, Loader2, ArrowLeft, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { SUPABASE_CONFIG } from '@/lib/config';
import { useToast } from '@/components/ui/use-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';

interface Domain {
  id: string;
  domain: string;
  subdomain: string;
  cnameRecord: string;
  verified: boolean;
  sslConfigured: boolean;
  createdAt: string;
}

export default function DomainValidationPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [newDomain, setNewDomain] = useState({
    subdomain: 'checkout',
    domain: ''
  });

  useEffect(() => {
    loadDomains();
  }, []);

  const loadDomains = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar organizationId
      const { data: userData } = await supabase
        .from('User')
        .select('organizationId')
        .eq('id', user.id)
        .single();

      if (!userData?.organizationId) return;

      // Buscar domínios da organização
      const { data: orgData } = await supabase
        .from('Organization')
        .select('domain, domainVerified')
        .eq('id', userData.organizationId)
        .single();

      if (orgData?.domain) {
        // Simular estrutura de domínios (por enquanto)
        // TODO: Criar tabela Domain quando necessário
        setDomains([{
          id: '1',
          domain: orgData.domain,
          subdomain: 'checkout',
          cnameRecord: generateCNAME(orgData.domain),
          verified: orgData.domainVerified || false,
          sslConfigured: false,
          createdAt: new Date().toISOString()
        }]);
      }
    } catch (error) {
      console.error('Erro ao carregar domínios:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateCNAME = (domain: string): string => {
    // Gerar CNAME único baseado no domínio
    const hash = domain.split('').reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0) | 0;
    }, 0);
    return `checkout-${Math.abs(hash).toString(36)}.syncads.com.br`;
  };

  const handleAddDomain = async () => {
    if (!newDomain.domain) {
      toast({
        title: 'Erro',
        description: 'Por favor, preencha o domínio',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('User')
        .select('organizationId')
        .eq('id', user.id)
        .single();

      if (!userData?.organizationId) return;

      const cnameRecord = generateCNAME(newDomain.domain);
      const fullDomain = `${newDomain.subdomain}.${newDomain.domain}`;

      // Atualizar organização com o domínio
      const { error } = await supabase
        .from('Organization')
        .update({
          domain: fullDomain,
          domainVerified: false,
          domainVerificationToken: crypto.randomUUID(),
          domainVerificationMethod: 'DNS'
        })
        .eq('id', userData.organizationId);

      if (error) throw error;

      toast({
        title: 'Domínio cadastrado',
        description: 'Agora você precisa configurar o DNS no seu provedor',
      });

      // Recarregar e fechar modal
      await loadDomains();
      setShowModal(false);
      setNewDomain({ subdomain: 'checkout', domain: '' });
    } catch (error) {
      console.error('Erro ao adicionar domínio:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível cadastrar o domínio',
        variant: 'destructive'
      });
    }
  };

  const handleVerifyDomain = async () => {
    setVerifying(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('User')
        .select('organizationId')
        .eq('id', user.id)
        .single();

      if (!userData?.organizationId) return;

      // Chamar Edge Function de verificação
      const { data: session } = await supabase.auth.getSession();
      
      const response = await fetch(`${SUPABASE_CONFIG.functionsUrl}/verify-domain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY!
        },
        body: JSON.stringify({
          subdomain: domain.subdomain,
          domain: domain.domain
        })
      });

      const result = await response.json();

      if (!response.ok || !result.verified) {
        throw new Error(result.details || result.reason || 'Verificação falhou');
      }

      toast({
        title: 'Domínio verificado com sucesso!',
        description: 'Seu domínio está pronto para uso',
      });

      await loadDomains();
    } catch (error: any) {
      console.error('Erro ao verificar domínio:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível verificar o domínio. Verifique se o DNS está configurado corretamente.',
        variant: 'destructive'
      });
    } finally {
      setVerifying(false);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copiado!',
      description: `${type} copiado para a área de transferência`
    });
  };

  const handleDeleteDomain = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('User')
        .select('organizationId')
        .eq('id', user.id)
        .single();

      if (!userData?.organizationId) return;

      const { error } = await supabase
        .from('Organization')
        .update({
          domain: null,
          domainVerified: false,
          domainVerificationToken: null
        })
        .eq('id', userData.organizationId);

      if (error) throw error;

      toast({
        title: 'Domínio excluído',
        description: 'O domínio foi removido com sucesso'
      });

      await loadDomains();
    } catch (error) {
      console.error('Erro ao excluir domínio:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o domínio',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </DashboardLayout>
    );
  }

  // Se não tem domínios, mostrar tela de adicionar
  if (domains.length === 0) {
    return (
      <DashboardLayout>
        <div className="p-6 sm:p-8 max-w-4xl mx-auto">
          {/* Mensagem principal */}
          <div className="text-center py-16">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Você ainda não tem nenhum domínio cadastrado.
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              Cadastrando seu domínio você aumenta a credibilidade e conversão da sua loja.
            </p>
            <Button
              size="lg"
              onClick={() => setShowModal(true)}
              className="bg-pink-600 hover:bg-pink-700 text-white"
            >
              CADASTRAR DOMÍNIO
            </Button>
          </div>

          {/* Modal de adicionar domínio */}
          {showModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-md">
                <CardHeader>
                  <CardTitle className="uppercase text-lg">Adicionar novo domínio</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Domínio</Label>
                    <div className="flex gap-2">
                      <Select
                        value={newDomain.subdomain}
                        onValueChange={(value) => setNewDomain({ ...newDomain, subdomain: value })}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="checkout">checkout.</SelectItem>
                          <SelectItem value="seguro">seguro.</SelectItem>
                          <SelectItem value="secure">secure.</SelectItem>
                          <SelectItem value="pay">pay.</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="ex.: sualoja.com.br"
                        value={newDomain.domain}
                        onChange={(e) => setNewDomain({ ...newDomain, domain: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <p>• Vincule um domínio que já pertença a você.</p>
                    <p>• Não use http, https, www e url da sua loja myshopify.</p>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowModal(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      className="flex-1 bg-pink-600 hover:bg-pink-700"
                      onClick={handleAddDomain}
                    >
                      Salvar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  // Se tem domínios, mostrar configuração
  const domain = domains[0];
  const fullDomain = `${domain.subdomain}.${domain.domain}`;

  return (
    <DashboardLayout>
      <div className="p-6 sm:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate('/onboarding')}
              className="text-pink-600 hover:text-pink-700 mb-4 flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              ver todos os domínios
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              CONFIGURAÇÃO DO DOMÍNIO
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{fullDomain}</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Painel Principal */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Cadastrando o apontamento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Em seu provedor, na seção de configuração registros DNS, adicione as informações abaixo.
                    Preencha cada campo com as respectivas informações listadas abaixo:
                  </p>

                  {/* CNAME Record */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs uppercase tracking-wide">Tipo</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard('CNAME', 'Tipo')}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        CNAME
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Label className="text-xs uppercase tracking-wide">Nome</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(domain.subdomain, 'Nome')}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        {domain.subdomain}
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Label className="text-xs uppercase tracking-wide">Valor</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(domain.cnameRecord, 'Valor')}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        {domain.cnameRecord}
                      </Button>
                    </div>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Após realizar corretamente os apontamentos acima em seu provedor de domínio, você deve aguardar
                      um tempo para que as informações sejam propagadas. Esse processo costuma levar até 4h.
                    </AlertDescription>
                  </Alert>

                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={handleDeleteDomain}
                    >
                      Excluir domínio
                    </Button>
                    <Button
                      className="flex-1 bg-pink-600 hover:bg-pink-700 text-white"
                      onClick={handleVerifyDomain}
                      disabled={verifying || domain.verified}
                    >
                      {verifying ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Verificando...
                        </>
                      ) : (
                        'VERIFICAR DOMÍNIO'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Painel Lateral */}
            <div className="space-y-6">
              {/* Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    {domain.verified ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <span className="text-green-500 font-medium">Concluído</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-5 w-5 text-yellow-500" />
                        <span className="text-yellow-500 font-medium">Pendente</span>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* SSL */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">SSL</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    {domain.sslConfigured ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <span className="text-green-500 font-medium">Concluído</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-5 w-5 text-yellow-500" />
                        <span className="text-yellow-500 font-medium">Pendente</span>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Ajuda */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
                      <AlertCircle className="h-5 w-5 text-pink-600" />
                    </div>
                    Está com dúvidas?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Aprenda como verificar o domínio da sua loja.
                  </p>
                  <Button variant="link" className="p-0">
                    Ver tutorial <ExternalLink className="h-4 w-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

