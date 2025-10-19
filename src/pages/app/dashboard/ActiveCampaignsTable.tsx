import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useStore } from '@/store/useStore';
import { CampaignStatus, Campaign } from '@/data/mocks';
import { ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type SortKey = keyof Campaign;

const statusVariantMap: Record<CampaignStatus, 'success' | 'warning' | 'default'> = {
  'Ativa': 'success',
  'Pausada': 'warning',
  'Concluída': 'default',
};

const SortableHeader: React.FC<{
  title: string;
  sortKey: SortKey;
  currentSort: SortKey;
  direction: 'asc' | 'desc';
  onSort: (key: SortKey) => void;
  className?: string;
}> = ({ title, sortKey, currentSort, direction, onSort, className }) => {
  const isCurrent = currentSort === sortKey;
  return (
    <TableHead className={cn(className)}>
      <Button variant="ghost" onClick={() => onSort(sortKey)}>
        {title}
        <ArrowUpDown className={cn("ml-2 h-4 w-4", isCurrent ? "text-foreground" : "text-muted-foreground/50")} />
      </Button>
    </TableHead>
  );
};

export const ActiveCampaignsTable: React.FC = () => {
  const allCampaigns = useStore(state => state.campaigns);
  const [sortKey, setSortKey] = useState<SortKey>('clicks');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const campaigns = useMemo(() => {
    const active = allCampaigns.filter(c => c.status === 'Ativa');
    const sorted = [...active].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [allCampaigns, sortKey, sortDirection]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  };

  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHeader title="Nome" sortKey="name" currentSort={sortKey} direction={sortDirection} onSort={handleSort} />
            <SortableHeader title="Status" sortKey="status" currentSort={sortKey} direction={sortDirection} onSort={handleSort} />
            <SortableHeader title="Orçamento" sortKey="budgetSpent" currentSort={sortKey} direction={sortDirection} onSort={handleSort} />
            <SortableHeader title="Desempenho (Cliques)" sortKey="clicks" currentSort={sortKey} direction={sortDirection} onSort={handleSort} className="text-right" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.slice(0, 5).map((campaign) => {
            const budgetPercentage = (campaign.budgetSpent / campaign.budgetTotal) * 100;
            return (
              <TableRow key={campaign.id}>
                <TableCell>
                  <div className="font-medium">{campaign.name}</div>
                  <div className="text-sm text-muted-foreground">{campaign.platform}</div>
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariantMap[campaign.status]}>{campaign.status}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm">{`R$${campaign.budgetSpent.toLocaleString('pt-BR')}`}</span>
                    <span className="text-xs text-muted-foreground">{`de R$${campaign.budgetTotal.toLocaleString('pt-BR')}`}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                    <div className="font-medium">{campaign.clicks.toLocaleString('pt-BR')}</div>
                    <Progress value={budgetPercentage} className="h-2 mt-1" />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  );
};
