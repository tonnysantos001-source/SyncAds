import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { PlusCircle, Filter, View, Loader2, Megaphone } from 'lucide-react';
import { Campaign, CampaignStatus, CampaignPlatform } from '@/data/mocks';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Play, Pause, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { NewCampaignModal } from './campaigns/NewCampaignModal';
import { useStore } from '@/store/useStore';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';
import { EditCampaignModal } from './campaigns/EditCampaignModal';
import { EmptyState } from '@/components/EmptyState';

const statusVariantMap: Record<CampaignStatus, 'success' | 'warning' | 'default'> = {
  'Ativa': 'success',
  'Pausada': 'warning',
  'Concluída': 'default',
};

const CampaignCard: React.FC<{ campaign: Campaign; onEdit: (campaign: Campaign) => void; }> = ({ campaign, onEdit }) => {
  const { updateCampaignStatus, deleteCampaign } = useStore();
  const { toast } = useToast();
  const budgetPercentage = (campaign.budgetSpent / campaign.budgetTotal) * 100;

  const handleStatusChange = () => {
    const newStatus = campaign.status === 'Ativa' ? 'Pausada' : 'Ativa';
    updateCampaignStatus(campaign.id, newStatus);
    toast({
      title: 'Status da Campanha Atualizado!',
      description: `A campanha "${campaign.name}" foi ${newStatus.toLowerCase()}.`,
      variant: 'info'
    });
  };

  const handleDelete = () => {
    deleteCampaign(campaign.id);
    toast({
      title: 'Campanha Deletada!',
      description: `A campanha "${campaign.name}" foi deletada com sucesso.`,
      variant: 'destructive',
    });
  };

  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">{campaign.name}</CardTitle>
              <CardDescription>{campaign.platform}</CardDescription>
            </div>
            <Badge variant={statusVariantMap[campaign.status]}>{campaign.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm text-muted-foreground mb-1">
              <span>Orçamento</span>
              <span>{`R$${campaign.budgetSpent.toLocaleString('pt-BR')} / R$${campaign.budgetTotal.toLocaleString('pt-BR')}`}</span>
            </div>
            <Progress value={budgetPercentage} />
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Impressões</p>
              <p className="font-semibold">{campaign.impressions.toLocaleString('pt-BR')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cliques</p>
              <p className="font-semibold">{campaign.clicks.toLocaleString('pt-BR')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Conversões</p>
              <p className="font-semibold">{campaign.conversions.toLocaleString('pt-BR')}</p>
            </div>
          </div>
          <div className="flex justify-end">
            <AlertDialog>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild><Link to={`/campaigns/${campaign.id}`}><View className="mr-2 h-4 w-4" /> Ver Detalhes</Link></DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(campaign)}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                  <DropdownMenuItem onClick={handleStatusChange}>
                    {campaign.status === 'Ativa' ? (
                      <><Pause className="mr-2 h-4 w-4" /> Pausar</>
                    ) : (
                      <><Play className="mr-2 h-4 w-4" /> Ativar</>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
                      <Trash2 className="mr-2 h-4 w-4" /> Deletar
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                </DropdownMenuContent>
              </DropdownMenu>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isso irá deletar permanentemente a campanha "{campaign.name}".
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Deletar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const CampaignsPage: React.FC = () => {
  const campaigns = useStore(state => state.campaigns);
  const searchTerm = useStore(state => state.searchTerm);
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'Todas'>('Todas');
  const [platformFilter, setPlatformFilter] = useState<CampaignPlatform | 'Todas'>('Todas');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  
  const ITEMS_PER_PAGE = 6;
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const handleEditClick = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setIsEditModalOpen(true);
  };

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(c => {
      const statusMatch = statusFilter === 'Todas' || c.status === statusFilter;
      const platformMatch = platformFilter === 'Todas' || c.platform === platformFilter;
      const searchMatch = searchTerm === '' || c.name.toLowerCase().includes(searchTerm.toLowerCase());
      return statusMatch && platformMatch && searchMatch;
    });
  }, [statusFilter, platformFilter, campaigns, searchTerm]);

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount(prevCount => prevCount + ITEMS_PER_PAGE);
      setIsLoadingMore(false);
    }, 500);
  };
  
  const paginatedCampaigns = filteredCampaigns.slice(0, visibleCount);
  const canLoadMore = visibleCount < filteredCampaigns.length;

  return (
    <>
      <NewCampaignModal isOpen={isNewModalOpen} onOpenChange={setIsNewModalOpen} />
      {editingCampaign && <EditCampaignModal isOpen={isEditModalOpen} onOpenChange={setIsEditModalOpen} campaign={editingCampaign} />}
      
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Campanhas</h1>
            <p className="text-muted-foreground">Gerencie todas as suas campanhas em um só lugar.</p>
          </div>
          <Button onClick={() => setIsNewModalOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova Campanha
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Filtros</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select value={statusFilter} onValueChange={(value: CampaignStatus | 'Todas') => setStatusFilter(value)}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todas">Todos os Status</SelectItem>
                    <SelectItem value="Ativa">Ativa</SelectItem>
                    <SelectItem value="Pausada">Pausada</SelectItem>
                    <SelectItem value="Concluída">Concluída</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={platformFilter} onValueChange={(value: CampaignPlatform | 'Todas') => setPlatformFilter(value)}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Plataforma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todas">Todas as Plataformas</SelectItem>
                    <SelectItem value="Google Ads">Google Ads</SelectItem>
                    <SelectItem value="Meta">Meta</SelectItem>
                    <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <motion.div layout className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence>
                {paginatedCampaigns.map(campaign => (
                  <CampaignCard key={campaign.id} campaign={campaign} onEdit={handleEditClick} />
                ))}
              </AnimatePresence>
            </motion.div>
            {paginatedCampaigns.length === 0 && (
              <EmptyState
                icon={Megaphone}
                title="Nenhuma campanha encontrada"
                description="Parece que não há campanhas que correspondam aos seus filtros. Tente ajustar a busca ou crie uma nova campanha."
                action={
                  <Button onClick={() => setIsNewModalOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Criar Primeira Campanha
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>

        {canLoadMore && (
          <div className="flex justify-center">
            <Button onClick={handleLoadMore} variant="outline" disabled={isLoadingMore}>
              {isLoadingMore ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Carregando...
                </>
              ) : (
                'Carregar Mais'
              )}
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

export default CampaignsPage;
