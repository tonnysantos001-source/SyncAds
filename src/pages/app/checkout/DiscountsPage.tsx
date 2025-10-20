import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const DiscountsPage: React.FC = () => {
  const [discounts, setDiscounts] = useState({
    creditCard: '',
    pix: '',
    bankSlip: '',
  });

  const handleSave = () => {
    console.log('Salvando descontos:', discounts);
    // Aqui você implementaria a lógica de salvar
  };

  const handleCancel = () => {
    setDiscounts({
      creditCard: '',
      pix: '',
      bankSlip: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">DESCONTO POR FORMA DE PAGAMENTO</h1>
        <p className="text-gray-600 mt-1">
          Ofereça descontos por forma de pagamento.
        </p>
      </div>

      {/* Card com formulário */}
      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Cartão de crédito */}
          <div>
            <Label htmlFor="creditCard" className="text-sm font-medium text-gray-700 mb-2 block">
              Cartão de crédito
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="creditCard"
                type="number"
                placeholder="0"
                value={discounts.creditCard}
                onChange={(e) => setDiscounts({ ...discounts, creditCard: e.target.value })}
                className="flex-1"
                min="0"
                max="100"
              />
              <span className="text-gray-500 font-medium">%</span>
            </div>
          </div>

          {/* Pix */}
          <div>
            <Label htmlFor="pix" className="text-sm font-medium text-gray-700 mb-2 block">
              Pix
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="pix"
                type="number"
                placeholder="0"
                value={discounts.pix}
                onChange={(e) => setDiscounts({ ...discounts, pix: e.target.value })}
                className="flex-1"
                min="0"
                max="100"
              />
              <span className="text-gray-500 font-medium">%</span>
            </div>
          </div>

          {/* Boleto bancário */}
          <div>
            <Label htmlFor="bankSlip" className="text-sm font-medium text-gray-700 mb-2 block">
              Boleto bancário
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="bankSlip"
                type="number"
                placeholder="0"
                value={discounts.bankSlip}
                onChange={(e) => setDiscounts({ ...discounts, bankSlip: e.target.value })}
                className="flex-1"
                min="0"
                max="100"
              />
              <span className="text-gray-500 font-medium">%</span>
            </div>
          </div>

          {/* Alert de ajuda */}
          <Alert className="border-pink-200 bg-pink-50">
            <AlertCircle className="h-4 w-4 text-pink-600" />
            <AlertDescription className="text-pink-900">
              Está com dúvidas?{' '}
              <a
                href="#"
                className="font-medium underline hover:no-underline"
              >
                Aprenda como criar um desconto por forma de pagamento
              </a>
            </AlertDescription>
          </Alert>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              onClick={handleCancel}
              variant="outline"
              className="px-6"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              className="bg-pink-600 hover:bg-pink-700 text-white px-6"
            >
              Salvar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DiscountsPage;
