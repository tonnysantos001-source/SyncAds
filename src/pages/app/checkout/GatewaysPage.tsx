import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

interface Gateway {
  id: string;
  name: string;
  status?: 'active' | 'download';
  colorClass: string;
}

const GATEWAYS: Gateway[] = [
  { id: 'pix', name: 'Pix', colorClass: 'bg-blue-500' },
  { id: 'picpay', name: 'PicPay', colorClass: 'bg-green-500' },
  { id: 'banco-inter', name: 'Banco Inter', colorClass: 'bg-orange-500' },
  { id: 'boleto', name: 'Boleto', colorClass: 'bg-yellow-500' },
  { id: 'cartao-credito', name: 'Cartão de Crédito', colorClass: 'bg-blue-600' },
  { id: 'mercado-pago', name: 'Mercado Pago', status: 'download', colorClass: 'bg-blue-400' },
  { id: 'iugu', name: 'Iugu', colorClass: 'bg-red-500' },
  { id: 'infinitepay', name: 'InfinitePay', colorClass: 'bg-gray-800' },
  { id: 'vitrine', name: 'Vitrine', colorClass: 'bg-blue-600' },
  { id: 'pagarme', name: 'Pagar.me', colorClass: 'bg-green-600' },
  { id: 'stripe', name: 'Stripe', colorClass: 'bg-purple-600' },
  { id: 'ticto-card', name: 'Ticto Card', colorClass: 'bg-green-500' },
  { id: 'juno', name: 'Juno', colorClass: 'bg-gray-700' },
  { id: 'sicredi', name: 'Sicredi', colorClass: 'bg-green-700' },
  { id: 'safepay', name: 'SafePay', colorClass: 'bg-blue-500' },
  { id: 'koin', name: 'Koin', colorClass: 'bg-orange-500' },
  { id: 'saque-pague', name: 'Saque E Pague', colorClass: 'bg-orange-400' },
  { id: 'yapay', name: 'YAPAY', colorClass: 'bg-gray-700' },
  { id: 'latpay', name: 'Latpay', colorClass: 'bg-orange-500' },
  { id: 'onnipago', name: 'ONNIPAGO', colorClass: 'bg-purple-500' },
  { id: 'vindi', name: 'VINDI', colorClass: 'bg-red-600' },
  { id: 'linix', name: 'Linix', colorClass: 'bg-gray-700' },
  { id: 'revo', name: 'REVO', colorClass: 'bg-purple-600' },
  { id: 'utrebank', name: 'UtreBank', colorClass: 'bg-blue-700' },
  { id: 'linxpag', name: 'Linxpag', colorClass: 'bg-gray-800' },
  { id: 'revo-pag', name: 'REVO PAG', colorClass: 'bg-purple-500' },
  { id: 'tnk', name: 'TNK', colorClass: 'bg-orange-600' },
  { id: 'muantel', name: 'Muantel Brasil', colorClass: 'bg-gray-700' },
  { id: 'vendas-pay', name: 'VendasPay', status: 'download', colorClass: 'bg-green-600' },
  { id: 'tiny-pay', name: 'Tiny Pay', colorClass: 'bg-red-500' },
  { id: 'melhorenvio', name: 'Melhorenvio', colorClass: 'bg-yellow-500' },
  { id: 'pix-copag', name: 'PIX COPAG', colorClass: 'bg-green-500' },
  { id: 'triip', name: 'Triip', colorClass: 'bg-purple-500' },
  { id: 'monetus', name: 'Monetus', colorClass: 'bg-gray-700' },
  { id: 'paghiper', name: 'PAGHIPER', colorClass: 'bg-green-600' },
  { id: 'teupag', name: 'Téupag', colorClass: 'bg-brown-700' },
  { id: 'moneypago', name: 'MoneyPago', colorClass: 'bg-orange-500' },
  { id: 'pix-copag-2', name: 'PIX COPAG', colorClass: 'bg-green-500' },
  { id: 'transferencia', name: 'Transferência', colorClass: 'bg-gray-600' },
  { id: 'nuvei', name: 'Nuvei', colorClass: 'bg-red-600' },
  { id: 'payzen', name: 'PayZen', colorClass: 'bg-purple-600' },
  { id: 'thepos', name: 'ThePos', colorClass: 'bg-gray-800' },
  { id: 'neonpay', name: 'NeonPay', colorClass: 'bg-blue-500' },
  { id: 'paypal', name: 'PayPal', colorClass: 'bg-blue-600' },
  { id: 'unico', name: 'Unico', colorClass: 'bg-red-500' },
  { id: 'pop', name: 'POP', colorClass: 'bg-pink-500' },
  { id: 'phoebus', name: 'Phoebus', colorClass: 'bg-purple-600' },
  { id: 'tonpay', name: 'TONpay', colorClass: 'bg-blue-500' },
  { id: 'pay-connect', name: 'Pay Connect', colorClass: 'bg-red-600' },
  { id: 'pit-stop', name: 'Pit Stop Pagamentos', colorClass: 'bg-blue-600' },
  { id: 'capfpay', name: 'CapfPay', colorClass: 'bg-teal-600' },
  { id: 'pagarme-2', name: 'Pagarme', colorClass: 'bg-green-600' },
  { id: 'dinahpay', name: 'DinahPay', colorClass: 'bg-gray-700' },
  { id: 'stipix', name: 'STipix', colorClass: 'bg-green-600' },
  { id: 'paypal-2', name: 'Paypal', colorClass: 'bg-blue-600' },
  { id: 'debit-plus', name: 'Debit+', colorClass: 'bg-gray-700' },
  { id: 'stripe-2', name: 'Stripe', colorClass: 'bg-purple-600' },
  { id: 'picpay-2', name: 'PicPay', colorClass: 'bg-green-500' },
  { id: 'itaubank', name: 'Itaubank', colorClass: 'bg-blue-700' },
  { id: 'sett-pay', name: 'Sett Pay', colorClass: 'bg-brown-700' },
  { id: 'paguvel', name: 'Paguvel', colorClass: 'bg-pink-500' },
  { id: 'iugu-2', name: 'IUGU', colorClass: 'bg-red-500' },
  { id: 'supercard', name: 'SuperCard', colorClass: 'bg-green-500' },
  { id: 'pagar-me', name: 'Pagar.me', colorClass: 'bg-green-600' },
  { id: 'mmoney-card', name: 'M Money Card', colorClass: 'bg-orange-500' },
  { id: 'just-pay', name: 'Just Pay', colorClass: 'bg-teal-500' },
  { id: 'pagseguro', name: 'Pagseguro', colorClass: 'bg-yellow-500' },
  { id: 'n3bank', name: 'N3bank', colorClass: 'bg-gray-700' },
  { id: 'lgpag', name: 'LGPag', colorClass: 'bg-green-700' },
  { id: 'paygolf', name: 'PayGolf', colorClass: 'bg-blue-500' },
  { id: 'omie', name: 'Omie', colorClass: 'bg-purple-600' },
  { id: 'payup', name: 'PayUp', colorClass: 'bg-gray-600' },
  { id: 'place-pay', name: 'Place Pay', colorClass: 'bg-blue-400' },
  { id: 'openpay', name: 'Openpay', colorClass: 'bg-purple-500' },
  { id: 'pipefy', name: 'Pipefy', colorClass: 'bg-gray-700' },
  { id: 'green-pay', name: 'Green Pay', colorClass: 'bg-green-600' },
  { id: 'pay-me', name: 'Pay-Me', colorClass: 'bg-pink-600' },
  { id: 'openpix', name: 'OpenPix', colorClass: 'bg-gray-800' },
  { id: 'cash-pay', name: 'Cash Pay', colorClass: 'bg-blue-500' },
  { id: 'onefy', name: 'Onefy', colorClass: 'bg-purple-600' },
  { id: 'centpay', name: 'CentPay', colorClass: 'bg-gray-700' },
  { id: 'tindin', name: 'Tindin', colorClass: 'bg-gray-700' },
  { id: 'vivo', name: 'Vivo', colorClass: 'bg-purple-700' },
];

const GatewaysPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredGateways = GATEWAYS.filter((gateway) =>
    gateway.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">GATEWAYS</h1>
        <p className="text-gray-600 mt-2">
          Todos os gateways de pagamento disponíveis para integração.
        </p>
      </div>

      {/* Barra de busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <Input
          type="text"
          placeholder="Buscar gateway..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Grid de Gateways */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGateways.map((gateway) => (
          <Card key={gateway.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Ícone do Gateway */}
                  <div className={`w-10 h-10 rounded ${gateway.colorClass} flex items-center justify-center text-white font-bold`}>
                    {gateway.name.charAt(0).toUpperCase()}
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-900">{gateway.name}</h3>
                    {gateway.status === 'active' && (
                      <Badge variant="outline" className="text-xs mt-1">
                        Ativo
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Badges e Botões */}
                <div className="flex items-center gap-2">
                  {gateway.status === 'download' && (
                    <Button
                      size="sm"
                      className="bg-pink-600 hover:bg-pink-700 text-white text-xs"
                    >
                      BAIXAR AGORA
                    </Button>
                  )}
                  {!gateway.status && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                    >
                      Configurar
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Mensagem quando não há resultados */}
      {filteredGateways.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Nenhum gateway encontrado com "{searchTerm}"</p>
        </div>
      )}

      {/* Botão de ajuda flutuante */}
      <button className="fixed bottom-6 right-6 bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 transition-all hover:scale-105">
        <span className="text-sm font-medium">💬 Precisa de ajuda?</span>
      </button>
    </div>
  );
};

export default GatewaysPage;
