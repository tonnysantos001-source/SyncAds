import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface State {
  id: string;
  name: string;
  flag: string;
  revenue: string;
  amountPaid: string;
  percentPaid: string;
}

const BRAZILIAN_STATES: State[] = [
  {
    id: "AC",
    name: "Acre",
    flag: "🇧🇷",
    revenue: "0,00 (0)",
    amountPaid: "0,00 (0)",
    percentPaid: "0%",
  },
  {
    id: "AL",
    name: "Alagoas",
    flag: "🇧🇷",
    revenue: "0,00 (0)",
    amountPaid: "0,00 (0)",
    percentPaid: "0%",
  },
  {
    id: "AP",
    name: "Amapá",
    flag: "🇧🇷",
    revenue: "0,00 (0)",
    amountPaid: "0,00 (0)",
    percentPaid: "0%",
  },
  {
    id: "AM",
    name: "Amazonas",
    flag: "🇧🇷",
    revenue: "0,00 (0)",
    amountPaid: "0,00 (0)",
    percentPaid: "0%",
  },
  {
    id: "BA",
    name: "Bahia",
    flag: "🇧🇷",
    revenue: "0,00 (0)",
    amountPaid: "0,00 (0)",
    percentPaid: "0%",
  },
  {
    id: "CE",
    name: "Ceará",
    flag: "🇧🇷",
    revenue: "0,00 (0)",
    amountPaid: "0,00 (0)",
    percentPaid: "0%",
  },
  {
    id: "DF",
    name: "Distrito Federal",
    flag: "🇧🇷",
    revenue: "0,00 (0)",
    amountPaid: "0,00 (0)",
    percentPaid: "0%",
  },
  {
    id: "ES",
    name: "Espírito Santo",
    flag: "🇧🇷",
    revenue: "0,00 (0)",
    amountPaid: "0,00 (0)",
    percentPaid: "0%",
  },
  {
    id: "GO",
    name: "Goiás",
    flag: "🇧🇷",
    revenue: "0,00 (0)",
    amountPaid: "0,00 (0)",
    percentPaid: "0%",
  },
  {
    id: "MA",
    name: "Maranhão",
    flag: "🇧🇷",
    revenue: "0,00 (0)",
    amountPaid: "0,00 (0)",
    percentPaid: "0%",
  },
];

const AudiencePage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredStates = BRAZILIAN_STATES.filter((state) =>
    state.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">PÚBLICO ALVO</h1>
          <p className="text-gray-600 mt-1">
            Conheça quem está comprando seu produto
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            className="bg-pink-600 hover:bg-pink-700 text-white"
            size="sm"
          >
            Tudo
          </Button>
          <Button variant="outline" size="sm">
            Ori.Lan
          </Button>
          <Button variant="outline" size="sm">
            Sem data
          </Button>
          <Button variant="outline" size="sm">
            Más
          </Button>
        </div>
      </div>

      {/* Tabela */}
      <Card className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    ESTADO
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                    RECEITA LÍQUIDA
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                    VALOR PAGO
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                    % PAGOS
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredStates.map((state) => (
                  <tr key={state.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{state.flag}</span>
                        <span className="text-sm text-gray-900">
                          {state.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      {state.revenue}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      {state.amountPaid}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      {state.percentPaid}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Botão Carregar Mais */}
          <div className="flex justify-center py-6 border-t">
            <Button
              variant="outline"
              className="text-pink-600 border-pink-600 hover:bg-pink-50"
            >
              Carregar mais estados
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AudiencePage;
