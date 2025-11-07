import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Truck, Plus, Package, MapPin, Clock, DollarSign, Edit, Trash2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export const LogisticsTab: React.FC = () => {
  const [shippingMethods, setShippingMethods] = useState([
    {
      id: '1',
      name: 'Correios - PAC',
      carrier: 'Correios',
      estimatedDays: '10-15',
      price: 15.50,
      freeShippingFrom: 100,
      active: true,
    },
    {
      id: '2',
      name: 'Correios - SEDEX',
      carrier: 'Correios',
      estimatedDays: '3-5',
      price: 25.00,
      freeShippingFrom: 200,
      active: true,
    },
    {
      id: '3',
      name: 'Entrega Local',
      carrier: 'Própria',
      estimatedDays: '1-2',
      price: 10.00,
      freeShippingFrom: 50,
      active: true,
    },
  ]);

  const [newMethod, setNewMethod] = useState({
    name: '',
    carrier: '',
    estimatedDays: '',
    price: '',
    freeShippingFrom: '',
  });

  const handleAddMethod = () => {
    if (!newMethod.name || !newMethod.carrier) return;

    const method = {
      id: Date.now().toString(),
      name: newMethod.name,
      carrier: newMethod.carrier,
      estimatedDays: newMethod.estimatedDays,
      price: parseFloat(newMethod.price) || 0,
      freeShippingFrom: parseFloat(newMethod.freeShippingFrom) || 0,
      active: true,
    };

    setShippingMethods([...shippingMethods, method]);
    setNewMethod({
      name: '',
      carrier: '',
      estimatedDays: '',
      price: '',
      freeShippingFrom: '',
    });
  };

  const handleToggleActive = (id: string) => {
    setShippingMethods(
      shippingMethods.map((m) =>
        m.id === id ? { ...m, active: !m.active } : m
      )
    );
  };

  const handleDelete = (id: string) => {
    setShippingMethods(shippingMethods.filter((m) => m.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Info Alert */}
      <Alert>
        <Truck className="h-4 w-4" />
        <AlertTitle>Configuração de Logística</AlertTitle>
        <AlertDescription>
          Configure os métodos de envio disponíveis para seus clientes. Você pode adicionar frete grátis acima de um valor específico.
        </AlertDescription>
      </Alert>

      {/* Add New Shipping Method */}
      <Card>
        <CardHeader>
          <CardTitle>Adicionar Método de Envio</CardTitle>
          <CardDescription>Configure um novo método de entrega</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="name">Nome do Método</Label>
              <Input
                id="name"
                placeholder="Ex: Correios - PAC"
                value={newMethod.name}
                onChange={(e) => setNewMethod({ ...newMethod, name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="carrier">Transportadora</Label>
              <Select value={newMethod.carrier} onValueChange={(value) => setNewMethod({ ...newMethod, carrier: value })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Correios">Correios</SelectItem>
                  <SelectItem value="Jadlog">Jadlog</SelectItem>
                  <SelectItem value="Total Express">Total Express</SelectItem>
                  <SelectItem value="Loggi">Loggi</SelectItem>
                  <SelectItem value="Própria">Entrega Própria</SelectItem>
                  <SelectItem value="Outra">Outra</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="estimatedDays">Prazo (dias)</Label>
              <Input
                id="estimatedDays"
                placeholder="Ex: 5-10"
                value={newMethod.estimatedDays}
                onChange={(e) => setNewMethod({ ...newMethod, estimatedDays: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="price">Preço (R$)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={newMethod.price}
                onChange={(e) => setNewMethod({ ...newMethod, price: e.target.value })}
                className="mt-1"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="freeShippingFrom">Frete Grátis a partir de (R$)</Label>
              <Input
                id="freeShippingFrom"
                type="number"
                step="0.01"
                placeholder="0.00 (deixe em branco para não oferecer)"
                value={newMethod.freeShippingFrom}
                onChange={(e) => setNewMethod({ ...newMethod, freeShippingFrom: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleAddMethod} className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Método
          </Button>
        </CardFooter>
      </Card>

      {/* Shipping Methods List */}
      <Card>
        <CardHeader>
          <CardTitle>Métodos de Envio Configurados</CardTitle>
          <CardDescription>Gerencie os métodos de entrega disponíveis</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Método</TableHead>
                <TableHead>Transportadora</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Frete Grátis</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shippingMethods.length > 0 ? (
                shippingMethods.map((method) => (
                  <TableRow key={method.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        {method.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{method.carrier}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {method.estimatedDays} dias
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-muted-foreground" />
                        R$ {method.price.toFixed(2)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {method.freeShippingFrom > 0 ? (
                        <span className="text-sm text-green-600">
                          Acima de R$ {method.freeShippingFrom.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Não oferece</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={method.active}
                        onCheckedChange={() => handleToggleActive(method.id)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(method.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    Nenhum método de envio configurado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Additional Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações Adicionais</CardTitle>
          <CardDescription>Outras opções de logística</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Calcular frete automaticamente</Label>
              <p className="text-sm text-muted-foreground">
                Integrar com API dos Correios para cálculo em tempo real
              </p>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Permitir retirada na loja</Label>
              <p className="text-sm text-muted-foreground">
                Cliente pode optar por retirar o pedido pessoalmente
              </p>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Rastreamento de pedidos</Label>
              <p className="text-sm text-muted-foreground">
                Enviar código de rastreamento para os clientes
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="space-y-2">
            <Label htmlFor="origin-zip">CEP de Origem</Label>
            <Input
              id="origin-zip"
              placeholder="00000-000"
              maxLength={9}
              className="max-w-xs"
            />
            <p className="text-sm text-muted-foreground">
              CEP de onde os produtos serão enviados
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
