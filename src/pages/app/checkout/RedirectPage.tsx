import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const RedirectPage: React.FC = () => {
  const [urls, setUrls] = useState({
    cartao: '',
    boleto: '',
    pix: '',
  });

  const handleSave = () => {
    console.log('Salvando URLs:', urls);
    // Aqui você implementaria a lógica de salvar
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">REDIRECIONAMENTO</h1>
        <p className="text-gray-600 mt-2">
          Redirecione seus compradores para uma página personalizada.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>URLs de Redirecionamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Cartão */}
          <div>
            <Label htmlFor="cartao" className="text-base font-medium">
              Cartão
            </Label>
            <Input
              id="cartao"
              type="url"
              placeholder="https://"
              value={urls.cartao}
              onChange={(e) => setUrls({ ...urls, cartao: e.target.value })}
              className="mt-2"
            />
          </div>

          {/* Boleto */}
          <div>
            <Label htmlFor="boleto" className="text-base font-medium">
              Boleto
            </Label>
            <Input
              id="boleto"
              type="url"
              placeholder="https://"
              value={urls.boleto}
              onChange={(e) => setUrls({ ...urls, boleto: e.target.value })}
              className="mt-2"
            />
          </div>

          {/* Pix */}
          <div>
            <Label htmlFor="pix" className="text-base font-medium">
              Pix
            </Label>
            <Input
              id="pix"
              type="url"
              placeholder="https://"
              value={urls.pix}
              onChange={(e) => setUrls({ ...urls, pix: e.target.value })}
              className="mt-2"
            />
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
                Aprenda com o nosso redirecionamento.
              </a>
            </AlertDescription>
          </Alert>

          {/* Botão Salvar */}
          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSave}
              className="bg-pink-600 hover:bg-pink-700 text-white px-8"
            >
              Salvar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RedirectPage;
