import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

interface Gateway {
  id: string;
  name: string;
  status?: 'ativo' | 'inativo' | 'download';
  logoUrl?: string;
  colorClass: string;
}

const GATEWAYS: Gateway[] = [
  { id: 'pix', name: 'Pix', status: 'ativo', colorClass: 'bg-blue-500', logoUrl: 'https://logodownload.org/wp-content/uploads/2020/02/pix-bc-logo.png' },
  { id: 'picpay', name: 'PicPay', status: 'inativo', colorClass: 'bg-green-500', logoUrl: 'https://logodownload.org/wp-content/uploads/2018/05/picpay-logo.png' },
  { id: 'banco-inter', name: 'Banco Inter', colorClass: 'bg-orange-500', logoUrl: 'https://logodownload.org/wp-content/uploads/2020/04/banco-inter-logo.png' },
  { id: 'boleto', name: 'Boleto', status: 'inativo', colorClass: 'bg-yellow-500' },
  { id: 'cartao-credito', name: 'Cartão de Crédito', colorClass: 'bg-blue-600' },
  { id: 'mercado-pago', name: 'Mercado Pago', status: 'download', colorClass: 'bg-blue-400', logoUrl: 'https://logodownload.org/wp-content/uploads/2021/06/mercado-pago-logo.png' },
  { id: 'iugu', name: 'Iugu', status: 'ativo', colorClass: 'bg-red-500', logoUrl: 'https://static.iugu.com/assets/images/iugu-logo-01.png' },
  { id: 'infinitepay', name: 'InfinitePay', colorClass: 'bg-gray-800' },
  { id: 'vitrine', name: 'Vitrine', colorClass: 'bg-blue-600' },
  { id: 'pagarme', name: 'Pagar.me', status: 'ativo', colorClass: 'bg-green-600', logoUrl: 'https://cdn.worldvectorlogo.com/logos/pagarme.svg' },
  { id: 'stripe', name: 'Stripe', status: 'ativo', colorClass: 'bg-purple-600', logoUrl: 'https://cdn.worldvectorlogo.com/logos/stripe-4.svg' },
  { id: 'ticto-card', name: 'Ticto Card', colorClass: 'bg-green-500' },
  { id: 'juno', name: 'Juno', colorClass: 'bg-gray-700' },
  { id: 'sicredi', name: 'Sicredi', status: 'inativo', colorClass: 'bg-green-700', logoUrl: 'https://logodownload.org/wp-content/uploads/2020/04/sicredi-logo.png' },
  { id: 'safepay', name: 'SafePay', colorClass: 'bg-blue-500' },
  { id: 'koin', name: 'Koin', colorClass: 'bg-orange-500' },
  { id: 'saque-pague', name: 'Saque E Pague', colorClass: 'bg-orange-400' },
  { id: 'yapay', name: 'YAPAY', colorClass: 'bg-gray-700' },
  { id: 'latpay', name: 'Latpay', colorClass: 'bg-orange-500' },
  { id: 'onnipago', name: 'ONNIPAGO', colorClass: 'bg-purple-500' },
  { id: 'vindi', name: 'VINDI', status: 'inativo', colorClass: 'bg-red-600' },
  { id: 'linix', name: 'Linix', colorClass: 'bg-gray-700' },
  { id: 'revo', name: 'REVO', colorClass: 'bg-purple-600' },
  { id: 'utrebank', name: 'UtreBank', colorClass: 'bg-blue-700' },
  { id: 'linxpag', name: 'Linxpag', colorClass: 'bg-gray-800' },
  { id: 'revo-pag', name: 'REVO PAG', colorClass: 'bg-purple-500' },
  { id: 'tnk', name: 'TNK', colorClass: 'bg-orange-600' },
  { id: 'muantel', name: 'Muantel Brasil', colorClass: 'bg-gray-700' },
  { id: 'vendas-pay', name: 'VendasPay', status: 'download', colorClass: 'bg-green-600' },
  { id: 'tiny-pay', name: 'Tiny Pay', colorClass: 'bg-red-500' },
  { id: 'melhorenvio', name: 'Melhorenvio', colorClass: 'bg-yellow-500', logoUrl: 'https://static.melhorenvio.com.br/images/logo-melhor-envio.svg' },
  { id: 'pix-copag', name: 'PIX COPAG', colorClass: 'bg-green-500' },
  { id: 'triip', name: 'Triip', colorClass: 'bg-purple-500' },
  { id: 'monetus', name: 'Monetus', colorClass: 'bg-gray-700' },
  { id: 'paghiper', name: 'PAGHIPER', status: 'ativo', colorClass: 'bg-green-600' },
  { id: 'teupag', name: 'Téupag', colorClass: 'bg-gray-700' },
  { id: 'moneypago', name: 'MoneyPago', colorClass: 'bg-orange-500' },
  { id: 'transferencia', name: 'Transferência', colorClass: 'bg-gray-600' },
  { id: 'nuvei', name: 'Nuvei', colorClass: 'bg-red-600' },
  { id: 'payzen', name: 'PayZen', status: 'download', colorClass: 'bg-purple-600' },
  { id: 'thepos', name: 'ThePos', colorClass: 'bg-gray-800' },
  { id: 'neonpay', name: 'NeonPay', colorClass: 'bg-blue-500' },
  { id: 'paypal', name: 'PayPal', status: 'ativo', colorClass: 'bg-blue-600', logoUrl: 'https://cdn.worldvectorlogo.com/logos/paypal-2.svg' },
  { id: 'unico', name: 'Unico', colorClass: 'bg-red-500' },
  { id: 'pop', name: 'POP', colorClass: 'bg-pink-500' },
  { id: 'phoebus', name: 'Phoebus', colorClass: 'bg-purple-600' },
  { id: 'tonpay', name: 'TONpay', colorClass: 'bg-blue-500' },
  { id: 'pay-connect', name: 'Pay Connect', colorClass: 'bg-red-600' },
  { id: 'pit-stop', name: 'Pit Stop Pagamentos', colorClass: 'bg-blue-600' },
  { id: 'capfpay', name: 'CapfPay', colorClass: 'bg-teal-600' },
  { id: 'dinahpay', name: 'DinahPay', colorClass: 'bg-gray-700' },
  { id: 'stipix', name: 'STipix', colorClass: 'bg-green-600' },
  { id: 'debit-plus', name: 'Debit+', colorClass: 'bg-gray-700' },
  { id: 'itaubank', name: 'Itaubank', colorClass: 'bg-blue-700' },
  { id: 'sett-pay', name: 'Sett Pay', colorClass: 'bg-gray-700' },
  { id: 'paguvel', name: 'Paguvel', colorClass: 'bg-pink-500' },
  { id: 'supercard', name: 'SuperCard', colorClass: 'bg-green-500' },
  { id: 'mmoney-card', name: 'M Money Card', colorClass: 'bg-orange-500' },
  { id: 'just-pay', name: 'Just Pay', colorClass: 'bg-teal-500' },
  { id: 'pagseguro', name: 'Pagseguro', status: 'ativo', colorClass: 'bg-yellow-500', logoUrl: 'https://logodownload.org/wp-content/uploads/2018/05/pagseguro-logo.png' },
  { id: 'n3bank', name: 'N3bank', colorClass: 'bg-gray-700' },
  { id: 'lgpag', name: 'LGPag', colorClass: 'bg-green-700' },
  { id: 'paygolf', name: 'PayGolf', colorClass: 'bg-blue-500' },
  { id: 'omie', name: 'Omie', colorClass: 'bg-purple-600' },
  { id: 'payup', name: 'PayUp', colorClass: 'bg-gray-600' },
  { id: 'place-pay', name: 'Place Pay', colorClass: 'bg-blue-400' },
  { id: 'openpay', name: 'Openpay', colorClass: 'bg-purple-500' },
  { id: 'pipefy', name: 'Pipefy', colorClass: 'bg-gray-700', logoUrl: 'https://cdn.worldvectorlogo.com/logos/pipefy.svg' },
  { id: 'green-pay', name: 'Green Pay', colorClass: 'bg-green-600' },
  { id: 'pay-me', name: 'Pay-Me', colorClass: 'bg-pink-600' },
  { id: 'openpix', name: 'OpenPix', colorClass: 'bg-gray-800' },
  { id: 'cash-pay', name: 'Cash Pay', colorClass: 'bg-blue-500' },
  { id: 'onefy', name: 'Onefy', colorClass: 'bg-purple-600' },
  { id: 'centpay', name: 'CentPay', colorClass: 'bg-gray-700' },
  { id: 'tindin', name: 'Tindin', colorClass: 'bg-gray-700' },
  { id: 'vivo', name: 'Vivo', colorClass: 'bg-purple-700', logoUrl: 'https://logodownload.org/wp-content/uploads/2014/05/vivo-logo.png' },
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
          <Card key={gateway.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Logo do Gateway */}
                  <div className={`w-12 h-12 rounded ${gateway.colorClass} flex items-center justify-center flex-shrink-0`}>
                    {gateway.logoUrl ? (
                      <img 
                        src={gateway.logoUrl} 
                        alt={gateway.name}
                        className="w-8 h-8 object-contain"
                      />
                    ) : (
                      <span className="text-white font-bold text-lg">
                        {gateway.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-col">
                    <h3 className="font-medium text-gray-900 text-sm">{gateway.name}</h3>
                    {gateway.status === 'ativo' && (
                      <Badge variant="outline" className="text-xs mt-1 w-fit border-gray-300 text-gray-600">
                        Ativo
                      </Badge>
                    )}
                    {gateway.status === 'inativo' && (
                      <Badge variant="outline" className="text-xs mt-1 w-fit border-gray-300 text-gray-500">
                        Inativo
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Botão Download */}
                {gateway.status === 'download' && (
                  <Button
                    size="sm"
                    className="bg-pink-600 hover:bg-pink-700 text-white text-xs px-3 py-1 h-auto rounded"
                  >
                    BAIXAR AGORA
                  </Button>
                )}
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
