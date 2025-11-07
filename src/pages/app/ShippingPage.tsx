import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  type: 'FIXED' | 'WEIGHT_BASED' | 'PRICE_BASED' | 'LOCAL_PICKUP';
  basePrice: number;
  pricePerUnit: number;
  estimatedDays: number;
  isActive: boolean;
  isDefault: boolean;
  userId: string;
}

export default function ShippingPage() {
  const { toast } = useToast();
  const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState<ShippingMethod | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'FIXED' as const,
    basePrice: 0,
    pricePerUnit: 0,
    estimatedDays: 5,
    isActive: true,
    isDefault: false
  });

  useEffect(() => {
    loadMethods();
  }, []);

  const loadMethods = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // ✅ SISTEMA SIMPLIFICADO: Buscar por userId
      const { data, error } = await supabase
        .from('ShippingMethod')
        .select('*')
        .eq('userId', user.id)
        .order('createdAt', { ascending: false });

      if (error) throw error;

      setMethods(data || []);
    } catch (error) {
      console.error('Erro ao carregar métodos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os métodos de frete',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // ✅ SISTEMA SIMPLIFICADO: Sem organizationId
      if (editingMethod) {
        // Atualizar
        const { error } = await supabase
          .from('ShippingMethod')
          .update(formData)
          .eq('id', editingMethod.id);

        if (error) throw error;

        toast({
          title: 'Método atualizado',
          description: 'O método de frete foi atualizado com sucesso'
        });
      } else {
        // Criar
        const { error } = await supabase
          .from('ShippingMethod')
          .insert({
            ...formData,
            userId: user.id
          });

        if (error) throw error;

        toast({
          title: 'Método criado',
          description: 'O método de frete foi criado com sucesso'
        });
      }

      await loadMethods();
      setShowModal(false);
      setEditingMethod(null);
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar método:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o método de frete',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este método?')) return;

    try {
      const { error } = await supabase
        .from('ShippingMethod')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Método excluído',
        description: 'O método de frete foi excluído com sucesso'
      });

      await loadMethods();
    } catch (error) {
      console.error('Erro ao excluir método:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o método de frete',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'FIXED',
      basePrice: 0,
      pricePerUnit: 0,
      estimatedDays: 5,
      isActive: true,
      isDefault: false
    });
    setEditingMethod(null);
  };

  const openEditModal = (method: ShippingMethod) => {
    setEditingMethod(method);
    setFormData({
      name: method.name,
      description: method.description || '',
      type: method.type,
      basePrice: method.basePrice,
      pricePerUnit: method.pricePerUnit,
      estimatedDays: method.estimatedDays,
      isActive: method.isActive,
      isDefault: method.isDefault
    });
    setShowModal(true);
  };

  const toggleActive = async (method: ShippingMethod) => {
    try {
      const { error } = await supabase
        .from('ShippingMethod')
        .update({ isActive: !method.isActive })
        .eq('id', method.id);

      if (error) throw error;

      await loadMethods();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar o status do método',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div>
      <div className="p-6 sm:p-8 max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white dark:text-white">Frete e Entrega</h1>
            <p className="text-gray-600 dark:text-gray-300 dark:text-gray-400 mt-1">
              Configure os métodos de entrega disponíveis no seu checkout
            </p>
          </div>
          <Dialog open={showModal} onOpenChange={setShowModal}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="bg-pink-600 hover:bg-pink-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo método
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingMethod ? 'Editar Método de Frete' : 'Novo Método de Frete'}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome do método *</Label>
                  <Input
                    placeholder="Ex: Correios PAC"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input
                    placeholder="Ex: Entrega em 5 a 7 dias úteis"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tipo de frete *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FIXED">Fixo</SelectItem>
                      <SelectItem value="WEIGHT_BASED">Por peso</SelectItem>
                      <SelectItem value="PRICE_BASED">Por valor</SelectItem>
                      <SelectItem value="LOCAL_PICKUP">Retirada local</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Preço base (R$) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.basePrice}
                      onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Prazo (dias) *</Label>
                    <Input
                      type="number"
                      value={formData.estimatedDays}
                      onChange={(e) => setFormData({ ...formData, estimatedDays: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                {formData.type !== 'FIXED' && (
                  <div className="space-y-2">
                    <Label>Preço por unidade (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.pricePerUnit}
                      onChange={(e) => setFormData({ ...formData, pricePerUnit: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 bg-pink-600 hover:bg-pink-700"
                  onClick={handleSave}
                  disabled={!formData.name}
                >
                  {editingMethod ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Lista de métodos */}
        {methods.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-600 dark:text-gray-300 dark:text-gray-400 mb-4">
                Você ainda não tem métodos de frete configurados.
              </p>
              <Button
                onClick={() => setShowModal(true)}
                className="bg-pink-600 hover:bg-pink-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar primeiro método
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {methods.map((method) => (
                  <TableRow key={method.id}>
                    <TableCell className="font-medium">{method.name}</TableCell>
                    <TableCell>{method.type}</TableCell>
                    <TableCell>R$ {method.basePrice.toFixed(2)}</TableCell>
                    <TableCell>{method.estimatedDays} dias</TableCell>
                    <TableCell>
                      <Badge variant={method.isActive ? 'default' : 'secondary'}>
                        {method.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleActive(method)}
                        >
                          {method.isActive ? 'Desativar' : 'Ativar'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(method)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(method.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </div>
  );
}

