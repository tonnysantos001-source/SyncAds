import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search } from 'lucide-react';
import { gatewaysList } from '@/lib/gateways/gatewaysList';
import GatewayCard from '@/components/gateway/GatewayCard';

const GatewaysListPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'inactive'>('all');

  // Filter gateways
  const filteredGateways = useMemo(() => {
    let filtered = gatewaysList;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((gateway) =>
        gateway.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Tab filter
    if (activeTab === 'active') {
      filtered = filtered.filter((g) => g.status === 'active');
    } else if (activeTab === 'inactive') {
      filtered = filtered.filter((g) => g.status === 'inactive');
    }

    return filtered;
  }, [searchTerm, activeTab]);

  const activeCount = gatewaysList.filter((g) => g.status === 'active').length;
  const inactiveCount = gatewaysList.filter((g) => g.status === 'inactive').length;

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gateways</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Gateways de pagamento disponíveis para seu e-commerce
        </p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar gateway..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Stats */}
            <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div>
                <span className="font-semibold text-gray-900 dark:text-white">{gatewaysList.length}</span> no total
              </div>
              <div>
                <span className="font-semibold text-green-600">{activeCount}</span> ativos
              </div>
              <div>
                <span className="font-semibold text-red-600">{inactiveCount}</span> inativos
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="all">Todos ({gatewaysList.length})</TabsTrigger>
          <TabsTrigger value="active">Ativos ({activeCount})</TabsTrigger>
          <TabsTrigger value="inactive">Inativos ({inactiveCount})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredGateways.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm
                    ? 'Nenhum gateway encontrado com esse nome.'
                    : 'Nenhum gateway disponível.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGateways.map((gateway) => (
                <GatewayCard
                  key={gateway.id}
                  id={gateway.id}
                  name={gateway.name}
                  slug={gateway.slug}
                  logo={gateway.logo}
                  type={gateway.type}
                  status={gateway.status}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GatewaysListPage;

