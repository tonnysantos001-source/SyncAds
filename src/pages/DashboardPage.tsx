import React from 'react';
import { BarChart3, DollarSign, Users, Activity } from 'lucide-react';

const DashboardPage: React.FC = () => {
  return (
    <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Dashboard</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">Bem-vindo de volta, aqui está um resumo do seu crescimento.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard icon={DollarSign} title="Receita Total" value="R$ 45.231,89" change="+20.1% do último mês" />
          <StatCard icon={Users} title="Novos Clientes" value="+2.350" change="+180.1% do último mês" />
          <StatCard icon={BarChart3} title="Conversões" value="+12.234" change="+19% do último mês" />
          <StatCard icon={Activity} title="Taxa de Ativação" value="98.2%" change="+2.1% do último mês" />
      </div>

      <div className="bg-white dark:bg-dark-card p-6 rounded-xl border border-gray-200 dark:border-dark-border">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Visão Geral</h2>
          <div className="h-96 bg-gray-100 dark:bg-gray-700/50 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Gráfico de Analytics virá aqui</p>
          </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, title, value, change }: { icon: React.ElementType, title: string, value: string, change: string }) => (
    <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
            <Icon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
        </div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-xs text-gray-500 mt-1">{change}</p>
    </div>
)

export default DashboardPage;
