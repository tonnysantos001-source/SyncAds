import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Edit, Trash2, ShoppingCart, Percent } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { marketingApi } from '@/lib/api/marketingApi';
import { productsApi } from '@/lib/api/productsApi';
import { useAuthStore } from '@/store/authStore';
import { Skeleton } from '@/components/ui/skeleton';

const CrossSellPage = () => {
  const [crossSells, setCrossSells] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCrossSell, setEditingCrossSell] = useState<any | null>(null);
  const { toast } = useToast();
  const user = useAuthStore((state) => state.user);

  const [formData, setFormData] = useState({
    name: '',
    triggerProductId: '',
    suggestedProductIds: [] as string[],
    discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED_AMOUNT',
    discountValue: 0,
    isActive: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      if (!user?.organizationId) return;
      const [crossSellsData, productsData] = await Promise.all([
        marketingApi.crossSells.getAll(user.organizationId),
        productsApi.list(),
      ]);
      setCrossSells(crossSellsData);
      setProducts(productsData);
    } catch (error: any) {
      toast({ title: 'Erro ao carregar', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!user?.organizationId) return;
      
      if (editingCrossSell) {
        await marketingApi.crossSells.update(editingCrossSell.id, formData);
        toast({ title: 'Cross-sell atualizado!' });
      } else {
        await marketingApi.crossSells.create({
          ...formData,
          organizationId: user.organizationId,
        });
        toast({ title: 'Cross-sell criado!', description: 'Configure produtos sugeridos para aumentar as vendas.' });
      }
      
      setIsDialogOpen(false);
      resetForm();
      loadData();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este cross-sell?')) return;
    try {
      await marketingApi.crossSells.delete(id);
      toast({ title: 'Cross-sell deletado' });
      loadData();
    } catch (error: any) {
      toast({ title: 'Erro ao deletar', description: error.message, variant: 'destructive' });
    }
  };

  const handleEdit = (crossSell: any) => {
    setEditingCrossSell(crossSell);
    setFormData({
      name: crossSell.name || '',
      triggerProductId: crossSell.triggerProductId || '',
      suggestedProductIds: crossSell.suggestedProductIds || [],
      discountType: crossSell.discountType || 'PERCENTAGE',
      discountValue: crossSell.discountValue || 0,
      isActive: crossSell.isActive ?? true,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingCrossSell(null);
    setFormData({
      name: '',
      triggerProductId: '',
      suggestedProductIds: [],
      discountType: 'PERCENTAGE',
      discountValue: 0,
      isActive: true,
    });
  };

  const getTriggerProductName = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    return product?.name || 'Produto não encontrado';
  };

  const filteredCrossSells = crossSells.filter((cs) =>
    cs.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCrossSells = crossSells.filter((cs) => cs.isActive).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cross-Sell</h1>
          <p className="text-muted-foreground">Sugira produtos complementares e aumente o ticket médio</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />Criar Cross-Sell
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingCrossSell ? 'Editar Cross-Sell' : 'Novo Cross-Sell'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <Label>Nome da Campanha</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Combo Produto + Acessório"
                    required
                  />
                </div>

                <div>
                  <Label>Produto Gatilho</Label>
                  <Select
                    value={formData.triggerProductId}
                    onValueChange={(v) => setFormData({ ...formData, triggerProductId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o produto que ativa a sugestão" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Quando este produto for adicionado ao carrinho, os produtos sugeridos aparecerão
                  </p>
                </div>

                <div>
                  <Label>Produtos Sugeridos (IDs separados por vírgula)</Label>
                  <Textarea
                    value={formData.suggestedProductIds.join(', ')}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        suggestedProductIds: e.target.value.split(',').map((id) => id.trim()).filter(Boolean),
                      })
                    }
                    placeholder="Ex: prod-123, prod-456"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Digite os IDs dos produtos que serão sugeridos como complementares
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tipo de Desconto</Label>
                    <Select
                      value={formData.discountType}
                      onValueChange={(v: any) => setFormData({ ...formData, discountType: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PERCENTAGE">Percentual (%)</SelectItem>
                        <SelectItem value="FIXED_AMOUNT">Valor Fixo (R$)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Valor do Desconto</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.discountValue}
                      onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 })}
                      placeholder={formData.discountType === 'PERCENTAGE' ? '10' : '50.00'}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="isActive" className="cursor-pointer">
                    Ativo
                  </Label>
                </div>
              </div>

              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">{editingCrossSell ? 'Atualizar' : 'Criar'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Cross-Sells</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{crossSells.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCrossSells}</div>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar cross-sells..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Cross-Sells</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : filteredCrossSells.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4 mx-auto" />
              <h3 className="text-lg font-semibold">Nenhum cross-sell encontrado</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Comece criando o primeiro cross-sell para aumentar suas vendas
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Cross-Sell
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Produto Gatilho</TableHead>
                  <TableHead>Desconto</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCrossSells.map((crossSell) => (
                  <TableRow key={crossSell.id}>
                    <TableCell className="font-medium">{crossSell.name}</TableCell>
                    <TableCell className="text-sm">{getTriggerProductName(crossSell.triggerProductId)}</TableCell>
                    <TableCell>
                      {crossSell.discountType === 'PERCENTAGE'
                        ? `${crossSell.discountValue}%`
                        : `R$ ${crossSell.discountValue?.toFixed(2)}`}
                    </TableCell>
                    <TableCell>
                      <Badge variant={crossSell.isActive ? 'default' : 'secondary'}>
                        {crossSell.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(crossSell)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(crossSell.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CrossSellPage;
