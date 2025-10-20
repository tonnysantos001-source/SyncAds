import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface Lead {
  id: string;
  email: string;
  registrationDate: string;
}

const MOCK_LEADS: Lead[] = [
  // Adicione leads mockados aqui se necessário
];

const LeadsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLeads = MOCK_LEADS.filter((lead) =>
    lead.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">LEADS</h1>
        <p className="text-gray-600 mt-1">
          Leads que abandonaram o checkout e não finalizaram uma compra.
        </p>
      </div>

      {/* Busca */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          type="text"
          placeholder="Buscar por e-mail"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Data de Cadastro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    E-mail
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.length > 0 ? (
                  filteredLeads.map((lead) => (
                    <tr key={lead.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {lead.registrationDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {lead.email}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <div className="w-full max-w-md h-16 bg-gray-100 rounded mb-4"></div>
                        <p className="text-gray-500">Nenhum lead encontrado</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeadsPage;
