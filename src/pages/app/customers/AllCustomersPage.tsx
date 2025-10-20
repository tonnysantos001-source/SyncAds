import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  registrationDate: string;
}

const MOCK_CUSTOMERS: Customer[] = [
  // Adicione clientes mockados aqui se necessário
];

const AllCustomersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleCadastrar = () => {
    console.log('Cadastrar cliente');
  };

  const filteredCustomers = MOCK_CUSTOMERS.filter((customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">CLIENTES</h1>
          <p className="text-gray-600 mt-1">
            Clientes que já compraram em sua loja.
          </p>
        </div>
        <Button
          onClick={handleCadastrar}
          className="bg-pink-600 hover:bg-pink-700 text-white"
        >
          CADASTRAR CLIENTE
        </Button>
      </div>

      {/* Busca */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          type="text"
          placeholder="Buscar por nome ou e-mail"
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
                    Nome Completo
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {customer.registrationDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {customer.name}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <div className="w-full max-w-md h-16 bg-gray-100 rounded mb-4"></div>
                        <p className="text-gray-500">Nenhum cliente encontrado</p>
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

export default AllCustomersPage;
