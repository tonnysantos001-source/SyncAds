import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Ad {
  id: string;
  name: string;
  views: string;
  clicks: string;
  ctr: string;
  cpc: string;
  cost: string;
  conversions: string;
  revenue: string;
  roas: string;
}

const MOCK_ADS: Ad[] = [
  {
    id: '1',
    name: 'nome',
    views: '0',
    clicks: '0',
    ctr: '0%',
    cpc: '0,00',
    cost: '0,00',
    conversions: '0',
    revenue: '0,00',
    roas: '0,00',
  },
];

const AdsPage: React.FC = () => {
  const [dateRange, setDateRange] = useState('20/10/2025 até 20/10/2025');

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ANÚNCIOS</h1>
          <p className="text-gray-600 mt-1 text-sm">
            (0 Anúncios)
          </p>
          <p className="text-gray-600 text-sm">
            Acompanhe o desempenho dos seus anúncios
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Input
            value={dateRange}
            readOnly
            className="w-72"
          />
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">Anúncios</Button>
        <Button variant="outline" size="sm">RENDIMENTO</Button>
        <Button variant="outline" size="sm">E-MAILS</Button>
      </div>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    NOME DA CAMPANHA
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">
                    VISUALIZAÇÕES
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">
                    CLIQUES
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">
                    CTR
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">
                    CPC
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">
                    CUSTO
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">
                    CONVERSÕES
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">
                    RECEITA
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">
                    ROAS
                  </th>
                </tr>
              </thead>
              <tbody>
                {MOCK_ADS.map((ad) => (
                  <tr key={ad.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-gray-900">
                      <div className="flex items-center gap-2">
                        <span className="w-1 h-4 bg-pink-600 rounded"></span>
                        {ad.name}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-gray-900">
                      {ad.views}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-gray-900">
                      {ad.clicks}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-gray-900">
                      {ad.ctr}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-gray-900">
                      {ad.cpc}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-gray-900">
                      {ad.cost}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-gray-900">
                      {ad.conversions}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-gray-900">
                      {ad.revenue}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-gray-900">
                      {ad.roas}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdsPage;

