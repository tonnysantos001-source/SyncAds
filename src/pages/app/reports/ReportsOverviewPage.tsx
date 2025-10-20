import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Calendar, Download, Info } from 'lucide-react';

const ReportsOverviewPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">VISÃO GERAL</h1>
          <p className="text-gray-600 mt-1">
            Acompanhe o desempenho geral do seu e-commerce
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button className="bg-pink-600 hover:bg-pink-700 text-white" size="sm">
            Filtrar
          </Button>
          <Button variant="outline" size="sm">
            Colection
          </Button>
          <Button variant="outline" size="sm">
            Semana
          </Button>
          <Button variant="outline" size="sm">
            Mês
          </Button>
          <Button variant="outline" size="sm">
            <Calendar className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1 - Receita Líquida */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Receita líquida</p>
              <p className="text-3xl font-bold">0,00 (0)</p>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">% 0%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2 - Lucro Líquido */}
        <Card className="bg-gray-900 text-white">
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-gray-300">Lucro Líquido</p>
              <p className="text-3xl font-bold">0,00</p>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400">% 0%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3 - Investimento */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-600">Investimento</p>
                <Info className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-3xl font-bold">0,00</p>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">% 0%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Resumo Financeiro */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resumo Financeiro</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
            <p className="text-gray-400">Gráfico de linha - Receita por período</p>
          </div>
        </CardContent>
      </Card>

      {/* Grid de Métricas Detalhadas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-600 mb-1">Receita Aprovada</p>
            <p className="text-xl font-bold">0,00 (0)</p>
            <p className="text-xs text-gray-500">% 0%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-600 mb-1">Receita Estornada</p>
            <p className="text-xl font-bold">0,00 (0)</p>
            <p className="text-xs text-gray-500">% 0%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-600 mb-1">Compra / Dia</p>
            <p className="text-xl font-bold">0,00</p>
            <p className="text-xs text-gray-500">— 0%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-600 mb-1">Pedidos</p>
            <p className="text-xl font-bold">0,00 (0)</p>
            <p className="text-xs text-gray-500">% 0%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-600 mb-1">Frete</p>
            <p className="text-xl font-bold">0,00</p>
            <p className="text-xs text-gray-500">— 0%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-600 mb-1">Custo p/o</p>
            <p className="text-xl font-bold">0,00</p>
            <p className="text-xs text-gray-500">— 0%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-600 mb-1">Margem Líquida</p>
            <p className="text-xl font-bold">0%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-600 mb-1">Lucro Real</p>
            <p className="text-xl font-bold">0,00</p>
            <p className="text-xs text-gray-500">— 0%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-600 mb-1">Ticket médio</p>
            <p className="text-xl font-bold">0,00</p>
            <p className="text-xs text-gray-500">— 0%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-600 mb-1">Lucratividade</p>
            <p className="text-xl font-bold">0,00</p>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Info className="w-3 h-3" /> Mais de meta
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-600 mb-1">Meta de ROAS</p>
            <p className="text-xl font-bold">0%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-600 mb-1">Novo de ROAS</p>
            <p className="text-xl font-bold flex items-center gap-1">
              <Info className="w-3 h-3" /> 
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-600 mb-1">Tax. de Conversão</p>
            <p className="text-xl font-bold">0,00</p>
            <p className="text-xs text-gray-500">— 0%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-600 mb-1">Roas</p>
            <p className="text-xl font-bold">0,00</p>
            <p className="text-xs text-gray-500">— 0%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-600 mb-1">Roi</p>
            <p className="text-xl font-bold">0,00</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-600 mb-1">CPA</p>
            <p className="text-xl font-bold">0,00</p>
          </CardContent>
        </Card>
      </div>

      {/* Seção Conversão por canal, Taxas, etc */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Funnel de Conversão */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Funnel de Conversão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm mb-2">UTM's Utilizadas</p>
                <p className="text-2xl font-bold">0% (0)</p>
              </div>
              <div>
                <p className="text-sm mb-2">Entrega</p>
                <p className="text-2xl font-bold">0% (0)</p>
              </div>
              <div>
                <p className="text-sm mb-2">Pagamento</p>
                <p className="text-2xl font-bold">0% (0)</p>
              </div>
              <div>
                <p className="text-sm mb-2">Comprou</p>
                <p className="text-2xl font-bold">0% (0)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Taxas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Taxas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Pix</span>
                <span className="font-medium">0%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Boleto</span>
                <span className="font-medium">0%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Cartão crédito</span>
                <span className="font-medium">0%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Parcelamento */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Parcelamento</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">
            Não existem informações para os critérios selecionados
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsOverviewPage;
