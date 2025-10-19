import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { allCampaigns, Campaign } from '@/data/mocks';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Pause, Play, Trash2 } from 'lucide-react';
import NotFoundPage from '@/pages/public/NotFoundPage';

const statusVariantMap: Record<Campaign['status'], 'success' | 'warning' | 'default'> = {
  'Ativa': 'success',
  'Pausada': 'warning',
  'Concluída': 'default',
};

const CampaignDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const campaign = allCampaigns.find((c) => c.id === id);

  if (!campaign) {
    return <NotFoundPage />;
  }

  const budgetPercentage = (campaign.budgetSpent / campaign.budgetTotal) * 100;

  const DetailItem: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" asChild>
          <Link to="/campaigns">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Campanhas
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button variant="outline"><Edit className="mr-2 h-4 w-4" /> Editar</Button>
          {campaign.status === 'Ativa' ? (
            <Button variant="outline"><Pause className="mr-2 h-4 w-4" /> Pausar</Button>
          ) : (
            <Button variant="outline"><Play className="mr-2 h-4 w-4" /> Ativar</Button>
          )}
          <Button variant="destructive"><Trash2 className="mr-2 h-4 w-4" /> Deletar</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{campaign.name}</CardTitle>
              <CardDescription>{campaign.platform}</CardDescription>
            </div>
            <Badge variant={statusVariantMap[campaign.status]} className="text-base px-3 py-1">
              {campaign.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex justify-between text-sm text-muted-foreground mb-1">
              <span>Orçamento</span>
              <span>{`R$${campaign.budgetSpent.toLocaleString('pt-BR')} / R$${campaign.budgetTotal.toLocaleString('pt-BR')}`}</span>
            </div>
            <Progress value={budgetPercentage} className="h-4" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 text-center border-t pt-6">
            <DetailItem label="Impressões" value={campaign.impressions.toLocaleString('pt-BR')} />
            <DetailItem label="Cliques" value={campaign.clicks.toLocaleString('pt-BR')} />
            <DetailItem label="Conversões" value={campaign.conversions.toLocaleString('pt-BR')} />
            <DetailItem label="CTR" value={`${campaign.ctr.toFixed(2)}%`} />
            <DetailItem label="CPC Médio" value={`R$ ${campaign.cpc.toFixed(2)}`} />
          </div>

           <div className="grid grid-cols-2 gap-6 border-t pt-6">
             <div>
                <h4 className="font-semibold mb-2">Período da Campanha</h4>
                <p>Início: {new Date(campaign.startDate).toLocaleDateString('pt-BR')}</p>
                <p>Fim: {new Date(campaign.endDate).toLocaleDateString('pt-BR')}</p>
             </div>
             <div>
                <h4 className="font-semibold mb-2">Detalhes do Orçamento</h4>
                <p>Gasto: R$ {campaign.budgetSpent.toLocaleString('pt-BR')}</p>
                <p>Total: R$ {campaign.budgetTotal.toLocaleString('pt-BR')}</p>
             </div>
           </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CampaignDetailsPage;
